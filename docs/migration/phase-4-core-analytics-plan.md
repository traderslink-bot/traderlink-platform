# Phase 4 Core Analytics Plan

**Status:** Technically accepted under delegated owner authority; Slice A contracts/fact-set implementation is authorized but has not started
**Phase:** 4 - Core Analytics
**Owner modules:** Journal publishes facts; Journal Analytics owns calculations
**Replacement repository:** `C:\Users\jerac\Documents\TraderLink\traderlink-platform`
**Entry branch:** `codex/traderlink-platform-replacement`
**Entry HEAD:** `624849bc89b33c5fe07da5566d40be6135dea1f4`
**Active database:** `C:\Users\jerac\Documents\TraderLink\private-data\traderlink-platform\development.sqlite`

## 1. Outcome

Phase 4 creates one exact, reusable Journal Analytics path:

```text
server-derived workspace/account scope
  -> Journal-owned read-only analytics fact set
  -> exact normalized closed/open/decision populations
  -> versioned metric registry and one shared accumulator
  -> totals, daily, ticker, timing, result, execution and coverage views
  -> Workspace, Trades, Analytics and later Calendar consumers
```

The engine gives the trader every useful analytic supported by accepted facts.
It does not hide valid activity because another chain needs a decision, and it
does not invent fees, account equity, market data, risk plans, setups, or trader
intent. V3 analytics, replay, receipt, digest, proof and authority systems are
not dependencies of this path.

Phase 4 includes the complete execution/round-trip calculation foundation and
the first route reconciliation. It does not claim that every final dashboard
page or later module is visually complete. Visible integration is reviewed in
the approved light Material shell before Phase 4 is accepted.

## 2. Accepted entry boundary

Phase 3 is accepted at:

- implementation commit
  `8f6a4d4e4dec20ef6edcd50f476b14d368bde505`;
- closure commit
  `624849bc89b33c5fe07da5566d40be6135dea1f4`;
- six migrations and 24 Journal domain tables;
- 2,284 immutable source records;
- 1,072 accepted Stock executions;
- 542 preserved unsupported Forex records;
- 333 active round-trip projections;
- 331 `ready_closed` projections;
- zero automatically `legitimate_open` projections; and
- two contained `needs_decision` projections.

The two decision chains remain factual Journal work. Analytics must show their
coverage but may not classify, repair, close or include them in realized
metrics. The 331 unrelated ready-closed projections remain usable.

The database main file is 10,522,624 bytes with schema digest
`75571914c5fa4bbfe7876c8e9a72cc7d584eab91704d70cf889bf5f1b374a55a`
and main-file SHA-256
`31101395dafb7bb14c2bf934e3288b40f63a5f8736a1da03cf549c996463af3b`.
Its WAL is zero bytes and SHM is 32,768 bytes. No process listens on ports 3000,
3010 or 3011 at planning entry. The legacy repository remains read-only
recovery/reference evidence.

## 3. Scope

Phase 4 implements:

1. a Journal-owned `JournalAnalyticsFactSet` read contract;
2. exact normalized round-trip rows derived from current immutable executions
   and current round-trip allocations;
3. a versioned metric registry covering every `first_slice`,
   `ready_after_rebuild`, and currently supportable
   `conditional_fact_coverage` capability in the controlling catalog;
4. exact filters, currency partitions, time attribution, outcome populations,
   groupings and reconciliation;
5. coverage/unavailable metadata for open, decision, excluded, unsupported,
   missing-fee, missing-account, trader-fact and market-data cases;
6. bounded server services for Workspace, Trades, Analytics Overview,
   Performance, Results, Timing and Execution;
7. a privacy-safe read-only verifier against the accepted private database;
8. replacement route adapters for `/workspace`, `/trades/roundtrips`,
   `/analytics`, `/analytics/performance`, `/analytics/results`,
   `/analytics/timing`, and `/analytics/execution`; and
9. a replacement local launcher/authentication boundary sufficient for
   loopback development without declaring public login complete.

Phase 4 does not implement or infer:

- account equity, account return, deposits/withdrawals, buying power or true
  account drawdown;
- cross-currency conversion without timestamped FX facts;
- slippage, MFE/MAE, VWAP, liquidity, volatility, benchmark, catalyst or level
  analytics without complete versioned provider facts;
- planned risk, R multiples, setups, tags, rule adherence, motives or coaching
  conclusions without trader-accepted facts;
- Analytics Lab query persistence or its current V3/sample runtime;
- Trade Tracker multi-day UI, public Discord/email login, deployment, production
  migration, cleanup or legacy retirement; or
- a database summary table/cache before measured performance proves it is
  necessary.

