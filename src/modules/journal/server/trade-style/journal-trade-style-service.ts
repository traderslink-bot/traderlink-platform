import type {
  JournalOpenPositionStatus,
  JournalTradeStyle,
  JournalTradeStyleChange,
  JournalTradeStyleRecord,
  JournalSwingPositionPlanChange,
} from "@/src/modules/journal/contracts/journal-trade-style-contracts";
import {
  narrowWorkspaceAccessToAccount,
  type AccountScope,
  type WorkspaceAccessScope,
} from "@/src/modules/platform/contracts/workspace-access-scope";
import {
  createCanonicalUtcTimestamp,
  platformFailure,
} from "@/src/modules/platform/server/database/platform-migration-contract";
import type { JournalManualTradePreviewAuthority } from "../manual-trades/journal-manual-trade-preview-authority";
import {
  JournalTradeStyleRepository,
  type JournalTrackedPositionRow,
  type JournalTradeStylePlanRow,
} from "./journal-trade-style-repository";

const IDEMPOTENCY_PATTERN = /^[A-Za-z0-9._:-]{8,200}$/u;

function positionMaterial(scope: AccountScope, roundTripId: string): string {
  return [scope.workspaceId, scope.accountId, roundTripId].join("\u001f");
}

function record(
  authority: JournalManualTradePreviewAuthority,
  scope: AccountScope,
  row: JournalTradeStylePlanRow,
): JournalTradeStyleRecord {
  return Object.freeze({
    positionRef: authority.opaqueRef(
      "position",
      positionMaterial(scope, row.roundTripId),
    ),
    revision: row.revision,
    tradeStyle: row.tradeStyle,
    openStatus: row.openStatus,
    plannedFromEntry: row.plannedFromEntry,
    claimedEffectiveAtUtc: row.claimedEffectiveAtUtc,
    declaredAtUtc: row.declaredAtUtc,
    lifecycleState: row.lifecycleState,
    updatedAtUtc: row.updatedAtUtc,
    swingPlan: row.swingPlan,
  });
}

function recordFromPosition(
  authority: JournalManualTradePreviewAuthority,
  scope: AccountScope,
  row: JournalTrackedPositionRow,
): JournalTradeStyleRecord | null {
  if (
    row.styleRevision === null || row.tradeStyle === null || row.openStatus === null ||
    row.plannedFromEntry === null || row.claimedEffectiveAtUtc === null ||
    row.declaredAtUtc === null || row.styleLifecycleState === null ||
    row.styleUpdatedAtUtc === null
  ) return null;
  return Object.freeze({
    positionRef: authority.opaqueRef(
      "position",
      positionMaterial(scope, row.roundTripId),
    ),
    revision: row.styleRevision,
    tradeStyle: row.tradeStyle,
    openStatus: row.openStatus,
    plannedFromEntry: row.plannedFromEntry,
    claimedEffectiveAtUtc: row.claimedEffectiveAtUtc,
    declaredAtUtc: row.declaredAtUtc,
    lifecycleState: row.styleLifecycleState,
    updatedAtUtc: row.styleUpdatedAtUtc,
    swingPlan: row.swingPlan,
  });
}

function validCombination(
  style: JournalTradeStyle,
  status: Exclude<JournalOpenPositionStatus, "closed">,
): boolean {
  if (status === "swing") return style === "swing";
  if (status === "day_trade_still_open") return style === "day_trade";
  return style === "other";
}

export class JournalTradeStyleService {
  constructor(
    private readonly repository: JournalTradeStyleRepository,
    private readonly authority: JournalManualTradePreviewAuthority,
  ) {}

  accountScope(scope: WorkspaceAccessScope): AccountScope {
    if (!scope.activeAccountId) platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
    return narrowWorkspaceAccessToAccount(scope, scope.activeAccountId);
  }

  positionRef(scope: AccountScope, roundTripId: string): string {
    return this.authority.opaqueRef(
      "position",
      positionMaterial(scope, roundTripId),
    );
  }

  listPositionRows(scope: AccountScope): readonly JournalTrackedPositionRow[] {
    return this.repository.listCurrentPositions(scope);
  }

  listPositionRecords(scope: AccountScope): readonly Readonly<{
    positionRef: string;
    row: JournalTrackedPositionRow;
    style: JournalTradeStyleRecord | null;
  }>[] {
    return Object.freeze(this.repository.listCurrentPositions(scope).map((row) => Object.freeze({
      positionRef: this.positionRef(scope, row.roundTripId),
      row,
      style: recordFromPosition(this.authority, scope, row),
    })));
  }

