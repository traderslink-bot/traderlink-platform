# Trade Execution Analytics Engine Plan

> Project-local controlling document. Read the companion [Future Agent Compatibility Appendix](./trade_execution_analytics_engine_future_agent_compatibility_appendix.md) before extending this engine.

## Local Implementation Status

- Completed: deterministic v3 query foundation, exact metric registry, bounded evidence, replay identity, and the first currency-partitioned dashboard result panel.
- Completed for local migration testing: read-only conversion of existing saved SQLite rows into explicitly limited `legacy_migration` authority.
- Completed first stage: raw v3 broker CSV parsing creates canonical broker-confirmed executions from UTF-8 source bytes, explicit mapping, exact decimal strings, and declared UTC timestamps without using the legacy number-based importer.
- Completed authority checkpoint: accepted raw rows now form a read-only v3 authority with source-document manifest evidence and an explicit coverage limitation. The legacy bridge remains operational with a deterministic migration-batch document identity that is explicitly limited and never represents the original broker file.
- Completed persistence checkpoint: fully accepted raw v3 documents and their canonical executions are stored locally and rehydrated through a fail-closed read-only authority port. A document with any rejected row is not persisted as a partial financial authority.
- Completed dashboard-source checkpoint: the first v3 panel prefers a persisted exact raw authority when one exists and otherwise falls back to visibly limited migration data. It never silently substitutes migration results when an exact raw authority exists but the requested query is unavailable.
- Completed daily/timing checkpoint: daily P/L and session P/L have separate, currency-partitioned v3 query panels. Their legacy visualizations remain available until replacement behavior is further verified.
- Completed local-test coverage checkpoint: a complete-source-set, bounded-period local attestation can exercise closed-trade analytics with disposable import data. It is explicitly not broker account-history coverage and is invalidated by a document-scope change.
- Completed behavior checkpoint: trade-sequence and repeat-attempt P/L have separate, currency-partitioned v3 query panels. Legacy behavior surfaces remain available during migration verification.
- Completed appendix checkpoint: bounded compound grouping supports two or three distinct non-aggregate dimensions with deterministic, collision-safe identities and explicit group limits. Metric capability metadata advertises every supported grouping.
- Completed distribution foundation: a generic query-bound result now provides exact minimum, quartiles, conventional exact median, maximum, interquartile range, histogram-ready buckets, and bounded bucket evidence for P/L, gain/loss P/L, fees, holding time, size, notional, and daily P/L.
- Completed distribution findings: strict outer-quartile tails, Tukey 1.5×IQR outlier flags/fences, largest absolute-value concentration, and separately bound outlier evidence are included in the same exact result.
- Completed attribution foundation: any non-aggregate query grouping can return stable within-period segment contributions for P/L, gains, losses, frequency, average result, fees, and largest absolute trade concentration with bounded segment evidence.
- Completed period attribution: two compatible grouped periods now decompose exact P/L change into reconciling overall frequency, segment mix, and average-result effects, while reporting fee and largest-trade changes descriptively.
- Completed pagination: verified query results can be split into deterministic content-addressed pages with query/result-bound continuations, stable rows, page-scoped evidence, total/omitted counts, and bounded-source disclosure.
- Active: close the complete execution-derived metric catalog before further agent-facing or dashboard expansion. The catalog must cover every exact result derivable from verified execution records, or return an explicit unavailable state when a required execution field is absent.
- Completed catalog-audit checkpoint: the generic v3 registry now declares 121 exact execution-only metrics and the query executor projects every declared key. The plan-to-code closure matrix records each plan family as implemented composition, ingestion-quality authority, an explicit execution-field requirement, or non-execution-derived; do not duplicate a canonical metric under a dashboard-specific name.
- Completed fee-authority checkpoint: canonical executions declare charge coverage explicitly. Raw imports default to `unknown`, and net/fee/outcome/path calculations fail closed until coverage is declared `complete`; zero supplied charge rows are never implicitly fee-complete.
- Completed catalog-lock checkpoint: a machine-readable plan catalog binds all registered execution metrics to implemented plan families and preserves explicit entries for source-field-gated commission analytics and non-execution domains.
- Output-level audit checkpoint: the registry lock alone is not proof of end-user result completeness. `execution-plan-output-audit.md` maps the plan outputs to exact primitives and records the remaining query/packet gaps; do not claim full execution-output completion until those rows are resolved.
- Completed output-audit remediation: public source-kind/charge-coverage selection, realized trough recovery, content-addressed finding/sample packets, and FIFO per-kind charge allocation now exist in the shared deterministic engine. Commission-only metrics require a complete reconciled charge-kind allocation and fail closed otherwise.
- Completed data-quality receipt checkpoint: rejected raw-import rows are now persisted only as a separate non-financial quality receipt with exact counts and field-level reasons. They remain excluded from canonical execution and P/L authority.
- Deferred source upgrade: when the original May 2026 IBKR export is available, import its raw bytes through the v3 parser rather than promoting the legacy SQLite conversion to broker-authoritative evidence.

