# Coaching usability — second QA, October 16, 2026 Toronto

**Next pass:** UX14–UX17 retain their passing regression. Three adjacent findings
are tracked separately in the [third QA](coaching-usability-third-qa-20261016.md).

**Correction follow-up:** UX14–UX17 now have local corrections. The original FAIL
reproductions below remain the before-state evidence. See the final correction
checkpoint at the end for the implementation, regression results and limits.
These corrections have not been deployed or verified in a signed-in staging session.

## Result

**FAIL — four newly reproduced usability defects remain.** The earlier correction
batch's regression checks pass; the additional pending-action and filtered-list
checks below expose gaps. This is local component browser QA of runtime source
`6eba45c519e6afbb6fe5c9c1d922442acf423532`, not signed-in staging acceptance.

Actual React/MUI components run in Chromium with isolated synthetic snapshots,
auth/loaders/actions and blocked external requests. Deferred synthetic actions
hold a request open without calling any service or hosted database. No real
lesson, upload, notification, Discord request, grant or customer mutation occurred.
The real action source was inspected to establish that successful creation/upload
redirects. No claim of actual lost hosted edits or duplicate persisted lessons is
made from these client reproductions.

## Findings and exact proposed corrections

### UX14 — lesson edits remain enabled during submission — medium

Route: `/communities/{communitySlug}/workspace/teaching`.
Enter a title, click Publish lesson, and hold the action pending. Both submit
buttons disable, but the title and audience/content controls remain editable.
Change the title. The action contains `QA first submitted title`, while the visible
field reads `QA changed AFTER publication submitted`.

**Proven:** displayed content can disagree with the submitted content during
publication. **Source-backed risk:** the successful real action redirects, so later
edits are not part of that save. The local harness did not simulate redirect loss.

Proposed correction: freeze the submitted composer's editable controls until its
action resolves, show Saving draft… / Publishing lesson… status, and restore
editing with retained values on rejection. Preserve FormData and existing privacy,
audience validation and redirect handling; do not disable controls before the
browser captures their submitted values.

### UX15 — Reuse bypasses the pending publication state — medium

On the same route, publish a new lesson with the action held pending. Click Reuse,
then Discard changes. The composer remounts and Publish lesson becomes enabled
even though the first action has not resolved. Click it: two action invocations
are pending concurrently in the synthetic harness.

**Proven:** the UI permits overlapping lesson submissions through remounting.
Two database writes or duplicate notifications were not tested or asserted.

Proposed correction: keep pending state at the Teaching page level so Reuse cannot
replace an in-flight composer; explain that its save/publication is underway.
Retain the existing discard protection once the action finishes. Address UX14 and
UX15 together; freezing fields alone does not prevent the remount bypass.

### UX16 — image selection/removal stays enabled during send — medium

Route: `/communities/{communitySlug}/workspace/students/{relationshipId}`.
Select synthetic `QA first submitted.png`, click Send image and hold the action
pending. Sending image… is disabled, but the picker accepts
`QA second NOT submitted.png`, and Remove selected image clears the preview.
The pending action still contains the original file.

**Proven:** removing/replacing a preview does not cancel or replace the in-flight
send, yet the controls permit that interpretation. No actual upload was made.

Proposed correction: share form pending state with the picker, its hidden file
input and Remove; freeze them while showing the submitted filename/preview and
Sending image… status. On completion/rejection retain the existing server checks
and privacy boundary. Do not introduce a misleading cancellation promise.

### UX17 — filtered work gives the wrong recovery guidance — low

Route: `/communities/{communitySlug}/workspace`.
In a populated fixture containing two reviews, one task and one session, choose
All statuses and search `QA NO MATCH EXISTING WORK`. The list says
“No coaching work in this period” and tells the coach to prepare an agreement,
create a review or schedule a session. It gives no filter recovery action.
Clearing the search manually restores work.

Proposed correction: distinguish an empty underlying work list from no matching
results. For filtered results, identify the active filters/date window and offer
Clear filters/reset to the default view. Keep setup guidance for genuinely empty
coaches. Do not change the work population, authorization or due-date semantics.

## Acceptance matrix

Each case was run in Light and Navy at 1440×844 and 390×844.

| Item | Result | Evidence boundary |
| --- | --- | --- |
| Earlier corrected-flow regression | PASS | Four complete combinations: setup/role shortcut, guarded plan/reuse switches, draft/publish payloads and error retention, recipient scoping, review/session links, private notes, Journal/pause guidance, image selection, pending/declined My coaching |
| Service-only unsaved plan change | PASS | Guard opens even without editing the title; Keep editing preserves the new plan |
| Audience/recipient-only unsaved lesson change | PASS | Guard opens; Escape retains checked student |
| Lesson in-flight edits | FAIL | UX14; captured submitted title differs from visible later title |
| Lesson in-flight Reuse | FAIL | UX15; two isolated actions pending after remount |
| Image in-flight replacement/removal | FAIL | UX16; original file remains submitted while preview changes/disappears |
| Empty/oversized image rejection | PASS | Zero bytes and 8 MB + 1 byte rejected; Send disabled; no action |
| Filtered work guidance | FAIL | UX17; existing work hidden by search, generic create-work guidance |
| Manual filter recovery | PASS | Clearing Search restores work |
| Page exceptions / external requests | PASS | None in either completed isolated browser run |
| Changed-script syntax / whitespace | PASS | `node --check` for both scripts; `git diff --check` |
| Hosted persistence, notification side effects, real pending network requests | NOT TESTED | Synthetic action boundary only |
| Signed-in staging / full shell and installed font rendering | NOT TESTED | No hosted browser connection used |
| Full build | NOT RUN | QA scripts/docs only; previous runtime build evidence remains separate |

