import type {
  JournalManualExistingPositionOption,
  JournalManualTrackerKind,
  JournalManualTradeEntry,
  JournalManualTradePreview,
  JournalManualTradePreviewAllocation,
  JournalManualTradePreviewGroup,
  JournalManualTradeRelationship,
  JournalManualWorkspaceStyle,
  JournalTradeStyle,
} from "../../contracts/journal-manual-trade-capture-contracts";
import { JOURNAL_MANUAL_ENTRY_RECENT_CALENDAR_DAYS } from "../../contracts/journal-manual-trade-capture-contracts";
import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { narrowWorkspaceAccessToAccount } from "@/src/modules/platform/contracts/workspace-access-scope";
import { platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";
import type { JournalAccountService } from "../accounts/journal-account-service";
import { normalizeJournalExecutionLocalTime } from "../imports/journal-value-normalization";
import {
  absoluteDecimal,
  addDecimal,
  compareDecimal,
  negateDecimal,
  subtractDecimal,
} from "../round-trips/journal-decimal-math";
import {
  canonicalJournalManualTradePreviewPayload,
  digestJournalManualTradePreviewPayload,
  type JournalManualTradePreviewAuthority,
} from "./journal-manual-trade-preview-authority";
import {
  type JournalManualLedgerPosition,
  JournalManualTradePreviewRepository,
} from "./journal-manual-trade-preview-repository";

type PreparedEntry = Readonly<{
  entry: JournalManualTradeEntry;
  executedAtUtc: string;
  signedQuantityDecimal: string;
}>;

type BuildingGroup = {
  existingPosition: JournalManualLedgerPosition | null;
  direction: "long" | "short";
  openedAtUtc: string;
  lastExecutionAtUtc: string;
  finalPositionDecimal: string;
  allocations: JournalManualTradePreviewAllocation[];
};

function localDateAt(instant: Date, timezone: string): string {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(instant)
    .filter((part) => part.type !== "literal")
    .map((part) => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function subtractCalendarDays(value: string, days: number): string {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year!, month! - 1, day! - days))
    .toISOString()
    .slice(0, 10);
}

function signedQuantity(entry: JournalManualTradeEntry): string {
  return entry.side === "buy" ? entry.quantityDecimal : negateDecimal(entry.quantityDecimal);
}

function sameDirection(left: string, right: string): boolean {
  return compareDecimal(left, "0") === compareDecimal(right, "0");
}

function chainKey(symbol: string, currency: string): string {
  return `${symbol}\u001f${currency}`;
}

function allocation(
  entry: PreparedEntry,
  role: JournalManualTradePreviewAllocation["role"],
  quantityDecimal = entry.entry.quantityDecimal,
): JournalManualTradePreviewAllocation {
  return Object.freeze({
    clientRowRef: entry.entry.clientRowRef,
    role,
    quantityDecimal,
  });
}

function existingPositionOption(
  authority: JournalManualTradePreviewAuthority,
  scope: WorkspaceAccessScope,
  position: JournalManualLedgerPosition,
): JournalManualExistingPositionOption {
  return Object.freeze({
    positionRef: authority.opaqueRef(
      "position",
      [scope.workspaceId, scope.activeAccountId, position.roundTripId,
        position.currentVersionId].join("\u001f"),
    ),
    version: position.version,
    direction: position.direction,
    openedAtUtc: position.openedAtUtc,
    remainingQuantityDecimal: absoluteDecimal(position.finalPositionDecimal),
  });
}

function startGroup(
  entry: PreparedEntry,
  quantityDecimal: string,
  role: "opening" | "flip_opening",
): BuildingGroup {
  const finalPositionDecimal = entry.entry.side === "buy"
    ? quantityDecimal
    : negateDecimal(quantityDecimal);
  return {
    existingPosition: null,
    direction: compareDecimal(finalPositionDecimal, "0") > 0 ? "long" : "short",
    openedAtUtc: entry.executedAtUtc,
    lastExecutionAtUtc: entry.executedAtUtc,
    finalPositionDecimal,
    allocations: [allocation(entry, role, quantityDecimal)],
  };
}

function applyEntry(
  completed: BuildingGroup[],
  current: BuildingGroup | null,
  entry: PreparedEntry,
): BuildingGroup | null {
  if (!current || compareDecimal(current.finalPositionDecimal, "0") === 0) {
    return startGroup(entry, entry.entry.quantityDecimal, "opening");
  }
  const incoming = entry.signedQuantityDecimal;
  current.lastExecutionAtUtc = entry.executedAtUtc;
  if (sameDirection(current.finalPositionDecimal, incoming)) {
    current.finalPositionDecimal = addDecimal(current.finalPositionDecimal, incoming);
    current.allocations.push(allocation(entry, "adding"));
    return current;
  }

  const positionMagnitude = absoluteDecimal(current.finalPositionDecimal);
  const quantityComparison = compareDecimal(entry.entry.quantityDecimal, positionMagnitude);
  if (quantityComparison < 0) {
    current.finalPositionDecimal = addDecimal(current.finalPositionDecimal, incoming);
    current.allocations.push(allocation(entry, "reducing"));
    return current;
  }
  if (quantityComparison === 0) {
    current.finalPositionDecimal = "0";
    current.allocations.push(allocation(entry, "closing"));
    completed.push(current);
    return null;
  }

  current.finalPositionDecimal = "0";
  current.allocations.push(allocation(entry, "flip_closing", positionMagnitude));
  completed.push(current);
  return startGroup(
    entry,
    subtractDecimal(entry.entry.quantityDecimal, positionMagnitude),
    "flip_opening",
  );
}

function relationships(group: BuildingGroup): readonly JournalManualTradeRelationship[] {
  if (!group.existingPosition) {
    return Object.freeze(["start_new_trade", "not_finished"]);
  }
  return compareDecimal(group.finalPositionDecimal, "0") === 0
    ? Object.freeze(["close_tracked_position", "not_finished"])
    : Object.freeze(["continue_tracked_position", "not_finished"]);
}

function toPreviewGroup(input: Readonly<{
  authority: JournalManualTradePreviewAuthority;
  scope: WorkspaceAccessScope;
  payloadDigest: string;
  index: number;
  symbol: string;
  currency: string;
  tracker: JournalManualTrackerKind;
  workspaceStyle: JournalManualWorkspaceStyle | null;
  group: BuildingGroup;
}>): JournalManualTradePreviewGroup {
  const isOpen = compareDecimal(input.group.finalPositionDecimal, "0") !== 0;
  const state = input.group.existingPosition
    ? isOpen ? "existing_position_changed" as const : "existing_position_closed" as const
    : isOpen ? "open_trade" as const : "complete_trade" as const;
  return Object.freeze({
    groupRef: input.authority.opaqueRef(
      "group",
      [input.scope.workspaceId, input.scope.activeAccountId, input.payloadDigest,
        input.symbol, input.currency, String(input.index)].join("\u001f"),
    ),
    symbol: input.symbol,
    currency: input.currency,
    direction: input.group.direction,
    openedAtUtc: input.group.openedAtUtc,
    lastExecutionAtUtc: input.group.lastExecutionAtUtc,
    state,
    remainingQuantityDecimal: absoluteDecimal(input.group.finalPositionDecimal),
    allocations: Object.freeze([...input.group.allocations]),
    existingPosition: input.group.existingPosition
      ? existingPositionOption(input.authority, input.scope, input.group.existingPosition)
      : null,
    allowedRelationships: relationships(input.group),
    allowedStyles: Object.freeze<JournalTradeStyle[]>(["day_trade", "swing", "other"]),
    suggestedStyle: input.tracker === "workspace"
      ? input.workspaceStyle!
      : input.tracker === "swing"
      ? "swing"
      : input.tracker === "quick"
        ? "other"
        : "day_trade",
  });
}

export class JournalManualTradePreviewService {
  constructor(
    private readonly repository: JournalManualTradePreviewRepository,
    private readonly accounts: JournalAccountService,
    private readonly authority: JournalManualTradePreviewAuthority,
    private readonly now: () => Date = () => new Date(),
  ) {}

  preview(scope: WorkspaceAccessScope, input: Readonly<{
    accountSelectionRef: string;
    tracker: JournalManualTrackerKind;
    workspaceStyle?: JournalManualWorkspaceStyle;
    entries: readonly JournalManualTradeEntry[];
  }>): JournalManualTradePreview {
    const accountId = scope.activeAccountId;
    if (!accountId) platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
    const accountScope = narrowWorkspaceAccessToAccount(scope, accountId);
    const account = this.accounts.requireAccountRecord(scope, accountId);
    const today = localDateAt(this.now(), account.tradingTimezone);
    const earliestRecentDate = subtractCalendarDays(
      today,
      JOURNAL_MANUAL_ENTRY_RECENT_CALENDAR_DAYS - 1,
    );
    const affectedDates = [...new Set(input.entries.map((entry) => entry.localDate))]
      .sort();
    if (input.tracker === "workspace" && input.workspaceStyle === undefined) {
      platformFailure("TRADERLINK_MANUAL_TRADE_PREVIEW_INVALID");
    }
    if (
      input.entries.some((entry) =>
        entry.sourceTimezone !== account.tradingTimezone || entry.localDate > today) ||
      (input.tracker === "day" && affectedDates.some((date) => date < earliestRecentDate)) ||
      (input.tracker === "swing" && affectedDates.at(-1)! < earliestRecentDate)
    ) {
      platformFailure("TRADERLINK_MANUAL_TRADE_RECENT_ENTRY_REQUIRED");
    }

    const prepared = input.entries.map((entry) => {
      const executedAtUtc = normalizeJournalExecutionLocalTime(
        `${entry.localDate}, ${entry.localTime}`,
        entry.sourceTimezone,
      );
      if (executedAtUtc > this.now().toISOString()) {
        platformFailure("TRADERLINK_MANUAL_TRADE_RECENT_ENTRY_REQUIRED");
      }
      return Object.freeze({
        entry,
        executedAtUtc,
        signedQuantityDecimal: signedQuantity(entry),
      });
    }).sort((left, right) =>
      left.executedAtUtc.localeCompare(right.executedAtUtc) ||
      left.entry.clientRowRef.localeCompare(right.entry.clientRowRef));

    const positions = this.repository.listCurrentNonClosedPositions(accountScope);
    const positionsByChain = new Map<string, JournalManualLedgerPosition[]>();
    for (const position of positions) {
      const key = chainKey(position.symbol, position.currency);
      positionsByChain.set(key, [...(positionsByChain.get(key) ?? []), position]);
    }
    const entriesByChain = new Map<string, PreparedEntry[]>();
    for (const entry of prepared) {
      const key = chainKey(entry.entry.normalizedSymbol, entry.entry.tradeCurrency);
      entriesByChain.set(key, [...(entriesByChain.get(key) ?? []), entry]);
    }

    const payload = canonicalJournalManualTradePreviewPayload({
      scope,
      accountSelectionRef: input.accountSelectionRef,
      tracker: input.tracker,
      workspaceStyle: input.workspaceStyle,
      entries: input.entries,
    });
    const payloadDigest = digestJournalManualTradePreviewPayload(payload);
    const groups: JournalManualTradePreviewGroup[] = [];
    for (const [key, chainEntries] of [...entriesByChain.entries()]
      .sort(([left], [right]) => left.localeCompare(right))) {
      const [symbol, currency] = key.split("\u001f") as [string, string];
      const matchingPositions = positionsByChain.get(key) ?? [];
      if (
        matchingPositions.some((position) => position.projectionState === "needs_decision") ||
        matchingPositions.filter((position) =>
          position.projectionState === "legitimate_open").length > 1
      ) {
        platformFailure("TRADERLINK_MANUAL_TRADE_RELATIONSHIP_CONFLICT", {
          reason: "existing_position_needs_review",
        });
      }
      const existing = matchingPositions.find((position) =>
        position.projectionState === "legitimate_open") ?? null;
      let current: BuildingGroup | null = existing
        ? {
            existingPosition: existing,
            direction: existing.direction,
            openedAtUtc: existing.openedAtUtc,
            lastExecutionAtUtc: existing.openedAtUtc,
            finalPositionDecimal: existing.finalPositionDecimal,
            allocations: [],
          }
        : null;
      const completed: BuildingGroup[] = [];
      for (const entry of chainEntries) {
        current = applyEntry(completed, current, entry);
      }
      if (current && current.allocations.length > 0) completed.push(current);
      for (const group of completed) {
        groups.push(toPreviewGroup({
          authority: this.authority,
          scope,
          payloadDigest,
          index: groups.length,
          symbol,
          currency,
          tracker: input.tracker,
          workspaceStyle: input.tracker === "workspace" ? input.workspaceStyle ?? null : null,
          group,
        }));
      }
    }
    if (groups.length === 0) {
      platformFailure("TRADERLINK_MANUAL_TRADE_PREVIEW_INVALID");
    }
    const issued = this.authority.issue(payload);
    return Object.freeze({
      previewRef: issued.previewRef,
      expiresAtUtc: issued.expiresAtUtc,
      tracker: input.tracker,
      workspaceStyle: input.tracker === "workspace" ? input.workspaceStyle ?? null : null,
      affectedDates: Object.freeze(affectedDates),
      executionCount: input.entries.length,
      groups: Object.freeze(groups),
    });
  }

  verify(scope: WorkspaceAccessScope, input: Readonly<{
    accountSelectionRef: string;
    tracker: JournalManualTrackerKind;
    workspaceStyle?: JournalManualWorkspaceStyle;
    entries: readonly JournalManualTradeEntry[];
    previewRef: string;
  }>): boolean {
    return this.authority.verify(
      input.previewRef,
      canonicalJournalManualTradePreviewPayload({
        scope,
        accountSelectionRef: input.accountSelectionRef,
        tracker: input.tracker,
        workspaceStyle: input.workspaceStyle,
        entries: input.entries,
      }),
    );
  }

  resolvePositionRef(
    scope: WorkspaceAccessScope,
    positionRef: string,
  ): JournalManualLedgerPosition {
    const accountId = scope.activeAccountId;
    if (!accountId) platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
    const accountScope = narrowWorkspaceAccessToAccount(scope, accountId);
    const matches = this.repository.listCurrentNonClosedPositions(accountScope)
      .filter((position) =>
        existingPositionOption(this.authority, scope, position).positionRef === positionRef);
    if (matches.length !== 1) {
      platformFailure("TRADERLINK_MANUAL_TRADE_RELATIONSHIP_CONFLICT", {
        reason: "position_changed",
      });
    }
    return matches[0]!;
  }

  positionRefForTarget(
    scope: WorkspaceAccessScope,
    target: Readonly<{ roundTripId: string; roundTripVersionId: string }>,
  ): string {
    const accountId = scope.activeAccountId;
    if (!accountId) platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
    return this.authority.opaqueRef(
      "position",
      [
        scope.workspaceId,
        accountId,
        target.roundTripId,
        target.roundTripVersionId,
      ].join("\u001f"),
    );
  }
}
