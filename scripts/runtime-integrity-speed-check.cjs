const assert = require("node:assert/strict");
const cp = require("node:child_process");
const { EventEmitter } = require("node:events");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const ts = require("typescript");
const vm = require("node:vm");
const { Worker: RealWorker } = require("node:worker_threads");
const Database = require("better-sqlite3");

const candidate = process.argv[2];
if (candidate !== "--working-tree" && !/^[a-f0-9]{40}$/u.test(candidate ?? "")) {
  throw new Error("Exact candidate SHA or --working-tree required");
}
const openPath = "src/modules/platform/server/database/open-platform-database.ts";
const migrationPath = "src/modules/platform/server/database/run-platform-migrations.ts";
const gitShow = (file) => candidate === "--working-tree" ? fs.readFileSync(file, "utf8") : cp.execFileSync("git", ["show", `${candidate}:${file}`], {
  encoding: "utf8",
  maxBuffer: 8 * 1024 * 1024,
});
const openSource = gitShow(openPath);
const migrationSource = gitShow(migrationPath);

function executableModuleBody(source, file) {
  const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  const printer = ts.createPrinter();
  const body = ast.statements
    .filter((statement) => !ts.isImportDeclaration(statement))
    .map((statement) => printer.printNode(ts.EmitHint.Unspecified, statement, ast))
    .join("\n");
  return ts.transpileModule(body, {
    compilerOptions: { module: ts.ModuleKind.None, target: ts.ScriptTarget.ES2022 },
  }).outputText;
}

function createHarness() {
  let now = 0;
  let schemaVersion = 1;
  const stats = new Map([
    ["test.sqlite", { dev: 1, ino: 2, mtimeMs: 1, size: 100 }],
  ]);
  const calls = [];
  const logs = { info: [], warn: [] };
  const timers = [];
  const workers = [];
  let throwWorkerConstruction = false;
  let throwSuccessLog = false;
  class FakeWorker extends EventEmitter {
    constructor(source, options) {
      super();
      if (throwWorkerConstruction) throw new Error("worker construction failed");
      this.source = source;
      this.options = options;
      this.terminated = false;
      workers.push(this);
    }
    unref() {}
    terminate() { this.terminated = true; return Promise.resolve(0); }
    emit(event, message) {
      // Normal results echo the selected scan mode. Explicit malformed payloads
      // remain malformed, and dedicated protocol cases override this value.
      if (event === "message" && message && "generation" in message) {
        message = { includeQuickCheck: this.options.workerData.includeQuickCheck, ...message };
      }
      return super.emit(event, message);
    }
  }
  class FakeDate extends Date { static now() { return now; } }
  const context = {
    Buffer,
    console: {
      info: (...values) => {
        if (throwSuccessLog) throw new Error("log unavailable");
        logs.info.push(values);
      },
      warn: (...values) => logs.warn.push(values),
    },
    Date: FakeDate,
    dirname: path.dirname,
    existsSync: (file) => stats.has(file),
    mkdirSync: () => {},
    platformFailure: (code, detail = {}) => { const error = new Error(code); error.code = code; error.detail = detail; throw error; },
    resolvePlatformDatabaseConfig: () => ({ databasePath: "test.sqlite" }),
    setTimeout: (fn, delay) => {
      const timer = { delay, fn, unref() {}, cleared: false };
      timers.push(timer);
      return timer;
    },
    clearTimeout: (timer) => { timer.cleared = true; },
    exports: {},
    module: { exports: {} },
    statSync: (file) => {
      const value = stats.get(file);
      if (!value) throw new Error("missing stat");
      return value;
    },
    validatePlatformDatabasePath: (value) => value,
    verifyCompletedPlatformDatabase: () => { calls.push("full"); },
    verifyPlatformDatabaseStructureAfterDataChange: () => { calls.push("light"); },
    Worker: FakeWorker,
  };
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(`${executableModuleBody(openSource, openPath)}\nthis.verify = verifyPlatformRuntimeDatabaseIntegrity;`, context);
  const database = { pragma: (name, options) => {
    if (name === "schema_version" && options?.simple) return schemaVersion;
    if (name === "schema_version") return [{ schema_version: schemaVersion }];
    return [];
  } };
  return {
    calls, database, logs, stats, timers, workers,
    setNow(value) { now = value; },
    setSchema(value) { schemaVersion = value; },
    seedLegacyEntry() {
      context.__traderlinkPlatformRuntimeDatabaseIntegrityFingerprints =
        new Map([["test.sqlite", "legacy-fingerprint"]]);
    },
    seedMixedEntries() {
      const other = { marker: "untouched" };
      context.__traderlinkPlatformRuntimeDatabaseIntegrityFingerprints = new Map([
        ["test.sqlite", "legacy-fingerprint"],
        ["other.sqlite", other],
      ]);
      return () =>
        context.__traderlinkPlatformRuntimeDatabaseIntegrityFingerprints.get("other.sqlite") === other;
    },
    setThrowWorker(value) { throwWorkerConstruction = value; },
    setThrowSuccessLog(value) { throwSuccessLog = value; },
    verify() { return context.verify(database, "test.sqlite"); },
  };
}

