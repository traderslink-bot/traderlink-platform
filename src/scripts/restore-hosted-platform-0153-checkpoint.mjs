import { chmodSync, closeSync, copyFileSync, existsSync, fsyncSync, openSync, readdirSync, readSync, realpathSync, renameSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";

const LIVE = "/data/traderlink-platform.sqlite";
const ROOT = "/data/backups/migrations/0153_platform_watchlist_category_move_notifications";
const TEMP = "/data/.traderlink-platform-0153-approved-restore.tmp";

function log(phase, details = {}) {
  console.log(JSON.stringify({ operation: "restore_0153_verified_checkpoint", phase, ...details }));
}

function hashFile(filePath) {
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

function moveIfPresent(source, destination) {
  if (!existsSync(source)) return;
  if (existsSync(destination)) throw new Error("preservation destination already exists: " + destination);
  renameSync(source, destination);
}

try {
  log("started");
  const root = realpathSync(ROOT);
  const checkpoints = readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(root, entry.name));
  if (checkpoints.length !== 1) throw new Error("expected exactly one 0153 checkpoint directory");
  const checkpoint = realpathSync(checkpoints[0]);
  if (path.dirname(checkpoint) !== root) throw new Error("checkpoint escaped recorded root");

  const backup = path.join(checkpoint, "backup.sqlite");
  const verifiedCopy = path.join(checkpoint, "restore-verification.sqlite");
  const failedLive = path.join(checkpoint, "failed-live-after-0153.sqlite");
  for (const filePath of [backup, verifiedCopy, LIVE]) {
    const stat = statSync(filePath);
    if (!stat.isFile() || stat.size <= 0) throw new Error("required file is invalid: " + filePath);
  }
  for (const destination of [TEMP, failedLive, failedLive + "-wal", failedLive + "-shm"]) {
    if (existsSync(destination)) throw new Error("recovery destination is not unused: " + destination);
  }

  const backupSize = statSync(backup).size;
  if (statSync(verifiedCopy).size !== backupSize) throw new Error("verified checkpoint copies differ in size");
  log("hashing_verified_checkpoint", { checkpoint, backupSize });
  const backupSha256 = hashFile(backup);
  const verifiedCopySha256 = hashFile(verifiedCopy);
  if (backupSha256 !== verifiedCopySha256) throw new Error("verified checkpoint copies differ in hash");

  log("preparing_restore_copy", { backupSha256 });
  const liveMode = statSync(LIVE).mode;
  copyFileSync(backup, TEMP);
  chmodSync(TEMP, liveMode);
  const descriptor = openSync(TEMP, "r");
  fsyncSync(descriptor);
  closeSync(descriptor);
  if (statSync(TEMP).size !== backupSize || hashFile(TEMP) !== backupSha256) {
    throw new Error("prepared restore copy does not match verified backup");
  }

  log("swapping_live_database");
  moveIfPresent(LIVE + "-wal", failedLive + "-wal");
  moveIfPresent(LIVE + "-shm", failedLive + "-shm");
  renameSync(LIVE, failedLive);
  try {
    renameSync(TEMP, LIVE);
  } catch (error) {
    renameSync(failedLive, LIVE);
    moveIfPresent(failedLive + "-wal", LIVE + "-wal");
    moveIfPresent(failedLive + "-shm", LIVE + "-shm");
    throw error;
  }

  if (statSync(LIVE).size !== backupSize || hashFile(LIVE) !== backupSha256) {
    throw new Error("restored live file does not match verified backup");
  }
  log("completed", {
    checkpoint,
    backup,
    backupSize,
    backupSha256,
    restoredLive: LIVE,
    preservedFailedLive: failedLive,
    preservedFailedLiveSize: statSync(failedLive).size,
  });
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(JSON.stringify({ operation: "restore_0153_verified_checkpoint", phase: "failed", error: message }));
  process.exitCode = 1;
}
