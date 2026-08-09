# AI Reviews Beta Handoff

## Purpose

This is the durable resume point for the AI Reviews beta. A continuation chat
must begin with a fresh QA pass against this record before changing source.
Feature behavior remains governed by the linked plans; this file records the
accepted current state, remaining launch work and safe continuation boundary.

## Source and runtime checkpoint

- Canonical checkout: `C:\Users\jerac\Documents\TraderLink\traderlink-platform`.
- Branch: `codex/traderlink-platform-replacement`.
- AI Reviews checkpoint: `68cb4d4d3b62b59236cb68d2ab2e2a4e8dc92136`
  (`feat(ai-reviews): complete beta safeguards and access`).
- The local Platform database and manifest are current at 51/51 through
  `0051_coach_ai_review_cache_write_accounting`.
- Migrations 0050 and 0051 were disposable-copy verified, backed up, locally
  applied and frozen. Local application is not production application.
- Port 3010 is intentionally closed. Do not start, stop or probe a shared
  runtime without coordination.
- Nothing in this checkpoint was pushed, deployed, scheduled for hosted use or
  enabled for customer provider calls.
- The checkout contains unrelated concurrent Moomoo, Trade Tracker, Admin,
  language-inventory and local-support changes. Do not stage, revert, adopt or
  rewrite them. Stage only an explicit AI Reviews/document allowlist.

## Accepted product and evidence contract

1. A weekly review covers one complete US-equities market-calendar trading
   cohort. Holiday-shortened weeks are complete weeks; there is no five-review
   or five-trading-day requirement. A two-week review covers two cohorts.
2. A weekly or two-week period crossing a month boundary is not split. Its
   exact dated execution facts, saved notes, tags and rule results remain
   available to that period.
3. A monthly review covers one exact `America/New_York` calendar month. Its
   statistics are rebuilt from exact-month raw facts. Cross-month weekly review
   prose may be supplied only as labelled process narrative and can never add
   facts, P/L, trades, rule counts or tag frequencies from outside the month.
   Monthly-only accounts do not depend on weekly reviews.
4. Verified executions do not require a completed Trade Tracker review. Every
   non-empty saved note, saved tag and recorded rule result present when the
   immutable evidence snapshot freezes may be included. Completion state is
   preserved; it is not a content-inclusion gate.
5. `Automatic after 12 hours` freezes and generates after the final eligible
   market session's post-market seal without waiting for daily completion.
   `Extra time for Trade Tracker reviews` may start sooner when the relevant
   created reviews are marked complete or the trader selects `Generate now`;
   otherwise it freezes automatically at the following trading week's final
   post-market seal. This is extra time, not homework or a forced wait.
6. A context-free single closed trade carries once into a two-week evidence
   period rather than being discarded. Two closed trades, one trade with saved
   context, or substantive saved reflection evidence may satisfy the useful-
   evidence gate. Thin evidence must produce a narrow, honest review and never
   invented patterns.
7. Monthly reviews become due the next day after month end and remain due until
   successfully requested. Weekend and holiday boundaries use the stored,
   verified market calendar; they never invent trading sessions.
8. All reads, snapshots, attempts and saved reviews remain owner/workspace/
   Trade-Tracker-account scoped. Exact source facts, original dates, account
   timezone evidence and Eastern market-date derivations remain distinct.

## Accepted paid access, provider and safeguards

- Whop owns product, price, trial, renewal and membership truth. TraderLink
  stores a privacy-safe, replay-safe access projection and uses Whop OAuth with
  PKCE to bind an authenticated user. It does not authorize by email or social
  matching and stores no OAuth tokens, payment data or raw identifiers.
- Cancellation at period end retains access through that paid period.
  `payment.failed` is operational evidence only; `membership.deactivated` is
  authoritative. Saved reviews remain readable after access ends.
- The selected default model is `gpt-5.6-luna`. Current price classes are USD
  1.00 per million ordinary-input tokens, USD 0.10 cache-read, USD 1.25 cache-
  write and USD 6.00 output. All four classes are immutable receipt data.
- The normal safeguard is USD 2.00 per TraderLink subscriber per stored Whop
  paid cycle across all of that subscriber's Trade Tracker accounts and all AI
  Reviews. AI Chat is completely separate.
