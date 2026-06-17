# Payment Flow Hardening Plan

## Context

The current payment architecture has good building blocks: Polar checkout, Polar webhooks, checkout-success sanity sync, DB-backed access checks, and daily reconciliation. However, it is not yet robust enough to call “rock solid” for production. This plan captures the audit findings and breaks the work into PR-sized phases.

Direction decision: checkout should be authenticated-only. Guest checkout is not an intended product flow. The intended trial strategy is app-native trials controlled by this app: users can sign up and access the product for X days without checkout, then when the trial expires they are gated and must complete authenticated Polar checkout to continue.

## Current Payment Flow

### Checkout creation

File: `src/app/api/checkout/route.ts`

- Accepts a product slug.
- Uses the logged-in session if present.
- Allows guest checkout by email or full Polar-collected email.
- Creates a Polar checkout via the Polar SDK.

### Primary source-of-truth updates

File: `src/lib/auth.ts`

Polar webhook handlers are configured through the Better Auth Polar plugin:

- `onOrderPaid` handles one-time/LTD purchases.
- `onSubscriptionCreated` upserts recurring subscriptions.
- `onSubscriptionUpdated` updates status by Polar subscription ID.
- `onSubscriptionCanceled` marks canceled.

### Sanity/fallback sync

Files:

- `src/app/checkout/success/page.tsx`
- `src/components/checkout-success-content.tsx`
- `src/actions/subscription.ts`
- `src/lib/subscription.ts`
- `src/lib/inngest/jobs/sync-all-subscriptions.ts`

Current fallback paths:

- Checkout success page attempts immediate sync.
- Customer session token path uses Polar Customer Portal API.
- Admin API fallback syncs from Polar.
- Daily Inngest job reconciles all subscription rows.

### Access control

Files:

- `src/proxy.ts`
- `src/lib/subscription.ts`
- `src/lib/dal.ts`

Current behavior:

- `src/proxy.ts` protects `/dashboard` and `/checkout/success`.
- `getSubscriptionStatus()` reads from the DB only.
- `requirePaidAccess()` and protected API wrappers use DB subscription status.
- Proxy strips spoofable internal headers before injecting trusted subscription headers.

## Strong Existing Pieces

- Webhooks are treated as the primary source of truth.
- Unknown Polar statuses default to `CANCELED`, which is safe.
- Checkout ignores body email/user ID when a logged-in session exists.
- `externalCustomerId` is set for logged-in checkout.
- Guest checkout has a `resolveOrCreateUser()` path in webhook handling.
- Daily Polar reconciliation exists as a fallback.
- Proxy strips client-supplied internal subscription headers before injecting trusted ones.

## Key Risks / Gaps

### 1. Guest checkout is architecturally inconsistent

`src/app/api/checkout/route.ts` supports guest checkout, but `src/proxy.ts` protects `/checkout/success`.

That means a guest buyer may pay, return to `/checkout/success`, and immediately get redirected to `/login` before the success component can run. The UI also contains guest-oriented copy, but the route protection prevents that flow.

Decision: make checkout authenticated-only everywhere. Guest checkout is not part of the target architecture.

Rationale:

- The current pricing UI already requires a session before checkout.
- `/checkout/success` is protected, which is correct for authenticated checkout.
- Future trials should be app-native and start at signup without checkout, not through a guest Polar checkout.
- Payment should happen after the user is already known to the app, so Polar checkout can always receive `externalCustomerId` and map webhooks back to an internal user.

Desired cleanup:

- Require auth in `/api/checkout`.
- Remove guest email/full guest checkout branches.
- Keep `/checkout/success` protected.
- Keep webhook email lookup only as a defensive recovery path, not as a first-class guest checkout flow.

### 2. Webhook update/cancel events can silently no-op

`onSubscriptionUpdated` and `onSubscriptionCanceled` call `updateSubscriptionStatus()` using only `polarSubscriptionId`.

If Polar sends `subscription.updated` before `subscription.created`, or if the created webhook failed, the update does nothing.

Desired behavior:

- Update/cancel handlers should resolve the customer/product and upsert safely, or at least throw/log when the local row is missing so the issue is retried or visible.

### 3. No webhook event idempotency or audit table

The single subscription row makes some operations idempotent-ish, but there is no webhook event log.

Risks:

- Duplicate events can re-run analytics/revenue tracking.
- Out-of-order events can overwrite newer state.
- There is no audit trail for “customer paid but has no access”.
- There is no easy admin/debug view of payment event processing.

