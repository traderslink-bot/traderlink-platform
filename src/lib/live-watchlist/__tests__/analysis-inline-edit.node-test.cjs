const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '../../../..');
const source = fs.readFileSync(path.join(root, 'src/lib/live-watchlist/analysis-inline-edit.ts'), 'utf8');
const exportsObject = {};
vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.CommonJS } }).outputText, { exports: exportsObject, structuredClone });
const { makeAnalysisEdit, mergeAnalysisEdit, readInlineAnalysisMessage, analysisEditSections } = exportsObject;
test('edit patches exclude immutable references, sources and evidence and preserve the original', () => {
  const original = { symbol: 'TRUG', currentPrice: .5098, version: 3, currentRead: 'Original', bias: 'bullish', confidence: 'medium', riskSummary: [], ownerHiddenSections: ['mustClear'], sources: [{ url: 'https://example.test' }],
    needsToHold: { price: .44, label: '', rationale: 'Base', evidenceIds: ['base1'] }, targets: [], downsideCheckpoints: [], pullbackPlans: { shallow: null, deep: { zoneLow: .40, zoneHigh: .43, evidenceIds: ['base2'] } }, failureRecovery: null };
  const snapshot = JSON.stringify(original), patch = makeAnalysisEdit(original);
  assert.equal(patch.symbol, undefined); assert.equal(patch.sources, undefined); assert.equal(patch.currentPrice, undefined);
  assert.equal(patch.needsToHold.evidenceIds, undefined); assert.equal(patch.pullbackPlans.deep.evidenceIds, undefined);
  patch.currentRead = 'Owner text'; patch.needsToHold.price = .43219; patch.ownerHiddenSections = [];
  const merged = mergeAnalysisEdit(original, patch);
  assert.equal(merged.currentRead, 'Owner text'); assert.equal(merged.needsToHold.price, .43219);
  assert.deepEqual(merged.needsToHold.evidenceIds, ['base1']); assert.deepEqual(merged.sources, original.sources);
  assert.equal(JSON.stringify(original), snapshot);
});
test('inline message accepts only bounded ticker requests', () => {
  const valid = { source: 'traderslink-watchlist-admin', type: 'edit-analysis', symbol: 'TRUG' };
  assert.equal(readInlineAnalysisMessage(valid), 'TRUG');
  for (const symbol of ['../TRUG', '<script>', '', 'A'.repeat(21), null]) assert.equal(readInlineAnalysisMessage({ ...valid, symbol }), null);
  assert.equal(readInlineAnalysisMessage({ ...valid, source: 'elsewhere' }), null);
  assert.equal(Object.keys(analysisEditSections).length, 15);
});
test('editor save uses existing owner gate, revision and no publish or generation endpoint', () => {
  const editor = fs.readFileSync(path.join(root, 'app/(dashboard)/admin/watchlist/watchlist-analysis-editor.tsx'), 'utf8');
  assert.match(editor, /expectedHead: review.head/); assert.match(editor, /cycleId: review.cycleId/);
  assert.match(editor, /x-traderlink-journal-admin-request/); assert.match(editor, /Discard unsaved analysis edits/);
  assert.doesNotMatch(editor, /["']\/(approve|ai-read-refresh|generate)["']/);
  for (const relative of ['app/(dashboard)/admin/watchlist/watchlist-analysis-editor.tsx', 'app/(dashboard)/admin/watchlist/watchlist-runtime-admin-client.tsx', 'app/watchlist/live-watchlist-client.tsx']) {
    const text = fs.readFileSync(path.join(root, relative), 'utf8');
    const result = ts.transpileModule(text, { fileName: relative, reportDiagnostics: true, compilerOptions: { target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } });
    assert.deepEqual(result.diagnostics?.filter(d => d.category === ts.DiagnosticCategory.Error), [], relative);
  }
});

test('owner modal loads, edits, saves the pinned version and closes without publishing', async () => {
  const source = fs.readFileSync(path.join(root, 'app/(dashboard)/admin/watchlist/watchlist-analysis-editor.tsx'), 'utf8');
  const values = [], refs = [], effects = []; let cursor = 0, refCursor = 0, first = true;
  const calls = []; let saved = 0, closed = 0;
  const payload = { version: 3, currentRead: 'Original analysis', bias: 'bullish', confidence: 'medium', ownerHiddenSections: [], riskSummary: [], targets: [], downsideCheckpoints: [], pullbackPlans: { shallow: null, deep: null }, failureRecovery: null };
  const review = { symbol: 'TRUG', cycleId: 'cycle', head: 9, draft: { revision: 7, body: { payload } } };
  const api = { exports: {} };
  const element = (type, props) => ({ type, props });
  const hooks = {
    useState(initial) { const i = cursor++; if (first) values[i] = initial; return [values[i], value => { values[i] = typeof value === 'function' ? value(values[i]) : value; }]; },
    useRef(initial) { const i = refCursor++; return refs[i] ||= { current: initial }; },
    useEffect(effect) { if (first) effects.push(effect); },
  };
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText, {
    exports: api.exports, require(name) {
      if (name === 'react') return hooks;
      if (name === 'react/jsx-runtime') return { jsx: element, jsxs: element, Fragment: 'fragment' };
      if (name === 'next/dynamic') return () => 'AnalysisCard';
      if (name.endsWith('/analysis-inline-edit')) return exportsObject;
      if (name.endsWith('/traderslink-ai-read')) return { parseTradersLinkAiRead: () => true };
      return name;
    }, structuredClone, AbortController, AbortSignal, setTimeout, clearTimeout,
    window: { addEventListener() {}, removeEventListener() {}, confirm: () => false },
    fetch: async (url, options) => {
      calls.push({ url, options });
      return { ok: true, json: async () => url.includes('/preview') ? { cycleId: 'cycle', draftRevision: 7, publication: { website: { cards: { tradersLinkAiRead: { body: JSON.stringify(payload) } } } } } : { review } };
    },
  });
  const render = () => { cursor = 0; refCursor = 0; const tree = api.exports.WatchlistAnalysisEditor({ symbol: 'TRUG', onSaved: () => saved++, onClose: () => closed++ }); first = false; return tree; };
  function nodes(tree, list = []) { if (Array.isArray(tree)) tree.forEach(node => nodes(node, list)); else if (tree && typeof tree === 'object') { list.push(tree); nodes(tree.props?.children, list); } return list; }
  render(); const cleanups = effects.map(effect => effect()); await new Promise(resolve => setImmediate(resolve));
  let tree = render();
  let card = nodes(tree).find(node => node.type === 'AnalysisCard');
  assert.ok(card);
  const editing = card.props.renderSectionEditor(['currentRead']);
  const field = nodes(editing).find(node => node.type === '@mui/material/TextField');
  field.props.onChange({ target: { value: 'Owner corrected analysis' } });
  tree = render();
  const closeButton = nodes(tree).find(node => node.props?.children === 'Close');
  closeButton.props.onClick(); assert.equal(closed, 0, 'cancel discard preserves draft');
  card = nodes(tree).find(node => node.type === 'AnalysisCard');
  assert.equal(JSON.parse(card.props.card.body).currentRead, 'Owner corrected analysis');
  nodes(tree).find(node => node.props?.children === 'Save and close').props.onClick();
  await new Promise(resolve => setImmediate(resolve));
  const save = calls.find(call => call.url.endsWith('/save'));
  assert.ok(save);
  const sent = JSON.parse(save.options.body);
  assert.equal(sent.expectedHead, 9); assert.equal(sent.cycleId, 'cycle');
  assert.equal(sent.patch.currentRead, 'Owner corrected analysis');
  assert.equal(saved, 1); assert.equal(closed, 1);
  assert.ok(calls.every(call => !/approve|generate|refresh/.test(call.url)));
  cleanups.forEach(cleanup => cleanup?.());
});
