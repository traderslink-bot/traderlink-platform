import { createHash } from "node:crypto";
import {
  existsSync,
  readFileSync,
  statSync,
} from "node:fs";
import { isAbsolute, resolve } from "node:path";

import type Database from "better-sqlite3";

import { AcademyProgressRepository } from "@/src/modules/academy/server/progress/academy-progress-repository";
import { JournalAccountRepository } from "@/src/modules/journal/server/accounts/journal-account-repository";

import { PlatformAuthenticationRepository } from "../authentication/platform-authentication-repository";
import { PlatformUserRepository } from "../identity/platform-user-repository";
import { PlatformWorkspaceRepository } from "../identity/platform-workspace-repository";
import {
  createCanonicalUtcTimestamp,
  createCanonicalUuidV4,
  platformFailure,
} from "../database/platform-migration-contract";
import type {
  HostedTransferModule,
  HostedTransferPreview,
} from "./hosted-transfer-contract";
import { HostedTransferEventRepository } from "./hosted-transfer-event-repository";
import {
  prepareHostedTransfer,
  type PreparedHostedTransfer,
} from "./hosted-transfer-preview-service";

export type HostedTransferExecutionAuthorization = Readonly<{
  authorized: true;
  previewSha256: string;
  targetDatabaseFileSha256: string;
  targetBackupPath: string;
  targetBackupSha256: string;
  targetRestorePath: string;
  targetRestoreSha256: string;
  targetBackupCompletedAtUtc: string;
  sourceSnapshotSha256ByModule: Readonly<Record<HostedTransferModule, string>>;
  sourceBackupCompletedAtUtcByModule: Readonly<Record<HostedTransferModule, string>>;
}>;

export type HostedTransferExecutionResult = Readonly<{
  status: "executed_and_reconciled";
  previewSha256: string;
  reconciliationSha256: string;
}>;

