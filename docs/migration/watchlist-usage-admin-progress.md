# Watchlist Usage Admin Progress

**Status:** Awaiting owner layout approval

**Controlling plan:** [Watchlist Runtime Dashboard Admin Plan](watchlist-runtime-dashboard-admin-plan.md)

## Scope

Provide a small, Platform-owned usage panel for the existing owner-only
`/admin/watchlist` page. It will report only factual client-confirmed visits
to the active member Watchlist index and ticker-detail pages:

- daily distinct visitors by America/New_York date;
- daily and all-recorded page-view event totals; and
- an owner-only display-name visitor table with factual visit counts and most
  recent visit time.

The panel does not track sessions, query or modify the Watchlist runtime,
record archive/how-it-works/Admin/API/background activity, accept browser
identity data, or expose a raw Discord subject.

The existing two owner accounts are also excluded at collection time: the
server uses its established owner predicate to discard their otherwise valid
Watchlist page views before storage. Frequent owner checks therefore do not
alter any displayed member metric or `Data since` value.

## Owner-review checkpoint

Pending approval of the following visible structure and terms:

1. Top cards: **Today's distinct visitors**, **Today's visits**, **All
   recorded visits**, and **Data since**.
2. **Daily Watchlist activity** table, newest New York day first, with
   distinct visitors and factual visits.
3. **Watchlist visitors** table, most recent visit first, with display name,
   most recent visit, today's visits, and all recorded visits.
4. A mounted Watchlist index/detail page writes no more than one event despite
   React rerenders. Real reloads and supported-page navigations are new visit
   events.
5. The two established owner accounts are discarded before storage, so their
   visits do not influence visitor or visit metrics.
6. Collection starts only after release; historical usage is not reconstructed.

## Implementation boundary after approval

Application work will require a new Platform-owned durable event ledger,
server-derived member identity, a member-authenticated recording endpoint,
client mount recording for the two allowed routes, and an owner-only read
model above the existing runtime iframe. The Coordinator assigns the migration
number and release order because an unrelated local `0092` exists and the
Platform migration manifest is shared.

## Verification boundary

No test, server, database, migration, provider, runtime, Git, staging or
deployment action has been run for this planning checkpoint. After owner
approval and Coordinator ownership confirmation, use only focused static and
schema-level checks appropriate to the assigned implementation.
