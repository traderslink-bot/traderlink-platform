# Layer 2 Pattern Detection Overview

## Purpose

Layer 2 is the Pattern Detection Layer.

Its job is to transform a clean normalized trade level input object into a structured set of detected trading patterns.

This layer does not score trades.
This layer does not coach traders.
This layer does not generate narratives.
This layer does not interpret whether a trader was right or wrong.

Its responsibility is only to answer:

What structural patterns are present in this trade?

Layer 2 is the first layer where the system moves beyond raw factual signals and begins producing reusable behavioral and execution structure outputs.

That said, it still remains strictly non interpretive.

It is a detection layer, not a judgment layer.

---

## Position of Layer 2 in the System

The architecture now looks like this:

### Layer 1
Raw data and signal extraction

### Layer 2
Pattern detection

### Layer 3
Pattern normalization and prioritization

### Future layers
Scoring, coaching, narrative, output shaping

Layer 2 depends on Layer 1.
Future layers will depend on Layer 2.

Layer 2 must never bypass Layer 1 contracts.
Future layers must never bypass Layer 2 contracts.

---

## What Layer 2 Consumes

Layer 2 consumes exactly one input type:

`PatternInput`

This is a normalized contract built from Layer 1 outputs.

Pattern detection is not allowed to access raw timeline data directly.
Pattern detection is not allowed to access raw derived signals directly.
Pattern detection is not allowed to inspect trade timeline internals directly.

All pattern logic must operate only on the `PatternInput` contract.

This rule is one of the most important architecture protections in the project.

It ensures:

1. strict layer separation
2. easier testing
3. easier future refactoring
4. lower risk of cross layer contamination
5. more stable downstream logic

---

## Core Design Principles of Layer 2

## 1. Deterministic only

Every pattern in Layer 2 must be deterministic.

That means:

1. clear thresholds
2. explicit conditions
3. explainable evidence
4. no vague intuition logic
5. no hidden inference
6. no machine learning behavior
7. no fuzzy ranking logic inside detection

If the same input is passed in, the same patterns must always be returned.

---

## 2. No scoring

Layer 2 does not assign points, grades, weights, or penalties.

It does not decide whether a pattern is good or bad.
It only decides whether a pattern is present.

---

## 3. No coaching

Layer 2 does not tell the trader what to improve.
It does not generate lessons, advice, warnings, praise, or action steps.

Coaching belongs to later layers.

---

## 4. No narrative

Layer 2 does not produce summaries like:

good entry
weak exit
chased the move
great trade
poor management

Those are later layer responsibilities.

Layer 2 only emits structural pattern outputs.

---

## 5. Multi pattern truth is allowed

A single trade can legitimately trigger multiple patterns.

For example, a trade can be:

1. scaled into position
2. fully closed
3. high MFE
4. low range entry
5. advantaged entry structure
6. moderate capture exit structure

This is expected and correct.

Layer 2 is allowed to return multiple true patterns at once.

Resolving which patterns matter most is not Layer 2’s job.
That is the purpose of Layer 3.

---

## Layer 2 Main Responsibilities

Layer 2 now performs four major responsibilities:

## 1. Consume normalized trade input

It receives `PatternInput` from the builder layer.

## 2. Evaluate pattern families

It runs all registered pattern definitions against the input.

## 3. Return matched patterns

It returns only patterns whose conditions matched.

## 4. Preserve evidence and thresholds

Each detected pattern includes the factual evidence and thresholds used to trigger it.

This is important because downstream layers need explainable pattern outputs, not black box labels.

---

## Layer 2 Inputs

The contract for Layer 2 is the `PatternInput` type.

At completion of Layer 2, `PatternInput` contains the following major sections.

## Execution structure

Fields describing how many executions occurred and when.

Examples:

1. execution count
2. execution timestamps
3. first execution timestamp
4. last execution timestamp

## Trade structure

Fields describing the full trade length and basic trade span.

Examples:

1. trade duration seconds
2. trade duration minutes
3. trade candle count

## Position behavior

Fields describing how size changed.

Examples:

1. total increase count
2. total decrease count
3. opened from flat
4. closed to flat
5. had multiple increases
6. had multiple decreases
7. max position size
8. final position size

## Price performance

Fields describing favorable and adverse movement.

Examples:

1. entry price
2. exit price
3. trade MFE
4. trade MAE
5. trade MFE percent
6. trade MAE percent
7. peak price during trade
8. worst price during trade

## Entry context

These fields were added during Layer 2 to support entry aware patterns.

Examples:

1. entry position inside the full trade range
2. distance from trade low
3. distance from trade high
4. favorable move remaining after entry
5. adverse move after entry
6. percent of trade MFE still captured from entry onward
7. near trade low boolean
8. near trade high boolean

These fields are structural only.
They do not themselves label the entry as early, late, good, or bad.

## Exit context

These fields were added during Layer 2 to support exit aware patterns.

Examples:

1. realized return percent
2. realized capture percent of full trade MFE
3. favorable excursion left on the table
4. exit position inside full trade range
5. final exit distance from favorable extreme
6. near trade high boolean
7. near trade low boolean

These fields are structural only.
They do not themselves label the exit as disciplined, weak, early, or late.

## Execution quality aggregates

These include execution level aggregates already available from Layer 1.

Examples:

1. max execution MFE percent
2. max execution MAE percent
3. average execution MFE percent
4. average execution MAE percent

## Timing aggregates

Examples:

1. average time between executions
2. min time between executions
3. max time between executions
4. average candles between executions
5. executions per minute

---

## Layer 2 File Structure

Layer 2 now uses a multi file architecture.




src/lib/pattern-input/
  types/
    pattern-input.ts
  builders/
    build-pattern-input.ts

src/lib/pattern-detection/
  detect-patterns.ts
  types/
    pattern-detection-types.ts
  registry/
    pattern-definitions.ts
  patterns/
    execution-frequency-patterns.ts
    position-building-patterns.ts
    position-reduction-patterns.ts
    position-structure-patterns.ts
    trade-duration-patterns.ts
    trade-excursion-patterns.ts
    trade-closure-patterns.ts
    entry-context-patterns.ts
    entry-quality-patterns.ts
    exit-quality-patterns.ts
    scaling-quality-patterns.ts


    