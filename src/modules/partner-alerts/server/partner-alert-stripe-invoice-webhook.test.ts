// @vitest-environment node
import { createHmac } from "node:crypto";
import Database from "better-sqlite3";
import { expect, it } from "vitest";
import { platformPaidStripeConnectBillingMigration } from
  "../../platform/server/database/migrations/0209_platform_paid_stripe_connect_billing";
import { createPartnerAlertStripeInvoiceWebhook } from "./partner-alert-stripe-invoice-webhook";
import { partnerStripeCheckoutClaimMetadata } from "./partner-alert-stripe-paid-invoice";
import { readPartnerAlertStripeChannelFunding } from "./database/partner-alert-stripe-channel-funding";
import { recordPartnerAlertStripeAdjustmentReview } from "./database/partner-alert-stripe-adjustment-review";
import { readPartnerAlertStripeRolePage } from "./partner-alert-stripe-role-reconciliation";

it.each(["normal order", "cancellation first", "canceled at invoice read", "canceled before renewal",
  "full refund first", "partial refund first", "lost dispute first", "adjustment during settlement", "asynchronous refunds",
  "delayed dispute opening", "late dispute win"] as const)(
  "settles only the connected purchase and its package roles through signed webhooks in %s", async order => {
  const db = new Database(":memory:");
  const now = 1_790_000_000_000;
  const firstClaim = "12345678-1234-4234-8234-123456789abc";
  const secret = "whsec_partner_invoice_test";
  const account = "acct_seller";
  let amount = 2500;
  let price = "price_approved";
  let writes = 0;
  let refunded = 1000;
  let refunds: Record<string, unknown>[] | undefined;
  let disputeStatus = "needs_response";
  let canceled = false;
  let checkoutCustomer = "cus_buyer";
  let beforeRenewalCommit: (() => Promise<void>) | undefined;
  let beforeAdjustmentRead: (() => Promise<void>) | undefined;
  let beforeRefundRead: (() => Promise<void>) | undefined;
  let beforeDisputeRead: (() => Promise<void>) | undefined;
  try {
    db.pragma("foreign_keys=ON");
    db.exec(`
      CREATE TABLE platform_users(user_id TEXT PRIMARY KEY);
      INSERT INTO platform_users VALUES('buyer'),('owner');
      CREATE TABLE traderlink_communities(community_id TEXT PRIMARY KEY,owner_user_id TEXT,status TEXT);
      INSERT INTO traderlink_communities VALUES('community','owner','active');
      CREATE TABLE partner_alert_partners(community_id TEXT PRIMARY KEY,owner_user_id TEXT,status TEXT,revision INTEGER,updated_at_utc TEXT);
      INSERT INTO partner_alert_partners VALUES('community','owner','active',1,'2026-01-01T00:00:00.000Z');
      CREATE TABLE partner_alert_offers(community_id TEXT,offer_id TEXT,version INTEGER,review_state TEXT,offer_json TEXT,
        whop_environment TEXT,whop_account_id TEXT,whop_product_id TEXT,whop_plan_id TEXT,
        PRIMARY KEY(community_id,offer_id,version));
      INSERT INTO partner_alert_offers VALUES('community','package',1,'approved','{"amountMinor":2500,"currency":{"code":"USD"}}',
        'live','biz_fixture','prod_fixture','plan_fixture');
      CREATE TABLE partner_alert_offer_channels(community_id TEXT,offer_id TEXT,offer_version INTEGER,mapping_id TEXT);
      INSERT INTO partner_alert_offer_channels VALUES
        ('community','package',1,'included'),('community','package',1,'included_two'),('community','other_offer',1,'other_role');
      CREATE TABLE partner_alert_mappings(community_id TEXT,mapping_id TEXT,PRIMARY KEY(community_id,mapping_id));
      INSERT INTO partner_alert_mappings VALUES('community','included'),('community','included_two'),('community','other_role');
      CREATE TABLE partner_alert_role_jobs(community_id TEXT,mapping_id TEXT,user_id TEXT,applied_present INTEGER,
        managed_assignment_ref TEXT,decision_valid_until_utc TEXT,desired_ticket_json TEXT);
    `);
    db.transaction(() => platformPaidStripeConnectBillingMigration.statements.forEach(sql => db.exec(sql))).immediate();
    db.exec(`INSERT INTO partner_alert_stripe_sellers VALUES('seller','community','owner','sandbox','acct_seller','ready',1,1,NULL);
      INSERT INTO partner_alert_stripe_prices VALUES('seller','community','sandbox','acct_seller','package',1,'price_approved','usd',2500,1,NULL);`);
    db.prepare(`INSERT INTO partner_alert_stripe_checkout_claims
      (claim_id,buyer_user_id,seller_id,community_id,environment,stripe_account_id,offer_id,offer_version,stripe_price_id,stripe_session_id,created_at_ms)
      VALUES(?,'buyer','seller','community','sandbox','acct_seller','package',1,'price_approved','cs_test_session',1)`).run(firstClaim);

    const handle = createPartnerAlertStripeInvoiceWebhook({
      database: db, environment: "sandbox", signingSecret: secret, nowMs: () => now,
      connectClientId: "ca_fixture",
      runSellerInWriter: (owner, write) => {
        expect(owner).toBe("owner");
        return db.transaction(write).immediate();
      },
      stripeForAccount: seller => async path => {
        expect(seller).toBe(account);
        expect(db.inTransaction).toBe(false);
        const known: Record<string, Record<string, unknown>> = {
          "invoices/in_invoice": { id: "in_invoice", livemode: false, status: "paid", billing_reason: "subscription_create",
            amount_paid: amount, total: amount, currency: "usd", customer: "cus_buyer",
            parent: { subscription_details: { subscription: "sub_buyer" } } },
          "invoices/in_renewal": { id: "in_renewal", livemode: false, status: "paid", billing_reason: "subscription_cycle",
            amount_paid: amount, total: amount, currency: "usd", customer: "cus_buyer",
            parent: { subscription_details: { subscription: "sub_buyer" } } },
          "subscriptions/sub_buyer": { id: "sub_buyer", livemode: false, customer: "cus_buyer",
            metadata: { [partnerStripeCheckoutClaimMetadata]: firstClaim },
            status: canceled ? "canceled" : "active", ended_at: canceled ? now / 1000 : null },
          "invoices/in_failed": { id: "in_failed", livemode: false, status: "open", billing_reason: "subscription_cycle",
            customer: "cus_buyer", parent: { subscription_details: { subscription: "sub_buyer" } } },
          "charges/ch_paid": { id: "ch_paid", livemode: false, paid: true, payment_intent: "pi_proof", customer: "cus_buyer",
            currency: "usd", amount: 2500, amount_captured: 2500, refunded: refunded === 2500, amount_refunded: refunded },
          "refunds?charge=ch_paid&limit=100": { has_more: false, data: refunds ?? [{ id: "re_fixture", charge: "ch_paid",
            payment_intent: "pi_proof", currency: "usd", status: "succeeded", amount: refunded }] },
          "disputes/du_paid": { id: "du_paid", livemode: false, charge: "ch_paid", status: disputeStatus },
          "disputes/du_other": { id: "du_other", livemode: false, charge: "ch_paid", status: "lost" },
          "checkout/sessions/cs_test_session": { id: "cs_test_session", livemode: false, subscription: "sub_buyer",
            status: "complete", client_reference_id: firstClaim, customer: checkoutCustomer },
          "invoices/in_invoice/lines?limit=100": { has_more: false, data: [{
            amount, currency: "usd", quantity: 1, parent: { type: "subscription_item_details",
              subscription_item_details: { subscription: "sub_buyer", proration: false } },
            pricing: { price_details: { price } }, period: { start: now / 1000, end: now / 1000 + 86400 },
          }] },
          "invoices/in_renewal/lines?limit=100": { has_more: false, data: [{
            amount, currency: "usd", quantity: 1, parent: { type: "subscription_item_details",
              subscription_item_details: { subscription: "sub_buyer", proration: false } },
            pricing: { price_details: { price } }, period: { start: now / 1000 + 86400, end: now / 1000 + 172800 },
          }] },
          "invoice_payments?invoice=in_invoice&status=paid&limit=100": { has_more: false, data: [{
            id: "inpay_proof", invoice: "in_invoice", amount_paid: amount, currency: "usd", status: "paid", livemode: false,
            payment: { type: "payment_intent", payment_intent: "pi_proof" },
          }] },
          "invoice_payments?invoice=in_renewal&status=paid&limit=100": { has_more: false, data: [{
            id: "inpay_renewal", invoice: "in_renewal", amount_paid: amount, currency: "usd", status: "paid", livemode: false,
            payment: { type: "payment_intent", payment_intent: "pi_renewal" },
          }] },
        };
        if (path.startsWith("invoice_payments?payment")) {
          return known["invoice_payments?invoice=in_invoice&status=paid&limit=100"]!;
        }
        if (!known[path]) throw new Error(`Unexpected Stripe test request ${path}`);
        if (path.startsWith("invoice_payments?invoice=in_renewal&")) await beforeRenewalCommit?.();
        if (path === "charges/ch_paid") await beforeAdjustmentRead?.();
        if (path.startsWith("refunds?")) await beforeRefundRead?.();
        if (path === "disputes/du_paid") await beforeDisputeRead?.();
        return known[path];
      },
      runInWriter: (claim, write) => {
        expect(claim).toMatchObject({ claim_id: firstClaim, buyer_user_id: "buyer", stripe_account_id: account });
        writes++;
        return db.transaction(write).immediate();
      },
    });
    function signed(overrides: Record<string, unknown> = {}, signingKey = secret) {
      const raw = JSON.stringify({ object: "event", id: "evt_payment", livemode: false, account,
        type: "invoice.paid", data: { object: { id: "in_invoice" } }, ...overrides });
      const seconds = now / 1000;
      const signature = createHmac("sha256", signingKey).update(`${seconds}.${raw}`).digest("hex");
      return new Request("http://127.0.0.1/stripe", { method: "POST", body: raw, headers: {
        "content-type": "application/json", "stripe-signature": `t=${seconds},v1=${signature}`,
      } });
    }
    expect((await handle(signed({}, "whsec_wrong"))).status).toBe(400);
    expect((await handle(signed({ livemode: true }))).status).toBe(400);
    expect((await handle(signed({ account: "acct_elsewhere" }))).status).toBe(204);
    const adjustment = (id: string, type: string, objectId: string) => signed({ id, type, data: { object: { id: objectId } } });
    if (order === "full refund first" || order === "partial refund first" || order === "lost dispute first"
      || order === "adjustment during settlement") {
      const dispute = order === "lost dispute first";
      const retained = order === "partial refund first";
      if (!retained) refunded = 2500;
      if (dispute) disputeStatus = "lost";
      const first = () => handle(adjustment("evt_early_adjustment", dispute ? "charge.dispute.closed" : "charge.refunded",
        dispute ? "du_paid" : "ch_paid"));
      expect((await first()).status).toBe(503);
      expect((await first()).status).toBe(503);
      expect(db.prepare("SELECT claim_id,status FROM partner_alert_stripe_events").all())
        .toEqual([{ claim_id: firstClaim, status: "pending" }]);
      expect(db.prepare("SELECT count(*) FROM partner_alert_stripe_review_decisions").pluck().get()).toBe(0);
      if (order === "adjustment during settlement") {
        beforeAdjustmentRead = async () => {
          beforeAdjustmentRead = undefined;
          expect((await handle(adjustment("evt_second_adjustment", "charge.refunded", "ch_paid"))).status).toBe(503);
        };
        expect((await handle(signed())).status).toBe(503);
        expect(db.prepare("SELECT count(*) FROM partner_alert_stripe_paid_terms").pluck().get()).toBe(0);
        expect(db.prepare("SELECT count(*) FROM partner_alert_stripe_events WHERE status='pending'").pluck().get()).toBe(2);
      }
      await expect((await handle(signed())).json()).resolves.toEqual({ applied: true });
      expect(db.prepare("SELECT count(*) FROM partner_alert_stripe_paid_terms").pluck().get()).toBe(1);
      const decision = { affected_paid_invoice_id: "in_invoice", disposition: retained ? "review" : "remove_candidate", decision: "pending" };
      expect(db.prepare("SELECT affected_paid_invoice_id,disposition,decision FROM partner_alert_stripe_review_decisions").all())
        .toEqual(order === "adjustment during settlement" ? [decision, decision] : [decision]);
      expect(db.prepare("SELECT count(*) FROM partner_alert_stripe_role_reconciliations").pluck().get()).toBe(retained ? 2 : 0);
      const funding = db.transaction(() => readPartnerAlertStripeChannelFunding(db, { environment: "sandbox", userId: "buyer",
        communityId: "community", mappingId: "included", atMs: now })).immediate();
      expect(funding.paidOffers).toHaveLength(retained ? 1 : 0);
      expect(funding.holdRemoval).toBe(!retained);
      await expect((await first()).json()).resolves.toEqual({ applied: false });
      expect(db.pragma("foreign_key_check")).toEqual([]);
      return;
    }
    if (order === "cancellation first" || order === "canceled at invoice read") {
      canceled = true;
      const terminal = () => handle(adjustment("evt_end", "customer.subscription.deleted", "sub_buyer"));
      if (order === "cancellation first") {
        checkoutCustomer = "cus_foreign";
        expect((await terminal()).status).toBe(503);
        expect(db.prepare("SELECT stripe_subscription_id FROM partner_alert_stripe_checkout_claims").pluck().get()).toBeNull();
        checkoutCustomer = "cus_buyer";
        expect((await terminal()).status).toBe(200);
        expect(db.prepare("SELECT checkout_close_reason FROM partner_alert_stripe_checkout_claims").pluck().get()).toBe("subscription_ended");
      }
      const late = await handle(signed());
      expect(late.status).toBe(200);
      await expect(late.json()).resolves.toEqual({ applied: true });
      expect(db.prepare("SELECT count(*) FROM partner_alert_stripe_paid_terms").pluck().get()).toBe(1);
      expect(db.prepare("SELECT count(*) FROM partner_alert_stripe_role_reconciliations").pluck().get()).toBe(0);
      expect(db.prepare(`SELECT stripe_subscription_id,stripe_customer_id,checkout_close_reason
        FROM partner_alert_stripe_checkout_claims`).get()).toEqual({ stripe_subscription_id: "sub_buyer",
        stripe_customer_id: "cus_buyer", checkout_close_reason: "subscription_ended" });
      for (const mappingId of ["included", "included_two"]) {
        expect(db.transaction(() => readPartnerAlertStripeChannelFunding(db, { environment: "sandbox", userId: "buyer",
          communityId: "community", mappingId, atMs: now })).immediate()).toMatchObject({ paidOffers: [], holdRemoval: false });
      }
      expect((await terminal()).status).toBe(200);
      await expect((await handle(signed())).json()).resolves.toEqual({ applied: false });
      expect(db.pragma("foreign_key_check")).toEqual([]);
      return;
    }
    price = "price_wrong";
    expect((await handle(signed())).status).toBe(503);
    price = "price_approved";
    amount = 2000;
    expect((await handle(signed())).status).toBe(503);
    expect(db.prepare("SELECT count(*) FROM partner_alert_stripe_events").pluck().get()).toBe(0);
    expect(db.prepare("SELECT stripe_subscription_id FROM partner_alert_stripe_checkout_claims").pluck().get()).toBeNull();

    amount = 2500;
    const applied = await handle(signed());
    expect(applied.status).toBe(200);
    expect(await applied.json()).toEqual({ applied: true });
    expect(db.prepare("SELECT stripe_subscription_id,stripe_customer_id FROM partner_alert_stripe_checkout_claims").get())
      .toEqual({ stripe_subscription_id: "sub_buyer", stripe_customer_id: "cus_buyer" });
    expect(db.prepare(`SELECT invoice_id,invoice_payment_id,payment_intent_id,starts_at_ms,ends_at_ms,amount_minor
      FROM partner_alert_stripe_paid_terms`).get()).toEqual({ invoice_id: "in_invoice", invoice_payment_id: "inpay_proof",
      payment_intent_id: "pi_proof", starts_at_ms: now, ends_at_ms: now + 86_400_000, amount_minor: 2500 });
    expect(db.prepare("SELECT mapping_id FROM partner_alert_stripe_role_reconciliations ORDER BY mapping_id").pluck().all())
      .toEqual(["included", "included_two"]);

    if (order === "canceled before renewal") {
      const at = new Date(now).toISOString();
      db.exec("UPDATE partner_alert_stripe_role_reconciliations SET status='applied'");
      const rememberRole = db.prepare("INSERT INTO partner_alert_role_jobs VALUES('community',?,'buyer',1,'owned',?,?)");
      for (const mappingId of ["included", "included_two"]) {
        rememberRole.run(mappingId, new Date(now + 60_000).toISOString(),
          JSON.stringify({ context: { observedAtUtc: new Date(now - 1_000).toISOString() } }));
      }
      expect(readPartnerAlertStripeRolePage(db, "sandbox", null, at)).toEqual([]);
      canceled = true;
      const renewal = await handle(adjustment("evt_renewal", "invoice.paid", "in_renewal"));
      expect(renewal.status).toBe(200);
      await expect(renewal.json()).resolves.toEqual({ applied: true });
      expect(db.prepare("SELECT count(*) FROM partner_alert_stripe_paid_terms").pluck().get()).toBe(2);
      expect(db.prepare("SELECT count(*) FROM partner_alert_stripe_role_reconciliations").pluck().get()).toBe(2);
      expect(readPartnerAlertStripeRolePage(db, "sandbox", null, at).map(intent => intent.scope.mappingId).sort())
        .toEqual(["included", "included_two"]);
      return;
    }

    const replay = await handle(signed());
    expect(await replay.json()).toEqual({ applied: false });
    expect((await handle(signed({ created: now / 1000 }))).status).toBe(409);
    const redelivery = await handle(signed({ id: "evt_same_invoice" }));
    expect(await redelivery.json()).toEqual({ applied: false });
    expect(writes).toBe(3);

    const funding = (mappingId: string, atMs = now) => db.transaction(() =>
      readPartnerAlertStripeChannelFunding(db, { environment: "sandbox", userId: "buyer",
        communityId: "community", mappingId, atMs })).immediate();
    const paidThrough = (mappingId: string, atMs = now) => funding(mappingId, atMs).paidOffers
      .reduce<number | null>((latest, offer) => Math.max(latest ?? 0, Date.parse(offer.paidThroughUtc)), null);
    expect(paidThrough("included")).toBe(now + 86_400_000);
    expect(paidThrough("included_two", now + 86_400_000)).toBeNull();
    expect(paidThrough("other_role")).toBeNull();
    if (order === "delayed dispute opening" || order === "late dispute win") {
      const notify = (id: string, type: string, dispute = "du_paid") => handle(adjustment(id, type, dispute));
      const readStatus = (id: string) => db.prepare(`SELECT e.status,r.disposition,r.decision,r.affected_paid_invoice_id
        FROM partner_alert_stripe_events e JOIN partner_alert_stripe_review_decisions r USING(environment,stripe_account_id,event_id,claim_id)
        WHERE e.event_id=?`).get(id);
      const remove = (eventId: string) => db.transaction(() => recordPartnerAlertStripeAdjustmentReview(db, {
        environment: "sandbox", accountId: account, eventId, decision: "remove", reviewerUserId: "owner", atMs: now,
      })).immediate();
      expect((await notify("evt_nonterminal_update", "charge.dispute.updated")).status).toBe(204);
      if (order === "late dispute win") {
        expect((await notify("evt_open", "charge.dispute.created")).status).toBe(200);
        expect(readStatus("evt_open")).toMatchObject({ status: "review", disposition: "review" });
        expect(paidThrough("included")).toBe(now + 86_400_000);
      }
      disputeStatus = "lost";
      const lossType = order === "delayed dispute opening" ? "charge.dispute.created" : "charge.dispute.closed";
      expect((await notify("evt_loss", lossType)).status).toBe(200);
      expect(readStatus("evt_loss")).toMatchObject({ status: "review", disposition: "remove_candidate", affected_paid_invoice_id: "in_invoice" });
      expect(funding("included_two")).toMatchObject({ holdRemoval: true, paidOffers: [] });
      expect((await notify("evt_same_loss", "charge.dispute.closed")).status).toBe(200);
      expect(readStatus("evt_same_loss")).toMatchObject({ status: "applied", disposition: "remove_candidate" });
      if (order === "delayed dispute opening") return;

      expect(readStatus("evt_open")).toMatchObject({ status: "ignored" });
      expect(remove("evt_loss")).toBe(true);
      beforeDisputeRead = async () => {
        beforeDisputeRead = undefined;
        disputeStatus = "won";
        expect((await notify("evt_win", "charge.dispute.funds_reinstated")).status).toBe(200);
      };
      expect((await notify("evt_stale_loss", "charge.dispute.updated")).status).toBe(503);
      expect(readStatus("evt_stale_loss")).toBeUndefined();
      expect(readStatus("evt_loss")).toMatchObject({ status: "ignored", decision: "remove" });
      expect(readStatus("evt_same_loss")).toMatchObject({ status: "ignored" });
      expect(() => remove("evt_loss")).toThrow("cannot authorize");
      expect(paidThrough("included_two")).toBe(now + 86_400_000);
      expect(db.prepare(`SELECT mapping_id,desired_present FROM partner_alert_stripe_role_reconciliations
        WHERE event_id='evt_win' ORDER BY mapping_id`).all()).toEqual([
        { mapping_id: "included", desired_present: 1 }, { mapping_id: "included_two", desired_present: 1 },
      ]);
      expect((await notify("evt_independent_loss", "charge.dispute.closed", "du_other")).status).toBe(200);
      expect((await notify("evt_stale_loss", "charge.dispute.updated")).status).toBe(200);
      expect(readStatus("evt_stale_loss")).toMatchObject({ status: "applied", disposition: "retain" });
      expect(readStatus("evt_independent_loss")).toMatchObject({ status: "review", disposition: "remove_candidate" });
      expect(funding("included_two")).toMatchObject({ holdRemoval: true, paidOffers: [] });
      expect(db.pragma("foreign_key_check")).toEqual([]);
      return;
    }
    if (order === "asynchronous refunds") {
      const refund = (id: string, status: string, amount: number) => ({
        id, status, amount, charge: "ch_paid", payment_intent: "pi_proof", currency: "usd",
      });
      const notify = (id: string, type: string) => handle(signed({ id, type,
        data: { object: { id: "re_second", object: "refund", charge: "ch_paid" } } }));
      const readStatus = (id: string) => db.prepare(`SELECT e.status,r.disposition,r.decision,r.affected_paid_invoice_id
        FROM partner_alert_stripe_events e JOIN partner_alert_stripe_review_decisions r USING(environment,stripe_account_id,event_id,claim_id)
        WHERE e.event_id=?`).get(id);
      const readReviewCount = () => db.prepare("SELECT count(*) FROM partner_alert_stripe_events WHERE status='review'").pluck().get();
      refunded = 2500;
      refunds = [refund("re_second", "pending", 2500)];
      expect((await notify("evt_created", "refund.created")).status).toBe(200);
      expect(readStatus("evt_created")).toMatchObject({ status: "applied", disposition: "retain" });
      expect(funding("included")).toMatchObject({ holdRemoval: false, paidOffers: [{ offerId: "package" }] });
      expect(readReviewCount()).toBe(0);

      refunds = [refund("re_first", "succeeded", 1000), refund("re_second", "succeeded", 1500)];
      expect((await notify("evt_succeeded", "refund.updated")).status).toBe(200);
      expect(readStatus("evt_succeeded")).toMatchObject({ status: "review", disposition: "remove_candidate", affected_paid_invoice_id: "in_invoice" });
      expect((await handle(adjustment("evt_charge", "charge.refunded", "ch_paid"))).status).toBe(200);
      expect(readReviewCount()).toBe(1);
      expect(funding("included_two")).toMatchObject({ holdRemoval: true, paidOffers: [] });
      const remove = () => db.transaction(() => recordPartnerAlertStripeAdjustmentReview(db, { environment: "sandbox",
        accountId: account, eventId: "evt_succeeded", decision: "remove", reviewerUserId: "owner", atMs: now })).immediate();
      expect(remove()).toBe(true);

      beforeRefundRead = async () => {
        beforeRefundRead = undefined;
        refunds = [refund("re_first", "succeeded", 1000), refund("re_second", "failed", 1500)];
        expect((await notify("evt_failed_refund", "refund.failed")).status).toBe(200);
      };
      expect((await notify("evt_stale", "refund.updated")).status).toBe(503);
      expect(readStatus("evt_stale")).toBeUndefined();
      expect(readStatus("evt_succeeded")).toMatchObject({ status: "ignored", decision: "remove" });
      expect(readStatus("evt_charge")).toMatchObject({ status: "ignored" });
      expect(() => remove()).toThrow("cannot authorize");
      expect(paidThrough("included_two")).toBe(now + 86_400_000);
      expect(funding("included_two").holdRemoval).toBe(false);
      expect(db.prepare(`SELECT mapping_id,desired_present FROM partner_alert_stripe_role_reconciliations
        WHERE event_id='evt_failed_refund' ORDER BY mapping_id`).all()).toEqual([
        { mapping_id: "included", desired_present: 1 }, { mapping_id: "included_two", desired_present: 1 },
      ]);
      await expect((await notify("evt_failed_refund", "refund.failed")).json()).resolves.toEqual({ applied: false });
      expect((await notify("evt_stale", "refund.updated")).status).toBe(200);
      expect(readStatus("evt_stale")).toMatchObject({ disposition: "review" });
      refunds = [{ ...refund("re_other", "succeeded", 2500), charge: "ch_other" }];
      expect((await notify("evt_wrong_charge", "refund.updated")).status).toBe(503);
      expect(paidThrough("included_two")).toBe(now + 86_400_000);
      disputeStatus = "lost";
      expect((await handle(adjustment("evt_independent_loss", "charge.dispute.closed", "du_paid"))).status).toBe(200);
      refunds = [refund("re_first", "succeeded", 1000), refund("re_second", "failed", 1500)];
      expect((await notify("evt_failed_update", "refund.updated")).status).toBe(200);
      expect(funding("included_two")).toMatchObject({ holdRemoval: true, paidOffers: [] });
      expect(readStatus("evt_independent_loss")).toMatchObject({ status: "review" });
      expect(db.pragma("foreign_key_check")).toEqual([]);
      return;
    }
    db.exec(`
      INSERT INTO partner_alert_offers VALUES('community','channel',1,'approved',
        '{"amountMinor":1200,"currency":{"code":"USD"},"whop":{"environment":"live","accountId":"biz_fixture","productId":"prod_fixture","planId":"plan_channel"}}',
        'live','biz_fixture','prod_fixture','plan_channel');
      INSERT INTO partner_alert_offer_channels VALUES('community','channel',1,'included');
      INSERT INTO partner_alert_stripe_prices VALUES('seller','community','sandbox','acct_seller','channel',1,'price_channel','usd',1200,1,NULL);
      INSERT INTO partner_alert_stripe_checkout_claims
        (claim_id,buyer_user_id,seller_id,community_id,environment,stripe_account_id,offer_id,offer_version,stripe_price_id,
          stripe_session_id,stripe_customer_id,stripe_subscription_id,created_at_ms) VALUES(
        'separate','buyer','seller','community','sandbox','acct_seller','channel',1,'price_channel','cs_test_other','cus_other','sub_other',1);
    `);
    db.prepare(`INSERT INTO partner_alert_stripe_events VALUES(
      'sandbox','acct_seller','evt_separate','seller','community','separate','invoice.paid','in_separate',?,?,'applied')`)
      .run("b".repeat(64), now);
    db.prepare(`INSERT INTO partner_alert_stripe_paid_terms VALUES(
      'sandbox','acct_seller','separate','in_separate','inpay_separate','pi_separate','evt_separate',?,?,1200,'usd')`)
      .run(now, now + 172_800_000);

    const event = async (id: string, type: string, objectId: string, disposition: string) => {
      const result = await handle(adjustment(id, type, objectId));
      expect(result.status).toBe(200);
      expect(await result.json()).toEqual({ applied: true });
      expect(db.prepare("SELECT disposition FROM partner_alert_stripe_review_decisions WHERE event_id=?").pluck().get(id))
        .toBe(disposition);
    };
    await event("evt_failed", "invoice.payment_failed", "in_failed", "review");
    await event("evt_partial", "charge.refunded", "ch_paid", "review");
    expect(paidThrough("included_two")).toBe(now + 86_400_000);
    await event("evt_open_dispute", "charge.dispute.created", "du_paid", "review");
    disputeStatus = "won";
    await event("evt_won_dispute", "charge.dispute.closed", "du_paid", "retain");
    disputeStatus = "lost";
    await event("evt_lost_dispute", "charge.dispute.closed", "du_paid", "remove_candidate");
    expect(paidThrough("included_two")).toBeNull();
    expect(funding("included_two").holdRemoval).toBe(true);
    expect(funding("included_two", now + 86_400_000).holdRemoval).toBe(false);
    expect(paidThrough("included")).toBe(now + 172_800_000);
    refunded = 2500;
    await event("evt_full_refund", "charge.refunded", "ch_paid", "remove_candidate");
    expect((await handle(adjustment("evt_end", "customer.subscription.deleted", "sub_buyer"))).status).toBe(503);
    canceled = true;
    await event("evt_end", "customer.subscription.deleted", "sub_buyer", "remove_candidate");
    expect(db.prepare("SELECT status FROM partner_alert_stripe_events WHERE event_id='evt_end'").pluck().get()).toBe("applied");
    expect(funding("included_two").holdRemoval).toBe(false);
    expect(paidThrough("included")).toBe(now + 172_800_000);
    expect(db.prepare("SELECT affected_paid_invoice_id FROM partner_alert_stripe_review_decisions WHERE event_id='evt_full_refund'")
      .pluck().get()).toBe("in_invoice");
    expect(db.prepare("SELECT count(*) FROM partner_alert_stripe_role_reconciliations WHERE desired_present=0").pluck().get()).toBe(0);
    const operatorDecision = (eventId: string, decision: "keep" | "remove") => db.transaction(() =>
      recordPartnerAlertStripeAdjustmentReview(db, { environment: "sandbox", accountId: account, eventId,
        decision, reviewerUserId: "owner", atMs: now })).immediate();
    expect(() => operatorDecision("evt_partial", "remove")).toThrow("cannot authorize");
    expect(() => operatorDecision("evt_end", "remove")).toThrow("cannot authorize");
    expect(operatorDecision("evt_full_refund", "remove")).toBe(true);
    expect(operatorDecision("evt_full_refund", "remove")).toBe(false);
    expect(db.prepare(`SELECT mapping_id FROM partner_alert_stripe_role_reconciliations
      WHERE desired_present=0 ORDER BY mapping_id`).pluck().all()).toEqual(["included", "included_two"]);
    expect(db.prepare("SELECT count(*) FROM partner_alert_stripe_role_reconciliations").pluck().get()).toBe(4);
    const disconnected = (clientId: string) => signed({ id: "evt_disconnect", type: "account.application.deauthorized",
      data: { object: { object: "application", id: clientId } } });
    expect((await handle(disconnected("ca_unrelated"))).status).toBe(204);
    expect(db.prepare("SELECT status FROM partner_alert_partners").pluck().get()).toBe("active");
    beforeRenewalCommit = async () => {
      expect(await (await handle(disconnected("ca_fixture"))).json()).toEqual({ applied: true });
    };
    const renewal = () => adjustment("evt_renewal", "invoice.paid", "in_renewal");
    expect(await (await handle(renewal())).json()).toEqual({ applied: false });
    beforeRenewalCommit = undefined;
    expect(await (await handle(disconnected("ca_fixture"))).json()).toEqual({ applied: false });
    expect(db.prepare("SELECT state FROM partner_alert_stripe_sellers").pluck().get()).toBe("disconnected");
    expect(db.prepare("SELECT status,revision,updated_at_utc FROM partner_alert_partners").get()).toEqual({
      status: "publishing_paused", revision: 2, updated_at_utc: new Date(now).toISOString(),
    });
    expect((await handle(renewal())).status).toBe(204);
    expect(db.prepare("SELECT event_id FROM partner_alert_stripe_events WHERE event_id='evt_renewal'").get()).toBeUndefined();
    expect(paidThrough("included")).toBe(now + 172_800_000);
    expect(paidThrough("included", now + 172_800_000)).toBeNull();
    expect(db.prepare("SELECT count(*) FROM partner_alert_stripe_paid_terms").pluck().get()).toBe(2);
    expect(db.pragma("foreign_key_check")).toEqual([]);
  } finally { db.close(); }
});

