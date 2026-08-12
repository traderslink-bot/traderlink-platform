# Dashboard Go-Live QA Progress

## Purpose

This record tracks the final product and operational readiness review for the
complete TradersLink Platform dashboard. The review uses the full accepted
product inventory as its target and separates launch blockers from serious
defects, minor defects, usability improvements and external hosting gates.

The controlling operational checklist remains
[TradersLink Platform Live Launch Readiness](traderlink-platform-live-launch-readiness.md).
This record does not authorize deployment, production data transfer, provider
activation, DNS changes or legacy deletion.

## Approved review scope

- Confirm the exact repository, branch, commit, runtime and selected release
  boundary while preserving unrelated tracked and untracked work.
- Audit every dashboard navigation route and critical deep link for complete,
  purposeful and understandable behavior.
- Review Account Settings, Daily and Swing Trade Tracker, Quick Trade Entry,
  imports, Data Decisions, Open Positions, Round Trips, Calendar, Analytics,
  Trade Analyzer, Rules, notes, tags, reviews, AI surfaces, Market Charts, Help
  Center and Journal Administration.
- Verify critical account isolation, exact financial facts, trading dates,
  timezones, unavailable states, privacy boundaries and destructive-action
  safeguards.
- Check desktop, narrow mobile, keyboard and basic accessibility behavior.
- Compare the implemented behavior with Help Center promises.
- Present visible UI corrections for owner approval before implementation.
- During implementation use focused, low-resource checks only. Run final
  regression, production build and browser acceptance at the explicit final
  release-candidate checkpoint.

## Current boundary — 2026-08-12

- Repository: `C:\Users\jerac\Documents\TraderLink\traderlink-platform`.
- Branch: `codex/traderlink-platform-replacement`.
- Starting commit: `f2ccfd0ff8916efaf621476b9db69863b1c15b9a`.
- The branch is ahead of its remote tracking branch. It is not a clean,
  synchronized `main` release candidate.
- The working tree contains pre-existing launch-readiness and local tooling
  work. Those files remain outside this QA slice unless their ownership is
  explicitly reconciled.
- No dashboard listener was present on ports 3000, 3010 or 3011 at the start of
  this review.
- The normal local launcher starts the Daily Trade Analyzer and Moomoo import
  workers. It is not suitable for controlled read-only browser QA without a
  worker-disabled mode.
- No Vitest or broad test suite has been run during active review.

## Findings

### Launch blockers

1. The Workspace `Performance details` action links to
   `/analytics/performance`, but the route does not exist. The action currently
   led to a 404. The approved correction now uses `Explore performance`, links
   to `/analytics/trade-explorer`, accurately describes the available
   performance groupings and opens Trade Explorer without browser errors.
2. `/account` redirects to `/account/preferences`, where the shared Account
   Settings layout crashed because a Next.js link function crossed the Server
   Component boundary into a Material UI client component. All five Settings
   sections were unusable. The intended layout is now isolated behind the
   required client boundary. Preferences, Trading, AI & plan, Profile & access
   and Privacy all render with their expected headings and no browser errors in
   the worker-disabled canonical runtime.
3. `/help` returned HTTP 500 because the Data Decisions `Common decisions`
   bullet list was missing its closing array bracket. The guide wording and
   layout are unchanged. Help Center and the affected
   `/help/data-decisions/resolve-a-trade-question` article now render with the
   expected headings and no browser errors.

### Runtime blockers

No active runtime blocker remains for controlled local QA. `npm run dev:review`
starts the canonical loopback runtime with both background workers disabled.
The initial switch stopped worker polling but still allowed a direct loopback
POST to reach either internal worker bridge. The launcher now returns HTTP 404
for both worker paths whenever `--no-workers` is active, so the review runtime
cannot manually or periodically trigger broker-import or analyzer work.

### Owner decision required

1. The removed Performance page intentionally overlapped the accepted Analytics
   architecture. The recommended repair is to keep the `Performance over time`
   card, rename its action to `Explore performance`, link it to
   `/analytics/trade-explorer`, and revise the description so it accurately
   describes Trade Explorer's daily P/L, drawdown, recovery, giveback and other
   available groupings. The owner approved this exact correction, and it is now
   implemented and focused-browser verified.
