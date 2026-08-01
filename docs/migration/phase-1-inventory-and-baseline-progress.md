# Phase 1 Inventory and Baseline Progress

**Phase:** 1 - Inventory and baseline  
**Status:** Complete and explicitly accepted by the project owner  
**Authorized:** 2026-07-31, explicitly by the project owner in the Phase 0 chat  
**Accepted:** 2026-08-01, after the owner confirmed the exact light Material dashboard baseline including Calendar week/month views  
**Allowed mutations:** migration documents under `docs/migration/` and required existing project handoff/progress records only  
**Prohibited:** product code changes, database writes/copies, process stops, folder/worktree removal, branch/worktree creation, commits, pushes, merges, deployments, production changes, and UI changes

## Canonical boundary at start

- Repository: `C:\Users\jerac\Documents\TraderLink\traderslink.pro`
- Branch: `main`
- HEAD: `4e19f51cdd5fceb8bf465b8eff0a21e0ee9314ca`
- Upstream: `origin/main`
- Remote: `https://github.com/traderslink-bot/traderslink-trader-improvement-system.git`
- Framework: Next.js `16.2.6`, React `19.2.4`
- Repository worktree: dirty with preserved Phase 0 documentation and pre-existing/in-progress product changes listed in the Phase 0 handoff
- Lowercase `agent.md`: absent; uppercase `AGENTS.md` is the applicable repository instruction file
- Approximate non-dependency file inventory at start: 2,909 paths, dominated by `src/`, vendored code, Academy, `app/`, `docs/`, and `public/`

## Required deliverables

| Deliverable | Status | Evidence/next action |
| --- | --- | --- |
| `product-inventory.md` | Draft complete | Product modules, operational surfaces, current dashboard, and legacy Intelligence family classified |
| `route-ownership.md` | Draft complete | 96 pages, 61 Route Handlers, one Server Action module, redirects, layouts, and source/doc conflict recorded |
| `database-ownership.md` | Draft complete | Backup-only `v4-temp-sql`, current configured source/counts, repository copies, schema owners, fallbacks, and migration gates recorded |
| `v3-dependency-map.md` | Draft complete | 107 direct references classified across pages, handlers, libraries, scripts, CI, safeguards, and ordered decoupling |
| `module-contracts.md` | Draft complete | Shared primitives and Platform, Journal, Analytics, Academy, Watchlist, News, Level Analysis, Coach, and Account boundaries defined |
| `analytics-capability-catalog.md` | Draft complete | First exact slice, all 126 V3 metric candidates, additional execution analytics, and trader/account/market fact requirements classified |
| `risk-register.md` | Draft complete | 35 evidence-backed data, architecture, workspace, privacy, resource, automation, UI-baseline, and acceptance risks recorded |
| `acceptance-inventory.md` | Draft complete | Phase 1 exit plus Platform, DB, Journal, Analytics, peer-module, route, cleanup, and final gates recorded |
| `workspace-inventory.md` | Draft complete | All 88 immediate folders classified across canonical worktrees, independent clones, old-repo worktrees, orphan pointers, and ordinary data/tool folders |
| `source-snapshot-and-untracked-manifest.md` | Draft complete | Branch/HEAD, five tracked modifications, 32 untracked files, and ignored private/runtime dependencies recorded |
| `operational-and-configuration-inventory.md` | Draft complete | Package/source scripts, CI, scheduled automation, environment names, processes, and external services classified |

## Workstream checklist

### A. Repository and product

- [x] Confirm canonical repository, branch, HEAD, upstream, remote, and dirty-state boundary.
- [x] Confirm framework/package baseline and top-level source distribution.
- [x] Inventory public pages and navigation-visible features.
- [x] Inventory Route Handlers, Server Actions, redirects/rewrites, scripts, schedules, environment names, and external services. Installed Windows scheduled-task state remains explicitly unknown because access was denied.
- [x] Map shared UI, authentication, platform, and module ownership.

### B. Data and V3

- [x] Locate every SQLite/SQL/database candidate without writing to it.
- [x] Inspect expected `v4-temp-sql` locations and code references read-only. It is absent from active paths, located in the July 29 backup, not configured, and owner-rejected as a migration source.
- [x] Trace database configuration fallbacks and current readers/writers at module level.
- [x] Map V3 dependencies from routes through server/domain/storage code.
- [x] Separate reusable safeguards from legacy dashboard authority/proof dependencies.

### C. Workspace preservation

- [x] Inventory every immediate parent folder and all registered worktrees, including those owned by the dirty legacy clone.
- [x] Record branch, HEAD, contained/unique commit state, dirty/untracked summary, and dependency clues for TraderLink-like folders.
- [x] Classify folders as Keep, Reconcile, Archive, Remove later, or Do not touch.
- [x] Produce recommendations only; no target was removed or mutated.

### D. Replacement boundary

- [x] Build the analytics capability catalog and first exact reconciliation contract.
- [x] Define module contracts and route/storage ownership recommendations.
- [x] Complete the risk and acceptance inventories.
- [x] Reconcile all read-only `UNKNOWN` entries or explicitly carry them to the owner checkpoint with an evidence plan. The installed Big Time task target and exact legacy-DB lock owner remain machine-state gates for later authorized operations.
- [x] Update the migration register and master progress record.
- [x] Present the Phase 1 exit package for explicit owner acceptance.

## Running evidence notes

- The current repository has a real `.git` directory and is the canonical source checkout, not a linked worktree.
- `package.json` still contains extensive `verify:ti-v3:*` scripts and the protected V3 local-server launcher, confirming that V3 dependencies remain materially present and require mapping rather than name-based deletion.
- Current source contains 96 page routes and 61 Route Handlers. The dashboard family contains 24 pages, the legacy `/intelligence` family contains 52, and Platform/peer modules contain 20.
- `docs/routes.md` is stale for the dashboard family: current source does not redirect `/workspace`, `/analytics/*`, `/trades/*`, or `/imports/*` into `/intelligence`.
- The parent workspace has 88 immediate folders. The canonical repository registers 43 worktrees in total; 17 non-canonical worktrees have commits not contained by current local `main`. The old dirty `trader-intelligence-v2` clone owns another active/prunable worktree family.
- Port `127.0.0.1:3000` is currently served by Node PID 3160 using roughly 1.28 GB working memory. Its exact working directory and its relationship to the locked database remain unproven.
- No database, process, route, or product behavior has been changed during Phase 1.
- Owner clarification accepted into the plan: preserve the light Material dashboard/complete left navigation; use one clean planned `traderlink-platform` checkout for replacement work; keep the original folder intact; preserve but defer Big Time; exclude backup-only `v4-temp-sql` from migration source selection.
- The accepted dashboard is the current source-owned light Material shell whose navigation includes Workspace; Trades with Calendar, Trade Tracker, Round Trips, Trades by Ticker, and Open Positions; Analytics with Overview, Performance, Results, Timing, Execution, and Analytics Lab; Reflection Loop; Trading Rules; Market Charts; and Data with Import Trades, Manual Entry, and Data Decisions. Calendar's week/month views are preservation requirements.
- The project owner explicitly accepted Phase 1 on 2026-08-01. Phase 2 remains unauthorized until the owner starts it explicitly.
