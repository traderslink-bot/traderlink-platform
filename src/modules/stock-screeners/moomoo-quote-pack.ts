import type { ChartMarketSession } from "../scanner/alpaca/chart-calendar";
import { isObject, type Candidate, type Listing, type MarketPack, type MarketSession, type Metric, type Snapshot, type Values } from "./contracts";
import { marketWindows } from "./market-metrics";

const positive = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value > 0;
const percent = (price: number, baseline: number) => (price / baseline - 1) * 100;

/** Make usable quote fields available while per-symbol history is warming. */
export async function collectMoomooQuotePack(options: {
  stocks: readonly Listing[]; universeDate: string; calendar: readonly ChartMarketSession[];
  now: number; clock?: () => number; signal: AbortSignal;
  read(symbols: string[]): Promise<unknown>;
}): Promise<MarketPack> {
  const { latest, windows } = marketWindows(options.calendar, options.now);
  const snapshots = Object.fromEntries(Object.entries(windows).map(([session, window]) => [session, {
    version: 2, source: "Moomoo", date: window.date, universeDate: options.universeDate, session,
    asOf: window.asOf, capturedAt: options.now, closed: window.closed, partial: true, rows: [],
  }])) as unknown as Record<MarketSession, Snapshot>;
  for (let offset = 0; offset < options.stocks.length; offset += 400) {
    options.signal.throwIfAborted();
    const stocks = options.stocks.slice(offset, offset + 400);
    const payload = await options.read(stocks.map(stock => stock.symbol));
    options.signal.throwIfAborted();
    if (!isObject(payload) || payload.ret_code !== 0 || !isObject(payload.data) || !Array.isArray(payload.data.snapshot_list))
      throw Error("moomoo_quotes_unavailable");
    const quotes = new Map<string, Record<string, unknown>>();
    for (const raw of payload.data.snapshot_list) {
      if (!isObject(raw) || typeof raw.code !== "string" || !raw.code.startsWith("US.")) continue;
      const symbol = raw.code.slice(3);
      if (quotes.has(symbol)) throw Error("moomoo_quotes_duplicate");
      quotes.set(symbol, raw);
    }
    const capturedAt = (options.clock ?? (() => options.now))();
    for (const session of Object.keys(snapshots) as MarketSession[]) {
      const snapshot = snapshots[session], window = windows[session];
      const prefix = session === "premarket" ? "pre_" : session === "after_hours" ? "after_" : "";
      for (const stock of stocks) {
        const values: Values = stock.marketCap === undefined ? {} : { cap: stock.marketCap };
        const candidate: Candidate = { symbol: stock.symbol, exchange: stock.exchange, name: stock.name, values };
        snapshot.rows.push(candidate);
        const quote = quotes.get(stock.symbol);
        if (!quote || quote.data_date !== window.date) continue;
        const price = quote[prefix ? `${prefix}price` : "last_price"];
        if (!positive(price)) continue;
        values.price = price;
        const timestamp = quote.update_time;
        if (typeof timestamp === "number" && Number.isSafeInteger(timestamp) && timestamp >= window.from
          && timestamp < window.until && timestamp <= capturedAt) candidate.priceAt = timestamp;
        const reference = prefix === "after_" ? quote.last_price : quote.prev_close_price;
        if (positive(reference)) values.change = percent(price, reference);
        if (positive(quote.total_market_val)) values.cap = quote.total_market_val;
        const volume = quote[`${prefix}volume`], turnover = quote[`${prefix}turnover`];
        if (typeof volume === "number" && Number.isFinite(volume) && volume >= 0) {
          values.volume = volume;
          values.dollarVolume = volume * price;
        }
        if (positive(volume) && positive(turnover)) {
          const vwap = turnover / volume;
          if (positive(vwap)) {
            values.sessionVwap = vwap;
            values.vwapPosition = price > vwap ? 1 : price < vwap ? -1 : 0;
            values.vwapDistance = percent(price, vwap);
          }
        }
        const high = quote[`${prefix}high_price`], low = quote[`${prefix}low_price`];
        if (positive(high) && high >= price) { values.high = high; values.fromHigh = -percent(price, high); }
        if (positive(low) && low <= price) { values.low = low; values.fromLow = percent(price, low); }
        if (values.high !== undefined && values.low !== undefined) values.range = percent(values.high, values.low);
        if (!prefix && positive(quote.open_price)) values.open = quote.open_price;
        if (!snapshot.closed && candidate.priceAt !== undefined && capturedAt - candidate.priceAt <= 30_000
          && positive(quote.bid_price) && positive(quote.ask_price) && quote.ask_price >= quote.bid_price) {
          values.bid = quote.bid_price;
          values.ask = quote.ask_price;
          values.spreadDollar = quote.ask_price - quote.bid_price;
          values.spread = values.spreadDollar / ((quote.ask_price + quote.bid_price) / 2) * 10_000;
          candidate.quoteAt = candidate.priceAt;
        }
        for (const metric of Object.keys(values) as Metric[]) {
          if (!Number.isFinite(values[metric])) delete values[metric];
        }
      }
    }
  }
  for (const snapshot of Object.values(snapshots)) {
    snapshot.capturedAt = (options.clock ?? (() => options.now))();
    snapshot.rows.sort((a, b) => a.symbol.localeCompare(b.symbol));
  }
  if (!Object.values(snapshots).some(snapshot => snapshot.rows.some(row => row.values.price !== undefined)))
    throw Error("market_pack_unavailable");
  return { latest, snapshots };
}
