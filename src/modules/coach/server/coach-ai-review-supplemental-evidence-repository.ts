import type Database from "better-sqlite3";

import {
  acceptedRsi14,
  isAcceptedRsi14CalculationVersion,
  RSI_14_CALCULATION_VERSION,
} from
  "@/src/lib/trade-candle-analysis/indicator-context";
import type {
  CoachAiReviewNamedRuleOutcomeV2,
  CoachAiReviewTradeAnalysisV2,
} from "@/src/modules/coach/contracts/weekly-ai-review-input-contracts";
import type {
  DailyTradeAnalyzerEventSnapshot,
  DailyTradeAnalyzerPostExitPath,
} from "@/src/modules/level-analysis/contracts/daily-trade-analyzer-contracts";
import { hasDailyTradePathMaterializationSchema } from
  "@/src/modules/level-analysis/server/daily-trade-path-materialization-repository";
import type { AccountScope } from
  "@/src/modules/platform/contracts/workspace-access-scope";

type RuleVersionRow = Readonly<{
  category: string;
  rule_version_id: string;
  statement: string;
  title: string;
}>;

type AnalysisRow = Readonly<{
  analysis_projection_fingerprint_sha256: string | null;
  analyzer_contract_version: "daily_trade_analyzer_v1" | "daily_trade_analyzer_v2" | null;
  current_projection_fingerprint_sha256: string;
  daily_trade_analysis_version_id: string | null;
  analyzed_round_trip_version_id: string | null;
  current_round_trip_version_id: string;
  round_trip_id: string;
  status: "pending" | "ready" | "no_coverage" | "provider_unavailable" | "expired" | null;
}>;

type SnapshotRow = Readonly<{
  daily_trade_analysis_version_id: string;
  snapshot_json: string;
}>;

type PostExitRow = Readonly<{
  daily_trade_analysis_version_id: string;
  favorable_move_decimal: string | null;
  minutes_after_exit: 5 | 15 | 30 | 60;
  observed_at_candle_time_utc_seconds: number | null;
}>;

type PathSummaryRow = Readonly<{
  added_after_peak_count: number;
  best_profit_opportunity_sequence: number | null;
  daily_trade_analysis_version_id: string;
  fees_complete: number;
  final_pnl_decimal: string | null;
  first_red_pnl_decimal: string | null;
  minutes_from_peak_to_red: number | null;
  partial_exit_before_red_count: number;
  path_status: NonNullable<CoachAiReviewTradeAnalysisV2["greenToRed"]>["status"];
  peak_pnl_decimal: string | null;
  peak_to_final_reversal_decimal: string | null;
  peak_to_red_reversal_decimal: string | null;
  profit_opportunity_count: number;
}>;

type PathOpportunityRow = Readonly<{
  closes_at_or_above_strong_threshold_count: number;
  completed_close_count: number;
  daily_trade_analysis_version_id: string;
  duration_minutes: number;
  is_best: number;
  lowest_pnl_decimal: string;
  opportunity_sequence: number;
  peak_pnl_decimal: string;
  peak_to_final_reversal_decimal: string;
}>;

export type CoachAiReviewRuleDefinitionV2 = Omit<
  CoachAiReviewNamedRuleOutcomeV2,
  "status"
>;

export type CoachAiReviewTradeAnalysisLineage = Readonly<{
  analysisVersionId: string | null;
  analyzedRoundTripVersionId: string | null;
  analyzerContractVersion: CoachAiReviewTradeAnalysisV2["analyzerContractVersion"];
  currentRoundTripVersionId: string;
  linkedRoundTripVersionCurrent: boolean;
  roundTripId: string;
  status: AnalysisRow["status"];
}>;

export interface CoachAiReviewSupplementalEvidenceReader {
  readRuleDefinitions(
    scope: AccountScope,
    ruleVersionIds: readonly string[],
  ): Readonly<Record<string, CoachAiReviewRuleDefinitionV2>>;
  readTradeAnalyses(
    scope: AccountScope,
    roundTripIds: readonly string[],
  ): Readonly<Record<string, CoachAiReviewTradeAnalysisV2>>;
  readTradeAnalysisLineage(
    scope: AccountScope,
    roundTripIds: readonly string[],
  ): Readonly<Record<string, CoachAiReviewTradeAnalysisLineage>>;
}

const SQLITE_BATCH_SIZE = 400;