## Purpose

The Trade Execution Analytics Engine is the deterministic analytics engine for analyzing a trader’s executed trades.

Its job is to answer questions about how the trader actually performs based on verified trade execution data. It does not analyze candle charts, market structure, VWAP, float, market cap, news, catalysts, setups, or future price movement. Those belong to later engines.

This engine is focused only on what can be proven from trade execution records.

The engine should answer questions such as:

- How profitable am I?
- What conditions do I trade best or worst in?
- What times, tickers, price ranges, sizes, sessions, and behavior patterns are helping or hurting me?
- How do I perform after wins or losses?
- Do my later trades perform worse?
- Do repeat attempts on the same ticker hurt me?
- Am I giving back profits?
- How much do fees affect my results?
- What analytics can be proven, and what cannot be proven from the current data?

The engine must produce exact, deterministic, replayable results. It must not guess, infer missing facts, or use model reasoning to calculate analytics.

---

## Core Principle

The Trade Execution Analytics Engine is not an AI opinion layer.

It is a deterministic calculation engine.

It should:

- read verified trade execution data;
- normalize trades into a consistent internal model;
- calculate exact metrics;
- group, filter, compare, and rank results;
- return structured outputs;
- include evidence;
- include limitations;
- declare unsupported analytics when data is missing;
- preserve account, owner, broker, currency, and source authority boundaries.

The engine should never answer beyond the data it has.

---

## Engine Boundaries

### In Scope

The engine analyzes:

- executed trades;
- entries;
- exits;
- partial fills where available;
- trade timestamps;
- symbol/ticker;
- side/direction;
- quantity;
- entry price;
- exit price;
- gross P/L;
- net P/L;
- fees/commissions/charges where available;
- account;
- owner;
- broker/import source;
- currency;
- trade sequence;
- daily realized performance;
- prior trade outcome;
- repeat ticker attempts;
- position size;
- hold time;
- time of day;
- trading session where determinable from timestamps;
- trade price buckets;
- evidence trade IDs.

### Out of Scope

The engine does not analyze:

- candle data;
- VWAP;
- chart patterns;
- gap-and-go setups;
- breakout setups;
- pullback quality;
- support/resistance levels;
- float;
- market cap;
- relative volume;
- news catalysts;
- filings;
- dilution risk;
- scanner source;
- alert quality;
- planned risk versus actual risk unless risk-plan data exists;
- stop placement quality unless stop data exists;
- whether a trader “should have held longer” unless alternative-outcome authority exists;
- whether a trader “cut winners too early” unless alternative-outcome authority exists;
- whether a trader “held losers too long” unless exit-quality authority exists.

Those belong to future engines or require new data sources.

---

## Primary Data Model

The engine should operate on a normalized trade execution model.

### Required Trade Fields

At minimum, each trade should have:

- owner ID;
- account ID;
- trade ID;
- symbol/ticker;
- trade date;
- entry timestamp if available;
- exit timestamp if available;
- side/direction where available;
- quantity or share size;
- entry price;
- exit price;
- gross P/L or enough data to calculate it;
- net P/L or enough fee/charge authority to calculate it;
- currency;
- broker/import source;
- source row/execution identity;
- stable instrument identity where available.

### Optional Trade Fields

The engine can use these when available:

- individual fills;
- partial entries;
- partial exits;
- commissions;
- exchange fees;
- regulatory fees;
- borrow fees;
- route fees;
- execution venue;
- order type;
- broker account identifier;
- import batch ID;
- manual-entry flag;
- data-quality flags;
- user tags;
- setup tags;
- mistake tags;
- notes;
- session labels;
- imported realized P/L;
- broker-provided net amount.

