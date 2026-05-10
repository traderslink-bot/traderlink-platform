# How To Create A Plan To Work Continuously

## Purpose

Use this note when a user wants Codex to stop finishing after one small task and
instead work from a durable, detailed plan for a longer implementation run.

The goal is not just to write a checklist. The goal is to create a plan that
future Codex can actually work from without repeatedly asking the user to say
"continue."

This document was created after building the Trader Intelligence continuous UX
plan:

- `src/docs/trader-intelligence-continuous-ux-product-plan-2026-05-09.md`

## Starting Signal

The user may say something like:

- "I do not want to keep prompting you."
- "Make a detailed plan and work from it."
- "Keep going unless there is a real blocker."
- "If one step is blocked, keep working on the other steps."
- "Review the plan as another engineer would."

Treat this as a request to create a working operating plan, not just a short
task list.

## What To Create

Create or update a project-local markdown plan file. Prefer `src/docs/` when the
project already keeps implementation notes there.

If the project has many plans, also create or update a plan index. In this
project that file is:

- `src/docs/trader-intelligence-plan-index.md`

The index should tell future Codex which plan is active, which plans are
feature-specific follow-ups, which docs are historical/completed, and how to add
new feature plans without creating chaos.

The plan should include:

- product goal,
- user levels or user perspective,
- current state,
- known weak areas,
- continuous work protocol,
- autonomy rules,
- local blocker rules,
- implementation safety rules,
- data-source priority,
- definition of done,
- design acceptance criteria,
- data correctness acceptance criteria,
- what not to spend time on yet,
- detailed implementation runs,
- suggested execution order,
- long-run batch strategy,
- verification and screenshot requirements,
- current best next step.

Put the controlling next-run section near the top of the active execution plan.
A long ladder buried lower in a file is easy for future Codex to miss. The top
section should state the minimum batch target before a final response, for
example:

1. Inspect the evidence shape.
2. Implement one behavior-family pass.
3. Wire it into multiple route surfaces.
4. Verify it.
5. Continue into one independent second slice.
6. Run broader verification.
7. Update docs/logs.
8. Only then report back.

This prevents Codex from treating a good small slice as complete when the user
actually asked for a longer autonomous run.

Add an explicit `Work, Verify, Continue` loop. This matters because otherwise
Codex may treat a passing test/build as a natural stopping point. The plan
must say:

1. Implement the next slice.
2. Run the smallest meaningful verification.
3. Fix failures caused by the slice.
4. If verification passes, continue into the next safe slice.
5. Run broader verification after several related slices or shared-contract
   changes.
6. Update docs/logs after a larger batch, not after every small green
   checkpoint.
7. Report back only when the batch completion target is met or a true global
   blocker appears.

The user does not need to manually approve every checkpoint. Codex must verify
its own work and keep moving.

If a prior run stopped too soon, update the active execution plan rather than
only apologizing. Add a `Required Long-Run Batch Shape` section that names the
next several independent implementation phases and defines what counts as a
real global stop condition. Make it explicit that passing one focused test,
adding one route panel, wiring one mapper contract, or updating docs after one
small slice is a checkpoint to continue from, not the end of the run.

Also update the project log if the repo uses one. In this project that file is:

- `src/docs/codex-project-log.md`

## When To Split Into Feature Plans

Do not force every detail into one giant plan. A top-level continuous plan is
useful for direction, but feature-specific plans are better when a route or
workflow needs its own acceptance criteria.

Create a separate feature plan when:

- a route has its own product loop,
- the feature needs a different verification ladder,
- the same lessons from one route should be reused later,
- the top-level plan is becoming too large to scan,
- the implementation work would otherwise be buried in the project log.

For Trader Intelligence, the coaching plan produced lessons that also apply to:

- `/analytics`,
- `/review`,
- `/progress`.

Those became separate follow-up plans:

- `src/docs/trader-intelligence-analytics-continuous-product-plan-2026-05-09.md`
- `src/docs/trader-intelligence-review-queue-continuous-product-plan-2026-05-09.md`
- `src/docs/trader-intelligence-progress-continuous-product-plan-2026-05-09.md`

When you create a feature plan:

1. Keep it focused on one route, workflow, or feature family.
2. Include purpose, user questions, current known direction, rules,
   implementation runs, acceptance criteria, and verification.
3. Link it from the top-level plan only if it affects execution order.
4. Add it to the plan index.
5. Add a short project-log entry.

Do not create new plan files for tiny TODOs. Small follow-ups belong in the
current plan or the project log.

## How To Build The Plan

### 1. Start From The User's Actual Frustration

Do not make the plan abstract. Use the user's concrete problem.

For Trader Intelligence, the user was frustrated that:

- the app UI was not user friendly,
- `/coach` felt dumped onto the page,
- `/progress` did not seem to reflect the latest CSV,
- `/trades` showed repeated same-symbol rows without enough explanation,
- the app needed charts, red/green visual language, and clearer flow,
- Codex kept stopping too soon.

The plan should name those problems plainly.

### 2. Define The Product Loop

Write the intended user journey in one line.

Example:

```text
Workspace -> Import -> Saved Trades -> Trade Detail -> Review Queue -> Coach -> Analytics -> Progress
```

This keeps future work from drifting into random page tweaks.

### 3. Define What The App Should Help The User Answer

For a user-facing product, write the core questions the app should answer.

Example:

1. What happened?
2. What behavior mattered most?
3. Why did it matter?
4. What should I review first?
5. What should I fix or repeat next?
6. What evidence supports that?
7. How does this pattern show up across my trades?

These questions become the lens for every route change.

### 4. Add User Levels

Spell out what new, intermediate, and advanced users need.

New users usually need:

- one clear next action,
- plain explanations,
- less raw analytics,
- coaching language that says what happened and what to review.

Intermediate users usually need:

- filters,
- behavior patterns,
- session/time analytics,
- links from summary metrics back to the trades behind them.

Advanced users usually need:

- details,
- evidence depth,
- limitations,
- advanced disclosures or admin routes.

Default UI should serve new and intermediate users first.

### 5. Add Product And Safety Rules

Write the rules that future Codex must not accidentally violate.

For Trader Intelligence, the important rules were:

- keep flat-to-flat round trips as the accounting unit,
- add ticker stories above round trips for re-entry review,
- do not rewrite importer contracts unless clearly required,
- do not expose raw engine internals in beginner UI,
- do not add financial-advice language,
- do not market short-side coaching while it is not a supported product surface.

### 6. Separate Completed, Weak, And Parked Work

Be honest about current state.

Do not mark something complete just because it had a first pass. If it still
needs verification against saved data, call it partially complete.

Example:

```text
/progress has a first saved-data pass, but needs verification against the latest
imported CSV and should be treated as partially complete until the route proves
it reflects current saved imports.
```

### 7. Add Autonomy Rules

The plan must say how Codex must behave when the user wants longer work.

Include rules like:

- must not stop after one small slice,
- finish the current vertical slice,
- verify it,
- continue to the next useful item unless a true global blocker appears,
- update docs/log after meaningful implementation,
- save the final response for the end of a longer work block.

Also define a minimum useful work block. A plan can technically say "continue,"
but still make the next run too small if its first step is only a document,
one label, or one route. Spell out the expected ladder for the next run:

- first artifact or audit,
- shared helper or contract,
- first implementation slice,
- tests,
- next route or next independent behavior if the helper is reusable,
- docs/log update at the end.

State what Codex must not stop after. Examples:

- do not stop after only creating an inventory doc,
- do not stop after changing one label if the shared mapper can safely handle
  the next labels,
- do not stop after wiring one route if the same contract can be reused on the
  next route without changing architecture.

