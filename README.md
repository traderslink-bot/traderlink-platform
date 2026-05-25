# TradersLink Website Source Of Truth

This is the permanent local source-of-truth repo for the full traderslink.pro
website/app.

Local path:

`C:\Users\jerac\Documents\TraderLink\traderslink.pro`

Current production-aligned branch:

`codex/news-on-live-academy`

Remote:

`git@github.com:traderslink-bot/traderslink-trader-improvement-system.git`

Vercel project:

`vercel-landing` (`prj_TFzKcdj4dS6BHv2maWsy7M5AEv2a`)

Do not deploy from sibling folders such as `website`, `trader-intelligence-v2`,
`trader-intelligence-v2-svg-qa`, or `deploy-candidates/*` unless they are first
reconciled against this repo and current Vercel production.

---

# Trader Improvement System

Trader Improvement System is a layered trade-analysis project that turns raw
executions and candle data into structured trader feedback.

The current system focuses on:
- Layer 1 raw timeline and structural fact building
- Layer 2 pattern detection
- Layer 3 pattern normalization and prioritization
- support/resistance-aware trade analysis

## Current Status

The repo already supports:
- trade reconstruction from normalized executions and candles
- entry, management, scaling, recovery, and exit pattern detection
- support/resistance-aware entry, breakout, add, and exit signals
- normalized primary/supporting/contextual trade-story outputs

Preferred app-facing single-trade entry point:

```ts
import { runTradeAnalysis } from "@/src/lib/trade-analysis/run-trade-analysis";
```

`runTradeAnalysis(...)` defaults to the shared `levels-system` support/resistance
engine. The older local support/resistance path remains available only as an
explicit migration fallback.

The shared path also carries `experimentalMarketStructure` from
`levels-system`. That field is observational/debug-only for now: it is not part
of PatternInput and must not affect grading, scoring, or final user-facing
conclusions until it is calibrated on real saved data.

For trade requests that do not already have candles, use:

```ts
import {
  runTradeAnalysisFromLevelsSystemCandles,
} from "@/src/lib/trade-analysis/run-trade-analysis";
```

That path asks `levels-system` for the pre-trade / during-trade / post-trade
candle package before running this app's normal analysis pipeline.

For future user-entered trades, validate through the app-facing request
contract first:

```ts
import {
  validateTradeAnalysisRequest,
  toLevelsSystemCandleTradeRequest,
} from "@/src/lib/trade-analysis/request/trade-analysis-request-contract";
```

That contract validates symbol, direction, session date, executions, provider
options, and trade-window options before the request reaches the shared engine.
It does not fetch candles or read chart structure.

For broker CSV execution imports, use:

```ts
import { parseBrokerExecutionCsv } from "@/src/lib/execution-sources/csv";
import { previewBrokerExecutionCsvImport } from "@/src/lib/trader-analytics";
```

The CSV import lane is execution-only. It currently supports IBKR activity /
Flex-style trade CSVs, Webull order history, Robinhood transaction history,
Moomoo trade history, Schwab transactions, and a generic execution CSV mapper.
Parsed rows become `ProviderExecution` and `UserTradeAnalysisRequest` objects;
the import source does not become the candle provider. Import results include
diagnostics, file fingerprints, and trade request fingerprints for in-app
reconciliation and duplicate detection. CSV imports can accept an account
timezone for broker-local timestamps, capture optional fees/commissions, and
reject options rows by default until options analytics are intentionally
supported. The preview wrapper also returns product diagnostics for import
repair items, summary cards, net P/L preview, mapping confidence, and grouping
review diagnostics. It also supports explicit column mappings for unknown CSV
headers, optional trade grouping safety rules, broker/app P/L reconciliation,
options quarantine, an import commit plan, and an import review dashboard
contract. See
[src/docs/end-user-execution-import-and-storage-plan.md](src/docs/end-user-execution-import-and-storage-plan.md)
for the active import plan and
[src/docs/end-user-database-schema-plan.md](src/docs/end-user-database-schema-plan.md)
for the storage schema contract.

For execution-only trader feedback, use:

```ts
import { runExecutionFeedback } from "@/src/lib/execution-feedback";
```

