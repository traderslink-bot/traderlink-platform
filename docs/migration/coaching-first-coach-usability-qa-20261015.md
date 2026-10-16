# Coaching usability QA — first-time coach, October 15, 2026 Toronto

**October16 update:** all13 findings now have local corrections and targeted UI/
action/service verification. [Correction batch](coaching-usability-corrections-20261016.md).
They are not yet released or accepted in a signed-in staging browser. The original
reproductions below remain the before-state record.

## Verdict and scope

**NEEDS IMPROVEMENT for first-time-coach usability.** Core controls are present,
but there are reproducible discoverability, draft-loss and publication-clarity
issues. The main pass established12 usability findings; the subsequently completed
My coaching follow-up adds UX13, for13 total:11 in primary flows and2 on secondary
Reviews/Sessions routes. These are not13 backend failures.
No application code, data contract, hosted data or deployment changed for this QA.

Tested local source `c83088a51` in
`/workspaces/traderlink-coaching-completion-audit`. That includes the just-added
service-card/preview Edit buttons; those are not yet deployed to staging. Results
must not be attributed wholesale to the older deployed staging release.

Method: real React/MUI components and actual student/review/final route render
functions with synthetic snapshots. Authentication, server loaders/actions,
Journal reads and chart provider are replaced at explicit isolated boundaries.
No real account, database, Discord request, file upload, notification or payment.
No actual app server/dashboard shell or hosted navigation/session was tested.
Screenshots inherit shared Light/Navy theme; font assets and surrounding shell
are not independently accepted by this harness.

80 rendered screen/state/theme/viewport cases: new/no-profile setup, profile with
no plans, configured setup; empty/pending/active Students; empty/populated Work,
Reviews, Sessions, Teaching; active/paused student workspace; draft review; final
not-ready/ready/delivered. All four appearance/size combinations1440×844 and390×844
rendered without page exceptions or document-level horizontal overflow. Dialog,
keyboard and workflow checks follow below; an absence of page exceptions is not
proof that all save/API operations succeed.

## Prioritized findings

