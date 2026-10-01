import { appConfig } from "@/lib/config";
import type { EmailTemplate } from "../../types";

export const template: EmailTemplate = {
  key: "welcome_instant",
  category: "marketing",
  subject: () => `Welcome to ${appConfig.name}!`,
  html: ({ name }) => `
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
          <a href="{{unsubscribe_url}}" style="color: #999;">
            Unsubscribe from marketing emails
          </a>
        </p>
      </div>
    `,
};
