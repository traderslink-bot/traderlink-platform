const assert = require('node:assert/strict'), { test } = require('node:test');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), ts = require('typescript');
const root = path.resolve(__dirname, '../../../..');
function load(file, ports = {}) {
  const exports = {};
  const compiled = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), { fileName: file, reportDiagnostics: true, compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true } });
  assert.equal(compiled.diagnostics.length, 0);
  vm.runInNewContext(compiled.outputText, { exports, Date, process: { env: { NODE_ENV: 'test' } }, require: name => ports[name] ?? require(name) });
  return exports;
}
const evidence = load('src/lib/live-watchlist/resistance-evidence.ts');
const { historicalResistanceView: view } = load('src/lib/live-watchlist/historical-resistance-view.ts', { './resistance-evidence': evidence });
const level = (price, extra = {}) => ({ price, side: 'resistance', distancePct: .1, label: String(price), sourceLabel: 'intraday', touchCount: 2, sourceEvidenceCount: 1, ...extra });
const synthetic = price => level(price, { sourceLabel: 'extension', strengthLabel: 'weak', touchCount: 0, sourceEvidenceCount: 0 });
function state() {
  const resistances = [level(17.29), level(18.5, { sourceLabel: 'premarket high' }), synthetic(21), synthetic(22)];
  const supports = [level(15, { side: 'support' })];
  const text = 'Resistance:\n17.29 (+2%, moderate, intraday)\n18.50 (+9%, moderate, premarket high)\n21.00 (+24%, weak, extension)\n22.00 (+30%, weak, extension)\n23.00 (+36%, weak, extension)\n\nSupport:\n15.00 (-11%, moderate, daily structure)';
  const card = { title: 'Levels', body: text, updatedAt: 1000, priceWhenPosted: 16.92, source: 'level_snapshot' };
  return { symbol: 'SAMPLE', status: 'live', latestPrice: 16.92, updatedAt: 1000, firstPostedAt: 50,
    publication: { price: 16, postedAt: 50 }, potentialGain: { ownerFact: 'unchanged' }, nearestResistance: 21,
    levelMap: { currentPrice: 16.92, rangeState: 'normal', supportLevels: supports, resistanceLevels: resistances,
      nearestSupport: supports[0], nearestResistance: resistances[2], nextStrongSupport: null, nextStrongResistance: null,
      tradePlan: { mustClear: resistances[2], targets: resistances.slice(2), needsToHold: supports[0], failureBelow: null, openAir: false },
      dataQuality: { status: 'full', availableTimeframes: ['daily', '4h', '5m'], flags: ['daily_insufficient'] } },
    cards: { fullLadder: card, nearestSupportResistance: { ...card }, tradersLinkAiRead: { body: '{"simpleAnalysis":{"upside":[{"high":19.3}]}}', source: 'ai_read' }, traderNotes: { body: 'Owner text.' } } };
}
test('recorded-style old extensions disappear from current view, both text cards and nearest/trade plan without changing raw state or analysis', () => {
  const original = state(), before = JSON.stringify(original), result = view(original);
  assert.deepEqual(Array.from(result.levelMap.resistanceLevels, row => row.price), [17.29, 18.5]);
  for (const key of ['fullLadder', 'nearestSupportResistance']) {
    assert.doesNotMatch(result.cards[key].body, /21\.00|22\.00|23\.00/);
    assert.match(result.cards[key].body, /17\.29|18\.50/); assert.match(result.cards[key].body, /15\.00/);
    assert.match(result.cards[key].body, /No higher historical resistance detected in the available price history\./);
  }
  assert.equal(result.nearestResistance, 17.29); assert.equal(result.levelMap.tradePlan.mustClear.price, 17.29);
  assert.equal(result.levelMap.tradePlan.targets.length, 0);
  for (const key of ['tradersLinkAiRead', 'traderNotes']) assert.equal(result.cards[key], original.cards[key]);
  for (const key of ['supportLevels', 'nearestSupport']) assert.equal(result.levelMap[key], original.levelMap[key]);
  assert.equal(result.publication, original.publication); assert.equal(result.potentialGain, original.potentialGain);
  assert.equal(result.updatedAt, original.updatedAt); assert.equal(result.firstPostedAt, original.firstPostedAt);
  assert.equal(JSON.stringify(original), before); assert.equal(JSON.stringify(view(result)), JSON.stringify(result));
});
test('genuine weak/round-number extensions survive with observed provenance, including full-ladder evidence beyond curated map', () => {
  const s = state(); s.levelMap.resistanceLevels.push(level(25, { sourceLabel: 'extension', strengthLabel: 'weak' }));
  s.cards.fullLadder.body = 'Resistance:\n25.00 (weak, extension)\n39.00 (weak, extension)\n\nSupport:\n15.00';
  s.cards.fullLadder.metadata = { resistanceEvidence: JSON.stringify([level(39, { sourceLabel: 'extension', strengthLabel: 'weak' })]) };
  const result = view(s);
  assert.match(result.cards.fullLadder.body, /25\.00/); assert.match(result.cards.fullLadder.body, /39\.00/);
  assert.equal(result.levelMap.resistanceLevels.at(-1).price, 25);
  assert.equal(evidence.isSyntheticResistance(synthetic(21)), true);
  assert.equal(evidence.isSyntheticResistance({ ...synthetic(21), marketDataProvenance: { formedAt: 100 } }), false);
});
test('missing legacy counts do not mean fabricated; explicit generator IDs/notes/status still identify projections', () => {
  for (const row of [{ sourceLabel: 'extension' }, { sourceLabel: 'intraday', touchCount: 0, sourceEvidenceCount: 0 }, { sourceLabel: 'daily structure' }]) assert.equal(evidence.isSyntheticResistance(row), false);
  for (const row of [{ id: 'ANY-synthetic-resistance-extension-8' }, { id: 'ANY-snapshot-continuation-resistance-8' }, { notes: ['snapshot_continuation_map'] }, { sourceLabel: 'continuation map' }, { evidenceStatus: 'synthetic_planning' }]) assert.equal(evidence.isSyntheticResistance(row), true);
  const s = state(); s.levelMap.resistanceLevels = [level(24, { sourceLabel: 'extension', strengthLabel: 'weak', touchCount: undefined, sourceEvidenceCount: undefined })];
  s.cards.fullLadder.body = 'Resistance:\n24.00 (weak, extension)';
  assert.match(view(s).cards.fullLadder.body, /24\.00/);
});
test('all-projection and unavailable-history states are truthful, with no all-time assertion or unrelated card edits', () => {
  const s = state(); s.levelMap.resistanceLevels = [synthetic(21)]; s.levelMap.dataQuality.status = 'unavailable';
  const result = view(s); assert.equal(result.levelMap.nearestResistance, null); assert.equal(result.levelMap.tradePlan.openAir, true);
  assert.match(result.cards.fullLadder.body, /Historical resistance data is unavailable/); assert.doesNotMatch(result.cards.fullLadder.body, /all.time|never traded/i);
  assert.equal(view({ ...s, levelMap: null }).levelMap, null);
  const unknown = state(); unknown.cards.fullLadder.source = 'owner'; assert.equal(view(unknown).cards.fullLadder, unknown.cards.fullLadder);
});
test('getSymbol and listSymbols project cached rows without a database UPDATE or loss/gain/analysis mutation', async t => {
  const Database = require('better-sqlite3'); const db = new Database(':memory:'); t.after(() => db.close());
  const migration = load('src/modules/watchlist/server/database/migrations/0014_watchlist_storage.ts').watchlistStorageMigration;
  for (const sql of migration.statements) db.exec(sql);
  const raw = JSON.stringify(state());
  db.prepare("INSERT INTO live_watchlist_symbols(symbol,status,updated_at,state_json) VALUES('SAMPLE','live',1000,?)").run(raw);
  const ports = {
    './historical-resistance-view': { historicalResistanceView: view },
    './gain-starting-point': { prepareGain: value => value },
    './top-watches-group': { isTopWatchesGroup: () => false }, '@neondatabase/serverless': {},
    '@/src/modules/platform/server/database/open-platform-database': { openPlatformDatabase: () => db },
    '@/src/modules/platform/server/database/platform-migration-contract': { platformFailure: () => { throw Error('unexpected failure'); } },
    '@/src/modules/platform/server/database/platform-storage-backend': { requirePlatformSingleNodeSqliteStorage() {} },
    '@/src/modules/watchlist/server/database/migrations/0014_watchlist_storage': { watchlistStorageMigration: migration },
  };
  const { LiveWatchlistStore } = load('src/lib/live-watchlist/live-watchlist-store.ts', ports);
  const store = new LiveWatchlistStore(); const one = await store.getSymbol('SAMPLE'), all = await store.listSymbols();
  assert.equal(one.levelMap.resistanceLevels.length, 2); assert.equal(all.symbols[0].levelMap.resistanceLevels.length, 2);
  assert.equal(db.prepare("SELECT state_json FROM live_watchlist_symbols WHERE symbol='SAMPLE'").get().state_json, raw);
});
