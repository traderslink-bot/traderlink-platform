import {
  PartnerAlertValidationError,
  partnerAlertAccessTicket,
  type PartnerAlertAccessTicket,
  type PartnerAlertAccessDecision,
  type PartnerAlertAccessMapping,
  type PartnerAlertAccessOffer,
  type PartnerAlertAccessPolicy,
  type PartnerAlertAccessReason,
  type PartnerAlertDiscordEvidence,
  type PartnerAlertMembershipEvidence,
  type PartnerAlertPremiumEvidence,
  type PartnerAlertRoleChange,
  type PartnerAlertWhopBinding,
} from "./partner-alert-contracts";
import {
  PARTNER_ALERT_MAX_SELECTION,
  parsePartnerAlertOffer,
  parsePartnerAlertWhopBinding,
  partnerAlertId,
  partnerAlertInteger,
  partnerAlertSnowflake,
  partnerAlertUtc,
} from "./partner-alert-validation";
import { samePremiumTicket } from "../../platform/contracts/platform-premium-access";

export type PartnerAlertAccessInput = Readonly<{
  ticket: PartnerAlertAccessTicket;
  /** Qualified current-provider discovery, never inferred from an empty list. */
  membershipDiscovery: "complete" | "incomplete" | "unknown";
  /** Previous verified paid endpoint from the scoped community ledger, not freshness. */
  previousCommunityPaidThroughUtc: string | null;
  communityCoverageQualification: Readonly<{ kind: "qualified"; qualificationRef: string; schemaSha256: string; apiVersion: string }>
    | Readonly<{ kind: "unqualified" }>;
  userId: string;
  communityId: string;
  mappingId: string;
  /** Complete server-owned community mapping snapshot, including package members. */
  mappings: readonly PartnerAlertAccessMapping[];
  partnerState: "active" | "publishing_paused" | "suspended";
  policy: PartnerAlertAccessPolicy;
  /** Verified active connection accounts; includes explicitly retained older bindings. */
  partnerWhopAccountIds: readonly string[];
  /** Set only from the signed-in user's verified Whop identity link. */
  whopUserRef: string | null;
  premium: PartnerAlertPremiumEvidence | null;
  discord: PartnerAlertDiscordEvidence | null;
  offers: readonly PartnerAlertAccessOffer[];
  memberships: readonly PartnerAlertMembershipEvidence[];
  nowUtc: string;
}>;

const WHOP_USER_REF = /^[0-9a-f]{64}$/u;
const WHOP_ACCOUNT = /^biz_[A-Za-z0-9_]{1,124}$/u;
const WHOP_MEMBERSHIP = /^mem_[A-Za-z0-9_]{1,124}$/u;

function sameWhopBinding(left: PartnerAlertWhopBinding, right: PartnerAlertWhopBinding): boolean {
  return left.environment === right.environment && left.accountId === right.accountId
    && left.productId === right.productId && left.planId === right.planId;
}

function validatePolicy(policy: PartnerAlertAccessPolicy): void {
  if (policy.environment !== "sandbox" && policy.environment !== "live") {
    throw new PartnerAlertValidationError("environment");
  }
  partnerAlertSnowflake(policy.destinationGuildId, "destinationGuildId");
  partnerAlertInteger(policy.maximumEvidenceAgeMs, "maximumEvidenceAgeMs", 1, 86_400_000);
  if (!Array.isArray(policy.allowedSubscriptionBases) || !policy.allowedSubscriptionBases.length
    || policy.allowedSubscriptionBases.length > 3
    || policy.allowedSubscriptionBases.some(basis => !["paid", "trial", "complimentary"].includes(basis))
    || new Set(policy.allowedSubscriptionBases).size !== policy.allowedSubscriptionBases.length) {
    throw new PartnerAlertValidationError("allowedSubscriptionBases");
  }
  if (policy.publishingPauseAccess !== "retain_paid_access" && policy.publishingPauseAccess !== "pause_access") {
    throw new PartnerAlertValidationError("publishingPauseAccess");
  }
}

