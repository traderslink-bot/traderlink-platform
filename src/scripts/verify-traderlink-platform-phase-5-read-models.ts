import { createHash } from "node:crypto";
import { existsSync, lstatSync, readFileSync, statSync } from "node:fs";

import Database from "better-sqlite3";

import { narrowWorkspaceAccessToAccount } from "../modules/platform/contracts/workspace-access-scope";
import { JournalDashboardReadModelService } from "../modules/journal-analytics/server/journal-dashboard-read-model-service";
import { deriveAllDevelopmentOwnerJournalScopes } from "../modules/journal/server/accounts/journal-development-owner-scope";
import { JournalAnalyticsFactSetRepository } from "../modules/journal/server/analytics/journal-analytics-fact-set-repository";
import { JournalAnalyticsFactSetService } from "../modules/journal/server/analytics/journal-analytics-fact-set-service";
import { JournalProductReadService } from "../modules/journal/server/product/journal-product-read-service";
import { resolvePlatformDatabaseConfig } from "../modules/platform/server/database/platform-database-config";
import { verifyPlatformDatabaseConnectionPragmas } from "../modules/platform/server/database/open-platform-database";
import { verifyCompletedPlatformDatabase } from "../modules/platform/server/database/run-platform-migrations";

function fail(check: string): never {
  throw new Error(`TRADERLINK_PHASE_5_READ_MODEL_VERIFICATION_FAILED:${check}`);
}

function fileSha256(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function digest(value: unknown): string {
  return createHash("sha256")
    .update(JSON.stringify(value), "utf8")
    .digest("hex");
}

function requireNoPendingWal(path: string): void {
  const walPath = `${path}-wal`;
  if (!existsSync(walPath)) return;
  const evidence = lstatSync(walPath);
  if (!evidence.isFile() || evidence.isSymbolicLink() || evidence.size !== 0) {
    fail("database_pending_wal");
  }
}

function main(): void {
  const databasePath = resolvePlatformDatabaseConfig({
    environment: process.env,
  }).databasePath;
  requireNoPendingWal(databasePath);
  const initialSize = statSync(databasePath).size;
  const initialSha256 = fileSha256(databasePath);
  const database = new Database(databasePath, {
    readonly: true,
    fileMustExist: true,
    timeout: 5_000,
  });
  try {
    database.pragma("foreign_keys = ON");
    database.pragma("busy_timeout = 5000");
    database.pragma("query_only = ON");
    verifyCompletedPlatformDatabase(database);
    verifyPlatformDatabaseConnectionPragmas(database);

    const facts = new JournalAnalyticsFactSetService(
      new JournalAnalyticsFactSetRepository(database),
    );
    const service = new JournalDashboardReadModelService(facts);
    const product = new JournalProductReadService(database);
    const totals = {
      calendarDays: 0,
      tickerGroups: 0,
      readyClosed: 0,
      legitimateOpen: 0,
      needsDecision: 0,
      latestDayExecutions: 0,
      latestDayDecisionActivity: 0,
      latestDayPositionSnapshots: 0,
      pendingDataDecisions: 0,
      resolvedDataDecisions: 0,
    };
    const accountDigests: unknown[] = [];
    const owners = deriveAllDevelopmentOwnerJournalScopes(database);
    for (const owner of owners) {
      const calendar = service.getCalendar(owner.scope, {
        currency: null,
        startDate: null,
        endDate: null,
        symbol: null,
        direction: null,
        performance: null,
        pnlBand: null,
        tradeCountBand: null,
        session: null,
      });
      const ticker = service.getTickerHistory(owner.scope);
      const open = service.getOpenPositions(owner.scope);
      const day = service.getTradingDay(owner.scope, {
        requestedDate: calendar.activeDate,
        currency: calendar.currency,
      });
      const dataDecisions = product.listDataDecisions(
        narrowWorkspaceAccessToAccount(owner.scope, owner.accountId),
      );

      const tickerRoundTrips = ticker.rows.reduce((total, row) =>
        total + row.roundTripCount, 0);
      if (
        calendar.coverage.readyClosedCount !== ticker.coverage.readyClosedCount ||
        calendar.coverage.readyClosedCount !== tickerRoundTrips
      ) {
        fail("closed_trade_reconciliation");
      }
      if (
        open.positions.length !== open.coverage.legitimateOpenCount ||
        open.decisions.length !== open.coverage.needsDecisionCount
      ) {
        fail("open_and_decision_separation");
      }
      if (dataDecisions.pending.length !== open.coverage.needsDecisionCount) {
        fail("product_data_decision_reconciliation");
      }
      if (
        day.coverage.readyClosedCount !== calendar.coverage.readyClosedCount ||
        day.factSetRevisionSha256 !== ticker.factSetRevisionSha256 ||
        open.factSetRevisionSha256 !== ticker.factSetRevisionSha256
      ) {
        fail("read_model_revision_reconciliation");
      }

      totals.calendarDays += calendar.days.length;
      totals.tickerGroups += ticker.rows.length;
      totals.readyClosed += calendar.coverage.readyClosedCount;
      totals.legitimateOpen += open.positions.length;
      totals.needsDecision += open.decisions.length;
      totals.latestDayExecutions += day.executionActivity.length;
      totals.latestDayDecisionActivity += day.decisionActivity.length;
      totals.latestDayPositionSnapshots += day.positionSnapshots.length;
      totals.pendingDataDecisions += dataDecisions.pending.length;
      totals.resolvedDataDecisions += dataDecisions.resolved.length;
      accountDigests.push(Object.freeze({
        selectionRef: owner.accountSelectionRef,
        calendarSha256: digest(calendar),
        tickerSha256: digest(ticker),
        openSha256: digest(open),
        latestDaySha256: digest(day),
        dataDecisionsSha256: digest(dataDecisions),
      }));
    }

    database.close();
    requireNoPendingWal(databasePath);
    const finalSize = statSync(databasePath).size;
    const finalSha256 = fileSha256(databasePath);
    if (initialSize !== finalSize || initialSha256 !== finalSha256) {
      fail("database_changed");
    }

    process.stdout.write(JSON.stringify({
      status: "ok",
      identifiersRedacted: true,
      database: Object.freeze({
        fileSizeBytes: finalSize,
        fileSha256: finalSha256,
        state: "unchanged",
      }),
      counts: Object.freeze({
        activeAccounts: owners.length,
        ...totals,
      }),
      digests: Object.freeze({
        accountsSha256: digest(accountDigests),
      }),
    }) + "\n");
  } finally {
    if (database.open) database.close();
  }
}

main();
