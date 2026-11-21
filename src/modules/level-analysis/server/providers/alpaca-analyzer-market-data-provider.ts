import { gatewayWireEnabled, gatewayWireUrl, decodeGatewayWire } from "@/src/modules/market-data/transport/gateway-wire";
import "server-only";
import { createHash } from "node:crypto";
import Decimal from "decimal.js";
import type {
  MarketDataProvider, MarketDataProviderResult, MarketDataRequest, NormalizedMarketCandle,
} from "../../contracts/candle-review-contracts";

const exchangeTimezone = "America/New_York";
const utcOffsetSeconds = null;

type AlpacaAnalyzerResult = MarketDataProviderResult & {
  requestCoverage?: "complete" | "partial";
};

function failure(failureReasonCode: string): MarketDataProviderResult {
  return { ok: false, code: "provider_unavailable", failureReasonCode, exchangeTimezone, utcOffsetSeconds };
}

/** Read unadjusted SIP bars so historical prices remain comparable to exact fills. */
export class AlpacaAnalyzerMarketDataProvider implements MarketDataProvider {
  constructor(
    private readonly url = process.env.TRADERLINK_ALPACA_GATEWAY_URL,
    private readonly token = process.env.TRADERLINK_ALPACA_GATEWAY_TOKEN,
    private readonly transport: typeof fetch = fetch,
  ) {}

  private readonly wire=gatewayWireEnabled();
  private request(path: "analyzer-splits"|"history", query: URLSearchParams): Promise<Response> {
    if (!this.url || !this.token) throw new Error("alpaca_gateway_not_configured");
    const base = new URL(this.url.endsWith("/") ? this.url : `${this.url}/`);
    if (base.username || base.password || base.search || base.hash ||
        (base.protocol !== "https:" && !(process.env.NODE_ENV !== "production" &&
          base.protocol === "http:" && base.hostname === "127.0.0.1"))) {
      throw new Error("alpaca_gateway_invalid_url");
    }
    const url = this.wire?gatewayWireUrl(base,path,query):new URL(path, base);
    if(!this.wire)url.search = query.toString();
    return this.transport(url, {
      headers: { Authorization: `Bearer ${this.token}` },
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(25_000),
    });
  }

  async splitDates(symbol: string): Promise<readonly string[]> {
    if (!/^[A-Z][A-Z0-9.-]{0,14}$/u.test(symbol)) throw new Error("alpaca_analyzer_invalid_symbol");
    const response = await this.request("analyzer-splits", new URLSearchParams({ symbol }));
    if (!response.ok) throw new Error("alpaca_analyzer_splits_unavailable");
    const body=await response.json();
    const payload = (this.wire?decodeGatewayWire("analyzer-splits",body):body) as { symbol?: unknown; anchor?: unknown; dates?: unknown };
    if (payload.symbol !== symbol || payload.anchor !== "Splits" ||
        !Array.isArray(payload.dates) || !payload.dates.every((date: unknown) =>
          typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/u.test(date) &&
          Number.isFinite(Date.parse(date)) && new Date(date).toISOString().slice(0, 10) === date)) {
      throw new Error("alpaca_analyzer_splits_incomplete");
    }
    return payload.dates;
  }

  async fetch(request: MarketDataRequest): Promise<AlpacaAnalyzerResult> {
    if (!this.url || !this.token) return failure("alpaca_gateway_not_configured");
    const { symbol, startTime, endTime } = request;
    if (request.interval !== "1m" || !/^[A-Z][A-Z0-9.-]{0,14}$/u.test(symbol) ||
        !Number.isSafeInteger(startTime) || !Number.isSafeInteger(endTime) ||
        startTime <= 0 || startTime % 60 !== 0 || endTime % 60 !== 0 || endTime <= startTime ||
        endTime - startTime > 86400 || endTime * 1000 > Date.now()) {
      return failure("alpaca_analyzer_invalid_range");
    }

    try {
      const response = await this.request("history", new URLSearchParams({
        symbol, timeframe: "1Min", adjustment: "raw",
        start: String(startTime * 1000), end: String(endTime * 1000 - 1),
      }));
      if (!response.ok) return failure(response.status === 429 ? "alpaca_gateway_busy" : "alpaca_gateway_unavailable");
      const body=await response.json();
      const payload = (this.wire?decodeGatewayWire("history",body):body) as {
        symbol?: unknown; feed?: unknown; adjustment?: unknown; complete?: unknown;
        nextPageToken?: unknown; bars?: unknown;
      };
      if (payload.symbol !== symbol || payload.feed !== "sip" || payload.adjustment !== "raw" ||
          payload.complete !== true || payload.nextPageToken !== null || !Array.isArray(payload.bars) ||
          payload.bars.length > (endTime - startTime) / 60) {
        return failure("alpaca_analyzer_incomplete_history");
      }

      const candles: NormalizedMarketCandle[] = [];
      const seen = new Set<number>();
      for (const bar of payload.bars) {
        if (!bar || !Number.isSafeInteger(bar.time) || bar.time % 60 !== 0 ||
            bar.time < startTime || bar.time + 60 > endTime || seen.has(bar.time) ||
            ![bar.open, bar.high, bar.low, bar.close, bar.volume].every(Number.isFinite) ||
            bar.low <= 0 || bar.low > Math.min(bar.open, bar.close) ||
            bar.high < Math.max(bar.open, bar.close) || bar.volume < 0) {
          return failure("alpaca_analyzer_invalid_bar");
        }
        seen.add(bar.time);
        candles.push({
          time: bar.time,
          openDecimal: new Decimal(bar.open).toFixed(),
          highDecimal: new Decimal(bar.high).toFixed(),
          lowDecimal: new Decimal(bar.low).toFixed(),
          closeDecimal: new Decimal(bar.close).toFixed(),
          volumeDecimal: new Decimal(bar.volume).toFixed(),
          turnoverDecimal: null,
        });
      }
      if (!candles.length) {
        return { ok: false, code: "coverage_unavailable", failureReasonCode: "alpaca_returned_no_candles",
          exchangeTimezone, utcOffsetSeconds, requestCoverage: "complete" };
      }
      candles.sort((a, b) => a.time - b.time);
      return { ok: true, candles, exchangeTimezone, utcOffsetSeconds, requestCoverage: "complete",
        normalizedCandleSha256: createHash("sha256").update(JSON.stringify(candles)).digest("hex") };
    } catch {
      return failure("alpaca_gateway_unavailable");
    }
  }
}
