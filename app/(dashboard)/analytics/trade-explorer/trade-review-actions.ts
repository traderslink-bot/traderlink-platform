"use server";

import {
  requireTraderLinkPlatformPageScope,
} from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import {
  isTraderLinkPlatformError,
  platformFailure,
} from "@/src/modules/platform/server/database/platform-migration-contract";

import type {
  TradeExplorerReviewModel,
  TradeExplorerReviewSaveInput,
  TradeExplorerReviewTag,
} from "./trade-review-model";
import {
  createTradeExplorerReviewTag,
  readTradeExplorerReview,
  saveTradeExplorerReview,
} from "./trade-review-service";

type ReviewActionFailure = Readonly<{
  message: string;
  ok: false;
  refreshRequired: boolean;
}>;

export type ReviewActionResult<T> = Readonly<{ data: T; ok: true }> | ReviewActionFailure;

function record(value: unknown): Record<string, unknown> {
  if (!value || Array.isArray(value) || typeof value !== "object") {
    platformFailure("TRADERLINK_JOURNAL_ANNOTATION_INVALID");
  }
  return value as Record<string, unknown>;
}

function text(value: unknown, field: string): string {
  if (typeof value !== "string") {
    platformFailure("TRADERLINK_JOURNAL_ANNOTATION_INVALID", { field });
  }
  return value;
}

function nullableRevision(value: unknown): number | null {
  if (value === null) return null;
  if (!Number.isSafeInteger(value) || Number(value) <= 0) {
    platformFailure("TRADERLINK_JOURNAL_ANNOTATION_CONFLICT");
  }
  return Number(value);
}

function textList(value: unknown, field: string): readonly string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    platformFailure("TRADERLINK_JOURNAL_ANNOTATION_INVALID", { field });
  }
  return Object.freeze([...value]);
}

function saveInput(value: unknown): TradeExplorerReviewSaveInput {
  const input = record(value);
  const note = input.note === null
    ? null
    : (() => {
        const candidate = record(input.note);
        return Object.freeze({
          expectedRevision: nullableRevision(candidate.expectedRevision),
          tradeNote: text(candidate.tradeNote, "tradeNote"),
        });
      })();
  const tags = input.tags === null
    ? null
    : (() => {
        const candidate = record(input.tags);
        return Object.freeze({
          expectedTagIds: textList(candidate.expectedTagIds, "expectedTagIds"),
          presetKeys: textList(candidate.presetKeys, "presetKeys"),
          tagIds: textList(candidate.tagIds, "tagIds"),
        });
      })();
  if (!Array.isArray(input.ruleReviews)) {
    platformFailure("TRADERLINK_JOURNAL_ANNOTATION_INVALID", { field: "ruleReviews" });
  }
  const ruleReviews = Object.freeze(input.ruleReviews.map((value) => {
    const candidate = record(value);
    const status = candidate.status;
    if (status !== "followed" && status !== "broken" && status !== "not_reviewed") {
      platformFailure("TRADERLINK_JOURNAL_ANNOTATION_INVALID", { field: "status" });
    }
    return Object.freeze({
      expectedRevision: nullableRevision(candidate.expectedRevision),
      ruleId: text(candidate.ruleId, "ruleId"),
      ruleVersionId: text(candidate.ruleVersionId, "ruleVersionId"),
      status,
    });
  }));
  return Object.freeze({
    closeLocalDate: text(input.closeLocalDate, "closeLocalDate"),
    expectedAccountSelectionRef: text(
      input.expectedAccountSelectionRef,
      "expectedAccountSelectionRef",
    ),
    note,
    roundTripId: text(input.roundTripId, "roundTripId"),
    ruleReviews,
    tags,
  });
}

function failure(error: unknown, action: "open" | "save" | "tag"): ReviewActionFailure {
  const accessChanged = isTraderLinkPlatformError(error) && [
    "TRADERLINK_AUTH_SESSION_INVALID",
    "TRADERLINK_WORKSPACE_ACCESS_DENIED",
    "TRADERLINK_ACCOUNT_ACCESS_DENIED",
    "TRADERLINK_ACCOUNT_SELECTION_CONFLICT",
  ].includes(error.code);
  const changed = isTraderLinkPlatformError(error) &&
    error.code === "TRADERLINK_JOURNAL_ANNOTATION_CONFLICT";
  return Object.freeze({
    message: accessChanged
      ? "Your access or selected Trade Tracker account changed. Refresh this page and try again."
      : changed
        ? "This trade review changed since it was opened. Reload it and try again."
        : action === "open"
          ? "This trade review could not be opened. Try again."
          : action === "tag"
            ? "That tag could not be created. Check the name and try again."
            : "This trade review could not be saved. Check the entries and try again.",
    ok: false as const,
    refreshRequired: accessChanged,
  });
}

export async function loadTradeExplorerReview(
  value: unknown,
): Promise<ReviewActionResult<TradeExplorerReviewModel>> {
  try {
    const input = record(value);
    const scope = await requireTraderLinkPlatformPageScope();
    return Object.freeze({
      data: readTradeExplorerReview(scope, {
        closeLocalDate: input.closeLocalDate,
        expectedAccountSelectionRef: input.expectedAccountSelectionRef,
        roundTripId: input.roundTripId,
      }),
      ok: true as const,
    });
  } catch (error) {
    return failure(error, "open");
  }
}

export async function createTradeExplorerTag(
  value: unknown,
): Promise<ReviewActionResult<TradeExplorerReviewTag>> {
  try {
    const input = record(value);
    const scope = await requireTraderLinkPlatformPageScope();
    return Object.freeze({
      data: createTradeExplorerReviewTag(scope, {
        expectedAccountSelectionRef: input.expectedAccountSelectionRef,
        name: input.name,
      }),
      ok: true as const,
    });
  } catch (error) {
    return failure(error, "tag");
  }
}

export async function saveTradeExplorerReviewAction(
  value: unknown,
): Promise<ReviewActionResult<TradeExplorerReviewModel>> {
  try {
    const scope = await requireTraderLinkPlatformPageScope();
    return Object.freeze({
      data: saveTradeExplorerReview(scope, saveInput(value)),
      ok: true as const,
    });
  } catch (error) {
    return failure(error, "save");
  }
}
