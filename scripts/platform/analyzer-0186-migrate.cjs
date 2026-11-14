'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const Database = require('better-sqlite3');
const { platformMigrationManifest: manifest } = require('../../src/modules/platform/server/database/platform-migration-manifest.ts');
const { runPlatformMigrations, verifyPlatformMaintenancePreflightStructure } = require('../../src/modules/platform/server/database/run-platform-migrations.ts');
const { createAndRestoreVerifyPlatformDatabaseBackup } = require('../../src/modules/platform/server/database/platform-database-backup.ts');
const { loadAccountIdentityConfiguration } = require('../../src/modules/journal/server/accounts/journal-account-service.ts');
const { ALL_JOURNAL_SOURCE_ACCOUNT_CANONICALIZERS: canonicalizers, DEFAULT_JOURNAL_SOURCE_ACCOUNT_CANONICALIZATION_VERSION: defaultVersion } = require('../../src/modules/journal/server/accounts/journal-source-account-canonicalizers.ts');

const live = '/data/traderlink-platform.sqlite';
const checkpoint = '/data/backups/analyzer-0186-20261114';
const backup = path.join(checkpoint, 'backup.sqlite');
const restore = path.join(checkpoint, 'restore-verification.sqlite');
const migration = '0186_daily_trade_analyzer_alpaca_cache';
const targetDigest = '36507a90f169612bc844c96da29a805abd1e69b139db1fb745316f2d18b805b2';
const prefix = manifest.slice(0, -1);
const save = (name, data) => fs.writeFileSync(path.join(checkpoint, name + '.json'), JSON.stringify(data, null, 2) + '\n', { flag: 'wx', mode: 0o600, flush: true });
const open = file => {
  const db = new Database(file, { fileMustExist: true, timeout: 5000 });
  db.pragma('foreign_keys = ON');
  return db;
};

function advance(file, liveWrite, deadline) {
  const db = open(file);
  try {
    const tables = ['level_analysis_market_session_sets', 'level_analysis_market_session_set_versions', 'level_analysis_logical_trade_jobs'];
    const count = () => tables.map(table => db.prepare('SELECT count(*) AS n FROM ' + table).get().n);
    const before = count();
    const result = runPlatformMigrations(db, { manifest, beforeMigrationBoundary(phase) {
      assert(Date.now() < deadline, 'migration deadline reached');
      if (liveWrite && phase === 'statements') save('live-admission', { at: new Date().toISOString(), migration });
    } });
    assert.deepEqual([...result.appliedMigrationIds], [migration]);
    assert.equal(result.finalSchemaSha256, targetDigest);
    assert.deepEqual(count(), before);
    assert.equal(db.prepare('SELECT count(*) AS n FROM level_analysis_logical_trade_jobs WHERE post_session_refresh != 0').get().n, 0);
    db.pragma('wal_checkpoint(TRUNCATE)');
    return { schema: result.finalSchemaSha256, counts: before };
  } finally {
    db.close();
  }
}

async function main() {
  assert.equal(process.env.RAILWAY_PROJECT_ID, '49fc9197-07c9-45c7-b528-57d0393c2cca');
  assert.equal(process.env.RAILWAY_ENVIRONMENT_ID, '666e1624-a1eb-4e94-8e16-5ed73ad4b4af');
  assert.equal(process.env.RAILWAY_SERVICE_ID, 'fda2d2e9-d5ae-47b5-9cc1-42b371eaa4fb');
  assert.equal(process.env.TRADERLINK_PLATFORM_DB_PATH, live);
  const [expectedDeployment, expectedPid, deadlineText] = process.argv.slice(2);
  assert.equal(process.env.RAILWAY_DEPLOYMENT_ID, expectedDeployment);
  const deadline = Number(deadlineText);
  assert(Number.isSafeInteger(deadline) && deadline > Date.now() && deadline - Date.now() < 12 * 3600000);
  assert.equal(manifest.length, 150);
  assert.equal(manifest.at(-1).migrationId, migration);
  assert.equal(fs.realpathSync(live), live);
  assert(!fs.existsSync(checkpoint));
  const ready = JSON.parse(await (await fetch('http://127.0.0.1:' + (process.env.PORT || 3000) + '/api/platform/health', { signal: AbortSignal.timeout(5000) })).text());
  assert.equal(ready.status, 'maintenance_ready');
  assert.equal(ready.deployment, expectedDeployment);
  assert.equal(ready.pid, Number(expectedPid));
  assert.notEqual(ready.pid, process.pid);
  for (const name of ['/data', '/data/backups']) {
    if (fs.existsSync(name)) assert(fs.lstatSync(name).isDirectory());
  }
  const db = open(live);
  try {
    verifyPlatformMaintenancePreflightStructure(db, prefix);
    const checkpointStatus = db.pragma('wal_checkpoint(TRUNCATE)')[0];
    assert.equal(checkpointStatus.busy, 0);
  } finally { db.close(); }
  const size = fs.statSync(live).size;
  const volume = fs.statfsSync('/data');
  assert(volume.bavail * volume.bsize >= size * 2 + 2 * 1024 ** 3);
  fs.mkdirSync('/data/backups', { recursive: true, mode: 0o700 });
  fs.mkdirSync(checkpoint, { mode: 0o700 });
  save('intent', { live, backup, restore, migration, deployment: expectedDeployment, deadline, removal: 'Healthy final or recovered app and verified exact-file disposition' });
  const evidence = await createAndRestoreVerifyPlatformDatabaseBackup({
    sourcePath: live, backupPath: backup, restoreVerificationPath: restore, verificationManifest: prefix,
    verifyRecoveryAuthority(requirements) {
      const config = loadAccountIdentityConfiguration(process.env, canonicalizers, defaultVersion);
      assert(requirements.hmacKeyVersions.every(version => version in config.keysBase64));
      assert(requirements.sourceAccountCanonicalizationVersions.every(version => version in canonicalizers));
      return { verified: true, ...requirements };
    },
  });
  save('backup-evidence', evidence);
  save('rehearsal', advance(restore, false, deadline));
  assert(Date.now() + 30 * 60000 < deadline, 'insufficient remaining live verification and recovery time');
  const result = advance(live, true, deadline);
  save('completed', result);
  console.log(JSON.stringify({ stage: 'analyzer_migration_complete', ...result }));
}

if (require.main === module) main().catch(error => {
  console.error(JSON.stringify({ stage: 'analyzer_migration_error', code: error.code ?? 'guard_failure', message: error.message }));
  process.exitCode = 1;
});
module.exports = { advance };
