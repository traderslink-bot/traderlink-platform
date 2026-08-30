import "server-only";

import Decimal from "decimal.js";

import {
  acceptedRsi14,
  isAcceptedRsi14CalculationVersion,
  RSI_14_CALCULATION_VERSION,
} from "@/src/lib/trade-candle-analysis/indicator-context";
import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import type {
  JournalSwingPositionDetail,
  JournalTrackedPositionDetail,
  JournalTrackedPosition,
} from "@/src/modules/journal/contracts/journal-trade-tracker-contracts";
import type { JournalTradeStyleRecord } from "@/src/modules/journal/contracts/journal-trade-style-contracts";
import type { JournalEditableManualExecution } from "@/src/modules/journal/server/manual-trades/journal-manual-execution-edit-service";
import type { JournalTradingDayReadModel } from "@/src/modules/journal-analytics/contracts/journal-dashboard-read-models";
import {
  withJournalAnalyticsDashboardRuntime,
  withJournalAnalyticsReportingDashboardRuntime,
} from "@/src/modules/journal-analytics/server/journal-analytics-dashboard-runtime";
import {
  journalReportingCurrencyMultiplier,
  type JournalReportingCurrencyContext,
} from "@/src/modules/journal-analytics/server/journal-reporting-currency-fact-set";
import type {
  JournalDailyNoteRecord,
  JournalRoundTripNoteRecord,
  JournalRuleRecord,
  JournalRuleReviewRecord,
  JournalTagRecord,
} from "@/src/modules/journal/contracts/journal-annotation-contracts";
import { JournalAccountRepository } from "@/src/modules/journal/server/accounts/journal-account-repository";
import { JournalAccountService } from "@/src/modules/journal/server/accounts/journal-account-service";
import { withReadonlyJournalIntegrityRuntime } from "@/src/modules/journal/server/journal-integrity-runtime";
import type { JournalAnnotationService } from "@/src/modules/journal/server/annotations/journal-annotation-service";
import { withReadonlyJournalAnnotations } from "@/src/modules/journal/server/annotations/journal-annotation-runtime";
import { evaluateJournalPresetRules } from "@/src/modules/journal/server/annotations/journal-preset-rule-evaluator";
import { currentJournalAccountSelectionRef } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import {
  COACH_AI_DAILY_COMPANION_CONTEXT_VERSION,
  type CoachAiDailyCompanionContext,
  type CoachAiDailyCompanionResolvedContext,
  type CoachAiDailyCompanionRule,
} from "@/src/modules/coach/contracts/ai-daily-companion-contracts";
import type { TradeCandle } from "@/src/lib/trade-candle-analysis/candle-analysis";
import { detectExecutionPatternContexts } from "@/src/lib/trade-candle-analysis/execution-pattern-context";
import {
  analyzeDailyTradeGreenToRed,
  UNAVAILABLE_DAILY_TRADE_GREEN_TO_RED_ANALYSIS,
} from "@/src/modules/level-analysis/server/daily-trade-green-to-red-analyzer";
import { readDailyTradePathMaterialization } from "@/src/modules/level-analysis/server/daily-trade-path-materialization-repository";

import type {
  DaySessionDailyNote,
  DaySessionData,
  DaySessionRule,
  DaySessionTradeAnalyzer,
  DaySessionTradeTag,
} from "./[sessionDate]/day-session-types";

type ReplacementSwingPositionSourceDetail = Omit<JournalSwingPositionDetail, "executions"> & Readonly<{
  availableTags: readonly DaySessionTradeTag[];
  executions: readonly (Omit<JournalSwingPositionDetail["executions"][number], "executionId"> & Readonly<{
    manualEdit: {
      editRef: string;
      fees: string | null;
      localDate: string;
      localTime: string;
      sourcePrice: string | null;
      sourceTimezone: string;
      tradeCurrency: string;
    } | null;
  }>)[];
  rules: readonly DaySessionRule[];
  tags: readonly DaySessionTradeTag[];
}>;

export type ReplacementSwingPositionDetail = Omit<ReplacementSwingPositionSourceDetail, "executions"> & Readonly<{
  currency: string;
  executions: readonly (ReplacementSwingPositionSourceDetail["executions"][number] & Readonly<{
    reportingFeesDecimal: string | null;
    reportingPriceDecimal: string | null;
  }>)[];
}>;

function emptyNote(): DaySessionDailyNote {
  return {
    anythingElse: "",
    revision: null,
    technicalRecap: "",
    tomorrowsFocus: "",
    whatNeedsWork: "",
    whatWorked: "",
  };
}

function noteView(
  note: JournalDailyNoteRecord | null,
  currentFocus = "",
): DaySessionDailyNote {
  return note
    ? {
        anythingElse: note.anythingElse,
        revision: String(note.revision),
        technicalRecap: note.technicalRecap,
        tomorrowsFocus: note.tomorrowsFocus || currentFocus,
        whatNeedsWork: note.whatNeedsWork,
        whatWorked: note.whatWorked,
      }
    : emptyNote();
}

function tagView(tag: JournalTagRecord): DaySessionTradeTag {
  return {
    assignmentCount: tag.assignmentCount,
    name: tag.name,
    revision: String(tag.revision),
    tagId: tag.tagId,
  };
}

function reviewStatus(
  review: JournalRuleReviewRecord | undefined,
): DaySessionRule["status"] {
  return review?.status === "not_reviewed"
    ? "not-reviewed"
    : review?.status ?? "not-reviewed";
}

type AnnotationSnapshot = Readonly<{
  currentFocus: string;
  dailyNote: JournalDailyNoteRecord | null;
  roundTripNotes: Readonly<Record<string, JournalRoundTripNoteRecord>>;
  rules: readonly DaySessionRule[];
  tags: readonly JournalTagRecord[];
  tagsByRoundTrip: Readonly<Record<string, readonly JournalTagRecord[]>>;
  weekNotes: Readonly<Record<string, JournalDailyNoteRecord | null>>;
}>;

type AnalyzerRow = Readonly<{
  analysis_projection_fingerprint_sha256: string | null;
  current_round_trip_version_id: string;
  current_projection_fingerprint_sha256: string;
  daily_trade_analysis_version_id: string | null;
  has_pending_job: 0 | 1;
  market_session_set_version_id: string | null;
  execution_mismatch_set_id: string | null;
  mismatch_broker_confirmed: 0 | 1;
  pending_ready_at_utc: string | null;
  round_trip_id: string;
  round_trip_version_id: string | null;
  status: DaySessionTradeAnalyzer["status"] | null;
}>;

type AnalyzerMismatchRow = Readonly<{
  candle_high_decimal: string | null;
  candle_low_decimal: string | null;
  candle_time_utc_seconds: number;
  entered_price_decimal: string;
  executed_at_utc: string;
  execution_id: string;
  mismatch_kind: DaySessionTradeAnalyzer["executionMismatches"][number]["kind"];
  quantity_decimal: string;
  side: "buy" | "sell";
}>;

type AnalyzerSnapshotRow = Readonly<{
  candle_time_utc_seconds: number | null;
  event_kind: DaySessionTradeAnalyzer["events"][number]["kind"];
  snapshot_json: string;
}>;

function numberOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function stringOrNull(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function analyzerReferenceDistance(value: unknown): DaySessionTradeAnalyzer["events"][number]["metrics"]["vwapDistance"] {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const anchor = stringOrNull(record.anchorDecimal);
  const signedDistance = stringOrNull(record.signedDistanceDecimal);
  const signedDistancePercent = numberOrNull(record.signedDistancePercent);
  return anchor !== null && signedDistance !== null && signedDistancePercent !== null
    ? { anchor, signedDistance, signedDistancePercent }
    : null;
}

function analyzerMetrics(value: unknown): DaySessionTradeAnalyzer["events"][number]["metrics"] {
  if (!value || typeof value !== "object") {
    return {
      available: false,
      averageEntryPriceAfter: null,
      candleLocationRatio: null,
      candleTurnover: null,
      candleVolume: null,
      cumulativeSessionTurnover: null,
      cumulativeSessionVolume: null,
      ema9Distance: null,
      executionEdgeDistance: null,
      excursionUntilFlat: null,
      givebackFromPriorFavorableExtreme: null,
      positionQuantityAfter: "0",
      positionQuantityBefore: "0",
      postEventPaths: [],
      priorFavorableExtremePrice: null,
      vwapDistance: null,
    };
  }
  const record = value as Record<string, unknown>;
  const excursionRecord = record.excursionUntilFlat && typeof record.excursionUntilFlat === "object"
    ? record.excursionUntilFlat as Record<string, unknown>
    : null;
  const favorableMove = excursionRecord ? stringOrNull(excursionRecord.favorableMoveDecimal) : null;
  const adverseMove = excursionRecord ? stringOrNull(excursionRecord.adverseMoveDecimal) : null;
  const minutesUntilFlat = excursionRecord ? numberOrNull(excursionRecord.minutesUntilFlat) : null;
  const paths = Array.isArray(record.postEventPaths) ? record.postEventPaths : [];
  return {
    available: true,
    averageEntryPriceAfter: stringOrNull(record.averageEntryPriceAfterDecimal),
    candleLocationRatio: numberOrNull(record.candleLocationRatio),
    candleTurnover: stringOrNull(record.candleTurnoverDecimal),
    candleVolume: stringOrNull(record.candleVolumeDecimal),
    cumulativeSessionTurnover: stringOrNull(record.cumulativeSessionTurnoverDecimal),
    cumulativeSessionVolume: stringOrNull(record.cumulativeSessionVolumeDecimal),
    ema9Distance: analyzerReferenceDistance(record.ema9Distance),
    executionEdgeDistance: stringOrNull(record.executionEdgeDistanceDecimal),
    excursionUntilFlat: favorableMove !== null && adverseMove !== null && minutesUntilFlat !== null
      ? {
          adverseMove,
          favorableMove,
          minutesUntilFlat,
          observedThrough: excursionRecord ? numberOrNull(excursionRecord.observedThroughCandleTime) : null,
        }
      : null,
    givebackFromPriorFavorableExtreme: stringOrNull(record.givebackFromPriorFavorableExtremeDecimal),
    positionQuantityAfter: stringOrNull(record.positionQuantityAfterDecimal) ?? "0",
    positionQuantityBefore: stringOrNull(record.positionQuantityBeforeDecimal) ?? "0",
    postEventPaths: paths.flatMap((path) => {
      if (!path || typeof path !== "object") return [];
      const candidate = path as Record<string, unknown>;
      const minutesAfterEvent = numberOrNull(candidate.minutesAfterEvent);
      if (minutesAfterEvent !== 5 && minutesAfterEvent !== 15 && minutesAfterEvent !== 30 && minutesAfterEvent !== 60) return [];
      return [{
        minutesAfterEvent,
        observedAt: numberOrNull(candidate.observedAtCandleTime),
        oppositeDirectionMove: stringOrNull(candidate.oppositeDirectionMoveDecimal),
        tradeDirectionMove: stringOrNull(candidate.tradeDirectionMoveDecimal),
      }];
    }),
    priorFavorableExtremePrice: stringOrNull(record.priorFavorableExtremePriceDecimal),
    vwapDistance: analyzerReferenceDistance(record.vwapDistance),
  };
}

function analyzerFiveMinuteContext(
  value: unknown,
): DaySessionTradeAnalyzer["events"][number]["fiveMinuteContext"] {
  const empty = {
    completedBeforeExecution: null,
    containingCandle: null,
    preExecutionPartial: null,
  } satisfies DaySessionTradeAnalyzer["events"][number]["fiveMinuteContext"];
  if (!value || typeof value !== "object" || Array.isArray(value)) return empty;
  const record = value as Record<string, unknown>;
  const completed = record.completedBeforeExecution && typeof record.completedBeforeExecution === "object"
    ? record.completedBeforeExecution as Record<string, unknown>
    : null;
  const containing = record.containingCandle && typeof record.containingCandle === "object"
    ? record.containingCandle as Record<string, unknown>
    : null;
  const partial = record.preExecutionPartial && typeof record.preExecutionPartial === "object"
    ? record.preExecutionPartial as Record<string, unknown>
    : null;
  const completedCandleTime = completed ? numberOrNull(completed.candleTime) : null;
  const completedVolume = completed ? stringOrNull(completed.volumeDecimal) : null;
  const containingCandleTime = containing ? numberOrNull(containing.candleTime) : null;
  const containingVolume = containing ? stringOrNull(containing.volumeDecimal) : null;
  const partialMinuteCount = partial ? numberOrNull(partial.completedMinuteCount) : null;
  const partialVolume = partial ? stringOrNull(partial.volumeDecimal) : null;
  return {
    completedBeforeExecution: completed && completedCandleTime !== null && completedVolume !== null
      ? {
          candleTime: completedCandleTime,
          ema9Distance: analyzerReferenceDistance(completed.ema9Distance),
          relativeVolume: numberOrNull(completed.relativeVolume),
          turnover: stringOrNull(completed.turnoverDecimal),
          volume: completedVolume,
        }
      : null,
    containingCandle: containing && containingCandleTime !== null && containingVolume !== null
      ? {
          candleLocationRatio: numberOrNull(containing.candleLocationRatio),
          candleTime: containingCandleTime,
          ema9Distance: analyzerReferenceDistance(containing.ema9Distance),
          executionEdgeDistance: stringOrNull(containing.executionEdgeDistanceDecimal),
          relativeVolume: numberOrNull(containing.relativeVolume),
          turnover: stringOrNull(containing.turnoverDecimal),
          volume: containingVolume,
        }
      : null,
    preExecutionPartial: partial && partialMinuteCount !== null && partialVolume !== null
      ? {
          completedMinuteCount: partialMinuteCount,
          turnover: stringOrNull(partial.turnoverDecimal),
          volume: partialVolume,
        }
      : null,
  };
}

function analyzerSnapshotView(row: AnalyzerSnapshotRow): DaySessionTradeAnalyzer["events"][number] | null {
  try {
    const snapshot = JSON.parse(row.snapshot_json) as {
      event?: {
        eventId?: unknown;
        executedAtUtc?: unknown;
        feesDecimal?: unknown;
        priceDecimal?: unknown;
        quantityDecimal?: unknown;
        sequence?: unknown;
      };
      fiveMinuteContext?: unknown;
      indicators?: Record<string, unknown> | null;
      metrics?: unknown;
      patterns?: Array<{
        availableAtExecution?: unknown;
        candlesBeforeExecution?: unknown;
        kind?: unknown;
        knownAtTime?: unknown;
        score?: unknown;
        time?: unknown;
        timeframe?: unknown;
      }>;
    };
    if (!snapshot.event || typeof snapshot.event.executedAtUtc !== "string" ||
        typeof snapshot.event.priceDecimal !== "string" || typeof snapshot.event.quantityDecimal !== "string") {
      return null;
    }
    const rawIndicators = snapshot.indicators;
    const rsi14CalculationVersion =
      isAcceptedRsi14CalculationVersion(rawIndicators?.rsi14CalculationVersion)
        ? RSI_14_CALCULATION_VERSION
        : null;
    const indicators = rawIndicators && typeof rawIndicators === "object"
      ? {
          adr20: numberOrNull(rawIndicators.adr20),
          atr14: numberOrNull(rawIndicators.atr14),
          ema9: numberOrNull(rawIndicators.ema9),
          ema20: numberOrNull(rawIndicators.ema20),
          macd: numberOrNull(rawIndicators.macd),
          macdHistogram: numberOrNull(rawIndicators.macdHistogram),
          macdSignal: numberOrNull(rawIndicators.macdSignal),
          relativeVolume: numberOrNull(rawIndicators.relativeVolume),
          rsi14: acceptedRsi14(
            rawIndicators.rsi14,
            rsi14CalculationVersion,
          ),
          rsi14CalculationVersion,
          vwap: numberOrNull(rawIndicators.vwap),
        }
      : null;
    return {
      candleTime: row.candle_time_utc_seconds,
      eventId: typeof snapshot.event.eventId === "string" ? snapshot.event.eventId : "",
      executedAt: snapshot.event.executedAtUtc,
      fees: stringOrNull(snapshot.event.feesDecimal),
      fiveMinuteContext: analyzerFiveMinuteContext(snapshot.fiveMinuteContext),
      indicators,
      kind: row.event_kind,
      metrics: analyzerMetrics(snapshot.metrics),
      patterns: (snapshot.patterns ?? []).flatMap((pattern) => {
        const candlesBeforeExecution = numberOrNull(pattern.candlesBeforeExecution);
        const knownAtTime = numberOrNull(pattern.knownAtTime);
        const score = numberOrNull(pattern.score);
        const time = numberOrNull(pattern.time);
        const timeframe = pattern.timeframe;
        return typeof pattern.availableAtExecution === "boolean" &&
          (candlesBeforeExecution === 0 || candlesBeforeExecution === 1 || candlesBeforeExecution === 2) &&
          typeof pattern.kind === "string" && knownAtTime !== null && score !== null && time !== null &&
          (timeframe === "1m" || timeframe === "5m" || timeframe === "15m")
          ? [{
              availableAtExecution: pattern.availableAtExecution,
              candlesBeforeExecution,
              kind: pattern.kind,
              knownAtTime,
              score,
              time,
              timeframe,
            }]
          : [];
      }),
      price: snapshot.event.priceDecimal,
      quantity: snapshot.event.quantityDecimal,
      sequence: numberOrNull(snapshot.event.sequence) ?? 0,
    };
  } catch {
    return null;
  }
}

function withExecutionPatternContexts(
  candles: readonly TradeCandle[],
  events: readonly DaySessionTradeAnalyzer["events"][number][],
): DaySessionTradeAnalyzer["events"] {
  return events.map((event) => {
    if (event.patterns.length > 0 && event.patterns.every((pattern) => pattern.timeframe)) return event;
    const executedAtSeconds = Date.parse(event.executedAt) / 1000;
    return {
      ...event,
      patterns: [...detectExecutionPatternContexts(candles, executedAtSeconds)],
    };
  });
}

function readDailyTradeAnalyzers(
  scope: WorkspaceAccessScope,
  roundTrips: readonly Readonly<{ direction: "long" | "short"; roundTripId: string }>[],
  options: Readonly<{ includeDetails: boolean }> = { includeDetails: true },
): ReadonlyMap<string, DaySessionTradeAnalyzer> {
  const roundTripIds = roundTrips.map((roundTrip) => roundTrip.roundTripId);
  const directionByRoundTripId = new Map(roundTrips.map((roundTrip) =>
    [roundTrip.roundTripId, roundTrip.direction] as const));
  if (roundTripIds.length === 0 || !scope.activeAccountId) return new Map();
  const activeAccountId = scope.activeAccountId;
  return withReadonlyPlatformDatabase({}, (database) => {
    const supportsExactTurnover = database.prepare<[], { name: string }>(
      "PRAGMA table_info(level_analysis_market_session_candles)",
    ).all().some((column) => column.name === "turnover_decimal");
    const turnoverSelection = supportsExactTurnover
      ? "turnover_decimal"
      : "NULL AS turnover_decimal";
    const roundTripPlaceholders = roundTripIds.map(() => "?").join(", ");
    const analysisForRoundTrips = database.prepare<[string, string, ...string[]], AnalyzerRow>(`SELECT
  round_trip.round_trip_id,
  round_trip.current_version_id AS current_round_trip_version_id,
  current_version.projection_fingerprint_sha256 AS current_projection_fingerprint_sha256,
  analysis.round_trip_version_id,
  analyzed_version.projection_fingerprint_sha256 AS analysis_projection_fingerprint_sha256,
  analysis.status,
  version.daily_trade_analysis_version_id,
  version.market_session_set_version_id,
  mismatch_set.execution_mismatch_set_id,
  EXISTS (
    SELECT 1 FROM journal_round_trip_daily_trade_execution_mismatch_confirmations confirmation
    WHERE confirmation.execution_mismatch_set_id = mismatch_set.execution_mismatch_set_id
  ) AS mismatch_broker_confirmed,
  EXISTS (
    SELECT 1
    FROM level_analysis_daily_trade_jobs job
    WHERE job.workspace_id = round_trip.workspace_id
      AND job.account_id = round_trip.account_id
      AND job.round_trip_id = round_trip.round_trip_id
      AND job.round_trip_version_id = round_trip.current_version_id
      AND job.status IN ('queued', 'leased')
  ) AS has_pending_job,
  (
    SELECT job.desired_coverage_end_utc
    FROM level_analysis_daily_trade_jobs job
    WHERE job.workspace_id = round_trip.workspace_id
      AND job.account_id = round_trip.account_id
      AND job.round_trip_id = round_trip.round_trip_id
      AND job.round_trip_version_id = round_trip.current_version_id
      AND job.status IN ('queued', 'leased')
    ORDER BY job.created_at_utc DESC
    LIMIT 1
  ) AS pending_ready_at_utc
FROM journal_round_trips round_trip
JOIN journal_round_trip_versions current_version
  ON current_version.workspace_id = round_trip.workspace_id
  AND current_version.account_id = round_trip.account_id
  AND current_version.round_trip_version_id = round_trip.current_version_id
LEFT JOIN journal_round_trip_daily_trade_analyses analysis
  ON analysis.workspace_id = round_trip.workspace_id
  AND analysis.account_id = round_trip.account_id
  AND analysis.round_trip_id = round_trip.round_trip_id
LEFT JOIN journal_round_trip_daily_trade_analysis_versions version
  ON version.daily_trade_analysis_id = analysis.daily_trade_analysis_id
  AND version.revision_number = analysis.current_revision
LEFT JOIN journal_round_trip_versions analyzed_version
  ON analyzed_version.workspace_id = analysis.workspace_id
  AND analyzed_version.account_id = analysis.account_id
  AND analyzed_version.round_trip_version_id = analysis.round_trip_version_id
LEFT JOIN journal_round_trip_daily_trade_execution_mismatch_sets mismatch_set
  ON mismatch_set.workspace_id = round_trip.workspace_id
  AND mismatch_set.account_id = round_trip.account_id
  AND mismatch_set.round_trip_id = round_trip.round_trip_id
  AND mismatch_set.round_trip_version_id = round_trip.current_version_id
WHERE round_trip.workspace_id = ? AND round_trip.account_id = ?
  AND round_trip.round_trip_id IN (${roundTripPlaceholders})
  AND round_trip.lifecycle_state = 'active'`);
    const snapshots = database.prepare<[string], AnalyzerSnapshotRow>(`SELECT
  event_kind, candle_time_utc_seconds, snapshot_json
FROM journal_round_trip_daily_trade_analysis_event_snapshots
WHERE daily_trade_analysis_version_id = ?
ORDER BY COALESCE(json_extract(snapshot_json, '$.event.sequence'), candle_time_utc_seconds), candle_time_utc_seconds`);
    const mismatches = database.prepare<[string], AnalyzerMismatchRow>(`SELECT
  execution_id, side, executed_at_utc, quantity_decimal, entered_price_decimal,
  candle_time_utc_seconds, mismatch_kind, candle_low_decimal, candle_high_decimal
FROM journal_round_trip_daily_trade_execution_mismatches
WHERE execution_mismatch_set_id = ?
ORDER BY execution_sequence, execution_id`);
    const paths = database.prepare<[string], {
      favorable_move_decimal: string | null;
      minutes_after_exit: 5 | 15 | 30 | 60;
      observed_at_candle_time_utc_seconds: number | null;
    }>(`SELECT minutes_after_exit, favorable_move_decimal, observed_at_candle_time_utc_seconds
FROM journal_round_trip_daily_trade_analysis_post_exit_paths
WHERE daily_trade_analysis_version_id = ?
ORDER BY minutes_after_exit`);
    const candles = database.prepare<[string], {
      candle_time_utc_seconds: number;
      close_decimal: string;
      high_decimal: string;
      low_decimal: string;
      open_decimal: string;
      turnover_decimal: string | null;
      volume_decimal: string;
    }>(`SELECT candle_time_utc_seconds, open_decimal, high_decimal, low_decimal, close_decimal, volume_decimal,
  ${turnoverSelection}
FROM level_analysis_market_session_candles
WHERE market_session_set_version_id = ?
ORDER BY candle_time_utc_seconds`);
    const result = new Map<string, DaySessionTradeAnalyzer>();
    const analysisByRoundTripId = new Map(
      analysisForRoundTrips.all(scope.workspaceId, activeAccountId, ...roundTripIds)
        .map((analysis) => [analysis.round_trip_id, analysis] as const),
    );
    for (const roundTripId of roundTripIds) {
      const analysis = analysisByRoundTripId.get(roundTripId);
      if (!analysis) continue;
      if (analysis.execution_mismatch_set_id) {
        result.set(roundTripId, {
          availableAtUtc: null,
          candles: [],
          detailLoaded: true,
          detailVersionRef: analysis.current_round_trip_version_id,
          events: [],
          executionMismatchSetId: analysis.execution_mismatch_set_id,
          executionMismatches: mismatches.all(analysis.execution_mismatch_set_id).map((mismatch) => ({
            candleHigh: mismatch.candle_high_decimal,
            candleLow: mismatch.candle_low_decimal,
            candleTime: mismatch.candle_time_utc_seconds,
            enteredPrice: mismatch.entered_price_decimal,
            executedAt: mismatch.executed_at_utc,
            executionId: mismatch.execution_id,
            kind: mismatch.mismatch_kind,
            quantity: mismatch.quantity_decimal,
            side: mismatch.side,
          })),
          finalExitPaths: [],
          greenToRed: UNAVAILABLE_DAILY_TRADE_GREEN_TO_RED_ANALYSIS,
          mismatchBrokerConfirmed: analysis.mismatch_broker_confirmed === 1,
          status: "execution_mismatch",
        });
        continue;
      }
      if (
        !analysis.daily_trade_analysis_version_id ||
        !analysis.status ||
        !analysis.analysis_projection_fingerprint_sha256 ||
        analysis.analysis_projection_fingerprint_sha256 !==
          analysis.current_projection_fingerprint_sha256
      ) {
        if (analysis.has_pending_job === 1) {
          result.set(roundTripId, {
            candles: [],
            detailLoaded: true,
            detailVersionRef: analysis.current_round_trip_version_id,
            events: [],
            executionMismatchSetId: null,
            executionMismatches: [],
            finalExitPaths: [],
            greenToRed: UNAVAILABLE_DAILY_TRADE_GREEN_TO_RED_ANALYSIS,
            availableAtUtc: analysis.pending_ready_at_utc,
            mismatchBrokerConfirmed: false,
            status: "pending",
          });
        }
        continue;
      }
      if (!options.includeDetails) {
        result.set(roundTripId, {
          availableAtUtc: analysis.pending_ready_at_utc,
          candles: [],
          detailLoaded: false,
          detailVersionRef: analysis.current_round_trip_version_id,
          events: [],
          executionMismatchSetId: null,
          executionMismatches: [],
          finalExitPaths: [],
          greenToRed: UNAVAILABLE_DAILY_TRADE_GREEN_TO_RED_ANALYSIS,
          mismatchBrokerConfirmed: false,
          status: analysis.status,
        });
        continue;
      }
      const persistedEventViews = snapshots.all(analysis.daily_trade_analysis_version_id)
        .map(analyzerSnapshotView)
        .filter((snapshot): snapshot is DaySessionTradeAnalyzer["events"][number] => snapshot !== null);
      const candleViews = analysis.market_session_set_version_id
        ? candles.all(analysis.market_session_set_version_id).map((candle) => ({
            close: candle.close_decimal,
            high: candle.high_decimal,
            low: candle.low_decimal,
            open: candle.open_decimal,
            time: candle.candle_time_utc_seconds,
            turnover: candle.turnover_decimal,
            volume: candle.volume_decimal,
          }))
        : [];
      const eventViews = withExecutionPatternContexts(
        candleViews.map((candle) => ({
          close: Number(candle.close),
          high: Number(candle.high),
          low: Number(candle.low),
          open: Number(candle.open),
          time: candle.time,
          turnover: candle.turnover === null ? null : Number(candle.turnover),
          volume: Number(candle.volume),
        })),
        persistedEventViews,
      );
      const hasCompleteExecutionCoverage = eventViews.length > 0 &&
        eventViews.every((event) => event.candleTime !== null && event.indicators !== null);
      const direction = directionByRoundTripId.get(roundTripId);
      if (!direction) continue;
      const storedPath = readDailyTradePathMaterialization(
        database,
        analysis.daily_trade_analysis_version_id,
      );
      result.set(roundTripId, {
        availableAtUtc: analysis.pending_ready_at_utc,
        candles: candleViews,
        detailLoaded: true,
        detailVersionRef: analysis.current_round_trip_version_id,
        events: eventViews,
        executionMismatchSetId: null,
        executionMismatches: [],
        finalExitPaths: paths.all(analysis.daily_trade_analysis_version_id).map((path) => ({
          favorableMove: path.favorable_move_decimal,
          minutesAfterExit: path.minutes_after_exit,
          observedAt: path.observed_at_candle_time_utc_seconds,
        })),
        greenToRed: storedPath?.path ?? analyzeDailyTradeGreenToRed({
          candles: candleViews.map((candle) => ({
            closeDecimal: candle.close,
            time: candle.time,
          })),
          direction,
          events: eventViews.map((event) => ({
            eventId: event.eventId,
            executedAtUtc: event.executedAt,
            feesDecimal: event.fees,
            kind: event.kind,
            priceDecimal: event.price,
            quantityDecimal: event.quantity,
            sequence: event.sequence,
          })),
        }),
        mismatchBrokerConfirmed: false,
        status: analysis.status === "ready" && !hasCompleteExecutionCoverage
          ? "no_coverage"
          : analysis.status,
      });
    }
    return result;
  });
}

function scaleReportingDecimal(value: string | null, multiplier: string): string | null {
  return value === null ? null : new Decimal(value).times(multiplier).toString();
}

function scaleReportingNumber(value: number | null, multiplier: string): number | null {
  return value === null ? null : new Decimal(value).times(multiplier).toNumber();
}

function scaleReferenceDistance<Reference extends {
  anchor: string;
  signedDistance: string;
  signedDistancePercent: number;
}>(reference: Reference | null, multiplier: string): Reference | null {
  return reference === null
    ? null
    : Object.freeze({
        ...reference,
        anchor: scaleReportingDecimal(reference.anchor, multiplier)!,
        signedDistance: scaleReportingDecimal(reference.signedDistance, multiplier)!,
      });
}

export function scaleDaySessionTradeAnalyzer(
  analyzer: DaySessionTradeAnalyzer,
  multiplier: string,
): DaySessionTradeAnalyzer {
  if (multiplier === "1") return analyzer;
  const scaleFiveMinute = (
    context: DaySessionTradeAnalyzer["events"][number]["fiveMinuteContext"],
  ): DaySessionTradeAnalyzer["events"][number]["fiveMinuteContext"] => Object.freeze({
    completedBeforeExecution: context.completedBeforeExecution === null
      ? null
      : Object.freeze({
          ...context.completedBeforeExecution,
          ema9Distance: scaleReferenceDistance(
            context.completedBeforeExecution.ema9Distance,
            multiplier,
          ),
          turnover: scaleReportingDecimal(
            context.completedBeforeExecution.turnover,
            multiplier,
          ),
        }),
    containingCandle: context.containingCandle === null
      ? null
      : Object.freeze({
          ...context.containingCandle,
          ema9Distance: scaleReferenceDistance(
            context.containingCandle.ema9Distance,
            multiplier,
          ),
          executionEdgeDistance: scaleReportingDecimal(
            context.containingCandle.executionEdgeDistance,
            multiplier,
          ),
          turnover: scaleReportingDecimal(context.containingCandle.turnover, multiplier),
        }),
    preExecutionPartial: context.preExecutionPartial === null
      ? null
      : Object.freeze({
          ...context.preExecutionPartial,
          turnover: scaleReportingDecimal(context.preExecutionPartial.turnover, multiplier),
        }),
  });
  const scaleGreenToRed = (
    analysis: DaySessionTradeAnalyzer["greenToRed"],
  ): DaySessionTradeAnalyzer["greenToRed"] => Object.freeze({
    ...analysis,
    completedClosePeakPnlDecimal: scaleReportingDecimal(
      analysis.completedClosePeakPnlDecimal,
      multiplier,
    ),
    finalPnlDecimal: scaleReportingDecimal(analysis.finalPnlDecimal, multiplier),
    firstRedPnlDecimal: scaleReportingDecimal(analysis.firstRedPnlDecimal, multiplier),
    peakPnlDecimal: scaleReportingDecimal(analysis.peakPnlDecimal, multiplier),
    peakToFinalReversalDecimal: scaleReportingDecimal(
      analysis.peakToFinalReversalDecimal,
      multiplier,
    ),
    peakToRedReversalDecimal: scaleReportingDecimal(
      analysis.peakToRedReversalDecimal,
      multiplier,
    ),
    profitOpportunities: Object.freeze(analysis.profitOpportunities.map((opportunity) =>
      Object.freeze({
        ...opportunity,
        lowestPnlDecimal: scaleReportingDecimal(opportunity.lowestPnlDecimal, multiplier)!,
        peakPnlDecimal: scaleReportingDecimal(opportunity.peakPnlDecimal, multiplier)!,
        peakToFinalReversalDecimal: scaleReportingDecimal(
          opportunity.peakToFinalReversalDecimal,
          multiplier,
        )!,
      }))),
    profitOpportunityThresholdDecimal: scaleReportingDecimal(
      analysis.profitOpportunityThresholdDecimal,
      multiplier,
    ),
    strongOpportunityThresholdDecimal: scaleReportingDecimal(
      analysis.strongOpportunityThresholdDecimal,
      multiplier,
    ),
  });
  return Object.freeze({
    ...analyzer,
    candles: analyzer.candles.map((candle) => Object.freeze({
      ...candle,
      close: scaleReportingDecimal(candle.close, multiplier)!,
      high: scaleReportingDecimal(candle.high, multiplier)!,
      low: scaleReportingDecimal(candle.low, multiplier)!,
      open: scaleReportingDecimal(candle.open, multiplier)!,
      turnover: scaleReportingDecimal(candle.turnover, multiplier),
    })),
    events: analyzer.events.map((event) => Object.freeze({
      ...event,
      fees: scaleReportingDecimal(event.fees, multiplier),
      fiveMinuteContext: scaleFiveMinute(event.fiveMinuteContext),
      indicators: event.indicators === null
        ? null
        : Object.freeze({
            ...event.indicators,
            adr20: scaleReportingNumber(event.indicators.adr20, multiplier),
            atr14: scaleReportingNumber(event.indicators.atr14, multiplier),
            ema9: scaleReportingNumber(event.indicators.ema9, multiplier),
            ema20: scaleReportingNumber(event.indicators.ema20, multiplier),
            macd: scaleReportingNumber(event.indicators.macd, multiplier),
            macdHistogram: scaleReportingNumber(event.indicators.macdHistogram, multiplier),
            macdSignal: scaleReportingNumber(event.indicators.macdSignal, multiplier),
            vwap: scaleReportingNumber(event.indicators.vwap, multiplier),
          }),
      metrics: Object.freeze({
        ...event.metrics,
        averageEntryPriceAfter: scaleReportingDecimal(
          event.metrics.averageEntryPriceAfter,
          multiplier,
        ),
        candleTurnover: scaleReportingDecimal(event.metrics.candleTurnover, multiplier),
        cumulativeSessionTurnover: scaleReportingDecimal(
          event.metrics.cumulativeSessionTurnover,
          multiplier,
        ),
        ema9Distance: scaleReferenceDistance(event.metrics.ema9Distance, multiplier),
        executionEdgeDistance: scaleReportingDecimal(
          event.metrics.executionEdgeDistance,
          multiplier,
        ),
        excursionUntilFlat: event.metrics.excursionUntilFlat === null
          ? null
          : Object.freeze({
              ...event.metrics.excursionUntilFlat,
              adverseMove: scaleReportingDecimal(
                event.metrics.excursionUntilFlat.adverseMove,
                multiplier,
              )!,
              favorableMove: scaleReportingDecimal(
                event.metrics.excursionUntilFlat.favorableMove,
                multiplier,
              )!,
            }),
        givebackFromPriorFavorableExtreme: scaleReportingDecimal(
          event.metrics.givebackFromPriorFavorableExtreme,
          multiplier,
        ),
        postEventPaths: event.metrics.postEventPaths.map((path) => Object.freeze({
          ...path,
          oppositeDirectionMove: scaleReportingDecimal(path.oppositeDirectionMove, multiplier),
          tradeDirectionMove: scaleReportingDecimal(path.tradeDirectionMove, multiplier),
        })),
        priorFavorableExtremePrice: scaleReportingDecimal(
          event.metrics.priorFavorableExtremePrice,
          multiplier,
        ),
        vwapDistance: scaleReferenceDistance(event.metrics.vwapDistance, multiplier),
      }),
      price: scaleReportingDecimal(event.price, multiplier)!,
    })),
    executionMismatches: analyzer.executionMismatches.map((mismatch) => Object.freeze({
      ...mismatch,
      candleHigh: scaleReportingDecimal(mismatch.candleHigh, multiplier),
      candleLow: scaleReportingDecimal(mismatch.candleLow, multiplier),
      enteredPrice: scaleReportingDecimal(mismatch.enteredPrice, multiplier)!,
    })),
    finalExitPaths: analyzer.finalExitPaths.map((path) => Object.freeze({
      ...path,
      favorableMove: scaleReportingDecimal(path.favorableMove, multiplier),
    })),
    greenToRed: scaleGreenToRed(analyzer.greenToRed),
  });
}

export function getReplacementDailyTradeAnalyzerReplay(
  scope: WorkspaceAccessScope,
  input: Readonly<{
    direction: "long" | "short";
    roundTripId: string;
    roundTripVersionId?: string;
  }>,
): DaySessionTradeAnalyzer | null {
  const analyzer = readDailyTradeAnalyzers(scope, [input]).get(input.roundTripId) ?? null;
  return input.roundTripVersionId && analyzer?.detailVersionRef !== input.roundTripVersionId
    ? null
    : analyzer;
}

function annotationSnapshot(
  service: JournalAnnotationService,
  account: Parameters<JournalAnnotationService["listTags"]>[0],
  model: JournalTradingDayReadModel,
  swingRoundTripIds: ReadonlySet<string>,
): AnnotationSnapshot {
  const roundTripsById = new Map<string, { id: string; label: string }>(model.tickers.flatMap((ticker) =>
    ticker.roundTrips.map((roundTrip, index) => [
      roundTrip.roundTripId,
      { id: roundTrip.roundTripId, label: `${ticker.symbol} trade ${index + 1}` },
    ] as const)));
  for (const position of model.openPositions) {
    if (!roundTripsById.has(position.roundTripId)) {
      roundTripsById.set(position.roundTripId, {
        id: position.roundTripId,
        label: `${position.symbol} open position`,
      });
    }
  }
  const roundTrips = [...roundTripsById.values()];
  const roundTripIds = roundTrips.map((roundTrip) => roundTrip.id);
  const tradingDayId = service.resolveTradingDayId(account, model.date);
  const reviews = tradingDayId
    ? service.listRuleReviews(account, { tradingDayId, roundTripIds })
    : [];
  const byReviewTarget = new Map(reviews.map((review) => [
    `${review.ruleId}:${review.targetKind}:${review.tradingDayId ?? review.roundTripId}`,
    review,
  ]));
  const rangeStart = `${model.date}T00:00:00.000Z`;
  const rangeEndDate = new Date(rangeStart);
  rangeEndDate.setUTCDate(rangeEndDate.getUTCDate() + 2);
  const rules = service.listRulesForEvaluation(account, rangeStart, rangeEndDate.toISOString());
  const automaticResults = evaluateJournalPresetRules(
    rules,
    model,
    swingRoundTripIds,
  );
  const toRule = (
    rule: JournalRuleRecord,
    applicability: "day" | "trade",
    targetRoundTripKey: string | null,
    targetLabel: string | null,
    automaticStatus?: Extract<DaySessionRule["status"], "followed" | "broken" | "n/a">,
    automaticEvidence?: import("@/src/modules/journal/server/annotations/journal-preset-rule-evaluator").JournalPresetRuleEvidence,
  ): DaySessionRule => {
    const targetKind = applicability === "day" ? "trading_day" : "round_trip";
    const targetId = applicability === "day" ? tradingDayId : targetRoundTripKey;
    const review = targetId
      ? byReviewTarget.get(`${rule.ruleId}:${targetKind}:${targetId}`)
      : undefined;
    return {
      applicability,
      custom: rule.sourceKind === "custom",
      evidence: automaticEvidence ? {
        feeCoverage: automaticEvidence.feeCoverage,
        limitation: automaticEvidence.limitation,
        trigger: automaticEvidence.trigger ? {
          kind: automaticEvidence.trigger.kind,
          netPnl: automaticEvidence.trigger.netPnlDecimal,
          occurredAt: automaticEvidence.trigger.occurredAtUtc,
          roundTripKey: automaticEvidence.trigger.roundTripId,
          valueAfter: automaticEvidence.trigger.valueAfter,
          valueBefore: automaticEvidence.trigger.valueBefore,
        } : null,
        violations: automaticEvidence.violations.map((item) => ({
          kind: item.kind,
          netPnl: item.netPnlDecimal,
          occurredAt: item.occurredAtUtc,
          roundTripKey: item.roundTripId,
          valueAfter: item.valueAfter,
          valueBefore: item.valueBefore,
        })),
      } : null,
      label: rule.title,
      note: review?.note ?? "",
      revision: review ? String(review.revision) : null,
      ruleId: rule.ruleId,
      ruleVersion: rule.versionId,
      status: automaticStatus ?? reviewStatus(review),
      targetLabel,
      targetRoundTripKey,
    };
  };
  const customRules = rules.filter((rule) => rule.sourceKind === "custom");
  const rulesById = new Map(rules.map((rule) => [`${rule.ruleId}:${rule.versionId}`, rule]));
  const dayRules = customRules
    .filter((rule) => rule.reviewScope === "day" || rule.reviewScope === "both")
    .map((rule) => toRule(rule, "day", null, null));
  const tradeRules = customRules
    .filter((rule) => rule.reviewScope === "trade" || rule.reviewScope === "both")
    .flatMap((rule) => roundTrips.flatMap((roundTrip) => {
      const trade = model.tickers.flatMap((ticker) => ticker.roundTrips)
        .find((candidate) => candidate.roundTripId === roundTrip.id);
      if (!trade || trade.entryAtUtc < rule.effectiveFromUtc ||
          (rule.effectiveUntilUtc && trade.entryAtUtc >= rule.effectiveUntilUtc) ||
          (rule.activeIntervals && !rule.activeIntervals.some((interval) =>
            trade.entryAtUtc >= interval.fromUtc && (!interval.untilUtc || trade.entryAtUtc < interval.untilUtc)))) return [];
      return [toRule(rule, "trade", roundTrip.id, roundTrip.label)];
    }));
  for (const result of automaticResults) {
    const rule = rulesById.get(`${result.ruleId}:${result.ruleVersionId}`);
    if (!rule) continue;
    if (result.targetKind === "trading_day") {
      dayRules.push(toRule(rule, "day", null, null, result.status, result.evidence));
      continue;
    }
    const target = roundTripsById.get(result.targetRoundTripId ?? "");
    if (target) {
      tradeRules.push(toRule(
        rule,
        "trade",
        target.id,
        target.label,
        result.status,
        result.evidence,
      ));
    }
  }
  return Object.freeze({
    currentFocus: service.readCurrentFocus(account, model.date),
    dailyNote: service.readDailyNote(account, model.date),
    roundTripNotes: service.readRoundTripNotes(account, roundTripIds),
    rules: Object.freeze([...dayRules, ...tradeRules]),
    tags: service.listTags(account),
    tagsByRoundTrip: service.listTagsForRoundTrips(account, roundTripIds),
    weekNotes: Object.freeze(Object.fromEntries(model.week.days.map((day) => [
      day.date,
      service.readDailyNote(account, day.date),
    ]))),
  });
}

function toDaySessionData(
  model: JournalTradingDayReadModel,
  annotations: AnnotationSnapshot,
  expectedAccountSelectionRef: string,
  trackedPositions: ReadonlyMap<string, Readonly<{
    positionRef: string;
    style: import("@/src/modules/journal/contracts/journal-trade-style-contracts").JournalTradeStyleRecord | null;
  }>>,
  openPositionDetails: ReadonlyMap<string, JournalTrackedPositionDetail>,
  editableManualExecutions: ReadonlyMap<string, JournalEditableManualExecution>,
  analyzers: ReadonlyMap<string, DaySessionTradeAnalyzer>,
  review: Readonly<{
    revision: number | null;
    status: "reviewed" | "incomplete" | null;
    unclassifiedOpenPositionCount: number;
    updatedAtUtc: string | null;
  }>,
): DaySessionData | null {
  if (model.currency === null) return null;
  const rulesByRoundTrip = new Map<string, DaySessionRule[]>();
  for (const rule of annotations.rules) {
    if (!rule.targetRoundTripKey) continue;
    rulesByRoundTrip.set(rule.targetRoundTripKey, [
      ...(rulesByRoundTrip.get(rule.targetRoundTripKey) ?? []),
      rule,
    ]);
  }
  return {
    availableTags: annotations.tags.map(tagView),
    availableSessionDates: [...model.availableTradingDates],
    currency: model.currency,
    dailyNote: noteView(annotations.dailyNote, annotations.currentFocus),
    date: model.date,
    decisionActivity: model.decisionActivity.map((item) => ({
      direction: item.direction,
      executionCount: item.executionCountOnDate,
      openedAt: item.openedAtUtc,
      reasonCodes: item.reasonCodes,
      roundTripKey: item.roundTripId,
      symbol: item.symbol,
    })),
    executionActivity: model.executionActivity.map((execution) => ({
      analysisEventKey: execution.executionId,
      executedAt: execution.executedAtUtc,
      executionKey: execution.executionVersionId,
      manualEdit: (() => {
        const editable = editableManualExecutions.get(execution.executionId);
        return editable
          ? {
              editRef: editable.editRef,
              fees: editable.feesDecimal,
              localDate: editable.localDate,
              localTime: editable.localTime,
              sourcePrice: editable.priceDecimal,
              sourceTimezone: editable.sourceTimezone,
              tradeCurrency: editable.tradeCurrency,
            }
          : null;
      })(),
      needsDecision: execution.needsDecision,
      price: execution.priceDecimal,
      quantity: execution.quantityDecimal,
      roundTripKeys: execution.roundTripIds,
      side: execution.side,
      symbol: execution.symbol,
    })),
    expectedAccountSelectionRef,
    factSetRevisionSha256: model.factSetRevisionSha256,
    netPnl: model.netPnlDecimal,
    needsDecisionCount: model.coverage.needsDecisionCount,
    nextSessionDate: model.nextTradingDate,
    openPositions: model.openPositions.map((position) => {
      const tracked = trackedPositions.get(position.roundTripId) ?? null;
      const detail = openPositionDetails.get(position.roundTripId) ?? null;
      const note = annotations.roundTripNotes[position.roundTripId] ?? null;
      const positionRules = rulesByRoundTrip.get(position.roundTripId) ?? [];
      return {
        averageEntryPrice: position.averageEntryPriceDecimal,
        direction: position.direction,
        executions: (detail?.executions ?? []).map((execution) => {
          const editable = editableManualExecutions.get(execution.executionId);
          return {
            analysisEventKey: execution.executionId,
            executedAt: execution.executedAtUtc,
            executionKey: execution.executionId,
            manualEdit: editable
              ? {
                  editRef: editable.editRef,
                  fees: editable.feesDecimal,
                  localDate: editable.localDate,
                  localTime: editable.localTime,
                  sourcePrice: editable.priceDecimal,
                  sourceTimezone: editable.sourceTimezone,
                  tradeCurrency: editable.tradeCurrency,
                }
              : null,
            needsDecision: false,
            price: execution.priceDecimal,
            quantity: execution.quantityDecimal,
            roundTripKeys: [position.roundTripId],
            side: execution.side,
            symbol: position.symbol,
          };
        }),
        journal: {
          noteRevision: note ? String(note.revision) : null,
          ruleStatus: positionRules.some((rule) => rule.status === "broken")
            ? "broken"
            : positionRules.some((rule) => rule.status === "followed")
              ? "followed"
              : "not-reviewed",
          ruleSummary: positionRules.length === 0
            ? "No active trade rules"
            : `${positionRules.length} trader review${positionRules.length === 1 ? "" : "s"}`,
          tags: (annotations.tagsByRoundTrip[position.roundTripId] ?? []).map(tagView),
          technicalNote: "",
          tradeNote: note?.tradeNote ?? "",
        },
        openedAt: position.openedAtUtc,
        positionKey: position.roundTripId,
        positionRef: tracked?.positionRef ?? null,
        remainingQuantity: position.remainingQuantityDecimal,
        stableInstrumentKey: position.instrumentId,
        style: tracked?.style ?? null,
        symbol: position.symbol,
        timezone: position.timezone,
      };
    }),
    positionSnapshots: model.positionSnapshots.map((position) => ({
      averageEntryPrice: position.averageEntryPriceDecimal,
      closingQuantity: position.closingQuantityDecimal,
      direction: position.direction,
      openingQuantity: position.openingQuantityDecimal,
      positionKey: position.roundTripId,
      state: position.state,
      symbol: position.symbol,
    })),
    previousSessionDate: model.previousTradingDate,
    review,
    rules: [...annotations.rules],
    tickers: model.tickers.map((ticker) => ({
      gainLossPercent: ticker.gainLossPercentDecimal,
      netPnl: ticker.netPnlDecimal,
      roundTrips: ticker.roundTrips.map((roundTrip) => {
        const note = annotations.roundTripNotes[roundTrip.roundTripId] ?? null;
        const tradeRules = rulesByRoundTrip.get(roundTrip.roundTripId) ?? [];
        const aggregateStatus = tradeRules.some((rule) => rule.status === "broken")
          ? "broken"
          : tradeRules.some((rule) => rule.status === "followed")
            ? "followed"
            : "not-reviewed";
        return {
          analyzer: analyzers.get(roundTrip.roundTripId) ?? null,
          direction: roundTrip.direction,
          entryAt: roundTrip.entryAtUtc,
          entryPrice: roundTrip.entryPriceDecimal,
          exitAt: roundTrip.exitAtUtc,
          exitPrice: roundTrip.exitPriceDecimal,
          gainLossPercent: roundTrip.gainLossPercentDecimal,
          journal: {
            noteRevision: note ? String(note.revision) : null,
            ruleStatus: aggregateStatus,
            ruleSummary: tradeRules.length === 0
              ? "No active trade rules"
              : `${tradeRules.length} trader review${tradeRules.length === 1 ? "" : "s"}`,
            tags: (annotations.tagsByRoundTrip[roundTrip.roundTripId] ?? []).map(tagView),
            technicalNote: note?.technicalNote ?? "",
            tradeNote: note?.tradeNote ?? "",
          },
          netPnl: roundTrip.netPnlDecimal,
          roundTripKey: roundTrip.roundTripId,
          timezone: roundTrip.timezone,
        };
      }),
      stableInstrumentKey: ticker.instrumentId,
      symbol: ticker.symbol,
    })),
    timezone: model.timezone ?? "America/New_York",
    week: {
      currentSessionDate: model.latestTradingDate ?? model.date,
      days: model.week.days.map((day) => ({
        date: day.date,
        dailyNote: noteView(annotations.weekNotes[day.date] ?? null),
        netPnl: day.netPnlDecimal,
        tickerCount: day.tickerCount,
        tradeCount: day.tradeCount,
      })),
      netPnl: model.week.netPnlDecimal,
      tickerCount: model.week.tickerCount,
      tradeCount: model.week.tradeCount,
    },
  };
}

function buildReplacementDaySession(
  scope: WorkspaceAccessScope,
  model: JournalTradingDayReadModel,
  reportingContext: JournalReportingCurrencyContext | null,
): DaySessionData | null {
  if (model.currency === null) return null;
  const trackerState = withReadonlyJournalIntegrityRuntime(scope, (journal) => {
    const account = journal.tradeStyles.accountScope(scope);
    const trackedPositions = new Map(journal.tradeStyles.listPositionRecords(account).map((position) => {
      return [position.row.roundTripId, {
        positionRef: position.positionRef,
        style: position.style,
      }] as const;
    }));
    const editableManualExecutions = new Map(
      journal.manualExecutionEdits.listEditable(
        account,
        model.executionActivity.map((execution) => execution.executionId),
      ).map((execution) => [
        execution.executionId,
        execution,
      ] as const),
    );
    const openPositionDetails = new Map(model.openPositions.flatMap((position) => {
      const tracked = trackedPositions.get(position.roundTripId);
      if (!tracked) return [];
      const detail = journal.tradeTrackerReads.positionDetailForRoundTrip(
        account,
        position.roundTripId,
        model.date,
      );
      const sourceCurrency = reportingContext?.sourceCurrencyByRoundTrip
        .get(position.roundTripId);
      const sourceDate = reportingContext?.sourceDateByRoundTrip
        .get(position.roundTripId);
      const multiplier = reportingContext && sourceCurrency && sourceDate
        ? journalReportingCurrencyMultiplier(sourceCurrency, sourceDate, reportingContext)
        : "1";
      return [[
        position.roundTripId,
        multiplier === "1"
          ? detail
          : Object.freeze({
              ...detail,
              executions: Object.freeze(detail.executions.map((execution) => Object.freeze({
                ...execution,
                feesDecimal: scaleReportingDecimal(execution.feesDecimal, multiplier),
                priceDecimal: scaleReportingDecimal(execution.priceDecimal, multiplier),
              }))),
            }),
      ] as const];
    }));
    const review = journal.tradingDayReviews.read(account, model.date);
    return Object.freeze({
      editableManualExecutions,
      openPositionDetails,
      review: Object.freeze({
        revision: review?.revision ?? null,
        status: review?.status ?? null,
        unclassifiedOpenPositionCount:
          journal.tradingDayReviews.unclassifiedOpenPositionCount(account, model.date),
        updatedAtUtc: review?.updatedAtUtc ?? null,
      }),
      trackedPositions,
    });
  });
  const swingRoundTripIds = new Set(
    [...trackerState.trackedPositions.entries()]
      .filter(([, position]) => position.style?.tradeStyle === "swing")
      .map(([roundTripId]) => roundTripId),
  );
  const annotations = withReadonlyJournalAnnotations(scope, (service, account) =>
    annotationSnapshot(service, account, model, swingRoundTripIds));
  const sourceAnalyzers = readDailyTradeAnalyzers(
    scope,
    model.tickers.flatMap((ticker) => ticker.roundTrips.map((roundTrip) => ({
      direction: roundTrip.direction,
      roundTripId: roundTrip.roundTripId,
    }))),
    { includeDetails: false },
  );
  const analyzers = reportingContext === null
    ? sourceAnalyzers
    : new Map([...sourceAnalyzers.entries()].map(([roundTripId, analyzer]) => {
        const sourceCurrency = reportingContext.sourceCurrencyByRoundTrip.get(roundTripId);
        const sourceDate = reportingContext.sourceDateByRoundTrip.get(roundTripId);
        const multiplier = sourceCurrency && sourceDate
          ? journalReportingCurrencyMultiplier(sourceCurrency, sourceDate, reportingContext)
          : "1";
        return [roundTripId, scaleDaySessionTradeAnalyzer(analyzer, multiplier)] as const;
      }));
  return toDaySessionData(
    model,
    annotations,
    currentJournalAccountSelectionRef(scope),
    trackerState.trackedPositions,
    trackerState.openPositionDetails,
    trackerState.editableManualExecutions,
    analyzers,
    trackerState.review,
  );
}

export function getReplacementDaySession(
  scope: WorkspaceAccessScope,
  input: Readonly<{
    date: string | null;
    currency: string | null;
  }>,
): DaySessionData | null {
  const model = withJournalAnalyticsDashboardRuntime(scope, ({ dashboard }) =>
    dashboard.getTradingDay(scope, {
      requestedDate: input.date,
      currency: input.currency,
    }));
  return buildReplacementDaySession(scope, model, null);
}

export async function getReplacementReportingDaySession(
  scope: WorkspaceAccessScope,
  input: Readonly<{ date: string | null }>,
): Promise<DaySessionData | null> {
  return withJournalAnalyticsReportingDashboardRuntime(
    scope,
    ({ dashboard, reportingContext, reportingCurrency }) => buildReplacementDaySession(
      scope,
      dashboard.getTradingDay(scope, {
        requestedDate: input.date,
        currency: reportingCurrency,
      }),
      reportingContext,
    ),
    { prefetchAllFactSet: true },
  );
}

export function getReplacementTradeTrackerAccount(
  scope: WorkspaceAccessScope,
): Readonly<{
  baseCurrency: string;
  tradingTimezone: string;
}> | null {
  if (!scope.activeAccountId) return null;
  return withReadonlyPlatformDatabase({}, (database) => {
    const account = new JournalAccountService(
      new JournalAccountRepository(database),
    ).requireAccountRecord(scope, scope.activeAccountId!);
    return Object.freeze({
      baseCurrency: account.baseCurrency,
      tradingTimezone: account.tradingTimezone,
    });
  });
}

function startOfTradingWeek(tradingDate: string): string {
  const date = new Date(`${tradingDate}T12:00:00.000Z`);
  const mondayOffset = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - mondayOffset);
  return date.toISOString().slice(0, 10);
}

