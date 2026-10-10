# Communities / Coaching complete QA — 2026-10-01

Status: current private-pilot QA checkpoint complete (October 10). Full-inventory
walkthrough, corrections and final staging retests are complete within the evidence
boundaries below. Current-production-parity staging is healthy on schema154.
Public multi-server launch is NOT ready; this is not blanket feature/go-live approval.
This report does not replace the thirteen-area inventory from September 27.
Prior fixture tests, prior browser tests, current browser tests and untested
boundaries are recorded separately. No production release is authorized here.

## Controlling inventory

### Latest integrated-build audit — supersedes earlier pending statuses

Final source `d4cc8b7ed6f60609b4fafbbfcb1fa82f8fb214d6`, deployment
`957306ce-052d-4ae9-bcd7-ee276da82c79`: SUCCESS/RUNNING, healthy schema154,
hosted build/TypeScript/280-page generation passed and empty deployment-error query.
Includes current production Academy `3b52308aa97541a9c7d47cc818f660ab465e9dc6`
plus all coaching corrections. No production coaching change or hosted data reset.
The last archived-audience fix now passes Chrome: synthetic student archived,
excluded from recipient picker and new All students draft (Bullrun only), then
restored with original2 work due and Journal sharing. Bullrun remained active;
unpublished draft hidden from Bullrun. Original review remains To review3/Saved2
with original dates/focus/notes. Final images decode; no private canary leak.
All thirteen bounded scripts re-run after the fix: PASS. Detailed tracked source
record: feature-workspace `docs/migration/coaching-final-qa-20261010.md`.
Earlier pending statements below are historical and superseded by this paragraph.

- Staging source `5fbb0548a805cfe06e20e263ce3949f23e73fe5b`, deployment
  `d6cb6bfe-5cd3-46e4-a105-91982b6b87ef`: coordinator-confirmed healthy schema154,
  remote TypeScript/build/280-page generation and startup checks passed. Preserves
  current production Membership, Academy, private Watchlist and previous coaching.
  Coaching has not changed production `8c55699203102f0c70e582099b2287a0abf408e1`.
- Final-build Chrome passes: owner onboarding reentry without resetting setup;
  human-readable role permissions; authorized-only overview links; per-plan
  capacity and existing-enrollment links; explicit Discord role selection and
  blank-role publish block; draft/publish/pause/archive staying on Coach Setup;
  author Discord-only watchlist access; both alert detail/edit links; delivered-only
  replies; UTC student dates with no captured hydration errors.
- Mobile390 and desktop1440 work metrics wrap without page overflow, desktop rows
  remain a table. Temporary viewport overrides reset. Student images both decode
  640x360 on the final build; completed review remains, private canary absent.
  Coach and student captured error consoles empty.
- Disposable final-navigation plan archived after its lifecycle test; no enrollment
  or payment. Existing synthetic trade review restored, existing plans preserved.
- Thirteen bounded regression scripts pass again. Final code audit then reproduced
  a new defect: createTeaching included archived students for new lessons. Fix
  `497aab8e174423ec56ce3db1d6a0aed1ac811a83` excludes them in all/plan/selected
  audience modes and the picker. In-memory reproduction failed before, full coaching
  lifecycle passes after, focused lint zero errors. Existing lesson recipients and
  history untouched. Coordinator owns follow-on staging; hosted retest still open.

#### Product/readiness disposition

- Closed test-server workflow has live evidence across all thirteen areas below,
  with historical, current and fixture-only boundaries retained. This is not a
  claim of exhaustive security/load testing or that every historical scenario ran
  again on the final image.
- Public launch blocker: onboarding remains hardcoded to the pilot guild, test
  roles/channels and privileged pilot-owner bootstrap. Needs a reviewed per-server
  onboarding design and authorization boundary; removing the gate alone is unsafe.
  Launch acceptance must prove: a second independent server can connect through
  verified owner authority; role/channel choices come from that server rather than
  test constants; a server owner receives no platform-operator privilege; bot and
  role synchronization failures remain isolated to the affected server; existing
  test-server data and cross-server denials stay intact. No second real server or
  expanded public access was created during this QA.
- Product choices still open: how ad-hoc requests consume paid review allowances
  and receive deadlines; official watchlist archive recovery and whether edits
  update prior Discord posts. No such behavior is silently invented or passed.
- Activity presentation is owner-deferred. Existing teaching completion explicitly
  separates student progress from the coach's Published/Completed status.
