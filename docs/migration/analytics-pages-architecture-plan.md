# Analytics Page Architecture Plan

**Status:** Active — Overview implementation approved; Performance scope approved; Results and Execution remain separate review slices.

## Purpose

TraderLink Analytics is a set of focused analysis pages over the selected
Journal account's completed, eligible trades. Each page has one distinct job.
No page shows Import, Data Decisions, statement-source, manual-entry, or other
application-maintenance statistics.

| Page | Status | Single job |
| --- | --- | --- |
| Overview | Approved for implementation | Give the trader an immediate account snapshot. |
| Performance | Scope approved | Show how account results change over days, weeks, months and years. |
| Results | Planned | Show results grouped by trader-relevant dimensions, starting with ticker. |
| Execution | Scope approved, retained only if useful | Show trade construction and execution behavior. |
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

## Performance

Performance answers: **How are my account results changing over time?**

It will use time-series views such as daily, weekly, monthly and yearly P/L,
cumulative P/L, realized drawdown and consistency. It does not repeat the
Overview metric-card set or become a trade-result list.

## Results

Results answers: **Which tickers, trade types or later trader-defined groups
produce my best and worst results?**

The initial default grouping is ticker. Each row will show total P/L, win rate,
completed trades, trading days, average P/L per trade and average hold time.
Opening a ticker leads to its completed trades. Future groupings such as trade
type, tags and setups are added only once their facts are complete and useful.

## Execution

Execution answers: **How did I construct and manage my trades?**

It is justified only by useful facts such as execution count, partial entries
and exits, scale-ins, scale-outs, re-entries, position size, hold time and
direction. If it cannot provide these useful views, remove the page rather than
showing generic quantity or fee statistics.

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
