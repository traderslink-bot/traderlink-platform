import { createHash } from "node:crypto";
import type Database from "better-sqlite3";
import { readPartnerAlertStripeChannelFunding } from "./database/partner-alert-stripe-channel-funding";
import { PartnerAlertValidationError, partnerAlertAccessTicket, type PartnerAlertCheckoutOffer } from "../contracts/partner-alert-contracts";
import {
  PARTNER_ALERT_MAX_SELECTION, parsePartnerAlertOffer, parsePartnerAlertCheckoutOffer, parsePartnerAlertNewStripeOffer,
  parsePartnerAlertPublishingTerms, partnerAlertId, partnerAlertInteger,
  partnerAlertSnowflake, partnerAlertText, partnerAlertUtc,
} from "../contracts/partner-alert-validation";
import { requirePartnerAlertOfferCoverage } from "../contracts/partner-alert-offer-coverage";
import { quotePartnerAlertPublishing } from "../contracts/partner-alert-publishing-pricing";
import type {
  PartnerAlertActorReceipt, PartnerAlertAuthority, PartnerAlertCommunityOwnerActor,
  PartnerAlertOperatorActor, PartnerAlertRepositoryConfiguration,
} from "./partner-alert-authority";
import type { PlatformPremiumTicket } from "../../platform/contracts/platform-premium-access";
import { parsePlatformPremiumEligibilityEvent, type PlatformPremiumEligibilityEvent } from
  "../../platform/server/membership/platform-premium-eligibility-event";
import type { PremiumAdmittedImmediateWriter } from "../../platform/server/membership/platform-premium-current-authority";
import { requirePlatformErasureWriter } from "../../platform/server/privacy/platform-erasure-admission";
import type { PartnerAlertRoleReview, PartnerAlertReviewAssignment } from "./partner-alert-manual-role-review";
import { requirePartnerAlertAdmission } from "./partner-alert-admission";
import { partnerAlertCommandFingerprint, partnerAlertDraftCommandPayload } from "./partner-alert-command-fingerprint";
import { readPartnerAlertDeliveryActivity } from "./partner-alert-delivery-activity";
import { partnerAlertSaleVersionSql } from "./partner-alert-catalog-read";

type PartnerState = "draft" | "awaiting_approval" | "setup_required" | "active"
  | "publishing_paused" | "suspended" | "ended";
type PartnerRow = {
  community_id: string; owner_user_id: string; source_guild_id: string;
  display_name: string; content_policy_json: string; status: PartnerState;
  review_requested: number; revision: number; current_agreement_id: string | null;
  approved_at_utc: string | null; approved_by_user_id: string | null;
  submitted_application_revision: number | null; approved_application_revision: number | null;
  created_at_utc: string; updated_at_utc: string;
};
type MappingRow = {
  mapping_id: string; community_id: string; source_guild_id: string; source_channel_id: string;
  display_name: string; destination_guild_id: string | null; destination_channel_id: string | null;
  destination_role_id: string | null; revision: number; review_state: string;
  approved_revision: number | null; ever_approved: number;
};
type OfferRow = { offer_id: string; community_id: string; version: number; offer_json: string; review_state: string };
type AgreementRow = { agreement_id: string; community_id: string; version: number;
  terms_json: string; quote_json: string; contracted_channels: number };
type ApplicationDecisionInput = Readonly<{ communityId: string; requestId: string; expectedRevision: number; reason: string }>;
export type PartnerAlertWriteResult = Readonly<{
  communityId: string; partnerRevision: number; resourceId: string;
  resourceVersion: number; state: string;
}>;

export class PartnerAlertRepositoryError extends Error {
  constructor(readonly kind: "conflict" | "forbidden" | "unavailable", message: string) {
    super(message); this.name = "PartnerAlertRepositoryError";
  }
}

const RULES_VERSION = 1;
const conflict = () => new PartnerAlertRepositoryError("conflict", "These settings changed. Reload before saving.");

/**
 * Dormant repository: no DB open, schema execution, I/O, runtime registration or
 * activation on import/construction. Callers supply an already authorised DB and
 * fresh server authority. Never expose these authority values to request JSON.
 */
export class PartnerAlertRepository {
  constructor(private readonly db: Database.Database, private readonly authority: PartnerAlertAuthority,
    private readonly configuration: PartnerAlertRepositoryConfiguration) {
    partnerAlertSnowflake(configuration.destinationGuildId, "destinationGuildId");
    if (typeof configuration.nowUtc !== "function" || typeof configuration.createId !== "function") {
      throw new PartnerAlertValidationError("configuration");
    }
  }

  private now(): string { return partnerAlertUtc(this.configuration.nowUtc(), "nowUtc"); }
  private id(): string { return partnerAlertId(this.configuration.createId(), "generatedId"); }
  private fresh(receipt: Readonly<{ observedAtUtc: string; validUntilUtc: string }>, at: string): void {
    const observed = partnerAlertUtc(receipt.observedAtUtc, "observedAtUtc");
    const until = partnerAlertUtc(receipt.validUntilUtc, "validUntilUtc");
    if (observed > at || until <= at || until <= observed) {
      throw new PartnerAlertRepositoryError("forbidden", "Verify your connection again before continuing.");
    }
  }
  private actor(receipt: PartnerAlertActorReceipt, at: string): void {
    partnerAlertId(receipt.userId, "actorUserId"); this.fresh(receipt, at);
  }
  private operator(): PartnerAlertOperatorActor {
    const actor = this.authority.requireOperator(); this.actor(actor, this.now());
    requirePlatformErasureWriter(this.db, actor.userId);
    if (actor.kind !== "operator" || actor.authority !== "platform_owner") {
      throw new PartnerAlertRepositoryError("forbidden", "Owner approval is required.");
    }
    return actor;
  }
  private owner(communityId: string): PartnerAlertCommunityOwnerActor {
    partnerAlertId(communityId, "communityId");
    const actor = this.authority.requireCommunityOwner(communityId); this.actor(actor, this.now());
    requirePlatformErasureWriter(this.db, actor.userId);
    if (actor.kind !== "community_owner" || actor.ownership !== "verified" || actor.communityId !== communityId) {
      throw new PartnerAlertRepositoryError("forbidden", "Verify community ownership before continuing.");
    }
    partnerAlertSnowflake(actor.guildId, "guildId");
    return actor;
  }
  private partner(communityId: string, expectedRevision?: number): PartnerRow {
    const partner = this.db.prepare("SELECT * FROM partner_alert_partners WHERE community_id=?")
      .get(communityId) as PartnerRow | undefined;
    if (!partner) throw new PartnerAlertRepositoryError("unavailable", "This partner request is unavailable.");
    if (expectedRevision !== undefined && partner.revision !== expectedRevision) throw conflict();
    return partner;
  }
  private owned(partner: PartnerRow, actor: PartnerAlertCommunityOwnerActor, readOnly = false): void {
    if (partner.community_id !== actor.communityId || partner.owner_user_id !== actor.userId
      || partner.source_guild_id !== actor.guildId || (!readOnly && ["suspended", "ended"].includes(partner.status))) {
      throw new PartnerAlertRepositoryError("forbidden", "This community’s publishing settings are unavailable.");
    }
  }
  private community(communityId: string, ownerUserId: string, guildId: string, at: string): void {
    const receipt = this.authority.requireCommunity(communityId); this.fresh(receipt, at);
    if (receipt.communityId !== communityId || receipt.ownerUserId !== ownerUserId || receipt.guildId !== guildId) {
      throw new PartnerAlertRepositoryError("forbidden", "Current community ownership could not be verified.");
    }
  }
  private bump(partner: PartnerRow, at: string, state = partner.status, reviewRequested = partner.review_requested): number {
    const changed = this.db.prepare(`UPDATE partner_alert_partners SET revision=revision+1,
      status=?,review_requested=?,updated_at_utc=? WHERE community_id=? AND revision=?`)
      .run(state, reviewRequested, at, partner.community_id, partner.revision).changes;
    if (changed !== 1) throw conflict();
    return partner.revision + 1;
  }
  private audit(communityId: string, actorId: string, action: string, resourceId: string,
    detail: Readonly<Record<string, string | number | boolean>>, at: string): void {
    this.db.prepare(`INSERT INTO partner_alert_audit_events
      (audit_event_id,community_id,actor_user_id,action,resource_id,detail_json,created_at_utc)
      VALUES(?,?,?,?,?,?,?)`).run(this.id(), communityId, actorId, action, resourceId, JSON.stringify(detail), at);
  }
  private write(actor: PartnerAlertActorReceipt, communityId: string, requestId: string,
    action: string, payload: unknown, operation: (at: string) => PartnerAlertWriteResult): PartnerAlertWriteResult {
    partnerAlertId(communityId, "communityId"); partnerAlertId(requestId, "requestId");
    const fingerprint = partnerAlertCommandFingerprint(action, communityId, payload);
    return this.db.transaction(() => {
      const at = this.now(); this.actor(actor, at);
      const admission = requirePlatformErasureWriter(this.db, actor.userId);
      const publishing = this.db.prepare("SELECT owner_user_id FROM partner_alert_partners WHERE community_id=?").get(communityId) as { owner_user_id: string } | undefined;
      if (publishing) admission.assertLivePrincipal(publishing.owner_user_id);
      const receipt = this.db.prepare(`SELECT community_id,fingerprint_json,result_json FROM partner_alert_commands
        WHERE actor_user_id=? AND request_id=?`).get(actor.userId, requestId) as
        { community_id: string; fingerprint_json: string; result_json: string } | undefined;
      if (receipt) {
        if (receipt.community_id !== communityId || receipt.fingerprint_json !== fingerprint) throw conflict();
        return Object.freeze(JSON.parse(receipt.result_json) as PartnerAlertWriteResult);
      }
      const result = operation(at);
      this.audit(communityId, actor.userId, action, result.resourceId,
        { partnerRevision: result.partnerRevision, resourceVersion: result.resourceVersion, state: result.state }, at);
      this.db.prepare(`INSERT INTO partner_alert_commands
        (actor_user_id,request_id,community_id,fingerprint_json,result_json,created_at_utc)
        VALUES(?,?,?,?,?,?)`).run(actor.userId, requestId, communityId, fingerprint, JSON.stringify(result), at);
      return Object.freeze(result);
    }).immediate();
  }

