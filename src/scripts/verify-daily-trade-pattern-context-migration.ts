import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import Database from "better-sqlite3";

import { loadTraderLinkPlatformLocalDevelopmentConfiguration } from "@/src/modules/platform/server/authentication/local-development-configuration";
import { platformMigrationManifest } from "@/src/modules/platform/server/database/platform-migration-manifest";
import { runPlatformMigrations } from "@/src/modules/platform/server/database/run-platform-migrations";

const TABLES = Object.freeze([
  "journal_round_trip_daily_trade_analysis_versions",
  "journal_round_trip_daily_trade_analysis_event_snapshots",
  "journal_round_trip_daily_trade_analysis_post_exit_paths",
  "journal_round_trip_daily_trade_analysis_path_summaries",
  "journal_round_trip_daily_trade_analysis_profit_opportunities",
] as const);

function rowCounts(database: Database.Database): Readonly<Record<string, number>> {
  return Object.freeze(Object.fromEntries(TABLES.map((table) => [
    table,
    database.prepare<[], { count: number }>(`SELECT COUNT(*) AS count FROM ${table}`).get()!.count,
  ])));
}

async function main(): Promise<void> {
  const configuration = loadTraderLinkPlatformLocalDevelopmentConfiguration({ repositoryRoot: process.cwd() });
  const temporaryRoot = mkdtempSync(join(tmpdir(), "traderlink-pattern-context-v2-"));
  const copyPath = join(temporaryRoot, "migration-check.sqlite");
  const source = new Database(configuration.databasePath, { fileMustExist: true, readonly: true });
  try {
    await source.backup(copyPath);
  } finally {
    source.close();
  }

  try {
    const copy = new Database(copyPath, { fileMustExist: true });
    try {
      copy.pragma("foreign_keys = ON");
      const before = rowCounts(copy);
      const result = runPlatformMigrations(copy, { manifest: platformMigrationManifest });
      const after = rowCounts(copy);
      const foreignKeyFailures = copy.pragma("foreign_key_check") as unknown[];
      const versionTable = copy.prepare<[string], { sql: string }>(
        "SELECT sql FROM sqlite_schema WHERE type = 'table' AND name = ?",
      ).get("journal_round_trip_daily_trade_analysis_versions");
      const countsMatch = TABLES.every((table) => before[table] === after[table]);
      const acceptsV2 = versionTable?.sql.includes("daily_trade_analyzer_v2") === true;
      process.stdout.write(`${JSON.stringify({
        acceptsV2,
        appliedThisRun: result.appliedMigrationIds,
        countsMatch,
        foreignKeyFailures: foreignKeyFailures.length,
      })}\n`);
      if (!acceptsV2 || !countsMatch || foreignKeyFailures.length > 0 ||
          result.appliedMigrationIds.at(-1) !== "0042_daily_trade_pattern_context_v2") {
        process.exitCode = 1;
      }
    } finally {
      copy.close();
    }
  } finally {
    rmSync(temporaryRoot, { force: true, recursive: true });
  }
}

void main();
