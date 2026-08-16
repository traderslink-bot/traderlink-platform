# Category 10: Candle-Based Analytics

# Category Metadata

| Field | Value |
|---|---|
| Category name | Candle-Based Analytics |
| Category number | 10 |
| Category slug | metrics-candle-analytics |
| File name | 10-metrics-candle-analytics.md |
| Category type | Historical market-candle, indicator, volume, excursion, and post-execution metric vocabulary |
| Status | Complete |
| Version | 1 |
| Created date | 2026-08-10 |
| Last updated | 2026-08-10 |
| Dependencies | Category 1 Intents version 1; locked Categories 2-8; account-scoped current Journal execution/allocation facts; saved, versioned market-data delivery with interval, UTC coverage, source and adjustment evidence; later Categories 11-19 |
| Owner | AI language inventory workflow |

> **Runtime reconciliation (2026-08-15):** Saved Analyzer and Candle Review
> mappings do not approve market-data retrieval, refresh, signals, or absent calculations.

**Controller state:** The exact 18-item Version 1 inventory, all 18 canonical
records, all 18 language registries, all 396 evaluation cases, and the Section
8 coverage report passed comprehensive and clerical independent Terra review.
The controller approved and locked the canonical names and registries, accepted
the canonical, registry, evaluation, and coverage gates, synchronized the
master tracker, and marked Category 10 Complete at Version 1. All 396 cases
were reviewed and passed with zero failures. This approval does not establish
runtime support, make a provider call, approve a market-data contract, or
create an AI Chat route, UI, metric registry, or implementation.

---

# 1. Category Purpose

Category 10 gives the future TraderLink AI Companion controlled language for
historical market-candle context around an accepted execution or closed trade.
It keeps a candle high, low, close, volume, VWAP, and post-exit observation
separate from a broker execution, realized Journal result, trader plan, or
behavioural conclusion. The category prevents `MFE`, `MAE`, `giveback`,
`available move`, `relative volume`, `high of day`, `stop`, and `target` from
being treated as universal facts when their candle window, interval, session,
denominator, or trader-supplied reference is absent.

The current evidence supports a narrow source pattern: saved one-minute Moomoo
Analyzer candle facts for its eligible Day Trade analysis, and a separately
versioned Candle Review market-data delivery with explicit provider, interval,
UTC bounds, adjustment policy, extended-hours policy, and coverage result.
One minute is the preferred analytical interval. A five-minute context may be
shown only as separately identified context; it must not silently replace the
one-minute analysis. A later or coarser candle view never changes the source
interval for a saved result.

Every result must name its market-data source, interval, actual coverage, and
the applicable execution or held-window endpoint policy. OHLC values are
historical interval observations, not tick truth: a candle containing an entry
or exit cannot establish whether its high or low happened before or after that
execution. Consequently, same-candle OHLC is not used to assert an
after-entry/after-exit sequence. Exact intrabar order needs an independently
trusted tick or trade path; it is not inferred here.

This category describes historical facts and bounded deterministic derivations.
It does not predict price, recommend an entry/exit, prove liquidity, slippage,
market impact, catalyst, intent, discipline, edge, or causation. It does not
invent candles, quotes, VWAP, a relative-volume denominator, a stop, a target,
or missing provider coverage. It never exposes private account, broker,
statement, execution, or identity evidence.

---

# 2. Category Boundaries

## Included

The complete controlling inventory contains exactly the 18 Section 5.8 names
in Section 4. They cover, only with compatible accepted historical evidence:

- favourable/adverse candle-price excursion and its maximum-price endpoints;
- candle-based giveback and the percentage of candle-measured favourable move
  represented by a realized exit;
- entry context from saved VWAP, high/low-of-day, candle volume, and a future
  approved relative-volume denominator;
- bounded after-entry price change, time to candle extremes, recovery to entry,
  and explicitly named post-exit continuation horizons; and
- distance to a separately trader-recorded stop or target.

For a qualifying per-execution/allocation observation, the required base facts
are an exact accepted position-increasing allocation price and raw UTC instant,
long/short direction, its matched reducing-allocation interval under the
accepted allocation graph, a selected candle interval, and complete compatible
candles across that exact interval. Intervals from different allocations are
never mixed, and a first or quantity-weighted entry price is never substituted
silently. A single-entry `ready_closed` lifecycle may use its exact entry price
and time through its exact final-exit price and time. A first-entry-to-final-exit
envelope alone does not resolve a reference price or partial-exit weighting for
a multi-entry lifecycle; any combined multi-entry/partial-exit contract remains
Planned and unavailable until separately approved.

All market facts retain the source/adapter and schema version, interval,
requested and actual UTC coverage, coverage/failure state, timestamp semantics,
extended-hours and adjustment policy, instrument identity, corporate-action
basis compatibility, currency, and formula version. Raw instants remain UTC.
An account IANA timezone and an approved exchange/session-calendar contract are
also required where a trading date, high of day, low of day, session VWAP, or
session-relative denominator is requested. Display rounding is separate from
lossless stored facts.

### Candle endpoint and sequence policy

The following proposed policy is limited to the evidence currently documented
for the Moomoo Analyzer and requires review before canonical production:

- An **after-entry held window** begins at the exact entry/allocation boundary
  and ends at its exact matched reducing-allocation boundary (or at exact final
  exit for an eligible single-entry `ready_closed` lifecycle). An extrema candle
  is eligible only when its complete interval is wholly after the exact entry
  and wholly before the exact exit: the entry-containing and exit-containing
  candles are excluded because their internal sequence is unknown. Entry and
  exit prices remain exact boundary facts. A missing candle, provider gap,
  unknown direction, unmatched allocation, or unknown endpoint makes the
  requested excursion unavailable rather than zero.
- A **pre-exit window** for candle giveback uses the same eligible wholly-after-
  entry and wholly-before-exit candles, plus the exact entry and exit boundary
  prices. It does not use either boundary candle's high/low to claim when that
  price occurred relative to the execution.
- A candle high/low is an interval extreme, not a tradable tick or proof of
  intrabar sequence. `MFE` and `MAE` reported from such highs/lows are labelled
  candle-based approximations. Tick-level data, if separately accepted, is
  required for exact sequence or fillability claims.

For entry price `E`, the highest high `H` and lowest low `L` across the eligible
candles in that same declared compatible window and price basis, proposed
entry-zero-baseline formulas are:

| Direction | Candle MFE | Candle MAE | Maximum favourable price | Maximum adverse price |
|---|---|---|---|---|
| Long | `max(0, H - E)` | `max(0, E - L)` | `max(E, H)` | `min(E, L)` |
| Short | `max(0, E - L)` | `max(0, H - E)` | `min(E, L)` | `max(E, H)` |

The exact entry is the zero-excursion baseline. When a fully covered window has
no eligible completed candle beyond that boundary, or no eligible candle
exceeds the entry baseline in the requested direction, the measurable
completed-candle excursion is zero at entry; that does not assert that price
never moved intrabar. No value is emitted when required coverage has a gap or
the interval/basis is incompatible. Candle highs and lows do not turn the
formula into tick-accurate MFE/MAE.

`profit_giveback` is owned by Category 10 as one exact candle maximum-
favourable-excursion-to-realized-exit calculation. For long, the proposed
non-negative price giveback is `max(0, P - X)`; for short, `max(0, X - P)`,
where `P` is the best compatible favourable price from exact entry plus only
eligible candles wholly after entry and wholly before exit, and `X` is the
exact realized exit boundary price. It does not use the entry-containing or
exit-containing candle extreme. It is not Category 4's realized-path quality
measure and not a duplicate Category 9 calculation: Category 9 may reference
and interpret this factual result under its own policy, but it does not own or
recompute it. This metric is not a fee-inclusive P/L calculation. Category 2
owns realized P/L and Category 5 owns fee completeness.

`percentage_of_available_move_captured` is proposed as the realized directional
price move divided by the same entry-zero-baseline candle MFE: `(X - E) /
max(0, H - E)` for a long and `(E - X) / max(0, E - L)` for a short, multiplied
by 100, only when that denominator is strictly positive and all endpoints share
a compatible basis. The result is not silently clamped: endpoint/interval
differences can produce a negative or greater-than-100 percent result and must
remain labelled as such rather than be normalized into a performance claim.

`entry_distance_from_vwap` is proposed as the signed raw-price difference
`E - VWAP_at_entry`; its percentage form requires a positive compatible VWAP
denominator. Existing Analyzer evidence can calculate each fill's signed
distance at that fill's own timestamp and quantity-weight those fill-specific
results; an aggregate entry price is never compared with one arbitrary VWAP
snapshot. That bounded evidence does not approve a generic combined multi-
entry/partial-exit lifecycle grain for Category 10. VWAP requires saved
compatible cumulative turnover and volume under one explicit session anchor;
it is unavailable when either is missing or inconsistent.

`entry_distance_from_high_of_day` and `entry_distance_from_low_of_day` have no
safe generic day/session default. They require an approved exchange calendar,
session definition, timezone, extended-hours inclusion policy, market-data
coverage from that session start through the entry boundary, and a no-lookahead
endpoint rule. The proposed boundary uses only fully completed candles before
the entry plus the exact entry price as the observed boundary point. Until that
contract is approved, no HOD/LOD distance is presented.

`volume_at_entry` maps to the full OHLCV candle containing the exact entry
timestamp and must identify that interval; it is a candle-volume observation,
not the execution's own traded quantity or the volume before the fill. Multiple
entries in one candle may refer to the same candle volume and must not be summed
as separate market volume. `relative_volume` remains unavailable in this draft:
there is no approved denominator, lookback population, session alignment,
adjustment policy, or zero/missing-denominator rule for a general language
metric.

`price_change_after_entry` requires an explicit user-selected or trusted-
context later fully completed candle-close endpoint or horizon. For exact entry
price `E` and that exact covered candle close `C`, the proposed directional
change is `C - E` for long and `E - C` for short. There is no default endpoint,
nearest-candle substitution, or interpolation. If the selected completed close
is not exactly covered under the declared interval/basis, the result is
unavailable.

`time_to_maximum_favourable_excursion` and
`time_to_maximum_adverse_excursion` cannot identify an exact intrabar instant.
For a positive excursion, tied eligible extrema select the earliest candle by
start UTC and then stable source ID, and report an interval-aware elapsed range
from entry instant `T` to the selected candle interval `[S, F]`: `[S - T,
F - T]`, not a point timestamp. When the entry zero baseline remains the
maximum because no positive excursion exists, time-to-extreme is exact zero at
entry. Any gap in the required held window makes the timing result unavailable.

`recovery_to_entry` is evaluated only after a distinct earlier fully completed
candle establishes adverse excursion: a long requires an earlier low below
`E`, and a short requires an earlier high above `E`. Long recovery is the first
later fully completed candle with high `>= E`; short recovery is the first
later fully completed candle with low `<= E`. An adverse move and recovery in
the same candle cannot establish order and does not qualify. A true result
identifies the recovery candle interval, not an exact instant. False is allowed
only with complete compatible coverage through exit and no qualifying later
cross; any gap makes the result unavailable.

`post_exit_continuation` requires an explicit horizon. The documented Analyzer
observations are 5, 15, 30, and 60 minutes after the execution as covered
candles become available; no generic default horizon is safe. It reports a
directional candle-price change after the exit, not a recommendation or proof
that a different exit should have occurred. A missing complete horizon remains
partial/unavailable coverage.

`stop_distance` and `target_distance` require an explicitly trader-recorded
planned stop or target, its applicable timestamp/version, and a declared
reference price. A candle high/low, support/resistance level, later movement,
or inferred rule is never substituted for either trader fact.

## Excluded

The following related concepts are outside this category:

- exact broker execution price/time, allocation identity, scale/partial-exit
  construction, realised/open lifecycle state, and quantity conservation:
  Category 8 and the Journal;
- realized gross/net P/L, currency aggregation, fee treatment, outcome, and
  realized-path/edge quality: Categories 2-5;
- wall-clock rendering, elapsed duration, calendar grammar, and session
  language: Categories 7 and 13; Category 10 supplies only raw UTC
  observations and requires a separate approved calendar/session contract;
- behaviour, discipline, `gave back too much`, regret, plan adherence, or
  causal claims: Category 9; it may route to/reference Category 10's one exact
  `profit_giveback` result but must not own, duplicate, or recompute it;
- dimensions, operators, comparison/ranking grammar, conversation context,
  terminology/slang, ambiguity handling, presentation, privacy, causation,
  and safety policy: Categories 11-19;
- bid/ask, NBBO, spread, order-book/Level 2, tick sequence, execution quality,
  slippage, liquidity, market impact, news/catalysts, corporate-action repair,
  predictive signals, simulations, recommendations, and trading advice; and
- writes, provider retrieval, manual-entry amendments, stop/target edits,
  Data Decision actions, and an AI Chat runtime.

## Cross-Category References

Category 10 references but does not redefine:

- Category 1's calculation, summary, comparison, ranking, explanation,
  coverage, and unsupported-request intents;
- Categories 2-5 for realized result, fee, outcome, quality, population, and
  no-causation boundaries;
- Category 7 for exact time/duration language and Category 8 for execution and
  allocation/position endpoint construction;
- Category 9 for behaviour vocabulary; it may interpret a Category 10 result
  under its own evidence policy, but a candle result is not itself a
  behavioural diagnosis; and
- Categories 11-19 for account/instrument/currency dimensions, IANA and
  exchange-time interpretation, filters, language resolution, privacy,
  capability disclosure, clarification, no-invention, and safety.

---

# 3. Planning Analysis

This approved Version 1 planning section preserves the source plan's exact 18
names and the evidence limits carried into the canonical records, registries,
and evaluation production. The canonical vocabulary and registries are locked.

## 3.1 Required Planning Questions

1. **What exact problem does this category solve?**

   It maps a trader's historical candle-context question to a specific bounded
   observation, without confusing interval OHLC with broker facts, trader plan,
   or a recommendation.

2. **What canonical concepts belong here?**

   Exactly the 18 ordered names in Section 4, `C10-CNDL-001` through
   `C10-CNDL-018`. The source spelling `maximum_favourable_price` is preserved.

3. **What related concepts belong elsewhere?**

   Journal facts, realized P/L, outcome/quality, fees, duration, execution
   construction, behavioural interpretation, dimensions, and policy remain
   with their listed owners in Section 2.

4. **What data is required?**

   Authorized account/trade scope; current accepted price/time/direction and
   exact matched reducing-allocation endpoint (or final exit for an eligible
   single-entry lifecycle); stable instrument/currency/corporate-action basis;
   saved source/adapter/versioned candles with interval, OHLCV, UTC coverage,
   session and adjustment policy; and metric-specific VWAP, session,
   denominator, horizon, or trader-plan facts.

5. **Which deterministic tools will answer these requests?**

   A future read-only market-data evidence resolver and deterministic metric
   layer may use saved Analyzer/Candle Review deliveries plus Journal execution
   and allocation facts. This draft does not establish an AI tool, a provider
   call, or a generic cross-provider query.

6. **Which concepts are directly observed?**

   Accepted execution facts, normalized OHLCV candle facts, their source/
   interval/coverage metadata, and a trader-recorded stop/target when one
   exists are observed. The full candle's volume is observed for its interval,
   not at the exact instant of a fill.

7. **Which concepts are deterministically derived?**

   MFE/MAE, extrema, giveback, capture percent, signed VWAP distance,
   after-entry/post-exit change, interval-aware time-to-extreme range,
   recovery interval/state, and HOD/LOD distance are derived only after their
   grain, endpoint, interval, coverage, and basis contract is fixed.

8. **Which concepts are proxy indicators?**

   Candle MFE/MAE, volume, VWAP distance, relative volume, HOD/LOD distance,
   and continuation are bounded historical proxies. They do not prove fillable
   opportunity, liquidity, quality, cause, or a better decision.

9. **Which concepts are user-labelled?**

   Stop and target distances use only a trader-recorded plan fact. No other
   item becomes user-labelled merely because a trader calls a candle setup
   good, bad, planned, or missed.

10. **Which concepts are not measurable?**

   Intrabar high/low order, an exact instant for a candle extreme or recovery,
   tick-true excursion, counterfactual fills, unrecorded stops/targets, a
   general relative-volume baseline, generic HOD/LOD without an approved
   session calendar, an unspecified after-entry close endpoint, and a generic
   post-exit horizon are not measurable from the current evidence alone.

11. **Which terms are ambiguous?**

   `MFE`, `MAE`, `giveback`, `available move`, `distance`, `at entry`, `high
   of day`, `relative volume`, `recovery`, `continuation`, `stop`, and `target`
   each omit at least one of direction, analysis unit, endpoint, price basis,
   session, denominator, horizon, or trader-plan version unless context
   resolves it.

12. **What defaults are safe?**

   One-minute is the preferred interval only where a saved eligible
   one-minute delivery exists. Exact entry is the zero-excursion baseline, and
   an eligible single-entry `ready_closed` lifecycle may use exact entry through
   exact final exit. No safe default exists for session/calendar, HOD/LOD
   inclusion, relative-volume denominator, stop/target, a combined multi-entry/
   partial-exit grain, an after-entry close endpoint, or post-exit horizon. The
   documented 5/15/30/60-minute horizons may be offered as explicit choices,
   not silently chosen.

13. **What conditions require clarification?**

   Ask for the selected trade/execution/allocation or bounded population;
   required interval when multiple accepted intervals exist; explicit later
   completed-close endpoint/horizon for price change; approved session boundary
   for HOD/LOD/VWAP; horizon for post-exit continuation; and the trader-recorded
   stop/target version where those metrics are requested. A combined multi-
   entry/partial-exit request remains unavailable pending an approved reference-
   price and weighting contract rather than being resolved by silently using
   first or weighted entry. Do not ask for a fact already selected by trusted
   context.

14. **What combinations are invalid?**

   Combining incompatible instruments, currencies, corporate-action bases,
   intervals, allocation intervals, session policies, source coverage, or
   unqualified trading dates is invalid. So are extrema from entry/exit-
   containing candle highs/lows, tick-sequence claims from OHLC, a generic
   relative-volume result without its denominator, a price change after entry
   using a nearest/interpolated or missing close, a point-time claim for a
   candle extreme/recovery, false recovery across a coverage gap, a behavioural
   judgement from a candle metric, and a stop/target distance without a trader
   fact.

15. **What evaluation coverage proves completion?**

   Later Sections 5-8 must cover all 18 names in exact order with formal and
   conversational wording; entry-zero-baseline long/short formulas; strict-
   positive capture denominators; entry/exit-candle exclusions; exact matched-
   allocation and single-entry lifecycle cases; unavailable combined multi-
   entry/partial-exit cases; explicit completed-close price-change endpoints;
   interval-range time-to-extreme/tie/gap cases; recovery true/false/unavailable
   cases; UTC/IANA/session boundaries; source/interval/coverage disclosure;
   basis/corporate-action conflicts; no-denominator relative volume; explicit
   5/15/30/60-minute post-exit horizons; and missing versus trader-recorded
   stop/target cases. This draft has not produced those cases.

## 3.2 Dependencies

- **Earlier categories:** Category 1 is locked. Categories 2-8 supply but do
  not transfer their ownership of results, fees, outcomes, time, or execution
  construction. Category 9 may route to/reference Category 10's exact
  `profit_giveback` result under its behaviour policy but must not own,
  duplicate, or recompute it.
- **Journal and market facts:** current account-scoped accepted execution and
  allocation versions; direction; exact position-increasing allocation price/
  raw UTC and matched reducing-allocation interval (or exact final exit for an
  eligible single-entry lifecycle); compatible stock/instrument/currency
  identity; and immutable
  source/adapter, interval, requested/actual coverage, timestamp semantics,
  extended-hours and adjustment-policy evidence.
- **Interval and sequence:** one-minute is the preferred saved analysis
  interval. Five-minute context is not a replacement. Any exact intrabar
  sequencing dependency requires separately trusted tick/path evidence and is
  otherwise unavailable.
- **Benchmark dependencies:** VWAP needs compatible cumulative turnover and
  volume under a declared session anchor. HOD/LOD needs an approved exchange
  calendar, session boundary, timezone, extended-hours policy, and coverage.
  Relative volume needs a separately approved denominator and lookback policy;
  none is approved for this category draft.
- **Plan dependencies:** stop/target distance needs a trader-recorded planned
  price, applicable time/version, direction and reference price; it cannot use
  a retrospective candle or level substitute.
- **Unsupported dependencies:** provider retrieval on a Chat request, missing
  candles/quotes, raw provider payloads, an unapproved corporate-action basis,
  Level 2/order book, and external news/causation are outside the proposed
  metric path.

## 3.3 Risks

- **Interval/sequence risk:** using the entry/exit-containing candle high or
  low as proof of a post-fill/pre-exit event produces a false intrabar sequence.
  Mitigation: only candles wholly after exact entry and wholly before exact exit
  qualify for held-window extrema; label candle results approximate and fail
  closed for tick truth.
- **Endpoint/grain risk:** collapsing scale-ins, partial exits, or re-entries
  into one arbitrary entry/exit misstates excursion, VWAP, volume, and time.
  Mitigation: use only an exact accepted position-increasing allocation and its
  matched reducing-allocation interval, or an eligible single-entry lifecycle;
  keep combined multi-entry/partial-exit calculations unavailable until their
  price and weighting contract is approved.
- **Timing/recovery risk:** reporting a candle extreme or recovery as an exact
  instant, resolving a tie arbitrarily, or treating same-candle adverse/recovery
  as ordered invents precision. Mitigation: earliest tied eligible candle by
  start UTC then stable source ID, interval-aware elapsed ranges, distinct
  earlier/later candles for recovery, and unavailable state across gaps.
- **Source/coverage/basis risk:** market-data retention gaps, corporate actions,
  currency, adjustment policy, provider timezone, extended-hours policy, and
  instrument identity can make a visually plausible comparison false.
  Mitigation: retain and compare all metadata; return partial/unavailable rather
  than normalize or repair a mismatch by guessing.
- **Benchmark risk:** HOD/LOD, VWAP, and relative volume are sensitive to
  session/denominator policy. Mitigation: no generic day/denominator default;
  retain the selected policy and keep relative volume unavailable until its
  denominator is approved.
- **Terminology collision risk:** `profit giveback` appears in candle,
  realized-path, and behaviour language. Mitigation: require the candle
  pre-exit-extreme-to-realized-exit definition here and route other meanings to
  their owning category.
- **False quality/causation risk:** candle opportunity or continuation can be
  misread as a fillable opportunity, proof of poor discipline, or advice.
  Mitigation: factual/proxy labels, no recommendation, no counterfactual fill,
  and no causal language.
- **Privacy/account-boundary risk:** requests might pair one account's trade
  with another account's market review or expose private evidence. Mitigation:
  server-authorized account scope and opaque targets; no raw broker/account/
  execution identifiers or statement values in output or provider requests.
- **Sample/population risk:** averages can hide incomplete candle coverage or
  mix per-trade with per-execution observations. Mitigation: state observation
  grain, numerator/denominator, complete/partial/unavailable counts, and do not
  fabricate zero for no coverage.

---

# 4. Complete Controlling Inventory

> The following is the complete controlling inventory for this category. Every
> listed item must be completed. Do not silently omit, rename, merge, or replace
> items. Flag any missing concept separately without changing the controlling
> list.

All capability statuses below are approved Version 1 dispositions. `Planned`
means a future language/metric contract is required even where a bounded
Analyzer primitive exists. `Unavailable` means the named result lacks a
required approved fact or policy under this version.

| # | Inventory ID | Canonical Name | Display Name | Subcategory | Capability Status | Current Evidence Boundary |
|---:|---|---|---|---|---|---|
| 1 | C10-CNDL-001 | `mfe` | MFE | Excursion | Planned | Entry-zero-baseline long `max(0,H-E)`/short `max(0,E-L)` from only wholly-after-entry/wholly-before-exit eligible candles in the exact matched allocation or eligible single-entry held window; 1-minute preferred; not tick truth. |
| 2 | C10-CNDL-002 | `mae` | MAE | Excursion | Planned | Entry-zero-baseline long `max(0,E-L)`/short `max(0,H-E)` under the same grain/window/basis and boundary-candle exclusions; 1-minute preferred; not tick truth. |
| 3 | C10-CNDL-003 | `profit_giveback` | Profit giveback | Exit excursion | Planned | Category 10 owns the one exact eligible-candle favourable-extreme-to-realized-exit calculation; Category 9 may reference but not duplicate it. |
| 4 | C10-CNDL-004 | `maximum_favourable_price` | Maximum favourable price | Excursion endpoint | Planned | Long `max(E,H)`/short `min(E,L)` under the same compatible window/basis and boundary-candle exclusions; not tick truth. |
| 5 | C10-CNDL-005 | `maximum_adverse_price` | Maximum adverse price | Excursion endpoint | Planned | Long `min(E,L)`/short `max(E,H)` under the same compatible window/basis and boundary-candle exclusions; not tick truth. |
| 6 | C10-CNDL-006 | `percentage_of_available_move_captured` | Percentage of available move captured | Capture | Planned | Exact realized directional entry-to-exit price move divided by the same strictly positive entry-zero-baseline candle MFE; fee/P&L ownership remains outside this category. |
| 7 | C10-CNDL-007 | `entry_distance_from_vwap` | Entry distance from VWAP | Entry indicator context | Planned | Saved compatible VWAP at each entry timestamp with an explicit session anchor and turnover/volume basis; no invented VWAP. |
| 8 | C10-CNDL-008 | `entry_distance_from_high_of_day` | Entry distance from high of day | Entry session context | Planned | Requires approved exchange calendar, timezone, session/extended-hours policy, no-lookahead entry boundary, and continuous coverage. |
| 9 | C10-CNDL-009 | `entry_distance_from_low_of_day` | Entry distance from low of day | Entry session context | Planned | Requires approved exchange calendar, timezone, session/extended-hours policy, no-lookahead entry boundary, and continuous coverage. |
| 10 | C10-CNDL-010 | `volume_at_entry` | Volume at entry | Entry volume context | Planned | Full candle volume for the interval containing the exact entry; not volume before the fill or execution quantity. |
| 11 | C10-CNDL-011 | `relative_volume` | Relative volume | Volume benchmark | Unavailable | An approved denominator, lookback population, session alignment, adjustment policy, and zero/missing rule are absent. |
| 12 | C10-CNDL-012 | `price_change_after_entry` | Price change after entry | Post-entry path | Planned | Explicit user/trusted fully completed close `C` only: long `C-E`, short `E-C`; no default, nearest candle, interpolation, or result without exact endpoint coverage. |
| 13 | C10-CNDL-013 | `time_to_maximum_favourable_excursion` | Time to maximum favourable excursion | Excursion timing | Planned | Positive-extreme time is elapsed range to earliest tied eligible candle by start UTC then stable source ID; zero baseline is exact zero at entry; gaps unavailable. |
| 14 | C10-CNDL-014 | `time_to_maximum_adverse_excursion` | Time to maximum adverse excursion | Excursion timing | Planned | Positive-extreme time is elapsed range to earliest tied eligible candle by start UTC then stable source ID; zero baseline is exact zero at entry; gaps unavailable. |
| 15 | C10-CNDL-015 | `recovery_to_entry` | Recovery to entry | Post-entry path | Planned | After a distinct adverse candle, first later completed long high `>=E`/short low `<=E`; true identifies an interval, false needs complete through-exit coverage, gaps unavailable. |
| 16 | C10-CNDL-016 | `post_exit_continuation` | Post-exit continuation | Post-exit path | Planned | Only an explicit 5, 15, 30, or 60-minute covered horizon is documented; generic continuation has no safe default. |
| 17 | C10-CNDL-017 | `stop_distance` | Stop distance | Trader plan context | Unavailable | Requires a trader-recorded stop with time/version and declared reference price; no stop may be inferred from candles or levels. |
| 18 | C10-CNDL-018 | `target_distance` | Target distance | Trader plan context | Unavailable | Requires a trader-recorded target with time/version and declared reference price; no target may be inferred from candles or levels. |

## Proposed Inventory Additions

None. The exact Section 5.8 inventory is controlling for this draft. Potential
tick-true excursion, bid/ask/spread, order-book, liquidity, catalyst, and
simulation concepts remain outside it and must not be added implicitly.

## Proposed Removals or Merges

None. `mfe`, `maximum_favourable_price`, and
`time_to_maximum_favourable_excursion` are related but distinct move, endpoint,
and timing concepts; the same separation applies to their adverse counterparts.
`profit_giveback`, `percentage_of_available_move_captured`, and
`post_exit_continuation` also have different endpoints and must not merge.

---

# 5. Canonical Inventory Deliverable

Batches 1-3 contain all eighteen approved Version 1 canonical records in exact
controlling-inventory order. Section 5 is complete, and the records and
canonical names are approved and locked. This approval does not imply runtime,
provider-call, AI Chat, UI, or implementation support.

Every Batch 1 record uses the same evidence boundary. The eligible grain is
either (a) one exact accepted position-increasing allocation price/time through
its exact matched reducing-allocation price/time under the accepted allocation
graph or (b) one single-entry `ready_closed` lifecycle through its exact final
exit. A first-entry-to-final-exit envelope does not establish a reference price
or partial-exit weighting for a multi-entry lifecycle, so combined multi-entry/
partial-exit results remain unavailable until separately approved. Intervals
from different allocations are never mixed.

Entry price `E` and exit price `X` are exact boundary facts. Eligible extrema
candles must be fully covered, wholly after exact entry, and wholly before exact
exit. The entry-containing and exit-containing candles are excluded because
OHLC cannot establish intrabar order. For the declared compatible window, `H`
is the highest eligible candle high and `L` is the lowest eligible candle low.
The exact entry is the zero-excursion price baseline. With complete coverage but
no eligible candle beyond that baseline, the measurable completed-candle
excursion is zero; this does not assert that no intrabar movement occurred.

Each result retains server-authorized account scope, accepted Journal and
allocation versions, stable instrument identity, source/adapter/schema version,
recorded interval, requested and actual UTC coverage, timestamp semantics,
extended-hours and adjustment policy, compatible corporate-action price basis,
currency, and formula version. One minute is preferred only when an eligible
saved one-minute delivery exists; it is never invented or silently substituted.
A gap or incompatible source, interval, instrument, currency, adjustment, or
corporate-action basis makes the affected result partial or unavailable, never
zero. Candle extrema are interval approximations, not tick truth or evidence of
fillability. Outputs expose no raw account, broker, statement, execution,
allocation, source-row, or identity identifiers and make no claim about intent,
quality, cause, discipline, prediction, recommendation, or advice.

## `mfe`

| Field | Value |
|---|---|
| Inventory ID | C10-CNDL-001 |
| Category | Candle-Based Analytics |
| Subcategory | Favourable candle excursion |
| Canonical name | `mfe` |
| Display name | MFE |
| Exact definition | For the declared eligible grain and compatible held window, calculate the non-negative price move from exact entry `E` to the entry-zero-baseline maximum favourable price. Long: `max(0, H - E)` and maximum favourable price `max(E, H)`. Short: `max(0, E - L)` and maximum favourable price `min(E, L)`. Only eligible candles wholly after entry and wholly before exit contribute `H` or `L`; boundary-candle extremes are excluded. Complete coverage with no positive eligible excursion returns exact zero at entry with its coverage/interval disclosure. A gap returns unavailable. |
| Distinction from related concepts | This is a candle-price excursion per instrument unit, not maximum favourable price itself, realized P/L, percentage return, percentage captured, profit giveback, a tick-by-tick path, or proof that the extreme was fillable. Long and short reverse the favourable price direction but use the same declared grain/window. |
| Evidence classification | Directly observed exact accepted entry/exit boundary facts and normalized eligible candle highs/lows; deterministically derived candle-based approximation |
| Capability status | Planned |
| Result units | Non-negative exact price difference per instrument unit in one compatible instrument/currency/price-basis partition; recorded candle interval and coverage are mandatory result metadata |
| Open-trade support | Unavailable in Version 1. The record requires an exact matched reducing-allocation endpoint or exact final exit for an eligible single-entry `ready_closed` lifecycle. `legitimate_open`, `needs_decision`, unmatched, or incomplete chains remain visible coverage and are not assigned a provisional exit. |
| Fee handling | Fees are excluded from the price-excursion formula. Any combined realized-P/L request separately uses Category 2's selected gross/net basis and Category 5's fee-completeness state. |
| Version | 1 |

### Related Concepts

- Broader concept: historical favourable price excursion.
- Narrower concepts: long candle MFE; short candle MFE; MFE for one matched
  accepted allocation interval; MFE for one eligible single-entry lifecycle.
- Commonly confused concepts: `maximum_favourable_price`,
  `percentage_of_available_move_captured`, realized profit, unrealized profit,
  tick-true MFE.
- Must not be merged with: `maximum_favourable_price`, `profit_giveback`,
  `mae`, Category 2 realized P/L, or a combined multi-entry/partial-exit metric.

## `mae`

| Field | Value |
|---|---|
| Inventory ID | C10-CNDL-002 |
| Category | Candle-Based Analytics |
| Subcategory | Adverse candle excursion |
| Canonical name | `mae` |
| Display name | MAE |
| Exact definition | For the declared eligible grain and compatible held window, calculate the non-negative price move from exact entry `E` to the entry-zero-baseline maximum adverse price. Long: `max(0, E - L)` and maximum adverse price `min(E, L)`. Short: `max(0, H - E)` and maximum adverse price `max(E, H)`. Only eligible candles wholly after entry and wholly before exit contribute `H` or `L`; boundary-candle extremes are excluded. Complete coverage with no positive eligible adverse excursion returns exact zero at entry with its coverage/interval disclosure. A gap returns unavailable. |
| Distinction from related concepts | This is a candle-price excursion per instrument unit, not maximum adverse price itself, realized loss, drawdown, stop distance, risk, percentage return, tick sequence, or proof that the extreme was fillable. Long and short reverse the adverse price direction but use the same declared grain/window. |
| Evidence classification | Directly observed exact accepted entry/exit boundary facts and normalized eligible candle highs/lows; deterministically derived candle-based approximation |
| Capability status | Planned |
| Result units | Non-negative exact price difference per instrument unit in one compatible instrument/currency/price-basis partition; recorded candle interval and coverage are mandatory result metadata |
| Open-trade support | Unavailable in Version 1. The record requires an exact matched reducing-allocation endpoint or exact final exit for an eligible single-entry `ready_closed` lifecycle. `legitimate_open`, `needs_decision`, unmatched, or incomplete chains remain visible coverage and are not assigned a provisional exit. |
| Fee handling | Fees are excluded from the price-excursion formula. Any combined realized-P/L request separately uses Category 2's selected gross/net basis and Category 5's fee-completeness state. |
| Version | 1 |

### Related Concepts

- Broader concept: historical adverse price excursion.
- Narrower concepts: long candle MAE; short candle MAE; MAE for one matched
  accepted allocation interval; MAE for one eligible single-entry lifecycle.
- Commonly confused concepts: `maximum_adverse_price`, drawdown, realized loss,
  `stop_distance`, risk, tick-true MAE.
- Must not be merged with: `maximum_adverse_price`, `mfe`, `stop_distance`,
  Category 2 realized P/L, or a combined multi-entry/partial-exit metric.

## `profit_giveback`

| Field | Value |
|---|---|
| Inventory ID | C10-CNDL-003 |
| Category | Candle-Based Analytics |
| Subcategory | Exit retention from favourable candle extreme |
| Canonical name | `profit_giveback` |
| Display name | Profit giveback |
| Exact definition | Category 10 owns this one exact calculation. Let `P` be the entry-zero-baseline maximum favourable price from exact entry and only eligible candles wholly after entry and wholly before exit, and let `X` be the exact realized exit boundary price for the same declared grain. Long giveback is `max(0, P - X)`; short giveback is `max(0, X - P)`. Entry- and exit-containing candle extremes are excluded. Complete coverage with no favourable price beyond entry uses `P = E`; a gap or incompatible basis returns unavailable. |
| Distinction from related concepts | This is a non-negative candle-extreme-to-exact-exit price difference, not realized P/L, peak open P/L, fee-inclusive retained profit, percentage captured, post-exit continuation, or a judgement that too much was given back. Category 9 may route to and interpret this factual result under its own behaviour policy but must not own, duplicate, or recompute it. Category 4 does not redefine this candle calculation. |
| Evidence classification | Directly observed exact accepted entry/exit boundary facts and normalized eligible candle highs/lows; deterministically derived candle-based exit-retention approximation |
| Capability status | Planned |
| Result units | Non-negative exact price difference per instrument unit in one compatible instrument/currency/price-basis partition; recorded candle interval and coverage are mandatory result metadata |
| Open-trade support | Unavailable. An exact matched realized exit or exact final exit for an eligible single-entry `ready_closed` lifecycle is required. Open, disputed, unmatched, or incomplete activity has no realized exit endpoint and remains separate visible coverage. |
| Fee handling | Fees are excluded. This record compares prices, not fee-adjusted P/L. Realized gross/net result and fee completeness remain Category 2/5 facts and must not be substituted into this formula. |
| Version | 1 |

### Related Concepts

- Broader concept: historical exit retention relative to a favourable candle
  extreme.
- Narrower concepts: long price giveback; short price giveback; giveback for
  one matched accepted allocation interval; giveback for one eligible
  single-entry lifecycle.
- Commonly confused concepts: Category 9 behavioural `gave back too much`
  language, Category 4 path quality, peak-to-final P/L reversal,
  `percentage_of_available_move_captured`, post-exit continuation.
- Must not be merged with: a separate Category 9 calculation, Category 4
  realized-path quality, realized P/L, fee impact, or post-exit continuation.

## `maximum_favourable_price`

| Field | Value |
|---|---|
| Inventory ID | C10-CNDL-004 |
| Category | Candle-Based Analytics |
| Subcategory | Favourable candle-price endpoint |
| Canonical name | `maximum_favourable_price` |
| Display name | Maximum favourable price |
| Exact definition | For the same declared eligible grain/window/basis, return the exact entry-zero-baseline favourable price endpoint. Long: `max(E, H)`. Short: `min(E, L)`. `H` and `L` use only eligible candles wholly after exact entry and wholly before exact exit; entry- and exit-containing candle extremes are excluded. With complete coverage and no more-favourable eligible extreme, return exact entry `E`; a gap returns unavailable. |
| Distinction from related concepts | This is a price level, not the non-negative distance from entry (`mfe`), the time of the extreme, an executable quote, a tick, realized exit price, target, or recommendation. A candle supplies an interval extreme without an exact intrabar instant or fillability proof. |
| Evidence classification | Directly observed exact accepted entry boundary and normalized eligible candle highs/lows; deterministically selected entry-zero-baseline price endpoint |
| Capability status | Planned |
| Result units | Exact price per instrument unit in one compatible instrument/currency/price-basis partition; recorded candle interval and coverage are mandatory result metadata |
| Open-trade support | Unavailable in Version 1. The declared held window must end at an exact matched reducing allocation or exact final exit for an eligible single-entry `ready_closed` lifecycle; no moving "through now" endpoint is approved. |
| Fee handling | Not applicable to endpoint selection. Fees do not change a candle or exact entry price; any related P/L request separately declares its fee basis. |
| Version | 1 |

### Related Concepts

- Broader concept: historical favourable price endpoint.
- Narrower concepts: long highest eligible entry-baselined price; short lowest
  eligible entry-baselined price.
- Commonly confused concepts: `mfe`, target price, realized exit price,
  highest/lowest tick, time to MFE.
- Must not be merged with: `mfe`, `time_to_maximum_favourable_excursion`,
  `target_distance`, a quote/tick, or a combined multi-entry reference price.

## `maximum_adverse_price`

| Field | Value |
|---|---|
| Inventory ID | C10-CNDL-005 |
| Category | Candle-Based Analytics |
| Subcategory | Adverse candle-price endpoint |
| Canonical name | `maximum_adverse_price` |
| Display name | Maximum adverse price |
| Exact definition | For the same declared eligible grain/window/basis, return the exact entry-zero-baseline adverse price endpoint. Long: `min(E, L)`. Short: `max(E, H)`. `H` and `L` use only eligible candles wholly after exact entry and wholly before exact exit; entry- and exit-containing candle extremes are excluded. With complete coverage and no more-adverse eligible extreme, return exact entry `E`; a gap returns unavailable. |
| Distinction from related concepts | This is a price level, not the non-negative distance from entry (`mae`), the time of the extreme, an executable quote, a tick, realized loss, stop price, risk amount, or recommendation. A candle supplies an interval extreme without an exact intrabar instant or fillability proof. |
| Evidence classification | Directly observed exact accepted entry boundary and normalized eligible candle highs/lows; deterministically selected entry-zero-baseline price endpoint |
| Capability status | Planned |
| Result units | Exact price per instrument unit in one compatible instrument/currency/price-basis partition; recorded candle interval and coverage are mandatory result metadata |
| Open-trade support | Unavailable in Version 1. The declared held window must end at an exact matched reducing allocation or exact final exit for an eligible single-entry `ready_closed` lifecycle; no moving "through now" endpoint is approved. |
| Fee handling | Not applicable to endpoint selection. Fees do not change a candle or exact entry price; any related P/L request separately declares its fee basis. |
| Version | 1 |

### Related Concepts

- Broader concept: historical adverse price endpoint.
- Narrower concepts: long lowest eligible entry-baselined price; short highest
  eligible entry-baselined price.
- Commonly confused concepts: `mae`, stop price, realized loss, highest/lowest
  tick, time to MAE.
- Must not be merged with: `mae`, `time_to_maximum_adverse_excursion`,
  `stop_distance`, a quote/tick, or a combined multi-entry reference price.

## `percentage_of_available_move_captured`

| Field | Value |
|---|---|
| Inventory ID | C10-CNDL-006 |
| Category | Candle-Based Analytics |
| Subcategory | Directional exit capture ratio |
| Canonical name | `percentage_of_available_move_captured` |
| Display name | Percentage of available move captured |
| Exact definition | For the same declared grain/window/basis, divide the exact directional entry-to-exit price move by the same candle MFE and multiply by 100. Long: `((X - E) / max(0, H - E)) * 100`. Short: `((E - X) / max(0, E - L)) * 100`. Calculate only when the corresponding entry-zero-baseline candle-MFE denominator is strictly positive. Eligible extrema candles are wholly after entry and wholly before exit, while `E` and `X` are exact boundary prices. Preserve negative and greater-than-100 results; do not clamp, cap, floor, or reinterpret them. A zero/missing denominator, gap, incompatible basis, or unavailable exact exit returns unavailable rather than zero percent. |
| Distinction from related concepts | This is an exact directional price-move ratio to candle MFE, not realized P/L percentage, win rate, profit retained after fees, `profit_giveback`, exit efficiency, post-exit continuation, or a quality grade. A value above 100 or below 0 reflects the declared boundary/interval facts and is not silently corrected. |
| Evidence classification | Directly observed exact accepted entry/exit boundary facts and normalized eligible candle highs/lows; deterministically derived strict-positive-denominator ratio |
| Capability status | Planned |
| Result units | Dimensionless percentage with exact numerator and strictly positive denominator retained; compatible instrument/currency/price basis, candle interval, and coverage must accompany the result |
| Open-trade support | Unavailable. Exact realized exit `X` and a complete eligible held window are required. Open, disputed, unmatched, or incomplete activity remains separate visible coverage and is not assigned a capture percentage. |
| Fee handling | Fees are excluded from the directional price numerator and candle-MFE denominator. This is not return on capital or fee-adjusted profit capture; Category 2/5 own those result and fee bases. |
| Version | 1 |

### Related Concepts

- Broader concept: historical directional move-capture ratio.
- Narrower concepts: long available-move capture percentage; short available-
  move capture percentage; capture for one matched allocation interval; capture
  for one eligible single-entry lifecycle.
- Commonly confused concepts: `profit_giveback`, realized return percentage,
  MFE percentage of entry price, exit efficiency, profit retained after fees.
- Must not be merged with: `profit_giveback`, realized P/L percentage,
  post-exit continuation, a clamped 0-100 score, or a combined multi-entry/
  partial-exit metric.

Batch 2 entry-context records use one exact accepted position-increasing
allocation price/time as `E` in the default eligible `ready_closed` population.
They do not silently substitute first-entry, final-entry, or quantity-weighted
combined prices, and they do not authorize a combined multi-entry/partial-exit
grain. The source/version/interval/coverage/basis/privacy and no-causation/no-
advice contract stated above applies unchanged to all Batch 2 records.

## `entry_distance_from_vwap`

| Field | Value |
|---|---|
| Inventory ID | C10-CNDL-007 |
| Category | Candle-Based Analytics |
| Subcategory | Entry indicator context |
| Canonical name | `entry_distance_from_vwap` |
| Display name | Entry distance from VWAP |
| Exact definition | For exact accepted entry-allocation price `E` and the compatible saved Session VWAP `V` assigned under the declared entry-interval/session contract, return signed price distance `E - V`; positive means entry above VWAP and negative means entry below VWAP. When percentage distance is explicitly requested, return `((E - V) / V) * 100` only when `V` is strictly positive. `V` must be deterministically reconciled as cumulative exact turnover divided by cumulative exact volume under one declared exchange-session anchor, interval, extended-hours policy, and source revision. Direction is retained as a dimension but does not reverse the sign. No provider VWAP, invented turnover, missing volume, zero denominator, or arbitrary snapshot may be substituted. |
| Distinction from related concepts | This is a signed market-relative price difference, not direction-normalized favourability, execution slippage, distance from bid/ask, VWAP itself, average entry price, MFE/MAE, or proof of entry quality. If the saved VWAP point is a completed entry-containing interval, it is labelled interval context and does not prove the complete turnover/volume was knowable before the fill. |
| Evidence classification | Directly observed exact accepted entry-allocation price plus saved compatible candle turnover/volume/source/session facts; deterministically derived cumulative VWAP and signed distance |
| Capability status | Planned |
| Result units | Exact signed price difference per instrument unit; optional signed percentage only with strictly positive VWAP denominator; instrument, currency, price basis, source revision, interval, session and coverage are mandatory result metadata |
| Open-trade support | The arithmetic is entry-local, but Version 1 defaults to accepted entries in eligible `ready_closed` lifecycles. A generic `legitimate_open` population contract is not approved; `needs_decision`, unmatched, incomplete, or incompatible entries remain visible unavailable/partial coverage. |
| Fee handling | Fees are excluded. VWAP distance compares exact prices and market turnover/volume, not fee-adjusted cost basis, realized P/L, or transaction cost. |
| Version | 1 |

### Related Concepts

- Broader concept: historical entry benchmark context.
- Narrower concepts: signed price distance above/below Session VWAP; signed
  percentage distance with a strictly positive VWAP denominator.
- Commonly confused concepts: direction-normalized VWAP favourability, VWAP
  price, weighted average entry price, slippage, spread, entry quality.
- Must not be merged with: `volume_at_entry`, `relative_volume`, an arbitrary
  provider VWAP field, execution slippage, or a combined multi-entry distance.

## `entry_distance_from_high_of_day`

| Field | Value |
|---|---|
| Inventory ID | C10-CNDL-008 |
| Category | Candle-Based Analytics |
| Subcategory | Entry exchange-session range context |
| Canonical name | `entry_distance_from_high_of_day` |
| Display name | Entry distance from high of day |
| Exact definition | Under an approved exchange calendar, exchange-session definition, exchange timezone, account IANA display timezone, extended-hours policy, interval, and continuous compatible coverage from declared session start to entry, let `D_H = max(E, H_pre)`, where `H_pre` is the highest high of only fully completed candles wholly before exact entry. Return non-negative price distance `D_H - E`; an explicit percentage form may divide by strictly positive `D_H`. The entry-containing candle is excluded for no-lookahead sequence safety, while exact entry `E` is the boundary baseline. If no eligible prior candle exists under otherwise complete coverage, `D_H = E` and distance is zero with that limitation stated. |
| Distinction from related concepts | This is distance to the approved exchange-session high observed before entry, not the full calendar-day high, later high of day, maximum favourable price during the held window, daily high from an unrelated provider, local trading-date bucket, resistance level, target, or quality judgement. Direction does not reverse the high-distance formula. |
| Evidence classification | Directly observed exact accepted entry price plus eligible normalized pre-entry candle highs and approved calendar/session/timezone facts; deterministically derived no-lookahead session-high distance |
| Capability status | Planned |
| Result units | Non-negative exact price difference per instrument unit; optional percentage only with a strictly positive declared high denominator; source/interval/session/coverage/instrument/currency/corporate-action basis metadata is mandatory |
| Open-trade support | The arithmetic is entry-local, but Version 1 defaults to accepted entries in eligible `ready_closed` lifecycles. No generic open-state population is approved. Missing exchange calendar/session/timezone, source-start coverage, or compatible entry fact returns unavailable rather than a local-bucket fallback. |
| Fee handling | Not applicable. Fees do not change the exact entry or historical market-candle high; this metric is not fee-adjusted cost basis or P/L. |
| Version | 1 |

### Related Concepts

- Broader concept: historical exchange-session entry-range context.
- Narrower concepts: raw-price distance below the no-lookahead session high;
  percentage distance using a strictly positive session-high denominator.
- Commonly confused concepts: full-day high, later high of day,
  `maximum_favourable_price`, resistance, target, local trading-date high.
- Must not be merged with: `maximum_favourable_price`, `target_distance`, a
  local calendar bucket, or an unversioned daily quote high.

## `entry_distance_from_low_of_day`

| Field | Value |
|---|---|
| Inventory ID | C10-CNDL-009 |
| Category | Candle-Based Analytics |
| Subcategory | Entry exchange-session range context |
| Canonical name | `entry_distance_from_low_of_day` |
| Display name | Entry distance from low of day |
| Exact definition | Under an approved exchange calendar, exchange-session definition, exchange timezone, account IANA display timezone, extended-hours policy, interval, and continuous compatible coverage from declared session start to entry, let `D_L = min(E, L_pre)`, where `L_pre` is the lowest low of only fully completed candles wholly before exact entry. Return non-negative price distance `E - D_L`; an explicit percentage form may divide by strictly positive `D_L`. The entry-containing candle is excluded for no-lookahead sequence safety, while exact entry `E` is the boundary baseline. If no eligible prior candle exists under otherwise complete coverage, `D_L = E` and distance is zero with that limitation stated. |
| Distinction from related concepts | This is distance to the approved exchange-session low observed before entry, not the full calendar-day low, later low of day, maximum adverse price during the held window, daily low from an unrelated provider, local trading-date bucket, support level, stop, or quality judgement. Direction does not reverse the low-distance formula. |
| Evidence classification | Directly observed exact accepted entry price plus eligible normalized pre-entry candle lows and approved calendar/session/timezone facts; deterministically derived no-lookahead session-low distance |
| Capability status | Planned |
| Result units | Non-negative exact price difference per instrument unit; optional percentage only with a strictly positive declared low denominator; source/interval/session/coverage/instrument/currency/corporate-action basis metadata is mandatory |
| Open-trade support | The arithmetic is entry-local, but Version 1 defaults to accepted entries in eligible `ready_closed` lifecycles. No generic open-state population is approved. Missing exchange calendar/session/timezone, source-start coverage, or compatible entry fact returns unavailable rather than a local-bucket fallback. |
| Fee handling | Not applicable. Fees do not change the exact entry or historical market-candle low; this metric is not fee-adjusted cost basis or P/L. |
| Version | 1 |

### Related Concepts

- Broader concept: historical exchange-session entry-range context.
- Narrower concepts: raw-price distance above the no-lookahead session low;
  percentage distance using a strictly positive session-low denominator.
- Commonly confused concepts: full-day low, later low of day,
  `maximum_adverse_price`, support, stop, local trading-date low.
- Must not be merged with: `maximum_adverse_price`, `stop_distance`, a local
  calendar bucket, or an unversioned daily quote low.

## `volume_at_entry`

| Field | Value |
|---|---|
| Inventory ID | C10-CNDL-010 |
| Category | Candle-Based Analytics |
| Subcategory | Entry-interval market volume context |
| Canonical name | `volume_at_entry` |
| Display name | Volume at entry |
| Exact definition | Resolve the one saved normalized candle whose declared half-open/closed timestamp semantics contain the exact accepted entry-allocation UTC instant, and return that candle's exact non-negative full-interval volume with its interval and source revision. This is the complete containing-candle volume, not volume known before the fill. Multiple entries mapped to the same candle reference the same market-volume observation; grouping must deduplicate that candle identity before any market-volume sum rather than counting it once per entry. Missing, overlapping, ambiguous, negative, or basis-incompatible candle evidence returns unavailable. |
| Distinction from related concepts | This is market volume for the full entry-containing candle interval, not the accepted execution quantity, entry allocated quantity, cumulative session volume, turnover/dollar volume, volume before entry, relative volume, liquidity, or fillability. The candle cannot establish how much of its volume occurred before versus after the entry. |
| Evidence classification | Directly observed normalized entry-containing candle volume plus exact accepted entry UTC and recorded candle timestamp/interval semantics |
| Capability status | Planned |
| Result units | Exact non-negative provider-normalized market-volume units for one identified instrument and candle interval; never relabelled as shares/contracts without accepted instrument/unit semantics; source/coverage/basis metadata is mandatory |
| Open-trade support | The observation is entry-local, but Version 1 defaults to accepted entries in eligible `ready_closed` lifecycles. A generic open-state analytic population is not approved; disputed or unmatched entries remain visible coverage. |
| Fee handling | Not applicable. Fees do not change market candle volume; this is not transaction cost, P/L, or execution quantity. |
| Version | 1 |

### Related Concepts

- Broader concept: historical entry-interval market activity.
- Narrower concepts: one-minute entry-candle volume when the recorded interval
  is one minute; other explicitly recorded containing-interval volume.
- Commonly confused concepts: execution quantity, allocated entry quantity,
  cumulative session volume, turnover, dollar volume, `relative_volume`.
- Must not be merged with: execution/position size, cumulative volume,
  turnover, liquidity, or `relative_volume`.

## `relative_volume`

| Field | Value |
|---|---|
| Inventory ID | C10-CNDL-011 |
| Category | Candle-Based Analytics |
| Subcategory | Entry volume comparison benchmark |
| Canonical name | `relative_volume` |
| Display name | Relative volume |
| Exact definition | Reserved for the exact ratio of a declared observed volume numerator to a separately approved strictly positive expected-volume denominator for the same instrument, aligned exchange session, interval position, extended-hours policy, corporate-action basis, and comparison population. Version 1 has no approved comparison population, lookback window, averaging/median rule, denominator, session alignment, missing-day policy, adjustment policy, or zero-denominator rule. Therefore no numeric result or default formula is currently available, and existing provider/analyzer fields are not silently adopted as this canonical truth. |
| Distinction from related concepts | This is not raw `volume_at_entry`, cumulative session volume, percentage of average daily volume, provider-specific RVOL, turnover, dollar volume, float rotation, liquidity, or a high/low volume label. The canonical name alone does not identify a denominator. |
| Evidence classification | Not currently measurable as a canonical metric; a future version would combine directly observed compatible volume facts with a deterministically approved comparison denominator |
| Capability status | Unavailable |
| Result units | Unavailable. A future approved result would be a non-negative dimensionless ratio with its exact numerator, strictly positive denominator, comparison population, interval/session alignment, source/version and coverage disclosed. |
| Open-trade support | Unavailable for closed and open activity because the canonical comparison population and denominator are not approved. No provider-specific relative-volume value is substituted. |
| Fee handling | Not applicable. Fees do not define the volume numerator or comparison denominator. |
| Version | 1 |

### Related Concepts

- Broader concept: historical market-volume comparison.
- Narrower concepts: none approved; time-of-session RVOL, daily RVOL, and
  provider-specific RVOL remain separate proposals unless their denominators
  are reviewed.
- Commonly confused concepts: `volume_at_entry`, average daily volume,
  cumulative volume, turnover, float rotation, provider RVOL, liquidity.
- Must not be merged with: `volume_at_entry`, a provider-specific field, an
  unversioned lookback average, turnover, or liquidity scoring.

## `price_change_after_entry`

| Field | Value |
|---|---|
| Inventory ID | C10-CNDL-012 |
| Category | Candle-Based Analytics |
| Subcategory | Explicit-horizon post-entry price path |
| Canonical name | `price_change_after_entry` |
| Display name | Price change after entry |
| Exact definition | For exact accepted entry-allocation price `E` and an explicit user-selected or trusted-context later fully completed compatible candle close `C`, return directional price change `C - E` for long and `E - C` for short. The request/context must identify the exact later candle-close endpoint or an approved horizon rule that resolves to that exact close under the recorded interval. There is no default horizon, nearest-candle substitution, interpolation, partial candle, or containing-entry-candle endpoint. The exact endpoint candle and continuous compatible coverage from entry through that close are required; otherwise return unavailable. |
| Distinction from related concepts | This is directional change to one explicitly selected later completed close, not MFE/MAE, current/unrealized P/L, realized exit result, post-exit continuation, prediction, candle-high/low sequence, or a claim that the close was tradable at the entry. A horizon after exit belongs to `post_exit_continuation` when that is what the user asks. |
| Evidence classification | Directly observed exact accepted entry price and exact normalized later completed candle close; deterministically derived direction-aware price difference |
| Capability status | Planned |
| Result units | Exact signed directional price difference per instrument unit in one compatible instrument/currency/corporate-action price basis; optional percentage form requires a separately declared strictly positive denominator; endpoint, horizon, source, interval and coverage are mandatory metadata |
| Open-trade support | The formula can describe a completed historical endpoint, but Version 1 defaults to accepted entries in eligible `ready_closed` lifecycles. A generic open-state population contract is not approved, and no live/partial candle or moving "now" endpoint is allowed. |
| Fee handling | Fees are excluded. This is a market-price change, not realized/unrealized P/L, return after fees, or transaction cost. |
| Version | 1 |

### Related Concepts

- Broader concept: historical bounded post-entry price path.
- Narrower concepts: long change to an explicit completed close; short change
  to an explicit completed close; approved explicit-horizon change.
- Commonly confused concepts: `mfe`, `mae`, realized P/L, current return,
  `post_exit_continuation`, prediction.
- Must not be merged with: `post_exit_continuation`, a default/nearest candle,
  interpolated price, partial candle, MFE/MAE, or realized P/L.

Batch 3 timing and recovery records reuse Batch 1's exact accepted allocation
interval or eligible single-entry `ready_closed` grain. Post-exit continuation
uses one exact accepted reducing-allocation/final-exit boundary and an explicit
covered horizon. Stop/target records require a separately accepted trader-plan
fact and do not infer one from market data, broker orders, rules, or later price
movement. The source/version/interval/coverage/basis/privacy and no-causation/
no-advice contract stated above applies unchanged.

## `time_to_maximum_favourable_excursion`

| Field | Value |
|---|---|
| Inventory ID | C10-CNDL-013 |
| Category | Candle-Based Analytics |
| Subcategory | Favourable candle-excursion timing |
| Canonical name | `time_to_maximum_favourable_excursion` |
| Display name | Time to maximum favourable excursion |
| Exact definition | Let `T` be the exact accepted entry-allocation UTC instant and use the same eligible candles and entry-zero-baseline MFE contract as `mfe`. When MFE is strictly positive, select among candles reaching the maximum favourable extreme the earliest candle by start UTC, then stable source ID. For selected candle interval `[S, F]` under the recorded timestamp/interval semantics, return elapsed range `[S - T, F - T]`; never return a fabricated point time inside the candle. When entry remains the favourable maximum and MFE is exact zero, return exact elapsed time zero at entry with the zero-baseline limitation. Any missing candle/gap, incompatible basis, absent exact interval end, or unresolved tie identity returns unavailable. |
| Distinction from related concepts | This is an interval-aware elapsed range to a candle extreme, not an exact extreme instant, candle start time alone, holding duration, time to exit, time to profit, `mfe`, or `maximum_favourable_price`. The candle cannot reveal when its high/low occurred internally. |
| Evidence classification | Directly observed exact accepted entry UTC and eligible normalized candle interval/extreme/source identity; deterministically derived earliest-tie selection and elapsed-time range |
| Capability status | Planned |
| Result units | Exact non-negative elapsed-time range, preferably retained in integer milliseconds/seconds plus raw UTC candle bounds and recorded interval; zero is exact only for the entry baseline |
| Open-trade support | Unavailable in Version 1. The eligible held window requires an exact matched reducing allocation or exact final exit for a single-entry `ready_closed` lifecycle. Open, disputed, unmatched, or incomplete chains have no approved terminal window. |
| Fee handling | Not applicable. Fees do not change candle-extreme timing; any P/L interpretation remains separately fee-scoped. |
| Version | 1 |

### Related Concepts

- Broader concept: historical candle-excursion timing.
- Narrower concepts: long time-range to highest eligible high; short time-range
  to lowest eligible low; exact zero at entry when no positive MFE exists.
- Commonly confused concepts: exact time of high/low, candle start timestamp,
  holding duration, `mfe`, `maximum_favourable_price`.
- Must not be merged with: `mfe`, `maximum_favourable_price`, Category 7
  holding duration, or a point-time/tick-sequence claim.

## `time_to_maximum_adverse_excursion`

| Field | Value |
|---|---|
| Inventory ID | C10-CNDL-014 |
| Category | Candle-Based Analytics |
| Subcategory | Adverse candle-excursion timing |
| Canonical name | `time_to_maximum_adverse_excursion` |
| Display name | Time to maximum adverse excursion |
| Exact definition | Let `T` be the exact accepted entry-allocation UTC instant and use the same eligible candles and entry-zero-baseline MAE contract as `mae`. When MAE is strictly positive, select among candles reaching the maximum adverse extreme the earliest candle by start UTC, then stable source ID. For selected candle interval `[S, F]` under the recorded timestamp/interval semantics, return elapsed range `[S - T, F - T]`; never return a fabricated point time inside the candle. When entry remains the adverse maximum and MAE is exact zero, return exact elapsed time zero at entry with the zero-baseline limitation. Any missing candle/gap, incompatible basis, absent exact interval end, or unresolved tie identity returns unavailable. |
| Distinction from related concepts | This is an interval-aware elapsed range to a candle extreme, not an exact extreme instant, candle start time alone, holding duration, time to stop, time to loss, `mae`, or `maximum_adverse_price`. The candle cannot reveal when its high/low occurred internally. |
| Evidence classification | Directly observed exact accepted entry UTC and eligible normalized candle interval/extreme/source identity; deterministically derived earliest-tie selection and elapsed-time range |
| Capability status | Planned |
| Result units | Exact non-negative elapsed-time range, preferably retained in integer milliseconds/seconds plus raw UTC candle bounds and recorded interval; zero is exact only for the entry baseline |
| Open-trade support | Unavailable in Version 1. The eligible held window requires an exact matched reducing allocation or exact final exit for a single-entry `ready_closed` lifecycle. Open, disputed, unmatched, or incomplete chains have no approved terminal window. |
| Fee handling | Not applicable. Fees do not change candle-extreme timing; any P/L interpretation remains separately fee-scoped. |
| Version | 1 |

### Related Concepts

- Broader concept: historical candle-excursion timing.
- Narrower concepts: long time-range to lowest eligible low; short time-range
  to highest eligible high; exact zero at entry when no positive MAE exists.
- Commonly confused concepts: exact time of high/low, candle start timestamp,
  holding duration, `mae`, `maximum_adverse_price`.
- Must not be merged with: `mae`, `maximum_adverse_price`, Category 7 holding
  duration, or a point-time/tick-sequence claim.

## `recovery_to_entry`

| Field | Value |
|---|---|
| Inventory ID | C10-CNDL-015 |
| Category | Candle-Based Analytics |
| Subcategory | Post-adverse candle recovery |
| Canonical name | `recovery_to_entry` |
| Display name | Recovery to entry |
| Exact definition | Evaluate only after a distinct earlier eligible fully completed candle establishes positive adverse excursion from exact entry `E`: long requires an earlier candle low `< E`; short requires an earlier candle high `> E`. Long recovery is the first later eligible fully completed candle with high `>= E`; short recovery is the first later eligible fully completed candle with low `<= E`. Order qualifying recovery candles by start UTC then stable source ID. A true result identifies the entire recovery candle interval, not an exact crossing instant. An adverse extreme and entry cross within the same candle cannot establish order and does not qualify. Return false only when coverage is complete and compatible from the distinct adverse candle through exact exit and no later qualifying cross exists. A gap or incomplete exit coverage returns unavailable; no earlier adverse candle returns not applicable rather than false. |
| Distinction from related concepts | This is a direction-aware completed-candle recovery state after an established adverse candle, not green-to-red P/L, exact breakeven-cross time, realized recovery, final outcome, recovery after exit, or proof the entry price was fillable again. Same-candle high/low cannot prove adverse-then-recovery sequence. |
| Evidence classification | Directly observed exact accepted entry, eligible normalized candle highs/lows/intervals/source identities and exact exit boundary; deterministically derived prerequisite, first-later recovery interval, false, not-applicable, or unavailable state |
| Capability status | Planned |
| Result units | State `true`, `false`, `not_applicable`, or `unavailable`; true includes the exact selected candle UTC interval and recorded source interval, never a point time |
| Open-trade support | Unavailable in Version 1. A false result requires complete coverage through an exact matched reducing allocation or exact final exit for an eligible single-entry `ready_closed` lifecycle. No provisional false is emitted for an open lifecycle. |
| Fee handling | Not applicable. Recovery compares market prices with entry and is not a fee-adjusted breakeven or P/L calculation. |
| Version | 1 |

### Related Concepts

- Broader concept: historical post-adverse price recovery.
- Narrower concepts: long completed-candle recovery interval; short completed-
  candle recovery interval; complete-window no-recovery state.
- Commonly confused concepts: green-to-red recovery, exact breakeven-cross
  instant, final profitable outcome, `price_change_after_entry`, realized P/L.
- Must not be merged with: green-to-red P/L, same-candle adverse/recovery,
  point-time crossing, post-exit continuation, or final trade outcome.

## `post_exit_continuation`

| Field | Value |
|---|---|
| Inventory ID | C10-CNDL-016 |
| Category | Candle-Based Analytics |
| Subcategory | Explicit-horizon post-exit price path |
| Canonical name | `post_exit_continuation` |
| Display name | Post-exit continuation |
| Exact definition | For exact accepted reducing/final-exit price `X`, exact exit UTC, direction, and an explicit user-selected or trusted supported horizon, resolve the exact fully completed compatible candle close `C_h` at that horizon under the recorded interval/source contract. Return directional change `C_h - X` for long and `X - C_h` for short; positive continues in the former trade direction and negative reverses. The documented horizons are 5, 15, 30, and 60 minutes, but none is a default. Exclude the exit-containing candle, require complete compatible post-exit candle coverage through the exact horizon, and do not use a partial/nearest candle or interpolation. Missing exact horizon coverage returns unavailable. |
| Distinction from related concepts | This is one explicit-horizon directional close-to-exit price change, not `profit_giveback`, price change after entry, MFE after exit, predicted continuation, counterfactual profit, exit quality, regret, or advice that the trader should have held. It does not assert intrabar sequence or fillability. |
| Evidence classification | Directly observed exact accepted exit boundary and normalized fully completed post-exit candle close/source/interval facts; deterministically derived direction-aware explicit-horizon change |
| Capability status | Planned |
| Result units | Exact signed directional price difference per instrument unit in one compatible instrument/currency/corporate-action price basis; horizon, exact UTC endpoint, source, interval and coverage are mandatory metadata |
| Open-trade support | Requires an exact accepted reducing/final-exit boundary inside an eligible `ready_closed` lifecycle. An open lifecycle without any exact reducing exit has no post-exit observation; no hypothetical exit is invented. |
| Fee handling | Fees are excluded. This is a post-exit market-price change, not realized P/L, fee-adjusted missed profit, or a counterfactual executable result. |
| Version | 1 |

### Related Concepts

- Broader concept: historical post-exit market path.
- Narrower concepts: explicit 5-, 15-, 30-, and 60-minute directional
  continuation observations when exactly covered.
- Commonly confused concepts: `price_change_after_entry`, `profit_giveback`,
  missed profit, exit quality, prediction, counterfactual P/L.
- Must not be merged with: `profit_giveback`, a default/nearest horizon,
  partial candle, interpolated price, recommendation, or simulated exit result.

## `stop_distance`

| Field | Value |
|---|---|
| Inventory ID | C10-CNDL-017 |
| Category | Candle-Based Analytics |
| Subcategory | Trader-recorded plan-level distance |
| Canonical name | `stop_distance` |
| Display name | Stop distance |
| Exact definition | Reserved for an exact signed direction-aware distance between a declared exact reference price `R` and an explicitly trader-recorded stop level `S` whose accepted plan version is effective for the selected lifecycle/reference event. Long: `R - S`. Short: `S - R`. Preserve zero and negative results without clamping; an explicit percentage form would divide by strictly positive `R`. Version 1 has no approved general structured trader-stop fact/effective-version contract, so the metric is unavailable. A candle high/low, support/resistance level, rule threshold, broker order, later price movement, or inferred intent is never substituted for `S`. |
| Distinction from related concepts | This is not MAE, maximum adverse price, realized risk/loss, distance to support, stop-order fill, rule adherence, inferred planned risk, or advice about where a stop should be. A broker order or chart level does not by itself prove the trader's effective plan. |
| Evidence classification | User-labelled only when an exact accepted trader-recorded stop level/version/effective lifecycle and exact compatible reference price exist; otherwise not measurable and unavailable |
| Capability status | Unavailable |
| Result units | Unavailable. A future approved result would be an exact signed price difference per instrument unit, with optional percentage only from strictly positive `R`, in one compatible instrument/currency/corporate-action basis and plan version. |
| Open-trade support | Unavailable for open and closed lifecycles until the structured trader-plan fact, effective-version, lifecycle binding, amendment precedence, and privacy-safe read contract are approved. |
| Fee handling | Not applicable. Fees do not define the trader-recorded stop level or reference-price distance. |
| Version | 1 |

### Related Concepts

- Broader concept: trader-recorded lifecycle plan context.
- Narrower concepts: future long signed stop distance; future short signed stop
  distance; future percentage distance with positive reference denominator.
- Commonly confused concepts: `mae`, `maximum_adverse_price`, support level,
  broker stop order, rule threshold, planned risk, realized loss.
- Must not be merged with: inferred stop, chart support, broker order intent,
  `mae`, `maximum_adverse_price`, rule adherence, or stop advice.

## `target_distance`

| Field | Value |
|---|---|
| Inventory ID | C10-CNDL-018 |
| Category | Candle-Based Analytics |
| Subcategory | Trader-recorded plan-level distance |
| Canonical name | `target_distance` |
| Display name | Target distance |
| Exact definition | Reserved for an exact signed direction-aware distance between a declared exact reference price `R` and an explicitly trader-recorded target level `Q` whose accepted plan version is effective for the selected lifecycle/reference event. Long: `Q - R`. Short: `R - Q`. Preserve zero and negative results without clamping; an explicit percentage form would divide by strictly positive `R`. Version 1 has no approved general structured trader-target fact/effective-version contract, so the metric is unavailable. A candle high/low, support/resistance level, rule threshold, broker order, later price movement, or inferred intent is never substituted for `Q`. |
| Distinction from related concepts | This is not MFE, maximum favourable price, realized profit, distance to resistance, target-order fill, rule adherence, inferred reward, or advice about where a target should be. A broker order or chart level does not by itself prove the trader's effective plan. |
| Evidence classification | User-labelled only when an exact accepted trader-recorded target level/version/effective lifecycle and exact compatible reference price exist; otherwise not measurable and unavailable |
| Capability status | Unavailable |
| Result units | Unavailable. A future approved result would be an exact signed price difference per instrument unit, with optional percentage only from strictly positive `R`, in one compatible instrument/currency/corporate-action basis and plan version. |
| Open-trade support | Unavailable for open and closed lifecycles until the structured trader-plan fact, effective-version, lifecycle binding, amendment precedence, and privacy-safe read contract are approved. |
| Fee handling | Not applicable. Fees do not define the trader-recorded target level or reference-price distance. |
| Version | 1 |

### Related Concepts

- Broader concept: trader-recorded lifecycle plan context.
- Narrower concepts: future long signed target distance; future short signed
  target distance; future percentage distance with positive reference
  denominator.
- Commonly confused concepts: `mfe`, `maximum_favourable_price`, resistance
  level, broker target order, rule threshold, planned reward, realized profit.
- Must not be merged with: inferred target, chart resistance, broker order
  intent, `mfe`, `maximum_favourable_price`, rule adherence, or target advice.

# 6. Language Registry Deliverable

Registry Batches 1-4 contain all eighteen approved and locked Version 1
registries in exact canonical order. Targets retain the Section 4 split:
fifteen are `Planned`; `relative_volume`, `stop_distance`, and
`target_distance` are `Unavailable`. Registry wording does not create runtime
support, a provider call, or an AI Chat route.

## `mfe` Language Registry

### Exact Definition

For exact entry `E` and eligible candles wholly after entry and wholly before
exit in one compatible declared allocation/single-entry window, long MFE is
`max(0, H - E)` and short MFE is `max(0, E - L)`. Entry is the zero baseline.
The result is a candle approximation, not tick truth or intrabar sequence.

### Formal Wording

- "maximum favourable candle excursion from entry"
- "entry-zero-baseline MFE for the declared held window"

### Normal Conversational Wording

- "How far did this trade move in my favour while I held it?"
- "What was my MFE on the selected entry?"

### Trader Slang

- "How much did it go for me before I got out?"
- "Best move off my entry" maps only with trusted candle-metric context.

### Abbreviations

- `MFE`, `mfe`, and `max fav excursion` map with metric/trade context.
- Bare `MFE` may be a ticker token; validated ticker syntax/context wins, and
  ambiguous acronym-only input requires clarification.

### Common Misspellings

- `maximum favorible excursion`
- `maxium favourable excurison`

### Noisy or Incomplete Input

- `mfe this trade pls`
- `how far fav after entry` requires selected grain and covered candle context.

### Singular and Plural Forms

- Singular: "the MFE for this allocation interval".
- Plural: "MFEs by ticker" means individual eligible observations before any
  declared aggregation.

### Full Questions

- "What was the candle-based MFE for the selected eligible entry?"
- "What was average MFE for eligible long trades with the same interval?"

### Commands

- "Calculate MFE for the selected allocation interval."
- "Show candle MFE by validated ticker with coverage."

### Sentence Fragments

- `selected trade MFE`
- `1-minute MFE, long entries`

### Follow-Up Wording

- "And for shorts?" preserves scope/interval but applies the short formula.
- "What about five-minute candles?" changes interval only if compatible saved
  five-minute evidence is explicitly selected; it never rebuckets silently.

### Correction Wording

- "I meant favourable excursion, not maximum favourable price."
- "Use the matched allocation interval, not the whole multi-entry lifecycle."

### Comparison Wording

- "Compare MFE for eligible long and short observations using the same saved
  interval and coverage policy."
- Comparisons never mix corporate-action bases, currencies, or allocation
  grains.

### Ranking Wording

- "Rank validated tickers by median candle MFE per unit."
- Ranking requires the later approved ranking/tie contract and compatible
  observation populations.

### Negated Wording

- "Show MFE, not realized profit."
- "Do not use the entry or exit candle high/low."

### Exclusion Wording

- "Exclude observations with candle gaps from MFE values."
- "Exclude multi-entry lifecycles without an approved allocation slice" keeps
  their unavailable coverage visible.

### Multi-Filter Wording

- "Calculate one-minute MFE for eligible ready-closed long AAPL allocation
  intervals in the selected account-local period."

### Multi-Part Question Wording

- "Show MFE and MAE for the selected entry" returns two separately labelled
  metrics from the same declared window/basis.

### Ambiguous Wording

- "Best move" may mean MFE, maximum favourable price, realized profit, or
  post-exit continuation.
- Bare `MFE` may be a metric acronym or validated ticker and has no silent
  metric default.

### Negative Examples

These examples must not map to this concept.

- "Show trades in ticker MFE" is a ticker request when `MFE` validates as the
  selected instrument.
- "What was my highest price?" targets `maximum_favourable_price` only with
  direction/context; it does not ask for a distance.
- "How much profit did I make?" is Category 2 realized P/L.

### Context Requirements

Require authorized account scope plus a selected exact matched allocation
interval or eligible single-entry `ready_closed` lifecycle, direction, entry/
exit boundary, and saved candle source/interval/coverage/basis context.

### Required Data

- Exact accepted entry price/time, matched reducing/final-exit time, direction,
  accepted allocation/round-trip versions, and eligible candle highs/lows.
- Source/adapter/schema version, interval, UTC coverage, adjustment/extended-
  hours policy, instrument/currency/corporate-action basis, and gap state.

### Optional Data

- Validated ticker, provenance, account-local date range, and compatible
  grouping/comparison context.
- Explicit display percentage is separate from canonical per-unit MFE.

### Valid Filters

- Authorized account, eligible `ready_closed` state, validated instrument,
  direction, provenance, compatible source/interval, and account-local dates.
- Filters apply after metric eligibility and cannot repair missing candles.

### Valid Groupings

- Validated instrument, direction, provenance, date/time, and compatible saved
  interval/source groups after per-allocation observation construction.
- Never group mixed currencies, corporate-action bases, or grains as one value.

### Valid Operators

- Exact value, average/median/quantile with declared population, threshold,
  comparison, grouping, and ranking after Categories 12/14 approve grammar.

### Compatible Intents

- `calculate_metric`, `summarize_performance`, `compare_groups`,
  `group_and_aggregate`, `rank_results`, `analyze_trade`, `analyze_trend`,
  `explain_result`, `explain_concept`, and `inspect_data_quality`.

### Incompatible Combinations

- Mixed allocation intervals, arbitrary first/weighted multi-entry price,
  entry/exit-containing candle extrema, gaps, incompatible intervals/bases,
  ticker-acronym coercion, tick/fillability claims, prediction, cause, or advice.

### Default Interpretation

Within trusted metric context, `mfe` means the non-negative per-unit candle
excursion using the exact Section 5 long/short formulas and declared interval.
One minute is preferred only when eligible saved one-minute evidence exists.

### Clarification Conditions

Clarify when `MFE` could be a ticker, the trade/allocation grain is absent, or
the user has not distinguished excursion distance from favourable price. Do
not silently choose a multi-entry reference or candle interval.

### Recommended Clarification Wording

- "Do you mean the MFE metric or ticker MFE?"
- "Which selected entry/allocation interval should I use?"
- "Do you want favourable move distance or the maximum favourable price?"

### Unsupported Conditions

- No exact eligible grain/direction/boundaries, candle gap, incompatible
  source/interval/instrument/currency/corporate-action basis, or only boundary-
  candle evidence.
- Tick-exact timing, fillability, causal quality, prediction, or advice requests.

### Target Analytics Tool or Query Capability

- Planned Category 10 read-only candle-metric resolver over accepted Journal
  allocation facts and saved versioned market-data evidence with exact decimal
  math and explicit coverage. No named Chat/runtime capability exists.

### Result Units

- Non-negative exact price difference per instrument unit plus source,
  interval, formula version, population, and coverage. Exact zero is the entry
  baseline only under complete compatible coverage.

### Fee Handling

- Fees are excluded. Combined realized P/L retains Category 2/5 result and fee
  basis separately.

### Open-Trade Handling

- Unavailable in Version 1; no moving-now or invented exit endpoint.
  `legitimate_open`, `needs_decision`, and incomplete chains remain visible
  coverage outside the value.

### Sample-Size Considerations

- A single MFE is descriptive. Aggregates disclose eligible observation count,
  trade versus allocation grain, gaps/exclusions, and never imply edge,
  significance, causation, or advice.

## `mae` Language Registry

### Exact Definition

For exact entry `E` and eligible candles wholly after entry and wholly before
exit in one compatible declared allocation/single-entry window, long MAE is
`max(0, E - L)` and short MAE is `max(0, H - E)`. Entry is the zero baseline.
The result is a candle approximation, not tick truth or intrabar sequence.

### Formal Wording

- "maximum adverse candle excursion from entry"
- "entry-zero-baseline MAE for the declared held window"

### Normal Conversational Wording

- "How far did this trade move against me while I held it?"
- "What was my MAE on the selected entry?"

### Trader Slang

- "How much heat did this entry take?"
- "Worst move off my entry" maps only with trusted candle-metric context.

### Abbreviations

- `MAE`, `mae`, and `max adverse excursion` map with metric/trade context.
- Bare `MAE` may be a ticker token; validated ticker syntax/context wins, and
  ambiguous acronym-only input requires clarification.

### Common Misspellings

- `maximum advers excursion`
- `maxium adverse excurison`

### Noisy or Incomplete Input

- `mae this trade pls`
- `how far against entry` requires selected grain and covered candle context.

### Singular and Plural Forms

- Singular: "the MAE for this allocation interval".
- Plural: "MAEs by ticker" means individual eligible observations before any
  declared aggregation.

### Full Questions

- "What was the candle-based MAE for the selected eligible entry?"
- "What was median MAE for eligible shorts with the same interval?"

### Commands

- "Calculate MAE for the selected allocation interval."
- "Show candle MAE by validated ticker with coverage."

### Sentence Fragments

- `selected trade MAE`
- `1-minute MAE, short entries`

### Follow-Up Wording

- "And for longs?" preserves scope/interval but applies the long formula.
- "Use the five-minute context" changes interval only with explicit compatible
  saved evidence; it never alters the stored one-minute result silently.

### Correction Wording

- "I meant adverse excursion, not maximum adverse price."
- "Use the matched allocation interval, not the whole multi-entry lifecycle."

### Comparison Wording

- "Compare MAE for eligible long and short observations using the same saved
  interval and coverage policy."
- Comparisons never mix corporate-action bases, currencies, or grains.

### Ranking Wording

- "Rank validated tickers by median candle MAE per unit."
- Ranking requires the later approved ranking/tie contract and compatible
  observation populations.

### Negated Wording

- "Show MAE, not realized loss."
- "Do not use the entry or exit candle high/low."

### Exclusion Wording

- "Exclude observations with candle gaps from MAE values."
- "Exclude multi-entry lifecycles without an approved allocation slice" keeps
  their unavailable coverage visible.

### Multi-Filter Wording

- "Calculate one-minute MAE for eligible ready-closed short TSLA allocation
  intervals in the selected account-local period."

### Multi-Part Question Wording

- "Show MAE and maximum adverse price for this entry" returns a distance and
  endpoint as separate labelled metrics.

### Ambiguous Wording

- "Worst move" may mean MAE, maximum adverse price, realized loss, or drawdown.
- Bare `MAE` may be a metric acronym or validated ticker and has no silent
  metric default.

### Negative Examples

These examples must not map to this concept.

- "Show trades in ticker MAE" is a ticker request when `MAE` validates as the
  selected instrument.
- "What was my lowest price?" may target `maximum_adverse_price`; it does not
  ask for a distance without direction/context.
- "How much money did I lose?" is Category 2 realized P/L.

### Context Requirements

Require authorized account scope plus a selected exact matched allocation
interval or eligible single-entry `ready_closed` lifecycle, direction, entry/
exit boundary, and saved candle source/interval/coverage/basis context.

### Required Data

- Exact accepted entry price/time, matched reducing/final-exit time, direction,
  accepted allocation/round-trip versions, and eligible candle highs/lows.
- Source/adapter/schema version, interval, UTC coverage, adjustment/extended-
  hours policy, instrument/currency/corporate-action basis, and gap state.

### Optional Data

- Validated ticker, provenance, account-local date range, and compatible
  grouping/comparison context.
- Explicit display percentage is separate from canonical per-unit MAE.

### Valid Filters

- Authorized account, eligible `ready_closed` state, validated instrument,
  direction, provenance, compatible source/interval, and account-local dates.
- Filters apply after metric eligibility and cannot repair missing candles.

### Valid Groupings

- Validated instrument, direction, provenance, date/time, and compatible saved
  interval/source groups after per-allocation observation construction.
- Never group mixed currencies, corporate-action bases, or grains as one value.

### Valid Operators

- Exact value, average/median/quantile with declared population, threshold,
  comparison, grouping, and ranking after Categories 12/14 approve grammar.

### Compatible Intents

- `calculate_metric`, `summarize_performance`, `compare_groups`,
  `group_and_aggregate`, `rank_results`, `analyze_trade`, `analyze_trend`,
  `explain_result`, `explain_concept`, and `inspect_data_quality`.

### Incompatible Combinations

- Mixed allocation intervals, arbitrary first/weighted multi-entry price,
  entry/exit-containing candle extrema, gaps, incompatible intervals/bases,
  ticker-acronym coercion, tick/fillability claims, prediction, cause, or advice.

### Default Interpretation

Within trusted metric context, `mae` means the non-negative per-unit candle
excursion using the exact Section 5 long/short formulas and declared interval.
One minute is preferred only when eligible saved one-minute evidence exists.

### Clarification Conditions

Clarify when `MAE` could be a ticker, the trade/allocation grain is absent, or
the user has not distinguished excursion distance from adverse price. Do not
silently choose a multi-entry reference or candle interval.

### Recommended Clarification Wording

- "Do you mean the MAE metric or ticker MAE?"
- "Which selected entry/allocation interval should I use?"
- "Do you want adverse move distance or the maximum adverse price?"

### Unsupported Conditions

- No exact eligible grain/direction/boundaries, candle gap, incompatible
  source/interval/instrument/currency/corporate-action basis, or only boundary-
  candle evidence.
- Tick-exact timing, fillability, causal quality, prediction, or advice requests.

### Target Analytics Tool or Query Capability

- Planned Category 10 read-only candle-metric resolver over accepted Journal
  allocation facts and saved versioned market-data evidence with exact decimal
  math and explicit coverage. No named Chat/runtime capability exists.

### Result Units

- Non-negative exact price difference per instrument unit plus source,
  interval, formula version, population, and coverage. Exact zero is the entry
  baseline only under complete compatible coverage.

### Fee Handling

- Fees are excluded. Combined realized P/L retains Category 2/5 result and fee
  basis separately.

### Open-Trade Handling

- Unavailable in Version 1; no moving-now or invented exit endpoint.
  `legitimate_open`, `needs_decision`, and incomplete chains remain visible
  coverage outside the value.

### Sample-Size Considerations

- A single MAE is descriptive. Aggregates disclose eligible observation count,
  trade versus allocation grain, gaps/exclusions, and never imply risk quality,
  significance, causation, or advice.

## `profit_giveback` Language Registry

### Exact Definition

Category 10 owns one calculation: long `max(0, P - X)` and short
`max(0, X - P)`, where `P` is the entry-zero-baseline maximum favourable price
from exact entry plus only eligible candles wholly after entry and wholly before
exit, and `X` is the exact exit boundary. Category 9 may reference the fact but
never own or recompute it.

### Formal Wording

- "candle maximum-favourable-price giveback to realized exit"
- "non-negative pre-exit favourable-extreme-to-exit price reversal"

### Normal Conversational Wording

- "How much of the best move was given back by the exit?"
- "What was the candle giveback on this selected exit?"

### Trader Slang

- "How much did I give back off the top?" uses direction-aware long/short math.
- "Peak-to-exit fade" maps only with exact candle/exit context.

### Abbreviations

- `giveback`, `profit GB`, and `PGB` may map in trusted metric context.
- `GB`/`PGB` alone is too ambiguous and never bypasses ticker/token validation.

### Common Misspellings

- `profit givebak`
- `profitt give back`

### Noisy or Incomplete Input

- `giveback this exit pls`
- `peak to out how much` requires selected exact grain and direction.

### Singular and Plural Forms

- Singular: "the profit giveback for this exact exit interval".
- Plural: "givebacks by ticker" means eligible individual observations before
  declared aggregation.

### Full Questions

- "What was profit giveback from the eligible candle extreme to exact exit?"
- "What was median candle giveback for eligible long exits?"

### Commands

- "Calculate Category 10 profit giveback for the selected exit."
- "Show candle giveback by direction with coverage."

### Sentence Fragments

- `candle profit giveback`
- `best pre-exit price to exit`

### Follow-Up Wording

- "As a percentage?" requires an explicit positive denominator and does not
  silently switch to `percentage_of_available_move_captured`.
- "Was that bad?" is a separate policy/behaviour interpretation, not this fact.

### Correction Wording

- "I meant price giveback, not realized P/L reversal."
- "Use only candles wholly between entry and exit."

### Comparison Wording

- "Compare candle profit giveback for eligible long versus short exits using
  the same interval and price basis."

### Ranking Wording

- "Rank validated tickers by median per-unit profit giveback."
- Ranking requires compatible grains and the approved ranking/tie contract.

### Negated Wording

- "Show giveback without judging the exit."
- "Do not use the exit-candle high or low."

### Exclusion Wording

- "Exclude giveback observations with incomplete pre-exit candle coverage."
- Exclusions remain counted in coverage, not converted to zero.

### Multi-Filter Wording

- "Show one-minute candle giveback for eligible ready-closed long NVDA exits in
  the selected account-local period."

### Multi-Part Question Wording

- "Show profit giveback and percentage of available move captured" returns two
  distinct formulas with their own denominator rules.

### Ambiguous Wording

- "Giveback" may mean this price difference, peak open P/L reversal, Category 9
  behaviour language, fee-adjusted retained profit, or post-exit movement.
- "Off the top" needs direction, grain, and candle versus P/L clarification.

### Negative Examples

These examples must not map to this concept.

- "Why do I always give back winners?" asks for behaviour/causal analysis; it
  may reference this fact only after deterministic resolution.
- "How much net profit did I keep?" is Category 2/5 P/L and fees.
- "How far did price continue after exit?" is `post_exit_continuation`.

### Context Requirements

Require authorized account scope, exact accepted entry/matched exit allocation
or eligible single-entry lifecycle, direction, exact `E`/`X`, and compatible
saved candle source/interval/coverage/basis.

### Required Data

- Exact accepted entry/exit prices/times, direction, allocation/round-trip
  versions, and eligible wholly-between-boundary candle highs/lows.
- Source/version/interval/UTC coverage, adjustment/extended-hours policy,
  instrument/currency/corporate-action basis, and gap state.

### Optional Data

- Validated ticker, provenance, account-local date range, and compatible
  grouping/comparison dimensions.
- Separately named percentage/result context; never changes the base formula.

### Valid Filters

- Authorized account, eligible `ready_closed`, instrument, direction,
  provenance, compatible interval/source, and account-local date filters.
- Filters cannot make an unavailable exit or candle window complete.

### Valid Groupings

- Compatible instrument, direction, provenance, date/time, interval, and source
  groups after constructing one value per declared exact grain.

### Valid Operators

- Exact value, sum only over compatible per-unit observations when explicitly
  meaningful, average/median/quantile, threshold, comparison, grouping, and
  ranking after operator approval.

### Compatible Intents

- `calculate_metric`, `summarize_performance`, `compare_groups`,
  `group_and_aggregate`, `rank_results`, `analyze_trade`, `analyze_trend`,
  `explain_result`, `explain_concept`, and `inspect_data_quality`.

### Incompatible Combinations

- Category 9 duplicate calculation, Category 4/P&L substitution, mixed grains/
  bases, boundary-candle extrema, gaps, invented exit, post-exit continuation,
  causal judgement, prediction, regret, or advice.

### Default Interpretation

In trusted candle-metric context, `profit_giveback` means Category 10's sole
non-negative per-unit favourable-extreme-to-exact-exit formula. It is not a
behaviour grade or fee-adjusted P/L measure.

### Clarification Conditions

Clarify when "giveback" could mean candle price, P/L, behaviour, or post-exit
movement, or when exact grain/direction is missing. Never select Category 9 as a
second calculator.

### Recommended Clarification Wording

- "Do you mean candle price giveback, P/L giveback, or post-exit movement?"
- "Which selected entry-to-exit allocation interval should I use?"

### Unsupported Conditions

- Missing exact exit/direction/grain, gap, incompatible market-data basis, only
  entry/exit-containing candle extrema, or unavailable corporate-action match.
- Requests for causal behaviour, judgement, predicted exit, or advice.

### Target Analytics Tool or Query Capability

- Planned Category 10 read-only giveback resolver over exact accepted allocation
  boundaries and saved versioned candles with exact decimal math and coverage.
  Category 9 consumes the result only; no Chat/runtime capability exists.

### Result Units

- Non-negative exact price difference per instrument unit plus grain, source,
  interval, formula version, population, and coverage.

### Fee Handling

- Fees are excluded. Net/gross retained P/L remains a separate Category 2/5
  calculation and cannot replace this price formula.

### Open-Trade Handling

- Unavailable without an exact realized exit endpoint. Open, disputed,
  unmatched, and incomplete chains remain visible coverage.

### Sample-Size Considerations

- Individual giveback is descriptive. Aggregates disclose observation count,
  allocation/trade grain, interval, exclusions, and do not prove behaviour,
  cause, exit quality, or advice.

## `maximum_favourable_price` Language Registry

### Exact Definition

For exact entry `E` and eligible candles wholly after entry and wholly before
exit in the declared compatible window, long maximum favourable price is
`max(E, H)` and short maximum favourable price is `min(E, L)`. Entry is the
zero-excursion endpoint baseline; candle price is interval evidence, not a tick.

### Formal Wording

- "entry-baselined maximum favourable candle price"
- "direction-aware favourable price endpoint in the declared held window"

### Normal Conversational Wording

- "What was the best price while this entry was open?"
- "What was the maximum favourable price for the selected trade slice?"

### Trader Slang

- "What was the best print on the move?" requires candle-versus-tick clarity.
- "Peak price for me" is direction-aware: high for long, low for short.

### Abbreviations

- `MFP`, `max fav price`, and `max favourable px` may map in metric context.
- Bare `MFP` may be a ticker/token; validated ticker context wins and acronym-
  only input requires clarification.

### Common Misspellings

- `maximum favorible price`
- `max favourble prise`

### Noisy or Incomplete Input

- `max fav px this trade`
- `best price held` requires direction and selected grain.

### Singular and Plural Forms

- Singular: "the maximum favourable price".
- Plural: "maximum favourable prices by ticker" retains one endpoint per
  eligible observation before aggregation.

### Full Questions

- "What was the maximum favourable candle price for this long allocation?"
- "Show maximum favourable prices for eligible short observations."

### Commands

- "Return the entry-baselined maximum favourable price."
- "Show favourable price endpoints by validated ticker."

### Sentence Fragments

- `maximum favourable price`
- `best held-window price, short`

### Follow-Up Wording

- "How far was that from entry?" changes target to `mfe` while retaining the
  same grain/window.
- "When did it happen?" changes target to the interval-range timing metric.

### Correction Wording

- "I meant the price endpoint, not MFE distance."
- "Use candles between the exact boundaries, not the exit candle."

### Comparison Wording

- "Compare maximum favourable prices only within compatible instrument/
  currency/corporate-action partitions."

### Ranking Wording

- "Rank selected same-instrument observations by maximum favourable price."
- Cross-instrument raw-price ranking is invalid without an explicitly approved
  normalized metric.

### Negated Wording

- "Show maximum favourable price, not realized exit."
- "Do not claim an exact tick or time."

### Exclusion Wording

- "Exclude observations with gaps or incompatible adjustment bases."
- Excluded records remain coverage, not entry-price defaults.

### Multi-Filter Wording

- "Show one-minute maximum favourable price for eligible long AAPL allocation
  intervals in the selected period."

### Multi-Part Question Wording

- "Show maximum favourable price and MFE" returns endpoint and distance as
  separate labelled results.

### Ambiguous Wording

- "Best price" may mean limit/order price, realized exit, quote, target, candle
  endpoint, or tick high/low.
- `MFP` alone may be a ticker/token and has no silent metric default.

### Negative Examples

These examples must not map to this concept.

- "Show ticker MFP" is an instrument request when `MFP` validates as ticker.
- "What was my best exit fill?" is an execution-price request.
- "How much did it move in my favour?" targets `mfe`, not endpoint price.

### Context Requirements

Require authorized account scope, selected exact allocation/single-entry
`ready_closed` grain, direction, exact boundaries, and compatible saved candle
source/interval/coverage/basis.

### Required Data

- Exact entry/boundary times, direction, accepted versions, and eligible candle
  highs for long or lows for short.
- Source/version/interval/UTC coverage, instrument/currency/corporate-action
  basis, adjustment/extended-hours policy, and gap state.

### Optional Data

- Validated ticker, provenance, account-local period, and same-instrument
  comparison/grouping context.

### Valid Filters

- Authorized account, eligible state, validated instrument, direction,
  provenance, compatible source/interval, and account-local date range.

### Valid Groupings

- Same-instrument/currency/basis groups by direction, provenance, date/time,
  interval, or source after endpoint construction.

### Valid Operators

- Exact endpoint, min/max over compatible same-instrument observations,
  comparison, grouping, and ranking only under approved operator semantics.

### Compatible Intents

- `calculate_metric`, `retrieve_records`, `summarize_performance`,
  `compare_groups`, `group_and_aggregate`, `rank_results`, `analyze_trade`,
  `explain_result`, `explain_concept`, and `inspect_data_quality`.

### Incompatible Combinations

- Mixed instruments/currencies/bases, arbitrary combined entry, boundary-candle
  extrema, gaps, quote/tick substitution, exact-time claim, target inference,
  prediction, cause, or advice.

### Default Interpretation

In trusted context, return the direction-aware entry-baselined candle endpoint
with source/interval/coverage. Do not convert it to MFE distance or tick truth.

### Clarification Conditions

Clarify when direction, grain, candle-versus-tick evidence, or endpoint-versus-
distance meaning is unresolved, or `MFP` could be a ticker.

### Recommended Clarification Wording

- "Do you mean ticker MFP or maximum favourable price?"
- "Do you want the favourable price endpoint or its distance from entry?"
- "Which selected allocation interval and direction should I use?"

### Unsupported Conditions

- Missing direction/grain/boundaries, candle gaps, incompatible source/interval/
  instrument/currency/corporate-action basis, or tick/quote-only request.
- Exact intrabar time, fillability, inferred target, prediction, or advice.

### Target Analytics Tool or Query Capability

- Planned Category 10 read-only endpoint selector over exact accepted entry and
  saved versioned eligible candles with exact decimals and coverage. No named
  Chat/runtime capability exists.

### Result Units

- Exact price per instrument unit in one compatible partition plus source,
  interval, formula version and coverage.

### Fee Handling

- Not applicable. Fees do not change entry/candle price endpoint; related P/L
  stays separately fee-scoped.

### Open-Trade Handling

- Unavailable in Version 1; no moving-through-now endpoint. Open and incomplete
  chains remain visible coverage.

### Sample-Size Considerations

- A price endpoint is descriptive. Cross-trade aggregation requires compatible
  same-instrument price bases and disclosed counts; it does not prove quality,
  causation, or advice.

## `maximum_adverse_price` Language Registry

### Exact Definition

For exact entry `E` and eligible candles wholly after entry and wholly before
exit in the declared compatible window, long maximum adverse price is
`min(E, L)` and short maximum adverse price is `max(E, H)`. Entry is the
zero-excursion endpoint baseline; candle price is interval evidence, not a tick.

### Formal Wording

- "entry-baselined maximum adverse candle price"
- "direction-aware adverse price endpoint in the declared held window"

### Normal Conversational Wording

- "What was the worst price while this entry was open?"
- "What was the maximum adverse price for the selected trade slice?"

### Trader Slang

- "What was the worst print against me?" requires candle-versus-tick clarity.
- "Worst price for me" is direction-aware: low for long, high for short.

### Abbreviations

- `MAP`, `max adverse price`, and `max adverse px` may map in metric context.
- Bare `MAP` is also an ordinary word/ticker-like token and never maps silently.

### Common Misspellings

- `maximum advers price`
- `max adverce prise`

### Noisy or Incomplete Input

- `max adverse px this trade`
- `worst price held` requires direction and selected grain.

### Singular and Plural Forms

- Singular: "the maximum adverse price".
- Plural: "maximum adverse prices by ticker" retains one endpoint per eligible
  observation before aggregation.

### Full Questions

- "What was the maximum adverse candle price for this long allocation?"
- "Show maximum adverse prices for eligible short observations."

### Commands

- "Return the entry-baselined maximum adverse price."
- "Show adverse price endpoints by validated ticker."

### Sentence Fragments

- `maximum adverse price`
- `worst held-window price, short`

### Follow-Up Wording

- "How far was that from entry?" changes target to `mae` while retaining the
  same grain/window.
- "When did it happen?" changes target to the interval-range timing metric.

### Correction Wording

- "I meant the price endpoint, not MAE distance."
- "Use candles between the exact boundaries, not the entry candle."

### Comparison Wording

- "Compare maximum adverse prices only within compatible instrument/currency/
  corporate-action partitions."

### Ranking Wording

- "Rank selected same-instrument observations by maximum adverse price."
- Cross-instrument raw-price ranking is invalid without an explicitly approved
  normalized metric.

### Negated Wording

- "Show maximum adverse price, not realized loss."
- "Do not claim an exact tick or time."

### Exclusion Wording

- "Exclude observations with gaps or incompatible adjustment bases."
- Excluded records remain coverage, not entry-price defaults.

### Multi-Filter Wording

- "Show one-minute maximum adverse price for eligible short TSLA allocation
  intervals in the selected period."

### Multi-Part Question Wording

- "Show maximum adverse price and MAE" returns endpoint and distance as
  separate labelled results.

### Ambiguous Wording

- "Worst price" may mean stop/order price, realized exit, quote, candle
  endpoint, loss, or tick high/low.
- `MAP` alone may mean a map, ticker/token, or metric and has no silent default.

### Negative Examples

These examples must not map to this concept.

- "Map my trades by ticker" uses the ordinary verb/noun, not `MAP` metric.
- "What was my worst exit fill?" is an execution-price request.
- "How much did it move against me?" targets `mae`, not endpoint price.

### Context Requirements

Require authorized account scope, selected exact allocation/single-entry
`ready_closed` grain, direction, exact boundaries, and compatible saved candle
source/interval/coverage/basis.

### Required Data

- Exact entry/boundary times, direction, accepted versions, and eligible candle
  lows for long or highs for short.
- Source/version/interval/UTC coverage, instrument/currency/corporate-action
  basis, adjustment/extended-hours policy, and gap state.

### Optional Data

- Validated ticker, provenance, account-local period, and same-instrument
  comparison/grouping context.

### Valid Filters

- Authorized account, eligible state, validated instrument, direction,
  provenance, compatible source/interval, and account-local date range.

### Valid Groupings

- Same-instrument/currency/basis groups by direction, provenance, date/time,
  interval, or source after endpoint construction.

### Valid Operators

- Exact endpoint, min/max over compatible same-instrument observations,
  comparison, grouping, and ranking only under approved operator semantics.

### Compatible Intents

- `calculate_metric`, `retrieve_records`, `summarize_performance`,
  `compare_groups`, `group_and_aggregate`, `rank_results`, `analyze_trade`,
  `explain_result`, `explain_concept`, and `inspect_data_quality`.

### Incompatible Combinations

- Mixed instruments/currencies/bases, arbitrary combined entry, boundary-candle
  extrema, gaps, quote/tick substitution, exact-time claim, stop inference,
  prediction, cause, or advice.

### Default Interpretation

In trusted context, return the direction-aware entry-baselined candle endpoint
with source/interval/coverage. Do not convert it to MAE distance or tick truth.

### Clarification Conditions

Clarify when direction, grain, candle-versus-tick evidence, endpoint-versus-
distance meaning, or the ordinary/ticker/metric sense of `MAP` is unresolved.

### Recommended Clarification Wording

- "Do you mean maximum adverse price or something named MAP?"
- "Do you want the adverse price endpoint or its distance from entry?"
- "Which selected allocation interval and direction should I use?"

### Unsupported Conditions

- Missing direction/grain/boundaries, candle gaps, incompatible source/interval/
  instrument/currency/corporate-action basis, or tick/quote-only request.
- Exact intrabar time, fillability, inferred stop, prediction, or advice.

### Target Analytics Tool or Query Capability

- Planned Category 10 read-only endpoint selector over exact accepted entry and
  saved versioned eligible candles with exact decimals and coverage. No named
  Chat/runtime capability exists.

### Result Units

- Exact price per instrument unit in one compatible partition plus source,
  interval, formula version and coverage.

### Fee Handling

- Not applicable. Fees do not change entry/candle price endpoint; related P/L
  stays separately fee-scoped.

### Open-Trade Handling

- Unavailable in Version 1; no moving-through-now endpoint. Open and incomplete
  chains remain visible coverage.

### Sample-Size Considerations

- A price endpoint is descriptive. Cross-trade aggregation requires compatible
  same-instrument price bases and disclosed counts; it does not prove quality,
  causation, or advice.

## `percentage_of_available_move_captured` Language Registry

### Exact Definition

For exact entry `E`, exact exit `X`, and the same strictly positive candle-MFE
denominator, long is `((X - E) / max(0, H - E)) * 100` and short is
`((E - X) / max(0, E - L)) * 100`. Preserve negative and above-100 results; a
zero/missing denominator is unavailable, never zero percent.

### Formal Wording

- "percentage of candle-measured favourable move captured at exact exit"
- "directional entry-to-exit move divided by strictly positive candle MFE"

### Normal Conversational Wording

- "What percentage of the available move did I capture?"
- "How much of the candle MFE was in my actual exit move?"

### Trader Slang

- "How much of the move did I catch?"
- "What percent of the meat did I get?" requires metric, grain, and denominator
  clarification rather than behavioural interpretation.

### Abbreviations

- `move captured %`, `capture pct`, and `MFE capture %` may map in context.
- `PAMC` alone is not a safe default and must pass ticker/token validation.

### Common Misspellings

- `percent of availble move captured`
- `move capture precentage`

### Noisy or Incomplete Input

- `pct move caught this trade`
- `capture vs mfe pls` requires selected grain and exact exit.

### Singular and Plural Forms

- Singular: "the available-move capture percentage for this observation".
- Plural: "capture percentages" means individual ratios, not a ratio of totals.

### Full Questions

- "What percentage of candle MFE did this eligible long exit capture?"
- "What was median available-move capture for eligible short observations?"

### Commands

- "Calculate available-move capture for the selected allocation interval."
- "Show capture percentages with denominator coverage."

### Sentence Fragments

- `available move captured %`
- `exit move / candle MFE`

### Follow-Up Wording

- "Cap it at 100" is rejected; the exact result remains unclamped.
- "What was the giveback?" changes target to `profit_giveback`.

### Correction Wording

- "I meant candle-MFE capture, not realized return."
- "Keep negative and over-100 values; do not clamp them."

### Comparison Wording

- "Compare median move-capture percentage for compatible long and short
  observations."

### Ranking Wording

- "Rank validated tickers by median available-move capture percentage."
- Ranking uses eligible individual ratios and an approved tie rule.

### Negated Wording

- "Show capture percentage, not net return."
- "Do not replace a zero MFE denominator with zero percent."

### Exclusion Wording

- "Exclude observations without strictly positive candle MFE."
- Exclusions remain denominator/coverage counts.

### Multi-Filter Wording

- "Show available-move capture for one-minute eligible ready-closed long AAPL
  allocation intervals in the selected period."

### Multi-Part Question Wording

- "Show MFE, capture percentage, and giveback" returns three separately
  labelled formulas from one compatible grain/window.

### Ambiguous Wording

- "Percent captured" may mean realized return, profit retained, position size,
  quantity exited, or this candle-MFE ratio.
- "Available move" requires the Category 10 candle denominator, not hindsight
  from arbitrary later candles.

### Negative Examples

These examples must not map to this concept.

- "What percent return did I make?" is realized-return language.
- "What percentage of shares did I sell?" is execution/quantity language.
- "How much should I try to capture?" asks for advice.

### Context Requirements

Require authorized account, exact eligible allocation/single-entry grain,
direction, exact `E`/`X`, and the same compatible saved-candle MFE window/basis.

### Required Data

- Exact accepted entry/exit prices/times, direction, accepted versions, and
  eligible wholly-between-boundary highs/lows.
- Strictly positive MFE, source/version/interval/UTC coverage, instrument,
  currency, adjustment/corporate-action basis, and gap state.

### Optional Data

- Validated ticker, provenance, account-local period, and compatible grouping/
  comparison dimensions.

### Valid Filters

- Authorized account, eligible `ready_closed`, instrument, direction,
  provenance, compatible interval/source, and account-local dates.

### Valid Groupings

- Compatible instrument, direction, provenance, time, interval, and source
  groups after individual ratio construction.
- Never silently substitute ratio-of-sums for mean/median individual ratios.

### Valid Operators

- Exact ratio, mean/median/quantile with declared observation population,
  threshold, comparison, grouping, and ranking after operator approval.

### Compatible Intents

- `calculate_metric`, `summarize_performance`, `compare_groups`,
  `group_and_aggregate`, `rank_results`, `analyze_trade`, `analyze_trend`,
  `explain_result`, `explain_concept`, and `inspect_data_quality`.

### Incompatible Combinations

- Zero/missing MFE denominator, clamping, mixed grains/intervals/bases, invented
  exit, ratio-of-sums substitution, tick/fillability claims, cause, or advice.

### Default Interpretation

In trusted context, use the exact direction-aware Section 5 ratio with a
strictly positive candle-MFE denominator and preserve the signed unclamped
percentage.

### Clarification Conditions

Clarify when "percent captured" could mean return/quantity/profit retention,
or when grain, direction, or candle denominator is absent.

### Recommended Clarification Wording

- "Do you mean percentage of candle MFE captured, realized return, or exit
  quantity percentage?"
- "Which selected entry-to-exit allocation interval should I use?"

### Unsupported Conditions

- Nonpositive/unavailable MFE, missing exact exit/direction/grain, gaps, or
  incompatible source/interval/instrument/currency/corporate-action basis.
- Requests to clamp, invent fillability, predict, judge, or advise.

### Target Analytics Tool or Query Capability

- Planned Category 10 read-only strict-denominator ratio over accepted
  allocation boundaries and saved versioned candles with exact decimals and
  coverage. No named Chat/runtime capability exists.

### Result Units

- Exact dimensionless percentage with numerator, strictly positive denominator,
  grain, interval, formula version, population, and coverage disclosed.

### Fee Handling

- Fees are excluded from price numerator/denominator. This is not fee-adjusted
  return or retained P/L.

### Open-Trade Handling

- Unavailable without exact exit and complete eligible window. Open/disputed/
  incomplete activity remains visible coverage.

### Sample-Size Considerations

- Aggregates disclose eligible ratios, nonpositive-denominator exclusions, and
  grain. Small samples and extreme unclamped values are descriptive, not causal
  evidence or advice.

## `entry_distance_from_vwap` Language Registry

### Exact Definition

For exact entry price `E` and compatible saved Session VWAP `V`, signed distance
is `E - V`; positive is above and negative below. Explicit percentage is
`((E - V) / V) * 100` only for strictly positive `V`. VWAP must reconcile as
cumulative exact turnover divided by cumulative exact volume under one declared
exchange-session/source/interval contract; direction does not reverse sign.

### Formal Wording

- "signed entry-price distance from declared Session VWAP"
- "entry minus cumulative-turnover-over-volume benchmark"

### Normal Conversational Wording

- "How far above or below VWAP was my entry?"
- "What was the entry-to-VWAP distance?"

### Trader Slang

- "How extended was my entry from VWAP?" maps to signed distance, not quality.
- "Did I buy over VWAP?" requires direction/entry and factual relation only.

### Abbreviations

- `VWAP dist`, `entry vs VWAP`, and `VWAP %` may map in context.
- `VWAP` alone asks for the benchmark price, not necessarily this distance.

### Common Misspellings

- `entry distnce from vwap`
- `entery vs vwapp`

### Noisy or Incomplete Input

- `entry vwap diff pls`
- `how far vwap` requires selected entry and price-versus-percent clarification.

### Singular and Plural Forms

- Singular: "the entry-to-VWAP distance".
- Plural: "VWAP distances" means fill-specific signed observations before
  approved aggregation.

### Full Questions

- "What was signed distance from Session VWAP for this exact entry?"
- "Compare entry VWAP distance for eligible long and short observations."

### Commands

- "Calculate entry minus Session VWAP."
- "Show signed entry-to-VWAP percentages with benchmark coverage."

### Sentence Fragments

- `entry distance from VWAP`
- `entry vs session VWAP %`

### Follow-Up Wording

- "As a percent?" adds the strictly positive `V` denominator.
- "Make it favourable for shorts" requires a separately named direction-
  normalized concept; it does not change this signed contract.

### Correction Wording

- "I meant signed above/below VWAP, not direction-normalized favourability."
- "Use each entry's own saved VWAP point, not one aggregate snapshot."

### Comparison Wording

- "Compare signed entry-to-VWAP distance using compatible session/source/
  interval contracts."

### Ranking Wording

- "Rank compatible observations by absolute VWAP distance" requires explicit
  absolute operator; signed ranking otherwise preserves sign.

### Negated Wording

- "Show VWAP distance, not slippage."
- "Do not use a provider field that cannot reconcile to turnover/volume."

### Exclusion Wording

- "Exclude entries with zero/missing VWAP volume denominator."
- Coverage retains excluded benchmark observations.

### Multi-Filter Wording

- "Show signed one-minute entry-to-VWAP distance for eligible long NVDA entries
  in the declared regular-plus-extended session policy."

### Multi-Part Question Wording

- "Show entry VWAP distance and volume at entry" returns benchmark distance and
  containing-candle volume separately.

### Ambiguous Wording

- "VWAP at entry" may ask for VWAP price, signed distance, percent distance, or
  above/below relation.
- "Extended" can be descriptive distance or quality/slang and needs intent.

### Negative Examples

These examples must not map to this concept.

- "What was Session VWAP?" asks for the benchmark, not its entry distance.
- "What was my fill slippage?" requires quote/order evidence.
- "Was entering above VWAP a mistake?" asks for judgement/causation.

### Context Requirements

Require authorized account, exact accepted position-increasing allocation,
declared session/calendar/extended-hours policy, source revision/interval, and
compatible instrument/currency/corporate-action basis.

### Required Data

- Exact entry price/time and accepted allocation version.
- Cumulative exact turnover/volume, strictly positive volume denominator,
  session anchor, source/version/interval/coverage, and compatible basis.

### Optional Data

- Direction (retained but not sign-flipping), validated ticker, provenance,
  account-local dates, and explicit percentage/absolute operator.

### Valid Filters

- Authorized account, eligible state, instrument, direction, provenance,
  declared session/source/interval, and account-local date range.

### Valid Groupings

- Compatible instrument, direction, provenance, session policy, interval,
  source and time groups after fill-specific distance construction.

### Valid Operators

- Signed exact distance, explicit absolute value, percentage with positive `V`,
  mean/median, threshold, comparison, grouping, and ranking after approval.

### Compatible Intents

- `calculate_metric`, `summarize_performance`, `compare_groups`,
  `group_and_aggregate`, `rank_results`, `analyze_trade`, `analyze_trend`,
  `explain_result`, `explain_concept`, and `inspect_data_quality`.

### Incompatible Combinations

- Missing/zero turnover-volume denominator, undeclared session, arbitrary VWAP
  snapshot, combined entry price, mixed bases, slippage/quality substitution,
  lookahead, cause, or advice.

### Default Interpretation

In trusted context, return signed raw-price `E - V`; direction does not flip
sign. Percent requires explicit request and strictly positive reconciled VWAP.

### Clarification Conditions

Clarify price-versus-percent/absolute output, VWAP price versus distance, or
missing session policy. Never infer direction-normalized favourability.

### Recommended Clarification Wording

- "Do you want the VWAP price, signed price distance, or signed percentage?"
- "Which approved exchange-session and extended-hours policy should I use?"

### Unsupported Conditions

- Missing exact entry, cumulative turnover/volume, positive denominator,
  session/source/interval coverage, or compatible instrument/currency/basis.
- Slippage, decision-quality, causal, predictive, or advice requests.

### Target Analytics Tool or Query Capability

- Planned Category 10 read-only VWAP resolver using exact saved turnover/volume,
  declared session, accepted entry, exact decimals and coverage. Existing fields
  do not create a named Chat/runtime capability.

### Result Units

- Exact signed price difference per instrument unit; optional signed percentage
  with positive `V`; session/source/interval/formula/coverage accompanies it.

### Fee Handling

- Fees are excluded. This is not fee-adjusted cost basis or P/L.

### Open-Trade Handling

- Version 1 defaults to accepted entries in eligible `ready_closed` lifecycles;
  no generic open-state population is approved.

### Sample-Size Considerations

- Aggregates disclose entry count, benchmark coverage, sign convention, session
  policy and interval. Association does not establish entry quality or cause.

## `entry_distance_from_high_of_day` Language Registry

### Exact Definition

Under an approved exchange calendar/session/timezone/extended-hours contract
and continuous coverage from session start, let `D_H = max(E, H_pre)`, where
`H_pre` uses only fully completed candles wholly before entry. Return `D_H - E`;
explicit percentage requires strictly positive `D_H`. No local-date fallback.

### Formal Wording

- "entry distance below no-lookahead exchange-session high"
- "entry-to-pre-entry session-high price difference"

### Normal Conversational Wording

- "How far was my entry from the high of day?"
- "How much below the session high did I enter?"

### Trader Slang

- "How far off HOD was my entry?"
- "Did I enter near the highs?" maps only to factual distance, not quality.

### Abbreviations

- `HOD distance`, `entry vs HOD`, and `off HOD` may map in context.
- `HOD` alone may ask for the high price, not entry distance.

### Common Misspellings

- `entry distnce from high of day`
- `how far off hihg of day`

### Noisy or Incomplete Input

- `entry vs hod pls`
- `off highs how much` requires approved session and selected entry.

### Singular and Plural Forms

- Singular: "the entry-to-session-high distance".
- Plural: "HOD distances" means entry-specific observations under one contract.

### Full Questions

- "What was entry distance from the approved exchange-session high?"
- "Compare HOD distance for eligible long entries."

### Commands

- "Calculate entry distance from pre-entry session high."
- "Show HOD distance with session coverage."

### Sentence Fragments

- `entry distance from HOD`
- `off session high at entry`

### Follow-Up Wording

- "Include premarket" changes only to an explicitly approved extended-hours
  session policy with complete coverage.
- "What about low of day?" changes target to the separate LOD metric.

### Correction Wording

- "Use the exchange-session high before entry, not the later full-day high."
- "Do not use my local calendar-day bucket."

### Comparison Wording

- "Compare HOD distance only across observations sharing the approved session,
  interval, source, and basis."

### Ranking Wording

- "Rank entries closest to HOD" requires explicit ascending distance and
  approved tie handling.

### Negated Wording

- "Show distance from HOD, not maximum favourable price."
- "Do not use the entry-containing candle high."

### Exclusion Wording

- "Exclude entries without coverage from session start."
- Excluded entries remain visible coverage, not zero distance.

### Multi-Filter Wording

- "Show one-minute HOD distance for eligible long AAPL entries in the approved
  extended-session definition and selected period."

### Multi-Part Question Wording

- "Show distance from HOD and LOD" returns two distinct entry-range metrics.

### Ambiguous Wording

- "High of day" may mean regular session, extended session, local calendar day,
  full later day, or provider quote high.
- "Near HOD" needs a distance/threshold and session contract.

### Negative Examples

These examples must not map to this concept.

- "What was the eventual day's high?" uses later information and is not this
  no-lookahead entry metric.
- "What resistance was nearest?" is level analysis.
- "Was buying near HOD bad?" asks for judgement/causation.

### Context Requirements

Require authorized account, exact entry, approved exchange calendar/session and
timezone, account IANA display timezone, extended-hours policy, source/interval,
and continuous compatible session-start-to-entry coverage.

### Required Data

- Exact entry price/time, eligible fully completed pre-entry highs, and accepted
  allocation version.
- Exchange calendar/session/timezone, source/version/interval/coverage,
  instrument/currency/corporate-action/adjustment basis.

### Optional Data

- Validated ticker, direction (does not reverse formula), provenance, date range,
  explicit percentage/near-threshold operator.

### Valid Filters

- Authorized account, eligible state, instrument, direction, provenance,
  approved session/source/interval, and account-local date range.

### Valid Groupings

- Compatible instrument, direction, session policy, provenance, time, interval,
  and source groups after entry-specific distance construction.

### Valid Operators

- Exact non-negative distance, percentage with positive `D_H`, threshold,
  mean/median, comparison, grouping, and ranking after approval.

### Compatible Intents

- `calculate_metric`, `summarize_performance`, `compare_groups`,
  `group_and_aggregate`, `rank_results`, `analyze_trade`, `analyze_trend`,
  `explain_result`, `explain_concept`, and `inspect_data_quality`.

### Incompatible Combinations

- Local-bucket/full-later-day fallback, missing session-start coverage,
  entry-candle high, mixed sessions/bases, resistance/quality substitution,
  lookahead, cause, or advice.

### Default Interpretation

No generic "day" default exists. In trusted approved-session context, return
`max(E,H_pre)-E` using only fully completed pre-entry candles.

### Clarification Conditions

Clarify regular versus extended session, HOD price versus entry distance, and
missing threshold/percentage output. Never fall back to account-local day.

### Recommended Clarification Wording

- "Which approved exchange session should define high of day: regular or the
  documented extended-hours session?"
- "Do you want the HOD price or the entry-to-HOD distance?"

### Unsupported Conditions

- Missing approved calendar/session/timezone, incomplete session-start coverage,
  entry/basis mismatch, or only entry-containing/later candle high.
- Resistance, quality, causal, predictive, or advice requests.

### Target Analytics Tool or Query Capability

- Planned Category 10 no-lookahead session-range resolver over accepted entry
  and saved versioned candles with calendar/session validation and coverage. No
  named Chat/runtime capability exists.

### Result Units

- Non-negative exact price difference per unit; optional percentage with
  positive `D_H`; session/source/interval/formula/coverage accompanies it.

### Fee Handling

- Not applicable. Fees do not change entry/session high.

### Open-Trade Handling

- Version 1 defaults to accepted entries in eligible `ready_closed` lifecycles;
  no generic open-state population is approved.

### Sample-Size Considerations

- Aggregates disclose eligible entry count and missing session coverage. Near-
  HOD association is descriptive and does not prove quality, cause, or advice.

## `entry_distance_from_low_of_day` Language Registry

### Exact Definition

Under an approved exchange calendar/session/timezone/extended-hours contract
and continuous coverage from session start, let `D_L = min(E, L_pre)`, where
`L_pre` uses only fully completed candles wholly before entry. Return `E - D_L`;
explicit percentage requires strictly positive `D_L`. No local-date fallback.

### Formal Wording

- "entry distance above no-lookahead exchange-session low"
- "pre-entry session-low-to-entry price difference"

### Normal Conversational Wording

- "How far was my entry from the low of day?"
- "How much above the session low did I enter?"

### Trader Slang

- "How far off LOD was my entry?"
- "Did I enter near the lows?" maps only to factual distance, not quality.

### Abbreviations

- `LOD distance`, `entry vs LOD`, and `off LOD` may map in context.
- `LOD` alone may ask for the low price, not entry distance.

### Common Misspellings

- `entry distnce from low of day`
- `how far off loe of day`

### Noisy or Incomplete Input

- `entry vs lod pls`
- `off lows how much` requires approved session and selected entry.

### Singular and Plural Forms

- Singular: "the entry-to-session-low distance".
- Plural: "LOD distances" means entry-specific observations under one contract.

### Full Questions

- "What was entry distance from the approved exchange-session low?"
- "Compare LOD distance for eligible short entries."

### Commands

- "Calculate entry distance from pre-entry session low."
- "Show LOD distance with session coverage."

### Sentence Fragments

- `entry distance from LOD`
- `off session low at entry`

### Follow-Up Wording

- "Include premarket" changes only to an explicitly approved extended-hours
  session policy with complete coverage.
- "What about high of day?" changes target to the separate HOD metric.

### Correction Wording

- "Use the exchange-session low before entry, not the later full-day low."
- "Do not use my local calendar-day bucket."

### Comparison Wording

- "Compare LOD distance only across observations sharing the approved session,
  interval, source, and basis."

### Ranking Wording

- "Rank entries closest to LOD" requires explicit ascending distance and
  approved tie handling.

### Negated Wording

- "Show distance from LOD, not maximum adverse price."
- "Do not use the entry-containing candle low."

### Exclusion Wording

- "Exclude entries without coverage from session start."
- Excluded entries remain visible coverage, not zero distance.

### Multi-Filter Wording

- "Show one-minute LOD distance for eligible short TSLA entries in the approved
  extended-session definition and selected period."

### Multi-Part Question Wording

- "Show distance from LOD and HOD" returns two distinct entry-range metrics.

### Ambiguous Wording

- "Low of day" may mean regular session, extended session, local calendar day,
  full later day, or provider quote low.
- "Near LOD" needs a distance/threshold and session contract.

### Negative Examples

These examples must not map to this concept.

- "What was the eventual day's low?" uses later information and is not this
  no-lookahead entry metric.
- "What support was nearest?" is level analysis.
- "Was shorting near LOD bad?" asks for judgement/causation.

### Context Requirements

Require authorized account, exact entry, approved exchange calendar/session and
timezone, account IANA display timezone, extended-hours policy, source/interval,
and continuous compatible session-start-to-entry coverage.

### Required Data

- Exact entry price/time, eligible fully completed pre-entry lows, and accepted
  allocation version.
- Exchange calendar/session/timezone, source/version/interval/coverage,
  instrument/currency/corporate-action/adjustment basis.

### Optional Data

- Validated ticker, direction (does not reverse formula), provenance, date range,
  explicit percentage/near-threshold operator.

### Valid Filters

- Authorized account, eligible state, instrument, direction, provenance,
  approved session/source/interval, and account-local date range.

### Valid Groupings

- Compatible instrument, direction, session policy, provenance, time, interval,
  and source groups after entry-specific distance construction.

### Valid Operators

- Exact non-negative distance, percentage with positive `D_L`, threshold,
  mean/median, comparison, grouping, and ranking after approval.

### Compatible Intents

- `calculate_metric`, `summarize_performance`, `compare_groups`,
  `group_and_aggregate`, `rank_results`, `analyze_trade`, `analyze_trend`,
  `explain_result`, `explain_concept`, and `inspect_data_quality`.

### Incompatible Combinations

- Local-bucket/full-later-day fallback, missing session-start coverage,
  entry-candle low, mixed sessions/bases, support/quality substitution,
  lookahead, cause, or advice.

### Default Interpretation

No generic "day" default exists. In trusted approved-session context, return
`E-min(E,L_pre)` using only fully completed pre-entry candles.

### Clarification Conditions

Clarify regular versus extended session, LOD price versus entry distance, and
missing threshold/percentage output. Never fall back to account-local day.

### Recommended Clarification Wording

- "Which approved exchange session should define low of day: regular or the
  documented extended-hours session?"
- "Do you want the LOD price or the entry-to-LOD distance?"

### Unsupported Conditions

- Missing approved calendar/session/timezone, incomplete session-start coverage,
  entry/basis mismatch, or only entry-containing/later candle low.
- Support, quality, causal, predictive, or advice requests.

### Target Analytics Tool or Query Capability

- Planned Category 10 no-lookahead session-range resolver over accepted entry
  and saved versioned candles with calendar/session validation and coverage. No
  named Chat/runtime capability exists.

### Result Units

- Non-negative exact price difference per unit; optional percentage with
  positive `D_L`; session/source/interval/formula/coverage accompanies it.

### Fee Handling

- Not applicable. Fees do not change entry/session low.

### Open-Trade Handling

- Version 1 defaults to accepted entries in eligible `ready_closed` lifecycles;
  no generic open-state population is approved.

### Sample-Size Considerations

- Aggregates disclose eligible entry count and missing session coverage. Near-
  LOD association is descriptive and does not prove quality, cause, or advice.

## `volume_at_entry` Language Registry

### Exact Definition

Return the exact non-negative full volume of the one saved normalized candle
whose declared timestamp semantics contain the exact entry-allocation UTC.
This is containing-interval volume, not volume before the fill. Multiple entries
in one candle reference one market-volume fact and must not duplicate sums.

### Formal Wording

- "full normalized market volume of the entry-containing candle interval"
- "entry-interval candle volume under declared timestamp semantics"

### Normal Conversational Wording

- "What was the volume on the candle where I entered?"
- "How much market volume was in my entry minute?"

### Trader Slang

- "What volume did I enter into?" maps to full containing candle with caveat.
- "Was volume heavy on entry?" asks for a comparison only if a denominator is
  separately approved; raw volume alone cannot label heavy.

### Abbreviations

- `entry vol`, `vol @ entry`, and `entry-candle vol` may map in context.
- `VE`/`EVol` alone is ambiguous and must pass ticker/token validation.

### Common Misspellings

- `volum at entery`
- `entry candl vol`

### Noisy or Incomplete Input

- `vol @ my fill pls`
- `entry min volume` requires exact entry and recorded interval semantics.

### Singular and Plural Forms

- Singular: "the volume-at-entry observation".
- Plural: "entry volumes" means candle observations deduplicated by candle
  identity before any market-volume sum.

### Full Questions

- "What was full one-minute candle volume at the selected entry?"
- "Show entry-candle volume for eligible observations with source coverage."

### Commands

- "Return the containing-candle volume for this exact entry."
- "Show volume at entry by validated ticker without double counting candles."

### Sentence Fragments

- `volume at entry`
- `entry candle full volume`

### Follow-Up Wording

- "How much was before my fill?" is unavailable from OHLCV candle volume.
- "Relative to normal?" changes target to unavailable `relative_volume` unless
  an approved comparison denominator later exists.

### Correction Wording

- "I meant market candle volume, not my execution quantity."
- "Deduplicate entries sharing the same candle."

### Comparison Wording

- "Compare entry-candle volume for observations with the same instrument,
  interval, session policy, source, and corporate-action basis."

### Ranking Wording

- "Rank compatible entry candles by full interval volume."
- Entries sharing one candle must not appear as independent volume facts.

### Negated Wording

- "Show entry volume, not shares I bought."
- "Do not claim how much volume occurred before the entry."

### Exclusion Wording

- "Exclude entries without exactly one containing candle."
- Ambiguous/overlapping/missing candles remain coverage.

### Multi-Filter Wording

- "Show one-minute volume at entry for eligible AAPL entries in the declared
  extended-session policy and selected period."

### Multi-Part Question Wording

- "Show volume at entry and entry-to-VWAP distance" returns separate volume and
  price-benchmark facts.

### Ambiguous Wording

- "Entry volume" may mean market candle volume, execution quantity, allocated
  quantity, cumulative volume, or relative volume.
- "At entry" does not identify before-fill volume inside the containing candle.

### Negative Examples

These examples must not map to this concept.

- "How many shares did I buy?" is execution/position quantity.
- "What volume traded before my fill?" is unavailable without trusted intrabar
  trade sequence.
- "Was liquidity good?" requires separate qualified liquidity evidence.

### Context Requirements

Require authorized account, exact accepted entry UTC, one unambiguous normalized
containing candle, and declared source/version/interval/timestamp/session/basis.

### Required Data

- Exact accepted entry-allocation UTC/version and normalized candle identity,
  bounds/timestamp semantics, non-negative volume, interval and source revision.
- Coverage, instrument/unit semantics, currency/corporate-action/adjustment and
  extended-hours policy.

### Optional Data

- Validated ticker, direction, provenance, account-local date range, and
  compatible grouping context.

### Valid Filters

- Authorized account, eligible state, instrument, direction, provenance,
  compatible source/interval/session, and account-local dates.

### Valid Groupings

- Compatible candle identity, instrument, direction, provenance, time, interval,
  session and source; deduplicate candle identity before market-volume sums.

### Valid Operators

- Exact value, sum only over unique compatible candle identities, mean/median,
  threshold, comparison, grouping, and ranking after approval.

### Compatible Intents

- `retrieve_records`, `calculate_metric`, `summarize_performance`,
  `compare_groups`, `group_and_aggregate`, `rank_results`, `analyze_trade`,
  `explain_result`, `explain_concept`, and `inspect_data_quality`.

### Incompatible Combinations

- Execution-quantity substitution, pre-fill sequence claim, duplicate shared
  candle sums, mixed units/intervals/bases, inferred relative volume/liquidity,
  cause, prediction, or advice.

### Default Interpretation

In trusted context, return full volume of the exact entry-containing saved
candle and state interval/source. It never means pre-entry or execution volume.

### Clarification Conditions

Clarify market candle volume versus execution quantity/cumulative/relative
volume, and the intended interval when multiple saved intervals exist.

### Recommended Clarification Wording

- "Do you mean full market volume of the entry candle or your executed
  quantity?"
- "Which saved candle interval should define volume at entry?"

### Unsupported Conditions

- Missing/ambiguous containing candle, invalid/negative volume, missing exact
  entry UTC, incompatible interval/instrument/unit/corporate-action basis, or
  request for pre-fill split.
- Liquidity/quality, causal, predictive, or advice requests.

### Target Analytics Tool or Query Capability

- Planned Category 10 read-only entry-candle resolver over accepted entry UTC
  and saved normalized versioned candles with candle-identity deduplication and
  coverage. No named Chat/runtime capability exists.

### Result Units

- Exact non-negative normalized market-volume units for one unique candle plus
  instrument/unit semantics, source, interval, session and coverage.

### Fee Handling

- Not applicable. Fees do not change market candle volume.

### Open-Trade Handling

- Version 1 defaults to accepted entries in eligible `ready_closed` lifecycles;
  no generic open-state population is approved.

### Sample-Size Considerations

- Aggregates disclose unique candle count and entry count separately. Shared-
  candle entries do not create independent market-volume samples; association
  does not establish liquidity, quality, cause, or advice.

## `relative_volume` Language Registry

### Exact Definition

`relative_volume` is `Unavailable`. A canonical ratio would require an approved
observed-volume numerator and strictly positive expected-volume denominator for
the same instrument, aligned session/interval, comparison population, lookback,
adjustment basis, and missing/zero policy. None is approved; no provider RVOL or
fallback average is adopted.

### Formal Wording

- "relative volume under an approved comparison denominator"
- "observed volume divided by versioned aligned expected volume"

### Normal Conversational Wording

- "What was relative volume at entry?"
- "How did that candle's volume compare with normal?"

### Trader Slang

- "What was RVOL?"
- "Was volume hot?" cannot produce a ratio without an approved baseline.

### Abbreviations

- `RVOL`, `rvol`, and `rel vol` identify the concept in metric context.
- Bare `RVOL` must still pass ticker/token validation and never supplies a
  denominator by itself.

### Common Misspellings

- `relative volum`
- `reltive volme`

### Noisy or Incomplete Input

- `rvol entry pls`
- `vol vs normal` is incomplete because "normal" is undefined.

### Singular and Plural Forms

- Singular: "the relative-volume value" remains unavailable.
- Plural: "RVOL values" does not authorize mixed denominators.

### Full Questions

- "What was relative volume for the selected entry interval?"
- "Compare RVOL across trades" remains unavailable without one approved
  compatible comparison contract.

### Commands

- "Calculate RVOL" returns the missing-denominator boundary.
- "Show relative volume by ticker" does not adopt provider-specific fields.

### Sentence Fragments

- `relative volume at entry`
- `RVOL vs normal`

### Follow-Up Wording

- "Use the last 20 days" is a proposed lookback, not approval of population,
  alignment, aggregation, or missing-day rules.
- "Then show raw volume" may route separately to `volume_at_entry`.

### Correction Wording

- "I meant raw entry-candle volume, not relative volume."
- "Do not use the provider RVOL field as the canonical denominator."

### Comparison Wording

- "Compare relative volume for longs and shorts" remains unavailable until the
  shared denominator contract exists.

### Ranking Wording

- "Rank tickers by RVOL" is unavailable; no canonical comparable ratio exists.

### Negated Wording

- "Show RVOL without using average daily volume" still lacks a denominator.
- "Do not guess the baseline."

### Exclusion Wording

- "Exclude missing comparison days" cannot define the missing-day policy by
  itself and requires reviewed denominator semantics.

### Multi-Filter Wording

- "RVOL for one-minute extended-session long entries last month" remains
  unavailable despite complete filters.

### Multi-Part Question Wording

- "Show volume at entry and RVOL" returns raw volume when covered and a separate
  unavailable RVOL state.

### Ambiguous Wording

- "Normal volume" may mean same minute historically, daily average, cumulative
  pace, provider RVOL, or user baseline.
- "RVOL" does not specify numerator, denominator, session, or lookback.

### Negative Examples

These examples must not map to this concept.

- "What was raw volume on my entry candle?" is `volume_at_entry`.
- "What was dollar turnover?" is not relative volume.
- "High RVOL means I should buy, right?" asks for advice.

### Context Requirements

Require authorized scope and selected entry/interval, but recognize that no
context can repair the absent approved comparison population and denominator.

### Required Data

- Not currently satisfied: approved numerator, strictly positive denominator,
  comparison population/lookback, session alignment, interval position,
  adjustment/corporate-action basis, and missing/zero rules.
- Source/version/coverage and instrument/unit semantics would also be required.

### Optional Data

- Validated ticker, direction, provenance, account-local period, and explicit
  candidate baseline may inform later review but do not enable the metric.

### Valid Filters

- None can make the metric available. Future filters must preserve authorized
  account, instrument, session, interval, source, and compatible comparison set.

### Valid Groupings

- None approved. Future grouping must follow construction of comparable ratios
  under one denominator version; mixed baselines cannot be grouped.

### Valid Operators

- None executable while unavailable. Future ratio/threshold/comparison/ranking
  requires the approved strict-positive denominator contract.

### Compatible Intents

- `calculate_metric`, `compare_groups`, `group_and_aggregate`, `rank_results`,
  `analyze_trade`, `explain_result`, `explain_concept`, and
  `inspect_data_quality` may return the explicit unavailable boundary.

### Incompatible Combinations

- Provider-field adoption, guessed average, zero denominator, mixed sessions/
  intervals/bases, raw-volume substitution, liquidity/quality inference,
  prediction, cause, or advice.

### Default Interpretation

No numeric default exists. Return `Unavailable` and name the missing approved
comparison population/denominator rather than guessing RVOL.

### Clarification Conditions

Clarification cannot activate the capability, but may distinguish raw volume
from relative volume or record a proposed denominator for future review.

### Recommended Clarification Wording

- "Do you want the covered raw entry-candle volume instead? Relative volume has
  no approved comparison denominator yet."

### Unsupported Conditions

- All numeric RVOL requests under Version 1; especially provider-specific,
  zero/missing denominator, mixed-session, or guessed-baseline requests.
- Liquidity, causal, predictive, quality, or advice conclusions.

### Target Analytics Tool or Query Capability

- Unavailable Category 10 target. A future read-only comparator requires an
  independently approved denominator/version/coverage contract; no Chat/runtime
  or provider fallback exists.

### Result Units

- Unavailable. A future result would be a non-negative dimensionless ratio with
  exact numerator, positive denominator, population and coverage disclosed.

### Fee Handling

- Not applicable. Fees do not define volume comparison.

### Open-Trade Handling

- Unavailable for open and closed activity because the denominator contract is
  absent.

### Sample-Size Considerations

- A future baseline needs sufficient comparable periods and explicit retained/
  skipped counts. No sample threshold is invented now.

## `price_change_after_entry` Language Registry

### Exact Definition

For exact entry `E` and an explicitly selected/trusted later fully completed
candle close `C`, long change is `C - E` and short change is `E - C`. The exact
close/horizon, continuous compatible coverage, source and interval are required.
No default, nearest candle, interpolation, partial candle, or entry candle.

### Formal Wording

- "directional price change from exact entry to explicit completed close"
- "entry-to-declared-horizon completed-candle close difference"

### Normal Conversational Wording

- "How much did price move after my entry by the selected close?"
- "What was the five-minute change after entry?" requires the exact approved
  horizon-to-close rule.

### Trader Slang

- "What did it do after I got in?"
- "Move after entry" still needs one explicit completed-close endpoint.

### Abbreviations

- `chg after entry`, `post-entry chg`, and `E→close move` may map in context.
- `PCE` alone is ambiguous/ticker-like and never selects this metric silently.

### Common Misspellings

- `price chnage after entry`
- `post entery move`

### Noisy or Incomplete Input

- `move 5m after in`
- `after entry change` requires exact horizon/close and selected entry.

### Singular and Plural Forms

- Singular: "the price change after this entry".
- Plural: "post-entry changes" means individually resolved horizons/grains.

### Full Questions

- "What was long directional change to the explicit 10:15 completed close?"
- "Compare five-minute post-entry change under one approved endpoint rule."

### Commands

- "Calculate change from exact entry to the selected completed candle close."
- "Show directional post-entry change with horizon coverage."

### Sentence Fragments

- `price change after entry, 5-minute close`
- `entry to explicit completed close`

### Follow-Up Wording

- "Use ten minutes instead" changes endpoint only under an exact approved
  horizon-to-close rule and complete coverage.
- "Use the nearest candle" is rejected.

### Correction Wording

- "I meant the completed close, not candle high."
- "Use long `C-E`, not an unsigned absolute change."

### Comparison Wording

- "Compare directional post-entry change using the same horizon, source,
  interval, grain, and basis."

### Ranking Wording

- "Rank eligible entries by five-minute directional change" requires one exact
  shared endpoint rule and approved tie policy.

### Negated Wording

- "Show change after entry, not MFE."
- "Do not interpolate or choose the nearest candle."

### Exclusion Wording

- "Exclude observations without the exact completed horizon close."
- Exclusions remain coverage, not zero change.

### Multi-Filter Wording

- "Show one-minute-source five-minute post-entry change for eligible long AAPL
  entries in the selected period."

### Multi-Part Question Wording

- "Show price change after entry and MFE" returns endpoint change and held-
  window extreme separately.

### Ambiguous Wording

- "After entry" lacks endpoint/horizon and may mean current price, exit,
  MFE/MAE, or post-exit path.
- "Five minutes later" needs an exact candle-close alignment contract.

### Negative Examples

These examples must not map to this concept.

- "What was the highest price after entry?" is an extrema request.
- "How much P/L did I make?" is Category 2.
- "What will price do after my next entry?" is prediction.

### Context Requirements

Require authorized account, exact accepted entry/allocation and direction,
explicit completed-close endpoint/horizon, saved source/interval/coverage, and
compatible instrument/currency/corporate-action basis.

### Required Data

- Exact `E`/entry UTC, direction, accepted allocation version, exact normalized
  completed close `C`/UTC, and continuous compatible coverage through endpoint.
- Source/version/interval/timestamp, adjustment/session, instrument/currency/
  corporate-action basis, and formula version.

### Optional Data

- Validated ticker, provenance, account-local period, and compatible grouping/
  comparison context.

### Valid Filters

- Authorized account, eligible state, instrument, direction, provenance,
  exact horizon, compatible source/interval, and account-local date range.

### Valid Groupings

- Compatible instrument, direction, horizon, interval, source, provenance and
  time groups after individual endpoint resolution.

### Valid Operators

- Exact signed change, mean/median/quantile, threshold, comparison, grouping,
  and ranking after operator approval; absolute requires explicit operator.

### Compatible Intents

- `calculate_metric`, `summarize_performance`, `compare_groups`,
  `group_and_aggregate`, `rank_results`, `analyze_trade`, `analyze_trend`,
  `explain_result`, `explain_concept`, and `inspect_data_quality`.

### Incompatible Combinations

- Missing/default/nearest/interpolated endpoint, partial/entry candle, gaps,
  mixed horizons/sources/bases, MFE/P&L substitution, prediction, cause, advice.

### Default Interpretation

No horizon default exists. With explicit covered `C`, apply long `C-E` or short
`E-C` exactly and disclose source/interval/horizon/coverage.

### Clarification Conditions

Clarify the exact later completed-close endpoint/horizon and selected entry when
not trusted. Do not ask for direction if accepted context already supplies it.

### Recommended Clarification Wording

- "Which exact completed candle-close horizon should I use after entry?"
- "Which selected entry/allocation should anchor the change?"

### Unsupported Conditions

- No exact covered completed close, missing direction/entry, gap, incompatible
  interval/source/instrument/currency/corporate-action basis, or moving-now.
- Prediction, fillability, causal quality, or advice.

### Target Analytics Tool or Query Capability

- Planned Category 10 read-only explicit-endpoint resolver over accepted entry
  and saved versioned candle closes with exact math and coverage. No named
  Chat/runtime capability exists.

### Result Units

- Exact signed directional price difference per instrument unit plus horizon,
  endpoint UTC, source, interval, formula and coverage.

### Fee Handling

- Fees are excluded. This is market-price change, not P/L or return after fees.

### Open-Trade Handling

- Version 1 defaults to eligible `ready_closed`; no live/partial/moving-now
  endpoint or generic open-state population is approved.

### Sample-Size Considerations

- Aggregates disclose horizon, observation count and endpoint/gap exclusions.
  Historical change does not prove quality, cause, prediction, or advice.

## `time_to_maximum_favourable_excursion` Language Registry

### Exact Definition

From exact entry UTC `T`, if MFE is positive select the earliest tied eligible
extreme candle by start UTC then stable source ID. For its interval `[S,F]`,
return elapsed range `[S-T,F-T]`, never a point. Zero-baseline MFE returns exact
zero at entry. Any required candle gap or missing interval end is unavailable.

### Formal Wording

- "elapsed-time range to earliest maximum favourable excursion candle"
- "entry-to-favourable-extreme candle interval under stable tie order"

### Normal Conversational Wording

- "How long until the trade reached MFE?"
- "When, within candle precision, did the best move happen?"

### Trader Slang

- "How fast did it hit the best move?"
- "Time to peak" requires direction and candle-versus-point clarification.

### Abbreviations

- `time to MFE`, `TTMFE`, and `MFE time` may map in metric context.
- `TTMFE` alone is ticker/token-like and never bypasses validation.

### Common Misspellings

- `time to max favorible excurison`
- `tme to mfe`

### Noisy or Incomplete Input

- `how long til mfe`
- `mfe when` requires selected grain/source interval.

### Singular and Plural Forms

- Singular: "the time range to MFE".
- Plural: "times to MFE" means interval ranges, not point durations.

### Full Questions

- "What elapsed range contains the earliest tied MFE candle?"
- "What was median lower-bound time to MFE under one interval contract?"

### Commands

- "Return the interval-aware time to MFE."
- "Show time-to-MFE ranges with candle interval and coverage."

### Sentence Fragments

- `time to MFE`
- `entry to earliest best-move candle`

### Follow-Up Wording

- "Give me the exact second" is unsupported from candles.
- "Use five-minute context" requires separately selected compatible evidence.

### Correction Wording

- "I meant a range to the candle, not the candle-start point."
- "Choose the earliest tie by start UTC then source ID."

### Comparison Wording

- "Compare time-to-MFE ranges only under compatible interval/grain contracts."

### Ranking Wording

- "Rank fastest time to MFE" requires an approved range-ranking convention;
  lower bounds cannot silently replace ranges.

### Negated Wording

- "Show time to MFE, not MFE size."
- "Do not invent an intrabar timestamp."

### Exclusion Wording

- "Exclude windows with candle gaps from time-to-MFE values."
- Exclusions remain coverage.

### Multi-Filter Wording

- "Show one-minute time-to-MFE ranges for eligible long AAPL allocation
  intervals in the selected period."

### Multi-Part Question Wording

- "Show MFE and time to MFE" returns price distance and elapsed range separately.

### Ambiguous Wording

- "Time to peak" may mean price peak, P/L peak, exit, or exact tick time.
- "When was MFE?" needs interval-range versus point clarification.

### Negative Examples

These examples must not map to this concept.

- "What exact second was the high?" requires tick evidence.
- "How long did I hold?" is Category 7 holding duration.
- "How quickly should winners move?" asks for advice.

### Context Requirements

Require authorized exact eligible allocation/single-entry window, direction,
entry UTC, MFE contract, saved interval/source/tie identity/coverage/basis.

### Required Data

- Exact entry UTC, eligible candle extrema/start/end UTC/stable source IDs,
  positive MFE or confirmed zero baseline, exact boundaries and accepted versions.
- Source/interval/coverage, timestamp semantics, instrument/currency/corporate-
  action/adjustment basis, and gap state.

### Optional Data

- Validated ticker, provenance, account-local display period, and explicit
  range comparison operator.

### Valid Filters

- Authorized account, eligible state, instrument, direction, provenance,
  compatible source/interval, and account-local dates.

### Valid Groupings

- Compatible grain, interval, source, instrument, direction, provenance and time
  groups after constructing each elapsed range.

### Valid Operators

- Exact range, explicit lower/upper bound, containment, approved range summary,
  comparison/grouping/ranking only with declared range semantics.

### Compatible Intents

- `calculate_metric`, `summarize_performance`, `compare_groups`,
  `group_and_aggregate`, `rank_results`, `analyze_trade`, `analyze_trend`,
  `explain_result`, `explain_concept`, and `inspect_data_quality`.

### Incompatible Combinations

- Point-time claim, arbitrary tie, candle gap, mixed intervals/grains/bases,
  candle-start-only substitution, holding-duration merge, cause, or advice.

### Default Interpretation

Return `[S-T,F-T]` for earliest tied positive-MFE candle; exact zero only when
entry remains the zero baseline. Never default to a point.

### Clarification Conditions

Clarify selected grain/interval and range-versus-exact-time wording when not in
trusted context. Exact-time requests receive the precision boundary.

### Recommended Clarification Wording

- "Candles provide a time range, not an exact instant. Should I return the
  selected candle's elapsed range?"
- "Which selected entry/allocation interval should I use?"

### Unsupported Conditions

- Missing entry/extreme interval/source ID, gaps, incompatible basis, unresolved
  tie, or request for exact intrabar time/fillability.
- Causal speed judgement, prediction, or advice.

### Target Analytics Tool or Query Capability

- Planned Category 10 read-only interval-range timing resolver over saved
  versioned candles and accepted allocation boundaries. No Chat/runtime exists.

### Result Units

- Exact non-negative elapsed-time range with raw UTC bounds/source interval;
  exact zero only for confirmed entry baseline.

### Fee Handling

- Not applicable. Fees do not change candle timing.

### Open-Trade Handling

- Unavailable in Version 1 without exact terminal held-window endpoint.

### Sample-Size Considerations

- Range aggregates need declared bound/midpoint policy and eligible counts; none
  implies significance, cause, or advice.

## `time_to_maximum_adverse_excursion` Language Registry

### Exact Definition

From exact entry UTC `T`, if MAE is positive select the earliest tied eligible
extreme candle by start UTC then stable source ID. For its interval `[S,F]`,
return elapsed range `[S-T,F-T]`, never a point. Zero-baseline MAE returns exact
zero at entry. Any required candle gap or missing interval end is unavailable.

### Formal Wording

- "elapsed-time range to earliest maximum adverse excursion candle"
- "entry-to-adverse-extreme candle interval under stable tie order"

### Normal Conversational Wording

- "How long until the trade reached MAE?"
- "When, within candle precision, did the worst move happen?"

### Trader Slang

- "How fast did the heat hit?"
- "Time to worst move" requires direction and candle-versus-point clarity.

### Abbreviations

- `time to MAE`, `TTMAE`, and `MAE time` may map in metric context.
- `TTMAE` alone is ticker/token-like and never bypasses validation.

### Common Misspellings

- `time to max advers excurison`
- `tme to mae`

### Noisy or Incomplete Input

- `how long til mae`
- `mae when` requires selected grain/source interval.

### Singular and Plural Forms

- Singular: "the time range to MAE".
- Plural: "times to MAE" means interval ranges, not point durations.

### Full Questions

- "What elapsed range contains the earliest tied MAE candle?"
- "What was median lower-bound time to MAE under one interval contract?"

### Commands

- "Return the interval-aware time to MAE."
- "Show time-to-MAE ranges with candle interval and coverage."

### Sentence Fragments

- `time to MAE`
- `entry to earliest worst-move candle`

### Follow-Up Wording

- "Give me the exact second" is unsupported from candles.
- "Use five-minute context" requires separately selected compatible evidence.

### Correction Wording

- "I meant a range to the candle, not the candle-start point."
- "Choose the earliest tie by start UTC then source ID."

### Comparison Wording

- "Compare time-to-MAE ranges only under compatible interval/grain contracts."

### Ranking Wording

- "Rank fastest time to MAE" requires an approved range-ranking convention;
  lower bounds cannot silently replace ranges.

### Negated Wording

- "Show time to MAE, not MAE size."
- "Do not invent an intrabar timestamp."

### Exclusion Wording

- "Exclude windows with candle gaps from time-to-MAE values."
- Exclusions remain coverage.

### Multi-Filter Wording

- "Show one-minute time-to-MAE ranges for eligible short TSLA allocation
  intervals in the selected period."

### Multi-Part Question Wording

- "Show MAE and time to MAE" returns price distance and elapsed range separately.

### Ambiguous Wording

- "Time to worst" may mean adverse price, P/L low, exit, or exact tick time.
- "When was MAE?" needs interval-range versus point clarification.

### Negative Examples

These examples must not map to this concept.

- "What exact second was the low?" requires tick evidence.
- "How long did I hold?" is Category 7 holding duration.
- "How quickly should I stop out?" asks for advice.

### Context Requirements

Require authorized exact eligible allocation/single-entry window, direction,
entry UTC, MAE contract, saved interval/source/tie identity/coverage/basis.

### Required Data

- Exact entry UTC, eligible candle extrema/start/end UTC/stable source IDs,
  positive MAE or confirmed zero baseline, exact boundaries and accepted versions.
- Source/interval/coverage, timestamp semantics, instrument/currency/corporate-
  action/adjustment basis, and gap state.

### Optional Data

- Validated ticker, provenance, account-local display period, and explicit
  range comparison operator.

### Valid Filters

- Authorized account, eligible state, instrument, direction, provenance,
  compatible source/interval, and account-local dates.

### Valid Groupings

- Compatible grain, interval, source, instrument, direction, provenance and time
  groups after constructing each elapsed range.

### Valid Operators

- Exact range, explicit lower/upper bound, containment, approved range summary,
  comparison/grouping/ranking only with declared range semantics.

### Compatible Intents

- `calculate_metric`, `summarize_performance`, `compare_groups`,
  `group_and_aggregate`, `rank_results`, `analyze_trade`, `analyze_trend`,
  `explain_result`, `explain_concept`, and `inspect_data_quality`.

### Incompatible Combinations

- Point-time claim, arbitrary tie, candle gap, mixed intervals/grains/bases,
  candle-start-only substitution, holding-duration merge, cause, or advice.

### Default Interpretation

Return `[S-T,F-T]` for earliest tied positive-MAE candle; exact zero only when
entry remains the zero baseline. Never default to a point.

### Clarification Conditions

Clarify selected grain/interval and range-versus-exact-time wording when not in
trusted context. Exact-time requests receive the precision boundary.

### Recommended Clarification Wording

- "Candles provide a time range, not an exact instant. Should I return the
  selected candle's elapsed range?"
- "Which selected entry/allocation interval should I use?"

### Unsupported Conditions

- Missing entry/extreme interval/source ID, gaps, incompatible basis, unresolved
  tie, or request for exact intrabar time/fillability.
- Causal speed judgement, prediction, or advice.

### Target Analytics Tool or Query Capability

- Planned Category 10 read-only interval-range timing resolver over saved
  versioned candles and accepted allocation boundaries. No Chat/runtime exists.

### Result Units

- Exact non-negative elapsed-time range with raw UTC bounds/source interval;
  exact zero only for confirmed entry baseline.

### Fee Handling

- Not applicable. Fees do not change candle timing.

### Open-Trade Handling

- Unavailable in Version 1 without exact terminal held-window endpoint.

### Sample-Size Considerations

- Range aggregates need declared bound/midpoint policy and eligible counts; none
  implies significance, cause, or advice.

## `recovery_to_entry` Language Registry

### Exact Definition

After a distinct earlier eligible adverse candle (long low `<E`; short high
`>E`), recovery is the first later completed candle with long high `>=E` or
short low `<=E`, ordered by start UTC then stable source ID. Same-candle adverse/
recovery cannot prove order. False needs complete through-exit coverage; gaps
are unavailable; no earlier adverse candle is `not_applicable`.

### Formal Wording

- "completed-candle recovery to exact entry after distinct adverse candle"
- "direction-aware first later entry-price cross interval"

### Normal Conversational Wording

- "Did price recover to my entry after moving against me?"
- "Which candle first got back to entry?"

### Trader Slang

- "Did it come back to breakeven?" means price entry, not fee-adjusted P/L.
- "Did it reclaim my entry?" maps only after a distinct adverse candle.

### Abbreviations

- `RTE`, `recovery to E`, and `back to entry` may map in context.
- `RTE` alone is acronym/ticker-like and requires validation.

### Common Misspellings

- `recovery to entery`
- `recoverd back to enrty`

### Noisy or Incomplete Input

- `did it get back entry`
- `recover after dip?` requires direction, grain, and adverse prerequisite.

### Singular and Plural Forms

- Singular: "the recovery-to-entry state/interval".
- Plural: "recoveries to entry" means eligible state-labelled observations.

### Full Questions

- "Did this long recover to entry after a distinct adverse candle?"
- "Show recovery-to-entry rates with false/unavailable coverage separated."

### Commands

- "Find the first completed recovery candle after adverse excursion."
- "Show recovery state with interval and coverage."

### Sentence Fragments

- `recovery to entry`
- `first later candle back to E`

### Follow-Up Wording

- "What exact second?" is unsupported; true identifies a candle interval.
- "Count same-candle dips" is rejected because sequence is unknown.

### Correction Wording

- "I meant price recovery, not fee-adjusted breakeven."
- "Require a distinct earlier adverse candle."

### Comparison Wording

- "Compare recovery-to-entry true rates only with false, not-applicable, and
  unavailable denominators explicitly declared."

### Ranking Wording

- "Rank tickers by recovery rate" requires approved eligible denominator and
  keeps gaps/not-applicable separate.

### Negated Wording

- "Show recovery, not final outcome."
- "Do not infer adverse then recovery inside one candle."

### Exclusion Wording

- "Exclude not-applicable no-adverse cases from the recovery-rate denominator."
- Gaps remain unavailable coverage, not false.

### Multi-Filter Wording

- "Show one-minute recovery-to-entry states for eligible long AAPL intervals in
  the selected period."

### Multi-Part Question Wording

- "Show MAE and whether price recovered to entry" returns excursion and recovery
  state separately.

### Ambiguous Wording

- "Breakeven recovery" may mean price entry, fees-included P/L zero, or final
  realized outcome.
- "Recovered" may mean intrabar touch, completed close, high/low cross, or exit.

### Negative Examples

These examples must not map to this concept.

- "Did the trade finish profitable?" is outcome/P&L.
- "Did one candle dip and recover?" cannot establish order from OHLC.
- "Should I wait for recovery next time?" asks for advice.

### Context Requirements

Require authorized exact eligible allocation/single-entry window, direction,
entry `E`, exact exit, and complete compatible saved candle sequence/coverage.

### Required Data

- Exact entry/exit boundaries, direction, accepted versions, eligible candle
  highs/lows/start/end/source IDs, distinct adverse prerequisite and gap state.
- Source/version/interval/timestamp, instrument/currency/corporate-action/
  adjustment basis and coverage through exit.

### Optional Data

- Validated ticker, provenance, account-local dates, and explicit recovery-rate
  denominator excluding `not_applicable`/`unavailable` as declared.

### Valid Filters

- Authorized account, eligible state, instrument, direction, provenance,
  compatible source/interval, recovery state, and account-local dates.

### Valid Groupings

- Compatible instrument, direction, source, interval, provenance and time groups
  after per-window state construction.

### Valid Operators

- Exact state, true-rate with declared eligible denominator, threshold,
  comparison, grouping and ranking after operator approval.

### Compatible Intents

- `calculate_metric`, `summarize_performance`, `compare_groups`,
  `group_and_aggregate`, `rank_results`, `analyze_trade`, `analyze_sequence`,
  `analyze_trend`, `explain_result`, `explain_concept`, and
  `inspect_data_quality`.

### Incompatible Combinations

- Same-candle order, false across gap/incomplete exit, no-adverse as false,
  fee-breakeven/final-outcome substitution, exact crossing time, cause, advice.

### Default Interpretation

Use distinct earlier adverse then first later direction-aware high/low cross.
Return true interval, false only with complete coverage, `not_applicable` without
adverse prerequisite, or unavailable for gaps.

### Clarification Conditions

Clarify price-entry versus fee-adjusted breakeven and selected grain when not
trusted. Same-candle requests receive the sequence limitation.

### Recommended Clarification Wording

- "Do you mean recovery to the exact entry price or fee-adjusted P/L breakeven?"
- "Which selected entry/allocation interval should I use?"

### Unsupported Conditions

- Same-candle adverse/recovery only, missing direction/boundaries, gap,
  incomplete through-exit coverage for false, or incompatible source/basis.
- Exact intrabar crossing time, causal conclusion, prediction, or advice.

### Target Analytics Tool or Query Capability

- Planned Category 10 read-only ordered-candle state resolver over accepted
  boundaries and saved versioned candles with explicit coverage. No Chat/runtime.

### Result Units

- `true`, `false`, `not_applicable`, or `unavailable`; true includes selected
  candle UTC interval/source interval, never point time.

### Fee Handling

- Fees are excluded; exact entry price is not fee-adjusted breakeven.

### Open-Trade Handling

- Unavailable in Version 1 because false requires complete coverage through an
  exact terminal endpoint.

### Sample-Size Considerations

- Rates disclose true/false denominator, not-applicable cases, gaps/unavailable,
  grain and interval. They do not establish behaviour, cause, or advice.

## `post_exit_continuation` Language Registry

### Exact Definition

For exact accepted exit price `X`, direction, and an explicit supported horizon,
resolve the exact fully completed compatible candle close `C_h`. Long is
`C_h-X`; short is `X-C_h`. Positive continues in the former trade direction.
No horizon defaults; exclude the exit candle and require complete source/
interval coverage. No partial/nearest candle or interpolation.

### Formal Wording

- "directional exact-exit-to-explicit-horizon completed-close change"
- "post-exit continuation under declared candle source and horizon"

### Normal Conversational Wording

- "How far did price continue after my exit?"
- "What happened 15 minutes after I got out?"

### Trader Slang

- "How much more did it run after I sold?" is long-direction context only.
- "Did it keep flushing after my cover?" uses short-direction math.

### Abbreviations

- `post-exit cont`, `PEC`, and `after-exit move` may map in context.
- `PEC` alone is ticker/token-like and never supplies horizon or direction.

### Common Misspellings

- `post exit contination`
- `price contiuation after exut`

### Noisy or Incomplete Input

- `move after out 15m`
- `after exit keep going?` requires exact exit, direction, and horizon.

### Singular and Plural Forms

- Singular: "the post-exit continuation at this horizon".
- Plural: "post-exit continuations" means horizon-specific observations, not
  one merged path.

### Full Questions

- "What was long directional change at the exact 15-minute post-exit close?"
- "Compare 30-minute post-exit continuation with complete candle coverage."

### Commands

- "Calculate continuation to the selected completed post-exit close."
- "Show 5/15/30/60-minute observations separately."

### Sentence Fragments

- `post-exit continuation, 15m`
- `exact exit to completed horizon close`

### Follow-Up Wording

- "What about 60 minutes?" changes to that explicit supported horizon only.
- "Use nearest candle" is rejected.

### Correction Wording

- "I meant after-exit movement, not giveback before exit."
- "For a short, use exit minus later close."

### Comparison Wording

- "Compare post-exit continuation only at the same horizon, direction formula,
  source, interval, and price basis."

### Ranking Wording

- "Rank eligible exits by 30-minute directional continuation" requires complete
  shared-horizon coverage and approved ties.

### Negated Wording

- "Show continuation, not missed profit."
- "Do not interpolate or use the exit-containing candle."

### Exclusion Wording

- "Exclude exits without the exact completed horizon close."
- Exclusions remain coverage, not zero continuation.

### Multi-Filter Wording

- "Show 15-minute post-exit continuation for eligible long AAPL final exits in
  the selected period."

### Multi-Part Question Wording

- "Show giveback before exit and 15-minute continuation after exit" returns two
  separately bounded metrics.

### Ambiguous Wording

- "Continuation" may mean after entry, after partial exit, after final exit,
  predicted trend, or candle-pattern continuation.
- "After exit" lacks horizon and exact reducing/final-exit grain.

### Negative Examples

These examples must not map to this concept.

- "How much profit did I leave?" asks for counterfactual P/L.
- "Will it keep running after my next exit?" is prediction.
- "Should I have held longer?" asks for advice/regret judgement.

### Context Requirements

Require authorized account, exact accepted reducing/final-exit boundary,
direction, explicit supported horizon, exact completed close, and compatible
source/version/interval/coverage/instrument/currency/corporate-action basis.

### Required Data

- Exact exit price/time/direction and accepted allocation/lifecycle version.
- Exact horizon close/time, fully completed post-exit candles, source/version/
  interval/timestamp, complete coverage, adjustment/session and price basis.

### Optional Data

- Validated ticker, provenance, account-local period, exit role, and compatible
  grouping/comparison context.

### Valid Filters

- Authorized account, eligible `ready_closed`, instrument, direction,
  reducing/final-exit role, provenance, explicit horizon, source/interval/date.

### Valid Groupings

- Compatible instrument, direction, exit role, horizon, interval, source,
  provenance, and time groups after exact endpoint resolution.

### Valid Operators

- Exact signed change, explicit absolute value, mean/median/quantile, threshold,
  comparison, grouping, and ranking after operator approval.

### Compatible Intents

- `calculate_metric`, `summarize_performance`, `compare_groups`,
  `group_and_aggregate`, `rank_results`, `analyze_trade`, `analyze_trend`,
  `explain_result`, `explain_concept`, and `inspect_data_quality`.

### Incompatible Combinations

- Default/missing horizon, nearest/interpolated/partial candle, exit candle,
  gaps, mixed horizons/bases, giveback/counterfactual P/L substitution,
  prediction, cause, regret, or advice.

### Default Interpretation

No horizon default exists. With an explicit supported covered horizon, return
long `C_h-X` or short `X-C_h` and disclose exact endpoint/source/coverage.

### Clarification Conditions

Clarify exact exit grain and horizon when not supplied by trusted context. Do
not combine partial and final exits or choose 5/15/30/60 minutes silently.

### Recommended Clarification Wording

- "Which exact exit and post-exit horizon should I use: 5, 15, 30, or 60
  minutes?"

### Unsupported Conditions

- Missing exact exit/direction/horizon close, incomplete coverage, gap, partial/
  nearest/interpolated candle, or incompatible source/interval/basis.
- Counterfactual profit, prediction, fillability, causation, regret, or advice.

### Target Analytics Tool or Query Capability

- Planned Category 10 read-only explicit-horizon resolver over accepted exit and
  saved versioned completed candles with exact math/coverage. No Chat/runtime.

### Result Units

- Exact signed directional price difference per unit plus horizon, endpoint UTC,
  source, interval, formula version and coverage.

### Fee Handling

- Fees are excluded. This is not realized or hypothetical fee-adjusted P/L.

### Open-Trade Handling

- Requires an exact accepted reducing/final-exit event in an eligible
  `ready_closed` lifecycle; no hypothetical exit is invented.

### Sample-Size Considerations

- Aggregates disclose exact horizon, exit/observation counts and coverage gaps.
  Later movement does not prove exit quality, cause, prediction, or advice.

## `stop_distance` Language Registry

### Exact Definition

`stop_distance` is `Unavailable`. A future exact signed distance requires
reference price `R` and explicitly trader-recorded stop `S`, with accepted plan
version effective for the selected lifecycle/event: long `R-S`, short `S-R`.
Preserve zero/negative values. Non-negative absolute distance is `abs(D)` only
when explicitly requested; it never replaces the signed canonical result.

### Formal Wording

- "signed direction-aware distance to effective trader-recorded stop"
- "reference-price minus/plus versioned stop-level distance by direction"

### Normal Conversational Wording

- "How far was my planned stop from entry?"
- "What was the stop distance for this trade plan?"

### Trader Slang

- "How wide was my stop?" may ask for non-negative absolute distance.
- "How much room did I give it?" requires explicit trader plan/reference.

### Abbreviations

- `stop dist`, `SD`, and `risk-to-stop` may identify the concept in context.
- `SD` alone is ambiguous/ticker-like and never creates a stop fact.

### Common Misspellings

- `stop distnce`
- `planned stp diference`

### Noisy or Incomplete Input

- `stop distance this trade`
- `how wide stop` remains unavailable without accepted plan level/version.

### Singular and Plural Forms

- Singular: "the stop distance for the effective plan version".
- Plural: "stop distances" cannot mix plan versions/reference conventions.

### Full Questions

- "What was signed stop distance from the declared entry reference?"
- "Show absolute stop width" would require explicit `abs(D)` and accepted data.

### Commands

- "Calculate stop distance" returns the missing structured-plan boundary.
- "Use my recorded stop version" requires an accepted effective lifecycle link.

### Sentence Fragments

- `planned stop distance`
- `entry to effective stop level`

### Follow-Up Wording

- "Use the broker stop order" is rejected unless separately accepted as the
  trader-recorded plan fact; order existence does not prove intent.
- "Make it positive" changes to explicit absolute operator, not clamping.

### Correction Wording

- "I meant my recorded planned stop, not MAE."
- "Preserve signed distance; show absolute width separately."

### Comparison Wording

- "Compare stop distances" remains unavailable until compatible effective plan
  levels/reference conventions exist.

### Ranking Wording

- "Rank widest stops" is unavailable; a future ranking must explicitly use
  absolute distance and compatible instruments/price bases.

### Negated Wording

- "Show stop distance, not maximum adverse move."
- "Do not infer a stop from support or later candles."

### Exclusion Wording

- "Exclude amended stops" is invalid without an effective-version rule; no plan
  version is silently discarded.

### Multi-Filter Wording

- "Stop distance for long AAPL plans last month" remains unavailable without
  accepted structured stop/reference/effective-version facts.

### Multi-Part Question Wording

- "Show MAE and stop distance" returns MAE when covered and a separate
  unavailable stop-distance state.

### Ambiguous Wording

- "Stop" may mean trader plan, broker order, rule threshold, actual exit, chart
  support, trailing stop, or advice.
- "Distance" may mean signed, absolute, percentage, or currency risk.

### Negative Examples

These examples must not map to this concept.

- "Use the candle low as my stop" invents a plan fact.
- "Where should my stop be?" asks for advice.
- "What was MAE?" is candle adverse excursion.

### Context Requirements

Require authorized lifecycle/reference event and accepted trader-recorded stop,
plan version/effective time/lifecycle binding, direction, reference price, and
compatible instrument/currency/corporate-action basis. These are absent now.

### Required Data

- Not currently satisfied: exact `R`, trader-recorded `S`, direction, stable
  plan version, effective lifecycle/event, amendment precedence and provenance.
- Authorized scope, instrument/currency/price basis and privacy-safe read.

### Optional Data

- Explicit signed/absolute/percentage output, validated ticker, account-local
  period, and plan-label context; none activates the unavailable capability.

### Valid Filters

- None executable while unavailable. Future filters require authorized account,
  effective plan version, lifecycle, instrument, direction and date.

### Valid Groupings

- None approved. Future grouping requires compatible reference convention,
  instrument/currency/basis and effective plan version.

### Valid Operators

- None executable now. Future signed exact distance is canonical; `abs(D)` is an
  explicit non-negative operator; percentage requires strictly positive `R`.

### Compatible Intents

- `calculate_metric`, `compare_groups`, `group_and_aggregate`, `rank_results`,
  `analyze_trade`, `explain_result`, `explain_concept`, and
  `inspect_data_quality` may return the explicit unavailable boundary.

### Incompatible Combinations

- Inference from orders/candles/levels/rules, later-version lookahead, missing
  effective lifecycle/reference, clamping signed distance, MAE/risk/P&L
  substitution, prediction, causation, or advice.

### Default Interpretation

No numeric default exists. Return `Unavailable` because the structured effective
trader-stop fact is absent; never infer `S` or choose signed versus absolute
silently.

### Clarification Conditions

Clarify only to distinguish recorded stop versus order/level/rule and signed
versus absolute output; clarification cannot create absent accepted data.

### Recommended Clarification Wording

- "Do you mean an explicitly recorded trade-plan stop, a broker order, or a
  chart/rule level?"
- "If plan data becomes available, do you want signed distance or absolute
  non-negative width?"

### Unsupported Conditions

- All numeric Version 1 requests; missing accepted stop/reference/version/
  lifecycle, inferred order/candle/level/rule stop, or incompatible basis.
- Stop placement, prediction, causal discipline, or advice.

### Target Analytics Tool or Query Capability

- Unavailable Category 10 target pending an approved privacy-safe versioned
  trader-plan read contract. No Chat/runtime, broker-order, or candle fallback.

### Result Units

- Unavailable. Future signed price difference per unit; optional explicit
  absolute distance or percentage with positive `R`, plus plan/basis metadata.

### Fee Handling

- Not applicable. Fees do not define planned stop level/reference distance.

### Open-Trade Handling

- Unavailable for open and closed lifecycles until effective plan/version and
  lifecycle-binding contracts exist.

### Sample-Size Considerations

- Future aggregates disclose plan-version coverage and compatible reference
  convention. No missing plan becomes zero; no association proves discipline or
  advice.

## `target_distance` Language Registry

### Exact Definition

`target_distance` is `Unavailable`. A future exact signed distance requires
reference price `R` and explicitly trader-recorded target `Q`, with accepted
plan version effective for the selected lifecycle/event: long `Q-R`, short
`R-Q`. Preserve zero/negative values. Non-negative absolute distance is
`abs(D)` only when explicitly requested; it never replaces signed canonical.

### Formal Wording

- "signed direction-aware distance to effective trader-recorded target"
- "versioned target-level directional distance from declared reference price"

### Normal Conversational Wording

- "How far was my planned target from entry?"
- "What was the target distance for this trade plan?"

### Trader Slang

- "How much room to my target?" may ask for non-negative absolute distance.
- "What was my planned upside?" requires explicit target/reference/direction.

### Abbreviations

- `target dist`, `TD`, and `reward-to-target` may identify the concept in context.
- `TD` alone is ambiguous/ticker-like and never creates a target fact.

### Common Misspellings

- `target distnce`
- `planned targt diference`

### Noisy or Incomplete Input

- `target distance this trade`
- `how far target` remains unavailable without accepted plan level/version.

### Singular and Plural Forms

- Singular: "the target distance for the effective plan version".
- Plural: "target distances" cannot mix plan versions/reference conventions.

### Full Questions

- "What was signed target distance from the declared entry reference?"
- "Show absolute target distance" would require explicit `abs(D)` and data.

### Commands

- "Calculate target distance" returns the missing structured-plan boundary.
- "Use my recorded target version" requires accepted effective lifecycle link.

### Sentence Fragments

- `planned target distance`
- `entry to effective target level`

### Follow-Up Wording

- "Use the sell-limit order" is rejected unless separately accepted as the
  trader-recorded plan fact; order existence does not prove intent.
- "Make it positive" changes to explicit absolute operator, not clamping.

### Correction Wording

- "I meant my recorded planned target, not MFE."
- "Preserve signed distance; show absolute distance separately."

### Comparison Wording

- "Compare target distances" remains unavailable until compatible effective
  plan levels/reference conventions exist.

### Ranking Wording

- "Rank farthest targets" is unavailable; future ranking must explicitly use
  signed or absolute distance and compatible bases.

### Negated Wording

- "Show target distance, not maximum favourable move."
- "Do not infer a target from resistance or later candles."

### Exclusion Wording

- "Exclude amended targets" is invalid without an effective-version rule; no
  plan version is silently discarded.

### Multi-Filter Wording

- "Target distance for long AAPL plans last month" remains unavailable without
  accepted structured target/reference/effective-version facts.

### Multi-Part Question Wording

- "Show MFE and target distance" returns MFE when covered and a separate
  unavailable target-distance state.

### Ambiguous Wording

- "Target" may mean trader plan, broker order, rule threshold, chart resistance,
  realized exit, prediction, or advice.
- "Distance" may mean signed, absolute, percentage, or currency reward.

### Negative Examples

These examples must not map to this concept.

- "Use the candle high as my target" invents a plan fact.
- "Where should my target be?" asks for advice.
- "What was MFE?" is candle favourable excursion.

### Context Requirements

Require authorized lifecycle/reference event and accepted trader-recorded target,
plan version/effective time/lifecycle binding, direction, reference price, and
compatible instrument/currency/corporate-action basis. These are absent now.

### Required Data

- Not currently satisfied: exact `R`, trader-recorded `Q`, direction, stable
  plan version, effective lifecycle/event, amendment precedence and provenance.
- Authorized scope, instrument/currency/price basis and privacy-safe read.

### Optional Data

- Explicit signed/absolute/percentage output, validated ticker, account-local
  period, and plan-label context; none activates the unavailable capability.

### Valid Filters

- None executable while unavailable. Future filters require authorized account,
  effective plan version, lifecycle, instrument, direction and date.

### Valid Groupings

- None approved. Future grouping requires compatible reference convention,
  instrument/currency/basis and effective plan version.

### Valid Operators

- None executable now. Future signed exact distance is canonical; `abs(D)` is an
  explicit non-negative operator; percentage requires strictly positive `R`.

### Compatible Intents

- `calculate_metric`, `compare_groups`, `group_and_aggregate`, `rank_results`,
  `analyze_trade`, `explain_result`, `explain_concept`, and
  `inspect_data_quality` may return the explicit unavailable boundary.

### Incompatible Combinations

- Inference from orders/candles/levels/rules, later-version lookahead, missing
  effective lifecycle/reference, clamping signed distance, MFE/reward/P&L
  substitution, prediction, causation, or advice.

### Default Interpretation

No numeric default exists. Return `Unavailable` because the structured effective
trader-target fact is absent; never infer `Q` or choose signed versus absolute
silently.

### Clarification Conditions

Clarify only to distinguish recorded target versus order/level/rule and signed
versus absolute output; clarification cannot create absent accepted data.

### Recommended Clarification Wording

- "Do you mean an explicitly recorded trade-plan target, a broker order, or a
  chart/rule level?"
- "If plan data becomes available, do you want signed distance or absolute
  non-negative distance?"

### Unsupported Conditions

- All numeric Version 1 requests; missing accepted target/reference/version/
  lifecycle, inferred order/candle/level/rule target, or incompatible basis.
- Target placement, prediction, causal discipline, or advice.

### Target Analytics Tool or Query Capability

- Unavailable Category 10 target pending an approved privacy-safe versioned
  trader-plan read contract. No Chat/runtime, broker-order, or candle fallback.

### Result Units

- Unavailable. Future signed price difference per unit; optional explicit
  absolute distance or percentage with positive `R`, plus plan/basis metadata.

### Fee Handling

- Not applicable. Fees do not define planned target level/reference distance.

### Open-Trade Handling

- Unavailable for open and closed lifecycles until effective plan/version and
  lifecycle-binding contracts exist.

### Sample-Size Considerations

- Future aggregates disclose plan-version coverage and compatible reference
  convention. No missing plan becomes zero; no association proves discipline or
  advice.

# 7. Evaluation Cases Deliverable

All eighteen Section 6 registries independently passed and are controller
accepted for evaluation-case drafting. Evaluation Batches 1-6 contain all 396
reviewed and passed cases for `mfe`, `mae`, `profit_giveback`,
`maximum_favourable_price`, `maximum_adverse_price`, and
`percentage_of_available_move_captured`, `entry_distance_from_vwap`,
`entry_distance_from_high_of_day`, `entry_distance_from_low_of_day`,
`volume_at_entry`, `relative_volume`, `price_change_after_entry`,
`time_to_maximum_favourable_excursion`,
`time_to_maximum_adverse_excursion`, `recovery_to_entry`,
`post_exit_continuation`, `stop_distance`, and `target_distance`. All C10-E11,
C10-E17, and C10-E18 cases retain `Unavailable`; the other arrays retain
`Planned`. Comprehensive independent Terra review passed all 396 cases with
zero failures, and the controller accepted the evaluation review gate. All
canonical names and registries are approved and locked at Version 1; no runtime
or AI Chat capability is claimed.

## 7.1 Evaluation Case Schema and Type Coverage

Every object below uses the locked 21-key schema and the ordered required case
types: `canonical`, `formal_paraphrase`, `conversational_paraphrase`,
`trader_slang`, `abbreviation`, `misspelling`, `noisy_input`, `command`,
`fragment`, `follow_up`, `correction`, `comparison`, `ranking`, `negation`,
`exclusion`, `multi_filter`, `multi_part`, `ambiguous`, `negative_example`,
`unsupported_data`, `selected_entity_context`, and `cross_category`.
`expectedPrimaryIntent` and ordered `expectedSecondaryIntents` use only locked
Category 1 names. Empty arrays and `null` values are explicit; protected actions
are never implied.

| Case type | Required | Saved | Reviewed | Passed | Notes |
|---|---:|---:|---:|---:|---|
| Each of the 22 ordered types | 18 | 18 | 18 | 18 | One case per type appears in every C10-E1 through C10-E18 array and passed review. |
| Total | 396 | 396 | 396 | 396 | Comprehensive independent Terra review passed; zero failed. |

## 7.2 `mfe` Cases

```json
[
{"caseId":"C10-E1-01","caseType":"canonical","input":"Show candle MFE for the selected long lifecycle.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["mfe"],"expectedFilters":["trusted selected ready_closed single-entry lifecycle","long"],"expectedGroupings":[],"expectedOperators":["max(0,H-E)"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected lifecycle","expectedContextRequirements":["server-authoritative account scope","exact entry and final exit","compatible saved candle source/version/interval","complete held-window coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Long candle MFE is entry-zero-baseline max(0,H-E); disclose approximation, interval, source, coverage, instrument/currency and price basis."},
{"caseId":"C10-E1-02","caseType":"formal_paraphrase","input":"Determine the non-negative short maximum favourable excursion for the selected covered allocation interval.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["mfe"],"expectedFilters":["trusted selected accepted allocation interval","short"],"expectedGroupings":[],"expectedOperators":["max(0,E-L)"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected allocation interval","expectedContextRequirements":["exact accepted entry price/time","exact matched reducing allocation boundary","eligible wholly-after-entry and wholly-before-exit candles","compatible source/version/interval/coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Short MFE uses max(0,E-L) for one exact accepted allocation grain and never mixes intervals."},
{"caseId":"C10-E1-03","caseType":"conversational_paraphrase","input":"How far did the selected long trade move my way on the saved candles?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["mfe"],"expectedFilters":["trusted selected ready_closed single-entry lifecycle","long"],"expectedGroupings":[],"expectedOperators":["max(0,H-E)"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected lifecycle","expectedContextRequirements":["exact entry/exit boundaries","declared saved candle interval and source","complete compatible coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Conversational favourable-move wording maps to candle approximation, not tick truth, exact sequence or fillability."},
{"caseId":"C10-E1-04","caseType":"trader_slang","input":"What was the best push on that selected short, candle MFE only?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["mfe"],"expectedFilters":["trusted selected short interval"],"expectedGroupings":[],"expectedOperators":["max(0,E-L)"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected allocation or eligible lifecycle","expectedContextRequirements":["exact grain","exact entry/exit","compatible candle coverage and basis"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Best push is direction-aware slang; result remains a non-negative per-unit candle distance with coverage metadata."},
{"caseId":"C10-E1-05","caseType":"abbreviation","input":"MFE metric for the selected AMD trade, using its declared candle interval.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["mfe"],"expectedFilters":["trusted selected AMD lifecycle"],"expectedGroupings":[],"expectedOperators":["direction-aware entry-zero-baseline MFE"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected AMD lifecycle","expectedContextRequirements":["explicit MFE metric grammar","validated AMD symbol","exact direction/grain/boundaries","compatible saved candle coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Explicit metric grammar distinguishes MFE from a ticker-like token; no bare acronym auto-routing."},
{"caseId":"C10-E1-06","caseType":"misspelling","input":"Show max favurable excursion for the selected covered trade.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["mfe"],"expectedFilters":["trusted selected eligible lifecycle"],"expectedGroupings":[],"expectedOperators":["direction-aware entry-zero-baseline MFE"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected lifecycle","expectedContextRequirements":["clear metric context","exact direction/grain","compatible saved candle source/interval/coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Normalize the clear misspelling without inventing direction, dates, candles or a combined-trade reference price."},
{"caseId":"C10-E1-07","caseType":"noisy_input","input":"mfe selected long candles interval pls","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["mfe"],"expectedFilters":["trusted selected long lifecycle"],"expectedGroupings":[],"expectedOperators":["max(0,H-E)"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected lifecycle","expectedContextRequirements":["exact entry/exit","declared interval/source","complete compatible coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Noise does not create a date, provider, interval, quote, candle or private identifier."},
{"caseId":"C10-E1-08","caseType":"command","input":"Calculate long MFE from the selected exact entry and eligible saved candles.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["mfe"],"expectedFilters":["trusted selected long grain"],"expectedGroupings":[],"expectedOperators":["max(0,H-E)"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected allocation or eligible lifecycle","expectedContextRequirements":["exact entry and terminal exit","eligible candles wholly between boundaries","source/version/interval/coverage","compatible corporate-action and price basis"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Read-only calculation excludes entry- and exit-containing candle extrema because their intrabar sequence is unknown."},
{"caseId":"C10-E1-09","caseType":"fragment","input":"Selected short candle MFE, covered interval.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["mfe"],"expectedFilters":["trusted selected short grain"],"expectedGroupings":[],"expectedOperators":["max(0,E-L)"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected allocation or eligible lifecycle","expectedContextRequirements":["exact E and L","exact exit boundary","compatible saved candle coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Fragment preserves short direction and the zero baseline; no favourable move returns exact zero at entry."},
{"caseId":"C10-E1-10","caseType":"follow_up","input":"Now show its MFE with that same saved source and interval.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["mfe"],"expectedFilters":["prior trusted selected grain","prior declared source and interval"],"expectedGroupings":[],"expectedOperators":["direction-aware entry-zero-baseline MFE"],"expectedComparison":null,"expectedTimeRange":"prior trusted scope","expectedSelectedEntity":"prior trusted selected grain","expectedContextRequirements":["trusted prior account/grain/direction","unchanged source/version/interval/basis","complete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Follow-up may reuse trusted context only; it never invents missing context or broadens account scope."},
{"caseId":"C10-E1-11","caseType":"correction","input":"I meant candle MFE, not an exact tick-level favourable sequence.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["mfe"],"expectedFilters":["prior trusted selected grain","candle basis"],"expectedGroupings":[],"expectedOperators":["direction-aware entry-zero-baseline MFE","basis correction"],"expectedComparison":null,"expectedTimeRange":"prior trusted scope","expectedSelectedEntity":"prior trusted selected grain","expectedContextRequirements":["trusted prior context","declared candle interval/source/coverage","exact entry/exit boundaries"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Correction explicitly retains the candle approximation and rejects tick truth or intrabar order claims."},
{"caseId":"C10-E1-12","caseType":"comparison","input":"Compare candle MFE for the two selected compatible closed lifecycles.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["mfe"],"expectedFilters":["two trusted selected ready_closed single-entry lifecycles"],"expectedGroupings":[],"expectedOperators":["calculate each direction-aware MFE separately","comparison"],"expectedComparison":{"left":"selected lifecycle A","right":"selected lifecycle B","basis":"compatible candle MFE"},"expectedTimeRange":null,"expectedSelectedEntity":"two trusted selected lifecycles","expectedContextRequirements":["same compatible interval/source/basis","exact boundaries and direction per lifecycle","complete coverage per lifecycle","server-authoritative account scope"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Comparison never mixes intervals, currencies, corporate-action bases or allocation and lifecycle grains."},
{"caseId":"C10-E1-13","caseType":"ranking","input":"Rank the selected compatible closed lifecycles by candle MFE.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["mfe"],"expectedFilters":["trusted selected compatible ready_closed single-entry lifecycles"],"expectedGroupings":[],"expectedOperators":["direction-aware MFE per lifecycle","descending rank"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected lifecycle set","expectedContextRequirements":["compatible source/interval/instrument/currency/basis","complete coverage per lifecycle","approved deterministic tie policy","account scope"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ranking retains per-observation coverage and is descriptive, not a recommendation or quality score."},
{"caseId":"C10-E1-14","caseType":"negation","input":"Show candle MFE for the selected trade, not tick-true maximum or sequence.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["mfe"],"expectedFilters":["trusted selected eligible grain","exclude tick-truth interpretation"],"expectedGroupings":[],"expectedOperators":["direction-aware entry-zero-baseline MFE"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected grain","expectedContextRequirements":["declared candle source/version/interval","complete coverage","exact boundaries/direction"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"A candle high/low is an interval extreme and cannot establish exact intrabar sequence, executable quote or tick truth."},
{"caseId":"C10-E1-15","caseType":"exclusion","input":"Show MFE for selected lifecycles excluding any with candle coverage gaps.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["mfe"],"expectedFilters":["trusted selected compatible lifecycles","exclude incomplete coverage"],"expectedGroupings":[],"expectedOperators":["direction-aware MFE","coverage exclusion"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected lifecycle set","expectedContextRequirements":["gap detection","compatible interval/source/basis","account scope"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Excluded gaps remain visible coverage counts and are never converted to zero or filled with invented candles."},
{"caseId":"C10-E1-16","caseType":"multi_filter","input":"Show one-minute candle MFE for selected ready-closed long NVDA lifecycles with complete saved-source coverage.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["mfe"],"expectedFilters":["trusted selected ready_closed single-entry lifecycles","long","NVDA","one-minute","complete coverage"],"expectedGroupings":[],"expectedOperators":["max(0,H-E)"],"expectedComparison":null,"expectedTimeRange":"trusted selected scope","expectedSelectedEntity":"trusted selected lifecycle set","expectedContextRequirements":["validated NVDA symbol","exact entry/final-exit per lifecycle","declared saved source/version","compatible corporate-action/currency basis","account IANA/session metadata"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"One-minute is explicit, not a default; filters cannot manufacture candles or expand private account scope."},
{"caseId":"C10-E1-17","caseType":"multi_part","input":"Show candle MFE and MAE for the selected covered long lifecycle.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["mfe","mae"],"expectedFilters":["trusted selected ready_closed single-entry lifecycle","long"],"expectedGroupings":[],"expectedOperators":["max(0,H-E)","max(0,E-L)"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected lifecycle","expectedContextRequirements":["same declared grain/window/basis","exact entry/exit","compatible saved candle coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Return two separate interval-extreme distances; their candles do not reveal which extreme occurred first."},
{"caseId":"C10-E1-18","caseType":"ambiguous","input":"MFE?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["mfe"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["metric-versus-symbol disambiguation","selected grain/direction","declared candle source/interval/coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Do you mean maximum favourable excursion for a selected trade, or MFE as a symbol/token?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Bare acronym is ticker-like and supplies no private trade, direction, date, interval or candle context."},
{"caseId":"C10-E1-19","caseType":"negative_example","input":"Will a larger MFE predict that my next trade will win?","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["mfe"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no prediction or advice"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Historical candle MFE cannot predict a future trade outcome or provide trading advice.","notes":"Reject prediction while preserving the factual historical metric boundary."},
{"caseId":"C10-E1-20","caseType":"unsupported_data","input":"Calculate MFE for this combined multi-entry trade despite a gap in the saved candles.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["mfe"],"expectedFilters":["combined multi-entry trade","candle coverage gap"],"expectedGroupings":[],"expectedOperators":["direction-aware entry-zero-baseline MFE"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected combined trade","expectedContextRequirements":["approved multi-entry reference-price and partial-exit weighting contract","complete compatible candle coverage","exact allocation graph"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Combined multi-entry MFE is unavailable without an approved reference-price/allocation contract, and a candle gap independently makes the held-window result unavailable.","notes":"Never use first or weighted entry silently, mix allocation intervals, interpolate the gap or invent candles."},
{"caseId":"C10-E1-21","caseType":"selected_entity_context","input":"Show candle MFE for the lifecycle selected in Candle Review.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["mfe"],"expectedFilters":["trusted selected Candle Review lifecycle"],"expectedGroupings":[],"expectedOperators":["direction-aware entry-zero-baseline MFE"],"expectedComparison":null,"expectedTimeRange":"selected lifecycle held window","expectedSelectedEntity":"trusted server-authorized Candle Review lifecycle","expectedContextRequirements":["server-authoritative account scope","exact selected grain/direction/boundaries","saved source/version/interval/coverage","privacy-safe output"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Trusted selection cannot expose another account or replace missing exact facts with UI text."},
{"caseId":"C10-E1-22","caseType":"cross_category","input":"Explain the selected trade's candle MFE beside its gross realized profit without claiming why it happened.","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["mfe","gross_profit"],"expectedFilters":["trusted selected ready_closed lifecycle","gross P/L basis"],"expectedGroupings":[],"expectedOperators":["direction-aware candle MFE","separate gross-profit fact","evidence-grounded description"],"expectedComparison":null,"expectedTimeRange":"selected lifecycle held window","expectedSelectedEntity":"trusted selected lifecycle","expectedContextRequirements":["Category 10 candle source/interval/coverage","Category 2 realized gross result basis","no causation or advice","account scope"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Describe separate facts only; MFE does not cause gross realized profit or prove trade quality."}
]
```

## 7.3 `mae` Cases

```json
[
{"caseId":"C10-E2-01","caseType":"canonical","input":"Show candle MAE for the selected long lifecycle.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["mae"],"expectedFilters":["trusted selected ready_closed single-entry lifecycle","long"],"expectedGroupings":[],"expectedOperators":["max(0,E-L)"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected lifecycle","expectedContextRequirements":["server-authoritative account scope","exact entry and final exit","compatible saved candle source/version/interval","complete held-window coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Long candle MAE is entry-zero-baseline max(0,E-L); disclose approximation, interval, source, coverage, instrument/currency and price basis."},
{"caseId":"C10-E2-02","caseType":"formal_paraphrase","input":"Determine the non-negative short maximum adverse excursion for the selected covered allocation interval.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["mae"],"expectedFilters":["trusted selected accepted allocation interval","short"],"expectedGroupings":[],"expectedOperators":["max(0,H-E)"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected allocation interval","expectedContextRequirements":["exact accepted entry price/time","exact matched reducing allocation boundary","eligible wholly-after-entry and wholly-before-exit candles","compatible source/version/interval/coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Short MAE uses max(0,H-E) for one exact accepted allocation grain and never mixes intervals."},
{"caseId":"C10-E2-03","caseType":"conversational_paraphrase","input":"How far did the selected short trade move against me on the saved candles?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["mae"],"expectedFilters":["trusted selected ready_closed single-entry lifecycle","short"],"expectedGroupings":[],"expectedOperators":["max(0,H-E)"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected lifecycle","expectedContextRequirements":["exact entry/exit boundaries","declared saved candle interval and source","complete compatible coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Conversational adverse-move wording maps to candle approximation, not stop distance, tick truth or exact sequence."},
{"caseId":"C10-E2-04","caseType":"trader_slang","input":"What was the worst heat on that selected long, candle MAE only?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["mae"],"expectedFilters":["trusted selected long interval"],"expectedGroupings":[],"expectedOperators":["max(0,E-L)"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected allocation or eligible lifecycle","expectedContextRequirements":["exact grain","exact entry/exit","compatible candle coverage and basis"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Worst heat is direction-aware slang; result is a non-negative per-unit candle distance, not risk or advice."},
{"caseId":"C10-E2-05","caseType":"abbreviation","input":"MAE metric for the selected MSFT trade, using its declared candle interval.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["mae"],"expectedFilters":["trusted selected MSFT lifecycle"],"expectedGroupings":[],"expectedOperators":["direction-aware entry-zero-baseline MAE"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected MSFT lifecycle","expectedContextRequirements":["explicit MAE metric grammar","validated MSFT symbol","exact direction/grain/boundaries","compatible saved candle coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Explicit metric grammar distinguishes MAE from a ticker-like token; no bare acronym auto-routing."},
{"caseId":"C10-E2-06","caseType":"misspelling","input":"Show max adverce excursion for the selected covered trade.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["mae"],"expectedFilters":["trusted selected eligible lifecycle"],"expectedGroupings":[],"expectedOperators":["direction-aware entry-zero-baseline MAE"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected lifecycle","expectedContextRequirements":["clear metric context","exact direction/grain","compatible saved candle source/interval/coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Normalize spelling without inventing a stop, risk amount, direction, date, candle or combined reference price."},
{"caseId":"C10-E2-07","caseType":"noisy_input","input":"mae selected short candle source covered pls","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["mae"],"expectedFilters":["trusted selected short lifecycle"],"expectedGroupings":[],"expectedOperators":["max(0,H-E)"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected lifecycle","expectedContextRequirements":["exact entry/exit","declared interval/source","complete compatible coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Noise does not create dates, quotes, stop levels, candles, source fields or private identifiers."},
{"caseId":"C10-E2-08","caseType":"command","input":"Calculate short MAE from the selected exact entry and eligible saved candles.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["mae"],"expectedFilters":["trusted selected short grain"],"expectedGroupings":[],"expectedOperators":["max(0,H-E)"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected allocation or eligible lifecycle","expectedContextRequirements":["exact entry and terminal exit","eligible candles wholly between boundaries","source/version/interval/coverage","compatible corporate-action and price basis"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Exclude entry- and exit-containing candle extrema because their intrabar sequence is unknown."},
{"caseId":"C10-E2-09","caseType":"fragment","input":"Selected long candle MAE, complete window.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["mae"],"expectedFilters":["trusted selected long grain"],"expectedGroupings":[],"expectedOperators":["max(0,E-L)"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected allocation or eligible lifecycle","expectedContextRequirements":["exact E and L","exact exit boundary","compatible saved candle coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Fragment preserves long direction and zero baseline; no adverse move returns exact zero at entry."},
{"caseId":"C10-E2-10","caseType":"follow_up","input":"Now show its MAE on that same covered candle basis.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["mae"],"expectedFilters":["prior trusted selected grain","prior declared source and interval"],"expectedGroupings":[],"expectedOperators":["direction-aware entry-zero-baseline MAE"],"expectedComparison":null,"expectedTimeRange":"prior trusted scope","expectedSelectedEntity":"prior trusted selected grain","expectedContextRequirements":["trusted prior account/grain/direction","unchanged source/version/interval/basis","complete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Follow-up may reuse trusted context only and never invent missing facts or broaden account scope."},
{"caseId":"C10-E2-11","caseType":"correction","input":"I meant candle MAE, not the trader's planned stop distance.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["mae"],"expectedFilters":["prior trusted selected grain","candle basis","exclude stop-distance interpretation"],"expectedGroupings":[],"expectedOperators":["direction-aware entry-zero-baseline MAE","metric correction"],"expectedComparison":null,"expectedTimeRange":"prior trusted scope","expectedSelectedEntity":"prior trusted selected grain","expectedContextRequirements":["trusted prior context","declared candle interval/source/coverage","exact entry/exit boundaries"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Correction does not infer trader intent, a stop level, tick truth or intrabar ordering."},
{"caseId":"C10-E2-12","caseType":"comparison","input":"Compare candle MAE for the two selected compatible allocation intervals.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["mae"],"expectedFilters":["two trusted selected accepted allocation intervals"],"expectedGroupings":[],"expectedOperators":["calculate each direction-aware MAE separately","comparison"],"expectedComparison":{"left":"selected allocation A","right":"selected allocation B","basis":"compatible candle MAE"},"expectedTimeRange":null,"expectedSelectedEntity":"two trusted selected allocation intervals","expectedContextRequirements":["same compatible interval/source/basis","exact boundaries and direction per allocation","complete coverage per allocation","allocation graph and account scope"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Comparison never mixes allocation intervals or silently uses first/weighted price."},
{"caseId":"C10-E2-13","caseType":"ranking","input":"Rank the selected compatible closed lifecycles by candle MAE.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["mae"],"expectedFilters":["trusted selected compatible ready_closed single-entry lifecycles"],"expectedGroupings":[],"expectedOperators":["direction-aware MAE per lifecycle","descending rank"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected lifecycle set","expectedContextRequirements":["compatible source/interval/instrument/currency/basis","complete coverage per lifecycle","approved deterministic tie policy","account scope"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ranking is descriptive and does not label risk quality, cause or advice."},
{"caseId":"C10-E2-14","caseType":"negation","input":"Show candle MAE for the selected trade, not an exact tick path or fill claim.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["mae"],"expectedFilters":["trusted selected eligible grain","exclude tick-path interpretation"],"expectedGroupings":[],"expectedOperators":["direction-aware entry-zero-baseline MAE"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected grain","expectedContextRequirements":["declared candle source/version/interval","complete coverage","exact boundaries/direction"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Candle high/low cannot establish exact intrabar sequence, executable quote or fillability."},
{"caseId":"C10-E2-15","caseType":"exclusion","input":"Show MAE for selected lifecycles excluding incompatible corporate-action price bases.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["mae"],"expectedFilters":["trusted selected compatible lifecycles","exclude incompatible corporate-action basis"],"expectedGroupings":[],"expectedOperators":["direction-aware MAE","basis exclusion"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected lifecycle set","expectedContextRequirements":["corporate-action basis match","compatible interval/source/currency","coverage accounting","account scope"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Excluded observations remain coverage rather than zero; adjustment policy is never inferred."},
{"caseId":"C10-E2-16","caseType":"multi_filter","input":"Show five-minute candle MAE for selected ready-closed short TSLA lifecycles with complete saved-source coverage.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["mae"],"expectedFilters":["trusted selected ready_closed single-entry lifecycles","short","TSLA","five-minute","complete coverage"],"expectedGroupings":[],"expectedOperators":["max(0,H-E)"],"expectedComparison":null,"expectedTimeRange":"trusted selected scope","expectedSelectedEntity":"trusted selected lifecycle set","expectedContextRequirements":["validated TSLA symbol","exact entry/final-exit per lifecycle","declared saved source/version","compatible corporate-action/currency basis","account IANA/session metadata"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Five-minute is explicit; do not substitute preferred one-minute data or invent missing candles."},
{"caseId":"C10-E2-17","caseType":"multi_part","input":"Show candle MAE and stop distance for the selected lifecycle, keeping unavailable facts separate.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["mae","stop_distance"],"expectedFilters":["trusted selected ready_closed lifecycle"],"expectedGroupings":[],"expectedOperators":["direction-aware candle MAE","signed stop distance only if accepted trader-plan facts exist"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected lifecycle","expectedContextRequirements":["exact candle grain/window/basis","versioned trader-recorded stop contract","separate capability states","account scope"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"MAE may be planned and covered while stop_distance remains unavailable; never infer a stop from candles or orders."},
{"caseId":"C10-E2-18","caseType":"ambiguous","input":"MAE?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["mae"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["metric-versus-symbol disambiguation","selected grain/direction","declared candle source/interval/coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Do you mean maximum adverse excursion for a selected trade, or MAE as a symbol/token?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Bare acronym is ticker-like and supplies no private trade, direction, date, interval or candle context."},
{"caseId":"C10-E2-19","caseType":"negative_example","input":"Should I widen my stop because this trade had a large MAE?","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["mae","stop_distance"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no trading advice","no inferred stop plan"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Historical candle MAE does not determine where a stop should be placed or provide trading advice.","notes":"Reject advice and preserve MAE as a factual approximate excursion only."},
{"caseId":"C10-E2-20","caseType":"unsupported_data","input":"Calculate MAE for this combined multi-entry lifecycle even though its saved candle window is incomplete.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["mae"],"expectedFilters":["combined multi-entry lifecycle","incomplete candle window"],"expectedGroupings":[],"expectedOperators":["direction-aware entry-zero-baseline MAE"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected combined lifecycle","expectedContextRequirements":["approved multi-entry reference-price and partial-exit weighting contract","complete compatible candle coverage","exact allocation graph"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Combined multi-entry MAE is unavailable without an approved reference-price/allocation contract, and incomplete candle coverage independently makes the result unavailable.","notes":"Never select first/weighted entry silently, mix intervals, interpolate gaps or invent a candle high."},
{"caseId":"C10-E2-21","caseType":"selected_entity_context","input":"Show candle MAE for the allocation interval selected in replay.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["mae"],"expectedFilters":["trusted selected replay allocation interval"],"expectedGroupings":[],"expectedOperators":["direction-aware entry-zero-baseline MAE"],"expectedComparison":null,"expectedTimeRange":"selected allocation held window","expectedSelectedEntity":"trusted server-authorized replay allocation","expectedContextRequirements":["server-authoritative account scope","exact selected allocation/direction/boundaries","saved source/version/interval/coverage","privacy-safe output"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Trusted replay selection cannot expose another account or replace missing evidence with chart presentation."},
{"caseId":"C10-E2-22","caseType":"cross_category","input":"Explain the selected trade's candle MAE beside its gross realized loss without saying MAE caused it.","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["mae","gross_loss"],"expectedFilters":["trusted selected ready_closed lifecycle","gross P/L basis"],"expectedGroupings":[],"expectedOperators":["direction-aware candle MAE","separate gross-loss fact","evidence-grounded description"],"expectedComparison":null,"expectedTimeRange":"selected lifecycle held window","expectedSelectedEntity":"trusted selected lifecycle","expectedContextRequirements":["Category 10 candle source/interval/coverage","Category 2 realized gross result basis","no causation or advice","account scope"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Describe separate facts only; MAE does not cause gross realized loss or prove risk quality."}
]
```

## 7.4 `profit_giveback` Cases

```json
[
{"caseId":"C10-E3-01","caseType":"canonical","input":"Show Category 10 profit giveback for the selected long exit.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["profit_giveback"],"expectedFilters":["trusted selected eligible long exit"],"expectedGroupings":[],"expectedOperators":["P=max(E,H)","max(0,P-X)"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected exact exit grain","expectedContextRequirements":["exact accepted entry and exit prices/times","eligible candles wholly after entry and wholly before exit","compatible saved source/version/interval/coverage","instrument/currency/corporate-action basis"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Category 10 solely computes long non-negative giveback from entry-zero favourable price P to exact boundary price X; boundary-candle extrema are excluded."},
{"caseId":"C10-E3-02","caseType":"formal_paraphrase","input":"Determine the short pre-exit favourable-extreme-to-realized-exit price reversal for the selected allocation.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["profit_giveback"],"expectedFilters":["trusted selected accepted short allocation interval"],"expectedGroupings":[],"expectedOperators":["P=min(E,L)","max(0,X-P)"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected allocation interval","expectedContextRequirements":["exact accepted allocation entry/exit boundaries","wholly-between-boundary eligible candles","complete compatible source/version/interval coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Short formula uses exact exit X and entry-zero-baseline P; it is price distance, not P/L or behaviour."},
{"caseId":"C10-E3-03","caseType":"conversational_paraphrase","input":"How much of the best candle move was given back by the selected exit?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["profit_giveback"],"expectedFilters":["trusted selected eligible exit grain"],"expectedGroupings":[],"expectedOperators":["direction-aware non-negative P-to-X giveback"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected exact exit grain","expectedContextRequirements":["exact entry/exit/direction","eligible pre-exit candles","declared source/interval/coverage/basis"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Best candle move is approximate; candles cannot prove intrabar order, tick truth or fillability."},
{"caseId":"C10-E3-04","caseType":"trader_slang","input":"How much came off the top before I got out of that selected long?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["profit_giveback"],"expectedFilters":["trusted selected long exact exit"],"expectedGroupings":[],"expectedOperators":["P=max(E,H)","max(0,P-X)"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected exact exit grain","expectedContextRequirements":["candle-price giveback context","exact boundaries/direction","complete compatible saved candles"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Off the top maps only in trusted candle/exit context and never becomes a judgement that the exit was bad."},
{"caseId":"C10-E3-05","caseType":"abbreviation","input":"PGB profit-giveback metric for the selected covered exit.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["profit_giveback"],"expectedFilters":["trusted selected eligible exit"],"expectedGroupings":[],"expectedOperators":["direction-aware non-negative P-to-X giveback"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected exact exit grain","expectedContextRequirements":["explicit profit-giveback metric grammar","exact boundaries/direction/grain","compatible candle coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Explicit grammar distinguishes PGB from a ticker/token; bare GB or PGB does not auto-route."},
{"caseId":"C10-E3-06","caseType":"misspelling","input":"Show profit givebak for the selected candle-covered exit.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["profit_giveback"],"expectedFilters":["trusted selected eligible exit"],"expectedGroupings":[],"expectedOperators":["direction-aware non-negative P-to-X giveback"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected exact exit grain","expectedContextRequirements":["clear candle metric context","exact direction/grain/boundaries","compatible source/interval/coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Normalize spelling only; do not invent an exit, candle, date, source, P/L basis or behavioural meaning."},
{"caseId":"C10-E3-07","caseType":"noisy_input","input":"giveback selected exit candle peak to out pls","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["profit_giveback"],"expectedFilters":["trusted selected exact exit grain"],"expectedGroupings":[],"expectedOperators":["direction-aware non-negative P-to-X giveback"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected exact exit grain","expectedContextRequirements":["trusted candle-price context","exact entry/exit/direction","complete compatible coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Noise does not authorize use of the exit-containing candle extreme or invent missing private context."},
{"caseId":"C10-E3-08","caseType":"command","input":"Calculate long profit giveback using exact boundary prices and only wholly-between-boundary candles.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["profit_giveback"],"expectedFilters":["trusted selected long exit grain"],"expectedGroupings":[],"expectedOperators":["P=max(E,H)","max(0,P-X)"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected exact exit grain","expectedContextRequirements":["exact E/X and times","candles wholly after entry and wholly before exit","source/version/interval/coverage","compatible adjustment/basis"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Entry and exit exact prices are boundary facts; entry- and exit-containing candle extremes remain excluded due to unknown sequence."},
{"caseId":"C10-E3-09","caseType":"fragment","input":"Selected short exit, candle profit giveback.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["profit_giveback"],"expectedFilters":["trusted selected short exact exit grain"],"expectedGroupings":[],"expectedOperators":["P=min(E,L)","max(0,X-P)"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected exact exit grain","expectedContextRequirements":["exact E/X/direction","eligible saved candles","compatible coverage/basis"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Short fragment retains exact direction and non-negative formula without implying realized profit."},
{"caseId":"C10-E3-10","caseType":"follow_up","input":"Now show giveback for that same exact exit and candle interval.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["profit_giveback"],"expectedFilters":["prior trusted exact exit grain","prior declared candle interval/source"],"expectedGroupings":[],"expectedOperators":["direction-aware non-negative P-to-X giveback"],"expectedComparison":null,"expectedTimeRange":"prior trusted scope","expectedSelectedEntity":"prior trusted exact exit grain","expectedContextRequirements":["trusted prior account/grain/direction","unchanged source/version/interval/basis","complete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Follow-up reuses only trusted context and does not invent an exit, interval, source or account."},
{"caseId":"C10-E3-11","caseType":"correction","input":"I meant candle price giveback before exit, not post-exit continuation or net profit kept.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["profit_giveback"],"expectedFilters":["prior trusted selected exit","exclude post-exit and P/L interpretations"],"expectedGroupings":[],"expectedOperators":["direction-aware non-negative P-to-X giveback","metric correction"],"expectedComparison":null,"expectedTimeRange":"prior trusted scope","expectedSelectedEntity":"prior trusted exact exit grain","expectedContextRequirements":["trusted prior context","eligible pre-exit candle coverage","exact entry/exit/direction"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Correction preserves Category 10's price formula and excludes post-exit and fee-adjusted P/L substitutions."},
{"caseId":"C10-E3-12","caseType":"comparison","input":"Compare profit giveback for the two selected exits on the same candle basis.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["profit_giveback"],"expectedFilters":["two trusted selected eligible exact exits"],"expectedGroupings":[],"expectedOperators":["calculate each directional giveback separately","comparison"],"expectedComparison":{"left":"selected exit A","right":"selected exit B","basis":"compatible candle profit giveback"},"expectedTimeRange":null,"expectedSelectedEntity":"two trusted selected exact exit grains","expectedContextRequirements":["same compatible source/interval/basis","exact entry/exit/direction per grain","complete coverage per grain","account scope"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Comparison never mixes allocation/lifecycle grains, instruments, currencies or corporate-action bases."},
{"caseId":"C10-E3-13","caseType":"ranking","input":"Rank the selected compatible exits by median per-unit candle profit giveback.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["group_and_aggregate","calculate_metric"],"expectedCanonicalConcepts":["profit_giveback"],"expectedFilters":["trusted selected eligible exact exits"],"expectedGroupings":["validated ticker"],"expectedOperators":["direction-aware giveback per grain","median","descending rank"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected exit set","expectedContextRequirements":["compatible source/interval/instrument/currency/basis","complete coverage per observation","approved deterministic tie policy","account scope"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ranking is descriptive and does not judge exit quality, infer cause or recommend holding longer."},
{"caseId":"C10-E3-14","caseType":"negation","input":"Show candle profit giveback without using the exit candle high or judging the exit.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["profit_giveback"],"expectedFilters":["trusted selected eligible exit","exclude exit-containing candle extreme","exclude behavioural judgement"],"expectedGroupings":[],"expectedOperators":["direction-aware non-negative P-to-X giveback"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected exact exit grain","expectedContextRequirements":["exact boundary prices","wholly-between-boundary candle coverage","declared source/interval/basis"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Exact exit X remains included as a boundary fact while exit-containing candle extrema are excluded."},
{"caseId":"C10-E3-15","caseType":"exclusion","input":"Show giveback for selected exits excluding any with incomplete pre-exit candle coverage.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["profit_giveback"],"expectedFilters":["trusted selected compatible exits","exclude incomplete pre-exit coverage"],"expectedGroupings":[],"expectedOperators":["direction-aware giveback","coverage exclusion"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected exit set","expectedContextRequirements":["gap detection","exact entry/exit/direction","compatible interval/source/basis","account scope"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Excluded gaps remain visible counts and are never converted to zero or repaired with invented candles."},
{"caseId":"C10-E3-16","caseType":"multi_filter","input":"Show one-minute candle profit giveback for selected ready-closed long NVDA exits with complete saved-source coverage.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["profit_giveback"],"expectedFilters":["trusted selected ready_closed single-entry lifecycles","long","NVDA","one-minute","complete coverage"],"expectedGroupings":[],"expectedOperators":["P=max(E,H)","max(0,P-X)"],"expectedComparison":null,"expectedTimeRange":"trusted selected scope","expectedSelectedEntity":"trusted selected exact exit set","expectedContextRequirements":["validated NVDA symbol","exact entry/final-exit per lifecycle","declared saved source/version","compatible corporate-action/currency basis","account IANA/session metadata"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"One-minute is explicit; filters cannot manufacture coverage or expose another account."},
{"caseId":"C10-E3-17","caseType":"multi_part","input":"Show profit giveback and percentage of available move captured for the selected exit.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["profit_giveback","percentage_of_available_move_captured"],"expectedFilters":["trusted selected eligible exact exit"],"expectedGroupings":[],"expectedOperators":["direction-aware non-negative giveback","directional exit move divided by strict-positive MFE","no clamp"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected exact exit grain","expectedContextRequirements":["same exact grain/window/basis","exact E/X/direction","complete compatible candles","strict-positive MFE denominator for capture"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Return distinct formulas; giveback does not inherit the capture ratio or its denominator."},
{"caseId":"C10-E3-18","caseType":"ambiguous","input":"How much did I give back?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["profit_giveback"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["candle-price versus P/L versus behaviour versus post-exit disambiguation","selected exact grain/direction","candle coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Do you mean candle price giveback before exit, P/L giveback, behaviour interpretation, or post-exit movement?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ambiguous wording supplies no exit, direction, date, candle source, interval or private context."},
{"caseId":"C10-E3-19","caseType":"negative_example","input":"Was my candle giveback bad, and should I hold longer next time?","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["profit_giveback"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no judgement, prediction or trading advice"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Historical candle giveback does not determine whether an exit was bad or whether the trader should hold longer.","notes":"Reject advice/regret while preserving the factual Category 10 calculation boundary."},
{"caseId":"C10-E3-20","caseType":"unsupported_data","input":"Calculate giveback for this combined multi-entry trade even though only entry- and exit-containing candles are saved.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["profit_giveback"],"expectedFilters":["combined multi-entry trade","no eligible wholly-between-boundary candle coverage"],"expectedGroupings":[],"expectedOperators":["direction-aware non-negative P-to-X giveback"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected combined trade","expectedContextRequirements":["approved multi-entry reference/partial-exit contract","exact allocation graph","eligible wholly-between-boundary candles","complete compatible coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Combined multi-entry giveback is unavailable without an approved allocation/reference contract, and boundary-containing candles cannot establish an eligible pre-exit extreme.","notes":"Never use first/weighted entry silently, mix intervals, use boundary-candle extrema or invent a favourable candle."},
{"caseId":"C10-E3-21","caseType":"selected_entity_context","input":"Show profit giveback for the exact exit selected in Candle Review.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["profit_giveback"],"expectedFilters":["trusted selected Candle Review exact exit"],"expectedGroupings":[],"expectedOperators":["direction-aware non-negative P-to-X giveback"],"expectedComparison":null,"expectedTimeRange":"selected entry-to-exit window","expectedSelectedEntity":"trusted server-authorized Candle Review exit grain","expectedContextRequirements":["server-authoritative account scope","exact selected grain/direction/boundaries","saved source/version/interval/coverage","privacy-safe output"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Trusted selection cannot expose another account or turn chart presentation into missing factual evidence."},
{"caseId":"C10-E3-22","caseType":"cross_category","input":"Explain the selected exit's candle giveback under the behaviour policy without recalculating it outside Category 10.","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["profit_giveback"],"expectedFilters":["trusted selected eligible exact exit"],"expectedGroupings":[],"expectedOperators":["Category 10 sole giveback calculation","Category 9 reference-only interpretation","evidence-grounded description"],"expectedComparison":null,"expectedTimeRange":"selected entry-to-exit window","expectedSelectedEntity":"trusted selected exact exit grain","expectedContextRequirements":["Category 10 exact result/source/interval/coverage","Category 9 behaviour-policy boundary","no duplicate calculation","no causation or advice","account scope"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Category 9 may reference the factual result but must not own, duplicate or recompute it; explanation cannot claim cause or prescribe action."}
]
```

## 7.5 `maximum_favourable_price` Cases

```json
[
{"caseId":"C10-E4-01","caseType":"canonical","input":"Show maximum favourable price for the selected long lifecycle.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["maximum_favourable_price"],"expectedFilters":["trusted selected ready_closed single-entry lifecycle","long"],"expectedGroupings":[],"expectedOperators":["max(E,H)"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected lifecycle","expectedContextRequirements":["exact entry/final-exit boundaries","eligible candles wholly after entry and wholly before exit","compatible saved source/version/interval/coverage","instrument/currency/corporate-action basis"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Long endpoint is entry-baselined max(E,H); candle high is interval evidence, not tick truth or an exact instant."},
{"caseId":"C10-E4-02","caseType":"formal_paraphrase","input":"Determine the entry-baselined favourable price endpoint for the selected short allocation interval.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["maximum_favourable_price"],"expectedFilters":["trusted selected accepted allocation interval","short"],"expectedGroupings":[],"expectedOperators":["min(E,L)"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected allocation interval","expectedContextRequirements":["exact accepted entry and matched reducing boundary","eligible wholly-between-boundary candles","compatible source/version/interval/coverage/basis"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Short endpoint is min(E,L) for one exact allocation grain; no first or weighted combined entry is substituted."},
{"caseId":"C10-E4-03","caseType":"conversational_paraphrase","input":"What was the best candle price for the selected long while it was open?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["maximum_favourable_price"],"expectedFilters":["trusted selected eligible long lifecycle"],"expectedGroupings":[],"expectedOperators":["max(E,H)"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected lifecycle","expectedContextRequirements":["exact held-window boundaries","declared candle source/interval/coverage","compatible price basis"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Best price means the favourable candle endpoint, not a fill, quote, target, MFE distance or exact tick."},
{"caseId":"C10-E4-04","caseType":"trader_slang","input":"What was the best print for me on that selected short, candle endpoint only?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["maximum_favourable_price"],"expectedFilters":["trusted selected short grain"],"expectedGroupings":[],"expectedOperators":["min(E,L)"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected allocation or eligible lifecycle","expectedContextRequirements":["candle-versus-tick context","exact boundaries/direction","complete compatible coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Best print is slang only; the result remains a candle price endpoint without fillability or sequence claims."},
{"caseId":"C10-E4-05","caseType":"abbreviation","input":"MFP maximum-favourable-price metric for the selected covered trade.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["maximum_favourable_price"],"expectedFilters":["trusted selected eligible grain"],"expectedGroupings":[],"expectedOperators":["direction-aware entry-baselined endpoint"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected grain","expectedContextRequirements":["explicit metric grammar","exact direction/boundaries","compatible candle source/interval/coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Explicit wording distinguishes the metric from ticker-like MFP; bare MFP never auto-routes."},
{"caseId":"C10-E4-06","caseType":"misspelling","input":"Show max favourble prise for the selected covered lifecycle.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["maximum_favourable_price"],"expectedFilters":["trusted selected eligible lifecycle"],"expectedGroupings":[],"expectedOperators":["direction-aware entry-baselined endpoint"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected lifecycle","expectedContextRequirements":["clear endpoint context","exact grain/direction","compatible candle evidence"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Normalize spelling without inventing direction, date, source, interval, candle, quote or target."},
{"caseId":"C10-E4-07","caseType":"noisy_input","input":"max fav px selected long saved candles pls","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["maximum_favourable_price"],"expectedFilters":["trusted selected long grain"],"expectedGroupings":[],"expectedOperators":["max(E,H)"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected grain","expectedContextRequirements":["exact E and exit boundary","declared source/interval","complete compatible coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Noisy input does not create missing private trade context or provider candles."},
{"caseId":"C10-E4-08","caseType":"command","input":"Return the short entry-baselined maximum favourable candle price for the selected interval.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["maximum_favourable_price"],"expectedFilters":["trusted selected short allocation interval"],"expectedGroupings":[],"expectedOperators":["min(E,L)"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected allocation interval","expectedContextRequirements":["exact accepted boundaries","eligible candles wholly between boundaries","saved source/version/interval/coverage","compatible basis"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Entry- and exit-containing candle lows are excluded because their intrabar sequence is unknown."},
{"caseId":"C10-E4-09","caseType":"fragment","input":"Selected long maximum favourable candle price, complete window.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["maximum_favourable_price"],"expectedFilters":["trusted selected long lifecycle"],"expectedGroupings":[],"expectedOperators":["max(E,H)"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected lifecycle","expectedContextRequirements":["exact entry/exit","complete compatible candle coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"With complete coverage and no more-favourable eligible candle, the endpoint is exact entry E rather than unavailable or an invented high."},
{"caseId":"C10-E4-10","caseType":"follow_up","input":"Now show that favourable price endpoint on the same saved candle basis.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["maximum_favourable_price"],"expectedFilters":["prior trusted grain/source/interval"],"expectedGroupings":[],"expectedOperators":["direction-aware entry-baselined endpoint"],"expectedComparison":null,"expectedTimeRange":"prior trusted scope","expectedSelectedEntity":"prior trusted selected grain","expectedContextRequirements":["trusted prior account/grain/direction","unchanged source/version/interval/basis","complete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Follow-up reuses trusted context only and never invents missing dates, candles or account scope."},
{"caseId":"C10-E4-11","caseType":"correction","input":"I meant maximum favourable price, not its MFE distance from entry.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["maximum_favourable_price"],"expectedFilters":["prior trusted selected grain","endpoint not distance"],"expectedGroupings":[],"expectedOperators":["direction-aware entry-baselined endpoint","metric correction"],"expectedComparison":null,"expectedTimeRange":"prior trusted scope","expectedSelectedEntity":"prior trusted selected grain","expectedContextRequirements":["trusted prior context","exact entry/exit/direction","compatible candle basis"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Correction selects a price endpoint and does not convert it to excursion distance or exact-time output."},
{"caseId":"C10-E4-12","caseType":"comparison","input":"Compare maximum favourable prices for the two selected same-instrument lifecycles.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["maximum_favourable_price"],"expectedFilters":["two trusted selected same-instrument eligible lifecycles"],"expectedGroupings":[],"expectedOperators":["calculate each endpoint separately","comparison"],"expectedComparison":{"left":"selected lifecycle A","right":"selected lifecycle B","basis":"compatible maximum favourable price"},"expectedTimeRange":null,"expectedSelectedEntity":"two trusted selected lifecycles","expectedContextRequirements":["same instrument/currency/corporate-action basis","compatible source/interval","complete coverage per lifecycle","account scope"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Raw endpoint prices are not compared across incompatible instruments or adjustment bases."},
{"caseId":"C10-E4-13","caseType":"ranking","input":"Rank the selected same-instrument observations by maximum favourable price.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["maximum_favourable_price"],"expectedFilters":["trusted selected compatible same-instrument observations"],"expectedGroupings":[],"expectedOperators":["direction-aware endpoint per observation","descending rank"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected observation set","expectedContextRequirements":["same instrument/currency/basis","complete source/interval coverage","approved deterministic ties","account scope"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ranking is descriptive and does not imply quality, prediction or advice."},
{"caseId":"C10-E4-14","caseType":"negation","input":"Show maximum favourable candle price, not a tick high or realized exit fill.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["maximum_favourable_price"],"expectedFilters":["trusted selected eligible grain","exclude tick and exit-fill meanings"],"expectedGroupings":[],"expectedOperators":["direction-aware entry-baselined endpoint"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected grain","expectedContextRequirements":["declared candle source/version/interval","exact boundaries/direction","complete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Candle extrema do not establish exact intrabar instant, executable quote or fillability."},
{"caseId":"C10-E4-15","caseType":"exclusion","input":"Show favourable price endpoints excluding observations with candle gaps or incompatible adjustments.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["maximum_favourable_price"],"expectedFilters":["trusted selected observations","exclude gaps","exclude incompatible adjustment basis"],"expectedGroupings":[],"expectedOperators":["direction-aware endpoint","coverage exclusion"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected observation set","expectedContextRequirements":["gap and basis validation","compatible source/interval","coverage accounting","account scope"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Excluded rows remain visible coverage and never receive an entry-price default unless their coverage is complete."},
{"caseId":"C10-E4-16","caseType":"multi_filter","input":"Show one-minute maximum favourable price for selected ready-closed long AAPL allocation intervals with complete saved coverage.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["maximum_favourable_price"],"expectedFilters":["trusted selected accepted allocations","ready_closed","long","AAPL","one-minute","complete coverage"],"expectedGroupings":[],"expectedOperators":["max(E,H)"],"expectedComparison":null,"expectedTimeRange":"trusted selected scope","expectedSelectedEntity":"trusted selected allocation set","expectedContextRequirements":["validated AAPL symbol","exact allocation graph/boundaries","declared source/version","compatible currency/corporate-action basis","privacy-safe account scope"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"One-minute is explicit rather than default; filters cannot manufacture candles or combine allocation intervals."},
{"caseId":"C10-E4-17","caseType":"multi_part","input":"Show maximum favourable price and MFE for the selected covered short allocation.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["maximum_favourable_price","mfe"],"expectedFilters":["trusted selected short allocation interval"],"expectedGroupings":[],"expectedOperators":["min(E,L)","max(0,E-L)"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected allocation interval","expectedContextRequirements":["same exact grain/window/basis","exact entry/exit","complete compatible candle coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Return endpoint and distance separately; both use the same entry-zero short basis."},
{"caseId":"C10-E4-18","caseType":"ambiguous","input":"MFP?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["maximum_favourable_price"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["metric-versus-symbol disambiguation","endpoint-versus-distance clarification","selected grain/direction/candle basis"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Do you mean ticker MFP or the maximum favourable price endpoint for a selected trade?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Bare acronym provides no date, account, direction, grain, source, interval or candle facts."},
{"caseId":"C10-E4-19","caseType":"negative_example","input":"Will the selected trade's favourable candle price predict my next target?","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["maximum_favourable_price","target_distance"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected trade","expectedContextRequirements":["no target inference, prediction or advice"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"A historical favourable candle endpoint cannot predict or prescribe a future target.","notes":"Reject prediction/advice and never infer a trader-recorded target from a candle high or low."},
{"caseId":"C10-E4-20","caseType":"unsupported_data","input":"Return maximum favourable price for this combined multi-entry trade despite missing held-window candles.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["maximum_favourable_price"],"expectedFilters":["combined multi-entry trade","candle coverage gap"],"expectedGroupings":[],"expectedOperators":["direction-aware entry-baselined endpoint"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected combined trade","expectedContextRequirements":["approved multi-entry reference/partial-exit contract","exact allocation graph","complete compatible candle coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"The combined multi-entry endpoint is unavailable without an approved reference-price/allocation contract, and missing candles independently make it unavailable.","notes":"Never use first/weighted entry silently, mix intervals, interpolate gaps or invent an extreme."},
{"caseId":"C10-E4-21","caseType":"selected_entity_context","input":"Show maximum favourable price for the allocation selected in Candle Review.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["maximum_favourable_price"],"expectedFilters":["trusted selected Candle Review allocation"],"expectedGroupings":[],"expectedOperators":["direction-aware entry-baselined endpoint"],"expectedComparison":null,"expectedTimeRange":"selected allocation held window","expectedSelectedEntity":"trusted server-authorized Candle Review allocation","expectedContextRequirements":["server-authoritative account scope","exact grain/direction/boundaries","saved source/version/interval/coverage","privacy-safe output"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Trusted selection cannot expose another account or turn chart presentation into missing evidence."},
{"caseId":"C10-E4-22","caseType":"cross_category","input":"Explain maximum favourable price beside MFE for the selected trade without judging its quality.","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["maximum_favourable_price","mfe"],"expectedFilters":["trusted selected eligible grain"],"expectedGroupings":[],"expectedOperators":["direction-aware endpoint","direction-aware MFE distance","evidence-grounded description"],"expectedComparison":null,"expectedTimeRange":"selected held window","expectedSelectedEntity":"trusted selected grain","expectedContextRequirements":["same declared grain/window/basis","exact candle source/interval/coverage","no causation or advice","account scope"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Explain that endpoint is a price and MFE is its entry distance; neither proves cause or trade quality."}
]
```

## 7.6 `maximum_adverse_price` Cases

```json
[
{"caseId":"C10-E5-01","caseType":"canonical","input":"Show maximum adverse price for the selected long lifecycle.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["maximum_adverse_price"],"expectedFilters":["trusted selected ready_closed single-entry lifecycle","long"],"expectedGroupings":[],"expectedOperators":["min(E,L)"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected lifecycle","expectedContextRequirements":["exact entry/final-exit boundaries","eligible candles wholly after entry and wholly before exit","compatible saved source/version/interval/coverage","instrument/currency/corporate-action basis"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Long endpoint is entry-baselined min(E,L); candle low is interval evidence, not tick truth or an exact instant."},
{"caseId":"C10-E5-02","caseType":"formal_paraphrase","input":"Determine the entry-baselined adverse price endpoint for the selected short allocation interval.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["maximum_adverse_price"],"expectedFilters":["trusted selected accepted allocation interval","short"],"expectedGroupings":[],"expectedOperators":["max(E,H)"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected allocation interval","expectedContextRequirements":["exact accepted entry and matched reducing boundary","eligible wholly-between-boundary candles","compatible source/version/interval/coverage/basis"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Short endpoint is max(E,H) for one exact allocation grain; no first or weighted combined entry is substituted."},
{"caseId":"C10-E5-03","caseType":"conversational_paraphrase","input":"What was the worst candle price against the selected long while it was open?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["maximum_adverse_price"],"expectedFilters":["trusted selected eligible long lifecycle"],"expectedGroupings":[],"expectedOperators":["min(E,L)"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected lifecycle","expectedContextRequirements":["exact held-window boundaries","declared candle source/interval/coverage","compatible price basis"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Worst price means the adverse candle endpoint, not a fill, quote, stop, MAE distance or exact tick."},
{"caseId":"C10-E5-04","caseType":"trader_slang","input":"What was the worst print against that selected short, candle endpoint only?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["maximum_adverse_price"],"expectedFilters":["trusted selected short grain"],"expectedGroupings":[],"expectedOperators":["max(E,H)"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected allocation or eligible lifecycle","expectedContextRequirements":["candle-versus-tick context","exact boundaries/direction","complete compatible coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Worst print is slang only; the result remains a candle price endpoint without fillability or sequence claims."},
{"caseId":"C10-E5-05","caseType":"abbreviation","input":"MAP maximum-adverse-price metric for the selected covered trade.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["maximum_adverse_price"],"expectedFilters":["trusted selected eligible grain"],"expectedGroupings":[],"expectedOperators":["direction-aware entry-baselined endpoint"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected grain","expectedContextRequirements":["explicit metric grammar","exact direction/boundaries","compatible candle source/interval/coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Explicit wording distinguishes the metric from ordinary or ticker-like MAP; bare MAP never auto-routes."},
{"caseId":"C10-E5-06","caseType":"misspelling","input":"Show max adverce prise for the selected covered lifecycle.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["maximum_adverse_price"],"expectedFilters":["trusted selected eligible lifecycle"],"expectedGroupings":[],"expectedOperators":["direction-aware entry-baselined endpoint"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected lifecycle","expectedContextRequirements":["clear endpoint context","exact grain/direction","compatible candle evidence"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Normalize spelling without inventing direction, date, source, interval, candle, quote or stop."},
{"caseId":"C10-E5-07","caseType":"noisy_input","input":"max adverse px selected short saved candles pls","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["maximum_adverse_price"],"expectedFilters":["trusted selected short grain"],"expectedGroupings":[],"expectedOperators":["max(E,H)"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected grain","expectedContextRequirements":["exact E and exit boundary","declared source/interval","complete compatible coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Noisy input does not create missing private trade context or provider candles."},
{"caseId":"C10-E5-08","caseType":"command","input":"Return the long entry-baselined maximum adverse candle price for the selected interval.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["maximum_adverse_price"],"expectedFilters":["trusted selected long allocation interval"],"expectedGroupings":[],"expectedOperators":["min(E,L)"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected allocation interval","expectedContextRequirements":["exact accepted boundaries","eligible candles wholly between boundaries","saved source/version/interval/coverage","compatible basis"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Entry- and exit-containing candle lows are excluded because their intrabar sequence is unknown."},
{"caseId":"C10-E5-09","caseType":"fragment","input":"Selected short maximum adverse candle price, complete window.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["maximum_adverse_price"],"expectedFilters":["trusted selected short lifecycle"],"expectedGroupings":[],"expectedOperators":["max(E,H)"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected lifecycle","expectedContextRequirements":["exact entry/exit","complete compatible candle coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"With complete coverage and no more-adverse eligible candle, the endpoint is exact entry E rather than unavailable or an invented high."},
{"caseId":"C10-E5-10","caseType":"follow_up","input":"Now show that adverse price endpoint on the same saved candle basis.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["maximum_adverse_price"],"expectedFilters":["prior trusted grain/source/interval"],"expectedGroupings":[],"expectedOperators":["direction-aware entry-baselined endpoint"],"expectedComparison":null,"expectedTimeRange":"prior trusted scope","expectedSelectedEntity":"prior trusted selected grain","expectedContextRequirements":["trusted prior account/grain/direction","unchanged source/version/interval/basis","complete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Follow-up reuses trusted context only and never invents missing dates, candles or account scope."},
{"caseId":"C10-E5-11","caseType":"correction","input":"I meant maximum adverse price, not its MAE distance from entry.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["maximum_adverse_price"],"expectedFilters":["prior trusted selected grain","endpoint not distance"],"expectedGroupings":[],"expectedOperators":["direction-aware entry-baselined endpoint","metric correction"],"expectedComparison":null,"expectedTimeRange":"prior trusted scope","expectedSelectedEntity":"prior trusted selected grain","expectedContextRequirements":["trusted prior context","exact entry/exit/direction","compatible candle basis"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Correction selects a price endpoint and does not convert it to excursion distance, stop level or exact-time output."},
{"caseId":"C10-E5-12","caseType":"comparison","input":"Compare maximum adverse prices for the two selected same-instrument allocations.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["maximum_adverse_price"],"expectedFilters":["two trusted selected same-instrument accepted allocations"],"expectedGroupings":[],"expectedOperators":["calculate each endpoint separately","comparison"],"expectedComparison":{"left":"selected allocation A","right":"selected allocation B","basis":"compatible maximum adverse price"},"expectedTimeRange":null,"expectedSelectedEntity":"two trusted selected allocations","expectedContextRequirements":["same instrument/currency/corporate-action basis","compatible source/interval","complete coverage per allocation","allocation graph and account scope"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Raw endpoints are not compared across incompatible instruments, bases or allocation grains."},
{"caseId":"C10-E5-13","caseType":"ranking","input":"Rank the selected same-instrument observations by maximum adverse price.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["maximum_adverse_price"],"expectedFilters":["trusted selected compatible same-instrument observations"],"expectedGroupings":[],"expectedOperators":["direction-aware endpoint per observation","declared rank direction"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected observation set","expectedContextRequirements":["same instrument/currency/basis","explicit ascending or descending semantics","complete coverage","approved deterministic ties","account scope"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Should maximum adverse prices be ranked from lowest to highest or highest to lowest?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Raw adverse endpoint rank direction is not silently treated as risk severity or advice."},
{"caseId":"C10-E5-14","caseType":"negation","input":"Show maximum adverse candle price, not a tick low or realized exit fill.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["maximum_adverse_price"],"expectedFilters":["trusted selected eligible grain","exclude tick and exit-fill meanings"],"expectedGroupings":[],"expectedOperators":["direction-aware entry-baselined endpoint"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected grain","expectedContextRequirements":["declared candle source/version/interval","exact boundaries/direction","complete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Candle extrema do not establish exact intrabar instant, executable quote or fillability."},
{"caseId":"C10-E5-15","caseType":"exclusion","input":"Show adverse price endpoints excluding observations with gaps or incompatible adjustment bases.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["maximum_adverse_price"],"expectedFilters":["trusted selected observations","exclude gaps","exclude incompatible adjustment basis"],"expectedGroupings":[],"expectedOperators":["direction-aware endpoint","coverage exclusion"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected observation set","expectedContextRequirements":["gap and basis validation","compatible source/interval","coverage accounting","account scope"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Excluded rows remain visible coverage and never receive entry E unless their coverage is complete."},
{"caseId":"C10-E5-16","caseType":"multi_filter","input":"Show five-minute maximum adverse price for selected ready-closed short TSLA allocations with complete saved coverage.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["maximum_adverse_price"],"expectedFilters":["trusted selected accepted allocations","ready_closed","short","TSLA","five-minute","complete coverage"],"expectedGroupings":[],"expectedOperators":["max(E,H)"],"expectedComparison":null,"expectedTimeRange":"trusted selected scope","expectedSelectedEntity":"trusted selected allocation set","expectedContextRequirements":["validated TSLA symbol","exact allocation graph/boundaries","declared source/version","compatible currency/corporate-action basis","privacy-safe account scope"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Five-minute is explicit; do not substitute preferred one-minute candles or combine allocations."},
{"caseId":"C10-E5-17","caseType":"multi_part","input":"Show maximum adverse price and MAE for the selected covered long allocation.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["maximum_adverse_price","mae"],"expectedFilters":["trusted selected long allocation interval"],"expectedGroupings":[],"expectedOperators":["min(E,L)","max(0,E-L)"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected allocation interval","expectedContextRequirements":["same exact grain/window/basis","exact entry/exit","complete compatible candle coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Return endpoint and distance separately; both use the same entry-zero long basis."},
{"caseId":"C10-E5-18","caseType":"ambiguous","input":"MAP?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["maximum_adverse_price"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["ordinary-word/symbol/metric disambiguation","endpoint-versus-distance clarification","selected grain/direction/candle basis"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Do you mean maximum adverse price, a symbol named MAP, or the ordinary word map?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Bare token provides no private trade, date, direction, grain, source, interval or candle facts."},
{"caseId":"C10-E5-19","caseType":"negative_example","input":"Should the selected trade's adverse candle price become my next stop?","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["maximum_adverse_price","stop_distance"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected trade","expectedContextRequirements":["no stop inference, prediction or advice"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"A historical adverse candle endpoint cannot create or prescribe a trader-recorded stop.","notes":"Reject advice and never infer stop intent from candle extrema or orders."},
{"caseId":"C10-E5-20","caseType":"unsupported_data","input":"Return maximum adverse price for this combined multi-entry trade despite an incomplete candle window.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["maximum_adverse_price"],"expectedFilters":["combined multi-entry trade","incomplete candle window"],"expectedGroupings":[],"expectedOperators":["direction-aware entry-baselined endpoint"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected combined trade","expectedContextRequirements":["approved multi-entry reference/partial-exit contract","exact allocation graph","complete compatible candle coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"The combined multi-entry endpoint is unavailable without an approved reference-price/allocation contract, and incomplete coverage independently makes it unavailable.","notes":"Never use first/weighted entry silently, mix intervals, interpolate gaps or invent an extreme."},
{"caseId":"C10-E5-21","caseType":"selected_entity_context","input":"Show maximum adverse price for the lifecycle selected in replay.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["maximum_adverse_price"],"expectedFilters":["trusted selected replay lifecycle"],"expectedGroupings":[],"expectedOperators":["direction-aware entry-baselined endpoint"],"expectedComparison":null,"expectedTimeRange":"selected lifecycle held window","expectedSelectedEntity":"trusted server-authorized replay lifecycle","expectedContextRequirements":["server-authoritative account scope","exact grain/direction/boundaries","saved source/version/interval/coverage","privacy-safe output"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Trusted selection cannot expose another account or turn replay visuals into missing evidence."},
{"caseId":"C10-E5-22","caseType":"cross_category","input":"Explain maximum adverse price beside MAE for the selected trade without judging its risk.","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["maximum_adverse_price","mae"],"expectedFilters":["trusted selected eligible grain"],"expectedGroupings":[],"expectedOperators":["direction-aware endpoint","direction-aware MAE distance","evidence-grounded description"],"expectedComparison":null,"expectedTimeRange":"selected held window","expectedSelectedEntity":"trusted selected grain","expectedContextRequirements":["same declared grain/window/basis","exact candle source/interval/coverage","no causation or advice","account scope"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Explain that endpoint is a price and MAE its entry distance; neither proves cause, risk quality or advice."}
]
```

## 7.7 `percentage_of_available_move_captured` Cases

```json
[
{"caseId":"C10-E6-01","caseType":"canonical","input":"Show percentage of available move captured for the selected long exit.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["percentage_of_available_move_captured"],"expectedFilters":["trusted selected eligible long exit"],"expectedGroupings":[],"expectedOperators":["MFE=max(0,H-E)","((X-E)/MFE)*100","strict-positive denominator","no clamp"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected exact exit grain","expectedContextRequirements":["exact E/X and direction","eligible candles wholly after entry and wholly before exit","strictly positive candle MFE","compatible source/version/interval/coverage/basis"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Long numerator is exact directional exit move X-E; preserve negative and over-100 results and disclose denominator/source coverage."},
{"caseId":"C10-E6-02","caseType":"formal_paraphrase","input":"Calculate the selected short allocation's exact directional entry-to-exit move as a percentage of its strictly positive candle MFE.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["percentage_of_available_move_captured"],"expectedFilters":["trusted selected accepted short allocation interval"],"expectedGroupings":[],"expectedOperators":["MFE=max(0,E-L)","((E-X)/MFE)*100","strict-positive denominator","no clamp"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected allocation interval","expectedContextRequirements":["exact accepted allocation boundaries/direction","same declared grain/window/basis","complete compatible candle coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Short numerator is E-X and denominator is the same-grain candle MFE; no fee, P/L or combined-trade substitution."},
{"caseId":"C10-E6-03","caseType":"conversational_paraphrase","input":"What share of the best candle move did the selected exit capture?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["percentage_of_available_move_captured"],"expectedFilters":["trusted selected eligible exact exit"],"expectedGroupings":[],"expectedOperators":["directional exit move divided by strictly positive candle MFE","multiply by 100","no clamp"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected exit grain","expectedContextRequirements":["exact E/X/direction","same grain/window/basis","complete source/interval coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Best move is a candle approximation; result is not realized return, giveback, exit grade or tick truth."},
{"caseId":"C10-E6-04","caseType":"trader_slang","input":"What percent of the move did I bank on that selected short, candle capture only?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["percentage_of_available_move_captured"],"expectedFilters":["trusted selected short exact exit"],"expectedGroupings":[],"expectedOperators":["((E-X)/max(0,E-L))*100","strict-positive denominator","no clamp"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected exit grain","expectedContextRequirements":["price-ratio context","exact boundaries/direction","complete compatible candle coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Bank is slang only; fees and realized P/L remain separate and the ratio is not a quality judgement."},
{"caseId":"C10-E6-05","caseType":"abbreviation","input":"PAMC percentage-of-available-move-captured metric for the selected covered exit.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["percentage_of_available_move_captured"],"expectedFilters":["trusted selected eligible exit"],"expectedGroupings":[],"expectedOperators":["directional exit move / strict-positive MFE * 100","no clamp"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected exit grain","expectedContextRequirements":["explicit metric grammar","exact grain/direction/boundaries","compatible candle coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Explicit expansion establishes the metric; abbreviation alone does not supply trade context or bypass ticker validation."},
{"caseId":"C10-E6-06","caseType":"misspelling","input":"Show percent of avalable move capturd for the selected exit.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["percentage_of_available_move_captured"],"expectedFilters":["trusted selected eligible exit"],"expectedGroupings":[],"expectedOperators":["directional exit move / strict-positive MFE * 100","no clamp"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected exit grain","expectedContextRequirements":["clear metric context","exact E/X/direction","same-grain covered MFE"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Normalize spelling without inventing dates, boundaries, candles, denominator, interval or provider facts."},
{"caseId":"C10-E6-07","caseType":"noisy_input","input":"move capture pct selected long exit mfe covered no cap","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["percentage_of_available_move_captured"],"expectedFilters":["trusted selected long exact exit"],"expectedGroupings":[],"expectedOperators":["((X-E)/max(0,H-E))*100","strict-positive denominator","no clamp"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected exit grain","expectedContextRequirements":["exact E/X","eligible candle H","declared source/interval/coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Noise does not create a date, price, source, candle or account fact; no cap means preserve the exact ratio."},
{"caseId":"C10-E6-08","caseType":"command","input":"Calculate short available-move capture from exact entry and exit using the same covered MFE window.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["percentage_of_available_move_captured"],"expectedFilters":["trusted selected short grain"],"expectedGroupings":[],"expectedOperators":["MFE=max(0,E-L)","((E-X)/MFE)*100","strict-positive denominator","no clamp"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected allocation or eligible lifecycle","expectedContextRequirements":["exact E/X/direction","same declared grain/window/basis","eligible wholly-between-boundary candles","complete source/version/interval coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Entry/exit exact prices are boundary facts; boundary-containing candle extrema stay excluded because sequence is unknown."},
{"caseId":"C10-E6-09","caseType":"fragment","input":"Selected long exit capture, negative directional move.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["percentage_of_available_move_captured"],"expectedFilters":["trusted selected long exact exit","X below E","strictly positive MFE"],"expectedGroupings":[],"expectedOperators":["((X-E)/MFE)*100","preserve negative","no floor"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected exit grain","expectedContextRequirements":["exact negative numerator","strict-positive covered denominator","compatible basis"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"A losing directional exit with positive candle MFE yields a negative percentage; never floor it to zero."},
{"caseId":"C10-E6-10","caseType":"follow_up","input":"Now show that capture percentage on the same exact grain and candle basis.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["percentage_of_available_move_captured"],"expectedFilters":["prior trusted exit grain/source/interval"],"expectedGroupings":[],"expectedOperators":["directional exit move / strict-positive MFE * 100","no clamp"],"expectedComparison":null,"expectedTimeRange":"prior trusted scope","expectedSelectedEntity":"prior trusted selected exit","expectedContextRequirements":["trusted prior account/grain/direction","unchanged boundaries/source/interval/basis","complete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Follow-up cannot reuse stale or incompatible context and never invents a denominator."},
{"caseId":"C10-E6-11","caseType":"correction","input":"Do not cap it at 100; preserve the exact available-move capture ratio.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["percentage_of_available_move_captured"],"expectedFilters":["prior trusted selected exit"],"expectedGroupings":[],"expectedOperators":["directional exit move / strict-positive MFE * 100","remove cap","preserve greater-than-100"],"expectedComparison":null,"expectedTimeRange":"prior trusted scope","expectedSelectedEntity":"prior trusted selected exit","expectedContextRequirements":["trusted prior calculation","exact numerator/denominator","same grain/window/basis"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"A boundary exit move larger than eligible candle MFE may exceed 100 because boundary-candle extrema are excluded; do not correct it silently."},
{"caseId":"C10-E6-12","caseType":"comparison","input":"Compare available-move capture for the two selected exits on the same candle basis.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["percentage_of_available_move_captured"],"expectedFilters":["two trusted selected eligible exits"],"expectedGroupings":[],"expectedOperators":["calculate each unclamped ratio separately","comparison"],"expectedComparison":{"left":"selected exit A","right":"selected exit B","basis":"compatible available-move capture"},"expectedTimeRange":null,"expectedSelectedEntity":"two trusted selected exits","expectedContextRequirements":["strict-positive denominator per exit","same compatible source/interval/basis","exact boundaries/direction per grain","account scope"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Do not coerce unavailable denominators, negatives or values above 100 before comparison."},
{"caseId":"C10-E6-13","caseType":"ranking","input":"Rank selected compatible exits by unclamped percentage of available move captured.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["percentage_of_available_move_captured"],"expectedFilters":["trusted selected eligible exits","strictly positive MFE per exit"],"expectedGroupings":[],"expectedOperators":["exact unclamped ratio per grain","descending rank"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected exit set","expectedContextRequirements":["compatible interval/source/basis","complete coverage","approved deterministic tie policy","account scope"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ranking preserves negative and over-100 values and is descriptive, not an exit-quality recommendation."},
{"caseId":"C10-E6-14","caseType":"negation","input":"Show available-move capture, not profit giveback, realized return, or a clamped score.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["percentage_of_available_move_captured"],"expectedFilters":["trusted selected eligible exit","exclude giveback/return/score meanings"],"expectedGroupings":[],"expectedOperators":["directional exit move / strict-positive MFE * 100","no clamp"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected exit grain","expectedContextRequirements":["exact E/X/direction","same-grain candle MFE","compatible coverage/basis"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Fees, capital return and giveback remain separate concepts; this ratio is not a quality grade."},
{"caseId":"C10-E6-15","caseType":"exclusion","input":"Show capture percentages excluding exits with zero MFE or incomplete candle coverage.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["percentage_of_available_move_captured"],"expectedFilters":["trusted selected exits","exclude zero/missing denominator","exclude incomplete coverage"],"expectedGroupings":[],"expectedOperators":["strict-positive-denominator ratio","coverage exclusion"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected exit set","expectedContextRequirements":["MFE denominator validation","gap detection","compatible source/interval/basis","coverage accounting"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Excluded cases remain unavailable coverage and are never recorded as zero percent or repaired with invented candles."},
{"caseId":"C10-E6-16","caseType":"multi_filter","input":"Show one-minute available-move capture for selected ready-closed long AMD exits with positive covered MFE.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["percentage_of_available_move_captured"],"expectedFilters":["trusted selected ready_closed single-entry lifecycles","long","AMD","one-minute","strictly positive MFE","complete coverage"],"expectedGroupings":[],"expectedOperators":["((X-E)/MFE)*100","no clamp"],"expectedComparison":null,"expectedTimeRange":"trusted selected scope","expectedSelectedEntity":"trusted selected exit set","expectedContextRequirements":["validated AMD symbol","exact entry/final-exit per lifecycle","declared source/version","compatible currency/corporate-action basis","privacy-safe account scope"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"One-minute is explicit; filters cannot create coverage, denominator facts or another account's data."},
{"caseId":"C10-E6-17","caseType":"multi_part","input":"Show available-move capture and profit giveback for the selected covered exit.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["percentage_of_available_move_captured","profit_giveback"],"expectedFilters":["trusted selected eligible exact exit"],"expectedGroupings":[],"expectedOperators":["directional exit move / strict-positive MFE * 100","direction-aware non-negative P-to-X giveback"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected exit grain","expectedContextRequirements":["same exact grain/window/basis","exact E/X/direction","complete compatible candles","separate formula/denominator rules"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Return distinct facts; capture is not derived by subtracting giveback from 100 and neither is clamped."},
{"caseId":"C10-E6-18","caseType":"ambiguous","input":"How much of the move did I capture?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["percentage_of_available_move_captured"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["price-ratio versus realized return/giveback disambiguation","selected exact grain/direction","strict-positive covered MFE"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Do you mean directional exit move as a percentage of candle MFE, realized return, or profit giveback?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ambiguous wording supplies no date, prices, account, direction, candle source, interval or denominator."},
{"caseId":"C10-E6-19","caseType":"negative_example","input":"Does a high move-capture percentage prove I should use the same exit next time?","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["percentage_of_available_move_captured"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no causation, prediction or advice"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Historical move capture does not prove exit quality or prescribe a future exit.","notes":"Reject causal/advisory interpretation while retaining the factual historical ratio boundary."},
{"caseId":"C10-E6-20","caseType":"unsupported_data","input":"Calculate move capture for this combined multi-entry trade with zero candle MFE and a coverage gap.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["percentage_of_available_move_captured"],"expectedFilters":["combined multi-entry trade","zero denominator","candle coverage gap"],"expectedGroupings":[],"expectedOperators":["directional exit move / MFE * 100"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected combined trade","expectedContextRequirements":["approved multi-entry reference/partial-exit contract","strict-positive same-grain MFE","complete compatible candle coverage","exact allocation graph"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Capture is unavailable because combined multi-entry grain is unapproved, MFE is not strictly positive, and candle coverage is incomplete.","notes":"Never divide by zero, return zero percent, choose first/weighted entry silently, interpolate the gap or clamp the result."},
{"caseId":"C10-E6-21","caseType":"selected_entity_context","input":"Show available-move capture for the exact exit selected in replay.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["percentage_of_available_move_captured"],"expectedFilters":["trusted selected replay exact exit"],"expectedGroupings":[],"expectedOperators":["directional exit move / strict-positive MFE * 100","no clamp"],"expectedComparison":null,"expectedTimeRange":"selected entry-to-exit window","expectedSelectedEntity":"trusted server-authorized replay exit grain","expectedContextRequirements":["server-authoritative account scope","exact grain/direction/boundaries","saved source/version/interval/coverage","privacy-safe output"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Trusted selection cannot expose another account or turn replay visuals into missing denominator evidence."},
{"caseId":"C10-E6-22","caseType":"cross_category","input":"Explain the selected exit's move capture beside gross realized P/L without claiming one caused the other.","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["percentage_of_available_move_captured","gross_pnl"],"expectedFilters":["trusted selected ready_closed exit","gross P/L basis"],"expectedGroupings":[],"expectedOperators":["exact unclamped move-capture ratio","separate gross P/L fact","evidence-grounded description"],"expectedComparison":null,"expectedTimeRange":"selected entry-to-exit window","expectedSelectedEntity":"trusted selected exact exit grain","expectedContextRequirements":["Category 10 source/interval/coverage/denominator","Category 2 realized gross basis","no causation or advice","account scope"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Describe separate historical facts only; capture percentage neither causes P/L nor proves exit quality."}
]
```

## 7.8 `entry_distance_from_vwap` Cases

```json
[
{"caseId":"C10-E7-01","caseType":"canonical","input":"Show signed entry distance from Session VWAP for the selected allocation.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["entry_distance_from_vwap"],"expectedFilters":["trusted selected accepted position-increasing allocation"],"expectedGroupings":[],"expectedOperators":["V=cumulative turnover/cumulative volume","E-V"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected entry allocation","expectedContextRequirements":["exact accepted entry price/time","declared exchange session/calendar/extended-hours policy","strictly positive cumulative volume","compatible source/version/interval/coverage/basis"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Signed raw distance is E-V: positive above VWAP and negative below; direction is metadata and never reverses sign."},
{"caseId":"C10-E7-02","caseType":"formal_paraphrase","input":"Calculate entry price minus reconciled cumulative-turnover-over-volume Session VWAP for the selected fill.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["entry_distance_from_vwap"],"expectedFilters":["trusted selected accepted entry allocation"],"expectedGroupings":[],"expectedOperators":["V=sum exact turnover/sum exact volume","E-V"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected entry allocation","expectedContextRequirements":["declared session anchor and source revision","compatible completed candle inputs","strictly positive cumulative volume","exact decimal basis"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Do not accept an arbitrary provider VWAP snapshot or invent turnover/volume."},
{"caseId":"C10-E7-03","caseType":"conversational_paraphrase","input":"How far above or below VWAP was the selected entry?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["entry_distance_from_vwap"],"expectedFilters":["trusted selected accepted entry"],"expectedGroupings":[],"expectedOperators":["E-V"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected entry allocation","expectedContextRequirements":["exact E","reconciled compatible Session VWAP V","declared session/source/interval/coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Above/below is signed market context, not direction-normalized favourability, slippage, causation or quality."},
{"caseId":"C10-E7-04","caseType":"trader_slang","input":"How extended from VWAP was that selected fill, signed distance only?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["entry_distance_from_vwap"],"expectedFilters":["trusted selected accepted entry"],"expectedGroupings":[],"expectedOperators":["E-V"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected entry allocation","expectedContextRequirements":["price-distance interpretation","declared session/VWAP contract","compatible basis/coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Extended is descriptive slang and does not imply chase, mistake, cause or advice."},
{"caseId":"C10-E7-05","caseType":"abbreviation","input":"VWAP dist metric for the selected NVDA entry under its declared session.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["entry_distance_from_vwap"],"expectedFilters":["trusted selected NVDA entry allocation"],"expectedGroupings":[],"expectedOperators":["E-V"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected NVDA entry","expectedContextRequirements":["explicit distance grammar","validated NVDA symbol","declared exchange session/source/interval","positive cumulative volume"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"VWAP alone may request the benchmark; explicit dist grammar selects the distance without inventing session facts."},
{"caseId":"C10-E7-06","caseType":"misspelling","input":"Show entery distnce from vwapp for the selected fill.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["entry_distance_from_vwap"],"expectedFilters":["trusted selected accepted entry"],"expectedGroupings":[],"expectedOperators":["E-V"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected entry allocation","expectedContextRequirements":["clear metric context","exact E","reconciled Session VWAP","compatible coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Normalize spelling without creating a date, session, price, turnover, volume or provider value."},
{"caseId":"C10-E7-07","caseType":"noisy_input","input":"entry vwap diff signed selected fill declared session pls","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["entry_distance_from_vwap"],"expectedFilters":["trusted selected accepted entry"],"expectedGroupings":[],"expectedOperators":["E-V"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected entry allocation","expectedContextRequirements":["trusted session contract","exact entry/VWAP evidence","positive cumulative volume"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Noise does not authorize arbitrary snapshots or private account expansion."},
{"caseId":"C10-E7-08","caseType":"command","input":"Calculate signed E minus Session VWAP for the selected short entry without reversing sign.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["entry_distance_from_vwap"],"expectedFilters":["trusted selected short entry allocation"],"expectedGroupings":[],"expectedOperators":["V=cumulative turnover/cumulative volume","E-V","retain direction without sign flip"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected entry allocation","expectedContextRequirements":["exact E","declared exchange session/extended-hours policy","source/version/interval/coverage","positive volume denominator"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"A short entry above VWAP remains positive; direction-normalized favourability is a separate unapproved concept."},
{"caseId":"C10-E7-09","caseType":"fragment","input":"Selected entry versus Session VWAP percent.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["entry_distance_from_vwap"],"expectedFilters":["trusted selected accepted entry","explicit percentage"],"expectedGroupings":[],"expectedOperators":["((E-V)/V)*100","strictly positive V"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected entry allocation","expectedContextRequirements":["exact E","reconciled V","V strictly positive","declared session/source/coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Percentage is signed and requires strictly positive VWAP; it is not return or slippage."},
{"caseId":"C10-E7-10","caseType":"follow_up","input":"Now show that entry-to-VWAP distance as a signed percentage.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["entry_distance_from_vwap"],"expectedFilters":["prior trusted entry/session context","explicit percentage"],"expectedGroupings":[],"expectedOperators":["((E-V)/V)*100","strictly positive V"],"expectedComparison":null,"expectedTimeRange":"prior trusted scope","expectedSelectedEntity":"prior trusted selected entry","expectedContextRequirements":["trusted prior account/entry/session","unchanged source/interval/basis","positive V"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Follow-up may reuse trusted context only and cannot invent a denominator or session."},
{"caseId":"C10-E7-11","caseType":"correction","input":"I meant signed entry minus VWAP, not direction-normalized favourability.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["entry_distance_from_vwap"],"expectedFilters":["prior trusted entry context","signed raw distance"],"expectedGroupings":[],"expectedOperators":["E-V","metric correction"],"expectedComparison":null,"expectedTimeRange":"prior trusted scope","expectedSelectedEntity":"prior trusted selected entry","expectedContextRequirements":["trusted prior context","reconciled compatible V","declared session contract"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Correction retains the same sign convention for long and short entries."},
{"caseId":"C10-E7-12","caseType":"comparison","input":"Compare signed entry-to-VWAP distance for the two selected entries under compatible session contracts.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["entry_distance_from_vwap"],"expectedFilters":["two trusted selected accepted entries"],"expectedGroupings":[],"expectedOperators":["E-V per entry","comparison"],"expectedComparison":{"left":"selected entry A","right":"selected entry B","basis":"compatible signed VWAP distance"},"expectedTimeRange":null,"expectedSelectedEntity":"two trusted selected entries","expectedContextRequirements":["compatible exchange session/extended-hours policy","compatible source/interval/basis","positive cumulative volume per entry","account scope"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Do not compare arbitrary provider snapshots or mix incompatible session/corporate-action bases."},
{"caseId":"C10-E7-13","caseType":"ranking","input":"Rank selected compatible entries by absolute distance from Session VWAP.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["entry_distance_from_vwap"],"expectedFilters":["trusted selected compatible entries"],"expectedGroupings":[],"expectedOperators":["abs(E-V)","descending rank"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected entry set","expectedContextRequirements":["explicit absolute operator","compatible session/source/interval/basis","approved deterministic ties","account scope"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Absolute rank is explicit; base metric remains signed and ranking does not prove entry quality."},
{"caseId":"C10-E7-14","caseType":"negation","input":"Show signed VWAP distance, not slippage or a provider VWAP field.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["entry_distance_from_vwap"],"expectedFilters":["trusted selected entry","exclude slippage/provider-field meanings"],"expectedGroupings":[],"expectedOperators":["reconciled V","E-V"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected entry allocation","expectedContextRequirements":["exact turnover/volume reconciliation","declared source/session/interval","exact E"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"No quote/order evidence or unreconciled provider benchmark is substituted."},
{"caseId":"C10-E7-15","caseType":"exclusion","input":"Show VWAP distances excluding entries with zero or missing cumulative volume.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["entry_distance_from_vwap"],"expectedFilters":["trusted selected entries","exclude zero/missing cumulative volume"],"expectedGroupings":[],"expectedOperators":["E-V","denominator exclusion"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected entry set","expectedContextRequirements":["turnover/volume coverage","declared session/source/interval","coverage accounting"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Excluded observations remain unavailable coverage and never receive zero or an invented VWAP."},
{"caseId":"C10-E7-16","caseType":"multi_filter","input":"Show signed one-minute entry-to-VWAP distance for selected ready-closed long NVDA entries under the declared extended-hours policy.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["entry_distance_from_vwap"],"expectedFilters":["trusted selected accepted entries","ready_closed","long","NVDA","one-minute","declared extended-hours policy"],"expectedGroupings":[],"expectedOperators":["E-V"],"expectedComparison":null,"expectedTimeRange":"trusted selected scope","expectedSelectedEntity":"trusted selected entry set","expectedContextRequirements":["validated NVDA symbol","approved exchange session/calendar","exact cumulative turnover/volume","source/version/coverage/basis","privacy-safe account scope"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"One-minute and extended-hours policy are explicit; neither is inferred from local time."},
{"caseId":"C10-E7-17","caseType":"multi_part","input":"Show signed entry-to-VWAP distance and containing-candle volume for the selected entry.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["entry_distance_from_vwap","volume_at_entry"],"expectedFilters":["trusted selected accepted entry"],"expectedGroupings":[],"expectedOperators":["E-V","exact containing-interval volume"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected entry allocation","expectedContextRequirements":["same source/interval/basis","VWAP cumulative turnover/volume contract","exact containing-candle mapping","separate coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Return separate benchmark distance and interval volume; containing-candle completion does not prove what was known before the fill."},
{"caseId":"C10-E7-18","caseType":"ambiguous","input":"VWAP at entry?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["entry_distance_from_vwap"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["VWAP price versus signed distance versus percentage disambiguation","selected exact entry","declared session/source/interval"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Do you want the Session VWAP price, signed entry distance, or signed percentage distance?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"No date, account, entry, session, provider or market-data context is invented."},
{"caseId":"C10-E7-19","caseType":"negative_example","input":"Was entering above VWAP a mistake that caused the loss?","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["entry_distance_from_vwap"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no judgement, causation or advice"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Signed historical VWAP distance does not prove a mistake or cause a realized result.","notes":"Reject causal judgement while preserving the factual benchmark boundary."},
{"caseId":"C10-E7-20","caseType":"unsupported_data","input":"Calculate VWAP distance for this combined entry even though turnover, volume, and session policy are missing.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["entry_distance_from_vwap"],"expectedFilters":["combined multi-entry reference","missing turnover/volume/session"],"expectedGroupings":[],"expectedOperators":["E-V"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected combined entry","expectedContextRequirements":["approved combined-entry reference contract","exact cumulative turnover/positive volume","declared exchange session/source/interval","compatible basis"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"VWAP distance is unavailable without an approved combined-entry reference and reconciled turnover/positive-volume/session evidence.","notes":"Never choose first/weighted entry, provider VWAP, zero denominator, local session or invented inputs."},
{"caseId":"C10-E7-21","caseType":"selected_entity_context","input":"Show signed VWAP distance for the entry selected in Candle Review.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["entry_distance_from_vwap"],"expectedFilters":["trusted selected Candle Review entry"],"expectedGroupings":[],"expectedOperators":["E-V"],"expectedComparison":null,"expectedTimeRange":"selected entry session context","expectedSelectedEntity":"trusted server-authorized Candle Review entry","expectedContextRequirements":["server-authoritative account scope","exact selected allocation","declared session/source/interval/coverage","privacy-safe output"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Trusted selection cannot expose another account or replace missing VWAP evidence with chart display."},
{"caseId":"C10-E7-22","caseType":"cross_category","input":"Explain signed entry-to-VWAP distance beside gross P/L without claiming it caused the result.","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["entry_distance_from_vwap","gross_pnl"],"expectedFilters":["trusted selected eligible entry/lifecycle","gross P/L basis"],"expectedGroupings":[],"expectedOperators":["E-V","separate gross P/L fact","evidence-grounded description"],"expectedComparison":null,"expectedTimeRange":"selected lifecycle context","expectedSelectedEntity":"trusted selected lifecycle","expectedContextRequirements":["Category 10 VWAP source/session/coverage","Category 2 gross basis","no causation or advice","account scope"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Describe separate facts only; association does not prove entry quality or cause."}
]
```

## 7.9 `entry_distance_from_high_of_day` Cases

```json
[
{"caseId":"C10-E8-01","caseType":"canonical","input":"Show entry distance from the approved exchange-session high before the selected entry.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["entry_distance_from_high_of_day"],"expectedFilters":["trusted selected accepted entry"],"expectedGroupings":[],"expectedOperators":["D_H=max(E,H_pre)","D_H-E"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected entry allocation","expectedContextRequirements":["approved exchange calendar/session/timezone/extended-hours policy","continuous compatible coverage from session start to entry","fully completed candles wholly before entry","exact E/source/version/interval/basis"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Return non-negative distance to no-lookahead pre-entry session high; direction never reverses the formula."},
{"caseId":"C10-E8-02","caseType":"formal_paraphrase","input":"Calculate max(E,H_pre) minus entry for the selected allocation under its approved exchange-session contract.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["entry_distance_from_high_of_day"],"expectedFilters":["trusted selected accepted entry allocation"],"expectedGroupings":[],"expectedOperators":["D_H=max(E,H_pre)","D_H-E"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected entry allocation","expectedContextRequirements":["approved exchange calendar/session","exchange timezone","declared interval/extended-hours/source","continuous session-start coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"H_pre uses completed candles wholly before entry; the entry-containing candle is excluded for no-lookahead safety."},
{"caseId":"C10-E8-03","caseType":"conversational_paraphrase","input":"How far below the session high was the selected entry?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["entry_distance_from_high_of_day"],"expectedFilters":["trusted selected accepted entry"],"expectedGroupings":[],"expectedOperators":["D_H-E"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected entry allocation","expectedContextRequirements":["approved session high before entry","exact E","continuous compatible coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"This is pre-entry exchange-session context, not later/full-day high, resistance, target, favourability or advice."},
{"caseId":"C10-E8-04","caseType":"trader_slang","input":"How far off the HOD was that selected fill before it went in?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["entry_distance_from_high_of_day"],"expectedFilters":["trusted selected accepted entry"],"expectedGroupings":[],"expectedOperators":["D_H-E"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected entry allocation","expectedContextRequirements":["HOD metric context","approved exchange session","no-lookahead candle coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"HOD slang maps only to the approved pre-entry session high and does not infer chase quality."},
{"caseId":"C10-E8-05","caseType":"abbreviation","input":"HOD distance metric for the selected AAPL entry under its approved exchange session.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["entry_distance_from_high_of_day"],"expectedFilters":["trusted selected AAPL entry"],"expectedGroupings":[],"expectedOperators":["D_H-E"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected AAPL entry","expectedContextRequirements":["explicit HOD-distance grammar","validated AAPL symbol","approved calendar/session/timezone","compatible source/interval/coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"HOD alone can be ambiguous; explicit distance/session grammar prevents ticker/token or full-day fallback."},
{"caseId":"C10-E8-06","caseType":"misspelling","input":"Show entery distnce from hihg of day for the selected fill.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["entry_distance_from_high_of_day"],"expectedFilters":["trusted selected accepted entry"],"expectedGroupings":[],"expectedOperators":["D_H-E"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected entry allocation","expectedContextRequirements":["clear metric context","approved exchange session","exact E and complete pre-entry candles"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Normalize spelling without inventing a date, local bucket, calendar, session or candles."},
{"caseId":"C10-E8-07","caseType":"noisy_input","input":"entry vs hod prefill approved session covered pls","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["entry_distance_from_high_of_day"],"expectedFilters":["trusted selected accepted entry"],"expectedGroupings":[],"expectedOperators":["D_H-E"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected entry allocation","expectedContextRequirements":["approved session contract","session-start coverage","exact entry"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Noise does not authorize a local-date or provider daily-high shortcut."},
{"caseId":"C10-E8-08","caseType":"command","input":"Calculate long entry distance from the completed-candle session high without reversing direction.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["entry_distance_from_high_of_day"],"expectedFilters":["trusted selected long entry"],"expectedGroupings":[],"expectedOperators":["D_H=max(E,H_pre)","D_H-E","retain direction without sign flip"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected entry allocation","expectedContextRequirements":["approved exchange session/calendar","fully completed wholly-pre-entry candles","continuous coverage/source/interval/basis"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Formula is non-negative for both long and short; direction remains a dimension only."},
{"caseId":"C10-E8-09","caseType":"fragment","input":"Selected entry to pre-entry session high percent.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["entry_distance_from_high_of_day"],"expectedFilters":["trusted selected entry","explicit percentage"],"expectedGroupings":[],"expectedOperators":["((D_H-E)/D_H)*100","strictly positive D_H"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected entry allocation","expectedContextRequirements":["covered D_H","D_H strictly positive","approved session/source/interval"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Percentage denominator is declared session-high endpoint, not entry, later daily high or return basis."},
{"caseId":"C10-E8-10","caseType":"follow_up","input":"Now show that high-of-day distance as a percentage on the same session contract.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["entry_distance_from_high_of_day"],"expectedFilters":["prior trusted entry/session","explicit percentage"],"expectedGroupings":[],"expectedOperators":["((D_H-E)/D_H)*100","strictly positive D_H"],"expectedComparison":null,"expectedTimeRange":"prior trusted scope","expectedSelectedEntity":"prior trusted selected entry","expectedContextRequirements":["trusted prior context","unchanged calendar/session/source/interval/basis","positive D_H"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Follow-up cannot invent a calendar/session or reuse incompatible prior market data."},
{"caseId":"C10-E8-11","caseType":"correction","input":"I meant the high observed before entry, not the later full-day high.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["entry_distance_from_high_of_day"],"expectedFilters":["prior trusted selected entry","exclude later/full-day high"],"expectedGroupings":[],"expectedOperators":["D_H-E","metric correction"],"expectedComparison":null,"expectedTimeRange":"prior trusted scope","expectedSelectedEntity":"prior trusted selected entry","expectedContextRequirements":["trusted prior context","approved exchange session","no-lookahead pre-entry coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Correction excludes entry-containing and later candles and preserves the exact entry baseline."},
{"caseId":"C10-E8-12","caseType":"comparison","input":"Compare entry-to-session-high distance for two selected entries with compatible exchange-session contracts.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["entry_distance_from_high_of_day"],"expectedFilters":["two trusted selected entries"],"expectedGroupings":[],"expectedOperators":["D_H-E per entry","comparison"],"expectedComparison":{"left":"selected entry A","right":"selected entry B","basis":"compatible pre-entry session-high distance"},"expectedTimeRange":null,"expectedSelectedEntity":"two trusted selected entries","expectedContextRequirements":["same calendar/session/extended-hours policy","compatible source/interval/basis","complete session-start coverage per entry","account scope"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"No local trading-date or mixed-session comparison is allowed."},
{"caseId":"C10-E8-13","caseType":"ranking","input":"Rank selected compatible entries by distance below their pre-entry session highs.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["entry_distance_from_high_of_day"],"expectedFilters":["trusted selected compatible entries"],"expectedGroupings":[],"expectedOperators":["D_H-E per entry","descending rank"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected entry set","expectedContextRequirements":["compatible calendar/session/source/interval/basis","continuous coverage","approved ties","account scope"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ranking is descriptive and does not label entries good/bad or recommend action."},
{"caseId":"C10-E8-14","caseType":"negation","input":"Show pre-entry session-high distance, not local-day high or maximum favourable price.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["entry_distance_from_high_of_day"],"expectedFilters":["trusted selected entry","exclude local-day/held-window meanings"],"expectedGroupings":[],"expectedOperators":["D_H-E"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected entry allocation","expectedContextRequirements":["approved exchange session","continuous pre-entry coverage","exact E"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Do not substitute a local bucket, later high, target or held-window endpoint."},
{"caseId":"C10-E8-15","caseType":"exclusion","input":"Show session-high distances excluding entries without continuous session-start coverage.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["entry_distance_from_high_of_day"],"expectedFilters":["trusted selected entries","exclude incomplete session-start coverage"],"expectedGroupings":[],"expectedOperators":["D_H-E","coverage exclusion"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected entry set","expectedContextRequirements":["coverage/gap detection","approved calendar/session/source/interval","coverage accounting"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Excluded entries remain unavailable coverage and never receive a local-bucket high or zero."},
{"caseId":"C10-E8-16","caseType":"multi_filter","input":"Show one-minute entry-to-session-high distance for selected ready-closed short MSFT entries under the approved regular session.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["entry_distance_from_high_of_day"],"expectedFilters":["trusted selected entries","ready_closed","short","MSFT","one-minute","approved regular session"],"expectedGroupings":[],"expectedOperators":["D_H-E"],"expectedComparison":null,"expectedTimeRange":"trusted selected scope","expectedSelectedEntity":"trusted selected entry set","expectedContextRequirements":["validated MSFT symbol","approved exchange calendar/timezone","session-start coverage","source/version/corporate-action basis","privacy-safe scope"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Direction does not reverse formula; one-minute and regular session are explicit rather than inferred."},
{"caseId":"C10-E8-17","caseType":"multi_part","input":"Show entry distance from pre-entry session high and maximum favourable price for the selected lifecycle.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["entry_distance_from_high_of_day","maximum_favourable_price"],"expectedFilters":["trusted selected eligible lifecycle"],"expectedGroupings":[],"expectedOperators":["D_H-E","direction-aware held-window favourable endpoint"],"expectedComparison":null,"expectedTimeRange":"selected lifecycle context","expectedSelectedEntity":"trusted selected lifecycle","expectedContextRequirements":["separate pre-entry and held-window boundaries","compatible but distinct coverage windows","exact source/interval/basis"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Do not merge the no-lookahead pre-entry session high with the later held-window endpoint."},
{"caseId":"C10-E8-18","caseType":"ambiguous","input":"Distance from HOD?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["entry_distance_from_high_of_day"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["entry versus other reference clarification","pre-entry versus full-day high","approved session/calendar"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Do you mean the selected entry's distance from the approved session high observed before entry?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"No date, entry, exchange calendar, local bucket or candle coverage is invented."},
{"caseId":"C10-E8-19","caseType":"negative_example","input":"Does entering near the session high prove the trade was a bad chase?","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["entry_distance_from_high_of_day"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no judgement, causation or advice"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Historical distance from the pre-entry session high does not prove chase quality or cause an outcome.","notes":"Reject causal judgement and trading advice."},
{"caseId":"C10-E8-20","caseType":"unsupported_data","input":"Calculate entry-to-HOD distance without an approved exchange calendar or complete session-start candles.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["entry_distance_from_high_of_day"],"expectedFilters":["missing approved calendar/session","incomplete session-start coverage"],"expectedGroupings":[],"expectedOperators":["D_H-E"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected entry","expectedContextRequirements":["approved exchange calendar/session/timezone","continuous compatible coverage","exact entry/source/interval/basis"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"The pre-entry session high is unavailable without an approved calendar/session contract and continuous coverage from session start.","notes":"Never fall back to account-local date, a provider daily high, later candles or invented coverage."},
{"caseId":"C10-E8-21","caseType":"selected_entity_context","input":"Show HOD distance for the entry selected in replay.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["entry_distance_from_high_of_day"],"expectedFilters":["trusted selected replay entry"],"expectedGroupings":[],"expectedOperators":["D_H-E"],"expectedComparison":null,"expectedTimeRange":"selected entry session context","expectedSelectedEntity":"trusted server-authorized replay entry","expectedContextRequirements":["server-authoritative account scope","approved exchange calendar/session","exact selected entry/source/coverage","privacy-safe output"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Trusted selection cannot expose another account or substitute chart labels for session evidence."},
{"caseId":"C10-E8-22","caseType":"cross_category","input":"Explain entry-to-session-high distance beside gross P/L without saying proximity caused the result.","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["entry_distance_from_high_of_day","gross_pnl"],"expectedFilters":["trusted selected eligible entry/lifecycle","gross P/L basis"],"expectedGroupings":[],"expectedOperators":["D_H-E","separate gross P/L fact","evidence-grounded description"],"expectedComparison":null,"expectedTimeRange":"selected lifecycle context","expectedSelectedEntity":"trusted selected lifecycle","expectedContextRequirements":["Category 10 exchange-session/source coverage","Category 2 gross basis","no causation or advice","account scope"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Describe separate facts only; session-high distance neither causes P/L nor proves entry quality."}
]
```

## 7.10 `entry_distance_from_low_of_day` Cases

```json
[
{"caseId":"C10-E9-01","caseType":"canonical","input":"Show entry distance from the approved exchange-session low before the selected entry.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["entry_distance_from_low_of_day"],"expectedFilters":["trusted selected accepted entry"],"expectedGroupings":[],"expectedOperators":["D_L=min(E,L_pre)","E-D_L"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected entry allocation","expectedContextRequirements":["approved exchange calendar/session/timezone/extended-hours policy","continuous compatible coverage from session start to entry","fully completed candles wholly before entry","exact E/source/version/interval/basis"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Return non-negative distance above no-lookahead pre-entry session low; direction never reverses the formula."},
{"caseId":"C10-E9-02","caseType":"formal_paraphrase","input":"Calculate entry minus min(E,L_pre) for the selected allocation under its approved exchange-session contract.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["entry_distance_from_low_of_day"],"expectedFilters":["trusted selected accepted entry allocation"],"expectedGroupings":[],"expectedOperators":["D_L=min(E,L_pre)","E-D_L"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected entry allocation","expectedContextRequirements":["approved exchange calendar/session","exchange timezone","declared interval/extended-hours/source","continuous session-start coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"L_pre uses completed candles wholly before entry; entry-containing candle is excluded for no-lookahead safety."},
{"caseId":"C10-E9-03","caseType":"conversational_paraphrase","input":"How far above the session low was the selected entry?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["entry_distance_from_low_of_day"],"expectedFilters":["trusted selected accepted entry"],"expectedGroupings":[],"expectedOperators":["E-D_L"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected entry allocation","expectedContextRequirements":["approved session low before entry","exact E","continuous compatible coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"This is pre-entry session context, not later/full-day low, support, stop, adverse endpoint or advice."},
{"caseId":"C10-E9-04","caseType":"trader_slang","input":"How far off the LOD was that selected fill before it went in?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["entry_distance_from_low_of_day"],"expectedFilters":["trusted selected accepted entry"],"expectedGroupings":[],"expectedOperators":["E-D_L"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected entry allocation","expectedContextRequirements":["LOD metric context","approved exchange session","no-lookahead candle coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"LOD slang maps only to the approved pre-entry session low and does not infer entry quality."},
{"caseId":"C10-E9-05","caseType":"abbreviation","input":"LOD distance metric for the selected TSLA entry under its approved exchange session.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["entry_distance_from_low_of_day"],"expectedFilters":["trusted selected TSLA entry"],"expectedGroupings":[],"expectedOperators":["E-D_L"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected TSLA entry","expectedContextRequirements":["explicit LOD-distance grammar","validated TSLA symbol","approved calendar/session/timezone","compatible source/interval/coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"LOD alone can be ambiguous; explicit distance/session grammar prevents token or full-day fallback."},
{"caseId":"C10-E9-06","caseType":"misspelling","input":"Show entery distnce from loe of day for the selected fill.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["entry_distance_from_low_of_day"],"expectedFilters":["trusted selected accepted entry"],"expectedGroupings":[],"expectedOperators":["E-D_L"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected entry allocation","expectedContextRequirements":["clear metric context","approved exchange session","exact E and complete pre-entry candles"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Normalize spelling without inventing a date, local bucket, calendar, session or candles."},
{"caseId":"C10-E9-07","caseType":"noisy_input","input":"entry vs lod prefill approved session covered pls","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["entry_distance_from_low_of_day"],"expectedFilters":["trusted selected accepted entry"],"expectedGroupings":[],"expectedOperators":["E-D_L"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected entry allocation","expectedContextRequirements":["approved session contract","session-start coverage","exact entry"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Noise does not authorize a local-date or provider daily-low shortcut."},
{"caseId":"C10-E9-08","caseType":"command","input":"Calculate short entry distance from the completed-candle session low without reversing direction.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["entry_distance_from_low_of_day"],"expectedFilters":["trusted selected short entry"],"expectedGroupings":[],"expectedOperators":["D_L=min(E,L_pre)","E-D_L","retain direction without sign flip"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected entry allocation","expectedContextRequirements":["approved exchange session/calendar","fully completed wholly-pre-entry candles","continuous coverage/source/interval/basis"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Formula is non-negative for both long and short; direction remains a dimension only."},
{"caseId":"C10-E9-09","caseType":"fragment","input":"Selected entry to pre-entry session low percent.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["entry_distance_from_low_of_day"],"expectedFilters":["trusted selected entry","explicit percentage"],"expectedGroupings":[],"expectedOperators":["((E-D_L)/D_L)*100","strictly positive D_L"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected entry allocation","expectedContextRequirements":["covered D_L","D_L strictly positive","approved session/source/interval"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Percentage denominator is declared session-low endpoint, not entry, later daily low or return basis."},
{"caseId":"C10-E9-10","caseType":"follow_up","input":"Now show that low-of-day distance as a percentage on the same session contract.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["entry_distance_from_low_of_day"],"expectedFilters":["prior trusted entry/session","explicit percentage"],"expectedGroupings":[],"expectedOperators":["((E-D_L)/D_L)*100","strictly positive D_L"],"expectedComparison":null,"expectedTimeRange":"prior trusted scope","expectedSelectedEntity":"prior trusted selected entry","expectedContextRequirements":["trusted prior context","unchanged calendar/session/source/interval/basis","positive D_L"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Follow-up cannot invent a calendar/session or reuse incompatible market data."},
{"caseId":"C10-E9-11","caseType":"correction","input":"I meant the low observed before entry, not the later full-day low.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["entry_distance_from_low_of_day"],"expectedFilters":["prior trusted selected entry","exclude later/full-day low"],"expectedGroupings":[],"expectedOperators":["E-D_L","metric correction"],"expectedComparison":null,"expectedTimeRange":"prior trusted scope","expectedSelectedEntity":"prior trusted selected entry","expectedContextRequirements":["trusted prior context","approved exchange session","no-lookahead pre-entry coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Correction excludes entry-containing and later candles and preserves exact entry baseline."},
{"caseId":"C10-E9-12","caseType":"comparison","input":"Compare entry-to-session-low distance for two selected entries with compatible exchange-session contracts.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["entry_distance_from_low_of_day"],"expectedFilters":["two trusted selected entries"],"expectedGroupings":[],"expectedOperators":["E-D_L per entry","comparison"],"expectedComparison":{"left":"selected entry A","right":"selected entry B","basis":"compatible pre-entry session-low distance"},"expectedTimeRange":null,"expectedSelectedEntity":"two trusted selected entries","expectedContextRequirements":["same calendar/session/extended-hours policy","compatible source/interval/basis","complete session-start coverage per entry","account scope"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"No local trading-date or mixed-session comparison is allowed."},
{"caseId":"C10-E9-13","caseType":"ranking","input":"Rank selected compatible entries by distance above their pre-entry session lows.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["entry_distance_from_low_of_day"],"expectedFilters":["trusted selected compatible entries"],"expectedGroupings":[],"expectedOperators":["E-D_L per entry","descending rank"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected entry set","expectedContextRequirements":["compatible calendar/session/source/interval/basis","continuous coverage","approved ties","account scope"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ranking is descriptive and does not label entries good/bad or recommend action."},
{"caseId":"C10-E9-14","caseType":"negation","input":"Show pre-entry session-low distance, not local-day low or maximum adverse price.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["entry_distance_from_low_of_day"],"expectedFilters":["trusted selected entry","exclude local-day/held-window meanings"],"expectedGroupings":[],"expectedOperators":["E-D_L"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected entry allocation","expectedContextRequirements":["approved exchange session","continuous pre-entry coverage","exact E"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Do not substitute local bucket, later low, stop or held-window endpoint."},
{"caseId":"C10-E9-15","caseType":"exclusion","input":"Show session-low distances excluding entries without continuous session-start coverage.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["entry_distance_from_low_of_day"],"expectedFilters":["trusted selected entries","exclude incomplete session-start coverage"],"expectedGroupings":[],"expectedOperators":["E-D_L","coverage exclusion"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected entry set","expectedContextRequirements":["coverage/gap detection","approved calendar/session/source/interval","coverage accounting"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Excluded entries remain unavailable coverage and never receive a local-bucket low or zero."},
{"caseId":"C10-E9-16","caseType":"multi_filter","input":"Show five-minute entry-to-session-low distance for selected ready-closed long AMD entries under the approved regular session.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["entry_distance_from_low_of_day"],"expectedFilters":["trusted selected entries","ready_closed","long","AMD","five-minute","approved regular session"],"expectedGroupings":[],"expectedOperators":["E-D_L"],"expectedComparison":null,"expectedTimeRange":"trusted selected scope","expectedSelectedEntity":"trusted selected entry set","expectedContextRequirements":["validated AMD symbol","approved exchange calendar/timezone","session-start coverage","source/version/corporate-action basis","privacy-safe scope"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Direction does not reverse formula; five-minute and regular session are explicit rather than inferred."},
{"caseId":"C10-E9-17","caseType":"multi_part","input":"Show entry distance from pre-entry session low and maximum adverse price for the selected lifecycle.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["entry_distance_from_low_of_day","maximum_adverse_price"],"expectedFilters":["trusted selected eligible lifecycle"],"expectedGroupings":[],"expectedOperators":["E-D_L","direction-aware held-window adverse endpoint"],"expectedComparison":null,"expectedTimeRange":"selected lifecycle context","expectedSelectedEntity":"trusted selected lifecycle","expectedContextRequirements":["separate pre-entry and held-window boundaries","compatible but distinct coverage windows","exact source/interval/basis"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Do not merge no-lookahead pre-entry session low with later held-window endpoint."},
{"caseId":"C10-E9-18","caseType":"ambiguous","input":"Distance from LOD?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["entry_distance_from_low_of_day"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["entry versus other reference clarification","pre-entry versus full-day low","approved session/calendar"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Do you mean the selected entry's distance from the approved session low observed before entry?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"No date, entry, exchange calendar, local bucket or candle coverage is invented."},
{"caseId":"C10-E9-19","caseType":"negative_example","input":"Does entering far above the session low prove my entry was wrong?","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["entry_distance_from_low_of_day"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no judgement, causation or advice"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Historical distance from the pre-entry session low does not prove an entry was wrong or cause an outcome.","notes":"Reject causal judgement and trading advice."},
{"caseId":"C10-E9-20","caseType":"unsupported_data","input":"Calculate entry-to-LOD distance without an approved exchange calendar or full session-start coverage.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["entry_distance_from_low_of_day"],"expectedFilters":["missing approved calendar/session","incomplete session-start coverage"],"expectedGroupings":[],"expectedOperators":["E-D_L"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected entry","expectedContextRequirements":["approved exchange calendar/session/timezone","continuous compatible coverage","exact entry/source/interval/basis"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"The pre-entry session low is unavailable without an approved calendar/session contract and continuous coverage from session start.","notes":"Never fall back to account-local date, provider daily low, later candles or invented coverage."},
{"caseId":"C10-E9-21","caseType":"selected_entity_context","input":"Show LOD distance for the entry selected in Candle Review.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["entry_distance_from_low_of_day"],"expectedFilters":["trusted selected Candle Review entry"],"expectedGroupings":[],"expectedOperators":["E-D_L"],"expectedComparison":null,"expectedTimeRange":"selected entry session context","expectedSelectedEntity":"trusted server-authorized Candle Review entry","expectedContextRequirements":["server-authoritative account scope","approved exchange calendar/session","exact selected entry/source/coverage","privacy-safe output"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Trusted selection cannot expose another account or substitute chart labels for session evidence."},
{"caseId":"C10-E9-22","caseType":"cross_category","input":"Explain entry-to-session-low distance beside gross P/L without saying distance caused the result.","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["entry_distance_from_low_of_day","gross_pnl"],"expectedFilters":["trusted selected eligible entry/lifecycle","gross P/L basis"],"expectedGroupings":[],"expectedOperators":["E-D_L","separate gross P/L fact","evidence-grounded description"],"expectedComparison":null,"expectedTimeRange":"selected lifecycle context","expectedSelectedEntity":"trusted selected lifecycle","expectedContextRequirements":["Category 10 exchange-session/source coverage","Category 2 gross basis","no causation or advice","account scope"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Describe separate facts only; session-low distance neither causes P/L nor proves entry quality."}
]
```

## 7.11 `volume_at_entry` Cases

```json
[
{"caseId":"C10-E10-01","caseType":"canonical","input":"Show full containing-candle volume for the selected entry.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["volume_at_entry"],"expectedFilters":["trusted selected accepted entry allocation"],"expectedGroupings":[],"expectedOperators":["resolve exactly one containing candle","return exact non-negative full-interval volume"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected entry allocation","expectedContextRequirements":["exact accepted entry UTC","declared candle timestamp semantics","one unambiguous saved source/version/interval","compatible instrument/unit/corporate-action basis"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Return complete entry-containing candle volume, not volume known before the fill or executed quantity."},
{"caseId":"C10-E10-02","caseType":"formal_paraphrase","input":"Resolve the normalized candle interval containing the selected exact entry instant and return its full market volume.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["volume_at_entry"],"expectedFilters":["trusted selected accepted entry allocation"],"expectedGroupings":[],"expectedOperators":["timestamp-containment resolution","exact full-interval volume"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected entry allocation","expectedContextRequirements":["exact entry UTC/version","declared half-open/closed timestamp rule","candle identity/source/interval/coverage","non-negative normalized volume"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Containing candle cannot reveal what share of interval volume occurred before versus after entry."},
{"caseId":"C10-E10-03","caseType":"conversational_paraphrase","input":"What was the market volume on the candle where the selected entry happened?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["volume_at_entry"],"expectedFilters":["trusted selected accepted entry"],"expectedGroupings":[],"expectedOperators":["full containing-candle volume"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected entry allocation","expectedContextRequirements":["exact entry UTC","one compatible containing candle","source/interval/unit coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Market volume is distinct from shares bought, cumulative volume, turnover, RVOL, liquidity or fillability."},
{"caseId":"C10-E10-04","caseType":"trader_slang","input":"What volume did I enter into on that selected fill?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["volume_at_entry"],"expectedFilters":["trusted selected accepted entry"],"expectedGroupings":[],"expectedOperators":["full containing-candle volume"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected entry allocation","expectedContextRequirements":["market-candle context","exact entry/candle mapping","declared source/interval"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Slang maps to full interval market volume with the intrabar-sequence caveat, not liquidity quality."},
{"caseId":"C10-E10-05","caseType":"abbreviation","input":"Entry-candle vol metric for the selected AMD fill.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["volume_at_entry"],"expectedFilters":["trusted selected AMD entry"],"expectedGroupings":[],"expectedOperators":["full containing-candle volume"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected AMD entry","expectedContextRequirements":["explicit market-volume grammar","validated AMD symbol","exact entry/candle mapping","source/interval/coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Explicit grammar distinguishes entry vol from VE/EVol ticker-like tokens and execution quantity."},
{"caseId":"C10-E10-06","caseType":"misspelling","input":"Show volum at entery for the selected candle-mapped fill.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["volume_at_entry"],"expectedFilters":["trusted selected accepted entry"],"expectedGroupings":[],"expectedOperators":["full containing-candle volume"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected entry allocation","expectedContextRequirements":["clear metric context","exact entry UTC","compatible candle evidence"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Normalize spelling without inventing a date, interval, volume, unit, candle or provider."},
{"caseId":"C10-E10-07","caseType":"noisy_input","input":"vol @ selected fill full candle source pls","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["volume_at_entry"],"expectedFilters":["trusted selected accepted entry"],"expectedGroupings":[],"expectedOperators":["full containing-candle volume"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected entry allocation","expectedContextRequirements":["exact entry/candle identity","declared source/interval/timestamp semantics","coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Noise does not authorize pre-fill volume claims or private account expansion."},
{"caseId":"C10-E10-08","caseType":"command","input":"Return exact one-minute containing-candle volume for the selected entry.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["volume_at_entry"],"expectedFilters":["trusted selected accepted entry","one-minute interval"],"expectedGroupings":[],"expectedOperators":["resolve exact containing candle","return full interval volume"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected entry allocation","expectedContextRequirements":["one-minute source/version","timestamp boundary semantics","exact entry UTC","compatible instrument/unit/basis"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"One-minute is explicit; result still includes volume after the entry within that candle."},
{"caseId":"C10-E10-09","caseType":"fragment","input":"Selected entry, full five-minute candle volume.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["volume_at_entry"],"expectedFilters":["trusted selected accepted entry","five-minute interval"],"expectedGroupings":[],"expectedOperators":["full containing-candle volume"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected entry allocation","expectedContextRequirements":["exact entry/candle mapping","declared five-minute source/coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Never substitute preferred one-minute data or relabel normalized units without instrument semantics."},
{"caseId":"C10-E10-10","caseType":"follow_up","input":"Now show volume for that same entry candle and interval.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["volume_at_entry"],"expectedFilters":["prior trusted entry/candle context"],"expectedGroupings":[],"expectedOperators":["full containing-candle volume"],"expectedComparison":null,"expectedTimeRange":"prior trusted scope","expectedSelectedEntity":"prior trusted selected entry","expectedContextRequirements":["trusted prior account/entry","unchanged source/version/interval/basis","exact candle identity"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Follow-up reuses only trusted context and never invents a candle or volume."},
{"caseId":"C10-E10-11","caseType":"correction","input":"I meant market candle volume, not the quantity I bought.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["volume_at_entry"],"expectedFilters":["prior trusted selected entry","exclude execution quantity"],"expectedGroupings":[],"expectedOperators":["full containing-candle volume","metric correction"],"expectedComparison":null,"expectedTimeRange":"prior trusted scope","expectedSelectedEntity":"prior trusted selected entry","expectedContextRequirements":["trusted prior context","exact containing candle","market-volume unit semantics"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Correction does not convert market volume to execution or position size."},
{"caseId":"C10-E10-12","caseType":"comparison","input":"Compare containing-candle volume for two selected entries on the same instrument and interval.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["volume_at_entry"],"expectedFilters":["two trusted selected accepted entries"],"expectedGroupings":[],"expectedOperators":["full volume per unique candle","comparison"],"expectedComparison":{"left":"selected entry A candle","right":"selected entry B candle","basis":"compatible normalized market volume"},"expectedTimeRange":null,"expectedSelectedEntity":"two trusted selected entries","expectedContextRequirements":["same instrument/unit/interval/session/source/basis","unambiguous candle identity","account scope"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"If both entries share a candle, report one market-volume fact rather than two independent samples."},
{"caseId":"C10-E10-13","caseType":"ranking","input":"Rank selected compatible entry candles by full interval market volume.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["volume_at_entry"],"expectedFilters":["trusted selected compatible entry candles"],"expectedGroupings":[],"expectedOperators":["deduplicate candle identity","descending rank"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected entry set","expectedContextRequirements":["compatible instrument/unit/interval/source/basis","unique candle identities","approved ties","account scope"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ranking does not infer relative volume, liquidity, entry quality, cause or advice."},
{"caseId":"C10-E10-14","caseType":"negation","input":"Show full entry-candle volume, not shares bought or volume before the fill.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["volume_at_entry"],"expectedFilters":["trusted selected entry","exclude execution/pre-fill meanings"],"expectedGroupings":[],"expectedOperators":["full containing-candle volume"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected entry allocation","expectedContextRequirements":["exact containing candle","declared timestamp semantics","source/interval/coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"OHLCV cannot establish the pre-entry versus post-entry volume split."},
{"caseId":"C10-E10-15","caseType":"exclusion","input":"Show entry volume excluding entries without exactly one valid containing candle.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["volume_at_entry"],"expectedFilters":["trusted selected entries","exclude missing/overlapping/ambiguous candles"],"expectedGroupings":[],"expectedOperators":["exact containing-candle resolution","coverage exclusion"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected entry set","expectedContextRequirements":["timestamp boundary validation","source/interval coverage","coverage accounting"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Excluded entries stay unavailable coverage and never receive zero or a nearest candle."},
{"caseId":"C10-E10-16","caseType":"multi_filter","input":"Show one-minute volume at entry for selected ready-closed long AAPL entries under the declared extended-session policy.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["volume_at_entry"],"expectedFilters":["trusted selected entries","ready_closed","long","AAPL","one-minute","declared extended session"],"expectedGroupings":[],"expectedOperators":["full containing-candle volume"],"expectedComparison":null,"expectedTimeRange":"trusted selected scope","expectedSelectedEntity":"trusted selected entry set","expectedContextRequirements":["validated AAPL symbol","exact entry UTC/candle identity","source/version/coverage/corporate-action basis","privacy-safe account scope"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Filters cannot invent candles, units, session facts or another account's data."},
{"caseId":"C10-E10-17","caseType":"multi_part","input":"Show volume at entry and relative volume for the selected fill.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["volume_at_entry","relative_volume"],"expectedFilters":["trusted selected accepted entry"],"expectedGroupings":[],"expectedOperators":["full containing-candle volume","relative-volume unavailable boundary"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected entry allocation","expectedContextRequirements":["exact containing candle","separate approved-denominator requirement","distinct capability states"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Return raw covered volume and a separate unavailable RVOL result; never infer normal volume."},
{"caseId":"C10-E10-18","caseType":"ambiguous","input":"Entry volume?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["volume_at_entry"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["market candle versus execution/cumulative/relative volume clarification","selected exact entry","saved interval"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Do you mean full market volume of the entry candle or your executed quantity?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"No date, entry, account, interval, candle or market-volume fact is invented."},
{"caseId":"C10-E10-19","caseType":"negative_example","input":"Does high entry-candle volume prove the market was liquid and my entry was good?","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["volume_at_entry"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no liquidity inference, causation or advice"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Containing-candle volume alone does not prove liquidity, entry quality or causation.","notes":"Reject quality/advice claims while preserving the raw observation boundary."},
{"caseId":"C10-E10-20","caseType":"unsupported_data","input":"Return volume at entry even though the exact UTC maps to two overlapping candles.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["volume_at_entry"],"expectedFilters":["ambiguous overlapping candle mapping"],"expectedGroupings":[],"expectedOperators":["exact containing-candle resolution"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected entry","expectedContextRequirements":["one unambiguous candle","declared timestamp semantics","compatible source/version/interval/basis"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Volume at entry is unavailable because the exact entry instant does not resolve to exactly one compatible containing candle.","notes":"Never choose nearest/first candle, merge overlapping volumes or invent a result."},
{"caseId":"C10-E10-21","caseType":"selected_entity_context","input":"Show entry-candle volume for the fill selected in replay.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["volume_at_entry"],"expectedFilters":["trusted selected replay fill"],"expectedGroupings":[],"expectedOperators":["full containing-candle volume"],"expectedComparison":null,"expectedTimeRange":"selected entry interval","expectedSelectedEntity":"trusted server-authorized replay entry","expectedContextRequirements":["server-authoritative account scope","exact entry/candle mapping","saved source/version/interval/coverage","privacy-safe output"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Trusted selection cannot expose another account or replace missing candle evidence with chart display."},
{"caseId":"C10-E10-22","caseType":"cross_category","input":"Explain entry-candle volume beside gross P/L without saying volume caused the result.","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["volume_at_entry","gross_pnl"],"expectedFilters":["trusted selected eligible entry/lifecycle","gross P/L basis"],"expectedGroupings":[],"expectedOperators":["full containing-candle volume","separate gross P/L fact","evidence-grounded description"],"expectedComparison":null,"expectedTimeRange":"selected lifecycle context","expectedSelectedEntity":"trusted selected lifecycle","expectedContextRequirements":["Category 10 candle identity/source coverage","Category 2 gross basis","no causation or advice","account scope"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Describe separate historical facts only; volume does not prove liquidity or cause P/L."}
]
```

## 7.12 `relative_volume` Cases

```json
[
{"caseId":"C10-E11-01","caseType":"canonical","input":"Show canonical relative volume for the selected entry interval.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["relative_volume"],"expectedFilters":["trusted selected entry interval"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected entry interval","expectedContextRequirements":["approved numerator","strictly positive expected-volume denominator","versioned comparison population/lookback/session alignment","source/interval/corporate-action coverage"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Canonical relative volume is unavailable because no comparison population or expected-volume denominator is approved.","notes":"Do not substitute provider RVOL, raw volume, daily average, turnover or a guessed baseline."},
{"caseId":"C10-E11-02","caseType":"formal_paraphrase","input":"Calculate observed volume divided by approved aligned expected volume for the selected interval.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["relative_volume"],"expectedFilters":["trusted selected interval"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected interval","expectedContextRequirements":["approved observed numerator","strict-positive denominator","aligned session/interval position","comparison-population version"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"The requested ratio cannot be calculated because its canonical numerator/denominator and alignment contract are unapproved.","notes":"Formal ratio wording does not create the missing denominator."},
{"caseId":"C10-E11-03","caseType":"conversational_paraphrase","input":"How did the selected entry candle's volume compare with normal?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["relative_volume"],"expectedFilters":["trusted selected entry candle"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected entry candle","expectedContextRequirements":["approved definition of normal","strict-positive expected-volume denominator","compatible session/source/interval"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Normal volume is undefined because no canonical comparison denominator or population is approved.","notes":"Covered raw volume may be available separately but cannot become RVOL."},
{"caseId":"C10-E11-04","caseType":"trader_slang","input":"What was RVOL on that selected entry candle?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["relative_volume"],"expectedFilters":["trusted selected entry candle"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected entry candle","expectedContextRequirements":["approved RVOL denominator and comparison set"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"RVOL is unavailable because the canonical baseline and denominator are absent.","notes":"Trader slang does not authorize a provider-specific fallback."},
{"caseId":"C10-E11-05","caseType":"abbreviation","input":"RVOL relative-volume metric for the selected AMD interval.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["relative_volume"],"expectedFilters":["trusted selected AMD interval"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected AMD interval","expectedContextRequirements":["explicit metric grammar","validated AMD symbol","approved denominator/session alignment"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Explicit RVOL grammar identifies the unavailable metric but does not supply an approved denominator.","notes":"Bare RVOL remains ticker/token-like; neither form activates a numeric fallback."},
{"caseId":"C10-E11-06","caseType":"misspelling","input":"Show reltive volme for the selected interval.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["relative_volume"],"expectedFilters":["trusted selected interval"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected interval","expectedContextRequirements":["approved denominator/comparison population"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Relative volume remains unavailable after spelling normalization because its comparison contract is absent.","notes":"Do not invent dates, lookbacks, averages or source facts."},
{"caseId":"C10-E11-07","caseType":"noisy_input","input":"rvol selected entry vs normal pls","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["relative_volume"],"expectedFilters":["trusted selected entry"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected entry","expectedContextRequirements":["defined normal-volume denominator","approved session/interval alignment"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"The noisy request lacks the approved expected-volume denominator required for RVOL.","notes":"Noise does not create a baseline or broaden private scope."},
{"caseId":"C10-E11-08","caseType":"command","input":"Calculate canonical RVOL for the selected candle.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["relative_volume"],"expectedFilters":["trusted selected candle"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected candle","expectedContextRequirements":["approved numerator/strict-positive denominator/version"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"No executable canonical RVOL operator exists until its denominator contract is approved.","notes":"Return the missing-denominator boundary, not a numeric result."},
{"caseId":"C10-E11-09","caseType":"fragment","input":"Selected entry RVOL versus usual volume.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["relative_volume"],"expectedFilters":["trusted selected entry"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected entry","expectedContextRequirements":["approved usual-volume definition and denominator"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Usual volume has no approved population, alignment, aggregation or denominator.","notes":"No default lookback or average is inferred."},
{"caseId":"C10-E11-10","caseType":"follow_up","input":"Use the prior selected interval and show its RVOL.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["relative_volume"],"expectedFilters":["prior trusted selected interval"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":"prior trusted scope","expectedSelectedEntity":"prior trusted selected interval","expectedContextRequirements":["trusted prior scope","approved RVOL denominator/version"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Trusted prior context cannot repair the absent approved relative-volume denominator.","notes":"Follow-up never adopts a provider field or guessed baseline."},
{"caseId":"C10-E11-11","caseType":"correction","input":"I meant relative volume, not raw volume at entry.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["relative_volume"],"expectedFilters":["prior trusted selected interval","exclude raw volume"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":"prior trusted scope","expectedSelectedEntity":"prior trusted selected interval","expectedContextRequirements":["approved comparison denominator","trusted prior context"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"The correction selects relative volume, which remains unavailable without an approved denominator.","notes":"Do not return raw volume as if it were RVOL."},
{"caseId":"C10-E11-12","caseType":"comparison","input":"Compare RVOL for the two selected entries.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["relative_volume"],"expectedFilters":["two trusted selected entries"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":{"left":"selected entry A","right":"selected entry B","basis":"canonical RVOL"},"expectedTimeRange":null,"expectedSelectedEntity":"two trusted selected entries","expectedContextRequirements":["one approved comparable denominator version","aligned sessions/intervals/sources"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"RVOL comparison is unavailable because no common canonical denominator contract exists.","notes":"Never compare mixed provider RVOL fields or raw volumes as ratios."},
{"caseId":"C10-E11-13","caseType":"ranking","input":"Rank selected tickers by canonical RVOL.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["relative_volume"],"expectedFilters":["trusted selected ticker set"],"expectedGroupings":["validated ticker"],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected ticker set","expectedContextRequirements":["approved comparable ratio/denominator","aligned population/session/interval","tie policy"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"RVOL ranking is unavailable because no canonical comparable ratios exist.","notes":"No provider ranking or guessed average is adopted."},
{"caseId":"C10-E11-14","caseType":"negation","input":"Show RVOL without using provider RVOL or average daily volume.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["relative_volume"],"expectedFilters":["exclude provider RVOL","exclude average daily volume"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["alternative approved strict-positive denominator"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Excluding two candidate baselines still does not define an approved relative-volume denominator.","notes":"No fallback denominator is guessed."},
{"caseId":"C10-E11-15","caseType":"exclusion","input":"Calculate RVOL after excluding missing comparison days.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["relative_volume"],"expectedFilters":["exclude missing comparison days"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["approved missing-day policy","comparison population/denominator/version"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"An exclusion request cannot define the missing-day, population, alignment or denominator rules.","notes":"No denominator is activated by filtering."},
{"caseId":"C10-E11-16","caseType":"multi_filter","input":"Show RVOL for selected one-minute extended-session long NVDA entries.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["relative_volume"],"expectedFilters":["trusted selected entries","one-minute","extended session","long","NVDA"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":"trusted selected scope","expectedSelectedEntity":"trusted selected entry set","expectedContextRequirements":["validated NVDA symbol","approved comparison population/denominator","aligned session/interval/source/basis","privacy-safe scope"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Complete filters do not make RVOL available without an approved comparison denominator.","notes":"Do not invent dates, lookback, missing-day policy or another account's data."},
{"caseId":"C10-E11-17","caseType":"multi_part","input":"Show raw entry-candle volume and RVOL for the selected fill.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["volume_at_entry","relative_volume"],"expectedFilters":["trusted selected entry"],"expectedGroupings":[],"expectedOperators":["raw containing-candle volume if covered"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected entry","expectedContextRequirements":["exact containing candle","separate missing RVOL denominator","distinct capability states"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Raw volume may be returned separately, but the RVOL part remains unavailable without an approved denominator.","notes":"Never divide raw volume by an invented baseline."},
{"caseId":"C10-E11-18","caseType":"ambiguous","input":"Was volume normal?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["relative_volume"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["normal-volume meaning","approved comparison denominator","selected interval"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Do you mean raw entry-candle volume? Canonical relative volume has no approved comparison denominator yet.","unsupportedExpected":true,"expectedUnsupportedReason":"Normal volume is undefined and canonical relative volume is unavailable.","notes":"Clarification may route to raw volume but cannot activate RVOL or invent context."},
{"caseId":"C10-E11-19","caseType":"negative_example","input":"Use the provider RVOL value and tell me whether I should buy.","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["relative_volume"],"expectedFilters":["provider RVOL request"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no provider fallback","no trading advice"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Provider RVOL is not canonical evidence and relative volume cannot supply trading advice.","notes":"Reject both unsupported data substitution and advice."},
{"caseId":"C10-E11-20","caseType":"unsupported_data","input":"Calculate RVOL with zero expected volume and no comparison-population version.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["relative_volume"],"expectedFilters":["zero denominator","missing comparison version"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["strict-positive denominator","approved population/version/alignment"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"RVOL is unavailable because the denominator is zero and the comparison contract is missing.","notes":"Never divide by zero, return zero, infinity or a fallback average."},
{"caseId":"C10-E11-21","caseType":"selected_entity_context","input":"Show RVOL for the entry selected in replay.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["relative_volume"],"expectedFilters":["trusted selected replay entry"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":"selected entry context","expectedSelectedEntity":"trusted server-authorized replay entry","expectedContextRequirements":["server-authoritative account scope","approved denominator/version/coverage","privacy-safe output"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Trusted selection supplies scope but cannot repair the absent canonical denominator.","notes":"Do not expose another account or adopt a chart/provider RVOL label."},
{"caseId":"C10-E11-22","caseType":"cross_category","input":"Explain RVOL beside gross P/L for the selected trade.","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["relative_volume","gross_pnl"],"expectedFilters":["trusted selected lifecycle","gross P/L basis"],"expectedGroupings":[],"expectedOperators":["separate gross P/L fact"],"expectedComparison":null,"expectedTimeRange":"selected lifecycle context","expectedSelectedEntity":"trusted selected lifecycle","expectedContextRequirements":["missing canonical RVOL denominator","Category 2 gross basis","no causation or advice","account scope"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Gross P/L may be described separately, but RVOL is unavailable and cannot support a causal explanation.","notes":"Never manufacture RVOL to explain performance."}
]
```

## 7.13 `price_change_after_entry` Cases

```json
[
{"caseId":"C10-E12-01","caseType":"canonical","input":"Show directional price change from the selected long entry to the explicitly selected later completed candle close.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["price_change_after_entry"],"expectedFilters":["trusted selected long entry","explicit later completed close"],"expectedGroupings":[],"expectedOperators":["C-E"],"expectedComparison":null,"expectedTimeRange":"explicit selected endpoint horizon","expectedSelectedEntity":"trusted selected entry allocation and later close","expectedContextRequirements":["exact accepted entry price/time","exact later fully completed compatible candle close","continuous source/version/interval coverage","instrument/currency/corporate-action basis"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Long directional change is C-E; endpoint/horizon is explicit and no nearest, interpolation or partial candle is allowed."},
{"caseId":"C10-E12-02","caseType":"formal_paraphrase","input":"Calculate exact entry minus the selected later fully completed close for the selected short allocation.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["price_change_after_entry"],"expectedFilters":["trusted selected short allocation","explicit completed-close endpoint"],"expectedGroupings":[],"expectedOperators":["E-C"],"expectedComparison":null,"expectedTimeRange":"explicit selected endpoint horizon","expectedSelectedEntity":"trusted selected allocation and later close","expectedContextRequirements":["exact E/time/direction","exact completed C/time","same source/interval/basis","continuous coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Short directional change is E-C for one exact allocation reference; no combined entry price is inferred."},
{"caseId":"C10-E12-03","caseType":"conversational_paraphrase","input":"How far did price move after the selected entry by the chosen completed close?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["price_change_after_entry"],"expectedFilters":["trusted selected entry","explicit chosen completed close"],"expectedGroupings":[],"expectedOperators":["direction-aware E-to-C change"],"expectedComparison":null,"expectedTimeRange":"explicit chosen horizon","expectedSelectedEntity":"trusted selected entry and close","expectedContextRequirements":["exact direction/E/C","declared endpoint/source/interval/coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"This is one bounded historical close, not MFE/MAE, current P/L, prediction or post-exit continuation."},
{"caseId":"C10-E12-04","caseType":"trader_slang","input":"What was the move after that selected short entry at the chosen candle close?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["price_change_after_entry"],"expectedFilters":["trusted selected short entry","explicit chosen completed close"],"expectedGroupings":[],"expectedOperators":["E-C"],"expectedComparison":null,"expectedTimeRange":"explicit chosen horizon","expectedSelectedEntity":"trusted selected entry and close","expectedContextRequirements":["exact E/C/direction","compatible completed endpoint coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Move after entry is factual and directional; it does not judge setup quality or imply tradability at close."},
{"caseId":"C10-E12-05","caseType":"abbreviation","input":"PCAE price-change-after-entry metric for the selected long entry at its explicit completed-close endpoint.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["price_change_after_entry"],"expectedFilters":["trusted selected long entry","explicit completed endpoint"],"expectedGroupings":[],"expectedOperators":["C-E"],"expectedComparison":null,"expectedTimeRange":"explicit endpoint horizon","expectedSelectedEntity":"trusted selected entry and close","expectedContextRequirements":["explicit metric grammar","exact E/C","source/interval/coverage/basis"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Explicit expansion identifies the metric; abbreviation alone supplies no entry or horizon."},
{"caseId":"C10-E12-06","caseType":"misspelling","input":"Show price chnage after entery at the selected completed close.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["price_change_after_entry"],"expectedFilters":["trusted selected entry","explicit selected completed close"],"expectedGroupings":[],"expectedOperators":["direction-aware E-to-C change"],"expectedComparison":null,"expectedTimeRange":"explicit selected horizon","expectedSelectedEntity":"trusted selected entry and close","expectedContextRequirements":["clear metric context","exact direction/E/C","compatible coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Normalize spelling without inventing dates, prices, horizon, candle, source or direction."},
{"caseId":"C10-E12-07","caseType":"noisy_input","input":"after entry move selected long exact later close pls","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["price_change_after_entry"],"expectedFilters":["trusted selected long entry","explicit exact later close"],"expectedGroupings":[],"expectedOperators":["C-E"],"expectedComparison":null,"expectedTimeRange":"explicit endpoint horizon","expectedSelectedEntity":"trusted selected entry and close","expectedContextRequirements":["exact E/C","completed endpoint","continuous compatible coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Noise does not create missing horizon or provider facts."},
{"caseId":"C10-E12-08","caseType":"command","input":"Calculate short price change to the explicit later completed candle close; do not use nearest or interpolate.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["price_change_after_entry"],"expectedFilters":["trusted selected short entry","explicit later completed close"],"expectedGroupings":[],"expectedOperators":["E-C","reject nearest/interpolation"],"expectedComparison":null,"expectedTimeRange":"explicit endpoint horizon","expectedSelectedEntity":"trusted selected entry and close","expectedContextRequirements":["exact E/C/timestamps","same compatible source/interval/basis","continuous coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Only the exact covered fully completed close is eligible."},
{"caseId":"C10-E12-09","caseType":"fragment","input":"Selected long entry to explicit completed close change.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["price_change_after_entry"],"expectedFilters":["trusted selected long entry","explicit completed close"],"expectedGroupings":[],"expectedOperators":["C-E"],"expectedComparison":null,"expectedTimeRange":"explicit selected horizon","expectedSelectedEntity":"trusted selected entry and close","expectedContextRequirements":["exact E/C","completed compatible candle","coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Signed result may be positive, zero or negative and is never converted to P/L."},
{"caseId":"C10-E12-10","caseType":"follow_up","input":"Now use the other explicitly selected completed close for that same entry.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["price_change_after_entry"],"expectedFilters":["prior trusted entry","new explicit completed close"],"expectedGroupings":[],"expectedOperators":["direction-aware E-to-C change"],"expectedComparison":null,"expectedTimeRange":"new explicit endpoint horizon","expectedSelectedEntity":"prior trusted entry and new selected close","expectedContextRequirements":["trusted prior account/entry/direction","exact new C","compatible source/interval/coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Follow-up changes only explicit endpoint and cannot select nearest or stale context."},
{"caseId":"C10-E12-11","caseType":"correction","input":"I meant the later completed candle close, not the entry-containing or still-open candle.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["price_change_after_entry"],"expectedFilters":["prior trusted entry","explicit later completed close","exclude entry/partial candle"],"expectedGroupings":[],"expectedOperators":["direction-aware E-to-C change","endpoint correction"],"expectedComparison":null,"expectedTimeRange":"corrected explicit endpoint","expectedSelectedEntity":"trusted selected entry and corrected close","expectedContextRequirements":["trusted prior context","fully completed later candle","exact source/interval/coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Correction enforces completed later endpoint and no containing-entry or live-candle fallback."},
{"caseId":"C10-E12-12","caseType":"comparison","input":"Compare directional price change at the same explicit completed-close horizon for two selected entries.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["price_change_after_entry"],"expectedFilters":["two trusted selected entries","same explicit completed-close horizon"],"expectedGroupings":[],"expectedOperators":["direction-aware E-to-C per entry","comparison"],"expectedComparison":{"left":"selected entry A","right":"selected entry B","basis":"compatible explicit-horizon price change"},"expectedTimeRange":"same explicit horizon","expectedSelectedEntity":"two trusted selected entries/endpoints","expectedContextRequirements":["same horizon rule/source/interval/basis","exact completed endpoint per entry","continuous coverage","account scope"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Do not compare mixed horizons, nearest endpoints or incomplete coverage."},
{"caseId":"C10-E12-13","caseType":"ranking","input":"Rank selected compatible entries by directional change at the explicitly selected completed-close horizon.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["price_change_after_entry"],"expectedFilters":["trusted selected compatible entries","same explicit completed-close horizon"],"expectedGroupings":[],"expectedOperators":["direction-aware E-to-C per entry","descending rank"],"expectedComparison":null,"expectedTimeRange":"same explicit horizon","expectedSelectedEntity":"trusted selected entry set","expectedContextRequirements":["compatible source/interval/basis","complete endpoint coverage","approved ties","account scope"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ranking is historical/descriptive and does not predict or recommend entries."},
{"caseId":"C10-E12-14","caseType":"negation","input":"Show price change to the explicit completed close, not MFE, realized P/L, or current price.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["price_change_after_entry"],"expectedFilters":["trusted selected entry/close","exclude MFE/P&L/current meanings"],"expectedGroupings":[],"expectedOperators":["direction-aware E-to-C change"],"expectedComparison":null,"expectedTimeRange":"explicit selected horizon","expectedSelectedEntity":"trusted selected entry and close","expectedContextRequirements":["exact E/C/direction","completed endpoint/coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Fees, fills, extrema and moving-now prices remain separate."},
{"caseId":"C10-E12-15","caseType":"exclusion","input":"Show post-entry close change excluding entries without the exact covered endpoint candle.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["price_change_after_entry"],"expectedFilters":["trusted selected entries","exclude missing/incomplete endpoint"],"expectedGroupings":[],"expectedOperators":["direction-aware E-to-C change","coverage exclusion"],"expectedComparison":null,"expectedTimeRange":"explicit common horizon","expectedSelectedEntity":"trusted selected entry set","expectedContextRequirements":["exact completed close per entry","gap detection","source/interval/basis coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Excluded entries remain unavailable coverage, never zero or nearest/interpolated values."},
{"caseId":"C10-E12-16","caseType":"multi_filter","input":"Show one-minute directional change for selected ready-closed long NVDA entries at the explicit completed-close horizon.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["price_change_after_entry"],"expectedFilters":["trusted selected entries","ready_closed","long","NVDA","one-minute","explicit completed-close horizon"],"expectedGroupings":[],"expectedOperators":["C-E"],"expectedComparison":null,"expectedTimeRange":"explicit selected horizon","expectedSelectedEntity":"trusted selected entry set","expectedContextRequirements":["validated NVDA symbol","exact E/C","source/version/coverage/corporate-action basis","privacy-safe account scope"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"One-minute and horizon are explicit; filters cannot manufacture endpoint candles."},
{"caseId":"C10-E12-17","caseType":"multi_part","input":"Show price change after entry at the explicit close and post-exit continuation at its separately explicit horizon.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["price_change_after_entry","post_exit_continuation"],"expectedFilters":["trusted selected entry/lifecycle","two explicit endpoints"],"expectedGroupings":[],"expectedOperators":["direction-aware E-to-C change","direction-aware exact-exit-to-later-close change"],"expectedComparison":null,"expectedTimeRange":"two separately explicit horizons","expectedSelectedEntity":"trusted selected lifecycle/endpoints","expectedContextRequirements":["distinct entry and exit boundaries","exact completed close per metric","separate coverage/source rules"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Do not merge the entry-relative endpoint with post-exit continuation."},
{"caseId":"C10-E12-18","caseType":"ambiguous","input":"Price change after entry?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["price_change_after_entry"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["selected exact entry/direction","explicit later completed-close endpoint/horizon","source/interval coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Which selected entry and exact later fully completed candle close or approved horizon should I use?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"No default horizon, date, price, candle, account or provider context is invented."},
{"caseId":"C10-E12-19","caseType":"negative_example","input":"Will a positive post-entry price change predict my next trade will work?","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["price_change_after_entry"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no prediction, causation or advice"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Historical bounded price change cannot predict a future trade outcome.","notes":"Reject prediction while preserving the factual endpoint boundary."},
{"caseId":"C10-E12-20","caseType":"unsupported_data","input":"Calculate price change after entry using the nearest partial candle because the exact horizon close is missing.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["price_change_after_entry"],"expectedFilters":["missing exact endpoint","nearest partial candle requested"],"expectedGroupings":[],"expectedOperators":["direction-aware E-to-C change"],"expectedComparison":null,"expectedTimeRange":"requested but uncovered horizon","expectedSelectedEntity":"trusted selected entry","expectedContextRequirements":["exact later fully completed close","continuous compatible coverage","declared source/interval/basis"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Price change is unavailable because the exact completed horizon close is missing; nearest, partial and interpolated substitutes are forbidden.","notes":"Never invent C, default a horizon or use moving now."},
{"caseId":"C10-E12-21","caseType":"selected_entity_context","input":"Show price change for the replay-selected entry at the explicitly selected completed close.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["price_change_after_entry"],"expectedFilters":["trusted selected replay entry","explicit selected completed close"],"expectedGroupings":[],"expectedOperators":["direction-aware E-to-C change"],"expectedComparison":null,"expectedTimeRange":"explicit selected horizon","expectedSelectedEntity":"trusted server-authorized replay entry and close","expectedContextRequirements":["server-authoritative account scope","exact direction/E/C","saved source/version/interval/coverage","privacy-safe output"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Trusted selection cannot expose another account or turn chart display into missing endpoint evidence."},
{"caseId":"C10-E12-22","caseType":"cross_category","input":"Explain explicit-horizon post-entry price change beside gross P/L without saying one caused the other.","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["price_change_after_entry","gross_pnl"],"expectedFilters":["trusted selected lifecycle","explicit completed-close horizon","gross P/L basis"],"expectedGroupings":[],"expectedOperators":["direction-aware E-to-C change","separate gross P/L fact","evidence-grounded description"],"expectedComparison":null,"expectedTimeRange":"explicit selected horizon/lifecycle context","expectedSelectedEntity":"trusted selected lifecycle","expectedContextRequirements":["Category 10 exact endpoint/source coverage","Category 2 gross basis","no causation or advice","account scope"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Describe separate historical facts only; bounded price change neither causes P/L nor proves entry quality."}
]
```

## 7.14 `time_to_maximum_favourable_excursion` Cases

```json
[
{"caseId":"C10-E13-01","caseType":"canonical","input":"Show the elapsed interval range to the selected trade's earliest maximum favourable excursion candle.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_to_maximum_favourable_excursion"],"expectedFilters":["trusted selected eligible grain","positive MFE"],"expectedGroupings":[],"expectedOperators":["earliest tie by start UTC then stable source ID","[S-T,F-T]"],"expectedComparison":null,"expectedTimeRange":"selected held window","expectedSelectedEntity":"trusted selected allocation or eligible lifecycle","expectedContextRequirements":["exact entry UTC T","eligible extreme candle start/end UTC","stable source IDs","compatible interval/source/coverage/basis"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Return an elapsed range to the candle, never an invented point inside it."},
{"caseId":"C10-E13-02","caseType":"formal_paraphrase","input":"Select the earliest tied positive-MFE candle by start UTC and stable source ID, then return [S-T,F-T].","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_to_maximum_favourable_excursion"],"expectedFilters":["trusted selected eligible grain","positive MFE"],"expectedGroupings":[],"expectedOperators":["tie order: start UTC then stable source ID","elapsed range [S-T,F-T]"],"expectedComparison":null,"expectedTimeRange":"selected held window","expectedSelectedEntity":"trusted selected grain","expectedContextRequirements":["exact T/S/F","recorded interval semantics","complete compatible coverage","exact terminal boundary"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Stable selection does not convert the interval extreme into an exact timestamp."},
{"caseId":"C10-E13-03","caseType":"conversational_paraphrase","input":"Within candle precision, how long until the selected trade reached its best move?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_to_maximum_favourable_excursion"],"expectedFilters":["trusted selected eligible grain"],"expectedGroupings":[],"expectedOperators":["interval-aware time to MFE"],"expectedComparison":null,"expectedTimeRange":"selected held window","expectedSelectedEntity":"trusted selected grain","expectedContextRequirements":["exact entry UTC","positive MFE or confirmed zero baseline","saved interval/source/coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Best move timing is a candle interval range, not exact tick time, holding duration or advice."},
{"caseId":"C10-E13-04","caseType":"trader_slang","input":"How fast did that selected trade hit its best move, candle range only?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_to_maximum_favourable_excursion"],"expectedFilters":["trusted selected eligible grain"],"expectedGroupings":[],"expectedOperators":["[S-T,F-T]"],"expectedComparison":null,"expectedTimeRange":"selected held window","expectedSelectedEntity":"trusted selected grain","expectedContextRequirements":["exact T","selected extreme interval","stable tie identity","coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Fast is descriptive wording and does not imply significance, cause or a trading rule."},
{"caseId":"C10-E13-05","caseType":"abbreviation","input":"TTMFE time-to-MFE metric for the selected covered allocation.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_to_maximum_favourable_excursion"],"expectedFilters":["trusted selected allocation interval"],"expectedGroupings":[],"expectedOperators":["earliest tied interval range"],"expectedComparison":null,"expectedTimeRange":"selected allocation held window","expectedSelectedEntity":"trusted selected allocation","expectedContextRequirements":["explicit metric grammar","exact entry/exit","source interval/stable ID/coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Explicit grammar distinguishes TTMFE from a token; abbreviation alone supplies no private trade context."},
{"caseId":"C10-E13-06","caseType":"misspelling","input":"Show tme to max favorible excurison for the selected trade.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_to_maximum_favourable_excursion"],"expectedFilters":["trusted selected eligible grain"],"expectedGroupings":[],"expectedOperators":["interval-aware time to MFE"],"expectedComparison":null,"expectedTimeRange":"selected held window","expectedSelectedEntity":"trusted selected grain","expectedContextRequirements":["clear timing context","exact entry/extreme interval","compatible coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Normalize spelling without inventing dates, candles, interval ends or tie identity."},
{"caseId":"C10-E13-07","caseType":"noisy_input","input":"mfe when selected trade earliest tie range pls","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_to_maximum_favourable_excursion"],"expectedFilters":["trusted selected grain"],"expectedGroupings":[],"expectedOperators":["earliest tie","[S-T,F-T]"],"expectedComparison":null,"expectedTimeRange":"selected held window","expectedSelectedEntity":"trusted selected grain","expectedContextRequirements":["exact entry UTC","stable source IDs","compatible interval coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Noise does not create a point time, source ID or missing candle."},
{"caseId":"C10-E13-08","caseType":"command","input":"Return the selected earliest tied MFE candle's elapsed start-to-end range.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_to_maximum_favourable_excursion"],"expectedFilters":["trusted selected eligible grain","positive MFE"],"expectedGroupings":[],"expectedOperators":["start UTC then stable source ID","[S-T,F-T]"],"expectedComparison":null,"expectedTimeRange":"selected held window","expectedSelectedEntity":"trusted selected grain","expectedContextRequirements":["exact T/S/F","source/version/interval/coverage","compatible grain/basis"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Both range bounds and raw UTC interval metadata are retained."},
{"caseId":"C10-E13-09","caseType":"fragment","input":"Selected trade time to MFE, zero baseline.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_to_maximum_favourable_excursion"],"expectedFilters":["trusted selected eligible grain","confirmed MFE zero baseline"],"expectedGroupings":[],"expectedOperators":["exact zero at entry"],"expectedComparison":null,"expectedTimeRange":"entry instant","expectedSelectedEntity":"trusted selected grain","expectedContextRequirements":["complete compatible held-window coverage","confirmed no positive MFE","exact entry UTC"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Exact zero is valid only because entry remains the favourable maximum; it is not a missing-value default."},
{"caseId":"C10-E13-10","caseType":"follow_up","input":"Now use the same grain and show the full time-to-MFE range, not just its start.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_to_maximum_favourable_excursion"],"expectedFilters":["prior trusted grain/source/interval"],"expectedGroupings":[],"expectedOperators":["[S-T,F-T]"],"expectedComparison":null,"expectedTimeRange":"prior trusted held window","expectedSelectedEntity":"prior trusted selected grain","expectedContextRequirements":["trusted prior scope","same source/interval/tie selection","complete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Follow-up cannot silently reduce the range to candle start or reuse stale context."},
{"caseId":"C10-E13-11","caseType":"correction","input":"Choose the earliest tie by start UTC then stable source ID, not file order.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_to_maximum_favourable_excursion"],"expectedFilters":["prior trusted selected grain"],"expectedGroupings":[],"expectedOperators":["correct tie order","[S-T,F-T]"],"expectedComparison":null,"expectedTimeRange":"prior trusted held window","expectedSelectedEntity":"prior trusted selected grain","expectedContextRequirements":["stable source IDs","exact interval bounds","trusted prior context"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Correction makes deterministic tie selection explicit and never invents an intrabar instant."},
{"caseId":"C10-E13-12","caseType":"comparison","input":"Compare time-to-MFE ranges for two selected trades with the same candle interval and grain contract.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["time_to_maximum_favourable_excursion"],"expectedFilters":["two trusted selected eligible grains"],"expectedGroupings":[],"expectedOperators":["construct each elapsed range","range comparison"],"expectedComparison":{"left":"selected grain A range","right":"selected grain B range","basis":"compatible time-to-MFE"},"expectedTimeRange":"two selected held windows","expectedSelectedEntity":"two trusted selected grains","expectedContextRequirements":["same interval/grain semantics","exact entries/terminal boundaries","complete source coverage","declared range comparison rule"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Do not compare a lower bound with another full range or mix intervals."},
{"caseId":"C10-E13-13","caseType":"ranking","input":"Rank selected compatible trades by fastest time-to-MFE range.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["time_to_maximum_favourable_excursion"],"expectedFilters":["trusted selected compatible grains"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected grain set","expectedContextRequirements":["approved range-ranking convention","compatible intervals/grains","complete coverage","tie policy"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Should ranges be ranked by lower bound, upper bound, or another approved range rule?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Never rank silently by candle start or midpoint; ranking does not imply quality."},
{"caseId":"C10-E13-14","caseType":"negation","input":"Show time to MFE as an elapsed range, not an exact second or holding duration.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_to_maximum_favourable_excursion"],"expectedFilters":["trusted selected grain","exclude point/holding meanings"],"expectedGroupings":[],"expectedOperators":["[S-T,F-T]"],"expectedComparison":null,"expectedTimeRange":"selected held window","expectedSelectedEntity":"trusted selected grain","expectedContextRequirements":["exact candle interval","source/coverage","entry UTC"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Candle evidence cannot establish the exact instant of the high/low."},
{"caseId":"C10-E13-15","caseType":"exclusion","input":"Show time-to-MFE ranges excluding held windows with candle gaps or missing interval ends.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_to_maximum_favourable_excursion"],"expectedFilters":["trusted selected grains","exclude gaps/missing F"],"expectedGroupings":[],"expectedOperators":["range construction","coverage exclusion"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected grain set","expectedContextRequirements":["gap detection","exact S/F/source ID","coverage accounting"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Excluded windows remain unavailable and never receive zero or an inferred interval end."},
{"caseId":"C10-E13-16","caseType":"multi_filter","input":"Show one-minute time-to-MFE ranges for selected ready-closed long AAPL allocations with complete coverage.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_to_maximum_favourable_excursion"],"expectedFilters":["trusted selected allocations","ready_closed","long","AAPL","one-minute","complete coverage"],"expectedGroupings":[],"expectedOperators":["earliest tie","[S-T,F-T]"],"expectedComparison":null,"expectedTimeRange":"trusted selected scope","expectedSelectedEntity":"trusted selected allocation set","expectedContextRequirements":["validated AAPL symbol","exact allocation boundaries","stable source IDs","source/version/corporate-action basis","privacy-safe scope"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"One-minute is explicit and filters cannot manufacture candle coverage."},
{"caseId":"C10-E13-17","caseType":"multi_part","input":"Show MFE and its time interval range for the selected covered trade.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["mfe","time_to_maximum_favourable_excursion"],"expectedFilters":["trusted selected eligible grain"],"expectedGroupings":[],"expectedOperators":["direction-aware MFE","earliest-tied elapsed range"],"expectedComparison":null,"expectedTimeRange":"selected held window","expectedSelectedEntity":"trusted selected grain","expectedContextRequirements":["same grain/window/basis","exact entry/exit","complete candle intervals/source IDs"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Return price distance and timing range separately; zero MFE maps to exact zero time at entry."},
{"caseId":"C10-E13-18","caseType":"ambiguous","input":"When was MFE?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_to_maximum_favourable_excursion"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["selected grain","interval-range versus point clarification","source/coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Candles provide an elapsed interval range, not an exact instant. Which selected trade should I use?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"No date, trade, interval, candle or exact time is invented."},
{"caseId":"C10-E13-19","caseType":"negative_example","input":"What exact second did the selected trade hit MFE, and should winners move that fast?","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_to_maximum_favourable_excursion"],"expectedFilters":["trusted selected trade"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected trade","expectedContextRequirements":["no exact intrabar point","no advice"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Candles cannot provide the exact extreme second, and historical timing cannot prescribe how winners should move.","notes":"Reject precision inflation and advice."},
{"caseId":"C10-E13-20","caseType":"unsupported_data","input":"Return time to MFE despite a candle gap and missing stable source ID for tied extremes.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_to_maximum_favourable_excursion"],"expectedFilters":["candle gap","unresolved tie identity"],"expectedGroupings":[],"expectedOperators":["earliest tie","[S-T,F-T]"],"expectedComparison":null,"expectedTimeRange":"selected held window","expectedSelectedEntity":"trusted selected grain","expectedContextRequirements":["complete coverage","stable source IDs","exact interval ends","compatible basis"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Time to MFE is unavailable because coverage is gapped and the tied extreme cannot be selected deterministically.","notes":"Never use file order, interpolate the gap or fabricate a point time."},
{"caseId":"C10-E13-21","caseType":"selected_entity_context","input":"Show time-to-MFE range for the allocation selected in Candle Review.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_to_maximum_favourable_excursion"],"expectedFilters":["trusted selected Candle Review allocation"],"expectedGroupings":[],"expectedOperators":["earliest tie","[S-T,F-T]"],"expectedComparison":null,"expectedTimeRange":"selected allocation held window","expectedSelectedEntity":"trusted server-authorized Candle Review allocation","expectedContextRequirements":["server-authoritative account scope","exact boundaries/source intervals/IDs","privacy-safe output"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Trusted selection cannot expose another account or replace evidence with chart display."},
{"caseId":"C10-E13-22","caseType":"cross_category","input":"Explain time-to-MFE beside gross P/L without saying speed caused the result.","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["time_to_maximum_favourable_excursion","gross_pnl"],"expectedFilters":["trusted selected lifecycle","gross P/L basis"],"expectedGroupings":[],"expectedOperators":["interval-aware time to MFE","separate gross P/L fact","evidence-grounded description"],"expectedComparison":null,"expectedTimeRange":"selected lifecycle context","expectedSelectedEntity":"trusted selected lifecycle","expectedContextRequirements":["Category 10 source/interval/coverage","Category 2 gross basis","no causation or advice","account scope"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Describe separate historical facts only; timing does not cause P/L or prove quality."}
]
```

## 7.15 `time_to_maximum_adverse_excursion` Cases

```json
[
{"caseId":"C10-E14-01","caseType":"canonical","input":"Show the elapsed interval range to the selected trade's earliest maximum adverse excursion candle.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_to_maximum_adverse_excursion"],"expectedFilters":["trusted selected eligible grain","positive MAE"],"expectedGroupings":[],"expectedOperators":["earliest tie by start UTC then stable source ID","[S-T,F-T]"],"expectedComparison":null,"expectedTimeRange":"selected held window","expectedSelectedEntity":"trusted selected allocation or eligible lifecycle","expectedContextRequirements":["exact entry UTC T","eligible extreme candle start/end UTC","stable source IDs","compatible interval/source/coverage/basis"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Return elapsed range to candle, never an invented adverse point time."},
{"caseId":"C10-E14-02","caseType":"formal_paraphrase","input":"Select the earliest tied positive-MAE candle by start UTC and stable source ID, then return [S-T,F-T].","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_to_maximum_adverse_excursion"],"expectedFilters":["trusted selected eligible grain","positive MAE"],"expectedGroupings":[],"expectedOperators":["tie order: start UTC then stable source ID","elapsed range [S-T,F-T]"],"expectedComparison":null,"expectedTimeRange":"selected held window","expectedSelectedEntity":"trusted selected grain","expectedContextRequirements":["exact T/S/F","recorded interval semantics","complete coverage","exact terminal boundary"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Stable selection does not create an exact intrabar instant."},
{"caseId":"C10-E14-03","caseType":"conversational_paraphrase","input":"Within candle precision, how long until the selected trade reached its worst move?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_to_maximum_adverse_excursion"],"expectedFilters":["trusted selected eligible grain"],"expectedGroupings":[],"expectedOperators":["interval-aware time to MAE"],"expectedComparison":null,"expectedTimeRange":"selected held window","expectedSelectedEntity":"trusted selected grain","expectedContextRequirements":["exact entry UTC","positive MAE or confirmed zero baseline","saved interval/source/coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Worst-move timing is a candle interval range, not stop time, loss time or advice."},
{"caseId":"C10-E14-04","caseType":"trader_slang","input":"How fast did the heat hit on that selected trade, candle range only?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_to_maximum_adverse_excursion"],"expectedFilters":["trusted selected eligible grain"],"expectedGroupings":[],"expectedOperators":["[S-T,F-T]"],"expectedComparison":null,"expectedTimeRange":"selected held window","expectedSelectedEntity":"trusted selected grain","expectedContextRequirements":["exact T","selected adverse interval","stable tie identity","coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Heat is descriptive slang, not risk quality, cause or advice."},
{"caseId":"C10-E14-05","caseType":"abbreviation","input":"TTMAE time-to-MAE metric for the selected covered allocation.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_to_maximum_adverse_excursion"],"expectedFilters":["trusted selected allocation interval"],"expectedGroupings":[],"expectedOperators":["earliest tied interval range"],"expectedComparison":null,"expectedTimeRange":"selected allocation held window","expectedSelectedEntity":"trusted selected allocation","expectedContextRequirements":["explicit metric grammar","exact entry/exit","source interval/stable ID/coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Explicit grammar distinguishes TTMAE from a token; abbreviation supplies no trade context."},
{"caseId":"C10-E14-06","caseType":"misspelling","input":"Show tme to max advers excurison for the selected trade.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_to_maximum_adverse_excursion"],"expectedFilters":["trusted selected eligible grain"],"expectedGroupings":[],"expectedOperators":["interval-aware time to MAE"],"expectedComparison":null,"expectedTimeRange":"selected held window","expectedSelectedEntity":"trusted selected grain","expectedContextRequirements":["clear timing context","exact entry/extreme interval","compatible coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Normalize spelling without inventing dates, candles, interval ends or source IDs."},
{"caseId":"C10-E14-07","caseType":"noisy_input","input":"mae when selected trade earliest tie range pls","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_to_maximum_adverse_excursion"],"expectedFilters":["trusted selected grain"],"expectedGroupings":[],"expectedOperators":["earliest tie","[S-T,F-T]"],"expectedComparison":null,"expectedTimeRange":"selected held window","expectedSelectedEntity":"trusted selected grain","expectedContextRequirements":["exact entry UTC","stable source IDs","compatible interval coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Noise does not create a point time, source identity or candle."},
{"caseId":"C10-E14-08","caseType":"command","input":"Return the selected earliest tied MAE candle's elapsed start-to-end range.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_to_maximum_adverse_excursion"],"expectedFilters":["trusted selected eligible grain","positive MAE"],"expectedGroupings":[],"expectedOperators":["start UTC then stable source ID","[S-T,F-T]"],"expectedComparison":null,"expectedTimeRange":"selected held window","expectedSelectedEntity":"trusted selected grain","expectedContextRequirements":["exact T/S/F","source/version/interval/coverage","compatible grain/basis"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Both range bounds and raw UTC interval metadata are retained."},
{"caseId":"C10-E14-09","caseType":"fragment","input":"Selected trade time to MAE, zero baseline.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_to_maximum_adverse_excursion"],"expectedFilters":["trusted selected eligible grain","confirmed MAE zero baseline"],"expectedGroupings":[],"expectedOperators":["exact zero at entry"],"expectedComparison":null,"expectedTimeRange":"entry instant","expectedSelectedEntity":"trusted selected grain","expectedContextRequirements":["complete compatible held-window coverage","confirmed no positive MAE","exact entry UTC"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Exact zero is valid only because entry remains adverse maximum; it is not a missing-value default."},
{"caseId":"C10-E14-10","caseType":"follow_up","input":"Now use the same grain and show the full time-to-MAE range, not just its start.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_to_maximum_adverse_excursion"],"expectedFilters":["prior trusted grain/source/interval"],"expectedGroupings":[],"expectedOperators":["[S-T,F-T]"],"expectedComparison":null,"expectedTimeRange":"prior trusted held window","expectedSelectedEntity":"prior trusted selected grain","expectedContextRequirements":["trusted prior scope","same source/interval/tie selection","complete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Follow-up cannot reduce the range to candle start or reuse stale context."},
{"caseId":"C10-E14-11","caseType":"correction","input":"Choose the earliest MAE tie by start UTC then stable source ID, not file order.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_to_maximum_adverse_excursion"],"expectedFilters":["prior trusted selected grain"],"expectedGroupings":[],"expectedOperators":["correct tie order","[S-T,F-T]"],"expectedComparison":null,"expectedTimeRange":"prior trusted held window","expectedSelectedEntity":"prior trusted selected grain","expectedContextRequirements":["stable source IDs","exact interval bounds","trusted prior context"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Correction makes deterministic tie selection explicit and never invents intrabar time."},
{"caseId":"C10-E14-12","caseType":"comparison","input":"Compare time-to-MAE ranges for two selected trades with the same candle interval and grain contract.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["time_to_maximum_adverse_excursion"],"expectedFilters":["two trusted selected eligible grains"],"expectedGroupings":[],"expectedOperators":["construct each elapsed range","range comparison"],"expectedComparison":{"left":"selected grain A range","right":"selected grain B range","basis":"compatible time-to-MAE"},"expectedTimeRange":"two selected held windows","expectedSelectedEntity":"two trusted selected grains","expectedContextRequirements":["same interval/grain semantics","exact entries/terminal boundaries","complete source coverage","declared range comparison rule"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Do not compare one bound with another full range or mix intervals."},
{"caseId":"C10-E14-13","caseType":"ranking","input":"Rank selected compatible trades by fastest time-to-MAE range.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["time_to_maximum_adverse_excursion"],"expectedFilters":["trusted selected compatible grains"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected grain set","expectedContextRequirements":["approved range-ranking convention","compatible intervals/grains","complete coverage","tie policy"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Should ranges be ranked by lower bound, upper bound, or another approved range rule?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Never rank silently by candle start or midpoint; ranking does not imply risk quality."},
{"caseId":"C10-E14-14","caseType":"negation","input":"Show time to MAE as an elapsed range, not an exact second or stop time.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_to_maximum_adverse_excursion"],"expectedFilters":["trusted selected grain","exclude point/stop meanings"],"expectedGroupings":[],"expectedOperators":["[S-T,F-T]"],"expectedComparison":null,"expectedTimeRange":"selected held window","expectedSelectedEntity":"trusted selected grain","expectedContextRequirements":["exact candle interval","source/coverage","entry UTC"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Candle evidence cannot establish exact adverse instant or trader stop."},
{"caseId":"C10-E14-15","caseType":"exclusion","input":"Show time-to-MAE ranges excluding held windows with candle gaps or missing interval ends.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_to_maximum_adverse_excursion"],"expectedFilters":["trusted selected grains","exclude gaps/missing F"],"expectedGroupings":[],"expectedOperators":["range construction","coverage exclusion"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected grain set","expectedContextRequirements":["gap detection","exact S/F/source ID","coverage accounting"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Excluded windows remain unavailable and never receive zero or inferred ends."},
{"caseId":"C10-E14-16","caseType":"multi_filter","input":"Show five-minute time-to-MAE ranges for selected ready-closed short TSLA allocations with complete coverage.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_to_maximum_adverse_excursion"],"expectedFilters":["trusted selected allocations","ready_closed","short","TSLA","five-minute","complete coverage"],"expectedGroupings":[],"expectedOperators":["earliest tie","[S-T,F-T]"],"expectedComparison":null,"expectedTimeRange":"trusted selected scope","expectedSelectedEntity":"trusted selected allocation set","expectedContextRequirements":["validated TSLA symbol","exact allocation boundaries","stable source IDs","source/version/corporate-action basis","privacy-safe scope"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Five-minute is explicit and filters cannot manufacture candle coverage."},
{"caseId":"C10-E14-17","caseType":"multi_part","input":"Show MAE and its time interval range for the selected covered trade.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["mae","time_to_maximum_adverse_excursion"],"expectedFilters":["trusted selected eligible grain"],"expectedGroupings":[],"expectedOperators":["direction-aware MAE","earliest-tied elapsed range"],"expectedComparison":null,"expectedTimeRange":"selected held window","expectedSelectedEntity":"trusted selected grain","expectedContextRequirements":["same grain/window/basis","exact entry/exit","complete candle intervals/source IDs"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Return price distance and timing range separately; zero MAE maps to exact zero time at entry."},
{"caseId":"C10-E14-18","caseType":"ambiguous","input":"When was MAE?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_to_maximum_adverse_excursion"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["selected grain","interval-range versus point clarification","source/coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Candles provide an elapsed interval range, not an exact instant. Which selected trade should I use?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"No date, trade, interval, candle or exact time is invented."},
{"caseId":"C10-E14-19","caseType":"negative_example","input":"What exact second did MAE occur, and should I stop out that fast next time?","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_to_maximum_adverse_excursion"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no exact intrabar point","no stop advice"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Candles cannot provide the exact adverse second, and historical timing cannot prescribe a stop action.","notes":"Reject precision inflation and advice."},
{"caseId":"C10-E14-20","caseType":"unsupported_data","input":"Return time to MAE despite a candle gap and missing stable source ID for tied extremes.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_to_maximum_adverse_excursion"],"expectedFilters":["candle gap","unresolved tie identity"],"expectedGroupings":[],"expectedOperators":["earliest tie","[S-T,F-T]"],"expectedComparison":null,"expectedTimeRange":"selected held window","expectedSelectedEntity":"trusted selected grain","expectedContextRequirements":["complete coverage","stable source IDs","exact interval ends","compatible basis"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Time to MAE is unavailable because coverage is gapped and the tied extreme cannot be selected deterministically.","notes":"Never use file order, interpolate gaps or fabricate point time."},
{"caseId":"C10-E14-21","caseType":"selected_entity_context","input":"Show time-to-MAE range for the allocation selected in replay.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_to_maximum_adverse_excursion"],"expectedFilters":["trusted selected replay allocation"],"expectedGroupings":[],"expectedOperators":["earliest tie","[S-T,F-T]"],"expectedComparison":null,"expectedTimeRange":"selected allocation held window","expectedSelectedEntity":"trusted server-authorized replay allocation","expectedContextRequirements":["server-authoritative account scope","exact boundaries/source intervals/IDs","privacy-safe output"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Trusted selection cannot expose another account or replace evidence with visuals."},
{"caseId":"C10-E14-22","caseType":"cross_category","input":"Explain time-to-MAE beside gross P/L without saying speed caused the result.","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["time_to_maximum_adverse_excursion","gross_pnl"],"expectedFilters":["trusted selected lifecycle","gross P/L basis"],"expectedGroupings":[],"expectedOperators":["interval-aware time to MAE","separate gross P/L fact","evidence-grounded description"],"expectedComparison":null,"expectedTimeRange":"selected lifecycle context","expectedSelectedEntity":"trusted selected lifecycle","expectedContextRequirements":["Category 10 source/interval/coverage","Category 2 gross basis","no causation or advice","account scope"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Describe separate historical facts only; timing does not cause P/L or prove risk quality."}
]
```

## 7.16 `recovery_to_entry` Cases

```json
[
{"caseId":"C10-E15-01","caseType":"canonical","input":"Show whether the selected long recovered to entry after a distinct earlier adverse candle.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["recovery_to_entry"],"expectedFilters":["trusted selected eligible long grain"],"expectedGroupings":[],"expectedOperators":["earlier completed low<E","first later completed high>=E","order by start UTC then stable source ID"],"expectedComparison":null,"expectedTimeRange":"selected held window through exact exit","expectedSelectedEntity":"trusted selected allocation or eligible lifecycle","expectedContextRequirements":["exact E/entry/exit","distinct completed candle sequence","continuous source/interval coverage","compatible basis"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"True identifies the entire first later recovery candle interval, never exact crossing time."},
{"caseId":"C10-E15-02","caseType":"formal_paraphrase","input":"For the selected short, find the first later completed candle with low at or below entry after a distinct earlier candle high above entry.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["recovery_to_entry"],"expectedFilters":["trusted selected eligible short grain"],"expectedGroupings":[],"expectedOperators":["earlier completed high>E","first later completed low<=E","stable order"],"expectedComparison":null,"expectedTimeRange":"selected held window through exact exit","expectedSelectedEntity":"trusted selected grain","expectedContextRequirements":["exact E","distinct adverse/recovery candles","complete compatible coverage","exact exit boundary"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Short directional cross is low<=E only after an earlier distinct high>E candle."},
{"caseId":"C10-E15-03","caseType":"conversational_paraphrase","input":"Did the selected trade get back to entry after first moving against me?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["recovery_to_entry"],"expectedFilters":["trusted selected eligible grain"],"expectedGroupings":[],"expectedOperators":["direction-aware distinct adverse then later recovery"],"expectedComparison":null,"expectedTimeRange":"selected held window","expectedSelectedEntity":"trusted selected grain","expectedContextRequirements":["exact entry/direction","completed-candle ordering","complete coverage for false"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recovery is candle-state evidence, not realized breakeven, final outcome or fillability."},
{"caseId":"C10-E15-04","caseType":"trader_slang","input":"Did that selected long reclaim my entry after taking heat?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["recovery_to_entry"],"expectedFilters":["trusted selected long grain"],"expectedGroupings":[],"expectedOperators":["earlier low<E","later high>=E"],"expectedComparison":null,"expectedTimeRange":"selected held window","expectedSelectedEntity":"trusted selected grain","expectedContextRequirements":["distinct completed candles","exact E/exit","compatible coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Reclaim/heat slang does not establish exact crossing time or trade quality."},
{"caseId":"C10-E15-05","caseType":"abbreviation","input":"RTE recovery-to-entry metric for the selected covered trade.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["recovery_to_entry"],"expectedFilters":["trusted selected eligible grain"],"expectedGroupings":[],"expectedOperators":["direction-aware adverse-then-recovery sequence"],"expectedComparison":null,"expectedTimeRange":"selected held window","expectedSelectedEntity":"trusted selected grain","expectedContextRequirements":["explicit metric grammar","exact direction/E/boundaries","source interval/coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Explicit grammar distinguishes RTE from ticker/token; abbreviation provides no trade facts."},
{"caseId":"C10-E15-06","caseType":"misspelling","input":"Show recoverey to entery for the selected candle-covered trade.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["recovery_to_entry"],"expectedFilters":["trusted selected eligible grain"],"expectedGroupings":[],"expectedOperators":["direction-aware adverse-then-recovery sequence"],"expectedComparison":null,"expectedTimeRange":"selected held window","expectedSelectedEntity":"trusted selected grain","expectedContextRequirements":["clear metric context","exact entry/direction","complete candle order"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Normalize spelling without inventing dates, candles, entry or crossing time."},
{"caseId":"C10-E15-07","caseType":"noisy_input","input":"recovery selected trade no prior adverse candle pls","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["recovery_to_entry"],"expectedFilters":["trusted selected eligible grain","no distinct earlier adverse candle"],"expectedGroupings":[],"expectedOperators":["not_applicable"],"expectedComparison":null,"expectedTimeRange":"selected held window","expectedSelectedEntity":"trusted selected grain","expectedContextRequirements":["exact E/direction","complete compatible prerequisite scan","coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"No earlier adverse candle returns not_applicable rather than false; noise does not create a prerequisite sequence."},
{"caseId":"C10-E15-08","caseType":"command","input":"For the selected long, return the first later completed recovery candle after a distinct adverse candle.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["recovery_to_entry"],"expectedFilters":["trusted selected long grain"],"expectedGroupings":[],"expectedOperators":["earlier low<E","first later high>=E","start UTC then stable source ID"],"expectedComparison":null,"expectedTimeRange":"selected held window","expectedSelectedEntity":"trusted selected grain","expectedContextRequirements":["distinct completed candles","exact E/exit","compatible interval/source coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"True returns recovery interval bounds and not an exact intrabar crossing."},
{"caseId":"C10-E15-09","caseType":"fragment","input":"Selected short recovery to entry, complete through exit, no later cross.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["recovery_to_entry"],"expectedFilters":["trusted selected short grain","distinct earlier adverse candle","complete through exit","no later low<=E"],"expectedGroupings":[],"expectedOperators":["false after exhaustive covered scan"],"expectedComparison":null,"expectedTimeRange":"adverse candle through exact exit","expectedSelectedEntity":"trusted selected grain","expectedContextRequirements":["earlier high>E","continuous coverage through exit","stable candle order"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"False is valid only with complete compatible coverage through exact exit."},
{"caseId":"C10-E15-10","caseType":"follow_up","input":"Now show the first recovery interval for that same selected grain.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["recovery_to_entry"],"expectedFilters":["prior trusted grain/source/interval"],"expectedGroupings":[],"expectedOperators":["first later qualifying cross"],"expectedComparison":null,"expectedTimeRange":"prior trusted held window","expectedSelectedEntity":"prior trusted selected grain","expectedContextRequirements":["trusted prior entry/direction","same sequence/source/coverage","stable order"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Follow-up cannot reuse stale coverage or convert interval to a point."},
{"caseId":"C10-E15-11","caseType":"correction","input":"Require a distinct earlier adverse candle; do not count an adverse and recovery cross in the same candle.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["recovery_to_entry"],"expectedFilters":["prior trusted selected grain","exclude same-candle sequence"],"expectedGroupings":[],"expectedOperators":["distinct-candle order correction"],"expectedComparison":null,"expectedTimeRange":"prior trusted held window","expectedSelectedEntity":"prior trusted selected grain","expectedContextRequirements":["candle interval ordering","exact E/direction","trusted prior context"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"A candle high/low cannot establish adverse-then-recovery intrabar order."},
{"caseId":"C10-E15-12","caseType":"comparison","input":"Compare recovery-to-entry states for two selected trades with compatible candle contracts.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["recovery_to_entry"],"expectedFilters":["two trusted selected eligible grains"],"expectedGroupings":[],"expectedOperators":["derive true/false/not_applicable/unavailable per grain","state comparison"],"expectedComparison":{"left":"selected grain A state","right":"selected grain B state","basis":"compatible recovery-to-entry"},"expectedTimeRange":"two selected held windows","expectedSelectedEntity":"two trusted selected grains","expectedContextRequirements":["same interval/grain semantics","complete coverage for any false","exact E/direction/exit per grain"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Unavailable/not-applicable are not coerced to false before comparison."},
{"caseId":"C10-E15-13","caseType":"ranking","input":"Rank selected trades by recovery-to-entry.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["recovery_to_entry"],"expectedFilters":["trusted selected eligible grains"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected grain set","expectedContextRequirements":["approved state/range ranking semantics","compatible coverage","deterministic ties"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Do you want states grouped, or true recoveries ranked by an explicitly approved interval-range rule?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Boolean/state values and interval ranges have no silent rank order."},
{"caseId":"C10-E15-14","caseType":"negation","input":"Show candle recovery to entry, not realized breakeven or an exact crossing second.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["recovery_to_entry"],"expectedFilters":["trusted selected grain","exclude realized/point meanings"],"expectedGroupings":[],"expectedOperators":["distinct adverse then later completed-candle cross"],"expectedComparison":null,"expectedTimeRange":"selected held window","expectedSelectedEntity":"trusted selected grain","expectedContextRequirements":["exact E/direction","completed candle sequence","coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recovery interval does not prove fillability or final P/L."},
{"caseId":"C10-E15-15","caseType":"exclusion","input":"Show recovery states excluding windows with gaps after the adverse candle.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["recovery_to_entry"],"expectedFilters":["trusted selected grains","exclude post-adverse gaps"],"expectedGroupings":[],"expectedOperators":["coverage exclusion"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected grain set","expectedContextRequirements":["gap detection","complete sequence for true/false","coverage accounting"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Gap cases remain unavailable and never become false."},
{"caseId":"C10-E15-16","caseType":"multi_filter","input":"Show one-minute recovery-to-entry for selected ready-closed long NVDA trades with complete through-exit coverage.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["recovery_to_entry"],"expectedFilters":["trusted selected lifecycles","ready_closed","long","NVDA","one-minute","complete through exit"],"expectedGroupings":[],"expectedOperators":["earlier low<E","first later high>=E"],"expectedComparison":null,"expectedTimeRange":"trusted selected scope","expectedSelectedEntity":"trusted selected lifecycle set","expectedContextRequirements":["validated NVDA symbol","exact E/exit","source/version/stable IDs/corporate-action basis","privacy-safe scope"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"One-minute is explicit and complete coverage is still required for false."},
{"caseId":"C10-E15-17","caseType":"multi_part","input":"Show MAE and recovery-to-entry for the selected covered trade.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["mae","recovery_to_entry"],"expectedFilters":["trusted selected eligible grain"],"expectedGroupings":[],"expectedOperators":["direction-aware MAE","distinct adverse then later recovery state"],"expectedComparison":null,"expectedTimeRange":"selected held window","expectedSelectedEntity":"trusted selected grain","expectedContextRequirements":["same grain/window/basis","exact entry/exit","complete candle sequence"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Positive MAE may establish adverse prerequisite; recovery remains separate state and interval."},
{"caseId":"C10-E15-18","caseType":"ambiguous","input":"Did it recover?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["recovery_to_entry"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["recovery target disambiguation","selected grain/direction","candle sequence/coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Do you mean candle recovery to exact entry after a distinct earlier adverse candle, and for which selected trade?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"No trade, date, direction, sequence or recovery threshold is invented."},
{"caseId":"C10-E15-19","caseType":"negative_example","input":"If it recovered to entry, should I hold every losing trade longer?","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["recovery_to_entry"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no prediction or advice"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Historical candle recovery does not justify holding future losing trades or provide advice.","notes":"Reject advisory extrapolation."},
{"caseId":"C10-E15-20","caseType":"unsupported_data","input":"Mark recovery true because one candle moved below and above entry, despite a later coverage gap.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["recovery_to_entry"],"expectedFilters":["same-candle adverse/recovery","later coverage gap"],"expectedGroupings":[],"expectedOperators":["distinct-candle sequence required"],"expectedComparison":null,"expectedTimeRange":"selected held window","expectedSelectedEntity":"trusted selected grain","expectedContextRequirements":["distinct earlier adverse candle","later qualifying candle","complete compatible coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Recovery is unavailable because same-candle high/low cannot establish order and the later sequence has a coverage gap.","notes":"Never infer intrabar order or emit false/true through a gap."},
{"caseId":"C10-E15-21","caseType":"selected_entity_context","input":"Show recovery-to-entry for the trade selected in replay.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["recovery_to_entry"],"expectedFilters":["trusted selected replay trade"],"expectedGroupings":[],"expectedOperators":["direction-aware adverse-then-recovery state"],"expectedComparison":null,"expectedTimeRange":"selected held window","expectedSelectedEntity":"trusted server-authorized replay trade","expectedContextRequirements":["server-authoritative account scope","exact E/direction/exit","source interval/coverage/IDs","privacy-safe output"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Trusted selection cannot expose another account or replace missing sequence evidence with chart display."},
{"caseId":"C10-E15-22","caseType":"cross_category","input":"Explain recovery-to-entry beside gross P/L without saying recovery caused the outcome.","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["recovery_to_entry","gross_pnl"],"expectedFilters":["trusted selected lifecycle","gross P/L basis"],"expectedGroupings":[],"expectedOperators":["recovery state/interval","separate gross P/L fact","evidence-grounded description"],"expectedComparison":null,"expectedTimeRange":"selected lifecycle context","expectedSelectedEntity":"trusted selected lifecycle","expectedContextRequirements":["Category 10 sequence/source coverage","Category 2 gross basis","no causation or advice","account scope"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Describe separate facts only; recovery neither causes P/L nor proves strategy quality."}
]
```

## 7.17 `post_exit_continuation` Cases

```json
[
{"caseId":"C10-E16-01","caseType":"canonical","input":"Show post-exit continuation for the selected long exit at the explicitly selected completed-close horizon.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["post_exit_continuation"],"expectedFilters":["trusted selected exact long exit","explicit supported horizon"],"expectedGroupings":[],"expectedOperators":["C_h-X"],"expectedComparison":null,"expectedTimeRange":"explicit selected post-exit horizon","expectedSelectedEntity":"trusted selected exit and completed horizon close","expectedContextRequirements":["exact accepted exit price/time/direction","exact fully completed compatible candle close","complete source/version/interval coverage","instrument/currency/corporate-action basis"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Long directional continuation is C_h-X; exclude exit candle and never default, interpolate or choose nearest."},
{"caseId":"C10-E16-02","caseType":"formal_paraphrase","input":"Calculate exact exit minus the explicitly resolved later completed close for the selected short exit.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["post_exit_continuation"],"expectedFilters":["trusted selected exact short exit","explicit supported horizon"],"expectedGroupings":[],"expectedOperators":["X-C_h"],"expectedComparison":null,"expectedTimeRange":"explicit selected post-exit horizon","expectedSelectedEntity":"trusted selected exit and completed horizon close","expectedContextRequirements":["exact X/time/direction","exact completed C_h/time","same source/interval/basis","complete post-exit coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Short directional continuation is X-C_h and is separate from giveback or counterfactual P/L."},
{"caseId":"C10-E16-03","caseType":"conversational_paraphrase","input":"How far did price continue after the selected exit by the chosen completed close?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["post_exit_continuation"],"expectedFilters":["trusted selected exact exit","explicit completed-close horizon"],"expectedGroupings":[],"expectedOperators":["direction-aware X-to-C_h change"],"expectedComparison":null,"expectedTimeRange":"explicit chosen horizon","expectedSelectedEntity":"trusted selected exit and close","expectedContextRequirements":["exact X/direction","completed endpoint","declared source/interval/coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"This is bounded historical movement, not missed profit, prediction, regret or advice."},
{"caseId":"C10-E16-04","caseType":"trader_slang","input":"How much more did it run after that selected long exit at the chosen horizon?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["post_exit_continuation"],"expectedFilters":["trusted selected long exit","explicit covered horizon"],"expectedGroupings":[],"expectedOperators":["C_h-X"],"expectedComparison":null,"expectedTimeRange":"explicit chosen horizon","expectedSelectedEntity":"trusted selected exit and close","expectedContextRequirements":["exact X/C_h","fully completed compatible candle","coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Run is directional slang and does not imply fillability or that holding longer was better."},
{"caseId":"C10-E16-05","caseType":"abbreviation","input":"PEC post-exit-continuation metric for the selected covered exit at its explicit horizon.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["post_exit_continuation"],"expectedFilters":["trusted selected exact exit","explicit horizon"],"expectedGroupings":[],"expectedOperators":["direction-aware X-to-C_h change"],"expectedComparison":null,"expectedTimeRange":"explicit horizon","expectedSelectedEntity":"trusted selected exit and close","expectedContextRequirements":["explicit metric grammar","exact X/C_h/direction","source/interval/coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Explicit expansion distinguishes PEC from a ticker/token; acronym supplies no exit or horizon."},
{"caseId":"C10-E16-06","caseType":"misspelling","input":"Show post exit contination for the selected exit at the explicit completed close.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["post_exit_continuation"],"expectedFilters":["trusted selected exact exit","explicit completed close"],"expectedGroupings":[],"expectedOperators":["direction-aware X-to-C_h change"],"expectedComparison":null,"expectedTimeRange":"explicit endpoint horizon","expectedSelectedEntity":"trusted selected exit and close","expectedContextRequirements":["clear metric context","exact direction/X/C_h","compatible coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Normalize spelling without inventing dates, horizon, exit, candle or provider."},
{"caseId":"C10-E16-07","caseType":"noisy_input","input":"after exit move selected short explicit close covered pls","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["post_exit_continuation"],"expectedFilters":["trusted selected short exit","explicit completed close"],"expectedGroupings":[],"expectedOperators":["X-C_h"],"expectedComparison":null,"expectedTimeRange":"explicit endpoint horizon","expectedSelectedEntity":"trusted selected exit and close","expectedContextRequirements":["exact X/C_h","complete compatible coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Noise does not create missing horizon or source facts."},
{"caseId":"C10-E16-08","caseType":"command","input":"Calculate long post-exit continuation to the explicit later completed close; reject nearest and interpolation.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["post_exit_continuation"],"expectedFilters":["trusted selected long exit","explicit later completed close"],"expectedGroupings":[],"expectedOperators":["C_h-X","reject nearest/interpolation"],"expectedComparison":null,"expectedTimeRange":"explicit post-exit horizon","expectedSelectedEntity":"trusted selected exit and close","expectedContextRequirements":["exact X/C_h/timestamps","complete source/version/interval coverage","compatible basis"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Exit-containing and partial candles are ineligible endpoints."},
{"caseId":"C10-E16-09","caseType":"fragment","input":"Selected short exit to explicit completed post-exit close.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["post_exit_continuation"],"expectedFilters":["trusted selected short exit","explicit completed close"],"expectedGroupings":[],"expectedOperators":["X-C_h"],"expectedComparison":null,"expectedTimeRange":"explicit selected horizon","expectedSelectedEntity":"trusted selected exit and close","expectedContextRequirements":["exact X/C_h","completed compatible candle","coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Signed result may be negative, zero or positive and is not hypothetical P/L."},
{"caseId":"C10-E16-10","caseType":"follow_up","input":"Now use the other explicitly selected covered horizon for that same exit.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["post_exit_continuation"],"expectedFilters":["prior trusted exit","new explicit horizon"],"expectedGroupings":[],"expectedOperators":["direction-aware X-to-C_h change"],"expectedComparison":null,"expectedTimeRange":"new explicit post-exit horizon","expectedSelectedEntity":"prior trusted exit and new close","expectedContextRequirements":["trusted prior exit/direction","exact new completed C_h","compatible source/interval/coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Follow-up changes only explicit horizon and cannot choose nearest or stale context."},
{"caseId":"C10-E16-11","caseType":"correction","input":"I meant the fully completed post-exit close, not the exit candle or a partial candle.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["post_exit_continuation"],"expectedFilters":["prior trusted exit","exclude exit/partial candle"],"expectedGroupings":[],"expectedOperators":["direction-aware X-to-C_h change","endpoint correction"],"expectedComparison":null,"expectedTimeRange":"corrected explicit horizon","expectedSelectedEntity":"trusted selected exit and corrected close","expectedContextRequirements":["trusted prior context","exact completed later candle","coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Correction preserves exact exit boundary and excludes sequence-ambiguous exit candle."},
{"caseId":"C10-E16-12","caseType":"comparison","input":"Compare continuation for two selected exits at the same explicit completed-close horizon.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["post_exit_continuation"],"expectedFilters":["two trusted selected exact exits","same explicit horizon"],"expectedGroupings":[],"expectedOperators":["direction-aware X-to-C_h per exit","comparison"],"expectedComparison":{"left":"selected exit A","right":"selected exit B","basis":"compatible post-exit continuation"},"expectedTimeRange":"same explicit horizon","expectedSelectedEntity":"two trusted exits/endpoints","expectedContextRequirements":["same horizon/source/interval/basis","exact completed endpoint per exit","complete coverage","account scope"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Do not compare mixed horizons or substitute uncovered endpoints."},
{"caseId":"C10-E16-13","caseType":"ranking","input":"Rank selected compatible exits by directional continuation at the explicit covered horizon.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["post_exit_continuation"],"expectedFilters":["trusted selected compatible exits","same explicit horizon"],"expectedGroupings":[],"expectedOperators":["direction-aware X-to-C_h","descending rank"],"expectedComparison":null,"expectedTimeRange":"same explicit horizon","expectedSelectedEntity":"trusted selected exit set","expectedContextRequirements":["compatible source/interval/basis","complete endpoint coverage","approved ties","account scope"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ranking is descriptive and does not prove exit quality or recommend holding."},
{"caseId":"C10-E16-14","caseType":"negation","input":"Show post-exit continuation, not giveback, missed profit, or current price.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["post_exit_continuation"],"expectedFilters":["trusted selected exit/close","exclude giveback/P&L/current meanings"],"expectedGroupings":[],"expectedOperators":["direction-aware X-to-C_h change"],"expectedComparison":null,"expectedTimeRange":"explicit selected horizon","expectedSelectedEntity":"trusted selected exit and close","expectedContextRequirements":["exact X/C_h/direction","completed endpoint/coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"No counterfactual profit, prediction, fillability or regret claim is produced."},
{"caseId":"C10-E16-15","caseType":"exclusion","input":"Show continuation excluding exits without the exact fully covered completed horizon close.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["post_exit_continuation"],"expectedFilters":["trusted selected exits","exclude missing/incomplete endpoint"],"expectedGroupings":[],"expectedOperators":["direction-aware X-to-C_h","coverage exclusion"],"expectedComparison":null,"expectedTimeRange":"explicit common horizon","expectedSelectedEntity":"trusted selected exit set","expectedContextRequirements":["exact completed close per exit","gap detection","coverage accounting"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Exclusions remain unavailable coverage and never zero/nearest/interpolated values."},
{"caseId":"C10-E16-16","caseType":"multi_filter","input":"Show one-minute post-exit continuation for selected ready-closed long NVDA final exits at the explicit covered horizon.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["post_exit_continuation"],"expectedFilters":["trusted selected final exits","ready_closed","long","NVDA","one-minute","explicit horizon"],"expectedGroupings":[],"expectedOperators":["C_h-X"],"expectedComparison":null,"expectedTimeRange":"explicit selected horizon","expectedSelectedEntity":"trusted selected exit set","expectedContextRequirements":["validated NVDA symbol","exact final exit/C_h","source/version/coverage/corporate-action basis","privacy-safe scope"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"One-minute and horizon are explicit; filters cannot manufacture endpoint candles."},
{"caseId":"C10-E16-17","caseType":"multi_part","input":"Show giveback before exit and continuation after exit at its separately explicit horizon.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["profit_giveback","post_exit_continuation"],"expectedFilters":["trusted selected eligible exit","explicit post-exit horizon"],"expectedGroupings":[],"expectedOperators":["Category 10 giveback","direction-aware X-to-C_h continuation"],"expectedComparison":null,"expectedTimeRange":"pre-exit held window and explicit post-exit horizon","expectedSelectedEntity":"trusted selected exact exit","expectedContextRequirements":["distinct pre/post-exit windows","exact boundaries/endpoints","separate coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Do not merge giveback with later movement or counterfactual P/L."},
{"caseId":"C10-E16-18","caseType":"ambiguous","input":"What happened after exit?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["post_exit_continuation"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["selected exact exit/role/direction","explicit supported horizon","source/coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Which selected exit and exact post-exit completed-close horizon should I use?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"No default horizon, date, exit, price, candle or account context is invented."},
{"caseId":"C10-E16-19","caseType":"negative_example","input":"Will price keep running after my next exit, and should I hold longer?","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["post_exit_continuation"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no prediction, regret or advice"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Historical post-exit continuation cannot predict a future move or advise holding longer.","notes":"Reject prediction/advice while preserving factual historical boundary."},
{"caseId":"C10-E16-20","caseType":"unsupported_data","input":"Calculate continuation using the nearest partial candle because the exact horizon close is missing.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["post_exit_continuation"],"expectedFilters":["missing exact endpoint","nearest partial candle requested"],"expectedGroupings":[],"expectedOperators":["direction-aware X-to-C_h change"],"expectedComparison":null,"expectedTimeRange":"requested but uncovered horizon","expectedSelectedEntity":"trusted selected exit","expectedContextRequirements":["exact fully completed post-exit close","complete compatible coverage","declared source/interval/basis"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Continuation is unavailable because the exact completed horizon close is missing; nearest, partial and interpolated substitutes are forbidden.","notes":"Never default a horizon, invent C_h or use moving now."},
{"caseId":"C10-E16-21","caseType":"selected_entity_context","input":"Show continuation for the exit selected in replay at the explicitly selected completed horizon close.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["post_exit_continuation"],"expectedFilters":["trusted selected replay exit","explicit completed horizon close"],"expectedGroupings":[],"expectedOperators":["direction-aware X-to-C_h change"],"expectedComparison":null,"expectedTimeRange":"explicit selected horizon","expectedSelectedEntity":"trusted server-authorized replay exit and close","expectedContextRequirements":["server-authoritative account scope","exact X/C_h/direction","source/version/interval/coverage","privacy-safe output"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Trusted selection cannot expose another account or replace missing endpoint evidence with chart display."},
{"caseId":"C10-E16-22","caseType":"cross_category","input":"Explain post-exit continuation beside gross P/L without saying later movement caused the realized result.","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["post_exit_continuation","gross_pnl"],"expectedFilters":["trusted selected lifecycle/exit","explicit horizon","gross P/L basis"],"expectedGroupings":[],"expectedOperators":["direction-aware X-to-C_h","separate gross P/L fact","evidence-grounded description"],"expectedComparison":null,"expectedTimeRange":"selected lifecycle and explicit horizon","expectedSelectedEntity":"trusted selected lifecycle/exit","expectedContextRequirements":["Category 10 endpoint/source coverage","Category 2 gross basis","no causation or advice","account scope"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Describe separate facts only; later movement cannot cause an already realized result or prove exit quality."}
]
```

## 7.18 `stop_distance` Cases

```json
[
{"caseId":"C10-E17-01","caseType":"canonical","input":"Show stop distance for the selected trade plan.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["stop_distance"],"expectedFilters":["trusted selected lifecycle"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected lifecycle","expectedContextRequirements":["explicit accepted trader-recorded stop S","exact declared reference R","plan version/effective lifecycle binding","direction/provenance/basis"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Stop distance is unavailable because no approved versioned trader-recorded stop/reference lifecycle contract exists.","notes":"Never infer S from candles, broker orders, rules, exits or support."},
{"caseId":"C10-E17-02","caseType":"formal_paraphrase","input":"Calculate signed direction-aware distance from the declared reference to the effective trader-recorded stop.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["stop_distance"],"expectedFilters":["trusted selected lifecycle"],"expectedGroupings":[],"expectedOperators":["future only: long R-S; short S-R"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected lifecycle","expectedContextRequirements":["accepted R/S/direction","version/effective event","amendment precedence","compatible instrument/currency basis"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"The future signed formula cannot run until accepted effective stop/reference facts are available.","notes":"Formula documentation is not runtime data and preserves future zero/negative values."},
{"caseId":"C10-E17-03","caseType":"conversational_paraphrase","input":"How far was my planned stop from entry on the selected trade?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["stop_distance"],"expectedFilters":["trusted selected lifecycle"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected lifecycle","expectedContextRequirements":["explicit recorded stop","accepted entry/reference convention","effective plan version"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Planned stop distance is unavailable without a structured trader-recorded stop and effective version.","notes":"No candle low or order is treated as plan intent."},
{"caseId":"C10-E17-04","caseType":"trader_slang","input":"How wide was my stop on that selected setup?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["stop_distance"],"expectedFilters":["trusted selected lifecycle"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected lifecycle","expectedContextRequirements":["explicit stop/reference/version","signed versus absolute operator"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Do you mean signed planned stop distance or absolute stop width? The recorded stop contract is not available yet.","unsupportedExpected":true,"expectedUnsupportedReason":"Stop width is unavailable without accepted plan facts; slang does not create them.","notes":"Absolute distance would be explicit abs(D), never silent clamping."},
{"caseId":"C10-E17-05","caseType":"abbreviation","input":"SD stop-distance metric for the selected trade plan.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["stop_distance"],"expectedFilters":["trusted selected lifecycle"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected lifecycle","expectedContextRequirements":["explicit metric grammar","accepted stop/reference/version"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Explicit SD grammar identifies the unavailable metric but supplies no trader-recorded stop.","notes":"Bare SD remains ticker/token-like and never auto-routes."},
{"caseId":"C10-E17-06","caseType":"misspelling","input":"Show stop distnce for the selected trade plan.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["stop_distance"],"expectedFilters":["trusted selected lifecycle"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected lifecycle","expectedContextRequirements":["accepted stop/reference/version"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Spelling normalization does not repair absent trader-plan stop facts.","notes":"Do not invent a date, stop, reference or lifecycle."},
{"caseId":"C10-E17-07","caseType":"noisy_input","input":"stop dist selected trade plan pls","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["stop_distance"],"expectedFilters":["trusted selected lifecycle"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected lifecycle","expectedContextRequirements":["accepted R/S/direction/effective version"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"The stop-distance capability is unavailable because its structured plan facts are absent.","notes":"Noise does not create plan intent or private context."},
{"caseId":"C10-E17-08","caseType":"command","input":"Calculate signed long stop distance for the selected effective plan.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["stop_distance"],"expectedFilters":["trusted selected long lifecycle"],"expectedGroupings":[],"expectedOperators":["future only: R-S"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected lifecycle","expectedContextRequirements":["accepted R/S","effective plan version/lifecycle","provenance/basis"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Long R-S cannot run until accepted effective stop and reference facts exist.","notes":"Do not infer S from candle low, MAE, an order or actual exit."},
{"caseId":"C10-E17-09","caseType":"fragment","input":"Selected short plan stop distance.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["stop_distance"],"expectedFilters":["trusted selected short lifecycle"],"expectedGroupings":[],"expectedOperators":["future only: S-R"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected lifecycle","expectedContextRequirements":["accepted R/S","effective version"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Short S-R is unavailable without accepted stop/reference/version facts.","notes":"Preserve future signed zero/negative results rather than clamp."},
{"caseId":"C10-E17-10","caseType":"follow_up","input":"Now show stop distance for that same selected lifecycle.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["stop_distance"],"expectedFilters":["prior trusted lifecycle"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":"prior trusted scope","expectedSelectedEntity":"prior trusted lifecycle","expectedContextRequirements":["trusted prior scope","accepted effective stop/reference/version"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Trusted prior scope cannot repair the missing trader-plan stop contract.","notes":"Never reuse a later amendment or inferred order level."},
{"caseId":"C10-E17-11","caseType":"correction","input":"I meant my recorded planned stop, not MAE or the candle low.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["stop_distance"],"expectedFilters":["prior trusted lifecycle","exclude MAE/candle meanings"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":"prior trusted scope","expectedSelectedEntity":"prior trusted lifecycle","expectedContextRequirements":["accepted recorded stop/reference/version"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"The corrected planned-stop request remains unavailable because structured plan facts are absent.","notes":"No market extreme substitutes for trader intent."},
{"caseId":"C10-E17-12","caseType":"comparison","input":"Compare stop distances for two selected trade plans.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["stop_distance"],"expectedFilters":["two trusted selected lifecycles"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":{"left":"selected plan A","right":"selected plan B","basis":"future compatible signed stop distance"},"expectedTimeRange":null,"expectedSelectedEntity":"two trusted lifecycles","expectedContextRequirements":["accepted effective stop/reference per plan","compatible conventions/bases"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Comparison is unavailable because neither canonical versioned stop-distance fact set is approved.","notes":"Do not compare inferred order or candle levels."},
{"caseId":"C10-E17-13","caseType":"ranking","input":"Rank selected plans by absolute stop width.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["stop_distance"],"expectedFilters":["trusted selected lifecycle set"],"expectedGroupings":[],"expectedOperators":["future only: abs(D)"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected lifecycle set","expectedContextRequirements":["accepted stop/reference/version per plan","explicit absolute operator","compatible bases/ties"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Stop-width ranking is unavailable without accepted comparable plan facts.","notes":"Absolute width is explicit and does not activate data or imply risk advice."},
{"caseId":"C10-E17-14","caseType":"negation","input":"Show planned stop distance, not candle MAE or broker-order distance.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["stop_distance"],"expectedFilters":["exclude MAE/order meanings"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["accepted trader-recorded stop contract"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Excluding inferred alternatives still leaves no approved trader-recorded stop/reference facts.","notes":"No fallback remains."},
{"caseId":"C10-E17-15","caseType":"exclusion","input":"Calculate stop distance excluding amended plan versions.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["stop_distance"],"expectedFilters":["exclude amended versions"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["approved effective-version/amendment precedence","accepted R/S"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"An exclusion cannot define effective-version precedence or create missing plan facts.","notes":"No version is silently discarded."},
{"caseId":"C10-E17-16","caseType":"multi_filter","input":"Show signed stop distance for selected long NVDA plans under their effective versions.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["stop_distance"],"expectedFilters":["trusted selected lifecycles","long","NVDA","effective version"],"expectedGroupings":[],"expectedOperators":["future only: R-S"],"expectedComparison":null,"expectedTimeRange":"trusted selected scope","expectedSelectedEntity":"trusted selected lifecycle set","expectedContextRequirements":["validated NVDA symbol","accepted R/S/version/lifecycle","compatible basis","privacy-safe scope"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Complete filters do not enable stop distance without accepted structured plan facts.","notes":"No dates, levels or other account data are invented."},
{"caseId":"C10-E17-17","caseType":"multi_part","input":"Show MAE and planned stop distance for the selected trade.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["mae","stop_distance"],"expectedFilters":["trusted selected lifecycle"],"expectedGroupings":[],"expectedOperators":["candle MAE if covered"],"expectedComparison":null,"expectedTimeRange":"selected held window","expectedSelectedEntity":"trusted selected lifecycle","expectedContextRequirements":["separate candle coverage","missing trader-plan stop contract","distinct capability states"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"MAE may be returned separately, but planned stop distance remains unavailable.","notes":"Never infer S from MAE or candle lows/highs."},
{"caseId":"C10-E17-18","caseType":"ambiguous","input":"How far was my stop?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["stop_distance"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["plan versus order/rule/actual-exit meaning","signed versus absolute","selected lifecycle"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Do you mean an explicitly recorded trade-plan stop, broker order, or another level? Planned stop data is unavailable.","unsupportedExpected":true,"expectedUnsupportedReason":"The stop meaning and accepted plan facts are absent.","notes":"No level, date, direction or account context is invented."},
{"caseId":"C10-E17-19","caseType":"negative_example","input":"Use the candle low as my stop and tell me where I should place it next time.","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["stop_distance"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no candle inference","no stop advice"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"A candle low cannot create trader stop intent, and stop placement advice is unsupported.","notes":"Reject both inference and advice."},
{"caseId":"C10-E17-20","caseType":"unsupported_data","input":"Calculate stop distance from an unversioned broker stop order with no effective lifecycle binding.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["stop_distance"],"expectedFilters":["broker order only","missing version/lifecycle"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected lifecycle","expectedContextRequirements":["accepted trader-recorded stop/reference","version/effective lifecycle/provenance"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"A broker order does not prove trader-plan intent and lacks the required version/effective-lifecycle contract.","notes":"Never infer plan facts from order existence."},
{"caseId":"C10-E17-21","caseType":"selected_entity_context","input":"Show stop distance for the trade selected in replay.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["stop_distance"],"expectedFilters":["trusted selected replay lifecycle"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":"selected lifecycle context","expectedSelectedEntity":"trusted server-authorized replay lifecycle","expectedContextRequirements":["server-authoritative account scope","accepted R/S/version/effective binding","privacy-safe output"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Trusted selection supplies scope but not the absent trader-plan stop facts.","notes":"Do not expose another account or infer stop from chart display."},
{"caseId":"C10-E17-22","caseType":"cross_category","input":"Explain planned stop distance beside gross P/L for the selected trade.","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["stop_distance","gross_pnl"],"expectedFilters":["trusted selected lifecycle","gross P/L basis"],"expectedGroupings":[],"expectedOperators":["separate gross P/L fact"],"expectedComparison":null,"expectedTimeRange":"selected lifecycle context","expectedSelectedEntity":"trusted selected lifecycle","expectedContextRequirements":["missing trader-plan stop contract","Category 2 gross basis","no causation or advice","account scope"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Gross P/L may be described separately, but stop distance is unavailable and cannot support causal analysis.","notes":"Never manufacture plan facts to explain performance."}
]
```

## 7.19 `target_distance` Cases

```json
[
{"caseId":"C10-E18-01","caseType":"canonical","input":"Show target distance for the selected trade plan.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["target_distance"],"expectedFilters":["trusted selected lifecycle"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected lifecycle","expectedContextRequirements":["explicit accepted trader-recorded target Q","exact declared reference R","plan version/effective lifecycle binding","direction/provenance/basis"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Target distance is unavailable because no approved versioned trader-recorded target/reference lifecycle contract exists.","notes":"Never infer Q from candles, broker orders, rules, exits or resistance."},
{"caseId":"C10-E18-02","caseType":"formal_paraphrase","input":"Calculate signed direction-aware distance from the declared reference to the effective trader-recorded target.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["target_distance"],"expectedFilters":["trusted selected lifecycle"],"expectedGroupings":[],"expectedOperators":["future only: long Q-R; short R-Q"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected lifecycle","expectedContextRequirements":["accepted R/Q/direction","version/effective event","amendment precedence","compatible instrument/currency basis"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"The future signed formula cannot run until accepted effective target/reference facts are available.","notes":"Formula documentation is not runtime data and preserves future zero/negative values."},
{"caseId":"C10-E18-03","caseType":"conversational_paraphrase","input":"How far was my planned target from entry on the selected trade?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["target_distance"],"expectedFilters":["trusted selected lifecycle"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected lifecycle","expectedContextRequirements":["explicit recorded target","accepted entry/reference convention","effective plan version"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Planned target distance is unavailable without a structured trader-recorded target and effective version.","notes":"No candle high or limit order is treated as plan intent."},
{"caseId":"C10-E18-04","caseType":"trader_slang","input":"How much room was there to my target on that selected setup?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["target_distance"],"expectedFilters":["trusted selected lifecycle"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected lifecycle","expectedContextRequirements":["explicit target/reference/version","signed versus absolute operator"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Do you mean signed planned target distance or absolute distance? The recorded target contract is not available yet.","unsupportedExpected":true,"expectedUnsupportedReason":"Target distance is unavailable without accepted plan facts; slang does not create them.","notes":"Absolute distance would be explicit abs(D), never silent clamping."},
{"caseId":"C10-E18-05","caseType":"abbreviation","input":"TD target-distance metric for the selected trade plan.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["target_distance"],"expectedFilters":["trusted selected lifecycle"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected lifecycle","expectedContextRequirements":["explicit metric grammar","accepted target/reference/version"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Explicit TD grammar identifies the unavailable metric but supplies no trader-recorded target.","notes":"Bare TD remains ticker/token-like and never auto-routes."},
{"caseId":"C10-E18-06","caseType":"misspelling","input":"Show target distnce for the selected trade plan.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["target_distance"],"expectedFilters":["trusted selected lifecycle"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected lifecycle","expectedContextRequirements":["accepted target/reference/version"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Spelling normalization does not repair absent trader-plan target facts.","notes":"Do not invent a date, target, reference or lifecycle."},
{"caseId":"C10-E18-07","caseType":"noisy_input","input":"target dist selected trade plan pls","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["target_distance"],"expectedFilters":["trusted selected lifecycle"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected lifecycle","expectedContextRequirements":["accepted R/Q/direction/effective version"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"The target-distance capability is unavailable because its structured plan facts are absent.","notes":"Noise does not create plan intent or private context."},
{"caseId":"C10-E18-08","caseType":"command","input":"Calculate signed long target distance for the selected effective plan.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["target_distance"],"expectedFilters":["trusted selected long lifecycle"],"expectedGroupings":[],"expectedOperators":["future only: Q-R"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected lifecycle","expectedContextRequirements":["accepted R/Q","effective plan version/lifecycle","provenance/basis"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Long Q-R cannot run until accepted effective target and reference facts exist.","notes":"Do not infer Q from candle high, MFE, order or actual exit."},
{"caseId":"C10-E18-09","caseType":"fragment","input":"Selected short plan target distance.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["target_distance"],"expectedFilters":["trusted selected short lifecycle"],"expectedGroupings":[],"expectedOperators":["future only: R-Q"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected lifecycle","expectedContextRequirements":["accepted R/Q","effective version"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Short R-Q is unavailable without accepted target/reference/version facts.","notes":"Preserve future signed zero/negative results rather than clamp."},
{"caseId":"C10-E18-10","caseType":"follow_up","input":"Now show target distance for that same selected lifecycle.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["target_distance"],"expectedFilters":["prior trusted lifecycle"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":"prior trusted scope","expectedSelectedEntity":"prior trusted lifecycle","expectedContextRequirements":["trusted prior scope","accepted effective target/reference/version"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Trusted prior scope cannot repair the missing trader-plan target contract.","notes":"Never reuse a later amendment or infer a limit-order level."},
{"caseId":"C10-E18-11","caseType":"correction","input":"I meant my recorded planned target, not MFE or the candle high.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["target_distance"],"expectedFilters":["prior trusted lifecycle","exclude MFE/candle meanings"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":"prior trusted scope","expectedSelectedEntity":"prior trusted lifecycle","expectedContextRequirements":["accepted recorded target/reference/version"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"The corrected planned-target request remains unavailable because structured plan facts are absent.","notes":"No market extreme substitutes for trader intent."},
{"caseId":"C10-E18-12","caseType":"comparison","input":"Compare target distances for two selected trade plans.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["target_distance"],"expectedFilters":["two trusted selected lifecycles"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":{"left":"selected plan A","right":"selected plan B","basis":"future compatible signed target distance"},"expectedTimeRange":null,"expectedSelectedEntity":"two trusted lifecycles","expectedContextRequirements":["accepted effective target/reference per plan","compatible conventions/bases"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Comparison is unavailable because neither canonical versioned target-distance fact set is approved.","notes":"Do not compare inferred order or candle levels."},
{"caseId":"C10-E18-13","caseType":"ranking","input":"Rank selected plans by absolute target distance.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["target_distance"],"expectedFilters":["trusted selected lifecycle set"],"expectedGroupings":[],"expectedOperators":["future only: abs(D)"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected lifecycle set","expectedContextRequirements":["accepted target/reference/version per plan","explicit absolute operator","compatible bases/ties"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Target-distance ranking is unavailable without accepted comparable plan facts.","notes":"Absolute distance is explicit and does not activate data or imply advice."},
{"caseId":"C10-E18-14","caseType":"negation","input":"Show planned target distance, not candle MFE or broker-order distance.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["target_distance"],"expectedFilters":["exclude MFE/order meanings"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["accepted trader-recorded target contract"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Excluding inferred alternatives still leaves no approved trader-recorded target/reference facts.","notes":"No fallback remains."},
{"caseId":"C10-E18-15","caseType":"exclusion","input":"Calculate target distance excluding amended plan versions.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["target_distance"],"expectedFilters":["exclude amended versions"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["approved effective-version/amendment precedence","accepted R/Q"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"An exclusion cannot define effective-version precedence or create missing plan facts.","notes":"No version is silently discarded."},
{"caseId":"C10-E18-16","caseType":"multi_filter","input":"Show signed target distance for selected short MSFT plans under their effective versions.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["target_distance"],"expectedFilters":["trusted selected lifecycles","short","MSFT","effective version"],"expectedGroupings":[],"expectedOperators":["future only: R-Q"],"expectedComparison":null,"expectedTimeRange":"trusted selected scope","expectedSelectedEntity":"trusted selected lifecycle set","expectedContextRequirements":["validated MSFT symbol","accepted R/Q/version/lifecycle","compatible basis","privacy-safe scope"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Complete filters do not enable target distance without accepted structured plan facts.","notes":"No dates, levels or other account data are invented."},
{"caseId":"C10-E18-17","caseType":"multi_part","input":"Show MFE and planned target distance for the selected trade.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["mfe","target_distance"],"expectedFilters":["trusted selected lifecycle"],"expectedGroupings":[],"expectedOperators":["candle MFE if covered"],"expectedComparison":null,"expectedTimeRange":"selected held window","expectedSelectedEntity":"trusted selected lifecycle","expectedContextRequirements":["separate candle coverage","missing trader-plan target contract","distinct capability states"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"MFE may be returned separately, but planned target distance remains unavailable.","notes":"Never infer Q from MFE or candle highs/lows."},
{"caseId":"C10-E18-18","caseType":"ambiguous","input":"How far was my target?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["target_distance"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["plan versus order/rule/actual-exit meaning","signed versus absolute","selected lifecycle"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Do you mean an explicitly recorded trade-plan target, broker order, or another level? Planned target data is unavailable.","unsupportedExpected":true,"expectedUnsupportedReason":"The target meaning and accepted plan facts are absent.","notes":"No level, date, direction or account context is invented."},
{"caseId":"C10-E18-19","caseType":"negative_example","input":"Use the candle high as my target and tell me where I should place it next time.","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["target_distance"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no candle inference","no target advice"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"A candle high cannot create trader target intent, and target placement advice is unsupported.","notes":"Reject both inference and advice."},
{"caseId":"C10-E18-20","caseType":"unsupported_data","input":"Calculate target distance from an unversioned sell-limit order with no effective lifecycle binding.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["target_distance"],"expectedFilters":["broker order only","missing version/lifecycle"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected lifecycle","expectedContextRequirements":["accepted trader-recorded target/reference","version/effective lifecycle/provenance"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"A broker order does not prove trader-plan intent and lacks the required version/effective-lifecycle contract.","notes":"Never infer plan facts from order existence."},
{"caseId":"C10-E18-21","caseType":"selected_entity_context","input":"Show target distance for the trade selected in replay.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["target_distance"],"expectedFilters":["trusted selected replay lifecycle"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":"selected lifecycle context","expectedSelectedEntity":"trusted server-authorized replay lifecycle","expectedContextRequirements":["server-authoritative account scope","accepted R/Q/version/effective binding","privacy-safe output"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Trusted selection supplies scope but not the absent trader-plan target facts.","notes":"Do not expose another account or infer target from chart display."},
{"caseId":"C10-E18-22","caseType":"cross_category","input":"Explain planned target distance beside gross P/L for the selected trade.","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["target_distance","gross_pnl"],"expectedFilters":["trusted selected lifecycle","gross P/L basis"],"expectedGroupings":[],"expectedOperators":["separate gross P/L fact"],"expectedComparison":null,"expectedTimeRange":"selected lifecycle context","expectedSelectedEntity":"trusted selected lifecycle","expectedContextRequirements":["missing trader-plan target contract","Category 2 gross basis","no causation or advice","account scope"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Gross P/L may be described separately, but target distance is unavailable and cannot support causal analysis.","notes":"Never manufacture plan facts to explain performance."}
]
```

Section 7 production and review are complete: all 396 saved cases passed
comprehensive independent Terra review with zero failures, and the controller
accepted the evaluation review gate. The final controller decision approves and
locks Category 10 at Version 1; no runtime or AI Chat capability is claimed.

# 8. Coverage Report Deliverable

The Version 1 coverage report is complete and passed comprehensive and clerical
independent Terra review. The controller accepted the canonical, registry,
evaluation, and coverage gates, approved and locked all canonical names and
registries, synchronized the master tracker, and marked Category 10 Complete.

| Coverage item | Current count | Status |
|---|---:|---|
| Controlling concepts | 18 / 18 | Exact source order retained, approved, and locked. |
| Canonical records | 18 / 18 | Complete, approved, and locked at Version 1. |
| Language registries | 18 / 18 | Each has all 38 ordered subsections; approved and locked at Version 1. |
| Evaluation arrays | 18 / 18 | C10-E1 through C10-E18 passed comprehensive independent Terra review. |
| Evaluation cases | 396 / 396 | Reviewed and passed; 0 failed. |
| Required type instances | 396 / 396 | Each of 22 ordered types appears once in every array. |
| Aggregate behavior counts | Clarification 24; Unsupported 96; Cross-category 18 | Derived directly from the 396 JSON cases. |
| Capability status cases | Planned 330; Unavailable 66 | Preserves 15 Planned concepts and 3 Unavailable concepts. |
| Canonical locks | 18 / 18 | All canonical names and registries are approved and locked. |

Review found no missing concept, registry subsection, evaluation type, case ID,
or required schema key. It accepted the existing source, interval, coverage,
session, corporate-action, currency, grain, privacy, no-causation, no-prediction,
and no-advice boundaries without creating runtime support or new market facts.

---

# 9. Acceptance Checklist

## Planning

- [x] Purpose is complete for the Version 1 category boundary.
- [x] Boundaries are complete for the Version 1 category boundary.
- [x] Dependencies are documented.
- [x] Risks are documented.
- [x] Planning questions are answered.

## Controlling Inventory

- [x] Complete 18-name canonical concept list exists.
- [x] Controlling-inventory statement is present.
- [x] No listed item was silently omitted, renamed, or merged.
- [x] Proposed additions/removals are separated.
- [x] Duplicate-concept review is complete.

## Canonical Inventory, Registry, Evaluation, and Coverage

- [x] Section 5 Batch 1 records `C10-CNDL-001` through `C10-CNDL-006` are
  drafted in exact controlling order.
- [x] Section 5 Batch 2 records `C10-CNDL-007` through `C10-CNDL-012` are
  drafted in exact controlling order.
- [x] Section 5 Batch 3 records `C10-CNDL-013` through `C10-CNDL-018` are
  drafted in exact controlling order.
- [x] Section 5 canonical records are complete for all 18 controlling items.
- [x] Section 6 Registry Batch 1 records `C10-CNDL-001` through
  `C10-CNDL-005` each contain all 38 required subsections in exact order.
- [x] Section 6 Registry Batch 2 records `C10-CNDL-006` through
  `C10-CNDL-010` each contain all 38 required subsections in exact order.
- [x] Section 6 Registry Batch 3 records `C10-CNDL-011` through
  `C10-CNDL-015` each contain all 38 required subsections in exact order.
- [x] Section 6 Registry Batch 4 records `C10-CNDL-016` through
  `C10-CNDL-018` each contain all 38 required subsections in exact order.
- [x] Section 6 language registries are complete for all 18 controlling items.
- [x] Section 7 Evaluation Batch 1 arrays C10-E1 through C10-E3 save exactly
  66 reviewed cases using all 22 ordered types and the locked 21-key schema.
- [x] Section 7 Evaluation Batch 2 arrays C10-E4 through C10-E6 save exactly
  66 additional reviewed cases using all 22 ordered types and the locked
  21-key schema.
- [x] Section 7 Evaluation Batch 3 arrays C10-E7 through C10-E9 save exactly
  66 additional reviewed cases using all 22 ordered types and the locked
  21-key schema.
- [x] Section 7 Evaluation Batch 4 arrays C10-E10 through C10-E12 save exactly
  66 additional reviewed cases using all 22 ordered types and the locked
  21-key schema.
- [x] Section 7 Evaluation Batch 5 arrays C10-E13 through C10-E15 save exactly
  66 additional reviewed cases using all 22 ordered types and the locked
  21-key schema.
- [x] Section 7 Evaluation Batch 6 arrays C10-E16 through C10-E18 save exactly
  66 additional reviewed cases using all 22 ordered types and the locked
  21-key schema.
- [x] Section 7 production contains all 396 required saved cases.
- [x] Section 7 Evaluation Batches 1-6 are independently reviewed and passed.
- [x] Section 7 evaluation cases are complete and reviewed.
- [x] Section 8 coverage counts and gaps are complete.

## Approval

- [x] Category passed review readiness.
- [x] Review changes are completed.
- [x] Canonical names are approved.
- [x] Canonical names are locked.
- [x] Version is updated.
- [x] Master tracker is updated.
- [x] Category is marked Complete.

---

# 10. Review Notes

## Reviewer Findings

- Comprehensive and clerical independent Terra review passed the exact 18-item
  Version 1 inventory, all eighteen Section 5 canonical records, all eighteen
  38-subsection Section 6 registries, all 396 evaluation cases, and the Section
  8 coverage report. All 396 cases passed with zero failures. The exact
  aggregate behavior counts are 24 clarification-expected cases, 96
  unsupported-expected cases, and 18 cross-category-boundary cases. The
  controller accepted all review gates, approved and locked the canonical names
  and registries, synchronized the master tracker, and marked Category 10
  Complete at Version 1.

## Required Changes

- None for Category 10 approval, lock, versioning, review coverage, or tracker
  synchronization. Relative volume, stop distance, and target distance retain
  their approved `Unavailable` dispositions, and the other fifteen concepts
  retain `Planned`. Runtime implementation remains outside this inventory.

## Completed Changes

- Version 1 planning inventory drafted from the exact Section 5.8 source list.
- Applied controller-accepted remediation: entry-zero-baseline long/short
  formulas; entry/exit-containing candle exclusions; exact Category 10
  giveback ownership with Category 9 reference-only routing; explicit completed-
  close price-change endpoints; exact allocation/single-entry grain boundaries;
  interval-aware time-to-extreme ranges and tie rule; and evidence-safe recovery
  true/false/unavailable semantics.
- Recorded the independent planning PASS and controller acceptance of the exact
  18-item planning inventory, then drafted Section 5 Batch 1 canonical records
  `C10-CNDL-001` through `C10-CNDL-006` in exact order. Those records are now
  approved and locked at Version 1.
- Drafted Section 5 Batch 2 canonical records `C10-CNDL-007` through
  `C10-CNDL-012` in exact order, preserving approved session/calendar and VWAP
  prerequisites, entry-containing-candle volume limitations, unavailable
  relative-volume denominator, and explicit completed-close price-change
  endpoints. Those names are now approved and locked at Version 1.
- Drafted Section 5 Batch 3 canonical records `C10-CNDL-013` through
  `C10-CNDL-018` in exact order, preserving interval-range extreme timing,
  evidence-safe recovery states, explicit post-exit horizons, and unavailable
  trader-recorded stop/target dependencies. Section 5 now covers all 18
  approved and locked controlling items.
- Recorded independent PASS for all eighteen Section 5 records and drafted
  Section 6 Registry Batch 1 for `C10-CNDL-001` through `C10-CNDL-005`. Each
  registry contains all 38 required subsections, uses only locked Category 1
  intents, and preserves acronym/ticker, formula, source, grain, sequence,
  privacy, no-causation, and no-advice boundaries.
- Drafted Section 6 Registry Batch 2 for `C10-CNDL-006` through
  `C10-CNDL-010`. Each registry contains all 38 required subsections, uses only
  locked Category 1 intents, and preserves strict denominators, signed VWAP,
  exchange-session HOD/LOD, entry-candle volume, source/basis, privacy,
  no-causation, and no-advice boundaries.
- Drafted Section 6 Registry Batch 3 for `C10-CNDL-011` through
  `C10-CNDL-015`. Each registry contains all 38 required subsections, uses only
  locked Category 1 intents, and preserves unavailable RVOL, exact explicit-
  close formulas, interval-range extrema timing, recovery sequence/coverage,
  source/basis, privacy, no-causation, and no-advice boundaries.
- Drafted Section 6 Registry Batch 4 for `C10-CNDL-016` through
  `C10-CNDL-018`. Each registry contains all 38 required subsections, uses only
  locked Category 1 intents, and preserves explicit post-exit horizons and
  completed-close coverage, unavailable versioned trader-plan stop/target
  facts, signed directional formulas, privacy, no-prediction, and no-advice
  boundaries. Section 6 now covers all 18 approved and locked registries.
- Recorded independent PASS for all eighteen Section 6 registries and drafted
  Section 7 Evaluation Batch 1 arrays C10-E1 through C10-E3. The 66 saved
  cases use the 22 ordered types, locked 21-key schema, and locked
  Category 1 intents while testing exact entry-zero MFE/MAE formulas, candle
  approximation and coverage limits, Category 10 sole giveback ownership,
  allocation grain, acronym safety, privacy, and no-causation/advice rules.
- Drafted Section 7 Evaluation Batch 2 arrays C10-E4 through C10-E6. The 66
  additional saved cases preserve entry-baselined long/short price
  endpoints, the same declared grain/window/basis and candle approximation,
  plus directional exit-move capture with a strictly positive MFE denominator,
  unclamped negative/over-100 results, explicit coverage, privacy, and safety.
- Drafted Section 7 Evaluation Batch 3 arrays C10-E7 through C10-E9. The 66
  additional saved cases preserve signed entry-minus-VWAP and its
  declared cumulative turnover/positive-volume exchange-session contract, plus
  no-lookahead pre-entry HOD/LOD distances under approved exchange calendars,
  continuous session-start coverage, no local-bucket fallback, source/basis,
  privacy, and no-causation/advice boundaries.
- Drafted Section 7 Evaluation Batch 4 arrays C10-E10 through C10-E12. The 66
  additional saved cases preserve exact containing-candle volume
  and intrabar-sequence limits, the explicit unavailable RVOL denominator
  boundary with no fallback, and direction-aware post-entry price change to an
  explicit later fully completed close without nearest/interpolated defaults.
- Drafted Section 7 Evaluation Batch 5 arrays C10-E13 through C10-E15. The 66
  additional saved cases preserve earliest-tie/stable-ID selection,
  interval elapsed ranges and exact-zero entry baselines for extrema timing,
  plus recovery's distinct adverse-then-later directional cross, same-candle
  sequence limit, false-only-with-complete-coverage rule, privacy, and safety.
- Drafted final Section 7 Evaluation Batch 6 arrays C10-E16 through C10-E18.
  The 66 additional saved cases preserve explicit covered post-exit
  horizons and completed-close formulas, plus unavailable stop/target contracts
  requiring exact trader-recorded levels, plan versions and effective lifecycle
  bindings without candle/order inference, prediction, advice or invented data.
- Recorded the comprehensive independent Terra PASS for all eighteen canonical
  records, all eighteen 38-subsection registries, all 396 evaluation cases, and
  the complete coverage report. All 396 cases passed with zero failures; the
  exact aggregate counts are 24 clarification-expected, 96 unsupported-
  expected, and 18 cross-category-boundary cases. The controller subsequently
  approved and locked the category, synchronized the master tracker, and marked
  it Complete at Version 1 without creating runtime support.
- Recorded the clerical synchronization of the master tracker to Category 10's
  Complete Version 1 state and accepted counts. The final controller decision
  approves and locks all canonical names and registries without establishing
  runtime support.

## Approval Decision

- Status: Complete.
- Approved by: Controller after comprehensive and clerical independent Terra
  PASS.
- Approval date: 2026-08-10.
- Version: 1.
- Canonical names and registries locked: Yes.

---

# 11. Change Log

| Date | Change | Reason | Version |
|---|---|---|---:|
| 2026-08-10 | Controller approved and locked Category 10; finalized Complete Version 1 | Accept all 18 canonical names and registries after comprehensive and clerical independent Terra PASS while preserving 396 passed, zero failed, exact behavior aggregates, the 15 Planned/3 Unavailable split, and the no-runtime boundary | 1 |
| 2026-08-10 | Recorded master-tracker synchronization for Category 10 | Reflect the tracker-aligned Ready for Review Version 0 state and accepted counts without changing content, approval, lock, Version 1, runtime, or Complete status | 0 |
| 2026-08-10 | Recorded comprehensive independent Terra PASS, completed Section 8, and advanced Category 10 to Ready for Review | Accept the canonical, registry, evaluation, and coverage review gates at Version 0 with 396 of 396 cases passed, zero failed, and exact behavior counts of 24 clarification-expected, 96 unsupported-expected, and 18 cross-category-boundary cases while retaining the unapproved and unlocked pre-lock boundary | 0 |
| 2026-08-10 | Saved final Section 7 Evaluation Batch 6 arrays C10-E16 through C10-E18; all 396 cases are saved and unreviewed | Complete exact 22-type/21-key production for explicit post-exit continuation and unavailable versioned trader-plan stop/target distances without fallback, review-pass, approval or lock claims | 0 |
| 2026-08-10 | Saved Section 7 Evaluation Batch 5 arrays C10-E13 through C10-E15; 330 of 396 cases are saved and unreviewed | Add exact 22-type/21-key coverage for interval-range extrema timing and evidence-safe recovery states without point-time, invented sequence, review-pass, approval or lock claims | 0 |
| 2026-08-10 | Saved Section 7 Evaluation Batch 4 arrays C10-E10 through C10-E12; 264 of 396 cases are saved and unreviewed | Add exact 22-type/21-key coverage for containing-candle volume, unavailable canonical RVOL, and explicit completed-close post-entry change without invented data, fallback, review-pass, approval or lock claims | 0 |
| 2026-08-10 | Saved Section 7 Evaluation Batch 3 arrays C10-E7 through C10-E9; 198 of 396 cases are saved and unreviewed | Add exact 22-type/21-key coverage for signed Session VWAP distance and approved-exchange-session no-lookahead HOD/LOD distances without local fallback, invented facts, review-pass, approval or lock claims | 0 |
| 2026-08-10 | Saved Section 7 Evaluation Batch 2 arrays C10-E4 through C10-E6; 132 of 396 cases are saved and unreviewed | Add exact 22-type/21-key coverage for favourable/adverse price endpoints and strict-positive-denominator unclamped move capture without claiming review passes, approval or lock | 0 |
| 2026-08-10 | Recorded all-18 registry independent PASS and saved Section 7 Evaluation Batch 1 arrays C10-E1 through C10-E3; 66 of 396 cases are saved and unreviewed | Add exact 22-type/21-key routing and safety coverage for MFE, MAE and Category 10 profit giveback without claiming review passes, runtime support, approval or lock | 0 |
| 2026-08-10 | Drafted Section 6 Registry Batch 4 for `C10-CNDL-016` through `C10-CNDL-018`; Section 6 now covers all 18 items | Add complete language coverage for explicit post-exit completed-close continuation and unavailable versioned trader-plan stop/target distances while preserving direction, source, coverage, privacy, prediction and advice boundaries | 0 |
| 2026-08-10 | Drafted Section 6 Registry Batch 3 for `C10-CNDL-011` through `C10-CNDL-015` | Add complete language coverage for unavailable relative volume, explicit post-entry close change, interval-range extrema timing and recovery-to-entry states while preserving denominator, sequence, source, privacy and safety boundaries | 0 |
| 2026-08-10 | Drafted Section 6 Registry Batch 2 for `C10-CNDL-006` through `C10-CNDL-010` | Add complete language coverage for capture percentage, signed entry-to-VWAP, exchange-session HOD/LOD distance, and entry-candle volume while preserving denominator, session, sequence, source, privacy and safety boundaries | 0 |
| 2026-08-10 | Recorded all-18 canonical independent PASS and drafted Section 6 Registry Batch 1 for `C10-CNDL-001` through `C10-CNDL-005` | Add complete language coverage for MFE, MAE, candle giveback and favourable/adverse endpoints while preserving acronym, evidence, coverage, sequence, privacy and safety boundaries | 0 |
| 2026-08-10 | Drafted Section 5 Batch 3 records `C10-CNDL-013` through `C10-CNDL-018`; Section 5 now covers all 18 items | Define interval-range extrema timing, recovery, explicit post-exit continuation and unavailable trader-plan stop/target contracts while preserving source, sequence, privacy and no-advice boundaries | 0 |
| 2026-08-10 | Drafted Section 5 Batch 2 records `C10-CNDL-007` through `C10-CNDL-012` | Define exact VWAP/session-range/entry-volume and explicit post-entry-close contracts while preserving unavailable relative volume, source coverage, sequence, privacy and no-advice boundaries | 0 |
| 2026-08-10 | Advanced to Deliverables In Progress and drafted Section 5 Batch 1 records `C10-CNDL-001` through `C10-CNDL-006` after independent planning PASS and controller acceptance | Define exact candle excursion, extrema, giveback, and capture records while preserving approximation, grain, coverage, privacy, and no-runtime boundaries | 0 |
| 2026-08-10 | Applied controller-accepted planning remediation; retained Inventory Drafted, unapproved/unlocked state and deferred Sections 5-8 | Fix zero baselines, eligible extrema boundaries, giveback ownership, explicit price-change endpoints, allocation grain, interval-aware extrema timing, and recovery semantics without inflating capability | 0 |
| 2026-08-10 | Initial Version 0 Category 10 planning inventory drafted; Sections 5-8 deferred | Preserve the exact 18-name source inventory and explicit interval, sequence, coverage, benchmark, privacy, and capability boundaries before canonical production | 0 |
