# Journal Analytics Capability Catalog

**Phase:** 1 - inventory and baseline  
**Status:** Controlling capability direction; formulas for the first slice are proposed for Phase 1 acceptance  
**Goal:** Deliver every useful analytic that accepted facts can support, without making one bad record hide unrelated valid data and without inventing missing facts.

## Capability states

| State | Meaning |
| --- | --- |
| `first_slice` | Required for the first reconciled replacement analytics path |
| `ready_after_rebuild` | Derivable from accepted canonical executions/round trips once the replacement fact builder exists |
| `conditional_fact_coverage` | Derivable only for records with complete fees, quantity, notional, labels, or similar optional facts |
| `requires_new_trader_fact` | Needs a trader-entered setup, plan, stop, rule, review, or classification |
| `requires_account_fact` | Needs balances, deposits/withdrawals, buying power, FX, or account-equity history |
| `requires_order_or_market_data` | Needs orders, quotes, candles, volume, benchmark, catalyst, or other external facts |
| `review_signal_only` | Can identify a sequence for review but cannot state motive/quality as fact |
| `not_planned` | Would be misleading, non-reproducible, or outside the product direction |

`ready_after_rebuild` is not a claim that current V3 output is accepted. It means the inputs are execution/round-trip facts and the replacement can implement/reconcile the calculation.

## Current fact baseline

The current import shapes can contain account, symbol/instrument, timestamp/timezone, side, quantity, price, commission, fees, currency, source/broker identity, import provenance, and derived open/closed trades. The loaded January test snapshot has 1,072 normalized executions and 336 saved trades, but the replacement must rebuild and reconcile them.

Not dependable by default: order-submission/intended price, bid/ask/NBBO, full account equity and cash flows, FX conversion series, planned risk/stop/target, setup/catalyst, chart/volume context, MFE/MAE, or trader motive.

## First exact reconciliation slice

Population: accepted `ready_closed` round trips for one owner, selected account set, single currency partition, selected date range, and declared trading timezone. `legitimate_open`, `needs_decision`, excluded, and superseded records are not realized-P/L rows but appear in coverage.

| Metric/output | Exact policy | State |
| --- | --- | --- |
| Coverage | Accepted executions, pending executions, excluded executions, closed round trips, legitimate open positions, pending round trips, excluded round trips, plus reasons | `first_slice` |
| Closed trade count | Count of eligible closed round trips | `first_slice` |
| Win/loss/flat counts | Compare exact selected P/L basis to zero | `first_slice` |
| Win/loss/flat rates | Corresponding count divided by eligible closed count; unavailable when denominator is zero | `first_slice` |
| Gross profit | Sum of positive gross round-trip P/L | `first_slice` |
| Gross loss | Sum of negative gross round-trip P/L, displayed as a negative money value | `first_slice` |
| Gross P/L | Gross profit plus gross loss | `first_slice` |
| Net P/L | Gross P/L minus non-negative normalized charge cost, only where charge coverage is complete | `conditional_fact_coverage` |
| Average/median P/L | Arithmetic mean and exact sorted median on one declared gross/net basis | `first_slice` for gross; conditional for net |
| Best/worst trade | Maximum/minimum exact P/L with deterministic time/ID tie break | `first_slice` |
| Profit factor | Gross profit divided by absolute gross loss; unavailable when there is no loss denominator | `first_slice` |
| Expectancy | Average selected-basis P/L per eligible closed round trip | `first_slice` |
| Daily series | Sum eligible P/L by closing trading date; dates with no trades are empty unless a calendar contract explicitly fills them | `first_slice` |
| Ticker groups | Count, P/L, win/loss/flat, win rate by stable instrument | `first_slice` |
| Time-of-day groups | Count, P/L, win/loss/flat by first-entry time bucket in declared timezone | `first_slice` |

`/workspace`, `/trades`, `/analytics`, Calendar, and ticker views must consume these same functions/results. No page-specific recomputation is accepted.

## Existing V3 metric catalog: 126 migration candidates

