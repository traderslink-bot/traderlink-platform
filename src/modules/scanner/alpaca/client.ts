import "server-only";
import { readFile } from "node:fs/promises";
import type { AlpacaHistoryFrame, AlpacaHistoryResult } from "./rest-data";
import { chartSymbol } from "./candles";

export function alpacaMarketDataEnabled(environment: NodeJS.ProcessEnv = process.env): boolean {
  return environment.TRADERLINK_MARKET_DATA_PROVIDER === "alpaca";
}

/** Server-to-server only. No broker key is ever loaded by Platform/Railway. */
export async function requestAlpacaGateway(path: "scanner-listings" | "calendar" | "vwap-seed" | "history" | "quotes" | "overnight" | "halts", query: URLSearchParams, environment: NodeJS.ProcessEnv = process.env, signal?: AbortSignal): Promise<unknown> {
  const base = environment.TRADERLINK_ALPACA_GATEWAY_URL;
  let token = environment.TRADERLINK_ALPACA_GATEWAY_TOKEN;
  const local = environment.NODE_ENV !== "production";
  if (local && environment.TRADERLINK_ALPACA_GATEWAY_TOKEN_FILE) token = JSON.parse(await readFile(environment.TRADERLINK_ALPACA_GATEWAY_TOKEN_FILE, "utf8")).token;
  if (!base || !token) throw Error("alpaca_gateway_not_configured");
  const parsed = new URL(base);
  if (parsed.username || parsed.password || parsed.search || parsed.hash || (parsed.protocol !== "https:" && !(local && parsed.protocol === "http:" && parsed.hostname === "127.0.0.1"))) throw Error("alpaca_gateway_invalid");
  const url = new URL(path, base.endsWith("/") ? base : base + "/"); url.search = query.toString();
  const timeout = AbortSignal.timeout(120_000);
  const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store", redirect: "error", signal: signal ? AbortSignal.any([timeout, signal]) : timeout });
  if (!response.ok) throw Error("alpaca_market_data_unavailable");
  return response.json();
}

export async function readAlpacaHistory(input: { symbol: string; timeframe: AlpacaHistoryFrame; start: number; end: number }, environment: NodeJS.ProcessEnv = process.env, signal?: AbortSignal): Promise<AlpacaHistoryResult> {
  const result = await requestAlpacaGateway("history", new URLSearchParams({ symbol: chartSymbol(input.symbol), timeframe: input.timeframe, start: String(input.start), end: String(input.end) }), environment, signal) as AlpacaHistoryResult;
  if (result.symbol !== chartSymbol(input.symbol) || result.feed !== "sip" || result.adjustment !== "split" || !result.complete || !Array.isArray(result.bars)) throw Error("alpaca_history_incomplete");
  return result;
}
