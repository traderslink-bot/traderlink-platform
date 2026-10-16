# Coaching usability — third QA, October 16, 2026 Toronto

**Correction follow-up:** owner approved fixing UX18–UX20. All three now have local
corrections; see the checkpoint below. Original FAIL observations are retained
as the before-state record. No release or signed-in staging acceptance is implied.

## Result and scope

**FAIL — three additional usability findings.** The four pending-action/filter
fixes from `40a1f2a34749631fc76e6fb386f50d7ef8d8c004` retain passing checks. This
pass explores adjacent saved-lesson editing, keyboard image selection, hidden
audience fields, session destinations and invalid date-window recovery.

Actual React/MUI components run in isolated Chromium contexts: Light/Navy,
1440×844 and 390×844. Snapshot/auth/loaders/actions are synthetic. No real save,
upload, Discord request, notification, grant, connection or hosted data change.
No application runtime edits or deployment; this is a QA-only checkpoint.

## UX18 — saved-lesson Status can change during save — medium

Route: `/communities/{communitySlug}/workspace/teaching` → Edit lesson.

1. Change the saved lesson title and click Save lesson with its action deferred.
2. The title input is disabled by the surrounding pending fieldset.
3. Open Status and choose Draft. This still works while the request is pending.
4. The captured request contains `status: published`, but the visible selector
   now displays Draft.

**Proven:** this already-saved lesson editor's MUI select remains interactive
inside a disabled native fieldset, so visible status can disagree with the pending
payload. The new lesson composer's explicit disabled controls pass; this is a
separate editor. A rejected synthetic response retains the title and displays
inline feedback. No actual stored status change or lost hosted edit is asserted.

Intended correction: propagate the publication form's pending/disabled state to
the saved lesson's MUI selectors explicitly, alongside the existing native-input
lock. Keep payload capture before disabling, safe retry identity, inline errors
and entered-value retention. Verify Status and Delivery selectors plus successful
and rejected completion; do not change publication/privacy validation.

## UX19 — Coaching Work does not open the selected session — low

Route: `/communities/{communitySlug}/workspace` → Open session.

The visible session link points only to the student's workspace. It lacks
`#coaching-session-{sessionId}`, so the coach must locate the session manually.
The secondary Sessions page already includes that anchor, and the actual student
route already provides matching session IDs with scroll margin.

Intended correction: append the existing selected-session anchor to session work
items. Preserve relationship ownership, route access and the existing session
cards. Verify the exact ID for multiple sessions rather than only a generic
student-page destination.

## UX20 — reversed custom dates lack validation — low

Route: Coaching Work → Custom. Enter Start date February 10, 2035 and End date
February 1, 2035. Neither date input reports invalidity; no date-order error is
shown. The page displays generic no-matching-work guidance and a reversed period.
Clear filters successfully recovers, but does not explain the invalid input.

Intended correction: show a field-level explanation when the end precedes the
start and mark the affected date input invalid; use compatible min/max bounds.
Do not present an invalid window as an ordinary no-match result. Preserve entered
dates for correction and the working Clear filters recovery. No date/timezone
or underlying work-population semantics should change.

## Acceptance matrix

| Item | Result | Evidence |
| --- | --- | --- |
| Prior corrected-flow baseline | PASS | Four Light/Navy desktop/mobile contexts |
| UX14–UX17 pending/filter regression | PASS | 32 observations, four contexts |
| Saved lesson pending select protection | FAIL | UX18; submitted Published versus visible Draft |
| Saved lesson rejected-response retention | PASS | Inline feedback and entered title retained |
| Keyboard chart picker | PASS | Enter, Space and pointer each open chooser; no file selected |
| Hidden audience IDs | PASS | Switching Selected students → All students omits hidden relationship IDs |
| Work session destination | FAIL | UX19; existing student route without selected-session anchor |
| Reversed custom date validation | FAIL | UX20; input validity true, no date-order message |
| Reversed-date recovery | PASS | Clear filters restores normal view |
| Page exceptions / external requests | PASS | None in the completed isolated contexts |
| Actual backend saved-lesson mutation or side effects | NOT TESTED | Deferred mock transport; no database access |
| Signed-in staging, complete shell/fonts | NOT TESTED | Local component boundary only |
| Build | NOT RUN | QA scripts/docs only; runtime unchanged |

Seven new observations × four contexts = 28 observations: 16 PASS instances,
12 FAIL instances, representing three unique findings. The exploratory runner's
successful completion means evidence was collected; its exit code is not a
green feature-acceptance gate. The JSON retains explicit FAIL rows.

## Reproduction and evidence

```
node src/scripts/verify-coaching-usability-browser.cjs
COACHING_UX_EDGE_QA=1 node src/scripts/verify-coaching-usability-browser.cjs
COACHING_UX_EDGE_QA=1 COACHING_UX_THIRD_QA=1 node src/scripts/verify-coaching-usability-browser.cjs
```

