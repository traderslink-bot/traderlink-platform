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
