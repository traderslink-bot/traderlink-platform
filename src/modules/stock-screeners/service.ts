import "server-only";
import { randomUUID } from "node:crypto";
import { lstat } from "node:fs/promises";
import { dirname, join } from "node:path";
import { resolvePlatformDatabaseConfig } from "../platform/server/database/platform-database-config";
import type { TraderLinkPlatformRequestIdentity } from "../platform/server/authentication/require-platform-request-scope";
import { easternClock } from "../scanner/live/sessions";
import { screenRules, sortIncludes, type Candidate, type Definition, type MarketPack, type RunResult } from "./contracts";
import { previewPack } from "./fixture";
import { PAGE_SIZE, querySnapshot, sortRows } from "./query";
import { MARKET_PACK_MAX_AGE_MS, readMarketPack } from "./snapshot-file";
import { canReadPressReleaseRun, HOUR_MS, memberPressReleases } from "./press-releases";

const REQUEST_WINDOW = 60_000;
type Run = {
  owner: string; header: Omit<RunResult, "rows" | "page" | "pageSize">;
  matches: Candidate[]; pressReleaseDelay?: number;
};
const processState = globalThis as typeof globalThis & {
  traderlinkStockScreens?: Map<string, Run>;
  traderlinkStockScreenBudget?: Map<string, { start: number; count: number }>;
};
const runs = processState.traderlinkStockScreens ??= new Map();
const budget = processState.traderlinkStockScreenBudget ??= new Map();

export function takeScreenBudget(owner: string, now = Date.now()) {
  for (const [key, usage] of budget) {
    if (now - usage.start >= REQUEST_WINDOW) budget.delete(key);
  }
  const current = budget.get(owner);
  if (current && current.count >= 60) return false;
  if (current) current.count += 1;
  else {
    if (budget.size >= 2_000) return false;
    budget.set(owner, { start: now, count: 1 });
  }
  return true;
}

export function stockScreenersEnabled(mode: TraderLinkPlatformRequestIdentity["mode"]) {
  return (mode === "local_development" && process.env.NODE_ENV !== "production")
    || process.env.TRADERLINK_STOCK_SCREENERS_ENABLED === "1";
}

export function stockScreenersDirectory() {
  return join(dirname(resolvePlatformDatabaseConfig().databasePath), "stock-screeners-v1");
}

export function getRun(identity: TraderLinkPlatformRequestIdentity, id: string, page: number, sort: Definition["sort"]): RunResult {
  const run = runs.get(id);
  if (!run || run.owner !== identity.scope.userId
    || (run.pressReleaseDelay !== undefined && !canReadPressReleaseRun(identity, run.pressReleaseDelay, Date.now()))) throw Error("run_expired");
  return resultPage(run, page, sort);
}

function resultPage(run: Run, page: number, sort: Definition["sort"]): RunResult {
  const last = Math.max(1, Math.ceil(run.matches.length / PAGE_SIZE)), current = Math.min(page, last);
  const sorted = sortRows(run.matches, sort);
  return { ...run.header, rows: sorted.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE), page: current, pageSize: PAGE_SIZE };
}

let marketRead: { file: string; until: number; result: ReturnType<typeof readSharedMarket> } | undefined;
let lastMarket: { file: string; signature: string; pack: MarketPack } | undefined;
let demo: { bucket: number; pack: ReturnType<typeof previewPack> } | undefined;

function previewMarket(now: number) {
  const bucket = Math.floor(now / 60_000);
  if (demo?.bucket !== bucket) demo = { bucket, pack: previewPack(now, 5_845) };
  return demo.pack;
}

function withinSnapshotAgeLimit(pack: MarketPack, now: number) {
  return Object.values(pack.snapshots)
    .every(({ capturedAt }) => now - capturedAt <= MARKET_PACK_MAX_AGE_MS && capturedAt <= now + 5_000);
}

