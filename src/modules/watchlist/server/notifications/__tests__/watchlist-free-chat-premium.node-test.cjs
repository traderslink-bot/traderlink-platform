const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function load(name, dependencies = {}) {
  const file = new URL('../watchlist-free-chat-' + name + '.ts', 'file://' + __filename);
  const exports = {};
  const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  }).outputText;
  vm.runInNewContext(source, {
    exports, require: id => id === 'server-only' ? {} : dependencies[id] ?? assert.fail('Unmocked import: ' + id),
    AbortSignal, Blob, Buffer, Date, FormData, Number, URL,
  });
  return exports;
}

const delivery = load('delivery');
const publicPolicy = { ticker: false, analysis: false, levels: false };
const publication = { symbol: 'TEST', cycleId: 'example', approvalRevision: 3, updated: true,
  images: [{ filename: 'secret-name.png', description: 'secret text', base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVQImWNgAAAAAgABSK+kcQAAAABJRU5ErkJggg==' }] };
const env = { WATCHLIST_FREE_CHAT_DISCORD_WEBHOOK_URL: 'https://discord.com/api/webhooks/123/fake-test-token' };

function intercept(responses = []) {
  const posts = [];
  let verified = 0;
  return {
    posts, verified: () => verified,
    transport: async (_url, options) => {
      if (options.method !== 'POST') {
        verified++;
        return Response.json({ channel_id: '1433570741068234795' });
      }
      posts.push({ payload: JSON.parse(options.body.get('payload_json')), files: [...options.body.keys()].filter(k => k.startsWith('files[')) });
      return responses.shift() ?? Response.json({ id: '123' });
    },
  };
}

test('all eight settings produce matching previews and wire payloads, with no attachments or embeds for restricted sends', async () => {
  for (const ticker of [false, true]) for (const analysis of [false, true]) for (const levels of [false, true]) {
    const policy = { ticker, analysis, levels };
    const mock = intercept();
    const result = await delivery.deliverFreeChatPublication(publication, () => {
      assert.equal(mock.verified(), 1, 'read policy after webhook verification');
      return policy;
    }, mock.transport, env);
    assert.equal(result.state, 'sent');
    const [{payload, files}] = mock.posts;
    const preview = delivery.freeChatPreview(publication.symbol, publication.updated, policy);
    assert.equal(payload.content, preview.content);
    const restricted = ticker || analysis || levels;
    assert.equal(preview.includeImages, !restricted);
    assert.deepEqual(payload.allowed_mentions.parse, ['everyone']);
    assert.equal(payload.flags, restricted ? 4 : undefined);
    assert.equal(payload.attachments.length, restricted ? 0 : 1);
    assert.equal(files.length, restricted ? 0 : 1);
    if (ticker) {
      assert.match(payload.content, /Premium ticker/);
      assert.doesNotMatch(JSON.stringify(payload), /TEST|watchlist\//i);
    } else {
      assert.match(payload.content, /\/watchlist\/TEST/);
      if (restricted) {
        assert.doesNotMatch(payload.content, /Premium|Analysis|Updated/);
      } else {
        assert.match(payload.content, /Free \$TEST TradersLink Analysis — Updated/);
        assert.equal(payload.attachments[0].filename, 'TEST-analysis-1.png');
      }
    }
  }
});

test('every attempt reads current settings after a cooldown or explicit retry; unavailable policy sends nothing', async () => {
  const mock = intercept([Response.json({ retry_after: 12 }, { status: 429 }), new Response(null, { status: 400 })]);
  let policy = publicPolicy;
  const send = () => delivery.deliverFreeChatPublication(publication, () => {
    if (!policy) throw Error('unavailable');
    return policy;
  }, mock.transport, env);
  assert.equal((await send()).state, 'retry');
  policy = { ...publicPolicy, analysis: true };
  assert.equal((await send()).state, 'failed');
  policy = { ...policy, ticker: true };
  assert.equal((await send()).state, 'sent');
  policy = null;
  assert.equal((await send()).state, 'failed');
  assert.equal(mock.posts.length, 3);
  assert.deepEqual(mock.posts.map(post => post.files.length), [1, 0, 0]);
  assert.doesNotMatch(mock.posts[2].payload.content, /TEST/);
});

test('delivery policy reads all three settings from one database snapshot and stops private, removed, and missing listings', () => {
  let listing = { status: 'live', watchlistGroup: 'main' };
  let inSnapshot = false;
  const db = {
    transaction: operation => () => {
      inSnapshot = true;
      try { return operation(); } finally { inSnapshot = false; }
    },
    prepare: () => ({ get: () => listing && { state_json: JSON.stringify(listing) } }),
  };
  function readSetting(value) { assert.ok(inSnapshot); return value; }
  const { readFreeChatVisibility } = load('visibility', {
    '@/src/modules/platform/server/database/open-readonly-platform-database': { withReadonlyPlatformDatabase: (_options, callback) => callback(db) },
    '../access/watchlist-analysis-visibility': { readTickerPremiumOnly: () => readSetting(true), readAnalysisPremiumOnly: () => readSetting(false) },
    '../access/watchlist-levels-visibility': { readLevelsPremiumOnly: () => readSetting(true) },
  });
  assert.equal(JSON.stringify(readFreeChatVisibility('TEST', true)), JSON.stringify({ ticker: true, analysis: false, levels: true }));
  for (const state of [{ status: 'live', watchlistGroup: 'private' }, { status: 'deactivated' }, null]) {
    listing = state;
    assert.throws(() => readFreeChatVisibility('TEST', true), /member Watchlist/);
  }
});