2. Daily Trade Tracker opens today's valid no-trade review page, but the Day
   selector derives its options only from historical trading sessions. On
   2026-08-12 it therefore held the out-of-range value `12` while showing only
   `03`, `04` and `07`; the visible Day field was blank and Material UI emitted
   repeated warnings. The recommended correction is to include the currently
   open date in the selector options while keeping previous/next navigation
   scoped to actual available trading sessions. The owner approved this exact
   correction. The selector now includes the requested date, and the shared
   Journal Analytics read model resolves nearest earlier/later actual sessions
   even when the requested date is not itself a traded date. Focused browser
   verification passed on `/trade-tracker`: `12 / Aug / 2026` renders without
   Material UI warnings, Previous resolves to `/trade-tracker/2026-08-07`, Next
   remains unavailable because there is no later traded session, and the August
   7 session renders `7 / Aug / 2026` without console warnings or errors.
3. Saved AI Review summaries and full review documents currently render exact
   provider prose unchanged, including P/L values with more than two decimal
   places. That conflicts with the accepted dashboard display rule even though
   the stored Journal facts remain exact. The recommended correction is to keep
   every stored review and source fact unchanged, format decimal values only at
   the AI narrative presentation boundary to at most two places, and instruct
   future AI Review and AI Chat responses to follow the same display rule. The
   presentation guard should cover saved review cards, full review documents
   and assistant narrative, while leaving trader-entered execution quantities,
   prices, fees and other editable exact facts untouched. The owner approved
   this correction and established standing approval for the same money-only
   rule elsewhere. It is implemented at the presentation boundary and in future
   AI Review/AI Chat instructions. Focused browser proof found no money value
   over two decimals in the saved-review list or full review document; values
   such as `-$311.20859225` now display as `-$311.21`. A direct formatter check
   also proved that trade counts and percentages remain unchanged.
4. The dashboard-template enforcement source previously rejected direct
   Material `Drawer` imports in every component beneath `app/(dashboard)`. It
   reported the AI Chat mobile conversation panel and the monthly AI Review
   coverage panel,
   while Calendar already has four accepted feature-specific drawers through a
   grouped Material import that the same check does not detect. These panels do
   not recreate the application header or navigation shell. The recommended
   correction is to preserve their approved behavior and update the dashboard
   contract plus enforcement with an explicit, narrowly reviewed distinction
   between feature panels and a forbidden duplicate application shell. The
   alternative is a visible redesign of all feature drawers as dialogs. The
   owner approved preserving the existing feature drawers. The contract and
   enforcement now distinguish those three reviewed feature-panel files from a
   forbidden duplicate application shell; every new Drawer remains blocked
   until it is explicitly reviewed and allowlisted.

## Review evidence — 2026-08-12

- All 25 primary navigation routes returned their intended page or accepted
  redirect after the Account and Help repairs. No additional primary-route 404
  or HTTP 500 was found.
- Additional dashboard routes for Analytics Lab, legacy Analytics aliases,
  manual entry, reflection, Rule Results, Candle Review, day sessions, Round
  Trips, ticker results, Platform Readiness, AI Review preview, notifications
  and Journal Administration returned their intended page or accepted redirect.
- Daily Trade Tracker, Swing Trade Tracker and Quick Trade Entry render their
  expected execution controls. Incomplete execution rows cannot be saved, and
  Daily Trade Tracker presented a leave-page confirmation for unsaved rows.
- Imports renders its statement chooser, mapping action, history and Data
  Decisions/Help paths. A repository-provided synthetic upload did not open the
  browser file chooser before timeout; no upload or Journal mutation occurred.
  Import preview/commit remains for the disposable-data acceptance checkpoint.
- Data Decisions renders the current factual questions and plain-language
  resolution actions without browser errors. No real decision was submitted.
- AI Chat loads its saved account-scoped conversation surface, manual-entry
  draft action and disabled empty-message submit state without browser errors.
  No provider request or conversation mutation was submitted.
- AI Reviews loads its schedule, availability, saved weekly/two-week/monthly
  review inventory and full saved-review documents without browser errors. Its
  presentation-precision defect is recorded above; no review was generated.
- Market Charts loads the TradingView advanced-chart embed with live candles,
  chart controls and the expected light dashboard shell. Notifications renders
  its factual empty state, and the Journal Administration overview renders its
  full navigation and operational sections without browser errors.
