# Trader Intelligence Support/Resistance Plan

## Purpose

This document is the implementation contract for support/resistance context in
this system.

Its job is not to produce pretty chart levels for traders.
Its job is to give the Layer 1 -> Layer 2 -> Layer 3 pipeline a reliable
structural map so the app can judge trader decisions against actual price
structure.

This module should help the system answer questions like:

- did the trader buy directly under resistance?
- did the trader short directly into support?
- did the trader enter too far from support?
- did the trader chase after price had already broken through resistance and extended?
- did the trader buy on a real breakout or into unresolved overhead resistance?
- did the trader enter during a clean pullback into support?
- did the trader exit into support or resistance?
- was the add made into strength, into weakness, or into overhead structure?
- was the trade initiated in a structurally dangerous location?

The output must be machine-usable structural context, not display-oriented chart annotations.

---

## Market Data Source Constraint

This system must assume the candle source can change.

Yahoo may be the current provider, but it should not become an architectural
assumption inside the support/resistance engine or the rest of Layer 1.

The correct model is:

- provider adapters fetch provider-specific candle/session data
- provider adapters normalize that data into one internal candle contract
- Layer 1 structural analysis consumes only the normalized contract

That means support/resistance, breakout, reclaim, mean-reversion, opening-range,
and other setup logic should not depend on:

- Yahoo-specific field names
- Yahoo-specific timestamp/session behavior
- Yahoo-specific premarket coverage assumptions
- provider-native EMA/VWAP fields
- one provider's rate-limit or fetch pattern

This matters for both new work and existing lanes.

Support/resistance should be built against the normalized candle contract, not
against the current provider.

---

## Core Principle

The level engine must be:

- candle-derived
- execution-aware for relevance
- execution-independent for structure

That means:

1. executions help define the relevant analysis window
2. candles define the structural map
3. the system then compares each execution to that structural map

The engine should not "discover levels around the trader's executions" in a way
that biases the structure toward what the trader happened to do.

Instead, it should:

- build the best factual map from candles in the relevant context window
- then measure each execution against that map

This is the cleanest way to keep support/resistance honest.

---

## Role In This Repo

This module should become a Layer 1 structural context engine that feeds later
analysis.

It should support downstream logic such as:

- entry under resistance
- entry into support
- entry far from nearest support
- breakout through resistance
- failed breakout entry
- late extension entry
- support bounce entry
- add into overhead supply
- exit into obvious support or resistance
- poor reward-to-risk entry structure

Important separation:

- the level engine returns structural facts
- Layer 2 turns those facts into setup and behavior patterns
- Layer 3 arbitrates overlap and hierarchy

The level engine itself should not be the place that invents final setup labels.
It also should not be the place that understands provider-specific fetching,
rate limits, or source quirks.

---

## Design Philosophy

The system should behave like a trader reading a chart, but in a deterministic
and machine-usable way.

It should:

- detect meaningful support and resistance from multiple timeframes
- merge nearby overlapping structure
- score level quality
- remove weak or junk levels
- preserve meaningful anchors
- expose execution-to-level relationships explicitly

It should not:

- dump every swing high and swing low
- treat all levels equally
- become a prediction engine
- become a setup classifier by itself
- rely on chart rendering logic to be useful
- depend on one provider's quirks to stay correct

This module is about:

- structural map
- execution location context
- distance-to-level context
- support/resistance interaction context
- reference-level context
- dynamic-level context

---

## Scope For This System

The initial implementation for this repo should include:

### Horizontal structure

- support levels
- resistance levels
- higher-timeframe swing levels
- intraday actionable levels

### Named reference levels

- previous day high
- previous day low
- previous day close
- premarket high
- premarket low
- premarket base when it can be detected objectively

### Dynamic levels

- intraday VWAP
- intraday EMA 9
- intraday EMA 20

### Gap structure

- nearest meaningful gap above
- nearest meaningful gap below
- gap boundaries
- fill status

### Structural metadata

- level type
- timeframe source
- touch count
- reaction strength
- strength bucket
- confluence

### Execution relation output

For every relevant execution event:

- nearest support below
- nearest resistance above
- distance to support
- distance to resistance
- whether entry/add/reduction/exit occurred into, through, above, below, or between meaningful levels

This last piece is required.
The system does not just need levels.
It needs execution-to-level relationships.

---

## Timeframes To Use

The chart should be read in layers.

### Higher-timeframe structure

Used for the major structural map:

- daily
- 4 hour

### Trade-timeframe structure

Used for actionable execution context:

- 1 hour
- 30 minute
- 15 minute

### Lower-noise policy

`5 minute` should not be part of the main structural map at first.
It is too noisy for the primary level engine and is better treated later as
execution-timing refinement, not primary structure.

### Session reference context

- previous trading day
- current premarket session
- current market-open session

### Dynamic levels basis

- intraday session candles for VWAP and EMAs

---

## Windowing Strategy

This is the key system-specific design choice.

The engine should not use a single rigid chart window.
It should build a relevant structural context window around the trade.

### Core trade window

- first execution timestamp
- last execution timestamp

### Pre-entry context window

Look back before the first execution far enough to understand:

- nearby support and resistance
- recent breakouts / reclaims
- premarket and prior-day reference levels
- whether price was already extended before entry

### Post-exit context window

Look beyond the final execution far enough to understand:

- whether the exit happened into support or resistance
- whether price immediately rebounded or broke down through a level
- whether a supposed breakout actually failed after exit

### Higher-timeframe lookback

Daily and 4h structure should use adaptive lookback:

- search recent structure first
- expand until enough meaningful levels exist
- stop at configured maximum lookback

### Practical rule

Executions define relevance.
Candles define structure.

That is the operating principle this implementation should follow.

---

## Dual Pivot System

The engine should use a dual pivot system.

### Tight pivots

Purpose:

- detect short-term actionable structure

Definition:

- pivot high: higher than 2 candles before and after
- pivot low: lower than 2 candles before and after

Use cases:

- nearby support
- nearby resistance
- local breakout points
- local pullback support

### Strict pivots

Purpose:

- detect stronger and more confirmed structure

Definition:

- pivot high: higher than 3 candles before and after
- pivot low: lower than 3 candles before and after

Use cases:

- major resistance
- major support
- stronger swing anchors
- bigger structural shelves

These categories are internal logic only.
They do not need to be user-facing.

---

## Merge Logic

Raw pivots will create too many nearby levels.

Nearby levels should be merged into zones using a configurable distance rule.

Current default candidate:

- `1.5%`

But this should be treated as a starting default, not a permanent truth.
Some symbols will likely need later refinement using volatility-aware logic.

The merged level should retain:

- contributing source prices
- contributing timeframes
- contributing pivot types
- touch evidence
- source count

Merged zones are preferable to pretending every nearby pivot is a distinct level.

---

## Touch Definition

A level counts as touched when price interacts with it within a configurable tolerance.

Current default candidate:

- `+/- 0.5%`

Use:

- highs and lows
- not just closes

Also required:

- anti-double-count logic for clustered candles around the same level

This should count interaction clusters, not inflate touch count from one noisy stall.

---

## Reaction Definition

A level only matters if price actually reacted to it.

Current default candidate for strong reaction:

- price moves at least `1.5%` away from the level
- within the next `1 to 5 candles`

This should work for:

- resistance rejection
- support bounce

Later refinements may add:

- wick rejection quality
- reversal speed
- volume response

But the base rule should stay deterministic.

---

## Spike/Junk Filter

This is especially important for small-cap and thin-liquidity names.

A level should be penalized or removed when it was created by a fast move with
no real structure around it.

Current candidate junk rule:

- price moved more than `3%` in `3 candles or fewer`
- and the level has only one touch
- and there is no strong reaction
- and there is no nearby consolidation support

Premarket-only levels that never matter later should also be penalized.

Purpose:

- remove fake structure
- avoid thin-liquidity junk
- avoid treating vertical movement as strong chart structure

---

## Level Scoring

Each merged level should receive a score.

### Positive scoring factors

Pivot strength:

- strict pivot: `+2`
- tight pivot: `+1`

Touch count:

- 2 touches: `+1`
- 3 or more touches: `+2`

