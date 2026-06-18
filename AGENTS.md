# AGENTS.md

Guidance for AI coding agents working in this repository.

## Project Intent

This repo is a reusable SaaS starter template. Treat it as a launch base for
new product ideas: preserve generic SaaS capabilities, keep customization
centralized, and avoid one-off changes that make the next SaaS harder to spin
up.

When asked to create a new SaaS from this template, first update the product
configuration and copy, then add domain-specific features only where needed.

## Stack

- Next.js 16 App Router, React 19, TypeScript
- Tailwind CSS 4 with shadcn-style components in `src/components/ui`
- Better Auth for auth, magic links, Google OAuth, and Polar integration
- Drizzle ORM with PostgreSQL
- Polar for checkout, subscriptions, lifetime deals, portal, and webhooks
- Resend for transactional email
- Inngest for background jobs and email sequences
- AI SDK with Google Gemini
- OpenPanel analytics
- Vitest and React Testing Library

## Commands

Use npm. This repo has `package-lock.json`.

```bash
npm run dev              # Next.js + Inngest + ngrok
npm run dev:next         # Next.js only
npm run dev:inngest      # Inngest dev server only
npm run dev:ngrok        # ngrok tunnel for webhooks
npm run dev:full         # local Postgres + full dev stack

npm run build            # migrations + Next build
npm run start            # production server

npm run lint             # ESLint
npm run lint:fix         # ESLint fix
npm run format           # Prettier write
npm run format:check     # Prettier check

npm run db:dev:up        # start local Postgres
npm run db:dev:down      # stop local Postgres
npm run db:dev:reset     # reset local DB volume and migrate
npm run db:generate      # generate Drizzle migrations
npm run db:migrate       # apply local migrations with .env.local
npm run db:push          # push schema directly, dev only
npm run db:studio        # Drizzle Studio

npm run test             # Vitest watch
npm run test:run         # Vitest once
npm run test:coverage    # coverage
```

Makefile shortcuts:

```bash
make restart             # kill common dev ports and run npm run dev
make db                  # reset DB and open Drizzle Studio
```

## Product Customization Checklist

For a new SaaS idea, usually start here:

1. Brand, positioning, legal, SEO, theme, pricing, rate limits:
   `src/lib/config.ts`
2. Marketing feature content and homepage feature mockups:
   `src/lib/features-config.ts` and `src/components/features`
3. Benefit comparison:
   `src/lib/benefit-comparison-config.ts` and
   `src/components/benefit-comparison`
4. Pricing behavior and display:
   `src/lib/pricing.ts`, `src/components/pricing`, and Polar product IDs in
   `src/lib/config.ts`
5. Auth and billing behavior:
   `src/lib/auth.ts`, `src/lib/subscription.ts`, `src/proxy.ts`
6. Dashboard experience:
   `src/app/dashboard`, `src/components/dashboard`, `src/components/layouts`
7. AI feature behavior:
   `src/lib/ai.ts`, `src/actions/ai.ts`, `src/app/api/chat/route.ts`
8. Emails and sequences:
   `src/lib/email.ts`, `src/lib/email-sequences.ts`,
   `src/lib/emails/templates`, `src/lib/inngest/jobs`
9. Blog content:
   `content/blog/*.mdx`
10. Legal pages:
    `src/app/(marketing)/privacy/page.tsx`,
    `src/app/(marketing)/terms/page.tsx`

Prefer changing config-driven surfaces before editing many components. If a
piece of brand, plan, legal, SEO, or product copy will be reused, put it in
`appConfig` or an existing config module.

## Important Paths

- `src/app` - App Router pages, layouts, and API routes
- `src/app/(marketing)` - public homepage, pricing, blog, legal pages
- `src/app/(auth)` - login and signup routes
- `src/app/dashboard` - protected application area
- `src/app/gate` - paid-access gate
- `src/actions` - server actions
- `src/components/ui` - reusable UI primitives
- `src/components/onboarding` - tour system
- `src/lib` - integrations, config, auth, billing, email, AI, data helpers
- `src/lib/db/schema.ts` - Drizzle schema
- `drizzle/migrations` - generated migrations
- `tests` - Vitest tests mirroring app/lib/action/API areas
- `roadmap/production-readiness.md` - known production-readiness notes

## Architecture Notes

- Protected routes are enforced in `src/proxy.ts`.
- Use `src/lib/dal.ts` helpers for server-side auth, paid access, admin access,
  and protected API wrappers.
- Better Auth tables are in `src/lib/db/schema.ts`; keep table names compatible
  with the configured Drizzle adapter.
- Subscription access is modeled through `subscriptions` plus helpers in
  `src/lib/subscription.ts`.
- `appConfig.pricing.requirePaidAccess` controls whether dashboard access
  requires a paid plan.
