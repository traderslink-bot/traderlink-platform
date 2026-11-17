// @vitest-environment node
import Database from "better-sqlite3";
import { NextRequest } from "next/server";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { TraderLinkPlatformRequestIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";

const state = vi.hoisted(() => ({
  identity: null as TraderLinkPlatformRequestIdentity | null,
  database: null as unknown,
  sandbox: null as unknown,
  billingEnvironment: "sandbox" as "live" | "sandbox",
  identityReads: vi.fn(),
  runtime: vi.fn(),
  sandboxLookup: vi.fn(),
}));
vi.mock("@/src/modules/platform/server/authentication/require-platform-request-scope", () => {
  const identity = () => {
    state.identityReads();
    if (!state.identity) throw new Error("Unauthenticated");
    return state.identity;
  };
  return { requireTraderLinkPlatformBillingRequestIdentity: identity,
    requireTraderLinkPlatformPageIdentity: identity,
    requireTraderLinkPlatformAuthenticatedPageIdentity: identity,
    requireTraderLinkPlatformServerComponentPageIdentity: identity,
    requireTraderLinkPlatformRequestScope: () => identity().scope };
});
vi.mock("@/src/modules/platform/server/database/open-readonly-platform-database", () => ({
  withReadonlyPlatformDatabase: (_options: unknown, operation: (db: unknown) => unknown) => operation(state.database),
}));
vi.mock("./partner-alert-request-runtime", () => ({ withPartnerAlertRequestRuntime: state.runtime }));
vi.mock("./partner-alert-stripe-sandbox-runtime", () => ({ partnerAlertStripeSandbox: state.sandboxLookup }));
vi.mock("./partner-alert-stripe-billing-runtime", () => ({
  readPartnerAlertStripeBillingConfiguration: () => ({ origin: "https://app.example.test", environment: state.billingEnvironment, clientId: "ca_test" }),
}));
vi.mock("./partner-alert-stripe-onboarding-runtime", () => ({
  stripeOnboardingConfiguration: () => null, withStripeOnboarding: vi.fn(),
}));
vi.mock("@/src/modules/platform/server/authentication/platform-mutation-request-security", () => ({
  requirePlatformMutationRequest: vi.fn(),
}));

import * as community from "@/app/api/partner-channels/communities/[communityId]/route";
import * as source from "@/app/api/partner-channels/communities/[communityId]/source-channels/route";
import * as onboarding from "@/app/api/partner-channels/communities/[communityId]/stripe-onboarding/route";
import * as checkout from "@/app/api/partner-channels/communities/[communityId]/offers/[offerKey]/checkout/route";
import * as access from "@/app/api/partner-channels/communities/[communityId]/offers/[offerKey]/access/route";
import * as admin from "@/app/api/admin/journal/partner-channels/route";
import * as detail from "@/app/api/admin/journal/partner-channels/[communityId]/route";
import * as role from "@/app/api/admin/journal/partner-channels/role-review/route";
import * as adjustment from "@/app/api/admin/journal/partner-channels/[communityId]/stripe-role-review/route";
import * as callback from "@/app/api/partner-channels/stripe/connect/callback/route";
import * as sandboxCallback from "@/app/api/partner-channels/stripe-sandbox/connect/callback/route";

vi.mock("@/app/(dashboard)/partner-channels/partner-channel-catalog", () => ({ PartnerChannelCatalog: () => null }));
vi.mock("@/app/(dashboard)/communities/[communitySlug]/partner-channels/community-partner-channel-setup", () => ({ CommunityPartnerChannelSetup: () => null }));
vi.mock("@/app/admin/journal/partner-channels/partner-channel-review", () => ({ PartnerChannelReview: () => null }));
vi.mock("@/app/admin/journal/partner-channels/[communityId]/partner-channel-review-detail", () => ({ PartnerChannelReviewDetail: () => null }));
import catalogPage from "@/app/(dashboard)/partner-channels/page";
import publisherPage from "@/app/(dashboard)/communities/[communitySlug]/partner-channels/page";
import reviewPage from "@/app/admin/journal/partner-channels/page";
import reviewDetailPage from "@/app/admin/journal/partner-channels/[communityId]/page";
import * as stripeHook from "@/app/api/partner-channels/stripe/webhook/route";
import * as whopHook from "@/app/api/webhooks/partner-whop/route";

import { partnerAlertOwnerReviewRequestDenied } from "./partner-alert-owner-review-request";

const database = new Database(":memory:");
database.exec(`CREATE TABLE platform_auth_identities (user_id TEXT, auth_provider TEXT, auth_subject TEXT, status TEXT);
  CREATE TABLE traderlink_communities (community_id TEXT, slug TEXT, owner_user_id TEXT, status TEXT);
  INSERT INTO platform_auth_identities VALUES ('first','discord','100000000000000001','active'),
    ('second','discord','100000000000000002','active'),('outsider','discord','100000000000000003','active'),
    ('revoked','discord','100000000000000001','removed');
  INSERT INTO traderlink_communities VALUES ('community','seller','first','active'), ('other','other-seller','second','active');`);
const envName = "TRADERLINK_WATCHLIST_DASHBOARD_NAV_DISCORD_SUBJECT";
const originalSelector = process.env[envName];
function identity(userId: string, mode: "platform_session" | "local_development" = "platform_session") {
  state.identity = { mode, sessionId: mode === "platform_session" ? "session" : null,
    scope: { userId }, displayName: null, discord: null } as TraderLinkPlatformRequestIdentity;
}
function request(method = "POST") {
  return new NextRequest("https://app.example.test/api/partner-channels/test?state=example", {
    method, headers: { origin: "https://app.example.test" },
    ...(method === "POST" ? { body: "country=CA" } : {}),
  });
}
const context = () => ({ params: Promise.resolve({ communityId: "community", offerKey: "offer" }) });
const cases = [
  ["community.GET", community.GET],
  ["community.POST", community.POST],
  ["source.GET", source.GET],
  ["source.POST", source.POST],
  ["onboarding.POST", onboarding.POST],
  ["checkout.POST", checkout.POST],
  ["access.POST", access.POST],
  ["admin.GET", admin.GET],
  ["detail.GET", detail.GET],
  ["detail.POST", detail.POST],
  ["role.GET", role.GET],
  ["role.POST", role.POST],
  ["adjustment.POST", adjustment.POST],
  ["callback.GET", callback.GET],
  ["sandboxCallback.GET", sandboxCallback.GET]
] as const;

beforeEach(() => {
  state.database = database;
  state.identity = null;
  process.env[envName] = "100000000000000001,100000000000000002";
  state.sandbox = null;
  state.billingEnvironment = "sandbox";
  state.identityReads.mockClear();
  state.sandboxLookup.mockReset().mockImplementation(() => state.sandbox);
  state.runtime.mockReset().mockImplementation(async (_request, operation) => operation({
    http: { handlePrivateRead: () => Response.json({ ok: true }), handleMutation: () => Response.json({ ok: true }) },
    readSourceChannels: () => Response.json({ ok: true }), checkSubscriberAccess: () => Response.json({ ok: true }),
    startStripeCheckout: () => Response.json({ ok: true }), reviewSubscriberRole: () => Response.json({ ok: true }),
    reviewStripeAdjustment: () => Response.json({ ok: true }),
    startStripeSellerSetup: () => ({ kind: "link", url: "https://connect.stripe.com/test" }),
    completeStripeSellerSetup: () => "https://app.example.test/communities/seller/partner-channels",
  }));
});
afterAll(() => {
  database.close();
  if (originalSelector === undefined) delete process.env[envName]; else process.env[envName] = originalSelector;
});

describe("Paid human review access", () => {
  it.each(["first", "second"])("accepts the active configured account %s", userId => {
    identity(userId);
    expect(partnerAlertOwnerReviewRequestDenied(request())).toBeNull();
  });
  it.each(["outsider", "revoked"])("rejects %s even with an authenticated session", async userId => {
    identity(userId);
    const denied = partnerAlertOwnerReviewRequestDenied(request());
    expect(denied?.status).toBe(403);
    expect(denied?.headers.get("cache-control")).toContain("private, no-store");
    expect(JSON.stringify(await denied?.json())).not.toContain(userId);
  });
  it.each([undefined, "", "not-a-subject"])("fails closed for unconfigured selector %#", value => {
    identity("first");
    if (value === undefined) delete process.env[envName]; else process.env[envName] = value;
    expect(partnerAlertOwnerReviewRequestDenied(request())?.status).toBe(403);
  });
  it("preserves isolated development identity support", () => {
    identity("local", "local_development");
    delete process.env[envName];
    expect(partnerAlertOwnerReviewRequestDenied(request())).toBeNull();
  });
  it.each(cases)("rejects outsider at %s before billing or feature runtime", async (name, handler) => {
    identity("outsider");
    state.sandbox = { service: { checkout: vi.fn(() => Response.json({ ok: true })) } };
    const response = await handler(request(name.endsWith(".GET") ? "GET" : "POST"), context());
    expect(response.status).toBe(403);
    expect(state.runtime).not.toHaveBeenCalled();
    expect(state.sandboxLookup).not.toHaveBeenCalled();
  });
  it.each(cases)("lets the configured account reach the existing handler at %s", async (name, handler) => {
    identity("first");
    if (name === "callback.GET") state.billingEnvironment = "live";
    const response = await handler(request(name.endsWith(".GET") ? "GET" : "POST"), context());
    expect([200, 303]).toContain(response.status);
    expect(state.runtime).toHaveBeenCalledOnce();
  });
  it("does not let legacy sandbox checkout skip the account gate", async () => {
    const sandboxCheckout = vi.fn(() => Response.json({ ok: true }));
    state.sandbox = { service: { checkout: sandboxCheckout } };
    identity("outsider");
    expect((await checkout.POST(request(), context())).status).toBe(403);
    expect(sandboxCheckout).not.toHaveBeenCalled();
    identity("second");
    expect((await checkout.POST(request(), context())).status).toBe(200);
    expect(sandboxCheckout).toHaveBeenCalledOnce();
  });
  it.each([
    ["catalog", () => catalogPage()],
    ["publisher", () => publisherPage({ params: Promise.resolve({ communitySlug: "seller" }), searchParams: Promise.resolve({}) })],
    ["review", () => reviewPage()],
    ["review detail", () => reviewDetailPage({ params: Promise.resolve({ communityId: "community" }) })],
  ] as const)("blocks direct outsider render of %s", async (_name, render) => {
    identity("outsider");
    await expect(render()).rejects.toThrow("TRADERLINK_WORKSPACE_ACCESS_DENIED");
    expect(state.runtime).not.toHaveBeenCalled();
    expect(state.sandboxLookup).not.toHaveBeenCalled();
  });
  it("keeps Stripe provider requests on their signature-authenticated path", async () => {
    identity("outsider");
    const verifySignature = vi.fn(() => new Response(null, { status: 400 }));
    state.runtime.mockImplementation(async (_request, operation) => operation({ receiveStripeBillingEvent: verifySignature }));
    const result = await stripeHook.POST(request());
    expect(result.status).toBe(400);
    expect(verifySignature).toHaveBeenCalledOnce();
    expect(state.identityReads).not.toHaveBeenCalled();
  });
  it("keeps unconfigured Whop provider requests unavailable without a human session", async () => {
    const original = process.env.PARTNER_ALERT_WHOP_WEBHOOK_ENABLED;
    delete process.env.PARTNER_ALERT_WHOP_WEBHOOK_ENABLED;
    try {
      expect((await whopHook.POST(request())).status).toBe(503);
      expect(state.identityReads).not.toHaveBeenCalled();
      expect(state.runtime).not.toHaveBeenCalled();
    } finally {
      if (original === undefined) delete process.env.PARTNER_ALERT_WHOP_WEBHOOK_ENABLED;
      else process.env.PARTNER_ALERT_WHOP_WEBHOOK_ENABLED = original;
    }
  });

});
