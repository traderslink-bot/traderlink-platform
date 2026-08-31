import type { ManualExecutionInput } from "../imports/journal-import-service";
import type {
  JournalManualTradeCommitRequest,
  JournalManualTradeCommitStatusRequest,
  JournalManualTradeGroupConfirmation,
  JournalManualTradeOfflineSync,
  JournalManualTrackerKind,
  JournalManualTradeEntry,
  JournalManualWorkspaceStyle,
} from "../../contracts/journal-manual-trade-capture-contracts";
import {
  assertCanonicalJournalDecimal,
  assertJournalCurrency,
  assertJournalTimezone,
} from "../../contracts/journal-storage-values";
import { platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";
import {
  normalizeJournalExecutionLocalTime,
  normalizeJournalStockSymbol,
} from "../imports/journal-value-normalization";

type JsonRecord = Record<string, unknown>;

const CLIENT_ROW_REF_PATTERN = /^[A-Za-z0-9_-]{1,64}$/u;
const OPAQUE_REF_PATTERN = /^[0-9a-f]{64}$/u;

function record(value: unknown, field: string): JsonRecord {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field });
  }
  return value as JsonRecord;
}

function text(value: unknown, field: string): string {
  if (typeof value !== "string") {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field });
  }
  return value;
}

function canonicalDecimal(
  value: unknown,
  field: string,
  options: Readonly<{
    allowLeadingDecimal?: boolean;
    positive?: boolean;
    nonNegative?: boolean;
  }> = {},
): string {
  const raw = text(value, field).trim();
  const trimmed = options.allowLeadingDecimal && /^\.(\d+)$/u.test(raw)
    ? `0${raw}`
    : raw;
  const match = /^(-?)(\d+)(?:\.(\d+))?$/u.exec(trimmed);
  if (!match) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field });
  }
  const whole = (match[2] ?? "0").replace(/^0+(?=\d)/u, "");
  const fraction = (match[3] ?? "").replace(/0+$/u, "");
  const unsigned = fraction ? `${whole}.${fraction}` : whole;
  const normalized = unsigned === "0"
    ? "0"
    : `${match[1] === "-" ? "-" : ""}${unsigned}`;
  assertCanonicalJournalDecimal(normalized, field, options);
  return normalized;
}

export function parseJournalManualTrackerKind(
  value: unknown,
): JournalManualTrackerKind {
  if (value !== "day" && value !== "quick" && value !== "swing" && value !== "workspace") {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
      field: "tracker",
    });
  }
  return value;
}

export function parseJournalManualWorkspaceStyle(
  value: unknown,
): JournalManualWorkspaceStyle {
  if (value !== "day_trade" && value !== "swing") {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
      field: "workspaceStyle",
    });
  }
  return value;
}

export function parseJournalManualTradeEntry(
  value: unknown,
): JournalManualTradeEntry {
  const input = record(value, "entry");
  const clientRowRef = text(input.clientRowRef, "clientRowRef");
  const localDate = text(input.date ?? input.localDate, "date");
  const localTimeInput = text(input.time ?? input.localTime, "time");
  const localTime = localTimeInput.length === 5
    ? `${localTimeInput}:00`
    : localTimeInput;
  const sourceTimezone = text(input.sourceTimezone, "sourceTimezone");
  const normalizedSymbol = normalizeJournalStockSymbol(
    text(input.symbol ?? input.normalizedSymbol, "symbol"),
  );
  const tradeCurrency = text(
    input.currency ?? input.tradeCurrency,
    "currency",
  ).trim().toUpperCase();
  const side = text(input.side, "side").trim().toLowerCase();

  if (
    !CLIENT_ROW_REF_PATTERN.test(clientRowRef) ||
    !/^\d{4}-\d{2}-\d{2}$/u.test(localDate) ||
    !/^\d{2}:\d{2}:\d{2}$/u.test(localTime) ||
    (side !== "buy" && side !== "sell")
  ) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
      field: "manualEntry",
    });
  }
  assertJournalTimezone(sourceTimezone, "sourceTimezone");
  assertJournalCurrency(tradeCurrency, "tradeCurrency");

  const quantityDecimal = canonicalDecimal(
    input.quantity ?? input.quantityDecimal,
    "quantity",
    { positive: true },
  );
  const priceDecimal = canonicalDecimal(
    input.price ?? input.priceDecimal,
    "price",
    { allowLeadingDecimal: true, positive: true },
  );
  const feeText = text(input.fees ?? input.feesDecimal ?? "", "fees").trim();
  const feesDecimal = feeText === ""
    ? null
    : canonicalDecimal(feeText, "fees", {
        allowLeadingDecimal: true,
        nonNegative: true,
      });

  normalizeJournalExecutionLocalTime(
    `${localDate}, ${localTime}`,
    sourceTimezone,
  );

  return Object.freeze({
    clientRowRef,
    localDate,
    localTime,
    sourceTimezone,
    normalizedSymbol,
    tradeCurrency,
    side,
    quantityDecimal,
    priceDecimal,
    feesDecimal,
  });
}

