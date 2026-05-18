# TradersLink Academy Registry Migration Checklist

Date: 2026-05-18

Status: planning checklist complete

Scope: Migration checklist from `docs/content/traderslink-academy-content-registry-draft.md` to future author-editable `academy/_data/*.json` registry files.

This is a planning document only. It does not create production routes, React components, JSX, CSS, Next.js pages, schemas, imported registries, or database tables.

## Decision Summary

The recommended future registry source is:

```text
academy/_data/
```

Recommended future files:

```text
academy/_data/courses.json
academy/_data/lesson-memberships.json
academy/_data/path-hubs.json
academy/_data/app-bridges.json
academy/_data/visual-overrides.json
```

Use JSON first. Keep `src/content/academy/` reserved for an optional typed adapter or generated app-facing layer later.

## Readiness Answer

The Academy content is ready for the next production-prep step, which is creating the machine-readable registry data.

The Academy is not ready to skip straight into app UI implementation until these items exist:

- `academy/_data/*.json` registry files.
- A validation pass proving all lesson slugs resolve to local markdown.
- A validation pass proving all course/module/membership IDs are stable.
- A validation pass proving cross-listed lessons have exactly one canonical owner.
- A route plan for `/academy`, course pages, path hubs, lessons, and assets.
- A progress storage decision.
- A route-safe app bridge decision with hard app links still disabled until app route keys are stable.
- Current Next.js docs reviewed before app implementation, per repo instructions.

Recommended order:

```text
1. Markdown registry draft
2. Registry migration checklist
3. academy/_data JSON registry files
4. Registry validation scripts/checks
5. Production route/content loader planning
6. Academy app UI implementation
```

## Source Documents

Use these files as migration inputs:

| Source | Use |
|---|---|
| `docs/content/traderslink-academy-content-registry-draft.md` | Main course, module, membership, progress, path hub, bridge, and visual registry draft. |
| `docs/content/traderslink-academy-registry-format-decision.md` | Location and format decision: JSON under `academy/_data/`. |
| `docs/content/traderslink-academy-course-index.md` | Course order, displayed lesson sequences, support rails, readiness status, and progress notes. |
| `docs/content/traderslink-academy-production-content-model-plan.md` | Recommended course/module/membership/path/app bridge field model. |
| `docs/content/traderslink-academy-app-bridge-audit-pass6.md` | Approved restrained app bridge surface vocabulary and hard-link deferral rules. |
| `docs/content/learn-image-asset-manifest.md` | Existing SVG/image verification source. |

## Target Files

### `academy/_data/courses.json`

Purpose:

- Course-level definitions.
- Homepage order.
- Course display metadata.
- Progress model.
- Recommended previous/next course.
- Visual readiness flags.
- App bridge strength.

Checklist:

- [ ] Create `academy/_data/` only after explicit implementation approval.
- [ ] Create `courses.json`.
- [ ] Add one row for each numbered Academy course.
- [ ] Add one row for `academy-navigation-path-hubs` as a path hub group, not a numbered course.
- [ ] Preserve the recommended homepage order from the course index.
- [ ] Use stable lowercase `course_id` values.
- [ ] Add `course_slug` candidates for future course pages.
- [ ] Add `course_title`.
- [ ] Add `course_order`.
- [ ] Add `course_type`.
- [ ] Add `status`.
- [ ] Add `audience`.
- [ ] Add `course_outcome`.
- [ ] Add `recommended_previous_course`.
- [ ] Add `recommended_next_course`.
- [ ] Add `completion_mode`.
- [ ] Add `progress_model`.
- [ ] Add `display_model`.
- [ ] Add `visual_status`.
- [ ] Add `app_bridge_strength`.
- [ ] Set `hard_app_links_enabled` to `false` for every course.
- [ ] Do not include user-facing source citations.
- [ ] Do not include production route code.

Recommended course IDs:

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

### `academy/_data/lesson-memberships.json`

Purpose:

- Course/module lesson display rows.
- Canonical versus cross-listed ownership.
- Required versus supporting behavior.
- Context navigation.
- Completion behavior.

Checklist:

- [ ] Create `lesson-memberships.json`.
- [ ] Add every required displayed lesson row from the registry draft.
- [ ] Add candlestick-pattern library rows as library/submodule membership.
- [ ] Add chart-pattern library rows as library/submodule membership.
- [ ] Add support rail rows only if they are marked `supporting`.
- [ ] Use public lesson slug as `lesson_slug`.
- [ ] Include `display_course_id`.
- [ ] Include `module_id`.
- [ ] Include `display_order`.
- [ ] Include `membership_type`.
- [ ] Include `canonical_course_id`.
- [ ] Include `required_for_core_completion`.
- [ ] Include `counts_toward_course_progress`.
- [ ] Include `counts_toward_parent_progress`.
- [ ] Include `recommended_previous_in_context`.
- [ ] Include `recommended_next_in_context`.
- [ ] Include `lesson_card_variant`.
- [ ] Include `primary_visual_asset` only if the asset exists.
- [ ] Include `app_bridge_card_id` only if a bridge card exists in `app-bridges.json`.
- [ ] Set `hard_app_links_enabled` to `false`.
- [ ] Verify each `lesson_slug` resolves to a local markdown file.
- [ ] Verify every cross-listed lesson has one canonical owner.
- [ ] Verify optional support rails do not count toward core progress unless explicitly promoted.

Required membership type values:

```text
canonical
cross_listed
submodule
supporting
path_step
```

Required completion behavior values:

```text
required
library
supporting
optional
```

### `academy/_data/path-hubs.json`

Purpose:

- Optional guided routes.
- Path goals.
- Path step display order.
- Aggregate progress behavior.

Checklist:

- [ ] Create `path-hubs.json`.
- [ ] Add `chart-reading-path`.
- [ ] Add `news-and-filings-path`.
- [ ] Add `trade-review-path`.
- [ ] Add `risk-discipline-path`.
- [ ] Do not treat path hubs as numbered courses.
- [ ] Add `path_slug`.
- [ ] Add `path_title`.
- [ ] Add `path_goal`.
- [ ] Add `recommended_for`.
- [ ] Add `progress_model`.
- [ ] Add `hard_app_links_enabled: false`.
- [ ] Add path steps only after deciding whether each step points to a course, module, submodule, lesson, or review checkpoint.
- [ ] Verify every step target resolves to a course ID, module ID, or lesson slug.
- [ ] Verify path progress aggregates existing lesson/course progress instead of creating duplicate completion.

Path step type values:

```text
course
module
submodule
lesson
review_checkpoint
```

### `academy/_data/app-bridges.json`

Purpose:

- Route-safe app bridge metadata.
- Future UI card candidates.
- Restrained app tie-ins that do not turn lessons into ads.

Checklist:

- [ ] Create `app-bridges.json`.
- [ ] Use only approved app surface vocabulary from Pass 6.
- [ ] Add course-level bridge rows first.
- [ ] Add module-level bridge rows only where they are natural.
- [ ] Avoid lesson-level bridge rows unless clearly necessary.
- [ ] Set `hard_link_enabled` to `false` for every row.
- [ ] Set `route_key` to `null` until product route keys are stable.
- [ ] Include `bridge_strength`.
- [ ] Include `primary_surface`.
- [ ] Include `secondary_surfaces`.
- [ ] Include `placement`.
- [ ] Include `copy_variant`.
- [ ] Include `claim_safety_notes`.
- [ ] Ensure bridge copy is review-focused.
- [ ] Ensure no bridge copy implies prediction, buy/sell signals, guaranteed improvement, loss prevention, or psychological diagnosis.

Approved bridge strengths:

```text
core
supporting
light
none
```

Approved surfaces:

```text
Trade Review
Risk Review
Execution Review
Coaching
Analytics
Journal Notes
Playbook Builder
News/Filing Review
Session Review
Progress/Academy
```

### `academy/_data/visual-overrides.json`

Purpose:

- Course card and module card visual choices.
- Visual readiness flags.
- Avoid referencing planned assets before they exist.

Checklist:

- [ ] Create `visual-overrides.json`.
- [ ] Add course-level visual choices only where existing assets are verified.
- [ ] Add module-level visuals only if they improve comprehension.
- [ ] Keep missing visual batches as launch-polish flags, not broken asset references.
- [ ] Verify every referenced asset exists under `public/academy/images/`.
- [ ] Verify referenced SVGs have `title` and `desc` tags.
- [ ] Verify chart visuals use realistic red/green candlesticks where appropriate.
- [ ] Verify labels are educational, not buy/sell/profit/signal language.
- [ ] Do not reference random abstract graphics for chart/filing/execution lessons.