- One subscriber reaching their limit cannot block another. Frozen work remains
  retryable, and saved reviews are never regenerated merely when reopened.
- The global trailing-30-day amount is an Admin warning, not an automatic
  cutoff. Only the separate emergency global stop may pause all subscribers.
  The Admin master switch is the deliberate launch/maintenance switch.
- The owner-approved synthetic Luna cache-write proof made exactly one provider
  call, persisted no review, used 2,286 input tokens (2,283 cache-write, three
  ordinary, zero cache-read) and 916 output tokens, for USD 0.00835275.

## Local verification completed

- Disposable migration, backup/restore, SQLite integrity and foreign-key
  checks passed through 51/51.
- Focused cache-write pricing, subscriber paid-cycle isolation, warning/
  emergency behavior, timing and scheduler-health verifiers passed.
- Focused ESLint and staged diff checks passed before the checkpoint commit.
- No Vitest was run, as required by `AGENTS.md`.
- The full mixed-checkout TypeScript run previously remained nonzero because of
  unrelated concurrent source errors; the owned-file filter reported no AI
  Reviews safeguard/cache-write error. Fresh QA must re-check current truth.
- The owner approved the Account, AI Reviews, Admin and saved-review visuals.

## Production go-live work still required

Local beta completion is not hosted readiness. Complete these gates in order.

### 1. Provision the accepted durable hosting architecture

The replacement uses `better-sqlite3` and protected local paths. Vercel
Functions cannot use their ephemeral local filesystem as this database's
durable authority. The accepted near-term architecture is persistent single-
node compute with one persistent disk and one SQLite writer. Select a provider
that proves those properties; the vendor has not been chosen.

Railway is only one possible persistent host, not a requirement or current
dependency. Existing Vercel/Neon use for the public site does not make the
replacement database Vercel-ready. A later Vercel-hosted complete application
would first require a deliberate Platform-wide repository/migration port to
Neon/Postgres with equivalent transaction, isolation, migration, backup and
restore proof. Never split one SQLite authority across stateless instances.

### 2. Prepare the exact production release and database

- Reconcile concurrent work into a clean, reviewed release commit. Never deploy
  this dirty checkout or upload local test data without owner approval.
- Provision production storage outside the source tree, apply or port every
  registered migration in order, and verify registry count, schema digest,
  table counts, foreign keys, integrity, WAL/synchronous mode and one writer.
- Transfer only authorized real data after a preview. Preserve provenance,
  exact values, trading dates, timezones and account isolation.
- Create an off-host backup and prove an independent production-format restore.
  Record retention, recovery ownership and rollback boundaries.

### 3. Configure server-only environment and identity

Use the selected host's secret store, never Git or client code:

- Platform database/evidence paths and recovery keys in the operational
  inventory;
- production authentication, callback origin, cookie/domain and public base URL;
- `OPENAI_API_KEY` and `CRON_SECRET`;
- `WHOP_API_KEY`, `WHOP_WEBHOOK_SECRET`, `WHOP_COMPANY_ID`,
  `WHOP_AI_REVIEWS_PRODUCT_IDS`, `WHOP_AI_REVIEWS_CHECKOUT_URL`,
  `WHOP_BILLING_PORTAL_URL`, `WHOP_OAUTH_CLIENT_ID`,
  `WHOP_OAUTH_REDIRECT_URI`, `WHOP_API_VERSION_DATE`, and
  `TRADERLINK_PLATFORM_WHOP_IDENTITY_HMAC_KEY`.

Verify HTTPS, secure cookies, exact OAuth callbacks and allowed origins. Ensure
responses, browser bundles, artifacts and logs reveal no secrets, identities,
broker identifiers or review evidence.

### 4. Configure and accept Whop in the hosted environment

- Configure the accepted company/product allowlist, checkout and billing portal.
- Register `/api/billing/whop/callback`, start linking through
  `/api/billing/whop/connect`, and register `/api/webhooks/whop`.
- Verify activation, duplicate/out-of-order delivery, cancel-at-period-end,
  renewal, retryable payment failure, authoritative deactivation, relinking and
  paginated reconciliation.
- Confirm absence from one reconciliation response never revokes access and
  Admin stores/displays only privacy-safe aggregate health.

### 5. Verify and schedule the market calendar

