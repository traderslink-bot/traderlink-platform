# TraderLink Platform Migration Progress

**Current phase:** Phase 1 - Inventory and baseline, complete and explicitly accepted on 2026-08-01. Phase 2 is not yet authorized.  
**Current implementation state:** No replacement folder, database, process, product route, or deployment has been changed by this planning package.

## Completed planning decisions

- The product direction is a modular platform; Journal Analytics is not the platform architecture.
- A practical replacement analytics path may replace V3 for ordinary dashboards.
- Data correctness remains strict at source-row, execution, round-trip, and metric scope.
- Data Decisions is a required Journal foundation; the trader makes the final factual decision from statement evidence.
- Valid unrelated round trips must remain visible when another round trip needs a decision.
- Statement upload order is irrelevant; reconstruction uses the full chronological execution history for the affected account/instrument/currency chain.
- A round trip starts when position leaves zero and closes when it returns to zero; the next execution after zero begins a new trade.
- Broker-imported and manual Trade Tracker executions share one canonical ledger while preserving source provenance.
- Manual executions use their actual execution date/time and never combine daily notes across trading dates. The future multi-day Trade Tracker presentation is deliberately deferred for a separate UI plan and owner review.
- January IBKR data is test data, not a complete live customer migration source.
- The architecture is TraderLink Platform; V4 is optional only as a later release label.
- Workspace/folder cleanup requires a user-visible Git and data audit before any removal.
- The current legacy application remains preserved until complete owner-approved replacement acceptance.
- The approved dashboard preservation baseline is the light Material UI design with the complete left navigation. A dark or reduced legacy/experimental shell is not the final dashboard.
- The accepted Calendar has week/month views and sits under Trades in that same dashboard navigation.
- The replacement will be built in one clean, traceable full checkout planned at `C:\Users\jerac\Documents\TraderLink\traderlink-platform`. The current `traderslink.pro` folder remains intact as a recovery/reference archive and need not be deleted.
- `v4-temp-sql` was located inside `C:\Users\jerac\Documents\traderslink.pro back up july 29`; it is an early experiment, not configured, and owner-rejected as a migration source.
- The selected replacement development database path is `C:\Users\jerac\Documents\TraderLink\private-data\traderlink-platform\development.sqlite`; it does not exist and awaits Phase 2 authorization.
- Big Time weekly content automation is preserved but explicitly deferred as a low-priority News operation outside the core Journal/database replacement.

## Current verified local baseline

| Measure | Value | Meaning |
| --- | --- | --- |
| Normalized executions | 1,072 | January IBKR test dataset |
| Saved trades | 336 | Derived current local data |
| Closed trades | 334 | Candidate realized-P/L population after eligibility checks |
| Open trades | 2 | Must remain visible separately from realized analytics |
| Workspace overview | Unverified | Existing repair is uncommitted and not accepted |

The currently configured local source is `C:\Users\jerac\Documents\TraderLink\private-data\v3-dashboard\trading-rules-v1.sqlite`. `v4-temp-sql` exists only inside the July 29 backup and is not the configured database.

## Phase 1 inventory findings

- Current source has 96 page routes and 61 Route Handlers: 24 dashboard pages, 52 legacy `/intelligence` pages, and 20 Platform/peer-module pages.
- The dashboard family is real source, not redirected wholesale into `/intelligence`; older route documentation is stale.
- 107 source files directly reference V3. Default local runtime and CI remain V3-coupled.
- Current local storage fallbacks can mix Platform/Academy, News, Watchlist, affiliate, Level Analysis, rules, tags, and Journal data under confusing paths.
- The parent workspace has 88 immediate folders. Seventeen canonical worktrees have commits outside current main, and the old `trader-intelligence-v2` repository/worktrees contain substantial dirty/unique work.
- Node PID 3160 serves port 3000 and used roughly 1.28 GB working memory at observation; it and the active database were not stopped.
- The Big Time scheduler source can mutate Git and deploy production; installed Windows task state/path is still unknown because task enumeration was denied.
- Module contracts, the 126-metric migration catalog, additional possible analytics, risks, and acceptance gates are now drafted under `docs/migration/`.

## Phase 0 exit checklist

- [x] Master replacement plan created in `docs/migration/`.
- [x] Import Integrity and Data Decisions contract created.
- [x] Migration register created.
- [x] Per-phase chat and handoff protocol created.
- [x] Legacy V3 plan and agent guidance marked as superseded for future platform work.
- [x] Project owner explicitly accepted the Phase 0 planning package on 2026-07-31.

## Phase 0 acceptance and handoff

The approved closure record is [Phase 0 Planning Handoff](phase-0-planning-handoff.md). It records the repository and working-tree state, the unverified database/process boundaries, accepted decisions, deferred work, exact Phase 1 scope, and prohibited actions.

The owner explicitly authorized Phase 1 in the current chat on 2026-07-31. Phase 1 remains limited to inspection and migration-document work. Its live tracker is [Phase 1 Inventory and Baseline Progress](phase-1-inventory-and-baseline-progress.md).

## Phase 1 acceptance and next boundary

1. The owner accepted the Phase 1 inventory, folder dispositions, current legacy source, backup-only V4 conclusion, approved dashboard/Calendar baseline, clean replacement path, module contracts, analytics first slice, risks, and replacement-start boundary on 2026-08-01.
2. Carry the two machine-state unknowns forward with explicit evidence gates: the installed Big Time scheduled-task target must be proven only before that low-priority automation is changed/reactivated or its related folder is considered for cleanup, and the exact process holding the legacy database must be proven before a later authorized stop/copy.
3. Phase 2 may begin only when the owner explicitly authorizes it, either in this chat or by using the ready-to-copy Phase 2 prompt in the Phase 1 handoff.

No feature code, database copy, process stop, replacement-folder creation, deployment, or deletion is authorized by this tracker.
