# Coaching account-deletion archive

Controlling plan: [Complete launch plan](traderlink-communities-coaching-launch-plan.md).

## Approved policy

- Optional ownership transfer; declining does not prevent deletion.
- Owner clarification: deleting the server owner's account without transfer must keep other coaches' existing student relationships active. Do not archive or close those relationships merely because their community owner deleted an account. The deleting participant's own coaching records follow the 60-day policy.
- Restricted platform-administrator coaching evidence archive, expiring 60 days after deletion.
- Agreements, outstanding work, delivered reviews and relevant messages/attachments; no private student Journal collection. Existing embedded trade evidence may remain.
- Expired records must be inaccessible even if a cleanup worker is delayed. Cleanup must remove attachment bytes as well as metadata.
- No commission activation or production deployment.

## Implementation and verification

### October 10 — post-shutdown action audit

Current source supersedes the historical unresolved implementation notes below: shared-record preservation and the narrowly scoped deleted-owner exception are implemented. Hosted acceptance remains open. Two missed action callers were corrected: relationship status updates and student review trade loading now request existing-coaching-only access. The underlying verifier still requires an active, unarchived relationship and original participant; this does not permit new relationships, general community access, or revival of ended relationships after owner deletion.

Focused action navigation and coaching remediation checks passed after these corrections. The first account-erasure rerun encountered a local evidence-vault write failure; the rerun with access to the disposable fixture directory passed (`disposable_synthetic_only`). Help guidance was inspected; these corrections restore the approved access behavior and introduce no new user-facing controls or copy. Both commissions remain disabled; no production deployment.

### October 10 continuation

The owner subsequently approved an existing-coaching-only access exception. Implemented an explicit server-side intent gate before cached membership acceptance: deleted-owner communities deny general requests; only active, unarchived original coaching participants qualify, optionally scoped to the exact relationship. Discord fetch/role refresh, failure denial, service permissions and Journal grants remain in place. Background coaching refresh and existing review/message/image/task/read paths use that intent; publishing, setup and new-plan paths do not. No replacement owner is assigned.

Focused remediation checks pass for stale provider denial, fresh-cache general-access denial, wrong relationship denial, continuing existing coaching, required role removal and ended relationship denial. The original ownership-change pause/recovery checks still pass. Action navigation check and targeted backend ESLint pass (environment reports React-version autodetection warning). Hosted verification and full call-site audit remain required; these checks are not a staging launch acceptance.

The page serialization audit additionally confirmed original-participant filtering of relationship, message and review collections, with regression assertions. Restricted coaching pages now remove general community content, directories, plans and staff data; request intent does not unlock publishing or setup. Admin archives are now reachable inside `/admin/journal/communities`, with dated archive pagination, expandable labelled records, record pagination and protected attachment links. Archive and attachment reads retain the existing platform-admin gate and exact expiry denial. Full-erasure, remediation and archive-route checks pass again after these changes. Source UI lint passes; real admin browser acceptance remains open.

- Full disposable account-erasure integration now passes with a second coach/student relationship in the same community: it stays active and is not archived; the deleting coach's own relationship is removed after evidence capture. Login identities, private workspace and Journal are removed. An anonymous disabled user reference preserves shared ownership/authorship dependencies without assigning another owner.
- Publishing storage and JSDOM checks pass alongside this slice: retained inputs, duplicate submission prevention, unchanged retry receipts, ticker research persistence/removal, invalid links and cross-community denial. Admin archive route fixture passes authorization-before-read and expiry/file boundaries.
- NOT complete: request-time Discord ownership verification still pauses the community when the deleted owner's identity is absent. A proposed broad deleted-owner exception was rejected by safety review and was not applied. A narrowly scoped existing-coaching-access decision was requested; preserve the check until resolved. Database row preservation alone does not prove continuing browser access.
- No hosted deletion, migration, deployment, real notifications or paid AI calls were performed in this continuation. Both commissions remain disabled. Admin archive presentation, hosted cleanup/backup proof and final integrated staging acceptance remain open.

In progress, not deployed or accepted. Existing generic erasure can cascade through shared community records. Capture must occur atomically before erasure; failed capture must roll back deletion. Transfer preservation, participant isolation, expiry boundaries, repeated deletion, cleanup and protected administration all require focused proof. Existing backup retention must also be reconciled before claiming permanent removal from all retained copies.

Account-deletion confirmation wording was approved verbatim by the owner and applied. No activity disclosure was added.

Initial focused coaching fixture passed archive capture rollback, retry deadline stability, exact 60-day read expiry and bounded cleanup including attachment bytes. Full erasure integration, surviving transferred-community records, protected admin presentation and hosted backup/cleanup proof remain open.

The expanded disposable full-account-erasure fixture passed preservation of the deleting coach's message and attachment evidence, removal of that participant's live relationship, and preservation of the other user's Journal. This does not yet prove preservation of unrelated coaches when a community owner is deleted. The earlier proposed community-wide relationship deletion was rejected and was not applied; the owner's clarification above replaces that proposal. Shared community foreign-key preservation remains an implementation and acceptance gate.


### October 14 — admin evidence freshness correction

The completion run found that the recovered platform-admin authorization checked
owner identity and the singleton grant but omitted the required five-minute
membership evidence age. It now rejects stale, future-dated and invalid evidence
before archive access or other administrative operations. The existing grant,
owner identity and protected local-review checks remain mandatory.

The three focused admin authorization tests pass, covering fresh owner plus grant,
missing grant, stale/future evidence, non-owner and the protected loopback boundary.
The fixture now includes an explicit synthetic session identity. No hosted grant,
Discord ownership, account deletion or archive data was changed. This restores an
existing internal access contract; no public Help wording change is required.
Expanded archive browser acceptance remains in the active completion run.