- A rendered-HTML precision sweep across Workspace, both trackers, Calendar,
  Rules and Rule Results, Trade Explorer, Open Positions, Round Trips, every
  Core Analytics and Trade Analyzer page, AI Chat, AI Reviews and Data
  Decisions found no remaining dollar-denominated value with more than two
  decimal places.
- All ten Journal Administration sections return their intended page. The first
  `/admin/journal/users` request took 30.8 seconds because Next compiled that
  route for the first time; its warm request returned HTTP 200 in 5.0 seconds.
- Source review confirmed every Account Settings save path re-authorizes the
  active user/account server-side, validates its input and exposes a factual
  success/failure state. The privacy API additionally requires mutation-request
  security, exact confirmation text and the selected-account revision boundary.
- Help Center review found no guide change required for the money presentation
  guard because it does not change AI Review evidence, storage, availability or
  workflow behavior.
- At a 390 by 844 responsive viewport, Workspace, Daily Trade Tracker, Swing
  Trade Tracker, Quick Trade Entry, Account Preferences and Help Center showed
  no page-level horizontal overflow. The mobile navigation drawer opened and
  closed with the keyboard.
- Privacy presents separate account-only and full-account deletion dialogs,
  states their different scopes and exact confirmation phrases, and keeps both
  delete actions disabled before confirmation. Both dialogs were cancelled;
  no deletion was submitted.
- No real Journal, Settings, provider or production data was changed.
- During the worker-boundary check, direct loopback POSTs reached both internal
  bridges before the launcher correction. A privacy-safe read-only database
  audit immediately afterward found zero broker-import jobs and zero analyzer
  jobs updated in the surrounding ten minutes, proving that neither call found
  or processed work. After the correction both paths return HTTP 404 while
  `/workspace` continues to return HTTP 200.

### External launch gates

1. Railway project, persistent volume, production database, secrets, Discord
   identity, hosted-source transfer, schedulers, monitoring, backup/restore,
   domain routing and rollback remain governed by the live-launch checklist.

### Final release-candidate checkpoint

- The complete TypeScript project passes `tsc --noEmit` under a capped 1.85 GB
  Node heap. This includes application code, tests, seed tools and verification
  scripts. The checkpoint repaired stale multi-account nullability assumptions,
  current AI-review input contracts and current Analytics Lab query fixtures;
  it did not weaken any production account-selection contract.
- Repository-wide ESLint passes with zero errors. Twenty existing unused-code
  warnings remain in legacy and Level Analysis files; none is a runtime or
  release blocker. The final React corrections removed render-time mutation
  from the Timing chart and synchronous state resets from Calendar. Calendar
  now remounts on a server-selected period/filter change and keys ticker-detail
  responses to the selected day, ticker and round trips so stale results cannot
  appear under a new selection.
- `npm run build` passes with Next.js 16.2.6: the protected Academy registry
  passed, the optimized application compiled, TypeScript passed, page data was
  collected and 199 static pages were generated. The 19 documented Academy
  archive/SEO warnings remain expected.
- Final worker-disabled browser acceptance passed for Workspace, Daily Trade
  Tracker list and dated review, Account Preferences, Data Decisions Help, AI
  Reviews and a saved weekly review, Market Charts, Execution Analytics,
  Calendar, Platform Readiness and Journal Administration. Calendar ticker
  details completed successfully, and the browser console contained zero
  errors after the full sweep.
- At 390 by 844, Workspace, both Daily Tracker surfaces, Account Preferences
  and Calendar had no page-level horizontal overflow, visible application
  error or dollar value with more than two decimal places. The viewport was
  reset after the check.
- Both internal worker bridge routes returned HTTP 404 in review mode. The
  hosted health route returned its intentional privacy-safe HTTP 503
  `{"status":"unavailable"}` because the local development process is not the
  production Railway `/data` runtime; the hosted runbook requires this
  fail-closed behavior outside its exact production boundary.
- Read-only/disposable verification passed for platform readiness, Account
  erasure, public identity, Journal Administration, current Journal read
  models, Core Analytics reconciliation, Analytics Lab, Candle Review, Moomoo
  execution import workflow, Whop entitlement/reconciliation and AI Review
  scheduling, timing, budget and cache-accounting contracts. The accepted
  read-only reconciliation is 364 ready-closed round trips, two factually open
  positions and two round trips withheld for decisions.
