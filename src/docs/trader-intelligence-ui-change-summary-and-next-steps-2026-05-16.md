# Trader Intelligence UI Change Summary And Next Steps

Date: 2026-05-16

This document summarizes the recent end-user UI and product-IA work completed
on the `codex/trader-ui-product-pass` branch. Use it as a handoff for future
Codex or ChatGPT review so completed UI work is not rebuilt from scratch.

## Product Direction

The current UI direction is:

- Beginner view first.
- Advanced evidence second.
- Admin/debug never visible by default.
- The app should feel like an automated CSV-to-insight workflow:
  upload CSV -> app checks/saves/repairs import -> saved trades appear ->
  app tells the trader what to review first -> analytics explains patterns in
  plain language -> coach gives one fix/repeat/review path -> progress tracks
  completed reviews.

The recent work mostly reorganized the product into clearer route categories.
It did not intentionally rewrite P/L math, trade reconstruction, behavior
detection, chart evidence generation, or the existing saved-trade read models.

## Completed UI Changes

### 1. Workspace Dashboard Home

The `/workspace` route was rebuilt into the main signed-in dashboard home.

Completed:

- Added a stronger dashboard layout with a top navigation area, metrics, product
  area cards, recent activity, status/attention cards, and a workflow panel.
- Used the uploaded TradersLink logo and aligned the UI palette around darker
  blues, darker red/green states, and a more premium dark SaaS look.
- Kept the first-screen workflow beginner-friendly:
  `Upload CSV`, `Review next trade`, `Read analytics`, `Use coach`.
- Wired the dashboard cards to real saved-data counts where available:
  saved trades, day sessions, ticker stories, gross P/L, win rate, review
  queue counts, chart-data gaps, latest import, latest day, and next review.
- Demoted internal/admin/supporting routes below the main product flow.

Primary files:

- `app/workspace/page.tsx`
- `app/globals.css`
- `app/app-ui.tsx`
- `public/logo-horizontal-main.png`

### 2. Simple CSV Upload And Import Flow

The import experience was moved toward a simple end-user flow.

Completed:

- Added `/upload-csv` as a simple single-card CSV upload page.
- Removed unnecessary end-user copy such as explaining broker detection before
  upload.
- The new upload card routes successful uploads into the existing import detail
  flow and can show a clear duplicate/import attention alert before navigation.
- `/import-dry-run` was simplified as a user-facing import page while keeping
  advanced import diagnostics behind disclosures.
- `/imports` and `/imports/[batchId]` were adjusted so the default view focuses
  on saved imports, repair/finish state, import history, and next actions.
- Technical details such as batch ID, mapping confidence, quality score, write
  safety, cost policy, execution basis, column mapping, reconstruction preview,
  diagnostic buckets, and chart review details remain available but tucked
  behind advanced details.
- Primary wording was softened from technical language like `Import Batch` and
  `Import Recovery Queue` toward friendlier labels such as `Import Details`,
  `Saved Import`, and imports that need attention.
- Non-actionable import notices such as skipped non-execution rows were moved
  away from the primary beginner path.

Primary files/routes:

- `app/upload-csv/`
- `app/import-dry-run/page.tsx`
- `app/import-dry-run/import-dry-run-client.tsx`
- `app/imports/page.tsx`
- `app/imports/[batchId]/page.tsx`
- `app/import-workflow-strip.tsx`

### 3. Saved Trades IA And Calendar

The saved-trade area was reorganized so a trader does not see every trade
subfeature on one giant page.

Completed:

- `/trades` is now a feature/category landing page.
- Added focused routes:
  - `/trades/calendar`
  - `/trades/day-sessions`
  - `/trades/day-session/[sessionDate]`
  - `/trades/ticker-stories`
  - `/trades/ticker-story/[threadId]`
  - `/trades/round-trips`
  - `/trades/open-swing`
  - `/trades/review-needed`
- Added a persistent `Trades Menu` with route links and active-page state.
- Added the month calendar view:
  - one month at a time,
  - clear month navigation,
  - month P/L summary,
  - day cells colored by day P/L,
  - ticker chips colored by ticker P/L,
  - no Saturday column because equities are not open Saturday while Sunday
    evening still matters for extended trading context.
