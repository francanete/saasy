import { createAuthClient } from "better-auth/react";
import {
  magicLinkClient,
  organizationClient,
} from "better-auth/client/plugins";
import { polarClient } from "@polar-sh/better-auth/client";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
  plugins: [magicLinkClient(), organizationClient(), polarClient()],
});

export const { signIn, signOut, useSession, getSession } = authClient;

// Polar customer portal for the organization owner
export const customer = authClient.customer;
