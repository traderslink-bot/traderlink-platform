import { describe, expect, it } from "vitest";

import type { PartnerAlertOffer } from "../contracts/partner-alert-contracts";
import type { PartnerAlertPreparedCommand } from "./partner-alert-request-boundary";
import type { PartnerAlertPrivateView } from "./partner-alert-read-model";
import { planPartnerAlertProviderVerification } from "./partner-alert-provider-verification";

const communityId = "20000000-0000-4000-8000-000000000002";
const mappingId = "40000000-0000-4000-8000-000000000004";
const offerId = "30000000-0000-4000-8000-000000000003";
const requestId = "50000000-0000-4000-8000-000000000005";
const destinationGuildId = "100000000000000001";
const offer: PartnerAlertOffer = Object.freeze({
  offerId,
  communityId,
  version: 1,
  kind: "channel",
  title: "Morning alerts",
  mappingIds: Object.freeze([mappingId]),
  currency: Object.freeze({ code: "USD", minorUnitDigits: 2 }),
  amountMinor: 2500,
  cadence: Object.freeze({ unit: "calendar_month", count: 1 }),
  whop: Object.freeze({ environment: "live", accountId: "biz_partner", productId: "prod_alerts", planId: "plan_monthly" }),
});

const view: PartnerAlertPrivateView = Object.freeze({
  communityId,
  displayName: "Market Desk",
  sourceGuildId: "200000000000000002",
  status: "awaiting_approval",
  revision: 7,
  reviewRequested: true,
  currentAgreementId: null,
  approvedAtUtc: null,
  createdAtUtc: "2026-11-01T00:00:00.000Z",
  updatedAtUtc: "2026-11-01T00:00:00.000Z",
  contentPolicy: Object.freeze({ blockedServerNames: Object.freeze([]), blockedPhrases: Object.freeze([]),
    authorMode: "all_humans", allowedAuthorIds: Object.freeze([]) }),
  mappings: Object.freeze([Object.freeze({
    mappingId,
    displayName: "Morning alerts",
    sourceChannelId: "300000000000000003",
    revision: 2,
    reviewState: "approved",
    destinationGuildId,
    destinationChannelId: "400000000000000004",
    destinationRoleId: "500000000000000005",
    approvedRevision: 2,
    everApproved: true,
  })]),
  offers: Object.freeze([Object.freeze({ offer, reviewState: "approved" })]),
  personalInspectionConfirmed: true,
  latestAgreement: null,
});

function prepared(command: PartnerAlertPreparedCommand["command"]): PartnerAlertPreparedCommand {
  return Object.freeze({ requestId, target: Object.freeze({ kind: "operator" as const }), command });
}

describe("Partner Channel provider preauthorization plan", () => {
  it.each(["approvePartner", "activatePartner"] as const)("enumerates every approved Discord and Whop fact for %s", action => {
    const plan = planPartnerAlertProviderVerification(prepared({ action, communityId,
      expectedRevision: 7 }), view, destinationGuildId);
    expect(plan.resourceChecks).toEqual([{
      communityId,
      sourceGuildId: view.sourceGuildId,
      sourceChannelId: view.mappings[0]!.sourceChannelId,
      destinationGuildId,
      destinationChannelId: view.mappings[0]!.destinationChannelId,
      destinationRoleId: view.mappings[0]!.destinationRoleId,
    }]);
    expect(plan.offerChecks).toEqual([{ communityId, offer }]);
  });

  it("uses the server destination guild for a mapping approval", () => {
    const pending = Object.freeze({ ...view, mappings: Object.freeze([Object.freeze({ ...view.mappings[0]!,
      reviewState: "awaiting_approval" as const, approvedRevision: null, everApproved: false,
      destinationGuildId: null, destinationChannelId: null, destinationRoleId: null })]) });
    const plan = planPartnerAlertProviderVerification(prepared({ action: "approveMapping", communityId,
      expectedRevision: 7, mappingId, expectedMappingRevision: 2,
      destinationChannelId: "600000000000000006", destinationRoleId: "700000000000000007" }), pending, destinationGuildId);
    expect(plan.resourceChecks[0]?.destinationGuildId).toBe(destinationGuildId);
  });

  it("verifies new Stripe terms and retains current checks for existing Whop offers", () => {
    const { whop, ...terms } = offer;
    const stripeOffer = { ...terms, billingProvider: "stripe" as const };
    const saving = (value: unknown) => planPartnerAlertProviderVerification({ requestId,
      target: { kind: "community_owner", communityId },
      command: { action: "saveOfferVersion", communityId, expectedRevision: 7, offer: value } }, view, destinationGuildId);
    expect(saving(stripeOffer).stripeOfferChecks).toEqual([{ communityId, offer: stripeOffer }]);
    expect(() => saving({ ...terms, whop })).toThrow();
    expect(() => saving({ ...stripeOffer, amountMinor: 0 })).toThrow();
    expect(() => saving({ ...stripeOffer, currency: { code: "USD", minorUnitDigits: 1 } })).toThrow();
    expect(() => saving({ ...stripeOffer, cadence: { unit: "calendar_month", count: 37 } })).toThrow();
    const approving = planPartnerAlertProviderVerification(prepared({ action: "approveOffer", communityId,
      expectedRevision: 7, offerId, offerVersion: 1 }), Object.freeze({ ...view,
      offers: Object.freeze([Object.freeze({ offer, reviewState: "awaiting_approval" as const })]) }), destinationGuildId);
    expect(approving.offerChecks).toEqual([{ communityId, offer }]);
    const submitting = planPartnerAlertProviderVerification(Object.freeze({ requestId,
      target: Object.freeze({ kind: "community_owner" as const, communityId }),
      command: Object.freeze({ action: "submitRequest" as const, communityId, expectedRevision: 7 }) }), view, destinationGuildId);
    expect(submitting.offerChecks).toEqual([{ communityId, offer }]);
  });

  it("requests pricing capabilities only for an agreement proposal", () => {
    const plan = planPartnerAlertProviderVerification(prepared({ action: "proposePublishingAgreement", communityId,
      expectedRevision: 7, contractedChannels: 1, terms: Object.freeze({ termsId: offerId, communityId, version: 1,
        pricingSource: "standard", currency: offer.currency, firstChannelAmountMinor: 1000,
        additionalChannelAmountMinor: 500, includedChannels: 1, cadence: offer.cadence }) }), view, destinationGuildId);
    expect(plan.pricingCapabilitiesRequired).toBe(true);
    expect(plan.resourceChecks).toEqual([]);
    expect(plan.offerChecks).toEqual([]);
  });

  it("rejects stale partner revisions before provider work", () => {
    expect(() => planPartnerAlertProviderVerification(prepared({ action: "approvePartner", communityId,
      expectedRevision: 6 }), view, destinationGuildId)).toThrowError(/Reload/);
  });
});
