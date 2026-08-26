# Watchlist Runtime Dashboard Admin Plan

**Status:** Approved for implementation

**Scope:** An owner-only Dashboard page for the existing Railway Watchlist
runtime. This is separate from the member-facing official Watchlist route.

**Related record:** [Watchlist Dashboard Integration Progress](watchlist-dashboard-integration-progress.md)

## Owner-approved layout

The page is `/admin/watchlist`. It uses the established signed-in Dashboard
shell and is visible only to the protected two-owner Discord-subject allowlist.
The existing `/watchlist` routes, their content, CSS and access contract remain
unchanged.

At the top, show live AI Read cost cards and AI Read operations cards. The
operations summary intentionally omits a skipped card. It includes a clear
Publishing active/paused state and the latest market-data timestamp.

The page sections, in this order, are:

1. **Watchlist** — manual ticker activation and active tickers.
2. **Market Data Providers** — historical-candle and live-price provider
   selections supported by the runtime.
3. **AI Controls** — TradersLink AI Read model, generation, sessions, research,
   budget and refresh controls.
4. **Live Website Controls** — the existing public-card visibility controls and
   deterministic Day Trade Adapter.
5. **Runtime Status** — runtime and provider-health facts.

All cards read actual runtime state. A missing private runtime connection is
shown as unavailable; no totals are invented and no control claims a provider
choice that the runtime does not support.

## Security and data boundary

- The browser talks only to an owner-authorized Platform API route.
- Platform uses server-only `TRADERLINK_WATCHLIST_RUNTIME_URL` and
  `TRADERLINK_WATCHLIST_RUNTIME_ACCESS_TOKEN` configuration to reach the
  Railway private service. Neither value is emitted to the browser, source,
  logs or documentation.
- The page and API reuse the existing exact active Discord identity allowlist;
  no mutable display name, role name or client-supplied identity grants access.
- The first slice intentionally excludes destructive bulk removal, Discord
  channel clearing, service start/stop/restart, deployment, migration and
  hosted configuration changes.

## Acceptance boundary

- Both approved owners see `Watchlist Admin` under Dashboard Stock Tools.
- Other accounts do not see that link and receive no runtime data or mutation
  path.
- The existing runtime remains the sole Discord and website publisher.
- User-visible layout receives owner review through Railway staging before any
  production release.
