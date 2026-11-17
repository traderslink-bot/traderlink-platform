// @vitest-environment node
import Database from "better-sqlite3";
import { expect, it, vi } from "vitest";
import { platformPaidStripeConnectBillingMigration } from "../../../platform/server/database/migrations/0209_platform_paid_stripe_connect_billing";
import { platformPaidStripeReauthorizationMigration } from "../../../platform/server/database/migrations/0211_platform_paid_stripe_reauthorization";
import { createPartnerAlertNativeStripeCheckout } from "../partner-alert-stripe-native-checkout";
import { recordPartnerAlertStripePaidInvoice, readPartnerAlertStripeClaim } from "./partner-alert-stripe-invoice-writer";
import { closePartnerAlertStripeCheckoutAttempt } from "./partner-alert-stripe-checkout-attempt";
import { beginPartnerStripeSetup, claimPartnerStripeOAuth, findPartnerStripeOAuthScope,
  requirePartnerStripeSetupAttempt } from "./partner-alert-stripe-onboarding-attempt";
import { recordPartnerAlertStripeSeller, recordPartnerAlertStripeSellerDisconnect } from "./partner-alert-stripe-seller-writer";

const communityId = "82d86972-3235-43f9-bf35-85cda5a17a34";
const offerId = "053132f5-471e-4e68-96ca-654011b3338a";
const mappingId = "6480c995-6b2c-43a3-88e0-cffdb864ac56";
const sellerScope = { communityId, ownerUserId: "publisher", environment: "sandbox" as const };
const accountId = "acct_merchant";
const origin = "http://127.0.0.1:3039";
const price = "price_channel";
const at = 1_790_000_000_000;
const fixture = () => {
  const db = new Database(":memory:");
  db.pragma("foreign_keys=ON");
  db.exec(`CREATE TABLE platform_users(user_id TEXT PRIMARY KEY);
    INSERT INTO platform_users VALUES ('publisher'),('buyer'),('visitor');
    CREATE TABLE traderlink_communities(community_id TEXT PRIMARY KEY,owner_user_id TEXT NOT NULL,status TEXT NOT NULL,slug TEXT NOT NULL);
    CREATE TABLE partner_alert_partners(community_id TEXT PRIMARY KEY,owner_user_id TEXT,status TEXT,revision INTEGER,updated_at_utc TEXT);
    CREATE TABLE partner_alert_offers(community_id TEXT,offer_id TEXT,version INTEGER,review_state TEXT,offer_json TEXT,
      whop_environment TEXT,whop_account_id TEXT,whop_product_id TEXT,whop_plan_id TEXT,
      PRIMARY KEY(community_id,offer_id,version));
    CREATE TABLE partner_alert_offer_channels(community_id TEXT,offer_id TEXT,offer_version INTEGER,mapping_id TEXT);
    CREATE TABLE partner_alert_mappings(community_id TEXT,mapping_id TEXT,review_state TEXT,
      approved_revision INTEGER,revision INTEGER,delivery_state TEXT,PRIMARY KEY(community_id,mapping_id));`);
  db.prepare("INSERT INTO traderlink_communities VALUES(?,'publisher','active','merchant')").run(communityId);
  db.prepare("INSERT INTO partner_alert_partners VALUES(?,'publisher','active',1,?)").run(communityId, new Date(at).toISOString());
  const run = <T>(operation: () => T) => db.transaction(operation).immediate();
  run(() => platformPaidStripeConnectBillingMigration.statements.forEach(statement => db.exec(statement)));
  const sellerId = run(() => recordPartnerAlertStripeSeller(db, { ...sellerScope, accountId, state: "ready", atMs: at }));
  const offer = { communityId, offerId, version: 1, mappingIds: [mappingId], kind: "channel", title: "Morning alerts",
    billingProvider: "stripe", currency: { code: "USD", minorUnitDigits: 2 }, amountMinor: 2500,
    cadence: { unit: "calendar_month", count: 1 } };
  db.prepare("INSERT INTO partner_alert_offers VALUES(?,?,1,'approved',?,NULL,NULL,NULL,NULL)")
    .run(communityId, offerId, JSON.stringify(offer));
  db.prepare("INSERT INTO partner_alert_offer_channels VALUES(?,?,1,?)").run(communityId, offerId, mappingId);
  db.prepare("INSERT INTO partner_alert_mappings VALUES(?,?,'approved',1,1,'ready')").run(communityId, mappingId);
  db.prepare("INSERT INTO partner_alert_stripe_prices VALUES(?,?,'sandbox',?,?,1,?,'usd',2500,?,NULL)")
    .run(sellerId, communityId, accountId, offerId, price, at);
  const insert = db.prepare(`INSERT INTO partner_alert_stripe_checkout_claims
    (claim_id,buyer_user_id,seller_id,community_id,environment,stripe_account_id,offer_id,offer_version,stripe_price_id,stripe_session_id,created_at_ms)
    VALUES(?,?,?,?,'sandbox',?,?,1,?,?,?)`);
  for (const buyer of ["buyer", "visitor"]) insert.run("claim_" + buyer, buyer, sellerId, communityId,
    accountId, offerId, price, "cs_test_" + buyer, at);
  const payment = (reference: string, periodMs: number, user: string) => run(() => recordPartnerAlertStripePaidInvoice(
    db, readPartnerAlertStripeClaim(db, "sandbox", accountId, "claim_" + user)!, {
      invoiceId: "in_" + reference, invoicePaymentId: "inpay_" + reference, paymentIntentId: "pi_" + reference,
      sessionId: "cs_test_" + user, subscriptionId: "sub_" + user, customerId: "cus_" + user,
      startsAtMs: periodMs, endsAtMs: periodMs + 86_400_000, stripeAmountMinor: 2500, currency: "usd",
    }, { id: "evt_" + reference, digest: "b".repeat(64), atMs: periodMs }));
  payment("initial", at, "buyer");
  run(() => platformPaidStripeReauthorizationMigration.statements.forEach(statement => db.exec(statement)));
  const disconnect = (id: string, occurredAtMs: number, receivedAtMs: number) => run(() =>
    recordPartnerAlertStripeSellerDisconnect(db, { ...sellerScope, accountId, eventId: id, digest: "a".repeat(64),
      atMs: receivedAtMs, occurredAtMs }));
  return { db, run, sellerId, payment, disconnect };
};

