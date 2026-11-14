# Trade Analyzer Alpaca candle cutover

## Current candidate

The Coordinator assigned `/home/traderlink/projects/analyzer-alpaca` on
`codex/analyzer-alpaca-cutover`, based on published snapshot `aa1521b99`.
The prior mixed checkout and correction notice remain separate.

- The active logical worker and indicator history now use the private Alpaca
  gateway. Raw SIP one-minute bars use the provider's minute start and share
  volume. Adjusted candles, incomplete receipts and out-of-range bars fail
  validation. The chart's existing split-adjusted gateway default is preserved.
- Migration `0186_daily_trade_analyzer_alpaca_cache` adds an independent cache
  identity and preserves legacy session keys, versions and foreign keys.
- Indicator receipts are selected by acquisition provenance. Verified split
  effective dates limit the warmup, and an unavailable corporate-action lookup
  leaves the core analysis usable without trend and momentum context.
- The worker respects the existing first-result time, retries recoverable
  acquisition failures, and keeps an already-ready result for the same trade
  version when an attempted refresh fails.

## Page acceptance inventory

Use separate completed day trades immediately before and after each split. The
active Analyzer selects trades whose first and final executions share a New York
trading date. Use an unaffected ticker as a control and retain a saved legacy
analysis to verify replay after cutover. Compare original executions and realized
P/L before and after each analysis. Check same-day, historical and cached jobs
and retain the original analysis if reconciliation fails.

| Surface | Acceptance check |
| --- | --- |
| Day Analysis overview | Alpaca jobs contribute once to analyzed-trade counts and P/L aggregates. |
| Entries and exits | Timing, raw price, VWAP, EMA and activity agree with saved executions and bars. |
| Room after entry | Excursions use the correct side, start at the relevant fill and end at the correct position boundary. |
| Green-to-red | Peak profit, recovery and final P/L tie to the source bars and Journal. |
| Scaling out | Zone and exit tallies match the actual fill sequence, quantities and gross profit. |
| Candle Patterns | 1-minute and 5-minute results and replay match their own saved candle evidence. |
| Analyzed Trades | Alpaca results and legacy saved analyses open with the correct fills and P/L. |
| Trend & Momentum | A verified effective split date limits warmup or triggers an explicitly insufficient-history result. The control warms up normally. |
| Workspace Analyzer and Daily Trade Tracker | Actual fill markers align with raw bars on both sides of each split. No display multiplier changes the fills. |

## Verification and remaining work

The targeted feature batch passed 127 of 128 tests. The remaining failure is a
source assertion for chart theming already inconsistent on the base commit.
The platform migration suite passed, including a separate populated legacy
receipt migration check. The full TypeScript check reported existing jsdom and
scanner test typing errors with no diagnostics on the edited paths.

## Post-session refresh and browser QA

- A same-day result stays ready while its job waits until 4:15 a.m. Eastern the
  following day. The refresh fetches the full extended session, shares accepted
  finalized candles across trades, and recomputes the saved analysis with no
  additional allowance. Missing fill evidence and exhausted provider retries
  preserve the earlier result. Historical jobs first processed after the
  reconciliation time use their full historical download.
- The focused refresh, route, split and migration batch passed 53 tests. The
  split suite passed again after adding assertions that six separate completed
  day trades keep their native fill prices and share counts and each computes
  an expected $400 in realized P/L. These are synthetic engine fixtures.
- Browser QA ran via Chromium against the isolated worker-disabled preview.
  All eight pages loaded. MFE/MAE, Green-to-Red, Scaling Out and Candle Patterns
  emitted hydration errors caused by a help button nested inside an accordion
  button. The remaining four did not emit an uncaught error in that pass.
- Six synthetic trades covered before/after a 1-for-10 reverse split and
  4-for-1 forward split, plus two no-split controls. Workspace displayed the
  six corresponding original entries, exits, share counts and $2,000 gross
  P/L on its trade rows. Each Workspace Analyzer drawer opened and rendered a
  chart, and its authenticated analysis response matched the original fills.
  The Session Tracker rendered all six charts and $2,000 P/L. Both per-trade
  execution controls were exercised. Canvas marker coordinates were not verified.
