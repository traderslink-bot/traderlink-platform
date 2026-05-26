# Real-Data Calibration Public Readiness - 2026-05-06

Generated: 2026-05-07T12:55:47.208Z

This report is public-safe by design. It contains aggregate counts only and excludes private file names, private paths, account identifiers, symbols, raw rows, exact execution timestamps, exact prices, exact share sizes, and trade-level details.

## Scope

- source type: private IBKR activity-statement CSV
- asset scope: stock executions imported from broker CSV
- scoring policy: gross-only execution feedback
- session policy: U.S. equity session buckets classified in Eastern Time
- decision-review market context: requires levels-system daily/4h context and 1m/5m trade-window candles

## Current Launch Confidence

- status: ready_with_evidence_gated_limitations
- import/session-time path: ready for review on this aggregate sample
- decision-review path: ready with evidence-gated limitations for unavailable or unsafe candle context
- synthetic fixture action: no new fixture required from this run; no import/grouping/session/coaching logic miss was found

## Import Aggregate Counts

- rows parsed: 918
- accepted executions: 574
- rejected rows: 0
- skipped rows: 344
- grouped trades: 208
- duplicate request fingerprints: 0

## Lifecycle And Direction Counts

- closed: 206
- open: 2

- long: 207
- short: 1

## Session-Time Counts

Entry sessions:

- pre_market: 99
- market_open: 52
- midday: 33
- post_market: 23
- overnight: 1

Top entry hours:

- 09:00-09:59 ET: 42
- 08:00-08:59 ET: 38
- 07:00-07:59 ET: 37
- 10:00-10:59 ET: 26
- 16:00-16:59 ET: 15
- 12:00-12:59 ET: 13
- 13:00-13:59 ET: 9
- 06:00-06:59 ET: 6
- 11:00-11:59 ET: 6
- 14:00-14:59 ET: 4
- 17:00-17:59 ET: 3
- 18:00-18:59 ET: 3

Held-through sessions:

- pre_market: 104
- market_open: 71
- midday: 43
- post_market: 28
- overnight: 8

## Import Issue Counts

- non_trade_row_skipped: 344
- trade_request_validation_warning: 2
- trade_grouping_time_gap_split: 1

## Grouping Reason Counts

- flat_position: 206
- end_of_symbol: 1
- time_gap_split: 1

## Cost Visibility Counts

- commission_present: 574
- broker_net_amount_present: 0
- fees_present: 0

## Decision-Review Aggregate Counts

- import status: needs_review
- requested trades: 208
- analyzable trades: 206
- completed reviews: 204
- diagnostics: 4
- open skipped trades: 2
- execution-only fallback reviews: 5
- unsafe candle-basis rows: 5
- missing trade-window excursion insights: 0
- fallback/generic headlines: 0

Behavior invariant counts:

- profit-protection/captured-exit contradictions: 0
- stale poor-profit-protection fix-first labels: 0
- stale premature-exit fix-first labels: 0
- stale adding-into-weakness fix-first labels: 0
- stale undersized-winner fix-first labels: 0

Decision-review diagnostic codes:

- market_context_unavailable: 2
- trade_open: 2

Decision-review diagnostic families:

- daily_4h_context_unavailable: 2
- open_trade_skipped: 2

## Miss Summary

- blocker: 0
- high: 0
- medium: 0
- low: 0

- no import/grouping/session blocker misses found
- no market-data readiness misses found

Market-data coverage notes:

- 2 completed-trade candidate(s) could not receive full daily/4h market context.
- 5 review(s) used execution-only fallback because trade-window candle evidence was unavailable or unsafe.
- 5 review row(s) had unsafe candle-basis notes and were kept evidence-gated.

## Synthetic Fixture Decision

- no new synthetic fixture was created from this calibration run
- reason: evidence gaps were handled by skip/fallback gates, and no private-row logic defect was found
- next fixture trigger: create a synthetic fixture if a private run reveals an import/grouping/session/coaching logic miss rather than a warehouse-coverage miss

## Go / No-Go

- import/grouping/session-time: go for current intended stock-execution CSV scope
- decision review with market context: go with evidence-gated limitations; unavailable/unsafe candle rows must stay skipped or execution-only
- coaching from execution-only facts: go within existing gross-only/execution-only boundaries

## Verification Notes

- public report generated from private inputs using aggregate-only summarization
- private diagnostic JSON remains under private artifacts
- no private data is included in this committed report
