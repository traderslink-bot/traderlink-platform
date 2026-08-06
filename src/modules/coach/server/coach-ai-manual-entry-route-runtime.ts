import type {
  CoachAiManualExecutionExtractionRow,
} from "../contracts/ai-manual-entry-draft-contracts";
import type {
  JournalManualTrackerKind,
  JournalManualTradeGroupConfirmation,
} from "@/src/modules/journal/contracts/journal-manual-trade-capture-contracts";
import { assertCanonicalUuidV4, platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";

type JsonRecord = Record<string, unknown>;

const CLIENT_ROW_REF_PATTERN = /^[A-Za-z0-9_-]{1,64}$/u;
const OPAQUE_REF_PATTERN = /^[0-9a-f]{64}$/u;

function invalid(field: string): never {
  platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field });
}

function record(value: unknown, field: string): JsonRecord {
  if (typeof value !== "object" || value === null || Array.isArray(value)) invalid(field);
  return value as JsonRecord;
}

function exactKeys(value: JsonRecord, keys: readonly string[]): void {
  const actual = Object.keys(value);
  if (actual.length !== keys.length || keys.some((key) => !actual.includes(key))) {
    invalid("body");
  }
}

function nullableText(value: unknown, field: string, maximum: number): string | null {
  if (value === null) return null;
  if (typeof value !== "string" || value.length < 1 || value.length > maximum) invalid(field);
  return value;
}

function tracker(value: unknown): JournalManualTrackerKind {
  if (value !== "day" && value !== "quick" && value !== "swing") invalid("tracker");
  return value;
}

function editableRow(value: unknown): CoachAiManualExecutionExtractionRow {
  const row = record(value, "row");
  exactKeys(row, [
    "clientRowRef", "localDate", "localTime", "normalizedSymbol", "side",
    "quantityDecimal", "priceDecimal", "feesDecimal",
  ]);
  if (typeof row.clientRowRef !== "string" || !CLIENT_ROW_REF_PATTERN.test(row.clientRowRef)) {
    invalid("clientRowRef");
  }
  const side = row.side === null ? null : row.side;
  if (side !== null && side !== "buy" && side !== "sell") invalid("side");
  return Object.freeze({
    clientRowRef: row.clientRowRef,
    localDate: nullableText(row.localDate, "localDate", 10),
    localTime: nullableText(row.localTime, "localTime", 8),
    normalizedSymbol: nullableText(row.normalizedSymbol, "normalizedSymbol", 32),
    side,
    quantityDecimal: nullableText(row.quantityDecimal, "quantityDecimal", 128),
    priceDecimal: nullableText(row.priceDecimal, "priceDecimal", 128),
    feesDecimal: nullableText(row.feesDecimal, "feesDecimal", 128),
  });
}

function confirmation(value: unknown): JournalManualTradeGroupConfirmation {
  const item = record(value, "confirmation");
  exactKeys(item, [
    "groupRef", "relationship", "style", "existingPositionRef",
    "completeExecutionSetConfirmed",
  ]);
  if (typeof item.groupRef !== "string" || !OPAQUE_REF_PATTERN.test(item.groupRef) ||
      (item.relationship !== "start_new_trade" &&
        item.relationship !== "continue_tracked_position" &&
        item.relationship !== "close_tracked_position" &&
        item.relationship !== "not_finished") ||
      (item.style !== "day_trade" && item.style !== "swing" && item.style !== "other") ||
      (item.existingPositionRef !== null &&
        (typeof item.existingPositionRef !== "string" || !OPAQUE_REF_PATTERN.test(item.existingPositionRef))) ||
      typeof item.completeExecutionSetConfirmed !== "boolean") {
    invalid("confirmation");
  }
  return Object.freeze({
    groupRef: item.groupRef,
    relationship: item.relationship,
    style: item.style,
    existingPositionRef: item.existingPositionRef,
    completeExecutionSetConfirmed: item.completeExecutionSetConfirmed,
  });
}

export function parseCoachAiManualEntryDraftId(value: unknown): string {
  if (typeof value !== "string") invalid("draftId");
  assertCanonicalUuidV4(value, "draftId");
  return value;
}

export function parseCoachAiManualEntryPreviewBody(body: JsonRecord): Readonly<{
  tracker: JournalManualTrackerKind;
  rows: readonly CoachAiManualExecutionExtractionRow[];
}> {
  exactKeys(body, ["tracker", "rows"]);
  if (!Array.isArray(body.rows) || body.rows.length < 1 || body.rows.length > 20) {
    invalid("rows");
  }
  return Object.freeze({
    tracker: tracker(body.tracker),
    rows: Object.freeze(body.rows.map(editableRow)),
  });
}

export function parseCoachAiManualEntryCommitBody(body: JsonRecord): Readonly<{
  tracker: JournalManualTrackerKind;
  previewRef: string;
  clientRequestId: string;
  confirmations: readonly JournalManualTradeGroupConfirmation[];
}> {
  exactKeys(body, ["tracker", "previewRef", "clientRequestId", "confirmations"]);
  if (typeof body.previewRef !== "string" || body.previewRef.length < 80 || body.previewRef.length > 500 ||
      typeof body.clientRequestId !== "string" || !Array.isArray(body.confirmations) ||
      body.confirmations.length < 1 || body.confirmations.length > 20) {
    invalid("commit");
  }
  assertCanonicalUuidV4(body.clientRequestId, "clientRequestId");
  return Object.freeze({
    tracker: tracker(body.tracker),
    previewRef: body.previewRef,
    clientRequestId: body.clientRequestId,
    confirmations: Object.freeze(body.confirmations.map(confirmation)),
  });
}
