import type { JournalTradeStyleRecord } from "./journal-trade-style-contracts";
import type { PlatformOfflineCoverageFact } from "@/src/modules/platform/contracts/platform-offline-saved-view-contracts";

export const JOURNAL_SWING_TRACKER_OFFLINE_ROUTE_VIEW_VERSION =
  "journal-swing-tracker-v1" as const;
export const JOURNAL_SWING_TRACKER_OFFLINE_VIEW_KEY =
  "journal:swing-tracker:current" as const;

type SwingStyle = Omit<JournalTradeStyleRecord, "positionRef">;

export type JournalSwingTrackerOfflinePosition = Readonly<{
  averageEntryPriceDecimal: string | null;
  closedAtUtc: string | null;
  currency: string;
  direction: "long" | "short";
  executions: readonly Readonly<{
    allocationRole: "opening" | "adding" | "reducing" | "closing" | "flip_closing" | "flip_opening";
    executedAtUtc: string;
    priceDecimal: string | null;
    quantityDecimal: string;
    reportingFeesDecimal: string | null;
    reportingPriceDecimal: string | null;
    side: "buy" | "sell";
  }>[];
  notes: readonly Readonly<{
    addedRetrospectively: boolean;
    createdAtUtc: string;
    nextSessionPlan: string | null;
    note: string;
    reviewDate: string;
    revision: number;
    updatedAtUtc: string;
  }>[];
  openedAtUtc: string;
  positionKey: string;
  projectionState: "ready_closed" | "legitimate_open" | "needs_decision";
  remainingQuantityDecimal: string;
  style: SwingStyle | null;
  symbol: string;
  tags: readonly string[];
  timezone: string;
}>;

export type JournalSwingTrackerOfflineViewModel = Readonly<{
  active: readonly JournalSwingTrackerOfflinePosition[];
  completed: readonly JournalSwingTrackerOfflinePosition[];
  reviewDate: string;
  version: 1;
}>;

type SwingPositionSource = Omit<JournalSwingTrackerOfflinePosition, "positionKey" | "tags" | "notes" | "executions"> & Readonly<{
  executions: readonly (JournalSwingTrackerOfflinePosition["executions"][number] & Readonly<{ manualEdit?: unknown }>)[];
  notes: readonly (JournalSwingTrackerOfflinePosition["notes"][number] & Readonly<{ positionRef?: string }>)[];
  positionRef: string;
  tags: readonly Readonly<{ name: string }>[];
}>;

function sanitizePosition(
  position: SwingPositionSource,
  positionKey: string,
): JournalSwingTrackerOfflinePosition {
  return Object.freeze({
    averageEntryPriceDecimal: position.averageEntryPriceDecimal,
    closedAtUtc: position.closedAtUtc,
    currency: position.currency,
    direction: position.direction,
    executions: Object.freeze(position.executions.map((execution) => Object.freeze({
      allocationRole: execution.allocationRole,
      executedAtUtc: execution.executedAtUtc,
      priceDecimal: execution.priceDecimal,
      quantityDecimal: execution.quantityDecimal,
      reportingFeesDecimal: execution.reportingFeesDecimal,
      reportingPriceDecimal: execution.reportingPriceDecimal,
      side: execution.side,
    }))),
    notes: Object.freeze(position.notes.map((note) => Object.freeze({
      addedRetrospectively: note.addedRetrospectively,
      createdAtUtc: note.createdAtUtc,
      nextSessionPlan: note.nextSessionPlan,
      note: note.note,
      reviewDate: note.reviewDate,
      revision: note.revision,
      updatedAtUtc: note.updatedAtUtc,
    }))),
    openedAtUtc: position.openedAtUtc,
    positionKey,
    projectionState: position.projectionState,
    remainingQuantityDecimal: position.remainingQuantityDecimal,
    style: position.style,
    symbol: position.symbol,
    tags: Object.freeze(position.tags.map((tag) => tag.name)),
    timezone: position.timezone,
  });
}

export function createJournalSwingTrackerOfflineViewModel(input: Readonly<{
  active: readonly SwingPositionSource[];
  completed: readonly SwingPositionSource[];
  reviewDate: string;
}>): JournalSwingTrackerOfflineViewModel {
  return Object.freeze({
    active: Object.freeze(input.active.map((position, index) =>
      sanitizePosition(position, `active-${index}`))),
    completed: Object.freeze(input.completed.map((position, index) =>
      sanitizePosition(position, `completed-${index}`))),
    reviewDate: input.reviewDate,
    version: 1,
  });
}

export function journalSwingTrackerOfflineCoverage(): readonly PlatformOfflineCoverageFact[] {
  return Object.freeze([Object.freeze({
    key: "swing_positions",
    label: "Swing Trade Tracker positions",
    reason: null,
    status: "available",
  }), Object.freeze({
    key: "swing_notes",
    label: "Saved swing notes",
    reason: null,
    status: "available",
  }), Object.freeze({
    key: "swing_mutations",
    label: "Swing changes",
    reason: "Reconnect to change position types, tags, notes or saved executions.",
    status: "unavailable",
  })]);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validPosition(value: unknown): boolean {
  return isRecord(value) && typeof value.positionKey === "string" &&
    typeof value.symbol === "string" && typeof value.currency === "string" &&
    typeof value.timezone === "string" &&
    (value.direction === "long" || value.direction === "short") &&
    typeof value.openedAtUtc === "string" &&
    (value.closedAtUtc === null || typeof value.closedAtUtc === "string") &&
    typeof value.remainingQuantityDecimal === "string" &&
    (value.averageEntryPriceDecimal === null || typeof value.averageEntryPriceDecimal === "string") &&
    Array.isArray(value.executions) && value.executions.length <= 5_000 &&
    Array.isArray(value.notes) && value.notes.length <= 1_000 &&
    Array.isArray(value.tags) && value.tags.length <= 500;
}

export function isJournalSwingTrackerOfflineViewModel(
  value: unknown,
): value is JournalSwingTrackerOfflineViewModel {
  return isRecord(value) && value.version === 1 &&
    typeof value.reviewDate === "string" &&
    Array.isArray(value.active) && value.active.length <= 1_000 &&
    value.active.every(validPosition) &&
    Array.isArray(value.completed) && value.completed.length <= 1_000 &&
    value.completed.every(validPosition);
}