- Ended relationships are filtered from student workspace selection; role-paused
  and archived relationships retain their existing records. A post-termination
  read-only history experience is not a verified implemented capability and needs
  a retention/access decision before expansion.
- Future syndicated channels, cross-community network, commissions, native video
  hosting, real payments and paid AI accuracy are not part of this QA acceptance.

### October10 fresh new-user audit — active

Owner requested a fresh full walkthrough, not merely the last-fix smoke. Source
2029377, deployment54f772fb-09ee-487e-9d08-74f0cd4dd461, schema154 now has the
coordinator's parity/preservation attestation. No production release authorized.
The thirteen areas below remain the controlling target, together with onboarding,
owner/operator/staff, roles, channels, alerts/templates, watchlists and activity.

- NEW failure: submitting the already-connected pilot server through onboarding
  crashes the whole page. Narrow local action correction returns the established
  community only for its verified Discord owner, without resetting any settings.
  Targeted regression passes; hosted correction retest remains pending.
- NEW readiness boundary: onboarding still hardcodes the pilot guild, test-role
  mappings/channel IDs and operator grant. This cannot be called public multi-server
  onboarding; preserve the closed pilot gate while auditing the rest. Expanding it
  is a separate product/release gate, not an implicit authorization to open access.
- No new server was connected during this audit; authorized pilot remains intact.
- NEW failures: member overview links led to unauthorized404 destinations; Team
  exposed `community.manage`; coach directory/profile used obsolete overall
  capacity and disabled requests despite available per-plan slots. Local fixes
  preserve access checks, provide all capability labels, and use active per-plan
  counts. Tiny onboarding/component regressions pass; hosted retests pending batch.
- Fresh plan creation/reopen passed: unpublished `QA20261010 — new coach setup
  walkthrough`, two complete trading days weekly, three-day deadline, three student
  capacity, USD0, plus unscheduled custom coaching. Student test role selected
  explicitly; no payment or agreement was accepted by this action.
- Fresh student-to-coach message persisted and appeared in coach workspace;
  allowance decreased from2 to1. Both existing coach/student chart images decode
  at640x360 in both accounts after schema154 update. Private content remains absent
  from student view. Anonymous image404/no-store was verified on final source.
- Local correction: plan Discord role picker no longer silently defaults to the
  first mapped role (an alerts role). Explicit choice is required to publish,
  known role names display, existing saved roles persist. Component regression passes.
- Local correction: student-requested review focus now comes from accepted agreement
  items rather than a later edited plan. Regression reproduced failure then passes.
- Local correction: Discord-only official watchlist has an author/manager edit link.
  Unauthorized members remain excluded. Component regression passes.
- Fresh review626a058e passed student selection, inline feedback/save, shared AAPL
  executions and Journal note, overall/previous-focus drafting, final preview,
  delivery and student read acknowledgement. Private coach canary absent from both
  preview and student. Follow-up receipt, coach reply, new due date and final
  Completed state now confirmed on both sides; conversation remains intact.
- Fresh session scheduling/duration/link/agenda reached Bullrun, then completed
  shared notes entered student history without private coach notes. Test task
  completion removed it from Upcoming and retained coach history.
- Selected-student reused assignment published only to Bullrun with a due date;
  student completion reached coach as1of1. Original assignment unchanged.
- Local correction: coach Reply controls now match delivered/viewed/follow-up
  states, require body and disable paused access. Focused component check passes.
- Student console showed React418 with read dates shifting after hydration.
  Local UTC date correction passes server/Browser timezone equivalence check;
  hosted console retest is still pending. Student390px dark layout inspected with
  no horizontal overflow; temporary viewport restored.
- Follow-up Chrome custom-range check now passes using native date fields: exact
  October13 includes the assignment/count1; October12 excludes it/count0. Earlier
  Playwright fill failure was not a demonstrated application filtering defect.
- Fresh integrated analysis drawer reconciles six synthetic trades,3wins/3losses,
  net30; Explorer lists all6; NVDA Analyzer correctly says No saved analysis.
  Saved inline NVDA feedback remains editable; mobile390 settles at scrollWidth375,
  no page overflow. This check did not alter the review or request paid analysis.
