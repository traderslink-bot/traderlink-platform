# Railway Staging Volume Initializer Progress

**Status:** Coordinator-approved local implementation; narrow local commit
authorized, with no hosted action authorized

**Controlling plan:** [Railway Staging Volume Initializer Plan](railway-staging-volume-initializer-plan.md)

## 2026-08-30 — Local preparation

- Confirmed the assigned worktree is clean at
  `b007cc5fb8ea82acd1fe8b10fdd02760b87a5a31` on
  `codex/workspace-trade-library-85813d84` before this operational-only slice.
- Reused the existing explicit
  `initialize-traderlink-platform-database.ts --initialize-empty` command.
  The regular runtime's missing/empty database rejection was not modified.
- Added a separate initializer image that hard-codes the staging target path,
  permits only Railway's empty direct non-link `lost+found` filesystem entry,
  refuses every other `/data` entry and every SQLite database or sidecar,
  creates the three required `/data` directories, and exits after the existing
  initializer.
- No product UI, Workspace source, normal Dockerfile, `railway.json`,
  authentication, schema, migration, database, local server, test suite,
  build, deployment, Railway configuration, staging action, or hosted action
  was changed or run.

## Pending Coordinator boundary

- The Coordinator approved only this exact three-file allowlist and directed a
  narrow local commit after static/source review and `git diff --check`.
- No Vitest, broad tests, build, local server, database initialization,
  deployment, staging action, or hosted action is authorized.

## 2026-08-30 — Railway empty-filesystem boundary correction

- Coordinator-provided evidence from the isolated helper service showed that
  its newly created staging volume contained the provider-created
  `lost+found` directory and the initial image exited before any database write.
- The guard now permits only that empty direct non-link directory. It still
  rejects all other root entries, including hidden entries and links, before
  creating the three required directories or invoking the existing initializer.
- This correction changes no application behavior and does not authorize a
  retry, deployment, migration, database initialization, or hosted action by
  this worker.

## 2026-08-30 — Staging storage ownership correction

- Coordinator-provided staging evidence showed the completed one-time
  initializer left its SQLite file and three staging directories root-owned,
  while the normal application image runs as `1001:1001`.
- After a successful explicit empty initialization, the helper now recursively
  assigns only the SQLite file and those three created directories to
  `1001:1001`. The mount, empty-volume, and SQLite-sidecar fail-closed guards
  are unchanged.
- The helper-only root Dockerfile remains byte-identical to the named
  initializer Dockerfile on this isolated branch. No normal application branch
  Dockerfile, product source, schema, migration, authorization, or hosted
  system was changed by this worker.

## 2026-08-30 — Isolated staging ownership recovery mode

- Coordinator-provided evidence established that the isolated staging volume
  cannot be wiped and the completed default initializer deliberately rejects
  its existing database.
- Added the one-time explicit flag
  `TRADERLINK_ISOLATED_STAGING_VOLUME_OWNERSHIP_RECOVERY=confirm-not-production`.
  In that mode the helper validates only the expected existing staging layout,
  refuses transfer inputs, sidecars, links, unexpected root entries, and a
  non-exact mount/path, then performs only the ownership repair.
- Default behavior is unchanged: without that exact flag, the helper continues
  to require a new empty volume and runs the existing explicit initializer.

## 2026-08-30 — Isolated staging mount-root ownership correction

- Coordinator-provided readiness evidence showed that the normal application
  verifies writable access to the exact `/data` mount root before opening the
  database or subdirectories. Assigning only the initialized children can
  therefore leave a root-owned mount inaccessible to the non-root app image.
- After every existing mount, layout, sidecar, transfer-input, and empty-volume
  guard has passed, the helper now assigns the exact `/data` mount root to
  `1001:1001` as well as recursively assigning the previously allowlisted
  SQLite file and three directories. It neither relaxes the layout checks nor
  reads, initializes, migrates, or changes data during recovery.