That lane validates the same request shape, then analyzes only executions:
timestamps, side, shares, price, position lifecycle, adds, reductions, exits,
gross realized P/L, and sizing behavior. It does not call `levels-system`, fetch
candles, read support/resistance, use VWAP/EMA, or consume market structure.
Full trade-analysis summaries include this execution feedback as a separate
`executionFeedback` section so market context can enrich the trade review
without rewriting execution facts.

For trader-level analytics reports across many trades, use:

```ts
import { runTraderAnalyticsReport } from "@/src/lib/trader-analytics";
```

That lane aggregates `execution_feedback_summary_v1` into
`trader_analytics_report_v1`, including gross P/L, lifecycle metrics, execution
behavior rates, risk/strength counts, primary focus counts, chart data, trade
rows, warnings, and limitations. It is execution-only in v1 and does not call
`levels-system` or candle providers.

The product-facing trader improvement layer also exposes a coach action loop
through the product view model and `/coach`. That screen gives the end user one
next action, rule focus, session prep, review completion status, mistake
severity ladder, similar-trade context, confidence-aware wording, and empty-state
guidance without adding export/download controls.

The product polish layer adds trust and import-readiness outputs through the
same product view model and `/session-recap`: evidence cards, grade
explainability, first-import guidance, repair inbox, personal pattern memory,
rule candidate lab, confidence calibration, execution quality trendline, and a
prioritized coach review queue.

The review habit loop extends that into product behavior through
`reviewHabitLoop`, `/compare-trades`, and `/onboarding`: mistake-to-rule draft
conversion, per-trade review checklists, behavior-change tracking, user-facing
data quality score, playbook drafts, review habit metrics, and safety-copy
auditing.

The import trial and repair experience adds synthetic broker fixture regression
coverage through `importTrialExperience`, `/import-trials`, `/repair-wizard`,
`/review-cockpit`, and `/calibration`. It uses representative fixture CSVs to
exercise import parsing, guided repair, review priorities, rule lifecycle
simulation, mobile QA, and calibration readiness without requiring real user
broker files. These fixtures are compatibility tests only; they are not real
customer data and do not change the rule that candles, support/resistance, and
market structure belong to `levels-system`.

The rough CSV dry-run UI at `/import-dry-run` lets a user choose a synthetic
sample, open a local CSV, paste CSV text, map unknown columns, preview grouped
trades, inspect a confidence gate, and see what must be calibrated later. This
is workflow UI, not final website styling, and it still does not save imported
data or add export/download controls.

That dry-run route also includes the first repair and feedback-preview layer:
editable row repair cells, grouping decision controls, execution-only feedback
preview, first-trade replay preview, broker help, matched import error help,
privacy/safety copy, mobile QA notes, and a client-state decision capture model.
These surfaces are still rough product workflow scaffolding, but they make the
future real-import path testable before auth, billing, and persistence are
added.

The dry-run import intelligence layer adds a fuller product loop on top of that:
repair before/after impact, readiness score breakdown, P/L reconciliation
assistant, post-import review queue preview, feedback preview comparison,
broker mapping learning console, import session summary, execution anomaly
detection, and setup/playbook tagging. Setup tags are user labels only; they are
not chart-validated and do not affect scoring.

The automated import QA harness stress-tests this dry-run flow without real
broker files. It generates broken CSV mutations, runs a broker regression
matrix, simulates row repair and end-to-end dry-run decisions, guards against
market-context leakage, checks route panel/copy contracts, and defines
screenshot-ready desktop/tablet/mobile visual QA targets. That visual contract
is now backed by Playwright Chromium E2E tests for `/import-dry-run`, including
local CSV file import, row repair, setup tagging, feedback review state, banned
surface checks, screenshots, and horizontal overflow checks.

The app-wide feature regression suite extends Playwright coverage across the
rough product routes. It smoke-tests the main user-facing pages, traps browser
console/runtime/network failures, exercises representative broker CSV imports,
checks the import repair journey, verifies analytics, trade-review, review, and
progress product panels, captures screenshot smoke artifacts, guards
market-context overclaims, and completes a demo path from import to analytics,
trade autopsy, review, and progress. The suite also caught and fixed a real
mobile overflow on `/analytics` by keeping wide trade tables inside their local
scroll containers.

