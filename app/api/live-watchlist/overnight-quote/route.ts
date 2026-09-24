import { timingSafeEqual } from 'node:crypto';
import { fetchWatchlistOvernightQuote } from '@/src/modules/watchlist/server/moomoo-watchlist-overnight-quote';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request): Promise<Response> {
  const expected = process.env.TRADERSLINK_WATCHLIST_PUBLISHER_TOKEN?.trim();
  const supplied = request.headers.get('authorization')?.replace(/^Bearer /i, '').trim();
  const headers = { 'Cache-Control': 'no-store' };
  if (!expected || !supplied || Buffer.byteLength(expected) !== Buffer.byteLength(supplied) ||
    !timingSafeEqual(Buffer.from(expected), Buffer.from(supplied))) {
    return Response.json({ status: 'unauthorized' }, { status: 401, headers });
  }
  const symbol = new URL(request.url).searchParams.get('symbol')?.trim().toUpperCase() ?? '';
  if (!/^[A-Z][A-Z0-9.-]{0,15}$/.test(symbol)) return Response.json({ status: 'invalid' }, { status: 400, headers });
  try {
    const reference = await fetchWatchlistOvernightQuote(symbol);
    return Response.json(reference ? { status: 'ready', symbol, reference } : { status: 'unavailable' }, { headers });
  } catch {
    return Response.json({ status: 'unavailable' }, { headers });
  }
}
