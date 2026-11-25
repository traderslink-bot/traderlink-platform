import "server-only";

import { randomUUID } from "node:crypto";
import { closeSync, constants, fsyncSync, fstatSync, openSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { resolvePlatformDatabaseConfig } from "@/src/modules/platform/server/database/platform-database-config";
import { DEFAULT_WORKSPACE_MARKET_SETTINGS, parseWorkspaceMarketSettings, type WorkspaceMarketSettings } from "../workspace-market-settings";

function settingsPath(environment: NodeJS.ProcessEnv): string {
  return `${resolvePlatformDatabaseConfig({ environment }).databasePath}.trading-workspace.json`;
}

export function readWorkspaceMarketSettings(environment: NodeJS.ProcessEnv = process.env): WorkspaceMarketSettings {
  let file: number;
  try {
    file = openSync(settingsPath(environment), constants.O_RDONLY | constants.O_NOFOLLOW);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return DEFAULT_WORKSPACE_MARKET_SETTINGS;
    throw error;
  }
  try {
    const stat = fstatSync(file);
    if (!stat.isFile() || stat.size > 4096) throw Error("invalid_workspace_settings");
    const saved = parseWorkspaceMarketSettings(JSON.parse(readFileSync(file, "utf8")));
    if (saved.revision < 1) throw Error("invalid_workspace_settings");
    return saved;
  } finally {
    closeSync(file);
  }
}

/** The hosted app has one writer. A synchronous revision check and replace serialize these small admin changes. */
export function saveWorkspaceMarketSettings(input: unknown, environment: NodeJS.ProcessEnv = process.env): WorkspaceMarketSettings {
  const requested = parseWorkspaceMarketSettings(input);
  const current = readWorkspaceMarketSettings(environment);
  if (requested.revision !== current.revision) throw Error("workspace_settings_conflict");
  const next = parseWorkspaceMarketSettings({ ...requested, revision: current.revision + 1 });
  const path = settingsPath(environment);
  const pending = `${path}.${randomUUID()}.tmp`;
  const file = openSync(pending, "wx", 0o600);
  try {
    try {
      writeFileSync(file, `${JSON.stringify(next)}\n`, "utf8");
      fsyncSync(file);
    } finally {
      closeSync(file);
    }
    renameSync(pending, path);
    const directory = openSync(dirname(path), constants.O_RDONLY | constants.O_DIRECTORY);
    try {
      fsyncSync(directory);
    } finally {
      closeSync(directory);
    }
  } finally {
    rmSync(pending, { force: true });
  }
  return next;
}
