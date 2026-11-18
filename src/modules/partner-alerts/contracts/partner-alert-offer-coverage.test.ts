import { describe, expect, it } from "vitest";
import { requirePartnerAlertOfferCoverage } from "./partner-alert-offer-coverage";

const id = (n: number) => `10000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const community = id(1), first = id(2), second = id(3), third = id(4);
function offer(n: number, mappings: readonly string[], owner = community) {
  return { offerId: id(n), communityId: owner, version: 1,
    kind: mappings.length === 1 ? "channel" : "package", title: "Alerts",
    mappingIds: mappings, currency: { code: "USD", minorUnitDigits: 2 }, amountMinor: 2500,
    cadence: { unit: "calendar_month", count: 1 },
    whop: { environment: "live", accountId: "biz_source", productId: "prod_alerts", planId: `plan_${n}` } };
}

describe("Partner application offer coverage", () => {
  it("accepts a package without mandatory individual subscriptions", () => {
    expect(requirePartnerAlertOfferCoverage(community, [first, second], [offer(10, [first, second])]))
      .toHaveLength(1);
  });
  it("accepts individual-only coverage", () => {
    expect(requirePartnerAlertOfferCoverage(community, [first, second], [offer(10, [first]), offer(11, [second])]))
      .toHaveLength(2);
  });
  it("accepts mixed package and individual coverage with overlap", () => {
    expect(requirePartnerAlertOfferCoverage(community, [first, second, third],
      [offer(10, [first, second]), offer(11, [third]), offer(12, [first])])).toHaveLength(3);
  });
  it("rejects an uncovered selected channel", () => {
    expect(() => requirePartnerAlertOfferCoverage(community, [first, second, third], [offer(10, [first, second])])).toThrow();
  });
  it("rejects a different community even for otherwise matching channels", () => {
    expect(() => requirePartnerAlertOfferCoverage(community, [first, second], [offer(10, [first, second], id(99))])).toThrow();
  });
  it("rejects an offer referring to an unavailable or withdrawn channel", () => {
    expect(() => requirePartnerAlertOfferCoverage(community, [first, second], [offer(10, [first, third])])).toThrow();
  });
  it("rejects no offers", () => {
    expect(() => requirePartnerAlertOfferCoverage(community, [first], [])).toThrow();
  });
  it("rejects repeated versions of the same offer in the submission snapshot", () => {
    expect(() => requirePartnerAlertOfferCoverage(community, [first], [offer(10, [first]), offer(10, [first])])).toThrow();
  });
  it("still validates the provider-bound offer structure", () => {
    expect(() => requirePartnerAlertOfferCoverage(community, [first], [{ ...offer(10, [first]), whop: {} }])).toThrow();
  });
});