function companionRule(rule: DaySessionRule): CoachAiDailyCompanionRule {
  return Object.freeze({
    title: rule.label.slice(0, 120),
    status: rule.status === "not-reviewed"
      ? "not_reviewed"
      : rule.status === "n/a"
        ? "n_a"
        : rule.status,
  });
}

function positionClassification(
  position: DaySessionData["openPositions"][number],
): CoachAiDailyCompanionContext["openPositions"][number]["savedClassification"] {
  if (position.style?.openStatus === "swing") return "swing";
  if (position.style?.openStatus === "unplanned_hold") return "bag_hold";
  if (position.style?.openStatus === "other") return "long_term";
  return "unclassified";
}

/** Builds bounded, server-derived context for one explicit Daily Tracker request. */
function buildReplacementDailyCompanionResolvedContext(
  scope: WorkspaceAccessScope,
  input: Readonly<{ tradingDate: string; currency: string | null }>,
  data: DaySessionData | null,
): CoachAiDailyCompanionResolvedContext | null {
  if (!data || data.date !== input.tradingDate) return null;

  let contextTruncated = false;
  const clip = (value: string, maximum: number): string => {
    if (value.length <= maximum) return value;
    contextTruncated = true;
    return value.slice(0, maximum);
  };
  const take = <Value,>(values: readonly Value[], maximum: number): readonly Value[] => {
    if (values.length > maximum) contextTruncated = true;
    return values.slice(0, maximum);
  };
  const focusRevisions = withReadonlyJournalAnnotations(scope, (service, account) =>
    service.listDailyFocusRevisions(
      account,
      startOfTradingWeek(input.tradingDate),
      input.tradingDate,
    ));
  const trades = data.tickers.flatMap((ticker) =>
    ticker.roundTrips.map((trade) => ({ ticker, trade })));
  const includedTradeRows = take(trades, 8);
  const includedTrades = includedTradeRows.map(({ ticker, trade }, index) => {
    const rules = data.rules.filter((rule) =>
      rule.applicability === "trade" && rule.targetRoundTripKey === trade.roundTripKey);
    return Object.freeze({
      tradeNumber: index + 1,
      ticker: ticker.symbol,
      direction: trade.direction,
      entryAtUtc: trade.entryAt,
      exitAtUtc: trade.exitAt,
      netPnlDecimal: trade.netPnl,
      gainLossPercentDecimal: trade.gainLossPercent,
      tradeNote: clip(trade.journal.tradeNote, 500),
      tags: Object.freeze(take(trade.journal.tags, 6).map((tag) => clip(tag.name, 60))),
      rules: Object.freeze(take(rules, 6).map(companionRule)),
    });
  });
  const includedFocusRevisions = take(focusRevisions, 6).map((revision) => Object.freeze({
    tradingDate: revision.tradingDate,
    currentFocuses: clip(revision.currentFocuses, 500),
  }));
  const includedDayRules = take(
    data.rules.filter((rule) => rule.applicability === "day"),
    16,
  ).map(companionRule);
  const includedOpenPositions = take(data.openPositions, 8).map((position) => Object.freeze({
    ticker: position.symbol,
    direction: position.direction,
    openedAtUtc: position.openedAt,
    remainingQuantityDecimal: position.remainingQuantity,
    savedClassification: positionClassification(position),
  }));
  const limitations = [
    ...(data.needsDecisionCount > 0
      ? [`${data.needsDecisionCount} item${data.needsDecisionCount === 1 ? "" : "s"} still need a trader decision.`]
      : []),
    ...(contextTruncated
      ? ["This day contains more saved detail than fits in one companion request."]
      : []),
  ];

  const context: CoachAiDailyCompanionContext = Object.freeze({
    contractVersion: COACH_AI_DAILY_COMPANION_CONTEXT_VERSION,
    kind: "daily_review",
    tradingDate: data.date,
    timezone: data.timezone,
    currency: data.currency,
    factSetRevisionSha256: data.factSetRevisionSha256,
    dayResult: Object.freeze({
      netPnlDecimal: data.netPnl,
      tradeCount: trades.length,
      tickerCount: data.tickers.length,
    }),
    review: Object.freeze({ status: data.review.status ?? "not_started" }),
    dailyNotes: Object.freeze({
      whatWorked: clip(data.dailyNote.whatWorked, 700),
      whatNeedsWork: clip(data.dailyNote.whatNeedsWork, 700),
      technicalRecap: clip(data.dailyNote.technicalRecap, 700),
      currentFocuses: clip(data.dailyNote.tomorrowsFocus, 900),
      anythingElse: clip(data.dailyNote.anythingElse, 700),
    }),
    focusRevisions: Object.freeze(includedFocusRevisions),
    dayRules: Object.freeze(includedDayRules),
    trades: Object.freeze(includedTrades),
    openPositions: Object.freeze(includedOpenPositions),
    coverage: Object.freeze({
      needsDecisionCount: data.needsDecisionCount,
      contextTruncated,
      limitations: Object.freeze(limitations),
    }),
  });
  return Object.freeze({
    context,
    dailyNoteRevision: data.dailyNote.revision === null
      ? null
      : Number(data.dailyNote.revision),
    trades: Object.freeze(includedTradeRows.map(({ ticker, trade }, index) => Object.freeze({
      tradeNumber: index + 1,
      roundTripId: trade.roundTripKey,
      noteRevision: trade.journal.noteRevision === null
        ? null
        : Number(trade.journal.noteRevision),
      ticker: ticker.symbol,
      direction: trade.direction,
    }))),
  });
}

