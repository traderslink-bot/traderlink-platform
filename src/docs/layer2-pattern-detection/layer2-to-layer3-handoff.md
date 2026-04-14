# Layer 2 → Layer 3 Handoff

## Purpose of This Document

This document defines the exact handoff between:

Layer 2 Pattern Detection  
and  
Layer 3 Pattern Normalization and Prioritization

Its purpose is to ensure:

1. Layer 3 consumes Layer 2 correctly  
2. Layer 3 does not duplicate or break Layer 2 logic  
3. architectural boundaries remain clean  
4. future layers (scoring, coaching) stay stable  

This is one of the most important contracts in the system.

---

# What Layer 2 Produces

Layer 2 produces:

```ts
PatternDetectionResult

Which contains:

DetectedPattern[]

Each detected pattern has:

{
  patternId: string
  patternName: string
  family: string
  patternType: "atomic" | "composite"
  evidence: Record<string, unknown>
  thresholdsUsed: Record<string, number>
}
Key Characteristics of Layer 2 Output
1. Fully deterministic

Layer 2 output is:

rule-based
threshold-driven
repeatable
explainable via evidence + thresholds
2. Multi-pattern truth

Layer 2 intentionally returns all true patterns

This means:

overlapping patterns are expected
redundant patterns are expected
both atomic and composite patterns can coexist

Example:

low_range_entry
entry_near_trade_low
advantaged_entry_structure
efficient_entry_structure

All of these can be true at the same time.

This is correct behavior.

3. No prioritization

Layer 2 does not decide:

which pattern is most important
which pattern should be shown first
which pattern should be hidden
which pattern should drive scoring
4. No interpretation

Layer 2 does not say:

good trade
bad trade
chased
disciplined
weak execution

It only describes structure.

5. No scoring or coaching

Layer 2 does not:

assign scores
assign grades
generate feedback
generate advice
What Layer 3 Must Do

Layer 3 is responsible for transforming:

DetectedPattern[]

into a structured, prioritized, usable representation.

Core Responsibility

Layer 3 answers:

Out of everything that is true, what actually matters most?

Required Outputs of Layer 3

Layer 3 should produce a normalized structure such as:

{
  primaryPatterns: DetectedPattern[]
  supportingPatterns: DetectedPattern[]
  contextualPatterns: DetectedPattern[]

  patternsByFamily: Record<string, DetectedPattern[]>

  prioritizedPatterns: DetectedPattern[]
  primaryPatternsByFamily: Record<string, DetectedPattern>
  topOverallAnchorPattern: DetectedPattern | null
}

Exact shape may evolve, but these concepts must exist.

What Layer 3 Must Handle
1. Prioritization

Layer 3 must decide importance between patterns.

Key rules:

composite patterns generally outrank atomic patterns
more specific patterns outrank more general patterns
higher-structure patterns outrank low-level facts
2. Overlap resolution (non-destructive)

Layer 2 overlaps must be handled, not removed blindly.

Example:

keep entry_near_trade_low
downgrade low_range_entry

Layer 3 should:

suppress or demote redundant patterns
preserve them as supporting/context if useful
3. Pattern classification

Each pattern should be classified into:

primary
supporting
contextual

This is critical for:

scoring
coaching
narrative generation
4. Family-aware grouping

Layer 3 should group patterns by family:

entry
scaling
exit
structure
excursion

This allows:

per-family prioritization
future scoring by category
clean UI grouping later
5. Ordering

Layer 3 should produce:

a prioritized pattern list (top → bottom importance)

This list will likely drive:

scoring weight
headline logic
coaching focus
What Layer 3 Must NOT Do

This is critical.

1. Must NOT access raw data

Layer 3 must never:

read trade timeline
read executions directly
read candle data

It must only consume Layer 2 output.

2. Must NOT re-detect patterns

Layer 3 must NOT:

recreate detection logic
re-evaluate thresholds
duplicate Layer 2 rules

If something is missing, it belongs in Layer 2.

3. Must NOT score trades

No:

numeric scores
grades
penalties
weighting systems

That is Layer 4.

4. Must NOT generate coaching

No:

advice
corrections
lessons
feedback

That is Layer 5.

5. Must NOT generate narrative text

No:

summaries
headlines
descriptions

That comes later.

Known Overlap Cases Layer 3 Must Handle

These are guaranteed overlap zones from Layer 2.

Entry overlap
low_range_entry
entry_near_trade_low
advantaged_entry_structure
efficient_entry_structure
Exit overlap
moderate_capture_exit_structure
exit_with_meaningful_giveback
exit_near_favorable_extreme
Scaling overlap
scaled_into_position
structured_position_building
balanced_position_management
Structure overlap
multi_build_full_exit
scaled_into_position

Layer 3 must resolve these cleanly without losing signal.

Expected Layer 3 Behavior (Example)

Given Layer 2 output:

low_range_entry
entry_near_trade_low
advantaged_entry_structure
efficient_entry_structure

Layer 3 might produce:

PRIMARY:
advantaged_entry_structure

SUPPORTING:
entry_near_trade_low
efficient_entry_structure

CONTEXTUAL:
low_range_entry

This is the type of transformation expected.

Data Integrity Rules

Layer 3 must preserve:

original patternId
original evidence
original thresholds

Normalization must not destroy traceability.

Design Philosophy for Layer 3

Layer 3 is:

structural interpretation of importance
not behavioral judgment
not scoring
not coaching

It is a filter + organizer layer, not an opinion layer.

Relationship to Future Layers
Layer 4 (Scoring)

Will use:

primary patterns
prioritized patterns
family grouping
Layer 5 (Coaching)

Will use:

prioritized patterns
classification (primary vs supporting)
family context
Layer 6 (Narrative)

Will use:

primary patterns
top prioritized pattern
supporting structure

Layer 3 is the foundation for all of these.

Final Summary

Layer 2 produces:

all structural truths
unfiltered
unordered
overlapping

Layer 3 transforms that into:

prioritized
grouped
classified
structured outputs

without:

scoring
coaching
interpretation

This handoff defines the boundary between:

truth detection
and
importance interpretation
