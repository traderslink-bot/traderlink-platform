import { createHash } from "node:crypto";
import type Database from "better-sqlite3";
import { currencyDecimals } from "../../contracts/platform-membership-pricing";
import { emptyMembershipPlan, membershipPlanEditorSchema, type MembershipPlanEditor,
  type MembershipPlanFeatureChoice, type MembershipPlanProvider, type MembershipPlanListItem } from "../../contracts/membership-plan-editor";
import { readMembershipFeatures } from "./platform-membership-features";
import { readMembershipFeatureCopy, defaultMembershipFeatureCopy } from "./membership-feature-copy";
import { membershipPrivateStripeTestCheckoutAllowed, membershipWhopConfiguration } from "./platform-membership-provider-readiness";
import { readMembershipTrialEndBehavior } from "./membership-trial-terms";
import { isMembershipPlanSelectableFeature } from "../../contracts/membership-plan-notifications";
import { ensureJournalPlanFoundation, isMembershipProductSetting, membershipFeatureDefaultEnforcement, newMembershipProductFeature } from "../../contracts/membership-product-features";
import { orderMembershipFeatures } from "../../contracts/membership-plan-feature-order";

function table(db: Database.Database, name: string) {
  return Boolean(db.prepare("SELECT 1 FROM sqlite_schema WHERE type='table' AND name=?").get(name));
}
export function readMembershipEditorChoices(db: Database.Database) {
  const policies = new Map((db.prepare("SELECT feature_key,enforcement_mode FROM platform_membership_feature_policies").all() as
    { feature_key: string; enforcement_mode: string }[]).map(row => [row.feature_key, row.enforcement_mode]));
  const copy = readMembershipFeatureCopy(db);
  const features: MembershipPlanFeatureChoice[] = readMembershipFeatures(db).map(feature => ({ ...feature,
    label: feature.key === "notifications.market_halt" ? "Market halts" : feature.label,
    enforcement: policies.get(feature.key) ?? membershipFeatureDefaultEnforcement(feature.key), ...(copy.get(feature.key) ?? defaultMembershipFeatureCopy(feature.key, feature.label)) }));
  const whop = membershipWhopConfiguration();
  const providers: MembershipPlanProvider[] = (db.prepare("SELECT provider_key,label,integration_mode,configuration_state FROM platform_membership_provider_definitions ORDER BY label").all() as
    { provider_key: string; label: string; integration_mode: string; configuration_state: string }[]).map(row => {
    const missing: string[] = [];
    if (row.provider_key === "stripe") {
      if (!process.env.STRIPE_SECRET_KEY) missing.push("checkout connection missing");
      if (!process.env.STRIPE_MEMBERSHIP_WEBHOOK_SECRET) missing.push("payment confirmation connection missing");
    } else if (row.provider_key === "whop") {
      if (!whop.webhook) missing.push("payment confirmation connection missing");
      if (!whop.renewalApi) missing.push("renewal connection missing");
      if (!whop.identity) missing.push("member identity mapping missing");
    } else if (row.integration_mode === "native") missing.push("native integration is not verified");
    return { key: row.provider_key, label: row.label, mode: row.integration_mode,
      state: row.configuration_state, configured: !missing.length, missing,
      privateTestCheckoutAllowed: row.provider_key === "stripe" && membershipPrivateStripeTestCheckoutAllowed() };
  });
  const pages = db.prepare("SELECT share_link_id id,name FROM platform_membership_share_links WHERE status='active' ORDER BY name").all() as { id: string; name: string }[];
  return { features, providers, pages };
}

export function membershipEditorRevision(document: MembershipPlanEditor): string {
  return createHash("sha256").update(JSON.stringify({ ...document, baseRevision: "" })).digest("hex");
}

