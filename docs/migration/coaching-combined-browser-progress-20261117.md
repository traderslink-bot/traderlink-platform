# Coaching combined staging browser discovery — November 17, 2026

Discovery is in progress. No complete Coaching workflow or production signed-in navigation acceptance is claimed.

## Qualified target

Coordinator qualified source `b631fc7ec77de4ca4c5bce260a5dfc7b9774e715`, reviewed code `afc7848a869ae9a31e2fb317cd5e4b8b5805e2ad`, deployment `3b329ff9-f2db-49b3-a76a-7582c7cd46f3`, schema 203, build `dVBDt1zxDP1bIc7MW4TX-`. Only the three existing isolated staging sessions were used. Browser requests were restricted to the staging origin. Private state and page captures remain outside Git with restricted permissions; no tokens or personal account identifiers are included here.

## Actual results

- Approved coach and student: standalone `/coaching` HTTP 200, empty Coaches state.
- Third synthetic identity: `/coaching` HTTP 404. Empty initial body alone does not establish the final visual 404 presentation.
- Actual coach: normal Community admission editor available. Existing test guild approved, separate Coaching exemption initially unset.
- Student and third identity: admission page presents locked owner-access shell, no admission editor. HTTP 200 locked page is not an HTTP 403 assertion. Mutation denial remains to test.
- Normal admin form granted the separate free Coaching exemption for the approved test guild only. Save confirmation passed; reload showed Eligible. No policy, SQL or provider mutation was used.
- Standalone first coach profile saved using normal UI and displayed Saved. No browser leave-site dialog was observed during save.
- Community profile saved successfully through its normal UI. Community plan publication was attempted and blocked as described below. Earlier exact accessible-name automation timeouts are harness findings, not demonstrated application defects.
- Standalone create-plan page HTTP 200. Community create-plan page needs explicit loading completion before its controls are assessed.

## Consolidated findings requiring source/scope review

1. First-time standalone profile photo picker explicitly requires saving the profile before choosing a photo. Browser and source agree; this conflicts with the owner request to allow photo selection before first profile save. No fix applied during discovery.
2. Standalone plan preview renders Set your price — One-time before explicit choice. Check against the owner instruction to omit default price/frequency preview until selected.
3. Standalone plan preview retains Choose services to see what your students will receive. Check against the owner-supplied replacement guidance and standalone/Community scope.

4. Community Publish plan fails with a generic error when Student enrollment role is empty. Source confirms a required mapped Discord role is enforced server-side, while the hidden enrollment field has no required indication/client validation. Inputs remain intact. The isolated student currently has no genuine Discord roles; do not fabricate membership or bypass the guard to claim a successful workflow.

## Further normal standalone workflow results

The coach saved a published free offsite recurring plan for two trades weekly, student-selected, five delivery weekdays, excluding weekends. Server edit page retained Exclude weekends. Student requested this plan through View coach and Request coaching; coach sent the agreement; student accepted through the normal forms. Accepted agreement shows the Journal sharing prompt including notes/tags, older-trade preferences belonging to the student, and an awaiting-submission review with due date December 4, 2026, 1:00 PM Eastern. This is the BEFORE-submission deadline observation only. No early-submission, replacement or draft-lock pass is claimed. Primary Journal is offered in the sharing form; sharing and trade creation remain pending.

## Remaining controlling inventory

Continue standalone and Community normal profile/photo, plan setup/details, agreement acceptance and sharing, scheduled early submission with unchanged deadlines before/after/reload, exclude-weekends persistence, untouched trade replacement, one-trade draft lock, same-trade duplicate prevention, trading-day replacement, recurring optional daily cap and period allowance, pack exhaustion with precise retained-input errors, Journal consent/revocation, required assessment and evaluation completion, student feedback visibility/private-note isolation, follow-up/history, owner/member/third identity and cross-community denials, desktop/mobile Light/Navy states and keyboard/focus/scroll. Later source/image changes require affected reruns. Final repository regression remains separate.

## Harness and resource observations

Network-idle navigation timed out because of ongoing app requests; DOMContentLoaded plus explicit visible controls is required. Cookie banner can appear after initial DOM and intercept Save; dismiss through Reject optional before interacting. No forced clicks or hidden-control bypasses were used. Every browser launch held both exclusive owner record and common flock; owned guards were released after each bounded batch. No production changes or provider effects occurred.

## Sharing, role options and responsive checks

Normal student Journal sharing saved and survived reload with required Trades/Analytics and optional Trade notes/Tags checked. Actual Community enrollment dropdown has only Select role, no configured mapped role. Student and third identity GET admission API both return 403; photo API without their own context returns 404. Third identity profile returns 404. Redirect-manual Community setup fetch yields an opaque redirect (status 0); no HTTP 403 is inferred from it.

