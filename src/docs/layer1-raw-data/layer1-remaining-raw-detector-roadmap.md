# Layer 1 Remaining Raw Detector Roadmap

## Purpose of This Document

This document is the roadmap for **finishing Layer 1 properly**.

It exists to make sure Layer 1 is completed using the actual standard intended for this project:

- use all meaningful information available from:
  - normalized candle data from the current provider
  - execution data
- derive all meaningful raw detectors and raw event signals we reasonably can
- build them as separate files
- keep them isolated
- make them easier to test and refine one by one
- avoid moving on before Layer 1 is truly finished

This is not a vague brainstorming file.

This is the working checklist for remaining Layer 1 raw detector implementation.

---

# What “Layer 1 complete” means in this project

Layer 1 is complete only when:

1. all meaningful raw detector families that can be built from current data have been identified
2. those detector families have been implemented as separate files
3. each detector emits factual raw outputs only
4. no Layer 1 detector performs scoring, coaching, or narrative interpretation
5. Layer 2 can consume a stable and rich library of raw detector outputs without needing to bypass Layer 1

Layer 1 does **not** need to solve the entire future dream of the system.

It **does** need to extract everything useful we can reasonably derive from the data we already have.

That is the standard.

---

# Data Availability Requirement

Layer 1 also needs an explicit graceful path for **insufficient candle data**.

This matters because some trades will not have enough usable candle context for
honest detection, most commonly because of thin liquidity, missing historical
coverage, or incomplete provider responses.

The system should not treat that as a normal pattern result and it should not
just fail noisily.

Minimum requirement:

1. detect when candle context is missing or insufficient for a detector family
2. return a structured "insufficient candle data" state instead of pretending a
   setup or management signal is simply absent
3. let later layers preserve that distinction so the app can say:
   "there was not enough candle data to evaluate this feedback reliably"
4. keep this separate from true negative detection
   a trade with enough candle data and no signal is not the same as a trade
   where candle analysis was not possible

Implementation note:

- this should likely live as factual Layer 1 availability fields first
- later user-facing language can be built on top of those fields
- thin liquidity is the most likely common cause, but the contract should stay
  broader than liquidity alone

---

# Near-Term Context Priorities

Support / resistance context should be treated as a near-term Layer 1 design
lane, not a vague future enhancement.

Why this matters

It can unlock higher-signal feedback such as:

- buying directly into resistance
- selling into support
- failing to buy near support
- reclaiming or rejecting a meaningful level

Recommended approach

Do a short design pass first and define a small factual contract before
implementation. Avoid hand-wavy "general level" logic.

Provider note

Before deeper support / resistance implementation, confirm the current Layer 1
candle/session contract does not rely on hidden provider-specific assumptions.

If existing lanes need adjustment to become provider-agnostic, that is
immediate priority work and should happen before deeper support / resistance
feature growth.

Preferred build order

1. explicit insufficient-candle-data handling
2. support / resistance factual contract
3. EMA / MA context only after the higher-signal level work is in place

EMA / MA note

EMA / MA context can still be valuable later for trend and extension feedback,
but it is lower priority than support / resistance for the current product.

---

# Current Available Data Sources for Layer 1

At this stage, Layer 1 should assume it has access to:

## 1. Normalized candle data from the current provider

This gives:

- candle timestamps
- open
- high
- low
- close
- volume
- intraday sequence context across candles

This is candle-level structure, not tick-level structure.

Important note:

Layer 1 should depend on an internal normalized candle/session contract, not on
Yahoo-specific payload shape or any other single provider's quirks.

## 2. Execution data

This gives:

- buy and sell actions
- timestamp
- share size
- price
- sequence of executions over time

This is critical because it lets Layer 1 combine:

- what price did
- what the trader did
- when the trader did it

That combination is the basis of real raw behavior detectors.

---

# Layer 1 Design Rule Going Forward

Every remaining Layer 1 detector should be built as its own file.

