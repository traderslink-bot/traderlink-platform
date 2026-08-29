# Trade Breakdown Progress

**Status:** Entry Price Results ready for owner visual review; no release action authorized

**2026-08-29 update:** The owner approved the evidence-model revision for
Entry Price Results. It is ready for Coordinator integration only; no release,
deployment or production action is authorized by this approval.

## Entry Price Results - 2026-08-26

The owner-approved Entry Price Results slice is tracked in
[Entry Price Results Progress](analytics-execution-entry-price-results-progress.md).
It remains limited to `/analytics/execution` and must not add a Trade Explorer
view, a market-data dependency or a second calculation path.

The staging correction added the typed `entry_price_bucket` to the analytics
service's explicit supported-grouping allowlist after staging exposed the
omission. It also removed an unrelated reporting-currency/service suggestion
from the shared dashboard error fallback; the fallback now makes no guessed
claim about a page failure.

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

## Entry-price evidence update - 2026-08-29

Entry Price Results now treats Under $1.00 versus $1.00 and above as the
primary small-cap evidence question. It preserves exact completed-trade facts,
does not synthetically balance unequal samples, and uses the governed grouping
path for every displayed count, win rate and average P/L. The table retains
five factual ranges through $5.00+; only eligible $1.00-to-under-$5.00 ranges
can supply supporting findings. The page withholds conclusions before 30
completed trades, requires 10 trades per compared population and calls a
greater-than-2:1 population difference directional rather than conclusive.

## Verification boundary

Targeted ESLint, project TypeScript and diff-whitespace checks pass. No test
suite, build, browser server, database write, commit or deployment ran. The
integrated desktop visual and interaction review remains with the owner.
