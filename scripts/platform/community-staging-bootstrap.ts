import fs from "node:fs";
import assert from "node:assert/strict";
import Database from "better-sqlite3";
import { platformMigrationManifest } from "../../src/modules/platform/server/database/platform-migration-manifest";
import { calculatePlatformMigrationChecksum } from "../../src/modules/platform/server/database/platform-migration-contract";
import { configurePlatformDatabaseConnection } from "../../src/modules/platform/server/database/open-platform-database";
import { runPlatformMigrations, verifyCompletedPlatformDatabase } from "../../src/modules/platform/server/database/run-platform-migrations";
import { readAppliedPlatformMigrations } from "../../src/modules/platform/server/database/platform-migration-registry";
import { resolvePlatformBackgroundWorkerMode } from "../../src/modules/platform/server/runtime/platform-background-worker-mode";

export function bootstrapIsolatedCommunityStaging(plan: { ledger: readonly unknown[]; schemaSha256: string }): void {
  assert.equal(resolvePlatformBackgroundWorkerMode(), "disabled_isolated_staging");
  assert.equal(plan.schemaSha256, process.env.TRADERLINK_PLATFORM_ISOLATED_STAGING_SCHEMA_SHA256);
  const selected = plan as typeof plan & { sourceCommit: string; sourceVectorSha256: string };
  assert.equal(selected.sourceCommit, process.env.TRADERLINK_PLATFORM_ISOLATED_STAGING_SOURCE_COMMIT);
  assert.equal(selected.sourceVectorSha256, process.env.TRADERLINK_PLATFORM_ISOLATED_STAGING_SOURCE_VECTOR_SHA256);
  const file = "/data/community-combined-review-20261117/platform.sqlite";
  assert.equal(process.env.TRADERLINK_PLATFORM_DB_PATH, file);
  assert.deepEqual(platformMigrationManifest.map(m => ({ migration_id: m.migrationId,
    module_namespace: m.moduleNamespace, execution_order: m.executionOrder,
    checksum_sha256: calculatePlatformMigrationChecksum(m) })), plan.ledger);
  const parent = "/data/community-combined-review-20261117";
  if (!fs.existsSync(parent)) fs.mkdirSync(parent, { mode: 0o700 });
  const uid = process.getuid?.();
  assert(uid !== undefined);
  const owner = fs.lstatSync(parent);
  assert(owner.isDirectory() && !owner.isSymbolicLink());
  assert([0, uid].includes(owner.uid) && (owner.mode & 0o077) === 0);
  assert.equal(fs.realpathSync(parent), parent);
  const exists = fs.existsSync(file);
  if (exists) {
    const st = fs.lstatSync(file);
    assert(st.isFile() && !st.isSymbolicLink() && st.nlink === 1);
    assert([0, uid].includes(st.uid) && (st.mode & 0o077) === 0);
  } else {
    const fd = fs.openSync(file, fs.constants.O_CREAT | fs.constants.O_EXCL | fs.constants.O_NOFOLLOW | fs.constants.O_RDWR, 0o600);
    fs.closeSync(fd);
  }
  const db = new Database(file, { readonly: exists, fileMustExist: true });
  try {
    if (exists) {
      db.pragma("query_only = ON");
      db.pragma("foreign_keys = ON");
    } else {
      configurePlatformDatabaseConnection(db, "initializer");
      runPlatformMigrations(db);
    }
    const proof = verifyCompletedPlatformDatabase(db);
    assert.equal(proof.finalSchemaSha256, plan.schemaSha256);
    assert.deepEqual(readAppliedPlatformMigrations(db).map(m => ({ migration_id: m.migration_id,
      module_namespace: m.module_namespace, execution_order: m.execution_order,
      checksum_sha256: m.checksum_sha256 })), plan.ledger);
  } finally { db.close(); }
}
