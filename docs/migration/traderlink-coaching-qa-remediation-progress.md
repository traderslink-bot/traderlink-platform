# Coaching QA remediation — one continuous goal

Owner authorized all six implementation areas and final QA in one goal on
2026-09-27. This extends the existing unfinished coaching goal; no partial feature
acceptance is implied. Source lane: coaching-resume-20260926, baseline3bf6ae9da.
Coordinator owns staging and migration identity reservation. Production excluded.

## Controlling scope

The full13-area inventory and evidence gaps in
[the QA report](traderlink-coaching-full-qa-20260927.md) remain the acceptance list.
Preserve the approved colourful offer builder, Find/To review/Saved tables,
inline trade editor, details/chart drawers, private notes and final-send preview.
No redesign or removal of those workflows. No automatic Journal sharing.

1. **Plans and agreements:** edit existing plans without losing structured options;
   correct draft publication; immutable per-student service/price snapshots;
   proposed/confirmed agreements with quantities, periods, start and deadlines.
   Changes to a public offer must not silently rewrite existing agreements.
   Custom coaching may have no schedule. Journal sharing remains separate.
2. **Work generation:** deterministic occurrences keyed by agreement/service/period;
   agreed cadence and due dates; calendar/list/progress integration; repeated runs
   do not duplicate work or overwrite drafts/delivered reviews. Revisions preserve
   completed history. Unsigned or unscheduled agreements generate no work.
3. **Limits and role lifecycle:** question allowance/renewal tracking; follow-up
   expiration; coach/student access-change notifications; successful Discord
   role refresh pauses/restores access and preserves records. Provider failure
   must not be asserted to be a confirmed role removal.
4. **Coach analysis:** real relationship/account-scoped Reports, Explorer and
   Analyzer data in the review workspace, read-only Journal contracts, explicit
   coverage, date scope and no invented results. Select trades directly into the
   existing review, keeping private feedback separate from canonical trade data.
5. **Sessions and teaching:** duration/meeting link/agenda/private and shared notes,
   completion/history; live/recorded lessons/resources, external links, availability,
   audience, edit/reuse, assignments/due dates and student progress. No video hosting.
6. **QA corrections:** multiple coaching relationships, accessible mobile selection,
   hydration/date-range investigation, deterministic date rendering and navigation.

## Implementation checkpoints

- [x] Additive contracts/schema proposal and reservation; no applied migration edits.
- [x] Area1 plan editor/agreement implemented; student browser gate open.
- [x] Area2 generation/workload implemented; automatic caller staging check pending.
- [x] Area3 allowances/transitions implemented; real provider verification remains open.
- [x] Area4 coach-scoped analysis implemented and browser query checked.
- [x] Area5 sessions/teaching implemented; coach edit/reuse checked, student gate open.
- [x] Area6 relationship/accessibility/date corrections implemented; multi-student browser gate open.
- [x] Targeted low-resource checks after coherent source batches.
- [x] Coordinator migration rehearsal and production-parity release of3d28 chain.
- [ ] Full13-area QA, including coach/student, images and access isolation.
- [ ] Final report separates verified, failed and externally blocked scenarios.

## Preservation and verification

Preserve owner reviewaa1785a7 and QA draft69865ebd. No test identity creation,
hosted data repair or real Discord messages without exact coordination. Use
disposable local fixtures for service/permission tests and explicitly scoped staging
records for browser lifecycle checks. No broad local build on the resource-limited
computer. Remote build, narrow local checks and final browser QA are separate gates.

## Current checkpoint

Source changes are in the assigned lane only. Coordinator reserved
`0145_traderlink_communities_coaching_delivery_workflow`, portable order145 and
staging compatibility158. Applied0144 remains unchanged. Existing goal control reports
the earlier goal paused and cannot create a second unfinished goal; current owner
instruction authorizes resuming this work, but the tool exposes no resume operation.
Do not falsely mark the old goal complete to create another.

