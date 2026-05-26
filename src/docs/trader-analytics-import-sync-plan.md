# Trader Analytics Import And Sync Plan

## Purpose

This document describes how user execution data should enter the analytics
system.

It is intentionally separate from candle fetching.

## Ownership Boundary

`trader-intelligence-v2` owns:

- saved user execution trades
- validation/import preview
- execution-feedback summaries
- saved analytics reports
- report history
- drill-downs, focus queues, rules, notes, and product workflows

`levels-system` owns:

- candle fetching
- support/resistance
- VWAP/EMA
- candle market structure
- chart-reading logic

Execution import/sync should not move candle ownership into this app.

## Current Implemented Piece

The first import preview helper lives in:

```text
src/lib/trader-analytics/product/import-preview.ts
```

It exposes:

```ts
previewSavedTradeImport(requests)
previewBrokerExecutionCsvImport(args)
```

`previewSavedTradeImport(...)` validates public trade-analysis requests and
returns:

- total count
- accepted count
- rejected count
- warning count
- per-request messages

`previewBrokerExecutionCsvImport(...)` first parses broker CSV execution rows
through:

```text
src/lib/execution-sources/csv/broker-execution-csv-import.ts
```

It currently supports:

- IBKR activity / Flex-style trades
- Moomoo trade history
- Webull order history
- Robinhood transaction history
- Schwab transactions
- generic execution CSV files

The CSV parser maps broker rows into `ProviderExecution[]`, groups those rows
into `UserTradeAnalysisRequest[]`, and then feeds the same saved-trade import
preview. It does not store data, does not expose export, and does not set the
broker CSV source as the candle provider.

The CSV parser also returns import diagnostics:

- file fingerprint
- effective timestamp timezone
- options handling mode
- broker mapping confidence
- detected broker columns
- header row number
- missing required fields
- row outcomes
- issue counts
- grouped trade fingerprints
- trade grouping diagnostics

The product preview wrapper can flag a same-file duplicate when provided with
previously stored file fingerprints. Import reconciliation also uses trade
fingerprints to detect saved-trade duplicates and repeated trades inside the
same batch.

The parser now supports broker-local timestamp conversion through an optional
`timestampTimezone` setting. It also captures optional commission/fee/net amount
fields where the CSV provides them, and rejects options rows by default so the
stock execution analytics lane does not accidentally misread option contracts.

The product preview wrapper now accepts `accountTimezone` as the default
timestamp timezone for account-scoped imports, and it returns
`productDiagnostics` containing:

- import repair workflow items
- import summary cards
- net P/L preview
- broker/app P/L reconciliation
- import commit plan
- import review dashboard model
- mapping learning signal
- options quarantine
- grouping diagnostics for review

The CSV parser now also accepts:

- explicit `columnMapping` for unknown broker headers
- `tradeGroupingRules.maxGapMinutes`
- `tradeGroupingRules.splitAtSessionBoundary`

Those rules are for import safety only. They do not change candle ownership or
move market-structure work into this app.

Representative generic fixtures now also cover Fidelity, E*TRADE, Tastytrade,
TradeStation, and Thinkorswim/TDA-style execution exports. Those brokers remain
generic fixtures until real samples or official field contracts justify
first-class broker keys.

The detailed plan lives in:

```text
src/docs/end-user-execution-import-and-storage-plan.md
```

The database schema plan lives in:

```text
src/docs/end-user-database-schema-plan.md
```

## Recommended Staged Build

1. Define saved execution trade contracts.
2. Add import preview and validation.
3. Quarantine invalid trades.
4. Save accepted trades through a repository interface.
5. Build execution-feedback summaries.
6. Generate saved analytics reports.
7. Later attach market-context summaries separately.

## Supported Early Input Shape

Use the same public trade request shape already accepted by:

```text
POST /api/execution-feedback/debug
POST /api/trader-analytics/debug
```

Required fields:

- `symbol`
- `tradeDirection`
- `sessionContext.sessionDate`
- `sessionContext.sessionBucket`
- `executions[].symbol`
- `executions[].timestamp`
- `executions[].side`
- `executions[].shares`
- `executions[].price`

## Invalid Trade Handling

Invalid trades should be:

- rejected before report generation
- counted visibly
- shown with validation messages
- excluded from aggregate analytics
- preserved internally only if an import workflow needs a quarantine/retry
  queue

## No-Export Rule

Import/sync is not an export workflow.

Do not add production controls that download raw saved trades, raw report JSON,
or spreadsheet-style output.