/** One row per plan, plus independent new-plan drafts. Versions stay out of the list. */
export function readMembershipPlanList(db: Database.Database): MembershipPlanListItem[] {
  const plans = db.prepare(`SELECT p.plan_id,p.name,p.visibility,p.status,
    EXISTS(SELECT 1 FROM platform_membership_plan_versions v WHERE v.plan_id=p.plan_id AND v.published_at_utc IS NOT NULL) published,
    (SELECT COUNT(*) FROM platform_membership_offers o JOIN platform_membership_plan_versions v
      ON v.plan_version_id=o.plan_version_id WHERE v.plan_id=p.plan_id AND o.status='active') price_count
    FROM platform_membership_plans p WHERE NOT EXISTS (SELECT 1 FROM platform_membership_audit_events a
      WHERE ((a.action='plan_editor.legacy_draft_deleted' AND a.target_type='plan_editor') OR (a.action='plan_editor.deleted' AND a.target_type='plan')) AND a.target_id=p.plan_id)
    AND NOT EXISTS (SELECT 1 FROM platform_membership_plan_versions v JOIN platform_membership_plan_presentations s USING(plan_version_id)
      WHERE v.plan_id=p.plan_id AND json_array_length(s.document_json,'$.bundleOfferIds')>0)
    ORDER BY p.name,p.plan_id`).all() as {
      plan_id: string; name: string; visibility: MembershipPlanEditor["visibility"]; status: "draft" | "active" | "retired";
      published: number; price_count: number;
    }[];
  const drafts = db.prepare(`SELECT draft_id,plan_id,document_json,revision FROM platform_membership_editor_drafts
    WHERE status='editing' ORDER BY updated_at_utc DESC,draft_id`).all() as {
      draft_id: string; plan_id: string | null; document_json: string; revision: number;
    }[];
  const linked = new Map(drafts.filter(d => d.plan_id).map(d => [d.plan_id, d]));
  const rows: MembershipPlanListItem[] = plans.map(plan => {
    const draft = linked.get(plan.plan_id);
    const document = draft ? membershipPlanEditorSchema.parse(JSON.parse(draft.document_json)) : null;
    const currentBaseRevision = document && plan.published ? readMembershipPlanEditor(db, plan.plan_id).baseRevision : undefined;
    return { id: plan.plan_id, planId: plan.plan_id, draftId: draft?.draft_id ?? null, draftRevision: draft?.revision ?? null,
      packageType: document?.packageType ?? (db.prepare("SELECT json_extract(s.document_json,'$.packageType') type FROM platform_membership_plan_presentations s JOIN platform_membership_plan_versions v USING(plan_version_id) WHERE v.plan_id=? ORDER BY v.version_number DESC LIMIT 1").get(plan.plan_id) as { type: "plan" | "addon" | null } | undefined)?.type ?? "plan",
      currentBaseRevision: document && document.baseRevision !== currentBaseRevision ? currentBaseRevision : undefined,
      name: plan.published ? plan.name : document?.name ?? plan.name, draftName: plan.published ? document?.name : undefined, visibility: plan.published ? plan.visibility : document?.visibility ?? plan.visibility, status: plan.status === "retired" ? "archived" : plan.status,
      hasDraft: Boolean(draft) || !plan.published, published: Boolean(plan.published), priceCount: document?.prices.filter(p => p.enabled).length ?? plan.price_count,
      legacyDraftRevision: !plan.published && !draft ? readMembershipPlanEditor(db, plan.plan_id).baseRevision : null };
  });
  for (const draft of drafts.filter(d => !d.plan_id)) {
    const document = membershipPlanEditorSchema.parse(JSON.parse(draft.document_json));
    rows.push({ id: draft.draft_id, planId: null, draftId: draft.draft_id, draftRevision: draft.revision,
      name: document.name, packageType: document.packageType, visibility: document.visibility, status: "draft", hasDraft: true, published: false,
      priceCount: document.prices.filter(p => p.enabled).length, legacyDraftRevision: null });
  }
  return rows;
}