Normal student Session Tracker `/trade-tracker` returns HTTP 200 with Dashboard access is not available yet and no entry controls (November 17, 5:39:48 PM Eastern). No trades were created. This is a real staging-account qualification blocker; do not bypass native access. Coordinator informed to arrange normal authorized access/controller. Early submission/swap/draft lock still unrun.

Community trade setup at 1440px and 390px was visually inspected in Light and Navy. Four cases showed document width equal viewport, no horizontal overflow; desktop panel 880px and mobile panel 390px. Questions/fields display in two columns on desktop and stack on mobile. Normal appearance preference was restored to its original Dark value afterward. Deliver within (days) field label clips within its 120px input; record for the coherent correction batch. Screenshots remain private generated evidence, not source. Keyboard/focus/scroll and other service states remain pending.

## Additional setup and photo qualification

Community normal Save draft succeeded and the draft remained after reload. Its actual edit route retained quantity two and Exclude weekends. On-request setup removes Trades chosen by and shows Student in the preview; daily limit is optional and blank by default. Trade Review Pack removes the recurring-period control and retains pack quantity and optional blank daily cap. These are setup checks, not submission-limit enforcement passes.

Trading-day and Performance panels were inspected in both standalone and Community. Both Performance editors default all six criteria checked and show the overall written assessment as Required, with the owner-provided long instructions in the preview. Community follow-up is at the bottom; Community trading-day notes are supporting evidence without a separate notes-sharing checkbox. Standalone trading-day setup still exposes Consider shared trading-day notes and tags and puts follow-up above evaluation. Record these differences against the earlier owner scope; no source edits during discovery. Hidden Written feedback within the collapsed preview caused a harness wait timeout; waiting for the active panel Done control resolved it without an app change.

After a first profile exists, normal standalone photo upload succeeded using the repository's 192px app icon as synthetic test media. Reload returned image GET 200 and rendered an actual complete 192×192 image. Normal removal required its expected Remove your profile photo? confirmation; accepting it returned DELETE 200 and Photo removed. Initial automation dismissed that expected confirmation, so the initial removal timeout was not an application failure. No leave-site dialog occurred during save/upload. First-save-before-photo remains the separate actual regression.

## Mutation guard probes

With normal same-origin browser fetch and required request headers, unknown no-op probe payloads were rejected before any valid mutation could execute. Student and third identity POST admission API returned 403. Third identity POST Coaching action returned 401; approved student reached application validation and returned 400 for the deliberately unknown intent, as expected for an allowed pilot identity. These probes do not replace valid resource-specific cross-relationship/ownership mutation tests.

At this checkpoint no trade has been created or submitted, and no draft trade feedback has been saved. The exact remaining behavioral blockers were sent to Coordinator; all owned browser/resource guards are released. Production remained unchanged. Latest tests do not verify the owner's signed-in production sidebar click.

## Genuine test role and Community publishing

Coordinator created one dedicated zero-permission Discord role in the approved Tests guild, assigned it only to the genuine test student and refreshed actual provider membership through normal services. Coaching selected the exact handed-off role ID from the normal owner role-management UI and mapped only Access coaching; no coach/admin responsibility was checked. Role access saved. The existing Community draft selected this role as its required enrollment role and Publish plan succeeded, displaying Published. No SQL or provider writes were performed by Coaching.

The next student Community coaching request is blocked by the same ordinary dashboard-access shell as Session Tracker (HTTP 200 with no request controls). The timeout waiting for Request coaching was followed by actual page capture establishing this access boundary. No Community enrollment request executed. The role and ordinary app-access qualifications are separate; publishing success does not establish student enrollment or review behavior. Coordinator is preparing normal audited ordinary-feature access; no readiness claim until qualified.

## Qualified ordinary access and canonical trade setup

Coordinator committed two normal audited ordinary-feature owner grants through current native authority. Fresh same-student Session Tracker then displayed actual entry controls. Coaching entered sixteen unique synthetic closed trades through the normal Journal UI: preview, confirmation and Save trades, two canonical executions per trade. All sixteen commit responses returned 200, created two executions and one affected trade, with analyzerQueueOutcome null. Dates November 16 and 17 are real past dates inside the initially inspected November 16–20 Community selection window; no clock override, future executions, raw SQL or direct API seeding was used.