The app acceptance suite goes one level deeper and clicks through the product
like a real user. It opens every sample trade autopsy, exercises analytics
filters and drill-downs, maps unknown CSV headers, repairs rejected import rows,
opens source trades from progress and guided review, verifies mobile trade
detail overflow, and checks that rough product pages do not add export/download,
debug JSON, production persistence, auth/billing, or market-context scoring
overclaims.

The first-user hardening layer adds `/first-run` as an honest starting surface
for a user with no saved trades, no analytics report, no review history, and no
connected broker. Its Playwright suite proves that a new user can reach
`/import-dry-run`, repair a CSV row, get execution-only feedback preview, crawl
home navigation without broken links, exercise keyboard-reachable import
controls, smoke key routes in Firefox, check rough local performance, run CSV
abuse inputs without crashes, and keep product copy from overclaiming
persistence, auth, billing, exports, broker connections, or market-structure
scoring.

The actual-app QA layer adds deeper browser automation through
`tests/e2e/app-actual-qa.spec.ts`. It captures visual smoke artifacts for core
routes, runs critical/serious axe accessibility scans, stress-tests import
workflow edits, proves metric claims link back to source trade evidence, checks
mobile import repair and trade autopsy interaction, runs messy CSV torture
inputs, and walks the rough product loop from first-run to import, analytics,
trade review, guided review, and progress. This layer also improved the rough UI
by raising dark-helper text contrast and adding explicit accessible names to
import and analytics controls.

The functional product readiness layer is tracked in
[src/docs/trader-functional-product-readiness-plan.md](src/docs/trader-functional-product-readiness-plan.md)
and exported through `buildTraderFunctionalProductReadinessViewModel()`. It
turns CSV dry-run output into an in-memory saved-analysis prototype, formalizes
the import confidence state machine, enriches execution-only trade autopsies,
runs synthetic trader personas, deterministic execution-math fuzz scenarios,
truth-source evidence checks, a feature readiness dashboard, and a real-data
calibration harness. This is still prototype-only: it does not write production
data, does not add export/download controls, does not connect to live brokers,
and does not use candle or market-structure context for scoring.

Shared-engine runtime knobs:

- `LEVELS_SYSTEM_PROVIDER`: `ibkr` or `stub`
- `LEVELS_SYSTEM_WAREHOUSE_DIRECTORY`: durable candle warehouse path, usually
  `../levels-system/data/candles`
- `LEVELS_SYSTEM_WAREHOUSE_MODE`: `replay`, `read_write`, or `refresh`
- `LEVELS_SYSTEM_ON_DEMAND_HYDRATION`: set to `true` to let this app ask
  `levels-system` to fetch missing IBKR candles and write them into the
  warehouse during decision review
- `LEVELS_SYSTEM_IBKR_HOST`, `LEVELS_SYSTEM_IBKR_PORT`,
  `LEVELS_SYSTEM_IBKR_CLIENT_ID`: optional IBKR Gateway/TWS connection settings
  for on-demand hydration
- `LEVELS_SYSTEM_IBKR_TIMEOUT_MS`,
  `LEVELS_SYSTEM_IBKR_CONNECTION_TIMEOUT_MS`: optional historical-data and
  connection timeouts for on-demand hydration
- `LEVELS_SYSTEM_DAILY_LOOKBACK_BARS`
- `LEVELS_SYSTEM_4H_LOOKBACK_BARS`
- `LEVELS_SYSTEM_5M_LOOKBACK_BARS`

These values are passed through to `levels-system`; this repo should not add new
chart-reading, candle-fetching, or candle-market-structure logic locally.
When on-demand hydration is enabled, missing historical candles are still owned
by `levels-system`: it checks the warehouse, fetches missing IBKR candles, writes
them into the warehouse, then returns either verified context or provider/data
diagnostics. If hydration is disabled, replay mode stays strict and decision
review falls back honestly when candle evidence is unavailable.