## 4. Module and dependency boundary

Journal owns the SQL and publishes facts. Journal Analytics never queries
Journal tables directly and never imports a Journal repository implementation.

New dependencies point in this direction only:

```text
Platform scope -> Journal fact-set service -> Journal Analytics -> page adapter
```

The Journal fact-set service is the sole SQL reader for analytics. Its public
contract belongs under `src/modules/journal/contracts/`. Its implementation
belongs under `src/modules/journal/server/analytics/`. Journal Analytics owns
its contracts, exact math, normalization, registry, accumulators, services and
view DTOs under `src/modules/journal-analytics/`.

No new file in the normal replacement path may import:

- `src/lib/trader-intelligence-v3`;
- V3 analytics/query/authority/replay/digest/proof packages;
- `src/lib/trader-analytics` as calculation authority;
- page-local finance helpers; or
- a repository from another module.

Legacy types may be translated only at an explicitly named compatibility edge;
they never enter the new fact or metric contracts.

## 5. `JournalAnalyticsFactSet` contract

One fact set is immutable and scoped to one authenticated workspace plus an
allowlisted non-empty account selection. It contains no raw source rows, broker
account identifiers, fingerprints or HMAC material.

The reader uses one SQLite read transaction so accounts, round trips,
allocations, executions, provenance, decisions and coverage come from one
consistent snapshot. It reads the complete current active allocation graph for
the selected accounts before date filtering. A date-bounded SQL shortcut must
not omit another allocation of a split execution or break charge conservation.

### Scope metadata

- workspace ID and requested account IDs, all derived from
  `WorkspaceAccessScope`;
- per-account base currency and IANA trading timezone;
- requested inclusive closing-date range or `all_available`;
- requested currency partition or explicit multi-partition response;
- deterministic fact-set contract version;
- source revision SHA-256 and generated-at UTC instant; and
- earliest/latest available Journal coverage dates.

### Round-trip facts

For every current active round trip, including non-ready coverage rows:

- stable round-trip ID and current version ID/version number;
- stable instrument ID, privacy-safe displayed symbol and asset class;
- account ID, trade currency and direction;
- opened and closed UTC instants;
- projection state and coverage reason;
- current rebuild ID, algorithm version and rebuild completion instant; and
- ordered allocation facts.

### Allocation facts

Each allocation contains:

- allocation sequence and role;
- stable execution ID and current execution-version ID;
- execution state, UTC instant, deterministic source order, side;
- exact allocated quantity and exact total execution quantity;
- exact price or explicit missing-price state;
- original fee decimal, fee currency and fee sign convention;
- sorted privacy-safe fee-policy candidates derived from the current execution
  version's source system, adapter ID/version and provenance kind;
- execution fact completeness; and
- an allowlisted provenance set from `broker`, `manual`, `correction`, and
  `overlap_match`.

The fact-set reader verifies rather than assumes:

- every round-trip allocation points to the current accepted execution version;
- allocation quantities conserve each execution quantity across all active
  projections;
- `ready_closed` rows have zero final position, a close time, complete price
  facts and no pending chain decision;
- selected accounts are active and authorized;
- current rebuilds have no forks and match current round-trip versions; and
- all rows are deterministically ordered.

Any invariant failure returns one stable unavailable/error code; it never falls
back to V3, a saved report, sample data or zero values.

## 6. Source revision and freshness

The fact-set source revision is SHA-256 over deterministic JSON containing:

- contract version;
- workspace/account selection;
- each selected account's timezone and currency;
- current round-trip ID/version/state/rebuild identity;
- every ordered allocation ID, execution ID/current-version ID and exact
  position-changing facts;
- relevant current provenance classifications;
- pending decision IDs/revisions and reason codes; and
- Journal coverage summary revision inputs.

It excludes generated-at time and display formatting. Identical Journal facts
produce the same revision. Every analytics response carries the fact-set
revision and metric-registry version. No Phase 4 analytics result is persisted;
a request recomputes from current facts. Materialization is a later measured
optimization and must prove identical output for the same revision.

Time-dependent metrics additionally receive a server-derived `asOfUtc` query
fact. Tests inject it. Open age and decision age include that instant in their
result digest, while the underlying Journal fact-set revision remains unchanged.

## 7. Exact math contract

Financial inputs are validated canonical decimal strings. Authoritative sums,
differences, products, comparisons and ordered medians use integer-scaled
`BigInt` or an equivalently exact decimal representation. JavaScript `number`
and SQLite `REAL` are prohibited for financial authority.

Division results use a reduced exact rational:

```text
{ numeratorDecimal, denominatorInteger, roundedDecimal, roundingPolicy }
```

