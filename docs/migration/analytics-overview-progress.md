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

## Financial outcome color follow-up - 2026-08-29

- [x] Overview now uses the shared financial-outcome metric convention: only
  signed P/L and per-trade outcome values become green or red; counts, win
  rate, profit factor, zero, and unavailable values stay neutral.
- [x] Calendar selected-period P/L and all visible month/week P/L values use
  the same signed convention, including neutral zero values. Existing day
  backgrounds, dates, counts, filters, and layout are unchanged.
- [x] Reviewed Green-to-Red against the shared convention already on `main`.
  Its signed actual and potential P/L cards are wired; neutral counts, rates,
  timing, opportunity, and damage values remain deliberately neutral.
