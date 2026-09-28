import { createHash } from "node:crypto";
import type Database from "better-sqlite3";
import { createCanonicalUtcTimestamp, createCanonicalUuidV4, assertCanonicalUuidV4, assertCanonicalUtcTimestamp } from "../database/platform-migration-contract";
import { PlatformMembershipRepository } from "./platform-membership-repository";
import { readDiscordMembershipGrants } from "./platform-membership-discord";

export type MembershipClaimOffer = {
  offer_id: string; plan_version_id: string; billing_kind: string; provider: string;
  initial_amount_minor: number | null; renewal_amount_minor: number | null; currency: string | null;
  billing_interval: string | null; billing_interval_count: number | null; external_price_ref: string | null;
  external_checkout_url: string | null; name: string;
  provider_configuration_state: string;
};

export class PlatformMembershipClaims {
  constructor(private readonly database: Database.Database) {}

  reserve(input: { userId: string; offerId: string; secret?: string; trialCampaignId?: string; atUtc?: string }): { claimId: string; offer: MembershipClaimOffer; trialDays: number | null; trialAmount: number | null; paymentMethodRequired: boolean } {
    const at = input.atUtc ?? createCanonicalUtcTimestamp();
    assertCanonicalUtcTimestamp(at, "atUtc");
    assertCanonicalUuidV4(input.userId, "userId");
    assertCanonicalUuidV4(input.offerId, "offerId");
    return this.database.transaction(() => {
      this.database.prepare("UPDATE platform_membership_claims SET state='released' WHERE state='reserved' AND expires_at_utc<=?").run(at);
      const offer = this.database.prepare(`SELECT o.*,p.visibility,provider.configuration_state provider_configuration_state FROM platform_membership_offers o
        JOIN platform_membership_provider_definitions provider ON provider.provider_key=o.provider
        JOIN platform_membership_plan_versions v ON v.plan_version_id=o.plan_version_id JOIN platform_membership_plans p ON p.plan_id=v.plan_id
        WHERE o.offer_id=? AND o.status='active' AND v.lifecycle_state='published' AND p.status='active'
        AND provider.configuration_state IN ('test','ready')`).get(input.offerId) as (MembershipClaimOffer & { visibility: string; channel: string }) | undefined;
      if (!offer) throw new Error("This offer is no longer available.");
      let shareLinkId: string | null = null;
      if (input.secret) {
        const link = this.database.prepare(`SELECT l.share_link_id FROM platform_membership_share_links l
          JOIN platform_membership_share_link_offers o ON o.share_link_id=l.share_link_id
          WHERE l.secret_sha256=? AND o.offer_id=? AND l.status='active' AND (l.expires_at_utc IS NULL OR l.expires_at_utc>?)
          AND (l.maximum_claims IS NULL OR l.claim_count+(SELECT COUNT(*) FROM platform_membership_claims c WHERE c.share_link_id=l.share_link_id AND c.state='reserved')<l.maximum_claims)`)
          .get(createHash("sha256").update(input.secret).digest("hex"), input.offerId, at) as { share_link_id: string } | undefined;
        if (!link) throw new Error("This private offer is expired, revoked or fully claimed.");
        shareLinkId = link.share_link_id;
      } else if ((offer.visibility !== "public" || !["website", "both"].includes(offer.channel)) &&
          !readDiscordMembershipGrants(this.database, input.userId, at, input.offerId).length) {
        throw new Error("Use the private invitation for this offer.");
      }
      let trialDays: number | null = null;
      let trialAmount: number | null = null;
      let paymentMethodRequired = false;
      if (input.trialCampaignId) {
        const trial = this.database.prepare(`SELECT t.*,x.external_checkout_url FROM platform_membership_trial_campaigns t
          LEFT JOIN platform_membership_trial_checkouts x ON x.trial_campaign_id=t.trial_campaign_id WHERE t.trial_campaign_id=? AND offer_id=? AND status='active'
          AND (enrollment_starts_at_utc IS NULL OR enrollment_starts_at_utc<=?) AND (enrollment_ends_at_utc IS NULL OR enrollment_ends_at_utc>?)`)
          .get(input.trialCampaignId, input.offerId, at, at) as { duration_days: number; entry_amount_minor: number | null; payment_method_required: number; eligibility_mode: string; capacity: number | null; external_checkout_url: string | null } | undefined;
        if (!trial || trial.eligibility_mode === "owner_only") throw new Error("This trial requires an owner grant or is no longer open.");
        const count = (sql: string, ...args: string[]) => (this.database.prepare(sql).get(...args) as { count: number }).count;
        if (trial.capacity !== null && count("SELECT COUNT(*) count FROM platform_membership_claims WHERE trial_campaign_id=? AND state IN ('reserved','fulfilled')", input.trialCampaignId) >= trial.capacity) throw new Error("This trial is fully enrolled.");
        if (trial.eligibility_mode !== "unlimited" && count(`SELECT COUNT(*) count FROM platform_membership_claims WHERE user_id=? AND state IN ('reserved','fulfilled') AND trial_campaign_id IS NOT NULL${trial.eligibility_mode === "once_per_campaign" ? " AND trial_campaign_id=?" : ""}`,
          input.userId, ...(trial.eligibility_mode === "once_per_campaign" ? [input.trialCampaignId] : []))) throw new Error("You have already enrolled in this trial.");
        trialDays = trial.duration_days; trialAmount = trial.entry_amount_minor ?? 0; paymentMethodRequired = trial.payment_method_required === 1;
        if (offer.provider !== "stripe" && (trialAmount > 0 || paymentMethodRequired)) {
          if (!trial.external_checkout_url) throw new Error("This trial's checkout is not configured. Contact the owner.");
          offer.external_checkout_url = trial.external_checkout_url;
        }
      }
      const claimId = createCanonicalUuidV4();
      this.database.prepare(`INSERT INTO platform_membership_claims
        (claim_id,user_id,offer_id,share_link_id,trial_campaign_id,state,created_at_utc,expires_at_utc)
        VALUES (?,?,?,?,?,'reserved',?,?)`).run(claimId, input.userId, input.offerId, shareLinkId, input.trialCampaignId ?? null, at,
          new Date(Date.parse(at) + 60 * 60_000).toISOString());
      return { claimId, offer, trialDays, trialAmount, paymentMethodRequired };
    }).immediate();
  }

