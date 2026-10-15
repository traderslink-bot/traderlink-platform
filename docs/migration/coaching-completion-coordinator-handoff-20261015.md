# Coaching completion — Coordinator handoff, October 15

This is a reviewable source and read-only diagnosis handoff, not release or
hosted-change authorization. Existing immutable handoffs remain historical.

## Source and preservation

Candidate: `/workspaces/traderlink-coaching-development`, branch
`codex/coaching-bot-onboarding-review-20261014`. Runtime corrections are
checkpoint `3d0d0af1fb030b5e0a6651fb906c82074525fd05`; read-only diagnosis
is checkpoint `f9f09c227`. The normal main checkout remains at the required
preview HEAD `38ddd91096d0213c735b108706d4033a96afe14e` with owner changes
preserved. Do not deploy or synchronize either dirty checkout wholesale.

The source comparison used remote main `32775de0136bb66315611c43429cd53d77df9b94`
and staging `53f598ee153baaa79955194ebf132655ae8307cb`, checked October 15.
Recheck both refs and the active release owner/order before integration.
Mechanical three-way application passed in a disposable Git index. This has
not integrated the feature or reconciled applied migrations. The overlapping
paths are the admin shell, migration register and database opener; inspect
shared hunks rather than replacing current production files.

## Verified final local QA and live metadata

The final actual compiled two-window conflict test passes with preserved draft,
error and original expected revision across both appearances. All four admin
Light/Navy desktop/mobile views pass Axe, overflow and header-overlap checks;
both mobile plan-error themes pass Axe. Earlier full core feature fixture/browser
coverage and 32 standard views are in the findings. No unified 16/16 batch or
final whole-app build pass is claimed: the final bounded full build again
received external SIGTERM. The experimental compile/generate artifact's proxy
rename failure is recorded separately from successful authenticated browser proof.

Read-only Railway configuration at 04:13 UTC confirms `main` production and
`staging` staging, each with one configured replica, `/data`, and no staged
changes. Production success `899ce15e-e37c-4c5b-8035-c7ae9fd49bcf` is the exact
`32775de0136bb66315611c43429cd53d77df9b94` comparison source; staging remains
`9bd85a00-9af6-4bbc-b403-03a824af8c98` / `53f598ee153baaa79955194ebf132655ae8307cb`.
Both health endpoints return 200/ready; counts are 140/160 and do not prove ledgers.

## Owner-approved Coordinator staging action — execution pending

The owner answered **"Approve Coordinator staging change"** on October 15
in this Coaching thread. The approval is limited to the one staging variable
below, with possible restart disclosed; credentials and destinations stay intact.
The exact request is now appended to the shared Coordinator `release-queue.md`
and `coordination-status.md`. Coordinator receipt and execution are unconfirmed.
This feature chat has performed no hosted mutation. The shared handoff reserves
Railway mutation/release ownership to the named `coordinator codespace` chat.
This is not approval to deploy the unfinished candidate, migrate either database,
change production, activate commissions or send real test notifications.


Target only Railway project `49fc9197-07c9-45c7-b528-57d0393c2cca`, staging
environment `9e079dd4-f3f3-4872-9b00-adbd3000c485`, web service
`4d264aca-510c-4f5e-bc28-e89e526b8008`.

Proposed configuration allowlist: **one variable only**,
`TRADERLINK_COMMUNITY_APPROVED_GUILD_IDS`, adding the existing normal
TradersLink server. Resolve its ID internally from the verified deployed
guild resolver; do not request it from members, print it in public evidence,
change credentials, replace existing destinations or create another server.
The current value is absent. A configuration application may restart/redeploy
the service and must occupy the Coordinator's authorized release slot with
single-writer, volume, drain and rollback checks. This feature chat has not
performed that action.

The bot's dedicated identity, installation, callback and effective view/send
on the coach-named channel are verified through read-only API requests.
The app's stored selected destination was not read. Keep it unchanged and
verify it through authorized in-app setup/receipt inspection. Do not assume
the discovered coach-named channel is the selected destination.

## Required acceptance after authorized integration

1. Reconcile the exact complete ordered hosted migration IDs, execution orders
   and checksums against the integrated candidate using the approved read-only
   migration-audit workflow. A count of 160 is not ledger equivalence. Preserve
   applied history; do not scan or hash business records.
2. Pass the final whole-app build, focused regressions and integrated browser
   matrix. A prior 280-page build passed on `21da0b800`; final-source full-build
   attempts were externally terminated or failed their configured V8 heap limit.
   Do not disable TypeScript or call the scoped build a release build.