### Derived Fields

The engine should deterministically derive:

- trading day;
- week;
- month;
- year;
- time bucket;
- session bucket;
- hold time;
- hold-time bucket;
- entry price bucket;
- position-size bucket;
- notional-size bucket;
- trade sequence number for the day;
- first trade / later trade;
- fourth-and-later flag;
- prior trade outcome;
- prior win/loss/flat state;
- repeat ticker attempt count;
- daily realized P/L before each trade where possible;
- daily realized P/L after each trade;
- day outcome;
- peak intraday realized P/L;
- trough intraday realized P/L;
- peak-profit giveback;
- intraday drawdown;
- win/loss streaks where supported by ordering.

---

## Authority and Privacy Rules

Every calculation must respect strict identity boundaries.

Analytics must never mix data across:

- different owners;
- different accounts unless explicitly requested and authorized;
- different currencies unless a valid currency-normalization layer exists;
- different broker/source authorities when that distinction matters;
- different instruments that only share a loose symbol but not a stable identity.

Each result should preserve:

- owner scope;
- account scope;
- currency;
- source dataset identity;
- filter identity;
- partition identity;
- query identity;
- result digest;
- evidence identity.

The engine must reject or clearly mark results that would cross unsafe boundaries.

---

## Data Quality System

The engine must track data completeness and data reliability.

### Data Quality States

Each trade or result may include data-quality states such as:

- complete;
- missing entry price;
- missing exit price;
- missing entry timestamp;
- missing exit timestamp;
- missing quantity;
- missing direction;
- missing gross P/L;
- missing net P/L;
- missing fee authority;
- missing broker source;
- missing stable instrument identity;
- missing account identity;
- unknown currency;
- partial fill details unavailable;
- manual entry;
- imported broker-authoritative;
- derived from available fields;
- unsupported;
- insufficient sample size.

### Result Authority States

Each analytics result should report an authority status:

- exact;
- verified execution-only;
- limited;
- incomplete;
- unavailable;
- unsupported.

The engine should not hide weak data. It should surface it.

---

## Core Metric Library

The engine should have a central metric library used consistently across all groupings and comparisons.

### Count Metrics

- total trades;
- included trades;
- excluded trades;
- unavailable trades;
- winning trades;
- losing trades;
- flat trades;
- trading days;
- green days;
- red days;
- flat days;
- repeat attempt trades;
- trades with missing fees;
- trades with missing timestamps;
- trades with missing price;
- trades with missing quantity.

### P/L Metrics

- gross P/L;
- net P/L;
- signed charges;
- commissions;
- fees;
- average P/L;
- median P/L;
- average gross P/L;
- average net P/L;
- median gross P/L;
- median net P/L;
- largest winner;
- largest loser;
- total winners;
- total losers;
- net P/L excluding largest winner;
- net P/L excluding largest loser;
- largest winner contribution;
- largest loser contribution.

### Win/Loss Metrics

- win rate;
- loss rate;
- flat rate;
- average winning trade;
- median winning trade;
- average losing trade;
- median losing trade;
- win/loss ratio;
- average win divided by average loss;
- profit factor;
- expectancy;
- payoff ratio;
- break-even win rate where calculable.

### Daily Metrics

- daily P/L;
- average daily P/L;
- median daily P/L;
- best day;
- worst day;
- average green day;
- average red day;
- median green day;
- median red day;
- green day percentage;
- red day percentage;
- flat day percentage;
- trades per day;
- average trades per day;
- median trades per day;
- maximum trades per day.

### Risk-Like Execution Metrics

These are not full risk-management metrics unless risk-plan data exists.

- maximum intraday realized drawdown;
- maximum peak-profit giveback;
- average peak-profit giveback;
- median peak-profit giveback;
- days with giveback;
- days with drawdown;
- green-to-red days where derivable;
- red-to-green days where derivable;
- largest intraday drop from realized peak;
- recovery after being red where derivable.

### Time Metrics

- average hold time;
- median hold time;
- shortest hold time;
- longest hold time;
- average hold time on winners;
- average hold time on losers;
- median hold time on winners;
- median hold time on losers;
- hold-time bucket performance.

