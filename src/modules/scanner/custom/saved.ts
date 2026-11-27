import "server-only";
import { createHash, randomUUID } from "node:crypto";
import { closeSync, constants, fstatSync, mkdirSync, openSync, readFileSync, renameSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { resolvePlatformDatabaseConfig } from "@/src/modules/platform/server/database/platform-database-config";
import { parseSavedScanBook, type SavedScan, type SavedScanBook, type SavedScanCatalogue } from "./definition";

const FILE_MAX_BYTES = 128 * 1024;
export const savedScanOwnerKey = (ownerId: string) => createHash("sha256").update(ownerId).digest("hex");
const ownerFile = (directory: string, ownerId: string) => join(directory, savedScanOwnerKey(ownerId) + ".json");
const runtime = globalThis as typeof globalThis & {
  traderlinkSavedScanListeners?: Map<string, Set<() => void>>;
};
const listeners = runtime.traderlinkSavedScanListeners ??= new Map();

export const savedCustomScansDirectory = () => join(dirname(resolvePlatformDatabaseConfig().databasePath), "saved-live-scans-v1");

export function savedScanCatalogue(book: SavedScanBook): SavedScanCatalogue {
  return { revision: book.revision, scans: book.scans.map(({ id, name }) => ({ id, name })) };
}

export function subscribeSavedCustomScans(directory: string, ownerId: string, listener: () => void): () => void {
  const target = ownerFile(directory, ownerId);
  const active = listeners.get(target) ?? new Set<() => void>();
  active.add(listener);
  listeners.set(target, active);
  return () => {
    active.delete(listener);
    if (!active.size && listeners.get(target) === active) listeners.delete(target);
  };
}
export function readSavedCustomScans(directory: string, ownerId: string): SavedScanBook {
  return readSavedScansByOwnerKey(directory, savedScanOwnerKey(ownerId));
}

export function readSavedScansByOwnerKey(directory: string, ownerKey: string): SavedScanBook {
  return readVersionedBook(directory, ownerKey).book;
}

function legacyRuleVersion(scan: SavedScan): string {
  return "legacy:" + createHash("sha256").update(JSON.stringify(scan.definition)).digest("hex");
}

function readVersionedBook(directory: string, ownerKey: string): { book: SavedScanBook; versions: Map<string, string> } {
  if (!/^[a-f0-9]{64}$/u.test(ownerKey)) throw Error("invalid_scan_owner");
  let fd: number;
  try { fd = openSync(join(directory, ownerKey + ".json"), constants.O_RDONLY | constants.O_NOFOLLOW); }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return { book: { revision:0, scans:[] }, versions: new Map() };
    throw error;
  }
  try {
    const stat = fstatSync(fd);
    if (!stat.isFile() || stat.size > FILE_MAX_BYTES) throw Error("invalid_scan_book");
    const stored = JSON.parse(readFileSync(fd, "utf8")) as { ruleVersions?: Record<string, string> };
    const book = parseSavedScanBook(stored);
    const versions = new Map(book.scans.map(scan => {
      const prior = stored.ruleVersions?.[scan.id];
      return [scan.id, typeof prior === "string" && /^(?:legacy:[a-f0-9]{64}|[a-f0-9-]{36})$/u.test(prior)
        ? prior : legacyRuleVersion(scan)];
    }));
    return { book, versions };
  } finally { closeSync(fd); }
}

export function readSavedScanSourceVersions(directory: string, ownerId: string) {
  const { book, versions } = readVersionedBook(directory, savedScanOwnerKey(ownerId));
  return book.scans.map(scan => ({ scan, revision: versions.get(scan.id)! }));
}

export function writeSavedCustomScans(directory: string, ownerId: string, requested: SavedScanBook): SavedScanBook {
  const input = parseSavedScanBook(requested);
  const current = readVersionedBook(directory, savedScanOwnerKey(ownerId));
  if (current.book.revision !== input.revision) throw Error("scan_save_conflict");
  const next = { ...input, revision:input.revision + 1 };
  const previous = new Map(current.book.scans.map(scan => [scan.id, scan]));
  const ruleVersions = Object.fromEntries(next.scans.map(scan => {
    const prior = previous.get(scan.id);
    const version = prior && JSON.stringify(prior.definition) === JSON.stringify(scan.definition)
      ? current.versions.get(scan.id) : randomUUID();
    return [scan.id, version];
  }));
  const bytes = JSON.stringify({ ...next, ruleVersions });
  if (Buffer.byteLength(bytes) > FILE_MAX_BYTES) throw Error("invalid_scan_book");
  mkdirSync(directory, { recursive:true, mode:0o700 });
  const target = ownerFile(directory, ownerId);
  const temp = target + "." + randomUUID() + ".tmp";
  try {
    writeFileSync(temp, bytes, { flag:"wx", mode:0o600, flush:true });
    renameSync(temp, target);
  } finally {
    try { unlinkSync(temp); }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
  }
  for (const listener of listeners.get(target) ?? []) {
    try { listener(); } catch { /* Notification cannot reverse the completed save. */ }
  }
  return next;
}