  savePartnerDraft(input: Readonly<{ communityId: string; requestId: string; expectedRevision: number;
    displayName: string; contentPolicy: unknown; outputBotUserId: string; outputConfigurationRef: string }>): PartnerAlertWriteResult {
    const actor = this.owner(input.communityId);
    const payload = partnerAlertDraftCommandPayload(input);
    const { expected, displayName, policy } = payload;
    return this.write(actor, input.communityId, input.requestId, "partner.draft_saved",
      payload, at => {
        this.community(input.communityId, actor.userId, actor.guildId, at);
        const existing = this.db.prepare("SELECT * FROM partner_alert_partners WHERE community_id=?")
          .get(input.communityId) as PartnerRow | undefined;
        let revision: number;
        if (existing) {
          this.owned(existing, actor);
          if (existing.revision !== expected) throw conflict();
          if (existing.status !== "draft") throw new PartnerAlertRepositoryError("conflict",
            "Request owner review before changing an already submitted partner profile.");
          this.db.prepare("UPDATE partner_alert_partners SET display_name=?,content_policy_json=? WHERE community_id=?")
            .run(displayName, JSON.stringify(policy), input.communityId);
          revision = this.bump(existing, at);
        } else {
          if (expected !== 0) throw conflict();
          this.db.prepare(`INSERT INTO partner_alert_partners
            (community_id,owner_user_id,source_guild_id,display_name,content_policy_json,status,revision,created_at_utc,updated_at_utc)
            VALUES(?,?,?,?,?,'draft',1,?,?)`).run(input.communityId, actor.userId, actor.guildId,
            displayName, JSON.stringify(policy), at, at);
          revision = 1;
        }
        return { communityId: input.communityId, partnerRevision: revision,
          resourceId: input.communityId, resourceVersion: revision, state: "draft" };
      });
  }

  saveMappingDraft(input: Readonly<{ communityId: string; requestId: string; expectedRevision: number;
    mappingId: string; sourceChannelId: string; displayName: string }>): PartnerAlertWriteResult {
    const actor = this.owner(input.communityId);
    const expected = partnerAlertInteger(input.expectedRevision, "expectedRevision", 1);
    const mappingId = partnerAlertId(input.mappingId, "mappingId");
    const sourceChannelId = partnerAlertSnowflake(input.sourceChannelId, "sourceChannelId");
    const displayName = partnerAlertText(input.displayName, "displayName");
    return this.write(actor, input.communityId, input.requestId, "mapping.draft_saved",
      { expected, mappingId, sourceChannelId, displayName }, at => {
        const partner = this.partner(input.communityId, expected); this.owned(partner, actor);
        this.community(input.communityId, actor.userId, actor.guildId, at);
        const mapping = this.db.prepare("SELECT * FROM partner_alert_mappings WHERE mapping_id=?")
          .get(mappingId) as MappingRow | undefined;
        if (mapping && (mapping.community_id !== input.communityId || mapping.ever_approved === 1
          || mapping.review_state !== "draft")) throw new PartnerAlertRepositoryError("conflict",
            "Create a new mapping to replace an approved channel. Existing subscriptions stay separate.");
        const version = mapping ? mapping.revision + 1 : 1;
        if (mapping) this.db.prepare(`UPDATE partner_alert_mappings SET source_channel_id=?,display_name=?,
          revision=?,approved_revision=NULL,updated_at_utc=? WHERE mapping_id=? AND community_id=?`)
          .run(sourceChannelId, displayName, version, at, mappingId, input.communityId);
        else {
          const count = this.db.prepare("SELECT count(*) total FROM partner_alert_mappings WHERE community_id=? AND review_state!='withdrawn'")
            .get(input.communityId) as { total: number };
          if (count.total >= PARTNER_ALERT_MAX_SELECTION) throw new PartnerAlertValidationError("mappings");
          this.db.prepare(`INSERT INTO partner_alert_mappings
            (mapping_id,community_id,source_guild_id,source_channel_id,display_name,revision,review_state,created_at_utc,updated_at_utc)
            VALUES(?,?,?,?,?,1,'draft',?,?)`).run(mappingId, input.communityId, actor.guildId,
            sourceChannelId, displayName, at, at);
        }
        return { communityId: input.communityId, partnerRevision: this.bump(partner, at),
          resourceId: mappingId, resourceVersion: version, state: "draft" };
      });
  }

  private verifyOffer(communityId: string, ownerUserId: string, offer: PartnerAlertCheckoutOffer, at: string): void {
    if ("billingProvider" in offer) {
      const receipt = this.authority.requireStripeOffer?.(communityId, offer);
      if (!receipt || receipt.communityId !== communityId || receipt.communityOwnerUserId !== ownerUserId
        || receipt.environment !== this.configuration.stripeEnvironment || JSON.stringify(receipt.offer) !== JSON.stringify(offer)) {
        throw new PartnerAlertRepositoryError("forbidden", "Verify this community’s Stripe account before continuing.");
      }
      this.fresh(receipt, at);
      const changed = this.db.prepare(`UPDATE partner_alert_stripe_sellers
        SET state='ready',updated_at_ms=max(updated_at_ms,?)
        WHERE community_id=? AND owner_user_id=? AND environment=? AND stripe_account_id=? AND state!='disconnected'
          AND updated_at_ms<=?`)
        .run(Date.parse(receipt.observedAtUtc), communityId, ownerUserId, receipt.environment, receipt.sellerAccountId,
          Date.parse(receipt.observedAtUtc));
      if (changed.changes !== 1) throw conflict();
      return;
    }
    const receipt = this.authority.requireWhopOffer(communityId, offer); this.fresh(receipt, at);
    const verified = parsePartnerAlertOffer(receipt.offer);
    if (receipt.communityId !== communityId || receipt.communityOwnerUserId !== ownerUserId
      || receipt.membershipVerificationAuthorised !== true || JSON.stringify(verified) !== JSON.stringify(offer)
      || receipt.binding.environment !== offer.whop.environment || receipt.binding.accountId !== offer.whop.accountId
      || receipt.binding.productId !== offer.whop.productId || receipt.binding.planId !== offer.whop.planId) {
      throw new PartnerAlertRepositoryError("forbidden", "Verify this community’s Whop offer before continuing.");
    }
  }

