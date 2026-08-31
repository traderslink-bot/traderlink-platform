# Workspace Trade Library Progress

**Status:** In progress — source reconciliation recorded; visible composition is being rebuilt on the production-base Workspace lane.

**Controlling plan:** [Workspace Trade Library Plan](workspace-trade-library-plan.md)

## 2026-08-30 — Staged composition rejected; correction batch active

- Audited the staged Workspace source against the superseding owner inventory.
  It currently uses a button/chevron Date disclosure, broad desktop columns,
  Side/Status chips, a disabled list-level Delete, full-history fact-set rows,
  missing operational controls, and locally written saved-trade Journal and
  Analyzer placeholder messaging. Each is recorded as rejected in the plan.
- The metric/PWA composition remains, but metric captions need removal and the
  selected-period Best/Worst facts need insertion directly beneath it.
- Source audit found the current fact-set reader eager. The existing Analytics
  table cursor validates the query digest, fact revision, order, and row cursor,
  but its current implementation orders an already materialized population.
  This correction therefore uses the existing server-scoped query and cursor
  authority while keeping browser filters limited to its validated input shape;
  it does not accept any browser-supplied account or trade identifier.
- No test suite, dependency installation, server, browser automation, migration,
  configuration, push, or deployment has run in this batch.

## 2026-08-30 — Compact Calendar review checkpoint

- Current Calendar is not embedded in Workspace. The dedicated `/calendar`
  route owns its account-scoped data via `calendar-data.ts`, which delegates to
  the Journal dashboard read model and preserves its filters and day detail
  authority.
- The current month renderer in `calendar-client.tsx` is presentation-only but
  uses oversized 230px desktop cells and a horizontally scrolling 248px mobile
  layout. The review candidate replaces only that renderer with a shorter
  seven-day month grid retaining day-level P/L and trade-count cues.
- Candidate implementation allowlist after owner visual approval:
  `app/(dashboard)/calendar/calendar-client.tsx`, this plan, and this progress
  record. No calendar data, route, filter, offline, account, or service file is
  a candidate.

## 2026-08-30 — Swing Tracker navigation visibility

- Removed only the `Swing Trade Tracker` item from the dashboard Trade Tracker
  navigation group. The retained `/trade-tracker/swings` route title and Help
  mapping, its page/source, Journal contracts, and offline model are untouched.

## 2026-08-30 — Source correction checkpoint

- Rebuilt the Workspace list presentation as a compact constrained table with
  direct row disclosure, action-only icon controls, visible operational
  controls, compact mobile summaries, and a drawer-specific execution form
  that reuses the established manual-trade submission boundary.
- The Calendar month presentation is now a compact seven-day grid in the
  retained Calendar route; its account-scoped data, route, filters, and day
  detail ownership remain unchanged.
- The retained seven-day week view uses the same day facts and selection flow,
  with cells reduced from 480px to 260px and reduced padding; no controls or
  data behavior changed.
- The existing fact-set service still materializes all eligible facts before
  its current table cursor is built. That contract cannot honestly satisfy the
  required storage-bounded continuation guarantee and remains a separate server
  contract gap; this checkpoint does not represent client-side Load more as a
  replacement for it.

## 2026-08-30 — Server-bounded projection contract in progress

- Coordinator authorized the local-only migration-backed replacement for the
  eager fact-set table. Migration `0100_journal_workspace_trade_library_projection`
  introduces a current-version derived projection and per-account projection
  revision. It stores canonical exact financial values plus a deterministic
  text sort key, so P/L ordering does not cast Journal decimals to SQLite
  floating point.
- The Workspace reader obtains its account only from `WorkspaceAccessScope`.
  It queries the indexed projection with a fixed 25-row page, a validated
  opaque continuation cursor, and canonical ticker/status/date/sort/group/
  dashboard-period query state. The cursor carries its projection revision,
  query digest, ordering key, and round-trip tie breaker; a changed account,
  query, or projection revision is rejected rather than reused.
- Existing Journal rebuilds refresh the derived projection only after their
  current-version writes have completed, in the same account transaction. No
  migration or backfill was run in this worktree. A release requires a
  Coordinator-owned, derived-data backfill for accounts not otherwise rebuilt
  after the new schema is applied; it must not rewrite Journal facts. Until
  then, the Workspace reader returns only its explicit empty unavailable state;
  it never falls back to a full-history read or writes facts during a normal
  page request.
- The client calls the server reader for initial filters and continuations.
  It no longer slices a browser-resident historical trade array. Displayed
  delete actions use the plain label `Delete execution` and remain absent when
  no server-issued opaque deletion ref exists.

