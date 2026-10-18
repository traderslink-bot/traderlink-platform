"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { duplicateMembershipPlan, type MembershipPlanOpenResult, type MembershipPlanDiscardTarget } from "@/src/modules/platform/contracts/membership-plan-editor";
import { withJournalAdminDatabase } from "@/src/modules/platform/server/administration/platform-admin-authorization";
import { createCanonicalUuidV4 } from "@/src/modules/platform/server/database/platform-migration-contract";
import { MembershipEditorConflict, MembershipPlanEditorDrafts } from "@/src/modules/platform/server/membership/membership-plan-editor-drafts";
import { readMembershipPlanMemberImpact } from "@/src/modules/platform/server/membership/membership-plan-editor-members";
import { writeMembershipPlanEditor } from "@/src/modules/platform/server/membership/membership-plan-editor-write";
import { archiveMembershipPlan, deleteMembershipPlan } from "@/src/modules/platform/server/membership/membership-plan-editor-archive";
import type { MembershipPlanSaveRequest, MembershipPlanSaveResult } from "@/src/modules/platform/contracts/membership-plan-editor";

function safeError(error: unknown): string {
  return error instanceof MembershipEditorConflict ? error.message : "The plan could not be updated. Check your owner access and try again.";
}

export async function saveUnifiedPlanAction(request: MembershipPlanSaveRequest): Promise<MembershipPlanSaveResult> {
  try {
    const requestHeaders = await headers();
    const result = withJournalAdminDatabase(requestHeaders, (db, scope) =>
      writeMembershipPlanEditor(db, scope.userId, request, new Date().toISOString()));
    revalidatePath("/admin/journal/memberships");
    revalidatePath("/plans", "layout");
    return result;
  } catch (error) { return { error: safeError(error) }; }
}

export async function archiveUnifiedPlanAction(planId: string): Promise<{ error?: string }> {
  try {
    const requestHeaders = await headers();
    withJournalAdminDatabase(requestHeaders, (db, scope) => archiveMembershipPlan(db, scope.userId, planId, new Date().toISOString()));
    revalidatePath("/admin/journal/memberships");
    revalidatePath("/plans", "layout");
    return {};
  } catch (error) { return { error: safeError(error) }; }
}

export async function deleteUnifiedPlanAction(planId: string): Promise<{ error?: string }> {
  try {
    const requestHeaders = await headers();
    withJournalAdminDatabase(requestHeaders, (db, scope) => deleteMembershipPlan(db, scope.userId, planId, new Date().toISOString()));
    revalidatePath("/admin/journal/memberships");
    revalidatePath("/plans", "layout");
    return {};
  } catch (error) { return { error: safeError(error) }; }
}

export async function refreshUnifiedPlanBaselineAction(draftId: string, revision: number, expectedBaseRevision: string): Promise<{ error?: string }> {
  try {
    z.uuid().parse(draftId); z.number().int().positive().parse(revision); z.string().regex(/^[a-f0-9]{64}$/).parse(expectedBaseRevision);
    const requestHeaders = await headers();
    withJournalAdminDatabase(requestHeaders, (db, scope) => new MembershipPlanEditorDrafts(db).refreshBaseline(scope.userId, draftId, revision, expectedBaseRevision, new Date().toISOString()));
    revalidatePath("/admin/journal/memberships");
    return {};
  } catch (error) { return { error: safeError(error) }; }
}

/** Read only: neither opening nor duplicating creates a saved row. */
export async function openUnifiedPlanAction(itemId: string, intent: "edit" | "duplicate", requestId: string): Promise<
  { value: MembershipPlanOpenResult; error?: never } | { error: string; value?: never }
> {
  try {
    const requestHeaders = await headers();
    const value = withJournalAdminDatabase(requestHeaders, (db, scope) => {
      z.uuid().parse(itemId); z.uuid().parse(requestId); z.enum(["edit", "duplicate"]).parse(intent);
      const at = new Date().toISOString();
      const store = new MembershipPlanEditorDrafts(db);
      const isDraft = Boolean(db.prepare("SELECT 1 FROM platform_membership_editor_drafts WHERE draft_id=? AND status='editing'").get(itemId));
      const opened = isDraft ? store.read(itemId) : store.open(scope.userId, itemId, at);
      if (intent === "duplicate") return { document: duplicateMembershipPlan(opened.document, createCanonicalUuidV4), draftId: null, revision: null, memberCount: 0 };
      return { ...opened, memberCount: opened.document.planId ? readMembershipPlanMemberImpact(db, opened.document.planId, at).memberCount : 0 };
    });
    return { value };
  } catch (error) { return { error: safeError(error) }; }
}

export async function discardUnifiedPlanDraftAction(target: MembershipPlanDiscardTarget): Promise<{ error?: string }> {
  try {
    const requestHeaders = await headers();
    withJournalAdminDatabase(requestHeaders, (db, scope) => {
      const parsed = z.union([z.object({ draftId: z.uuid(), revision: z.number().int().positive() }).strict(),
        z.object({ planId: z.uuid(), baseRevision: z.string().regex(/^[a-f0-9]{64}$/) }).strict()]).parse(target);
      const store = new MembershipPlanEditorDrafts(db); const at = new Date().toISOString();
      if ("draftId" in parsed) store.discard(scope.userId, parsed.draftId, parsed.revision, at);
      else store.discardLegacy(scope.userId, parsed.planId, parsed.baseRevision, at);
    });
    revalidatePath("/admin/journal/memberships");
    return {};
  } catch (error) { return { error: safeError(error) }; }
}
