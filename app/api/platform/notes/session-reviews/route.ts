import { withScopedJournalAnnotations } from "@/src/modules/journal/server/annotations/journal-annotation-runtime";
import { requireTraderLinkPlatformRequestScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { isTraderLinkPlatformError, platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HEADERS = { "cache-control": "private, no-store, max-age=0" };
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 40;

type SearchInput = Readonly<{
  cursor: string | null;
  from: string | null;
  limit: number;
  query: string | null;
  to: string | null;
}>;

function date(value: string | null, field: string): string | null {
  if (value === null || value === "") return null;
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(value)) platformFailure("TRADERLINK_JOURNAL_ANNOTATION_INVALID", { field });
  return value;
}

function searchInput(request: Request): SearchInput {
  const query = new URL(request.url).searchParams;
  const requestedLimit = Number(query.get("limit") ?? DEFAULT_LIMIT);
  if (!Number.isSafeInteger(requestedLimit) || requestedLimit < 1 || requestedLimit > MAX_LIMIT) {
    platformFailure("TRADERLINK_JOURNAL_ANNOTATION_INVALID", { field: "limit" });
  }
  const text = query.get("q")?.trim() ?? "";
  if (text.length > 160) platformFailure("TRADERLINK_JOURNAL_ANNOTATION_INVALID", { field: "q" });
  return Object.freeze({
    cursor: date(query.get("cursor"), "cursor"),
    from: date(query.get("from"), "from"),
    limit: requestedLimit,
    query: text || null,
    to: date(query.get("to"), "to"),
  });
}

function data(
  database: Parameters<typeof withScopedJournalAnnotations>[0],
  scope: ReturnType<typeof requireTraderLinkPlatformRequestScope>,
  input: SearchInput,
) {
  return withScopedJournalAnnotations(database, scope, (_service, account) => {
    const textLike = input.query ? `%${input.query.toLocaleLowerCase()}%` : null;
    const rows = database.prepare(`
WITH reviewed_days AS (
  SELECT trading_day_id, updated_at_utc FROM journal_daily_notes WHERE workspace_id = ? AND account_id = ?
  UNION ALL SELECT trading_day_id, updated_at_utc FROM journal_categorized_notes WHERE workspace_id = ? AND account_id = ? AND target_kind = 'trading_day'
  UNION ALL SELECT trading_day_id, updated_at_utc FROM journal_trading_day_tag_assignments WHERE workspace_id = ? AND account_id = ? AND assignment_state = 'assigned'
  UNION ALL SELECT trading_day_id, updated_at_utc FROM journal_rule_reviews WHERE workspace_id = ? AND account_id = ? AND target_kind = 'trading_day'
), reviews AS (
  SELECT day.trading_day_id, day.trading_date, MAX(reviewed_days.updated_at_utc) AS updated_at_utc
  FROM reviewed_days JOIN journal_trading_days day
    ON day.workspace_id = ? AND day.account_id = ? AND day.trading_day_id = reviewed_days.trading_day_id
  WHERE day.status = 'active'
  GROUP BY day.trading_day_id, day.trading_date
)
SELECT review.trading_date AS session_date, review.updated_at_utc,
  COALESCE((SELECT (CASE WHEN trim(revision.what_worked) <> '' THEN 1 ELSE 0 END) + (CASE WHEN trim(revision.what_needs_work) <> '' THEN 1 ELSE 0 END) + (CASE WHEN trim(revision.technical_recap) <> '' THEN 1 ELSE 0 END) + (CASE WHEN trim(revision.anything_else) <> '' THEN 1 ELSE 0 END)
   FROM journal_daily_notes note JOIN journal_daily_note_revisions revision
     ON revision.workspace_id = note.workspace_id AND revision.account_id = note.account_id AND revision.daily_note_id = note.daily_note_id AND revision.daily_note_revision_id = note.current_revision_id
   WHERE note.workspace_id = ? AND note.account_id = ? AND note.trading_day_id = review.trading_day_id), 0) +
  (SELECT COUNT(*) FROM journal_categorized_notes note WHERE note.workspace_id = ? AND note.account_id = ? AND note.trading_day_id = review.trading_day_id) AS note_count,
  (SELECT COUNT(*) FROM journal_trading_day_tag_assignments assignment WHERE assignment.workspace_id = ? AND assignment.account_id = ? AND assignment.trading_day_id = review.trading_day_id AND assignment.assignment_state = 'assigned') AS tag_count,
  (SELECT COUNT(*) FROM journal_rule_reviews rule_review
   JOIN journal_rule_review_versions version ON version.workspace_id = rule_review.workspace_id AND version.account_id = rule_review.account_id AND version.rule_review_id = rule_review.rule_review_id AND version.rule_review_version_id = rule_review.current_review_version_id
   WHERE rule_review.workspace_id = ? AND rule_review.account_id = ? AND rule_review.trading_day_id = review.trading_day_id AND rule_review.target_kind = 'trading_day' AND version.status <> 'not_reviewed') AS rule_count
FROM reviews review
WHERE (? IS NULL OR review.trading_date >= ?) AND (? IS NULL OR review.trading_date <= ?) AND (? IS NULL OR review.trading_date < ?)
  AND (? IS NULL OR EXISTS (
    SELECT 1 FROM journal_daily_notes note JOIN journal_daily_note_revisions revision
      ON revision.workspace_id = note.workspace_id AND revision.account_id = note.account_id AND revision.daily_note_id = note.daily_note_id AND revision.daily_note_revision_id = note.current_revision_id
    WHERE note.workspace_id = ? AND note.account_id = ? AND note.trading_day_id = review.trading_day_id
      AND (lower(revision.what_worked) LIKE ? OR lower(revision.what_needs_work) LIKE ? OR lower(revision.technical_recap) LIKE ? OR lower(revision.anything_else) LIKE ?)
  ) OR EXISTS (
    SELECT 1 FROM journal_categorized_notes note JOIN journal_categorized_note_revisions revision
      ON revision.workspace_id = note.workspace_id AND revision.account_id = note.account_id AND revision.categorized_note_id = note.categorized_note_id AND revision.categorized_note_revision_id = note.current_revision_id
    WHERE note.workspace_id = ? AND note.account_id = ? AND note.trading_day_id = review.trading_day_id AND lower(revision.note_text) LIKE ?
  ) OR EXISTS (
    SELECT 1 FROM journal_trading_day_tag_assignments assignment JOIN journal_tags tag
      ON tag.workspace_id = assignment.workspace_id AND tag.account_id = assignment.account_id AND tag.tag_id = assignment.tag_id
    WHERE assignment.workspace_id = ? AND assignment.account_id = ? AND assignment.trading_day_id = review.trading_day_id AND assignment.assignment_state = 'assigned' AND lower(tag.current_name) LIKE ?
  ))
ORDER BY review.trading_date DESC, review.updated_at_utc DESC
LIMIT ?`).all(
      account.workspaceId, account.accountId,
      account.workspaceId, account.accountId,
      account.workspaceId, account.accountId,
      account.workspaceId, account.accountId,
      account.workspaceId, account.accountId,
      account.workspaceId, account.accountId,
      account.workspaceId, account.accountId,
      account.workspaceId, account.accountId,
      account.workspaceId, account.accountId,
      input.from, input.from, input.to, input.to, input.cursor, input.cursor,
      textLike,
      account.workspaceId, account.accountId, textLike, textLike, textLike, textLike,
      account.workspaceId, account.accountId, textLike,
      account.workspaceId, account.accountId, textLike,
      input.limit + 1,
    ) as Array<{ note_count: number; rule_count: number; session_date: string; tag_count: number; updated_at_utc: string }>;
    const visible = rows.slice(0, input.limit).map((row) => Object.freeze({
      noteCount: row.note_count,
      ruleCount: row.rule_count,
      sessionDate: row.session_date,
      tagCount: row.tag_count,
      updatedAtUtc: row.updated_at_utc,
    }));
    return Object.freeze({
      nextCursor: rows.length > input.limit ? visible.at(-1)?.sessionDate ?? null : null,
      sessionReviews: Object.freeze(visible),
    });
  });
}

export async function GET(request: Request): Promise<Response> {
  try {
    const scope = requireTraderLinkPlatformRequestScope(request.headers);
    const result = withReadonlyPlatformDatabase({}, (database) => data(database, scope, searchInput(request)));
    return Response.json({ ...result, status: "ready" }, { headers: HEADERS });
  } catch (error) {
    return Response.json({ status: "unavailable" }, { headers: HEADERS, status: isTraderLinkPlatformError(error) ? 400 : 500 });
  }
}