## 2026-08-30 — Staging-only migration helper prepared

- Added a separate helper-only Dockerfile and direct executable wrapper for the
  existing `runHostedPlatformMigrationMaintenance` contract. It is not the
  normal application image, does not expose an app port, and changes neither
  normal startup nor Railway configuration.
- The wrapper fails when the contract reports no protected maintenance request
  and prints only an applied/already-applied status, count, and migration id.
  The underlying contract still requires the exact manifest-tail migration id,
  reviewed confirmation, protected database path, account-identity recovery
  configuration, exact predecessor, and a backup-root boundary before it can
  take any write action.
- Required hosted procedure: Coordinator creates a temporary helper service
  against the isolated staging volume, supplies the protected variables without
  printing values, runs it once while no app process uses that volume, records
  the receipt plus app health, then removes the helper. No helper service,
  migration, backfill, push, staging, or deployment was performed here.

## 2026-08-30 — Reconciliation complete

- Confirmed this worktree is clean on `codex/workspace-trade-library-85813d84`
  at production base `85813d8419db00a993838836ce4e181ed83f691a`.
- Confirmed the Explorer library and filter checkpoints are reference-only,
  non-ancestor history. No merge or cherry-pick is permitted.
- Selected only the existing server-side active-account fact contract, lazy
  execution-detail endpoint, and manual-entry submission boundary. Paired P/L,
  Needs review wording, and preloaded detail from the reference are excluded.
- No database, migration, hosted configuration, server process, staging, or
  Railway action occurred.

## Current implementation target

- [x] Replace the welcome/action-card Workspace body with the approved compact
      trade library while retaining factual metric cards and Demo protections.
- [x] Add the responsive Add trade drawer using the existing manual-entry
      submission boundary and an initial single execution row.
- [x] Present a desktop table and purpose-built mobile trade summaries with
      on-demand execution disclosure.
- [x] Record light static verification and submit a narrow local commit for
      coordinated owner staging review.

## Light verification

- `git diff --check` and equivalent whitespace checks for the newly added
  files pass.
- Source review confirms the list uses only the active server-derived account,
  requests executions after expansion, has no visible `Needs review` state,
  and exposes only one list P/L column.
- Targeted ESLint was intentionally not substituted with a dependency install:
  this worktree has no `node_modules`, and `npx eslint` attempted a registry
  download which the low-resource, no-install boundary blocks.

## Outstanding boundaries

- Saved-trade Journal/Analyzer editing remains guarded follow-up work. Delete
  is available only for an execution whose current server-issued opaque ref
  passes the audited manual-only predicate; it is never a trade-level action.
- No owner review, integration, or production approval has occurred.

## 2026-08-30 — Offline staging compile repair

- Railway staging identified the Offline Workspace caller as the only TypeScript
  blocker after the live Trade Library became a required Workspace composition.
- The saved offline model contains only verified metrics/review content. The
  Workspace dashboard now accepts that metrics-only caller without fabricating
  account currency/timezone, opaque account or offline refs, or trade rows; it
  renders the Trade Library only for the complete live server-issued bundle.

## 2026-08-30 — Safe execution deletion follow-up

- Restored the audited `c224bccb` deletion contract selectively, without
  merging that non-ancestor checkpoint: the repository predicate permits only
  accepted active `manual_entry` executions in the selected account and rejects
  Demo, provider-backed, provenance-identified, reconciled, stale, protected,
  or cross-account executions.
- The edit service emits `deleteRef` only when that predicate passes and
  re-resolves the same opaque ref against the current account and version at
  delete time. The route retains mutation-header, request-scope, and expected
  account-selection checks before using the established exclusion/rebuild path.
- Workspace forwards only server-issued eligible refs to the saved-trade drawer.
  It does not construct an execution id or ref; non-eligible executions render
  no Delete control and the compact list remains non-mutating.

## 2026-08-30 — Owner compact-list refinement

- Applied the owner’s exact compact-list inventory to the existing Workspace
  client composition: rows use a fixed 46px collapsed target, show entry/exit
  prices alongside their dates/times and execution count, label factual State
  as plain text, and retain red/green P/L and dark accessible action icons.
- Added the visible active-filter count and Return to newest action while
  retaining existing server-owned filters, grouping, dashboard-period control,
  opaque continuation cursor, and Load more behavior.
- Day/Swing remains the saved submission classification but no longer changes
  execution timezone or the shared Eastern Time workflow. No server contract,
  migration, account scope, deletion predicate, data, staging, or release
  behavior changed.
