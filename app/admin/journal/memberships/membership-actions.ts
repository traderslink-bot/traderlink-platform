"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

import { membershipFeaturesFromForm } from "@/src/modules/platform/server/membership/platform-membership-features";
import { createJournalAdminReadContext, resolveJournalAdminInternalId } from "@/src/modules/journal/server/administration/journal-admin-read-helpers";
import type { MembershipActionState } from "./membership-form";
import { PlatformMembershipManagement } from "@/src/modules/platform/server/membership/platform-membership-management";
import { ZodError } from "zod";
import { setMembershipStripeCancellation } from "@/src/modules/platform/server/membership/platform-membership-stripe";
import { createCanonicalUuidV4 } from "@/src/modules/platform/server/database/platform-migration-contract";
import { withJournalAdminDatabase } from
  "@/src/modules/platform/server/administration/platform-admin-authorization";
import { PlatformMembershipRepository } from
  "@/src/modules/platform/server/membership/platform-membership-repository";
import { PlatformMembershipCatalogRepository } from
  "@/src/modules/platform/server/membership/platform-membership-catalog-repository";

export type CreatePrivatePlanLinkState = Readonly<{
  url: string | null;
  error: string | null;
}>;

function required(formData: FormData, name: string): string {
  const value = formData.get(name);
  if (typeof value !== "string" || !value.trim()) throw new Error(`Missing ${name}`);
  return value.trim();
}

export async function manageMembershipAction(_previous: MembershipActionState, form: FormData): Promise<MembershipActionState> {
  try {
    const requestHeaders = await headers();
    const success = withJournalAdminDatabase(requestHeaders, (database, scope) => {
      if (["grant", "check_feature_access"].includes(String(form.get("operation"))) && form.has("userRef")) {
        const context = createJournalAdminReadContext({ database, scope });
        const member = resolveJournalAdminInternalId(context, required(form, "userRef"), ["user"]);
        form.set("userId", member.internalId);
      }
      return new PlatformMembershipManagement(database).execute(scope.userId, form);
    });
    revalidatePath("/admin/journal/memberships");
    revalidatePath("/plans");
    return { error: null, success };
  } catch (error) {
    if (error instanceof ZodError) return { error: "Check required fields, dates and numbers, then try again.", success: null };
    const message = error instanceof Error ? error.message : "";
    // Never return SQL text, auth internals or private database details to a form.
    return { success: null, error: /^(Choose |Enter |Paid offers|Recurring offers|A free offer|Checkout must|Publish |A paid trial|That membership|A selected)/.test(message)
      ? message : message.includes("UNIQUE") ? "That record already exists. Use a different key."
      : "The change could not be saved. Check the fields and your owner access, then try again." };
  }
}
export async function manageStripeSubscriptionAction(_previous: MembershipActionState, form: FormData): Promise<MembershipActionState> {
  try {
    const requestHeaders = await headers();
    const subscription = withJournalAdminDatabase(requestHeaders, (database) => database.prepare(`SELECT external_subscription_ref
      FROM platform_membership_provider_subscriptions WHERE provider_subscription_id=? AND provider='stripe'`)
      .get(required(form, "subscriptionId"))) as { external_subscription_ref: string } | undefined;
    if (!subscription) return { error: "That Stripe subscription was not found.", success: null };
    const choice = required(form, "cancellation");
    if (!["cancel", "renew"].includes(choice)) return { error: "Choose a renewal setting.", success: null };
    await setMembershipStripeCancellation(subscription.external_subscription_ref, choice === "cancel");
    withJournalAdminDatabase(requestHeaders, (database, scope) => database.prepare(`INSERT INTO platform_membership_audit_events
      (audit_event_id,actor_user_id,action,target_type,target_id,safe_details_json,occurred_at_utc)
      VALUES (?,?,?,'subscription',?,?,?)`).run(createCanonicalUuidV4(), scope.userId,
        "stripe_renewal_requested", required(form, "subscriptionId"), JSON.stringify({ renewal: choice }), new Date().toISOString()));
    return { error: null, success: "Stripe accepted the renewal setting. Membership status updates when its confirmation arrives." };
  } catch {
    return { error: "Stripe could not update the subscription. Check the connection and try again.", success: null };
  }
}

export async function createMembershipPlanAction(_previous: MembershipActionState, formData: FormData): Promise<MembershipActionState> {
  try {
  const requestHeaders = await headers();
  withJournalAdminDatabase(requestHeaders, (database, scope) => {
    const repository = new PlatformMembershipRepository(database);
    repository.synchronizeBuiltInFeatures(scope.userId);
    const features = membershipFeaturesFromForm(database, formData);
    repository.createPlan({
      actorUserId: scope.userId,
      planKey: required(formData, "planKey"),
      name: required(formData, "name"),
      internalNote: String(formData.get("internalNote") ?? ""),
      visibility: required(formData, "visibility") as "public" | "private" | "unlisted",
      publicDescription: String(formData.get("publicDescription") ?? ""),
      features,
    });
  });
    revalidatePath("/admin/journal/memberships");
    return { error: null, success: "Draft created. Open Plans in Memberships to edit or publish it." };
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    return { error: message.includes("UNIQUE") ? "That plan key is already in use. Choose another key."
      : message.startsWith("Enter ") || message.startsWith("A selected") || message.startsWith("Missing ") ? message
      : "The draft could not be saved. Check the plan key, visibility and feature limits, then try again.", success: null };
  }
}

export async function createPrivatePlanLinkAction(
  _previous: CreatePrivatePlanLinkState,
  formData: FormData,
): Promise<CreatePrivatePlanLinkState> {
  try {
    const requestHeaders = await headers();
    const result = withJournalAdminDatabase(requestHeaders, (database, scope) =>
      new PlatformMembershipCatalogRepository(database).createShareLink({
        actorUserId: scope.userId,
        name: required(formData, "name"),
        audienceNote: String(formData.get("audienceNote") ?? ""),
        offerIds: formData.getAll("offerIds").filter(
          (value): value is string => typeof value === "string",
        ),
        expiresAtUtc: String(formData.get("expiresAtUtc") ?? "").trim() || null,
        maximumClaims: String(formData.get("maximumClaims") ?? "").trim()
          ? Number(formData.get("maximumClaims"))
          : null,
      }));
    revalidatePath("/admin/journal/memberships");
    return Object.freeze({ url: `/plans/invite/${result.secret}`, error: null });
  } catch {
    return Object.freeze({ url: null, error: "The private link could not be created. Check the offers, expiry and claim limit." });
  }
}
