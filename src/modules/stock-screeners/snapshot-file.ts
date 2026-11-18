import { constants } from "node:fs";
import { open } from "node:fs/promises";
import { calendarDate } from "../scanner/alpaca/chart-calendar";
import { EXCHANGES, isObject, MAX_LISTINGS, METRICS, SESSIONS, signalChoices, tickerPattern, type MarketPack, type Metric, type ScreenerProviderSelection } from "./contracts";

const MAX_BYTES = 128 * 1024 * 1024;
export const MARKET_PACK_MAX_AGE_MS = 7 * 86_400_000;
const sessions = ["premarket", "regular", "after_hours", "last_regular"] as const;

export function validateMarketPack(value: unknown, now: number, selection?: ScreenerProviderSelection): MarketPack {
  if (!isObject(value) || typeof value.latest !== "string" || value.latest === "latest"
    || !Object.hasOwn(SESSIONS, value.latest) || !isObject(value.snapshots)) throw Error("market_pack_invalid");
  const declared = value.selection;
  if (declared !== undefined && (!isObject(declared) || !["alpaca", "moomoo"].includes(String(declared.provider))
    || !Number.isSafeInteger(declared.revision) || Number(declared.revision) < 0)) throw Error("market_pack_invalid");
  const actual = declared as ScreenerProviderSelection | undefined;
  if (selection && (selection.provider !== (actual?.provider ?? "alpaca")
    || selection.revision !== (actual?.revision ?? 0))) throw Error("market_pack_provider_mismatch");
  const source = actual?.provider === "moomoo" ? "Moomoo" : "Alpaca SIP";
  let population: string | undefined;
  for (const session of sessions) {
    const snapshot = value.snapshots[session];
    if (!isObject(snapshot) || snapshot.version !== 2 || snapshot.session !== session || snapshot.source !== source
      || !calendarDate(snapshot.date) || !calendarDate(snapshot.universeDate)
      || typeof snapshot.closed !== "boolean" || typeof snapshot.partial !== "boolean"
      || typeof snapshot.capturedAt !== "number" || typeof snapshot.asOf !== "number"
      || !Number.isSafeInteger(snapshot.capturedAt) || !Number.isSafeInteger(snapshot.asOf)
      || snapshot.asOf <= 0 || snapshot.asOf > snapshot.capturedAt || snapshot.capturedAt > now + 5_000
      || now - snapshot.capturedAt > MARKET_PACK_MAX_AGE_MS || !Array.isArray(snapshot.rows)
      || snapshot.rows.length < 1 || snapshot.rows.length > MAX_LISTINGS) throw Error("market_pack_invalid");
    const symbols = new Set<string>();
    for (const row of snapshot.rows) {
      if (!isObject(row) || typeof row.symbol !== "string" || !tickerPattern.test(row.symbol) || symbols.has(row.symbol)
        || typeof row.exchange !== "string" || !EXCHANGES.some(exchange => exchange === row.exchange)
        || (row.name !== undefined && (typeof row.name !== "string" || row.name.length > 120))
        || row.pressRelease !== undefined || !isObject(row.values)) throw Error("market_pack_invalid");
      for (const [metric, number] of Object.entries(row.values)) {
        if (!Object.hasOwn(METRICS, metric) || metric === "pressReleaseAge" || typeof number !== "number"
          || !Number.isFinite(number) || (metric === "relativeVolume" && number < 0)) throw Error("market_pack_invalid");
        const choices = signalChoices(metric as Metric);
        if (choices && !Object.hasOwn(choices, number)) throw Error("market_pack_invalid");
      }
      if ((row.values.cap !== undefined && Number(row.values.cap) <= 0)
        || (row.values.price !== undefined && Number(row.values.price) <= 0)) throw Error("market_pack_invalid");
      for (const field of ["priceAt", "quoteAt"]) {
        const timestamp = row[field];
        if (timestamp !== undefined && (typeof timestamp !== "number" || !Number.isSafeInteger(timestamp)
          || timestamp <= 0 || timestamp > snapshot.capturedAt)) throw Error("market_pack_invalid");
      }
      symbols.add(row.symbol);
    }
    const ordered = [...symbols].sort().join(",");
    if (population !== undefined && population !== ordered) throw Error("market_pack_invalid");
    population = ordered;
  }
  return value as MarketPack;
}

export async function readMarketPack(file: string, now: number, selection?: ScreenerProviderSelection): Promise<MarketPack> {
  const handle = await open(file, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    const stat = await handle.stat();
    if (!stat.isFile() || stat.size > MAX_BYTES) throw Error("market_pack_unavailable");
    return validateMarketPack(JSON.parse(await handle.readFile("utf8")), now, selection);
  } finally {
    await handle.close();
  }
}
