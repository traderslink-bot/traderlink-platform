# Trader Intelligence v3 Post-GA0-B Direction Lock — Query, Simulation, Evidence, and Beta Candle Relay

**Date:** 2026-07-25 America/Toronto  
**Status:** owner direction lock for work after GA0-B4  
**Repository:** `traderslink-bot/traderslink-trader-improvement-system`  
**Operating profile:** `private_owner_alpha`  
**Accepted GA0-B3 merge:** `e46d9fea331aeefc262a6dc7a187b5c73678b398`

## 1. Decision

GA0-B4 remains the immediate implementation slice and must close the accepted two-tool deterministic proof exactly as planned.

After GA0-B4 is independently accepted and merged, Trader Intelligence v3 will not continue with a slow one-question/one-tool delivery model. The next program will build reusable engines and coherent capability packs:

1. a generic deterministic trade-query engine;
2. deterministic evidence retrieval and similar-trade search;
3. a generic counterfactual simulation engine;
4. an execution-only analytics pack;
5. an execution-only rule-simulation pack;
6. a private-owner beta candle relay and normalized market-context foundation;
7. VWAP, EMA9, EMA20, excursion, and candle-dependent simulation packs;
8. an owner-only AI agent that plans and explains over these verified capabilities.

Named tools remain governed presets and specialized semantic modules. They are not the required wording the user must know.

The product interaction goal is:

```text
natural-language question
  -> validated query or simulation plan
  -> read-only verified data gateway
  -> deterministic calculations
  -> exact tables, evidence, limitations, and counterexamples
  -> AI explanation over the verified result
```

The model must not calculate financial values, execute unrestricted SQL, receive arbitrary database authority, generate candle-derived numbers, or invent missing market data.

## 2. Pace and delivery ruling

The foundational GA0 audit cadence was appropriate for exact financial truth and the first proof tools. It must not be repeated as one large audit cycle for every ordinary analysis question.

After B4:

- build shared primitives once;
- deliver related capabilities in packs, normally several analyses or simulations per pack;
- avoid duplicating filter, grouping, metric, evidence, table, claim, and sample-policy logic;
- use one consolidated audit per coherent pack rather than one audit per simple preset;
- keep specialized audits for genuinely distinct semantics such as intrabar execution, trailing stops, or setup classification;
- prioritize usefulness to active small-cap and micro-cap traders;
- preserve exact truth, reproducibility, evidence, and honest limitations without letting process expand into unnecessary ceremony.

A large unbounded “build everything” PR is still prohibited. The faster unit of delivery is an engine or a coherent pack, not an individual user sentence and not the entire roadmap.

## 3. Immediate sequence

### 3.1 GA0-B4 — finish the deterministic proof

Deliver the accepted two-tool registry and runner, cross-artifact consistency, evidence resolution, diagnostics, property/differential/10,000-row scale proof, focused verifier, CI, and audit handoff.

Do not add the new query engine, candle relay, AI, or additional tool packs inside B4.

### 3.2 Short private calibration and gateway proof

After B4 merge, run a deliberately narrow owner-data calibration outside Git:

- prove B1–B4 against the owner’s real saved trade data;
- reconcile counts, exact P/L, exclusions, filters, evidence resolution, and performance;
- convert defects into synthetic regressions;
- prove a read-only server-side trade-data gateway for the future query engine;
- prove the private beta candle-request and normalization contract;
- do not turn calibration into another long foundational program.

### 3.3 GA1 — Query, Evidence, and Simulation Foundation

Deliver as a small number of coherent PRs, not one PR per named analysis.

Recommended sub-slices:

1. **GA1-A — Generic deterministic trade-query engine and read-only database gateway**
2. **GA1-B — Evidence retrieval, similar-trade search, and Execution-Only Analytics Pack 1**
3. **GA1-C — Generic counterfactual simulation engine and Execution-Only Simulation Pack 1**
4. **GA1-D — Minimal owner-facing query/evidence UI and owner-only AI routing/explanation**
5. **GA1-E — Beta candle relay, market-context features, and candle-dependent simulation pack**

The exact lettering may change, but the ordering and product intent are locked.

## 4. Generic deterministic trade-query engine

The engine must answer broad ordinary questions through validated building blocks rather than requiring a separate code path for every wording.

### 4.1 Read-only database gateway

The tool, not the model, reads verified trade data.

Requirements:

