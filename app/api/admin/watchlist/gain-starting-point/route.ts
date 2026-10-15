import { withJournalAdminDatabase } from '@/src/modules/platform/server/administration/platform-admin-authorization';
import { requireJournalAdminMutationRequest } from '@/src/modules/platform/server/administration/platform-admin-request-security';
import { LiveWatchlistStore } from '@/src/lib/live-watchlist/live-watchlist-store';
import { gainStartingPointView } from '@/src/lib/live-watchlist/gain-starting-point';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'cache-control': 'private, no-store' } });
const validSymbol = (value: unknown): value is string => typeof value === 'string' && /^[A-Z][A-Z0-9]{0,9}(?:[.-][A-Z0-9]{1,2})?$/.test(value);
export async function GET(request: Request) {
  try { withJournalAdminDatabase(request.headers, () => true); } catch { return json({error:'Not found.'},404); }
  const symbol = new URL(request.url).searchParams.get('symbol');
  if (!validSymbol(symbol)) return json({error:'Invalid ticker.'},400);
  try {
    const state = await new LiveWatchlistStore().getSymbol(symbol);
    if (!state?.firstPostedAt || state.status === 'deactivated') return json({error:'Publish this ticker before setting its gain starting point.'},404);
    return json(gainStartingPointView(state));
  } catch { return json({error:'Starting point could not be loaded. Close and reopen to try again.'},503); }
}
export async function POST(request: Request) {
  try { requireJournalAdminMutationRequest(request); withJournalAdminDatabase(request.headers, () => true); } catch { return json({error:'Not found.'},404); }
  let body;
  try {
    if (!request.body) return json({error:'Missing input.'},400);
    const reader=request.body.getReader(); let text=''; const decoder=new TextDecoder(); let size=0;
    for (;;) { const r=await reader.read(); if(r.done)break; size+=r.value.length;if(size>4096){await reader.cancel();return json({error:'Input too large.'},413);}text+=decoder.decode(r.value,{stream:true}); }
    body=JSON.parse(text+decoder.decode());
  } catch { return json({error:'Invalid input.'},400); }
  if (!body || !validSymbol(body.symbol) || !Number.isSafeInteger(body.publicationAt) || !Number.isSafeInteger(body.revision) || (body.reset !== undefined && typeof body.reset !== 'boolean')) return json({error:'Invalid starting point.'},400);
  try {
    const state=await new LiveWatchlistStore().setGainStartingPoint(body.symbol,{publicationAt:body.publicationAt,revision:body.revision,reset:body.reset===true,price:body.price,at:body.at});
    return json(gainStartingPointView(state));
  } catch (e) { return json({error:e instanceof Error && /^(This listing|Ticker is|The starting|No original|Enter a)/.test(e.message)?e.message:'Starting point could not be saved. Try again.'},409); }
}
