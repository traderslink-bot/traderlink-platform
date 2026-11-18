import type Database from "better-sqlite3";
import type { PartnerAlertAccessInput } from "../contracts/partner-alert-access-policy";
import type { PartnerAlertAccessTicket, PartnerAlertMembershipEvidence } from "../contracts/partner-alert-contracts";
import { parsePartnerAlertOffer, partnerAlertInteger, partnerAlertRef, partnerAlertUtc } from "../contracts/partner-alert-validation";

type Qualification = Extract<PartnerAlertAccessInput["communityCoverageQualification"], { kind: "qualified" }>;
type Generations = Readonly<{ identity: number; connection: number; erasure: number }>;
type Offer = ReturnType<typeof parsePartnerAlertOffer>;
type Discovery = Readonly<{ observed_at_utc: string; valid_until_utc: string; qualification_ref: string;
  identity_generation: number; connection_generation: number; erasure_generation: number; whop_user_ref: string }>;
type Membership = Readonly<{ membership_id: string; whop_user_ref: string;
  state: PartnerAlertMembershipEvidence["state"]; basis: PartnerAlertMembershipEvidence["basis"];
  starts_at_utc: string; observed_at_utc: string; valid_until_utc: string;
  coverage_start: string | null; coverage_end: string | null }>;

export type PartnerAlertWhopReceiptInputs = Readonly<{
  environment: "live" | "sandbox";
  nowUtc: () => string;
  maximumEvidenceAgeMs: number;
  includeWithdrawnOffers?: boolean;
  qualification: Qualification;
  /** Read current generations on this connection, from the same qualified
   * producer that admitted the Whop observation. No provider I/O. */
  readCurrentGenerations: (ticket: PartnerAlertAccessTicket, offer: Offer) => Generations | null;
  readDiscord: (ticket: PartnerAlertAccessTicket) => Readonly<{
    evidence: PartnerAlertAccessInput["discord"]; previousDiscordUserIds: readonly string[];
  }> | null;
}>;

