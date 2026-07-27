# Execution Plan Output Audit

Read this with the [controlling plan](./trade_execution_analytics_engine_plan.md), the [metric catalog coverage](./execution-metric-catalog-coverage.md), and [implementation progress](./implementation-progress.md).

## Audit rule

This is the output-level completion audit. A dashboard card, an agent prompt, or a generic statement that a family is supported does **not** count as a result mapping. Each plan output below is classified as one of:

- `implemented`: an exact registry metric, validated query primitive, or dedicated ingestion-quality receipt exists;
- `canonical-equivalent`: the result is obtained by a documented generic composition of metrics, filters, grouping, ordering, comparison, or attribution;
- `requires-query-primitive`: current execution facts are sufficient, but v3 does not yet expose the required deterministic query capability;
- `requires-execution-field`: the current canonical/ledger result does not retain a required fact;
- `not-execution-derived`: needs market, plan, or counterfactual authority.

The entries use one canonical mapping for repeated wording in the Core Metric Library and Analytics Categories. Repetition in the plan is intentional product language, not a second calculation.

## Exact metric and generic-query outputs

| Plan outputs | State | Canonical mapping |
| --- | --- | --- |
| Total/included/excluded trades; owner/account/symbol counts; executions per trade | implemented | `total_trades`, query count metrics, unique counts, `total_execution_count`, `average_executions_per_trade` |
| Gross/net P/L; gross profit/loss; average/median P/L; best/worst trade | implemented | Gross/net metric families in `TRADE_QUERY_METRIC_REGISTRY` |
| Combined charges; fees per trade; gross-versus-net difference; fee burden | implemented when charge coverage is complete | `signed_charges`, average/median signed charges, `gross_net_difference`, fee-burden metrics |
| Winners/losers/flats; rates; average/median win/loss; profit factor; expectancy; break-even rate | implemented when charge coverage is complete | Outcome metric family |
| Largest winner/loser concentration and P/L excluding outliers | implemented when charge coverage is complete | Concentration/exclusion metric family and distribution findings |
| Daily, weekly, monthly, yearly, custom-period P/L and trade activity | canonical-equivalent | `day`/`week`/`month`/`year` grouping plus P/L and activity metrics |
| Green/red/flat days; average/median green/red day; best/worst day | implemented when charge coverage is complete | Daily metric family |
| This/current period versus prior period; custom baseline comparison | canonical-equivalent | Two compatible validated plans plus `buildTradeQueryComparison` / period attribution |
| Time-of-day, hourly/custom buckets, opening/midday/late-day and session performance | canonical-equivalent | Entry/exit time filters, `time_bucket`, session filters/grouping, generic metrics |
| First/second/third/fourth-and-later; repeat-attempt and ticker-attempt performance | canonical-equivalent | Sequence/repeat filters and bucket groupings plus generic metrics |
| After win/loss/flat; after two/three consecutive wins/losses; after breaking a streak | canonical-equivalent | Previous-outcome and prior-streak filters, including combined filters, plus generic metrics |
| Pre-entry green/red/flat; after first win/loss; after giveback or green/red transition | canonical-equivalent | Pre-entry daily-state/path filters plus generic metrics; ambiguous chronology fails closed |
| Ticker, ticker/day, ticker/repeat attempt, most/best/worst ticker, ticker concentration | canonical-equivalent | `symbol` and compound grouping, ordering, attribution, and generic metrics |
| Price bands, custom price bands, low/high-price comparisons | canonical-equivalent | Entry-price filter/grouping plus generic metrics and comparisons |
| Share/notional/position-size buckets; winner versus loser size; large/small-size comparisons | canonical-equivalent | Size filters/buckets, winner/loser size metrics, and generic metrics |
| Holding-time averages, winner/loser holds, standard/custom hold buckets, ticker/time hold analysis | canonical-equivalent | Hold-time metrics, holding-time grouping, and compound grouping |
| Long/short P/L, outcomes, expectancy, and dimensional direction analysis | canonical-equivalent | `direction` grouping plus generic metrics/compound grouping |
| Maximum realized drawdown, peak-profit giveback, daily transition counts, largest giveback/drawdown day | canonical-equivalent | Realized-path metrics, `day` grouping, and deterministic ordering |
| Fees by ticker/price/size/broker; fee impact on small trades | canonical-equivalent when charge coverage is complete | Source/size/price groupings plus signed-charge metrics |
| Row-authority limitations; manual/broker/legacy populations | implemented | Data-quality metric family |
| Rejected-row missing timestamp/price/quantity/direction facts | implemented outside financial rows | Persisted raw-ingestion quality receipt |
| Distribution, outlier, tail, and concentration results | implemented | Query-bound distribution result and findings |
| Non-causal segment and period contribution results | implemented | Query attribution and period-attribution contracts |
| Deterministic ranking of a selected category | canonical-equivalent | Validated query ordering over a declared metric; no cross-category score is implied |
| Evidence, bounded evidence omission, query/result/replay identity | implemented | Query evidence, result, paging, replay, comparison, attribution, and distribution contracts |

## Output gaps that must not be called complete

| Plan output | State | Why |
| --- | --- | --- |
| Commission-only results | implemented when per-kind coverage is complete | FIFO round trips preserve/reconcile `signedChargesByKind`; `commission_signed_charges` and average/median variants fail closed when a prior/partial charge allocation cannot be classified. Other named kinds require an additional registered metric. |
| Filter to fee-complete versus fee-missing trades | implemented | Public `charge_coverage` filter/grouping; net/fee metrics remain fail-closed outside complete coverage. |
| Filter manual versus imported trades | implemented | Public `source_kind` filter/grouping preserves source-authority boundaries. |
| Best recovery day / magnitude of recovery after being red | implemented | `maximum_intraday_realized_recovery_from_trough` is exact over the completed daily realized path; `day` grouping ranks individual recovery days. |
| Tag, setup, mistake, import-batch, and notes filters | requires-execution-field | Those facts are not part of the v3 analytical row authority. |
| Missing timestamp/price/direction/quantity as an included-trade filter | requires-execution-field | Such rows are rejected before financial authority; they can only be reported by the separate ingestion-quality receipt. |
| Rule-to-test packet and sample-size status | implemented | `buildTradeQueryFindingPacket` verifies the result/authority, binds every finding to a query row and evidence digest, and emits sufficient/insufficient/metric-unavailable status. It only suggests a deterministic review rule; it makes no causal claim. |
| VWAP, chart/setup, news, float, planned risk, stop quality, optimal exit, or "held too long/short" claim | not-execution-derived | Requires market, plan, or alternative-outcome authority outside executions. |

## Completion verdict

The v3 engine now covers the listed results derivable from retained execution facts, with explicit fail-closed authority for incomplete charges and missing fields. It is not a market, setup, chart, planned-risk, or counterfactual engine; those boundaries remain deliberate.
