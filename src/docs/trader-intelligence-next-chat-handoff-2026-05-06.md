# Trader Intelligence Next Chat Handoff

Date: 2026-05-06

## Start Here

Read this file first in the next chat.

Then read, as needed:

- `src/docs/codex-project-log.md`
- `src/docs/behavior-family-calibration-audit-2026-05-06.md`
- `src/docs/market-data-policy-status-2026-05-06.md`
- sibling project handoff:
  `C:\Users\jerac\Documents\TraderLink\levels-system\docs\77_TRADER_INTELLIGENCE_HISTORICAL_BACKFILL_AND_ASOF_PLAN_2026-05-05.md`

Do not expose the private IBKR CSV filename, account number, or private artifact
contents in chat. It is fine to refer to the input as the private IBKR April
Activity Statement CSV.

## May 9 Resume Update

The most recent implementation pass focused on actual app usability, not SEO
copy and not deployment.

Current product flow to review locally:

```text
/workspace -> /import-dry-run -> /imports -> /trades -> /trades/[tradeId] -> /review -> /coach -> /analytics
```

What changed in the latest pass:

- Added shared trader-facing UI primitives in `app/app-ui.tsx`:
  primary action panels, metric cards, simple chart cards, advanced
  disclosures, and plain state badges.
- Reworked `/workspace` into the app home:
  import trades, review next trade, check analytics, open coach.
- Reworked `/trades` so it leads with:
  review priority trade, all saved trades, needs chart context, and open
  trades.
- Reworked `/trades/[tradeId]` into a review workspace:
  what happened, what to review, what to write down, what is unavailable,
  checklist progress, execution replay, risks/strengths, and technical limits.
- Reworked `/review` into a work queue with "Review This First", friendlier
  queue lanes, and explicit "Open Trade Review" actions.
- Reworked `/coach` into a plain review plan with:
  "Do This Next", "Avoid This Next Session", "Repeat This", and
  "Review This Trade".
- Expanded `/analytics` into a chart-first trader report with visible P/L,
  win/loss, session, entry-hour, and execution-habit charts near the top.
- Renamed "CSV Dry Run" to "Import Trades" on user-facing surfaces.
- Removed or demoted internal wording such as saved sqlite, sample fallback,
  market gaps, open blocks, analysis failed, diagnostic buckets, fixture, raw
  JSON, and debug from primary user routes.

Latest verification passed:

```powershell
npx tsc --noEmit --pretty false
npm run build
npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-desktop
npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-mobile -g "keeps core mobile routes usable"
npx playwright test tests/e2e/import-dry-run.spec.ts --project=chromium-desktop -g "saves a generic CSV import|shows unavailable daily/4h market context|repairs a missing-quantity"
npx vitest run src/lib/trader-analytics/__tests__/saved-import-api-routes.test.ts src/lib/trader-analytics/__tests__/trader-import-trial-experience.test.ts --reporter=dot
```

Best immediate next step:

- Do a visual tuning pass with screenshots open side-by-side for `/analytics`,
  `/coach`, `/review`, `/trades`, and `/trades/[tradeId]`.
- Tighten long metric-card values and any cramped mobile copy.
- Decide whether remaining advanced/internal sections should move fully under
  `/workspace/admin`.
- Keep auth, billing, deployment, broker OAuth, and new backend persistence out
  of this next pass unless explicitly requested.

## May 8 Resume Update

The most recent work moved from private decision-review calibration into
non-SEO launch-readiness hardening for the end-user app.

Current practical state:

- The public root route `/` is a temporary/landing page and does not represent
  the actual app dashboard.
- Open the real app surface at `http://localhost:3000/workspace` during local
  review.
- Current saved-import persistence is intentionally labeled
  `local_sqlite_single_user`.
- Auth is intentionally deferred only for controlled local/single-user or
  trusted closed-beta testing.
- Do not invite unrelated users or mix unrelated customer data in one
  environment until auth, account isolation, authorization, backups/migrations,
  and deletion/export controls exist.
- Trader Intelligence should not be marketed as short-seller coaching yet.
  Keep coaching copy focused on long-side execution review and
  trade-management feedback.

Deployment state:

- Do not upload/deploy this app yet unless the target Vercel project is
  explicit.
- This repo currently has no `.vercel/project.json`.
- The discovered Vercel account only exposed the existing `vercel-landing`
  project, which is the landing-page-only project. Do not deploy the full
  `trader-intelligence-v2` app over that project.
- When deployment is actually desired, link/create the intended Trader
  Intelligence app project first, then run a hosted smoke test against the
  preview URL.

