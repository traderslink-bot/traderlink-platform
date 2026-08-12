import { copyFileSync, mkdtempSync, rmSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";

import Database from "better-sqlite3";

import { JournalAccountRepository } from "@/src/modules/journal/server/accounts/journal-account-repository";
import {
  MoomooExecutionImportRepository,
  type MoomooClaimedImportRange,
} from "@/src/modules/journal/server/broker-imports/moomoo-execution-import-repository";
import { MoomooExecutionImportScheduler } from "@/src/modules/journal/server/broker-imports/moomoo-execution-import-scheduler";
import {
  isMoomooExecutionWithinRequestedWindow,
  moomooExecutionDateFloorMicroseconds,
  planMoomooExecutionImport,
} from "@/src/modules/journal/server/broker-imports/moomoo-execution-import-planning";
import {
  createJournalPrivacyDigester,
  loadJournalPrivacyHmacConfiguration,
} from "@/src/modules/journal/server/imports/journal-import-service";
import { createJournalIntegrityRuntime } from "@/src/modules/journal/server/journal-integrity-runtime";
import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { loadMoomooCredentialKeyConfiguration } from "@/src/modules/platform/server/broker-connections/moomoo-connection-credentials";
import { encryptMoomooPrivateData } from "@/src/modules/platform/server/broker-connections/moomoo-private-data-crypto";
import { loadTraderLinkPlatformLocalDevelopmentConfiguration } from "@/src/modules/platform/server/authentication/local-development-configuration";
import { createCanonicalUuidV4 } from "@/src/modules/platform/server/database/platform-migration-contract";

function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function requireValue<T>(value: T | null | undefined, code: string): T {
  if (value === null || value === undefined) throw new Error(code);
  return value;
}

const temporaryRoot = mkdtempSync(join(tmpdir(), "traderlink-moomoo-import-workflow-"));
const temporaryDatabasePath = join(temporaryRoot, "development.sqlite");

try {
  const local = loadTraderLinkPlatformLocalDevelopmentConfiguration({
    repositoryRoot: process.cwd(),
  });
  copyFileSync(local.databasePath, temporaryDatabasePath);
  const database = new Database(temporaryDatabasePath);
  try {
    database.pragma("foreign_keys = ON");
    const fixtureRow = database.prepare(`SELECT
  membership.workspace_id, membership.user_id, membership.role,
  account.account_id, connection.connection_id
FROM platform_workspace_memberships membership
JOIN journal_accounts account
  ON account.workspace_id = membership.workspace_id AND account.status = 'active'
JOIN platform_broker_connections connection
  ON connection.workspace_id = membership.workspace_id
  AND connection.user_id = membership.user_id AND connection.provider = 'moomoo'
WHERE membership.status = 'active' AND connection.connection_state = 'active'
LIMIT 1`).get() as Readonly<{
      workspace_id: string;
      user_id: string;
      role: "owner" | "admin" | "member";
      account_id: string;
      connection_id: string;
    }> | undefined;
    const fixture = requireValue(
      fixtureRow,
      "moomoo_import_workflow_fixture_missing",
    );

    const timestamp = "2026-08-09T14:00:00.000Z";
    const sourceIdentityId = createCanonicalUuidV4();
    new JournalAccountRepository(database).createSourceIdentity(Object.freeze({
      sourceIdentityId,
      workspaceId: fixture.workspace_id,
      accountId: fixture.account_id,
      sourceSystem: "moomoo",
      fingerprintSchemeVersion: "hmac-sha256-v1",
      sourceAccountCanonicalizationVersion: "moomoo_account_id_v1",
      hmacKeyVersion: loadJournalPrivacyHmacConfiguration().activeKeyVersion,
      sourceAccountFingerprint: sha256(createCanonicalUuidV4()),
      privacySafeDisplay: "Moomoo account",
      status: "active_current",
      firstSeenAtUtc: timestamp,
      lastSeenAtUtc: timestamp,
    }));
    const repository = new MoomooExecutionImportRepository(database);
    const brokerAccountLinkId = createCanonicalUuidV4();
    const encryptedAccountId = encryptMoomooPrivateData({
      configuration: loadMoomooCredentialKeyConfiguration(),
      purpose: "broker_account_id",
      plaintext: "disposable-account",
    });
    repository.upsertLink({
      brokerAccountLinkId,
      workspaceId: fixture.workspace_id,
      accountId: fixture.account_id,
      sourceIdentityId,
      connectionId: fixture.connection_id,
      privacySafeLabel: "Moomoo account",
      accountType: "cash",
      enabledMarketCodes: Object.freeze([2]),
      encryptedAccountId,
      timestamp,
    });
    const scope: WorkspaceAccessScope = Object.freeze({
      userId: fixture.user_id,
      workspaceId: fixture.workspace_id,
      workspaceRole: fixture.role,
      allowedAccountIds: Object.freeze([fixture.account_id]),
      activeAccountId: fixture.account_id,
    });
    const digester = createJournalPrivacyDigester(loadJournalPrivacyHmacConfiguration());

    function createClaim(sequence: number): MoomooClaimedImportRange {
      const jobId = createCanonicalUuidV4();
      const rangeId = createCanonicalUuidV4();
      repository.createJob({
        brokerImportJobId: jobId,
        workspaceId: fixture.workspace_id,
        accountId: fixture.account_id,
        brokerAccountLinkId,
        importKind: sequence === 1 ? "initial_history" : "incremental_sync",
        requestedStartDate: "2026-08-09",
        cutoffAtUtc: timestamp,
        exactStartMicroseconds: 1786276800000000 + sequence * 1_000,
        exactEndMicroseconds: 1786363200000000 + sequence * 1_000,
        ranges: Object.freeze([Object.freeze({
          brokerImportRangeId: rangeId,
          market: "US" as const,
          workSequence: 1,
          startMicroseconds: 1786276800000000 + sequence * 1_000,
          endMicroseconds: 1786363200000000 + sequence * 1_000,
        })]),
        timestamp,
      });
      return requireValue(repository.claimNextRange({
        timestamp,
        staleBeforeTimestamp: "2026-08-09T13:50:00.000Z",
      }), "moomoo_import_workflow_claim_missing");
    }

    function receiptFor(claimed: MoomooClaimedImportRange, executionKey: string) {
      const providerExecutionIdentity = `${sourceIdentityId}\u001fmoomoo-deal-v1\u001f${executionKey}`;
      const identity = digester.activeDigest("broker_execution", providerExecutionIdentity);
      repository.persistFillReceipts({
        claimed,
        receipts: Object.freeze([Object.freeze({
          brokerFillReceiptId: createCanonicalUuidV4(),
          providerIdentitySchemeVersion: identity.schemeVersion,
          providerIdentitySha256: identity.digestSha256,
          providerCreatedMicroseconds: 1786291200000000,
          providerUpdatedMicroseconds: 1786291200000000,
          encryptedPayload: encryptMoomooPrivateData({
            configuration: loadMoomooCredentialKeyConfiguration(),
            purpose: "fill_receipt",
            plaintext: JSON.stringify({ executionKey }),
          }),
        })]),
        timestamp,
      });
      return Object.freeze({ providerExecutionIdentity, identity });
    }

    function commitOne(
      claimed: MoomooClaimedImportRange,
      executionKey: string,
      pageDigest: string,
    ) {
      const receipt = receiptFor(claimed, executionKey);
      return database.transaction(() => {
        const result = createJournalIntegrityRuntime(database).imports.commitMoomooApiFills(
          scope,
          {
            accountId: fixture.account_id,
            sourceIdentityId,
            pageIdentitySha256: pageDigest,
            evidenceObjectKey: `moomoo_receipt_${pageDigest.slice(0, 32)}`,
            sourceDisplayLabel: "Moomoo account",
            fills: Object.freeze([Object.freeze({
              providerExecutionIdentity: receipt.providerExecutionIdentity,
              normalizedSymbol: "VERIFY",
              tradeCurrency: "USD",
              side: "buy" as const,
              quantityDecimal: "100",
              priceDecimal: "1.25",
              createdMicroseconds: 1786291200000000,
              updatedMicroseconds: 1786291200000000,
            })]),
            now: new Date(timestamp),
          },
        );
        repository.commitProcessedPage({
          claimed,
          receiptIdentities: Object.freeze([Object.freeze({
            schemeVersion: receipt.identity.schemeVersion,
            digestSha256: receipt.identity.digestSha256,
          })]),
          encryptedNextCursor: null,
          providerCompleted: true,
          receivedFillCount: 1,
          createdExecutionCount: result.createdExecutionCount,
          matchedExecutionCount: result.matchedExecutionCount,
          decisionRequiredCount: result.pendingSourceDecisionCount,
          timestamp,
        });
        return result;
      }).immediate();
    }

    const first = commitOne(createClaim(1), "deal-1", sha256("page-1"));
    if (first.createdExecutionCount !== 1 || first.matchedExecutionCount !== 0) {
      throw new Error("moomoo_import_workflow_first_commit_invalid");
    }
    const duplicate = commitOne(createClaim(2), "deal-1", sha256("page-2"));
    if (duplicate.createdExecutionCount !== 0 || duplicate.matchedExecutionCount !== 1) {
      throw new Error("moomoo_import_workflow_dedupe_invalid");
    }
    const incrementalCandidate = repository.listIncrementalCandidates(
      "2026-08-09T14:15:00.000Z",
    ).find((candidate) =>
      candidate.link.brokerAccountLinkId === brokerAccountLinkId);
    if (!incrementalCandidate) {
      throw new Error("moomoo_import_workflow_incremental_candidate_missing");
    }
    database.prepare(`UPDATE journal_broker_account_links
SET link_state = 'disconnected', updated_at_utc = ?
WHERE broker_account_link_id <> ? AND link_state = 'active'`)
      .run(timestamp, brokerAccountLinkId);
    const scheduledCount = new MoomooExecutionImportScheduler(
      database,
      () => new Date("2026-08-09T14:16:00.000Z"),
      { NODE_ENV: "test", TRADERLINK_MOOMOO_INCREMENTAL_SYNC_MINUTES: "15" },
    ).scheduleDue();
    const scheduledJob = repository.latestJobForLink(
      fixture.workspace_id,
      fixture.account_id,
      brokerAccountLinkId,
    );
    if (
      scheduledCount !== 1 || !scheduledJob ||
      scheduledJob.importKind !== "incremental_sync" ||
      scheduledJob.state !== "queued"
    ) {
      throw new Error("moomoo_import_workflow_incremental_schedule_invalid");
    }
    database.prepare(`DELETE FROM journal_broker_import_ranges
WHERE broker_import_job_id = ?`).run(scheduledJob.brokerImportJobId);
    database.prepare(`DELETE FROM journal_broker_import_jobs
WHERE broker_import_job_id = ?`).run(scheduledJob.brokerImportJobId);

    const rollbackClaim = createClaim(3);
    const rollbackReceipt = receiptFor(rollbackClaim, "deal-rollback");
    let rolledBack = false;
    try {
      database.transaction(() => {
        createJournalIntegrityRuntime(database).imports.commitMoomooApiFills(scope, {
          accountId: fixture.account_id,
          sourceIdentityId,
          pageIdentitySha256: sha256("rollback-page"),
          evidenceObjectKey: "moomoo_receipt_rollback_page",
          sourceDisplayLabel: "Moomoo account",
          fills: Object.freeze([Object.freeze({
            providerExecutionIdentity: rollbackReceipt.providerExecutionIdentity,
            normalizedSymbol: "ROLLBACK",
            tradeCurrency: "USD",
            side: "buy" as const,
            quantityDecimal: "1",
            priceDecimal: "1",
            createdMicroseconds: 1786291260000000,
            updatedMicroseconds: 1786291260000000,
          })]),
          now: new Date(timestamp),
        });
        throw new Error("expected_rollback");
      }).immediate();
    } catch (error) {
      if (error instanceof Error && error.message === "expected_rollback") rolledBack = true;
      else throw error;
    }
    if (!rolledBack) throw new Error("moomoo_import_workflow_rollback_missing");
    const rollbackState = database.prepare(`SELECT
  range_state, page_count, cursor_ciphertext
FROM journal_broker_import_ranges WHERE broker_import_range_id = ?`)
      .get(rollbackClaim.brokerImportRangeId) as Readonly<{
        range_state: string;
        page_count: number;
        cursor_ciphertext: string | null;
      }>;
    const rollbackAlias = database.prepare(`SELECT COUNT(*) AS count
FROM journal_execution_identity_aliases
WHERE workspace_id = ? AND account_id = ? AND alias_type = 'broker_fill'
  AND alias_scheme_version = ? AND alias_sha256 = ?`)
      .get(
        fixture.workspace_id,
        fixture.account_id,
        rollbackReceipt.identity.schemeVersion,
        rollbackReceipt.identity.digestSha256,
      ) as Readonly<{ count: number }>;
    if (
      rollbackState.range_state !== "received" || rollbackState.page_count !== 0 ||
      rollbackState.cursor_ciphertext !== null || rollbackAlias.count !== 0
    ) {
      throw new Error("moomoo_import_workflow_cursor_advanced_before_journal_commit");
    }
    repository.markRangeRetry({
      claimed: rollbackClaim,
      safeErrorCode: "moomoo_import_failed",
      nextAttemptAtUtc: "2026-08-09T14:05:00.000Z",
      timestamp,
    });

    const coveragePlan = planMoomooExecutionImport({
      cutoff: new Date(timestamp),
      earliestExecutionDate: "2026-08-01",
      enabledMarketCodes: Object.freeze([2]),
    });
    const alreadyCoveredPlan = planMoomooExecutionImport({
      cutoff: new Date(timestamp),
      earliestExecutionDate: "2026-08-01",
      enabledMarketCodes: Object.freeze([2]),
      completedCoverage: coveragePlan.ranges.map((range) => Object.freeze({
        market: range.market,
        startMicroseconds: range.startMicroseconds,
        endMicroseconds: range.endMicroseconds,
      })),
    });
    if (alreadyCoveredPlan.ranges.length !== 0) {
      throw new Error("moomoo_import_workflow_covered_ranges_replanned");
    }

    const requestedDateFloor = moomooExecutionDateFloorMicroseconds(
      "2026-08-09",
      "US",
    );
    if (
      isMoomooExecutionWithinRequestedWindow({
        createdMicroseconds: requestedDateFloor - 1,
        requestedStartDate: "2026-08-09",
        market: "US",
        cutoffMicroseconds: requestedDateFloor + 1,
      }) ||
      !isMoomooExecutionWithinRequestedWindow({
        createdMicroseconds: requestedDateFloor,
        requestedStartDate: "2026-08-09",
        market: "US",
        cutoffMicroseconds: requestedDateFloor + 1,
      }) ||
      isMoomooExecutionWithinRequestedWindow({
        createdMicroseconds: requestedDateFloor + 2,
        requestedStartDate: "2026-08-09",
        market: "US",
        cutoffMicroseconds: requestedDateFloor + 1,
      })
    ) {
      throw new Error("moomoo_import_workflow_execution_date_floor_invalid");
    }

    repository.disconnectLinksForConnection(fixture.connection_id, timestamp);
    if (repository.findLinkById(
      fixture.workspace_id,
      fixture.account_id,
      brokerAccountLinkId,
    )?.state !== "disconnected") {
      throw new Error("moomoo_import_workflow_disconnect_missing");
    }
    const reactivated = repository.upsertLink({
      brokerAccountLinkId,
      workspaceId: fixture.workspace_id,
      accountId: fixture.account_id,
      sourceIdentityId,
      connectionId: fixture.connection_id,
      privacySafeLabel: "Moomoo account",
      accountType: "cash",
      enabledMarketCodes: Object.freeze([2]),
      encryptedAccountId,
      timestamp,
    });
    if (reactivated.state !== "active" ||
        reactivated.brokerAccountLinkId !== brokerAccountLinkId) {
      throw new Error("moomoo_import_workflow_reactivation_invalid");
    }

    const foreignKeyFailures = database.pragma("foreign_key_check") as readonly unknown[];
    if (foreignKeyFailures.length !== 0) {
      throw new Error("moomoo_import_workflow_foreign_key_failure");
    }
    console.info(JSON.stringify({
      cursorHeldUntilJournalCommit: true,
      duplicateExecutionCreated: false,
      fullyCoveredRangesReplanned: alreadyCoveredPlan.ranges.length,
      firstCreatedExecutionCount: first.createdExecutionCount,
      foreignKeyFailures: 0,
      incrementalCandidateFound: true,
      incrementalJobScheduled: true,
      requestedExecutionDateFloorEnforced: true,
      sourceIdentityReactivated: true,
      retryStatePreserved: true,
    }));
  } finally {
    database.close();
  }
} finally {
  const resolvedTemporaryRoot = resolve(temporaryRoot);
  const resolvedTempDirectory = resolve(tmpdir());
  if (!resolvedTemporaryRoot.startsWith(`${resolvedTempDirectory}\\traderlink-moomoo-import-workflow-`)) {
    throw new Error("moomoo_import_workflow_temporary_path_invalid");
  }
  rmSync(resolvedTemporaryRoot, { force: true, recursive: true });
}
