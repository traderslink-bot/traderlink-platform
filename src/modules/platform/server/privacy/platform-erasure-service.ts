import type Database from "better-sqlite3";
import { captureErasureClosure, type ErasureRoot } from "./platform-erasure-closure";
import { observeErasurePhase } from "./platform-erasure-observability";

import { JournalAccountRepository, type JournalAccountRecord } from "@/src/modules/journal/server/accounts/journal-account-repository";
import { JournalDemoAccountRepository } from "@/src/modules/journal/server/demo/journal-demo-account-repository";
import type { AccountScope, WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import {
  assertCanonicalUuidV4,
  createCanonicalUtcTimestamp,
  createCanonicalUuidV4,
  platformFailure,
} from "../database/platform-migration-contract";

type SchemaRow = Readonly<{ name: string; sql: string }>;
type ColumnRow = Readonly<{ name: string }>;
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
  privateArtifactsPendingPurge: readonly PlatformErasureArtifact[];
}>;

export type PlatformDemoErasureReplacementResult = PlatformErasureResult & Readonly<{
  replacementAccount: JournalAccountRecord;
}>;

export type PlatformErasureOptions = Readonly<{
  /** Validate private objects and persist their cleanup obligations in this
   * transaction. MUST NOT remove/rename files: rollback must preserve bytes.
   * Physical purge runs only after this transaction commits successfully.
   */
  recordPrivateArtifactObligations?: (artifacts: readonly PlatformErasureArtifact[]) => void;
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
    .filter((name) => name !== "platform_schema_migrations" && !name.startsWith("platform_erasure_")));
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

function captureScopedRows(database: Database.Database, scope: AccountScope | WorkspaceAccessScope) {
  const roots: ErasureRoot[] = [];
  if ("accountId" in scope) {
    for (const table of tablesWithColumn(database, "account_id")) {
      roots.push({ table, column: "account_id", value: scope.accountId, workspaceId: scope.workspaceId });
    }
    roots.push({ table: "platform_notifications", column: "journal_account_id", value: scope.accountId, workspaceId: scope.workspaceId });
  } else {
    for (const column of ["workspace_id", "user_id"] as const) {
      for (const table of tablesWithColumn(database, column)) {
        roots.push({ table, column, value: column === "workspace_id" ? scope.workspaceId : scope.userId });
      }
    }
    if (tables(database).includes("platform_discord_identity_releases")) {
      roots.push({ table: "platform_discord_identity_releases", column: "claimed_by_user_id", value: scope.userId });
    }
  }
  return observeErasurePhase("capture_roots", () => captureErasureClosure(database, roots, {
    workspaceId: scope.workspaceId,
    accountIds: "accountId" in scope ? [scope.accountId] : undefined,
    excludeTables: database.prepare<[], { name: string }>(
      "SELECT name FROM sqlite_schema WHERE type='table' AND name LIKE 'platform_erasure_%'",
    ).all().map((row) => row.name),
  }));
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
WHERE account_id IN (${placeholders}) AND evidence_object_key IS NOT NULL LIMIT 10001`).all(...accountIds)
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
WHERE account_id IN (${placeholders}) AND purge_state <> 'purged' LIMIT 10001`).all(...accountIds)
    .map((row) => Object.freeze({
      kind: "support_source" as const,
      objectKey: row.object_key,
      sourceFileSha256: row.source_file_sha256,
      sourceFileSizeBytes: row.source_file_size_bytes,
    }));
  if (primary.length + support.length > 10_000) platformFailure("TRADERLINK_ACCOUNT_ERASURE_FAILED");
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

