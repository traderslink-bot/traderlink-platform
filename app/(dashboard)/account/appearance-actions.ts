"use server";

import { revalidatePath } from "next/cache";

import type { PlatformAppearance } from "@/src/modules/platform/contracts/platform-appearance";
import { requireTraderLinkPlatformPageScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { createCanonicalUtcTimestamp, isTraderLinkPlatformError } from "@/src/modules/platform/server/database/platform-migration-contract";
import { PlatformUserPreferenceRepository } from "@/src/modules/platform/server/identity/platform-user-preference-repository";

export async function saveAppearance(
  value: unknown,
): Promise<Readonly<{ appearance: PlatformAppearance; ok: true }> | Readonly<{ message: string; ok: false }>> {
  try {
    const scope = await requireTraderLinkPlatformPageScope();
    const appearance = withPlatformDatabase(
      { mode: "runtime" },
      (database) => new PlatformUserPreferenceRepository(database)
        .updateActiveWorkspaceAppearance({
          appearance: value,
          scope,
          updatedAtUtc: createCanonicalUtcTimestamp(),
        }),
    );
    revalidatePath("/account/preferences");
    revalidatePath("/workspace");
    return Object.freeze({ appearance, ok: true as const });
  } catch (error) {
    const invalid = isTraderLinkPlatformError(error) &&
      error.code === "TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED";
    return Object.freeze({
      message: invalid
        ? "Choose Light or Dark."
        : "Your appearance preference could not be saved. Try again.",
      ok: false as const,
    });
  }
}