Roadmap and handoff docs live in:
- [src/docs/codex-project-log.md](src/docs/codex-project-log.md)
- [src/docs/behavior-coverage-audit.md](src/docs/behavior-coverage-audit.md)
- [src/docs/trader-feedback-capabilities.md](src/docs/trader-feedback-capabilities.md)
- [src/docs/trader-improvement-intelligence-deepening-plan.md](src/docs/trader-improvement-intelligence-deepening-plan.md)
- [src/docs/trader-coach-action-loop-plan.md](src/docs/trader-coach-action-loop-plan.md)
- [src/docs/trader-product-polish-and-import-trust-plan.md](src/docs/trader-product-polish-and-import-trust-plan.md)
- [src/docs/trader-review-habit-loop-plan.md](src/docs/trader-review-habit-loop-plan.md)
- [src/docs/trader-import-trial-and-repair-experience-plan.md](src/docs/trader-import-trial-and-repair-experience-plan.md)
- [src/docs/trader-csv-dry-run-import-ui-plan.md](src/docs/trader-csv-dry-run-import-ui-plan.md)
- [src/docs/trader-candle-runtime-operator-guide-2026-05-07.md](src/docs/trader-candle-runtime-operator-guide-2026-05-07.md)
- [src/docs/persistence-read-model-and-import-commit-plan-2026-05-07.md](src/docs/persistence-read-model-and-import-commit-plan-2026-05-07.md)
- [src/docs/trader-import-repair-feedback-preview-plan.md](src/docs/trader-import-repair-feedback-preview-plan.md)
- [src/docs/trader-import-intelligence-workflow-expansion-plan.md](src/docs/trader-import-intelligence-workflow-expansion-plan.md)
- [src/docs/trader-import-automated-qa-harness-plan.md](src/docs/trader-import-automated-qa-harness-plan.md)
- [src/docs/trader-app-feature-regression-qa-plan.md](src/docs/trader-app-feature-regression-qa-plan.md)
- [src/docs/trader-app-acceptance-testing-plan.md](src/docs/trader-app-acceptance-testing-plan.md)
- [src/docs/trader-first-user-and-hardening-test-plan.md](src/docs/trader-first-user-and-hardening-test-plan.md)
- [src/docs/trader-actual-app-qa-and-visual-regression-plan.md](src/docs/trader-actual-app-qa-and-visual-regression-plan.md)
- [src/docs/trader-functional-product-readiness-plan.md](src/docs/trader-functional-product-readiness-plan.md)
- [src/docs/trader-functional-readiness-user-workflow-plan.md](src/docs/trader-functional-readiness-user-workflow-plan.md)
- [src/docs/trader-functional-readiness-next-handoff.md](src/docs/trader-functional-readiness-next-handoff.md)
- [src/docs/support-resistance-plan.md](src/docs/support-resistance-plan.md)
- [code-updates-april-15.md](code-updates-april-15.md)

Resume/read-first guidance:
- start with [src/docs/codex-project-log.md](src/docs/codex-project-log.md) for the current resume point and next recommended work
- use [src/docs/trader-functional-readiness-next-handoff.md](src/docs/trader-functional-readiness-next-handoff.md) for the current Trader Intelligence functional-readiness resume note
- use [code-updates-april-15.md](code-updates-april-15.md) if you want the detailed handoff for the April 15, 2026 session
- use the project log as the running Codex continuity log instead of creating a separate routine changelog
- then consult the behavior audit and pattern catalog before making roadmap decisions

## Scripts

Install dependencies:

```bash
npm install
```

Use the pinned Node version if you use `nvm`:

```bash
nvm use
```

Run the test suite:

```bash
npm test
```

Run the browser E2E suite for the CSV dry-run import route, app feature
regression coverage, app acceptance coverage, first-user hardening coverage, and
actual-app QA coverage:

```bash
npm run test:e2e
```

This builds the app first, then runs Playwright against `next start` on
`http://127.0.0.1:3100`. Chromium carries the full route, import, acceptance,
and hardening matrix; Firefox is kept to a narrow first-run route smoke project.
Browser traces and screenshots are written under the ignored `/artifacts`
directory.

Dependency audit note:

```bash
npm audit
```

The repo uses a root `overrides.postcss` entry to keep Next 16.2.3 while forcing
the installed PostCSS version to the patched 8.5.13 line. This avoids npm's
unsafe forced audit suggestion to downgrade Next to 9.3.3.

Run Layer 2 verification:

```bash
npm run verify:layer2
```

Run Layer 3 verification:

```bash
npm run verify:layer3
```

Run the shared `levels-system` integration checkpoint:

```bash
npm run verify:levels-system
```

Compare the legacy local support/resistance path with the shared engine on the
sample trade:

```bash
npm run compare:levels-system
```

