# Analyzer Trend & Momentum Candidate Handoff

Status: **INCOMPLETE - NOT AUTHORIZED FOR RELEASE**.

Plan: [Full controlling plan](trade-analyzer-trend-momentum-plan.md).
Evidence: [Progress](trade-analyzer-trend-momentum-progress.md).
UI audit: [Tooltip source index](trade-analyzer-tooltip-source-inventory.md).

## Exact candidate boundary

- Worktree: `C:/Users/jerac/Documents/TraderLink/worktrees/analyzer-trend-momentum-current-20260912`.
- Branch: `codex/analyzer-trend-momentum-current-20260912`.
- Base: `f97ab1ceecf30c411d605f1dd5ed3af31246dead`.
- Source/docs candidate: `53d9e73b41d605ecf1bb0f3d4c0dc8758612a51f`.
- Worktree was clean when captured. 112 changed files relative to base.
- This handoff document and its plan/progress links are additional documentation,
  not part of that 112-file source checkpoint. Refresh the final SHA/allowlist
  before release; do not publish this branch or infer remote ancestry.
- No push, deployment, service restart, production migration or provider request
  was performed while preparing this handoff. No coordinator was dispatched.

## What source implements

Bounded indicator history acquisition; deterministic EMA9/EMA20, RSI14 and
session-turnover VWAP; sparse real-bar handling; saved-trade grouping across
multiple round trips; individual/chart/aggregate indicator views; Room After
Entry and confirmed obsolete Analyzer population corrections; Help/offline
integration and availability notices. Full scope remains the controlling plan,
not this short summary. No AI generation is introduced.

## Evidence already obtained

- Earlier combined checkpoint: 31 scoped files, 125 tests passed; static migration
  verifier accepted 120 registered entries. Migration application was not run.
- Earlier 107 changed TypeScript roots passed split selected-root checks. Lint:
  zero errors, one inherited unused TradeOutcomeSummary warning. A combined
  Vitest-type run exceeded the 768-MB cap, so it was split, not run with more RAM.
- Later focused checkpoints: 29 aggregate tests; 16 numerical foundation and
  convergence tests; 10 section-markup tests; eight reporting/presentation tests.
  These runs overlap and must not be summed as unique test coverage.
- Most recent UI slice: five changed roots had zero type diagnostics and zero
  lint errors/warnings. Individual and default combined markup reject nested
  buttons; combined table headings render help controls.
- Numerical references include closed-form EMA and independently weighted Wilder
  RSI, price-scale invariance and sparse 5m buckets. Synthetic checks are not a
  substitute for real provider/candle-chart calibration.
- These are source/selected-root checks, not a full application build, full CI,
  browser interaction, production health or completed product acceptance.

## Explicit unfinished gates

1. Manual retry remains defective: select can reach queue after failure, but
   queue returns the existing terminal job and select returns already_requested.
   Owner decision pending: reuse original allowance or treat explicit retry as a
   new charged request. Do not improvise a schema/accounting change or reset the
   automatic retry/history limits. Verify notification dedup after correction.
2. Real calibration: shared Moomoo account display differs from the operator-grant
   user. Owner confirmation of that private corpus is pending. Only the latter's
   two-record sample was inspected, not the shared user's private trade corpus.
   The previously observed shared token required normal renewal; revalidate via
   the established single-writer connection path. No manual token update.
3. Full tooltip-copy reconciliation and representative large-population payload
   acceptance remain open. The source index is not complete rendered-copy proof.
4. Actual desktop/mobile Light/Navy Dark, keyboard/touch help, chart interaction,
   navigation and PWA/offline acceptance remain open. Owner prohibits local
   servers. Arrange an explicitly authorized hosted acceptance environment.
5. Full build/CI-equivalent acceptance and the recorded inherited dashboard-template
   failures must be evaluated at the release checkpoint. Do not report them as
   passing because selected tests passed.
6. Owner visual/product acceptance and production release are separately gated.

## Migration and release risks

- Reserved `0134_daily_trade_analyzer_trend_momentum_history`, exact predecessor
  `0133_platform_watchlist_daily_recaps`. Source registration only; no hosted
  application claimed. Adds `level_analysis_indicator_history_requests` plus
  indexes/immutable completed-evidence triggers. Consult the migration registry.
- Do not silently add retry-accounting tables/columns to this reserved migration.
- Source is based on f97ab1cee, not proof of the current remote release parent.
  Coordinator must reconcile the allowlist against then-current canonical main
  after the active release lane clears. Preserve unrelated features and changes.
- Railway branch invariant is main, but configured source and remote tip require
  a fresh read-only metadata check. No current deployment ID/status or health
  evidence is supplied by this candidate handoff.
