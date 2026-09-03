import "server-only";

import Decimal from "decimal.js";

import type {
  JournalRoundTripNoteRecord,
  JournalRuleReviewRecord,
  JournalTagRecord,
} from "@/src/modules/journal/contracts/journal-annotation-contracts";
import type { JournalTrackedPositionDetail } from "@/src/modules/journal/contracts/journal-trade-tracker-contracts";
import { normalizeJournalAnalyticsFacts } from
  "@/src/modules/journal-analytics/server/normalize-journal-analytics-facts";
import {
  formatJournalAnalyticsDecimal,
  formatJournalAnalyticsMoney,
} from "@/src/modules/journal-analytics/presentation/journal-analytics-formatters";
import { withJournalAnalyticsDashboardRuntime } from
  "@/src/modules/journal-analytics/server/journal-analytics-dashboard-runtime";
import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { narrowWorkspaceAccessToAccount } from "@/src/modules/platform/contracts/workspace-access-scope";
import { platformFailure } from
  "@/src/modules/platform/server/database/platform-migration-contract";
import { withReadonlyPlatformDatabase } from
  "@/src/modules/platform/server/database/open-readonly-platform-database";
import {
  newYorkMarketSessionAt,
  newYorkMarketSessionBoundaries,
} from "@/src/modules/level-analysis/server/daily-trade-analyzer-session";

import { withReadonlyJournalAnnotations } from "../annotations/journal-annotation-runtime";
import { withReadonlyJournalIntegrityRuntime } from "../journal-integrity-runtime";
import { buildTradeStoryActivities, type TradeStoryActivitiesResult } from "./journal-trade-story-activities";
import { composeTradeStoryCopy, type TradeStoryCopyResult } from "./journal-trade-story-copy";
import { buildTradeStoryPositionLedger, type TradeStoryLedgerResult } from "./journal-trade-story-position-ledger";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;

const StoryDecimal = Decimal.clone({
  precision: 160,
  rounding: Decimal.ROUND_HALF_UP,
  toExpNeg: -1000,
  toExpPos: 1000,
});

export type JournalTradeStoryRuleReview = Readonly<{
  note: string;
  ruleId: string;
  ruleTitle: string;
  ruleVersionId: string;
  status: JournalRuleReviewRecord["status"];
  updatedAtUtc: string;
}>;

export type JournalTradeStoryPerformance = Readonly<{
  chargeCostDecimal: string | null;
  chargeCoverage: "complete" | "unavailable";
  chargeCreditDecimal: string | null;
  closedAtUtc: string;
  enteredQuantityDecimal: string;
  entryNotionalDecimal: string;
  executionCount: number;
  exitQuantityDecimal: string;
  grossPnlDecimal: string;
  holdDurationMilliseconds: number;
  maximumPositionQuantityDecimal: string;
  netPnlDecimal: string | null;
  openedAtUtc: string;
  tradeCurrency: string;
}>;

export type JournalTradeStoryReadModel = Readonly<{
  direction: "long" | "short";
  executions: JournalTrackedPositionDetail["executions"];
  hasCurrentAnalyzerResult: boolean;
  ledger: TradeStoryLedgerResult;
  notes: JournalRoundTripNoteRecord | null;
  positionRef: string;
  performance: JournalTradeStoryPerformance | null;
  projectionState: JournalTrackedPositionDetail["projectionState"];
  ruleReviews: readonly JournalTradeStoryRuleReview[];
  status: "ready";
  story: TradeStoryActivitiesResult;
  storyCopy: TradeStoryCopyResult;
  style: JournalTrackedPositionDetail["style"];
  symbol: string;
  tags: readonly JournalTagRecord[];
  timezone: string;
}>;

