import type { CompanyTechnicals } from "@/src/modules/company/company-technicals";
import { companySessionRanges } from "@/src/modules/company/company-technicals";
import { indicatorDisplayRows } from "@/src/modules/market-data/indicators/indicator-presentation";
import { MoomooChartHistory } from "@/src/modules/market-data/server/moomoo-chart-history";
import type { WorkspaceMoomooConnection } from "@/src/modules/market-data/server/workspace-moomoo-access";
import { easternDayStart } from "@/src/modules/scanner/alpaca/candles";
import { readAlpacaTradeCorrectionEvidence } from "@/src/modules/scanner/alpaca/client";
import { historyCalendar, scannerIndicatorResults } from "@/src/modules/scanner/live/scanner-indicator-calculation";
import { prepareScannerIndicatorRows, SCANNER_INDICATOR_FRAMES } from "@/src/modules/scanner/live/scanner-indicator-read";
import { easternClock } from "@/src/modules/scanner/live/sessions";

const dayMillis = 86_400_000;
const localDayStart = (date: string) => easternDayStart(Date.parse(`${date}T12:00:00Z`) / 1000) * 1000;

export async function readBrokerCompanyHistory(
  request: Request, symbol: string, query: URLSearchParams, connection: WorkspaceMoomooConnection,
) {
  const headers = { "Cache-Control": "private, no-store" };
  const reply = (body: unknown, status = 200) => Response.json(body, { headers, status });
  const range = query.get("range");
  const frame = SCANNER_INDICATOR_FRAMES.find(value => value === query.get("frame"));
  const adjustment = query.get("adjustment");
  const compact = query.get("compact") === "1";
  if (compact && query.get("generation") !== connection.generation) return reply({}, 409);
  if (range !== null && (range !== "52w" || (adjustment !== "raw" && adjustment !== "split"))) return reply({}, 400);
  if (range === null && !frame) return reply({}, 400);

  const now = Date.now();
  const { date, minute } = easternClock(now);
  const signal = AbortSignal.any([request.signal, AbortSignal.timeout(20_000)]);
  const history = new MoomooChartHistory(input => connection.request(input, signal), () => now,
    range => readAlpacaTradeCorrectionEvidence(range, process.env, signal));
  const replyCurrent = (payload: unknown) => connection.current() && !signal.aborted && easternClock(Date.now()).date === date
    ? reply(payload) : reply({}, 409);
  try {
    if (range === "52w") {
      const calendar = await history.calendar(date, date);
      if (!calendar.available) return reply({}, 503);
      const close = calendar.sessions[0]?.close;
      const includeToday = close != null && minute >= (close === "13:00" ? 785 : 965);
      const startDate = new Date(Date.parse(`${date}T12:00:00Z`) - 364 * dayMillis).toISOString().slice(0, 10);
      const coverage = await history.history({
        symbol, timeframe: "1Day", start: localDayStart(startDate),
        end: includeToday ? now : localDayStart(date) - 1, adjustment: adjustment === "raw" ? "raw" : "split",
      });
      if (!coverage.complete || coverage.basisDate !== date || coverage.adjustment !== adjustment) return reply({}, 503);
      const { bars } = coverage;
      const high = bars.reduce<(typeof bars)[number] | undefined>((best, bar) => !best || bar.high >= best.high ? bar : best, undefined);
      const low = bars.reduce<(typeof bars)[number] | undefined>((best, bar) => !best || bar.low <= best.low ? bar : best, undefined);
      const yearRange: CompanyTechnicals["yearRange"] = high && low ? {
        high: high.high, low: low.low, highDate: easternClock(high.time * 1000).date, lowDate: easternClock(low.time * 1000).date,
      } : undefined;
      return replyCurrent({ yearRange });
    }
    if (!frame) return reply({}, 400);
    const startDate = new Date(Date.parse(`${date}T12:00:00Z`) - 7 * dayMillis).toISOString().slice(0, 10);
    const through = Math.floor(now / 60_000) * 60_000;
    const [coverage, calendar] = await Promise.all([
      history.history({ symbol, timeframe: "1Min", start: localDayStart(startDate), end: through, adjustment: "split" }),
      history.calendar(startDate, date),
    ]);
    if (!calendar.available || !coverage.complete || coverage.basisDate !== date || coverage.adjustment !== "split") return reply({}, 503);
    const { bars } = coverage;
    const { result, vwap } = scannerIndicatorResults(bars, frame, through, historyCalendar(calendar));
    const readings = indicatorDisplayRows({ result, timeframe: frame, livePrice: null, vwap: vwap?.value ?? null, vwapSignals: vwap?.signals });
    if (compact) return replyCurrent({ symbol, frame, vwap: vwap?.value ?? null, rows: prepareScannerIndicatorRows(readings, result) });
    const days = companySessionRanges(
      bars.filter(bar => bar.time * 1000 + 60_000 <= through),
      calendar.sessions.slice(-2),
    ).reverse();
    return replyCurrent({ frame, vwap: vwap?.value ?? null, days, readings });
  } catch {
    return reply({}, connection.current() ? 503 : 409);
  }
}
