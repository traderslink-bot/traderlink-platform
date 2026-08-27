import type Database from "better-sqlite3";

import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";
import type { JournalDemoExecutionProvenanceFact, JournalDemoPackManifest } from "./journal-demo-pack-contract";

export const JOURNAL_DEMO_ACCOUNT_READ_ONLY_REASON = "demo_account_read_only";

export type JournalDemoAccountRecord = Readonly<{
  accountId: string; createdAtUtc: string; createdForUserId: string; demoPackVersionId: string; workspaceId: string;
}>;

type DemoAccountRow = Readonly<{
  account_id: string; created_at_utc: string; created_for_user_id: string; demo_pack_version_id: string; workspace_id: string;
}>;
type DemoPackVersionRow = Readonly<{
  demo_pack_version_id: string; manifest_sha256: string; market_data_manifest_sha256: string;
  materializer_version: string; pack_key: string; pack_version: number;
}>;

function mapDemoAccount(row: DemoAccountRow): JournalDemoAccountRecord {
  return Object.freeze({ accountId: row.account_id, createdAtUtc: row.created_at_utc,
    createdForUserId: row.created_for_user_id, demoPackVersionId: row.demo_pack_version_id, workspaceId: row.workspace_id });
}

export class JournalDemoAccountRepository {
  constructor(private readonly database: Database.Database) {}

  findActiveAccount(scope: WorkspaceAccessScope): JournalDemoAccountRecord | null {
    if (!scope.activeAccountId || !scope.allowedAccountIds.includes(scope.activeAccountId)) return null;
    const row = this.database.prepare<[string, string, string], DemoAccountRow>(`SELECT demo.account_id, demo.created_at_utc, demo.created_for_user_id, demo.demo_pack_version_id, demo.workspace_id
FROM journal_demo_accounts demo JOIN journal_accounts account ON account.workspace_id = demo.workspace_id AND account.account_id = demo.account_id
WHERE demo.workspace_id = ? AND demo.account_id = ? AND demo.created_for_user_id = ? AND account.status = 'active' LIMIT 1`)
      .get(scope.workspaceId, scope.activeAccountId, scope.userId);
    return row ? mapDemoAccount(row) : null;
  }

  findAccountForUser(input: Readonly<{ userId: string; workspaceId: string }>): JournalDemoAccountRecord | null {
    const row = this.database.prepare<[string, string], DemoAccountRow>(`SELECT demo.account_id, demo.created_at_utc, demo.created_for_user_id, demo.demo_pack_version_id, demo.workspace_id
FROM journal_demo_accounts demo JOIN journal_accounts account ON account.workspace_id = demo.workspace_id AND account.account_id = demo.account_id
WHERE demo.workspace_id = ? AND demo.created_for_user_id = ? AND account.status = 'active' LIMIT 1`)
      .get(input.workspaceId, input.userId);
    return row ? mapDemoAccount(row) : null;
  }

  hasAcceptedRealExecutionInWorkspace(workspaceId: string): boolean {
    return Boolean(this.database.prepare<[string], { found: number }>(`SELECT 1 AS found FROM journal_executions execution
LEFT JOIN journal_demo_accounts demo ON demo.workspace_id = execution.workspace_id AND demo.account_id = execution.account_id
WHERE execution.workspace_id = ? AND execution.current_state = 'accepted' AND demo.account_id IS NULL LIMIT 1`).get(workspaceId));
  }

  ensurePackVersion(input: Readonly<{ createdAtUtc: string; manifest: JournalDemoPackManifest }>): void {
    this.database.prepare(`INSERT OR IGNORE INTO journal_demo_pack_versions (demo_pack_version_id, pack_key, pack_version, manifest_sha256, market_data_manifest_sha256, materializer_version, created_at_utc) VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .run(input.manifest.demoPackVersionId, input.manifest.packKey, input.manifest.packVersion,
        input.manifest.manifestSha256, input.manifest.marketDataManifestSha256,
        input.manifest.materializerVersion, input.createdAtUtc);
    const stored = this.database.prepare<[string], DemoPackVersionRow>(`SELECT demo_pack_version_id, pack_key, pack_version, manifest_sha256, market_data_manifest_sha256, materializer_version FROM journal_demo_pack_versions WHERE demo_pack_version_id = ?`)
      .get(input.manifest.demoPackVersionId);
    if (!stored || stored.pack_key !== input.manifest.packKey || stored.pack_version !== input.manifest.packVersion ||
      stored.manifest_sha256 !== input.manifest.manifestSha256 ||
      stored.market_data_manifest_sha256 !== input.manifest.marketDataManifestSha256 ||
      stored.materializer_version !== input.manifest.materializerVersion) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "demoPackManifest" });
    }
  }

  createDemoAccount(input: JournalDemoAccountRecord): void {
    this.database.prepare(`INSERT INTO journal_demo_accounts (workspace_id, account_id, demo_pack_version_id, created_for_user_id, created_at_utc) VALUES (?, ?, ?, ?, ?)`)
      .run(input.workspaceId, input.accountId, input.demoPackVersionId, input.createdForUserId, input.createdAtUtc);
  }

  createExecutionProvenance(input: Readonly<{ accountId: string; createdAtUtc: string; demoPackVersionId: string; executionProvenanceId: string; fact: JournalDemoExecutionProvenanceFact; workspaceId: string }>): void {
    this.database.prepare(`INSERT INTO journal_demo_execution_provenance (demo_execution_provenance_id, workspace_id, account_id, demo_pack_version_id, execution_id, execution_version_id, pack_execution_key, execution_fact_sha256, created_at_utc) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(input.executionProvenanceId, input.workspaceId, input.accountId, input.demoPackVersionId,
        input.fact.executionId, input.fact.executionVersionId, input.fact.packExecutionKey,
        input.fact.executionFactSha256, input.createdAtUtc);
  }

  requireActiveAccountIsNotDemo(scope: WorkspaceAccessScope): void {
    if (this.findActiveAccount(scope)) {
      platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED", { reason: JOURNAL_DEMO_ACCOUNT_READ_ONLY_REASON });
    }
  }

  hasRealAcceptedExecution(scope: WorkspaceAccessScope): boolean {
    if (scope.allowedAccountIds.length === 0) return false;
    return Boolean(this.database.prepare(`SELECT 1 AS found FROM journal_executions execution
LEFT JOIN journal_demo_accounts demo ON demo.workspace_id = execution.workspace_id AND demo.account_id = execution.account_id
WHERE execution.workspace_id = ? AND execution.account_id IN (${scope.allowedAccountIds.map(() => "?").join(", ")})
  AND execution.current_state = 'accepted' AND demo.account_id IS NULL LIMIT 1`)
      .get(scope.workspaceId, ...scope.allowedAccountIds));
  }
}
