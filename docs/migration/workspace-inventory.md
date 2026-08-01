# TraderLink Workspace Inventory

**Phase:** Phase 1 inventory preserved; Phase 2 correction and preservation evidence added
**Status:** Inventory complete; the independent replacement clone exists, the omitted unified-account beta is now preserved locally for reconciliation, and all cleanup dispositions still require owner approval
**Root inspected:** `C:\Users\jerac\Documents\TraderLink`
**Rule:** No folder, worktree, Git metadata, branch, process, database, or scheduled task was changed or removed.

## Planned replacement and external backup clarification

- `C:\Users\jerac\Documents\TraderLink\traderlink-platform` now exists as the active replacement implementation candidate. It is a full independent clone on `codex/traderlink-platform-replacement` at `a3193e19806af955093aa236349d796171d9bf97`, with the recorded GitHub remote and no upstream, push, or deployment. It was created after the dated 88-folder Phase 1 snapshot and therefore is not included in that historical count.
- `C:\Users\jerac\Documents\traderslink.pro back up july 29` sits outside the audited `TraderLink` parent and is an owner-identified backup. Its `v4-temp-sql` subfolder is an early experiment, not an active database. Preserve the entire backup; do not treat it as an implementation workspace or cleanup target.
- `C:\Users\jerac\Documents\TraderLink\traderslink.pro` remains intact as the legacy recovery/reference folder throughout migration and may remain indefinitely after acceptance.

## Executive finding

The parent workspace contains **88 immediate directories**. The confusion comes from several overlapping generations:

- the one canonical `traderslink.pro` repository;
- 34 sibling worktrees registered to that repository;
- 8 more registered worktrees under Codex visualization folders;
- 10 independent Git clones/repositories beside the canonical repository;
- 20 immediate worktrees belonging to the older dirty `trader-intelligence-v2` clone;
- 9 orphaned Levels System worktree folders whose referenced Git directory no longer exists; and
- 14 ordinary data, backup, tool, recovered, or unregistered project folders.

These categories account for all 88 immediate directories in the dated Phase 1 snapshot without treating names as evidence that a folder is obsolete. The subsequently created `traderlink-platform` clone is recorded separately and does not retroactively change that snapshot.

## Preserved legacy repository and active replacement candidate

| Path | Branch/HEAD | State | Disposition |
| --- | --- | --- | --- |
| `C:\Users\jerac\Documents\TraderLink\traderslink.pro` | `main` / `a3193e1980` | Two tracked product modifications and 22 untracked preservation files; 72 commits ahead of the locally recorded `origin/main` | **Keep as legacy recovery/reference.** It remains the complete legacy/production reference and receives only explicitly approved emergency or preservation work during migration. |
| `C:\Users\jerac\Documents\TraderLink\traderlink-platform` | `codex/traderlink-platform-replacement` / `a3193e1980` | Independent clone; clean at the owner-accepted clone checkpoint; current changes are documentation-only and uncommitted | **Keep as active replacement candidate.** All new replacement implementation belongs here within the authorized migration checkpoint. |

## Worktrees registered to the canonical repository: 43 total

All non-canonical registered worktrees were clean at inspection time. `Head-only` means commits reachable from that worktree HEAD but not from current local `main`; it does not prove those changes are still desired or absent from another branch.

### Reconcile before any removal: 17 worktrees with head-only commits

| Location | Branch/status | Head-only commits |
| --- | --- | ---: |
| Codex visualization `019fb135...` | `codex/analytics-overview` | 3 |
| Codex visualization `019fb1cc...` | `codex/round-trips-v3-pagination` | 1 |
| Codex visualization `019fb478.../trade-candle-analyzer-review` | detached | 1 |
| `traderslink-v3-journal-preview` | `codex/v3-journal-preview` | 12 |
| `traderslink.pro-auth-fix-20260721` | `codex/watchlist-discord-premium-auth` | 1 |
| `traderslink.pro-calendar-v3` | `codex/calendar-v3-dashboard` | 1 |
| `traderslink.pro-import-repair-beta` | `codex/import-repair-beta` | 1 |
| `traderslink.pro-import-repair-main-integration` | `codex/import-repair-main-integration` | 2 |
| `traderslink.pro-levelmap-deploy-20260622-081337` | `codex/watchlist-level-map-live-20260622-081337` | 7 |
| `traderslink.pro-market-closed-deploy-20260721` | detached | 1 |
| `traderslink.pro-news-free-deploy` | `codex/news-company-info-safe-deploy` | 1 |
| `traderslink.pro-reverse-splits-deploy-20260709-165701` | `codex/reverse-splits-page-20260709-165701` | 8 |
| `traderslink.pro-ti-eodhd-basis-deploy-20260712` | `codex/production-eodhd-basis-safety` | 2 |
| `traderslink.pro-v2-prototype-preservation-20260718` | `agent/trader-intelligence-v2-prototype-preservation` | 1 |
| `traderslink.pro-watchlist-lifecycle-labels-20260720` | `codex/watchlist-lifecycle-labels-20260720` | 4 |
| `traderslink.pro-watchlist-v2-cards` | `codex/watchlist-v2-cards` | 1 |
| `waaf` | `codex/watchlist-archive-ai-read-fix` | 1 |

