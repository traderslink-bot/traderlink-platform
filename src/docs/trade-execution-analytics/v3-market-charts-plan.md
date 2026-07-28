# V3 Market Charts

## Scope

- Add one isolated TradingView chart page within the v3 dashboard template.
- Load the third-party chart only when the Market Charts route is opened.
- Keep the page outside the import-adapter work and preserve the shared dashboard shell and theme.

## Progress

- Added `/charts` using `DashboardPage` and `DashboardPanel`.
- Added the Market Charts navigation item below Trading Rules and above the Data group.
- Added a client-only light TradingView Advanced Chart with a loading and failure state.

## Next step

- After the dashboard worktree is merged, validate the page through the canonical dashboard preview with the approved local-owner profile.
