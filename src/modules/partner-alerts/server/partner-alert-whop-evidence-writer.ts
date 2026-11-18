import type Database from "better-sqlite3";
import { erasureHold, requirePlatformErasureWriter } from "../../platform/server/privacy/platform-erasure-admission";
import { parsePartnerAlertOffer, partnerAlertInteger, partnerAlertRef, partnerAlertUtc } from "../contracts/partner-alert-validation";
import type { PartnerAlertWhopApplicationAuthority } from "./partner-alert-whop-commercial-apply";
import type { PartnerAlertWhopInboxClaim } from "./partner-alert-whop-inbox";
import type { PartnerAlertWhopPreparation } from "./partner-alert-whop-reconciliation";

/** Reviewed native qualification, bound to this exact preparation by the authority
 * producer. Legacy preparation alone can never produce a discovery receipt. */
type CoverageQualification = Readonly<{ qualificationRef: string; validUntilUtc: string }>;
type EvidenceAuthority = PartnerAlertWhopApplicationAuthority & Readonly<{
  qualifyCoverage: (preparation: PartnerAlertWhopPreparation) => CoverageQualification | null;
}>;

export class PartnerAlertWhopEvidenceWriter {
  constructor(private readonly db: Database.Database, private readonly authority: EvidenceAuthority) {}

