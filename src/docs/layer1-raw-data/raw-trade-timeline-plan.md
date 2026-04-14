# Raw Trade Timeline Plan

## Purpose

This layer is the first and most important layer in the new system.

It is the raw truth layer.

Everything else will be built from this:

* derived signals
* pattern logic
* action outcome evaluation
* coaching
* severity
* trader-specific learning over time

This layer must capture:

* what the trader executed
* what the market did
* when each thing happened
* what happened before, between, and after executions

This layer must stay factual and interpretation-free.

---

## Market Data Provider Boundary

This layer should assume the candle provider can change over time.

That means:

- provider-specific fetching belongs below this layer
- provider-specific rate-limit handling belongs below this layer
- provider-specific payload quirks belong below this layer
- this layer should consume one normalized internal candle/session contract

The existing and future Layer 1 lanes should depend on normalized market data,
not on Yahoo-specific behavior or any other single provider.

If a provider swap would force logic changes inside derived-signal builders,
that is a sign the normalization boundary is not strong enough yet.

---

## Core Principle

This layer stores facts, not judgments.

Allowed here:

* execution timestamp
* execution price
* execution size
* candle open, high, low, close
* candle volume
* position size after execution
* realized PnL after execution
* average entry price after execution
* VWAP if available
* normalized session metadata
* data-availability flags when the source cannot provide enough context

Not allowed here:

* bad trade
* emotional re-entry
* failed dip
* panic sell
* good add
* destructive behavior

Those belong to higher layers.

---

## Main Goal

The raw data layer must preserve enough truth so the system can later determine:

* what happened before the first buy
* what happened after the first buy
* what happened between any two executions
* what happened after the final exit
* what the trader’s position looked like at each moment
* what the market context was around each execution

---

## Architecture Position

This is the first layer.

The long-term stack should be:

raw trade timeline
→ derived signals
→ action outcome evaluation
→ pattern logic
→ coaching
→ severity
→ trader-specific longitudinal analysis

If this first layer is weak, every layer above it becomes unstable.

---

## Raw Data Scope

This layer must cover three things:

### 1. Trader executions

What the trader actually did.

Examples:

* buy
* sell
* partial sell
* re-add
* full exit

### 2. Market context

What the chart was doing while the trader acted.

Examples:

* candles before trade
* candles during trade
* candles after trade
* volume
* VWAP
* session context

### 3. Timeline structure

How executions and candles line up over time.

Examples:

* candles before first execution
* candles between executions
* candles after last execution
* windows around each execution

---

## Key Design Rules

### Rule 1

Raw layer stores facts only.

### Rule 2

Every execution must be preserved in exact sequence.

### Rule 3

Candle context must exist before, during, and after the trade.

### Rule 4

Data between executions matters and must be preserved.

### Rule 5

Execution-level context windows are first-class structures.

### Rule 6

Deterministic state calculations belong in this layer.

### Rule 7

No behavior, pattern, or coaching labels belong here.

---

## Why Data Between Executions Matters

The system must not treat a trade as only:

entry
exit
result

That loses too much truth.

The market movement between executions often tells the real story.

Examples:

* first buy → price weakens → second buy
  this may indicate averaging down

* partial sell → price pulls back → re-add
  this may indicate constructive re-engagement or destructive re-add

* buy → price goes green → no sell → price goes red
  this may indicate missed profit protection

Because of this, the system must preserve what happens between every execution.

---

## Core Raw Artifacts

The raw layer should define these primary artifacts:

* Candle
* Execution
* TradeTimelineInput
* ExecutionContextWindow
* TradeStateSnapshot

Optional but likely useful:

* EventAnchor
* TradeTimelineWithState

---

## Candle

### Purpose

Represents one normalized market candle.

### Required structure

```ts
interface Candle {
  symbol: string;
  timestamp: string;
  timeframe: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}
```

### Optional future fields

```ts
interface CandleOptionalFields {
  vwap?: number;
  tradeCount?: number;
  source?: string;
  sessionBucket?: "pre_market" | "open" | "midday" | "close" | "after_hours";
}
```

### Notes

* timestamp must be normalized consistently
* timeframe must be explicit, like `1m`, `5m`, `15m`
* candle should remain raw and not contain interpretations
* the internal candle contract should remain provider-agnostic

---

## Execution

### Purpose

Represents one normalized trader execution.

### Required structure

```ts
interface Execution {
  symbol: string;
  timestamp: string;
  side: "buy" | "sell";
  shares: number;
  price: number;
  executionIndex: number;
}
```

### Optional future fields

```ts
interface ExecutionOptionalFields {
  orderId?: string;
  brokerExecutionId?: string;
  notes?: string;
  source?: string;
}
```

### Notes

* executionIndex preserves exact order
* no interpreted role labels should live here
* do not label raw executions as entry, add, partial, or final_exit in this layer

---

## TradeTimelineInput

### Purpose

Represents the full raw timeline for one trade analysis.

### Structure

```ts
interface TradeTimelineInput {
  symbol: string;
  timeframe: string;
  tradeDirection: "long" | "short";
  executions: Execution[];

  preTradeCandles: Candle[];
  tradeCandles: Candle[];
  postTradeCandles: Candle[];

  sessionContext: {
    sessionBucket: "pre_market" | "open" | "midday" | "close" | "after_hours";
    sessionDate: string;
  };
}
```