### Size Metrics

- average share quantity;
- median share quantity;
- average entry notional;
- median entry notional;
- average position size;
- median position size;
- size bucket P/L;
- size bucket win rate;
- size bucket expectancy;
- average size on winners;
- average size on losers.

### Fee Impact Metrics

- gross versus net difference;
- fees per trade;
- average fees per trade;
- median fees per trade;
- fees as percentage of gross profit;
- fees as percentage of gross loss;
- fees by ticker;
- fees by price bucket;
- fees by broker/import source;
- fees by size bucket;
- fees impact on small trades;
- missing-fee count;
- missing-fee warning.

---

## Filtering System

The engine must support deterministic filters.

### Required Filters

- owner;
- account;
- date range;
- symbol/ticker;
- currency;
- broker/import source;
- direction;
- session;
- time range;
- price range;
- position-size range;
- hold-time range;
- trade sequence range;
- prior outcome;
- repeat attempt state;
- winning/losing/flat trade;
- manual versus imported trade if available.

### Optional Filters

- tag;
- setup tag;
- mistake tag;
- execution source;
- import batch;
- notes/metadata flags;
- trades with complete fee authority;
- trades with missing fee authority;
- trades with complete timestamps;
- trades with missing timestamps;
- trades with complete gross/net P/L authority.

### Unsupported Filters

If data is not available, the engine must return unsupported rather than approximate.

Examples:

- VWAP reclaim;
- gap-and-go setup;
- breakout setup;
- candle pattern;
- float;
- market cap;
- relative volume;
- news catalyst;
- scanner source;
- planned risk;
- stop type;
- true exit quality.

---

## Grouping System

The engine should support deterministic grouping.

### Time-Based Groupings

- by day;
- by week;
- by month;
- by year;
- by custom date range;
- by current period versus prior period;
- by rolling period where explicitly requested and supported.

### Intraday Groupings

- by hour;
- by custom minute bucket;
- by 9:30–10:00;
- by 10:00–11:00;
- by morning;
- by midday;
- by afternoon;
- by late day;
- by premarket, regular session, after-hours where determinable.

### Trade Behavior Groupings

- first trade of day;
- second trade of day;
- third trade of day;
- fourth-and-later trades;
- trade sequence bucket;
- after win;
- after loss;
- after flat;
- repeat ticker attempt;
- first ticker attempt;
- second ticker attempt;
- third-plus ticker attempt;
- overtrading sequence buckets.

### Symbol Groupings

- by ticker;
- by ticker and day;
- by ticker and repeat attempt;
- by most traded ticker;
- by worst ticker;
- by best ticker.

### Price and Size Groupings

- by entry price bucket;
- under $1;
- $1 to $2;
- $2 to $5;
- $5 to $10;
- above $10;
- custom price buckets;
- by share-size bucket;
- by notional-size bucket;
- by position-size bucket.

### Hold-Time Groupings

- under 1 minute;
- 1 to 5 minutes;
- 5 to 15 minutes;
- 15 to 60 minutes;
- over 60 minutes;
- custom hold-time buckets;
- hold-time bucket by winner/loser;
- hold-time bucket by ticker.

### Outcome Groupings

- winners;
- losers;
- flat trades;
- green days;
- red days;
- flat days;
- green-to-red days where derivable;
- red-to-green days where derivable.

---

## Comparison System

The engine should support deterministic comparisons.

### Period Comparisons

- this week versus last week;
- this month versus last month;
- current period versus prior period;
- custom date range versus custom baseline;
- last N trading days versus previous N trading days where supported.

### Group Comparisons

- best versus worst group;
- target condition versus all other trades;
- first trades versus later trades;
- fourth-and-later versus first-three trades;
- after-loss versus not-after-loss;
- after-win versus not-after-win;
- repeat ticker attempts versus first attempts;
- large size versus smaller size;
- low-price bucket versus higher-price bucket;
- short hold versus longer hold.

### Gross/Net Comparisons

- gross versus net P/L;
- before-fee versus after-fee performance;
- fee-complete trades versus fee-missing trades where appropriate;
- fee impact by price bucket;
- fee impact by size bucket.

### Unsupported Comparisons

The engine should reject comparisons where authority is missing.

