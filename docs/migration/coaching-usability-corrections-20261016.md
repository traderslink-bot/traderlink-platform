# Coaching usability corrections — October 16, 2026 Toronto

**Follow-up QA:** the original13 corrections retain passing regression checks, but
four additional pending-action/filter issues were found and have now been corrected locally. See
[second QA](coaching-usability-second-qa-20261016.md); do not interpret this earlier
checkpoint as final usability acceptance.

## Scope and resulting behavior

Owner approved the next usability batch; work survived the Codespace shutdown at
basefe98dea4a and continued in `/workspaces/traderlink-coaching-completion-audit`.
This is local implementation/verification, not a hosted release or launch verdict.
No staging/production configuration, database, Discord or account operations.

| Finding | Correction | Local result |
| --- | --- | --- |
| UX01 | Profile prerequisite and first-plan/request guidance; context-sensitive empty-state actions for Work/Students/Reviews/Sessions | PASS component/source checks |
| UX02 | Publish preview explains the required coaching role; Choose coaching role opens the settings and focuses the selector | PASS keyboard/role gating; underlying role requirement retained |
| UX03 | Switching plans and cancelling an edited plan asks before discarding changed form values; Keep editing/Escape retain them | PASS actual component checks |
| UX04 | Lesson creation has separate Save draft and Publish lesson actions; Enter defaults to draft; failure adapter preserves controlled inputs and safe error feedback | PASS component and actual action-adapter checks |
| UX05 | Plan selector only for Plan audience, checkboxes only for Selected students; eligible recipient count/names; no publishing with0 current recipients | PASS payload/UI checks; unchanged server audience validation remains mandatory |
| UX06 | Reuse guards unsaved inputs, identifies the source and focuses/scrolls to the newly reset form; same-source reuse can be explicitly restarted | PASS component checks |
| UX07 | Secondary Reviews list links directly to the selected review | PASS href checks |
| UX08 | Secondary Sessions list links to a specific session anchor in student workspace and labels its displayed time UTC | PASS href/date checks |
| UX09 | Overall review now says Private coach notes | PASS label checks; privacy contract unchanged |
| UX10 | Journal-off workspace explains who must share and where; no coach grant control added | PASS presentation checks |
| UX11 | Coach workspace shows a paused-access banner near the header with student-specific recovery guidance; lifecycle active is distinct from access paused | PASS disabled-access/banner checks |
| UX12 | Image selection shows filename/local preview/remove, accepted types/8MB limit and pending state; Send disabled without valid selection | PASS pick/remove/invalid-file checks; no upload performed |
| UX13 | My coaching shows pending/declined request details, community/coach navigation and Browse coaches; active/ended workspace/sharing selection preserved | PASS pending/declined/mixed-role checks |

The draft guard protects local editor replacement/cancellation. It is not browser
refresh/closure recovery or persistent offline draft storage. Confirmation uses
shared MUI tokens and restores keyboard focus; drafts are not copied to localStorage.
Lesson creation retains the existing server action, permissions, audience query
and publish flag; a narrow feedback wrapper adds safe failures and rethrows Next
redirect/control-flow exceptions. There is no new publication transport or retry
idempotency guarantee. Interrupted create guidance says to check the lesson list
before submitting again.

## Changed runtime and Help files

- `coaching-draft-navigation.tsx`: local form-content comparison and themed confirmation/focus helper.
- `coach-setup-page.tsx`, `coaching-plan-builder.tsx`: guarded editor switches, setup/role guidance; earlier all-service Edit controls retained.
- `coaching-lesson-composer.tsx`, `coaching-program-pages.tsx`: explicit creation actions, controlled inputs, conditional audience/recipients and reuse; direct list navigation/UTC dates.
- `coaching-empty-state.tsx`, `coach-workspace-navigation.tsx`: task-specific next steps.
- `student-coaching-workspace.tsx`: requests and participant navigation, preserving active/ended content/grant filters.
- Student workspace `...[relationshipId]/page.tsx`: pause/Journal guidance, session anchor, selected-image form.
- `coaching-message-image-form.tsx`: local selection lifecycle and pending Send state; object URLs revoked on replacement/removal/unmount.
- `coach-review-editor.tsx`: private field label.
- `community-actions.ts`: create-feedback adapter only; existing create implementation unchanged.
- `src/modules/communities/contracts/coaching-access.ts`: separate coach-facing guidance; existing approved student messages unchanged.
- `src/modules/help/traderslink-app-guides.ts`: setup, draft/publish, recipient, student/coach and image guidance aligned.