- server-side and read-only;
- exact workspace/owner/account scope;
- no unrestricted SQL from the model;
- validated allowlisted query plan;
- bounded rows, groups, metrics, comparisons, and evidence payloads;
- exact canonical financial arithmetic;
- currency separation;
- deterministic filters and ordering;
- evidence IDs that resolve to exact trades and executions;
- stable exclusions and limitations;
- rejection of unsupported fields, calculations, joins, or scopes;
- no private database file or provider credential exposed to the browser or model.

A future controlled analytics DSL is allowed. Arbitrary model-generated SQL is not.

### 4.2 Initial filters

- date or date range;
- account;
- symbol;
- long/short direction;
- currency;
- realized result;
- weekday;
- entry and exit time;
- price range;
- trade sequence within session;
- previous completed trade outcome;
- holding-time range;
- repeated ticker-attempt number;
- position-size range.

Later market-context filters may include setup, VWAP, EMA9, EMA20, session-high/low distance, gap, volume, extension, and market-data quality after those features are verified.

### 4.3 Initial groupings

- month and week;
- weekday;
- configurable time bucket;
- price range;
- trade sequence;
- previous completed outcome;
- repeat-attempt number;
- holding-time bucket;
- position-size bucket;
- long versus short;
- symbol;
- account;
- setup and market-context state when available.

### 4.4 Initial metrics

- candidate, included, and excluded count;
- win, loss, and flat count;
- exact gross P/L;
- exact fees and charges;
- exact net P/L;
- average and median P/L;
- expectancy;
- win rate;
- profit factor where exact policy permits;
- average and median position size;
- average and median holding time;
- largest-trade contribution;
- leave-largest-win/loss-out results;
- supporting and counterexample trades;
- evidence quality and limitations.

### 4.5 Example questions the engine must support

- “How did I trade in March?”
- “Why was March unprofitable?”
- “Compare March mornings with afternoons.”
- “Were stocks under $5 the problem?”
- “Did I size larger after losses in March?”
- “What times of day am I least profitable?”
- “How do I trade after a loss?”
- “Do my fourth and later trades perform worse?”
- “Compare this month with last month.”

The agent may compose several query plans to answer a broad diagnostic question. It must disclose the analyses run and avoid presenting a discovered accidental bucket as a proven edge.

## 5. Execution-Only Analytics Pack 1

Build these together over the generic engine:

- `analyze_performance_by_price_range`;
- `analyze_time_of_day`;
- `analyze_trade_sequence_performance`;
- `analyze_after_loss_behavior`;
- `analyze_after_win_behavior`;
- `analyze_ticker_repeat_attempts`;
- `analyze_holding_time`;
- `analyze_long_vs_short`;
- `analyze_position_size_performance`;
- `compare_periods`.

Each named capability is a governed preset or policy module defining allowed filters, groupings, metrics, comparison baseline, minimum sample policy, outlier policy, evidence selection, and allowed wording. It must not duplicate the engine.

## 6. Evidence retrieval and similar-trade search

### 6.1 Evidence retrieval

Given a verified result, table row, claim, series point, or trade, resolve:

- exact supporting trades;
- exact counterexamples;
- exact executions and occurrence references;
- included/excluded state and reasons;
- snapshot, filter, dataset, partition, tool, and policy identities;
- market-context snapshots when available;
- limitations and data-quality states.

### 6.2 Similar-trade search

The first version is deterministic and inspectable. It may match on:

- direction;
- price range;
- time of day;
- position size;
- holding time;
- trade sequence;
- previous outcome;
- repeated-attempt count;
- symbol or sector when explicitly selected;
- setup and market-context features when available.

Return why each trade matched, exact evidence links, summary statistics, and counterexamples. Embeddings may later assist discovery, but they do not replace exact filters or become financial authority.

Example question:

- “Find trades similar to this losing trade.”

## 7. Generic counterfactual simulation engine

The engine must accept a validated, versioned, composable rule plan.

A rule plan may define:

- scope and filters;
- actual or simulated entry policy;
- daily/session rules;
- trade-frequency rules;
- position-sizing policy;
- exit and stop policy;
- fallback behavior;
- commissions and fees;
- slippage and liquidity assumptions where required;
- candle/data-quality requirements;
- conservative ambiguity policy;
- evidence and comparison outputs.

The engine must return actual versus simulated results, days/trades helped and harmed, profitable trades removed, losing trades avoided, exclusions, counterexamples, outlier sensitivity, and exact evidence.

