import { NextResponse, type NextRequest } from "next/server";

import { fetchWatchlistMoomooCandles } from "@/src/modules/watchlist/server/moomoo-watchlist-candle-bridge";
import { marketDataSelection } from "@/src/modules/market-data/server/provider-settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SYMBOL_PATTERN = /^[A-Z][A-Z0-9.-]{0,15}$/u;
const MAX_RANGE_SECONDS = 24 * 60 * 60;

function expectedToken(): string | null {
  return process.env.TRADERSLINK_WATCHLIST_PUBLISHER_TOKEN?.trim() || null;
}

function getBearerToken(request: NextRequest): string | null {
  const header = request.headers.get("authorization") ?? "";
  return header.toLowerCase().startsWith("bearer ")
    ? header.slice("bearer ".length).trim() || null
    : null;
}

function parseSeconds(value: string | null): number | null {
  if (!value || !/^[0-9]{1,12}$/u.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const token = expectedToken();
  if (!token) {
    return NextResponse.json({ error: "Live watchlist publisher token is not configured." }, { status: 503 });
  }
  if (getBearerToken(request) !== token) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const url = new URL(request.url);
  const symbol = url.searchParams.get("symbol")?.trim().toUpperCase() ?? "";
  const startTime = parseSeconds(url.searchParams.get("start"));
  const endTime = parseSeconds(url.searchParams.get("end"));
  if (!SYMBOL_PATTERN.test(symbol) || !startTime || !endTime || endTime <= startTime || endTime - startTime > MAX_RANGE_SECONDS) {
    return NextResponse.json({ error: "Invalid candle request." }, { status: 400 });
  }

  let selectedProvider: "alpaca" | "moomoo" | undefined;
  try {
    const selection = marketDataSelection("watchlist");
    selectedProvider = selection.provider;
    const result = await fetchWatchlistMoomooCandles({
      symbol,
      interval: "1m",
      includeExtendedHours: true,
      startTime,
      endTime,
    });
    const current = marketDataSelection("watchlist");
    if (current.provider !== selection.provider || current.revision !== selection.revision) {
      return NextResponse.json({ status: "unavailable", code: "watchlist_provider_changed" }, { status: 503 });
    }
    if (!result.ok) {
      return NextResponse.json({ status: "unavailable", code: result.code }, { status: 503 });
    }
    return NextResponse.json({
      status: "ready",
      provider: selection.provider === "alpaca" ? "alpaca" : "moomoo_open_api",
      symbol,
      candles: result.candles.map((candle) => ({
        timestamp: candle.time * 1_000,
        open: candle.openDecimal,
        high: candle.highDecimal,
        low: candle.lowDecimal,
        close: candle.closeDecimal,
        volume: candle.volumeDecimal,
      })),
    });
  } catch {
    return NextResponse.json({ status: "unavailable", code: selectedProvider === "alpaca" ? "alpaca_connection_unavailable" : selectedProvider === "moomoo" ? "moomoo_connection_unavailable" : "watchlist_candle_connection_unavailable" }, { status: 503 });
  }
}
