"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { CoachAiReviewAdministrationRepository } from "@/src/modules/coach/server/coach-ai-review-administration-repository";
import { withJournalAdminDatabase } from "@/src/modules/platform/server/administration/platform-admin-authorization";
import { isTraderLinkPlatformError } from "@/src/modules/platform/server/database/platform-migration-contract";

type ActionResult = Readonly<{ ok: true }> | Readonly<{ ok: false; message: string }>;

function positiveInteger(value: unknown): number | null {
  if (value === "" || value === null || value === undefined) return null;
  if (typeof value === "number" && Number.isSafeInteger(value) && value > 0) return value;
  if (typeof value === "string" && /^[1-9]\d{0,15}$/u.test(value)) {
    const parsed = Number(value);
    if (Number.isSafeInteger(parsed)) return parsed;
  }
  throw new Error("invalid_dailyCap");
}

function controlInput(input: Readonly<{
  enabled: unknown;
  dailyRequestCap: unknown;
  dailyTokenCap: unknown;
  dailyEstimatedSpendCapUsd: unknown;
}>): Readonly<{
  enabled: boolean;
  dailyRequestCap: number | null;
  dailyTokenCap: number | null;
  dailyEstimatedSpendCapUsd: string | null;
}> {
  if (typeof input.enabled !== "boolean") throw new Error("invalid_enabled");
  const dailyRequestCap = positiveInteger(input.dailyRequestCap);
  const dailyTokenCap = positiveInteger(input.dailyTokenCap);
  const dailyEstimatedSpendCapUsd = input.dailyEstimatedSpendCapUsd === "" || input.dailyEstimatedSpendCapUsd === null || input.dailyEstimatedSpendCapUsd === undefined
    ? null
    : input.dailyEstimatedSpendCapUsd;
  if (dailyEstimatedSpendCapUsd !== null && (typeof dailyEstimatedSpendCapUsd !== "string" || !/^(?:0|[1-9]\d*)(?:\.\d{1,6})?$/u.test(dailyEstimatedSpendCapUsd))) {
    throw new Error("invalid_dailyEstimatedSpendCapUsd");
  }
  if ((dailyRequestCap === null) !== (dailyTokenCap === null) || (dailyRequestCap === null) !== (dailyEstimatedSpendCapUsd === null)) {
    throw new Error("invalid_dailyCaps");
  }
  return Object.freeze({ enabled: input.enabled, dailyRequestCap, dailyTokenCap, dailyEstimatedSpendCapUsd });
}

export async function saveAiReviewFeatureControl(input: Readonly<{
  featureKey: "weekly_reviews" | "monthly_reviews";
  enabled: unknown;
  dailyRequestCap: unknown;
  dailyTokenCap: unknown;
  dailyEstimatedSpendCapUsd: unknown;
}>): Promise<ActionResult> {
  try {
    const normalized = controlInput(input);
    withJournalAdminDatabase(await headers(), (database, scope) =>
      new CoachAiReviewAdministrationRepository({ database, scope }).savePlatformControl({
        featureKey: input.featureKey,
        ...normalized,
      }));
    revalidatePath("/admin/journal/ai-reviews");
    return Object.freeze({ ok: true as const });
  } catch (error) {
    const invalid = error instanceof Error && error.message.startsWith("invalid_") ||
      isTraderLinkPlatformError(error) && error.code === "TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED";
    return Object.freeze({
      ok: false as const,
      message: invalid
        ? "Enter all three positive daily limits before enabling this review."
        : "This review control could not be saved right now. Try again later.",
    });
  }
}
