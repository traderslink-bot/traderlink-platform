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
import { readDailyTradePathMaterialization } from
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
  round_trip_id: string;
  status: "pending" | "ready" | "no_coverage" | "provider_unavailable" | "expired" | null;
}>;

type SnapshotRow = Readonly<{ snapshot_json: string }>;

type PostExitRow = Readonly<{
  favorable_move_decimal: string | null;
  minutes_after_exit: 5 | 15 | 30 | 60;
  observed_at_candle_time_utc_seconds: number | null;
}>;

export type CoachAiReviewRuleDefinitionV2 = Omit<
  CoachAiReviewNamedRuleOutcomeV2,
  "status"
>;

export interface CoachAiReviewSupplementalEvidenceReader {
  readRuleDefinitions(
    scope: AccountScope,
    ruleVersionIds: readonly string[],
  ): Readonly<Record<string, CoachAiReviewRuleDefinitionV2>>;
  readTradeAnalyses(
    scope: AccountScope,
    roundTripIds: readonly string[],
  ): Readonly<Record<string, CoachAiReviewTradeAnalysisV2>>;
}

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
    const rows = this.database.prepare(`SELECT rule_version_id, title, statement, category
FROM journal_rule_versions
WHERE workspace_id = ? AND account_id = ?
  AND rule_version_id IN (${unique.map(() => "?").join(", ")})
ORDER BY rule_version_id`).all(
      scope.workspaceId,
      scope.accountId,
      ...unique,
    ) as RuleVersionRow[];
    return Object.freeze(Object.fromEntries(rows.map((row) => [
      row.rule_version_id,
      Object.freeze({
        category: row.category,
        statement: row.statement,
        title: row.title,
      }),
    ])));
  }

  readTradeAnalyses(
    scope: AccountScope,
    roundTripIds: readonly string[],
  ): Readonly<Record<string, CoachAiReviewTradeAnalysisV2>> {
    const unique = [...new Set(roundTripIds)].sort();
    if (unique.length === 0) return Object.freeze({});
    const rows = this.database.prepare(`SELECT
  round_trip.round_trip_id,
  current_version.projection_fingerprint_sha256 AS current_projection_fingerprint_sha256,
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
  AND round_trip.round_trip_id IN (${unique.map(() => "?").join(", ")})
ORDER BY round_trip.round_trip_id`).all(
      scope.workspaceId,
      scope.accountId,
      ...unique,
    ) as AnalysisRow[];
    const byRoundTrip = new Map(rows.map((row) => [row.round_trip_id, row] as const));
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
      const snapshots = (this.database.prepare<[string], SnapshotRow>(`SELECT snapshot_json
FROM journal_round_trip_daily_trade_analysis_event_snapshots
WHERE daily_trade_analysis_version_id = ?
ORDER BY COALESCE(json_extract(snapshot_json, '$.event.sequence'), 0)`).all(
        row.daily_trade_analysis_version_id,
      )).map((snapshot) => parseSnapshot(snapshot.snapshot_json));
      if (snapshots.length === 0 || snapshots.some((snapshot) => snapshot === null)) {
        result[roundTripId] = unavailable("no_coverage", row.analyzer_contract_version);
        continue;
      }
      const postExit = this.database.prepare<[string], PostExitRow>(`SELECT
  minutes_after_exit, favorable_move_decimal, observed_at_candle_time_utc_seconds
FROM journal_round_trip_daily_trade_analysis_post_exit_paths
WHERE daily_trade_analysis_version_id = ?
ORDER BY minutes_after_exit`).all(row.daily_trade_analysis_version_id);
      const storedPath = readDailyTradePathMaterialization(
        this.database,
        row.daily_trade_analysis_version_id,
      );
      const path = storedPath?.path ?? null;
      const best = path?.bestProfitOpportunityIndex === null ||
          path?.bestProfitOpportunityIndex === undefined
        ? null
        : path.profitOpportunities[path.bestProfitOpportunityIndex] ?? null;
      result[roundTripId] = Object.freeze({
        availability: "ready",
        unavailableReason: null,
        analyzerContractVersion: row.analyzer_contract_version,
        events: Object.freeze((snapshots as DailyTradeAnalyzerEventSnapshot[]).map(compactEvent)),
        greenToRed: path ? Object.freeze({
          status: path.status,
          feesComplete: path.feesComplete,
          finalPnlDecimal: path.finalPnlDecimal,
          peakPnlDecimal: path.peakPnlDecimal,
          firstRedPnlDecimal: path.firstRedPnlDecimal,
          peakToRedReversalDecimal: path.peakToRedReversalDecimal,
          peakToFinalReversalDecimal: path.peakToFinalReversalDecimal,
          minutesFromPeakToRed: path.minutesFromPeakToRed,
          addedAfterPeakCount: path.addedAfterPeakCount,
          partialExitBeforeRedCount: path.partialExitBeforeRedCount,
          bestProfitOpportunity: best ? Object.freeze({
            durationMinutes: best.durationMinutes,
            completedCloseCount: best.completedCloseCount,
            closesAtOrAboveStrongThresholdCount:
              best.closesAtOrAboveStrongThresholdCount,
            lowestPnlDecimal: best.lowestPnlDecimal,
            peakPnlDecimal: best.peakPnlDecimal,
            peakToFinalReversalDecimal: best.peakToFinalReversalDecimal,
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
