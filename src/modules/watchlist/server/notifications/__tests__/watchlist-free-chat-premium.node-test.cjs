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

test('custom Premium copy retains the masked heading, generic link and mention', async () => {
  const policy = { ticker: true, analysis: true, levels: true };
  const mock = intercept();
  const copy = { message: 'Still watching this setup.', visibilityKey: '111' };
  const result = await delivery.deliverFreeChatPublication(publication, () => policy, mock.transport, env, copy);
  assert.equal(result.state, 'sent');
  const {payload, files} = mock.posts[0];
  assert.match(payload.content, /Premium ticker\n?\*\*\n\nStill watching this setup\./);
  assert.doesNotMatch(payload.content, /New idea|TEST|watchlist\//);
  assert.match(payload.content, /View Watchlist ↓\nhttps:\/\/app\.traderslink\.pro\/watchlist\n\n@everyone$/);
  assert.equal(files.length, 0);
  assert.equal(payload.flags, 4);
  assert.match(delivery.freeChatPreview('TEST', false, policy).content, /On the TradersLink Watchlist\./);
  for (const message of ['$Test is moving', 'ＴＥＳＴ is moving', 'TE\u200bST is moving', 'See https://example.test', 'Hi @everyone']) {
    assert.throws(() => delivery.validateFreeChatOwnerCopy('TEST', message, policy), /Remove the ticker|notification tag/);
  }
});

test('a changed Premium setting after confirmation holds custom text on initial delivery and retry', async () => {
  const mock = intercept();
  for (const policy of [{ ...publicPolicy, ticker: true }, { ...publicPolicy, analysis: true }, { ...publicPolicy, levels: true }]) {
    const result = await delivery.deliverFreeChatPublication(publication, () => policy, mock.transport, env, {
      message: 'I added TEST to the watchlist.', visibilityKey: '000',
    });
    assert.equal(result.state, 'failed');
    assert.match(result.message, /Premium settings changed/);
  }
  assert.equal(mock.posts.length, 0);
});

test('manual review freezes copy durably and reads the exact owner approval receipt on status polls', async t => {
  const Database = require('better-sqlite3');
  const db = new Database(':memory:');
  t.after(() => db.close());
  db.exec('CREATE TABLE platform_users(user_id TEXT PRIMARY KEY); INSERT INTO platform_users VALUES (\'owner\'), (\'other\');');
  function migration(name) {
    const path = require('node:path');
    const file = path.resolve(__dirname, '../../../../platform/server/database/migrations', name + '.ts');
    const exports = {};
    vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText, {exports});
    for (const sql of Object.values(exports)[0].statements) db.exec(sql);
  }
  migration('0149_watchlist_free_chat');
  const store = load('store');
  store.queueFreeChatPublication(db,{cycleId:'legacy',ticker:'TEST',ownerUserId:'owner',approvalRevision:3,origin:'manual',publishedAt:1});
  migration('0213_watchlist_free_chat_owner_copy');
  assert.equal(db.prepare('SELECT owner_copy_json FROM platform_watchlist_free_chat_posts WHERE cycle_id=\'legacy\'').get().owner_copy_json,null);
  const review={cycleId:'current',symbol:'TEST',events:[]};
  let reviewReads=0;
  const admin=load('admin',{
    '../access/watchlist-analysis-visibility':{isPrivateWatchlistTicker:()=>false},
    '@/src/modules/platform/server/database/open-platform-database':{withPlatformDatabase:(_options,run)=>run(db)},
    '@/src/modules/platform/server/database/open-readonly-platform-database':{withReadonlyPlatformDatabase:(_options,run)=>run(db)},
    './watchlist-free-chat-runtime':{readFreeChatReview:async()=>{reviewReads++;return review;},publishedFreeChatApprovals:()=>[{revision:3,at:10}],isFreeChatListingOnly:()=>false},
    './watchlist-free-chat-store':store,'./watchlist-free-chat-delivery':delivery,
    './watchlist-free-chat-visibility':{readFreeChatVisibility:()=>({ticker:true,analysis:true,levels:true})},
  });
  const url=new URL('https://watchlist.test/free-chat?symbol=TEST');
  const poll=new URL('https://watchlist.test/free-chat?symbol=TEST&cycleId=current&delivery=3');
  const send=(input={})=>admin.handleFreeChatAdmin('POST',url,JSON.stringify({symbol:'TEST',cycleId:'current',action:'send',approvalRevision:3,visibilityKey:'111',message:'My public note.',...input}),'owner');
  await assert.rejects(send({visibilityKey:'000'}),/Premium settings changed/);
  await assert.rejects(send({approvalRevision:2}),/Watchlist entry changed/);
  const queued=await send();
  assert.equal(queued.delivery.state,'pending');
  assert.equal(queued.savedMessage,'My public note.');
  const reads=reviewReads;
  assert.equal((await admin.handleFreeChatAdmin('GET',poll,undefined,'other')).delivery,null);
  assert.equal((await admin.handleFreeChatAdmin('GET',poll,undefined,'owner')).delivery.state,'pending');
  assert.equal(reviewReads,reads,'polling reads only the receipt');
  assert.ok(store.claimFreeChatPost(db,'current:approval:3'));
  store.finishFreeChatPost(db,'current:approval:3',{state:'sent',message:'Posted to Free Chat.',messageId:'123'});
  assert.equal((await admin.handleFreeChatAdmin('GET',poll,undefined,'owner')).delivery.state,'sent');
  assert.equal((await send({message:'Replacement'})).savedMessage,'My public note.');
  assert.equal(db.prepare("SELECT count(*) AS n FROM platform_watchlist_free_chat_posts WHERE cycle_id='current'").get().n,1);
  db.prepare("UPDATE platform_watchlist_free_chat_posts SET state='failed',post_key='current:draft:2' WHERE cycle_id='current'").run();
  assert.equal((await send({message:'Revised retry note'})).savedMessage,'Revised retry note');
  assert.equal((await admin.handleFreeChatAdmin('GET',poll,undefined,'owner')).delivery.state,'pending');
});

test('ticker-only Free Chat payload has no analysis images and respects all eight Premium settings', async () => {
  for (const ticker of [false, true]) for (const analysis of [false, true]) for (const levels of [false, true]) {
    const policy = { ticker, analysis, levels };
    const listing = { ...publication, listingOnly: true };
    const mock = intercept();
    assert.equal((await delivery.deliverFreeChatPublication(listing, () => policy, mock.transport, env)).state, 'sent');
    const [{ payload, files }] = mock.posts;
    assert.equal(payload.content, delivery.freeChatPreview('TEST', listing.updated, policy, undefined, true).content);
    assert.equal(files.length, 0);
    assert.equal(payload.flags, 4);
    assert.doesNotMatch(payload.content, /Analysis|Images/);
    if (ticker) assert.doesNotMatch(payload.content, /TEST|watchlist\//);
    else assert.match(payload.content, /watchlist\/TEST/);
  }
});