The edge runner exits successfully when it finishes reproducing observations;
**exit zero is not acceptance PASS**. Its JSON explicitly records FAIL rows.
Four contexts × eight edge observations = 32 observations, with 16 PASS and 16
FAIL instances representing four passing cases and four unique defects.
The original baseline browser command also completed all four contexts.

## Reproduction and evidence

```
node src/scripts/verify-coaching-usability-browser.cjs
COACHING_UX_EDGE_QA=1 node src/scripts/verify-coaching-usability-browser.cjs
```

The added module `src/scripts/verify-coaching-usability-edges.cjs` records defects;
the existing runner adds only deferred synthetic action support and the opt-in
edge mode. Normal regression behavior remains unchanged.

Sanitized JSON and screenshots are retained under
`/workspaces/traderslink-coordinator/preservation/coaching-usability-second-qa-20261016/`.
The initial filter screenshot caught a closing menu and did not frame the empty
state. The final run waits for menu detachment and scrolls the empty state into
view; use final-run screenshots. No application defect was inferred from that
capture timing issue.

## Next checkpoint and boundaries

Implement UX14–UX17 as a coherent correction batch, then change the exploratory
failure assertions into regression expectations for pending protection and filter
recovery. Align the existing Coaching Help guidance for pending behavior and
filter recovery in the same slice. No Help content changed for this QA-only pass.

No runtime application edits, build, push, deployment or hosted configuration/data
change. Existing protected records, Bullrun, moonmafia, all Discord connections,
Journal grants and both disabled commissions remain untouched. Existing passed
staging workflows remain closed. Broader launch, production integration and
staging browser gates remain separate; the feature is not declared complete.

## Correction checkpoint — October 16, 2026 Toronto

Owner instructed “fix” after this QA. Implemented all four issues together:

- `coaching-lesson-composer.tsx`: pending controls lock; explicit Saving draft… /
  Publishing lesson… status. Entered values remain controlled and survive rejected
  saves. Submit identity is read in onSubmit without disabling controls before
  React captures the action FormData.
- `coaching-program-pages.tsx`: stable page-level pending state receives the
  composer's action status and disables every Reuse button until it resolves.
  The composer retains its keyed draft state and existing discard guard.
- `coaching-message-image-form.tsx`: picker, hidden input, Send and Remove share
  the containing form's useFormStatus. Filename/preview remain visible during
  sending. A scoped native reset listener clears preview state along with the
  browser file input after successful action completion; object URLs still revoke
  on replacement/removal/unmount.
- `coach-workspace-navigation.tsx`: populated-but-filtered work displays “No work
  matches your filters”, a summary including dates/search/status, and Clear
  filters. Reset returns to Upcoming, five days, active work with other filters
  cleared. Genuinely empty work still uses the setup/student guidance.
- Coaching Help now explains pending lesson/image behavior and filter reset.
- `verify-coaching-usability-edges.cjs` now asserts the corrected behavior, rather
  than treating reproduction of the four failures as a completed exploratory run.

No server action, service, authentication, storage, role, grant, permission,
notification, migration or dependency changed. Existing MUI/shared theme retained.
React skill review covered hook placement, stable callback, native reset listener
cleanup, disabled state/accessibility, controlled draft retention, submission
capture and unchanged access boundaries. No design-system replacement.

Verification:

- Existing actual-component regression: Light/Navy, 1440×844 and 390×844.
- Pending/edge regression: all32 observations across those four combinations.
  Publication and draft pending labels/locks, captured title/recipient/flags,
  rejected-save retention/recovery, blocked Reuse including native button clicks,
  image filename/relationship payload, disabled replacement/removal, successful
  synthetic reset and reselection, invalid size boundaries, filtered-list guidance
  and reset from a custom future date window.
- Targeted strict TypeScript: five changed roots and imported dependencies,
  zero diagnostics. Targeted ESLint and actual action-adapter checks.
- Dashboard-template checker retains the previously recorded baseline failures;
  no shared shell/layout/navigation/template file changed. This checker is not
  reported as passing.
- No redundant production build for this client interaction/Help correction.
  Previous runtime full-build proof does not certify this new source; a release
  checkpoint must apply its usual combined build gate.

Sanitized final screenshots/results and check logs are retained under
`/workspaces/traderslink-coordinator/preservation/coaching-usability-pending-fixes-20261016/`.
These are local isolated results, with actual components but mocked action
transport. No real upload/save/publication, hosted failure recovery or signed-in
staging persistence is proven. Full shell/fonts and owner visual approval remain
separate. No push, deployment, real Discord interaction or protected record change.

After a separately authorized staging release, retest this batch using authorized
synthetic records: delay a draft/publication request and verify locked fields and
Reuse; reject it and verify retained entries; delay an approved synthetic image
send and verify its picker/removal remain disabled; apply a nonmatching Work
search/date window and Clear filters. A normal read-only PC UI check may test
filter recovery; actual sends/publishes still require exact fixture/action scope.
Do not use protected records to manufacture pending actions or failures.

### Final verification outcome

**PASS — UX14–UX17 local correction regression.** All32 edge observations pass
across four Light/Navy desktop/mobile contexts; all four earlier regression
contexts also pass. Lint (five TS roots), strict TypeScript (five roots/imported
graph, zero diagnostics), action adapter and whitespace/syntax checks PASS.
Dashboard template remains four baseline failures/three passes with its shared
source/checker unchanged. The before-state FAIL matrix above is intentionally
retained as original QA evidence. No staging/browser acceptance or full-feature
launch certification is implied by this local checkpoint.
