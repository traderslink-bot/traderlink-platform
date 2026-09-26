// One-use staging carrier. Never starts the application or any delivery worker.
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { constants, copyFileSync, existsSync, mkdtempSync, readFileSync, renameSync, statSync, statfsSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";
import Database from "better-sqlite3";
import { platformMigrationManifest } from "@/src/modules/platform/server/database/platform-migration-manifest";
import { readAppliedPlatformMigrations } from "@/src/modules/platform/server/database/platform-migration-registry";
import { runPlatformMigrations, verifyCompletedPlatformDatabase } from "@/src/modules/platform/server/database/run-platform-migrations";
import { createAndRestoreVerifyPlatformDatabaseBackup } from "@/src/modules/platform/server/database/platform-database-backup";
import { loadAccountIdentityConfiguration } from "@/src/modules/journal/server/accounts/journal-account-service";
import { ALL_JOURNAL_SOURCE_ACCOUNT_CANONICALIZERS, DEFAULT_JOURNAL_SOURCE_ACCOUNT_CANONICALIZATION_VERSION } from "@/src/modules/journal/server/accounts/journal-source-account-canonicalizers";

const prefix = platformMigrationManifest.slice(0, 126);
const expected = [
  "0121_news_market_halt_delivery_lifecycle", "0122_journal_demo_august_provenance_guard",
  "0132_journal_demo_v10_provenance_guard", "0133_platform_watchlist_daily_recaps",
  "0134_daily_trade_analyzer_trend_momentum_history", "0135_daily_trade_analyzer_manual_retry_requests",
  "0136_shared_trade_analyzer_owner_exemptions", "0137_platform_watchlist_publication_notifications",
  "0138_platform_watchlist_notification_action_identity", "0139_platform_premium_swing_idea_visit_events",
  "0140_news_market_halt_discord_deliveries", "0142_news_reverse_split_alerts",
  "0143_traderlink_communities_review_workflow",
];
assert.equal(platformMigrationManifest.length, 139);
assert.deepEqual(platformMigrationManifest.slice(126).map(m => m.migrationId), expected);
assert.deepEqual(platformMigrationManifest.slice(126).map(m => m.executionOrder), expected.map((_, i) => 144 + i));

function open(path: string) {
  const db = new Database(path, { fileMustExist: true });
  db.pragma("foreign_keys=ON");
  db.pragma("journal_mode=WAL");
  db.pragma("synchronous=NORMAL");
  db.pragma("busy_timeout=5000");
  return db;
}

function advance(path: string) {
  const db = open(path);
  try {
    verifyCompletedPlatformDatabase(db, prefix);
    for (let i = 126; i < platformMigrationManifest.length; i++) {
      const before = platformMigrationManifest.slice(0, i);
      verifyCompletedPlatformDatabase(db, before);
      const next = platformMigrationManifest.slice(0, i + 1);
      const result = runPlatformMigrations(db, { manifest: next });
      assert.deepEqual([...result.appliedMigrationIds], [expected[i - 126]]);
      verifyCompletedPlatformDatabase(db, next);
    }
    const result = verifyCompletedPlatformDatabase(db);
    db.pragma("wal_checkpoint(TRUNCATE)");
    return result.finalSchemaSha256;
  } finally { db.close(); }
}

async function main() {
  const rehearsal = process.argv[2] === "--rehearse";
  assert(rehearsal || process.argv[2] === "--apply");
  if (!rehearsal) {
    assert.equal(process.env.RAILWAY_PROJECT_ID, "49fc9197-07c9-45c7-b528-57d0393c2cca");
    assert.equal(process.env.RAILWAY_ENVIRONMENT_ID, "9e079dd4-f3f3-4872-9b00-adbd3000c485");
    assert.equal(process.env.RAILWAY_SERVICE_ID, "4d264aca-510c-4f5e-bc28-e89e526b8008");
    assert.equal(process.env.TRADERLINK_PLATFORM_DB_PATH, "/data/traderlink-platform.sqlite");
  }
  const root = rehearsal ? mkdtempSync(join(tmpdir(), "coaching-staging-")) : "/data";
  const sourcePath = join(root, "traderlink-platform.sqlite");
  if (rehearsal) {
    const db = new Database(sourcePath);
    db.pragma("foreign_keys=ON"); db.pragma("journal_mode=WAL"); db.pragma("synchronous=NORMAL");
    runPlatformMigrations(db, { manifest: prefix }); db.close();
  }
  const preflight = open(sourcePath);
  const count = readAppliedPlatformMigrations(preflight).length;
  try {
    assert(count === 126 || count === 139, "Unexpected or partially advanced staging registry; do not retry blindly");
    verifyCompletedPlatformDatabase(preflight, count === 126 ? prefix : platformMigrationManifest);
    preflight.pragma("wal_checkpoint(TRUNCATE)");
  } finally { preflight.close(); }
  if (count === 126) {
    const disk = statfsSync(root);
    assert(disk.bavail * disk.bsize > statSync(sourcePath).size * 4 + 1024 ** 3, "Insufficient backup/rehearsal headroom");
    const checkpoint = join(root, "coaching-staging-checkpoints", new Date().toISOString().replaceAll(/[-:.]/g, ""));
    const backupPath = join(checkpoint, "backup.sqlite");
    const restoreVerificationPath = join(checkpoint, "restore-verification.sqlite");
    const evidence = await createAndRestoreVerifyPlatformDatabaseBackup({
      sourcePath, backupPath, restoreVerificationPath, verificationManifest: prefix,
      verifyRecoveryAuthority(requirements) {
        const identity = loadAccountIdentityConfiguration(process.env, ALL_JOURNAL_SOURCE_ACCOUNT_CANONICALIZERS, DEFAULT_JOURNAL_SOURCE_ACCOUNT_CANONICALIZATION_VERSION);
        assert(requirements.hmacKeyVersions.every(v => v in identity.keysBase64));
        assert(requirements.sourceAccountCanonicalizationVersions.every(v => v in ALL_JOURNAL_SOURCE_ACCOUNT_CANONICALIZERS));
        return { verified: true, ...requirements };
      },
    });
    writeFileSync(join(checkpoint, "backup-evidence.json"), JSON.stringify(evidence));
    // Prove the entire exact batch on the real restored snapshot before any live migration.
    const rehearsalDigest = advance(restoreVerificationPath);
    writeFileSync(join(checkpoint, "rehearsal.json"), JSON.stringify({ migrationCount: 139, schema: rehearsalDigest }));
    console.log(JSON.stringify({ stage: "backup_restore_and_rehearsal_verified", checkpoint, backupSha256: evidence.backup.fileSha256, restoredSha256: evidence.restored.fileSha256, schema: rehearsalDigest }));
    let liveDigest: string;
    try {
      liveDigest = advance(sourcePath);
    } catch (error) {
      // The carrier has never served application traffic. Restore only this
      // window's verified backup, retaining the failed database for diagnosis.
      assert.equal(createHash("sha256").update(readFileSync(backupPath)).digest("hex"), evidence.backup.fileSha256);
      const recoveryPath = join(checkpoint, "recovery.sqlite");
      copyFileSync(backupPath, recoveryPath, constants.COPYFILE_EXCL);
      const recovery = open(recoveryPath);
      try { verifyCompletedPlatformDatabase(recovery, prefix); recovery.pragma("wal_checkpoint(TRUNCATE)"); }
      finally { recovery.close(); }
      const failedPath = join(checkpoint, "failed.sqlite");
      assert(!existsSync(failedPath));
      for (const suffix of ["-wal", "-shm"]) {
        if (existsSync(sourcePath + suffix)) renameSync(sourcePath + suffix, failedPath + suffix);
      }
      renameSync(sourcePath, failedPath);
      renameSync(recoveryPath, sourcePath);
      writeFileSync(join(checkpoint, "restored-after-failure.json"), JSON.stringify({ restoredPrefix: 126, backupSha256: evidence.backup.fileSha256 }));
      throw error;
    }
    assert.equal(liveDigest, rehearsalDigest);
    writeFileSync(join(checkpoint, "completed.json"), JSON.stringify({ migrationCount: 139, schema: liveDigest, migrations: expected }));
    assert(!existsSync(sourcePath + "-wal") || statSync(sourcePath + "-wal").size === 0);
    console.log(JSON.stringify({ stage: "staging_migrations_verified", migrationCount: 139, checkpoint, schema: liveDigest }));
  }
  if (!rehearsal) {
    // Maintenance health only. No Next server, application writes or notification sends.
    createServer((request, response) => {
      response.setHeader("Content-Type", "application/json");
      response.statusCode = request.url === "/api/platform/health" ? 200 : 503;
      response.end(JSON.stringify({ status: "maintenance_ready", migrationCount: 139 }));
    }).listen(Number(process.env.PORT || 3000), "0.0.0.0");
  }
}
main().catch(error => {
  console.error(JSON.stringify({ stage: "staging_maintenance_failed", message: error instanceof Error ? error.message : "Unknown error", details: error?.details }));
  process.exitCode = 1;
});