Audit experimental candle market-structure output from the shared engine:

```bash
npm run audit:market-structure
npm run audit:market-structure -- path/to/saved-trade.json
npm run audit:market-structure -- path/to/saved-trades.json --validate-only
npm run audit:market-structure -- path/to/saved-trades.json --json
npm run audit:market-structure -- path/to/saved-trades.json --out-dir artifacts/market-structure-calibration
npm run audit:market-structure -- path/to/saved-trades.json --out-dir artifacts/market-structure-calibration --real-saved-trades-reviewed
npm run calibrate:market-structure -- path/to/saved-trades.json
```

With no path, the command uses the deterministic sample trade fixture and asks
`levels-system` for the trade-window candles. With a path, the JSON may be one
full `TradeAnalysisEngineArgs` object, an array, `{ trade }`, or `{ trades }`.
It may also omit candles and provide only `symbol`, `tradeDirection`,
`executions`, and `sessionContext`; in that mode this app requests the
pre-trade / trade / post-trade candle window from `levels-system` before
analysis. The audit output is for calibration only; it reports
`experimentalMarketStructure`, level counts, pattern IDs, diagnostics, and a
PatternInput leak check, but does not feed market structure into detection,
scoring, coaching, grading, or final user-facing conclusions.

An execution-only saved-trade template lives at
`src/docs/market-structure-calibration/sample-execution-only-trades.json`.
Replace the symbol, session date, and executions with real saved trades before
using it for provider-backed calibration. Use `--validate-only` to confirm a
saved-trade file shape without calling the candle provider.

The `--out-dir` option writes `market-structure-audit.json`,
`market-structure-calibration-evaluation.json`,
`market-structure-promotion-readiness.json`, and
`market-structure-calibration-report.md`. The evaluation JSON and Markdown
report include PASS / REVIEW / BLOCKER calibration gates for PatternInput
isolation, analysis completion, market-structure presence, confidence, unknown
or insufficient structure reads, diagnostics, and true provider / engine warning
or error messages. The promotion-readiness JSON keeps market structure
debug-only unless enough real saved trades have been reviewed and all quality
gates pass. Harmless fetch info is listed separately as engine messages.
Generated calibration artifacts live under `/artifacts`, which is ignored by
git.

Run a local trade-analysis debug dashboard:

```bash
npm run debug:trade-analysis
npm run debug:trade-analysis -- --validate-only
npm run debug:trade-analysis -- path/to/request.json --validate-only
npm run debug:trade-analysis -- path/to/request.json --out-dir artifacts/trade-analysis-debug
```

With no path, the command runs the deterministic stub fixture. With a path, the
JSON may be one request, `{ request }`, `{ trade }`, `{ requests }`,
`{ trades }`, or an array. The debug dashboard writes a stable summary contract,
validation issues, classified provider/shared-engine failures, support/resistance
counts, market-structure debug status, and pattern counts. Market structure
remains observational and is explicitly marked as not used for scoring.

Request JSON examples live in:

```text
src/docs/trade-analysis-request-fixtures/
```

Execution-feedback fixture coverage includes:

- `long-winner.json`
- `long-loser.json`
- `short-winner.json`
- `short-loser.json`
- `open-position.json`
- `partial-exits.json`
- `repeated-adds-before-reduction.json`
- `inconsistent-share-sizing.json`
- `rapid-fire-execution-cluster.json`
- `invalid-execution-only-requests.json`

Compare two saved debug dashboard runs:

```bash
npm run compare:trade-debug -- artifacts/run-a/trade-analysis-debug-dashboard.json artifacts/run-b/trade-analysis-debug-dashboard.json
npm run compare:trade-debug -- artifacts/run-a/trade-analysis-debug-dashboard.json artifacts/run-b/trade-analysis-debug-dashboard.json --json
```

The same debug contract is available from the app:

```text
POST /api/trade-analysis/debug
GET  /api/trade-analysis/debug
/debug/trade-analysis
```

Run execution-only feedback from the app without provider or candle calls:

```text
POST /api/execution-feedback/debug
GET  /api/execution-feedback/debug
/debug/execution-feedback
```

The route accepts one request, `{ request }`, `{ trade }`, `{ requests }`,
`{ trades }`, or an array, and returns `batch_execution_feedback_v1`.
Set `validateOnly: true` to validate request shape without building summaries.

