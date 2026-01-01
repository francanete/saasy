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
│   └── api/                # API routes (auth, checkout, inngest)
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── layouts/            # Sidebar, navbar, footer
│   └── settings/           # Settings-specific components
├── lib/
│   ├── db/                 # Drizzle schema and connection
│   │   ├── schema.ts       # Database schema definitions
│   │   └── index.ts        # DB client export
│   ├── inngest/            # Background job definitions
│   ├── auth.ts             # Better Auth configuration
│   ├── auth-client.ts      # Client-side auth hooks
│   ├── subscription.ts     # Subscription management
│   ├── pricing.ts          # Polar pricing integration
│   └── email.ts            # Resend email service
└── hooks/                  # React hooks
```

### Key Integrations

- **Authentication**: Better Auth with magic link + Google OAuth, configured in `src/lib/auth.ts`
- **Payments**: Polar.sh for subscriptions (recurring) or lifetime deals (LTD), toggle via `NEXT_PUBLIC_PRICING_MODE` env var
- **Background Jobs**: Inngest for async tasks (welcome emails, subscription sync), functions in `src/lib/inngest/functions.ts`
- **Email**: Resend for transactional emails
- **Rate Limiting**: Upstash Redis

### Database Schema

Main tables in `src/lib/db/schema.ts`:
- `users`, `sessions`, `accounts`, `verifications` - Better Auth tables
- `subscriptions` - Tracks Polar subscriptions/orders with `billingType` (recurring/one_time)

### Path Alias

Use `@/*` to import from `src/*` (configured in tsconfig.json).

## Code Style

- Double quotes, semicolons, 2-space indent (see `.prettierrc`)
- Tailwind classes sorted by prettier-plugin-tailwindcss with `cn()` and `cva()` support
- ESLint: Next.js core web vitals + TypeScript rules, integrated with Prettier
