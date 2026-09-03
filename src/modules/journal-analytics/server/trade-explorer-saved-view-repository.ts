import type Database from "better-sqlite3";

import {
  TRADE_EXPLORER_SAVED_VIEW_VERSION,
  type TradeExplorerSavedViewRecord,
} from "@/src/modules/journal-analytics/contracts/trade-explorer-saved-view";
import type { AccountScope } from "@/src/modules/platform/contracts/workspace-access-scope";

type SavedViewRow = Readonly<{
  saved_view_id: string;
  name: string;
  view_version: typeof TRADE_EXPLORER_SAVED_VIEW_VERSION;
  normalized_view_json: string;
  view_sha256: string;
  lifecycle_state: "active" | "retired";
  revision: number;
  created_at_utc: string;
  updated_at_utc: string;
}>;

function mapSavedView(row: SavedViewRow): TradeExplorerSavedViewRecord {
  return Object.freeze({
    savedViewId: row.saved_view_id,
    name: row.name,
    viewVersion: row.view_version,
    normalizedViewJson: row.normalized_view_json,
    viewSha256: row.view_sha256,
    lifecycleState: row.lifecycle_state,
    revision: Number(row.revision),
    createdAtUtc: row.created_at_utc,
    updatedAtUtc: row.updated_at_utc,
  });
}

const SAVED_VIEW_SELECT = `SELECT saved.saved_view_id, version.name,
  version.view_version, version.normalized_view_json, version.view_sha256,
  saved.lifecycle_state, saved.revision, saved.created_at_utc, saved.updated_at_utc
FROM journal_trade_explorer_saved_views saved
JOIN journal_trade_explorer_saved_view_versions version
  ON version.workspace_id = saved.workspace_id
 AND version.account_id = saved.account_id
 AND version.saved_view_id = saved.saved_view_id
 AND version.saved_view_version_id = saved.current_version_id`;

export class TradeExplorerSavedViewRepository {
  constructor(private readonly database: Database.Database) {}

  immediate<T>(operation: () => T): T {
    return this.database.inTransaction
      ? operation()
      : this.database.transaction(operation).immediate();
  }

  listActive(scope: AccountScope): readonly TradeExplorerSavedViewRecord[] {
    const rows = this.database.prepare(`${SAVED_VIEW_SELECT}
WHERE saved.workspace_id = ? AND saved.account_id = ? AND saved.lifecycle_state = 'active'
ORDER BY saved.updated_at_utc DESC, version.name COLLATE BINARY, saved.saved_view_id`).all(
      scope.workspaceId,
      scope.accountId,
    ) as SavedViewRow[];
    return Object.freeze(rows.map(mapSavedView));
  }

  find(scope: AccountScope, savedViewId: string): TradeExplorerSavedViewRecord | null {
    const row = this.database.prepare(`${SAVED_VIEW_SELECT}
WHERE saved.workspace_id = ? AND saved.account_id = ? AND saved.saved_view_id = ?`).get(
      scope.workspaceId,
      scope.accountId,
      savedViewId,
    ) as SavedViewRow | undefined;
    return row ? mapSavedView(row) : null;
  }

  countActive(scope: AccountScope): number {
    const row = this.database.prepare(`SELECT COUNT(*) AS count
FROM journal_trade_explorer_saved_views
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
    normalizedViewJson: string;
    viewSha256: string;
    timestamp: string;
  }>): void {
    this.database.prepare(`INSERT INTO journal_trade_explorer_saved_view_versions (
  saved_view_version_id, workspace_id, account_id, saved_view_id,
  version_number, event_kind, name, view_version, normalized_view_json,
  view_sha256, lifecycle_state, authored_by_user_id, created_at_utc
) VALUES (?, ?, ?, ?, 1, 'created', ?, ?, ?, ?, 'active', ?, ?)`).run(
      input.versionId,
      input.scope.workspaceId,
      input.scope.accountId,
      input.savedViewId,
      input.name,
      TRADE_EXPLORER_SAVED_VIEW_VERSION,
      input.normalizedViewJson,
      input.viewSha256,
      input.scope.userId,
      input.timestamp,
    );
    this.database.prepare(`INSERT INTO journal_trade_explorer_saved_views (
  saved_view_id, workspace_id, account_id, current_version_id,
  lifecycle_state, revision, created_by_user_id, created_at_utc, updated_at_utc
) VALUES (?, ?, ?, ?, 'active', 1, ?, ?, ?)`).run(
      input.savedViewId,
      input.scope.workspaceId,
      input.scope.accountId,
      input.versionId,
      input.scope.userId,
      input.timestamp,
      input.timestamp,
    );
  }
}
