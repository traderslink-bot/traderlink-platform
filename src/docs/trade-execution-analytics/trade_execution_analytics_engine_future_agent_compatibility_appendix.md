# Trade Execution Analytics Engine — Future Agent Compatibility Appendix

> Project-local controlling document. Read the companion [Trade Execution Analytics Engine Plan](./trade_execution_analytics_engine_plan.md) before extending this engine.

## Purpose

This appendix defines the engine-level requirements needed to ensure the Trade Execution Analytics Engine can support a future LLM agent without requiring the analytics engine to be rebuilt.

The LLM agent itself is not part of this engine.

The engine should remain deterministic, exact, replayable, evidence-backed, and independent of model reasoning. The future LLM agent will sit above the engine and use structured requests to ask questions, perform drill-downs, compare results, request evidence, and explain findings to the end user.

The purpose of these requirements is to ensure the engine is:

- composable rather than report-specific;
- registry-driven rather than hard-coded;
- multi-dimensional rather than limited to one grouping at a time;
- discoverable through machine-readable capability metadata;
- capable of repeated drill-down and follow-up analysis;
- safe for bounded evidence retrieval;
- stable enough for future LLM tools and agent orchestration;
- complete enough to answer unanticipated trade-execution analytics questions.

---

## Future Agent Compatibility Principle

The engine must not be designed as a collection of isolated reports.

Named reports and prebuilt analytics pages may exist, but they must be powered by reusable engine primitives and stable registries.

The engine should support this model:

```text
Future LLM Agent
    ↓
Structured analytics request
    ↓
Generic analytics query interface
    ↓
Deterministic execution engine
    ↓
Structured result with evidence, limitations, and authority
    ↓
Future LLM explanation, drill-down, or follow-up query
```

The LLM may interpret user language and decide which analytics to request.

The engine must calculate the answer.

The LLM must not be required to calculate metrics, compare raw results manually, infer missing data, or inspect unrestricted raw trade history.

---

## 1. Generic Analytics Query Entry Point

The engine must expose a generic analytics query entry point capable of executing arbitrary supported combinations of:

- scope;
- date range;
- filters;
- dimensions;
- derived dimensions;
- metrics;
- groupings;
- comparisons;
- rankings;
- ordering;
- limits;
- sample-size policies;
- evidence requests;
- output options.

The generic entry point should support named analytics capabilities, but it must not depend on a separate hard-coded function for every possible question.

Examples of undesirable report-only functions:

```text
getMorningPerformance
getFridayPerformance
getTradesAfterLoss
getTradesUnderFiveDollars
getFourthTradePerformance
```

Those may exist as convenience wrappers, but they should compile into the same generic analytics request model.

### Example Generic Request

```json
{
  "schema_version": "1.0",
  "dataset": "executed_trades",
  "scope": {
    "owner_id": "current_owner",
    "account_ids": ["account-1"],
    "date_range": {
      "start": "2026-01-01",
      "end": "2026-07-26"
    },
    "currency_policy": "single_currency_only"
  },
  "filters": [
    {
      "field": "prior_trade_outcome",
      "operator": "equals",
      "value": "loss"
    }
  ],
  "group_by": [
    "entry_time_bucket",
    "entry_price_bucket"
  ],
  "metrics": [
    "trade_count",
    "net_pnl",
    "win_rate",
    "expectancy"
  ],
  "sort": [
    {
      "field": "net_pnl",
      "direction": "ascending"
    }
  ],
  "minimum_sample_policy": "default",
  "evidence": {
    "include": true,
    "limit": 20
  }
}
```

The exact public schema may evolve, but the internal engine architecture must be capable of supporting this composition.

---

## 2. Formal Analytics Request Schema

The engine should define a formal, versioned analytics request schema.

The request schema should define:

