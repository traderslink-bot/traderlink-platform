import "server-only";

import { openPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { createCanonicalUuidV4 } from "@/src/modules/platform/server/database/platform-migration-contract";
import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import {
  isStockLevelsMap,
  type SavedStockLevelsMap,
  type StockLevelsMap,
  type StockLevelsQuotaFeedback,
  type StockLevelsResult,
} from "../stock-levels-contract";
import { recordStockLevelsActivity } from "./stock-levels-admin-activity-service";
import { requestStockLevels } from "./stock-levels-runtime-client";
import { stockLevelsNewYorkDate } from "./stock-levels-time";

const HOUR_MS = 60 * 60 * 1000;
const MAX_FRESH_REQUESTS_PER_HOUR = 5;
const MAX_FRESH_REQUESTS_PER_NEW_YORK_DAY = 15;
const SAVED_MAP_RETENTION_MS = 72 * HOUR_MS;

function symbolFrom(input: unknown): string | null {
  const symbol = typeof input === "string" ? input.trim().toUpperCase() : "";
  return /^[A-Z][A-Z0-9.-]{0,9}$/u.test(symbol) ? symbol : null;
}

function nextNewYorkDay(timestamp: number): number {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date(timestamp));
  const value = (kind: string) => Number(parts.find((part) => part.type === kind)?.value ?? 0);
  const nextUtcGuess = Date.UTC(value("year"), value("month") - 1, value("day") + 1, 5);
  return nextUtcGuess;
}

function quota(scope: WorkspaceAccessScope, now: number) {
  const database = openPlatformDatabase({ mode: "runtime" });
  try {
    return readQuota(database, scope, now);
  } finally { database.close(); }
}

function readQuota(database: ReturnType<typeof openPlatformDatabase>, scope: WorkspaceAccessScope, now: number) {
  const hourly = database.prepare<[string, number], { count: number }>("SELECT COUNT(*) AS count FROM platform_stock_levels_usage WHERE user_id = ? AND requested_at_ms > ?").get(scope.userId, now - HOUR_MS)?.count ?? 0;
  const day = database.prepare<[string, string], { count: number }>("SELECT COUNT(*) AS count FROM platform_stock_levels_usage WHERE user_id = ? AND new_york_date = ?").get(scope.userId, stockLevelsNewYorkDate(now))?.count ?? 0;
  return { hourly, day };
}

function feedback(
  scope: WorkspaceAccessScope,
  now: number,
  noRequestLimit: boolean,
): StockLevelsQuotaFeedback {
  if (noRequestLimit) {
    return { remainingHourly: null, remainingNewYorkDay: null, resetAt: null };
  }
  const used = quota(scope, now);
  return { remainingHourly: Math.max(0, MAX_FRESH_REQUESTS_PER_HOUR - used.hourly), remainingNewYorkDay: Math.max(0, MAX_FRESH_REQUESTS_PER_NEW_YORK_DAY - used.day), resetAt: Math.min(now + HOUR_MS, nextNewYorkDay(now)) };
}

export function getStockLevelsQuotaFeedback(
  scope: WorkspaceAccessScope,
  noRequestLimit: boolean,
  now = Date.now(),
): StockLevelsQuotaFeedback {
  return feedback(scope, now, noRequestLimit);
}

type SavedMapRow = Readonly<{
  saved_map_id: string;
  map_json: string;
}>;

function savedMapFromRow(row: SavedMapRow): SavedStockLevelsMap | null {
  try {
    const map: unknown = JSON.parse(row.map_json);
    return isStockLevelsMap(map)
      ? Object.freeze({ savedMapId: row.saved_map_id, map })
      : null;
  } catch {
    return null;
  }
}

function pruneExpiredSavedMaps(
  database: ReturnType<typeof openPlatformDatabase>,
  scope: WorkspaceAccessScope,
  now: number,
): void {
  database.prepare("DELETE FROM platform_stock_levels_saved_maps WHERE user_id = ? AND expires_at_ms <= ?")
    .run(scope.userId, now);
}

