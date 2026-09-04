import "server-only";

import Decimal from "decimal.js";

import type {
  JournalRoundTripNoteRecord,
  JournalRuleReviewRecord,
  JournalTagRecord,
} from "@/src/modules/journal/contracts/journal-annotation-contracts";
import type { JournalLogicalTrade } from "@/src/modules/journal/contracts/journal-logical-trade-contracts";
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
import { JournalLogicalTradeRepository } from "../logical-trades/journal-logical-trade-repository";
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

export type JournalTradeStoryHistoricalSummary = Readonly<{
  direction: "long" | "short";
  hasCurrentAnalyzerResult: boolean;
  journalDataAvailability: "available" | "unavailable";
  notes: JournalRoundTripNoteRecord | null;
  performance: JournalTradeStoryPerformance | null;
  projectionState: "ready_closed" | "legitimate_open";
  ruleReviews: readonly JournalTradeStoryRuleReview[];
  status: "summary_only";
  style: Readonly<{
    tradeStyle: "day_trade" | "swing" | "other";
  }> | null;
  symbol: string;
  tags: readonly JournalTagRecord[];
  timezone: string;
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
}> | JournalTradeStoryHistoricalSummary;

type HistoricalSummaryRow = Readonly<{
  closed_at_utc: string | null;
  direction: "long" | "short";
  entered_quantity_decimal: string | null;
  entry_notional_decimal: string | null;
  gross_pnl_decimal: string | null;
  hold_duration_seconds: number | null;
  maximum_position_quantity_decimal: string | null;
  opened_at_utc: string;
  projection_state: "ready_closed" | "legitimate_open";
  symbol: string;
  trade_currency: string;
  trade_style: "day_trade" | "swing" | "other" | null;
  trading_timezone: string;
  unique_execution_count: number;
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

function historicalSummary(
  scope: WorkspaceAccessScope,
  roundTripId: string,
): HistoricalSummaryRow | null {
  if (!scope.activeAccountId) return null;
  return withReadonlyPlatformDatabase({}, (database) => database.prepare(`SELECT
  projection.closed_at_utc,
  version.direction,
  projection.entered_quantity_decimal,
  projection.entry_notional_decimal,
  projection.gross_pnl_decimal,
  projection.hold_duration_seconds,
  projection.maximum_position_quantity_decimal,
  projection.opened_at_utc,
  projection.projection_state,
  instrument.normalized_symbol AS symbol,
  version.trade_currency,
  style.trade_style,
  account.trading_timezone,
  projection.unique_execution_count
FROM journal_workspace_trade_library_projections projection
JOIN journal_round_trip_versions version
  ON version.workspace_id = projection.workspace_id
 AND version.account_id = projection.account_id
 AND version.round_trip_version_id = projection.round_trip_version_id
JOIN journal_instruments instrument
  ON instrument.workspace_id = version.workspace_id
 AND instrument.instrument_id = version.instrument_id
JOIN journal_accounts account
  ON account.workspace_id = projection.workspace_id
 AND account.account_id = projection.account_id
LEFT JOIN journal_trade_style_plans style
  ON style.workspace_id = projection.workspace_id
 AND style.account_id = projection.account_id
 AND style.round_trip_id = projection.round_trip_id
WHERE projection.workspace_id = ?
  AND projection.account_id = ?
  AND projection.round_trip_id = ?
LIMIT 1`).get(
    scope.workspaceId,
    scope.activeAccountId,
    roundTripId,
  ) as HistoricalSummaryRow | undefined ?? null);
}

function historicalSummaryModel(
  scope: WorkspaceAccessScope,
  roundTripId: string,
  summary: HistoricalSummaryRow,
): JournalTradeStoryHistoricalSummary {
  const factAnnotations = (() => {
    try {
      return Object.freeze({ availability: "available" as const, value: annotations(scope, roundTripId) });
    } catch {
      return Object.freeze({
        availability: "unavailable" as const,
        value: Object.freeze({
          notes: null,
          ruleReviews: Object.freeze([]),
          tags: Object.freeze([]),
        }),
      });
    }
  })();
  const performance = summary.projection_state === "ready_closed" &&
      summary.closed_at_utc !== null &&
      summary.entered_quantity_decimal !== null &&
      summary.entry_notional_decimal !== null &&
      summary.gross_pnl_decimal !== null &&
      summary.hold_duration_seconds !== null &&
      summary.maximum_position_quantity_decimal !== null
    ? Object.freeze({
      chargeCostDecimal: null,
      chargeCoverage: "unavailable" as const,
      chargeCreditDecimal: null,
      closedAtUtc: summary.closed_at_utc,
      enteredQuantityDecimal: summary.entered_quantity_decimal,
      entryNotionalDecimal: summary.entry_notional_decimal,
      executionCount: summary.unique_execution_count,
      exitQuantityDecimal: summary.entered_quantity_decimal,
      grossPnlDecimal: summary.gross_pnl_decimal,
      holdDurationMilliseconds: summary.hold_duration_seconds * 1000,
      maximumPositionQuantityDecimal: summary.maximum_position_quantity_decimal,
      netPnlDecimal: null,
      openedAtUtc: summary.opened_at_utc,
      tradeCurrency: summary.trade_currency,
    })
    : null;
  return Object.freeze({
    direction: summary.direction,
    hasCurrentAnalyzerResult: (() => {
      try {
        return hasCurrentAnalyzerResult(scope, roundTripId);
      } catch {
        return false;
      }
    })(),
    journalDataAvailability: factAnnotations.availability,
    notes: factAnnotations.value.notes,
    performance,
    projectionState: summary.projection_state,
    ruleReviews: factAnnotations.value.ruleReviews,
    status: "summary_only",
    style: summary.trade_style === null ? null : Object.freeze({
      tradeStyle: summary.trade_style,
    }),
    symbol: summary.symbol,
    tags: factAnnotations.value.tags,
    timezone: summary.trading_timezone,
  });
}

function historicalSummaryOrThrow(
  scope: WorkspaceAccessScope,
  roundTripId: string,
  cause: unknown,
): JournalTradeStoryHistoricalSummary {
  const summary = historicalSummary(scope, roundTripId);
  if (!summary) throw cause;
  return historicalSummaryModel(scope, roundTripId, summary);
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

function logicalAnnotations(
  scope: WorkspaceAccessScope,
  logicalTradeId: string,
): Readonly<{
  notes: JournalRoundTripNoteRecord | null;
  ruleReviews: readonly JournalTradeStoryRuleReview[];
  tags: readonly JournalTagRecord[];
}> {
  if (!scope.activeAccountId) return Object.freeze({ notes: null, ruleReviews: [], tags: [] });
  return withReadonlyJournalAnnotations(scope, (service, account) => {
    const allTags = service.listTags(account);
    const rules = new Map(service.listRules(account).map((rule) => [rule.ruleId, rule.title]));
    return withReadonlyPlatformDatabase({}, (database) => {
      const note = database.prepare(`SELECT technical_note_text, note_text, revision, created_at_utc, updated_at_utc
FROM journal_logical_trade_notes WHERE workspace_id = ? AND account_id = ? AND logical_trade_id = ?`).get(
        scope.workspaceId, scope.activeAccountId!, logicalTradeId,
      ) as { technical_note_text: string; note_text: string; revision: number; created_at_utc: string; updated_at_utc: string } | undefined;
      const tagRows = database.prepare(`SELECT tag_id FROM journal_logical_trade_tag_assignments
WHERE workspace_id = ? AND account_id = ? AND logical_trade_id = ?
 AND assignment_state = 'assigned'`).all(scope.workspaceId, scope.activeAccountId!, logicalTradeId) as readonly { tag_id: string }[];
      const reviews = database.prepare(`SELECT rule_id, rule_version_id, status, note_text, revision, updated_at_utc
FROM journal_logical_trade_rule_reviews WHERE workspace_id = ? AND account_id = ? AND logical_trade_id = ?`).all(
        scope.workspaceId, scope.activeAccountId!, logicalTradeId,
      ) as readonly { rule_id: string; rule_version_id: string;
          status: "followed" | "broken" | "not_reviewed"; note_text: string; revision: number; updated_at_utc: string }[];
      return Object.freeze({
        notes: note ? Object.freeze({ roundTripNoteId: logicalTradeId, roundTripId: logicalTradeId,
          revision: note.revision, technicalNote: note.technical_note_text, tradeNote: note.note_text,
          createdAtUtc: note.created_at_utc, updatedAtUtc: note.updated_at_utc }) : null,
        ruleReviews: Object.freeze(reviews.map((review) => Object.freeze({
          note: review.note_text, ruleId: review.rule_id, ruleTitle: rules.get(review.rule_id) ?? "Trading rule",
          ruleVersionId: review.rule_version_id, status: review.status,
          updatedAtUtc: review.updated_at_utc,
        }))),
        tags: Object.freeze(allTags.filter((tag) => tagRows.some((row) => row.tag_id === tag.tagId))),
      });
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
  let logicalTrade: JournalLogicalTrade | null = null;
  let position: JournalTrackedPositionDetail;
  try {
    logicalTrade = withReadonlyPlatformDatabase({}, (database) =>
      new JournalLogicalTradeRepository(database).findByRoundTripId(account, roundTripId));
    const memberIds = logicalTrade?.members.map((member) => member.roundTripId) ?? [roundTripId];
    position = withReadonlyJournalIntegrityRuntime(scope, (journal) => {
      const members = memberIds.map((memberId) =>
        journal.tradeTrackerReads.positionLedgerDetailForRoundTrip(account, memberId));
      const first = members[0]!;
      return members.length === 1 ? first : Object.freeze({ ...first,
        closedAtUtc: members.at(-1)!.closedAtUtc,
        executions: Object.freeze(members.flatMap((member) => member.executions)
          .sort((left, right) => left.executedAtUtc.localeCompare(right.executedAtUtc))),
        style: first.style ? Object.freeze({ ...first.style,
          tradeStyle: logicalTrade?.tradeStyle === "swing" ? "swing" as const : "day_trade" as const,
        }) : first.style,
      });
    });
  } catch (error) {
    return historicalSummaryOrThrow(scope, roundTripId, error);
  }
  try {
    const memberIds = logicalTrade?.members.map((member) => member.roundTripId) ?? [roundTripId];
    const annotationMembers = memberIds.map((memberId) => annotations(scope, memberId));
    const groupAnnotations = logicalTrade?.logicalTradeId && logicalTrade.members.length > 1
      ? logicalAnnotations(scope, logicalTrade.logicalTradeId) : null;
    const factAnnotations = Object.freeze({
      notes: (() => {
        const notes = annotationMembers.map((item) => item.notes).filter((item) => item !== null);
        if (groupAnnotations?.notes) return groupAnnotations.notes;
        if (notes.length === 0) return null;
        return Object.freeze({ ...notes[0]!,
          technicalNote: notes.map((item) => item.technicalNote.trim()).filter(Boolean).join("\n\n"),
          tradeNote: notes.map((item) => item.tradeNote.trim()).filter(Boolean).join("\n\n"),
        });
      })(),
      ruleReviews: Object.freeze([...(groupAnnotations?.ruleReviews ?? []),
        ...annotationMembers.flatMap((item) => item.ruleReviews)]),
      tags: Object.freeze([...new Map([...(groupAnnotations?.tags ?? []), ...annotationMembers.flatMap((item) => item.tags)]
        .map((tag) => [tag.tagId, tag] as const)).values()]),
    });
    const performances = memberIds.map((memberId) => performance(scope, memberId));
    const tradePerformance = performances.every((item) => item !== null)
      ? (() => {
          const values = performances as JournalTradeStoryPerformance[];
          const sum = (field: keyof JournalTradeStoryPerformance) => values.reduce(
            (total, value) => {
              const next = value[field];
              if (next === null || next === undefined || typeof next === "boolean") {
                platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field });
              }
              return new StoryDecimal(total).plus(String(next)).toFixed();
            }, "0");
          const chargesComplete = values.every((value) => value.chargeCoverage === "complete");
          return Object.freeze({ ...values[0]!,
            chargeCostDecimal: chargesComplete ? sum("chargeCostDecimal") : null,
            chargeCoverage: chargesComplete ? "complete" as const : "unavailable" as const,
            chargeCreditDecimal: chargesComplete ? sum("chargeCreditDecimal") : null,
            closedAtUtc: values.at(-1)!.closedAtUtc,
            enteredQuantityDecimal: sum("enteredQuantityDecimal"),
            entryNotionalDecimal: sum("entryNotionalDecimal"),
            executionCount: values.reduce((total, value) => total + value.executionCount, 0),
            exitQuantityDecimal: sum("exitQuantityDecimal"),
            grossPnlDecimal: sum("grossPnlDecimal"),
            holdDurationMilliseconds: Date.parse(values.at(-1)!.closedAtUtc) - Date.parse(values[0]!.openedAtUtc),
            maximumPositionQuantityDecimal: StoryDecimal.max(...values.map((value) => value.maximumPositionQuantityDecimal)).toFixed(),
            netPnlDecimal: chargesComplete ? sum("netPnlDecimal") : null,
          });
        })() : null;
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
      hasCurrentAnalyzerResult: logicalTrade?.logicalTradeId
        ? withReadonlyPlatformDatabase({}, (database) => Boolean(database.prepare(`SELECT 1
FROM journal_logical_trade_daily_analyses WHERE workspace_id = ? AND account_id = ?
 AND logical_trade_id = ? AND status = 'ready' LIMIT 1`).get(
          scope.workspaceId, scope.activeAccountId!, logicalTrade.logicalTradeId)))
        : hasCurrentAnalyzerResult(scope, roundTripId),
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
  } catch (error) {
    return historicalSummaryOrThrow(scope, roundTripId, error);
  }
}
