import { withJournalAdminDatabase } from "@/src/modules/platform/server/administration/platform-admin-authorization";
import { requireJournalAdminMutationRequest } from "@/src/modules/platform/server/administration/platform-admin-request-security";
import { analysisVisibilitySymbol, readAnalysisPremiumOnly, saveAnalysisPremiumOnly } from "@/src/modules/watchlist/server/access/watchlist-analysis-visibility";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
const json = (body: unknown, status = 200) => Response.json(body, { status, headers });

export async function GET(request: Request) {
  try { withJournalAdminDatabase(request.headers, () => true); }
  catch { return json({ error: "Not found." }, 404); }
  const symbol = (new URL(request.url).searchParams.get("symbol") ?? "").toUpperCase();
  if (!analysisVisibilitySymbol.test(symbol)) return json({ error: "Invalid ticker." }, 400);
  try { return json(withJournalAdminDatabase(request.headers, db => ({ symbol, premiumOnly: readAnalysisPremiumOnly(db, symbol) }))); }
  catch { return json({ error: "Analysis access could not be loaded." }, 503); }
}

export async function POST(request: Request) {
  try { requireJournalAdminMutationRequest(request); withJournalAdminDatabase(request.headers, () => true); }
  catch { return json({ error: "Not found." }, 404); }
  let input: { symbol?: unknown; premiumOnly?: unknown };
  try {
    const body = await request.text();
    if (body.length > 256) return json({ error: "Invalid access setting." }, 400);
    input = JSON.parse(body);
  } catch { return json({ error: "Invalid access setting." }, 400); }
  if (!input || typeof input.symbol !== "string" || !analysisVisibilitySymbol.test(input.symbol) || typeof input.premiumOnly !== "boolean")
    return json({ error: "Invalid access setting." }, 400);
  const symbol = input.symbol, premiumOnly = input.premiumOnly;
  try {
    withJournalAdminDatabase(request.headers, (db, scope) => saveAnalysisPremiumOnly(db, { symbol, premiumOnly, actorUserId: scope.userId }));
    return json({ symbol, premiumOnly });
  } catch { return json({ error: "Analysis access was not saved. Try again." }, 503); }
}