- Invoke `/api/cron/ai-review-calendar` with `Authorization: Bearer
  <CRON_SECRET>`. It fetches Nasdaq and NYSE, verifies agreement and stores
  coverage so ordinary review reads do not repeatedly fetch those websites.
- Prove the current and next required year before periods cross the coverage
  boundary. Schedule refresh/retry early enough for source publication delays.
  Conflict or unavailable coverage stays visible and fail-closed; never guess.

### 6. Configure provider and protected scheduler

- In Admin, verify Luna, all four prices, cadence burst limits, USD 2 subscriber
  safeguard, non-blocking warning, optional emergency stop and master switch.
- Keep issuance off until launch gates pass. Run one controlled hosted test-
  subscriber acceptance and verify reservation, cache-write usage receipt,
  persistence, no-call reopening, retry and subscriber isolation.
- Invoke `/api/cron/ai-reviews` with the same server-only bearer credential on
  a bounded recurring schedule. It is host-neutral: use Vercel Cron only if the
  complete-app architecture becomes Vercel-compatible; otherwise use the
  selected host's scheduler. Add `vercel.json` cron only after that decision.
- Verify one scheduler owner, overlap protection, idempotency, oldest-first
  retry, aggregate Admin run records, alerts and safe restart.

### 7. Final hosted acceptance and activation

- Run low-resource focused verification, then required full TypeScript/build/
  architecture checks from a clean release checkpoint.
- Perform authenticated desktop/mobile checks for Account, Trade Tracker, AI
  Reviews detail/reopen, Whop linking and Admin using at least two isolated
  users and multiple accounts.
- Exercise holiday-shortened and cross-month weeks, exact month end on weekday/
  weekend/holiday, first partial month, monthly-only, thin-evidence carry,
  both timing modes, retries, USD 2 subscriber isolation, warning and emergency.
- Enable paid beta only after database, Whop, calendar, provider, scheduler,
  observability, backup and rollback gates pass. Monitor initial real cycles and
  compare provider invoices with stored four-rate receipts.

### 8. Rollback and incidents

- For an AI-only rollback, turn off the Admin master switch and stop the
  scheduler. Retain frozen requests, receipts and saved reviews.
- Rotate compromised OpenAI, Whop, cron or identity secrets independently.
- Never reverse an irreversible migration or delete review evidence. Restore
  only through the tested runbook and reconcile post-backup Whop events.

## QA-first continuation instructions

The next chat begins read-only and resource-light:

1. Read `AGENTS.md`, the AI Reviews plan/progress files, this handoff, the live
   launch checklist and current source/history.
2. Confirm checkout, branch, HEAD, dirty-file ownership, port state and
   migration manifest/database count without starting a server.
3. Audit timing/calendar, evidence snapshots, provider package, storage/reopen,
   Whop entitlement, subscriber budgets, Admin controls, scheduler routes,
   owner/account isolation and UI disclosures.
4. Classify findings as beta blocker, hosted-launch gate, deliberate inactive
   control or unrelated concurrent work. Inactive hosted configuration is not
   automatically a code defect.
5. Fix genuine in-scope blockers, update controlling documents and make narrow
   commits for that chat's own completed work. Do not push, deploy, activate
   provider/scheduler/Whop behavior, run migrations or touch port 3010 unless
   separately authorized and coordinated.
6. Assume the computer is resource constrained: run one check at a time, cap
   Node memory near 1 GB, avoid Turbopack/parallel browser probes, and no Vitest.

## Controlling links

- [AI Reviews Plan](ai-weekly-review-plan.md)
- [Weekly and Monthly Boundary Progress](ai-weekly-monthly-review-boundary-progress.md)
- [Provider Plan](ai-reviews-provider-and-whop-access-plan.md)
- [Provider Progress](ai-reviews-provider-and-whop-access-progress.md)
- [Safeguards Plan](ai-reviews-safeguards-and-presentation-plan.md)
- [Safeguards Progress](ai-reviews-safeguards-and-presentation-progress.md)
- [Live Launch Readiness](traderlink-platform-live-launch-readiness.md)
- [Operational Inventory](operational-and-configuration-inventory.md)
- [Migration Progress](migration-progress.md)
- [Migration Register](migration-register.md)