Student Community browse entry is Coaches; My coaching correctly returned 404 before an existing relationship. Normal request and coach enrollment acceptance succeeded. A proposal starting November 16 could be sent but student acceptance failed into the error boundary. Coordinator verified the actual 23:52:12.977 UTC log: the first review week had already started, requiring a future start. Fresh UI still showed Awaiting acceptance, confirming rollback. Keep this business guard; proposal validation and friendly mutation feedback are concrete correction findings. Normal coach revised to November 23, and student acceptance with required Journal consent passed. Normal Schedule work generated the first review.

## Actual scheduled early submission, swaps and individual draft locks

Standalone: student early submission returned 200. Deadline December 4, 2026, 1 PM Eastern remained identical before submission, afterward and after reload. Student swapped untouched QAAX for QACX; fresh UI confirmed QABX/QACX and unchanged deadline. Coach saved feedback only on QABX, and the student replacement selector disabled QABX as Locked while leaving QACX replaceable. Student then replaced QACX with QADX; reload kept the deadline. A post-reload hydration timing wait required a read-only confirmation; no duplicate mutation was sent.

Community: after valid future agreement, first selection window is November 23–27, cutoff November 29. Student explicitly chose earlier QAAX/QACX under accepted student-owned older-trade preferences and submitted early. Before submission the UI showed December 4 at noon Eastern; after submission and reload it showed December 4 at 17:00 UTC, the same instant. The inconsistent timezone presentation is a separate UI finding. Swapping untouched QAAX for QAEX persisted. Saving feedback on QACX locked only QACX; untouched QAEX remained replaceable and was replaced with QAFX. Reload retained the same due instant. One copied console status sentence used standalone aliases; the executed selectors and private receipt correctly identify QACX/QAEX/QAFX.

A significant Community fulfillment finding is now demonstrated: accepted plan criteria and configured written fields are shown in agreement details but are not used in the editable Community trade-review workspace. The actual route uses its legacy single-feedback editor; saving one plain summary counted one of two trade reviews completed without the agreed ratings/written fields. This blocks whole-feature acceptance. No new product policy or source repair has been applied during discovery.

## Actual on-request trading-day and limit checks

Normal UI created and accepted four additional free offsite test plans: recurring allowance three with optional daily cap two, recurring allowance three without a daily cap, pack two, and on-request one trading day with cap two trades. Each passed student request, coach proposal, student acceptance and Journal sharing.

On-request trading-day: selected completed November 16 and QAAX/QAEX, submitted successfully, then replaced QAAX with same-day QAIX. Another day's trades were absent from the replacement choices. Due November 22 at 7:13 PM Eastern was unchanged after reload. This proves UI same-day filtering and successful same-day replacement; a server-side cross-day negative and a future scheduled trading-day positive remain separate cases.

Limits: first batches of two daily-limited trades, three period-limited trades and two pack trades each returned 200. A subsequent one-trade submission returned 400 in each scenario with the correct inline message: daily cap reached with tomorrow guidance; zero trades remaining in this recurring period; all pack reviews used. The selected trade remained in the actual form in all three rejection cases. No provider effects, account creation, worker activation or production changes occurred. All owned resource guards were released between batches.

The coherent correction scope and preservation contract are recorded in [Coaching browser correction plan](coaching-browser-correction-plan-20261118.md). No schema change is planned; unexpected schema needs require a separate exact proposal.


### Standalone delivered feedback and private notes — November 17 Eastern

On the unchanged b631fc7 / 3b329 staging target, normal coach UI completed both accepted five-criterion trade evaluations and required written feedback, saved overall feedback plus a distinct private-note sentinel, and sent the review (deliver_review HTTP 200). The actual student page displayed both sets of ratings and written answers plus the public overall feedback. The private sentinel was absent from both rendered body and full student HTML. The agreed deadline remained December 4, 2026 at 1:00 PM ET. Evidence: private guarded browser log `/tmp/coaching-standalone-delivery-resume-20261118.log`; exit 0, both owned resource guards released. This qualifies this actual standalone delivery/privacy scenario, not Community structured editor parity or unrun follow-up/history scenarios.


### Consolidated correction source checkpoint — November 17 Eastern

The accepted-evaluation gap and other recorded source corrections are implemented and locally qualified in the assigned worker; see [correction handoff](coaching-correction-handoff-20261118.md). Eighteen focused files / 174 cases, full TypeScript and dashboard structure passed. Other changed/new files have zero lint errors; the shared repository's 51 canonical preexisting diagnostics are individually mapped to unchanged source. These results do not update or qualify the running b631 staging image. All updated screens, focus/scroll and complete coach/student workflows require the coordinated updated-image browser retest. Production and provider effects remain unchanged.
