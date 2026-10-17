import { z } from "zod";
import { parseMembershipAmount } from "./platform-membership-pricing";
import { ensureJournalPlanFoundation } from "./membership-product-features";

// Drafts deliberately accept incomplete commercial settings. Publication validates
// readiness separately, so an unfinished provider connection never loses a draft.
const nullableCount = z.number().int().safe().nonnegative().nullable();
const text = z.string();
const period = z.object({ kind: z.enum(["calendar_month", "days", "lifetime"]), days: nullableCount });
const trial = z.object({
  id: text, name: text, enabled: z.boolean(), durationDays: nullableCount,
  price: text, paymentMethodRequired: z.boolean(),
  eligibility: z.enum(["once_per_campaign", "once_ever", "unlimited", "owner_only"]),
  capacity: nullableCount, startsAt: text, endsAt: text, checkoutUrl: text,
  endBehavior: z.enum(["end_access", "renew"]),
});
const discord = z.object({
  id: text, guildId: text, guildName: text, roleIds: z.array(text), roleNames: z.array(text),
  enabled: z.boolean(), access: z.enum(["automatic_grant", "eligible_to_purchase"]),
  funding: z.enum(["sponsored", "server_license", "member_paid"]),
  verificationSeconds: z.number().int().safe().positive(), startsAt: text, endsAt: text,
});
export const membershipPlanPriceSchema = z.object({
  id: text, name: text, enabled: z.boolean(), provider: text,
  channel: z.enum(["website", "discord", "both", "private"]),
  billing: z.enum(["free", "one_time", "recurring", "lifetime"]), currency: text,
  initialPrice: text, renewalPrice: text,
  interval: z.enum(["day", "week", "month", "year"]), intervalCount: nullableCount,
  accessDays: nullableCount, productRef: text, priceRef: text, checkoutUrl: text,
  trials: z.array(trial), discord: z.array(discord),
});
export const membershipPlanEditorSchema = z.object({
  schemaVersion: z.literal(1), planId: z.uuid().nullable(), baseRevision: text,
  name: text, description: text, internalNote: text,
  visibility: z.enum(["public", "private", "unlisted"]),
  displayOnly: z.boolean(),
  requiresDiscord: z.boolean().optional(),
  packageType: z.enum(["plan", "addon"]).default("plan"),
  bundleOfferIds: z.array(z.uuid()).default([]),
  features: z.array(z.object({ key: text, limit: nullableCount, resetDays: nullableCount,
    period: period.nullable(), brief: text.nullable(), details: text.nullable() })),
  prices: z.array(membershipPlanPriceSchema),
  privatePageIds: z.array(z.uuid()),
});
export type MembershipPlanEditor = z.infer<typeof membershipPlanEditorSchema>;
export type MembershipPlanPrice = z.infer<typeof membershipPlanPriceSchema>;
export type MembershipPlanTrial = MembershipPlanPrice["trials"][number];
export type MembershipPlanDiscord = MembershipPlanPrice["discord"][number];
export type MembershipPlanEditorFeature = MembershipPlanEditor["features"][number];
export type MembershipPlanSaveResult = { planId?: string; versionId?: string; offerIds?: string[]; error?: string; message?: string; draftId?: string; revision?: number };
export type MembershipPlanSaveRequest = { requestId: string; draftId: string | null; revision: number | null;
  document: MembershipPlanEditor; intent: "save" | "publish"; applyToMembers: boolean };
export type MembershipPlanListItem = {
  id: string; planId: string | null; draftId: string | null; draftRevision: number | null;
  name: string; visibility: MembershipPlanEditor["visibility"]; status: "draft" | "active" | "archived";
  packageType?: "plan" | "addon";
  draftName?: string; currentBaseRevision?: string;
  hasDraft: boolean; published: boolean; priceCount: number;
  legacyDraftRevision: string | null;
};
export type MembershipPlanDiscardTarget = { draftId: string; revision: number } | { planId: string; baseRevision: string };
export type MembershipPlanOpenResult = {
  document: MembershipPlanEditor; draftId: string | null; revision: number | null; memberCount: number;
};
export type MembershipPlanProvider = {
  key: string; label: string; mode: string; state: string;
  configured: boolean; missing: string[];
  privateTestCheckoutAllowed?: boolean;
};
export type MembershipPlanReadinessIssue = { path: string; message: string; blocking: boolean };
export type MembershipPlanFeatureChoice = { key: string; label: string; kind: "boolean" | "limit";
  module: string; enforcement: string; brief: string; details: string };

