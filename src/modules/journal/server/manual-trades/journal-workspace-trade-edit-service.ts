import type Database from "better-sqlite3";

import type { AccountScope, WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { narrowWorkspaceAccessToAccount } from "@/src/modules/platform/contracts/workspace-access-scope";
import { assertCanonicalUuidV4, platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";

import type {
  JournalWorkspaceTradeEditCommit,
  JournalWorkspaceTradeEditCommitResult,
  JournalWorkspaceTradeEditConsequence,
  JournalWorkspaceTradeEditDraft,
  JournalWorkspaceTradeEditPreview,
} from "../../contracts/journal-workspace-trade-edit-contracts";
import { JournalDataDecisionService } from "../decisions/journal-data-decision-service";
import { JournalImportService } from "../imports/journal-import-service";
import { JournalRoundTripService } from "../round-trips/journal-round-trip-service";
import { JournalTradeStyleService } from "../trade-style/journal-trade-style-service";
import { addDecimal, compareDecimal, negateDecimal } from "../round-trips/journal-decimal-math";
import { normalizeJournalExecutionLocalTime } from "../imports/journal-value-normalization";
import type { JournalManualTradePreviewAuthority } from "./journal-manual-trade-preview-authority";
import {
  JournalManualExecutionEditService,
  type JournalEditableManualExecution,
} from "./journal-manual-execution-edit-service";
import { toManualExecutionInput } from "./journal-manual-trade-input";

export type JournalWorkspaceTradeEditSnapshot = Readonly<{
  executionCount: number;
  executions: readonly JournalWorkspaceTradeEditableExecution[];
  snapshotRef: string;
  tradeCurrency: string;
  tradeStyle: "day_trade" | "swing" | "other" | null;
}>;

export type JournalWorkspaceTradeEditableExecution = Readonly<{
  editRef: string;
  localDate: string;
  localTime: string;
  sourceTimezone: string;
  normalizedSymbol: string;
  tradeCurrency: string;
  side: "buy" | "sell";
  quantityDecimal: string;
  priceDecimal: string | null;
  feesDecimal: string | null;
  manualFeeInputState: "not_entered" | "entered" | null;
}>;

type SnapshotState = Readonly<{
  snapshot: JournalWorkspaceTradeEditSnapshot;
  editable: readonly JournalEditableManualExecution[];
  instrumentId: string;
}>;

const CONSEQUENCE_COPY: Readonly<Record<JournalWorkspaceTradeEditConsequence, string>> = Object.freeze({
  keeps_closed: "This update keeps the trade closed.",
  leaves_open: "This update leaves the trade open.",
  creates_multiple: "This update creates multiple trades because the position reaches zero and then opens again.",
  merges: "This update merges trades.",
  changes_nearby_boundaries: "This update changes nearby trade boundaries.",
});

function canonicalDraftPayload(
  scope: WorkspaceAccessScope,
  roundTripId: string,
  draft: JournalWorkspaceTradeEditDraft,
): string {
  return JSON.stringify([
    "traderlink-workspace-trade-edit-preview-v1",
    scope.userId,
    scope.workspaceId,
    scope.activeAccountId,
    roundTripId,
    draft.snapshotRef,
    draft.tradeStyle,
    [...draft.rows].map((row) => row.kind === "existing"
      ? ["existing", row.executionRef, row.removed, row.entry]
      : ["new", row.entry]),
  ]);
}

type ChainExecution = Readonly<{
  executionId: string;
  executedAtUtc: string;
  orderKey: string;
  quantityDecimal: string;
  side: "buy" | "sell";
}>;

function chainBoundaries(entries: readonly ChainExecution[]): Readonly<{
  closedTradeCount: number;
  finalPosition: string;
  boundaryExecutionIds: readonly string[];
}> {
  let position = "0";
  const boundaryExecutionIds: string[] = [];
  for (const entry of entries) {
    const priorPosition = position;
    position = addDecimal(
      position,
      entry.side === "buy" ? entry.quantityDecimal : negateDecimal(entry.quantityDecimal),
    );
    if (compareDecimal(priorPosition, "0") !== 0 && compareDecimal(position, "0") === 0) {
      boundaryExecutionIds.push(entry.executionId);
    }
  }
  return Object.freeze({
    boundaryExecutionIds: Object.freeze(boundaryExecutionIds),
    closedTradeCount: boundaryExecutionIds.length,
    finalPosition: position,
  });
}

/**
 * The aggregate edit command will consume this snapshot. It deliberately
 * refuses a partly editable trade: a client must never be able to save a
 * subset while silently leaving protected or stale members behind.
 */
export class JournalWorkspaceTradeEditService {
  constructor(
    private readonly database: Database.Database,
    private readonly executionEdits: JournalManualExecutionEditService,
    private readonly decisions: JournalDataDecisionService,
    private readonly imports: JournalImportService,
    private readonly roundTrips: JournalRoundTripService,
    private readonly tradeStyles: JournalTradeStyleService,
    private readonly authority: JournalManualTradePreviewAuthority,
  ) {}

  private assertCompleteDraft(
    snapshot: JournalWorkspaceTradeEditSnapshot,
    draft: JournalWorkspaceTradeEditDraft,
  ): void {
    const expectedRefs = new Set(snapshot.executions.map((execution) => execution.editRef));
    const existing = draft.rows.filter((row) => row.kind === "existing");
    if (
      existing.length !== expectedRefs.size ||
      existing.some((row) => !expectedRefs.delete(row.executionRef)) ||
      expectedRefs.size !== 0
    ) {
      platformFailure("TRADERLINK_MANUAL_EXECUTION_EDIT_REQUIRES_DECISION");
    }
  }

  /**
   * Preview the exact current instrument/currency chain, substituting the full
   * saved-trade draft. This is read-only: commit still rebuilds the canonical
   * chain inside its immediate transaction and repeats the signed-draft check.
   */
  private consequence(
    scope: AccountScope,
    state: SnapshotState,
    draft: JournalWorkspaceTradeEditDraft,
  ): JournalWorkspaceTradeEditConsequence {
    const baseSymbol = state.snapshot.executions[0]?.normalizedSymbol;
    if (!baseSymbol || draft.rows.some((row) =>
      row.entry !== null && (
        row.entry.normalizedSymbol !== baseSymbol ||
        row.entry.tradeCurrency !== state.snapshot.tradeCurrency
      ))) {
      return "changes_nearby_boundaries";
    }
    const current = this.database.prepare<[string, string, string, string], {
      execution_id: string;
      executed_at_utc: string;
      source_order_key: string;
      quantity_decimal: string;
      side: "buy" | "sell";
    }>(`SELECT execution.execution_id, version.executed_at_utc, version.source_order_key,
       version.quantity_decimal, version.side
FROM journal_executions execution
JOIN journal_execution_versions version
  ON version.workspace_id = execution.workspace_id
 AND version.account_id = execution.account_id
 AND version.execution_version_id = execution.current_version_id
WHERE execution.workspace_id = ? AND execution.account_id = ?
  AND execution.current_state = 'accepted'
  AND version.instrument_id = ? AND version.trade_currency = ?
ORDER BY version.executed_at_utc, version.source_order_key, execution.execution_id`).all(
      scope.workspaceId,
      scope.accountId,
      state.instrumentId,
      state.snapshot.tradeCurrency,
    ).map((row) => Object.freeze({
      executedAtUtc: row.executed_at_utc,
      executionId: row.execution_id,
      orderKey: row.source_order_key,
      quantityDecimal: row.quantity_decimal,
      side: row.side,
    }));
    const draftByExecutionId = new Map(
      draft.rows
        .filter((row) => row.kind === "existing")
        .map((row) => [state.editable.find((item) => item.editRef === row.executionRef)?.executionId, row] as const),
    );
    if (draftByExecutionId.has(undefined)) {
      platformFailure("TRADERLINK_MANUAL_EXECUTION_EDIT_CONFLICT");
    }
    const after: ChainExecution[] = [];
    for (const entry of current) {
      const replacement = draftByExecutionId.get(entry.executionId);
      if (!replacement) {
        after.push(entry);
        continue;
      }
      if (replacement.removed) continue;
      const draftEntry = replacement.entry!;
      const original = state.editable.find((item) => item.executionId === entry.executionId);
      after.push(Object.freeze({
        executedAtUtc: normalizeJournalExecutionLocalTime(
          `${draftEntry.localDate}, ${draftEntry.localTime}`,
          draftEntry.sourceTimezone,
        ),
        executionId: entry.executionId,
        orderKey: original &&
          original.localDate === draftEntry.localDate &&
          original.localTime === draftEntry.localTime &&
          original.sourceTimezone === draftEntry.sourceTimezone
          ? entry.orderKey
          : `workspace-preview:${draftEntry.clientRowRef}`,
        quantityDecimal: draftEntry.quantityDecimal,
        side: draftEntry.side,
      }));
    }
    for (const row of draft.rows) {
      if (row.kind !== "new") continue;
      after.push(Object.freeze({
        executedAtUtc: normalizeJournalExecutionLocalTime(
          `${row.entry.localDate}, ${row.entry.localTime}`,
          row.entry.sourceTimezone,
        ),
        executionId: `new:${row.entry.clientRowRef}`,
        orderKey: `workspace-preview:${row.entry.clientRowRef}`,
        quantityDecimal: row.entry.quantityDecimal,
        side: row.entry.side,
      }));
    }
    after.sort((left, right) =>
      left.executedAtUtc.localeCompare(right.executedAtUtc) ||
      left.orderKey.localeCompare(right.orderKey) ||
      left.executionId.localeCompare(right.executionId));
    const beforeBoundaries = chainBoundaries(current);
    const afterBoundaries = chainBoundaries(after);
    if (afterBoundaries.closedTradeCount > beforeBoundaries.closedTradeCount) {
      return "creates_multiple";
    }
    if (afterBoundaries.closedTradeCount < beforeBoundaries.closedTradeCount) {
      return "merges";
    }
    if (beforeBoundaries.boundaryExecutionIds.join("\u001f") !==
      afterBoundaries.boundaryExecutionIds.join("\u001f")) {
      return "changes_nearby_boundaries";
    }
    const draftedPosition = chainBoundaries(after.filter((entry) =>
      state.editable.some((editable) => editable.executionId === entry.executionId) ||
      entry.executionId.startsWith("new:"),
    )).finalPosition;
    return compareDecimal(draftedPosition, "0") === 0
      ? "keeps_closed"
      : "leaves_open";
  }

  private snapshotState(
    scope: AccountScope,
    roundTripId: string,
  ): SnapshotState {
    assertCanonicalUuidV4(roundTripId, "roundTripId");
    const trade = this.database.prepare<[string, string, string], {
      current_version_id: string;
      instrument_id: string;
      trade_currency: string;
      trade_style: "day_trade" | "swing" | "other" | null;
    }>(`SELECT round_trip.current_version_id, version.instrument_id, version.trade_currency,
       COALESCE(CASE logical_version.trade_style WHEN 'day' THEN 'day_trade' ELSE logical_version.trade_style END,
         style.trade_style) AS trade_style
FROM journal_round_trips round_trip
JOIN journal_round_trip_versions version
  ON version.workspace_id = round_trip.workspace_id
 AND version.account_id = round_trip.account_id
 AND version.round_trip_version_id = round_trip.current_version_id
LEFT JOIN journal_trade_style_plans style
  ON style.workspace_id = round_trip.workspace_id
 AND style.account_id = round_trip.account_id
 AND style.round_trip_id = round_trip.round_trip_id
LEFT JOIN journal_active_logical_trade_memberships membership
  ON membership.workspace_id = round_trip.workspace_id
 AND membership.account_id = round_trip.account_id
 AND membership.round_trip_id = round_trip.round_trip_id
LEFT JOIN journal_logical_trade_versions logical_version
  ON logical_version.workspace_id = membership.workspace_id
 AND logical_version.account_id = membership.account_id
 AND logical_version.logical_trade_version_id = membership.logical_trade_version_id
WHERE round_trip.workspace_id = ? AND round_trip.account_id = ?
  AND round_trip.round_trip_id = ? AND round_trip.lifecycle_state = 'active'
LIMIT 1`).get(scope.workspaceId, scope.accountId, roundTripId);
    if (!trade) platformFailure("TRADERLINK_MANUAL_EXECUTION_EDIT_REQUIRES_DECISION");

    const members = this.database.prepare<[string, string, string, string, string, string, string, string], {
      execution_id: string;
      execution_version_id: string;
    }>(`SELECT execution.execution_id, allocation.execution_version_id
FROM journal_round_trip_execution_allocations allocation
JOIN journal_execution_versions allocation_version
  ON allocation_version.workspace_id = allocation.workspace_id
 AND allocation_version.account_id = allocation.account_id
 AND allocation_version.execution_version_id = allocation.execution_version_id
JOIN journal_executions execution
  ON execution.workspace_id = allocation.workspace_id
 AND execution.account_id = allocation.account_id
 AND execution.execution_id = allocation_version.execution_id
WHERE allocation.workspace_id = ? AND allocation.account_id = ?
  AND allocation.round_trip_version_id IN (
    SELECT member_round_trip.current_version_id
    FROM journal_round_trips member_round_trip
    WHERE member_round_trip.workspace_id = ? AND member_round_trip.account_id = ?
      AND member_round_trip.lifecycle_state = 'active'
      AND (member_round_trip.round_trip_id = ? OR member_round_trip.round_trip_id IN (
        SELECT grouped.round_trip_id
        FROM journal_active_logical_trade_memberships selected
        JOIN journal_active_logical_trade_memberships grouped
          ON grouped.workspace_id = selected.workspace_id
         AND grouped.account_id = selected.account_id
         AND grouped.logical_trade_id = selected.logical_trade_id
        WHERE selected.workspace_id = ? AND selected.account_id = ?
          AND selected.round_trip_id = ?
      ))
  )
  AND execution.current_version_id = allocation.execution_version_id
  AND execution.current_state = 'accepted'
ORDER BY allocation.allocation_sequence, execution.execution_id`).all(
      scope.workspaceId, scope.accountId, scope.workspaceId, scope.accountId,
      roundTripId, scope.workspaceId, scope.accountId, roundTripId,
    ).map((row) => Object.freeze({
      executionId: row.execution_id,
      executionVersionId: row.execution_version_id,
    }));
    if (members.length === 0) {
      platformFailure("TRADERLINK_MANUAL_EXECUTION_EDIT_REQUIRES_DECISION");
    }

    const editable = this.executionEdits.listEditable(
      scope,
      members.map((member) => member.executionId),
    );
    const editableById = new Map(editable.map((item) => [item.executionId, item]));
    if (
      editableById.size !== members.length ||
      members.some((member) =>
        editableById.get(member.executionId)?.currentVersionId !== member.executionVersionId)
    ) {
      platformFailure("TRADERLINK_MANUAL_EXECUTION_EDIT_REQUIRES_DECISION");
    }

    const material = JSON.stringify([
      scope.workspaceId,
      scope.accountId,
      roundTripId,
      trade.current_version_id,
      members.map((member) => [member.executionId, member.executionVersionId]),
    ]);
    const snapshot = Object.freeze({
      executionCount: members.length,
      executions: Object.freeze(members.map((member) => {
        const editable = editableById.get(member.executionId)!;
        return Object.freeze({
          editRef: editable.editRef,
          localDate: editable.localDate,
          localTime: editable.localTime,
          sourceTimezone: editable.sourceTimezone,
          normalizedSymbol: editable.normalizedSymbol,
          tradeCurrency: editable.tradeCurrency,
          side: editable.side,
          quantityDecimal: editable.quantityDecimal,
          priceDecimal: editable.priceDecimal,
          feesDecimal: editable.feesDecimal,
          manualFeeInputState: editable.manualFeeInputState,
        });
      })),
      snapshotRef: this.authority.opaqueRef("workspace_trade_edit_snapshot", material),
      tradeCurrency: trade.trade_currency,
      tradeStyle: trade.trade_style,
    });
    return Object.freeze({
      editable: Object.freeze(members.map((member) => editableById.get(member.executionId)!)),
      instrumentId: trade.instrument_id,
      snapshot,
    });
  }

  snapshot(scope: AccountScope, roundTripId: string): JournalWorkspaceTradeEditSnapshot {
    return this.snapshotState(scope, roundTripId).snapshot;
  }

  requireCurrentSnapshot(
    scope: AccountScope,
    roundTripId: string,
    snapshotRef: string,
  ): JournalWorkspaceTradeEditSnapshot {
    if (!/^[0-9a-f]{64}$/u.test(snapshotRef)) {
      platformFailure("TRADERLINK_MANUAL_EXECUTION_EDIT_INVALID");
    }
    const snapshot = this.snapshot(scope, roundTripId);
    if (snapshot.snapshotRef !== snapshotRef) {
      platformFailure("TRADERLINK_MANUAL_EXECUTION_EDIT_CONFLICT");
    }
    return snapshot;
  }

  preview(
    scope: WorkspaceAccessScope,
    roundTripId: string,
    draft: JournalWorkspaceTradeEditDraft,
  ): JournalWorkspaceTradeEditPreview {
    if (!scope.activeAccountId) platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
    const accountScope = narrowWorkspaceAccessToAccount(scope, scope.activeAccountId);
    const current = this.snapshotState(accountScope, roundTripId);
    if (current.snapshot.snapshotRef !== draft.snapshotRef) {
      platformFailure("TRADERLINK_MANUAL_EXECUTION_EDIT_CONFLICT");
    }
    this.assertCompleteDraft(current.snapshot, draft);
    const result = this.consequence(accountScope, current, draft);
    const issued = this.authority.issue(canonicalDraftPayload(scope, roundTripId, draft));
    return Object.freeze({
      previewRef: issued.previewRef,
      expiresAtUtc: issued.expiresAtUtc,
      consequence: result,
      consequenceCopy: CONSEQUENCE_COPY[result],
    });
  }

  verifyPreview(
    scope: WorkspaceAccessScope,
    roundTripId: string,
    draft: JournalWorkspaceTradeEditDraft,
    previewRef: string,
  ): boolean {
    return this.authority.verify(previewRef, canonicalDraftPayload(scope, roundTripId, draft));
  }

  commit(
    scope: WorkspaceAccessScope,
    roundTripId: string,
    draft: JournalWorkspaceTradeEditDraft,
    request: JournalWorkspaceTradeEditCommit,
    now = new Date(),
  ): JournalWorkspaceTradeEditCommitResult {
    if (!scope.activeAccountId) platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
    if (!this.verifyPreview(scope, roundTripId, draft, request.previewRef)) {
      platformFailure("TRADERLINK_MANUAL_EXECUTION_EDIT_INVALID");
    }
    const accountScope = narrowWorkspaceAccessToAccount(scope, scope.activeAccountId);
    return this.database.transaction(() => {
      const current = this.snapshotState(accountScope, roundTripId);
      if (current.snapshot.snapshotRef !== draft.snapshotRef) {
        platformFailure("TRADERLINK_MANUAL_EXECUTION_EDIT_CONFLICT");
      }
      this.assertCompleteDraft(current.snapshot, draft);
      const originalOpeningExecutionId = current.editable[0]?.executionId;
      if (!originalOpeningExecutionId) platformFailure("TRADERLINK_MANUAL_EXECUTION_EDIT_CONFLICT");
      if (!this.verifyPreview(scope, roundTripId, draft, request.previewRef)) {
        platformFailure("TRADERLINK_MANUAL_EXECUTION_EDIT_INVALID");
      }
      const editableByRef = new Map(current.editable.map((execution) => [execution.editRef, execution]));
      let correctedExecutionCount = 0;
      let removedExecutionCount = 0;
      for (const row of draft.rows) {
        if (row.kind !== "existing") continue;
        const existing = editableByRef.get(row.executionRef);
        if (!existing) platformFailure("TRADERLINK_MANUAL_EXECUTION_EDIT_CONFLICT");
        if (row.removed) {
          this.decisions.excludeManualExecution(accountScope, {
            executionId: existing.executionId,
            expectedCurrentVersionId: existing.currentVersionId,
            idempotencyKey: `${request.idempotencyKey}:remove:${removedExecutionCount + 1}`,
            now,
          });
          removedExecutionCount += 1;
          continue;
        }
        const entry = row.entry!;
        if (
          existing.localDate === entry.localDate &&
          existing.localTime === entry.localTime &&
          existing.sourceTimezone === entry.sourceTimezone &&
          existing.normalizedSymbol === entry.normalizedSymbol &&
          existing.tradeCurrency === entry.tradeCurrency &&
          existing.side === entry.side &&
          existing.quantityDecimal === entry.quantityDecimal &&
          existing.priceDecimal === entry.priceDecimal &&
          existing.feesDecimal === entry.feesDecimal &&
          existing.manualFeeInputState === (entry.manualFeeInputState ?? null)
        ) continue;
        this.executionEdits.correct(accountScope, existing.editRef, {
          idempotencyKey: `${request.idempotencyKey}:edit:${correctedExecutionCount + 1}`,
          localDate: entry.localDate,
          localTime: entry.localTime,
          sourceTimezone: entry.sourceTimezone,
          normalizedSymbol: entry.normalizedSymbol,
          tradeCurrency: entry.tradeCurrency,
          side: entry.side,
          quantityDecimal: entry.quantityDecimal,
          priceDecimal: entry.priceDecimal,
          feesDecimal: entry.feesDecimal,
          refreshAnalyzer: false,
          now,
        });
        correctedExecutionCount += 1;
      }
      const additions = draft.rows.flatMap((row) => row.kind === "new" ? [row.entry] : []);
      if (additions.length > 0) {
        this.imports.commitManualExecutions(scope, {
          accountId: accountScope.accountId,
          idempotencyKey: `${request.idempotencyKey}:add`,
          sourceDisplayLabel: "Workspace trade edit manual executions",
          entries: additions.map(toManualExecutionInput),
          confirmedTraderBoundaries: true,
          now,
        });
      }
      const rebuilds = this.roundTrips.rebuildAccount(accountScope, {
        kind: "maintenance",
        maintenanceReasonCode: "workspace_atomic_trade_edit",
        now,
      });
      const affectedRoundTripIds = Object.freeze([...new Set(rebuilds
        .filter((rebuild) => rebuild.status === "rebuilt")
        .flatMap((rebuild) => rebuild.roundTripIds))]);
      this.executionEdits.refreshLogicalTradesAfterRebuild(accountScope, affectedRoundTripIds, now);
      if (draft.tradeStyle !== current.snapshot.tradeStyle) {
        const targetRows = this.database.prepare<[string, string, string], {
          round_trip_id: string;
        }>(`SELECT DISTINCT round_trip.round_trip_id
FROM journal_executions execution
JOIN journal_round_trip_execution_allocations allocation
  ON allocation.workspace_id = execution.workspace_id
 AND allocation.account_id = execution.account_id
 AND allocation.execution_version_id = execution.current_version_id
JOIN journal_round_trips round_trip
  ON round_trip.workspace_id = allocation.workspace_id
 AND round_trip.account_id = allocation.account_id
 AND round_trip.current_version_id = allocation.round_trip_version_id
WHERE execution.workspace_id = ? AND execution.account_id = ?
  AND execution.execution_id = ? AND execution.current_state = 'accepted'`).all(
          accountScope.workspaceId,
          accountScope.accountId,
          originalOpeningExecutionId,
        );
        if (targetRows.length !== 1 || !draft.tradeStyle) {
          platformFailure("TRADERLINK_MANUAL_EXECUTION_EDIT_REQUIRES_DECISION");
        }
        const roundTripId = targetRows[0]!.round_trip_id;
        const positionRef = this.tradeStyles.positionRef(accountScope, roundTripId);
        const priorStyle = this.tradeStyles.read(accountScope, positionRef);
        this.tradeStyles.change(accountScope, {
          positionRef,
          expectedRevision: priorStyle?.revision ?? null,
          tradeStyle: draft.tradeStyle,
          openStatus: draft.tradeStyle === "swing"
            ? "swing"
            : draft.tradeStyle === "day_trade"
              ? "day_trade_still_open"
              : "other",
          plannedFromEntry: priorStyle?.plannedFromEntry ?? false,
          claimedEffectiveAtUtc: this.tradeStyles.resolveRoundTripPosition(
            accountScope,
            roundTripId,
          ).openedAtUtc,
          reason: "reclassified",
          sourceUi: "workspace",
          idempotencyKey: `${request.idempotencyKey}:style`,
        }, now);
      }
      return Object.freeze({
        consequence: this.consequence(accountScope, current, draft),
        acceptedNewExecutionCount: additions.length,
        correctedExecutionCount,
        removedExecutionCount,
        rebuildCount: rebuilds.length,
      });
    }).immediate();
  }
}
