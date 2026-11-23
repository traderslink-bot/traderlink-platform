import "server-only";

import Database from "better-sqlite3";
import { createHash, randomUUID } from "node:crypto";
import { closeSync, constants, lstatSync, mkdirSync, openSync } from "node:fs";
import { join } from "node:path";
import { requiresScannerLevelRead, SAVED_SCAN_ID, scanRules, type SavedScan, type SavedScanBook } from "../definition";
import { readSavedScansByOwnerKey, savedScanOwnerKey } from "../saved";
import { SHARED_SCAN_ID, type ScanShare, type ScanSharingMode, type SharedScanView } from "../sharing";

type Grant = ScanShare & { ownerKey: string; scanId: string; definitionHash: string };
type ChangeShare = { scanId: string; expectedId: string | null } & (
  { operation: "publish"; mode: ScanSharingMode; revision: number } | { operation: "revoke" }
);

const definitionHash = (scan: SavedScan) => createHash("sha256").update(JSON.stringify(scan.definition)).digest("hex");
const ownerGrantSql = "SELECT * FROM scanner_shares WHERE ownerKey = ? AND scanId = ?";

function withShares<T>(directory: string, write: boolean, absent: T, query: (database: Database.Database) => T): T {
  const path = join(directory, "shared-scans.sqlite");
  if (write) {
    mkdirSync(directory, { recursive: true, mode: 0o700 });
    closeSync(openSync(path, constants.O_WRONLY | constants.O_CREAT | constants.O_NOFOLLOW, 0o600));
  }
  try {
    if (!lstatSync(path).isFile()) throw Error("scan_sharing_unavailable");
  } catch (error) {
    if (!write && (error as NodeJS.ErrnoException).code === "ENOENT") return absent;
    throw error;
  }
  const database = new Database(path, { readonly: !write, fileMustExist: true, timeout: 750 });
  try {
    if (write) database.exec(`CREATE TABLE IF NOT EXISTS scanner_shares (
      id TEXT PRIMARY KEY, ownerKey TEXT NOT NULL, scanId TEXT NOT NULL,
      definitionHash TEXT NOT NULL, mode TEXT NOT NULL CHECK (mode IN ('results', 'filters')),
      UNIQUE (ownerKey, scanId)
    )`);
    return query(database);
  } finally {
    database.close();
  }
}

export function parseScanShareChange(value: unknown): ChangeShare {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw Error("invalid_share");
  const { operation, scanId, expectedId, mode, revision } = value as Record<string, unknown>;
  if (typeof scanId !== "string" || !SAVED_SCAN_ID.test(scanId) ||
      !(expectedId === null || typeof expectedId === "string" && SHARED_SCAN_ID.test(expectedId))) throw Error("invalid_share");
  if (operation === "revoke" && expectedId) return { operation, scanId, expectedId };
  if (operation === "publish" && (mode === "results" || mode === "filters") &&
      typeof revision === "number" && Number.isSafeInteger(revision) && revision >= 0) {
    return { operation, scanId, expectedId, mode, revision };
  }
  throw Error("invalid_share");
}

export function readOwnScanShare(directory: string, ownerId: string, scanId: string): ScanShare | null {
  return withShares(directory, false, null as ScanShare | null, database => {
    const row = database.prepare(ownerGrantSql).get(savedScanOwnerKey(ownerId), scanId) as Grant | undefined;
    return row ? { id: row.id, mode: row.mode } : null;
  });
}

export function changeScanShare(directory: string, ownerId: string, change: ChangeShare): ScanShare | null {
  const ownerKey = savedScanOwnerKey(ownerId);
  return withShares(directory, true, null as ScanShare | null, database => database.transaction(() => {
    const current = database.prepare(ownerGrantSql).get(ownerKey, change.scanId) as Grant | undefined;
    if ((current?.id ?? null) !== change.expectedId) throw Error("share_conflict");
    if (change.operation === "revoke") {
      database.prepare("DELETE FROM scanner_shares WHERE ownerKey = ? AND scanId = ?").run(ownerKey, change.scanId);
      return null;
    }
    const book = readSavedScansByOwnerKey(directory, ownerKey);
    const scan = book.scans.find(scan => scan.id === change.scanId);
    if (book.revision !== change.revision || !scan) throw Error("share_conflict");
    if (scanRules(scan.definition).some(rule => requiresScannerLevelRead(rule.metric))) throw Error("scan_needs_private_levels");
    const next = { id: randomUUID(), mode: change.mode, ownerKey, scanId: scan.id, definitionHash: definitionHash(scan) };
    database.prepare(`INSERT INTO scanner_shares (id, ownerKey, scanId, definitionHash, mode)
      VALUES (@id, @ownerKey, @scanId, @definitionHash, @mode)
      ON CONFLICT (ownerKey, scanId) DO UPDATE SET id = excluded.id, definitionHash = excluded.definitionHash, mode = excluded.mode`).run(next);
    return { id: next.id, mode: next.mode };
  }).immediate());
}

export function revokeChangedScanShares(directory: string, ownerId: string, next: SavedScanBook) {
  const ownerKey = savedScanOwnerKey(ownerId);
  const current = readSavedScansByOwnerKey(directory, ownerKey);
  if (current.revision !== next.revision) throw Error("scan_save_conflict");
  const upcoming = new Map(next.scans.map(scan => [scan.id, scan]));
  const revocable = current.scans.filter(scan => {
    const replacement = upcoming.get(scan.id);
    return !replacement || definitionHash(replacement) !== definitionHash(scan);
  });
  if (!revocable.length) return;
  withShares(directory, true, undefined, database => database.transaction(() => {
    const remove = database.prepare("DELETE FROM scanner_shares WHERE ownerKey = ? AND scanId = ?");
    for (const { id } of revocable) remove.run(ownerKey, id);
  }).immediate());
}

/** The link grants access to one saved rule version and is retired on revoke or a rule edit. */
export function readSharedScan(directory: string, id: string): { grant: ScanShare; scan: SavedScan } | null {
  if (!SHARED_SCAN_ID.test(id)) return null;
  const grant = withShares(directory, false, null as Grant | null,
    database => database.prepare("SELECT * FROM scanner_shares WHERE id = ?").get(id) as Grant | undefined ?? null);
  if (!grant) return null;
  const scan = readSavedScansByOwnerKey(directory, grant.ownerKey).scans.find(scan => scan.id === grant.scanId);
  if (!scan || definitionHash(scan) !== grant.definitionHash) return null;
  return { grant: { id, mode: grant.mode }, scan };
}

export function sharedScanView(share: NonNullable<ReturnType<typeof readSharedScan>>): SharedScanView {
  return {
    ...share.grant,
    name: share.scan.name,
    ...(share.grant.mode === "filters" ? { definition: share.scan.definition } : {}),
  };
}
