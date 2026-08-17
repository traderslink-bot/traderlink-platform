# Currency Preference And Reporting Progress

**Status:** Dashboard-wide reporting implementation and local verification complete;
final owner visual acceptance remains available

**Controlling plan:**
[Currency Preference And Reporting Plan](currency-preference-and-reporting-plan.md)

## Implementation record

- [x] Established the owner decision: U.S. equity executions remain USD facts;
  reporting currency is a Platform-user presentation preference.
- [x] Confirmed the first supported currencies: USD, CAD, AUD, EUR, HKD, SGD
  and MYR.
- [x] Chose Bank of Canada Valet daily indicative rates as the no-key,
  no-cost reporting source, cached server-side.
- [x] Added and applied migration 0024 for Platform user preferences and
  immutable cached Bank of Canada daily-rate observations.
- [x] Added scoped preference mutation plus server-only USD reporting adapter.
- [x] Added the Account Settings control and Workspace reporting-equivalent
  panel.
- [x] Owner visually approved the Account Settings and Workspace reporting
  equivalent on 2026-08-05.
- [x] Expanded the free daily-rate coverage to 25 reporting currencies: USD,
  CAD, AUD, BRL, CNY, EUR, HKD, INR, IDR, JPY, MYR, MXN, NZD, NOK, PEN, PLN,
  SGD, ZAR, KRW, SEK, CHF, TWD, THB, TRY and GBP.
- [x] Added migration 0035 to preserve existing preferences and cached rate
  observations while expanding the database allowlist.
- [x] Established the dashboard-wide display rule that ordinary money values
  use the selected currency symbol without an ISO code, and removed redundant
  selected-currency descriptions while preserving currency selectors and
  currency-specific Data Decision evidence.
- [x] Added one server-derived reporting fact-set adapter so historical
  prices, fees, notionals, P/L and aggregates are converted before dashboard
  calculations rather than merely relabelled.
- [x] Applied the active Platform-user preference to Workspace, Calendar,
  Analytics, Trade Explorer, Trade Analyzer, Rules results, Daily Trade
  Tracker, Swing Trade Tracker, Open Positions and Candle Review.
- [x] Converted saved analyzer snapshots, market candles, indicator price
  values and turnover for reporting while preserving source values for manual
  execution edits.
- [x] Removed page-level currency overrides from Calendar, Trade Explorer and
  Trade Analyzer. Saving the Account preference now refreshes server-rendered
  dashboard data immediately.
- [x] Added a safe dashboard recovery view for unavailable conversion coverage.
- [x] Kept page reads bounded by preparing reporting dates and currencies with
  a narrow metadata query, then reusing converted fact sets inside the same
  request instead of loading the complete analytics fact set twice.
- [x] Preserved statement/import/Data Decision values and already-issued AI
  Review prose as original evidence rather than rewriting facts.
- [x] Applied the same selected reporting currency to new live AI Chat factual
  reads across Workspace, Calendar, analytics, completed-trade details, Open
  Positions, Swings and saved Trade Analyzer results. Manual-entry drafts and
  source-evidence tools remain untouched.

## Verification checkpoint

- Focused ESLint and whole-project TypeScript pass without errors.
- The canonical no-worker dashboard passed representative desktop and 390 px
  browser review for Workspace, Calendar, Trade Explorer, Ticker, Trading
  Rules, Daily and Swing Trade Tracker, Open Positions, Execution Analytics,
  Candle Patterns and Analyzed Trades.
- Ordinary review pages showed symbol-formatted money with no visible `USD`
  suffix or prefix; horizontal tables retained readable widths and visible
  sideways-scroll cues; the mobile AI drawer retained a working Close action.
- The browser reported no console warnings or errors. Port 3010 was shut down
  after review.
- The live AI Chat reporting-context extension passes focused ESLint and the
  whole-project TypeScript check. No provider generation was triggered because
  that would create a saved answer and billable external request merely for QA.
- The owner's saved USD preference was not changed for QA. A future owner
  acceptance check can select another preferred currency in Account settings;
  the server-side reporting adapter and unavailable-rate guard are already the
  shared path used by the reviewed pages.
