import { createHash } from "node:crypto";
import {
  createReadStream,
  existsSync,
  lstatSync,
  readlinkSync,
  readdirSync,
  realpathSync,
  rmdirSync,
  statfsSync,
  statSync,
  unlinkSync,
} from "node:fs";
import { dirname, isAbsolute, join, normalize, relative, resolve } from "node:path";

import Database from "better-sqlite3";

const CONFIRMATION = "cleanup-reviewed-watchlist-checkpoints";
const LIVE_DATABASE_PATH = "/data/traderlink-platform.sqlite";
const EXPECTED_LIVE_MIGRATION_COUNT = 137;
const EXPECTED_LIVE_LAST_MIGRATION = "0155_platform_watchlist_premium_access_controls";
const EXPECTED_LIVE_LAST_EXECUTION_ORDER = 155;

const checkpoints = Object.freeze([
  Object.freeze({
    id: "0154-success-20261005T040028674Z",
    relativeRoot: "migrations/0154_platform_premium_swing_plan_authorship/20261005T040028674Z",
    expectedMigrationCount: 135,
    expectedLastMigration: "0153_platform_watchlist_category_move_notifications",
    expectedLastExecutionOrder: 153,
    requireVerifiedRestore: true,
  }),
  Object.freeze({
    id: "0155-timeout-before-migration-20261005T042514842Z",
    relativeRoot: "migrations/0155_platform_watchlist_premium_access_controls/20261005T042514842Z",
    expectedMigrationCount: 136,
    expectedLastMigration: "0154_platform_premium_swing_plan_authorship",
    expectedLastExecutionOrder: 154,
    requireVerifiedRestore: false,
  }),
  Object.freeze({
    id: "0155-success-20261005T043408896Z",
    relativeRoot: "migrations/0155_platform_watchlist_premium_access_controls/20261005T043408896Z",
    expectedMigrationCount: 136,
    expectedLastMigration: "0154_platform_premium_swing_plan_authorship",
    expectedLastExecutionOrder: 154,
    requireVerifiedRestore: true,
  }),
]);

const allowedNames = new Set([
  "backup.sqlite",
  "backup.sqlite-shm",
  "backup.sqlite-wal",
  "restore-verification.sqlite",
  "restore-verification.sqlite-shm",
  "restore-verification.sqlite-wal",
]);

function fail(message, details = {}) {
  throw new Error(`${message} ${JSON.stringify(details)}`);
}

function requireContainedPath(root, candidate) {
  const rootResolved = resolve(root);
  const candidateResolved = resolve(candidate);
  const offset = relative(rootResolved, candidateResolved);
  if (offset === "" || offset.startsWith("..") || isAbsolute(offset)) {
    fail("Checkpoint path escapes or equals the backup root.", { root: rootResolved, candidate: candidateResolved });
  }
  return candidateResolved;
}

function freeBytes(path) {
  const stats = statfsSync(path);
  return Number(stats.bavail) * Number(stats.bsize);
}

async function sha256(path) {
  return await new Promise((resolveHash, rejectHash) => {
    const hash = createHash("sha256");
    const stream = createReadStream(path);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("error", rejectHash);
    stream.on("end", () => resolveHash(hash.digest("hex")));
  });
}

function verifyDatabase(path, expectedMigrationCount, expectedLastMigration, expectedLastExecutionOrder) {
  const database = new Database(path, { readonly: true, fileMustExist: true });
  try {
    database.pragma("query_only = ON");
    database.pragma("busy_timeout = 5000");
    const rows = database.prepare(`SELECT migration_id, execution_order
FROM platform_schema_migrations
ORDER BY execution_order`).all();
    const last = rows.at(-1);
    if (
      rows.length !== expectedMigrationCount ||
      last?.migration_id !== expectedLastMigration ||
      last?.execution_order !== expectedLastExecutionOrder
    ) {
      fail("Database evidence did not match the recorded checkpoint.", {
        path,
        migrationCount: rows.length,
        lastMigration: last?.migration_id,
        lastExecutionOrder: last?.execution_order,
        expectedMigrationCount,
        expectedLastMigration,
        expectedLastExecutionOrder,
      });
    }
    return Object.freeze({
      migrationRegistryCheck: "ok",
      migrationCount: rows.length,
      lastMigration: last.migration_id,
      lastExecutionOrder: last.execution_order,
    });
  } finally {
    database.close();
  }
}

