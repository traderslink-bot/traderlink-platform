import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { CoachUsEquitiesReviewCalendarService } from "@/src/modules/coach/server/market-calendar/coach-us-equities-review-calendar-service";
import { resolvePlatformDatabaseConfig } from "@/src/modules/platform/server/database/platform-database-config";
import { isAuthorizedCompanyRosterRequest } from "@/src/modules/scanner/live/server/company-roster-request-authorization";
import { UniverseStore } from "@/src/modules/scanner/live/server/universe-store";
import { easternClock } from "@/src/modules/scanner/live/sessions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const hash = (text: string) => createHash("sha256").update(text).digest();
const headers = { "Cache-Control": "private, no-store" };
const exchangeCalendar = new CoachUsEquitiesReviewCalendarService();

function calendarFor(date: string) {
  const metadata = exchangeCalendar.metadataForRange(date, date);
  const from = metadata.coverageStartDate;
  const through = metadata.coverageEndDate;
  const tradingDates: string[] = [];
  const last = Date.parse(through);
  for (let day = Date.parse(from); day <= last; day += 86_400_000) {
    const sessionDate = new Date(day).toISOString().slice(0, 10);
    if (exchangeCalendar.session(sessionDate).state === "open") tradingDates.push(sessionDate);
  }
  const calendar = { from, through, tradingDates };
  return { ...calendar, digest: hash(JSON.stringify(calendar)).toString("hex"), evidenceDigest: metadata.evidenceDigestSha256 };
}

let calendar: ReturnType<typeof calendarFor> | undefined;

export async function GET(request: Request) {
  const token = process.env.TRADERLINK_COMPANY_ROSTER_READ_TOKEN;
  if (!token || token.length < 32) return new Response(null, { status: 503, headers });
  if (!isAuthorizedCompanyRosterRequest(request, token))
    return new Response(null, { status: 401, headers });

  try {
    const date = easternClock(Date.now()).date;
    const store = new UniverseStore(join(dirname(resolvePlatformDatabaseConfig().databasePath), "scanner-live-v1"));
    const roster = await store.readLatestOnOrBefore(date);
    if (!roster || !roster.stocks.length) return new Response(null, { status: 503, headers });
    if (!calendar || date < calendar.from || date > calendar.through) calendar = calendarFor(date);
    return Response.json({
      sourceDate: roster.tradingDate,
      acceptedAtUtc: roster.acceptedAtUtc,
      tickers: roster.stocks.map(stock => stock.symbol).sort(),
      calendar,
    }, { headers });
  } catch {
    return new Response(null, { status: 503, headers });
  }
}
