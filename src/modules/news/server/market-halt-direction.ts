import "server-only";

import Decimal from "decimal.js";

import type { MarketDataProvider, NormalizedMarketCandle } from "../../level-analysis/contracts/candle-review-contracts";
import { MoomooDailyTradeKlineMarketDataProvider } from "../../level-analysis/server/providers/moomoo-daily-trade-kline-market-data-provider";
import { YahooChartMarketDataProvider } from "../../level-analysis/server/providers/yahoo-chart-market-data-provider";
import { withWatchlistIndicatorMoomooAccess } from "../../watchlist/server/moomoo-watchlist-candle-bridge";
import type { MarketHalt } from "./market-halt-feed";

export type MarketHaltDirection = "up" | "down";

const LOOKBACK_SECONDS = 10 * 60;
const MAX_HALT_AGE_SECONDS = 3 * 60;
const TOTAL_ENRICHMENT_BUDGET_MS = 3_000;
const MOOMOO_BUDGET_MS = 2_000;

function volatilityHalt(halt: MarketHalt): boolean {
  return /^(?:LUDP|M|NYSE LULD|NYSE Single Stock Pause)$/u.test(halt.reasonCode);
}

function easternTimestamp(halt: MarketHalt): number | null {
  const date = /^(\d{4})-(\d{2})-(\d{2})$/u.exec(halt.haltDateEt);
  const time = /^(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?$/u.exec(halt.haltTimeEt);
  if (!date || !time) return null;
  const nominalUtc = Date.UTC(Number(date[1]), Number(date[2]) - 1, Number(date[3]), Number(time[1]), Number(time[2]), Number(time[3]));
  for (const offsetHours of [4, 5]) {
    const candidate = nominalUtc + offsetHours * 60 * 60 * 1000;
    const parts = new Intl.DateTimeFormat("en-CA", {
      day: "2-digit", hour: "2-digit", hour12: false, minute: "2-digit", month: "2-digit",
      second: "2-digit", timeZone: "America/New_York", year: "numeric",
    }).formatToParts(candidate);
    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    if (`${values.year}-${values.month}-${values.day}` === halt.haltDateEt &&
      `${values.hour}:${values.minute}:${values.second}` === halt.haltTimeEt.replace(/\.\d+$/u, "")) {
      return Math.floor(candidate / 1000);
    }
  }
  return null;
}

function candleDirection(
  candles: readonly NormalizedMarketCandle[],
  haltTime: number,
  timestampLabel: "interval_start" | "interval_end",
): MarketHaltDirection | null {
  const nearby = candles.filter((candle) => timestampLabel === "interval_start"
    ? candle.time <= haltTime && haltTime - candle.time < 60
    : candle.time >= haltTime && candle.time - haltTime <= 60)
    .sort((a, b) => a.time - b.time);
  const final = nearby.at(-1);
  if (!final) return null;
  const close = new Decimal(final.closeDecimal);
  const high = new Decimal(final.highDecimal);
  const low = new Decimal(final.lowDecimal);
  if (high.eq(low)) return null;
  const location = close.minus(low).div(high.minus(low));
  const previous = candles.filter((candle) => candle.time < final.time).sort((a, b) => b.time - a.time)[0];
  const baseline = previous ? new Decimal(previous.closeDecimal) : new Decimal(final.openDecimal);
  if (close.gt(baseline) && location.gte(0.8)) return "up";
  if (close.lt(baseline) && location.lte(0.2)) return "down";
  return null;
}

async function providerDirection(
  provider: MarketDataProvider,
  halt: MarketHalt,
  haltTime: number,
  timestampLabel: "interval_start" | "interval_end",
): Promise<MarketHaltDirection | null> {
  const result = await provider.fetch({
    symbol: halt.ticker,
    interval: "1m",
    startTime: haltTime - LOOKBACK_SECONDS,
    endTime: haltTime + 60,
    includeExtendedHours: true,
  });
  return result.ok ? candleDirection(result.candles, haltTime, timestampLabel) : null;
}

async function moomooDirection(halt: MarketHalt, haltTime: number, budgetMs: number): Promise<MarketHaltDirection | null> {
  const signal = AbortSignal.timeout(budgetMs);
  return withWatchlistIndicatorMoomooAccess(({ token }) => providerDirection(
    new MoomooDailyTradeKlineMarketDataProvider(
      () => Promise.resolve(token),
      (request, init) => fetch(request, { ...init, signal }),
    ),
    halt,
    haltTime,
    "interval_end",
  ));
}

async function withinBudget<T>(operation: Promise<T>, budgetMs: number): Promise<T | null> {
  if (budgetMs <= 0) return null;
  let timeout: ReturnType<typeof setTimeout> | null = null;
  try {
    return await Promise.race([
      operation,
      new Promise<null>((resolve) => { timeout = setTimeout(() => resolve(null), budgetMs); }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

export async function marketHaltDirection(
  halt: MarketHalt,
  observedAtUtc: string,
): Promise<MarketHaltDirection | null> {
  if (!volatilityHalt(halt)) return null;
  const haltTime = easternTimestamp(halt);
  const observed = Date.parse(observedAtUtc) / 1000;
  if (!haltTime || !Number.isFinite(observed) || observed < haltTime - 30 || observed - haltTime > MAX_HALT_AGE_SECONDS) return null;
  const deadline = Date.now() + TOTAL_ENRICHMENT_BUDGET_MS;
  try {
    const moomooBudget = Math.min(MOOMOO_BUDGET_MS, Math.max(0, deadline - Date.now()));
    const direction = await withinBudget(moomooDirection(halt, haltTime, moomooBudget), moomooBudget);
    if (direction) return direction;
  } catch {
    console.warn("market_halt_direction_provider_unavailable", { provider: "moomoo", ticker: halt.ticker });
  }
  try {
    const remaining = Math.max(0, deadline - Date.now());
    if (!remaining) return null;
    const signal = AbortSignal.timeout(remaining);
    return await withinBudget(providerDirection(new YahooChartMarketDataProvider(
      (request, init) => fetch(request, { ...init, signal }),
    ), halt, haltTime, "interval_start"), remaining);
  } catch {
    console.warn("market_halt_direction_provider_unavailable", { provider: "yahoo", ticker: halt.ticker });
    return null;
  }
}
