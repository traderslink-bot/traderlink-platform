import type Database from "better-sqlite3";

import type {
  JournalAdminDataDecisionItem,
  JournalAdminDataDecisions,
  JournalAdminDecisionIssueAggregate,
} from "../../contracts/journal-administration-contracts";
import type { JournalAdminScope } from "@/src/modules/platform/contracts/journal-admin-scope";
import type { PlatformAdminReferenceKeyConfiguration } from "@/src/modules/platform/server/administration/platform-admin-reference-authority";
import { platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";
import {
  boundedToken,
  createJournalAdminReadContext,
  journalAdminCoverage,
  journalAdminReference,
} from "./journal-admin-read-helpers";

type AggregateRow = Readonly<{
  issue_code: string;
  target_kind: string;
  unresolved_count: number;
  resolved_count: number;
  affected_user_count: number;
  affected_account_count: number;
  oldest_unresolved_at_utc: string | null;
}>;
type DecisionRow = Readonly<{
  decision_id: string;
  issue_code: string;
  target_kind: string;
  effect_code: string;
  state: string;
  display_name: string;
  account_display_name: string;
  created_at_utc: string;
  updated_at_utc: string;
}>;
type ActionRow = Readonly<{ action: string; count: number }>;
type EffectRow = Readonly<{ effect_code: string; count: number }>;
type FailureRow = Readonly<{ receipts: number; failures: number }>;

export class JournalAdminDecisionService {
  private readonly context;

  constructor(input: Readonly<{
    database: Database.Database;
    scope: JournalAdminScope;
    configuration?: PlatformAdminReferenceKeyConfiguration;
    now?: Date;
  }>) {
    this.context = createJournalAdminReadContext(input);
  }

  read(input: Readonly<{
    issueCode?: string;
    targetKind?: string;
    brokerLabel?: string;
    unresolvedOnly?: boolean;
  }> = {}): JournalAdminDataDecisions {
    const clauses: string[] = [];
    const bindings: string[] = [];
    const issueCode = boundedToken(input.issueCode, "issueCode");
    const targetKind = boundedToken(input.targetKind, "targetKind");
    if (issueCode) {
      clauses.push("decision.issue_code = ?");
      bindings.push(issueCode);
    }
    if (targetKind) {
      clauses.push("decision.target_kind = ?");
      bindings.push(targetKind);
    }
    if (input.unresolvedOnly) clauses.push("decision.state = 'pending'");
    if (input.brokerLabel) {
      if (input.brokerLabel.length > 80 || /[\u0000-\u001f\u007f]/u.test(input.brokerLabel)) {
        platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
          field: "brokerLabel",
        });
      }
      clauses.push(`EXISTS (
        SELECT 1 FROM journal_source_row_issues source_issue
        JOIN journal_import_batches batch
          ON batch.workspace_id = source_issue.workspace_id
         AND batch.account_id = source_issue.account_id
         AND batch.import_batch_id = source_issue.import_batch_id
        WHERE source_issue.source_issue_id = decision.source_issue_id
          AND batch.source_system = ? COLLATE NOCASE)`);
      bindings.push(input.brokerLabel);
    }
    const where = clauses.length ? ` WHERE ${clauses.join(" AND ")}` : "";
    const aggregates = this.context.database.prepare<unknown[], AggregateRow>(`SELECT
  decision.issue_code, decision.target_kind,
  SUM(CASE WHEN decision.state = 'pending' THEN 1 ELSE 0 END) AS unresolved_count,
  SUM(CASE WHEN decision.state = 'resolved' THEN 1 ELSE 0 END) AS resolved_count,
  COUNT(DISTINCT account.created_by_user_id) AS affected_user_count,
  COUNT(DISTINCT decision.account_id) AS affected_account_count,
  MIN(CASE WHEN decision.state = 'pending' THEN decision.created_at_utc END) AS oldest_unresolved_at_utc
FROM journal_data_decisions decision
JOIN journal_accounts account
  ON account.workspace_id = decision.workspace_id AND account.account_id = decision.account_id
${where}
GROUP BY decision.issue_code, decision.target_kind
ORDER BY unresolved_count DESC, resolved_count DESC, decision.issue_code, decision.target_kind
LIMIT 100`).all(...bindings).map((row): JournalAdminDecisionIssueAggregate => Object.freeze({
      issueCode: row.issue_code,
      targetKind: row.target_kind,
      unresolvedCount: row.unresolved_count,
      resolvedCount: row.resolved_count,
      affectedUserCount: row.affected_user_count,
      affectedAccountCount: row.affected_account_count,
      oldestUnresolvedAtUtc: row.oldest_unresolved_at_utc,
    }));
    const oldestWhere = clauses.length
      ? ` WHERE decision.state = 'pending' AND ${clauses.join(" AND ")}`
      : " WHERE decision.state = 'pending'";
    const oldest = this.context.database.prepare<unknown[], DecisionRow>(`SELECT
  decision.decision_id, decision.issue_code, decision.target_kind,
  decision.effect_code, decision.state, user.display_name,
  account.display_name AS account_display_name,
  decision.created_at_utc, decision.updated_at_utc
FROM journal_data_decisions decision
JOIN journal_accounts account
  ON account.workspace_id = decision.workspace_id AND account.account_id = decision.account_id
JOIN platform_users user ON user.user_id = account.created_by_user_id
${oldestWhere}
ORDER BY decision.created_at_utc, decision.decision_id LIMIT 25`).all(...bindings)
      .map((row): JournalAdminDataDecisionItem => Object.freeze({
        decisionRef: journalAdminReference(this.context, "data_decision", row.decision_id),
        issueCode: row.issue_code,
        targetKind: row.target_kind,
        effectCode: row.effect_code,
        state: row.state,
        userDisplayName: row.display_name,
        accountDisplayName: row.account_display_name,
        createdAtUtc: row.created_at_utc,
        updatedAtUtc: row.updated_at_utc,
        ageDays: Math.max(0, Math.floor(
          (this.context.now.getTime() - Date.parse(row.created_at_utc)) / 86_400_000,
        )),
      }));
    const actions = this.context.database.prepare<[], ActionRow>(`SELECT action, COUNT(*) AS count
FROM journal_data_decision_events
WHERE actor_kind = 'user'
GROUP BY action ORDER BY count DESC, action LIMIT 100`).all()
      .map((row) => Object.freeze({ action: row.action, count: row.count }));
    const affectedSurfaceCounts = Object.fromEntries(
      this.context.database.prepare<[], EffectRow>(`SELECT effect_code, COUNT(*) AS count
FROM journal_data_decisions WHERE state = 'pending'
GROUP BY effect_code ORDER BY effect_code`).all()
        .map((row) => [row.effect_code, row.count]),
    );
    const failures = this.context.database.prepare<[], FailureRow>(`SELECT
  COUNT(*) AS receipts,
  SUM(CASE WHEN state = 'failed' AND outcome_code LIKE '%rebuild%' THEN 1 ELSE 0 END) AS failures
FROM platform_operational_events WHERE operation_kind = 'background_job'`).get()!;
    return Object.freeze({
      coverage: journalAdminCoverage(this.context),
      aggregates: Object.freeze(aggregates),
      oldestUnresolved: Object.freeze(oldest),
      resolutionActions: Object.freeze(actions),
      affectedSurfaceCounts: Object.freeze(affectedSurfaceCounts),
      rebuildFailureCount: failures.receipts === 0 ? null : failures.failures,
    });
  }
}