{
  const harness = createHarness();
  harness.verify();
  harness.stats.get("test.sqlite").mtimeMs = 2;
  harness.setNow(60_000);
  harness.setThrowSuccessLog(true);
  harness.verify();
  harness.workers[0].emit("message", {
    dataGeneration: 1,
    generation: 0,
    status: "ok",
    structureAfter: "1:2:1",
    structureBefore: "1:2:1",
  });
  assert.equal(harness.logs.info.length, 0);
  harness.setThrowSuccessLog(false);
  harness.stats.get("test.sqlite").mtimeMs = 3;
  harness.setNow(120_000);
  harness.verify();
  harness.workers[1].emit("message", {
    dataGeneration: 2,
    generation: 0,
    status: "ok",
    structureAfter: "1:2:1",
    structureBefore: "1:2:1",
  });
  assert.equal(harness.logs.info.length, 1);
}

{
  const harness = createHarness();
  harness.seedLegacyEntry();
  harness.verify();
  harness.verify();
  assert.deepEqual(harness.calls, ["full"]);
}

{
  const harness = createHarness();
  const otherEntryUnchanged = harness.seedMixedEntries();
  harness.verify();
  assert.equal(otherEntryUnchanged(), true);
  assert.deepEqual(harness.calls, ["full"]);
}

{
  const harness = createHarness();
  harness.verify();
  assert.deepEqual(harness.calls, ["full"]);
  harness.verify();
  assert.deepEqual(harness.calls, ["full"]);
  harness.stats.get("test.sqlite").mtimeMs = 2;
  harness.setNow(1_000);
  harness.verify();
  assert.deepEqual(harness.calls, ["full", "light"]);
  assert.equal(harness.timers.at(-1).delay, 4_000);
  harness.setNow(60_000);
  harness.timers.at(-1).fn();
  assert.equal(harness.workers.length, 1);
  harness.stats.get("test.sqlite").mtimeMs = 3;
  harness.verify();
  assert.deepEqual(harness.calls, ["full", "light", "light"]);
  harness.workers[0].emit("message", {
    dataGeneration: 1,
    generation: 0,
    status: "ok",
    structureAfter: "1:2:1",
    structureBefore: "1:2:1",
  });
  assert.equal(harness.logs.info.length, 1);
  assert.equal(harness.logs.info[0][1].durationMs, 0);
  assert.equal(harness.timers.at(-1).delay, 5_000);
  harness.setNow(120_000);
  harness.timers.at(-1).fn();
  harness.workers[1].emit("message", {
    dataGeneration: 2,
    generation: 0,
    status: "ok",
    structureAfter: "1:2:1",
    structureBefore: "1:2:1",
  });
  assert.equal(harness.logs.info.length, 1);
}