- Tuned calendar density several times:
  - less card height,
  - tighter ticker chips,
  - no repeated `Day Session` labels,
  - no redundant ticker/trade count text in each day,
  - clickable day cells instead of repeating `Open day session` links.
- Preserved underlying flat-to-flat trade accounting and round-trip links.

Primary files/routes:

- `app/trades/page.tsx`
- `app/trades/calendar/`
- `app/trades/day-sessions/`
- `app/trades/day-session/[sessionDate]/`
- `app/trades/ticker-stories/`
- `app/trades/ticker-story/[threadId]/`
- `app/trades/round-trips/`
- `app/trades/open-swing/`
- `app/trades/review-needed/`
- `src/lib/trader-analytics/server/saved-trade-threads.ts`

### 4. Ticker Story And Day Session Hierarchy

The saved-trade browsing model now treats repeated same-ticker activity as a
story instead of a wall of unrelated cards.

Completed:

- Day Session is the higher-level trading day view.
- Ticker Story is one ticker on one date.
- Round Trip is one flat-to-flat trade sequence.
- CYCN-style repeated entries on the same date now group under a ticker story.
- A ticker-story detail page shows the child round trips and lets the user open
  a detailed replay only when needed.
- Copy around `swing` and extended holds was made more neutral. Same-day
  evening/overnight-session continuation is treated as an extended hold review
  question rather than assuming the trader accidentally turned a day trade into
  a swing.

Primary routes:

- `/trades/day-session/[sessionDate]`
- `/trades/ticker-story/[threadId]`
- `/trades/[tradeId]`

### 5. Trade Detail Replay UI

The individual trade detail page was improved for replay and evidence review.

Completed:

- Added a candle-style replay chart where candle data is available.
- Kept execution markers on the chart.
- Reduced reliance on always-visible overlapping execution number labels.
- Added a compact execution strip/list below the chart with execution order,
  buy/sell action, time, price, quantity, and position context where available.
- Improved route context so a round trip can sit inside a larger day session and
  ticker story.
- Preserved the existing top flow:
  Replay -> Decide -> Write -> Continue.

Primary file:

- `app/trades/[tradeId]/page.tsx`

### 6. Analytics Route Split

The analytics route was split into focused pages so users can open one category
at a time.

Completed:

- Kept `/analytics` as the analytics overview.
- Added a persistent `Analytics Menu` with active-page state.
- Added focused routes:
  - `/analytics/results`
  - `/analytics/timing`
  - `/analytics/behavior`
  - `/analytics/ticker-stories`
  - `/analytics/session-stories`
  - `/analytics/chart-evidence`
  - `/analytics/review-plan`
  - `/analytics/trade-explorer`
  - `/analytics/details`
- Updated old `/analytics#...` and in-page switcher flows to route links.
- Carried `demo=sample` through analytics trade-explorer links so demo rows do
  not 404 when real saved data exists locally.
- Tightened page boundaries after QA:
  - `/analytics/results` owns outcome views such as `Daily P/L Calendar`,
    `P/L by Trade`, `Outcome Mix`, and gross result summaries.
  - `/analytics/timing` owns only timing/session/hour analysis such as
    `Total P/L by Session`, `P/L by Entry Hour`, and `Time Of Day`.
  - `/analytics/behavior` owns behavior charts and behavior reports.
- Added normalized timing language so total P/L by session is not treated as the
  whole story without checking average, median, win rate, sample size, and
  outlier dominance.

Primary files/routes:

- `app/analytics/page.tsx`
- `app/analytics/analytics-client.tsx`
- `app/analytics/results/`
- `app/analytics/timing/`
- `app/analytics/behavior/`
- `app/analytics/ticker-stories/`
- `app/analytics/session-stories/`
- `app/analytics/chart-evidence/`
- `app/analytics/review-plan/`
- `app/analytics/trade-explorer/`
- `app/analytics/details/`
- `src/docs/trader-intelligence-normalized-analytics-conclusions-plan-2026-05-12.md`

### 7. Coach Route Split

The coach area was split so the coaching homepage does not become another
analytics grid.

Completed:

- Kept `/coach` as the coaching overview and current focus page.
- Preserved the behavior coaching sequence as the distinct default coach
  product loop.