All runtime TSX paths above are inside `app/(dashboard)/communities/`.
No dependency/configuration/schema change. Shared theme and dashboard shell retained.

## Verification

- `verify-coaching-usability-browser.cjs`: actual React/MUI components and student/review/final route rendering with isolated auth/loaders/actions/providers; Light/Navy1440×844 and390×844. Form guards, keyboard Keep/Discard/Escape, focus/scroll, recipient payload, failed draft retention, separate draft/publish, secondary links/timezone, private notes, paused/Journal recovery, images and pending/declined requests pass. No hosted sends/writes.
- `verify-coaching-usability-actions.cjs`: actual exported create adapter with isolated service/request/database acquisition; draft/publish flag and actor preserved, safe failure, unchanged input and framework redirect propagation pass.
- Existing `coaching-lesson-action-acceptance.cjs`, plan role/save feedback and setup hydration checks pass. Harnesses were updated only to accommodate the new local navigation helper and expose create feedback.
- Real-schema `verify-coaching-remediation.ts`: publication audience rejection/restoration, required-work delivery actions, privacy/archive/media backup, recurrence and bounded refresh regressions pass using synthetic databases/providers.
- Targeted ESLint passes; changed-file semantic TypeScript14 roots/0 diagnostics passes.
- Dashboard template verifier: FAIL,4 failures/3 passes. These match the recorded baseline layout/navigation/Drawer-allowlist contract failures. Layout, shared nav/shell/template and verifier are byte-identical to base; new widgets add no shell/Drawer. Do not count this checker as green or silently amend shared architecture to hide the failures.
- Full Next webpack build PASS: compile, full TypeScript and page generation. The initial2048MB heap-capped attempt failed with a Node heap exhaustion; the3072MB retry passed. This was one checkpoint with a resource retry, not a source failure or Codespace shutdown. No build/config dependency changed. Nonfatal TLS retries and existing Academy registry warnings are retained in logs.
- Generated tracked public/sw.js was clean before this task; its build-only change was restored to base after the build. Generated output is retained in evidence, and is not part of the source commit.

Browser screenshot assertions wait for dialog transition completion. Initial
screenshots taken mid-transition were replaced with fully visible dialog captures;
this was a capture timing correction, not an application defect. Isolated fixture
screens do not include the full authenticated shell/font asset/session transport.

## Remaining release/acceptance boundaries

No deploy, push, hosted migration, Discord message or fixture mutation is authorized
by this local correction batch. Both commissions stay disabled. Preserve normal
TradersLink, TradersLink Tests, installed/unconnected Test2, Bullrun, moonmafia and
all protected Coaching/Journal data. Existing passed staging workflows remain
separate from this new candidate's acceptance.

After a separately coordinated staging release, PC Codex can verify the changed
UI with unsaved synthetic text only: draft guard Keep/Escape/Discard; role shortcut;
lesson audience fields/recipient count/button meanings; My coaching request states
where an existing approved fixture exists; navigation/private labels/image selection
without sending. Do not save/publish/create requests, accept terms, change grants,
roles or connection settings, retry deliveries or upload files without exact fixture
and action authority. Actual persisted lesson creation/delivery tests require scoped
synthetic fixture permission; isolated action proof is not staging browser proof.

Refresh the prepared production integration artifact to include this slice and the
previous service Edit navigation. Existing staging migration ordering remains intact.
No whole-feature launch readiness claim follows from local usability corrections.


## Final local checkpoint

All13 recorded usability findings have local corrections. Final browser regression
command passes after integrating empty-state and decoded-image assertions; the
valid synthetic image preview is decoded, not merely present in the DOM. Four
Light/Navy desktop/mobile combinations pass without document overflow or page
exceptions. No real image, lesson, plan or Discord post was sent by these checks.

Sanitized logs, metadata and final screenshots retained at:
`/workspaces/traderslink-coordinator/preservation/coaching-usability-batch-20261016/`.
The new browser/action verification commands remain in src/scripts for reruns.

Full build PASS with3GB cap; lint and full/targeted types PASS; service/action/UI
regressions PASS. Legacy template verifier remains4 failed/3 passed as documented.
Staging deployment, owner visual acceptance and signed-in browser behavior remain
separate gates; no push/release/hosted change performed.


UX14–UX17 follow-up is recorded in [second QA correction checkpoint](coaching-usability-second-qa-20261016.md#correction-checkpoint--october-16-2026-toronto). Pending lesson/image protection and filtered-work recovery are implemented together, with Help aligned. No staging release in this slice.