- A read-only SQLite check reconciled all 12 saved Journal fills and the six
  $2,000 gross outcomes. Browser fixtures used mocked raw gateway receipts and
  direct saved-analysis writes after the first fixture queue attempt did not
  produce all ready results. This confirms replay and read behavior. It does
  not qualify the live gateway or end-to-end queue on those fixtures. Candle
  Patterns and Trend & Momentum covered their empty/unavailable states only.
  Positive pattern, indicator, scaling-out and finished-red cases remain open.
  No deployment or gateway rollout occurred.

## Deployment requirements

The private VPS gateway needs the raw-history capability before starting the
Platform consumer. Platform uses the existing server-only
`TRADERLINK_ALPACA_GATEWAY_URL` and `TRADERLINK_ALPACA_GATEWAY_TOKEN`. The VPS gateway
holds its Alpaca SIP credentials. Verify variable presence without printing
values. Gateway contract, application wiring, migration and isolated runtime QA
are required before cutover. This checkpoint has no hosted changes.

## Browser retest and queue verification

- Moved the collapsible section help button outside the accordion toggle. All
  eight Analyzer routes rendered without page errors on desktop retest.
- Six additional isolated Journal trades went through selection, reservation,
  the real job repository, the worker, and the raw Alpaca cache using a mocked
  gateway response. All jobs completed with persisted Alpaca provenance.
  A read-only Journal check verified all 12 original fill prices and share
  counts and $2,000 gross per trade. Next-day refresh remains tested separately
  by the worker and migration suites.
- Both chart surfaces were checked through their canvas rendering. The
  assertions cover visible buy/sell markers and their relative time and price
  positions. Exact pixel-to-fill coordinate matching was not instrumented.
- Positive candle-pattern, indicator, scale-out, and finished-red cases still
  require purpose-built fixture evidence. Live gateway transport remains untested.

## Live Alpaca and populated browser QA

- Nasdaq confirmed GOVX's 1-for-24 reverse split effective November 11, 2026
  ([notice](https://www.nasdaqtrader.com/TraderNews.aspx?id=ECA2026-807)).
  Authenticated Alpaca SIP requests returned raw and split-adjusted bars.
  The November 10 opening minute ranged from $0.134 to $0.142 raw and $3.216
  to $3.408 split-adjusted. November 11 ranged from $2.8215 to $3.00 on both
  bases. The candidate gateway returned the split date and raw bars, and the
  Analyzer adapter and fill validator accepted test fills of $0.14 before the
  split and $2.96 afterward. This was a read-only loopback test. The existing
  gateway listener still returned split-adjusted history and HTTP 404 for the
  Analyzer split route.
- Chromium checked the rendered one-minute marker leader anchors against the
  exact candle time and execution price coordinates to within 0.001 CSS px.
  All 12 chart views passed across Workspace and Session Tracker, covering
  six trades and their 12 original fills in reverse-split, forward-split and
  no-split scenarios. Temporary chart instrumentation was removed.
- Six additional isolated trades completed the Analyzer queue through a mock
  Alpaca gateway. All four target pages rendered populated results without
  uncaught browser errors. Candle Patterns showed 54 occurrences, 52 of them
  Doji, with one- and five-minute entry and exit records. Trend & Momentum
  showed populated EMA 9 and EMA 20 results. Scaling Out showed two scaled
  trades with $4,000 combined gross profit, including $2,000 on exits that
  closed the remainder. Green to Red showed two trades that never recovered,
  with $800 realized loss each. The indicator fixture did not provide enough
  warmup for RSI in every group. Live provider transport and the isolated
  browser queue were qualified separately. No deployment occurred.

## GOVX live queue through both replay views

Two isolated Journal test trades completed through the actual Analyzer job
queue and indicator history service, using the candidate gateway on loopback
with live Alpaca SIP raw candles. The test used two separate intraday trades on
opposite sides of the reverse split. The isolated worker clock and the two test
reservations were advanced past future-dated acquisitions from earlier fixtures.

| Session | Shares | Buy | Sell | Gross P/L |
| --- | ---: | ---: | ---: | ---: |
| November 10, 2026 | 2,400 | $0.14 | $0.1324 | -$18.24 |
| November 11, 2026 | 100 | $2.96 | $2.38 | -$58.00 |

Chromium verified both trades in Workspace and Session Tracker. In all four
views, the rendered buy and sell marker anchors matched the one-minute fill
timestamps and exact execution prices within 0.001 CSS px. Saved shares,
fill prices and realized gross P/L reconciled. Temporary browser
instrumentation was removed. No deployment occurred.
