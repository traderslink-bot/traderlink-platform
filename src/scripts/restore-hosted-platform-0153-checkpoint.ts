import { closeSync, copyFileSync, existsSync, fsyncSync, openSync, readdirSync, readSync, realpathSync, renameSync, statSync, chmodSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import Database from "better-sqlite3";

const MIGRATION_ID = "0153_platform_watchlist_category_move_notifications";
const PREDECESSOR_ID = "0152_platform_watchlist_notification_update_context";
const EXPECTED_COUNT = 134;
const LIVE_PATH = "/data/traderlink-platform.sqlite";
const CHECKPOINT_ROOT = "/data/backups/migrations/0153_platform_watchlist_category_move_notifications";
const TARGET_TABLES = [
  "platform_watchlist_category_move_intents",
  "platform_watchlist_category_move_deliveries",
] as const;

type DatabaseEvidence = {
  migrationCount: number;
  targetApplied: boolean;
  predecessorApplied: boolean;
  targetTables: readonly string[];
  quickCheck: readonly string[];
  foreignKeyViolationCount: number;
};

function sha256(filePath: string): string {
  const descriptor = openSync(filePath, "r");
  const hash = createHash("sha256");
  const buffer = Buffer.allocUnsafe(4 * 1024 * 1024);
  try {
    while (true) {
      const bytesRead = readSync(descriptor, buffer, 0, buffer.length, null);
      if (bytesRead === 0) break;
      hash.update(buffer.subarray(0, bytesRead));
    }
  } finally {
    closeSync(descriptor);
  }
  return hash.digest("hex");
}

function inspectDatabase(filePath: string): DatabaseEvidence {
  const database = new Database(filePath, { readonly: true, fileMustExist: true });
  try {
    database.pragma("query_only = ON");
    const migrationCount = Number(
      (database.prepare("SELECT COUNT(*) AS count FROM platform_schema_migrations").get() as { count: number }).count,
    );
    const targetApplied = Boolean(database.prepare(
      "SELECT 1 FROM platform_schema_migrations WHERE migration_id = ? LIMIT 1",
    ).get(MIGRATION_ID));
    const predecessorApplied = Boolean(database.prepare(
      "SELECT 1 FROM platform_schema_migrations WHERE migration_id = ? LIMIT 1",
    ).get(PREDECESSOR_ID));
    const targetTables = TARGET_TABLES.filter((tableName) => Boolean(database.prepare(
      "SELECT 1 FROM sqlite_schema WHERE type = 'table' AND name = ? LIMIT 1",
    ).get(tableName)));
    const quickCheck = (database.pragma("quick_check") as Array<{ quick_check: string }>).map(
      (row) => row.quick_check,
    );
    const foreignKeyViolationCount = (database.pragma("foreign_key_check") as unknown[]).length;
    return { migrationCount, targetApplied, predecessorApplied, targetTables, quickCheck, foreignKeyViolationCount };
  } finally {
    database.close();
  }
}

function assertHealthyPreMigration(evidence: DatabaseEvidence, label: string): void {
  if (evidence.migrationCount !== EXPECTED_COUNT) throw new Error(label + " migration count mismatch");
  if (evidence.targetApplied) throw new Error(label + " unexpectedly contains target migration");
  if (!evidence.predecessorApplied) throw new Error(label + " lacks exact predecessor");
  if (evidence.targetTables.length !== 0) throw new Error(label + " contains target tables");
  if (evidence.quickCheck.length !== 1 || evidence.quickCheck[0] !== "ok") throw new Error(label + " quick_check failed");
  if (evidence.foreignKeyViolationCount !== 0) throw new Error(label + " foreign_key_check failed");
}

function moveIfPresent(source: string, destination: string): void {
  if (!existsSync(source)) return;
  if (existsSync(destination)) throw new Error("preservation destination already exists: " + destination);
  renameSync(source, destination);
}

function restoreMovedFile(source: string, destination: string): void {
  if (existsSync(source) && !existsSync(destination)) renameSync(source, destination);
}

function main(): void {
  const checkpointRoot = realpathSync(CHECKPOINT_ROOT);
  if (checkpointRoot !== CHECKPOINT_ROOT) throw new Error("checkpoint root identity mismatch");
  const checkpointDirectories = readdirSync(checkpointRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(checkpointRoot, entry.name));
  if (checkpointDirectories.length !== 1) throw new Error("expected exactly one 0153 checkpoint directory");

  const checkpointDirectory = realpathSync(checkpointDirectories[0]);
  if (path.dirname(checkpointDirectory) !== checkpointRoot) throw new Error("checkpoint escaped its recorded root");
  const backupPath = path.join(checkpointDirectory, "backup.sqlite");
  const restoreVerificationPath = path.join(checkpointDirectory, "restore-verification.sqlite");
  const failedLivePath = path.join(checkpointDirectory, "failed-live-after-0153.sqlite");
  const restoreTempPath = "/data/.traderlink-platform-0153-restore.tmp";

  for (const requiredPath of [backupPath, restoreVerificationPath, LIVE_PATH]) {
    const stat = statSync(requiredPath);
    if (!stat.isFile() || stat.size <= 0) throw new Error("required recovery file is invalid: " + requiredPath);
  }
  for (const unusedPath of [failedLivePath, failedLivePath + "-wal", failedLivePath + "-shm", restoreTempPath]) {
    if (existsSync(unusedPath)) throw new Error("recovery destination is not unused: " + unusedPath);
  }

  const backupSize = statSync(backupPath).size;
  const restoreVerificationSize = statSync(restoreVerificationPath).size;
  if (backupSize !== restoreVerificationSize) throw new Error("checkpoint copies have different sizes");
  const backupSha256 = sha256(backupPath);
  const restoreVerificationSha256 = sha256(restoreVerificationPath);
  if (backupSha256 !== restoreVerificationSha256) throw new Error("checkpoint copies have different hashes");

  const backupEvidence = inspectDatabase(backupPath);
  const restoreVerificationEvidence = inspectDatabase(restoreVerificationPath);
  assertHealthyPreMigration(backupEvidence, "backup");
  assertHealthyPreMigration(restoreVerificationEvidence, "restore verification");

  const liveEvidence = inspectDatabase(LIVE_PATH);
  if (liveEvidence.migrationCount !== EXPECTED_COUNT) throw new Error("live migration count is not the expected incomplete state");
  if (liveEvidence.targetApplied) throw new Error("live target migration is already registered");
  if (!liveEvidence.predecessorApplied) throw new Error("live database lacks the exact predecessor");
  if (liveEvidence.targetTables.length === 0) throw new Error("live database does not contain the partial 0153 schema");

  const originalMode = statSync(LIVE_PATH).mode;
  copyFileSync(backupPath, restoreTempPath);
  chmodSync(restoreTempPath, originalMode);
  const tempDescriptor = openSync(restoreTempPath, "r");
  fsyncSync(tempDescriptor);
  closeSync(tempDescriptor);
  if (statSync(restoreTempPath).size !== backupSize || sha256(restoreTempPath) !== backupSha256) {
    throw new Error("prepared restore copy does not match verified backup");
  }

  let liveMoved = false;
  try {
    moveIfPresent(LIVE_PATH + "-wal", failedLivePath + "-wal");
    moveIfPresent(LIVE_PATH + "-shm", failedLivePath + "-shm");
    renameSync(LIVE_PATH, failedLivePath);
    liveMoved = true;
    renameSync(restoreTempPath, LIVE_PATH);
    const restoredEvidence = inspectDatabase(LIVE_PATH);
    assertHealthyPreMigration(restoredEvidence, "restored live database");
    if (statSync(LIVE_PATH).size !== backupSize || sha256(LIVE_PATH) !== backupSha256) {
      throw new Error("restored live database does not match verified backup");
    }
    console.log(JSON.stringify({
      result: "hosted_platform_0153_checkpoint_restored",
      migrationId: MIGRATION_ID,
      checkpointDirectory,
      backupPath,
      backupSize,
      backupSha256,
      restoredLivePath: LIVE_PATH,
      preservedFailedLivePath: failedLivePath,
      preservedFailedLiveSize: statSync(failedLivePath).size,
      partialTablesPreserved: liveEvidence.targetTables,
      migrationCount: restoredEvidence.migrationCount,
    }));
  } catch (error) {
    if (liveMoved) {
      const invalidRestorePath = path.join(checkpointDirectory, "rejected-restored-live.sqlite");
      if (existsSync(LIVE_PATH) && !existsSync(invalidRestorePath)) renameSync(LIVE_PATH, invalidRestorePath);
      restoreMovedFile(failedLivePath, LIVE_PATH);
      restoreMovedFile(failedLivePath + "-wal", LIVE_PATH + "-wal");
      restoreMovedFile(failedLivePath + "-shm", LIVE_PATH + "-shm");
    }
    throw error;
  }
}

try {
  main();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(JSON.stringify({ result: "hosted_platform_0153_checkpoint_restore_failed", error: message }));
  process.exitCode = 1;
}
