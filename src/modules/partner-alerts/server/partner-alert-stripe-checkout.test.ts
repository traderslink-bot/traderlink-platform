// @vitest-environment node
import { mkdtempSync, rmSync } from "node:fs";
import { createHmac } from "node:crypto";
import Database from "better-sqlite3";
import { expect, it, vi } from "vitest";
import { openPartnerAlertStripeSandboxLedger } from "./partner-alert-stripe-billing-store";
import { createPartnerAlertStripeWhopAccess } from "./partner-alert-stripe-whop-access";
import { qualifiedPaidInput } from "../contracts/partner-alert-access-policy.test-fixture";
import { createPartnerAlertStripeConnect, createPartnerAlertStripeSandboxCheckout,
  createPartnerAlertStripeSandboxClient, createPartnerAlertStripeSandboxConnect } from "./partner-alert-stripe-checkout";
import { readPartnerAlertStripeBillingConfiguration } from "./partner-alert-stripe-billing-runtime";

it.each([false, true])("records exact channel and package terms with Connect enabled = %s", async connected => {
  const directory = mkdtempSync("/tmp/traderlink-paid-qa-");
  let db = openPartnerAlertStripeSandboxLedger(directory);
  const whop = new Database(":memory:");
  const base = qualifiedPaidInput();
  const { communityId, userId, offers } = base;
  const channel = offers[0]!.offer;
  const pack = { ...channel, kind: "package" as const, offerId: "33333333-3333-4333-8333-333333333339",
    mappingIds: [...channel.mappingIds, "33333333-3333-4333-8333-333333333340"] };
  let paidPremium = false;
  let hasExistingWhopPurchase = false;
  let wrongPrice = false;
  let removalCandidates: string[] = [];
  const stripeCanceled = new Set<string>();
  let creates = 0;
  let seller = "acct_seller";
  let sellerReady = true;
  let refunded = 500;
  let disputeStatus = "needs_response";
  const scopedReads: string[] = [];
  const origin = "http://127.0.0.1:3040";
  const secret = "whsec_isolated_partner_checkout";
  const now = 1794715000000;
  const sessions = new Map<string, Record<string, unknown>>();
  const observed = new Date(now - 1000).toISOString();
  const expires = new Date(now + 60_000).toISOString();
  const whopRef = "e".repeat(64);
  const qualification = { kind: "qualified", qualificationRef: "whop-current-fixture", schemaSha256: "a".repeat(64),
    apiVersion: "whop-test" } as const;
  const account = pack.whop.accountId;
  const mapping = pack.mappingIds[1]!;
  const ticket = { ...base.ticket, context: { ...base.ticket.context, mappingId: mapping, observedAtUtc: observed, validUntilUtc: expires } };
  whop.exec(`CREATE TABLE partner_alert_offers(community_id,offer_id,version,offer_json,whop_environment,review_state);
    CREATE TABLE partner_alert_offer_channels(community_id,offer_id,offer_version,mapping_id);
    CREATE TABLE partner_alert_whop_identities(user_id,environment,whop_user_ref,status);
    CREATE TABLE partner_alert_whop_connections(community_id,environment,whop_account_id,status,valid_until_utc);
    CREATE TABLE partner_alert_whop_discovery(community_id,user_id,offer_id,offer_version,environment,whop_account_id,
      observed_at_utc,valid_until_utc,qualification_ref,identity_generation,connection_generation,erasure_generation);
    CREATE TABLE partner_alert_memberships(community_id,user_id,offer_id,offer_version,environment,whop_account_id,membership_id,
      whop_user_ref,state,basis,starts_at_utc,observed_at_utc,valid_until_utc);
    CREATE TABLE partner_alert_whop_paid_intervals(community_id,user_id,offer_id,offer_version,environment,whop_account_id,membership_id,
      starts_at_utc,ends_at_utc);`);
  whop.prepare("INSERT INTO partner_alert_offers VALUES (?,?,1,?,'live','withdrawn')").run(communityId, pack.offerId, JSON.stringify(pack));
  whop.prepare("INSERT INTO partner_alert_offer_channels VALUES (?,?,1,?)").run(communityId, pack.offerId, mapping);
  whop.prepare("INSERT INTO partner_alert_whop_identities VALUES (?,'live',?,'verified')").run(userId, whopRef);
  whop.prepare("INSERT INTO partner_alert_whop_connections VALUES (?,'live',?,'verified',?)").run(communityId, account, expires);
  const scope = [communityId, userId, pack.offerId, 1, "live", account] as const;
  whop.prepare("INSERT INTO partner_alert_whop_discovery VALUES (?,?,?,?,?,?,?,?,?,1,1,1)")
    .run(...scope, observed, expires, qualification.qualificationRef);
  whop.prepare("INSERT INTO partner_alert_memberships VALUES (?,?,?,?,?,?,'mem_fixture',?,'active','paid',?,?,?)")
    .run(...scope, whopRef, observed, observed, expires);
  whop.prepare("INSERT INTO partner_alert_whop_paid_intervals VALUES (?,?,?,?,?,?,'mem_fixture',?,?)")
    .run(...scope, observed, expires);
  const readWhopAccess = createPartnerAlertStripeWhopAccess({
    readCurrentTicket: subject => subject.mappingId === mapping ? ticket : null,
    nowUtc: () => new Date(now).toISOString(),
    db: whop,
    receipt: {
      qualification, environment: "live", nowUtc: () => new Date(now).toISOString(), maximumEvidenceAgeMs: 90_000,
      readCurrentGenerations: () => ({ identity: 1, connection: 1, erasure: 1 }),
      readDiscord: () => ({ evidence: base.discord, previousDiscordUserIds: [] }),
    },
    inCurrentWriter: operation => whop.transaction(operation)(),
  });
  const stripe = async (path: string, fields?: Record<string, string>) => {
    if (path.startsWith("prices/")) return { id: path.slice(7), active: true, livemode: false, currency: "usd", unit_amount: channel.amountMinor,
      recurring: { interval: "day", interval_count: 30 } };
    if (path === "checkout/sessions") {
      expect(Object.keys(fields ?? {}).some(key => /application_fee|transfer_data|on_behalf_of/u.test(key))).toBe(false);
      const which = fields?.["line_items[0][price]"] === "price_channel" ? "channel" : "package";
      const session = { id: `cs_test_${which}`, url: `https://checkout.stripe.com/c/pay/cs_test_${which}`, status: "complete",
        client_reference_id: fields?.client_reference_id, livemode: false, customer: `cus_${which}`, subscription: `sub_${which}` };
      sessions.set(which, session);
      creates++;
      return session;
    }
    if (path === "invoices/in_renewal") return { id: "in_renewal", livemode: false, customer: "cus_channel", status: "open",
      billing_reason: "subscription_cycle", parent: { subscription_details: { subscription: "sub_channel" } } };
    if (path === "disputes/dp_channel") return { id: "dp_channel", livemode: false, charge: "ch_channel", status: disputeStatus };
    if (path === "charges/ch_channel" || path === "charges/ch_package") {
      const kind = path.slice(11);
      return { id: `ch_${kind}`, livemode: false, paid: true, payment_intent: `pi_${kind}`, customer: `cus_${kind}`,
        currency: "usd", amount: 2500, amount_captured: 2500, amount_refunded: refunded, refunded: refunded === 2500 };
    }
    const which = path.includes("package") ? "package" : "channel";
    if (path === `invoices/in_${which}`) return { id: `in_${which}`, customer: `cus_${which}`, livemode: false,
      status: "paid", billing_reason: "subscription_create", amount_paid: 2500, total: 2500, currency: "usd",
      parent: { subscription_details: { subscription: `sub_${which}` } } };
    if (path === `subscriptions/sub_${which}`) return { id: `sub_${which}`, customer: `cus_${which}`, livemode: false,
      metadata: { partner_sandbox_claim: sessions.get(which)?.client_reference_id },
      ...(stripeCanceled.has(which) ? {status: "canceled", ended_at: now / 1000} : {}) };
    if (path === `checkout/sessions/cs_test_${which}`) return sessions.get(which)!;
    if (path.startsWith("invoice_payments?")) return { has_more: false, data: [{ id: `inpay_${which}`, invoice: `in_${which}`,
      status: "paid", livemode: false, amount_paid: 2500, currency: "usd", payment: { type: "payment_intent", payment_intent: `pi_${which}` } }] };
    if (path.endsWith("/lines?limit=100")) return { has_more: false, data: [{ quantity: 1, amount: 2500, currency: "usd", period: { start: now / 1000 - 60, end: now / 1000 + 60 },
      parent: { type: "subscription_item_details", subscription_item_details: { subscription: `sub_${which}`, proration: false } },
      pricing: { price_details: { price: wrongPrice ? "price_wrong" : `price_${which}` } } }] };
    throw new Error("Unexpected Stripe call");
  };
  const bind = () => createPartnerAlertStripeSandboxCheckout({ db, returnOrigin: origin, signingSecret: secret, nowMs: () => now,
    readWhopAccess,
    async reconcileAccess(_buyer, _community, evidence) {
      if (evidence.ended) removalCandidates = pack.mappingIds.filter(mappingId => evidence.mayRemoveMapping(mappingId));
    },
    authorizeCheckout: (_request, _community, offerKey) => {
      const offer = offerKey.startsWith(pack.offerId) ? pack : channel;
      return { buyer: { userId, paidPremium, hasExistingWhopPurchase }, target: { offer, priceId: offer === channel ? "price_channel" : "price_package",
        ...(connected ? { sellerAccount: seller } : {}) } };
    },
    stripe: connected ? async () => { throw new Error("Unexpected platform-scoped checkout"); } : stripe,
    ...(connected ? { connect: {
      readSeller: async accountId => ({
        id: accountId, livemode: false, dashboard: "full",
        defaults: { responsibilities: { fees_collector: "stripe", losses_collector: "stripe", requirements_collector: "stripe" } },
        configuration: { merchant: { capabilities: {
          card_payments: { status: sellerReady ? "active" : "restricted" }, stripe_balance: { payouts: { status: "active" } },
        } } },
      }),
      stripeForAccount: accountId => async (path, fields) => {
        scopedReads.push(accountId);
        return stripe(path, fields);
      },
    } } : {}),
  });
  let application = bind();
  const start = (offerId: string) => application.checkout(new Request(`${origin}/checkout`, { method: "POST", headers: { origin } }),
    communityId, `${offerId}:1`);
  const event = (which: string, valid = true, cancellation = false, eventAccount = connected ? seller : "") => {
    const raw = JSON.stringify({ object: "event", type: cancellation ? "customer.subscription.deleted" : "invoice.paid",
      id: cancellation ? `evt_cancel_${which}` : `evt_${which}`, livemode: false,
      ...(eventAccount ? { account: eventAccount } : {}),
      data: { object: cancellation ? { id: `sub_${which}`, ended_at: now / 1000 } : { id: `in_${which}` } } });
    const time = now / 1000;
    const signature = createHmac("sha256", secret).update(`${time}.${raw}`).digest("hex");
    return application.invoiceWebhook(new Request(`${origin}/webhook`, { method: "POST", body: raw, headers: {
      "stripe-signature": `t=${time},v1=${valid ? signature : "bad"}`,
    } }));
  };
  const billingEvent = (type: string, resource: string, suffix: string) => {
    const time = now / 1000;
    const raw = JSON.stringify({ object: "event", type, id: `evt_${suffix}`, livemode: false,
      ...(connected ? { account: seller } : {}), data: { object: { id: resource } } });
    const signature = createHmac("sha256", secret).update(`${time}.${raw}`).digest("hex");
    return application.invoiceWebhook(new Request(`${origin}/webhook`, { method: "POST", body: raw, headers: {
      "stripe-signature": `t=${time},v1=${signature}`,
    } }));
  };
  try {
    expect((await start(channel.offerId)).status).toBe(403);
    paidPremium = true;
    hasExistingWhopPurchase = true;
    expect((await start(channel.offerId)).status).toBe(403);
    hasExistingWhopPurchase = false;
    if (connected) {
      sellerReady = false;
      expect((await start(channel.offerId)).status).toBe(503);
      sellerReady = true;
    }
    expect((await start(channel.offerId)).status).toBe(200);
    expect((await start(channel.offerId)).status).toBe(200);
    expect((await start(pack.offerId)).status).toBe(200);
    expect(creates).toBe(2);
    if (connected) {
      seller = "acct_other";
      expect((await start(channel.offerId)).status).toBe(409);
      seller = "acct_seller";
      expect((await event("channel", true, false, "")).status).toBe(400);
      expect((await event("channel", true, false, "acct_other")).status).toBe(204);
      expect(db.prepare("SELECT DISTINCT account_id FROM qa_partner_stripe_claim_sellers").pluck().all()).toEqual([seller]);
    }
    expect(db.prepare("SELECT count(*) FROM qa_partner_stripe_terms").pluck().get()).toBe(0);
    expect((await event("channel", false)).status).toBe(400);
    expect((await billingEvent("charge.refunded", "ch_channel", "early_partial")).status).toBe(202);
    expect(db.prepare("SELECT count(*) FROM qa_partner_stripe_pending_adjustments").pluck().get()).toBe(1);
    wrongPrice = true;
    expect((await event("channel")).status).toBe(503);
    wrongPrice = false;
    expect((await event("channel")).status).toBe(200);
    expect(db.prepare("SELECT count(*) FROM qa_partner_stripe_pending_adjustments").pluck().get()).toBe(0);
    expect(db.prepare("SELECT disposition FROM qa_partner_stripe_adjustments WHERE event_id='evt_early_partial'").pluck().get()).toBe("review");
    expect((await event("channel")).status).toBe(200);
    expect((await event("package")).status).toBe(200);
    expect(db.prepare(`SELECT c.price_id,c.mappings,t.starts,t.ends FROM qa_partner_stripe_terms t JOIN qa_partner_stripe_claims c
      ON t.claim_id=c.claim_id ORDER BY price_id`).all()).toEqual([
      { price_id: "price_channel", mappings: JSON.stringify(channel.mappingIds), starts: now / 1000 - 60, ends: now / 1000 + 60 },
      { price_id: "price_package", mappings: JSON.stringify(pack.mappingIds), starts: now / 1000 - 60, ends: now / 1000 + 60 },
    ]);
    expect(application.readOccupiedMappings(userId, communityId)).toEqual([...pack.mappingIds].sort());
    expect(readWhopAccess(userId, communityId, mapping)).toBe("active");
    db.close();
    db = openPartnerAlertStripeSandboxLedger(directory);
    application = bind();
    expect(db.prepare("SELECT count(*) FROM qa_partner_stripe_settlements").pluck().get()).toBe(2);
    expect((await event("package")).status).toBe(200);
    expect(db.prepare("SELECT count(*) FROM qa_partner_stripe_events").pluck().get()).toBe(3);
    stripeCanceled.add("package");
    expect((await event("package", true, true)).status).toBe(200);
    expect(application.readOccupiedMappings(userId, communityId)).toEqual(channel.mappingIds);
    expect(removalCandidates).toEqual([]);
    whop.prepare("UPDATE partner_alert_whop_discovery SET identity_generation=2").run();
    expect(readWhopAccess(userId, communityId, mapping)).toBe("unknown");
    expect((await event("package", true, true)).status).toBe(200);
    expect(removalCandidates).toEqual([]);
    db.close();
    db = openPartnerAlertStripeSandboxLedger(directory);
    application = bind();
    expect(application.readOccupiedMappings(userId, communityId)).toEqual(channel.mappingIds);
    expect(db.prepare("SELECT count(*) FROM qa_partner_stripe_ends").pluck().get()).toBe(1);
    whop.prepare("UPDATE partner_alert_whop_discovery SET identity_generation=1").run();
    whop.prepare("UPDATE partner_alert_memberships SET state='inactive'").run();
    expect(readWhopAccess(userId, communityId, mapping)).toBe("absent");
    expect((await event("package", true, true)).status).toBe(200);
    expect(removalCandidates).toEqual([pack.mappingIds[1]]);
    const adjustment = async (type: string, resource: string, suffix: string, disposition: string, applied = true) => {
      const response = await billingEvent(type, resource, suffix);
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ applied, disposition });
    };
    await adjustment("invoice.payment_failed", "in_renewal", "failed_renewal", "review");
    await adjustment("charge.refunded", "ch_channel", "partial_refund", "review");
    await adjustment("charge.dispute.created", "dp_channel", "dispute_open", "review");
    disputeStatus = "won";
    await adjustment("charge.dispute.closed", "dp_channel", "dispute_won", "retain");
    expect(application.readOccupiedMappings(userId, communityId)).toEqual(channel.mappingIds);
    refunded = 2500;
    await adjustment("charge.refunded", "ch_package", "full_refund", "remove_candidate");
    expect(application.readOccupiedMappings(userId, communityId)).toEqual(channel.mappingIds);
    disputeStatus = "lost";
    await adjustment("charge.dispute.closed", "dp_channel", "dispute_lost", "remove_candidate");
    await adjustment("charge.dispute.closed", "dp_channel", "dispute_lost", "remove_candidate", false);
    expect(application.readOccupiedMappings(userId, communityId)).toEqual([]);
    expect(removalCandidates).toEqual([]);
    if (connected) expect(scopedReads.at(-1)).toBe("acct_seller");
  } finally { db.close(); whop.close(); rmSync(directory, { recursive: true, force: true }); }
});

