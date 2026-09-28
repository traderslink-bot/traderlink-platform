import { withJournalAdminDatabase } from "@/src/modules/platform/server/administration/platform-admin-authorization";
import { requireJournalAdminMutationRequest } from "@/src/modules/platform/server/administration/platform-admin-request-security";
import { openPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { LiveWatchlistStore } from "@/src/lib/live-watchlist/live-watchlist-store";
import { GAIN_MAX_BYTES, sendPotentialGainPost } from "@/src/modules/watchlist/server/notifications/watchlist-potential-gain-post";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "cache-control": "private, no-store", "x-content-type-options": "nosniff" };
const json = (value: unknown, status = 200) => Response.json(value, { status, headers });
const symbolPattern = /^[A-Z][A-Z0-9]{0,9}(?:[.-][A-Z0-9]{1,2})?$/;
export async function GET(request: Request) {
  try { withJournalAdminDatabase(request.headers, () => true); } catch { return json({ error: "Not found." },404); }
  const symbol = new URL(request.url).searchParams.get("symbol") ?? "";
  if (!symbolPattern.test(symbol)) return json({ error: "Invalid ticker." },400);
  try {
    const state = await new LiveWatchlistStore().getSymbol(symbol);
    if (!state || state.status === "deactivated" || !state.potentialGain) return json({ error: "This ticker does not have a published potential gain card yet." },404);
    return json({ symbol: state });
  } catch { return json({ error: "The card could not be loaded. Try again." },503); }
}
export async function POST(request: Request) {
  let ownerUserId: string;
  try { requireJournalAdminMutationRequest(request); ownerUserId = withJournalAdminDatabase(request.headers, (_db, scope) => scope.userId); }
  catch { return json({ error: "Not found." },404); }
  let form: FormData;
  try {
    // Bound actual bytes, not just the caller-controlled Content-Length header.
    if (!request.body) return json({ error: "Missing post." },400);
    const reader = request.body.getReader(); const chunks: Uint8Array[] = []; let total = 0;
    for (;;) { const result = await reader.read(); if (result.done) break; total += result.value.length;
      if (total > GAIN_MAX_BYTES + 65536) { await reader.cancel(); return json({ error: "The card image is too large." },413); } chunks.push(result.value); }
    form = await new Response(new Blob(chunks as BlobPart[]), { headers: { "content-type": request.headers.get("content-type") ?? "" } }).formData();
  } catch { return json({ error: "Invalid card post." },400); }
  const symbol = form.get("symbol"), requestId = form.get("requestId"), message = form.get("message"), image = form.get("image");
  if (typeof symbol !== "string" || !symbolPattern.test(symbol) || typeof requestId !== "string" || typeof message !== "string" || !(image instanceof File)) return json({ error: "Invalid card post." },400);
  const database = openPlatformDatabase({ mode: "runtime" });
  try {
    return json(await sendPotentialGainPost(database, { ownerUserId, symbol, requestId, message, png: new Uint8Array(await image.arrayBuffer()) }));
  } catch { return json({ error: "The post could not complete. Check Discord before trying again." },503); }
  finally { database.close(); }
}
