# Trader Intelligence System (v2)

## Overview

This project is a complete rebuild of the trader analysis system.

The goal is to build a **high-accuracy trade intelligence engine** that evaluates:

* what the trader did
* what the market did
* how those two interacted over time
* whether decisions improved or damaged the trade

This system is designed specifically for:

* small cap
* low float
* highly volatile stocks
* intraday trading behavior

The system prioritizes:

* truth over appearance
* behavioral accuracy over UI
* execution quality over PnL alone
* structured reasoning over guesswork

---

## Core Philosophy

The system is built on one core idea:

**Trades are not good or bad by default.**

Instead, trades must be evaluated based on:

* trader actions
* market context
* timing
* sequence of decisions
* outcomes after each action

---

## System Direction (Important Shift)

This version moves away from:

* hardcoded “good vs bad” patterns
* static labels like “bad trade”
* PnL-based judgment alone

And moves toward:

* action-based evaluation
* outcome-based validation
* timeline-based reasoning
* context-aware analysis

---

## Core Intelligence Model

The system evaluates trades using three layers of truth:

### 1. Market Baseline Logic

General trading principles such as:

* buying into weakness is usually risky
* chasing extension is usually risky
* locking profit into strength is usually constructive

This provides a **baseline expectation**.

---

### 2. Trade-Specific Outcome Truth

What actually happened in THIS trade.

Examples:

* a risky action worked
* a “good” action failed
* a trade recovered
* a trade collapsed

This prevents false assumptions.

---

### 3. Trader-Specific Behavioral Truth (Future Layer)

Across many trades:

* what this trader does well
* what consistently hurts them
* repeat behavioral mistakes
* repeat strengths

This allows personalized coaching.

---

## System Architecture

The system is built from the bottom up.

Each layer depends on the layer below it.

### Layer 1 — Raw Trade Timeline (FOUNDATION)

This is the most important layer.

It captures:

* executions (what the trader did)
* candles (what the market did)
* full timeline (before, during, after trade)
* position state over time

This layer contains **no interpretation**.

Everything else depends on this.

---

### Layer 2 — Derived Signals

Transforms raw data into structured signals.

Examples:

* entry vs VWAP
* dip depth
* adverse move after entry
* rebound detection
* scaling behavior
* average down detection

Still no coaching or judgment.

Only structured facts derived from raw data.

---

### Layer 3 — Action Outcome Evaluation

Evaluates trader decisions based on what happened after them.

Examples:

* add after reduction → did it improve or damage the trade?
* early exit → did it avoid loss or miss continuation?
* average down → did it recover or worsen the trade?

This layer introduces:

* constructive vs destructive outcomes
* event-based evaluation
* post-action analysis

---

### Layer 4 — Pattern Logic

Combines signals and action outcomes into structured patterns.

Examples:

* failed dip entry
* failed breakout chase
* under-sized winner
* late exit winner
* no profit protection

Patterns are not raw facts — they are structured interpretations.

---

### Layer 5 — Coaching Layer

Generates human-readable feedback.

Examples:

* You entered before confirmation and absorbed unnecessary drawdown
* You reduced risk correctly, then re-added into weakness and gave back profit
* You exited early and missed continuation

---

### Layer 6 — Severity & Scoring

Determines:

* how damaging or constructive behavior was
* how much impact it had
* prioritization of mistakes

---

### Layer 7 — Trader Behavior Intelligence (Future)

Tracks behavior across many trades.

Examples:

* most frequent mistakes
* most destructive habits
* strongest skills
* behavioral identity

---

## Critical Design Rules

### Rule 1

The system must be built from the bottom up.

Never build higher layers on weak lower layers.

---

### Rule 2

The raw data layer must be correct before anything else.

If raw data is wrong, everything above is wrong.

---

### Rule 3

Actions are neutral until outcome is measured.

Examples:

* re-add is not automatically bad
* partial profit is not automatically good
* early exit is not automatically wrong

Only outcome determines quality.

---

### Rule 4

PnL is not enough.

A profitable trade can still contain bad behavior.
A losing trade can still contain good execution.

---

### Rule 5

Timeline matters.

The system must evaluate:

* before entry
* after entry
* between executions
* after exit

---

### Rule 6

Data between executions is critical.

The system must not ignore:

* movement between buys
* movement between sell and re-add
* movement before exit

This is where most behavioral truth exists.

---

### Rule 7

Separation of concerns must be strict.

Raw data layer must not:

* label behavior
* detect patterns
* generate coaching

---

## Raw Data Layer (Current Focus)

The current stage of the project is:

**building the raw trade timeline layer to completion**

This includes:

* candle model
* execution model
* trade timeline model
* execution context windows
* trade state snapshots

Nothing else should be built until this is solid.

---

## What This System Must Capture

For every trade:

### Before the trade

* setup context
* trend
* extension
* dip behavior

### During the trade

* all executions
* price movement between executions
* market reaction to decisions

### After the trade

* continuation
* reversal
* missed opportunity

---

## What Makes This System Different

Most systems:

* rely on PnL
* label trades too simply
* ignore context
* ignore timing

This system:

* evaluates decisions, not just outcomes
* evaluates context, not just actions
* evaluates sequences, not just endpoints
* evaluates outcomes after each action

---

## Development Strategy

This system must be built in this exact order:

1. Raw trade timeline layer
2. Derived signals
3. Action outcome evaluation
4. Pattern logic
5. Coaching
6. Severity
7. Trader-level intelligence

No skipping layers.

No building ahead.

---

## Current Status

Completed:

* project reset
* new architecture direction
* system blueprint defined

In progress:

* raw trade timeline design

Next step:

* implement raw data types
* implement timeline structure
* validate completeness of raw layer

---

## Final Goal

The final system should be able to say:

* what the trader did
* what the market did
* what decisions helped
* what decisions hurt
* what patterns exist
* what behaviors repeat
* what the trader must improve

With high accuracy and consistency.

---

## Locked Principle

If the raw layer is correct:

everything else becomes easier.

If the raw layer is wrong:

everything else becomes unreliable.

This is why the system is being rebuilt from the ground up.


## below here is appended after the above was already written

## Market Data Provider Boundary

The raw trade timeline system must be built so that market data providers are replaceable.

### Core rule

The raw trade timeline layer must never depend directly on Yahoo-specific response structures.

### Why this matters

Yahoo is the current candle source, but it is not intended to be a permanent architectural dependency.

The system should be designed so that changing market data providers later does not require redesigning the raw timeline layer.

### Required architecture boundary

The system should keep these layers separate:

1. Source data shape  
   This is the provider-specific format returned by an external source such as Yahoo.

2. Canonical internal market data shape  
   This is the system's normalized internal format, such as the `Candle` type.

3. Assembled raw trade timeline  
   This is the raw truth model built from canonical internal data.

### Correct flow

Provider response -> provider adapter/mapper -> canonical internal types -> raw trade timeline builder

Example:

Yahoo response -> Yahoo adapter -> `Candle` -> raw trade timeline system

Later:

Polygon response -> Polygon adapter -> `Candle` -> raw trade timeline system

### What must not happen

The raw trade timeline layer must not:

- use Yahoo field names directly
- depend on Yahoo-specific timestamp quirks
- assume Yahoo-specific optional fields are always present
- mix provider fetching logic with raw timeline assembly logic

### Current design direction

The current rebuild is moving in the correct direction because the raw layer is being built around normalized internal types such as:

- `Candle`
- `Execution`
- `TradeTimelineInput`

rather than around Yahoo response objects.

That makes provider replacement much easier later.

### Future implementation guidance

When provider ingestion is added, it should live in a separate source or adapter layer, not inside the raw trade timeline layer.

Possible future structure:

- `src/lib/market-data-sources/types/`
- `src/lib/market-data-sources/yahoo/`
- `src/lib/market-data-sources/adapters/`

Example future files:

- `map-yahoo-candle-to-canonical-candle.ts`
- `yahoo-candle-adapter.ts`

### Project rule

Yahoo may be the current upstream source, but it must remain an external adapter, not part of the raw timeline foundation.

## writing code
do not use place holders. only use them if absolutley required and if you do use them label them with a comment that they are placeholders.