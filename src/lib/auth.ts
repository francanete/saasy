import { betterAuth } from "better-auth";
import { magicLink } from "better-auth/plugins/magic-link";
import { organization } from "better-auth/plugins/organization";
import { APIError } from "better-auth/api";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { polar, portal, webhooks } from "@polar-sh/better-auth";
import { polarClient } from "./polar-client";
import { eq } from "drizzle-orm";
import { db, users, subscriptions, members } from "./db";
import * as schema from "./db/schema";
import { sendEmail } from "./email";
import { appConfig } from "./config";
import {
  upsertSubscription,
  updateSubscriptionStatus,
  mapPolarStatus,
  getSubscriptionStatus,
} from "./subscription";
import { inngest } from "./inngest/client";
import { trackEvent, trackRevenue } from "./openpanel";
import { getPlanFromPolarProduct } from "./config";

/**
 * Update Polar customer with our internal userId as externalId.
 * This ensures future webhook events have the correct externalId.
 */
async function updatePolarCustomerExternalId(
  polarCustomerId: string,
  userId: string
): Promise<void> {
  try {
    await polarClient.customers.update({
      id: polarCustomerId,
      customerUpdate: { externalId: userId },
    });
  } catch (error) {
    console.error(
      `Failed to update Polar customer ${polarCustomerId} with externalId:`,
      error
    );
    // Don't throw - the subscription was still created successfully
  }
}

/**
 * Resolve or create user from Polar customer data.
 * Used by webhooks to handle guest checkout flow.
 *
 * Priority:
 * 1. Use externalId if set (existing user went through our checkout)
 * 2. Look up by email (user might exist from previous signup)
 * 3. Create new user (guest checkout - first time purchase)
 */
async function resolveOrCreateUser(customer: {
  id: string; // Polar customer ID
  externalId?: string | null;
  email: string;
  name?: string | null;
}): Promise<string> {
  // Validate email
  if (!customer.email?.includes("@")) {
    throw new Error(
      `Polar webhook: Invalid or missing customer email for customer ${customer.id}`
    );
  }

  // 1. Use externalId if set (existing user went through our checkout)
  if (customer.externalId) {
    return customer.externalId;
  }

  // 2. Look up by email (user might exist from previous signup)
  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, customer.email),
    columns: { id: true },
  });

  if (existingUser) {
    // Update Polar customer with our userId for future syncs
    await updatePolarCustomerExternalId(customer.id, existingUser.id);
    return existingUser.id;
  }

  // 3. Create new user from Polar customer data (guest checkout)
  const [newUser] = await db
    .insert(users)
    .values({
      email: customer.email,
      name: customer.name || null,
      emailVerified: false,
    })
    .returning({ id: users.id });

  // Create FREE subscription record (will be upgraded by webhook upsert)
  await db
    .insert(subscriptions)
    .values({
      userId: newUser.id,
      plan: "FREE",
      status: "ACTIVE",
      billingType: "none",
    })
    .onConflictDoNothing();

  // Update Polar customer with our userId for future syncs
  await updatePolarCustomerExternalId(customer.id, newUser.id);

  // Send event to trigger account setup email
  await inngest.send({
    name: "user/paid-signup",
    data: {
      userId: newUser.id,
      email: customer.email,
      name: customer.name || null,
    },
  });

  return newUser.id;
}

async function grantNativeTrial(userId: string): Promise<void> {
  if (!appConfig.pricing.allowNativeTrial) {
    return;
  }

  const existing = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, userId),
    columns: { plan: true, nativeTrialEndsAt: true },
  });

  if (existing?.nativeTrialEndsAt || (existing && existing.plan !== "FREE")) {
    return;
  }

  const now = new Date();
  const trialEndsAt = new Date(
    now.getTime() + appConfig.pricing.nativeTrialDays * 24 * 60 * 60 * 1000
  );

  await db
    .insert(subscriptions)
    .values({
      userId,
      plan: "STARTER",
      billingType: "none",
      status: "ACTIVE",
      nativeTrialStartedAt: now,
      nativeTrialEndsAt: trialEndsAt,
    })
    .onConflictDoUpdate({
      target: subscriptions.userId,
      set: {
        plan: "STARTER",
        billingType: "none",
        status: "ACTIVE",
        nativeTrialStartedAt: now,
        nativeTrialEndsAt: trialEndsAt,
        updatedAt: now,
      },
    });
}

