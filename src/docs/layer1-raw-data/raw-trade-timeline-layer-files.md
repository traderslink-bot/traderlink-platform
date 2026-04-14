# Raw Trade Timeline Layer — File Reference

// 2026-04-12 America/Toronto
// PURPOSE:
// Lists ONLY the files that belong to the Raw Trade Timeline Layer (Layer 1).
// This layer is strictly factual, deterministic, and interpretation-free.

---

## Overview

This document includes ONLY:

- data source adapters
- raw timeline construction
- state tracking
- derived factual signals
- validation
- testing

It EXCLUDES:
- pattern input
- pattern detection
- scoring
- coaching

---

# 📂 Data Source Adapters

## Execution Sources

### `execution-sources/manual/map-manual-execution-to-normalize-execution-input.ts`
Maps manual execution data into normalized execution format.

### `execution-sources/types/provider-execution.ts`
Defines external execution provider structure.

---

## Market Data Sources

### `market-data-sources/provider-candle.ts`
Defines generic external candle structure.

### `market-data-sources/yahoo/map-yahoo-candle-to-normalize-candle-input.ts`
Maps Yahoo candle data into normalized format.

### `market-data-sources/yahoo/yahoo-candle-types.ts`
Defines Yahoo-specific response types.

---

# 📂 Raw Trade Timeline

---

## 🏗 Builders

### `raw-trade-timeline/builders/build-trade-timeline.ts`
Builds the full timeline structure.

### `raw-trade-timeline/builders/build-trade-timeline-segments.ts`
Segments timeline into:
- pre-trade
- between executions
- post-trade

### `raw-trade-timeline/builders/create-raw-trade-timeline.ts`
Main entry point for full pipeline.

---

## 🧠 State

### `raw-trade-timeline/state/build-trade-state-series.ts`
Tracks:
- position size
- average entry
- realized PnL
- flat state

---

## 🪟 Execution Context

### `raw-trade-timeline/windows/build-execution-context-windows.ts`
Builds context windows around executions.

---

## 🔄 Normalizers

### `raw-trade-timeline/normalizers/normalize-candle.ts`
Normalizes candle input.

### `raw-trade-timeline/normalizers/normalize-execution.ts`
Normalizes execution input.

---

## 📊 Derived Signals

---

### `raw-trade-timeline/derived/build-execution-derived-signals.ts`
Execution-level price behavior (MFE / MAE).

### `raw-trade-timeline/derived/build-position-change-derived-signals.ts`
Position size changes and transitions.

### `raw-trade-timeline/derived/build-timeline-relationship-signals.ts`
Timing and spacing between executions.

### `raw-trade-timeline/derived/build-trade-derived-signals.ts`
Whole-trade performance metrics.

---

## 📦 Types

---

### `raw-trade-timeline/types/candle.ts`
Normalized candle structure.

### `raw-trade-timeline/types/execution.ts`
Normalized execution structure.

### `raw-trade-timeline/types/trade-timeline-input.ts`
Timeline input contract.

### `raw-trade-timeline/types/trade-timeline.ts`
Final timeline structure.

### `raw-trade-timeline/types/trade-timeline-segment.ts`
Timeline segment definition.

### `raw-trade-timeline/types/execution-context-window.ts`
Execution context structure.

### `raw-trade-timeline/types/trade-state-snapshot.ts`
State snapshot at execution.

### `raw-trade-timeline/types/trade-state-series.ts`
Collection of state snapshots.

### `raw-trade-timeline/types/session-context.ts`
Session metadata.

### `raw-trade-timeline/types/raw-trade-timeline-build-result.ts`
Final raw layer output contract.

---

## ✅ Validators

---

### `raw-trade-timeline/validators/validate-candle-sequence.ts`
Validates candle order.

### `raw-trade-timeline/validators/validate-execution-sequence.ts`
Validates execution order.

### `raw-trade-timeline/validators/validate-trade-timeline-input.ts`
Validates input.

### `raw-trade-timeline/validators/validate-trade-timeline.ts`
Validates final timeline.

---

## 🧪 Fixtures

---

### `raw-trade-timeline/__fixtures__/sample-create-raw-trade-timeline-input.ts`
Full sample input.

### `raw-trade-timeline/__fixtures__/sample-manual-executions.ts`
Sample executions.

### `raw-trade-timeline/__fixtures__/sample-yahoo-candles.ts`
Sample candles.

---

## 🧪 Tests

---

### `raw-trade-timeline/__tests__/build-trade-state-series.test.ts`
Tests state tracking.

### `raw-trade-timeline/__tests__/create-raw-trade-timeline.test.ts`
Tests full pipeline.

### `raw-trade-timeline/__tests__/build-position-change-derived-signals.test.ts`
Tests position changes.

### `raw-trade-timeline/__tests__/build-timeline-relationship-signals.test.ts`
Tests timing relationships.

### `raw-trade-timeline/__tests__/build-trade-derived-signals.test.ts`
Tests trade metrics.

---

## 🧪 Debug

---

### `raw-trade-timeline/debug/run-sample-timeline.ts`
Manual debug runner.

---

# 🧠 Final Note

This file defines ONLY Layer 1.

Everything here is:
- factual
- deterministic
- interpretation-free

---

## Next Layer

👉 Pattern Input Layer (separate system)