it("rejects a live Stripe key before network access", () => {
  expect(() => createPartnerAlertStripeSandboxClient("sk_live_Example")).toThrow("sandbox key");
});

it("keeps live billing opt-in, binds it to HTTPS and rejects sandbox responses", async () => {
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("TRADERLINK_PLATFORM_PUBLIC_ORIGIN", "https://partner-fixture.invalid");
  vi.stubEnv("PARTNER_STRIPE_NATIVE_LIVE_SIGNING_SECRET", "whsec_fixture");
  vi.stubEnv("PARTNER_STRIPE_NATIVE_LIVE_SECRET_KEY", "sk_live_fixture");
  vi.stubEnv("PARTNER_STRIPE_NATIVE_LIVE_CONNECT_CLIENT", undefined);
  vi.stubEnv("PARTNER_STRIPE_NATIVE_LIVE_ENABLED", undefined);
  try {
    expect(readPartnerAlertStripeBillingConfiguration()).toBeNull();
    vi.stubEnv("PARTNER_STRIPE_NATIVE_LIVE_ENABLED", "true");
    expect(readPartnerAlertStripeBillingConfiguration()?.environment).toBe("live");
    vi.stubEnv("TRADERLINK_PLATFORM_PUBLIC_ORIGIN", "http://partner-fixture.invalid");
    expect(readPartnerAlertStripeBillingConfiguration()).toBeNull();
    vi.stubEnv("TRADERLINK_PLATFORM_PUBLIC_ORIGIN", "https://partner-fixture.invalid");
    vi.stubEnv("PARTNER_STRIPE_NATIVE_LIVE_SECRET_KEY", "sk_test_fixture");
    expect(readPartnerAlertStripeBillingConfiguration()).toBeNull();

    let livemode = true;
    const transport: typeof fetch = async (input, init) => {
      expect(new URL(String(input)).origin).toBe("https://api.stripe.com");
      const headers = new Headers(init?.headers);
      expect(headers.get("authorization")).toBe("Bearer sk_live_fixture");
      if (new URL(String(input)).pathname.startsWith("/v1/")) expect(headers.get("stripe-account")).toBe("acct_seller");
      return Response.json({ livemode });
    };
    const connect = createPartnerAlertStripeConnect("sk_live_fixture", "live", transport);
    await expect(connect.readSeller("acct_seller")).resolves.toEqual({ livemode: true });
    await expect(connect.stripeForAccount("acct_seller")("checkout/sessions", { mode: "subscription" }))
      .resolves.toEqual({ livemode: true });
    livemode = false;
    await expect(connect.readSeller("acct_seller")).rejects.toThrow("mode changed");
    await expect(connect.stripeForAccount("acct_seller")("checkout/sessions", { mode: "subscription" }))
      .rejects.toThrow("mode changed");
  } finally { vi.unstubAllEnvs(); }
});


it("scopes seller charges and uses indexed includes when reading account readiness", async () => {
  const connect = createPartnerAlertStripeSandboxConnect("sk_test_fixture", async (request, init) => {
    const url = new URL(String(request));
    const headers = new Headers(init?.headers);
    expect(url.origin).toBe("https://api.stripe.com");
    if (url.pathname === "/v2/core/accounts/acct_seller") {
      expect(headers.has("Stripe-Account")).toBe(false);
      expect([...url.searchParams]).toEqual([["include[0]", "configuration.merchant"], ["include[1]", "defaults"]]);
    } else {
      expect(url.pathname).toBe("/v1/checkout/sessions");
      expect(headers.get("Stripe-Account")).toBe("acct_seller");
      expect(headers.get("Idempotency-Key")).toBe("partner-test");
    }
    return Response.json({ livemode: false });
  });
  await expect(connect.readSeller("acct_seller")).resolves.toMatchObject({ livemode: false });
  await expect(connect.stripeForAccount("acct_seller")("checkout/sessions", { mode: "subscription" }, "partner-test"))
    .resolves.toMatchObject({ livemode: false });
});
