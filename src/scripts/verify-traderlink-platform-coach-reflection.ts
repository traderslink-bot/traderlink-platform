import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";

import Database from "better-sqlite3";

import { deriveDevelopmentOwnerJournalScope } from "@/src/modules/journal/server/accounts/journal-development-owner-scope";
import { JournalAnalyticsFactSetRepository } from "@/src/modules/journal/server/analytics/journal-analytics-fact-set-repository";
import { JournalAnalyticsFactSetService } from "@/src/modules/journal/server/analytics/journal-analytics-fact-set-service";
import { JournalAnnotationRepository } from "@/src/modules/journal/server/annotations/journal-annotation-repository";
import { JournalAnnotationService } from "@/src/modules/journal/server/annotations/journal-annotation-service";
import { JournalRuleRepository } from "@/src/modules/journal/server/annotations/journal-rule-repository";
import { JournalProductReadService } from "@/src/modules/journal/server/product/journal-product-read-service";
import { JournalDashboardReadModelService } from "@/src/modules/journal-analytics/server/journal-dashboard-read-model-service";
import { CoachReflectionService } from "@/src/modules/coach/server/coach-reflection-service";
import { resolvePlatformDatabaseConfig } from "@/src/modules/platform/server/database/platform-database-config";
import { verifyPlatformDatabaseConnectionPragmas } from "@/src/modules/platform/server/database/open-platform-database";
import { verifyCompletedPlatformDatabase } from "@/src/modules/platform/server/database/run-platform-migrations";

function sha256(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function main(): void {
  const path = resolvePlatformDatabaseConfig({ environment: process.env }).databasePath;
  const before = Object.freeze({ size: statSync(path).size, sha256: sha256(path) });
  const database = new Database(path, { readonly: true, fileMustExist: true });
  database.pragma("foreign_keys = ON");
  database.pragma("busy_timeout = 5000");
  database.pragma("query_only = ON");
  verifyCompletedPlatformDatabase(database);
  verifyPlatformDatabaseConnectionPragmas(database);
  const scope = deriveDevelopmentOwnerJournalScope(database).scope;
  const facts = new JournalAnalyticsFactSetService(
    new JournalAnalyticsFactSetRepository(database),
  );
  const result = new CoachReflectionService(
    new JournalDashboardReadModelService(facts),
    new JournalAnnotationService(
      new JournalAnnotationRepository(database),
      new JournalRuleRepository(database),
    ),
    new JournalProductReadService(database),
  ).read(scope, Object.freeze({
      period: "monthly",
      anchorDate: null,
      currency: null,
    }));
  database.close();
  const after = Object.freeze({ size: statSync(path).size, sha256: sha256(path) });
  if (
    before.size !== after.size ||
    before.sha256 !== after.sha256 ||
    result.source !== "journal_facts" ||
    result.coverage.readyClosedCount !== 331 ||
    result.coverage.legitimateOpenCount !== 0 ||
    result.coverage.needsDecisionCount !== 2 ||
    result.summary.accountPendingDataDecisionCount !== 2 ||
    result.summary.dailyNotesSavedCount !== 0 ||
    result.summary.roundTripNotesSavedCount !== 0 ||
    result.summary.taggedTradeCount !== 0 ||
    result.summary.activeRuleCount !== 0 ||
    result.summary.focusRuleCount !== 0
  ) {
    throw new Error("TRADERLINK_COACH_REFLECTION_VERIFICATION_FAILED");
  }
  process.stdout.write(`${JSON.stringify({
    status: "ok",
    identifiersRedacted: true,
    source: result.source,
    period: result.period,
    counts: {
      tradingDays: result.summary.tradingDayCount,
      readyClosedInPeriod: result.summary.readyClosedTradeCount,
      readyClosedAccount: result.coverage.readyClosedCount,
      legitimateOpenAccount: result.coverage.legitimateOpenCount,
      needsDecisionAccount: result.coverage.needsDecisionCount,
      pendingDataDecisions: result.summary.accountPendingDataDecisionCount,
      dailyNotes: result.summary.dailyNotesSavedCount,
      roundTripNotes: result.summary.roundTripNotesSavedCount,
      taggedTrades: result.summary.taggedTradeCount,
      activeRules: result.summary.activeRuleCount,
    },
    database: { ...after, state: "unchanged" },
  })}\n`);
}

main();
