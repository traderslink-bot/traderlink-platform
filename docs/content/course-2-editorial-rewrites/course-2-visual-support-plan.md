# Course 2 Visual Support Plan

Course: Chart Reading And Market Structure  
Source reviewed: `docs/content/course-2-editorial-rewrites/`  
Purpose: identify where SVGs support learning after the human-teacher editorial rewrite pass.  
Scope: planning only. Do not create SVGs in this pass.

## Guiding Standard

Add or update an SVG only when it teaches a concept faster or more clearly than text.

Good SVG use cases:

- clean versus forced chart examples
- hold versus fail behavior
- old support becoming resistance
- old resistance becoming support
- breakout, breakdown, reclaim, or failed move behavior
- compression versus random chop
- session-level maps such as PDH, PDL, PMH, PML, HOD, and LOD
- gap top, gap bottom, prior close, open, and fill area

Avoid SVGs for:

- FAQ sections
- generic introductions
- simple definitions already clear in text
- repeated warning sections
- purely decorative balance
- every lesson only for visual parity

SVG text rules:

- Use beginner-facing language.
- Do not use buy/sell signal wording.
- Do not use guarantee or prediction wording.
- Do not use internal/system wording.
- Labels should describe behavior, not tell the user what to do.

## Important Content Note

`key-levels-trading.md` was previously reported as missing from `docs/content/course-2-editorial-rewrites/`. The visual plan below assumes the approved human-teacher version is restored or applied. Do not use the older draft copy as the final content baseline.

---

# Lessons That Already Have Enough SVG Support

These lessons already have enough visual support for the current rewritten text. Do not add more SVGs unless a render check finds a specific mismatch.

| Lesson | Existing SVGs to keep | Why enough |
|---|---|---|
| `candlestick-patterns.md` | `candlestick-anatomy-context.svg` | One strong anatomy/context image is enough for the opening candle lesson. More visuals would make the foundation lesson feel crowded. |
| `support-and-resistance.md` | `support-resistance-candlestick-diagram.svg`, `support-breaks-becomes-resistance.svg`, `resistance-breaks-becomes-support.svg`, `bad-support-resistance-example.svg` | Covers basic zones, role reversal both ways, and clutter/forced-level behavior. This is enough. |
| `how-to-draw-support-and-resistance.md` | `support-resistance-zones-vs-lines.svg`, `mark-obvious-reaction-levels.svg`, `near-price-actionable-levels.svg` | Supports the step-by-step process clearly: zones, obvious reactions, and active levels near current price. |
| `support-levels.md` | `support-level-hold.svg`, `support-level-break.svg`, `support-level-reclaim.svg` | Covers the three core support outcomes: hold, break, reclaim. No new SVG needed. |
| `resistance-levels.md` | `resistance-level-rejection.svg`, `resistance-level-break.svg`, `failed-breakout-at-resistance.svg` | Covers resistance rejection, break, and failed breakout. No new SVG needed. |
| `price-rejection.md` | `price-rejection-at-resistance.svg`, `rejection-wick-context.svg` | Covers rejection at a key level and wick context. Enough for the lesson. |
| `breakout-trading.md` | `breakout-with-volume-context.svg`, `failed-breakout-review.svg`, `extended-breakout-chase-risk.svg` | Covers clean breakout, failed breakout, and chase risk. Strong set. |
| `breakdown-trading.md` | `breakdown-with-volume-context.svg`, `failed-breakdown-reclaim-review.svg`, `extended-breakdown-chase-risk.svg` | Covers clean breakdown, failed breakdown, and downside chase risk. Strong set. |
| `level-breakout.md` | `level-breakout-retest-hold.svg`, `level-breakout-failed-hold.svg` | Covers the key lesson concept: what happens after price clears one marked level. Enough. |
| `level-reclaim.md` | `level-reclaim-hold.svg`, `level-reclaim-failure.svg` | Covers reclaim-and-hold versus failed reclaim. Enough. |
| `break-of-structure.md` | `uptrend-structure-break.svg`, `downtrend-structure-break.svg` | Covers structure break in both directions. Enough. |
| `pivot-levels.md` | `pivot-level-reaction-map.svg`, `pivot-failed-reclaim-review.svg` | Covers pivot reaction and failed reclaim/rejection around pivot. Enough. |
| `previous-day-high-low.md` | `previous-day-high-low-map.svg`, `previous-day-high-failed-breakout.svg` | Covers PDH/PDL map and failed PDH breakout. Enough. |
| `premarket-high-low.md` | `premarket-high-low-range-map.svg`, `premarket-high-failed-breakout.svg` | Covers PMH/PML map and failed PMH breakout. Enough. |
| `high-of-day.md` | `high-of-day-level-map.svg`, `high-of-day-failed-breakout.svg` | Covers HOD map and failed HOD breakout. Enough. |
| `low-of-day.md` | `low-of-day-level-map.svg`, `low-of-day-failed-breakdown.svg` | Covers LOD map and failed LOD breakdown. Enough. |
| `new-high-of-day.md` | `new-high-of-day-hold-vs-fail.svg`, `new-high-of-day-chase-risk.svg` | Covers NHOD hold versus fail and repeated alert/chase risk. Enough. |
| `compression.md` | `compression-tightening-range.svg`, `compression-failed-break-review.svg` | Covers tightening range and failed break. Enough. |
| `consolidation.md` | `consolidation-range-map.svg`, `consolidation-failed-range-break.svg` | Covers range map and failed range break. Enough. |
| `gap-fill-trading.md` | `gap-fill-zone-map.svg`, `failed-gap-fill-hold-review.svg` | Covers gap zone and failed/partial gap fill. Enough. |