Desired behavior:

- Add a `polar_webhook_events` table with unique Polar event ID, event type, processing status, error message, and timestamps.

### 4. Webhooks can overwrite a better plan with a worse/stale plan

`upsertSubscription()` always updates the user’s single subscription row. The sync path chooses the best product by plan hierarchy, but webhook handlers do not.

Example risk:

1. User upgrades to Growth.
2. A delayed Starter webhook arrives later.
3. The row could be overwritten back to Starter.

Desired behavior:

- Webhook upserts should compare plan hierarchy and/or event freshness.
- Lower-tier stale events should not downgrade active higher-tier access unless the event explicitly represents the current effective entitlement.

### 5. Recurring access does not check `currentPeriodEnd`

`getSubscriptionStatus()` grants access when status is `ACTIVE` or `TRIALING` and plan is not `FREE`.

It does not check whether `currentPeriodEnd` is in the past. If webhook/sync fails to update a canceled/expired subscription, access can remain active indefinitely.

Desired behavior:

- Lifetime purchases can remain active without expiration.
- Recurring subscriptions should require active/trialing status and a valid period end when applicable.

### 6. Checkout success retry logic is split and incomplete

`src/components/checkout-success-content.tsx` has client retry loops, but `src/actions/subscription.ts` still has:

```ts
// TODO(human): implement syncWithRetries
```

Desired behavior:

- Complete server-side retry logic so all callers get consistent behavior.

### 7. Webhook handlers are buried inside auth config and under-tested

Important business logic lives inline inside `src/lib/auth.ts` plugin config. That makes isolated tests harder.

Desired behavior:

- Extract webhook business logic into testable functions.
- Keep Better Auth/Polar plugin callbacks thin.
- Add focused webhook tests.

## Target Architecture

### Checkout

- Checkout is authenticated-only.
- Enforce auth in `/api/checkout`.
- Remove guest email/full guest checkout branches and guest-oriented success copy.
- Keep `/checkout/success` protected.
- Always pass Polar `customerEmail` and `externalCustomerId` from the authenticated session.
- Keep webhook email lookup only as a defensive recovery path if Polar customer external ID is missing.

### App-native trials

Future trial behavior should be owned by this app, not by guest checkout.

Target flow:

1. User signs up or logs in.
2. App grants a native trial for X days without checkout.
3. User can access the dashboard during the trial.
4. Trial expires.
5. Access control sends the user to `/gate`.
6. User completes authenticated Polar checkout.
7. Webhook/sync activates paid access.

Design notes:

- Avoid coupling app-native trial creation to Polar checkout.
- Avoid relying on guest checkout to create users.
- Be careful with naming: current code supports Polar `trialing` status, but the future app-native trial should be clearly modeled so it is not confused with Polar-native trials.
- Consider representing app-native trial explicitly, for example with `trialStartsAt`/`trialEndsAt`, an `accessType`, or a dedicated trial state, rather than overloading Polar subscription state.

### Webhook ingestion

- Verify signature through Polar plugin.
- Log every webhook event by unique event ID.
- Process idempotently.
- Store processing result/error.
- Throw/retry only for recoverable failures.

### Subscription state

- Make webhook handlers safe when update/cancel arrives before create.
- Compare plan hierarchy and avoid stale downgrades.
- Check period end for recurring access.
- Keep one derived current subscription row, but consider storing raw events/orders/subscriptions for audit/debugging.

### Sanity sync

- Complete server-side retries in `syncSubscriptionAction`.
- Keep checkout success fast-path with `customer_session_token`.
- Keep daily Inngest reconciliation.
- Consider an admin/manual “sync subscription” tool before production.

### Tests

Add focused coverage for:

- Webhook created grants access.
- Webhook update before create does not silently no-op.
- Canceled subscription revokes access.
- Expired recurring period revokes access.
- LTD purchase grants lifetime access.
- Checkout rejects unauthenticated users and always uses session user data.
- App-native trial access and expired-trial gate behavior once trial support is implemented.
- Stale/lower-tier webhook does not downgrade newer higher-tier access.

## Suggested PR Breakdown

### PR 1: Enforce authenticated-only checkout

Goal: remove guest checkout ambiguity and make payment always map to a known app user.

Recommended scope:

- Require session in `src/app/api/checkout/route.ts`.
- Return `401` when checkout is requested without a session.
- Remove guest checkout branches and request-body `email` handling.
- Always pass Polar `customerEmail` and `externalCustomerId` from the authenticated session.
- Keep `/checkout/success` protected.
- Remove or update guest-oriented success-page copy.
- Update checkout tests.

Verification:

- `npm run test:run -- tests/api/checkout.test.ts`
- Manual checkout flow in Polar sandbox.

### PR 2: Extract webhook business logic and add tests

Goal: make payment state transitions testable.

Recommended scope:

- Move Polar webhook handling logic out of inline `src/lib/auth.ts` callbacks into a dedicated module, for example `src/lib/payment-webhooks.ts` or `src/lib/polar-webhooks.ts`.
- Keep plugin callbacks thin.
- Add tests for order paid, subscription created, updated, and canceled.

Verification:

- New webhook unit tests.
- Existing auth/build tests still pass.

### PR 3: Add webhook event audit/idempotency

Goal: prevent duplicate processing and improve support/debugging.

Recommended scope:

- Add DB table for webhook events.
- Generate Drizzle migration.
- Record event ID, event type, processing status, error message, and timestamps.
- Make duplicate webhook delivery a no-op or safe replay.
- Avoid duplicate revenue tracking.

Verification:

- Migration generation/check.
- Tests for duplicate event handling.

### PR 4: Harden subscription state transitions

Goal: make out-of-order and stale events safe.

Recommended scope:

- Make update/cancel handlers safe when no local row exists.
- Compare plan hierarchy before overwriting current access.
- Prevent stale/lower-tier events from downgrading a newer higher-tier active entitlement unless intentionally modeled.
- Consider storing `lastEventAt` or equivalent freshness metadata.

Verification:

- Tests for update-before-create.
- Tests for stale lower-tier event after upgrade.

### PR 5: Tighten access checks for recurring subscriptions

Goal: fail closed when a recurring period expires and no fresh sync arrives.

Recommended scope:

- Update `getSubscriptionStatus()` to account for `currentPeriodEnd` for recurring subscriptions.
- Preserve lifetime access behavior for `billingType === "one_time"`.
- Consider grace period only if product requirements need it.

Verification:

- Tests for active recurring subscription with future period end.
- Tests for expired recurring subscription.
- Tests for lifetime purchase.

### PR 6: Complete sanity sync retry behavior

Goal: make post-checkout sync reliable and centralized.

Recommended scope:

- Implement `syncWithRetries()` in `src/actions/subscription.ts`.
- Use exponential backoff or fixed delays.
- After each attempt, check `hasPaidAccess()` and return early if webhook already granted access.
- Keep client retry UX, but avoid duplicating all important retry behavior in the client.

Verification:

- Tests for retry success.
- Tests for early success when webhook grants access during retry.
- Tests for final failure while access is still false.

### PR 7: Add app-native trial access

Goal: let users start a controlled app-native trial without Polar checkout, then gate them after X days until they pay.

Recommended scope:

- Add explicit app-native trial fields/state to the access model.
- Grant a trial when a user signs up, based on configured trial duration.
- Update `getSubscriptionStatus()` or a successor access helper to treat active app-native trials as access-granting.
- Update proxy/gate behavior so expired trials are redirected to `/gate`.
- Update dashboard/nav/gate copy to distinguish trial, expired trial, and paid access.
- Adjust the trial-ending reminder job to use app-native trial state rather than assuming Polar-native `TRIALING` rows, if that remains the chosen model.
- Keep checkout authenticated-only when converting an expired trial to paid access.

Verification:

- Tests for new signup receiving trial access.
- Tests for active trial access.
- Tests for expired trial redirecting to gate.
- Tests for paid checkout restoring access after trial expiry.

## Open Decisions

1. What exact schema should represent app-native trials: fields on `subscriptions`, a separate entitlement/access table, or a dedicated trial table?
2. Should recurring paid access include a grace period after `currentPeriodEnd`?
3. Should we store raw order/subscription snapshots, or only webhook event metadata?
4. Should admin/manual sync UI be included before launch, or only a server action/script?
5. Should analytics/revenue events be driven directly from webhooks, or from idempotent internal domain events after webhook processing?
6. Should Polar-native `TRIALING` continue to be supported defensively, or should trial display/reminders move entirely to app-native trial state?

## Recommended Immediate Next Step

Start with PR 1: enforce authenticated-only checkout. Guest checkout is not part of the target architecture. App-native trial support should be handled in a later dedicated PR after checkout/payment mapping is simplified.