Recommended disposition: **Reconcile**. Compare each unique commit to current product behavior and the controlling inventory. Port an accepted capability intentionally, preserve a branch/archive if still useful, or record an owner-approved rejection. Do not bulk merge old branches.

### Preserved recent unified-account beta: reconcile, do not remove

The Phase 1 list incorrectly placed `codex/unified-accounts-beta` among clean,
contained removal-later candidates. A direct audit found 14 tracked modifications
and 29 untracked paths containing unfinished recent account and authentication
work. The exact working state is now preserved on its existing branch at local
commit `5305ee29a61ab44fa6238e2b4725957ad1917fe6` (`chore(accounts): preserve
unfinished unified account beta`); the worktree was clean after preservation and
nothing was pushed.

The snapshot is reference input, not replacement-ready code. It includes drafts
for user/workspace/account ownership, email/password, optional Discord identity,
sessions, and account UI, but it had no completed focused verification and uses a
different persistence approach. Do not bulk merge or cherry-pick it. Reconcile
useful contracts selectively in Phase 5. Public login is deferred until the
complete dashboard is preparing to go live, with Discord first and email/password
optional. This worktree is **Preserve / Reconcile**, not a cleanup candidate.

### Clean and contained by current main: 24 removal-later candidates

Codex visualization worktrees:

- `codex/trade-tracker-complete`.
- `codex/round-trip-detector-ordering-fix`.
- `codex/main-dashboard-integration`.
- `codex/trade-candle-analyzer-experiment`.

Sibling worktrees:

- `traderslink.pro-access-restore-20260713-090225`.
- `traderslink.pro-ai-read-parser-contract-20260723`.
- `traderslink.pro-archive-ticker-details-20260721`.
- `traderslink.pro-auth-prod-20260721`.
- `traderslink.pro-import-repair-final-main`.
- `traderslink.pro-kapa-date-fix-20260716`.
- `traderslink.pro-news-company-prod-20260714`.
- `traderslink.pro-potential-gain-prod-20260716`.
- `traderslink.pro-potential-path-prod-20260715`.
- `traderslink.pro-preserved-20260715`.
- `traderslink.pro-provenance-prod-20260714`.
- `traderslink.pro-ti-eodhd-prod-deploy-20260712`.
- `traderslink.pro-tradingview-chart-prod-20260720`.
- `traderslink.pro-tradingview-chart-prod2-20260720`.
- `traderslink.pro-tradingview-height-fix-20260720`.
- `traderslink.pro-v2-cards-prod-deploy-20260710`.
- `traderslink.pro-watchlist-ai-audit-remediation-20260717`.
- `traderslink.pro-watchlist-deploy`.
- `traderslink.pro-watchlist-sessions-prod-20260716`.
- `traderslink.pro-watchlist-truth-prod-20260720`.

Recommended disposition: **Remove later**, but only after checking ignored/private files, environment/process/schedule/deployment references, and presenting the exact removal list to the owner. Their commits are contained by current local `main`; that is necessary but not sufficient cleanup proof.

## Independent sibling Git repositories/clones: 10