3. After explicit staging/configuration authorization, independently sign in as
   server owner, coach, student and ordinary staff. Verify discovered server,
   bot reconnection, role mapping, selected-coach grants and their denials.
4. Authorize any real test publication separately, use existing private staging
   destinations, and verify queue/worker receipt, retry/idempotence, role loss,
   restoration and bot removal. No real message was sent in this completion run.
5. Verify actual maintenance/retention/recurrence, attachment persistence,
   backup/recovery and single-writer operating envelope. Local synthetic tests
   and restored copies pass; they are not hosted operational acceptance.
6. Record L07/L08 evidence and obtain L09 owner acceptance and a separate release
   decision. Both commissions remain off; coach bulk export is out of scope.

## Exact correction inventory relative to recovered candidate

The following 54 paths are the complete committed correction delta from
`bffd5faab` through diagnosis checkpoint `f9f09c227`. This is an audit inventory,
not blanket approval to publish every path or replace the older complete feature
handoff. The wider feature ancestry and migrations still need integration review.

```text
app/(dashboard)/communities/[communitySlug]/coaches/[coachSlug]/page.tsx
app/(dashboard)/communities/coach-setup-page.tsx
app/(dashboard)/communities/coach-workspace-navigation.tsx
app/(dashboard)/communities/coaching-plan-builder.tsx
app/(dashboard)/communities/community-actions.ts
app/(dashboard)/communities/community-connect-form.tsx
app/(dashboard)/communities/community-dashboard.tsx
app/(dashboard)/communities/community-publication-form.tsx
app/(dashboard)/communities/community-setup-feedback-actions.ts
app/(dashboard)/communities/community-typography.tsx
app/(dashboard)/communities/onboarding-actions.ts
app/(dashboard)/communities/student-journal-sharing.tsx
app/admin/journal/communities/page.tsx
app/admin/journal/journal-admin-shell.tsx
app/admin/journal/layout.tsx
app/dashboard-shell.tsx
app/mui-theme.ts
docs/migration/coaching-feature-findings-2026-10-14.md
docs/migration/traderlink-coaching-deletion-archive-progress.md
docs/migration/traderlink-communities-coaching-launch-plan.md
docs/migration/traderlink-communities-coaching-launch-progress.md
next.config.ts
src/docs/codex-project-log.md
src/modules/coach/server/coach-ai-chat-action-draft-service.test.ts
src/modules/coach/server/coach-ai-chat-generation-service.test.ts
src/modules/coach/server/coach-ai-chat-product-context-service.test.ts
src/modules/coach/server/coach-ai-chat-trade-analyzer-tool-service.test.ts
src/modules/coach/server/coach-ai-manual-entry-command-service.test.ts
src/modules/communities/contracts/coaching-plan-presentation.ts
src/modules/communities/contracts/traderlink-community-platform-contracts.ts
src/modules/communities/server/community-onboarding-service.ts
src/modules/communities/server/traderlink-community-platform-repository.ts
src/modules/help/traderslink-app-guides.ts
src/modules/journal-analytics/presentation/trade-explorer-review-service.test.ts
src/modules/journal-analytics/server/analytics-capability-manifest.ts
src/modules/journal-analytics/server/analytics-metric-registry.test.ts
src/modules/journal-analytics/server/analytics-service.test.ts
src/modules/journal/server/manual-trades/journal-workspace-analyzer-refresh.test.ts
src/modules/platform/server/administration/platform-admin-authorization.test.ts
src/modules/platform/server/administration/platform-admin-authorization.ts
src/scripts/verify-coaching-action-navigation.cjs
src/scripts/verify-coaching-enrollment-ui.cjs
src/scripts/verify-coaching-journal-sharing-selection.cjs
src/scripts/verify-coaching-plan-presentation.cjs
src/scripts/verify-coaching-plan-role-selection.cjs
src/scripts/verify-coaching-plan-save-feedback.cjs
src/scripts/verify-coaching-remediation.ts
src/scripts/verify-coaching-setup-hydration.cjs
src/scripts/verify-coaching-student-selection.cjs
src/scripts/verify-community-bot-onboarding.cjs
src/scripts/verify-community-capacity-and-links.cjs
src/scripts/verify-community-launch-foundation.ts
src/scripts/verify-community-onboarding-reentry.cjs
src/scripts/verify-community-publication-ui.cjs
```

Current evidence: [findings](coaching-feature-findings-2026-10-14.md) and
[launch progress](traderlink-communities-coaching-launch-progress.md).

## Current-source migration reconciliation — independent offline proof

