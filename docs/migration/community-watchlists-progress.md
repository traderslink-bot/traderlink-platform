# Community Watchlists Progress

**Status:** Private-beta implementation in progress — owner authorization recorded 2026-08-22

**Controlling plan:** [Community Watchlists Plan](community-watchlists-plan.md)

## Current checkpoint

The owner approved the dashboard-native direction and then authorized the
private-beta implementation. The temporary sample-data preview has been
replaced in source with real signed-in routes: dashboard hub, create form,
minimal opt-in profile and direct published-list page.

Migration `0076_community_watchlists` was applied to the local Platform
database on 2026-08-22 after a verified pre-change backup/restore. It creates
Community-owned profiles, watchlists, ticker research cards and
publication-delivery records. Community records are owned by the stable
Platform user, never by a Journal account; they do not read or expose Journal,
broker, execution, account or performance data.

The shared migration runner also found and applied concurrently registered
`0077_platform_dashboard_member_access` immediately after 0076. The verified
post-run database has 77 migration rows; Community's four tables exist,
foreign-key check is empty and SQLite quick-check passes. No rollback was
attempted.

The server-only `DISCORD_COMMUNITY_WATCHLIST_WEBHOOK_URL` is read only when an
author presses Publish with Discord enabled. Delivery claims one pending
publication before posting, disables Discord mentions, and records either a
delivery or a safe failure. No webhook value was read, stored or sent during
implementation; no Discord message, Moomoo request, production, Git or
deployment state changed.

The first no-worker loopback review attempt used isolated port 3012 and was
stopped after the dashboard layout failed closed with
`TRADERLINK_MIGRATION_UNKNOWN_APPLIED`. That is an existing shared-database
concurrency boundary, not a Community Watchlists route failure. No migration
was run or bypassed, and browser visual acceptance remains pending a clean
dashboard review checkpoint.

The approved first release is:

- user-owned private drafts and opt-in published watchlists;
- manually entered ticker cards with optional author research;
- minimal public trader profile and direct published-watchlist route inside the
  normal signed-in dashboard;
- a compact, retry-safe Discord announcement that links to that exact route;
- a dashboard hub at `/community/watchlists` with My Watchlists and Shared
  Watchlists; and
- strict separation from the official Premium `/watchlist` product.

Connections, group membership, people discovery, comments, direct messages,
rankings, company pages and Moomoo enrichment remain deferred.

## Checkpoint status

| Checkpoint | Status | Notes |
| --- | --- | --- |
| Product boundary and routes | Complete | Owner-approved in the controlling plan |
| Dashboard visual preview | Complete in source | Approved visual language is retained in the real route components |
| Foundation contract | Applied locally | Migration 0076 and Community repository are present in the local 77-migration database |
| Dashboard creation | Ready for local review | Creates drafts with manual ticker research, curated selectable tags and author-created custom tags |
| Publish/direct pages | Implemented in source | Published lists and profiles remain inside the signed-in dashboard boundary |
| Discord announcement | Implemented in source | Server-only, mention-safe, one-publication delivery claim; no external message sent |
| Shared Watchlists hub | Implemented in source | Signed-in My Watchlists and Shared Watchlists queries are separate from official Watchlist |
| Owner visual review | Pending | Preview server was blocked by the shared migration boundary; no visual acceptance claimed |

## Next authorized step

Let the owner review the changed dashboard flow. A controlled private-channel
publish test is the next separate step and will not happen automatically.
