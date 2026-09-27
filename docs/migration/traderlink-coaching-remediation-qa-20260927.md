# Coaching remediation QA — 2026-09-27

Status: in progress. This record supplements, rather than replaces, the complete
13-area inventory in [the original QA](traderlink-coaching-full-qa-20260927.md).
Source checkpoint: `3d28b1b1fd8b082fd238defdd1cd09e8fe41b86a`.

## Verified source and disposable-service checkpoint

- Thirty-two changed TypeScript files: bounded semantic check has zero diagnostics;
  targeted lint has zero errors and warnings. `git diff --check` passed.
- In-memory remediation verification covers immutable agreements, student-only
  acceptance, plan revisions, work idempotence, month-end anchors and review coverage,
  question renewal, follow-up expiration, privacy, session metadata, teaching reuse,
  role notices, archive preservation, batching and zero foreign-key violations.
- Existing Communities verifier passes capability/community/role isolation, grant
  revocation, history, activity projection and Tier 2 idempotence with current migrations.
- Mocked Discord transport verifies selected-channel links and suppressed mentions.
  Mocked role refresh verifies successful removal/restoration and failure preservation.
  These results are not live Discord acceptance.
- Image assertions cover owned conversation roots, foreign-target rejection and
  draft versus delivered review visibility. Browser uploads remain unverified.
- Workload helper checks cover UTC midnight, week boundaries and a DST transition.
  These do not establish that the earlier browser hydration error is resolved.
- Coordinator reports remote CI `36340269692` passed for integrated source
  `359c1557a2bdf9056236d103218efbb5673efba8`.

## Migration checkpoint

Coordinator reports actual staging maintenance deployment
`a6744517-df88-4f4d-9230-3977e030cdf3` succeeded at carrier
`c6a7ba4fd4849cfddbc45fe4e9c71d27add1548e`: exact 141 migrations, original
volume, both reviews and pre-existing row hashes preserved. Backup/restore was
verified before the additive migration. Normal candidate
`188fd76b67eed3de9beb3a5042fedab0458caf5b` is pending normal-app health.
Normal deployment `1a6f9c3b-d244-486a-85aa-9ad7b159181b` succeeded. Coordinator
confirmed health 200/ready/sqlite_single_node/141 at 18:32:30 UTC and latest production
`a741710f` plus approved prior coaching. Migration success alone is not feature acceptance.

## Deployed browser checklist

Run only after Coordinator confirms the normal candidate healthy. Preserve owner
review `aa1785a7`; use only the isolated QA review `69865ebd` and clearly labelled
synthetic QA records. Do not publish a plan that can queue a real Discord post.

| Inventory | Required deployed evidence | Current result |
| --- | --- | --- |
| 1. Profile and plans | Edit/save draft, persisted offers and details, no publication side effect | Draft created; edited from 3 to 4 trades, reopened with Journal notes, details and price intact; stayed Draft. Profile untouched. |
| 2. Agreement and enrollment | Coach proposal display, immutable accepted terms, student acceptance | Prepare agreement fields render; no agreement submitted or accepted. Immutable/student-only behavior passes service fixtures; genuine student sign-in unavailable. |
| 3. Coaching Work | Day count/custom dates/week/month, sort/search/counts and paused status | Five-day count3 includes session; two-day count2 excludes it. Native custom Sep29–29 shows only session. Next week/month include correct dates; unmatched search sets counts0. Paused scenarios service-only. |
| 4. Students | Workspace, tasks/history/messages and attachment controls | Existing student/plan/Journal/history and attachment controls render. No real message/image exchange; no task was modified. |
| 5. Review setup | Saved scope/focus and prior focus preserved | QA Performance period Sep18–25, Rules/Journal feedback and next focus remain intact. No delivered prior-focus fixture in browser. |
| 6. Trade review | Find/To review/Saved, inline save/edit/advance and persistence | AMD save moves Saved1→2, pending4→3, opens AAPL inline; saved AMD feedback reopens on mobile after navigation. Find META preserved; no owner review edits. |
| 7. Journal tools | Details/chart and real scoped analysis drawer queries | Details and chart drawers open; real scoped report returns six synthetic trades/net30; NVDA query returns one/$20. Saved Analyzer reports No saved analysis honestly. External candle accuracy not established. |
| 8. Delivery | Final preview, private-note omission, unfinished-work gate, student receipt | Preview includes both saved trade reviews and focus/summary; omits private note; three unfinished trades keep Send disabled. Return link works. No delivery or student receipt tested. |
| 9. Sessions | Saved duration/time/link/private and shared notes/attendance | Synthetic session created, Sep29 15:00UTC saved and appears in workload; metadata edits submitted. Separate shared/private controls present; student privacy service-tested. |
| 10. Teaching | Edit/reuse, saved links/dates and student progress controls | Unpublished recorded lesson saves recording/deadline; reuse preserves content and recording in a separate Draft. Assigned status and disabled draft progress control render. No lesson published. |
| 11. Student dashboard | Own relationships, agreement/messages/delivered work and read/follow-up | Service fixtures only; genuine student sign-in unavailable |
| 12. Access | Cross-user scope, revocation and role lifecycle | Service fixtures only; live bot refresh unavailable |
| 13. UI | Desktop/mobile, Light/Navy Dark, labels/navigation/console | Mobile named Select/Remove checkboxes; inline editor; document375px/scroll375px. Light/Navy Dark render. Desktop editor controls need horizontal scrolling: correction pending. Fresh-tab console has only TradingView support endpoint403/warning; no captured React hydration error. |

