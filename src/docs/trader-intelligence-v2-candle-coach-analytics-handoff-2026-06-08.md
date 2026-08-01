# Trader Intelligence v2 Candle / Coach / Analytics Handoff - 2026-06-08

## Status

The Trader Intelligence v2 candle-data, levels-system-v2, coaching, analytics,
and user-facing feedback path has been verified end to end on the local April
IBKR activity-statement dataset.

Work branch:

- `codex/trader-ui-product-pass`

Latest app package commit before this handoff doc:

- `6f14a249 Polish import chart data status copy`

Important project rule:

- Use `levels-system-v2/support-resistance-engine` only.
- Do not restore, import, or depend on old levels-system v1 / phase1.
- This repo is not the production repo. Do not deploy from here.

## What Is Working

- Saved imports can use v2-backed candle hydration and chart review snapshots.
- When a v2 fetch service is configured, the app can fetch daily, 4h, and 5m
  candles through v2 and use saved chart context across replay, review, coach,
  and analytics.
- When chart/candle evidence is unavailable, user-facing copy stays
  execution-only and does not invent support/resistance claims.
- Free execution tier is guarded so chart-evidence surfaces and chart examples
  do not leak into free-mode pages.
- Local default tier is chart context for product-building convenience.

## April IBKR Statement QA

Private April statement used:

- `artifacts/real-csv-calibration/private/[redacted-account]_202604_202604.csv`

Isolated local QA DB:

- `.codex-dev-server/ibkr-april-live-ui.sqlite`

Local QA server:

- `http://127.0.0.1:3006/workspace`

The April import detail showed:

- 574 accepted executions
- 208 saved trades
- 206 chart-review snapshots
- 208 chart-review items
- 2 swing/open-trade data notes
- 5 candle-basis-check trades
- 0 chart-data-needs-check items

Key surface checks passed:

- `/imports`
- April import detail
- `/review?queue=highest_priority`
- `/review?queue=candle_basis_warning`
- `/analytics/chart-evidence`
- `/analytics/behavior`
- `/coach`
- `/coach/review-session`
- ticker-story pages for CMND, PBM, SKYQ, CYCN
- individual round-trip pages for CMND, PBM, SKYQ, CYCN
- open/swing ANNA trade detail
- closed CYCN trade detail

## Product Fixes Completed In This Package

- Highest-priority review queue groups repeated same-symbol/session review
  cards into ticker-story handoffs.
- Review priority now accounts for realized loss impact without letting generic
  chart-risk counts dominate the first-pass queue.
- Candle-basis diagnostics are visible in review, analytics, coach, and trade
  detail without sounding like a technical failure.
- Coach now promotes a ticker-story focus when repeated same-symbol round trips
  are the better evidence shape.
- CMND is the primary current coach story for `Added several times before
  reducing size`, with PBM, SKYQ, and CYCN as supporting examples.
- Ticker-story detail pages opened from coach now include a coach handoff.
- Individual trade detail pages dedupe chart handoff findings and use
  conservative chart-context wording.
- Fill-only mini replays now distinguish between "no chart data attached" and
  "saved chart review is attached below."
- Open/swing trade diagnostics override generic flat/closed replay language.
- `/analytics/chart-evidence` now shows concrete chart-backed example stories
  with `Replay check:` wording.
- Import pages use calmer data-status copy instead of scary
  `technical follow-up` wording.

## Verification Already Run

Recent verification passed:

- `npx tsc --noEmit --pretty false`
- focused coach/analytics Vitest batches:
  - 4 files / 63 tests during coach/ticker-story passes
  - 5 files / 65 tests during analytics/import-detail passes
- `npm run verify:levels-system -- --reporter=dot`
  - 15 files / 63 tests
- focused Playwright coach regression:
  - `tests/e2e/app-feature-regression.spec.ts`
  - grep: `shows the coach product loop with calibrated coaching surfaces`
- chart-context tier guard:
  - `TRADER_INTELLIGENCE_TIER=chart_context npx playwright test tests/e2e/tier-chart-evidence.spec.ts --project=chromium-desktop`
- free-execution tier guard:
  - `TRADER_INTELLIGENCE_TIER=free_execution npx playwright test tests/e2e/tier-chart-evidence.spec.ts --project=chromium-desktop`

## Remaining Real-Data Calibration

The next chat should run a fresh, smaller IBKR import from a different activity
statement period. This is not a blocker for the April path; it is the next
calibration step to prove the v2 path generalizes beyond April.

Recommended target:

- use a different IBKR activity statement period from the project folder if one
  exists, or ask the user for the next statement file
- keep the import in an isolated local DB like the April QA DB
- use live v2/IBKR candle hydration
- verify import detail, review, analytics, coach, ticker-story pages, and at
  least one open/swing or basis-warning edge case if present
- compare whether support/resistance and chart-context feedback feels useful,
  conservative, and not overclaimed

## New Chat Prompt

Paste this into the next Codex chat:

```text
You are in C:\Users\jerac\Documents\TraderLink\trader-intelligence-v2.

Read AGENTS.md first. Then read:
- src/docs/codex-project-log.md
- src/docs/behavior-coverage-audit.md
- src/docs/layer2-pattern-detection/layer2-implemented-pattern-catalog.md
- src/docs/trader-intelligence-v2-candle-coach-analytics-handoff-2026-06-08.md

Important rules:
- Use levels-system-v2 only: levels-system-v2/support-resistance-engine.
- Do not restore or depend on old levels-system v1 / phase1.
- This repo is not production; do not deploy from here.
- Preserve unrelated dirty work.

Current state:
- The April IBKR activity-statement path has been verified end to end with v2
  candle/chart evidence through saved imports, import detail, review queues,
  trade detail, ticker stories, analytics, and coach.
- Latest package branch was codex/trader-ui-product-pass.
- The April QA server was http://127.0.0.1:3006/workspace with isolated DB
  .codex-dev-server/ibkr-april-live-ui.sqlite.

Your job:
1. Find or ask for a different/smaller IBKR activity statement period.
2. Run a fresh isolated saved-import QA pass using live v2/IBKR candle hydration.
3. Verify import detail, persisted trade detail, review queues,
   /analytics/chart-evidence, /analytics/behavior, /coach, /coach/review-session,
   ticker-story pages, and at least one individual round-trip replay.
4. Check that chart/candle/support-resistance feedback is useful but conservative:
   if evidence exists, show it; if only executions exist, say so; if market
   context is unavailable or basis needs review, do not overclaim.
5. Run typecheck, levels-system verification, focused trader analytics/coach
   tests, and relevant Playwright/browser checks.
6. Keep src/docs/codex-project-log.md updated with what changed, what passed,
   and the next best step.
```

## Handoff Recommendation

Package/merge this branch before starting the next real-data calibration. The
next chat should treat the different-period IBKR import as a new calibration
run, not as a continuation of unfinished April plumbing.
