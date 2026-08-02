import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync } from "node:fs";

import Database from "better-sqlite3";

import { narrowWorkspaceAccessToAccount } from "../modules/platform/contracts/workspace-access-scope";
import { deriveAllDevelopmentOwnerJournalScopes } from "../modules/journal/server/accounts/journal-development-owner-scope";
import { CandleReviewRepository } from "../modules/level-analysis/server/candle-review-repository";
import { resolvePlatformDatabaseConfig } from "../modules/platform/server/database/platform-database-config";
import {
  expectedPlatformDomainTableNamesForPrefix,
  platformMigrationManifest,
} from "../modules/platform/server/database/platform-migration-manifest";
import { verifyPlatformDatabaseConnectionPragmas } from "../modules/platform/server/database/open-platform-database";
import { verifyCompletedPlatformDatabase } from "../modules/platform/server/database/run-platform-migrations";

function fail(check: string): never {
  throw new Error(`TRADERLINK_CANDLE_REVIEW_VERIFICATION_FAILED:${check}`);
}

function fileSha256(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function count(database: Database.Database, table: string): number {
  const row = database.prepare(`SELECT COUNT(*) AS count FROM "${table}"`).get() as {
    count: number;
  };
  return row.count;
}

function requireNoPendingWal(path: string): void {
  if (existsSync(`${path}-wal`) && statSync(`${path}-wal`).size !== 0) {
    fail("pending_wal");
  }
}

function configureReadonly(database: Database.Database): void {
  database.pragma("foreign_keys = ON");
  database.pragma("busy_timeout = 5000");
  database.pragma("query_only = ON");
}

function main(): void {
  const databasePath = resolvePlatformDatabaseConfig({ environment: process.env }).databasePath;
  const referencePath = process.env.TRADERLINK_PLATFORM_CANDLE_REVIEW_PREFIX_REFERENCE_PATH;
  requireNoPendingWal(databasePath);
  const initialSize = statSync(databasePath).size;
  const initialHash = fileSha256(databasePath);
  const database = new Database(databasePath, { readonly: true, fileMustExist: true });
  let reference: Database.Database | null = null;
  try {
    configureReadonly(database);
    verifyCompletedPlatformDatabase(database);
    verifyPlatformDatabaseConnectionPragmas(database);
    if ((database.pragma("foreign_key_check") as readonly unknown[]).length !== 0) {
      fail("foreign_key_check");
    }
    if (database.pragma("quick_check", { simple: true }) !== "ok") fail("quick_check");

    let prefixCountsMatch: boolean | null = null;
    if (referencePath) {
      reference = new Database(referencePath, { readonly: true, fileMustExist: true });
      configureReadonly(reference);
      verifyCompletedPlatformDatabase(reference, platformMigrationManifest.slice(0, 8));
      const prefixTables = expectedPlatformDomainTableNamesForPrefix(8);
      prefixCountsMatch = prefixTables.every((table) =>
        count(reference!, table) === count(database, table));
      if (!prefixCountsMatch) fail("prefix_table_counts_changed");
    }

    const owners = deriveAllDevelopmentOwnerJournalScopes(database);
    let readyClosed = 0;
    let eligibleTargets = 0;
    const repository = new CandleReviewRepository(database);
    for (const owner of owners) {
      const accountScope = narrowWorkspaceAccessToAccount(owner.scope, owner.accountId);
      const rows = database.prepare<[string, string], { round_trip_id: string }>(`
SELECT round_trip_id FROM journal_round_trips
WHERE workspace_id = ? AND account_id = ? AND lifecycle_state = 'active'
ORDER BY round_trip_id`).all(owner.scope.workspaceId, owner.accountId);
      for (const row of rows) {
        const target = repository.findTarget(accountScope, row.round_trip_id);
        if (target) {
          readyClosed += 1;
          if (target.assetClass === "stock") eligibleTargets += 1;
        }
      }
    }
    const newTableCounts = Object.freeze({
      requests: count(database, "level_analysis_market_data_requests"),
      candleSets: count(database, "level_analysis_normalized_candle_sets"),
      candles: count(database, "level_analysis_normalized_candles"),
      reviews: count(database, "journal_round_trip_candle_reviews"),
      reviewVersions: count(database, "journal_round_trip_candle_review_versions"),
    });
    if (
      process.env.TRADERLINK_PLATFORM_CANDLE_REVIEW_EXPECT_EMPTY === "1" &&
      Object.values(newTableCounts).some((value) => value !== 0)
    ) fail("new_tables_not_empty");

    database.close();
    reference?.close();
    reference = null;
    requireNoPendingWal(databasePath);
    const finalSize = statSync(databasePath).size;
    const finalHash = fileSha256(databasePath);
    if (initialSize !== finalSize || initialHash !== finalHash) fail("database_changed");
    process.stdout.write(`${JSON.stringify({
      status: "ok",
      identifiersRedacted: true,
      database: Object.freeze({ sizeBytes: finalSize, sha256: finalHash, state: "unchanged" }),
      migrationCount: platformMigrationManifest.length,
      prefixCountsMatch,
      accountCount: owners.length,
      readyClosedTargets: readyClosed,
      eligibleStockTargets: eligibleTargets,
      newTableCounts,
      providerRequestsMade: 0,
    })}\n`);
  } finally {
    if (database.open) database.close();
    if (reference?.open) reference.close();
  }
}

main();
