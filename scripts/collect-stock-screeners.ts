import { randomUUID } from "node:crypto";
import { lstat, mkdir, open, rename, unlink } from "node:fs/promises";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { AlpacaRestData } from "../src/modules/scanner/alpaca/rest-data";
import { easternClock } from "../src/modules/scanner/live/sessions";
import { collectMarketPack, type BarCache, type ScreenerCalendarRange } from "../src/modules/stock-screeners/collect-market";
import { collectListings } from "../src/modules/stock-screeners/listings";
import { DEFAULT_DEFINITION, type Rule } from "../src/modules/stock-screeners/contracts";
import { querySnapshot, sortRows } from "../src/modules/stock-screeners/query";
import { readMarketPack } from "../src/modules/stock-screeners/snapshot-file";
import { screenerCorrections } from "../src/modules/stock-screeners/trade-corrections";

type ReferenceCache = {
  calendar?: { date: string; value: unknown; range: ScreenerCalendarRange };
  universe?: { date: string; value: Awaited<ReturnType<typeof collectListings>> };
};

async function openCredentials(keyFile: string) {
  const config = await open(keyFile, "r");
  let credentials: { keyId: string; secretKey: string };
  try {
    const stat = await config.stat();
    if (!stat.isFile() || (stat.mode & 0o077) !== 0 || stat.size > 4096) throw Error("invalid_credentials_file");
    credentials = JSON.parse(await config.readFile("utf8"));
  } finally {
    await config.close();
  }
  if (!credentials.keyId || !credentials.secretKey) throw Error("invalid_credentials_file");
  return credentials;
}

async function collect(
  credentials: Awaited<ReturnType<typeof openCredentials>>,
  cache: BarCache,
  reference: ReferenceCache,
  output?: string,
) {
  const headers = { "APCA-API-KEY-ID": credentials.keyId, "APCA-API-SECRET-KEY": credentials.secretKey };
  const now = Date.now(), date = easternClock(now).date;
  const start = new Date(now - 540 * 86_400_000).toISOString().slice(0, 10);
  const end = new Date(now + 3 * 86_400_000).toISOString().slice(0, 10);
  const calendarUrl = new URL("https://paper-api.alpaca.markets/v2/calendar");
  calendarUrl.search = new URLSearchParams({ start, end }).toString();
  if (reference.calendar?.date !== date) {
    const response = await fetch(calendarUrl, { headers, redirect: "error", signal: AbortSignal.timeout(12_000) });
    if (!response.ok) throw Error("calendar_unavailable");
    reference.calendar = { date, value: await response.json(), range: { start, end } };
  }
  if (reference.universe?.date !== date) {
    const value = await collectListings(headers);
    if (Date.parse(date + "T12:00:00Z") - Date.parse(value.listingDate + "T12:00:00Z") > 7 * 86_400_000 || value.listingDate > date) {
      throw Error("listings_outdated");
    }
    reference.universe = { date, value };
  }

  let nextRequest = 0, requests = 0, quotaStopped = false;
  let minimumRemaining = Infinity;
  let throttled = 0;
  const rest = new AlpacaRestData(credentials, async (url, init) => {
    const response = await fetch(url, init);
    const remaining = response.headers.get("x-ratelimit-remaining");
    if (remaining !== null && Number.isFinite(Number(remaining))) {
      minimumRemaining = Math.min(minimumRemaining, Number(remaining));
      if (Number(remaining) < 500) quotaStopped = true;
    }
    if (response.status === 429) {
      throttled++;
      quotaStopped = true;
    }
    return response;
  });
  const { stocks, listingDate, partialCaps } = reference.universe.value;
  const pack = await collectMarketPack({ calendar: reference.calendar.value, calendarRange: reference.calendar.range,
    stocks, universeDate: listingDate, partialCaps,
    now, clock: Date.now, cache,
    corrections: screenerCorrections(process.env),
    data: { async get(path, params) {
      if (quotaStopped) throw Error("provider_budget_reserved");
      const startAt = Math.max(Date.now(), nextRequest);
      nextRequest = startAt + 500;
      const wait = startAt - Date.now();
      if (wait > 0) await delay(wait);
      if (quotaStopped) throw Error("provider_budget_reserved");
      requests++;
      return rest.get(path, params);
    } },
  });
  const report = Object.values(pack.snapshots).map(snapshot => ({
    session: snapshot.session, date: snapshot.date, universe: snapshot.rows.length, partial: snapshot.partial,
    prices: snapshot.rows.filter(row => row.values.price !== undefined).length,
    volume: snapshot.rows.filter(row => row.values.volume !== undefined).length,
    relativeVolume: snapshot.rows.filter(row => row.values.relativeVolume !== undefined).length,
    openingRange15: snapshot.rows.filter(row => row.values.or15Position !== undefined).length,
    sessionVwap: snapshot.rows.filter(row => row.values.sessionVwap !== undefined).length,
    vwapCross: snapshot.rows.filter(row => row.values.vwapCross !== undefined).length,
    caps: snapshot.rows.filter(row => row.values.cap !== undefined).length,
    sma200: snapshot.rows.filter(row => row.values.sma200 !== undefined).length,
    spreads: snapshot.rows.filter(row => row.values.spread !== undefined).length,
  }));
  console.log(JSON.stringify({ requests, throttled, minimumRemaining: Number.isFinite(minimumRemaining) ? minimumRemaining : null, seconds: Math.round((Date.now() - now) / 100) / 10, rssMiB: Math.round(process.memoryUsage().rss / 1_048_576), sessions: report }));
  if (quotaStopped) throw Error("provider_budget_reserved");
  if (pack.snapshots.last_regular.rows.filter(row => row.values.price !== undefined).length
    < pack.snapshots.last_regular.rows.length * 0.7) throw Error("collector_coverage_below_minimum");

  if (output) {
    const directory = dirname(output);
    await mkdir(directory, { recursive: true, mode: 0o700 });
    if (!(await lstat(directory)).isDirectory()) throw Error("invalid_output_directory");
    const temp = join(directory, "market-" + randomUUID() + ".tmp");
    try {
      const file = await open(temp, "wx", 0o600);
      try {
        await file.writeFile(JSON.stringify(pack));
        await file.sync();
      } finally {
        await file.close();
      }
      await readMarketPack(temp, Date.now());
      await rename(temp, output);
      const parent = await open(directory, "r");
      try { await parent.sync(); } finally { await parent.close(); }
    } finally {
      try { await unlink(temp); } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      }
    }
  }
  return pack;
}

