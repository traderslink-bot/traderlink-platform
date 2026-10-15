// Focused Node regression for same-file writes during the background integrity reader.
// Run with node --test; NODE_PATH may point to an existing dependency checkout.
const assert = require('node:assert/strict');
const { test } = require('node:test');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { EventEmitter } = require('node:events');
const { runInNewContext } = require('node:vm');
const ts = require('typescript');

const source = readFileSync(process.env.TRADERLINK_INTEGRITY_SOURCE_FILE ||
  join(__dirname, 'open-platform-database.ts'), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

function harness(options = {}) {
  let now = 0;
  let modified = 0;
  let inode = 1;
  let schema = 1;
  let fullChecks = 0;
  let structureChecks = 0;
  const timers = new Set();
  const workers = [];
  const helpers = [];
  const database = { pragma: () => [{ schema_version: schema }] };
  const context = {
    exports: {},
    process: { execPath: '/node', env: {}, platform: options.linux ? 'linux' : 'win32' },
    Date: { now: () => now },
    console: { info() {}, warn() {} },
    setTimeout(callback, delay) {
      const timer = { callback, due: now + delay, unref() {} };
      timers.add(timer);
      return timer;
    },
    clearTimeout: (timer) => timers.delete(timer),
    require(name) {
      if (name === 'node:fs') return {
        existsSync: (path) => path === '/app/bin/traderlink-integrity-cache-release'
          ? options.helperAvailable !== false : true,
        statSync: () => ({ dev: 1, ino: inode, size: 100, mtimeMs: modified }),
      };
      if (name === 'node:path') return require(name);
      if (name === 'node:child_process') return { spawn(command, args) {
        if (command !== '/node' && options.spawnThrows) throw new Error('spawn unavailable');
        return new class extends EventEmitter {
          constructor() {
            super();
            this.signals = [];
            this.channel = { unref() {} };
            this.command = command;
            this.args = args;
            (command === '/node' ? workers : helpers).push(this);
          }
          send(data, callback) { this.data = data; callback(null); }
          unref() {}
          kill(signal) { this.signals.push(signal); return true; }
        }();
      } };
      if (name === 'better-sqlite3') return function Database() {};
      if (name === './platform-database-config') return {};
      if (name === './platform-migration-manifest') return { platformMigrationManifest: [] };
      if (name === './platform-migration-contract') return {
        platformFailure(code, detail) { throw Object.assign(new Error(code), detail); },
      };
      if (name === './platform-migration-registry') return {
        readAppliedPlatformMigrations() { return []; },
      };
      if (name === './run-platform-migrations') return {
        verifyCompletedPlatformDatabase() { fullChecks += 1; },
        verifyPlatformDatabaseStructureAfterDataChange() { structureChecks += 1; },
      };
      throw new Error(`Unexpected import: ${name}`);
    },
  };
  runInNewContext(compiled, context);
  const open = () => context.exports.verifyPlatformRuntimeDatabaseIntegrity(database, '/test.sqlite');
  const state = () => context.__traderlinkPlatformRuntimeDatabaseIntegrityFingerprints.get('/test.sqlite');
  const advance = (milliseconds) => {
    const target = now + milliseconds;
    for (;;) {
      const next = [...timers].filter((timer) => timer.due <= target)
        .sort((left, right) => left.due - right.due)[0];
      if (!next) break;
      now = next.due;
      timers.delete(next);
      next.callback();
    }
    now = target;
  };
  return {
    open,
    state,
    advance,
    workers,
    helpers,
    change() { modified += 1; },
    changeSchemaCounter() { schema += 1; modified += 1; },
    replaceFile() { inode += 1; modified += 1; },
    fullChecks: () => fullChecks,
    structureChecks: () => structureChecks,
  };
}

function startInitialReader(harnessValue) {
  harnessValue.open();
  harnessValue.advance(0);
  assert.equal(harnessValue.workers.length, 1);
  return harnessValue.workers[0];
}

function completeReader(h, reader) {
  if (reader.data.includeQuickCheck) {
    reader.emit('message', { ...reader.data, kind: 'foreign_key_complete',
      structureBefore: '1:1:1', quickCheckStartedAt: 0, foreignKeyDurationMs: 0 });
  }
  reader.emit('message', { ...reader.data, kind: 'result', status: 'ok',
    structureBefore: '1:1:1', structureAfter: '1:1:1',
    foreignKeyDurationMs: 0, quickCheckDurationMs: 0 });
  reader.emit('exit', 0);
}

test('Linux cache advice runs only after successful reader exit and retains the slot', () => {
  const h = harness({ linux: true });
  const reader = startInitialReader(h);
  assert.equal(h.helpers.length, 0);
  completeReader(h, reader);
  assert.equal(h.helpers.length, 1);
  assert.equal(h.helpers[0].command, '/app/bin/traderlink-integrity-cache-release');
  assert.deepEqual(Array.from(h.helpers[0].args), ['/test.sqlite', '1', '1']);
  assert.equal(h.state().quickCheckInFlight, true);
  h.change(); h.open(); h.advance(1000);
  assert.equal(h.workers.length, 1);
  h.helpers[0].emit('close', 0);
  assert.equal(h.state().quickCheckInFlight, false);
  assert.equal(h.state().foreignKeyCheckFailed, false);
  assert.equal(h.state().quickCheckFailed, false);
});

test('cache helper deadline kills only the helper and waits for actual close', () => {
  const h = harness({ linux: true });
  completeReader(h, startInitialReader(h));
  h.advance(2000);
  assert.deepEqual(h.helpers[0].signals, ['SIGKILL']);
  assert.equal(h.state().quickCheckInFlight, true);
  assert.equal(h.state().quickCheckFailed, false);
  h.helpers[0].emit('close', null);
  assert.equal(h.state().quickCheckInFlight, false);
  h.helpers[0].emit('close', null);
  assert.equal(h.state().quickCheckInFlight, false);
});

test('failed or unavailable cache advice preserves verified integrity', () => {
  for (const options of [{ linux: false }, { linux: true, helperAvailable: false },
    { linux: true, spawnThrows: true }, { linux: true }]) {
    const h = harness(options);
    completeReader(h, startInitialReader(h));
    if (h.helpers.length) {
      h.helpers[0].emit('error', new Error('ENOENT'));
      h.helpers[0].emit('close', -2);
    }
    assert.equal(h.state().quickCheckInFlight, false);
    assert.equal(h.state().requiresFullVerification, false);
    assert.equal(h.state().foreignKeyCheckFailed, false);
    assert.equal(h.state().quickCheckFailed, false);
  }
});

test('failed integrity never starts cache advice', () => {
  const h = harness({ linux: true });
  const reader = startInitialReader(h);
  reader.emit('message', { ...reader.data, kind: 'result', status: 'foreign_key_failed' });
  reader.emit('exit', 0);
  assert.equal(h.helpers.length, 0);
  assert.equal(h.state().foreignKeyCheckFailed, true);
});

test('schema change cancels advice without releasing its slot before close', () => {
  const h = harness({ linux: true });
  completeReader(h, startInitialReader(h));
  h.changeSchemaCounter(); h.open();
  assert.deepEqual(h.helpers[0].signals, ['SIGKILL']);
  assert.equal(h.state().quickCheckInFlight, true);
  h.helpers[0].emit('close', null);
  assert.equal(h.state().quickCheckInFlight, false);
});

test('a same-file write retains the snapshot without blocking requests', () => {
  const h = harness();
  const staleReader = startInitialReader(h);
  const capturedDataGeneration = staleReader.data.dataGeneration;

  h.change();
  assert.doesNotThrow(h.open);
  assert.ok(h.state().dataGeneration > capturedDataGeneration);
  assert.equal(h.state().requiresFullVerification, false);
  assert.deepEqual(staleReader.signals, []);
  assert.equal(h.state().quickCheckInFlight, true, 'the reader slot remains owned until exit');

  completeReader(h, staleReader);
  assert.equal(h.state().retryPending, false);
  assert.equal(h.state().dirtySinceForeignKeyCheck, true);
  assert.equal(h.state().dirtySinceQuickCheck, true);
  assert.doesNotThrow(h.open);
  h.advance(299_999);
  assert.equal(h.workers.length, 1);
  h.advance(1);
  assert.equal(h.workers.length, 2);
  assert.equal(h.workers[1].data.dataGeneration, h.state().dataGeneration);
  assert.equal(h.workers[1].data.includeQuickCheck, false);
});

test('one thousand price-like writes do not starve or restart a valid snapshot', () => {
  const h = harness();
  const reader = startInitialReader(h);
  for (let index = 0; index < 1000; index += 1) {
    h.advance(50);
    h.change();
    assert.doesNotThrow(h.open);
  }
  assert.equal(h.workers.length, 1);
  assert.deepEqual(reader.signals, []);
  completeReader(h, reader);
  assert.equal(h.state().quickCheckInFlight, false);
  assert.equal(h.state().retryPending, false);
  assert.equal(h.state().requiresFullVerification, false);
  assert.equal(h.state().dirtySinceQuickCheck, true);
  // The existing ten-times-duration I/O recovery gap is longer than five minutes.
  h.advance(499_999);
  assert.equal(h.workers.length, 1);
  h.advance(1);
  assert.equal(h.workers.length, 2);
  assert.equal(h.workers[1].data.dataGeneration, 1000);
  assert.equal(h.workers[1].data.includeQuickCheck, false);
});

test('corruption in a snapshot still latches after concurrent ordinary writes', () => {
  for (const status of ['foreign_key_failed', 'integrity_failed']) {
    const h = harness();
    const reader = startInitialReader(h);
    h.change(); h.open();
    reader.emit('message', { ...reader.data, kind: 'result', status });
    reader.emit('exit', 0);
    assert.throws(h.open, (error) => error.check ===
      (status === 'foreign_key_failed' ? 'foreign_key_check' : 'quick_check'));
  }
});

test('continuous writes do not remove the hard timeout or permit overlapping readers', () => {
  const h = harness();
  const reader = startInitialReader(h);
  for (let index = 0; index < 119; index += 1) {
    h.advance(1000); h.change(); h.open();
  }
  assert.deepEqual(reader.signals, []);
  h.advance(1000);
  assert.deepEqual(reader.signals, ['SIGTERM']);
  h.advance(5000);
  assert.deepEqual(reader.signals, ['SIGTERM', 'SIGKILL']);
  assert.equal(h.state().quickCheckInFlight, true);
  assert.equal(h.workers.length, 1);
  reader.emit('exit', null);
  assert.equal(h.state().quickCheckInFlight, false);
  h.advance(1_249_999);
  assert.equal(h.workers.length, 1);
  h.advance(1);
  assert.equal(h.workers.length, 2);
});

test('a nonzero reader exit cannot report snapshot success after writes', () => {
  const h = harness(); const reader = startInitialReader(h);
  h.change(); h.open();
  reader.emit('message', { ...reader.data, kind: 'foreign_key_complete',
    structureBefore: '1:1:1', quickCheckStartedAt: 0 });
  reader.emit('message', { ...reader.data, kind: 'result', status: 'ok',
    structureBefore: '1:1:1', structureAfter: '1:1:1' });
  reader.emit('exit', 1);
  assert.equal(h.state().retryPending, true);
  assert.equal(h.state().dirtySinceQuickCheck, true);
});

test('actual SQLite WAL snapshot remains valid while live-price-like writes commit', () => {
  const { mkdtempSync, rmSync } = require('node:fs');
  const { tmpdir } = require('node:os');
  const Database = require('better-sqlite3');
  const directory = mkdtempSync(join(tmpdir(), 'traderlink-integrity-wal-'));
  const path = join(directory, 'synthetic.sqlite');
  let writer; let reader;
  try {
    writer = new Database(path);
    writer.pragma('journal_mode=WAL');
    writer.exec('CREATE TABLE quote(id INTEGER PRIMARY KEY, price REAL NOT NULL); INSERT INTO quote VALUES(1, 10)');
    reader = new Database(path, { readonly: true });
    reader.pragma('query_only=ON');
    reader.exec('BEGIN');
    assert.equal(reader.prepare('SELECT price FROM quote WHERE id=1').get().price, 10);
    const write = writer.prepare('UPDATE quote SET price=? WHERE id=1');
    for (let index = 1; index <= 500; index += 1) write.run(10 + index / 100);
    assert.equal(writer.prepare('SELECT price FROM quote WHERE id=1').get().price, 15);
    assert.equal(reader.prepare('SELECT price FROM quote WHERE id=1').get().price, 10);
    assert.deepEqual(reader.pragma('foreign_key_check'), []);
    assert.equal(reader.pragma('quick_check', { simple: true }), 'ok');
    reader.exec('COMMIT');
    assert.equal(reader.prepare('SELECT price FROM quote WHERE id=1').get().price, 15);
  } finally {
    reader?.close(); writer?.close();
    // Exact synthetic directory created by this test; both handles are closed.
    rmSync(directory, { recursive: true });
  }
});

test('a restored same-file schema validates exactly and keeps the baseline available', () => {
  const h = harness();
  const staleReader = startInitialReader(h);

  h.changeSchemaCounter();
  assert.doesNotThrow(h.open);
  assert.equal(h.structureChecks(), 2, 'startup and changed schema both use manifest structure validation');
  assert.equal(h.fullChecks(), 0);
  assert.equal(h.state().requiresFullVerification, false);
  assert.deepEqual(staleReader.signals, ['SIGTERM']);
});

test('file replacement and actual integrity failures still fail closed', () => {
  const identity = harness();
  const oldReader = startInitialReader(identity);
  identity.replaceFile();
  assert.throws(identity.open, (error) => error.check === 'background_verification_pending');
  assert.equal(identity.state().requiresFullVerification, true);
  oldReader.emit('exit', 0);
  identity.advance(60_000);
  assert.doesNotThrow(identity.open);
  assert.equal(identity.fullChecks(), 1);

  const corruption = harness();
  const reader = startInitialReader(corruption);
  reader.emit('message', { ...reader.data, kind: 'result', status: 'foreign_key_failed' });
  reader.emit('exit', 0);
  assert.throws(corruption.open, (error) => error.check === 'foreign_key_check');
});