export function createPartnerAlertWhopReceiptReader(db: Database.Database, input: PartnerAlertWhopReceiptInputs) {
  const maximumAge = partnerAlertInteger(input.maximumEvidenceAgeMs, "maximumEvidenceAgeMs", 1, 300_000);
  const qualification = input.qualification;
  const ref = partnerAlertRef(qualification.qualificationRef, "coverageQualificationRef");
  partnerAlertRef(qualification.apiVersion, "coverageApiVersion");
  if (!/^[a-f0-9]{64}$/u.test(qualification.schemaSha256)) throw new Error("Partner Whop qualification unavailable.");

  return (ticket: PartnerAlertAccessTicket) => {
    if (!db.inTransaction) return null;
    try {
      const now = partnerAlertUtc(input.nowUtc(), "nowUtc");
      const scope = ticket.context;
      const offers = db.prepare(`SELECT o.offer_json FROM partner_alert_offers o
        JOIN partner_alert_offer_channels c ON (c.community_id,c.offer_id,c.offer_version)=(o.community_id,o.offer_id,o.version)
        WHERE o.community_id=? AND c.mapping_id=? AND o.whop_environment=? AND (o.review_state='approved' OR (?=1 AND o.review_state='withdrawn'))
        ORDER BY o.offer_id,o.version LIMIT 101`).pluck().all(scope.communityId, scope.mappingId, input.environment, input.includeWithdrawnOffers === true ? 1 : 0);
      if (!offers.length || offers.length > 100) return null;
      const discord = input.readDiscord(ticket);
      if (!discord?.evidence || discord.evidence.userId !== scope.userId
        || discord.evidence.discordUserId !== scope.linkedDiscordUserId || discord.evidence.guildId !== scope.guildId) return null;
      const memberships: PartnerAlertMembershipEvidence[] = [];
      let whopUserRef: string | undefined;

      for (const json of offers) {
        if (typeof json !== "string") return null;
        const offer = parsePartnerAlertOffer(JSON.parse(json));
        if (offer.communityId !== scope.communityId || offer.whop.environment !== input.environment
          || !offer.mappingIds.includes(scope.mappingId)) return null;
        const keys = [scope.communityId, scope.userId, offer.offerId, offer.version, input.environment, offer.whop.accountId] as const;
        const receipt = db.prepare(`SELECT d.*,i.whop_user_ref FROM partner_alert_whop_discovery d
          JOIN partner_alert_whop_identities i ON i.user_id=d.user_id AND i.environment=d.environment
          JOIN partner_alert_whop_connections c ON (c.community_id,c.environment,c.whop_account_id)=
            (d.community_id,d.environment,d.whop_account_id)
          WHERE (d.community_id,d.user_id,d.offer_id,d.offer_version,d.environment,d.whop_account_id)=(?,?,?,?,?,?)
            AND i.status='verified' AND c.status='verified' AND c.valid_until_utc>?`).get(...keys, now) as Discovery | undefined;
        const generation = input.readCurrentGenerations(ticket, offer);
        if (!receipt || !generation || receipt.qualification_ref !== ref
          || receipt.identity_generation !== generation.identity || receipt.connection_generation !== generation.connection
          || receipt.erasure_generation !== generation.erasure
          || partnerAlertUtc(receipt.observed_at_utc, "receiptObservation") > now
          || partnerAlertUtc(receipt.valid_until_utc, "receiptExpiry") <= now
          || Date.parse(now) - Date.parse(receipt.observed_at_utc) >= maximumAge
          || !/^[a-f0-9]{64}$/u.test(receipt.whop_user_ref)
          || (whopUserRef !== undefined && receipt.whop_user_ref !== whopUserRef)) return null;
        whopUserRef = receipt.whop_user_ref;

        const rows = db.prepare(`SELECT m.*,p.starts_at_utc coverage_start,p.ends_at_utc coverage_end
          FROM partner_alert_memberships m LEFT JOIN partner_alert_whop_paid_intervals p
          ON (p.community_id,p.user_id,p.offer_id,p.offer_version,p.environment,p.whop_account_id,p.membership_id)=
             (m.community_id,m.user_id,m.offer_id,m.offer_version,m.environment,m.whop_account_id,m.membership_id)
          WHERE (m.community_id,m.user_id,m.offer_id,m.offer_version,m.environment,m.whop_account_id)=(?,?,?,?,?,?)
          ORDER BY m.membership_id LIMIT 1001`).all(...keys) as Membership[];
        if (rows.length > 1000 || memberships.length + rows.length > 1000) return null;
        for (const row of rows) {
          if (row.whop_user_ref !== whopUserRef || row.observed_at_utc > receipt.observed_at_utc) return null;
          const endsAtUtc = row.coverage_end === null ? null : partnerAlertUtc(row.coverage_end, "paidCoverageEnd");
          const startsAtUtc = row.coverage_start === null ? null : partnerAlertUtc(row.coverage_start, "paidCoverageStart");
          const coverage = startsAtUtc !== null && endsAtUtc !== null && startsAtUtc <= now && now < endsAtUtc
            ? { qualificationRef: ref, startsAtUtc, endsAtUtc, membershipAccessKind: "paid_membership" as const,
              paymentCoverageKind: "paid_membership" as const } : undefined;
          memberships.push({ membershipId: row.membership_id, userId: scope.userId, whopUserRef,
            communityId: scope.communityId, offerId: offer.offerId, offerVersion: offer.version,
            whop: offer.whop, state: row.state, basis: row.basis, startsAtUtc: row.starts_at_utc,
            observedAtUtc: row.observed_at_utc, validUntilUtc: [row.valid_until_utc, receipt.valid_until_utc].sort()[0]!,
            ...(coverage ? { paidCoverage: coverage } : {}) });
        }
      }
      return whopUserRef === undefined ? null : {
        membershipDiscovery: "complete" as const, communityCoverageQualification: qualification, whopUserRef,
        previousCommunityPaidThroughUtc: null, discord: discord.evidence, previousDiscordUserIds: discord.previousDiscordUserIds,
        memberships,
      };
    } catch { return null; }
  };
}