function unavailable(
  reason: NonNullable<CoachAiReviewTradeAnalysisV2["unavailableReason"]>,
  version: CoachAiReviewTradeAnalysisV2["analyzerContractVersion"] = null,
): CoachAiReviewTradeAnalysisV2 {
  return Object.freeze({
    availability: "unavailable",
    unavailableReason: reason,
    analyzerContractVersion: version,
    events: Object.freeze([]),
    greenToRed: null,
    finalExitPaths: Object.freeze([]),
  });
}

function parseSnapshot(value: string): DailyTradeAnalyzerEventSnapshot | null {
  try {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") return null;
    const candidate = parsed as Partial<DailyTradeAnalyzerEventSnapshot>;
    if (!candidate.event || !candidate.metrics || !candidate.fiveMinuteContext ||
        !Array.isArray(candidate.patterns)) return null;
    return candidate as DailyTradeAnalyzerEventSnapshot;
  } catch {
    return null;
  }
}

function compactPatterns(
  snapshot: DailyTradeAnalyzerEventSnapshot,
  timeframe: "1m" | "5m",
) {
  return Object.freeze(snapshot.patterns
    .filter((pattern) => pattern.timeframe === timeframe)
    .map((pattern) => Object.freeze({
      availableAtExecution: pattern.availableAtExecution,
      candlesBeforeExecution: pattern.candlesBeforeExecution,
      kind: pattern.kind,
      score: pattern.score,
    })));
}

function compactEvent(snapshot: DailyTradeAnalyzerEventSnapshot) {
  // A temporary flat boundary is meaningful only for a user-defined logical
  // trade. Coach's existing completed-round-trip evidence contract has no
  // equivalent event, so it must not be relabeled as a partial or final exit.
  if (snapshot.event.kind === "temporary_flat") return null;
  const excursion = snapshot.metrics.excursionUntilFlat;
  const completed = snapshot.fiveMinuteContext.completedBeforeExecution;
  const containing = snapshot.fiveMinuteContext.containingCandle;
  const partial = snapshot.fiveMinuteContext.preExecutionPartial;
  const rsi14CalculationVersion =
    isAcceptedRsi14CalculationVersion(
      snapshot.indicators?.rsi14CalculationVersion,
    )
      ? RSI_14_CALCULATION_VERSION
      : null;
  return Object.freeze({
    kind: snapshot.event.kind,
    sequence: snapshot.event.sequence,
    executedAtUtc: snapshot.event.executedAtUtc,
    oneMinute: Object.freeze({
      candleLocationRatio: snapshot.metrics.candleLocationRatio,
      candleTurnoverDecimal: snapshot.metrics.candleTurnoverDecimal,
      candleVolumeDecimal: snapshot.metrics.candleVolumeDecimal,
      relativeVolume: snapshot.indicators?.relativeVolume ?? null,
      rsi14: acceptedRsi14(
        snapshot.indicators?.rsi14,
        rsi14CalculationVersion,
      ),
      rsi14CalculationVersion,
      ema9DistancePercent: snapshot.metrics.ema9Distance?.signedDistancePercent ?? null,
      vwapDistancePercent: snapshot.metrics.vwapDistance?.signedDistancePercent ?? null,
      executionEdgeDistanceDecimal: snapshot.metrics.executionEdgeDistanceDecimal,
      favorableMoveUntilFlatDecimal: excursion?.favorableMoveDecimal ?? null,
      adverseMoveUntilFlatDecimal: excursion?.adverseMoveDecimal ?? null,
      minutesUntilFlat: excursion?.minutesUntilFlat ?? null,
      givebackFromPriorFavorableExtremeDecimal:
        snapshot.metrics.givebackFromPriorFavorableExtremeDecimal,
      patterns: compactPatterns(snapshot, "1m"),
      postEventPaths: snapshot.event.kind === "entry" ||
          snapshot.event.kind === "final_exit"
        ? Object.freeze(snapshot.metrics.postEventPaths.map((path) => Object.freeze({
            minutesAfterEvent: path.minutesAfterEvent,
            oppositeDirectionMoveDecimal: path.oppositeDirectionMoveDecimal,
            tradeDirectionMoveDecimal: path.tradeDirectionMoveDecimal,
          })))
        : Object.freeze([]),
    }),
    fiveMinute: Object.freeze({
      completedBeforeExecution: completed ? Object.freeze({
        ema9DistancePercent: completed.ema9Distance?.signedDistancePercent ?? null,
        relativeVolume: completed.relativeVolume,
        turnoverDecimal: completed.turnoverDecimal,
        volumeDecimal: completed.volumeDecimal,
      }) : null,
      containingCandle: containing ? Object.freeze({
        candleLocationRatio: containing.candleLocationRatio,
        ema9DistancePercent: containing.ema9Distance?.signedDistancePercent ?? null,
        executionEdgeDistanceDecimal: containing.executionEdgeDistanceDecimal,
        relativeVolume: containing.relativeVolume,
        turnoverDecimal: containing.turnoverDecimal,
        volumeDecimal: containing.volumeDecimal,
      }) : null,
      preExecutionPartial: partial ? Object.freeze({
        completedMinuteCount: partial.completedMinuteCount,
        turnoverDecimal: partial.turnoverDecimal,
        volumeDecimal: partial.volumeDecimal,
      }) : null,
      patterns: compactPatterns(snapshot, "5m"),
    }),
  });
}