/** A finite evidence window. Future/stale observations cannot authorise a role. */
function evidenceDeadline(observedAtUtc: string, validUntilUtc: string, nowUtc: string,
  maximumAge: number): number | null {
  const observed = Date.parse(partnerAlertUtc(observedAtUtc, "observedAtUtc"));
  const until = Date.parse(partnerAlertUtc(validUntilUtc, "validUntilUtc"));
  const now = Date.parse(nowUtc);
  if (observed > now || until <= now || until <= observed || now - observed >= maximumAge) return null;
  return Math.min(until, observed + maximumAge);
}

function validateMapping(mapping: PartnerAlertAccessMapping, communityId: string,
  destinationGuildId: string): void {
  partnerAlertId(mapping.mappingId, "mappingId");
  partnerAlertId(mapping.communityId, "communityId");
  partnerAlertSnowflake(mapping.destinationGuildId, "destinationGuildId");
  partnerAlertSnowflake(mapping.destinationRoleId, "destinationRoleId");
  if (mapping.communityId !== communityId || mapping.destinationGuildId !== destinationGuildId
    || !["approved", "withdrawn"].includes(mapping.accessState)) {
    throw new PartnerAlertValidationError("mapping");
  }
}

function denied(mapping: PartnerAlertAccessMapping, reason: PartnerAlertAccessReason): PartnerAlertAccessDecision {
  return Object.freeze({ mappingId: mapping.mappingId, roleId: mapping.destinationRoleId,
    allowed: false, desiredRole: ["invalid_evidence", "premium_unverified", "discord_unverified", "subscription_unverified"].includes(reason) ? "hold" : "absent", reason, validUntilUtc: null,
    qualifyingMembershipIds: Object.freeze([]) });
}

/**
 * Pure access decision, not role assignment. All evidence is server-owned and must
 * come from verified identity/provider reads, not a subscriber's command body.
 * A global membership enforcement-off switch is deliberately not an input.
 */