  fulfillFree(claimId: string, userId: string, at = createCanonicalUtcTimestamp()): void {
    this.database.transaction(() => {
      const row = this.database.prepare(`SELECT c.*,o.billing_kind,o.plan_version_id,COALESCE(t.duration_days,o.access_duration_days) duration_days,t.entry_amount_minor,t.payment_method_required
        FROM platform_membership_claims c JOIN platform_membership_offers o ON o.offer_id=c.offer_id
        LEFT JOIN platform_membership_trial_campaigns t ON t.trial_campaign_id=c.trial_campaign_id WHERE c.claim_id=? AND c.user_id=?`)
        .get(claimId, userId) as { state: string; trial_campaign_id: string | null; billing_kind: string; plan_version_id: string; duration_days: number | null; entry_amount_minor: number | null; payment_method_required: number | null } | undefined;
      if (!row) throw new Error("Claim not found.");
      if (row.state === "fulfilled") return;
      if (row.trial_campaign_id ? (row.entry_amount_minor ?? 0) > 0 || row.payment_method_required : row.billing_kind !== "free") throw new Error("Verified payment is required for this offer.");
      this.complete(claimId, at);
      new PlatformMembershipRepository(this.database).grantEntitlement({ actorUserId: userId, userId,
        planVersionId: row.plan_version_id, sourceType: row.trial_campaign_id ? "trial" : "free_plan", sourceRef: claimId,
        startsAtUtc: at, endsAtUtc: row.duration_days ? new Date(Date.parse(at) + row.duration_days * 86_400_000).toISOString() : null, atUtc: at });
    }).immediate();
  }

  // Must be called in the same transaction as the verified payment projection.
  complete(claimId: string, at = createCanonicalUtcTimestamp()): void {
    this.completeClaim(claimId, at, false);
  }

  // Only the signature-verified Stripe projection calls this. Reservation TTL
  // controls unpaid checkout capacity, not evidence that payment succeeded.
  completeStripePayment(claimId: string, at: string): void {
    if (!this.database.prepare(`SELECT 1 FROM platform_membership_claims c
      JOIN platform_membership_offers o ON o.offer_id=c.offer_id
      WHERE c.claim_id=? AND o.provider='stripe' AND c.external_session_ref IS NOT NULL`).get(claimId)) {
      throw new Error("Unknown Stripe checkout reservation.");
    }
    const recovery = this.database.prepare(`SELECT action FROM platform_membership_audit_events
      WHERE target_type='membership' AND target_id=? AND action IN ('approve_stripe_claim_recovery','revoke_stripe_claim_recovery')
      ORDER BY rowid DESC LIMIT 1`).get(claimId) as { action: string } | undefined;
    if (recovery?.action === "approve_stripe_claim_recovery") {
      this.database.prepare("UPDATE platform_membership_claims SET state='fulfilled',fulfilled_at_utc=? WHERE claim_id=? AND state IN ('reserved','released')").run(at, claimId);
      return;
    }
    this.completeClaim(claimId, at, true);
  }

  private completeClaim(claimId: string, at: string, verifiedPayment: boolean): void {
    const claim = this.database.prepare("SELECT state,share_link_id,expires_at_utc FROM platform_membership_claims WHERE claim_id=?")
      .get(claimId) as { state: string; share_link_id: string | null; expires_at_utc: string } | undefined;
    if (claim?.state === "fulfilled") return;
    if (!claim || (!verifiedPayment && (claim.state !== "reserved" || claim.expires_at_utc <= at))) throw new Error("This checkout reservation has expired.");
    if (claim.share_link_id) {
      const updated = this.database.prepare(`UPDATE platform_membership_share_links SET claim_count=claim_count+1,updated_at_utc=? WHERE share_link_id=?
        AND status='active' AND (expires_at_utc IS NULL OR expires_at_utc>?) AND (maximum_claims IS NULL OR claim_count<maximum_claims)`)
        .run(at, claim.share_link_id, at);
      if (updated.changes !== 1) throw new Error("This private offer is no longer available.");
    }
    this.database.prepare("UPDATE platform_membership_claims SET state='fulfilled',fulfilled_at_utc=? WHERE claim_id=?").run(at, claimId);
  }

  release(claimId: string): void {
    this.database.prepare("UPDATE platform_membership_claims SET state='released' WHERE claim_id=? AND state='reserved'").run(claimId);
  }
}
