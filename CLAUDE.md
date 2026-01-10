# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development (runs Next.js + Inngest + ngrok concurrently)
npm run dev

# Individual servers
npm run dev:next          # Next.js only
npm run dev:inngest       # Inngest background jobs only
npm run dev:ngrok         # ngrok tunnel for webhooks

# Build & Start
npm run build             # Runs migrations then builds
npm run start

# Linting & Formatting
npm run lint              # ESLint check
npm run lint:fix          # ESLint fix
npm run format            # Prettier format all
npm run format:check      # Prettier check

# Database (Drizzle ORM + Neon PostgreSQL)
npm run db:generate       # Generate migrations from schema changes
npm run db:migrate        # Run migrations (local with .env.local)
npm run db:migrate:deploy # Run migrations (production)
npm run db:push           # Push schema directly (dev only)
npm run db:studio         # Open Drizzle Studio GUI

# Testing (Vitest)
npm run test              # Run tests in watch mode
npm run test:run          # Run tests once
npm run test:coverage     # Run tests with coverage
```

## Architecture

**Stack**: Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS 4 + Drizzle ORM + Neon PostgreSQL

### Directory Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/             # Auth route group (login)
│   ├── (marketing)/        # Public pages
│   │   ├── blog/           # Blog listing
│   │   │   └── [slug]/     # Blog post pages
│   │   ├── pricing/        # Pricing page
│   │   ├── privacy/        # Privacy policy
│   │   └── terms/          # Terms of service
│   ├── checkout/success/   # Checkout success page
│   ├── dashboard/          # Protected dashboard pages
│   │   ├── admin/          # Admin dashboard
│   │   │   └── tiers/      # Tier management
│   │   ├── chat/           # AI Chat interface
│   │   └── settings/       # User settings
│   ├── gate/               # Access gate for paid features
│   └── api/                # API routes
│       ├── auth/[...all]/  # Better Auth handler
│       ├── chat/           # AI chat streaming endpoint
│       ├── checkout/       # Polar checkout
│       ├── inngest/        # Inngest webhook handler
│       ├── subscription/   # Subscription endpoints
│       │   └── clear-cache/# Clear subscription cache
│       └── webhooks/polar/ # Polar webhook handler
├── actions/                # Server Actions
│   ├── admin.ts            # Admin actions (tier management)
│   ├── ai.ts               # AI generation actions
│   └── subscription.ts     # Subscription actions
├── components/
│   ├── admin/              # Admin dashboard components
│   ├── blog/               # Blog post components
│   ├── layouts/            # Sidebar, navbar, footer
│   ├── pricing/            # Pricing components
│   ├── seo/                # SEO components
│   ├── settings/           # Settings components
│   └── ui/                 # shadcn/ui components
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
    ├── blog.ts             # Blog utilities (MDX parsing, reading time)
    ├── config.ts           # App configuration constants
    ├── dal.ts              # Data Access Layer (session, auth helpers)
    ├── email.ts            # Resend email service
    ├── errors.ts           # Error handling utilities
    ├── handle-rate-limit-error.ts  # Rate limit error handling
    ├── messages.ts         # Message constants
    ├── polar-client.ts     # Polar SDK client
    ├── pricing.ts          # Polar pricing integration
    ├── rate-limit.ts       # AI rate limiting (database-based)
    ├── seo.ts              # SEO utilities (metadata, canonical URLs)
    ├── subscription.ts     # Subscription management
    └── utils.ts            # General utilities (cn)
content/
└── blog/                   # Blog posts in MDX format
```

### Key Integrations

- **Authentication**: Better Auth with magic link + Google OAuth, configured in `src/lib/auth.ts`
- **Payments**: Polar.sh for subscriptions (recurring) or lifetime deals (LTD), configured via `appConfig.pricing.mode` in `src/lib/config.ts`
- **AI**: Google Gemini via Vercel AI SDK (`@ai-sdk/google`), models in `src/lib/ai.ts`
- **Background Jobs**: Inngest for async tasks, functions in `src/lib/inngest/functions.ts`:
  - `send-welcome-email` - Welcome email + FREE subscription after signup
  - `sync-all-subscriptions` - Daily cron (3 AM) to sync subscriptions with Polar
  - `send-paid-signup-email` - Account setup email for guest checkout users
- **Email**: Resend for transactional emails
- **Rate Limiting**: Database-based rate limits per plan/feature (uses `featureRateLimits` table)
- **Blog**: MDX-based blog with gray-matter parsing and reading time
- **SEO**: Centralized metadata generation in `src/lib/seo.ts`
- **Forms**: React Hook Form + Zod validation
- **Data Fetching**: TanStack React Query
- **Toasts**: Sonner for notifications
- **Dates**: Day.js for date manipulation
- **Testing**: Vitest with React Testing Library

### Database Schema

Main tables in `src/lib/db/schema.ts`:

- `users`, `sessions`, `accounts`, `verifications` - Better Auth tables
- `subscriptions` - Tracks Polar subscriptions/orders with `billingType` (recurring/one_time)
- `aiUsage` - Tracks AI token usage per user (model, feature, tokens, duration)
- `tierConfigs` - Tier display names, descriptions, sort order
- `featureRateLimits` - Per-plan rate limits for specific features

Enums:

- `plan`: FREE, STARTER, GROWTH, SCALE
- `subscription_status`: ACTIVE, CANCELED, PAST_DUE, TRIALING
- `billing_type`: recurring, one_time, none
- `role`: user, admin

### Data Access Layer (DAL)

Use `src/lib/dal.ts` for protected routes and server actions:

- `getCurrentSession()` - Cached session retrieval
- `requirePaidAccess()` - Server action helper (throws if not paid)
- `requireAdminAccess()` - Server action helper (throws if not admin)
- `protectedApiRouteWrapper()` - API route wrapper with auth/rate limiting

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
- `NEXT_PUBLIC_APP_URL` - Production URL (for SEO/canonical URLs)