- dataset identity;
- owner and account scope;
- date scope;
- currency handling;
- broker/source constraints;
- filter expressions;
- filter operators;
- grouping dimensions;
- derived dimensions;
- metrics;
- comparison definitions;
- ranking definitions;
- sorting;
- result limits;
- evidence options;
- pagination;
- sample-size policy;
- output shape;
- schema version;
- semantic version.

### Filter Operators

The engine should support stable, validated operators such as:

- equals;
- not_equals;
- in;
- not_in;
- greater_than;
- greater_than_or_equal;
- less_than;
- less_than_or_equal;
- between;
- is_null;
- is_not_null;
- contains where explicitly supported;
- starts_with where explicitly supported.

The engine should not permit unrestricted raw SQL from the LLM.

### Logical Composition

The request model should support explicit logical composition:

- AND;
- OR;
- nested groups;
- deterministic evaluation order.

Logical complexity should be bounded by engine-defined limits.

---

## 3. Reusable Analytics Primitive Model

The engine should define a controlling inventory of reusable analytics primitives.

At minimum:

- filter;
- partition;
- group;
- aggregate;
- compare;
- rank;
- distribute;
- sequence;
- attribute;
- drill_down;
- select_evidence;
- validate;
- explain_query;
- verify_result.

These primitives should be composable.

For example, the engine should support a question equivalent to:

> Among trades after two consecutive losses, which price range and time window produced the largest losses?

That requires:

1. sequence filtering;
2. price grouping;
3. time grouping;
4. metric aggregation;
5. contribution ranking;
6. evidence selection.

The engine should execute this through reusable primitives rather than a dedicated one-off implementation.

---

## 4. Stable Metric Registry

All metrics must be defined in a central, machine-readable registry.

Each metric definition should include:

- canonical metric key;
- display name;
- description;
- metric category;
- exact formula;
- formula version;
- required source fields;
- required derived fields;
- allowed authority states;
- null handling;
- missing-data handling;
- denominator rules;
- fee treatment;
- gross versus net treatment;
- currency handling;
- aggregation behavior;
- grouping compatibility;
- comparison compatibility;
- rounding rules;
- sample-size requirements;
- limitation codes;
- deprecation status;
- replacement metric if deprecated.

### Example Metric Definition

```json
{
  "metric_key": "profit_factor",
  "version": "1.0",
  "required_fields": ["net_pnl"],
  "formula": "sum_positive_net_pnl / absolute_sum_negative_net_pnl",
  "null_policy": "exclude_missing_net_pnl",
  "zero_loss_policy": "return_infinite_with_status",
  "currency_policy": "single_currency_only",
  "minimum_sample": 1,
  "authority_requirement": "verified_execution_only"
}
```

Metric calculations must not be duplicated across reports or agent tools.

---

## 5. Stable Dimension Registry

All filterable and groupable dimensions should be defined in a central, machine-readable registry.

Each dimension definition should include:

- canonical dimension key;
- display name;
- source or derivation;
- data type;
- required source fields;
- derivation version;
- supported operators;
- groupable status;
- filterable status;
- sortable status;
- allowed bucket definitions;
- default bucket definition;
- timezone requirements;
- session requirements;
- authority requirements;
- availability state;
- limitation codes;
- deprecation status.

### Example Dimension Definition

```json
{
  "dimension_key": "trade_sequence_number",
  "version": "1.0",
  "source": "derived",
  "required_fields": ["entry_timestamp", "trade_id", "account_id"],
  "data_type": "integer",
  "filterable": true,
  "groupable": true,
  "supported_operators": [
    "equals",
    "greater_than",
    "greater_than_or_equal",
    "between"
  ],
  "authority_requirement": "verified_trade_order"
}
```

The engine should use canonical keys internally and in structured results.

Display labels may change without changing the canonical key.

---

## 6. Stable Filter and Bucket Registry

Named semantic filters and buckets should be centrally defined rather than duplicated across code.

Examples include:

- first trade;
- fourth-and-later trade;
- after loss;
- after two consecutive losses;
- repeat attempt;
- premarket;
- regular session;
- after-hours;
- morning;
- midday;
- afternoon;
- under $1;
- $1 to $2;
- $2 to $5;
- quick scalp;
- short hold;
- long hold.

