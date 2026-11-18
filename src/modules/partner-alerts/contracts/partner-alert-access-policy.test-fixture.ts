import type { PartnerAlertAccessInput } from "./partner-alert-access-policy";

const userId = "11111111-1111-4111-8111-111111111111";
const communityId = "22222222-2222-4222-8222-222222222222";
const mappingId = "33333333-3333-4333-8333-333333333333";
const offerId = "44444444-4444-4444-8444-444444444444";
const authorityKey = "55555555-5555-4555-8555-555555555555";
const guildId = "810000000000000001";
const discordUserId = "810000000000000002";
const roleId = "810000000000000003";
const observedAtUtc = "2026-11-02T11:59:00.000Z";
const nowUtc = "2026-11-02T12:00:00.000Z";
const validUntilUtc = "2026-11-02T12:10:00.000Z";
const paidThroughUtc = "2026-11-02T13:00:00.000Z";

function qualifiedPaidInput(): PartnerAlertAccessInput {
  const premiumTicket = Object.freeze({
    scope: Object.freeze({ authorityKey, userId, discordUserId, guildId, identityGeneration: 1,
      entitlementGeneration: 1, erasureGeneration: 1, policyGeneration: 1 }),
    authorityRevision: 1, whopGeneration: 1, admissionRef: "premium-admission-v1",
    factsSha256: "a".repeat(64), observedAtUtc, validUntilUtc,
  });
  const context = Object.freeze({ communityId, mappingId, userId, linkedDiscordUserId: discordUserId,
    guildId, roleId, authorityRevision: 1, partnerRevision: 1, mappingRevision: 1,
    providerGeneration: 1, identityGeneration: 1, erasureGeneration: 1, policyGeneration: 1,
    admissionRef: "partner-admission-v1", factsSha256: "b".repeat(64), offerFactsSha256: "c".repeat(64),
    observedAtUtc, validUntilUtc });
  const whop = Object.freeze({ environment: "live" as const, accountId: "biz_partner",
    productId: "prod_channel", planId: "plan_channel" });
  const offer = Object.freeze({ offerId, communityId, version: 1, kind: "channel" as const,
    title: "Opening alerts", mappingIds: Object.freeze([mappingId]),
    currency: Object.freeze({ code: "USD", minorUnitDigits: 2 as const }), amountMinor: 2500,
    cadence: Object.freeze({ unit: "day" as const, count: 30 }), whop });
  return {
    ticket: Object.freeze({ premium: premiumTicket, context }), membershipDiscovery: "complete",
    previousCommunityPaidThroughUtc: paidThroughUtc,
    communityCoverageQualification: Object.freeze({ kind: "qualified", qualificationRef: "whop-paid-v1",
      schemaSha256: "d".repeat(64), apiVersion: "whop-membership-v1" }),
    userId, communityId, mappingId,
    mappings: Object.freeze([{ mappingId, communityId, destinationGuildId: guildId,
      destinationRoleId: roleId, accessState: "approved" as const }]),
    partnerState: "active", policy: Object.freeze({ environment: "live", destinationGuildId: guildId,
      maximumEvidenceAgeMs: 300_000, allowedSubscriptionBases: Object.freeze(["paid" as const]),
      publishingPauseAccess: "retain_paid_access" }),
    partnerWhopAccountIds: Object.freeze([whop.accountId]), whopUserRef: "e".repeat(64),
    premium: Object.freeze({ ticket: premiumTicket, basis: "paid_live", paidThroughUtc, userId,
      state: "active", observedAtUtc, validUntilUtc }),
    discord: Object.freeze({ userId, discordUserId, guildId, state: "member", observedAtUtc, validUntilUtc }),
    offers: Object.freeze([{ offer, accessState: "approved" as const }]),
    memberships: Object.freeze([{ membershipId: "mem_paid", userId, whopUserRef: "e".repeat(64), communityId,
      offerId, offerVersion: 1, whop, state: "active", basis: "paid", observedAtUtc,
      startsAtUtc: "2026-11-02T11:00:00.000Z", validUntilUtc,
      paidCoverage: Object.freeze({ qualificationRef: "whop-paid-v1", membershipAccessKind: "paid_membership",
        paymentCoverageKind: "paid_membership", startsAtUtc: "2026-11-02T11:00:00.000Z", endsAtUtc: paidThroughUtc }) }]),
    nowUtc,
  };
}

export { userId, communityId, mappingId, offerId, guildId, discordUserId, roleId, observedAtUtc, nowUtc, validUntilUtc, paidThroughUtc, qualifiedPaidInput };