function hasOwnerRole(role: string): boolean {
  return role.split(",").some((part) => part.trim() === "owner");
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
    usePlural: true,
  }),
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      enabled: !!process.env.GOOGLE_CLIENT_ID,
    },
  },
  plugins: [
    organization({
      // Billing is still owned by the original user. Keep that owner and the
      // organization in place until an explicit billing transfer/delete flow exists.
      disableOrganizationDeletion: true,
      allowUserToCreateOrganization: async (user) => {
        const membership = await db.query.members.findFirst({
          where: eq(members.userId, user.id),
          columns: { id: true },
        });
        return !membership;
      },
      async sendInvitationEmail({ id, email }) {
        const invitationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invitations/${encodeURIComponent(id)}`;
        await sendEmail({
          to: email,
          subject: `Invitation to join a ${appConfig.name} organization`,
          html: `<p>You have been invited to join an organization on ${appConfig.name}.</p><p><a href="${invitationUrl}">Accept invitation</a></p>`,
        });
      },
      organizationHooks: {
        beforeCreateInvitation: async ({ invitation }) => {
          if (hasOwnerRole(invitation.role)) {
            throw new APIError("BAD_REQUEST", {
              message: "Owner invitations are not supported",
            });
          }
        },
        beforeUpdateMemberRole: async ({ member, newRole }) => {
          if (hasOwnerRole(member.role) || hasOwnerRole(newRole)) {
            throw new APIError("BAD_REQUEST", {
              message: "Owner transfers are not supported",
            });
          }
        },
        beforeRemoveMember: async ({ member }) => {
          if (hasOwnerRole(member.role)) {
            throw new APIError("BAD_REQUEST", {
              message: "The organization owner cannot be removed",
            });
          }
        },
        afterCreateOrganization: async ({ organization: created, user }) => {
          await getSubscriptionStatus(user.id);
          await grantNativeTrial(user.id);
          await db
            .update(subscriptions)
            .set({ organizationId: created.id })
            .where(eq(subscriptions.userId, user.id));
        },
        beforeAcceptInvitation: async ({ invitation, user }) => {
          if (invitation.role && hasOwnerRole(invitation.role)) {
            throw new APIError("BAD_REQUEST", {
              message: "Owner invitations are not supported",
            });
          }
          const membership = await db.query.members.findFirst({
            where: eq(members.userId, user.id),
            columns: { id: true },
          });
          if (membership) {
            throw new APIError("BAD_REQUEST", {
              message: "This account already belongs to an organization",
            });
          }
        },
      },
    }),
    magicLink({
      sendMagicLink: async ({ email, url }: { email: string; url: string }) => {
        await sendEmail({
          to: email,
          subject: `Sign in to ${appConfig.name}`,
          html: `
            <h1>Sign in to ${appConfig.name}</h1>
            <p>Click the link below to sign in:</p>
            <p><a href="${url}">Sign In</a></p>
            <p>This link expires in 5 minutes.</p>
            <p>If you didn't request this, ignore this email.</p>
          `,
        });
      },
      expiresIn: 60 * 5,
      disableSignUp: false,
    }),
    // Polar integration with dynamic products based on pricing mode
    polar({
      client: polarClient,
      createCustomerOnSignUp: true,
      use: [
        portal(),
        webhooks({
          secret: process.env.POLAR_WEBHOOK_SECRET!,

          // One-time purchase (LTD)
          onOrderPaid: async (payload) => {
            const order = payload.data;
            const customer = order.customer;
            const product = order.product;

            // Skip if this order is part of a subscription (e.g., trial or recurring charge)
            // Let subscription webhooks handle these instead
            if (order.subscriptionId) {
              console.log(
                `Polar webhook: Skipping order ${order.id} - belongs to subscription ${order.subscriptionId}`
              );
              return;
            }

            if (!product) {
              // Throw error to trigger Polar webhook retry - user paid but we can't process
              throw new Error(
                `Polar webhook: No product on order ${order.id} - cannot grant access`
              );
            }

            // Resolve or create user (handles guest checkout)
            const userId = await resolveOrCreateUser({
              id: customer.id,
              externalId: customer.externalId,
              email: customer.email,
              name: customer.name,
            });

            await upsertSubscription({
              userId,
              polarCustomerId: customer.id,
              polarOrderId: order.id,
              polarProductId: product.id,
              billingType: "one_time",
              status: "ACTIVE",
            });

            await trackRevenue(order.totalAmount / 100, {
              profileId: userId,
              plan: getPlanFromPolarProduct(product.id),
              billingType: "one_time",
            });
          },

          // New recurring subscription
          onSubscriptionCreated: async (payload) => {
            const subscription = payload.data;
            const customer = subscription.customer;
            const product = subscription.product;

            if (!product) {
              // Throw error to trigger Polar webhook retry - user subscribed but we can't process
              throw new Error(
                `Polar webhook: No product on subscription ${subscription.id} - cannot grant access`
              );
            }

            // Resolve or create user (handles guest checkout)
            const userId = await resolveOrCreateUser({
              id: customer.id,
              externalId: customer.externalId,
              email: customer.email,
              name: customer.name,
            });

            await upsertSubscription({
              userId,
              polarCustomerId: customer.id,
              polarSubscriptionId: subscription.id,
              polarProductId: product.id,
              billingType: "recurring",
              status: mapPolarStatus(subscription.status),
              currentPeriodEnd: subscription.currentPeriodEnd
                ? new Date(subscription.currentPeriodEnd)
                : undefined,
              cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
            });

            await trackEvent("subscription_created", {
              profileId: userId,
              plan: getPlanFromPolarProduct(product.id),
              billingType: "recurring",
              status: mapPolarStatus(subscription.status),
            });
          },

          // Subscription status/period changes
          onSubscriptionUpdated: async (payload) => {
            const subscription = payload.data;

            await updateSubscriptionStatus({
              polarSubscriptionId: subscription.id,
              status: mapPolarStatus(subscription.status),
              currentPeriodEnd: subscription.currentPeriodEnd
                ? new Date(subscription.currentPeriodEnd)
                : undefined,
              cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
            });

            try {
              const record = await db.query.subscriptions.findFirst({
                where: eq(subscriptions.polarSubscriptionId, subscription.id),
                columns: { userId: true, plan: true },
              });
              if (record) {
                await trackEvent("subscription_updated", {
                  profileId: record.userId,
                  plan: record.plan,
                  status: mapPolarStatus(subscription.status),
                });
              }
            } catch {}
          },

          // Subscription canceled
          onSubscriptionCanceled: async (payload) => {
            const subscription = payload.data;

            await updateSubscriptionStatus({
              polarSubscriptionId: subscription.id,
              status: "CANCELED",
            });

            try {
              const record = await db.query.subscriptions.findFirst({
                where: eq(subscriptions.polarSubscriptionId, subscription.id),
                columns: { userId: true, plan: true },
              });
              if (record) {
                await trackEvent("subscription_canceled", {
                  profileId: record.userId,
                  plan: record.plan,
                });
              }
            } catch {}
          },
        }),
      ],
    }),
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },
  baseURL: process.env.NEXT_PUBLIC_APP_URL,

  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          await grantNativeTrial(user.id);
          await inngest.send({
            name: "user/created",
            data: {
              userId: user.id,
              email: user.email,
            },
          });
        },
      },
    },
  },
});

export type Session = typeof auth.$Infer.Session;
