// Read an immutable Git tree without a checkout, server, or provider connection.
const cp = require("node:child_process");
const path = require("node:path");
const fs = require("node:fs");
const ts = require("typescript");
const Module = require("node:module");
const root = process.cwd();
const tree = process.argv[2];
const mode = process.argv[3] || "types";
if (!/^[a-f0-9]{40}$/.test(tree || "")) throw Error("An exact Git tree is required.");
function git(...args) { return cp.execFileSync("git", args, { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 }); }
const blobs = new Map(git("ls-tree", "-r", tree).trim().split("\n").map(line => {
  const tab = line.indexOf("\t");
  return [line.slice(tab + 1), line.slice(0, tab).split(" ")[2]];
}));
const cache = new Map();
function relative(file) { return path.relative(root, path.resolve(file)).replaceAll("\\", "/"); }
function read(file) {
  const key = relative(file);
  if (!blobs.has(key)) return undefined;
  if (!cache.has(key)) cache.set(key, git("cat-file", "blob", blobs.get(key)));
  return cache.get(key);
}
const files = [...blobs.keys()];
const directories = new Set([""]);
for (const file of files) {
  let directory = path.posix.dirname(file);
  while (directory !== ".") { directories.add(directory); directory = path.posix.dirname(directory); }
}
function external(file) { const key = relative(file); return key.startsWith("../") || key === "node_modules" || key.includes("node_modules/"); }
const exists = file => external(file) ? fs.existsSync(file) : blobs.has(relative(file));
if (mode === "types") {
  const config = ts.parseConfigFileTextToJson("tsconfig.json", read("tsconfig.json")).config;
  const parsed = ts.parseJsonConfigFileContent(config, ts.sys, root);
  const options = { ...parsed.options, noEmit: true, incremental: false, types: ["node", "react"], skipLibCheck: true };
  const host = ts.createCompilerHost(options);
  host.fileExists = exists;
  host.readFile = file => external(file) ? ts.sys.readFile(file) : read(file);
  host.directoryExists = file => external(file) ? ts.sys.directoryExists(file) : directories.has(relative(file));
  host.getSourceFile = (file, languageVersion) => {
    const content = host.readFile(file);
    return content === undefined ? undefined : ts.createSourceFile(file, content, languageVersion);
  };
  const roots = files.filter(file => (
    file.startsWith("app/admin/journal/memberships/unified-plan-") ||
    file.startsWith("src/scripts/verify-membership-plan-") ||
    file === "src/scripts/verify-membership-discord-editor.ts" ||
    file === "app/admin/journal/memberships/page.tsx" ||
    file === "app/(dashboard)/account/preferences/page.tsx" ||
    file === "src/modules/news/server/market-halt-web-push-repository.ts" ||
    file === "src/modules/news/server/press-release-web-push-repository.ts" ||
    file === "src/modules/watchlist/server/notifications/watchlist-notification-runtime.ts" ||
    file === "src/modules/watchlist/server/notifications/watchlist-category-move-notifications.ts"
  ) && /\.tsx?$/.test(file));
  const program = ts.createProgram(roots, options, host);
  const diagnostics = [...parsed.errors, ...ts.getPreEmitDiagnostics(program)];
  for (const diagnostic of diagnostics) {
    const location = diagnostic.file && diagnostic.start !== undefined
      ? diagnostic.file.fileName + ":" + (diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start).line + 1) : "config";
    console.log(location + " " + ts.flattenDiagnosticMessageText(diagnostic.messageText, " "));
  }
  console.log(JSON.stringify({ tree, roots: roots.length, sourceBlobsRead: cache.size, diagnostics: diagnostics.length }));
  process.exitCode = diagnostics.length ? 1 : 0;
} else if (mode === "lint") {
  const { ESLint } = require("eslint");
  const changed = git("diff", "--name-only", "71e9aa2a05ba2b36406cb07d699f584557c54cda", tree)
    .trim().split("\n").filter(file => /\.(ts|tsx|cjs)$/.test(file));
  (async () => {
    const eslint = new ESLint();
    let errors = 0;
    let warnings = 0;
    for (const file of changed) {
      const results = await eslint.lintText(read(file), { filePath: path.join(root, file) });
      for (const result of results) {
        errors += result.errorCount; warnings += result.warningCount;
        for (const message of result.messages) console.log(file + ":" + message.line + " " + message.message);
      }
    }
    console.log(JSON.stringify({ tree, files: changed.length, errors, warnings }));
    process.exitCode = errors ? 1 : 0;
  })().catch(error => { console.error(error); process.exitCode = 1; });
} else if (mode === "proof" || mode === "schema") {
  const originalResolve = Module._resolveFilename;
  const originalLoad = Module._load;
  Module._resolveFilename = function(request, parent, ...args) {
    const base = request.startsWith("@/") ? path.join(root, request.slice(2))
      : request.startsWith(".") && parent ? path.resolve(path.dirname(parent.filename), request) : null;
    if (base) for (const suffix of ["", ".ts", ".tsx", ".js", ".cjs", ".json", "/index.ts", "/index.tsx"]) {
      if (blobs.has(relative(base + suffix))) return base + suffix;
    }
    return originalResolve.call(this, request, parent, ...args);
  };
  Module._load = function(request, ...args) {
    if (request === "server-only") return {};
    if (request.endsWith(".module.css")) return { __esModule: true, default: new Proxy({}, { get: (_, key) => String(key) }) };
    if (request === "./unified-plan-discord-actions") return { loadPlanDiscordChoices: async () => { throw Error("No Discord calls in SSR"); } };
    return originalLoad.call(this, request, ...args);
  };
  for (const extension of [".ts", ".tsx"]) Module._extensions[extension] = (module, file) => {
    const source = read(file);
    if (source === undefined) throw Error("Missing exact-candidate source: " + file);
    const commonJsSource = source.replaceAll("import.meta.url", JSON.stringify(require("node:url").pathToFileURL(file).href));
    module._compile(ts.transpileModule(commonJsSource, { compilerOptions: {
      target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    }, fileName: file }).outputText, file);
  };
  if (mode === "schema") {
    const assert = require("node:assert/strict");
    const Database = require("better-sqlite3");
    const { platformMigrationManifest } = require(path.join(root, "src/modules/platform/server/database/platform-migration-manifest.ts"));
    const database = new Database(":memory:");
    try {
      for (const migration of platformMigrationManifest) {
        database.pragma("foreign_keys=" + (migration.requiresForeignKeysDisabled ? "OFF" : "ON"));
        try { database.transaction(() => migration.statements.forEach(sql => database.exec(sql)))(); }
        catch (error) { throw Error(migration.migrationId + ": " + error.message); }
      }
      database.pragma("foreign_keys=ON");
      assert.deepEqual(database.pragma("foreign_key_check"), []);
      const latest = platformMigrationManifest.at(-1);
      assert.equal(latest.migrationId, "0165_platform_membership_unified_editor");
      assert.equal(latest.executionOrder, 178);
      console.log(JSON.stringify({ tree, ok: true, migrations: platformMigrationManifest.length, latest: latest.migrationId,
        boundary: "empty in-memory migration replay, not a production-data upgrade", networkCalls: 0 }));
    } finally { database.close(); }
  } else {
    global.React = require("react");
    require(path.join(root, "src/scripts/verify-membership-plan-editor.ts"));
    require(path.join(root, "src/scripts/verify-membership-discord-editor.ts"));
    require(path.join(root, "src/scripts/verify-membership-plan-ui.tsx"));
  }
} else throw Error("Choose types, lint, proof or schema.");