The V3 registry declares 126 execution-derived metrics. They are a completeness checklist, not accepted replacement formulas. V3-specific required authority receipts/digests and global gating are rejected. Each candidate is reclassified below.

### Coverage, source, and population

`candidate_count`, `included_count`, `excluded_count`, `inclusion_rate`, `exclusion_rate`, `trading_day_count`, `unique_account_count`, `unique_symbol_count`, `total_execution_count`, `average_executions_per_trade`, `limited_analytical_trade_count`, `missing_charge_coverage_trade_count`, `missing_share_quantity_authority_count`, `missing_entry_notional_authority_count`, `unavailable_source_authority_trade_count`, `manual_entry_trade_count`, `broker_import_trade_count`, `legacy_migration_trade_count`.

Replacement: `first_slice` for core coverage/counts; `ready_after_rebuild` for source/provenance counts. Rename “authority” language to factual coverage where appropriate.

### Activity, direction, and repeat attempts

`total_trades`, `average_trades_per_trading_day`, `median_trades_per_trading_day`, `maximum_trades_per_trading_day`, `minimum_trades_per_trading_day`, `long_trade_count`, `short_trade_count`, `long_trade_percentage`, `short_trade_percentage`, `average_attempts_per_symbol`, `median_attempts_per_symbol`, `repeat_attempt_trade_count`, `repeat_attempt_percentage`.

Replacement: `ready_after_rebuild`. A repeat attempt is another zero-to-nonzero round trip in the same stable instrument and trading date; it does not imply revenge trading or poor discipline.

### Gross P/L and charge impact

`gross_profit`, `gross_loss`, `gross_pnl`, `average_gross_pnl`, `median_gross_pnl`, `signed_charges`, `average_signed_charges`, `median_signed_charges`, `commission_signed_charges`, `average_commission_signed_charges`, `median_commission_signed_charges`, `gross_net_difference`, `fees_as_percentage_of_gross_profit`, `fees_as_percentage_of_gross_loss`.

Replacement: gross metrics are `ready_after_rebuild`; charge metrics are `conditional_fact_coverage`. The replacement stores normalized charge cost as non-negative and separately preserves original broker sign/kind evidence. Fee percentages are unavailable for zero denominators.

### Net P/L, outcomes, and trade distribution

`net_pnl`, `average_pnl`, `median_pnl`, `best_trade`, `worst_trade`, `win_count`, `loss_count`, `flat_count`, `win_rate`, `loss_rate`, `flat_rate`, `average_winning_trade`, `median_winning_trade`, `average_losing_trade`, `median_losing_trade`, `total_winning_net_pnl`, `total_losing_net_pnl`, `average_win_loss_ratio`, `median_win_loss_ratio`, `profit_factor`, `expectancy`, `breakeven_win_rate`.

Replacement: `ready_after_rebuild` on gross basis and `conditional_fact_coverage` on net basis. Win/loss ratio uses average positive P/L divided by absolute average negative P/L. Breakeven win rate uses `abs(avg loss) / (avg win + abs(avg loss))`; unavailable without both populations.

### Holding time

`average_holding_time`, `median_holding_time`, `minimum_holding_time`, `maximum_holding_time`, `average_winner_holding_time`, `average_loser_holding_time`, `median_winner_holding_time`, `median_loser_holding_time`.

Replacement: `ready_after_rebuild`. Duration is final close time minus first position-opening time. Overnight/multi-day trades remain one duration; session-only duration requires a separately named metric.

### Quantity, entry notional, and normalized returns

`average_share_quantity`, `median_share_quantity`, `maximum_share_quantity`, `average_winner_share_quantity`, `median_winner_share_quantity`, `average_loser_share_quantity`, `median_loser_share_quantity`, `average_entry_notional`, `median_entry_notional`, `maximum_entry_notional`, `average_winner_entry_notional`, `average_loser_entry_notional`, `median_winner_entry_notional`, `median_loser_entry_notional`, `net_pnl_per_100_shares`, `return_on_entry_notional`, `average_position_size`, `median_position_size`.

