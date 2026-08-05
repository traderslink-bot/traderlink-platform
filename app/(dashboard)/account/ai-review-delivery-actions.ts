"use server";

import { revalidatePath } from "next/cache";

import { CoachReviewDeliveryScheduleRepository } from "@/src/modules/coach/server/coach-weekly-review-schedule-repository";
import { requireTraderLinkPlatformPageScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { isTraderLinkPlatformError } from "@/src/modules/platform/server/database/platform-migration-contract";

export async function saveAiReviewDelivery(input: Readonly<{
  weeklyDeliveryDay: unknown;
  deliveryTimeEastern: unknown;
}>): Promise<
  Readonly<{ ok: true; weeklyDeliveryDay: "friday" | "saturday" | "sunday"; deliveryTimeEastern: string }> |
  Readonly<{ ok: false; message: string }>
> {
  try {
    const scope = await requireTraderLinkPlatformPageScope();
    const schedule = withPlatformDatabase(
      { mode: "runtime" },
      (database) => new CoachReviewDeliveryScheduleRepository(database).save(scope, input),
    );
    revalidatePath("/account");
    revalidatePath("/ai-reviews");
    return Object.freeze({ ok: true as const, ...schedule });
  } catch (error) {
    const invalid = isTraderLinkPlatformError(error) && error.code === "TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED";
    return Object.freeze({
      ok: false as const,
      message: invalid
        ? "Choose Friday, Saturday or Sunday and a time between 4:00 PM and 11:59 PM Eastern."
        : "Your AI Review delivery settings could not be saved. Try again.",
    });
  }
}
