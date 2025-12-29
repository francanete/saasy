# Pilotes - SaaS Boilerplate

A modern, single-codebase SaaS boilerplate built with Next.js 16.

---

## Overview

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Next.js 16                               │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │   App Router    │  │   API Routes    │  │  Server Actions │  │
│  │   (Frontend)    │  │   (REST API)    │  │   (Mutations)   │  │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘  │
│           │                    │                    │           │
│           └────────────────────┼────────────────────┘           │
│                                │                                 │
│  ┌─────────────────────────────┴─────────────────────────────┐  │
│  │                      Drizzle ORM                           │  │
│  └─────────────────────────────┬─────────────────────────────┘  │
└────────────────────────────────┼────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PostgreSQL (Neon)                             │
└─────────────────────────────────────────────────────────────────┘

External Services:
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  Better Auth │  │   Polar.sh   │  │   Inngest    │  │    Resend    │
│    (Auth)    │  │  (Payments)  │  │ (Background) │  │   (Email)    │
└──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘
```

### Technology Stack

| Layer               | Technology                          | Purpose                             |
| ------------------- | ----------------------------------- | ----------------------------------- |
| **Framework**       | Next.js 16 (App Router + Turbopack) | Full-stack React framework          |
| **UI**              | shadcn/ui + Tailwind                | Component library + utility CSS     |
| **State/Fetching**  | TanStack Query                      | Server state management             |
| **Auth**            | Better Auth                         | Session management, OAuth, JWT      |
| **ORM**             | Drizzle ORM                         | Type-safe, SQL-like database access |
| **Database**        | PostgreSQL (Neon)                   | Serverless Postgres                 |
| **Payments**        | Polar.sh                            | Subscriptions, trials, webhooks     |
| **Background Jobs** | Inngest                             | Async tasks, workflows              |
| **Email**           | Resend                              | Transactional emails                |
| **AI**              | Google AI SDK                       | LLM integration (Gemini)            |
| **Deployment**      | Vercel                              | One-click deployment                |

### Project Structure

```
pilotes/
├── package.json
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── drizzle.config.ts
├── components.json
├── .env.example
│
├── drizzle/
│   └── migrations/
│
├── src/
│   ├── app/
│   │   ├── (marketing)/
│   │   │   ├── page.tsx
│   │   │   ├── pricing/page.tsx
│   │   │   └── blog/
│   │   │
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   └── layout.tsx
│   │   │
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── settings/page.tsx
│   │   │   └── billing/page.tsx
│   │   │
│   │   ├── api/
│   │   │   ├── auth/[...all]/route.ts
│   │   │   ├── webhooks/polar/route.ts
│   │   │   ├── inngest/route.ts
│   │   │   └── chat/route.ts
│   │   │
│   │   ├── layout.tsx
│   │   └── globals.css
│   │
│   ├── components/
│   │   ├── ui/
│   │   ├── layouts/
│   │   ├── trial-banner.tsx
│   │   └── features/
│   │
│   ├── lib/
│   │   ├── auth.ts
│   │   ├── auth-client.ts
│   │   ├── db/
│   │   │   ├── index.ts
│   │   │   └── schema.ts
│   │   ├── polar.ts
│   │   ├── subscription.ts
│   │   ├── ai.ts
│   │   ├── email.ts
│   │   ├── rate-limit.ts
│   │   ├── errors.ts
│   │   └── inngest/
│   │       ├── client.ts
│   │       └── functions.ts
│   │
│   ├── actions/
│   │   ├── user.ts
│   │   ├── subscription.ts
│   │   └── ai.ts
│   │
│   ├── hooks/
│   │   ├── use-auth.ts
│   │   └── use-chat.ts
│   │
│   └── types/
│       └── index.ts
│
└── public/
```

---

## Step 1: Project Setup

### Create Next.js Project

```bash
npx create-next-app@16.1.1 pilotes --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd pilotes
```

### Install Dependencies

> **Note**: Using exact versions (no ^ or ~) for reproducible builds. Versions checked: December 2025.

```bash
# Core
pnpm add drizzle-orm@0.45.1 @neondatabase/serverless@1.0.2 @paralleldrive/cuid2@3.0.4

# Auth
pnpm add better-auth@1.4.9 @polar-sh/better-auth@1.6.3

# Payments
pnpm add @polar-sh/sdk@0.42.1

# State/Fetching
pnpm add @tanstack/react-query@5.90.14

# AI
pnpm add @google/generative-ai@0.24.1

# Rate Limiting
pnpm add @upstash/ratelimit@2.0.7 @upstash/redis@1.36.0

# Background Jobs
pnpm add inngest@3.48.1

# Email
pnpm add resend@6.6.0

# Validation
pnpm add zod@4.2.1

# UI
pnpm add class-variance-authority@0.7.1 clsx@2.1.1 lucide-react@0.562.0 tailwind-merge@2.6.0

# Dev dependencies
pnpm add -D drizzle-kit@0.31.8 typescript@5.9.3
```

### Package Versions Reference

| Package | Version | Purpose |
|---------|---------|---------|
| `next` | 16.1.1 | Framework (via create-next-app) |
| `react` | 19.2.3 | UI library (via create-next-app) |
| `typescript` | 5.9.3 | Type checking |
| `tailwindcss` | 4.1.18 | Styling (via create-next-app) |
| `drizzle-orm` | 0.45.1 | Database ORM |
| `drizzle-kit` | 0.31.8 | Drizzle CLI/migrations |
| `@neondatabase/serverless` | 1.0.2 | Neon PostgreSQL driver |
| `@paralleldrive/cuid2` | 3.0.4 | ID generation |
| `better-auth` | 1.4.9 | Authentication |
| `@polar-sh/better-auth` | 1.6.3 | Polar + Better Auth plugin |
| `@polar-sh/sdk` | 0.42.1 | Polar.sh payments SDK |
| `@tanstack/react-query` | 5.90.14 | Server state management |
| `@google/generative-ai` | 0.24.1 | Google AI (Gemini) |
| `@upstash/ratelimit` | 2.0.7 | Rate limiting |
| `@upstash/redis` | 1.36.0 | Redis client for rate limiting |
| `inngest` | 3.48.1 | Background jobs |
| `resend` | 6.6.0 | Transactional email |
| `zod` | 4.2.1 | Schema validation |
| `class-variance-authority` | 0.7.1 | Component variants |
| `clsx` | 2.1.1 | Class name utility |
| `tailwind-merge` | 2.6.0 | Tailwind class merging |
| `lucide-react` | 0.562.0 | Icons |

### Setup shadcn/ui

```bash
npx shadcn@latest init
npx shadcn@latest add button card input label dropdown-menu avatar skeleton
```

> **Note:** shadcn/ui init creates `src/lib/utils.ts` with the `cn()` utility automatically. If it doesn't, create it manually:

```typescript
// src/lib/utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### Tailwind v4 Configuration

Next.js 16 with `--tailwind` uses Tailwind CSS v4, which has a **CSS-based configuration** instead of `tailwind.config.ts`.

The default `globals.css` will look like:

```css
/* src/app/globals.css */
@import "tailwindcss";

/* Custom theme configuration (replaces tailwind.config.ts) */
@theme {
  /* Colors - using oklch for better color gamut */
  --color-primary: oklch(0.6 0.2 250);
  --color-primary-foreground: oklch(0.98 0 0);

  /* shadcn/ui will add its own theme variables here during init */
}

/* Custom utilities */
@layer utilities {
  .text-balance {
    text-wrap: balance;
  }
}
```

