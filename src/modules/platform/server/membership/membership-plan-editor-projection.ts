import type Database from "better-sqlite3";
import { membershipPlanEditorSchema, membershipPlanReadiness, type MembershipPlanEditor } from "../../contracts/membership-plan-editor";
import { parseMembershipAmount } from "../../contracts/platform-membership-pricing";
import { derivedMembershipPlanNotificationKeys, isMembershipPlanSelectableFeature } from "../../contracts/membership-plan-notifications";
import { assertCanonicalUuidV4, createCanonicalUuidV4 } from "../database/platform-migration-contract";
import { MembershipEditorConflict } from "./membership-plan-editor-drafts";
import { readMembershipEditorChoices, readMembershipPlanEditor } from "./membership-plan-editor-read";
import { isMembershipProductSetting, storedMembershipProductFeatures } from "../../contracts/membership-product-features";

export type MembershipPlanPublicationProjection = ReturnType<typeof prepareMembershipPlanPublication>;

/** Read-only preparation. Call inside the final write transaction so readiness and
 * the optimistic revision are checked against the same snapshot as publication.
 * No provider calls, claims, grants or notifications are performed here. */
export function prepareMembershipPlanPublication(db: Database.Database, input: unknown) {
  const document = membershipPlanEditorSchema.parse(input);
  const choices = readMembershipEditorChoices(db);
  const issues = membershipPlanReadiness(document, choices.providers, choices.features).filter(issue => issue.blocking);
  if (issues.length) throw new MembershipEditorConflict(issues.map(issue => issue.message).join(" "));
  if (document.planId) {
    const current = readMembershipPlanEditor(db, document.planId);
    if (current.baseRevision !== document.baseRevision) throw new MembershipEditorConflict("The published plan changed after this editor was opened. Close the editor and select Refresh draft for publishing to keep your saved edits, then review and publish them. If there is no saved draft, reopen the plan.");
  } else if (document.baseRevision) throw new MembershipEditorConflict("The new plan contains an existing revision. Reopen it before publishing.");
  const allowedPages = new Set(choices.pages.map(page => page.id));
  if (new Set(document.privatePageIds).size !== document.privatePageIds.length || document.privatePageIds.some(id => !allowedPages.has(id))) {
    throw new MembershipEditorConflict("A selected private page is no longer available. Refresh the page selection.");
  }

  const planId = document.planId ?? createCanonicalUuidV4();
  const versionId = createCanonicalUuidV4();
  const published = structuredClone(document);
  published.planId = planId;
  const definitions = new Map(choices.features.map(feature => [feature.key, feature]));
  published.features = storedMembershipProductFeatures(document.features, document.packageType).filter(feature => isMembershipPlanSelectableFeature(feature.key) || isMembershipProductSetting(feature.key));
  const automatic = [
    ...(published.features.some(feature => feature.key === "journal.access") ? ["journal.manual_entry"] : []),
    ...(published.features.some(feature => feature.key === "analytics.compare_trades") ? ["analytics.trade_explorer"] : []),
    ...(published.features.some(feature => !["academy.access", "coaching.access", "community.access"].includes(feature.key)) ? ["dashboard.access"] : []),
    ...derivedMembershipPlanNotificationKeys(published.features),
  ];
  const features = [
    ...published.features.map(feature => ({ ...feature, kind: definitions.get(feature.key)!.kind })),
    ...[...new Set(automatic)].filter(key => !published.features.some(feature => feature.key === key)).map(key => ({ key, kind: "boolean" as const,
      limit: null, resetDays: null, period: null, brief: null, details: null })),
  ];
  const dates = (value: string) => value ? new Date(value).toISOString() : null;
  const prices = document.displayOnly ? [] : published.prices.filter(price => price.enabled).map(price => {
    const sourceId = price.id;
    price.id = createCanonicalUuidV4();
    const free = price.billing === "free";
    const paidTrial = price.trials.some(trial => trial.enabled && (Number(trial.price) > 0 || trial.paymentMethodRequired));
    const currency = free && !paidTrial ? null : price.currency;
    const trials = price.trials.filter(trial => trial.enabled).map(trial => {
      const sourceTrialId = trial.id;
      trial.id = createCanonicalUuidV4();
      return { id: trial.id, sourceId: sourceTrialId, name: trial.name.trim(), durationDays: trial.durationDays!,
        amount: currency && trial.price ? parseMembershipAmount(trial.price, currency) : 0,
        paymentMethodRequired: trial.paymentMethodRequired, eligibility: trial.eligibility, capacity: trial.capacity,
        startsAt: dates(trial.startsAt), endsAt: dates(trial.endsAt), checkoutUrl: trial.checkoutUrl || null,
        endBehavior: trial.endBehavior };
    });
    const discord = price.discord.filter(rule => rule.enabled).map(rule => {
      const sourceRuleId = rule.id;
      rule.id = createCanonicalUuidV4();
      return { ...rule, sourceId: sourceRuleId, startsAt: dates(rule.startsAt), endsAt: dates(rule.endsAt) };
    });
    return { id: price.id, sourceId, name: price.name.trim(), provider: free && !paidTrial ? "free" : price.provider,
      channel: price.channel, billing: price.billing, currency,
      initialAmount: currency ? free ? 0 : parseMembershipAmount(price.initialPrice, currency) : null,
      renewalAmount: currency && price.billing === "recurring" ? parseMembershipAmount(price.renewalPrice, currency) : null,
      interval: price.billing === "recurring" ? price.interval : null,
      intervalCount: price.billing === "recurring" ? price.intervalCount : null,
      accessDays: price.accessDays, productRef: price.productRef || null, priceRef: price.priceRef || null,
      checkoutUrl: price.checkoutUrl || null, trials, discord };
  });
  // Existing source IDs are merely lineage hints. They must belong to this plan;
  // otherwise a crafted request could inherit another plan's trials or audience.
  for (const price of prices) {
    assertSourcePlan(db, "offer", price.sourceId, document.planId);
    for (const trial of price.trials) assertSourcePlan(db, "trial", trial.sourceId, document.planId);
    for (const rule of price.discord) assertSourcePlan(db, "discord", rule.sourceId, document.planId);
  }
  published.name = published.name.trim();
  return { planId, versionId, document: published, features, prices };
}

function assertSourcePlan(db: Database.Database, kind: "offer" | "trial" | "discord", sourceId: string, planId: MembershipPlanEditor["planId"]) {
  assertCanonicalUuidV4(sourceId, "configurationId");
  const joins = kind === "offer" ? "platform_membership_offers o" : kind === "trial"
    ? "platform_membership_trial_campaigns s JOIN platform_membership_offers o ON o.offer_id=s.offer_id"
    : "platform_membership_discord_offer_rules s JOIN platform_membership_offers o ON o.offer_id=s.offer_id";
  const column = kind === "offer" ? "o.offer_id" : kind === "trial" ? "s.trial_campaign_id" : "s.discord_offer_rule_id";
  const source = db.prepare(`SELECT v.plan_id FROM ${joins} JOIN platform_membership_plan_versions v ON v.plan_version_id=o.plan_version_id WHERE ${column}=?`)
    .get(sourceId) as { plan_id: string } | undefined;
  if (source && source.plan_id !== planId) throw new MembershipEditorConflict("A price or access option belongs to another plan. Duplicate the plan to create separate options.");
}