export function emptyMembershipPlan(): MembershipPlanEditor {
  return { schemaVersion: 1, planId: null, baseRevision: "", name: "", description: "",
    internalNote: "", visibility: "private", displayOnly: false, packageType: "plan", bundleOfferIds: [], features: ensureJournalPlanFoundation([]), prices: [], privatePageIds: [] };
}
export function newMembershipPlanPrice(id: string): MembershipPlanPrice {
  return { id, name: "", enabled: true, provider: "", channel: "website", billing: "free",
    currency: "USD", initialPrice: "", renewalPrice: "", interval: "month", intervalCount: 1,
    accessDays: null, productRef: "", priceRef: "", checkoutUrl: "", trials: [], discord: [] };
}
export function duplicateMembershipPlan(source: MembershipPlanEditor, makeId: () => string): MembershipPlanEditor {
  const copy = structuredClone(source);
  copy.planId = null; copy.baseRevision = ""; copy.name = `${source.name} copy`;
  // Preserve intended commercial configuration, but persistence is draft-only.
  // Keep page-placement selections as configuration. This does not copy URL
  // secrets or publish the new plan onto those pages before the owner publishes.
  for (const price of copy.prices) {
    price.id = makeId();
    for (const item of [...price.trials, ...price.discord]) item.id = makeId();
  }
  return copy;
}

export function membershipPriceRequiresProvider(price: MembershipPlanPrice): boolean {
  return price.billing !== "free" || price.trials.some(trial => trial.enabled && (Number(trial.price) > 0 || trial.paymentMethodRequired));
}

