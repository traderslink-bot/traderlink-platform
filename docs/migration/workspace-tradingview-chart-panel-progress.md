# Workspace TradingView chart panel progress

Related plan:
[workspace-tradingview-chart-panel-plan.md](./workspace-tradingview-chart-panel-plan.md).

## Current state

| Item | Status |
| --- | --- |
| Reusable TradingView embed inputs | Implemented locally; source QA complete |
| Persistent Workspace chart panel | Implemented locally; source QA complete |
| Workspace Chart action | Implemented locally; source QA complete |
| Trade-row ticker chart action | Implemented locally; source QA complete |
| Owner visual review and release | Pending |

## Source QA

- The Workspace **Chart** action uses the requested Visibility icon before its
  label and opens the same TradingView component that `/charts` uses.
- The table Candlestick Chart action calls the shared Workspace chart host with
  that row's symbol; it does not navigate away from Workspace.
- The panel stays mounted while minimized, and full screen is a same-component
  Workspace overlay. Reopening a minimized panel restores it without replacing
  the widget; switching to a trade symbol intentionally reloads it for that
  ticker.
- Minimizing from full screen returns to the Workspace before hiding the chart.
- `git diff --check` passed. Targeted TypeScript and lint binaries are not
  installed in this checkout, so runtime and compiler verification remain for
  the later owner/release checkpoint.

## Help review

The Help Center has no existing Market Charts guide. This reuse of the existing
chart embed therefore does not leave a current guide inconsistent; a dedicated
Market Charts guide can be added as a separate documentation slice.
