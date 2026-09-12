// Read-only, bounded export for the owner-authorized 2026-09-12 reference QA.
// Pipe stdout directly into verify-watchlist-indicator-reference.cjs locally.
const fs = require('node:fs'), path = require('node:path'), zlib = require('node:zlib');
const assert = require('node:assert/strict');
assert.equal(new Date().toISOString().slice(0,10), '2026-09-12');
const symbols = ['TRUG','TNON','AENT','FTFT','FEIM','BDRX','SURG','SXTC','PCLA'];
const root = path.join(path.dirname(process.env.TRADERLINK_PLATFORM_DB_PATH), 'watchlist-indicator-audit');
const names = fs.readdirSync(root);
assert.ok(names.length < 21000);
const records = names.filter(n => /^\d{13}_[a-f0-9-]{36}\.json$/.test(n))
  .map(n => {const b=fs.readFileSync(path.join(root,n));assert.ok(b.length<=131072);return JSON.parse(b);});
const snapshots = symbols.map(symbol => {
  const r = records.filter(r => r.symbol===symbol && r.timeframes.length && r.calculationId).sort((a,b)=>b.queuedAt-a.queuedAt)[0];
  assert.ok(r);
  const name = names.find(n => n.endsWith('_'+r.calculationId+'.json.gz'));
  assert.ok(name);
  const e = JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(root,name)),{maxOutputLength:8388608}));
  assert.equal(e.symbol,symbol);assert.equal(e.timeframes.length,4);
  // Project only calculation evidence; no database identities, secrets, news or owner drafts.
  return {symbol,createdAt:e.createdAt,algorithmVersion:e.algorithmVersion,timeframes:e.timeframes,vwap:e.vwap};
});
console.log('INDICATOR_REFERENCE_INPUTS='+zlib.gzipSync(JSON.stringify(snapshots)).toString('base64'));
