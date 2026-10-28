import { withJournalAdminDatabase } from "@/src/modules/platform/server/administration/platform-admin-authorization";
import { requireJournalAdminMutationRequest } from "@/src/modules/platform/server/administration/platform-admin-request-security";
import { openPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { GAIN_MAX_BYTES, sendManualLossPost, validateGainPost } from "@/src/modules/watchlist/server/notifications/watchlist-potential-gain-post";
import { calculateManualLoss } from "@/src/lib/live-watchlist/manual-loss-card";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "cache-control": "private, no-store", "x-content-type-options": "nosniff" };
const json = (body: unknown, status = 200) => Response.json(body, { status, headers });

/** No GET or market-data load: all trade facts come from the owner's form. */
export async function POST(request: Request) {
  let ownerUserId: string;
  try {
    requireJournalAdminMutationRequest(request);
    ownerUserId = withJournalAdminDatabase(request.headers, (_db, scope) => scope.userId);
  } catch { return json({ error: "Not found." }, 404); }

  let form: FormData;
  try {
    if (!request.body) return json({ error: "Missing post." }, 400);
    const reader = request.body.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;
    for (;;) {
      const result = await reader.read();
      if (result.done) break;
      total += result.value.length;
      if (total > GAIN_MAX_BYTES + 65536) { await reader.cancel(); return json({ error: "The card image is too large." }, 413); }
      chunks.push(result.value);
    }
    form = await new Response(new Blob(chunks as BlobPart[]), { headers: { "content-type": request.headers.get("content-type") ?? "" } }).formData();
  } catch { return json({ error: "Invalid card post." }, 400); }

  const symbol = form.get("symbol"), requestId = form.get("requestId"), message = form.get("message"), image = form.get("image");
  const buyPrice = form.get("buyPrice"), sellPrice = form.get("sellPrice"), notes = form.get("notes");
  if (typeof symbol !== "string" || typeof requestId !== "string" || typeof message !== "string" || !(image instanceof File) || typeof buyPrice !== "string" || typeof sellPrice !== "string" || typeof notes !== "string") {
    return json({ error: "Invalid card post." }, 400);
  }
  const input = { ownerUserId, symbol, requestId, message, png: new Uint8Array(await image.arrayBuffer()), buyPrice, sellPrice, notes };
  try { validateGainPost(input); calculateManualLoss(input); }
  catch (error) { return json({ error: error instanceof Error ? error.message : "Check the entered trade." }, 400); }

  try {
    const database = openPlatformDatabase({ mode: "runtime" });
    try { return json(await sendManualLossPost(database, input)); }
    finally { database.close(); }
  } catch { return json({ error: "The post could not complete. Check Discord before trying again." }, 503); }
}
