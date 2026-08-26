# Watchlist Runtime Dashboard Admin Plan

**Status:** Correction approved for implementation

**Scope:** An owner-only Dashboard page for the existing Railway Watchlist
runtime. This is separate from the member-facing official Watchlist route.

**Related record:** [Watchlist Dashboard Integration Progress](watchlist-dashboard-integration-progress.md)

## Owner-approved layout

The page is `/admin/watchlist`. For now it remains inside the established
signed-in Dashboard shell and is visible only to the protected two-owner
Discord-subject allowlist. The existing `/watchlist` routes, their content, CSS
and access contract remain unchanged.

The Admin body is the existing runtime-owned `Manual Watchlist` document, not a
new partial React recreation. Platform obtains that document server-side,
preserves its complete HTML, CSS and browser behavior, and relays its exact API
requests through the authenticated Platform origin. This carries the complete
runtime app, including all global controls, the Top Regular/Main/Post-Market
lists, every per-ticker action, the full Automatic Low-Float Selection form,
all AI Read controls and audit details, Live Website controls, Provider Health,
Runtime Config and Runtime Status.

## Security and data boundary

- The browser talks only to owner-authorized Platform document and API routes.
- Platform uses server-only `TRADERLINK_WATCHLIST_RUNTIME_URL` and
  `TRADERLINK_WATCHLIST_RUNTIME_ACCESS_TOKEN` configuration to reach the
  Railway private service. Neither value is emitted to the browser, source,
  logs or documentation.
- The page and API reuse the existing exact active Discord identity allowlist;
  no mutable display name, role name or client-supplied identity grants access.
- Only the exact GET/POST paths used by the existing runtime documents are
  relayed. The existing confirmation-protected bulk clear and Discord clear
  controls are included because the owner explicitly required complete app
  parity. Service restart, deployment and migration controls are not invented.

## Acceptance boundary

- Both approved owners see `Watchlist Admin` under Dashboard Stock Tools.
- Other accounts do not see that link and receive no runtime data or mutation
  path.
- The served document contains the same control IDs, sections, sessions and
  API request paths as the current runtime-owned Manual Watchlist source.
- The existing runtime remains the sole Discord and website publisher.
- The hosted page must load the complete runtime document without `Failed to
  fetch` before it is accepted.