function performance(
  scope: WorkspaceAccessScope,
  roundTripId: string,
): JournalTradeStoryPerformance | null {
  return withJournalAnalyticsDashboardRuntime(scope, ({ facts }) => {
    if (!scope.activeAccountId) return null;
    const factSet = facts.getJournalAnalyticsFactSet(scope, Object.freeze({
      accountIds: Object.freeze([scope.activeAccountId]),
      closingDateRange: Object.freeze({ kind: "all_available" as const }),
      currencySelection: Object.freeze({ kind: "all_partitions" as const }),
    }));
    const row = normalizeJournalAnalyticsFacts(factSet).realizedRows
      .find((candidate) => candidate.roundTripId === roundTripId);
    return row ? Object.freeze({
      chargeCostDecimal: row.chargeCostDecimal,
      chargeCoverage: row.chargeCoverage,
      chargeCreditDecimal: row.chargeCreditDecimal,
      closedAtUtc: row.closedAtUtc,
      enteredQuantityDecimal: row.enteredQuantityDecimal,
      entryNotionalDecimal: row.entryNotionalDecimal,
      executionCount: row.uniqueExecutionCount,
      exitQuantityDecimal: row.exitQuantityDecimal,
      grossPnlDecimal: row.grossPnlDecimal,
      holdDurationMilliseconds: row.holdingDurationMilliseconds,
      maximumPositionQuantityDecimal: row.maximumPositionQuantityDecimal,
      netPnlDecimal: row.netPnlDecimal,
      openedAtUtc: row.openedAtUtc,
      tradeCurrency: row.tradeCurrency,
    }) : null;
  });
}

function hasCurrentAnalyzerResult(
  scope: WorkspaceAccessScope,
  roundTripId: string,
): boolean {
  if (!scope.activeAccountId) return false;
  return withReadonlyPlatformDatabase({}, (database) => {
    const row = database.prepare(`SELECT EXISTS (
  SELECT 1
  FROM journal_round_trip_daily_trade_analyses analysis
  JOIN journal_round_trip_daily_trade_analysis_versions analysis_version
    ON analysis_version.daily_trade_analysis_id = analysis.daily_trade_analysis_id
   AND analysis_version.revision_number = analysis.current_revision
  WHERE analysis.workspace_id = round_trip.workspace_id
    AND analysis.account_id = round_trip.account_id
    AND analysis.round_trip_id = round_trip.round_trip_id
    AND analysis.round_trip_version_id = round_trip.current_version_id
    AND analysis.status = 'ready'
    AND analysis_version.status = 'ready'
) AS has_current_analyzer_result
FROM journal_round_trips round_trip
WHERE round_trip.workspace_id = ? AND round_trip.account_id = ?
  AND round_trip.round_trip_id = ? AND round_trip.lifecycle_state = 'active'`).get(
      scope.workspaceId,
      scope.activeAccountId,
      roundTripId,
    ) as { has_current_analyzer_result: 0 | 1 } | undefined;
    return row?.has_current_analyzer_result === 1;
  });
}

function localDateAt(utc: string, timezone: string): string {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: timezone,
    year: "numeric",
  }).formatToParts(new Date(utc)).filter((part) => part.type !== "literal")
    .map((part) => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function tradeStoryCopy(
  story: TradeStoryActivitiesResult,
  position: JournalTrackedPositionDetail,
): TradeStoryCopyResult {
  const label = position.style?.tradeStyle === "swing"
    ? "Swing trade"
    : position.style?.tradeStyle === "day_trade"
      ? "Day trade"
      : "Trade";
  return composeTradeStoryCopy({
    activities: story,
    formatters: {
      describeSession: (session) => session === "pre_market"
        ? "premarket"
        : session === "regular_hours"
          ? "regular hours"
          : "postmarket",
      formatPercentageOfPosition: (quantityDecimal, positionQuantityDecimal) => {
        const positionQuantity = new StoryDecimal(positionQuantityDecimal);
        if (positionQuantity.isZero()) return "0%";
        const percentage = new StoryDecimal(quantityDecimal)
          .dividedBy(positionQuantity)
          .times(100)
          .toFixed(12);
        return `${formatJournalAnalyticsDecimal(percentage)}%`;
      },
      formatPrice: (priceDecimal) => formatJournalAnalyticsMoney(
        priceDecimal,
        position.currency,
      ),
      formatQuantity: (quantityDecimal) => formatJournalAnalyticsDecimal(quantityDecimal),
      formatTime: (atUtc) => new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "2-digit",
        timeZone: position.timezone,
      }).format(new Date(atUtc)),
    },
    tradeLabel: label,
  });
}

