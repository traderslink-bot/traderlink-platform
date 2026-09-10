import type Database from "better-sqlite3";
import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { PlatformUserPreferenceRepository } from "@/src/modules/platform/server/identity/platform-user-preference-repository";
import { JournalLogicalTradeRepository } from "@/src/modules/journal/server/logical-trades/journal-logical-trade-repository";

/** Metadata only: no candle downloads, analysis writes, or per-trade JSON loads. */
export function readAnalyzerWrittenReviewContext(database: Database.Database, scope: WorkspaceAccessScope) {
  const basis = new PlatformUserPreferenceRepository(database).getActiveUserPnlReportingBasis(scope.userId);
  const accountId = scope.activeAccountId;
  if (!accountId || !scope.allowedAccountIds.includes(accountId)) return { basis, analyzedTradeCount: null };
  const trades = new JournalLogicalTradeRepository(database).list({
    accountId, userId: scope.userId, workspaceId: scope.workspaceId, workspaceRole: scope.workspaceRole,
  });
  const logical = database.prepare(`SELECT analysis.logical_trade_id, analysis.status,
    analysis.logical_trade_version_id, trade.current_version_id,
    CASE WHEN version.status = 'ready' AND version.logical_trade_version_id = trade.current_version_id
      AND version.result_json IS NOT NULL AND version.evidence_candles_json IS NOT NULL
      AND json_valid(version.result_json) AND json_valid(version.evidence_candles_json)
      THEN json_array_length(version.evidence_candles_json) > 0
        AND json_array_length(version.result_json, '$.eventSnapshots') > 0 ELSE 0 END AS has_evidence
    FROM journal_logical_trade_daily_analyses analysis
    JOIN journal_logical_trades trade ON trade.workspace_id = analysis.workspace_id
      AND trade.account_id = analysis.account_id AND trade.logical_trade_id = analysis.logical_trade_id
    JOIN journal_logical_trade_daily_analysis_versions version
      ON version.logical_trade_analysis_id = analysis.logical_trade_analysis_id
      AND version.revision_number = analysis.current_revision
    WHERE analysis.workspace_id = ? AND analysis.account_id = ?`).all(scope.workspaceId, accountId) as Array<{
      logical_trade_id: string; status: string; logical_trade_version_id: string; current_version_id: string; has_evidence: number;
    }>;
  const logicalById = new Map(logical.map((row) => [row.logical_trade_id, row]));
  const pending = new Set((database.prepare(`SELECT job.logical_trade_id FROM level_analysis_logical_trade_jobs job
    JOIN journal_logical_trades trade ON trade.workspace_id = job.workspace_id AND trade.account_id = job.account_id
      AND trade.logical_trade_id = job.logical_trade_id AND trade.current_version_id = job.logical_trade_version_id
    WHERE job.workspace_id = ? AND job.account_id = ? AND job.status IN ('queued', 'leased')`)
    .all(scope.workspaceId, accountId) as Array<{ logical_trade_id: string }>).map(row => row.logical_trade_id));
  const legacy = database.prepare(`SELECT analysis.round_trip_id, trade.current_version_id AS round_trip_version_id
    FROM journal_round_trip_daily_trade_analyses analysis
    JOIN journal_round_trips trade ON trade.workspace_id = analysis.workspace_id
      AND trade.account_id = analysis.account_id AND trade.round_trip_id = analysis.round_trip_id
    JOIN journal_round_trip_versions current_version ON current_version.workspace_id = trade.workspace_id
      AND current_version.account_id = trade.account_id AND current_version.round_trip_version_id = trade.current_version_id
    JOIN journal_round_trip_versions analyzed_version ON analyzed_version.workspace_id = analysis.workspace_id
      AND analyzed_version.account_id = analysis.account_id AND analyzed_version.round_trip_version_id = analysis.round_trip_version_id
    JOIN journal_round_trip_daily_trade_analysis_versions version
      ON version.daily_trade_analysis_id = analysis.daily_trade_analysis_id
      AND version.revision_number = analysis.current_revision
    WHERE analysis.workspace_id = ? AND analysis.account_id = ?
      AND analysis.status = 'ready' AND version.status = 'ready'
      AND trade.lifecycle_state = 'active'
      AND analyzed_version.projection_fingerprint_sha256 = current_version.projection_fingerprint_sha256
      AND NOT EXISTS (SELECT 1 FROM journal_round_trip_daily_trade_execution_mismatch_sets mismatch
        WHERE mismatch.workspace_id = trade.workspace_id AND mismatch.account_id = trade.account_id
          AND mismatch.round_trip_id = trade.round_trip_id AND mismatch.round_trip_version_id = trade.current_version_id)
      AND EXISTS (SELECT 1 FROM journal_round_trip_daily_trade_analysis_event_snapshots snapshot
        JOIN level_analysis_market_session_candles candle
          ON candle.market_session_set_version_id = version.market_session_set_version_id
          AND candle.candle_time_utc_seconds = snapshot.candle_time_utc_seconds
        WHERE snapshot.daily_trade_analysis_version_id = version.daily_trade_analysis_version_id)`)
    .all(scope.workspaceId, accountId) as Array<{ round_trip_id: string; round_trip_version_id: string }>;
  const legacyById = new Map(legacy.map((row) => [row.round_trip_id, row.round_trip_version_id]));
  const analyzedTradeCount = trades.filter((trade) => {
    if (trade.tradeStyle !== "day" || trade.lifecycleState !== "active") return false;
    const saved = trade.logicalTradeId ? logicalById.get(trade.logicalTradeId) : undefined;
    if (saved) return saved.status === "ready" && saved.has_evidence === 1 &&
      saved.logical_trade_version_id === saved.current_version_id;
    if (trade.logicalTradeId && pending.has(trade.logicalTradeId)) return false;
    const member = trade.members[0];
    return trade.members.length === 1 && member && legacyById.get(member.roundTripId) === member.roundTripVersionId;
  }).length;
  return { basis, analyzedTradeCount };
}
