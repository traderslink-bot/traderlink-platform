import "server-only";

import Decimal from "decimal.js";

import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { MoomooConnectionAccessService } from "@/src/modules/platform/server/broker-connections/moomoo-connection-access-service";
import { MoomooConnectionRepository } from "@/src/modules/platform/server/broker-connections/moomoo-connection-repository";
import type { ScannerFilterInput, ScannerRunRequest, ScannerRunResult, ScannerSort } from "../scanner-contract";

const MOOMOO_API_ORIGIN = "https://webapi.moomoo.com";
const CACHE_TTL_MILLISECONDS = 60_000;
const MAX_FILTERS = 20;

type MoomooScreenPayload = Readonly<{
  data?: Readonly<{ items?: unknown }>;
  pagination?: Readonly<{ total?: unknown }>;
  ret_code?: unknown;
}>;

type CacheEntry = Readonly<{ expiresAt: number; result: ScannerRunResult }>;
const cache = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<ScannerRunResult>>();

const simpleProperties = Object.freeze({
  price: [2201, 1_000], "market-cap": [2301, 1_000], pe: [2302, 100_000], "pe-ttm": [2303, 100_000], pb: [2304, 100_000], "dividend-yield": [2305, 1_000],
} as const);
const cumulativeProperties = Object.freeze({
  "daily-change": [3102, 1_000], amplitude: [3103, 1_000], "average-volume": [3104, 1], "average-turnover": [3105, 1_000], "turnover-rate": [3106, 1_000],
} as const);
const financialProperties = Object.freeze({
  "net-profit": [4101, 1_000], "profit-growth": [4102, 1_000], revenue: [4105, 1_000], "revenue-growth": [4106, 1_000], "net-margin": [4107, 1_000], "gross-margin": [4108, 1_000], "debt-ratio": [4109, 1_000], roe: [4110, 1_000], eps: [4801, 1_000], "float-market-cap": [4903, 1_000], "ps-ttm": [4904, 100_000],
} as const);
const featuredProperties = Object.freeze({
  "chip-profit": [5101, 1_000], "chip-overlap": [5102, 1_000], beta: [5203, 100_000], "trade-heat": [5211, 100_000], "search-heat": [5212, 100_000], "combined-heat": [5214, 100_000], "institutional-holdings": [5320, 1_000], "target-price": [5403, 1_000_000_000],
} as const);
const optionProperties = Object.freeze({
  "option-iv": [1000, 1_000_000], "option-iv-rank": [1001, 1], "option-iv-percentile": [1002, 1], "option-earnings-iv": [1003, 1], "option-hv": [1006, 1], "option-volume": [1009, 1], "option-open-interest": [1010, 1],
} as const);

function rawDecimal(value: string | undefined, multiplier: number): number | null {
  if (!value || value.trim() === "") return null;
  try {
    const scaled = new Decimal(value).mul(multiplier).toDecimalPlaces(0, Decimal.ROUND_HALF_UP);
    if (!scaled.isFinite() || !scaled.abs().lte(Number.MAX_SAFE_INTEGER)) return null;
    return scaled.toNumber();
  } catch { return null; }
}

function bounds(filter: ScannerFilterInput, multiplier: number): Record<string, unknown> | null {
  const lower = rawDecimal(filter.lower, multiplier);
  const upper = rawDecimal(filter.upper, multiplier);
  if (lower === null && upper === null) return null;
  const result: Record<string, unknown> = {};
  if (lower !== null) result.lower = { includes: true, value: lower };
  if (upper !== null) result.upper = { includes: true, value: upper };
  return result;
}

function periodType(value: ScannerFilterInput["timeframe"]): number {
  return ({ "1 minute": 1, "5 minutes": 3, "15 minutes": 4, "1 hour": 5, Daily: 11, Weekly: 21, Monthly: 31 } as const)[value ?? "Daily"];
}

function position(choice: string | undefined): number | null {
  return ({ "Price above": 1, "Price below": 2, "Price crosses above": 3, "Price crosses below": 4 } as const)[choice as "Price above"] ?? null;
}

