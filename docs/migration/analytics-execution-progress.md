# Analytics Execution Progress

**Status:** In implementation

## Approved scope

- `/analytics/execution` is the separate trade-construction page.
- The date range applies to all charts and table data on the page.
- Three charts show entry-size, maximum-position and hold-duration results.
- Each chart may display Net P/L, win rate or trade count using horizontal bars
  or columns.
- The detailed table supports ticker, direction and factual day/multi-day
  filters, plus ascending or descending sorting on every displayed column.
- The detailed table defaults to 50 rows per page, with a top-right row-count
  selector and page navigation.
- It uses confirmed completed Journal trades only.

## Deliberately deferred

- Per-trade scale-in, scale-out and re-entry labels until their Journal read
  contract can prove them exactly.
- Generic cards, source/application-maintenance statistics and filler charts.
