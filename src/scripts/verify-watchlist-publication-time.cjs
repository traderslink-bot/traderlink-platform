// Focused offline source-method verification; no server, provider or AI calls.
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require(process.argv[2]);
const runtime = process.argv[3];
function load(file, dependencies = {}) {
  const result = ts.transpileModule(fs.readFileSync(file, 'utf8'), { fileName: file, reportDiagnostics: true,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
  assert.equal(result.diagnostics.filter(d => d.category === ts.DiagnosticCategory.Error).length, 0);
  const mod = { exports: {} };
  vm.runInNewContext(result.outputText, { exports: mod.exports, module: mod, URLSearchParams,
    require: name => name === 'node:crypto' ? require(name) : dependencies[name] || {} });
  return mod.exports;
}
(async () => {
  const generatedAt = 1790477750809, publishedAt = 1790525859219;
  const read = { generationId: 'GYGY-saved', generatedAt, currentPrice: 1.48 };
  const body = JSON.stringify(read);
  const events = [{ revision: 12, at: publishedAt - 560, body: { kind: 'approve', publication: { website: { cards: { tradersLinkAiRead: { body } } } } } },
    { revision: 14, at: publishedAt, body: { kind: 'delivery', channel: 'website', status: 'acknowledged', approvalRevision: 12 } }];
  const helper = load('src/lib/live-watchlist/analysis-publication-history.ts');
  const rows = helper.publishedAnalysisHistory({ review: { events } }, body);
  assert.equal(rows[0].generatedAt, generatedAt);
  assert.equal(rows[0].publishedAt, publishedAt);
  assert.equal(rows[0].price, 1.48);
  assert.equal(helper.formatAnalysisHistoryRow(rows[0], 0), 'Analysis posted: Sep 27, 12:17 PM ET — $1.48');
  assert.equal(helper.publishedAnalysisHistory({ review: { events: events.slice(0, 1) } }, body).length, 0);
  const api = load(path.join(runtime, 'src/runtime/manual-watchlist-analysis-review-api.ts'));
  const answer = await api.dispatchAnalysisReviewRequest({ method: 'GET', pathname: '/api/watchlist/published-analysis-history',
    searchParams: new URLSearchParams({ symbol: 'GYGY', bodyHash: require('node:crypto').createHash('sha256').update(body).digest('hex') }) },
    { getTradersLinkAiReadReview: () => ({ events }) });
  assert.equal(JSON.stringify(answer.body.rows), JSON.stringify(rows));
  const source = fs.readFileSync(path.join(runtime, 'src/lib/monitoring/manual-watchlist-runtime-manager.ts'), 'utf8');
  const ast = ts.createSourceFile('manager.ts', source, ts.ScriptTarget.Latest, true);
  const cls = ast.statements.find(n => ts.isClassDeclaration(n) && n.name?.text === 'ManualWatchlistRuntimeManager');
  const method = cls.members.find(n => n.name?.getText(ast) === 'approveTradersLinkAiReadForWebsite').getText(ast);
  const code = ts.transpileModule(`class Selected { ${method} }`, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
  const Selected = new Function('normalizeSymbol', 'buildTradersLinkAiReadRefreshState', code + ';return Selected;')(s => s, () => ({}));
  const m = new Selected(); let frozen, sent;
  const review = { head: 2, draft: { revision: 2, body: { kind: 'original', payload: read } }, events: [] };
  const store = { read: () => review, approve: (cycle, head, draft, actor, publication) => {
    frozen = { revision: 3, body: { kind: 'approve', draftRevision: 2, publication } }; return frozen;
  }, claimDelivery: () => ({ shouldSend: true }), recordDelivery: () => {} };
  m.options = { now: () => publishedAt, tradersLinkAiReadReviewStore: store };
  m.watchlistStore = { getEntry: () => ({ active: true, publicationReview: { cycleId: 'cycle' } }), patchEntry: () => {} };
  m.getTradersLinkAiReadReview = () => review;
  m.getTradersLinkAiReadPublicationPreview = () => ({ publication: { website: { updatedAt: generatedAt, cards: { tradersLinkAiRead: { body } } } } });
  m.liveWatchlistPublisher = { publish: async patch => { sent = patch; } };
  m.persistWatchlist = m.acknowledgeTradersLinkAiReadPublication = m.refreshPublishedCompanyInfo = () => {};
  const input = { symbol: 'GYGY', cycleId: 'cycle', draftRevision: 2, actor: 'owner' };
  await m.approveTradersLinkAiReadForWebsite(input);
  assert.equal(sent.firstPostedAt, publishedAt); assert.equal(sent.cards.tradersLinkAiRead.body, body);
  review.approved = frozen; m.options.now = () => publishedAt + 50000;
  await m.approveTradersLinkAiReadForWebsite(input); assert.equal(sent.firstPostedAt, publishedAt, 'Retry preserves original timestamp');
  delete review.approved; review.preserveExistingPublication = true;
  await m.approveTradersLinkAiReadForWebsite(input); assert.equal('firstPostedAt' in sent, false, 'Refresh does not reset listing');
  delete review.preserveExistingPublication; review.events = events.slice(1);
  await m.approveTradersLinkAiReadForWebsite(input); assert.equal('firstPostedAt' in sent, false);
  console.log('PASS actual approval method: initial time, immutable retry, both existing-listing cases; runtime history and formatter use acknowledged publication while preserving generation identity/price; unapproved excluded.');
})().catch(error => { console.error(error); process.exitCode = 1; });