- Fresh day/performance/strategy scope checks on the current integrated app:
  September25 day context contains NVDA only; September23–25 performance has3trades,
  net30 versus previous2trades/net10. Strategy execution/risk feedback survived
  reload. Restored the draft to Performance September18–25, original focus and
  blank temporary execution/risk feedback; original2saved/3queued trades preserved.
- Fresh plan published/paused/archived with no enrollment/payment, preserving other
  plans. Status action return to Coach Setup fixed in local5e54ff434 after8466a02bc.
  Coordinator is deploying these serially; final hosted correction audit pending.
- Official tracked watchlist added then removed a temporary ticker and persisted
  original AAPL-only content. Alert template reloads its required saved field.
- Chrome detached repeatedly after read acknowledgement; refreshed profile lookup
  and fresh coach tab briefly recovered, then detached again. Owner asked to
  reconnect coach/Bullrun profiles; source/fixture QA continued meanwhile.
- Ten bounded scripts plus remediation/community/delivery fixtures pass. Targeted
  lint: zero errors, six pre-existing unused legacy component warnings. No local build.
- Public onboarding is not release-ready. Additional product gaps: ad-hoc requests
  lack an automatic due-date/quota rule; archived official watchlists lack a recovery
  list; editing Discord-only watchlists does not rewrite old Discord messages.
  None of these is silently counted as a completed capability.
- Detailed correction/evidence record remains in the existing approved feature
  workspace at `docs/migration/coaching-final-qa-20261010.md`. Latest corrections
  are local only; full fresh UI inventory, hosted retests and final responsive pass
  remain open. Do not mark the goal complete or approve production.

1. Profile/plans: all thirteen editors, custom freedom, pricing/quote/currency,
   billing/capacity/role, draft/edit/publish/pause/archive.
2. Enrollment/agreement: requests/comparison, immutable acceptance, quantities,
   schedules/coverage/deadlines, hosted generation and idempotence.
3. Coaching Work: days/custom/week/month, search/filter/sort, due/per-plan counts.
4. Students: list/workspace, tasks, history/private notes, messages/images.
5. Review setup: trade/day/performance/strategy/custom, focus/comparisons/prior focus.
6. Trades: Find/To review/Saved, selection/removal, inline save/edit/persistence.
7. Journal tools: details/executions/chart/reports/Explorer/Analyzer, scoped reads.
8. Delivery: summary/actions/images/private omission, readiness/read/follow-up/status.
9. Sessions: time/duration/link/agenda, shared/private notes, completion/history.
10. Teaching: live/recorded/resource/assignment, audience/reuse/edit/progress.
11. Student dashboard: own relationships/work/media, requests/read/follow-up/privacy.
12. Isolation: coach/student/community, grant revoke, role pause/restore/history.
13. UI: mobile/desktop/light/dark, accessible controls, labels/errors/routes/console.

Related community checks: onboarding/operator/owner/staff boundaries, role mappings,
alerts/templates, official versus member watchlists, channel delivery and activity.
Deferred commercial decisions and the future cross-community network are not
silently counted as implemented or tested.

## Current live evidence

- Bullrun identity confirmed through Profile (Discord signed in). Existing accepted
  zero-dollar custom agreement and synthetic Journal account preserved.
- Student synthetic message persisted and appeared in the coach workspace.
- Existing chart, completed lesson, shared history and prior review retained;
  coach-private history absent from student view.
- Student request 3e15fd01: selected real shared synthetic AAPL, saved inline trade
  feedback, Saved 1 / To review 0. Summary/private draft survived reload.
- Student could not see undelivered summary/private note. Final preview omitted
  private note; delivery succeeded and student received trade feedback + summary.
- Student read acknowledgement changed Delivered to Viewed and recorded date.
- Student follow-up question appeared in coach final review; scheduling/completion
  checks remain in progress.

## Additional current-run evidence (October 1 local / October 2 UTC)

- Review lifecycle: Bullrun's request `3e15fd01` completed Find -> To review ->
  saved inline AAPL feedback -> final preview -> delivery -> student read
  acknowledgement -> student question -> coach answer -> follow-up due October 3
  -> Completed. Both parties retained the shared feedback and conversation.
  Coach-private review text remained absent from the student and final preview.
- Session: synthetic Bullrun session scheduled October 3, 15:00 UTC; 30 minutes,
  external placeholder meeting link, separate shared/private notes, Attended and
  Completed. Student saw the upcoming session before completion, then shared
  history after completion. Private session notes were not exposed.
