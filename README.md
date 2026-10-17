# Saasy

Reusable SaaS starter built with Next.js, Better Auth, Drizzle, Polar, Inngest, Resend, and Tailwind CSS.

## Local Runtime

The normal development stack runs in Docker Compose. Docker is required; Node 24 is only needed for commands run on the host, such as Drizzle Studio and tests. Copy `.env.example` to `.env.local` and set your local credentials before starting.

```bash
cp .env.example .env.local
make up
```

`make up` starts Postgres, Next.js, and Inngest, then waits for their health checks. It builds the app image when missing and reuses it on later runs. Use `make rebuild` after changing `Dockerfile.dev`. Pending Drizzle migrations run during app startup. Dependencies are installed only when `package-lock.json` changes; dependencies and the Next.js cache live in named Docker volumes.

The services are available on loopback only:

```bash
http://localhost:3000  # Next.js app
http://localhost:8288  # Inngest dev UI
```

The database uses the host port set by `DB_PORT` in `.env.local` (default `5432`). Inside Compose, the app connects to `db:5432`, and Inngest registers functions through `http://app:3000/api/inngest`.

## Main Development Commands

```bash
make up       # start the stack
make status   # show service health
make logs     # follow app, Inngest, and database logs
make restart  # recreate app and Inngest without deleting database data
make rebuild  # rebuild and recreate app and Inngest
make down     # stop the stack without deleting data
```

`npm run dev` and `make dev` are aliases for `make up`. To expose the running app for webhook testing, run `npm run dev:ngrok` separately.

### Open Drizzle Studio

Use this when you want to inspect or edit local database data without resetting it:

```bash
make studio
```

Run this in a second terminal while the stack is running. Host-side commands require Node 24 (`nvm use`) and `npm install`.

### Reset local database and open Drizzle Studio

Use this only when you intentionally want a fresh local database:

```bash
make db
```

This deletes only the local database volume, applies migrations, and opens Drizzle Studio. The app and Inngest remain stopped; run `make up` when you want to start them again. Dependencies and the Next.js cache are preserved.

### Fresh local database plus Polar sandbox cleanup

Use this when you need to clear both local database state and Polar sandbox customers:

```bash
npm run db:fresh
```

## Other Useful Commands

```bash
npm run lint           # Run ESLint
npm run lint:fix       # Fix auto-fixable lint issues
npm run format         # Format files with Prettier
npm run format:check   # Check formatting
npm run test:run       # Run Vitest once
npm run test           # Run Vitest in watch mode
```

## Notes

- Inngest functions are served from `/api/inngest`.
- Inngest local auto-discovery is disabled because Compose passes the explicit Next.js endpoint.
- Drizzle SQL query logs are opt-in. Add `DRIZZLE_LOG_QUERIES=true` to `.env.local`, then run `make restart`.

## Organizations

After signing in, a user creates one organization or accepts an invitation. Each
account belongs to one organization. The organization dashboard and plan are
shared by its members. Owners manage billing, owners and admins invite members,
and owners can change member roles. Invitations are sent through Resend, so
`RESEND_API_KEY`, `EMAIL_FROM`, and `NEXT_PUBLIC_APP_URL` must be set for the
invitation flow. Apply new migrations with `npm run db:migrate` when running
outside Docker; `make up` applies pending migrations automatically.

The original owner remains the billing owner. Organization deletion and owner
transfers are disabled until the app supports cancelling or transferring the
corresponding Polar subscription safely.

If an account has pending invitations, the organization setup page offers them
before creating a new organization. Someone who accidentally creates an
organization can still join an invitation if they are its sole owner, have no
outstanding invitations, and have no local or Polar billing activity. Joining
removes that empty organization and its local trial. Recovery needs a working
`POLAR_ACCESS_TOKEN` so billing can be checked; otherwise the switch is blocked.

## Deploy on Vercel

Vercel should use Node 24 for this project. The expected runtime is declared in `package.json`:

```json
"engines": {
  "node": "24.x"
}
```
