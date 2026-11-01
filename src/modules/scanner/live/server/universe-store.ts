import { constants } from "node:fs";
import { lstat, mkdir, open, readdir, rename, unlink } from "node:fs/promises";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { randomUUID } from "node:crypto";
import type { DailyUniverse, UniverseUpload } from "../contracts";
import { importDailyUniverse } from "../universe";
import { MAX_UNIVERSE_ROWS, parseUniverseCsv, validDate, validateUniverseUpload } from "../universe-validation";

const MAX_RECORD_BYTES = 2_000_000;
const writers = new Map<string,Promise<unknown>>();
const object = (value: unknown): value is Record<string,unknown> => Boolean(value && typeof value === "object" && !Array.isArray(value));
function validTimestamp(value: unknown): value is string { return typeof value === "string" && Number.isFinite(Date.parse(value)); }
function decodeDaily(value: unknown, date: string): DailyUniverse {
  if (!object(value) || value.version !== 1 || value.tradingDate !== date || !validTimestamp(value.acceptedAtUtc)
    || !validTimestamp(value.lastCollectionAtUtc) || !Number.isSafeInteger(value.latestUploadCount)
    || Number(value.latestUploadCount) < 1 || Number(value.latestUploadCount) > MAX_UNIVERSE_ROWS
    || !Array.isArray(value.sourceHashes) || value.sourceHashes.length < 1 || value.sourceHashes.length > 20
    || value.sourceHashes.some(hash => typeof hash !== "string" || !/^[a-f0-9]{64}$/u.test(hash))
    || new Set(value.sourceHashes).size !== value.sourceHashes.length
    || !Array.isArray(value.stocks) || value.stocks.length < 1 || value.stocks.length > MAX_UNIVERSE_ROWS) throw Error("scanner_universe_storage_invalid");
  const csv = ["symbol,exchange,market_cap",...value.stocks.map(stock => {
    if (!object(stock) || typeof stock.symbol !== "string" || !/^[A-Z][A-Z0-9.-]{0,15}$/u.test(stock.symbol)
      || !["NASDAQ","NYSE"].includes(String(stock.exchange)) || !Number.isSafeInteger(stock.marketCapAtCollection)
      || Number(stock.marketCapAtCollection) <= 0 || Number(stock.marketCapAtCollection) > 100_000_000) throw Error("scanner_universe_storage_invalid");
    return `${stock.symbol},${stock.exchange},${stock.marketCapAtCollection}`;
  })].join("\n");
  try { parseUniverseCsv(csv); } catch { throw Error("scanner_universe_storage_invalid"); }
  return value as DailyUniverse;
}
async function readJson(file: string): Promise<unknown | null> {
  let handle;
  try { handle = await open(file,constants.O_RDONLY | constants.O_NOFOLLOW); }
  catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return null; throw error; }
  try {
    const info = await handle.stat();
    if (!info.isFile() || info.size > MAX_RECORD_BYTES) throw Error("scanner_universe_storage_invalid");
    const bytes = await handle.readFile();
    if (bytes.length > MAX_RECORD_BYTES) throw Error("scanner_universe_storage_invalid");
    return JSON.parse(new TextDecoder("utf-8",{ fatal: true }).decode(bytes));
  } finally { await handle.close(); }
}
async function syncDirectory(directory: string): Promise<void> {
  const handle = await open(directory,constants.O_RDONLY | constants.O_DIRECTORY);
  try { await handle.sync(); } finally { await handle.close(); }
}
async function atomicJson(file: string, value: unknown): Promise<void> {
  const bytes = JSON.stringify(value)+"\n";
  if (Buffer.byteLength(bytes) > MAX_RECORD_BYTES) throw Error("scanner_universe_storage_limit");
  const temporary = `${file}.${randomUUID()}.tmp`;
  try {
    const handle = await open(temporary,"wx",0o600);
    try { await handle.writeFile(bytes); await handle.sync(); } finally { await handle.close(); }
    await rename(temporary,file);
    await syncDirectory(dirname(file));
  } finally { await unlink(temporary).catch(error => { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }); }
}
function evidence(input: UniverseUpload, hash: string): unknown {
  // Project only approved metadata; never persist arbitrary client upload configuration or credentials.
  const meta = input.metadata;
  return { version: 1, hash, tradingDate: input.tradingDate, csv: input.csv,
    metadata: { completeness_status: meta.completeness_status, source_url: meta.source_url,
      collection_started_at_utc: meta.collection_started_at_utc, collection_finished_at_utc: meta.collection_finished_at_utc,
      displayed_total: meta.displayed_total, extracted_unique_count: meta.extracted_unique_count,
      applied_filters: { exchanges: [...meta.applied_filters.exchanges], market_cap_max: meta.applied_filters.market_cap_max } } };
}

