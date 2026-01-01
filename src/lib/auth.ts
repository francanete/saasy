import { betterAuth } from "better-auth";
import { createAuthMiddleware } from "better-auth/api";
import { magicLink } from "better-auth/plugins/magic-link";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { polar, checkout, portal, webhooks } from "@polar-sh/better-auth";
import { Polar } from "@polar-sh/sdk";
import { eq } from "drizzle-orm";
import { db, users } from "./db";
import * as schema from "./db/schema";
import { sendEmail } from "./email";
import { appConfig } from "./config";
import { getPolarProducts } from "./pricing";
import {
  upsertSubscription,
  updateSubscriptionStatus,
  mapPolarStatus,
} from "./subscription";
import { inngest } from "./inngest/client";

// Helper to resolve user ID from Polar customer
// Handles race condition where external_id may not be set yet
async function resolveUserId(customer: {
  externalId?: string | null;
  email: string;
}): Promise<string | null> {
  if (customer.externalId) {
    return customer.externalId;
  }

  // Fallback: look up user by email
  const user = await db.query.users.findFirst({
    where: eq(users.email, customer.email),
    columns: { id: true },
  });

  return user?.id ?? null;
}

const polarClient = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN!,
  server: process.env.NODE_ENV === "production" ? "production" : "sandbox",
});

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
        checkout({
          products: getPolarProducts(),
          successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?checkout=success`,
          authenticatedUsersOnly: true,
        }),
        portal(),
        webhooks({
          secret: process.env.POLAR_WEBHOOK_SECRET!,

          // One-time purchase (LTD)
          onOrderPaid: async (payload) => {
            const order = payload.data;
            const customer = order.customer;
            const product = order.product;

            const userId = await resolveUserId(customer);
            if (!userId) {
              console.error(
                "Polar webhook: Cannot resolve user for customer",
                customer.id,
                customer.email
              );
              return;
            }

            if (!product) {
              console.error("Polar webhook: No product on order", order.id);
              return;
            }

            await upsertSubscription({
              userId,
              polarCustomerId: customer.id,
              polarOrderId: order.id,
              polarProductId: product.id,
              billingType: "one_time",
              status: "ACTIVE",
            });
          },

          // New recurring subscription
          onSubscriptionCreated: async (payload) => {
            const subscription = payload.data;
            const customer = subscription.customer;
            const product = subscription.product;

            const userId = await resolveUserId(customer);
            if (!userId) {
              console.error(
                "Polar webhook: Cannot resolve user for customer",
                customer.id,
                customer.email
              );
              return;
            }

            if (!product) {
              console.error(
                "Polar webhook: No product on subscription",
                subscription.id
              );
              return;
            }

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
          },

          // Subscription canceled
          onSubscriptionCanceled: async (payload) => {
            const subscription = payload.data;

            await updateSubscriptionStatus({
              polarSubscriptionId: subscription.id,
              status: "CANCELED",
            });
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

  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      // Trigger welcome email on new user signup
      // Paths: /sign-up (email), /callback/* (OAuth), /magic-link/verify (magic link)
      const isSignupPath =
        ctx.path.startsWith("/sign-up") ||
        ctx.path.startsWith("/callback") ||
        ctx.path.startsWith("/magic-link/verify");

      if (isSignupPath) {
        const newSession = ctx.context.newSession;
        if (newSession) {
          await inngest.send({
            name: "user/created",
            data: {
              userId: newSession.user.id,
              email: newSession.user.email,
            },
          });
        }
      }
    }),
  },
});

export type Session = typeof auth.$Infer.Session;