  saveOfferVersion(input: Readonly<{ communityId: string; requestId: string; expectedRevision: number;
    offer: unknown }>): PartnerAlertWriteResult {
    const actor = this.owner(input.communityId);
    const expected = partnerAlertInteger(input.expectedRevision, "expectedRevision", 1);
    const offer = parsePartnerAlertNewStripeOffer(input.offer);
    if (offer.communityId !== input.communityId) throw new PartnerAlertValidationError("communityId");
    return this.write(actor, input.communityId, input.requestId, "offer.version_saved", { expected, offer }, at => {
      const partner = this.partner(input.communityId, expected); this.owned(partner, actor);
      if (partner.review_requested) throw conflict();
      this.community(input.communityId, actor.userId, actor.guildId, at);
      this.verifyOffer(input.communityId, partner.owner_user_id, offer, at);
      const previous = this.db.prepare("SELECT * FROM partner_alert_offers WHERE offer_id=? ORDER BY version DESC LIMIT 1")
        .get(offer.offerId) as OfferRow | undefined;
      if (previous && previous.community_id !== input.communityId) throw conflict();
      if (offer.version !== (previous?.version ?? 0) + 1) throw conflict();
      if (!previous) {
        const count = this.db.prepare("SELECT count(DISTINCT offer_id) total FROM partner_alert_offers WHERE community_id=?")
          .get(input.communityId) as { total: number };
        if (count.total >= PARTNER_ALERT_MAX_SELECTION) throw new PartnerAlertValidationError("offers");
      }
      for (const mappingId of offer.mappingIds) {
        if (!this.db.prepare("SELECT 1 FROM partner_alert_mappings WHERE community_id=? AND mapping_id=? AND review_state!='withdrawn'")
          .get(input.communityId, mappingId)) throw new PartnerAlertValidationError("mappingIds",
            "Select only this community’s available channels.");
      }
      this.db.prepare(`INSERT INTO partner_alert_offers
        (offer_id,community_id,version,kind,offer_json,review_state,created_at_utc)
        VALUES(?,?,?,?,?,'draft',?)`).run(offer.offerId, input.communityId, offer.version, offer.kind, JSON.stringify(offer), at);
      for (const mappingId of offer.mappingIds) this.db.prepare(`INSERT INTO partner_alert_offer_channels
        (community_id,offer_id,offer_version,mapping_id) VALUES(?,?,?,?)`)
        .run(input.communityId, offer.offerId, offer.version, mappingId);
      return { communityId: input.communityId, partnerRevision: this.bump(partner, at),
        resourceId: offer.offerId, resourceVersion: offer.version, state: "draft" };
    });
  }

  proposePublishingAgreement(input: Readonly<{ communityId: string; requestId: string;
    expectedRevision: number; terms: unknown; contractedChannels: number }>): PartnerAlertWriteResult {
    const actor = this.operator();
    const expected = partnerAlertInteger(input.expectedRevision, "expectedRevision", 1);
    const terms = parsePartnerAlertPublishingTerms(input.terms);
    if (terms.communityId !== input.communityId) throw new PartnerAlertValidationError("communityId");
    const quote = quotePartnerAlertPublishing({ terms, contractedChannels: input.contractedChannels,
      capabilities: this.authority.pricingCapabilities() });
    return this.write(actor, input.communityId, input.requestId, "agreement.proposed", { expected, terms, quote }, at => {
      const partner = this.partner(input.communityId, expected);
      if (partner.status === "ended") throw conflict();
      const latest = this.db.prepare("SELECT max(version) version FROM partner_alert_publishing_agreements WHERE community_id=?")
        .get(input.communityId) as { version: number | null };
      if (terms.version !== (latest.version ?? 0) + 1) throw conflict();
      this.db.prepare(`INSERT INTO partner_alert_publishing_agreements
        (agreement_id,community_id,version,terms_json,quote_json,contracted_channels,proposed_by_user_id,proposed_at_utc)
        VALUES(?,?,?,?,?,?,?,?)`).run(terms.termsId, input.communityId, terms.version, JSON.stringify(terms),
        JSON.stringify(quote), quote.contractedChannels, actor.userId, at);
      // A proposal cannot replace an accepted, paid agreement or change charges.
      return { communityId: input.communityId, partnerRevision: this.bump(partner, at),
        resourceId: terms.termsId, resourceVersion: terms.version, state: "proposed" };
    });
  }

  acceptPublishingAgreement(input: Readonly<{ communityId: string; requestId: string;
    expectedRevision: number; agreementId: string; rulesVersion: number; acceptsRedistribution: boolean }>): PartnerAlertWriteResult {
    const actor = this.owner(input.communityId);
    const expected = partnerAlertInteger(input.expectedRevision, "expectedRevision", 1);
    const agreementId = partnerAlertId(input.agreementId, "agreementId");
    if (input.rulesVersion !== RULES_VERSION || input.acceptsRedistribution !== true) {
      throw new PartnerAlertValidationError("consent", "Accept the current publishing agreement and redistribution rules.");
    }
    return this.write(actor, input.communityId, input.requestId, "agreement.accepted",
      { expected, agreementId, rulesVersion: RULES_VERSION, acceptsRedistribution: true }, at => {
        const partner = this.partner(input.communityId, expected); this.owned(partner, actor);
        this.community(input.communityId, actor.userId, actor.guildId, at);
        const agreement = this.db.prepare("SELECT * FROM partner_alert_publishing_agreements WHERE community_id=? ORDER BY version DESC LIMIT 1")
          .get(input.communityId) as AgreementRow | undefined;
        if (!agreement || agreement.agreement_id !== agreementId) throw conflict();
        if (this.db.prepare("SELECT 1 FROM partner_alert_agreement_acceptances WHERE agreement_id=?").get(agreementId)) throw conflict();
        this.db.prepare(`INSERT INTO partner_alert_agreement_acceptances
          (agreement_id,community_id,accepted_by_user_id,rules_version,accepted_at_utc) VALUES(?,?,?,?,?)`)
          .run(agreementId, input.communityId, actor.userId, RULES_VERSION, at);
        // Payment verification/activation is a later operation, not a consent side effect.
        return { communityId: input.communityId, partnerRevision: this.bump(partner, at),
          resourceId: agreementId, resourceVersion: agreement.version, state: "accepted" };
      });
  }

  submitRequest(input: Readonly<{ communityId: string; requestId: string; expectedRevision: number; rulesVersion?: number }>): PartnerAlertWriteResult {
    const actor = this.owner(input.communityId);
    const expected = partnerAlertInteger(input.expectedRevision, "expectedRevision", 1);
    if (input.rulesVersion !== RULES_VERSION) throw new PartnerAlertValidationError("consent");
    return this.write(actor, input.communityId, input.requestId, "partner.submitted", { expected, rulesVersion: input.rulesVersion }, at => {
      const partner = this.partner(input.communityId, expected); this.owned(partner, actor);
      this.community(input.communityId, actor.userId, actor.guildId, at);
      if (partner.review_requested || !["draft", "active", "setup_required"].includes(partner.status)) throw conflict();
      const mappings = this.db.prepare("SELECT * FROM partner_alert_mappings WHERE community_id=? AND review_state!='withdrawn'")
        .all(input.communityId) as MappingRow[];
      const offers = this.latestOffers(input.communityId);
      requirePartnerAlertOfferCoverage(input.communityId, mappings.map(mapping => mapping.mapping_id),
        offers.map(row => JSON.parse(row.offer_json) as unknown));
      for (const row of offers) this.verifyOffer(input.communityId, actor.userId,
        parsePartnerAlertCheckoutOffer(JSON.parse(row.offer_json)), at);
      this.db.prepare("UPDATE partner_alert_mappings SET review_state='awaiting_approval',updated_at_utc=? WHERE community_id=? AND review_state='draft'")
        .run(at, input.communityId);
      this.db.prepare("UPDATE partner_alert_offers SET review_state='awaiting_approval' WHERE community_id=? AND review_state='draft'")
        .run(input.communityId);
      this.db.prepare(`INSERT INTO partner_alert_application_consents
        (community_id,application_revision,rules_version,accepted_at_utc) VALUES (?,?,?,?)`)
        .run(input.communityId, expected + 1, RULES_VERSION, at);
      this.db.prepare("UPDATE partner_alert_partners SET submitted_application_revision=? WHERE community_id=?")
        .run(expected + 1, input.communityId);
      // Additional-channel requests do not pause already active unrelated mappings.
      const state = partner.status === "draft" ? "awaiting_approval" : partner.status;
      return { communityId: input.communityId, partnerRevision: this.bump(partner, at, state, 1),
        resourceId: input.communityId, resourceVersion: partner.revision + 1, state };
    });
  }

