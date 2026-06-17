# PR 7 — App-native trial access

## Goal

Add an app-owned trial system that grants new users temporary dashboard access without Polar checkout, then gates them on expiry until they complete authenticated checkout.

## Success criteria

- Native trial can be enabled/disabled from config.
- Native trial duration is configurable in code.
- New signups can receive a trial automatically.
- Active native trial grants dashboard access.
- Expired native trial redirects to `/gate`.
- Paid Polar checkout still works and overrides trial state for access.
- Trial reminder email/job uses app-native trial state, not Polar `TRIALING`.

## Non-goals

- No webhook/idempotency hardening.
- No plan hierarchy / downgrade protection changes.
- No recurring `currentPeriodEnd` access fix.
- No checkout guest flow reintroduction.
- No broader pricing redesign.

## Proposed architecture

### 1) Separate entitlement sources

Treat access as the result of two independent sources:

1. **Paid subscription access** — Polar-backed, stored in the existing `subscriptions` row.
2. **App-native trial access** — app-owned, stored explicitly in the app database and not represented by Polar `TRIALING`.

Access resolution should be:

- paid access wins
- otherwise active native trial grants access
- otherwise user is gated

This avoids overloading Polar subscription state for app-controlled trial lifecycle.

### 2) Config-driven trial toggle

Add a small config surface in `src/lib/config.ts`, for example:

- `appConfig.pricing.allowNativeTrial: boolean`
- `appConfig.pricing.nativeTrialDays: number`

Optional: if you want the trial to be easy to disable in one place, keep these adjacent to existing pricing settings.

### 3) Trial state shape

Preferred implementation: add explicit trial fields to the user record or a dedicated entitlement table.

Recommended default for this PR: **dedicated trial fields on the user record** if the repo already prefers keeping one row per user for access state; otherwise a small dedicated `user_trials` table if you want clearer separation.

Minimum data needed:

- `trialStartedAt`
- `trialEndsAt`
- `trialDisabledAt` or `trialConsumedAt` (optional, if you want to prevent re-granting)
- `trialSource` / `trialStatus` only if needed for clarity

Design rule: trial should be idempotent and should not be re-issued on every login.

### 4) Trial grant timing

Best default: grant the trial on **first successful signup**.

Behavior:

- if native trial is disabled → no trial record created
- if enabled and user has never had a trial → create it immediately on signup
- if the user already has a trial or paid access → do not create another trial

This keeps the lifecycle tied to account creation, not repeated sign-ins.

### 5) Paid checkout coexistence

Checkout remains the conversion path after trial expiry.

Rules:

- active trial user can still open pricing and pay early
- expired trial user can still open pricing and pay
- checkout does not depend on trial state
- paid subscription state overrides trial for access checks

This means a paid user on an active trial is still treated as paid for access.

## User flow design

### New signup

If native trial is enabled:

1. user signs up
2. account is created
3. native trial is granted immediately
4. user lands in dashboard
5. dashboard/nav copy shows trial status and remaining days

If native trial is disabled:

1. user signs up
2. user lands in the normal post-signup destination
3. access follows the existing paid/free gating rules

### Sign in

On sign-in, the app should only **read** state, not create new trial state.

Possible outcomes:

- paid access → dashboard
- active trial → dashboard
- expired trial and no paid access → `/gate`
- no trial and no paid access → follow existing free/gated behavior

### Pricing checkout click

When the user clicks checkout:

- if authenticated, create checkout normally
- if not authenticated, send to login
- if on active trial, checkout still works and upgrades them
- if on expired trial, checkout restores access

### Gate page

The gate page should explain:

- trial expired
- continue by choosing a plan
- if paid already, redirect away

Copy should distinguish trial-expired users from unpaid free users if the product supports both.

## Access resolution design

Create or extend a single access helper so proxy, gate, dashboard, and server-side checks all agree.

Suggested shape:

- `getSubscriptionStatus(userId)` continues to return paid subscription details
- add native-trial fields to the returned access object, or add a higher-level `getAccessStatus(userId)` helper that composes:
  - paid status
  - trial status
  - effective access

