# Real CSV Calibration Guide

This guide explains how to test `trader-intelligence-v2` with anonymized real
execution CSVs.

The goal is to improve broker import reliability without asking for private
broker credentials or personal account data.

## What Calibration Tests

Calibration checks whether the app can:

- recognize broker headers
- map execution columns into canonical fields
- accept filled stock executions
- reject or skip unsupported rows safely
- group executions into trades
- detect open positions
- disclose fees, commissions, broker net amounts, and currencies
- keep execution feedback gross-only unless a later net-P/L scoring plan
  explicitly changes that contract

Calibration does not fetch candles and does not call broker APIs.

When decision-review calibration is requested, the app can also pass completed
grouped dry-run trades through `/api/import-dry-run/decision-review`. That
server route consumes precomputed daily/4h support/resistance facts from
`levels-system`, including level strength/grade. The browser still does not
compute support/resistance, VWAP, EMA, or market structure.

## Columns That Matter

Preserve these columns when they exist:

- symbol or ticker
- timestamp, or separate date and time
- side, action, transaction type, or instruction
- quantity, shares, filled quantity, or filled shares
- price, fill price, average price, or execution price
- status or fill status
- order id or execution id
- commission
- fees
- broker net amount, amount, net proceeds, or broker net P/L
- currency
- asset type or description when options/non-stock rows may be present

For IBKR activity statements, keep `Comm/Fee` when present. Plain `Proceeds`
is treated as gross proceeds, not broker net P/L, so it should not force a
net-P/L mismatch by itself.

Full IBKR monthly Activity Statements can include more than trade executions.
The importer expects this and should skip:

- `Trades` subtotals/totals
- repeated `Trades/Header` rows
- non-stock `Trades/Data` rows such as Forex
- deposits and withdrawals sections
- financial instrument information sections

Those skipped rows are informational. They should not become repair blockers or
make the file look broken.

IBKR monthly statements can also contain entries/exits that cross regular
session dates or sit several hours apart. The dry-run importer currently uses
IBKR-specific grouping defaults of `maxGapMinutes=10080` and
`splitAtSessionBoundary=false`, so a position can close later in the same
monthly statement instead of becoming two fake open trades.

Headers matter. Keep real headers whenever possible.

## Safe Anonymization

Before sharing or committing a calibration CSV:

- remove account numbers
- remove names, addresses, emails, phone numbers, and tax identifiers
- remove broker login details
- remove API keys, tokens, session ids, or authorization values
- preserve the header row
- preserve row order
- preserve enough timestamp detail to test trade grouping
- preserve side, quantity, and price relationships enough to test math
- replace account ids with stable placeholders like `ACCOUNT_1`
- replace order ids with stable placeholders like `ORDER_1`, `ORDER_2`
- use fake tickers only if every row for the same trade is changed
  consistently

Do not randomize each cell independently. That can destroy the execution math
the import needs to validate.

## What Not To Send

Do not send:

- account numbers
- login credentials
- API keys
- broker tokens
- personal identity fields
- bank transfer records
- tax forms
- statements that include unrelated personal data

If a file has more than trade-execution rows, trim it down to the smallest
sample that still reproduces the import behavior.

## Broker Notes

- IBKR in the sibling `levels-system` project is for candle data.
- CSV import in this project is for the user's completed trade executions.
- Current representative parser targets include:
  - IBKR activity statements
  - Moomoo trade history
  - Webull order history
  - Robinhood transaction history
  - Schwab transactions
  - generic execution CSVs
- More brokers can be calibrated later with safe anonymized examples.

## Expected Calibration Output

A useful calibration run should report:

- parse success or failure
- accepted execution count
- rejected row count
- skipped row count
- grouped trade count
- open-position count
- correction or repair count
- confidence state
- top blockers
- fee/commission visibility
- broker net amount presence
- gross-only scoring policy

For decision-review calibration, also report:

- decision-review snapshot count
- expected vs actual insight IDs for deterministic synthetic fixtures
- coaching headlines and insight IDs for real anonymized CSVs
- whether market context came from `levels_system_daily_4h`
- level-grade evidence such as `nearestResistanceStrength=major`
- missing required coaching/evidence fragments
- forbidden VWAP/EMA wording, if any
- whether trade-window excursions were measured from aligned levels-system
  candles or fell back to execution-only movement because 1m/5m candles were
  disconnected from execution prices

When a real CSV shows many execution-only fallback rows, do not immediately
tune trader coaching. First verify the levels-system provider/backfill path.
Execution-only fallback is acceptable for safe dry-run calibration, but it is
not a substitute for real historical 1m/5m candle windows when judging
post-entry movement and post-exit continuation.