Reaction strength:

- strong reaction: `+2`
- moderate reaction: `+1`

Timeframe weight:

- daily: `+2`
- 4h: `+2`
- 1h / 30m: `+1`
- 15m: low positive weight only

Confluence:

- multiple confirming sources: `+2`

Volume confirmation:

- elevated volume at the level: `+1`

### Negative scoring factors

- premarket-only weak level: `-2`
- spike-only: `-2`
- single weak touch: `-1`
- weak reaction: `-1`

This score should drive:

- keep / demote / drop behavior
- strength bucket assignment
- confluence confidence

---

## Strength Buckets

### Strong

Score `7+`

Use:

- always keep
- treat as reliable structural map

### Medium

Score `4 to 6`

Use:

- keep when useful for continuity or nearby actionable structure

### Weak

Score `0 to 3`

Use:

- usually remove
- only preserve when special anchor rules require it

The filtering style should stay clean and strict by default.

---

## Resistance Ladder Rules

The engine should build a resistance ladder above the relevant execution or reference price.

Current default idea:

- keep meaningful resistance until the ladder covers about `50%` above price

This is not a fixed-count system.

Priority:

1. strong levels
2. medium levels when useful for continuity
3. weak levels usually excluded

If a strong level sits just outside the configured boundary, the engine may keep it.

This ladder is for questions like:

- did the trader buy directly under overhead resistance?
- was there room above the breakout?
- was price moving into stacked resistance?
- was there open air above?

---

## Support Ladder Rules

Support should be more anchor-aware and more protective.

The engine should return meaningful support below price and always preserve key
downside anchors when relevant.

Priority:

1. strong support
2. medium support when useful
3. mandatory anchors even if score alone is not high

Mandatory support anchors when relevant:

- previous close
- previous day low
- premarket base
- major daily support
- key unwind level

This is important because downside structure often matters more for trader
feedback than upside structure once risk is on.

---

## Named Reference Levels

These should always be computed explicitly.

### Previous day references

- previous day high
- previous day low
- previous day close

### Premarket references

- premarket high
- premarket low
- premarket base when objective criteria are met

These references may also qualify as actual kept levels in the support/resistance ladder.
Even when not promoted into the final ladder, they should still be returned as named structural references.

---

## Dynamic Levels

Dynamic levels should be returned separately from horizontal levels.

Include:

- VWAP
- EMA 9
- EMA 20

These are useful for execution context, but they should not be confused with
horizontal support/resistance.

Examples of downstream use:

- trader entered above or below VWAP
- trader bought extended above EMA 9
- trader bought below EMA 20 into weak structure
- trader reclaimed VWAP before entry or failed to do so

EMA/MA context is useful, but still secondary to support/resistance in this system.

---

## Gap Handling

Gaps should be tracked separately.

Return:

- nearest meaningful gap above
- nearest meaningful gap below
- gap start
- gap end
- gap direction
- fill status

Gap boundaries may later influence level scoring, but they should still remain
a separate output section in the base engine.

---

## Required Machine-Usable Output

The engine should return structured objects, not strings.

### For each selected horizontal level

- price
- side: support or resistance
- timeframe sources
- pivot sources
- touch count
- reaction strength
- strength bucket
- confluence
- score
- label if confidently assigned
- whether it is a mandatory anchor
- whether it came from named reference structure

### For dynamic levels

- VWAP
- EMA 9
- EMA 20

### For reference levels

- PDH
- PDL
- previous close
- PMH
- PML
- premarket base when valid

### For gaps

- gap above
- gap below
- fill status
- boundaries

### For execution relations

For each execution:

- nearest support below
- nearest resistance above
- distance to nearest support
- distance to nearest resistance
- whether execution occurred near support
- whether execution occurred near resistance
- whether execution occurred through a level
- whether execution occurred beyond a level
- whether execution occurred in open air

This execution relation output is mandatory for this system.

---

## How This System Should Use The Engine

The engine feeds structural facts into later execution-analysis logic.

Examples of downstream entry questions:

- was the entry under resistance?
- was the entry directly into support?
- was the entry above VWAP or below VWAP?
- was the entry far from nearest support?
- was the entry after a breakout through resistance?
- was the breakout clean or into stacked overhead structure?
- was the entry already extended from the last meaningful support?