| ID | Priority | Reproduced observation | Effect on a new coach | Recommended correction; not yet implemented |
| --- | --- | --- | --- | --- |
| UX01 | Medium | First-time Coach Setup has a profile form and empty Enrollment requests/Coaching plans panels. The plan builder is absent until a profile exists; no text explains that dependency. Empty Students/Reviews/Sessions/Work give no next-step action. | Coach cannot tell whether plans are missing, unavailable or require a saved profile first. | Put task-specific next-step guidance/action in empty panels: save profile, create plan, then enroll a student. Avoid generic page subtitles. |
| UX02 | High | A named performance plan with a valid zero price still has Publish plan disabled while the required Discord coaching role control is inside collapsed Discord enrollment settings. With mapped roles available there is no visible explanation beside Publish. Selecting the role enables Publish. | A coach has no clear way to recover from a disabled primary action. | Explain the unmet role requirement beside Publish and provide a direct focus/scroll action to the role selector; preserve all role checks. |
| UX03 | High | Type an unsaved new plan name, then click Edit on an existing plan. Builder replacement discards the new plan. Cancel edit returns to a blank new plan, losing that name. No warning. | Coach loses work while exploring plans. | Preserve the draft separately or guard switching/cancelling when dirty. Do not silently overwrite it. |
| UX04 | High | Create lesson starts with Publish checked; the main button is only Save. Same defaults appear for a coach with no students. | Save can mean immediate publication rather than draft preservation; a first-time coach gets an avoidable recipient rejection. | Make Save draft and Publish explicit actions, show the intended audience before publication and provide clear guidance when nobody is eligible. No delivery action was executed during this audit. |
| UX05 | Medium | Under Audience=All students, the Plan selector and student checkboxes remain available. Selecting Weekly Trade Review leaves the submitted audience as all_students while also submitting a plan ID. | Choosing a plan looks like it narrows recipients but does not change audience mode. | Make audience-dependent fields conditional and show an accurate recipient summary. Preserve explicit audience authority; do not silently broaden recipients. |
| UX06 | High | Type an unsaved lesson title, then click Reuse on an existing lesson. Title is replaced with the source lesson without confirmation; on mobile scrollY stays691 and focus stays on Reuse, away from the form above. | Lost draft plus no visible indication of where reuse happened. | Preserve/guard the current draft; move focus/scroll to the reused lesson form with a clear state indicator. |
| UX07 | Low / secondary route | Reviews list has Open links for each review, but both target the student workspace without a review ID. | Coach must find the selected review again. | If this route remains supported, link directly to the selected review and use Open review. Primary Coaching Work already uses direct review routes; do not describe its navigation as broken. |
| UX08 | Low / secondary route | Sessions list is display-only: no open/edit/join action. Its date renders browser-local time without a timezone label, while student session editors explicitly use UTC. | A coach opening this secondary list cannot act or confidently interpret time. | Add a route to the student session or retire/consolidate the unused list; label the actual displayed timezone. Primary session scheduling/editing is implemented in student workspace. |
| UX09 | Medium | Overall review uses Coach notes for the coachPrivateNotes field, beside student-visible summary fields. Session editor explicitly says Private coach notes. | Coach has to guess whether the review field is shared. | Use clear, consistent private/shared labels and a truthful preview boundary. No private-note leak was established. |
| UX10 | Medium | Student workspace Shared Journal section says only Journal access is off; no recovery instruction/action. Review workspace does give clear student-controlled sharing instructions. | A new coach does not know who must act until they enter a review. | Reuse the existing student-controlled sharing guidance in the workspace; coach must never grant access on behalf of the student. |
| UX11 | Medium | A relationship with access paused still shows active at the student header while Save access and other controls are disabled. Generic Coaching access is paused appears later in Messages. | Relationship status and current access appear contradictory; blocked actions lack nearby explanation. | Show both lifecycle and access status at the top, with reason-specific recovery guidance appropriate to coach/server owner. Preserve existing checks. |
| UX12 | Medium | Select a local synthetic image: the hidden input has QA_ONLY_PENDING_IMAGE.png, but no filename or preview is displayed. Send image is also enabled before a file is chosen. | Coach cannot confirm what will be sent or see that a selection succeeded. | Show selected filename/preview and clear/remove controls; disable sending without a valid selection. Keep server validation. No upload or send occurred. |

### Evidence/reproduction map

Each finding was inspected in Light/Navy desktop/mobile. Actual browser assertions
are in `interaction-results.json` (52 observations including recovery/positive
cases) and `recovery-results.json` (12 observations). File names UX01…UX12 map to
screenshots, except UX10 uses the matching student full-screen snapshot/JSON.
`screen-results.json` includes all80 screen states and their headings, visible
controls, links, text, render exceptions and overflow measurements.

Source anchors:
- UX01/03: `app/(dashboard)/communities/coach-setup-page.tsx`, profile conditional,
  editingPlan state and keyed builder replacement.
- UX02: `coaching-plan-builder.tsx`, collapsed Discord enrollment settings and
  Publish disabled condition.
- UX04/05/06: `coaching-program-pages.tsx`, TeachingPage audience fields,
  defaultChecked Publish, generic Save and setReuseId form replacement.
- UX07/08: same file, ReviewsPage link and SessionsPage card rendering.
- UX09: `coach-review-editor.tsx`, coachPrivateNotes TextField.
- UX10/11/12: student workspace route at
  `app/(dashboard)/communities/[communitySlug]/workspace/students/[relationshipId]/page.tsx`.

## Coverage across all13 Coaching areas

