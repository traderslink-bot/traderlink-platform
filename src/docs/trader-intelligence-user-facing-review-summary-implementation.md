# Trader Intelligence User-Facing Review Summary Implementation

**Date:** 2026-05-08  
**Branch:** `codex/trader-ui-product-pass`

## Purpose

This implementation pass starts the new-user UX roadmap from
`src/docs/2026-05-08-trader-intelligence-new-user-ux-qc-roadmap.md`.

The main product rule is:

> Review the trade, identify the main behavior, explain why it mattered, and
> give one fix-first action.

This pass intentionally does not change lower-layer engine contracts. It adds a
translation layer above coaching output so beginner-facing UI can consume clean,
product-ready review summaries instead of raw scoring or pattern internals.

## What Changed

- Added `UserFacingTradeReviewSummary` as the product-facing review contract.
- Added `buildUserFacingTradeReviewSummary` to translate coaching output into:
  - main issue or strength,
  - what happened,
  - why it mattered,
  - one fix-first or reinforce-first action,
  - human-readable evidence,
  - beginner education links,
  - advanced traceability details.
- Added mapper tests that assert beginner-facing copy does not expose terms such
  as pattern IDs, suppressed behavior IDs, normalized patterns, dominant family,
  score bands, or structural composite labels.
- Added `/trader-intelligence` as a static mock single-trade review experience
  using eight roadmap cases:
  - chase entry,
  - poor profit protection,
  - premature exit,
  - adding into weakness,
  - strong profit protection,
  - structured execution,
  - mixed/moderate-confidence evidence,
  - needs-more-data.
- Added a homepage link to preview the Trader Intelligence review experience.
- Tightened shared metric-card rendering and shortened top-card copy on
  `/coach` and `/trades/[tradeId]` so long coaching labels do not dominate the
  first viewport.

## UX Rules Preserved

- Beginner-facing UI does not expose raw engine complexity by default.
- Advanced details remain available, but collapsed.
- The UI avoids financial-advice language, trade-call language, guaranteed
  improvement language, and short-seller coaching positioning.
- Low-confidence and needs-more-data cases do not overstate certainty.
- Strength-first reviews reinforce what to repeat instead of forcing every
  review into a mistake.

## Verification

- `npx tsc --noEmit --pretty false`
- `npx vitest run src/lib/user-facing-review/__tests__/build-user-facing-trade-review-summary.test.ts --reporter=dot`
- `npm run build`
- `npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-desktop -g "beginner-safe Trader Intelligence|captures visual smoke screenshots"`
- `npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-mobile -g "keeps core mobile routes usable"`
- Fresh desktop/mobile screenshots were captured under
  `artifacts/visual-qc/2026-05-08-user-facing-review-final/`.

## Next Best Step

Wire the user-facing review summary mapper to real saved trade review output
after the mock single-trade review UI is stable. Keep the mapping layer
downstream of engine/coaching contracts, and keep advanced diagnostics collapsed
or under admin/debug surfaces.
