import { describe, expect, it } from "vitest";
import { newMembershipPlanPrice } from "./membership-plan-editor";
import { editorPriceTerms, membershipPriceCard } from "./membership-price-card";

describe("membership price card presentation", () => {
  const monthly = () => ({ ...newMembershipPlanPrice("preview"), billing: "recurring" as const, initialPrice: "12.00", renewalPrice: "12.00" });
  it("separates the prominent amount from currency and cadence", () => {
    expect(membershipPriceCard(editorPriceTerms(monthly()))).toEqual({
      amount: "12", currency: "USD", period: "/month", note: "", configured: true,
    });
  });
  it("retains introductory and renewal terms", () => {
    expect(membershipPriceCard(editorPriceTerms({ ...monthly(), initialPrice: "5.50", intervalCount: 3 })))
      .toMatchObject({ amount: "5.50", period: "to start", note: "Then USD 12.00/3 months." });
  });
  it("handles free, lifetime and one-time choices", () => {
    expect(membershipPriceCard(editorPriceTerms({ ...monthly(), billing: "free" }))).toMatchObject({ amount: "0", currency: "USD", period: "" });
    expect(membershipPriceCard(editorPriceTerms({ ...monthly(), billing: "lifetime" })).period).toBe("lifetime");
    expect(membershipPriceCard(editorPriceTerms({ ...monthly(), billing: "one_time" })).period).toBe("one-time");
  });
  it("keeps missing prices unknown and never infers money from an option name", () => {
    const terms = editorPriceTerms({ ...monthly(), name: "12.00", initialPrice: "", renewalPrice: "" });
    expect(terms.initialAmountMinor).toBeNull();
    expect(membershipPriceCard(terms)).toMatchObject({ amount: "—", configured: false, note: "Price to be confirmed." });
    expect(membershipPriceCard(editorPriceTerms({ ...monthly(), currency: "invalid" })).configured).toBe(false);
  });
  it("preserves zero prices and currency precision", () => {
    expect(membershipPriceCard(editorPriceTerms({ ...monthly(), initialPrice: "0", renewalPrice: "0" })).amount).toBe("0");
    expect(membershipPriceCard(editorPriceTerms({ ...monthly(), currency: "JPY", initialPrice: "1200", renewalPrice: "1200" })).amount).toBe("1,200");
    expect(membershipPriceCard(editorPriceTerms({ ...monthly(), currency: "BHD", initialPrice: "1.234", renewalPrice: "1.234" })).amount).toBe("1.234");
  });
});
