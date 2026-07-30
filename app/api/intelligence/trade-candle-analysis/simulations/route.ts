import {
  analyzeTradeCandles,
  compactCandlesToFiveMinutes,
  type TradeCandle,
} from "@/src/lib/trade-candle-analysis/candle-analysis";
import { selectExecutionRelevantPatterns } from "@/src/lib/trade-candle-analysis/execution-relevance";
import { detectMicroCapCandlePatterns } from "@/src/lib/trade-candle-analysis/pattern-detection";
import { fetchYahooOneMinuteCandles } from "@/src/lib/trade-candle-analysis/yahoo-candles";
import {
  withTraderIntelligenceOwnerRoute,
} from "@/src/lib/trader-intelligence-v3/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROUTE_PATH = "app/api/intelligence/trade-candle-analysis/simulations/route.ts";
const SIMULATION_SYMBOLS = new Set(["CYCU", "GCTK", "NUWE"]);
const EASTERN_PARTS = new Intl.DateTimeFormat("en-US", {
  day: "2-digit",
  hour: "2-digit",
  hour12: false,
  minute: "2-digit",
  month: "2-digit",
  timeZone: "America/New_York",
  year: "numeric",
});

type EasternTime = { date: string; clock: string };

function easternTime(time: number): EasternTime {
  const parts = EASTERN_PARTS.formatToParts(new Date(time * 1000));
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "00";
  return {
    date: `${value("year")}-${value("month")}-${value("day")}`,
    clock: `${value("hour")}:${value("minute")}`,
  };
}

function sessionCandles(candles: readonly TradeCandle[]): readonly TradeCandle[] {
  const latestDate = candles.at(-1) ? easternTime(candles.at(-1)!.time).date : null;
  if (!latestDate) return [];
  return candles.filter((candle) => {
    const eastern = easternTime(candle.time);
    return (
      eastern.date === latestDate &&
      eastern.clock >= "09:00" &&
      eastern.clock <= "11:00"
    );
  });
}

function noScenarioResponse(symbol: string, reason: string): Response {
  return Response.json({
    status: "no_feedback",
    symbol,
    reason,
  });
}

async function GETHandler(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const symbol = (url.searchParams.get("symbol") ?? "CYCU").trim().toUpperCase();
  if (!SIMULATION_SYMBOLS.has(symbol)) {
    return noScenarioResponse(symbol, "This experimental simulation symbol is not available.");
  }

  const now = Math.floor(Date.now() / 1000);
  const yahoo = await fetchYahooOneMinuteCandles({
    symbol,
    startTime: now - 5 * 24 * 60 * 60,
    endTime: now,
  });
  if (!yahoo.ok) {
    return noScenarioResponse(symbol, "Yahoo candles are unavailable for this simulation.");
  }
  const session = sessionCandles(yahoo.candles);
  const entry = session.find((candle) => easternTime(candle.time).clock === "09:30");
  if (!entry) {
    return noScenarioResponse(symbol, "No 9:30 AM regular-hours candle was available.");
  }

  const candidate = session
    .filter((candle) => {
      const clock = easternTime(candle.time).clock;
      return clock >= "09:35" && clock <= "10:00" && candle.close > entry.open;
    })
    .map((exit) => ({
      exit,
      result: analyzeTradeCandles({
        candles: yahoo.candles,
        trade: {
          direction: "long",
          entryPrice: entry.open,
          entryTime: entry.time,
          exitPrice: exit.close,
          exitTime: exit.time,
        },
      }),
    }))
    .filter((item) => item.result.exitTiming.kind === "finding")
    .find((item) =>
      item.result.exitTiming.title === "Price continued higher after exit.",
    );

  if (!candidate) {
    return noScenarioResponse(
      symbol,
      "No profitable early-exit simulation with complete active-volume coverage was found between 9:35 and 10:00 AM.",
    );
  }

  const replay = session.filter((candle) => {
    const clock = easternTime(candle.time).clock;
    return clock >= "09:30" && clock < "11:00";
  });
  return Response.json({
    status: "ready",
    symbol,
    replay: compactCandlesToFiveMinutes(replay),
    simulatedTrade: {
      direction: "long",
      entryPrice: entry.open,
      entryTime: entry.time,
      exitPrice: candidate.exit.close,
      exitTime: candidate.exit.time,
    },
    results: candidate.result,
    patternObservations: selectExecutionRelevantPatterns({
      candles: yahoo.candles,
      events: detectMicroCapCandlePatterns(yahoo.candles),
      trade: {
        direction: "long",
        entryPrice: entry.open,
        entryTime: entry.time,
        exitPrice: candidate.exit.close,
        exitTime: candidate.exit.time,
      },
    }),
  });
}

export const GET = withTraderIntelligenceOwnerRoute(ROUTE_PATH, GETHandler);