Examples:

- setup A versus setup B without setup tags;
- VWAP reclaim versus non-VWAP reclaim without candle/VWAP data;
- planned risk versus actual result without planned risk data;
- cut-winners-early versus optimal exit without alternative-outcome authority.

---

## Ranking System

The engine should support deterministic ranking.

### Ranking Types

- top leaks;
- top strengths;
- worst groups;
- best groups;
- highest-confidence finding;
- weakest-confidence finding;
- biggest P/L drain;
- biggest positive contributor;
- largest giveback day;
- largest drawdown day;
- most traded ticker;
- worst ticker;
- best ticker;
- worst time window;
- best time window;
- worst price bucket;
- best price bucket;
- weakest size bucket;
- strongest size bucket;
- weakest hold-time bucket;
- strongest hold-time bucket.

### Ranking Rules

Rankings must be deterministic and documented.

The engine should not compare unrelated metrics blindly.

For example:

- P/L-based leaks should rank by net P/L;
- giveback rankings should rank by giveback amount;
- drawdown rankings should rank by drawdown amount;
- consistency rankings should rank by day outcome percentages;
- rule-to-test candidates should rank by verified weakness, sample size, authority, and evidence.

If cross-category ranking is unsafe, the engine should return category-specific rankings instead of forcing everything into one list.

---

## Evidence System

Every analytics answer should include evidence.

### Evidence Requirements

Each result should include:

- source trade IDs;
- evidence trade references;
- example trades;
- support examples;
- counterexample trades where useful;
- evidence count;
- omitted evidence count if bounded;
- source query digest;
- result digest.

### Evidence Limits

The engine should not return unlimited trades.

It should support bounded evidence, such as:

- top N supporting trades;
- top N counterexamples;
- evidence per group;
- total evidence cap;
- diagnostic cap.

### Evidence Purpose

Evidence should allow the UI or agent to show:

- which trades caused the result;
- how many trades were included;
- how much evidence was omitted;
- whether the finding is based on enough trades;
- whether a result is reliable.

---

## Sample Size System

The engine must enforce minimum sample rules.

### Sample Size States

- meets minimum sample;
- insufficient sample;
- no matching trades;
- unavailable due to missing data;
- unsupported due to missing authority.

### Minimum Sample Rules

Different analytics may need different minimums.

Examples:

- aggregate performance may require 1 trade;
- grouped performance may require at least 3 trades per group;
- comparisons may require minimum sample in both target and baseline;
- rankings should not promote groups below minimum sample;
- rule-to-test candidates should not be promoted from weak samples.

The engine should still return the raw structured result where useful, but clearly mark it as weak or insufficient.

---

## Unsupported Data System

The engine must clearly explain why it cannot answer.

### Unsupported Response Structure

Unsupported responses should include:

- unsupported code;
- required missing data;
- current available data;
- affected capability;
- whether the limitation is temporary or structural;
- whether the result is blocked or partially available.

### Common Unsupported Codes

- `setup_tags_required`;
- `mistake_tags_required`;
- `candle_data_required`;
- `market_data_required`;
- `vwap_authority_required`;
- `float_market_cap_required`;
- `relative_volume_required`;
- `news_catalyst_required`;
- `planned_risk_required`;
- `exit_quality_or_alternative_outcome_authority_required`;
- `consecutive_loss_streak_filter_required` if not yet implemented;
- `pre_entry_daily_realized_state_filter_required` if not yet implemented;
- `fee_authority_required`;
- `timestamp_required`;
- `quantity_required`;
- `insufficient_sample_size`.

---

## Analytics Categories

## 1. Core Performance Analytics

The engine should provide a complete overview of trading performance.

### Required Outputs

- total trades;
- included/excluded/unavailable trades;
- gross P/L;
- net P/L;
- commissions/fees/charges;
- win/loss/flat counts;
- win/loss/flat rates;
- average trade;
- median trade;
- average winner;
- average loser;
- median winner;
- median loser;
- profit factor;
- expectancy;
- largest winner;
- largest loser;
- P/L excluding largest winner;
- P/L excluding largest loser;
- largest winner contribution;
- largest loser contribution.

### Questions Supported