it.each(["sandbox", "live"] as const)("accepts a signed account update in %s mode", async environment => {
  const db = new Database(":memory:");
  const accountId = "acct_seller";
  const now = 1_790_000_000_000;
  const secret = "whsec_partner_seller_update_test";
  const livemode = environment === "live";
  try {
    db.pragma("foreign_keys=ON");
    db.exec(`CREATE TABLE traderlink_communities(community_id TEXT PRIMARY KEY,owner_user_id TEXT,status TEXT);
      INSERT INTO traderlink_communities VALUES('community','owner','active');
      CREATE TABLE partner_alert_stripe_sellers(seller_id TEXT,community_id TEXT,owner_user_id TEXT,environment TEXT,
        stripe_account_id TEXT,state TEXT,updated_at_ms INTEGER);
      CREATE TABLE partner_alert_stripe_events(environment TEXT,stripe_account_id TEXT,event_id TEXT,
        body_sha256 TEXT,kind TEXT,resource_id TEXT,status TEXT);`);
    db.prepare(`INSERT INTO partner_alert_stripe_sellers VALUES('seller','community','owner',?,?,'onboarding',1)`)
      .run(environment, accountId);
    const handle = createPartnerAlertStripeInvoiceWebhook({ database: db, environment, signingSecret: secret, nowMs: () => now,
      stripeForAccount: () => { throw new Error("Account update should only read the seller."); },
      runInWriter: () => { throw new Error("Account update should only enter the seller writer."); },
      runSellerInWriter: (owner, write) => {
        expect(owner).toBe("owner");
        return db.transaction(write).immediate();
      },
      readSeller: async receivedId => ({ id: receivedId, livemode, dashboard: "full",
        defaults: { responsibilities: { fees_collector: "stripe", losses_collector: "stripe", requirements_collector: "stripe" } },
        configuration: { merchant: { capabilities: { card_payments: { status: "active" },
          stripe_balance: { payouts: { status: "active" } } } } } }),
    });
    const raw = JSON.stringify({ object: "event", id: "evt_seller_update", livemode, account: accountId,
      type: "account.updated", data: { object: { object: "account", id: accountId } } });
    const seconds = now / 1000;
    const signature = createHmac("sha256", secret).update(`${seconds}.${raw}`).digest("hex");
    const response = await handle(new Request("http://127.0.0.1/stripe", { method: "POST", body: raw,
      headers: { "content-type": "application/json", "stripe-signature": `t=${seconds},v1=${signature}` } }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ applied: true });
    expect(db.prepare("SELECT state FROM partner_alert_stripe_sellers").pluck().get()).toBe("ready");
  } finally { db.close(); }
});
