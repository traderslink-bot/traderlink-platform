import { requireTraderLinkPlatformRequestIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { requirePlatformMutationRequest } from "@/src/modules/platform/server/authentication/platform-mutation-request-security";
import { hasOwnerMarketDataAccess } from "@/src/modules/level-analysis/server/owner-market-data-access";
import { readOwnerMarketData, requestOwnerMarketData, validOwnerMarketRequest } from "@/src/modules/level-analysis/server/owner-market-data-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
const reply = (body: unknown, status = 200) => Response.json(body, { status, headers });
// This application runs one persistent Node process. Keep owner requests serial
// even across tabs or when a disconnected client leaves a request running.
let ownerRequestQueue: Promise<void> = Promise.resolve();
function authorized(request: Request): boolean {
  try { return hasOwnerMarketDataAccess(requireTraderLinkPlatformRequestIdentity(request.headers)); }
  catch { return false; }
}
export function GET(request: Request) {
  if (!authorized(request)) return reply({ message: "Access denied." }, 403);
  const query = new URL(request.url).searchParams;
  const symbol = query.get("symbol") || undefined;
  const date = query.get("date") || undefined;
  const offset = Number(query.get("offset") ?? "0");
  if ([...query.keys()].some((key) => !["symbol", "date", "offset"].includes(key) || query.getAll(key).length !== 1) ||
    !Number.isSafeInteger(offset) || offset < 0 ||
    (symbol && !validOwnerMarketRequest({ symbol, date: date ?? "2000-01-01" })) ||
    (date && !validOwnerMarketRequest({ symbol: symbol ?? "A", date }))) return reply({ message: "Invalid inventory filter." }, 400);
  try { return reply({ sessions: readOwnerMarketData(symbol, date, offset) }); }
  catch { return reply({ message: "The application could not read saved market data." }, 503); }
}
export async function POST(request: Request) {
  if (!authorized(request)) return reply({ message: "Access denied." }, 403);
  try { requirePlatformMutationRequest(request); } catch { return reply({ message: "Access denied." }, 403); }
  let input: unknown;
  try { input = await request.json(); } catch { return reply({ message: "Enter a valid symbol and date." }, 400); }
  if (!validOwnerMarketRequest(input)) return reply({ message: "Enter a valid symbol and date." }, 400);
  const validated = input;
  const operation = ownerRequestQueue.then(async () => {
    // A queued request must still be authorized when it actually starts.
    if (!authorized(request)) return reply({ message: "Access denied." }, 403);
    try { return reply(await requestOwnerMarketData(validated)); }
    catch { return reply({ ok: false, message: "The application could not save this request. Its failure history may be unavailable." }, 503); }
  });
  ownerRequestQueue = operation.then(() => undefined, () => undefined);
  return operation;
}
