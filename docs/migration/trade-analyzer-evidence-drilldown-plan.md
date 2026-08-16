# Trade Analyzer Evidence Drilldown Plan

**Status:** Active and owner approved.

**Progress:** [Trade Analyzer Evidence Drilldown Progress](trade-analyzer-evidence-drilldown-progress.md)

**Parent plan:** [Trade Analyzer Analysis Pages Plan](trade-analyzer-analysis-pages-plan.md)

## Outcome

Make Candle Patterns useful as both a long-term comparison and a path back to
the exact trade evidence. Correct Analyzed Trades so it is a neutral directory
of every analyzed trade instead of a second Green-to-Red table.

This slice is built for growing account histories now. Initial page payloads
stay bounded, filters run before pagination, and only one chart is mounted when
the trader asks to inspect an occurrence.

## Approved product contract

### Candle Patterns

- Keep one grouped card per candle pattern, with separate 1-minute/5-minute,
  entry/exit and execution-location result rows.
- Add **View occurrences (N)** to each pattern group.
- Show a dedicated **Pattern occurrences** surface for the selected pattern.
- Apply ticker, timeframe, execution and location filters before server
  pagination. The shared Trade Analyzer date range, currency and money basis
  continue to apply.
- Default to 25 occurrences per page and offer 10, 25, 50 and 100.
- Use a desktop table and touch-friendly mobile cards. Newest occurrences come
  first under a stable cursor/order contract.
- Opening an occurrence loads one Daily Trade Analyzer replay only. Desktop
  uses a wide right drawer; mobile uses a full-screen dialog.
- Focus the exact saved execution and selected pattern timeframe. Provide
  previous/next occurrence controls and an **Open Daily Trade Tracker** link
  that preserves the round trip, execution and interval.
- Do not render chart thumbnails or preload charts for every result.

### Analyzed Trades and Green-to-Red

- Green-to-Red owns the existing opportunity/capture/outcome supporting-trades
  table.
- Analyzed Trades becomes a neutral one-row-per-current-analysis index with
  Date, Ticker, Direction, Entry time, Exit time, Result, Return, Executions and
  **View full analysis**.
- Ticker search and result filters run on the server before pagination.
- Pagination defaults to 25 and offers 10, 25, 50 and 100.
- **View full analysis** opens the exact Daily Trade Tracker trade, not merely
  the trading day.

## Data and performance contract

- Add an immutable occurrence projection derived from saved event snapshots.
  Each row is one pattern occurrence tied to an Analyzer version and execution.
- Store account, round-trip, execution, event, pattern, timeframe, location and
  occurrence-time facts needed for bounded indexed reads.
- The Analyzer writer persists occurrence rows in the same transaction as its
  immutable event snapshots.
- Backfill existing saved snapshots when the migration is applied. Only
  patterns that were available at execution and use supported 1-minute or
  5-minute timeframes enter the projection.
- Reads join only the current ready Analyzer revision and current round-trip
  version. Historical immutable revisions remain preserved but are not shown
  as current evidence.
- Cursor order uses execution time plus stable identity tie-breakers so pages
  cannot duplicate or skip rows under an unchanged result set.
- Analyzed Trades uses a bounded current-analysis query and computes exact
  gross/net result and return from the selected page's saved executions. It
  does not load an unlimited trade list into the browser.
- Every read is restricted to the server-derived selected workspace/account.

## Responsive and accessibility contract

- Controls wrap without horizontal page overflow at 320px and 390px widths.
- Touch targets remain at least 40px high where practical.
- The occurrence drawer/dialog has a visible title, close control, loading,
  unavailable and error states, and a sticky action header on small screens.
- Table-only information is fully represented by mobile cards.
- Pattern and trade actions use descriptive accessible labels.
- Each Trade Analyzer page keeps only one question-mark Help link in the page's
  top-right title row.

## Help alignment

Update Candle Patterns, Green-to-Red and Analyzed Trades guides to describe the
new ownership, filters, pagination, occurrence replay and exact Tracker links.
Remove wording that presents Analyzed Trades as a Green-to-Red evidence table.

## Coordination boundary

- Do not edit Trade Explorer files or its plan/progress records while the
  concurrent Trade Explorer session is active.
- Preserve unrelated dirty dashboard, navigation, account, Calendar, Rules,
  notification and AI Chat changes.
- Do not commit, push, deploy or apply the new migration to the owner's active
  database without a separately authorized checkpoint.
- Do not stop or replace the shared port 3010 process.

## Verification and owner review

- Review source diffs for account scope, current-revision joins, stable cursor
  behavior and exact decimal arithmetic.
- During this owner-approval cadence, do not run Vitest or other automated test
  suites.
- Use the existing controlled dashboard for focused compile and visual checks
  without restarting it.
- Review Candle Patterns and Analyzed Trades at desktop, 390px and 320px; open
  and close one replay; confirm no page overflow and that the exact Tracker link
  carries round trip, execution and interval.
- Keep this plan active until the owner accepts the visible result.

## Out of scope

- Predictive pattern scoring, alerts or trading signals.
- Multiple simultaneously mounted charts or chart thumbnails.
- Swing Trade Analyzer evidence.
- Reworking Trade Explorer or the Journal analytics engine.
- Production migration, deployment or historical market-data backfills beyond
  the saved Analyzer snapshots already owned by this database.
