// Focused, serial Node tests: no app server, real database, providers or timers.
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
  let full = 0;
  let structure = 0;
  let fullError;
  let structureError;
  let constructionError;
  const timers = new Set();
  const workers = [];
  const db = { pragma: () => [{ schema_version: schema }] };
  const context = {
    exports: {},
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
      if (name === 'node:worker_threads') return { Worker: class extends EventEmitter {
        constructor(workerSource, options) {
          super();
          if (constructionError) throw constructionError;
          this.source = workerSource;
          this.data = options.workerData;
          this.terminated = false;
          workers.push(this);
        }
        unref() {}
        terminate() { this.terminated = true; return Promise.resolve(1); }
      } };
      if (name === 'better-sqlite3') return function Database() {};
      if (name === './platform-database-config') return {};
      if (name === './platform-migration-contract') return {
        platformFailure(code, detail) { throw Object.assign(new Error(code), detail); },
      };
      if (name === './run-platform-migrations') return {
        verifyCompletedPlatformDatabase() { full++; if (fullError) throw fullError; },
        verifyPlatformDatabaseStructureAfterDataChange() {
          structure++; if (structureError) throw structureError;
        },
      };
      throw new Error(`Unexpected import: ${name}`);
    },
  };
  runInNewContext(compiled, context);
  const open = () => context.exports.verifyPlatformRuntimeDatabaseIntegrity(db, '/test.sqlite');
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
  const message = (worker, overrides = {}) => worker.emit('message', {
    ...worker.data, status: 'ok', structureBefore: `1:${inode}:${schema}`,
    structureAfter: `1:${inode}:${schema}`, ...overrides,
  });
  const exit = (worker) => worker.emit('exit', 0);
  const finish = (worker, overrides) => { message(worker, overrides); exit(worker); };
  return {
    open, state, advance, workers, message, exit, finish,
    change() { modified++; },
    inode() { inode++; modified++; },
    schema() { schema++; },
    full: () => full,
    structure: () => structure,
    now: () => now,
    fullError: (value) => { fullError = value; },
    structureError: (value) => { structureError = value; },
    constructionError: (value) => { constructionError = value; },
  };
}

function scanning(quick = false) {
  const h = harness();
  h.open();
  h.advance(quick ? 60_000 : 5_000);
  h.change();
  h.open();
  assert.equal(h.workers.length, 1);
  return h;
}
const pending = (h) => assert.throws(h.open, (error) => error.check === 'background_verification_pending');

test('startup and identity/schema changes retain mandatory full verification', () => {
  const h = harness();
  h.fullError(new Error('startup integrity failure'));
  assert.throws(h.open, /startup integrity failure/);
  h.fullError(null);
  h.open(); h.open();
  assert.equal(h.full(), 2);
  h.inode(); h.open();
  h.schema(); h.open();
  assert.equal(h.full(), 4);
});

test('ordinary writes still validate registry/schema and reject a mismatch', () => {
  const h = harness(); h.open(); h.change();
  h.structureError(new Error('registry mismatch'));
  assert.throws(h.open, /registry mismatch/);
  assert.equal(h.structure(), 1);
  assert.equal(h.full(), 1);
});

for (const duration of [34_000, 102_000]) test(`healthy ${duration}ms scans stay off requests over repeated cycles`, () => {
  const h = scanning(true);
  for (let cycle = 0; cycle < 3; cycle++) {
    const worker = h.workers.at(-1);
    h.advance(duration);
    assert.equal(worker.terminated, false);
    h.change(); h.open(); h.open();
    h.finish(worker);
    assert.equal(h.state().retryPending, false);
    assert.equal(h.full(), 1);
    if (h.workers.at(-1) === worker) h.advance(60_000);
  }
});

test('timeout retains dirty work, fails fast, waits for exit and retries without a write', () => {
  const h = scanning(true);
  const worker = h.workers[0];
  h.advance(120_000);
  assert.equal(worker.terminated, true);
  assert.equal(h.state().quickCheckInFlight, true);
  assert.equal(h.state().dirtySinceForeignKeyCheck, true);
  assert.equal(h.state().dirtySinceQuickCheck, true);
  pending(h);
  assert.equal(h.full(), 1);
  h.advance(20_000);
  assert.equal(h.workers.length, 1);
  h.exit(worker);
  assert.equal(h.workers.length, 2);
  pending(h);
  h.finish(h.workers[1]);
  h.open();
  assert.equal(h.state().retryCount, 0);
  assert.equal(h.full(), 1);
});

test('a message alone never releases the single-flight worker slot', () => {
  const h = scanning(true);
  h.change(); h.open(); h.message(h.workers[0]);
  h.advance(70_000); h.open();
  assert.equal(h.workers.length, 1);
  h.exit(h.workers[0]);
  assert.equal(h.workers.length, 2);
});

