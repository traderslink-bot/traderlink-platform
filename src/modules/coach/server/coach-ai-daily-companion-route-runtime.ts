import type {
  CoachAiDailyCompanionDraftProposal,
  CoachAiDailyNoteDraftField,
} from "../contracts/ai-daily-companion-contracts";
import {
  assertCanonicalUuidV4,
  platformFailure,
} from "@/src/modules/platform/server/database/platform-migration-contract";

type JsonRecord = Record<string, unknown>;

function invalid(field: string): never {
  platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field });
}

function record(value: unknown, field: string): JsonRecord {
  if (!value || Array.isArray(value) || typeof value !== "object") invalid(field);
  return value as JsonRecord;
}

function exactKeys(value: JsonRecord, keys: readonly string[]): void {
  const actual = Object.keys(value);
  if (actual.length !== keys.length || keys.some((key) => !actual.includes(key))) {
    invalid("body");
  }
}

function content(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0 ||
      value.length > 10_000 || value.includes("\u0000")) invalid(field);
  return value.replace(/\r\n?/gu, "\n");
}

function proposal(value: unknown): CoachAiDailyCompanionDraftProposal {
  const item = record(value, "editedProposal");
  if (item.kind === "daily_note_draft") {
    exactKeys(item, ["kind", "updates"]);
    if (!Array.isArray(item.updates) || item.updates.length < 1 || item.updates.length > 4) {
      invalid("updates");
    }
    const allowed = new Set<CoachAiDailyNoteDraftField>([
      "whatWorked", "whatNeedsWork", "technicalRecap", "anythingElse",
    ]);
    const updates = item.updates.map((value) => {
      const update = record(value, "update");
      exactKeys(update, ["field", "content"]);
      if (!allowed.has(update.field as CoachAiDailyNoteDraftField)) invalid("field");
      return Object.freeze({
        field: update.field as CoachAiDailyNoteDraftField,
        content: content(update.content, "content"),
      });
    });
    if (new Set(updates.map((update) => update.field)).size !== updates.length) {
      invalid("updates");
    }
    return Object.freeze({ kind: item.kind, updates: Object.freeze(updates) });
  }
  if (item.kind === "trade_note_draft") {
    exactKeys(item, ["kind", "tradeNumber", "ticker", "direction", "content"]);
    if (!Number.isSafeInteger(item.tradeNumber) || Number(item.tradeNumber) <= 0 ||
        typeof item.ticker !== "string" || item.ticker.length < 1 || item.ticker.length > 32 ||
        (item.direction !== "long" && item.direction !== "short")) {
      invalid("tradeNoteDraft");
    }
    return Object.freeze({
      kind: item.kind,
      tradeNumber: Number(item.tradeNumber),
      ticker: item.ticker,
      direction: item.direction,
      content: content(item.content, "content"),
    });
  }
  if (item.kind === "current_focus_draft") {
    exactKeys(item, ["kind", "currentFocuses"]);
    return Object.freeze({
      kind: item.kind,
      currentFocuses: content(item.currentFocuses, "currentFocuses"),
    });
  }
  invalid("kind");
}

export function parseCoachAiDailyCompanionInteractionId(value: unknown): string {
  if (typeof value !== "string") invalid("interactionId");
  assertCanonicalUuidV4(value, "interactionId");
  return value;
}

export function parseCoachAiDailyCompanionConfirmBody(
  body: JsonRecord,
): Readonly<{ editedProposal: CoachAiDailyCompanionDraftProposal }> {
  exactKeys(body, ["editedProposal"]);
  return Object.freeze({ editedProposal: proposal(body.editedProposal) });
}

export function parseCoachAiDailyCompanionRejectBody(body: JsonRecord): void {
  exactKeys(body, []);
}