Latest non-SEO verification:

- Local browser opened: `http://localhost:3000/workspace`.
- Local route smoke returned `200 OK` for `/`, `/workspace`, `/trades`,
  `/import-dry-run`, and `/platform-readiness`.
- Focused production-mode Playwright smoke passed on Chromium desktop:
  `20` passed, `2` skipped for project-specific mobile/Firefox coverage.
- Previous full verification in this branch passed: full Vitest `914` tests,
  TypeScript, `npm run build`, saved-import calibration, and Playwright
  app-hardening/regression/saved-route checks.

Best immediate next step:

- Keep deployment paused.
- Continue local app review from `/workspace`, especially import, saved trades,
  review queue, coach, and progress surfaces.
- If/when deployment is requested, first link the correct Vercel app project,
  then run the hosted CSV smoke with one clean CSV and one repaired-row CSV.

## Current State

`trader-intelligence-v2` is on branch `audit-refactor-apr16`.

The current active branch of work is real IBKR CSV decision-review calibration
using the sibling `levels-system` candle warehouse in replay mode. The intended
market-data path is:

- IBKR provider
- `levels-system/data/candles` warehouse replay
- no silent stub fallback for real trade-analysis requests

Preserve the app boundary:

- `levels-system` owns candle fetching, candle warehouse/cache,
  support/resistance, VWAP/EMA, market structure, and neutral market facts.
- `trader-intelligence-v2` owns broker CSV import, execution grouping, P/L,
  sizing, journal/review UI, behavior/coaching, calibration reports, and
  truthful display of market-data readiness.
- Trader Intelligence should not tune coaching against missing, stubbed, or
  price-basis-mismatched candle data.

## Latest Calibration Baseline

Latest all-eligible private IBKR/warehouse replay artifact:

- `artifacts/real-csv-calibration/private/ibkr-april-all-eligible-after-undersized-visible-insight-v2.json`
- readiness:
  `artifacts/real-csv-calibration/private/ibkr-april-all-eligible-after-undersized-visible-insight-v2-readiness.md`
- summary:
  `artifacts/real-csv-calibration/private/ibkr-april-all-eligible-after-undersized-visible-insight-v2-summary.md`
- comparison:
  `artifacts/real-csv-calibration/private/ibkr-april-all-eligible-invariant-vs-undersized-visible-insight-v2-comparison.md`

Final state:

- requested trades: `208`
- analyzable trades: `206`
- completed reviews: `204`
- diagnostics: `4`
- open skipped trades: `2`
- market context: `levels_system_daily_4h=204`
- trade-window evidence:
  - `levels_system_trade_window=199`
  - `execution_only_fallback=5`
- execution-only fallback symbols:
  - `DGNX`: `2`
  - `ISPC`: `2`
  - `VEEE`: `1`
- weak/no daily/4h level evidence rows: `22`
- unsafe candle-basis rows: `5`
- missing trade-window excursion insights: `0`
- extreme excursion metrics: `2`
- fallback/generic headlines: `0`
- stale/contradictory behavior buckets: all `0`

Interpretation:

- `VEEE`, `ISPC`, and `DGNX` are execution/P&L-only because warehouse candles
  and broker executions look like different price bases, likely reverse-split or
  corporate-action mismatch cases.
- `AVEX` and `ELMT` still return `market_context_unavailable` because higher
  timeframe daily/4h history is insufficient.
- `MAXN -> MAXNQ` remains a narrow explicit alias policy. The app should warn
  when PINK/alias data was used, but it should not start a broad ticker-research
  workflow.
- SKLZ extreme movement was audited and confirmed real; keep it monitored but
  do not "fix" it away.

## Latest Code Changes To Preserve

Decision review behavior alignment:

- `src/lib/trade-analysis/review/build-trade-decision-review.ts`
  - fixed premature-exit post-exit continuation threshold to use `0.05`, not
    `5`
  - suppresses stale premature-exit, profit-protection, and fix-first labels
    unless visible review evidence supports them
  - suppresses `profit_protection_failed` when the same exit is also visibly
    `exit_captured_trade_well`
  - gives visible `adds_increased_risk_into_weakness` headline priority
  - adds visible `winner_stayed_undersized` scaling risk insight for
    underutilized-winner behavior evidence

Calibration invariant/reporting helpers:

- `src/lib/trader-analytics/server/decision-review-calibration-readiness.ts`
  - counts stale/contradictory product-facing behavior states
  - includes the new stale `undersized_winner` visibility guard
