# Watchlist Dashboard Integration Progress

**Status:** Member-access correction complete locally; release pending

**Controlling plan:** [Phase 5 Slice F3 Watchlist Storage And Access Plan](phase-5-slice-f3-watchlist-storage-and-access-plan.md)

**Owner runtime dashboard:** [Watchlist Runtime Dashboard Admin Plan](watchlist-runtime-dashboard-admin-plan.md) and [progress](watchlist-runtime-dashboard-admin-progress.md)

**Visibility-control progress:** [Watchlist Visibility Admin Progress](watchlist-visibility-admin-progress.md)

## Scope

- [x] Render the official Watchlist route family in the signed-in Dashboard
  shell while preserving `/watchlist`, `/watchlist/[symbol]`,
  `/watchlist/archive`, `/watchlist/archive/[archiveId]`, and
  `/watchlist/how-it-works`.
- [x] Add the `Watchlist` item under Dashboard Stock Tools.
- [x] Preserve verified Discord-server membership for the ordinary Watchlist
  route/API boundary; no display-name, email or loose Discord-login fallback
  may grant access.
- [x] Keep the Admin Watchlist navigation item and runtime relay behind the
  protected `TRADERLINK_WATCHLIST_DASHBOARD_NAV_DISCORD_SUBJECT` owner
  allowlist.
- [x] Make the ordinary `Watchlist` navigation item and `/watchlist` route/API
  family available to every authenticated TradersLink Discord server member,
  without a Premium-role requirement.
- [x] Keep Community Watchlists separate and unchanged.
- [x] Record only authenticated active Watchlist index/detail page views for
  the owner-only Usage section; owner views, archive/help/Admin/API/background
  traffic remain excluded from the durable Platform ledger.
- [x] Add one owner-only global visibility setting that defaults to visible,
  hides the official Watchlist desktop/mobile navigation and route/API family
  from ordinary members when off, retains owner Admin access and fails closed
  when unavailable.

## Release configuration boundary

Before staging review, configure
`TRADERLINK_WATCHLIST_DASHBOARD_NAV_DISCORD_SUBJECT` with exactly the two
owner-approved stable Discord subjects for This Guy and TradersLink. Do not
store or commit those identifiers. A missing variable intentionally hides only
the owner-only Admin Watchlist navigation entry and never widens Admin page or
runtime-relay access.

## Help assessment

No matching public Help Center guide currently exists for the official
Watchlist. The Dashboard page-level help icon therefore remains absent on the
Watchlist routes rather than linking to an unrelated guide. The existing
`/watchlist/how-it-works` content follows the official Watchlist visibility
setting: it remains in the authorized Dashboard shell when visible and returns
the normal not-found boundary to ordinary members when hidden. No public Help
copy reveals whether an owner has hidden the Watchlist.

## Visibility setting boundary

The Coordinator allocated additive migration
`0100_platform_watchlist_visibility` after `0099`. It is registered but has
not been applied locally or hosted. It persists one default-visible global
setting and last-owner change metadata only. It does not alter the three
Watchlist data tables, usage ledger, publisher token, runtime relay, EODHD,
Moomoo, Scanner, Discord membership policy or Community Watchlists.

## Exclusions

No Watchlist publisher/runtime change, Levels change,
EODHD setting, Community Watchlist change, Discord-link setting change, push,
deployment, or service restart is part of this checkpoint. The member read API
access correction is explicitly in scope.

## 2026-08-26 member-access correction checkpoint

- The existing Platform Discord session boundary still requires a current
  verified membership row for the configured TradersLink server. The new
  member-only identity helper bypasses only the unrelated Dashboard/Premium
  eligibility branch for the Watchlist route family; it does not accept an
  arbitrary Discord login.
- `/watchlist`, its ticker/archive routes and the three member read APIs
  (list, symbol and stream) use that member-only identity. Publisher ingest,
  recap, archive reset, Moomoo bridge and runtime paths remain untouched.
- Dashboard navigation now has separate member Watchlist and owner Admin
  Watchlist flags. The ordinary Watchlist entry is visible to authenticated
  members; the Admin entry, page and relays retain the exact two-subject
  allowlist.
- The Discord callback and already-signed-in Watchlist return path no longer
  require a Premium role. Anonymous and non-member requests still fail closed.
- Visibility static verification: `git diff --check` passed and source tracing
  confirms owner bypass, member navigation hiding, the five route checks and
  shared API gate. Node/Next tooling is absent in this checkout, so TypeScript,
  lint, browser and migration checks did not run. No Vitest, local server,
  provider call, migration application, configuration change, push or
  deployment was run.
