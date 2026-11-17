// @vitest-environment node
import Database from "better-sqlite3";
import { expect, it, vi } from "vitest";
import { createPartnerAlertStripeAccountClient, createPartnerAlertStripeOnboarding, partnerStripeSellerStatus } from "./partner-alert-stripe-onboarding";

it("resumes the same community seller and reads readiness directly from Stripe", async () => {
  const db = new Database(":memory:");
  let current = "restricted";
  let owner = true;
  let linkCount = 0;
  let sellerWasSaved = false;
  const stripe = vi.fn(async (path: string, data?: object) => {
    if (path === "accounts") return { id: "acct_seller", livemode: false };
    if (path === "account_links") {
      expect(sellerWasSaved).toBe(true);
      return { account: "acct_seller", livemode: false, url: `https://connect.stripe.com/setup/s/acct_seller/test${++linkCount}` };
    }
    expect(path).toBe("accounts/acct_seller");
    expect(data).toBeUndefined();
    return { id: "acct_seller", livemode: false, dashboard: "full", defaults: {
      responsibilities: { fees_collector: "stripe", losses_collector: "stripe", requirements_collector: "stripe" },
    }, configuration: { merchant: { capabilities: { card_payments: { status: current },
      stripe_balance: { payouts: { status: current } } } } } };
  });
  try {
    const service = createPartnerAlertStripeOnboarding(db, stripe);
    const page = "http://127.0.0.1:3039/communities/fixture/partner-channels";
    const start = () => {
      sellerWasSaved = false;
      return service.start("fixture", "owner", "US", page, `${page}?stripe=refresh`, () => owner, async account => {
        expect(account).toBe("acct_seller");
        sellerWasSaved = true;
      });
    };
    expect(await service.status("fixture", "owner")).toBe("unconnected");
    expect(await start()).toMatch(/test1$/u);
    expect(await start()).toMatch(/test2$/u);
    expect(stripe.mock.calls.filter(([path]) => path === "accounts")).toHaveLength(1);
    expect(await service.status("other", "owner")).toBe("unconnected");
    expect(await service.status("fixture", "owner")).toBe("setup_required");
    await expect(service.status("fixture", "new-owner")).rejects.toThrow("Stripe seller owner changed.");
    current = "pending";
    expect(await service.status("fixture", "owner")).toBe("in_review");
    expect(await start()).toBeNull();
    current = "active";
    expect(await service.status("fixture", "owner")).toBe("ready");
    expect(await start()).toBeNull();
    owner = false;
    await expect(start()).rejects.toThrow("Community owner required.");
    expect(linkCount).toBe(2);
  } finally { db.close(); }
});

it("qualifies an existing Standard seller through a sandbox-only account read", async () => {
  let live = false;
  let feePayer = "account";
  const transport = vi.fn<typeof fetch>(async url => {
    if (String(url).includes("/v2/")) return new Response(null, { status: 404 });
    expect(String(url)).toBe("https://api.stripe.com/v1/accounts/acct_standard");
    return Response.json({ object: "account", id: "acct_standard", livemode: live,
      charges_enabled: true, payouts_enabled: true, capabilities: { card_payments: "active" },
      controller: { fees: { payer: feePayer }, losses: { payments: "stripe" }, requirement_collection: "stripe",
        stripe_dashboard: { type: "full" } } });
  });
  const stripe = createPartnerAlertStripeAccountClient("sk_test_fixture", transport);
  expect(partnerStripeSellerStatus(await stripe("accounts/acct_standard"), "acct_standard")).toBe("ready");
  feePayer = "application";
  await expect(stripe("accounts/acct_standard")).rejects.toThrow("Unverified Stripe Standard seller.");
  feePayer = "account";
  live = true;
  await expect(stripe("accounts/acct_standard")).rejects.toThrow("Unverified Stripe Standard seller.");
  expect(() => createPartnerAlertStripeAccountClient("sk_live_fixture", transport)).toThrow("sandbox key");
});
