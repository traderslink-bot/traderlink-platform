import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
const require = createRequire("C:/Users/jerac/Documents/TraderLink/traderlink-platform/package.json");
const ts = require("typescript");
const kinds = ["vwap-reclaim-hold", "ema9-pullback-bounce", "ema20-pullback-bounce", "higher-low-reversal"];
const identity = "00000000-0000-4000-8000-000000000001";
let assertions = 0;
const equal = (a, b) => { assert.deepEqual(a, b); assertions++; };
const flush = async () => { for (let i = 0; i < 6; i++) await new Promise(resolve => setImmediate(resolve)); };

// Small deterministic hook/element driver executes the actual component and its
// handlers/effects without an app server. MUI wrappers and browser APIs are doubles;
// this is not browser layout, paint, portal or production authentication acceptance.
async function component(file, name, fetcher, props = {}) {
  const source = await readFile(file, "utf8");
  const values = [], effects = [], intervals = new Map(), timeouts = new Map(), listeners = new Map();
  let cursor = 0, serial = 0, now = 1791547205000;
  const document = { hidden: false, addEventListener: (key, fn) => listeners.set(key, fn), removeEventListener: key => listeners.delete(key) };
  const hooks = {
    useId: () => "offline-card",
    useState: initial => { const index = cursor++; if (!(index in values)) values[index] = initial;
      return [values[index], next => { values[index] = typeof next === "function" ? next(values[index]) : next; }]; },
    useRef: initial => { const index = cursor++; return values[index] ??= { current: initial }; },
    useEffect: (effect, dependencies) => {
      const index = cursor++, prior = effects[index];
      if (!prior || dependencies.some((value, i) => value !== prior.dependencies[i])) {
        prior?.cleanup?.(); effects[index] = { effect, dependencies, pending: true };
      }
    },
  };
  const jsx = (type, props, key) => ({ type, props: props ?? {}, key });
  const module = { exports: {} };
  runInNewContext(ts.transpileModule(source, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, {
    module, exports: module.exports, require: specifier => {
      if (specifier === "react") return hooks;
      if (specifier === "react/jsx-runtime") return { jsx, jsxs: jsx, Fragment: "fragment" };
      if (specifier.endsWith("setup-contracts")) return { INITIAL_WATCHLIST_SETUP_KINDS: kinds };
      if (specifier === "./watchlist-setup-results-panel") return { default: () => null, __esModule: true };
      if (specifier.includes(".css")) return { default: new Proxy({}, { get: (_target, key) => String(key) }), __esModule: true };
      if (specifier.startsWith("@mui/")) return { default: specifier.split("/").at(-1), __esModule: true };
      throw Error(`Unexpected component dependency ${specifier}`);
    },
    fetch: fetcher, AbortController, Map, Set, Intl, encodeURIComponent, URLSearchParams,
    Date: class extends Date { static now() { return now; } }, document,
    window: { setTimeout: fn => { timeouts.set(++serial, fn); return serial; }, clearTimeout: id => timeouts.delete(id),
      setInterval: fn => { intervals.set(++serial, fn); return serial; }, clearInterval: id => intervals.delete(id) },
  });
  let tree;
  function expand(node) {
    if (Array.isArray(node)) return node.flatMap(expand);
    if (node === null || node === undefined || typeof node === "boolean") return [];
    if (typeof node !== "object") return [node];
    if (typeof node.type === "function") return expand(node.type(node.props));
    return [{ ...node, children: expand(node.props.children) }];
  }
  const render = () => { cursor = 0; tree = expand(module.exports[name](props));
    for (const record of effects) if (record?.pending) { record.pending = false; record.cleanup = record.effect(); }
    return tree; };
  const nodes = () => { const all = []; const visit = list => { for (const node of list) if (typeof node === "object") { all.push(node); visit(node.children); } }; visit(tree); return all; };
  const text = () => { const flat = list => list.map(node => typeof node === "object" ? flat(node.children) : String(node)).join(" "); return flat(tree); };
  render();
  return { render, nodes, text, document, intervals, listeners, setNow: value => { now = value; },
    unmount: () => { for (const record of effects) record?.cleanup?.(); }, values };
}

let calls = 0, snapshot, fail = false, lastSignal;
const now = 1791547205000;
const members = kinds.map((kind, index) => ({ id: kind, kind, formationFrame: kind === "higher-low-reversal" ? "1m" : "5m", triggerFrame: "1m",
  priceState: index === 0 ? "confirmed" : "forming", availability: index === 1 ? "unavailable" : "ready", evaluatedThrough: now - 5000,
  firstRecognizedAt: now, confirmedAt: index === 0 ? now - 5000 : null, deadlineAt: now + 600000, recentlyConfirmedUntil: now + 60000,
  summary: "Observed setup sequence", pendingCondition: "Later close pending", references: [],
  volume: { state: "unavailable", shares: null, ratio: null, baselineShares: null, baselineBars: 0, basis: "recent-minute-average", candleCompletedAt: now - 5000, knownAt: now } }));
snapshot = { version: "watchlist-setups-v1", symbol: "TEST", publicationIdentity: identity, monitoringEnabled: true,
  availability: "ready", dataThrough: now - 5000, groups: [{ id: "group", members }], dependencies: [{ kind: kinds[1], availability: "unavailable" }] };
const card = await component("app/watchlist/watchlist-setups-card.tsx", "WatchlistSetupsCard", async (_url, options) => {
  calls++; lastSignal = options.signal; return fail ? { status: 503, ok: false } : { status: 200, ok: true, json: async () => ({ snapshot }) };
}, { symbol: "TEST", publicationIdentity: identity });
await flush(); card.render(); equal(calls, 1); equal(card.text().includes("Trade Setups"), true);
equal(card.nodes().filter(node => node.type === "h3").length, 4); equal(card.text().includes("Volume unavailable"), true);
equal(card.text().includes("waiting for complete candle data"), true);
const help = card.nodes().find(node => node.type === "button" && node.props["aria-label"] === "About Trade Setups");
help.props.onClick(); card.render(); equal(card.nodes().find(node => node.type === "Tooltip").props.open, true);
card.nodes().find(node => node.props.onKeyDown).props.onKeyDown({ key: "Escape" }); card.render();
equal(card.nodes().find(node => node.type === "Tooltip").props.open, false);
card.document.hidden = true; for (const fn of card.intervals.values()) fn(); await flush(); equal(calls, 1);
card.document.hidden = false; fail = true; card.setNow(now + 180000); card.listeners.get("visibilitychange")(); await flush(); card.render();
equal(card.text().includes("Live detection unavailable"), true); equal(card.text().includes("Recently confirmed"), false);
fail = false; snapshot = null; for (const fn of card.intervals.values()) fn(); await flush(); card.render(); equal(card.nodes().length, 0);
card.unmount(); equal(card.intervals.size, 0); equal(card.listeners.size, 0); equal(lastSignal.aborted, false);

let controls = { configuration: { version: 1, revision: 1, settings: { enabled: false, enabledDetectors: kinds,
  sessions: ["premarket", "regular", "postmarket"], showMemberCard: true, notifyConfirmed: false, notifyForming: false }, tickerOverrides: {} },
  tickers: [{ symbol: "TEST", publicationIdentity: identity }], storage: { failure: null }, deliveryEnabled: false };
const writes = [];
const admin = await component("app/(dashboard)/admin/watchlist/watchlist-setup-admin-panel.tsx", "default", async (url, options = {}) => {
  if (options.method === "POST") { const body = JSON.parse(options.body); writes.push(body);
    return { ok: true, json: async () => ({ configuration: { ...body, revision: body.revision + 1 } }) }; }
  return { ok: true, json: async () => controls };
});
await flush(); admin.render(); equal(admin.text().includes("Setup Detection"), true);
equal(admin.nodes().filter(node => node.type === "input" && node.props.type === "checkbox").length, 9);
admin.nodes().find(node => node.type === "input").props.onChange({ target: { checked: true } }); admin.render();
admin.nodes().find(node => node.type === "select").props.onChange({ target: { value: "TEST" } }); admin.render();
equal(admin.text().includes("Detect setups for"), true);
const perTicker = admin.nodes().filter(node => node.type === "input").at(-1);
perTicker.props.onChange({ target: { checked: false } }); admin.render();
admin.nodes().find(node => node.type === "button" && node.children.includes("Save settings")).props.onClick();
admin.render(); equal(admin.nodes().find(node => node.type === "button" && node.children.includes("Saving…")).props.disabled, true);
await flush(); admin.render(); equal(writes.length, 1); equal(writes[0].settings.enabled, true);
equal(writes[0].tickerOverrides[identity], false); equal(writes[0].settings.notifyConfirmed, false); equal(admin.text().includes("Setup settings saved"), true);
admin.unmount();
let resultsCalls = 0, requestedUrl, heldResults, resultsSignal;
const resultsData = { version: "setup-follow-through-v1", minutes: 30, page: 1, pageSize: 25, total: 1,
  summary: kinds.map(kind => ({ kind, occurrences: 1, forming: 1, reclaimed: 0, confirmed: 1, failed: 0, expired: 0,
    outcomes: { "follow-through": 1, "low-lost-first": 0, neither: 0, developing: 0, unclear: 0, "missing-data": 0, "session-ended": 0 }, decided: 1, followThroughPct: 100 })),
  rows: [], coverage: { records: 2, unreadableRecords: 0, limited: false, oldestReceived: now, newestReceived: now } };
const results = await component("app/(dashboard)/admin/watchlist/watchlist-setup-results-panel.tsx", "default", async (url, options) => {
  resultsCalls++; requestedUrl = url; resultsSignal = options.signal;
  return new Promise(resolve => { heldResults = () => resolve({ ok: true, json: async () => resultsData }); });
});
equal(resultsCalls, 0); equal(results.text().includes("Setup Results"), true);
const loadResults = () => results.nodes().find(node => node.type === "button" && node.children.includes("Load results")).props.onClick();
loadResults(); loadResults(); results.render(); equal(resultsCalls, 1);
equal(results.nodes().find(node => node.type === "button").props.disabled, true);
heldResults(); await flush(); results.render();
equal(requestedUrl.includes("minutes=30"), true); equal(results.text().replace(/\s+/gu, " ").includes("1 unique setup occurrences"), true);
equal(results.nodes().filter(node => node.type === "table").length, 2);
equal(results.text().includes("100.0%"), true); equal(results.text().includes("lifetime history"), true);
results.nodes().find(node => node.type === "input").props.onChange({ target: { value: "TEST" } }); results.render();
equal(results.nodes().filter(node => node.type === "table").length, 0);
loadResults(); results.unmount(); equal(resultsSignal.aborted, true); heldResults(); await flush();
console.log(`PASS ${assertions} offline component checks against actual TSX: four readings, missing/stale data, tooltip handlers, hidden-tab fetch suppression, cleanup, admin settings and save controls. No browser layout or live delivery claimed.`);