- `src/scripts/summarize-market-data-readiness.ts`
- `src/scripts/summarize-decision-review-calibration.ts`
- `src/scripts/compare-decision-review-calibrations.ts`
  - all now print the behavior invariant counts
- `src/lib/trader-analytics/__tests__/decision-review-calibration-readiness.test.ts`
  - regression coverage for the invariant buckets

Other adjusted tests/fixtures:

- `src/lib/trader-analytics/__fixtures__/decision-review-csv-scenarios.ts`
- `src/lib/trade-analysis/__tests__/build-trade-analysis-summary.test.ts`
- `src/lib/trader-analytics/__tests__/csv-dry-run-decision-review-quality-dashboard.test.ts`

Docs updated:

- `src/docs/behavior-family-calibration-audit-2026-05-06.md`
- `src/docs/codex-project-log.md`

## Audit Results From The Last Chat

Completed eight-step pass:

1. Added regression tests for behavior contradiction buckets.
2. Added calibration invariant helper fields and exported counters.
3. Ran focused tests and TypeScript.
4. Reran all-eligible calibration and summary/comparison artifacts.
5. Audited `none` fix-first rows.
6. Audited `Entry was not close to daily/4h support.` headline family.
7. Audited `undersized_winner`.
8. Audited late-range add rows.

Findings:

- `none` fix-first rows: `103`; mostly entry-location, late-range add, or
  constructive/no-registered-family cases.
- entry-not-near-support headline rows: `57/57` have visible
  `entry_far_from_daily_4h_support` evidence.
- `undersized_winner` stale visible-insight labels improved `16 -> 0`.
- late-range add rows: `34/34` have visible
  `adds_after_trade_already_used_range` evidence.
- Most late-range add rows should stay no-fix because late/extended adding is
  not automatically `adding_into_weakness`.

## Verification Passed

Latest focused verification:

```bash
npx vitest run src/lib/trader-analytics/__tests__/decision-review-calibration-readiness.test.ts src/lib/trade-analysis/__tests__/build-trade-analysis-summary.test.ts src/lib/trader-analytics/__tests__/csv-dry-run-decision-review-quality-dashboard.test.ts --reporter=dot
npx tsc --noEmit --pretty false
```

Both passed.

Latest all-eligible calibration command pattern:

```powershell
$artifact = 'artifacts/real-csv-calibration/private/ibkr-april-all-eligible-after-behavior-invariant-guards.json'
$csvPath = (Get-Content -Path $artifact -Raw | ConvertFrom-Json).csvPath
$env:LEVELS_SYSTEM_PROVIDER = 'ibkr'
$env:LEVELS_SYSTEM_WAREHOUSE_DIRECTORY = '..\levels-system\data\candles'
$env:LEVELS_SYSTEM_WAREHOUSE_MODE = 'replay'
npm run calibrate:decision-review -- --csv="$csvPath" --broker=ibkr_activity_statement --account-timezone=America/Toronto --max-trades=999 --generated-at=<timestamp> --json --out=<private-output-json> --no-history
```

Use the `csvPath` from an existing private artifact instead of typing or
revealing the private CSV path.

## Git And GitHub State

Remote:

- `origin`: `git@github.com:traderslink-bot/traderslink-trader-improvement-system.git`

Branch:

- `audit-refactor-apr16`

The worktree is very dirty with many pre-existing tracked and untracked files
from earlier work. Do not run destructive cleanup. Do not revert unrelated
files.

GitHub was not updated from the last chat because there is no clean, safe commit
scope yet: the branch contains a large mixed workspace, private calibration
artifacts are local/private, and committing/pushing blindly would risk bundling
unrelated or sensitive work. Before a GitHub push, create a deliberate commit
scope that includes only the reviewed source/docs changes and excludes private
CSV artifacts.

## Best Next Step

Highest-value next work in a fresh chat:

1. Inspect the import dry-run UI/reporting surface and make sure the new
   invariant counters and `winner_stayed_undersized` insight are displayed
   clearly enough for the user.
2. If UI changes are made, run the relevant Vitest suite, TypeScript, and a
   browser/Playwright check for `/import-dry-run`.
3. Separately, if doing provider work, stay targeted: AVEX/ELMT higher-timeframe
   availability and VEEE/ISPC/DGNX price-basis diagnostics only. Do not
   bulk-fetch more candles and do not treat split/basis mismatches as normal
   candle availability.

Avoid next:

- broad behavior-family rewrites
- broad candle backfill
- adding a full alias-discovery/ticker-research workflow
- hiding market-data diagnostics behind silent fallback
