import "server-only";

import type Database from "better-sqlite3";

import { PlatformNotificationRepository } from "@/src/modules/platform/server/notifications/platform-notification-repository";
import { createCanonicalUtcTimestamp } from "@/src/modules/platform/server/database/platform-migration-contract";
import { parseJournalGenericStatementMappingContract, type JournalGenericStatementMappingContract } from "../imports/journal-generic-mapped-statement-adapter";
import { commitJournalGenericMappedUpload, previewJournalGenericMappedUpload } from "../product/journal-import-product-service";
import { resolvePlatformDatabaseConfig } from "@/src/modules/platform/server/database/platform-database-config";
import { readJournalSupportSource, resolveJournalSupportSourceVault } from "./journal-support-source-vault";
import { JournalAiImportRepairRepository } from "./journal-ai-import-repair-repository";

export type JournalAiImportRepairProvider = (input: Readonly<{
  sourceText: string;
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
      const sourceBytes = readJournalSupportSource({ vault, ...claimed.supportObject });
      const mapping = parseJournalGenericStatementMappingContract(await this.provider({
        sourceText: new TextDecoder("utf-8", { fatal: true }).decode(sourceBytes),
      }));
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
      return true;
    } catch {
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