### Meaning of candle groups

#### preTradeCandles

Candles before the first execution.

Used later for:

* setup context
* extension context
* dip context
* trend context
* support/resistance context
* pre-entry volume behavior

#### tradeCandles

Candles from first execution through final execution.

Used later for:

* post-entry behavior
* between-execution behavior
* in-trade opportunity and damage
* reactions to adds, reductions, and exits

#### postTradeCandles

Candles after the final execution.

Used later for:

* exit quality
* missed continuation
* avoided damage
* post-exit coaching

---

## ExecutionContextWindow

### Purpose

Represents market context around a specific execution.

### Structure

```ts
interface ExecutionContextWindow {
  execution: Execution;
  candlesBeforeExecution: Candle[];
  candlesAfterExecution: Candle[];
}
```

### Why this matters

This lets the system later ask:

* what was happening before this buy
* what happened after this buy
* what was happening before this sell
* what happened after this sell
* what happened around a re-add
* what happened around a reduction

This is one of the most important base structures.

---

## TradeStateSnapshot

### Purpose

Represents the deterministic state of the trade immediately after a given execution.

### Structure

```ts
interface TradeStateSnapshot {
  executionIndex: number;
  timestamp: string;
  positionSize: number;
  averageEntryPrice: number | null;
  realizedPnl: number;
  isFlat: boolean;
}
```

### Why this matters

Later layers need to know:

* current position size
* average entry price
* whether size increased or decreased
* whether profit had already been locked
* whether the trader was flat or still active

This is still raw enough to belong in the base layer because it is deterministic from executions.

---

## TradeTimelineWithState

### Purpose

Combines raw timeline inputs with deterministic state snapshots.

### Structure

```ts
interface TradeTimelineWithState {
  timeline: TradeTimelineInput;
  stateSnapshots: TradeStateSnapshot[];
}
```

### Notes

This is still not interpretation.
It is just raw events plus deterministic trade state.

---

## EventAnchor

### Purpose

Marks important points in the trade timeline without assigning judgment.

### Structure

```ts
interface EventAnchor {
  eventType: string;
  executionIndex: number;
  timestamp: string;
  price: number;
}
```

### Notes

This should stay generic in the raw layer.
Later layers can define stricter event meanings.

---

## Raw Layer Responsibilities

This layer should:

* normalize candle records
* normalize execution records
* preserve exact ordering
* separate pre-trade, in-trade, and post-trade candles
* generate execution context windows
* generate deterministic trade state snapshots
* align executions and candles cleanly

This layer should not:

* detect patterns
* label behavior
* produce coaching
* assign severity
* decide whether something was good or bad

---

## What This Layer Must Support Later

This raw layer must be rich enough to support three later signal families.

### Execution-derived signals

Examples:

* average_down_detected
* add_after_reduction_detected
* overtrading
* re-entry timing
* scaling behavior

### Candle-derived signals

Examples:

* entry_vs_vwap
* dip depth
* reclaim before entry
* adverse move after entry
* rebound quality
* continuation after exit

### Combined signals

Examples:

* entered before confirmation
* re-added into weakness
* sold too early relative to continuation
* gave back locked profit after re-add

That means the raw layer must capture enough truth that these can be derived later without redesigning the base.

---

## Relationship to Action Outcome Evaluation

The future Action Outcome layer will depend heavily on this raw layer.

It will need:

* the execution event
* the state at that event
* candles after that event
* context before that event

That means the raw layer must make it easy to anchor an action in time and inspect what happened afterward.

---

## Relationship to Pattern Logic

Pattern logic should never read directly from messy raw inputs.

Instead:

raw layer
→ normalized timeline and state
→ derived signals
→ patterns

So the raw layer must be clean and reusable enough to serve all future patterns, not just one.

---

## v1 Completeness Standard

The raw layer is ready to build on when:

* candles are normalized cleanly
* executions are normalized cleanly
* timeline sections are clearly separated
* execution context windows can be generated
* deterministic state snapshots can be generated
* no interpretation logic has leaked into the layer

That is the point where the first layer is trustworthy.

---

## First Files To Build

The first coding pass should create only these files:

* `src/lib/raw-trade-timeline/types/candle.ts`
* `src/lib/raw-trade-timeline/types/execution.ts`
* `src/lib/raw-trade-timeline/types/trade-timeline-input.ts`
* `src/lib/raw-trade-timeline/types/execution-context-window.ts`
* `src/lib/raw-trade-timeline/types/trade-state-snapshot.ts`

Optional immediately after:

* `src/lib/raw-trade-timeline/types/event-anchor.ts`
* `src/lib/raw-trade-timeline/types/trade-timeline-with-state.ts`

No pattern logic should be created before these feel complete.

---

## Locked Conclusion

This raw trade timeline layer is the foundation of the new system.

It must be broad enough to preserve the full trade story:

* before first execution
* between every execution
* after final execution

It must remain factual, deterministic, and free of interpretation.

Everything else will depend on it.
