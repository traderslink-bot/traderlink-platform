# Communities and Coaching — immutable staging integration handoff

## Authority and status

Source/QA handoff, NOT deployment approval or completed launch acceptance. Coordinator owns integration and Railway staging. Production remains prohibited; both commission programs remain disabled. Never deploy the old feature checkout wholesale.

## Exact sources

- Implementation checkout: C:\Users\jerac\Documents\TraderLink\worktrees\coaching-resume-20260926.
- Feature branch: codex/coaching-resume-20260926.
- Immutable runtime candidate: 1a5b83da5b79526f7607eee5d365c769e4544ac9.
- Immediate parent: 648c89965a33bf63029cdc6e8640385d13d95b6c.
- Parent of that checkpoint: 99e862ad9514f2928db6e376eedf4ea4059023a7.
- Full post-pilot launch delta base: 1a10c172a0b2e9daaf9c7b570bd67874cd200013. This is a feature-history comparison base, NOT the Railway deployment parent.
- Coordinator-confirmed current production: 58f50b2c9bc8bd78919c5508041093b22869ff45. Preserve its complete unrelated app.
- Coordinator-confirmed staging source: d4cc8b7ed6f60609b4fafbbfcb1fa82f8fb214d6; deployment957306ce-052d-4ae9-bcd7-ee276da82c79; SUCCESS, one RUNNING instance, public HTTP200 ready/schema154.
- Actual staging integration commit/parent: must be established and reported by coordinator. No integration SHA is invented here.
- Exclude the uncommitted docs/migration/traderlink-coaching-live-qa-20260928.md edit; it is not in this handoff.

## Complete feature delta allowlist (89 files)

This is the complete committed delta from the post-pilot feature base to the runtime candidate. For shared files, integrate feature hunks into current production/staging source; do not overwrite newer shared implementations. The manifest is an APPEND-ONLY recipe: never replace deployed historical manifest rows/orders. A raw diff from staging to this old checkout contains unrelated reversions/deletions and is expressly NOT a release allowlist.