- Teaching: synthetic assignment published only to Bullrun, received by Bullrun,
  marked complete by Bullrun, and reflected as 1 of 1 completed for the coach.
  Existing drafts did not appear to Bullrun. Coach lesson status has its own
  Draft/Published/Completed/Cancelled control; student completion does not itself
  complete the coach's workload item. This is an observed distinction, not a
  confirmed defect.
- Plans: all thirteen inclusion editors opened and saved together in unpublished
  `QA20261001 — all thirteen service editors`; reopening retained the selection.
  Edited trade count 2, question allowance 2 and Quote required persisted. This
  fixture remains a draft and is not a real offer.
- Agreement revision: the existing TEST private plan was extended with one weekly
  trade review and two weekly questions, retaining its custom service, zero price,
  capacity and role. Existing accepted terms did not silently change. A revision
  starting October 2 at 17:00 UTC was sent and is awaiting acceptance. The prior
  accepted agreement remains visible. No acceptance was performed by the agent.
- Data access: revoked only Bullrun's synthetic trade-history/notes grant. Coach's
  trade disappeared while separately shared analytics remained. Restored the exact
  original trade-history/notes grant; the trade reappeared. Original sharing is
  restored. No real Journal records were changed.
- Isolation: Bullrun received 404 for coach setup, another student's coach URL,
  and alerts without the mapped role. Private review/session/history text was not
  present in the student's rendered pages.
- Review tools: existing six-trade synthetic account rendered trade details and
  executions, analytics coverage, metrics and Trade Explorer. Saved review reopened
  inline. Analyzer accurately displayed no saved analysis; no new paid analysis
  was requested. Embedded chart rendered candles; quote accuracy is not claimed.
- Responsive: 390px mobile and 1440px desktop review workspace had no page-wide
  horizontal overflow. Inline feedback, labeled selection controls and drawers
  were inspected. Dark and light views checked; light/default viewport restored.
- Work organizer: search changed per-plan and due counts; Completed filter showed
  completed review/session/task records without active due counts. Month navigation
  moved between October and September and displayed the September lesson on its
  due date. Custom-date fill did not visibly stick in the IAB, so custom-range
  inclusion is NOT recorded as a current browser pass.
- Alerts: private personal template with required QA-reference field saved and
  selected. One synthetic tracked-page alert published; correct body appeared in
  the list. Actual Discord receipt is not yet verified. Do not replay it.
- Official watchlist: one synthetic AAPL watchlist saved in the list; its detail
  page failed as recorded below. Do not publish a duplicate to retest delivery.
- Named activity reflected fresh coach/student visits. Raw object UUIDs appear as
  page labels and a singular count reads `1 members`; presentation cleanup remains.

## Current isolated service checks

Both checks ran against disposable in-memory fixtures, not hosted student data,
using the feature checkout and canonical dependencies. An existing ignored Node
user-info fallback and a process-local server-only marker shim were required by
the local environment. No local production build or broad regression suite ran.

- `verify-coaching-remediation.ts`: passed unsigned/accepted terms, five generated
  occurrences, weekly/idempotent/month-end/unscheduled generation, immutable plan
  edits, revision conflicts, frozen terms, question renewal, follow-up expiry,
  draft/session privacy, teaching edit/reuse, role pause/restore, archive retention
  and foreign keys.
- `verify-traderlink-communities.ts`: passed 20 capabilities, community isolation,
  Discord-role mapping, journal grant revocation, named activity, Tier 2 idempotence,
  28 tables and zero foreign-key violations.

These service passes do not substitute for the blocked live browser checks.

## Confirmed failures / observations

### F1 — Official server watchlist detail (resolved; October 2 live retest)

New watchlist `a978c8d8-e5d1-44f1-bec6-64a85e8a683e`, titled
`QA20261001 — official watchlist delivery`, saved correctly in the owner's list.
Opening its detail URL repeatedly showed `This page could not load`, including
after a fresh owner reload around 02:54 UTC. Bullrun also received a generic error
instead of a useful denial. Browser recorded a Server Components render exception.
Coordinator inspected staging logs and reported an unserializable function passed
through a Client Component `component` prop. This establishes the render failure;
the exact source correction still needs implementation and browser re-verification.
No fix or corrective deployment was made during this QA slice.

Historical failure above is retained as evidence. It is no longer an open blocker:
see October 2 final deployment retest below.

### F2 — Activity presentation