  listSwingPositionRows(scope: AccountScope): readonly JournalTrackedPositionRow[] {
    return this.repository.listCurrentSwingPositions(scope);
  }

  listOpenPositionRows(scope: AccountScope): readonly JournalTrackedPositionRow[] {
    return this.repository.listCurrentOpenPositionRows(scope);
  }

  resolvePosition(scope: AccountScope, positionRef: string): JournalTrackedPositionRow {
    if (!/^[0-9a-f]{64}$/u.test(positionRef)) {
      platformFailure("TRADERLINK_TRADE_STYLE_CONFLICT");
    }
    const matches = this.repository.listCurrentPositions(scope).filter((position) =>
      this.positionRef(scope, position.roundTripId) === positionRef);
    if (matches.length !== 1) platformFailure("TRADERLINK_TRADE_STYLE_CONFLICT");
    return matches[0]!;
  }

  resolveRoundTripPosition(
    scope: AccountScope,
    roundTripId: string,
  ): JournalTrackedPositionRow {
    const position = this.repository.findCurrentPosition(scope, roundTripId);
    if (!position) platformFailure("TRADERLINK_TRADE_STYLE_CONFLICT");
    return position;
  }

  read(scope: AccountScope, positionRef: string): JournalTradeStyleRecord | null {
    const position = this.resolvePosition(scope, positionRef);
    return recordFromPosition(this.authority, scope, position);
  }

  change(
    scope: AccountScope,
    input: JournalTradeStyleChange,
    now = new Date(),
  ): JournalTradeStyleRecord {
    if (
      !Number.isFinite(Date.parse(input.claimedEffectiveAtUtc)) ||
      Date.parse(input.claimedEffectiveAtUtc) > now.getTime() ||
      !IDEMPOTENCY_PATTERN.test(input.idempotencyKey) ||
      !validCombination(input.tradeStyle, input.openStatus)
    ) {
      platformFailure("TRADERLINK_TRADE_STYLE_INVALID");
    }
    const position = this.resolvePosition(scope, input.positionRef);
    if (position.projectionState === "needs_decision") {
      platformFailure("TRADERLINK_TRADE_STYLE_CONFLICT");
    }
    const timestamp = createCanonicalUtcTimestamp(now);
    const saved = this.repository.immediate(() => this.repository.savePlan({
      scope,
      position,
      expectedRevision: input.expectedRevision,
      tradeStyle: input.tradeStyle,
      openStatus: position.projectionState === "ready_closed"
        ? "closed"
        : input.openStatus,
      plannedFromEntry: input.plannedFromEntry,
      claimedEffectiveAtUtc: input.claimedEffectiveAtUtc,
      reasonCode: input.reason,
      sourceUi: input.sourceUi,
      idempotencyKey: input.idempotencyKey,
      timestamp,
    }));
    return record(this.authority, scope, saved);
  }

  saveSwingPlan(
    scope: AccountScope,
    input: JournalSwingPositionPlanChange,
    now = new Date(),
  ): JournalTradeStyleRecord {
    if (
      !IDEMPOTENCY_PATTERN.test(input.idempotencyKey) ||
      input.entryReason.trim().length === 0 || input.entryReason.length > 12_000 ||
      input.plannedHoldTradingDays < 1 || input.plannedHoldTradingDays > 252 ||
      !Number.isSafeInteger(input.plannedHoldTradingDays) ||
      (input.hasUpcomingCatalyst && (!input.catalystDetails || input.catalystDetails.trim().length === 0)) ||
      (input.catalystDetails !== null && input.catalystDetails.length > 12_000)
    ) platformFailure("TRADERLINK_TRADE_STYLE_INVALID");
    const position = this.resolvePosition(scope, input.positionRef);
    if (position.projectionState === "needs_decision" || position.tradeStyle !== "swing") {
      platformFailure("TRADERLINK_TRADE_STYLE_CONFLICT");
    }
    const saved = this.repository.immediate(() => this.repository.saveSwingPlan({
      scope,
      position,
      expectedRevision: input.expectedRevision,
      entryReason: input.entryReason.trim(),
      hasUpcomingCatalyst: input.hasUpcomingCatalyst,
      catalystDetails: input.hasUpcomingCatalyst ? input.catalystDetails?.trim() ?? null : null,
      plannedHoldTradingDays: input.plannedHoldTradingDays,
      sourceUi: input.sourceUi,
      idempotencyKey: input.idempotencyKey,
      timestamp: createCanonicalUtcTimestamp(now),
    }));
    return record(this.authority, scope, saved);
  }
}