it("reauthorizes a disconnected seller and fences old invoice and checkout attempts", async () => {
  const { db, run, sellerId, payment, disconnect } = fixture();
  try {
    const state = () => db.prepare("SELECT state FROM partner_alert_stripe_sellers WHERE seller_id=?").pluck().get(sellerId);
    const atDisconnect = at + 4000;
    expect(disconnect("evt_disconnect", atDisconnect, atDisconnect)).toBe(true);
    expect(state()).toBe("disconnected");
    expect(() => run(() => recordPartnerAlertStripeSeller(db, { ...sellerScope, accountId, state: "ready", atMs: atDisconnect })))
      .toThrow("reauthorization scope");
    const began = atDisconnect + 1000;
    const pending = run(() => beginPartnerStripeSetup(db, sellerScope, "oauth", "", began));
    expect(findPartnerStripeOAuthScope(db, pending.oauthState!, "visitor", "sandbox", began + 1000)).toBeUndefined();
    const attempt = run(() => claimPartnerStripeOAuth(db, pending.oauthState!, pending.attempt.seller_id, began + 1000))!;
    expect(run(() => claimPartnerStripeOAuth(db, pending.oauthState!, attempt.seller_id, began + 1000))).toBeUndefined();
    const reconnectedAt = began + 2000;
    const verifiedSeller = { ...sellerScope, accountId, state: "ready" as const, atMs: reconnectedAt };
    expect(run(() => {
      requirePartnerStripeSetupAttempt(db, sellerScope, attempt);
      return recordPartnerAlertStripeSeller(db, verifiedSeller, { sellerId: attempt.seller_id, startedAtMs: attempt.created_at_ms });
    })).toBe(sellerId);
    expect(() => run(() => requirePartnerStripeSetupAttempt(db, sellerScope, attempt))).toThrow("setup changed");
    expect(state()).toBe("ready");
    expect(disconnect("evt_delayed_old_disconnect", atDisconnect, reconnectedAt + 3000)).toBe(false);
    expect(db.prepare("SELECT status FROM partner_alert_partners").pluck().get()).toBe("publishing_paused");
    expect(payment("late", at + 86_400_000, "buyer")).toBe(false);
    expect(db.prepare("SELECT invoice_id FROM partner_alert_stripe_paid_terms").pluck().all()).toEqual(["in_initial"]);

    const generations = () => db.prepare(`SELECT generation,authorized_at_ms,disconnected_at_ms FROM partner_alert_stripe_authorizations
      WHERE seller_id=? ORDER BY generation`).all(sellerId);
    expect(generations()).toEqual([{ generation: 1, authorized_at_ms: at, disconnected_at_ms: atDisconnect },
      { generation: 2, authorized_at_ms: reconnectedAt, disconnected_at_ms: null }]);
    const stripe = vi.fn(async (path: string, fields?: Record<string, string>) => {
      if (path === "checkout/sessions/cs_test_visitor") return { id: "cs_test_visitor",
        client_reference_id: "claim_visitor", livemode: false, mode: "subscription", status: oldStatus };
      if (path === "checkout/sessions") return { id: "cs_test_successor", client_reference_id: fields?.client_reference_id,
        livemode: false, mode: "subscription", status: "open", url: "https://checkout.stripe.com/c/pay/fixture" };
      throw new Error("Unexpected Stripe path.");
    });
    let buyer = "buyer";
    let oldStatus = "open";
    const checkoutAt = reconnectedAt + 5000;
    const checkout = createPartnerAlertNativeStripeCheckout({ database: db, environment: "sandbox", origin,
      runInWriter: (_scope, op) => run(op), assertBuyer: () => {},
      verifySeller: async () => ({ id: accountId, livemode: false, dashboard: "full",
        defaults: { responsibilities: { fees_collector: "stripe", losses_collector: "stripe", requirements_collector: "stripe" } },
        configuration: { merchant: { capabilities: { card_payments: { status: "active" },
          stripe_balance: { payouts: { status: "active" } } } } } }),
      verifyPrice: async () => ({ id: price, active: true, currency: "usd", unit_amount: 2500, livemode: false,
        recurring: { interval: "month", interval_count: 1 } }),
      nowMs: () => checkoutAt, stripeForAccount: () => stripe,
      authorizeCheckout: async () => ({ userId: buyer, communityId, offerId, version: 1 }),
    });
    const request = () => checkout(new Request(origin + "/checkout", { method: "POST",
      headers: { host: new URL(origin).host, origin, "sec-fetch-site": "same-origin", "x-traderlink-platform-mutation": "1" } }),
    communityId, offerId + ":1");
    expect((await request()).status).toBe(503);
    expect(stripe).not.toHaveBeenCalled();
    db.exec("UPDATE partner_alert_partners SET status='active'");
    expect((await request()).status).toBe(409);
    expect(stripe).not.toHaveBeenCalled();
    buyer = "visitor";
    expect((await request()).status).toBe(409);
    expect(stripe.mock.calls.map(([path]) => path)).toEqual(["checkout/sessions/cs_test_visitor"]);
    oldStatus = "expired";
    expect((await request()).status).toBe(200);
    expect(db.prepare(`SELECT authorization_generation,stripe_session_id,checkout_close_reason FROM partner_alert_stripe_checkout_claims
      WHERE buyer_user_id='visitor' ORDER BY authorization_generation`).all()).toEqual([
      { authorization_generation: 1, stripe_session_id: "cs_test_visitor", checkout_close_reason: "checkout_expired" },
      { authorization_generation: 2, stripe_session_id: "cs_test_successor", checkout_close_reason: null },
    ]);
    expect(run(() => closePartnerAlertStripeCheckoutAttempt(db, { claimId: "claim_buyer", sessionId: "cs_test_buyer",
      reason: "subscription_ended", atMs: reconnectedAt + 6000 }))).toBe(true);
    expect(db.prepare("SELECT invoice_id FROM partner_alert_stripe_paid_terms").pluck().all()).toEqual(["in_initial"]);

    const erasedAt = reconnectedAt + 9000;
    db.prepare("UPDATE partner_alert_stripe_sellers SET state='disconnected',owner_user_id=NULL,owner_erased_at_ms=?,updated_at_ms=? WHERE seller_id=?")
      .run(erasedAt, erasedAt, sellerId);
    expect(generations()).toEqual([{ generation: 1, authorized_at_ms: at, disconnected_at_ms: atDisconnect },
      { generation: 2, authorized_at_ms: reconnectedAt, disconnected_at_ms: erasedAt }]);
    expect(() => run(() => db.prepare(`INSERT INTO partner_alert_stripe_authorizations VALUES(?,3,?,NULL)`)
      .run(sellerId, erasedAt + 1000))).toThrow("reauthorization_scope");
    expect(db.pragma("foreign_key_check")).toEqual([]);
  } finally { db.close(); }
});
