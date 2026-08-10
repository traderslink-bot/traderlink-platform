"use server";

import { revalidatePath } from "next/cache";

import { requireTraderLinkPlatformPageScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import {
  createCanonicalUtcTimestamp,
  isTraderLinkPlatformError,
} from "@/src/modules/platform/server/database/platform-migration-contract";
import { PlatformNotificationRepository } from "@/src/modules/platform/server/notifications/platform-notification-repository";

export async function saveDiscordDmNotificationCategories(
  categories: readonly string[],
): Promise<Readonly<{ ok: true; categories: readonly string[] }> | Readonly<{ ok: false; message: string }>> {
  try {
    const scope = await requireTraderLinkPlatformPageScope();
    const preferences = withPlatformDatabase(
      { mode: "runtime" },
      (database) => new PlatformNotificationRepository(database)
        .replaceDiscordDmCategories({
          categories,
          scope,
          updatedAtUtc: createCanonicalUtcTimestamp(),
        }),
    );
    revalidatePath("/account");
    return Object.freeze({ ok: true as const, categories: preferences.discordDmCategories });
  } catch (error) {
    const invalid = isTraderLinkPlatformError(error) &&
      error.code === "TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED";
    return Object.freeze({
      ok: false as const,
      message: invalid
        ? "Choose notifications from the available categories."
        : "Your notification settings could not be saved. Try again.",
    });
  }
}
