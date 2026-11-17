import { describe, expect, it, vi } from "vitest";
import type Database from "better-sqlite3";

import type { PartnerAlertCatalogCandidate } from "./partner-alert-catalog-read";
import { createPartnerAlertCatalogCheckoutQualifier,
  createPartnerAlertCatalogCheckoutRuntime } from "./partner-alert-catalog-checkout";
import { encryptPartnerAlertCredentials } from "./partner-alert-credentials";

const at = "2026-11-02T12:00:00.000Z";
const candidate: PartnerAlertCatalogCandidate = Object.freeze({
  offer: Object.freeze({ offerId: "30000000-0000-4000-8000-000000000003",
    communityId: "20000000-0000-4000-8000-000000000002", version: 1, kind: "channel", title: "Morning alerts",
    mappingIds: Object.freeze(["40000000-0000-4000-8000-000000000004"]),
    currency: Object.freeze({ code: "USD", minorUnitDigits: 2 }), amountMinor: 2500,
    cadence: Object.freeze({ unit: "day", count: 30 }), whop: Object.freeze({ environment: "live",
      accountId: "biz_partner", productId: "prod_alerts", planId: "plan_monthly" }) }),
  item: Object.freeze({ communityId: "20000000-0000-4000-8000-000000000002", offerKey: "offer:1",
    communityName: "Market Desk", channels: Object.freeze(["Morning alerts"]), price: "$25.00",
    cadence: "30 days", access: "available" }),
});
const native = Object.freeze({ id: "plan_monthly", account: Object.freeze({ id: "biz_partner" }),
  product: Object.freeze({ id: "prod_alerts" }), currency: "usd", billing_type: "renewal", billing_period: 30,
  initial_price: 0, renewal_price: 25, adaptive_pricing_enabled: false, allow_multiple_quantity: false,
  release_method: "buy_now", visibility: "visible", split_pay_required_payments: null, trial_period_days: null,
  initial_price_due: Object.freeze({ amount: "25.00", currency: "usd", decimals: 2 }),
  purchase_url: "https://whop.com/market-desk/checkout/plan_monthly" });
const context = (retrieveVariant: (id: string, signal?: AbortSignal) => Promise<Record<string, unknown>>) => ({
  client: { retrieveVariant }, allowConfiguredTrial: false, maximumEvidenceAgeMs: 60_000,
  accountProof: { communityId: candidate.offer.communityId,
    ownerUserId: "10000000-0000-4000-8000-000000000001", accountId: candidate.offer.whop.accountId,
    environment: "live" as const, ownerWhopUserRef: "a".repeat(64), observedAtUtc: at,
    validUntilUtc: "2026-11-02T12:05:00.000Z" },
});

describe("Partner Channel authenticated catalog checkout binding", () => {
  it("resolves context before one exact GET-only plan read and normalizes its purchase URL", async () => {
    const calls: string[] = [];
    const retrieveVariant = async (id: string, signal?: AbortSignal) => { calls.push(`plan:${id}`);
      expect(signal?.aborted).toBe(false); return native; };
    const qualifier = createPartnerAlertCatalogCheckoutQualifier({
      resolve: async (actual) => { calls.push(`context:${actual.offer.communityId}`); return context(retrieveVariant); },
      nowUtc: () => at,
    });
    const proof = await qualifier(candidate, new AbortController().signal);
    expect(calls).toEqual([`context:${candidate.offer.communityId}`, "plan:plan_monthly"]);
    expect(proof.checkoutHref).toBe(native.purchase_url);
  });

  it("decrypts one exact verified connection and performs one pinned GET-only plan read", async () => {
    const key = Buffer.alloc(32, 7).toString("base64");
    const credentialKeys = Object.freeze({ activeKeyVersion: "test", keysBase64: Object.freeze({ test: key }) });
    const encrypted = encryptPartnerAlertCredentials({ context: { communityId: candidate.offer.communityId,
      environment: "live", accountId: "biz_partner", purpose: "community_verification" },
    configuration: credentialKeys, credentials: { accessToken: "secret-token", refreshToken: null,
      expiresAtUtc: "2026-11-02T12:05:00.000Z" } });
    const database = { open: true, readonly: true, prepare(sql: string) {
      expect(sql).toContain("partner_alert_whop_connections");
      return { get: (communityId: string, environment: string, accountId: string) => {
        expect([communityId, environment, accountId]).toEqual([candidate.offer.communityId, "live", "biz_partner"]);
        return { community_id: communityId, owner_user_id: "10000000-0000-4000-8000-000000000001",
          environment, whop_account_id: accountId, owner_user_ref: "a".repeat(64),
          encrypted_authorisation_json: JSON.stringify(encrypted), status: "verified", verified_at_utc: at,
          valid_until_utc: "2026-11-02T12:05:00.000Z" };
      } };
    } } as unknown as Database.Database;
    let calls = 0;
    const qualifier = createPartnerAlertCatalogCheckoutRuntime({ database, credentialKeys, nowUtc: () => at,
      maximumEvidenceAgeMs: 60_000, transport: async (url, options) => {
        calls += 1; expect(url).toBe("https://api.whop.com/api/v1/variants/plan_monthly?account_id=biz_partner");
        expect(options.method).toBe("GET"); expect(options.redirect).toBe("manual");
        expect(new Headers(options.headers).get("api-version-date")).toBe("2026-10-27-2");
        expect(new Headers(options.headers).get("authorization")).toBe("Bearer secret-token");
        expect(options.signal?.aborted).toBe(false);
        return new Response(JSON.stringify(native), { status: 200, headers: { "content-type": "application/json" } });
      } });
    await expect(qualifier(candidate, new AbortController().signal)).resolves.toMatchObject({
      checkoutHref: native.purchase_url,
    });
    expect(calls).toBe(1);
  });

  it("performs zero credential or provider work for a pre-aborted request", async () => {
    const resolve = vi.fn(); const controller = new AbortController(); controller.abort();
    const qualifier = createPartnerAlertCatalogCheckoutQualifier({ resolve, nowUtc: () => at });
    await expect(qualifier(candidate, controller.signal)).rejects.toThrow(/cancelled/);
    expect(resolve).not.toHaveBeenCalled();
  });

  it("rejects a foreign resolved account even when the returned URL looks valid", async () => {
    const qualifier = createPartnerAlertCatalogCheckoutQualifier({
      resolve: async () => ({ ...context(async () => native), accountProof: {
        ...context(async () => native).accountProof, accountId: "biz_foreign" } }), nowUtc: () => at,
    });
    await expect(qualifier(candidate, new AbortController().signal)).rejects.toThrow(/verification/);
  });
});
