# Phase 4 Core Analytics Progress

**Status:** Slices A-D are technically accepted under delegated owner authority; Slice E is active
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

## Slice B result

Slice B added eight production files and four focused test files under Journal
Analytics, extended the result contract with the partitioned response, and
corrected the Slice A provenance fixture to the accepted IBKR adapter identity.

The implementation provides:

- exact scaled-integer decimal operations and reduced rational results, with
  half-up rounding confined to versioned display output;
- deterministic largest-remainder fee allocation that conserves the source
  units across split and flip executions;
- explicit fee cost/credit handling and fail-closed missing, conflicting,
  unsupported-policy and currency-mismatch states;
- Stock-only exact cash-effect normalization with scale-in, partial-exit,
  short, flip, holding-time, size, notional and provenance facts;
- separate realized, legitimate-open, needs-decision, unsupported and
  fee-incomplete populations;
- bounded filters with currency/account-timezone partitions and honest scope
  limitations where source counts cannot be attributed to one partition;
- a 22-metric first registry slice and one accumulator for gross/net counts,
  rates, totals, averages, medians, extrema, profit factor and expectancy; and
- daily, ticker and 30-minute entry groups that reconcile counts and gross/net
  sums to their exact parent population.

Verification on 2026-08-01:

- targeted ESLint: passed;
- dependency-scoped TypeScript for 14 roots/import closure: passed; and
- exact one-worker/no-file-parallelism Vitest gate: 6 files, 34 tests passed.

The focused gate covers exact long/short/scale/partial/flip behavior,
deterministic allocation and result ties, medians, ratios, zero denominators,
partial fees, multi-day grouping, currency/timezone separation, empty and
partial coverage, open/decision containment, cross-account denial, and the
shared page-service calculation path.

No real/private database, statement, route, UI, process, server, package,
migration, push, deployment, production state or legacy repository changed.

## Slice C result

Slice C added the independent complete capability manifest, extended metric
calculator, stable round-trip table, complete-registry and 10,000-execution
scale tests, and the Phase 4 static verifier. It extended the existing query,
normalization, population, grouping, accumulator and service paths instead of
creating page-specific analytics copies.

Accepted registry result:

- 126/126 legacy migration candidates present;
- 84 additional replacement capabilities present;
- 210 unique definitions total;
- 181 implemented or conditional on factual coverage;
- 29 unavailable with exact missing-fact reason codes; and
- registry SHA-256:
  `bc49aaceebff2af7b2a35bc16f99f89e9c1d3ceb461b234d2ac21992cfd3049e`.

The implemented/conditional families include activity, source/provenance,
charges, outcomes, holding time, quantity/notional, calendar, streaks,
realized-path drawdown/recovery/giveback, percentiles, exact population
variance, rounded standard deviation, concentration, trade construction,
legitimate-open lifecycle and privacy-safe Journal data-quality coverage.
Unavailable families identify the absent commission component, accepted
trader facts, account/equity/FX facts, market/order/session facts, Level
Analysis/catalyst/benchmark facts or configured review-signal threshold. No
sample result or motive label is emitted.

The query now validates its complete field allowlist plus weekday, 5/15/30/60
minute entry bucket, duration, quantity, maximum-position and entry-notional
ranges. All accepted groupings reconcile through the same accumulator. The
authenticated round-trip table uses stable keyset pagination, explicit
continuation/`rows_bounded` state, full-population totals and a required single
currency/timezone partition. Public aggregate/table DTOs do not expose account
or instrument UUIDs.

Verification on 2026-08-01:

- targeted ESLint: passed;
- dependency-scoped TypeScript for 22 roots/import closure: passed;
- exact one-worker/no-file-parallelism Vitest gate: 8 files, 45 tests passed;
- scale proof: 10,000 executions / 5,000 round trips, 1,010 milliseconds,
  32,428,424 bytes measured heap growth; and
- static verifier: passed with the counts and registry digest above.

The ordinary verifier launch reproduced the known pre-application Node/Windows
`uv_os_get_passwd` `ENOMEM`. The approved command-local preload was used for
only the affected verifier process and removed immediately. No global/system
setting or temporary file remains.

No real/private database, statement, route, UI, persistent process, server,
package, migration, push, deployment, production state or legacy repository
changed.

Slice C was preserved locally at commit `0fb4889e135b184f2eff03f76b0bff46b420a62f`
(`feat(analytics): complete capability registry`). It has not been pushed or
deployed.

## Slice D result

Slice D added the private Journal Analytics verifier and two focused synthetic
tests. Its independent calculation path uses its own integer-scaled decimal,
notional and deterministic largest-remainder fee-allocation implementation; it
does not call the production normalizer, fee allocator, exact-math module or
metric accumulator. Only digests, aggregate counts, match states and timings
are emitted.

The real accepted database gate passed on 2026-08-01:

- 331 ready closed, zero legitimate open and two contained decision rows;
- 331 fee-complete and zero fee-incomplete realized rows;
- production and independent row digest match:
  `bd463c61e001542768e9905e4b1b0576677a734ff493dc29538b47863cd734cf`;
- headline ready/fee counts, gross P/L, covered net P/L and charge totals match
  exactly without printing financial values;
- six page-service responses share fact-set revision
  `28f31836ece098ce9da5848855f9f2492cf1c13a5fc0da9e4930bdb5b7b5b1a4`,
  identical result/group digests and reconciled totals;
- stable keyset pagination returned all 331 rows exactly once; and
- final verification completed in 3,197 milliseconds while the database main file
  remained 10,522,624 bytes with accepted SHA-256 and zero pending WAL.

Targeted ESLint passed, dependency-scoped TypeScript passed, and the exact
one-worker/no-file-parallelism test gate passed 1 file/2 tests. The known
pre-application Windows `uv_os_get_passwd` `ENOMEM` required the approved
command-local preload for the real verifier and TypeScript process. It was
removed immediately; no temporary, repository, global or system setting
remains.

No route, UI, launcher, server, package, migration, database content, private
source, push, deployment, production state or legacy repository changed.

## Next action

Execute Slice E: read the relevant local Next.js 16.2.6 guides, implement the
fail-closed development-only scope boundary and replacement launcher, and cut
the named `/workspace`, `/trades/roundtrips`, `/analytics` and specialist
Analytics routes to the new services without V3 or sample fallbacks. Preserve
the accepted light Material shell. Run only focused route/architecture/
TypeScript checks, start one loopback replacement server on a verified free
port, and present the real-data pages for owner visual review.
