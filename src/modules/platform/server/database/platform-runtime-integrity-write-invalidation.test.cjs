// Focused Node regression for same-file writes during the background integrity reader.
// Run with node --test; NODE_PATH may point to an existing dependency checkout.
const assert = require('node:assert/strict');
const { test } = require('node:test');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { EventEmitter } = require('node:events');
const { runInNewContext } = require('node:vm');
const ts = require('typescript');

const source = readFileSync(join(__dirname, 'open-platform-database.ts'), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

function harness() {
  let now = 0;
  let modified = 0;
  let inode = 1;
  let schema = 1;
  let fullChecks = 0;
  let structureChecks = 0;
  const timers = new Set();
  const workers = [];
  const database = { pragma: () => [{ schema_version: schema }] };
  const context = {
    exports: {},
    process: { execPath: '/node', env: {} },
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
        existsSync: () => true,
        statSync: () => ({ dev: 1, ino: inode, size: 100, mtimeMs: modified }),
      };
      if (name === 'node:path') return require(name);
      if (name === 'node:child_process') return { spawn() {
        return new class extends EventEmitter {
          constructor() {
            super();
            this.signals = [];
            this.channel = { unref() {} };
            workers.push(this);
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

test('a same-file write cancels the stale reader without blocking requests', () => {
  const h = harness();
  const staleReader = startInitialReader(h);
  const capturedDataGeneration = staleReader.data.dataGeneration;

  h.change();
  assert.doesNotThrow(h.open);
  assert.ok(h.state().dataGeneration > capturedDataGeneration);
  assert.equal(h.state().requiresFullVerification, false);
  assert.deepEqual(staleReader.signals, ['SIGTERM']);
  assert.equal(h.state().quickCheckInFlight, true, 'the reader slot remains owned until exit');

  staleReader.emit('exit', 0);
  assert.doesNotThrow(h.open);
  h.advance(4_999);
  assert.equal(h.workers.length, 1);
  h.advance(1);
  assert.equal(h.workers.length, 2);
  assert.equal(h.workers[1].data.dataGeneration, h.state().dataGeneration);
  assert.equal(h.workers[1].data.includeQuickCheck, false);
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
