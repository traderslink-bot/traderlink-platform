# Workspace and Worktree Cleanup Plan

**Status:** Planning control updated for the active replacement candidate and the preserved unified-account beta correction; no folder deletion is authorized.
**Scope:** `C:\Users\jerac\Documents\TraderLink` and Git worktrees registered to TraderLink repositories.
**Purpose:** Make the development workspace understandable without losing features, commits, configuration, private data, or recovery options.

## Preliminary observation

A read-only check on 2026-07-31 found 88 directories immediately under the TraderLink parent folder, 35 registered worktrees located directly under that parent, 43 registered worktrees in total when Codex visualization locations are included, 39 additional Git project folders not registered as worktrees, and 5 project-like folders with a package manifest but no detected Git marker.

These counts confirm real workspace confusion, but they do not prove that any folder is disposable. The parent also contains separate projects and private-data areas that are not duplicate TraderLink applications and must not be swept into a cleanup.

The Trade Tracker example demonstrates why evidence is required: `codex/trade-tracker-complete` is already an ancestor of `main`, so its feature commits are present in the canonical history, but its worktree still requires a dirty/untracked/data check before it can be proposed for removal.

The corrected unified-account example demonstrates the same rule from the other
direction. `codex/unified-accounts-beta` was initially misclassified as clean and
contained; direct inspection found 43 changed paths. Its exact unfinished state is
now preserved at local commit `5305ee29a61ab44fa6238e2b4725957ad1917fe6` and
must be selectively reconciled before any cleanup proposal. A branch name or base
commit never proves that working-tree feature work is redundant.

## Canonical rule

`C:\Users\jerac\Documents\TraderLink\traderslink.pro` remains the preserved legacy and current production reference until an owner-approved replacement checkpoint promotes the accepted replacement. A folder name, branch name, recent timestamp, running port, or local environment file cannot independently make another folder canonical.

The owner authorized and accepted one clean replacement candidate at `C:\Users\jerac\Documents\TraderLink\traderlink-platform`. It now exists as a full independent clone from the accepted preservation state on `codex/traderlink-platform-replacement` at `a3193e19806af955093aa236349d796171d9bf97`; it is not an ad hoc file copy or temporary worktree. It is the active location for new replacement implementation but becomes the canonical production application only after final replacement acceptance. The original `traderslink.pro` folder remains the intact legacy recovery/reference application and need not be deleted.

No other permanent sibling copy is created during cleanup. Temporary worktrees must have a named feature, branch, owner/status, review purpose, and removal condition in the workspace inventory.

## Required inventory fields

Phase 1 creates `docs/migration/workspace-inventory.md`. Every potentially related folder records:

- exact absolute path and classification: canonical repo, registered worktree, independent clone, copied folder, project, private data, archive, or unrelated project;
- repository remote, current branch, HEAD commit, and whether the branch is merged into canonical `main`;
- commits unique to the folder/branch and their feature purpose;
- dirty tracked files, intentional untracked source, ignored data, databases, environment files, and logs;
- active process, port, schedule, deployment, or script references;
- whether equivalent code is already in canonical `main` and whether later main changes supersede it;
- required preservation action and recovery location;
- proposed group, owner decision, and deletion eligibility.

## User-visible groups

| Group | Meaning | Allowed action before owner approval |
| --- | --- | --- |
| Keep | Canonical app, active separate project, private-data root, or required recovery source | Document only |
| Reconcile | Contains unique or uncertain code/data/configuration | Compare and prepare a preservation proposal |
| Archive | Historical value remains but it should not look active | Propose an archive location and recovery steps |
| Remove later | Proven redundant after commits, dirty files, data, and dependencies are cleared | List exact path and evidence only |
| Do not touch | Separate projects or owner data outside this migration | Exclude from cleanup |

## Preservation and removal gates

Before any folder is removable:

1. Unique commits are merged, intentionally rejected with a recorded reason, or preserved on a clearly named remote branch.
2. Dirty tracked changes and untracked source are reconciled or archived.
3. Databases, imports, secrets, environment settings, and ignored/private files are identified and safely preserved where required.
4. No process, port, scheduled task, deployment, script, or documentation still depends on the path.
5. The relevant feature appears in the product/migration register and is accepted, superseded, or explicitly deferred.
6. Recovery instructions are recorded.
7. The user receives the exact path, classification, evidence, proposed action, and recovery effect and explicitly approves removal.

Registered worktrees are removed through Git-aware worktree handling after verification. Independent clones and copied folders are handled individually. Raw bulk deletion, wildcard deletion, and removal based only on age or folder naming are prohibited.

## Checkpoints

1. **Discovery:** build the complete inventory without mutation.
2. **Reconciliation:** compare unique commits and files to canonical `main`; connect features to the migration register.
3. **Disposition review:** show the user the grouped inventory and exact recommendations.
4. **Preservation:** perform only approved merges, archives, or data moves and verify recovery.
5. **Removal review:** re-check paths and dependencies and request explicit deletion approval.
6. **Cleanup:** remove only approved targets, then prune stale Git worktree metadata and update the inventory.

Cleanup is not a prerequisite for replacement work. The completed Discovery inventory and owner acceptance of the exact source commit/path/data boundary authorized the independent `traderlink-platform` clone, which now exists. Existing folder cleanup can occur much later or not at all; no deletion is required for replacement acceptance.
