# Layer 3 File Structure and File Purpose Reference

## Purpose of This Document

This document is the implementation map for Layer 3.

It explains:

1. the current Layer 3 folder structure
2. the purpose of each file
3. what each file is responsible for
4. what each file must not do
5. how Layer 3 data flows from Layer 2 detected patterns into normalized Layer 3 output

This is the Layer 3 companion to the Layer 2 file structure reference.

The architecture document explains what Layer 3 is.
This document explains how Layer 3 is actually organized in code.

---

## Layer 3 Scope

Layer 3 is the Pattern Normalization and Prioritization Layer.

Its job is to consume Layer 2 detected patterns and transform them into a cleaner, prioritized, grouped, and classified output.

Layer 3 does not detect patterns.
Layer 3 does not score trades.
Layer 3 does not coach traders.
Layer 3 does not generate narrative.

Layer 3 sits between:

- Layer 2 Pattern Detection
- Layer 4 Scoring

---

## High Level Layer 3 Flow

Layer 3 works in this sequence:

### Step 1
Layer 2 produces:

`PatternDetectionResult`

### Step 2
Layer 3 reads pattern metadata

This provides:

- specificity
- priority
- default role
- primary eligibility

### Step 3
Layer 3 reads suppression and dominance rules

This provides:

- overlap groups
- richer vs broader pattern relationships
- demotion rules

### Step 4
Layer 3 normalizes the detected patterns

It:

- attaches metadata
- sorts patterns
- applies soft suppression
- classifies patterns
- groups patterns by family

### Step 5
Layer 3 returns normalized output

This output is then ready for later scoring, coaching, and narrative layers.

---

## Recommended Folder Structure

