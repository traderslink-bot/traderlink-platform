import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { isTraderLinkPlatformError, platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";
import { requireTraderLinkPlatformRequestScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withJournalAnalyticsReportingDashboardRuntime } from
  "@/src/modules/journal-analytics/server/journal-analytics-dashboard-runtime";
import { journalReportingCurrencyAmount } from
  "@/src/modules/journal-analytics/server/journal-reporting-currency-fact-set";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;

type TradeDetailRow = Readonly<{
  round_trip_id: string;
  tags_text: string;
  technical_note: string;
  trade_note: string;
}>;

type TradeExecutionRow = Readonly<{
  execution_id: string;
  executed_at_utc: string;
  price_decimal: string | null;
  quantity_decimal: string;
  round_trip_id: string;
  side: "buy" | "sell";
}>;

function requestedRoundTripIds(request: Request): readonly string[] {
  const values = new URL(request.url).searchParams.get("roundTripIds")?.split(",") ?? [];
  const ids = [...new Set(values.filter((value) => UUID_PATTERN.test(value)))];
  if (ids.length === 0 || ids.length !== values.length || ids.length > 50) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "roundTripIds" });
  }
  return ids;
}

export async function GET(request: Request): Promise<Response> {
  try {
    const scope = requireTraderLinkPlatformRequestScope(request.headers);
    const accountId = scope.activeAccountId;
    if (!accountId) platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
    const roundTripIds = requestedRoundTripIds(request);
    const placeholders = roundTripIds.map(() => "?").join(", ");
    const reporting = await withJournalAnalyticsReportingDashboardRuntime(
      scope,
      ({ reportingContext, reportingCurrency }) => Object.freeze({
        evidence: withReadonlyPlatformDatabase({}, (database) => Object.freeze({
      details: database.prepare<unknown[], TradeDetailRow>(`SELECT
 round_trip.round_trip_id,
 COALESCE((SELECT GROUP_CONCAT(tag.current_name, char(31))
   FROM journal_round_trip_tag_assignments assignment
   JOIN journal_tags tag
     ON tag.workspace_id = assignment.workspace_id
    AND tag.account_id = assignment.account_id
    AND tag.tag_id = assignment.tag_id
   WHERE assignment.workspace_id = round_trip.workspace_id
     AND assignment.account_id = round_trip.account_id
     AND assignment.round_trip_id = round_trip.round_trip_id
     AND assignment.assignment_state = 'assigned'), '') AS tags_text,
 COALESCE((SELECT revision.technical_note
   FROM journal_round_trip_notes note
   JOIN journal_round_trip_note_revisions revision
     ON revision.workspace_id = note.workspace_id
    AND revision.account_id = note.account_id
    AND revision.round_trip_note_id = note.round_trip_note_id
    AND revision.round_trip_note_revision_id = note.current_revision_id
   WHERE note.workspace_id = round_trip.workspace_id
     AND note.account_id = round_trip.account_id
     AND note.round_trip_id = round_trip.round_trip_id), '') AS technical_note,
 COALESCE((SELECT revision.trade_note
   FROM journal_round_trip_notes note
   JOIN journal_round_trip_note_revisions revision
     ON revision.workspace_id = note.workspace_id
    AND revision.account_id = note.account_id
    AND revision.round_trip_note_id = note.round_trip_note_id
    AND revision.round_trip_note_revision_id = note.current_revision_id
   WHERE note.workspace_id = round_trip.workspace_id
     AND note.account_id = round_trip.account_id
     AND note.round_trip_id = round_trip.round_trip_id), '') AS trade_note
FROM journal_round_trips round_trip
WHERE round_trip.workspace_id = ? AND round_trip.account_id = ?
  AND round_trip.round_trip_id IN (${placeholders})`).all(scope.workspaceId, accountId, ...roundTripIds),
      executions: database.prepare<unknown[], TradeExecutionRow>(`SELECT
 version.round_trip_id,
 execution.execution_id,
 execution.executed_at_utc,
 execution.side,
 allocation.quantity_decimal,
 execution.price_decimal
FROM journal_round_trip_execution_allocations allocation
JOIN journal_round_trip_versions version
  ON version.workspace_id = allocation.workspace_id
 AND version.account_id = allocation.account_id
 AND version.round_trip_version_id = allocation.round_trip_version_id
JOIN journal_round_trips round_trip
  ON round_trip.workspace_id = version.workspace_id
 AND round_trip.account_id = version.account_id
 AND round_trip.round_trip_id = version.round_trip_id
 AND round_trip.current_version_id = version.round_trip_version_id
JOIN journal_execution_versions execution
  ON execution.workspace_id = allocation.workspace_id
 AND execution.account_id = allocation.account_id
 AND execution.execution_version_id = allocation.execution_version_id
WHERE allocation.workspace_id = ? AND allocation.account_id = ?
  AND version.round_trip_id IN (${placeholders})
ORDER BY version.round_trip_id, execution.executed_at_utc, allocation.allocation_sequence`).all(scope.workspaceId, accountId, ...roundTripIds),
        })),
        reportingContext,
        reportingCurrency,
      }),
    );
    const evidence = reporting.evidence;
    const executionsByRoundTripId = new Map<string, TradeExecutionRow[]>();
    for (const execution of evidence.executions) {
      const sourceCurrency = reporting.reportingContext.sourceCurrencyByRoundTrip
        .get(execution.round_trip_id);
      const sourceDate = reporting.reportingContext.sourceDateByRoundTrip
        .get(execution.round_trip_id);
      const reportedExecution = execution.price_decimal === null || !sourceCurrency || !sourceDate
        ? execution
        : Object.freeze({
            ...execution,
            price_decimal: journalReportingCurrencyAmount(
              execution.price_decimal,
              sourceCurrency,
              reporting.reportingCurrency,
              sourceDate,
              reporting.reportingContext,
            ),
          });
      const current = executionsByRoundTripId.get(execution.round_trip_id) ?? [];
      current.push(reportedExecution);
      executionsByRoundTripId.set(execution.round_trip_id, current);
    }
    const detailsByRoundTripId = new Map(evidence.details.map((detail) => [detail.round_trip_id, detail]));
    return Response.json({
      trades: roundTripIds.flatMap((roundTripId) => {
        const detail = detailsByRoundTripId.get(roundTripId);
        if (!detail) return [];
        return [Object.freeze({
          executions: executionsByRoundTripId.get(roundTripId) ?? [],
          notes: [detail.trade_note, detail.technical_note].filter((note) => note.trim().length > 0),
          roundTripId,
          tags: detail.tags_text.length > 0 ? detail.tags_text.split(String.fromCharCode(31)) : [],
        })];
      }),
    });
  } catch (error) {
    return Response.json(
      { status: "error" },
      { status: isTraderLinkPlatformError(error) ? 400 : 500 },
    );
  }
}
