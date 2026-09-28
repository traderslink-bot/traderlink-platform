import type Database from "better-sqlite3";
import { z } from "zod";
import { createCanonicalUtcTimestamp, createCanonicalUuidV4 } from "../database/platform-migration-contract";
import { PlatformMembershipRepository } from "./platform-membership-repository";
import { membershipFeaturesFromForm } from "./platform-membership-features";
import { parseMembershipAmount } from "../../contracts/platform-membership-pricing";
import { evaluateMembershipFeature } from "./platform-membership-access";

const uuid = z.uuid();
const timestamp = z.iso.datetime({ precision: 3 });
const text = z.string().trim().min(1);
const blank = (form: FormData, key: string) => String(form.get(key) ?? "").trim();
const date = (form: FormData, key: string) => blank(form, key) ? timestamp.parse(blank(form, key)) : null;
const integer = (form: FormData, key: string) => blank(form, key) ? z.coerce.number().int().safe().positive().parse(blank(form, key)) : null;

export class PlatformMembershipManagement {
  constructor(private readonly database: Database.Database) {}

  execute(actorUserId: string, form: FormData, at = createCanonicalUtcTimestamp()): string {
    uuid.parse(actorUserId);
    timestamp.parse(at);
    const repository = new PlatformMembershipRepository(this.database);
    return this.database.transaction(() => {
      const operation = blank(form, "operation");
      let target = "";
      let details: Record<string, string> = {};
      switch (operation) {
        case "check_feature_access": {
          const decision = evaluateMembershipFeature(this.database, uuid.parse(blank(form, "userId")), text.parse(blank(form, "featureKey")),
            blank(form, "requestedTotal") ? z.coerce.number().int().safe().nonnegative().parse(blank(form, "requestedTotal")) : undefined, at);
          return `Policy: ${decision.mode}. Request ${decision.allowed ? "allowed" : "blocked"}.${decision.mode === "shadow" ? ` Enforced mode would ${decision.wouldAllow ? "allow" : "block"} it.` : ""}${decision.ownerBypass ? " Owner access bypass applies." : ""}${decision.limit === null ? " Allowance: unlimited." : decision.limit !== undefined ? ` Allowance: ${decision.limit}.` : ""}`;
        }
        case "feature_policy":
          target = text.parse(blank(form, "featureKey"));
          if (!this.database.prepare("SELECT 1 FROM platform_membership_feature_definitions WHERE feature_key=?").get(target)) throw new Error("Choose a registered feature.");
          this.database.prepare(`INSERT INTO platform_membership_feature_policies VALUES (?,?,?,?)
            ON CONFLICT(feature_key) DO UPDATE SET enforcement_mode=excluded.enforcement_mode,updated_by_user_id=excluded.updated_by_user_id,updated_at_utc=excluded.updated_at_utc`)
            .run(target, z.enum(["off", "shadow", "enforced"]).parse(blank(form, "enforcementMode")), actorUserId, at);
          break;
        case "feature":
          repository.registerFeature({ actorUserId, featureKey: text.parse(blank(form, "featureKey")),
            label: text.parse(blank(form, "label")), moduleKey: text.parse(blank(form, "moduleKey")),
            featureKind: z.enum(["boolean", "limit"]).parse(blank(form, "featureKind")),
            enforcementState: "planned", atUtc: at });
          return "Feature saved. It is now available in plan drafts.";
        case "provider":
          repository.registerProvider({ actorUserId, providerKey: text.parse(blank(form, "providerKey")),
            label: text.parse(blank(form, "label")),
            integrationMode: z.enum(["native", "external_checkout", "manual", "free"]).parse(blank(form, "integrationMode")),
            configurationState: z.enum(["unconfigured", "test", "ready", "paused"]).parse(blank(form, "configurationState")), atUtc: at });
          return "Payment provider saved.";
        case "publish":
          repository.publishPlanVersion({ actorUserId, planVersionId: uuid.parse(blank(form, "planVersionId")), atUtc: at });
          return "Plan version published. Existing members keep their version.";
        case "whole_app_snapshot": {
          repository.synchronizeBuiltInFeatures(actorUserId, at);
          const features = this.database.prepare("SELECT feature_key FROM platform_membership_feature_definitions WHERE owner_selectable=1 ORDER BY feature_key").all() as { feature_key: string }[];
          const plan = repository.createPlan({ actorUserId, planKey: text.parse(blank(form, "planKey")),
            name: text.parse(blank(form, "name")), visibility: "private", publicDescription: blank(form, "publicDescription"),
            features: features.map((feature) => ({ featureKey: feature.feature_key, limitValue: null })), atUtc: at });
          target = plan.planVersionId;
          return "Whole-app draft created with every currently selectable feature and unlimited numeric allowances. Review or customize it in Plans, publish it, then choose its offer when creating your trial.";
        }
        case "new_version": {
          const sourceId = uuid.parse(blank(form, "planVersionId"));
          const source = this.database.prepare("SELECT plan_id,public_description FROM platform_membership_plan_versions WHERE plan_version_id=?")
            .get(sourceId) as { plan_id: string; public_description: string } | undefined;
          if (!source) throw new Error("Choose an existing plan version.");
          target = createCanonicalUuidV4();
          this.database.prepare(`INSERT INTO platform_membership_plan_versions
            (plan_version_id,plan_id,version_number,public_description,lifecycle_state,created_by_user_id,created_at_utc)
            SELECT ?,?,MAX(version_number)+1,?,'draft',?,? FROM platform_membership_plan_versions WHERE plan_id=?`)
            .run(target, source.plan_id, source.public_description, actorUserId, at, source.plan_id);
          this.database.prepare(`INSERT INTO platform_membership_plan_features SELECT ?,feature_key,feature_kind,limit_value
            FROM platform_membership_plan_features WHERE plan_version_id=?`).run(target, sourceId);
          break;
        }
        case "edit_draft": {
          target = uuid.parse(blank(form, "planVersionId"));
          repository.synchronizeBuiltInFeatures(actorUserId, at);
          repository.replaceDraftFeatures(target, membershipFeaturesFromForm(this.database, form));
          this.database.prepare("UPDATE platform_membership_plan_versions SET public_description=? WHERE plan_version_id=? AND lifecycle_state='draft'")
            .run(blank(form, "publicDescription"), target);
          break;
        }
        case "plan_details":
          target = uuid.parse(blank(form, "planId"));
          this.changed(this.database.prepare(`UPDATE platform_membership_plans SET name=?,visibility=?,internal_note=?,updated_at_utc=? WHERE plan_id=?`)
            .run(text.parse(blank(form, "name")), z.enum(["public", "private", "unlisted"]).parse(blank(form, "visibility")), blank(form, "internalNote"), at, target).changes);
          break;
        case "offer": {
          const billingKind = z.enum(["free", "one_time", "recurring", "lifetime"]).parse(blank(form, "billingKind"));
          const currency = billingKind === "free" ? null : text.parse(blank(form, "currency")).toUpperCase();
          repository.createOffer({ actorUserId, planVersionId: uuid.parse(blank(form, "planVersionId")), name: text.parse(blank(form, "name")),
            provider: text.parse(blank(form, "provider")), channel: z.enum(["website", "discord", "both", "private"]).parse(blank(form, "channel")),
            billingKind, currency, initialAmountMinor: currency ? parseMembershipAmount(blank(form, "initialAmount"), currency) : null,
            renewalAmountMinor: billingKind === "recurring" ? parseMembershipAmount(blank(form, "renewalAmount"), currency!) : null,
            billingPeriodDays: null,
            accessDurationDays: integer(form, "accessDurationDays"),
            billingInterval: billingKind === "recurring" ? z.enum(["day", "week", "month", "year"]).parse(blank(form, "billingInterval")) : null,
            billingIntervalCount: billingKind === "recurring" ? integer(form, "billingIntervalCount") : null,
            externalPriceRef: blank(form, "externalPriceRef"), externalProductRef: blank(form, "externalProductRef"),
            externalCheckoutUrl: blank(form, "externalCheckoutUrl"), atUtc: at });
          return "Offer saved as a draft. Activate it when its checkout is ready.";
        }
        case "offer_status": {
          target = uuid.parse(blank(form, "offerId"));
          const status = z.enum(["active", "paused", "retired"]).parse(blank(form, "status"));
          if (status === "active" && !this.database.prepare(`SELECT 1 FROM platform_membership_offers o
              JOIN platform_membership_plan_versions v ON v.plan_version_id=o.plan_version_id
              WHERE o.offer_id=? AND v.lifecycle_state='published'`).get(target)) throw new Error("Publish the plan version before activating its offer.");
          this.changed(this.database.prepare("UPDATE platform_membership_offers SET status=?,updated_at_utc=? WHERE offer_id=?").run(status, at, target).changes);
          break;
        }
        case "trial": {
          const offerId = uuid.parse(blank(form, "offerId"));
          const offer = this.database.prepare("SELECT currency FROM platform_membership_offers WHERE offer_id=?").get(offerId) as { currency: string | null } | undefined;
          const entry = blank(form, "entryAmount");
          if (entry && Number(entry) !== 0 && !offer?.currency) throw new Error("A paid trial requires an offer with a currency.");
          const trialId = repository.createTrialCampaign({ actorUserId, offerId, name: text.parse(blank(form, "name")), durationDays: integer(form, "durationDays")!,
            entryAmountMinor: entry && offer?.currency ? parseMembershipAmount(entry, offer.currency) : 0,
            paymentMethodRequired: form.get("paymentMethodRequired") === "on",
            eligibilityMode: z.enum(["once_per_campaign", "once_ever", "unlimited", "owner_only"]).parse(blank(form, "eligibilityMode")),
            enrollmentStartsAtUtc: date(form, "startsAtUtc"), enrollmentEndsAtUtc: date(form, "endsAtUtc"), capacity: integer(form, "capacity"), atUtc: at });
          this.saveTrialCheckout(trialId, blank(form, "externalCheckoutUrl"), actorUserId, at);
          return "Trial campaign saved.";
        }
        case "trial_checkout":
          target = uuid.parse(blank(form, "trialCampaignId"));
          if (!this.database.prepare("SELECT 1 FROM platform_membership_trial_campaigns WHERE trial_campaign_id=?").get(target)) throw new Error("Choose an existing trial.");
          this.saveTrialCheckout(target, blank(form, "externalCheckoutUrl"), actorUserId, at);
          break;
        case "trial_status":
          target = uuid.parse(blank(form, "trialCampaignId"));
          this.changed(this.database.prepare("UPDATE platform_membership_trial_campaigns SET status=?,updated_at_utc=? WHERE trial_campaign_id=?")
            .run(z.enum(["active", "paused", "retired"]).parse(blank(form, "status")), at, target).changes);
          break;
        case "grant": {
          const recurrence = blank(form, "grantInterval");
          const interval = recurrence ? z.enum(["day", "week", "month", "year"]).parse(recurrence) : null;
          const count = interval ? integer(form, "grantIntervalCount") : null;
          if (interval && !count) throw new Error("Enter the renewal interval count.");
          const entitlementId = repository.grantEntitlement({ actorUserId, userId: uuid.parse(blank(form, "userId")), planVersionId: uuid.parse(blank(form, "planVersionId")),
            sourceType: "owner_grant", sourceRef: createCanonicalUuidV4(), startsAtUtc: date(form, "startsAtUtc") ?? at,
            endsAtUtc: date(form, "endsAtUtc"), reason: blank(form, "reason"), atUtc: at });
          if (interval) this.database.prepare("INSERT INTO platform_membership_recurring_grants VALUES (?,?,?)").run(entitlementId, interval, count);
          return interval ? "Recurring owner access granted until its end date or revocation. No payment is charged." : "Access granted for the selected dates. No payment was charged.";
        }
        case "migrate_member": {
          target = uuid.parse(blank(form, "entitlementId"));
          const version = uuid.parse(blank(form, "planVersionId"));
          if (!this.database.prepare("SELECT 1 FROM platform_membership_plan_versions WHERE plan_version_id=? AND lifecycle_state='published'").get(version)) throw new Error("Choose a published target version.");
          const grant = this.database.prepare("SELECT source_type,ends_at_utc,status FROM platform_membership_entitlements WHERE entitlement_id=?").get(target) as { source_type: string; ends_at_utc: string | null; status: string } | undefined;
          if (!grant || grant.status !== "active") throw new Error("Choose an active access grant.");
          const when = z.enum(["now", "renewal"]).parse(blank(form, "when"));
          if (when === "renewal") {
            if (grant.source_type !== "subscription" || !grant.ends_at_utc) throw new Error("Choose a subscription with a known renewal period, or migrate now.");
            this.database.prepare(`INSERT INTO platform_membership_version_changes VALUES (?,?,?,?,?,NULL)
              ON CONFLICT(entitlement_id) DO UPDATE SET target_plan_version_id=excluded.target_plan_version_id,requested_by_user_id=excluded.requested_by_user_id,
              requested_at_utc=excluded.requested_at_utc,renewal_after_utc=excluded.renewal_after_utc,applied_at_utc=NULL`).run(target, version, actorUserId, at, grant.ends_at_utc);
          } else {
            this.database.prepare("UPDATE platform_membership_entitlements SET plan_version_id=?,updated_at_utc=? WHERE entitlement_id=?").run(version, at, target);
            this.database.prepare("DELETE FROM platform_membership_version_changes WHERE entitlement_id=?").run(target);
          }
          break;
        }
        case "cancel_member_migration":
          target = uuid.parse(blank(form, "entitlementId"));
          this.database.prepare("DELETE FROM platform_membership_version_changes WHERE entitlement_id=? AND applied_at_utc IS NULL").run(target);
          break;
        case "discord_rule":
        case "edit_discord_rule": {
          target = operation === "edit_discord_rule" ? uuid.parse(blank(form, "ruleId")) : createCanonicalUuidV4();
          const roles = blank(form, "roleIds").split(/[\s,]+/).filter(Boolean).map((id) => z.string().regex(/^\d{1,32}$/).parse(id));
          const starts = date(form, "startsAtUtc"); const ends = date(form, "endsAtUtc");
          if (starts && ends && ends <= starts) throw new Error("Enter an end date after the start date.");
          const values = [uuid.parse(blank(form, "offerId")), z.string().regex(/^\d{1,32}$/).parse(blank(form, "guildId")),
            JSON.stringify([...new Set(roles)]), z.enum(["automatic_grant", "eligible_to_purchase"]).parse(blank(form, "accessMode")),
            z.enum(["sponsored", "server_license", "member_paid"]).parse(blank(form, "fundingMode")), integer(form, "freshnessSeconds"), starts, ends];
          if (operation === "edit_discord_rule") {
            this.changed(this.database.prepare(`UPDATE platform_membership_discord_offer_rules SET
              offer_id=?,discord_guild_id=?,discord_role_ids_json=?,access_mode=?,funding_mode=?,membership_max_age_seconds=?,
              starts_at_utc=?,ends_at_utc=?,updated_at_utc=? WHERE discord_offer_rule_id=?`).run(...values, at, target).changes);
          } else this.database.prepare(`INSERT INTO platform_membership_discord_offer_rules
            (discord_offer_rule_id,offer_id,discord_guild_id,discord_role_ids_json,access_mode,funding_mode,seat_limit,membership_max_age_seconds,starts_at_utc,ends_at_utc,status,created_at_utc,updated_at_utc)
            VALUES (?,?,?,?,?,?,NULL,?,?,?,'active',?,?)`).run(target, ...values, at, at);
          break;
        }
        case "discord_status":
          target = uuid.parse(blank(form, "ruleId"));
          this.changed(this.database.prepare("UPDATE platform_membership_discord_offer_rules SET status=?,updated_at_utc=? WHERE discord_offer_rule_id=?")
            .run(z.enum(["active", "paused", "retired"]).parse(blank(form, "status")), at, target).changes);
          break;
        case "revoke_grant":
          target = uuid.parse(blank(form, "entitlementId"));
          this.changed(this.database.prepare("UPDATE platform_membership_entitlements SET status='revoked',updated_at_utc=? WHERE entitlement_id=?").run(at, target).changes);
          break;
        case "approve_stripe_claim_recovery":
        case "revoke_stripe_claim_recovery": {
          target = uuid.parse(blank(form, "claimId"));
          const claim = this.database.prepare(`SELECT c.state FROM platform_membership_claims c
            JOIN platform_membership_offers o ON o.offer_id=c.offer_id
            WHERE c.claim_id=? AND o.provider='stripe' AND c.external_session_ref IS NOT NULL`).get(target) as { state: string } | undefined;
          if (!claim) throw new Error("Choose a Stripe checkout reservation.");
          if (claim.state === "fulfilled") throw new Error("This checkout is already fulfilled. Manage its access in Members.");
          details = { reason: text.parse(blank(form, "reason")) };
          // Approval alone never claims payment or creates access. The verified
          // payment projection consumes this exact claim's invitation exception.
          break;
        }
        case "confirm_external_payment": {
          target = uuid.parse(blank(form, "claimId"));
          const claim = this.database.prepare(`SELECT c.user_id,c.state,o.plan_version_id,o.provider FROM platform_membership_claims c
            JOIN platform_membership_offers o ON o.offer_id=c.offer_id WHERE c.claim_id=?`).get(target) as { user_id: string; state: string; plan_version_id: string; provider: string } | undefined;
          if (!claim || claim.provider === "stripe") throw new Error("Choose an external-provider claim.");
          if (claim.state === "fulfilled") return "This claim has already been confirmed.";
          // This command is reachable only through owner-authorized administration.
          // It records a deliberate owner grant, not a new public invitation claim.
          // Expiry, revocation and capacity still govern all automatic completions.
          const reason = text.parse(blank(form, "reason"));
          const endsAt = date(form, "endsAtUtc");
          if (endsAt && endsAt <= at) throw new Error("Enter an access end date after the confirmation time, or leave it blank for lifetime access.");
          this.changed(this.database.prepare("UPDATE platform_membership_claims SET state='fulfilled',fulfilled_at_utc=? WHERE claim_id=? AND state IN ('reserved','released')").run(at, target).changes);
          repository.grantEntitlement({ actorUserId, userId: claim.user_id, planVersionId: claim.plan_version_id,
            sourceType: "owner_grant", sourceRef: `external:${target}`, startsAtUtc: at, endsAtUtc: endsAt,
            reason, atUtc: at });
          break;
        }
        case "revoke_link":
          target = uuid.parse(blank(form, "shareLinkId"));
          this.changed(this.database.prepare("UPDATE platform_membership_share_links SET status='revoked',updated_at_utc=? WHERE share_link_id=?").run(at, target).changes);
          break;
        case "edit_link": {
          target = uuid.parse(blank(form, "shareLinkId"));
          const offerIds = [...new Set(form.getAll("offerIds").map((id) => uuid.parse(id)))];
          const expiry = date(form, "expiresAtUtc");
          if (expiry && expiry <= at) throw new Error("Enter a future expiry or leave it blank.");
          const maximum = integer(form, "maximumClaims");
          const link = this.database.prepare("SELECT claim_count FROM platform_membership_share_links WHERE share_link_id=?").get(target) as { claim_count: number } | undefined;
          if (!link) throw new Error("That membership record no longer exists. Refresh and try again.");
          if (maximum !== null && maximum < link.claim_count) throw new Error("Enter a claim limit no lower than the completed claim count, or leave it unlimited.");
          this.database.prepare("UPDATE platform_membership_share_links SET name=?,expires_at_utc=?,maximum_claims=?,updated_at_utc=? WHERE share_link_id=?")
            .run(text.parse(blank(form, "name")), expiry, maximum, at, target);
          this.database.prepare("DELETE FROM platform_membership_share_link_offers WHERE share_link_id=?").run(target);
          const insert = this.database.prepare("INSERT INTO platform_membership_share_link_offers (share_link_id,offer_id,display_order) VALUES (?,?,?)");
          offerIds.forEach((id, index) => insert.run(target, id, index));
          break;
        }
        default: throw new Error("Choose a supported membership action.");
      }
      this.database.prepare(`INSERT INTO platform_membership_audit_events
        (audit_event_id,actor_user_id,action,target_type,target_id,safe_details_json,occurred_at_utc)
        VALUES (?,?,?,'membership',?,?,?)`).run(createCanonicalUuidV4(), actorUserId, operation, target, JSON.stringify(details), at);
      return "Changes saved.";
    }).immediate();
  }

  private changed(changes: number): void {
    if (changes !== 1) throw new Error("That membership record no longer exists. Refresh and try again.");
  }

  private saveTrialCheckout(trialId: string, checkout: string, actor: string, at: string): void {
    if (!checkout) {
      this.database.prepare("DELETE FROM platform_membership_trial_checkouts WHERE trial_campaign_id=?").run(trialId);
      return;
    }
    let url: URL;
    try { url = new URL(checkout); } catch { throw new Error("Checkout must use an HTTPS URL."); }
    if (url.protocol !== "https:" || url.username || url.password) throw new Error("Checkout must use an HTTPS URL.");
    this.database.prepare(`INSERT INTO platform_membership_trial_checkouts VALUES (?,?,?,?) ON CONFLICT(trial_campaign_id)
      DO UPDATE SET external_checkout_url=excluded.external_checkout_url,updated_by_user_id=excluded.updated_by_user_id,updated_at_utc=excluded.updated_at_utc`)
      .run(trialId, url.href, actor, at);
  }
}
