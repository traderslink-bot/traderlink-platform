import type Database from "better-sqlite3";

import type { AccountScope } from "@/src/modules/platform/contracts/workspace-access-scope";

import type {
  DailyTradeGreenToRedAnalysis,
  DailyTradeGreenToRedStatus,
  DailyTradeProfitOpportunityWindow,
} from "../contracts/daily-trade-analyzer-contracts";

type SummaryRow = Readonly<{
  added_after_peak_count: number;
  best_profit_opportunity_sequence: number | null;
  completed_close_peak_at_utc_seconds: number | null;
  completed_close_peak_pnl_decimal: string | null;
  fees_complete: number;
  final_pnl_decimal: string | null;
  first_green_at_utc_seconds: number | null;
  first_recovery_at_utc_seconds: number | null;
  first_red_at_utc_seconds: number | null;
  first_red_pnl_decimal: string | null;
  minutes_from_peak_to_red: number | null;
  partial_exit_before_red_count: number;
  path_status: DailyTradeGreenToRedStatus;
  peak_at_utc_seconds: number | null;
  peak_pnl_decimal: string | null;
  peak_to_final_reversal_decimal: string | null;
  peak_to_red_reversal_decimal: string | null;
  position_quantity_at_peak_decimal: string | null;
  position_quantity_at_red_decimal: string | null;
  profit_opportunity_count: number;
  profit_opportunity_threshold_decimal: string | null;
  round_trip_version_id: string;
  strong_opportunity_threshold_decimal: string | null;
}>;

type OpportunityRow = Readonly<{
  closes_at_or_above_strong_threshold_count: number;
  completed_close_count: number;
  duration_minutes: number;
  ended_at_utc_seconds: number;
  is_best: number;
  lowest_pnl_decimal: string;
  opportunity_sequence: number;
  peak_at_utc_seconds: number;
  peak_pnl_decimal: string;
  peak_to_final_reversal_decimal: string;
  started_at_utc_seconds: number;
}>;

export type DailyTradeLongTermPathFact = Readonly<{
  analysisVersionId: string;
  path: DailyTradeGreenToRedAnalysis;
  roundTripId: string;
  roundTripVersionId: string;
}>;

export function hasDailyTradePathMaterializationSchema(database: Database.Database): boolean {
  return database.prepare<[], { count: number }>(`SELECT COUNT(*) AS count
FROM sqlite_master
WHERE type = 'table' AND name IN (
  'journal_round_trip_daily_trade_analysis_path_summaries',
  'journal_round_trip_daily_trade_analysis_profit_opportunities'
)`).get()?.count === 2;
}