Historical optimization must be labeled as in-sample. A selected rule must be prospectively tracked before it is described as validated for the user.

## 8. Execution-Only Simulation Pack 1

Prioritize simulations that can run from verified executions and reconstructed trades without intraday candles.

### 8.1 Daily risk rules

- stop after N consecutive completed losses;
- stop after a daily dollar drawdown;
- stop after a daily percentage drawdown when denominator authority exists;
- stop after giving back a configured portion of peak realized daily profit;
- reduce size after entering daily drawdown;
- stop after N failed ticker attempts;
- lock the day after reaching a realized profit target;
- continue only with reduced size after a realized daily target.

### 8.2 Trade-frequency rules

- maximum trades per day;
- skip fourth-and-later trades;
- wait N minutes after a loss;
- do not immediately re-enter the same ticker;
- maximum attempts per ticker;
- stop after N losing attempts;
- no new trades after a selected time.

### 8.3 Entry-exclusion rules

- include/exclude selected weekdays;
- include/exclude selected time ranges;
- include/exclude selected price ranges;
- skip selected trade-sequence numbers;
- skip repeat attempts;
- skip trades after selected prior outcomes;
- long-only or short-only historical comparison.

### 8.4 Position-sizing rules

- fixed dollar size;
- fixed share size;
- fixed risk per trade when exact risk authority exists;
- normalized size relative to owner median;
- size by price range;
- reduce size after losses;
- cap size after daily drawdown;
- cap size on repeat ticker attempts;
- increase size only under an explicitly selected historically strong segment, with in-sample warning and prospective validation requirement.

## 9. Private-owner beta candle relay

### 9.1 Provider decision

For the private beta:

- the owner’s EODHD access is the primary historical candle source;
- the owner computer may fetch candles as the existing local application does;
- Yahoo may be used as an optional limited fallback for same-day or recent candles where availability, quality, and applicable terms permit;
- no exact Yahoo coverage duration is assumed by this decision;
- provider availability and limits are runtime capabilities, not hard-coded product truth.

Setup detection waits. Support/resistance redesign also waits.

### 9.2 Relay flow

```text
website analysis needs candles
  -> server creates a bounded candle request
  -> paired owner-local relay receives the request
  -> local relay fetches from EODHD or an allowed fallback
  -> local relay normalizes and validates candles
  -> normalized candle snapshot is uploaded to the website/backend
  -> backend stores or caches the content-addressed snapshot
  -> deterministic feature/simulation engine answers the question
```

### 9.3 Security and authority

- provider credentials remain on the owner computer;
- credentials are never sent to the browser, website database, model, logs, or Git;
- the browser cannot issue arbitrary provider requests;
- requests are allowlisted and bounded by symbol, interval, date window, and purpose;
- the owner can see relay status, requested coverage, failures, and cached coverage;
- uploads are idempotent and content-addressed;
- server-side authorization binds requests to the owner/workspace;
- private beta may use a simple paired local relay, but it must not become an unauthenticated public ingestion endpoint.

### 9.4 Normalized candle authority

Each accepted candle snapshot must bind at minimum:

- provider key and adapter version;
- symbol/instrument identity;
- interval;
- requested and actual coverage window;
- timezone/session calendar;
- adjusted/unadjusted policy;
- corporate-action quality state;
- ordered OHLCV values;
- missing/duplicate/out-of-order diagnostics;
- source and content digests;
- cutoff and no-lookahead authority;
- coverage/quality state.

Provider-specific payloads are not analytical authority. Features and simulations consume only normalized verified candle snapshots.

## 10. Market-context feature pack before setup detection

Use the candle relay to build reusable deterministic features:

- VWAP and distance from VWAP;
- VWAP reclaim/loss/rejection facts;
- EMA9;
- EMA20;
- EMA9 relative to EMA20;
- entry above/below VWAP, EMA9, and EMA20;
- session and premarket high/low distance;
- opening-range position;
- recent price extension;
- gap percentage;
- volume trend and relative volume where licensed and available;
- MFE and MAE;
- MFE/MAE timing;
- peak unrealized P/L;
- retained percentage of MFE;
- profit giveback;
- time spent profitable or underwater;
- market-data quality and no-lookahead state.

Initial market-context questions include:

- “Do I perform better above or below VWAP?”
- “How do trades above EMA9 and EMA20 perform?”
- “Do I enter too far above VWAP?”
- “How much profit do I give back?”
- “How often do stopped trades recover?”

## 11. Candle-dependent simulation pack