{
  const harness = createHarness();
  harness.verify();
  harness.stats.get("test.sqlite").mtimeMs = 2;
  harness.setNow(60_000);
  harness.verify();
  harness.workers[0].emit("message", {
    dataGeneration: 1,
    generation: 0,
    status: "integrity_failed",
    structureAfter: "1:2:1",
    structureBefore: "1:2:1",
  });
  assert.equal(harness.logs.warn[0][1].outcome, "integrity_failed");
  assert.throws(() => harness.verify(), (error) =>
    error.code === "TRADERLINK_PLATFORM_INTEGRITY_FAILED" && error.detail.check === "quick_check");
}

{
  const harness = createHarness();
  harness.verify();
  harness.stats.get("test.sqlite").mtimeMs = 2;
  harness.setNow(60_000);
  harness.verify();
  const staleWorker = harness.workers[0];
  harness.setSchema(2);
  harness.stats.get("test.sqlite").mtimeMs = 3;
  harness.verify();
  assert.deepEqual(harness.calls, ["full", "light", "full"]);
  staleWorker.emit("message", {
    dataGeneration: 1,
    generation: 0,
    status: "integrity_failed",
    structureAfter: "1:2:1",
    structureBefore: "1:2:1",
  });
  harness.verify();
  assert.deepEqual(harness.calls, ["full", "light", "full"]);
}

{
  const harness = createHarness();
  harness.verify();
  harness.stats.get("test.sqlite").ino = 9;
  harness.stats.get("test.sqlite").mtimeMs = 2;
  harness.verify();
  assert.deepEqual(harness.calls, ["full", "full"]);
}

for (const failure of ["worker_failed", "malformed", "null"]) {
  const harness = createHarness();
  harness.verify();
  harness.stats.get("test.sqlite").mtimeMs = 2;
  harness.setNow(60_000);
  harness.verify();
  harness.workers[0].emit("message", failure === "null" ? null : failure === "malformed" ? {} : {
    dataGeneration: 1,
    generation: 0,
    status: failure,
  });
  harness.verify();
  assert.deepEqual(harness.calls, ["full", "light", "full"]);
  assert.equal(harness.logs.warn[0][1].outcome, "worker_failed");
}

for (const failure of ["error", "exit", "timeout"]) {
  const harness = createHarness();
  harness.verify();
  harness.stats.get("test.sqlite").mtimeMs = 2;
  harness.setNow(60_000);
  harness.verify();
  if (failure === "error") harness.workers[0].emit("error", new Error("worker error"));
  if (failure === "exit") harness.workers[0].emit("exit", 0);
  if (failure === "timeout") {
    const timeout = harness.timers.find((timer) => timer.delay === 30_000);
    assert(timeout);
    timeout.fn();
    assert.equal(harness.workers[0].terminated, true);
  }
  harness.verify();
  assert.deepEqual(harness.calls, ["full", "light", "full"]);
}

{
  const harness = createHarness();
  harness.verify();
  harness.stats.get("test.sqlite").mtimeMs = 2;
  harness.setNow(60_000);
  harness.setThrowWorker(true);
  harness.verify();
  harness.setThrowWorker(false);
  harness.verify();
  assert.deepEqual(harness.calls, ["full", "light", "full"]);
  assert.equal(harness.logs.warn[0][1].outcome, "worker_construction_failed");
}

