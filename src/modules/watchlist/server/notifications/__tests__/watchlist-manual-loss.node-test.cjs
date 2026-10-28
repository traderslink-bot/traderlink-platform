const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const ts = require('typescript'), Database = require('better-sqlite3');
const root = path.resolve(__dirname, '../../../../../..');
function load(file, ports = {}) {
  const result = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {
    fileName: file, reportDiagnostics: true,
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true, jsx: ts.JsxEmit.ReactJSX },
  });
  assert.equal(result.diagnostics.length, 0);
  const exports = {};
  vm.runInNewContext(result.outputText, { exports, Buffer, URL, AbortSignal, Response, Request, Headers, Blob, File, FormData, Uint8Array, Date, console,
    process: { env: {} }, require: name => name === 'server-only' ? {} : ports[name] ?? require(name),
  }, { filename: file });
  return exports;
}
const model = load('src/lib/live-watchlist/manual-loss-card.ts');
const servicePath = 'src/modules/watchlist/server/notifications/watchlist-potential-gain-post.ts';
const png = Buffer.alloc(33);
Buffer.from('89504e470d0a1a0a', 'hex').copy(png); png.write('IHDR', 12); png.writeUInt32BE(600, 16); png.writeUInt32BE(400, 20);
const id = n => `aaaaaaaa-aaaa-4aaa-8aaa-${String(n).padStart(12, '0')}`;
const input = { ownerUserId: 'owner', symbol: 'TEST', requestId: id(1), message: 'My trade', png, buyPrice: '2.00', sellPrice: '1.50', notes: 'Stopped out.\nWaited for a new setup.' };
const env = { WATCHLIST_POTENTIAL_GAIN_DISCORD_WEBHOOK_URL: 'https://discord.com/api/webhooks/123/fixture_only' };
function setup(t) {
  const db = new Database(':memory:'); t.after(() => db.close());
  db.exec("PRAGMA foreign_keys=ON;CREATE TABLE platform_users(user_id TEXT PRIMARY KEY);INSERT INTO platform_users VALUES('owner');");
  for (const statement of load('src/modules/platform/server/database/migrations/0147_watchlist_potential_gain_posts.ts').watchlistPotentialGainPostsMigration.statements) db.exec(statement);
  let privateTicker = false;
  const service = load(servicePath, {
    '../access/watchlist-analysis-visibility': { isPrivateWatchlistTicker: () => privateTicker },
    '@/src/lib/live-watchlist/manual-loss-card': model,
  });
  const calls = []; let status = 200, channel = service.GAIN_CHANNEL;
  const transport = async (url, options = {}) => {
    calls.push({ url: String(url), options });
    if (options.method !== 'POST') return Response.json({ channel_id: channel });
    if (status === 0) throw Error('mock network failure');
    return Response.json(status === 200 ? { id: '12345' } : { retry_after: 30 }, { status });
  };
  return { db, service, transport, calls, posts: () => calls.filter(c => c.options.method === 'POST'), setStatus: value => { status = value; }, wrongChannel: () => { channel = 'wrong'; }, makePrivate: () => { privateTicker = true; } };
}