---

# Existing SVGs That Should Stay But Need A Wording Or Concept Check

These are not rebuild requests. They are render/content checks to make sure the SVG text matches the rewritten lessons.

| SVG | Lesson | Check / possible update |
|---|---|---|
| `candlestick-anatomy-context.svg` | `candlestick-patterns.md` | Confirm the body label says `Body: between open and close` or `Body: open/close range`, not `Body: open to close`. The rewrite uses “body is the area between the open and close.” |
| `key-level-review-workflow.svg` | `key-levels-trading.md` | If the SVG uses heavy “review” wording, soften it to match the newer teacher style. Suggested behavior labels: `Hold`, `Break`, `Reject`, `Reclaim`, `What changed?`. |
| `extended-breakout-chase-risk.svg` | `breakout-trading.md` | Ensure text says `Entry far above level`, `Risk harder to define`, `Next resistance nearby`, not wording that sounds like blame or a trade command. |
| `extended-breakdown-chase-risk.svg` | `breakdown-trading.md` | Ensure text says `Entry far below level`, `Support nearby`, `Risk harder to define`, not “short here” or similar signal wording. |
| `new-high-of-day-chase-risk.svg` | `new-high-of-day.md` | Ensure labels support the rewritten message: `Repeated fresh highs`, `Far from support`, `Volume fading`, `Alert-driven chase risk`. |
| `gap-fill-zone-map.svg` | `gap-fill-trading.md` | Confirm it clearly labels `Prior close`, `Current open`, `Gap area`, `Partial fill`, and `Full fill area` if present. |
| `failed-gap-fill-hold-review.svg` | `gap-fill-trading.md` | Update if needed to avoid “review” heavy wording. Better labels: `Price enters gap`, `Fill stalls`, `Gap midpoint`, `Price holds above area`. |

---

# Lessons That Would Benefit From One New SVG

Only a small number of new SVGs are worth adding. Most rewritten core lessons already have enough visual support.

## 1. `key-levels-trading.md`

### Exact section

Place after the section:

`## A Clean Map Versus A Cluttered Map`

### Teaching goal

Show the difference between a useful level map and a cluttered map. This is one of the most important teaching points in the rewritten Key Levels lesson and is easier to understand visually than through text alone.

### Recommended filename

`public/academy/images/chart-reading/clean-vs-cluttered-level-map.svg`

### Suggested SVG layout

Two side-by-side chart panels.

Left panel title:

`Clean level map`

Left panel labels:

- `Nearest support`
- `Nearest resistance`
- `Current price`
- `Next trouble area`
- `Clear invalidation area`

Right panel title:

`Cluttered level map`

Right panel labels:

- `Too many small levels`
- `Repeated lines inside one zone`
- `Far-away levels`
- `Harder to read`

Footer label:

`A good level map should make price location clearer.`

### Notes

Do not add entry arrows or trade direction signals. This SVG should teach chart cleanliness, not trade action.

---

## 2. `chart-patterns.md`

### Exact section

Place after the section:

`## Clean Patterns Versus Forced Patterns`

### Teaching goal

Show that the same trader can either read a clean structure or force a pattern name onto messy action. This supports the rewritten lesson’s most important idea: structure first, pattern name second.

### Recommended filename

`public/academy/images/chart-reading/clean-vs-forced-chart-pattern.svg`

### Suggested SVG layout

Two side-by-side panels.

Left panel title:

`Clean pattern`

Left panel labels:

- `Clear support`
- `Clear resistance`
- `Visible structure before move`
- `Failure area is easy to see`

Right panel title:

`Forced pattern`

Right panel labels:

- `Messy candles`
- `Unclear levels`
- `Pattern only obvious after move`
- `No clear failure area`

Footer label:

`Name the pattern only after the structure makes sense.`

### Notes

Do not depict a specific pattern unless it is generic enough not to conflict with the deep-dive pattern pages. This should be a concept SVG, not a bull flag or triangle lesson.

---

