"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { withJournalAdminDatabase } from "@/src/modules/platform/server/administration/platform-admin-authorization";
import { SharedAnalyzerAdministrationRepository } from "@/src/modules/level-analysis/server/shared-analyzer-administration-repository";

type Result = Readonly<{ ok: boolean; message?: string }>;
const number = (value: FormDataEntryValue | null): number => {
  const parsed = Number(value); if (!Number.isSafeInteger(parsed) || parsed < 0) throw new Error("invalid"); return parsed;
};

export async function saveAnalyzerSettings(form: FormData): Promise<Result> {
  try {
    const [userId, workspaceId, accountId] = String(form.get("connection") ?? "").split(":");
    withJournalAdminDatabase(await headers(), (database, scope) =>
      new SharedAnalyzerAdministrationRepository(database, scope).saveSettings({
        enabled: form.get("enabled") === "on", dailyLimit: number(form.get("dailyLimit")),
        periodLimit: number(form.get("periodLimit")), globalLimit: number(form.get("globalLimit")),
        spacingSeconds: number(form.get("spacingSeconds")), designatedUserId: userId ?? "",
        designatedWorkspaceId: workspaceId ?? "", designatedAccountId: accountId ?? "",
      }));
    revalidatePath("/admin/journal/analyzer"); return { ok: true };
  } catch { return { ok: false, message: "Trade Analyzer settings could not be saved." }; }
}

export async function saveAnalyzerOverride(form: FormData): Promise<Result> {
  try {
    const optional = (name: string) => String(form.get(name) ?? "").trim() === "" ? null : number(form.get(name));
    withJournalAdminDatabase(await headers(), (database, scope) =>
      new SharedAnalyzerAdministrationRepository(database, scope).saveOverride(
        String(form.get("userId") ?? ""), optional("dailyLimit"), optional("periodLimit"),
      ));
    revalidatePath("/admin/journal/analyzer"); return { ok: true };
  } catch { return { ok: false, message: "User allowance could not be saved." }; }
}

export async function resetAnalyzerUsage(form: FormData): Promise<Result> {
  try {
    const kind = form.get("kind") === "period" ? "period" : "daily";
    withJournalAdminDatabase(await headers(), (database, scope) =>
      new SharedAnalyzerAdministrationRepository(database, scope).reset(String(form.get("userId") ?? ""), kind));
    revalidatePath("/admin/journal/analyzer"); return { ok: true };
  } catch { return { ok: false, message: "User usage could not be reset." }; }
}