### Implementation and local evidence (in progress)

Release contract: [migration and staging handoff](traderlink-coaching-remediation-release-handoff.md).
Current verification: [remediation QA record](traderlink-coaching-remediation-qa-20260927.md).

- Plan edits persist structured details/resources and use revision conflict checks;
  published/paused state and legacy Journal scope/items are preserved on edits.
- Immutable proposed/accepted agreement snapshots and bounded idempotent work
  generation; question/follow-up terms are separate from Journal grants.
- Student/coach pause/restore notices, role reconciliation after successful OAuth
  membership refresh, bounded bot refresh and authenticated maintenance endpoint.
  Maintenance still needs Coordinator scheduling/configuration verification.
- Coach analysis drawer uses existing Analytics/Explorer queries and saved Analyzer
  readers under the student relationship/account scope. No Analyzer jobs requested.
- Session editing, private/shared notes, duration/link/attendance; lesson editing,
  reuse, recording links, availability and due dates; draft lessons excluded from students.
- Multiple student relationship selection, mobile checkbox labels, stable UTC workload
  dates, archived student recovery and access to a student's own paused history.
- Syntax checkpoint: 27 changed TypeScript/TSX files, zero syntax errors (earlier batch).
- Targeted lint checkpoint: 29 files, zero errors, six warnings. Missing `view`
  dependency and unused fixture imports corrected afterward; rerun pending.
- Disposable in-memory service verification passes unsigned/no-work, student-only
  acceptance, five weekly occurrences and idempotence, month-end anchor preservation,
  unscheduled periods, plan revisions/frozen terms, question renewal, follow-up expiry,
  draft/private-note privacy, session metadata, draft lessons/edit/reuse, role notices,
  archive preservation and foreign keys. This is NOT browser or Discord-provider proof.
- Local harness uses canonical installed packages and the existing ignored Windows
  userInfo workaround; the server-only marker maps to Next's server empty marker in
  that standalone test process only. No repository/runtime stub or database changes.
- Full13-area staging QA has not run on these changes. Existing synthetic student has
  no OAuth identity; Coordinator confirms no genuine student-auth session available yet.
  Do not impersonate it or call service fixtures authenticated student acceptance.
- Latest local checkpoint:31 changed TS/TSX files pass bounded semantic checking;
  targeted lint has zero errors/warnings. Subsequent scheduling/attachment checks
  are included in the final pre-commit rerun, not assumed covered by the earlier pass.
- Recurrence and review coverage now differ: completed calendar week, previous month,
  previous7days, since prior delivered review, or explicit agreed rolling days.
  Large schedules persist bounded batches and resume individual slots without duplicates.
- Added service checks for150-session batches, confirmed Discord404 /200 transitions,
  permission-failure preservation, scoped analysis grants/revocation, and chart-image
  visibility before/after delivery. These remain disposable fixtures, not live identities.
- Coordinator confirmed no staging coaching bot token or dedicated scheduler. Existing
  CRON_SECRET alone does not prove scheduled execution. Do not repurpose other services.
- Source checkpoint saved as `9818506605e4289fc960b6176b09ced57b2851cc`
  (34-file allowlist; parent3bf6ae9). Coordinator accepted the immutable handoff for
  integrated rehearsal/build, with external identity/provider acceptance still open.
- Existing Communities regression verifier was brought forward to migrations0143–0145
  and the explicit draft/deliver/read/complete lifecycle. It now runs in memory, without
  filesystem cleanup. PASS:20 capabilities, community/role isolation, grant revocation,
  coaching history, activity projection, Tier2 idempotence and zero foreign-key violations.
- Final agreement display now includes immutable coverage, deadlines, quantities,
  follow-up window, focus/resources and coach-written service details before acceptance.
- Coordinator identified held navigation in the source parent. `/communities/coaching`
  was narrowed to actual5f2 routing plus only the own-student-relationship eligibility
  check needed for paused history. No held coach/directory redirect was approved or restored.