{
  const ast = ts.createSourceFile(migrationPath, migrationSource, ts.ScriptTarget.Latest, true);
  const internal = ast.statements.find((node) =>
    ts.isFunctionDeclaration(node) && node.name?.text === "verifyCompletedPlatformDatabaseUnmeasured");
  assert(internal);
  const printed = ts.createPrinter().printNode(ts.EmitHint.Unspecified, internal, ast);
  assert.match(printed, /if \(includeQuickCheck\)/u);
  assert.match(printed, /requirePlatformForeignKeyCheck/u);
  assert.match(printed, /requirePlatformQuickCheck/u);
  const run = (includeQuickCheck, includeForeignKeyCheck = true) => {
    const calls = [];
    const finalRow = { post_schema_sha256: "schema" };
    const values = {
      expectedPlatformTableNamesForPrefix: new Set(["table"]),
      listPlatformUserTableNames: ["table"],
      platformMigrationRegistryExists: true,
      readAppliedPlatformMigrations: [finalRow],
      requirePlatformSchemaDigest: "schema",
      validatePlatformMigrationManifest: [{}],
    };
    const names = [
      "validatePlatformMigrationManifest", "listPlatformUserTableNames",
      "platformMigrationRegistryExists", "readAppliedPlatformMigrations",
      "validateAppliedPlatformMigrationPrefix", "expectedPlatformTableNamesForPrefix",
      "requireOnlyExpectedPlatformTables", "requirePlatformSchemaDigest",
      "requirePlatformForeignKeyCheck", "requirePlatformQuickCheck",
    ];
    const context = {
      Object,
      measurePlatformRequestPhase: (_name, operation) => operation(),
      platformFailure: () => { throw new Error("unexpected failure"); },
    };
    for (const name of names) {
      context[name] = () => { calls.push(name); return values[name]; };
    }
    vm.createContext(context);
    vm.runInContext(`${ts.transpileModule(printed, {
      compilerOptions: { target: ts.ScriptTarget.ES2022 },
    }).outputText}\nthis.run = verifyCompletedPlatformDatabaseUnmeasured;`, context);
    context.run({}, [{}], includeQuickCheck, includeForeignKeyCheck);
    return calls;
  };
  const fullCalls = run(true);
  const lightCalls = run(false);
  assert.deepEqual(fullCalls, [
    "validatePlatformMigrationManifest", "listPlatformUserTableNames",
    "platformMigrationRegistryExists", "readAppliedPlatformMigrations",
    "validateAppliedPlatformMigrationPrefix", "expectedPlatformTableNamesForPrefix",
    "requireOnlyExpectedPlatformTables", "requirePlatformSchemaDigest",
    "requirePlatformForeignKeyCheck", "requirePlatformQuickCheck",
  ]);
  assert.deepEqual(lightCalls, fullCalls.slice(0, -1));
  assert.deepEqual(run(false, false), fullCalls.slice(0, -2));
}

// A five-second fixed FK deadline, independent of the sixty-second quick check.
{
  const h = createHarness();
  const reply = (worker, status = "ok") => worker.emit("message", {
    ...worker.options.workerData, status,
    structureBefore: "1:2:1", structureAfter: "1:2:1",
  });
  h.verify();
  h.setNow(1000); h.stats.get("test.sqlite").mtimeMs++; h.verify();
  const firstTimer = h.timers.at(-1);
  h.setNow(4000); h.stats.get("test.sqlite").mtimeMs++; h.verify();
  assert.equal(h.timers.at(-1), firstTimer, "writes cannot slide the FK deadline");
  h.setNow(5000); firstTimer.fn();
  assert.equal(h.workers[0].options.workerData.includeQuickCheck, false);
  reply(h.workers[0]);
  const quickTimer = h.timers.at(-1);
  assert.equal(quickTimer.delay, 55000);
  h.setNow(6000); h.stats.get("test.sqlite").mtimeMs++; h.verify();
  assert.equal(quickTimer.cleared, true, "earlier FK work advances pending quick timer");
  assert.equal(h.timers.at(-1).delay, 4000);
  h.setNow(10000); h.timers.at(-1).fn();
  h.stats.get("test.sqlite").mtimeMs++; h.verify();
  assert.equal(h.workers.length, 2, "no overlapping workers during new writes");
  reply(h.workers[1]);
  assert.equal(h.timers.at(-1).delay, 5000, "in-flight writes remain dirty");
  h.setNow(15000); h.timers.at(-1).fn(); reply(h.workers[2]);
  assert.equal(h.timers.at(-1).delay, 45000, "FK scans cannot postpone quick check");
  h.setNow(60000); h.timers.at(-1).fn();
  assert.equal(h.workers[3].options.workerData.includeQuickCheck, true);
  reply(h.workers[3]);
  const workerCount = h.workers.length;
  h.setNow(120000); h.verify();
  assert.equal(h.workers.length, workerCount, "unchanged database creates no scan loop");
}

