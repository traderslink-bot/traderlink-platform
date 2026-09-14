# Trend & Momentum hosted QA follow-up

Owner authorized fixes on 2026-09-13 after read-only production QA.

## Scope

2026-09-13 broader owner-requested follow-up is tracked in
[trade identity audit](trade-identity-audit-progress.md). The original AEHL
focus correction passed hosted acceptance on production `81a1bbb192b1f6145a3a4c89a4a37602c97b58ac`.

- Put the shared PWA update notice below modal menus and dialogs. Preserve the
  explicit update button, activation safety, offline data and theme styling.
- Distinguish an empty selected date range from an account without trades.
- Preserve Gross/Net and 1m/5m when opening a Trend supporting trade or recorded
  event. Apply the basis only to that focused analysis, including lazily loaded
  details; do not mutate the saved payload, account preference or offline cache.
- Widen the Candle timeframe selector and use singular trade wording for one.
- Align Help with the navigation behavior.

## Verification

- Two focused regression files / 13 tests passed, one worker, 512MB cap.
  Includes numerical fee application (100 Gross / 97.5 Net), no saved-data
  mutation, 5m Net drilldown parameters, and notice layering in Light/Navy.
- Existing integrated rendering tests cover both directions/timeframes, offline
  views and explanation controls. No provider calls, migrations or AI requests.
- Local full TypeScript/build not repeated: prior 512MB TypeScript attempt
  exceeded memory. Coordinator must use the remote build/typecheck gate.
- Source review: route only accepts gross/net, default keeps account basis;
  override is applied after lazy detail selection, never persisted.

## Release boundary

Post-deploy focus correction: the analyzed-trade list was returning the logical
trade ID as its tracker focus ID. The tracker resolves representative member
IDs, so unmatched logical IDs fell back to another trade. Return the existing
representative member for navigation only; grouping, pagination signatures and
counts continue to use the logical trade. Add an end-to-end pure projection/link
regression with deliberately different logical/member IDs and 5m Net context.
Verification passed: three files / 21 tests, targeted lint clean, whitespace
check clean. Includes pagination, scope isolation and offline ID stripping.
Ready for narrow handoff. No production mutation is authorized from this task.

Final follow-up: the alternate Trend -> View trades -> View full analysis link
now also carries its selected Gross/Net basis, preserving timeframe and optional
execution focus. Offline saved-day routing is unchanged. The Help explanation
already covers the preserved basis; no additional copy is needed.
Final checkpoint passed: three focused files / 20 tests, one worker at 512MB;
targeted lint clean and whitespace check passed. Includes Gross/Net x 1m/5m
with/without execution focus on the alternate path. Ready for coordinated
release of both QA-fix commits; production verification remains after deployment.

Implementation complete. Targeted lint passed with zero errors; the existing
unused TradeOutcomeSummary warning in day-session-view remains unchanged.
Whitespace check passed. Immutable handoff follows the narrow local commit.
Coordinator owns shared-file reconciliation and production release. Carry only
this slice, not prior Swing plan ancestry or earlier count-fix commits.
Hosted acceptance: verify mobile menu is above an available update notice, empty
Today wording, All time restoration, Net full analysis matches its supporting
row, and untruncated timeframe label on desktop. No local server is needed.
