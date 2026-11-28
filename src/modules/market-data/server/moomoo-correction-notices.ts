import "server-only";
import { readAlpacaTradeRevisions } from "@/src/modules/scanner/alpaca/client";
import { easternDayStart } from "@/src/modules/scanner/alpaca/candles";

export type MoomooCorrectionNotice = { symbol: string; revision: string; minutes: number[] };

/** A change notification reloads native history. It does not carry SIP prices into Moomoo streams. */
export function watchMoomooCorrections(symbol: string, notify: (notice: MoomooCorrectionNotice) => void,
  environment = process.env): () => void {
  if (!environment.TRADERLINK_ALPACA_GATEWAY_URL) return () => {};
  const stop = new AbortController();
  let last: string | null = null, pending = false;
  const read = async () => {
    if (pending || stop.signal.aborted) return;
    pending = true;
    const now = Date.now();
    const start = easternDayStart(now/1000 - 3 * 86_400) * 1000;
    try {
      const signal = AbortSignal.any([stop.signal,AbortSignal.timeout(5_000)]);
      const { symbols } = await readAlpacaTradeRevisions({ symbols:[symbol],start,end:now+1 },environment,signal);
      const entry = symbols[symbol];
      if (!stop.signal.aborted && entry?.revision && entry.revision !== last) {
        last = entry.revision;
        notify({ symbol,revision:last,minutes:entry.minutes });
      }
    } catch { /* Retry on the next read without replacing provider-native values. */ }
    finally { pending = false; }
  };
  const timer = setInterval(read,15_000);
  timer.unref();
  void read();
  return () => { stop.abort(); clearInterval(timer); };
}