for (const problem of ["foreign_key_failed", "wrong_generation", "wrong_structure", "wrong_mode"]) {
  const h = createHarness(); h.verify();
  h.setNow(5000); h.stats.get("test.sqlite").mtimeMs++; h.verify();
  const message = {
    ...h.workers[0].options.workerData, status: "ok",
    structureBefore: "1:2:1", structureAfter: "1:2:1",
  };
  if (problem === "foreign_key_failed") message.status = problem;
  if (problem === "wrong_generation") message.dataGeneration++;
  if (problem === "wrong_structure") message.structureAfter = "1:3:1";
  if (problem === "wrong_mode") message.includeQuickCheck = true;
  h.workers[0].emit("message", message);
  if (problem === "foreign_key_failed") {
    assert.throws(() => h.verify(), e => e.detail.check === "foreign_key_check");
    h.stats.get("test.sqlite").mtimeMs++;
    assert.throws(() => h.verify(), e => e.detail.check === "foreign_key_check");
  } else {
    h.verify(); assert.deepEqual(h.calls, ["full", "light", "full"]);
  }
}

async function verifyRealWorker() {
  const match = openSource.match(/PLATFORM_RUNTIME_QUICK_CHECK_WORKER_SOURCE = String\.raw`([\s\S]*?)`;\s*export type/u);
  assert(match, "worker source must remain extractable");
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "traderlink-integrity-proof-"));
  const databasePath = path.join(directory, "proof.sqlite");
  const database = new Database(databasePath);
  database.exec("CREATE TABLE proof (id INTEGER PRIMARY KEY, value TEXT NOT NULL); INSERT INTO proof(value) VALUES ('ok'); CREATE TABLE child (parent_id INTEGER REFERENCES proof(id))");
  database.close();
  const runWorker = (targetPath, dataGeneration, generation, includeQuickCheck = true) => new Promise((resolve, reject) => {
    const worker = new RealWorker(match[1], {
      eval: true,
      workerData: { databasePath: targetPath, dataGeneration, generation, includeQuickCheck },
    });
    worker.once("message", resolve);
    worker.once("error", reject);
  });
  const result = await runWorker(databasePath, 5, 7);
  const proof = new Database(databasePath, { readonly: true });
  assert.equal(proof.prepare("SELECT COUNT(*) AS count FROM proof").get().count, 1);
  proof.close();
  assert.equal(result.status, "ok");
  assert.equal(result.dataGeneration, 5);
  assert.equal(result.generation, 7);
  assert.equal(result.structureBefore, result.structureAfter);
  const enforcement = new Database(databasePath);
  enforcement.pragma("foreign_keys = ON");
  assert.throws(() => enforcement.prepare("INSERT INTO child VALUES (99)").run(), /FOREIGN KEY/u);
  enforcement.pragma("foreign_keys = OFF");
  enforcement.prepare("INSERT INTO child VALUES (99)").run();
  enforcement.close();
  const beforeScan = fs.readFileSync(databasePath);
  for (const includeQuickCheck of [false, true]) {
    const violation = await runWorker(databasePath, 6, 7, includeQuickCheck);
    assert.equal(violation.status, "foreign_key_failed");
    assert.equal(violation.includeQuickCheck, includeQuickCheck);
    assert.deepEqual(fs.readFileSync(databasePath), beforeScan, "worker must not modify database");
  }
  fs.rmSync(databasePath);

  const corruptPath = path.join(directory, "corrupt.sqlite");
  fs.writeFileSync(corruptPath, "not a sqlite database");
  const corruptResult = await runWorker(corruptPath, 6, 8);
  fs.rmSync(corruptPath, { force: true });
  assert.notEqual(corruptResult.status, "ok");
  assert.equal(corruptResult.dataGeneration, 6);
  assert.equal(corruptResult.generation, 8);
  fs.rmdirSync(directory);
}

verifyRealWorker().then(() => {
  console.log("PASS FK/quick fixed deadlines, overlap, sticky failures, stale/protocol results, worker fallback, unchanged full verifier, real read-only scans and write-time FK enforcement.");
});
