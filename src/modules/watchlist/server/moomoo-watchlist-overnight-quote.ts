import 'server-only';
import { overnightResumeAfter, type OvernightLevelReference } from '@/src/lib/live-watchlist/overnight-level-reference';
import { withWatchlistIndicatorMoomooAccess } from './moomoo-watchlist-candle-bridge';
import { alpacaMarketDataEnabled, requestAlpacaGateway } from '@/src/modules/scanner/alpaca/client';
import { sharedMoomooFetch } from '@/src/modules/platform/server/broker-connections/moomoo-shared-transport';

export async function fetchWatchlistOvernightQuote(symbol: string): Promise<OvernightLevelReference | null> {
  if (!/^[A-Z][A-Z0-9.-]{0,15}$/.test(symbol) || overnightResumeAfter(Date.now()) === null) return null;
  if (alpacaMarketDataEnabled()) {
    try {
      const result = await requestAlpacaGateway('overnight', new URLSearchParams({symbol})) as {feed:string;trade?:{p:number;t:string}};
      const checkedAt = Date.now(), resumeAfter = overnightResumeAfter(checkedAt);
      const providerAt = Date.parse(result.trade?.t ?? '');
      if (result.feed !== 'boats' || !resumeAfter || typeof result.trade?.p !== 'number' || !Number.isFinite(result.trade.p) || result.trade.p <= 0 || !Number.isFinite(providerAt) || providerAt > checkedAt + 2000 || providerAt < resumeAfter - 8*60*60*1000) return null;
      return {price:result.trade.p,checkedAt,resumeAfter,observedAt:providerAt};
    } catch { return null; }
  }
  return withWatchlistIndicatorMoomooAccess(async ({ token }) => {
    const response = await sharedMoomooFetch('https://webapi.moomoo.com/api/v1.0/quote/stock-quote', {
      method: 'POST', cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(8000),
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ code_list: [`US.${symbol}`] }),
    }, { priority: 'watchlist' });
    if (!response.ok) return null;
    const payload = await response.json();
    if (payload.ret_code !== 0) return null;
    const rows = payload.data?.quote_list;
    const quote = Array.isArray(rows) ? rows.find(row => row.code === `US.${symbol}`) : null;
    const price = quote?.overnight?.price;
    const checkedAt = Date.now();
    const resumeAfter = overnightResumeAfter(checkedAt);
    if (typeof price !== 'number' || !Number.isFinite(price) || price <= 0 || resumeAfter === null) return null;
    // data_time describes the regular quote; it is NOT an overnight trade time.
    return { price, checkedAt, resumeAfter };
  });
}
