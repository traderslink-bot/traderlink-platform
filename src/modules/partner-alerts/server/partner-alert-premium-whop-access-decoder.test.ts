import { describe, expect, it } from "vitest";
import { decodePartnerAlertPremiumWhopCurrentAccess as decode } from "./partner-alert-premium-whop-access-decoder";

const observed = "2026-11-17T11:00:00.000Z";
const dollars = (amount: string) => ({ currency: "usd", amount, decimals: 2, display_decimals: 2 });

function fixture() {
  return {
    purchase: {
      offer: { scopeRef: "premium_sandbox", environment: "sandbox" as const,
        accountId: "biz_premium", productId: "prod_premium", planId: "plan_premium" },
      payer: { kind: "bound" as const, linkId: "00000000-0000-4000-8000-000000000001",
        whopUserRefHmac: "a".repeat(64), whopUserId: "user_buyer" },
    },
    observedAtUtc: observed, validUntilUtc: "2026-11-17T11:00:30.000Z",
    hydrated: {
      kind: "partner_alert_premium_whop_hydration_v1", account: { id: "biz_premium" },
      variant: { id: "plan_premium", account: { id: "biz_premium" }, product: { id: "prod_premium" },
        currency: "usd", billing_type: "renewal", renewal_price: 1, trial_period_days: null as number | null,
        billing_period: 30 },
      productAccess: "customer", membershipDiscoveryComplete: true, discoveredMembershipIds: ["mem_paid"],
      members: [{
        membership: { id: "mem_paid", account: { id: "biz_premium" }, user_id: "user_buyer",
          product_id: "prod_premium", variant_id: "plan_premium", status: "active" },
        paymentsComplete: true,
        payments: [{ payment: { id: "pay_paid", account_id: "biz_premium", membership_id: "mem_paid",
          user: { id: "user_buyer" }, product_id: "prod_premium", variant_id: "plan_premium",
          currency: "usd", status: "paid", billing_reason: "subscription_create",
          paid_at: "2026-11-17T10:59:00.000Z", total: dollars("1.13"), subtotal: dollars("1.00"),
          refunded_amount: dollars("0.00"), dispute_created_at: null, dispute_alerted_at: null },
        refundsComplete: true, refunds: [] as unknown[], disputesComplete: true, disputes: [] as unknown[] }],
      }],
    },
  };
}

