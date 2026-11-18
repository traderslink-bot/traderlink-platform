import { describe, expect, it } from "vitest";

import { normalizePartnerAlertWhopCheckout, PARTNER_ALERT_WHOP_CHECKOUT_CONTRACT } from "./partner-alert-whop-normalization";

const communityId = "20000000-0000-4000-8000-000000000002";
const ownerUserId = "10000000-0000-4000-8000-000000000001";
const at = "2026-11-02T12:00:00.000Z";
const offer = Object.freeze({
  offerId: "30000000-0000-4000-8000-000000000003", communityId, version: 1, kind: "channel" as const,
  title: "Morning alerts", mappingIds: Object.freeze(["40000000-0000-4000-8000-000000000004"]),
  currency: Object.freeze({ code: "USD", minorUnitDigits: 2 }), amountMinor: 2500,
  cadence: Object.freeze({ unit: "day" as const, count: 30 }),
  whop: Object.freeze({ environment: "live" as const, accountId: "biz_partner",
    productId: "prod_alerts", planId: "plan_monthly" }),
});
const accountProof = Object.freeze({ communityId, ownerUserId, accountId: offer.whop.accountId,
  environment: "live" as const, ownerWhopUserRef: "a".repeat(64), observedAtUtc: at,
  validUntilUtc: "2026-11-02T12:05:00.000Z" });
const native = Object.freeze({
  id: offer.whop.planId, account: Object.freeze({ id: offer.whop.accountId }),
  product: Object.freeze({ id: offer.whop.productId }), currency: "usd", billing_type: "renewal",
  billing_period: 30, initial_price: 0, renewal_price: 25, adaptive_pricing_enabled: false,
  allow_multiple_quantity: false, release_method: "buy_now", visibility: "visible",
  split_pay_required_payments: null, trial_period_days: null,
  initial_price_due: Object.freeze({ amount: "25.00", currency: "usd", decimals: 2 }),
  purchase_url: "https://whop.com/market-desk/checkout/plan_monthly",
});
const input = (purchaseUrl: string) => ({ native: { ...native, purchase_url: purchaseUrl }, offer,
  accountProof, allowConfiguredTrial: false, nowUtc: at, maximumEvidenceAgeMs: 60_000 });

describe("Partner Channel Whop checkout qualification", () => {
  it("binds the exact documented provider purchase URL to the qualified offer", () => {
    const proof = normalizePartnerAlertWhopCheckout(input(native.purchase_url));
    expect(proof.checkoutHref).toBe(native.purchase_url);
    expect(proof.receipt.offer).toEqual(offer);
    expect(PARTNER_ALERT_WHOP_CHECKOUT_CONTRACT).toMatchObject({
      responseField: "purchase_url", allowedOrigin: "https://whop.com",
      officialSource: "https://docs.whop.com/api-reference/beta/variants/retrieve-variant",
      versionSource: "https://docs.whop.com/developer/api/versioning",
    });
  });

  it.each([
    "http://whop.com/market-desk/checkout/plan_monthly",
    "https://evil.invalid/market-desk/checkout/plan_monthly",
    "https://whop.com/market-desk/checkout/plan_other",
    "https://user:secret@whop.com/market-desk/checkout/plan_monthly",
    "https://whop.com/market-desk/checkout/plan_monthly?redirect=https://evil.invalid",
    "https://whop.com/market-desk/checkout/plan_monthly#details",
    "https://whop.com/checkout/plan_monthly",
  ])("rejects an unsafe or foreign purchase URL: %s", (purchaseUrl) => {
    expect(() => normalizePartnerAlertWhopCheckout(input(purchaseUrl))).toThrow(/verification/);
  });

  it("rejects a valid-looking URL when the native plan price is foreign", () => {
    expect(() => normalizePartnerAlertWhopCheckout({ ...input(native.purchase_url),
      native: { ...native, renewal_price: 26 } })).toThrow(/verification/);
  });
});
