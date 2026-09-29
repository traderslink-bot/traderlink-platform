# Membership additions handoff — 2026-09-28

## Result

Independent Watchlist detail/preparation gates and plan-controlled Trade Analyzer/
Levels Generator allowances are implemented on release parent
`d5ec13293400a5849636a6049a4761e272eb7928` in the existing
`membership-production-20260928` worktree. No unrelated canonical source was copied.

This is a local implementation checkpoint, not deployed or runtime-accepted work.
The initial membership production release did not contain these additions.

## Owner controls

In the same Admin → Memberships area, select the new features in any plan draft.
For each generation tool, quantity can be zero, any positive safe whole number,
or blank (unlimited). Reset interval can be any positive whole number of days,
or blank (no reset). Clone/publish preserves version immutability.
Enable the corresponding feature policy only when ready; defaults stay off.
Public Plans and private invitation catalogs both show these feature terms.
Private offers remain excluded from all public upgrade filters.

## Verification

- Focused compiler, 39 roots: zero diagnostics after final corrections.
- ESLint over all changed/new TS/TSX files: zero errors, three existing warnings.
- Final focused lint after source-review corrections: zero errors, one existing
  Watchlist unused-helper warning.
- Final `git diff --check`: passed.
- No Vitest, other tests, local server, browser, build, provider request, real
  database access/migration or production action was run.

Corrections during source review: protected analysis history and indicators;
removed full objects from member list/stream responses and archive list props;
prevented cached card reconciliation from restoring revoked analysis;
preserved current production compact DTO/quote behavior;
rechecked first queued acquisition access, including history-enabled jobs;
counted first charge only across continuation/reset boundaries;
included newer committed usage to prevent a stale request timestamp undercount.

## Required release/acceptance boundary

Migration `0150_platform_membership_generation_allowances` is new and unapplied.
Recheck migration-number availability and current production parent before release.
Do not deploy directly from the stale canonical mixed checkout.

Owner/runtime acceptance remains required for real plan form persistence,
migration, concurrency, zero/unlimited, source expiry, source combinations,
reset transitions, saved-result/retry behavior, direct endpoint gates,
private-offer exclusion and Light/Navy Dark UI.
Payment processor verification remains a separate goal.
No push, deploy, Railway command, hosted migration or coordinator message was sent.

## Complete source/docs allowlist

- `app/(dashboard)/levels/stock-levels-client.tsx`
- `app/(dashboard)/trade-tracker/manual-trade-post-entry-review.tsx`
- `app/(dashboard)/workspace/workspace-trade-analyzer-panel.tsx`
- `app/(dashboard)/workspace/workspace-trade-library-client.tsx`
- `app/admin/journal/memberships/management-panels.tsx`
- `app/admin/journal/memberships/plans/new/page.tsx`
- `app/api/live-watchlist/route.ts`
- `app/api/live-watchlist/symbols/[symbol]/analysis-history/route.ts`
- `app/api/live-watchlist/symbols/[symbol]/indicators/route.ts`
- `app/api/live-watchlist/symbols/[symbol]/route.ts`
- `app/plans/page.tsx`
- `app/plans/plan-catalog.tsx`
- `app/watchlist/[symbol]/page.tsx`
- `app/watchlist/archive/[archiveId]/page.tsx`
- `app/watchlist/archive/page.tsx`
- `app/watchlist/live-watchlist-client.tsx`
- `docs/migration/membership-and-subscription-platform-plan.md`
- `docs/migration/membership-generation-allowances-progress.md`
- `docs/migration/watchlist-membership-feature-split-progress.md`
- `src/lib/live-watchlist/live-watchlist-events.ts`
- `src/lib/live-watchlist/live-watchlist-types.ts`
- `src/modules/help/paid-plan-guides.ts`
- `src/modules/help/stock-levels-guides.ts`
- `src/modules/help/trade-analyzer-guides.ts`
- `src/modules/help/watchlist-guides.ts`
- `src/modules/level-analysis/contracts/shared-analyzer-beta-contracts.ts`
- `src/modules/level-analysis/server/shared-analyzer-allowance-repository.ts`
- `src/modules/platform/contracts/platform-membership-contracts.ts`
- `src/modules/platform/server/database/platform-migration-manifest.ts`
- `src/modules/platform/server/membership/platform-membership-catalog-repository.ts`
- `src/modules/platform/server/membership/platform-membership-features.ts`
- `src/modules/platform/server/membership/platform-membership-management.ts`
- `src/modules/platform/server/membership/platform-membership-repository.ts`
- `src/modules/stock-levels/server/stock-levels-service.ts`
- `src/modules/stock-levels/stock-levels-contract.ts`
- `app/(dashboard)/trade-analyzer-allowance-summary.tsx`
- `app/admin/journal/memberships/generation-reset-field.tsx`
- `app/watchlist/watchlist-feature-message.tsx`
- `scripts/check-membership-additions.cjs`
- `src/lib/live-watchlist/watchlist-member-projection.ts`
- `src/modules/platform/server/database/migrations/0150_platform_membership_generation_allowances.ts`
- `src/modules/platform/server/membership/platform-membership-generation-allowance.ts`
- `src/modules/watchlist/server/access/watchlist-feature-access.ts`
- `docs/migration/membership-additions-handoff.md`

Canonical checkout received only explanatory tracker pointers during this slice;
its older Watchlist implementation is not the release source.
