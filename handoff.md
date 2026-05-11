# Trader Intelligence Handoff

Use this file as a quick orientation note before starting another Codex run.
It does not replace `plan.md`; it explains how to use the planning chain
without getting lost or repeating completed work.

## How To Resume From The Plan Files

1. Start with `plan.md`.
   - Treat it as the root entry point.
   - Use it to find the active plan index, active next-run plan, evidence gate,
     and supporting evidence model.

2. Read `src/docs/codex-project-log.md`.
   - Read the latest entry first.
   - This tells you what was actually completed in code and verification.
   - If the log conflicts with an older plan, trust the newest log entry and
     then patch the stale plan.

3. Read `src/docs/trader-intelligence-plan-index.md`.
   - This is the source of truth for which plan controls the next run.
   - Check the active batch, current resume point, completed route order, and
     feature-plan table.

4. Open the active next-run plan:
   - `src/docs/trader-intelligence-next-continuous-implementation-run-2026-05-09.md`
   - Start from its `Required Long-Run Batch Shape` and `Next Run Phase Plan`,
     not just the short summary at the bottom.

5. Open evidence-gating docs only when behavior claims are involved:
   - `src/docs/trader-intelligence-detection-and-language-hardening-plan-2026-05-09.md`
   - `src/docs/trader-intelligence-coaching-evidence-model-2026-05-09.md`
   - `src/docs/trader-intelligence-historical-level-context-audit-2026-05-10.md`

6. Before editing App Router code, follow the local Next.js docs note:
   - `src/docs/nextjs-local-docs-guide.md`
   - Read the relevant installed docs under `node_modules/next/dist/docs/`.

7. Work continuously from the active plan.
   - Do not stop after one panel, one route link, one passing test, or one docs
     update.
   - Use the loop: work -> focused verify -> continue to the next safe slice.
   - Stop only for true global blockers, destructive operations, or risky
     architecture choices.

8. Update docs after the coherent batch, not after every tiny change.
   - Always update `src/docs/codex-project-log.md`.
   - Update the active next-run plan and plan index when the resume point
     changes.
   - Update `plan.md` only when the top-level handoff summary changes.

## Current Completed Work To Preserve

Do not rebuild these unless a concrete regression is found:

- shared user-facing behavior mapper/registry/contracts,
- ticker stories,
- session stories,
- chart-context finding bridge,
- add-quality prompt/certification split,
- after-exit continuation gate,
- support/resistance exit behavior,
- first-entry versus re-entry volume comparison,
- protected-profit-before-fade certification,
- strength-to-repeat session stories,
- coach/analytics first presentation-polish pass,
- screenshot-guided shared visual polish,
- saved-trades workflow panel,
- `/trades` current-view browse copy,
- trade-card `Why review this` blocks,
- `/trades/[tradeId]` four-step review-flow handoff,
- trade-detail lower-section label cleanup,
- coach lower-page support collapse,
- coach `Before Next Session` plan panel,
- coach evidence-card `what happened / why it mattered / what to do next`
  structure,
- trade-detail supporting-details collapse,
- analytics trade-detail anchor repairs.
- saved-trade pagination at 18 cards per page,
- saved-trade visible-card range copy,
- softened saved-trade `Why review this` review cue styling,
- analytics ticker-story summary/evidence-count collapse.
- shared mobile `DashboardSideNav` collapse into `Page sections`,
- `/review` queue first-batch limit,
- `/review` mobile queue-tab compaction,
- `/progress` chart evidence-count collapse,
- progress `Follow the review loop` heading cleanup.
- import route shared user-facing status labels,
- `/import-dry-run`, `/imports`, and `/imports/[batchId]` save/saved-import
  wording cleanup,
- import route lighter dashboard panel styling,
- import raw-state Playwright copy-safety guards.
- `/workspace` lighter dashboard visual-system migration,
- `/workspace` shared primary workflow handoff panel,
- `/workspace` saved-import wording and review/coach route anchors,
- dashboard-scoped old-card visual cleanup for `/coach` and touched user
  dashboard surfaces,