Each named filter or bucket should include:

- canonical key;
- exact definition;
- required fields;
- timezone;
- inclusive/exclusive boundaries;
- version;
- availability rules;
- limitation rules.

### Example

```json
{
  "bucket_key": "fourth_and_later_trade",
  "definition": {
    "field": "trade_sequence_number",
    "operator": "greater_than_or_equal",
    "value": 4
  },
  "version": "1.0"
}
```

The future LLM may map natural-language phrases to these canonical definitions.

The engine itself should not infer conversational meaning.

---

## 7. Multi-Dimensional Analytics

The engine must support multiple grouping dimensions in a single query.

Examples:

- time window × trade sequence;
- price bucket × position size;
- ticker × repeat attempt;
- prior outcome × size change;
- month × session;
- direction × hold-time bucket;
- broker × fee impact;
- day outcome × trade count;
- after-loss state × time window × price bucket.

This is required for deeper questions such as:

- Are fourth-and-later trades only weak after 11:00?
- Do repeat attempts perform badly only in low-priced stocks?
- Does sizing up after losses cause most of the damage in the afternoon?
- Are fees especially harmful in small positions under $2?

### Multi-Dimensional Controls

The engine should define:

- maximum grouping depth;
- maximum total result cells;
- sparse-cell handling;
- minimum sample per cell;
- deterministic group ordering;
- null-group behavior;
- category explosion limits;
- truncation rules;
- pagination rules;
- warnings for excessive fragmentation;
- warnings for multiple comparisons;
- stable combined-group identity.

The engine should reject or safely constrain queries that exceed complexity limits.

---

## 8. Drill-Down-Compatible Result Design

Every result should preserve enough machine-readable structure for a future agent to issue a narrower follow-up query.

A result should not return only display text such as:

```text
Late morning low-priced trades were weakest.
```

It should also return the exact canonical group definition:

```json
{
  "group_identity": {
    "entry_time_bucket": "10_30_to_12_00",
    "entry_price_bucket": "under_2"
  },
  "filter_expression": [
    {
      "field": "entry_time_bucket",
      "operator": "equals",
      "value": "10_30_to_12_00"
    },
    {
      "field": "entry_price_bucket",
      "operator": "equals",
      "value": "under_2"
    }
  ]
}
```

### Drill-Down Requirements

Each drill-down-capable result should include:

- canonical dimension values;
- canonical filter expressions;
- group identity;
- parent query digest;
- result row identity;
- available next dimensions;
- available next metrics;
- available evidence;
- current sample size;
- current authority status;
- current limitation codes.

This allows the future agent to move from:

```text
Overall period
→ worst category
→ worst subgroup
→ individual evidence trades
```

without reconstructing filters from display labels.

---

## 9. Machine-Readable Capability Discovery

The engine must expose a machine-readable capability and data catalog.

The future LLM agent should be able to determine:

- which datasets are available;
- available date coverage;
- number of trades;
- available accounts;
- available currencies;
- available brokers/sources;
- populated source fields;
- derived fields currently supported;
- available metrics;
- available dimensions;
- available filters;
- available comparison types;
- available sequence analytics;
- available evidence depth;
- conditional capabilities;
- unavailable capabilities;
- missing-data coverage;
- authority restrictions;
- engine versions.

### Example Capability Response

```json
{
  "schema_version": "1.0",
  "dataset": "executed_trades",
  "coverage": {
    "start": "2026-01-01",
    "end": "2026-07-26",
    "trade_count": 428
  },
  "available_dimensions": [
    "ticker",
    "entry_time_bucket",
    "trade_sequence_number",
    "prior_trade_outcome",
    "entry_price_bucket",
    "position_size_bucket"
  ],
  "available_metrics": [
    "net_pnl",
    "win_rate",
    "profit_factor",
    "expectancy"
  ],
  "conditional_capabilities": {
    "fee_impact": {
      "status": "partial",
      "coverage_percentage": 72
    },
    "streak_analytics": {
      "status": "supported"
    }
  },
  "unavailable_capabilities": {
    "planned_risk_metrics": {
      "reason": "planned_risk_required"
    }
  }
}
```

