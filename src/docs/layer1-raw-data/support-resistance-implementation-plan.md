# Support/Resistance Implementation Plan

## Purpose

This document converts the broader support/resistance design into the concrete
implementation plan for this repo.

It answers:

- what Layer 1 should build first
- what new raw outputs should exist
- what belongs in raw-trade-timeline vs PatternInput
- what exact files/modules should be created
- what order we should code this in

This is the coding bridge between:

- `src/docs/support-resistance-plan.md`
- the current Layer 1 raw-trade-timeline system
- future Layer 2 setup and execution-quality patterns

---

## Core Build Strategy

The build should happen in three stages:

1. `trade-relevant context window`
2. `structural level engine`
3. `execution-to-level relation facts`

Do not start by inventing breakout/support-bounce labels.
Those belong later in Layer 2.

Layer 1 should first emit factual structure.

---

## Priority Guardrail

Before deep support/resistance implementation continues, the system should
explicitly confirm that the already-built Layer 1, Layer 2, and Layer 3 lanes do
not depend on hidden provider-specific candle assumptions.

That audit is priority work.

If the existing system needs adjustment to become safely provider-agnostic, that
adjustment should take priority over deeper support/resistance feature growth.

The support/resistance lane should not be built on top of a fragile candle
contract.

Current audit note:

- the broader raw candle contract already looks provider-agnostic
- the first concrete boundary fix was centralizing session-bucket normalization
  so aliases like `open` resolve to canonical internal labels like
  `market_open`
- that normalization now runs in both the top-level raw timeline creator and
  the lower-level timeline builder, so direct Layer 1 entry points do not drift
  from each other
- the normalized Layer 1 session contract is now also typed around canonical
  internal buckets, and unknown provider labels resolve to explicit `unknown`
  instead of silently leaking arbitrary values upward
- that means deeper support/resistance work can continue, but future work
  should keep watching for hidden provider-specific session or availability
  assumptions

---

## Provider-Agnostic Requirement

The support/resistance engine should consume normalized internal candles, not
provider-native payloads.

That means:

- provider-specific fetch logic belongs outside the engine
- rate-limit handling belongs outside the engine
- source-specific session/premarket quirks belong outside the engine
- the engine should receive one normalized candle/session contract

This same discipline should protect existing lanes too.

If a future provider swap would change behavior, the fix belongs in the adapter
or normalization boundary first, not inside setup/pattern logic.

---

## Architectural Split

### Raw Trade Timeline Layer

This layer should build:

- provider-normalized candle/session inputs
- the trade-relevant candle window
- the structural level map
- named reference levels
- dynamic levels
- gap facts
- execution-to-level relation facts

This layer stays factual.

It must not embed Yahoo-specific assumptions or any other provider-specific
behavior as part of its internal truth contract.

### Pattern Input Layer

This layer should expose only the subset of those raw facts that Layer 2 needs
for single-trade detection.

PatternInput should not carry the entire full level map if that would bloat the
 contract too much.
It should carry normalized summary facts for:

- first entry
- adds
- reductions
- final exit
- nearest important structure
- distances to meaningful structure

### Layer 2

Layer 2 should turn those facts into patterns like:

- entry_under_resistance
- entry_far_from_support
- add_into_overhead_resistance
- exit_into_support
- breakout_with_room_above
- breakout_into_stacked_resistance

But not before the raw structure is trustworthy.

---

## New Raw Types To Add

These types should live under `src/lib/raw-trade-timeline/types/`.

### 1. `structural-level.ts`

```ts
export interface StructuralLevel {
  levelId: string;
  price: number;
  side: "support" | "resistance";
  score: number;
  strengthBucket: "strong" | "medium" | "weak";
  timeframeSources: string[];
  pivotSources: Array<"tight_pivot" | "strict_pivot" | "reference_level">;
  touchCount: number;
  touchClusterCount: number;
  reactionStrength: "none" | "weak" | "moderate" | "strong";
  confluenceCount: number;
  isMandatoryAnchor: boolean;
  referenceLabel:
    | "previous_day_high"
    | "previous_day_low"
    | "previous_day_close"
    | "premarket_high"
    | "premarket_low"
    | "premarket_base"
    | null;
  sourcePrices: number[];
}
```

### 2. `dynamic-levels.ts`

```ts
export interface DynamicLevels {
  vwap: number | null;
  ema9: number | null;
  ema20: number | null;
}
```

### 3. `gap-structure.ts`

```ts
export interface GapStructure {
  gapAbove: {
    start: number;
    end: number;
    direction: "up" | "down";
    filled: boolean;
  } | null;
  gapBelow: {
    start: number;
    end: number;
    direction: "up" | "down";
    filled: boolean;
  } | null;
}
```

### 4. `reference-levels.ts`

```ts
export interface ReferenceLevels {
  previousDayHigh: number | null;
  previousDayLow: number | null;
  previousDayClose: number | null;
  premarketHigh: number | null;
  premarketLow: number | null;
  premarketBase: number | null;
}
```

### 5. `execution-level-relation.ts`