Examples:

```text
src/lib/raw-trade-timeline/detectors/
  detect-fomo-chase.ts
  detect-early-exit.ts
  detect-green-to-red.ts
  detect-winner-to-loser.ts
  detect-giveback.ts
  detect-bad-readd.ts
  detect-add-into-extension.ts
  detect-add-into-weakness.ts
  detect-add-into-strength.ts
  detect-failed-profit-protection.ts
  detect-weak-loss-containment.ts


Exact folder naming may change, but the structure principle should not.

Each detector file should:

define its own purpose
use raw Layer 1 inputs only
emit factual raw outputs only
remain isolated from unrelated detector families
be testable on its own

This is the correct implementation strategy.

Important Layer 1 Rule

These detector files are allowed to emit:

booleans
counts
normalized percentages
timestamps
event flags
structural classifications

These detector files are not allowed to emit:

score
grade
coaching
narrative
“good” or “bad” trade labels
“disciplined” or “undisciplined” judgment

Layer 1 detects raw structure only.

Status Categories Used in This Roadmap

Each remaining detector family is marked as one of:

Ready to build now

Current Yahoo candle data plus execution data should be enough.

Partially covered already

Some supporting structure already exists, but the dedicated detector file is still missing.

Needs Layer 1 derivation expansion

The source data is likely sufficient, but we still need to derive more raw intermediate facts first.

Not recommended yet

Possible in theory, but likely too weak or too ambiguous with current candle-level granularity.

Remaining Raw Detector Families
1. FOMO Chase Detector
Status

Needs Layer 1 derivation expansion

Why this matters

This is one of the most important trader behavior patterns in the system.

Intended raw meaning

Detect whether an entry or add occurred after a meaningful recent extension rather than from a more stable structural location.

Likely raw signals needed

Examples:

entry occurred near recent local high
entry occurred after a sharp multi-candle run
price was extended relative to recent candle range
limited remaining favorable excursion after entry
immediate adverse movement after entry
execution occurred after acceleration rather than before it
Data sufficiency

Yahoo candles plus execution data should be enough for a candle-structure version of this detector.

It will not be tick-perfect, but it should still be meaningful.

Recommended file

detect-fomo-chase.ts

2. Early Exit Detector
Status

Ready to build now

Why this matters

This is one of the core behavior patterns you repeatedly care about.

Intended raw meaning

Detect when the trader exited while substantial favorable movement still occurred afterward.

Likely raw signals needed

Examples:

final exit happened before later strong favorable movement
realized capture percent of available move was limited
favorable excursion remaining after exit was high
trade had meaningful further move after trader was out
Data sufficiency

Current Yahoo candles plus execution data should be enough.

Recommended file

detect-early-exit.ts

3. Late Exit Detector
Status

Ready to build now

Why this matters

Late exit is the structural counterpart to early exit.

Intended raw meaning

Detect when the trader exited after substantial giveback or after strong opportunity had already collapsed.

Likely raw signals needed

Examples:

meaningful open profit existed before exit
majority of open profit was given back before exit
final exit was materially below best favorable point
exit happened after major collapse from peak
Data sufficiency

Current Yahoo candles plus execution data should be enough.

Recommended file

detect-late-exit.ts

4. Green to Red Detector
Status

Ready to build now

Why this matters

This is a very important raw event transition.

Intended raw meaning

Detect when a trade had meaningful unrealized profit at some point and later ended red.

Likely raw signals needed

Examples:

trade reached positive unrealized PnL
final realized return ended negative
transition occurred after meaningful open profit
Data sufficiency

Current Yahoo candles plus execution data should be enough.

Recommended file

detect-green-to-red.ts

5. Winner to Loser Detector
Status

Ready to build now

Why this matters

This is closely related to green-to-red, but should be its own explicit detector.

Intended raw meaning

Detect when a trade had strong winner characteristics before ending as a loser.

Likely raw signals needed

Examples:

trade MFE reached winner threshold
realized return ended negative
open winner state collapsed before exit
Data sufficiency

Current Yahoo candles plus execution data should be enough.

Recommended file

detect-winner-to-loser.ts

6. Giveback Detector
Status

Partially covered already

Why this matters

Giveback is central to profit-protection behavior.

Intended raw meaning

Detect the degree to which favorable excursion was not converted into realized outcome.

Likely raw signals needed

Examples:

favorable excursion left on table
giveback percent of available MFE
major giveback flag
majority-giveback flag
near-full giveback flag
Current situation

Some supporting structure already exists in later normalized fields, but a dedicated raw Layer 1 detector file is still missing.

Recommended file

detect-giveback.ts

7. Failed Profit Protection Detector
Status

Needs Layer 1 derivation expansion

Why this matters

This is one of the highest-value behavior families in the whole system.

Intended raw meaning

Detect when meaningful open profit existed but the trader did not protect it adequately.

Likely raw signals needed

Examples:

meaningful open profit existed
no meaningful reduction after open profit
major giveback occurred before exit
final exit occurred after collapse from favorable extreme
full winner to flat or red
Data sufficiency

Current Yahoo candles plus execution data should be enough for a strong first version.

Recommended file

detect-failed-profit-protection.ts

8. Weak Loss Containment Detector
Status

Needs Layer 1 derivation expansion

Why this matters

This is the defensive counterpart to failed profit protection.

Intended raw meaning

Detect when adverse movement expanded without adequate defensive action.

Likely raw signals needed

Examples:

meaningful drawdown occurred
full size held during deep adverse move
reduction happened late or not at all
realized loss occurred near worst excursion
drawdown recovery opportunity was not used
Data sufficiency

Current Yahoo candles plus execution data should be enough for a strong first version.

Recommended file

detect-weak-loss-containment.ts

9. Bad Re-Add Detector
Status

Needs Layer 1 derivation expansion

Why this matters

This is one of the important trade-management behavior patterns you have mentioned repeatedly.

Intended raw meaning

Detect when the trader reduced or exited and then re-added under structurally weak conditions.

Likely raw signals needed

Examples:

reduction happened first
later size increase occurred
re-add occurred after weakness, stall, or failed structure
re-add did not occur from a cleaner reset point
re-add happened with limited remaining upside
Data sufficiency

Likely buildable from current data, but needs careful sequence logic.

Recommended file

detect-bad-readd.ts

10. Re-Add After Reduction Detector
Status

Ready to build now

Why this matters

This is a simpler and more factual base detector that can support the more opinionated bad re-add logic.

Intended raw meaning

Detect whether a size increase occurred after one or more meaningful reductions.

Likely raw signals needed

Examples:

reduction event occurred
later increase event occurred
sequence order confirms add-back behavior
Data sufficiency

Current execution data should be enough.

Recommended file

detect-readd-after-reduction.ts

11. Add Into Extension Detector
Status

Needs Layer 1 derivation expansion

Why this matters

This is highly relevant to chase and poor scaling behavior.

Intended raw meaning

Detect when a buy or size increase occurred while price was already extended relative to recent candle structure.

Likely raw signals needed

Examples:

execution occurred after recent sharp run
execution price near local high
distance from recent base or pullback low was large
local candle structure showed stretch or acceleration
Data sufficiency

Current Yahoo candles plus execution data should be enough for a candle-level version.

Recommended file

detect-add-into-extension.ts

12. Add Into Weakness Detector
Status

Needs Layer 1 derivation expansion

Why this matters

This is a high-value scaling behavior detector.

Intended raw meaning

Detect when a size increase occurred while local structure was weakening.

Likely raw signals needed

Examples:

add happened during declining local structure
add happened after failed continuation
add happened while price was below recent favorable reclaim structure
add happened with worsening local momentum
Data sufficiency

Likely buildable from current data, but requires careful local-structure definitions.

Recommended file

detect-add-into-weakness.ts

13. Add Into Strength Detector
Status

Needs Layer 1 derivation expansion

Why this matters

This is the counterpart to add-into-weakness and can help separate constructive vs destructive scaling.

Intended raw meaning

Detect when a size increase occurred while local structure was strengthening.

Likely raw signals needed

Examples:

add happened during continuation
add happened after confirmation or constructive reclaim
add aligned with improving local structure
add occurred before extension became excessive
Data sufficiency

Likely buildable from current data, though definitions must be carefully tuned.

Recommended file

detect-add-into-strength.ts

14. Meaningful Open Profit Existed Detector
Status

Ready to build now

Why this matters

This is a foundational raw detector used by many later behavior families.

Intended raw meaning

Detect whether the trade reached a meaningful unrealized profit state at any point.

Likely raw signals needed

Examples:

MFE reached threshold
open profit zone classification
partial-zone flag
major-zone flag
Data sufficiency

Current data should be enough.

Recommended file

detect-meaningful-open-profit.ts

15. Meaningful Drawdown Existed Detector
Status

Ready to build now

Why this matters

This is the defensive counterpart to meaningful open profit.

Intended raw meaning

Detect whether the trade reached a meaningful unrealized drawdown state at any point.

Likely raw signals needed

Examples:

MAE reached threshold
drawdown zone classification
moderate-zone flag
major-zone flag
Data sufficiency

Current data should be enough.

Recommended file

detect-meaningful-drawdown.ts

16. Exit Near Worst Detector
Status

Ready to build now

Why this matters

This is useful for weak loss containment and panic-exit style raw structure.

Intended raw meaning

Detect when the trader exited close to the worst adverse area of the trade.

Likely raw signals needed

Examples:

exit position near trade low for long
realized loss near worst excursion
little recovery captured before exit
Data sufficiency

Current data should be enough.

Recommended file

detect-exit-near-worst.ts

17. Exit Near Best Detector
Status

Ready to build now

Why this matters

This supports strong exit-quality and profit-protection raw structure.

Intended raw meaning

Detect when the trader exited near the best favorable area reached by the trade.

Likely raw signals needed

Examples:

exit near trade high for long
high realized capture of trade MFE
limited excursion left unrealized
Data sufficiency

Current data should be enough.

Recommended file

detect-exit-near-best.ts

18. Open Profit Collapse Detector
Status

Needs Layer 1 derivation expansion

Why this matters

This is one of the clearest raw structural events behind weak exits and failed profit protection.

Intended raw meaning

Detect when strong unrealized profit existed and then materially collapsed before final exit.

Likely raw signals needed

Examples:

meaningful open profit existed
favorable excursion later decayed materially
final realized result much lower than prior open winner state
Data sufficiency

Current data should be enough.

Recommended file

detect-open-profit-collapse.ts

19. Held Full Size Through Drawdown Detector
Status

Needs Layer 1 derivation expansion

Why this matters

This is a very important raw management behavior.

Intended raw meaning

Detect when size was not reduced despite meaningful adverse movement.

Likely raw signals needed

Examples:

meaningful drawdown existed
no reduction during drawdown zone
full or near-full size remained during deterioration
Data sufficiency

Current data should be enough.

Recommended file

detect-held-full-size-through-drawdown.ts

20. No Reduction After Open Profit Detector
Status

Needs Layer 1 derivation expansion

Why this matters

This is a foundational raw signal for failed profit protection.

Intended raw meaning

Detect when the trade reached meaningful open profit and the trader did not reduce size meaningfully afterward.

Likely raw signals needed

Examples:

meaningful open profit existed
no reduction occurred after profit threshold
later giveback or collapse followed
Data sufficiency

Current data should be enough.

Recommended file

detect-no-reduction-after-open-profit.ts

21. Reduction After Open Profit Detector
Status

Ready to build now

Why this matters

This is the constructive counterpart to no-reduction-after-open-profit.

Intended raw meaning

Detect whether a meaningful reduction occurred after the trade reached meaningful open profit.

Likely raw signals needed

Examples:

open profit threshold reached
reduction occurred afterward
sequence timing confirms profit-aware reduction
Data sufficiency

Current data should be enough.

Recommended file

detect-reduction-after-open-profit.ts

22. Reversal After Entry Detector
Status

Ready to build now

Why this matters

This supports weak-entry and chase-related raw structure.

Intended raw meaning

Detect when price reversed materially against the trader shortly after entry.

Likely raw signals needed

Examples:

first entry followed by immediate adverse move
adverse move threshold hit before meaningful favorable continuation
near-term structure failed quickly
Data sufficiency

Current data should be enough.

Recommended file

detect-reversal-after-entry.ts

23. Limited Upside After Entry Detector
Status

Partially covered already

Why this matters

This supports chase, late entry, and weak entry-quality families.

Intended raw meaning

Detect when little favorable opportunity remained after entry.

Current situation

Some normalized entry-context fields already represent this concept, but a dedicated raw detector file is still missing.

Recommended file

detect-limited-upside-after-entry.ts

24. Strong Upside Remaining After Entry Detector
Status

Partially covered already

Why this matters

This supports constructive entry families.

Intended raw meaning

Detect when substantial favorable opportunity remained after entry.

Current situation

Some normalized entry-context fields already represent this concept, but a dedicated raw detector file is still missing.

Recommended file

detect-strong-upside-remaining-after-entry.ts

25. Overtrading Detector
Status

Not recommended yet

Why this matters

Overtrading is important, but with current data it may be too broad or too dependent on broader session context.

Intended raw meaning

Detect excessive execution frequency or excessive trade activity.

Why not recommended yet

This may require wider session or multi-trade context rather than single-trade-only structure.

This likely belongs later in a cross-trade layer rather than current single-trade Layer 1.

Recommended status

Defer for now.

Priority Order for Completing Remaining Layer 1 Work

This is the recommended build order.

Phase 1: Foundational raw event detectors

Build these first because many later detectors depend on them.

detect-meaningful-open-profit.ts
detect-meaningful-drawdown.ts
detect-reduction-after-open-profit.ts
detect-no-reduction-after-open-profit.ts
detect-open-profit-collapse.ts
detect-reversal-after-entry.ts
detect-exit-near-best.ts
detect-exit-near-worst.ts
Phase 2: High-value behavior detectors

These are closest to the real behavior patterns you care about.

detect-early-exit.ts
detect-late-exit.ts
detect-green-to-red.ts
detect-winner-to-loser.ts
detect-giveback.ts
detect-failed-profit-protection.ts
detect-weak-loss-containment.ts
Phase 3: Re-add and scaling behavior detectors
detect-readd-after-reduction.ts
detect-bad-readd.ts
detect-add-into-extension.ts
detect-add-into-weakness.ts
detect-add-into-strength.ts
Phase 4: Chase and entry behavior refinement
detect-limited-upside-after-entry.ts
detect-strong-upside-remaining-after-entry.ts
detect-fomo-chase.ts
What This Roadmap Implies

This roadmap means:

1. Layer 1 is not fully complete yet

It has a strong foundation, but not a full detector library.

2. We should not move on prematurely again

The remaining Layer 1 detector families should be built before pretending Layer 1 is fully finished.

3. Many of the patterns you care most about are still Layer 1 work first

Especially:

fomo chase
early exit
green to red
winner to loser
giveback
bad re-add
failed profit protection
weak loss containment
4. Separate file design is now mandatory

We should not pile all of this into one giant detector file.

Final Summary

The next proper move for the project is to complete the remaining raw detector families in Layer 1.

This should be done:

one detector family at a time
in separate files
with isolated logic
with deterministic outputs
using current Yahoo candle data plus execution data as fully as possible

This roadmap is the working checklist for that effort.
