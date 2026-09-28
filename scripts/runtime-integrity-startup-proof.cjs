// Focused source proof. No real SQLite, child processes, timers or application server.
// node scripts/runtime-integrity-startup-proof.cjs <exact-commit>
// Before checkpointing: <exact-base> <allowlisted-source-root>
const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const { EventEmitter } = require("node:events");
const { existsSync, readFileSync } = require("node:fs");
const { join } = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const revision = process.argv[2];
const sourceRoot = process.argv[3];
assert.match(revision ?? "", /^[a-f0-9]{40}$/u);
const folder = "src/modules/platform/server/database/";
const read = (file) => sourceRoot && existsSync(join(sourceRoot, file))
  ? readFileSync(join(sourceRoot, file), "utf8")
  : execFileSync("git", ["show", `${revision}:${file}`], { encoding: "utf8" });
const source = read(`${folder}open-platform-database.ts`);
const readonlySource = read(`${folder}open-readonly-platform-database.ts`);
const compile = (value) => ts.transpileModule(value, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
}).outputText;

function harness({ structureFailure = false, spawnFailure = false } = {}) {
  let now = 1_000;
  let inode = 2;
  let structures = 0;
  const timers = new Set();
  const children = [];
  const logs = [];
  const pragmas = { schema_version: 1, foreign_keys: 1, busy_timeout: 5000, journal_mode: "wal", synchronous: 1 };
  class Database {
    pragma(name) {
      assert.ok(!["foreign_key_check", "quick_check"].includes(name), "no main-thread full scan");
      return [{ value: pragmas[name] }];
    }
    close() {}
  }
  const context = {
    exports: {}, process: { execPath: "/node", env: {} }, Date: { now: () => now },
    console: { info: (...args) => logs.push(args), warn: (...args) => logs.push(args) },
    setTimeout(callback, delay) {
      const timer = { callback, due: now + delay, unref() {} };
      timers.add(timer); return timer;
    },
    clearTimeout(timer) { timers.delete(timer); },
    require(name) {
      if (name === "node:fs") return { existsSync: () => true, statSync: () => ({ dev: 1, ino: inode, size: 100, mtimeMs: 1 }) };
      if (name === "node:path") return require(name);
      if (name === "better-sqlite3") return Database;
      if (name === "./platform-database-config") return { validatePlatformDatabasePath: (p) => p };
      if (name === "./platform-migration-contract") return {
        platformFailure(code, details) { throw Object.assign(new Error(code), details); },
      };
      if (name === "./run-platform-migrations") return {
        verifyCompletedPlatformDatabase() { throw new Error("synchronous full scan forbidden on first open"); },
        verifyPlatformDatabaseStructureAfterDataChange() {
          structures++;
          if (structureFailure) throw new Error("invalid structure");
        },
      };
      if (name === "node:child_process") return { spawn() {
        if (spawnFailure) throw new Error("spawn unavailable");
        const child = new EventEmitter();
        child.send = (data, callback) => { child.data = data; callback(null); };
        child.unref = () => {};
        child.channel = { unref() {} };
        child.kill = () => true;
        children.push(child); return child;
      } };
      throw new Error(`Unexpected import: ${name}`);
    },
  };
  vm.runInNewContext(compile(source), context);
  const moduleExports = context.exports;
  const readonlyContext = { exports: {}, require: (name) => name === "./open-platform-database" ? moduleExports : context.require(name) };
  vm.runInNewContext(compile(readonlySource), readonlyContext);
  const open = () => readonlyContext.exports.openReadonlyPlatformDatabase({ databasePath: "/test.sqlite" }).close();
  const state = () => context.__traderlinkPlatformRuntimeDatabaseIntegrityFingerprints.get("/test.sqlite");
  const advance = (duration) => {
    const until = now + duration;
    for (;;) {
      const timer = [...timers].filter((t) => t.due <= until).sort((a, b) => a.due - b.due)[0];
      if (!timer) break;
      timers.delete(timer); now = timer.due; timer.callback();
    }
    now = until;
  };
  const send = (payload) => children[0].emit("message", { ...children[0].data, kind: "result", ...payload });
  return { open, state, children, timers, logs, advance, send, structures: () => structures, replaceFile: () => inode++ };
}

