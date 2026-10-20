import { beforeEach, describe, expect, it, vi } from "vitest";

const checkout = vi.hoisted(() => ({
  reserved: { claimId: "claim", offer: { billing_kind: "free", provider: "free", external_checkout_url: null }, trialDays: null },
  fulfill: vi.fn(), write: vi.fn(), redirect: vi.fn((url: string) => { throw new Error(`redirect:${url}`); }),
}));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("next/navigation", () => ({ redirect: checkout.redirect }));
vi.mock("../authentication/require-platform-request-scope", () => ({
  requireTraderLinkPlatformBillingRequestIdentity: () => ({ scope: { userId: "buyer" } }),
}));
vi.mock("../database/open-platform-database", () => ({
  withPlatformDatabase: (_options: unknown, read: (db: object) => unknown) => read({
    prepare: () => ({ run: checkout.write }),
  }),
}));
vi.mock("./platform-membership-claims", () => ({
  PlatformMembershipClaims: class {
    reserve() { return checkout.reserved; }
    fulfillFree = checkout.fulfill;
    release() {}
  },
}));
vi.mock("./platform-membership-stripe", () => ({
  createMembershipStripeCheckout: async () => ({ id: "cs_test", url: "https://checkout.stripe.com/c/test_fixture" }),
  createMembershipStripePortal: vi.fn(),
}));

import { selectEmbeddedMembershipAction, selectMembershipAction } from "@/app/plans/checkout-actions";

describe("Embedded plans checkout navigation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    checkout.reserved.offer.billing_kind = "free";
    checkout.reserved.offer.provider = "free";
  });
  const state = { error: null, success: null };
  it("preserves normal free enrollment and full-page redirect", async () => {
    await expect(selectMembershipAction(state, new FormData())).rejects.toThrow("redirect:/account/membership");
    expect(checkout.fulfill).toHaveBeenCalledWith("claim", "buyer");
  });
  it("returns the same free-enrollment destination for parent navigation", async () => {
    expect(await selectEmbeddedMembershipAction(state, new FormData())).toEqual({ ...state, redirectTo: "/account/membership" });
    expect(checkout.fulfill).toHaveBeenCalledWith("claim", "buyer");
    expect(checkout.redirect).not.toHaveBeenCalled();
  });
  it("returns the provider checkout destination without navigating inside the frame", async () => {
    checkout.reserved.offer.billing_kind = "recurring";
    checkout.reserved.offer.provider = "stripe";
    expect(await selectEmbeddedMembershipAction(state, new FormData())).toEqual({ ...state, redirectTo: "https://checkout.stripe.com/c/test_fixture" });
    expect(checkout.write).toHaveBeenCalledWith("cs_test", "claim");
    expect(checkout.fulfill).not.toHaveBeenCalled();
  });
});
