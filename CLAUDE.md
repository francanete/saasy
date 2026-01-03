# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development (runs Next.js + Inngest dev server concurrently)
npm run dev

# Individual servers
npm run dev:next          # Next.js only
npm run dev:inngest       # Inngest background jobs only

# Build & Start
npm run build
npm run start

# Linting & Formatting
npm run lint              # ESLint check
npm run lint:fix          # ESLint fix
npm run format            # Prettier format all
npm run format:check      # Prettier check

# Database (Drizzle ORM + Neon PostgreSQL)
npm run db:generate       # Generate migrations from schema changes
npm run db:migrate        # Run migrations
npm run db:push           # Push schema directly (dev only)
npm run db:studio         # Open Drizzle Studio GUI
```

## Architecture

**Stack**: Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS 4 + Drizzle ORM + Neon PostgreSQL

### Directory Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/             # Auth route group (login)
│   ├── (marketing)/        # Public pages (landing, pricing)
│   ├── dashboard/          # Protected dashboard pages
│   │   ├── chat/           # AI Chat interface
│   │   └── settings/       # User settings
│   └── api/                # API routes
│       ├── auth/[...all]/  # Better Auth handler
│       ├── chat/           # AI chat streaming endpoint
│       ├── checkout/       # Polar checkout
│       ├── inngest/        # Inngest webhook handler
│       └── webhooks/polar/ # Polar webhook handler
├── actions/                # Server Actions
│   └── ai.ts               # AI generation actions (summarize, generate)
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── layouts/            # Sidebar, navbar, footer, nav components
│   └── settings/           # Settings-specific components
├── hooks/
│   └── use-mobile.ts       # Mobile detection hook
└── lib/
    ├── db/                 # Drizzle schema and connection
    │   ├── schema.ts       # Database schema definitions
    │   └── index.ts        # DB client export
    ├── inngest/            # Background job definitions
    │   ├── client.ts       # Inngest client
    │   └── functions.ts    # Job definitions
    ├── ai.ts               # Google AI model configuration
    ├── ai-usage.ts         # AI usage tracking (token counts)
    ├── api-utils.ts        # API response utilities
    ├── auth.ts             # Better Auth configuration
    ├── auth-client.ts      # Client-side auth hooks
    ├── config.ts           # App configuration constants
    ├── email.ts            # Resend email service
    ├── errors.ts           # Error handling utilities
    ├── pricing.ts          # Polar pricing integration
    ├── rate-limit.ts       # Upstash rate limiting
    ├── subscription.ts     # Subscription management
    └── utils.ts            # General utilities (cn)
```

### Key Integrations

- **Authentication**: Better Auth with magic link + Google OAuth, configured in `src/lib/auth.ts`
- **Payments**: Polar.sh for subscriptions (recurring) or lifetime deals (LTD), toggle via `NEXT_PUBLIC_PRICING_MODE` env var
- **AI**: Google Gemini via Vercel AI SDK (`@ai-sdk/google`), models in `src/lib/ai.ts`
- **Background Jobs**: Inngest for async tasks, functions in `src/lib/inngest/functions.ts`:
  - `send-welcome-email` - Welcome email after user signup
  - `sync-all-subscriptions` - Daily cron (3 AM) to sync subscriptions with Polar
- **Email**: Resend for transactional emails
- **Rate Limiting**: Upstash Redis with tiered limits (free/pro) for AI chat and generation
- **Forms**: React Hook Form + Zod validation
- **Data Fetching**: TanStack React Query
- **Toasts**: Sonner for notifications
- **Dates**: Day.js for date manipulation

### Database Schema

Main tables in `src/lib/db/schema.ts`:
- `users`, `sessions`, `accounts`, `verifications` - Better Auth tables
- `subscriptions` - Tracks Polar subscriptions/orders with `billingType` (recurring/one_time)
- `aiUsage` - Tracks AI token usage per user (model, feature, tokens, duration)

Enums:
- `plan`: FREE, PRO, ENTERPRISE
- `subscription_status`: ACTIVE, CANCELED, PAST_DUE, TRIALING
- `billing_type`: recurring, one_time

### Path Alias

Use `@/*` to import from `src/*` (configured in tsconfig.json).

## Code Style

- Double quotes, semicolons, 2-space indent (see `.prettierrc`)
- Tailwind classes sorted by prettier-plugin-tailwindcss with `cn()` and `cva()` support
- ESLint: Next.js core web vitals + TypeScript rules, integrated with Prettier

## Environment Variables

Key environment variables needed:
- `DATABASE_URL` - Neon PostgreSQL connection string
- `BETTER_AUTH_SECRET` - Auth secret key
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` - Google OAuth
- `GOOGLE_AI_API_KEY` - Google AI (Gemini) API key
- `POLAR_ACCESS_TOKEN`, `POLAR_WEBHOOK_SECRET` - Polar.sh integration
- `RESEND_API_KEY` - Resend email service
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` - Upstash Redis
- `NEXT_PUBLIC_PRICING_MODE` - "recurring" or "ltd" for pricing mode
