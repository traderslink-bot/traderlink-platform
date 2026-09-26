# TraderLink Coaching Review Completion Progress

**Status:** Source checkpoint and narrow static audit complete; runtime
and staging-only owner review remain required. This is not a completed release.

**Started:** 2026-09-26

**Controlling plan:** [TraderLink Communities Partner Platform Plan](traderlink-communities-partner-platform-plan.md)

**Approved visual contracts:** [Coach Trade Review Workspace V2](traderlink-coach-trade-review-workspace-v2-mockup.html) and [Coach Final Review](traderlink-coach-final-review-mockup.html)

## Completion boundary

This continuation preserves every approved interaction from the two controlling
mockups and replaces the review fixture's temporary browser state with durable,
relationship-scoped coaching records. It does not redesign the approved pages,
change coaching commerce, grant Journal access, or publish Communities to
production.

## Required work

The checks below distinguish source implementation from the still-pending
runtime/staging acceptance. No Vitest, build, database migration, local server,
or hosted operation has been run in this continuation.

- [ ] Read the student's real Journal trades only through the active,
  student-owned coaching grant.
- [ ] Persist student-selected and coach-selected trades with source, order and
  removal state.
- [ ] Persist one editable coach review per selected trade, including draft and
  ready states.
- [ ] Keep per-trade images private and relationship scoped.
- [ ] Persist student actions attached to the review.
- [ ] Use real Trade Details and stock-chart data for the focused trade.
- [ ] Keep Find trades, Trades to review and Saved trade reviews synchronized
  with durable state after refresh.
- [ ] Assemble the complete final review from ready trade reviews, optional
  overall sections, actions and allowed attachments.
- [ ] Implement coach delivery, student first-view acknowledgement, follow-up
  work with a new due date, completion and cancellation without deleting
  history.
- [ ] Connect review status, due dates, progress and navigation to Coaching
  Work.
- [ ] Present delivered reviews and follow-up communication inside the
  student's normal TraderLink dashboard.
- [ ] Keep private coach notes and unfinished drafts out of every student read.
- [ ] Update the fixture so staging can demonstrate the entire lifecycle without
  fabricated production facts.
- [ ] Verify the narrow contracts and rendered desktop/mobile Light/Dark states
  at the final staging checkpoint; do not run Vitest.

## Git and release boundary

- Editable lane: `C:\Users\jerac\Documents\TraderLink\worktrees\coaching-resume-20260926`
- Branch: `codex/coaching-resume-20260926`
- Parent: `ebb3176df40be9483d8ad10f516d6c4221bd0204`
- Git integration and every Railway action remain coordinator-owned.
- Production remains untouched.

## Checkpoints

### 1. Durable review domain

- [x] Migration reservation received from the coordinator: exclusive 0143.
- [x] Contracts and repository/service operations implemented.
- [x] Authorization, privacy and state-transition source audit completed.
- [ ] Narrow local checkpoint committed and handed to the coordinator.

### 2. Coach workspace integration

- [x] Real Journal trade finder integrated in source.
- [x] Persistent three-view trade workflow integrated in source.
- [x] Real details, chart, images and student actions integrated in source.
- [x] Final-review assembly and delivery integrated in source.
- [ ] Narrow local checkpoint committed and handed to the coordinator.

### 3. Coaching Work and student delivery

- [x] Coach work queue connects review dates, progress and lifecycle in source.
- [x] Student dashboard connects delivered reviews and read acknowledgement.
- [x] Follow-up, completion and cancellation are integrated in source.
- [ ] Narrow local checkpoint committed and handed to the coordinator.

### 4. Final review

- [x] Targeted non-Vitest static verification completed.
- [x] Help Center impact reviewed and recorded.
- [ ] Coordinator reconciled the feature onto the current application line.
- [ ] Staging desktop/mobile Light/Dark owner review completed.

## Source checkpoint — 2026-09-26

- Added the connected workspace beside the preserved original component. Find
  trades, To review, Saved, selection/removal, per-trade feedback and automatic
  advancement remain present. The desktop table is paged at 50 rows.
- Real Journal reads use the existing read service and student-owned grants.
  Notes, rules and tags now have separate opt-in fields. Existing grants default
  to no additional fields; historical complete grants retain their scope.
- Review selections, feedback, trade labels, actions, attachment links and
  lifecycle events are durable. Removed selections remain stored but cannot be
  delivered as part of the final review.
- Draft saving is separate from delivery. Student reads exclude unpublished
  content and coach-private notes. Image content endpoints enforce the same
  delivery boundary, including removed trade images.
- Delivered reviews support explicit student read acknowledgement, coach
  follow-up with a due date, completion and cancellation. Follow-up messages
  remain attached to the review.
- Student requests can select shared trades. The student coaching page inherits
  the normal dashboard and does not render the community management header.
- Coaching Work uses explicit review deadlines, keeps standalone tasks visible,
  counts outstanding work by plan, and provides week/month calendar layouts.
- Images remain one PNG/JPEG/WebP file per request, at most 8 MiB. The isolated
  Next configuration adds only a 10 MB transport allowance for multipart
  overhead. This does not raise the product file limit. No video hosting added.

## Static evidence and remaining verification

