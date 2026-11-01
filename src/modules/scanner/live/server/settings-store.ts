import "server-only";
import { constants } from "node:fs";
import { lstat, mkdir, open, rename, unlink } from "node:fs/promises";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { randomUUID } from "node:crypto";
import type { FloatFact } from "../engine";
import type { ScannerConfiguration } from "../contracts";
import { initialConfiguration, updateConfiguration, validateConfiguration } from "../settings";
import type { FloatCachePersistence } from "./float-enrichment";

const MAX_BYTES = 1_000_000;
const DATE = /^\d{4}-\d{2}-\d{2}$/u;
const writers = new Map<string,Promise<unknown>>();
async function serialize<T>(key: string, work: () => Promise<T>): Promise<T> {
  const previous = writers.get(key) ?? Promise.resolve();
  const operation = previous.catch(() => {}).then(work);
  writers.set(key,operation);
  try { return await operation; } finally { if (writers.get(key) === operation) writers.delete(key); }
}
async function readJson(file: string): Promise<unknown | null> {
  let handle;
  try { handle = await open(file,constants.O_RDONLY | constants.O_NOFOLLOW); }
  catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return null; throw error; }
  try {
    const stat = await handle.stat();
    if (!stat.isFile() || stat.size > MAX_BYTES) throw Error("scanner_settings_storage_invalid");
    return JSON.parse(new TextDecoder("utf-8",{ fatal: true }).decode(await handle.readFile()));
  } finally { await handle.close(); }
}
async function syncDirectory(directory: string): Promise<void> {
  const handle = await open(directory,constants.O_RDONLY | constants.O_DIRECTORY);
  try { await handle.sync(); } finally { await handle.close(); }
}
async function atomicJson(file: string, value: unknown): Promise<void> {
  const bytes = JSON.stringify(value)+"\n";
  if (Buffer.byteLength(bytes) > MAX_BYTES) throw Error("scanner_settings_storage_limit");
  const temporary = `${file}.${randomUUID()}.tmp`;
  try {
    const handle = await open(temporary,"wx",0o600);
    try { await handle.writeFile(bytes); await handle.sync(); } finally { await handle.close(); }
    await rename(temporary,file); await syncDirectory(dirname(file));
  } finally { await unlink(temporary).catch(error => { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }); }
}
function validFloatRecord(value: unknown, date: string): value is Readonly<{ tradingDate: string; facts: Readonly<Record<string,FloatFact>> }> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as { tradingDate?: unknown; facts?: unknown };
  if (record.tradingDate !== date || !record.facts || typeof record.facts !== "object" || Array.isArray(record.facts)) return false;
  return Object.entries(record.facts).every(([symbol,fact]) => /^[A-Z][A-Z0-9.-]{0,15}$/u.test(symbol)
    && fact && typeof fact === "object" && !Array.isArray(fact)
    && Number.isSafeInteger((fact as FloatFact).shares) && (fact as FloatFact).shares > 0
    && typeof (fact as FloatFact).retrievedAtUtc === "string" && Number.isFinite(Date.parse((fact as FloatFact).retrievedAtUtc)));
}

export class ScannerSettingsStore {
  readonly directory: string;
  constructor(directory: string) {
    if (!isAbsolute(directory) || directory !== resolve(directory) || directory === dirname(directory)) throw Error("scanner_settings_path_invalid");
    this.directory = directory;
  }
  private async ensureDirectory(): Promise<void> {
    await mkdir(this.directory,{ recursive: true, mode: 0o700 });
    const stat = await lstat(this.directory);
    if (!stat.isDirectory() || stat.isSymbolicLink()) throw Error("scanner_settings_path_invalid");
  }
  private async directoryExists(): Promise<boolean> {
    try {
      const stat = await lstat(this.directory);
      if (!stat.isDirectory() || stat.isSymbolicLink()) throw Error("scanner_settings_path_invalid");
      return true;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return false;
      throw error;
    }
  }
  async configuration(): Promise<ScannerConfiguration> {
    if (!await this.directoryExists()) return initialConfiguration();
    const value = await readJson(join(this.directory,"settings.json"));
    return value === null ? initialConfiguration() : validateConfiguration(value);
  }
  async save(candidate: unknown, expectedRevision: number, now: number): Promise<ScannerConfiguration> {
    if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 0 || !Number.isSafeInteger(now) || now <= 0) throw Error("scanner_settings_invalid");
    return serialize(this.directory,async () => {
      await this.ensureDirectory();
      const current = await this.configuration();
      if (current.revision !== expectedRevision) throw Error("scanner_settings_conflict");
      const next = updateConfiguration(current,candidate,now);
      await atomicJson(join(this.directory,"settings.json"),next);
      return next;
    });
  }
  floatCache(): FloatCachePersistence {
    return {
      read: async tradingDate => {
        if (!DATE.test(tradingDate)) throw Error("scanner_float_date_invalid");
        if (!await this.directoryExists()) return null;
        const value = await readJson(join(this.directory,`floats-${tradingDate}.json`));
        if (value === null) return null;
        if (!validFloatRecord(value,tradingDate)) throw Error("scanner_float_storage_invalid");
        return value;
      },
      write: async record => {
        if (!DATE.test(record.tradingDate) || !validFloatRecord(record,record.tradingDate)) throw Error("scanner_float_storage_invalid");
        await serialize(this.directory,async () => { await this.ensureDirectory(); await atomicJson(join(this.directory,`floats-${record.tradingDate}.json`),record); });
      },
    };
  }
  async readFloatFacts(tradingDate:string,symbols:readonly string[]):Promise<Readonly<Record<string,FloatFact>>> {
    if(!DATE.test(tradingDate)||symbols.length>60||symbols.some(symbol=>!/^[A-Z][A-Z0-9.-]{0,15}$/u.test(symbol)))throw Error("scanner_float_request_invalid");
    const record=await this.floatCache().read(tradingDate);
    if(record===null)return Object.freeze({});
    if(!validFloatRecord(record,tradingDate))throw Error("scanner_float_storage_invalid");
    return Object.freeze(Object.fromEntries(symbols.flatMap(symbol=>{
      const fact=record.facts[symbol];
      return fact?[[symbol,fact] as const]:[];
    })));
  }
}