| Folder | Evidence | Disposition |
| --- | --- | --- |
| `levels-system-repaired` | Separate `levels-system.git` remote; `main` at `ebc6164ee4`; 4 untracked files | **Keep/reconcile** as separate Levels System source candidate; compare to `vendor/levels-system-v2`. |
| `trader-intelligence-v2` | Same TraderLink remote; branch `codex/trader-ui-product-pass` at a commit unknown to canonical Git; 25 tracked changes and 328 untracked files | **Do not touch. Reconcile first.** This is a large dirty legacy source/data workspace. |
| `traderslink.pro-csv-deploy` | Clean; HEAD contained by canonical `main` | Remove later after dependency check |
| `traderslink.pro-potential-path-prod-main-20260715` | Clean; HEAD contained by canonical `main` | Remove later after dependency check |
| `traderslink.pro-prod-main-20260720` | Clean; HEAD contained by canonical `main` | Remove later after dependency check |
| `traderslink.pro-provenance-live-deploy-20260714` | Clean; HEAD contained by canonical `main` | Remove later after dependency check |
| `traderslink.pro-v3-production-deploy-20260722` | HEAD contained by canonical `main`; 1 tracked change | **Reconcile dirty file**, then remove later if no dependency |
| `traderslink.pro-watchlist-sessions-main-deploy-20260716` | Clean; HEAD contained by canonical `main` | Remove later after dependency check |
| `traderslink.pro-weekahead-automation` | HEAD contained by canonical `main`; 4 tracked changes and 1 untracked file | **Do not touch.** Reconcile changes and scheduled-task dependency first. |
| `website` | Separate `master` repository with no `origin`; 6 tracked changes and 192 untracked files | **Do not touch.** Separate/stale product source requires its own preservation decision. |

## Worktrees owned by the older `trader-intelligence-v2` repository

The old repository registers active worktrees in the parent folder and Codex directories plus **19 prunable metadata entries** whose working directories no longer exist. No prune was run.

### Dirty active old-repository worktrees

- Root `trader-intelligence-v2`: 25 tracked and 328 untracked files; HEAD not known by the canonical repository.
- Codex visualization `...019fa9b2.../v3-dashboard-analytics`: 6 tracked and 7 untracked files.
- Codex visualization `...019faa51.../v3-dashboard-adapter-wiring`: 2,538 untracked paths.
- `.codex/worktrees/trade-execution-v3-m4-dashboard-panels`: 9 tracked and 10 untracked files.
- `trader-intelligence-v2-academy-hotfix`: 1 tracked change.
- `trader-intelligence-v2-svg-qa`: 1 tracked change.
- `trader-intelligence-v2-user-dashboard-admin-separation`: 12 tracked changes.

All are **Do not touch / Reconcile**. A contained base commit does not preserve their working-tree changes.

### Clean old-repository worktrees whose HEAD is contained by canonical main

- `trade-intelligence-v3-analytics-agent-v1-completion`.
- `trade-intelligence-v3-analytics-agent-v1-execution-coverage-pack-b`.
- `trade-intelligence-v3-analytics-agent-v1-execution-question-coverage`.
- `trade-intelligence-v3-analytics-agent-v1-foundation`.
- `trader-intelligence-v2-ci-hardening`.
- `trader-intelligence-v2-journal-ingestion`.
- `trader-intelligence-v2-level-analysis-adapter`.
- `trader-intelligence-v2-main-merge`.
- `trader-intelligence-v3-ga0-a3-manifests`.
- `trader-intelligence-v3-ga0-b1-read-model`.
- `trader-intelligence-v3-ga0-b2-weekday-proof`.
- `trader-intelligence-v3-ga0-b4-proof-closeout`.
- `trader-intelligence-v3-query-simulation-direction-lock`.

Recommended disposition: **Archive/remove later**, after the old root's dirty state and all dependencies are reconciled.

### Clean old-repository worktrees not contained by canonical main

- `trade-intelligence-v3-analytics-agent-v1-session-questions`.
- `trader-intelligence-v2-journal-scope-hardening`.
- `trader-intelligence-v3-ga0-a1-containment`.
- `trader-intelligence-v3-ga0-b3-daily-stop-proof`.

`trader-intelligence-v2-academy-hotfix` and `trader-intelligence-v2-user-dashboard-admin-separation` also have uncontained HEADs but are dirty and appear in the earlier list. Recommended disposition for all six: **Reconcile unique behavior/commits**, with V3 proof-only work preserved as historical evidence rather than automatically ported.

## Orphaned Levels System worktree folders: 9

These folders contain `.git` pointer files referencing `C:\Users\jerac\Documents\TraderLink\levels-system\.git\worktrees\...`, but `levels-system` is not currently a functioning Git repository. Their Git state cannot be trusted from the pointer alone:

- `levels-system-post-mtf-handoff-stability`.
- `levels-system-rescue-only`.
- `ls-baseline-drift`.
- `ls-baseline-refresh-decision`.
- `ls-cache-fingerprint-contract`.
- `ls-cache-fingerprint-wiring`.
- `ls-vs-context-builder`.
- `ls-vs-context-contract`.
- `ls-vs-context-wiring`.

Disposition: **Do not touch / Recover or compare**. Compare their source to `levels-system-repaired` and the canonical repository's vendored `levels-system-v2` before any archive or removal.

## Ordinary/non-registered folders: 14

| Folder | Observed role | Disposition |
| --- | --- | --- |
| `backups` | Backup storage | Keep; inventory contents before any future retention policy |
| `discordbots` | Separate automation/bot area | Keep/separate project |
| `import-repair-review-data` | Import review evidence/data | Keep through Journal migration reconciliation |
| `levels-system` | Non-Git source/data directory with package metadata | Reconcile with repaired repo and vendored package |
| `levels-system-recovered` | Empty directory confirmed read-only at the Phase 1 exit checkpoint | **Remove later candidate**, but only in an owner-approved cleanup batch after the parent inventory is refreshed |
| `old-levels-sytem-docs` | Historical Levels System documents | Archive candidate, not deletion candidate |
| `playwright` | Active separate automation project with `.env` and data | **Do not touch**; current Big Time installer references its press-release env file |
| `private-data` | Active private Journal database root | **Keep; never remove as workspace cleanup** |
| `Promtional` | Promotional assets/content | Keep as separate content until owner classifies it |
| `trader-intelligence-dashboard-recovery` | Unregistered app recovery copy with `.env.local` and data | Reconcile unique source/private data, then archive |
| `trader-intelligence-v3-analytics-local` | Unregistered analytics app/data copy | Reconcile useful behavior/data, then archive |
| `traderlink-v3-seven-statement-staging` | Historical statement-staging evidence | Keep through import/data reconciliation |
| `traderslink.pro-dedupe-prod-20260714-1525` | Small deployment/deduplication artifact | Inspect exact content, then archive/remove later |
| `traderslink.pro-trade-execution-analytics-v1-20260726` | Unregistered app/data copy | Reconcile useful analytics/data, then archive |

## Scheduled and running dependency evidence

- The canonical repository contains an installer for a Windows task named `TradersLink BigTime Week-Ahead Scraper`, scheduled Sundays at 5:00 PM. Its runner can pull, commit, push, open/merge a PR, and deploy production. It also references `playwright\projects\press_release_levels_v2\.env.press_release_v2`.
- Windows denied the Phase 1 scheduled-task query, and no local Big Time status file was present. Therefore whether the task is installed, and which repository path it uses, is **UNKNOWN**. `traderslink.pro-weekahead-automation` and `playwright` must not be removed until this is resolved.
- Port `127.0.0.1:3000` is listening under Node PID 3160. At observation it used approximately 1.28 GB of working memory and started on 2026-07-30 at 11:24 PM. The exact command line/working directory was unavailable under current permissions.
- The configured private database is held open by a process. It is plausible that PID 3160 is the holder, but Phase 1 cannot prove that link and does not stop it.

## Cleanup order recommended to the owner

1. Keep the preserved legacy repository, active replacement candidate, `private-data`, backups, Playwright, separate bot/tool projects, and all dirty/unique workspaces unchanged.
2. Preserve the legacy repository's current product work. Reconcile or commit/archive it only through a separate owner-approved emergency, preservation, or cleanup checkpoint; it is not the normal replacement implementation location.
3. Reconcile the 17 canonical worktrees with head-only commits.
4. Reconcile the dirty `trader-intelligence-v2` clone, its dirty worktrees, and the six active branches not contained by canonical main.
5. Reconcile Levels System orphan/repaired/vendor sources.
6. Resolve the installed scheduled-task path and all active process/environment references.
7. Present a first exact removal batch consisting only of clean, contained, dependency-free worktrees/clones.
8. After owner approval, remove registered worktrees through Git rather than deleting folders directly; archive recovery evidence where appropriate.
9. Re-run the full folder/worktree inventory after each approved cleanup batch.

No cleanup batch is authorized by this inventory itself.
