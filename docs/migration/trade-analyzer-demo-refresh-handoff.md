# Demo Analyzer refresh handoff

Status: local technical checkpoint; NOT production accepted and NOT authority
to publish. On 2026-09-13 Coordinator lifted the temporary provider hold for
bounded owner-approved missing prior history through the existing Market Data
workflow. Current-day pinned receipts and all Demo facts must remain unchanged.

## Source and scope

- Worktree: C:/Users/jerac/Documents/TraderLink/worktrees/analyzer-trend-momentum-current-20260912
- Branch: codex/analyzer-trend-momentum-current-20260912
- Base before this Demo slice: 9b9b3a8867c9272db8503fd5512d81a3ba65636b
- Verified code checkpoint: b439ea3f3e8fa34851b43356c50e0be0ef40e17c
- Final documentation commit is supplied in the coordinator message.

This refreshes saved Demo analysis using the normal indicator policy and current
user-defined trade membership. It does not edit Demo financial packs, executions,
fees, selected real accounts, fixed Demo clock, Watchlist, broker credentials,
provider permissions, allowance settings or notification delivery.

The existing authenticated Demo ensure endpoint advances one candidate per
request, serially with a 500ms client yield. Existing complete current v3 results
are excluded before candle loading. Missing saved warm-up withholds only affected
indicator/timeframe values; missing current-day coverage leaves the previous
result intact. No provider request is initiated by the bounded pass.
Cleared Demo lifecycle remains cleared. The next page visit can retry after an
operator has supplied missing history. Raw native candle timestamps and original
receipt versions remain immutable; the calculation view converts native v1 end
labels to bar-start times. Conflicting overlapping receipts abort the refresh.

## Verification

Final local checkpoint on b439ea3f3: all ten changed test files / 47 tests pass
in one worker/512MB (29 seconds). All 22 changed TS/TSX roots have zero TypeScript
diagnostics; this is changed-root checking, not a full project build. Changed
code lint and whitespace checks pass. No local server/build, provider request,
hosted write, push, deployment or migration was part of this checkpoint.

Latest candidate: EMA9/EMA20 initialization is now nine/twenty completed candles,
separate from the unchanged preferred history acquisition target. RSI is still
independent. Read-only production-data execution of this candidate covered all
94 Demo examples and 361 executions: EMA20 was available at all 361 in both
1m and 5m. No result was written. This supersedes the earlier EMA unavailability
count, not the outstanding RSI history or integrated acceptance requirements.
Calculation v3 means previously saved v2 contexts require the existing history
refresh before entering the updated comparisons. No old financial facts change.

Subsequent partial-history correction now preserves observed prior minutes and
excludes uncovered 5m buckets, without changing partial receipt status or prices.
All 94 examples meet the preferred history target and all 361 executions have
1m/5m EMA20 and RSI. Independent reconstruction compared 2,527 execution values
(EMA9, EMA20, RSI, VWAP): zero failures, maximum absolute error
2.842170943040401e-14. Five focused files/28 tests and seven-file lint passed.
This supersedes the earlier remaining RSI/history limitation, not hosted
persistence, rendered/offline, provider-chart matching or owner acceptance.

2026-09-13 consolidated checkpoint: eight files / 31 tests pass, one worker,
512MB heap, no local server. All changed code passes targeted lint. Earlier
changed-root TypeScript checks pass; no full build was run here.

Tests include real-schema disposable base Demo persistence and a combined
two-round-trip trade, unchanged execution rows, idempotency, FK checks, receipt
selection/conflicts, route authorization boundaries, hidden-page pause/resume,
scope-change cancellation and retry pacing. Synthetic prior bars in the storage
fixture are NOT real-market numerical evidence. Route authorization dependencies
are mocked; live authentication still needs integrated acceptance.

## Required hosted completion

1. Read-only inventory of current Demo ownership/lifecycle, 94 Analyzer-backed
   source examples and actual current logical memberships. Preserve opt-outs.
2. Inspect exact pinned current-day receipts and already-saved compatible prior
   receipts before requesting anything. Five August source sessions are stored
   only in the database. Source-pack counts are not hosted counts.
3. Earlier-history inventory and first acquisition pass are complete: 20 complete
   prior sessions and eight partial nearest-prior sessions, with two additional
   partial earlier attempts. Do not repeat those requests. Observed-minute
   handling now supplies sufficient RSI history. CHOW has no analyzed base
   trade. Keep existing pacing/audit records and no ordinary Demo entitlement.
4. Reconcile this allowlist onto then-current main, verify Railway source main,
   exact release parent, backup, single writer, remote build/CI and health.
   No new migration or environment variable belongs to this Demo slice.
5. Run the bounded saved-only refresh for existing Demo accounts after history
   sufficiency is established. Verify all applicable examples, membership, fees,
   P/L, fixed date, indicator numbers, individual/combined pages, both timeframes,
   Light/Navy Dark/mobile, tooltips, offline update and repeat-visit behavior.
6. Record published SHA/parent, deployment ID/status, health and owner acceptance.
   A successful local test or source publication alone is not completion.

## Complete allowlist (26 paths)

- app/api/platform/journal/demo/ensure/route.ts
- app/demo-session-activation.tsx
- docs/migration/trade-analyzer-current-acceptance-handoff.md
- docs/migration/trade-analyzer-demo-refresh-handoff.md
- docs/migration/trade-analyzer-trend-momentum-plan.md
- docs/migration/trade-analyzer-trend-momentum-progress.md
- src/lib/trade-candle-analysis/trend-momentum-version.ts
- src/lib/trade-candle-analysis/trend-momentum-movement-filter.test.ts
- src/modules/help/trade-analyzer-guides.ts
- src/modules/journal/server/demo/demo-ensure-route.test.ts
- src/modules/journal/server/demo/demo-session-activation.test.ts
- src/modules/journal/server/demo/journal-demo-activation-refresh.test.ts
- src/modules/journal/server/demo/journal-demo-indicator-receipts.test.ts
- src/modules/journal/server/demo/journal-demo-indicator-receipts.ts
- src/modules/journal/server/demo/journal-demo-indicator-refresh.test.ts
- src/modules/journal/server/demo/journal-demo-indicator-refresh.ts
- src/modules/journal/server/demo/journal-demo-indicator-schema.test.ts
- src/modules/journal/server/demo/journal-demo-materializer.ts
- src/modules/journal/server/demo/journal-demo-trend-momentum-analysis.test.ts
- src/modules/journal/server/demo/journal-demo-trend-momentum-analysis.ts
- src/modules/level-analysis/server/trend-momentum-history-service.ts
- src/modules/level-analysis/server/trend-momentum-input.test.ts
- src/modules/level-analysis/server/trend-momentum-input.ts
- src/modules/level-analysis/server/providers/moomoo-analyzer-candle-time.ts
- src/modules/level-analysis/server/trend-momentum-history-repository.ts
- src/modules/level-analysis/server/trend-momentum-storage.test.ts
