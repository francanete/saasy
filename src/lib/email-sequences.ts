import { db } from "./db";
import { users, emailsSent } from "./db/schema";
import { eq, and } from "drizzle-orm";
import { sendEmail } from "./email";
import { appConfig } from "./config";

// ============ Types ============

type SendSequenceEmailParams = {
  userId: string;
  email: string;
  name: string | null;
  emailKey: string;
};

type SendTransactionalEmailParams = {
  userId: string;
  email: string;
  name: string | null;
  emailKey: string;
  /** Additional template data (plan name, dates, prices, etc.) */
  templateData?: Record<string, string>;
};

type SendResult = {
  sent: boolean;
  reason?:
    | "already_sent"
    | "unsubscribed"
    | "user_not_found"
    | "unknown_template";
};

// ============ Email Templates ============

const emailTemplates = {
  welcome_instant: ({ name }: { name: string }) => ({
    subject: `Welcome to ${appConfig.name}!`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #111; font-size: 24px; margin-bottom: 16px;">Welcome, ${name}!</h1>
        <p style="color: #333; font-size: 16px; line-height: 1.6;">
          Thanks for signing up for ${appConfig.name}. We're excited to have you on board!
        </p>
        <p style="color: #333; font-size: 16px; line-height: 1.6;">
          Here's what you can do to get started:
        </p>
        <ul style="color: #333; font-size: 16px; line-height: 1.8;">
          <li>Explore your dashboard</li>
          <li>Set up your first project</li>
          <li>Check out our documentation</li>
        </ul>
        <p style="margin: 32px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard"
             style="display: inline-block; padding: 14px 28px; background: #000; color: #fff; text-decoration: none; border-radius: 6px; font-weight: 500;">
            Go to Dashboard
          </a>
        </p>
        <p style="color: #666; font-size: 14px; margin-top: 32px;">
          If you have any questions, just reply to this email. We're here to help!
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
        <p style="color: #999; font-size: 12px;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/api/unsubscribe?email={{email}}" style="color: #999;">
            Unsubscribe from marketing emails
          </a>
        </p>
      </div>
    `,
  }),

  welcome_day3: ({ name }: { name: string }) => ({
    subject: `How's it going, ${name}?`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #111; font-size: 24px; margin-bottom: 16px;">How's it going?</h1>
        <p style="color: #333; font-size: 16px; line-height: 1.6;">
          You've been with us for a few days now. We wanted to check in and see how things are going!
        </p>
        <p style="color: #333; font-size: 16px; line-height: 1.6;">
          Need help getting started? Here are some resources:
        </p>
        <ul style="color: #333; font-size: 16px; line-height: 1.8;">
          <li><a href="${process.env.NEXT_PUBLIC_APP_URL}/docs" style="color: #0066cc;">Documentation</a></li>
          <li><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="color: #0066cc;">Your Dashboard</a></li>
        </ul>
        <p style="color: #333; font-size: 16px; line-height: 1.6; margin-top: 24px;">
          Have questions? Just reply to this email - we read every response and are happy to help.
        </p>
        <p style="color: #333; font-size: 16px; line-height: 1.6; margin-top: 24px;">
          Best,<br />
          The ${appConfig.name} Team
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
        <p style="color: #999; font-size: 12px;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/api/unsubscribe?email={{email}}" style="color: #999;">
            Unsubscribe from marketing emails
          </a>
        </p>
      </div>
    `,
  }),
};

// ============ Transactional Email Templates ============
// These emails bypass marketing unsubscribe (billing/account notifications)

type TrialEndingParams = {
  name: string;
  planName: string;
  endDate: string;
  price: string;
};

const transactionalTemplates = {
  trial_ending_24h: ({
    name,
    planName,
    endDate,
    price,
  }: TrialEndingParams) => ({
    subject: `Your ${appConfig.name} trial ends tomorrow`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #111; font-size: 24px; margin-bottom: 16px;">Your trial is ending soon</h1>
        <p style="color: #333; font-size: 16px; line-height: 1.6;">
          Hi ${name},
        </p>
        <p style="color: #333; font-size: 16px; line-height: 1.6;">
          Your free trial of the <strong>${planName}</strong> plan ends on <strong>${endDate}</strong>.
        </p>
        <p style="color: #333; font-size: 16px; line-height: 1.6;">
          After your trial ends, you'll be automatically charged <strong>${price}</strong> to continue your subscription.
        </p>
        <div style="background: #f8f9fa; border-radius: 8px; padding: 16px; margin: 24px 0;">
          <p style="color: #333; font-size: 14px; margin: 0;">
            <strong>Want to continue?</strong> No action needed – your subscription will automatically start.
          </p>
        </div>
        <p style="color: #333; font-size: 16px; line-height: 1.6;">
          Need to make changes? You can manage your subscription anytime:
        </p>
        <p style="margin: 24px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings"
             style="display: inline-block; padding: 14px 28px; background: #000; color: #fff; text-decoration: none; border-radius: 6px; font-weight: 500;">
            Manage Subscription
          </a>
        </p>
        <p style="color: #666; font-size: 14px; margin-top: 32px;">
          If you have any questions, just reply to this email. We're here to help!
        </p>
        <p style="color: #333; font-size: 16px; line-height: 1.6; margin-top: 24px;">
          Best,<br />
          The ${appConfig.name} Team
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
        <p style="color: #999; font-size: 12px;">
          This is a billing notification. You're receiving this because you have an active trial with ${appConfig.name}.
        </p>
      </div>
    `,
  }),
};