describe("native Whop current paid-access decoding (local fixtures only)", () => {
  it("preserves exact paid basis and finite access freshness without creating a paid period", () => {
    const result = decode(fixture());
    expect(result).toMatchObject({ protocol: "platform_premium_current_paid_access_v1", discovery: "complete",
      observedAtUtc: observed, validUntilUtc: "2026-11-17T11:00:30.000Z", members: [{
        membershipRef: "mem_paid", nativeStatus: "active", accessKind: "paid_membership",
        productAccess: "customer", attribution: "exclusive_paid_scope", paidBasis: {
          paymentRef: "pay_paid", settlement: "settled", amountMinor: "100", currency: "USD",
          refund: "none", dispute: "none",
        },
      }] });
    expect(JSON.stringify(result)).not.toMatch(/paidThrough|startsAt|endsAt|coverage/);
  });

  it.each(["account_id", "membership_id", "product_id", "variant_id"] as const)(
    "refuses a payment from a different %s", field => {
      const input = fixture(); input.hydrated.members[0].payments[0].payment[field] = "foreign";
      expect(decode(input)).toBeNull();
    });

  it("refuses another payer even when the payment and product match", () => {
    const input = fixture(); input.hydrated.members[0].payments[0].payment.user.id = "user_other";
    expect(decode(input)).toBeNull();
  });

  it.each(["user_id", "product_id"] as const)("refuses a membership with a different %s", field => {
    const input = fixture(); input.hydrated.members[0].membership[field] = "foreign";
    expect(decode(input)).toBeNull();
  });

  it("does not classify a paid trial entry fee as paid membership", () => {
    const input = fixture(); input.hydrated.variant.trial_period_days = 7;
    input.hydrated.members[0].membership.status = "trialing";
    expect(decode(input)?.members[0].accessKind).toBe("trial");
  });

  it("does not classify a free variant as paid because an adjustment has money", () => {
    const input = fixture(); input.hydrated.variant.renewal_price = 0;
    expect(decode(input)?.members[0].accessKind).toBe("unknown");
  });

  it.each(["active", "trialing", "expired"])("keeps a %s sibling visible as ambiguous", nativeStatus => {
    const input = fixture(), sibling = structuredClone(input.hydrated.members[0]);
    sibling.membership.id = "mem_free"; sibling.membership.variant_id = "plan_free";
    sibling.membership.status = nativeStatus; sibling.payments = [];
    input.hydrated.discoveredMembershipIds.push("mem_free"); input.hydrated.members.push(sibling);
    const result = decode(input);
    expect(result?.members).toHaveLength(2);
    expect(result?.members.every(member => member.attribution === "ambiguous")).toBe(true);
    expect(result?.members[1].paidBasis).toBeNull();
  });

  it("cannot hide a discovered sibling by dropping its hydrated membership", () => {
    const input = fixture(); input.hydrated.discoveredMembershipIds.push("mem_free");
    expect(decode(input)).toBeNull();
  });

  it("cannot call an unfinished discovery complete", () => {
    const input = fixture(); input.hydrated.membershipDiscoveryComplete = false;
    expect(decode(input)?.discovery).toBe("incomplete");
  });

  it("cannot use a payment from an unfinished payment scan", () => {
    const input = fixture(); input.hydrated.members[0].paymentsComplete = false;
    expect(decode(input)?.members[0].paidBasis).toBeNull();
  });

  it("keeps a denied or unfinished dispute read unknown", () => {
    const input = fixture(); input.hydrated.members[0].payments[0].disputesComplete = false;
    expect(decode(input)?.members[0].paidBasis?.dispute).toBe("unknown");
  });

  it.each(["refunds", "disputes"] as const)("does not silently clear an unfamiliar %s record", kind => {
    const input = fixture(); input.hydrated.members[0].payments[0][kind] = [{ id: "unqualified_adjustment" }];
    expect(decode(input)?.members[0].paidBasis?.[kind === "refunds" ? "refund" : "dispute"]).toBe("unknown");
  });

  it("does not treat admin product access as customer access", () => {
    const input = fixture(); input.hydrated.productAccess = "admin";
    expect(decode(input)?.members[0].productAccess).toBe("admin");
  });

  it("retains the native past-due/customer facts for the shared grace decision", () => {
    const input = fixture(); input.hydrated.members[0].membership.status = "past_due";
    expect(decode(input)?.members[0]).toMatchObject({ nativeStatus: "past_due", productAccess: "customer",
      paidBasis: { settlement: "settled" } });
  });

  it("retains an actual cancellation and absent access without inventing an expiry", () => {
    const input = fixture(); input.hydrated.members[0].membership.status = "canceled";
    input.hydrated.productAccess = "absent";
    expect(decode(input)?.members[0]).toMatchObject({ nativeStatus: "canceled", productAccess: "absent" });
  });

  it.each(["adjustment", "trial_create", "unknown"])("does not turn %s into a paid subscription", reason => {
    const input = fixture(); input.hydrated.members[0].payments[0].payment.billing_reason = reason;
    expect(decode(input)?.members[0].paidBasis?.settlement).toBe("unknown");
  });

  it("does not use tax or an unrelated positive total as a paid subscription subtotal", () => {
    const input = fixture(); input.hydrated.members[0].payments[0].payment.subtotal = dollars("0.00");
    expect(decode(input)?.members[0].paidBasis?.settlement).toBe("unknown");
  });

  it("refuses malformed money precision instead of rounding", () => {
    const input = fixture(); input.hydrated.members[0].payments[0].payment.subtotal = dollars("1.001");
    expect(decode(input)).toBeNull();
  });

  it("refuses a fabricated long observation window", () => {
    const input = fixture(); input.validUntilUtc = "2026-11-17T12:00:00.000Z";
    expect(decode(input)).toBeNull();
  });

  it("does not reinterpret a live purchase as a sandbox purchase", () => {
    const input = fixture();
    expect(decode({ ...input, purchase: { ...input.purchase, offer: { ...input.purchase.offer, environment: "live" } } })).toBeNull();
  });

  it("does not use a future payment timestamp", () => {
    const input = fixture(); input.hydrated.members[0].payments[0].payment.paid_at = "2026-11-18T10:00:00.000Z";
    expect(decode(input)?.members[0].paidBasis?.settlement).toBe("unknown");
  });

  it("cannot infer absence from no memberships while the product still grants access", () => {
    const input = fixture(); input.hydrated.members = []; input.hydrated.discoveredMembershipIds = [];
    expect(decode(input)?.discovery).toBe("incomplete");
    input.hydrated.productAccess = "absent";
    expect(decode(input)?.discovery).toBe("complete");
  });
});