async function main() {
  const [mode, keyFile, output, extra] = process.argv.slice(2);
  if (!["--check", "--publish", "--watch", "--benchmark"].includes(mode) || !keyFile || !isAbsolute(keyFile)
    || (mode === "--check" && output !== undefined)
    || (["--publish", "--watch", "--benchmark"].includes(mode) && (!output || !isAbsolute(output) || !output.endsWith("/stock-screeners-v1/market.json")
      || resolve(output).startsWith(resolve(process.cwd()) + "/")))
    || extra !== undefined) throw Error("invalid_arguments");
  const credentials = await openCredentials(keyFile);
  const cache: BarCache = { key: "", daily: new Map(), intraday: new Map() };
  const reference: ReferenceCache = {};
  if (mode === "--benchmark") {
    await collect(credentials, cache, reference, output);
    const readStarted = performance.now();
    const pack = await readMarketPack(output!, Date.now());
    const parseMs = performance.now() - readStarted;
    const rules: Rule[] = Array.from({ length: 20 }, (_, i) => ({ metric: i % 2 === 0 ? "price" : "cap", operator: "gte", value: 0 }));
    const duration: number[] = [];
    for (let sample = 0; sample < 100; sample++) {
      const start = performance.now();
      const { rows } = querySnapshot(pack.snapshots.last_regular, sample % 2 === 0 ? DEFAULT_DEFINITION : { ...DEFAULT_DEFINITION, rules });
      sortRows(rows, DEFAULT_DEFINITION.sort).slice(0, 50);
      duration.push(performance.now() - start);
      // Spread the reads over multiple event-loop turns.
      await delay(10);
    }
    duration.sort((a, b) => a - b);
    console.log(JSON.stringify({ phase: "query", rows: pack.snapshots.last_regular.rows.length, parseMs, queryP50Ms: duration[49], queryP95Ms: duration[94] }));
    console.log(JSON.stringify({ phase: "warm" }));
    await collect(credentials, cache, reference);
    return;
  }
  if (mode !== "--watch") {
    await collect(credentials, cache, reference, output);
    return;
  }
  for (;;) {
    const started = Date.now();
    try {
      await collect(credentials, cache, reference, output);
    } catch (error) {
      console.error("Stock screener refresh failed:", errorCode(error));
      await delay(120_000);
      continue;
    }
    const { date, minute } = easternClock(Date.now());
    const weekday = new Date(date + "T12:00:00Z").getUTCDay();
    const activeHours = weekday > 0 && weekday < 6 && minute >= 235 && minute < 1210;
    await delay(Math.max(20_000, (activeHours ? 300_000 : 1_800_000) - (Date.now() - started)));
  }
}

function errorCode(error: unknown) {
  return error instanceof Error && /^[a-z_]+$/.test(error.message) ? error.message : "collector_failed";
}

main().catch(error => {
  console.error(errorCode(error));
  process.exitCode = 1;
});
