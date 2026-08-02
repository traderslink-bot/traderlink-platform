# Phase 4 Core Analytics Progress

**Status:** Slice A is technically accepted under delegated owner authority; Slice B is active
**Controlling plan:** [Phase 4 Core Analytics Plan](phase-4-core-analytics-plan.md)
**Entry repository:** `C:\Users\jerac\Documents\TraderLink\traderlink-platform`
**Entry branch:** `codex/traderlink-platform-replacement`
**Entry HEAD:** `624849bc89b33c5fe07da5566d40be6135dea1f4`

## Entry boundary

- Phase 3 implementation commit:
  `8f6a4d4e4dec20ef6edcd50f476b14d368bde505`.
- Phase 3 closure commit:
  `624849bc89b33c5fe07da5566d40be6135dea1f4`.
- Working tree at planning entry: clean.
- Database: six migrations, 24 Journal domain tables, 2,284 source rows,
  1,072 Stock executions, 331 ready closed projections, zero automatically
  legitimate-open projections and two contained decisions.
- Database schema digest:
  `75571914c5fa4bbfe7876c8e9a72cc7d584eab91704d70cf889bf5f1b374a55a`.
- Database main-file size/hash: 10,522,624 bytes /
  `31101395dafb7bb14c2bf934e3288b40f63a5f8736a1da03cf549c996463af3b`.
- Sidecars: zero-byte WAL and 32,768-byte SHM; no pending WAL.
- Ports 3000/3010/3011: no listener at planning entry.
- No upstream, push, deployment, production mutation or legacy change.

## Accepted planning decisions

- Journal owns the read-only SQL fact set; Journal Analytics owns formulas.
- No Phase 4 schema migration or summary table is planned.
- Exact financial operations use integer-scaled decimals/rationals; division
  retains numerator/denominator and rounds only for display.
- Split-execution fees use deterministic largest-remainder allocation at the
  original source decimal scale so charges conserve exactly.
- Broker-signed fees require a versioned adapter sign policy; unknown sources
  make net metrics unavailable rather than guessing.
- Gross and net populations have separate coverage; partial net values are
  explicitly labeled as covered-trade results.
- Phase 4 monetary formulas support Stock multiplier one only; other asset
  classes remain coverage until a versioned multiplier/quote contract exists.
- Realized P/L uses ready-closed rows only. The two decision chains remain
  visible coverage and never block the 331 valid rows.
- Money is currency-partitioned; account base currency is not an FX rate.
- Closing trading date uses account timezone; named market sessions require
  missing instrument/session facts and remain unavailable.
- Different account timezones are separate calendar/timing partitions; the
  engine never merges unlike local trading dates.
- One read transaction loads the complete current allocation graph so
  concurrent reads, provenance joins and split-fee allocation cannot tear or
  duplicate rows.
- Open/decision aging uses explicit server `asOfUtc`; legitimate-open lifecycle
  analytics stay separate from the two current decision chains.
- One versioned registry covers every capability-catalog candidate, including
  explicit unavailable entries for missing trader/account/market facts.
- The private checkpoint uses an independent exact allocation/cash-effect
  calculation as well as production-service reconciliation.
- Workspace, Trades and Analytics consume the same fact revision and
  accumulator; pages perform no financial math.
- Public login remains deferred. A narrowly gated loopback-development scope is
  planned only for local visual review.
- Existing light Material UI remains the visual baseline. Analytics Lab and
  Trade Tracker UI are not silently redesigned.

## Planning acceptance

The adversarial review is complete. It added versioned broker fee-sign policy,
exact conserving split-fee allocation, Stock-only value conventions, full-graph
single-snapshot reads, provenance deduplication, currency/timezone partitions,
explicit `asOfUtc`, open-position boundaries, query/pagination limits,
independent private reconciliation, and fail-closed loopback authentication.
No unresolved planning issue remains.

## Planning preservation

The accepted exact plan was preserved locally at commit
`1ee87450544c98b991a21e99e9b3d61c95a180e7`
(`docs(migration): accept phase 4 analytics plan`). It has not been pushed or
deployed.

## Slice A result

Slice A added eight production/test files:

- the Journal fact-set contract;
- Analytics query, result and metric-registry contracts;
- the Journal fact-set repository and service;
- the focused fact-set repository test; and
- the focused Analytics contract test.

The reader is read-only and account-isolated. It opens one SQLite read
transaction, loads the full current active allocation graph, verifies current
execution/rebuild relationships and exact quantity conservation, deduplicates
provenance, carries pending decisions and coverage, and computes a deterministic
source revision. It does not filter away open/decision rows or let them suppress
ready-closed rows.

Verification on 2026-08-01:

- targeted ESLint: passed;
- dependency-scoped TypeScript for 8 roots/import closure: passed; and
- exact one-worker/no-file-parallelism Vitest gate: 2 files, 9 tests passed.

The synthetic gate covers ready-closed, legitimate-open and needs-decision
populations; duplicate provenance deduplication; full-graph loading with bounded
request metadata; stable/change-sensitive source revisions; frozen results;
member, omitted-account and forged cross-workspace denial; allocation loss;
stale execution versions; forked rebuild history; and rebuild-count drift.

No real/private database, statement, route, UI, process, server, package,
migration, push, deployment, production state or legacy repository changed.

## Next action

Implement Slice B only: exact math, exactly conserving charge allocation,
normalized rows/populations, coverage, first headline metrics, and shared daily,
ticker and 30-minute entry groups. Then run the combined Slice A/B focused suite
with one worker and no file parallelism. Do not start Slice C, private database
verification, routes/UI, launcher or server work until that gate passes.
