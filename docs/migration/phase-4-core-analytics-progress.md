# Phase 4 Core Analytics Progress

**Status:** Exact plan technically accepted under delegated owner authority; Slice A is authorized and implementation has not started
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

## Planning decisions drafted

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

## Next action

Preserve the accepted planning package in a local documentation commit, with no
push. Then implement Slice A only: frozen fact/query/result/registry contracts,
the owner/account-isolated Journal fact-set reader/service, source revision and
focused synthetic tests. Do not mutate the real database, start a server, change
routes/UI, or implement later metric slices during Slice A.
