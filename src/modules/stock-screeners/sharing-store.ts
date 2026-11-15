import "server-only";
import Database from "better-sqlite3";
import { randomUUID } from "node:crypto";
import { closeSync, constants, lstatSync, mkdirSync, openSync } from "node:fs";
import { join } from "node:path";
import { isObject, parseDefinition } from "./contracts";
import { SAVED_SCREEN_ID, readSavedByOwnerKey, savedScreenOwnerKey } from "./saved-store";
import { COMMUNITY_PAGE_SIZE, SHARED_SCREEN_ID, type CommunityPage, type ShareCommand, type SharedScreen } from "./sharing-contracts";

type ShareRow = {
  id: string; owner_key: string; screen_id: string; name: string; author: string;
  definition: string; listed: number; published_at: number;
};

function withCatalog<T>(directory: string, mode: "read" | "create" | "update", fallback: T, work: (db: Database.Database) => T): T {
  const catalogPath = join(directory, "shared.sqlite");
  if (mode === "create") {
    mkdirSync(directory, { recursive: true, mode: 0o700 });
    closeSync(openSync(catalogPath, constants.O_WRONLY | constants.O_CREAT | constants.O_NOFOLLOW, 0o600));
  }
  try {
    if (!lstatSync(catalogPath).isFile()) throw Error("sharing_unavailable");
  } catch (error) {
    if (mode !== "create" && (error as NodeJS.ErrnoException)?.code === "ENOENT") return fallback;
    throw error;
  }
  const db = new Database(catalogPath, { readonly: mode === "read", fileMustExist: true, timeout: 750 });
  try {
    if (mode === "create") db.exec(`
      CREATE TABLE IF NOT EXISTS screener_shares (
        id TEXT PRIMARY KEY, owner_key TEXT NOT NULL, screen_id TEXT NOT NULL,
        name TEXT NOT NULL, author TEXT NOT NULL, definition TEXT NOT NULL,
        listed INTEGER NOT NULL CHECK (listed IN (0, 1)), published_at INTEGER NOT NULL,
        UNIQUE (owner_key, screen_id)
      );
      CREATE INDEX IF NOT EXISTS screener_gallery ON screener_shares(published_at DESC, id DESC) WHERE listed = 1;
    `);
    return work(db);
  } finally {
    db.close();
  }
}

function toPreset(row: ShareRow): SharedScreen {
  const definition = parseDefinition(JSON.parse(row.definition));
  if (definition.universe !== "all" || definition.tickers.length) throw Error("sharing_unavailable");
  return { id: row.id, name: row.name, author: row.author, definition, listed: row.listed === 1 };
}

function readPublished(directory: string, row: ShareRow | undefined): SharedScreen | null {
  if (!row) return null;
  try {
    const saved = readSavedByOwnerKey(join(directory, "saved"), row.owner_key);
    return saved.screens.some(screen => screen.id === row.screen_id && screen.definition.universe === "all") ? toPreset(row) : null;
  } catch {
    return null;
  }
}

function ownerShare(db: Database.Database, ownerKey: string, screenId: string) {
  return db.prepare("SELECT * FROM screener_shares WHERE owner_key = ? AND screen_id = ?").get(ownerKey, screenId) as ShareRow | undefined;
}

export function readShareState(directory: string, userId: string, screenId: string) {
  return withCatalog(directory, "read", null, db => readPublished(directory, ownerShare(db, savedScreenOwnerKey(userId), screenId)));
}

export function readSharedScreen(directory: string, id: string) {
  if (!SHARED_SCREEN_ID.test(id)) return null;
  return withCatalog(directory, "read", null, db => {
    const row = db.prepare("SELECT * FROM screener_shares WHERE id = ?").get(id) as ShareRow | undefined;
    return readPublished(directory, row);
  });
}