- Preserve the single-writer volume boundary. Require guarded backup/predecessor
  verification before any explicitly approved migration; record application and
  health evidence. A local commit is not a release.

## Complete candidate changed-file list

This list is generated from Git at the exact base/candidate above, including
source, tests, migration registration, Help and documentation.
- `app/(dashboard)/analytics/analyzed-trades-index.tsx`
- `app/(dashboard)/analytics/analyzer-disclosure-section.tsx`
- `app/(dashboard)/analytics/candle-pattern-occurrence-explorer.tsx`
- `app/(dashboard)/analytics/trade-analysis-client.tsx`
- `app/(dashboard)/analytics/trade-analysis-page.tsx`
- `app/(dashboard)/analytics/trade-analyzer/day/trend-momentum/page.tsx`
- `app/(dashboard)/analytics/trend-momentum-analysis.tsx`
- `app/(dashboard)/analytics/trend-momentum-band-comparison.tsx`
- `app/(dashboard)/analytics/trend-momentum-conditions.tsx`
- `app/(dashboard)/analytics/trend-momentum-execution-comparison.tsx`
- `app/(dashboard)/analytics/trend-momentum-landmark-comparison.tsx`
- `app/(dashboard)/analytics/trend-momentum-movement-filters.tsx`
- `app/(dashboard)/analytics/trend-momentum-outcome-table.tsx`
- `app/(dashboard)/analytics/trend-momentum-supporting-trades.tsx`
- `app/(dashboard)/trade-tracker/[sessionDate]/daily-trade-analyzer-chart.tsx`
- `app/(dashboard)/trade-tracker/[sessionDate]/day-session-types.ts`
- `app/(dashboard)/trade-tracker/[sessionDate]/day-session-view.tsx`
- `app/(dashboard)/trade-tracker/analyzer-trade-summary.ts`
- `app/(dashboard)/trade-tracker/trade-indicator-context.tsx`
- `app/(dashboard)/trade-tracker/trade-tracker-platform-data.ts`
- `app/(dashboard)/trade-tracker/written-trade-analysis.tsx`
- `app/api/platform/trade-analyzer/analyzed-trades/route.ts`
- `app/api/platform/trade-analyzer/candle-patterns/occurrences/route.ts`
- `app/api/platform/trade-analyzer/candle-patterns/replay/route.ts`
- `app/api/platform/trade-analyzer/trade/route.ts`
- `app/dashboard-navigation.ts`
- `app/pwa/offline-analytics-route-surface.tsx`
- `docs/migration/trade-analyzer-analysis-pages-plan.md`
- `docs/migration/trade-analyzer-tooltip-source-inventory.md`
- `docs/migration/trade-analyzer-trend-momentum-plan.md`
- `docs/migration/trade-analyzer-trend-momentum-progress.md`
- `src/lib/trade-candle-analysis/analysis-availability.ts`
- `src/lib/trade-candle-analysis/trend-momentum-acquisition.ts`
- `src/lib/trade-candle-analysis/trend-momentum-analytics.test.ts`
- `src/lib/trade-candle-analysis/trend-momentum-analytics.ts`
- `src/lib/trade-candle-analysis/trend-momentum-chart.ts`
- `src/lib/trade-candle-analysis/trend-momentum-cohorts.test.ts`
- `src/lib/trade-candle-analysis/trend-momentum-cohorts.ts`
- `src/lib/trade-candle-analysis/trend-momentum-context.ts`
- `src/lib/trade-candle-analysis/trend-momentum-convergence.test.ts`
- `src/lib/trade-candle-analysis/trend-momentum-during-study.test.ts`
- `src/lib/trade-candle-analysis/trend-momentum-during-study.ts`
- `src/lib/trade-candle-analysis/trend-momentum-episodes.test.ts`
- `src/lib/trade-candle-analysis/trend-momentum-episodes.ts`
- `src/lib/trade-candle-analysis/trend-momentum-execution-filter.test.ts`
- `src/lib/trade-candle-analysis/trend-momentum-execution-filter.ts`
- `src/lib/trade-candle-analysis/trend-momentum-execution-page.test.ts`
- `src/lib/trade-candle-analysis/trend-momentum-executions.ts`
- `src/lib/trade-candle-analysis/trend-momentum-foundation.test.ts`
- `src/lib/trade-candle-analysis/trend-momentum-history.ts`
- `src/lib/trade-candle-analysis/trend-momentum-indicators.ts`
- `src/lib/trade-candle-analysis/trend-momentum-landmark-comparisons.test.ts`
- `src/lib/trade-candle-analysis/trend-momentum-landmark-comparisons.ts`
- `src/lib/trade-candle-analysis/trend-momentum-landmarks.test.ts`
- `src/lib/trade-candle-analysis/trend-momentum-movement-filter.test.ts`
- `src/lib/trade-candle-analysis/trend-momentum-movement-filter.ts`
- `src/lib/trade-candle-analysis/trend-momentum-movement-projection.test.ts`
- `src/lib/trade-candle-analysis/trend-momentum-movement-projection.ts`
- `src/lib/trade-candle-analysis/trend-momentum-patterns.test.ts`
- `src/lib/trade-candle-analysis/trend-momentum-patterns.ts`
- `src/lib/trade-candle-analysis/trend-momentum-presentation.test.ts`
- `src/lib/trade-candle-analysis/trend-momentum-reporting.test.ts`
- `src/lib/trade-candle-analysis/trend-momentum-reporting.ts`
- `src/lib/trade-candle-analysis/trend-momentum-view-selection.test.ts`
- `src/lib/trade-candle-analysis/trend-momentum-view-selection.ts`
- `src/modules/help/trade-analyzer-guides.ts`
- `src/modules/journal-analytics/contracts/journal-analytics-offline-view-contracts.ts`
- `src/modules/journal/server/journal-integrity-runtime.ts`
- `src/modules/level-analysis/contracts/candle-review-contracts.ts`
- `src/modules/level-analysis/contracts/daily-trade-analyzer-contracts.ts`
- `src/modules/level-analysis/server/daily-trade-analysis-evidence-service.ts`
- `src/modules/level-analysis/server/daily-trade-analyzer-runtime.ts`
- `src/modules/level-analysis/server/daily-trade-analyzer.ts`
- `src/modules/level-analysis/server/daily-trade-long-term-analytics-service.ts`
- `src/modules/level-analysis/server/daily-trade-v2-scenario-analyzer.ts`
- `src/modules/level-analysis/server/database/migrations/0134_daily_trade_analyzer_trend_momentum_history.ts`
- `src/modules/level-analysis/server/logical-trade-analyzer-notification-service.ts`
- `src/modules/level-analysis/server/logical-trade-analyzer-repository.ts`
- `src/modules/level-analysis/server/logical-trade-analyzer-selection-service.ts`
- `src/modules/level-analysis/server/logical-trade-moomoo-analyzer-worker.ts`
- `src/modules/level-analysis/server/providers/moomoo-daily-trade-kline-market-data-provider.ts`
- `src/modules/level-analysis/server/providers/moomoo-history-coverage.test.ts`
- `src/modules/level-analysis/server/saved-trade-day-summary.test.ts`
- `src/modules/level-analysis/server/saved-trade-day-summary.ts`
- `src/modules/level-analysis/server/saved-trade-period.test.ts`
- `src/modules/level-analysis/server/saved-trade-period.ts`
- `src/modules/level-analysis/server/saved-trade-scaling-sql.test.ts`
- `src/modules/level-analysis/server/saved-trade-scaling.test.ts`
- `src/modules/level-analysis/server/saved-trade-scaling.ts`
- `src/modules/level-analysis/server/shared-analyzer-allowance-repository.ts`
- `src/modules/level-analysis/server/trend-momentum-analytics-service.ts`
- `src/modules/level-analysis/server/trend-momentum-analyzed-trades.test.ts`
- `src/modules/level-analysis/server/trend-momentum-analyzed-trades.ts`
- `src/modules/level-analysis/server/trend-momentum-history-ranges.ts`
- `src/modules/level-analysis/server/trend-momentum-history-repository.ts`
- `src/modules/level-analysis/server/trend-momentum-history-service.test.ts`
- `src/modules/level-analysis/server/trend-momentum-history-service.ts`
- `src/modules/level-analysis/server/trend-momentum-landmark-inputs.ts`
- `src/modules/level-analysis/server/trend-momentum-movement-service.test.ts`
- `src/modules/level-analysis/server/trend-momentum-movement-service.ts`
- `src/modules/level-analysis/server/trend-momentum-notification.test.ts`
- `src/modules/level-analysis/server/trend-momentum-pattern-evidence.test.ts`
- `src/modules/level-analysis/server/trend-momentum-pattern-evidence.ts`
- `src/modules/level-analysis/server/trend-momentum-pattern-runtime.ts`
- `src/modules/level-analysis/server/trend-momentum-pattern-service.test.ts`
- `src/modules/level-analysis/server/trend-momentum-pattern-service.ts`
- `src/modules/level-analysis/server/trend-momentum-saved-population-sql.test.ts`
- `src/modules/level-analysis/server/trend-momentum-selection.test.ts`
- `src/modules/level-analysis/server/trend-momentum-storage.test.ts`
- `src/modules/level-analysis/server/trend-momentum-worker.test.ts`
- `src/modules/platform/server/database/platform-migration-file-contract.test.ts`
- `src/modules/platform/server/database/platform-migration-manifest.ts`

