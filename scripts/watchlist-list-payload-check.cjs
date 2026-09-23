// Small, dependency-light contract proof. No server, browser or live database.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const cp = require("node:child_process");
const vm = require("node:vm");
const ts = require("typescript");
const root = path.resolve(__dirname, "..");
const base = process.argv[2];
if (!/^[a-f0-9]{40}$/.test(base || "")) throw new Error("Exact production comparison SHA required");
const cache = new Map();
const read = file => fs.readFileSync(path.join(root, file), "utf8");
function evaluate(source, filename, imports = {}) {
  const module = { exports: {} };
  const code = ts.transpileModule(source, { fileName: filename, compilerOptions: {
    target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX,
  } }).outputText;
  vm.runInNewContext(code, { module, exports: module.exports, URL, console,
    require: id => {
      if (id in imports) return imports[id];
      const file = id.startsWith("@/") ? id.slice(2) : path.join(path.dirname(filename), id);
      return load(file.replaceAll("\\", "/") + ".ts");
    },
  }, { filename });
  return module.exports;
}
function load(file) {
  if (!cache.has(file)) cache.set(file, evaluate(read(file), file));
  return cache.get(file);
}
const folder = "src/lib/live-watchlist/";
const list = load(folder + "live-watchlist-list.ts");
const full = load(folder + "live-watchlist-reconciliation.ts");
const clean = value => JSON.parse(JSON.stringify(value));
const card = (updatedAt, country) => ({ title: "Company", body: "detail ".repeat(2000),
  updatedAt, source: "fixture", priceWhenPosted: 1, metadata: { country } });
const fixtures = Array.from({ length: 18 }, (_, n) => ({
  symbol: "QA", status: n === 17 ? "deactivated" : "live", updatedAt: 1000 + n * 100,
  firstPostedAt: n % 2 ? 800 : null, marketDataRevision: n % 3 ? n % 4 : undefined,
  latestPriceObservedAt: n % 2 ? n * 200 : undefined, latestPrice: n % 3 ? n / 10 : null,
  watchlistGroup: ["main", "postmarket", "top_regular"][n % 3],
  watchlistSlotState: n % 2 ? "followup" : "active", reversalWatchEligible: true,
  reversalWatchAttemptReady: n % 2 === 0, reversalWatchlistVisible: n % 3 !== 0,
  topRegularWatchlistVisible: n % 4 !== 0, watchlistLifecycleLabelsVisible: n % 2 === 0,
  watchlistLifecycle: { status: n % 2 ? "monitoring" : "recovery_attempt",
    label: n % 2 ? "Analysis Pending" : "Recovery Attempt", reason: "fixture", updatedAt: 800 },
  companyName: "QA", nearestSupport: null, nearestResistance: null, latestTraderReadHeadline: null,
  levelMap: { detail: "levels ".repeat(2000) },
  cards: n % 3 ? { companyInfo: card(n % 2 ? 5000 - n : n, ["US", "CA", null][n % 3]) } : {},
}));
let comparisons = 0;
for (const current of fixtures) for (const incoming of fixtures) {
  const expected = list.projectLiveWatchlistListSymbol(full.reconcileLiveWatchlistSymbolState(current, incoming));
  const actual = list.reconcileLiveWatchlistListSnapshot({
    current: [list.projectLiveWatchlistListSymbol(current)],
    incoming: [list.projectLiveWatchlistListSymbol(incoming)], generatedAt: 9000,
  })[0];
  assert.deepEqual(clean(actual), clean(expected)); comparisons++;
}
for (const generatedAt of [0, 1000, 9999]) {
  const input = { current: fixtures.slice(0, 2), incoming: [], generatedAt };
  assert.deepEqual(clean(list.reconcileLiveWatchlistListSnapshot({ ...input,
    current: input.current.map(list.projectLiveWatchlistListSymbol),
  })), clean(full.reconcileLiveWatchlistSnapshot(input).map(list.projectLiveWatchlistListSymbol)));
}

const clientPath = "app/watchlist/live-watchlist-client.tsx";
const original = cp.execFileSync("git", ["show", `${base}:${clientPath}`], { cwd: root, encoding: "utf8" });
const functions = new Set(["formatPrice", "formatDate", "formatDateTime", "formatTime", "isPostmarketAddition",
  "WatchlistLifecycleBadge", "ReversalAttemptBadge", "WatchlistTickerTable", "LiveWatchlistIndexClient",
  "symbolActivationSortTime", "sortSymbolsByActivation", "mergeSymbol"]);
