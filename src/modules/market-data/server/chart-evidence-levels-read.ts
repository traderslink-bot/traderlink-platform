import "server-only";

import { createHash } from "node:crypto";
import type { TraderLinkPlatformRequestIdentity } from "../../platform/server/authentication/require-platform-request-scope";
import { withReadonlyPlatformDatabase } from "../../platform/server/database/open-readonly-platform-database";
import { isStockLevelsMap, type SavedStockLevelsMap } from "../../stock-levels/stock-levels-contract";

type SavedRow = {
  saved_map_id: string;
  map_json: string;
  updated_at_ms: number;
  expires_at_ms: number;
};

export type ChartLevelMapReference = Readonly<{ mapId: string; revision: string }>;

/** Server-only input to the Levels evidence projection. */
export type OwnedChartLevelMap = Readonly<{
  saved: SavedStockLevelsMap;
  reference: ChartLevelMapReference;
  publishedAt: number;
  expiresAt: number;
}>;

function parseOwnedChartLevelMap(row: SavedRow, symbol: string): OwnedChartLevelMap | undefined {
  const revision = createHash("sha256").update(JSON.stringify([
    row.saved_map_id, row.updated_at_ms, row.expires_at_ms, row.map_json,
  ])).digest("hex");
  let map: unknown;
  try { map = JSON.parse(row.map_json); }
  catch { return; }
  if (!isStockLevelsMap(map) || map.symbol !== symbol) return;
  return {
    saved: { savedMapId: row.saved_map_id, map },
    reference: { mapId: row.saved_map_id, revision },
    publishedAt: row.updated_at_ms / 1_000,
    expiresAt: row.expires_at_ms / 1_000,
  };
}

/**
 * Read one bounded owner-scoped snapshot. A market tools caller checks feature
 * admission before invoking this function with verified request identity.
 */
export function readOwnedChartLevelMap(
  identity: TraderLinkPlatformRequestIdentity,
  symbol: string,
  reference?: ChartLevelMapReference,
  now = Date.now(),
): OwnedChartLevelMap | undefined {
  if (!/^[A-Z][A-Z0-9.-]{0,9}$/u.test(symbol) || !Number.isSafeInteger(now) || now <= 0 ||
    (reference && !/^[a-f0-9]{64}$/u.test(reference.revision))) return;
  const row = withReadonlyPlatformDatabase({}, database => database.prepare<
    [string, string, number, number, string | null, string | null],
    SavedRow
  >(`SELECT saved_map_id, map_json, updated_at_ms, expires_at_ms
      FROM platform_stock_levels_saved_maps
      WHERE user_id = ? AND symbol = ? AND updated_at_ms <= ? AND expires_at_ms > ?
        AND (? IS NULL OR saved_map_id = ?)
      ORDER BY updated_at_ms DESC, saved_map_id DESC
      LIMIT 1`).get(identity.scope.userId, symbol, now, now, reference?.mapId ?? null, reference?.mapId ?? null));
  if (!row) return;
  const map = parseOwnedChartLevelMap(row, symbol);
  if (!reference || map?.reference.revision === reference.revision) return map;
}

/** Latest live candidates for one authenticated owner's bounded confirmed-break rule refresh. */
export function listRecentOwnedChartLevelMaps(identity: TraderLinkPlatformRequestIdentity, now = Date.now()): OwnedChartLevelMap[] {
  const rows = withReadonlyPlatformDatabase({}, database => database.prepare<
    [string, number, number], SavedRow & { symbol: string }
  >(`SELECT saved_map_id, symbol, map_json, updated_at_ms, expires_at_ms
      FROM platform_stock_levels_saved_maps
      WHERE user_id = ? AND updated_at_ms <= ? AND expires_at_ms > ?
      ORDER BY updated_at_ms DESC, saved_map_id DESC LIMIT 8`).all(identity.scope.userId, now, now));
  return rows.flatMap(row => parseOwnedChartLevelMap(row, row.symbol) ?? []);
}