  confirmInspection(input: Readonly<{ communityId: string; requestId: string; expectedRevision: number }>): PartnerAlertWriteResult {
    const actor = this.operator();
    const expected = partnerAlertInteger(input.expectedRevision, "expectedRevision", 1);
    return this.write(actor, input.communityId, input.requestId, "partner.inspection_confirmed", { expected }, at => {
      const partner = this.partner(input.communityId, expected);
      this.community(input.communityId, partner.owner_user_id, partner.source_guild_id, at);
      const consent = this.readApplication(input.communityId, partner.submitted_application_revision);
      if (!partner.review_requested || !consent) throw conflict();
      this.db.prepare(`INSERT INTO partner_alert_application_inspections
        (community_id,application_revision,inspected_at_utc) VALUES (?,?,?)
        ON CONFLICT(community_id,application_revision) DO NOTHING`)
        .run(input.communityId, consent.application_revision, at);
      return { communityId: input.communityId, partnerRevision: this.bump(partner, at),
        resourceId: input.communityId, resourceVersion: consent.application_revision, state: partner.status };
    });
  }

  private readApplication(communityId: string, revision: number | null) {
    if (revision == null) return undefined;
    return this.db.prepare<[string, number, number], { application_revision: number; inspected_at_utc: string | null }>(
      `SELECT c.application_revision,i.inspected_at_utc
        FROM partner_alert_application_consents c LEFT JOIN partner_alert_application_inspections i
          ON i.community_id=c.community_id AND i.application_revision=c.application_revision
        WHERE c.community_id=? AND c.rules_version=? AND c.application_revision=?`,
    ).get(communityId, RULES_VERSION, revision);
  }

  approveMapping(input: Readonly<{ communityId: string; requestId: string; expectedRevision: number;
    mappingId: string; expectedMappingRevision: number; destinationChannelId: string; destinationRoleId: string }>): PartnerAlertWriteResult {
    const actor = this.operator();
    const expected = partnerAlertInteger(input.expectedRevision, "expectedRevision", 1);
    const mappingId = partnerAlertId(input.mappingId, "mappingId");
    const version = partnerAlertInteger(input.expectedMappingRevision, "expectedMappingRevision", 1);
    const channelId = partnerAlertSnowflake(input.destinationChannelId, "destinationChannelId");
    const roleId = partnerAlertSnowflake(input.destinationRoleId, "destinationRoleId");
    if (roleId === this.configuration.destinationGuildId) throw new PartnerAlertValidationError("destinationRoleId");
    return this.write(actor, input.communityId, input.requestId, "mapping.approved",
      { expected, mappingId, version, channelId, roleId }, at => {
        const partner = this.partner(input.communityId, expected);
        if (["suspended", "ended"].includes(partner.status)) throw conflict();
        this.community(input.communityId, partner.owner_user_id, partner.source_guild_id, at);
        const mapping = this.db.prepare("SELECT * FROM partner_alert_mappings WHERE community_id=? AND mapping_id=?")
          .get(input.communityId, mappingId) as MappingRow | undefined;
        if (!mapping || mapping.revision !== version || mapping.review_state !== "awaiting_approval"
          || mapping.source_channel_id === channelId) throw conflict();
        const proof = this.authority.requireResources({ communityId: input.communityId,
          sourceGuildId: partner.source_guild_id, sourceChannelId: mapping.source_channel_id,
          destinationGuildId: this.configuration.destinationGuildId,
          destinationChannelId: channelId, destinationRoleId: roleId });
        this.fresh(proof, at);
        if (proof.communityId !== input.communityId || proof.sourceGuildId !== partner.source_guild_id
          || proof.sourceChannelId !== mapping.source_channel_id || proof.destinationGuildId !== this.configuration.destinationGuildId
          || proof.destinationChannelId !== channelId || proof.destinationRoleId !== roleId
          || [proof.sourceTextChannel, proof.sourceReadable, proof.messageContentAvailable, proof.destinationReadOnly,
            proof.destinationPrivate, proof.destinationRoleManageable, proof.destinationRoleExclusiveToTradersLink].some(flag => flag !== true)) {
          throw new PartnerAlertRepositoryError("forbidden", "Verify both channels and the dedicated access role first.");
        }
        this.db.prepare(`UPDATE partner_alert_mappings SET destination_guild_id=?,destination_channel_id=?,
          destination_role_id=?,review_state='approved',approved_revision=revision,ever_approved=1,updated_at_utc=?
          WHERE community_id=? AND mapping_id=? AND revision=?`).run(this.configuration.destinationGuildId,
          channelId, roleId, at, input.communityId, mappingId, version);
        return { communityId: input.communityId, partnerRevision: this.bump(partner, at),
          resourceId: mappingId, resourceVersion: version, state: "approved" };
      });
  }

  approveOffer(input: Readonly<{ communityId: string; requestId: string; expectedRevision: number;
    offerId: string; offerVersion: number }>): PartnerAlertWriteResult {
    const actor = this.operator();
    const expected = partnerAlertInteger(input.expectedRevision, "expectedRevision", 1);
    const offerId = partnerAlertId(input.offerId, "offerId");
    const version = partnerAlertInteger(input.offerVersion, "offerVersion", 1);
    return this.write(actor, input.communityId, input.requestId, "offer.approved", { expected, offerId, version }, at => {
      const partner = this.partner(input.communityId, expected);
      this.community(input.communityId, partner.owner_user_id, partner.source_guild_id, at);
      const row = this.db.prepare("SELECT * FROM partner_alert_offers WHERE community_id=? AND offer_id=? ORDER BY version DESC LIMIT 1")
        .get(input.communityId, offerId) as OfferRow | undefined;
      if (!row || row.version !== version || row.review_state !== "awaiting_approval") throw conflict();
      const offer = parsePartnerAlertCheckoutOffer(JSON.parse(row.offer_json));
      this.verifyOffer(input.communityId, partner.owner_user_id, offer, at);
      for (const mappingId of offer.mappingIds) {
        if (!this.db.prepare("SELECT 1 FROM partner_alert_mappings WHERE community_id=? AND mapping_id=? AND review_state='approved' AND approved_revision=revision")
          .get(input.communityId, mappingId)) throw new PartnerAlertValidationError("mappingIds", "Approve the included channels first.");
      }
      this.db.prepare("UPDATE partner_alert_offers SET review_state='approved' WHERE community_id=? AND offer_id=? AND version=?")
        .run(input.communityId, offerId, version);
      return { communityId: input.communityId, partnerRevision: this.bump(partner, at),
        resourceId: offerId, resourceVersion: version, state: "approved" };
    });
  }

