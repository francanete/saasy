# Saasy

Reusable SaaS starter built with Next.js, Better Auth, Drizzle, Polar, Inngest, Resend, and Tailwind CSS.

## Private development on the homelab

The canonical local runtime is one Docker Compose stack: Node 24/Next.js, Postgres 17 and Inngest. Docker and Tailscale are required; do not launch a second host `next dev` or Inngest instance. This project targets Node 24 (`.nvmrc` and `package.json`) for optional host-side commands as well as the dev container.

The ignored `.env.local` must have a unique local database password, a matching host-side `DATABASE_URL` using `127.0.0.1:5435`, a unique `BETTER_AUTH_SECRET`, and `NEXT_PUBLIC_APP_URL=https://omarchy-home.tailcb326a.ts.net:8455`. Copy `.env.example` in a new checkout and set these values without committing them. Compose overrides only the app container's `DATABASE_URL` to the internal `db:5432` address; host Drizzle tooling uses the loopback URL. The app and Inngest use Compose DNS names to communicate. A change to `.env.local` needs `make restart`, not a plain container restart.

```bash
make up       # build/start the stack, apply migrations and wait for health
make status   # inspect services
make logs     # follow app, Inngest and database logs
make restart  # recreate app and Inngest after env changes, preserving data
make rebuild  # rebuild/recreate app and Inngest, preserving data
make down     # stop without deleting volumes
```

`make dev` and `npm run dev` are aliases for the idempotent Compose start. App dependencies are refreshed from `package-lock.json` at container startup. Source is bind-mounted for hot reload; `node_modules` and `.next` live in named volumes and the app runs as the checkout's non-root owner (UID 1000 on this host). The local-only bindings are app `127.0.0.1:3300`, database `127.0.0.1:5435`, and Inngest `127.0.0.1:8292`; they are not LAN-exposed.

## Tailnet URLs

- [Saasy app](https://omarchy-home.tailcb326a.ts.net:8455/)
- [Saasy sign-in](https://omarchy-home.tailcb326a.ts.net:8455/login)
- [Inngest dev UI](https://omarchy-home.tailcb326a.ts.net:8456/)

These private Serve mappings are host configuration, not created by Compose:

```bash
tailscale serve --bg --https=8455 http://127.0.0.1:3300
tailscale serve --bg --https=8456 http://127.0.0.1:8292
tailscale serve status
```

The browser-visible origin must match `NEXT_PUBLIC_APP_URL`; the hostname is also permitted in `allowedDevOrigins` for Next.js hydration/HMR. Google OAuth requires its provider settings to allow `https://omarchy-home.tailcb326a.ts.net:8455/api/auth/callback/google`. The Resend key alone does not prove outgoing email works: the configured sender in `src/lib/config.ts` must be verified in Resend. Polar is configured for sandbox; a working homepage does not establish that sandbox checkout, signed webhooks or new-signup customer creation works. No public webhook tunnel starts: external providers cannot reach the tailnet-only instance. The Inngest dev UI is not protected by Saasy's login, so keep its Serve route private.

`make studio` starts host-side Drizzle Studio; check its default port 4983 first. `make db-reset` destroys Saasy's development volumes, including its database. `npm run db:fresh` also resets Polar **sandbox** customers and must not be used as an ordinary restart.

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
- Inngest local auto-discovery is disabled because the dev script already passes the explicit Next.js endpoint.
- Drizzle SQL query logs are opt-in. Enable them temporarily with:

```bash
DRIZZLE_LOG_QUERIES=true npm run dev
```

## Deploy on Vercel

Vercel should use Node 24 for this project. The expected runtime is declared in `package.json`:

```json
"engines": {
  "node": "24.x"
}
```
