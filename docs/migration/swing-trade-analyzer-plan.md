# Swing Trade Analyzer Plan

Status: Owner requested setup; proposed product/data contract for review before
UI implementation. Not implemented or production-ready.

Parent: [Analyzer analysis pages](trade-analyzer-analysis-pages-plan.md).
Progress: [Swing implementation record](swing-trade-analyzer-progress.md).

## Product boundary

Preserve `/analytics/trade-analyzer/day` and add a separate
`/analytics/trade-analyzer/swing` family. The original parent plan explicitly
requires separate populations and swing-appropriate measurements. Swing intent
comes from the user's saved trade classification, never inferred from duration.
Use user-defined saved trade identity, including multiple position cycles when
grouped by the user. Count whole-trade P/L once; never count each round trip as
a separate saved trade. Account isolation and existing Gross/Net rules remain.

The incomplete Day Trend & Momentum and approved retry/download changes remain
separate work. Adding Swing must not replace those requirements or delay a safe
Day correction by coupling its release to this new feature.

## Proposed visible pages

| Route suffix under `/analytics/trade-analyzer/swing` | Title and purpose |
| --- | --- |
| root | Swing Trade Analysis: combined results, coverage and links to studies |
| `/entry-exit` | Entry & Exit: indicator and execution context at actual fills |
| `/trend-momentum` | Trend & Momentum: daily trend/momentum groups and changes during held positions |
| `/risk-recovery` | Risk & Recovery: drawdown, gaps, observed recovery and later opportunity |
| `/trades` | Analyzed Trades: supporting saved trades, filters and individual analysis |

Sidebar: Trade Analyzer contains Day Trade Analysis and Swing Trade Analysis.
Capability links stay within each family; do not add a flat sidebar link for
every study. Preserve existing day deep links and completed interactions.
Do not clone day-specific five-minute studies or candle-pattern claims without
validating their meaning and data requirements for swings.

## Candle budget and evidence

- Daily OHLCV across the full holding interval plus sufficient earlier daily
  bars for the selected daily indicators. Months of minute bars are not the
  default. Freeze provider coverage, adjustment policy and bounds in technical QA.
- Targeted intraday windows around actual entries, adds, partial exits and
  position closures, with bounded prior history for indicators. Merge overlapping
  windows and reuse saved candles across executions in the same account/provider
  scope. Do not assume minute history remains available months later.
- Additional finer windows only where required for a specific supported study;
  do not automatically expand them to every intervening session.
- Daily highs/lows support daily-range excursions. They do not establish exact
  intraday ordering, time spent at a level or which of two crossings happened
  first. Keep ambiguous outcomes unavailable, not guessed.
- Entry-day/exit-day daily extremes can include prices outside the holding
  interval. Use bounded intraday evidence for those partial sessions or disclose
  incomplete excursion coverage; never count a pre-entry high as opportunity.
- Separate held position cycles from flat intervals. Later re-entry does not
  permit counting intervening unheld prices as exposure or risk.
- Previous completed daily candles can inform entry indicators; that day's
  eventual close/high/low must not enter pre-entry context. Intraday indicators
  likewise use completed candles before the execution.
- Session VWAP is session-specific, not a single VWAP across a multi-month trade.
  Anchored VWAP is not implied by this plan. EMA/RSI intervals and history bounds
  must be clearly named and tested; reused numbers from the Day mode are not proof.
- Corporate-action-adjusted history must align with actual execution price/share
  basis. Do not silently compare split-adjusted chart prices with unadjusted fills.
  Confirm Moomoo daily/intraday history availability and relevant fallback contracts
  before promising exact coverage; no fabricated empty bars.

## Usage, persistence and scope

No AI. Saved-data-only analysis consumes no usage, including a first analysis.
Carry the owner's bounded free-retry policy into Swing once the shared contract
is implemented; internal window fetching is not a separate analysis charge per
window. Provider spacing/global caps still apply. Durable acquisition limits,
retention, request dedup and schema identities need a reviewed technical design.
Do not reuse Day-only job/session keys if they assume one trading date.

Store enough versioned evidence to reproduce saved findings without requiring
another provider request on every page view. Save compact daily history and
targeted intraday ranges, not fabricated full-session coverage. Preserve saved
analysis readability, corrections, regrouping, deletion and offline isolation.

## UI and verification gates

Owner review of this page group and representative card layout precedes UI
implementation. Use existing Light/Navy Dark components, plain trader-facing
card and column tooltips, clear units and unchanged financial reporting rules.
Explain daily-only versus finer coverage beside affected findings. Update Help
and offline views in the same implementation slice.

Before implementation, trace current Swing Tracker storage, saved-trade membership,
provider history limits, financial calculations, allowance and correction paths.
Complete technical-plan QA and an explicit source/migration allowlist.

Verification must cover multi-week/month trades, sparse/quiet history, long and
short, splits, overnight gaps, partial sessions, adds/partial exits/re-entry,
multiple round trips per saved trade, missing provider windows, corrected times,
no-charge cached analysis, bounded free retries and aggregate/drilldown equality.
Provider calibration and actual desktop/mobile/keyboard/offline acceptance remain
required. No local servers; hosted action and production release separately gated.