The browser runner adds an opt-in third-QA module and makes synthetic feedback
status agree with its synthetic error mode. The earlier action response's error
property remains unchanged. No application action was modified.

An initial exploratory date-message matcher could match the adjacent Start/End
labels themselves. It was narrowed to actual date-order instructions/input
validity and the final four-context run supersedes that initial observation.
This was a QA matcher correction, not an application change.

Final JSON, screenshots and logs retained at
`/workspaces/traderslink-coordinator/preservation/coaching-usability-third-qa-20261016/`.
Syntax and whitespace checks pass. Help needs aligned pending-select/date guidance
in the correction slice; no Help wording changed for this QA-only pass.

## Next coherent batch and boundaries

Fix UX18–UX20 together, then replace reproduction expectations with regression
assertions. Keep the earlier passed cases closed. Preserve both disabled
commissions, all existing Discord servers, Bullrun, moonmafia and every protected
Coaching/Journal record. No hosted failures or synthetic records were created.
No build, push or deployment is authorized by this QA checkpoint. Local results
are not signed-in staging proof or whole-feature launch readiness.

## Local correction checkpoint — October 16 Toronto

- UX18: `CommunityPublicationForm` supports an optional render callback receiving
  its existing effective disabled/hydration/pending state. Existing ReactNode
  children keep their original path. `CoachingTeachingEditor` uses that state
  explicitly on every text/date/selection control and Save button. No pre-capture
  disabling, request ID generation, retry semantics, error transport or action
  change. Hidden identity fields and captured status/delivery values are preserved.
- UX19: Coaching Work session links append the existing selected-session anchor.
  A two-session synthetic fixture verifies distinct exact destinations and matching
  anchors on the actual isolated student route. No new route or permission change.
- UX20: custom end-before-start dates display an End date helper error, aria-invalid
  and a nearby valid-range instruction. Native min/max bounds agree. Invalid
  windows keep both typed dates, suppress misleading zero metrics/no-match output,
  and offer Clear filters. Correcting to same-day dates or resetting recovers.
  Valid/open-ended date-window semantics and actual work records are unchanged.
- Coaching Help covers saved-editor locking, session jumps and date correction.
- The third-QA script now asserts corrected behavior. The shared harness adds only
  a second disposable in-memory session for exact-destination checks.

Checks and proof boundaries:

- Third-QA browser regression covers Light/Navy desktop/mobile, pending Status and
  Delivery, successful/rejected completion, retained entries, unchanged retry ID
  versus changed-request ID, two exact session links/targets, reversed-date error,
  same-day recovery and Clear filters. Keyboard image selection/hidden audience
  checks remain included.
- Earlier baseline and UX14–UX17 browser regressions run at this checkpoint.
- Shared publication DOM regression proves old ReactNode children still work,
  hydration lock, POST fallback, duplicate-submit guard, same-request retry,
  retained entries and success link. Zero network calls.
- Actual saved-lesson feedback action harness passes rejection/success and Next
  control-flow behavior with isolated request/database adapters.
- Targeted ESLint and strict TypeScript: four changed roots and their imported
  dependencies, zero diagnostics. Script syntax and whitespace checks pass.
- Dashboard-template check retains its four recorded baseline failures/three
  passes; shared shell/navigation/layout/template and checker remain unchanged.
- No full build for this client/Help-only slice. The separately coordinated release
  checkpoint must run its combined build gate; earlier builds are not proof for
  this changed source.

The first rejection-recovery assertion inspected controls immediately when the
feedback appeared, before React's transition finished. The final browser check
waits for the pending fieldset to settle, then asserts unlocked selectors. That
was test synchronization, not a new application defect or a weakened lock check.

Final evidence is retained under
`/workspaces/traderslink-coordinator/preservation/coaching-usability-third-fixes-20261016/`.
No real service write, notification, upload, role/grant/Discord change, push,
deployment or protected-record mutation occurred. Both commissions remain disabled.
Local component/action proof remains separate from signed-in staging acceptance.

After separately authorized staging release, PC Codex can verify session jumps and
reversed-date recovery without saving anything. Pending saved-editor checks need
an authorized disposable lesson and scoped saving/failure control; no protected
lesson should be edited to manufacture this acceptance case. Do not repeat the
already passed Discord installation/delivery paths for this UI-only slice.

### Final correction verification

**PASS — UX18–UX20 local regressions.** All28 third-pass observations and32 prior
edge observations pass across Light/Navy1440×844/390×844; the four baseline
contexts also pass. Shared-form compatibility (including callback hydration lock),
saved-lesson action, four-root strict types, lint, syntax and whitespace pass.
The template checker remains four baseline failures/three passes. No build or
hosted mutation/deployment. Existing before-state FAIL observations above are
retained for traceability, not reopened findings. Signed-in staging acceptance
and a release build remain separate future gates.