function scanOpenFileDescriptors(targets) {
  const normalizedTargets = new Set(targets.map((target) => normalize(resolve(target))));
  const matches = [];
  for (const processEntry of readdirSync("/proc", { withFileTypes: true })) {
    if (!processEntry.isDirectory() || !/^\d+$/u.test(processEntry.name)) continue;
    const fdRoot = join("/proc", processEntry.name, "fd");
    let fdEntries;
    try {
      fdEntries = readdirSync(fdRoot);
    } catch {
      continue;
    }
    for (const fd of fdEntries) {
      const fdPath = join(fdRoot, fd);
      let link;
      try {
        link = readlinkSync(fdPath).replace(/ \(deleted\)$/u, "");
      } catch {
        continue;
      }
      const absoluteLink = isAbsolute(link) ? link : resolve(dirname(fdPath), link);
      if (normalizedTargets.has(normalize(absoluteLink))) matches.push({ pid: Number(processEntry.name), fd, target: absoluteLink });
    }
  }
  return matches;
}

async function inspectCheckpoint(backupRoot, checkpoint) {
  const root = requireContainedPath(backupRoot, join(backupRoot, checkpoint.relativeRoot));
  if (!existsSync(root) || !lstatSync(root).isDirectory()) {
    const parent = dirname(root);
    const available = existsSync(parent) ? readdirSync(parent).sort() : [];
    fail("Recorded checkpoint directory is missing.", { checkpointId: checkpoint.id, root, available });
  }
  const names = readdirSync(root).sort();
  const unexpected = names.filter((name) => !allowedNames.has(name));
  if (unexpected.length > 0) fail("Recorded checkpoint contains unexpected files.", { checkpointId: checkpoint.id, root, unexpected });

  const backupPath = join(root, "backup.sqlite");
  const restorePath = join(root, "restore-verification.sqlite");
  if (!existsSync(backupPath) || !lstatSync(backupPath).isFile()) fail("Recorded checkpoint backup is missing.", { checkpointId: checkpoint.id, backupPath });
  const backupVerification = verifyDatabase(
    backupPath,
    checkpoint.expectedMigrationCount,
    checkpoint.expectedLastMigration,
    checkpoint.expectedLastExecutionOrder,
  );
  const backupSizeBytes = statSync(backupPath).size;
  const backupSha256 = await sha256(backupPath);

  let restore = Object.freeze({ present: false });
  if (existsSync(restorePath)) {
    const restoreSizeBytes = statSync(restorePath).size;
    const restoreSha256 = await sha256(restorePath);
    let verification;
    let verificationError = null;
    try {
      verification = verifyDatabase(
        restorePath,
        checkpoint.expectedMigrationCount,
        checkpoint.expectedLastMigration,
        checkpoint.expectedLastExecutionOrder,
      );
    } catch (error) {
      verificationError = error instanceof Error ? error.message : String(error);
    }
    const exactIdentity = verificationError === null && restoreSizeBytes === backupSizeBytes && restoreSha256 === backupSha256;
    if (checkpoint.requireVerifiedRestore && !exactIdentity) {
      fail("Successful checkpoint restore copy no longer matches its backup.", {
        checkpointId: checkpoint.id,
        restorePath,
        restoreSizeBytes,
        restoreSha256,
        backupSizeBytes,
        backupSha256,
        verificationError,
      });
    }
    restore = Object.freeze({ present: true, path: restorePath, sizeBytes: restoreSizeBytes, sha256: restoreSha256, exactIdentity, verification: verification ?? null, verificationError });
  } else if (checkpoint.requireVerifiedRestore) {
    fail("Successful checkpoint restore copy is missing.", { checkpointId: checkpoint.id, restorePath });
  }

  const sidecars = names.filter((name) => name.endsWith("-wal") || name.endsWith("-shm"));
  const nonemptySidecars = sidecars
    .map((name) => ({ path: join(root, name), sizeBytes: statSync(join(root, name)).size }))
    .filter((entry) => entry.sizeBytes !== 0);
  if (nonemptySidecars.length > 0) fail("Checkpoint has nonempty SQLite sidecars; preserving it for review.", { checkpointId: checkpoint.id, nonemptySidecars });

  return Object.freeze({
    checkpoint,
    root,
    names,
    backup: Object.freeze({ path: backupPath, sizeBytes: backupSizeBytes, sha256: backupSha256, verification: backupVerification }),
    restore,
    sidecars,
  });
}