Capability discovery should be available before query execution so future agents do not need to discover limitations only by repeated failures.

---

## 10. Data Coverage Discovery

Capability discovery should include dataset-specific data coverage.

The engine should report:

- total eligible trades;
- complete trades;
- incomplete trades;
- missing timestamp percentage;
- missing quantity percentage;
- missing direction percentage;
- missing fee percentage;
- missing net P/L percentage;
- imported versus manual-entry counts;
- reliable trade-order coverage;
- reliable streak-analysis coverage;
- reliable session-analysis coverage;
- reliable hold-time coverage;
- currency partitions;
- account partitions.

Coverage should be reported globally and, where useful, by account, broker, source, or period.

---

## 11. Bounded Row-Level Evidence Retrieval

The engine should support bounded row-level evidence retrieval.

The engine should not return unrestricted raw trade history by default.

Evidence retrieval should support:

- top N supporting trades;
- top N counterexamples;
- top N contributors;
- worst N trades;
- best N trades;
- representative trades;
- evidence per group;
- evidence by result row;
- evidence pagination;
- evidence count;
- omitted evidence count;
- evidence ordering;
- evidence authority status.

### Evidence Separation

The engine should distinguish:

1. aggregate result;
2. bounded evidence summary;
3. detailed trade evidence retrieval.

A future agent should normally receive aggregate results first and request detailed evidence only where needed.

### Evidence Response Requirements

Each evidence response should include:

- evidence trade ID;
- source execution IDs where allowed;
- account scope;
- date;
- ticker;
- relevant metric values;
- relevant dimension values;
- reason the trade was selected;
- evidence rank;
- authority status;
- limitation codes;
- parent result digest;
- bounded/omitted count.

---

## 12. Structured Unsupported and Invalid Query Responses

All rejected, unsupported, unavailable, or partially supported requests must return structured machine-readable responses.

### Required Status Types

- complete;
- partial;
- unsupported;
- unavailable;
- invalid_request;
- insufficient_sample;
- no_matching_data;
- authority_conflict;
- complexity_limit_exceeded.

### Example Unsupported Response

```json
{
  "status": "unsupported",
  "code": "fee_authority_required",
  "missing_fields": [
    "commission",
    "regulatory_fee"
  ],
  "available_partial_result": true,
  "supported_alternative": "gross_pnl_analysis"
}
```

### Example Invalid Query Response

```json
{
  "status": "invalid_request",
  "code": "unsupported_operator",
  "field": "entry_price",
  "operator": "approximately",
  "supported_operators": [
    "equals",
    "greater_than",
    "less_than",
    "between"
  ]
}
```

The future agent should be able to reformulate a query based on these responses.

---

## 13. Query Explainability

The engine should be able to return a machine-readable and human-readable explanation of the executed query.

The explanation should include:

- interpreted scope;
- account scope;
- date range;
- timezone;
- currency handling;
- included filters;
- excluded filters;
- grouping definitions;
- bucket boundaries;
- metric formulas;
- fee treatment;
- missing-data treatment;
- sample-size policy;
- sorting;
- ranking method;
- evidence selection method;
- limitations;
- authority status.

This allows the future agent to answer:

- How was this calculated?
- Which trades were included?
- Were commissions included?
- What did “morning” mean?
- Why were some trades excluded?
- What sample-size rule was applied?

The LLM should not need to reconstruct calculation details from memory.

---

## 14. Multi-Step Investigation Support

The future LLM agent may execute several analytics requests before producing a final answer.

The engine should support repeated related queries through stable result references.

The engine does not need to plan the investigation, but it should support it.

### Investigation Metadata

Where useful, query and result packets should support:

- investigation ID;
- parent query digest;
- parent result digest;
- prior result row identity;
- drill-down relationship;
- query step number;
- dependent result identities;
- investigation scope;
- final evidence bundle identity.

### Example Investigation

For the question:

> Why have my results been worse this month?

The future agent may:

1. compare this month with last month;
2. identify which metrics deteriorated;
3. rank negative contributors;
4. group by time, price, size, ticker, and sequence;
5. test outlier influence;
6. retrieve representative trades;
7. explain the verified result.

The engine should make every step deterministic, independently replayable, and scope-safe.

---

## 15. Distribution and Percentile Analytics

Distribution analytics should be a first-class engine capability.

The engine should support:

- percentiles;
- quartiles;
- median;
- interquartile range;
- minimum;
- maximum;
- histogram-ready buckets;
- P/L distribution;
- winner distribution;
- loser distribution;
- hold-time distribution;
- size distribution;
- daily P/L distribution;
- fee distribution;
- tail-loss analysis;
- tail-gain analysis;
- concentration measures;
- outlier flags.

### Questions Supported

- What does a normal winning trade look like?
- Are most losses small with a few extreme losses?
- What percentage of trades lose more than a given amount?
- Where does this trade rank compared with my normal trades?
- Is my median result improving even if total P/L is not?
- Are a small number of trades dominating the result?

Distribution outputs should be chart-ready and evidence-backed.

---

## 16. Contribution and Attribution Analysis

The engine should support explicit contribution and attribution analysis.

Ranking a weak category is not always enough to explain why performance changed.

The engine should support:

- contribution to total P/L;
- contribution to total losses;
- contribution to total gains;
- contribution to period-over-period change;
- frequency effect;
- average-result effect;
- mix effect;
- fee effect;
- outlier effect;
- concentration effect.

### Example Distinction

The engine should distinguish between:

- results worsened because more trades were taken in a weak category;
- results worsened because the category itself performed worse;
- results worsened because one extreme loss dominated the period;
- results worsened because fees increased;
- results worsened because the composition of trades changed.

### Attribution Result Structure

Attribution results should include:

- baseline value;
- comparison value;
- absolute change;
- relative change;
- contributing segment;
- contribution amount;
- contribution percentage;
- sample counts;
- frequency change;
- average-result change;
- outlier contribution;
- fee contribution;
- authority status;
- limitations.

The engine should avoid causal language unless causality is actually supported.

---

## 17. Stable Result Row Identity

Every grouped, ranked, compared, or distributed result row should have a stable identity.

The identity should be derived from:

- query digest;
- group keys;
- dimension values;
- metric set;
- comparison identity;
- partition identity;
- result version.

Stable row identity enables:

- drill-down;
- evidence retrieval;
- caching;
- replay;
- UI selection;
- agent references;
- comparison across related results.

Display order should not determine row identity.

---

## 18. Result Composition Safety

The future agent may combine multiple results.

Every result should therefore preserve:

- owner scope;
- account scope;
- currency scope;
- broker/source scope;
- dataset identity;
- date range;
- timezone;
- metric versions;
- dimension versions;
- filter definitions;
- sample size;
- missing-data treatment;
- authority status;
- limitation codes;
- query digest;
- result digest.

The engine or interface layer should reject unsafe result composition, including:

- mixed owners;
- unauthorized account mixing;
- incompatible currencies;
- incompatible metric versions;
- incompatible bucket definitions;
- incompatible date scopes;
- incompatible source authority;
- incompatible trade-order assumptions.

---

## 19. Query Complexity and Cost Controls

A broad LLM-facing engine needs deterministic query limits.

The engine should define:

- maximum filter count;
- maximum nesting depth;
- maximum grouping depth;
- maximum result rows;
- maximum result cells;
- maximum evidence rows;
- maximum date range where needed;
- maximum comparison count;
- maximum ranking count;
- query complexity score;
- timeout behavior;
- pagination behavior;
- truncation behavior;
- cache eligibility;
- cached result reuse;
- complexity-limit errors.

