import { describe, expect, it, vi } from "vitest";
import type Database from "better-sqlite3";

import type { PartnerAlertOffer } from "../contracts/partner-alert-contracts";
import { createPartnerAlertWhopUserReference, encryptPartnerAlertCredentials } from "./partner-alert-credentials";
import { PARTNER_ALERT_WHOP_API_VERSION, PartnerAlertWhopReadClient } from "./partner-alert-whop-client";
import { createPartnerAlertWhopOfferVerifier } from "./partner-alert-whop-provider-verification";
import { PartnerAlertWhopReconciliation } from "./partner-alert-whop-reconciliation";

const at = "2026-11-02T12:00:00.000Z";
const offer: PartnerAlertOffer = Object.freeze({
  offerId: "30000000-0000-4000-8000-000000000003",
  communityId: "20000000-0000-4000-8000-000000000002", version: 1, kind: "channel", title: "Morning alerts",
  mappingIds: Object.freeze(["40000000-0000-4000-8000-000000000004"]),
  currency: Object.freeze({ code: "USD", minorUnitDigits: 2 }), amountMinor: 2500,
  cadence: Object.freeze({ unit: "day", count: 30 }), whop: Object.freeze({ environment: "live",
    accountId: "biz_partner", productId: "prod_alerts", planId: "plan_monthly" }),
});

const native = Object.freeze({ id: "plan_monthly", account: Object.freeze({ id: "biz_partner" }),
  product: Object.freeze({ id: "prod_alerts" }), currency: "usd", billing_type: "renewal", billing_period: 30,
  initial_price: 0, renewal_price: 25, adaptive_pricing_enabled: false, allow_multiple_quantity: false,
  release_method: "buy_now", visibility: "visible", split_pay_required_payments: null, trial_period_days: null,
  initial_price_due: Object.freeze({ amount: "25.00", currency: "usd", decimals: 2 }) });

function fixture() {
  const key = Buffer.alloc(32, 7).toString("base64");
  const credentialKeys = Object.freeze({ activeKeyVersion: "test", keysBase64: Object.freeze({ test: key }) });
  const encrypted = encryptPartnerAlertCredentials({ context: { communityId: offer.communityId,
    environment: "live", accountId: "biz_partner", purpose: "community_verification" },
  configuration: credentialKeys, credentials: { accessToken: "secret-token", refreshToken: null,
    expiresAtUtc: "2026-11-02T12:05:00.000Z" } });
  const get = vi.fn((communityId: string, environment: string, accountId: string) => ({
    community_id: communityId, owner_user_id: "10000000-0000-4000-8000-000000000001",
    environment, whop_account_id: accountId, owner_user_ref: "a".repeat(64),
    encrypted_authorisation_json: JSON.stringify(encrypted), status: "verified", verified_at_utc: at,
    valid_until_utc: "2026-11-02T12:05:00.000Z",
  }));
  const prepare = vi.fn(() => ({ get }));
  const database = { open: true, readonly: false, prepare } as unknown as Database.Database;
  const transport = vi.fn<(url: string, init: RequestInit) => Promise<Response>>(async () => new Response(JSON.stringify(native), {
    status: 200, headers: { "content-type": "application/json" },
  }));
  return { credentialKeys, database, get, prepare, transport };
}

describe("Partner Channel Whop approval verification", () => {
  it("uses one exact verified connection and one pinned GET-only native plan read", async () => {
    const f = fixture();
    const verify = createPartnerAlertWhopOfferVerifier({ database: f.database,
      credentialKeys: f.credentialKeys, transport: f.transport, nowUtc: () => at,
      maximumEvidenceAgeMs: 60_000 });
    await expect(verify({ communityId: offer.communityId, offer },
      new AbortController().signal)).resolves.toMatchObject({
      communityId: offer.communityId, communityOwnerUserId: "10000000-0000-4000-8000-000000000001",
      binding: offer.whop, offer, membershipVerificationAuthorised: true,
    });
    expect(f.get).toHaveBeenCalledWith(offer.communityId, "live", "biz_partner");
    expect(f.transport).toHaveBeenCalledOnce();
    const [url, options] = f.transport.mock.calls[0] ?? [];
    expect(url).toBe("https://api.whop.com/api/v1/variants/plan_monthly?account_id=biz_partner");
    expect(options?.method).toBe("GET");
    expect(options?.redirect).toBe("manual");
    expect(new Headers(options?.headers).get("authorization")).toBe("Bearer secret-token");
  });

  it("rejects a cross-community target before database, credential or provider work", async () => {
    const f = fixture();
    const verify = createPartnerAlertWhopOfferVerifier({ database: f.database,
      credentialKeys: f.credentialKeys, transport: f.transport, nowUtc: () => at,
      maximumEvidenceAgeMs: 60_000 });
    await expect(verify({ communityId: "90000000-0000-4000-8000-000000000009", offer },
      new AbortController().signal)).rejects.toThrow(/unavailable/);
    expect(f.prepare).not.toHaveBeenCalled();
    expect(f.transport).not.toHaveBeenCalled();
  });

  it("does no work for an already-cancelled request", async () => {
    const f = fixture(); const controller = new AbortController(); controller.abort();
    const verify = createPartnerAlertWhopOfferVerifier({ database: f.database,
      credentialKeys: f.credentialKeys, transport: f.transport, nowUtc: () => at,
      maximumEvidenceAgeMs: 60_000 });
    await expect(verify({ communityId: offer.communityId, offer }, controller.signal)).rejects.toThrow(/cancelled/);
    expect(f.prepare).not.toHaveBeenCalled();
    expect(f.transport).not.toHaveBeenCalled();
  });
});

