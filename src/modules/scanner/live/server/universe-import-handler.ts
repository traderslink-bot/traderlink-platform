import { createHash, timingSafeEqual } from "node:crypto";
import { dirname, join } from "node:path";
import { resolvePlatformDatabaseConfig } from "../../../platform/server/database/platform-database-config";
import { CoachUsEquitiesReviewCalendarService } from "../../../coach/server/market-calendar/coach-us-equities-review-calendar-service";
import { easternClock } from "../sessions";
import { validateUniverseUpload } from "../universe-validation";
import type { DailyUniverse } from "../contracts";
import { UniverseStore } from "./universe-store";

const MAX_REQUEST_BYTES = 768_000;
const IMPORT_TOKEN_ENV = "TRADERLINK_SCANNER_UNIVERSE_IMPORT_TOKEN";
type Save = (value: unknown, now: number) => Promise<Readonly<{ universe: DailyUniverse; idempotent: boolean }>>;
type Options = Readonly<{ environment?: NodeJS.ProcessEnv; now?: () => number; isTradingDate?: (date: string) => boolean; save?: Save; bodyTimeoutMs?: number }>;
function response(status: number, code: string, extra: Record<string,unknown> = {}): Response {
  return Response.json({ code,...extra },{ status,headers: { "cache-control": "private, no-store, max-age=0" } });
}
function authorized(request: Request, token: string): boolean {
  const header = request.headers.get("authorization") ?? "";
  if (header.length > 520 || !/^Bearer [!-~]{32,512}$/iu.test(header)) return false;
  const supplied = header.slice(7);
  return timingSafeEqual(createHash("sha256").update(supplied).digest(),createHash("sha256").update(token).digest());
}
async function boundedJson(request: Request, timeoutMs: number): Promise<unknown> {
  if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") throw Error("unsupported_media_type");
  const length = request.headers.get("content-length");
  if (length !== null && (!/^\d+$/u.test(length) || Number(length) > MAX_REQUEST_BYTES)) throw Error("request_too_large");
  const reader = request.body?.getReader();
  if (!reader) throw Error("invalid_request");
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const deadline = new Promise<never>((_,reject) => { timer = setTimeout(() => {
      reject(Error("request_timeout")); void reader.cancel().catch(() => {});
    },timeoutMs); });
    const chunks: Uint8Array[] = []; let size = 0;
    for (;;) {
      const part = await Promise.race([reader.read(),deadline]);
      if (part.done) break;
      size += part.value.byteLength;
      if (size > MAX_REQUEST_BYTES) { await reader.cancel(); throw Error("request_too_large"); }
      chunks.push(part.value);
    }
    return JSON.parse(new TextDecoder("utf-8",{ fatal: true }).decode(Buffer.concat(chunks)));
  } finally { if (timer) clearTimeout(timer); reader.releaseLock(); }
}

/** Machine-scoped import authority only; this token never grants dashboard/admin access. */
export async function handleUniverseImport(request: Request, options: Options = {}): Promise<Response> {
  if (request.method !== "POST") return response(405,"method_not_allowed");
  const environment = options.environment ?? process.env;
  const token = environment[IMPORT_TOKEN_ENV];
  if (!token || !/^[!-~]{32,512}$/u.test(token)) return response(503,"scanner_import_not_configured");
  if (!authorized(request,token)) return response(401,"unauthorized");
  let value: unknown;
  try { value = await boundedJson(request,Math.max(1,Math.min(10_000,options.bodyTimeoutMs ?? 10_000))); }
  catch (error) {
    const code = error instanceof Error ? error.message : "invalid_request";
    return response(code === "request_too_large" ? 413 : code === "unsupported_media_type" ? 415 : code === "request_timeout" ? 408 : 400,
      ["request_too_large","unsupported_media_type","request_timeout"].includes(code) ? code : "invalid_request");
  }
  const now = (options.now ?? Date.now)();
  let checked;
  try {
    checked = validateUniverseUpload(value,now);
    if (checked.input.tradingDate !== easternClock(now).date) return response(409,"scanner_import_date_not_current");
  } catch (error) {
    const code = error instanceof Error ? error.message : "scanner_import_invalid";
    return response(400,/^scanner_universe_[a-z_]+$/u.test(code) ? code : "scanner_import_invalid");
  }
  try {
    const isTradingDate = options.isTradingDate ?? (date => new CoachUsEquitiesReviewCalendarService().session(date).state === "open");
    if (!isTradingDate(checked.input.tradingDate)) return response(409,"scanner_import_market_closed");
  } catch { return response(503,"scanner_import_calendar_unavailable"); }
  try {
    const save: Save = options.save ?? ((input,at) => new UniverseStore(join(dirname(resolvePlatformDatabaseConfig({ environment }).databasePath),"scanner-live-v1")).import(input,at));
    const result = await save(checked.input,now);
    return response(result.idempotent ? 200 : 201,result.idempotent ? "scanner_universe_already_imported" : "scanner_universe_imported",{
      tradingDate: result.universe.tradingDate, uploadCount: checked.stocks.length, retainedCount: result.universe.stocks.length,
      idempotent: result.idempotent, sourceHash: checked.hash,
    });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    const conflict = ["scanner_universe_exchange_conflict","scanner_universe_older_collection","scanner_universe_import_limit","scanner_universe_population_limit"].includes(code);
    return response(conflict ? 409 : 503,conflict ? code : "scanner_import_storage_unavailable");
  }
}
