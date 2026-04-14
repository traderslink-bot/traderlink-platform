# Layer 3 Pattern Normalization and Prioritization Architecture

## Purpose of Layer 3

Layer 3 is responsible for transforming raw detected patterns into a structured, prioritized, and usable representation.

Layer 2 answers:

What is true?

Layer 3 answers:

What matters most?

---

## Position in System Architecture

The system now follows:

### Layer 1
Raw data and signal extraction

### Layer 2
Pattern detection (truth generation)

### Layer 3
Pattern normalization and prioritization (importance structuring)

### Future Layers
- Layer 4: scoring
- Layer 5: coaching
- Layer 6: narrative/output

---

## Inputs to Layer 3

Layer 3 consumes only:

```ts
PatternDetectionResult

Which contains:

DetectedPattern[]

Layer 3 must NOT access:

raw trade timeline
execution events
candle data
PatternInput

Layer 3 is strictly downstream of Layer 2.

Outputs of Layer 3

Layer 3 produces a normalized pattern structure.

Conceptual output:

{
  primaryPatterns: DetectedPattern[]
  supportingPatterns: DetectedPattern[]
  contextualPatterns: DetectedPattern[]

  prioritizedPatterns: DetectedPattern[]

  patternsByFamily: Record<string, DetectedPattern[]>
  primaryPatternsByFamily: Record<string, DetectedPattern>
  topOverallAnchorPattern: DetectedPattern | null
}

This structure will be used by all later layers.

`primaryPatternsByFamily` is especially useful for later scoring, coaching, and UI layers that want one family anchor without re-deriving Layer 3 decisions.

`topOverallAnchorPattern` is the single trade-level anchor later layers should use when they need one dominant normalized pattern for the whole trade.

Core Responsibilities

Layer 3 performs five critical transformations.

1. Prioritization

Layer 3 determines which patterns are most important.

This uses:

patternType (atomic vs composite)
specificityRank
defaultPriority

General rules:

composite > atomic
higher specificity > lower specificity
higher priority score > lower
2. Overlap Resolution

Layer 2 intentionally produces overlapping patterns.

Layer 3 must resolve overlap without deleting information.

Example:

Input:

low_range_entry
entry_near_trade_low
advantaged_entry_structure

Output:

primary: advantaged_entry_structure
supporting: entry_near_trade_low
contextual: low_range_entry
3. Pattern Classification

Each pattern must be assigned a role:

primary
supporting
contextual

Definitions:

primary → main structural signal of the trade
supporting → meaningful but not dominant
contextual → background information
4. Family Grouping

Patterns must be grouped by family:

entry_context
entry_quality
exit_quality
scaling_quality
position_structure
etc.

This allows:

per-family prioritization
structured scoring later
cleaner UI grouping
5. Ordering

Layer 3 produces a fully ordered list:

prioritizedPatterns

Sorted from most important → least important

This will drive:

scoring weights
coaching focus
headline generation
What Layer 3 Must NOT Do

This is critical.

Layer 3 must not:

1. Re-detect patterns

No thresholds, no new detection logic.

2. Access raw data

No timeline, no candles, no executions.

3. Score trades

No numeric scoring or grading.

4. Generate coaching

No advice or feedback.

5. Generate narrative

No summaries or descriptions.

Layer 3 is purely structural prioritization.

Key Concepts Introduced in Layer 3
Pattern Importance

Not all patterns are equal.

Example:

scaled_into_position → low importance
multi_build_full_exit → medium importance
advantaged_entry_structure → high importance

Layer 3 formalizes this.

Specificity

More specific patterns should dominate broader ones.

Example:

entry_near_trade_low > low_range_entry
Composite Dominance

Composite patterns usually represent higher-level structure.

Example:

advantaged_entry_structure > entry_near_trade_low
Non-Destructive Filtering

Layer 3 does NOT delete patterns.

It reclassifies them.

Relationship to Pattern Metadata

Layer 3 relies heavily on:

pattern-metadata.ts

This provides:

specificityRank
defaultPriority
canBePrimary
defaultRole

Layer 3 logic must use metadata, not hardcoded assumptions.

Expected Behavior Example

Layer 2 output:

low_range_entry
entry_near_trade_low
advantaged_entry_structure
efficient_entry_structure

Layer 3 output:

PRIMARY:
advantaged_entry_structure

SUPPORTING:
entry_near_trade_low
efficient_entry_structure

CONTEXTUAL:
low_range_entry
Design Philosophy

Layer 3 is:

structural
deterministic
explainable
metadata-driven

It is NOT:

subjective
heuristic-heavy
scoring-based
narrative-based
Why Layer 3 Matters

Without Layer 3:

scoring becomes noisy
coaching becomes contradictory
narrative becomes unclear

Layer 3 is the foundation of:

clarity
consistency
interpretability
Future Expansion (Layer 3+)

Layer 3 may later expand to include:

suppression groups
pattern dependencies
family-level dominance rules
conflict resolution rules
advanced prioritization tuning

But initial version should remain simple and deterministic.

Final Summary

Layer 2 produces:

all true structural patterns
unfiltered
overlapping

Layer 3 transforms that into:

prioritized
classified
grouped
ordered patterns

This is the bridge between detection and interpretation.