| Area | New-coach usability result | Exact checked boundary |
| --- | --- | --- |
| 1. Profile and plans | FINDINGS UX01–03 | Empty profile prerequisite, plan editor/preview, hidden publishing requirement, dirty-plan switching. All13 service Edit entry points retain their earlier actual-component verification. |
| 2. Enrollment and agreements | MIXED | Requests tab/count exposes Accept/Decline; Prepare agreement expands real price/start/deadline/quantity fields. New-coach sequence lacks guidance (UX01). Real acceptance/recurrence not repeated. |
| 3. Coaching Work | MOSTLY CLEAR, empty guidance gap | Upcoming/Week/Month/Custom filters and due/status summaries visible; useful direct review action exists. Empty state lacks a next-step CTA. No assertion of all filter arithmetic/timezone semantics. |
| 4. Students | MIXED | Active/Requests/Archived/Ended separation and Journal/work chips; pending request controls checked without submitting. UX01/10/11 affect next steps and access status. |
| 5. Review types and context | CLEAR type controls; disclosure gap | All5 workspace kinds selectable; date requirements change for performance/trading-day. Focus choices visible. Read-only analysis providers excluded. UX09 private-note label. |
| 6. Trade workflow | PASS in isolated UI | Actual persistent component: Find → Select all → Add to review → feedback → Save trade review → Saved1 → View or edit preserves text. Synthetic local optimistic mode only, not server persistence. |
| 7. Shared Journal/tools | UX10 | Student-controlled Journal-off notice is actionable in review, not workspace. Trade Details/Chart/Analytics entry points inspected; providers and real granted facts excluded. |
| 8. Final review lifecycle | PASS bounded presentation | Not-ready Send disabled with required-count/Journal recovery instructions; fulfilled and delivered states rendered with Return/Complete/follow-up controls. Actual delivery/acknowledgment/completion not repeated. |
| 9. Sessions | MIXED | Student Session details exposes schedule/link/attendance/shared/private notes, with UTC labels. Secondary list UX08; no meeting created or joined. |
| 10. Teaching | FINDINGS UX04–06 | Publish defaults, audience/plan mismatch, draft overwrite on Reuse and focus position. Existing published/draft lesson editor visible; publication not executed. |
| 11. Participant communication | UX12; some clarity | Message Send and chart/image picker inspected, selected file verified locally with no upload. Follow-up message form visible in delivered final state. Student session/source isolation proof remains prior evidence. |
| 12. Privacy/access lifecycle | UX09–11, no bypass established | Private/shared history choice explicitly shows Coach only; paused controls disabled; privacy wording inconsistent. No grants/roles/archive/deletion changed or verified anew. |
| 13. Appearance/navigation/reliability | PASS bounded layout; UX gaps above |80 renders across Light/Navy1440/390; no document overflow/page exceptions. Not full shell, full keyboard audit, accessibility certification, zoom matrix or hosted failed-save acceptance. |

## Successful interactions retained

- Five review kinds changed successfully; performance/trading-day dates required.
- Find/select/queue/save/reopen trade feedback works in all four fixture views.
- Student Requests exposes decisions without mixing active students.
- History visibility explicitly supports Shared / Coach only.
- Required-work final guard explains that only the student can grant Journal access.
- Existing service-card/preview Edit correction remains closed; no redundant fix.

## Recommended implementation batches

1. Protect unsaved work (UX03/06) and make lesson publication/audience explicit
   (UX04/05). These address lost work and unintended publication expectations.
2. Make setup and disabled-action recovery clear (UX01/02/10/11), including direct
   navigation to required options, following the approved Edit pattern.
3. Make private notes and selected files explicit (UX09/12).
4. Decide disposition of secondary list routes (UX07/08) based on actual supported
   navigation; primary Work/Students flow need not be rebuilt.

These are proposed UX corrections, not implemented product/copy changes. Do not
change server permissions, plans, accepted agreements or grant Journal access to
hide a usability issue. No new commercial workflow or dashboard redesign proposed.

## Evidence, limitations and continuation

Retained sanitized evidence:
`/workspaces/traderslink-coordinator/preservation/coaching-first-coach-usability-20261015/`
contains metadata, screenshots, JSON, isolated browser harnesses and logs. No raw
provider responses, OAuth material or customer records. Temporary app bundle and
formatted read copies remain only in `/tmp/coaching-new-coach-ux/`.

