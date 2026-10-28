import type Database from "better-sqlite3";
import { PartnerAlertValidationError, type PartnerAlertOffer } from "../contracts/partner-alert-contracts";
import {
  PARTNER_ALERT_MAX_SELECTION, parsePartnerAlertContentPolicy, parsePartnerAlertOffer,
  parsePartnerAlertPublishingTerms, partnerAlertId, partnerAlertInteger,
  partnerAlertSnowflake, partnerAlertText, partnerAlertUtc,
} from "../contracts/partner-alert-validation";
import { quotePartnerAlertPublishing } from "../contracts/partner-alert-publishing-pricing";
import type {
  PartnerAlertActorReceipt, PartnerAlertAuthority, PartnerAlertCommunityOwnerActor,
  PartnerAlertOperatorActor, PartnerAlertRepositoryConfiguration,
} from "./partner-alert-authority";
import { premiumScope, premiumTicket, premiumUtc, samePremiumScope,
  type PlatformPremiumTicket } from "../../platform/contracts/platform-premium-access";
import type { PlatformPremiumEligibilityEvent } from "../../platform/server/membership/platform-premium-role-repository";
import type { PremiumAdmittedImmediateWriter } from "../../platform/server/membership/platform-premium-current-authority";

type PartnerState = "draft" | "awaiting_approval" | "setup_required" | "active"
  | "publishing_paused" | "suspended" | "ended";