## Field-Level Migration Checklist

### Course Fields

Required first-pass fields:

```json
{
  "course_id": "",
  "course_slug": "",
  "course_title": "",
  "course_order": 1,
  "course_type": "academy_course",
  "status": "ui_planning_ready",
  "audience": "",
  "course_outcome": "",
  "recommended_previous_course": null,
  "recommended_next_course": null,
  "completion_mode": "core_lessons",
  "progress_model": "lesson_slug_completion",
  "display_model": "",
  "visual_status": "",
  "app_bridge_strength": "light",
  "hard_app_links_enabled": false
}
```

Validation:

- [ ] `course_id` is unique.
- [ ] `course_order` is unique for numbered courses.
- [ ] Path hubs have no numbered course order.
- [ ] `recommended_previous_course` and `recommended_next_course` resolve or are `null`.
- [ ] `hard_app_links_enabled` is always `false`.

### Module Fields

Required first-pass fields:

```json
{
  "course_id": "",
  "module_id": "",
  "module_title": "",
  "module_order": 1,
  "module_type": "standard",
  "display_behavior": "expanded",
  "progress_enabled": true
}
```

Validation:

- [ ] `module_id` is unique within its `course_id`.
- [ ] `course_id` resolves to `courses.json`.
- [ ] `module_order` is unique within each course.
- [ ] Library modules have separate progress where needed.
- [ ] Capstone modules appear after foundation/process modules.

### Lesson Membership Fields

Required first-pass fields:

```json
{
  "lesson_slug": "",
  "display_title": "",
  "display_course_id": "",
  "module_id": "",
  "display_order": 1,
  "membership_type": "canonical",
  "canonical_course_id": "",
  "required_for_core_completion": true,
  "counts_toward_course_progress": true,
  "counts_toward_parent_progress": true,
  "recommended_previous_in_context": null,
  "recommended_next_in_context": null,
  "lesson_card_variant": "standard",
  "primary_visual_asset": null,
  "app_bridge_card_id": null,
  "hard_app_links_enabled": false
}
```

Validation:

- [ ] `lesson_slug` resolves to a local markdown file.
- [ ] `display_course_id` resolves to `courses.json`.
- [ ] `canonical_course_id` resolves to `courses.json`.
- [ ] `module_id` resolves inside `display_course_id`.
- [ ] `display_order` is unique inside the displayed course/module sequence.
- [ ] Every required course sequence has a first lesson and last lesson.
- [ ] Context previous/next links resolve or are `null`.
- [ ] Cross-listed rows do not create duplicate markdown.
- [ ] Completion remains keyed by lesson slug.

## Validation Checklist

### Slug Validation

- [ ] Extract every `lesson_slug` from `lesson-memberships.json`.
- [ ] Convert `/academy/example/` to `academy/example.md`.
- [ ] Convert `/academy/sec-filings/form-8-k/` to `academy/sec-filings/form-8-k.md`.
- [ ] Convert `/academy/chart-patterns/bull-flag/` to `academy/chart-patterns/bull-flag.md`.
- [ ] Convert `/academy/candlestick-patterns/doji/` to `academy/candlestick-patterns/doji.md`.
- [ ] Fail validation if any markdown file is missing.
- [ ] Warn if a markdown file under `academy/` is not represented anywhere in membership or support rails.

### Membership Validation

- [ ] Every course has at least one module.
- [ ] Every required module has at least one lesson.
- [ ] Every lesson has exactly one canonical owner.
- [ ] Cross-listed lessons point back to their canonical course.
- [ ] Support rails are not counted as required progress by default.
- [ ] Candlestick and chart-pattern libraries do not block the core Chart Reading completion percentage.
- [ ] Large courses show module progress as well as course progress.

### Navigation Validation

- [ ] For each required course sequence, sort by `display_order`.
- [ ] First lesson has `recommended_previous_in_context: null` or previous course transition.
- [ ] Last lesson has `recommended_next_in_context: null` or next course transition.
- [ ] Middle lessons have previous/next links that resolve.
- [ ] Cross-listed lesson context navigation follows display context, not only canonical frontmatter.
- [ ] Path hub steps resolve to valid course/module/lesson targets.

### App Bridge Validation