/** Single hosted writer. All instances in this process serialize by the same absolute directory. */
export class UniverseStore {
  readonly directory: string;
  constructor(directory: string) {
    if (!isAbsolute(directory) || directory !== resolve(directory) || directory === dirname(directory)) throw Error("scanner_universe_storage_path_invalid");
    this.directory = directory;
  }
  private async ensureDirectory(): Promise<void> {
    await mkdir(this.directory,{ recursive: true,mode: 0o700 });
    const info = await lstat(this.directory);
    if (!info.isDirectory() || info.isSymbolicLink()) throw Error("scanner_universe_storage_path_invalid");
  }
  async read(tradingDate: string): Promise<DailyUniverse | null> {
    if (!validDate(tradingDate)) throw Error("scanner_universe_date_invalid");
    // No read creates storage or silently chooses a previous date.
    try {
      const info = await lstat(this.directory);
      if (!info.isDirectory() || info.isSymbolicLink()) throw Error("scanner_universe_storage_path_invalid");
    } catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return null; throw error; }
    const value = await readJson(join(this.directory,`${tradingDate}.json`));
    return value === null ? null : decodeDaily(value,tradingDate);
  }
  async readLatestOnOrBefore(tradingDate: string): Promise<DailyUniverse | null> {
    if (!validDate(tradingDate)) throw Error("scanner_universe_date_invalid");
    try {
      const info = await lstat(this.directory);
      if (!info.isDirectory() || info.isSymbolicLink()) throw Error("scanner_universe_storage_path_invalid");
    } catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return null; throw error; }
    const dates = (await readdir(this.directory)).filter(name => /^\d{4}-\d{2}-\d{2}\.json$/u.test(name))
      .map(name => name.slice(0,10)).filter(date => date <= tradingDate).sort().reverse();
    for (const date of dates) {
      const value = await readJson(join(this.directory,`${date}.json`));
      if (value !== null) return decodeDaily(value,date);
    }
    return null;
  }
  async import(value: unknown, now: number): Promise<Readonly<{ universe: DailyUniverse; idempotent: boolean }>> {
    const input = structuredClone(value);
    const checked = validateUniverseUpload(input,now); // Reject before creating any directory.
    const previousWriter = writers.get(this.directory) ?? Promise.resolve();
    const operation = previousWriter.catch(() => {}).then(async () => {
      await this.ensureDirectory();
      const previous = await this.read(checked.input.tradingDate);
      const result = importDailyUniverse(previous,checked.input,now);
      if (result.idempotent) return result;
      const evidenceFile = join(this.directory,`${checked.input.tradingDate}-${checked.hash}.json`);
      const projected = evidence(checked.input,checked.hash);
      try {
        const handle = await open(evidenceFile,"wx",0o600);
        try { await handle.writeFile(JSON.stringify(projected)+"\n"); await handle.sync(); } finally { await handle.close(); }
        await syncDirectory(this.directory);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
        const existing = await readJson(evidenceFile);
        // A retry after an interrupted daily-state write may reuse its exact immutable evidence.
        if (!object(existing) || existing.hash !== checked.hash || existing.tradingDate !== checked.input.tradingDate) throw Error("scanner_universe_evidence_conflict");
        try { if (validateUniverseUpload(existing,now).hash !== checked.hash) throw Error("conflict"); }
        catch { throw Error("scanner_universe_evidence_conflict"); }
      }
      await atomicJson(join(this.directory,`${checked.input.tradingDate}.json`),result.universe);
      return result;
    });
    writers.set(this.directory,operation);
    try { return await operation; }
    finally { if (writers.get(this.directory) === operation) writers.delete(this.directory); }
  }
}
