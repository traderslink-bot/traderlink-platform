import { createHash } from "node:crypto";

import type Database from "better-sqlite3";

import type {
  JournalExecutionReconciliationMemberRecord,
  JournalExecutionReconciliationSetRecord,
  JournalExecutionReconciliationState,
  JournalManualExecutionCandidate,
} from "../../contracts/journal-execution-reconciliation-contracts";
import type { AccountScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import {
  createCanonicalUuidV4,
  platformFailure,
} from "@/src/modules/platform/server/database/platform-migration-contract";

function sha256(parts: readonly string[]): string {
  return createHash("sha256").update(parts.join("\u001f"), "utf8").digest("hex");
}

function mapSet(row: {
  reconciliation_set_id: string;
  overlap_key_sha256: string;
  state: JournalExecutionReconciliationState;
  decision_id: string | null;
  revision: number;
  current_event_id: string;
  created_at_utc: string;
  updated_at_utc: string;
}): JournalExecutionReconciliationSetRecord {
  return Object.freeze({
    reconciliationSetId: row.reconciliation_set_id,
    overlapKeySha256: row.overlap_key_sha256,
    state: row.state,
    decisionId: row.decision_id,
    revision: row.revision,
    currentEventId: row.current_event_id,
    createdAtUtc: row.created_at_utc,
    updatedAtUtc: row.updated_at_utc,
  });
}

const SET_SELECT = `SELECT reconciliation_set_id, overlap_key_sha256, state,
 decision_id, revision, current_event_id, created_at_utc, updated_at_utc
FROM journal_execution_reconciliation_sets`;

export class JournalExecutionReconciliationRepository {
  constructor(private readonly database: Database.Database) {}

  immediate<T>(operation: () => T): T {
    return this.database.inTransaction
      ? operation()
      : this.database.transaction(operation).immediate();
  }

  listEligibleManualExecutions(
    workspaceId: string,
    accountId: string,
    executionIds?: readonly string[],
  ): readonly JournalManualExecutionCandidate[] {
    if (executionIds?.length === 0) return Object.freeze([]);
    const executionFilter = executionIds
      ? `\n  AND execution.execution_id IN (${executionIds.map(() => "?").join(", ")})`
      : "";
    return Object.freeze(this.database.prepare<[string, string, ...string[]], {
      execution_id: string;
      current_version_id: string;
      instrument_id: string;
      asset_class: string;
      normalized_symbol: string;
      trade_currency: string;
      source_timestamp_text: string;
      source_timezone: string;
      executed_at_utc: string;
      side: "buy" | "sell";
      quantity_decimal: string;
      price_decimal: string | null;
      fees_decimal: string | null;
      fee_currency: string | null;
      account_timezone: string;
    }>(`SELECT execution.execution_id, execution.current_version_id,
 version.instrument_id, instrument.asset_class, instrument.normalized_symbol,
 version.trade_currency, version.source_timestamp_text, version.source_timezone,
 version.executed_at_utc, version.side, version.quantity_decimal,
 version.price_decimal, version.fees_decimal, version.fee_currency,
 account.trading_timezone AS account_timezone
FROM journal_executions execution
JOIN journal_execution_versions version
  ON version.workspace_id = execution.workspace_id
 AND version.account_id = execution.account_id
 AND version.execution_version_id = execution.current_version_id
JOIN journal_instruments instrument
  ON instrument.workspace_id = version.workspace_id
 AND instrument.instrument_id = version.instrument_id
JOIN journal_accounts account
  ON account.workspace_id = execution.workspace_id
 AND account.account_id = execution.account_id
WHERE execution.workspace_id = ? AND execution.account_id = ?
  AND execution.current_state = 'accepted'
  ${executionFilter}
  AND EXISTS (
    SELECT 1 FROM journal_execution_identity_aliases alias
    WHERE alias.workspace_id = execution.workspace_id
      AND alias.account_id = execution.account_id
      AND alias.execution_id = execution.execution_id
      AND alias.alias_type = 'manual_entry' AND alias.status = 'active'
  )
  AND NOT EXISTS (
    SELECT 1
    FROM journal_execution_reconciliation_members pending_member
    JOIN journal_execution_reconciliation_sets pending_set
      ON pending_set.workspace_id = pending_member.workspace_id
     AND pending_set.account_id = pending_member.account_id
     AND pending_set.reconciliation_set_id = pending_member.reconciliation_set_id
    WHERE pending_member.workspace_id = execution.workspace_id
      AND pending_member.account_id = execution.account_id
      AND pending_member.execution_id = execution.execution_id
      AND pending_member.member_role = 'manual_execution'
      AND pending_set.state = 'pending'
  )
ORDER BY version.executed_at_utc, version.source_order_key, execution.execution_id`)
      .all(workspaceId, accountId, ...(executionIds ?? []))
      .map((row) => Object.freeze({
        executionId: row.execution_id,
        currentVersionId: row.current_version_id,
        instrumentId: row.instrument_id,
        assetClass: row.asset_class,
        normalizedSymbol: row.normalized_symbol,
        tradeCurrency: row.trade_currency,
        sourceTimestampText: row.source_timestamp_text,
        sourceTimezone: row.source_timezone,
        executedAtUtc: row.executed_at_utc,
        side: row.side,
        quantityDecimal: row.quantity_decimal,
        priceDecimal: row.price_decimal,
        feesDecimal: row.fees_decimal,
        feeCurrency: row.fee_currency,
        accountTimezone: row.account_timezone,
      })));
  }

  findByOverlapKey(
    workspaceId: string,
    accountId: string,
    overlapKeySha256: string,
  ): JournalExecutionReconciliationSetRecord | null {
    const row = this.database.prepare<[string, string, string], Parameters<typeof mapSet>[0]>(`${SET_SELECT}
WHERE workspace_id = ? AND account_id = ? AND overlap_key_sha256 = ?`)
      .get(workspaceId, accountId, overlapKeySha256);
    return row ? mapSet(row) : null;
  }

  findByDecision(
    scope: AccountScope,
    decisionId: string,
  ): JournalExecutionReconciliationSetRecord | null {
    const row = this.database.prepare<[string, string, string], Parameters<typeof mapSet>[0]>(`${SET_SELECT}
WHERE workspace_id = ? AND account_id = ? AND decision_id = ?`)
      .get(scope.workspaceId, scope.accountId, decisionId);
    return row ? mapSet(row) : null;
  }

  createCandidate(input: Readonly<{
    scope: AccountScope;
    overlapKeySha256: string;
    manualExecutionIds: readonly string[];
    provisionalExecutions: readonly Readonly<{
      executionId: string;
      sourceRowId: string;
      evidenceSha256: string;
    }>[];
    evidenceSha256: string;
    timestamp: string;
  }>): JournalExecutionReconciliationSetRecord {
    const existing = this.findByOverlapKey(
      input.scope.workspaceId,
      input.scope.accountId,
      input.overlapKeySha256,
    );
    if (existing) return existing;
    const reconciliationSetId = createCanonicalUuidV4();
    const eventId = createCanonicalUuidV4();
    this.database.prepare(`INSERT INTO journal_execution_reconciliation_sets (
 reconciliation_set_id, user_id, workspace_id, account_id, overlap_key_sha256,
 matching_basis_version, state, decision_id, revision, current_event_id,
 created_at_utc, updated_at_utc, resolved_at_utc
) VALUES (?, ?, ?, ?, ?, 'manual_broker_reconciliation_v1', 'pending',
 NULL, 1, ?, ?, ?, NULL)`).run(
      reconciliationSetId,
      input.scope.userId,
      input.scope.workspaceId,
      input.scope.accountId,
      input.overlapKeySha256,
      eventId,
      input.timestamp,
      input.timestamp,
    );
    this.database.prepare(`INSERT INTO journal_execution_reconciliation_events (
 reconciliation_event_id, workspace_id, account_id, reconciliation_set_id,
 event_sequence, action, prior_state, new_state, expected_revision, actor_kind,
 actor_user_id, reason_code, evidence_sha256, idempotency_sha256, occurred_at_utc
) VALUES (?, ?, ?, ?, 1, 'candidate_created', NULL, 'pending', 0, 'system',
 NULL, 'manual_broker_candidate', ?, ?, ?)`).run(
      eventId,
      input.scope.workspaceId,
      input.scope.accountId,
      reconciliationSetId,
      input.evidenceSha256,
      sha256(["reconciliation-candidate-v1", input.overlapKeySha256]),
      input.timestamp,
    );
    const insertMember = this.database.prepare(`INSERT INTO journal_execution_reconciliation_members (
 reconciliation_member_id, workspace_id, account_id, reconciliation_set_id,
 member_role, execution_id, source_row_id, evidence_sha256, created_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    for (const executionId of [...new Set(input.manualExecutionIds)].sort()) {
      insertMember.run(
        createCanonicalUuidV4(), input.scope.workspaceId, input.scope.accountId,
        reconciliationSetId, "manual_execution", executionId, null,
        sha256(["manual-member-v1", executionId]), input.timestamp,
      );
    }
    for (const provisional of input.provisionalExecutions) {
      insertMember.run(
        createCanonicalUuidV4(), input.scope.workspaceId, input.scope.accountId,
        reconciliationSetId, "provisional_imported_execution",
        provisional.executionId, null, provisional.evidenceSha256, input.timestamp,
      );
      insertMember.run(
        createCanonicalUuidV4(), input.scope.workspaceId, input.scope.accountId,
        reconciliationSetId, "broker_source_row", null,
        provisional.sourceRowId, provisional.evidenceSha256, input.timestamp,
      );
    }
    return this.findByOverlapKey(
      input.scope.workspaceId,
      input.scope.accountId,
      input.overlapKeySha256,
    )!;
  }

  listPendingForImport(
    scope: AccountScope,
    importBatchId: string,
  ): readonly JournalExecutionReconciliationSetRecord[] {
    const rows = this.database.prepare<[string, string, string], Parameters<typeof mapSet>[0]>(`${SET_SELECT} reconciliation_set
WHERE reconciliation_set.workspace_id = ? AND reconciliation_set.account_id = ?
  AND reconciliation_set.state = 'pending'
  AND EXISTS (
    SELECT 1 FROM journal_execution_reconciliation_members member
    JOIN journal_execution_provenance provenance
      ON provenance.workspace_id = member.workspace_id
     AND provenance.account_id = member.account_id
     AND provenance.execution_id = member.execution_id
    WHERE member.workspace_id = reconciliation_set.workspace_id
      AND member.account_id = reconciliation_set.account_id
      AND member.reconciliation_set_id = reconciliation_set.reconciliation_set_id
      AND member.member_role = 'provisional_imported_execution'
      AND provenance.import_batch_id = ?
  )
ORDER BY reconciliation_set.created_at_utc, reconciliation_set.reconciliation_set_id`)
      .all(scope.workspaceId, scope.accountId, importBatchId);
    return Object.freeze(rows.map(mapSet));
  }

  linkDecision(
    scope: AccountScope,
    reconciliationSetId: string,
    decisionId: string,
    expectedRevision: number,
    timestamp: string,
  ): void {
    const updated = this.database.prepare(`UPDATE journal_execution_reconciliation_sets
SET decision_id = ?, updated_at_utc = ?
WHERE workspace_id = ? AND account_id = ? AND reconciliation_set_id = ?
  AND state = 'pending' AND revision = ? AND decision_id IS NULL`).run(
      decisionId,
      timestamp,
      scope.workspaceId,
      scope.accountId,
      reconciliationSetId,
      expectedRevision,
    );
    if (updated.changes !== 1) {
      platformFailure("TRADERLINK_DATA_DECISION_CONFLICT", {
        reason: "reconciliation_decision_link",
      });
    }
  }

  resolve(input: Readonly<{
    scope: AccountScope;
    reconciliationSetId: string;
    decisionId: string;
    expectedRevision: number;
    state: Exclude<JournalExecutionReconciliationState, "pending">;
    action: "same_execution" | "separate_executions" | "correct_manual_entry" |
      "grouped_fills_reconciled";
    evidenceSha256: string;
    timestamp: string;
  }>): JournalExecutionReconciliationSetRecord {
    const eventId = createCanonicalUuidV4();
    this.database.prepare(`INSERT INTO journal_execution_reconciliation_events (
 reconciliation_event_id, workspace_id, account_id, reconciliation_set_id,
 event_sequence, action, prior_state, new_state, expected_revision, actor_kind,
 actor_user_id, reason_code, evidence_sha256, idempotency_sha256, occurred_at_utc
) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?, 'user', ?,
 'trader_reconciliation_decision', ?, ?, ?)`).run(
      eventId,
      input.scope.workspaceId,
      input.scope.accountId,
      input.reconciliationSetId,
      input.expectedRevision + 1,
      input.action,
      input.state,
      input.expectedRevision,
      input.scope.userId,
      input.evidenceSha256,
      sha256([
        "reconciliation-resolution-v1",
        input.reconciliationSetId,
        input.decisionId,
        input.action,
        String(input.expectedRevision),
      ]),
      input.timestamp,
    );
    const updated = this.database.prepare(`UPDATE journal_execution_reconciliation_sets
SET state = ?, revision = revision + 1, current_event_id = ?,
 updated_at_utc = ?, resolved_at_utc = ?
WHERE workspace_id = ? AND account_id = ? AND reconciliation_set_id = ?
  AND state = 'pending' AND revision = ? AND decision_id = ?`).run(
      input.state,
      eventId,
      input.timestamp,
      input.timestamp,
      input.scope.workspaceId,
      input.scope.accountId,
      input.reconciliationSetId,
      input.expectedRevision,
      input.decisionId,
    );
    if (updated.changes !== 1) {
      platformFailure("TRADERLINK_DATA_DECISION_CONFLICT", {
        reason: "reconciliation_revision",
      });
    }
    return this.findByOverlapKey(
      input.scope.workspaceId,
      input.scope.accountId,
      this.database.prepare<[string, string, string], { overlap_key_sha256: string }>(`
SELECT overlap_key_sha256 FROM journal_execution_reconciliation_sets
WHERE workspace_id = ? AND account_id = ? AND reconciliation_set_id = ?`)
        .get(
          input.scope.workspaceId,
          input.scope.accountId,
          input.reconciliationSetId,
        )!.overlap_key_sha256,
    )!;
  }

  insertGroupedDecisionExtension(input: Readonly<{
    scope: AccountScope;
    decisionId: string;
    decisionEventId: string;
    reconciliationSetId: string;
    evidenceSha256: string;
    timestamp: string;
  }>): void {
    this.database.prepare(`INSERT INTO journal_data_decision_event_action_extensions (
 decision_event_id, workspace_id, account_id, decision_id, extended_action,
 reconciliation_set_id, evidence_sha256, created_at_utc
) VALUES (?, ?, ?, ?, 'reconcile_grouped_fills', ?, ?, ?)`).run(
      input.decisionEventId,
      input.scope.workspaceId,
      input.scope.accountId,
      input.decisionId,
      input.reconciliationSetId,
      input.evidenceSha256,
      input.timestamp,
    );
  }

  listMembers(
    scope: AccountScope,
    reconciliationSetId: string,
  ): readonly JournalExecutionReconciliationMemberRecord[] {
    return Object.freeze(this.database.prepare<[string, string, string], {
      member_role: JournalExecutionReconciliationMemberRecord["memberRole"];
      execution_id: string;
      current_version_id: string;
      current_state: JournalExecutionReconciliationMemberRecord["currentState"];
      instrument_id: string;
      normalized_symbol: string;
      trade_currency: string;
      source_timestamp_text: string;
      source_timezone: string;
      executed_at_utc: string;
      side: "buy" | "sell";
      quantity_decimal: string;
      price_decimal: string | null;
      fees_decimal: string | null;
      fee_currency: string | null;
    }>(`SELECT member.member_role, execution.execution_id,
 execution.current_version_id, execution.current_state, version.instrument_id,
 instrument.normalized_symbol, version.trade_currency,
 version.source_timestamp_text, version.source_timezone, version.executed_at_utc,
 version.side, version.quantity_decimal, version.price_decimal,
 version.fees_decimal, version.fee_currency
FROM journal_execution_reconciliation_members member
JOIN journal_executions execution
  ON execution.workspace_id = member.workspace_id
 AND execution.account_id = member.account_id
 AND execution.execution_id = member.execution_id
JOIN journal_execution_versions version
  ON version.workspace_id = execution.workspace_id
 AND version.account_id = execution.account_id
 AND version.execution_version_id = execution.current_version_id
JOIN journal_instruments instrument
  ON instrument.workspace_id = version.workspace_id
 AND instrument.instrument_id = version.instrument_id
WHERE member.workspace_id = ? AND member.account_id = ?
  AND member.reconciliation_set_id = ?
  AND member.member_role IN ('manual_execution', 'provisional_imported_execution')
ORDER BY member.member_role, version.executed_at_utc, execution.execution_id`)
      .all(scope.workspaceId, scope.accountId, reconciliationSetId)
      .map((row) => Object.freeze({
        memberRole: row.member_role,
        executionId: row.execution_id,
        currentVersionId: row.current_version_id,
        currentState: row.current_state,
        instrumentId: row.instrument_id,
        symbol: row.normalized_symbol,
        currency: row.trade_currency,
        sourceTimestampText: row.source_timestamp_text,
        sourceTimezone: row.source_timezone,
        executedAtUtc: row.executed_at_utc,
        side: row.side,
        quantityDecimal: row.quantity_decimal,
        priceDecimal: row.price_decimal,
        feesDecimal: row.fees_decimal,
        feeCurrency: row.fee_currency,
      })));
  }
}
