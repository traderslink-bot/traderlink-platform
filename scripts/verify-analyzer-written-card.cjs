/* Bounded synthetic verification: no provider, user database, server or test runner. */
const fs = require("node:fs");
const vm = require("node:vm");
const assert = require("node:assert/strict");
const ts = require("typescript");
const Decimal = require("decimal.js");
const base = "app/(dashboard)/trade-tracker/";
const cache = new Map();
let savedTrades = [];
function compile(file) {
  if (cache.has(file)) return cache.get(file);
  const module = { exports: {} };
  const compiled = ts.transpileModule(fs.readFileSync(file, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true, jsx: ts.JsxEmit.ReactJSX }, reportDiagnostics: true });
  assert.equal((compiled.diagnostics || []).filter(d => d.category === ts.DiagnosticCategory.Error).length, 0);
  vm.runInNewContext(compiled.outputText, { module, exports: module.exports, require(name) {
    if (name === "decimal.js") return Decimal;
    if (name.endsWith("journal-logical-trade-repository")) return { JournalLogicalTradeRepository: class { list(scope) { assert.equal(scope.accountId, "a"); return savedTrades; } } };
    if (name.endsWith("platform-user-preference-repository")) return { PlatformUserPreferenceRepository: class { getActiveUserPnlReportingBasis() { return "gross"; } } };
    if (name.startsWith("@/")) return compile(name.slice(2) + ".ts");
    throw Error(`Unexpected dependency ${name}`);
  } }, { filename: file });
  cache.set(file, module.exports);
  return module.exports;
}
const { buildWrittenTradeReview: build } = compile(base + "analyzer-written-review-model.ts");
const { analyzerProgressMessage: message } = compile(base + "analyzer-progress-messages.ts");
const { tradeSummaryPoints } = compile(base + "analyzer-trade-summary.ts");
let checks = 0;
const eq = (actual, expected) => { assert.equal(actual, expected); checks++; };
const start = Date.parse("2026-08-28T13:00:00Z") / 1000;
const event = (kind, minute, price, quantity, fees = "-0.50", id = `${kind}-${minute}`) => ({ eventId: id, sequence: minute, kind, executedAt: new Date((start + minute * 60) * 1000).toISOString(), price: String(price), quantity: String(quantity), fees });
const candle = (minute, close) => ({ time: start + minute * 60, close: String(close) });
const analyze = (events, candles, basis = "gross") => ({ events, candles, reviewContext: { basis, analyzedTradeCount: 15 } });
let input = analyze([event("entry", 0, 1, 100), event("partial_exit", 4, 1.5, 40), event("final_exit", 7, .9, 60)], [candle(0, 1.2), candle(1, .8), candle(2, 1.1), candle(3, 1.5), candle(4, 1.8), candle(5, .8)]);
let result = build(input, "long");
eq(result.grossPnl, "14"); eq(result.finalPnl, "14"); eq(result.peak, "68");
eq(result.path.peakPnlDecimal, "20"); eq(result.path.firstRecoveryAtUtcSeconds, start + 3 * 60);
eq(result.fills[1].grossPnl, "20"); eq(result.fills[2].grossPnl, "-6");
eq(result.fills[2].label, "Final scale-out · position closed");
let summary = tradeSummaryPoints(input, result, value => `$${new Decimal(value).toFixed(2)}`);
assert(summary[1].includes('Peak profit opportunity was $68.00')); checks++;
assert(summary[1].includes('recovered, then finished green')); checks++;
assert(summary[2].includes('1 partial exit')); checks++;
assert(summary[2].includes('$20.00 gross')); checks++;
result = build({ ...input, reviewContext: { basis: "net" } }, "long");
eq(result.finalPnl, "12.5"); eq(result.peak, "67"); eq(result.path.finalPnlDecimal, "12.5");
result = build({ ...input, events: input.events.map(e => ({ ...e, fees: null })), reviewContext: { basis: "net" } }, "long");
eq(result.finalPnl, "14"); eq(result.feesComplete, false);
result = build({ ...input, events: input.events.map(e => ({ ...e, fees: "0" })), reviewContext: { basis: "net" } }, "long");
eq(result.finalPnl, "14"); eq(result.feesComplete, true);
result = build({ ...input, events: input.events.map(e => ({ ...e, fees: "0.50" })), reviewContext: { basis: "net" } }, "long");
eq(result.finalPnl, "15.5");
// Same logical trade, several round trips: gaps do not create opportunity; each exit has its own P/L.
input = analyze([event("entry", 0, 1, 100), event("temporary_flat", 2, 2, 100), event("entry", 7, 2, 100), event("final_exit", 9, 1, 100)], [candle(0, 1), candle(4, 100), candle(7, 2)]);
result = build(input, "long"); eq(result.finalPnl, "0"); eq(result.peak, "100");
eq(result.fills[1].grossPnl, "100"); eq(result.fills[3].grossPnl, "-100");
eq(result.fills[3].label, "Full exit · all shares at once"); eq(result.fills[2].label, "Re-entered");
result = build(input, "short"); eq(result.finalPnl, "0"); eq(result.fills[1].grossPnl, "-100"); eq(result.fills[3].grossPnl, "100");
// Early red, recovered, finished red: recovery must not be presented as the final outcome.
input = analyze([event("entry", 0, 1, 100), event("final_exit", 6, .8, 100)], [candle(0, 1.2), candle(1, .9), candle(2, 1.5), candle(3, .8)]);
result = build(input, "long"); eq(result.path.status, "green_to_red_ended_red"); eq(result.path.firstRecoveryAtUtcSeconds, start + 3 * 60); eq(result.peak, "50"); eq(result.finalPnl, "-20");
summary = tradeSummaryPoints(input, result, value => `$${value}`);
assert(summary[1].includes('recovered, then finished red')); checks++;
assert(summary[2].includes('one full exit')); checks++;
assert(summary[2].includes('No exit secured a profit')); checks++;
// Added inventory, exact Decimal cash P/L and one full exit.
result = build(analyze([event("entry", 0, 1, 100), event("final_exit", 2, 1.5, 100)], [candle(0, 1.2), candle(1, .8)]), "long");
eq(result.path.firstRedAtUtcSeconds, start + 2 * 60);
eq(result.path.firstRecoveryAtUtcSeconds, start + 2 * 60);
eq(result.finalPnl, "50");
input = analyze([event("entry", 0, "1.08", 449), event("add", 1, "1.06", 393), event("partial_exit", 2, "1.05", 336), event("add", 3, "1.06", 281), event("partial_exit", 4, "1.77", 336), event("final_exit", 5, "2.41", 451)], [candle(0, 1.1)]);
result = build(input, "long");
eq(new Decimal(result.grossPnl).toFixed(2), "835.07");
eq(new Decimal(build({ ...input, reviewContext: { basis: "net" } }, "long").finalPnl).toFixed(2), "832.07");
const cash = input.events.reduce((sum, event) => sum.plus(new Decimal(event.price).times(event.quantity).times(event.kind === "entry" || event.kind === "add" ? -1 : 1)), new Decimal(0));
eq(new Decimal(result.grossPnl).toFixed(2), cash.toFixed(2));
eq(result.fills.filter(fill => fill.grossPnl !== null).length, 3);
eq(result.fills[2].grossPnl.startsWith("-"), true);
// Invalid fills are not silently clamped or converted to valid-looking numbers.
eq(build({ ...input, events: [...input.events, input.events[0]] }, "long"), null);
eq(build(analyze([event("entry", 0, 1, 10), event("final_exit", 2, 1.2, 11)], []), "long"), null);
eq(build(analyze([event("entry", 0, 1, 10)], []), "long"), null);
eq(build(analyze([event("entry", 0, "NaN", 10), event("final_exit", 2, 1.2, 10)], []), "long"), null);
for (let n = 1; n <= 200; n++) { eq(message(n), message(n)); if (n > 1) { assert.notEqual(message(n), message(n - 1)); checks++; } }
for (const [from, to] of [[1, 9], [10, 24], [25, 49], [50, 74], [75, 99]]) { assert(new Set(Array.from({ length: to - from + 1 }, (_, i) => message(from + i))).size >= 8); checks++; }
const component = fs.readFileSync(base + "written-trade-analysis.tsx", "utf8");
assert(component.includes('count >= 100 ? <Button href="/analytics/trade-analyzer/day"')); checks++;
assert(!component.includes("Math.random")); checks++;
const workspace = fs.readFileSync("app/(dashboard)/workspace/workspace-trade-analyzer-panel.tsx", "utf8");
const tracker = fs.readFileSync(base + "[sessionDate]/day-session-view.tsx", "utf8");
assert(workspace.includes("<WrittenTradeAnalysis")); assert(tracker.includes("<WrittenTradeAnalysis")); checks += 2;
assert(!workspace.includes("Calculated final path P/L:")); assert(!tracker.includes("Calculated final path P/L:")); checks += 2;
// Exercise the actual metadata SQL against disposable in-memory tables. No user data is opened.
const Database = require("better-sqlite3");
const db = new Database(":memory:");
db.exec(`
CREATE TABLE journal_logical_trades (workspace_id TEXT, account_id TEXT, logical_trade_id TEXT, current_version_id TEXT);
CREATE TABLE journal_logical_trade_daily_analyses (logical_trade_analysis_id TEXT, workspace_id TEXT, account_id TEXT, logical_trade_id TEXT, logical_trade_version_id TEXT, current_revision INTEGER, status TEXT);
CREATE TABLE journal_logical_trade_daily_analysis_versions (logical_trade_analysis_id TEXT, revision_number INTEGER, status TEXT, logical_trade_version_id TEXT, result_json TEXT, evidence_candles_json TEXT);
CREATE TABLE level_analysis_logical_trade_jobs (workspace_id TEXT, account_id TEXT, logical_trade_id TEXT, logical_trade_version_id TEXT, status TEXT);
CREATE TABLE journal_round_trip_daily_trade_analyses (daily_trade_analysis_id TEXT, workspace_id TEXT, account_id TEXT, round_trip_id TEXT, round_trip_version_id TEXT, current_revision INTEGER, status TEXT);
CREATE TABLE journal_round_trips (workspace_id TEXT, account_id TEXT, round_trip_id TEXT, current_version_id TEXT, lifecycle_state TEXT);
CREATE TABLE journal_round_trip_versions (workspace_id TEXT, account_id TEXT, round_trip_version_id TEXT, projection_fingerprint_sha256 TEXT);
CREATE TABLE journal_round_trip_daily_trade_execution_mismatch_sets (workspace_id TEXT, account_id TEXT, round_trip_id TEXT, round_trip_version_id TEXT);
CREATE TABLE journal_round_trip_daily_trade_analysis_versions (daily_trade_analysis_version_id TEXT, daily_trade_analysis_id TEXT, revision_number INTEGER, status TEXT, market_session_set_version_id TEXT);
CREATE TABLE journal_round_trip_daily_trade_analysis_event_snapshots (daily_trade_analysis_version_id TEXT, candle_time_utc_seconds INTEGER);
CREATE TABLE level_analysis_market_session_candles (market_session_set_version_id TEXT, candle_time_utc_seconds INTEGER);
`);
const saved = (id, members) => ({ logicalTradeId: id, lifecycleState: "active", tradeStyle: "day", members: members.map(id => ({ roundTripId: id, roundTripVersionId: `v-${id}` })) });
savedTrades = [saved("group", ["one", "two", "three"]), saved("single", ["four"]), saved("stale", ["five"]), saved(null, ["legacy"])];
for (const id of ["group", "single", "stale"]) {
  db.prepare("INSERT INTO journal_logical_trades VALUES ('w','a',?,?)").run(id, `v-${id}`);
  db.prepare("INSERT INTO journal_logical_trade_daily_analyses VALUES (?,'w','a',?,?,1,'ready')").run(id, id, id === "stale" ? "old" : `v-${id}`);
  db.prepare("INSERT INTO journal_logical_trade_daily_analysis_versions VALUES (?,1,'ready',?,?,?)").run(id, `v-${id}`, JSON.stringify({ eventSnapshots: [{}] }), "[{}]");
}
db.exec(`INSERT INTO journal_round_trip_daily_trade_analyses VALUES ('legacy','w','a','legacy','v-legacy',1,'ready');
INSERT INTO journal_round_trips VALUES ('w','a','legacy','v-legacy','active');
INSERT INTO journal_round_trip_versions VALUES ('w','a','v-legacy','fingerprint');
INSERT INTO journal_round_trip_daily_trade_analysis_versions VALUES ('v-legacy','legacy',1,'ready','candles');
INSERT INTO journal_round_trip_daily_trade_analysis_event_snapshots VALUES ('v-legacy',123);
INSERT INTO level_analysis_market_session_candles VALUES ('candles',123);`);
const { readAnalyzerWrittenReviewContext: context } = compile("src/modules/level-analysis/server/analyzer-written-review-context.ts");
const scope = { userId: "u", workspaceId: "w", activeAccountId: "a", allowedAccountIds: ["a"], workspaceRole: "owner" };
eq(context(db, scope).analyzedTradeCount, 3); // group is one, single one, legacy one; stale excluded.
db.exec("UPDATE journal_logical_trade_daily_analyses SET current_revision=2 WHERE logical_trade_id='group'; INSERT INTO journal_logical_trade_daily_analysis_versions VALUES ('group',2,'ready','v-group','{\"eventSnapshots\":[{}]}','[{}]');");
eq(context(db, scope).analyzedTradeCount, 3); // reanalysis is not another trade.
savedTrades = savedTrades.map(t => t.logicalTradeId === "single" ? { ...t, lifecycleState: "review_required" } : t);
eq(context(db, scope).analyzedTradeCount, 2);
db.exec("UPDATE journal_logical_trade_daily_analysis_versions SET evidence_candles_json='[]' WHERE logical_trade_analysis_id='group';");
eq(context(db, scope).analyzedTradeCount, 1);
db.exec("UPDATE journal_round_trip_daily_trade_analyses SET account_id='other';");
eq(context(db, scope).analyzedTradeCount, 0);
eq(context(db, { ...scope, activeAccountId: null }).analyzedTradeCount, null);
eq(context(db, { ...scope, allowedAccountIds: [] }).analyzedTradeCount, null);
db.close();
console.log(`${checks} focused written-card checks passed.`);
