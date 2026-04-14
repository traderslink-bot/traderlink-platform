# Layer 3 Sample Normalized Patterns

## Purpose of This Document

This document freezes the canonical expected Layer 3 normalized output for the current reference sample.

It exists to serve as:

1. a regression reference
2. a debugging anchor
3. a validation target for future Layer 3 changes
4. a clear explanation of why the current normalization result is correct

This file should be updated only when Layer 3 behavior is intentionally changed.

---

# Canonical Input Source

This normalized output was produced from the canonical Layer 2 detected pattern file:

`src/docs/layer2-pattern-detection/sample-detected-patterns.json`

It was verified using the Layer 3 verification script.

---

# Canonical Layer 3 Output Snapshot

## Primary Patterns

1. `advantaged_entry_structure`
2. `moderate_capture_exit_structure`
3. `multi_build_full_exit`
4. `balanced_position_management`

## Supporting Patterns

1. `efficient_entry_structure`
2. `exit_with_meaningful_giveback`
3. `structured_position_building`
4. `entry_near_trade_low`
5. `entry_with_favorable_remaining_upside`
6. `high_mfe_trade`

## Contextual Patterns

1. `low_range_entry`
2. `scaled_into_position`
3. `fully_closed_trade`

---

# Full Verified Output Snapshot

## Primary Patterns

### `advantaged_entry_structure`
- family: `entry_quality`
- patternType: `composite`
- normalizedRole: `primary_candidate`
- defaultPriority: `88`
- specificityRank: `8`

### `moderate_capture_exit_structure`
- family: `exit_quality`
- patternType: `composite`
- normalizedRole: `primary_candidate`
- defaultPriority: `82`
- specificityRank: `7`

### `multi_build_full_exit`
- family: `position_structure`
- patternType: `composite`
- normalizedRole: `primary_candidate`
- defaultPriority: `80`
- specificityRank: `7`

### `balanced_position_management`
- family: `scaling_quality`
- patternType: `composite`
- normalizedRole: `primary_candidate`
- defaultPriority: `79`
- specificityRank: `7`

---

## Supporting Patterns

### `efficient_entry_structure`
- family: `entry_quality`
- patternType: `composite`
- normalizedRole: `supporting_candidate`
- defaultPriority: `82`
- specificityRank: `7`
- suppression:
  - `advantaged_entry_structure -> efficient_entry_structure`

### `exit_with_meaningful_giveback`
- family: `exit_quality`
- patternType: `composite`
- normalizedRole: `supporting_candidate`
- defaultPriority: `74`
- specificityRank: `6`

### `structured_position_building`
- family: `scaling_quality`
- patternType: `composite`
- normalizedRole: `supporting_candidate`
- defaultPriority: `72`
- specificityRank: `6`
- suppression:
  - `balanced_position_management -> structured_position_building`

### `entry_near_trade_low`
- family: `entry_context`
- patternType: `atomic`
- normalizedRole: `supporting_candidate`
- defaultPriority: `65`
- specificityRank: `5`
- suppression:
  - `advantaged_entry_structure -> entry_near_trade_low`

### `entry_with_favorable_remaining_upside`
- family: `entry_context`
- patternType: `atomic`
- normalizedRole: `supporting_candidate`
- defaultPriority: `64`
- specificityRank: `5`
- suppression:
  - `advantaged_entry_structure -> entry_with_favorable_remaining_upside`

### `high_mfe_trade`
- family: `trade_excursion`
- patternType: `atomic`
- normalizedRole: `supporting_candidate`
- defaultPriority: `50`
- specificityRank: `3`

---

## Contextual Patterns

### `low_range_entry`
- family: `entry_context`
- patternType: `atomic`
- normalizedRole: `context_only`
- defaultPriority: `58`
- specificityRank: `4`
- suppression:
  - `entry_near_trade_low -> low_range_entry`

### `scaled_into_position`
- family: `position_building`
- patternType: `atomic`
- normalizedRole: `context_only`
- defaultPriority: `55`
- specificityRank: `3`
- suppression:
  - `multi_build_full_exit -> scaled_into_position`
  - `balanced_position_management -> scaled_into_position`
  - `structured_position_building -> scaled_into_position`

### `fully_closed_trade`
- family: `trade_closure`
- patternType: `atomic`
- normalizedRole: `context_only`
- defaultPriority: `35`
- specificityRank: `2`

---

# Why the Primary Patterns Are Correct

## `advantaged_entry_structure`
This is correctly primary because it is the strongest entry-side pattern in the sample.

It is stronger than:
- `entry_near_trade_low`
- `low_range_entry`
- `entry_with_favorable_remaining_upside`
- `efficient_entry_structure`

Why:
- it is composite
- it is highly specific
- it includes location plus remaining upside plus controlled adverse movement

This is exactly the kind of pattern that should anchor the entry side of the trade.

---