  approvePartner(input: Readonly<{ communityId: string; requestId: string; expectedRevision: number }>): PartnerAlertWriteResult {
    const actor = this.operator();
    const expected = partnerAlertInteger(input.expectedRevision, "expectedRevision", 1);
    return this.write(actor, input.communityId, input.requestId, "partner.approved", { expected }, at => {
      const partner = this.partner(input.communityId, expected);
      this.community(input.communityId, partner.owner_user_id, partner.source_guild_id, at);
      if (partner.review_requested !== 1 || ["suspended", "ended"].includes(partner.status)) throw conflict();
      const application = this.readApplication(input.communityId, partner.submitted_application_revision);
      if (!application?.inspected_at_utc) throw conflict();
      this.verifyApprovedPublishingSetup(partner, at);
      const state = partner.status === "active" ? "active" : "setup_required";
      const approved = this.db.prepare(`UPDATE partner_alert_application_inspections SET approved_at_utc=?
        WHERE community_id=? AND application_revision=? AND approved_at_utc IS NULL`)
        .run(at, input.communityId, application.application_revision);
      if (approved.changes !== 1) throw conflict();
      this.db.prepare("UPDATE partner_alert_partners SET approved_at_utc=?,approved_by_user_id=?,approved_application_revision=?,submitted_application_revision=NULL WHERE community_id=?")
        .run(at, actor.userId, application.application_revision, input.communityId);
      return { communityId: input.communityId, partnerRevision: this.bump(partner, at, state, 0),
        resourceId: input.communityId, resourceVersion: partner.revision + 1, state };
    });
  }

  private verifyApprovedPublishingSetup(partner: PartnerRow, at: string): readonly MappingRow[] {
    const mappings = this.db.prepare("SELECT * FROM partner_alert_mappings WHERE community_id=? AND review_state!='withdrawn'")
      .all(partner.community_id) as MappingRow[];
    const offers = this.latestOffers(partner.community_id);
    if (!mappings.length
      || mappings.some(mapping => mapping.review_state !== "approved" || mapping.approved_revision !== mapping.revision)
      || !offers.length || offers.some(offer => offer.review_state !== "approved")) {
      throw new PartnerAlertValidationError("approval", "Review all channels and offers first.");
    }
    const approvedOffers = requirePartnerAlertOfferCoverage(partner.community_id, mappings.map(mapping => mapping.mapping_id),
      offers.map(row => JSON.parse(row.offer_json) as unknown));
    for (const mapping of mappings) {
      if (!mapping.destination_guild_id || !mapping.destination_channel_id || !mapping.destination_role_id) throw conflict();
      const proof = this.authority.requireResources({ communityId: partner.community_id,
        sourceGuildId: partner.source_guild_id, sourceChannelId: mapping.source_channel_id,
        destinationGuildId: mapping.destination_guild_id, destinationChannelId: mapping.destination_channel_id,
        destinationRoleId: mapping.destination_role_id });
      this.fresh(proof, at);
      if (proof.communityId !== partner.community_id || proof.sourceGuildId !== partner.source_guild_id
        || proof.sourceChannelId !== mapping.source_channel_id || proof.destinationGuildId !== mapping.destination_guild_id
        || proof.destinationChannelId !== mapping.destination_channel_id || proof.destinationRoleId !== mapping.destination_role_id
        || [proof.sourceTextChannel, proof.sourceReadable, proof.messageContentAvailable, proof.destinationReadOnly,
          proof.destinationPrivate, proof.destinationRoleManageable,
          proof.destinationRoleExclusiveToTradersLink].some(flag => flag !== true)) {
        throw new PartnerAlertRepositoryError("forbidden", "Verify every approved channel and dedicated access role again.");
      }
    }
    for (const offer of approvedOffers) this.verifyOffer(partner.community_id, partner.owner_user_id, offer, at);
    return mappings;
  }

  activatePartner(input: Readonly<{ communityId: string; requestId: string; expectedRevision: number }>): PartnerAlertWriteResult {
    const actor = this.operator();
    const expected = partnerAlertInteger(input.expectedRevision, "expectedRevision", 1);
    return this.write(actor, input.communityId, input.requestId, "partner.activated", { expected }, at => {
      const partner = this.partner(input.communityId, expected);
      this.community(input.communityId, partner.owner_user_id, partner.source_guild_id, at);
      const application = this.db.prepare(`SELECT c.application_revision FROM partner_alert_application_consents c
        JOIN partner_alert_application_inspections i USING(community_id, application_revision)
        JOIN partner_alert_partners p ON p.community_id=c.community_id
        WHERE c.community_id=? AND c.application_revision=p.approved_application_revision
          AND c.rules_version=? AND c.accepted_at_utc<=i.inspected_at_utc
          AND i.inspected_at_utc<=i.approved_at_utc AND i.approved_at_utc<=?`).get(input.communityId, RULES_VERSION, at) as
        { application_revision: number } | undefined;
      const needsDeliveryRecovery = partner.status === "active" && this.db.prepare(`SELECT 1 FROM partner_alert_mappings
        WHERE community_id=? AND review_state='approved' AND delivery_state='paused' LIMIT 1`).get(input.communityId);
      if (!application || partner.review_requested
        || (partner.status !== "setup_required" && partner.status !== "publishing_paused" && !needsDeliveryRecovery)) throw conflict();
      if (this.configuration.subscriberAccessQualified?.() !== true) {
        throw new PartnerAlertRepositoryError("unavailable", "Subscriber access verification is unavailable.");
      }
      const mappings = this.verifyApprovedPublishingSetup(partner, at);
      const activate = this.db.prepare(`UPDATE partner_alert_mappings SET delivery_state='ready', activated_at_utc=?
        WHERE community_id=? AND mapping_id=? AND approved_revision=? AND review_state='approved'`);
      for (const mapping of mappings) {
        if (activate.run(at, input.communityId, mapping.mapping_id, mapping.revision).changes !== 1) throw conflict();
      }
      this.db.prepare("UPDATE partner_alert_partners SET activated_application_revision=? WHERE community_id=?")
        .run(application.application_revision, input.communityId);
      return { communityId: input.communityId, partnerRevision: this.bump(partner, at, "active", 0),
        resourceId: input.communityId, resourceVersion: application.application_revision, state: "active" };
    });
  }

  setPartnerState(input: Readonly<{ communityId: string; requestId: string; expectedRevision: number;
    state: "publishing_paused" | "suspended" | "ended" | "setup_required"; reason: string }>): PartnerAlertWriteResult {
    const actor = this.operator();
    const expected = partnerAlertInteger(input.expectedRevision, "expectedRevision", 1);
    const reason = partnerAlertText(input.reason, "reason", 500);
    if (!["publishing_paused", "suspended", "ended", "setup_required"].includes(input.state)) throw new PartnerAlertValidationError("state");
    return this.write(actor, input.communityId, input.requestId, "partner.state_changed",
      { expected, state: input.state, reason }, at => {
        const partner = this.partner(input.communityId, expected);
        if (partner.status === "ended" || (input.state === "setup_required"
          && (!["publishing_paused", "suspended"].includes(partner.status) || partner.approved_at_utc === null))) throw conflict();
        // This deliberately writes no subscriber, Whop, Discord or role row.
        this.audit(input.communityId, actor.userId, "partner.state_reason", input.communityId,
          { from: partner.status, to: input.state, reason }, at);
        return { communityId: input.communityId, partnerRevision: this.bump(partner, at, input.state, 0),
          resourceId: input.communityId, resourceVersion: partner.revision + 1, state: input.state };
      });
  }

  requestChanges(input: ApplicationDecisionInput): PartnerAlertWriteResult {
    return this.closeApplicationReview(input, "partner.changes_requested");
  }

  declinePartner(input: ApplicationDecisionInput): PartnerAlertWriteResult {
    return this.closeApplicationReview(input, "partner.declined");
  }

  private closeApplicationReview(input: ApplicationDecisionInput,
    action: "partner.changes_requested" | "partner.declined"): PartnerAlertWriteResult {
    const actor = this.operator();
    const expected = partnerAlertInteger(input.expectedRevision, "expectedRevision", 1);
    const reason = partnerAlertText(input.reason, "reason", 500);
    return this.write(actor, input.communityId, input.requestId, action, { expected, reason }, at => {
      const partner = this.partner(input.communityId, expected);
      if (partner.review_requested !== 1 || ["suspended", "ended"].includes(partner.status)) throw conflict();
      this.db.prepare(`UPDATE partner_alert_mappings SET review_state='draft',updated_at_utc=?
        WHERE community_id=? AND review_state='awaiting_approval' AND ever_approved=0`).run(at, input.communityId);
      this.db.prepare("UPDATE partner_alert_offers SET review_state='draft' WHERE community_id=? AND review_state='awaiting_approval'")
        .run(input.communityId);
      this.audit(input.communityId, actor.userId, "partner.review_note", input.communityId, { reason }, at);
      this.db.prepare("UPDATE partner_alert_partners SET submitted_application_revision=NULL WHERE community_id=?").run(input.communityId);
      const state = partner.approved_at_utc === null ? "draft" : partner.status;
      return { communityId: input.communityId, partnerRevision: this.bump(partner, at, state, 0),
        resourceId: input.communityId, resourceVersion: partner.revision + 1, state };
    });
  }

