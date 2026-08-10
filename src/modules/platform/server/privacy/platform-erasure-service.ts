import type Database from "better-sqlite3";

import type { AccountScope, WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import {
  assertCanonicalUuidV4,
  platformFailure,
} from "../database/platform-migration-contract";

type SchemaRow = Readonly<{ name: string; sql: string }>;
type ColumnRow = Readonly<{ name: string }>;
type ForeignKeyRow = Readonly<{
  id: number;
  seq: number;
  table: string;
  from: string;
  to: string;
}>;

type PrimaryEvidenceArtifact = Readonly<{
  kind: "primary_evidence";
  evidenceObjectKey: string;
  sourceFileSha256: string;
  sourceFileSizeBytes: number;
}>;

type SupportSourceArtifact = Readonly<{
  kind: "support_source";
  objectKey: string;
  sourceFileSha256: string;
  sourceFileSizeBytes: number;
}>;

export type PlatformErasureArtifact = PrimaryEvidenceArtifact | SupportSourceArtifact;

export type PlatformErasureResult = Readonly<{
  erasedAccountIds: readonly string[];
  privateArtifactsPurged: readonly PlatformErasureArtifact[];
}>;

export type PlatformErasureOptions = Readonly<{
  /**
   * Purges unshared private objects while the database transaction is still
   * open. A purge failure aborts the database change, so an account never
   * remains accessible after its private source has been removed.
   */
  purgePrivateArtifacts?: (artifacts: readonly PlatformErasureArtifact[]) => void;
}>;

const IDENTIFIER = /^[a-z][a-z0-9_]*$/u;

function identifier(value: string): string {
  if (!IDENTIFIER.test(value)) {
    platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", { check: "erasure_identifier" });
  }
  return value;
}

function tables(database: Database.Database): readonly string[] {
  return Object.freeze(database.prepare<[], SchemaRow>(`SELECT name, sql
FROM sqlite_master
WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
ORDER BY name`).all()
    .map((table) => table.name)
    .filter((name) => name !== "platform_schema_migrations"));
}

function hasColumn(database: Database.Database, table: string, column: string): boolean {
  return database.prepare<[], ColumnRow>(`PRAGMA table_info(${identifier(table)})`)
    .all().some((candidate) => candidate.name === column);
}

function tablesWithColumn(
  database: Database.Database,
  column: string,
): readonly string[] {
  return Object.freeze(tables(database).filter((table) => hasColumn(database, table, column)));
}

function deleteGuards(database: Database.Database): readonly SchemaRow[] {
  return Object.freeze(database.prepare<[], SchemaRow>(`SELECT name, sql
FROM sqlite_master
WHERE type = 'trigger' AND sql LIKE '%BEFORE DELETE%'
ORDER BY name`).all().filter((trigger) => trigger.sql.length > 0));
}

function foreignKeys(database: Database.Database, table: string): readonly ForeignKeyRow[] {
  return Object.freeze(database.prepare<[], ForeignKeyRow>(
    `PRAGMA foreign_key_list(${identifier(table)})`,
  ).all());
}

function deleteOrphanedForeignKeyRows(database: Database.Database): void {
  // All ordinary deletes are account/user/workspace-scoped. This final pass
  // removes only descendants of those removed roots, including future tables
  // that carry an FK rather than repeating one of those scope columns.
  for (let pass = 0; pass < 32; pass += 1) {
    let removed = 0;
    for (const childTable of tables(database)) {
      const groups = new Map<number, ForeignKeyRow[]>();
      for (const foreignKey of foreignKeys(database, childTable)) {
        const group = groups.get(foreignKey.id) ?? [];
        group.push(foreignKey);
        groups.set(foreignKey.id, group);
      }
      for (const group of groups.values()) {
        if (group.some((foreignKey) => !foreignKey.to)) continue;
        const ordered = [...group].sort((left, right) => left.seq - right.seq);
        const childPresent = ordered.map((foreignKey) =>
          `child.${identifier(foreignKey.from)} IS NOT NULL`).join(" AND ");
        const parentMatch = ordered.map((foreignKey) =>
          `parent.${identifier(foreignKey.to)} = child.${identifier(foreignKey.from)}`).join(" AND ");
        removed += database.prepare(`DELETE FROM ${identifier(childTable)} AS child
WHERE ${childPresent} AND NOT EXISTS (
  SELECT 1 FROM ${identifier(ordered[0]!.table)} AS parent WHERE ${parentMatch}
)`).run().changes;
      }
    }
    if (removed === 0) return;
  }
  platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", { check: "erasure_orphan_passes" });
}

function readPrivateArtifacts(
  database: Database.Database,
  accountIds: readonly string[],
): readonly PlatformErasureArtifact[] {
  if (accountIds.length === 0) return Object.freeze([]);
  const placeholders = accountIds.map(() => "?").join(", ");
  const primary = database.prepare<string[], Readonly<{
    evidence_object_key: string;
    source_file_sha256: string;
    source_file_size_bytes: number;
  }>>(`SELECT DISTINCT evidence_object_key, source_file_sha256, source_file_size_bytes
FROM journal_import_batches
WHERE account_id IN (${placeholders}) AND evidence_object_key IS NOT NULL`).all(...accountIds)
    .map((row) => Object.freeze({
      kind: "primary_evidence" as const,
      evidenceObjectKey: row.evidence_object_key,
      sourceFileSha256: row.source_file_sha256,
      sourceFileSizeBytes: row.source_file_size_bytes,
    }));
  const support = database.prepare<string[], Readonly<{
    object_key: string;
    source_file_sha256: string;
    source_file_size_bytes: number;
    purge_state: string;
  }>>(`SELECT object_key, source_file_sha256, source_file_size_bytes, purge_state
FROM journal_statement_support_objects
WHERE account_id IN (${placeholders})`).all(...accountIds)
    .filter((row) => row.purge_state !== "purged")
    .map((row) => Object.freeze({
      kind: "support_source" as const,
      objectKey: row.object_key,
      sourceFileSha256: row.source_file_sha256,
      sourceFileSizeBytes: row.source_file_size_bytes,
    }));
  return Object.freeze([...primary, ...support]);
}

function unsharedArtifacts(
  database: Database.Database,
  artifacts: readonly PlatformErasureArtifact[],
): readonly PlatformErasureArtifact[] {
  return Object.freeze(artifacts.filter((artifact) => {
    if (artifact.kind === "primary_evidence") {
      return database.prepare<[string], { count: number }>(`SELECT COUNT(*) AS count
FROM journal_import_batches WHERE evidence_object_key = ?`).get(artifact.evidenceObjectKey)?.count === 0;
    }
    return database.prepare<[string], { count: number }>(`SELECT COUNT(*) AS count
FROM journal_statement_support_objects WHERE object_key = ?`).get(artifact.objectKey)?.count === 0;
  }));
}

function eraseAccountRows(
  database: Database.Database,
  scope: AccountScope,
): readonly string[] {
  const accountTables = tablesWithColumn(database, "account_id");
  // These child tables deliberately do not repeat account_id.
  database.prepare(`DELETE FROM platform_notification_receipts
WHERE notification_id IN (
  SELECT notification_id FROM platform_notifications WHERE journal_account_id = ?
)`).run(scope.accountId);
  database.prepare(`DELETE FROM coach_weekly_issued_reviews
WHERE coach_weekly_review_request_id IN (
  SELECT coach_weekly_review_request_id FROM coach_weekly_review_requests WHERE account_id = ?
)`).run(scope.accountId);
  database.prepare(`DELETE FROM coach_monthly_issued_reviews
WHERE coach_monthly_review_request_id IN (
  SELECT coach_monthly_review_request_id FROM coach_monthly_review_requests WHERE account_id = ?
)`).run(scope.accountId);
  database.prepare(`DELETE FROM coach_ai_issued_reviews_v2
WHERE coach_ai_review_period_request_id IN (
  SELECT coach_ai_review_period_request_id FROM coach_ai_review_period_requests_v2 WHERE account_id = ?
)`).run(scope.accountId);
  database.prepare(`DELETE FROM coach_ai_review_generation_attempt_receipts
WHERE coach_ai_review_generation_attempt_id IN (
  SELECT coach_ai_review_generation_attempt_id FROM coach_ai_review_generation_attempts WHERE account_id = ?
)`).run(scope.accountId);
  database.prepare(`DELETE FROM coach_ai_review_generation_attempt_receipts_v2
WHERE coach_ai_review_generation_attempt_id IN (
  SELECT coach_ai_review_generation_attempt_id FROM coach_ai_review_generation_attempts_v2 WHERE account_id = ?
)`).run(scope.accountId);
  database.prepare(`DELETE FROM journal_round_trip_daily_trade_analysis_versions
WHERE daily_trade_analysis_id IN (
  SELECT daily_trade_analysis_id FROM journal_round_trip_daily_trade_analyses WHERE account_id = ?
)`).run(scope.accountId);
  database.prepare(`DELETE FROM journal_round_trip_daily_trade_analysis_event_snapshots
WHERE execution_id IN (
  SELECT execution_id FROM journal_executions WHERE account_id = ?
)`).run(scope.accountId);
  database.prepare(`DELETE FROM journal_round_trip_daily_trade_analysis_path_summaries
WHERE round_trip_version_id IN (
  SELECT round_trip_version_id FROM journal_round_trip_versions WHERE account_id = ?
)`).run(scope.accountId);
  for (const table of accountTables) {
    if (table !== "journal_accounts") {
      database.prepare(`DELETE FROM ${identifier(table)} WHERE account_id = ?`).run(scope.accountId);
    }
  }
  database.prepare("DELETE FROM platform_notifications WHERE journal_account_id = ?").run(scope.accountId);
  const removed = database.prepare(`DELETE FROM journal_accounts
WHERE workspace_id = ? AND account_id = ?`).run(scope.workspaceId, scope.accountId);
  if (removed.changes !== 1) platformFailure("TRADERLINK_ACCOUNT_NOT_FOUND");
  return Object.freeze([scope.accountId]);
}

function withPermanentDeleteTransaction<T>(
  database: Database.Database,
  operation: () => T,
): T {
  const guards = deleteGuards(database);
  return database.transaction(() => {
    database.pragma("defer_foreign_keys = ON");
    for (const guard of guards) database.exec(`DROP TRIGGER ${identifier(guard.name)}`);
    const result = operation();
    for (const guard of guards) database.exec(guard.sql);
    if (database.prepare("PRAGMA foreign_key_check").all().length > 0) {
      platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", { check: "erasure_foreign_keys" });
    }
    return result;
  }).immediate();
}

function assertSoleWorkspaceOwner(
  database: Database.Database,
  scope: WorkspaceAccessScope,
): void {
  const userMemberships = database.prepare<[string], { count: number }>(`SELECT COUNT(*) AS count
FROM platform_workspace_memberships WHERE user_id = ?`).get(scope.userId);
  const workspaceMembers = database.prepare<[string], { count: number }>(`SELECT COUNT(*) AS count
FROM platform_workspace_memberships WHERE workspace_id = ?`).get(scope.workspaceId);
  if (userMemberships?.count !== 1 || workspaceMembers?.count !== 1) {
    platformFailure("TRADERLINK_WORKSPACE_ACCESS_DENIED");
  }
}

/** Permanently removes authorized TraderLink data. */
export class PlatformErasureService {
  constructor(private readonly database: Database.Database) {}

  eraseTradeTrackerAccount(
    scope: AccountScope,
    options: PlatformErasureOptions = {},
  ): PlatformErasureResult {
    assertCanonicalUuidV4(scope.userId, "erasureUserId");
    assertCanonicalUuidV4(scope.workspaceId, "erasureWorkspaceId");
    assertCanonicalUuidV4(scope.accountId, "erasureAccountId");
    if (scope.workspaceRole !== "owner") platformFailure("TRADERLINK_WORKSPACE_ACCESS_DENIED");
    return withPermanentDeleteTransaction(this.database, () => {
      const artifacts = readPrivateArtifacts(this.database, [scope.accountId]);
      const erasedAccountIds = eraseAccountRows(this.database, scope);
      deleteOrphanedForeignKeyRows(this.database);
      const privateArtifactsPurged = unsharedArtifacts(this.database, artifacts);
      options.purgePrivateArtifacts?.(privateArtifactsPurged);
      return Object.freeze({ erasedAccountIds, privateArtifactsPurged });
    });
  }

  eraseTraderLinkAccount(
    scope: WorkspaceAccessScope,
    options: PlatformErasureOptions = {},
  ): PlatformErasureResult {
    if (scope.workspaceRole !== "owner") platformFailure("TRADERLINK_WORKSPACE_ACCESS_DENIED");
    assertSoleWorkspaceOwner(this.database, scope);
    return withPermanentDeleteTransaction(this.database, () => {
      const accountIds = this.database.prepare<[string], { account_id: string }>(`SELECT account_id
FROM journal_accounts WHERE workspace_id = ?`).all(scope.workspaceId).map((row) => row.account_id);
      const artifacts = readPrivateArtifacts(this.database, accountIds);
      for (const accountId of accountIds) {
        eraseAccountRows(this.database, Object.freeze({
          accountId,
          userId: scope.userId,
          workspaceId: scope.workspaceId,
          workspaceRole: scope.workspaceRole,
        }));
      }
      for (const table of tablesWithColumn(this.database, "workspace_id")) {
        if (table !== "platform_workspaces" && table !== "platform_workspace_memberships") {
          this.database.prepare(`DELETE FROM ${identifier(table)} WHERE workspace_id = ?`).run(scope.workspaceId);
        }
      }
      for (const table of tablesWithColumn(this.database, "user_id")) {
        if (table !== "platform_users" && table !== "platform_workspace_memberships") {
          this.database.prepare(`DELETE FROM ${identifier(table)} WHERE user_id = ?`).run(scope.userId);
        }
      }
      deleteOrphanedForeignKeyRows(this.database);
      this.database.prepare("DELETE FROM platform_workspace_memberships WHERE user_id = ?").run(scope.userId);
      this.database.prepare("DELETE FROM platform_workspaces WHERE workspace_id = ?").run(scope.workspaceId);
      const removed = this.database.prepare("DELETE FROM platform_users WHERE user_id = ?").run(scope.userId);
      if (removed.changes !== 1) platformFailure("TRADERLINK_WORKSPACE_ACCESS_DENIED");
      deleteOrphanedForeignKeyRows(this.database);
      const privateArtifactsPurged = unsharedArtifacts(this.database, artifacts);
      options.purgePrivateArtifacts?.(privateArtifactsPurged);
      return Object.freeze({
        erasedAccountIds: Object.freeze(accountIds),
        privateArtifactsPurged,
      });
    });
  }
}
