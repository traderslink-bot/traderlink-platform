import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import Database from "better-sqlite3";

import { loadTraderLinkPlatformLocalDevelopmentConfiguration } from
  "@/src/modules/platform/server/authentication/local-development-configuration";
import { platformMigrationManifest } from
  "@/src/modules/platform/server/database/platform-migration-manifest";
import { runPlatformMigrations } from
  "@/src/modules/platform/server/database/run-platform-migrations";

const SETTINGS_TABLE = "coach_ai_review_account_settings_v2";
const REVISIONS_TABLE = "coach_ai_review_account_setting_revisions_v2";

function count(database: Database.Database, table: string): number {
  return database.prepare<[], { count: number }>(
    `SELECT COUNT(*) AS count FROM ${table}`,
  ).get()!.count;
}

function hasTimingColumn(database: Database.Database, table: string): boolean {
  const columns = database.pragma(`table_info(${table})`) as readonly Readonly<{
    name: string;
  }>[];
  return columns.some((column) => column.name === "review_timing_mode");
}

async function main(): Promise<void> {
  const configuration = loadTraderLinkPlatformLocalDevelopmentConfiguration({
    repositoryRoot: process.cwd(),
  });
  const temporaryRoot = mkdtempSync(join(tmpdir(), "traderlink-ai-review-timing-"));
  const copyPath = join(temporaryRoot, "migration-check.sqlite");
  const source = new Database(configuration.databasePath, {
    fileMustExist: true,
    readonly: true,
  });
  try {
    await source.backup(copyPath);
  } finally {
    source.close();
  }

  try {
    const copy = new Database(copyPath, { fileMustExist: true });
    try {
      copy.pragma("foreign_keys = ON");
      const before = Object.freeze({
        settings: count(copy, SETTINGS_TABLE),
        revisions: count(copy, REVISIONS_TABLE),
      });
      const schemaAlreadyCurrent = hasTimingColumn(copy, SETTINGS_TABLE) &&
        hasTimingColumn(copy, REVISIONS_TABLE);
      const result = runPlatformMigrations(copy, { manifest: platformMigrationManifest });
      const after = Object.freeze({
        settings: count(copy, SETTINGS_TABLE),
        revisions: count(copy, REVISIONS_TABLE),
      });
      const invalidModes = copy.prepare<[], { count: number }>(`SELECT COUNT(*) AS count
FROM ${SETTINGS_TABLE}
WHERE review_timing_mode NOT IN ('automatic_after_12_hours', 'wait_for_tracker_input')`)
        .get()!.count;
      const foreignKeyFailures = copy.pragma("foreign_key_check") as unknown[];
      const migrationStateValid = schemaAlreadyCurrent
        ? result.appliedMigrationIds.length === 0
        : result.appliedMigrationIds.length === 1 &&
          result.appliedMigrationIds[0] === "0043_coach_ai_review_timing_modes";
      const valid = migrationStateValid &&
        before.settings === after.settings && before.revisions === after.revisions &&
        hasTimingColumn(copy, SETTINGS_TABLE) && hasTimingColumn(copy, REVISIONS_TABLE) &&
        invalidModes === 0 && foreignKeyFailures.length === 0;
      process.stdout.write(`${JSON.stringify({
        appliedThisRun: result.appliedMigrationIds,
        schemaAlreadyCurrent,
        countsPreserved: before.settings === after.settings && before.revisions === after.revisions,
        foreignKeyFailures: foreignKeyFailures.length,
        invalidModes,
        valid,
      })}\n`);
      if (!valid) process.exitCode = 1;
    } finally {
      copy.close();
    }
  } finally {
    rmSync(temporaryRoot, { force: true, recursive: true });
  }
}

void main();