```ts
export interface ExecutionLevelRelation {
  executionIndex: number;
  executionTimestamp: string;
  executionPrice: number;
  nearestSupportBelow: StructuralLevel | null;
  nearestResistanceBelow: StructuralLevel | null;
  nearestResistanceAbove: StructuralLevel | null;
  distanceToNearestSupportPct: number | null;
  distanceAboveNearestResistanceBelowPct: number | null;
  distanceToNearestResistancePct: number | null;
  isNearSupport: boolean;
  isNearResistance: boolean;
  clearedNearestResistanceBelow: boolean;
  hasRoomAboveAfterClearingResistance: boolean;
  occurredBelowNearestSupport: boolean;
  occurredInOpenAir: boolean;
  hasNearbyStructureOnBothSides: boolean;
  distanceBetweenNearestSupportAndResistancePct: number | null;
  roomToNearestResistancePct: number | null;
  roomToNearestSupportPct: number | null;
  resistanceLevelsAboveWithinClusterCount: number;
  supportLevelsBelowWithinClusterCount: number;
  hasStackedResistanceAbove: boolean;
  hasStackedSupportBelow: boolean;
  nearestReferenceLevelLabel:
    | "previous_day_high"
    | "previous_day_low"
    | "previous_day_close"
    | "premarket_high"
    | "premarket_low"
    | "premarket_base"
    | null;
}
```

### 6. `structural-context-window.ts`

```ts
export interface StructuralContextWindow {
  firstExecutionTimestamp: string;
  lastExecutionTimestamp: string;
  preEntryContextStartTimestamp: string;
  postExitContextEndTimestamp: string;
  includedTimeframes: string[];
}
```

---

## Raw Build Result Expansion

`RawTradeTimelineBuildResult` should eventually grow to include:

```ts
structuralContextWindow: StructuralContextWindow;
referenceLevels: ReferenceLevels;
dynamicLevels: DynamicLevels;
supportLevels: StructuralLevel[];
resistanceLevels: StructuralLevel[];
gapStructure: GapStructure;
executionLevelRelations: ExecutionLevelRelation[];
hadInsufficientCandleDataForStructure: boolean;
```

This should remain factual.

---

## Minimum PatternInput Additions

PatternInput should not receive the full level map initially.
It should receive normalized, decision-relevant facts.

### First-entry facts

- `firstEntryNearestSupportBelowPrice`
- `firstEntryNearestResistanceBelowPrice`
- `firstEntryNearestResistanceAbovePrice`
- `firstEntryDistanceToNearestSupportPct`
- `firstEntryDistanceAboveNearestResistanceBelowPct`
- `firstEntryDistanceToNearestResistancePct`
- `firstEntryOccurredNearSupport`
- `firstEntryOccurredNearResistance`
- `firstEntryClearedNearestResistanceBelow`
- `firstEntryHadRoomAboveAfterClearingResistance`
- `firstEntryResistanceLevelsAboveWithinClusterCount`
- `firstEntryHasStackedResistanceAbove`
- `firstEntryOccurredBelowNearestSupport`
- `firstEntryOccurredInOpenAir`
- `firstEntryNearestReferenceLevelLabel`

### Add-context facts

- `averageAddDistanceToNearestSupportPct`
- `averageAddDistanceToNearestResistancePct`
- `addsNearSupportCount`
- `addsNearResistanceCount`
- `addsAboveResistanceCount`
- `addsAboveResistanceWithRoomCount`
- `addsBelowSupportCount`
- `averageAddRoomToNextResistancePct`

### Reduction/exit facts

- `finalExitDistanceToNearestSupportPct`
- `finalExitDistanceToNearestResistancePct`
- `finalExitOccurredNearSupport`
- `finalExitOccurredNearResistance`
- `finalExitSupportLevelsBelowWithinClusterCount`
- `finalExitHasStackedSupportBelow`
- `reductionsNearSupportCount`
- `reductionsNearResistanceCount`

### Structure availability facts

- `hadInsufficientCandleDataForStructuralContext`
- `hadSupportResistanceContextAvailable`

### Dynamic-level summary facts

- `firstEntryWasAboveVwap`
- `firstEntryWasBelowVwap`
- `firstEntryDistanceFromVwapPct`
- `firstEntryDistanceFromEma9Pct`
- `firstEntryDistanceFromEma20Pct`

These should be the first PatternInput bridge, not the final full set.

---

## File/Module Plan

### Config

Create:

- `src/lib/support-resistance/config/support-resistance-config.ts`

This should hold:

- merge distance
- touch tolerance
- reaction thresholds
- pivot windows
- ladder coverage settings
- lookback caps

### Candle windowing

Create:

- `src/lib/support-resistance/windowing/build-structural-context-window.ts`

Purpose:

- determine pre-entry, in-trade, and post-exit candle window
- define which candles each timeframe should load

### Reference levels

Create:

- `src/lib/support-resistance/reference-levels/build-reference-levels.ts`

Purpose:

- PDH
- PDL
- previous close
- PMH
- PML
- premarket base

### Dynamic levels

Create:

- `src/lib/support-resistance/dynamic-levels/build-dynamic-levels.ts`

