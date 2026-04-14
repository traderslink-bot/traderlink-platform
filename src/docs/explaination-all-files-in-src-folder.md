# Raw Trade Timeline Layer — File Reference

// 2026-04-12 America/Toronto
// PURPOSE:
// Provides a complete file-level reference for the Raw Trade Timeline Layer.
// Explains the purpose of every file in the layer to ensure clarity,
// maintainability, and consistency across future development.

---

## Overview

This document lists all files involved in the Raw Trade Timeline Layer and explains:

- what each file does
- why it exists
- how it fits into the system

This layer is the **foundation of the entire system**.

---

# 📂 Data Source Adapters

## Execution Sources

### `execution-sources/manual/map-manual-execution-to-normalize-execution-input.ts`
Maps manual execution data into normalized execution input format.

### `execution-sources/types/provider-execution.ts`
Defines the structure of execution data coming from external providers.

---

## Market Data Sources

### `market-data-sources/provider-candle.ts`
Defines a generic candle interface for external data providers.

### `market-data-sources/yahoo/map-yahoo-candle-to-normalize-candle-input.ts`
Transforms Yahoo API candle data into normalized candle input format.

### `market-data-sources/yahoo/yahoo-candle-types.ts`
Defines Yahoo-specific candle response types.

---

# 📂 Raw Trade Timeline Layer

---

## 🏗 Builders

### `build-trade-timeline.ts`
Core builder that assembles the full trade timeline structure.

### `build-trade-timeline-segments.ts`
Splits the timeline into:
- pre-trade
- between executions
- post-trade

### `create-raw-trade-timeline.ts`
Main entry point for building the raw timeline.
Coordinates normalization, validation, and all derived signal builders.

---

## 🧠 State

### `state/build-trade-state-series.ts`
Builds deterministic trade state snapshots across executions:
- position size
- average entry
- realized PnL
- flat vs active state

---

## 🪟 Execution Context Windows

### `windows/build-execution-context-windows.ts`
Builds context windows around each execution:
- candles before execution
- candles after execution

---

## 🔄 Normalizers

### `normalizers/normalize-candle.ts`
Normalizes candle input into canonical format.

### `normalizers/normalize-execution.ts`
Normalizes execution input into canonical format.

---

## 📊 Derived Signals

These files convert raw data into structured factual signals.

---

### `derived/build-execution-derived-signals.ts`
Per-execution price behavior:
- MFE / MAE
- percentage movement
- post-execution price performance

---

### `derived/build-position-change-derived-signals.ts`
Position behavior:
- size changes
- increases / decreases
- flat transitions
- realized PnL changes

---

### `derived/build-timeline-relationship-signals.ts`
Timing and spacing:
- time between executions
- candles between executions
- execution pacing
- execution density

---

### `derived/build-trade-derived-signals.ts`
Whole trade behavior:
- trade MFE / MAE
- peak and worst price
- trade duration
- entry / exit prices

---

## 📦 Types

Defines all core data structures.

---

### `types/candle.ts`
Represents a normalized market candle.

### `types/execution.ts`
Represents a normalized execution event.

### `types/trade-timeline-input.ts`
Input structure for building the trade timeline.

### `types/trade-timeline.ts`
Final timeline structure combining all data.

### `types/trade-timeline-segment.ts`
Represents timeline segmentation blocks.

### `types/execution-context-window.ts`
Defines execution context windows.

### `types/trade-state-snapshot.ts`
Represents trade state at a point in time.

### `types/trade-state-series.ts`
Collection of trade state snapshots.

### `types/session-context.ts`
Represents session metadata.

### `types/raw-trade-timeline-build-result.ts`
Final output contract of the raw layer.

---

## ✅ Validators

Ensures data integrity.

---

### `validators/validate-candle-sequence.ts`
Validates candle ordering and consistency.

### `validators/validate-execution-sequence.ts`
Validates execution ordering and correctness.

### `validators/validate-trade-timeline-input.ts`
Validates input before timeline build.

### `validators/validate-trade-timeline.ts`
Validates final timeline structure.

---

## 🧪 Fixtures (Test Data)

---

### `__fixtures__/sample-create-raw-trade-timeline-input.ts`
Complete sample input for testing the system.

### `__fixtures__/sample-manual-executions.ts`
Sample execution dataset.

### `__fixtures__/sample-yahoo-candles.ts`
Sample Yahoo candle dataset.

---

## 🧪 Tests

All tests validate correctness of each component.

---

### `__tests__/build-trade-state-series.test.ts`
Tests trade state logic.

### `__tests__/create-raw-trade-timeline.test.ts`
Tests full timeline construction.

### `__tests__/build-execution-derived-signals.test.ts`
(implicitly covered via integration)

### `__tests__/build-position-change-derived-signals.test.ts`
Tests position behavior calculations.

### `__tests__/build-timeline-relationship-signals.test.ts`
Tests timing and spacing logic.

### `__tests__/build-trade-derived-signals.test.ts`
Tests whole-trade calculations.

### `__tests__/build-pattern-input.test.ts`
Validates pattern input aggregation layer.

---

## 🧪 Debug

---

### `debug/run-sample-timeline.ts`
Manual debug runner to inspect full system output.

---

# 📂 Pattern Input Layer (Bridge Layer)

---

## Builders

### `pattern-input/builders/build-pattern-input.ts`
Aggregates raw derived signals into a clean, pattern-ready structure.

---

## Types

### `pattern-input/types/pattern-input.ts`
Defines the contract for pattern detection input.

---

# 🧠 Summary

This file structure provides:

- complete raw data capture
- deterministic signal generation
- strict separation of concerns
- clean transition into intelligence layers

---

# 🚀 Next Layer

The next layer is:

👉 Pattern Detection Layer

This layer will:
- interpret pattern input
- detect behaviors
- classify trade patterns
