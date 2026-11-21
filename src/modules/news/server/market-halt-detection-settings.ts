import "server-only";
import { constants, openSync, closeSync, fstatSync, readFileSync, lstatSync } from "node:fs";
import { mkdir, open, rename, unlink } from "node:fs/promises";
import { dirname, join } from "node:path";
import { randomUUID } from "node:crypto";
import { resolvePlatformDatabaseConfig } from "../../platform/server/database/platform-database-config";

export type MarketHaltDetectionSettings = Readonly<{
  enabled: boolean; source: "alpaca" | "official"; revision: number; updatedAt: number;
}>;
export function marketHaltSettingsDirectory(environment: NodeJS.ProcessEnv = process.env): string {
  return join(dirname(resolvePlatformDatabaseConfig({ environment }).databasePath), "market-halt-detection-v1");
}
function valid(value: unknown): value is MarketHaltDetectionSettings {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const row = value as MarketHaltDetectionSettings;
  return typeof row.enabled === "boolean" && ["alpaca", "official"].includes(row.source)
    && Number.isSafeInteger(row.revision) && row.revision >= 0
    && Number.isSafeInteger(row.updatedAt) && row.updatedAt >= 0;
}
export function readMarketHaltDetectionSettings(
  environment: NodeJS.ProcessEnv = process.env, directory = marketHaltSettingsDirectory(environment),
): MarketHaltDetectionSettings {
  let fd: number;
  try {
    const folder = lstatSync(directory);
    if (!folder.isDirectory() || folder.isSymbolicLink()) throw Error("halt_settings_unavailable");
    fd = openSync(join(directory, "detection.json"), constants.O_RDONLY | constants.O_NOFOLLOW);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    // Preserve the installed method until the owner explicitly saves a change.
    return { enabled: environment.TRADERLINK_MARKET_HALT_DETECTION_ENABLED !== "false", source: "official", revision: 0, updatedAt: 0 };
  }
  try {
    const stat = fstatSync(fd);
    if (!stat.isFile() || stat.size > 2048) throw Error("halt_settings_unavailable");
    const value: unknown = JSON.parse(readFileSync(fd, "utf8"));
    if (!valid(value)) throw Error("halt_settings_unavailable");
    return Object.freeze(value);
  } finally { closeSync(fd); }
}
const state = globalThis as typeof globalThis & { traderlinkHaltSettingsWrites?: Set<string> };
const writes = state.traderlinkHaltSettingsWrites ??= new Set<string>();
export async function saveMarketHaltDetectionSettings(
  input: Pick<MarketHaltDetectionSettings, "enabled" | "source" | "revision">,
  environment: NodeJS.ProcessEnv = process.env, directory = marketHaltSettingsDirectory(environment), now = Date.now(),
): Promise<MarketHaltDetectionSettings> {
  if (!valid({ ...input, updatedAt: now }) || input.revision >= Number.MAX_SAFE_INTEGER || now <= 0) throw Error("invalid_halt_settings");
  if (writes.has(directory)) throw Error("halt_settings_conflict");
  writes.add(directory);
  let temporary: string | undefined;
  try {
    const current = readMarketHaltDetectionSettings(environment, directory);
    if (current.revision !== input.revision) throw Error("halt_settings_conflict");
    if (current.source === input.source && current.enabled === input.enabled) return current;
    await mkdir(directory, { recursive: true, mode: 0o700 });
    const folder = lstatSync(directory);
    if (!folder.isDirectory() || folder.isSymbolicLink()) throw Error("halt_settings_unavailable");
    const next = { enabled: input.enabled, source: input.source, revision: current.revision + 1, updatedAt: Math.max(now, current.updatedAt + 1) };
    temporary = join(directory, `detection.${randomUUID()}.tmp`);
    const file = await open(temporary, "wx", 0o600);
    try { await file.writeFile(JSON.stringify(next) + "\n"); await file.sync(); } finally { await file.close(); }
    await rename(temporary, join(directory, "detection.json"));
    const handle = await open(directory, constants.O_RDONLY | constants.O_DIRECTORY);
    try { await handle.sync(); } finally { await handle.close(); }
    return Object.freeze(next);
  } finally {
    if (temporary) await unlink(temporary).catch(() => {});
    writes.delete(directory);
  }
}
