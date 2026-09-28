// Serial controlled flow: actual verifier/backup/runner source, no SQLite/files written.
const assert = require('node:assert/strict');
const { test } = require('node:test');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { runInNewContext } = require('node:vm');
const ts = require('typescript');

const files = {
  observer: '../observability/platform-maintenance-observability.ts',
  verifier: 'run-platform-migrations.ts',
  backup: 'platform-database-backup.ts',
  runner: 'run-hosted-platform-migration-maintenance.ts',
  runtime: '../../../../../instrumentation-node.ts',
};
const compiled = Object.fromEntries(Object.entries(files).map(([key, file]) => [key,
  ts.transpileModule(readFileSync(path.join(__dirname, file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText,
]));

function harness(options = {}) {
  const events = [], logs = [], handles = [], bytes = new Map([['/fixture/source.sqlite', Buffer.from('fixture')]]);
  const manifest = [{ migrationId: 'before' }, { migrationId: 'target' }];
  const rows = [{ migration_id: 'before', post_schema_sha256: 'schema' }];
  if (options.alreadyApplied) rows.push({ migration_id: 'target', post_schema_sha256: 'schema' });
  if (options.wrongPredecessor) rows[0].migration_id = 'different';
  const kind = file => file.includes('restore') ? 'restore' : file.includes('backup.sqlite') ? 'backup' : 'source';
  const failure = code => { const error = Object.assign(new Error(code), { platform: true }); throw error; };
  const contract = {
    createCanonicalUtcTimestamp: date => date.toISOString(),
    validatePlatformMigrationManifest(value) {
      events.push('manifest');
      if (options.fail === 'manifest') failure('MANIFEST_FAILED');
      return value;
    },
    isTraderLinkPlatformError: error => error.platform === true,
    platformFailure: failure,
  };
  const registry = {
    listPlatformUserTableNames: () => ['sample'],
    readAppliedPlatformMigrations: () => rows,
    platformMigrationRegistryExists: () => true,
    validateAppliedPlatformMigrationPrefix(applied, expected) {
      events.push('registry');
      assert.ok(applied.length <= expected.length);
      if (options.fail === 'registry') failure('REGISTRY_FAILED');
    },
    requireOnlyExpectedPlatformTables() {
      events.push('tables');
      if (options.fail === 'tables') failure('TABLES_FAILED');
    },
    requirePlatformSchemaDigest() {
      events.push('digest');
      if (options.fail === 'digest') failure('DIGEST_FAILED');
      return 'schema';
    },
    requirePlatformForeignKeyCheck(db) {
      events.push('fk:' + db.kind);
      if (options.fail === 'fk:' + db.kind) failure('FK_FAILED');
    },
    requirePlatformQuickCheck(db) {
      events.push('quick:' + db.kind);
      if (options.fail === 'quick:' + db.kind) failure('QUICK_FAILED');
    },
  };
  class Database {
    constructor(file, config) {
      assert.equal(config.readonly, true); assert.equal(config.fileMustExist, true);
      this.file = file; this.kind = kind(file); handles.push(this);
    }
    pragma(name) { return [{ value: name === 'page_size' ? 4096 : 1 }]; }
    prepare(sql) {
      return {
        all: () => options.recoveryRequired ? [{ hmac_key_version: 'missing', source_account_canonicalization_version: 'missing' }] : [],
        get: () => sql.includes('sqlite_version') ? { sqlite_version: 'fixture' } :
          { count: options.countMismatch && this.kind === 'restore' ? 2 : 1 },
      };
    }
    async backup(destination) {
      events.push('copy:' + kind(destination));
      if (options.fail === 'copy:' + kind(destination)) failure('COPY_FAILED');
      bytes.set(destination, Buffer.from(options.hashMismatch && kind(destination) === 'restore' ? 'changed' : bytes.get(this.file)));
    }
    close() { this.closed = true; }
  }
  const pragmas = { foreignKeys: 1, busyTimeout: 5000, journalMode: 'wal', synchronous: 1 };
  const modules = {};
  function load(key) {
    const context = {
      exports: {}, Buffer,
      process: { env: { NODE_ENV: 'production' }, exit() { failure('READINESS_EXIT'); } },
      console: { info(message, record) {
        if (!record) return;
        if (options.logThrows) throw new Error('log unavailable');
        logs.push({ message, ...record });
        events.push(record.status + ':' + record.phase);
      }, error() {} },
      require(name) {
        if (name === 'node:path') return path.posix;
        if (name === 'node:crypto') return require(name);
        if (name === 'node:fs') return {
          existsSync: file => bytes.has(file),
          mkdirSync() {},
          statSync: file => ({ size: bytes.get(file).length, mtime: new Date(0) }),
          openSync: file => ({ file, offset: 0 }),
          closeSync() {},
          readSync(descriptor, buffer, offset, length) {
            const data = bytes.get(descriptor.file);
            const part = data.subarray(descriptor.offset, descriptor.offset + length);
            part.copy(buffer, offset); descriptor.offset += part.length; return part.length;
          },
        };
        if (name === 'better-sqlite3') return Database;
        if (name.includes('platform-maintenance-observability')) return modules.observer;
        if (name.includes('platform-request-timing')) return { measurePlatformRequestPhase: (_name, operation) => operation() };
        if (name === './platform-migration-contract') return contract;
        if (name === './platform-migration-manifest') return { platformMigrationManifest: manifest, expectedPlatformTableNamesForPrefix: () => ['sample'] };
        if (name === './platform-migration-registry') return registry;
        if (name === './platform-schema-digest') return { calculatePlatformSchemaDigest: () => 'schema' };
        if (name === './run-platform-migrations') return modules.verifier;
        if (name === './platform-database-backup') return modules.backup;
        if (name === './platform-database-config') return {
          validatePlatformDatabasePath: value => value,
          resolvePlatformDatabaseConfig: () => ({ databasePath: '/fixture/source.sqlite' }),
          isPathWithinRoot: () => true,
        };
        if (name === './open-platform-database') return {
          readPlatformDatabasePragmaEvidence: () => pragmas,
          verifyPlatformDatabaseConnectionPragmas(db) {
            events.push('pragmas:' + db.kind);
            if (options.fail === 'pragmas:' + db.kind) failure('PRAGMAS_FAILED');
            return pragmas;
          },
        };
        if (name.endsWith('/run-hosted-platform-migration-maintenance')) return {
          runHostedPlatformMigrationMaintenance: () => options.noMaintenance ? null : modules.runner.runHostedPlatformMigrationMaintenance(environment),
        };
        if (name.endsWith('/platform-hosted-runtime-readiness')) return {
          verifyPlatformHostedRuntimeReadiness() {
            events.push('readiness');
            if (options.fail === 'readiness') failure('READINESS_FAILED');
            return { migrationCount: 2, storage: 'fixture' };
          },
        };
        if (name.endsWith('/traderlink-hosted-background-workers')) return {
          startTraderLinkHostedBackgroundWorkers() { events.push('workers'); },
        };
        if (name.includes('journal-source-account-canonicalizers')) return {
          ALL_JOURNAL_SOURCE_ACCOUNT_CANONICALIZERS: {}, DEFAULT_JOURNAL_SOURCE_ACCOUNT_CANONICALIZATION_VERSION: 1,
        };
        if (name.includes('journal-account-service')) return { loadAccountIdentityConfiguration: () => ({ keysBase64: {} }) };
        if (name.includes('initialize-traderlink-platform-database')) return {
          initializeTraderLinkPlatformDatabase() {
            events.push('apply');
            if (options.fail === 'migration') failure('MIGRATION_FAILED');
            return { appliedThisRun: ['target'] };
          },
        };
        throw new Error('Unexpected module ' + name);
      },
    };
    runInNewContext(compiled[key], context);
    modules[key] = context.exports;
  }
  for (const key of Object.keys(files)) load(key);
  const environment = {
    TRADERLINK_PLATFORM_MAINTENANCE_MIGRATION_ID: 'target',
    TRADERLINK_PLATFORM_MAINTENANCE_CONFIRM: 'apply-reviewed-migration',
    TRADERLINK_PLATFORM_HOSTED_BACKUP_ROOT: '/fixture/checkpoints',
  };
  return { events, logs, handles, modules,
    run: () => modules.runner.runHostedPlatformMigrationMaintenance(environment),
    runtime: () => modules.runtime.registerTraderLinkHostedNodeRuntime(),
  };
}

test('structure preflight plus independent source/backup/restore retain exactly three complete check pairs', async () => {
  const h = harness(); await h.run();
  assert.deepEqual(h.events.filter(event => /^(fk|quick):/.test(event)), [
    'fk:source', 'quick:source', // source evidence
    'fk:backup', 'quick:backup', // copied backup evidence
    'fk:restore', 'quick:restore', // independently restored evidence
  ]);
  assert.equal(h.events.filter(event => event === 'apply').length, 1);
  assert.ok(h.events.indexOf('completed:checkpoint') < h.events.indexOf('apply'));
  assert.ok(h.events.indexOf('completed:preflight') < h.events.indexOf('fk:source'));
  assert.ok(h.events.indexOf('completed:source_evidence') < h.events.indexOf('started:checkpoint_directories'));
  assert.ok(h.events.indexOf('completed:source_evidence') < h.events.indexOf('copy:backup'));
  for (const gate of ['manifest', 'registry', 'tables', 'digest']) {
    assert.ok(h.events.indexOf(gate) < h.events.indexOf('completed:preflight'));
  }
  assert.equal(h.handles.length, 4, 'preflight and each evidence handle remain independent');
  assert.ok(h.handles.every(handle => handle.closed));
});

test('every phase starts before work and finishes after it; diagnostics contain only safe fields', async () => {
  const h = harness(); await h.run();
  for (const phase of ['preflight', 'checkpoint', 'checkpoint_directories',
    'source_evidence', 'backup_evidence', 'restore_evidence', 'source_hash', 'backup_hash', 'restore_hash',
    'backup_copy', 'restore_copy', 'migration']) {
    assert.deepEqual(h.logs.filter(log => log.phase === phase).map(log => log.status), ['started', 'completed']);
  }
  assert.ok(h.events.indexOf('started:preflight') < h.events.indexOf('fk:source'));
  assert.ok(h.events.indexOf('started:backup_copy') < h.events.indexOf('copy:backup'));
  assert.ok(h.events.indexOf('started:restore_copy') < h.events.indexOf('copy:restore'));
  assert.ok(h.events.indexOf('started:migration') < h.events.indexOf('apply'));
  for (const log of h.logs) assert.deepEqual(Object.keys(log).sort(), ['durationMs', 'message', 'phase', 'status']);
  assert.equal(JSON.stringify(h.logs).includes('/fixture'), false);
});

for (const fail of ['fk:source', 'quick:source', 'fk:backup', 'quick:backup', 'fk:restore', 'quick:restore', 'copy:backup', 'copy:restore']) {
  test(`${fail} preserves fail-closed checkpoint and prevents migration`, async () => {
    const h = harness({ fail });
    await assert.rejects(h.run(), fail.startsWith('fk:') ? /FK_FAILED/ : fail.startsWith('quick:') ? /QUICK_FAILED/ : /COPY_FAILED/);
    assert.equal(h.events.includes('apply'), false);
    assert.equal(h.events.includes('completed:checkpoint'), false);
    assert.ok(h.logs.some(log => log.status === 'failed'));
    assert.ok(h.handles.every(handle => handle.closed));
  });
}

for (const mismatch of ['countMismatch', 'hashMismatch']) {
  test(`${mismatch} still rejects restore evidence before migration`, async () => {
    const h = harness({ [mismatch]: true });
    await assert.rejects(h.run(), /TRADERLINK_BACKUP_VERIFICATION_FAILED/);
    assert.equal(h.events.includes('apply'), false);
  });
}

test('unavailable logging does not change success or failure', async () => {
  const good = harness({ logThrows: true }); await good.run();
  assert.equal(good.events.includes('apply'), true);
  const bad = harness({ logThrows: true, fail: 'quick:backup' });
  await assert.rejects(bad.run(), /QUICK_FAILED/);
  assert.equal(bad.events.includes('apply'), false);
});

test('phase wrappers preserve exact return values and thrown errors without logging secrets', async () => {
  const h = harness(), token = { private: 'not logged' }, error = new Error('private evidence');
  const sync = h.modules.observer.observePlatformMaintenancePhase;
  const asyncPhase = h.modules.observer.observePlatformMaintenancePhaseAsync;
  assert.equal(sync('preflight', () => token), token);
  assert.equal(await asyncPhase('checkpoint', async () => token), token);
  assert.throws(() => sync('preflight', () => { throw error; }), value => value === error);
  await assert.rejects(asyncPhase('checkpoint', async () => { throw error; }), value => value === error);
  assert.equal(JSON.stringify(h.logs).includes('private'), false);
});

for (const gate of ['manifest', 'registry', 'tables', 'digest']) {
  test(`${gate} preflight rejection prevents data scans, copies and migration`, async () => {
    const h = harness({ fail: gate });
    await assert.rejects(h.run(), new RegExp(gate.toUpperCase() + '_FAILED'));
    assert.equal(h.events.some(event => /^(fk|quick|copy):/.test(event)), false);
    assert.equal(h.events.includes('apply'), false);
    assert.ok(h.handles.every(handle => handle.closed));
  });
}

test('exact predecessor remains required even when registry prefix validation succeeds', async () => {
  const h = harness({ wrongPredecessor: true });
  await assert.rejects(h.run(), /TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED/);
  assert.equal(h.events.some(event => /^(fk|quick|copy):/.test(event)), false);
  assert.equal(h.events.includes('apply'), false);
});

test('already applied retains one full verification with no backup or migration', async () => {
  const h = harness({ alreadyApplied: true }); await h.run();
  assert.deepEqual(h.events.filter(event => /^(fk|quick):/.test(event)), ['fk:source', 'quick:source']);
  assert.equal(h.handles.length, 1);
  assert.equal(h.events.some(event => event.startsWith('copy:')), false);
  assert.equal(h.events.includes('apply'), false);
  const bad = harness({ alreadyApplied: true, fail: 'quick:source' });
  await assert.rejects(bad.run(), /QUICK_FAILED/);
});

for (const kind of ['source', 'backup', 'restore']) {
  test(`${kind} connection pragma failure prevents migration`, async () => {
    const h = harness({ fail: 'pragmas:' + kind });
    await assert.rejects(h.run(), /PRAGMAS_FAILED/);
    assert.equal(h.events.includes('apply'), false);
    assert.ok(h.handles.every(handle => handle.closed));
  });
}

test('missing recovery authority rejects after source evidence but before any copy', async () => {
  const h = harness({ recoveryRequired: true });
  await assert.rejects(h.run(), /TRADERLINK_ACCOUNT_IDENTITY_RECOVERY_REQUIRED/);
  assert.ok(h.events.includes('completed:source_evidence'));
  assert.equal(h.events.some(event => event.startsWith('copy:')), false);
  assert.equal(h.events.includes('apply'), false);
});

test('maintenance readiness timing wraps the real call before starting workers', async () => {
  const h = harness(); await h.runtime();
  assert.ok(h.events.indexOf('completed:migration') < h.events.indexOf('started:readiness'));
  assert.ok(h.events.indexOf('started:readiness') < h.events.indexOf('readiness'));
  assert.ok(h.events.indexOf('readiness') < h.events.indexOf('completed:readiness'));
  assert.ok(h.events.indexOf('completed:readiness') < h.events.indexOf('workers'));
  const ordinary = harness({ noMaintenance: true }); await ordinary.runtime();
  assert.deepEqual(ordinary.events, ['readiness', 'workers']);
  assert.equal(ordinary.logs.length, 0);
});

for (const fail of ['migration', 'readiness']) {
  test(`${fail} failure still exits before background workers or readiness acceptance`, async () => {
    const h = harness({ fail });
    await assert.rejects(h.runtime(), /READINESS_EXIT/);
    assert.ok(h.events.includes('failed:' + fail));
    assert.equal(h.events.includes('workers'), false);
    assert.equal(h.events.includes('completed:readiness'), false);
  });
}