it.each([
  [{ has_access: false, access_level: "no_access" }, "prepared", true, []],
  [{ has_access: true, access_level: "customer" }, "review_required", false, ["provider_access_conflict"]],
  [{ has_access: true, access_level: "admin" }, "review_required", false, ["provider_access_conflict"]],
  [{ has_access: false, access_level: "customer" }, "review_required", false, ["native_shape_unqualified"]],
] as const)("checks current product access when Whop returns no exact memberships (%o)", async (access, status, discoveryComplete, issues) => {
  const ownerUserId = "10000000-0000-4000-8000-000000000001";
  const userId = "10000000-0000-4000-8000-000000000002";
  const identityKeyBase64 = Buffer.alloc(32, 9).toString("base64");
  const identity = (whopUserId: string) => createPartnerAlertWhopUserReference({ environment: "live", whopUserId, identityKeyBase64 });
  const transport = vi.fn(async (url: string, init: RequestInit) => {
    expect(init).toMatchObject({ method: "GET", redirect: "manual" });
    expect(new Headers(init.headers).get("Api-Version-Date")).toBe(PARTNER_ALERT_WHOP_API_VERSION);
    const target = new URL(url);
    expect(target.origin).toBe("https://api.whop.com");
    switch (target.pathname) {
      case "/api/v1/accounts/biz_partner": return Response.json({ id: "biz_partner", owner: { id: "user_owner" }, status: "active" });
      case "/api/v1/variants/plan_monthly": return Response.json(native);
      case "/api/v1/memberships": return Response.json({ data: [], page_info: { has_next_page: false, end_cursor: null } });
      case "/api/v1/users/user_buyer/access/prod_alerts": return Response.json(access);
      default: throw new Error("Unexpected Whop read");
    }
  });
  const client = new PartnerAlertWhopReadClient({ environment: "live", accountId: "biz_partner", bearerToken: "fixture-token",
    apiVersionDate: PARTNER_ALERT_WHOP_API_VERSION }, transport);
  const prepare = new PartnerAlertWhopReconciliation(client, { enabled: true, nowUtc: () => at, limits: {
    membershipPages: 1, membershipCount: 10, paymentPagesPerMembership: 1, paymentsPerMembership: 10, totalReads: 8, maximumElapsedMs: 60_000,
  } });
  const resolved = await prepare.prepare({ userId, whopUserId: "user_buyer", verifiedWhopUserRef: identity("user_buyer"),
    knownMembershipIds: [], offer, identityKeyBase64,
    accountProof: { communityId: offer.communityId, ownerUserId, accountId: offer.whop.accountId, environment: "live",
      ownerWhopUserRef: identity("user_owner"), observedAtUtc: at, validUntilUtc: "2026-11-02T12:05:00.000Z" },
    claimedGenerations: { identity: 1, connection: 1, erasure: 1 }, policy: { maximumEvidenceAgeMs: 60_000,
      allowConfiguredTrial: false, membershipReadAuthorised: true, eventsAuthorised: true, disputeReadAuthorised: true,
      refundPolicy: "any_refund_revokes", disputePolicy: "withhold_observed_dispute" },
  });
  expect(resolved).toMatchObject({ canApply: false, status, discoveryComplete, issues, members: [] });
  expect(transport.mock.calls.map(([url]) => new URL(url).pathname)).toEqual([
    "/api/v1/accounts/biz_partner", "/api/v1/variants/plan_monthly", "/api/v1/memberships", "/api/v1/users/user_buyer/access/prod_alerts",
  ]);
});
