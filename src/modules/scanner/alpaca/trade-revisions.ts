import { chartSymbol } from "./candles";

export const MAX_TRADE_REVISION_WINDOW_MS = 730 * 86_400_000;

export type TradeRevisionRequest = { symbols: readonly string[]; start: number; end: number };
export type TradeRevision = { minutes: number[]; pending: boolean; revision: string | null };
export type TradeRevisions = { feed: "sip"; generation?: number; symbols: Partial<Record<string, TradeRevision>> };

export function tradeRevisionQuery({ symbols, start, end }: TradeRevisionRequest) {
  return new URLSearchParams({ symbols: symbols.join(","), start: String(start), end: String(end) });
}

export function parseTradeRevisionRequest(query: URLSearchParams, now: number): TradeRevisionRequest {
  const tickers = (query.get("symbols") ?? "").split(",");
  const start = Number(query.get("start")), end = Number(query.get("end"));
  if (tickers.length > 400 || ["symbols", "start", "end"].some(key => query.getAll(key).length !== 1) ||
      !Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start <= 0 || end <= start ||
      end > now + 60_000 || end - start > MAX_TRADE_REVISION_WINDOW_MS) throw Error("invalid_trade_revision_request");
  const symbols = tickers.map(chartSymbol);
  if (new Set(symbols).size !== symbols.length) throw Error("invalid_trade_revision_request");
  return { symbols, start, end };
}

export function parseTradeRevisions(payload: unknown, request: TradeRevisionRequest): TradeRevisions {
  const reply = payload as TradeRevisions | null;
  if (reply?.feed !== "sip" || !reply.symbols || typeof reply.symbols !== "object" ||
      Array.isArray(reply.symbols) || reply.generation !== undefined &&
      (!Number.isSafeInteger(reply.generation) || reply.generation < 0)) throw Error("invalid_trade_revision_response");
  const requested = new Set(request.symbols.map(chartSymbol));
  for (const [symbol, entry] of Object.entries(reply.symbols)) {
    if (!requested.has(symbol) || !entry || typeof entry.pending !== "boolean" ||
        !Array.isArray(entry.minutes) || !entry.minutes.every((minute, index) =>
          Number.isSafeInteger(minute) && minute % 60 === 0 &&
          minute * 1000 >= request.start && minute * 1000 < request.end &&
          (!index || minute > entry.minutes[index - 1])) ||
        (entry.minutes.length ? typeof entry.revision !== "string" || !/^[a-f0-9]{64}$/.test(entry.revision)
          : !entry.pending || entry.revision !== null)) throw Error("invalid_trade_revision_response");
  }
  return reply;
}