export function getReplacementDailyCompanionResolvedContext(
  scope: WorkspaceAccessScope,
  input: Readonly<{ tradingDate: string; currency: string | null }>,
): CoachAiDailyCompanionResolvedContext | null {
  return buildReplacementDailyCompanionResolvedContext(
    scope,
    input,
    getReplacementDaySession(scope, {
      date: input.tradingDate,
      currency: input.currency,
    }),
  );
}

export async function getReplacementReportingDailyCompanionResolvedContext(
  scope: WorkspaceAccessScope,
  input: Readonly<{ tradingDate: string; currency: string | null }>,
): Promise<CoachAiDailyCompanionResolvedContext | null> {
  return buildReplacementDailyCompanionResolvedContext(
    scope,
    input,
    await getReplacementReportingDaySession(scope, {
      date: input.tradingDate,
    }),
  );
}

export function getReplacementDailyCompanionContext(
  scope: WorkspaceAccessScope,
  input: Readonly<{ tradingDate: string; currency: string | null }>,
): CoachAiDailyCompanionContext | null {
  return getReplacementDailyCompanionResolvedContext(scope, input)?.context ?? null;
}

export function getReplacementSwingTrackerPositions(
  scope: WorkspaceAccessScope,
  reviewDate: string,
): Readonly<{
  active: readonly JournalTrackedPosition[];
  completed: readonly JournalTrackedPosition[];
}> {
  return withReadonlyJournalIntegrityRuntime(scope, (journal) =>
    journal.tradeTrackerReads.listSwings(
      journal.tradeStyles.accountScope(scope),
      reviewDate,
    ));
}

