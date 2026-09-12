// Run only inside the existing production container with explicit opt-in.
// Reuses compiled publisher authentication/owner selection. No credential output,
// OAuth refresh, writes, installation, server startup or app-process modification.
const { createRequire } = require('node:module');
const path = require('node:path');
if (!process.argv.includes('--allow-readonly-native-history')) throw Error('Explicit native-history opt-in required');
const local = createRequire(path.join(process.cwd(), 'package.json'));
const sqlitePath = local.resolve('better-sqlite3');
const Database = local(sqlitePath);
require.cache[sqlitePath].exports = new Proxy(Database, {
  construct(target, args) {
    const db = Reflect.construct(target, [args[0], { ...args[1], readonly: true, fileMustExist: true }]);
    db.pragma('query_only = ON');
    return db;
  },
});
const originalFetch = globalThis.fetch;
let intercepted = false;
const summaries = [];
globalThis.fetch = async (input, options = {}) => {
  const originalUrl = new URL(typeof input === 'string' || input instanceof URL ? input : input.url);
  if (intercepted || originalUrl.origin !== 'https://webapi.moomoo.com'
    || originalUrl.pathname !== '/api/v1.0/quote/US.TRUG/history-kline'
    || (options.method && options.method !== 'GET')) throw Error('Diagnostic network boundary');
  intercepted = true;
  const nextDate = process.argv.includes('--next-date');
  for (const [frame, ktype] of (nextDate ? [['1m', '1'], ['5m', '6'], ['15m', '7']] : [['5m', '6'], ['15m', '7'], ['1d', '2']])) {
    const url = new URL(originalUrl);
    url.search = new URLSearchParams({ start: frame === '1d' ? '2025-09-12' : '2026-09-11', end: nextDate ? '2026-09-12' : '2026-09-11',
      ktype, autype: '1', extended_time: frame === '1d' ? '0' : '1', num: '370' }).toString();
    const response = await originalFetch(url, { headers: options.headers, method: 'GET', redirect: 'error', signal: AbortSignal.timeout(15000) });
    if (!response.ok) { summaries.push({ frame, httpStatus: response.status }); break; }
    const payload = await response.json();
    const rows = Array.isArray(payload.data?.kline_list) ? payload.data.kline_list : [];
    const times = rows.map(row => Number(row.time_key)).filter(Number.isSafeInteger).sort((a,b) => a-b);
    summaries.push({ frame, httpStatus: response.status, retCode: payload.ret_code, bars: rows.length,
      first: times.slice(0, 3).map(t => new Date(t).toISOString()), last: times.slice(-3).map(t => new Date(t).toISOString()),
      priceFieldNames: rows.length ? ['open','high','low','close','open_price','high_price','low_price','close_price'].filter(key => key in rows[0]) : [],
      hasMore: payload.pagination?.has_more ?? null, hasPositiveNextTime: Number(payload.data?.next_time) > 0 });
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  // Stop the existing 1m bridge after the diagnostic requests; never publish a modified candle response.
  return Response.json({ ret_code: 0, data: { kline_list: [] }, pagination: { has_more: false } });
};
(async () => {
  const compiled = local(path.join(process.cwd(), '.next/server/app/api/live-watchlist/moomoo-candles/route.js'));
  const get = compiled.routeModule?.userland?.GET ?? compiled.GET;
  if (typeof get !== 'function') throw Error('Compiled route unavailable');
  const token = process.env.TRADERSLINK_WATCHLIST_PUBLISHER_TOKEN?.trim();
  if (!token) throw Error('Publisher configuration unavailable');
  const response = await get(new Request('https://traderslink.pro/api/live-watchlist/moomoo-candles?symbol=TRUG&start=1789113600&end=1789171200',
    { headers: { authorization: `Bearer ${token}` } }));
  console.log(JSON.stringify({ diagnostic: 'readonly-native-history', intercepted, routeStatus: response.status, summaries }));
})().catch(() => { console.log(JSON.stringify({ diagnostic: 'readonly-native-history', result: 'unavailable', intercepted, summaries })); process.exitCode = 1; });
