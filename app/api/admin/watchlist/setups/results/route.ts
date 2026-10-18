import { withJournalAdminDatabase } from "@/src/modules/platform/server/administration/platform-admin-authorization";
import { watchlistSetupStore } from "@/src/modules/watchlist/server/setups/setup-store";
import { SetupResultsAccumulator, SETUP_RESULT_WINDOWS } from "@/src/lib/live-watchlist/setups/setup-results";
import type { SetupResultFilter } from "@/src/lib/live-watchlist/setups/setup-results";
import { INITIAL_WATCHLIST_SETUP_KINDS } from "@/src/lib/live-watchlist/setups/setup-contracts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "cache-control": "private, no-store", "x-content-type-options": "nosniff" };
const json = (value: unknown, status = 200) => Response.json(value, { status, headers });
let pending = false;
export async function GET(request: Request): Promise<Response> {
  try { withJournalAdminDatabase(request.headers, () => true); } catch { return json({ error: "Not found." }, 404); }
  const params = new URL(request.url).searchParams;
  const minutes = Number(params.get("minutes") ?? "30"), page = Number(params.get("page") ?? "1");
  const symbol = params.get("symbol")?.trim().toUpperCase() || undefined;
  const kind = params.get("kind") || undefined, session = params.get("session") || undefined;
  const from = params.get("from") || undefined, to = params.get("to") || undefined;
  const rules = params.get("rules") || undefined;
  const evidence = params.get("evidence"), publication = params.get("publication");
  if (evidence !== null && (!/^[a-zA-Z0-9:._-]{1,160}$/u.test(evidence) || !publication || !/^[a-f0-9-]{36}$/iu.test(publication)))
    return json({ error: "Invalid saved input reference." }, 400);
  const validDate = (date?: string) => !date || /^\d{4}-\d{2}-\d{2}$/u.test(date) && !Number.isNaN(Date.parse(`${date}T12:00:00Z`)) && new Date(`${date}T12:00:00Z`).toISOString().slice(0, 10) === date;
  if (!SETUP_RESULT_WINDOWS.includes(minutes as 5) || !Number.isSafeInteger(page) || page < 1 || page > 10000
    || symbol && !/^[A-Z][A-Z0-9.-]{0,15}$/u.test(symbol)
    || kind && !INITIAL_WATCHLIST_SETUP_KINDS.includes(kind as typeof INITIAL_WATCHLIST_SETUP_KINDS[number])
    || rules && !/^[a-zA-Z0-9._-]{1,80}$/u.test(rules)
    || session && !["premarket", "regular", "postmarket"].includes(session) || !validDate(from) || !validDate(to) || from && to && from > to)
    return json({ error: "Choose valid result filters." }, 400);
  // An explicit scan cannot stampede the persistent volume. No provider calls.
  if (pending) return json({ error: "Results are already loading. Try again shortly." }, 429);
  pending = true;
  try {
    const accumulator = new SetupResultsAccumulator(); let unreadable = 0;
    for await (const item of watchlistSetupStore().resultEvidence(request.signal)) {
      if (evidence !== null) {
        if (item.record?.input.revision === evidence && item.record.input.publicationIdentity === publication
          && (!rules || item.record.evaluation.rulesVersion === rules)) return json({ record: item.record });
        continue;
      }
      if (item.unreadable) unreadable++;
      else if (item.record) { try { accumulator.add(item.record); } catch { unreadable++; } }
    }
    if (evidence !== null) return json({ error: "These inputs are no longer retained. No substitute inputs were generated." }, 404);
    return json(accumulator.results({ minutes, page, symbol, kind, session, rules, from, to } as SetupResultFilter));
  } catch { return json({ error: "Saved setup results could not be loaded. Existing detection and publishing are unaffected." }, 503); }
  finally { pending = false; }
}