  withdrawMapping(input: Readonly<{ communityId: string; requestId: string; expectedRevision: number;
    mappingId: string; reason: string }>): PartnerAlertWriteResult {
    const actor = this.operator();
    const expected = partnerAlertInteger(input.expectedRevision, "expectedRevision", 1);
    const mappingId = partnerAlertId(input.mappingId, "mappingId");
    const reason = partnerAlertText(input.reason, "reason", 500);
    return this.write(actor, input.communityId, input.requestId, "mapping.withdrawn", { expected, mappingId, reason }, at => {
      const partner = this.partner(input.communityId, expected);
      const mapping = this.db.prepare("SELECT * FROM partner_alert_mappings WHERE community_id=? AND mapping_id=?")
        .get(input.communityId, mappingId) as MappingRow | undefined;
      if (!mapping || mapping.review_state === "withdrawn") throw conflict();
      this.db.prepare(`UPDATE partner_alert_mappings SET review_state='withdrawn',approved_revision=NULL,
        updated_at_utc=? WHERE community_id=? AND mapping_id=?`).run(at, input.communityId, mappingId);
      this.audit(input.communityId, actor.userId, "mapping.withdrawal_reason", mappingId, { reason }, at);
      return { communityId: input.communityId, partnerRevision: this.bump(partner, at),
        resourceId: mappingId, resourceVersion: mapping.revision, state: "withdrawn" };
    });
  }

  withdrawOffer(input: Readonly<{ communityId: string; requestId: string; expectedRevision: number;
    offerId: string; offerVersion: number; reason: string }>): PartnerAlertWriteResult {
    const actor = this.operator();
    const expected = partnerAlertInteger(input.expectedRevision, "expectedRevision", 1);
    const offerId = partnerAlertId(input.offerId, "offerId");
    const version = partnerAlertInteger(input.offerVersion, "offerVersion", 1);
    const reason = partnerAlertText(input.reason, "reason", 500);
    return this.write(actor, input.communityId, input.requestId, "offer.withdrawn", { expected, offerId, version, reason }, at => {
      const partner = this.partner(input.communityId, expected);
      const changed = this.db.prepare(`UPDATE partner_alert_offers SET review_state='withdrawn'
        WHERE community_id=? AND offer_id=? AND version=? AND review_state!='withdrawn'`)
        .run(input.communityId, offerId, version).changes;
      if (changed !== 1) throw conflict();
      this.audit(input.communityId, actor.userId, "offer.withdrawal_reason", offerId, { version, reason }, at);
      return { communityId: input.communityId, partnerRevision: this.bump(partner, at),
        resourceId: offerId, resourceVersion: version, state: "withdrawn" };
    });
  }

  private latestOffers(communityId: string): OfferRow[] {
    const rows = this.db.prepare(`SELECT o.* FROM partner_alert_offers o WHERE o.community_id=?
      AND o.version=(SELECT max(v.version) FROM partner_alert_offers v WHERE v.offer_id=o.offer_id)
      AND o.review_state!='withdrawn' ORDER BY o.offer_id LIMIT 251`).all(communityId) as OfferRow[];
    if (rows.length > PARTNER_ALERT_MAX_SELECTION) throw new PartnerAlertValidationError("offers");
    return rows;
  }

  private readAuthorizedPartner(communityId: string, audience: "owner" | "partner") {
    if (audience !== "owner" && audience !== "partner") throw new PartnerAlertValidationError("audience");
    const actor = audience === "owner" ? this.operator() : this.owner(communityId);
    const at = this.now();
    this.actor(actor, at);
    requirePlatformErasureWriter(this.db, actor.userId);
    const partner = this.partner(partnerAlertId(communityId, "communityId"));
    if (actor.kind === "community_owner") this.owned(partner, actor, true);
    return partner;
  }

  readPartner(communityId: string, audience: "owner" | "partner") {
    const partner = this.readAuthorizedPartner(communityId, audience);
    // Private agreements are intentionally absent from a subscriber/public read API.
    return { partner,
      application: this.readApplication(communityId, partner.review_requested
        ? partner.submitted_application_revision : partner.approved_application_revision),
      // Durable command revisions order decisions even when timestamps match.
      // Show only the reason for the application that has not yet been resubmitted.
      reviewFeedback: partner.review_requested ? undefined : this.db.prepare(`SELECT
        CASE json_extract(fingerprint_json,'$.action') WHEN 'partner.declined' THEN 'declined' ELSE 'changes_requested' END AS kind,
        json_extract(fingerprint_json,'$.payload.reason') AS reason
        FROM partner_alert_commands WHERE community_id=?
          AND json_extract(fingerprint_json,'$.action') IN ('partner.changes_requested','partner.declined')
          AND json_extract(result_json,'$.partnerRevision') > coalesce((SELECT max(application_revision)
            FROM partner_alert_application_consents WHERE community_id=partner_alert_commands.community_id),0)
        ORDER BY json_extract(result_json,'$.partnerRevision') DESC LIMIT 1`).get(communityId),
      mappings: this.db.prepare("SELECT * FROM partner_alert_mappings WHERE community_id=? ORDER BY mapping_id LIMIT 251").all(communityId) as MappingRow[],
      offers: this.latestOffers(communityId),
      approvedBeforeAmendment: this.db.prepare(`SELECT o.* FROM partner_alert_offers o WHERE o.community_id=?
        AND o.review_state='approved' AND o.version=${partnerAlertSaleVersionSql}
        AND EXISTS(SELECT 1 FROM partner_alert_offers pending WHERE pending.community_id=o.community_id
          AND pending.offer_id=o.offer_id AND pending.version>o.version AND pending.review_state IN ('draft','awaiting_approval'))
        ORDER BY o.offer_id LIMIT 251`).all(communityId) as OfferRow[],
      latestAgreement: this.db.prepare("SELECT * FROM partner_alert_publishing_agreements WHERE community_id=? ORDER BY version DESC LIMIT 1")
        .get(communityId) as AgreementRow | undefined,
      latestAgreementAcceptance: this.db.prepare(`SELECT x.agreement_id FROM partner_alert_agreement_acceptances x
        WHERE x.community_id=? AND x.agreement_id=(SELECT a.agreement_id FROM partner_alert_publishing_agreements a
          WHERE a.community_id=x.community_id ORDER BY a.version DESC LIMIT 1)`).get(communityId) as { agreement_id: string } | undefined,
    };
  }

  readDeliveryActivity(communityId: string, audience: "owner" | "partner", messageId: string | null) {
    this.readAuthorizedPartner(communityId, audience);
    requirePartnerAlertAdmission(this.db).assertCommunity(communityId);
    return readPartnerAlertDeliveryActivity(this.db, communityId, messageId, this.now());
  }

