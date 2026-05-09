# Trader Functional Readiness Next Handoff

## Latest Handoff

For a fresh chat after the May 5 calibration/backfill discussion, start with:

- `src/docs/trader-intelligence-next-chat-handoff-2026-05-05.md`

That file is more current than the older branch history below and includes the
first-100 baseline, market-data readiness scripts, `levels-system` dependency,
and exact rerun commands.

## Read This First In A New Chat

This handoff is intentionally short. It points to the current completed branch
and the next planned branch so a fresh Codex session can continue without
re-reading the long conversation.

## Current State

The functional product readiness branch is complete.

The execution-intelligence project reset is documented here:

- `src/docs/trader-execution-intelligence-project-review-2026-05-04.md`

Completed plan:

- `src/docs/trader-functional-product-readiness-plan.md`

Main implementation:

- `src/lib/trader-analytics/product/functional-readiness.ts`

Main tests:

- `src/lib/trader-analytics/__tests__/trader-functional-product-readiness.test.ts`

Main route surface:

- `app/platform-readiness/page.tsx`

What exists now:

- import confidence state machine
- CSV dry-run to saved-analysis prototype
- execution-only autopsy enrichment
- synthetic trader personas
- deterministic execution-math fuzz scenarios
- truth-source evidence audit
- feature readiness dashboard
- real-data calibration harness
- `/platform-readiness` panels showing functional loop, behavior harness,
  calibration status, and live-readiness blockers
- trade-analysis summaries now include `decisionReview`, a deterministic
  scoring -> behavior -> coaching bridge with concrete decision insights

Important boundary:

- This app still does not fetch candles, build support/resistance, calculate
  VWAP/EMA, or score market structure. `levels-system` owns that work.
- VWAP/EMA should not drive trader-facing feedback for now.
- Daily/4h support and resistance from `levels-system` are the first-pass
  market-context feedback source.
- Daily/4h market-context wording must stay trade-direction aware. Long reviews
  can discuss resistance as limited upside room and support as cushion below;
  short reviews should discuss support as downside room/obstacle and must not
  reuse long-only room-above phrasing.
- 1m/5m historical candles remain trade-window movement evidence only:
  MFE/MAE, high/low during hold, and bounded post-exit continuation.
- Market context must stay separate from execution-only feedback unless a
  specific market-context review panel explicitly owns the claim.
- Execution feedback and import QA must stay useful without market data.

## Verification Already Completed

The previous branch passed:

```bash
npx vitest run src/lib/trader-analytics/__tests__/trader-functional-product-readiness.test.ts
npx vitest run src/lib/trader-analytics/__tests__/trader-functional-product-readiness.test.ts src/lib/trader-analytics/__tests__/platform-ready-feature-module.test.ts
npm run test:e2e
npx tsc --noEmit --pretty false
npm run lint
npm run build
npm run verify:all
npm audit
```

Notes:

- `npm run lint` had 0 errors and 4 pre-existing warnings.
- `npm audit` reported 0 vulnerabilities.
- `npm run test:e2e` passed with 48 tests and 71 expected skips.
- `npm run verify:all` passed with 87 Vitest files and 797 tests, plus
  levels-system checks, Layer 2 verify, and Layer 3 verify.

## Current Resume Point

Current plan:

- `src/docs/trader-functional-readiness-user-workflow-plan.md`
- `src/docs/trader-decision-review-bridge-implementation-plan.md`
- `src/docs/trader-decision-review-real-csv-calibration-plan.md`

Completed since this handoff was first written:

1. `buildCsvDryRunPrototypeAnalysisPanel(...)` now exists in
   `src/lib/trader-analytics/product/functional-readiness.ts`.
2. The `/import-dry-run` route now renders a `Prototype Analysis` panel.
3. The panel can show execution-autopsy findings immediately and can accept
   precomputed daily/4h decision-review facts later without importing
   server-only trade-analysis or levels-system code into the browser route.
4. Focused unit tests and the desktop Playwright route smoke test cover the
   panel.
5. `CsvDryRunCostVisibilityPanel` now exists on `CsvDryRunImportExperience`.
6. `/import-dry-run` now renders `Fee / Commission Visibility` and shows parsed
   commissions, fees, broker net amount presence, currency state, and the
   gross-only scoring policy.
