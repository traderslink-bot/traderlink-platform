# Watchlist Dashboard Integration Progress

**Status:** Implementation checkpoint complete; staging review and production release pending

**Controlling plan:** [Phase 5 Slice F3 Watchlist Storage And Access Plan](phase-5-slice-f3-watchlist-storage-and-access-plan.md)

## Scope

- [x] Render the official Watchlist route family in the signed-in Dashboard
  shell while preserving `/watchlist`, `/watchlist/[symbol]`,
  `/watchlist/archive`, `/watchlist/archive/[archiveId]`, and
  `/watchlist/how-it-works`.
- [x] Add the `Watchlist` item under Dashboard Stock Tools.
- [x] Keep that navigation item hidden unless the signed-in account has an
  active Discord identity matching the protected
  `TRADERLINK_WATCHLIST_DASHBOARD_NAV_DISCORD_SUBJECT` allowlist.
- [x] Preserve the existing Watchlist Premium/member route policy, data,
  API, stream, archive, Levels and publisher boundaries.
- [x] Keep Community Watchlists separate and unchanged.

## Release configuration boundary

Before staging review, configure
`TRADERLINK_WATCHLIST_DASHBOARD_NAV_DISCORD_SUBJECT` with exactly the two
owner-approved stable Discord subjects for This Guy and TradersLink. Do not
store or commit those identifiers. A missing variable intentionally hides the
Dashboard navigation item; it never widens page or API access.

## Help assessment

No matching public Help Center guide currently exists for the official
Watchlist. The Dashboard page-level help icon therefore remains absent on the
Watchlist routes rather than linking to an unrelated guide. The existing
`/watchlist/how-it-works` content remains available; it uses the Dashboard
shell for authorized Watchlist viewers and retains its public information page
for everyone else.

## Exclusions

No database migration, Watchlist API/publisher/runtime change, Levels change,
EODHD setting, Community Watchlist change, Discord-link setting change, push,
deployment, or service restart is part of this checkpoint.