  readRoleReviewAssignment(review: PartnerAlertRoleReview): PartnerAlertReviewAssignment {
    this.operator();
    const events = this.db.prepare(`SELECT environment,whop_account_id,resource_kind,resource_id,payload_sha256
      FROM partner_alert_whop_inbox WHERE community_id=? AND event_id=? AND status!='completed' LIMIT 2`)
      .all(review.communityId, review.eventId) as { environment: "live" | "sandbox"; whop_account_id: string;
        resource_kind: string; resource_id: string; payload_sha256: string }[];
    if (events.length !== 1) throw conflict();
    const event = events[0]!;
    if (event.resource_kind === "account" || (event.resource_kind === "membership" && event.resource_id !== review.membershipId)) {
      throw conflict();
    }
    const rows = this.db.prepare(`SELECT j.user_id,j.discord_user_id,j.managed_assignment_ref,j.decision_revision,
        j.desired_ticket_json,m.source_guild_id,m.source_channel_id,m.destination_guild_id,m.destination_channel_id,
        m.destination_role_id,w.offer_id,w.offer_version,o.offer_json
      FROM partner_alert_memberships w
      JOIN partner_alert_offers o ON (o.community_id,o.offer_id,o.version)=(w.community_id,w.offer_id,w.offer_version)
      JOIN partner_alert_offer_channels c ON (c.community_id,c.offer_id,c.offer_version)=(w.community_id,w.offer_id,w.offer_version)
      JOIN partner_alert_mappings m ON (m.community_id,m.mapping_id)=(c.community_id,c.mapping_id)
      JOIN partner_alert_role_jobs j ON (j.community_id,j.mapping_id,j.user_id)=(m.community_id,m.mapping_id,w.user_id)
      WHERE w.community_id=? AND w.environment=? AND w.whop_account_id=? AND w.membership_id=? AND m.mapping_id=?
        AND m.ever_approved=1 AND j.managed_assignment_ref IS NOT NULL AND j.applied_present=1 AND j.lease_token IS NULL
      LIMIT 2`).all(review.communityId, event.environment, event.whop_account_id, review.membershipId, review.mappingId) as
      (MappingRow & { user_id: string; discord_user_id: string; managed_assignment_ref: string;
        decision_revision: number; desired_ticket_json: string; offer_id: string; offer_version: number; offer_json: string })[];
    if (rows.length !== 1) throw conflict();
    const row = rows[0]!;
    const core = requirePlatformErasureWriter(this.db);
    core.assertLivePrincipal(row.user_id);
    requirePartnerAlertAdmission(this.db).assertCommunity(review.communityId);
    const ticket = partnerAlertAccessTicket(JSON.parse(row.desired_ticket_json));
    const guildId = partnerAlertSnowflake(row.destination_guild_id, "destinationGuildId");
    const roleId = partnerAlertSnowflake(row.destination_role_id, "destinationRoleId");
    if (guildId !== this.configuration.destinationGuildId || ticket.context.guildId !== guildId
      || ticket.context.roleId !== roleId || ticket.context.userId !== row.user_id
      || ticket.context.communityId !== review.communityId || ticket.context.mappingId !== review.mappingId
      || ticket.context.linkedDiscordUserId !== row.discord_user_id) throw conflict();
    if (review.decision === "remove") {
      if (this.db.prepare("SELECT 1 FROM platform_premium_role_jobs WHERE guild_id=? AND role_id=? LIMIT 1").get(guildId, roleId)) {
        throw conflict();
      }
      // Favor preserving access whenever a stored service period is still open
      // or another purchase covering the same channel has an unresolved state.
      const competing = this.db.prepare(`SELECT 1 FROM partner_alert_memberships w
        JOIN partner_alert_offer_channels c ON (c.community_id,c.offer_id,c.offer_version)=(w.community_id,w.offer_id,w.offer_version)
        LEFT JOIN partner_alert_whop_paid_intervals p
        ON (p.community_id,p.user_id,p.offer_id,p.offer_version,p.environment,p.whop_account_id,p.membership_id)=
           (w.community_id,w.user_id,w.offer_id,w.offer_version,w.environment,w.whop_account_id,w.membership_id)
        WHERE w.community_id=? AND w.user_id=? AND w.environment=? AND c.mapping_id=?
          AND (p.ends_at_utc>? OR (w.state!='inactive' AND NOT(w.whop_account_id=? AND w.membership_id=?)))
        LIMIT 1`).get(review.communityId, row.user_id, event.environment, review.mappingId, this.now(),
        event.whop_account_id, review.membershipId);
      if (competing) throw conflict();
      const stripeEnvironment = this.configuration.stripeEnvironment;
      if (stripeEnvironment) {
        const stripe = readPartnerAlertStripeChannelFunding(this.db, { environment: stripeEnvironment,
          communityId: review.communityId, mappingId: review.mappingId, userId: row.user_id, atMs: Date.parse(this.now()) });
        if (stripe.paidOffers.length || stripe.holdRemoval) throw conflict();
      }
    }
    const offer = parsePartnerAlertOffer(JSON.parse(row.offer_json));
    if (offer.communityId !== review.communityId || offer.offerId !== row.offer_id || offer.version !== row.offer_version
      || !offer.mappingIds.includes(review.mappingId) || offer.whop.accountId !== event.whop_account_id
      || offer.whop.environment !== event.environment) throw conflict();
    return { environment: event.environment, accountId: event.whop_account_id, eventId: review.eventId,
      eventHash: event.payload_sha256, resourceKind: event.resource_kind, resourceId: event.resource_id, communityId: review.communityId, mappingId: review.mappingId,
      sourceGuildId: row.source_guild_id, sourceChannelId: row.source_channel_id, guildId,
      channelId: partnerAlertSnowflake(row.destination_channel_id, "destinationChannelId"), roleId,
      discordUserId: partnerAlertSnowflake(row.discord_user_id, "discordUserId"), userId: row.user_id,
      assignmentRef: row.managed_assignment_ref, revision: row.decision_revision,
      authorityKey: ticket.premium.scope.authorityKey, offerId: row.offer_id, offerVersion: row.offer_version, offer };
  }

  recordRoleReview(review: PartnerAlertRoleReview, assignment: PartnerAlertReviewAssignment,
    operationId: string, phase: "decision" | "removed" | "unconfirmed"): void {
    const actor = this.operator();
    partnerAlertId(operationId, "operationId");
    const current = this.readRoleReviewAssignment(review);
    if (JSON.stringify(current) !== JSON.stringify(assignment)) throw conflict();
    const assignmentFingerprint = createHash("sha256").update(assignment.assignmentRef).digest("hex");
    if (phase !== "decision") {
      if (review.decision !== "remove" || !this.db.prepare(`SELECT 1 FROM partner_alert_audit_events
        WHERE community_id=? AND actor_user_id=? AND action='role_review.decision' AND resource_id=?
          AND json_extract(detail_json,'$.operationId')=? AND json_extract(detail_json,'$.mappingId')=?
          AND json_extract(detail_json,'$.eventHash')=? AND json_extract(detail_json,'$.assignmentFingerprint')=?
          AND json_extract(detail_json,'$.decision')='remove'`)
        .get(assignment.communityId, actor.userId, assignment.eventId, operationId, assignment.mappingId, assignment.eventHash, assignmentFingerprint)) throw conflict();
    }
    if (phase === "removed") {
      const result = this.db.prepare(`UPDATE partner_alert_role_jobs SET applied_present=0,desired_present=0,
        refresh_required=0,status='applied',decision_revision=decision_revision+1,last_error_code=NULL
        WHERE community_id=? AND mapping_id=? AND user_id=? AND discord_user_id=? AND managed_assignment_ref=?
          AND decision_revision=? AND lease_token IS NULL AND applied_present=1`).run(assignment.communityId,
        assignment.mappingId, assignment.userId, assignment.discordUserId, assignment.assignmentRef, assignment.revision);
      if (result.changes !== 1) throw conflict();
    }
    this.audit(assignment.communityId, actor.userId, `role_review.${phase}`, assignment.eventId, {
      operationId, decision: review.decision, eventHash: assignment.eventHash, assignmentFingerprint, mappingId: assignment.mappingId,
      offerId: assignment.offerId, offerVersion: assignment.offerVersion,
      evidenceNoteSha256: createHash("sha256").update(review.evidenceNote).digest("hex"),
    }, this.now());
  }

