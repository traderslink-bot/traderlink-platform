"use server";

import { revalidatePath } from "next/cache";

import { CoachWeeklyReviewScheduleRepository } from "@/src/modules/coach/server/coach-weekly-review-schedule-repository";
import { requireTraderLinkPlatformPageScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { isTraderLinkPlatformError } from "@/src/modules/platform/server/database/platform-migration-contract";

export async function saveFridayAiReviewDeliveryTime(value: unknown): Promise<
  Readonly<{ ok: true; fridayDeliveryTimeEastern: string }> |
  Readonly<{ ok: false; message: string }>
> {
  try {
    const scope = await requireTraderLinkPlatformPageScope();
    const schedule = withPlatformDatabase(
      { mode: "runtime" },
      (database) => new CoachWeeklyReviewScheduleRepository(database).save(scope, value),
    );
    revalidatePath("/ai-reviews");
    return Object.freeze({ ok: true as const, fridayDeliveryTimeEastern: schedule.fridayDeliveryTimeEastern });
  } catch (error) {
    const invalid = isTraderLinkPlatformError(error) && error.code === "TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED";
    return Object.freeze({
      ok: false as const,
      message: invalid
        ? "Choose a Friday time between 4:00 PM and 11:59 PM Eastern."
        : "Your AI Review schedule could not be saved. Try again.",
    });
  }
}
