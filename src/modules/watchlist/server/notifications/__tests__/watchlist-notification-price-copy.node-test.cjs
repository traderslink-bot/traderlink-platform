const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const root = path.resolve(__dirname, '../../../../../..');
const directory = 'src/modules/watchlist/server/notifications/';
const cache = new Map();
function load(file, isolated = false) {
  if (!isolated && cache.has(file)) return cache.get(file);
  const result = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {
    fileName: file, reportDiagnostics: true,
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  });
  assert.equal(result.diagnostics.length, 0);
  const exports = {};
  if (!isolated) cache.set(file, exports);
  vm.runInNewContext(result.outputText, {
    exports, Buffer, URL, process: { env: {} },
    require(name) {
      if (isolated || name === 'server-only') return {};
      if (name.startsWith('.')) return load(path.posix.join(path.posix.dirname(file), `${name}.ts`));
      if (name === 'twitter-text') return require(name);
      throw Error(`Unmocked dependency: ${name}`);
    },
  }, { filename: file });
  return exports;
}
const { watchlistPublicationNotificationCopy: copy } = load(`${directory}watchlist-publication-notification-contract.ts`);
const { parseAnalysisUpdateContext } = load(`${directory}watchlist-analysis-update-copy.ts`);
const assertNoPrice = text => assert.doesNotMatch(text, /\$\d|\d(?:\.\d+)?%|Originally analyzed|\bNow\b/);

test('all initial/first/updated email and push text omit reference and performance prices without changing attribution or links', () => {
  for (const updatedAnalysisPrice of [.60, .62, .90, null]) {
    for (const automatic of [false, true]) for (const ownerApproved of [false, true]) {
      for (const hasPreviousAnalysis of [false, true]) for (const kind of ['listing', 'analysis']) {
        const context = { automatic, hasPreviousAnalysis, firstAnalysisPrice: .62, updatedAnalysisPrice };
        const original = JSON.stringify(context);
        const result = copy('TEST', kind, ownerApproved, context);
        for (const key of ['pushTitle', 'pushBody', 'emailTitle', 'emailBody']) assertNoPrice(result[key]);
        assert.equal(result.destinationPath, '/watchlist/TEST');
        assert.equal(result.emailWatchlistPath, '/watchlist');
        if (ownerApproved) assert.match(result.pushTitle, /by "This Guy"/);
        else if (kind === 'analysis' && hasPreviousAnalysis && automatic) assert.match(result.pushTitle, /— Auto updated by AI$/);
        if (kind === 'analysis') assert.match(result.pushTitle, hasPreviousAnalysis ? /Analysis updated/ : /Analysis published/);
        else assert.equal(result.pushBody, 'A new Watchlist post is ready. Open TEST to view the levels and available analysis.');
        assert.equal(JSON.stringify(context), original);
      }
    }
  }
});

test('saved context still retains prices and category note; only its text projection changes', () => {
  const context = parseAnalysisUpdateContext({ automatic: true, hasPreviousAnalysis: true,
    categoryMoveNote: 'Now on Overnight Watches.', firstAnalysisPrice: .62, updatedAnalysisPrice: .60 });
  assert.equal(context.firstAnalysisPrice, .62);
  assert.equal(context.updatedAnalysisPrice, .60);
  const result = copy('TEST', 'analysis', false, context);
  assert.match(result.pushBody, /^Now on Overnight Watches\.\nA follow-up/);
  assert.match(result.emailBody, /^Now on Overnight Watches\.\nA follow-up/);
  assert.doesNotMatch(result.pushBody + result.emailBody, /\$\d|\d(?:\.\d+)?%/);
});

test('legacy/missing context sends ordinary update text, not a reconstructed comparison', () => {
  for (const context of [undefined, { automatic: false, firstAnalysisPrice: 4, updatedAnalysisPrice: 3 }]) {
    const result = copy('TEST', 'analysis', false, context);
    assert.equal(result.pushTitle, 'TEST Analysis updated');
    assert.equal(result.emailBody, result.pushBody);
    assertNoPrice(result.pushBody);
  }
});

test('existing Free Chat and category destinations remain price-free; transports are never called', () => {
  // Deliberately stub every dependency: only pure text builders may execute.
  const { freeChatPayload } = load(`${directory}watchlist-free-chat-delivery.ts`, true);
  for (const updated of [false, true]) {
    const { content, images } = freeChatPayload({ symbol: 'TEST', cycleId: 'test-cycle', approvalRevision: 1, updated, images: [] });
    assertNoPrice(content);
    assert.match(content, /Free \$TEST TradersLink Analysis/);
    assert.match(content, /@everyone/);
    assert.match(content, /https:\/\/app\.traderslink\.pro\/watchlist\/TEST/);
    assert.equal(images.length, 0);
  }
  const { categoryMoveNotificationCopy } = load(`${directory}watchlist-category-move-notifications.ts`, true);
  for (const group of ['main', 'top_regular', 'postmarket', 'general', 'swings', 'top_watches:2026-10-28']) {
    const result = categoryMoveNotificationCopy('TEST', group);
    for (const key of ['pushTitle', 'pushBody', 'emailTitle', 'emailBody']) assertNoPrice(result[key]);
    assert.match(result.pushTitle, /by "This Guy"/);
    assert.equal(result.destinationPath, '/watchlist/TEST');
  }
});

test('default X captions stay price-free and owner-authored caption prices are preserved', () => {
  const { defaultXCaption, xCaptionStatus } = load(`${directory}watchlist-x-caption.ts`);
  for (const updated of [false, true]) {
    const text = defaultXCaption('TEST', updated);
    assertNoPrice(text);
    assert.match(text, /\$TEST — TradersLink Analysis/);
  }
  const custom = '$TEST My entry was $0.62 and my own gain was 20%.';
  assert.equal(xCaptionStatus(custom).text, custom);
});
