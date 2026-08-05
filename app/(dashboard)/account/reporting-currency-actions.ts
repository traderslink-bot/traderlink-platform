"use server";

import { revalidatePath } from "next/cache";

import { requireTraderLinkPlatformPageScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { createCanonicalUtcTimestamp, isTraderLinkPlatformError } from "@/src/modules/platform/server/database/platform-migration-contract";
import { PlatformUserPreferenceRepository } from "@/src/modules/platform/server/identity/platform-user-preference-repository";

export async function saveReportingCurrency(
  value: unknown,
): Promise<Readonly<{ ok: true; reportingCurrency: string }> | Readonly<{ ok: false; message: string }>> {
  try {
    const scope = await requireTraderLinkPlatformPageScope();
    const reportingCurrency = withPlatformDatabase(
      { mode: "runtime" },
      (database) => new PlatformUserPreferenceRepository(database)
        .updateActiveUserReportingCurrency({
          userId: scope.userId,
          reportingCurrency: value,
          updatedAtUtc: createCanonicalUtcTimestamp(),
        }),
    );
    revalidatePath("/account");
    revalidatePath("/workspace");
    return Object.freeze({ ok: true as const, reportingCurrency });
  } catch (error) {
    const invalid = isTraderLinkPlatformError(error) &&
      error.code === "TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED";
    return Object.freeze({
      ok: false as const,
      message: invalid
        ? "Choose one of the available reporting currencies."
        : "Your reporting currency could not be saved. Try again.",
    });
  }
}
