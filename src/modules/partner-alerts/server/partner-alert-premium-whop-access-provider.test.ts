import { describe, expect, it, vi } from "vitest";
import { createPartnerAlertPremiumWhopAccessProvider } from "./partner-alert-premium-whop-access-provider";

vi.mock("server-only", () => ({}));
// Runtime classification is a local fixture here. Actual artifact admission has
// its own tests; none of these mocked HTTP results qualify a staging deployment.
vi.mock("./partner-alert-isolated-staging", () => ({
  readPartnerAlertIsolatedStaging: (env: NodeJS.ProcessEnv) => env.UNIT_STAGE === "qualified"
    ? { origin: "https://isolated.example.invalid", fingerprint: env.UNIT_STAGE_BINDING ?? "original" } : null,
}));

const offer = { scopeRef: "premium_qa", environment: "sandbox" as const,
  accountId: "biz_qa", productId: "prod_qa", planId: "plan_qa" };
const purchase = { offer, payer: { kind: "bound" as const, linkId: "00000000-0000-4000-8000-000000000001",
  whopUserRefHmac: "a".repeat(64), whopUserId: "user_qa" } };
const money = (amount: string) => ({ amount, currency: "usd", decimals: 2, display_decimals: 2 });
const page = (data: unknown[], hasNext = false, endCursor: string | null = null) =>
  Response.json({ data, page_info: { has_next_page: hasNext, end_cursor: endCursor } });

function fixture() {
  const environment: NodeJS.ProcessEnv = { NODE_ENV: "test", UNIT_STAGE: "qualified" };
  const member = { id: "mem_qa", account: { id: "biz_qa" }, user_id: "user_qa",
    product_id: "prod_qa", variant_id: "plan_qa", status: "active", cancel_at_period_end: false };
  const variant = { id: "plan_qa", account: { id: "biz_qa" }, product: { id: "prod_qa" },
    currency: "usd", billing_type: "renewal", initial_price: 1, renewal_price: 1, billing_period: 30,
    trial_period_days: null };
  const payment = { id: "pay_qa", account_id: "biz_qa", user: { id: "user_qa" },
    membership_id: "mem_qa", product_id: "prod_qa", variant_id: "plan_qa", currency: "usd",
    status: "paid", billing_reason: "subscription_create", paid_at: "2026-11-17T10:00:00.000Z",
    total: money("1.00"), subtotal: money("1.00"), refunded_amount: money("0.00"),
    dispute_created_at: null, dispute_alerted_at: null };
  const requests: URL[] = [];
  let intercept: ((url: URL) => Response | undefined) | undefined;
  const transport = async (url: string, init: RequestInit) => {
    const u = new URL(url); requests.push(u); expect(init.method).toBe("GET");
    expect(u.origin).toBe("https://sandbox-api.whop.com");
    const replacement = intercept?.(u); if (replacement) return replacement;
    if (u.pathname === "/api/v1/variants/plan_qa") return Response.json(variant);
    if (u.pathname === "/api/v1/memberships") return page([member]);
    if (u.pathname === "/api/v1/memberships/mem_qa") return Response.json(member);
    if (u.pathname === "/api/v1/payments") return page([payment]);
    if (u.pathname === "/api/v1/payments/pay_qa") return Response.json(payment);
    if (u.pathname === "/api/v1/refunds" || u.pathname === "/api/v1/disputes") return page([]);
    if (u.pathname === "/api/v1/users/user_qa/access/prod_qa") return Response.json({ has_access: true, access_level: "customer" });
    throw new Error("Unexpected fixture HTTP target");
  };
  const configuration = { environment, offer, client: { environment: "sandbox" as const,
    apiVersionDate: "2026-10-27-2" as const, accountId: "biz_qa", bearerToken: "unit_fixture_read_key" },
  qualification: { reviewRef: "unit_premium_review", schemaSha256: "b".repeat(64),
    apiVersion: "2026-10-27-2", accountId: "biz_qa", environment: "sandbox" as const },
  nowUtc: () => "2026-11-17T11:00:00.000Z", transport };
  return { configuration, environment, member, variant, payment, requests,
    intercept: (callback: typeof intercept) => { intercept = callback; } };
}

