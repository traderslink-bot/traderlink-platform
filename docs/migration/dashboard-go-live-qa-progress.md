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
   scoped to actual available trading sessions. This visible correction awaits
   owner approval.

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
- At a 390 by 844 responsive viewport, Workspace, Daily Trade Tracker, Swing
  Trade Tracker, Quick Trade Entry, Account Preferences and Help Center showed
  no page-level horizontal overflow. The mobile navigation drawer opened and
  closed with the keyboard.
- Privacy presents separate account-only and full-account deletion dialogs,
  states their different scopes and exact confirmation phrases, and keeps both
  delete actions disabled before confirmation. Both dialogs were cancelled;
  no deletion was submitted.
- No real Journal, Settings, provider or production data was changed.

### External launch gates

1. Railway project, persistent volume, production database, secrets, Discord
   identity, hosted-source transfer, schedulers, monitoring, backup/restore,
   domain routing and rollback remain governed by the live-launch checklist.

## Checkpoints

- [x] Establish repository, branch, commit, working-tree and process boundary.
- [x] Preserve unrelated dirty and untracked work.
- [x] Add a worker-disabled review runtime through `npm run dev:review`.
- [x] Statically verify the worker-disabled review runtime with package JSON
  parsing, targeted ESLint and `git diff --check`.
- [ ] Complete source-level route, promise and Settings audit.
- [x] Repair and browser-verify the shared Account Settings runtime boundary.
- [x] Repair and browser-verify the Help Center compilation failure.
- [ ] Complete controlled desktop and narrow-mobile browser audit.
- [ ] Present visible UI corrections for owner approval.
- [x] Present the Workspace performance correction for owner approval.
- [x] Implement and browser-verify the approved Workspace performance repair.
- [ ] Complete focused verification for each accepted slice.
- [ ] Complete final release-candidate regression, build and browser acceptance.
- [ ] Produce the final go/no-go report.

## Commit record

- `fe07262b` — safe worker-disabled dashboard review runtime and QA tracker.
- `18df1629` — shared Account Settings client-boundary repair.
- `7bc48c7a` — Data Decisions Help guide compilation repair.