function getReplacementSwingPositionSourceDetail(
  scope: WorkspaceAccessScope,
  positionRef: string,
  reviewDate: string,
): Readonly<{
  detail: ReplacementSwingPositionSourceDetail;
  roundTripId: string;
}> {
  const state = withReadonlyJournalIntegrityRuntime(scope, (journal) => {
    const account = journal.tradeStyles.accountScope(scope);
    const position = journal.tradeStyles.resolvePosition(account, positionRef);
    const detail = journal.tradeTrackerReads.swingDetail(
      account,
      positionRef,
      reviewDate,
    );
    const editableByExecutionId = new Map(
      journal.manualExecutionEdits.listEditable(account).map((execution) => [
        execution.executionId,
        execution,
      ] as const),
    );
    return Object.freeze({
      roundTripId: position.roundTripId,
      publicDetail: Object.freeze({
      ...detail,
      executions: Object.freeze(detail.executions.map((execution) => {
        const editable = editableByExecutionId.get(execution.executionId);
        return Object.freeze({
          allocationRole: execution.allocationRole,
          executedAtUtc: execution.executedAtUtc,
          feesDecimal: execution.feesDecimal,
          manualEdit: editable
            ? Object.freeze({
                editRef: editable.editRef,
                fees: editable.feesDecimal,
                localDate: editable.localDate,
                localTime: editable.localTime,
                sourcePrice: editable.priceDecimal,
                sourceTimezone: editable.sourceTimezone,
                tradeCurrency: editable.tradeCurrency,
              })
            : null,
          priceDecimal: execution.priceDecimal,
          quantityDecimal: execution.quantityDecimal,
          side: execution.side,
          sourceTimestampText: execution.sourceTimestampText,
        });
      })),
      }),
    });
  });
  const annotations = withReadonlyJournalAnnotations(scope, (service, account) => {
    const reviews = service.listRuleReviews(account, {
      tradingDayId: "",
      roundTripIds: [state.roundTripId],
    });
    const reviewByRuleId = new Map(reviews.map((review) => [review.ruleId, review]));
    return Object.freeze({
      availableTags: Object.freeze(service.listTags(account).map(tagView)),
      rules: Object.freeze(service.listRules(account)
        .filter((rule) => rule.lifecycleState === "active" &&
          (rule.reviewScope === "trade" || rule.reviewScope === "both"))
        .map((rule): DaySessionRule => {
          const review = reviewByRuleId.get(rule.ruleId);
          return {
            applicability: "trade",
            custom: rule.sourceKind === "custom",
            evidence: null,
            label: rule.title,
            note: review?.note ?? "",
            revision: review ? String(review.revision) : null,
            ruleId: rule.ruleId,
            ruleVersion: rule.versionId,
            status: reviewStatus(review),
            targetLabel: state.publicDetail.symbol,
            targetRoundTripKey: null,
          };
        })),
      tags: Object.freeze((service.listTagsForRoundTrips(account, [state.roundTripId])[
        state.roundTripId
      ] ?? []).map(tagView)),
    });
  });
  return Object.freeze({
    detail: Object.freeze({
      ...state.publicDetail,
      ...annotations,
    }),
    roundTripId: state.roundTripId,
  });
}