export function persistDailyTradePathMaterialization(
  database: Database.Database,
  input: Readonly<{
    analysis: DailyTradeGreenToRedAnalysis;
    analysisVersionId: string;
    roundTripVersionId: string;
  }>,
): boolean {
  if (!hasDailyTradePathMaterializationSchema(database)) return false;
  const exists = database.prepare<[string], { count: number }>(`SELECT COUNT(*) AS count
FROM journal_round_trip_daily_trade_analysis_path_summaries
WHERE daily_trade_analysis_version_id = ?`).get(input.analysisVersionId)?.count ?? 0;
  if (exists > 0) return false;
  const analysis = input.analysis;
  database.prepare(`INSERT INTO journal_round_trip_daily_trade_analysis_path_summaries (
  daily_trade_analysis_version_id, round_trip_version_id, path_contract_version,
  path_status, fees_complete, added_after_peak_count, partial_exit_before_red_count,
  profit_opportunity_count, best_profit_opportunity_sequence, final_pnl_decimal,
  first_green_at_utc_seconds, first_red_at_utc_seconds, first_red_pnl_decimal,
  first_recovery_at_utc_seconds, minutes_from_peak_to_red, peak_at_utc_seconds,
  peak_pnl_decimal, peak_to_final_reversal_decimal, peak_to_red_reversal_decimal,
  position_quantity_at_peak_decimal, position_quantity_at_red_decimal,
  completed_close_peak_at_utc_seconds, completed_close_peak_pnl_decimal,
  profit_opportunity_threshold_decimal, strong_opportunity_threshold_decimal
) VALUES (?, ?, 'daily_trade_path_v1', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(
      input.analysisVersionId,
      input.roundTripVersionId,
      analysis.status,
      analysis.feesComplete ? 1 : 0,
      analysis.addedAfterPeakCount,
      analysis.partialExitBeforeRedCount,
      analysis.profitOpportunities.length,
      analysis.bestProfitOpportunityIndex,
      analysis.finalPnlDecimal,
      analysis.firstGreenAtUtcSeconds,
      analysis.firstRedAtUtcSeconds,
      analysis.firstRedPnlDecimal,
      analysis.firstRecoveryAtUtcSeconds,
      analysis.minutesFromPeakToRed,
      analysis.peakAtUtcSeconds,
      analysis.peakPnlDecimal,
      analysis.peakToFinalReversalDecimal,
      analysis.peakToRedReversalDecimal,
      analysis.positionQuantityAtPeakDecimal,
      analysis.positionQuantityAtRedDecimal,
      analysis.completedClosePeakAtUtcSeconds,
      analysis.completedClosePeakPnlDecimal,
      analysis.profitOpportunityThresholdDecimal,
      analysis.strongOpportunityThresholdDecimal,
    );
  const insertOpportunity = database.prepare(`INSERT INTO journal_round_trip_daily_trade_analysis_profit_opportunities (
  daily_trade_analysis_version_id, opportunity_sequence, is_best,
  started_at_utc_seconds, ended_at_utc_seconds, duration_minutes,
  completed_close_count, closes_at_or_above_strong_threshold_count,
  lowest_pnl_decimal, peak_at_utc_seconds, peak_pnl_decimal,
  peak_to_final_reversal_decimal
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  analysis.profitOpportunities.forEach((opportunity, sequence) => {
    insertOpportunity.run(
      input.analysisVersionId,
      sequence,
      sequence === analysis.bestProfitOpportunityIndex ? 1 : 0,
      opportunity.startedAtUtcSeconds,
      opportunity.endedAtUtcSeconds,
      opportunity.durationMinutes,
      opportunity.completedCloseCount,
      opportunity.closesAtOrAboveStrongThresholdCount,
      opportunity.lowestPnlDecimal,
      opportunity.peakAtUtcSeconds,
      opportunity.peakPnlDecimal,
      opportunity.peakToFinalReversalDecimal,
    );
  });
  return true;
}

export function readDailyTradePathMaterialization(
  database: Database.Database,
  analysisVersionId: string,
): Readonly<{ path: DailyTradeGreenToRedAnalysis; roundTripVersionId: string }> | null {
  if (!hasDailyTradePathMaterializationSchema(database)) return null;
  const summary = database.prepare<[string], SummaryRow>(`SELECT *
FROM journal_round_trip_daily_trade_analysis_path_summaries
WHERE daily_trade_analysis_version_id = ?`).get(analysisVersionId);
  if (!summary) return null;
  const opportunityRows = database.prepare<[string], OpportunityRow>(`SELECT *
FROM journal_round_trip_daily_trade_analysis_profit_opportunities
WHERE daily_trade_analysis_version_id = ?
ORDER BY opportunity_sequence`).all(analysisVersionId);
  if (
    opportunityRows.length !== summary.profit_opportunity_count ||
    opportunityRows.some((row, index) => row.opportunity_sequence !== index)
  ) return null;
  const opportunities: readonly DailyTradeProfitOpportunityWindow[] = Object.freeze(
    opportunityRows.map((row) => Object.freeze({
      closesAtOrAboveStrongThresholdCount: row.closes_at_or_above_strong_threshold_count,
      completedCloseCount: row.completed_close_count,
      durationMinutes: row.duration_minutes,
      endedAtUtcSeconds: row.ended_at_utc_seconds,
      lowestPnlDecimal: row.lowest_pnl_decimal,
      peakAtUtcSeconds: row.peak_at_utc_seconds,
      peakPnlDecimal: row.peak_pnl_decimal,
      peakToFinalReversalDecimal: row.peak_to_final_reversal_decimal,
      startedAtUtcSeconds: row.started_at_utc_seconds,
    })),
  );
  const bestRows = opportunityRows.filter((row) => row.is_best === 1);
  const bestIndex = bestRows.length === 1 ? bestRows[0]!.opportunity_sequence : null;
  if (bestIndex !== summary.best_profit_opportunity_sequence) return null;
  return Object.freeze({
    roundTripVersionId: summary.round_trip_version_id,
    path: Object.freeze({
      addedAfterPeakCount: summary.added_after_peak_count,
      bestProfitOpportunityIndex: bestIndex,
      completedClosePeakAtUtcSeconds: summary.completed_close_peak_at_utc_seconds,
      completedClosePeakPnlDecimal: summary.completed_close_peak_pnl_decimal,
      feesComplete: summary.fees_complete === 1,
      finalPnlDecimal: summary.final_pnl_decimal,
      firstGreenAtUtcSeconds: summary.first_green_at_utc_seconds,
      firstRedAtUtcSeconds: summary.first_red_at_utc_seconds,
      firstRedPnlDecimal: summary.first_red_pnl_decimal,
      firstRecoveryAtUtcSeconds: summary.first_recovery_at_utc_seconds,
      minutesFromPeakToRed: summary.minutes_from_peak_to_red,
      partialExitBeforeRedCount: summary.partial_exit_before_red_count,
      peakAtUtcSeconds: summary.peak_at_utc_seconds,
      peakPnlDecimal: summary.peak_pnl_decimal,
      peakToFinalReversalDecimal: summary.peak_to_final_reversal_decimal,
      peakToRedReversalDecimal: summary.peak_to_red_reversal_decimal,
      positionQuantityAtPeakDecimal: summary.position_quantity_at_peak_decimal,
      positionQuantityAtRedDecimal: summary.position_quantity_at_red_decimal,
      profitOpportunities: opportunities,
      profitOpportunityThresholdDecimal: summary.profit_opportunity_threshold_decimal,
      status: summary.path_status,
      strongOpportunityThresholdDecimal: summary.strong_opportunity_threshold_decimal,
    }),
  });
}

export function readCurrentDailyTradeLongTermPathFacts(
  database: Database.Database,
  scope: AccountScope,
): readonly DailyTradeLongTermPathFact[] {
  if (!hasDailyTradePathMaterializationSchema(database)) return Object.freeze([]);
  const rows = database.prepare<[string, string], {
    daily_trade_analysis_version_id: string;
    round_trip_id: string;
  }>(`SELECT version.daily_trade_analysis_version_id, analysis.round_trip_id
FROM journal_round_trip_daily_trade_analyses analysis
JOIN journal_round_trip_daily_trade_analysis_versions version
  ON version.daily_trade_analysis_id = analysis.daily_trade_analysis_id
  AND version.revision_number = analysis.current_revision
JOIN journal_round_trip_daily_trade_analysis_path_summaries summary
  ON summary.daily_trade_analysis_version_id = version.daily_trade_analysis_version_id
WHERE analysis.workspace_id = ? AND analysis.account_id = ?
ORDER BY analysis.round_trip_id`).all(scope.workspaceId, scope.accountId);
  return Object.freeze(rows.flatMap((row) => {
    const stored = readDailyTradePathMaterialization(database, row.daily_trade_analysis_version_id);
    return stored ? [Object.freeze({
      analysisVersionId: row.daily_trade_analysis_version_id,
      path: stored.path,
      roundTripId: row.round_trip_id,
      roundTripVersionId: stored.roundTripVersionId,
    })] : [];
  }));
}