- Am I profitable?
- What is my net P/L?
- What is my gross P/L?
- How much do fees affect me?
- What is my win rate?
- What is my expectancy?
- Is my profitability dependent on one big winner?
- Is one big loser destroying my results?

---

## 2. Daily, Weekly, and Monthly Analytics

The engine should analyze performance over calendar periods.

### Required Outputs

- daily P/L;
- weekly P/L;
- monthly P/L;
- green days;
- red days;
- flat days;
- average daily P/L;
- median daily P/L;
- best day;
- worst day;
- average trades per day;
- median trades per day;
- maximum trades per day;
- this week versus last week;
- this month versus last month;
- custom period versus prior period.

### Questions Supported

- How did I do today?
- How did I do this week?
- How did I do this month?
- Am I improving versus last week?
- Am I improving versus last month?
- What was my best day?
- What was my worst day?
- How often am I green versus red?

---

## 3. Time and Session Analytics

The engine should analyze performance by trade time.

### Required Outputs

- time-of-day performance;
- best time window;
- worst time window;
- hourly buckets;
- custom minute buckets;
- session performance;
- premarket performance where determinable;
- regular session performance;
- after-hours performance where determinable;
- opening window performance;
- midday performance;
- late-day performance.

### Questions Supported

- What time of day do I trade worst?
- What time of day do I trade best?
- Is the open hurting me?
- Do I trade better after 10:00?
- Do I perform worse in premarket?
- Do I perform better in regular session?

---

## 4. Behavior Analytics

The engine should analyze behavior that can be proven from trade order and outcomes.

### Required Outputs

- after-win performance;
- after-loss performance;
- after-flat performance if useful;
- first trade performance;
- second trade performance;
- third trade performance;
- fourth-and-later performance;
- first trade versus later trades;
- repeat ticker attempt performance;
- first attempt versus repeat attempts;
- overtrading proxy based on sequence/trade count;
- behavior leak ranking;
- behavior strength ranking;
- behavior rule-to-test candidates.

### Questions Supported

- Do I trade worse after a loss?
- Do I trade worse after a win?
- Do my later trades perform worse?
- Do my fourth-and-later trades hurt me?
- Do repeat attempts on the same ticker hurt me?
- Am I overtrading?
- What behavior is hurting me most?

---

## 5. Consecutive Streak Analytics

The engine should support streak analytics where trade ordering and outcomes allow it.

### Required Outputs

- longest winning streak;
- longest losing streak;
- current streak where relevant;
- after two consecutive losses;
- after three consecutive losses;
- after two consecutive wins;
- after three consecutive wins;
- performance after losing streaks;
- performance after winning streaks;
- performance after breaking a losing streak.

### Questions Supported

- What happens after I take two losses?
- What happens after I take three losses?
- Do I spiral after a losing streak?
- Do I get overconfident after winning streaks?
- What is my longest losing streak?
- What is my longest winning streak?

### Boundary

If the engine cannot establish verified trade sequence order, it must return unsupported.

---

## 6. Pre-Entry Daily State Analytics

The engine should support daily realized-state analytics if it can compute realized P/L before each trade.

### Required Outputs

- trades taken while already green on the day;
- trades taken while already red on the day;
- trades taken after first win of the day;
- trades taken after first loss of the day;
- trades after giving back open realized profit;
- trades after crossing from green to red;
- trades after recovering from red to green.

### Questions Supported

- Do I trade badly after I am already green?
- Do I trade badly after I am already red?
- Do I give back profits after being green?
- Do I recover well after starting red?
- Should I stop after my first win?
- Should I stop after my first loss?

### Boundary

The engine can only support this if trade ordering and realized intraday P/L before each trade are reliable.

Daily goals and max-loss rules require user-defined thresholds. Without those thresholds, the engine should not claim “after daily goal” or “after max loss.”

---

## 7. Ticker Analytics

The engine should analyze performance by ticker.

### Required Outputs

- P/L by ticker;
- net P/L by ticker;
- gross P/L by ticker;
- win rate by ticker;
- expectancy by ticker;
- average trade by ticker;
- most traded tickers;
- best tickers;
- worst tickers;
- repeat attempts by ticker;
- first attempt versus repeat attempt by ticker;
- ticker concentration.

### Questions Supported

- Which tickers hurt me most?
- Which tickers help me most?
- Do I overtrade the same ticker?
- Do repeat attempts on one ticker hurt me?
- Am I too concentrated in one ticker?