## `moderate_capture_exit_structure`
This is correctly primary because it is the strongest exit-side anchor pattern in the sample.

It is stronger than:
- `exit_with_meaningful_giveback`

Why:
- the exit family should be anchored by capture structure first
- giveback is an important descriptor, but not the main exit-family anchor

This reflects the intended Layer 3 design.

---

## `multi_build_full_exit`
This is correctly primary because it is a richer lifecycle structure than raw build facts.

It is stronger than:
- `scaled_into_position`

Why:
- it describes both how the trade was built and how it finished
- it is composite
- it captures a full lifecycle structure rather than an isolated fact

---

## `balanced_position_management`
This is correctly primary because it is the strongest scaling-quality pattern in the sample.

It is stronger than:
- `structured_position_building`
- `scaled_into_position`

Why:
- it captures both building and reduction behavior
- it is more informative than simple structured building
- it describes the middle-trade management dimension cleanly

---

# Why the Supporting Patterns Are Correct

Supporting patterns remain important but should not dominate the trade story.

## `efficient_entry_structure`
This stays supporting because it is still true and useful, but it is dominated by the richer:
- `advantaged_entry_structure`

## `exit_with_meaningful_giveback`
This stays supporting because it adds useful exit nuance without replacing the exit-family anchor:
- `moderate_capture_exit_structure`

## `structured_position_building`
This stays supporting because it is true, but it is weaker than:
- `balanced_position_management`

## `entry_near_trade_low`
This stays supporting because it adds useful entry-location precision, but it is subsumed by:
- `advantaged_entry_structure`

## `entry_with_favorable_remaining_upside`
This stays supporting because it is a meaningful entry fact, but it is subsumed by:
- `advantaged_entry_structure`

## `high_mfe_trade`
This stays supporting because it provides important trade opportunity context, but it is not the main structural story of the trade.

---

# Why the Contextual Patterns Are Correct

Contextual patterns are still true, but they are too broad or too low-level to lead the output.

## `low_range_entry`
This is contextual because it is broader than:
- `entry_near_trade_low`

## `scaled_into_position`
This is contextual because it is dominated by richer patterns:
- `multi_build_full_exit`
- `balanced_position_management`
- `structured_position_building`

## `fully_closed_trade`
This is contextual because it is a closure state fact, not a high-value structural interpretation.

---

# Family-Level Interpretation of the Canonical Sample

## Entry
The normalized entry story is:

- primary: `advantaged_entry_structure`
- supporting: `entry_near_trade_low`
- supporting: `entry_with_favorable_remaining_upside`
- supporting: `efficient_entry_structure`
- contextual: `low_range_entry`

This is correct because the trade had a strong, low-positioned, opportunity-rich entry.

---

## Exit
The normalized exit story is:

- primary: `moderate_capture_exit_structure`
- supporting: `exit_with_meaningful_giveback`

This is correct because the exit captured a meaningful portion of the move, but still left notable favorable excursion unrealized.

---

## Scaling / Middle Trade
The normalized scaling story is:

- primary: `balanced_position_management`
- supporting: `structured_position_building`
- contextual: `scaled_into_position`

This is correct because the trader both built and reduced position size, which is richer than simple build-only facts.

---

## Lifecycle Structure
The normalized lifecycle story is:

- primary: `multi_build_full_exit`
- contextual: `fully_closed_trade`

This is correct because the lifecycle pattern is richer than raw closure-state facts.

---

## Opportunity Context
The normalized opportunity context is:

- supporting: `high_mfe_trade`

This is correct because the trade had real favorable opportunity, but that fact alone does not define the trade’s main normalized story.

---

# Expected Layer 3 Behavior Principles Confirmed by This Sample

This sample confirms that Layer 3 is currently behaving as intended.

## Confirmed behaviors

1. composite patterns can dominate atomic patterns
2. more specific patterns can demote broader patterns
3. overlapping truths are preserved but reclassified
4. exit capture anchors the exit family
5. lifecycle structure outranks raw build facts
6. scaling quality outranks simple size-building facts
7. contextual facts remain visible without cluttering the primary output

---

# Regression Rule

If future Layer 3 changes cause this sample to normalize differently, that change should be treated as intentional only if:

1. the new behavior is explicitly reviewed
2. the design reasoning is documented
3. this file is updated to match the new intended truth

If not, any unexpected deviation should be treated as a regression.

---

# Final Summary

This canonical sample now demonstrates a clean Layer 3 normalized output.

The final normalized trade story is:

## Primary
- advantaged entry structure
- moderate capture exit structure
- multi-build full exit
- balanced position management

## Supporting
- efficient entry structure
- meaningful giveback on exit
- structured position building
- specific low-entry context
- favorable remaining upside
- strong trade opportunity

## Contextual
- broad low-range entry
- raw scale-in fact
- closure-state fact

This is the Layer 3 reference output that future normalization changes should be compared against.