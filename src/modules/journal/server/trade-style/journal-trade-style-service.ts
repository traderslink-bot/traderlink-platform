import type {
  JournalOpenPositionStatus,
  JournalTradeStyle,
  JournalTradeStyleChange,
  JournalTradeStyleRecord,
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

  read(scope: AccountScope, positionRef: string): JournalTradeStyleRecord | null {
    const position = this.resolvePosition(scope, positionRef);
    const plan = this.repository.findPlan(scope, position.roundTripId);
    return plan ? record(this.authority, scope, plan) : null;
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
}