- Final workload audit: paused access is labelled on mobile as well as desktop and
  on tasks/sessions; undated flexible work no longer inflates due-date counters;
  delivered/viewed reviews are excluded from the student-list work-due count.
- Existing Discord-delivery verifier passes with mocked transport only:2 deliveries,
  exact links, selected channels and mentions suppressed. No real message was sent.
- Pre-release form/service audit caught and fixed conversation-root image validation;
  existing chat forms use the relationship ID, not an individual message ID. Explicit
  owned conversation roots now work and foreign targets are rejected. Added assertions.
- Student Send is disabled at zero question allowance. Teaching cards expose saved
  links/dates and per-student completion/progress controls; draft publication refreshes
  an all-student/plan audience transactionally without replacing existing progress.
  Session/lesson creation labels explicitly identify UTC input.
- Bounded semantic check after this audit:32 feature/verification TS files, zero
  diagnostics. Both in-memory coaching and existing Communities service checks pass.
  Source-extracted workload helpers pass UTC midnight, week and DST-day boundary checks.
- Help review: existing `discord-communities` guide's payment/privacy/role statements
  remain correct. Additional agreement/scheduling instructions need owner-approved
  wording; no new explanatory UI/help paragraphs have been published.
- Normal staging188fd/1a6f9c3b is healthy141 with current productiona741 and the
  complete3d28 source chain. See the remediation QA record for deployed coach evidence.
- Final bounded follow-up: maintenance extracted into a shared service and runtime,
  hosted registration after readiness every60seconds, batch5, non-overlap/finally-close,
  hourly agreement watermark and yields between agreement transactions. Same cron
  authentication retained. Coordinator cleared the two-line shared worker registration;
  this is source clearance, not permission for an uncoordinated deploy.
- Added in-memory maintenance assertions: automatic weekly generation, retry
  idempotence, hourly selection, missing-token honesty, overlap suppression and
  recovery after a failed pass. PASS. Final6-file semantic check0diagnostics;
  final7-file lint0errors/0warnings including the shared registration.
- Desktop expanded editor is constrained to visible table width while preserving
  the aligned/scrollable table and right-side panel. Teaching singular label corrected.
  These final UI changes require deployed recheck; no new descriptions or redesign.

### Final deployed follow-up

- Subsequent genuine Bullrun sign-in attempt exposed access-required rendering error
  digest1019681659. Coordinator logs confirm a component-function serialization
  failure, separate from DASHBOARD_ACCESS_DENIED. Narrow correction removes the
  Next Link component prop from the external MUI button; exact URL/copy/access rules
  unchanged. Source checkpoint pending hosted recheck. Bullrun Discord identity
  confirmed; Chrome disconnected during normal OAuth navigation, so student sign-in
  is not yet verified. No identities, grants or permissions changed.
- Genuine Bullrun OAuth then confirmed membership in configured guild1433570740430573642,
  while the owner dashboard reports that same linked community active and Everyone
  audience ready. The callback nevertheless denied baseline access if Discord's
  guild-list response did not produce a partner match, despite the earlier direct
  configured-guild membership lookup succeeding. The narrow correction treats that
  verified direct membership as an active onboarded-community admission fallback;
  it does not change Premium, coaching-role, alert or watchlist authorization.

- Source5efeb32 / deployment0d999d35 now includes repaired productionc3 plus the
  complete1f16 coaching follow-up. Coordinator confirms successful remote build,
  health200/exact141, original volume and both existing reviews retained.
- Natural maintenance first pass succeeded with no eligible agreements; scheduler
  activation verified, live recurring generation not claimed.
- Final deployed desktop editor containment, mobile inline saved review/no horizontal
  page overflow and teaching `1 student` label verified. Viewport restored.
- Available 13-area QA completed and recorded in the linked remediation QA report;
  genuine student/live Discord/eligible hosted-generation acceptance remains open.