- The private Phase 5 write-slice verifier was not run because its protected
  source database and statement path variables are not configured. No real or
  substitute statement was used. That production-data proof remains a hosted
  transfer checkpoint rather than a local product-code failure.
- No broad Vitest suite was run. One scoped dashboard-template command was
  inadvertently invoked without first inspecting that its package script wraps
  Vitest, contrary to the owner instruction. Six assertions passed and the one
  Drawer enforcement assertion reported the contract inconsistency recorded
  above; it will not be rerun in this review. No deployment, push, merge,
  production mutation, Journal write or provider activation was performed.

## Go-live conclusion

No known local runtime product defect remains in the reviewed inventory, and
the source passes TypeScript, lint, production build and browser acceptance.
The approved dashboard-template enforcement correction is implemented without
changing the reviewed feature-panel UI.

Public go-live remains **no-go** until the external launch gates are completed:
the release must be intentionally reconciled and published through the approved
`main` workflow; Railway
single-node persistent storage and protected paths must be provisioned; the
production database/source transfer and private write proof must pass;
production Discord identity, Whop, scheduler and secret configuration must be
activated; backup/restore, observability, rollback and multi-user production
acceptance must pass; and DNS/application cutover still requires owner
authorization. The local HTTP 503 health result is expected until that hosted
production boundary exists.

## Checkpoints

- [x] Establish repository, branch, commit, working-tree and process boundary.
- [x] Preserve unrelated dirty and untracked work.
- [x] Add a worker-disabled review runtime through `npm run dev:review`.
- [x] Statically verify the worker-disabled review runtime with package JSON
  parsing, targeted ESLint and `git diff --check`.
- [x] Complete source-level route, promise and Settings audit.
- [x] Repair and browser-verify the shared Account Settings runtime boundary.
- [x] Repair and browser-verify the Help Center compilation failure.
- [x] Complete controlled desktop and narrow-mobile browser audit.
- [x] Present visible UI corrections for owner approval.
- [x] Present the Workspace performance correction for owner approval.
- [x] Implement and browser-verify the approved Workspace performance repair.
- [x] Implement and browser-verify the approved Daily Tracker date repair.
- [x] Implement and browser-verify the standing money-display correction for AI
  narrative while preserving exact stored facts and non-money numbers.
- [x] Complete focused verification for each accepted slice.
- [x] Complete final release-candidate regression, build and browser acceptance.
- [x] Resolve the dashboard feature-panel enforcement decision under owner
  approval and verify the narrowed source rule without another local Vitest
  run.
- [x] Produce the final go/no-go report.

## Commit record

- `266c3455` - approved feature-panel versus application-shell enforcement.
- `3ac330e4` - primary dashboard route audit record.
- `6a82a5b8` - Workspace performance action correction.
- `c3565b25` - mobile and privacy audit record.
- `ccec6a21` - Daily Tracker valid-date navigation correction.
- `d3c0360b` - AI and chart readiness audit record.
- `0bc1ff9f` - money-only AI narrative presentation precision guard.
- `f2baf4ae` - review-runtime worker bridge isolation.
- `aa4c9ed0` - migration-derived readiness module verification.
- `3c0988dc` - current Phase 5 static verifier contract.
- `34bd152f` - legitimate expanded Data Decisions reconciliation.
- `462dfb2e` - current independent Analytics acceptance baseline.
- `d814ea51` - current Analytics Lab verifier contract.
- `9f3d8670` - request-only manual AI Review verification.
- `d69dddd1` - isolated AI cache-accounting migration verification.
- `af7b878f` - compile-safe current dashboard feature views.
- `e9c652ea` - handler-owned Trade Explorer pagination reset.
- `ba2dc927` - current server contract typing and validation.
- `b3e775a0` - complete project typecheck restoration.
- `4c1f7004` - React-safe Timing and Calendar state handling.

- `fe07262b` — safe worker-disabled dashboard review runtime and QA tracker.
- `18df1629` — shared Account Settings client-boundary repair.
- `7bc48c7a` — Data Decisions Help guide compilation repair.
