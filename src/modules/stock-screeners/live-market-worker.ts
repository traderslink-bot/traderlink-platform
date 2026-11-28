import { setTimeout as delay } from "node:timers/promises";
import { alpacaMinuteTradeRules } from "../scanner/alpaca/session-book";
import { isObject, MAX_LISTINGS, tickerPattern } from "./contracts";
import { LiveScreenerVwapWorker } from "./live-vwap-worker";

const MINUTE = 60_000;
const PUBLISH_INTERVAL = 125;
export type ScreenerLiveUpdate = {
  symbol: string; price: number | null; priceAt: number | null; vwap: number | null; vwapAt?: number;
};
type Price = { value: number; at: number; subMillisecond: string };
const subMillisecond = (timestamp: string) => (/\.(\d+)/.exec(timestamp)?.[1] ?? "").padEnd(9, "0").slice(3, 9);

type LiveSession = {
  symbols: readonly string[];
  start: number;
  end: number;
  credentials: { keyId: string; secretKey: string };
  environment: NodeJS.ProcessEnv;
  signal: AbortSignal;
  /** Return false to keep the newest updates pending until the relay can accept them. */
  publish: (rows: readonly ScreenerLiveUpdate[]) => boolean;
  onState?: (state: "warming" | "connected" | "disconnected", covered?: number) => void;
};

function socketSession(options: LiveSession) {
  const { symbols, start, end, credentials, environment, signal, publish, onState } = options;
  const member = new Set(symbols);
  const prices = new Map<string, Price>();
  const pending = new Set<string>();
  const seeded = new Set<string>();
  const socket = new WebSocket("wss://stream.data.alpaca.markets/v2/sip");
  const connection = new AbortController();
  const work = AbortSignal.any([signal, connection.signal]);
  let vwap: LiveScreenerVwapWorker | undefined;
  let history: Promise<void> | undefined;
  socket.addEventListener("open", () => {
    socket.send(JSON.stringify({ action: "auth", key: credentials.keyId, secret: credentials.secretKey }));
  });

  const flush = setInterval(() => {
    if (!pending.size || work.aborted) return;
    const rows = [...pending].map(symbol => {
      const price = prices.get(symbol);
      const reading = vwap?.reading(symbol);
      return { symbol, price: price?.value ?? null, priceAt: price?.at ?? null, ...(reading ?? { vwap: null }) };
    });
    if (publish(rows)) pending.clear();
  }, PUBLISH_INTERVAL);
  flush.unref();

  return new Promise<void>((resolve, reject) => {
    const handshake = setTimeout(() => finish(Error("screener_live_subscription_timeout")), 12_000).unref();
    const stop = () => finish();
    let finished = false;
    function finish(error?: Error) {
      if (finished) return;
      finished = true;
      clearTimeout(handshake);
      clearInterval(flush);
      connection.abort();
      signal.removeEventListener("abort", stop);
      if (socket.readyState < WebSocket.CLOSING) socket.close();
      void Promise.resolve(history).finally(() => error ? reject(error) : resolve());
    }
    signal.addEventListener("abort", stop, { once: true });
    socket.addEventListener("close", () => finish(Error("screener_live_disconnected")));
    socket.addEventListener("error", () => finish(Error("screener_live_disconnected")));
    socket.addEventListener("message", event => {
      try {
        const messages: unknown = JSON.parse(String(event.data));
        if (!Array.isArray(messages)) throw Error("screener_live_invalid_frame");
        for (const message of messages) {
          if (!isObject(message)) continue;
          if (message.T === "error") throw Error("screener_live_provider_error");
          if (message.T === "success" && message.msg === "authenticated") {
            socket.send(JSON.stringify({ action: "subscribe", trades: symbols }));
            continue;
          }
          if (message.T === "subscription" && !vwap) {
            const trades = Array.isArray(message.trades) ? new Set(message.trades) : new Set();
            if (symbols.some(symbol => !trades.has(symbol))) throw Error("screener_live_incomplete_subscription");
            clearTimeout(handshake);
            const liveFrom = Math.max(start, Math.ceil(Date.now() / MINUTE) * MINUTE);
            if (liveFrom >= end) return finish();
            vwap = new LiveScreenerVwapWorker(symbols, start, liveFrom, end, environment);
            onState?.("warming");
            history = delay(Math.max(0, liveFrom + 3_000 - Date.now()), undefined, { signal: work })
              .then(() => vwap!.warm(batch => {
                for (const symbol of batch) {
                  pending.add(symbol);
                  seeded.add(symbol);
                }
              }, work))
              .then(() => { if (!work.aborted) onState?.("connected", seeded.size); })
              .catch(() => { if (!work.aborted) onState?.("connected", seeded.size); });
            continue;
          }
          const { S: symbol, t: timestamp, p: price, s: quantity } = message;
          if (typeof symbol !== "string" || !member.has(symbol)) continue;
          if (message.T === "c" || message.T === "x") {
            vwap?.invalidate(symbol);
            prices.delete(symbol);
            pending.add(symbol);
            continue;
          }
          if (message.T !== "t" || typeof timestamp !== "string" || typeof price !== "number" || !Number.isFinite(price) || price <= 0
            || typeof quantity !== "number" || !Number.isSafeInteger(quantity) || quantity <= 0) continue;
          const at = Date.parse(timestamp);
          if (!Number.isFinite(at) || at < start || at >= end) continue;
          const conditions = Array.isArray(message.c) ? message.c.filter((value): value is string => typeof value === "string") : undefined;
          const rules = alpacaMinuteTradeRules({ c: conditions, z: typeof message.z === "string" ? message.z : undefined });
          if (!rules.known) continue;
          if (rules.volume) vwap?.observe(symbol, at, price, quantity);
          const previous = prices.get(symbol);
          if (rules.prices && (!previous || at >= previous.at)) {
            const fraction = subMillisecond(timestamp);
            if (!previous || at > previous.at || fraction >= previous.subMillisecond) {
              prices.set(symbol, { value: price, at, subMillisecond: fraction });
            }
          }
          if (rules.prices || rules.volume) pending.add(symbol);
        }
      } catch (error) {
        finish(error instanceof Error ? error : Error("screener_live_invalid_frame"));
      }
    });
    if (signal.aborted) stop();
  });
}

/** Run one market phase and recover interruptions from the next complete candle boundary. */
export async function runLiveScreenerSession(options: LiveSession) {
  const { symbols, start, end, signal, onState } = options;
  if (!symbols.length || symbols.length > MAX_LISTINGS || new Set(symbols).size !== symbols.length
    || !symbols.every(symbol => tickerPattern.test(symbol)) || start >= end) throw Error("screener_live_invalid_session");
  const phase = AbortSignal.any([signal, AbortSignal.timeout(Math.max(1, end - Date.now()))]);
  let retry = 500;
  while (!phase.aborted && Date.now() + MINUTE < end) {
    try {
      await socketSession({ ...options, signal: phase });
      return;
    } catch {
      if (phase.aborted) return;
      onState?.("disconnected");
      await delay(retry, undefined, { signal: phase }).catch(() => {});
      retry = Math.min(8_000, retry * 2);
    }
  }
}
