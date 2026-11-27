import { gatewayWireEnabled, gatewayWireUrl, decodeGatewayWire } from "../../market-data/transport/gateway-wire";
import "server-only";
import { readFile } from "node:fs/promises";
import type { AlpacaHistoryFrame, AlpacaHistoryResult } from "./rest-data";
import { chartSymbol } from "./candles";
import { validateScannerSignalBars, type ScannerSignalBars } from "./scanner-signal-bars";
import type { CandleArchiveAdmin } from "../../market-data/candle-history/transport";
import type { CandleHistorySettings } from "../../market-data/candle-history/settings";
import type { SavedScannerMapAdmission } from "./verified-levels-monitor";

export function alpacaMarketDataEnabled(environment: NodeJS.ProcessEnv = process.env): boolean {
  return environment.TRADERLINK_MARKET_DATA_PROVIDER === "alpaca";
}

/** Server-to-server only. No broker key is ever loaded by Platform/Railway. */
export async function requestAlpacaGateway(path: "candle-history" | "accepted-input" | "accepted-input-candle" | "accepted-daily-context" | "accepted-regular-opportunities" | "accepted-map-monitor" | "scanner-listings" | "scanner-signal-bars" | "calendar" | "vwap-seed" | "chart-splits" | "history" | "quotes" | "overnight" | "halts", query: URLSearchParams, environment: NodeJS.ProcessEnv = process.env, signal?: AbortSignal, admission?: SavedScannerMapAdmission): Promise<unknown> {
  const { base, token } = await gatewayLocation(environment);
  const wire=gatewayWireEnabled(environment);
  const url = wire?gatewayWireUrl(base,path,query):new URL(path, base.endsWith("/") ? base : base + "/"); if(!wire)url.search = query.toString();
  const timeout = AbortSignal.timeout(120_000);
  if ((path === "accepted-map-monitor") !== Boolean(admission)) throw Error("alpaca_gateway_request_invalid");
  const response = await fetch(url, {
    ...(admission ? { method: "POST", body: JSON.stringify(admission) } : {}),
    headers: { Authorization: `Bearer ${token}`, ...(admission ? { "Content-Type": "application/json" } : {}) },
    cache: "no-store", redirect: "error", signal: signal ? AbortSignal.any([timeout, signal]) : timeout,
  });
  if (!response.ok) throw Error("alpaca_market_data_unavailable");
  const payload=await response.json();return wire?decodeGatewayWire(path,payload):payload;
}

async function gatewayLocation(environment: NodeJS.ProcessEnv) {
  const base = environment.TRADERLINK_ALPACA_GATEWAY_URL;
  let token = environment.TRADERLINK_ALPACA_GATEWAY_TOKEN;
  const local = environment.NODE_ENV !== "production";
  if (local && environment.TRADERLINK_ALPACA_GATEWAY_TOKEN_FILE) token = JSON.parse(await readFile(environment.TRADERLINK_ALPACA_GATEWAY_TOKEN_FILE, "utf8")).token;
  if (!base || !token) throw Error("alpaca_gateway_not_configured");
  const parsed = new URL(base);
  if (parsed.username || parsed.password || parsed.search || parsed.hash || (parsed.protocol !== "https:" && !(local && parsed.protocol === "http:" && parsed.hostname === "127.0.0.1"))) throw Error("alpaca_gateway_invalid");
  return { base, token };
}

type ArchiveRoster = readonly { symbol: string; marketCap: number | null }[];
export async function requestAlpacaCandleArchiveAdmin(input?: {
  settings?: CandleHistorySettings; universe: ArchiveRoster; rosterSettingsRevision?: number;
},
  environment = process.env): Promise<CandleArchiveAdmin | undefined> {
  const credential = environment.TRADERLINK_ALPACA_CANDLE_HISTORY_ADMIN_TOKEN;
  if (!credential) throw Error("candle_history_unavailable");
  const { base, token } = await gatewayLocation(environment);
  const path = input && !input.settings ? "candle-history/roster" : "candle-history/admin";
  const url = new URL(path, base.endsWith("/") ? base : base + "/");
  const response = await fetch(url, {
    method: input ? "PUT" : "GET",
    headers: { Authorization: `Bearer ${token}`, "X-TraderLink-Candle-History-Admin": credential,
      ...(input ? { "Content-Type": "application/json" } : {}) },
    ...(input ? { body: JSON.stringify(input) } : {}),
    cache: "no-store", redirect: "error", signal: AbortSignal.timeout(8_000),
  });
  if (response.status === 409) throw Error("candle_history_settings_conflict");
  if (!response.ok) throw Error("candle_history_unavailable");
  return path === "candle-history/admin" ? response.json() as Promise<CandleArchiveAdmin> : undefined;
}

export async function readAlpacaScannerSignalBars(request: ScannerSignalBars, environment: NodeJS.ProcessEnv) {
  const query = new URLSearchParams({ symbols: request.symbols.join(","), frame: request.frame,
    start: String(request.start), end: String(request.end) });
  if (request.sessionVwap) query.set("sessionVwap", "1");
  if (request.historyBars) query.set("historyBars", String(request.historyBars));
  return validateScannerSignalBars(await requestAlpacaGateway("scanner-signal-bars", query, environment), request);
}

export async function readAlpacaHistory(input: { symbol: string; timeframe: AlpacaHistoryFrame; start: number; end: number; adjustment?: "raw" }, environment: NodeJS.ProcessEnv = process.env, signal?: AbortSignal): Promise<AlpacaHistoryResult> {
  const result = await requestAlpacaGateway("history", new URLSearchParams({ symbol: chartSymbol(input.symbol), timeframe: input.timeframe, start: String(input.start), end: String(input.end), ...(input.adjustment ? { adjustment: input.adjustment } : {}) }), environment, signal) as AlpacaHistoryResult;
  if (result.symbol !== chartSymbol(input.symbol) || result.feed !== "sip" || result.adjustment !== (input.adjustment ?? "split") || !result.complete || !Array.isArray(result.bars)) throw Error("alpaca_history_incomplete");
  return result;
}