export function evaluatePartnerAlertChannelAccess(input: PartnerAlertAccessInput): PartnerAlertAccessDecision {
  partnerAlertId(input.userId, "userId");
  partnerAlertId(input.communityId, "communityId");
  partnerAlertId(input.mappingId, "mappingId");
  const now = partnerAlertUtc(input.nowUtc, "nowUtc");
  validatePolicy(input.policy);
  if (!Array.isArray(input.mappings) || !input.mappings.length
    || input.mappings.length > PARTNER_ALERT_MAX_SELECTION) throw new PartnerAlertValidationError("mappings");
  input.mappings.forEach(mapping => validateMapping(mapping, input.communityId, input.policy.destinationGuildId));
  const mapping = input.mappings.find(candidate => candidate.mappingId === input.mappingId);
  if (!mapping) throw new PartnerAlertValidationError("mappingId");
  if (new Set(input.mappings.map(candidate => candidate.mappingId)).size !== input.mappings.length
    || new Set(input.mappings.map(candidate => candidate.destinationRoleId)).size !== input.mappings.length) {
    return denied(mapping, "invalid_evidence");
  }
  try {
    const ticket = partnerAlertAccessTicket(input.ticket); const c = ticket.context;
    if (c.communityId !== input.communityId || c.mappingId !== input.mappingId || c.userId !== input.userId
      || c.guildId !== input.policy.destinationGuildId || c.roleId !== mapping.destinationRoleId
      || evidenceDeadline(c.observedAtUtc, c.validUntilUtc, now, input.policy.maximumEvidenceAgeMs) === null
      || evidenceDeadline(ticket.premium.observedAtUtc, ticket.premium.validUntilUtc, now, input.policy.maximumEvidenceAgeMs) === null
      || input.policy.environment !== "live" || input.policy.allowedSubscriptionBases.length !== 1
      || input.policy.allowedSubscriptionBases[0] !== "paid") return denied(mapping, "invalid_evidence");
  } catch { return denied(mapping, "invalid_evidence"); }
  if (mapping.accessState !== "approved") return denied(mapping, "mapping_withdrawn");
  if (input.partnerState === "suspended") return denied(mapping, "partner_suspended");
  if (input.partnerState === "publishing_paused" && input.policy.publishingPauseAccess === "pause_access") {
    return denied(mapping, "partner_paused");
  }
  if (!["active", "publishing_paused", "suspended"].includes(input.partnerState)) return denied(mapping, "invalid_evidence");

  let premiumDeadline: number | null;
  try {
    if (!input.premium || input.premium.userId !== input.userId
      || !samePremiumTicket(input.premium.ticket, input.ticket.premium)) return denied(mapping, "premium_unverified");
    premiumDeadline = evidenceDeadline(input.premium.observedAtUtc, input.premium.validUntilUtc, now,
      input.policy.maximumEvidenceAgeMs);
    if (premiumDeadline === null) return denied(mapping, "premium_unverified");
    if (input.premium.state === "inactive" && input.premium.basis === "none") return denied(mapping, "premium_required");
    if (input.premium.state !== "active" || input.premium.basis !== "paid_live" || input.premium.paidThroughUtc === null
      || partnerAlertUtc(input.premium.paidThroughUtc, "paidThroughUtc") <= now) return denied(mapping, "premium_unverified");
    premiumDeadline = Math.min(premiumDeadline, Date.parse(input.premium.paidThroughUtc), Date.parse(input.ticket.premium.validUntilUtc));
  } catch { return denied(mapping, "premium_unverified"); }

  let discordDeadline: number | null;
  try {
    if (!input.discord || input.discord.userId !== input.userId
      || input.discord.guildId !== input.policy.destinationGuildId
      || input.discord.discordUserId !== input.ticket.context.linkedDiscordUserId) return denied(mapping, "discord_unverified");
    partnerAlertSnowflake(input.discord.discordUserId, "discordUserId");
    discordDeadline = evidenceDeadline(input.discord.observedAtUtc, input.discord.validUntilUtc, now,
      input.policy.maximumEvidenceAgeMs);
    if (discordDeadline === null) return denied(mapping, "discord_unverified");
    if (input.discord.state === "absent") return denied(mapping, "discord_required");
    if (input.discord.state !== "member") return denied(mapping, "discord_unverified");
  } catch { return denied(mapping, "discord_unverified"); }

  if (!input.whopUserRef || !WHOP_USER_REF.test(input.whopUserRef)) return denied(mapping, "subscription_unverified");
  if (!Array.isArray(input.partnerWhopAccountIds) || !input.partnerWhopAccountIds.length
    || input.partnerWhopAccountIds.length > 20 || input.partnerWhopAccountIds.some(id => !WHOP_ACCOUNT.test(id))) {
    return denied(mapping, "invalid_evidence");
  }
  if (!Array.isArray(input.offers) || input.offers.length > 1000
    || !Array.isArray(input.memberships) || input.memberships.length > 1000) {
    return denied(mapping, "invalid_evidence");
  }
  const offers = new Map<string, PartnerAlertAccessOffer>();
  const conflictedOffers = new Set<string>();
  for (const candidate of input.offers) {
    try {
      const offer = parsePartnerAlertOffer(candidate.offer);
      if (offer.communityId !== input.communityId || offer.whop.environment !== input.policy.environment
        || !input.partnerWhopAccountIds.includes(offer.whop.accountId)) continue;
      if (!offer.mappingIds.every(id => input.mappings.some(item => item.mappingId === id))) continue;
      if (!["approved", "withdrawn"].includes(candidate.accessState)) continue;
      const key = `${offer.offerId}:${offer.version}`;
      // A duplicate reviewed version is ambiguous. Never pick its first occurrence.
      if (offers.has(key)) conflictedOffers.add(key);
      else offers.set(key, { offer, accessState: candidate.accessState });
    } catch { /* Malformed/foreign offers cannot hide another valid subscription. */ }
  }

  const memberships = new Map<string, PartnerAlertMembershipEvidence>();
  const conflictedMemberships = new Set<string>();
  const unorderableMemberships = new Set<string>();
  for (const evidence of input.memberships) {
    try {
      if (evidence.userId !== input.userId || evidence.communityId !== input.communityId) continue;
      if (!WHOP_MEMBERSHIP.test(evidence.membershipId)) continue;
      partnerAlertUtc(evidence.observedAtUtc, "observedAtUtc");
      const existing = memberships.get(evidence.membershipId);
      if (!existing || evidence.observedAtUtc > existing.observedAtUtc) {
        memberships.set(evidence.membershipId, evidence);
        conflictedMemberships.delete(evidence.membershipId);
      } else if (evidence.observedAtUtc === existing.observedAtUtc) {
        conflictedMemberships.add(evidence.membershipId);
      }
    } catch {
      // An identifiable broken observation must not expose an older active row.
      // A later authoritative read should replace the corrupt snapshot upstream.
      if (evidence && typeof evidence.membershipId === "string" && WHOP_MEMBERSHIP.test(evidence.membershipId)) {
        unorderableMemberships.add(evidence.membershipId);
      }
    }
  }

  const qualifying: { id: string; deadline: number }[] = [];
  let knownEnded = false;
  try {
    knownEnded = input.previousCommunityPaidThroughUtc !== null
      && partnerAlertUtc(input.previousCommunityPaidThroughUtc, "previousCommunityPaidThroughUtc") <= now;
  } catch { return denied(mapping, "subscription_unverified"); }
  const qualification = input.communityCoverageQualification;
  if (!qualification || qualification.kind !== "qualified" || !/^[A-Za-z0-9_:-]{1,160}$/u.test(qualification.qualificationRef)
    || !/^[0-9a-f]{64}$/u.test(qualification.schemaSha256) || !/^[A-Za-z0-9_:-]{1,160}$/u.test(qualification.apiVersion)) {
    return denied(mapping, knownEnded ? "subscription_required" : "subscription_unverified");
  }
  let uncertain = input.membershipDiscovery !== "complete" || conflictedMemberships.size > 0
    || unorderableMemberships.size > 0 || conflictedOffers.size > 0;
  for (const evidence of memberships.values()) {
    try {
      const key = `${evidence.offerId}:${evidence.offerVersion}`;
      if (conflictedMemberships.has(evidence.membershipId) || unorderableMemberships.has(evidence.membershipId)
        || conflictedOffers.has(key)) continue;
      if (evidence.whopUserRef !== input.whopUserRef) { uncertain = true; continue; }
      partnerAlertId(evidence.offerId, "offerId");
      partnerAlertInteger(evidence.offerVersion, "offerVersion", 1);
      const fresh = evidenceDeadline(evidence.observedAtUtc, evidence.validUntilUtc, now, input.policy.maximumEvidenceAgeMs);
      if (fresh === null || evidence.state === "unknown" || evidence.basis === "unknown") { uncertain = true; continue; }
      if (!["active", "inactive"].includes(evidence.state)
        || !["paid", "trial", "complimentary"].includes(evidence.basis)) { uncertain = true; continue; }
      if (evidence.state !== "active" || evidence.basis !== "paid"
        || !input.policy.allowedSubscriptionBases.includes(evidence.basis)) continue;
      const proof = evidence.paidCoverage;
      if (!proof || proof.qualificationRef !== qualification.qualificationRef
        || proof.membershipAccessKind !== "paid_membership" || proof.paymentCoverageKind !== "paid_membership") {
        uncertain = true; continue;
      }
      const candidate = offers.get(key);
      if (!candidate || candidate.accessState !== "approved"
        || !candidate.offer.mappingIds.includes(input.mappingId)) continue;
      const whop = parsePartnerAlertWhopBinding(evidence.whop);
      if (!sameWhopBinding(whop, candidate.offer.whop)) continue;
      const starts = partnerAlertUtc(evidence.startsAtUtc, "startsAtUtc");
      if (starts > now || evidence.validUntilUtc <= starts) continue;
      const paidStart = partnerAlertUtc(proof.startsAtUtc, "paidStartsAtUtc");
      const paidEnd = partnerAlertUtc(proof.endsAtUtc, "paidEndsAtUtc");
      if (paidStart >= paidEnd || paidStart > now || paidEnd <= now) { uncertain = true; continue; }
      const deadline = evidenceDeadline(evidence.observedAtUtc, evidence.validUntilUtc, now,
        input.policy.maximumEvidenceAgeMs);
      if (deadline !== null) qualifying.push({ id: evidence.membershipId, deadline: Math.min(deadline, Date.parse(paidEnd)) });
    } catch { uncertain = true; /* Invalid facts establish neither payment nor nonpayment. */ }
  }
  if (!qualifying.length) return denied(mapping, knownEnded || !uncertain ? "subscription_required" : "subscription_unverified");
  // Union purchases first: one expired/cancelled package does not remove an
  // independent active channel purchase. Re-evaluate at the longest valid source.
  const subscriptionDeadline = Math.max(...qualifying.map(item => item.deadline));
  const deadline = Math.min(premiumDeadline, discordDeadline, subscriptionDeadline, Date.parse(input.ticket.context.validUntilUtc));
  return Object.freeze({ mappingId: mapping.mappingId, roleId: mapping.destinationRoleId,
    allowed: true, desiredRole: "present", reason: "allowed", validUntilUtc: new Date(deadline).toISOString(),
    qualifyingMembershipIds: Object.freeze(qualifying.map(item => item.id).sort()) });
}