// ============ Helper Function ============

/**
 * Send a sequence email with idempotency and unsubscribe checking.
 *
 * - Checks if email was already sent (prevents duplicates on retry)
 * - Checks if user has unsubscribed from marketing
 * - Sends email via Resend
 * - Records the sent email in database
 */
export async function sendSequenceEmail({
  userId,
  email,
  name,
  emailKey,
}: SendSequenceEmailParams): Promise<SendResult> {
  // 1. Check if already sent (idempotency)
  const existing = await db.query.emailsSent.findFirst({
    where: and(
      eq(emailsSent.userId, userId),
      eq(emailsSent.emailKey, emailKey)
    ),
  });

  if (existing) {
    return { sent: false, reason: "already_sent" };
  }

  // 2. Check unsubscribe status
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { marketingUnsubscribed: true },
  });

  if (!user) {
    return { sent: false, reason: "user_not_found" };
  }

  if (user.marketingUnsubscribed) {
    return { sent: false, reason: "unsubscribed" };
  }

  // 3. Get template and send email
  const templateKey = emailKey as keyof typeof emailTemplates;
  const template = emailTemplates[templateKey];

  if (!template) {
    console.error(`[Email Sequence] Unknown template: ${emailKey}`);
    return { sent: false, reason: "unknown_template" };
  }

  const { subject, html } = template({ name: name || "there" });

  // Replace {{email}} placeholder with actual email for unsubscribe link
  const htmlWithEmail = html.replace(
    /\{\{email\}\}/g,
    encodeURIComponent(email)
  );

  await sendEmail({
    to: email,
    subject,
    html: htmlWithEmail,
  });

  // 4. Record that email was sent
  await db.insert(emailsSent).values({
    userId,
    emailKey,
  });

  return { sent: true };
}

/**
 * Send a transactional email (billing/account notifications).
 *
 * Unlike marketing emails, transactional emails:
 * - Bypass the marketing unsubscribe preference
 * - Still maintain idempotency (won't send duplicates)
 * - Are for billing notifications, security alerts, etc.
 */
export async function sendTransactionalEmail({
  userId,
  email,
  name,
  emailKey,
  templateData = {},
}: SendTransactionalEmailParams): Promise<SendResult> {
  // 1. Check if already sent (idempotency)
  const existing = await db.query.emailsSent.findFirst({
    where: and(
      eq(emailsSent.userId, userId),
      eq(emailsSent.emailKey, emailKey)
    ),
  });

  if (existing) {
    return { sent: false, reason: "already_sent" };
  }

  // 2. Verify user exists (skip unsubscribe check - this is transactional)
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { id: true },
  });

  if (!user) {
    return { sent: false, reason: "user_not_found" };
  }

  // 3. Get template and send email
  const templateKey = emailKey as keyof typeof transactionalTemplates;
  const template = transactionalTemplates[templateKey];

  if (!template) {
    console.error(`[Transactional Email] Unknown template: ${emailKey}`);
    return { sent: false, reason: "unknown_template" };
  }

  const { subject, html } = template({
    name: name || "there",
    ...templateData,
  } as TrialEndingParams);

  await sendEmail({
    to: email,
    subject,
    html,
  });

  // 4. Record that email was sent
  await db.insert(emailsSent).values({
    userId,
    emailKey,
  });

  return { sent: true };
}