---

## 8. Price Analytics

The engine should analyze performance by entry price.

### Required Outputs

- under $1;
- $1 to $2;
- $2 to $5;
- $5 to $10;
- above $10;
- custom price buckets;
- P/L by price bucket;
- win rate by price bucket;
- expectancy by price bucket;
- average trade by price bucket;
- best price range;
- worst price range.

### Questions Supported

- Do I trade worse under $1?
- Do I trade better under $5?
- Which price range hurts me most?
- Which price range is strongest?
- Are low-priced stocks hurting me?

---

## 9. Position Size Analytics

The engine should analyze performance by size.

### Required Outputs

- share-size buckets;
- notional-size buckets;
- average size;
- median size;
- average size on winners;
- average size on losers;
- performance by size bucket;
- large-size weakness;
- small-size performance;
- size after win;
- size after loss.

### Questions Supported

- Do larger positions hurt me?
- Do I size up after losses?
- Do I size up after wins?
- Are small trades more profitable?
- What position size performs best?

---

## 10. Hold-Time Analytics

The engine should analyze performance by trade duration.

### Required Outputs

- average hold time;
- median hold time;
- hold-time buckets;
- quick scalp performance;
- medium hold performance;
- long hold performance;
- hold time on winners;
- hold time on losers;
- hold time by ticker;
- hold time by time window.

### Questions Supported

- Do quick scalps work better for me?
- Do longer holds hurt me?
- What hold time performs best?
- Are my losing trades held longer than winners?

### Boundary

The engine may say:

- long-hold trades perform worse;
- losing trades have longer average hold time.

The engine may not say:

- you held losers too long;
- you cut winners too early.

Those require exit-quality or alternative-outcome authority.

---

## 11. Direction Analytics

The engine should analyze long and short performance where direction exists.

### Required Outputs

- long P/L;
- short P/L;
- long win rate;
- short win rate;
- long expectancy;
- short expectancy;
- direction by ticker;
- direction by time window;
- direction by price bucket.

### Questions Supported

- Am I better long or short?
- Do shorts hurt me?
- Do long trades perform better at certain times?
- Do short trades perform better on certain tickers?

### Boundary

If the user does not short or direction is missing, return unavailable or unsupported rather than misleading output.

---

## 12. Giveback and Drawdown Analytics

The engine should analyze realized intraday performance path where trade ordering supports it.

### Required Outputs

- maximum intraday drawdown;
- maximum peak-profit giveback;
- average giveback;
- median giveback;
- days with biggest giveback;
- days with biggest drawdown;
- green-to-red days;
- red-to-green days;
- best recovery days;
- worst giveback days;
- giveback after first win where derivable;
- giveback after third trade where derivable;
- giveback by time/session where derivable.

### Questions Supported

- Do I give back profits?
- Which days had the worst giveback?
- How bad is my intraday drawdown?
- Do I go green then red?
- Do I recover from red days?
- Do later trades cause giveback?

---

## 13. Fee and Commission Analytics

The engine should analyze fee impact.

### Required Outputs

- gross versus net P/L;
- total fees;
- average fees per trade;
- median fees per trade;
- fees by ticker;
- fees by price bucket;
- fees by size bucket;
- fees by broker/import source;
- fee impact on small trades;
- fee impact as percentage of gross profit;
- missing-fee warning.

### Questions Supported

- How much are fees costing me?
- Are fees hurting my small trades?
- Which broker has the highest fees?
- Are commissions turning winners into losers?
- Is my net performance much worse than gross?

### Boundary

Manual trades without fee data should not be treated as fee-complete. The engine must mark missing-fee authority.

---

## 14. Data Quality Analytics

The engine should report data quality as part of analytics.

### Required Outputs

- trades missing timestamps;
- trades missing prices;
- trades missing quantity;
- trades missing fee authority;
- trades missing direction;
- trades missing account identity;
- trades with manual-entry limitations;
- trades with imported broker authority;
- analytics blocked by missing data;
- analytics limited by missing data.

### Questions Supported

- Can this result be trusted?
- What data is missing?
- Which analytics are unavailable?
- Are my manual trades incomplete?
- Are broker-imported trades more complete?
- Why can’t the engine answer this?

