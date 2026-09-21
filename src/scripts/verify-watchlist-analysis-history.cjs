const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const file = 'src/lib/live-watchlist/analysis-publication-history.ts';
const output = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
const mod = { exports: {} };
vm.runInNewContext(output.outputText, { module: mod, exports: mod.exports });
const { publishedAnalysisHistory: history, formatAnalysisHistoryRow: format } = mod.exports;
const first = { generationId: 'first', generatedAt: 1789775556473, currentPrice: 4.35 };
const second = { generationId: 'second', generatedAt: 1789978366581, currentPrice: 5.32 };
const third = { generationId: 'third', generatedAt: Date.parse('2026-09-21T12:12:00Z'), currentPrice: 7.32 };
function approve(revision, read) { return { revision, body: { kind: 'approve', publication: { website: { cards: { tradersLinkAiRead: { body: JSON.stringify(read) } } } } } }; }
function ack(revision) { return { body: { kind: 'delivery', channel: 'website', status: 'acknowledged', approvalRevision: revision } }; }
const events = [approve(1, first), ack(1), approve(2, second), ack(2), approve(3, third)];
function rows(body = second, input = events) { return history({ review: { events: input } }, JSON.stringify(body)); }
assert.equal(rows().length, 2);
assert.equal(format(rows()[0], 0), 'Analysis posted: Sep 18, 7:52 PM ET — $4.35');
assert.equal(format(rows()[1], 1), 'Analysis updated: Sep 21, 4:12 AM ET — $5.32');
assert.equal(rows(third).length, 0, 'Unacknowledged approval must not be public');
assert.equal(rows(first).length, 1, 'Do not expose newer approval than displayed read');
assert.equal(rows(third, [...events, ack(3)]).length, 3);
assert.equal(format(rows(third, [...events, ack(3)])[2], 2), 'Analysis updated: Sep 21, 8:12 AM ET — $7.32');
assert.equal(rows(second, [...events, approve(4, second), ack(4)]).length, 2, 'Repeated publication is deduplicated');
assert.equal(history(null, '{}').length, 0);
assert.equal(rows({ ...second, generationId: 'another-cycle' }).length, 0);
assert.equal(JSON.stringify(rows()).includes('generationId'), false);
assert.equal(format({ generatedAt: Date.parse('2026-12-01T14:05:30Z'), price: .2482 }, 1), 'Analysis updated: Dec 1, 9:05 AM ET — $0.2482');
for (const path of [file, 'app/watchlist/analysis-history-lines.tsx', 'app/watchlist/simple-analysis-card.tsx', 'app/watchlist/live-watchlist-client.tsx', 'app/api/live-watchlist/symbols/[symbol]/analysis-history/route.ts']) {
  const result = ts.transpileModule(fs.readFileSync(path, 'utf8'), { fileName: path, reportDiagnostics: true, compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } });
  assert.equal(result.diagnostics?.filter(d => d.category === ts.DiagnosticCategory.Error).length, 0, path);
}
console.log('PASS: approved history, exact date/time/price copy, multiple updates, retry deduplication, unpublished exclusion, current-version boundary, DST, sub-dollar precision and five-file TSX/TS transpilation.');

async function verifyRoute() {
  let authorized = false, upstreamCalls = 0;
  const routeModule = { exports: {} };
  const routePath = 'app/api/live-watchlist/symbols/[symbol]/analysis-history/route.ts';
  const routeCode = ts.transpileModule(fs.readFileSync(routePath, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(routeCode, { module: routeModule, exports: routeModule.exports, require: name => {
    if (name === 'node:crypto') return require(name);
    if (name === 'next/server') return { NextResponse: { json: (body, options) => ({ body, status: options?.status || 200 }) } };
    if (name.endsWith('live-watchlist-auth')) return { authorizeWatchlistMemberRequest: async () => ({ ok: authorized, error: 'Denied', status: 403 }) };
    if (name.endsWith('live-watchlist-store')) return { LiveWatchlistStore: class { async getSymbol() { return { symbol: 'GRML', status: 'live', cards: { tradersLinkAiRead: { body: JSON.stringify(second) } } }; } } };
    if (name.endsWith('analysis-publication-history')) return mod.exports;
    if (name.endsWith('watchlist-runtime-admin-client')) return { requestWatchlistRuntimeRaw: async request => { upstreamCalls++; assert.equal(request.method, 'GET'); assert.equal(request.path, '/api/watchlist/analysis-review?symbol=GRML'); return { ok: true, body: JSON.stringify({ review: { events } }) }; } };
    throw Error(name);
  } });
  const ctx = { params: Promise.resolve({ symbol: 'GRML' }) };
  assert.equal((await routeModule.exports.GET({}, ctx)).status, 403);
  assert.equal(upstreamCalls, 0);
  authorized = true;
  const answers = await Promise.all([routeModule.exports.GET({}, ctx), routeModule.exports.GET({}, ctx)]);
  assert.equal(upstreamCalls, 1, 'Concurrent viewers share the history request');
  assert.equal(JSON.stringify(answers[0].body), JSON.stringify({ rows: rows() }));
  assert.equal((await routeModule.exports.GET({}, { params: Promise.resolve({ symbol: '../private' }) })).status, 400);
  console.log('PASS: member authorization before upstream access, read-only request, sanitized response, symbol validation and concurrent cache coalescing.');
}
verifyRoute().catch(error => { console.error(error); process.exitCode = 1; });
