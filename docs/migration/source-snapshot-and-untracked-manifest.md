# Phase 1 Source Snapshot and Untracked Manifest

**Snapshot date:** 2026-07-31  
**Repository:** `C:\Users\jerac\Documents\TraderLink\traderslink.pro`  
**Branch/HEAD:** `main` / `4e19f51cdd5fceb8bf465b8eff0a21e0ee9314ca`  
**Upstream:** `origin/main`; local main was 70 commits ahead at Phase 1 start  
**Purpose:** Preserve ownership of existing work. This is not a staging, commit, or cleanup instruction.

## Tracked modifications present at the Phase 1 snapshot

| File | Current ownership/status |
| --- | --- |
| `AGENTS.md` | Phase 0 replacement direction plus existing project rules; intentional migration documentation change |
| `app/api/intelligence/dashboard/overview/route.ts` | Pre-Phase-1/in-progress Workspace overview repair; uncommitted and unverified; preserve without treating as baseline acceptance |
| `plan.md` | Legacy roadmap supersession/status edits from Phase 0; preserve as historical-document update |
| `src/docs/codex-project-log.md` | Required project resume record updated for the migration |
| `src/lib/trader-analytics/product/import-commit/sqlite-import-commit-repository.ts` | Pre-Phase-1 temporary IBKR/loading support; product-code change not owned or modified by Phase 1 |

At the captured diff, these five files contained 319 insertions and 40 deletions in total. Phase 1 does not claim ownership of the product-code changes and has not edited them.

## Untracked files at the Phase 1 accepted closure: 42

The initial Phase 1 record counted 32 untracked paths. The accepted closure contains 42 because the required Phase 1 documents and handoff were added and every current SQLite sidecar is counted explicitly. The complete current manifest follows.

### Phase 0/1 migration records

- `docs/migration/database-ownership.md`.
- `docs/migration/acceptance-inventory.md`.
- `docs/migration/analytics-capability-catalog.md`.
- `docs/migration/import-integrity-and-data-decisions-contract.md`.
- `docs/migration/migration-progress.md`.
- `docs/migration/migration-register.md`.
- `docs/migration/module-contracts.md`.
- `docs/migration/operational-and-configuration-inventory.md`.
- `docs/migration/phase-0-planning-handoff.md`.
- `docs/migration/phase-1-inventory-and-baseline-progress.md`.
- `docs/migration/phase-1-inventory-and-baseline-handoff.md`.
- `docs/migration/phase-handoff-template.md`.
- `docs/migration/product-inventory.md`.
- `docs/migration/risk-register.md`.
- `docs/migration/route-ownership.md`.
- `docs/migration/source-snapshot-and-untracked-manifest.md`.
- `docs/migration/traderlink-platform-replacement-plan.md`.
- `docs/migration/v3-dependency-map.md`.
- `docs/migration/workspace-and-worktree-cleanup-plan.md`.
- `docs/migration/workspace-inventory.md`.

These files are intentional documentation work, but no commit is authorized.

### Existing tool/skill records

- `.agents/skills/lightweight-charts/SKILL.md`.
- `skills-lock.json`.

Preserve. Their installation/provenance should be confirmed before an eventual commit; do not delete as unrelated clutter.

### Temporary IBKR/Workspace implementation work predating Phase 1

- `scripts/load-temporary-ibkr-statement.ts`.
- `src/scripts/__tests__/load-temporary-ibkr-statement.test.ts`.
- `src/lib/trader-analytics/__tests__/workspace-overview-api-route.test.ts`.
- `src/lib/trader-analytics/server/saved-report-overview-adapter.ts`.

Preserve and reconcile at the Phase 1 exit/Phase 2 start. The loader passed its earlier focused check, but the Workspace endpoint repair remains uncommitted and unverified.

### Database/data evidence

- `data/v3-dashboard/dashboard-database-structure.txt`.
- `data/v3-dashboard/trading-rules-v1.sqlite` plus WAL/SHM.
- `data/v3-dashboard/trading-rules-v1-backup-2026-07-30.sqlite` plus WAL/SHM.
- `data/v3-dashboard/trading-rules-v1.sqlite.2026-07-31T02-51-04-825Z.before-temporary-ibkr-load.bak` plus WAL/SHM.

Preserve as private migration evidence. These working copies/backups do not belong in the future repository, but removal/movement requires accepted backup, provenance, hash, and reconciliation records.

### Superseded root plan

- `traderlink_platform_replacement_migration_plan.md`.

Preserve as the explicitly superseded draft until the accepted plan package is committed/archived deliberately. The controlling plan is under `docs/migration/`.

### Runtime logs

- `workspace-main-server.log`.
- `workspace-main-server-error.log`.
- `workspace-main-server-restart.log`.
- `workspace-main-server-restart-error.log`.
- `workspace-server.log`.

Preserve temporarily as debugging evidence. They are not product source; retention/removal should occur only after the Workspace failure and current PID/port ownership are resolved.

## Ignored private/runtime files observed

- `.env.local`.
- `data/trader-intelligence.sqlite` plus WAL/SHM.
- `data/live-watchlist.sqlite` plus WAL/SHM.
- `data/private/`, including `trade-journal-v1.sqlite` and sidecars.

These are intentional ignored dependencies/private data. They must not be staged, exposed, or removed through workspace cleanup.

## Preservation rules

1. Do not use `git clean`, reset, checkout-overwrite, or broad deletion against this worktree.
2. Do not assume untracked means disposable.
3. Before a future commit, split migration documentation, accepted product implementation, tools/skills, and private/runtime artifacts into deliberate ownership decisions.
4. Never commit SQLite/WAL/SHM files, private statements, `.env.local`, or raw logs containing owner data.
5. Re-run this manifest before any future commit, cleanup, or database operation because the working tree remains active.