export function toManualExecutionInput(
  entry: JournalManualTradeEntry,
): ManualExecutionInput {
  const feeCost = entry.feesDecimal === "0" ? null : entry.feesDecimal;
  return Object.freeze({
    sourceTimestampText: `${entry.localDate}, ${entry.localTime}`,
    sourceTimezone: entry.sourceTimezone,
    normalizedSymbol: entry.normalizedSymbol,
    tradeCurrency: entry.tradeCurrency,
    side: entry.side,
    quantityDecimal: entry.quantityDecimal,
    priceDecimal: entry.priceDecimal,
    feesDecimal: feeCost === null ? null : `-${feeCost}`,
    feeCurrency: feeCost === null ? null : entry.tradeCurrency,
    feeSignConvention: feeCost === null ? "not_reported" : "cash_effect",
    tradeIntent: "not_set",
  });
}

export function journalManualTradeFactKey(
  entry: JournalManualTradeEntry,
): string {
  const feeCost = entry.feesDecimal === "0" ? null : entry.feesDecimal;
  return JSON.stringify([
    `${entry.localDate}, ${entry.localTime}`,
    entry.sourceTimezone,
    entry.normalizedSymbol,
    entry.tradeCurrency,
    entry.side,
    entry.quantityDecimal,
    entry.priceDecimal,
    feeCost === null ? "" : `-${feeCost}`,
  ]);
}

export function parseJournalManualTradeEntries(
  value: unknown,
): readonly JournalManualTradeEntry[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > 200) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
      field: "manualBatchSize",
    });
  }
  const entries = value.map(parseJournalManualTradeEntry);
  if (new Set(entries.map((entry) => entry.clientRowRef)).size !== entries.length) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
      field: "clientRowRef",
    });
  }
  return Object.freeze(entries);
}

/**
 * Day Tracker is a one-trading-day journal. This validation deliberately does
 * not nominate the first row as the day: the trader decides how to correct a
 * mixed batch while the form remains intact.
 */
export function assertJournalManualTrackerEntryDates(
  tracker: JournalManualTrackerKind,
  entries: readonly JournalManualTradeEntry[],
): void {
  if (tracker !== "day") return;
  if (new Set(entries.map((entry) => entry.localDate)).size !== 1) {
    platformFailure("TRADERLINK_MANUAL_TRADE_SINGLE_DAY_REQUIRED");
  }
}