- `/workspace` and `/coach` large old near-black card Playwright guard.
- `/workspace` core App Areas demotion of secondary review tools into
  `More review tools`,
- `/workspace` `Review next trade` workflow link to the actual next review
  anchor when available,
- `/coach` positive-evidence focus split: profitable evidence uses
  `Review first`, not `Fix first`.
- `/workspace` beta/admin notes collapse and `Trade review workflow` copy,
- shared user-facing trade-symbol display helper for hiding import-ID-like
  labels such as `V516374MD` behind `Selected trade` in primary UI.
- `/analytics` behavior report grouping using the certified read model:
  entries near resistance, support-based entries, chase/extension review,
  dip-buy/add review, profit protection, profit taking near levels, and
  volume/re-entry review.
- shared `BehaviorReportPanel` reuse in `/coach`, where the same certified
  behavior report renders as `Behavior Coaching Map` with `Fix first`,
  `Repeat first`, and `Needs review` framing. User QA found this is too close
  to the analytics card grid, so future work should keep the shared evidence
  source but redesign the coach presentation into a guided coaching sequence.

## Next Run Shape

The previous coach/lower-page simplification batch, the screenshot-guided
saved-trades/analytics follow-up, and the review/progress mobile-density pass
are complete. Import-flow trust polish and the workspace/coach visual-system
QA slice are also complete. Do not repeat them unless screenshots or tests show
a concrete regression.

The next run should start after the workspace/coach visual-system cleanup and
continue with concrete, non-duplicate slices:

1. Reorient from `plan.md`, the project log, plan index, and active next-run
   plan.
2. Run a copy-safety scan across the touched route family before making a new
   product claim.
3. Do not redo the completed `/workspace` visual migration or `/coach`
   old-card cleanup unless a screenshot or test shows a real regression.
4. Continue with route copy/anchor repairs or screenshot fixes only when a
   concrete visual issue is visible. Import-flow trust polish is complete, and
   the workspace core app-area plus coach review-first split are complete, so
   only touch those again for a specific regression. The workspace beta/admin
   note collapse and shared trade-symbol display helper are also complete, so
   only revisit them if an ID-like label or primary admin/internal label leaks
   back into screenshots or tests. The analytics behavior report grouping is
   also complete and `/coach` now reuses it as the Behavior Coaching Map.
   Revisit `/analytics` only for concrete visual density, drill-down, or
   grouping regressions. Revisit `/coach` specifically to replace the mirrored
   report-card layout with a coach-first sequence that selects, explains, and
   routes evidence for one behavior at a time.
5. Only revisit `/review`, `/progress`, `/analytics`, `/trades`, or
   `/trades/[tradeId]` if screenshots or tests show a regression in the
   completed work.
6. Polish route handoffs found by QA:
   - `/coach -> trade detail`,
   - `trade detail -> review queue`,
   - `trade detail -> progress`,
   - `/analytics -> trade detail`.
7. Only add a new market-context behavior family if saved evidence can prove it
   without inference. Keep uncertain findings as review prompts.
8. Run focused verification:
   - `npx tsc --noEmit --pretty false`
   - `npm run build`
   - focused Playwright for workspace, coach, trade detail, review workflow,
     progress, banned copy, and mobile overflow.
9. Update docs/logs at the end so the next run knows what not to repeat.

## Guardrails

- Do not expand the app surface with new routes unless the active plan requires
  it.
- Do not add a new behavior family unless saved execution, chart, level,
  candle, volume, or after-exit evidence can prove it.
- Keep uncertain market-context behavior as review prompts or internal-only
  data.
- Use shared user-facing behavior contracts and read models. Do not create
  route-local label maps.
- Keep the app focused on human trader language, especially for new traders.