The checker [verify-coaching-source-migration-reconciliation.cjs](../../src/scripts/verify-coaching-source-migration-reconciliation.cjs)
accepts three exact 40-character immutable source SHAs. It reads Git objects,
loads only migration metadata/pure checksum code and executes SQL solely in
`:memory:` SQLite. It opens no hosted or file-backed database and changes no
runtime manifest. Reproduce the source comparison and append proposal with:

```bash
node src/scripts/verify-coaching-source-migration-reconciliation.cjs \
  32775de0136bb66315611c43429cd53d77df9b94 \
  53f598ee153baaa79955194ebf132655ae8307cb \
  d5b8013d09233d097fa07b623d659a230d6f7c05
```

The candidate and deployed-staging source manifests are identical: 160 entries,
matching IDs, execution orders and SQL checksums. Production has 140 entries;
all are retained with identical SQL checksums, but 25 shared orders differ.
Thus these conflicts also exist in today's verified sources, not just the old
default comparison. The existing failing integration guard is retained.

A constructed production-source ledger fixture is rejected by the unchanged
candidate as `TRADERLINK_MIGRATION_ORDER_CONFLICT`. A **proposal only** that keeps
the complete production prefix byte-for-byte and appends the 20 missing Coaching
migrations passes prefix validation, empty production-schema upgrade, fresh SQL
initialization, quick-check and foreign-key checks (378 tables, zero violations
in both SQL paths). No historical source SQL or runtime execution order was
changed. The check always reports `releaseReady: false`: empty-schema/constructed
metadata proof is not a read of either hosted ledger or representative-data proof.

Proposed production-only append order:

| Migration identity | Existing staging order | Proposed production order |
| --- | --- | --- |
| `0121_traderlink_communities_identity_permissions` | 121 | 159 |
| `0122_traderlink_communities_partner_platform` | 122 | 160 |
| `0123_traderlink_communities_discord_feature_access` | 123 | 161 |
| `0124_traderlink_communities_server_watchlists` | 124 | 162 |
| `0125_traderlink_communities_private_pilot_bootstrap` | 125 | 163 |
| `0126_traderlink_communities_workspace_tools` | 126 | 164 |
| `0127_traderlink_communities_coaching_workspace` | 127 | 165 |
| `0128_traderlink_communities_coaching_programs` | 128 | 166 |
| `0129_traderlink_communities_coaching_plan_builder` | 129 | 167 |
| `0130_traderlink_communities_coaching_service_measurement` | 130 | 168 |
| `0131_traderlink_communities_review_coaching_sections` | 131 | 169 |
| `0143_traderlink_communities_review_workflow` | 156 | 170 |
| `0144_traderlink_communities_review_workspace_metadata` | 157 | 171 |
| `0145_traderlink_communities_coaching_delivery_workflow` | 158 | 172 |
| `0159_platform_coaching_commission_terms` | 172 | 173 |
| `0160_platform_coaching_review_request_acceptance` | 173 | 174 |
| `0161_platform_coaching_content_delivery_receipts` | 174 | 175 |
| `0162_platform_coaching_delivery_attempt_history` | 175 | 176 |
| `0163_platform_community_publication_feedback` | 176 | 177 |
| `0164_platform_coaching_deletion_archives` | 177 | 178 |

The proposal is not permission to renumber staging's already-applied rows or
replace either applied history. Coordinator must establish exact live ledgers,
canonical release lineage, data-preserving staging rehearsal and recovery before
implementing the production recipe. A raw mechanical merge is insufficient.

The health route opens the read-only database through runtime integrity checks,
but those checks cache verification and the public result does not return the
ordered ledger. Healthy counts therefore remain supporting runtime evidence,
not the independently captured exact ledger required by this handoff.


### Pilot isolation and ledger-access follow-up

The append simulation also asserts zero rows in Communities, operator grants,
roles and Discord destinations after both SQL paths. The historical private-pilot
migration is retained unchanged, but creates no pilot records on this new empty
Communities foundation. Its existence must remain visible in the release audit;
do not replay it against an already-populated staging lineage or alter applied SQL.

A staging-only SSH attempt requested precisely `migration_id`, `execution_order`
and `checksum_sha256`, ordered by execution order, through an existing-file
read-only connection. It failed at SSH authentication because a usable key was
not available. The remote Node/SQL command did not run; no ledger rows or business
records were read and no keys were generated/registered. The local preserved-preview
immutable audit procedure is not silently applied to a live WAL database.

Coordinator can obtain the exact staging ledger through its separately authorized
existing access and compare all three fields, complete ordered length and source
identity. This remains a feature-integration evidence gate, separate from the
already-approved one-variable change on the existing staging source. No additional
owner approval for that same variable is being requested.
