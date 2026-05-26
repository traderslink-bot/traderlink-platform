# TradersLink Academy Production Content Model Plan

Date: 2026-05-18

Status: planning complete

Scope: Academy course membership, cross-listed lesson navigation, progress tracking, path hubs, and route-safe app bridge data

This is a planning document only. Do not create production routes, React components, JSX, CSS, schemas, Next.js pages, database tables, or generated registries from this document unless the user explicitly asks for implementation.

## Purpose

The Academy content is now ready enough to plan the production content model.

The main product problem is not lesson content anymore. The main product problem is how the website will know:

- Which lessons belong to each course.
- Which lessons are canonical versus cross-listed.
- Which previous/next links should show in each course context.
- How user progress is counted.
- How path hubs aggregate lessons without becoming numbered courses.
- Where app bridge cards can appear later without hardcoding unstable app routes.

The production model should let the future UI render `/academy` as a structured learning product while keeping markdown lessons as the single source of truth for educational content.

## Core Decision

Use a separate **Academy Course Membership layer** instead of relying only on each lesson's frontmatter.

Reason:

- A lesson can belong to more than one course or path.
- A lesson should still have one canonical owner.
- Previous/next navigation can differ depending on where the learner entered.
- Progress should count once per lesson slug but appear in every course/path where that lesson is displayed.
- Path hubs need to aggregate lessons from multiple courses without duplicating content.

Recommended hierarchy:

```text
Academy
  Course
    Module
      Course Lesson Membership
        Canonical Lesson Markdown
  Path Hub
    Path Step
      Existing Course or Lesson
```

## Source Of Truth

### Canonical Lesson Content

Canonical lesson content stays here:

```text
academy/
academy/candlestick-patterns/
academy/chart-patterns/
academy/sec-filings/
```

Each lesson markdown file remains the source of truth for:

- Title.
- Public slug.
- Body content.
- Lesson objective.
- Educational examples.
- Practical checklist.
- Apply This In Review.
- Trader Intelligence Bridge prose.
- FAQ.
- Disclaimer.
- Visual asset references.
- Canonical course metadata.

Do not duplicate lesson markdown for cross-listed placements.

### Course Membership Data

Future production should add or generate a course membership layer. The final storage format can be JSON, YAML, TypeScript data, or a CMS model, but the shape should follow this plan.

This layer is the source of truth for:

- Course order.
- Course module order.
- Displayed lesson membership.
- Cross-listed lesson placements.
- Course-specific previous/next navigation.
- Whether a lesson counts toward core course completion.
- Whether a lesson is required, optional, supporting, or library-style.
- Course-level app bridge card placement.

Do not hardcode this inside React components.

## Recommended IDs

Use stable IDs that do not depend on display names.

Examples:

```text
trading-foundations
chart-reading-market-structure
volume-liquidity-order-flow
risk-management-trade-planning
technical-indicators-tools
trading-styles-playbooks
day-trading-workflow
swing-trading-workflow
news-catalysts-sec-filings
small-cap-float-dilution
halts-high-volatility
trading-psychology-discipline
trade-review-improvement
practice-improvement
academy-navigation-path-hubs
```

Lesson identity should use the public slug:

```text
/academy/support-and-resistance/
```

Reason:

- The slug is already unique.
- Completion can be keyed by slug.
- Cross-listed lessons can be counted once across multiple course placements.
- Public URL stability matters for search, bookmarks, and user progress.

## Course Definition Model

Recommended course fields:

```yaml
course_id: "chart-reading-market-structure"
course_slug: "/academy/courses/chart-reading-market-structure/"
course_title: "Chart Reading And Market Structure"
course_order: 2
course_type: "academy_course"
status: "ui_planning_ready"
audience: "Learners who finished Trading Foundations or understand market basics."
course_outcome: "Understand levels, structure, candles, patterns, and chart context without treating charts as signals."
recommended_previous_course: "trading-foundations"
recommended_next_course: "volume-liquidity-order-flow"
completion_mode: "core_lessons"
progress_model: "lesson_slug_completion"
visual_status: "ready"
app_bridge_strength: "supporting"
hard_app_links_enabled: false
modules: []
```

Recommended `course_type` values:

| Value | Use For |
|---|---|
| `academy_course` | Standard numbered course. |
| `academy_submodule` | Supporting library inside a parent course, such as Candlestick Patterns. |
| `academy_path_hub` | Optional guided route, not a numbered course. |
| `academy_support_collection` | Future glossary/support collections if needed. |

Recommended `status` values:

| Value | Meaning |
|---|---|
| `content_ready` | Lesson content is upgraded. |
| `ui_planning_ready` | Course has passed UI readiness planning. |
| `launch_polish_needed` | UI can be planned, but visuals or landing polish remain. |
| `production_ready_candidate` | Ready to enter implementation planning. |
| `needs_editorial_work` | Course still needs content edits. |

