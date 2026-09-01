"use server";

import { revalidatePath } from "next/cache";

import { requireTraderLinkPlatformPageScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import {
  createCanonicalUtcTimestamp,
  isTraderLinkPlatformError,
} from "@/src/modules/platform/server/database/platform-migration-contract";
import { PlatformUserPreferenceRepository } from "@/src/modules/platform/server/identity/platform-user-preference-repository";

export async function savePnlReportingBasis(
  value: unknown,
): Promise<Readonly<{ ok: true; pnlReportingBasis: "gross" | "net" }> | Readonly<{ ok: false; message: string }>> {
  try {
    const scope = await requireTraderLinkPlatformPageScope();
    const pnlReportingBasis = withPlatformDatabase(
      { mode: "runtime" },
      (database) => new PlatformUserPreferenceRepository(database)
        .updateActiveUserPnlReportingBasis({
          userId: scope.userId,
          pnlReportingBasis: value,
          updatedAtUtc: createCanonicalUtcTimestamp(),
        }),
    );
    revalidatePath("/account/trading");
    revalidatePath("/workspace");
    return Object.freeze({ ok: true as const, pnlReportingBasis });
  } catch (error) {
    const invalid = isTraderLinkPlatformError(error) &&
      error.code === "TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED";
    return Object.freeze({
      ok: false as const,
      message: invalid
        ? "Choose one of the available P/L options."
        : "Your P/L preference could not be saved. Try again.",
    });
  }
}
