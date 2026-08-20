# Trade Breakdown Progress

**Status:** Implemented and static-verified; owner visual review remains

## Approved scope

- `/analytics/execution` keeps its stable URL and uses the owner-approved visible
  name **Trade Breakdown**.
- The page plainly states: “See how your completed trades were entered, sized,
  held, and exited.”
- The date range applies to all charts and table data on the page.
- Three charts show entry-size, maximum-position and hold-duration results.
- Each chart may display Net P/L, win rate or trade count using horizontal bars
  or columns.
- The detailed table supports ticker, direction and factual day/multi-day
  filters, plus ascending or descending sorting on every displayed column.
- The detailed table keeps its row-count selector and page navigation together
  at the bottom right.
- It uses confirmed completed Journal trades only.
- Each trade row opens a responsive factual detail drawer with exact executions.
- Where a saved Trade Analyzer replay exists, the drawer shows the complete
  trade chart. Selecting one execution highlights its marker without replacing
  the complete-trade analysis.

## Deliberately deferred

- Per-trade scale-in, scale-out and re-entry labels until their Journal read
  contract can prove them exactly.
- Generic cards, source/application-maintenance statistics and filler charts.

## Verification boundary

Targeted ESLint, project TypeScript and diff-whitespace checks pass. No test
suite, build, browser server, database write, commit or deployment ran. The
integrated desktop visual and interaction review remains with the owner.
