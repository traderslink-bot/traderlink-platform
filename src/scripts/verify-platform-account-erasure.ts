import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  createCanonicalUuidV4,
  isTraderLinkPlatformError,
} from "@/src/modules/platform/server/database/platform-migration-contract";
import { openPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { PlatformUserRepository } from "@/src/modules/platform/server/identity/platform-user-repository";
import { PlatformWorkspaceRepository } from "@/src/modules/platform/server/identity/platform-workspace-repository";
import { PlatformErasureService } from "@/src/modules/platform/server/privacy/platform-erasure-service";
import { JournalAccountRepository } from "@/src/modules/journal/server/accounts/journal-account-repository";
import {
  promoteJournalEvidenceObject,
  purgeJournalEvidenceObject,
  resolveJournalEvidenceVaultBoundary,
} from "@/src/modules/journal/server/imports/journal-evidence-vault";
import {
  purgeJournalSupportSource,
  resolveJournalSupportSourceVault,
  writeJournalSupportSource,
} from "@/src/modules/journal/server/administration/journal-support-source-vault";
import { initializeTraderLinkPlatformDatabase } from "./initialize-traderlink-platform-database";

const TIMESTAMP = "2026-08-10T12:00:00.000Z";

type CountRow = Readonly<{ count: number }>;

function count(database: ReturnType<typeof openPlatformDatabase>, sql: string, ...values: string[]): number {
  return database.prepare<string[], CountRow>(sql).get(...values)?.count ?? 0;
}

function requireEvidence(condition: unknown, check: string): asserts condition {
  if (!condition) throw new Error(`erasure_verification_failed:${check}`);
}

function beforeDeleteGuardCount(database: ReturnType<typeof openPlatformDatabase>): number {
  return count(database, "SELECT COUNT(*) AS count FROM sqlite_master WHERE type = 'trigger' AND sql LIKE '%BEFORE DELETE%'");
}

function createFixture(database: ReturnType<typeof openPlatformDatabase>, input: Readonly<{
  databasePath: string;
  evidenceVaultRoot: string;
  supportVaultRoot: string;
}>) {
  const userOne = createCanonicalUuidV4();
  const userTwo = createCanonicalUuidV4();
  const workspaceOne = createCanonicalUuidV4();
  const workspaceTwo = createCanonicalUuidV4();
  const accountOne = createCanonicalUuidV4();
  const accountTwo = createCanonicalUuidV4();
  const accountThree = createCanonicalUuidV4();
  const users = new PlatformUserRepository(database, {
    allowedAuthProviders: ["development_local"],
  });
  users.createUser({
    userId: userOne,
    authProvider: "development_local",
    authSubject: "synthetic-owner-one",
    displayName: "Synthetic Owner One",
    createdAtUtc: TIMESTAMP,
    updatedAtUtc: TIMESTAMP,
  });
  users.createUser({
    userId: userTwo,
    authProvider: "development_local",
    authSubject: "synthetic-owner-two",
    displayName: "Synthetic Owner Two",
    createdAtUtc: TIMESTAMP,
    updatedAtUtc: TIMESTAMP,
  });
  const workspaces = new PlatformWorkspaceRepository(database);
  workspaces.createWorkspaceWithOwner({
    workspaceId: workspaceOne,
    ownerUserId: userOne,
    displayName: "Synthetic Workspace One",
    defaultTradingTimezone: "America/Toronto",
    createdAtUtc: TIMESTAMP,
  });
  workspaces.createWorkspaceWithOwner({
    workspaceId: workspaceTwo,
    ownerUserId: userTwo,
    displayName: "Synthetic Workspace Two",
    defaultTradingTimezone: "America/Toronto",
    createdAtUtc: TIMESTAMP,
  });
  const accounts = new JournalAccountRepository(database);
  for (const [accountId, workspaceId, userId, displayName] of [
    [accountOne, workspaceOne, userOne, "Synthetic account one"],
    [accountTwo, workspaceOne, userOne, "Synthetic account two"],
    [accountThree, workspaceTwo, userTwo, "Synthetic account three"],
  ] as const) {
    accounts.createAccount({
      accountId,
      workspaceId,
      displayName,
      baseCurrency: "USD",
      tradingTimezone: "America/Toronto",
      status: "active",
      createdByUserId: userId,
      createdAtUtc: TIMESTAMP,
      updatedAtUtc: TIMESTAMP,
    });
  }
  const sourceIdentityId = createCanonicalUuidV4();
  accounts.createSourceIdentity({
    sourceIdentityId,
    workspaceId: workspaceOne,
    accountId: accountOne,
    sourceSystem: "ibkr",
    fingerprintSchemeVersion: "hmac-sha256-v1",
    sourceAccountCanonicalizationVersion: "v1",
    hmacKeyVersion: "v1",
    sourceAccountFingerprint: "a".repeat(64),
    privacySafeDisplay: "Synthetic source",
    status: "active_current",
    firstSeenAtUtc: TIMESTAMP,
    lastSeenAtUtc: TIMESTAMP,
  });
  const primaryBytes = Buffer.from("synthetic primary evidence", "utf8");
  const primarySha256 = createHash("sha256").update(primaryBytes).digest("hex");
  const primaryVault = resolveJournalEvidenceVaultBoundary({
    databasePath: input.databasePath,
    sourcePath: input.databasePath,
    protectedStorageRoots: [join(tmpdir(), "synthetic-protected-root")],
    environment: { TRADERLINK_PLATFORM_JOURNAL_EVIDENCE_VAULT_ROOT: input.evidenceVaultRoot },
  });
  const primaryObject = promoteJournalEvidenceObject(primaryVault, {
    sourceBytes: primaryBytes,
    sourceFileSha256: primarySha256,
    sourceFileSizeBytes: primaryBytes.byteLength,
    evidenceNamespace: "ibkr",
  });
  const importBatchId = createCanonicalUuidV4();
  const importEventId = createCanonicalUuidV4();
  database.transaction(() => {
    database.prepare(`INSERT INTO journal_import_batches (
  import_batch_id, workspace_id, account_id, source_identity_id, source_kind,
  source_system, source_file_sha256, source_file_size_bytes, source_mime_type,
  source_encoding, source_display_label, evidence_object_key, manual_idempotency_key,
  adapter_id, adapter_version, parser_version, mapping_version, mapping_contract_json,
  statement_period_start_date, statement_period_end_date, source_timezone,
  current_state, current_event_id, preserved_row_count, mapped_execution_count,
  unsupported_row_count, issue_count, pending_decision_count, created_by_user_id,
  created_at_utc, updated_at_utc, accepted_at_utc
) VALUES (?, ?, ?, ?, 'broker_statement', 'ibkr', ?, ?, 'text/csv', 'utf-8',
  'Synthetic evidence', ?, NULL, 'synthetic', 'v1', 'v1', 'v1', '{}', NULL, NULL,
  NULL, 'preview', ?, 0, 0, 0, 0, 0, ?, ?, ?, NULL)`).run(
      importBatchId, workspaceOne, accountOne, sourceIdentityId, primarySha256,
      primaryBytes.byteLength, primaryObject.evidenceObjectKey, importEventId,
      userOne, TIMESTAMP, TIMESTAMP,
    );
    database.prepare(`INSERT INTO journal_import_events (
  import_event_id, workspace_id, account_id, import_batch_id, event_sequence,
  event_type, actor_kind, actor_user_id, prior_state, new_state, reason_code, occurred_at_utc
) VALUES (?, ?, ?, ?, 1, 'previewed', 'system', NULL, NULL, 'preview', 'synthetic', ?)`).run(
      importEventId, workspaceOne, accountOne, importBatchId, TIMESTAMP,
    );
  }).immediate();
  const supportBytes = Buffer.from("synthetic support source", "utf8");
  const supportVault = resolveJournalSupportSourceVault({
    databasePath: input.databasePath,
    environment: { TRADERLINK_PLATFORM_JOURNAL_SUPPORT_SOURCE_ROOT: input.supportVaultRoot },
  });
  const supportSource = writeJournalSupportSource(supportVault, supportBytes);
  const instrumentationEpochId = createCanonicalUuidV4();
  const importAttemptId = createCanonicalUuidV4();
  database.transaction(() => {
    database.prepare(`INSERT INTO journal_import_instrumentation_epochs (
  instrumentation_epoch_id, application_version, activated_at_utc, closed_at_utc, close_reason_code, created_at_utc
) VALUES (?, 'synthetic', ?, NULL, NULL, ?)`).run(instrumentationEpochId, TIMESTAMP, TIMESTAMP);
    database.prepare(`INSERT INTO journal_import_attempts (
  import_attempt_id, instrumentation_epoch_id, user_id, workspace_id, account_id,
  request_idempotency_sha256, source_file_sha256, source_file_size_bytes, file_kind,
  safe_broker_label, current_state, revision, adapter_id, adapter_version, parser_version,
  mapping_version, preserved_row_count, mapped_execution_count, unsupported_row_count,
  issue_count, pending_decision_count, committed_import_batch_id, failure_code,
  admitted_at_utc, updated_at_utc, resumable_until_utc, terminal_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'csv', 'Synthetic', 'received', 1, NULL, NULL, NULL,
  NULL, 0, 0, 0, 0, 0, NULL, NULL, ?, ?, NULL, NULL)`).run(
      importAttemptId, instrumentationEpochId, userOne, workspaceOne, accountOne,
      "b".repeat(64), supportSource.sourceFileSha256, supportSource.sourceFileSizeBytes,
      TIMESTAMP, TIMESTAMP,
    );
    database.prepare(`INSERT INTO journal_statement_support_objects (
  support_object_id, workspace_id, account_id, import_attempt_id, object_key,
  source_file_sha256, source_file_size_bytes, source_mime_type, purge_state,
  expires_at_utc, purge_receipt_sha256, created_at_utc, updated_at_utc, purged_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, 'text/csv', 'active', '2026-08-11T12:00:00.000Z',
  NULL, ?, ?, NULL)`).run(
      createCanonicalUuidV4(), workspaceOne, accountOne, importAttemptId,
      supportSource.objectKey, supportSource.sourceFileSha256, supportSource.sourceFileSizeBytes,
      TIMESTAMP, TIMESTAMP,
    );
  }).immediate();
  const notificationId = createCanonicalUuidV4();
  database.prepare(`INSERT INTO platform_notifications (
  notification_id, workspace_id, recipient_user_id, journal_account_id,
  category, kind, source_event_key, title, summary, destination_path,
  occurred_at_utc, created_at_utc
) VALUES (?, ?, ?, ?, 'broker_import', 'broker_import_completed', 'synthetic_one',
  'Synthetic notification', 'Synthetic notification body', '/account/trading', ?, ?)`).run(
    notificationId,
    workspaceOne,
    userOne,
    accountOne,
    TIMESTAMP,
    TIMESTAMP,
  );
  database.prepare(`INSERT INTO platform_notification_receipts (
  notification_id, recipient_user_id, read_at_utc, created_at_utc
) VALUES (?, ?, NULL, ?)`).run(notificationId, userOne, TIMESTAMP);
  return Object.freeze({
    accountOne,
    accountThree,
    accountTwo,
    userOne,
    userTwo,
    workspaceOne,
    workspaceTwo,
    primaryObject,
    primaryVault,
    supportSource,
    supportVault,
  });
}

function main(): void {
  const root = mkdtempSync(join(tmpdir(), "traderlink-account-erasure-"));
  const evidenceVaultRoot = mkdtempSync(join(tmpdir(), "traderlink-erasure-evidence-"));
  const supportVaultRoot = mkdtempSync(join(tmpdir(), "traderlink-erasure-support-"));
  const databasePath = join(root, "disposable.sqlite");
  try {
    initializeTraderLinkPlatformDatabase({ databasePath });
    const database = openPlatformDatabase({ databasePath, mode: "runtime" });
    try {
      const fixture = createFixture(database, { databasePath, evidenceVaultRoot, supportVaultRoot });
      const guardsBefore = beforeDeleteGuardCount(database);
      requireEvidence(guardsBefore > 0, "delete_guards_present");
      const service = new PlatformErasureService(database);
      try {
        service.eraseTradeTrackerAccount({
          accountId: fixture.accountOne,
          userId: fixture.userOne,
          workspaceId: fixture.workspaceOne,
          workspaceRole: "owner",
        }, {
          purgePrivateArtifacts: () => { throw new Error("synthetic_purge_failure"); },
        });
        requireEvidence(false, "purge_failure_must_abort");
      } catch (error) {
        requireEvidence(error instanceof Error && error.message === "synthetic_purge_failure", "purge_failure_observed");
      }
      requireEvidence(count(database, "SELECT COUNT(*) AS count FROM journal_accounts WHERE account_id = ?", fixture.accountOne) === 1, "failed_delete_rolled_back");
      requireEvidence(beforeDeleteGuardCount(database) === guardsBefore, "failed_delete_restored_guards");

      service.eraseTradeTrackerAccount({
        accountId: fixture.accountOne,
        userId: fixture.userOne,
        workspaceId: fixture.workspaceOne,
        workspaceRole: "owner",
      }, {
        purgePrivateArtifacts: (artifacts) => {
          for (const artifact of artifacts) {
            if (artifact.kind === "primary_evidence") {
              purgeJournalEvidenceObject(fixture.primaryVault, {
                evidenceNamespace: "ibkr",
                evidenceObjectKey: artifact.evidenceObjectKey,
                sourceFileSha256: artifact.sourceFileSha256,
                sourceFileSizeBytes: artifact.sourceFileSizeBytes,
              });
            } else {
              purgeJournalSupportSource({
                vault: fixture.supportVault,
                objectKey: artifact.objectKey,
                expectedSha256: artifact.sourceFileSha256,
                expectedSizeBytes: artifact.sourceFileSizeBytes,
                purgedAtUtc: TIMESTAMP,
              });
            }
          }
        },
      });
      requireEvidence(count(database, "SELECT COUNT(*) AS count FROM journal_accounts WHERE account_id = ?", fixture.accountOne) === 0, "selected_account_removed");
      requireEvidence(count(database, "SELECT COUNT(*) AS count FROM journal_account_source_identities WHERE account_id = ?", fixture.accountOne) === 0, "selected_account_child_removed");
      requireEvidence(count(database, "SELECT COUNT(*) AS count FROM platform_notifications WHERE journal_account_id = ?", fixture.accountOne) === 0, "selected_account_notification_removed");
      requireEvidence(!existsSync(join(evidenceVaultRoot, fixture.primaryObject.evidenceObjectKey)), "primary_evidence_purged");
      requireEvidence(!existsSync(join(supportVaultRoot, fixture.supportSource.objectKey)), "support_source_purged");
      requireEvidence(count(database, "SELECT COUNT(*) AS count FROM journal_accounts WHERE account_id = ?", fixture.accountTwo) === 1, "sibling_account_preserved");
      requireEvidence(count(database, "SELECT COUNT(*) AS count FROM journal_accounts WHERE account_id = ?", fixture.accountThree) === 1, "other_user_account_preserved");
      requireEvidence(beforeDeleteGuardCount(database) === guardsBefore, "account_delete_restored_guards");

      service.eraseTraderLinkAccount({
        userId: fixture.userOne,
        workspaceId: fixture.workspaceOne,
        workspaceRole: "owner",
        allowedAccountIds: [fixture.accountTwo],
        activeAccountId: fixture.accountTwo,
      });
      requireEvidence(count(database, "SELECT COUNT(*) AS count FROM platform_users WHERE user_id = ?", fixture.userOne) === 0, "user_removed");
      requireEvidence(count(database, "SELECT COUNT(*) AS count FROM platform_workspaces WHERE workspace_id = ?", fixture.workspaceOne) === 0, "workspace_removed");
      requireEvidence(count(database, "SELECT COUNT(*) AS count FROM journal_accounts WHERE account_id = ?", fixture.accountTwo) === 0, "remaining_account_removed");
      requireEvidence(count(database, "SELECT COUNT(*) AS count FROM platform_users WHERE user_id = ?", fixture.userTwo) === 1, "other_user_preserved");
      requireEvidence(count(database, "SELECT COUNT(*) AS count FROM platform_workspaces WHERE workspace_id = ?", fixture.workspaceTwo) === 1, "other_workspace_preserved");
      requireEvidence(count(database, "SELECT COUNT(*) AS count FROM journal_accounts WHERE account_id = ?", fixture.accountThree) === 1, "other_user_account_still_preserved");
      requireEvidence(beforeDeleteGuardCount(database) === guardsBefore, "full_delete_restored_guards");
      requireEvidence(database.prepare("PRAGMA foreign_key_check").all().length === 0, "foreign_keys_clean");
    } finally {
      database.close();
    }
    console.info(JSON.stringify({ status: "passed", fixture: "disposable_synthetic_only" }));
  } finally {
    rmSync(root, { force: true, recursive: true });
    rmSync(evidenceVaultRoot, { force: true, recursive: true });
    rmSync(supportVaultRoot, { force: true, recursive: true });
  }
}

try {
  main();
} catch (error) {
  console.error(JSON.stringify({
    code: isTraderLinkPlatformError(error) ? error.code : "TRADERLINK_ACCOUNT_ERASURE_VERIFICATION_FAILED",
  }));
  process.exitCode = 1;
}