These controls should protect performance without forcing the analytics engine into narrow prebuilt reports.

---

## 20. Pagination and Result Continuation

Large structured results should support deterministic pagination or continuation.

Continuation should preserve:

- original query digest;
- stable ordering;
- current offset or cursor;
- page size;
- result version;
- evidence scope;
- total row count where calculable;
- omitted count;
- continuation expiry where applicable.

Pagination should not alter metric calculations.

---

## 21. Cache and Replay Compatibility

The engine should support deterministic caching where safe.

Cache identity should include:

- dataset version;
- source partition identity;
- owner/account scope;
- query plan digest;
- metric versions;
- dimension versions;
- timezone;
- currency policy;
- evidence policy;
- result schema version.

Cached results must be invalidated when relevant source data, corrections, metric versions, or dimension definitions change.

Every cached result must remain replay-verifiable.

---

## 22. Visualization-Ready Structured Data

The engine should return presentation-ready rows but should not decide final UI design.

Where useful, results may include presentation hints such as:

- recommended chart type;
- category field;
- value field;
- secondary metric;
- zero baseline;
- preferred sort;
- confidence or sample-size field;
- evidence availability.

### Example

```json
{
  "presentation_hints": {
    "preferred_format": "bar_chart",
    "category_field": "entry_time_bucket",
    "value_field": "average_net_pnl",
    "secondary_field": "trade_count",
    "zero_baseline": true
  }
}
```

The future agent or UI may choose to ignore the hint.

The underlying result rows must remain valid without visualization.

---

## 23. Canonical Semantic Definitions

The engine should maintain canonical definitions for recurring analytics concepts.

Examples:

- first trade;
- later trade;
- fourth-and-later trade;
- repeat attempt;
- consecutive loss;
- green before entry;
- red before entry;
- giveback;
- intraday drawdown;
- quick scalp;
- morning;
- midday;
- afternoon;
- low-priced trade;
- large position;
- insufficient sample.

These definitions should be:

- deterministic;
- versioned;
- machine-readable;
- explainable;
- stable across reports;
- overridable only through explicit structured query parameters.

The engine should not infer vague conversational language.

The future agent may translate user language into these definitions.

---

## 24. Calculated Fact Classification

The engine should classify the type of each returned finding.

Recommended finding types:

- calculated_fact;
- deterministic_comparison;
- descriptive_observation;
- contribution_finding;
- distribution_finding;
- outlier_finding;
- rule_to_test;
- unsupported_interpretation.

### Boundaries

The engine may return:

- after-loss trades had lower expectancy;
- fourth-and-later trades contributed 42% of total losses;
- one trade accounted for 61% of the month’s losses;
- fees reduced gross profit by a verified amount.

The engine should not return:

- the trader was emotional;
- the trader revenge traded as a proven fact;
- the trader lacked discipline;
- the trader should always stop after two losses;
- a rule would have improved results unless simulation proves it.

---

## 25. Agent-Facing Tool Compatibility

The full LLM tool layer can be built later, but the engine should support future tools such as:

- `describe_analytics_capabilities`;
- `describe_available_trade_data`;
- `run_analytics_query`;
- `compare_analytics_segments`;
- `analyze_trade_sequence`;
- `get_analytics_distribution`;
- `get_result_evidence`;
- `explain_metric_definition`;
- `explain_query_execution`;
- `get_drill_down_options`.

These tools should call the same deterministic engine and registries.

They should not duplicate calculation logic.

---

## 26. No LLM Dependency Inside the Engine

The Trade Execution Analytics Engine must not require an LLM for:

- calculations;
- metric definitions;
- grouping;
- filtering;
- ranking;
- comparison;
- evidence selection;
- sample-size enforcement;
- limitation detection;
- authority validation;
- query verification;
- replay verification.

The engine must remain independently testable.

The future LLM may use the engine, but the engine must not depend on the LLM to produce correct analytics.

