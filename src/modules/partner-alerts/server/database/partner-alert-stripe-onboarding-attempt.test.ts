// @vitest-environment node
import Database from "better-sqlite3";
import { expect, it } from "vitest";
import { platformPaidStripeConnectBillingMigration } from "../../../platform/server/database/migrations/0209_platform_paid_stripe_connect_billing";
import { PARTNER_ALERT_STRIPE_ONBOARDING_ATTEMPT_STATEMENTS } from "./partner-alert-stripe-onboarding-attempt-schema";
import { beginPartnerStripeSetup, claimPartnerStripeOAuth, findPartnerStripeOAuthScope, requirePartnerStripeSetupAttempt } from "./partner-alert-stripe-onboarding-attempt";
import { recordPartnerAlertStripeSeller } from "./partner-alert-stripe-seller-writer";

const scope = { communityId: "community", ownerUserId: "owner", environment: "sandbox" } as const;

function fixture() {
  const db = new Database(":memory:");
  db.pragma("foreign_keys=ON");
  db.exec(`CREATE TABLE platform_users(user_id TEXT PRIMARY KEY);
    CREATE TABLE traderlink_communities(community_id TEXT PRIMARY KEY,owner_user_id TEXT,slug TEXT,status TEXT);
    INSERT INTO platform_users VALUES('owner'),('buyer');
    INSERT INTO traderlink_communities VALUES('community','owner','community-slug','active');`);
  const sellerSchema = platformPaidStripeConnectBillingMigration.statements
    .filter(sql => /^CREATE (?:TABLE|UNIQUE INDEX|TRIGGER) partner_alert_stripe_(?:sellers\b|current_seller\b|seller_)/u.test(sql));
  db.exec(sellerSchema.join(";\n"));
  db.exec(PARTNER_ALERT_STRIPE_ONBOARDING_ATTEMPT_STATEMENTS.join(";\n"));
  return db;
}

it("reserves a single hosted seller and binds only the original creation attempt", () => {
  const db = fixture();
  try {
    const begin = db.transaction((method: "hosted" | "oauth", country: string, time: number) =>
      beginPartnerStripeSetup(db, scope, method, country, time)).immediate;
    const created = begin("hosted", "US", 1_000);
    const retry = begin("hosted", "", 6_000);
    expect(retry).toEqual(created);
    expect(retry.attempt.country).toBe("US");
    expect(() => begin("oauth", "", 6_000)).toThrow("requires review");
    expect(() => begin("hosted", "CA", 1_000 + 30 * 86_400_000)).toThrow("requires review");
    db.transaction(() => {
      expect(() => requirePartnerStripeSetupAttempt(db, scope, { ...created.attempt, country: "CA" })).toThrow("changed");
      requirePartnerStripeSetupAttempt(db, scope, created.attempt);
      expect(recordPartnerAlertStripeSeller(db, { ...scope, accountId: "acct_verified", state: "onboarding", atMs: 7_000 }))
        .toBe(created.attempt.seller_id);
    }).immediate();
    expect(db.prepare("SELECT count(*) FROM partner_alert_stripe_onboarding_attempts").pluck().get()).toBe(0);
    expect(() => begin("hosted", "US", 8_000)).toThrow("already connected");
  } finally { db.close(); }
});

it("scopes callbacks to the owner and environment and prevents duplicate code exchanges", () => {
  const db = fixture();
  try {
    const begin = db.transaction((at: number) => beginPartnerStripeSetup(db, scope, "oauth", "", at)).immediate;
    const { attempt, oauthState } = begin(1_000);
    expect(attempt.oauth_state_sha256).not.toBe(oauthState);
    expect(findPartnerStripeOAuthScope(db, oauthState!, "buyer", "sandbox", 2_000)).toBeUndefined();
    expect(findPartnerStripeOAuthScope(db, oauthState!, "owner", "live", 2_000)).toBeUndefined();
    expect(findPartnerStripeOAuthScope(db, oauthState!, "owner", "sandbox", 601_000)).toBeUndefined();
    const selected = findPartnerStripeOAuthScope(db, oauthState!, "owner", "sandbox", 2_000);
    expect(selected).toMatchObject({ community_id: "community", slug: "community-slug", seller_id: attempt.seller_id });
    const claim = db.transaction(() => claimPartnerStripeOAuth(db, oauthState!, attempt.seller_id, 2_000)).immediate;
    expect(claim()?.consumed_at_ms).toBe(2_000);
    expect(claim()).toBeUndefined();
    expect(() => begin(3_000)).toThrow("in progress");
    const renewed = begin(62_000);
    expect(renewed.attempt.seller_id).toBe(attempt.seller_id);
    expect(findPartnerStripeOAuthScope(db, oauthState!, "owner", "sandbox", 62_001)).toBeUndefined();
    db.prepare("UPDATE partner_alert_stripe_sellers SET owner_user_id=NULL,state='disconnected',owner_erased_at_ms=63_000").run();
    expect(findPartnerStripeOAuthScope(db, renewed.oauthState!, "owner", "sandbox", 63_001)).toBeUndefined();
    expect(db.prepare("SELECT count(*) FROM partner_alert_stripe_onboarding_attempts").pluck().get()).toBe(0);
  } finally { db.close(); }
});