Replacement: `conditional_fact_coverage` until exact quantity/notional semantics are fixed. Proposed definitions: maximum absolute open quantity for position size; sum of position-increasing allocated quantity/price for entry notional. Never compare or add notionals across currencies. `return_on_entry_notional` is not account return.

### Trading-day results

`average_daily_pnl`, `median_daily_pnl`, `best_trading_day`, `worst_trading_day`, `profitable_trading_day_count`, `losing_trading_day_count`, `flat_trading_day_count`, `profitable_day_percentage`, `losing_day_percentage`, `flat_day_percentage`, `average_green_day_pnl`, `median_green_day_pnl`, `average_red_day_pnl`, `median_red_day_pnl`.

Replacement: `ready_after_rebuild` on gross basis and conditional on net basis. Round-trip P/L is assigned to its closing trading day. A day with open-only activity is visible in Journal coverage but is not a realized green/red day.

### Realized path, streaks, concentration, drawdown, and giveback

`maximum_intraday_drawdown`, `longest_winning_trade_streak`, `longest_losing_trade_streak`, `current_winning_trade_streak`, `current_losing_trade_streak`, `net_pnl_excluding_largest_winner`, `net_pnl_excluding_largest_loser`, `net_pnl_excluding_largest_winner_and_loser`, `largest_winner_contribution`, `largest_loser_contribution`, `maximum_intraday_realized_drawdown`, `maximum_peak_profit_giveback`, `maximum_intraday_realized_recovery_from_trough`, `average_peak_profit_giveback`, `median_peak_profit_giveback`, `days_with_peak_profit_giveback`, `days_with_realized_drawdown`, `green_to_red_day_count`, `red_to_green_day_count`.

Replacement: `ready_after_rebuild` only when explicitly named as **realized closed-trade path**. It is not account-equity drawdown or mark-to-market drawdown. Order uses closing time plus stable round-trip ID. Contribution metrics require a declared denominator and unavailable behavior at zero P/L.

## Additional execution/round-trip analytics to support

| Family | Examples | State |
| --- | --- | --- |
| Position lifecycle | Open position count/age/quantity/cost basis, carried days, long/short exposure by account/instrument/currency | `ready_after_rebuild`; unrealized P/L requires market data |
| Trade construction | Entry/add/reduction/exit counts, scale-in/scale-out rates, average entry/exit price, maximum open quantity, execution count distribution, flip count | `ready_after_rebuild` |
| P/L distribution | Percentiles, standard deviation, positive/negative skew descriptions, histogram, cumulative realized P/L, rolling trade averages | `ready_after_rebuild`; avoid implying statistical certainty for small samples |
| Calendar | Week/month/year totals, active days, consistency, day-of-week, entry/exit session, overnight/multi-day | `ready_after_rebuild` |
| Concentration | P/L and volume share by ticker, day, direction, source, account; top/bottom contribution | `ready_after_rebuild` |
| Import/data quality | Issue rates by broker/format/field, decision aging, duplicate/reimport outcomes, coverage trends | `ready_after_rebuild` from Journal evidence; private-safe aggregation only |
| Manual versus broker | Counts/coverage/results by provenance after duplicate resolution | `ready_after_rebuild`; never interpret source as quality by itself |

## Trader-fact analytics

These are possible only after the trader supplies/accepts the underlying facts:

| Facts required | Supported analytics | State |
| --- | --- | --- |
| Trade setup/tag | P/L, win rate, expectancy, frequency, hold time by setup/tag | `requires_new_trader_fact` |
| Planned stop/entry/target and intended risk | R-multiple, planned-vs-actual risk, target/stop adherence | `requires_new_trader_fact` |
| Rule applicability and followed/broken decision | Rule adherence rate and P/L/behavior comparison | `requires_new_trader_fact` |
| Trader review/lesson | Review completion, recurring self-identified lesson/tag, follow-through | `requires_new_trader_fact` |
| Trade plan and actual execution classification | Planned vs unplanned, entry/exit reason performance | `requires_new_trader_fact` |