const constants = new Set(["watchlistDateFormatter", "watchlistTimeFormatter", "watchlistTimeCellStyle"]);
function renderModule(source) {
  const ast = ts.createSourceFile(clientPath, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const body = ast.statements.filter(node => ts.isImportDeclaration(node) ||
    (ts.isFunctionDeclaration(node) && functions.has(node.name?.text)) ||
    (ts.isVariableStatement(node) && node.declarationList.declarations.some(d => constants.has(d.name.text))))
    .map(node => ts.createPrinter().printNode(ts.EmitHint.Unspecified, node, ast)).join("\n");
  const jsx = (type, props, key) => typeof type === "function" ? type(props) : { type, props, key };
  const imports = {
    react: { useState: value => [value, () => {}], useEffect: () => {} },
    "react/jsx-runtime": { jsx, jsxs: jsx, Fragment: "fragment" },
    "next/link": { default: props => ({ type: "Link", props }) },
  };
  // Keep the actual pure helpers; unused detail-component imports are not executed.
  for (const node of ast.statements.filter(ts.isImportDeclaration)) {
    const id = node.moduleSpecifier.text;
    if (!(id in imports) && !/live-watchlist-(list|reconciliation|session-group|labels)$|watchlist-country-flag$/.test(id)) {
      imports[id] = {};
    }
  }
  return evaluate(body, clientPath, imports);
}
const oldClient = renderModule(original), newClient = renderModule(read(clientPath));
const payload = symbols => ({ generatedAt: 10000, marketDataStatus: "live", marketDataUpdatedAt: 9000, symbols });
for (const symbols of [[], ...fixtures.map(s => [s]), fixtures.slice(0, 6)]) {
  const state = payload(symbols);
  const compact = list.projectLiveWatchlistList(state);
  assert.deepEqual(clean(newClient.LiveWatchlistIndexClient({ initialState: compact })),
    clean(oldClient.LiveWatchlistIndexClient({ initialState: state })));
  assert.deepEqual(clean(list.projectLiveWatchlistList(compact)), clean(compact), "compact normalization is idempotent");
}
for (const current of fixtures) for (const incoming of fixtures) {
  assert.deepEqual(clean(list.mergeLiveWatchlistListSymbol(
    [list.projectLiveWatchlistListSymbol(current)], list.projectLiveWatchlistListSymbol(incoming))),
  clean(oldClient.mergeSymbol([current], incoming).map(list.projectLiveWatchlistListSymbol)));
}
const synthetic = payload(fixtures.slice(0, 6));
const compact = list.projectLiveWatchlistList(synthetic);
assert(compact.symbols.every(s => !("cards" in s) && !("levelMap" in s)));
const before = Buffer.byteLength(JSON.stringify(synthetic));
const after = Buffer.byteLength(JSON.stringify(compact));
assert(after < before / 2);

async function checkRoute() {
  let allowed = true, reads = 0;
  const route = evaluate(read("app/api/live-watchlist/route.ts"), "app/api/live-watchlist/route.ts", {
    "next/server": { NextResponse: { json: (data, options) => ({ data, options }) } },
    "@/src/lib/live-watchlist/live-watchlist-auth": {
      authorizeWatchlistMemberRequest: async () => allowed ? { ok: true } : { ok: false, error: "denied", status: 403 },
    },
    "@/src/lib/live-watchlist/live-watchlist-store": {
      LiveWatchlistStore: class { async listSymbols() { reads++; return synthetic; } },
    },
    "@/src/modules/platform/server/observability/platform-request-timing": {
      measurePlatformRequestPhase: (_, run) => run(), measurePlatformRequestPhaseAsync: (_, run) => run(),
      withPlatformRequestTiming: run => run(),
    },
  });
  for (const query of ["", "?view=unknown", "?view=list"]) {
    const result = await route.GET({ nextUrl: new URL("https://example.invalid/api/live-watchlist" + query) });
    assert.deepEqual(clean(result.data), clean(query === "?view=list" ? compact : synthetic));
    assert.equal(result.options.headers["Cache-Control"], "private, no-store");
  }
  allowed = false;
  const beforeDenied = reads;
  const denied = await route.GET({ nextUrl: new URL("https://example.invalid/api/live-watchlist?view=list") });
  assert.equal(denied.options.status, 403); assert.equal(reads, beforeDenied);
  console.log(`PASS ${comparisons} reconciliation pairs, 324 stream merges, 20 list element-tree comparisons, deletion, legacy/compact/auth/no-store routes; synthetic payload ${before} -> ${after} bytes. Not browser or live measurements.`);
}
checkRoute().catch(error => { console.error(error); process.exitCode = 1; });
