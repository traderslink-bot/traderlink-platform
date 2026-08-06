import type { CoachAiReviewDeliveryChangeExtraction } from "../contracts/ai-review-delivery-change-contracts";
import {
  assertCanonicalUuidV4,
  platformFailure,
} from "@/src/modules/platform/server/database/platform-migration-contract";

function invalid(field: string): never {
  platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field });
}

function exactKeys(value: Record<string, unknown>, keys: readonly string[]): void {
  const actual = Object.keys(value);
  if (actual.length !== keys.length || keys.some((key) => !actual.includes(key))) invalid("body");
}

export function parseCoachAiReviewDeliveryDraftId(value: unknown): string {
  if (typeof value !== "string") invalid("draftId");
  assertCanonicalUuidV4(value, "draftId");
  return value;
}

export function parseCoachAiReviewDeliveryConfirmBody(
  body: Record<string, unknown>,
): Readonly<{ editedProposal: CoachAiReviewDeliveryChangeExtraction }> {
  exactKeys(body, ["editedProposal"]);
  const proposed = body.editedProposal;
  if (!proposed || Array.isArray(proposed) || typeof proposed !== "object") {
    invalid("editedProposal");
  }
  const item = proposed as Record<string, unknown>;
  exactKeys(item, ["weeklyDeliveryDay", "deliveryTimeEastern"]);
  if (item.weeklyDeliveryDay !== "friday" && item.weeklyDeliveryDay !== "saturday" &&
      item.weeklyDeliveryDay !== "sunday") invalid("weeklyDeliveryDay");
  if (typeof item.deliveryTimeEastern !== "string" ||
      !/^(?:1[6-9]|2[0-3]):(?:00|30)$/u.test(item.deliveryTimeEastern)) {
    invalid("deliveryTimeEastern");
  }
  return Object.freeze({
    editedProposal: Object.freeze({
      weeklyDeliveryDay: item.weeklyDeliveryDay,
      deliveryTimeEastern: item.deliveryTimeEastern,
    }),
  });
}

export function parseCoachAiReviewDeliveryRejectBody(body: Record<string, unknown>): void {
  exactKeys(body, []);
}