The exact numerator and denominator remain available for reconciliation.
`roundedDecimal` is a view value, never the source of another calculation.
Default policies are:

- money display: at most two decimals, half-up, while exact source remains;
- percentage display: two decimals, half-up;
- ratios: four decimals, half-up;
- durations: integer milliseconds plus readable duration;
- counts: integers; and
- chart coordinates: exact decimal strings, converted only by a rendering
  adapter that cannot feed values back into analytics.

Zero denominators return `unavailable` with a specific reason. Infinity, NaN,
implicit zero and silent precision truncation are forbidden.

Median sorts exact values. Odd median selects the middle value; even median is
the exact sum of the middle pair divided by two. Percentiles use nearest-rank so
the selected value remains an observed exact fact. Population variance is
published as an exact rational. Standard deviation is an explicitly labeled
deterministic rounded square root and is never represented as an exact decimal.

## 8. Gross P/L, notional, quantity and duration

For an allocation with exact quantity `q` and price `p`:

```text
cash effect = q * p * (+1 for sell, -1 for buy)
```

Phase 4 monetary formulas support `stock` instruments with unit multiplier one.
An option, future, Forex, crypto or other asset requires a versioned contract
multiplier/quote convention before notional or P/L becomes eligible. Unknown or
unsupported asset classes remain visible coverage with
`instrument_value_convention_missing`; they are not treated as stock.

For a `ready_closed` round trip:

- gross P/L is the sum of all allocation cash effects;
- position-increasing roles are `opening`, `adding`, `flip_opening`;
- position-reducing roles are `reducing`, `closing`, `flip_closing`;
- entry notional is the sum of `q * p` for position-increasing roles;
- exit notional is the sum for position-reducing roles;
- entered quantity is the sum of position-increasing quantities;
- maximum position quantity is the maximum absolute running position after each
  allocation; and
- holding duration is final close time minus first open time.

Direction is a Journal fact and must agree with the signed allocation path.
Gross P/L, entry/exit notional and quantity metrics fail closed for a row whose
required price/quantity/allocation facts do not reconcile.

`return_on_entry_notional` means realized trade P/L divided by entry notional;
it is not account return. `pnl_per_100_entered_shares` uses total entered
quantity, not maximum exposure. Public titles state those definitions even if a
legacy compatibility metric ID is mapped to them.

## 9. Fee and net-P/L policy

Original fee sign/convention evidence remains unchanged. Analytics derives two
non-negative values per execution:

- charge cost from a negative broker-signed/cash-effect fee; and
- charge credit from a positive broker-signed/cash-effect fee.

`cash_effect` supports that sign rule directly. `broker_reported_signed` is
supported only when every relevant broker provenance for the current execution
version resolves to the same versioned source sign policy in the registry.
Phase 4 initially supports the accepted IBKR adapter policy: negative is cost
and positive is credit. Missing, conflicting, new or unknown
broker/adapter/sign-policy candidates make charge/net metrics unavailable with
`fee_sign_policy_unsupported`; one candidate is never selected silently.

Net P/L is:

```text
gross P/L - allocated charge cost + allocated charge credit
```

Fee allocation is deterministic and exactly conserving when one execution is
split across projections. Convert the original fee to integer units at its
preserved decimal scale. Allocate units by allocation quantity using
floor-proportional shares, then distribute remaining source-scale units by
largest fractional remainder with allocation sequence and stable IDs as tie
breakers. Allocated units must sum exactly to the original fee units.

A round trip has complete charge coverage only when every allocated execution
reports a supported fee fact, every fee currency equals the trade currency, and
fee allocation conservation passes. `not_reported`, currency mismatch,
unsupported sign convention or failed conservation makes only charge/net
metrics unavailable for that row. Gross, activity, quantity and timing metrics
remain eligible when their own facts are complete.

Aggregate net metrics operate over fee-complete rows and report `partial` when
the gross-eligible population contains fee-incomplete rows. Their UI title must
say `covered trades` in partial state. They must never be presented as the full
selected-account total. Gross metrics retain the complete realized population.

## 10. Population, currency, date and coverage rules

### Realized population

Only current active `ready_closed` projections may enter realized P/L metrics.
`legitimate_open`, `needs_decision`, superseded round trips, excluded executions
and unsupported asset rows remain separate coverage populations.

### Date filtering

Realized metrics use the round trip's closing trading date in its Journal
account timezone. Bounds are inclusive. Open/decision coverage intersects a
date range when its lifecycle interval overlaps the range, so a carried
position or unresolved chain does not disappear merely because it opened
earlier. `all_available` uses every current fact.