Examples of downstream add questions:

- was the add made under resistance?
- was the add made into weakness?
- was the add made into support or after support failed?
- was the add made after price lost VWAP or EMA structure?

Examples of downstream exit questions:

- did the trader sell into support?
- did the trader fail to exit before known resistance?
- did the trader take profit into logical resistance?
- did the trader give back into a known support breakdown?

Examples of downstream trade narrative questions:

- clean breakout through resistance
- late buy under overhead resistance
- pullback entry into support
- chased extension away from support
- entry into thin structure with no nearby support
- failed breakout entry with nearby overhead supply

Again:

- the level engine provides factual structure
- later pattern modules decide what those facts mean

---

## Internal Module Design

The implementation should be split into clean modules.

### Config module

- thresholds and rules

### Market data input module

- collect and normalize required candles by timeframe

### Context window module

- define the trade-relevant candle window from first execution, last execution,
  pre-entry context, post-exit context, and higher-timeframe lookback rules

### Reference levels module

- compute named reference levels

### Dynamic levels module

- VWAP and EMAs

### Pivot detection module

- tight and strict pivots

### Merge module

- combine nearby candidate levels

### Touch/reaction module

- measure real interaction with levels

### Spike filter module

- penalize or remove junk structure

### Scoring module

- assign numeric score and strength bucket

### Ladder builder module

- construct final support and resistance ladders

### Support anchor module

- force important downside anchors into the final support map when needed

### Gap module

- detect and summarize gaps

### Execution relation module

- compare each execution to the final structural map

This last module is essential for this repo.

---

## Processing Flow

1. build the relevant candle window around the trade
2. load candles for:
   - daily
   - 4 hour
   - 1 hour
   - 30 minute
   - 15 minute
   - intraday session
3. compute named reference levels
4. compute dynamic levels
5. detect pivot candidates
6. split pivot candidates into support/resistance candidates
7. merge nearby levels
8. count touches
9. measure reactions
10. detect spike-only junk
11. score levels
12. build resistance ladder
13. build support ladder with anchor logic
14. detect gaps
15. compute execution-to-level relationships
16. return a structured structural-context result

---

## Configuration Surface

These settings should be centralized and tunable:

- resistanceCoveragePercent
- mergeDistancePercent
- touchTolerancePercent
- strongReactionPercent
- spikeMovePercent
- spikeWindowCandles
- tightPivotWindow
- strictPivotWindow
- includeMediumStrengthLevels
- maxLookbackByTimeframe
- supportAnchorBehavior
- enableGapDetection
- enablePremarketBaseDetection

These should be treated as configurable defaults, not universal market truth.

---

## What This Engine Should Not Do

To keep the contract clean, this engine should not do:

- price prediction
- target forecasting
- full market-structure state modeling
- breakout success probability scoring
- setup naming by itself
- coaching language generation

Those belong downstream.

This engine's job is:

- clean structural map
- dynamic context
- reference anchors
- gap context
- execution-to-level relations
- machine-usable structure

---

## Downstream Integration Targets

The best next consumer after this engine is a relation-driven execution analysis layer.

That layer should eventually emit facts like:

- entryUnderResistance
- entryIntoSupport
- entryFarFromSupport
- entryAfterBreakout
- lateBreakoutEntry
- breakdownEntry
- addIntoResistance
- addIntoSupportFailure
- exitIntoSupport
- exitIntoResistance
- extendedFromVWAP
- extendedFromEMA9
- extendedFromEMA20

These are the facts Layer 2 can later compose into richer named trade behaviors.

---

## Final Implementation Guidance

This plan came from a broader system that can display levels directly to traders,
but in this repo the priority is different.

Here, the engine should be built for:

- internal structural accuracy
- execution-context analysis
- downstream pattern detection

not for chart-display completeness.

The best implementation path is:

1. build the trade-relevant context window contract
2. build the factual level engine
3. build execution-to-level relation output
4. only then promote those facts into new Layer 2 setup and management patterns

That is the plan this repo should actually code against.
