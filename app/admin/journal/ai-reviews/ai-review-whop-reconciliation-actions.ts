"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { requireJournalAdminScope } from
  "@/src/modules/platform/server/administration/platform-admin-authorization";
import { loadWhopAiReviewReconciliationConfiguration } from
  "@/src/modules/platform/server/billing/whop-ai-review-configuration";
import { WhopAiReviewReconciliationService } from
  "@/src/modules/platform/server/billing/whop-ai-review-reconciliation";
import { openPlatformDatabase } from
  "@/src/modules/platform/server/database/open-platform-database";

export type ReconcileWhopAiReviewAccessResult = Readonly<{
  ok: boolean;
  message: string;
}>;

export async function reconcileWhopAiReviewAccess():
Promise<ReconcileWhopAiReviewAccessResult> {
  try {
    requireJournalAdminScope(await headers());
    const configuration = loadWhopAiReviewReconciliationConfiguration();
    const database = openPlatformDatabase({ mode: "runtime" });
    let result;
    try {
      result = await new WhopAiReviewReconciliationService({
        database,
        configuration,
      }).run();
    } finally {
      database.close();
    }
    revalidatePath("/admin/journal/ai-reviews");
    return Object.freeze({
      ok: true,
      message: `Whop access was checked. ${result.appliedCount} update${result.appliedCount === 1 ? "" : "s"} applied, ${result.conflictCount} conflict${result.conflictCount === 1 ? "" : "s"} found.`,
    });
  } catch (error) {
    const inProgress = error instanceof Error &&
      error.message === "TRADERLINK_WHOP_RECONCILIATION_IN_PROGRESS";
    return Object.freeze({
      ok: false,
      message: inProgress
        ? "A Whop access check is already running."
        : "Whop access could not be checked. Stored access was preserved; review the latest run status before trying again.",
    });
  }
}
