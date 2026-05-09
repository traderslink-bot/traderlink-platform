# Codex Project Log

## Purpose

This file is a compact working log for ongoing collaboration in this repo.

It exists to help with:

1. remembering the current practical state of the system
2. tracking major architecture and implementation changes
3. capturing the most important next ideas
4. keeping a concise bridge between the detailed architecture docs and the actual work being done

This file is not meant to replace the deeper layer docs.
It is meant to summarize progress and maintain continuity.

---

## Fast Resume Protocol

If a future session needs to recover context quickly, use this order:

1. Read this file first
2. Read `src/docs/behavior-coverage-audit.md`
3. Read:
   - `src/docs/layer2-pattern-detection/layer2-pattern-detection-overview.md`
   - `src/docs/layer2-pattern-detection/layer2-to-layer3-handoff.md`
   - `src/docs/layer1-raw-data/layer1-handoff-summary.md`
   - `src/docs/trader-feedback-capabilities.md` when the question is about
     what the app can already tell an end user
4. Inspect the current implementation entry points:
   - `src/lib/pattern-input/builders/build-pattern-input.ts`
   - `src/lib/pattern-detection/detect-patterns.ts`
   - `src/lib/pattern-detection/registry/pattern-definitions.ts`
   - `src/lib/pattern-normalization/normalize-detected-patterns.ts`
   - `src/lib/pattern-scoring/builders/build-pattern-scoring-input.ts`
   - `src/lib/pattern-scoring/builders/build-pattern-scoring-result.ts`
   - `src/lib/trade-analysis/run-trade-analysis.ts`
   - `src/lib/behavior-analysis/builders/build-behavior-analysis.ts`
   - `src/lib/coaching/builders/build-trade-coaching-output.ts`
   - `src/lib/coaching/builders/build-trade-feedback-from-scoring.ts`
5. Run the fastest verification commands if behavior changed:
   - `npm test`
   - `npm run verify:levels-system` when shared support/resistance changed
   - `npm run verify:layer2`
   - `npm run verify:layer3`

This is the intended refresh path.

It should be enough to recover:

- what the system is
- what layer boundaries matter
- what is already implemented
- what the current next work likely is

---

## Collaboration Permission

The user explicitly authorized Codex to flag any doc, plan item, or proposed
feature that seems weak, vague, misleading, or not appropriate for the app,
instead of implementing it blindly.

That permission should carry forward in future sessions.

If a future session disagrees with a documented direction, it should say what
it disagrees with and why.

---

## Project Reminder

This app is a trader-improvement engine.

The core goal is to understand:

- what the trader did
- what the market did
- how those two interacted over time
- which decisions improved the trade
- which decisions damaged the trade

The app is built in layers.

### Layer 1
Raw trade timeline and factual derived signals

### Layer 2
Pattern detection from `PatternInput`

### Layer 3
Pattern normalization and prioritization

### Layer 4+
Scoring, coaching, narrative, and later trader-level intelligence

Important project rule:

- lower layers must stay factual
- higher layers must not bypass lower-layer contracts
- Layer 1 does not coach or judge
- Layer 2 detects structure and events
- Layer 3 decides what matters most

---

## Current Resume Point

### Fresh Chat Handoff Added

Current fresh-chat handoff:

- `src/docs/trader-intelligence-next-chat-handoff-2026-05-05.md`

Use it first in a new chat. It supersedes the stale next-step bullets in older
handoff sections by summarizing:

- current first-100 private IBKR baseline
- `levels-system` historical backfill/as-of dependency
- new market-data readiness and comparison scripts
- exact rerun commands after `levels-system` changes
- verification commands from the latest work

The best next step is still to wait for or inspect the sibling `levels-system`
historical as-of/backfill work, then rerun the first-100 calibration in this
repo and compare against the saved baseline.

### 2026-05-04 Historical Intraday Candle Dependency Audit

User flagged an important data-boundary risk:

- this app analyzes imported completed trades, often from historical dates
- the related levels/watchlist app is optimized around current watchlist/live
  monitoring, with daily/4h support-resistance context and limited recent
  intraday candles
- this app cannot assume the watchlist app has retained the 1m/5m candle window
  for the actual historical execution period

Code audit result:

- the app already has a shared-engine trade-window candle path via
  `runTradeAnalysisFromLevelsSystemCandles(...)`
- that path calls `levels-system` `buildTradeAnalysisCandleContext(...)`
- `levels-system` defaults the trade-window timeframe to `1m` and supports
  explicit `1m` or `5m` windows around the imported execution timestamps
- support/resistance still uses the shared `daily` / `4h` / `5m` context with
  default lookbacks of `520`, `180`, and `120` bars
- batch/API debug analysis uses the trade-window candle path, not the older
  provided-candle path
- important correction: this repo still contains a legacy local
  `buildSupportResistanceContext(...)` implementation that builds pivots,
  local support/resistance ladders, VWAP, and EMA from supplied candles
- even some shared-engine paths currently call `createRawTradeTimeline(...)`
  first, which means local structure can be computed transiently before shared
  `levels-system` support/resistance, VWAP, and EMA overwrite it

Important risk that remains:

- provider availability for months-old `1m` / `5m` candles is not guaranteed
- the product workflow must not rely on watchlist-retained intraday candles
- the desired product architecture is that support/resistance, VWAP, EMA, and
  related candle structure are owned by `levels-system`, not this app
- this app should map and consume shared-engine context, or clearly mark an
  old path as legacy/test-only, rather than building those levels locally in
  production analysis
- imported-trade analysis should set or derive an analysis-time
  `asOfTimestamp` from the trade/session, not accidentally use current-time
  candles for old trades
- if `1m` is unavailable, fallback behavior should be explicit and truthful
  rather than silently overclaiming candle-confirmed feedback

Best next step:

- before or alongside the `/import-dry-run` analysis panel work, add a small
  product contract/check around historical intraday candle readiness: confirm
  `1m` preferred, `5m` fallback, provider diagnostics surfaced, and no
  support/resistance/VWAP/EMA claims are shown when historical trade-window
  candles are missing or stale.
- add a follow-up cleanup task to stop production/shared-engine flows from
  invoking the local legacy support/resistance builder at all; keep any local
  builder only as explicit legacy/test comparison code if it is still useful.

Follow-up implementation completed:

- `createRawTradeTimeline(...)` no longer calls the local
  `buildSupportResistanceContext(...)`
- plain raw timeline analysis no longer attaches locally built
  support/resistance, VWAP, EMA, gap structure, or execution-level relations
- app-facing shared analysis still attaches those fields only through
  `levels-system`
- the old `legacy_local` mode was renamed to `provided_candles_only` to avoid
  implying this app has an approved local support/resistance mode
- remaining local support/resistance builder files are not called by app/source
  analysis paths; they remain only as old module/test code unless removed in a
  later cleanup

Verification:

- focused raw timeline / shared levels / summary tests passed
- `npm run verify:levels-system` passed with `21` files / `71` tests
- `npx tsc --noEmit --pretty false` passed
- `npm test` passed with `87` files / `797` tests

Later same-night alignment with the levels-system agent:

- `levels-system` now exposes the recommended public default boundary:
  `buildDefaultTradeAnalysisCandleContext(...)`
- the shared candle integration in this app now prefers that default builder
  when no explicit test/custom fetch service is supplied
- custom test fetch services still use the direct
  `buildTradeAnalysisCandleContext(...)` path so deterministic fixtures remain
  possible
- raw timeline dynamic levels for the shared trade-window path now map from
  `context.tradeWindow.dynamicLevels`, keeping VWAP/EMA tied to the actual
  fetched `1m`/`5m` trade window
- tests now assert `requestedTimeframe`, `fallbackUsed`, trade-window dynamic
  levels, and neutral `tradeWindowFacts`

Additional implementation completed:

- `createRawTradeTimelineWithLevelsSystemCandles(...)` now explicitly derives
  `tradeStartTimestamp` and `tradeEndTimestamp` from imported executions when
  possible
- the same bridge derives a bounded `asOfTimestamp` from
  `tradeEndTimestamp + postTradeMinutes + paddingMinutes` when the caller does
  not provide one, so historical trade-window analysis does not drift into
  future candles
- every imported execution/fill continues to be forwarded to `levels-system`
  as `{ timestamp, price, quantity, side }`
- `RawTradeTimelineBuildResult` now exposes neutral
  `levelsSystemTradeWindowFacts` and `levelsSystemExecutionRelations`
- `PatternInput` consumes matching levels-system trade-window MFE/MAE facts
  with unit conversion while preserving local P/L, sizing, review, and behavior
  responsibilities
- tests cover all-fill forwarding, bounded timestamp/as-of behavior, `1m`
  preference with `5m` fallback diagnostics, and PatternInput use of the
  neutral trade-window facts

Verification:

- `npx tsc --noEmit --pretty false` passed
- focused trade-window / pattern input / summary tests passed
- `npm run verify:levels-system` passed with `21` files / `73` tests
- `npm test` passed with `87` files / `799` tests

2026-05-04 market-context direction tightened:

- Product direction changed to avoid VWAP/EMA-driven trader feedback for now
- `PatternInput` now neutralizes VWAP/EMA relation fields even when
  `levels-system` returns dynamic benchmark data
- feedback-facing support/resistance levels mapped from `levels-system` are
  filtered to levels with `daily` or `4h` in `timeframeSources`
- `1m`/`5m` historical candles remain important for trade-window measurements
  such as MFE/MAE, high/low during hold, and bounded post-exit continuation
- lower-timeframe support/resistance is deferred until a later tactical-context
  layer
- levels-system handoff docs `73` and `74` were updated so the sibling project
  knows the current contract: daily/4h levels for feedback, no VWAP/EMA
  feedback, 1m/5m only for movement facts

2026-05-04 execution-intelligence project review completed:

- created
  `src/docs/trader-execution-intelligence-project-review-2026-05-04.md`
- clarified the competitive product target: explain execution decisions in
  market/trade context, not just journal trades and show reports
- ran deterministic trade-analysis debug simulations through the current
  levels-system trade-window path
- generated artifacts under `artifacts/trade-analysis-current-review*`
- simulations completed for sample, long/short winners and losers, partial
  exits, open-position warning, rapid-fire execution cluster, inconsistent
  sizing, and repeated-add scenarios
- sample simulation produced `4` support / `2` resistance levels and `22`
  detected / `22` normalized patterns
- repeated-adds simulation produced `3` support / `8` resistance levels and
  `27` detected / `27` normalized patterns
- conclusion: the analysis engine is ready enough for the next product step;
  the main gap is surfacing prototype analysis inside `/import-dry-run`
- next implementation step remains
  `buildCsvDryRunPrototypeAnalysisPanel(...)`, then wire it into
  `/import-dry-run`

2026-05-04 first trade decision review bridge added:

- added `src/lib/trade-analysis/review/build-trade-decision-review.ts`
- `TradeAnalysisSummary` now includes `decisionReview`
- `decisionReview` converts normalized patterns into pattern scoring, behavior
  analysis, coaching output, and concrete decision insights
- current insight groups are entry, scaling, exit, market context, and
  trade-window movement
- review output explicitly records daily/4h-only level feedback and
  `vwapEmaFeedbackUsed: false`
- debug dashboard markdown now includes a Decision Review section
- CLI debug output now prints coaching focus and top insight
- repeated-adds simulation now surfaces a fix-first coaching behavior and
  insights such as chase/late-extension risk and adds after much of the move was
  already used
- `levels-system` now returns daily/4h-specific benchmark IDs
  (`nearest_daily_4h_support`, `nearest_daily_4h_resistance`) and the local
  contract test was updated to match
- verification passed:
  - `npx tsc --noEmit --pretty false`
  - `npm run verify:levels-system` with `21` files / `74` tests
  - `npm test` with `87` files / `800` tests

### 2026-05-03 Functional Readiness User Workflow Plan Created

The next planned branch is documented in:

- `src/docs/trader-functional-readiness-user-workflow-plan.md`

The short read-first handoff for a fresh chat is:

- `src/docs/trader-functional-readiness-next-handoff.md`

What changed:

- created a detailed next-branch plan for wiring the completed functional
  readiness engine into the user-facing `/import-dry-run` workflow
- created a handoff note summarizing completed work, verification, boundaries,
  files to inspect next, and GitHub status
- updated README roadmap/handoff links so the new plan and handoff are
  discoverable
- no implementation work from the new plan has started yet
- no GitHub push or PR was created because the workspace has many existing
  modified/untracked files and this request only required docs/handoff prep

Best next step:

- in the next chat, read
  `src/docs/trader-functional-readiness-next-handoff.md`, then implement Step 2
  from `src/docs/trader-functional-readiness-user-workflow-plan.md`: add the
  `/import-dry-run` prototype analysis panel view model and focused unit tests.

### 2026-05-03 Trader Functional Product Readiness Complete

The functional readiness branch is documented in:

- `src/docs/trader-functional-product-readiness-plan.md`

What changed:

- added `src/lib/trader-analytics/product/functional-readiness.ts`
- added import confidence states: `empty`, `blocked`, `needs_review`,
  `ready_for_analysis`, `prototype_saved`, and `rejected`
- added a prototype import-to-saved-analysis bridge that converts accepted CSV
  dry-run grouped trades into execution feedback summaries and an in-memory
  trader analytics report
- added deeper execution-only autopsy observations with evidence refs for
  first mistake/strength, best/worst add, best/worst reduction, giveback review,
  and position escalation
- added deterministic synthetic trader personas for overtrading, clean scalping,
  revenge-like re-entry pressure, poor exits, strong risk management, and
  inconsistent sizing
- added deterministic execution math fuzz scenarios for long/short winners and
  losers, partial exits, open leftovers, invalid exit-before-entry, rapid-fire
  fills, and rejected CSV rows
- added truth-source auditing so strong product claims must cite trade,
  execution, import row, feedback point, state, or metric evidence
- added a functional readiness dashboard and real-data calibration harness that
  stay prototype-only and avoid live broker, candle, or market-structure calls
- updated `/platform-readiness` with functional loop, behavior test harness,
  calibration, and live-readiness blocker panels
- no production persistence, auth, billing, export/download, candle fetching,
  support/resistance generation, VWAP/EMA, or market-structure scoring was added

Verification completed so far:

- `npx vitest run src/lib/trader-analytics/__tests__/trader-functional-product-readiness.test.ts`
- `npx vitest run src/lib/trader-analytics/__tests__/trader-functional-product-readiness.test.ts src/lib/trader-analytics/__tests__/platform-ready-feature-module.test.ts`
- `npm run test:e2e`
- `npx tsc --noEmit --pretty false`
- `npm run lint` with 4 existing warnings and 0 errors
- `npm run build`
- `npm run verify:all`
- `npm audit`

Best next step:

- use the new readiness dashboard and calibration harness when anonymized real
  broker CSVs become available, then inspect any false positives in the
  synthetic persona and execution-autopsy outputs.

### 2026-05-03 Trader Actual App QA Complete

The actual-app QA and visual smoke branch is documented in:

- `src/docs/trader-actual-app-qa-and-visual-regression-plan.md`

What changed:

- added `@axe-core/playwright` as the browser accessibility smoke dependency
- added `tests/e2e/app-actual-qa.spec.ts`
- added screenshot-backed visual smoke for `/`, `/first-run`,
  `/import-dry-run`, `/analytics`, `/review`, `/progress`, and
  `/trades/trade-rapid-fire`
- added critical/serious axe accessibility scans for core rough-product routes
- added deterministic import workflow stress coverage for broker switching,
  unknown mapping repair, setup/playbook tagging, grouping decision state,
  feedback reviewed state, and Schwab review-state import
- added metric-to-evidence tests proving analytics, progress, and guided review
  links open source trade detail pages with execution replay, trade quality, and
  decision autopsy evidence
- added mobile interaction coverage for rejected-row repair and trade autopsy
  readability, not just static route rendering
- added product truthfulness guards across core route visits and import workflow
  state
- added CSV torture coverage for duplicate executions, reversed timestamps,
  partial fills, short trades, open positions, mixed symbols, fees/commissions,
  weird date formats, extra unknown columns, and small share sizes
- added a rough product walkthrough from home to first-run, import repair,
  analytics, trade detail, guided review, and progress
- improved dark helper-text contrast through `app/globals.css`
- added explicit accessible names to import dry-run controls, mapping fields,
  row repair inputs, grouping/setup selects, and analytics filter selects
- hardened browser failure traps for Firefox favicon abort noise
- no candle fetching, support/resistance building, VWAP/EMA work, or market
  structure work was added in this app

Files changed:

- `tests/e2e/app-actual-qa.spec.ts`
- `app/globals.css`
- `app/import-dry-run/import-dry-run-client.tsx`
- `app/analytics/analytics-client.tsx`
- `app/page.tsx`
- `tests/e2e/app-first-user-hardening.spec.ts`
- `src/docs/trader-actual-app-qa-and-visual-regression-plan.md`
- `README.md`
- `src/docs/codex-project-log.md`
- `package.json`
- `package-lock.json`

Verification completed:

- `npx playwright test tests/e2e/app-actual-qa.spec.ts --project=chromium-desktop`
  passed with 7 tests and 1 expected mobile-scope skip
- `npx playwright test tests/e2e/app-actual-qa.spec.ts --project=chromium-mobile`
  passed with 2 tests and 6 expected desktop-scope skips
- `npx playwright test tests/e2e/app-first-user-hardening.spec.ts --project=firefox-smoke`
  passed with 1 Firefox smoke test and 7 expected skips
- `npm run test:e2e` passed with 48 Playwright browser tests and 71 expected
  viewport/project-scope skips
- `npx tsc --noEmit` passed
- `npm run lint` passed with 0 errors and the same 4 pre-existing warnings
- `npm run build` passed
- `npm run verify:all` passed with 86 Vitest files / 787 tests plus
  levels-system, Layer 2, and Layer 3 checkpoints
- `npm audit` passed with 0 vulnerabilities

Best next step:

- keep the new actual-app QA suite as the browser safety net while building new
  product surfaces; the next truly new product branch should wait for either
  real saved import batches or a deliberate UI/design-system pass

### 2026-05-03 Trader First-User Hardening Complete

The first-user and app-hardening branch is documented in:

- `src/docs/trader-first-user-and-hardening-test-plan.md`

What changed:

- added `/first-run` as the honest no-saved-trades starting point for a future
  user who has no saved imports, no analytics report, no review history, and no
  connected broker
- linked `/first-run` from the home workspace
- added `tests/e2e/app-first-user-hardening.spec.ts`
- added a narrow Playwright `firefox-smoke` project for the first-run route set
- proved a first user can go from `/first-run` to `/import-dry-run`, upload a
  synthetic CSV, repair a rejected row, and reach execution-only feedback
  preview without saved persistence
- added no-trades boundary coverage and safe missing-trade route behavior
- added a home internal-link crawler that fails on app error copy, 404 copy,
  HTTP `>= 400`, browser console errors, page errors, and failed requests
- added accessibility smoke for import controls, mapping controls, analytics
  filters, and keyboard focus through key import controls
- added local performance smoke for `/`, `/first-run`, `/import-dry-run`,
  `/analytics`, and `/trades/trade-rapid-fire`
- added CSV abuse coverage for blank, header-only, wrong-delimiter,
  duplicated-header, bad numeric, large synthetic, and mixed stock/options-like
  CSV inputs
- added truthfulness guards across core product routes for export/download,
  production persistence, auth/billing, connected-broker, and market-structure
  scoring overclaims
- no candle fetching, support/resistance building, VWAP/EMA work, or market
  structure work was added in this app

Files changed:

- `app/first-run/page.tsx`
- `app/page.tsx`
- `playwright.config.ts`
- `tests/e2e/app-first-user-hardening.spec.ts`
- `src/docs/trader-first-user-and-hardening-test-plan.md`
- `README.md`
- `src/docs/codex-project-log.md`

Verification completed:

- `npx playwright test tests/e2e/app-first-user-hardening.spec.ts --project=chromium-desktop`
  passed with 7 tests and 1 expected skip
- `npx playwright test tests/e2e/app-first-user-hardening.spec.ts --project=firefox-smoke`
  passed with 1 Firefox smoke test and 7 expected skips
- `npm run test:e2e` passed with 39 Playwright browser tests and 56 expected
  viewport/project-scope skips
- `npx tsc --noEmit` passed
- `npm run lint` passed with 0 errors and the same 4 pre-existing warnings
- `npm run build` passed and includes `/first-run`
- `npm run verify:all` passed with 86 Vitest files / 787 tests plus
  levels-system, Layer 2, and Layer 3 checkpoints
- `npm audit` passed with 0 vulnerabilities

Best next step:

- keep using the browser suites as the product safety net, then add the next
  high-value test around real saved import batches once persistence exists; no
  levels-system update is needed from this branch

### 2026-05-03 Trader App Acceptance Testing Complete

The app acceptance testing branch is documented in:

- `src/docs/trader-app-acceptance-testing-plan.md`

What changed:

- added `tests/e2e/app-acceptance.spec.ts`
- added stable acceptance-test hooks to:
  - `app/analytics/analytics-client.tsx`
  - `app/import-dry-run/import-dry-run-client.tsx`
  - `app/trades/[tradeId]/page.tsx`
  - `app/progress/page.tsx`
  - `app/review/page.tsx`
- expanded browser automation from route/panel checks into actual user-flow
  acceptance tests
- all sample saved trades now open through `/trades/{tradeId}` and prove the
  trade autopsy contract: execution replay, replay steps, review points,
  trade quality, and decision autopsy
- `/analytics` now has tested interactions for symbol/outcome filters,
  drill-down selection, filtered row counts, excluded-row removal, and opening
  filtered trade evidence
- `/import-dry-run` now has tested user recovery for unknown CSV headers via
  explicit column mappings and rejected row repair via editable cells
- `/progress` now proves execution quality trendline links open source trade
  reviews
- `/review` now proves related trade links open source trade reviews without
  persistence overclaims
- mobile Playwright now loops every sample trade detail page and guards
  page-level horizontal overflow
- product-boundary acceptance guards block export/download, debug JSON,
  production persistence, auth/billing, and market-context scoring overclaims
  on core rough product pages
- no candle fetching, support/resistance building, VWAP/EMA work, or market
  structure work was added in this app

Verification completed:

- `npm run test:e2e` passed with 31 Playwright browser tests and 32 intentional
  viewport-scope skips
- `npx tsc --noEmit` passed
- `npm run lint` passed with 0 errors and the same 4 pre-existing warnings
- `npm run verify:all` passed with 86 Vitest files / 787 tests plus
  levels-system, Layer 2, and Layer 3 checkpoints
- `npm audit` passed with 0 vulnerabilities

Best next step:

- keep adding acceptance tests only when a flow is stable enough to behave like
  a product contract; the highest-value next test target would be an empty-state
  / first-user experience once the app has a no-trades fixture

### 2026-05-03 Trader App Feature Regression QA Complete

The app-wide browser regression branch is documented in:

- `src/docs/trader-app-feature-regression-qa-plan.md`

What changed:

- added `tests/e2e/app-feature-regression.spec.ts`
- expanded Playwright from the single `/import-dry-run` route into a broader
  rough-product regression suite
- added smoke coverage for `/`, `/analytics`, `/imports`, `/import-dry-run`,
  `/review`, `/progress`, `/trades/trade-rapid-fire`, `/coach`,
  `/session-recap`, `/import-health`, `/import-trials`, `/repair-wizard`,
  `/review-cockpit`, `/calibration`, `/compare-trades`, `/onboarding`,
  `/account`, and `/platform-readiness`
- added browser failure traps for console errors, uncaught page errors, failed
  requests, and HTTP responses at status `>= 400`
- added representative broker CSV UI import coverage for IBKR, Webull,
  Robinhood, Moomoo, Schwab, and generic CSV
- added import repair coverage for missing quantity, bad timestamp, unknown
  headers, cancelled/skipped rows, open-position leftovers, duplicate-like
  fills, and low-confidence mappings
- added product-surface checks for analytics, trade detail autopsy, guided
  review, progress, behavior visuals, rule surfaces, and daily coach reporting
- added mobile route overflow coverage for `/import-dry-run`, `/analytics`,
  `/trades/trade-rapid-fire`, `/review`, and `/progress`
- added screenshot smoke attachments for the core product routes across
  desktop, tablet, and mobile projects
- added market-context overclaim guards so candle/market-structure context
  remains observational and cannot be presented as import QA, execution-only
  scoring, rule pass/fail, or final coaching evidence
- added an end-to-end demo path from home to CSV dry run, row repair,
  feedback preview, analytics, trade detail, review, and progress
- fixed a real `/analytics` mobile horizontal overflow by allowing the trade
  table grid/card containers to shrink and scroll internally

Files changed:

- `tests/e2e/app-feature-regression.spec.ts`
- `app/analytics/analytics-client.tsx`
- `src/docs/trader-app-feature-regression-qa-plan.md`
- `README.md`
- `src/docs/codex-project-log.md`

Verification completed:

- `npm run test:e2e` passed with 24 Playwright browser tests and 18 intentional
  viewport-scope skips
- `npx tsc --noEmit` passed
- `npm run lint` passed with 0 errors and the same 4 pre-existing warnings
- `npm run verify:all` passed with 86 Vitest files / 787 tests plus
  levels-system, Layer 2, and Layer 3 checkpoints
- `npm audit` passed with 0 vulnerabilities

Best next step:

- keep using the new Playwright suite as the product safety net, then add the
  next high-value browser journey only when a new route or flow becomes stable
  enough to warrant app-level regression coverage

### 2026-05-03 Trader Import Playwright E2E Harness Complete

The browser-backed import QA branch is documented in:

- `src/docs/trader-import-automated-qa-harness-plan.md`

What changed:

- added Playwright as the real browser E2E layer for `/import-dry-run`
- installed Chromium for local Playwright runs
- added `playwright.config.ts`
- added `tests/e2e/import-dry-run.spec.ts`
- added stable E2E hooks to the dry-run import UI controls that the tests touch
- updated the visual regression contract from screenshot-ready only to
  `playwright_chromium`
- changed `npm run test:e2e` to build the app and run Playwright against
  `next start` on isolated port `3100`, avoiding stale `next dev` state
- verified the route in Chromium desktop, tablet, and mobile viewports
- covered required product panels, banned unsafe surface copy, local CSV file
  input, rejected-row repair, setup/playbook tagging, feedback reviewed state,
  screenshot smoke, and page-level horizontal overflow
- fixed a duplicate React key warning in the import confidence gate reason list
  surfaced by the browser run
- kept the test branch execution/import-only; no candles, support/resistance,
  VWAP/EMA, market structure, broker credentials, persistence, auth, billing,
  export, or download flow was added

New implementation:

- `playwright.config.ts`
- `tests/e2e/import-dry-run.spec.ts`
- `app/import-dry-run/import-dry-run-client.tsx`
- `src/lib/trader-analytics/product/csv-dry-run-automated-qa.ts`
- `src/lib/trader-analytics/__tests__/trader-import-automated-qa-harness.test.ts`
- `package.json`
- `package-lock.json`

Verification completed:

- `npm run test:e2e` passed with 9 Chromium browser tests across desktop,
  tablet, and mobile
- `npx vitest run src/lib/trader-analytics/__tests__/trader-import-automated-qa-harness.test.ts`
  passed with 1 file / 8 tests
- `npx vitest run src/lib/trader-analytics/__tests__` passed with 18 files /
  126 tests
- `npx tsc --noEmit` passed
- `npm run verify:all` passed with 86 files / 787 tests plus shared-engine,
  Layer 2, and Layer 3 checkpoints
- `npm run lint` passed with 0 errors and the same 4 pre-existing warnings
- `npm run build` passed as part of `npm run test:e2e`

Follow-up dependency audit update:

- `npm audit` originally reported 2 moderate findings from `postcss` under
  Next
- `npm audit fix` could not safely clear the remaining finding and recommended
  `npm audit fix --force`, which would downgrade `next` to `9.3.3`
- instead, the repo now uses root `overrides.postcss: 8.5.13`
- `next` remains on `16.2.3`
- `npm audit --json` now reports 0 vulnerabilities
- post-override verification passed:
  - `npm run test:e2e`
  - `npx tsc --noEmit`
  - `npm run lint`
  - `npm run verify:all`

Best next step:

- add browser coverage for one more high-value end-user path only when the route
  is stable enough to justify it; likely candidates are `/analytics`,
  `/progress`, or `/trades/[tradeId]`

### 2026-05-03 Trader Import Automated QA Harness Complete

The automated import QA branch is documented in:

- `src/docs/trader-import-automated-qa-harness-plan.md`

What changed:

- added a deterministic automated QA harness for `/import-dry-run`:
  `src/lib/trader-analytics/product/csv-dry-run-automated-qa.ts`
- generated CSV mutation cases from fixture-style inputs for missing symbols,
  missing prices, renamed headers, blank rows, account activity rows, cancelled
  orders, duplicated fills, open positions, and weird timestamps
- added a broker regression matrix for IBKR, Webull, Robinhood, Moomoo, Schwab,
  and generic CSV
- added repair impact simulation around `applyCsvDryRunCellEdit`
- added an end-to-end dry-run simulation for mapping repair, row repair, setup
  tagging, decision capture, and feedback preview
- added no-market-context guard checks proving import QA stays execution/import
  only
- added route smoke and banned-surface contracts for `/import-dry-run`
- added screenshot-ready desktop/tablet/mobile visual QA targets without adding
  a new browser test dependency
- kept `levels-system` untouched and kept all import QA independent from candle,
  support/resistance, VWAP/EMA, and market-structure logic

New implementation:

- `src/lib/trader-analytics/product/csv-dry-run-automated-qa.ts`
- `src/lib/trader-analytics/__tests__/trader-import-automated-qa-harness.test.ts`
- `src/lib/trader-analytics/index.ts`
- `src/docs/trader-import-automated-qa-harness-plan.md`

Verification completed:

- focused automated QA harness test passed with 1 file / 8 tests
- `npx vitest run src/lib/trader-analytics/__tests__` passed with 18 files /
  126 tests
- `npx tsc --noEmit` passed
- `npm run verify:all` passed with 86 files / 787 tests plus shared-engine,
  Layer 2, and Layer 3 checkpoints
- `npm run lint` passed with 0 errors and the same 4 pre-existing warnings
- `npm run build` passed and produced `/import-dry-run`
- existing dev server smoke passed for
  `http://localhost:3000/import-dry-run`

Best next step:

- when a browser test dependency is intentionally added, connect
  `buildCsvDryRunVisualRegressionContract()` to real desktop/tablet/mobile
  screenshots; until then, use the mutation matrix and broker regression
  harness as the main automated safety net for import changes

### 2026-05-03 Trader Import Intelligence Workflow Expansion Complete

The active import dry-run intelligence branch is documented in:

- `src/docs/trader-import-intelligence-workflow-expansion-plan.md`

What changed:

- expanded `/import-dry-run` with nine new product workflow panels:
  before/after repair impact, P/L reconciliation assistant, readiness score
  breakdown, post-import review queue preview, feedback preview comparison,
  broker mapping learning console, import session summary, execution anomaly
  detector, and setup/playbook tagging
- added deterministic dry-run view-model contracts for all nine panels through
  `CsvDryRunImportExperience`
- added optional repair impact baseline support so local row edits can compare
  against the previous parser state
- added optional setup tag selections so future playbook labels can be captured
  in client state without persistence
- kept all conclusions execution/import-only; no candles, support/resistance,
  VWAP/EMA, or market structure are read locally, and setup tags are explicitly
  not chart-validated
- kept the no-persistence posture: no auth, billing, production storage, raw
  JSON panel, or data-removal product surface was added
- kept `levels-system` untouched

New implementation:

- `src/lib/trader-analytics/product/csv-dry-run-workflow.ts`
- `src/lib/trader-analytics/product/types.ts`
- `src/lib/trader-analytics/index.ts`
- `app/import-dry-run/import-dry-run-client.tsx`
- `src/lib/trader-analytics/__tests__/trader-import-intelligence-workflow-expansion.test.ts`
- `src/docs/trader-import-intelligence-workflow-expansion-plan.md`

Verification completed:

- focused dry-run intelligence tests passed with 3 files / 22 tests
- `npx vitest run src/lib/trader-analytics/__tests__` passed with 17 files /
  118 tests
- `npx tsc --noEmit` passed
- `npm run verify:all` passed with 85 files / 779 tests plus shared-engine,
  Layer 2, and Layer 3 checkpoints
- `npm run lint` passed with 0 errors and the same 4 pre-existing warnings
- `npm run build` passed and produced `/import-dry-run`
- existing dev server smoke passed for
  `http://localhost:3000/import-dry-run`, including all nine new workflow
  panels

Best next step:

- when real anonymized CSVs exist, use the readiness breakdown, anomaly
  detector, mapping learning console, and review queue preview to decide which
  broker mappings and repair outcomes should be promoted into production
  persistence first

### 2026-05-03 Trader Import Repair And Feedback Preview Complete

The active import dry-run deepening branch is documented in:

- `src/docs/trader-import-repair-feedback-preview-plan.md`

What changed:

- extended `/import-dry-run` from a basic preview into a fuller first-import
  workflow surface: editable row repair table, grouping decision controls,
  execution-only feedback preview, first grouped-trade replay preview, broker
  help, matched import error library, privacy notice, mobile QA notes, and
  future decision capture model
- added `applyCsvDryRunCellEdit` so row-level fixes update the current CSV text
  locally and immediately re-run the existing broker parser
- added dry-run execution feedback previews from grouped `UserTradeAnalysisRequest`
  objects without saving trades, fetching candles, or using market structure
- added replay labels for initial entry, add, trim, re-add, full exit, and risk
  direction in the import workflow
- kept all new decisions as client-state-only future persistence events; no
  auth, billing, production storage, raw JSON panel, or data-removal product
  surface was added
- kept `levels-system` untouched; candles, support/resistance, VWAP/EMA, and
  market structure remain owned by the shared engine

New implementation:

- `src/lib/trader-analytics/product/csv-dry-run-workflow.ts`
- `src/lib/trader-analytics/product/types.ts`
- `src/lib/trader-analytics/index.ts`
- `app/import-dry-run/import-dry-run-client.tsx`
- `src/lib/trader-analytics/__tests__/trader-import-repair-feedback-preview.test.ts`
- `src/docs/trader-import-repair-feedback-preview-plan.md`

Verification completed:

- focused repair/feedback dry-run tests passed with 2 files / 13 tests
- `npx vitest run src/lib/trader-analytics/__tests__` passed with 16 files /
  109 tests
- `npx tsc --noEmit` passed
- `npm run verify:all` passed with 84 files / 770 tests plus shared-engine,
  Layer 2, and Layer 3 checkpoints
- `npm run lint` passed with 0 errors and the same 4 pre-existing warnings
- `npm run build` passed and produced `/import-dry-run`
- existing dev server smoke passed for
  `http://localhost:3000/import-dry-run`, including the new row repair,
  feedback preview, replay preview, and error library surfaces

Best next step:

- test `/import-dry-run` with anonymized real broker execution CSVs when they
  become available, then use the repair/decision capture model to decide which
  broker mappings and grouping rules deserve production persistence first

### 2026-05-03 Trader CSV Dry-Run Import UI Complete

The active CSV dry-run UI branch is documented in:

- `src/docs/trader-csv-dry-run-import-ui-plan.md`

What changed:

- added a rough but usable `/import-dry-run` workflow UI where a user can choose
  a synthetic broker sample, open a local CSV, paste CSV text, select broker
  format, set account timezone, and preview the import without saving anything
- added column mapping assistant support for unknown headers, including explicit
  symbol/timestamp/date/time/side/quantity/price/status/fee mapping inputs that
  re-run the existing broker CSV parser
- added dry-run product view models for confidence gate, import session state,
  grouped trade review, first-trade walkthrough, broker coverage confidence,
  evidence drill-in, end-user copy audit, and real-import calibration queue
- wired `/import-dry-run` into home navigation, import review, platform route
  policy, no-export audit, mobile QA contracts, and public exports
- kept the workflow execution-only: no persistence, no auth, no billing, no
  export/download controls, no raw JSON panel, and no candle/market-structure
  dependency

New implementation:

- `src/lib/trader-analytics/product/csv-dry-run-workflow.ts`
- `src/lib/trader-analytics/__tests__/trader-csv-dry-run-import-ui.test.ts`
- `app/import-dry-run/page.tsx`
- `app/import-dry-run/import-dry-run-client.tsx`
- `src/docs/trader-csv-dry-run-import-ui-plan.md`

Verification completed:

- focused dry-run tests passed with 1 file / 7 tests
- `npx vitest run src/lib/trader-analytics/__tests__` passed with 15 files /
  103 tests
- `npx tsc --noEmit` passed
- `npm run verify:all` passed with 83 files / 764 tests plus shared-engine,
  Layer 2, and Layer 3 checkpoints
- `npm run lint` passed with 0 errors and the same 4 pre-existing warnings
- `npm run build` passed and produced `/import-dry-run`
- existing dev server smoke passed at `http://localhost:3000` for `/`,
  `/import-dry-run`, `/imports`, `/import-trials`, `/repair-wizard`,
  `/review-cockpit`, `/calibration`, `/analytics`, and
  `/trades/trade-rapid-fire`

Best next step:

- use `/import-dry-run` as the working rough UI for the first real-import
  product flow; once anonymized real CSV examples exist, compare user repair
  outcomes against the synthetic presets before adding save/analysis persistence

### 2026-05-03 Trader Import Trial And Repair Experience Complete

The active import trial and repair branch is documented in:

- `src/docs/trader-import-trial-and-repair-experience-plan.md`

What changed:

- added a deterministic synthetic broker import trial experience for
  representative IBKR, Moomoo, Webull, Robinhood, Schwab, generic CSV, and
  edge-case execution import coverage
- added an in-app repair wizard model for missing row fields, timestamp issues,
  skipped rows, options quarantine, open-position leftovers, duplicate files,
  grouping review, and P/L reconciliation mismatch
- added a review cockpit that combines import readiness, repair needs, guided
  review, rule lifecycle simulation, trade replay, and progress actions without
  using market context for priority
- added rule lifecycle simulation, trade replay visual contract, product copy
  quality audit, broker fixture library, mobile QA contract, in-app explanation
  records, and a calibration dashboard that waits for real imports
- added `/import-trials`, `/repair-wizard`, `/review-cockpit`, and
  `/calibration` as end-user no-export routes and wired them into home
  navigation, analytics, public exports, and platform route policy
- kept all new conclusions execution-only or fixture-readiness-only; candles,
  support/resistance, and market structure still belong to `levels-system`

New implementation:

- `src/lib/trader-analytics/product/import-trial-experience.ts`
- `src/lib/trader-analytics/__tests__/trader-import-trial-experience.test.ts`
- `app/import-trials/page.tsx`
- `app/repair-wizard/page.tsx`
- `app/review-cockpit/page.tsx`
- `app/calibration/page.tsx`
- `src/docs/trader-import-trial-and-repair-experience-plan.md`

Verification completed:

- focused import-trial tests passed with 1 file / 10 tests
- `npx vitest run src/lib/trader-analytics/__tests__` passed with 14 files /
  96 tests
- `npx tsc --noEmit` passed
- `npm run verify:all` passed with 82 files / 757 tests plus shared-engine,
  Layer 2, and Layer 3 checkpoints
- `npm run lint` passed with 0 errors and the same 4 pre-existing warnings
- `npm run build` passed and produced `/import-trials`, `/repair-wizard`,
  `/review-cockpit`, and `/calibration`
- existing dev server smoke passed at `http://localhost:3000` for `/`,
  `/analytics`, `/import-trials`, `/repair-wizard`, `/review-cockpit`,
  `/calibration`, `/imports`, `/review`, `/progress`, and
  `/trades/trade-rapid-fire`

Best next step:

- when real user imports exist, collect anonymized broker-header/row examples
  and real repair outcomes, then calibrate import repair rates, rule lifecycle
  conversion, review completion, and broker-specific mapping confidence

### 2026-05-03 Trader Review Habit Loop Complete

The active review habit loop branch is documented in:

- `src/docs/trader-review-habit-loop-plan.md`

What changed:

- added a deterministic execution-only review habit loop for mistake-to-rule
  conversion drafts, per-trade review checklists, behavior change tracking,
  user-facing data quality score, coach language refinement, safety-copy audit,
  execution-pattern playbook drafting, trade comparison, review habit metrics,
  and end-user onboarding path
- added `/compare-trades` and `/onboarding` as product-facing end-user routes
  with no raw JSON, CSV, spreadsheet, download, or export affordance
- enhanced `/analytics`, `/coach`, `/imports`, `/review`, `/progress`, and
  `/trades/[tradeId]` with review habit loop panels and checklists
- wired `reviewHabitLoop` into the product trader analytics view model, public
  exports, home navigation, and platform route registry
- kept all new conclusions execution-only; market context remains observational
  and does not affect rule conversion, checklist status, behavior change,
  trade comparison, onboarding, or safety-copy conclusions

New implementation:

- `src/lib/trader-analytics/product/review-habit-loop.ts`
- `src/lib/trader-analytics/__tests__/trader-review-habit-loop.test.ts`
- `app/compare-trades/page.tsx`
- `app/onboarding/page.tsx`

Verification completed:

- focused review-habit tests passed with 1 file / 7 tests
- `npx vitest run src/lib/trader-analytics/__tests__` passed with 13 files /
  86 tests
- `npx tsc --noEmit` passed
- `npm run verify:all` passed with 81 files / 747 tests plus shared-engine,
  Layer 2, and Layer 3 checkpoints
- `npm run lint` passed with 0 errors and the same 4 pre-existing warnings
- `npm run build` passed and produced `/compare-trades` and `/onboarding`
- existing dev server smoke passed at `http://localhost:3000` for `/`,
  `/analytics`, `/coach`, `/compare-trades`, `/imports`, `/onboarding`,
  `/review`, `/progress`, `/session-recap`, and
  `/trades/trade-rapid-fire`

Best next step:

- once real imports exist, calibrate the review habit loop on actual user
  behavior: which checklist items users complete, which draft rules they save,
  which onboarding steps cause drop-off, and whether behavior-change tracker
  language remains fair on real sample sizes

### 2026-05-03 Trader Product Polish And Import Trust Complete

The active product polish branch is documented in:

- `src/docs/trader-product-polish-and-import-trust-plan.md`

What changed:

- added a deterministic execution-only product-polish layer for coach evidence
  cards, trade grade explainability, first import experience, trade repair
  inbox, personal pattern memory, rule candidate lab, session recap,
  confidence calibration, execution quality trendline, and coach review queue
- added `/session-recap` as a product-facing end-user route with no raw JSON,
  CSV, spreadsheet, download, or export affordance
- enhanced `/analytics`, `/coach`, `/review`, `/progress`, `/imports`, and
  `/trades/[tradeId]` with trust/explainability and import-repair surfaces
- wired `productPolish` into the product trader analytics view model, public
  exports, home navigation, and platform route registry
- kept all new product conclusions execution-only; market context remains
  observational and does not affect queue priority, grade explainability,
  confidence calibration, trendline, repair guidance, or recap conclusions

New implementation:

- `src/lib/trader-analytics/product/product-polish.ts`
- `src/lib/trader-analytics/__tests__/trader-product-polish.test.ts`
- `app/session-recap/page.tsx`

Verification completed:

- focused product-polish tests passed with 1 file / 7 tests
- `npx vitest run src/lib/trader-analytics/__tests__` passed with 12 files /
  79 tests
- `npx tsc --noEmit` passed
- `npm run verify:all` passed with 80 files / 740 tests plus shared-engine,
  Layer 2, and Layer 3 checkpoints
- `npm run lint` passed with 0 errors and the same 4 pre-existing warnings
- `npm run build` passed and produced `/session-recap`
- existing dev server smoke passed at `http://localhost:3000` for `/`,
  `/analytics`, `/coach`, `/imports`, `/review`, `/progress`,
  `/session-recap`, and `/trades/trade-rapid-fire`

Best next step:

- when real user imports arrive, calibrate confidence thresholds, repair copy,
  rule candidate readiness, and trendline interpretation against messy broker
  CSVs and real repeated trader behavior

### 2026-05-03 Trader Coach Action Loop Complete

The active coach action-loop branch is documented in:

- `src/docs/trader-coach-action-loop-plan.md`

What changed:

- added a deterministic execution-only coach action loop that produces mistake
  timelines, rule simulations, trader archetype profile, session prep, review
  completion loop, similar-trade groups, mistake severity ladder, confidence
  language, empty states, and coach home data
- added the new `/coach` end-user route as a product-facing next-action screen
  with no raw JSON, CSV, spreadsheet, download, or export affordance
- enhanced `/trades/[tradeId]` with per-trade mistake timeline and similar
  execution-pattern panels
- wired the coach action loop into the product trader analytics view model,
  public exports, and platform module
- kept all coach conclusions execution-only; market context remains
  observational and does not affect coach scoring, severity, prep, or final
  next-action copy

New implementation:

- `src/lib/trader-analytics/product/coach-action-loop.ts`
- `src/lib/trader-analytics/__tests__/trader-coach-action-loop.test.ts`
- `app/coach/page.tsx`

Verification completed:

- focused coach tests passed with 3 files / 20 tests
- `npx vitest run src/lib/trader-analytics/__tests__` passed with 11 files /
  72 tests
- `npx tsc --noEmit` passed
- `npm run verify:all` passed with 79 files / 733 tests plus shared-engine,
  Layer 2, and Layer 3 checkpoints
- `npm run lint` passed with 0 errors and the same 4 pre-existing warnings
- `npm run build` passed and produced `/coach`
- existing dev server smoke passed at `http://localhost:3000` for `/`,
  `/coach`, `/analytics`, `/review`, `/progress`, and
  `/trades/trade-rapid-fire`

Best next step:

- use real imported trade executions when available to calibrate archetype,
  severity, and confidence thresholds; until then, keep the coach loop
  deterministic, sample-size aware, and execution-only

### 2026-05-03 Trader Improvement Intelligence Deepening Complete

The active trader-improvement branch is documented in:

- `src/docs/trader-improvement-intelligence-deepening-plan.md`

What changed:

- execution replay now includes decision roles, position before/after, position
  percent of max size, average open price, realized P/L progress, risk
  direction, and linked review labels
- added execution-only per-trade quality scorecards for entry discipline, add
  discipline, exit discipline, risk control, sizing consistency, and overall
  quality
- expanded mistake observations with confidence, reason, and suggested review
  action
- strengthened rule-builder recommendations with suggested rule titles and
  expected success metrics
- added playbook/readiness buckets, latest-session coach reports, behavior
  visuals, and best/worst pattern finder output
- wired the new intelligence into `/analytics`, `/review`, `/progress`, and
  `/trades/[tradeId]`
- market structure remains observational and does not affect execution-only
  scoring, mistake cost, rule evaluation, or final coaching conclusions

New implementation:

- `src/lib/trader-analytics/product/trader-improvement.ts`
- `src/lib/trader-analytics/__tests__/trader-improvement-intelligence.test.ts`

Verification completed:

- `npx vitest run src/lib/trader-analytics/__tests__` passed with 10 files /
  65 tests
- `npx tsc --noEmit` passed
- `npm run verify:all` passed with 78 files / 726 tests plus shared-engine,
  Layer 2, and Layer 3 checkpoints
- `npm run lint` passed with 0 errors and the same 4 pre-existing warnings
- `npm run build` passed
- existing dev server smoke passed at `http://localhost:3000` for `/`,
  `/analytics`, `/review`, `/progress`, and `/trades/trade-rapid-fire`

Best next step:

- use real imported trade executions when available to calibrate quality
  thresholds and coach-report language; keep market-context promotion separate
  until real saved-trade calibration is reviewed

### 2026-05-02 End-User Trader Analytics Product Prototype Complete

The active product branch from
`src/docs/end-user-trader-analytics-product-roadmap.md` is complete for the
fixture/in-memory prototype.

End-user analytics product expansion roadmap:

- `src/docs/end-user-analytics-product-expansion-plan.md`
- this branch covers the next end-user product layer: storage readiness,
  import review inbox, saved snapshots, weekly review, behavior streaks, notes
  and journal prompts, rule compliance summary, and an experimental
  market-context add-on panel
- this branch is complete for the fixture/in-memory product prototype
- added `src/lib/trader-analytics/product/product-expansion.ts`
- added focused coverage:
  `src/lib/trader-analytics/__tests__/end-user-product-expansion.test.ts`
- `/analytics` now includes weekly review, storage readiness, import review
  inbox, saved snapshots, behavior streaks, journal prompts, rule compliance,
  and a separate observational market-context panel
- `/trades/[tradeId]` now includes saved notes and journal prompts
- `README.md` links the expansion plan

New active productization roadmap:

- `src/docs/end-user-productization-implementation-plan.md`
- this branch covers the app-side productization layer for workspace/account
  modeling, import reconciliation, review workflows, tags/setup labels, action
  plans, end-user/admin permission split, async analysis jobs, visual QA, and
  market-context calibration queue
- this branch is complete for the fixture/in-memory product prototype
- added `src/lib/trader-analytics/product/productization.ts`
- added focused coverage:
  `src/lib/trader-analytics/__tests__/end-user-productization.test.ts`
- `/analytics` now includes workspace scope, permission split, import
  reconciliation, analysis jobs, review workflow, action plan, setup tags,
  calibration queue, and visual QA panels
- `README.md` links the productization plan

Implemented product surfaces:

- `/analytics` production analytics route with no raw JSON, CSV, spreadsheet,
  or export controls
- `/trades/[tradeId]` execution-only trade review route
- saved report/trade contracts, in-memory repository boundary, fixture-backed
  saved reports, filters, metric drill-downs, report history, latest-vs-prior
  comparisons, behavior trends, focus queue, rule tracker, import preview, and
  no-export production guardrails

Verification completed:

- `npm run verify:all` passed with `71` files / `656` tests plus the focused
  shared-engine, Layer 2, and Layer 3 checkpoints
- after the product expansion branch, `npm run verify:all` passed with `72`
  files / `664` tests plus the focused shared-engine, Layer 2, and Layer 3
  checkpoints
- after the productization branch, `npm run verify:all` passed with `73` files
  / `672` tests plus the focused shared-engine, Layer 2, and Layer 3
  checkpoints
- `npm run build` passed and produced `/analytics` and `/trades/[tradeId]`
- `npm run lint` passed with `0` errors and the same `4` pre-existing warnings
- local production smoke against `next start` passed for:
  `GET /analytics`, `GET /trades/trade-rapid-fire`, and `GET /`

Best next step:

- replace the fixture/in-memory repository with real authenticated storage once
  backend/auth choices are made
- keep raw JSON and export-like affordances limited to debug/admin surfaces
- keep market-context analytics as a later calibrated add-on; execution-only
  analytics should remain valid without candles or live market data

### 2026-05-02 End-User Execution CSV Import Boundary

The active import/storage branch is now documented in:

- `src/docs/end-user-execution-import-and-storage-plan.md`

What changed:

- added broker CSV execution import parsing under
  `src/lib/execution-sources/csv/`
- added import diagnostics for detected columns, header row number, row
  outcomes, issue counts, and duplicate request fingerprint groups
- added deterministic non-security fingerprints for uploaded CSV files and
  grouped trade requests
- added timezone-aware CSV timestamp parsing with a default UTC fallback and
  optional account/broker timezone such as `America/New_York`
- imported executions can now preserve optional commission, fee, net amount,
  and currency values when broker CSV files provide them
- options rows are rejected by default, can be skipped, and are only allowed
  explicitly for future non-stock workflows
- same-file duplicate checks can now be performed through
  `previewBrokerExecutionCsvImport(..., existingFileFingerprints)`
- import reconciliation now distinguishes duplicates of existing saved trades
  from duplicates inside the same import batch
- supported import formats now include:
  - IBKR activity / Flex-style trades
  - Moomoo trade history
  - Webull order history
  - Robinhood transaction history
  - Schwab transactions
  - generic execution CSV
- parsed CSV rows map into `ProviderExecution[]`
- parsed executions group into `UserTradeAnalysisRequest[]`
- the saved-trade import preview can now consume broker CSV directly through
  `previewBrokerExecutionCsvImport(...)`
- broker CSV source is kept separate from candle-provider selection; IBKR,
  Moomoo, Webull, Robinhood, and Schwab CSV imports do not become
  `levels-system` providers
- import is input-only; no end-user export/download controls were added
- representative CSV fixtures live under
  `src/docs/trade-execution-import-fixtures/`
- the CSV preview now also returns product diagnostics:
  - import repair workflow items
  - mapping confidence
  - summary cards
  - net P/L preview
  - trade grouping diagnostics
- workspace/account contracts now carry `accountTimezone`, and broker CSV
  previews can use `accountTimezone` as the default for broker-local timestamps
- over-reduction grouping diagnostics were fixed so the closing split is
  reported as flat before the opposite-direction remainder opens
- the representative fixture pack now also covers Fidelity, E*TRADE,
  Tastytrade, TradeStation, and Thinkorswim/TDA-style exports through the
  generic execution CSV mapper
- a detailed storage schema contract now lives at:
  `src/docs/end-user-database-schema-plan.md`
- follow-up import/product hardening added:
  - explicit CSV column mapping overrides for unknown broker headers
  - optional trade grouping safety rules for max time gap and session boundary
  - import commit plan contract
  - broker/app P/L reconciliation and mismatch repair items
  - mapping learning signal for generic or low-confidence imports
  - options quarantine contract
  - import review dashboard model
  - richer account settings contract for base currency, default broker,
    supported asset classes, import defaults, and commission handling
  - analysis confidence badges
  - default no-export data retention/delete policy

Deferred product work remains:

- real authenticated storage implementation
- import UI
- onboarding
- plan/billing design
- notifications
- UI copy polish
- production security/privacy/retention decisions

Focused verification:

- `npx vitest run src/lib/execution-sources/csv/__tests__/broker-execution-csv-import.test.ts`
  passed with 25 tests
- `npx vitest run src/lib/trader-analytics/__tests__/end-user-productization.test.ts`
  passed with 11 tests
- `npx tsc --noEmit` passed
- `npm run lint` passed with 0 errors and the same 4 pre-existing unrelated
  warnings
- `npm run verify:all` passed with 74 files / 700 tests plus the focused
  shared-engine, Layer 2, and Layer 3 checkpoints
- `npm run build` passed
- production route smoke passed for `/`, `/analytics`, and
  `/trades/trade-rapid-fire` with HTTP 200 responses

Best next step:

- keep the next real-product work centered on persistent storage plus import UI
  when the auth/database choices are ready

### 2026-05-03 End-User Product Intelligence Hardening Pass

The active product-intelligence branch is documented in:

- `src/docs/end-user-product-intelligence-hardening-plan.md`

This pass is complete for the fixture-backed product prototype.

What changed:

- added import quality scoring to broker CSV product diagnostics
- added trade reconstruction preview to broker CSV product diagnostics
- added execution-only mistake taxonomy, observations, cost estimates,
  recurrence alerts, rule-builder recommendations, unified review queue, and
  trader scorecard helpers in
  `src/lib/trader-analytics/product/product-intelligence.ts`
- added broker import fingerprint library helper for future unknown-broker
  mapping learning
- added market-context readiness gate that keeps market structure out of
  scoring until calibration is intentionally promoted
- added `TraderProductIntelligenceViewModel` and wired it into
  `buildProductTraderAnalyticsViewModel(...)`
- `/analytics` now shows execution score trend, mistake cost estimates,
  recurrence alerts, rule-builder recommendations, and a unified review queue
- `README.md` now links the product-intelligence hardening plan

Focused verification:

- `npx vitest run src/lib/trader-analytics/__tests__/end-user-product-intelligence.test.ts`
  passed with 6 tests
- `npx vitest run src/lib/execution-sources/csv/__tests__/broker-execution-csv-import.test.ts`
  passed with 25 tests
- `npx tsc --noEmit` passed

Full verification:

- `npm run verify:all` passed with 75 files / 706 tests plus the focused
  shared-engine, Layer 2, and Layer 3 checkpoints
- `npm run lint` passed with 0 errors and the same 4 pre-existing unrelated
  warnings
- `npm run build` passed
- production route smoke passed for `/`, `/analytics`, and
  `/trades/trade-rapid-fire` with HTTP 200 responses

No `levels-system` blocker was found in this pass, so the shared `52...md`
handoff file did not need an update.

Best next step:

- continue toward real authenticated storage and import UI when those product
  architecture decisions are ready; the intelligence layer now has stable
  fixture-backed contracts to persist and render

### 2026-05-03 End-User Workflow Productization Pass

The active workflow-productization branch is documented in:

- `src/docs/end-user-workflow-productization-plan.md`

This pass is complete for the fixture-backed product workflow prototype.

What changed:

- added `src/lib/trader-analytics/product/product-workflow.ts`
- added fixture-backed workflow view models for import review UI, execution
  replay, guided review session, rule effectiveness tracking, trader progress,
  import health, broker mapping admin, in-app lesson draft, account plan
  foundation, and storage implementation boundary
- added routes:
  - `/imports`
  - `/review`
  - `/progress`
  - `/import-health`
  - `/admin/broker-mappings`
  - `/account`
- updated `/trades/[tradeId]` with execution replay
- updated `/` with links to the new workflow surfaces
- exported workflow helpers and types from `src/lib/trader-analytics/index.ts`
- `README.md` now links the workflow productization plan

Focused verification:

- `npx vitest run src/lib/trader-analytics/__tests__/end-user-workflow-productization.test.ts`
  passed with 7 tests
- `npx tsc --noEmit` passed

Full verification:

- `npm run verify:all` passed with 76 files / 713 tests plus the focused
  shared-engine, Layer 2, and Layer 3 checkpoints
- `npm run lint` passed with 0 errors and the same 4 pre-existing unrelated
  warnings
- `npm run build` passed and produced 13 static pages plus the dynamic routes
- production route smoke passed for `/`, `/analytics`, `/imports`, `/review`,
  `/progress`, `/import-health`, `/admin/broker-mappings`, `/account`, and
  `/trades/trade-rapid-fire` with HTTP 200 responses

Boundary note:

- real database, auth, and billing choices remain intentionally deferred
- this pass makes those future choices explicit through the account/plan and
  storage-boundary view models
- no `levels-system` blocker was found, so the shared `52...md` handoff file
  did not need an update

Best next step:

- once auth/database choices are made, wire the import commit flow and saved
  notes/rules into real persistent storage

### 2026-05-03 Platform-Ready Feature Module Pass

The active platform-readiness branch is documented in:

- `src/docs/platform-ready-feature-module-plan.md`

This pass is complete for demo/platform-ready module mode.

Why this branch exists:

- Trader Intelligence is intended to become one feature module inside a larger
  platform with shared login, shared account/workspace context, shared tiered
  plans, and shared navigation
- this repo should keep building features and tests without choosing real auth,
  billing, or production database yet

What changed:

- added `src/lib/trader-analytics/product/platform-module.ts`
- added contracts and helpers for:
  - demo platform context
  - plan tiers
  - entitlements
  - feature gates
  - route registry with standalone and future platform paths
  - no-export policy audit
  - feature readiness checklist
  - visual QA checklist
  - broker CSV regression fixture harness
  - module readiness view model
- added `/platform-readiness`
- updated `/` with a Platform Readiness link
- exported platform helpers and types from `src/lib/trader-analytics/index.ts`
- `README.md` now links the platform-ready feature module plan

Focused verification:

- `npx vitest run src/lib/trader-analytics/__tests__/platform-ready-feature-module.test.ts`
  passed with 7 tests
- `npx tsc --noEmit` passed

Full verification:

- `npm run verify:all` passed with 77 files / 720 tests plus the focused
  shared-engine, Layer 2, and Layer 3 checkpoints
- `npm run lint` passed with 0 errors and the same 4 pre-existing unrelated
  warnings
- `npm run build` passed and produced 14 static pages plus the dynamic routes
- production route smoke passed for `/`, `/platform-readiness`, `/analytics`,
  `/imports`, `/review`, `/progress`, `/import-health`,
  `/admin/broker-mappings`, `/account`, and `/trades/trade-rapid-fire` with
  HTTP 200 responses

Boundary note:

- real auth, billing, production database, and global platform shell remain
  intentionally deferred
- this app now has a demo platform context and platform-mount contract that can
  be replaced by the larger website later
- no `levels-system` blocker was found, so the shared `52...md` handoff file
  did not need an update

Best next step:

- continue perfecting feature behavior and UI/testing in standalone demo mode;
  when the larger platform is ready, feed real platform context into these
  module contracts

### 2026-05-02 Levels-System Shared Engine Adapter Pass

The active branch now includes the first `levels-system` integration path for
support/resistance and shared candle-derived indicators.

Current shared-source-of-truth document:

- `C:\Users\jerac\Documents\TraderLink\levels-system\docs\52_TRADER_INTELLIGENCE_V2_SHARED_ENGINE_HANDOFF_2026-05-02.md`

Important architecture correction:

- long term, `levels-system` owns candle fetching, candle preparation,
  support/resistance, and shared VWAP / EMA context
- `trader-intelligence-v2` consumes public shared outputs through the package
  boundary
- this repo should not import `levels-system` internals by path

Implemented in this pass:

- added local dependency:
  `levels-system-phase1: file:../levels-system`
- added `src/lib/support-resistance/levels-system-adapter.ts`
- the adapter calls `buildSupportResistanceContextForSymbol(...)`
- shared `FinalLevelZone` output now maps into this repo's `StructuralLevel`
  contract
- shared dynamic levels now map into this repo's `DynamicLevels` contract
- execution-to-level relations remain local for now
- existing synchronous Layer 1 support/resistance construction remains intact
- new async wrappers are available:
  - `createRawTradeTimelineWithLevelsSystem(...)`
  - `analyzeTradeWithLevelsSystem(...)`
- new app-facing facade is available:
  - `runTradeAnalysis(...)`

Current integration posture:

- use `runTradeAnalysis(...)` for new app-facing single-trade work
- `runTradeAnalysis(...)` defaults support/resistance to the shared
  `levels-system` path
- shared `context.marketStructure` is consumed as
  `rawTradeTimeline.experimentalMarketStructure`
- `experimentalMarketStructure` is observational only and is not mapped into
  PatternInput, scoring, coaching, grading, or final user-facing conclusions
- keep the existing sync path stable until callers are intentionally migrated
- do not ask `levels-system` for more API surface until a real adapter blocker
  is found

Shared-package follow-up resolved:

- `levels-system` now emits declaration files for
  `levels-system-phase1/support-resistance-engine`
- this repo reinstalled the local dependency and removed the temporary ambient
  declaration
- `npx tsc --noEmit` passes against the real shared package types

Calibration follow-up completed:

- added a sample-trade-aligned shared fetch-service fixture for tests and
  comparison work
- added `npm run verify:levels-system` for focused shared-engine coverage
- added `npm run compare:levels-system` to compare legacy local S/R with the
  shared engine on the canonical sample trade
- added `src/lib/support-resistance/levels-system-runtime-options.ts` so this
  app passes provider/lookback/as-of preferences to `levels-system` without
  owning candle fetching
- added `src/lib/trade-analysis/run-trade-analysis.ts` as the preferred
  app-facing caller
- added PatternInput and full Layer 1 -> Layer 3 integration coverage for
  `analyzeTradeWithLevelsSystem(...)`
- added regression coverage proving `runTradeAnalysis(...)` uses the shared
  engine by default and the legacy local path remains explicit
- documented runtime knobs:
  - `LEVELS_SYSTEM_PROVIDER`
  - `LEVELS_SYSTEM_DAILY_LOOKBACK_BARS`
  - `LEVELS_SYSTEM_4H_LOOKBACK_BARS`
  - `LEVELS_SYSTEM_5M_LOOKBACK_BARS`
- added observational consumption of shared `context.marketStructure` as
  `rawTradeTimeline.experimentalMarketStructure`
- added tests proving the experimental market-structure read is visible on the
  shared raw result and absent from PatternInput
- added `src/lib/raw-trade-timeline/builders/create-raw-trade-timeline-with-levels-system-candles.ts`
  to call shared `buildTradeAnalysisCandleContext(...)`, map the returned
  pre-trade / trade / post-trade candles into this app's raw timeline, and reuse
  the shared support/resistance context without a second fetch
- added `runTradeAnalysisFromLevelsSystemCandles(...)` for app-facing analysis
  requests that have symbol / session / executions but no local candles
- added `src/lib/support-resistance/market-structure-audit/build-experimental-market-structure-audit.ts`
  to summarize shared market-structure state across saved trades without
  introducing scoring, coaching, grading, or user-facing conclusions
- added `npm run audit:market-structure`; with no path it audits the sample
  fixture through the shared trade-window candle path, and with a JSON path it
  accepts one trade, an array, `{ trade }`, or `{ trades }`
- added `npm run calibrate:market-structure` and `--out-dir` support so real
  saved-trade calibration writes `market-structure-audit.json` and
  `market-structure-calibration-report.md` under ignored `/artifacts`
- the audit now accepts either full candle-supplied trades or execution-only
  trade requests; when candles are missing it asks `levels-system` for the
  trade-window candle package first
- added
  `src/docs/market-structure-calibration/sample-execution-only-trades.json` as
  the saved-trade shape template for provider-backed calibration runs that
  should fetch candles from `levels-system`
- the audit includes a PatternInput leak check so shared
  `experimentalMarketStructure` stays debug-only while real saved data is
  calibrated
- the generated Markdown calibration report now separates PASS / REVIEW /
  BLOCKER gates for PatternInput isolation, analysis completion,
  market-structure presence, confidence, unknown or insufficient structure
  reads, market-structure diagnostics, and true provider / engine warning or
  error messages; harmless fetch info remains visible as engine messages
- moved saved-trade audit JSON parsing into
  `src/lib/support-resistance/market-structure-audit/parse-market-structure-audit-trades.ts`
  with regression coverage so mixed candle-supplied / execution-only batches are
  rejected instead of silently dropping provided candles
- added `--validate-only` to `npm run audit:market-structure -- ...` so saved
  trade files can be shape-checked before any provider or shared-engine candle
  request runs
- added
  `src/lib/support-resistance/market-structure-audit/evaluate-market-structure-calibration.ts`
  so calibration gates, overall PASS / REVIEW / BLOCKER status, and the
  recommendation action are machine-readable instead of only Markdown text
- `npm run calibrate:market-structure` now writes
  `market-structure-calibration-evaluation.json` alongside the raw audit JSON
  and Markdown report
- added the app-facing user trade request boundary in
  `src/lib/trade-analysis/request/trade-analysis-request-contract.ts`
  to validate symbol, trade direction, session context, executions, provider
  options, and trade-window options before this app calls `levels-system`
- added provider/shared-engine failure classification in
  `src/lib/trade-analysis/failures/classify-trade-analysis-failure.ts`
- added the stable UI/API/debug summary contract in
  `src/lib/trade-analysis/summary/build-trade-analysis-summary.ts`
- added a deterministic synthetic calibration harness in
  `src/lib/support-resistance/market-structure-audit/synthetic-market-structure-calibration-scenarios.ts`
  for PASS / REVIEW / BLOCKER regression coverage without treating synthetic
  candles as proof of market-structure quality
- added the local CLI debug dashboard:
  `npm run debug:trade-analysis`
  - no path uses the deterministic stub fixture
  - `--validate-only` validates request JSON without provider calls
  - `--out-dir` writes `trade-analysis-debug-dashboard.json` and
    `trade-analysis-debug-dashboard.md` under ignored `/artifacts`
- added the batch trade-analysis runner:
  `src/lib/trade-analysis/batch/run-trade-analysis-batch.ts`
  - validates one request or batches through the public request contract
  - optionally runs the shared `levels-system` trade-window candle path
  - returns `batch_trade_analysis_v1` with validation, failures, stable
    summaries, market-structure observation counts, and pattern aggregates
- refactored the CLI debug dashboard to use the batch runner
- added the debug API route:
  `POST /api/trade-analysis/debug`
  - accepts one request, `{ request }`, `{ trade }`, `{ requests }`,
    `{ trades }`, or an array
  - supports `validateOnly: true`
  - returns the same `batch_trade_analysis_v1` contract
- added the internal debug page:
  `/debug/trade-analysis`
- added request fixture JSON under:
  `src/docs/trade-analysis-request-fixtures/`
- added debug dashboard comparison:
  `npm run compare:trade-debug -- left.json right.json`
- added market-structure promotion-readiness gates:
  `src/lib/support-resistance/market-structure-audit/evaluate-market-structure-promotion-readiness.ts`
  - keeps shared market structure observational/debug-only by default
  - requires enough reviewed real saved trades and clean quality gates before
    even limited internal use
  - still prohibits pattern detection, normalization, grading, scoring,
    coaching, and final user-facing conclusions
- `npm run calibrate:market-structure` now writes
  `market-structure-promotion-readiness.json` alongside the audit,
  evaluation, and Markdown report
- comparison result on the sample trade:
  - legacy local path produced `0` support and `0` resistance levels
  - shared engine path produced `5` support and `2` resistance levels
  - shared engine changed nearest-level and VWAP / EMA PatternInput fields
  - shared market structure reported `base_building`, `uptrend`, high confidence
  - shared engine added `entry_far_from_support_structure`
  - shared engine did not remove existing detected or normalized patterns

Verification completed:

- `npx vitest run src/lib/support-resistance/__tests__/levels-system-adapter.test.ts`
  passed
- `npx vitest run src/lib/__tests__/trade-analysis-engine.test.ts` passed
- `npm run verify:levels-system` passed, including the app-facing
  `runTradeAnalysis(...)` and shared trade-window candle regressions
- `npm run compare:levels-system` completed and produced the sample comparison
- `npm run audit:market-structure` completed against the sample fixture with
  `base_building` / `uptrend` / high confidence, `5` support levels, `2`
  resistance levels, shared `levels_system_trade_window` candle source, and `0`
  PatternInput leaks
- `npm run audit:market-structure -- --out-dir artifacts/market-structure-calibration-smoke`
  wrote JSON and Markdown smoke-report artifacts successfully
- `npm run calibrate:market-structure` wrote the default ignored calibration
  artifacts successfully
- `npm test` passed with 570 tests
- `npm run verify:all` passed
- `npm run verify:layer2` passed
- `npm run verify:layer3` passed
- `npx tsc --noEmit` passed
- after calibration-gate and parser hardening, `npm run verify:levels-system`
  passed with 9 files / 22 tests and `npm run calibrate:market-structure`
  regenerated the ignored Markdown report with all sample gates passing
- parser hardening added 5 focused tests for execution-only templates,
  candle-supplied trades, empty batches, mixed modes, and malformed executions
- machine-readable calibration evaluation added 3 focused tests for PASS,
  REVIEW, and BLOCKER outcomes; `npm run verify:levels-system` now covers
  10 files / 25 tests
- request/validator/failure/summary/synthetic/debug-dashboard work expanded
  `npm run verify:levels-system` to 15 files / 44 tests
- `npm run debug:trade-analysis -- --validate-only` passed against the sample
  fixture without provider analysis
- `npm run debug:trade-analysis -- --out-dir artifacts/trade-analysis-debug-smoke`
  passed and wrote ignored JSON / Markdown debug dashboard artifacts
- focused batch/API/promotion/fixture/snapshot/comparison tests passed:
  `7` files / `24` tests
- after the batch/API/debug-page pass:
  - `npm run verify:levels-system` passed with `21` files / `65` tests
  - `npm run verify:all` passed with `60` files / `591` tests plus the
    focused shared-engine, Layer 2, and Layer 3 checkpoints
  - `npx tsc --noEmit` passed
  - `npm run build` passed and produced routes for `/`,
    `/api/trade-analysis/debug`, and `/debug/trade-analysis`
  - `npm run lint` passed with `0` errors and `4` pre-existing warnings
  - `npm run debug:trade-analysis -- --validate-only` passed
  - `npm run debug:trade-analysis -- --out-dir artifacts/trade-analysis-debug-smoke`
    passed
  - `npm run compare:trade-debug -- artifacts/trade-analysis-debug-smoke/trade-analysis-debug-dashboard.json artifacts/trade-analysis-debug-smoke/trade-analysis-debug-dashboard.json`
    passed
  - `npm run calibrate:market-structure -- --out-dir artifacts/market-structure-calibration-smoke`
    passed and wrote the promotion-readiness artifact

Best next step:

- keep `runTradeAnalysis(...)` as the preferred app-facing single-trade entry
  point, while leaving the sync legacy path available for existing tests and
  explicit fallback use
- use `npm run debug:trade-analysis -- path/to/request.json --validate-only`
  as the first check for future UI/API/user-entered trade requests
- next product-value step is running `npm run calibrate:market-structure --
  path/to/saved-trades.json` against real saved trades; those saved trade JSON
  objects no longer need to include candles if they include symbol,
  tradeDirection, executions, and sessionContext
- share any confusing or low-confidence structure reads back to the
  `levels-system` handoff doc
- keep `experimentalMarketStructure` visible in debug/comparison output only;
  do not let it affect detection, normalization, scoring, coaching, grading, or
  final user-facing conclusions until it proves useful across real data
- use `/debug/trade-analysis` and `POST /api/trade-analysis/debug` as the
  first app surfaces for future user-entered trade request testing
- execution-data-only trader feedback now has its own roadmap/tracker:
  `src/docs/execution-data-feedback-plan.md`
  - this lane is for feedback from buy/sell executions, share size, sequence,
    adds, reductions, exits, and position lifecycle before candle context is
    available
  - the file is laid out as a continuous work playbook with task IDs,
    stop conditions, verification commands, phase definitions of done, open
    question defaults, and a current task pointer
  - best next step for that lane is Phase 1 inventory: identify current
    execution-derived facts and execution-only-safe pattern IDs, then decide
    whether to build on the existing raw timeline or add a smaller
    execution-only fact builder
- execution-data feedback Phase 1 is complete:
  `src/docs/execution-data-feedback-inventory.md`
  - the execution-only lane will use a dedicated fact builder in this repo
  - it will reuse the existing trade-analysis request validator, execution
    normalization, and trade-state math
  - it will not call candles, PatternInput, support/resistance, market
    structure, or `levels-system`
  - current pointer for that lane is Phase 2 / `WQ-010`: create the
    `src/lib/execution-feedback/` module and implement the stable fact contract
- execution-data feedback Phase 2 is complete:
  - added `src/lib/execution-feedback/build-execution-feedback-facts.ts`
  - added `src/lib/execution-feedback/types/execution-feedback-facts.ts`
  - added focused tests covering long/short math, scale-in/full-exit,
    partial/open-position handling, execution sorting, adverse-price adds, and
    gross realized P/L
  - the facts are execution-only and do not call `levels-system`, candles,
    support/resistance, market structure, PatternInput, or pattern detection
  - focused verification passed:
    `npx vitest run src/lib/execution-feedback/__tests__/build-execution-feedback-facts.test.ts`
    and `npx tsc --noEmit`
  - current pointer for that lane is Phase 3 / `WQ-022`: define execution
    feedback points and emit neutral context, strengths, and risks
- execution-data feedback Phase 3 is complete:
  - added `src/lib/execution-feedback/execution-behavior-patterns.ts`
  - added `src/lib/execution-feedback/types/execution-feedback-point.ts`
  - the point layer emits neutral context, strengths, and risks from
    execution facts only
  - tests cover clean exits, controlled scale-ins, repeated adverse adds,
    open-position leftovers, small first reductions, late adds, rapid-fire
    execution clusters, short-side adverse-price logic, and forbidden
    candle-dependent labels
  - focused verification passed:
    `npx vitest run src/lib/execution-feedback/__tests__/build-execution-feedback-facts.test.ts src/lib/execution-feedback/__tests__/execution-behavior-patterns.test.ts`
    and `npx tsc --noEmit`
  - current pointer for that lane is Phase 4 / `WQ-033`: build
    `execution_feedback_summary_v1` and the top-level runner
- execution-data feedback Phase 4 is complete:
  - added `src/lib/execution-feedback/summary/build-execution-feedback-summary.ts`
  - added `src/lib/execution-feedback/run-execution-feedback.ts`
  - `execution_feedback_summary_v1` now separates lifecycle, sizing,
    sequencing, gross execution-only P/L, risk facts, context points,
    strengths, risks, primary focus, warnings, and limitations
  - coaching is intentionally unchanged for now; execution feedback remains a
    separate contract until the debug/API surface and full-analysis integration
    are stable
  - focused verification passed:
    `npx vitest run src/lib/execution-feedback/__tests__/build-execution-feedback-facts.test.ts src/lib/execution-feedback/__tests__/execution-behavior-patterns.test.ts src/lib/execution-feedback/__tests__/build-execution-feedback-summary.test.ts src/lib/execution-feedback/__tests__/run-execution-feedback.test.ts`
    and `npx tsc --noEmit`
  - current pointer for that lane is Phase 5 / `WQ-041`: add the batch runner,
    debug API route, and debug page
- execution-data feedback Phase 5 is complete:
  - added `src/lib/execution-feedback/batch/run-execution-feedback-batch.ts`
  - added `app/api/execution-feedback/debug/route.ts`
  - added `app/debug/execution-feedback/page.tsx`
  - added `app/debug/execution-feedback/execution-feedback-debug-client.tsx`
  - linked `/debug/execution-feedback` from the app home page
  - focused execution-feedback tests passed with `6` files / `23` tests
  - `npm run build` passed and produced the new execution-feedback API/page
  - `npm run lint` passed with `0` errors and `4` pre-existing warnings
- execution-data feedback Phase 6 is complete:
  - `buildTradeAnalysisSummary(...)` now includes a separate
    `executionFeedback` section
  - the section uses `execution_feedback_summary_v1`, is execution-only, and
    is marked `marketContextUsed: false` /
    `separatedFromMarketContext: true`
  - support/resistance and market structure remain separate; market structure
    still reports `usedForScoring: false`
  - focused integration tests passed with `10` files / `34` tests
  - `README.md` documents `runExecutionFeedback(...)`,
    `/api/execution-feedback/debug`, and `/debug/execution-feedback`
  - current pointer for that lane is final verification and local dev-server
    smoke
- execution-data feedback final verification is complete:
  - `npm run verify:all` passed with `66` files / `615` tests, plus
    `verify:levels-system`, `verify:layer2`, and `verify:layer3`
  - `npx tsc --noEmit` passed
  - `npm run build` passed
  - `npm run lint` passed with `0` errors and the same `4` pre-existing
    warnings
  - an existing Next dev server for this repo is running at
    `http://localhost:3000`
  - smoke checks passed for:
    `GET /api/execution-feedback/debug`,
    `GET /debug/execution-feedback`, and a sample
    `POST /api/execution-feedback/debug`
  - the execution-data feedback roadmap branch in
    `src/docs/execution-data-feedback-plan.md` is complete
- execution-feedback fixture hardening is complete:
  - added `short-loser.json`,
    `repeated-adds-before-reduction.json`,
    `inconsistent-share-sizing.json`,
    `rapid-fire-execution-cluster.json`, and
    `invalid-execution-only-requests.json` under
    `src/docs/trade-analysis-request-fixtures/`
  - added execution-feedback fixture contract tests proving the fixtures run
    without candle/provider work and emit expected execution-only points
  - updated trade-analysis request fixture tests so the new examples remain on
    the public request contract
  - resolved the execution-feedback open questions for the current version:
    dedicated execution-feedback layer first, coaching kept separate, gross
    P/L labeled as fees-excluded, neutral adverse-price wording, individual
    fills preserved, and broker/order IDs preserved but optional
  - focused verification passed:
    `npx vitest run src/lib/execution-feedback/__tests__ src/lib/trade-analysis/__tests__/trade-analysis-request-fixtures.test.ts`
    with `8` files / `51` tests, and `npx tsc --noEmit`
  - full verification passed after fixture hardening:
    `npm run verify:all` with `67` files / `636` tests plus
    `verify:levels-system`, `verify:layer2`, and `verify:layer3`
  - final TypeScript/build/lint passed:
    `npx tsc --noEmit`, `npm run build`, and `npm run lint` with `0` errors
    and `4` pre-existing warnings
- trader analytics reports now have a dedicated roadmap:
  `src/docs/trader-analytics-reports-plan.md`
  - this branch is complete
  - added `src/lib/trader-analytics/` with
    `trader_analytics_report_v1`, deterministic chart data, report types,
    `buildTraderAnalyticsReport(...)`, and `runTraderAnalyticsReport(...)`
  - the lane aggregates many `execution_feedback_summary_v1` objects into
    trader-level execution analytics: sample size, gross execution-only P/L,
    lifecycle, execution behavior rates, strengths, top risks, top strengths,
    primary focus counts, category distributions, trade rows, warnings, and
    limitations
  - added `POST /api/trader-analytics/debug` and
    `GET /api/trader-analytics/debug`
  - added `/debug/trader-analytics` with fixture batch input, KPI cards,
    native SVG/CSS charts, trade rows, warnings, limitations, and raw JSON
  - linked the analytics dashboard from `app/page.tsx`
  - added `src/docs/trader-analytics-real-data-bridge.md` to keep future
    market context additive and separate from execution-only metrics
  - the API accepts raw trade request batches and prebuilt
    `execution_feedback_summary_v1` arrays
  - tests prove extra market-context fields do not change execution-only
    analytics
  - this first version does not require market hours, live data, candles,
    provider calls, or `levels-system`
  - focused verification passed:
    `npx vitest run src/lib/trader-analytics/__tests__` with `3` files /
    `11` tests and `npx tsc --noEmit`
  - `npm run build` passed and produced `/api/trader-analytics/debug` and
    `/debug/trader-analytics`
  - `npm run lint` passed with `0` errors and the same `4` pre-existing
    warnings
  - full verification passed:
    `npm run verify:all` with `70` files / `647` tests plus
    `verify:levels-system`, `verify:layer2`, and `verify:layer3`
  - local smoke checks passed for:
    `GET /api/trader-analytics/debug`,
    `POST /api/trader-analytics/debug`, and
    `GET /debug/trader-analytics`
  - best next step for this lane is using `/debug/trader-analytics` with real
    saved execution batches when available; useful follow-ups are filters,
    saved in-app report history, in-app period comparisons, and chart-bar
    drill-downs into source trades
  - product posture update:
    trader analytics is for an end-user product, so production UX should not
    offer raw JSON / CSV / spreadsheet export; raw report JSON remains
    debug/admin-only, and end-user value should come from returning to the app
    for saved history, comparisons, filters, and drill-downs
- end-user trader analytics product roadmap is now documented:
  `src/docs/end-user-trader-analytics-product-roadmap.md`
  - this is the next production-product source of truth after the completed
    `trader_analytics_report_v1` debug/report foundation
  - planned product branches include production analytics route, saved in-app
    report history, filters, metric drill-down, trade review detail pages,
    in-app comparisons, behavior trend cards, trader focus queue, rule tracker,
    onboarding sample report, import/sync boundary, privacy/admin split, and a
    later calibrated market-context add-on
  - the roadmap keeps no-export policy explicit: production users should
    return to the app for saved history, comparisons, notes, focus items, and
    drill-downs; raw JSON remains debug/admin-only
  - current pointer is Phase 0 / `EU-001`: link the roadmap from existing docs,
    add a production no-export checklist, and audit debug labels before
    starting the production `/analytics` route
- end-user trader analytics product roadmap implementation pass is complete:
  - added saved analytics product contracts in
    `src/lib/trader-analytics/product/types.ts`
  - added in-memory repository boundary:
    `src/lib/trader-analytics/product/repository.ts`
  - added fixture-backed saved trades/reports:
    `src/lib/trader-analytics/product/sample-data.ts`
  - added production no-export guardrails:
    `src/lib/trader-analytics/product/production-guardrails.ts`
  - added selectors and view helpers for filters, metric drill-down, latest vs
    prior comparison, behavior trends, focus queue, and trade detail evidence:
    `src/lib/trader-analytics/product/selectors.ts`
  - added rule tracker templates/evaluations:
    `src/lib/trader-analytics/product/rule-tracker.ts`
  - added import preview validation:
    `src/lib/trader-analytics/product/import-preview.ts`
  - added production `/analytics` route with no raw JSON and no export controls
  - added `/trades/[tradeId]` execution-only trade review route
  - linked `/analytics` from the app home page
  - added product docs:
    `src/docs/trader-analytics-production-safety-checklist.md`,
    `src/docs/trader-analytics-import-sync-plan.md`, and
    `src/docs/trader-analytics-market-context-add-on-plan.md`
  - added focused coverage:
    `src/lib/trader-analytics/__tests__/end-user-product-roadmap.test.ts`
  - focused verification passed:
    `npx vitest run src/lib/trader-analytics/__tests__/end-user-product-roadmap.test.ts`
    with `9` tests and `npx tsc --noEmit`
  - `npm run build` passed and produced `/analytics` and `/trades/[tradeId]`
  - `npm run lint` passed with `0` errors and the same `4` pre-existing
    warnings
  - full verification passed:
    `npm run verify:all` with `71` files / `656` tests plus the focused
    shared-engine, Layer 2, and Layer 3 checkpoints
  - local production smoke passed for:
    `GET /analytics`, `GET /trades/trade-rapid-fire`, and `GET /`
  - the roadmap in
    `src/docs/end-user-trader-analytics-product-roadmap.md` is marked complete
    for the fixture/in-memory product prototype
  - next real product step is replacing the fixture/in-memory repository with
    real authenticated storage once backend/auth choices are made

### 2026-04-16 Post-Merge Follow-Up Resume Point

The active roadmap branch has shifted from expansion-first work to the
maintainability-first audit order in `src/docs/audit-report-april-16.md`.

The audit-ordered maintainability pass is complete, and the first dedicated
post-merge follow-up PR is now complete too.

Completed in this session:

- Phase 1:
  `PatternInput` now has grouped context sections with a temporary flat
  compatibility layer, and `PatternMetadata` now carries richer semantics plus
  registry validation coverage.
- Phase 2:
  normalization suppression now splits safe metadata-inferred broader-lineage
  dominance from true manual exceptions, with integrity tests guarding the
  rule graph.
- Phase 3:
  the scaling-quality family was split into composition-driven lane files plus
  a final assembly guard, and the redundancy review now lives in
  `src/docs/scaling-pattern-redundancy-review-april-16.md`.
- Phase 4:
  the breakout / chase / extension entry lane was audited, a real bug was
  fixed where `breakout_chase_entry_structure` had collapsed into the same
  logic as `overextended_chase_entry_structure`, and threshold diagnostics were
  made truthful through a shared helper path.
- Phase 5:
  focused normalization invariants were added, layer-boundary audit notes were
  written, and active naming drift was cleaned toward
  `trader-improvement-system`.
- Phase 6:
  the future UI work remains intentionally deferred, with only a lightweight
  plan captured in `src/docs/future-app-surface-plan.md`.

Completed after the merge-ready audit pass:

- The temporary flat `PatternInput` compatibility layer has been fully removed.
- Layer 2 production consumers now read grouped context access only.
- Test helpers, fixtures, and the Layer 2 verify script now use grouped
  `PatternInput` shape directly.
- `buildPatternInput(...)` now returns only the grouped contract, and the
  builder regression test locks that grouped-only runtime shape.
- `pattern-suppression-rules.ts` is now a thin Layer 3 entrypoint with the
  suppression registry split into smaller modules for:
  suppression groups,
  manual entry dominance,
  manual position dominance,
  manual scaling dominance,
  manual exit dominance,
  metadata-inferred dominance assembly,
  and lookup helpers.
- Follow-up verification passed:
  `npm test`,
  `verify:layer2`,
  `verify:layer3`,
  `npx tsc --noEmit`.

Best next step from here:

- keep follow-up PRs narrow
- continue splitting large normalization registries mechanically rather than
  behaviorally, with `pattern-metadata.ts` the next likely compression target
- continue shrinking manual suppression only where metadata can prove richer
  same-lineage dominance safely

Final verification after the full audit pass:

- `npm.cmd test` passed
- `npm.cmd run verify:layer2` passed
- `npm.cmd run verify:layer3` passed
- `npx.cmd tsc --noEmit` passed

PR review follow-up on the same branch is now complete too:

- `pattern-suppression-rules.ts` no longer requires a pre-existing manual pair
  before metadata can infer safe broader-lineage suppression
- metadata-driven suppression now explicitly covers:
  legacy-calibrated broader-lineage pairs,
  repeated-cycle overlays,
  recovery overlays,
  support/resistance overlays,
  and other safe richer journey-scope overlays
- true manual exceptions remain for cross-family bridges and asymmetric
  storyline jumps that metadata still cannot prove safely
- `PatternInput` now carries an explicit TODO note for removing the temporary
  flat compatibility layer after grouped-context migration finishes
- follow-up verification passed again:
  `npm.cmd test`,
  `npm.cmd run verify:layer2`,
  `npm.cmd run verify:layer3`,
  `npx.cmd tsc --noEmit`

Best next step from here:

1. Keep the current maintainability gains stable and use the new metadata,
   invariant tests, and scaling-family structure as the baseline before adding
   more pattern families.
2. When new work resumes, prefer the current roadmap branch already described in
   `src/docs/behavior-coverage-audit.md` and the pattern catalog, but only add
   new interpretation surface if it does not reintroduce rule debt or pattern
   sprawl.

As of `2026-04-14` the repo is no longer just planning the layered architecture.

The practical state is:

- Layer 1 raw trade timeline is implemented with broad derived-signal coverage
- `PatternInput` exists as the Layer 1 -> Layer 2 contract
- Layer 2 pattern detection is implemented across multiple pattern families
- Layer 3 normalization is implemented with priority ordering, suppression, and one-primary-per-family behavior
- Layer 4 scoring is now live as a deterministic scoring, trace, and calibration layer
- the first behavior-analysis bridge now translates scoring truth into named behavior signals
- the first coaching bridge now produces deterministic structured trade-coaching output from behavior truth
- the first trader-level multi-trade profile layer now aggregates recurring behaviors, identity, session pressure, and behavior trends across trades
- the newest Layer 4 work has been strengthening scoring truth, traceability, dominance control, behavior prioritization, one-issue coaching focus enforcement, and trader-level aggregation

This means the current project is best understood as:

not a blank rebuild,
but an actively working layered detection + normalization + scoring system
with the first deterministic behavior/coaching bridge now in place.

### 2026-04-15 Trader-Behavior Modular Extraction Resume Point

The main active maintainability branch is now the safe modular extraction of:

- `src/lib/trader-behavior/builders/build-trader-behavior-profile.ts`

Latest session handoff note:

- `code-updates-april-15.md`
  - use this if a future session wants the detailed list of code/doc changes
    made during the April 15, 2026 chat before returning to the main roadmap

Completed extraction passes so far:

- `src/lib/trader-behavior/builders/profile-aggregation.ts`
  - owns:
    - `aggregatedBehaviors`
    - `behaviorHistory`
    - `mostFrequentWeaknesses`
    - `mostDestructiveBehaviors`
    - `improvingBehaviors`
    - `emergingStrengths`
    - `sessionWeaknesses`
    - `sessionStrengths`
    - `improvingTrends`
    - `deterioratingTrends`
- `src/lib/trader-behavior/builders/profile-confidence-and-identity.ts`
  - owns:
    - `buildProfileConfidence(...)`
    - `buildIdentity(...)`
- `src/lib/trader-behavior/builders/profile-development.ts`
  - owns:
    - `buildDevelopmentPriorities(...)`
    - `buildSessionDevelopmentInsights(...)`
    - `buildDevelopmentPlan(...)`
    - `buildProfileSummary(...)`
- `src/lib/trader-behavior/builders/profile-progress.ts`
  - owns:
    - analysis windows
    - behavior progress windows
    - destructive / improving streak detection
    - relapse / stabilization detection
    - regression / emerging-risk / fading-strength detection
    - progress scoring
    - intervention readiness and priority-effectiveness signals
- `src/lib/trader-behavior/builders/profile-interventions.ts`
  - owns:
    - intervention-period resolution
    - before / during / after intervention evaluation windows
    - intervention effectiveness scoring
    - focus-cycle construction
    - plan-adherence, drift, and mismatch signals
- `src/lib/trader-behavior/builders/profile-adaptive-development.ts`
  - owns:
    - adaptive development planning
    - focus continuation vs rotation decisions
    - protection / de-escalation / escalation prioritization
    - intervention summary construction

Important continuity note:

- the development extraction initially broke the main builder because
  `roundToTwo(...)` was still needed by non-development logic
- that was fixed in the same pass by restoring the shared helper and the still-used
  type imports in the main builder
- the progress extraction then moved the full progress / trend lane into
  `profile-progress.ts`
- the intervention extraction then moved the intervention / focus-cycle lane into
  `profile-interventions.ts`
- `profile-interventions.ts` intentionally reuses the exported progress-window helpers from
  `profile-progress.ts` instead of rebuilding that math in a second place
- the adaptive-planning extraction then moved the focus-rotation / next-focus /
  intervention-summary lane into `profile-adaptive-development.ts`
- the final orchestration cleanup then reduced
  `build-trader-behavior-profile.ts` to a thinner coordinator with:
  - explicit options type
  - ordered-feedback normalization helper
  - computation-vs-assembly separation
- current state after the latest pass:
  - `npm.cmd test -- src/lib/trader-behavior/__tests__/build-trader-behavior-profile.test.ts` passes
  - `npx tsc --noEmit` passes
  - `npm.cmd run build` passes

What still remains in `build-trader-behavior-profile.ts`:

- thin top-level orchestration only

Best next safe extraction step:

1. trader-behavior modular extraction is now functionally complete for this branch
2. avoid reopening the extracted modules unless a regression or real simplification opportunity appears
3. the next decision is whether to:
   - do small maintainability polish only if a concrete pain point appears, or
   - return to broader intelligence-system expansion as the higher-value lane

Current likely next implementation direction if resuming after this chat:

1. do not spend another session on trader-behavior modularization unless a real regression or design pain appears
2. resume higher-value intelligence expansion instead of more structural cleanup
3. use this order for deciding what to build next:
   - read this project log first
   - read `code-updates-april-15.md` for the detailed April 15 session handoff
   - consult `src/docs/behavior-coverage-audit.md`
   - if no regression is found, prefer the broader intelligence-expansion lane already called out in the audit/log:
     richer cross-family lifecycle stories, stronger constructive whole-trade summaries, and stronger exit-side composites

Rule for the next resume:

- do not re-open already completed aggregation / confidence / development passes
  unless a regression is found
- continue from the current modular extraction state, not from the earlier monolith

---

## Current Workspace State

As of the latest local read:

- `src/` contains major in-progress system work that is still uncommitted
- `package.json`, `package-lock.json`, and `tsconfig.json` also have local changes
- `vitest.config.ts` exists as new local test setup work

Important implication:

future sessions should treat the current local workspace,
not old assumptions,
as the source of truth.

Always inspect current files before deciding what is complete.

---

## Why This File Helps

The existing docs already explain the architecture well.

What they do not do as directly is keep one compact running record of:

- what has changed recently
- what is already strong
- what is still missing
- what the next best implementation targets are

So yes, this file is useful.

It should stay concise and practical.

Related focused planning doc:

- `src/docs/behavior-coverage-audit.md`

---

## Current System Read

### Stronger Now

- Layer 1 is no longer just basic raw trade assembly
- Layer 1 now captures much richer factual context around entries, adds, reductions, post-exit behavior, lifecycle milestones, and danger windows
- Layer 2 now includes not only isolated structural patterns but also several management-sequence patterns
- Layer 3 now has real overlap handling, family primary anchoring, canonical regression coverage, and a cleaner contract for later layers

### Still Developing

- richer positive management storylines
- more nuanced multi-step trade-management sequences
- deeper early-exit / missed-opportunity coverage
- more complete risk-management story coverage
- broader entry subtype coverage beyond the first extension vs pullback split

---

## Major Implementation Updates

### Layer 1 Additions

The following new factual builders were added or significantly expanded:

- `build-between-execution-price-behavior-signals.ts`
- `build-reduction-readd-sequence-signals.ts`
- `build-profit-protection-derived-signals.ts`
- `build-partial-exit-outcome-signals.ts`
- `build-entry-context-derived-signals.ts`
- `build-trade-lifecycle-milestone-signals.ts`
- `build-add-context-derived-signals.ts`
- `build-reduction-context-derived-signals.ts`
- `build-post-exit-derived-signals.ts` was expanded with richer full-exit aftermath facts
- `build-danger-window-derived-signals.ts`
- `build-readd-outcome-signals.ts`

Layer 1 now captures stronger factual truth around:

- pre-entry context
- add behavior
- reduction behavior
- reduction to re-add sequences
- profit protection and giveback
- partial-exit aftermath
- re-add aftermath before the next action
- full-exit aftermath
- lifecycle milestones
- danger windows between peak open profit and later drawdown

### PatternInput / Layer 1 to Layer 2 Bridge

`PatternInput` was expanded substantially so Layer 2 can use richer factual aggregates without touching raw timeline objects directly.

PatternInput now includes stronger coverage for:

- entry context
- add context
- reduction context
- re-entry-after-trim context
- post-exit continuation / adverse followthrough
- danger-window facts
- early-adversity-to-recovery facts
- giveback / peak open profit context
- re-add sequence context

### Layer 2 Additions

#### Entry / Exit / Management Patterns

Added or expanded patterns include:

- `entry_after_recent_run_up`
- `entry_after_recent_drop`
- `late_favorable_extension_entry_structure`
- `constructive_pullback_entry_structure`
- `disciplined_favorable_extension_entry_structure`
- `breakout_entry_structure`
- `measured_favorable_extension_entry_structure`
- `overextended_chase_entry_structure`
- `breakout_chase_entry_structure`
- `failed_breakout_entry_structure`
- `weak_pullback_entry_structure`
- `deep_constructive_pullback_entry_structure`
- `deep_weak_pullback_entry_structure`
- `peak_profit_giveback_structure`
- `partial_exit_with_adverse_followthrough`
- `missed_post_exit_continuation`
- `exit_avoided_adverse_followthrough`
- `defensive_exit_after_deterioration`
- `premature_final_exit_after_constructive_management`
- `fearful_exit_after_weakening`
- `revenge_adding_after_weakness`
- `revenge_adding_with_failed_profit_protection`
- `disciplined_defensive_exit`
- `stabilized_recovery_with_constructive_final_exit`
- `stabilized_recovery_with_premature_final_exit`

#### Reduction / Risk Patterns

- `reduction_into_strength`
- `reduction_into_weakness`
- `profit_protection_present`
- `timely_risk_response_after_peak_profit`
- `timely_risk_response_with_profit_protection`
- `failed_profit_protection_structure`
- `reduction_after_recent_run_up`
- `reduction_after_recent_drop`
- `held_through_danger_after_peak_profit`
- `delayed_risk_response_after_peak_profit`
- `delayed_risk_response_with_failed_profit_protection`

#### Scaling / Sequence Patterns

- `readd_after_reduction`
- `adding_above_prior_basis`
- `add_into_strength`
- `add_into_weakness`
- `add_after_recent_run_up`
- `add_after_recent_drop`
- `balanced_scaling_with_profit_protection`
- `constructive_readd_after_reduction`
- `balanced_management_with_constructive_exit`
- `recovery_with_balanced_management_and_constructive_final_exit`
- `balanced_management_with_premature_final_exit`
- `recovery_with_balanced_management_and_premature_final_exit`
- `balanced_management_with_stop_like_forced_exit_after_breakdown`
- `balanced_management_with_stop_like_forced_exit_before_rebound`
- `recovery_with_balanced_management_and_stop_like_forced_exit_after_breakdown`
- `recovery_with_balanced_management_and_stop_like_forced_exit_before_rebound`
- `trim_into_strength_with_constructive_final_exit`
- `timely_profit_protection_with_constructive_final_exit`
- `recovery_with_trim_into_strength_and_constructive_final_exit`
- `recovery_with_timely_profit_protection_and_constructive_final_exit`
- `underutilized_winner_with_constructive_exit`
- `recovery_to_underutilized_winner_with_constructive_exit`
- `underutilized_winner_with_timely_profit_protection_and_constructive_final_exit`
- `recovery_to_underutilized_winner_with_timely_profit_protection_and_constructive_final_exit`
- `underutilized_winner_with_premature_final_exit`
- `recovery_to_underutilized_winner_with_premature_final_exit`
- `underutilized_winner_with_missed_final_continuation`
- `recovery_to_underutilized_winner_with_missed_final_continuation`
- `timely_trim_into_strength_with_constructive_final_exit`
- `recovery_with_timely_trim_into_strength_and_constructive_final_exit`
- `add_into_strength_with_constructive_final_exit`
- `recovery_with_add_into_strength_and_constructive_final_exit`
- `add_into_strength_with_timely_profit_protection_and_constructive_final_exit`
- `recovery_with_add_into_strength_and_timely_profit_protection_and_constructive_final_exit`
- `add_into_strength_with_missed_final_continuation`
- `recovery_with_add_into_strength_and_missed_final_continuation`
- `timely_risk_response_with_stop_like_forced_exit_after_breakdown`
- `timely_risk_response_with_stop_like_forced_exit_before_rebound`
- `recovery_with_timely_risk_response_and_stop_like_forced_exit_after_breakdown`
- `recovery_with_timely_risk_response_and_stop_like_forced_exit_before_rebound`
- `trim_readd_with_constructive_final_exit`
- `trim_readd_with_missed_final_continuation`
- `constructive_recovery_after_early_adversity`
- `recovery_after_early_adversity_with_failed_protection`
- `recovery_after_early_adversity_with_stabilized_management`
- `repeated_trim_readd_with_constructive_management`
- `repeated_trim_readd_with_unstable_management`
- `repeated_rescue_attempts_with_renewed_deterioration`
- `late_chase_reentry_after_constructive_trim`
- `good_pullback_reentry_after_constructive_trim`
- `constructive_reentry_followthrough_after_trim`
- `constructive_reentry_with_constructive_final_exit`
- `constructive_reentry_with_premature_final_exit`
- `constructive_reentry_with_stop_like_forced_exit_after_breakdown`
- `constructive_reentry_with_stop_like_forced_exit_before_rebound`
- `recovery_with_constructive_final_exit_after_constructive_reentry`
- `recovery_with_premature_final_exit_after_constructive_reentry`
- `recovery_with_stop_like_forced_exit_after_constructive_reentry`
- `recovery_with_stop_like_forced_exit_before_rebound_after_constructive_reentry`
- `deteriorating_reentry_after_trim`
- `repeated_trim_readd_with_constructive_reentry_followthrough`
- `repeated_trim_readd_with_deteriorating_reentry`
- `repeated_constructive_reentry_with_premature_final_exit`
- `repeated_balanced_management_with_constructive_final_exit`
- `repeated_balanced_management_with_premature_final_exit`
- `repeated_balanced_management_with_stop_like_forced_exit_after_breakdown`
- `repeated_balanced_management_with_stop_like_forced_exit_before_rebound`
- `repeated_constructive_reentry_with_constructive_final_exit`
- `repeated_constructive_reentry_with_stop_like_forced_exit_after_breakdown`
- `repeated_constructive_reentry_with_stop_like_forced_exit_before_rebound`
- `repeated_deteriorating_reentry_with_defensive_final_exit`
- `repeated_rescue_attempts_with_premature_final_exit_after_constructive_reentries`
- `repeated_rescue_attempts_with_balanced_management_and_premature_final_exit`
- `repeated_rescue_attempts_with_balanced_management_and_constructive_final_exit`
- `repeated_rescue_attempts_with_balanced_management_and_stop_like_forced_exit_after_breakdown`
- `repeated_rescue_attempts_with_balanced_management_and_stop_like_forced_exit_before_rebound`
- `repeated_rescue_attempts_with_constructive_final_exit_after_constructive_reentries`
- `repeated_rescue_attempts_with_stop_like_forced_exit_after_constructive_reentries`
- `repeated_rescue_attempts_with_stop_like_forced_exit_before_rebound_after_constructive_reentries`
- `repeated_rescue_attempts_with_defensive_final_exit_after_deteriorating_reentries`
- `repeated_trim_readd_with_constructive_final_exit`
- `repeated_trim_readd_with_fearful_final_exit`
- `repeated_trim_readd_with_defensive_final_exit_after_deterioration`
- `repeated_rescue_attempts_with_defensive_final_exit_after_deterioration`
- `repeated_trim_readd_with_premature_final_exit`
- `aggressive_adding_with_failed_profit_protection`
- `readd_after_delayed_risk_response`

### Layer 3 Additions

Layer 3 was hardened in several important ways:

- pattern metadata expanded to cover many new Layer 2 patterns
- suppression rules expanded to handle newer management, repeated re-entry, rescue, and richer exit-story overlap
- single-primary-per-family behavior added
- canonical normalization regression tests added
- `primaryPatternsByFamily` added to the normalized output
- `topOverallAnchorPattern` added to the normalized output
- Layer 3 verification script upgraded into a real canonical regression checker

Most recent Layer 3 arbitration tightening focused on:

- richer repeated constructive and deteriorating re-entry storylines beating broader repeated management and final-exit variants
- recovery-aware repeated rescue storylines beating weaker non-recovery repeated variants
- stabilized-recovery exit storylines directly suppressing the broader post-exit descriptors they structurally subsume
- stop-like rebound storylines beating the broader premature-final-exit variants when the exit was genuinely stop-like rather than just early

### Layer 4 Scoring + Feedback Bridge

Layer 4 is now active and split into clear downstream slices.

What is now live:

- scoring input preparation:
  - `PatternScoringInput`
  - `buildPatternScoringInput(...)`
- scoring result building:
  - explicit polarity mapping
  - structural-level weighting
  - normalized-role weighting
  - limited family-aware influence calibration
  - family trace / dominance / suppression reporting
  - scoring stress tests and invariants
- first behavior-analysis bridge:
  - named behavior signals
  - `behaviorPriorityScore`
  - `primaryBehavior`, `secondaryBehaviors`, and `suppressedBehaviors`
  - `behaviorClass`
  - conflict resolution
  - identity-signal candidates
- first coaching bridge:
  - deterministic `fixFirst` / `fixNext`
  - structured evidence-backed coaching output
  - scenario validation for expected behavior/coaching alignment
- first multi-trade intelligence bridge:
  - trader behavior profile aggregation
  - recurring weakness / strength ranking
  - trader identity classification
  - session-segment weakness / strength summaries
  - improving vs deteriorating behavior trends

Important boundary:

- `src/lib/trade-analysis-engine.ts` still stops at Layer 3 on purpose
- scoring, behavior analysis, and coaching are currently downstream consumers, not yet merged into the trade-analysis engine contract

---

## Current Priority View

### Already Strong

- basic trade timeline assembly
- execution sequencing
- position-state tracking
- add / reduce context
- entry subtype coverage around favorable extension vs constructive pullback
- broader entry subtype coverage around constructive continuation vs weak pullback outcomes
- sharper weak-side entry extremes around stretched chase entries and deeper weak pullback entries
- profit-protection context
- post-exit factual context
- family-based Layer 3 normalization
- early sequence-level management failure patterns
- exit-quality storylines around fearful, disciplined defensive, premature, and deterioration-aware exits
- early-adversity recovery and stabilized-recovery storyline coverage
- repeated trim / re-add / re-entry outcome coverage
- recovery-aware repeated rescue plus final-exit storyline coverage
- first positive full-trade constructive storyline coverage
- one-cycle constructive re-entry plus constructive final-exit storyline coverage
- non-readd constructive whole-trade storyline coverage built around timely profit protection
- constructive trim-into-strength whole-trade storyline coverage without needing a re-add cycle
- under-pressed winner constructive storyline coverage
- under-pressed winner timely-protection constructive storyline coverage
- under-pressed winner missed-continuation storyline coverage
- timely trim-into-strength constructive whole-trade storyline coverage
- constructive add-into-strength whole-trade storyline coverage
- constructive add-into-strength timely-protection storyline coverage
- constructive add-into-strength missed-continuation storyline coverage
- deep same-family Layer 3 arbitration inside scaling and exit quality

### Missing And High Priority

- fuller positive management stories that span most of the trade lifecycle beyond the current trim / protect / under-press / add ladder
- more nuanced under-sizing / not-pressing-winners structure beyond the first constructive and timely-protected winner branches
- broader entry subtype coverage beyond the first favorable-extension vs pullback split
- sharper chase-style and weak-pullback extremes above the first entry subtype split
- richer multi-cycle rescue stories beyond the current repeated trim / re-add / re-entry stack
- more cross-family storyline composites that summarize the full management journey

### Later Nice To Have

- more session-aware context
- richer multi-cycle management patterns
- broader canonical sample coverage
- more advanced Layer 3 family arbitration
- Layer 4 scoring once Layers 1-3 feel more complete

---

## Behavior Coverage Snapshot

This section tracks how well the current system covers important trader behaviors.

### Strong

- advantaged vs disadvantaged entry structure
- late favorable extension vs constructive pullback entry subtype coverage
- disciplined favorable extension vs weak pullback entry subtype coverage
- overextended chase vs deep weak pullback extreme-entry subtype coverage
- adding into strength vs adding into weakness
- reduction into strength vs reduction into weakness
- profit protection vs failed profit protection
- post-exit continuation vs adverse followthrough basics
- danger-window risk-response failure basics
- first sequence-level management failure patterns
- fearful vs disciplined defensive vs premature final-exit structure
- stop-like breakdown exits vs fearful or defensive discretionary-style exits
- stabilized recovery with constructive vs premature final exits
- repeated re-entry quality with final-exit outcome structure
- recovery-aware repeated rescue plus final-exit outcome structure
- repeated constructive re-entry with constructive final-exit outcome structure
- trim-into-strength constructive final-exit storyline coverage
- under-pressed winner constructive final-exit storyline coverage
- timely trim-into-strength constructive final-exit storyline coverage
- under-pressed winner premature-final-exit storyline coverage
- add-into-strength premature-final-exit storyline coverage

### Partial

- re-add behavior after reduction
- partial-profit then later deterioration
- balanced constructive management storylines
- constructive trims into strength that still ended well
- deeper rescue / recovery storylines beyond the current recovery-aware repeated stack
- broader cross-family full-trade narratives
- under-sizing / not pressing winners enough

### Weak

- richer good-risk-response sequences
- broader session-aware and context-aware management narratives

### Interpretation

The current system is already much better at detecting:

- failure-side management structure
- risk-response problems
- giveback and danger patterns
- richer exit-quality hierarchy
- recovery-aware repeated rescue and re-entry stories

It is less mature on:

- constructive / positive management stories
- nuanced trade-management story quality across the whole trade lifecycle

Recent addition:

- exit quality now includes `stop_like_forced_exit_after_breakdown` and
  `stop_like_forced_exit_before_rebound`, which use breakdown severity,
  weak-side exit location, capture weakness, and post-exit path to separate
  stop-like exits from broader fearful or defensive discretionary exits
- exit quality now also includes
  `held_through_danger_with_stop_like_forced_exit_after_breakdown`
  `held_through_danger_with_stop_like_forced_exit_before_rebound`
  `delayed_risk_response_with_stop_like_forced_exit_after_breakdown`
  and `delayed_risk_response_with_stop_like_forced_exit_before_rebound`,
  which connect danger-window management failure to stop-like final exits so
  the system can distinguish "never reduced until the break" from
  "responded late, then still got forced out" instead of treating both as
  generic weak exits
- exit quality now also includes
  `stabilized_recovery_with_stop_like_forced_exit_after_breakdown`
  and `stabilized_recovery_with_stop_like_forced_exit_before_rebound`,
  which extend the stabilized-recovery branch into failure-side endings so
  the system can express "recovered from early adversity, then still ended
  in a stop-like weak-side exit" rather than flattening that trade into
  separate recovery and exit fragments
- scaling quality now includes
  `trim_into_strength_with_constructive_final_exit` and
  `recovery_with_trim_into_strength_and_constructive_final_exit`, which add
  constructive trim-into-strength whole-trade stories without requiring a
  later re-add cycle
- entry quality now includes
  `disciplined_favorable_extension_entry_structure` and
  `weak_pullback_entry_structure`, which extend the first extension-vs-pullback
  split into constructive continuation versus weak pullback outcomes
- entry quality now also includes
  `measured_favorable_extension_entry_structure` and
  `deep_constructive_pullback_entry_structure`, which sharpen the positive
  side of that same entry ladder into cleaner continuation and deeper
  pullback-winner subtypes
- entry quality now also includes explicit named breakout families:
  `breakout_entry_structure`,
  `breakout_chase_entry_structure`,
  and `failed_breakout_entry_structure`,
  which move breakout-style behavior beyond indirect proxy coverage
- entry quality now also includes
  `overextended_chase_entry_structure` and
  `deep_weak_pullback_entry_structure`, which sharpen the weak-side extremes
  above the first entry subtype split without pretending we already have full
  breakout/setup labeling
- scaling quality now also includes
  `revenge_adding_after_weakness` and
  `revenge_adding_with_failed_profit_protection`, which turn the older
  weakness-add / failed-protection proxies into explicit named
  averaging-down behavior without pretending trader emotion itself is
  observable
- scaling quality now also includes
  `underutilized_winner_with_constructive_exit` and
  `recovery_to_underutilized_winner_with_constructive_exit`, which turn the
  old raw underutilized-position fact into a real constructive under-pressed
  winner storyline
- scaling quality now also includes
  `timely_trim_into_strength_with_constructive_final_exit` and
  `recovery_with_timely_trim_into_strength_and_constructive_final_exit`,
  which sit above the broader trim-into-strength and timely-protection
  branches when both are structurally true
- scaling quality now also includes
  `timely_profit_protection_with_premature_final_exit` and
  `recovery_with_timely_profit_protection_and_premature_final_exit`, which
  extend the timely-protection branch into early-exit endings so the system
  can distinguish "protected profit in time, but still sold too early" from
  both the broader timely-protection branch and the broader premature-exit
  branch
- scaling quality now also includes
  `trim_into_strength_with_premature_final_exit` and
  `recovery_with_trim_into_strength_and_premature_final_exit`, which extend
  the trim-into-strength branch into early-exit endings so the system can
  distinguish "trimmed well, but still sold too early" from both the broader
  trim-into-strength branch and the broader premature-exit branch
- scaling quality now also includes
  `add_into_strength_with_premature_final_exit` and
  `recovery_with_add_into_strength_and_premature_final_exit`, which extend
  the pressed-winner branch into early-exit endings so the system can
  distinguish "pressed well, but still sold too early" from both the broader
  add-into-strength branch and the broader premature-exit branch
- scaling quality now also includes
  `underutilized_winner_with_premature_final_exit` and
  `recovery_to_underutilized_winner_with_premature_final_exit`, which extend
  the under-pressed winner branch into early-exit endings so the system can
  distinguish "never pressed the winner enough, then still sold too early"
  from both the broader underutilized branch and the broader
  premature-exit branch
- scaling quality now also includes
  `timely_risk_response_with_stop_like_forced_exit_after_breakdown`
  `timely_risk_response_with_stop_like_forced_exit_before_rebound`
  `recovery_with_timely_risk_response_and_stop_like_forced_exit_after_breakdown`
  and `recovery_with_timely_risk_response_and_stop_like_forced_exit_before_rebound`,
  which open a fresher cross-family lane: the trader did react during the
  danger window, but the trade still later ended in a stop-like weak-side
  exit, with separate breakdown-versus-rebound-after-exit outcomes

That means the next best work should probably keep balancing:

- richer failure-side sequence detection
- richer constructive sequence detection
- richer whole-trade journey summaries that combine constructive mid-trade
  management with a later weak finish without only cloning the current
  ladders
- richer cross-family stop-like journeys beyond the first timely-risk-response
  branch

instead of only expanding one side.

---

## Best Next Ideas

These are the strongest next candidates from here:

1. Add richer cross-family trade-journey composites

Examples:

- recovered, managed constructively, then still exited stop-like
- protected profit in time, then still gave back enough to turn the finish
  weak
- constructive build and trim sequence that still ended in a disciplined
  winner or a specific failure mode

Progress:

- the exit lane now includes stop-like journey composites for both
  held-through-danger and delayed-risk-response paths, so the system can say
  whether the forced-feeling exit came from no response at all or from a late
  but insufficient response
- the exit lane now also includes recovery-aware stop-like endings, so it can
  separate "recovered, then later still got forced out" from both the broader
  stabilized-recovery branch and the broader stop-like branch
- the repeated constructive re-entry lane now also includes stop-like
  after-breakdown and before-rebound endings, plus recovery-aware repeated
  rescue counterparts
- Layer 3 now treats the stop-like rebound versions as richer than the
  broader premature-final-exit variants when both are true
- the constructive-management lane now also includes timely-protection
  premature endings, so it can separate "protected well, but still exited too
  early" from both the broader timely-protection branch and the broader
  premature-final-exit branch
- the constructive-management lane now also includes trim-into-strength
  premature endings, so it can separate "trimmed well, but still exited too
  early" from both the broader trim-into-strength branch and the broader
  premature-final-exit branch
- the scaling lane now also includes a broader balanced-management premature
  branch, so it can summarize "managed actively, but still sold too early"
  even when the trade does not cleanly belong to the more specific
  trim/protect/add ladders
- the repeated-cycle scaling lane now also includes a broad constructive
  summary branch, so it can say "this was repeated balanced management that
  still finished constructively" without over-claiming constructive re-entry
  quality when that stronger evidence is not present
- the scaling lane now also includes the broad balanced-management stop-like
  branch, so it can summarize "managed actively, but still later got forced
  out" even when the trade does not cleanly belong to the more specific
  timely-risk-response or re-entry stop-like ladders

2. Add constructive storyline composites

Examples:

- reduced risk during danger window
- trimmed into strength then avoided adverse followthrough
- scaled constructively then protected profit

Progress:

- first constructive storyline pass now includes
  `timely_risk_response_with_profit_protection`
  `constructive_readd_after_reduction`
  and `balanced_management_with_constructive_exit`

- constructive trim-into-strength coverage now also includes
  `trim_into_strength_with_constructive_final_exit`
  and `recovery_with_trim_into_strength_and_constructive_final_exit`

- trim -> re-add -> final exit story coverage has now started with
  `trim_readd_with_constructive_final_exit`
  and `trim_readd_with_missed_final_continuation`

Examples:

- reduced late then re-added then gave back
- trimmed into strength then chased re-entry badly
- partial profit then management deteriorated

3. Expand exit-management coverage

Examples:

- better early-exit / missed continuation variants
- stronger distinction between relief exit vs weak exit vs premature exit

Progress:

- early-exit and defensive-exit coverage now includes
  `defensive_exit_after_deterioration`
  and `premature_final_exit_after_constructive_management`

- fear-vs-discipline exit coverage now also includes
  `fearful_exit_after_weakening`
  and `disciplined_defensive_exit`

5. Add constructive recovery / rescue coverage

Examples:

- recover from early open loss and still protect the trade well
- recover from early adversity but still fail later management

Progress:

- recovery-story coverage now includes
  `constructive_recovery_after_early_adversity`
  and `recovery_after_early_adversity_with_failed_protection`

6. Add multi-cycle management coverage

Examples:

- repeated trim / re-add cycles that still stayed constructive
- repeated trim / re-add cycles that kept destabilizing the trade

Progress:

- multi-cycle storyline coverage now includes
  `repeated_trim_readd_with_constructive_management`
  and `repeated_trim_readd_with_unstable_management`

7. Add sharper re-entry-after-trim coverage

Examples:

- late chase re-entry after a constructive trim
- good pullback re-entry after a constructive trim
- repeated trim / re-add cycles that still ended in a premature final exit

Progress:

- re-entry-after-trim and richer repeated-cycle coverage now includes
  `late_chase_reentry_after_constructive_trim`
  `good_pullback_reentry_after_constructive_trim`
  and `repeated_trim_readd_with_premature_final_exit`

4. Add another coverage-audit pass later

Once a few more storyline composites exist, it will make sense to review:

- what trader behaviors are now represented well
- what behaviors are still underrepresented

---

## Practical System Map

When resuming, these are the most important code entry points.

### Layer 1 Foundation

- `src/lib/raw-trade-timeline/builders/create-raw-trade-timeline.ts`
- `src/lib/raw-trade-timeline/builders/build-trade-timeline.ts`
- `src/lib/raw-trade-timeline/state/build-trade-state-series.ts`

### Layer 1 Derived Signal Expansion

- `src/lib/raw-trade-timeline/derived/build-entry-context-derived-signals.ts`
- `src/lib/raw-trade-timeline/derived/build-add-context-derived-signals.ts`
- `src/lib/raw-trade-timeline/derived/build-reduction-context-derived-signals.ts`
- `src/lib/raw-trade-timeline/derived/build-profit-protection-derived-signals.ts`
- `src/lib/raw-trade-timeline/derived/build-post-exit-derived-signals.ts`
- `src/lib/raw-trade-timeline/derived/build-danger-window-derived-signals.ts`
- `src/lib/raw-trade-timeline/derived/build-reduction-readd-sequence-signals.ts`
- `src/lib/raw-trade-timeline/derived/build-readd-outcome-signals.ts`
- `src/lib/raw-trade-timeline/derived/build-trade-lifecycle-milestone-signals.ts`

### Layer 1 -> Layer 2 Contract

- `src/lib/pattern-input/types/pattern-input.ts`
- `src/lib/pattern-input/builders/build-pattern-input.ts`

### Layer 2 Detection

- `src/lib/pattern-detection/detect-patterns.ts`
- `src/lib/pattern-detection/registry/pattern-definitions.ts`
- `src/lib/pattern-detection/patterns/`

Current Layer 2 families in the repo include:

- execution frequency
- position building
- position reduction
- position structure
- trade duration
- trade excursion
- trade closure
- entry context
- entry quality
- exit quality
- scaling quality

### Layer 3 Normalization

- `src/lib/pattern-normalization/normalize-detected-patterns.ts`
- `src/lib/pattern-normalization/pattern-metadata.ts`
- `src/lib/pattern-normalization/pattern-suppression-rules.ts`
- `src/lib/pattern-normalization/types/normalized-pattern-result.ts`

### Layer 4 Preparation

- `src/lib/pattern-scoring/types/pattern-scoring-input.ts`
- `src/lib/pattern-scoring/builders/build-pattern-scoring-input.ts`
- `src/lib/pattern-scoring/types/pattern-scoring-result.ts`
- `src/lib/pattern-scoring/builders/build-pattern-scoring-result.ts`
- `src/lib/pattern-scoring/builders/build-family-calibration-report.ts`
- `src/lib/behavior-analysis/builders/build-behavior-analysis.ts`
- `src/lib/coaching/builders/build-trade-coaching-output.ts`
- `src/lib/coaching/builders/build-trade-feedback-from-scoring.ts`
- `src/lib/trader-behavior/builders/build-trader-behavior-profile.ts`

---

## Current Testing And Verification Map

The repo already has meaningful regression coverage.

### Main automated checks

- `npm test`
- `npm run verify:layer2`
- `npm run verify:layer3`

### What they protect

- raw timeline and derived-signal builders
- `PatternInput` assembly
- Layer 2 pattern detection behavior
- Layer 3 normalization behavior
- canonical handoff expectations for downstream layers

If a future session changes behavior in Layers 1 to 4,
these checks should be run before claiming the system is still aligned.

---

## 2026-04-14 Layer 4 Resume Instructions

If a future session needs to continue from where this session left off, use this order:

1. Read this section
2. Read:
   - `src/lib/pattern-scoring/builders/build-pattern-scoring-result.ts`
   - `src/lib/pattern-scoring/builders/build-family-calibration-report.ts`
   - `src/lib/behavior-analysis/builders/build-behavior-analysis.ts`
   - `src/lib/coaching/builders/build-trade-coaching-output.ts`
   - `src/lib/coaching/builders/build-trade-feedback-from-scoring.ts`
   - `src/lib/trader-behavior/builders/build-trader-behavior-profile.ts`
3. Read the focused tests:
   - `src/lib/pattern-scoring/__tests__/pattern-scoring-stress.test.ts`
   - `src/lib/behavior-analysis/__tests__/build-behavior-analysis.test.ts`
   - `src/lib/coaching/__tests__/build-trade-coaching-output.test.ts`
   - `src/lib/coaching/__tests__/trade-feedback-scenario-validation.test.ts`
   - `src/lib/trader-behavior/__tests__/build-trader-behavior-profile.test.ts`
4. Treat these truths as stable:
   - scoring is traceable, dominance-aware, and order-independent
   - `scaling_quality` remains the main scoring watchpoint
   - `position_structure` is explicit non-directional structural context in scoring
   - behavior analysis now emits `behaviorPriorityScore`, `behaviorClass`, `primaryBehavior`, `secondaryBehaviors`, `suppressedBehaviors`, and `behaviorIdentityCandidates`
   - coaching now enforces one main directive through `fixFirst`, with optional `fixNext`
   - trade feedback now carries explicit trade context: `tradeId`, `tradeIndex`, `sessionBucket`, and `sessionSegment`
   - trader-level aggregation now exists through `buildTraderBehaviorProfile(...)`
5. Best next Layer 4 work:
   - expand behavior registry coverage beyond the first implemented set
   - widen coaching templates and conflict rules carefully
   - deepen trader-identity coverage beyond the first deterministic identity set
   - expand multi-trade aggregation and recurrence logic beyond the first profile layer

### Latest Trader-Level Update

The trader-level profile layer is now materially beyond the first aggregation pass.

What is now live in `buildTraderBehaviorProfile(...)`:

- hardened profile confidence:
  - `profileConfidence`
  - `profileConfidenceReason`
  - `profileConfidenceSupport`
- stronger recurring-issue prioritization:
  - `developmentPriorities`
  - `developmentPriorityScore`
  - `developmentPriorityReason`
- deterministic trader development planning:
  - `developmentPlan.fixFirst`
  - `developmentPlan.fixSecond`
  - `developmentPlan.protectStrength`
  - `developmentPlan.sessionFocus`
  - `developmentPlan.planReason`
- streak and relapse intelligence:
  - `destructiveStreaks`
  - `improvingStreaks`
  - `relapseSignals`
  - `stabilizationSignals`
- stronger session-specific development output:
  - `sessionDevelopmentInsights`
- reporting-ready summary output:
  - `profileSummary`

Important behavior changes from the earlier first pass:

- trader identity confidence is now capped by profile-level confidence instead of being claimed only from local identity rules
- low sample size now explicitly reduces confidence
- scattered mixed destructive signals now reduce confidence
- repeated high-priority destructive behavior now increases confidence
- recurring mistake ranking is no longer just frequency-led; it now blends frequency, severity, primary-rate, destructive weight, outcome-cost proxy, deterioration pressure, and session concentration
- `topRecurringMistake`, `secondRecurringMistake`, and `improvementPriorityOrder` now follow the stronger development-priority model rather than the old simple weakness order

Latest focused verification command:

- `npm.cmd test -- src/lib/pattern-scoring/__tests__/build-pattern-scoring-input.test.ts src/lib/pattern-scoring/__tests__/build-pattern-scoring-result.test.ts src/lib/pattern-scoring/__tests__/build-family-calibration-report.test.ts src/lib/pattern-scoring/__tests__/pattern-scoring-stress.test.ts src/lib/behavior-analysis/__tests__/build-behavior-analysis.test.ts src/lib/coaching/__tests__/build-trade-coaching-output.test.ts src/lib/coaching/__tests__/trade-feedback-scenario-validation.test.ts src/lib/trader-behavior/__tests__/build-trader-behavior-profile.test.ts`

Latest result:

- `8` files passed
- `41` tests passed

Best next Layer 4 gap after this pass:

- behavior-registry breadth is still the limiting factor
- the new trader-level planning layer is now much stronger, but it can only reason about the behavior ids the single-trade registry already emits

### Follow-up Trader-Level Update

The trader-level layer now also has explicit progress and regression measurement.

What is now live on top of the profile / planning layer:

- deterministic progress scoring:
  - `progressScore`
  - `progressLabel`
  - `progressReason`
  - `progressSupport`
- explicit comparison windows:
  - `analysisWindows.baseline`
  - `analysisWindows.recent`
  - `analysisWindows.fullHistory`
  - `analysisWindows.lowSampleCaution`
- behavior-specific progress tracking:
  - `behaviorProgress`
  - baseline vs recent frequency / severity / primary-rate windows
  - direction / confidence / recurrence-stability output
- broader regression intelligence:
  - `regressionSignals`
  - `emergingRisks`
  - `fadingStrengths`
- intervention-effectiveness foundation:
  - `interventionReadiness`
  - `priorityEffectivenessSignals`
- adaptive planning feedback loop:
  - `adaptiveDevelopmentPlan`
- upgraded summary output:
  - progress headline
  - worsening-risk headline

Important design behavior:

- progress is not a naive average; destructive regression is weighted more heavily than weak positive drift
- low-sample windows now explicitly force caution
- relapse detection remains narrower, while regression intelligence now also catches worsening recurring issues, new destructive behaviors, and fading strengths
- adaptive planning can now keep focus, de-escalate improving issues, and surface escalating risks

Latest focused verification result after this pass:

- `8` files passed
- `46` tests passed

Best next trader-level gap after this follow-up:

- progress and adaptive planning are now real, but they are still behavior-registry limited
- future value will come most from broadening the single-trade behavior set and later tying plan changes to explicit user-selected intervention periods

### Latest Intervention-Aware Trader-Level Update

The trader-development layer now also supports explicit intervention periods and focus cycles.

What is now live:

- explicit intervention-period contracts:
  - `interventionPeriods`
  - explicit `interventionId`
  - target behavior / focus key
  - intervention type
  - goal type
  - start / end trade references
- intervention effectiveness measurement:
  - `interventionEvaluations`
  - before / during / after comparison windows
  - deterministic effectiveness label / score / confidence
- focus-cycle tracking:
  - `focusCycles`
  - `currentFocusCycle`
  - `focusCycleStatus`
- plan adherence / drift intelligence:
  - `planAdherenceSignals`
  - `planDriftSignals`
  - `focusMismatchWarnings`
- intervention-aware adaptive planning:
  - `currentInterventionRecommendation`
  - `shouldContinueFocus`
  - `shouldRotateFocus`
  - `rotationReason`
  - `tooEarlyToJudge`
- reporting-ready intervention summary:
  - `interventionSummary`

Important current assumption:

- explicit intervention periods are passed into `buildTraderBehaviorProfile(...)` as structured input
- the trader-behavior layer resolves them against trade ids / indexes and evaluates them deterministically
- no UI or persistence model is assumed yet; this is the analysis contract and evaluation logic only

Latest focused verification result after this pass:

- `8` files passed
- `51` tests passed

Best next gap after this intervention-aware pass:

- intervention analytics are now explicit, but they still depend on manually supplied intervention periods
- the next likely value is better upstream behavior coverage plus future workflow support for creating and storing those periods cleanly

### Latest Behavior-Registry Coverage Expansion

The next high-value Layer 4 limiter was the single-trade behavior registry, so the latest pass expanded that registry and carried the new coverage all the way through coaching, profile logic, and intervention-aware planning.

New behavior ids now live:

- destructive:
  - `failed_breakout_chasing`
  - `averaging_down`
  - `premature_exit`
  - `undersized_winner`
- strengths:
  - `strong_loss_containment`
  - `strong_winner_management`

Why this exact set was chosen:

- it improves trader-development quality more than adding more neutral structural descriptors
- it adds both mistake-side and strength-side coverage, which matters for adaptive planning and intervention evaluation
- it hardens several real mixed-trade cases the product cares about:
  - good entry but poor winner management
  - weak add quality with disciplined damage control
  - breakout chase that explicitly fails
  - clean winner handling vs under-monetized winners
- it is a better next expansion than adding broader vague buckets, because these behaviors are directly actionable and intervention-targetable

What now flows end-to-end:

- behavior analysis:
  - deterministic detection, classification, priority, and conflict handling for the new behaviors
- coaching:
  - focused templates for each new behavior without collapsing into vague multi-issue advice
- trader profile layer:
  - recurring weakness / strength ranking
  - identity interaction where justified
  - development priorities
  - development plan / adaptive development plan
  - intervention-readiness and intervention-effectiveness signals
- intervention-aware planning:
  - explicit intervention periods can now target the new destructive behaviors and measure before/during performance

Important calibration note:

- descriptive structural context alone still should not emit directional behavior labels
- the new behaviors were wired through directional pattern combinations and conflict rules rather than through neutral structural facts by themselves

Latest focused verification result after this pass:

- `8` files passed
- `61` tests passed

Best next coverage gap after this pass:

- the system is materially stronger on breakout-chase, rescue-add, winner-management, and defensive-containment behavior
- the biggest remaining behavior gap is still broader late-management / overholding / de-risk refusal coverage plus richer add-quality subtyping beyond the current average-down lane

---

## Current Strategic Read

The system is strongest now in:

- factual trade reconstruction
- deterministic structural detection
- failure-side management patterns
- risk-response and giveback coverage
- first sequence-level storyline patterns
- initial Layer 3 prioritization and overlap handling

The system is still developing most in:

- constructive management storylines
- deeper repeated-cycle trim / re-add stories
- richer early-exit and missed-opportunity variants
- stronger full-trade storyline composites
- future scoring / coaching layers that consume the normalized outputs

Recent Layer 1 to Layer 3 update:

- added the first reclaim-entry fact bundle and named reclaim-entry family
- Layer 1 now captures recent pre-entry reference reclaim facts
- Layer 2 now detects `reclaim_entry_structure` and
  `failed_reclaim_entry_structure`
- Layer 3 now prioritizes reclaim stories above broader entry-quality overlap
- Layer 2 now also detects `mean_reversion_entry_structure` and
  `failed_mean_reversion_entry_structure` on top of the deeper pullback plus
  reclaim lane
- Layer 2 now also detects the first honest session-aware setup lane:
  `market_open_breakout_entry_structure`,
  `market_open_breakout_chase_entry_structure`, and
  `failed_market_open_breakout_entry_structure`
- Layer 2 now also detects `market_open_reclaim_entry_structure` and
  `failed_market_open_reclaim_entry_structure`
- Layer 1 now also carries a small true opening-range fact bundle for first
  entry context during `market_open` / `open`
- Layer 2 now also detects `opening_range_breakout_entry_structure`,
  `opening_range_breakout_chase_entry_structure`, and
  `failed_opening_range_breakout_entry_structure`
- Layer 1 now also captures opening-range reclaim facts above the true opening
  range boundary after the initial opening window
- Layer 2 now also detects `opening_range_reclaim_entry_structure` and
  `failed_opening_range_reclaim_entry_structure`
- Layer 2 now also detects `balanced_management_with_missed_final_continuation`
  and `recovery_with_balanced_management_and_missed_final_continuation`
- Layer 2 now also detects
  `repeated_balanced_management_with_missed_final_continuation` and
  `repeated_rescue_attempts_with_balanced_management_and_missed_final_continuation`
- Layer 2 now also detects
  `timely_risk_response_with_defensive_final_exit_after_deterioration`
  and
  `recovery_with_timely_risk_response_and_defensive_final_exit_after_deterioration`
- Layer 2 now also detects
  `balanced_management_with_defensive_final_exit_after_deterioration`
  and
  `recovery_with_balanced_management_and_defensive_final_exit_after_deterioration`
- Layer 2 now also detects `balanced_management_with_fearful_final_exit` and
  `recovery_with_balanced_management_and_fearful_final_exit`
- Layer 2 now also detects
  `repeated_balanced_management_with_defensive_final_exit_after_deterioration`
  and
  `repeated_rescue_attempts_with_balanced_management_and_defensive_final_exit_after_deterioration`
- Layer 2 now also detects `repeated_balanced_management_with_fearful_final_exit`
  and
  `repeated_rescue_attempts_with_balanced_management_and_fearful_final_exit`
- Layer 3 now distinguishes the broader active-management missed-continuation
  storyline from the stricter premature-exit branch instead of flattening both
  into the same balanced-management early-exit summary
- Layer 3 now also carries repeated-cycle and recovery-aware repeated-cycle
  versions of that broad missed-continuation summary above the raw repeated
  trim/re-add ingredients
- Layer 3 now also carries the broader active-management defensive-save
  summary above the raw defensive-exit ingredients and below the stricter
  timely-risk-response and stop-like branches
- Layer 3 now also carries repeated-cycle and recovery-aware repeated-cycle
  versions of that broader active-management defensive-save summary above the
  raw repeated defensive-exit ingredients
- Layer 3 now also carries broad fearful-exit management summaries above the
  raw fearful-exit ingredients and below the stricter stop-like weak-side exit
  branches
- Layer 3 now also expresses the â€œprotected profit in time, but later still
  needed a defensive saveâ€ branch instead of flattening it into separate timely
  protection and defensive-exit ingredients
- the system still does not support a full generic opening-range/session
  taxonomy; current session-aware coverage is strongest in the opening-range
  breakout and reclaim lanes plus the earlier broader `market_open` breakout
  and reclaim lanes
- support / resistance should be treated as a near-term Layer 1 design lane,
  but it still needs a short factual-contract pass before implementation so the
  app does not drift into vague level-detection claims
- provider-agnostic candle/session normalization is now an explicit priority
  check for this lane and for the already-built Layer 1-3 work; if hidden
  provider-specific assumptions are found, fixing those takes priority over
  deeper support / resistance feature growth
- that broader code audit has now been run across the current Layer 1-3
  implementation, and the main concrete adjustment was to centralize
  session-bucket normalization into canonical internal labels like
  `market_open`, then apply that normalization in both the top-level raw
  timeline creator and the lower-level timeline builder so future providers do
  not break opening-range and session patterns just by naming sessions
  differently
- the provider boundary is now also harder at the type level: session buckets
  are no longer treated as loose strings inside the normalized Layer 1
  contract, and unknown provider session labels now resolve to an explicit
  `unknown` state instead of leaking arbitrary values upward
- the broader candle contract still looks sound: provider adapters remain
  outside Layer 1 and the current raw candle shape is already provider-agnostic
- EMA / MA context is still useful later, but it is lower-priority than
  support / resistance for trader-facing feedback right now
- the repo now also has a concrete coding bridge for this lane in
  `src/docs/layer1-raw-data/support-resistance-implementation-plan.md`,
  including raw types, PatternInput bridge fields, file layout, and build order

---

## If A Future Session Asks "Where Did We Leave Off?"

The short answer is:

we already moved beyond architecture-only planning,
and we are in the stage of expanding and hardening
the Layer 1 -> Layer 2 -> Layer 3 pipeline.

The most likely next useful work should be one of:

1. pivot to the next strongest genuinely new Layer 1-3 family instead of adding close cousins of the current broad-summary ladders
2. continue the provider/candle-contract audit if any additional hidden session
   or data-availability assumptions appear while support / resistance work grows
3. start the support / resistance lane from the new
   implementation-plan doc by building raw types plus the structural context
   window / reference-level slice
4. if any further hidden provider assumptions are found, treat those fixes as
   immediate priority work before deeper level-engine implementation
5. sharpen Layer 3 arbitration as pattern overlap grows
6. extend verification coverage when new pattern families are added

---

## Working Rules For Future Updates

When this file is updated, prefer:

- high-signal summaries
- major architecture or pattern additions
- concrete next priorities
- one continuity log instead of multiple overlapping mini-logs

Avoid:

- low-value changelog noise
- creating a second incremental changelog file for routine Codex work when this
  project log already captures the meaningful resume state
- repeating the entire detailed architecture
- listing every tiny edit

This file should stay useful and readable.

Default documentation rule:

- use `src/docs/codex-project-log.md` as the running Codex continuity log
- only create a separate `CHANGELOG.md` if the repo later needs a true
  user-facing release history or the user explicitly asks for one

---

## Update Habit

This file should be updated when:

- a meaningful Layer 1 builder is added
- several new Layer 2 patterns are added
- Layer 3 normalization changes materially
- the recommended next priorities change

It does not need to be updated for every tiny edit.

---

## 2026-04-14 Support/Resistance Lane Progress

Support/resistance is now beyond planning and into live Layer 1-3 implementation.

What is now live in Layer 1:

- normalized raw support/resistance types
- structural context window output
- named reference levels:
  - previous day high / low / close
  - premarket high / low / base
- dynamic levels:
  - VWAP
  - EMA 9
  - EMA 20
- first factual pivot detection:
  - tight pivots
  - strict pivots
- first support/resistance ladders
- first merge / touch / reaction / filtering / scoring pass
- first gap-structure detection
- per-execution level relations
- insufficient-candle-data structural flag

What is now bridged into PatternInput:

- first-entry nearest support / resistance prices
- first-entry distance to nearest support / resistance
- first-entry near-support / near-resistance / open-air flags
- first-entry nearest reference-level label
- first-entry VWAP / EMA distance facts
- final-exit support/resistance distance and near-support / near-resistance flags
- reduction counts near support / resistance
- structure-availability flags

What is now live in Layer 2 / Layer 3:

- `entry_near_support_structure`
- `entry_far_from_support_structure`
- `entry_under_resistance_structure`
- `exit_into_support_structure`
- `exit_into_support_with_relief_after_exit`
- `add_into_resistance_structure`

Important current limitation:

- this is an honest first support/resistance-aware slice, not a full breakout-clearance or stacked-resistance engine yet
- the current relation model is strong enough for near-support / under-resistance / exit-into-support patterns
- it is not yet strong enough to claim a full â€œbreakout with room aboveâ€ family without more relation depth

Best next move from here:

1. deepen the raw factual engine with better merge / touch / reaction quality and richer execution-to-level relations
2. then add the next support/resistance-aware Layer 2 families like:
   - breakout-clearance / room-above patterns once relation semantics are stronger
   - richer add-above-resistance vs add-near-resistance split
   - richer exit-into-support variants beyond the first relief-after-exit branch

### Follow-up Update

That next pass is now partly complete too.

What deepened in the raw engine:

- merge now uses weighted level prices instead of plain averaging
- touch clustering is slightly stricter and less prone to counting one continuous probe as too many clusters
- reactions now consider closes as well as excursion extremes
- execution-level relations now include:
  - whether structure exists on both sides
  - distance between nearest support and resistance
  - room to nearest support / resistance

What broadened in PatternInput:

- first-entry bounded-structure flag
- first-entry support/resistance band width
- first-entry nearest resistance-below clearance facts
- add-level relation counts:
  - adds near support
  - adds near resistance
  - adds above resistance
  - adds below support
- add-level above-resistance-with-room counts
- average add distance to nearest support / resistance
- average add room to next resistance

What new support/resistance-aware Layer 2 patterns are now live:

- `entry_far_from_support_structure`
- `add_into_resistance_structure`
- `exit_into_support_with_relief_after_exit`

### Later Follow-up Update

The next raw-relation tightening pass is now live too.

What deepened in the raw engine:

- execution-level relations now distinguish:
  - nearest resistance below the execution
  - distance above that broken resistance
  - whether the execution truly cleared nearby resistance
  - whether room still existed above after that clearance
- this replaces the older ambiguous "above nearest resistance" idea with a
  cleaner breakout-clearance contract

What changed in PatternInput:

- first-entry resistance-clearance facts:
  - `firstEntryNearestResistanceBelowPrice`
  - `firstEntryDistanceAboveNearestResistanceBelowPct`
  - `firstEntryClearedNearestResistanceBelow`
  - `firstEntryHadRoomAboveAfterClearingResistance`
- add-level separation facts:
- `addsAboveResistanceWithRoomCount`
- `averageAddRoomToNextResistancePct`
- `firstEntryResistanceLevelsAboveWithinClusterCount`
- `firstEntryHasStackedResistanceAbove`
- `finalExitSupportLevelsBelowWithinClusterCount`
- `finalExitHasStackedSupportBelow`

What new support/resistance-aware Layer 2 patterns are now live:

- `breakout_with_room_above_structure`
- `add_above_resistance_structure`
- `breakout_into_overhead_resistance_structure`
- `exit_into_support_before_breakdown`
- `add_above_resistance_with_constructive_final_exit`
- `add_above_resistance_with_failed_profit_protection`
- `recovery_with_add_above_resistance_and_constructive_final_exit`
- `recovery_with_add_above_resistance_and_failed_profit_protection`
- `repeated_adds_above_resistance_with_constructive_final_exit`
- `repeated_adds_above_resistance_with_failed_profit_protection`
- `breakout_with_room_above_and_constructive_final_exit`
- `breakout_with_room_above_and_failed_profit_protection`
- `recovery_with_breakout_with_room_above_and_constructive_final_exit`
- `recovery_with_breakout_with_room_above_and_failed_profit_protection`
- `breakout_into_overhead_resistance_with_defensive_final_exit`
- `breakout_into_overhead_resistance_with_failed_profit_protection`
- `recovery_with_breakout_into_overhead_resistance_and_defensive_final_exit`
- `recovery_with_breakout_into_overhead_resistance_and_failed_profit_protection`
- `exit_into_stacked_support_with_relief_after_exit`
- `exit_into_thin_support_before_breakdown`
- `exit_into_resistance_with_reversal_after_exit`
- `exit_into_resistance_before_breakout`
- `trim_into_resistance_with_constructive_final_exit`
- `trim_into_resistance_with_premature_final_exit`
- `balanced_management_with_take_profit_into_resistance_and_constructive_final_exit`
- `balanced_management_with_take_profit_into_resistance_and_premature_final_exit`
- `stabilized_recovery_with_exit_into_stacked_support_and_relief`
- `stabilized_recovery_with_exit_into_resistance_and_reversal`
- `stabilized_recovery_with_exit_into_resistance_before_breakout`
- `recovery_with_trim_into_resistance_and_constructive_final_exit`
- `recovery_with_trim_into_resistance_and_premature_final_exit`
- `recovery_with_balanced_management_and_take_profit_into_resistance_and_constructive_final_exit`
- `recovery_with_balanced_management_and_take_profit_into_resistance_and_premature_final_exit`
- `stabilized_recovery_with_exit_into_thin_support_before_breakdown`
- `repeated_balanced_management_with_exit_into_stacked_support_and_relief`
- `repeated_balanced_management_with_exit_into_thin_support_before_breakdown`
- `repeated_balanced_management_with_trim_into_resistance_and_constructive_final_exit`
- `repeated_balanced_management_with_trim_into_resistance_and_premature_final_exit`
- `repeated_balanced_management_with_take_profit_into_resistance_and_constructive_final_exit`
- `repeated_balanced_management_with_take_profit_into_resistance_and_premature_final_exit`
- `repeated_rescue_attempts_with_balanced_management_and_exit_into_stacked_support_and_relief`
- `repeated_rescue_attempts_with_balanced_management_and_exit_into_thin_support_before_breakdown`
- `repeated_rescue_attempts_with_balanced_management_and_trim_into_resistance_and_constructive_final_exit`
- `repeated_rescue_attempts_with_balanced_management_and_trim_into_resistance_and_premature_final_exit`
- `repeated_rescue_attempts_with_balanced_management_and_take_profit_into_resistance_and_constructive_final_exit`
- `repeated_rescue_attempts_with_balanced_management_and_take_profit_into_resistance_and_premature_final_exit`

What got cleaner:

- `add_into_resistance_structure` now means crowding into nearby resistance
  rather than mixing together "near resistance" and "already above broken
  resistance"

Best next move from here:

1. keep deepening raw execution-to-level relation quality before adding many more named patterns
2. then add the next honest support/resistance-aware families like:
   - reduction / take-profit into resistance branches beyond the first one-cycle and repeated trim-aware slices
   - deeper breakout-into-stacked-resistance nuance beyond the first branch
   - repeated-cycle support/resistance-aware reduction or add-above-resistance branches if they still add real signal
3. hierarchy reminder:
   - the new `balanced_management_with_take_profit_into_resistance_*` summaries sit above broad balanced-management exits
   - the stricter `trim_into_resistance_*` and `recovery_with_trim_into_resistance_*` branches still outrank those broader summaries when both are present
   - the same hierarchy now applies in the repeated lane: `repeated_*_take_profit_into_resistance_*` summaries sit above broad repeated balanced-management exits, while the stricter repeated `trim_into_resistance_*` branches still outrank them

## 2026-05-05 - Prototype Analysis Panel Wired Into Import Dry Run

What changed:

- Added `buildCsvDryRunPrototypeAnalysisPanel(...)` in
  `src/lib/trader-analytics/product/functional-readiness.ts`.
- Exported the panel and lightweight decision-review snapshot types from
  `src/lib/trader-analytics/index.ts`.
- Rendered a new `Prototype Analysis` section in
  `app/import-dry-run/import-dry-run-client.tsx`.
- Updated the dry-run route smoke contract so the panel is required.
- Added unit tests for:
  - ready/prototype-generated imports
  - blocked imports
  - supplied daily/4h decision-review facts
- Added Playwright assertions that the route shows the panel and does not imply
  production writes.

Important boundary:

- The browser dry-run route does not import server-only trade-analysis or
  levels-system code.
- The panel shows execution-autopsy findings now.
- Daily/4h decision-review facts can be attached later as precomputed snapshots
  from `TradeAnalysisSummary.decisionReview`.
- VWAP/EMA feedback and lower-timeframe support/resistance coaching remain
  disabled/deferred.

Verification:

- `npx vitest run src/lib/trader-analytics/__tests__/trader-functional-product-readiness.test.ts --reporter=dot`
- `npx vitest run src/lib/trader-analytics/__tests__/trader-import-automated-qa-harness.test.ts --reporter=dot`
- `npx tsc --noEmit --pretty false`
- `npm run build`
- `npx playwright test tests/e2e/import-dry-run.spec.ts --project=chromium-desktop`
- `npm test -- --reporter=dot`

Result:

- 87 Vitest files passed, 803 tests passed.
- The import-dry-run desktop Playwright suite passed.

Best next move:

1. Add fee/commission visibility to import review without changing gross-only
   scoring.
2. Add the real CSV calibration guide.
3. Add mobile and review-warning Playwright coverage for the prototype analysis
   panel.
4. Decide whether to create a server/API bridge that transforms
   `TradeAnalysisSummary.decisionReview` into
   `CsvDryRunPrototypeDecisionReviewInput` for completed imported trades.

## 2026-05-05 - Fee And Commission Visibility Added To Import Dry Run

What changed:

- Added `CsvDryRunCostVisibilityPanel` and `CsvDryRunCostVisibilityItem` to
  `src/lib/trader-analytics/product/types.ts`.
- Added `buildCostVisibility(...)` inside
  `src/lib/trader-analytics/product/csv-dry-run-workflow.ts`.
- `CsvDryRunImportExperience` now includes `costVisibility`.
- `/import-dry-run` now renders `Fee / Commission Visibility`.
- The dry-run route smoke contract now requires that panel.
- Tests now cover a CSV with `Commission`, `Fees`, `Amount`, and `Currency`.

Important boundary:

- Fees, commissions, broker net amount, and currency are import-review context.
- Execution feedback scoring remains `gross_execution_pnl_only`.
- `execution_feedback_summary_v1` was not changed to include net P/L.
- No production persistence or export behavior was added.

Verification:

- `npx vitest run src/lib/trader-analytics/__tests__/trader-csv-dry-run-import-ui.test.ts src/lib/trader-analytics/__tests__/trader-import-automated-qa-harness.test.ts --reporter=dot`
- `npx tsc --noEmit --pretty false`
- `npm run build`
- `npx playwright test tests/e2e/import-dry-run.spec.ts --project=chromium-desktop`
- `npx playwright test tests/e2e/import-dry-run.spec.ts --project=chromium-mobile`
- `npm test -- --reporter=dot`

Result:

- 87 Vitest files passed, 804 tests passed.
- Desktop and mobile import-dry-run Playwright suites passed.

Note:

- Two levels/trade-analysis integration tests passed in isolation but timed out
  under full-suite worker load at the default 5 seconds. Their individual
  timeouts were raised to 15 seconds so full-suite verification remains
  bounded and stable.

Best next move:

1. Add review-warning Playwright coverage for `Prototype Analysis` and
   `Fee / Commission Visibility` if that state is not covered elsewhere.
2. Decide whether to add a server bridge that attaches
   `TradeAnalysisSummary.decisionReview` snapshots to the dry-run panel.

## 2026-05-05 - Real CSV Calibration Guide Added

What changed:

- Added `src/docs/trader-real-csv-calibration-guide.md`.

What it covers:

- safe anonymization for broker execution CSVs
- columns that matter for import calibration
- what not to send
- broker notes
- expected calibration outputs
- bounded non-watch verification commands
- boundary reminder that this app imports executions, while `levels-system`
  owns candles, support/resistance, VWAP, EMA, and market structure

Best next move:

1. Add review-warning Playwright coverage for `Prototype Analysis` and
   `Fee / Commission Visibility` if needed.
2. Decide whether to add a server bridge that attaches
   `TradeAnalysisSummary.decisionReview` snapshots to the dry-run panel.

## 2026-05-05 - Dry-Run Decision Review Bridge Implemented

Plan:

- Added `src/docs/trader-decision-review-bridge-implementation-plan.md`.

What changed:

- Added server-only bridge:
  `src/lib/trader-analytics/server/build-csv-dry-run-decision-review-bridge.ts`
- Added API route:
  `app/api/import-dry-run/decision-review/route.ts`
- Added deterministic CSV scenarios:
  `src/lib/trader-analytics/__fixtures__/decision-review-csv-scenarios.ts`
- Updated `/import-dry-run` so `Prototype Analysis` has a button-driven
  `Run Review` path.
- Added route/UI tests for:
  - blocked imports
  - open-position review imports
  - attached decision-review snapshots
  - fee/commission visibility
- Added boundary tests proving the browser client does not import
  levels-system or trade-analysis server modules.

Important boundary:

- The client posts dry-run input to a server route.
- The server route returns lightweight decision-review snapshots.
- The browser does not fetch candles, calculate support/resistance, calculate
  VWAP/EMA, or run market-structure analysis.
- Market-context usage only counts when the snapshot source is
  `levels_system_daily_4h`.

Verification completed during implementation:

- `npx vitest run src/lib/trader-analytics/__tests__/csv-dry-run-decision-review-bridge.test.ts --reporter=dot`
- `npx vitest run src/lib/trader-analytics/__tests__/csv-dry-run-decision-review-api-route.test.ts src/lib/trader-analytics/__tests__/csv-dry-run-decision-review-bridge.test.ts --reporter=dot`
- `npx vitest run src/lib/trader-analytics/__tests__/csv-dry-run-decision-review-boundary.test.ts src/lib/trader-analytics/__tests__/csv-dry-run-decision-review-bridge.test.ts src/lib/trader-analytics/__tests__/csv-dry-run-decision-review-api-route.test.ts --reporter=dot`
- `npx tsc --noEmit --pretty false`
- `npm run build`
- `npx playwright test tests/e2e/import-dry-run.spec.ts --project=chromium-desktop`
- `npx playwright test tests/e2e/import-dry-run.spec.ts --project=chromium-mobile`
- `npm test -- --reporter=dot`

Result:

- Focused decision-review/import Vitest: 5 files passed, 33 tests passed.
- Desktop Playwright: 7 tests passed.
- Mobile Playwright: 7 tests passed.
- Full Vitest: 90 files passed, 816 tests passed.

Note:

- Desktop and mobile Playwright should run sequentially because both use port
  `127.0.0.1:3100`.
- Post-verification process check did not show leftover `vitest`, `next build`,
  or Playwright server commands from this branch. Existing unrelated Node
  processes from sibling `levels-system` scripts were still present.

Best next move:

1. Expand decision-review scenarios as more real imported trade examples become
   available.
2. Keep improving the trader-facing wording in `Prototype Analysis`.
3. Later, promote the prototype route into the authenticated persisted import
   flow.

## 2026-05-05 - Decision Review Calibration And Level Grades Added

Plan:

- Added `src/docs/trader-decision-review-real-csv-calibration-plan.md`.

What changed:

- Expanded deterministic CSV decision-review scenarios to include:
  - entry near major daily/4h resistance with limited room
  - entry near support with premature-exit and failed-protection evidence
  - repeated adds after extension
- Added server/internal quality dashboard:
  `src/lib/trader-analytics/server/build-decision-review-quality-dashboard.ts`
- Added markdown formatter for decision-review quality dashboard output.
- Added bounded runner: `npm run calibrate:decision-review`.
- `PatternInputSupportResistanceContext` now carries nearest first-entry
  support/resistance strength bucket, exact source strength label, score, and
  reaction strength.
- `TradeDecisionReview.marketContext` now exposes nearest support/resistance
  strength bucket, exact source strength label, and score.
- Market-context insight wording/evidence now includes graded level context,
  such as `Entry was close to major daily/4h resistance`.
- Updated the real CSV calibration guide, feedback capabilities doc, and
  functional readiness handoff.

Important boundary:

- `levels-system` still owns support/resistance detection and grading.
- This app consumes the returned grade; it does not compute levels locally.
- VWAP/EMA trader-facing feedback remains disabled.
- True real CSV calibration remains gated until anonymized user examples are
  available.

Verification:

- `npx tsc --noEmit --pretty false`
- focused grade/dashboard Vitest: 5 files passed, 19 tests passed
- focused decision-review Vitest: 4 files passed, 17 tests passed
- `npm run calibrate:decision-review -- --generated-at=2026-05-05T12:00:00.000Z`
  passed with 4 deterministic scenarios, 0 review, and 0 fail.
- `npm run build`
- `npm test -- --reporter=dot`

Result:

- Full Vitest passed with 91 files and 822 tests.
- Post-verification process check did not show leftover `vitest`, `next build`,
  or Playwright runner commands from this branch. Existing unrelated Node
  processes from sibling `levels-system` scripts and manual watchlist runtime
  were still present.

Best next move:

1. Add anonymized real broker CSV examples when safe files are available.
2. Convert any real false-positive/false-negative review into a synthetic
   scenario fixture.
3. Promote the dry-run decision-review bridge only after calibration quality is
   reviewed.

### Follow-up Review Quality Tightening

What changed:

- Decision-review market context no longer emits both
  `entry_near_daily_4h_support` and `entry_far_from_daily_4h_support` for the
  same first entry.
- Support/resistance distance evidence now formats level-distance percent
  values directly instead of multiplying them by 100 again.
- Generic no-primary-behavior coaching headlines are replaced with clearer
  market-context headlines when the review has stronger daily/4h facts.
- The decision-review quality dashboard now fails if contradictory support
  insights or the generic fallback headline reappear.

Verification:

- `npx tsc --noEmit --pretty false`
- focused decision-review Vitest: 3 files passed, 14 tests passed
- `npm run calibrate:decision-review -- --generated-at=2026-05-05T12:00:00.000Z`
  passed with 4 deterministic scenarios, 0 review, and 0 fail.
- `npm run build`
- `npm test -- --reporter=dot`

Result:

- Full Vitest passed with 91 files and 822 tests.
- Post-verification process check did not show leftover `vitest`, `next build`,
  Playwright, or dashboard-runner commands from this branch. Existing unrelated
  Node processes from sibling `levels-system` scripts and manual watchlist
  runtime were still present.

### Follow-up Decision Review Runner And Arbitration

What changed:

- Added a deterministic fixture for the target feedback shape:
  first entry near major daily/4h resistance, limited clean room, and a later
  add after much of the move was already used.
- Decision-review headlines now replace stale "adds aligned with strength"
  wording when that strength insight was suppressed by stronger add-risk facts.
- The decision-review quality dashboard now checks required headline fragments
  and stale context-sensitive headline fragments.
- `npm run calibrate:decision-review` now writes
  `artifacts/decision-review-quality/latest.md` by default, or `.json` with
  `--json`.
- The same runner can inspect safe real CSV files with:
  `--csv`, `--broker`, `--max-trades`, `--account-timezone`, `--out`, and
  `--no-write`.

Verification:

- `npx tsc --noEmit --pretty false`
- focused quality dashboard Vitest: 1 file passed, 3 tests passed
- `npm run calibrate:decision-review -- --generated-at=2026-05-05T12:00:00.000Z`
  passed with 5 deterministic scenarios, 0 review, and 0 fail.
- real CSV runner smoke passed with `--csv`, `--broker`, `--max-trades`, and
  custom `--out`.
- `npm run build`
- `npm test -- --reporter=dot`

Result:

- Full Vitest passed with 91 files and 823 tests.
- Post-verification process check did not show leftover `vitest`, `next build`,
  Playwright, or dashboard-runner commands from this branch. Existing unrelated
  Node processes from sibling `levels-system` scripts and manual watchlist
  runtime were still present.

### Import Dry-Run Review Display And Report History

What changed:

- `/import-dry-run` now renders attached decision-review snapshots as
  per-trade review cards inside `Prototype Analysis`.
- Decision-review cards group evidence by market context, entry, adds/scaling,
  exit, trade-window, and other categories.
- Insight evidence now displays as compact chips, so level strength, level
  distance, trade-window MFE/MAE, and add-position facts are easier to inspect.
- Server-side decision-review diagnostics now surface directly in the prototype
  panel when trades are skipped, capped, blocked, or fail analysis.
- `npm run calibrate:decision-review` now writes both the latest report and a
  timestamped history report by default.
- `--no-history` can be used when only the latest/custom output should be
  written.

Verification:

- `npx tsc --noEmit --pretty false`
- focused functional-readiness Vitest: 1 file passed, 13 tests passed
- `npm run calibrate:decision-review -- --generated-at=2026-05-05T12:00:00.000Z`
  passed with 5 deterministic scenarios and wrote both latest and timestamped
  reports.
- `npm run build`
- `npx playwright test tests/e2e/import-dry-run.spec.ts --project=chromium-desktop`
- `npx playwright test tests/e2e/import-dry-run.spec.ts --project=chromium-mobile`

Result:

- Desktop import-dry-run Playwright passed with 7 tests.
- Mobile import-dry-run Playwright passed with 7 tests.
- Post-verification process check did not show leftover `vitest`,
  `next build`, Playwright test, or dashboard-runner commands from
  `trader-intelligence-v2`. Existing unrelated sibling levels/watchlist Node
  and Playwright Chromium processes were still present.

### Batch CSV Calibration Added

What changed:

- `npm run calibrate:decision-review` now supports `--csv-dir` for a folder of
  anonymized CSVs.
- Batch mode recursively finds `.csv` files, runs each through the same
  server-only dry-run decision-review bridge, and produces an overall index.
- Default batch outputs:
  - `artifacts/decision-review-quality/latest-batch.md`
  - `artifacts/decision-review-quality/<timestamp>-csv-dir/index.md`
  - one per-CSV report in the timestamped batch folder
- Added `src/docs/trader-real-csv-miss-to-fixture-template.md` so real
  calibration misses can be converted into synthetic fixtures without
  committing private data.

Verification:

- `npx tsc --noEmit --pretty false`
- focused quality dashboard Vitest: 1 file passed, 3 tests passed
- `npm run calibrate:decision-review -- --csv-dir=artifacts/decision-review-quality/batch-smoke --broker=generic_execution_csv --generated-at=2026-05-05T12:30:00.000Z --max-trades=1`

Result:

- Batch smoke passed with 2 CSV files, 2 completed reviews, and 0 diagnostics.

### Decision Review Edge Fixtures Expanded

What changed:

- Deterministic decision-review calibration now covers 10 scenarios.
- Added fixture coverage for:
  - realistic IBKR activity statement import into decision review
  - failed entry near major daily/4h resistance
  - partial exit from a nearby support entry
  - completed short-trade smoke coverage
  - open-position skip diagnostics
- Major-resistance/limited-room market context now wins the coaching headline
  when it is present, even if the generic coaching layer would otherwise focus
  on an exit issue.
- The quality dashboard can now represent expected no-review/skipped-trade
  cases without marking them as failures.
- Dashboard markdown now includes import status, completed review counts, and
  diagnostics for each scenario.

Verification:

- `npx tsc --noEmit --pretty false`
- focused decision-review Vitest: 2 files passed, 15 tests passed
- `npm run calibrate:decision-review -- --generated-at=2026-05-05T12:00:00.000Z --no-history`
- `npm run build`

Result:

- Decision-review calibration passed with 10 scenarios, 0 review, and 0 fail.
- Production build passed.

### Short Trade Decision Review Wording Tightened

What changed:

- Decision-review daily/4h market context is now direction-aware for completed
  short trades.
- Long trades keep the existing support-cushion and resistance-room language.
- Short trades no longer receive long-only `entry_far_from_daily_4h_support`
  or `breakout_had_room_above` insights.
- Short entries can now surface:
  - `short_entry_near_daily_4h_support` when support below limits clean
    downside room
  - `short_entry_had_room_to_support` when the short has cleaner room before
    daily/4h support
  - `short_entry_had_nearby_daily_4h_resistance` when nearby resistance can act
    as structural cover above the entry
- Short adds near daily/4h support now surface as
  `short_adds_near_daily_4h_support` scaling risk.
- The short completed-trade smoke fixture now forbids long-biased "room above",
  "structural cushion underneath", and "upside was not especially clean"
  wording.

Verification:

- `npx tsc --noEmit --pretty false`
- focused decision-review Vitest: 2 files passed, 15 tests passed
- `npm run calibrate:decision-review -- --generated-at=2026-05-05T12:00:00.000Z --no-history`
- `npm run build`

Result:

- Decision-review calibration passed with 9 scenarios, 0 review, and 0 fail.
- Production build passed.
- Post-verification process check did not show leftover `vitest`, `next
  build`, Playwright, or dashboard-runner commands from `trader-intelligence-v2`;
  the only matching process was the process-check command itself.

### IBKR CSV Dry-Run Readiness Tightened

What changed:

- The IBKR sample dry-run preset now uses a more realistic activity statement
  shape with preamble rows, `Trades/Header`, signed quantities, `Currency`,
  `Proceeds`, and `Comm/Fee`.
- The CSV importer now recognizes `Comm/Fee` / `Comm Fee` / `CommFee` as
  commission cost evidence.
- Plain IBKR `Proceeds` is no longer treated as broker net amount. That avoids
  a false broker/app P/L mismatch because activity-statement proceeds are gross
  proceeds while `Comm/Fee` is separate.
- Added importer coverage proving the realistic IBKR shape parses as a closed
  trade with costs visible.
- Added an IBKR activity statement decision-review scenario to the calibration
  dashboard.
- The real CSV calibration guide now tells future sessions to keep `Comm/Fee`
  and not treat plain IBKR `Proceeds` as net P/L.

Verification:

- `npx tsc --noEmit --pretty false`
- focused importer/dry-run/decision-review Vitest: 4 files passed, 50 tests
  passed
- `npm run calibrate:decision-review -- --generated-at=2026-05-05T12:00:00.000Z --no-history`
- `npm run build`

Result:

- Decision-review calibration passed with 10 scenarios, 0 review, and 0 fail.
- Production build passed.

### Real IBKR Monthly CSV Calibration Smoke

What changed:

- Tested a private, git-ignored April IBKR Activity Statement CSV from
  `artifacts/real-csv-calibration/private`.
- Kept the original filename intact to exercise the same path a real user would
  take.
- No month-wide candle backfill was run. The CSV calibration used the local
  file and capped decision-review analysis to the first 5 eligible completed
  trades.
- Hardened the IBKR parser for full monthly Activity Statement shape:
  - accepts stock execution rows from the `Trades/Data/.../Stocks` section
  - skips IBKR subtotals/totals, Forex rows, repeated headers, deposits, and
    financial-instrument-info rows as non-execution rows
  - avoids treating those expected skipped rows as repair blockers
- Mapping confidence now ignores expected skipped non-execution rows and
  grouping/open-position validation warnings.
- Import quality no longer double-counts grouping/open-position review against
  the score.
- Added a synthetic regression test for full IBKR monthly statements so the
  private CSV does not need to become a fixture.

Private calibration result:

- row count: 918
- accepted stock executions: 574
- rejected rows: 0
- skipped non-execution/non-stock rows: 344
- grouped trade requests: 218
- mapping confidence: high, score 93
- import gate: needs_review, score 55
- review reason: 21 grouped trades/open-position reconstructions need review
- capped decision-review run: 5 completed reviews from 5 selected eligible
  trades, with market context source `levels_system_daily_4h`

Verification:

- `npx vitest run src/lib/execution-sources/csv/__tests__/broker-execution-csv-import.test.ts src/lib/trader-analytics/__tests__/trader-csv-dry-run-import-ui.test.ts --reporter=dot`
- private CSV calibration:
  `npm run calibrate:decision-review -- --csv=artifacts/real-csv-calibration/private/<private-ibkr-file>.csv --broker=ibkr_activity_statement --account-timezone=America/Toronto --max-trades=5 --out=artifacts/real-csv-calibration/private/ibkr-april-first-5-calibration.md --no-history`
- `npx tsc --noEmit --pretty false`
- `npm run calibrate:decision-review -- --generated-at=2026-05-05T12:00:00.000Z --no-history`
- `npm run build`

Result:

- Focused importer/dry-run tests passed with 2 files / 35 tests.
- Synthetic decision-review calibration passed with 10 scenarios, 0 review, and
  0 fail.
- Production build passed.

### IBKR Monthly Grouping Review Tightened

What changed:

- Added `src/scripts/run-ibkr-grouping-review-report.ts` for private local
  grouping diagnostics against IBKR Activity Statement CSVs.
- Generated private report:
  `artifacts/real-csv-calibration/private/ibkr-april-grouping-review.md`.
- Compared grouping rules against the April private IBKR statement:
  - current strict rule (`240m` plus session split): 218 grouped trades, 21
    open review cases
  - IBKR monthly rule (`10080m` and no session split): 208 grouped trades, 2
    open review cases
- Updated `/import-dry-run` IBKR defaults to allow stock positions to close
  across sessions and across up to 7 days. Other broker/generic dry-run imports
  keep the conservative `240m` plus session-boundary split default.
- Added dry-run test coverage proving an IBKR overnight buy/sell pair becomes
  one closed grouped trade instead of two fake open trades.

Private calibration result after grouping change:

- row count: 918
- accepted stock executions: 574
- rejected rows: 0
- skipped non-execution/non-stock rows: 344
- grouped trade requests: 208
- grouping review cases: 2
- open symbols still skipped from completed-trade decision review: 2 private
  calibration symbols
- first-25 capped decision-review calibration completed 25 reviews from 25
  selected eligible trades with market context source `levels_system_daily_4h`

Verification:

- `npx vitest run src/lib/execution-sources/csv/__tests__/broker-execution-csv-import.test.ts src/lib/trader-analytics/__tests__/trader-csv-dry-run-import-ui.test.ts --reporter=dot`
- `npx tsx src/scripts/run-ibkr-grouping-review-report.ts --csv=artifacts/real-csv-calibration/private/<private-ibkr-file>.csv --account-timezone=America/Toronto --out=artifacts/real-csv-calibration/private/ibkr-april-grouping-review.md`
- private CSV first-25 calibration:
  `npm run calibrate:decision-review -- --csv=artifacts/real-csv-calibration/private/<private-ibkr-file>.csv --broker=ibkr_activity_statement --account-timezone=America/Toronto --max-trades=25 --out=artifacts/real-csv-calibration/private/ibkr-april-first-25-calibration.md --no-history`
- `npx tsc --noEmit --pretty false`
- `npm run calibrate:decision-review -- --generated-at=2026-05-05T12:00:00.000Z --no-history`
- `npm run build`

Result:

- Focused importer/dry-run tests passed with 2 files / 36 tests.
- Synthetic decision-review calibration passed with 10 scenarios, 0 review, and
  0 fail.
- Production build passed.

### First-25 IBKR Decision Review Summary Added

What changed:

- Generated private first-25 JSON calibration report:
  `artifacts/real-csv-calibration/private/ibkr-april-first-25-calibration.json`.
- Added `src/scripts/summarize-decision-review-calibration.ts` to turn verbose
  decision-review calibration JSON into a compact private markdown dashboard.
- Generated private summary report:
  `artifacts/real-csv-calibration/private/ibkr-april-first-25-summary.md`.
- The summary reports:
  - headline counts
  - fix-first behavior counts
  - insight-id counts
  - market-context source counts
  - missing `trade_window_excursion_measured` rows
  - weak/no daily/4h level evidence rows
  - extreme excursion metrics
  - diagnostics/open skipped trades
- Tightened market-aware fallback headline copy so market-context-only reviews
  no longer show raw lowercase insight titles like
  `entry was not close to support`. They now render as a polished coaching
  sentence: `Entry was not close to daily/4h support.`

Private summary result:

- completed reviews: 25
- market context: `levels_system_daily_4h=25`
- fallback/generic headlines: 0 after the copy fix
- missing trade-window excursion insight: 3 private-symbol reviews before the
  trade-window price-alignment guard below
- weak/no level evidence rows: 14
- extreme excursion rows are concentrated in `private basis symbol D` and `private calibration symbol J`; inspect before
  increasing the calibration cap

Verification:

- `npx vitest run src/lib/trader-analytics/__tests__/csv-dry-run-decision-review-quality-dashboard.test.ts src/lib/trader-analytics/__tests__/csv-dry-run-decision-review-bridge.test.ts src/lib/execution-sources/csv/__tests__/broker-execution-csv-import.test.ts src/lib/trader-analytics/__tests__/trader-csv-dry-run-import-ui.test.ts --reporter=dot`
- `npx tsc --noEmit --pretty false`
- `npm run calibrate:decision-review -- --generated-at=2026-05-05T12:00:00.000Z --no-history`
- `npm run build`

Result:

- Focused tests passed with 4 files / 52 tests.
- Synthetic decision-review calibration passed with 10 scenarios, 0 review, and
  0 fail.
- Production build passed.

### Trade-Window Price Alignment Guard Added

What changed:

- Added execution-price fallback in
  `src/lib/raw-trade-timeline/derived/build-trade-derived-signals.ts` so
  completed trades still get bounded MFE/MAE facts when usable trade-window
  candles are unavailable.
- Added a price-alignment guard in
  `src/lib/raw-trade-timeline/builders/create-raw-trade-timeline-with-levels-system-candles.ts`.
  If levels-system trade-window candles are disconnected from execution prices
  by more than 60%, this app ignores those low-timeframe candles/facts for
  local trade-window excursion and falls back to execution-only movement.
- This keeps daily/4h support/resistance ownership in levels-system while
  preventing stub or mismatched 1m/5m candle windows from creating absurd
  private basis symbol D/private calibration symbol J-style excursion metrics.
- Added raw-timeline test coverage for execution-only derived MFE/MAE and
  disconnected levels-system candle windows.

Updated private first-25 summary:

- completed reviews: 25
- market context: `levels_system_daily_4h=25`
- fallback/generic headlines: 0
- missing trade-window excursion insight: 0
- extreme excursion metrics: 0
- weak/no daily/4h level evidence rows: 14

Verification:

- `npx vitest run src/lib/raw-trade-timeline/__tests__/build-trade-derived-signals.test.ts src/lib/raw-trade-timeline/__tests__/levels-system-trade-candle-context.integration.test.ts src/lib/trader-analytics/__tests__/csv-dry-run-decision-review-bridge.test.ts --reporter=dot`
- private first-25 JSON calibration regenerated with `--max-trades=25 --json`
- `npx tsx src/scripts/summarize-decision-review-calibration.ts --json=artifacts/real-csv-calibration/private/ibkr-april-first-25-calibration.json --out=artifacts/real-csv-calibration/private/ibkr-april-first-25-summary.md`

Result:

- Focused tests passed with 3 files / 21 tests.
- First-25 private calibration completed 25 reviews and no longer reports
  missing trade-window excursion facts or extreme excursion rows.

### First-100 IBKR Decision Review Calibration

What changed:

- Decision-review snapshots now include `tradeWindowEvidenceSource` and
  `candleQualityNotes` so the app and calibration reports clearly distinguish
  aligned levels-system candle-window evidence from execution-only fallback.
- `/import-dry-run` displays the movement evidence source and any candle-quality
  notes on attached decision-review cards.
- The compact calibration summary now reports trade-window evidence counts,
  weak-level counts by symbol, and execution-only fallback counts by symbol,
  while capping long detail lists.
- Regenerated private first-100 calibration reports:
  - `artifacts/real-csv-calibration/private/ibkr-april-first-100-calibration.json`
  - `artifacts/real-csv-calibration/private/ibkr-april-first-100-summary.md`

Private first-100 result:

- requested trades: 208
- analyzable trades: 100
- completed reviews: 100
- market context: `levels_system_daily_4h=100`
- `trade_window_excursion_measured`: 100/100
- trade-window evidence source:
  - `levels_system_trade_window`: 34
  - `execution_only_fallback`: 66
- candle-quality note rows: 67
- weak/no daily/4h level evidence rows: 81
- fallback/generic headlines: 0
- extreme excursion metrics: 0
- open grouped trades still skipped from completed-review calibration:
  - private symbol A: one short sell execution left open
  - private symbol B: one 2-share buy execution left open

Interpretation:

- The review pipeline is producing stable completed-trade feedback for the
  capped private CSV.
- The remaining major calibration issue is provider/context quality, not CSV
  parsing: the current stub/incomplete trade-window data causes many
  execution-only fallbacks and many missing useful daily/4h level relations.
- Do not treat the 81 weak-level rows as final product behavior until real
  levels-system candle/provider backfill is connected.

Verification:

- `npx vitest run src/lib/trader-analytics/__tests__/csv-dry-run-decision-review-bridge.test.ts src/lib/trader-analytics/__tests__/csv-dry-run-decision-review-api-route.test.ts src/lib/trader-analytics/__tests__/trader-functional-product-readiness.test.ts --reporter=dot`
- private first-100 JSON calibration with `--max-trades=100 --json`
- `npx tsx src/scripts/summarize-decision-review-calibration.ts --json=artifacts/real-csv-calibration/private/ibkr-april-first-100-calibration.json --out=artifacts/real-csv-calibration/private/ibkr-april-first-100-summary.md`

### Fallback Honesty Safety Net Added

What changed:

- Added browser coverage proving `/import-dry-run` shows `movement:
  executions only` and the candle-quality warning when a server decision-review
  snapshot uses `execution_only_fallback`.
- Added product-panel coverage so `candleQualityNotes` and
  `tradeWindowEvidenceSource` flow into top decision-review finding evidence.
- Raised the deterministic decision-review bridge scenario timeout from 15s to
  30s because the repeated-adds levels-system scenario can exceed 15s in larger
  grouped Vitest runs.

Verification:

- `npx tsc --noEmit --pretty false`
- `npx vitest run src/lib/trader-analytics/__tests__/csv-dry-run-decision-review-boundary.test.ts src/lib/trader-analytics/__tests__/trader-functional-product-readiness.test.ts src/lib/trader-analytics/__tests__/csv-dry-run-decision-review-bridge.test.ts --reporter=dot`
- `npx playwright test tests/e2e/import-dry-run.spec.ts --project=chromium-desktop`
- `npm run build`

Result:

- Focused Vitest passed with 3 files / 28 tests.
- Import dry-run desktop Playwright passed with 7 tests.
- Production build passed.

Best next step:

- Switch to the sibling `levels-system` project to improve real historical
  provider/backfill coverage, then rerun the first-100 private calibration here
  and look for a lower `execution_only_fallback` count and fewer weak/no
  daily/4h level evidence rows.

### Market-Data Readiness Tooling Added

What changed:

- Added shared readiness counting utilities in
  `src/lib/trader-analytics/server/decision-review-calibration-readiness.ts`.
- Added `src/scripts/summarize-market-data-readiness.ts` for a compact
  provider/backfill-focused report from one decision-review calibration JSON.
- Added `src/scripts/compare-decision-review-calibrations.ts` for before/after
  comparisons after `levels-system` historical backfill changes.
- Added package scripts:
  - `npm run summarize:market-data-readiness`
  - `npm run compare:decision-review-calibrations`
- Added synthetic tests so the readiness/counting logic is covered without
  private CSV data.
- Generated current private readiness artifacts:
  - `artifacts/real-csv-calibration/private/ibkr-april-first-100-market-data-readiness.md`
  - `artifacts/real-csv-calibration/private/ibkr-april-first-100-self-comparison.md`

Current first-100 baseline:

- completed reviews: 100
- `execution_only_fallback`: 66
- `levels_system_trade_window`: 34
- weak/no daily/4h level evidence rows: 81
- candle-quality note rows: 67
- missing trade-window excursion insights: 0
- extreme excursion metrics: 0
- fallback/generic headlines: 0
- open skipped trades: 2

Verification:

- `npx vitest run src/lib/trader-analytics/__tests__/decision-review-calibration-readiness.test.ts --reporter=dot`
- `npm run summarize:market-data-readiness -- --json=artifacts/real-csv-calibration/private/ibkr-april-first-100-calibration.json --out=artifacts/real-csv-calibration/private/ibkr-april-first-100-market-data-readiness.md`
- `npm run compare:decision-review-calibrations -- --baseline=artifacts/real-csv-calibration/private/ibkr-april-first-100-calibration.json --candidate=artifacts/real-csv-calibration/private/ibkr-april-first-100-calibration.json --out=artifacts/real-csv-calibration/private/ibkr-april-first-100-self-comparison.md`

Next comparison after `levels-system` changes:

```bash
npm run calibrate:decision-review -- --csv=artifacts/real-csv-calibration/private/<private-ibkr-file>.csv --broker=ibkr_activity_statement --account-timezone=America/Toronto --max-trades=100 --generated-at=2026-05-05T12:00:00.000Z --json --out=artifacts/real-csv-calibration/private/ibkr-april-first-100-after-levels-system.json --no-history
npm run summarize:market-data-readiness -- --json=artifacts/real-csv-calibration/private/ibkr-april-first-100-after-levels-system.json --out=artifacts/real-csv-calibration/private/ibkr-april-first-100-after-levels-system-readiness.md
npm run compare:decision-review-calibrations -- --baseline=artifacts/real-csv-calibration/private/ibkr-april-first-100-calibration.json --candidate=artifacts/real-csv-calibration/private/ibkr-april-first-100-after-levels-system.json --out=artifacts/real-csv-calibration/private/ibkr-april-first-100-before-after-comparison.md
```

### 2026-05-05 Levels-System 77 Rerun Completed

What changed:

- Inspected the sibling `levels-system` `77` handoff and confirmed the source
  implementation added historical as-of diagnostics and higher-timeframe
  cutoff support.
- Important build finding: `levels-system` exports `dist/`, and the new source
  changes were not present in `dist/` until the provider package was rebuilt.
- Ran `npm run build` in `levels-system`.
- Ran `npm install` in this repo so the local file dependency refreshed to the
  rebuilt provider package.
- Confirmed this repo's installed `node_modules/levels-system-phase1/dist`
  includes:
  - `historical_as_of_snapshot_built`
  - `historical_higher_timeframe_closed_candle_cutoff`
  - `historical_price_anchor_used`
  - `possible_price_adjustment_mismatch`
  - `asOfTimestampByTimeframe`

First-100 private rerun artifacts:

- `artifacts/real-csv-calibration/private/ibkr-april-first-100-after-levels-system.json`
- `artifacts/real-csv-calibration/private/ibkr-april-first-100-after-levels-system-summary.md`
- `artifacts/real-csv-calibration/private/ibkr-april-first-100-after-levels-system-readiness.md`
- `artifacts/real-csv-calibration/private/ibkr-april-first-100-before-after-comparison.md`

Before / after result:

- completed reviews: `100 -> 100`
- `execution_only_fallback`: `66 -> 67`
- `levels_system_trade_window`: `34 -> 33`
- weak/no daily/4h level evidence rows: `81 -> 81`
- candle-quality note rows: `67 -> 68`
- missing trade-window excursion insights: `0 -> 0`
- extreme excursion metrics: `0 -> 0`
- fallback/generic headlines: `0 -> 0`
- open skipped trades: `2 -> 2`

Interpretation:

- The provider-side historical as-of/cutoff build is now definitely being
  consumed by this repo.
- The first-100 calibration did not improve market-data readiness. The issue is
  likely not just source/build propagation.
- The slight fallback regression appears tied to additional candle-quality
  warnings, especially price-disconnect handling and missing pre/post windows.
- Next best step is to inspect the new after-run diagnostics/candle-quality
  notes by symbol, especially whether the new
  `possible_price_adjustment_mismatch` diagnostic is present for fallback-heavy
  symbols. That points back to adjusted/unadjusted candle basis, historical
  symbol mapping, extended-hours coverage, or provider/cache availability in
  `levels-system`, not trader coaching logic in this repo.

### 2026-05-05 Levels-System Price-Disconnect Diagnostic Pass

What changed:

- Edited the sibling `levels-system` project with a diagnostic-only provider
  improvement.
- `levels-system` now emits `possible_price_adjustment_mismatch` when the
  largest execution-to-nearest trade-window candle OHLC distance exceeds `60%`,
  matching this app's existing trade-window rejection guard.
- The provider diagnostic now includes the measured execution/candle distance,
  ratio, execution timestamp, nearest candle timestamp, and nearest candle
  OHLC.
- This does not alter candle fetching, warehouse storage, support/resistance
  ranking, or watchlist behavior in `levels-system`.
- This app's decision-review bridge now preserves those detailed
  split/adjustment/symbol-mapping warnings in `candleQualityNotes`.
- Deterministic fixture expectations were updated for the current rebuilt
  provider's support-strength output.

Provider verification:

- In `levels-system`: `npx tsx --test src\tests\support-resistance-shared-api.test.ts`
  passed with `23/23`.
- In `levels-system`: `npx tsc --noEmit --pretty false` passed.
- In `levels-system`: `npm run build` passed.
- In this repo: `npm install` refreshed the rebuilt local file dependency.
- In this repo:
  `npx vitest run src/lib/trader-analytics/__tests__/csv-dry-run-decision-review-bridge.test.ts --reporter=dot`
  passed with `14/14`.

Diagnostic rerun artifacts:

- `artifacts/real-csv-calibration/private/ibkr-april-first-100-after-levels-system-diagnostic.json`
- `artifacts/real-csv-calibration/private/ibkr-april-first-100-after-levels-system-diagnostic-readiness.md`
- `artifacts/real-csv-calibration/private/ibkr-april-first-100-before-after-diagnostic-comparison.md`

Diagnostic result:

- first-100 readiness metrics remained effectively unchanged:
  - `execution_only_fallback`: `66 -> 67`
  - `levels_system_trade_window`: `34 -> 33`
  - weak/no daily/4h level evidence rows: `81 -> 81`
  - missing trade-window excursion insights: `0 -> 0`
  - extreme excursion metrics: `0 -> 0`
  - fallback/generic headlines: `0 -> 0`
- the new detailed notes found `62` price-disconnect rows:
  - `41` had ratio `>= 3x`
  - `21` had ratio `< 3x` but still exceeded the `60%` execution/candle
    distance guard
- largest examples:
  - `private basis symbol B`: about `27x-36x`
  - `private basis symbol A`: about `23x`
  - `private basis symbol I`: about `16x-18x`
  - multiple `private basis symbol D`, `private basis symbol E`, `private basis symbol F`, and `private basis symbol C` rows above `5x`

Current interpretation:

- The main blocker is now clearer: many historical trade-window candles are on
  a different price basis than broker executions, or are stale/wrong-symbol
  cache/provider rows.
- Do not tune trader coaching against these rows.
- Next best step is provider-side cache/provenance investigation in
  `levels-system` for fallback-heavy symbols (`private basis symbol G`, `private basis symbol H`, `private basis symbol B`, `private basis symbol I`,
  `private basis symbol D`, `private basis symbol E`, `private basis symbol F`, `private basis symbol C`, etc.), checking adjusted-vs-raw basis,
  stale warehouse rows, historical symbol mapping, and extended-hours coverage.

### 2026-05-05 Implicit Stub Provider Guard Added

Important correction:

- A quick `levels-system` storage check showed an `private basis symbol B` April 16 diagnostic
  referenced intraday candles even though the `ibkr` warehouse had no `1m` or
  `5m` file for `private basis symbol B` on that date.
- `levels-system` provider creation can fall through to its deterministic
  `stub` provider when no IBKR client is supplied.
- That means the earlier private first-100 baseline was accidentally allowing
  deterministic stub candles and stub daily/4h levels to drive some trader
  review output.

What changed in this repo:

- `createRawTradeTimelineWithLevelsSystemCandles(...)` now rejects implicit
  default `stub` provider output for production-style analysis.
- Explicit test/custom fetch services may still use stub providers so
  deterministic fixtures remain valid.
- When implicit stub is detected:
  - trade-window candles are ignored
  - levels-system trade-window facts are not attached
  - support/resistance levels are not mapped into trader-facing context
  - execution-level relations and `levelsSystemMarketFacts` are not attached
  - `hadInsufficientCandleDataForStructure` is set
  - a warning explains that a real historical provider must be configured
- The dry-run decision-review bridge now preserves that warning in
  `candleQualityNotes`.

Verification:

- `npx vitest run src/lib/raw-trade-timeline/__tests__/levels-system-trade-candle-context.integration.test.ts src/lib/trader-analytics/__tests__/csv-dry-run-decision-review-bridge.test.ts --reporter=dot`
  passed with `2` files / `19` tests.
- `npx tsc --noEmit --pretty false` passed.

Corrected first-100 private artifact:

- `artifacts/real-csv-calibration/private/ibkr-april-first-100-after-stub-guard.json`
- `artifacts/real-csv-calibration/private/ibkr-april-first-100-after-stub-guard-readiness.md`
- `artifacts/real-csv-calibration/private/ibkr-april-first-100-before-after-stub-guard-comparison.md`

Corrected first-100 read:

- completed reviews: `100`
- market context source: `none=100`
- trade-window evidence: `execution_only_fallback=100`
- stub-warning rows: `100`
- detailed price mismatch rows: `62`
- missing trade-window excursion insights: `0`
- extreme excursion metrics: `0`
- fallback/generic headlines: `0`

Interpretation:

- This is a worse-looking but more truthful baseline.
- Until a real historical provider is configured and available to
  `levels-system`, this repo should not claim candle-backed trade-window or
  daily/4h support/resistance evidence for real imported broker trades.
- Next best step is to configure/pass a real provider path from the calibration
  environment into `levels-system` or run a provider-backed backfill, then rerun
  the first-100 calibration. Only after that should coaching wording be tuned.

### 2026-05-05 IBKR Warehouse Guard Rerun

What changed:

- Read the latest sibling `levels-system` doc `77`, which now says the provider
  default path was changed to IBKR plus warehouse replay:
  - default provider: `ibkr`
  - default warehouse mode: `replay`
  - no silent deterministic stub fallback for default real trade-analysis
    requests
- Ran `npm install` in this repo to refresh the rebuilt
  `levels-system-phase1` file dependency.
- Confirmed installed `dist` contains the default `ibkr` / `replay` guard.

Rerun command:

- Private decision-review calibration was rerun against a local private IBKR
  CSV. The exact private CSV path and private artifact paths are intentionally
  omitted from this public project log.

Result:

- command exited non-zero because no completed decision reviews were produced,
  but it wrote the JSON artifact
- requested trades: `208`
- analyzable cap: `100`
- completed reviews: `0`
- analysis failures: `100`
- open skipped trades: `2`
- all analysis failures were explicit IBKR durable warehouse misses for `5m`
  ranges
- no deterministic stub market data was accepted

Artifacts:

- Private JSON/readiness/comparison artifacts were written under the local
  private calibration artifact area and are intentionally not named here.

Top missing IBKR `5m` warehouse needs from the first-100 cap:

- The private top-symbol list is intentionally omitted from this public project
  log. The aggregate result was `100` failed ranges and `12030` expected `5m`
  candles.

Total first-100 missing `5m` estimate:

- `100` failed ranges
- `12030` expected `5m` candles

Interpretation:

- The latest `levels-system` guard is working: it refuses to synthesize stub
  candles for real imported-trade review.
- The immediate blocker is now concrete IBKR warehouse coverage. The first-100
  private calibration cannot complete decision reviews until the relevant IBKR
  `5m` ranges, and likely daily/4h context, are backfilled or otherwise made
  available.
- Next best step belongs in `levels-system`: backfill/check IBKR warehouse
  coverage for the listed symbols/date windows, then rerun this calibration.

### 2026-05-05 IBKR Warehouse Backfill Pass

What changed:

- Added `src/scripts/build-ibkr-warehouse-backfill-manifest.ts` and
  `npm run build:ibkr-backfill-manifest` to turn the first-100 calibration
  failures into a provider-ready IBKR warehouse manifest and levels-system
  priority report.
- Wired `LEVELS_SYSTEM_WAREHOUSE_DIRECTORY` and
  `LEVELS_SYSTEM_WAREHOUSE_MODE` through the trader consumer so real replay can
  use the levels-system-owned warehouse instead of a local empty `data/candles`
  directory.
- Added a review guard so implausible post-exit continuation metrics from
  price-disconnected candles stay diagnostic-only and do not become coaching.

Provider/backfill result:

- IBKR `5m` execute in `levels-system`: `47` planned ranges, `46` fetched,
  `1` failed (`private alias symbol M` security definition), `6783` candles stored.
- IBKR daily/4h execute in `levels-system`: `63` planned tasks, `61` fetched,
  `2` failed (`private alias symbol M` daily and 4h security definition), `71629` candles stored.
- `levels-system` was rebuilt and reinstalled into this repo after replay
  partial-hit and range-preservation changes.

Final first-100 rerun:

- requested trades: `208`
- analyzable cap: `100`
- completed reviews: `98`
- diagnostics: `5`
- open skipped trades: `2`
- remaining analysis failures: `2`, both `private alias symbol M` durable warehouse misses
- market context source: `levels_system_daily_4h=98`
- trade-window evidence: `levels_system_trade_window=78`,
  `execution_only_fallback=20`
- weak/no daily/4h evidence rows: `14`
- missing trade-window excursion insights: `0`
- extreme excursion metrics: `0`
- fallback/generic headlines: `0`

Final artifacts:

- `artifacts/real-csv-calibration/private/ibkr-april-first-100-ibkr-warehouse-backfill-manifest.json`
- `artifacts/real-csv-calibration/private/ibkr-april-first-100-after-ibkr-warehouse-backfill-final.json`
- `artifacts/real-csv-calibration/private/ibkr-april-first-100-after-ibkr-warehouse-backfill-final-readiness.md`

Verification:

- `npx vitest run src/lib/trader-analytics/__tests__/csv-dry-run-decision-review-bridge.test.ts src/lib/raw-trade-timeline/__tests__/levels-system-trade-candle-context.integration.test.ts --reporter=dot` passed: `19/19`.
- `npx tsc --noEmit --pretty false` passed.

Next best step:

- Fix the levels-system backfill runner so priority reports preserve
  per-timeframe ranges instead of merging by symbol/session before timeframe.
- Investigate or map `private alias symbol M` for IBKR, since that is now the only blocker for
  `100/100` completed reviews in this capped run.

### 2026-05-05 private alias symbol M Contract Alias And Final First-100 Rerun

What changed:

- Fixed the `levels-system` priority backfill runner so selected priority tasks
  run per timeframe and preserve timeframe-specific ranges. This prevents daily
  lookbacks from widening unrelated `4h` work.
- Added a validated IBKR historical contract alias for `private alias symbol M` to the current
  `private alias symbol M2` contract, while still storing/replaying candles under requested
  symbol `private alias symbol M` for the imported trade record.
- Important contract note: the imported trade used historical symbol `private alias symbol M`,
  but IBKR no longer qualified that symbol directly. `reqMatchingSymbols`
  resolved the security as `private alias symbol M2` with primary exchange `PINK`
  (`conId=733975592`), so historical fetches use that resolved contract and
  preserve `private alias symbol M` as the requested/storage symbol for replay consistency.
- Backfilled the remaining `private alias symbol M` `5m`, daily, and `4h` warehouse gaps after the
  alias was in place, then rebuilt and reinstalled `levels-system`.

Final capped first-100 rerun:

- requested trades: `208`
- analyzable cap: `100`
- completed reviews: `100`
- diagnostics: `3`
- open skipped trades: `2`
- analysis failures: `0`
- market context source: `levels_system_daily_4h=100`
- trade-window evidence: `levels_system_trade_window=80`,
  `execution_only_fallback=20`
- weak/no daily/4h evidence rows: `14`
- missing trade-window excursion insights: `0`
- extreme excursion metrics: `0`
- fallback/generic headlines: `0`

Final artifacts:

- `artifacts/real-csv-calibration/private/ibkr-april-first-100-after-maxn-contract-fix.json`
- `artifacts/real-csv-calibration/private/ibkr-april-first-100-after-maxn-contract-fix-readiness.md`

Verification:

- `npx vitest run src/lib/trader-analytics/__tests__/csv-dry-run-decision-review-bridge.test.ts src/lib/raw-trade-timeline/__tests__/levels-system-trade-candle-context.integration.test.ts --reporter=dot` passed: `19/19`.
- `npx tsc --noEmit --pretty false` passed.
- In `levels-system`, `npx tsx --test src\tests\ibkr-historical-candle-provider.test.ts src\tests\candle-warehouse-backfill-report.test.ts` passed: `11/11`.
- In `levels-system`, `npx tsc --noEmit --pretty false` and `npm run build` passed.

Next best step:

- Use the readiness summary's execution-only fallback list as the next focused
  branch. The completion blocker is gone; the remaining value is improving
  trade-window evidence coverage for the `20` execution-only fallback reviews
  and reducing the `14` weak/no daily/4h evidence rows without reintroducing any
  stub-derived market evidence.

### 2026-05-05 1m Fallback Backfill Pass

What changed:

- Built a narrow `1m` priority report for the `20` execution-only fallback
  reviews from the capped first-100 rerun.
- Ran a `levels-system` dry-run first; it collapsed the `20` review rows into
  `17` symbol/session `1m` tasks with about `8,690` missing one-minute slots.
- Executed the `1m` IBKR warehouse backfill in `levels-system`: `17` planned,
  `17` fetched, `0` failed.
- Reran the capped first-100 calibration against warehouse replay.

Result after `1m` backfill:

- requested trades: `208`
- analyzable cap: `100`
- completed reviews: `100`
- diagnostics: `3`
- open skipped trades: `2`
- analysis failures: `0`
- market context source: `levels_system_daily_4h=100`
- trade-window evidence: `levels_system_trade_window=90`,
  `execution_only_fallback=10`
- candle-quality note rows: `57`
- weak/no daily/4h evidence rows: `14`
- missing trade-window excursion insights: `0`
- extreme excursion metrics: `0`
- fallback/generic headlines: `0`

Leftover fallback classification:

- Price-basis/symbol-adjustment disconnects: `private basis symbol A`, `private basis symbol B` x2, `private basis symbol C` x2.
  These have 1m candles, but execution prices are still disconnected by more
  than the 60% guard, so candles are intentionally ignored.
- No candle inside actual hold after 1m replay: `private basis symbol G` x2, `private calibration symbol K` x2, `private calibration symbol L` x1.
  These have nearby pre/post evidence but zero trade candles in the hold window,
  so they remain execution-only for in-trade excursion.

Artifacts:

- `levels-system/artifacts/trader-intelligence/ibkr-april-first-100-execution-fallback-1m-priority-report.json`
- `levels-system/artifacts/trader-intelligence/ibkr-april-first-100-execution-fallback-1m-dry-run/candle-warehouse-backfill.md`
- `levels-system/artifacts/trader-intelligence/ibkr-april-first-100-execution-fallback-1m-execute/candle-warehouse-backfill.md`
- `artifacts/real-csv-calibration/private/ibkr-april-first-100-after-1m-fallback-backfill.json`
- `artifacts/real-csv-calibration/private/ibkr-april-first-100-after-1m-fallback-backfill-readiness.md`

Verification:

- `npx vitest run src/lib/trader-analytics/__tests__/csv-dry-run-decision-review-bridge.test.ts src/lib/raw-trade-timeline/__tests__/levels-system-trade-candle-context.integration.test.ts --reporter=dot` passed: `19/19`.

Next best step:

- Split the remaining `10` fallbacks into two separate fixes:
  1. Provider/corporate-action handling for `private basis symbol A`, `private basis symbol B`, and `private basis symbol C`
     adjusted-vs-execution price basis.
  2. A trade-window boundary/nearest-minute review for ultra-short `private basis symbol G`,
     `private calibration symbol K`, and `private calibration symbol L` holds where 1m candles exist around the trade but none
     are counted inside the exact hold interval.

### 2026-05-05 Alias/PINK Diagnostics Consumer Filter

Shared `levels-system` doc `77` added a new provider-side section:
`Delisted/PINK Alias Fail-Safe`.

Provider update consumed:

- `levels-system` now emits and replays explicit diagnostics for validated
  historical IBKR symbol aliases:
  - `historical_symbol_alias_used`
  - `historical_symbol_resolved_to_pink`
- For `private alias symbol M`, the resolved historical path is still `private alias symbol M2`
  (`conId=733975592`) with primary exchange `PINK`.

Consumer-side follow-up:

- Updated the dry-run decision-review bridge so `validated IBKR alias`,
  `resolved through`, and `OTC/PINK data path` diagnostics are preserved in
  `candleQualityNotes`.
- Added a focused bridge test that simulates `private alias symbol M` using a validated alias to
  `private alias symbol M2` on `PINK`.
- Reran the capped first-100 calibration with the new filter.

Result:

- first-100 readiness metrics stayed stable:
  - completed reviews: `100`
  - market context source: `levels_system_daily_4h=100`
  - trade-window evidence: `levels_system_trade_window=90`,
    `execution_only_fallback=10`
- both `private alias symbol M` reviews now include the alias/PINK notes in their saved
  `candleQualityNotes`.

Artifacts:

- `artifacts/real-csv-calibration/private/ibkr-april-first-100-after-alias-diagnostics-filter.json`
- `artifacts/real-csv-calibration/private/ibkr-april-first-100-after-alias-diagnostics-filter-readiness.md`

Verification:

- `npx vitest run src/lib/trader-analytics/__tests__/csv-dry-run-decision-review-bridge.test.ts --reporter=dot` passed: `15/15`.
- `npx tsc --noEmit --pretty false` passed.

Next best step:

- Continue the remaining fallback split: corporate-action/price-basis handling
  for `private basis symbol A`, `private basis symbol B`, and `private basis symbol C`; boundary/nearest-minute handling for
  `private basis symbol G`, `private calibration symbol K`, and `private calibration symbol L`.

### 2026-05-05 Delisted Symbol Alias Policy And Overlap Window Fix

User policy for delisted/renamed symbols:

- Keep the simple validated alias table already added for `private alias symbol M -> private alias symbol M2`.
- Do not add a broad alias-discovery or ticker-research workflow.
- If IBKR quickly resolves a blocking high-value replay through the same
  provider workflow, add a small explicit validated alias.
- If IBKR cannot resolve it quickly, fail cleanly and let the app say market
  data is unavailable for the renamed or delisted symbol and the review uses
  executions/P&L only.
- Trader Intelligence should not need to know the new ticker and should not
  spend cycles hunting delisted symbols unless one blocks a high-value replay.

What changed:

- In `levels-system`, trade-window candle partitioning now counts candles that
  overlap the imported hold interval. This fixes ultra-short trades where a
  one-minute candle starts before the first fill but covers the hold.
- Added a `levels-system` regression test for a sub-minute hold whose candle
  timestamp is before `tradeStartTimestamp`.
- Rebuilt `levels-system` and refreshed the local file dependency here.
- Reran the capped first-100 calibration.

Result after overlap fix:

- completed reviews: `100`
- market context source: `levels_system_daily_4h=100`
- trade-window evidence: `levels_system_trade_window=92`,
  `execution_only_fallback=8`
- candle-quality note rows: `57`
- weak/no daily/4h evidence rows: `14`
- missing trade-window excursion insights: `0`
- extreme excursion metrics: `0`
- fallback/generic headlines: `0`

Remaining fallback classification:

- Price-basis/symbol-adjustment disconnects: `private basis symbol A`, `private basis symbol B` x2, `private basis symbol C` x2.
- Remaining short-hold warehouse gaps: `private basis symbol G` x2 and `private calibration symbol K` x1.

Queued but blocked:

- Built a new narrow `1m` priority report for the remaining short-hold gaps.
- Dry-run planned `2` safe-to-fetch ranges:
  - `private basis symbol G 1m`: `2026-04-08T14:38:00.000Z` to
    `2026-04-08T17:18:00.000Z`
  - `private calibration symbol K 1m`: `2026-04-09T13:01:00.000Z` to
    `2026-04-09T15:30:00.000Z`
- Execute attempt was blocked because IBKR/TWS was offline:
  `connect ECONNREFUSED 127.0.0.1:7497`.

Artifacts:

- `artifacts/real-csv-calibration/private/ibkr-april-first-100-after-overlap-window-fix.json`
- `artifacts/real-csv-calibration/private/ibkr-april-first-100-after-overlap-window-fix-readiness.md`
- `levels-system/artifacts/trader-intelligence/ibkr-april-first-100-remaining-short-hold-1m-priority-report.json`
- `levels-system/artifacts/trader-intelligence/ibkr-april-first-100-remaining-short-hold-1m-dry-run/candle-warehouse-backfill.md`

Verification:

- In `levels-system`, `npx tsx --test src\tests\support-resistance-shared-api.test.ts` passed: `26/26`.
- In `levels-system`, `npx tsc --noEmit --pretty false` passed.
- In `levels-system`, `npm run build` passed.
- In this repo, focused bridge/replay Vitest passed: `20/20`.
- In this repo, `npx tsc --noEmit --pretty false` passed.

Next best step:

- When IBKR/TWS is available again, execute the queued short-hold `1m` backfill
  report, rerun the capped first-100 calibration, and expect the remaining
  execution-only fallbacks to be primarily the price-basis disconnect symbols
  (`private basis symbol A`, `private basis symbol B`, `private basis symbol C`).

### 2026-05-05 Remaining Short-Hold IBKR Backfill Completed

IBKR/TWS came back online and the queued short-hold follow-up was completed.

What changed:

- Executed the `levels-system` priority backfill for the remaining non-price
  short-hold gaps.
- Backfill result: `2` planned ranges, `2` attempted, `2` fetched, `0` failed.
- Reran the capped first-100 private IBKR decision-review calibration.
- Generated the market-data readiness summary for the final artifact.

Final capped first-100 result after remaining short-hold backfill:

- requested trades: `208`
- analyzable cap: `100`
- completed reviews: `100`
- diagnostics: `3`
- open skipped trades: `2`
- market context source: `levels_system_daily_4h=100`
- trade-window evidence: `levels_system_trade_window=95`,
  `execution_only_fallback=5`
- candle-quality note rows: `54`
- weak/no daily/4h evidence rows: `14`
- missing trade-window excursion insights: `0`
- extreme excursion metrics: `0`
- fallback/generic headlines: `0`

Remaining fallback classification:

- The short-hold warehouse gaps are cleared.
- The only remaining execution-only fallbacks are price-basis/symbol-adjustment
  disconnects: `private basis symbol A` x1, `private basis symbol B` x2, and `private basis symbol C` x2.
- Each remaining row has nearby warehouse candles, but the candle prices are
  disconnected from broker execution prices by more than the `60%` guard, so
  the app correctly rejects those candles for trade-window movement evidence.

Artifacts:

- `levels-system/artifacts/trader-intelligence/ibkr-april-first-100-remaining-short-hold-1m-execute/candle-warehouse-backfill.md`
- `artifacts/real-csv-calibration/private/ibkr-april-first-100-after-remaining-short-hold-backfill.json`
- `artifacts/real-csv-calibration/private/ibkr-april-first-100-after-remaining-short-hold-backfill-readiness.md`

Verification:

- Focused bridge/replay Vitest passed: `20/20`.
- `npx tsc --noEmit --pretty false` passed.

Next best step:

- Continue only with the corporate-action/price-basis diagnostic branch for
  `private basis symbol A`, `private basis symbol B`, and `private basis symbol C`. Keep the delisted-symbol policy narrow: no broad
  alias discovery, no Trader Intelligence ticker guessing, and clean
  execution/P&L-only fallback when IBKR/warehouse data cannot be aligned.

### 2026-05-05 Price-Basis Diagnostic Sharpened

What changed:

- In `levels-system`, added a new trade-analysis diagnostic:
  `likely_price_basis_adjustment_multiple`.
- The diagnostic fires only when the execution/candle disconnect looks close to
  a whole-number price-basis adjustment multiple. Broad disconnected-candle
  cases still keep the existing `possible_price_adjustment_mismatch` warning.
- In this repo, the dry-run decision-review bridge now preserves price-basis and
  adjustment-multiple notes in `candleQualityNotes`.
- Rebuilt `levels-system`, refreshed the local file dependency with
  `npm install`, and reran the capped first-100 calibration against the
  levels-system warehouse replay.

Result:

- first-100 readiness metrics stayed stable:
  - completed reviews: `100`
  - market context source: `levels_system_daily_4h=100`
  - trade-window evidence: `levels_system_trade_window=95`,
    `execution_only_fallback=5`
  - candle-quality note rows: `54`
  - weak/no daily/4h evidence rows: `14`
  - missing trade-window excursion insights: `0`
  - extreme excursion metrics: `0`
  - fallback/generic headlines: `0`
- The remaining five fallback rows now carry explicit price-basis adjustment
  multiple notes:
  - `private basis symbol A`: near `38:1`
  - `private basis symbol B`: near `41:1` and `40:1`
  - `private basis symbol C`: near `8:1` on both rows

Provider/warehouse provenance note:

- `levels-system` requests IBKR historical candles with `WhatToShow.TRADES`.
- Warehouse rows currently carry `adjustmentMode: "raw"`.
- The remaining fallback ratios prove that the current warehouse label is not a
  sufficient safety guarantee for Trader Intelligence. The consumer should keep
  rejecting these candles until raw/adjusted basis alignment is proven.

Artifacts:

- `artifacts/real-csv-calibration/private/ibkr-april-first-100-after-price-basis-diagnostic.json`
- `artifacts/real-csv-calibration/private/ibkr-april-first-100-after-price-basis-diagnostic-readiness.md`

Verification:

- In `levels-system`, `npx tsx --test src\tests\support-resistance-shared-api.test.ts` passed: `26/26`.
- In `levels-system`, `npx tsc --noEmit --pretty false` passed.
- In `levels-system`, `npm run build` passed.
- In this repo, `npx vitest run src/lib/trader-analytics/__tests__/csv-dry-run-decision-review-bridge.test.ts --reporter=dot` passed: `15/15`.
- In this repo, `npx tsc --noEmit --pretty false` passed.

Everything still needed from `levels-system` to support this app:

- Keep the IBKR plus `data/candles` warehouse path as the real provider path;
  do not reintroduce silent stub fallback for imported-trade review.
- Keep daily/4h support/resistance as-of historical snapshots owned by
  `levels-system`, with no future daily/4h candle leakage.
- Keep `1m` preferred and `5m` explicit fallback for trade-window facts; return
  diagnostics when either timeframe is missing, partial, stale, or unavailable.
- Keep the warehouse/backfill path able to plan, deduplicate, fetch, store, and
  replay historical candles for imported trade windows.
- Preserve clear diagnostics for provider failures, warehouse misses, fallback
  timeframes, alias/PINK paths, and price-basis/corporate-action mismatches.
- Keep the validated alias policy narrow: currently `private alias symbol M -> private alias symbol M2`; no broad
  alias discovery and no consumer-side ticker guessing.
- For the remaining first-100 blockers, decide whether the warehouse should
  store/serve a raw-price basis compatible with broker executions for `private basis symbol A`,
  `private basis symbol B`, and `private basis symbol C`, or keep returning execution/P&L-only fallback with the
  new price-basis diagnostic.
- After that decision, increase calibration beyond the capped first 100 and
  repeat the same readiness checks across all eligible completed trades.

Next best step:

- Do not fetch more candles blindly. Investigate the `private basis symbol A`, `private basis symbol B`, and `private basis symbol C`
  raw-vs-adjusted basis path in `levels-system`, then either align warehouse
  candles to broker execution prices or deliberately keep these reviews as
  execution/P&L-only with the new diagnostic.

### 2026-05-05 Price-Basis Policy Diagnostic Added

Coordination note from the sibling `levels-system` session:

- Continue targeted price-basis policy work for `private basis symbol A`, `private basis symbol B`, and `private basis symbol C`.
- Do not bulk-fetch more candles.
- Treat remaining fallbacks as basis-mismatch cases unless raw IBKR candle basis
  can be proven aligned to broker execution prices.

What changed:

- `levels-system` added a first-class diagnostic code:
  `trade_window_price_basis_unverified`.
- The diagnostic fires only when price-disconnected execution/candle evidence
  also looks like a likely whole-number adjustment multiple.
- This app preserves the resulting policy note in `candleQualityNotes`.

Rerun result:

- completed reviews: `100`
- market context source: `levels_system_daily_4h=100`
- trade-window evidence: `levels_system_trade_window=95`,
  `execution_only_fallback=5`
- all five remaining fallbacks include the explicit price-basis policy note
  saying candles are unavailable unless raw IBKR candle basis is proven aligned
  to broker execution prices

Artifacts:

- `artifacts/real-csv-calibration/private/ibkr-april-first-100-after-price-basis-policy.json`
- `artifacts/real-csv-calibration/private/ibkr-april-first-100-after-price-basis-policy-readiness.md`

Verification:

- In `levels-system`, focused shared API tests passed: `26/26`.
- In `levels-system`, TypeScript and build passed.
- In this repo, bridge Vitest passed: `15/15`.
- In this repo, TypeScript passed.

Next best step:

- Do not spend more cycles backfilling these five. Either prove and implement a
  raw IBKR candle basis that matches broker executions for `private basis symbol A`, `private basis symbol B`, and
  `private basis symbol C`, or accept the five execution/P&L-only reviews and move to all-eligible
  calibration.

### 2026-05-05 All-Eligible Calibration Expanded

What changed:

- Accepted the capped first-100 price-basis rows as intentional execution/P&L-only
  unless raw IBKR candle basis is later proven aligned to broker execution
  prices.
- Expanded calibration to all eligible completed private IBKR trades.
- Added `src/scripts/build-ibkr-daily-4h-backfill-manifest.ts` to generate a
  targeted daily/4h priority report from calibration diagnostics where
  support/resistance context cannot be built.
- Built and executed a `5m` IBKR warehouse backfill for the all-eligible
  calibration failures.
- Built and executed a targeted daily/4h IBKR warehouse backfill for the rows
  unlocked by the `5m` pass.

Backfill results:

- All-eligible first run after accepting price-basis policy:
  - requested trades: `208`
  - analyzable trades: `206`
  - completed reviews: `117`
  - analysis failures: `89`, all missing `5m` warehouse coverage in the back
    half of the import.
- All-eligible `5m` backfill:
  - planned tasks: `39`
  - attempted: `39`
  - fetched: `39`
  - failed: `0`
- Rerun after `5m` backfill:
  - completed reviews: `154`
  - remaining analysis failures: `52`, all daily/4h support/resistance context
    misses.
- Daily/4h manifest:
  - failed trade rows: `52`
  - symbol/session groups: `27`
  - tasks: `54`
  - symbols: `25`
  - estimated candles: `18,900`
- Daily/4h IBKR backfill:
  - dry-run: `54` planned, `54` fetchable, `0` failed
  - execute: `54` planned, `54` fetched, `0` failed

Current all-eligible result:

- requested trades: `208`
- analyzable trades: `206`
- completed reviews: `204`
- diagnostics: `4`
- open skipped trades: `2`
- remaining analysis failures: `2`
- market context source: `levels_system_daily_4h=204`
- trade-window evidence: `levels_system_trade_window=196`,
  `execution_only_fallback=8`
- missing trade-window excursion insights: `0`
- extreme excursion metrics: `3`
- fallback/generic headlines: `0`

Remaining blockers:

- `private market-data symbol N` and `private market-data symbol O` still fail daily/4h context after IBKR fetch because the
  provider returned only tiny higher-timeframe history:
  - `private market-data symbol N`: `1` daily candle and `1` 4h candle stored
  - `private market-data symbol O`: `1` daily candle and `2` 4h candles stored
- Treat these as insufficient-history/provider-data cases, not ordinary
  warehouse gaps. Do not add alias discovery or broad symbol research unless one
  becomes a high-value blocking replay.

Artifacts:

- `artifacts/real-csv-calibration/private/ibkr-april-all-eligible-after-price-basis-policy.json`
- `artifacts/real-csv-calibration/private/ibkr-april-all-eligible-after-5m-backfill.json`
- `artifacts/real-csv-calibration/private/ibkr-april-all-eligible-after-5m-backfill-readiness.md`
- `artifacts/real-csv-calibration/private/ibkr-april-all-eligible-daily-4h-backfill-manifest.json`
- `artifacts/real-csv-calibration/private/ibkr-april-all-eligible-daily-4h-backfill-manifest.md`
- `artifacts/real-csv-calibration/private/ibkr-april-all-eligible-after-daily-4h-backfill.json`
- `artifacts/real-csv-calibration/private/ibkr-april-all-eligible-after-daily-4h-backfill-readiness.md`
- `levels-system/artifacts/trader-intelligence/ibkr-april-all-eligible-5m-execute/candle-warehouse-backfill.md`
- `levels-system/artifacts/trader-intelligence/ibkr-april-all-eligible-daily-4h-execute/candle-warehouse-backfill.md`

Verification:

- `npx tsc --noEmit --pretty false` passed in this repo after adding the
  daily/4h manifest script.

Next best step:

- Stop broad candle fetching. Review the remaining `private market-data symbol N` and `private market-data symbol O`
  insufficient-history diagnostics and make the consumer-facing failure copy
  truthful: market data unavailable/insufficient for daily/4h context, review
  can still use executions/P&L. Keep the existing price-basis policy for the
  eight execution-only fallback reviews.

### 2026-05-05 private market-data symbol N/private market-data symbol O Insufficient Market Context Diagnostics

What changed:

- Added `insufficient_market_context` to trade-analysis failure
  classification.
- The dry-run decision-review bridge now surfaces that failure as
  `market_context_unavailable` instead of generic `analysis_failed`.
- `levels-system` now appends higher-timeframe fetch diagnostics to the
  support/resistance context error when daily/4h context cannot be built.
- The daily/4h backfill manifest generator accepts both old `analysis_failed`
  and new `market_context_unavailable` diagnostics, so future targeted
  backfills still work.

private market-data symbol N/private market-data symbol O result:

- Reran all eligible completed trades after rebuilding/reinstalling
  `levels-system`.
- Completed reviews remain `204/206`.
- `private market-data symbol N` and `private market-data symbol O` now emit `market_context_unavailable`.
- The diagnostics explain the usable higher-timeframe problem:
  - `private market-data symbol N`: daily and 4h replay found `0` usable bars before the as-of cutoff,
    even though a same-session daily and 4h candle exist in storage.
  - `private market-data symbol O`: daily replay found `0` usable bars before the as-of cutoff; 4h had
    only `1` usable bar against a `180` bar lookback.
- Interpretation: this is insufficient provider/history coverage under the
  no-future-leakage daily/4h cutoff, not another broad backfill queue.

Artifacts:

- `artifacts/real-csv-calibration/private/ibkr-april-all-eligible-after-avex-elmt-diagnostics.json`
- `artifacts/real-csv-calibration/private/ibkr-april-all-eligible-after-avex-elmt-diagnostics-readiness.md`

Verification:

- Trader focused tests passed: `22/22`.
- `levels-system` shared API tests passed: `26/26`.
- `levels-system` TypeScript and build passed.
- Trader TypeScript passed.

Next best step:

- Do not chase broad aliases for `private market-data symbol N`/`private market-data symbol O`. The product should display a
  clean unavailable/insufficient daily/4h market-context message for those
  trades and continue with execution/P&L-only information where available.

### 2026-05-06 Market Context Unavailable UI And Basis Policy Design

What changed:

- `/api/import-dry-run/decision-review` now advertises
  `market_context_unavailable` in its route contract metadata.
- `/import-dry-run` maps `market_context_unavailable` diagnostics to
  trader-facing copy:
  - daily/4h market context was unavailable or insufficient
  - support/resistance conclusions are not shown for that trade
  - execution/P&L-only review may still be used
- The raw provider detail remains available behind a details disclosure.
- Added Playwright coverage for the private market-data symbol N-style diagnostic path.
- Added `src/docs/candle-warehouse-basis-policy-design-2026-05-06.md`.

Policy design summary:

- Candle basis is part of the shared warehouse data contract.
- A `raw` label is not sufficient unless the basis has been validated against
  broker executions.
- Trader Intelligence must not guess split/reverse-split adjustments.
- Historical candle batches should be immutable or versioned rather than
  silently rewritten after future corporate actions.
- Alias handling stays narrow and provider-side.
- Insufficient daily/4h history is separate from price-basis mismatch.

Verification:

- Focused API/bridge Vitest passed: `21/21`.
- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.
- `npx playwright test tests/e2e/import-dry-run.spec.ts --project=chromium-desktop`
  passed: `8/8`.

Next best step:

- Share the candle-basis policy design with the `levels-system` Codex before
  implementing warehouse metadata. The first implementation should be small:
  provider/warehouse provenance metadata plus basis-validation status, not a
  full corporate-action engine.

### 2026-05-06 Consumed Levels-System Basis Metadata Hook

What changed:

- Refreshed the local `levels-system-phase1` file dependency after the
  provider/warehouse-side metadata hook landed in `levels-system`.
- The dry-run decision-review bridge now preserves the new
  `Trade-window candle basis status: ...` diagnostic in `candleQualityNotes`.
- Added bridge coverage for `basis_aligned` and
  `basis_adjustment_multiple_likely` notes.

All-eligible replay result:

- requested trades: `208`
- analyzable completed trades: `206`
- completed reviews: `204`
- open skipped trades: `2`
- `market_context_unavailable`: `private market-data symbol N`, `private market-data symbol O`
- market context: `levels_system_daily_4h=204`
- trade-window evidence: `levels_system_trade_window=196`,
  `execution_only_fallback=8`
- basis status notes among completed reviews:
  - `basis_aligned=199`
  - `basis_adjustment_multiple_likely=5`

Interpretation:

- The five reverse-split-style rows are now explicitly marked by
  `levels-system` as `basis_adjustment_multiple_likely`:
  - `private basis symbol A`: near `38:1`
  - `private basis symbol B`: near `41:1` and `40:1`
  - `private basis symbol C`: near `8:1` and `8:1`
- Keep those as execution/P&L-only movement reviews unless raw IBKR candle basis
  can be proven aligned to broker execution prices.
- `PBM` and `XTLB` execution-only fallbacks now show `basis_aligned`; their
  remaining limitation is unavailable post-trade candles, not price-basis
  mismatch.
- `private market-data symbol N` and `private market-data symbol O` remain insufficient daily/4h history cases under the
  no-future-leakage cutoff.

Artifacts:

- `artifacts/real-csv-calibration/private/ibkr-april-all-eligible-after-basis-metadata-hook.json`
- `artifacts/real-csv-calibration/private/ibkr-april-all-eligible-after-basis-metadata-hook-readiness.md`

Verification:

- `npx vitest run src/lib/trader-analytics/__tests__/csv-dry-run-decision-review-bridge.test.ts --reporter=dot`
  passed: `16/16`.

Next best step:

- Run full TypeScript/build verification after this doc update, then decide
  whether the product UI should visually distinguish `basis_aligned` info notes
  from warning notes so every completed review does not look equally risky.

### 2026-05-06 Candle Basis Note UI Polish

What changed:

- `/import-dry-run` now separates decision-review candle quality notes by
  urgency:
  - `basis_aligned` renders as quiet verified-basis detail.
  - `basis_adjustment_multiple_likely` renders as a visible movement-review
    warning.
  - unavailable pre/post-trade candles, ignored trade-window candles, and 5m
    fallback notes remain visible warnings.
- Adjustment-multiple copy now says movement review stays execution/P&L-only
  because candle prices likely use a different split-adjusted basis than broker
  executions.
- Added Playwright coverage for aligned-basis quiet detail and
  adjustment-multiple warning presentation.

Verification:

- `npx tsc --noEmit --pretty false` passed.
- `npx vitest run src/lib/trader-analytics/__tests__/csv-dry-run-decision-review-bridge.test.ts --reporter=dot`
  passed: `16/16`.
- `npm run build` passed.
- `npx playwright test tests/e2e/import-dry-run.spec.ts --project=chromium-desktop`
  passed: `10/10`.

Next best step:

- Investigate `PBM` and `XTLB` post-trade candle availability. They are now
  basis-aligned, so the remaining execution-only fallback reason is candle
  window completeness rather than reverse-split/price-basis mismatch.

### 2026-05-06 PBM/XTLB Window Fixes

What changed:

- Investigated the three basis-aligned execution-only fallback rows:
  - `PBM` trade 121
  - `XTLB` trades 204 and 205
- Found that `XTLB` had usable 5m warehouse candles after both exits, but a
  tiny stale 1m replay file blocked the 5m fallback path.
- Patched `levels-system` so a partial 1m trade-window response whose newest
  candle is more than 15 minutes before the requested window end falls back to
  5m.
- Added a `levels-system` regression test for stale partial 1m replay fallback.
- Found that `PBM` was a real 5m coverage tail gap on 2026-04-17: the stored 5m
  file ended before the final-exit/post-window segment.
- Performed one targeted IBKR 5m backfill for `PBM` ending at the PBM post-window
  cutoff. IBKR returned `91` 5m candles ending at `2026-04-17T15:30:00.000Z`.

All-eligible replay result:

- requested trades: `208`
- analyzable completed trades: `206`
- completed reviews: `204`
- open skipped trades: `2`
- `market_context_unavailable`: `private market-data symbol N`, `private market-data symbol O`
- market context: `levels_system_daily_4h=204`
- trade-window evidence: `levels_system_trade_window=199`,
  `execution_only_fallback=5`
- execution-only fallback symbols:
  - `private basis symbol A=1`
  - `private basis symbol B=2`
  - `private basis symbol C=2`

Interpretation:

- `PBM` and `XTLB` are resolved as candle-window coverage/replay issues.
- The only remaining execution-only fallbacks are intentional price-basis /
  likely adjustment-multiple cases.

Artifacts:

- `artifacts/real-csv-calibration/private/ibkr-april-all-eligible-after-pbm-xtlb-window-fixes.json`
- `artifacts/real-csv-calibration/private/ibkr-april-all-eligible-after-pbm-xtlb-window-fixes-readiness.md`

Verification so far:

- `levels-system`: `npx tsx --test src\tests\support-resistance-shared-api.test.ts`
  passed: `27/27`.
- `levels-system`: TypeScript passed.
- `levels-system`: `npm run build` passed.

Next best step:

- Run final Trader verification after this doc update. Then the remaining data
  branch is not more backfill; it is policy/product handling for the five
  price-basis rows and the two insufficient daily/4h symbols.

### 2026-05-06 Handoff Sync And Readiness Warning Split

What changed:

- Updated the levels-system handoff
  `docs/77_TRADER_INTELLIGENCE_HISTORICAL_BACKFILL_AND_ASOF_PLAN_2026-05-05.md`
  with the PBM/XTLB fixes, final all-eligible replay state, and the boundary to
  avoid more bulk candle fetching on this branch.
- Split calibration readiness candle notes into:
  - actionable candle-quality warnings;
  - quiet candle-basis/provenance info.
- Kept the existing all-note count for audit continuity, but made warning-vs-info
  counts and by-symbol breakdowns available to readiness/comparison summaries.
- Regenerated the latest PBM/XTLB readiness artifact and added a companion
  decision-review summary artifact with the same warning-vs-info split.

Current replay interpretation:

- The five execution-only fallback rows remain `private basis symbol A`, `private basis symbol B`, and `private basis symbol C`, and
  should stay execution/P&L-only unless raw IBKR candle basis is proven aligned.
- `private market-data symbol N` and `private market-data symbol O` remain clean `market_context_unavailable` diagnostics.
- Quiet `basis_aligned` provider/provenance rows are no longer treated as the
  same type of readiness concern as actionable candle warnings.

Artifacts:

- `artifacts/real-csv-calibration/private/ibkr-april-all-eligible-after-pbm-xtlb-window-fixes-readiness.md`
- `artifacts/real-csv-calibration/private/ibkr-april-all-eligible-after-pbm-xtlb-window-fixes-summary.md`

Verification so far:

- `npx vitest run src/lib/trader-analytics/__tests__/decision-review-calibration-readiness.test.ts --reporter=dot`
  passed: `2/2`.
- `npx tsc --noEmit --pretty false` passed.

Next best step:

- Run build verification. Then the remaining branch is wording/product polish for
  actionable candle warnings, especially 5m fallback/stale partial 1m wording,
  not additional provider backfill.

### 2026-05-06 Market-Data Policy Product Polish

What changed:

- `/import-dry-run` now separates candle-quality presentation into:
  - true warnings for unsafe price basis and incomplete pre/post windows;
  - lower-resolution notices for `1m` unavailable / `5m` fallback cases;
  - quiet verified-basis details for `basis_aligned` provenance.
- `market_context_unavailable` copy now frames `private market-data symbol N`/`private market-data symbol O`-style failures as a
  market-data limitation, not a trade error, and says execution/P&L review can
  still proceed.
- Calibration readiness now breaks candle notes into:
  - unsafe candle-basis rows;
  - lower-resolution `5m` fallback rows;
  - incomplete trade-window rows;
  - ignored trade-window rows;
  - quiet candle-basis/provenance rows.
- Added focused synthetic coverage for:
  - reverse-split/basis mismatch staying execution-only;
  - unavailable daily/4h context;
  - `5m` fallback as a notice rather than a true movement-warning.
- Audited the `22` weak/no daily/4h level evidence rows and documented that they
  are not a broad candle-backfill lane.
- Added a compact current market-data policy status doc.

Current readiness split:

- execution-only fallback rows: `5`
- unsafe candle-basis rows: `5` across private calibration symbols
- lower-resolution `5m` fallback rows: `158`
- incomplete trade-window rows: `2` across private calibration symbols
- ignored trade-window rows: `0`
- quiet candle-basis/provenance rows: `199`
- weak/no daily/4h level evidence rows: `22`

Docs/artifacts:

- `src/docs/weak-level-evidence-audit-2026-05-06.md`
- `src/docs/market-data-policy-status-2026-05-06.md`
- `artifacts/real-csv-calibration/private/ibkr-april-all-eligible-after-pbm-xtlb-window-fixes-readiness.md`
- `artifacts/real-csv-calibration/private/ibkr-april-all-eligible-after-pbm-xtlb-window-fixes-summary.md`

Verification so far:

- `npx tsc --noEmit --pretty false` passed.
- `npx vitest run src/lib/trader-analytics/__tests__/decision-review-calibration-readiness.test.ts --reporter=dot`
  passed: `2/2`.
- `npx vitest run src/lib/trader-analytics/__tests__/csv-dry-run-decision-review-bridge.test.ts --reporter=dot`
  passed: `16/16`.
- `npm run build` passed.
- `npx playwright test tests/e2e/import-dry-run.spec.ts --project=chromium-desktop`
  passed: `11/11`.

Next best step:

- If continuing this branch, inspect the `SKLZ` extreme excursion row before
  changing thresholds. Avoid more candle backfill unless a concrete replay is
  blocked and IBKR/warehouse alignment can be proven.

### 2026-05-06 SKLZ Extreme Excursion Audit

What changed:

- Audited the lone extreme excursion symbol from the latest all-eligible replay:
  `SKLZ`.
- Confirmed the row is a real small-cap intraday move, not a calculation bug or
  candle basis mismatch.
- The private broker execution row bought `35` shares at `6.12` on
  `2026-04-23 12:36:34 ET` and sold at `11.37` on `2026-04-23 13:31:07 ET`.
- Warehouse `5m` candles show a `20.00` high during the hold; the daily candle
  also has `high=20.00`.
- Metric reconciliation:
  - `tradeMfePct=226.8%` = `(20.00 - 6.12) / 6.12`
  - realized exit move = about `85.8%`
  - `favorableExcursionLeftOnTablePct=141.0%` = `226.8% - 85.8%`
  - post-exit high `14.74` supports the `29.6%` post-exit continuation metric.

Docs:

- `src/docs/sklz-extreme-excursion-audit-2026-05-06.md`
- Updated `src/docs/market-data-policy-status-2026-05-06.md`.

Next best step:

- The market-data calibration branch is clean enough to stop here. Future work
  should move to product copy for verified extreme moves or weak-context rows,
  not provider backfill.

### 2026-05-06 Decision Review Trust Badges

What changed:

- Added decision-review card status badges in `/import-dry-run`:
  - `Verified candle basis`
  - `Lower-resolution candle window`
  - `Execution/P&L only`
  - `Verified extreme move`
  - `Context present, not supportive`
- The badges are derived from existing review evidence and candle-quality notes;
  no new backend contract was added.
- SKLZ-style triple-digit excursion rows now get a product label that says the
  move is verified rather than suspicious.
- Weak-context rows now read as valid market context that was not supportive,
  instead of sounding like missing data.
- Added browser synthetic coverage for:
  - verified aligned candle basis badge;
  - unsafe price-basis execution/P&L-only badge;
  - lower-resolution 5m fallback badge;
  - verified extreme move badge;
  - weak context present-but-not-supportive badge.

Verification:

- `npx tsc --noEmit --pretty false` passed.
- `npx vitest run src/lib/trader-analytics/__tests__/decision-review-calibration-readiness.test.ts src/lib/trader-analytics/__tests__/csv-dry-run-decision-review-bridge.test.ts --reporter=dot`
  passed: `18/18`.
- `npm run build` passed.
- `npx playwright test tests/e2e/import-dry-run.spec.ts --project=chromium-desktop`
  passed: `13/13`.

Known unrelated test status:

- Fixed after this badge/copy branch in the behavior-family calibration pass.

Next best step:

- Move to broader behavior calibration only when ready: inspect whether the
  coaching conclusions themselves are right across high-frequency headline
  families such as profit protection, premature exit, and undersized winner.

### 2026-05-06 Behavior Family Calibration - Exit Continuation Threshold

What changed:

- Fixed the deterministic dashboard fixture lane that had stale
  support/resistance and stub-context expectations.
- Found and fixed a real behavior bug in
  `src/lib/trade-analysis/review/build-trade-decision-review.ts`:
  `maxFavorableMovePctAfterExit` is stored as a ratio, but the
  `exit_left_continuation` guard compared it to `5`. The intended 5% guard now
  uses `0.05`.
- Added a stale-headline guard so the coaching headline cannot say the trade
  "exited winner potential too early" unless the visible insights still include
  `exit_left_continuation`.
- Added deterministic dashboard protection for that headline/insight coupling.
- Updated deterministic expectations where stricter continuation logic correctly
  leaves profit-protection as the visible issue.

All-eligible IBKR/warehouse replay impact:

- completed reviews stayed `204/208`.
- execution-only fallback stayed `5`.
- unsafe candle-basis rows stayed `5` (`private basis symbol A`, `private basis symbol B`, `private basis symbol C`).
- lower-resolution `5m` fallback rows stayed `158`.
- weak/no daily/4h evidence rows stayed `22`.
- missing trade-window excursion insights stayed `0`.
- `exit_left_continuation` insights dropped `59 -> 4`.
- "The trade exited winner potential too early." headlines dropped `43 -> 7`.

Docs/artifacts:

- `src/docs/behavior-family-calibration-audit-2026-05-06.md`
- `artifacts/real-csv-calibration/private/ibkr-april-all-eligible-after-exit-threshold-fix.json`
- `artifacts/real-csv-calibration/private/ibkr-april-all-eligible-after-exit-threshold-fix-readiness.md`
- `artifacts/real-csv-calibration/private/ibkr-april-all-eligible-after-exit-threshold-fix-summary.md`
- `artifacts/real-csv-calibration/private/ibkr-april-all-eligible-pbm-xtlb-vs-exit-threshold-fix-comparison.md`

Verification:

- `npx vitest run src/lib/trade-analysis/__tests__/build-trade-analysis-summary.test.ts src/lib/trader-analytics/__tests__/csv-dry-run-decision-review-quality-dashboard.test.ts --reporter=dot`
  passed: `7/7`.
- `npx tsc --noEmit --pretty false` passed.

Next best step:

- Completed in the follow-up fix-first alignment pass below.

### 2026-05-06 Behavior Family Calibration - Premature Fix-First Alignment

What changed:

- Audited `41` rows where `fixFirstBehaviorId=premature_exit` appeared without a
  visible `exit_left_continuation` insight after the 5% continuation threshold
  fix.
- Kept the lower-level behavior engine intact, but aligned the
  product-facing decision-review fix-first label to visible review evidence:
  - visible `profit_protection_failed` remaps to `poor_profit_protection`;
  - visible `adds_increased_risk_into_weakness` remaps to
    `adding_into_weakness`;
  - otherwise the review leaves fix-first empty instead of overclaiming
    `premature_exit`.
- Added a fallback constructive headline for stale premature-exit template rows
  that had no visible risk insight left after filtering.

All-eligible IBKR/warehouse replay impact:

- completed reviews stayed `204/208`.
- all market-data readiness counts stayed unchanged.
- `premature_exit` fix-first labels dropped `44 -> 3`.
- `poor_profit_protection` fix-first labels rose `70 -> 81`.
- `adding_into_weakness` fix-first labels rose `2 -> 6`.
- stale premature-exit headlines without `exit_left_continuation`: `0`.
- `premature_exit` fix-first labels without `exit_left_continuation`: `0`.

Docs/artifacts:

- Updated `src/docs/behavior-family-calibration-audit-2026-05-06.md`.
- `artifacts/real-csv-calibration/private/ibkr-april-all-eligible-after-premature-fixfirst-alignment.json`
- `artifacts/real-csv-calibration/private/ibkr-april-all-eligible-after-premature-fixfirst-alignment-readiness.md`
- `artifacts/real-csv-calibration/private/ibkr-april-all-eligible-after-premature-fixfirst-alignment-summary.md`
- `artifacts/real-csv-calibration/private/ibkr-april-all-eligible-exit-threshold-vs-premature-fixfirst-alignment-comparison.md`

Verification:

- `npx vitest run src/lib/trade-analysis/__tests__/build-trade-analysis-summary.test.ts src/lib/trader-analytics/__tests__/csv-dry-run-decision-review-quality-dashboard.test.ts --reporter=dot`
  passed: `7/7`.
- `npx tsc --noEmit --pretty false` passed.

Next best step:

- Completed in the profit-protection and scaling headline alignment pass below.

### 2026-05-06 Behavior Family Calibration - Profit Protection And Scaling Alignment

What changed:

- Audited the `poor_profit_protection` family after premature-exit alignment.
- Found `8` product-facing contradictions where a review showed both
  `profit_protection_failed` and `exit_captured_trade_well`, with realized MFE
  capture as high as the high-80% range.
- Kept the underlying pattern engine intact, but changed the decision-review
  product layer so `profit_protection_failed` is not shown when the same exit
  qualifies as positive capture.
- Added stale-label guards:
  - stale profit-protection headlines fall back to the visible review evidence;
  - stale `poor_profit_protection` fix-first labels are removed, or remapped to
    `adding_into_weakness` when visible add-into-weakness evidence exists.
- Audited the scaling family and avoided overlabeling late/extended adds as
  `adding_into_weakness`. The only scaling patch was headline priority:
  visible `adds_increased_risk_into_weakness` can now lead the fallback
  headline instead of being hidden behind entry-location wording.

Final all-eligible IBKR/warehouse replay state:

- requested trades: `208`
- completed reviews: `204`
- execution-only fallback rows: `5`
- unsafe candle-basis rows: `5` (`private basis symbol A`, `private basis symbol B`, `private basis symbol C`)
- weak/no daily/4h level evidence rows: `22`
- missing trade-window excursion insights: `0`
- stale/contradictory behavior buckets:
  - `profit_protection_failed` plus `exit_captured_trade_well`: `0`
  - `poor_profit_protection` without `profit_protection_failed`: `0`
  - `premature_exit` without `exit_left_continuation`: `0`
  - `adding_into_weakness` without `adds_increased_risk_into_weakness`: `0`
- final fix-first counts:
  - none: `103`
  - `poor_profit_protection`: `71`
  - `undersized_winner`: `16`
  - `adding_into_weakness`: `10`
  - `premature_exit`: `3`
  - `flip_flopping`: `1`

Docs/artifacts:

- Updated `src/docs/behavior-family-calibration-audit-2026-05-06.md`.
- `artifacts/real-csv-calibration/private/ibkr-april-all-eligible-after-profit-protection-alignment.json`
- `artifacts/real-csv-calibration/private/ibkr-april-all-eligible-after-scaling-headline-alignment.json`
- `artifacts/real-csv-calibration/private/ibkr-april-all-eligible-after-scaling-headline-alignment-readiness.md`
- `artifacts/real-csv-calibration/private/ibkr-april-all-eligible-after-scaling-headline-alignment-summary.md`
- `artifacts/real-csv-calibration/private/ibkr-april-all-eligible-premature-vs-scaling-headline-alignment-comparison.md`

Verification:

- `npx vitest run src/lib/trade-analysis/__tests__/build-trade-analysis-summary.test.ts src/lib/trader-analytics/__tests__/csv-dry-run-decision-review-quality-dashboard.test.ts --reporter=dot`
  passed: `7/7`.
- `npx tsc --noEmit --pretty false` passed.

Next best step:

- Add focused regression coverage for the final contradiction buckets above so
  future behavior-copy changes cannot reintroduce stale fix-first labels or
  contradictory exit insights. The current branch does not need more broad
  candle fetching or behavior-family rewrites.

### 2026-05-06 Behavior Family Calibration - Invariant Guards And Sizing Visibility

What changed:

- Added decision-review calibration invariant counters for stale behavior
  fix-first labels and contradictory exit insights.
- Added regression coverage for stale `poor_profit_protection`,
  `premature_exit`, `adding_into_weakness`, and `undersized_winner` labels.
- Added a visible `winner_stayed_undersized` scaling risk insight for the
  underutilized-winner behavior evidence, so the `undersized_winner` headline
  and fix-first label are backed by visible product evidence.
- Kept late-range add warnings separate from the `adding_into_weakness`
  behavior family unless explicit weakness evidence is present.

Audit outcome:

- `none` fix-first rows are mostly entry-location, late-range add, or
  constructive/no-registered-family cases.
- `Entry was not close to daily/4h support.`: `57/57` rows have visible
  `entry_far_from_daily_4h_support` evidence.
- `undersized_winner` stale visible-insight labels: `16 -> 0`.
- Late-range add rows: `34/34` have visible
  `adds_after_trade_already_used_range` evidence.

Final all-eligible IBKR/warehouse replay state:

- requested trades: `208`
- completed reviews: `204`
- execution-only fallback rows: `5`
- unsafe candle-basis rows: `5`
- weak/no daily/4h level evidence rows: `22`
- missing trade-window excursion insights: `0`
- extreme excursion metric count: `2`
- fallback/generic headlines: `0`
- stale/contradictory behavior buckets all `0`, including the new
  `undersized_winner` visibility guard.

Docs/artifacts:

- Updated `src/docs/behavior-family-calibration-audit-2026-05-06.md`.
- `artifacts/real-csv-calibration/private/ibkr-april-all-eligible-after-behavior-invariant-guards.json`
- `artifacts/real-csv-calibration/private/ibkr-april-all-eligible-after-behavior-invariant-guards-readiness.md`
- `artifacts/real-csv-calibration/private/ibkr-april-all-eligible-after-behavior-invariant-guards-summary.md`
- `artifacts/real-csv-calibration/private/ibkr-april-all-eligible-scaling-vs-invariant-guards-comparison.md`
- `artifacts/real-csv-calibration/private/ibkr-april-all-eligible-after-undersized-visible-insight-v2.json`
- `artifacts/real-csv-calibration/private/ibkr-april-all-eligible-after-undersized-visible-insight-v2-readiness.md`
- `artifacts/real-csv-calibration/private/ibkr-april-all-eligible-after-undersized-visible-insight-v2-summary.md`
- `artifacts/real-csv-calibration/private/ibkr-april-all-eligible-invariant-vs-undersized-visible-insight-v2-comparison.md`

Verification:

- `npx vitest run src/lib/trader-analytics/__tests__/decision-review-calibration-readiness.test.ts src/lib/trade-analysis/__tests__/build-trade-analysis-summary.test.ts src/lib/trader-analytics/__tests__/csv-dry-run-decision-review-quality-dashboard.test.ts --reporter=dot`
  passed: `10/10`.
- `npx tsc --noEmit --pretty false` passed.

Next best step:

- The behavior-family calibration branch is stable. Highest-value next work is
  a UI/reporting pass to surface the new invariant counters and
  `winner_stayed_undersized` insight clearly in the import dry run, or a
  separate warehouse/provider pass for the remaining known data-availability
  cases without bulk-fetching more candles.

### 2026-05-06 Next Chat Handoff

Wrote the fresh next-chat handoff:

- `src/docs/trader-intelligence-next-chat-handoff-2026-05-06.md`

Also marked the May 5 handoff as superseded so future chats do not resume from
the stale first-100 baseline.

GitHub was not updated from this workspace because the branch has a large mixed
dirty state with many unrelated tracked/untracked files and private calibration
artifacts. A future push should use a deliberate commit scope that excludes
private CSV/artifact contents and unrelated work.

### 2026-05-06 External Provider Reference Cleanup

User clarified that the project should not reference the unused external
historical provider path in either `trader-intelligence-v2` or the sibling
`levels-system` project.

What changed:

- Removed stale provider mentions from Trader Intelligence docs and handoffs.
- Removed the unused provider implementation and factory path from
  `levels-system`; supported provider names are now `ibkr` and explicit `stub`.
- Removed unused provider-key plumbing from `levels-system` shared candle,
  warehouse, trade-analysis, and validation-script paths.
- Updated provider-comparison defaults/tests to use `stub` as the local
  comparison provider when needed.
- Removed stale provider references from `levels-system` README and handoff /
  changelog docs.

Verification:

- `levels-system`: `npx tsx --test src\tests\provider-factory.test.ts src\tests\provider-comparison-readiness-report.test.ts`
  passed with `4/4` tests.
- `levels-system`: `npx tsc --noEmit --pretty false` passed.
- Case-insensitive repo sweeps found no remaining references to the removed
  provider name in either project, excluding generated/cache folders.

### 2026-05-06 Import And Coaching Audit Step 1-2

Started the import/coaching user-loop audit requested by the user and created:

- `src/docs/import-and-coaching-audit-plan-2026-05-06.md`

Audit read:

- CSV import/grouping coverage is already broad for IBKR activity statement
  preambles, signed quantities, long/short grouping, partial exits,
  over-reductions, open positions, session/time-gap splits, fees/commissions,
  broker net amount, timezone handling, options quarantine, and representative
  generic broker fixtures.
- Decision-review/coaching coverage already protects execution-only fallback
  rows, unsafe candle-basis notes, market-context-unavailable diagnostics,
  short-side wording, required headline/title/evidence fragments, forbidden
  VWAP/EMA wording, and stale behavior invariant buckets.

Small hardening patch:

- `/api/import-dry-run/decision-review` now validates `columnMapping` values and
  returns a 400 contract error for malformed mapping payloads.
- Direct bridge scenario tests now enforce required headline fragments and
  forbidden text fragments from the shared decision-review scenario fixtures.

Verification:

- Focused import/coaching Vitest command passed with `5` files / `55` tests.
- `npx tsc --noEmit --pretty false` passed.

Next best step:

- Continue from the same audit plan into the `/import-dry-run` UI surface:
  confirm the user can clearly see import repair state, grouping review,
  execution/P&L-only status, decision-review evidence, and behavior invariant
  readiness without reading developer artifacts.

### 2026-05-06 Import And Coaching Audit UI Surface

Continued the import/coaching audit plan into the `/import-dry-run` product
surface.

What changed:

- Added a visible Behavior Evidence Alignment summary to the prototype-analysis
  panel when server decision-review snapshots are attached.
- The summary flags stale or contradictory fix-first behavior labels when the
  visible insights do not support the label, including protection,
  premature-exit, adding-into-weakness, and undersized-winner cases.
- Tightened import dry-run E2E expectations so the attached-review path shows
  the alignment summary and the premature-exit fixture carries visible
  `exit_left_continuation` evidence.

Verification:

- `npx vitest run src/lib/trader-analytics/__tests__/trader-csv-dry-run-import-ui.test.ts src/lib/trader-analytics/__tests__/csv-dry-run-decision-review-api-route.test.ts src/lib/trader-analytics/__tests__/csv-dry-run-decision-review-bridge.test.ts --reporter=dot`
  passed: `31/31`.
- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.
- `npx playwright test tests/e2e/import-dry-run.spec.ts --project=chromium-desktop`
  passed: `13/13`.

Next best step:

- Continue from the same plan into a focused execution-readiness pass: verify
  that grouped buy/sell executions, open-position warnings, gross-only cost
  policy, and dry-run write-safety states remain visible and covered across the
  import route and any import-health/reporting surfaces.

### 2026-05-06 Import And Coaching Audit Execution Readiness

Continued the import/coaching audit into execution-readiness visibility on
`/import-dry-run`.

What changed:

- Added a top-level Execution Readiness summary near the import session and
  prototype panels.
- The summary shows accepted execution count, grouped trade count,
  open-position count, gross-only cost policy, and dry-run-only write safety in
  one place.
- It labels the user-facing state as `Execution ready`, `Execution review
  needed`, or `Execution blocked` based on rejected rows and open/review-needed
  grouped trades.
- Tightened import dry-run E2E coverage for ready, blocked, and open-position
  states.

Verification:

- `npx vitest run src/lib/trader-analytics/__tests__/trader-csv-dry-run-import-ui.test.ts src/lib/trader-analytics/__tests__/trader-functional-product-readiness.test.ts --reporter=dot`
  passed: `22/22`.
- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.
- `npx playwright test tests/e2e/import-dry-run.spec.ts --project=chromium-desktop`
  passed: `13/13`.

Next best step:

- Continue the same audit branch into import-health/reporting surfaces, checking
  whether the same dry-run write-safety and gross-only policy language appears
  wherever users review import readiness outside `/import-dry-run`.

### 2026-05-06 Import And Coaching Audit Reporting Clarity

Continued the import/coaching audit into related reporting surfaces outside
`/import-dry-run`.

What changed:

- Added safety-policy bands to `/imports`, `/import-health`, and
  `/import-trials`.
- The pages now explicitly repeat review-only/no production broker-row writes,
  gross-only feedback scoring, and fees/broker net amounts as reconciliation
  context.
- Added focused Playwright coverage that checks these policy bands on all three
  routes.
- Extended `src/docs/import-and-coaching-audit-plan-2026-05-06.md` with a
  forward work plan for contract hardening, fixture matrix coverage, coaching
  regression cases, first-user QA, and a public-safe real-data readiness
  report.

Verification:

- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-desktop --grep "keeps import reporting surfaces explicit"`
  passed: `1/1`.

Next best step:

- Start Step 3 from the forward plan: create a shared import-facing route
  contract that asserts write-safety, gross-only cost policy, broker support
  scope, and no-export boundaries across every import/reporting route.

### 2026-05-06 Import-Facing Route Contract Hardening

Completed Step 3 from the import/coaching audit forward plan.

What changed:

- Added `buildImportFacingRouteContract()` in
  `src/lib/trader-analytics/product/import-facing-route-contract.ts`.
- The contract covers `/import-dry-run`, `/imports`, `/import-health`,
  `/import-trials`, `/repair-wizard`, `/review-cockpit`, and `/calibration`.
- Each route now has a contract-bound policy surface with required write-safety,
  gross-only cost policy, broker/data scope, and no-export boundary copy.
- Added safety-policy bands to `/repair-wizard`, `/review-cockpit`, and
  `/calibration` to match the already-hardened import/reporting pages.
- Rewired the focused Playwright policy test to iterate the shared contract.

Verification:

- `npx vitest run src/lib/trader-analytics/__tests__/trader-import-trial-experience.test.ts src/lib/trader-analytics/__tests__/platform-ready-feature-module.test.ts --reporter=dot`
  passed: `18/18`.
- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.
- `npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-desktop --grep "keeps import reporting surfaces explicit"`
  passed: `1/1`.

Next best step:

- Start Step 4 from the forward plan: build a named buy/sell execution fixture
  matrix for long win/loss, short win/loss, partial exit, over-reduction,
  same-symbol split trades, open position, rejected row, and fees/net amount.

### 2026-05-06 Buy/Sell Execution Fixture Matrix

Completed Step 4 from the import/coaching audit forward plan.

What changed:

- Added `buildBuySellExecutionFixtureMatrix()` and
  `runBuySellExecutionFixtureMatrix()`.
- The matrix now protects long win/loss, short win/loss, partial exit,
  over-reduction, same-symbol split trades, open position, rejected row, and
  fees/net amount behavior.
- The matrix asserts accepted/rejected execution counts, grouped trade count,
  confidence status, lifecycle status, grouping reason, final position,
  gross realized P/L, and cost reconciliation values where relevant.
- Captured the current intended behavior that open-position rows can show
  realized execution-only P/L for the closed portion while remaining
  review-gated.

Verification:

- `npx vitest run src/lib/trader-analytics/__tests__/buy-sell-execution-fixture-matrix.test.ts src/lib/trader-analytics/__tests__/trader-csv-dry-run-import-ui.test.ts src/lib/execution-sources/csv/__tests__/broker-execution-csv-import.test.ts --reporter=dot`
  passed: `39/39`.
- `npx tsc --noEmit --pretty false` passed.

### 2026-05-06 Coaching Behavior Evidence Matrix

Completed Step 5 from the import/coaching audit forward plan.

What changed:

- Added `buildCoachingBehaviorEvidenceMatrix()` and
  `runCoachingBehaviorEvidenceMatrix()`.
- The matrix includes backed and stale cases for `poor_profit_protection`,
  `premature_exit`, `adding_into_weakness`, and `undersized_winner`.
- Added a clean captured-exit case and a contradictory captured-exit plus
  failed-protection case.
- These cases run through the same decision-review calibration readiness
  counters used by the real-data dashboards.

Verification:

- `npx vitest run src/lib/trader-analytics/__tests__/buy-sell-execution-fixture-matrix.test.ts src/lib/trader-analytics/__tests__/coaching-behavior-evidence-matrix.test.ts src/lib/trader-analytics/__tests__/decision-review-calibration-readiness.test.ts --reporter=dot`
  passed: `9/9`.
- `npx vitest run src/lib/trader-analytics/__tests__/buy-sell-execution-fixture-matrix.test.ts src/lib/trader-analytics/__tests__/coaching-behavior-evidence-matrix.test.ts src/lib/trader-analytics/__tests__/trader-import-trial-experience.test.ts src/lib/trader-analytics/__tests__/trader-csv-dry-run-import-ui.test.ts --reporter=dot`
  passed: `26/26`.
- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.

Next best step:

- Start Step 6 from the forward plan: run/tighten first-user workflow QA from
  onboarding through import dry run, repair, grouping review, coaching, and
  reporting, fixing concrete missing states or unclear limitations only.

### 2026-05-06 First-User Workflow QA

Completed the desktop Step 6 first-user QA pass from the import/coaching audit
forward plan.

What changed:

- Ran the existing `app-first-user-hardening` Playwright suite on
  `chromium-desktop`.
- Tightened the first-user journey from `/first-run` into `/import-dry-run` so
  it now asserts the Execution Readiness summary after row repair.
- The journey now verifies `Execution ready`, `write safety: dry-run only`, and
  `gross-only` before checking the execution feedback preview.

Verification:

- `npx playwright test tests/e2e/app-first-user-hardening.spec.ts --project=chromium-desktop`
  passed: `7/7` applicable tests with `1` Firefox-only skip.
- `npx playwright test tests/e2e/app-first-user-hardening.spec.ts --project=chromium-desktop --grep "guides a first user"`
  passed: `1/1` after the assertion tightening.

Next best step:

- Start Step 7 from the forward plan: produce a public-safe real-data readiness
  report with aggregate counts only, keeping private IBKR paths and private
  artifact contents out of docs.

### 2026-05-06 Session Time Intelligence

Implemented Eastern Time session and hourly trade intelligence for execution
imports and analytics.

What changed:

- Added shared timestamp classification for overnight, pre-market, market open,
  midday, and post-market buckets using Eastern Time boundaries.
- CSV imports now derive `sessionDate`, `sessionBucket`, entry hour, and
  held-through session exposure from execution timestamps instead of using a
  default session bucket.
- Execution-feedback summaries and trader analytics rows now carry entry-hour
  facts, held-session buckets, cross-session hold flags, and time-of-day
  aggregate metrics.
- Analytics and import dry-run surfaces now show entry session/hour and
  held-through session labels, with an analytics entry-hour filter.

Verification:

- Focused session/import/analytics tests passed: `35/35`.
- Broader session/import/feedback/analytics matrix passed: `68/68`.
- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.
- Private April IBKR CSV smoke check parsed `574` accepted executions into
  `207` grouped trades with session distribution covering pre-market, market
  open, midday, post-market, and overnight.

Next best step:

- Continue Step 7 public-safe real-data readiness reporting with aggregate-only
  counts, using the session/hour fields from the April smoke check.

Parked product note:

- Keep U.S. equity session classification canonical in Eastern Time. Later UI
  work can add a display preference for local/account timezone, but that should
  not change the canonical session bucket or ET hour analytics.

Follow-up plan:

- Created `src/docs/session-time-intelligence-follow-up-plan-2026-05-06.md`
  to track remaining product/reporting/coaching work for the broader time
  intelligence idea.

### 2026-05-06 Session Time Intelligence Follow-Up Completion

Completed the actionable follow-up work from
`src/docs/session-time-intelligence-follow-up-plan-2026-05-06.md`.

What changed:

- Added `src/scripts/summarize-session-time-readiness.ts` and the npm script
  `summarize:session-time-readiness`.
- Generated public-safe aggregate readiness output at
  `src/docs/session-time-real-data-readiness-2026-05-06.md`.
- Added import timezone diagnostics that distinguish broker/account timestamp
  parsing from Eastern Time market-session classification.
- Hardened analytics filtering/display against older saved rows without the new
  session-time fields.
- Polished analytics, coach, import dry-run, and trade review surfaces with
  entry-session, entry-hour, held-through, and sample-size guarded copy.
- Added Playwright coverage for analytics session/hour filtering, trade-detail
  session time display, and import dry-run session/hour labels.

Verification:

- `npx vitest run src/lib/execution-sources/csv/__tests__/broker-execution-csv-import.test.ts src/lib/execution-sources/csv/__tests__/broker-execution-csv-session-time.test.ts src/lib/trader-analytics/__tests__/trader-csv-dry-run-import-ui.test.ts src/lib/trader-analytics/__tests__/trader-coach-action-loop.test.ts src/lib/trader-analytics/__tests__/build-trader-analytics-report.test.ts src/lib/trader-analytics/__tests__/trader-improvement-intelligence.test.ts src/lib/trader-analytics/__tests__/end-user-productization.test.ts` passed: `66/66`.
- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.
- `npx playwright test tests/e2e/app-acceptance.spec.ts --project=chromium-desktop --grep "filters analytics|opens every sample trade"` passed: `2/2`.
- `npx playwright test tests/e2e/import-dry-run.spec.ts --project=chromium-desktop --grep "renders the required product panels"` passed: `1/1`.

Parked:

- Local/account timezone display remains intentionally parked. Canonical U.S.
  equity session classification stays Eastern Time.

Next best step:

- Continue the broader public-safe real-data readiness/reporting roadmap outside
  the session-time branch.

### 2026-05-06 Coaching Quality And Launch Verification Branch

Started a new launch-confidence branch after the session-time work was judged
complete for the current U.S. equity / Eastern Time scope.

Plan:

- Created
  `src/docs/coaching-quality-and-launch-verification-plan-2026-05-06.md`.
- The branch focuses on coaching language quality, coaching accuracy,
  synthetic sample trade fixtures, real CSV aggregate verification, market-data
  evidence boundaries, and focused product-surface verification.
- Codex can build the needed synthetic fixture/sample trades directly in this
  repo. Private IBKR CSVs should be used only for local aggregate smoke checks;
  any real-data miss that needs a committed regression should be converted into
  a sanitized synthetic fixture.
- `levels-system`, its candle warehouse, and the local IBKR Gateway may be used
  only for local candle-backed verification when a scenario genuinely needs
  historical trade-window candles or higher-timeframe level evidence. Tests
  should not require live Gateway access.

Next best step:

- Begin Phase 1 from the plan: inventory current coaching output builders and
  add a small coaching language/readiness harness before patching language.

Phase 1 start:

- Added `buildCoachingLanguageReadinessReport(...)` and a focused test.
- First sample readiness run checked `54` coach-facing text samples.
- Hard failures: `0`.
- Warnings: `21`, mostly repeated exact copy across coach home, severity,
  review queue, and session recap surfaces.

Verification:

- `npx vitest run src/lib/trader-analytics/__tests__/coaching-language-readiness.test.ts src/lib/trader-analytics/__tests__/trader-coach-action-loop.test.ts --reporter=dot`
  passed: `8/8`.
- `npx tsc --noEmit --pretty false` passed.

Next best step:

- Reduce repetitive coach copy where the readiness harness warns, then add the
  fixture-specific coaching expectation matrix from Phase 2.

Coaching-language polish slice:

- Added taxonomy-specific review actions instead of one repeated generic replay
  instruction.
- Adjusted coach home, session prep, session recap, and coach review queue copy
  so the same exact phrase is not repeated across multiple surfaces.
- Tightened the readiness test so the sample coach language must pass with zero
  failures and zero warnings.
- Latest readiness result: `54` checked coach-facing text samples, `0`
  failures, `0` warnings.

Verification:

- `npx vitest run src/lib/trader-analytics/__tests__/coaching-language-readiness.test.ts src/lib/trader-analytics/__tests__/trader-coach-action-loop.test.ts src/lib/trader-analytics/__tests__/trader-product-polish.test.ts src/lib/trader-analytics/__tests__/trader-improvement-intelligence.test.ts --reporter=dot`
  passed: `21/21`.
- `npx tsc --noEmit --pretty false` passed.

Next best step:

- Add the Phase 2 synthetic coaching fixture/expectation matrix covering common
  end-user scenarios and expected primary coaching emphasis.

Phase 2 start:

- Added `buildCoachingFixtureExpectationMatrix(...)` and
  `runCoachingFixtureExpectationMatrix(...)`.
- The first committed matrix covers clean long winner, direction-aware short
  winner, open-position review gating, adverse-add loser, structured partial
  exits, inconsistent sizing, rapid-fire management, session-time coach text,
  and coach queue primary behavior visibility.

Verification:

- `npx vitest run src/lib/trader-analytics/__tests__/coaching-fixture-expectation-matrix.test.ts src/lib/trader-analytics/__tests__/coaching-language-readiness.test.ts src/lib/trader-analytics/__tests__/trader-coach-action-loop.test.ts src/lib/trader-analytics/__tests__/trader-product-polish.test.ts src/lib/trader-analytics/__tests__/trader-improvement-intelligence.test.ts --reporter=dot`
  passed: `22/22`.
- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.

Next best step:

- Extend the fixture matrix with new builder-generated scenarios for the gaps
  not covered by the current sample set: premarket/open holds,
  market-open/midday holds, post-market/overnight holds, execution-only
  fallback, and positive full-trade management with no dominant mistake.

Extended verification completion:

- Expanded the coaching fixture expectation matrix to include generated
  execution-feedback scenarios for:
  - premarket into market open
  - market open into midday
  - midday into post-market
  - post-market into overnight
  - overnight into premarket
  - execution-only limitation copy
  - constructive full-trade management with controlled scale-in and staged exits
- Removed remaining app/source/test/README references to the unused removed
  historical provider. App request validation and env runtime validation now
  expose `ibkr`/`stub` only.
- Fixed stale import QA expectations for skipped non-trade and non-filled rows,
  and fixed the duplicate-fill mutation to duplicate an actual IBKR trade row.
- Updated stale shared-level fixture counts and snapshot expectations after the
  sibling shared engine returned richer sample support/resistance context.

Verification:

- Focused trader analytics/import/execution/trade-analysis batch passed:
  `267/267` tests across `40` files.
- Full `npm test -- --reporter=dot` passed: `865/865` tests across `98` files.
- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.
- `npm run verify:layer2` passed.
- `npm run verify:layer3` passed.
- `npm run verify:levels-system` passed: `79/79` tests across `21` files.
- Import dry-run focused Playwright passed: `3/3`.
- App acceptance focused Playwright passed: `2/2`.
- App feature regression Playwright passed: `11/11` applicable tests with `1`
  desktop-project skip.
- First-user hardening Playwright passed: `7/7` applicable tests with `1`
  Firefox-only skip.
- Provider-reference search across `src`, `app`, `tests`, `package.json`, and
  `README.md` returned no matches for the removed provider.

Next best step:

- Continue with real-data/private CSV aggregate calibration and convert any
  confusing real-data miss into a sanitized synthetic fixture.

### 2026-05-06 Real-Data Calibration And Synthetic Fixture Plan

Created the next branch plan:

- `src/docs/real-data-calibration-and-synthetic-fixture-plan-2026-05-06.md`

Purpose:

- run private real CSV aggregate calibration
- keep committed reports public-safe and aggregate-only
- detect import/grouping/session/coaching misses
- convert repeatable real-data misses into sanitized synthetic fixtures
- expand import and coaching regression coverage
- rerun full verification

Next best step:

- Start the plan by locating available private calibration CSVs, running
  aggregate import/session readiness, then running bounded decision-review
  calibration on completed grouped trades.

### 2026-05-06 Real-Data Calibration Public Report

Continued the real-data calibration branch from
`src/docs/real-data-calibration-and-synthetic-fixture-plan-2026-05-06.md`.

What changed:

- Added the repeatable `summarize:real-data-calibration-public` npm script.
- Generated the public-safe aggregate report at
  `src/docs/real-data-calibration-public-readiness-2026-05-06.md`.
- The report excludes private paths, account identifiers, symbols, raw rows,
  exact timestamps, prices, and share sizes.
- Private aggregate import/session calibration found `918` parsed rows, `574`
  accepted executions, `0` rejected rows, `344` skipped non-trade rows, `208`
  grouped trades, `206` closed trades, and `2` open trades.
- Session-time aggregation populated pre-market, market open, midday,
  post-market, and overnight buckets.
- Decision-review calibration completed `0` reviews because the local
  historical `5m` trade-window candle warehouse coverage was unavailable for
  the completed-trade sample.
- No synthetic fixture was added from this private run because no reproducible
  import, grouping, session-time, or coaching logic miss was found.

Current resume point:

- This branch is complete for the current app-side plan. Verification passed:
  focused import/session/calibration/coaching Vitest batch `40/40`,
  `npx tsc --noEmit --pretty false`, `npm run build`, full
  `npm test -- --reporter=dot` with `865/865`, `npm run verify:layer2`,
  `npm run verify:layer3`, `npm run verify:levels-system` with `79/79`,
  full import dry-run Playwright `13/13`, and focused app acceptance
  Playwright `2/2`.
- Best next product step: historical candle warehouse/backfill readiness in
  `levels-system` so decision reviews can run on private completed-trade
  samples.

### 2026-05-06 On-Demand Candle Hydration Bridge

Implemented the follow-up solution for the historical candle warehouse blocker.

What changed:

- In sibling `levels-system`, added an exported on-demand IBKR runtime helper
  that lazily connects to IBKR before historical candle fetches.
- The helper plugs into the existing durable warehouse `read_write` path, so
  missing candles are fetched by `levels-system` and written into the warehouse.
- In this app, `readLevelsSystemRuntimeConfigFromEnv(...)` now supports
  `LEVELS_SYSTEM_ON_DEMAND_HYDRATION=true`.
- With hydration enabled, this app passes an IBKR-backed fetch service to
  `levels-system`, forces warehouse mode to `read_write` unless `refresh` is
  explicitly requested, and keeps market-context ownership in the shared engine.
- Documented the runtime knobs in `README.md` and
  `src/docs/on-demand-candle-hydration-implementation-2026-05-06.md`.

Verification so far:

- `levels-system`: `npm run build` passed.
- `levels-system`: Node test run passed with `755/755`, including the new lazy
  IBKR on-demand fetch helper coverage.
- `trader-intelligence-v2`: focused trade-analysis / levels-system /
  decision-review bridge Vitest batch passed with `27/27`.
- `trader-intelligence-v2`: `npx tsc --noEmit --pretty false` passed.
- `trader-intelligence-v2`: `npm run build` passed.
- `trader-intelligence-v2`: `npm run verify:levels-system` passed with
  `80/80`.
- `trader-intelligence-v2`: full `npm test -- --reporter=dot` passed with
  `866/866`.
- Private on-demand hydration smoke passed with `max-trades=1`; one completed
  private trade received daily/4h market context and trade-window candle
  evidence instead of a durable warehouse miss.

Next best step:

- Rerun a larger private calibration batch with on-demand hydration enabled
  while IBKR Gateway is available, then inspect any remaining provider/basis
  misses as aggregate-safe follow-ups.

### 2026-05-07 Warehouse-Backed Real Calibration Completion

Resumed the real-data calibration branch after the sibling `levels-system`
warehouse backfill completed.

What changed:

- Rebuilt `levels-system` successfully so Trader Intelligence could consume the
  latest shared-engine package output.
- Added a `levels-system` durable warehouse regression for short but usable
  provider history, so limited-history symbols are not repeatedly refetched
  when the previous provider response already proved fewer bars were available.
- Reran private decision-review calibration in replay-only warehouse mode to
  avoid competing with live IBKR/watchlist processes.
- Regenerated the public-safe aggregate report at
  `src/docs/real-data-calibration-public-readiness-2026-05-06.md`.
- Updated `src/scripts/summarize-real-data-calibration-public.ts` so the report
  distinguishes true market-data blockers from evidence-gated limitations.

Private aggregate result:

- `918` parsed rows, `574` accepted executions, `0` rejected rows, `344`
  skipped non-trade rows, `208` grouped trades, `206` closed trades, and `2`
  open trades.
- Decision-review replay with `--max-trades 206` produced `206` analyzable
  completed-trade candidates and `204` completed reviews.
- `204` reviews used `levels_system_daily_4h`; `199` used
  `levels_system_trade_window`; `5` correctly fell back to execution-only
  because trade-window candle evidence was unavailable or unsafe.
- Remaining diagnostics were `2` open-trade skips and `2`
  market-context-unavailable rows.
- No blocker/high/medium/low import, grouping, session-time, or coaching logic
  miss was found; no new synthetic fixture was needed.

Verification:

- `levels-system`: `npm run build` passed.
- `levels-system`: touched durable warehouse/on-demand Node test run passed
  with `763/763`.
- Trader Intelligence private replay calibration passed for max-5, max-25, and
  max-206 runs.
- Trader Intelligence focused decision-review/runtime Vitest passed with
  `25/25`.
- Trader Intelligence timed-out tests from the first parallel run passed
  sequentially with `29/29`; the earlier failures were resource-contention
  timeouts from running build, shared verification, and full Vitest at once.
- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.
- `npm run verify:levels-system` passed with `80/80`.
- Full `npm test -- --reporter=dot` passed with `866/866`.
- Targeted privacy grep for private account/file/symbol labels in committed
  docs returned no matches after sanitizing legacy project-log ticker mentions.

Next best step:

- Close this calibration branch. Future work should move to product/UI polish
  or a new private calibration sample; convert only reproducible logic misses
  into sanitized synthetic fixtures.

## 2026-05-07 - One-Run Product Evidence Package

Current branch:

- Continue from the completed on-demand candle hydration/private calibration
  branch into product-facing evidence clarity.
- Added import dry-run decision-review evidence gates so the UI shows full
  daily/4h context, trade-window candle evidence, execution-only fallback,
  candle/data limits, unavailable market context, and open-trade skips before
  the user reads coaching.
- Tightened open-trade diagnostic language so open positions remain visibly
  excluded from completed-trade coaching until flat.
- Added `src/docs/trader-candle-runtime-operator-guide-2026-05-07.md` and linked
  it from `README.md` for replay/read-write/refresh runtime use, private CSV
  calibration flow, concurrency notes, UI evidence rules, and verification
  commands.

Next best step:

- Run focused import dry-run E2E, focused decision-review Vitest, TypeScript,
  and production build for this UI/docs package. If those pass, this one-run
  package is ready to close.

Verification:

- Focused decision-review/trade-analysis Vitest passed with `22/22` after
  rerunning the known slow repeated-add fixture with a larger timeout.
- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.
- Full import dry-run Playwright on `chromium-desktop` passed with `13/13`,
  including evidence-gate UI assertions and screenshot smoke coverage.
- Full `npm test -- --reporter=dot` reached `864/866` before two known slow
  candle-context tests hit default per-test timeouts; rerunning those two files
  with `--testTimeout=45000` passed with `9/9`.

Current closeout:

- The one-run product evidence package is complete. Next useful branch is either
  a small UI layout pass on the import dry-run decision-review section or a new
  private aggregate calibration sample if fresh broker data is available.

## 2026-05-07 - Product Clarity, Coaching Fixtures, And Browser QA

Completed the requested follow-up package for steps 1-4.

What changed:

- Refined the import dry-run decision-review evidence gates so the trust state
  is easier to scan: clear/limited/blocked status pill, compact review/limit
  counts, toned daily/4h, trade-window, execution-only, and data-limit metrics,
  and mobile-friendly grid behavior.
- Tightened coach confidence wording from generic confidence phrases into
  stronger action-oriented language for strong, moderate, and limited evidence.
- Made the session prep checklist point at the priority trade, current rule, and
  session/hour prompt instead of generic review steps.
- Expanded the coaching fixture expectation matrix with synthetic
  decision-review evidence fixtures for full-context clean review,
  entry-near-resistance risk, execution-only fallback, unsafe candle basis,
  market-context unavailable diagnostics, and open-trade skips.
- Added `/coach` to the core product browser QA path and added a dedicated
  coach product-loop assertion covering coach queue, evidence cards, session
  timing/prep, rule lab, pattern memory, severity ladder, simulations,
  archetype, review completion, and confidence language.

Verification:

- Focused coaching/product Vitest passed: `16/16`.
- Focused CSV decision-review bridge/boundary Vitest passed: `18/18`.
- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.
- Import dry-run Playwright on `chromium-desktop` passed: `13/13`.
- App feature regression Playwright on `chromium-desktop` passed: `12` passed,
  `1` expected mobile-only skip.
- App feature regression mobile overflow/visual-smoke subset passed: `2/2`.
- App acceptance Playwright on `chromium-desktop` passed: `6` passed, `1`
  expected mobile-only skip.
- Full Vitest with slow candle fixtures allowed to finish passed:
  `npm test -- --reporter=dot --testTimeout=45000` with `866/866`.
- After the final neutral-tone tweak for diagnostic-only evidence gates,
  `npx tsc --noEmit --pretty false`, focused coaching fixture/language Vitest
  `2/2`, `npm run build`, import dry-run decision-review Playwright subset
  `4/4`, and app-feature coach/visual/market-context subset `3/3` passed.

Next best step:

- The current product clarity/coaching QA branch is complete. Best next branch
  is either a visual polish pass on the rough coach/import screens or a fresh
  aggregate-only private CSV calibration sample.

## 2026-05-07 - Visual Polish And Buy/Sell Safety Hardening

Completed the next requested package after product clarity/coaching QA.

What changed:

- Polished `/coach` first-screen hierarchy with a clearer header action,
  evidence/source pills, calmer panel treatment, and a user-facing `Data Mode`
  label instead of the rough `Empty State` metric.
- Kept all existing coach workflow sections intact: coach queue, evidence
  cards, session timing, session prep, action rail, rule lab, pattern memory,
  severity ladder, simulations, archetype, review completion, and confidence
  language.
- Expanded `buildBuySellExecutionFixtureMatrix()` beyond basic long/short,
  partial, over-reduction, same-symbol, open, rejected, and fee/net cases.
- Added committed synthetic safety fixtures for:
  - duplicate-like fill cluster
  - same-timestamp broker fill batching
  - huge size jump
  - impossible fee/commission larger than trade value
- Extended the buy/sell fixture matrix assertions so execution anomaly types
  and urgent/review anomaly counts are now part of the contract, not just UI
  copy.

Verification:

- `npx vitest run src/lib/trader-analytics/__tests__/buy-sell-execution-fixture-matrix.test.ts --reporter=dot`
  passed: `4/4`.
- Focused coaching/product Vitest passed: `16/16`.
- Focused import workflow Vitest passed: `26/26`.
- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.
- Import dry-run focused Playwright passed: `4/4`.
- App feature regression focused coach/visual/market-context subset passed:
  `3/3`.
- Full `npm test -- --reporter=dot --testTimeout=45000` passed with
  `867/867`.
- App acceptance Playwright on `chromium-desktop` passed: `6` passed and `1`
  expected mobile-only skip.
- Full app feature regression on `chromium-desktop` passed: `12` passed and `1`
  expected mobile-only skip.
- App feature regression mobile overflow/visual-smoke subset passed: `2/2`.

Next best step:

- This branch is complete. Best next work is persistence/read-model planning
  for imported trades, decision-review snapshots, evidence-gate state, and
  coaching summaries, or a fresh private aggregate CSV calibration run if new
  real broker data is available.

## 2026-05-07 - Persistence Read Model And Import Commit Design

Completed the requested persistence/read-model planning branch.

What changed:

- Added
  `src/docs/persistence-read-model-and-import-commit-plan-2026-05-07.md`.
- The plan narrows the next productionization branch to persisted import
  batches, normalized executions, saved grouped trades, decision-review
  snapshots, evidence-gate state, analytics report snapshots, and route read
  models.
- Defined V1 write-model tables, including the new
  `decision_review_snapshots` and `decision_review_diagnostics` schema deltas
  that were not explicit in the older database schema plan.
- Defined read models for import commit, saved trade detail, analytics, coach,
  and guided review routes.
- Defined the import commit state machine from preview through
  `ready_to_commit`, `committing`, `committed`, `commit_failed`, `discarded`,
  and `superseded`.
- Defined commit preconditions, duplicate-file/trade/row handling, transaction
  steps, rollback/delete stance, repository/API boundaries, coding phases, and
  test plan.
- Linked the plan from `README.md` and added a pointer from
  `src/docs/end-user-database-schema-plan.md`.

Verification:

- Documentation-only branch. No code path or runtime behavior changed.

Next best step:

- Start Phase 1 from the new plan: add TypeScript repository/read-model
  contracts and a pure import commit planner around `CsvDryRunImportExperience`
  without choosing a database vendor yet.

## 2026-05-07 - Import Commit Phase 1 Implementation

Completed Phase 1 from the persistence/read-model and import commit plan.

What changed:

- Added a pure import commit planner at
  `src/lib/trader-analytics/product/import-commit/import-commit-planner.ts`.
- Added an in-memory import commit repository at
  `src/lib/trader-analytics/product/import-commit/in-memory-import-commit-repository.ts`.
- Exported the new planner/repository contracts from
  `src/lib/trader-analytics/index.ts`.
- Added durable-read-model planning for import batches, row outcomes, issues,
  repair items, normalized executions, saved grouped trades, execution links,
  grouping diagnostics, execution-feedback summaries, and decision-review jobs.
- Preserved the safe generic-import rule: `generic_execution_csv` can import
  mapped broker execution CSVs, but mapping review is required unless confidence
  is high; missing broker net P/L also requires explicit P/L review before
  commit.
- Added `src/lib/trader-analytics/__tests__/import-commit-planner.test.ts`
  covering mapping review, ready commit, rejected rows, open positions,
  duplicate file/trade decisions, short trades with fee/net previews, and
  over-reduction/anomaly acknowledgement.
- Updated
  `src/docs/persistence-read-model-and-import-commit-plan-2026-05-07.md` to
  mark Phase 1 complete and clarify the next branch.

Verification:

- Import commit planner Vitest passed: `7/7`.
- Focused import/coaching/product readiness Vitest passed: `43/43`.
- Full Vitest default timeout reached `871/874` passing, with 3 slow candle /
  decision-review tests timing out at default per-test limits.
- The 3 timed-out tests passed when rerun with `--testTimeout=120000`: `13/13`.
- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.

Next best step:

- Choose the next branch:
  - durable adapter work: select database/migration tool and implement Phase 2;
  - or product-flow work: wire the in-memory commit path into a guarded import
    route/UI smoke path while keeping production writes disabled until the
    durable adapter exists.

## 2026-05-07 - Generic Execution Importer Hardening

Improved the broker-agnostic/generic execution CSV lane after confirming that
it should be the next best step before deeper persistence wiring.

What changed:

- `generic_execution_csv` now auto-detects comma, semicolon, and tab-delimited
  execution files instead of treating semicolon/tab broker exports as broken
  CSVs.
- Import diagnostics now expose the detected delimiter.
- Expanded common generic aliases for execution date/time, filled shares,
  average/fill/execution price, order number, execution id, net amount, and
  split fee columns.
- Side/action parsing now understands short-sale and cover wording in addition
  to buy/sell/BTO/BTC/STO/STC style values.
- Fee parsing now aggregates multiple split fee columns such as `SEC Fee`,
  `TAF Fee`, and `Clearing Fee` while preserving commission separately.
- Updated the first-user browser abuse case so semicolon-delimited files are
  expected to import successfully instead of fail as a wrong delimiter.

Verification:

- Focused CSV parser/session/import-commit Vitest passed: `39/39`.
- Wider generic import workflow Vitest passed: `67/67`.
- Additional buy/sell, functional readiness, and import repair Vitest passed:
  `23/23`.
- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.
- First-user/import hardening Playwright on `chromium-desktop` passed:
  `7` passed, `1` expected Firefox-only skip.

Next best step:

- Continue making generic import production-grade by adding a mapped-column
  confidence preview surface and/or moving to the guarded import commit route.
  The parser is meaningfully better now, but the product should still require
  mapping review before committing best-effort generic broker files.

## 2026-05-07 - Saved Import To Coaching Loop

Implemented the launch-path feature branch where a user can paste broker
executions, review the dry run, save the import to local SQLite, and see saved
trades drive the trade list, analytics, coach, and guided review surfaces.

What changed:

- Added the live-launch plan at
  `src/docs/feature-completion-to-live-launch-plan-2026-05-07.md`.
- Added local SQLite persistence with `better-sqlite3`, defaulting to
  `data/trader-intelligence.sqlite` with `TRADER_INTELLIGENCE_DB_PATH` override.
- Added V1 migrations for import batches, rows, issues, repair items,
  normalized executions, saved trades, execution links, grouping diagnostics,
  execution-feedback summaries, decision-review jobs, report snapshots, and
  route read-model metadata.
- Added `SqliteImportCommitRepository` while keeping `buildImportCommitPlan()`
  as the pure source of import commit truth.
- Added durable preview, commit, discard, import-batch detail, saved trades,
  latest analytics, latest coach, and latest review API routes.
- Wired `/import-dry-run` with a real Save Import action that previews,
  acknowledges required review gates, commits, and routes to the saved import
  summary.
- Added `/imports/[batchId]` and `/trades` pages, and updated `/trades/[tradeId]`,
  `/analytics`, `/coach`, `/review`, and `/imports` to prefer saved SQLite data
  with sample fallback only when no saved import exists.
- Persisted committed import reports and decision-review job diagnostics; open
  trades are saved but remain blocked from completed-trade coaching.
- Marked saved-data pages as dynamic so they render fresh SQLite state after a
  commit rather than stale sample fallback.
- Updated the broker mapping learning-console test expectation to match the
  hardened generic importer: side and quantity are now detected for the
  formerly weaker preset, while the unresolved symbol mapping still keeps the
  import review-gated.

Verification:

- `npx tsc --noEmit --pretty false` passed.
- Focused saved import Vitest passed: `11/11`.
- Broader importer/product Vitest passed: `37/37`.
- Full Vitest with slow-test timeout passed: `881/881`.
- `npm run build` passed; saved-data routes/pages are dynamic.
- Focused Playwright saved-import loop passed: `1/1`.
- Full import dry-run Playwright on `chromium-desktop` passed: `14/14`.

Next best step:

- Continue from the saved-import feature loop by tightening real-user edges:
  duplicate/import history UX, richer import-batch repair actions, persisted
  review completion state, and more broker fixture coverage for generic mapped
  CSVs. Auth, billing, and visual redesign remain intentionally out of scope.

## 2026-05-07 - Repair Actions And Persisted Review State

Extended the saved-import launch path so messy imports and trade-review work
can be tracked after the import is saved.

What changed:

- Added SQLite V2 persistence tables for saved trade notes, per-trade checklist
  item state, and import repair action events.
- Added repository methods to save notes, mark trades as in-progress, persist
  checklist item statuses, update import repair item state, and list repair
  action events.
- Added API routes:
  - `POST /api/trades/:tradeId/notes`
  - `POST /api/trades/:tradeId/review-items/:itemId`
  - `POST /api/import-batches/:batchId/repair-items/:repairItemId`
- Extended saved trade and import batch APIs to return persisted review/repair
  state.
- Added a trade-review action panel on `/trades/[tradeId]` for saving notes and
  marking checklist steps complete/to-do.
- Added an import repair action panel on `/imports/[batchId]` for resolving or
  dismissing repair items without mutating the original CSV.
- Hardened dynamic trade route lookups by decoding encoded trade IDs before
  SQLite lookup.
- Expanded tests for repair action persistence, trade notes, checklist state,
  and browser-level import-to-review persistence across reload.

Verification:

- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.
- Focused repair/review persistence Vitest passed: `6/6`.
- Broader importer/product Vitest passed: `39/39`.
- Full Vitest with slow-test timeout passed: `883/883`.
- Focused Playwright saved-import-to-review persistence flow passed: `1/1`.
- Full import dry-run Playwright on `chromium-desktop` passed: `14/14`.

Next best step:

- Continue launch hardening with duplicate/import-history UX and richer repair
  flows: show duplicate batches/trades clearly, let users reopen unresolved
  repair items from `/imports`, and add broker fixture coverage for partial
  exits, shorts/covers, open positions, and pre/post-market imports.

## 2026-05-07 - Duplicate Import History And Broker Fixture Coverage

Hardened the saved-import launch path so repeated import attempts are visible
and duplicate data does not silently overwrite prior history.

What changed:

- Import commit plans now create unique batch IDs for new previews instead of
  reusing the generic dry-run batch ID.
- Commit rebuilds preserve the stored preview batch ID, so preview/commit still
  validate the same import attempt.
- Encoded import batch route params are decoded before SQLite lookup across
  batch detail, commit, discard, and repair-item APIs.
- Added `listImportBatchHistory(...)` and `GET /api/import-batches` to expose
  durable history with duplicate-file, duplicate-trade, repair, blocker, review,
  saved-trade, and decision-review counts.
- Updated `/imports` into a real import-history dashboard with committed,
  needs-review, blocked, and duplicate summary counts plus row-level duplicate
  labels.
- Added generic CSV fixtures for:
  - short-sale plus buy-to-cover wording
  - adds and partial exits
  - premarket and postmarket/extended-hours trades
- Expanded tests for duplicate preview history, duplicate import API output,
  richer broker fixture parsing, and browser-level duplicate history display.

Verification:

- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.
- Focused duplicate/history/fixture Vitest passed: `23/23`.
- Broader importer/product Vitest passed: `40/40`.
- Full Vitest with slow-test timeout passed: `884/884`.
- Focused Playwright saved-import duplicate-history flow passed: `1/1`.
- Full import dry-run Playwright on `chromium-desktop` passed: `14/14`.

Next best step:

- Continue the same hardening lane by adding a true unresolved-repairs inbox on
  `/imports`, plus fixtures and tests for broker-specific IBKR/Webull/Moomoo
  partial fills, cancels, and multi-day open-to-close imports. After that, move
  into a coaching language quality pass over saved real/imported trades.

## 2026-05-07 - Unresolved Repairs Inbox And Synthetic Broker Fixtures

Added the next import-hardening slice after confirming that the user does not
currently have real Webull, Moomoo, or Schwab CSV exports available.

What changed:

- Added an unresolved repairs inbox to `/imports` that lists open repair items
  across non-discarded import batches with broker, row, severity, detail, and a
  direct link to the import batch.
- Extended `GET /api/import-batches` to return unresolved repair inbox items in
  addition to the durable batch history.
- Added `listUnresolvedImportRepairInbox(...)` to the SQLite repository.
- Added synthetic broker fixture presets for:
  - Webull partial fill plus cancelled order rows.
  - Moomoo split/partial fills.
  - Schwab mixed trade and non-trade account activity.
- Added matching synthetic CSV files under
  `src/docs/trade-execution-import-fixtures/` plus
  `broker-synthetic-fixture-sources.md` documenting that these are public-format
  inferred examples, not real user data.
- Expanded tests for unresolved repair inbox persistence/API/UI and synthetic
  broker fixture parsing.
- Increased the explicit timeout on the slow dry-run decision-review API route
  test to match the repo's known slow-test policy when the whole suite runs.

Verification:

- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.
- Focused repair inbox / broker fixture Vitest passed: `19/19`.
- Broader importer/product Vitest passed: `43/43`.
- Full Vitest with slow-test timeout passed: `887/887`.
- Full import dry-run Playwright on `chromium-desktop` passed: `14/14`.

Source notes for fixture shapes:

- Webull public help confirms order history can be exported as CSV; Webull API
  docs expose order fields such as order id, side, status, filled quantity,
  average filled price, and filled time.
- Schwab transaction export shapes were cross-checked against public exported
  transaction parser docs using `Date`, `Action`, `Symbol`, `Description`,
  `Quantity`, `Price`, `Fees & Comm`, and `Amount`.
- Moomoo public references confirm historical trade CSV download exists, but
  exact region-specific columns vary; the synthetic Moomoo fixture uses the
  conservative trade-history columns already supported by this app.

Next best step:

- Move into coaching-language quality over saved imported trades: evidence-backed
  copy, confidence wording, and no overclaiming when data is execution-only or
  market context is missing. Keep adding real anonymized broker misses as
  sanitized synthetic fixtures whenever a user import exposes a gap.

## 2026-05-07 - Coaching Language Quality Guardrails

Completed the coaching-language quality pass over saved/imported-trade coaching
copy.

What changed:

- Tightened coach home, archetype, confidence, session-prep, daily coach, and
  product evidence-card copy so coaching language names execution-only evidence,
  saved execution rows, replay confirmation, or review-prompt status.
- Kept market-context claims out of coach conclusions when the system only has
  execution data.
- Added/used coaching language quality and readiness audits to catch forbidden
  certainty phrases, missing evidence basis, unsupported market-context claims,
  empty strings, generic fallbacks, and duplicate copy.
- Fixed guardrail misses found by the new tests:
  - session repeat behavior now asks for replay confirmation
  - same-symbol cooldown language now references saved execution replays
  - import repair evidence now says it protects saved execution evidence

Verification:

- Focused coaching Vitest passed: `10/10`.
- Full trader-analytics Vitest passed: `200/200`.
- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.
- Full Vitest passed: `889/889`.
- Import dry-run Playwright initially had one tablet timeout under two-worker
  project concurrency; the exact failing tablet test passed on rerun.
- Import dry-run Playwright with one worker passed across desktop/tablet/mobile:
  `42/42`.

Next best step:

- Run private April CSV calibration now that the user confirmed the April file is
  available locally. Use it to compare saved-import aggregates, import repair
  issues, duplicate detection, session buckets, and coach/readiness language
  against real executions. Convert any private miss into a sanitized synthetic
  fixture before changing public tests.

## 2026-05-07 - Private April Saved-Import Calibration

Completed the saved-import calibration branch against the private IBKR April
Activity Statement CSV. The private CSV filename/path remains omitted from chat
and public docs.

What changed:

- Added `src/scripts/run-saved-import-calibration.ts`.
- Added `npm run calibrate:saved-import`.
- The script accepts `--csv` or `--csv-from-artifact`, runs the same
  `buildCsvDryRunImportExperience()` -> `buildImportCommitPlan()` ->
  `SqliteImportCommitRepository` path used by the UI, commits into a fresh
  calibration SQLite DB, builds saved analytics/coach/review outputs, runs
  coaching language readiness/quality audits, and writes private aggregate
  JSON/Markdown reports without storing raw CSV text.
- Updated `src/docs/trader-real-csv-calibration-guide.md` with the new saved
  import calibration command.
- Real-data calibration found one useful coaching-language miss: the daily coach
  fallback still said "Review the lowest-quality trade..." without naming replay
  or saved execution evidence.
- Fixed that fallback to "Replay the lowest-quality saved execution trade..."
  and tightened coach action/review-queue copy so rule simulation, review loop,
  and linked-trade actions name execution-only/replay evidence.
- Tightened the calibration audit so it requires evidence-basis wording on
  explanatory coaching text, not on short labels/titles or import-repair actions
  with no linked trade yet.
- Added a sanitized regression test so the daily coach fallback must stay tied
  to saved execution replay evidence when no specific mistake observation exists
  for the latest session.

Latest private aggregate result:

- rows parsed: `918`
- accepted executions: `574`
- skipped rows: `344`
- rejected rows: `0`
- grouped trades: `208`
- saved trades: `208`
- open positions saved: `2`
- queued decision-review jobs: `206`
- open-position blocked decision-review jobs: `2`
- duplicate second preview: duplicate file `true`, duplicate trades `208`
- coaching language readiness: `pass`, `0` warnings/failures
- coaching language quality audit: `pass`, `0` violations

Session/time calibration notes from the private aggregate:

- entry buckets: pre-market `99`, market open `52`, midday `33`,
  post-market `23`, overnight `1`
- held-through flags: premarket into open `19`, open into midday `11`,
  midday into postmarket `5`, postmarket into overnight `7`, held overnight `8`
- the strongest gross P/L bucket in this private month was midday; pre-market
  was the weakest by gross P/L

Verification:

- `npx tsc --noEmit --pretty false` passed.
- Focused coaching/product Vitest passed: `17/17`.
- Private saved-import calibration v4 passed with committed import and clean
  coaching audits.
- Full trader-analytics Vitest passed: `200/200`.
- `npm run build` passed.
- Full Vitest passed: `889/889`.
- Import dry-run Playwright with one worker passed across desktop/tablet/mobile:
  `42/42`.
- Focused coaching regression rerun passed: `11/11`.

Next best step:

- Move to the next feature-completion gap: persisted decision-review snapshot
  execution for queued closed trades when market context is available, so saved
  imports can populate `/review` with durable decision-review results rather
  than queued job diagnostics only.

## 2026-05-07 - Persisted Saved Decision-Review Snapshots Complete

Completed the next feature-completion gap for saved imports: committed trades now
run persisted decision-review jobs, store completed snapshots or diagnostics in
SQLite, and expose the saved review state through the app surfaces.

What changed:

- Added persisted `decision_review_snapshots` and
  `decision_review_diagnostics` tables with repository read/write methods.
- Added `runPersistedDecisionReviewJobs()` and
  `buildSavedDecisionReviewReadModel()` as server-only services.
- Import commit now attempts saved decision review after a successful commit and
  returns a `decisionReviewRun` summary.
- `/api/import-batches/:id`, `/api/review/latest`, and `/api/trades/:id` now
  expose saved review jobs, snapshots, and diagnostics.
- `/imports/:batchId`, `/review`, and `/trades/:tradeId` now surface persisted
  saved decision-review status to the end user.
- Kept SQLite/better-sqlite3 behind server-only imports so the production client
  bundle does not pull Node filesystem modules.
- Updated the saved-import calibration script so the private April saved-import
  run also executes persisted decision review and writes aggregate snapshot /
  diagnostic counts.

Latest private April aggregate result:

- rows parsed: `918`
- accepted executions: `574`
- skipped rows: `344`
- rejected rows: `0`
- grouped trades: `208`
- saved trades: `208`
- open positions saved: `2`
- decision-review jobs: `208`
- eligible closed-trade review jobs: `206`
- completed persisted review snapshots: `204`
- blocked open-trade diagnostics: `2`
- market-context-unavailable diagnostics: `2`
- analysis-failed diagnostics: `0`
- market context source for completed snapshots:
  `levels_system_daily_4h` for `204/204`
- coaching language readiness: `pass`, `0` warnings/failures
- coaching language quality audit: `pass`, `0` violations

Verification:

- `npx tsc --noEmit --pretty false` passed.
- Focused saved import / decision-review Vitest passed: `42/42`.
- `npm run build` passed.
- Import dry-run Playwright passed across desktop/tablet/mobile: `42/42`.
- Full Vitest passed: `892/892`.
- Private April saved-import calibration v5 committed successfully and produced
  persisted decision-review snapshots/diagnostics.

Next best step:

- Use the two market-context-unavailable April cases as the next calibration
  branch: inspect whether they are true missing-candle/warehouse gaps or symbol /
  session edge cases, then convert any app-side miss into a sanitized synthetic
  fixture. After that, the highest-value feature work is richer saved-review UI
  filtering/grouping by snapshot status and diagnostic type.

## 2026-05-08 - Saved Review Diagnostic Buckets And April Cleanup

Completed the calibration cleanup branch for the two remaining April
`market_context_unavailable` cases.

Findings:

- The two closed-trade diagnostics remain the known AVEX/ELMT class:
  insufficient daily/4h history under the historical no-future-leakage cutoff.
- This is not a generic app import bug, session-time bug, symbol-normalization
  miss, or trade-window 5m issue.
- The right product behavior is truthful degradation: keep execution/P&L review
  available where possible, but do not show support/resistance or daily/4h
  market-context conclusions for those trades.

What changed:

- Extended the saved decision-review read model with:
  - `statusCounts`
  - `diagnosticCodeCounts`
  - `diagnosticStatusCounts`
- Updated `/review` to separate completed snapshots, market-context gaps,
  open-trade blocks, queued jobs, skipped jobs, and other diagnostics.
- Updated `/imports/:batchId` to display decision-review job status buckets and
  diagnostic-code buckets before the latest diagnostic details.
- Added a sanitized regression test for the insufficient higher-timeframe
  history class using fake symbols, so the private AVEX/ELMT shape is covered
  without exposing private trade data.
- Updated the saved-import calibration report to write diagnostic-code and
  diagnostic-status counts.

Latest private April aggregate result:

- rows parsed: `918`
- accepted executions: `574`
- skipped rows: `344`
- rejected rows: `0`
- grouped trades: `208`
- saved trades: `208`
- decision-review jobs: `208`
- completed persisted review snapshots: `204`
- blocked open-trade diagnostics: `2`
- market-context-unavailable diagnostics: `2`
- analysis-failed diagnostics: `0`
- diagnostic buckets: `blocked_open_trade=2`,
  `market_context_unavailable=2`
- market context source for completed snapshots:
  `levels_system_daily_4h` for `204/204`
- coaching language readiness: `pass`, `0` warnings/failures
- coaching language quality audit: `pass`, `0` violations

Verification:

- `npx tsc --noEmit --pretty false` passed.
- Focused saved import / decision-review Vitest passed: `11/11`.
- `npm run build` passed.
- Import dry-run Playwright passed across desktop/tablet/mobile: `42/42`.
- Full Vitest passed: `893/893`.
- Private April saved-import calibration v6 committed successfully and preserved
  the expected `204` completed snapshots plus `4` truthful diagnostics.

Next best step:

- Move to saved-review workbench polish: add end-user filters or tabs for
  completed snapshots, market-context gaps, open-trade blocks, and review
  priority; then connect those filters to `/trades` and trade detail links so a
  user can work the saved-review queue rather than only read aggregate status.

## 2026-05-08 - Public Beta Landing Page

Added a public marketing homepage for Trader Intelligence while keeping the
internal app launcher available at `/workspace`.

What changed:

- Replaced `/` with a dark-blue public landing page for the Discord beta.
- Added SEO metadata for AI trade review, broker execution import, scanner
  alerts, chart levels, and support/resistance generation.
- Added a full-bleed animated market scene using canvas for scanner rows,
  chart movement, and support/resistance level lines.
- Added beta pricing copy: Discord beta at `$30.00 USD`; public website launch
  price will increase; beta testers keep the `$30.00` rate.
- Added feature sections for execution intelligence, scanner, chart levels,
  decision review, press-release feature set, SEO topic coverage, FAQ, and
  risk/non-advice copy.
- Moved the old internal route grid to `/workspace`.
- Updated browser smoke expectations that previously treated `/` as the app
  workspace route.

Verification:

- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.
- Playwright smoke against the production server verified the homepage title,
  primary heading, beta pricing copy, `/first-run`, and `/workspace` links.
- Screenshot artifact: `artifacts/landing-page-home-production.png`.

Next best step:

- Replace the placeholder Discord URL with the real invite link before sharing
  the landing page publicly, then add a narrow homepage visual/SEO regression
  test so future app work does not accidentally turn `/` back into an internal
  workspace.

## 2026-05-08 - TradersLink Platform Landing Reposition

Updated the public homepage from a Trader Intelligence-only beta page into a
TradersLink trading-tools beta page.

What changed:

- Reframed TradersLink as the parent platform for scanner alerts, Press
  Release App v2, SEC filing summaries, chart levels, and the coming Trader
  Intelligence system.
- Updated hero, pricing, FAQ, SEO metadata, and JSON-LD to describe the
  Discord beta and website rollout accurately.
- Kept Trader Intelligence positioned as an upcoming tool for beta members
  rather than the only product on the homepage.
- Updated homepage route smoke expectations to the new public heading.

Next best step:

- Replace the placeholder Discord URL with the real invite link before public
  sharing, then add/keep a focused homepage regression that verifies the
  platform copy for scanner alerts, press releases, SEC filings, beta pricing,
  and Trader Intelligence coming soon.

## 2026-05-08 - Landing Page Levels-System Copy Polish

Updated the TradersLink homepage to better describe the levels-system tool as a
real-time chart follower, not only static support/resistance generation.

What changed:

- Added copy for live trade-follow updates around level breaks, failing setups,
  dip areas, support/resistance, and candle-based chart context.
- Removed noisy ticker/status text from the animated hero background so labels
  like watch/risk/level break and sample tickers no longer sit behind the hero
  calls to action.
- Updated root and page metadata to mention chart-level tooling.

## 2026-05-08 - Landing Page AI Chart-Following Reword

Adjusted the public homepage so levels-system language does not imply live
human trade calls.

What changed:

- Removed the lower-left hero scanner/bar animation entirely so there is no
  clutter behind the primary hero buttons.
- Reworded levels-system copy around software/AI market-data intelligence:
  generated support/resistance is included, while AI chart following for level
  breaks, weakening setups, and possible dip areas is positioned as coming soon.
- Expanded beta card rows to show scanner alerts, PR/SEC AI summaries, generated
  chart levels, Trader Intelligence coming soon, and AI chart following coming
  soon.
- Added press-release trading-card copy for float size, market cap, short
  interest, generated levels, and AI summary context.

## 2026-05-08 - Vercel Landing-Only Deployment

Created a minimal landing-page-only Vercel project at `vercel-landing` and
deployed it separately from the full Trader Intelligence app.

What changed:

- Installed the Vercel coding-agent plugin for Codex user scope. The installer
  reported the current agent session must restart before the plugin tools load.
- Created `vercel-landing` with only the public homepage, animated hero canvas,
  root layout, Tailwind CSS, and minimal Next dependencies.
- Avoided deploying the full app routes, API routes, SQLite persistence, and
  local `levels-system` dependency to Vercel Hobby.
- Linked and deployed the Vercel project `vercel-landing`.

Live deployment:

- Production alias: `https://vercel-landing-gules.vercel.app`
- Deployment URL:
  `https://vercel-landing-8li1pzpy4-jeremylgk20-1197s-projects.vercel.app`

Verification:

- `npm run check` passed from `vercel-landing`.
- Remote Playwright smoke verified the title, homepage heading, Discord CTA
  target, new-tab behavior, and beta card copy.

Next best step:

- Add the user's purchased domain to the Vercel project with
  `vercel domains add <domain> vercel-landing`, then complete the DNS records
  shown by Vercel at the registrar.

## 2026-05-08 - TradersLink Domain Added To Vercel

Added the user's purchased Porkbun domain to the landing-only Vercel project.

What changed:

- Added `traderslink.pro` to the `vercel-landing` project.
- Added `www.traderslink.pro` to the `vercel-landing` project.
- Vercel reported the domain is not configured until Porkbun DNS points to
  Vercel.

DNS records Vercel requested at the current authoritative DNS provider
(`porkbun.com` nameservers):

- `A traderslink.pro 76.76.21.21`
- `A www.traderslink.pro 76.76.21.21`

Next best step:

- In Porkbun DNS, add/update the root `@` A record and `www` A record to
  `76.76.21.21`, remove conflicting root/www A/AAAA/CNAME records, then rerun
  `vercel domains inspect traderslink.pro` after propagation.

## 2026-05-08 - TradersLink Apex Domain Live

Configured the landing-only Vercel project to prefer the non-www domain.

What changed:

- Updated `vercel-landing/next.config.ts` with a permanent redirect from
  `www.traderslink.pro/:path*` to `https://traderslink.pro/:path*`.
- Updated root metadata base in both the main app and landing-only project to
  `https://traderslink.pro`.
- Redeployed the landing-only project to Vercel production.

Verification:

- `npm run check` passed in `vercel-landing`.
- `npx tsc --noEmit --pretty false` passed in the main app.
- Vercel production deployment was aliased to `https://traderslink.pro`.
- DNS resolved both `traderslink.pro` and `www.traderslink.pro` to
  `76.76.21.21`.
- `curl -I https://traderslink.pro` returned `200 OK`.
- `curl -I https://www.traderslink.pro` returned `308 Permanent Redirect` to
  `https://traderslink.pro/`.

## 2026-05-08 - Saved Review Queue Workbench

Returned to the app feature branch after the landing-page/domain work and added
the first saved-review workbench layer.

What changed:

- Added `buildSavedReviewQueueReadModel()` for saved decision-review jobs,
  snapshots, diagnostics, deterministic priority labels/reasons, queue filters,
  and trade-detail links.
- Added `/review` saved queue tabs for all, completed, market gaps, open blocks,
  analysis failed, highest priority, and unresolved review work.
- Connected `/trades` to the saved review queue by showing queue lane/priority
  for saved trades and linking users back into review work.
- Connected trade detail pages back to `/review?queue=...` when opened from the
  saved review queue.
- Extended `/api/review/latest` to return the saved review queue read model.
- Added a saved-data restart test so committed trades and queue items survive a
  repository reload.
- Added generic CSV hardening coverage for unusual headers, mixed timestamp
  formats, cost columns, and non-filled row skipping.
- Extended the import-to-saved-app Playwright flow to cover saved review queue
  visibility and queue-to-trade navigation without requiring IBKR or live market
  data.

Verification:

- `npx tsc --noEmit --pretty false` passed.
- Focused Vitest passed: `44/44` across SQLite import commit, saved import API,
  and broker CSV import tests.
- Focused Playwright import-to-saved-review flow passed across desktop, tablet,
  and mobile: `3/3`.
- `npm run build` passed.

Next best step:

- Continue without IBKR by polishing saved queue operations: add durable queue
  status actions such as mark reviewed/ignore/resolve directly from the queue,
  then add saved queue filters to `/trades` so users can narrow the trade list by
  the same review lane.

## 2026-05-08 - Saved Queue Actions And Trade Filters

Completed the next saved-review workbench step without IBKR or live market data.

What changed:

- Widened saved import trade review status to the shared `SavedReviewStatus`
  contract so statuses like `reviewed`, `resolved`, and `ignored` persist.
- Added `SqliteImportCommitRepository.setTradeReviewStatus()` and
  `POST /api/trades/:tradeId/review-status`.
- Added queue action buttons on `/review` for mark reviewed, resolve, and
  ignore.
- Updated saved review queue filtering so reviewed/resolved/ignored trades leave
  the highest-priority and unresolved queues while still appearing in all-items
  history.
- Added `/trades?reviewLane=...` filters that mirror saved review queue lanes and
  link back to the saved review queue.
- Kept trade-detail navigation back to `/review?queue=...` when opened from the
  saved queue.

Verification:

- `npx tsc --noEmit --pretty false` passed.
- Focused Vitest passed: `13/13` across SQLite import commit and saved import
  API route coverage.
- `npm run build` passed.
- Focused Playwright import-to-saved-review flow passed across desktop, tablet,
  and mobile: `3/3`.

Next best step:

- Add a compact queue summary strip to `/analytics` and `/coach` so the user can
  jump from performance/coaching pages directly into the highest-priority saved
  review work.

## 2026-05-08 - Analytics And Coach Review Queue Strip

Completed the compact saved-review queue strip for the saved-data app loop.

What changed:

- Added `SavedReviewQueueSummary`, a reusable strip that shows highest-priority,
  unresolved, market-gap, and open-block counts from the saved review queue.
- Wired `/analytics` to build the saved review queue from the same SQLite
  repository as the saved analytics report.
- Wired `/coach` to show the same saved review work summary above the coaching
  KPI sections.
- Added links from analytics/coach into `/review?queue=highest_priority` and
  `/trades?reviewLane=highest_priority`.
- Extended the import-to-saved-app Playwright flow to verify that saved imports
  light up the queue strip on both analytics and coach pages.

Verification:

- `npx tsc --noEmit --pretty false` passed.
- Focused Vitest passed: `saved-import-api-routes.test.ts` `4/4`.
- `npm run build` passed.
- Focused Playwright import-to-saved-app flow passed across desktop, tablet, and
  mobile: `3/3`.

Next best step:

- Continue toward launch readiness by adding an import history/detail action
  lane for unresolved repair items and duplicate imports, so a user can recover
  from a failed save attempt without relying on developer logs.

## 2026-05-08 - Import Recovery Lane

Completed the import recovery/history hardening step for failed, duplicate, and
ready-to-save import attempts.

What changed:

- Added `buildImportRecoveryReadModel()` to classify import batches as saved,
  ready to save, blocked by repairs, duplicate review, acknowledgement needed,
  discarded, or blocked.
- Added SQLite lookup helpers for committed batches by file fingerprint and
  saved trades by duplicate trade fingerprint.
- Added a recovery lane to `/imports/[batchId]` with clear counts, duplicate
  details, links to original imports/trades, save-from-stored-preview, discard
  preview, and repair-section navigation.
- Added an import recovery queue to `/imports` so active failed/duplicate/review
  attempts are visible without digging through history rows.
- Extended import batch APIs to return the recovery read model and history APIs
  to return the active recovery queue.
- Added tests for duplicate recovery linking, ready stored-preview commit, and
  blocked repair recovery state.

Verification:

- `npx tsc --noEmit --pretty false` passed.
- Focused Vitest passed: `saved-import-api-routes.test.ts` `5/5`.
- `npm run build` passed.
- Focused Playwright import recovery flow passed across desktop, tablet, and
  mobile: `6/6`.

Note:

- One Playwright run was started in parallel with `npm run build` and failed
  because `.next` was not finished yet. The rerun after the completed build
  passed.

Next best step:

- Continue with repair workflow hardening: let users carry repaired row values
  from the dry-run UI into a new preview/save attempt, and add more synthetic
  fixtures for ugly real-world broker exports.

## 2026-05-08 - Repair Carry-Forward Hardening

Completed the first repair workflow hardening step.

What changed:

- Added a `Repair Carry-Forward` panel to `/import-dry-run` that makes the save
  source explicit after row edits.
- The panel shows repair edit count, the last edited row/header, remaining
  rejected rows, accepted executions, and whether the current save source is the
  repaired CSV text.
- Kept the privacy posture intact: edits update the in-session CSV text used for
  preview/save, while raw CSV file text is not stored by default.
- Extended the repaired-row browser flow so a missing quantity is edited,
  preview status becomes ready, the repaired CSV is saved to SQLite, and the
  repaired trade appears in `/trades`.

Verification:

- `npx tsc --noEmit --pretty false` passed.
- Focused Vitest passed: `saved-import-api-routes.test.ts` `5/5`.
- `npm run build` passed.
- Focused Playwright repaired-row save flow passed across desktop, tablet, and
  mobile: `3/3`.

Note:

- The first Playwright run used the previous production build and failed to find
  the new panel. Rebuilt with `npm run build`; the rerun passed.

Next best step:

- Add a nastier broker CSV fixture matrix for repair/save hardening: mixed date
  formats, blank symbols, missing quantities, non-filled rows, fee columns,
  duplicate-like fills, shorts, partial exits, and open positions.

## 2026-05-08 - Broker CSV Repair/Save Fixture Matrix

Added a focused fixture matrix for messy broker CSV repair and save readiness.

What changed:

- Added `buildBrokerCsvRepairSaveFixtureMatrix()` and
  `runBrokerCsvRepairSaveFixtureMatrix()`.
- Covered mixed date formats, split fee columns, partial exits, missing symbols,
  missing quantities, non-filled skipped rows, short open positions, and
  duplicate-like fills.
- Each case runs through dry-run preview, repaired CSV text when applicable,
  commit planning, in-memory commit, and saved-trade assertions.
- Added tests proving blocked rows can become saved trades after repair, open
  short positions remain explicit review-gated cases, duplicate-like fills stay
  anomaly-visible, and skipped non-filled rows remain visible without becoming
  hard failures.

Verification:

- `npx tsc --noEmit --pretty false` passed.
- New focused Vitest passed:
  `broker-csv-repair-save-fixture-matrix.test.ts` `4/4`.
- Adjacent import/parser Vitest pack passed: buy/sell fixture matrix, import
  commit planner, saved import API routes, and broker execution CSV parser:
  `47/47`.
- `npm run build` passed. The first build run timed out at 3 minutes, so it was
  rerun with a longer timeout and completed successfully.

Next best step:

- Continue launch hardening with coaching language QA over saved/imported
  trades: check that execution-only, market-context-missing, open-position, and
  repair/duplicate cases use specific but conservative language.

## 2026-05-08 - Saved Import Coaching Language QA

Completed the saved/imported trade coaching language hardening lane.

What changed:

- Added `buildSavedImportCoachingLanguageQaMatrix()` and
  `runSavedImportCoachingLanguageQaMatrix()`.
- Covered clean closed saved executions, repaired import save-source language,
  duplicate-like fill review prompts, short execution review, open-position
  coaching blocks, missing market context, failed decision-review diagnostics,
  and levels-system market context.
- Extended the coaching language guardrail surface to export the quality audit
  types and to test saved/imported coaching as its own QA matrix.
- Added regression tests proving execution-only coaching cannot claim support
  held or setup failure without market context, and direct buy/sell advice is
  blocked even when market context exists.
- Kept open-trade and analysis-failed fallback wording explicit: saved open
  trades wait until flat before completed-trade coaching, and failed analysis
  routes to diagnostics with conservative execution-only language.

Verification:

- Focused Vitest passed: saved import coaching matrix, coaching language
  quality, coaching language readiness, and coaching fixture expectation matrix:
  `8/8`.
- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.

Next best step:

- Continue launch hardening with a broader saved-import regression pass:
  exercise import save, saved trades, analytics, coach, review queue, and repair
  carry-forward together in one end-to-end flow with the current SQLite read
  models.

## 2026-05-08 - Saved Import End-To-End Regression

Completed the broader saved-import regression pass for the current SQLite
read-model loop.

What changed:

- Extended the repaired-row browser flow so a missing-quantity CSV repair proves
  more than trade persistence.
- The repaired flow now verifies saved SQLite analytics, saved coach state,
  saved review queue state, analytics and coach summary strips, and the review
  queue route after Save Import.
- Added an API-level regression that commits a repaired CSV-style payload in an
  isolated temporary SQLite database and verifies saved trades, latest analytics,
  latest coach, and review queue next-action language for failed
  decision-review diagnostics.
- Adjusted browser assertions so responsive Playwright projects can run in
  parallel against the shared local demo DB without incorrectly assuming each
  project owns the global "latest" report.

Verification:

- Focused Vitest passed: saved import API routes and saved import coaching
  language QA matrix: `10/10`.
- Focused Playwright repaired-row flow passed across Chromium desktop, tablet,
  and mobile: `3/3`.
- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.

Next best step:

- Continue launch hardening with import-history/recovery ergonomics: make the
  user-facing imports page clearer for committed, duplicate, blocked-by-repair,
  and saved-from-repair cases, then add one route-level regression for those
  states.

## 2026-05-08 - Import History Recovery Ergonomics

Completed the import-history and recovery page hardening pass.

What changed:

- Updated `/imports` so recovery queue cards now show clearer user-facing
  state, specific next actions, duplicate-file explanation, fix-required repair
  counts, review counts, and ready-to-save previews.
- Updated import history rows to translate raw statuses into end-user labels:
  `Saved import`, `Saved after repair`, `Duplicate review`, `Repair required`,
  `Review before save`, and `Ready to save`.
- Added visible actions such as `Review saved trades`, `Open original import`,
  `Resolve repair rows`, `Review decisions`, and `Save import`.
- Kept raw status visible as secondary audit context without making it the main
  thing the user has to understand.
- Extended browser route regressions so committed imports, duplicate imports,
  blocked repair imports, and repaired-save imports all prove the `/imports`
  page is understandable after the import flow.

Verification:

- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.
- Focused Playwright import-history/recovery route checks passed across
  Chromium desktop, tablet, and mobile: `9/9`.

Next best step:

- Continue launch hardening with a full import-route visual and overflow pass:
  `/import-dry-run`, `/imports`, `/imports/[batchId]`, `/trades`,
  `/analytics`, `/coach`, and `/review` after a saved import, with screenshots
  retained for the currently most important routes.

## 2026-05-08 - Saved Import Visual Overflow Pass

Completed the full saved-import route visual and overflow pass.

What changed:

- Added `saved-import-visual-overflow.spec.ts`.
- The test seeds a real saved import through the import batch API, commits it,
  finds the saved trade, and then visits the key saved-data routes:
  `/import-dry-run`, `/imports`, `/imports/[batchId]`, `/trades`,
  `/trades/[tradeId]`, `/analytics`, `/coach`, and `/review`.
- Each route now gets page-health checks, broken-page phrase checks,
  horizontal overflow checks, core panel assertions, and viewport screenshots
  attached to the Playwright run.
- Covered the pass across Chromium desktop, tablet, and mobile.

Verification:

- Focused Playwright saved-import visual/overflow pass passed across Chromium
  desktop, tablet, and mobile: `3/3`.
- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.

Next best step:

- Continue with `/imports/[batchId]` detail-page polish: make the batch detail
  page match the clearer recovery language from `/imports`, especially around
  decision-review diagnostics, duplicate details, repair actions, and saved
  trade links.

## 2026-05-08 - Import Batch Detail Polish

Completed the `/imports/[batchId]` detail-page polish pass.

What changed:

- Added a user-facing import action summary to the batch detail page.
- Replaced raw-first status presentation with clearer labels like `Saved import`
  while keeping raw status visible as secondary audit context.
- Added saved-output links for committed imports: saved trades, analytics,
  coach, and highest-priority review queue.
- Reworked decision-review status copy into a diagnostics section that explains
  why analysis failures, unavailable market context, open trades, and skipped
  review jobs should stay conservative.
- Strengthened saved-trade rows with explicit `Open trade review` calls to
  action.
- Improved duplicate detail copy so duplicate matches are clearly treated as
  review blocks, not silent failures.
- Updated repair action copy to clarify that repaired row values should come
  from a repaired CSV preview before saving.
- Extended browser assertions for committed, duplicate, blocked-by-repair, and
  repaired-save batch detail states.

Verification:

- Focused Playwright import-flow route checks passed across Chromium desktop,
  tablet, and mobile: `9/9`.
- Saved-import visual/overflow pass passed across Chromium desktop, tablet, and
  mobile: `3/3`.
- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.

Next best step:

- Continue launch hardening with generic broker import edge-case expansion:
  add more fixture and UI coverage for odd headers, mixed timestamp formats,
  side aliases, repeated partial fills, zero/blank quantities, shorts, and open
  positions so the generic importer feels resilient beyond the known samples.

## 2026-05-08 - Generic Broker Import Edge-Case Expansion

Completed the generic broker CSV edge-case expansion pass.

What changed:

- Added product fixture coverage for generic CSVs with odd but realistic broker
  headers: `Ticker`, `Executed At`, `Action`, `Qty`, `Fill Price`,
  `Commission`, `Fees`, and `Net Amount`.
- Added generic side-alias coverage for `BOT` / `SLD` partial fills and
  `SELL SHORT` / `BUY TO COVER` closed short trades.
- Added repair-gated fixture coverage for zero and blank quantities, including
  the repaired-save path that turns the blocked preview into a valid closed
  trade.
- Extended the app feature regression browser flow so `/import-dry-run` now
  exercises odd headers, partial exits, cost visibility, short-side aliases,
  duplicate-like fills, and zero/blank quantity rejection states from the UI.

Verification:

- Focused Vitest fixture/parser coverage passed: `2` files, `36` tests.
- Focused Playwright import repair route passed on Chromium desktop: `1/1`.
- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.

Next best step:

- Continue launch hardening with saved-data confidence checks after generic
  import save: verify these generic edge-case imports persist correctly through
  `/api/import-batches/preview`, commit, `/api/trades`, analytics, coach, and
  review read models, then add a small saved-import fixture for one generic
  long and one generic short case.

## 2026-05-08 - Short Scope Parked For Current Beta

Clarified the product scope after reviewing short-position support.

Decision:

- Do not continue building full short-trader coaching right now.
- Keep existing short parsing/math tests as defensive coverage so the importer
  does not break when a broker CSV contains sell-short / buy-to-cover style
  executions.
- Do not market Trader Intelligence as a short-seller coaching product in the
  current beta.
- Keep current beta focus on long-side day-trade execution review, saved
  imports, analytics, coach, review queues, and generic broker import trust.

Docs updated:

- `docs/content/traderslink-seo-content-plan-starting-point.md`
- `src/docs/feature-completion-to-live-launch-plan-2026-05-07.md`
- `src/docs/import-and-coaching-audit-plan-2026-05-06.md`
- `src/docs/trader-feedback-capabilities.md`

Next best step:

- Continue with the long-focused saved import confidence pass: prove generic
  long imports persist through preview, commit, `/api/trades`, analytics,
  coach, and review read models. For any short import encountered in that work,
  keep output conservative and avoid short-specific coaching claims.

## 2026-05-08 - Long-Focused Saved Import Confidence Pass

Completed the saved-data confidence pass for the current long-side launch path.

What changed:

- Added an API/read-model regression for a broker-like generic long CSV with
  odd headers, mixed timestamp formats, `BOT` / `SLD` side aliases, partial
  exits, commissions, fees, and broker net amounts.
- The regression now proves the import can preview, commit, appear in
  `/api/trades`, update latest analytics, update latest coach state, and create
  saved review queue work.
- Changed the browser saved-import flow to use the same realistic generic
  long-side shape instead of the simple Date/Time/Buy/Sell sample.
- Tightened saved-import coaching language QA so short imports are described as
  limited defensive import support, not short-seller coaching.
- Added a saved short import guardrail proving saved read models do not produce
  short-seller coaching, short-squeeze alert, locate, or short-specific trade
  signal claims.

Verification:

- Focused Vitest passed: saved import API routes and saved import coaching
  language QA matrix: `13/13`.
- Focused Playwright saved generic import flow passed on Chromium desktop:
  `1/1`.
- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.

Next best step:

- Continue launch hardening with long-side coaching quality over saved imports:
  inspect the actual saved coach/read-model language for profitable partial
  exits, adverse adds, clean exits, open trades, and repaired imports, then add
  guardrails only where the copy is too generic or overconfident.

## 2026-05-08 - Long-Side Saved Coaching Quality Guardrails

Completed the long-side saved coaching quality pass for the current beta scope.

What changed:

- Added saved-import coaching language QA cases for long profitable partial
  exits, long adverse adds, and long clean full exits.
- Expanded the coaching language audit evidence patterns so approved copy can
  name partial exits, profitable reductions, adverse-price adds, prior average
  entry, returned-to-flat execution, and final exits without triggering false
  missing-evidence failures.
- Added API preview regressions proving saved long imports produce specific
  execution feedback for:
  - profitable partial exits,
  - clean full exits,
  - adverse adds after entry.
- Added a saved open-long import regression proving open positions can be saved
  only after acknowledgement and remain blocked from completed-trade coaching in
  the saved review queue.
- Kept the short-scope boundary intact: short imports remain defensive import
  support only, with no short-seller coaching claims.

Verification:

- Focused Vitest passed: saved import API routes and saved import coaching
  language QA matrix: `17/17`.
- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.

Next best step:

- Continue launch hardening with repaired-import coaching/read-model polish:
  make repaired saved imports visibly carry repaired-source caution through
  analytics, coach, review, and trade-detail surfaces, then add one browser
  regression only if the UI text changes.

## 2026-05-08 - Repaired Import Source Caution Surfaces

Completed the repaired-import read-model polish pass.

What changed:

- Added durable `repairSource` tracking to import commit plans, committed
  batches, saved trades, and saved-trade analytics conversion.
- The import dry-run save payload now marks edited CSV saves as `repaired_csv`
  and unedited saves as `original_csv`.
- Added a reusable repaired-import caution read model and UI card.
- Surfaced repaired-source caution through:
  - `/api/analytics/latest`,
  - `/api/coach/latest`,
  - `/api/review/latest`,
  - `/api/trades/[tradeId]`,
  - `/analytics`,
  - `/coach`,
  - `/review`,
  - `/trades/[tradeId]`.
- Repaired-source copy stays conservative: users are told to review repaired
  row values before trusting coaching evidence.

Verification:

- Focused Vitest passed: saved import API routes, import commit planner, and
  SQLite import commit repository: `28/28`.
- `npm run build` passed.
- Focused Playwright repaired-row save flow passed on Chromium desktop: `1/1`.
- `npx tsc --noEmit --pretty false` passed.

Next best step:

- Continue launch hardening with trade-detail/review-queue polish for real
  beta use: make the saved trade page and review queue clearer around analysis
  failed, market-context unavailable, open-trade blocked, and repaired-source
  states, then run the saved-route visual overflow checks again.

## 2026-05-08 - Saved Review Queue And Trade Detail State Polish

Completed the trade-detail and saved review queue state polish pass.

What changed:

- Added user-facing state labels, details, review-scope labels, and next actions
  to saved review queue items.
- `/review` now explains why a saved item is completed, blocked as an open
  trade, missing market context, analysis-failed, skipped, or queued instead of
  relying on raw lane/status text.
- `/trades/[tradeId]` now includes a feedback-scope panel that tells the user
  whether decision review is ready, open-trade blocked, market-context
  unavailable, analysis-failed, or execution-only.
- The trade-detail state copy explicitly avoids treating market-context
  conclusions as available when decision review failed.
- Repaired-source caution remains visible on the same trade-detail page.

Verification:

- Focused Vitest passed: saved import API routes and SQLite import commit
  repository: `21/21`.
- `npm run build` passed.
- Focused Playwright repaired-row save flow passed on Chromium desktop: `1/1`.
- `npx tsc --noEmit --pretty false` passed.

Next best step:

- Run the saved-route visual overflow pass again across desktop, tablet, and
  mobile now that review/trade detail copy changed.

## 2026-05-08 - Saved Route Responsive Verification Pass

Completed the non-SEO verification pass after the saved review queue and trade
detail state-copy changes.

What changed:

- No product or SEO content was generated in this pass.
- No UI code changes were needed: the saved-route visual/overflow regression
  stayed clean across desktop, tablet, and mobile.
- Confirmed the repaired-source caution and feedback-scope surfaces still fit
  inside the saved import workflow pages after the latest copy updates.

Verification:

- Saved-route visual overflow Playwright pass completed across
  `chromium-desktop`, `chromium-tablet`, and `chromium-mobile`: `3/3`.
- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.

Next best step:

- Continue non-SEO launch hardening by reviewing the import/trade-management
  user path for any remaining confusing beta-state copy or missing defensive
  affordances before switching back to website/SEO work.

## 2026-05-08 - Non-Auth Launch Readiness Hardening Pass

Completed the requested non-SEO launch-readiness pass with auth intentionally
deferred for controlled testing.

What changed:

- Replaced the misleading saved-mode `authenticated_persistent` label with
  `local_sqlite_single_user` storage for current saved-import beta flows.
- Updated storage readiness copy so local SQLite is treated as useful
  single-user beta persistence, not production tenant-safe storage.
- Tightened coach/review copy so saved-import coaching actions name saved
  execution or replay evidence instead of generic action language.
- Expanded the saved-import calibration output to include quality-violation
  text when a copy audit fails.
- Updated browser hardening specs for the current public homepage plus internal
  `/workspace` split and for saved-trade list/detail behavior after imports
  replace the old sample trade route.
- Documented the current controlled-beta storage boundary in the production
  safety checklist.

Verification:

- Full Vitest passed: `104` files, `914` tests.
- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.
- Saved import calibration passed on `generic-execution-sample.csv`:
  preview `ready_to_commit`, commit `committed`, duplicate re-import
  `needs_user_review`, coaching readiness `pass`, coaching quality audit
  `true`, quality violations `0`.
- First-user hardening Playwright passed on Chromium desktop: `7/7`, with the
  Firefox-only smoke skipped under the desktop project.
- App feature regression Playwright passed on Chromium desktop: `12/12`, with
  the mobile-only route overflow test skipped under the desktop project.
- Saved-route responsive visual/overflow Playwright passed across desktop,
  tablet, and mobile: `3/3`.

Launch read:

- Ready for controlled single-user or trusted closed-beta testing without auth,
  as long as real multi-user/customer data is not mixed in the same environment.
- Not ready for broad paid public launch until auth, account isolation,
  authorization, backup/migration, and deletion controls are added.

Next best step:

- If staying non-SEO, run a hosted-environment smoke test after deployment using
  one clean test CSV and one repaired-row CSV, then capture any deploy-only env
  or persistence issues before inviting testers.

## 2026-05-08 - Local Browser Smoke And Deployment Target Check

Opened the current local app in the user's browser at `http://localhost:3000`
before continuing the non-SEO readiness path.

What changed:

- No SEO content was generated in this pass.
- No product code changes were needed.
- Confirmed the local dev app is reachable in the user's browser.
- Checked Vercel linkage before deploying. The repo does not have
  `.vercel/project.json`, and the discovered Vercel account currently exposes
  only the `vercel-landing` project. Treat deployment as blocked until the
  Trader Intelligence app is linked to the correct Vercel project or a new
  preview project is intentionally created.

Verification:

- Local route smoke on `localhost:3000` returned `200 OK` for `/`,
  `/workspace`, `/trades`, `/import-dry-run`, and `/platform-readiness`.
- Focused production-mode Playwright smoke passed on Chromium desktop:
  `20` passed, `2` skipped for project-specific mobile/Firefox coverage.

Launch read:

- Still acceptable for controlled local/single-user testing without auth.
- Do not invite unrelated users or import unrelated customer data into the same
  environment until auth/account isolation exists.

Next best step:

- Link the app to the intended Vercel project, then run the hosted smoke test
  against that preview URL with one clean CSV and one repaired-row CSV.

## 2026-05-08 - Handoff Clarification For App Vs Landing Page

Updated the fresh-chat handoff after the user clarified that the root homepage
at `/` is only a temporary landing page and should not be treated as the actual
Trader Intelligence app dashboard.

What changed:

- Updated `src/docs/trader-intelligence-next-chat-handoff-2026-05-06.md` with a
  May 8 resume update.
- Recorded that local app review should open `/workspace`, not `/`.
- Recorded that nothing has been uploaded to Vercel in the latest pass.
- Recorded that the only discovered Vercel project is `vercel-landing`, which
  is the landing-page-only project and must not receive the full app by
  accident.
- Reconfirmed that auth is deferred only for controlled local/single-user or
  trusted closed-beta testing.
- Reconfirmed that Trader Intelligence should not be marketed as short-seller
  coaching yet.

Verification:

- Docs-only update; no code or test run needed.

Next best step:

- Keep deployment paused. Continue local app review from `/workspace`. If the
  user later asks to deploy the full app, first link/create the intended Trader
  Intelligence Vercel project, then run the hosted smoke test with one clean CSV
  and one repaired-row CSV.

## 2026-05-08 - App Familiarization And QC Pass

Started a product-quality pass over the current app surface after the user asked
for feature completeness, improvement, and quality-control review.

What was inspected:

- current handoff and project log
- behavior coverage audit and Layer 2 pattern catalog
- Next 16 local docs for App Router pages, route handlers, and
  server/client components before touching app code
- route map under `app/`
- product/e2e coverage for import, saved trades, analytics, coach, review,
  progress, mobile overflow, accessibility smoke, and truthfulness boundaries
- live local app routes at `localhost:3000`, starting from `/workspace`

QC finding fixed:

- Internal pages labeled `Back to workspace` were linking to `/`, but `/` is
  the temporary public landing page. Updated those links to `/workspace` across
  the internal app pages and added the missing workspace return link on
  `/analytics`.

Important QC finding still open:

- Saved analytics/coach/review displayed one saved-trade diagnostic:
  `analysis failed: Cannot find module as expression is too dynamic`. Focused
  saved-import unit/API tests still pass, so this looks like a runtime/server
  bundling or local saved-data replay issue around the levels-system decision
  review path. This should be investigated before trusting the saved
  decision-review loop for beta users.

Current product read:

- The app has broad feature coverage for import dry-run, row repair, saved
  imports, saved trades, analytics, coach, review queue, progress, import
  recovery, and readiness/status surfaces.
- The main beta gap is not basic route existence; it is product coherence,
  persistence safety, and reducing fixture/prototype/admin surfaces before a
  tester uses it.
- The workspace is currently an internal launcher, not a polished persistent app
  shell.

Verification:

- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.
- Focused Playwright route regression passed:
  `npx playwright test tests/e2e/app-feature-regression.spec.ts -g "loads the main end-user routes" --project=chromium-desktop`.

Next best step:

- Investigate and fix the saved decision-review runtime diagnostic, then
  continue QC by pruning or gating non-user-facing routes from the beta
  workspace and tightening the first-user navigation flow.

## 2026-05-08 - Workspace Split Into End-User App And Admin Tools

Separated the mixed route launcher into clearer end-user and internal-tool
surfaces.

What changed:

- Reworked `/workspace` into a trader-facing app dashboard centered on:
  import trades, saved trades, coach, analytics, guided review, progress,
  session recap, comparison, onboarding, first-run setup, import history, and
  account/storage state.
- Added `/workspace/admin` as the internal backend/webmaster/QA control room for
  import trials, import health, repair wizard, review cockpit, calibration,
  platform readiness, broker mapping admin, and debug consoles.
- Kept the underlying internal routes available, but removed them from the main
  trader workflow so the end-user side can be polished without admin/debug
  clutter.

Product read:

- This is the right structural direction before deeper UI polish: the app can
  now be evaluated as a trader workflow instead of as one giant internal
  dashboard.
- Next end-user polish should focus on the primary loop:
  `/workspace -> /import-dry-run -> /imports -> /trades -> /coach or /review ->
  /progress`.

Verification:

- Browser render check passed for `/workspace` and `/workspace/admin` with no
  page-level horizontal overflow at desktop.
- `npx tsc --noEmit --pretty false` passed.
- Focused workspace crawler passed:
  `npx playwright test tests/e2e/app-first-user-hardening.spec.ts -g "crawls workspace internal links" --project=chromium-desktop`.
- Focused demo user path passed:
  `npx playwright test tests/e2e/app-feature-regression.spec.ts -g "completes the demo user path" --project=chromium-desktop`.
- `npm run build` passed.

Next best step:

- Fix the saved decision-review runtime diagnostic, then continue dialing in the
  end-user app by making `/workspace` feel like a real dashboard with status,
  recent import/review state, and fewer static cards.

## 2026-05-08 - Saved Decision Review Runtime Fix And Live Workspace State

Fixed the production saved-decision-review runtime failure found during the QC
pass and upgraded `/workspace` from a static route menu into a stateful
end-user dashboard.

What changed:

- Replaced the Turbopack-sensitive runtime-composed `levels-system` loaders in
  the saved decision-review analysis path with native dynamic imports marked to
  stay runtime-only.
- Added `levels-system-phase1` to `serverExternalPackages` in `next.config.ts`
  so the sibling file dependency remains server-external.
- New production saved imports no longer fail with:
  `Cannot find module as expression is too dynamic` or `require is not defined`.
- Classified saved decision-review candle/warehouse misses as
  `market_context_unavailable` instead of generic `analysis_failed`, keeping
  user-facing review copy execution-only and truthful when market context is
  missing.
- Updated saved-import API expectations for the market-context-unavailable lane.
- Made `/workspace` dynamic and added live state cards:
  data source, saved trade count, review queue count, context gaps, next best
  action, and latest import.
- Kept the primary import entry labeled `CSV Dry Run` so the first-user/demo
  path remains clear.

Verification:

- Focused Vitest passed:
  `src/lib/trade-analysis/__tests__/classify-trade-analysis-failure.test.ts`
  and `src/lib/trader-analytics/__tests__/saved-import-api-routes.test.ts`.
- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.
- Production-mode saved import browser flow passed:
  `npx playwright test tests/e2e/import-dry-run.spec.ts -g "saves a generic CSV import" --project=chromium-desktop`.
- Production-mode demo user path passed:
  `npx playwright test tests/e2e/app-feature-regression.spec.ts -g "completes the demo user path" --project=chromium-desktop`.
- Workspace link crawler passed:
  `npx playwright test tests/e2e/app-first-user-hardening.spec.ts -g "crawls workspace internal links" --project=chromium-desktop`.

Next best step:

- Continue end-user polishing from the now-stateful `/workspace`: tighten the
  first-run/import path, add clearer empty/saved states around market-context
  gaps, and decide which admin/readiness links should be hidden entirely for a
  closed-beta tester.

## 2026-05-08 - Closed-Beta Workspace Focus Pass

Tightened the split between the end-user Trader Intelligence app and the
internal/admin surfaces.

What changed:

- Removed account/readiness/admin cards from the main `/workspace` user grid.
- Kept `/workspace/admin` as the home for platform readiness, account/plan
  status, broker mapping admin, calibration, import QA, and debug consoles.
- Left only a small `Internal tools` escape hatch in the beta boundary panel,
  instead of presenting admin tools as a primary user action.
- Updated `/first-run` so it points a closed-beta user toward one clean saved
  import, with clearer copy around what unlocks after that import and why
  market context can be backfilled later.
- Preserved the `CSV Dry Run` wording on the primary import card so the
  existing demo/first-user path remains obvious.

Verification:

- Browser route check confirmed `/workspace` no longer links to `/account` or
  `/platform-readiness`, while `/workspace/admin` does.
- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.
- First-user Playwright flow passed:
  `npx playwright test tests/e2e/app-first-user-hardening.spec.ts -g "guides a first user" --project=chromium-desktop`.
- Demo user path passed:
  `npx playwright test tests/e2e/app-feature-regression.spec.ts -g "completes the demo user path" --project=chromium-desktop`.
- Workspace crawler passed:
  `npx playwright test tests/e2e/app-first-user-hardening.spec.ts -g "crawls workspace internal links" --project=chromium-desktop`.

Next best step:

- Continue dialing in end-user surfaces in order of user value:
  `/import-dry-run`, `/imports`, `/trades`, then `/coach` and `/review`.
  The next concrete pass should reduce import-screen density and make the
  save/review transition feel like one guided workflow rather than a tool panel.

## 2026-05-08 - Guided Import Workflow Polish

Turned the import path into a clearer end-user flow across the existing
implementation.

What changed:

- Added a shared import workflow strip for:
  `/import-dry-run`, `/imports`, `/imports/[batchId]`, and `/trades`.
- The strip frames the path as:
  upload executions -> save or repair -> review saved trades.
- Committed import batch pages now show the review step as current, making the
  saved-output links feel like the intended next action instead of an admin
  artifact.
- Saved trades now explains whether the user is in the imported-data review
  loop or still seeing sample fallback.
- Added Playwright assertions so the workflow strip is protected on the dry-run,
  committed batch, import history, and saved trades parts of the flow.

Verification:

- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.
- Focused Playwright import flow passed:
  `npx playwright test tests/e2e/import-dry-run.spec.ts -g "renders the required|saves a generic" --project=chromium-desktop`.

Next best step:

- Continue end-user polish on `/trades` and `/review`: make the saved trade list
  less table-like, surface the highest-priority review item more directly, and
  keep admin/diagnostic detail one click away from the normal trader workflow.

## 2026-05-08 - End-User Import Review Workflow Completion Pass

Completed the requested 1-8 workflow polish bundle around the import-to-review
path.

What changed:

- Added a saved-trades triage panel on `/trades` that surfaces the next
  highest-priority saved trade, lane counts, and direct review actions.
- Converted the saved-trade list from a dense table into scan-friendly trade
  cards with P/L, review scope, source, and lane state.
- Added a review continuation panel on `/review` so the page starts with the
  active review item, lane counts, and next action.
- Tightened `/imports/[batchId]` after a committed import with one primary
  handoff CTA: review the first saved trade or open the highest-priority queue.
- Improved empty/sample states so `/trades`, `/review`, `/coach`, and
  `/analytics` direct the user back to one clean CSV import before real saved
  review data exists.
- Reworded market-context gaps so the app says execution review is available
  now while market-context coaching waits for candle/level backfill.
- Demoted raw diagnostic/status detail on normal user pages behind technical
  review-limit disclosure, while keeping admin/import detail available.
- Added browser coverage for the guided end-user route crawl:
  `/workspace -> /import-dry-run -> /imports -> /trades -> /review -> /coach ->
  /analytics`.
- Expanded import E2E assertions to protect the committed-import handoff,
  saved-trades triage panel, review continuation panel, and market-context gap
  copy.

Verification:

- Focused Vitest passed:
  `npx vitest run src/lib/trader-analytics/__tests__/saved-import-api-routes.test.ts src/lib/trader-analytics/__tests__/sqlite-import-commit-repository.test.ts src/lib/trader-analytics/__tests__/saved-import-coaching-language-qa-matrix.test.ts --reporter=dot`.
- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.
- Focused import Playwright passed:
  `npx playwright test tests/e2e/import-dry-run.spec.ts -g "saves a generic|repairs a missing-quantity" --project=chromium-desktop`.
- Guided route crawl passed:
  `npx playwright test tests/e2e/app-feature-regression.spec.ts -g "walks the guided end-user path" --project=chromium-desktop`.

Next best step:

- Continue with visual/responsive QA for the updated `/trades` and `/review`
  layouts across desktop, tablet, and mobile, then polish the individual trade
  detail page if the new triage flow exposes any rough spots.

## 2026-05-08 - Analytics UI Clarity And Chart Presentation Pass

Started the broader UI/user-friendliness correction after the user called out
that the app still felt random, hard for a newer trader to understand, and weak
on analytics presentation.

What changed:

- Added a new trader-facing analytics overview at the top of `/analytics`.
- The overview now leads with:
  - gross result,
  - win rate,
  - best trade,
  - worst trade,
  - next review action,
  - biggest risk,
  - best strength.
- Restored visible chart-style presentation using the existing analytics chart
  data:
  - win/loss mix,
  - entry-session P/L,
  - gross P/L by trade,
  - entry-hour P/L,
  - key execution risk rates.
- Moved technical/internal-feeling analytics panels into an
  `Advanced setup and import diagnostics` disclosure so the main flow starts
  with trader-usable information instead of readiness/import QA details.
- Reordered the main analytics page so the user sees:
  overview -> time-of-day -> weekly review/market context -> coaching and
  improvement panels -> detailed filters/tables.
- Added Playwright assertions that require the new overview and chart cards to
  remain visible.

Verification:

- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.
- Focused analytics Playwright passed:
  `npx playwright test tests/e2e/app-feature-regression.spec.ts -g "shows the analytics product intelligence surfaces" --project=chromium-desktop`.
- Core desktop visual smoke passed:
  `npx playwright test tests/e2e/app-feature-regression.spec.ts -g "captures visual smoke screenshots" --project=chromium-desktop`.
- Core mobile overflow pass passed:
  `npx playwright test tests/e2e/app-feature-regression.spec.ts -g "keeps core mobile routes usable" --project=chromium-mobile`.

Next best step:

- Continue the same UI correction pass on `/coach`, `/review`, and
  `/trades/[tradeId]`: simplify the language, make the main action obvious, and
  keep advanced/internal details behind disclosure or admin surfaces.

## 2026-05-08 - Core App UI/User-Friendliness Correction Pass

Continued the one-run UI correction across the actual Trader Intelligence app
after the user clarified that the priority was not SEO, but making the product
flow clearer for a newer trader.

What changed:

- Added shared trader-facing presentation primitives in `app/app-ui.tsx`:
  primary action panels, metric cards, simple bar/mix charts, advanced
  disclosures, and plain state badges.
- Reworked `/workspace` into a product home with the explicit flow:
  import trades -> review next trade -> check analytics -> open coach.
- Reworked `/trades` around:
  review priority trade, all saved trades, needs chart context, open trades,
  simplified filters, and plain saved/sample data language.
- Rebuilt the top of `/review` as a work queue with a "Review This First"
  primary action, clearer lanes, and explicit "Open Trade Review" actions.
- Rebuilt the top of `/coach` as a plain review plan:
  "Do This Next", "Avoid This Next Session", "Repeat This", and
  "Review This Trade", backed by saved trade evidence and session timing.
- Reworked `/trades/[tradeId]` into a review workspace with:
  what happened, what to review, what to write down, what is unavailable,
  checklist progress, clearer execution replay labels, and renamed review
  sections.
- Finished the analytics language cleanup by using shared chart cards and
  renaming trader-facing sections:
  "Chart Context Status", "Find Trades Behind A Number", "Trades Matching
  Filters", and "Execution Habits To Review".
- Renamed user-facing import copy from "CSV Dry Run" to "Import Trades" and
  removed/demoted raw-feeling labels such as saved sqlite, sample fallback,
  market gaps, open blocks, analysis failed, and diagnostic buckets from the
  primary user flow.
- Updated regression and copy-safety coverage so core product routes protect
  the new flow, analytics charts, coach primary action, review queue language,
  mobile overflow, and banned product claims.

Verification:

- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.
- Full desktop feature regression passed:
  `npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-desktop`.
- Core mobile overflow passed:
  `npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-mobile -g "keeps core mobile routes usable"`.
- Import/save/trade-detail focused Playwright passed:
  `npx playwright test tests/e2e/import-dry-run.spec.ts --project=chromium-desktop -g "saves a generic CSV import|shows unavailable daily/4h market context|repairs a missing-quantity"`.
- Focused route/model contract Vitest passed:
  `npx vitest run src/lib/trader-analytics/__tests__/saved-import-api-routes.test.ts src/lib/trader-analytics/__tests__/trader-import-trial-experience.test.ts --reporter=dot`.

Next best step:

- Do a visual tuning pass with screenshots open side-by-side for `/analytics`,
  `/coach`, `/review`, `/trades`, and `/trades/[tradeId]`; tighten spacing,
  reduce overlong metric-card values, and decide whether any remaining advanced
  sections should move fully under `/workspace/admin`.

## 2026-05-08 - User-Facing Review Summary And Mock Single-Trade UI

Continued the Trader Intelligence UX work from the new-user QC roadmap added on
GitHub. The focus shifted from dashboards to the product translation layer:
turning coaching/scoring output into a beginner-safe trade review summary.

What changed:

- Added `UserFacingTradeReviewSummary` under
  `src/lib/user-facing-review/types/`.
- Added `buildUserFacingTradeReviewSummary` under
  `src/lib/user-facing-review/mappers/` so the UI can consume product-ready
  summaries instead of raw engine internals.
- Added mapper tests covering chase entry, strength-first profit protection,
  mixed/moderate-confidence review, and needs-more-data review.
- Added `/trader-intelligence` as a mock single-trade review surface with eight
  representative cases from the roadmap.
- Added a homepage link to preview Trader Intelligence.
- Tightened `MetricCard` wrapping and reduced overlong first-viewport metric
  values on `/coach` and `/trades/[tradeId]`.
- Added Playwright coverage for beginner-safe Trader Intelligence mock reviews
  and included `/trader-intelligence` in core route/mobile/visual smoke checks.
- Added
  `src/docs/trader-intelligence-user-facing-review-summary-implementation.md`
  to document the new contract, route, UX rules, verification, and next step.

Verification:

- `npx tsc --noEmit --pretty false` passed.
- `npx vitest run src/lib/user-facing-review/__tests__/build-user-facing-trade-review-summary.test.ts --reporter=dot` passed.
- `npm run build` passed.
- Focused desktop Playwright passed:
  `npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-desktop -g "beginner-safe Trader Intelligence|captures visual smoke screenshots"`.
- Core mobile overflow Playwright passed:
  `npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-mobile -g "keeps core mobile routes usable"`.
- Desktop/mobile screenshots were captured under
  `artifacts/visual-qc/2026-05-08-user-facing-review-final/` for
  `/trader-intelligence`, `/coach`, and `/trades/[tradeId]`.

Next best step:

- Wire `UserFacingTradeReviewSummary` to real saved trade review data once the
  mock single-trade review surface feels right.