7. `src/docs/trader-real-csv-calibration-guide.md` now documents safe
   anonymized real CSV calibration.
8. `src/docs/trader-decision-review-bridge-implementation-plan.md` now tracks
   the import-to-decision-review bridge work.
9. A server-only dry-run decision-review bridge now converts completed grouped
   CSV trades into lightweight `CsvDryRunPrototypeDecisionReviewInput`
   snapshots.
10. `/api/import-dry-run/decision-review` exposes that bridge as a Node route.
11. `/import-dry-run` can request and attach decision-review snapshots without
   importing trade-analysis or levels-system code into the browser.
12. Decision-review calibration now has a detailed plan and internal quality
   dashboard:
   `src/lib/trader-analytics/server/build-decision-review-quality-dashboard.ts`.
13. `levels-system` support/resistance grades now flow into PatternInput and
   `TradeDecisionReview`, so review copy can mention graded daily/4h context
   such as major resistance, strong resistance, or moderate support.
14. `npm run calibrate:decision-review` prints the deterministic
   decision-review quality dashboard without starting a dev server.
15. Decision-review wording now avoids the near-support/far-from-support
   contradiction, formats level-distance evidence as true percent distance, and
   replaces generic no-primary-behavior headlines with market-context headlines
   when the trade has clearer daily/4h evidence.
16. The decision-review dashboard now includes a combined major-resistance,
    limited-room, late-add fixture matching the target feedback style.
17. Stale "adds aligned with strength" headlines are caught and replaced when
    stronger add-risk evidence survives prioritization.
18. `npm run calibrate:decision-review` now writes
    `artifacts/decision-review-quality/latest.md` by default and can run a real
    anonymized CSV with `--csv`, `--broker`, and `--max-trades`.
19. `/import-dry-run` now renders attached decision-review snapshots as
    per-trade cards grouped by market context, entry, adds/scaling, exit, and
    trade-window evidence, with server diagnostics shown in the same panel.
20. Calibration report history is written automatically next to the latest
    report unless `--no-history` is supplied.
21. `npm run calibrate:decision-review` now supports `--csv-dir` for batch
    calibration. It writes `latest-batch.md`, a timestamped batch `index.md`,
    and one report per CSV.
22. `src/docs/trader-real-csv-miss-to-fixture-template.md` explains how to turn
    real calibration misses into synthetic fixtures without committing private
    data.
23. Synthetic decision-review calibration now covers 10 scenarios, including
    realistic IBKR activity statement import, failed major-resistance entry,
    partial exits, completed short-trade smoke, and open-position skip
    diagnostics.
24. Short-trade decision-review wording now avoids long-biased support-cushion
    and room-above language. The short smoke fixture expects
    `short_entry_had_room_to_support` from daily/4h market context.
25. IBKR dry-run import now handles `Comm/Fee` cost visibility and avoids
    treating plain IBKR `Proceeds` as broker net P/L.

Best next implementation step:

1. Continue calibrating the private IBKR April Activity Statement from
   `artifacts/real-csv-calibration/private` with small `--max-trades` caps.
2. Inspect the first-25 private summary report for suspicious excursion
   percentages, especially `UCAR` and `RENX`, before increasing the cap.
3. Investigate why three `CYCN` reviews lack `trade_window_excursion_measured`.
4. Decide whether the two remaining open IBKR groups (`ANNA`, `SKYQ`) are real
   open/unmatched positions or need a broker statement handling note.
5. Convert any real import miss into a synthetic fixture before committing
   behavior. Do not commit the private CSV.
6. Keep month-wide candle/API backfills separate from CSV import calibration.
7. Promote the dry-run bridge into authenticated persisted import workflow only
   after calibration quality is reviewed.

## Files To Inspect Next

Read these before editing:

- `src/docs/trader-functional-readiness-user-workflow-plan.md`
- `src/lib/trader-analytics/product/functional-readiness.ts`
- `src/lib/trader-analytics/__tests__/trader-functional-product-readiness.test.ts`
- `app/import-dry-run/import-dry-run-client.tsx`
- `src/lib/trader-analytics/product/csv-dry-run-workflow.ts`
- `src/lib/trader-analytics/product/types.ts`
- `tests/e2e/import-dry-run.spec.ts`
- `src/docs/trader-execution-intelligence-project-review-2026-05-04.md`
- `src/docs/trader-decision-review-real-csv-calibration-plan.md`
- `src/lib/trader-analytics/server/build-decision-review-quality-dashboard.ts`