`npm run calibrate:decision-review` writes its latest report to
`artifacts/decision-review-quality/latest.md` by default and also keeps a
timestamped history file such as
`artifacts/decision-review-quality/2026-05-05T12-00-00-000Z-synthetic.md`.
Use `--json` for JSON reports, `--out=<path>` for a custom latest/custom report
path, `--no-history` to skip the timestamped copy, or `--no-write` when
stdout-only output is preferred.

For a folder of anonymized CSVs, use `--csv-dir`:

```bash
npm run calibrate:decision-review -- --csv-dir=path/to/anonymized-csv-folder --broker=generic_execution_csv --max-trades=5
```

Directory mode writes:

- `artifacts/decision-review-quality/latest-batch.md`
- `artifacts/decision-review-quality/<timestamp>-csv-dir/index.md`
- one report per CSV inside that timestamped folder

Use the index report to spot files that were blocked, skipped, capped, or
produced confusing review output. Convert those misses into synthetic fixtures
with `src/docs/trader-real-csv-miss-to-fixture-template.md`.

## Local Commands

Use bounded non-watch commands:

```bash
npx vitest run src/lib/trader-analytics/__tests__/trader-csv-dry-run-import-ui.test.ts
npx vitest run src/lib/trader-analytics/__tests__/csv-dry-run-decision-review-quality-dashboard.test.ts
npm run calibrate:decision-review -- --generated-at=2026-05-05T12:00:00.000Z
npx tsx src/scripts/run-ibkr-grouping-review-report.ts --csv=path/to/ibkr-activity-statement.csv --account-timezone=America/Toronto --out=artifacts/real-csv-calibration/private/ibkr-grouping-review.md
npm run calibrate:decision-review -- --csv=path/to/anonymized.csv --broker=generic_execution_csv --max-trades=5
npm run calibrate:decision-review -- --csv=path/to/ibkr-activity-statement.csv --broker=ibkr_activity_statement --account-timezone=America/Toronto --max-trades=5
npm run calibrate:decision-review -- --csv=path/to/ibkr-activity-statement.csv --broker=ibkr_activity_statement --account-timezone=America/Toronto --max-trades=25 --json --out=artifacts/real-csv-calibration/private/ibkr-first-25.json --no-history
npx tsx src/scripts/summarize-decision-review-calibration.ts --json=artifacts/real-csv-calibration/private/ibkr-first-25.json --out=artifacts/real-csv-calibration/private/ibkr-first-25-summary.md
npm run summarize:market-data-readiness -- --json=artifacts/real-csv-calibration/private/ibkr-first-100.json --out=artifacts/real-csv-calibration/private/ibkr-first-100-market-data-readiness.md
npm run compare:decision-review-calibrations -- --baseline=artifacts/real-csv-calibration/private/ibkr-first-100-before-levels-system.json --candidate=artifacts/real-csv-calibration/private/ibkr-first-100-after-levels-system.json --out=artifacts/real-csv-calibration/private/ibkr-first-100-before-after-comparison.md
npm run calibrate:saved-import -- --csv-from-artifact=artifacts/real-csv-calibration/private/<existing-private-calibration-with-csvPath>.json --broker=ibkr_activity_statement --account-timezone=America/Toronto --out=artifacts/real-csv-calibration/private/saved-import-calibration.json
npm run calibrate:decision-review -- --csv-dir=path/to/anonymized-csv-folder --broker=generic_execution_csv --max-trades=5
npx vitest run src/lib/execution-sources/csv/__tests__/broker-execution-csv-import.test.ts
npx playwright test tests/e2e/import-dry-run.spec.ts --project=chromium-desktop
```

Avoid watch/dev commands for calibration verification.

## Product Boundary

This app imports executions and produces trader review intelligence.

It does not own:

- candle fetching
- candle storage
- support/resistance calculation
- VWAP or EMA calculation
- market-structure calculation

Those remain owned by `levels-system` and should only enter this app as
precomputed market-context facts.

## Current First-100 Baseline

Use this as the before snapshot when validating future `levels-system`
historical backfill improvements:

- completed reviews: 100
- market context: `levels_system_daily_4h=100`
- trade-window evidence:
  - `execution_only_fallback`: 66
  - `levels_system_trade_window`: 34
- weak/no daily/4h level evidence rows: 81
- candle-quality note rows: 67
- missing trade-window excursion insights: 0
- extreme excursion metrics: 0
- fallback/generic headlines: 0
- open skipped trades: 2

After `levels-system` improves historical as-of support/resistance and
on-demand candle backfill, rerun the same first-100 calibration and compare.
Success means the fallback and weak-level counts drop while missing excursion,
extreme excursion, and generic headline counts stay at zero.
