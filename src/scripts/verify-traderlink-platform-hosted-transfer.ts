import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { isAbsolute, join, resolve } from "node:path";

import {
  hostedTransferSha256,
  type HostedTransferModule,
} from "@/src/modules/platform/server/transfer/hosted-transfer-contract";
import type { HostedSourceSnapshots } from "@/src/modules/platform/server/transfer/hosted-source-snapshot-reader";
import { prepareHostedTransfer } from "@/src/modules/platform/server/transfer/hosted-transfer-preview-service";
import { executeHostedTransfer } from "@/src/modules/platform/server/transfer/hosted-transfer-service";
import {
  ACTIVE_TRADERLINK_PLATFORM_REPOSITORY_ROOT,
  isPathWithinRoot,
} from "@/src/modules/platform/server/database/platform-database-config";
import { createAndRestoreVerifyPlatformDatabaseBackup } from "@/src/modules/platform/server/database/platform-database-backup";
import { platformMigrationManifest } from "@/src/modules/platform/server/database/platform-migration-manifest";
import { platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";
import { openPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { verifyCompletedPlatformDatabase } from "@/src/modules/platform/server/database/run-platform-migrations";

import { initializeTraderLinkPlatformDatabase } from "./initialize-traderlink-platform-database";

const DISPOSABLE_ROOT_ENV = "TRADERLINK_HOSTED_TRANSFER_DISPOSABLE_ROOT";

function sha256File(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function requireDisposableRoot(): string {
  const configured = process.env[DISPOSABLE_ROOT_ENV];
  if (!configured || !isAbsolute(configured)) {
    platformFailure("TRADERLINK_HOSTED_TRANSFER_INVALID", {
      field: "disposableRoot",
    });
  }
  const root = resolve(configured);
  if (
    isPathWithinRoot(root, ACTIVE_TRADERLINK_PLATFORM_REPOSITORY_ROOT) ||
    existsSync(root)
  ) {
    platformFailure("TRADERLINK_HOSTED_TRANSFER_INVALID", {
      field: "disposableRootBoundary",
    });
  }
  mkdirSync(root, { recursive: false });
  return root;
}

function sourceSnapshots(): HostedSourceSnapshots {
  const authSubject = "900000000000000001";
  const timestamp = "2026-08-02T18:00:00.000Z";
  const academyBase = {
    users: Object.freeze([Object.freeze({
      authSubject,
      username: "transfer-test-user",
      globalDisplayName: "Transfer Test User",
    })]),
    completions: Object.freeze([Object.freeze({
      authSubject,
      lessonSlug: "/academy/basic-trading-terms-and-position-mechanics/",
      completedAtUtc: timestamp,
    })]),
  };
  const watchlistBase = {
    symbols: Object.freeze([Object.freeze({
      symbol: "TEST",
      status: "live",
      updated_at: 1_775_325_600_000,
      state_json: "{}",
      revision: 1,
    })]),
    health: Object.freeze([Object.freeze({
      key: "global",
      market_data_status: "closed",
      market_data_updated_at: 1_775_325_600_000,
    })]),
    archives: Object.freeze([]),
  };
  const articleId = "hosted_transfer_test_article";
  const contentSha256 = "a".repeat(64);
  const newsBase = {
    articles: Object.freeze([Object.freeze({
      id: articleId,
      source_event_id: "hosted-transfer-test-event",
      canonical_source_key: "TEST|https://example.invalid/transfer-test",
      ticker: "TEST",
      slug: "hosted-transfer-test-2026-08-02",
      headline: "Hosted transfer test",
      summary: null,
      article_text: null,
      source_url: "https://example.invalid/transfer-test",
      event_type: "test",
      route_tag: "default",
      published_at: timestamp,
      created_at: timestamp,
      updated_at: timestamp,
      metadata_json: "{}",
      positives_json: "[]",
      negatives_json: "[]",
      risk_flags_json: "[]",
      diagnostics_json: "{}",
      raw_payload_json: "{}",
      revision: 1,
      content_sha256: contentSha256,
    })]),
    versions: Object.freeze([Object.freeze({
      version_id: "b".repeat(64),
      article_id: articleId,
      revision: 1,
      source_event_id: "hosted-transfer-test-event",
      canonical_source_key: "TEST|https://example.invalid/transfer-test",
      ticker: "TEST",
      slug: "hosted-transfer-test-2026-08-02",
      headline: "Hosted transfer test",
      summary: null,
      article_text: null,
      source_url: "https://example.invalid/transfer-test",
      event_type: "test",
      route_tag: "default",
      published_at: timestamp,
      created_at: timestamp,
      changed_at: timestamp,
      metadata_json: "{}",
      positives_json: "[]",
      negatives_json: "[]",
      risk_flags_json: "[]",
      diagnostics_json: "{}",
      raw_payload_json: "{}",
      content_sha256: contentSha256,
      change_source: "legacy_hosted_transfer",
    })]),
  };
  const affiliateBase = {
    invites: Object.freeze([Object.freeze({
      invite_code: "transfer-test",
      affiliate_code: "transfer_test",
      affiliate_name: "Transfer Test",
      active: true,
      created_at_utc: timestamp,
      updated_at_utc: timestamp,
      metadata_json: "{}",
    })]),
    attributions: Object.freeze([Object.freeze({
      auth_subject: authSubject,
      affiliate_code: "transfer_test",
      invite_code: "transfer-test",
      joined_at_utc: null,
      first_seen_at_utc: timestamp,
      last_seen_at_utc: timestamp,
      source: "legacy_hosted_transfer",
      created_at_utc: timestamp,
      metadata_json: "{}",
    })]),
    pendingUnmappedRowCount: 0,
  };
  return Object.freeze({
    academy: Object.freeze({ ...academyBase, sha256: hostedTransferSha256(academyBase) }),
    watchlist: Object.freeze({ ...watchlistBase, sha256: hostedTransferSha256(watchlistBase) }),
    news: Object.freeze({ ...newsBase, sha256: hostedTransferSha256(newsBase) }),
    affiliate: Object.freeze({ ...affiliateBase, sha256: hostedTransferSha256(affiliateBase) }),
  });
}

function count(database: import("better-sqlite3").Database, table: string): number {
  if (!/^[a-z][a-z0-9_]*$/u.test(table)) {
    platformFailure("TRADERLINK_HOSTED_TRANSFER_VERIFICATION_FAILED");
  }
  return database.prepare<[], { count: number }>(`SELECT COUNT(*) AS count FROM ${table}`)
    .get()?.count ?? -1;
}

async function main(): Promise<void> {
  const root = requireDisposableRoot();
  const databasePath = join(root, "target.sqlite");
  const backupPath = join(root, "backup", "target.sqlite");
  const restorePath = join(root, "restore", "target.sqlite");
  initializeTraderLinkPlatformDatabase({ databasePath });
  const backupEvidence = await createAndRestoreVerifyPlatformDatabaseBackup({
    sourcePath: databasePath,
    backupPath,
    restoreVerificationPath: restorePath,
  });
  const sources = sourceSnapshots();
  const database = openPlatformDatabase({ mode: "runtime", databasePath });
  try {
    const prepared = prepareHostedTransfer(database, sources);
    if (prepared.preview.modules.some((module) =>
      module.counts.conflicts !== 0 || module.counts.pending !== 0)) {
      platformFailure("TRADERLINK_HOSTED_TRANSFER_VERIFICATION_FAILED", {
        check: "initialPreview",
      });
    }
    const sourceSnapshotSha256ByModule = Object.freeze(Object.fromEntries(
      prepared.preview.modules.map((module) => [module.module, module.sourceSnapshotSha256]),
    ) as Record<HostedTransferModule, string>);
    const completedByModule = Object.freeze(Object.fromEntries(
      prepared.preview.modules.map((module) => [module.module, backupEvidence.completedAtUtc]),
    ) as Record<HostedTransferModule, string>);
    const result = executeHostedTransfer({
      database,
      databasePath,
      prepared,
      authorization: Object.freeze({
        authorized: true as const,
        previewSha256: prepared.preview.previewSha256,
        targetDatabaseFileSha256: sha256File(databasePath),
        targetBackupPath: backupEvidence.backup.path,
        targetBackupSha256: backupEvidence.backup.fileSha256,
        targetRestorePath: backupEvidence.restored.path,
        targetRestoreSha256: backupEvidence.restored.fileSha256,
        targetBackupCompletedAtUtc: backupEvidence.completedAtUtc,
        sourceSnapshotSha256ByModule,
        sourceBackupCompletedAtUtcByModule: completedByModule,
      }),
      now: new Date(backupEvidence.completedAtUtc),
    });
    verifyCompletedPlatformDatabase(database);
    const rerun = prepareHostedTransfer(database, sources);
    if (rerun.preview.modules.some((module) =>
      module.counts.accepted !== 0 || module.counts.conflicts !== 0 ||
      module.counts.pending !== 0)) {
      platformFailure("TRADERLINK_HOSTED_TRANSFER_VERIFICATION_FAILED", {
        check: "idempotentPreview",
      });
    }
    const expectedCounts: Readonly<Record<string, number>> = Object.freeze({
      platform_users: 1,
      platform_workspaces: 1,
      platform_workspace_memberships: 1,
      journal_accounts: 1,
      platform_auth_identities: 1,
      platform_auth_sessions: 0,
      platform_discord_memberships: 0,
      academy_lesson_completion_events: 1,
      academy_lesson_completions: 1,
      live_watchlist_symbols: 1,
      live_watchlist_health: 1,
      news_articles: 1,
      news_article_versions: 1,
      affiliate_invites: 1,
      affiliate_attributions: 1,
      platform_hosted_transfer_events: 8,
    });
    for (const [table, expected] of Object.entries(expectedCounts)) {
      if (count(database, table) !== expected) {
        platformFailure("TRADERLINK_HOSTED_TRANSFER_VERIFICATION_FAILED", {
          check: "tableCount",
          table,
        });
      }
    }
    process.stdout.write(`${JSON.stringify({
      status: result.status,
      migrationCount: platformMigrationManifest.length,
      moduleCount: prepared.preview.modules.length,
      sourceRowCount: prepared.preview.modules.reduce(
        (sum, module) => sum + module.counts.source,
        0,
      ),
      reconciliationSha256: result.reconciliationSha256,
      idempotentSecondPreview: true,
      transferEventCount: expectedCounts.platform_hosted_transfer_events,
    })}\n`);
  } finally {
    database.close();
  }
}

void main();