type PartnerRow = {
  community_id: string; owner_user_id: string; source_guild_id: string;
  display_name: string; content_policy_json: string; status: PartnerState;
  review_requested: number; revision: number; current_agreement_id: string | null;
  approved_at_utc: string | null; approved_by_user_id: string | null;
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
    if (actor.kind !== "operator" || actor.authority !== "platform_owner") {
      throw new PartnerAlertRepositoryError("forbidden", "Owner approval is required.");
    }
    return actor;
  }
  private owner(communityId: string): PartnerAlertCommunityOwnerActor {
    partnerAlertId(communityId, "communityId");
    const actor = this.authority.requireCommunityOwner(communityId); this.actor(actor, this.now());
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
    const fingerprint = JSON.stringify({ action, communityId, payload });
    if (fingerprint.length > 64_000) throw new PartnerAlertValidationError("request");
    return this.db.transaction(() => {
      const at = this.now(); this.actor(actor, at);
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
    displayName: string; contentPolicy: unknown }>): PartnerAlertWriteResult {
    const actor = this.owner(input.communityId);
    const expected = partnerAlertInteger(input.expectedRevision, "expectedRevision");
    const displayName = partnerAlertText(input.displayName, "displayName");
    const policy = parsePartnerAlertContentPolicy(input.contentPolicy);
    return this.write(actor, input.communityId, input.requestId, "partner.draft_saved",
      { expected, displayName, policy }, at => {
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

  private verifyOffer(communityId: string, ownerUserId: string, offer: PartnerAlertOffer, at: string): void {
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
    const offer = parsePartnerAlertOffer(input.offer);
    if (offer.communityId !== input.communityId) throw new PartnerAlertValidationError("communityId");
    return this.write(actor, input.communityId, input.requestId, "offer.version_saved", { expected, offer }, at => {
      const partner = this.partner(input.communityId, expected); this.owned(partner, actor);
      this.community(input.communityId, actor.userId, actor.guildId, at);
      this.verifyOffer(input.communityId, partner.owner_user_id, offer, at);
      const previous = this.db.prepare("SELECT * FROM partner_alert_offers WHERE offer_id=? ORDER BY version DESC LIMIT 1")
        .get(offer.offerId) as OfferRow | undefined;
      if (previous && previous.community_id !== input.communityId) throw conflict();
      if (offer.version !== (previous?.version ?? 0) + 1) throw conflict();
      const priorBindings = this.db.prepare(`SELECT offer_json FROM partner_alert_offers
        WHERE whop_environment=? AND whop_account_id=? AND whop_plan_id=?`)
        .all(offer.whop.environment, offer.whop.accountId, offer.whop.planId) as { offer_json: string }[];
      const benefits = (value: PartnerAlertOffer) => JSON.stringify({ kind: value.kind, mappings: value.mappingIds,
        amount: value.amountMinor, currency: value.currency, cadence: value.cadence });
      if (priorBindings.some(row => benefits(parsePartnerAlertOffer(JSON.parse(row.offer_json))) !== benefits(offer))) {
        throw new PartnerAlertValidationError("whop.planId",
          "Use a new Whop plan when changing a subscription’s price or included channels.");
      }
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
      const collision = this.db.prepare(`SELECT 1 FROM partner_alert_offers WHERE whop_environment=?
        AND whop_account_id=? AND whop_plan_id=? AND offer_id!=? LIMIT 1`)
        .get(offer.whop.environment, offer.whop.accountId, offer.whop.planId, offer.offerId);
      if (collision) throw new PartnerAlertValidationError("whop.planId", "This Whop plan is already assigned to another offer.");
      this.db.prepare(`INSERT INTO partner_alert_offers
        (offer_id,community_id,version,kind,offer_json,whop_environment,whop_account_id,whop_product_id,whop_plan_id,review_state,created_at_utc)
        VALUES(?,?,?,?,?,?,?,?,?,'draft',?)`).run(offer.offerId, input.communityId, offer.version, offer.kind,
        JSON.stringify(offer), offer.whop.environment, offer.whop.accountId, offer.whop.productId, offer.whop.planId, at);
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

  submitRequest(input: Readonly<{ communityId: string; requestId: string; expectedRevision: number }>): PartnerAlertWriteResult {
    const actor = this.owner(input.communityId);
    const expected = partnerAlertInteger(input.expectedRevision, "expectedRevision", 1);
    return this.write(actor, input.communityId, input.requestId, "partner.submitted", { expected }, at => {
      const partner = this.partner(input.communityId, expected); this.owned(partner, actor);
      this.community(input.communityId, actor.userId, actor.guildId, at);
      const agreement = this.latestAcceptedAgreement(input.communityId);
      if (!agreement) throw new PartnerAlertValidationError("agreement", "Accept the publishing agreement first.");
      const mappings = this.db.prepare("SELECT * FROM partner_alert_mappings WHERE community_id=? AND review_state!='withdrawn'")
        .all(input.communityId) as MappingRow[];
      if (!mappings.length || mappings.length > agreement.contracted_channels) {
        throw new PartnerAlertValidationError("mappings", "Choose an agreement covering the requested channels.");
      }
      const offers = this.latestOffers(input.communityId);
      if (!offers.length || mappings.some(mapping => !offers.some(row => {
        const offer = parsePartnerAlertOffer(JSON.parse(row.offer_json));
        return offer.kind === "channel" && offer.mappingIds.includes(mapping.mapping_id);
      }))) {
        throw new PartnerAlertValidationError("offers", "Add an individual subscription offer for every requested channel.");
      }
      for (const row of offers) this.verifyOffer(input.communityId, actor.userId,
        parsePartnerAlertOffer(JSON.parse(row.offer_json)), at);
      this.db.prepare("UPDATE partner_alert_mappings SET review_state='awaiting_approval',updated_at_utc=? WHERE community_id=? AND review_state='draft'")
        .run(at, input.communityId);
      this.db.prepare("UPDATE partner_alert_offers SET review_state='awaiting_approval' WHERE community_id=? AND review_state='draft'")
        .run(input.communityId);
      // Additional-channel requests do not pause already active unrelated mappings.
      const state = partner.status === "draft" ? "awaiting_approval" : partner.status;
      return { communityId: input.communityId, partnerRevision: this.bump(partner, at, state, 1),
        resourceId: input.communityId, resourceVersion: partner.revision + 1, state };
    });
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
      const offer = parsePartnerAlertOffer(JSON.parse(row.offer_json));
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
      const agreement = this.latestAcceptedAgreement(input.communityId);
      const mappings = this.db.prepare("SELECT * FROM partner_alert_mappings WHERE community_id=? AND review_state!='withdrawn'")
        .all(input.communityId) as MappingRow[];
      const offers = this.latestOffers(input.communityId);
      if (!agreement || !mappings.length || mappings.length > agreement.contracted_channels
        || mappings.some(mapping => mapping.review_state !== "approved" || mapping.approved_revision !== mapping.revision)
        || !offers.length || offers.some(offer => offer.review_state !== "approved")
        || mappings.some(mapping => !offers.some(row => {
          const offer = parsePartnerAlertOffer(JSON.parse(row.offer_json));
          return offer.kind === "channel" && offer.mappingIds.includes(mapping.mapping_id);
        }))) {
        throw new PartnerAlertValidationError("approval", "Review all channels, offers and the accepted agreement first.");
      }
      const state = partner.status === "active" ? "active" : "setup_required";
      this.db.prepare("UPDATE partner_alert_partners SET approved_at_utc=?,approved_by_user_id=? WHERE community_id=?")
        .run(at, actor.userId, input.communityId);
      return { communityId: input.communityId, partnerRevision: this.bump(partner, at, state, 0),
        resourceId: input.communityId, resourceVersion: partner.revision + 1, state };
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

  requestChanges(input: Readonly<{ communityId: string; requestId: string; expectedRevision: number;
    reason: string }>): PartnerAlertWriteResult {
    const actor = this.operator();
    const expected = partnerAlertInteger(input.expectedRevision, "expectedRevision", 1);
    const reason = partnerAlertText(input.reason, "reason", 500);
    return this.write(actor, input.communityId, input.requestId, "partner.changes_requested", { expected, reason }, at => {
      const partner = this.partner(input.communityId, expected);
      if (partner.review_requested !== 1 || ["suspended", "ended"].includes(partner.status)) throw conflict();
      this.db.prepare(`UPDATE partner_alert_mappings SET review_state='draft',updated_at_utc=?
        WHERE community_id=? AND review_state='awaiting_approval' AND ever_approved=0`).run(at, input.communityId);
      this.db.prepare("UPDATE partner_alert_offers SET review_state='draft' WHERE community_id=? AND review_state='awaiting_approval'")
        .run(input.communityId);
      this.audit(input.communityId, actor.userId, "partner.review_note", input.communityId, { reason }, at);
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

  private latestAcceptedAgreement(communityId: string): AgreementRow | undefined {
    return this.db.prepare(`SELECT a.* FROM partner_alert_publishing_agreements a
      JOIN partner_alert_agreement_acceptances receipt ON receipt.agreement_id=a.agreement_id
      AND receipt.community_id=a.community_id WHERE a.community_id=? ORDER BY a.version DESC LIMIT 1`)
      .get(communityId) as AgreementRow | undefined;
  }
  private latestOffers(communityId: string): OfferRow[] {
    const rows = this.db.prepare(`SELECT o.* FROM partner_alert_offers o WHERE o.community_id=?
      AND o.version=(SELECT max(v.version) FROM partner_alert_offers v WHERE v.offer_id=o.offer_id)
      AND o.review_state!='withdrawn' ORDER BY o.offer_id LIMIT 251`).all(communityId) as OfferRow[];
    if (rows.length > PARTNER_ALERT_MAX_SELECTION) throw new PartnerAlertValidationError("offers");
    return rows;
  }

  readPartner(communityId: string, audience: "owner" | "partner") {
    if (audience !== "owner" && audience !== "partner") throw new PartnerAlertValidationError("audience");
    const actor = audience === "owner" ? this.operator() : this.owner(communityId);
    const at = this.now();
    this.actor(actor, at);
    const partner = this.partner(partnerAlertId(communityId, "communityId"));
    if (actor.kind === "community_owner") this.owned(partner, actor, true);
    // Private agreements are intentionally absent from a subscriber/public read API.
    return { partner,
      mappings: this.db.prepare("SELECT * FROM partner_alert_mappings WHERE community_id=? ORDER BY mapping_id LIMIT 251").all(communityId) as MappingRow[],
      offers: this.latestOffers(communityId),
      latestAgreement: this.db.prepare("SELECT * FROM partner_alert_publishing_agreements WHERE community_id=? ORDER BY version DESC LIMIT 1")
        .get(communityId) as AgreementRow | undefined,
    };
  }

  listReviewRequests(limit = 50): readonly Readonly<{
    community_id: string; display_name: string; status: PartnerState; revision: number;
  }>[] {
    this.operator(); partnerAlertInteger(limit, "limit", 1, 100);
    return this.db.prepare(`SELECT community_id,display_name,status,revision FROM partner_alert_partners
      WHERE review_requested=1 ORDER BY updated_at_utc,community_id LIMIT ?`).all(limit) as
      { community_id: string; display_name: string; status: PartnerState; revision: number }[];
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
      if (this.writer!.isCurrentWriter() !== true || !this.db.inTransaction) throw new PartnerAlertValidationError("admissionUnbound");
      return this.db.transaction(operation)();
    });
  }
  private event(input: PlatformPremiumEligibilityEvent): PlatformPremiumEligibilityEvent {
    const ticket = premiumTicket(input.ticket); const scope = premiumScope(input.scope);
    const at = premiumUtc(input.observedAtUtc);
    const until = input.validUntilUtc === null ? null : premiumUtc(input.validUntilUtc);
    const through = input.paidThroughUtc === null ? null : premiumUtc(input.paidThroughUtc);
    if (!samePremiumScope(ticket.scope, scope) || ticket.authorityRevision !== input.authorityRevision
      || scope.authorityKey !== input.authorityKey || at < ticket.observedAtUtc || at >= ticket.validUntilUtc
      || typeof input.paidEligible !== "boolean" || (until !== null && until > ticket.validUntilUtc)
      || (input.paidEligible ? until === null || until <= at || through === null || through <= at : until !== null || through !== null)) {
      throw new PartnerAlertValidationError("premiumEvent");
    }
    return Object.freeze({ ticket, scope: ticket.scope, authorityKey: ticket.scope.authorityKey,
      authorityRevision: ticket.authorityRevision, paidEligible: input.paidEligible,
      paidThroughUtc: through, observedAtUtc: at, validUntilUtc: until });
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
      if (this.admitRefresh!(event.ticket) !== true) return false;
      const key = [event.authorityKey,event.authorityRevision,event.observedAtUtc,reason];
      const old = this.db.prepare(`SELECT event_json FROM partner_alert_premium_refresh_events
        WHERE authority_key=? AND authority_revision=? AND observed_at_utc=? AND reason=?`).get(...key) as { event_json: string } | undefined;
      if (old) {
        if (old.event_json !== text) throw new PartnerAlertValidationError("eventConflict");
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
          || event.observedAtUtc !== row.observed_at_utc || this.admitRefresh!(event.ticket) !== true) continue;
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