### 8. Treat Blockers As Local By Default

This was the most important improvement.

A blocker on one step must not stop the whole run if other useful work can
continue.

Examples of local blockers:

- one chart needs a missing field but layout/copy can continue,
- one route has confusing data but another route can still improve,
- one test needs investigation but typecheck/build or another test can still
  run,
- candle/API data is unavailable but saved-data routes can still improve.

Only stop the whole run for global blockers:

- destructive data/filesystem action,
- shared contract risk,
- every remaining useful step needs unavailable credentials,
- verification failure makes further work unsafe,
- continuing risks unsafe product claims or raw internal exposure.

### 9. Add A Parked Work Format

When Codex parks a local blocker, require a short structured note.

Use:

```text
Parked item:
- Area:
- Why parked:
- Safe work continued:
- Resume trigger:
- Risk if ignored:
```

This keeps parked work from vanishing without turning every TODO into a blocker.

### 10. Add Implementation Safety Rules

Include project safety rules directly in the plan.

For this project:

- do not push/commit/upload unless the user asks,
- do not delete/reset/dedupe/rewrite saved trade data during UI work,
- do not modify candle warehouse or imported CSV source files unless asked,
- do not stop the dev server just because the user is clicking around,
- preserve replay settings if the dev server must be restarted.

### 11. Add Data Source Priority

This prevents the app from showing sample data when saved imports exist.

Use a clear order:

1. current saved imports and saved review data,
2. saved decision-review snapshots and candle/context summaries,
3. product-safe read models derived from saved data,
4. sample/mock data only when no saved data exists or clearly labeled.

If a route has saved trades but shows only one trade or sample metrics, treat it
as a route data-source bug.

### 12. Add Definition Of Done

The plan should define what "done" means for a long run.

For each meaningful route touched, require:

- first screen tells the user what to do next,
- saved import data is used when it exists,
- raw/internal terms are not in beginner-facing UI,
- advanced/diagnostic details are lower or collapsed,
- charts/cards explain what they mean,
- action buttons use clear verbs,
- repeated same-symbol rows are explained,
- mobile has no obvious overflow,
- focused regression coverage exists when structure changes.

### 13. Add Design Acceptance Criteria

If the complaint is UI quality, include visual criteria.

For Trader Intelligence:

- light app surface with restrained dark accents,
- red for loss/risk and green for gain/strength,
- charts near the decisions they support,
- dense data separated into clear sections or left nav,
- one primary action per page or major workflow section,
- no long walls of same-weight cards,
- no raw technical labels in normal reading flow.

### 14. Add Data Correctness Criteria

For data-heavy apps, define product truth carefully.

For this project:

- flat-to-flat round trips remain the accounting unit,
- ticker stories explain same-symbol re-entries above round trips,
- fully closed same-day re-entry is a new round trip in the same ticker story,
- open re-entry can become swing/overnight review when data supports it,
- missing candle/volume/level/context should be phrased as something to check,
  not as a conclusion,
- short-looking data should be handled neutrally until short-side product
  support exists.

### 15. Add "Do Not Spend Time On Yet"

This keeps long runs from drifting into expensive side quests.

For this project, defer:

- auth,
- billing,
- deployment,
- new backend persistence,
- importer rewrites,
- broker import overbuild,
- admin/debug dashboards,
- marketing/SEO pages,
- raw engine tuning that does not improve the user-facing review flow.

### 16. Break Work Into Runs

Create concrete runs that can be executed continuously.

For the Trader Intelligence plan, runs included:

1. re-entry story evidence and chart/volume context,
2. coach as a guided coaching session,
3. review queue as a real work queue,
4. trade detail as the main review workspace,
5. saved trades navigation and grouping,
6. analytics report polish,
7. progress page,
8. visual design system pass,
9. copy QA and safety,
10. verification and regression harness.

Each run should have:

- goal,
- route order,
- component/read-model work,
- beginner-language changes,
- visual changes,
- tests.

### 17. Add Batch Strategy

Define batches so Codex can work across related routes in one long run.

Example:

- coaching batch: `/coach` -> `/trades/[tradeId]` -> `/review` ->
  `/progress`,
- data browsing batch: `/trades` -> `/trades/[tradeId]` -> `/analytics`,
- reporting batch: `/analytics` -> `/progress` -> `/coach`,
- polish batch: shared UI -> route cards/charts/badges -> copy tests.

Inside a batch:

1. inspect route output and read models,
2. confirm data source,
3. improve the highest-value route first,
4. carry reusable patterns into the next route,
5. add focused tests,
6. park local blockers and keep going.

### 18. Add Verification Requirements

Do not let the plan finish at code edits.

Require:

- focused tests for touched logic,
- typecheck,
- build,
- localhost smoke,
- saved-data verification,
- screenshot review for broad UI work,
- copy-safety checks.

For UI work, require desktop and mobile checks on the changed routes.

### 19. Review The Plan As Another Engineer

After drafting, review it skeptically.

Look for:

- conflicting next steps,
- completed claims that are really partial,
- missing saved-data checks,
- missing screenshot/visual review,
- unclear blocker behavior,
- risky data repair or GitHub upload behavior,
- vague routes without acceptance criteria,
- overbroad work that should be deferred.

Then patch the plan.

Do this as a full-plan audit, not a one-issue-at-a-time drip. Before telling
the user the plan is ready, check all active plan files together:

- root plan entry point,
- plan index,
- active top-level plan,
- current detailed plan,
- feature-specific plans that can affect the current run,
- latest project-log entry.

Use an audit matrix:

- source of truth: which plan controls the next run?
- status wording: does any feature plan still claim to be active when it is
  actually secondary?
- implementation artifacts: does the plan name the files/modules to create or
  inspect?
- route coverage: are all affected routes named?
- data safety: does the plan prevent destructive saved-data/candle actions?
- copy safety: does it cover primary UI and visible collapsed disclosure
  wrappers?
- detection safety: do uncertified behaviors fail closed?
- verification: are tests, build, browser/smoke, and log updates defined?
- continuation: does the plan say what to do next if one item is locally
  blocked?

### 20. Repeat Until The Plan Is Ready

The plan may need multiple review passes.

In this case, the plan improved through several passes:

1. initial detailed continuous UX plan,
2. autonomy rules,
3. local blocker bypass rules,
4. user levels and acceptance criteria,
5. second-engineer review fixes,
6. implementation safety and data-source priority,
7. final readiness check.

The point is not ceremony. The point is to remove ambiguity that would make
Codex stop too early or work on the wrong thing.

### 21. Retire Completed Slices Before The Next Run

After implementation, review the plan again and remove stale "do this first"
language for work that just landed.

This matters because a long-running plan can become misleading even when it was
correct yesterday. If `/coach` was already reframed as an overall trading
coach, the next plan should not still say the first priority is to reframe
`/coach`. It should say to smoke-check that work, then continue to the next
handoff, such as opening the evidence trade, writing the review, and checking
progress follow-through.

When updating after a completed slice:

1. Mark the completed slice as complete or reference-only.
2. Replace broad route goals with the next concrete user action.
3. Preserve guardrails that prevent regression.
4. Move any unfinished but non-blocking work into "remaining work" or "parked"
   language.
5. Update the plan index and project log so the resume point matches the plan.

The goal is to keep future Codex from repeating a finished pass just because an
older section still reads as active.

## Final Readiness Standard

The plan is ready when a future Codex instance can answer:

- What should I work on first?
- What should I do if part of it is blocked?
- What should I avoid?
- What data source should I trust?
- How do I know a route is better for the user?
- What tests and screenshots do I need?
- What do I log before the final response?

If those answers are clear, start implementation and keep moving.
