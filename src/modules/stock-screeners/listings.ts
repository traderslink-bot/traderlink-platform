import { EXCHANGES, isObject, tickerPattern, type Exchange, type Listing } from "./contracts";

const DIRECTORY = "https://www.nasdaqtrader.com/dynamic/SymDir/";
const NASDAQ_CAPS = "https://api.nasdaq.com/api/screener/stocks";
const otherMarkets: Record<string, Exchange> = { A: "AMEX", N: "NYSE", P: "ARCA", Z: "BATS", V: "IEX", T: "TXSE" };

function assetExchange(input: unknown): Exchange | undefined {
  if (input === "NYSEARCA") return "ARCA";
  return typeof input === "string" && EXCHANGES.includes(input as Exchange) ? input as Exchange : undefined;
}

function parseDirectory(text: string, nasdaq: boolean) {
  const lines = text.trimEnd().split(/\r?\n/);
  const header = lines.shift()?.split("|") ?? [];
  const stamp = lines.pop()?.match(/^File Creation Time: (\d{8}\d{2}:\d{2})\|/);
  if (!stamp || lines.length < 1_000 || lines.length > 30_000) throw Error("listing_directory_incomplete");
  const slots = [nasdaq ? "Symbol" : "ACT Symbol", "Security Name", "ETF", "Test Issue", nasdaq ? "NextShares" : "Exchange"]
    .map(field => header.indexOf(field));
  if (slots.includes(-1)) throw Error("listing_directory_format");
  const listings: Listing[] = [];
  for (const line of lines) {
    const values = line.split("|");
    if (values.length !== header.length) throw Error("listing_directory_format");
    const [symbol, name, etf, test, extra] = slots.map(index => values[index]);
    const exchange = nasdaq ? "NASDAQ" : otherMarkets[extra];
    if (!exchange || !tickerPattern.test(symbol) || !name || etf !== "N" || test !== "N" || (nasdaq && extra !== "N")) continue;
    // The directory names commonly append the security type after " - ".
    // Use the descriptor and explicit fund markers, rather than dropping ticker suffixes alone.
    const descriptor = name.split(" - ").slice(1).join(" - ") || name;
    if (/\b(?:warrants?|rights?|units?|preferred|preference|notes?|debentures?|etns?|exchange traded notes?)\b/i.test(descriptor)
      || /\b(?:closed.end fund|mutual fund|interval fund|exchange.traded (?:fund|note)|etf)\b/i.test(name)) continue;
    listings.push({ symbol, name: name.split(" - ")[0].trim().slice(0, 120), exchange });
  }
  return { stamp: stamp[1], listings };
}

async function directory(name: "nasdaqlisted" | "otherlisted", request: typeof fetch) {
  const response = await request(new URL(name + ".txt", DIRECTORY), { redirect: "error", signal: AbortSignal.timeout(10_000) });
  if (!response.ok) throw Error("listing_directory_unavailable");
  const data = await response.text();
  if (Buffer.byteLength(data) > 6_000_000) throw Error("listing_directory_size");
  return parseDirectory(data, name === "nasdaqlisted");
}

async function marketCaps(exchange: Exchange, verified: ReadonlyMap<string, Listing>, request: typeof fetch) {
  const url = new URL(NASDAQ_CAPS);
  url.search = new URLSearchParams({ exchange: exchange.toLowerCase(), download: "true" }).toString();
  const response = await request(url, { redirect: "error", signal: AbortSignal.timeout(12_000), headers: {
    Accept: "application/json, text/plain, */*", Referer: "https://www.nasdaq.com/", "User-Agent": "TraderLink stock screeners/1.0",
  } });
  if (!response.ok) throw Error("market_cap_source_unavailable");
  const body = await response.text();
  if (Buffer.byteLength(body) > 6_000_000) throw Error("market_cap_source_size");
  const payload: unknown = JSON.parse(body);
  if (!isObject(payload) || !isObject(payload.data) || !Array.isArray(payload.data.rows) || !payload.data.rows.length) throw Error("market_cap_source_invalid");
  const caps = new Map<string, number>();
  for (const row of payload.data.rows) {
    if (!isObject(row) || typeof row.symbol !== "string") continue;
    const symbol = row.symbol.trim().toUpperCase();
    if (verified.get(symbol)?.exchange !== exchange) continue;
    const cap = typeof row.marketCap === "string" && /^\d+(?:\.\d+)?$/.test(row.marketCap) ? Number(row.marketCap) : row.marketCap;
    if (typeof cap === "number" && Number.isFinite(cap) && cap > 0) caps.set(symbol, cap);
  }
  return caps;
}

export async function collectListings(headers: HeadersInit, request = fetch) {
  const assetsUrl = "https://paper-api.alpaca.markets/v2/assets?status=active&asset_class=us_equity";
  const [nasdaq, other, assets] = await Promise.all([
    directory("nasdaqlisted", request), directory("otherlisted", request),
    request(assetsUrl, { headers, redirect: "error", signal: AbortSignal.timeout(12_000) }).then(async response => {
      if (!response.ok) throw Error("asset_reference_unavailable");
      const data: unknown = await response.json();
      if (!Array.isArray(data) || data.length < 1_000 || data.length > 30_000) throw Error("asset_reference_invalid");
      const index = new Map<string, Exchange>();
      for (const asset of data) {
        if (!isObject(asset) || asset.status !== "active" || asset.class !== "us_equity" || typeof asset.symbol !== "string") continue;
        const exchange = assetExchange(asset.exchange);
        if (exchange) index.set(asset.symbol, exchange);
      }
      return index;
    }),
  ]);
  if (nasdaq.stamp.slice(0, 8) !== other.stamp.slice(0, 8)) throw Error("listing_directory_date_mismatch");
  const eligible = new Map<string, Listing>();
  for (const listing of [...nasdaq.listings, ...other.listings]) {
    if (assets.get(listing.symbol) !== listing.exchange) continue;
    if (eligible.has(listing.symbol)) throw Error("listing_directory_duplicate");
    eligible.set(listing.symbol, listing);
  }
  if (eligible.size < 1_000) throw Error("listing_universe_incomplete");
  const caps = await Promise.allSettled((["NASDAQ", "NYSE", "AMEX"] as const).map(exchange => marketCaps(exchange, eligible, request)));
  for (const result of caps) {
    if (result.status === "fulfilled") for (const [symbol, cap] of result.value) eligible.get(symbol)!.marketCap = cap;
  }
  const stamp = nasdaq.stamp;
  return {
    listingDate: stamp.slice(4, 8) + "-" + stamp.slice(0, 2) + "-" + stamp.slice(2, 4),
    stocks: [...eligible.values()].sort((a, b) => a.symbol.localeCompare(b.symbol)),
    partialCaps: caps.some(result => result.status === "rejected"),
  };
}