describe("sandbox Premium native HTTP preparation (local transport fixtures only)", () => {
  it("uses the actual shared receipt factory after scoped complete reads", async () => {
    const f = fixture(), provider = createPartnerAlertPremiumWhopAccessProvider(f.configuration)!;
    expect(f.requests).toHaveLength(0);
    const result = await provider.prepare({ purchase, knownMembershipIds: [] });
    expect(result.kind).toBe("prepared_native_current_paid_access");
    if (result.kind !== "prepared_native_current_paid_access") throw new Error("Expected local prepared facts");
    expect(result.collection.members[0].paidBasis).toMatchObject({ paymentRef: "pay_qa", settlement: "settled" });
    expect(result.collection.validUntilUtc).toBe("2026-11-17T11:00:30.000Z");
    expect(JSON.stringify(result)).not.toMatch(/paidThrough|startsAt|endsAt/);
    expect(Object.keys(provider)).not.toContain("decoder");
    expect(f.requests.some(url => url.pathname.startsWith("/api/v1/accounts/"))).toBe(false);
  });

  it("does nothing outside the classified isolated runtime", () => {
    const f = fixture(); delete f.environment.UNIT_STAGE;
    expect(createPartnerAlertPremiumWhopAccessProvider(f.configuration)).toBeNull();
    expect(f.requests).toHaveLength(0);
  });

  it("refuses a different merchant before credential use", () => {
    const f = fixture(); f.configuration.client.accountId = "biz_other";
    expect(() => createPartnerAlertPremiumWhopAccessProvider(f.configuration)).toThrow();
    expect(f.requests).toHaveLength(0);
  });

  it("rejects a variant from another merchant before membership or payment reads", async () => {
    const f = fixture(); f.variant.account.id = "biz_foreign";
    expect((await createPartnerAlertPremiumWhopAccessProvider(f.configuration)!.prepare({ purchase,knownMembershipIds: [] })).kind)
      .toBe("unqualified");
    expect(f.requests).toHaveLength(1);
    expect(f.requests[0].pathname).toBe("/api/v1/variants/plan_qa");
  });

  it("stops after a binding changes during an awaited read", async () => {
    const f = fixture();
    f.intercept(() => { f.environment.UNIT_STAGE_BINDING = "changed"; return undefined; });
    const provider = createPartnerAlertPremiumWhopAccessProvider(f.configuration)!;
    expect((await provider.prepare({ purchase, knownMembershipIds: [] })).kind).toBe("unqualified");
    expect(f.requests).toHaveLength(1);
  });

  it.each([401, 403, 500])("does not mint an absence or no-dispute result for HTTP%s", async status => {
    const f = fixture();
    f.intercept(url => url.pathname === "/api/v1/disputes"
      ? Response.json({ error: { message: "Unavailable fixture read" } }, { status }) : undefined);
    const result = await createPartnerAlertPremiumWhopAccessProvider(f.configuration)!.prepare({ purchase, knownMembershipIds: [] });
    expect(result.kind).toBe("unqualified");
  });

  it("does not filter a free sibling out of same-product discovery", async () => {
    const f = fixture(), free = { ...f.member, id: "mem_free", variant_id: "plan_free" };
    f.intercept(url => url.pathname === "/api/v1/memberships" ? page([f.member, free])
      : url.pathname === "/api/v1/memberships/mem_free" ? Response.json(free) : undefined);
    const result = await createPartnerAlertPremiumWhopAccessProvider(f.configuration)!.prepare({ purchase, knownMembershipIds: [] });
    expect(result.kind).toBe("prepared_native_current_paid_access");
    if (result.kind !== "prepared_native_current_paid_access") throw new Error("Expected ambiguity facts");
    expect(result.collection.members).toHaveLength(2);
    expect(result.collection.members.every(member => member.attribution === "ambiguous")).toBe(true);
  });

  it("uses the exact known membership fallback when listing omits it", async () => {
    const f = fixture(); f.intercept(url => url.pathname === "/api/v1/memberships" ? page([]) : undefined);
    const result = await createPartnerAlertPremiumWhopAccessProvider(f.configuration)!.prepare({ purchase, knownMembershipIds: ["mem_qa"] });
    expect(result.kind).toBe("prepared_native_current_paid_access");
    expect(f.requests.some(url => url.pathname === "/api/v1/memberships/mem_qa")).toBe(true);
  });

  it("refuses another user's known membership before reading its payments", async () => {
    const f = fixture(); f.member.user_id = "user_foreign";
    const result = await createPartnerAlertPremiumWhopAccessProvider(f.configuration)!.prepare({ purchase, knownMembershipIds: ["mem_qa"] });
    expect(result.kind).toBe("unqualified");
    expect(f.requests.some(url => url.pathname.startsWith("/api/v1/payments"))).toBe(false);
  });

  it("rejects a membership page that repeats identities", async () => {
    const f = fixture(); f.intercept(url => url.pathname === "/api/v1/memberships" ? page([f.member, f.member]) : undefined);
    expect((await createPartnerAlertPremiumWhopAccessProvider(f.configuration)!.prepare({ purchase, knownMembershipIds: [] })).kind)
      .toBe("unqualified");
  });

  it("rechecks a changed membership before minting a receipt", async () => {
    const f = fixture(); let reads = 0;
    f.intercept(url => url.pathname === "/api/v1/memberships/mem_qa" && ++reads === 2
      ? Response.json({ ...f.member, status: "canceled" }) : undefined);
    expect((await createPartnerAlertPremiumWhopAccessProvider(f.configuration)!.prepare({ purchase, knownMembershipIds: [] })).kind)
      .toBe("unqualified");
  });

  it("rechecks changed product access before minting a receipt", async () => {
    const f = fixture(); let reads = 0;
    f.intercept(url => url.pathname.includes("/access/") && ++reads === 2
      ? Response.json({ has_access: false, access_level: "no_access" }) : undefined);
    expect((await createPartnerAlertPremiumWhopAccessProvider(f.configuration)!.prepare({ purchase, knownMembershipIds: [] })).kind)
      .toBe("unqualified");
  });

  it("does not reinterpret a different offer from the caller", async () => {
    const f = fixture();
    const result = await createPartnerAlertPremiumWhopAccessProvider(f.configuration)!.prepare({
      purchase: { ...purchase, offer: { ...offer, productId: "prod_channel_purchase" } }, knownMembershipIds: [],
    });
    expect(result.kind).toBe("unqualified"); expect(f.requests).toHaveLength(0);
  });
});
