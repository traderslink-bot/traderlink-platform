import type Database from "better-sqlite3";

import {
  ANALYTICS_LAB_SAVED_VIEW_QUERY_VERSION,
  type JournalAnalyticsSavedViewLifecycleState,
  type JournalAnalyticsSavedViewRecord,
} from "@/src/modules/journal-analytics/contracts/analytics-lab-saved-view";
import type { AccountScope } from "@/src/modules/platform/contracts/workspace-access-scope";

type SavedViewRow = Readonly<{
  saved_view_id: string;
  name: string;
  query_version: typeof ANALYTICS_LAB_SAVED_VIEW_QUERY_VERSION;
  normalized_query_json: string;
  query_sha256: string;
  lifecycle_state: JournalAnalyticsSavedViewLifecycleState;
  revision: number;
  created_at_utc: string;
  updated_at_utc: string;
}>;

function mapSavedView(row: SavedViewRow): JournalAnalyticsSavedViewRecord {
  return Object.freeze({
    savedViewId: row.saved_view_id,
    name: row.name,
    queryVersion: row.query_version,
    normalizedQueryJson: row.normalized_query_json,
    querySha256: row.query_sha256,
    lifecycleState: row.lifecycle_state,
    revision: Number(row.revision),
    createdAtUtc: row.created_at_utc,
    updatedAtUtc: row.updated_at_utc,
  });
}

const SAVED_VIEW_SELECT = `SELECT v.saved_view_id, version.name,
  version.query_version, version.normalized_query_json, version.query_sha256,
  v.lifecycle_state, v.revision, v.created_at_utc, v.updated_at_utc
FROM journal_analytics_saved_views v
JOIN journal_analytics_saved_view_versions version
  ON version.workspace_id = v.workspace_id
 AND version.account_id = v.account_id
 AND version.saved_view_id = v.saved_view_id
 AND version.saved_view_version_id = v.current_version_id`;

export class JournalAnalyticsSavedViewRepository {
  constructor(private readonly database: Database.Database) {}

  immediate<T>(operation: () => T): T {
    return this.database.inTransaction
      ? operation()
      : this.database.transaction(operation).immediate();
  }

  listActive(scope: AccountScope): readonly JournalAnalyticsSavedViewRecord[] {
    const rows = this.database.prepare(`${SAVED_VIEW_SELECT}
WHERE v.workspace_id = ? AND v.account_id = ? AND v.lifecycle_state = 'active'
ORDER BY v.updated_at_utc DESC, version.name COLLATE BINARY, v.saved_view_id`).all(
      scope.workspaceId,
      scope.accountId,
    ) as SavedViewRow[];
    return Object.freeze(rows.map(mapSavedView));
  }

  find(
    scope: AccountScope,
    savedViewId: string,
  ): JournalAnalyticsSavedViewRecord | null {
    const row = this.database.prepare(`${SAVED_VIEW_SELECT}
WHERE v.workspace_id = ? AND v.account_id = ? AND v.saved_view_id = ?`).get(
      scope.workspaceId,
      scope.accountId,
      savedViewId,
    ) as SavedViewRow | undefined;
    return row ? mapSavedView(row) : null;
  }

  countActive(scope: AccountScope): number {
    const row = this.database.prepare(`SELECT COUNT(*) AS count
FROM journal_analytics_saved_views
WHERE workspace_id = ? AND account_id = ? AND lifecycle_state = 'active'`).get(
      scope.workspaceId,
      scope.accountId,
    ) as { count: number };
    return Number(row.count);
  }

  insert(input: Readonly<{
    scope: AccountScope;
    savedViewId: string;
    versionId: string;
    name: string;
    queryVersion: typeof ANALYTICS_LAB_SAVED_VIEW_QUERY_VERSION;
    normalizedQueryJson: string;
    querySha256: string;
    timestamp: string;
  }>): void {
    this.database.prepare(`INSERT INTO journal_analytics_saved_view_versions (
  saved_view_version_id, workspace_id, account_id, saved_view_id,
  version_number, event_kind, name, query_version, normalized_query_json,
  query_sha256, lifecycle_state, authored_by_user_id, created_at_utc
) VALUES (?, ?, ?, ?, 1, 'created', ?, ?, ?, ?, 'active', ?, ?)`)
      .run(input.versionId, input.scope.workspaceId, input.scope.accountId,
        input.savedViewId, input.name, input.queryVersion,
        input.normalizedQueryJson, input.querySha256, input.scope.userId,
        input.timestamp);
    this.database.prepare(`INSERT INTO journal_analytics_saved_views (
  saved_view_id, workspace_id, account_id, current_version_id,
  lifecycle_state, revision, created_by_user_id, created_at_utc, updated_at_utc
) VALUES (?, ?, ?, ?, 'active', 1, ?, ?, ?)`)
      .run(input.savedViewId, input.scope.workspaceId, input.scope.accountId,
        input.versionId, input.scope.userId, input.timestamp, input.timestamp);
  }

  append(input: Readonly<{
    scope: AccountScope;
    savedViewId: string;
    expectedRevision: number;
    versionId: string;
    eventKind: "updated" | "retired";
    name: string;
    queryVersion: typeof ANALYTICS_LAB_SAVED_VIEW_QUERY_VERSION;
    normalizedQueryJson: string;
    querySha256: string;
    lifecycleState: JournalAnalyticsSavedViewLifecycleState;
    timestamp: string;
  }>): boolean {
    const nextRevision = input.expectedRevision + 1;
    this.database.prepare(`INSERT INTO journal_analytics_saved_view_versions (
  saved_view_version_id, workspace_id, account_id, saved_view_id,
  version_number, event_kind, name, query_version, normalized_query_json,
  query_sha256, lifecycle_state, authored_by_user_id, created_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(input.versionId, input.scope.workspaceId, input.scope.accountId,
        input.savedViewId, nextRevision, input.eventKind, input.name,
        input.queryVersion, input.normalizedQueryJson, input.querySha256,
        input.lifecycleState, input.scope.userId, input.timestamp);
    return this.database.prepare(`UPDATE journal_analytics_saved_views
SET current_version_id = ?, lifecycle_state = ?, revision = ?, updated_at_utc = ?
WHERE workspace_id = ? AND account_id = ? AND saved_view_id = ?
  AND lifecycle_state = 'active' AND revision = ?`).run(
      input.versionId,
      input.lifecycleState,
      nextRevision,
      input.timestamp,
      input.scope.workspaceId,
      input.scope.accountId,
      input.savedViewId,
      input.expectedRevision,
    ).changes === 1;
  }
}