- Added focused routes:
  - `/coach/review-session`
  - `/coach/behavior-sequence`
  - `/coach/review-backlog`
  - `/coach/ticker-stories`
  - `/coach/session-stories`
  - `/coach/next-session`
  - `/coach/progress`
  - `/coach/details`
- Added a persistent `Coach Menu` with active-page state.
- Updated handoffs from workspace, review, progress, analytics, imports, trades,
  and trade detail pages to point into the focused coach routes.

Primary files/routes:

- `app/coach/page.tsx`
- `app/coach/review-session/`
- `app/coach/behavior-sequence/`
- `app/coach/review-backlog/`
- `app/coach/ticker-stories/`
- `app/coach/session-stories/`
- `app/coach/next-session/`
- `app/coach/progress/`
- `app/coach/details/`

### 8. Shared Navigation And Visual Patterns

Completed:

- Added/extended shared section navigation via `DashboardSideNav`.
- Section menus now support route links, active page state, and mobile
  disclosure behavior.
- Applied the same pattern to Saved Trades, Coach, and Analytics.
- Updated route handoffs so action links land on useful focused pages instead
  of generic crowded pages.

Primary file:

- `app/app-ui.tsx`

### 9. Copy And Safety Polish

Completed:

- Standardized chart language:
  - `Chart data` for availability/state.
  - `Chart evidence` for findings.
  - Avoid `chart context` in primary UI.
- Kept short-selling support conservative. The app should not tell a user they
  took a short when a sell may simply be an unmatched carryover from an earlier
  upload window.
- Avoided assuming trader intent in copy. For example, extended same-day holds
  should be reviewed as a hold-plan question, not automatically called a
  mistake.
- Kept admin/dev/QA routes out of the normal user dashboard except through
  clearly demoted/internal paths.

## Verification Already Run Recently

Recent checks across these UI changes included:

- `npx tsc --noEmit --pretty false`
- `npm run build`
- focused Playwright for saved trade routing
- focused Playwright for coach product loop
- focused Playwright for analytics product intelligence
- focused Playwright for analytics filters and trade evidence links
- focused Playwright for market-context observational copy safety
- focused Playwright for core mobile route usability
- focused Playwright for saved import visual overflow

See `src/docs/codex-project-log.md` for the exact command history and route
split entries.

## Latest UI Polish From Expert Audit

Completed after the initial route-split work:

- `/upload-csv` is now the branded beginner entry page instead of an isolated
  dark card. It uses the TradersLink logo, a workspace return link, one short
  explanation, and the same single-file upload action.
- `/import-dry-run` is now explicitly labeled `Advanced Import Check` and
  points normal users back to the simple CSV upload path.
- `/imports` now opens as `Import History`, links to `Upload another CSV`, and
  no longer shows the import workflow strip before imports to finish.
- `/trades` no longer shows the import workflow strip on the saved-trades
  landing page. It starts with the trades menu, review priority, and
  saved-trade workflow.
- Analytics subpages now use route-specific headings such as `Results` and a
  compact saved-review queue, so category content appears higher.
- Coach subpages use a tighter header and demoted repeated badges.
- Trade detail replay now makes the replay chart and execution strip the main
  section, with `Risks And Strengths` moved into a secondary disclosure below
  the replay.

## Important Work Not To Redo Without A Regression

Do not rebuild these unless screenshots, tests, or user QA show a concrete
problem:

- Workspace dashboard homepage and palette pass.
- `/upload-csv` branded simple-card entry point.
- `/trades` route split and section navigation.
- Calendar first pass and day-session drilldown route.
- Ticker Story -> Round Trip hierarchy.
- Candle replay chart and execution strip/list pattern.
- `/coach` route split and behavior coaching sequence.
- `/analytics` route split and results/timing/behavior separation.
- Import IA disclosure work that keeps advanced details available but demoted.
- Behavior mapper, detection baseline, existing P/L math, and saved-trade read
  model contracts.

## Remaining UI / Product Improvements

### Highest Priority

1. Import reliability and beginner flow

- Keep simplifying the first import-save journey after the `/upload-csv`
  branding polish.
- Make sure a first-time trader can upload a CSV, save it, and land on the
  correct next action without reading technical details.
- Continue separating admin/sample/test controls from end-user upload.
- Make duplicate, repair-needed, and decision-review states clear inside the
  simple upload card before routing away.

2. Chart data and levels-system integration