/** Only explicit managed roles are considered. Never change unrelated Discord roles. */
export function planPartnerAlertRoleChanges(input: Readonly<{
  decisions: readonly PartnerAlertAccessDecision[];
  observedRoleIds: readonly string[];
  nowUtc: string;
}>): readonly PartnerAlertRoleChange[] {
  const now = partnerAlertUtc(input.nowUtc, "nowUtc");
  if (!Array.isArray(input.decisions) || input.decisions.length > PARTNER_ALERT_MAX_SELECTION
    || !Array.isArray(input.observedRoleIds) || input.observedRoleIds.length > 500) {
    throw new PartnerAlertValidationError("roles");
  }
  const observed = new Set(input.observedRoleIds.map(role => partnerAlertSnowflake(role, "roleId")));
  const byRole = new Map<string, PartnerAlertAccessDecision[]>();
  for (const decision of input.decisions) {
    partnerAlertId(decision.mappingId, "mappingId");
    const roleId = partnerAlertSnowflake(decision.roleId, "roleId");
    byRole.set(roleId, [...(byRole.get(roleId) ?? []), decision]);
  }
  const changes: PartnerAlertRoleChange[] = [];
  for (const [roleId, decisions] of byRole) {
    // Dedicated per-channel roles must not be shared between mapping decisions.
    const only = decisions.length === 1 ? decisions[0] : null;
    if (!only || only.desiredRole === "hold") continue;
    let desired = false;
    if (only && only.allowed === true && only.desiredRole === "present" && only.reason === "allowed"
      && only.validUntilUtc !== null) {
      try { desired = partnerAlertUtc(only.validUntilUtc, "validUntilUtc") > now; }
      catch { desired = false; }
      if (!desired) continue; // Expiry requests a fresh decision, not a removal.
    }
    else if (only.allowed !== false || only.desiredRole !== "absent"
      || !["mapping_withdrawn", "partner_suspended", "partner_paused", "premium_required", "discord_required", "subscription_required"].includes(only.reason)) continue;
    if (desired !== observed.has(roleId)) changes.push(Object.freeze({ roleId,
      action: desired ? "add" : "remove",
      mappingIds: Object.freeze([...new Set(decisions.map(decision => decision.mappingId))].sort()) }));
  }
  return Object.freeze(changes.sort((left, right) => left.roleId.localeCompare(right.roleId)));
}