async function readSharedMarket(file: string, now: number) {
  const previous = lastMarket?.file === file && withinSnapshotAgeLimit(lastMarket.pack, now)
    ? lastMarket : undefined;
  try {
    const stats = await lstat(file);
    if (!stats.isFile()) throw Error("market_pack_invalid");
    const signature = [stats.dev, stats.ino, stats.mtimeMs, stats.size].join(":");
    if (previous?.signature === signature) return { pack: previous.pack, fallback: false };
    const pack = await readMarketPack(file, now);
    lastMarket = { file, signature, pack };
    return { pack, fallback: false };
  } catch (error) {
    if (!previous) throw error;
    return { pack: previous.pack, fallback: true };
  }
}

async function marketForRun(now: number, preview: boolean) {
  // The private VPS launcher isolates the app's data directory from other
  // development and hosted data. The market collector writes this file separately.
  const directory = stockScreenersDirectory();
  if (preview && process.env.TRADERLINK_PLATFORM_LOCAL_PRIVATE_DATA_ROOT !== dirname(directory)) {
    return { pack: previewMarket(now), fallback: false };
  }
  const file = join(directory, "market.json");
  if (!marketRead || marketRead.file !== file || marketRead.until < now) {
    marketRead = { file, until: now + 5_000, result: readSharedMarket(file, now) };
  }
  try {
    const result = await marketRead.result;
    if (!withinSnapshotAgeLimit(result.pack, now)) throw Error("market_pack_invalid");
    return result;
  } catch (error) {
    if (preview && (error as NodeJS.ErrnoException)?.code === "ENOENT") return { pack: previewMarket(now), fallback: false };
    throw error;
  }
}

export async function createRun(identity: TraderLinkPlatformRequestIdentity, definition: Definition): Promise<RunResult> {
  const now = Date.now();
  const preview = identity.mode === "local_development" && process.env.NODE_ENV !== "production";
  const { pack, fallback } = await marketForRun(now, preview);
  const { rows: snapshotRows, ...info } = pack.snapshots[definition.session === "latest" ? pack.latest : definition.session];
  const example = info.source === "Preview data";
  const marketClock = easternClock(now);
  const weekday = new Date(marketClock.date + "T12:00:00Z").getUTCDay();
  const businessHours = weekday > 0 && weekday < 6 && marketClock.minute >= 240 && marketClock.minute < 1200;
  const stale = !example && ((!info.closed || (businessHours && definition.session === "latest"))
    && now - info.capturedAt > 7 * 60_000);
  const includePressReleases = screenRules(definition).some(rule => rule.metric === "pressReleaseAge")
    || sortIncludes(definition.sort, "pressReleaseAge") || definition.columns.includes("pressReleaseAge");
  const recentPressReleases = includePressReleases && !example
    ? memberPressReleases(identity, snapshotRows.map(row => row.symbol), now)
    : undefined;
  const pressReleases = includePressReleases ? { checkedAt: now, available: example || recentPressReleases !== undefined } : undefined;
  const snapshot = { ...info, partial: info.partial || stale || fallback,
    rows: example ? snapshotRows : snapshotRows.map(row => {
      const pressRelease = recentPressReleases?.releases.get(row.symbol);
      const staleQuote = row.quoteAt !== undefined && now - row.quoteAt > 60_000;
      if (!staleQuote && !pressRelease) return row;
      const values = { ...row.values };
      if (pressRelease) values.pressReleaseAge = (now - pressRelease.publishedAt) / HOUR_MS;
      if (staleQuote) {
        delete values.bid;
        delete values.ask;
        delete values.spread;
        delete values.spreadDollar;
      }
      return { ...row, values, pressRelease, quoteAt: staleQuote ? undefined : row.quoteAt };
    }) };
  const { rows, ...coverage } = querySnapshot(snapshot, definition);
  const owner = identity.scope.userId;
  const own = Array.from(runs).filter(([, run]) => run.owner === owner);
  for (const [id] of own.slice(0, Math.max(0, own.length - 5))) runs.delete(id);
  while (runs.size >= 64) runs.delete(runs.keys().next().value!);
  const id = randomUUID();
  const run: Run = { owner, matches: rows, pressReleaseDelay: recentPressReleases?.delaySeconds,
    header: { ...info, partial: snapshot.partial, ...coverage, id, total: rows.length, pressReleases,
      snapshotFallback: fallback ? true : undefined } };
  runs.set(id, run);
  return resultPage(run, 1, definition.sort);
}
