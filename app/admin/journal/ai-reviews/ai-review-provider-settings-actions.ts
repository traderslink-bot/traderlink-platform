"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

import { CoachAiProviderSettingsRepository } from "@/src/modules/coach/server/coach-ai-provider-settings-repository";
import { withJournalAdminDatabase } from "@/src/modules/platform/server/administration/platform-admin-authorization";
import { isTraderLinkPlatformError } from "@/src/modules/platform/server/database/platform-migration-contract";

export async function saveAiReviewProviderSettings(input: Readonly<{
  modelId: unknown;
  inputCostUsdPerMillionTokens: unknown;
  cachedInputCostUsdPerMillionTokens: unknown;
  cacheWriteInputCostUsdPerMillionTokens: unknown;
  outputCostUsdPerMillionTokens: unknown;
}>): Promise<Readonly<{ ok: true }> | Readonly<{ ok: false; message: string }>> {
  try {
    withJournalAdminDatabase(await headers(), (database) =>
      new CoachAiProviderSettingsRepository(database).save(input));
    revalidatePath("/admin/journal/ai-reviews");
    return Object.freeze({ ok: true as const });
  } catch (error) {
    const invalid = isTraderLinkPlatformError(error) && error.code === "TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED";
    return Object.freeze({
      ok: false as const,
      message: invalid
        ? "Enter a model ID and all four token prices, or leave all four prices blank."
        : "AI Review settings could not be saved. Try again.",
    });
  }
}
