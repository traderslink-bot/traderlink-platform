# Workspace TradingView chart panel plan

## Purpose

Bring the existing `/charts` TradingView embed into Workspace without creating a
second chart implementation. The Workspace chart remains available while the
trader reviews their dashboard and can be opened directly for any trade ticker.

Progress is tracked in
[workspace-tradingview-chart-panel-progress.md](./workspace-tradingview-chart-panel-progress.md).

## Owner-requested interaction

1. The Workspace action row includes **Chart**, with the Visibility icon before
   the label.
2. Selecting Chart opens a reasonably sized embedded TradingView chart in
   Workspace.
3. The chart header provides full-screen and exit-full-screen controls.
4. Minimize keeps the chart mounted so a trader can return to the Workspace
   without losing the chart they were using. Closing the chart is separate from
   minimizing it.
5. Each Workspace trade-table row includes a Candlestick Chart action. It opens
   the same Workspace panel for that row's stock symbol.

## Implementation boundary

- Reuse `app/(dashboard)/charts/trading-view-chart.tsx` and add only a symbol
  input and presentation override needed by Workspace.
- Keep chart state in one Workspace client host so the top action and a
  table-row action control the same mounted panel.
- Full screen is an in-Workspace overlay, not a navigation away from Workspace.
- Do not add a market-data store, alter Journal facts, or change the `/charts`
  page.

## Acceptance

The same TradingView widget is used by `/charts` and Workspace; the top action,
row action, minimize/restore, full-screen/exit, and close behavior are all
available on desktop and mobile. Owner visual review remains required before
release.