- [ ] Every bridge row uses approved surface vocabulary.
- [ ] Every bridge has `hard_link_enabled: false`.
- [ ] Every bridge has `route_key: null` until route keys are stable.
- [ ] No bridge copy says the app predicts trades.
- [ ] No bridge copy implies guaranteed improvement.
- [ ] No bridge copy implies loss prevention.
- [ ] No bridge copy diagnoses psychology.
- [ ] Course-level bridges are preferred over repeated lesson-level product cards.

### Visual Validation

- [ ] Every referenced visual asset exists.
- [ ] Every referenced SVG has `title` and `desc` tags.
- [ ] Chart visuals are realistic when the lesson is about charts.
- [ ] Filing/news visuals look like filing or dashboard views, not random decoration.
- [ ] Visual labels are educational and neutral.
- [ ] No visual contains buy/sell/profit/guarantee language.
- [ ] Planned visual batches are flagged as `launch_polish_needed`, not referenced as live assets.

### Source And Editorial Validation

- [ ] Internal source-audit notes stay in audit docs.
- [ ] User-facing lesson content remains citation-free by default.
- [ ] Official system names can remain when part of the topic, such as EDGAR, Form 8-K, LULD, or filing types.
- [ ] Lessons keep educational and non-financial-advice framing.
- [ ] Lessons avoid outcome guarantees.
- [ ] Lessons avoid buy/sell signals.
- [ ] Lessons avoid performance claims.

## Migration Sequence

### Step 1: Freeze The Planning Sources

- [ ] Confirm the latest committed registry draft is the source.
- [ ] Confirm the latest course index is current.
- [ ] Confirm no production website implementation is happening in the same commit.
- [ ] Confirm the user wants JSON under `academy/_data/`.

### Step 2: Create The Data Folder

- [ ] Create `academy/_data/`.
- [ ] Add `.gitkeep` only if creating the folder before data files.
- [ ] Prefer adding real JSON files in the same implementation run.

### Step 3: Create `courses.json`

- [ ] Start with the 14 numbered courses.
- [ ] Add `academy-navigation-path-hubs` as unnumbered support.
- [ ] Validate course IDs and order.
- [ ] Keep route/app links disabled.

### Step 4: Create `lesson-memberships.json`

- [ ] Add the main required course sequences.
- [ ] Add candlestick and chart-pattern libraries.
- [ ] Add support rails as `supporting`.
- [ ] Add context navigation fields.
- [ ] Validate all 223 lesson slugs resolve.

### Step 5: Create `path-hubs.json`

- [ ] Add the four existing path hubs.
- [ ] Decide whether each path step initially points to a course, module, or lesson.
- [ ] Keep path hubs unnumbered.
- [ ] Validate target IDs.

### Step 6: Create `app-bridges.json`

- [ ] Add only course-level bridge candidates first.
- [ ] Keep hard links disabled.
- [ ] Use route keys only after product routes are stable.
- [ ] Keep bridge copy restrained.

### Step 7: Create `visual-overrides.json`

- [ ] Reference only existing verified assets.
- [ ] Add launch-polish flags for missing future visual batches.
- [ ] Validate asset paths.

### Step 8: Add Validation

- [ ] Decide whether validation should be a one-off script, npm script, or test.
- [ ] Validate JSON parse.
- [ ] Validate all slugs.
- [ ] Validate all IDs.
- [ ] Validate navigation links.
- [ ] Validate visual assets.
- [ ] Validate bridge route safety.

### Step 9: App Implementation Gate

Do not build the Academy UI until the registry data passes validation.

Before app implementation:

- [ ] Read current Next.js docs under `node_modules/next/dist/docs/`.
- [ ] Decide route structure for `/academy`.
- [ ] Decide whether lesson markdown is loaded at build time, request time, or through a content layer.
- [ ] Decide progress storage.
- [ ] Decide whether anonymous users can mark local progress.
- [ ] Decide authenticated progress behavior.
- [ ] Decide how app bridge route keys map to product routes.
- [ ] Decide course completion UI states.
- [ ] Decide path hub UI states.
- [ ] Decide SEO metadata behavior for Academy lessons.

## Production-Ready Build Recommendation

The right next build step is not the full Academy UI yet.

The next build step, if the user approves moving past planning, should be:

```text
Create academy/_data/*.json from the registry draft and add validation checks.
```

After that passes, the Academy app build can begin with much less risk.

## Recommended Next Action

Next recommended run:

```text
Create the author-editable Academy registry JSON files under academy/_data/ and add validation checks, still without building routes or UI unless explicitly requested.
```
