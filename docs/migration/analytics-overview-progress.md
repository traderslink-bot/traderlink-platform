# Analytics Overview Progress

**Status:** In progress

**Route:** `/analytics`

**Controlling plan:** [Analytics Page Architecture Plan](analytics-pages-architecture-plan.md)

## Approved scope

- nine useful account-snapshot cards: Net P/L, Win rate, Profit factor,
  Expectancy per trade, Average win, Average loss, Largest win, Largest loss
  and Completed trades;
- one monthly P/L chart derived from completed eligible Journal trades;
- page-level all-time, preset and custom date ranges that recalculate every
  Overview result together; and
- light Material presentation with no generic table, source labels,
  Data Decisions notice or filler cards.

## Current step

Build the server read model and chart UI from the canonical Journal Analytics
service. No database mutation, source-data reload or Analytics Lab dependency
is authorized.

## Completion boundary

The slice is complete after the route renders actual selected-account facts,
the useful cards and monthly chart are visually reviewed, the exact files are
committed, and the branch is pushed. Broader analytics-page work remains out of
scope.
