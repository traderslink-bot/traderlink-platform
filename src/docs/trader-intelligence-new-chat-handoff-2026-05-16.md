# Trader Intelligence New Chat Handoff - 2026-05-16

Use this file when starting a fresh Codex/ChatGPT chat for the next UI/product
review pass.

## Repo And Branch

- Repo: `traderslink-bot/traderslink-trader-improvement-system`
- Local workspace: `C:\Users\jerac\Documents\TraderLink\trader-intelligence-v2`
- Branch: `codex/trader-ui-product-pass`
- PR: `https://github.com/traderslink-bot/traderslink-trader-improvement-system/pull/9`

## Read First

Read these in order:

1. `src/docs/codex-project-log.md`
2. `src/docs/trader-intelligence-new-chat-handoff-2026-05-16.md`
3. `src/docs/trader-intelligence-ui-change-summary-and-next-steps-2026-05-16.md`
4. `src/docs/trader-intelligence-plan-index.md`
5. `plan.md`
6. `src/docs/suggestions-for-codex.md`

If changing App Router files, read the relevant local Next.js docs under
`node_modules/next/dist/docs/` before editing.

## Current Product Direction

The app should feel simple first and powerful later:

- beginner view first,
- advanced evidence second,
- admin/debug/dev tools never visible by default.

The intended beginner flow is:

Upload CSV -> app checks/saves/flags repairs -> saved trades appear -> app
tells the trader what to review first -> analytics explains patterns in plain
language -> coach gives one fix/repeat/review path -> progress tracks reviewed
follow-through.

Do not rebuild the completed IA. The next pass should be a screenshot-led UI
review and small focused fixes only.

## Most Recent Decision: Swing Trades

The user clarified that import-window positions should be called **Swing
Trades**, not hidden. If the app detects a swing trade incorrectly because the
uploaded CSV window missed closing executions, the trader can mark it closed.

Recent implementation:

- `/trades/open-swing` is now the **Swing Trades** lane.
- Open import-window groups are saved as swing-trade candidates with
  `blocked_open_trade` decision-review jobs.
- A new `POST /api/trades/[tradeId]/mark-closed` route persists the user
  correction.
- `/trades/open-swing` cards show a `Mark as closed` action for detected swing
  candidates.
- Marking a swing closed sets a user lifecycle override, closes/ignores the
  trade for the swing queue, and removes it from swing review.
- The import dry-run execution autopsy now uses `Swing Trade` instead of
  `Open Position Leftover` in visible end-user copy.

Important product nuance:

- A true swing trade should stay visible as a swing trade.
- A mistakenly detected swing can be marked closed.
- Completed next-session or overnight holds should remain in ticker/day
  stories as hold-plan review evidence; do not confuse those with unresolved
  swing candidates.

## Recently Completed UI Work To Preserve

Do not redo these unless a concrete regression appears:

- `/workspace` premium dashboard homepage and logo-matched blue palette.
- `/upload-csv` simple one-card upload start page.
- `/import-dry-run` demoted to advanced import check.
- `/imports` and `/imports/[batchId]` beginner-first import IA and advanced
  disclosure model.
- `/trades` route split into calendar, day sessions, ticker stories, round
  trips, needs review, and swing trades.
- Month calendar on `/trades/calendar`.
- Day session and ticker-story drilldown routes.
- Trade replay chart with candle rendering and execution strip.
- `/coach` route split and behavior coaching sequence.
- `/analytics` route split into results, timing, behavior, ticker stories,
  session stories, chart evidence, review plan, trade explorer, and details.
- `/review` beginner work queue simplification.
- `/progress` imported-vs-reviewed framing and follow-through language.
- Sell-starting/short-side limited-support copy.
- Chart data/evidence wording cleanup.

## Verification From Latest Run

The latest swing-trade pass was verified with:

- `npx tsc --noEmit --pretty false`
- `npm run build`
- `npx vitest run src/lib/execution-feedback/__tests__/execution-behavior-patterns.test.ts src/lib/trader-analytics/__tests__/import-commit-planner.test.ts src/lib/trader-analytics/__tests__/saved-import-api-routes.test.ts src/lib/trader-analytics/__tests__/sqlite-import-commit-repository.test.ts`
- `npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-desktop -g "saved trade routing"`
- `npx playwright test tests/e2e/import-dry-run.spec.ts --project=chromium-desktop -g "swing-trade imports"`
- `npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-desktop -g "parses representative broker CSV"`
- `npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-mobile -g "keeps core mobile routes usable"`
- `git diff --check`

## Recommended Next UI Review Pass

Start at `/workspace` and review the app like a new trader:

1. Open `/workspace`.
2. Follow the simple upload path through `/upload-csv`.
3. Inspect the advanced import page only as an optional path:
   `/import-dry-run`.
4. Review saved import pages:
   `/imports` and `/imports/[batchId]`.
5. Review saved trade navigation:
   `/trades`, `/trades/calendar`, `/trades/day-sessions`,
   `/trades/ticker-stories`, `/trades/round-trips`,
   `/trades/open-swing`, `/trades/review-needed`.
6. Open a day session, then a ticker story, then an individual round trip.
7. Confirm trade replay appears high enough and execution markers remain
   readable.
8. Inspect `/review`, `/analytics`, `/coach`, and `/progress` as follow-up
   surfaces.

For each route, judge:

- Is the first screen obvious?
- Is there one clear next action?
- Is beginner copy plain?
- Are advanced details discoverable but demoted?
- Are admin/debug/dev routes absent from default user flow?
- Are batch IDs, raw import IDs, raw statuses, and diagnostic jargon hidden
  from primary UI?
- Does mobile avoid horizontal overflow?

Fix only concrete issues found during the review. Do not start broad rewrites.

## Known Watch Items

- The current real-data swing lane should be reviewed with the user. It may
  show swing candidates from the April import. If a candidate was actually
  closed, use `Mark as closed`; do not hide the lane globally.
- Some older plans still use the phrase `open/swing` historically. Treat the
  latest project-log entry and this handoff as the current product decision.
- If reviewing GitHub rather than the local workspace, make sure the relevant
  implementation commit has been pushed before assuming GitHub reflects the
  latest local code.

## Stop Conditions

Stop only for:

- destructive filesystem/git actions,
- unclear data-contract or architecture choices,
- any new coaching behavior claim that cannot be certified from saved evidence.

Do not stop merely because a screenshot needs judgment. Use the screenshot to
make the smallest safe UI improvement, verify, and continue.