  apply(claim: PartnerAlertWhopInboxClaim, preparation: PartnerAlertWhopPreparation): void {
    const context = preparation.context;
    if (!this.db.inTransaction || !context || preparation.status !== "prepared" || preparation.canApply !== false
      || preparation.provenance !== "current_runtime_unbound" || !preparation.discoveryComplete
      || preparation.issues.length || preparation.members.length !== preparation.discoveredMembershipCount
      || context.communityId !== claim.event.communityId || context.environment !== claim.event.environment
      || context.accountId !== claim.event.accountId) return erasureHold();
    const core = requirePlatformErasureWriter(this.db, context.userId);
    core.assertLivePrincipal(context.userId);
    const now = core.now();
    const current = this.authority.recheckCurrent(this.db, { claim, preparation });
    const qualification = this.authority.qualifyCoverage(preparation);
    if (current.kind !== "admitted" || !qualification || current.userId !== context.userId
      || current.verifiedWhopUserRef !== context.verifiedWhopUserRef || current.communityId !== context.communityId
      || current.environment !== context.environment || current.accountId !== context.accountId
      || current.offerId !== context.offerId || current.offerVersion !== context.offerVersion
      || current.productId !== context.productId || current.planId !== context.planId
      || current.currencyCode !== context.currencyCode) return erasureHold();
    const { identity, connection, erasure } = current.generations;
    if (identity !== context.claimedGenerations.identity || connection !== context.claimedGenerations.connection
      || erasure !== context.claimedGenerations.erasure || erasure !== core.lifecycle(context.userId).erasure_generation) return erasureHold();
    for (const generation of [identity, connection, erasure]) partnerAlertInteger(generation, "generation", 1);
    const event = claim.event;
    if ((event.resourceKind === "account" && event.resourceId !== context.accountId)
      || (event.resourceKind === "membership" && !preparation.members.some(member => member.membershipId === event.resourceId))
      || (event.resourceKind === "payment" && !preparation.members.some(member => member.kind === "prepared"
        && member.paymentFacts.some(payment => payment.paymentId === event.resourceId)))) return erasureHold();
    if (!this.db.prepare(`SELECT 1 FROM partner_alert_whop_inbox
      WHERE community_id=? AND environment=? AND whop_account_id=? AND event_id=? AND status='processing'
        AND lease_token=? AND lease_until_utc>? AND payload_sha256=? AND resource_kind=? AND resource_id=?
        AND admission_fence_json=?`).get(event.communityId, event.environment, event.accountId,
      event.eventId, claim.leaseToken, now, event.payloadSha256, event.resourceKind, event.resourceId,
      JSON.stringify(claim.admissionFence))) return erasureHold();

    const scope = [context.communityId, context.userId, context.offerId, context.offerVersion,
      context.environment, context.accountId] as const;
    const binding = this.db.prepare(`SELECT o.offer_json,c.valid_until_utc
      FROM partner_alert_offers o JOIN partner_alert_whop_connections c ON c.community_id=o.community_id
        AND c.environment=o.whop_environment AND c.whop_account_id=o.whop_account_id
      JOIN partner_alert_whop_identities i ON i.user_id=? AND i.environment=c.environment
      WHERE o.community_id=? AND o.offer_id=? AND o.version=? AND o.whop_environment=? AND o.whop_account_id=?
        AND o.review_state='approved' AND c.status='verified' AND i.status='verified' AND i.whop_user_ref=?`)
      .get(context.userId, context.communityId, context.offerId, context.offerVersion, context.environment,
        context.accountId, context.verifiedWhopUserRef) as { offer_json: string; valid_until_utc: string } | undefined;
    if (!binding) return erasureHold();
    const offer = parsePartnerAlertOffer(JSON.parse(binding.offer_json));
    if (offer.communityId !== context.communityId || offer.offerId !== context.offerId || offer.version !== context.offerVersion
      || offer.whop.environment !== context.environment || offer.whop.accountId !== context.accountId
      || offer.whop.productId !== context.productId || offer.whop.planId !== context.planId
      || offer.currency.code !== context.currencyCode) return erasureHold();
    const observed = partnerAlertUtc(preparation.finishedAtUtc, "discoveryObservedAtUtc");
    const deadline = [binding.valid_until_utc, current.validUntilUtc, qualification.validUntilUtc,
      ...preparation.members.flatMap(member => member.kind === "prepared" ? [member.evidence.validUntilUtc] : [])]
      .map(value => partnerAlertUtc(value, "discoveryValidUntilUtc")).sort()[0]!;
    if (observed > now || deadline <= now) return erasureHold();
    const qualificationRef = partnerAlertRef(qualification.qualificationRef, "coverageQualificationRef");
    const stored = this.db.prepare(`SELECT observed_at_utc FROM partner_alert_whop_discovery
      WHERE (community_id,user_id,offer_id,offer_version,environment,whop_account_id)=(?,?,?,?,?,?)`).pluck().get(...scope);
    if (typeof stored === "string" && stored >= observed) return erasureHold();

    this.db.prepare(`DELETE FROM partner_alert_whop_discovery
      WHERE (community_id,user_id,offer_id,offer_version,environment,whop_account_id)=(?,?,?,?,?,?)`).run(...scope);
    this.db.prepare(`INSERT INTO partner_alert_whop_discovery
      (community_id,user_id,offer_id,offer_version,environment,whop_account_id,
        observed_at_utc,valid_until_utc,qualification_ref,identity_generation,connection_generation,erasure_generation)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`).run(...scope, observed, deadline, qualificationRef, identity, connection, erasure);

    const seen = new Set<string>();
    for (const member of preparation.members) {
      if (member.kind !== "prepared" || seen.has(member.membershipId)) return erasureHold();
      seen.add(member.membershipId);
      const fact = member.evidence;
      const factObserved = partnerAlertUtc(fact.observedAtUtc, "membershipObservedAtUtc");
      const factStarts = partnerAlertUtc(fact.startsAtUtc, "membershipStartsAtUtc");
      if (fact.membershipId !== member.membershipId || fact.userId !== context.userId
        || fact.whopUserRef !== context.verifiedWhopUserRef || fact.communityId !== context.communityId
        || fact.offerId !== context.offerId || fact.offerVersion !== context.offerVersion
        || fact.whop.environment !== context.environment || fact.whop.accountId !== context.accountId
        || fact.whop.productId !== context.productId || fact.whop.planId !== context.planId
        || factObserved > observed) return erasureHold();
      const written = this.db.prepare(`INSERT INTO partner_alert_memberships
        (community_id,user_id,offer_id,offer_version,environment,whop_account_id,membership_id,
          whop_user_ref,state,basis,starts_at_utc,valid_until_utc,observed_at_utc)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
        ON CONFLICT(environment,whop_account_id,membership_id) DO UPDATE SET state=excluded.state,basis=excluded.basis,
          starts_at_utc=excluded.starts_at_utc,valid_until_utc=excluded.valid_until_utc,observed_at_utc=excluded.observed_at_utc
        WHERE partner_alert_memberships.community_id=excluded.community_id AND partner_alert_memberships.user_id=excluded.user_id
          AND partner_alert_memberships.offer_id=excluded.offer_id AND partner_alert_memberships.offer_version=excluded.offer_version
          AND partner_alert_memberships.whop_user_ref=excluded.whop_user_ref
          AND partner_alert_memberships.observed_at_utc<=excluded.observed_at_utc`)
        .run(...scope, fact.membershipId, fact.whopUserRef, fact.state, fact.basis, factStarts, fact.validUntilUtc, factObserved);
      if (written.changes !== 1) return erasureHold();
      const coverage = fact.paidCoverage;
      if (fact.state !== "active" || fact.basis !== "paid") {
        if (coverage) return erasureHold();
        continue;
      }
      if (!coverage || coverage.qualificationRef !== qualificationRef || coverage.membershipAccessKind !== "paid_membership"
        || coverage.paymentCoverageKind !== "paid_membership") return erasureHold();
      const start = partnerAlertUtc(coverage.startsAtUtc, "paidStartsAtUtc");
      const end = partnerAlertUtc(coverage.endsAtUtc, "paidEndsAtUtc");
      if (start >= end || end <= now || start > now || start < factStarts) return erasureHold();
      this.db.prepare(`INSERT INTO partner_alert_whop_paid_intervals
        (community_id,user_id,offer_id,offer_version,environment,whop_account_id,membership_id,starts_at_utc,ends_at_utc)
        VALUES (?,?,?,?,?,?,?,?,?)`).run(...scope, fact.membershipId, start, end);
    }
    // A completed discovery supersedes absent rows. Preserve their identifying
    // history for normal erasure, while making them ineligible for access.
    const previous = this.db.prepare(`SELECT membership_id FROM partner_alert_memberships
      WHERE (community_id,user_id,offer_id,offer_version,environment,whop_account_id)=(?,?,?,?,?,?)
      LIMIT 10001`).pluck().all(...scope);
    if (previous.length > 10_000) return erasureHold();
    for (const id of previous) {
      if (typeof id !== "string" || seen.has(id)) continue;
      const changed = this.db.prepare(`UPDATE partner_alert_memberships
        SET state='inactive',observed_at_utc=?,valid_until_utc=?
        WHERE (community_id,user_id,offer_id,offer_version,environment,whop_account_id)=(?,?,?,?,?,?)
          AND membership_id=? AND observed_at_utc<=?`).run(observed, deadline, ...scope, id, observed);
      if (changed.changes !== 1) return erasureHold();
    }
  }
}