export function readCommunityPage(directory: string, after: string | null): CommunityPage {
  const [time, id] = after?.split(".") ?? [];
  const publishedAt = time ? Number(time) : Number.MAX_SAFE_INTEGER;
  if (after !== null && (!time || !Number.isSafeInteger(publishedAt) || publishedAt < 0 || !id
    || !SHARED_SCREEN_ID.test(id) || after !== publishedAt + "." + id)) throw Error("invalid_page");
  return withCatalog<CommunityPage>(directory, "read", { screens: [], next: null }, db => {
    const rows = db.prepare(`SELECT * FROM screener_shares WHERE listed = 1 AND (published_at, id) < (?, ?)
      ORDER BY published_at DESC, id DESC LIMIT ?`).all(publishedAt, id ?? "", COMMUNITY_PAGE_SIZE + 1) as ShareRow[];
    const page = rows.slice(0, COMMUNITY_PAGE_SIZE);
    const last = page.at(-1);
    return {
      screens: page.flatMap(row => readPublished(directory, row) ?? []),
      next: last && rows.length > COMMUNITY_PAGE_SIZE ? last.published_at + "." + last.id : null,
    };
  });
}

export function removeScreenShares(directory: string, userId: string, screenIds: string[]) {
  if (!screenIds.length) return;
  withCatalog(directory, "update", undefined, db => {
    const ownerKey = savedScreenOwnerKey(userId);
    const slots = screenIds.map(() => "?").join(",");
    db.prepare(`DELETE FROM screener_shares WHERE owner_key = ? AND screen_id IN (${slots})`).run(ownerKey, ...screenIds);
  });
}

export function parseShareCommand(input: unknown): ShareCommand {
  if (!isObject(input) || typeof input.screenId !== "string" || !SAVED_SCREEN_ID.test(input.screenId)
    || !(input.expectedId === null || (typeof input.expectedId === "string" && SHARED_SCREEN_ID.test(input.expectedId)))) {
    throw Error("invalid_share");
  }
  const { screenId, expectedId, operation, listed, revision } = input;
  if (operation === "publish" && typeof listed === "boolean" && typeof revision === "number" && Number.isSafeInteger(revision) && revision >= 0) {
    return { screenId, expectedId, operation, listed, revision };
  }
  if (operation === "visibility" && expectedId && typeof listed === "boolean") return { screenId, expectedId, operation, listed };
  if (operation === "revoke" && expectedId) return { screenId, expectedId, operation };
  throw Error("invalid_share");
}

export function changeShare(directory: string, userId: string, displayName: string | null, command: ShareCommand) {
  const ownerKey = savedScreenOwnerKey(userId);
  return withCatalog(directory, "create", null, db => db.transaction(() => {
    const saved = readSavedByOwnerKey(join(directory, "saved"), ownerKey);
    const screen = saved.screens.find(screen => screen.id === command.screenId);
    if (!screen) throw Error("screen_missing");
    if (command.operation !== "revoke" && screen.definition.universe !== "all") throw Error("private_tickers");
    const current = ownerShare(db, ownerKey, command.screenId);
    if ((current?.id ?? null) !== command.expectedId) throw Error("share_conflict");
    if (command.operation === "revoke") {
      db.prepare("DELETE FROM screener_shares WHERE owner_key = ? AND screen_id = ?").run(ownerKey, screen.id);
      return null;
    }
    if (command.operation === "visibility") {
      if (!current) throw Error("share_conflict");
      db.prepare("UPDATE screener_shares SET listed = ? WHERE id = ?").run(Number(command.listed), current.id);
      return toPreset({ ...current, listed: Number(command.listed) });
    }
    if (saved.revision !== command.revision) throw Error("share_conflict");
    const row: ShareRow = {
      id: randomUUID(), owner_key: ownerKey, screen_id: screen.id, name: screen.name,
      author: displayName?.trim().slice(0, 80) || "TraderLink member",
      definition: JSON.stringify({ ...screen.definition, tickers: [] }),
      listed: Number(command.listed), published_at: Date.now(),
    };
    db.prepare(`INSERT INTO screener_shares (id, owner_key, screen_id, name, author, definition, listed, published_at)
      VALUES (@id, @owner_key, @screen_id, @name, @author, @definition, @listed, @published_at)
      ON CONFLICT (owner_key, screen_id) DO UPDATE SET id = excluded.id, name = excluded.name, author = excluded.author,
        definition = excluded.definition, listed = excluded.listed, published_at = excluded.published_at`).run(row);
    return toPreset(row);
  }).immediate());
}