**Key differences from Tailwind v3:**
- No `tailwind.config.ts` - configuration is in CSS
- Use `@theme` directive for custom design tokens
- Use `@import "tailwindcss"` instead of `@tailwind` directives
- Colors use `oklch()` for better color accuracy

### Setup Providers (TanStack Query)

```typescript
// src/app/providers.tsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
```

```typescript
// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Pilotes",
  description: "Your SaaS application",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

### Environment Variables

Create `.env.example`:

```bash
# Database (Neon)
DATABASE_URL="postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Auth
BETTER_AUTH_SECRET="your-secret-key"
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""

# AI (Google)
GOOGLE_AI_API_KEY=""

# Rate Limiting (Upstash)
UPSTASH_REDIS_REST_URL=""
UPSTASH_REDIS_REST_TOKEN=""

# Payments (Polar.sh)
POLAR_ACCESS_TOKEN=""
POLAR_WEBHOOK_SECRET=""
POLAR_ORGANIZATION_ID=""
POLAR_PRO_PRODUCT_ID=""
POLAR_ENTERPRISE_PRODUCT_ID=""

# Email (Resend)
RESEND_API_KEY=""
EMAIL_FROM="noreply@yourdomain.com"

# Background Jobs (Inngest - prod only)
INNGEST_SIGNING_KEY=""
```

### Neon Database Setup

Use Neon's branching feature to isolate development from production:

1. Go to your Neon project → Branches
2. Click "Create Branch" from `main`
3. Name it `dev`
4. Copy the connection string for `.env.local`

```bash
# .env.local (dev branch)
DATABASE_URL="postgresql://user:pass@ep-xxx-dev.region.aws.neon.tech/neondb?sslmode=require"
```

### Add Scripts to package.json

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio",
    "inngest:dev": "npx inngest-cli@latest dev"
  }
}
```

---

## Step 2: Database Layer

### Drizzle Config

```typescript
// drizzle.config.ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

### Schema Definition

> **Better Auth Compatibility:** Better Auth expects specific table names (`user`, `session`, `account`, `verification` - singular). We use pluralized names (`users`, `sessions`, etc.) for convention, then configure table mapping in the Drizzle adapter. See Step 3 for the adapter configuration.
>
> Alternatively, you can generate the schema using Better Auth's CLI:
> ```bash
> npx @better-auth/cli generate --config ./src/lib/auth.ts
> ```

```typescript
// src/lib/db/schema.ts
import {
  pgTable,
  text,
  timestamp,
  boolean,
  pgEnum,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

// ============ Enums ============
export const planEnum = pgEnum("plan", ["FREE", "PRO", "ENTERPRISE"]);
export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "ACTIVE",
  "CANCELED",
  "PAST_DUE",
  "TRIALING",
]);

// ============ Auth Tables (Better Auth) ============
export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false),
  name: text("name"),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export const sessions = pgTable(
  "sessions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    expiresAt: timestamp("expires_at").notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [index("sessions_user_id_idx").on(table.userId)]
);

export const accounts = pgTable(
  "accounts",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    idToken: text("id_token"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("accounts_provider_account_idx").on(
      table.providerId,
      table.accountId
    ),
    index("accounts_user_id_idx").on(table.userId),
  ]
);

export const verifications = pgTable(
  "verifications",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("verifications_identifier_value_idx").on(
      table.identifier,
      table.value
    ),
  ]
);

// ============ App Tables ============
export const subscriptions = pgTable(
  "subscriptions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text("user_id")
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: "cascade" }),
    polarCustomerId: text("polar_customer_id").unique(),
    polarSubscriptionId: text("polar_subscription_id").unique(),
    plan: planEnum("plan").default("FREE").notNull(),
    status: subscriptionStatusEnum("status").default("ACTIVE").notNull(),
    currentPeriodEnd: timestamp("current_period_end"),
    cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    // Index for sync job queries (find stale ACTIVE/TRIALING subscriptions)
    index("subscriptions_status_idx").on(table.status),
    // Composite index for finding subscriptions by status and last update
    index("subscriptions_status_updated_idx").on(table.status, table.updatedAt),
  ]
);

// ============ Relations ============
export const usersRelations = relations(users, ({ many, one }) => ({
  sessions: many(sessions),
  accounts: many(accounts),
  subscription: one(subscriptions, {
    fields: [users.id],
    references: [subscriptions.userId],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, {
    fields: [subscriptions.userId],
    references: [users.id],
  }),
}));

// ============ Type Exports ============
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;
```

### Drizzle Client

Neon provides two drivers with different trade-offs:

| Driver | Use Case | Transactions | Cold Start |
|--------|----------|--------------|------------|
| `neon-http` | Serverless, edge functions | Single-statement only | ~50ms |
| `neon-serverless` (WebSocket) | Long transactions, connection pooling | Full support | ~100-200ms |

**Recommendation:** Use `neon-http` for most serverless workloads (API routes, Server Actions). Switch to WebSocket only if you need interactive transactions.

```typescript
// src/lib/db/index.ts
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

// HTTP driver - optimal for serverless (single-statement transactions)
const sql = neon(process.env.DATABASE_URL!);

export const db = drizzle(sql, {
  schema,
  logger: process.env.NODE_ENV === "development",
});

export type Database = typeof db;

// Re-export schema for convenience
export * from "./schema";
```

<details>
<summary><strong>WebSocket Driver (if you need full transactions)</strong></summary>

```typescript
// src/lib/db/index.ts (WebSocket version)
import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool } from "@neondatabase/serverless";
import * as schema from "./schema";

// WebSocket driver - for interactive transactions
const pool = new Pool({ connectionString: process.env.DATABASE_URL! });

export const db = drizzle(pool, {
  schema,
  logger: process.env.NODE_ENV === "development",
});

// Example: Interactive transaction (requires WebSocket driver)
await db.transaction(async (tx) => {
  const [user] = await tx.insert(users).values({ email }).returning();
  await tx.insert(subscriptions).values({ userId: user.id, plan: "FREE" });
  // Both succeed or both fail
});
```

</details>

### Migration Workflow

```bash
# Generate migration from schema changes
pnpm db:generate

# Apply migrations to database
pnpm db:migrate

# Push schema directly (dev only)
pnpm db:push

# Open Drizzle Studio (database browser)
pnpm db:studio
```

### Query Examples

```typescript
import { db, users, subscriptions } from "@/lib/db";
import { eq, and, desc } from "drizzle-orm";

// Simple select
const allUsers = await db.select().from(users);

// Select with where
const user = await db
  .select()
  .from(users)
  .where(eq(users.email, "test@example.com"))
  .limit(1);

// Join query
const usersWithSubs = await db
  .select({
    id: users.id,
    email: users.email,
    plan: subscriptions.plan,
    status: subscriptions.status,
  })
  .from(users)
  .leftJoin(subscriptions, eq(users.id, subscriptions.userId));

// Relational query (Prisma-like)
const userWithRelations = await db.query.users.findFirst({
  where: eq(users.id, userId),
  with: {
    subscription: true,
    sessions: true,
  },
});

// Insert
const [newUser] = await db
  .insert(users)
  .values({
    email: "new@example.com",
    name: "New User",
  })
  .returning();

// Update
await db
  .update(users)
  .set({ name: "Updated Name" })
  .where(eq(users.id, userId));

// Delete
await db.delete(sessions).where(eq(sessions.userId, userId));