- Make chart-data status more trustworthy and transparent.
- Confirm whether support/resistance evidence from the levels system is being
  attached for all saved trades that should have it.
- Confirm whether lower-timeframe candle context before/during/after each trade
  is being requested, resumed, and failed safely.
- Add a clear user-facing status for background chart-data work:
  loading, ready, failed/retry needed, or not available.
- Keep this asynchronous where possible so CSV upload does not hang while chart
  context is still running.

3. Import-window carryover and long-only handling

- If an upload window starts with a sell, treat it as an unmatched prior
  position/carryover row rather than a short trade in the default UI.
- Keep unmatched sell/carryover cases available in advanced details and review
  queues, but do not let them create incorrect long/short coaching.
- Add clear copy explaining that the app could not match the sell to a previous
  buy inside the uploaded file window.

4. Review queue IA

- `/review` is still a strong candidate for the same route/subfeature cleanup
  used on Trades, Coach, and Analytics.
- Possible future focused pages:
  - highest priority reviews,
  - chart-data follow-ups,
  - open/carryover handling,
  - written review backlog,
  - completed reviews.
- Keep the default page a work queue, not a diagnostics dashboard.

5. Progress IA

- `/progress` is another candidate for focused subpages once review history
  grows.
- Separate follow-through, behavior change, review completion, rule adherence,
  and report history.
- Make sure progress still explains that imported trades alone are not progress;
  written reviews and follow-through are what matter.

### Medium Priority

6. Trade replay polish

- Add zoom/range controls or clearer time-window controls for candle replay.
- Improve execution marker collision logic further for dense fills.
- Consider a session-level chart view where a trader sees the full ticker-day
  story first, then drills into individual round trips.
- For day trades, decide when to show all intraday 5-minute candles versus only
  a window around entries/exits.
- For swings or extended holds, avoid requesting unnecessary 5-minute candles
  across multi-day gaps; focus on entry/exit windows and relevant daily/4h
  levels.

7. Calendar polish

- Continue visual tuning with desktop and mobile screenshots.
- Confirm ticker chip density for days with many tickers.
- Add year/month navigation that feels fast and obvious.
- Consider click targets for day cells and ticker chips if users want direct
  ticker-story drilldown from the calendar.

8. Ticker story hold semantics

- Continue refining labels around:
  - extended same-day hold,
  - overnight-session hold,
  - true multi-day swing,
  - still-open position,
  - carryover from a previous upload window.
- Avoid copy that assumes the trader intended a day trade unless the user or
  evidence explicitly says so.

9. Analytics conclusion quality

- Extend normalized conclusions beyond the first timing pass.
- Any "best/worst" or "this is your weakest area" claim should consider sample
  size, average, median, win rate, and outlier dominance.
- Make charts clickable into the exact trades behind a number where useful.

10. Admin boundary audit

- Recheck that these remain hidden from the default trader dashboard:
  `/import-trials`, `/import-health`, `/review-cockpit`, `/calibration`,
  `/platform-readiness`, `/account` while it is scaffolding,
  `/admin/broker-mappings`, and `/debug/*`.
- Decide whether `/repair-wizard` should become a true end-user repair flow or
  stay internal.

### Lower Priority / QA Cleanup

11. Full screenshot pass

- Capture desktop and mobile screenshots for:
  `/workspace`, `/upload-csv`, `/imports`, `/imports/[batchId]`, `/trades`,
  `/trades/calendar`, `/trades/day-session/[sessionDate]`,
  `/trades/ticker-story/[threadId]`, `/trades/[tradeId]`, `/review`,
  `/analytics/*`, `/coach/*`, and `/progress`.
- Check text wrapping, overflow, route purpose, action clarity, and advanced
  disclosure placement.

12. Test coverage follow-up

- Keep route-menu tests for Trades, Coach, and Analytics.
- Add screenshot/copy tests for the new calendar and ticker-story pages if not
  already covered enough.
- Add tests that ban duplicated chart panels across focused analytics pages.
- Add tests for demo/sample mode preserving route links into trade detail.

13. Documentation cleanup

- Keep `src/docs/codex-project-log.md` as the chronological source of truth.
- Keep this file as the compact UI/product summary.
- Update this file only when a future UI run materially changes the dashboard
  structure or route hierarchy.