Named activity uses raw object identifiers instead of readable student/review page
names and has singular/plural copy errors. Owner already deferred activity design;
retain as known presentation work, not as evidence of complete polish.

### Observation — teaching status

A published lesson remains Not started/Overdue in Coaching Work after all students
complete it until the coach changes the lesson's own status. The explicit completion
control exists. Whether this should be automatic is a product choice, not assumed.

## Historical October 1 outstanding gates — superseded by dated evidence below

1. Revised synthetic agreement acceptance requires owner action-time confirmation.
   Then verify hosted occurrence generation, repeat-load idempotence and the actual
   two-question limit. Service-level checks passed, live gate remains open.
2. Student image upload: Chrome extension refused file chooser access until owner
   enables Allow access to file URLs. No upload occurred in this attempt.
3. Fresh end-to-end role loss/restoration with both coach and student requires an
   authenticated owner Discord session. Current connected Chrome shows login, not
   guild role management. Prior coach pause/stale-submit/restore passed; do not
   misstate it as a fresh simultaneous student/coach cycle.
4. Exact Discord alert/watchlist receipt remains unverified. Coordinator was asked
   for outbox/message evidence; no receipt evidence received at this checkpoint.
5. Full custom-date, sort, plan state lifecycle, archive/restore, remaining review
   types and reuse variants have earlier/service evidence but not a complete fresh
   live pass across all thirteen inventory areas. The complete inventory remains
   controlling; no blanket completion claim is permitted.
6. Current staging release identity and production-parity acknowledgement requested
   from coordinator. Last known deployment 3c70cd64-335b-4b86-bd2a-8a0cd282ea6e at
   9d5d1be839e624377c960b7d0a64f725ac0879ad is historical, not freshly attested here.
   Fresh browser health check returned migrationCount 146, status ready and
   sqlite_single_node. Health does not clear the detail-page render failure.

## Environment and preservation

Only approved staging synthetic fixtures were added/changed. No production change,
deployment, bot reinstallation, role mapping change or real trading-data mutation.
Pending revised agreement, draft plan, completed review/session/assignment, private
template, one alert and one watchlist are intentionally retained as QA evidence.
Canonical checkout is mixed; no unrelated files were staged or committed.
At this October 1 checkpoint QA was incomplete and the watchlist gate failed.
The October 2 and October 10 sections record the subsequent fixes and retests.

## October 2 continuation — owner authorized all blocker work

- Owner explicitly confirmed acceptance of the zero-dollar test agreement. Accepted
  as Bullrun in Chrome; rendered Accepted. No payment. Hosted timer generated five
  weekly review occurrences (four due inside the 31-day coach list, one later).
- Question allowance initially showed one remaining because an earlier student
  message was already in the current period; one new synthetic message reduced it
  to zero and disabled Send. Existing history remains intact.
- Watchlist render correction committed in feature workspace at
  d8bf990e4139be41aa996292fc24f2443b58e79c; source/ESLint pass, deployment pending.
- Delivery audit found two more blockers: no hosted automatic sender, and sender
  ignores publishing mode. Corrected in e33c263d72d454f5b605186582a244d5c7cbafe1:
  bounded hosted worker/shared cron guard; tracked content omitted; full content
  included; active-community filter; historical cutoff. Focused verifier and lint
  pass. Coordinator owns production-parity staging integration and migration.
- Actual bot identity matches dedicated Communities application. Both private test
  channels returned 403 including metadata. Found authenticated This Guy Discord
  owner session in the other connected Chrome profile; both channels visibly empty.
  Added only the dedicated bot to these two test channels. Metadata/message reads
  now return 200. No old queued posts were replayed. Fresh delivery proof will follow
  deployment with an activation cutoff set by coordinator.
- Fresh Bullrun test-community role-loss cycle started; restoration and both-side
  verification still underway. Do not leave the test role removed at handoff.
- Chrome extension-settings URL is denied by browser control policy. No workaround
  or raw browser command was used. Student upload permission still requires the
  owner to toggle Allow access to file URLs; this is a tool capability boundary,
  not missing authorization to perform the test.

### Latest preservation checkpoint

- Follow-on 94f237a2be700e62aba42a0524a2f5e023a9bb6c bounds Discord network waits
  to eight seconds. Focused delivery verifier re-run passed after this change.