---

## 27. Future Multi-Engine Compatibility

This engine should remain execution-only, but its result contracts should be compatible with future engines.

Future systems may include:

- Candle Analytics Engine;
- Market Context Engine;
- Setup Detection Engine;
- News/Catalyst Engine;
- Simulation Engine.

Every engine should eventually preserve:

- engine identity;
- capability key;
- source authority;
- result schema;
- evidence references;
- limitation codes;
- query digest;
- result digest;
- scope identity.

This will allow a future LLM agent to combine facts from multiple engines while preserving which engine proved each fact.

The Trade Execution Analytics Engine should not absorb candle, VWAP, float, market cap, catalyst, setup, or market-structure responsibilities merely for future agent convenience.

---

## 28. Required Engine-Level Interfaces

Before the engine is considered future-agent compatible, it should expose or internally support:

1. generic analytics query execution;
2. metric registry lookup;
3. dimension registry lookup;
4. filter and bucket registry lookup;
5. capability discovery;
6. data coverage discovery;
7. query validation;
8. query explanation;
9. multi-dimensional grouping;
10. deterministic comparisons;
11. contribution and attribution analysis;
12. distribution analytics;
13. sequence analytics;
14. drill-down metadata;
15. bounded evidence retrieval;
16. result verification;
17. replay execution;
18. stable row identity;
19. structured unsupported responses;
20. pagination and continuation;
21. result-size and complexity controls.

---

## 29. Future-Agent Compatibility Acceptance Criteria

The engine should be considered future-agent compatible when all of the following are true:

- A supported analytics question does not require a dedicated hard-coded report function.
- Multiple filters can be combined deterministically.
- Multiple dimensions can be grouped in one query.
- Metrics are registry-driven and versioned.
- Dimensions are registry-driven and versioned.
- Named buckets are canonical and versioned.
- The engine can describe what the current dataset supports.
- The engine can explain why a capability is unavailable.
- Results expose stable canonical keys.
- Results can be used as direct inputs to drill-down queries.
- Results preserve complete scope and authority metadata.
- Evidence can be requested in bounded form.
- Detailed trade evidence can be retrieved without returning unrestricted raw history.
- Distribution and percentile analytics are available.
- Contribution and attribution analytics are available.
- Result rows have stable identity.
- Queries are bounded by deterministic complexity rules.
- Large results support stable pagination.
- Results are replayable and verifiable.
- The engine does not rely on an LLM for calculations.
- A future LLM agent can issue multiple related queries without rebuilding the engine.

---

## 30. Final Architectural Boundary

The final responsibility boundary should remain:

```text
LLM Agent Layer
- understands the user’s language;
- resolves conversational meaning;
- plans one or more analytics requests;
- chooses drill-downs;
- requests supporting evidence;
- combines compatible results;
- explains findings;
- decides whether to show prose, tables, or charts.

Structured Analytics Interface
- validates request schemas;
- exposes capabilities;
- enforces query limits;
- maps approved requests into engine operations;
- returns stable structured packets.

Trade Execution Analytics Engine
- validates scope and authority;
- derives execution-only dimensions;
- filters and partitions data;
- calculates registered metrics;
- performs grouping and comparison;
- performs distribution and attribution analysis;
- ranks results;
- applies sample-size rules;
- selects bounded evidence;
- emits limitations;
- verifies results;
- preserves replay identity.
```

The agent layer may be added later.

The analytics engine must be built now so that this layer can be added without replacing or restructuring the core analytics implementation.

---

## Final Requirement

The Trade Execution Analytics Engine should be implemented as a generic deterministic analytics platform for executed trade data, not as a fixed inventory of dashboard reports.

The current engine plan should remain the controlling analytics scope.

This appendix adds the architectural requirements necessary to ensure that the completed engine can later support a flexible LLM agent capable of answering broad, unanticipated trade-execution analytics questions through repeated structured queries, drill-downs, comparisons, distributions, attribution, and evidence retrieval.