The system may suggest a tag or review item, but it becomes a factual filter only after the trader accepts it.

## Account-fact analytics

| Capability | Missing facts | State |
| --- | --- | --- |
| True account return and equity curve | Daily balances/equity plus deposits, withdrawals, transfers, dividends, interest, FX | `requires_account_fact` |
| Account drawdown and recovery | Marked daily/intraday equity series | `requires_account_fact` |
| Buying-power/utilization and portfolio exposure | Intraday positions, margin/buying power, option/multi-asset treatment | `requires_account_fact` |
| Cross-currency consolidated P/L | Time-stamped FX conversion policy/rates | `requires_account_fact` |

Realized trade P/L curves must not be labeled account equity or account return.

## Order/market-data analytics

| Capability | Required facts | State |
| --- | --- | --- |
| Slippage/execution quality | Order submission/limit/arrival price and time-stamped bid/ask or benchmark | `requires_order_or_market_data` |
| MFE/MAE | Complete trusted candle/tick series over the held interval with basis reconciliation | `requires_order_or_market_data` |
| Profit capture/exit efficiency | MFE/MAE plus exact exit allocation; declared benchmark | `requires_order_or_market_data` |
| Entry/exit versus VWAP | Trusted intraday trades/volume/VWAP series | `requires_order_or_market_data` |
| Volume/relative-volume and liquidity | Trusted volume/quote/spread data | `requires_order_or_market_data` |
| Gap, volatility, trend, regime | Daily/intraday market history and declared calculation | `requires_order_or_market_data` |
| Support/resistance/level interaction | Versioned Level Analysis facts aligned as-of the trade, with provider provenance | `requires_order_or_market_data` |
| Catalyst/news performance | Time-stamped article/catalyst identity mapped to instrument/trade | `requires_order_or_market_data` |
| Benchmark-relative performance | Benchmark series, interval/attribution policy | `requires_order_or_market_data` |

Provider availability or a chart on screen is not enough. Coverage must prove the required time window, basis, symbol identity, and as-of relationship.

## Review signals, not factual conclusions

Execution sequences can surface possible overtrading, rapid re-entry, adding to a losing position, increasing size after a loss, or trading after a daily gain/loss. These are `review_signal_only` until the rule/threshold and factual interpretation are defined or accepted by the trader. The system must not label motive such as revenge, FOMO, fear, discipline, or tilt from executions alone.

## Not planned

- Guaranteed predictions, “AI edge” claims, or probabilities without a validated statistical contract.
- Browser-only financial calculations that can disagree with server totals.
- Silent imputation of missing fees, executions, order facts, stops, setups, market context, or account balances.
- Cross-currency aggregation without conversion facts.
- One composite trader score that hides its inputs/coverage.
- Using V3 receipt/digest/proof availability as the condition for displaying ordinary eligible metrics.

## Filters and grouping contract

First supported filters: account, currency, closing-date range, symbol, direction, source provenance, realized outcome, entry time bucket, weekday, holding-duration bucket, quantity/notional bucket when covered, tag/setup/rule when accepted.

First supported groupings: total, closing day/week/month/year, weekday, entry time-of-day/session, symbol, direction, account, source kind, holding-time bucket, size bucket, and accepted labels.

Filters/groupings share allowlisted server definitions. A grouped total must reconcile exactly to the same filtered population as the headline total.

## Required acceptance for every metric

Before implementation status becomes complete, record:

1. formula and version;
2. exact required facts and optional facts;
3. gross/net/fee policy;
4. open/pending/excluded behavior;
5. currency policy;
6. date/timezone/session/attribution policy;
7. zero/empty/denominator behavior;
8. display unit/rounding;
9. included/excluded/limited coverage;
10. source-to-round-trip reconciliation and page-to-page equality.

This catalog is deliberately broad. Phase checkpoints decide implementation order; they do not erase later capabilities from the product target.