function screenQuery(filter: ScannerFilterInput, todaySeconds: number): Record<string, unknown> | null {
  if (filter.id in simpleProperties) {
    const [name, multiplier] = simpleProperties[filter.id as keyof typeof simpleProperties];
    const range = bounds(filter, multiplier); return range ? { simple_property_query: { property: { name }, ...range } } : null;
  }
  if (filter.id in cumulativeProperties) {
    const [name, multiplier] = cumulativeProperties[filter.id as keyof typeof cumulativeProperties];
    const range = bounds(filter, multiplier); return range ? { cumulative_property_query: { property: { days: Number(filter.period ?? "1"), name, period_average: filter.id.startsWith("average-") }, ...range } } : null;
  }
  if (filter.id in financialProperties) {
    const [name, multiplier] = financialProperties[filter.id as keyof typeof financialProperties];
    const range = bounds(filter, multiplier); return range ? { financial_property_query: { property: { name, term: 10 }, ...range } } : null;
  }
  if (filter.id in featuredProperties || filter.id in optionProperties) {
    const [name, multiplier] = (filter.id in featuredProperties ? featuredProperties[filter.id as keyof typeof featuredProperties] : optionProperties[filter.id as keyof typeof optionProperties]);
    const range = bounds(filter, multiplier);
    if (!range) return null;
    const intervals = [{ ...(range.lower ? { lower: range.lower } : {}), ...(range.upper ? { upper: range.upper } : {}) }];
    return filter.id in featuredProperties ? { featured_property_query: { intervals, property: { name } } } : { option_query: { intervals, property: { name } } };
  }
  if (filter.id === "listing-date") {
    const lowerDays = rawDecimal(filter.lower, 1); const upperDays = rawDecimal(filter.upper, 1);
    if (lowerDays === null && upperDays === null) return null;
    const query: Record<string, unknown> = { property: { name: 2306 } };
    if (lowerDays !== null) query.upper = { includes: true, value: todaySeconds - lowerDays * 86_400 };
    if (upperDays !== null) query.lower = { includes: true, value: todaySeconds - upperDays * 86_400 };
    return { simple_property_query: query };
  }
  if (filter.id === "security-type") {
    const field = ({ "Has ADR": 5, "Has options": 6, "Has warrants": 7, "Has futures": 8 } as const)[filter.choice as "Has ADR"];
    return field ? { simple_field_query: { screen_value_list: [1], simple_field: field } } : null;
  }
  if (filter.id === "price-vs-average") {
    const comparison = position(filter.choice); if (!comparison) return null;
    return { indicator_positional_query: { first_indicator_name: 1, period_type: periodType(filter.timeframe), position: comparison, second_indicator_name: filter.averageType === "MA" ? 11 : 21, second_indicator_params: [Number(filter.averageLength ?? "9")] } };
  }
  const patterns = ({
    kdj: { "Bottom divergence": 14, "Death cross": 12, "Golden cross": 11, "Top divergence": 13 },
    macd: { "Bearish crossover": 22, "Bottom divergence": 24, "Bullish crossover": 21, "Top divergence": 23 },
    rsi: { "Bearish crossover": 32, "Bottom divergence": 34, "Bullish crossover": 31, "Top divergence": 33 },
    bollinger: { "Above middle band": 43, "Below middle band": 44, "Breaks above upper band": 41, "Breaks below lower band": 42 },
    "trend-pattern": { "Any bearish signal": 101, "Any bullish signal": 100, "EMA bearish alignment": 4, "EMA bullish alignment": 3, "MA bearish alignment": 2, "MA bullish alignment": 1 },
  } as Record<string, Record<string, number>>)[filter.id];
  if (patterns) {
    const name = patterns[filter.choice ?? ""];
    return name ? { indicator_pattern_query: { name, period_type: periodType(filter.timeframe) } } : null;
  }
  const shapes = ({
    "bullish-chart-pattern": { "Any bullish pattern": 2000, "Bull flag": 6, "Bullish diamond": 8, "Bullish symmetrical triangle": 7, "Bullish triangle": 10, "Bullish wedge": 9, "Head and shoulders bottom": 3, "Megaphone bottom": 5, "Rounding bottom": 4, "Triple bottom": 2, "W bottom": 1 },
    "bearish-chart-pattern": { "Any bearish pattern": 2001, "Bear flag": 1006, "Bearish diamond": 1008, "Bearish symmetrical triangle": 1007, "Bearish triangle": 1010, "Bearish wedge": 1009, "Head and shoulders top": 1003, "Megaphone top": 1005, "Rounding top": 1004, "Triple top": 1002, "W top": 1001 },
  } as Record<string, Record<string, number>>)[filter.id];
  if (shapes) {
    const name = shapes[filter.choice ?? ""];
    return name ? { kline_shape_query: { property: { name, period: periodType(filter.timeframe) } } } : null;
  }
  if (filter.id === "analyst-rating" || filter.id === "morningstar-rating") {
    const values: Record<string, number> = filter.id === "analyst-rating"
      ? ({ "Strong buy": 1, Buy: 2, Hold: 3, Sell: 4, "Strong sell": 5 } as const)
      : ({ "5 stars": 5, "4 stars": 4, "3 stars": 3, "2 stars": 2, "1 star": 1 } as const);
    const value = values[filter.choice ?? ""];
    return value ? { featured_property_query: { property: { name: filter.id === "analyst-rating" ? 5401 : 5407 }, value_set: [value] } } : null;
  }
  if (filter.id === "broker-concentration" || filter.id === "broker-holding-change") {
    const range = bounds(filter, 1_000); if (!range) return null;
    const intervals = [{ ...(range.lower ? { lower: range.lower } : {}), ...(range.upper ? { upper: range.upper } : {}) }];
    return { broker_holdings_query: { intervals, property: { days: Number(filter.period ?? "1"), name: filter.id === "broker-concentration" ? 6101 : 6102 } } };
  }
  return null;
}