## 3. `candlestick-patterns.md`

### Exact section

Place after the section:

`## Why Candle Names Can Mislead`

### Teaching goal

Show that the same candle shape can mean different things depending on location. The current anatomy SVG teaches candle parts; this new SVG would teach context.

### Recommended filename

`public/academy/images/chart-reading/same-candle-different-context.svg`

### Suggested SVG layout

Three small panels with the same candle shape in different locations.

Panel 1 title:

`At resistance`

Labels:

- `Same candle shape`
- `Price fails near resistance`
- `Watch follow-through`

Panel 2 title:

`In random chop`

Labels:

- `Same candle shape`
- `No clear level`
- `May be noise`

Panel 3 title:

`At support`

Labels:

- `Same candle shape`
- `Price reacts near support`
- `Next candles matter`

Footer label:

`Candle meaning changes with location.`

### Notes

This SVG should not replace the anatomy SVG. It should support the lesson’s human-teacher point that candle names come after behavior and context.

---

# Lessons Where A New SVG Should Not Be Added

Do not add SVGs to these pages right now, because they are either hub pages or already sufficiently supported.

| Lesson | Reason |
|---|---|
| `candlestick-deep-dive-lessons.md` | Hub page. A visual would be decorative. The grouping text is enough. |
| `chart-pattern-deep-dive-lessons.md` | Hub page. The grouped card layout is the visual structure. Do not add a chart SVG. |
| `support-and-resistance.md` | Already has four SVGs. Adding more would crowd the lesson. |
| `how-to-draw-support-and-resistance.md` | Already has three process SVGs. Enough. |
| `support-levels.md` | Existing hold/break/reclaim set covers the lesson. |
| `resistance-levels.md` | Existing rejection/break/failed-breakout set covers the lesson. |
| `breakout-trading.md` | Existing three-SVG set covers clean breakout, failed breakout, and chase risk. |
| `breakdown-trading.md` | Existing three-SVG set covers clean breakdown, failed breakdown, and chase risk. |
| `level-breakout.md` | Existing two-SVG set covers retest/hold and failed hold. |
| `level-reclaim.md` | Existing two-SVG set covers reclaim hold and failure. |
| `break-of-structure.md` | Existing two-SVG set covers both structure-break directions. |
| `pivot-levels.md` | Existing two-SVG set covers pivot reaction and failed reclaim/rejection. |
| `previous-day-high-low.md` | Existing two-SVG set is enough. |
| `premarket-high-low.md` | Existing two-SVG set is enough. |
| `high-of-day.md` | Existing two-SVG set is enough. |
| `low-of-day.md` | Existing two-SVG set is enough. |
| `new-high-of-day.md` | Existing two-SVG set is enough. |
| `compression.md` | Existing two-SVG set is enough. |
| `consolidation.md` | Existing two-SVG set is enough. |
| `gap-fill-trading.md` | Existing two-SVG set is enough. |

---

# Summary Recommendation

Do not add many new visuals. The rewritten Course 2 core path is already visually supported.

Recommended new SVGs: 3 total.

1. `clean-vs-cluttered-level-map.svg`
2. `clean-vs-forced-chart-pattern.svg`
3. `same-candle-different-context.svg`

Recommended existing SVG wording checks: 7 files.

The best visual upgrade is not quantity. It is alignment: each SVG should match the lesson’s teaching point and make a hard idea easier for a beginner to see.

---

# Suggested Codex Implementation Prompt

```text
Course 2 visual support implementation pass.

Use this plan:
docs/content/course-2-editorial-rewrites/course-2-visual-support-plan.md

Do not create extra SVGs beyond the plan.
Do not add visuals just for decoration.
Do not change lesson content except to insert approved SVG references and image markdown where the plan says.
Do not touch Course 1.

First, fix/confirm the key-levels rewrite issue:
- Ensure docs/content/course-2-editorial-rewrites/key-levels-trading.md exists.
- Ensure academy/key-levels-trading.md uses the approved human-teacher version.
- Ensure it has status: "ready".
- Ensure no Educational Disclaimer exists.

Then implement only these new SVGs:
1. public/academy/images/chart-reading/clean-vs-cluttered-level-map.svg
2. public/academy/images/chart-reading/clean-vs-forced-chart-pattern.svg
3. public/academy/images/chart-reading/same-candle-different-context.svg

Add them to the matching lesson visual_assets and insert the image markdown in the exact sections named in the plan.

Also check/update wording on the existing SVGs listed in the plan.

SVG wording rules:
- beginner-facing language only
- no buy/sell signal wording
- no guarantee/prediction wording
- no internal/system wording
- labels should describe behavior, not action commands

Run:
- npm run validate:academy-registry
- npx tsc --noEmit
- targeted tests if available

Commit only Course 2 Academy visual-support changes.
Commit message:
add course 2 visual support alignment
```