{
  const h = harness();
  h.open(); h.open();
  assert.equal(h.structures(), 1);
  assert.equal(h.children.length, 0, "health-path opener returns before scan launch");
  assert.equal(h.timers.size, 1, "first-open scheduling is single flight");
  assert.ok(h.state().dirtySinceQuickCheck);
  assert.ok(!h.logs.some(([message]) => message.includes("baseline verified")));
  h.advance(0);
  assert.equal(h.children.length, 1);
  assert.equal(h.children[0].data.includeQuickCheck, true);
  for (let i = 0; i < 10; i++) h.open();
  assert.equal(h.children.length, 1, "repeated health opens cannot duplicate scan");
  h.send({ kind: "foreign_key_complete", structureBefore: "1:2:1", foreignKeyDurationMs: 0, quickCheckStartedAt: 1000 });
  h.send({ status: "ok", structureBefore: "1:2:1", structureAfter: "1:2:1" });
  assert.equal(h.state().quickCheckInFlight, true, "result is not process exit");
  h.children[0].emit("exit", 0);
  h.advance(60_000); h.open();
  assert.equal(h.children.length, 1, "unchanged DB does not rescan after success");
}
for (const failure of ["foreign_key_failed", "integrity_failed"]) {
  const h = harness(); h.open(); h.advance(0); h.send({ status: failure });
  assert.throws(h.open, /TRADERLINK_PLATFORM_INTEGRITY_FAILED/);
  h.children[0].emit("exit", 0);
  assert.throws(h.open, /TRADERLINK_PLATFORM_INTEGRITY_FAILED/, "failure remains latched after exit");
}
{
  const h = harness({ structureFailure: true });
  assert.throws(h.open, /invalid structure/);
  assert.equal(h.children.length, 0); assert.equal(h.timers.size, 0);
}
{
  const h = harness({ spawnFailure: true }); h.open(); h.advance(0);
  assert.equal(h.state().retryPending, true);
  assert.ok(h.state().retryNotBefore > 1000);
  h.open(); assert.equal(h.timers.size, 1, "construction failure retries without duplicate timers");
}
{
  const h = harness(); h.open(); h.advance(0); h.advance(120_000);
  h.open(); assert.equal(h.children.length, 1, "timeout cannot free occupied reader slot");
  h.send({ status: "integrity_failed" });
  assert.throws(h.open, /TRADERLINK_PLATFORM_INTEGRITY_FAILED/, "late actual failure still latches");
}
{
  const h = harness(); h.open(); h.advance(0); h.replaceFile();
  assert.throws(h.open, /TRADERLINK_PLATFORM_INTEGRITY_FAILED/);
  h.send({ status: "ok", structureBefore: "1:2:1", structureAfter: "1:2:1" });
  assert.equal(h.state().requiresFullVerification, true);
  assert.equal(h.children.length, 1, "identity recovery cannot overlap old child");
}

// The structure gate still delegates to the complete manifest/registry/schema
// validator while excluding just the two database-wide scans.
const migrations = read(`${folder}run-platform-migrations.ts`);
assert.match(migrations, /function verifyPlatformDatabaseStructureAfterDataChange[\s\S]*?verifyCompletedPlatformDatabaseUnmeasured\(database, manifestInput, false, false\)/u);
for (const guard of ["validatePlatformMigrationManifest", "validateAppliedPlatformMigrationPrefix", "requireOnlyExpectedPlatformTables", "requirePlatformSchemaDigest"]) {
  assert.ok(migrations.includes(guard));
}
console.log("PASS: first-open deferred combined scan, health-path opener, coalescing, structural rejection, corruption latching, retry, timeout occupancy, identity guards. Simulated source proof only.");
