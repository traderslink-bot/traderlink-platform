# Trader UI Product Pass Deliberate Port Plan - 2026-06-11

## Source And Target

- Target branch: `codex/port-v2-candle-analytics-main`
- Source branch under review: `codex/trader-ui-product-pass`
- Direct merge status: not acceptable without a manual port.

## Why Direct Merge Is Unsafe

- The source branch renames many `app/intelligence/*` routes to root-level
  `app/*` routes. The target branch must preserve the newer `/intelligence`
  namespace.
- The source branch deletes journal-level-analysis API routes, docs, fixtures,
  contracts, tests, and implementation files. The target branch must preserve
  journal-level-analysis work.
- The source branch predates the current free execution-only versus paid
  chart-context tier boundary and would need tier-aware route adaptation before
  any UI code is accepted.
- The source branch has broad academy/news/site-shell churn that is outside the
  current Trader Intelligence v2 candle/levels/coaching/analytics QA scope.

## Port First

These areas are the best candidates for deliberate, file-by-file review because
they overlap with the Trader Intelligence v2 product surface:

- Shared trader analytics product logic under `src/lib/trader-analytics/*`.
- Shared levels-system-v2 adapter and summary behavior under
  `src/lib/support-resistance/*`, `src/lib/raw-trade-timeline/*`, and
  `src/lib/trade-analysis/*`, only where the change still imports
  `levels-system-v2/support-resistance-engine`.
- User-facing behavior mapper and registry changes under
  `src/lib/user-facing-behavior/*`.
- Focused E2E coverage updates under `tests/e2e/*`, adapted to `/intelligence`
  routes and current tier expectations.

## Adapt Before Porting

These areas may contain useful UI ideas, but the route paths must be rewritten
for the target branch:

- `app/coach/*` changes should be reviewed against `app/intelligence/coach/*`.
- `app/review/*` changes should be reviewed against `app/intelligence/review/*`.
- `app/trades/*` changes should be reviewed against `app/intelligence/trades/*`.
- `app/analytics/*` changes should be reviewed against
  `app/intelligence/analytics/*`.
- `app/imports/*`, `app/import-dry-run/*`, and `app/upload-csv/*` changes
  should be reviewed against their `app/intelligence/*` counterparts and must
  preserve the current tier gates.
- `app/workspace/*` changes should be checked against the Material-style
  `/workspace` baseline before accepting visual changes.

## Do Not Port Wholesale

- Do not accept route deletes under `app/intelligence/*`.
- Do not accept journal-level-analysis deletes under `app/api/level-analysis/*`,
  `app/api/admin/level-analysis/*`, `app/api/trades/[tradeId]/level-analysis/*`,
  `src/lib/level-analysis/*`, or `src/docs/level-analysis-*`.
- Do not accept old root-level route replacements for `/coach`, `/review`,
  `/trades`, `/analytics`, `/imports`, or `/upload-csv` unless they are manually
  adapted into `/intelligence`.
- Do not accept broad academy/news/content deletions as part of this Trader
  Intelligence v2 port.
- Do not accept any support/resistance change that restores old
  `levels-system` v1 / phase1 imports or semantics.

## Suggested Port Order

1. Shared non-UI analytics behavior and tests.
2. Shared levels-system-v2 candle/support-resistance behavior and tests.
3. Route-local UI improvements, one route family at a time, adapted into
   `/intelligence`.
4. Tier-copy and evidence-gating review after each route family.
5. Playwright route checks in both `free_execution` and `chart_context` tiers.

## Verification For Each Port Slice

- `npx tsc --noEmit --pretty false`
- Focused Vitest files for touched behavior.
- `npm run verify:levels-system -- --reporter=dot` for any levels/candle
  changes.
- Tier Playwright checks for touched routes in both tiers.

## Current Recommendation

Start with a read-only review of `src/lib/trader-analytics/*` differences from
`codex/trader-ui-product-pass`, then port only the product logic that still
matches the current evidence model. Defer route UI until each useful change can
be mapped into `/intelligence` without overwriting journal-level-analysis work.

## Initial Trader Analytics Review Result

- The source branch's trader-analytics diff is not a clean product-logic port.
  Many hunks rewrite `/intelligence/*` links to root-level routes, which should
  be rejected for this target branch.
- The source branch removes journal-level facts from the saved review queue;
  keep the target branch's journal-level-analysis read model and UI contract.
- The source branch removes newer open/swing trade handling such as
  `markTradeClosedByUser`; keep the target branch's open-swing flow.
- The source branch removes customer-data filtering in saved analytics reads;
  keep the target branch's synthetic/customer-data filtering.
- Warehouse-backed candle hydration, saved import chart hydration status, and
  tier config are already represented in the target branch through
  `src/lib/support-resistance/levels-system-warehouse-fetch-service.ts`,
  `/api/import-batches/[batchId]/decision-review/status`, and
  `src/lib/trader-analytics/product/tier-config.ts`.
- A scan for old `levels-system` v1 / phase1 imports found only prose strings,
  not v1 code imports.

Next review slice:

- Review source-only behavior commits at the function level before taking any
  code. Start with saved review priority wording and ticker-story grouping, but
  keep target route paths, tier gates, journal-level facts, and open-swing
  behavior.