test('retry succeeds while writes continue and preserves their pending checks', () => {
  const h = scanning(true);
  h.advance(120_000); h.exit(h.workers[0]); h.advance(5_000);
  const retryWorker = h.workers[1];
  h.change(); pending(h);
  assert.equal(h.state().dirtySinceQuickCheck, true);
  h.finish(retryWorker);
  h.open();
  assert.equal(h.state().retryPending, false);
  assert.equal(h.state().dirtySinceQuickCheck, true);
  h.advance(5_000);
  assert.equal(h.workers.length, 3);
  assert.equal(h.full(), 1);
});

for (const kind of ['construction', 'error', 'early-exit', 'malformed', 'worker-failed']) {
  test(`${kind} uses bounded retry rather than request-thread full verification`, () => {
    const h = harness(); h.open(); h.advance(60_000); h.change();
    if (kind === 'construction') h.constructionError(new Error('temporary'));
    if (kind === 'construction') pending({ open: h.open }); else h.open();
    const worker = h.workers[0];
    if (kind === 'error') worker.emit('error', new Error('temporary'));
    if (kind === 'early-exit') h.exit(worker);
    if (kind === 'malformed') worker.emit('message', {});
    if (kind === 'worker-failed') h.message(worker, { status: 'worker_failed' });
    pending(h);
    assert.equal(h.full(), 1);
    if (worker && kind !== 'early-exit') h.exit(worker);
    h.constructionError(null);
    const count = h.workers.length;
    h.advance(4_999); assert.equal(h.workers.length, count);
    h.advance(1); assert.equal(h.workers.length, count + 1);
    h.finish(h.workers.at(-1)); h.open();
  });
}

test('operational retries back off at 5/10/20/40/60 seconds with a cap', () => {
  const h = scanning(true);
  for (const delay of [5_000, 10_000, 20_000, 40_000, 60_000, 60_000]) {
    const worker = h.workers.at(-1);
    h.finish(worker, { status: 'worker_failed' });
    assert.equal(h.state().retryNotBefore - h.now(), delay);
    const count = h.workers.length;
    h.advance(delay - 1); assert.equal(h.workers.length, count);
    h.advance(1); assert.equal(h.workers.length, count + 1);
  }
});

for (const status of ['foreign_key_failed', 'integrity_failed']) test(`${status} latches fail-closed without retries`, () => {
  const h = scanning(false);
  h.finish(h.workers[0], { status });
  const check = status === 'foreign_key_failed' ? 'foreign_key_check' : 'quick_check';
  assert.throws(h.open, (error) => error.check === check);
  h.advance(600_000); h.change();
  assert.throws(h.open, (error) => error.check === check);
  assert.equal(h.workers.length, 1);
});

for (const code of ['SQLITE_CORRUPT', 'SQLITE_CORRUPT_INDEX', 'SQLITE_NOTADB']) {
  test(`${code} worker error remains corruption, not operational retry`, () => {
    const h = scanning();
    h.workers[0].emit('error', Object.assign(new Error('failed'), { code }));
    h.exit(h.workers[0]);
    assert.throws(h.open, (error) => error.check === 'quick_check');
    assert.equal(h.state().retryPending, false);
  });
}

test('explicit worker identity mismatch still requires full verification', () => {
  const h = scanning();
  h.finish(h.workers[0], { structureAfter: 'different' });
  h.open(); assert.equal(h.full(), 2);
});

test('old generation cannot clear new state or release its slot before actual exit', () => {
  const h = scanning(true);
  const old = h.workers[0];
  h.inode(); h.open();
  assert.equal(old.terminated, true);
  assert.equal(h.state().quickCheckInFlight, true);
  h.advance(60_000); h.change(); h.open();
  h.message(old, { status: 'integrity_failed' });
  assert.equal(h.state().quickCheckFailed, false);
  assert.equal(h.workers.length, 1);
  h.exit(old);
  assert.equal(h.workers.length, 2);
  h.finish(h.workers[1]); h.open();
  assert.equal(h.full(), 2);
});

test('worker source classifies SQLite corruption and retains earlier FK failure', () => {
  const h = scanning(true);
  const worker = h.workers[0];
  for (const sample of [
    { code: 'SQLITE_BUSY', fk: false, expected: 'worker_failed' },
    { code: 'SQLITE_CORRUPT', fk: false, expected: 'integrity_failed' },
    { code: 'SQLITE_NOTADB', fk: false, expected: 'integrity_failed' },
    { code: 'SQLITE_BUSY', fk: true, expected: 'foreign_key_failed' },
  ]) {
    let result;
    let closed = false;
    runInNewContext(worker.source, { require(name) {
      if (name === 'node:worker_threads') return {
        workerData: worker.data, parentPort: { postMessage(value) { result = value; } },
      };
      if (name === 'node:fs') return { statSync: () => ({ dev: 1, ino: 1 }) };
      if (name === 'better-sqlite3') return class {
        exec() {}
        close() { closed = true; }
        pragma(name) {
          if (name === 'schema_version') return 1;
          if (name === 'foreign_key_check') return sample.fk ? [{}] : [];
          if (name === 'quick_check') throw Object.assign(new Error('scan'), { code: sample.code });
        }
      };
      throw new Error(name);
    } });
    assert.equal(result.status, sample.expected);
    assert.equal(closed, true);
  }
});