- Fresh role cycle DID pause both sides through the normal refresh: new October 2
  notices, student pause banner, student Send/Send image disabled, coach Send
  disabled and shared Journal absent. Restored exact test-community role in Discord
  afterward (around 03:38 UTC). Browser UI showed it assigned again. App recovery
  verification remains pending; the role is not intentionally left removed.
- Coordinator has cumulative allowlist/source and is preparing current-production
  parity staging deployment. Do not race its release or deploy this dirty checkout.
- Browser control subsequently timed out and reset twice; coordinator read-thread
  request also stalled and was terminated as a read-only request. No process killed,
  auth bypass, credential exposure or unrelated workspace cleanup attempted.
- Browser recovered with a fresh Bullrun Chrome tab. Both student and coach now
  show Coaching access restored for October 2; coach shared Journal and Send are
  available again. Student zero-question quota remains enforced after restoration.
  Student chart upload was retried and still requires the extension file permission.
- Coordinator integrated current production plus the exact corrections as
  0fa2e36759e34e30a4c031906b01325453a07d01. Final staging build
  34f4c69a-daaa-4270-83b4-d7dd07bc0d53 is underway; final deploy/schema proof pending.
- Reopened the thirteen-service synthetic draft on the production-mirror recovery
  deployment: all thirteen selections, quantities, quote setting and descriptions
  persisted. Cancelled edit without changes. Workload sorting could not be verified:
  repeated browser command timeouts followed by a kernel reset prevented dependable
  interaction, including on a newly opened coach tab. Do not count the sort attempt
  or remaining upload/delivery gates as passed. Coordinator retains release ownership.

## October 2 final deployment retest

Coordinator confirmed source 0fa2e36759e34e30a4c031906b01325453a07d01,
deployment 5938b2d5-6281-47b2-bef0-e17874e20067 SUCCESS, schema149, one writer.
Fresh browser verification:
- Original failed official watchlist detail now renders content, editor and working
  back link. No existing watchlist was republished or changed.
- Created four new labelled synthetic publications after the configured cutoff.
  Discord API independently confirms exactly one bot receipt for each:
  tracked watchlist 1555435004413223003; full watchlist 1555435319057195019;
  tracked alert 1555435570879139872; full alert 1555435759534743663.
- Tracked receipts omit private body markers and include exact staging detail URLs.
  Full receipts include body (and MSFT for the watchlist) without requiring a link.
  No QA20261001 receipt appeared; previous held records were not replayed.
- Tracked alert URL opens its exact title/content and editor for owner.
  Bullrun without watchlist role receives clean 404 for the new private watchlist,
  rather than the prior application crash. Required coaching test role remains set.
- No Railway changes or production actions performed by this QA worker.
The remaining broader QA inventory and student file-upload permission gap are not
cleared by these passes. Overall feature QA is not yet blanket-complete.

## October 9 continuation — additional live Chrome proofs

- Owner enabled file-URL access. Upload is no longer recorded as waiting for owner
  permission: current obstacle is intermittent Chrome control detachment/timeouts.
- Bullrun's weekly question allowance renewed to two; accepted agreement and prior
  delivered history remain visible. Six scheduled review occurrences are visible.
- Custom workload range October 17–24 includes both boundary dates, exactly two
  due reviews and two in the corresponding plan count; overdue/due-soon both zero.
  Native date-field setValue works; Playwright fill left the date empty and is not
  evidence of an application date-filter defect.
- Due latest sorts dated work November 14 down through September 28. Unscheduled
  assignment appears first under the existing null-date sort behavior.
- Synthetic plan QA20260927 - plan edit verification passed Draft → Published →
  Paused → Archived, each persisted across navigation/reload. It is intentionally
  left archived. Bullrun's actual test plan was not modified.
- TEST Student - Synthetic passed Active → Archived → Restore. Returned to Active
  with the same two work items and Journal shared state. Bullrun remained active.
- Reused the existing synthetic recorded lesson into QA20261009 — teaching reuse
  draft, explicitly unchecked Publish. New draft retained content/recording and
  reset progress; original remained intact. Edited draft content and recording
  link, saved and reloaded: both changes persisted. No lesson published in this run.
- Reuse currently defaults its audience to All students and Publish checked, even
  when the source is a selected-student draft; review this behavior before claiming
  full teaching usability acceptance. Test copy remained draft.
- Coordinator asked for read-only current deployment/parity status, with explicit
  instruction not to refresh staging during these writes. No deployment performed.
- Still open: remaining review-type/focus/comparison live exercises, student image
  upload/receipt, and reconciliation of the complete inventory. QA is not complete.