function sort(sortBy: ScannerSort): Record<string, unknown> {
  if (sortBy === "daily-change") return { cumulative_property: { days: 1, name: 3102 }, direction: 2 };
  if (sortBy === "average-volume") return { cumulative_property: { days: 1, name: 3104, period_average: false }, direction: 2 };
  if (sortBy === "market-cap") return { simple_property: { name: 2301 }, direction: 2 };
  if (sortBy === "trade-heat") return { featured_property: { name: 5211 }, direction: 2 };
  return { option_property: { name: 1009 }, direction: 2 };
}

function value(result: unknown, divisor: number): string | null {
  if (!result || typeof result !== "object") return null;
  const item = result as Record<string, unknown>;
  const nested = Object.values(item).find((entry) => entry && typeof entry === "object") as Record<string, unknown> | undefined;
  const raw = nested?.res && typeof nested.res === "object" ? (nested.res as Record<string, unknown>).ival : nested?.value ?? item.value;
  if (typeof raw !== "string" && typeof raw !== "number") return null;
  try { return new Decimal(raw).div(divisor).toString(); } catch { return null; }
}

function normalize(payload: MoomooScreenPayload): ScannerRunResult {
  const timestamp = new Date().toISOString();
  const items = Array.isArray(payload.data?.items) ? payload.data.items : [];
  const rows = items.flatMap((candidate) => {
    if (!candidate || typeof candidate !== "object") return [];
    const item = candidate as Record<string, unknown>;
    if (typeof item.code !== "string" || typeof item.name !== "string") return [];
    const results = Array.isArray(item.results) ? item.results : [];
    return [{ symbol: item.code, company: item.name, last: value(results[0], 1_000), changePercent: value(results[1], 1_000), volume: value(results[2], 1), marketCap: value(results[3], 1_000), updatedAtUtc: timestamp }];
  });
  return Object.freeze({ cached: false, rows: Object.freeze(rows), total: Number.isSafeInteger(payload.pagination?.total) ? Number(payload.pagination?.total) : rows.length, updatedAtUtc: timestamp });
}

export class MoomooStockScreenService {
  constructor(private readonly repository: MoomooConnectionRepository) {}

  async run(scope: WorkspaceAccessScope, input: ScannerRunRequest): Promise<ScannerRunResult> {
    if (input.filters.length > MAX_FILTERS) throw new Error("scanner_filter_limit");
    const connection = this.repository.find(scope);
    if (!connection || connection.state !== "active" || !connection.authorizedScopes.includes("quote:read")) throw new Error("scanner_connection_required");
    const todaySeconds = Math.floor(Date.now() / 86_400_000) * 86_400;
    const queries = [
      { simple_field_query: { screen_value_list: [2], simple_field: 1 } },
      ...input.filters.map((filter) => screenQuery(filter, todaySeconds)).filter((entry): entry is Record<string, unknown> => entry !== null),
    ];
    const key = JSON.stringify({ limit: input.limit, queries, sort: input.sortBy });
    const existing = cache.get(key);
    if (existing && existing.expiresAt > Date.now()) return Object.freeze({ ...existing.result, cached: true });
    const running = inflight.get(key);
    if (running) return running;
    const request = this.fetchAndCache(key, scope, input, queries);
    inflight.set(key, request);
    try { return await request; } finally { inflight.delete(key); }
  }

  private async fetchAndCache(key: string, scope: WorkspaceAccessScope, input: ScannerRunRequest, screenQueries: readonly Record<string, unknown>[]): Promise<ScannerRunResult> {
    const token = await new MoomooConnectionAccessService(this.repository).accessToken(scope);
    let response: Response;
    try {
      response = await fetch(`${MOOMOO_API_ORIGIN}/api/v1.0/quote/stock-screen`, { method: "POST", cache: "no-store", headers: { Accept: "application/json", Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ limit: input.limit, retrieve_queries: [{ simple_property: { name: 2201 } }, { cumulative_property: { days: 1, name: 3102, period_average: false } }, { cumulative_property: { days: 1, name: 3104, period_average: false } }, { simple_property: { name: 2301 } }], screen_queries: screenQueries, sort: sort(input.sortBy) }) });
    } catch { throw new Error("scanner_provider_unavailable"); }
    let payload: MoomooScreenPayload;
    try { payload = await response.json() as MoomooScreenPayload; } catch { throw new Error("scanner_provider_unavailable"); }
    if (!response.ok || payload.ret_code !== 0) throw new Error("scanner_provider_unavailable");
    const result = normalize(payload);
    cache.set(key, { expiresAt: Date.now() + CACHE_TTL_MILLISECONDS, result });
    return result;
  }
}
