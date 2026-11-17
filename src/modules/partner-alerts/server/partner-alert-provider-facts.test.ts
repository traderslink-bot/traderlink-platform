import { describe, expect, it } from "vitest";

import type { PartnerAlertOffer } from "../contracts/partner-alert-contracts";
import type { PartnerAlertProviderVerificationPlan } from "./partner-alert-provider-verification";
import { createPartnerAlertProviderFactSet, requirePartnerAlertProviderFactSet } from "./partner-alert-provider-facts";

const offer: PartnerAlertOffer = Object.freeze({
  offerId: "30000000-0000-4000-8000-000000000003",
  communityId: "20000000-0000-4000-8000-000000000002", version: 1, kind: "channel", title: "Morning alerts",
  mappingIds: Object.freeze(["40000000-0000-4000-8000-000000000004"]),
  currency: Object.freeze({ code: "USD", minorUnitDigits: 2 }), amountMinor: 2500,
  cadence: Object.freeze({ unit: "calendar_month", count: 1 }),
  whop: Object.freeze({ environment: "live", accountId: "biz_partner", productId: "prod_alerts", planId: "plan_monthly" }),
});
const resource = Object.freeze({
  communityId: offer.communityId, sourceGuildId: "200000000000000002", sourceChannelId: "300000000000000003",
  destinationGuildId: "100000000000000001", destinationChannelId: "400000000000000004",
  destinationRoleId: "500000000000000005",
});
const plan: PartnerAlertProviderVerificationPlan = Object.freeze({
  action: "approvePartner", communityId: offer.communityId, requestId: "50000000-0000-4000-8000-000000000005",
  resourceChecks: Object.freeze([resource]), offerChecks: Object.freeze([{ communityId: offer.communityId, offer }]),
  pricingCapabilitiesRequired: false,
});
const resourceReceipt = Object.freeze({ ...resource, sourceTextChannel: true as const, sourceReadable: true as const,
  messageContentAvailable: true as const, destinationReadOnly: true as const, destinationPrivate: true as const,
  destinationRoleManageable: true as const, destinationRoleExclusiveToTradersLink: true as const,
  observedAtUtc: "2026-11-02T12:00:00.000Z", validUntilUtc: "2026-11-02T12:01:00.000Z" });
const offerReceipt = Object.freeze({ communityId: offer.communityId,
  communityOwnerUserId: "10000000-0000-4000-8000-000000000001", binding: offer.whop, offer,
  membershipVerificationAuthorised: true as const, observedAtUtc: "2026-11-02T12:00:00.000Z",
  validUntilUtc: "2026-11-02T12:01:00.000Z" });

describe("Partner Channel provider fact set", () => {
  it("serves only the exact complete planned facts while live", () => {
    const facts = createPartnerAlertProviderFactSet(plan, { resources: [resourceReceipt], offers: [offerReceipt], pricing: null });
    expect(requirePartnerAlertProviderFactSet(facts, plan)).toBe(facts);
    expect(facts.requireResources(resource)).toEqual(resourceReceipt);
    expect(facts.requireWhopOffer(offer.communityId, offer)).toEqual(offerReceipt);
    expect(() => facts.pricingCapabilities()).toThrow(/unavailable/);
  });

  it("rejects missing, extra, duplicate and mismatched facts", () => {
    expect(() => createPartnerAlertProviderFactSet(plan, { resources: [], offers: [offerReceipt], pricing: null })).toThrow();
    expect(() => createPartnerAlertProviderFactSet(plan, { resources: [resourceReceipt, resourceReceipt], offers: [offerReceipt], pricing: null })).toThrow();
    expect(() => createPartnerAlertProviderFactSet(plan, { resources: [{ ...resourceReceipt, destinationRoleId: "600000000000000006" }], offers: [offerReceipt], pricing: null })).toThrow();
    expect(() => createPartnerAlertProviderFactSet(plan, { resources: [resourceReceipt], offers: [offerReceipt],
      pricing: { currencies: [offer.currency], calendarMonthCadence: true } })).toThrow();
  });

  it("rejects incomplete provider safety and offer binding evidence", () => {
    expect(() => createPartnerAlertProviderFactSet(plan, { resources: [{ ...resourceReceipt, destinationPrivate: false as never }], offers: [offerReceipt], pricing: null })).toThrow();
    expect(() => createPartnerAlertProviderFactSet(plan, { resources: [resourceReceipt], offers: [{ ...offerReceipt,
      binding: { ...offer.whop, planId: "plan_other" } }], pricing: null })).toThrow();
  });

  it("destroys every callback and rejects plain-object or wrong-plan substitution", () => {
    const facts = createPartnerAlertProviderFactSet(plan, { resources: [resourceReceipt], offers: [offerReceipt], pricing: null });
    expect(() => requirePartnerAlertProviderFactSet({ ...facts }, plan)).toThrow();
    expect(() => requirePartnerAlertProviderFactSet(facts, { ...plan })).toThrow();
    facts.destroy(); facts.destroy();
    expect(() => facts.requireResources(resource)).toThrow(/unavailable/);
    expect(() => requirePartnerAlertProviderFactSet(facts, plan)).toThrow(/unavailable/);
  });

  it("snapshots nested offer facts before an adapter can mutate its objects", () => {
    const mutableOffer = structuredClone(offer);
    const mutableReceipt = { ...offerReceipt, offer: mutableOffer, binding: { ...offer.whop } };
    const mutablePlan = Object.freeze({ ...plan,
      offerChecks: Object.freeze([{ communityId: offer.communityId, offer: mutableOffer }]) });
    const facts = createPartnerAlertProviderFactSet(mutablePlan, {
      resources: [resourceReceipt], offers: [mutableReceipt], pricing: null,
    });
    Reflect.set(mutableOffer, "title", "Changed after verification");
    (mutableOffer.mappingIds as string[]).push("60000000-0000-4000-8000-000000000006");
    Reflect.set(mutableOffer.cadence, "count", 2);
    Reflect.set(mutableReceipt.binding, "planId", "plan_changed");
    const captured = facts.requireWhopOffer(offer.communityId, offer);
    expect(captured.offer).toEqual(offer);
    expect(captured.binding).toEqual(offer.whop);
    facts.destroy();
  });

  it("validates a pricing-only plan without accepting provider receipts", () => {
    const pricingPlan = Object.freeze({ ...plan, action: "proposePublishingAgreement" as const,
      resourceChecks: Object.freeze([]), offerChecks: Object.freeze([]), pricingCapabilitiesRequired: true });
    const facts = createPartnerAlertProviderFactSet(pricingPlan, { resources: [], offers: [],
      pricing: { currencies: [offer.currency], calendarMonthCadence: true } });
    expect(facts.pricingCapabilities()).toEqual({ currencies: [offer.currency], calendarMonthCadence: true });
    facts.destroy();
  });
});