export function membershipPlanReadiness(plan: MembershipPlanEditor,
  providers: readonly MembershipPlanProvider[], features: readonly MembershipPlanFeatureChoice[]): MembershipPlanReadinessIssue[] {
  const issues: MembershipPlanReadinessIssue[] = [];
  const add = (path: string, message: string, blocking = true) => issues.push({ path, message, blocking });
  if (plan.packageType === "addon") for (const price of plan.prices.filter(price => price.enabled)) {
    if (price.billing !== "free" && !(price.billing === "recurring" && price.interval === "month" && price.intervalCount === 1)) add("packageType", "Add-ons use monthly or free access options.");
    if (price.trials.some(trial => trial.enabled)) add("packageType", "Add-on packages do not have separate trials.");
  }
  if (!plan.name.trim()) add("name", "Enter a plan name.");
  if (plan.name.trim().length > 120) add("name", "Use a plan name of 120 characters or fewer.");
  const selected = new Set<string>();
  if (plan.features.some(feature => feature.key === "journal.calendar") && !plan.features.some(feature => ["journal.calendar_month", "journal.calendar_week"].includes(feature.key))) {
    add("features.journal.calendar", "Choose at least one Trader Calendar view.");
  }
  for (const feature of plan.features) {
    const definition = features.find(item => item.key === feature.key);
    if (!definition) add(`features.${feature.key}`, "A selected feature is no longer available.");
    if (definition?.kind === "boolean" && feature.limit !== null) add(`features.${feature.key}`, "An on/off feature cannot contain a numeric allowance.");
    if (selected.has(feature.key)) add(`features.${feature.key}`, "A feature is selected more than once.");
    selected.add(feature.key);
    if (feature.resetDays !== null && feature.resetDays < 1) add(`features.${feature.key}`, "Reset periods must be at least one day.");
    if (feature.period?.kind === "days" && !feature.period.days) add(`features.${feature.key}`, "Enter the allowance period in days.");
    if (definition && definition.enforcement !== "enforced") add(`features.${feature.key}`,
      `${definition.label}: global membership enforcement is ${definition.enforcement}; plan selection alone does not restrict this feature.`, false);
  }
  const ids = new Set<string>();
  function unique(id: string, path: string) {
    if (!id || ids.has(id)) add(path, "A configuration identifier is missing or repeated. Reload the editor.");
    ids.add(id);
  }
  function dates(start: string, end: string, path: string) {
    if (start && !Number.isFinite(Date.parse(start))) add(path, "Enter a valid start date.");
    if (end && !Number.isFinite(Date.parse(end))) add(path, "Enter a valid end date.");
    if (start && end && Date.parse(end) <= Date.parse(start)) add(path, "The end date must be after the start date.");
  }
  function url(value: string, path: string) {
    if (!value) return;
    try { const parsed = new URL(value); if (parsed.protocol !== "https:" || parsed.username || parsed.password) throw new Error(); }
    catch { add(path, "Checkout links must use HTTPS without embedded credentials."); }
  }
  for (const price of plan.prices) {
    const path = `prices.${price.id}`; unique(price.id, path);
    for (const item of [...price.trials, ...price.discord]) unique(item.id, path);
    if (!price.enabled) continue;
    if (!price.name.trim()) add(path, "Name this price or access option.");
    const provider = providers.find(item => item.key === price.provider);
    if (membershipPriceRequiresProvider(price)) {
      if (!/^[A-Z]{3}$/.test(price.currency)) add(path, "Choose a three-letter currency.");
      if (price.billing !== "free" && !/^\d+(\.\d+)?$/.test(price.initialPrice)) add(path, "Enter the initial price.");
      else if (price.billing !== "free") {
        try { parseMembershipAmount(price.initialPrice, price.currency); }
        catch (error) { add(path, (error as Error).message); }
      }
      if (!provider) add(path, "Choose a payment provider.");
      else {
        if (provider.mode === "free") add(path, "Choose a paid provider for a paid option.");
        const privateStripeTest = provider.key === "stripe" && provider.mode === "native" &&
          provider.state === "test" && provider.privateTestCheckoutAllowed === true &&
          plan.visibility !== "public" && price.channel === "private";
        if ((!privateStripeTest && provider.state !== "ready") || !provider.configured) add(path,
          `${provider.label}: ${provider.missing.join("; ") || "connection is not ready for live checkout"}.`);
        if (price.billing !== "free" && provider.mode === "external_checkout" && !price.checkoutUrl) add(path, "Enter this option's checkout link.");
      }
    }
    if (price.billing === "recurring" && (!price.intervalCount || !/^\d+(\.\d+)?$/.test(price.renewalPrice))) add(path, "Enter the renewal price and billing interval.");
    if (price.billing === "recurring" && price.renewalPrice) {
      try { parseMembershipAmount(price.renewalPrice, price.currency); }
      catch (error) { add(path, (error as Error).message); }
    }
    if (price.accessDays !== null && price.accessDays < 1) add(path, "Access duration must be at least one day.");
    if (price.accessDays !== null && !["free", "one_time"].includes(price.billing)) add(path, "Lifetime access has no expiry; recurring access follows its billing period. Clear the separate access duration.");
    url(price.checkoutUrl, path);
    for (const trial of price.trials.filter(item => item.enabled)) {
      const tp = `${path}.trials.${trial.id}`;
      if (!trial.name.trim() || !trial.durationDays) add(tp, "Enter the trial name and duration.");
      if (trial.price && !/^\d+(\.\d+)?$/.test(trial.price)) add(tp, "Enter a valid trial price, or zero for free.");
      else if (trial.price) {
        try { parseMembershipAmount(trial.price, price.currency); }
        catch (error) { add(tp, (error as Error).message); }
      }
      if (trial.capacity !== null && trial.capacity < 1) add(tp, "Trial capacity must be positive or unlimited.");
      if (trial.endBehavior === "renew" && price.billing !== "recurring") add(tp, "Automatic renewal needs a recurring price option.");
      if ((Number(trial.price) > 0 || trial.paymentMethodRequired || trial.endBehavior === "renew") && provider?.key !== "stripe" && !trial.checkoutUrl) add(tp, "Connect the trial's checkout link.");
      url(trial.checkoutUrl, tp); dates(trial.startsAt, trial.endsAt, tp);
    }
    for (const rule of price.discord.filter(item => item.enabled)) {
      const dp = `${path}.discord.${rule.id}`;
      if (!/^\d{1,32}$/.test(rule.guildId) || rule.roleIds.some(role => !/^\d{1,32}$/.test(role))) add(dp, "Select a Discord server and valid roles.");
      dates(rule.startsAt, rule.endsAt, dp);
    }
  }
  if (!plan.displayOnly && !plan.prices.some(price => price.enabled)) add("prices", "Add an access option, or select display-only publishing.");
  if (plan.visibility === "public" && !plan.displayOnly && !plan.prices.some(price => price.enabled && ["website", "both"].includes(price.channel))) add("prices", "Add a public website option, or select display-only publishing.");
  // A deliberately display-only plan can retain unfinished checkout configuration;
  // none of those price options may be projected into purchasable offers.
  return plan.displayOnly ? issues.map(issue => issue.path.startsWith("prices.")
    && !issue.message.includes("identifier") ? { ...issue, blocking: false } : issue) : issues;
}
