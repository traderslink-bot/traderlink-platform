# Analytics Page Architecture Plan

**Status:** Active — Overview is complete; Results and Execution remain separate review slices.

## Purpose

TraderLink Analytics is a set of focused analysis pages over the selected
Journal account's completed, eligible trades. Each page has one distinct job.
No page shows Import, Data Decisions, statement-source, manual-entry, or other
application-maintenance statistics.

| Page | Status | Single job |
| --- | --- | --- |
| Overview | Approved for implementation | Give the trader an immediate account snapshot. |
| Results | In implementation | Show results grouped by trader-relevant dimensions, starting with ticker. |
| Execution | Scope approved, retained only if useful | Show trade construction and execution behavior. |
| Trade Analyzer transition | Owner approved for separation | Move paid eligible Analyzer results into the dedicated Trade Analyzer navigation and capability pages. |
| Timing | Implemented / iterative visual review | Show performance by entry/exit time, weekday and trading session. |

## Overview

### Goal

`/analytics` is the concise account snapshot, not a second results table.
It uses only completed Journal trades that are eligible for the specific
metric. Unresolved decisions never hide valid unrelated trades.

### Approved content

Useful top-level cards are permitted on this page because they give the trader
an immediate whole-account picture:

1. Net P/L
2. Win rate
3. Profit factor
4. Expectancy per trade
5. Average win
6. Average loss
7. Largest win
8. Largest loss
9. Completed trades

The only main visual in the first slice is a clean monthly P/L chart. It is a
real Journal calculation, displays financial values at at most two decimals,
and contains no generic table, repeated coverage notice, source label or
filler card. Monthly P/L uses columns only; other chart types do not add useful
meaning to that view.

Every analytics page has one shared, page-level date-range control. Its active
range changes every card, chart, table and calculation on that page. Overview
defaults to all available completed-trade history and offers preset ranges plus
an exact custom start/end range. Its Monthly P/L chart also has an independent
Year selector for narrowing that chart's monthly bars to one available year.

### Excluded

- duplicate average-win/loss cards on Results;
- import, Data Decisions, statement, source or manual-entry counts;
- account equity, deposits, withdrawals, buying power, account-return or true
  account drawdown without the required broker account facts;
- Analytics Lab or Yahoo market-data results.

## Results

Results answers: **Which tickers, trade types or later trader-defined groups
produce my best and worst results?**

The initial default grouping is ticker. Each row shows total P/L, win rate,
profit factor, completed trades, trading days and average P/L per trade. The
table supports a case-insensitive ticker search and ascending or descending
sort on every displayed column. Future groupings such as trade type, tags and
setups are added only once their facts are complete and useful.

Results replaces the retired standalone Trades by Ticker page.

The all-time ticker view must return every supported ticker in the selected
range. It may use a bounded client table for searching, sorting, and visible
pages, but it must not reject a valid trader history merely because it contains
more than 500 ticker groups. The current table paginates visible rows locally;
it does not place a group-count cutoff on the trader's history. A later
server-side paging improvement may reduce payload and calculation time, but it
must preserve access to every ticker and never silently shorten results.

## Timing

Timing answers: **Which entry and exit windows have repeatable results?**

The existing charts remain the factual view of Net P/L, average P/L, win rate
or trade count by entry time, exit time, weekday and trading session. Their
raw summary must name the selected fact, such as **Highest total P/L**, rather
than call a total-dollar bucket the best time.

Entry and exit charts also show a separate **Most reliable** time only when a
30-minute range has at least 10 complete completed trades, a positive median
P/L, a win rate above 50%, and remains profitable after removing its single
largest winning trade. Qualifying ranges are ranked by a sample-adjusted
average P/L, then median P/L, win rate and trade count. This is historical
evidence, not a trade recommendation or a claim that timing caused the result.

The active implementation and owner-review record is
[Timing reliability progress](analytics-timing-reliability-progress.md).

## Execution

Execution answers: **How did I construct and manage my trades?**

The first slice is a date-filtered trade-construction workspace. It has three
real Journal charts: entry-size, maximum-position and hold-duration results.
Each uses Net P/L, win rate or trade count and offers the chart types that fit
the categorical data: horizontal bars and columns. A searchable, filterable,
sortable trade table shows ticker, direction, factual day/multi-day
classification, opened and closed time, execution count, average entry/exit,
maximum position, hold time and Net P/L.

Entry Price Results presents exact weighted-average entry-price bands for the
same completed-trade population: Under $1.00, $1.00 to under $2.00, $2.00 to
under $3.00, $3.00 to under $5.00 and $5.00+. Its primary question is whether
the trader's recorded Under-$1.00 results differ from $1.00-and-above results.
The comparison uses win rate and average P/L rather than total P/L, which would
favor a group with more trades. It never alters or equalizes trade counts:
fewer than 30 completed trades suppresses all findings; either comparison side
with fewer than 10 trades is explicitly incomplete; and a greater-than-2:1
count difference is called an uneven sample and presented only as direction.
The supporting $1.00-to-under-$5.00 findings require at least 10 trades in
their own band and use win rate or average P/L, never total P/L. The factual
table remains visible in every state; each completed trade belongs to one band,
so its counts and selected-basis Net P/L reconcile to the page population.
This is observed history, not a future price recommendation.

Scale-ins, scale-outs and re-entries are not shown as labels until their exact
per-trade definitions and read contract are implemented. If that cannot be
done without guessing, the page keeps the useful confirmed facts rather than
inventing behavior classifications.

Execution replaces the retired standalone Round Trips page.

## Trade Analyzer transition

The accepted combined Trade Analysis prototype proved the useful saved-result
facts, but it does not remain a generic historical Analytics page. Its paid
eligibility, Moomoo evidence and limited historical population belong to the
dedicated **Trade Analyzer** navigation group. The controlling page split,
pagination, eligibility and Help-link contract is defined in the
[Trade Analyzer Analysis Pages Plan](trade-analyzer-analysis-pages-plan.md).

## Implementation rules

- Use the light Material dashboard and the shared Journal Analytics contracts.
- Preserve exact money calculations; format visible dollar values to at most two
  decimals.
- No V3 calculation, Analytics Lab, sample or invented data.
- A chart or card must have a trader-facing purpose. Do not add layout filler.
- When a chart is added, deliver every substantive chart type for that exact
  data shape in the first version. Do not make the trader ask later for obvious
  alternatives. Do not add visual variants that would misrepresent the data.
- Each page is reviewed and committed as its own slice.

## Progress records

- [Overview progress](analytics-overview-progress.md)
- [Results progress](analytics-results-progress.md)
- [Timing reliability progress](analytics-timing-reliability-progress.md)
- [Execution progress](analytics-execution-progress.md)