Recommendation: **introduce a successor access helper** if that keeps the paid subscription logic untouched and makes trial composition explicit.

Effective access rules:

- if paid subscription is active → access granted
- else if native trial exists and `now < trialEndsAt` → access granted
- else → access denied

## Proxy and routing behavior

Update route gating so the proxy understands native trial state.

Routes to keep:

- `/dashboard` protected
- `/checkout/success` protected
- `/gate` accessible only to users who need to buy/convert

Behavior:

- authenticated paid users → dashboard
- authenticated active-trial users → dashboard
- authenticated expired-trial users → `/gate`
- unauthenticated users → `/login` for protected routes

If you keep using `getSubscriptionStatus()` directly in proxy, trial state needs to be part of the same effective access result. If that gets messy, the proxy should switch to the new composed access helper.

## Trial reminder job

The current reminder job queries Polar `TRIALING` recurring subscriptions. That should change.

New behavior:

- query app-native trials ending in the reminder window
- batch by user as today
- send trial-ending email based on native trial end date
- skip users without matching active trial data

If you want reminder copy to distinguish paid-subscription trials from native trials later, keep the email key separate.

## UI copy changes

Update copy in:

- pricing section/cards
- gate page
- dashboard entry points / nav badges
- any onboarding or success surfaces that currently imply Polar trialing

Suggested terminology:

- “Free trial” only when it is app-native
- “Trial ends in X days” for active native trial
- “Trial expired” on gate
- “Continue with paid plan” on pricing/gate

Avoid using Polar `TRIALING` language unless the code is actually reading Polar trial state.

## Implementation phases

### Phase 1 — model and config

- add trial config flags and duration
- choose the storage shape for trial state
- add migration if schema changes are needed
- add helper(s) for trial creation and expiry checks

### Phase 2 — grant + access composition

- grant trial on signup
- add effective access helper
- wire proxy/gate/dashboard checks to the composed access result

### Phase 3 — UX updates

- update pricing CTA/supporting copy
- update gate page copy
- update dashboard/nav badges to show trial state

### Phase 4 — reminder job

- switch reminder query from Polar `TRIALING` to native trial state
- update tests for reminder behavior

### Phase 5 — tests

Add focused tests for:

- signup creates trial when enabled
- signup does not create trial when disabled
- active trial grants access
- expired trial denies access / redirects to gate
- paid checkout still works during trial
- paid access overrides trial
- reminder job finds native trials, not Polar `TRIALING`

## Tradeoffs

### Dedicated trial table vs fields on existing row

- **Fields on existing row**: fewer tables, simpler migration, easier to query if there is already a 1:1 access row per user.
- **Dedicated table**: clearer separation of concerns, easier future expansion, better if access state is becoming a first-class domain.

For this repo, I would lean toward the smallest change that keeps trial state explicit and non-Polar.

### Auto-grant on signup vs dedicated button

- **Auto-grant on signup** is simpler and less error-prone.
- A dedicated “Start free trial” button is only useful if you want a manual opt-in funnel.

Recommendation: auto-grant on signup, and if you want marketing CTA support, make the pricing button route to signup rather than starting trial directly.

### Reusing `TRIALING` vs explicit app-native trial

Do **not** reuse `TRIALING` as the primary model. It couples app-owned trialing to Polar semantics and makes access/reminder logic ambiguous.

## Open questions to resolve before coding

1. Should trial state live on the existing access/subscription row, or in a dedicated trial table?
2. Should the trial be granted to every new signup automatically, or only when they sign up from a pricing CTA?
3. Should expired-trial users see `/gate` or a dedicated expired-trial explainer page?
4. Should the dashboard show a countdown badge, or just a simple “trial active” marker?

## Validation plan

- unit tests for access helper behavior
- unit tests for trial grant on signup
- proxy/gate tests for redirect behavior
- reminder job tests for native trial query
- pricing/checkout regression checks to ensure payment still works while trial exists

## Recommendation

Use an app-native trial that is:

- config-driven
- granted on first signup
- stored explicitly outside Polar status semantics
- composed with paid access in one helper
- surfaced in proxy/gate/UI copy

That keeps PR 7 independent and safe to ship before the webhook/payment hardening PRs.
