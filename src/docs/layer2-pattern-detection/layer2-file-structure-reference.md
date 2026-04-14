# Layer 2 File Structure and File Purpose Reference

## Purpose of This Document

This document is a practical implementation reference for Layer 2.

It explains:

1. the Layer 2 folder structure
2. the purpose of each file
3. how files relate to each other
4. what each file is responsible for
5. what each file must not do
6. how Layer 2 data flows from input contract to detected pattern output

This file is meant to be a technical map of the layer.

It complements the Layer 2 overview document.

The overview document explains what Layer 2 is and why it exists.
This document explains how Layer 2 is actually organized in code.

---

## Layer 2 Scope

Layer 2 includes two major parts:

1. Pattern input preparation
2. Pattern detection

That means Layer 2 is not only the pattern files themselves.
It also includes the contract and builder that prepare the detection input.

So Layer 2 begins when Layer 1 output is converted into `PatternInput`, and it ends when raw detected patterns are returned.

---

## High Level Layer 2 Flow

Layer 2 works in this sequence:

### Step 1
Layer 1 produces raw trade timeline build output

### Step 2
`build-pattern-input.ts` converts Layer 1 output into `PatternInput`

### Step 3
`detect-patterns.ts` runs all registered pattern definitions against that input

### Step 4
all matched patterns are returned as raw detection output

Layer 2 stops there.

Layer 2 does not normalize patterns.
Layer 2 does not prioritize patterns.
Layer 2 does not score.
Layer 2 does not coach.
Layer 2 does not narrate.

---

## Recommended Folder Structure

