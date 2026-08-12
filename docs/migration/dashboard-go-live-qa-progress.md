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
- [ ] Complete final release-candidate regression, build and browser acceptance.
- [ ] Produce the final go/no-go report.

## Commit record

- `fe07262b` — safe worker-disabled dashboard review runtime and QA tracker.
- `18df1629` — shared Account Settings client-boundary repair.
- `7bc48c7a` — Data Decisions Help guide compilation repair.
