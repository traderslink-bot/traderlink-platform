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
const checkpoint = '/data/backups/home-preference-0214-production';
const backup = path.join(checkpoint, 'backup.sqlite');
const restore = path.join(checkpoint, 'restore-verification.sqlite');
const plan = require('./analyzer-exact-ledger.json');
const targetDigest = plan.targetSchemaSha256;
const prefix = manifest.slice(0, plan.predecessorCount);
const pendingIds = manifest.slice(prefix.length).map(entry => entry.migrationId);
const save = (name, data) => fs.writeFileSync(path.join(checkpoint, name + '.json'), JSON.stringify(data, null, 2) + '\n', { flag: 'wx', mode: 0o600, flush: true });
const open = file => {
  const db = new Database(file, { fileMustExist: true, timeout: 5000 });
  db.pragma('foreign_keys = ON');
  return db;
};

function advance(file, liveWrite, deadline) {
  const db = open(file);
  try {
    const counts = () => ['journal_accounts', 'level_analysis_logical_trade_jobs', 'journal_chart_entries'].map(table =>
      db.prepare('SELECT count(*) AS n FROM ' + table).get().n);
    const before = counts();
    const readLedger = () => db.prepare('SELECT migration_id,module_namespace,execution_order,checksum_sha256 FROM platform_schema_migrations ORDER BY execution_order').all();
    assert.deepEqual(readLedger(), plan.ledger.slice(0, prefix.length));
    let admitted = false;
    const result = runPlatformMigrations(db, {
      manifest,
      atomicSuffix: true,
      beforeMigrationBoundary(phase) {
        assert(Date.now() < deadline, 'migration deadline reached');
        if (liveWrite && !admitted && phase === 'statements') {
          save('live-admission', { at: new Date().toISOString(), pendingIds });
          admitted = true;
        }
      },
      verifyAtomicSuffix(result) {
        assert.deepEqual([...result.appliedMigrationIds], pendingIds);
        assert.deepEqual(readLedger(), plan.ledger);
        assert.equal(result.finalSchemaSha256, targetDigest);
        assert.deepEqual(counts(), before);
      },
    });
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
  assert.equal(prefix.length, 181);
  assert.equal(manifest.length, 182);
  assert.equal(fs.realpathSync(live), live);
  assert(!fs.existsSync(checkpoint));
  const ready = JSON.parse(await (await fetch('http://127.0.0.1:' + (process.env.PORT || 3000) + '/api/platform/health', { signal: AbortSignal.timeout(5000) })).text());
  assert.equal(ready.status, 'maintenance_ready');
  assert.equal(ready.migrationCount, prefix.length);
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
  save('intent', { live, backup, restore, pendingIds, deployment: expectedDeployment, deadline, removal: 'Healthy final or recovered app and verified exact-file disposition' });
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
  const result = advance(live, true, deadline);
  save('completed', result);
  console.log(JSON.stringify({ stage: 'home_preference_migration_complete', ...result }));
}

if (require.main === module) main().catch(error => {
  console.error(JSON.stringify({ stage: 'home_preference_migration_error', code: error.code ?? 'guard_failure', message: error.message }));
  process.exitCode = 1;
});
module.exports = { advance };
