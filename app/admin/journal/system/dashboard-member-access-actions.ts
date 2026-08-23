"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { PlatformDashboardMemberAccessRepository } from "@/src/modules/platform/server/authentication/platform-dashboard-member-access-repository";
import { withJournalAdminDatabase } from "@/src/modules/platform/server/administration/platform-admin-authorization";
import { isTraderLinkPlatformError } from "@/src/modules/platform/server/database/platform-migration-contract";

type ActionResult = Readonly<{ ok: true }> | Readonly<{ ok: false; message: string }>;

export async function saveDashboardMemberAccess(input: Readonly<{
  allowAllDiscordMembers: unknown;
}>): Promise<ActionResult> {
  try {
    const allowAllDiscordMembers = input.allowAllDiscordMembers;
    if (typeof allowAllDiscordMembers !== "boolean") {
      throw new Error("invalid_allowAllDiscordMembers");
    }
    withJournalAdminDatabase(await headers(), (database, scope) =>
      new PlatformDashboardMemberAccessRepository(database).save({
        actorUserId: scope.userId,
        allowAllDiscordMembers,
      }));
    revalidatePath("/admin/journal/system");
    return Object.freeze({ ok: true as const });
  } catch (error) {
    const invalid = error instanceof Error && error.message.startsWith("invalid_") ||
      isTraderLinkPlatformError(error) &&
        error.code === "TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED";
    return Object.freeze({
      ok: false as const,
      message: invalid
        ? "Choose whether free dashboard access is on or off before saving."
        : "Dashboard member access could not be saved right now. Try again later.",
    });
  }
}
