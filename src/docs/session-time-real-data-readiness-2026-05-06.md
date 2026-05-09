# Session Time Real-Data Readiness Report

Generated: 2026-05-06T22:37:56.303Z

This report is public-safe by design. It contains aggregate counts only and excludes private file names, account identifiers, symbols, raw rows, and trade-level details.

## Import Summary

- rows parsed: 918
- accepted executions: 574
- rejected rows: 0
- skipped rows: 344
- grouped trades: 208

## Session Distribution

- pre_market: 99
- market_open: 52
- midday: 33
- post_market: 23
- overnight: 1

## Top Entry Hours

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

## Cross-Session Holds

- held pre-market into open: 19
- held open into midday: 11
- held midday into post-market: 5
- held post-market into overnight: 7
- held overnight: 8

## Issue Counts

- non_trade_row_skipped: 344
- trade_request_validation_warning: 2
- trade_grouping_time_gap_split: 1

## Readiness Notes

- Eastern Time session/hour fields populated on real broker execution data.
- The output is safe to share because it contains only aggregate counts.
- Entry-session performance remains entry-attributed; held-through counts are exposure labels, not per-hour P/L allocation.