Initial harness corrections (missing resolve directory/server-action adapter and
an expected option called Private rather than its actual Coach only label) were
fixed in the disposable harness. They are not application defects. Final80 renders,
52 observation assertions, four extra workflow checks and12 recovery observations
passed. These checks reproduce the usability findings; passing the harness does
not mean the feature's usability is accepted.

No production build: QA-only files/documentation, no runtime implementation change.
Help guides reviewed as the current behavior baseline. Any implemented navigation,
publishing or private/shared wording change must update the affected guide then.
No whole-feature launch claim or speculative backend fix. Existing stage records,
Bullrun/moonmafia, both commissions, Journal grants, Discord and production untouched.

The owner-requested My coaching inspection was queued until the new-coach pass
finished. That pass was recorded at453a05ef4 before the follow-up below began.


## UX13 — My coaching follow-up, performed after the main pass

**Medium priority, confirmed route/state mismatch.** My coaching is the student
workspace for coaching the signed-in person receives. It is implemented and is
not an abandoned placeholder. Coach workspace is the coach's operational entry.
An account can legitimately be both coach and student; removing student access
from all coaches would be incorrect.

Source tracing and actual rendered component checks establish:

1. The community menu shows My coaching whenever any relationship has the viewer
   as student, without filtering status. A pure coach with no student relationship
   gets Coach workspace and no My coaching tab. Actual CommunityDashboard JSX
   inspection verified pending, declined, active and ended menu cases.
2. `/communities/coaching` also redirects on any matching student relationship,
   including pending, before considering that community's coach workspace.
3. StudentCoachingWorkspace displays only active/ended relationships. Pending or
   declined-only snapshots render just No active coaching and Journal sharing.
   The pending request's coach/plan/status and a recovery/navigation action are
   absent. Existing plan cards can label this same destination View request,
   making the missing request information particularly misleading.
4. The coaching section returns before rendering community tabs. This student
   page therefore omits that local community/Coach workspace navigation. This is
   source inspection, not a whole dashboard-shell navigation test.

New isolated Chromium checks rendered active/pending/declined student snapshots
in Light/Navy1440×844/390×844:12 cases, no render exceptions or horizontal
overflow. Active shows a functional student workspace; pending/declined show the
empty message. No hosted account/relationship was read or changed. This proves
the defect pattern, not the status behind the owner's current signed-in screen.

Recommended correction: preserve separate coach/student destinations and show
truthful pending/declined request details with the appropriate next action. Keep
a clear way back to community/Coach workspace. Clarify student-side naming if
needed under the owner's UI/copy approval; do not delete implemented student
coaching or silently hide a pending request. No correction implemented in this QA.

Source: `community-dashboard.tsx` hasStudentCoaching/memberTabs and coaching early
return; `communities/coaching/page.tsx` ownRelationship redirect;
`student-coaching-workspace.tsx` relationship filter/empty state.
Evidence: `my-coaching-results.json`, `menu-results.json`, UX13 screenshots and
corresponding isolated harnesses in the retained evidence directory.

**Final total:13 usability findings (11 primary-flow issues and2 secondary-list
issues).** The next implementation batches should include UX13 with setup/access
clarity. Main-pass evidence, former passes, scope and release boundaries unchanged.


## Usability correction batch — October16 Toronto (local verification)

Owner authorized proceeding with the next batch. UX01–UX13 now have local
corrections: draft-switch/reuse confirmation; explicit private draft/publication
actions and scoped recipients; actionable setup/role/Journal/pause guidance;
direct review/session links and UTC labels; private-note labels; selected-image
preview/validation; and visible pending/declined student requests with navigation.
No permissions, role assignments, grants, agreements, schema or hosted records
changed. Original observations above remain the before-state evidence.

[Implementation, checks and release boundaries](coaching-usability-corrections-20261016.md).
All13 are addressed locally, not closed as signed-in staging acceptance. Production
integration artifacts still need to include this batch; do not apply the production
manifest to the existing staging database.
