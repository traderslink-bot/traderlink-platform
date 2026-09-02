import { withScopedJournalAnnotations } from "@/src/modules/journal/server/annotations/journal-annotation-runtime";
import { requireTraderLinkPlatformRequestScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { isTraderLinkPlatformError } from "@/src/modules/platform/server/database/platform-migration-contract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HEADERS = { "cache-control": "private, no-store, max-age=0" };

function data(database: Parameters<typeof withScopedJournalAnnotations>[0], scope: ReturnType<typeof requireTraderLinkPlatformRequestScope>) {
  return withScopedJournalAnnotations(database, scope, (_service, account) => Object.freeze(database.prepare(`
WITH reviewed_days AS (
  SELECT trading_day_id, updated_at_utc
  FROM journal_daily_notes
  WHERE workspace_id = ? AND account_id = ?
  UNION ALL
  SELECT trading_day_id, updated_at_utc
  FROM journal_categorized_notes
  WHERE workspace_id = ? AND account_id = ? AND target_kind = 'trading_day'
  UNION ALL
  SELECT trading_day_id, updated_at_utc
  FROM journal_trading_day_tag_assignments
  WHERE workspace_id = ? AND account_id = ? AND assignment_state = 'assigned'
  UNION ALL
  SELECT trading_day_id, updated_at_utc
  FROM journal_rule_reviews
  WHERE workspace_id = ? AND account_id = ? AND target_kind = 'trading_day'
)
SELECT day.trading_date AS session_date, MAX(reviewed_days.updated_at_utc) AS updated_at_utc
FROM reviewed_days
JOIN journal_trading_days day
  ON day.workspace_id = ? AND day.account_id = ? AND day.trading_day_id = reviewed_days.trading_day_id
WHERE day.status = 'active'
GROUP BY day.trading_day_id, day.trading_date
ORDER BY day.trading_date DESC, updated_at_utc DESC
LIMIT 120`).all(
    account.workspaceId, account.accountId,
    account.workspaceId, account.accountId,
    account.workspaceId, account.accountId,
    account.workspaceId, account.accountId,
    account.workspaceId, account.accountId,
  ).map((row) => {
    const value = row as { session_date: string; updated_at_utc: string };
    return Object.freeze({ sessionDate: value.session_date, updatedAtUtc: value.updated_at_utc });
  })));
}

export async function GET(request: Request): Promise<Response> {
  try {
    const scope = requireTraderLinkPlatformRequestScope(request.headers);
    const sessionReviews = withReadonlyPlatformDatabase({}, (database) => data(database, scope));
    return Response.json({ sessionReviews, status: "ready" }, { headers: HEADERS });
  } catch (error) {
    return Response.json({ status: "unavailable" }, { headers: HEADERS, status: isTraderLinkPlatformError(error) ? 400 : 500 });
  }
}