```text
src/lib/pattern-normalization/
  pattern-metadata.ts
  pattern-suppression-rules.ts
  normalize-detected-patterns.ts

src/scripts/
  verify-layer3-pattern-normalization.ts

src/docs/layer3-pattern-normalization/
  layer3-pattern-normalization-architecture.md
  layer3-overlap-suppression-and-family-dominance-plan.md
  layer3-file-structure-reference.md
  sample-normalized-patterns.md


  Part 1: Core Layer 3 Code Files
src/lib/pattern-normalization/pattern-metadata.ts
Purpose

This file defines the metadata Layer 3 uses to understand what each detected pattern means in a normalization context.

It does not normalize patterns by itself.
It does not detect patterns.
It does not score anything.

It provides the structured metadata Layer 3 relies on.

Responsibilities

This file is responsible for defining:

metadata for every implemented pattern
specificity rank
default priority
whether a pattern can be primary
default normalization role
notes for maintainers
Why this file exists

Without this file, Layer 3 logic would need to hardcode pattern importance and specificity all over the place.

That would become messy very fast.

This file gives Layer 3 a centralized pattern knowledge base.

Current key types and structures

This file defines:

NormalizationRole
PatternMetadata
PATTERN_METADATA
PATTERN_METADATA_BY_ID
getPatternMetadata(...)
Allowed to do

This file is allowed to:

describe patterns
define default Layer 3 metadata
centralize importance assumptions
provide lookup helpers
Not allowed to do

This file must not:

detect patterns
suppress patterns
normalize outputs
score trades
coach traders
Important note

This file is intentionally a metadata registry, not a decision engine.

The metadata here may be tuned later, but the file’s role should remain stable.

src/lib/pattern-normalization/pattern-suppression-rules.ts
Purpose

This file defines the explicit overlap and dominance rules Layer 3 uses to demote weaker or broader patterns when stronger patterns are present.

It does not normalize patterns directly.
It defines the rule data the normalization engine uses.

Responsibilities

This file is responsible for defining:

suppression groups
dominance rules
suppression outcomes
rule lookup helpers
Why this file exists

Layer 2 intentionally returns overlapping truths.

Layer 3 needs a centralized and deterministic way to answer:

when two patterns overlap
which one should dominate
how the weaker one should be demoted

This file is that rule source.

Current key types and structures

This file defines:

SuppressionOutcome
PatternDominanceRule
PatternSuppressionGroup
PATTERN_SUPPRESSION_GROUPS
PATTERN_DOMINANCE_RULES
lookup helper functions
Allowed to do

This file is allowed to:

define overlap groups
define richer-over-broader relationships
define soft suppression outcomes
expose rule lookup helpers
Not allowed to do

This file must not:

detect patterns
normalize the final result itself
score anything
access Layer 1 or Layer 2 raw data
Important design rule

This file should remain declarative.

It should define the rules, not execute the whole normalization process.

src/lib/pattern-normalization/normalize-detected-patterns.ts
Purpose

This is the Layer 3 normalization engine.

It consumes Layer 2 detected patterns and produces normalized Layer 3 output.

This is the main engine of Layer 3.

Responsibilities

This file is responsible for:

consuming PatternDetectionResult
attaching metadata to each detected pattern
sorting patterns by deterministic importance rules
applying suppression and demotion
classifying patterns into:
primary
supporting
contextual
grouping normalized patterns by family
returning the normalized result
Why this file exists

This file is the bridge between:

raw truth output from Layer 2
meaningful structured output for later layers

Without this file, the system would only have overlapping raw patterns and no stable way to decide what matters most.

Current key types and structures

This file defines:

NormalizedDetectedPattern
NormalizedPatternResult
normalization helpers
suppression application logic
the exported normalizeDetectedPatterns(...) function
Allowed to do

This file is allowed to:

sort patterns
attach metadata
apply soft suppression
demote overlapping patterns
build grouped outputs
Not allowed to do

This file must not:

re-detect patterns
access raw timeline data
access PatternInput directly
score trades
generate coaching
generate narrative text
Important note

This file is intentionally Layer 3 only.

If this file starts re-detecting patterns or using raw trade data, the architecture is broken.

Part 2: Layer 3 Verification Script
src/scripts/verify-layer3-pattern-normalization.ts
Purpose

This is the reusable verification script for Layer 3.

It lets you run the canonical Layer 2 detected output through the Layer 3 normalization engine and inspect the result.

Responsibilities

This file is responsible for:

loading the canonical Layer 2 detected-pattern file
calling normalizeDetectedPatterns(...)
printing:
primary patterns
supporting patterns
contextual patterns
full prioritized order
grouped family output
primary family anchors
canonical pass/fail regression result
helping validate Layer 3 behavior during development
Why this file exists

Layer 3 needs a stable regression test entry point just like Layer 2.

This script gives you a simple way to confirm:

no unexpected role changes
no broken suppression
no bad ordering changes
Allowed to do

This file is allowed to:

load canonical JSON artifacts
run the Layer 3 engine
print results for human inspection
Not allowed to do

This file must not become the place where normalization logic is implemented.

It is a verification script only.

Part 3: Layer 3 Docs Files
src/docs/layer3-pattern-normalization/layer3-pattern-normalization-architecture.md
Purpose

This file explains the architecture of Layer 3 at a high level.

It defines:

the role of Layer 3
where Layer 3 sits in the system
its inputs
its outputs
what it must do
what it must not do
Role in documentation set

This is the high-level architecture doc for the layer.

src/docs/layer3-pattern-normalization/layer3-overlap-suppression-and-family-dominance-plan.md
Purpose

This file explains the suppression philosophy and dominance plan for Layer 3.

It defines:

overlap suppression philosophy
same-family dominance logic
suppression groups
expected example behavior
current known overlap zones
Role in documentation set

This is the design-plan doc for Layer 3 suppression behavior.

It explains why the suppression rules exist and what they are trying to accomplish.

src/docs/layer3-pattern-normalization/sample-normalized-patterns.md
Purpose

This file freezes the canonical expected normalized output for the current reference sample.

It serves as:

regression anchor
debugging reference
explanation of why the current Layer 3 output is correct
Role in documentation set

This is the canonical expected-output document for Layer 3.

src/docs/layer3-pattern-normalization/layer3-file-structure-reference.md
Purpose

This file explains the Layer 3 implementation map.

It tells future you where everything lives and what each file is for.

Role in documentation set

This is the practical file-by-file reference document for Layer 3.

How Data Moves Through Layer 3
Step 1

Layer 2 produces:

PatternDetectionResult

Step 2

normalize-detected-patterns.ts reads each detected pattern

Step 3

pattern-metadata.ts provides:

specificity
priority
primary eligibility
default role
Step 4

pattern-suppression-rules.ts provides:

overlap groups
dominant pattern relationships
demotion behavior
Step 5

normalize-detected-patterns.ts:

attaches metadata
sorts patterns
applies suppression
assigns normalized role
groups by family
Step 6

Layer 3 returns:

primaryPatterns
supportingPatterns
contextualPatterns
prioritizedPatterns
patternsByFamily
primaryPatternsByFamily
topOverallAnchorPattern

That is the full Layer 3 flow.

`topOverallAnchorPattern` is the single trade-level anchor later layers should prefer when they need one dominant normalized pattern for the trade as a whole.

File Responsibility Rules

This section is important because Layer 3 will grow over time.

Metadata file must describe only

pattern-metadata.ts

Suppression rules file must define only

pattern-suppression-rules.ts

Normalization engine must normalize only

normalize-detected-patterns.ts

Verification script must verify only

verify-layer3-pattern-normalization.ts

Docs files must explain only

src/docs/layer3-pattern-normalization/*.md

If a file starts doing another file’s job, the architecture is drifting.

What to Do When Expanding Layer 3

When Layer 3 grows, the clean process should be:

1. Decide whether the change is metadata, rules, or engine behavior

If it is:

importance tuning → update metadata
overlap logic → update suppression rules
execution of normalization → update normalization engine

Do not mix them casually.

2. Re-run the verification script

Every meaningful change should be checked against the canonical sample.

3. Update the snapshot doc only if the behavior change is intentional

The sample normalized output doc is a lock file in human-readable form.

Do not change it casually.

Current Future-Facing Elements Already Present in Layer 3

Layer 3 already contains several design choices that support future expansion.

Pattern metadata registry

This gives a stable place for:

specificity
priority
primary eligibility
default role
Suppression rule registry

This gives a stable place for:

overlap groups
dominance relationships
demotion rules
Soft suppression model

This preserves truth while reducing redundancy.

Normalized role model

The system already distinguishes:

primary
supporting
contextual

These are important because later layers will rely on them heavily.

What Layer 3 Does Not Yet Fully Own

Layer 3 is functional, but not fully evolved.

The following are future Layer 3 expansion areas:

advanced cross-family suppression
family-level arbitration beyond current simple rules
dynamic or context-aware priorities
conditional suppression logic
dependency graphs between atomic and composite patterns
clustering patterns into richer semantic story groups

These are not required for current Layer 3 correctness.
They are future expansions.

Final Summary

Layer 3 is currently implemented as a clean multi-file system with strict separation of concerns.

It includes:

one metadata registry
one suppression-rules registry
one normalization engine
one verification script
a set of Layer 3 documentation files

This is the correct shape for a serious normalization layer.

It gives the system a stable bridge between:

Layer 2 truth generation
and
Layer 4 scoring

without mixing responsibilities or creating fragile logic.