// Transaction
await db.transaction(async (tx) => {
  const [user] = await tx
    .insert(users)
    .values({ email: "tx@example.com" })
    .returning();

  await tx.insert(subscriptions).values({
    userId: user.id,
    plan: "PRO",
  });
});
```

---

## Step 3: Authentication

### Better Auth Server Config

```typescript
// src/lib/auth.ts
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { polar } from "@polar-sh/better-auth";
import { db } from "./db";
import * as schema from "./db/schema";
import { sendEmail } from "./email";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
    // Map our pluralized table names to Better Auth's expected names
    usePlural: true,
  }),
  emailAndPassword: {
    enabled: true,
    // Enable email verification in production
    requireEmailVerification: process.env.NODE_ENV === "production",
    // Send verification email
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Verify your email",
        html: `
          <h1>Verify your email</h1>
          <p>Hi ${user.name || "there"},</p>
          <p>Click the link below to verify your email address:</p>
          <p><a href="${url}">Verify Email</a></p>
          <p>This link expires in 24 hours.</p>
        `,
      });
    },
    // Send password reset email
    sendResetPasswordEmail: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Reset your password",
        html: `
          <h1>Reset your password</h1>
          <p>Hi ${user.name || "there"},</p>
          <p>Click the link below to reset your password:</p>
          <p><a href="${url}">Reset Password</a></p>
          <p>This link expires in 1 hour.</p>
        `,
      });
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
  },
  plugins: [
    polar({
      accessToken: process.env.POLAR_ACCESS_TOKEN!,
      organizationId: process.env.POLAR_ORGANIZATION_ID!,
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
```

> **Note:** The `usePlural: true` option tells Better Auth to expect table names like `users`, `sessions`, `accounts`, `verifications` instead of singular names. This matches our schema convention.

### Better Auth Client

```typescript
// src/lib/auth-client.ts
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
});

export const { signIn, signUp, signOut, useSession, getSession } = authClient;
```

### Auth API Route

```typescript
// src/app/api/auth/[...all]/route.ts
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth);
```

### Protected Dashboard Layout

**Important:** Auth checks should happen in Layouts, NOT in proxy/middleware. This is the secure pattern recommended after CVE-2025-29927.

```typescript
// src/app/(dashboard)/layout.tsx
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db, users, subscriptions } from "@/lib/db";
import { eq } from "drizzle-orm";
import { TrialBanner } from "@/components/trial-banner";
import { Sidebar } from "@/components/layouts/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  // Get subscription status
  const [subscription] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, session.user.id))
    .limit(1);

  const hasAccess =
    subscription?.status === "ACTIVE" || subscription?.status === "TRIALING";

  // No active subscription - redirect to pricing
  if (!hasAccess && subscription?.status !== "TRIALING") {
    redirect("/pricing?reason=no_subscription");
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar user={session.user} plan={subscription?.plan || "FREE"} />
      <div className="flex-1">
        {/* Show banner for users in trial */}
        {subscription?.status === "TRIALING" && subscription.currentPeriodEnd && (
          <TrialBanner endsAt={subscription.currentPeriodEnd} />
        )}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
```

### Loading States (Suspense Boundaries)

Add `loading.tsx` files to each route group for streaming SSR and better perceived performance:

```typescript
// src/app/(auth)/loading.tsx
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function AuthLoading() {
  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </CardContent>
    </Card>
  );
}
```

```typescript
// src/app/(dashboard)/loading.tsx
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Content skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-32 rounded-lg" />
        <Skeleton className="h-32 rounded-lg" />
        <Skeleton className="h-32 rounded-lg" />
      </div>

      {/* Main content skeleton */}
      <Skeleton className="h-64 rounded-lg" />
    </div>
  );
}
```

```typescript
// src/app/(marketing)/loading.tsx
import { Skeleton } from "@/components/ui/skeleton";

export default function MarketingLoading() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Hero skeleton */}
      <div className="text-center space-y-4">
        <Skeleton className="h-12 w-96 mx-auto" />
        <Skeleton className="h-6 w-80 mx-auto" />
        <Skeleton className="h-10 w-32 mx-auto" />
      </div>

      {/* Features skeleton */}
      <div className="grid gap-6 md:grid-cols-3 mt-12">
        <Skeleton className="h-48 rounded-lg" />
        <Skeleton className="h-48 rounded-lg" />
        <Skeleton className="h-48 rounded-lg" />
      </div>
    </div>
  );
}
```

### Sidebar Component

```typescript
// src/components/layouts/sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Settings,
  CreditCard,
  MessageSquare,
  LogOut,
} from "lucide-react";
import { signOut } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  user: {
    id: string;
    email: string;
    name?: string | null;
    image?: string | null;
  };
  plan: "FREE" | "PRO" | "ENTERPRISE";
}

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Chat", href: "/dashboard/chat", icon: MessageSquare },
  { name: "Billing", href: "/dashboard/billing", icon: CreditCard },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function Sidebar({ user, plan }: SidebarProps) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-muted/30">
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/dashboard" className="text-xl font-bold">
          Pilotes
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="border-t p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={user.image || undefined} />
            <AvatarFallback>
              {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-sm font-medium">{user.name || user.email}</p>
            <p className="truncate text-xs text-muted-foreground">
              {plan === "FREE" ? "Free Plan" : `${plan} Plan`}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="mt-3 w-full justify-start gap-2"
          onClick={() => signOut()}
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>
    </div>
  );
}
```

### Auth Hook Usage

```typescript
// src/components/user-menu.tsx
"use client";

import { useSession, signOut } from "@/lib/auth-client";

export function UserMenu() {
  const { data: session, isPending } = useSession();

  if (isPending) return <Skeleton />;
  if (!session) return <LoginButton />;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Avatar src={session.user.image} />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>{session.user.email}</DropdownMenuItem>
        <DropdownMenuItem onClick={() => signOut()}>Sign out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

---

## Step 4: Protected Routes & UI

### Route Groups

- `(marketing)/` - Public pages (landing, pricing, blog)
- `(auth)/` - Auth pages (login, register)
- `(dashboard)/` - Protected app pages

### Dashboard Home Page

```typescript
// src/app/(dashboard)/page.tsx
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db, subscriptions } from "@/lib/db";
import { eq } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LayoutDashboard, MessageSquare, CreditCard, Zap } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const [subscription] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, session!.user.id))
    .limit(1);

  const stats = [
    {
      title: "Projects",
      value: "3",
      description: "Active projects",
      icon: LayoutDashboard,
    },
    {
      title: "Messages",
      value: "127",
      description: "AI conversations",
      icon: MessageSquare,
    },
    {
      title: "Plan",
      value: subscription?.plan || "FREE",
      description: subscription?.status === "TRIALING" ? "Trial active" : "Current plan",
      icon: CreditCard,
    },
    {
      title: "API Calls",
      value: "1,234",
      description: "This month",
      icon: Zap,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">
          Welcome back, {session!.user.name || "there"}!
        </h1>
        <p className="text-muted-foreground mt-1">
          Here&apos;s what&apos;s happening with your account.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Start a new AI conversation, create a project, or manage your settings.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              No recent activity to show.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

### Marketing Layout

```typescript
// src/app/(marketing)/layout.tsx
import { Navbar } from "@/components/layouts/navbar";
import { Footer } from "@/components/layouts/footer";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
      <Footer />
    </>
  );
}
```

### Navbar Component

```typescript
// src/components/layouts/navbar.tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";

