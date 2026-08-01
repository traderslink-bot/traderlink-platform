# Phase 0 Planning Handoff

> Historical Phase 0 boundary: Phase 1 later proved that `v4-temp-sql` is absent from active paths, exists only inside the July 29 backup, and is not the configured database. Use the current master plan and Phase 1 tracker for current state.

**Phase:** 0 - Planning  
**Status:** Complete and explicitly accepted by the project owner  
**Acceptance date:** 2026-07-31  
**Next phase:** 1 - Inventory and baseline; a new chat is recommended but not mandatory  

## Canonical repository state at closure

- Repository: `C:\Users\jerac\Documents\TraderLink\traderslink.pro`
- Branch: `main`
- HEAD: `4e19f51cdd5fceb8bf465b8eff0a21e0ee9314ca`
- Working tree: dirty; it contains both Phase 0 documentation and pre-existing/in-progress work that must be preserved.

The closure status showed these tracked modifications:

```text
AGENTS.md
app/api/intelligence/dashboard/overview/route.ts
plan.md
src/docs/codex-project-log.md
src/lib/trader-analytics/product/import-commit/sqlite-import-commit-repository.ts
```

It also showed these untracked paths:

```text
.agents/
data/v3-dashboard/
docs/migration/
scripts/load-temporary-ibkr-statement.ts
skills-lock.json
src/lib/trader-analytics/__tests__/workspace-overview-api-route.test.ts
src/lib/trader-analytics/server/saved-report-overview-adapter.ts
src/scripts/__tests__/
traderlink_platform_replacement_migration_plan.md
workspace-main-server-error.log
workspace-main-server-restart-error.log
workspace-main-server-restart.log
workspace-main-server.log
workspace-server.log
```

Do not assume that a listed path belongs solely to Phase 0. Do not discard, revert, commit, or relocate it until Phase 1 classifies ownership and preservation requirements.

## Database and process state

- Phase 0 did not verify which SQLite database currently serves the application.
- `traderslink.pro/v4-temp-sql` is an unverified candidate store, not an accepted source of truth.
- The January IBKR figures in the plan are historical baseline evidence and must be freshly tied to an exact database before acceptance use.
- Phase 0 did not inventory live processes or ports and did not start, stop, or replace a process.

Phase 1 must verify these facts read-only before making current-state claims.

## Completed and accepted decisions

- TraderLink Platform is a modular Next.js monolith; Journal Analytics is not the application architecture.
- V3 analytics is legacy and will not remain the ordinary dashboard dependency.
- Data Decisions is foundational, and the trader controls factual corrections from statement/account evidence.
- Valid unrelated data remains visible when another execution chain needs a decision.
- Broker and manual executions share one canonical ledger with source provenance.
- Reconstruction uses complete chronological owner/account/instrument/currency execution history regardless of statement upload order.
- A round trip begins when position leaves zero and closes when it returns to zero.
- Trade Tracker must preserve actual execution dates and cross-day round trips; its future multi-day UI is deferred for a separate owner-reviewed plan.
- At the Phase 0 checkpoint the default was one canonical repository. On 2026-08-01 the owner selected one clean, traceable replacement checkout while preserving the original as recovery/reference. Folder/worktree cleanup still requires evidence and explicit path-by-path owner approval.
- Every migration phase has an owner-approved scope handoff; short phases may share a chat, while large phases may use a fresh or continuation chat.

## Phase 1 authorized scope

Phase 1 authorizes read-only inspection plus creation and maintenance of the required inventory, analysis, risk, and progress documents under `docs/migration/`. It does not authorize product or data mutation. Phase 1 must:

1. build the complete product, route, API, script, schedule, environment, database, and V3-dependency inventories;
2. inventory parent folders/worktrees and present Keep, Reconcile, Archive, Remove later, and Do not touch groups without deleting anything;
3. classify active, redirected, deprecated, and unknown routes, especially `/intelligence`;
4. map database/store ownership, inspect `v4-temp-sql`, and create the source snapshot manifest;
5. build the complete analytics capability catalog and exact contracts for the first reconciliation slice;
6. define the canonical repository path, accepted source commit, and intentional-untracked-file manifest without presuming another sibling folder; and
7. present the complete Phase 1 evidence and replacement-start boundary for owner approval.

## Still prohibited

Phase 1 does not authorize feature implementation, database writes or copies, process stops, folder/worktree removal, branch/worktree creation, commits, pushes, merges, deployments, production changes, or UI changes. It must not treat historical counts as current without fresh evidence.

## Phase 1 exit

Update every controlling inventory, the migration register, and `migration-progress.md`; record remaining unknowns and recommendations; satisfy the Phase 1 exit condition in the master plan; obtain explicit owner acceptance; then give the owner the ready-to-copy Phase 2 prompt.
