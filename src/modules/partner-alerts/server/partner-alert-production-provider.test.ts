// @vitest-environment node
import Database from "better-sqlite3";
import { createHash } from "node:crypto";
import { afterEach, expect, it, vi } from "vitest";
import type { PartnerAlertOffer } from "../contracts/partner-alert-contracts";
import { encryptPartnerAlertCredentials } from "./partner-alert-credentials";
import { PARTNER_ALERT_WHOP_API_VERSION, type PartnerAlertWhopTransport } from "./partner-alert-whop-client";
import { installPartnerAlertProductionProvider, type PartnerAlertProductionProviderInputs } from "./partner-alert-production-provider";

const { open, start } = vi.hoisted(() => ({ open: vi.fn(), start: vi.fn() }));
vi.mock("../../platform/server/database/open-readonly-platform-database", () => ({ openReadonlyPlatformDatabase: open }));
vi.mock("./partner-alert-native-runtime", () => ({ startReviewedPartnerAlertNativeProvider: start }));

const databases: Database.Database[] = [];
afterEach(() => {
  for (const db of databases.splice(0)) if (db.open) db.close();
  vi.resetAllMocks();
});

function fixture() {
  const userId = "10000000-0000-4000-8000-000000000001";
  const offer: PartnerAlertOffer = {
    communityId: "20000000-0000-4000-8000-000000000002",
    offerId: "30000000-0000-4000-8000-000000000003",
    version: 1, kind: "channel", title: "Synthetic alerts",
    mappingIds: ["40000000-0000-4000-8000-000000000004"],
    currency: { code: "USD", minorUnitDigits: 2 }, amountMinor: 2500,
    cadence: { unit: "day", count: 30 },
    whop: { accountId: "biz_fixture", environment: "live", planId: "plan_fixture", productId: "prod_fixture" },
  };
  const at = "2026-11-02T12:00:00.000Z", until = "2026-11-02T12:05:00.000Z";
  let clock = at;
  const scope = { communityId: offer.communityId, environment: "live" as const, accountId: offer.whop.accountId,
    apiVersionDate: PARTNER_ALERT_WHOP_API_VERSION };
  const hash = (value: string) => createHash("sha256").update(value).digest("hex");
  const key = Buffer.alloc(32, 29).toString("base64");
  const signer = "ws_synthetic_test_only_credential";
  const transport = vi.fn<PartnerAlertWhopTransport>(async () => Response.json({
    id: offer.whop.planId, account: { id: scope.accountId }, product: { id: offer.whop.productId },
    currency: "usd", billing_type: "renewal", billing_period: 30, initial_price: 0, renewal_price: 25,
    adaptive_pricing_enabled: false, allow_multiple_quantity: false, release_method: "buy_now", visibility: "visible",
    split_pay_required_payments: null, trial_period_days: null,
    initial_price_due: { amount: "25.00", currency: "usd", decimals: 2 },
  }));
  const db = new Database(":memory:");
  databases.push(db);
  db.exec(`CREATE TABLE partner_alert_partners(community_id,owner_user_id);
    CREATE TABLE partner_alert_offers(community_id,whop_environment,whop_account_id,offer_id,version,review_state,offer_json);
    CREATE TABLE partner_alert_whop_connections(community_id,environment,whop_account_id,encrypted_authorisation_json,
      status,verified_at_utc,valid_until_utc,owner_user_ref);`);
  const encrypted = JSON.stringify(encryptPartnerAlertCredentials({
    context: { communityId: scope.communityId, environment: scope.environment, accountId: scope.accountId, purpose: "community_verification" },
    configuration: { activeKeyVersion: "fixture", keysBase64: { fixture: key } },
    credentials: { accessToken: "synthetic-bearer", refreshToken: null, expiresAtUtc: until },
  }));
  const json = JSON.stringify(offer);
  db.prepare("INSERT INTO partner_alert_partners VALUES (?,?)").run(scope.communityId, userId);
  db.prepare("INSERT INTO partner_alert_whop_connections VALUES (?,?,?,?,'verified',?,?,?)")
    .run(scope.communityId, scope.environment, scope.accountId, encrypted, at, until, "c".repeat(64));
  db.prepare("INSERT INTO partner_alert_offers VALUES (?,?,?,?,?,'approved',?)")
    .run(scope.communityId, scope.environment, scope.accountId, offer.offerId, offer.version, json);
  open.mockReturnValue(db);
  const restore = vi.fn();
  const read = vi.fn(() => ({ generation: 5, sha256: "f".repeat(64), unresolvedPrepared: [] }));
  const provider = { bindSubscriber: vi.fn(), maintenance: { scope, databasePath: "/fixture/prototype.sqlite",
    profileCatalogSha256: "d".repeat(64), assertRestoreStartupVerified: restore,
    erasureRuntime: { nowUtc: () => clock, tombstoneLedger: { read } } } } as unknown as PartnerAlertProductionProviderInputs["provider"];
  const review = { scope, profileCatalogSha256: provider.maintenance.profileCatalogSha256,
    credentialEnvelopeSha256: hash(encrypted), reviewedOffersSha256: hash(JSON.stringify([json])),
    webhookSigningKeySha256: hash(signer), coverageQualificationRef: "reviewed_fixture",
    ledger: { generation: 5, sha256: "f".repeat(64) }, validUntilUtc: until };
  const environment = { NODE_ENV: "production" as const, PARTNER_ALERT_LIFECYCLE_ENABLED: "true",
    PARTNER_ALERT_REQUEST_RUNTIME_ENABLED: "true", PARTNER_ALERT_WHOP_WEBHOOK_ENABLED: "true",
    PARTNER_ALERT_ERASURE_PROFILE_CATALOG_SHA256: review.profileCatalogSha256,
    TRADERLINK_PLATFORM_DB_PATH: provider.maintenance.databasePath,
    PARTNER_ALERT_WHOP_WEBHOOK_KEY_ENCODING: "raw_utf8", PARTNER_ALERT_WHOP_WEBHOOK_SECRET: signer,
    PARTNER_ALERT_WHOP_WEBHOOK_ENVIRONMENT: scope.environment, PARTNER_ALERT_WHOP_WEBHOOK_COMMUNITY_ID: scope.communityId,
    PARTNER_ALERT_WHOP_WEBHOOK_ACCOUNT_ID: scope.accountId, PARTNER_ALERT_WHOP_CREDENTIAL_ACTIVE_KEY_VERSION: "fixture",
    PARTNER_ALERT_WHOP_CREDENTIAL_KEYS_JSON: JSON.stringify({ fixture: key }), PARTNER_ALERT_WHOP_EVIDENCE_MAX_AGE_MS: "60000" };
  const input = { provider, transport, readVerifiedReview: () => review, coverageQualificationRef: review.coverageQualificationRef, environment };
  return { input, db, restore, read, transport, until, setClock: (value: string) => { clock = value; } };
}

