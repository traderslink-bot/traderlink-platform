import 'server-only';
import { overnightResumeAfter, type OvernightLevelReference } from '@/src/lib/live-watchlist/overnight-level-reference';
import { withWatchlistIndicatorMoomooAccess } from './moomoo-watchlist-candle-bridge';

export async function fetchWatchlistOvernightQuote(symbol: string): Promise<OvernightLevelReference | null> {
  if (!/^[A-Z][A-Z0-9.-]{0,15}$/.test(symbol) || overnightResumeAfter(Date.now()) === null) return null;
  return withWatchlistIndicatorMoomooAccess(async ({ token }) => {
    const response = await fetch('https://webapi.moomoo.com/api/v1.0/quote/stock-quote', {
      method: 'POST', cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(8000),
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ code_list: [`US.${symbol}`] }),
    });
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