test('manual decimal loss, sub-dollar prices, zero sale, flat trade and tiny loss are calculated without quotes or clock data', () => {
  for (const [buyPrice, sellPrice, expected] of [['2', '1.5', '−25.00%'], ['.125', '.10', '−20.00%'], ['1', '0', '−100.00%'], ['0.1', '0.1', '0.00%'], ['1', '.999999', 'Less than 0.01% loss']]) {
    const result = model.calculateManualLoss({ buyPrice, sellPrice, notes: '' });
    assert.equal(result.lossLabel, expected);
    assert.deepEqual(Object.keys(result).sort(), ['buyPrice', 'lossLabel', 'notes', 'percentage', 'sellPrice']);
  }
  assert.equal(model.calculateManualLoss({ buyPrice: '0.880300', sellPrice: '0.86', notes: '  note\nline 2  ' }).buyPrice, '0.8803');
});
test('rejects missing, malformed, negative, nonfinite and profitable loss-card inputs without changing the entered object', () => {
  for (const value of ['', ' ', '-1', 'Infinity', 'NaN', '1e4', '.', '0x10', '1,23', '9'.repeat(65)]) {
    assert.throws(() => model.calculateManualLoss({ ...input, buyPrice: value }));
    assert.throws(() => model.calculateManualLoss({ ...input, sellPrice: value }));
  }
  assert.throws(() => model.calculateManualLoss({ ...input, buyPrice: '0' }));
  assert.throws(() => model.calculateManualLoss({ ...input, buyPrice: '0', sellPrice: '0' }));
  assert.throws(() => model.calculateManualLoss({ ...input, sellPrice: '3' }));
  assert.throws(() => model.calculateManualLoss({ ...input, notes: 'x'.repeat(model.LOSS_NOTES_LIMIT + 1) }));
  const before = JSON.stringify(input); model.calculateManualLoss(input); assert.equal(JSON.stringify(input), before);
});
test('loss uses the existing destination/everyone mention with loss attachment, and repeat sends use the saved receipt', async t => {
  const h = setup(t);
  assert.equal((await h.service.sendManualLossPost(h.db, input, h.transport, env)).state, 'sent');
  assert.equal((await h.service.sendManualLossPost(h.db, input, h.transport, env)).state, 'sent');
  assert.equal(h.posts().length, 1); assert.equal(h.calls.length, 2);
  const post = h.posts()[0]; const body = JSON.parse(post.options.body.get('payload_json'));
  assert.equal(new URL(post.url).searchParams.get('wait'), 'true');
  assert.equal(body.content, 'My trade\n\n@everyone'); assert.deepEqual(body.allowed_mentions, { parse: ['everyone'] });
  assert.equal(body.attachments[0].filename, 'TEST-trade-loss.png');
  assert.equal(post.options.body.get('files[0]').name, 'TEST-trade-loss.png');
  assert.equal(h.db.prepare('SELECT count(*) n FROM platform_watchlist_potential_gain_posts').get().n, 1);
});
test('loss send binds prices, notes, message, image, owner and kind; Gain default receipt/hash and attachment remain compatible', async t => {
  const h = setup(t);
  await h.service.sendManualLossPost(h.db, input, h.transport, env);
  for (const change of [{ buyPrice: '3' }, { sellPrice: '1' }, { notes: 'changed' }, { message: 'changed' }, { ownerUserId: 'different' }, { png: Buffer.concat([png, Buffer.from([0])]) }]) {
    await assert.rejects(() => h.service.sendManualLossPost(h.db, { ...input, ...change }, h.transport, env));
  }
  await assert.rejects(() => h.service.sendPotentialGainPost(h.db, input, h.transport, env));
  const gain = { ...input, requestId: id(2) };
  await h.service.sendPotentialGainPost(h.db, gain, h.transport, env);
  const expected = require('node:crypto').createHash('sha256').update(gain.symbol).update('\0').update(gain.message).update('\0').update(gain.png).digest('hex');
  assert.equal(h.db.prepare('SELECT payload_hash FROM platform_watchlist_potential_gain_posts WHERE request_id=?').get(gain.requestId).payload_hash, expected);
  const payload = JSON.parse(h.posts()[1].options.body.get('payload_json'));
  assert.equal(payload.attachments[0].filename, 'TEST-potential-gain.png');
  assert.equal(payload.content, 'My trade\n\n@everyone');
  await assert.rejects(() => h.service.sendManualLossPost(h.db, gain, h.transport, env));
  assert.equal(h.posts().length, 2);
});
test('explicit 429 wait, uncertain no-resend, missing/wrong webhook and Private behavior match Gain', async t => {
  const h = setup(t);
  h.setStatus(429);
  const result = await h.service.sendManualLossPost(h.db, input, h.transport, env);
  assert.equal(result.state, 'retry'); assert.ok(result.retryAt > Date.now());
  await h.service.sendManualLossPost(h.db, input, h.transport, env); assert.equal(h.posts().length, 1);
  h.db.prepare('UPDATE platform_watchlist_potential_gain_posts SET retry_at_ms=0').run();
  h.setStatus(200); assert.equal((await h.service.sendManualLossPost(h.db, input, h.transport, env)).state, 'sent');
  for (const status of [0, 502]) {
    h.setStatus(status); const next = { ...input, requestId: id(status + 10), message: '' };
    assert.equal((await h.service.sendManualLossPost(h.db, next, h.transport, env)).state, 'uncertain');
    const count = h.posts().length; await h.service.sendManualLossPost(h.db, next, h.transport, env); assert.equal(h.posts().length, count);
  }
  const before = h.posts().length;
  assert.equal((await h.service.sendManualLossPost(h.db, { ...input, requestId: id(3) }, h.transport, {})).state, 'unconfigured');
  h.wrongChannel(); assert.equal((await h.service.sendManualLossPost(h.db, { ...input, requestId: id(3) }, h.transport, env)).state, 'configuration');
  h.makePrivate(); await assert.rejects(() => h.service.sendManualLossPost(h.db, { ...input, requestId: id(3) }, h.transport, env));
  assert.equal(h.posts().length, before);
});
test('invalid PNG, excessive message/notes and invalid identity never claim a receipt or make a request', async t => {
  const h = setup(t);
  for (const change of [{ png: Buffer.alloc(12) }, { message: 'x'.repeat(1801) }, { notes: 'x'.repeat(1001) }, { symbol: '../TEST' }, { requestId: 'not-an-id' }, { buyPrice: '0', sellPrice: '0' }]) {
    await assert.rejects(() => h.service.sendManualLossPost(h.db, { ...input, ...change }, h.transport, env));
  }
  assert.equal(h.calls.length, 0);
  assert.equal(h.db.prepare('SELECT count(*) n FROM platform_watchlist_potential_gain_posts').get().n, 0);
});
test('admin loss route authenticates and checks mutation origin before reading form or calling delivery', async () => {
  let allowed = false, mutation = false, deliveries = 0, opens = 0;
  const route = load('app/api/admin/watchlist/manual-loss-post/route.ts', {
    '@/src/modules/platform/server/administration/platform-admin-authorization': { withJournalAdminDatabase: (_headers, fn) => { if (!allowed) throw Error(); return fn(null, { userId: 'owner' }); } },
    '@/src/modules/platform/server/administration/platform-admin-request-security': { requireJournalAdminMutationRequest: () => { if (!mutation) throw Error(); } },
    '@/src/modules/platform/server/database/open-platform-database': { openPlatformDatabase: () => { opens++; return { close() {} }; } },
    '@/src/lib/live-watchlist/manual-loss-card': model,
    '@/src/modules/watchlist/server/notifications/watchlist-potential-gain-post': { GAIN_MAX_BYTES: 4 * 1024 * 1024, validateGainPost: () => {}, sendManualLossPost: async (_db, value) => { deliveries++; assert.equal(model.calculateManualLoss(value).percentage, '-25'); return { state: 'sent' }; } },
  });
  const request = (extra = {}) => {
    const form = new FormData(); for (const [key, value] of Object.entries({ ...input, ...extra })) if (key !== 'png') form.set(key, value);
    form.set('image', new Blob([png], { type: 'image/png' }), 'card.png');
    return new Request('https://app.test/api/admin/watchlist/manual-loss-post', { method: 'POST', body: form });
  };
  assert.equal(route.GET, undefined);
  assert.equal((await route.POST(request())).status, 404); mutation = true;
  assert.equal((await route.POST(request())).status, 404); allowed = true; mutation = false;
  assert.equal((await route.POST(request())).status, 404);
  assert.equal(deliveries, 0); assert.equal(opens, 0); mutation = true;
  assert.equal((await route.POST(request({ sellPrice: '3' }))).status, 400); assert.equal(opens, 0);
  assert.equal((await route.POST(request({ percentage: '999' }))).status, 200); assert.equal(deliveries, 1); assert.equal(opens, 1);
});
test('admin loss route bounds actual bytes without trusting Content-Length', async () => {
  let touched = false;
  const route = load('app/api/admin/watchlist/manual-loss-post/route.ts', {
    '@/src/modules/platform/server/administration/platform-admin-authorization': { withJournalAdminDatabase: (_headers, fn) => fn(null, { userId: 'owner' }) },
    '@/src/modules/platform/server/administration/platform-admin-request-security': { requireJournalAdminMutationRequest() {} },
    '@/src/modules/platform/server/database/open-platform-database': { openPlatformDatabase() { touched = true; throw Error(); } },
    '@/src/lib/live-watchlist/manual-loss-card': model,
    '@/src/modules/watchlist/server/notifications/watchlist-potential-gain-post': { GAIN_MAX_BYTES: 32, sendManualLossPost() { touched = true; }, validateGainPost() { touched = true; } },
  });
  const request = new Request('https://app.test/', { method: 'POST', body: new Uint8Array(66000), headers: { 'content-length': '1' } });
  assert.equal((await route.POST(request)).status, 413); assert.equal(touched, false);
});
test('loss component is admin-only; manual fields have no automatic ticker/gain fetch or time and notes are escaped text', () => {
  const source = fs.readFileSync(path.join(root, 'app/(dashboard)/admin/watchlist/watchlist-manual-loss-post.tsx'), 'utf8');
  assert.doesNotMatch(source, /getSymbol|Date\.now|potentialGain|useState\([^)]*(?:price|time)|localStorage|sessionStorage/);
  assert.match(source, /useState\(""\)/);
  assert.equal([...source.matchAll(/fetch\(/g)].length, 1, 'Only explicit send has a request');
  assert.match(source, /if \(!active\) return/); assert.match(source, /URL.revokeObjectURL/);
  const card = load('app/(dashboard)/admin/watchlist/watchlist-manual-loss-card.tsx').WatchlistManualLossCard;
  const markup = require('react-dom/server').renderToStaticMarkup(card({ symbol: 'TEST', loss: model.calculateManualLoss({ ...input, notes: '<script>unsafe</script>' }) }));
  assert.match(markup, /--academy-negative/); assert.match(markup, /−25.00%/); assert.match(markup, /&lt;script&gt;/); assert.doesNotMatch(markup, /<script>|High observed|Best observed|Measured from/);
  assert.match(markup, /Entry price/); assert.match(markup, /Exit price/); assert.match(markup, /watchlist-potential-gain-stats/);
  assert.doesNotMatch(fs.readFileSync(path.join(root, 'app/watchlist/live-watchlist-client.tsx'), 'utf8'), /[Mm]anualLoss/);
  const noNotes = require('react-dom/server').renderToStaticMarkup(card({ symbol: 'TEST', loss: model.calculateManualLoss({ ...input, notes: '' }) }));
  assert.doesNotMatch(noNotes, /Notes|<section/);
});
test('actual shared Gain card loses only the entire measured-from footer; posting still captures that same card', () => {
  const source = fs.readFileSync(path.join(root, 'app/watchlist/live-watchlist-client.tsx'), 'utf8');
  const card = source.slice(source.indexOf('export function PotentialGainCard'), source.indexOf('function WatchlistDetailEntryGuidanceNotice'));
  assert.doesNotMatch(card, /Measured from|Based on observed|watchlist-potential-gain-note/);
  assert.match(card, /gain.startingPrice/); assert.match(card, /gain.highPrice/); assert.match(card, /gain.highPriceAt/);
  assert.match(fs.readFileSync(path.join(root, 'app/(dashboard)/admin/watchlist/watchlist-potential-gain-post.tsx'), 'utf8'), /<PotentialGainCard symbol=\{ticker\}/);
});