### Currency

Money is aggregated only within one trade-currency partition. A multi-currency
request returns separate partitions. Counts may have a clearly labeled
cross-currency total, but money, notional, averages, paths and contributions do
not. Account base currency is metadata, not an FX conversion fact.

Multi-account calendar/timing groups combine only accounts with the same IANA
trading timezone. Otherwise the response returns separate account-timezone
partitions. It never merges different local trading dates or time buckets under
one unlabeled day.

### Time and sessions

Entry/exit trading dates, weekdays and local-time buckets use the account's IANA
timezone with deterministic DST tests. Time-of-day grouping supports allowlisted
5, 15, 30 and 60 minute buckets; the first UI uses 30 minutes. Named market
sessions remain unavailable until an instrument/exchange session-timezone fact
exists. The engine does not assume every Stock is a U.S. regular-hours symbol.

### Coverage response

Every response includes candidate, included, ready-closed, legitimate-open,
needs-decision, excluded, unsupported, fee-complete, fee-incomplete and
unavailable counts plus reason-code counts. Coverage distinguishes `complete`,
`partial`, `empty` and `unavailable`. A valid zero is never represented as an
error or missing result.

## 11. Filters and groupings

Allowlisted filters:

- authorized account IDs;
- currency;
- inclusive closing-date range;
- stable instrument/symbol;
- direction;
- provenance classification;
- gross or net realized outcome;
- entry weekday and local-time bucket;
- holding-duration bucket;
- entered-quantity, maximum-position and entry-notional buckets when covered;
  and
- later accepted tag/setup/rule IDs, which currently return unavailable rather
  than accepting arbitrary fields.

Allowlisted groupings:

- total;
- closing day, ISO week, month and year;
- entry weekday and time-of-day bucket;
- instrument/symbol;
- direction;
- account;
- provenance classification;
- holding-duration bucket;
- entered-quantity, maximum-position and entry-notional buckets; and
- realized outcome.

Provenance grouping is mutually exclusive at the round-trip level:
`broker_only`, `manual_only`, `correction_only`, `mixed` or `unknown`. It is
derived from the set of current allocation provenance kinds after deduplication;
multiple provenance rows may not multiply an allocation. `overlap_match` is
reported as additional overlap evidence and maps to `mixed` only when distinct
broker/manual origins are actually present. Source is never treated as a quality
score.

Every filter is validated server-side. Unknown fields, operators, metric IDs,
groupings, bucket sizes, timezones and currencies fail closed. Group rows are
computed by the same normalized-row accumulator as the total and must reconcile
exactly to it.

Queries are bounded without silently changing their population. Account and
symbol lists, requested metric IDs, page sizes and group-row counts have named
limits. Round-trip tables use stable keyset pagination with a maximum 200 rows
per page. Group totals are computed over the full filtered population before
result pagination; a bounded response returns an explicit continuation cursor
and `rows_bounded` limitation rather than pretending the first page is complete.

## 12. Versioned metric registry

Registry version `journal_analytics_metrics_v1` contains one immutable
definition for every candidate in the controlling
[Analytics Capability Catalog](analytics-capability-catalog.md). Each entry
records metric ID, title, unit/value kind, formula version, required facts,
basis, currency, date/time, open/decision/exclusion, zero-denominator, display,
coverage and capability-state policies.

The static verifier compares the machine-readable registry manifest to all 126
legacy migration candidates and every additional named Phase 4 capability.
Duplicate, unknown or unclassified IDs fail. A capability may be implemented,
conditional or unavailable, but may not disappear from the target inventory.

Ambiguous legacy IDs receive explicit compatibility mappings rather than
carrying unclear definitions into the new public contract:

| Legacy candidate | Replacement definition |
| --- | --- |
| `signed_charges` | Net broker charge cash effect with source sign policy; normal UI separates `charge_cost` and `charge_credit` |
| `commission_signed_charges` | Commission-only charge cash effect when provenance/adapter policy supports that kind |
| `missing_*_authority_count` | Corresponding missing factual-coverage count; no V3 authority meaning |
| `average_share_quantity`, `median_share_quantity`, `maximum_share_quantity`, `average_position_size`, `median_position_size` | Maximum absolute open quantity per round trip, aggregated as named |
| `net_pnl_per_100_shares` | Net P/L per 100 entered shares, with complete net and entered-quantity coverage |
| `maximum_intraday_drawdown` | Compatibility alias only for explicitly titled `maximum_intraday_realized_drawdown`; never account/equity drawdown |

`total_execution_count` counts unique current execution IDs in scope.
Per-trade execution count counts unique allocated execution IDs for that trip; a
flip execution may participate once in each adjacent trip, while the scope-wide
unique execution count still counts it once.

