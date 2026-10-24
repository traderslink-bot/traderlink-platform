# Deferred news unread counts — source candidate only

Base: a7a3506821307e2be7f4318b0612f7cfd2dea18f, unchanged146-migration manifest.
No0177/index migration, release guard, maintenance runner, carrier overlay or unrelated feature is included.

The shared layout no longer waits for news unread counts. Authorized clients fetch
the same six counts after the shell paints. Existing Light/Dark badge components
are unchanged; unknown/error counts stay absent rather than displaying a false zero.
Offline shells retain their existing behavior. Account/user provider keys remount
the shell; navigation effects abort stale responses and never persist counts.

The private/no-store GET endpoint authenticates the current session and checks
active workspace membership and news.access. The request cannot choose a user,
database path or SQL. A server-created query plan uses the exact existing receipt,
route-tag and julianday visibility predicates, combined into a single conditional
aggregate with one coherent delay decision. Original synchronous repository callers
remain unchanged. The plan equals the previously native-fixture-verified one-pass SQL.

One read-only child per web process performs the count, not the request thread.
At most two additional distinct jobs queue; identical inflight authorized query
plans coalesce without retaining completed results. Jobs have a30-second total
deadline and child execution a20-second cap; a new child cannot start until the old
process closes. SQLite is readonly/fileMustExist/query_only; file device/inode is
checked before/after. The child inherits no credentials, only NODE_ENV/PATH.
Errors, timeout or queue saturation return503; the client retries at most once.
Logs contain only numeric duration and physical read-byte delta, never scope or SQL.

## Source verification

- Six-root semantic check:1837 resolved files, zero errors. Initial inferred
  never[] pool-state issue corrected with explicit State annotation.
- Focused endpoint/scope/private-cache and worker-pool/dedup/timeout/close tests pass.
- Real Node child/IPC fixture probe: parent63 timer ticks/max5.3ms gap while child
  performed285.2ms blocking fixture work and read37343232 physical bytes.
  This used a mock database adapter reading a source archive, NOT production SQL.
- Query plan and bindings match the previously native-verified one-pass candidate
  across eight user/delay combinations; no new SQLite writes or broad suite ran.
- React checklist: effect cancellation, primitive dependencies, serializable props,
  no completed-result/global-user cache, existing themes and offline behavior preserved.

## Outstanding release acceptance

Not pushed or deployed. The corrected production build and emitted-code/native
package inspection passed locally (details below). A no-volume image must contain native
better-sqlite3 and support IPC child execution. Measure real signed-in Railway
upstream/page phases and native query I/O under load before claiming improvement.
Fixture timing is not a production speed result. Child reads still share volume
I/O; other database, integrity or worker stalls are not proven solved.
The unrelated0177 whole-database backup/migration path remains separately held.

The first production build passed compilation/types but static emitted-code review
found webpack rewriting require.resolve to a numeric module ID. createRequire was
also treated as a bundler intrinsic. The final implementation passes the absolute
node_modules/better-sqlite3 package directory from the pinned npm/standalone Docker
layout, checks that directory exists and lets native Node load its package entry.
The original drafts stay unreleasable. Corrected runtime source commit
4a994c23e4fd15d9f068f8c09c16ef844655e2fe passed its own production build and
emitted-code review: compilation34.7s, TypeScript47s,281 generated pages and the
dynamic unread-counts endpoint. Build log:
/home/traderlink/projects/traderslink-coordinator/operations/deferred-unread-absolute-path-build.log.
The emitted route computes join(process.cwd(), "node_modules", "better-sqlite3")
and sends that variable via IPC, not a numeric webpack ID or unbound createRequire.
Standalone node_modules/better-sqlite3/package.json, its lib/index.js entry and
build/Release/better_sqlite3.node were present. All seven runtime-build source
blobs matched the immutable commit. This is static packaging evidence, not a
native production query or signed-in latency result. No further test runs after
the Coordinator's latest explicit no-tests instruction.

Cost boundary: one transient child, maximum96MiB old-space heap plus native RSS,
1MiB SQLite cache, no new Railway service or permanently running reader. This is
not a96MiB RSS cap or a billing guarantee. Completed results are not cached, so
later page visits can start another reader; overlapping identical plans coalesce.
Production native I/O, actual RSS/CPU and signed-in upstream timing remain required.