### 11.1 Profit taking

- sell 25%, 50%, or 75% at a selected percentage target;
- partial exits at multiple targets;
- full exit at a fixed target;
- scale out at fixed R multiples when exact risk exists;
- partial exit followed by actual historical exit;
- partial exit followed by break-even or trailing policy;
- compare one target with several smaller targets;
- bounded target sweep with explicit in-sample warning.

### 11.2 Stops and exits

- fixed percentage or dollar stop;
- break-even stop after target;
- trailing percentage/dollar stop;
- trail from peak/MFE;
- maximum hold time;
- exit after no new high for N minutes;
- exit after a failed breakout when a deterministic event contract exists;
- exit on VWAP loss/reclaim;
- exit on EMA9 or EMA20 loss;
- time-stop while underwater;
- exit after giving back a selected portion of peak unrealized profit.

### 11.3 Entry filters

- avoid entries too far above/below VWAP;
- avoid entries near session or premarket high under a defined distance policy;
- require a deterministic pullback fact before entry;
- avoid entries after consecutive expansion candles;
- require minimum liquidity/volume under an explicit data-quality policy.

Support/resistance congestion, clear-space rules, and level-based exits remain deferred until the accepted v3 zone-synthesis redesign exists.

### 11.4 Mandatory simulation assumptions

Every candle-dependent simulation must disclose and version:

- bar resolution;
- intrabar target/stop ordering;
- same-bar ambiguity policy;
- gap-through behavior;
- commissions and fees;
- slippage;
- liquidity/volume participation assumptions;
- partial-fill policy;
- missing coverage;
- halt handling where authoritative data exists;
- exclusions and quality state.

## 12. Setup detection deferred

Setup detection is valuable but is not in the immediate program.

It begins only after:

- generic query/evidence foundations are accepted;
- candle relay and normalized market context are reliable;
- VWAP/EMA/extension/session features are versioned;
- user correction and confidence policies are defined.

The eventual approach remains hybrid: deterministic candidate generation, optional AI classification for ambiguous candidates, confidence thresholds, user correction, and versioned reclassification. AI must not silently assign setups as financial truth.

## 13. Owner-only AI timing

Do not wait for every future tool before delivering AI.

The minimal owner-only AI becomes useful once the accepted system has:

- the B4 runner and artifact verification;
- generic query engine;
- evidence retrieval;
- similar-trade search;
- Execution-Only Analytics Pack 1;
- generic simulation engine with an initial execution-only rule pack.

The AI may:

- interpret broad natural-language questions;
- select one or more approved query, analytics, evidence, and simulation capabilities;
- create validated plans;
- request missing scope only when necessary;
- compare verified results;
- explain exact findings and limitations;
- cite supporting and counterexample trades;
- suggest historical rule candidates and follow-up analyses.

The AI may not:

- calculate from raw rows;
- execute unrestricted SQL;
- access provider credentials;
- invent candles or setups;
- ignore insufficient evidence;
- generate live buy/sell signals;
- describe historical optimization as a validated future edge.

## 14. Testing and audit model after B4

- focused tests during engine development;
- property and differential tests for shared primitives;
- independent reference implementations for mathematically distinct simulations;
- fixed synthetic datasets and owner-data calibration outside Git;
- one final TypeScript/checkpoint per coherent pack;
- consolidated verifier and CI per engine or pack;
- build/browser tests only when UI or browser-facing behavior changes;
- audit shared engines deeply;
- audit related presets together when they only declare governed configurations over an accepted engine;
- do not create a year-long queue of one-tool PRs.

## 15. Explicit deferrals

Not in the immediate post-B4 program:

- setup detection/classification;
- support/resistance or zone synthesis;
- catalyst classification;
- full historical market-universe strategy backtesting over stocks the owner did not trade;
- public multi-user hosting and production migration;
- broker automation or live trading signals;
- Real Coach, Whop, Academy expansion, or broad behavioral labels.

Journal-based historical counterfactual backtesting over the owner’s actual trades is in scope. Full market-universe strategy backtesting is a later separate product surface requiring universe, delisting, corporate-action, liquidity, halt, borrow, and no-lookahead controls.

## 16. Acceptance of this direction lock

This document changes post-B4 priority and delivery shape. It does not modify GA0-B4 requirements or authorize implementation before B4 acceptance.

The controlling entry point and latest project-log addendum must reference this document. Future implementation plans must preserve these decisions unless the owner explicitly supersedes them.