### Coverage and activity

- candidate/included/excluded counts and rates;
- ready closed/open/decision populations and reason counts;
- trading-day/account/instrument/execution counts;
- average executions per trade;
- source/provenance counts;
- long/short counts and rates;
- trades per trading day: average, median, minimum and maximum; and
- repeat attempts per instrument/entry trading date. A repeat attempt is the
  second or later zero-to-nonzero round trip and does not imply motive.

### Gross, charges, net and outcomes

- gross profit, gross loss, gross P/L, averages and medians;
- charge cost/credit, commission evidence and gross-to-net difference with
  explicit complete/partial coverage;
- net P/L, average/median P/L and total/average/median winning and losing P/L;
- best/worst trade with close-time then stable-ID tie break;
- win/loss/flat counts and rates;
- average/median win-loss ratio;
- profit factor;
- expectancy; and
- breakeven win rate.

Gross loss is a negative money value. Profit factor is gross profit divided by
absolute gross loss. Average win/loss ratio uses average positive P/L divided by
absolute average negative P/L. Breakeven win rate is `abs(avg loss) / (avg win +
abs(avg loss))`. Missing populations or zero denominators are unavailable.

### Holding time, quantity and notional

- average, median, minimum and maximum holding duration, including winner/loser
  partitions;
- entered quantity and maximum-position quantity distributions, including
  winner/loser partitions;
- entry-notional distributions, including winner/loser partitions;
- P/L per 100 entered shares;
- return on entry notional; and
- entry/add/reduction/exit, scale-in/scale-out, flip and execution counts.

### Trading-day and calendar results

- exact closing-day P/L series;
- daily average/median/best/worst;
- profitable/losing/flat day counts and rates;
- average/median green-day and red-day P/L;
- weekday, week, month and year totals;
- active days, overnight and multi-day counts; and
- entry/exit local-time distributions. Named market-session metrics remain
  unavailable until their missing session facts exist.

### Distribution, path, streak and concentration

- nearest-rank percentiles, exact histogram bins and cumulative realized P/L;
- rolling trade-count averages with explicit window size;
- exact population variance and labeled rounded standard deviation;
- longest/current winning and losing streaks, with flat trades breaking a
  streak;
- P/L excluding largest winner, largest loser, or both;
- largest winner share of gross profit and largest loser share of absolute
  gross loss;
- realized closed-trade drawdown/recovery/giveback, never account drawdown;
- per-day green-to-red/red-to-green realized-path counts; and
- P/L, activity and absolute-volume/notional concentration by instrument,
  direction, day, account and provenance.

Realized path order is closing UTC instant then stable round-trip ID. Intraday
path resets at zero for each closing trading date. Intraday drawdown is the
maximum prior intraday realized peak minus a later trough. Recovery is a later
rise from a trough. Peak giveback is the intraday peak minus final daily result
when positive. Unqualified `maximum_intraday_drawdown` is not a public metric;
the accepted title is `maximum_intraday_realized_drawdown`.

### Data quality and unsupported capabilities

Journal coverage publishes import issue counts/rates, decision aging, duplicate
and exact-reimport outcomes, unsupported source categories, complete/partial
coverage ranges and provenance distribution without raw private values.

Registry entries for trader-fact, account-fact and order/market-data analytics
remain present with `unavailable` and exact missing-fact codes. They do not emit
sample results. Review signals such as rapid re-entry or size-after-loss may be
published only as factual sequences/threshold matches; motive words such as
revenge, FOMO, tilt or discipline are prohibited without trader confirmation.

### Open-position lifecycle

Current `legitimate_open` projections support open count, direction, exact
current quantity, entered quantity, execution-derived weighted-average cost,
opened time, age as of the request instant, carried trading days and provenance.
The weighted-average cost policy adds entry quantity/notional, preserves average
cost across reductions, and resets at zero/flip; it is labeled execution-derived
and is not broker tax-lot basis. Unrealized P/L remains unavailable without a
current price fact. A `needs_decision`
projection is not included in the legitimate-open population even when its final
quantity is non-zero. The current real dataset therefore returns a valid empty
legitimate-open population and two decision rows, not two inferred open trades.

## 13. Analytics result contract

Every metric result contains:

- metric ID, formula version, title, description, value kind and unit;
- `complete`, `partial`, `empty` or `unavailable` state;
- exact value or exact rational plus rounded display metadata;
- gross/net basis and charge policy;
- currency partition;
- timezone/date attribution policy;
- applied filter and grouping descriptors;
- candidate/included/excluded/open/decision counts;
- limitation/unavailable reason counts;
- fact-set revision and registry version; and
- deterministic result digest.