```text
app/(dashboard)/account/account-erasure-controls.tsx
app/(dashboard)/admin/communities/admin-actions.ts
app/(dashboard)/communities/[communitySlug]/[...section]/page.tsx
app/(dashboard)/communities/[communitySlug]/alerts/[alertSlug]/page.tsx
app/(dashboard)/communities/[communitySlug]/server-watchlists/[watchlistId]/page.tsx
app/(dashboard)/communities/[communitySlug]/workspace/students/[relationshipId]/page.tsx
app/(dashboard)/communities/[communitySlug]/workspace/students/[relationshipId]/reviews/[reviewId]/final/page.tsx
app/(dashboard)/communities/[communitySlug]/workspace/students/[relationshipId]/reviews/[reviewId]/page.tsx
app/(dashboard)/communities/coach-workspace-navigation.tsx
app/(dashboard)/communities/coaching-analysis-actions.ts
app/(dashboard)/communities/coaching/page.tsx
app/(dashboard)/communities/community-actions.ts
app/(dashboard)/communities/community-alert-composer.tsx
app/(dashboard)/communities/community-connect-form.tsx
app/(dashboard)/communities/community-dashboard-loader.ts
app/(dashboard)/communities/community-dashboard.tsx
app/(dashboard)/communities/community-deliveries.tsx
app/(dashboard)/communities/community-publication-actions.ts
app/(dashboard)/communities/community-publication-form.tsx
app/(dashboard)/communities/community-setup-feedback-actions.ts
app/(dashboard)/communities/community-watchlist-composer.tsx
app/(dashboard)/communities/community-watchlist-editor.tsx
app/(dashboard)/communities/community-watchlist-research-fields.tsx
app/(dashboard)/communities/onboarding-actions.ts
app/(dashboard)/communities/onboarding/page.tsx
app/(dashboard)/communities/student-coaching-review.tsx
app/(dashboard)/communities/student-coaching-workspace.tsx
app/(dashboard)/communities/student-journal-sharing.tsx
app/admin/journal/communities/page.tsx
app/api/admin/communities/coaching-archives/[archiveId]/route.ts
app/api/communities/[communitySlug]/coaching/attachments/[attachmentId]/route.ts
app/api/communities/[communitySlug]/coaching/reviews/[reviewId]/trades/[roundTripId]/route.ts
docs/migration/community-publishing-setup-corrections-20261010.md
docs/migration/traderlink-coaching-deletion-archive-progress.md
docs/migration/traderlink-communities-coaching-launch-plan.md
docs/migration/traderlink-communities-coaching-launch-progress.md
docs/migration/traderlink-communities-partner-platform-plan.md
src/modules/communities/contracts/coaching-commission-settings.ts
src/modules/communities/contracts/community-discord-resources.ts
src/modules/communities/contracts/community-launch-features.ts
src/modules/communities/contracts/community-publication-feedback.ts
src/modules/communities/contracts/community-watchlist-research.ts
src/modules/communities/contracts/traderlink-community-platform-contracts.ts
src/modules/communities/server/coaching-access-lifecycle.ts
src/modules/communities/server/coaching-agreement-service.ts
src/modules/communities/server/coaching-deletion-archive.ts
src/modules/communities/server/coaching-discord-refresh-service.ts
src/modules/communities/server/coaching-maintenance-service.ts
src/modules/communities/server/community-activity-retention.ts
src/modules/communities/server/community-activity-scope.ts
src/modules/communities/server/community-delivery-history.ts
src/modules/communities/server/community-delivery-retry-service.ts
src/modules/communities/server/community-discord-resources.ts
src/modules/communities/server/community-launch-policy.ts
src/modules/communities/server/community-onboarding-service.ts
src/modules/communities/server/community-ownership-recovery.ts
src/modules/communities/server/community-publication-service.ts
src/modules/communities/server/community-request-access.ts
src/modules/communities/server/community-request-verification.ts
src/modules/communities/server/traderlink-community-admin-repository.ts
src/modules/communities/server/traderlink-community-coach-journal-read-service.ts
src/modules/communities/server/traderlink-community-coaching-program-service.ts
src/modules/communities/server/traderlink-community-discord-delivery-service.ts
src/modules/communities/server/traderlink-community-platform-repository.ts
src/modules/communities/server/traderlink-community-repository.ts
src/modules/communities/server/traderlink-community-viewer.ts
src/modules/help/traderslink-app-guides.ts
src/modules/platform/server/database/migrations/0159_platform_coaching_commission_terms.ts
src/modules/platform/server/database/migrations/0160_platform_coaching_review_request_acceptance.ts
src/modules/platform/server/database/migrations/0161_platform_coaching_content_delivery_receipts.ts
src/modules/platform/server/database/migrations/0162_platform_coaching_delivery_attempt_history.ts
src/modules/platform/server/database/migrations/0163_platform_community_publication_feedback.ts
src/modules/platform/server/database/migrations/0164_platform_coaching_deletion_archives.ts
src/modules/platform/server/database/platform-migration-manifest.ts
src/modules/platform/server/privacy/platform-erasure-service.ts
src/scripts/verify-coaching-action-navigation.cjs
src/scripts/verify-coaching-attachment-route.cjs
src/scripts/verify-coaching-deletion-archive-route.cjs
src/scripts/verify-coaching-index-navigation.cjs
src/scripts/verify-coaching-remediation.ts
src/scripts/verify-coaching-student-selection.cjs
src/scripts/verify-community-discord-resources.ts
src/scripts/verify-community-integrated-migrations.cjs
src/scripts/verify-community-launch-foundation.ts
src/scripts/verify-community-publication-feedback.ts
src/scripts/verify-community-publication-ui.cjs
src/scripts/verify-platform-account-erasure.ts
src/scripts/verify-traderlink-communities.ts
src/scripts/verify-traderlink-community-discord-delivery.ts
```

## New migration contract

Checksums below are the repository's canonical SQL-statement SHA-256, not raw file hashes. Source candidate metadata:

| Identity | Order | Canonical SQL checksum |
| --- | --- | --- |
| 0159_platform_coaching_commission_terms | 172 | 5d78c3bc58e707b76e3bc47a1ee45734e75924f233ed0cbfda640a2cd7869a29 |
| 0160_platform_coaching_review_request_acceptance | 173 | 816667e0786c3ed26a23f2ae0df7d28bbf5c7e8b1824c3ce791f6d5d2b2859c6 |
| 0161_platform_coaching_content_delivery_receipts | 174 | 3395732bfd31218bfbf6585395630e466138ed730fe44790f68f50b68fe7f856 |
| 0162_platform_coaching_delivery_attempt_history | 175 | 9a3581fc0681053d9a6e29ccb57965ff80909a016b289e8c2493848e4bb39c11 |
| 0163_platform_community_publication_feedback | 176 | 4097b270f84d264d363d178a52be9200064e4a512950ae6995138db2a0902fdc |
| 0164_platform_coaching_deletion_archives | 177 | b61f28e1486de0f7baa49d9992603de4216e4f694c4874b01ccc915d25477547 |

Preserve the entire applied staging prefix with its IDs/checksums/execution orders. Production/staging historically differ in 25 existing execution orders. Preserve current staging worker/CI wiring and newer production features. Reconcile all collisions before appending these six entries. Do not rewrite applied history, initialize an empty hosted database or treat an empty-schema SQL pass as populated-ledger proof.

