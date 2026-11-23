import "server-only";
import { createHash, randomUUID } from "node:crypto";
import { closeSync, constants, fstatSync, mkdirSync, openSync, readFileSync, renameSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { resolvePlatformDatabaseConfig } from "@/src/modules/platform/server/database/platform-database-config";
import { parseSavedScanBook, type SavedScanBook, type SavedScanCatalogue } from "./definition";

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
  if (!/^[a-f0-9]{64}$/u.test(ownerKey)) throw Error("invalid_scan_owner");
  let fd: number;
  try { fd = openSync(join(directory, ownerKey + ".json"), constants.O_RDONLY | constants.O_NOFOLLOW); }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return { revision:0, scans:[] };
    throw error;
  }
  try {
    const stat = fstatSync(fd);
    if (!stat.isFile() || stat.size > FILE_MAX_BYTES) throw Error("invalid_scan_book");
    return parseSavedScanBook(JSON.parse(readFileSync(fd, "utf8")));
  } finally { closeSync(fd); }
}

export function writeSavedCustomScans(directory: string, ownerId: string, requested: SavedScanBook): SavedScanBook {
  const input = parseSavedScanBook(requested);
  if (readSavedCustomScans(directory, ownerId).revision !== input.revision) throw Error("scan_save_conflict");
  const next = { ...input, revision:input.revision + 1 };
  const bytes = JSON.stringify(next);
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