- Changed-file TypeScript semantic inspection passed at the intermediate
  22-file checkpoint using installed canonical dependencies. It did not install
  or copy dependencies or run the application. Repeat after final edits.
- TypeScript syntax parsing and `git diff --check` passed at intermediate
  checkpoints.
- Static SQL parameter inspection found zero mismatches across 129 direct
  prepare/run/get/all sites before the final selection-method cleanup. Repeat
  for the final commit. This does not prove migration execution or SQL behavior.
- No existing Communities/coaching Help Center guide was found in the current
  Help routes. Public guide copy remains deferred until product approval.
- Migration 0143 assumes the staging lane's Communities schema through 0131.
  It adds columns to review selections, reviews and Journal grants plus three
  new review-owned tables. It does not modify Journal execution facts.
- The coordinator must reconcile this additive manifest/configuration change
  with the current application line and reserved migrations 0132–0142. Do not
  replace current-main files with this older staging branch's complete files.
- Runtime migration compatibility, real persistence across refresh, attachment
  delivery, permission revocation and role-paused behavior still need the
  coordinator-controlled staging checkpoint.
- Desktop/mobile and Light/Navy Dark visual acceptance remain open. No claim of
  staging publication or completed owner approval is made.

## Exact migration and shared-file handoff

Migration identity: `0143_traderlink_communities_review_workflow`, namespace
`community`, execution order `143`. No existing migration identity is edited.

Predecessors and altered tables:

- `0122`: `traderlink_community_journal_grants` gains `shared_fields_json`, valid
  JSON text, default `[]`. Relationships/plans from 0122 remain the ownership
  and entitlement parents; grants remain owned by the student.
- `0126`: `traderlink_community_coaching_trade_reviews` gains `delivery_state`
  (default `draft`) and nullable UTC timestamps `due_at_utc`,
  `delivered_at_utc`, `viewed_at_utc`, `follow_up_due_at_utc`,
  `cancelled_at_utc`. Legacy completed reviews are marked completed/delivered
  using their existing completion/update timestamp. Cancelled reviews remain
  cancelled; no receipt timestamp is invented.
- `0128`: `traderlink_community_coaching_review_trades` gains nullable
  `selected_by_user_id`, `selection_source` (default `coach`), `workflow_state`
  (default `queued`), `coach_feedback` and `trade_label` (default empty), plus
  nullable `saved_at_utc`, `removed_at_utc`, `updated_at_utc`. Existing selector
  identity/source is backfilled from the review requester and relationship.
- `0128` attachment rows remain the image storage parent; no blob copy is made.
- `0131` optional review sections are consumed unchanged.

New managed tables:

- `traderlink_community_coaching_review_actions`; review/status/due-date index.
  Foreign keys reference the existing review, relationship/community and user.
- `traderlink_community_coaching_review_attachment_links`; keyed by attachment,
  references attachment/community and review, with optional round-trip ID.
- `traderlink_community_coaching_review_events`; review/occurrence-time index,
  references review, relationship/community and actor.

Manifest changes are one import, one file-entry registration and the three-table
managed mapping. The migration runner is unchanged. The coordinator must retain
all current-main manifest entries and reconcile the reserved order before any
database operation.

The only Next configuration hunk is
`experimental: { serverActions: { bodySizeLimit: "10mb" } }`. Merge this property
into any current configuration rather than replacing existing experimental
settings. The action accepts exactly one image file and rejects over 8 MiB
before creating a Buffer; PNG/JPEG/WebP signature validation remains server-side.
Multipart parsing and the in-memory Buffer temporarily consume request/file
memory; no parallel upload worker or background process was added.

Rollback requires the coordinator's exact staging-target backup/restore and
schema-compatible application decision. This worker has not executed 0143 or
verified an applied-migration identity on any hosted database.

## Local checkpoint evidence

- Backend checkpoint: `d448ecf48af0937f2ff55947f20ccbc13fd4c4fa`, parent
  `ebb3176df40be9483d8ad10f516d6c4221bd0204`; eight explicit files.
- Final changed-file TypeScript semantic pass: 22 TS/TSX files, zero reported
  diagnostics in those files. This is not a full-repository type check.
- Final direct SQL-binding audit: 131 prepare/run/get/all sites, zero placeholder
  count mismatches. Prepared-statement variables and runtime database behavior
  still require the staging checkpoint.
- `git diff --check` passed. No hooks, tests, build, dev server, dependency
  installation, production mutation or staging publication occurred here.
- UI/config/documentation checkpoint: `92ad8dbc127fe39b918a553c6c847be488d07b60`,
  parent `d448ecf48af0937f2ff55947f20ccbc13fd4c4fa`; 16 explicit files. The exact
  cumulative 24-file allowlist was sent to the coordinator.
- A final three-source-file corrective pass hides unpublished trade-selection
  IDs from student payloads, normalizes attachment response filenames, guards
  against out-of-order Trade Details fetches and formats quantities to two
  decimal places. Changed-file semantic inspection: zero diagnostics;
  `git diff --check` passed. No schema/config expansion.
- Coordinator acknowledged the handoff and is verifying current-main/staging
  reconciliation. This branch remains an isolated source package; no staging
  outcome is asserted here.
