import type Database from "better-sqlite3";

import {
  TRADE_EXPLORER_COMPARISON_STUDY_VERSION,
  type TradeExplorerComparisonStudyLifecycleState,
  type TradeExplorerComparisonStudyRecord,
} from "@/src/modules/journal-analytics/contracts/trade-explorer-comparison-study";
import type { AccountScope } from "@/src/modules/platform/contracts/workspace-access-scope";

type StudyRow = Readonly<{
  study_id: string;
  name: string;
  study_version: typeof TRADE_EXPLORER_COMPARISON_STUDY_VERSION;
  normalized_study_json: string;
  study_sha256: string;
  lifecycle_state: TradeExplorerComparisonStudyLifecycleState;
  revision: number;
  created_at_utc: string;
  updated_at_utc: string;
}>;

function mapStudy(row: StudyRow): TradeExplorerComparisonStudyRecord {
  return Object.freeze({
    studyId: row.study_id,
    name: row.name,
    studyVersion: row.study_version,
    normalizedStudyJson: row.normalized_study_json,
    studySha256: row.study_sha256,
    lifecycleState: row.lifecycle_state,
    revision: Number(row.revision),
    createdAtUtc: row.created_at_utc,
    updatedAtUtc: row.updated_at_utc,
  });
}

const STUDY_SELECT = `SELECT study.study_id, version.name,
  version.study_version, version.normalized_study_json, version.study_sha256,
  study.lifecycle_state, study.revision, study.created_at_utc, study.updated_at_utc
FROM journal_trade_explorer_comparison_studies study
JOIN journal_trade_explorer_comparison_study_versions version
  ON version.workspace_id = study.workspace_id
 AND version.account_id = study.account_id
 AND version.study_id = study.study_id
 AND version.study_version_id = study.current_version_id`;

export class TradeExplorerComparisonStudyRepository {
  constructor(private readonly database: Database.Database) {}

  immediate<T>(operation: () => T): T {
    return this.database.inTransaction
      ? operation()
      : this.database.transaction(operation).immediate();
  }

  listActive(scope: AccountScope): readonly TradeExplorerComparisonStudyRecord[] {
    const rows = this.database.prepare(`${STUDY_SELECT}
WHERE study.workspace_id = ? AND study.account_id = ? AND study.lifecycle_state = 'active'
ORDER BY study.updated_at_utc DESC, version.name COLLATE BINARY, study.study_id`).all(
      scope.workspaceId,
      scope.accountId,
    ) as StudyRow[];
    return Object.freeze(rows.map(mapStudy));
  }

  find(scope: AccountScope, studyId: string): TradeExplorerComparisonStudyRecord | null {
    const row = this.database.prepare(`${STUDY_SELECT}
WHERE study.workspace_id = ? AND study.account_id = ? AND study.study_id = ?`).get(
      scope.workspaceId,
      scope.accountId,
      studyId,
    ) as StudyRow | undefined;
    return row ? mapStudy(row) : null;
  }

  countActive(scope: AccountScope): number {
    const row = this.database.prepare(`SELECT COUNT(*) AS count
FROM journal_trade_explorer_comparison_studies
WHERE workspace_id = ? AND account_id = ? AND lifecycle_state = 'active'`).get(
      scope.workspaceId,
      scope.accountId,
    ) as { count: number };
    return Number(row.count);
  }

  insert(input: Readonly<{
    scope: AccountScope;
    studyId: string;
    versionId: string;
    name: string;
    normalizedStudyJson: string;
    studySha256: string;
    timestamp: string;
  }>): void {
    this.database.prepare(`INSERT INTO journal_trade_explorer_comparison_study_versions (
  study_version_id, workspace_id, account_id, study_id, version_number,
  event_kind, name, study_version, normalized_study_json, study_sha256,
  lifecycle_state, authored_by_user_id, created_at_utc
) VALUES (?, ?, ?, ?, 1, 'created', ?, ?, ?, ?, 'active', ?, ?)`).run(
      input.versionId,
      input.scope.workspaceId,
      input.scope.accountId,
      input.studyId,
      input.name,
      TRADE_EXPLORER_COMPARISON_STUDY_VERSION,
      input.normalizedStudyJson,
      input.studySha256,
      input.scope.userId,
      input.timestamp,
    );
    this.database.prepare(`INSERT INTO journal_trade_explorer_comparison_studies (
  study_id, workspace_id, account_id, current_version_id, lifecycle_state,
  revision, created_by_user_id, created_at_utc, updated_at_utc
) VALUES (?, ?, ?, ?, 'active', 1, ?, ?, ?)`).run(
      input.studyId,
      input.scope.workspaceId,
      input.scope.accountId,
      input.versionId,
      input.scope.userId,
      input.timestamp,
      input.timestamp,
    );
  }

  append(input: Readonly<{
    scope: AccountScope;
    studyId: string;
    expectedRevision: number;
    versionId: string;
    eventKind: "updated" | "retired";
    name: string;
    normalizedStudyJson: string;
    studySha256: string;
    lifecycleState: TradeExplorerComparisonStudyLifecycleState;
    timestamp: string;
  }>): boolean {
    const nextRevision = input.expectedRevision + 1;
    this.database.prepare(`INSERT INTO journal_trade_explorer_comparison_study_versions (
  study_version_id, workspace_id, account_id, study_id, version_number,
  event_kind, name, study_version, normalized_study_json, study_sha256,
  lifecycle_state, authored_by_user_id, created_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      input.versionId,
      input.scope.workspaceId,
      input.scope.accountId,
      input.studyId,
      nextRevision,
      input.eventKind,
      input.name,
      TRADE_EXPLORER_COMPARISON_STUDY_VERSION,
      input.normalizedStudyJson,
      input.studySha256,
      input.lifecycleState,
      input.scope.userId,
      input.timestamp,
    );
    return this.database.prepare(`UPDATE journal_trade_explorer_comparison_studies
SET current_version_id = ?, lifecycle_state = ?, revision = ?, updated_at_utc = ?
WHERE workspace_id = ? AND account_id = ? AND study_id = ?
  AND lifecycle_state = 'active' AND revision = ?`).run(
      input.versionId,
      input.lifecycleState,
      nextRevision,
      input.timestamp,
      input.scope.workspaceId,
      input.scope.accountId,
      input.studyId,
      input.expectedRevision,
    ).changes === 1;
  }
}
