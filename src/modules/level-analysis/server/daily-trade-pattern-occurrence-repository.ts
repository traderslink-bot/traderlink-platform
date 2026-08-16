import type Database from "better-sqlite3";

import type { AccountScope } from
  "@/src/modules/platform/contracts/workspace-access-scope";

import type { DailyTradeAnalyzerResult } from
  "../contracts/daily-trade-analyzer-contracts";

export function hasDailyTradePatternOccurrenceProjection(
  database: Database.Database,
): boolean {
  return database.prepare<[], { found: number }>(`SELECT EXISTS (
  SELECT 1 FROM sqlite_schema
  WHERE type = 'table'
    AND name = 'journal_round_trip_daily_trade_analysis_pattern_occurrences'
) AS found`).get()?.found === 1;
}

export function persistDailyTradePatternOccurrences(
  database: Database.Database,
  input: Readonly<{
    analysisVersionId: string;
    analyzed: DailyTradeAnalyzerResult;
    roundTripId: string;
    scope: AccountScope;
  }>,
): void {
  // Keeps a running pre-migration review server compatible until the controlled
  // migration checkpoint. Once 0059 is applied, every new immutable Analyzer
  // version writes this projection in the same transaction as its snapshots.
  if (!hasDailyTradePatternOccurrenceProjection(database)) return;

  const insert = database.prepare(`INSERT INTO
  journal_round_trip_daily_trade_analysis_pattern_occurrences (
    daily_trade_analysis_version_id,
    workspace_id,
    account_id,
    round_trip_id,
    execution_id,
    pattern_sequence,
    event_kind,
    executed_at_utc,
    pattern_kind,
    timeframe,
    candles_before_execution,
    pattern_time_utc_seconds,
    known_at_utc_seconds
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

  for (const snapshot of input.analyzed.eventSnapshots) {
    snapshot.patterns.forEach((pattern, patternSequence) => {
      if (
        !pattern.availableAtExecution ||
        (pattern.timeframe !== "1m" && pattern.timeframe !== "5m") ||
        !Number.isInteger(pattern.time) || pattern.time <= 0 ||
        !Number.isInteger(pattern.knownAtTime) || pattern.knownAtTime <= 0 ||
        pattern.kind.trim() !== pattern.kind ||
        pattern.kind.length < 1 || pattern.kind.length > 120
      ) return;
      insert.run(
        input.analysisVersionId,
        input.scope.workspaceId,
        input.scope.accountId,
        input.roundTripId,
        snapshot.event.eventId,
        patternSequence,
        snapshot.event.kind,
        snapshot.event.executedAtUtc,
        pattern.kind,
        pattern.timeframe,
        pattern.candlesBeforeExecution,
        pattern.time,
        pattern.knownAtTime,
      );
    });
  }
}
