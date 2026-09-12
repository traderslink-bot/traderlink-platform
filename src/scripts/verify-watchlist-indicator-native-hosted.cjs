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
async function fullMatrix(headers) {
  const assert = require('node:assert/strict');
  const packet = globalThis.__indicatorDiagnosticSources;
  if (!packet || !packet.calendar || !packet.modules) throw Error('Diagnostic source packet required');
  const ts = local('typescript'), cache = new Map();
  const load = name => {
    name = name.replace(/^\.\//, '');
    if (cache.has(name)) return cache.get(name);
    if (typeof packet.modules[name] !== 'string') throw Error('Diagnostic module outside allowlist');
    const exports = {}; cache.set(name, exports);
    const code = ts.transpileModule(packet.modules[name], { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
    new Function('require', 'exports', code)(load, exports);
    return exports;
  };
  const { IndicatorRefreshService } = load('indicator-refresh-service');
  const { IndicatorRequestCoordinator } = load('indicator-request-coordinator');
  const { fetchIndicatorHistory } = load('indicator-history-provider');
  const symbols = ['TRUG','TNON','AENT','FTFT','FEIM','BDRX','SURG','SXTC','PCLA'];
  let requests = 0, evidence = null, latestRecord = null;
  const transport = [];
  const coordinator = new IndicatorRequestCoordinator({ audit: event => transport.push({ outcome: event.outcome, httpStatus: event.httpStatus }) });
  const service = new IndicatorRefreshService({ calendar: packet.calendar, now: () => Date.parse('2026-09-12T00:00:00Z'),
    record: record => { latestRecord = record; }, saveCalculation: async value => { evidence = value; return true; },
    load: async input => {
      if (input.provider !== 'moomoo') return { provider: 'yahoo', adjustment: 'yahoo-chart-native', bars: [], transportIds: [], pages: 0, outcome: 'no_data', nextEnd: null };
      return fetchIndicatorHistory({ ...input, scope: 'readonly-diagnostic', coordinator,
        accessToken: 'forwarded-server-side-only', fetcher: async (url, options) => {
          const target = new URL(url);
          if (++requests > 90 || target.origin !== 'https://webapi.moomoo.com'
            || !symbols.some(symbol => target.pathname === `/api/v1.0/quote/US.${symbol}/history-kline`)) throw Error('Matrix network boundary');
          await new Promise(resolve => setTimeout(resolve, 1100));
          const response = await originalFetch(target, { ...options, headers, method: 'GET', redirect: 'error' });
          if (response.ok) {
            const payload = await response.clone().json();
            if (payload.ret_code !== 0) transport.push({ vendorCode: payload.ret_code });
          }
          return response;
        } });
    } });
  for (const symbol of symbols) {
    const before = requests, eventStart = transport.length; evidence = null;
    const snapshot = await service.refresh(symbol, `diagnostic:${symbol}`);
    const frames = Object.entries(snapshot.timeframes).map(([frame, result]) => ({ frame,
      bars: evidence?.timeframes.find(item => item.timeframe === frame)?.candles.length ?? 0,
      ready: result.ema9 !== null && result.ema20 !== null && result.rsi14 !== null && result.atr14 !== null,
      dataThrough: result.dataThrough }));
    let vwapVerified = false;
    if (evidence?.vwap?.coverageComplete && evidence.vwap.candles.every(bar => bar.volume !== null)) {
      const volume = evidence.vwap.candles.reduce((sum, bar) => sum + bar.volume, 0);
      const expected = evidence.vwap.candles.reduce((sum, bar) => sum + (bar.high + bar.low + bar.close) / 3 * bar.volume, 0) / volume;
      if (volume > 0) { assert.ok(Math.abs(snapshot.vwap.value - expected) < 1e-8); vwapVerified = true; }
    }
    const result = { symbol, requests: requests - before, frames, vwapVerified,
      transport: transport.slice(eventStart) };
    summaries.push(result); console.log(JSON.stringify({ matrix: result }));
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}
globalThis.fetch = async (input, options = {}) => {
  const originalUrl = new URL(typeof input === 'string' || input instanceof URL ? input : input.url);
  if (intercepted || originalUrl.origin !== 'https://webapi.moomoo.com'
    || originalUrl.pathname !== '/api/v1.0/quote/US.TRUG/history-kline'
    || (options.method && options.method !== 'GET')) throw Error('Diagnostic network boundary');
  intercepted = true;
  if (process.argv.includes('--full-matrix')) {
    await fullMatrix(options.headers);
    return Response.json({ ret_code: 0, data: { kline_list: [] }, pagination: { has_more: false } });
  }
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