## Completed local evidence

- Fresh immutable-source migration audit against exact production58f50b2c, stagingd4cc8b7 and candidate1a5b83da5: historical SQL unchanged; fresh initialization and both empty-schema upgrade paths reach160entries/378tables with quick-check and foreign-key checks passing. Overall verifier exits1 because25 pre-existing execution-order differences remain. This is an explicit integration gate, not a passed populated-ledger upgrade.
- Handoff-only follow-up files (outside the pinned runtime delta): this document, its link in the launch progress record, and the verifier update to include0163/0164. They do not change candidate runtime SQL.

- Four sequential database/service fixtures: account erasure, publication feedback, launch foundation, coaching remediation — passed.
- Ten focused checks: review context/comparisons, previous-review reminders, work filters, student selection, attachment route, action navigation, index navigation, plan-role selection, deletion-archive API, publication UI — final rerun passed.
- 36 changed TypeScript files passed transpilation syntax checks. This is not full semantic TypeScript/build proof.
- Targeted ESLint passed for deletion/verification backend, archive admin page and dashboard loader; shared dependency environment emitted React-version autodetection warning.
- git diff/check passed.
- Synthetic owner deletion preserves another coach's active relationship, captures only deleting participant evidence, removes login/Journal, preserves shared anonymous disabled reference and clean foreign keys.
- Coaching-only continuation denies generic cached access, unrelated/ended relationships and provider unavailability; role removal still denies coaching entitlement. Page data strips general community content; original participant filtering is regression-checked.
- Archive read expires exactly after60days; transactional rollback, no deadline renewal and purge of copied attachment bytes pass. Admin-only route denial precedes reads. Archive UI is implemented, not yet browser accepted.
- Publication checks prove preserved inputs, unchanged retry receipt, duplicate prevention, multiline/Unicode titles, ticker research persistence/removal, unsafe-link/cross-community rejection and rollback. No real Discord messages, notifications, payments or paid AI calls during these checks.

## Required populated staging verification BEFORE deployment

1. Verify exact Railway project/environment/service, configured staging source, running instance, persistent volume and one-writer/drain settings. Production service must not be modified.
2. Capture a consistent supported database/attachment backup with hash, source deployment and full migration ledger. Never copy a live SQLite file without its supported consistent-backup procedure. Store privately; no user data/secrets in logs or this document.
3. Restore that backup into an isolated verification environment, with outbound notifications/Discord delivery and paid providers disabled. Do not point any test at the live production database.
4. Apply the candidate through the real migration runner against the populated restored staging ledger. Confirm all existing IDs/checksums/orders unchanged; six additions exact; quick_check/foreign_key_check and representative row/file conservation pass.
5. Exercise backup restoration after the candidate rehearsal; document rollback procedure. Do not roll old application code onto an already-incompatible schema without restoring its matched backup.
6. Reconcile backup retention with60day archive erasure, including restored backups. Deny expired archive reads immediately and purge expired evidence before exposing a restored runtime.
7. Run integrated semantic TypeScript/build and applicable architecture/route checks on the latest production-parity staging candidate. Preserve production changes and staging maintenance/CI files absent from this old checkout.
8. Report immutable integration parent/SHA, complete integrated changed-file allowlist, exact ledger results and build proof. Only then coordinate the staging release with one writer, health and deployment monitoring.

## Browser and operational acceptance after successful staging integration

- Independent second-guild onboarding: verified owner/bot/role/channel discovery, no pilot grants; interrupted/retry/reconnect/error states.
- Coach and Bullrun flows: trading-day, strategy/custom, per-trade selection/save/edit/final delivery/read/follow-up, comparisons, previous focus, notes/rules and additive analytics drawer.
- Fresh student-to-coach and coach-to-student images: upload, persisted receipt, private-note isolation, denial after removed access.
- Owner deletion synthetic staging rehearsal: unrelated coaches remain active; only existing coaching pages/actions allowed; generic community/publishing/setup denied; role loss still blocks; verified owner recovery restores intended authority without new Journal access.
- Platform-admin archives: listing/pagination/detail/image authorization, expiry/cleanup; no ordinary member/coach access.
- Official watchlist and alerts: drafts/edit/archive/remove/research, both delivery modes, receipt/retry/uncertain-send handling; preserve genuine owner test watchlist. Do not blindly repeat prior uncertain QA cleanup.
- Scheduler/maintenance, retention, export/deletion, realistic volume and backup/restore evidence.
- Both commission flags remain disabled in source AND hosted configuration.
- Reconcile every L01–L09 launch-register entry and complete final code/browser audit; report findings/fixes and remaining owner acceptance honestly.

No claim of complete feature or production readiness is made by this handoff.