The public DTO does not expose workspace/user/account UUIDs, source row IDs,
execution-version IDs, fingerprints or decision IDs. An authenticated Trades
response may expose the stable round-trip identifier needed for its own detail
link, but logs, verification output and aggregate responses do not. The result
digest covers canonical exact values, policies, filters, coverage, fact revision
and `asOfUtc` when applicable; it excludes generated-at time and presentation
formatting.

Grouped responses include a total calculated independently from the same
filtered normalized population and a reconciliation object proving group counts,
money sums and coverage counts equal that total. Ordering and ties are explicit.

## 14. Published server services

Journal publishes:

- `getJournalAnalyticsFactSet(accountScope, filters)`; and
- a bounded Journal coverage summary used alongside the fact set.

Journal Analytics publishes:

- `getAnalyticsOverview(scope, query)`;
- `getPerformanceAnalytics(scope, query)`;
- `getResultAnalytics(scope, query)`;
- `getTimingAnalytics(scope, query)`;
- `getExecutionAnalytics(scope, query)`;
- `getRoundTripAnalyticsTable(scope, query)`;
- `getWorkspaceJournalAnalyticsSummary(scope, query)`; and
- capability/coverage metadata.

Server Components call these services directly. The compatibility
`/api/intelligence/dashboard/overview` Route Handler may translate the same
Workspace result for the existing client during cutover, but it owns no math and
must lose all V3 imports. New browser APIs are added only for a real browser HTTP
need.

## 15. Local authentication and launcher boundary

Public login remains deferred, but the replacement dashboard needs an honest
local review path. Phase 4 may add a development-only Platform scope adapter and
launcher with all of these gates:

- `NODE_ENV=development` exactly;
- explicit `TRADERLINK_PLATFORM_ALLOW_DEVELOPMENT_DASHBOARD=true`;
- request host resolves to loopback only;
- exactly one active seeded development owner/workspace/account;
- no client-supplied workspace/account/user IDs; and
- production/hosted/ambiguous states fail closed.

The adapter derives the same stable Platform/Journal UUID scope; it is not a
public login provider and creates no identity rows. Phase 5 later replaces this
edge with Discord-first session authentication without changing facts.

The replacement launcher must not import the V3 protected launcher. The default
replacement `dev`/`start` scripts switch only after the first route slice is
ready; the former V3 launcher remains explicitly named as legacy reference
during transition.

## 16. UI integration and visual gate

The approved light Material shell, shared dashboard template, navigation and
page structure remain unchanged unless separately shown to and approved by the
owner. Phase 4 first changes data/auth adapters, not the visual system.

Review order:

1. `/workspace`: real metrics plus visible closed/open/decision/fee coverage;
2. `/trades/roundtrips`: 331 ready rows and two clearly separated decision rows,
   with no sample/fallback data;
3. Analytics Overview, Performance, Results, Timing and Execution pages using
   the shared engine; and
4. responsive/empty/partial/unavailable states.

Analytics Lab, Calendar visual changes and Trade Tracker presentation are not
silently redesigned in this phase. Their data consumers may receive published
contracts, but visible changes require their own approved slice.

## 17. Database and operational policy

Phase 4 adds no database migration or analytics summary table. All database
work is read-only against the accepted six-migration Journal database. No new
backup is required for ordinary Phase 4 reads; a backup is required before any
later write/migration proposal.

The private verifier may use the accepted database and statement-derived facts,
but it emits only counts, states, digests, timings and stable reason codes. It
never prints symbols, P/L values, account identifiers, UUIDs, source filenames
or secrets. The main database hash/size and WAL state are checked before and
after real verification.

No persistent server runs during backend work. A single replacement server is
started only for the visual/runtime checkpoint, on a verified free loopback
port, and may be stopped afterward to preserve resources.

## 18. Planned implementation files

New production/support files:

```text
src/modules/journal/contracts/journal-analytics-fact-set.ts
src/modules/journal/server/analytics/journal-analytics-fact-set-repository.ts
src/modules/journal/server/analytics/journal-analytics-fact-set-service.ts
src/modules/journal-analytics/contracts/analytics-query.ts
src/modules/journal-analytics/contracts/analytics-result.ts
src/modules/journal-analytics/contracts/metric-registry.ts
src/modules/journal-analytics/server/exact-analytics-math.ts
src/modules/journal-analytics/server/normalize-journal-analytics-facts.ts
src/modules/journal-analytics/server/allocate-execution-charges.ts
src/modules/journal-analytics/server/analytics-population.ts
src/modules/journal-analytics/server/analytics-accumulator.ts
src/modules/journal-analytics/server/analytics-metric-registry.ts
src/modules/journal-analytics/server/analytics-grouping.ts
src/modules/journal-analytics/server/analytics-service.ts
src/modules/platform/server/authentication/require-development-dashboard-scope.ts
src/scripts/run-traderlink-platform-local-server.ts
src/scripts/verify-traderlink-platform-phase-4-files.ts
src/scripts/verify-traderlink-platform-journal-analytics.ts
```

