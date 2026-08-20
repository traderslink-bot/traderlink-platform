import type { JournalOpenPositionsReadModel } from "@/src/modules/journal-analytics/contracts/journal-dashboard-read-models";
import type { JournalTradeStyleRecord } from "./journal-trade-style-contracts";
import type { PlatformOfflineCoverageFact } from "@/src/modules/platform/contracts/platform-offline-saved-view-contracts";

export const JOURNAL_OPEN_POSITIONS_OFFLINE_ROUTE_VIEW_VERSION =
  "journal-open-positions-v1" as const;
export const JOURNAL_OPEN_POSITIONS_OFFLINE_VIEW_KEY =
  "journal:open-positions:confirmed" as const;

export type JournalOfflinePositionStyle = Omit<
  JournalTradeStyleRecord,
  "positionRef"
>;

export type JournalOpenPositionsOfflineViewModel = Readonly<{
  positionStyles: Readonly<Record<string, JournalOfflinePositionStyle | null>>;
  result: Pick<JournalOpenPositionsReadModel, "positions">;
  version: 1;
}>;

export function createJournalOpenPositionsOfflineViewModel(input: Readonly<{
  positionStyles: Readonly<Record<string, Readonly<{
    style: JournalTradeStyleRecord | null;
  }>>>;
  result: JournalOpenPositionsReadModel;
}>): JournalOpenPositionsOfflineViewModel {
  return Object.freeze({
    positionStyles: Object.freeze(Object.fromEntries(
      Object.entries(input.positionStyles).map(([roundTripId, tracking]) => [
        roundTripId,
        tracking.style === null
          ? null
          : Object.freeze({
            claimedEffectiveAtUtc: tracking.style.claimedEffectiveAtUtc,
            declaredAtUtc: tracking.style.declaredAtUtc,
            lifecycleState: tracking.style.lifecycleState,
            openStatus: tracking.style.openStatus,
            plannedFromEntry: tracking.style.plannedFromEntry,
            revision: tracking.style.revision,
            tradeStyle: tracking.style.tradeStyle,
            updatedAtUtc: tracking.style.updatedAtUtc,
          }),
      ]),
    )),
    result: Object.freeze({ positions: input.result.positions }),
    version: 1,
  });
}

export function journalOpenPositionsOfflineCoverage(
  result: JournalOpenPositionsReadModel,
): readonly PlatformOfflineCoverageFact[] {
  return Object.freeze([
    Object.freeze({
      key: "confirmed_open_positions",
      label: "Confirmed open positions",
      reason: null,
      status: "available",
    }),
    Object.freeze({
      key: "position_decisions",
      label: "Positions waiting for a decision",
      reason: result.coverage.needsDecisionCount > 0
        ? "Some execution chains are waiting for your decision and are not shown as confirmed open positions."
        : null,
      status: result.coverage.needsDecisionCount > 0
        ? "unavailable"
        : "available",
    }),
  ]);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

function isStyle(value: unknown): value is JournalOfflinePositionStyle | null {
  return value === null || (isRecord(value) &&
    typeof value.revision === "number" &&
    Number.isSafeInteger(value.revision) &&
    (value.tradeStyle === "day_trade" || value.tradeStyle === "swing" ||
      value.tradeStyle === "other") &&
    (value.openStatus === "day_trade_still_open" || value.openStatus === "swing" ||
      value.openStatus === "unplanned_hold" || value.openStatus === "other" ||
      value.openStatus === "unclassified" || value.openStatus === "closed") &&
    typeof value.plannedFromEntry === "boolean" &&
    typeof value.claimedEffectiveAtUtc === "string" &&
    typeof value.declaredAtUtc === "string" &&
    (value.lifecycleState === "active" || value.lifecycleState === "closed" ||
      value.lifecycleState === "needs_relink") &&
    typeof value.updatedAtUtc === "string");
}

export function isJournalOpenPositionsOfflineViewModel(
  value: unknown,
): value is JournalOpenPositionsOfflineViewModel {
  if (
    !isRecord(value) ||
    value.version !== 1 ||
    !isRecord(value.positionStyles) ||
    Object.keys(value.positionStyles).length > 5_000 ||
    !Object.values(value.positionStyles).every(isStyle) ||
    !isRecord(value.result) ||
    !Array.isArray(value.result.positions) ||
    value.result.positions.length > 5_000
  ) {
    return false;
  }
  return value.result.positions.every((position) => isRecord(position) &&
    typeof position.roundTripId === "string" &&
    typeof position.symbol === "string" &&
    typeof position.currency === "string" &&
    typeof position.timezone === "string" &&
    (position.direction === "long" || position.direction === "short") &&
    typeof position.openedAtUtc === "string" &&
    typeof position.remainingQuantityDecimal === "string" &&
    isNullableString(position.averageEntryPriceDecimal) &&
    typeof position.ageMilliseconds === "number" &&
    Number.isFinite(position.ageMilliseconds) &&
    position.ageMilliseconds >= 0);
}
