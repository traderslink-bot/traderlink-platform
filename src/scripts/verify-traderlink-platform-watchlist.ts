import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";

import Database from "better-sqlite3";

import { resolvePlatformDatabaseConfig } from "@/src/modules/platform/server/database/platform-database-config";
import { readAppliedPlatformMigrations } from "@/src/modules/platform/server/database/platform-migration-registry";
import { verifyCompletedPlatformDatabase } from "@/src/modules/platform/server/database/run-platform-migrations";

type CountRow = Readonly<{ count: number }>;

function count(database: Database.Database, tableName: string): number {
  return database.prepare<[], CountRow>(`SELECT COUNT(*) AS count FROM ${tableName}`)
    .get()?.count ?? -1;
}

function fail(check: string): never {
  throw new Error(`TRADERLINK_WATCHLIST_VERIFICATION_FAILED:${check}`);
}

function main(): void {
  const databasePath = resolvePlatformDatabaseConfig().databasePath;
  const database = new Database(databasePath, {
    readonly: true,
    fileMustExist: true,
    timeout: 5_000,
  });
  let evidence: Readonly<Record<string, unknown>>;
  try {
    database.pragma("foreign_keys = ON");
    database.pragma("busy_timeout = 5000");
    database.pragma("query_only = ON");
    verifyCompletedPlatformDatabase(database);
    const migrations = readAppliedPlatformMigrations(database);
    const counts = Object.freeze({
      watchlistSymbols: count(database, "live_watchlist_symbols"),
      watchlistHealth: count(database, "live_watchlist_health"),
      watchlistArchives: count(database, "live_watchlist_archives"),
      journalExecutions: count(database, "journal_executions"),
      journalRoundTrips: count(database, "journal_round_trips"),
      journalDataDecisions: count(database, "journal_data_decisions"),
      academyCompletions: count(database, "academy_lesson_completions"),
    });
    const revisionColumn = database.prepare<[], CountRow>(`SELECT COUNT(*) AS count
FROM pragma_table_info('live_watchlist_symbols')
WHERE name = 'revision' AND type = 'INTEGER' AND "notnull" = 1`).get()?.count ?? -1;
    const archiveIndex = database.prepare<[], CountRow>(`SELECT COUNT(*) AS count
FROM sqlite_schema
WHERE type = 'index'
  AND name = 'live_watchlist_archives_symbol_archived_at_idx'`).get()?.count ?? -1;
    const archiveImmutabilityTrigger = database.prepare<[], CountRow>(`SELECT COUNT(*) AS count
FROM sqlite_schema
WHERE type = 'trigger'
  AND name = 'live_watchlist_archives_no_update'`).get()?.count ?? -1;
    if (
      migrations.length !== 14 ||
      !migrations.some(
        (migration) => migration.migration_id === "0014_watchlist_storage",
      ) ||
      counts.watchlistSymbols !== 0 ||
      counts.watchlistHealth !== 0 ||
      counts.watchlistArchives !== 0 ||
      counts.journalExecutions !== 1_072 ||
      counts.journalRoundTrips !== 333 ||
      counts.journalDataDecisions !== 2 ||
      counts.academyCompletions !== 0 ||
      revisionColumn !== 1 ||
      archiveIndex !== 1 ||
      archiveImmutabilityTrigger !== 1
    ) {
      fail("database_boundary");
    }
    evidence = Object.freeze({
      status: "ok",
      identifiersRedacted: true,
      migrationCount: migrations.length,
      latestMigration: migrations.at(-1)?.migration_id,
      counts,
      schema: Object.freeze({
        revisionColumn: true,
        archiveIndex: true,
        archiveSnapshotsImmutableOnUpdate: true,
      }),
    });
  } finally {
    database.close();
  }
  process.stdout.write(`${JSON.stringify({
    ...evidence,
    database: {
      sizeBytes: statSync(databasePath).size,
      sha256: createHash("sha256").update(readFileSync(databasePath)).digest("hex"),
    },
  })}\n`);
}

main();