Purpose:

- VWAP
- EMA 9
- EMA 20

### Pivots

Create:

- `src/lib/support-resistance/pivots/detect-tight-pivots.ts`
- `src/lib/support-resistance/pivots/detect-strict-pivots.ts`

### Merge

Create:

- `src/lib/support-resistance/merge/merge-structural-levels.ts`

### Touch/reaction

Create:

- `src/lib/support-resistance/interactions/count-level-touch-clusters.ts`
- `src/lib/support-resistance/interactions/measure-level-reactions.ts`

### Junk filter

Create:

- `src/lib/support-resistance/filtering/filter-spike-only-levels.ts`

### Scoring

Create:

- `src/lib/support-resistance/scoring/score-structural-levels.ts`

### Ladder building

Create:

- `src/lib/support-resistance/ladders/build-support-ladder.ts`
- `src/lib/support-resistance/ladders/build-resistance-ladder.ts`

### Gaps

Create:

- `src/lib/support-resistance/gaps/build-gap-structure.ts`

### Execution relations

Create:

- `src/lib/support-resistance/relations/build-execution-level-relations.ts`

### Orchestrator

Create:

- `src/lib/support-resistance/build-support-resistance-context.ts`

Purpose:

- call all submodules
- return the final factual structural context bundle

---

## Integration Plan With Existing Layer 1

### Step 1

Integrate into raw timeline build result, not directly into PatternInput first.

Why:

- easier to validate the structure engine in isolation
- easier to test the factual output before pattern expansion

### Step 2

Add PatternInput bridge fields only after the raw structural output looks trustworthy.

Why:

- avoids bloating PatternInput with guessed fields too early

### Step 3

Add first Layer 2 consumers:

- `entry_under_resistance_structure`
- `entry_near_support_structure`
- `entry_far_from_support_structure`
- `breakout_with_room_above_structure`
- `add_above_resistance_structure`
- `breakout_into_overhead_resistance_structure`
- `exit_into_support_structure`

These should come after the factual bridge is in place.

---

## Build Order

### Phase 0: Provider-contract audit

Build first:

- inspect current raw candle/session assumptions across existing Layer 1
  builders
- confirm the normalized candle contract is provider-agnostic enough
- identify hidden provider/session-history assumptions
- fix those first if they would make future provider swaps unsafe

Reason:

- existing lanes should remain stable when the provider changes
- support/resistance should build on a trustworthy candle contract
- this is the right time to catch hidden Yahoo assumptions before the new
  structural engine grows around them

### Phase 1: Window and references

Build first:

- structural context window
- reference levels
- dynamic levels

Reason:

- these are simpler
- they create the framing for the rest of the engine

### Phase 2: Horizontal level engine

Build next:

- pivot detection
- merge
- touch counting
- reaction measurement
- spike/junk filter
- scoring

Reason:

- this is the core structural map

### Phase 3: Final ladders and relations

Build next:

- support ladder
- resistance ladder
- gap structure
- execution-level relations

Reason:

- this makes the map useful to the trader-improvement system

### Phase 4: PatternInput bridge

Add:

- first-entry level relation fields
- add/reduction/final-exit relation fields
- structure-availability flags

### Phase 5: First Layer 2 patterns

Only after the above:

- support/resistance-aware entry
- support/resistance-aware breakout
- support/resistance-aware exit

---

## Test Plan

### Unit tests per submodule

We should add focused tests for:

- context window calculation
- reference levels
- pivot detection
- merge logic
- touch cluster logic
- reaction detection
- spike filtering
- scoring
- ladder building
- execution-level relations

### Integration tests

Then add:

- full support/resistance context build from sample candles
- PatternInput bridge tests
- first Layer 2 pattern tests using the new fields

### Key truth tests

Must include cases like:

- breakout with real room above
- breakout directly into stacked resistance
- pullback into support
- buy far above nearest support
- sell into support
- add into resistance
- low-liquidity junk structure that should be filtered

---

## Important Guardrails

### Guardrail 1

Do not let the support/resistance engine invent setup labels.

### Guardrail 2

Do not let executions determine where levels exist.
Executions only determine which candles are most relevant.

### Guardrail 3

Do not push the entire raw level map into PatternInput unless we truly need it.

### Guardrail 4

Preserve insufficient-data handling.
The structural engine must be able to say:

- not enough candle data
- not enough higher-timeframe data
- not enough premarket context

without pretending structure was absent.

### Guardrail 5

Support/resistance should be primary.
EMA/VWAP should remain secondary context, not the replacement for horizontal structure.

### Guardrail 6

Do not let provider-specific details leak upward into Layer 1 structure or
PatternInput contracts.

If a provider swap forces logic changes outside the normalization boundary, that
is a sign the internal candle contract is not clean enough yet.

---

## Best Next Coding Move

The best next implementation move is:

1. audit the current candle/session contract for provider-specific assumptions
2. define the new raw types
3. implement the structural context window builder
4. implement reference levels and dynamic levels
5. add tests for those first

That gives us a clean first slice of the system without overcommitting to the
harder scoring and ladder logic on day one.
