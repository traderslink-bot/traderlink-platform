import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";

import Database from "better-sqlite3";

import { resolvePlatformDatabaseConfig } from "@/src/modules/platform/server/database/platform-database-config";
import { platformMigrationManifest } from "@/src/modules/platform/server/database/platform-migration-manifest";
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
  const before = Object.freeze({
    sizeBytes: statSync(databasePath).size,
    sha256: createHash("sha256").update(readFileSync(databasePath)).digest("hex"),
  });
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
      migrations.length !== platformMigrationManifest.length ||
      !migrations.some(
        (migration) => migration.migration_id === "0014_watchlist_storage",
      ) ||
      counts.watchlistSymbols < 0 ||
      counts.watchlistHealth < 0 ||
      counts.watchlistArchives < 0 ||
      revisionColumn !== 1 ||
      archiveIndex !== 1 ||
      archiveImmutabilityTrigger !== 1 ||
      (database.pragma("foreign_key_check") as unknown[]).length !== 0 ||
      database.pragma("quick_check", { simple: true }) !== "ok"
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
  const after = Object.freeze({
    sizeBytes: statSync(databasePath).size,
    sha256: createHash("sha256").update(readFileSync(databasePath)).digest("hex"),
  });
  if (before.sizeBytes !== after.sizeBytes || before.sha256 !== after.sha256) {
    fail("database_changed");
  }
  process.stdout.write(`${JSON.stringify({
    ...evidence,
    database: { ...after, state: "unchanged" },
  })}\n`);
}

main();
