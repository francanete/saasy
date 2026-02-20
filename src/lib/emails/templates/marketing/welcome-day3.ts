import { appConfig } from "@/lib/config";
import type { EmailTemplate } from "../../types";

export const template: EmailTemplate = {
  key: "welcome_day3",
  category: "marketing",
  subject: ({ name }) => `How's it going, ${name}?`,
  html: ({ name }) => `
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
          <a href="{{unsubscribe_url}}" style="color: #999;">
            Unsubscribe from marketing emails
          </a>
        </p>
      </div>
    `,
};