const navigation = [
  { name: "Features", href: "/#features" },
  { name: "Pricing", href: "/pricing" },
  { name: "Blog", href: "/blog" },
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-xl font-bold">
            Pilotes
          </Link>
          <nav className="hidden md:flex gap-6">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild>
            <Link href="/register">Get Started</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
```

### Footer Component

```typescript
// src/components/layouts/footer.tsx
import Link from "next/link";

const footerLinks = {
  product: [
    { name: "Features", href: "/#features" },
    { name: "Pricing", href: "/pricing" },
    { name: "Blog", href: "/blog" },
  ],
  company: [
    { name: "About", href: "/about" },
    { name: "Contact", href: "/contact" },
  ],
  legal: [
    { name: "Privacy", href: "/privacy" },
    { name: "Terms", href: "/terms" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <Link href="/" className="text-xl font-bold">
              Pilotes
            </Link>
            <p className="mt-2 text-sm text-muted-foreground">
              Your modern SaaS boilerplate.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-3">Product</h3>
            <ul className="space-y-2">
              {footerLinks.product.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-3">Company</h3>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-3">Legal</h3>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Pilotes. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
```

### Auth Layout

```typescript
// src/app/(auth)/layout.tsx
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
```

### Login Page

```typescript
// src/app/(auth)/login/page.tsx
import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Sign In | Pilotes",
  description: "Sign in to your Pilotes account",
};

export default function LoginPage() {
  return <LoginForm />;
}
```

```typescript
// src/app/(auth)/login/login-form.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { signIn } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Zod validation schema
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const [formData, setFormData] = useState<LoginFormData>({ email: "", password: "" });
  const [errors, setErrors] = useState<Partial<Record<keyof LoginFormData, string>>>({});
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const router = useRouter();

  function validateForm(): boolean {
    const result = loginSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: typeof errors = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as keyof LoginFormData] = err.message;
        }
      });
      setErrors(fieldErrors);
      return false;
    }
    setErrors({});
    return true;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setGeneralError(null);

    try {
      await signIn.email({ email: formData.email, password: formData.password });
      router.push("/dashboard");
    } catch (err) {
      setGeneralError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  }

  async function handleOAuthSignIn(provider: "google" | "github") {
    setLoading(true);
    setGeneralError(null);

    try {
      await signIn.social({ provider });
      // Redirect happens automatically
    } catch (err) {
      // Handle OAuth errors
      const message = err instanceof Error ? err.message : "Authentication failed";
      setGeneralError(`Failed to sign in with ${provider}: ${message}`);
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign In</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              aria-invalid={!!errors.email}
            />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              aria-invalid={!!errors.password}
            />
            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
          </div>
          {generalError && <p className="text-red-500 text-sm">{generalError}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
          </div>
        </div>

        <div className="space-y-2">
          <Button
            variant="outline"
            className="w-full"
            disabled={loading}
            onClick={() => handleOAuthSignIn("google")}
          >
            Continue with Google
          </Button>
          <Button
            variant="outline"
            className="w-full"
            disabled={loading}
            onClick={() => handleOAuthSignIn("github")}
          >
            Continue with GitHub
          </Button>
        </div>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-primary underline">
            Sign up
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
```

### Register Page

```typescript
// src/app/(auth)/register/page.tsx
import type { Metadata } from "next";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = {
  title: "Create Account | Pilotes",
  description: "Create your Pilotes account to get started",
};

export default function RegisterPage() {
  return <RegisterForm />;
}
```

```typescript
// src/app/(auth)/register/register-form.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { signUp } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Zod validation schema
const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const [formData, setFormData] = useState<RegisterFormData>({
    name: "",
    email: "",
    password: ""
  });
  const [errors, setErrors] = useState<Partial<Record<keyof RegisterFormData, string>>>({});
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const router = useRouter();

  function validateForm(): boolean {
    const result = registerSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: typeof errors = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as keyof RegisterFormData] = err.message;
        }
      });
      setErrors(fieldErrors);
      return false;
    }
    setErrors({});
    return true;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setGeneralError(null);

    try {
      await signUp.email({
        name: formData.name,
        email: formData.email,
        password: formData.password
      });
      router.push("/dashboard");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Registration failed";
      setGeneralError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Account</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              aria-invalid={!!errors.name}
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              aria-invalid={!!errors.email}
            />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              aria-invalid={!!errors.password}
            />
            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
          </div>
          {generalError && <p className="text-red-500 text-sm">{generalError}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating account..." : "Create Account"}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-primary underline">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
```

---

## Step 5: Payments (Polar.sh)

### Polar.sh Dashboard Setup

1. Create account at polar.sh
2. Create products (PRO, ENTERPRISE)
3. **Set trial period on products** (e.g., 14 days) - Polar handles trials natively
4. Configure webhook URL: `https://yourdomain.com/api/webhooks/polar`
5. Copy API keys to environment variables

### Polar SDK Client

```typescript
// src/lib/polar.ts
import { Polar } from "@polar-sh/sdk";

export const polar = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN!,
  server: process.env.NODE_ENV === "production" ? "production" : "sandbox",
});
```

### Subscription Verification Logic

```typescript
// src/lib/subscription.ts
import { polar } from "./polar";
import { db, users, subscriptions } from "./db";
import { eq } from "drizzle-orm";

export type SubscriptionStatus = {
  hasAccess: boolean;
  plan: "FREE" | "PRO" | "ENTERPRISE";
  status: "ACTIVE" | "CANCELED" | "PAST_DUE" | "TRIALING" | "NONE";
  expiresAt: Date | null;
  needsSync: boolean;
};

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

function isStale(updatedAt: Date): boolean {
  return Date.now() - updatedAt.getTime() > CACHE_TTL_MS;
}

export async function getLocalSubscriptionStatus(
  userId: string
): Promise<SubscriptionStatus> {
  const [subscription] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);

  if (!subscription) {
    return {
      hasAccess: false,
      plan: "FREE",
      status: "NONE",
      expiresAt: null,
      needsSync: false,
    };
  }

  const hasAccess =
    subscription.status === "ACTIVE" || subscription.status === "TRIALING";

  return {
    hasAccess,
    plan: subscription.plan,
    status: subscription.status,
    expiresAt: subscription.currentPeriodEnd,
    needsSync: isStale(subscription.updatedAt),
  };
}

export async function verifyWithPolar(userId: string): Promise<{
  verified: boolean;
  polarStatus: string | null;
  polarPlan: string | null;
  polarCustomerId: string | null;
  currentPeriodEnd: Date | null;
}> {
  try {
    const [subscription] = await db
      .select({ polarCustomerId: subscriptions.polarCustomerId })
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .limit(1);

    if (!subscription?.polarCustomerId) {
      const [user] = await db
        .select({ email: users.email })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user)
        return {
          verified: true,
          polarStatus: null,
          polarPlan: null,
          polarCustomerId: null,
          currentPeriodEnd: null,
        };

      const customers = await polar.customers.list({
        email: user.email,
        organizationId: process.env.POLAR_ORGANIZATION_ID!,
      });

      if (!customers.result.items.length) {
        return {
          verified: true,
          polarStatus: null,
          polarPlan: null,
          polarCustomerId: null,
          currentPeriodEnd: null,
        };
      }

      const customerId = customers.result.items[0].id;
      const polarSubs = await polar.subscriptions.list({
        customerId,
        active: true,
        organizationId: process.env.POLAR_ORGANIZATION_ID!,
      });

      if (!polarSubs.result.items.length) {
        return {
          verified: true,
          polarStatus: "canceled",
          polarPlan: null,
          polarCustomerId: customerId,
          currentPeriodEnd: null,
        };
      }

      const activeSub = polarSubs.result.items[0];
      return {
        verified: true,
        polarStatus: activeSub.status,
        polarPlan: activeSub.productId,
        polarCustomerId: customerId,
        currentPeriodEnd: activeSub.currentPeriodEnd
          ? new Date(activeSub.currentPeriodEnd)
          : null,
      };
    }

    const polarSubs = await polar.subscriptions.list({
      customerId: subscription.polarCustomerId,
      active: true,
      organizationId: process.env.POLAR_ORGANIZATION_ID!,
    });

    if (!polarSubs.result.items.length) {
      return {
        verified: true,
        polarStatus: "canceled",
        polarPlan: null,
        polarCustomerId: subscription.polarCustomerId,
        currentPeriodEnd: null,
      };
    }

    const activeSub = polarSubs.result.items[0];
    return {
      verified: true,
      polarStatus: activeSub.status,
      polarPlan: activeSub.productId,
      polarCustomerId: subscription.polarCustomerId,
      currentPeriodEnd: activeSub.currentPeriodEnd
        ? new Date(activeSub.currentPeriodEnd)
        : null,
    };
  } catch (error) {
    console.error("Polar verification failed:", error);
    return {
      verified: false,
      polarStatus: null,
      polarPlan: null,
      polarCustomerId: null,
      currentPeriodEnd: null,
    };
  }
}

export async function reconcileSubscription(userId: string): Promise<{
  changed: boolean;
  before: string | null;
  after: string | null;
}> {
  const polarData = await verifyWithPolar(userId);

  if (!polarData.verified) {
    return { changed: false, before: null, after: null };
  }

  const [local] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);

  const localStatus = local?.status || "NONE";
  const polarStatus = mapPolarStatus(polarData.polarStatus);

  if (
    localStatus === polarStatus &&
    local?.polarCustomerId === polarData.polarCustomerId
  ) {
    if (local) {
      await db
        .update(subscriptions)
        .set({ updatedAt: new Date() })
        .where(eq(subscriptions.userId, userId));
    }
    return { changed: false, before: localStatus, after: polarStatus };
  }

  if (polarData.polarStatus && polarData.polarStatus !== "canceled") {
    const [existing] = await db
      .select({ id: subscriptions.id })
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .limit(1);

    if (existing) {
      await db
        .update(subscriptions)
        .set({
          polarCustomerId: polarData.polarCustomerId,
          plan: mapPolarPlan(polarData.polarPlan),
          status: polarStatus as any,
          currentPeriodEnd: polarData.currentPeriodEnd,
        })
        .where(eq(subscriptions.userId, userId));
    } else {
      await db.insert(subscriptions).values({
        userId,
        polarCustomerId: polarData.polarCustomerId,
        plan: mapPolarPlan(polarData.polarPlan),
        status: polarStatus as any,
        currentPeriodEnd: polarData.currentPeriodEnd,
      });
    }
  } else if (local) {
    await db
      .update(subscriptions)
      .set({ status: "CANCELED" })
      .where(eq(subscriptions.userId, userId));
  }

  return { changed: true, before: localStatus, after: polarStatus };
}

function mapPolarStatus(status: string | null): string {
  if (!status) return "NONE";
  const map: Record<string, string> = {
    active: "ACTIVE",
    canceled: "CANCELED",
    past_due: "PAST_DUE",
    trialing: "TRIALING",
    incomplete: "PAST_DUE",
  };
  return map[status] || "NONE";
}

// Exported for use in webhook handler
export function mapPlan(productId: string | null): "FREE" | "PRO" | "ENTERPRISE" {
  if (!productId) return "FREE";
  if (productId === process.env.POLAR_ENTERPRISE_PRODUCT_ID) return "ENTERPRISE";
  if (productId === process.env.POLAR_PRO_PRODUCT_ID) return "PRO";
  return "FREE";
}

export function mapStatus(
  status: string
): "ACTIVE" | "CANCELED" | "PAST_DUE" | "TRIALING" {
  const statuses: Record<string, "ACTIVE" | "CANCELED" | "PAST_DUE" | "TRIALING"> = {
    active: "ACTIVE",
    canceled: "CANCELED",
    past_due: "PAST_DUE",
    trialing: "TRIALING",
  };
  return statuses[status] || "ACTIVE";
}
```

### Polar Webhook Handler

```typescript
// src/app/api/webhooks/polar/route.ts
import { headers } from "next/headers";
import { db, subscriptions } from "@/lib/db";
import { eq } from "drizzle-orm";
import {
  validateEvent,
  WebhookVerificationError,
} from "@polar-sh/sdk/webhooks";
import { mapPlan, mapStatus } from "@/lib/subscription";

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();

  const webhookHeaders: Record<string, string> = {};
  headersList.forEach((value, key) => {
    webhookHeaders[key] = value;
  });

  let event;
  try {
    event = validateEvent(
      body,
      webhookHeaders,
      process.env.POLAR_WEBHOOK_SECRET!
    );
  } catch (error) {
    if (error instanceof WebhookVerificationError) {
      return Response.json({ error: "Invalid signature" }, { status: 401 });
    }
    throw error;
  }

  switch (event.type) {
    case "subscription.created":
    case "subscription.updated": {
      const [existing] = await db
        .select({ id: subscriptions.id })
        .from(subscriptions)
        .where(eq(subscriptions.polarSubscriptionId, event.data.id))
        .limit(1);

      if (existing) {
        await db
          .update(subscriptions)
          .set({
            status: mapStatus(event.data.status),
            currentPeriodEnd: new Date(event.data.currentPeriodEnd),
            cancelAtPeriodEnd: event.data.cancelAtPeriodEnd,
          })
          .where(eq(subscriptions.polarSubscriptionId, event.data.id));
      } else {
        await db.insert(subscriptions).values({
          userId: event.data.metadata.userId as string,
          polarCustomerId: event.data.customerId,
          polarSubscriptionId: event.data.id,
          plan: mapPlan(event.data.productId),
          status: mapStatus(event.data.status),
          currentPeriodEnd: new Date(event.data.currentPeriodEnd),
        });
      }
      break;
    }

    case "subscription.canceled":
      await db
        .update(subscriptions)
        .set({ status: "CANCELED" })
        .where(eq(subscriptions.polarSubscriptionId, event.data.id));
      break;
  }

  return Response.json({ received: true });
}
// Note: mapPlan and mapStatus are imported from @/lib/subscription
```

### Trial Banner Component

```typescript
// src/components/trial-banner.tsx
"use client";

import Link from "next/link";

export function TrialBanner({ endsAt }: { endsAt: Date }) {
  const now = new Date();
  const daysLeft = Math.ceil(
    (endsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  const urgency =
    daysLeft <= 3
      ? "bg-red-500"
      : daysLeft <= 7
        ? "bg-yellow-500"
        : "bg-blue-500";

  return (
    <div className={`${urgency} text-white px-4 py-2 text-center text-sm`}>
      {daysLeft === 1 ? (
        <span>Your trial ends tomorrow! </span>
      ) : daysLeft <= 0 ? (
        <span>Your trial has ended. </span>
      ) : (
        <span>{daysLeft} days left in your trial. </span>
      )}
      <Link href="/pricing" className="underline font-medium">
        Upgrade now
      </Link>
    </div>
  );
}
```

### Subscription Server Actions

```typescript
// src/actions/subscription.ts
"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { polar } from "@/lib/polar";
import {
  getLocalSubscriptionStatus,
  reconcileSubscription,
  SubscriptionStatus,
} from "@/lib/subscription";

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function checkSubscription(): Promise<
  ActionResult<SubscriptionStatus>
> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return { success: false, error: "Unauthorized" };
  }

  const status = await getLocalSubscriptionStatus(session.user.id);

  if (status.needsSync) {
    reconcileSubscription(session.user.id).catch(console.error);
  }

  return { success: true, data: status };
}

export async function forceRefreshSubscription(): Promise<
  ActionResult<SubscriptionStatus>
> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return { success: false, error: "Unauthorized" };
  }

  await reconcileSubscription(session.user.id);
  const status = await getLocalSubscriptionStatus(session.user.id);

  return {
    success: true,
    data: {
      ...status,
      needsSync: false,
    },
  };
}

export async function createCheckout(
  productId: string
): Promise<ActionResult<{ checkoutUrl: string }>> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return { success: false, error: "Please sign in to continue" };
  }

  try {
    const checkout = await polar.checkouts.create({
      productId,
      customerEmail: session.user.email,
      metadata: {
        userId: session.user.id,  // This is passed to webhooks
      },
      successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?checkout=success`,
      cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?checkout=canceled`,
    });

    return { success: true, data: { checkoutUrl: checkout.url } };
  } catch (error) {
    console.error("Checkout creation failed:", error);
    return { success: false, error: "Failed to create checkout" };
  }
}
```

### "I Already Paid" Button

```typescript
// src/components/refresh-subscription.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { forceRefreshSubscription } from "@/actions/subscription";

export function RefreshSubscriptionButton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  async function handleRefresh() {
    setLoading(true);
    setMessage(null);

    const result = await forceRefreshSubscription();

    if (result.success) {
      if (result.data.hasAccess) {
        setMessage("Subscription confirmed! Redirecting...");
        setTimeout(() => router.push("/dashboard"), 1500);
      } else {
        setMessage("No active subscription found. Please check your payment.");
      }
    } else {
      setMessage("Error checking subscription. Please try again.");
    }

    setLoading(false);
  }

  return (
    <div className="mt-4">
      <button
        onClick={handleRefresh}
        disabled={loading}
        className="text-sm text-primary underline disabled:opacity-50"
      >
        {loading ? "Checking..." : "I already paid - refresh my status"}
      </button>
      {message && (
        <p className="text-sm mt-2 text-muted-foreground">{message}</p>
      )}
    </div>
  );
}
```

### Pricing Page

```typescript
// src/app/(marketing)/pricing/page.tsx
import type { Metadata } from "next";
import { PricingCards } from "./pricing-cards";

export const metadata: Metadata = {
  title: "Pricing | Pilotes",
  description: "Simple, transparent pricing for teams of all sizes",
};

export default function PricingPage() {
  return (
    <div className="py-24">
      <div className="container">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that fits your needs. All plans include a 14-day
            free trial.
          </p>
        </div>

        <PricingCards />
      </div>
    </div>
  );
}
```

```typescript
// src/app/(marketing)/pricing/pricing-cards.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createCheckout } from "@/actions/subscription";

type Plan = {
  name: string;
  price: string;
  period?: string;
  description: string;
  features: string[];
  cta: string;
  productId?: string;  // Polar product ID for paid plans
  href?: string;       // Regular link for free/contact
  highlighted: boolean;
};

const plans: Plan[] = [
  {
    name: "Free",
    price: "$0",
    description: "For individuals getting started",
    features: [
      "Up to 3 projects",
      "Basic analytics",
      "Community support",
      "API access",
    ],
    cta: "Get Started",
    href: "/register",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$19",
    period: "/month",
    description: "For professionals and small teams",
    features: [
      "Unlimited projects",
      "Advanced analytics",
      "Priority support",
      "API access",
      "Custom integrations",
      "Team collaboration",
    ],
    cta: "Start Free Trial",
    productId: process.env.NEXT_PUBLIC_POLAR_PRO_PRODUCT_ID,
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "$99",
    period: "/month",
    description: "For large teams and organizations",
    features: [
      "Everything in Pro",
      "Dedicated support",
      "SLA guarantee",
      "Custom contracts",
      "Advanced security",
      "Audit logs",
    ],
    cta: "Start Free Trial",
    productId: process.env.NEXT_PUBLIC_POLAR_ENTERPRISE_PRODUCT_ID,
    highlighted: false,
  },
];

export function PricingCards() {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleCheckout(plan: Plan) {
    if (!plan.productId) return;

    setLoadingPlan(plan.name);
    setError(null);

    const result = await createCheckout(plan.productId);

    if (result.success) {
      // Redirect to Polar checkout
      window.location.href = result.data.checkoutUrl;
    } else {
      if (result.error === "Please sign in to continue") {
        // Redirect to login, then back to pricing
        router.push("/login?redirect=/pricing");
      } else {
        setError(result.error);
      }
      setLoadingPlan(null);
    }
  }

  return (
    <>
      {error && (
        <div className="mb-8 p-4 bg-red-50 text-red-600 rounded-lg text-center">
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {plans.map((plan) => (
          <Card
            key={plan.name}
            className={
              plan.highlighted
                ? "border-primary shadow-lg scale-105"
                : "border-border"
            }
          >
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">{plan.price}</span>
                {plan.period && (
                  <span className="text-muted-foreground">{plan.period}</span>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              {plan.href ? (
                <Button
                  asChild
                  className="w-full"
                  variant={plan.highlighted ? "default" : "outline"}
                >
                  <Link href={plan.href}>{plan.cta}</Link>
                </Button>
              ) : (
                <Button
                  className="w-full"
                  variant={plan.highlighted ? "default" : "outline"}
                  disabled={loadingPlan === plan.name}
                  onClick={() => handleCheckout(plan)}
                >
                  {loadingPlan === plan.name ? "Loading..." : plan.cta}
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
    </>
  );
}
```

---

## Step 6: Background Jobs (Inngest)

### Inngest Client

```typescript
// src/lib/inngest/client.ts
import { Inngest, EventSchemas } from "inngest";

export const inngest = new Inngest({
  id: "pilotes",
  schemas: new EventSchemas().fromRecord<{
    "user/created": { data: { userId: string; email: string } };
    "email/welcome": { data: { userId: string; email: string; name: string } };
    "subscription/changed": { data: { userId: string; plan: string } };
  }>(),
});
```

### Inngest Functions

```typescript
// src/lib/inngest/functions.ts
import { inngest } from "./client";
import { db, users, subscriptions } from "@/lib/db";
import { eq, and, lt, inArray, gte, isNull } from "drizzle-orm";
import { sendEmail } from "@/lib/email";
import { reconcileSubscription } from "@/lib/subscription";

// Welcome email after signup
export const sendWelcomeEmail = inngest.createFunction(
  { id: "send-welcome-email" },
  { event: "user/created" },
  async ({ event }) => {
    const { userId, email } = event.data;

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    await sendEmail({
      to: email,
      subject: "Welcome to Pilotes!",
      html: `<h1>Welcome, ${user?.name || "there"}!</h1>`,
    });

    return { sent: true };
  }
);

// Daily sync of all subscriptions with Polar
export const syncAllSubscriptions = inngest.createFunction(
  { id: "sync-all-subscriptions" },
  { cron: "0 3 * * *" }, // Every day at 3 AM
  async () => {
    const staleSubscriptions = await db
      .select({ userId: subscriptions.userId })
      .from(subscriptions)
      .where(
        and(
          lt(subscriptions.updatedAt, new Date(Date.now() - 24 * 60 * 60 * 1000)),
          inArray(subscriptions.status, ["ACTIVE", "TRIALING"])
        )
      );

    let synced = 0;
    let changed = 0;

    for (const sub of staleSubscriptions) {
      const result = await reconcileSubscription(sub.userId);
      synced++;
      if (result.changed) changed++;
      await new Promise((r) => setTimeout(r, 100));
    }

    return { synced, changed };
  }
);

// Retry failed webhooks
export const retryFailedWebhooks = inngest.createFunction(
  { id: "retry-failed-webhooks" },
  { cron: "*/15 * * * *" }, // Every 15 minutes
  async () => {
    const recentUsers = await db
      .select({ id: users.id })
      .from(users)
      .leftJoin(subscriptions, eq(users.id, subscriptions.userId))
      .where(
        and(
          gte(users.createdAt, new Date(Date.now() - 60 * 60 * 1000)),
          isNull(subscriptions.id)
        )
      );

    let recovered = 0;

    for (const user of recentUsers) {
      const result = await reconcileSubscription(user.id);
      if (result.changed && result.after !== "NONE") {
        recovered++;
      }
    }

    return { checked: recentUsers.length, recovered };
  }
);

export const functions = [
  sendWelcomeEmail,
  syncAllSubscriptions,
  retryFailedWebhooks,
];
```

### Inngest API Route

```typescript
// src/app/api/inngest/route.ts
import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { functions } from "@/lib/inngest/functions";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions,
});
```

### Triggering Jobs

```typescript
// In a Server Action or API route
import { inngest } from "@/lib/inngest/client";

// After user signup
await inngest.send({
  name: "user/created",
  data: { userId: user.id, email: user.email },
});
```

---

## Step 7: Email (Resend)

### Resend Client

```typescript
// src/lib/email.ts
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}

export async function sendEmail({ to, subject, html, from }: SendEmailOptions) {
  const { data, error } = await resend.emails.send({
    from: from || process.env.EMAIL_FROM || "noreply@yourdomain.com",
    to: Array.isArray(to) ? to : [to],
    subject,
    html,
  });

  if (error) {
    console.error("Email send error:", error);
    throw error;
  }

  return data;
}

// Pre-built templates
export async function sendWelcomeEmail(email: string, name: string) {
  return sendEmail({
    to: email,
    subject: "Welcome to Pilotes!",
    html: `
      <h1>Welcome, ${name}!</h1>
      <p>Thanks for signing up. We're excited to have you!</p>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard">Go to Dashboard</a></p>
    `,
  });
}

export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  return sendEmail({
    to: email,
    subject: "Reset Your Password",
    html: `
      <h1>Password Reset</h1>
      <p>Click the link below to reset your password:</p>
      <p><a href="${resetUrl}">Reset Password</a></p>
      <p>This link expires in 1 hour.</p>
    `,
  });
}
```

---

## Step 8: AI Integration

### Google AI SDK Config

```typescript
// src/lib/ai.ts
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

// Use stable model versions for production reliability
// Experimental models (gemini-2.0-flash-exp, etc.) may be deprecated without notice
export const models = {
  // Fast model for quick responses (chat, summaries)
  flash: genAI.getGenerativeModel({ model: "gemini-1.5-flash" }),
  // More capable model for complex reasoning
  pro: genAI.getGenerativeModel({ model: "gemini-1.5-pro" }),
};

// Model selection helper
export type ModelName = keyof typeof models;

export { genAI };
```

### Streaming Chat Endpoint

```typescript
// src/app/api/chat/route.ts
import { models, type ModelName } from "@/lib/ai";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { checkRateLimit } from "@/lib/rate-limit";
import { getLocalSubscriptionStatus } from "@/lib/subscription";

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check subscription - AI requires active subscription
  const subscription = await getLocalSubscriptionStatus(session.user.id);
  if (!subscription.hasAccess) {
    return Response.json(
      { error: "Active subscription required to use AI features" },
      { status: 403 }
    );
  }

  // Rate limit
  const { success, headers: rateLimitHeaders } = await checkRateLimit(
    "ai",
    session.user.id
  );

  if (!success) {
    return Response.json(
      { error: "Too many requests. Please slow down." },
      { status: 429, headers: rateLimitHeaders }
    );
  }

  const { messages, model = "flash" } = await req.json();

  // Validate model name
  if (!(model in models)) {
    return Response.json({ error: "Invalid model" }, { status: 400 });
  }

  const history = messages.slice(0, -1).map((m: any) => ({
    role: m.role === "user" ? "user" : "model",
    parts: [{ text: m.content }],
  }));

  const lastMessage = messages[messages.length - 1].content;

  const chat = models[model as ModelName].startChat({ history });
  const result = await chat.sendMessageStream(lastMessage);

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      for await (const chunk of result.stream) {
        const text = chunk.text();
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
        );
      }
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
```

### Chat Hook

```typescript
// src/hooks/use-chat.ts
"use client";

import { useState, useCallback, useRef } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use ref to always have access to current messages (avoids stale closure)
  const messagesRef = useRef<Message[]>([]);
  messagesRef.current = messages;

  const sendMessage = useCallback(async (content: string) => {
    const userMessage: Message = { role: "user", content };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      // Use ref to get current messages (including the one we just added)
      const currentMessages = [...messagesRef.current, userMessage];

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: currentMessages }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to send message");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = "";

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk
          .split("\n")
          .filter((line) => line.startsWith("data: "));

        for (const line of lines) {
          const data = line.slice(6);
          if (data === "[DONE]") break;

          try {
            const { text } = JSON.parse(data);
            assistantMessage += text;
            setMessages((prev) => [
              ...prev.slice(0, -1),
              { role: "assistant", content: assistantMessage },
            ]);
          } catch {}
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred";
      setError(message);
      // Remove the user message if request failed
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  }, []); // No dependencies - uses ref for current messages

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return { messages, sendMessage, isLoading, error, clearMessages };
}
```

### AI Server Actions

```typescript
// src/actions/ai.ts
"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { models, type ModelName } from "@/lib/ai";
import { getLocalSubscriptionStatus } from "@/lib/subscription";

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

async function requireSubscription(): Promise<
  { userId: string } | { error: string }
> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return { error: "Unauthorized" };
  }

  const subscription = await getLocalSubscriptionStatus(session.user.id);
  if (!subscription.hasAccess) {
    return { error: "Active subscription required" };
  }

  return { userId: session.user.id };
}

export async function summarizeText(
  text: string
): Promise<ActionResult<string>> {
  const authResult = await requireSubscription();
  if ("error" in authResult) {
    return { success: false, error: authResult.error };
  }

  try {
    const result = await models.flash.generateContent(
      `Summarize the following text in 2-3 sentences:\n\n${text}`
    );
    return { success: true, data: result.response.text() };
  } catch (error) {
    console.error("Summarization failed:", error);
    return { success: false, error: "Failed to generate summary" };
  }
}

export async function generateContent(
  prompt: string,
  model: ModelName = "flash"
): Promise<ActionResult<string>> {
  const authResult = await requireSubscription();
  if ("error" in authResult) {
    return { success: false, error: authResult.error };
  }

  try {
    const result = await models[model].generateContent(prompt);
    return { success: true, data: result.response.text() };
  } catch (error) {
    console.error("Generation failed:", error);
    return { success: false, error: "Failed to generate content" };
  }
}
```

---

## Step 9: Rate Limiting

### Upstash Rate Limiter

```typescript
// src/lib/rate-limit.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { headers } from "next/headers";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export const rateLimiters = {
  // AI endpoints: 10 requests per 10 seconds (by user ID)
  ai: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "10 s"),
    prefix: "ratelimit:ai",
  }),

  // Auth endpoints: 5 requests per minute (by IP - protects login/register)
  auth: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "1 m"),
    prefix: "ratelimit:auth",
  }),

  // Stricter auth limit for failed attempts: 10 per hour (by IP)
  authStrict: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "1 h"),
    prefix: "ratelimit:auth-strict",
  }),

  // General API: 100 requests per minute
  api: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, "1 m"),
    prefix: "ratelimit:api",
  }),
};

// Extract IP address from request headers
export async function getClientIP(): Promise<string> {
  const headersList = await headers();

  // Check common headers set by proxies/load balancers
  const forwardedFor = headersList.get("x-forwarded-for");
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first (original client)
    return forwardedFor.split(",")[0].trim();
  }

  const realIP = headersList.get("x-real-ip");
  if (realIP) {
    return realIP;
  }

  // Vercel-specific header
  const vercelForwardedFor = headersList.get("x-vercel-forwarded-for");
  if (vercelForwardedFor) {
    return vercelForwardedFor.split(",")[0].trim();
  }

  // Fallback for development or when no proxy headers
  return "127.0.0.1";
}

export async function checkRateLimit(
  limiter: keyof typeof rateLimiters,
  identifier: string
) {
  const { success, limit, remaining, reset } =
    await rateLimiters[limiter].limit(identifier);

  return {
    success,
    headers: {
      "X-RateLimit-Limit": limit.toString(),
      "X-RateLimit-Remaining": remaining.toString(),
      "X-RateLimit-Reset": reset.toString(),
    },
  };
}

// Convenience function for IP-based rate limiting (unauthenticated requests)
export async function checkIPRateLimit(limiter: keyof typeof rateLimiters) {
  const ip = await getClientIP();
  return checkRateLimit(limiter, `ip:${ip}`);
}

// Combined rate limit check: tries user ID first, falls back to IP
export async function checkRateLimitWithFallback(
  limiter: keyof typeof rateLimiters,
  userId?: string | null
) {
  const identifier = userId || `ip:${await getClientIP()}`;
  return checkRateLimit(limiter, identifier);
}
```

### Applying Rate Limits to Auth Endpoints

Add rate limiting to the Better Auth handler to protect login/register endpoints:

```typescript
// src/app/api/auth/[...all]/route.ts
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { NextRequest, NextResponse } from "next/server";
import { checkIPRateLimit } from "@/lib/rate-limit";

const handler = toNextJsHandler(auth);

// Wrap handler with rate limiting for sensitive endpoints
async function rateLimitedHandler(req: NextRequest) {
  const url = new URL(req.url);
  const path = url.pathname;

  // Apply strict rate limiting to auth-sensitive endpoints
  const sensitiveEndpoints = [
    "/api/auth/sign-in",
    "/api/auth/sign-up",
    "/api/auth/forgot-password",
    "/api/auth/reset-password",
  ];

  if (sensitiveEndpoints.some((endpoint) => path.includes(endpoint))) {
    const { success, headers: rateLimitHeaders } = await checkIPRateLimit("auth");

    if (!success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: rateLimitHeaders }
      );
    }
  }

  // Call the original handler
  return handler.POST(req);
}

export const GET = handler.GET;
export const POST = rateLimitedHandler;
```

---

## Step 10: Error Handling & Polish

### Custom Error Classes

```typescript
// src/lib/errors.ts
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(message, "UNAUTHORIZED", 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden") {
    super(message, "FORBIDDEN", 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Not found") {
    super(message, "NOT_FOUND", 404);
  }
}

export class ValidationError extends AppError {
  constructor(
    message: string,
    public errors?: Record<string, string[]>
  ) {
    super(message, "VALIDATION_ERROR", 400);
  }
}

export class RateLimitError extends AppError {
  constructor(message = "Too many requests") {
    super(message, "RATE_LIMIT", 429);
  }
}
```

### API Error Handler

```typescript
// src/lib/api-utils.ts
import { NextResponse } from "next/server";
import { AppError } from "./errors";

export function handleApiError(error: unknown) {
  console.error("API Error:", error);

  if (error instanceof AppError) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.statusCode }
    );
  }

  return NextResponse.json(
    { error: "Internal server error", code: "INTERNAL_ERROR" },
    { status: 500 }
  );
}
```

### Error Boundary

```typescript
// src/app/error.tsx
"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <h2 className="text-xl font-semibold">Something went wrong!</h2>
      <p className="text-muted-foreground">{error.message}</p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
```

### 404 Page

```typescript
// src/app/not-found.tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="text-muted-foreground">Page not found</p>
      <Button asChild>
        <Link href="/">Go home</Link>
      </Button>
    </div>
  );
}
```

---

## Deployment

### Vercel Setup

1. Push code to GitHub
2. Import project in Vercel
3. Set environment variables (use Neon production branch DATABASE_URL)
4. Deploy!

### Database Migrations in Production

**Option A:** Run in Vercel build

```json
{
  "buildCommand": "pnpm db:migrate && next build"
}
```

**Option B:** Run manually before deploy

```bash
DATABASE_URL=<production-url> pnpm db:migrate
```

### Inngest Setup

1. Create account at inngest.com
2. Get signing key from dashboard
3. Add `INNGEST_SIGNING_KEY` to Vercel env vars
4. Inngest auto-discovers your `/api/inngest` endpoint

---

## Appendix

### Configuration Files

#### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

#### next.config.ts

```typescript
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,

  // Turbopack is now the default bundler in Next.js 16
  // No need to explicitly enable it

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },

  // Server external packages (for Drizzle + Neon)
  serverExternalPackages: ["@neondatabase/serverless"],

  // Experimental features
  experimental: {
    // Enable server actions (enabled by default in Next.js 14+)
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};

export default nextConfig;
```

#### drizzle.config.ts (for reference)

```typescript
// drizzle.config.ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

---

### Type Safety Patterns

```typescript
// Shared types from Drizzle
import type { User, Subscription } from "@/lib/db/schema";

// Extended types with relations
export type UserWithSubscription = User & {
  subscription: Subscription | null;
};

// Action result types
type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };
```

### Zod + Drizzle Integration

```typescript
import { z } from "zod";
import { planEnum, subscriptionStatusEnum } from "@/lib/db/schema";

// Use Drizzle enums in Zod schemas
export const subscriptionSchema = z.object({
  plan: z.enum(planEnum.enumValues),
  status: z.enum(subscriptionStatusEnum.enumValues),
});
```

### Data Fetching Patterns

**Server Components (default):**

```typescript
// src/app/(dashboard)/page.tsx
export default async function DashboardPage() {
  const [user, activity] = await Promise.all([
    db.query.users.findFirst({ where: eq(users.id, userId) }),
    db.select().from(activities).orderBy(desc(activities.createdAt)).limit(10),
  ]);

  return <Dashboard user={user} activity={activity} />;
}
```

**Client-side with TanStack Query:**

```typescript
// src/hooks/use-subscription.ts
"use client";

import { useQuery } from "@tanstack/react-query";

export function useSubscription() {
  return useQuery({
    queryKey: ["subscription"],
    queryFn: async () => {
      const res = await fetch("/api/subscription");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });
}
```

---

## Quick Reference

### Daily Development

```bash
pnpm dev              # Start dev server
pnpm inngest:dev      # Start Inngest dev server (separate terminal)
pnpm db:studio        # Browse database
```

### After Schema Changes

```bash
pnpm db:generate      # Generate migration
pnpm db:migrate       # Apply migration
```

### Before Commit

```bash
pnpm lint
pnpm build
```