If Next.js route/page code changes:

- read the relevant docs in `node_modules/next/dist/docs/` first, per
  `AGENTS.md`.

## Product Decisions To Preserve

- UI can be rough. Functionality and testing matter more right now.
- Do not add end-user export/download features.
- Do not add real auth, billing, user persistence, or production database work.
- Do not fake saved-account behavior.
- Prototype ids are allowed only if clearly labeled as preview/prototype.
- Fee/commission visibility is allowed, but execution scoring remains gross-only
  unless a separate net-P/L plan owns that change.
- Real broker CSV calibration should use anonymized files only.
- IBKR or another provider in the other app is for candle data. CSV import here
  is user trade executions only.
- For IBKR activity statement CSVs, `Comm/Fee` is cost evidence. Plain
  `Proceeds` should be treated as gross proceeds unless a true net amount/net
  proceeds column is present.
- Full IBKR monthly Activity Statements may include subtotals/totals, Forex
  rows, repeated headers, deposits, and financial-instrument-info sections after
  the Trades header. Those are expected to be skipped as non-execution rows,
  not treated as user repair blockers.
- IBKR monthly dry-run grouping should allow positions to close across sessions.
  The current IBKR dry-run default is `maxGapMinutes=10080` and
  `splitAtSessionBoundary=false`; generic/non-IBKR dry runs keep the more
  conservative `240m` plus session-boundary split.
- Do not update the shared `levels-system` handoff unless this branch finds a
  real blocker or missing contract needed from that project.

## GitHub Status

No GitHub push or PR was created for this handoff update.

Reason:

- The workspace has many existing untracked/modified files from prior branches.
- The current request only required docs and handoff preparation.
- A clean commit/PR scope should be chosen explicitly before publishing.

## Resume Command Suggestions

Focused checks after the next implementation:

```bash
npx vitest run src/lib/trader-analytics/__tests__/trader-functional-product-readiness.test.ts
npx playwright test tests/e2e/import-dry-run.spec.ts --project=chromium-desktop
npx playwright test tests/e2e/import-dry-run.spec.ts --project=chromium-mobile
npx tsc --noEmit --pretty false
```

Full checks before closing the next branch:

```bash
npm run test:e2e
npm run lint
npm run build
npm run verify:all
npm audit
```

## Handoff Log

- 2026-05-03: Created this handoff after completing the functional product
  readiness branch and before starting the user-workflow integration branch.
- 2026-05-04: Updated after the execution-intelligence project reset. Debug
  simulations now exist under `artifacts/trade-analysis-current-review*` for
  sample, long/short winners and losers, partial exits, open position, rapid
  fire, inconsistent sizing, and repeated-add scenarios. The immediate next
  step is still the `/import-dry-run` prototype analysis panel.
- 2026-05-04: Added `decisionReview` to `TradeAnalysisSummary`; debug
  dashboards now show coaching focus and concrete insights. The next UI step
  should surface those insights in `/import-dry-run`.
- 2026-05-05: Added and surfaced `CsvDryRunPrototypeAnalysisPanel` in
  `/import-dry-run`. The route now shows generated prototype trade counts,
  execution-autopsy findings, review queue counts, production-write safety,
  and the placeholder channel for precomputed daily/4h decision review facts.
- 2026-05-05: Added `Fee / Commission Visibility` to `/import-dry-run`. The
  route now discloses parsed costs and broker net amount context without
  changing execution feedback scoring from gross-only.
- 2026-05-05: Added `src/docs/trader-real-csv-calibration-guide.md` for safe
  anonymized broker CSV testing.
- 2026-05-05: Added the decision-review bridge plan and implemented the first
  bridge: server helper, API route, client attachment path, deterministic CSV
  scenarios, Playwright attachment test, and boundary tests.
