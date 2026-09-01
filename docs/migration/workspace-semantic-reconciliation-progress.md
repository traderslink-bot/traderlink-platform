# Workspace semantic reconciliation progress

**Status:** Local implementation in progress on the current production parent; shared drawer composition approved.

**Controlling plan:** [Workspace Semantic Reconciliation Plan](workspace-semantic-reconciliation-plan.md)

## Approved legacy-slice reconciliation (in progress)

The Task Coordinator authorized restoration of the owner-approved behavior from
the divergent `85813d84..9c1acb4d` reference line onto current `75ba921a`.
This is a semantic reconciliation, not a wholesale cherry-pick. The current
five Gross cards, compact atomic-edit drawer, `[roundTripId]/edit` routes,
0105–0108 migration identities, Dark behavior, Demo/account isolation, and
account/query-bound cursors remain controlling.

- [x] Restored the global shared Trade/Journal/Analyzer drawer shell before
  enabling the renamed Add/Edit Trade navigation entry.
- [x] Reattached the current atomic edit to the restored Workspace table while
  retaining the shared saved-trade Journal and Analyzer tabs; no legacy edit
  route was reintroduced.
- [x] Restored the approved Data Decisions account action, Workspace top
  actions, safe delete/review integration, and PWA navigation placement.
- [x] Verified the merged allowlist and preserved migration continuity. The
  reconciliation commit remains Release Coordinator-owned for later review.

The reconciliation must be reviewed as one complete local candidate. It must
not be split into or staged as interim navigation, drawer, or tracker changes.

## Baseline and boundaries

- [x] Reconciled onto the Release Coordinator-specified production parent beb6aa0a6ceff4f444e483f65be7ee7ff192f327 without altering the original Workspace worktree.
- [x] Confirmed the historical Workspace chain is reference-only and will not be merged or cherry-picked wholesale.
- [x] Confirmed the five-card/period contract, factual table Gross presentation, account/version-bound paging, and Dark/manual preservation boundary.
- [x] Confirmed a client sequence of existing mutations could partially write and is therefore not an acceptable atomic edit implementation.
- [x] Recorded the exact five approved preview-consequence sentences and their in-drawer placement.
- [x] Refined the review mockup: desktop fields are content-sized and each execution uses one compact field row.
- [x] Owner approved the shared drawer mockup and compact desktop field layout.
- [x] Owner approved the final drawer field details: full Date and Time display with reserved Time-icon space; Fee sized for values such as `10.56`; Shares sized for at least `3333`; full Trade type labels; and one Add execution control below existing executions. Existing factual execution rows remain visible; a new row appears only when the control is used.
- [x] Owner authorized completion of the approved local Workspace work for review/release preparation.
- [x] Production-base Workspace library and single-period read implementation.
- [x] Corrected the Workspace five-card query to declare its approved Gross basis explicitly. The cards use the selected account and the same closing-date period as the bounded table's realized rows; missing fee facts no longer turn the Gross Workspace count, win rate, best trade, or worst trade into Net-unavailable values.
- [x] Atomic snapshot, preview, confirmation, and transaction implementation.
- [x] Atomic snapshot foundation: one active current-version round trip can expose only its complete eligible manual membership through opaque refs.
- [x] Authenticated read-only Workspace endpoint exposes that snapshot without raw execution or version identifiers.
- [x] Commit-time re-resolution rejects a stale or altered opaque snapshot before any future preview or mutation can proceed.
- [x] Authenticated preview accepts only a complete draft (retained, removed, and new rows), re-resolves the snapshot, signs the exact draft for 15 minutes, and returns exactly one approved factual consequence sentence.
- [x] Authenticated commit rechecks the signed preview and complete snapshot inside one immediate transaction; it keeps correction provenance, records removal as a resolved trader decision, imports additions, and rebuilds before returning.
- [x] Preview simulates the complete affected instrument/currency sequence from current Journal facts. It distinguishes new zero-crossing splits, removed zero-crossing merges, changed boundaries, and the resulting selected-trade open/closed state without mutating data.
- [x] Added the owner-approved guarded 0108 trade-style-source migration. It rebuilds only the two trade-style history tables, preserves their rows, foreign keys, indexes and immutable triggers, and widens only the event source_ui check with literal workspace. It has not been applied. Release coordination reserves 0104 for Halt and makes 0105–0108 append-only after it.
- [x] Hardened the 0108 pre-rebuild cleanup for an existing staging schema: the three preserved-trigger and three index drops are `IF EXISTS`, so an absent legacy helper object cannot prevent the same table rebuild, preservation copy, index recreation, and immutable-trigger recreation. It has not been applied locally.
- [x] The approved shared atomic-edit drawer client is implemented as a reusable Workspace component with the compact desktop/mobile composition, add/remove rows, signed preview/second-save confirmation, preserved draft failures, and a success refresh event.
- [x] Mounted the approved drawer from the bounded Workspace library host. The former table delete control is not carried into this slice; eligible removal is part of the one atomic draft and keeps Journal provenance.
- [x] Added the audited 0105–0107 derived projection source bundle, its additive manifest registrations after 0103 and the Release Coordinator-owned Halt 0104, and the per-account round-trip refresh hook. This is source only; no database migration has been applied.
- [x] Targeted static/diff verification and local checkpoint for the approved drawer-field correction.

## Explicit exclusions

No migration, projection/backfill, data mutation, configuration, hosted action, staging, push, deployment, restart, local server, Vitest, broad test, or build has run. Targeted static diff checks pass; local package dependencies are absent, so targeted lint cannot run without an unauthorized install. The existing historical Workspace plan/progress records remain reference-only and unchanged.

## Bounded library dependency audit

The production-base library remains blocked on the required derived projection
schema. The next audit deliverable is an exact, evidence-backed allowlist for
bringing only migrations `0100` through `0102` and their required materializer,
reader, manifest, and verification dependencies to the current production
lineage. It must retain opaque account/query/revision-bound cursors and must
not substitute any eager history read. This record does not authorize adding,
applying, or backfilling those migrations.

### Read-only migration evidence (2026-09-01)

- The applied historical `0100_journal_workspace_trade_library_projection` creates the per-account
  revision and projection tables plus activity and Net P&L indexes. It has no
  data update statement.
- `0101_workspace_trade_library_sort_facts` adds six sortable derived-fact
  pairs and their indexes. `0102_workspace_trade_library_hold_duration` adds
  hold duration and its index. Neither migration changes canonical Journal
  facts or includes a backfill statement.
- The materializer in
  `src/modules/journal-analytics/server/workspace-trade-library-projection.ts`
  requires all columns through `0102`. On a later round-trip rebuild it deletes
  and reinserts only the selected account's *derived projection* rows and
  updates that account's projection revision; it does not rewrite executions,
  versions, allocations, round trips, or source evidence.
- The reference line wires that materializer from the round-trip repository at
  the end of each rebuilt chain. The current production base does not. A safe
  reconciliation therefore needs all three migrations together with the
  manifest registrations, materializer, round-trip wiring, bounded library
  reader/actions/client/page and their focused verification. Applying 0100 by
  itself, or wiring the materializer before 0106/0107, is incompatible.