Focused tests live beside the fact-set, math, normalization, fee allocation,
population, accumulator, registry, grouping, service, authentication and
private-verifier units. Existing route/page files may change only at the route
integration slice named above. `package.json` changes only when the replacement
launcher is ready to become the replacement checkout default.

No `0007` migration, `.env.local`, SQLite file, statement, evidence object,
authority file, log, generated report, V3 adapter copy or sample-data runtime is
part of the source package.

## 19. Implementation slices and gates

### Slice A - contracts and fact-set reader

- Freeze the fact-set/query/result/metric contracts.
- Implement owner/account-isolated Journal SQL and invariants.
- Prove ready/open/decision populations, allocation conservation, provenance,
  source revision and cross-owner denial synthetically.
- No real database, route or UI change.

### Slice B - exact normalization and first reconciliation metrics

- Implement exact math, charge allocation, normalized rows and population.
- Implement coverage, closed/outcome, gross/net, average/median, best/worst,
  profit factor, expectancy, daily, ticker and 30-minute entry groups.
- Prove deterministic ties, medians, ratios, zero denominators, partial fees,
  flips, shorts, partials, multi-day and currency separation.
- Run the combined Slice A/B tests with one worker and no file parallelism.

### Slice C - complete supported execution/round-trip registry

- Implement every remaining currently supportable catalog family in section 12.
- Add unavailable registry entries for missing trader/account/market facts.
- Prove group-to-total reconciliation and exact output digests.
- Run one-worker focused tests and the Phase 4 static verifier.

### Slice D - private read-only reconciliation

- Reverify branch/HEAD/working tree, database hash/size/sidecars and ports.
- Run the privacy-safe verifier against the real accepted database.
- Require 331 realized candidates, zero legitimate open and two decisions before
  metric evaluation.
- Independently reconstruct normalized Stock cash effects and headline totals
  from read-only allocations without calling the production metric accumulator,
  then compare exact results/digests to the production services.
- Verify page-service responses share one fact-set revision and reconcile.
- Require unchanged database main hash/size and no pending non-empty WAL.

### Slice E - route cutover and visual review

- Read the relevant Next.js 16.2.6 guides under `node_modules/next/dist/docs/`
  before editing Server Components, Route Handlers, request headers or runtime
  code.
- Add the development-only scope boundary and replacement launcher.
- Replace V3 reads in the named Workspace, Round Trips and Analytics routes with
  the new services while preserving the approved shell.
- Run only focused route/architecture/TypeScript checks needed for this slice.
- Start one loopback server, verify real responses, and present the pages for
  iterative owner visual approval.

### Slice F - checkpoint acceptance

- Correct every focused, real-data, runtime and visual finding.
- Update the master plan, progress, register, contracts, catalog, acceptance
  inventory, AGENTS and project log.
- Commit an explicit privacy-safe allowlist locally; do not push.
- Produce the Phase 4 handoff and exact Phase 5 scope.

## 20. Verification matrix

Focused synthetic coverage includes:

- long, short, partial, scale-in/out, repeated symbol, same-day repeats,
  multi-day, overnight and flip allocations;
- positive, negative and flat results;
- all-fee, missing-fee, credit, mixed sign, currency mismatch and split-fee
  conservation;
- exact finite math, rational division, even/odd median, nearest-rank percentile,
  deterministic tie and zero denominator;
- empty, complete, partial and unavailable responses;
- closing-date, DST, leap-day, weekday, ISO-week and time-bucket boundaries;
- one/multiple currency partitions and no cross-currency money sum;
- open/decision/excluded/superseded/unsupported containment;
- filter and grouping allowlists plus group-total reconciliation;
- query bounds, keyset pagination, full-population totals and explicit
  continuation behavior;
- source revision stability and change detection;
- stale/non-current execution version, allocation mismatch, rebuild fork and
  unauthorized account failures;
- no V3 imports, no browser finance, no sample fallback and bounded DTOs; and
- local-development auth denial outside its exact gate.

