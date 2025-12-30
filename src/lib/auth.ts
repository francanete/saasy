import { betterAuth } from "better-auth";
import { magicLink } from "better-auth/plugins/magic-link";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db";
import * as schema from "./db/schema";
import { sendEmail } from "./email";
import { appConfig } from "./config";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
    // Map our pluralized table names to Better Auth's expected names
    usePlural: true,
  }),
  // No emailAndPassword - using magic link instead (passwordless)
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      enabled: !!process.env.GOOGLE_CLIENT_ID,
    },
    // GitHub removed - only Google OAuth
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
      expiresIn: 60 * 5, // 5 minutes
      disableSignUp: false, // Allow new users via magic link
      
    }),
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },
  // Base URL for auth callbacks
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
});

export type Session = typeof auth.$Infer.Session;