/** Returns explicit serializable editor data, never a live database or credentials. */
export function readMembershipPlanEditor(db: Database.Database, planId: string, versionId?: string): MembershipPlanEditor {
  if (db.prepare("SELECT 1 FROM platform_membership_audit_events WHERE action='plan_editor.legacy_draft_deleted' AND target_type='plan_editor' AND target_id=?").get(planId)) {
    throw new Error("This draft was deleted. Create a new plan or duplicate another plan.");
  }
  if (db.prepare("SELECT 1 FROM platform_membership_audit_events WHERE action='plan_editor.deleted' AND target_type='plan' AND target_id=?").get(planId)) {
    throw new Error("This plan was deleted. Create a new plan instead.");
  }
  const plan = db.prepare("SELECT name,visibility,internal_note FROM platform_membership_plans WHERE plan_id=?").get(planId) as
    { name: string; visibility: MembershipPlanEditor["visibility"]; internal_note: string } | undefined;
  if (!plan) throw new Error("Choose an existing plan.");
  const version = db.prepare(`SELECT plan_version_id id,public_description FROM platform_membership_plan_versions WHERE plan_id=?
    ${versionId ? "AND plan_version_id=?" : ""} ORDER BY version_number DESC LIMIT 1`).get(...(versionId ? [planId, versionId] : [planId])) as
    { id: string; public_description: string } | undefined;
  if (!version) throw new Error("This plan has no editable configuration.");
  const presentation = table(db, "platform_membership_plan_presentations")
    ? db.prepare("SELECT document_json FROM platform_membership_plan_presentations WHERE plan_version_id=?").get(version.id) as { document_json: string } | undefined : undefined;
  const saved = presentation ? membershipPlanEditorSchema.parse(JSON.parse(presentation.document_json)) : null;
  const doc = emptyMembershipPlan();
  Object.assign(doc, { planId, name: plan.name, visibility: plan.visibility, internalNote: plan.internal_note, description: version.public_description });
  doc.displayOnly = saved?.displayOnly ?? false;
  if (saved?.requiresDiscord !== undefined) doc.requiresDiscord = saved.requiresDiscord;
  doc.packageType = saved?.packageType ?? "plan";
  doc.bundleOfferIds = saved?.bundleOfferIds ?? [];
  const columns = db.prepare("PRAGMA table_info(platform_membership_plan_features)").all() as { name: string }[];
  const features = db.prepare(`SELECT feature_key,limit_value,${columns.some(c => c.name === "reset_days") ? "reset_days" : "NULL reset_days"}
    FROM platform_membership_plan_features WHERE plan_version_id=? ORDER BY feature_key`).all(version.id) as
    { feature_key: string; limit_value: number | null; reset_days: number | null }[];
  const periods = table(db, "platform_private_watchlist_plan_periods") ? db.prepare("SELECT meter,period_kind,period_days FROM platform_private_watchlist_plan_periods WHERE plan_version_id=?").all(version.id) as
    { meter: string; period_kind: "calendar_month" | "days" | "lifetime"; period_days: number | null }[] : [];
  doc.features = features.filter(row => (isMembershipPlanSelectableFeature(row.feature_key) || isMembershipProductSetting(row.feature_key)) &&
    !(row.feature_key === "analytics.trade_explorer" && saved?.features.some(item => item.key === "analytics.compare_trades") && !saved.features.some(item => item.key === "analytics.trade_explorer"))).map(row => {
    const period = periods.find(item => `private_watchlist.${item.meter}` === row.feature_key);
    const previous = saved?.features.find(item => item.key === row.feature_key);
    return { key: row.feature_key, limit: row.limit_value, resetDays: row.reset_days,
      period: period ? { kind: period.period_kind, days: period.period_days } : null, brief: previous?.brief ?? null, details: previous?.details ?? null };
  });
  if (features.some(feature => feature.feature_key === "notifications.market_news") && !doc.features.some(feature => feature.key === "news.week_ahead")) {
    doc.features.push(newMembershipProductFeature("news.week_ahead"));
  }
  type Offer = { offer_id: string; name: string; provider: string; channel: MembershipPlanEditor["prices"][number]["channel"];
    billing_kind: MembershipPlanEditor["prices"][number]["billing"]; currency: string | null; initial_amount_minor: number | null;
    renewal_amount_minor: number | null; billing_interval: "day" | "week" | "month" | "year" | null; billing_interval_count: number | null;
    access_duration_days: number | null; external_product_ref: string | null; external_price_ref: string | null;
    external_checkout_url: string | null; status: string };
  const offers = db.prepare("SELECT * FROM platform_membership_offers WHERE plan_version_id=? ORDER BY created_at_utc,offer_id").all(version.id) as Offer[];
  doc.prices = offers.map(offer => {
    const previousPrice = saved?.prices.find(price => price.id === offer.offer_id);
    const amount = (minor: number | null) => {
      if (minor === null) return "";
      const digits = currencyDecimals(offer.currency ?? "USD");
      const scale = BigInt(10) ** BigInt(digits); const exact = BigInt(minor);
      return digits ? `${exact / scale}.${String(exact % scale).padStart(digits, "0")}` : String(exact);
    };
    const trials = db.prepare(`SELECT t.*,x.external_checkout_url FROM platform_membership_trial_campaigns t
      LEFT JOIN platform_membership_trial_checkouts x ON x.trial_campaign_id=t.trial_campaign_id WHERE t.offer_id=? ORDER BY t.created_at_utc`).all(offer.offer_id) as {
        trial_campaign_id: string; name: string; duration_days: number; entry_amount_minor: number | null; payment_method_required: number;
        eligibility_mode: "once_per_campaign" | "once_ever" | "unlimited" | "owner_only"; capacity: number | null;
        enrollment_starts_at_utc: string | null; enrollment_ends_at_utc: string | null; external_checkout_url: string | null; status: string }[];
    const rules = db.prepare("SELECT * FROM platform_membership_discord_offer_rules WHERE offer_id=? ORDER BY created_at_utc").all(offer.offer_id) as {
      discord_offer_rule_id: string; discord_guild_id: string; discord_role_ids_json: string; access_mode: "automatic_grant" | "eligible_to_purchase";
      funding_mode: "sponsored" | "server_license" | "member_paid"; membership_max_age_seconds: number; starts_at_utc: string | null; ends_at_utc: string | null; status: string }[];
    return { id: offer.offer_id, name: offer.name, provider: offer.provider, enabled: offer.status === "active" || offer.status === "draft",
      channel: offer.channel, billing: offer.billing_kind, currency: offer.currency ?? "USD", initialPrice: amount(offer.initial_amount_minor),
      renewalPrice: amount(offer.renewal_amount_minor), interval: offer.billing_interval ?? "month", intervalCount: offer.billing_interval_count ?? 1,
      accessDays: offer.access_duration_days, productRef: offer.external_product_ref ?? "", priceRef: offer.external_price_ref ?? "", checkoutUrl: offer.external_checkout_url ?? "",
      trials: trials.map(t => ({ id: t.trial_campaign_id, name: t.name, enabled: ["active", "draft"].includes(t.status), durationDays: t.duration_days,
        price: amount(t.entry_amount_minor), paymentMethodRequired: Boolean(t.payment_method_required), eligibility: t.eligibility_mode,
        capacity: t.capacity, startsAt: t.enrollment_starts_at_utc ?? "", endsAt: t.enrollment_ends_at_utc ?? "", checkoutUrl: t.external_checkout_url ?? "",
        endBehavior: readMembershipTrialEndBehavior(db, t.trial_campaign_id, offer.billing_kind, t.entry_amount_minor ?? 0, Boolean(t.payment_method_required)) })),
      discord: rules.map(r => ({ id: r.discord_offer_rule_id, guildId: r.discord_guild_id,
        guildName: previousPrice?.discord.find(item => item.id === r.discord_offer_rule_id)?.guildName ?? "",
        roleIds: JSON.parse(r.discord_role_ids_json),
        roleNames: previousPrice?.discord.find(item => item.id === r.discord_offer_rule_id)?.roleNames ?? [],
        enabled: r.status === "active", access: r.access_mode, funding: r.funding_mode, verificationSeconds: r.membership_max_age_seconds,
        startsAt: r.starts_at_utc ?? "", endsAt: r.ends_at_utc ?? "" })),
    };
  });
  // Disabled or display-only configuration has no purchasable projection. Keep it
  // available on reopen without treating it as live checkout or access authority.
  if (saved) {
    for (const price of doc.prices) {
      const configured = saved.prices.find(item => item.id === price.id);
      if (!configured) continue;
      const trials = new Set(price.trials.map(item => item.id));
      price.trials.push(...configured.trials.filter(item => !trials.has(item.id)).map(item => structuredClone(item)));
      const rules = new Set(price.discord.map(item => item.id));
      price.discord.push(...configured.discord.filter(item => !rules.has(item.id)).map(item => structuredClone(item)));
    }
    const projected = new Set(doc.prices.map(price => price.id));
    doc.prices.push(...saved.prices.filter(price => !projected.has(price.id)).map(price => structuredClone(price)));
  }
  doc.privatePageIds = (db.prepare(`SELECT DISTINCT shared.share_link_id FROM platform_membership_share_link_offers shared
    JOIN platform_membership_offers o ON o.offer_id=shared.offer_id JOIN platform_membership_share_links l ON l.share_link_id=shared.share_link_id
    WHERE o.plan_version_id=? AND l.status='active' ORDER BY shared.share_link_id`).all(version.id) as { share_link_id: string }[]).map(row => row.share_link_id);
  if (saved?.displayOnly) {
    const activePages = new Set((db.prepare("SELECT share_link_id FROM platform_membership_share_links WHERE status='active'").all() as { share_link_id: string }[]).map(row => row.share_link_id));
    doc.privatePageIds = saved.privatePageIds.filter(id => activePages.has(id));
  }
  doc.features = doc.packageType === "plan" ? ensureJournalPlanFoundation(doc.features) : doc.features;
  doc.features = orderMembershipFeatures(doc.features, saved?.features.map(feature => feature.key) ?? [], feature => feature.key);
  doc.baseRevision = membershipEditorRevision(doc);
  return doc;
}
