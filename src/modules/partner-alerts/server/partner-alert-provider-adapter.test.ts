import { describe, expect, it, vi } from "vitest";

import type { PartnerAlertOffer } from "../contracts/partner-alert-contracts";
import { createPartnerAlertProviderVerifier } from "./partner-alert-provider-adapter";
import { createPartnerAlertProviderFactSet } from "./partner-alert-provider-facts";
import type { PartnerAlertProviderVerificationPlan } from "./partner-alert-provider-verification";

const offer: PartnerAlertOffer = Object.freeze({
  offerId: "30000000-0000-4000-8000-000000000003",
  communityId: "20000000-0000-4000-8000-000000000002", version: 1, kind: "channel", title: "Morning alerts",
  mappingIds: Object.freeze(["40000000-0000-4000-8000-000000000004"]),
  currency: Object.freeze({ code: "USD", minorUnitDigits: 2 }), amountMinor: 2500,
  cadence: Object.freeze({ unit: "calendar_month", count: 1 }),
  whop: Object.freeze({ environment: "live", accountId: "biz_partner", productId: "prod_alerts", planId: "plan_monthly" }),
});
const target = Object.freeze({ communityId: offer.communityId, sourceGuildId: "200000000000000002",
  sourceChannelId: "300000000000000003", destinationGuildId: "100000000000000001",
  destinationChannelId: "400000000000000004", destinationRoleId: "500000000000000005" });
const receipt = Object.freeze({ ...target, sourceTextChannel: true as const, sourceReadable: true as const,
  messageContentAvailable: true as const, destinationReadOnly: true as const, destinationPrivate: true as const,
  destinationRoleManageable: true as const, destinationRoleExclusiveToTradersLink: true as const,
  observedAtUtc: "2026-11-02T12:00:00.000Z", validUntilUtc: "2026-11-02T12:01:00.000Z" });
const offerReceipt = Object.freeze({ communityId: offer.communityId,
  communityOwnerUserId: "10000000-0000-4000-8000-000000000001", binding: offer.whop, offer,
  membershipVerificationAuthorised: true as const, observedAtUtc: "2026-11-02T12:00:00.000Z",
  validUntilUtc: "2026-11-02T12:01:00.000Z" });
const plan: PartnerAlertProviderVerificationPlan = Object.freeze({ action: "approvePartner",
  communityId: offer.communityId, requestId: "50000000-0000-4000-8000-000000000005",
  resourceChecks: Object.freeze([target]), offerChecks: Object.freeze([{ communityId: offer.communityId, offer }]),
  pricingCapabilitiesRequired: true });

describe("Partner Channel isolated provider adapter", () => {
  it("runs only the exact plan in order and returns detached collections", async () => {
    const calls: string[] = [];
    const verifier = createPartnerAlertProviderVerifier({
      verifyDiscordResources: async (value, signal) => { expect(signal.aborted).toBe(false); calls.push("discord");
        expect(value).toBe(target); return receipt; },
      verifyWhopOffer: async (value) => { calls.push("whop"); expect(value.offer).toBe(offer); return offerReceipt; },
      readPricingCapabilities: async () => { calls.push("pricing"); return { currencies: [offer.currency], calendarMonthCadence: true }; },
    });
    const result = await verifier(plan, new AbortController().signal);
    expect(calls).toEqual(["discord", "whop", "pricing"]);
    expect(result).toEqual({ resources: [receipt], offers: [offerReceipt],
      pricing: { currencies: [offer.currency], calendarMonthCadence: true } });
    expect(Object.isFrozen(result.resources)).toBe(true);
    expect(Object.isFrozen(result.offers)).toBe(true);
  });

  it("performs zero provider calls when already aborted", async () => {
    const controller = new AbortController(); controller.abort();
    const verifyDiscordResources = vi.fn();
    const verifier = createPartnerAlertProviderVerifier({ verifyDiscordResources,
      verifyWhopOffer: vi.fn(), readPricingCapabilities: vi.fn() });
    await expect(verifier(plan, controller.signal)).rejects.toThrow(/cancelled/);
    expect(verifyDiscordResources).not.toHaveBeenCalled();
  });

  it("stops before later providers when cancellation follows a completed check", async () => {
    const controller = new AbortController();
    const verifyWhopOffer = vi.fn(); const readPricingCapabilities = vi.fn();
    const verifier = createPartnerAlertProviderVerifier({
      verifyDiscordResources: async () => { controller.abort(); return receipt; },
      verifyWhopOffer, readPricingCapabilities,
    });
    await expect(verifier(plan, controller.signal)).rejects.toThrow(/cancelled/);
    expect(verifyWhopOffer).not.toHaveBeenCalled();
    expect(readPricingCapabilities).not.toHaveBeenCalled();
  });

  it("skips every unplanned provider class", async () => {
    const verifier = createPartnerAlertProviderVerifier({ verifyDiscordResources: vi.fn(),
      verifyWhopOffer: vi.fn(), readPricingCapabilities: vi.fn() });
    await expect(verifier(Object.freeze({ ...plan, resourceChecks: Object.freeze([]),
      offerChecks: Object.freeze([]), pricingCapabilitiesRequired: false }),
    new AbortController().signal)).resolves.toEqual({ resources: [], offers: [], pricing: null });
  });

  it("verifies a Stripe-only offer with the connected seller and preserves the exact review scope", async () => {
    const { whop, ...details } = offer;
    expect(whop.accountId).toBe("biz_partner");
    const stripeOffer = { ...details, billingProvider: "stripe" as const };
    const stripePlan = { ...plan, action: "approveOffer" as const, resourceChecks: [],
      offerChecks: [], stripeOfferChecks: [{ communityId: offer.communityId, offer: stripeOffer }],
      pricingCapabilitiesRequired: false };
    const stripeReceipt = { communityId: offer.communityId, communityOwnerUserId: offerReceipt.communityOwnerUserId,
      offer: stripeOffer, sellerAccountId: "acct_fixture", environment: "sandbox" as const,
      observedAtUtc: offerReceipt.observedAtUtc, validUntilUtc: offerReceipt.validUntilUtc };
    const readWhop = vi.fn();
    const verifier = createPartnerAlertProviderVerifier({
      verifyDiscordResources: vi.fn(), verifyWhopOffer: readWhop, readPricingCapabilities: vi.fn(),
      verifyStripeOffer: vi.fn(async () => stripeReceipt),
    });
    const result = await verifier(stripePlan, new AbortController().signal);
    expect(readWhop).not.toHaveBeenCalled();
    const facts = createPartnerAlertProviderFactSet(stripePlan, result);
    expect(facts.requireStripeOffer(offer.communityId, stripeOffer)).toEqual(stripeReceipt);
    expect(() => facts.requireStripeOffer(offer.communityId, { ...stripeOffer, amountMinor: 100 })).toThrow();
    expect(() => createPartnerAlertProviderFactSet(stripePlan, { ...result, stripeOffers: [] })).toThrow();
    facts.destroy();
    expect(() => facts.requireStripeOffer(offer.communityId, stripeOffer)).toThrow();
  });
});