export async function getReplacementSwingPositionDetail(
  scope: WorkspaceAccessScope,
  positionRef: string,
  reviewDate: string,
): Promise<ReplacementSwingPositionDetail> {
  return withJournalAnalyticsReportingDashboardRuntime(
    scope,
    ({ reportingContext, reportingCurrency }) => {
      const source = getReplacementSwingPositionSourceDetail(
        scope,
        positionRef,
        reviewDate,
      );
      const sourceCurrency = reportingContext.sourceCurrencyByRoundTrip
        .get(source.roundTripId);
      const sourceDate = reportingContext.sourceDateByRoundTrip
        .get(source.roundTripId);
      const multiplier = sourceCurrency && sourceDate
        ? journalReportingCurrencyMultiplier(sourceCurrency, sourceDate, reportingContext)
        : "1";
      return Object.freeze({
        ...source.detail,
        averageEntryPriceDecimal: scaleReportingDecimal(
          source.detail.averageEntryPriceDecimal,
          multiplier,
        ),
        currency: reportingCurrency,
        executions: Object.freeze(source.detail.executions.map((execution) => Object.freeze({
          ...execution,
          reportingFeesDecimal: scaleReportingDecimal(execution.feesDecimal, multiplier),
          reportingPriceDecimal: scaleReportingDecimal(execution.priceDecimal, multiplier),
        }))),
      });
    },
  );
}

export function getReplacementOpenPositionStyles(
  scope: WorkspaceAccessScope,
): Readonly<Record<string, Readonly<{
  positionRef: string;
  style: JournalTradeStyleRecord | null;
}>>> {
  return withReadonlyJournalIntegrityRuntime(scope, (journal) => {
    const account = journal.tradeStyles.accountScope(scope);
    return Object.freeze(Object.fromEntries(
      journal.tradeStyles.listOpenPositionRows(account).map((position) => {
        const positionRef = journal.tradeStyles.positionRef(account, position.roundTripId);
        const style = journal.tradeStyles.read(account, positionRef);
        return [position.roundTripId, Object.freeze({ positionRef, style })] as const;
      }),
    ));
  });
}