The focused scale proof measures, rather than assumes, the full normalization
and grouped-metric time for a deterministic 10,000-execution allocation graph
with one worker. The result and peak-memory observation are recorded. No cache
or summary table is added unless that evidence and the real 1,072-execution run
show a material need.

Resource policy:

- use one Vitest worker and disable file parallelism;
- code related slices before running their exact focused batch;
- use the command-local Windows `uv_os_get_passwd` fallback only if the known
  Node startup ENOMEM recurs, and remove it immediately;
- stop unnecessary processes before a resource-heavy checkpoint;
- no broad lint, full-project TypeScript, full regression, production build,
  browser/E2E or CI-equivalent run until the route/final checkpoint requires it;
  and
- do not reduce the final acceptance gate merely because broad checks are
  deferred now.

## 21. Stop and recovery rules

Stop before writes or adoption if:

- branch, HEAD, working tree, database hash/size/migrations/counts or ports drift
  unexpectedly;
- another task changes overlapping Phase 4 files;
- the fact-set reader finds an integrity or authorization mismatch;
- a metric cannot state its required facts, formula or coverage honestly;
- a route would need V3/sample fallback to render;
- real verification would expose private values; or
- a visible change leaves the approved dashboard baseline uncertain.

Phase 4 database work is read-only. If any command unexpectedly changes the
database main file or leaves a non-empty WAL, stop, capture privacy-safe evidence
and restore only under a separately verified recovery procedure.

## 22. Exit condition

Phase 4 is technically complete only when:

- the Journal fact-set contract and exact analytics registry are committed;
- all `first_slice`, `ready_after_rebuild` and currently supportable conditional
  catalog metrics have implemented or explicit unavailable registry states;
- focused one-worker tests and the static verifier pass;
- private read-only reconciliation proves 331 ready closed, zero legitimate
  open and two contained decision projections without printing private values;
- an independent read-only calculation path agrees exactly with production
  normalized rows and headline metric digests;
- Workspace, Round Trips and Analytics services share one fact-set revision and
  reconcile totals, daily, ticker and timing groups;
- the named routes contain no V3 calculation/auth/deployment dependency and no
  sample fallback;
- the replacement launcher and local development scope are fail-closed outside
  loopback development;
- real local pages render from the replacement database in the approved light
  Material shell and receive owner visual approval;
- database content/hash/size remains unchanged by analytics verification;
- controlling documents record exact commits, tests, runtime, coverage and
  deferred capability states; and
- no push, deployment, production mutation or legacy deletion occurs.

## 23. Technical planning review checklist

Before marking this plan accepted, verify:

- every formula family has required facts and unavailable behavior;
- fee allocation conserves exact source-scale units;
- gross and net populations cannot be silently mixed;
- date, timezone, currency and route scopes are unambiguous;
- all 126 migration candidates and additional catalog families have a target
  registry state;
- page adapters own no financial arithmetic;
- the development auth path cannot become production fallback;
- no schema migration or premature cache is required;
- one read snapshot and the full allocation graph prevent torn or partial fee
  calculations;
- provenance joins cannot duplicate financial rows;
- every broker-signed fee resolves to exactly one versioned source policy;
- multi-timezone results are partitioned rather than silently merged;
- time-dependent metrics have an explicit `asOfUtc` fact;
- the real-data proof is privacy-safe and read-only; and
- non-Stock monetary metrics fail unavailable until their value convention is
  explicitly supported;
- UI review remains the owner's final visible checkpoint.

## 24. Technical planning acceptance record

The coordinating technical auditor accepts this plan under the owner's
delegated checkpoint authority. No separate personal technical approval is
required before Slice A. Visible dashboard acceptance remains with the owner.

The adversarial review corrected these material risks before acceptance:

- one unresolved chain can affect only its dependent metric population;
- no result may mix gross and fee-incomplete net rows without partial coverage;
- broker-signed fees require one versioned source policy and split fees conserve
  original-scale integer units;
- full current allocation graphs and one read snapshot prevent torn or partial
  calculations;
- provenance joins are deduplicated and source groups are mutually exclusive;
- non-Stock instruments cannot inherit Stock multiplier/quote assumptions;
- money and calendar/timing results partition by currency and incompatible
  account timezones;
- time-dependent ages receive an explicit server `asOfUtc` fact;
- exact division retains numerator/denominator and rounds only for display;
- query bounds and pagination cannot masquerade as complete totals;
- all 126 catalog candidates remain in a machine-readable registry state;
- the private checkpoint uses an independent calculation path and emits no
  private values; and
- the development dashboard scope fails closed outside explicit loopback
  development.

No unresolved Phase 4 planning issue remains. Slice A may begin only inside the
file, test, privacy, database and stop boundaries above.