it("admits a fully reviewed exact merchant after bounded offer verification without enabling checkout", async () => {
  const { input, db, restore, transport } = fixture();
  const stop = vi.fn();
  start.mockReturnValue(stop);
  await expect(installPartnerAlertProductionProvider(input)).resolves.toBe(stop);
  expect(restore).toHaveBeenCalledOnce();
  expect(transport).toHaveBeenCalledExactlyOnceWith(
    expect.stringContaining(`?account_id=${input.provider.maintenance.scope.accountId}`),
    expect.objectContaining({ method: "GET", redirect: "manual", cache: "no-store" }),
  );
  expect(start).toHaveBeenCalledOnce();
  expect(db.open).toBe(false);
});

it.each(["missing review", "signer mismatch", "ledger mismatch", "credential rotated", "review expired during read"] as const)(
  "leaves the provider inactive on %s", async scenario => {
    const { input, db, read, until, setClock } = fixture();
    if (scenario === "missing review") {
      await expect(installPartnerAlertProductionProvider({ ...input, readVerifiedReview: () => null })).resolves.toBeNull();
      expect(open).not.toHaveBeenCalled();
    } else {
      if (scenario === "signer mismatch") input.environment.PARTNER_ALERT_WHOP_WEBHOOK_SECRET = "ws_other_synthetic_secret";
      if (scenario === "ledger mismatch") read.mockReturnValue({ generation: 6, sha256: "f".repeat(64), unresolvedPrepared: [] });
      if (scenario === "credential rotated") db.exec("UPDATE partner_alert_whop_connections SET encrypted_authorisation_json='{}'");
      if (scenario === "review expired during read") {
        const respond = input.transport.getMockImplementation()!;
        input.transport.mockImplementation(async (...args) => {
          setClock(until);
          return respond(...args);
        });
      }
      await expect(installPartnerAlertProductionProvider(input)).rejects.toThrow();
      expect(input.transport).toHaveBeenCalledTimes(scenario === "review expired during read" ? 1 : 0);
    }
    expect(start).not.toHaveBeenCalled();
  },
);
