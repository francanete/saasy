# Saasy

Reusable SaaS starter built with Next.js, Better Auth, Drizzle, Polar, Inngest, Resend, and Tailwind CSS.

## Local Runtime

This project targets Node 24 to match Vercel.

```bash
nvm install 24
nvm use
npm install
```

The repo includes `.nvmrc`, so after Node 24 is installed you can usually run:

```bash
nvm use
```

## Main Development Commands

### Start the full local app stack

Use this for normal product development:

```bash
make dev
```

This will:

1. Start local Postgres with Docker Compose.
2. Run local Drizzle migrations.
3. Start the dev stack:
   - Next.js app on `http://localhost:3000`
   - Inngest dev server
   - ngrok tunnel for webhook testing

`make dev` checks that Node 24 is active before starting. If it fails, run:

```bash
nvm install 24
nvm use
make dev
```

### Restart the app stack

Use this when ports are stuck or you want a clean app restart without touching the database:

```bash
make restart
```

This kills common dev ports and starts the app stack again.

### Open Drizzle Studio

Use this when you want to inspect or edit local database data without resetting it:

```bash
make studio
```

Run this in a second terminal while `make dev` is running.

### Reset local database and open Drizzle Studio

Use this only when you intentionally want a fresh local database:

```bash
make db
```

This resets the local DB volume, applies migrations, and opens Drizzle Studio.

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