function removeCheckpoint(evidence) {
  const files = evidence.names.map((name) => join(evidence.root, name));
  const openDescriptors = scanOpenFileDescriptors(files);
  if (openDescriptors.length > 0) fail("Checkpoint files still have open file descriptors.", { checkpointId: evidence.checkpoint.id, openDescriptors });
  let recoveredBytes = 0;
  for (const file of files) {
    const stats = lstatSync(file);
    if (!stats.isFile()) fail("Cleanup target is not a regular file.", { checkpointId: evidence.checkpoint.id, file });
    recoveredBytes += stats.size;
  }
  for (const file of files) unlinkSync(file);
  if (readdirSync(evidence.root).length !== 0) fail("Checkpoint directory was not empty after exact file removal.", { checkpointId: evidence.checkpoint.id, root: evidence.root });
  rmdirSync(evidence.root);
  const migrationRoot = dirname(evidence.root);
  if (readdirSync(migrationRoot).length === 0) rmdirSync(migrationRoot);
  return Object.freeze({ checkpointId: evidence.checkpoint.id, root: evidence.root, deletedFiles: files, recoveredBytes });
}

async function main() {
  if (process.env.TRADERLINK_PLATFORM_CHECKPOINT_CLEANUP_CONFIRM !== CONFIRMATION) fail("Exact checkpoint-cleanup confirmation is absent.");
  const backupRoot = resolve(process.env.TRADERLINK_PLATFORM_HOSTED_BACKUP_ROOT ?? "/data/backups");
  if (backupRoot !== "/data/backups") fail("Unexpected hosted backup root.", { backupRoot });
  const livePath = realpathSync(LIVE_DATABASE_PATH);
  if (livePath !== LIVE_DATABASE_PATH || !lstatSync(livePath).isFile()) fail("Live database identity is unexpected.", { livePath });
  const liveVerification = verifyDatabase(
    livePath,
    EXPECTED_LIVE_MIGRATION_COUNT,
    EXPECTED_LIVE_LAST_MIGRATION,
    EXPECTED_LIVE_LAST_EXECUTION_ORDER,
  );
  const freeBytesBefore = freeBytes("/data");

  const evidence = [];
  for (const checkpoint of checkpoints) evidence.push(await inspectCheckpoint(backupRoot, checkpoint));
  const removal = evidence.map(removeCheckpoint);
  for (const item of removal) if (existsSync(item.root)) fail("Checkpoint root still exists after cleanup.", item);
  if (!existsSync(livePath)) fail("Live database disappeared during cleanup.");
  const liveVerificationAfter = verifyDatabase(
    livePath,
    EXPECTED_LIVE_MIGRATION_COUNT,
    EXPECTED_LIVE_LAST_MIGRATION,
    EXPECTED_LIVE_LAST_EXECUTION_ORDER,
  );
  const freeBytesAfter = freeBytes("/data");

  process.stdout.write(`${JSON.stringify({
    status: "checkpoint_cleanup_complete",
    backupRoot,
    livePath,
    liveVerification,
    liveVerificationAfter,
    checkpoints: evidence.map((item) => ({ checkpointId: item.checkpoint.id, root: item.root, backup: item.backup, restore: item.restore, sidecars: item.sidecars })),
    removal,
    freeBytesBefore,
    freeBytesAfter,
    recoveredBytes: removal.reduce((sum, item) => sum + item.recoveredBytes, 0),
  })}\n`);
}

main().catch((error) => {
  process.stderr.write(`${JSON.stringify({ status: "checkpoint_cleanup_failed", error: error instanceof Error ? error.message : String(error) })}\n`);
  process.exitCode = 1;
});
