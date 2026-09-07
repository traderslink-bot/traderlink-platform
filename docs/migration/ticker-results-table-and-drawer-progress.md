# Ticker Results Table And Drawer Progress

**Status:** Source implementation and focused static verification complete on
2026-09-07. Integrated rendered verification remains the release gate.

**Parent plan:** [Phase 4 Core Analytics Plan](phase-4-core-analytics-plan.md)

## Approved target

The owner supplied screenshots and a live production Calendar drawer as the
visual authority. No separate visual mockup is required. `/analytics/results`
keeps its selected completed-trade closing-date range and Account reporting
currency.

The desktop ticker table uses sortable columns in this order:

1. Ticker
2. Gross or Net P/L from the selected Account P/L basis
3. Days
4. Trades
5. Wins
6. Losses
7. Win rate
8. Profit factor
9. Entry value
10. AVG P/L

`Days` preserves the existing Trading days result using the compact label the
owner approved when horizontal space is tight. `Entry value` is the exact sum
of the completed trades' total entry values for that ticker; it is not average
entry value and does not use Trade Analyzer data. Every column retains a visible
sort arrow and is also available through the narrow-screen Sort control. The
desktop table must fit without horizontal scrolling at the production desktop
viewport while the existing contained mobile scrolling remains available.

## Drawer contract

Selecting a ticker opens a Calendar-style right drawer scoped to the selected
ticker and page date range. The header shows the ticker and date range on the
left and Close plus the ticker P/L for that range on the right. There is no
Trade Tracker link.

Each completed trade is a Calendar-style expandable card. Its closing trade
date replaces the Calendar ticker symbol, and its selected-basis P/L appears at
the upper right. Profitable and losing cards use the exact theme-aware green and
red surface formulas already used by the Calendar drawer.

Collapsed cards show Notes, Rules and Tags indicators only when corresponding
saved facts exist. Expanded cards show the actual broken rule titles, actual
tag names and saved note text, followed by a nested Show executions disclosure
with exact execution time, side, shares and reporting-currency price.

## Delivery checklist

- [x] Inspect the supplied screenshots and live Calendar drawer.
- [x] Confirm the existing Results table, drawer and date-range data paths.
- [x] Add Wins, Losses and total Entry Value to the ticker result model.
- [x] Add visible-arrow sorting for every final table column.
- [x] Rebuild the Results ticker drawer using the approved Calendar hierarchy.
- [x] Add bounded account-scoped broken-rule titles to the existing supporting
  detail response.
- [x] Preserve the online/offline Ticker table contract.
- [x] Update Ticker Help guidance.
- [x] Complete focused lint and reduced-scope TypeScript verification.
- [ ] Complete integrated rendered verification in desktop/mobile and
  Light/Dark modes.
- [x] Create the required narrow local commit.

## Verification record

- `git diff --check`: passed.
- Focused ESLint over the nine changed TypeScript/TSX files: passed with no
  warnings or errors.
- Reduced TypeScript project limited to the changed source files: passed.
- The unrestricted repository-wide TypeScript process exceeded the computer's
  two-gigabyte Node memory ceiling, so it was stopped and replaced with the
  resource-safe reduced project check above.
- No Vitest or other test suite was run, in accordance with the active owner
  instruction.