function annotations(
  scope: WorkspaceAccessScope,
  roundTripId: string,
): Readonly<{
  notes: JournalRoundTripNoteRecord | null;
  ruleReviews: readonly JournalTradeStoryRuleReview[];
  tags: readonly JournalTagRecord[];
}> {
  return withReadonlyJournalAnnotations(scope, (service, account) => {
    const note = service.readRoundTripNotes(account, [roundTripId])[roundTripId] ?? null;
    const tags = service.listTagsForRoundTrips(account, [roundTripId])[roundTripId] ?? [];
    const ruleReviews = service
      .listRuleReviewsForRoundTripsWithRuleTitles(account, [roundTripId])
      .filter(({ review }) => review.targetKind === "round_trip" && review.roundTripId === roundTripId)
      .map(({ review, ruleTitle }) => Object.freeze({
        note: review.note,
        ruleId: review.ruleId,
        ruleTitle,
        ruleVersionId: review.ruleVersionId,
        status: review.status,
        updatedAtUtc: review.updatedAtUtc,
      }));
    return Object.freeze({
      notes: note,
      ruleReviews: Object.freeze(ruleReviews),
      tags: Object.freeze(tags),
    });
  });
}

/**
 * Reads one stable Journal round trip and translates its canonical execution
 * allocations into the reusable Trade Story facts. This is deliberately a
 * read-only adapter: it neither rebuilds trades nor creates another P/L or
 * Analyzer calculation.
 */
export function readJournalTradeStory(
  scope: WorkspaceAccessScope,
  roundTripId: string,
): JournalTradeStoryReadModel {
  if (!UUID_PATTERN.test(roundTripId)) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "roundTripId" });
  }
  if (!scope.activeAccountId) {
    platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
  }
  const account = narrowWorkspaceAccessToAccount(scope, scope.activeAccountId);
  const position = withReadonlyJournalIntegrityRuntime(scope, (journal) =>
    journal.tradeTrackerReads.positionLedgerDetailForRoundTrip(account, roundTripId));
  const factAnnotations = annotations(scope, roundTripId);
  const tradePerformance = performance(scope, roundTripId);
  const ledger = buildTradeStoryPositionLedger({
    executions: position.executions.map((execution, index) => Object.freeze({
      executionId: execution.executionId,
      executedAtUtc: execution.executedAtUtc,
      marketSession: newYorkMarketSessionAt(execution.executedAtUtc),
      priceDecimal: execution.priceDecimal,
      quantityDecimal: execution.quantityDecimal,
      sequence: index + 1,
      side: execution.side,
      tradingDate: localDateAt(
        execution.executedAtUtc,
        position.timezone,
      ),
    })),
    sessionBoundaries: Object.freeze([...new Set(position.executions.map((execution) =>
      localDateAt(execution.executedAtUtc, "America/New_York")))].flatMap(
      (tradingDate) => newYorkMarketSessionBoundaries(tradingDate),
    )),
  });
  const story = buildTradeStoryActivities(ledger);
  return Object.freeze({
    direction: position.direction,
    executions: position.executions,
    hasCurrentAnalyzerResult: hasCurrentAnalyzerResult(scope, roundTripId),
    ledger,
    notes: factAnnotations.notes,
    positionRef: position.positionRef,
    performance: tradePerformance,
    projectionState: position.projectionState,
    ruleReviews: factAnnotations.ruleReviews,
    status: "ready",
    story,
    storyCopy: tradeStoryCopy(story, position),
    style: position.style,
    symbol: position.symbol,
    tags: factAnnotations.tags,
    timezone: position.timezone,
  });
}