- Performance review type plus Rules/Risk focus saved and generated matching
  feedback editors. Restored the generated test task to Trade review with empty
  focus and verified reload. No feedback or delivery was submitted in that test.
- Lesson reuse source correction is local commit
  5b520200598f632da2472b10cde1fb4b2cadc495, parent94f237a2: preserves source audience,
  plan and selected students, defaults reused items to draft. See feature-worktree
  `docs/migration/coaching-lesson-reuse-qa-20261009.md`. Four binding assertions,
  TSX syntax and diff check pass; worktree ESLint dependencies unavailable. Pending
  coordinator integration and live retest; do not count as deployed.
- Coordinator freshly re-attested unchanged staging source0fa2e367/deployment
  5938b2d5/schema149 and health ready. Current test writes at safe checkpoint;
  synthetic student and review configuration restored, new teaching copy draft.

## October 10 final QA continuation

- Coordinator deployed reuse fix, then label/reminder correction; final empty-focus
  editor correction is being deployed. No production coaching release requested.
- Feature commits: 5b520200 (reuse defaults), 825502b5 (review labels and reminder
  chronology), a6e8304d (cleared optional editors). Exact narrow allowlists retained
  in feature-worktree progress record `coaching-final-qa-20261010.md`.
- Live performance comparison: September 23–25 synthetic data gives 3 trades,
  net 30, 2 winners/1 loser; prior September 20–22 gives 2 trades, net 10.
- Trading-day September 25 scopes Journal to NVDA. Strategy execution/risk feedback
  persisted across reload, then was cleared. Custom review saved with no dates.
- Fresh student upload succeeded after resolving a stale Chrome element. Attachment
  2749c217-31a3-4cce-98d1-04b92f5979b7 appears in both student and coach messages;
  coach image is decoded at 640x360. Existing attachment remains unchanged.
- Reuse of Bullrun-only assignment now preserves Selected students and Bullrun
  checked, synthetic student unchecked, Publish unchecked. Save/reload retest next.
- Re-ran isolated remediation, community and Discord-delivery checks: all pass.
  Entry-point (eight cases), action navigation and reminder/focus regressions pass.
- New isolated reader-contract test passes bounded day notes/rules, selected-trade
  notes/tags, currency-separated comparisons and absent/unshared-data exclusion.
  Annotation collaborators are synthetic; this does not pretend hosted day notes
  existed in the old synthetic fixture.
- A form attempt crossed a staging swap and hit Next's UnrecognizedActionError.
  Reload recovered; no review was created. Holding writes until final deployment
  is healthy. This is not counted as a successful review-creation test.
- Current synthetic draft 69865ebd is temporarily Custom with no dates; restore its
  original Performance / September 18–25 / Rules, Journal, Next steps after retest.
- Activity presentation remains owner-deferred; future network and unsettled
  partner-commercial terms are not silently included in launch acceptance.

## October 10 correction retests and complete inventory reconciliation

- Latest correction source on staging: 17dfd6950f18e352676c167445d59c5650c0cd0b,
  coordinator-attested healthy, schema149. Production-parity refresh is a separate
  remaining gate; this source is not described as current production plus feature.
- Custom review a69f9cce was created for Bullrun without trades or dates, saved with
  a summary/next focus/private canary, previewed, delivered and acknowledged Viewed
  by Bullrun. Private canary is absent from student DOM and final preview. This is
  synthetic QA, not a new paid agreement or real coaching commitment.
- Pre-existing scheduled review682f38d5 now shows that delivered next focus. This
  verifies the pre-created-draft reminder fix in the live coach workspace.
- Empty, deselected Execution/Risk feedback editors no longer appear. Saving the
  remaining Rules/Journal feedback no longer produced the validation error.
  Original synthetic draft69865ebd restored to Performance, September18–25,
  Rules/Journal/Next steps; Saved2/To review3 and original notes are preserved.
- Reused Bullrun assignment saved as `QA20261010 — selected-student reuse draft`:
  one student, unpublished, progress0/1. Original remains published/completed1/1.
  Selected students/Bullrun and unchecked Publish survived the reuse flow.
- Final targeted rerun: remediation lifecycle, Communities isolation/capabilities,
  four-mode Discord delivery, review-context/reminder/focus contracts and both
  navigation checks all pass. No local production build or production writes.

