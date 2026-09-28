# TraderLink Membership And Subscription Platform Progress

**Status:** Local membership implementation and QA complete under the revised owner scope. Payment integration/verification is a separate final goal; no deployment is claimed.

**Current record:** [Final local acceptance checkpoint](membership-local-acceptance-checkpoint.md). It supersedes the historical in-progress and blocker notes below and records external verification limits.

**Plan:** [Membership And Subscription Platform Plan](membership-and-subscription-platform-plan.md)

## Owner-requested QA corrections - active

The owner explicitly requested fixes for the QA findings. Implementation is
underway on the existing approved Memberships UI structure. The complete
requirement inventory remains in the QA report; no outstanding workflow is
considered complete merely because its database table exists.

- Implemented database-backed feature selection and recoverable form feedback.
- Added management actions/forms for features, providers, draft versions,
  publishing, offer creation/status, trials, individual grants and revocation.
- Added additive migration 0133 for open provider receipts, calendar billing
  intervals and transactionally reserved claims; original migration unchanged.
- Corrected money formatting and time-aware overview counts.
- Added atomic private-link reservation and free fulfillment with repeat-safe
  claims. Paid checkout and lifecycle integration remain in progress.
- Focused lint passed for this batch. Disposable checks are being expanded;
  browser acceptance and full migration-chain rehearsal remain pending.

## Checkpoint 1 - provider-neutral foundation

- [x] Confirm Stripe-first website/app and Whop-first Discord channel policy.
- [x] Confirm additive grants, immutable versions, owner-selected migration,
  rule/manual free plans and once-per-campaign trials.
- [x] Reserve migration `0132_platform_membership_foundation` after the active
  Communities migration sequence through `0131`.
- [x] Add extensible owner-controlled feature definitions, with built-in
  starter definitions and no closed commercial allowlist.
- [x] Add plan, version, feature, offer, trial, subscription, entitlement,
  Discord-offer, provider-receipt and audit storage contracts.
- [x] Add a provider-neutral repository and effective-access resolver.
- [x] Focused ESLint passed for the membership contracts, migration and
  repository.
- [x] Focused runtime imports passed after using the repository's untracked
  local Node user-info fallback; the first attempt had stopped before project
  code because the low-resource host returned `uv_os_get_passwd` out of memory.
- [ ] Preserve the verified slice in a narrow local commit.

## Checkpoint 2 - owner UI approval

- [x] Owner approved the exact Memberships navigation and labels.
- [x] Owner approved the plan builder and feature selector structure.
- [x] Owner approved Stripe/Whop offer, trial, Discord and grant flow structure.
- [x] Add the owner Memberships overview under the existing private Journal
  Administration authorization boundary.
- [x] Add indexable `/plans` catalog rendering for active public website offers.
- [x] Add unlisted `/plans/invite/[secret]` catalogs with hashed, expiring,
  revocable and claim-limited share-link storage plus `noindex` metadata.
- [x] Add the approved public Plans link to public navigation and sitemap while
  keeping private invite routes out of both.
- [x] Connect safe draft-plan creation and one-time private-link generation.
- [x] Focused ESLint, import smoke checks and whitespace validation pass for
  the new membership foundation and catalog surfaces.
- [ ] Connect owner mutation actions with preview and confirmation receipts.
- [ ] Complete member checkout and Plan & billing workflows.

Stripe credentials, live Whop capabilities, hosted migrations, subscriber
changes and production activation remain pending.

## Resumed QA - 2026-09-27

- [x] Correct the disposable verifier's COUNT assertion to expect `{ count: 0 }`.
- [x] Run the disposable SQLite verifier successfully against all 14 membership tables.
- [x] Verify custom backend features, additive grants, highest account limit,
  user isolation, future start, exact expiry, lifetime grant retention and revocation.
- [x] Verify public/Discord offer separation, hashed private secrets, wrong-secret
  rejection, exact expiry, exhausted link filtering and revoked link filtering.
- [x] Run foreign-key integrity check and focused ESLint for membership files.
- [x] Review source wiring for admin authorization, public navigation, sitemap,
  private metadata and runtime callers.
- [x] Record the complete requirement inventory and outstanding defects in the
  [QA report](membership-and-subscription-platform-qa-2026-09-27.md).
- [ ] Fix the reported product gaps and defects; this QA pass changed only the
  verifier and documentation.
- [ ] Complete browser and integrated payment/access verification. No local
  listener was found on ports 3000-3020; no server was started or real database migrated.

The source confirms Memberships is in the existing `/admin/journal` shell.
This is not a completed customizable billing product. The backend passing its
focused checks does not establish functional owner controls or payment enforcement.
No commit, push, deployment, Vitest, production build or broad suite was run.

Current continuation: central Community commercial permission checks and disposable grant/revocation regression are implemented. The complete live work record and remaining scope are in [full QA completion progress](membership-full-qa-completion-progress.md); the historical QA checklist above is not a claim that subsequent corrections are absent. Product acceptance remains open.

Coaching continuation: student entitlement now gates new service delivery and fresh shared Journal reads without requiring the coach to buy the student's plan. Disposable Community and request checks pass; the 59-entrypoint compiler graph passes. Coaching history and consent separation are preserved. Browser/provider acceptance and remaining module integration are still open in the linked full tracker.

Academy continuation: standalone signed-in progress no longer requires dashboard/guild access. Owner-enabled Academy enforcement checks lesson rendering and progress mutations, preserving saved completions. Disposable lesson/progress and real no-guild session regressions pass. Final acceptance remains open in the full tracker.

Journal continuation: Calendar, trackers, Open Positions, Candle Review and seven dedicated endpoints now honor `journal.access` with page redirects/API 403 responses. Shared fact-engine and separate feature permissions remain independent. Current verification and remaining surfaces are recorded in the full tracker.

AI Chat continuation: pending action, daily-companion and review-delivery confirmations now recheck `ai.chat` atomically. Committed retries and draft rejection are preserved. Fixed missing mutation headers in two cards and added explicit membership error messages. Full acceptance remains open in the linked tracker.

Latest QA continuation: Stripe recovery approval/withdrawal passed actual owner-browser submission and database audit verification. Fixed three dedicated Trade Analyzer Analytics API policy gaps and their denial messages; actual signed-session handler checks pass. Owner loopback preview deliberately bypasses request-level membership policies, so it is not evidence of member-denial rendering. Full remaining scope stays in the linked tracker.

Shared-detail correction: single-trade analysis/executions permit either Journal or Analytics access, retaining independent plans; broker-mismatch confirmation requires Journal access. Actual denied-handler checks, focused lint and the 90-entrypoint compiler passed. Browser acceptance remains separately tracked.

Owner member selection: replaced inaccessible raw-ID grant/diagnostic inputs with a paginated picker using existing private admin references. Browser verified timed grant/revoke, 53-member pagination and post-revocation diagnostics. Early AI generation denial, focused lint and the 92-entrypoint compiler passed. The [acceptance matrix](membership-acceptance-matrix.md) now identifies remaining checks for the complete scope.