- `appConfig.pricing.mode` can be `"subscription"` or `"ltd"`.
- Polar products are derived from enabled tiers and billing cycles in
  `src/lib/pricing.ts`.
- API routes should return structured errors via `src/lib/api-utils.ts` where
  practical.
- Inngest functions are registered through `src/lib/inngest/functions.ts`.
- Marketing pages should remain usable without authentication.

## Database Guidance

- `src/lib/db/schema.ts` is the source of truth for database schema changes.
- Edit schema in `src/lib/db/schema.ts`.
- After schema changes, run `npm run db:generate` to create the migration.
- Prefer generated migrations over handwritten ones.
- Review generated SQL before applying it; if Drizzle generates unexpected
  changes, stop and inspect rather than applying blindly.
- Do not hand-edit generated migration snapshots unless repairing a known
  migration issue.
- Use `npm run db:migrate` for local migration application.
- Local Postgres is available through `docker-compose.yml`.
- Do not run destructive DB reset commands unless explicitly requested or
  clearly safe for the current task.

## Onboarding Tours

There is a dedicated guide at `src/components/onboarding/CLAUDE.md`.

For a new flow:

- Add the flow to `src/lib/onboarding-config.ts`.
- Add stable `id="tour-{flowId}-{stepId}"` targets to visible UI elements.
- Wrap the route with `OnboardingProvider` in the relevant layout.
- Add or update tests in `tests/lib/onboarding-config.test.ts`.
- Avoid targeting hidden tabs or mobile-hidden elements unless the step is
  marked desktop-only.

## Code Style

- TypeScript strict mode is enabled.
- Use the `@/*` path alias for imports from `src`.
- Prettier uses double quotes, semicolons, 2 spaces, trailing commas where
  valid, and Tailwind class sorting.
- Use `cn()` for class composition and existing UI primitives before creating
  new visual patterns.
- Prefer server components by default in App Router. Add `"use client"` only
  for interactivity, browser APIs, hooks, or client-only libraries.
- Keep secrets server-side. Never expose non-public environment variables to
  client components.
- Do not commit or print `.env.local` values.
- Keep template behavior reusable. If a feature is product-specific, isolate it
  behind config or a clearly named route/module.

## Frontend Guidance

- Match the existing shadcn/Tailwind component style.
- Use Lucide icons through `lucide-react` for common icons.
- Keep SaaS/dashboard screens dense, scannable, and work-focused.
- Do not add marketing landing-page fluff where the app/product workflow is the
  requested deliverable.
- Check responsive behavior for marketing sections, pricing cards, dashboard
  layouts, forms, dialogs, and onboarding overlays.

## Testing Guidance

Run the smallest relevant verification first, then broaden when touching shared
systems.

- Pure lib/config change: related `tests/lib/*.test.ts`
- Server action change: related `tests/actions/*.test.ts`
- API route change: related `tests/api/*.test.ts`
- UI component change: related `tests/components/**/*.test.tsx`
- Billing/auth/subscription/rate-limit changes: run the focused tests plus
  `npm run test:run` when feasible
- Schema or migration changes: run migration generation/checks and relevant DB
  logic tests

If tests cannot be run because services or credentials are missing, state that
clearly in the final response.

## Environment Variables

`.env.example` lists expected variables. Key services:

- `DATABASE_URL`
- `NEXT_PUBLIC_APP_URL`
- `BETTER_AUTH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_AI_API_KEY`
- `POLAR_ACCESS_TOKEN`
- `POLAR_WEBHOOK_SECRET`
- `POLAR_ORGANIZATION_ID`
- `RESEND_API_KEY`
- `EMAIL_FROM`
- `INNGEST_SIGNING_KEY` for production

Only variables prefixed with `NEXT_PUBLIC_` may be assumed available in the
browser.

## Production Readiness

Before launching a real SaaS, verify at least:

- Real company/legal details in `appConfig.legal`
- Real product name, URLs, metadata, and social links
- Real Polar product IDs for the chosen pricing mode and environment
- Real Resend sender/domain setup
- Real OAuth credentials and Better Auth secret
- Database migrations applied to the target environment
- Webhook routes reachable from Polar and Inngest
- Security headers still valid for any new external assets or scripts
- Rate limits match the product tiers
- Privacy/terms pages match actual data handling

Check `roadmap/production-readiness.md` for known historical issues, but verify
against the current code before treating any item as still open.

## Agent Working Rules

- Read nearby code before editing.
- Keep changes scoped to the requested SaaS idea or platform capability.
- Preserve user changes in the working tree.
- Avoid broad refactors unless the request requires them.
- Prefer existing patterns and helpers over new abstractions.
- Add tests when changing behavior, especially auth, billing, subscription,
  rate limiting, API routes, or shared config.
- Report commands run and any verification gaps in the final response.