| Area | Reconciled evidence | Boundary |
| --- | --- | --- |
| 1. Profile/plans | Thirteen editors saved/reopened; edit, quote, quantities and Draft/Published/Paused/Archived exercised | Existing coach profile preserved; profile contract covered by service verifier |
| 2. Enrollment/agreement | Accepted zero-dollar revision, frozen previous terms, generated occurrences; renewal/limits live; idempotence/month-end service checks | No real payment provider transaction; Discord owns payment |
| 3. Coaching Work | Day count, inclusive custom boundaries, week/month, search/status/sort and matching plan counts live | UTC/DST edge cases covered by bounded helper checks, not every browser timezone |
| 4. Students | List, workspace, tasks, shared/private history, archive/restore, bidirectional messages and decoded images live | Only approved synthetic/test identities used |
| 5. Review setup | Trade/day/performance/strategy/custom, persisted focus, comparison and previous-delivered-focus live | Day notes/rules use synthetic reader-contract coverage; no fabricated hosted day notes |
| 6. Trade workflow | Find/To review/Saved, selection/removal, inline save/advance/edit/reload live | No claim of high-volume load testing |
| 7. Journal tools | Details/executions/chart/scoped reports/Explorer live; Analyzer honestly empty | No paid analysis generation or external candle-price accuracy certification |
| 8. Delivery | Readiness gate, final preview, private omission, delivery/read/follow-up/due/completion live; images/actions service coverage | Optional blank sections not required; retained unfinished fixture not delivered |
| 9. Sessions | Schedule/duration/link/agenda, shared/private notes, attendance/completion/history live | External meeting links only; no native video service |
| 10. Teaching | Recorded lesson/assignment receipt and completion, edit/reuse/draft audience live | Plan-targeted audience contract checked; no real external class conducted |
| 11. Student dashboard | Genuine Bullrun login, accepted terms, own work/messages/media, trade request/read/follow-up live; multi-coach selector fixture passes switching/remounting and own-active filtering | Selector edge cases are component-contract coverage, not two live coach OAuth sessions |
| 12. Isolation/access | Cross-user denial, grant revoke/restore, real Discord role loss/restore and retained history live; image isolation service checks | Not an exhaustive penetration test |
| 13. UI | Desktop/mobile/light/dark, contrast, labels/inline controls, routes checked; correction-specific retests passed | Final integrated-build smoke pending; activity presentation remains owner-deferred |

Related Communities evidence includes role/capability isolation, personal alert
template save/select, official watchlist detail correction, four exact live private
Discord receipts and no replay of older outbox records. Activity records visits;
readable activity labels/presentation remain the already-deferred product work.
Future community networking, syndicated channels and unsettled commissions are
not part of this completed workflow scope and are not represented as implemented.

Current technical disposition: exercised coaching workflows pass on the correction
build. Do not declare go-live readiness until current production features are
reconciled into staging without losing coaching/schema history and the final
integrated-build checks pass. Production release still requires owner authorization.

### Additional final-audit finding — attachment denial response

Anonymous requests to the synthetic attachment returned empty HTTP500 twice on
17dfd695. No image bytes leaked. Known expected authorization errors were not
translated at the route boundary. Local correction c9af4da679d57dc6d80a9c0f2ce9e78123b6edf3
returns the same empty private/no-store404 for absent, invalid and inaccessible
images, preserves every authorization guard and propagates unexpected failures.
The focused handler regression passes seven expected-denial cases, absent
community, authorized bytes and unexpected-error propagation. Coordinator has the
exact three-file allowlist; hosted anonymous404 and authenticated image retests
remain required after integration.

Follow-up bffdfcef488ec82af1039fb5d54e53af9565d7e0 fixes a reproduced native
Response-header TypeError for Unicode/emoji filenames. The header now provides
an ASCII fallback and encoded UTF-8 filename; regression verifies unchanged image
bytes and successful responses for Unicode/emoji/quoted names. Same narrow route,
test and progress-note allowlist; no authorization, schema or UI change.

Hosted denial retest on October10 at16:01UTC passes on final runtime candidate
2029377: anonymous GET of the existing synthetic student attachment returns404,
zero bytes and `Cache-Control: private, no-store`. Normal schema149 runtime remains
healthy while the coordinator restores its expired CLI sign-in to complete the
guarded149-to154 staging migration. Authenticated images and integrated UI still
require the final post-migration pass; this result does not close that gate.