function eraseAccountRows(database: Database.Database, scope: AccountScope): readonly string[] {
  const account = database.prepare(`SELECT 1 FROM journal_accounts WHERE workspace_id=? AND account_id=?`)
    .get(scope.workspaceId, scope.accountId);
  if (!account) platformFailure("TRADERLINK_ACCOUNT_NOT_FOUND");
  const closure = captureScopedRows(database, scope);
  try { closure.deleteRows(); } finally { closure.dispose(); }
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
    if (observeErasurePhase("foreign_key_check", () => database.prepare("PRAGMA foreign_key_check").get())) {
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
      const privateArtifactsPendingPurge = unsharedArtifacts(this.database, artifacts);
      if (privateArtifactsPendingPurge.length && !options.recordPrivateArtifactObligations) {
        platformFailure("TRADERLINK_ACCOUNT_ERASURE_FAILED");
      }
      options.recordPrivateArtifactObligations?.(privateArtifactsPendingPurge);
      return Object.freeze({ erasedAccountIds, privateArtifactsPendingPurge });
    });
  }

  eraseDemoTradeTrackerAccount(
    scope: AccountScope,
    options: PlatformErasureOptions = {},
  ): PlatformErasureResult {
    assertCanonicalUuidV4(scope.userId, "erasureUserId");
    assertCanonicalUuidV4(scope.workspaceId, "erasureWorkspaceId");
    assertCanonicalUuidV4(scope.accountId, "erasureAccountId");
    if (scope.workspaceRole !== "owner") platformFailure("TRADERLINK_WORKSPACE_ACCESS_DENIED");
    return withPermanentDeleteTransaction(this.database, () => {
      const artifacts = readPrivateArtifacts(this.database, [scope.accountId]);
      const timestamp = createCanonicalUtcTimestamp();
      const erasedAccountIds = eraseAccountRows(this.database, scope);
      new JournalDemoAccountRepository(this.database).recordClearedLifecycle({
        clearedAtUtc: timestamp,
        clearedDemoAccountId: scope.accountId,
        userId: scope.userId,
        workspaceId: scope.workspaceId,
      });
      const privateArtifactsPendingPurge = unsharedArtifacts(this.database, artifacts);
      if (privateArtifactsPendingPurge.length && !options.recordPrivateArtifactObligations) {
        platformFailure("TRADERLINK_ACCOUNT_ERASURE_FAILED");
      }
      options.recordPrivateArtifactObligations?.(privateArtifactsPendingPurge);
      return Object.freeze({ erasedAccountIds, privateArtifactsPendingPurge });
    });
  }

  eraseDemoTradeTrackerAccountAndCreatePrimaryJournal(
    scope: AccountScope,
    input: Readonly<{ baseCurrency: string; tradingTimezone: string }>,
    options: PlatformErasureOptions = {},
  ): PlatformDemoErasureReplacementResult {
    assertCanonicalUuidV4(scope.userId, "erasureUserId");
    assertCanonicalUuidV4(scope.workspaceId, "erasureWorkspaceId");
    assertCanonicalUuidV4(scope.accountId, "erasureAccountId");
    if (scope.workspaceRole !== "owner") platformFailure("TRADERLINK_WORKSPACE_ACCESS_DENIED");
    return withPermanentDeleteTransaction(this.database, () => {
      const artifacts = readPrivateArtifacts(this.database, [scope.accountId]);
      const timestamp = createCanonicalUtcTimestamp();
      const erasedAccountIds = eraseAccountRows(this.database, scope);
      new JournalDemoAccountRepository(this.database).recordClearedLifecycle({
        clearedAtUtc: timestamp,
        clearedDemoAccountId: scope.accountId,
        userId: scope.userId,
        workspaceId: scope.workspaceId,
      });
      const remaining = this.database.prepare<[string], { count: number }>(`SELECT COUNT(*) AS count
FROM journal_accounts WHERE workspace_id = ? AND status = 'active'`).get(scope.workspaceId);
      if (remaining?.count !== 0) platformFailure("TRADERLINK_ACCOUNT_SELECTION_CONFLICT");
      const replacementAccount = new JournalAccountRepository(this.database).createAccount({
        accountId: createCanonicalUuidV4(),
        workspaceId: scope.workspaceId,
        displayName: "Primary Journal",
        baseCurrency: input.baseCurrency,
        tradingTimezone: input.tradingTimezone,
        status: "active",
        createdByUserId: scope.userId,
        createdAtUtc: timestamp,
        updatedAtUtc: timestamp,
      });
      const privateArtifactsPendingPurge = unsharedArtifacts(this.database, artifacts);
      if (privateArtifactsPendingPurge.length && !options.recordPrivateArtifactObligations) {
        platformFailure("TRADERLINK_ACCOUNT_ERASURE_FAILED");
      }
      options.recordPrivateArtifactObligations?.(privateArtifactsPendingPurge);
      return Object.freeze({ erasedAccountIds, privateArtifactsPendingPurge, replacementAccount });
    });
  }

  eraseTraderLinkAccount(
    scope: WorkspaceAccessScope,
    options: PlatformErasureOptions = {},
  ): PlatformErasureResult {
    assertCanonicalUuidV4(scope.userId, "erasureUserId");
    assertCanonicalUuidV4(scope.workspaceId, "erasureWorkspaceId");
    if (scope.workspaceRole !== "owner") platformFailure("TRADERLINK_WORKSPACE_ACCESS_DENIED");
    return withPermanentDeleteTransaction(this.database, () => {
      assertSoleWorkspaceOwner(this.database, scope);
      const accountIds = this.database.prepare<[string], { account_id: string }>(`SELECT account_id
FROM journal_accounts WHERE workspace_id = ?`).all(scope.workspaceId).map((row) => row.account_id);
      const artifacts = readPrivateArtifacts(this.database, accountIds);
      const closure = captureScopedRows(this.database, scope);
      try { closure.deleteRows(); } finally { closure.dispose(); }
      if (this.database.prepare("SELECT 1 FROM platform_users WHERE user_id=?").get(scope.userId)) {
        platformFailure("TRADERLINK_WORKSPACE_ACCESS_DENIED");
      }
      const privateArtifactsPendingPurge = unsharedArtifacts(this.database, artifacts);
      if (privateArtifactsPendingPurge.length && !options.recordPrivateArtifactObligations) {
        platformFailure("TRADERLINK_ACCOUNT_ERASURE_FAILED");
      }
      options.recordPrivateArtifactObligations?.(privateArtifactsPendingPurge);
      return Object.freeze({
        erasedAccountIds: Object.freeze(accountIds),
        privateArtifactsPendingPurge,
      });
    });
  }
}
