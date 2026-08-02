import Database from "better-sqlite3";

import { expectedPlatformDomainTableNamesForPrefix } from "@/src/modules/platform/server/database/platform-migration-manifest";
import { platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";
import { verifyTraderLinkPlatformDatabase } from "@/src/scripts/verify-traderlink-platform-database";

const PRE_E4_MIGRATION_COUNT = 9;
const E4_TABLES = Object.freeze([
  "level_analysis_deliveries",
  "level_analysis_delivery_symbol_facts",
  "journal_round_trip_level_analysis_links",
  "journal_round_trip_level_analysis_link_versions",
]);

function main(): void {
  const currentPath = process.env.TRADERLINK_PLATFORM_DB_PATH;
  const baselinePath = process.env.TRADERLINK_PLATFORM_LEVEL_ANALYSIS_BASELINE_PATH;
  if (!currentPath || !baselinePath) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
      field: "levelAnalysisVerificationPaths",
    });
  }
  const baseline = verifyTraderLinkPlatformDatabase({
    databasePath: baselinePath,
    profile: { kind: "manifest_prefix", migrationCount: PRE_E4_MIGRATION_COUNT },
  });
  const current = verifyTraderLinkPlatformDatabase({
    databasePath: currentPath,
    profile: { kind: "current" },
  });
  const priorTables = expectedPlatformDomainTableNamesForPrefix(PRE_E4_MIGRATION_COUNT);
  for (const table of priorTables) {
    if (baseline.tableCounts[table] !== current.tableCounts[table]) {
      platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", {
        field: "levelAnalysisPriorTableCounts",
      });
    }
  }
  for (const table of E4_TABLES) {
    if (current.tableCounts[table] !== 0) {
      platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", {
        field: "levelAnalysisEmptyTables",
      });
    }
  }

  const database = new Database(currentPath, { readonly: true, fileMustExist: true });
  let eligibleStockRoundTrips: number;
  try {
    eligibleStockRoundTrips = database.prepare<[], { count: number }>(`
SELECT COUNT(*) AS count
FROM journal_round_trips round_trip
JOIN journal_round_trip_versions version
  ON version.workspace_id = round_trip.workspace_id
 AND version.account_id = round_trip.account_id
 AND version.round_trip_id = round_trip.round_trip_id
 AND version.round_trip_version_id = round_trip.current_version_id
JOIN journal_instruments instrument
  ON instrument.workspace_id = version.workspace_id
 AND instrument.instrument_id = version.instrument_id
WHERE round_trip.lifecycle_state = 'active'
  AND version.projection_state = 'ready_closed'
  AND instrument.asset_class = 'stock'`).get()?.count ?? -1;
    if (eligibleStockRoundTrips < 0) {
      platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", {
        field: "eligibleStockRoundTrips",
      });
    }
  } finally {
    database.close();
  }

  process.stdout.write(`${JSON.stringify({
    status: "ok",
    baselineMigrationCount: baseline.migrationRows.length,
    currentMigrationCount: current.migrationRows.length,
    priorDomainTableCount: priorTables.length,
    currentDomainTableCount: Object.keys(current.tableCounts).length,
    e4TableCounts: Object.fromEntries(E4_TABLES.map((table) => [table, current.tableCounts[table]])),
    eligibleStockRoundTrips,
    baselineFileSha256: baseline.fileSha256,
    currentFileSha256: current.fileSha256,
    currentSchemaSha256: current.actualSchemaSha256,
    integrity: current.integrity,
  })}\n`);
}

main();