---

## 15. Analytics Summary and Finding Packets

The engine should return summary packets that downstream UI or agents can use.

### Required Outputs

- top leaks;
- top strengths;
- weak findings;
- unsupported findings;
- sample-size warnings;
- limitation warnings;
- evidence coverage;
- next focus;
- rules to test;
- ranked findings by category;
- structured answer packet.

### Packet Requirements

Each packet should include:

- capability key;
- metric values;
- sample size;
- authority status;
- limitation codes;
- evidence trade references;
- source digest;
- result digest;
- unsupported data summary where applicable.

---

## Rule-to-Test Candidate System

The engine may suggest rules to test, but it must not claim that rules are proven improvements unless a valid simulation or comparison proves it.

### Acceptable Rule-to-Test Candidates

- wait after loss;
- stop after consecutive losses where streak data supports it;
- skip fourth-and-later trades;
- skip repeat attempts;
- maximum trades per day;
- avoid weak time window;
- avoid weak price bucket;
- reduce size after loss;
- stop after profit giveback.

### Required Rule Candidate Status

Rules must be labeled as:

- `rule_to_test`;
- not proven;
- needs simulation or future validation;
- supported by historical weakness only.

The engine should not claim:

- “This rule would have made you more money” unless simulation proves it.
- “You should always follow this rule” without validation.

---

## Result Shape

All analytics results should follow a consistent structure.

### Required Result Fields

- schema version;
- semantic version;
- capability key;
- metric keys;
- dimensions;
- filters;
- grouping;
- comparison type;
- included trade count;
- excluded trade count;
- unavailable trade count;
- sample size status;
- authority status;
- limitation codes;
- primary finding;
- secondary findings;
- ranked findings;
- metric tables;
- evidence trade references;
- evidence omitted count;
- unsupported data;
- digest/replay identity.

### Required Digest Identity

Each result should preserve:

- query plan digest;
- query result digest;
- execution receipt digest;
- baseline plan digest where applicable;
- baseline result digest where applicable;
- comparison digest where applicable;
- final result digest.

---

## Query and Answer Flow

The engine should support a predictable flow.

1. Receive a structured analytics request.
2. Validate owner/account/currency/source authority.
3. Normalize filters.
4. Build deterministic query plan.
5. Execute exact calculation.
6. Build evidence.
7. Apply sample-size rules.
8. Apply limitation rules.
9. Return structured result.
10. Preserve digest/replay identity.

The engine should be usable by:

- analytics pages;
- reporting views;
- exports;
- Analytics Agent v1;
- future Coach Agent;
- future simulation workflow.

---

## Completed Engine Definition

The Trade Execution Analytics Engine is considered complete for v1 when:

- all analytics supported by current trade execution data are implemented;
- unsupported analytics are explicitly blocked with missing-data reasons;
- all results include evidence and limitations;
- all major groupings and filters work deterministically;
- all core metrics are centralized and consistent;
- period comparisons work;
- behavior analytics work;
- price/size/time/session/hold-time/ticker analytics work;
- giveback/drawdown analytics work where order data supports them;
- fee impact is tracked where fee authority exists;
- missing-fee authority is reported;
- summary/ranking packets exist;
- rule-to-test candidates are clearly labeled as not proven;
- results are replayable and content-addressed;
- the model or UI receives structured analytics results, not raw trade history.

---

## Explicit Non-Goals for This Engine

This engine does not complete:

- Candle Analytics Engine;
- Market Context Engine;
- Setup Detection Engine;
- News/Catalyst Engine;
- Simulation Expansion Engine;
- Coach Agent personality;
- notifications;
- memory/profile;
- dashboard design;
- brokerage execution integration;
- live trading;
- trade signals.

Those are later systems.

---

## Final Product Role

The Trade Execution Analytics Engine is the foundation of the product.

It is the part that makes the app useful even before any AI personality exists.

The engine should be able to power:

- user analytics dashboards;
- plain-language analytics answers;
- trading review reports;
- evidence-backed findings;
- rule-to-test suggestions;
- future simulation selection;
- future Coach Agent responses.

The completed engine should make it possible for a user to ask almost any trade-execution analytics question and receive a truthful answer, a supported result, or a clear explanation of why the answer cannot be proven from the current data.
