import { createHash } from "node:crypto";
import type Database from "better-sqlite3";
import type { PlatformPremiumTicket } from "../../platform/contracts/platform-premium-access";
import { requirePlatformErasureWriter } from "../../platform/server/privacy/platform-erasure-admission";
import { partnerAlertAccessTicket, PartnerAlertValidationError,
  type PartnerAlertAccessTicket, type PartnerAlertContextTicket } from "../contracts/partner-alert-contracts";

import { PARTNER_ALERT_CONTEXT_SCHEMA_STATEMENTS } from "./database/partner-alert-context-schema";
import { readPartnerAlertStripeContextFacts } from "./database/partner-alert-stripe-channel-funding";
export { PARTNER_ALERT_CONTEXT_SCHEMA_STATEMENTS };

const digest = (value: unknown): string => createHash("sha256").update(JSON.stringify(value)).digest("hex");
type Mapping = { community_id: string; mapping_id: string; owner_user_id: string; destination_guild_id: string;
  destination_role_id: string | null; revision: number; partner_revision: number; configuration_ref: string;
  context_revision: number; provider_generation: number; policy_generation: number };

/** Captures and validates current context on the SAME privately owned writer.
 * This issues no paid proof and never adopts/replaces an original queued ticket. */
export class PartnerAlertCurrentContext {
  constructor(private readonly database: Database.Database) {}
  private facts(premium: PlatformPremiumTicket, mappingId: string) {
    const core = requirePlatformErasureWriter(this.database, premium.scope.userId);
    if (!core.memberRepository(premium.scope.userId).isCurrentV2(premium)) throw new PartnerAlertValidationError("premiumChanged");
    const mapping = this.database.prepare(`SELECT m.*,p.owner_user_id,p.revision partner_revision,
      e.revision context_revision,e.provider_generation,e.policy_generation,e.configuration_ref
      FROM partner_alert_mappings m JOIN partner_alert_partners p USING(community_id)
      JOIN partner_alert_context_epochs e USING(community_id) WHERE m.mapping_id=?`)
      .get(mappingId) as Mapping | undefined;
    if (!mapping || !mapping.destination_role_id || mapping.destination_guild_id !== premium.scope.guildId) {
      throw new PartnerAlertValidationError("mappingContext");
    }
    // Both the subscriber and the publishing principal must remain admitted.
    core.assertCurrent(mapping.owner_user_id);
    const partner = this.database.prepare("SELECT * FROM partner_alert_partners WHERE community_id=?").get(mapping.community_id);
    const connections = this.database.prepare(`SELECT community_id,environment,whop_account_id,status,
      verified_at_utc,valid_until_utc,owner_user_ref,encrypted_authorisation_json FROM partner_alert_whop_connections
      WHERE community_id=? ORDER BY environment,whop_account_id`).all(mapping.community_id);
    const identities = this.database.prepare("SELECT * FROM partner_alert_whop_identities WHERE user_id=? ORDER BY environment,whop_user_ref")
      .all(premium.scope.userId);
    const memberships = this.database.prepare("SELECT * FROM partner_alert_memberships WHERE community_id=? AND user_id=? ORDER BY membership_id")
      .all(mapping.community_id, premium.scope.userId);
    const offers = this.database.prepare(`SELECT o.*,c.mapping_id FROM partner_alert_offers o
      JOIN partner_alert_offer_channels c ON c.community_id=o.community_id AND c.offer_id=o.offer_id AND c.offer_version=o.version
      WHERE o.community_id=? AND c.mapping_id=? ORDER BY o.offer_id,o.version`).all(mapping.community_id, mapping.mapping_id);
    const facts = [mapping, partner, connections, identities, memberships, offers];
    if (this.database.prepare("SELECT 1 FROM sqlite_schema WHERE type='table' AND name='partner_alert_whop_discovery'").get()) {
      const receiptRows = this.database.prepare(`SELECT d.*,p.membership_id,p.starts_at_utc,p.ends_at_utc
        FROM partner_alert_whop_discovery d LEFT JOIN partner_alert_whop_paid_intervals p
        USING (community_id,user_id,offer_id,offer_version,environment,whop_account_id)
        JOIN partner_alert_offer_channels c ON (c.community_id,c.offer_id,c.offer_version)=(d.community_id,d.offer_id,d.offer_version)
        WHERE d.community_id=? AND d.user_id=? AND c.mapping_id=?
        ORDER BY d.offer_id,d.offer_version,d.environment,d.whop_account_id,p.membership_id LIMIT 1001`)
        .all(mapping.community_id, premium.scope.userId, mapping.mapping_id);
      if (receiptRows.length > 1000) throw new PartnerAlertValidationError("coverageLimit");
      facts.push(receiptRows);
    }
    if (this.database.prepare("SELECT 1 FROM sqlite_schema WHERE type='table' AND name='partner_alert_stripe_checkout_claims'").get()) {
      const stripe = readPartnerAlertStripeContextFacts(this.database, {
        communityId: mapping.community_id, mappingId: mapping.mapping_id, userId: premium.scope.userId,
      });
      if (stripe.length) facts.push(stripe);
    }
    return { core, mapping, factsSha256: digest(facts), offerFactsSha256: digest(offers) };
  }
  capture(premium: PlatformPremiumTicket, mappingId: string): PartnerAlertAccessTicket {
    const { core, mapping: m, factsSha256, offerFactsSha256 } = this.facts(premium, mappingId);
    const life = core.lifecycle(premium.scope.userId);
    const context: PartnerAlertContextTicket = Object.freeze({ communityId: m.community_id, mappingId: m.mapping_id,
      userId: premium.scope.userId, linkedDiscordUserId: premium.scope.discordUserId,
      guildId: m.destination_guild_id, roleId: m.destination_role_id!, authorityRevision: m.context_revision,
      partnerRevision: m.partner_revision, mappingRevision: m.revision, providerGeneration: m.provider_generation,
      identityGeneration: premium.scope.identityGeneration, erasureGeneration: premium.scope.erasureGeneration,
      policyGeneration: m.policy_generation, admissionRef: life.admission_ref, factsSha256, offerFactsSha256,
      observedAtUtc: core.now(), validUntilUtc: [premium.validUntilUtc,life.valid_until_utc].sort()[0]! });
    return partnerAlertAccessTicket({ premium, context });
  }
  isCurrent(original: PartnerAlertAccessTicket): boolean {
    try {
      const ticket = partnerAlertAccessTicket(original), c = ticket.context;
      const { core, mapping: m, factsSha256, offerFactsSha256 } = this.facts(ticket.premium, c.mappingId);
      const life = core.lifecycle(c.userId), at = core.now();
      return c.observedAtUtc <= at && at < c.validUntilUtc && c.validUntilUtc <= ticket.premium.validUntilUtc
        && c.communityId === m.community_id && c.guildId === m.destination_guild_id && c.roleId === m.destination_role_id
        && c.linkedDiscordUserId === ticket.premium.scope.discordUserId && c.authorityRevision === m.context_revision
        && c.partnerRevision === m.partner_revision && c.mappingRevision === m.revision
        && c.providerGeneration === m.provider_generation && c.policyGeneration === m.policy_generation
        && c.identityGeneration === ticket.premium.scope.identityGeneration && c.erasureGeneration === ticket.premium.scope.erasureGeneration
        && c.admissionRef === life.admission_ref && c.factsSha256 === factsSha256 && c.offerFactsSha256 === offerFactsSha256;
    } catch { return false; }
  }
}