function compactPostExit(path: DailyTradeAnalyzerPostExitPath) {
  return Object.freeze({
    minutesAfterExit: path.minutesAfterExit,
    favorableMoveDecimal: path.favorableMoveDecimal,
  });
}

export class CoachAiReviewSupplementalEvidenceRepository
implements CoachAiReviewSupplementalEvidenceReader {
  constructor(private readonly database: Database.Database) {}

  readRuleDefinitions(
    scope: AccountScope,
    ruleVersionIds: readonly string[],
  ): Readonly<Record<string, CoachAiReviewRuleDefinitionV2>> {
    const unique = [...new Set(ruleVersionIds)].sort();
    if (unique.length === 0) return Object.freeze({});
    const rows: RuleVersionRow[] = [];
    for (let offset = 0; offset < unique.length; offset += SQLITE_BATCH_SIZE) {
      const batch = unique.slice(offset, offset + SQLITE_BATCH_SIZE);
      rows.push(...this.database.prepare(`SELECT rule_version_id, title, statement, category
FROM journal_rule_versions
WHERE workspace_id = ? AND account_id = ?
  AND rule_version_id IN (${batch.map(() => "?").join(", ")})
ORDER BY rule_version_id`).all(
        scope.workspaceId,
        scope.accountId,
        ...batch,
      ) as RuleVersionRow[]);
    }
    return Object.freeze(Object.fromEntries(rows.map((row) => [
      row.rule_version_id,
      Object.freeze({
        category: row.category,
        statement: row.statement,
        title: row.title,
      }),
    ])));
  }

  private readAnalysisRows(
    scope: AccountScope,
    roundTripIds: readonly string[],
  ): readonly AnalysisRow[] {
    const rows: AnalysisRow[] = [];
    for (let offset = 0; offset < roundTripIds.length; offset += SQLITE_BATCH_SIZE) {
      const batch = roundTripIds.slice(offset, offset + SQLITE_BATCH_SIZE);
      rows.push(...this.database.prepare(`SELECT
  round_trip.round_trip_id,
  current_version.round_trip_version_id AS current_round_trip_version_id,
  current_version.projection_fingerprint_sha256 AS current_projection_fingerprint_sha256,
  analysis.round_trip_version_id AS analyzed_round_trip_version_id,
  analyzed_version.projection_fingerprint_sha256 AS analysis_projection_fingerprint_sha256,
  version.daily_trade_analysis_version_id,
  version.status,
  version.analyzer_contract_version
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
WHERE round_trip.workspace_id = ? AND round_trip.account_id = ?
  AND round_trip.lifecycle_state = 'active'
  AND round_trip.round_trip_id IN (${batch.map(() => "?").join(", ")})
ORDER BY round_trip.round_trip_id`).all(
        scope.workspaceId,
        scope.accountId,
        ...batch,
      ) as AnalysisRow[]);
    }
    return Object.freeze(rows.sort((left, right) =>
      left.round_trip_id < right.round_trip_id
        ? -1
        : left.round_trip_id > right.round_trip_id ? 1 : 0));
  }

  readTradeAnalysisLineage(
    scope: AccountScope,
    roundTripIds: readonly string[],
  ): Readonly<Record<string, CoachAiReviewTradeAnalysisLineage>> {
    const unique = [...new Set(roundTripIds)].sort();
    if (unique.length === 0) return Object.freeze({});
    return Object.freeze(Object.fromEntries(this.readAnalysisRows(scope, unique).map((row) => [
      row.round_trip_id,
      Object.freeze({
        analysisVersionId: row.daily_trade_analysis_version_id,
        analyzedRoundTripVersionId: row.analyzed_round_trip_version_id,
        analyzerContractVersion: row.analyzer_contract_version,
        currentRoundTripVersionId: row.current_round_trip_version_id,
        linkedRoundTripVersionCurrent: row.analyzed_round_trip_version_id !== null &&
          row.analyzed_round_trip_version_id === row.current_round_trip_version_id &&
          row.analysis_projection_fingerprint_sha256 !== null &&
          row.analysis_projection_fingerprint_sha256 ===
            row.current_projection_fingerprint_sha256,
        roundTripId: row.round_trip_id,
        status: row.status,
      }),
    ])));
  }

  readTradeAnalyses(
    scope: AccountScope,
    roundTripIds: readonly string[],
  ): Readonly<Record<string, CoachAiReviewTradeAnalysisV2>> {
    const unique = [...new Set(roundTripIds)].sort();
    if (unique.length === 0) return Object.freeze({});
    const rows = this.readAnalysisRows(scope, unique);
    const byRoundTrip = new Map(rows.map((row) => [row.round_trip_id, row] as const));
    const readyVersionIds = rows.flatMap((row) =>
      row.status === "ready" && row.daily_trade_analysis_version_id
        ? [row.daily_trade_analysis_version_id]
        : []);
    const snapshotRows: SnapshotRow[] = [];
    const postExitRows: PostExitRow[] = [];
    const summaryRows: PathSummaryRow[] = [];
    const opportunityRows: PathOpportunityRow[] = [];
    const hasPathSchema = hasDailyTradePathMaterializationSchema(this.database);
    for (let offset = 0; offset < readyVersionIds.length; offset += SQLITE_BATCH_SIZE) {
      const batch = readyVersionIds.slice(offset, offset + SQLITE_BATCH_SIZE);
      const placeholders = batch.map(() => "?").join(", ");
      snapshotRows.push(...this.database.prepare(`SELECT
  daily_trade_analysis_version_id, snapshot_json
FROM journal_round_trip_daily_trade_analysis_event_snapshots
WHERE daily_trade_analysis_version_id IN (${placeholders})
ORDER BY daily_trade_analysis_version_id,
  COALESCE(json_extract(snapshot_json, '$.event.sequence'), 0)`).all(
        ...batch,
      ) as SnapshotRow[]);
      postExitRows.push(...this.database.prepare(`SELECT
  daily_trade_analysis_version_id, minutes_after_exit, favorable_move_decimal,
  observed_at_candle_time_utc_seconds
FROM journal_round_trip_daily_trade_analysis_post_exit_paths
WHERE daily_trade_analysis_version_id IN (${placeholders})
ORDER BY daily_trade_analysis_version_id, minutes_after_exit`).all(
        ...batch,
      ) as PostExitRow[]);
      if (hasPathSchema) {
        summaryRows.push(...this.database.prepare(`SELECT
  daily_trade_analysis_version_id, path_status, fees_complete,
  added_after_peak_count, partial_exit_before_red_count,
  profit_opportunity_count, best_profit_opportunity_sequence,
  final_pnl_decimal, first_red_pnl_decimal, minutes_from_peak_to_red,
  peak_pnl_decimal, peak_to_final_reversal_decimal,
  peak_to_red_reversal_decimal
FROM journal_round_trip_daily_trade_analysis_path_summaries
WHERE daily_trade_analysis_version_id IN (${placeholders})
ORDER BY daily_trade_analysis_version_id`).all(...batch) as PathSummaryRow[]);
        opportunityRows.push(...this.database.prepare(`SELECT
  daily_trade_analysis_version_id, opportunity_sequence, is_best,
  duration_minutes, completed_close_count,
  closes_at_or_above_strong_threshold_count, lowest_pnl_decimal,
  peak_pnl_decimal, peak_to_final_reversal_decimal
FROM journal_round_trip_daily_trade_analysis_profit_opportunities
WHERE daily_trade_analysis_version_id IN (${placeholders})
ORDER BY daily_trade_analysis_version_id, opportunity_sequence`).all(
          ...batch,
        ) as PathOpportunityRow[]);
      }
    }
    const snapshotsByVersion = new Map<string, SnapshotRow[]>();
    for (const snapshot of snapshotRows) {
      snapshotsByVersion.set(snapshot.daily_trade_analysis_version_id, [
        ...(snapshotsByVersion.get(snapshot.daily_trade_analysis_version_id) ?? []),
        snapshot,
      ]);
    }
    const postExitByVersion = new Map<string, PostExitRow[]>();
    for (const path of postExitRows) {
      postExitByVersion.set(path.daily_trade_analysis_version_id, [
        ...(postExitByVersion.get(path.daily_trade_analysis_version_id) ?? []),
        path,
      ]);
    }
    const summaryByVersion = new Map(summaryRows.map((row) =>
      [row.daily_trade_analysis_version_id, row] as const));
    const opportunitiesByVersion = new Map<string, PathOpportunityRow[]>();
    for (const opportunity of opportunityRows) {
      opportunitiesByVersion.set(opportunity.daily_trade_analysis_version_id, [
        ...(opportunitiesByVersion.get(opportunity.daily_trade_analysis_version_id) ?? []),
        opportunity,
      ]);
    }
    const result: Record<string, CoachAiReviewTradeAnalysisV2> = {};
    for (const roundTripId of unique) {
      const row = byRoundTrip.get(roundTripId);
      if (!row || !row.daily_trade_analysis_version_id || !row.status) {
        result[roundTripId] = unavailable("missing");
        continue;
      }
      if (!row.analysis_projection_fingerprint_sha256 ||
          row.analysis_projection_fingerprint_sha256 !==
            row.current_projection_fingerprint_sha256) {
        result[roundTripId] = unavailable("stale", row.analyzer_contract_version);
        continue;
      }
      if (row.status !== "ready") {
        result[roundTripId] = unavailable(row.status, row.analyzer_contract_version);
        continue;
      }
      const snapshots = (snapshotsByVersion.get(row.daily_trade_analysis_version_id) ?? [])
        .map((snapshot) => parseSnapshot(snapshot.snapshot_json));
      if (snapshots.length === 0 || snapshots.some((snapshot) => snapshot === null)) {
        result[roundTripId] = unavailable("no_coverage", row.analyzer_contract_version);
        continue;
      }
      const postExit = postExitByVersion.get(row.daily_trade_analysis_version_id) ?? [];
      const path = summaryByVersion.get(row.daily_trade_analysis_version_id) ?? null;
      const opportunities = opportunitiesByVersion.get(row.daily_trade_analysis_version_id) ?? [];
      const validOpportunities = path !== null &&
        opportunities.length === path.profit_opportunity_count &&
        opportunities.every((item, index) => item.opportunity_sequence === index);
      const bestRows = validOpportunities
        ? opportunities.filter((item) => item.is_best === 1)
        : [];
      const bestSequence = bestRows.length === 1
        ? bestRows[0]!.opportunity_sequence
        : null;
      const validPath = validOpportunities &&
        bestSequence === path?.best_profit_opportunity_sequence;
      const best = validPath && bestRows.length === 1 ? bestRows[0]! : null;
      result[roundTripId] = Object.freeze({
        availability: "ready",
        unavailableReason: null,
        analyzerContractVersion: row.analyzer_contract_version,
        events: Object.freeze((snapshots as DailyTradeAnalyzerEventSnapshot[]).flatMap((snapshot) => {
          const event = compactEvent(snapshot);
          return event === null ? [] : [event];
        })),
        greenToRed: path && validPath ? Object.freeze({
          status: path.path_status,
          feesComplete: path.fees_complete === 1,
          finalPnlDecimal: path.final_pnl_decimal,
          peakPnlDecimal: path.peak_pnl_decimal,
          firstRedPnlDecimal: path.first_red_pnl_decimal,
          peakToRedReversalDecimal: path.peak_to_red_reversal_decimal,
          peakToFinalReversalDecimal: path.peak_to_final_reversal_decimal,
          minutesFromPeakToRed: path.minutes_from_peak_to_red,
          addedAfterPeakCount: path.added_after_peak_count,
          partialExitBeforeRedCount: path.partial_exit_before_red_count,
          bestProfitOpportunity: best ? Object.freeze({
            durationMinutes: best.duration_minutes,
            completedCloseCount: best.completed_close_count,
            closesAtOrAboveStrongThresholdCount:
              best.closes_at_or_above_strong_threshold_count,
            lowestPnlDecimal: best.lowest_pnl_decimal,
            peakPnlDecimal: best.peak_pnl_decimal,
            peakToFinalReversalDecimal: best.peak_to_final_reversal_decimal,
          }) : null,
        }) : null,
        finalExitPaths: Object.freeze(postExit.map((item) => compactPostExit(Object.freeze({
          minutesAfterExit: item.minutes_after_exit,
          favorableMoveDecimal: item.favorable_move_decimal,
          observedAtCandleTime: item.observed_at_candle_time_utc_seconds,
        })))),
      });
    }
    return Object.freeze(result);
  }
}