function parseConfirmation(value: unknown): JournalManualTradeGroupConfirmation {
  const input = record(value, "confirmation");
  const groupRef = text(input.groupRef, "groupRef");
  const relationship = text(input.relationship, "relationship");
  const style = text(input.style, "style");
  const existingPositionRef = input.existingPositionRef;
  if (
    !OPAQUE_REF_PATTERN.test(groupRef) ||
    ![
      "start_new_trade",
      "continue_tracked_position",
      "close_tracked_position",
      "not_finished",
    ].includes(relationship) ||
    !["day_trade", "swing", "other"].includes(style) ||
    (existingPositionRef !== null &&
      (typeof existingPositionRef !== "string" || !OPAQUE_REF_PATTERN.test(existingPositionRef))) ||
    typeof input.completeExecutionSetConfirmed !== "boolean"
  ) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
      field: "manualTradeConfirmation",
    });
  }
  return Object.freeze({
    groupRef,
    relationship: relationship as JournalManualTradeGroupConfirmation["relationship"],
    style: style as JournalManualTradeGroupConfirmation["style"],
    existingPositionRef,
    completeExecutionSetConfirmed: input.completeExecutionSetConfirmed,
  });
}

function parseOfflineSync(value: unknown): JournalManualTradeOfflineSync {
  const input = record(value, "offlineSync");
  if (
    input.duplicateResolution !== "review_required" &&
    input.duplicateResolution !== "save_separately"
  ) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
      field: "offlineSync",
    });
  }
  return Object.freeze({
    duplicateResolution: input.duplicateResolution,
  });
}

export function parseJournalManualTradeCommitRequest(
  value: unknown,
): JournalManualTradeCommitRequest {
  const input = record(value, "manualTradeCommit");
  const previewRef = text(input.previewRef, "previewRef");
  const expectedAccountSelectionRef = text(
    input.expectedAccountSelectionRef,
    "expectedAccountSelectionRef",
  );
  const idempotencyKey = text(input.idempotencyKey, "idempotencyKey");
  if (
    previewRef.length < 80 || previewRef.length > 500 ||
    !OPAQUE_REF_PATTERN.test(expectedAccountSelectionRef) ||
    idempotencyKey.length < 16 || idempotencyKey.length > 128 ||
    !Array.isArray(input.confirmations) ||
    input.confirmations.length < 1 || input.confirmations.length > 200 ||
    (input.preparedBy !== undefined && input.preparedBy !== "ai_chat")
  ) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
      field: "manualTradeCommit",
    });
  }
  const tracker = parseJournalManualTrackerKind(input.tracker);
  const workspaceStyle = tracker === "workspace"
    ? parseJournalManualWorkspaceStyle(input.workspaceStyle)
    : undefined;
  return Object.freeze({
    tracker,
    entries: parseJournalManualTradeEntries(input.entries),
    previewRef,
    expectedAccountSelectionRef,
    idempotencyKey,
    confirmations: Object.freeze(input.confirmations.map(parseConfirmation)),
    ...(input.preparedBy === "ai_chat" ? { preparedBy: "ai_chat" as const } : {}),
    ...(workspaceStyle === undefined ? {} : { workspaceStyle }),
    ...(input.offlineSync === undefined
      ? {}
      : { offlineSync: parseOfflineSync(input.offlineSync) }),
  });
}

export function parseJournalManualTradeCommitStatusRequest(
  value: unknown,
): JournalManualTradeCommitStatusRequest {
  const input = record(value, "manualTradeCommitStatus");
  const expectedAccountSelectionRef = text(
    input.expectedAccountSelectionRef,
    "expectedAccountSelectionRef",
  );
  const idempotencyKey = text(input.idempotencyKey, "idempotencyKey");
  if (
    !OPAQUE_REF_PATTERN.test(expectedAccountSelectionRef) ||
    idempotencyKey.length < 16 ||
    idempotencyKey.length > 128
  ) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
      field: "manualTradeCommitStatus",
    });
  }
  const tracker = parseJournalManualTrackerKind(input.tracker);
  const workspaceStyle = tracker === "workspace"
    ? parseJournalManualWorkspaceStyle(input.workspaceStyle)
    : undefined;
  return Object.freeze({
    tracker,
    entries: parseJournalManualTradeEntries(input.entries),
    expectedAccountSelectionRef,
    idempotencyKey,
    ...(workspaceStyle === undefined ? {} : { workspaceStyle }),
  });
}

export function requireJsonRecord(value: unknown, field: string): JsonRecord {
  return record(value, field);
}

export function requireJsonText(value: unknown, field: string): string {
  return text(value, field);
}