## Module Definition Model

Recommended module fields:

```yaml
module_id: "core-levels"
module_title: "Core Levels"
module_order: 1
module_type: "standard"
description: "Support, resistance, and level mapping."
display_behavior: "expanded"
progress_enabled: true
lessons: []
```

Recommended `module_type` values:

| Value | Use For |
|---|---|
| `standard` | Normal course section. |
| `library` | Browsable reference group, such as chart patterns. |
| `capstone` | Review or synthesis section. |
| `supporting` | Optional related lessons. |
| `path_steps` | Ordered steps inside a path hub. |

Recommended `display_behavior` values:

| Value | Use For |
|---|---|
| `expanded` | Core starting module. |
| `collapsed` | Large supporting module. |
| `accordion` | Long course sections such as SEC filings. |
| `rail` | Optional library or support strip. |
| `timeline` | Workflow courses such as Day Trading. |
| `map` | Path hubs. |

## Lesson Membership Model

Recommended lesson membership fields:

```yaml
lesson_slug: "/academy/breakout-trading/"
display_title: "Breakout Trading"
display_order: 8
membership_type: "cross_listed"
canonical_course_id: "chart-reading-market-structure"
display_course_id: "trading-styles-playbooks"
module_id: "setup-types"
required_for_core_completion: true
counts_toward_course_progress: true
counts_toward_parent_progress: true
recommended_previous_in_context: "/academy/pullbacks-and-dip-buy-setups/"
recommended_next_in_context: "/academy/breakdown-trading/"
lesson_card_variant: "standard"
primary_visual_asset: null
app_bridge_card_id: null
```

Recommended `membership_type` values:

| Value | Meaning |
|---|---|
| `canonical` | Lesson belongs primarily to this course. |
| `cross_listed` | Lesson is owned by another course but appears here. |
| `submodule` | Lesson belongs to a supporting library under a parent course. |
| `supporting` | Related support lesson, not part of required progress. |
| `path_step` | Lesson or course appears inside a path hub. |

## Completion And Progress Model

### Completion Key

Store completion by lesson slug:

```text
academy_completion.user_id + lesson_slug
```

Do not store separate completions for the same lesson in every course.

Reason:

- A lesson such as `/academy/volume-by-price/` may appear in both Volume and Technical Indicators.
- Completion should follow the learner.
- Cross-listed lessons should not require duplicate completion.

### Course Progress

Calculate course progress from membership rows:

```text
completed required lessons / total required lessons
```

Recommended fields:

```yaml
progress_enabled: true
required_for_core_completion: true
counts_toward_course_progress: true
```

### Submodule Progress

For Chart Reading, track separate progress for:

- Core Chart Reading path.
- Candlestick Patterns In Context.
- Chart Patterns In Context.

Do not make learners feel the core course is incomplete because they have not completed every pattern library lesson.

### Large Course Progress

For large courses such as News/Catalysts/SEC Filings and Small-Cap/Float/Dilution, show both:

- Overall course progress.
- Module progress.

Reason:

- A 37-lesson course should not feel like one giant checklist.
- Users may need to return to filing modules as references.

### Path Hub Progress

Path hubs should aggregate completion from underlying lesson slugs. They should not create separate completion records.

Recommended path progress:

```text
completed path steps / total path steps
```

For steps that point to a whole course, path progress can use that course's completion percentage.

## Navigation Model

### Canonical Navigation

Lesson frontmatter `recommended_previous` and `recommended_next` should remain the canonical lesson chain.

Use canonical navigation when:

- A user opens a lesson directly.
- The user is browsing the lesson's owning course.
- The UI has no active course context.

### Context-Specific Navigation

Course membership should define context-specific previous/next.

Use context navigation when:

- A user enters a cross-listed lesson from another course.
- A user is inside a path hub.
- A user is inside a submodule/library.

Example:

```yaml
lesson_slug: "/academy/chart-patterns/vwap-reclaim/"
canonical_course_id: "technical-indicators-tools"
display_course_id: "chart-patterns-context"
recommended_previous_in_context: "/academy/chart-patterns/parabolic-move/"
recommended_next_in_context: null
```

## Path Hub Model

Path hubs should be modeled separately from numbered courses.

Recommended path hub fields:

```yaml
path_id: "chart-reading-path"
path_slug: "/academy/chart-reading-path/"
path_title: "Chart Reading Path"
path_type: "academy_path_hub"
display_order: 1
status: "ui_planning_ready"
path_goal: "Guide learners through levels, structure, candles, patterns, volume, workflow, and review."
recommended_for: "Learners who want a focused route through chart-reading lessons."
progress_model: "aggregate_lesson_completion"
hard_app_links_enabled: false
steps: []
```

Recommended path step fields:

```yaml
step_id: "support-and-resistance"
step_order: 1
step_type: "lesson"
target_slug: "/academy/support-and-resistance/"
target_course_id: "chart-reading-market-structure"
required_for_path_completion: true
step_note: "Start with obvious levels before patterns."
```

Recommended `step_type` values:

| Value | Use For |
|---|---|
| `lesson` | A single lesson. |
| `course` | A whole course. |
| `module` | A module inside a course. |
| `submodule` | A supporting library. |
| `review_prompt` | A future review checkpoint. |

## Route-Safe App Bridge Data

Do not hardcode app links in lesson markdown yet.

Instead, future production should use route-safe bridge metadata:

```yaml
app_bridge:
  enabled: true
  bridge_strength: "supporting"
  primary_surface: "Trade Review"
  secondary_surfaces:
    - "Playbook Builder"
  placement: "module_card"
  route_key: null
  hard_link_enabled: false
  copy_variant: "completed_trade_review"
```

Recommended bridge fields:

| Field | Purpose |
|---|---|
| `enabled` | Whether a bridge can appear in UI. |
| `bridge_strength` | `core`, `supporting`, `light`, or `none`. |
| `primary_surface` | Approved app surface vocabulary. |
| `secondary_surfaces` | Optional support surfaces. |
| `placement` | Course page, module card, lesson body, capstone, path hub, or none. |
| `route_key` | Stable internal route key later, not raw URL now. |
| `hard_link_enabled` | False until routes/features are stable. |
| `copy_variant` | Safe copy pattern such as completed trade review, risk review, session review, filing review, or practice loop. |

Recommended `placement` values:

| Value | Use For |
|---|---|
| `course_note` | One subtle bridge on a course page. |
| `module_card` | One card for a module with a strong bridge. |
| `lesson_bridge_section` | Existing lesson body bridge section. |
| `capstone` | Review/practice capstone lessons. |
| `path_hub_note` | Optional path hub support note. |
| `none` | Bridge would feel forced. |

## App Bridge Route Safety Checklist

Enable hard app links only when all are true:

- The route exists.
- The route name is stable.
- The app feature exists.
- The UI copy accurately describes the feature.
- The bridge is useful for the learner.
- The bridge does not imply prediction, signals, guaranteed improvement, loss prevention, or psychological diagnosis.

Until then:

```yaml
hard_link_enabled: false
route_key: null
```

## Visual Asset Model

Visual assets should remain referenced by lesson markdown frontmatter and body content.

Future course membership data can optionally choose a primary visual for a course or module:

```yaml
primary_visual_asset: "public/academy/images/chart-reading/support-resistance-candlestick-diagram.svg"
visual_role: "course_card"
```

Rules:

- Do not reference planned SVGs in production until files exist.
- Do not crop execution dashboards or filing panels so tightly that labels become unreadable.
- Keep lesson-level visuals inside the lesson content unless a course card explicitly chooses one representative asset.
- Missing Pass 4 visual batches are launch-polish work unless production design requires them earlier.

## Recommended Future Generated Views

Production can generate these views from the model:

| View | Source Data |
|---|---|
| Academy homepage | Course definitions, path hubs, user progress. |
| Course page | Course definition, modules, lesson memberships, progress. |
| Module section | Module definition and membership rows. |
| Lesson page | Lesson markdown plus active course/path context. |
| Continue learning | User completion table plus course membership order. |
| Related lessons | Lesson frontmatter plus membership/path context. |
| App bridge card | App bridge metadata with route safety rules. |
| Path hub page | Path hub steps and aggregate progress. |

## Recommended Future Data Files

Do not create these yet unless implementation is explicitly requested. When production work starts, likely candidates are:

```text
academy/_data/courses.json
academy/_data/path-hubs.json
academy/_data/app-bridges.json
academy/_data/visual-overrides.json
```

Alternative:

```text
src/content/academy/courses.ts
src/content/academy/path-hubs.ts
src/content/academy/app-bridges.ts
```

Recommendation:

- Keep author-editable content near `academy/` if non-engineers may edit it later.
- Use generated TypeScript only if the app needs build-time type safety.
- Do not split lesson body content away from markdown.

## Implementation Boundary

This plan does not implement anything.

Before production implementation:

- Inspect the current Next.js version docs in `node_modules/next/dist/docs/` per repo instructions.
- Decide whether the content registry is markdown-frontmatter-generated, JSON/YAML-driven, TypeScript-driven, or CMS-backed.
- Confirm route structure for `/academy`.
- Confirm user progress storage.
- Confirm app route keys and product claims.
- Confirm whether missing visual batches should be created before launch.

## Recommended Next Action

Next recommended run:

```text
Create an Academy content registry draft from the existing course index, without production website implementation.
```

The draft should be a content/planning artifact first. It should list every course, module, displayed lesson, membership type, completion behavior, context navigation, path hub membership, and app bridge metadata candidate.