### Browser findings and fixture changes

- Desktop table is intentionally scrollable, but its expanded editor also extended
  beyond the visible table area. A narrow editor-width correction is in the final batch.
- Teaching count displayed `1 students`; singular correction is in the final batch.
- Playwright date `fill` did not stick in controlled date inputs. Native accessibility
  date entry succeeded and returned the correct filtered workload; not an app defect.
- QA draft69865 now has two saved reviews (NVDA and AMD), three queued trades and
  one Find trade. Existing owner reviewaa1785 was not opened for editing.
- Created `QA20260927 - plan edit verification` (Draft), `QA20260927 - session
  organization`, `QA20260927 - teaching draft` (Draft), and `QA20260927 - reused
  teaching draft` (Draft). No plan or lesson publication, real Discord message,
  student acceptance, grant change or live student identity was performed.
- Original Light appearance restored. Viewport override will be reset at final handoff.

## Known operational boundaries

- The first188fd release has no scheduled maintenance caller. The final source batch
  now registers one in the existing hosted runtime after Coordinator ownership
  clearance:60-second interval, batch5, non-overlap, close in finally, hourly
  agreement watermark and event-loop yields. Extended in-memory checks pass automatic
  generation, idempotence, overlap and error recovery. Deployed activation still pending.
- Staging lacks the coaching bot credential. No credential or identity was created,
  copied or exposed. Real role refresh remains unverified.
- The synthetic student has no OAuth identity/session. Do not impersonate the
  student or treat a service fixture as authenticated browser proof.
- No local production build, live Discord messages, production data writes or
  edits to the owner's saved review were performed for this checkpoint.

## Final staging follow-up — 2026-09-27

Coordinator verified source `5efeb32c9d1f89aa777b7096dd80489c1c74b7a5`, deployment
`0d999d35-f3f0-45f0-ae32-6eec1839235d` SUCCESS, remote build36344438526 PASS,
health200/exact141 at19:36:16UTC. Includes repaired productionc3 and all1f16
coaching changes; original volume and both reviews retained.

- Hosted scheduler logs confirm60seconds/batch5 and a natural successful first pass:
  checked0, created0, failed0, archived0, roleRefreshConfiguredfalse. This proves
  activation, not hosted generation with an eligible accepted agreement.
- Fresh deployed desktop1440 check: expanded AMD editor bounds363.60–956.91 fit
  inside table viewport312.80–1007.73. Save, Chart and Details stay visible in the
  editor. Table columns remain aligned and horizontally scrollable independently.
- Mobile390 check: client375/scroll375, saved AMD review reopens inline with its
  persisted text, named Remove checkbox and Save trade review action visible.
- Teaching draft and reused draft both display `1 student`; saved recording links
  and due date retained. No review content or fixtures changed in this final recheck.
- Temporary viewport reset; Light appearance preserved. Existing user tab untouched.

Six-area implementation and the available 13-area QA pass are recorded. Genuine
student browser delivery/read/follow-up, live Discord role removal/restoration and
hosted generation from an eligible accepted agreement remain external acceptance
gates. Do not mark the whole coaching feature end-to-end accepted on this evidence.
