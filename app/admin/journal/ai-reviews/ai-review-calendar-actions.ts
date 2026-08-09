"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { CoachUsEquitiesCalendarVerificationService } from
  "@/src/modules/coach/server/market-calendar/coach-us-equities-calendar-verification-service";
import { requireJournalAdminScope } from
  "@/src/modules/platform/server/administration/platform-admin-authorization";
import { openPlatformDatabase } from
  "@/src/modules/platform/server/database/open-platform-database";

export type VerifyAiReviewCalendarResult = Readonly<{
  ok: boolean;
  message: string;
}>;

export async function verifyAiReviewCalendarNow(): Promise<VerifyAiReviewCalendarResult> {
  try {
    requireJournalAdminScope(await headers());
    const database = openPlatformDatabase({ mode: "runtime" });
    let result;
    try {
      result = await new CoachUsEquitiesCalendarVerificationService(database).run(
        new Date(),
        { force: true },
      );
    } finally {
      database.close();
    }
    revalidatePath("/admin/journal/ai-reviews");
    return Object.freeze({
      ok: result.state === "checked" && result.status === "verified",
      message: result.state === "checked" && result.status === "verified"
        ? `The ${result.targetYear} market calendar was verified and saved.`
        : `The ${result.targetYear} market calendar was not accepted (${result.resultCode ?? "source unavailable"}). The existing verified calendar was preserved.`,
    });
  } catch {
    return Object.freeze({
      ok: false,
      message: "Calendar verification could not finish. The existing verified calendar was preserved.",
    });
  }
}
