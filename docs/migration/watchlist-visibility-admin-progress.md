# Watchlist Visibility Admin Progress

**Status:** Focused static verification complete locally; Coordinator review pending

**Controlling plans:** [Watchlist Runtime Dashboard Admin Plan](watchlist-runtime-dashboard-admin-plan.md) and [Watchlist Dashboard Integration Progress](watchlist-dashboard-integration-progress.md)

## Approved outcome

The owner approved one global, owner-controlled switch that hides the official Watchlist from ordinary dashboard members without changing Watchlist data, publisher ingestion, EODHD/runtime behavior, Discord membership policy, Community Watchlists, Scanner, Moomoo or owner administration.

The persisted setting defaults to visible. When it is hidden, ordinary members do not receive the Watchlist item in desktop or mobile Dashboard navigation and cannot open the official Watchlist route family or member read APIs. The existing owner-only Admin Watchlist boundary remains reachable so an owner can restore availability. A missing, malformed or unreadable setting fails closed for ordinary members and is shown as unavailable only to the owner control.

## Implemented local boundary

- [x] Coordinator allocated `0100_platform_watchlist_visibility` immediately after `0099_daily_trade_execution_mismatches`; it creates one singleton, default-visible Platform setting. The migration is registered but has not been applied in this worktree or any hosted environment.
- [x] Added a server-only visibility read/write service. Its write path is re-authorized through the existing exact owner Discord-subject allowlist and records only the most recent stable Platform actor and timestamp.
- [x] Added the Platform-owned **Watchlist availability** panel above the retained runtime iframe on `/admin/watchlist`. It is not injected into the runtime document and does not receive runtime credentials.
- [x] Kept owner access available through the existing Admin predicate even when the setting is hidden. Ordinary member access is denied before any Watchlist storage read.
- [x] Applied the same decision to official index, ticker, archive, archive detail and Potential Path guide routes, plus list, symbol, stream and usage receipt APIs. Ordinary disabled requests receive the normal not-found boundary without a Watchlist availability disclosure.
- [x] Kept publisher-token ingest, recap, archive reset, Moomoo candle bridge, runtime relay and all Watchlist data unchanged.

## Visible copy

- Panel title: **Watchlist availability**
- Visible: **Watchlist available to members**
- Hidden: **Watchlist hidden from members**
- Save: **Save Watchlist availability**
- Hidden confirmation: **Watchlist is now hidden from members.**
- Visible confirmation: **Watchlist is now available to members.**

## Help coverage

There is no matching public Help Center guide for the official Watchlist. The existing `/watchlist/how-it-works` page is part of the official Watchlist route family and follows the same hidden-route decision, so it cannot expose a back-link to unavailable member content. No public Help article advertises whether the owner has hidden the Watchlist.

## Verification and release boundary

`git diff --check` passes. Static source tracing confirms the registered
`0100` migration/table, the owner control, all five official route checks,
the three member read APIs through the shared access service, usage-receipt
denial and desktop/mobile navigation gating. Node/Next tooling is not installed
in this checkout, so no TypeScript, lint, browser or migration check was run.
No Vitest suite, local server, migration application, data change, provider
call, push, deployment or Railway action is part of this local checkpoint. The
narrow commit record and Coordinator review are pending.

Coordinator release order remains: reconcile onto the then-current staging parent after the active lane clears; guarded staging backup/predecessor check; apply only `0100`; verify health; owner checks default-visible, OFF navigation/direct-route/API concealment with owner bypass, then ON restoration. Production requires separate explicit final owner approval and the guarded one-migration production procedure.
