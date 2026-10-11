import type Database from "better-sqlite3";
import type { MembershipPlanPublicationProjection } from "./membership-plan-editor-projection";
import { membershipTrialFamily } from "./membership-trial-lineage";

/** Inserts immutable commercial terms only. The caller owns the publication
 * transaction, access migration, old-option retirement and audit receipt. */
export function insertMembershipPlanCommercialTerms(db: Database.Database, projection: MembershipPlanPublicationProjection, actor: string, at: string): void {
  for (const price of projection.prices) {
    db.prepare(`INSERT INTO platform_membership_offers
      (offer_id,plan_version_id,name,provider,channel,billing_kind,currency,initial_amount_minor,renewal_amount_minor,
       billing_period_days,billing_interval,billing_interval_count,access_duration_days,external_product_ref,external_price_ref,
       external_checkout_url,status,created_at_utc,updated_at_utc)
      VALUES (?,?,?,?,?,?,?,?,?,NULL,?,?,?,?,?,?,'active',?,?)`).run(price.id, projection.versionId, price.name, price.provider,
        price.channel, price.billing, price.currency, price.initialAmount, price.renewalAmount,
        price.interval, price.intervalCount, price.accessDays, price.productRef, price.priceRef, price.checkoutUrl, at, at);
    for (const trial of price.trials) {
      db.prepare(`INSERT INTO platform_membership_trial_campaigns
        (trial_campaign_id,offer_id,name,duration_days,entry_amount_minor,payment_method_required,eligibility_mode,
         enrollment_starts_at_utc,enrollment_ends_at_utc,capacity,status,created_at_utc,updated_at_utc)
        VALUES (?,?,?,?,?,?,?,?,?,?,'active',?,?)`).run(trial.id, price.id, trial.name, trial.durationDays, trial.amount,
          trial.paymentMethodRequired ? 1 : 0, trial.eligibility, trial.startsAt, trial.endsAt, trial.capacity, at, at);
      const sourceExists = db.prepare("SELECT 1 FROM platform_membership_trial_campaigns WHERE trial_campaign_id=?").get(trial.sourceId);
      db.prepare("INSERT INTO platform_membership_trial_lineage(trial_campaign_id,family_id) VALUES (?,?)")
        .run(trial.id, sourceExists ? membershipTrialFamily(db, trial.sourceId) : trial.id);
      db.prepare("INSERT INTO platform_membership_trial_terms(trial_campaign_id,end_behavior) VALUES (?,?)").run(trial.id, trial.endBehavior);
      if (trial.checkoutUrl) db.prepare(`INSERT INTO platform_membership_trial_checkouts
        (trial_campaign_id,external_checkout_url,updated_by_user_id,updated_at_utc) VALUES (?,?,?,?)`).run(trial.id, trial.checkoutUrl, actor, at);
    }
    for (const rule of price.discord) {
      db.prepare(`INSERT INTO platform_membership_discord_offer_rules
        (discord_offer_rule_id,offer_id,discord_guild_id,discord_role_ids_json,access_mode,funding_mode,seat_limit,
         membership_max_age_seconds,starts_at_utc,ends_at_utc,status,created_at_utc,updated_at_utc)
        VALUES (?,?,?,?,?,?,NULL,?,?,?,'active',?,?)`).run(rule.id, price.id, rule.guildId, JSON.stringify(rule.roleIds),
          rule.access, rule.funding, rule.verificationSeconds, rule.startsAt, rule.endsAt, at, at);
    }
  }
}
