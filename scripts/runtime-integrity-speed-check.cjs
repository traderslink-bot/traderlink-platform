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
if (!/^[a-f0-9]{40}$/u.test(candidate ?? "")) {
  throw new Error("Exact candidate SHA required");
}
const openPath = "src/modules/platform/server/database/open-platform-database.ts";
const migrationPath = "src/modules/platform/server/database/run-platform-migrations.ts";
const gitShow = (file) => cp.execFileSync("git", ["show", `${candidate}:${file}`], {
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
    verifyPlatformDatabaseAfterDataChange: () => { calls.push("light"); },
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
  assert.equal(harness.timers.at(-1).delay, 59_000);
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
  assert.equal(harness.timers.at(-1).delay, 60_000);
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

for (const failure of ["worker_failed", "malformed"]) {
  const harness = createHarness();
  harness.verify();
  harness.stats.get("test.sqlite").mtimeMs = 2;
  harness.setNow(60_000);
  harness.verify();
  harness.workers[0].emit("message", failure === "malformed" ? {} : {
    generation: 0,
    status: failure,
  });
  harness.verify();
  assert.deepEqual(harness.calls, ["full", "light", "full"]);
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
  const run = (includeQuickCheck) => {
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
    context.run({}, [{}], includeQuickCheck);
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
}

async function verifyRealWorker() {
  const match = openSource.match(/PLATFORM_RUNTIME_QUICK_CHECK_WORKER_SOURCE = String\.raw`([\s\S]*?)`;\s*export type/u);
  assert(match, "worker source must remain extractable");
  const databasePath = path.join(os.tmpdir(), `traderlink-quick-check-${process.pid}.sqlite`);
  if (fs.existsSync(databasePath)) fs.rmSync(databasePath, { force: true });
  const database = new Database(databasePath);
  database.exec("CREATE TABLE proof (id INTEGER PRIMARY KEY, value TEXT NOT NULL); INSERT INTO proof(value) VALUES ('ok')");
  database.close();
  const runWorker = (targetPath, dataGeneration, generation) => new Promise((resolve, reject) => {
    const worker = new RealWorker(match[1], {
      eval: true,
      workerData: { databasePath: targetPath, dataGeneration, generation },
    });
    worker.once("message", resolve);
    worker.once("error", reject);
  });
  const result = await runWorker(databasePath, 5, 7);
  const proof = new Database(databasePath, { readonly: true });
  assert.equal(proof.prepare("SELECT COUNT(*) AS count FROM proof").get().count, 1);
  proof.close();
  fs.rmSync(databasePath, { force: true });
  assert.equal(result.status, "ok");
  assert.equal(result.dataGeneration, 5);
  assert.equal(result.generation, 7);
  assert.equal(result.structureBefore, result.structureAfter);

  const corruptPath = path.join(os.tmpdir(), `traderlink-quick-check-corrupt-${process.pid}.sqlite`);
  fs.writeFileSync(corruptPath, "not a sqlite database");
  const corruptResult = await runWorker(corruptPath, 6, 8);
  fs.rmSync(corruptPath, { force: true });
  assert.notEqual(corruptResult.status, "ok");
  assert.equal(corruptResult.dataGeneration, 6);
  assert.equal(corruptResult.generation, 8);
}

verifyRealWorker().then(() => {
  console.log("PASS fixed scheduling, overlap, sticky failure, stale result, worker fallback and real readonly quick-check worker.");
});