```text
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

    Part 1: Pattern Input Preparation
src/lib/pattern-input/types/pattern-input.ts
Purpose

Defines the PatternInput contract.

This is the only allowed input type for Layer 2 pattern detection.

Every pattern in Layer 2 must depend only on this contract.

Responsibilities

This file is responsible for:

defining the complete normalized input shape for detection
grouping trade facts into logical sections
protecting the detection layer from raw Layer 1 leakage
expanding the contract when new pattern families genuinely require richer facts
Current Sections in PatternInput

At the current Layer 2 completion point, PatternInput includes:

execution structure
trade structure
position behavior
price performance
entry context
exit context
execution quality aggregates
timing aggregates
Allowed to do

This file is allowed to:

define the interface
organize fields into meaningful sections
include comments describing architectural rules
Not allowed to do

This file must not:

calculate values
interpret values
score trades
detect patterns
reference downstream logic
Why it matters

This file is one of the most important architecture boundaries in the entire project.

If this contract becomes sloppy, the rest of the system becomes unstable.

src/lib/pattern-input/builders/build-pattern-input.ts
Purpose

Builds PatternInput from Layer 1 raw build results.

This is the bridge between Layer 1 and Layer 2.

Responsibilities

This file is responsible for:

reading Layer 1 output
aggregating raw factual signals into normalized pattern fields
calculating entry context fields
calculating exit context fields
preparing a clean single object for detection logic
Examples of what it computes

Examples include:

total increase and decrease counts
max position size
final position size
execution timing aggregates
entry position in trade range
favorable move remaining after entry
realized return percent
realized capture percent of trade MFE
exit position in trade range
Allowed to do

This file is allowed to:

aggregate
normalize
round values
calculate structural percentages
convert Layer 1 raw outputs into cleaner Layer 2 fields
Not allowed to do

This file must not:

detect patterns
assign labels like good entry or weak exit
score anything
generate coaching
generate summary language
Important implementation rule

When a new pattern family needs richer facts, the correct approach is usually:

expand PatternInput
expand build-pattern-input.ts

The correct approach is not to bypass the contract and let pattern files inspect raw Layer 1 objects.

That must never happen.

Part 2: Pattern Detection Core
src/lib/pattern-detection/types/pattern-detection-types.ts
Purpose

Defines the shared types, constants, and threshold collections used by the pattern detection layer.

Responsibilities

This file is responsible for defining and centralizing:

PatternMatchResult
PatternDefinition
DetectedPattern
PatternDetectionResult
PatternType
PATTERN_FAMILIES
THRESHOLDS
Why this file exists

Without this file, pattern files would duplicate:

type definitions
family naming
thresholds
shared architectural conventions

Centralizing these keeps Layer 2 cleaner and more consistent.

Allowed to do

This file is allowed to:

define shared types
define enum-like family constants
define centralized thresholds
include comments about current and future design
Not allowed to do

This file must not:

evaluate patterns
build inputs
normalize outputs
score patterns
suppress overlaps
Important future note

This file already includes patternType, which future proofs Layer 2 for Layer 3 prioritization.

It does not yet implement a dependency graph or suppression system.
That belongs later.

src/lib/pattern-detection/registry/pattern-definitions.ts
Purpose

Assembles all pattern family exports into one registry.

This is the single source of truth for which patterns the engine runs.

Responsibilities

This file is responsible for:

importing family pattern arrays
flattening them into one PATTERN_DEFINITIONS array
controlling overall engine coverage
Allowed to do

This file is allowed to:

import pattern family arrays
concatenate them in the desired order
serve as the central registry
Not allowed to do

This file must not:

contain pattern logic
compute thresholds
normalize output
score patterns
coach traders
Why it matters

This file makes the detection engine easy to maintain.

When a new family is added, it should usually require only:

creating the family file
exporting the family array
registering that array here

That keeps the engine itself simple.

src/lib/pattern-detection/detect-patterns.ts
Purpose

This is the raw detection engine for Layer 2.

It evaluates all registered patterns against a given PatternInput and returns only matched patterns.

Responsibilities

This file is responsible for:

receiving PatternInput
iterating over PATTERN_DEFINITIONS
calling evaluate(input) on each pattern definition
collecting only matched patterns
returning raw detection output
Allowed to do

This file is allowed to:

loop through pattern definitions
collect matched results
construct DetectedPattern output objects
Not allowed to do

This file must not:

rank patterns
suppress overlaps
decide primary vs supporting patterns
score patterns
generate coaching
generate summaries
Why it matters

The engine must remain simple.

If normalization, prioritization, or suppression logic gets added here, the architecture becomes muddled.

That work belongs to Layer 3.

Part 3: Pattern Family Files

Each file in src/lib/pattern-detection/patterns/ should own one conceptual pattern family.

This is a deliberate design decision.

It makes Layer 2:

modular
readable
easier to test
easier to extend
easier to debug

Each file typically exports:

one or more PatternDefinition objects
one family array export used by the registry
execution-frequency-patterns.ts
Purpose

Detects execution pacing extremes.

Current examples
high_frequency_execution
low_frequency_execution
Notes

This family currently emits only notable edge states.
It does not emit an explicit neutral frequency state.

This was a deliberate decision to avoid noise.

Future possibility

This family may later evolve into full state coverage by adding a normal frequency pattern.

position-building-patterns.ts
Purpose

Detects isolated size building facts.

Current examples
scaled_into_position
single_build_position
Notes

These are atomic patterns.
They describe narrow facts about how position size was built.

They do not describe the full trade lifecycle.

position-reduction-patterns.ts
Purpose

Detects isolated size reduction facts.

Current examples
scaled_out_of_position
Notes

This family is atomic.
It captures whether meaningful reduction behavior occurred.

position-structure-patterns.ts
Purpose

Detects higher-order position lifecycle structure.

Current examples
aggressive_scale_in
passive_scale_in
single_build_full_exit
multi_build_full_exit
multi_build_partial_exit
scale_in_then_reduce
one_and_done_round_trip
Notes

These are composite patterns.

They combine multiple structural facts to describe the overall shape of the trade.

They currently evaluate directly from PatternInput.

They are not yet derived from atomic pattern outputs.

That distinction is important and intentional.

trade-duration-patterns.ts
Purpose

Detects notable duration states.

Current examples
quick_trade
extended_trade
Notes

These are atomic edge-state patterns.

A neutral duration state is not explicitly emitted.

Future expansion may add a normal duration state if useful.

trade-excursion-patterns.ts
Purpose

Detects notable favorable and adverse movement conditions.

Current examples
high_mfe_trade
high_mae_trade
Notes

These are atomic patterns.
They provide raw structural information about excursion size.

trade-closure-patterns.ts
Purpose

Detects final closure state.

Current examples
fully_closed_trade
partial_position_left
Notes

These are atomic patterns.
They describe how the trade ended, not how good the ending was.

entry-context-patterns.ts
Purpose

Detects where the first entry occurred within the eventual trade structure.

Current examples
low_range_entry
high_range_entry
entry_near_trade_low
entry_near_trade_high
entry_with_favorable_remaining_upside
entry_with_limited_remaining_upside
Notes

These are atomic patterns.

They do not yet imply full market structure concepts like:

breakout entry
breakout chase entry
pullback entry
reclaim entry

Those richer setup labels now live in `entry-quality-patterns.ts`, not in the
atomic entry-context file.

entry-quality-patterns.ts
Purpose

Detects higher-order structural quality of the first entry.

Current examples
advantaged_entry_structure
disadvantaged_entry_structure
efficient_entry_structure
inefficient_entry_structure
Notes

These are composite patterns.

They combine:

range position
remaining favorable move
post-entry adverse movement

They still remain structural rather than judgmental.

exit-quality-patterns.ts
Purpose

Detects higher-order structural quality of the final exit.

Current examples
high_capture_exit_structure
moderate_capture_exit_structure
low_capture_exit_structure
exit_with_limited_giveback
exit_with_meaningful_giveback
exit_near_favorable_extreme
Notes

These are composite patterns.

They focus on final exit quality using:

realized capture percent
favorable excursion left unrealized
exit location in the trade range

They do not yet capture detailed partialing or reduction-aware management behavior.

scaling-quality-patterns.ts
Purpose

Detects higher-order quality of size building and management through the middle of the trade.

Current examples
structured_position_building
balanced_position_management
one_sided_aggressive_building
underutilized_position_building
Notes

These are composite patterns.

They are the first version of scaling quality using currently available fields.

They do not yet detect:

add into strength
add into weakness
late adds
add into extension
add after failure

Those require richer future context.

How Data Moves Through Layer 2
Step 1

Layer 1 builds raw trade timeline output

Step 2

build-pattern-input.ts converts Layer 1 output into PatternInput

Step 3

detect-patterns.ts receives the PatternInput

Step 4

the engine loads PATTERN_DEFINITIONS from the registry

Step 5

each pattern definition evaluates against PatternInput

Step 6

matched patterns are converted into DetectedPattern objects

Step 7

raw detected pattern output is returned

That is the complete Layer 2 flow.

No ranking or prioritization happens inside this flow.

File Responsibility Rules

This section is important because Layer 2 must remain clean as more families are added.

Contract files must define shape only

pattern-input.ts

Builder files must compute normalized facts only

build-pattern-input.ts

Type files must centralize shared interfaces and constants only

pattern-detection-types.ts

Registry files must assemble pattern definitions only

pattern-definitions.ts

Engine files must detect only

detect-patterns.ts

Pattern family files must evaluate only their own family logic

patterns/*.ts

If a file starts doing another file’s job, the architecture is drifting.

What to Do When Adding a New Pattern Family

When a new family is needed, the correct process is:

1. Decide whether current PatternInput supports it honestly

If yes:

create the new family file
add pattern definitions
register the family

If no:

expand PatternInput
expand build-pattern-input.ts
then build the family
2. Keep the family self-contained

Each family should own its own thresholds, comments, and pattern exports as much as possible, while shared thresholds remain centralized when helpful.

3. Register it in one place

Add the new family array to pattern-definitions.ts

4. Do not add normalization behavior inside the family file

Family files are detection only.

Current Future-Facing Elements Already Present in Layer 2

Layer 2 includes several things that are already in place to support future work.

patternType

This was added now so later layers can distinguish atomic vs composite patterns cleanly.

PATTERN_FAMILIES

Family names are already centralized to support family-aware grouping later.

THRESHOLDS

Shared thresholds are already centralized in the shared types file where useful.

Entry context fields

These were added to support richer entry-aware patterns later.

Exit context fields

These were added to support richer exit-quality logic later.

These are not incomplete hacks.
They are deliberate future-safe design decisions already integrated into the layer.

Important Things Layer 2 Does Not Yet Own

This should stay very clear.

Layer 2 does not own:

pattern prioritization
overlap suppression
primary vs supporting classification
scoring
coaching
narrative generation
final display logic

Those belong to later layers.

The most immediate next layer is Layer 3 normalization and prioritization.

Practical Example of How This Structure Helps

A trade may detect all of the following at once:

low_range_entry
entry_near_trade_low
advantaged_entry_structure
efficient_entry_structure

That is fine in Layer 2.

Because Layer 2’s job is to preserve structural truth.

Later, Layer 3 can decide something like:

primary: advantaged_entry_structure
supporting: entry_near_trade_low
contextual: low_range_entry

That is exactly why Layer 2 file responsibilities must remain strict.

Final Summary

Layer 2 is implemented as a clean multi-file system with strict separation of concerns.

Its structure currently includes:

one input contract
one builder
one shared type file
one registry
one engine
multiple family-specific pattern files

This is the correct shape for a serious detection layer.

It keeps the architecture scalable, testable, and understandable.

It also prepares the system cleanly for Layer 3 without forcing later rewrites.
