# Watchlist Usage Presence Admin Progress

**Status:** Implementation accepted; local checkpoint pending

**Controlling plan:** [Watchlist Runtime Dashboard Admin Plan](watchlist-runtime-dashboard-admin-plan.md)

## Owner-approved scope

Add two short-lived, owner-only Watchlist Usage signals without changing the
existing durable visit ledger or the canonical Watchlist runtime:

- **Viewing now** means a member was recently confirmed with a visible
  Watchlist tab.
- **Watchlist open** means a member was recently confirmed with a Watchlist
  tab open, including a background tab.

The Usage panel refreshes its own owner-only snapshot every 60 seconds while
that section is open and the Admin tab is visible. It does not reload the
Watchlist controls or the full Admin page.

## Privacy and collection boundary

`0093_platform_watchlist_usage_presence_signals` owns one short-lived
presence table. It stores only an opaque browser-tab UUID, Platform user ID,
last-open heartbeat, and last-visible heartbeat. It never stores a Discord
subject, IP address, user agent, device name/fingerprint, raw URL, page path,
or ticker symbol. It retains no historical presence timeline.

The authenticated browser sends a same-origin heartbeat on mount, on
visibility changes, and once per minute. Reads ignore presence older than
three minutes and later heartbeats prune it. Browser suspension, a closed tab,
or network loss can therefore make the display briefly stale or disappear; the UI calls this recent
confirmation rather than continuous device monitoring.

The established two owner identities are discarded before the request body is
parsed or a presence row is written, just as they are for visit events. The
browser supplies no user identity. Optional Google Analytics consent remains
separate from these necessary first-party authenticated product records.

## UI contract

The owner-approved Usage cards are:

1. **Viewing now** — `Recently confirmed visible in a Watchlist tab`.
2. **Watchlist open** — `Recently confirmed open in a Watchlist tab`.

The owner-only visitor table adds **Current status**, with only `Viewing now`,
`Watchlist open`, or `Not currently open`. Existing daily/distinct/visit
metrics retain their event-only definitions.

## Release boundary

Migration allocation is `0093_platform_watchlist_usage_presence_signals`.
Moomoo retains `0094` and the paused demo contract will use `0095` when it
resumes. No migration has been applied, and no push, deployment, restart, or
runtime change is part of this local checkpoint.

## Local implementation

- Added the owner-only no-store Usage snapshot route and the separate
  member-authenticated presence receipt route. Both derive the Platform member
  server-side; the presence mutation also requires the established same-origin
  mutation guard.
- Added a per-browser-tab opaque heartbeat recorder only to successful
  authenticated Watchlist index and active ticker-detail mounts.
- Added Usage-only background refresh, the two approved cards, and the exact
  per-member current-status labels.
- Added the additive 0093 migration and managed-table registration. It remains
  unapplied.