function savedMapExists(
  database: ReturnType<typeof openPlatformDatabase>,
  scope: WorkspaceAccessScope,
  savedMapId: string,
  symbol: string,
  now: number,
): boolean {
  return database.prepare<[string, string, string, number], Readonly<{ matches: 0 | 1 }>>(
    `SELECT EXISTS(
      SELECT 1
      FROM platform_stock_levels_saved_maps
      WHERE saved_map_id = ? AND user_id = ? AND symbol = ? AND expires_at_ms > ?
    ) AS matches`,
  ).get(savedMapId, scope.userId, symbol, now)?.matches === 1;
}

function saveMap(
  database: ReturnType<typeof openPlatformDatabase>,
  scope: WorkspaceAccessScope,
  map: StockLevelsMap,
  now: number,
  replaceSavedMapId: string | null,
): SavedStockLevelsMap | null {
  const mapJson = JSON.stringify(map);
  const expiresAt = now + SAVED_MAP_RETENTION_MS;
  if (replaceSavedMapId) {
    const changed = database.prepare(
      `UPDATE platform_stock_levels_saved_maps
       SET symbol = ?, map_json = ?, updated_at_ms = ?, expires_at_ms = ?
       WHERE saved_map_id = ? AND user_id = ? AND expires_at_ms > ?`,
    ).run(map.symbol, mapJson, now, expiresAt, replaceSavedMapId, scope.userId, now).changes;
    return changed === 1 ? Object.freeze({ savedMapId: replaceSavedMapId, map }) : null;
  }
  const savedMapId = createCanonicalUuidV4();
  database.prepare(
    `INSERT INTO platform_stock_levels_saved_maps
      (saved_map_id, user_id, symbol, map_json, saved_at_ms, updated_at_ms, expires_at_ms)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(savedMapId, scope.userId, map.symbol, mapJson, now, now, expiresAt);
  return Object.freeze({ savedMapId, map });
}

export function listSavedStockLevelsMaps(
  scope: WorkspaceAccessScope,
  now = Date.now(),
): readonly SavedStockLevelsMap[] {
  const database = openPlatformDatabase({ mode: "runtime" });
  try {
    const transaction = database.transaction(() => {
      pruneExpiredSavedMaps(database, scope, now);
      return database.prepare<[string, number], SavedMapRow>(
        `SELECT saved_map_id, map_json
         FROM platform_stock_levels_saved_maps
         WHERE user_id = ? AND expires_at_ms > ?
         ORDER BY updated_at_ms DESC, saved_map_id DESC`,
      ).all(scope.userId, now);
    });
    return Object.freeze(transaction().flatMap((row) => {
      const savedMap = savedMapFromRow(row);
      return savedMap ? [savedMap] : [];
    }));
  } finally { database.close(); }
}

export function deleteSavedStockLevelsMap(
  scope: WorkspaceAccessScope,
  savedMapId: string,
): boolean {
  const database = openPlatformDatabase({ mode: "runtime" });
  try {
    return database.prepare(
      "DELETE FROM platform_stock_levels_saved_maps WHERE saved_map_id = ? AND user_id = ?",
    ).run(savedMapId, scope.userId).changes === 1;
  } finally { database.close(); }
}

type SavedMapPersistenceResult =
  | Readonly<{ state: "ready"; savedMap: SavedStockLevelsMap }>
  | Readonly<{ state: "limit_reached" }>
  | Readonly<{ state: "saved_map_unavailable" }>;

class SavedMapPersistenceFailure extends Error {
  readonly state: Exclude<SavedMapPersistenceResult["state"], "ready">;

  constructor(state: Exclude<SavedMapPersistenceResult["state"], "ready">) {
    super(state);
    this.state = state;
  }
}

function recordCalculationAndSaveMap(
  scope: WorkspaceAccessScope,
  map: StockLevelsMap,
  now: number,
  replaceSavedMapId: string | null,
  noRequestLimit: boolean,
): SavedMapPersistenceResult {
  const database = openPlatformDatabase({ mode: "runtime" });
  try {
    const transaction = database.transaction(() => {
      pruneExpiredSavedMaps(database, scope, now);
      if (map.cacheStatus === "fresh" && !noRequestLimit) {
        const used = readQuota(database, scope, now);
        if (used.hourly >= MAX_FRESH_REQUESTS_PER_HOUR || used.day >= MAX_FRESH_REQUESTS_PER_NEW_YORK_DAY) {
          throw new SavedMapPersistenceFailure("limit_reached");
        }
        database.prepare("INSERT INTO platform_stock_levels_usage (user_id, symbol, requested_at_ms, new_york_date) VALUES (?, ?, ?, ?)")
          .run(scope.userId, map.symbol, now, stockLevelsNewYorkDate(now));
      }
      const savedMap = saveMap(database, scope, map, now, replaceSavedMapId);
      if (!savedMap) throw new SavedMapPersistenceFailure("saved_map_unavailable");
      recordStockLevelsActivity(database, {
        userId: scope.userId,
        generatedAtMs: now,
      });
      return Object.freeze({ state: "ready" as const, savedMap });
    });
    return transaction();
  } catch (error) {
    if (error instanceof SavedMapPersistenceFailure) {
      return error.state === "limit_reached"
        ? Object.freeze({ state: "limit_reached" as const })
        : Object.freeze({ state: "saved_map_unavailable" as const });
    }
    throw error;
  } finally { database.close(); }
}

export async function getStockLevels(
  scope: WorkspaceAccessScope,
  input: unknown,
  {
    noRequestLimit = false,
    replaceSavedMapId = null,
  }: Readonly<{ noRequestLimit?: boolean; replaceSavedMapId?: string | null }> = {},
): Promise<StockLevelsResult> {
  const now = Date.now();
  const feedbackBefore = feedback(scope, now, noRequestLimit);
  const symbol = symbolFrom(input);
  if (!symbol) return { state: "unavailable", code: "invalid_symbol", message: "Enter a valid ticker.", ...feedbackBefore };
  if (replaceSavedMapId) {
    const database = openPlatformDatabase({ mode: "runtime" });
    try {
      pruneExpiredSavedMaps(database, scope, now);
      if (!savedMapExists(database, scope, replaceSavedMapId, symbol, now)) {
        return { state: "unavailable", code: "saved_map_unavailable", message: "This saved map is unavailable.", ...feedbackBefore };
      }
    } finally { database.close(); }
  }
  if (!noRequestLimit && (feedbackBefore.remainingHourly === 0 || feedbackBefore.remainingNewYorkDay === 0)) return { state: "unavailable", code: "limit_reached", message: "The Stock Levels request limit has been reached. Use the reset time shown here.", ...feedbackBefore };
  const runtimeReply = await requestStockLevels(symbol);
  if (!runtimeReply) return { state: "unavailable", code: "runtime_unavailable", message: "A reliable Stock Levels map is unavailable right now. Try again later.", ...feedbackBefore };
  if (!("map" in runtimeReply)) {
    return runtimeReply.code === "unsupported_equity" ||
      runtimeReply.code === "reference_price_unavailable" ||
      runtimeReply.code === "market_data_unavailable"
      ? { state: "unavailable", code: "market_data_unavailable", message: "Data is not available for this ticker right now, try again later.", ...feedbackBefore }
      : { state: "unavailable", code: runtimeReply.code, message: runtimeReply.message, ...feedbackBefore };
  }
  const { map } = runtimeReply;
  const persisted = recordCalculationAndSaveMap(scope, map, now, replaceSavedMapId, noRequestLimit);
  if (persisted.state === "limit_reached") {
    const feedbackAfterLimit = feedback(scope, now, noRequestLimit);
    return { state: "unavailable", code: "limit_reached", message: "The Stock Levels request limit has been reached. Use the reset time shown here.", ...feedbackAfterLimit };
  }
  if (persisted.state === "saved_map_unavailable") {
    return { state: "unavailable", code: "saved_map_unavailable", message: "This saved map is unavailable.", ...feedback(scope, now, noRequestLimit) };
  }
  return { state: "ready", map, savedMap: persisted.savedMap, ...feedback(scope, now, noRequestLimit) };
}