Run trader analytics reports from the app:

```text
POST /api/trader-analytics/debug
GET  /api/trader-analytics/debug
/debug/trader-analytics
```

The route accepts the same trade request shapes as execution feedback, plus
`{ summaries: [...] }` or `execution_feedback_summary_v1[]`, and returns
`trader_analytics_report_v1`. The dashboard displays KPI cards, native
SVG/CSS charts, trade rows, limitations, warnings, and debug-only raw JSON.
Production end-user analytics should keep reports inside the app through saved
history, in-app comparisons, filters, and drill-downs rather than JSON/CSV
export.

The real-data bridge for this lane lives in:

```text
src/docs/trader-analytics-real-data-bridge.md
```

The production end-user roadmap for saved in-app report history, comparisons,
drill-down, focus queue, rule tracking, onboarding, import/sync, and no-export
UX lives in:

```text
src/docs/end-user-trader-analytics-product-roadmap.md
```

The follow-up product expansion plan for storage readiness, import review
inbox, saved snapshots, weekly review, behavior streaks, journal prompts, rule
compliance summary, and the separate market-context add-on lives in:

```text
src/docs/end-user-analytics-product-expansion-plan.md
```

The productization implementation plan for workspace/account scope, import
reconciliation, review workflows, setup tags, action plans, end-user/admin
permission split, async analysis jobs, visual QA, and market-context
calibration queue lives in:

```text
src/docs/end-user-productization-implementation-plan.md
```

The product-intelligence hardening plan for import quality scoring, trade
reconstruction preview, execution mistake taxonomy, trader score trends,
mistake cost estimates, rule recommendations, recurrence alerts, unified
review queue, broker fingerprint learning, and market-context readiness lives
in:

```text
src/docs/end-user-product-intelligence-hardening-plan.md
```

The end-user workflow productization plan for import review UI, execution
replay, guided review sessions, rule effectiveness, progress, import health,
broker-mapping admin, notes/lessons, account plan limits, and storage boundary
readiness lives in:

```text
src/docs/end-user-workflow-productization-plan.md
```

The platform-ready feature module plan for shared-platform context,
entitlements, feature gates, route registry, no-export audit, visual QA targets,
and broker CSV regression harness lives in:

```text
src/docs/platform-ready-feature-module-plan.md
```

The first fixture-backed production analytics prototype is available at:

```text
/analytics
/trades/[tradeId]
/imports
/review
/progress
/import-health
/admin/broker-mappings
/account
/platform-readiness
```

It uses in-memory/sample saved reports for now. It intentionally has no raw JSON
panel and no export controls. The page now includes weekly review, import
review inbox, storage readiness, saved snapshots, behavior streaks, journal
prompts, rule compliance, workspace scope, permission split, import
reconciliation, analysis jobs, setup tags, action plans, visual QA, and a
separate observational market-context/calibration panel. It also includes
product-intelligence panels for execution score trend, mistake cost estimates,
recurrence alerts, rule-builder recommendations, and a unified review queue.
The workflow routes add CSV import review, guided review, progress, import
health, admin broker mapping review, account plan limits, and execution replay
without exposing end-user export controls. The platform-readiness route shows
the demo platform context, future mount paths, entitlement gates, no-export
audit, feature readiness checklist, visual QA targets, and broker fixture
regression status.

Supporting product docs:

```text
src/docs/trader-analytics-production-safety-checklist.md
src/docs/trader-analytics-import-sync-plan.md
src/docs/end-user-database-schema-plan.md
src/docs/trader-analytics-market-context-add-on-plan.md
```

Run the full verification checkpoint:

```bash
npm run verify:all
```

Run the sample raw timeline debug script:

```bash
npm exec tsx src/lib/raw-trade-timeline/debug/run-sample-timeline.ts
```

## GitHub Automation

This repo includes GitHub Actions CI for:
- `npm test`
- `npm run verify:layer2`
- `npm run verify:layer3`

Dependabot is also configured for:
- npm dependencies
- GitHub Actions updates

## Notes

- The repo is designed so market-data providers can be swapped at the adapter
  boundary without rewriting Layers 1-3.
- Support/resistance logic is intentionally built as a factual structural engine
  first, with trader-facing setup labels added on top of it later.