function sha256File(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function requireEvidenceFile(path: string, expectedSha256: string): string {
  if (!isAbsolute(path) || !existsSync(path) || !statSync(path).isFile()) {
    platformFailure("TRADERLINK_HOSTED_TRANSFER_AUTHORIZATION_REQUIRED", {
      check: "backup_evidence_file",
    });
  }
  const absolute = resolve(path);
  if (sha256File(absolute) !== expectedSha256) {
    platformFailure("TRADERLINK_HOSTED_TRANSFER_AUTHORIZATION_REQUIRED", {
      check: "backup_evidence_digest",
    });
  }
  return absolute;
}

function requireAuthorization(input: Readonly<{
  authorization: HostedTransferExecutionAuthorization;
  prepared: PreparedHostedTransfer;
  databasePath: string;
  now: Date;
}>): void {
  const { authorization, prepared } = input;
  if (
    authorization.authorized !== true ||
    authorization.previewSha256 !== prepared.preview.previewSha256 ||
    sha256File(input.databasePath) !== authorization.targetDatabaseFileSha256
  ) {
    platformFailure("TRADERLINK_HOSTED_TRANSFER_AUTHORIZATION_REQUIRED", {
      check: "target_and_preview",
    });
  }
  const completedAt = Date.parse(authorization.targetBackupCompletedAtUtc);
  const ageMs = input.now.getTime() - completedAt;
  if (!Number.isFinite(completedAt) || ageMs < -60_000 || ageMs > 15 * 60_000) {
    platformFailure("TRADERLINK_HOSTED_TRANSFER_AUTHORIZATION_REQUIRED", {
      check: "fresh_target_backup",
    });
  }
  const backupPath = requireEvidenceFile(
    authorization.targetBackupPath,
    authorization.targetBackupSha256,
  );
  const restorePath = requireEvidenceFile(
    authorization.targetRestorePath,
    authorization.targetRestoreSha256,
  );
  if (
    backupPath === restorePath ||
    resolve(input.databasePath) === backupPath ||
    resolve(input.databasePath) === restorePath ||
    authorization.targetBackupSha256 !== authorization.targetRestoreSha256
  ) {
    platformFailure("TRADERLINK_HOSTED_TRANSFER_AUTHORIZATION_REQUIRED", {
      check: "independent_restore",
    });
  }
  const walPath = `${input.databasePath}-wal`;
  if (existsSync(walPath) && statSync(walPath).size !== 0) {
    platformFailure("TRADERLINK_HOSTED_TRANSFER_AUTHORIZATION_REQUIRED", {
      check: "target_wal_not_empty",
    });
  }
  for (const modulePreview of prepared.preview.modules) {
    const sourceBackupCompletedAt = Date.parse(
      authorization.sourceBackupCompletedAtUtcByModule[modulePreview.module],
    );
    const sourceBackupAgeMs = input.now.getTime() - sourceBackupCompletedAt;
    if (
      authorization.sourceSnapshotSha256ByModule[modulePreview.module] !==
        modulePreview.sourceSnapshotSha256 ||
      !Number.isFinite(sourceBackupCompletedAt) ||
      sourceBackupAgeMs < -60_000 ||
      sourceBackupAgeMs > 24 * 60 * 60_000 ||
      modulePreview.counts.conflicts !== 0 ||
      (modulePreview.module !== "affiliate" && modulePreview.counts.pending !== 0)
    ) {
      platformFailure("TRADERLINK_HOSTED_TRANSFER_AUTHORIZATION_REQUIRED", {
        check: "module_preview",
        module: modulePreview.module,
      });
    }
  }
}

function displayName(user: Readonly<{
  username: string;
  globalDisplayName: string | null;
}>): string {
  const value = (user.globalDisplayName ?? user.username).normalize("NFKC").trim();
  if (!value || value.length > 120 || /[\u0000-\u001f\u007f]/u.test(value)) {
    platformFailure("TRADERLINK_HOSTED_TRANSFER_INVALID", {
      field: "academyDisplayName",
    });
  }
  return value;
}

function executeAcademy(
  database: Database.Database,
  prepared: PreparedHostedTransfer,
  timestamp: string,
): void {
  const users = new PlatformUserRepository(database, { allowedAuthProviders: ["discord"] });
  const identities = new PlatformAuthenticationRepository(database);
  const workspaces = new PlatformWorkspaceRepository(database);
  const accounts = new JournalAccountRepository(database);
  const progress = new AcademyProgressRepository(database);
  const sourceUsers = new Map(
    prepared.sources.academy.users.map((user) => [user.authSubject, user]),
  );

  for (const authSubject of prepared.academy.provisionSubjects) {
    if (identities.findActiveIdentity("discord", authSubject)) continue;
    const source = sourceUsers.get(authSubject);
    if (!source) platformFailure("TRADERLINK_HOSTED_TRANSFER_CONFLICT");
    const userId = createCanonicalUuidV4();
    const workspaceId = createCanonicalUuidV4();
    const accountId = createCanonicalUuidV4();
    users.createUser({
      userId,
      authProvider: "discord",
      authSubject,
      displayName: displayName(source),
      createdAtUtc: timestamp,
      updatedAtUtc: timestamp,
    });
    identities.linkIdentity({
      userId,
      authProvider: "discord",
      authSubject,
      linkedByUserId: userId,
      timestamp,
    });
    workspaces.insertWorkspaceWithOwnerInCurrentTransaction({
      workspaceId,
      ownerUserId: userId,
      displayName: "My Workspace",
      defaultTradingTimezone: "America/New_York",
      createdAtUtc: timestamp,
    });
    accounts.createAccount({
      accountId,
      workspaceId,
      displayName: "Primary Journal",
      baseCurrency: "USD",
      tradingTimezone: "America/New_York",
      status: "active",
      createdByUserId: userId,
      createdAtUtc: timestamp,
      updatedAtUtc: timestamp,
    });
  }

  for (const completion of prepared.academy.completions) {
    const identity = identities.findActiveIdentity("discord", completion.authSubject);
    if (!identity) platformFailure("TRADERLINK_HOSTED_TRANSFER_CONFLICT");
    const current = database.prepare<[string, string], { completed_at_utc: string }>(`SELECT completed_at_utc
FROM academy_lesson_completions WHERE user_id = ? AND lesson_slug = ?`)
      .get(identity.userId, completion.lessonSlug);
    if (current) {
      if (current.completed_at_utc !== completion.completedAtUtc) {
        platformFailure("TRADERLINK_HOSTED_TRANSFER_CONFLICT");
      }
      continue;
    }
    progress.setCompleted({
      actor: { userId: identity.userId, sourceKind: "legacy_import" },
      lessonSlug: completion.lessonSlug,
      completed: true,
      eventId: createCanonicalUuidV4(),
      timestamp: completion.completedAtUtc,
    });
  }
}

function insertRows(
  database: Database.Database,
  input: Readonly<{
    table: string;
    key: string;
    columns: readonly string[];
    rows: readonly Record<string, unknown>[];
  }>,
): void {
  if (
    !/^[a-z][a-z0-9_]*$/u.test(input.table) ||
    !/^[a-z][a-z0-9_]*$/u.test(input.key) ||
    input.columns.some((column) => !/^[a-z][a-z0-9_]*$/u.test(column))
  ) {
    platformFailure("TRADERLINK_HOSTED_TRANSFER_INVALID");
  }
  const select = database.prepare(`SELECT ${input.columns.join(", ")} FROM ${input.table} WHERE ${input.key} = ?`);
  const insert = database.prepare(`INSERT INTO ${input.table} (${input.columns.join(", ")})
VALUES (${input.columns.map(() => "?").join(", ")})`);
  for (const row of input.rows) {
    const keyValue = row[input.key];
    const current = select.get(keyValue) as Record<string, unknown> | undefined;
    if (current) continue;
    insert.run(...input.columns.map((column) => {
      const value = row[column];
      return column === "active" ? (value ? 1 : 0) : value;
    }));
  }
}

function executeWatchlist(database: Database.Database, prepared: PreparedHostedTransfer): void {
  insertRows(database, {
    table: "live_watchlist_symbols", key: "symbol",
    columns: ["symbol", "status", "updated_at", "state_json", "revision"],
    rows: prepared.sources.watchlist.symbols,
  });
  insertRows(database, {
    table: "live_watchlist_health", key: "key",
    columns: ["key", "market_data_status", "market_data_updated_at"],
    rows: prepared.sources.watchlist.health,
  });
  insertRows(database, {
    table: "live_watchlist_archives", key: "archive_id",
    columns: ["archive_id", "symbol", "archived_at", "first_posted_at", "last_active_updated_at", "state_json"],
    rows: prepared.sources.watchlist.archives,
  });
}

function executeNews(database: Database.Database, prepared: PreparedHostedTransfer): void {
  if (prepared.sources.news.articles.length > 0) {
    insertRows(database, {
      table: "news_articles", key: "id",
      columns: Object.keys(prepared.sources.news.articles[0] as Record<string, unknown>),
      rows: prepared.sources.news.articles,
    });
  }
  if (prepared.sources.news.versions.length > 0) {
    insertRows(database, {
      table: "news_article_versions", key: "version_id",
      columns: Object.keys(prepared.sources.news.versions[0] as Record<string, unknown>),
      rows: prepared.sources.news.versions,
    });
  }
}

function executeAffiliate(database: Database.Database, prepared: PreparedHostedTransfer): void {
  insertRows(database, {
    table: "affiliate_invites", key: "invite_code",
    columns: ["invite_code", "affiliate_code", "affiliate_name", "active", "created_at_utc", "updated_at_utc", "metadata_json"],
    rows: prepared.sources.affiliate.invites,
  });
  const identities = new PlatformAuthenticationRepository(database);
  for (const row of prepared.sources.affiliate.attributions) {
    const identity = identities.findActiveIdentity("discord", String(row.auth_subject));
    if (!identity) continue;
    const current = database.prepare("SELECT 1 FROM affiliate_attributions WHERE user_id = ?")
      .get(identity.userId);
    if (current) continue;
    database.prepare(`INSERT INTO affiliate_attributions (
  user_id, affiliate_code, invite_code, joined_at_utc, first_seen_at_utc,
  last_seen_at_utc, source, created_at_utc, metadata_json
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(
        identity.userId,
        row.affiliate_code,
        row.invite_code,
        row.joined_at_utc,
        row.first_seen_at_utc,
        row.last_seen_at_utc,
        row.source,
        row.created_at_utc,
        row.metadata_json,
      );
  }
}

function executeModule(
  database: Database.Database,
  module: HostedTransferModule,
  prepared: PreparedHostedTransfer,
  transferRunId: string,
  timestamp: string,
): void {
  const preview = prepared.preview.modules.find((candidate) => candidate.module === module);
  if (!preview) platformFailure("TRADERLINK_HOSTED_TRANSFER_INVALID");
  const operation = database.transaction(() => {
    if (module === "academy") executeAcademy(database, prepared, timestamp);
    else if (module === "watchlist") executeWatchlist(database, prepared);
    else if (module === "news") executeNews(database, prepared);
    else executeAffiliate(database, prepared);
    new HostedTransferEventRepository(database).insert({
      transferEventId: createCanonicalUuidV4(),
      transferRunId,
      module,
      eventKind: "executed",
      previewSha256: preview.previewSha256,
      sourceSnapshotSha256: preview.sourceSnapshotSha256,
      reconciliationSha256: null,
      counts: preview.counts,
      createdAtUtc: timestamp,
    });
  });
  operation.immediate();
}

function recordReconciliation(
  database: Database.Database,
  original: HostedTransferPreview,
  reconciled: HostedTransferPreview,
  transferRunId: string,
  timestamp: string,
): void {
  for (const originalModule of original.modules) {
    const finalModule = reconciled.modules.find(
      (candidate) => candidate.module === originalModule.module,
    );
    if (
      !finalModule ||
      finalModule.counts.accepted !== 0 ||
      finalModule.counts.conflicts !== 0 ||
      finalModule.counts.pending !== originalModule.counts.pending
    ) {
      platformFailure("TRADERLINK_HOSTED_TRANSFER_VERIFICATION_FAILED", {
        module: originalModule.module,
      });
    }
    database.transaction(() => {
      new HostedTransferEventRepository(database).insert({
        transferEventId: createCanonicalUuidV4(),
        transferRunId,
        module: originalModule.module,
        eventKind: "reconciled",
        previewSha256: originalModule.previewSha256,
        sourceSnapshotSha256: originalModule.sourceSnapshotSha256,
        reconciliationSha256: reconciled.previewSha256,
        counts: finalModule.counts,
        createdAtUtc: timestamp,
      });
    }).immediate();
  }
}

export function executeHostedTransfer(input: Readonly<{
  database: Database.Database;
  databasePath: string;
  prepared: PreparedHostedTransfer;
  authorization: HostedTransferExecutionAuthorization;
  protectedInitialOwnerAuthSubject?: string;
  now?: Date;
}>): HostedTransferExecutionResult {
  const now = input.now ?? new Date();
  requireAuthorization({
    authorization: input.authorization,
    prepared: input.prepared,
    databasePath: input.databasePath,
    now,
  });
  const transferRunId = createCanonicalUuidV4();
  const timestamp = createCanonicalUtcTimestamp(now);
  for (const moduleName of ["academy", "watchlist", "news", "affiliate"] as const) {
    executeModule(input.database, moduleName, input.prepared, transferRunId, timestamp);
  }
  const reconciled = prepareHostedTransfer(
    input.database,
    input.prepared.sources,
    { protectedInitialOwnerAuthSubject: input.protectedInitialOwnerAuthSubject },
  ).preview;
  recordReconciliation(
    input.database,
    input.prepared.preview,
    reconciled,
    transferRunId,
    timestamp,
  );
  return Object.freeze({
    status: "executed_and_reconciled" as const,
    previewSha256: input.prepared.preview.previewSha256,
    reconciliationSha256: reconciled.previewSha256,
  });
}