  listRoleReviewEvents(limit = 50): readonly Readonly<{
    communityId: string; environment: "sandbox" | "live"; accountId: string; eventId: string;
    eventType: string; resourceKind: string; resourceId: string; occurredAtUtc: string;
    provider?: "stripe"; allowRemove?: boolean; communityName?: string; offerTitle?: string;
  }>[] {
    this.operator();
    partnerAlertInteger(limit, "limit", 1, 100);
    const whop = this.db.prepare(`SELECT community_id AS communityId, environment, whop_account_id AS accountId,
      event_id AS eventId, event_type AS eventType, resource_kind AS resourceKind, resource_id AS resourceId,
      occurred_at_utc AS occurredAtUtc FROM partner_alert_whop_inbox
      WHERE status!='completed' ORDER BY received_at_utc,community_id,environment,whop_account_id,event_id LIMIT ?`).all(limit) as
      ReturnType<PartnerAlertRepository["listRoleReviewEvents"]>;
    const env = this.configuration.stripeEnvironment;
    if (!env) return whop;
    const stripe = this.db.prepare(`SELECT e.community_id AS communityId,e.environment,e.stripe_account_id AS accountId,
      e.event_id AS eventId,CASE WHEN e.kind='charge.dispute.created' AND r.disposition='remove_candidate'
        THEN 'charge.dispute.closed' ELSE e.kind END AS eventType,'purchase' AS resourceKind,e.resource_id AS resourceId,
      strftime('%Y-%m-%dT%H:%M:%fZ',e.received_at_ms/1000.0,'unixepoch') AS occurredAtUtc,
      'stripe' AS provider,r.disposition='remove_candidate' AS allowRemove,p.display_name AS communityName,
      json_extract(o.offer_json,'$.title') AS offerTitle
      FROM partner_alert_stripe_review_decisions r
      JOIN partner_alert_stripe_events e ON e.environment=r.environment AND e.stripe_account_id=r.stripe_account_id
        AND e.event_id=r.event_id AND e.claim_id=r.claim_id
      JOIN partner_alert_stripe_checkout_claims c ON c.claim_id=r.claim_id
      JOIN partner_alert_partners p ON p.community_id=c.community_id
      JOIN partner_alert_offers o ON o.community_id=c.community_id AND o.offer_id=c.offer_id AND o.version=c.offer_version
      WHERE e.environment=? AND e.status='review' AND r.decision='pending'
      ORDER BY e.received_at_ms,e.event_id LIMIT ?`).all(env, limit) as
      (Omit<ReturnType<PartnerAlertRepository["listRoleReviewEvents"]>[number], "allowRemove"> & { allowRemove: number })[];
    return [...stripe.map(item => ({ ...item, allowRemove: item.allowRemove === 1 })), ...whop].slice(0, limit);
  }

  listReviewRequests(limit = 50): readonly Readonly<{
    community_id: string; display_name: string; status: PartnerState; revision: number;
    channel_count: number; agreement_type: string | null; submitted_at_utc: string;
  }>[] {
    this.operator(); partnerAlertInteger(limit, "limit", 1, 100);
    return this.db.prepare(`SELECT p.community_id,p.display_name,p.status,p.revision,p.updated_at_utc submitted_at_utc,
      (SELECT count(*) FROM partner_alert_mappings m WHERE m.community_id=p.community_id AND m.review_state!='withdrawn') channel_count,
      (SELECT json_extract(a.terms_json,'$.pricingSource') FROM partner_alert_publishing_agreements a
       WHERE a.community_id=p.community_id ORDER BY a.version DESC LIMIT 1) agreement_type
      FROM partner_alert_partners p WHERE p.review_requested=1 ORDER BY p.updated_at_utc,p.community_id LIMIT ?`).all(limit) as
      { community_id: string; display_name: string; status: PartnerState; revision: number;
        channel_count: number; agreement_type: string | null; submitted_at_utc: string }[];
  }
}

/** Local refresh fanout only. It never turns an eligibility bit/expiry into a
 * role decision. The original Premium outbox event/ticket survives projection.
 * Actual current-principal erasure admission is unbound, including for expired
 * events; a fresh capture must not replace the event's original ticket. */
export class PartnerAlertPremiumRefreshRepository {
  constructor(private readonly db: Database.Database,
    private readonly configuration: Readonly<{ enabled?: boolean; nowUtc: () => string }>,
    private readonly writer: PremiumAdmittedImmediateWriter | null = null,
    private readonly admitRefresh: ((original: PlatformPremiumTicket) => boolean) | null = null) {}
  private write<T>(operation: () => T): T {
    if (this.configuration.enabled !== true || !this.writer || !this.admitRefresh) throw new PartnerAlertValidationError("refreshUnbound");
    return this.writer.run(() => {
      requirePlatformErasureWriter(this.db);
      if (this.writer!.isCurrentWriter() !== true || !this.db.inTransaction) throw new PartnerAlertValidationError("admissionUnbound");
      return this.db.transaction(operation)();
    });
  }
  private event(input: unknown): PlatformPremiumEligibilityEvent {
    try { return parsePlatformPremiumEligibilityEvent(input); }
    catch { throw new PartnerAlertValidationError("premiumEvent"); }
  }
  enqueue(input: PlatformPremiumEligibilityEvent, reason: "observation" | "expiry"): boolean {
    if (this.configuration.enabled !== true || !this.writer || !this.admitRefresh) return false;
    const event = this.event(input);
    if (!["observation", "expiry"].includes(reason)) throw new PartnerAlertValidationError("refreshReason");
    const text = JSON.stringify(event);
    if (text.length > 262144) throw new PartnerAlertValidationError("premiumEvent");
    return this.write(() => {
      // This is actual principal/erasure admission for a refresh ONLY, not
      // isCurrent(expiredTicket) and never payment or role authority.
      if (this.admitRefresh!(event.ticket) !== true || !requirePartnerAlertAdmission(this.db).admitStoredRefresh(event.ticket)) return false;
      const key = [event.authorityKey,event.authorityRevision,event.observedAtUtc,reason];
      const old = this.db.prepare(`SELECT event_json FROM partner_alert_premium_refresh_events
        WHERE authority_key=? AND authority_revision=? AND observed_at_utc=? AND reason=?`).get(...key) as { event_json: string } | undefined;
      if (old) {
        // Compare the canonical meaning without rewriting historical raw JSON.
        // This admits legacy key order while retaining protocol/state and the
        // exact original ticket; current unknown never becomes period false.
        if (JSON.stringify(this.event(JSON.parse(old.event_json))) !== text) {
          throw new PartnerAlertValidationError("eventConflict");
        }
        return true;
      }
      this.db.prepare(`INSERT INTO partner_alert_premium_refresh_events
        (authority_key,user_id,authority_revision,observed_at_utc,reason,event_json) VALUES(?,?,?,?,?,?)`)
        .run(event.authorityKey,event.scope.userId,event.authorityRevision,event.observedAtUtc,reason,text);
      return true;
    });
  }
  projectPending(maximum = 20): number {
    if (this.configuration.enabled !== true || !this.writer || !this.admitRefresh) return 0;
    partnerAlertInteger(maximum, "maximum", 1, 100);
    return this.write(() => {
      const rows = this.db.prepare(`SELECT authority_key,authority_revision,observed_at_utc,reason,event_json
        FROM partner_alert_premium_refresh_events WHERE processed_at_utc IS NULL
        ORDER BY observed_at_utc,authority_key LIMIT ?`).all(maximum) as {
          authority_key: string; authority_revision: number; observed_at_utc: string; reason: string; event_json: string }[];
      let count = 0;
      for (const row of rows) {
        if (row.event_json.length > 262144) throw new PartnerAlertValidationError("premiumEvent");
        const event = this.event(JSON.parse(row.event_json) as PlatformPremiumEligibilityEvent);
        if (event.authorityKey !== row.authority_key || event.authorityRevision !== row.authority_revision
          || event.observedAtUtc !== row.observed_at_utc || this.admitRefresh!(event.ticket) !== true
          || !requirePartnerAlertAdmission(this.db).admitStoredRefresh(event.ticket)) continue;
        this.db.prepare(`UPDATE partner_alert_role_jobs SET refresh_required=1,
          last_error_code=CASE WHEN last_error_code IN ('permission_required','role_missing') THEN last_error_code ELSE 'refresh_requested' END,
          status=CASE WHEN status IN ('applying','uncertain') THEN status ELSE 'held' END
          WHERE user_id=? AND json_extract(desired_ticket_json,'$.premium.scope.authorityKey')=?`)
          .run(event.scope.userId,event.authorityKey);
        this.db.prepare(`UPDATE partner_alert_premium_refresh_events SET processed_at_utc=?
          WHERE authority_key=? AND authority_revision=? AND observed_at_utc=? AND reason=?`)
          .run(partnerAlertUtc(this.configuration.nowUtc(), "nowUtc"),row.authority_key,row.authority_revision,row.observed_at_utc,row.reason);
        count += 1;
      }
      return count;
    });
  }
}
