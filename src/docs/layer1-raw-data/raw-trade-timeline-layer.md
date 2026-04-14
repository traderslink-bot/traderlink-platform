# Raw Trade Timeline Layer

// 2026-04-12 America/Toronto
// PURPOSE:
// Defines the complete raw data and derived factual signal layer for the
// Trader Intelligence System. This layer is the foundation of the system
// and must remain strictly deterministic, factual, and interpretation-free.

---

## Overview

The Raw Trade Timeline Layer is responsible for capturing and structuring:

- Market data (candles)
- Trader actions (executions)
- Timeline structure
- Deterministic trade state
- Derived factual signals

This layer represents **objective truth only**.

It does NOT perform:
- pattern detection
- behavior labeling
- scoring
- coaching
- subjective interpretation

---

## Core Philosophy

This layer must:

- Preserve the full timeline of a trade
- Capture what happened before, during, and after executions
- Represent both market behavior and trader behavior
- Remain deterministic and reproducible
- Serve as the single source of truth for all higher layers

---

## Data Sources

The system currently operates on:

### 1. Execution Data
- Buy and sell actions
- Timestamped
- Price and share size

### 2. Candle Data (Yahoo)
- OHLCV candles
- Time-based aggregation (e.g. 1m)

---

## Layer Structure

### 1. Raw Timeline

Files:
- `build-trade-timeline.ts`
- `trade-timeline.ts`
- `trade-timeline-segments.ts`

Responsibilities:
- Combine candles and executions into a unified structure
- Maintain strict chronological ordering
- Segment timeline into:
  - pre-trade
  - between executions
  - post-trade

---

### 2. Trade State

Files:
- `build-trade-state-series.ts`
- `trade-state-snapshot.ts`

Responsibilities:
- Track position size over time
- Track average entry price
- Track realized PnL
- Determine flat vs active position

---

### 3. Execution Context Windows

Files:
- `build-execution-context-windows.ts`
- `execution-context-window.ts`

Responsibilities:
- Capture candles before and after each execution
- Provide localized market context

---

## Derived Signal Layers

These layers transform raw data into structured, factual signals.

---

### 4. Execution Derived Signals

File:
- `build-execution-derived-signals.ts`

Captures:
- Maximum favorable movement (MFE)
- Maximum adverse movement (MAE)
- Percentage-based movement
- Price behavior after each execution

---

### 5. Position Change Derived Signals

File:
- `build-position-change-derived-signals.ts`

Captures:
- Position size changes
- Size increase / decrease
- Flat → open transitions
- Open → flat transitions
- Realized PnL changes
- Relative size changes

---

### 6. Timeline Relationship Signals

File:
- `build-timeline-relationship-signals.ts`

Captures:
- Time between executions
- Candles between executions
- Execution pacing
- Execution density

---

### 7. Trade Derived Signals

File:
- `build-trade-derived-signals.ts`

Captures:
- Full trade MFE / MAE
- Peak and worst price
- Trade duration
- Trade candle count
- Entry and exit price

---

## Output Contract

Primary output type:

- `RawTradeTimelineBuildResult`

Contains:

- raw timeline
- execution-derived signals
- position-change signals
- timeline relationship signals
- trade-level signals

This is the **complete factual representation of a trade**.

---

## What This Layer Does NOT Do

This layer explicitly avoids:

- labeling behavior (e.g. "chase", "good trade")
- classifying setups
- assigning quality or performance scores
- generating coaching suggestions
- interpreting intent

---

## System Boundary

This layer is the **final step before intelligence begins**.

Everything above this layer must:

- consume this data
- not modify it
- not reinterpret raw values

---

## Future Enhancements (Optional)

These are not required but may be added later:

- tick-level data
- order book data
- bid/ask spread
- slippage modeling
- volatility indicators (ATR, range)
- multi-timeframe context

These are **data enhancements**, not structural requirements.

---

## Final Status

The Raw Trade Timeline Layer is:

- complete
- fully tested
- deterministic
- stable

It is safe to build all higher layers on top of this foundation.

---

## Next Layer

The next layer is:

👉 Pattern Input Layer

This layer aggregates raw derived signals into a simplified structure
for pattern detection.
