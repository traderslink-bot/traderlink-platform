# Membership QA corrections — 2026-09-27

Status: Historical correction record. Local membership implementation and QA are now complete under the revised scope; see the [final checkpoint](membership-local-acceptance-checkpoint.md). Live payment integration is deferred to a separate goal.

Controlling [plan](membership-and-subscription-platform-plan.md), [progress](membership-and-subscription-platform-progress.md), and original [QA findings](membership-and-subscription-platform-qa-2026-09-27.md).

## Corrections implemented

- Database-backed feature selection, registration, arbitrary provider keys, and optional unlimited numeric limits. Unknown submitted feature keys are rejected rather than silently dropped. Starter synchronization preserves owner labels.
- Existing Journal Administration Memberships sections now contain management forms: draft editing/versioning/publication, plan details, providers, offers, trials, Discord rules, member grants/revocation, private-link revocation, subscription controls, and audit history.
- Money parsing/display respects currency precision; paid offers require prices; initial and renewal prices are separately shown; billing uses explicit days, weeks, calendar months, or years.
- Effective dates and capacity affect overview counts. Recoverable action errors preserve form inputs.
- Atomic reservation/fulfillment binds private links and trial enrollment to stable users. Capacity includes reservations, duplicate fulfillment does not consume twice, and revoked/expired links fail closed.
- Stripe checkout, free enrollment, webhook signature verification, duplicate/stale event handling, paid-period grants, cancellation, and member billing portal are implemented. Failed-payment events do not immediately revoke other or already-paid access. Owner renewal requests are audited.
- Signed Whop membership projection matches linked identity and exact provider product/plan, preserves existing plan versions, and requires a claim for private offers. Unknown/unlinked identity processing returns a retry response; this is not a durable unlinked-event inbox.
- Custom external checkout offers support explicit owner payment confirmation. Registering a provider does not manufacture an automatic API adapter.
- Verified Discord guild/role rules contribute additive access and purchase eligibility; owner controls roles, dates and verification freshness.
- Dashboard access and the shared AI-review paid-access policy consume membership access additively. Existing free/beta and legacy Whop paths were not globally removed.
- Member Plan & billing page added under Account. Public plans and secret noindex/no-referrer offer pages retained; secret routes remain absent from public navigation and sitemap.
- Help Center paid-plan guidance updated for the implemented membership flows.

## Verification

- `verify-platform-membership-foundation.ts`: passed with disposable SQLite fixtures. Includes custom feature form selection, unlimited limits, isolated/date-bounded grants, private-link capacity/revocation, trial capacity/expiry, currency precision, Stripe signed/duplicate/failed-payment/cancel-at-renewal events, Discord roles/freshness, and linked Whop duplicate projection.
- `verify-platform-membership-migrations.ts`: all 128 registered migration SQL definitions applied to an in-memory database; zero foreign-key violations. This is not a production migration, backup/restore rehearsal, or complete initializer-metadata proof.
- Focused TypeScript program covering membership sources, owner/member/public routes, webhooks and both verifiers: zero diagnostics.
- Focused ESLint: passed for the correction slice (see final task result for latest execution).
- No Vitest, full regression, production build, live processor charge, real database mutation, commit, push, or deployment performed.
- Browser/server acceptance not performed: approximately 1.3 GiB free RAM was observed during this task. No additional application server was started on the resource-constrained shared computer.

## Remaining acceptance and product work

- Real Stripe test-mode checkout/portal/webhook delivery and Whop signed delivery require configured provider accounts and a migrated isolated QA runtime. Fixture projection is not end-to-end payment proof. Validate Whop webhook secret format against the configured provider contract before activation.
- Browser review of all approved owner forms, member flows, responsive layout, HTTP robots/referrer headers and authorization remains open.
- Full per-feature enforcement remains incomplete. The dashboard/shared AI policy integrations do not prove every downstream coaching or AI issuance gate consumes new memberships. Custom future features need their owning module's enforcement integration.
- Whole-app trial snapshot convenience flow, owner-selected existing-member migration and scheduled manual recurring grants remain unfinished roadmap items. Fixed-date/lifetime grants and processor-backed recurring offers are implemented.
- External-checkout claims currently reserve for 60 minutes; settlement outside that window needs owner-grant handling. Arbitrary external processors do not have automatic settlement adapters.
- Paid one-time offers currently grant lifetime access except time-bounded trial claims. Do not advertise arbitrary fixed-duration one-time paid access as implemented.
- Owner visual approval and release acceptance are not complete. Do not mark the complete membership platform finished or activate global paywalls from this record.

## Configuration and shared-work boundary

New endpoints: `/api/webhooks/membership-stripe` and `/api/webhooks/membership-whop`; existing legacy Whop endpoint unchanged.

Stripe configuration names: `STRIPE_SECRET_KEY`, `STRIPE_MEMBERSHIP_WEBHOOK_SECRET`, optional `TRADERLINK_MEMBERSHIP_APP_ORIGIN`. Whop configuration names: `WHOP_MEMBERSHIP_WEBHOOK_SECRET`, `WHOP_COMPANY_ID`, `WHOP_API_VERSION_DATE`, `TRADERLINK_PLATFORM_WHOP_IDENTITY_HMAC_KEY`. Values must never be committed or printed.

Migration 0133 is additive relative to the initial membership foundation; it preserves feature/receipt rows while widening provider keys and unlimited limits, adds calendar intervals and claim storage. No migration was applied to the real database.

Membership-owned files are the membership contracts/server directory, migrations 0132/0133, membership admin/public/account routes, new membership webhook routes and focused verifiers. Shared files include the migration manifest, request-scope authorization, shared AI paid-access policy, account/admin navigation, public navigation/sitemap and Help. Those shared files contain unrelated changes from other tasks: preserve them and use hunk-level isolation before any future commit/release. This task did not stage or publish the shared checkout.
