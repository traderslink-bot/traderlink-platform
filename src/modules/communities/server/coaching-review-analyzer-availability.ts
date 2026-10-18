import type Database from "better-sqlite3";
import type {WorkspaceAccessScope} from "../../platform/contracts/workspace-access-scope";
import type {CoachingResourceId} from "../contracts/coaching-review-resources";
/** Saved-result metadata only: no report construction, candle loading or analysis jobs. */
export function coachingAnalyzerResources(db:Database.Database,scope:WorkspaceAccessScope,tradeIds:readonly string[]):CoachingResourceId[]{
 if(!tradeIds.length)return [];
 const physical=db.prepare(`SELECT count(*) snapshots,max(s.event_kind='partial_exit') partial_exits,max(json_array_length(s.snapshot_json,'$.patterns')>0) patterns,max(json_type(s.snapshot_json,'$.indicators')='object') indicators
 FROM journal_round_trip_daily_trade_analyses a JOIN journal_round_trip_daily_trade_analysis_versions v ON v.daily_trade_analysis_id=a.daily_trade_analysis_id AND v.revision_number=a.current_revision
 JOIN journal_round_trips t ON t.round_trip_id=a.round_trip_id AND t.workspace_id=a.workspace_id AND t.account_id=a.account_id AND t.current_version_id=a.round_trip_version_id AND t.lifecycle_state='active'
 JOIN journal_round_trip_daily_trade_analysis_event_snapshots s ON s.daily_trade_analysis_version_id=v.daily_trade_analysis_version_id AND s.candle_time_utc_seconds IS NOT NULL
 WHERE a.workspace_id=? AND a.account_id=? AND a.status='ready' AND v.status='ready' AND a.round_trip_id IN (SELECT value FROM json_each(?))`).get(scope.workspaceId,scope.activeAccountId,JSON.stringify(tradeIds)) as {snapshots:number;partial_exits:number|null;patterns:number|null;indicators:number|null};
 const logical=db.prepare(`SELECT count(*) snapshots,max(json_extract(s.value,'$.event.kind')='partial_exit') partial_exits,max(json_array_length(s.value,'$.patterns')>0) patterns,max(json_type(s.value,'$.indicators')='object') indicators
 FROM journal_logical_trade_daily_analyses a JOIN journal_logical_trade_daily_analysis_versions v ON v.logical_trade_analysis_id=a.logical_trade_analysis_id AND v.revision_number=a.current_revision
 JOIN journal_logical_trades t ON t.logical_trade_id=a.logical_trade_id AND t.workspace_id=a.workspace_id AND t.account_id=a.account_id AND t.current_version_id=a.logical_trade_version_id AND t.lifecycle_state='active',json_each(v.result_json,'$.eventSnapshots') s
 WHERE a.workspace_id=? AND a.account_id=? AND a.status='ready' AND v.status='ready' AND json_array_length(v.evidence_candles_json)>0 AND EXISTS (SELECT 1 FROM journal_logical_trade_version_members m WHERE m.logical_trade_version_id=a.logical_trade_version_id AND m.round_trip_id IN (SELECT value FROM json_each(?)))`).get(scope.workspaceId,scope.activeAccountId,JSON.stringify(tradeIds)) as typeof physical;
 if(!physical.snapshots&&!logical.snapshots)return [];
 return ['day','entry-exit','mfe-mae','green-to-red','trades',...(physical.partial_exits||logical.partial_exits?['scaling-out' as const]:[]),...(physical.patterns||logical.patterns?['candle-patterns' as const]:[]),...(physical.indicators||logical.indicators?['trend-momentum' as const]:[])];
}