- 2026-05-05: Added the real-CSV decision-review calibration plan, expanded
  deterministic review scenarios, added the server-side quality dashboard, and
  wired levels-system support/resistance grades into decision-review copy and
  evidence.
- 2026-05-05: Tightened decision-review calibration again with combined
  resistance/room/late-add wording, stale headline detection, report artifact
  output, and a real-CSV runner mode for safe anonymized files.
- 2026-05-05: Improved the dry-run decision-review display and added
  timestamped calibration report history.
- 2026-05-05: Added batch CSV calibration with `--csv-dir` and the real-miss
  to synthetic-fixture template.
- 2026-05-05: Expanded deterministic decision-review fixtures for additional
  edge cases before real CSVs are available.
- 2026-05-05: Tightened short-trade market-context review wording so short
  trades use room-to-support facts instead of long-only support-cushion or
  room-above language.
- 2026-05-05: Hardened IBKR CSV dry-run readiness with realistic activity
  statement fixture coverage, `Comm/Fee` cost parsing, and a guard against
  treating plain gross `Proceeds` as broker net P/L.
- 2026-05-05: Ran the first private April IBKR monthly Activity Statement CSV
  calibration from `artifacts/real-csv-calibration/private` without committing
  private data. The importer now accepts 574 stock executions, rejects 0 rows,
  skips 344 expected non-execution/non-stock rows, creates 218 grouped trade
  requests, and completes the first 5 capped decision reviews with
  `levels_system_daily_4h` market context. Remaining review is real trade
  reconstruction/open-position review, not CSV parse failure.
- 2026-05-05: Added the private IBKR grouping report script and changed IBKR
  dry-run grouping defaults after calibration showed the previous session split
  created fake open trades. The April file now creates 208 grouped trade
  requests with only 2 open review cases (`ANNA`, `SKYQ`). A first-25 capped
  decision-review calibration completed 25 reviews with
  `levels_system_daily_4h` context.
- 2026-05-05: Added `summarize-decision-review-calibration.ts` and generated
  `artifacts/real-csv-calibration/private/ibkr-april-first-25-summary.md`.
  The first-25 private summary now shows 25 completed reviews, 0 fallback
  generic headlines after a market-context fallback copy fix, 3 missing
  trade-window excursion insights, 14 weak/no daily/4h level evidence rows, and
  extreme excursion metrics concentrated in `UCAR`/`RENX`.
- 2026-05-05: Added a levels-system trade-window price-alignment guard and an
  execution-only MFE/MAE fallback. The first-25 private summary now has 25/25
  `trade_window_excursion_measured` insights and no extreme excursion rows.
  The remaining calibration gap is weak/no daily/4h level evidence on 14 rows,
  which should be revisited after real provider backfill or levels-system
  daily/4h coverage improves.
- 2026-05-05: Added explicit `tradeWindowEvidenceSource` and
  `candleQualityNotes` to dry-run decision-review snapshots and surfaced them
  in `/import-dry-run`. The first-100 private IBKR calibration completed 100
  reviews with 100/100 trade-window excursion insights, 0 extreme excursion
  rows, 34 aligned levels-system candle-window reviews, 66 execution-only
  fallback reviews, and 81 weak/no daily/4h level evidence rows. Remaining open
  groups are a one-fill `ANNA` short and a one-fill 2-share `SKYQ` long.
- 2026-05-05: Added fallback-honesty safety tests. `/import-dry-run` browser
  coverage now proves execution-only fallback reviews display both the movement
  source and candle-quality warning, and product-panel unit coverage keeps those
  notes attached to decision-review finding evidence. Next meaningful work is
  in `levels-system` provider/backfill quality, then rerun first-100 here.
- 2026-05-05: Added local market-data readiness tooling while `levels-system`
  work is pending:
  - `npm run summarize:market-data-readiness -- --json=<calibration.json> --out=<summary.md>`
  - `npm run compare:decision-review-calibrations -- --baseline=<before.json> --candidate=<after.json> --out=<comparison.md>`
  - current first-100 readiness artifact:
    `artifacts/real-csv-calibration/private/ibkr-april-first-100-market-data-readiness.md`
  - current self-comparison smoke artifact:
    `artifacts/real-csv-calibration/private/ibkr-april-first-100-self-comparison.md`
