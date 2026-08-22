import "server-only";

import type Database from "better-sqlite3";

import { PlatformNotificationRepository } from "@/src/modules/platform/server/notifications/platform-notification-repository";
import {
  createCanonicalUtcTimestamp,
  isTraderLinkPlatformError,
} from "@/src/modules/platform/server/database/platform-migration-contract";
import { parseJournalGenericStatementMappingContract, type JournalGenericStatementMappingContract } from "../imports/journal-generic-mapped-statement-adapter";
import { commitJournalGenericMappedUpload, previewJournalGenericMappedUpload } from "../product/journal-import-product-service";
import { resolvePlatformDatabaseConfig } from "@/src/modules/platform/server/database/platform-database-config";
import { readJournalSupportSource, resolveJournalSupportSourceVault } from "./journal-support-source-vault";
import { JournalAiImportRepairRepository } from "./journal-ai-import-repair-repository";
import { sendDiscordStatementImportCompletion } from "@/src/modules/platform/server/notifications/platform-discord-direct-message";

export type JournalAiImportRepairProvider = (input: Readonly<{
  sourceText: string;
  confirmedBrokerName: string;
}>) => Promise<JournalGenericStatementMappingContract | unknown>;

export class JournalAiImportRepairWorker {
  constructor(
    private readonly database: Database.Database,
    private readonly provider: JournalAiImportRepairProvider | null,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async runOne(): Promise<boolean> {
    // No provider means the host has not explicitly enabled AI processing.
    if (!this.provider) return false;
    const repository = new JournalAiImportRepairRepository(this.database);
    const timestamp = createCanonicalUtcTimestamp(this.now());
    const claimed = repository.claimNext(timestamp);
    if (!claimed) return false;
    try {
      const vault = resolveJournalSupportSourceVault({
        databasePath: resolvePlatformDatabaseConfig({}).databasePath,
      });
      const sourceBytes = readJournalSupportSource({
        vault,
        objectKey: claimed.supportObject.objectKey,
        expectedSha256: claimed.supportObject.sourceFileSha256,
        expectedSizeBytes: claimed.supportObject.sourceFileSizeBytes,
      });
      const providerMapping = parseJournalGenericStatementMappingContract(await this.provider({
        sourceText: new TextDecoder("utf-8", { fatal: true }).decode(sourceBytes),
        confirmedBrokerName: claimed.confirmedBrokerName,
      }));
      // The broker is chosen by the trader before upload. A provider cannot
      // infer or replace that identity from statement content.
      const mapping = parseJournalGenericStatementMappingContract({
        ...providerMapping,
        brokerName: claimed.confirmedBrokerName,
      });
      const preview = previewJournalGenericMappedUpload(claimed.scope, {
        sourceBytes, mapping, mappingOrigin: "manual_mapping",
        attemptBindingSha256: claimed.requestIdempotencySha256,
      });
      if (!preview.canCommit) throw new Error("private_preview_rejected");
      const result = commitJournalGenericMappedUpload(claimed.scope, {
        sourceBytes, mapping, previewRef: preview.previewRef,
        attemptBindingSha256: claimed.requestIdempotencySha256,
        attemptCorrelationSha256: claimed.correlationRefSha256,
      });
      const completedAtUtc = createCanonicalUtcTimestamp(this.now());
      // An exact duplicate has no new batch; the original import is already safe.
      if (result.status !== "committed") throw new Error("private_preview_duplicate");
      const attempt = this.database.prepare<[string], { committed_import_batch_id: string | null }>(`SELECT committed_import_batch_id
FROM journal_import_attempts WHERE import_attempt_id = ?`).get(claimed.importAttemptId);
      if (!attempt?.committed_import_batch_id) throw new Error("private_commit_missing");
      repository.complete({ repairJobId: claimed.job.repairJobId, importBatchId: attempt.committed_import_batch_id, timestamp: completedAtUtc });
      new PlatformNotificationRepository(this.database).create({
        category: "statement_import", destinationPath: "/imports", journalAccountId: claimed.scope.activeAccountId,
        kind: "statement_ai_repair_completed", occurredAtUtc: completedAtUtc, scope: claimed.scope,
        sourceEventKey: `statement_ai_repair_completed_${claimed.job.repairJobId}`,
        title: "Statement import complete", summary: "AI finished configuring and importing your statement.",
      });
      if (claimed.job.discordCompletionRequested) {
        const identity = this.database.prepare<[string], { auth_subject: string }>(`SELECT auth_subject
FROM platform_auth_identities
WHERE user_id = ? AND auth_provider = 'discord' AND status = 'active'`).get(claimed.scope.userId);
        if (identity) await sendDiscordStatementImportCompletion({ discordSubject: identity.auth_subject });
      }
      return true;
    } catch (error) {
      const providerStatus = typeof error === "object" && error !== null &&
        "statusCode" in error && typeof error.statusCode === "number"
        ? error.statusCode
        : null;
      const failureContext = isTraderLinkPlatformError(error)
        ? error.safeContext
        : undefined;
      console.error("TraderLink AI import repair worker failed", {
        failure: isTraderLinkPlatformError(error)
          ? error.code
          : providerStatus === null
            ? error instanceof Error ? error.name : "unknown"
            : `provider_status_${providerStatus}`,
        ...(failureContext && Object.keys(failureContext).length > 0
          ? { failureContext }
          : {}),
      });
      const failedAtUtc = createCanonicalUtcTimestamp(this.now());
      repository.fail({ repairJobId: claimed.job.repairJobId, safeFailureCode: "ai_repair_failed", timestamp: failedAtUtc });
      new PlatformNotificationRepository(this.database).create({
        category: "statement_import", destinationPath: "/imports", journalAccountId: claimed.scope.activeAccountId,
        kind: "statement_ai_repair_failed", occurredAtUtc: failedAtUtc, scope: claimed.scope,
        sourceEventKey: `statement_ai_repair_failed_${claimed.job.repairJobId}`,
        title: "Statement import needs attention", summary: "We could not complete this statement import automatically. You can try the mapping option instead.",
      });
      return true;
    }
  }
}