/** Publishing fees affect new sales/delivery, never mutate a subscriber purchase. */
export function evaluatePartnerAlertPublishingAvailability(input: Readonly<{
  partnerState: "active" | "publishing_paused" | "suspended";
  mappingApproved: boolean;
  setupVerified: boolean;
  approvedAgreement: Readonly<{ agreementId: string; version: number }>;
  acceptedAgreement: Readonly<{ agreementId: string; version: number }> | null;
  publishingMembership: Readonly<{
    agreementId: string;
    agreementVersion: number;
    state: "active" | "inactive" | "unknown";
    observedAtUtc: string;
    validUntilUtc: string;
  }> | null;
  maximumEvidenceAgeMs: number;
  nowUtc: string;
}>): Readonly<{
  newSalesAllowed: boolean;
  publishingAllowed: boolean;
  existingSubscriberAccess: "evaluate_separately";
  reason: "ready" | "partner_paused" | "setup_required" | "agreement_required" | "publishing_payment_required";
}> {
  const blocked = (reason: "partner_paused" | "setup_required" | "agreement_required" | "publishing_payment_required") =>
    Object.freeze({ newSalesAllowed: false, publishingAllowed: false,
      existingSubscriberAccess: "evaluate_separately" as const, reason });
  const now = partnerAlertUtc(input.nowUtc, "nowUtc");
  partnerAlertInteger(input.maximumEvidenceAgeMs, "maximumEvidenceAgeMs", 1, 86_400_000);
  if (input.partnerState !== "active") return blocked("partner_paused");
  if (input.mappingApproved !== true || input.setupVerified !== true) return blocked("setup_required");
  partnerAlertId(input.approvedAgreement.agreementId, "agreementId");
  partnerAlertInteger(input.approvedAgreement.version, "agreementVersion", 1);
  if (!input.acceptedAgreement || input.acceptedAgreement.agreementId !== input.approvedAgreement.agreementId
    || input.acceptedAgreement.version !== input.approvedAgreement.version) return blocked("agreement_required");
  const payment = input.publishingMembership;
  if (!payment || payment.state !== "active" || payment.agreementId !== input.approvedAgreement.agreementId
    || payment.agreementVersion !== input.approvedAgreement.version) return blocked("publishing_payment_required");
  try {
    if (evidenceDeadline(payment.observedAtUtc, payment.validUntilUtc, now, input.maximumEvidenceAgeMs) === null) {
      return blocked("publishing_payment_required");
    }
  } catch { return blocked("publishing_payment_required"); }
  return Object.freeze({ newSalesAllowed: true, publishingAllowed: true,
    existingSubscriberAccess: "evaluate_separately", reason: "ready" });
}

export const PARTNER_ALERT_ACCESS_MESSAGES: Readonly<Record<PartnerAlertAccessReason, string>> = Object.freeze({
  allowed: "Your channel access is active.",
  invalid_evidence: "Channel access could not be verified. Try again shortly.",
  mapping_withdrawn: "This channel is no longer available through TradersLink.",
  partner_suspended: "This provider’s channel access is suspended. Contact the provider through Whop about billing.",
  partner_paused: "This provider is paused. Contact the provider through Whop about your subscription.",
  premium_required: "Channel access is paused because Premium ended. Your separate community Whop subscription continues.",
  premium_unverified: "We could not verify your Premium access. Your community Whop subscription remains separate.",
  discord_required: "Join the TradersLink Discord server to receive channel access.",
  discord_unverified: "Connect Discord and verify your TradersLink server membership.",
  subscription_required: "Verify an active subscription for this channel or a package that includes it.",
  subscription_unverified: "We could not verify your community subscription. Try again shortly.",
});
