// @vitest-environment node
import Database from "better-sqlite3";
import { createHash, generateKeyPairSync, sign, verify } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { captureRestoreInventoryFromOriginal, verifyAttestedAbsentRestoreClosure } from
  "../../../platform/server/privacy/platform-erasure-restore-evidence";
import { expect, it, vi } from "vitest";
import { erasePartnerAlertStripeUser, expirePartnerAlertStripeUnboundEvents } from "./partner-alert-stripe-connect-lifecycle";
import { qualifiedPaidInput } from "../../contracts/partner-alert-access-policy.test-fixture";
import { createPartnerAlertStripeDiscordTestGuild } from "../partner-alert-stripe-discord-test-guild";
import { createPartnerAlertStripeErasureDiscordObserver, encodePartnerAlertStripeErasureRoleProof, issuePartnerAlertStripeErasureRoleProof, readPartnerAlertStripeErasureRoleFacts,
  type StripeErasureRoleProofScope } from "../partner-alert-stripe-erasure-role-proof";
import { encodePartnerAlertStripeErasureSettlementArchive, openPartnerAlertStripeErasureSettlementArchive,
  readSettledPartnerAlertStripeErasureRole, readSettledPartnerAlertStripeErasureRoleCoverage, recordPartnerAlertStripeErasureSettlements,
} from "../partner-alert-stripe-erasure-settlement";
import { createPartnerAlertNativeStripePriceBinding } from "../partner-alert-stripe-native-price";
import { platformPaidStripeCheckoutReviewedVersionMigration } from "../../../platform/server/database/migrations/0212_platform_paid_stripe_checkout_reviewed_version";
import { createPartnerAlertNativeStripeCheckout } from "../partner-alert-stripe-native-checkout";
import { recordPartnerAlertStripeSeller } from "./partner-alert-stripe-seller-writer";
import { encodePartnerAlertStripeErasureTransportArchive, openPartnerAlertStripeErasureTransportArchive,
  readPartnerAlertStripeErasureTransport, settlePartnerAlertStripeErasureTransport } from "../partner-alert-stripe-erasure-transport";
import { createPartnerAlertDiscordRoleRest } from "../partner-alert-discord-role-rest";
import { createPartnerAlertManagedRoleTransport } from "../partner-alert-managed-role-transport";
import { createPartnerAlertErasedBuyerCoverage } from "../partner-alert-stripe-erasure-runtime";
import { platformPaidStripeConnectBillingMigration as migration } from
  "../../../platform/server/database/migrations/0209_platform_paid_stripe_connect_billing";

vi.mock("server-only", () => ({}));

it("binds Stripe evidence and role review to the exact owner, seller, and approved offer", async () => {
  const db = new Database(":memory:");
  try {
    db.pragma("foreign_keys=ON");
    db.exec(`
      CREATE TABLE platform_users(user_id TEXT PRIMARY KEY);
      CREATE TABLE platform_auth_identities(user_id TEXT,auth_provider TEXT,auth_subject TEXT,status TEXT);
      CREATE TABLE traderlink_communities(community_id TEXT PRIMARY KEY,owner_user_id TEXT,status TEXT);
      CREATE TABLE partner_alert_partners(community_id TEXT PRIMARY KEY,owner_user_id TEXT,status TEXT);
      CREATE TABLE partner_alert_offers(community_id TEXT,offer_id TEXT,version INTEGER,review_state TEXT,offer_json TEXT,
        whop_environment TEXT DEFAULT 'live',whop_account_id TEXT DEFAULT 'biz_test',
        whop_product_id TEXT DEFAULT 'prod_test',whop_plan_id TEXT DEFAULT 'plan_test',
        PRIMARY KEY(community_id,offer_id,version));
      CREATE TABLE partner_alert_mappings(community_id TEXT,mapping_id TEXT,destination_guild_id TEXT,
        destination_role_id TEXT,destination_channel_id TEXT,revision INTEGER,approved_revision INTEGER,review_state TEXT,delivery_state TEXT,
        PRIMARY KEY(community_id,mapping_id));
      CREATE TABLE partner_alert_whop_connections(community_id TEXT,environment TEXT,whop_account_id TEXT,status TEXT,
        verified_at_utc TEXT,valid_until_utc TEXT);
      CREATE TABLE partner_alert_whop_identities(user_id TEXT,environment TEXT,status TEXT,verified_at_utc TEXT);
      CREATE TABLE partner_alert_whop_discovery(community_id TEXT,user_id TEXT,offer_id TEXT,offer_version INTEGER,environment TEXT,whop_account_id TEXT);
      CREATE TABLE partner_alert_whop_paid_intervals(community_id TEXT,user_id TEXT,offer_id TEXT,offer_version INTEGER,environment TEXT,
        whop_account_id TEXT,membership_id TEXT,starts_at_utc TEXT,ends_at_utc TEXT);
      CREATE TABLE partner_alert_memberships(community_id TEXT,user_id TEXT,offer_id TEXT,offer_version INTEGER,environment TEXT,
        whop_account_id TEXT,membership_id TEXT,state TEXT,basis TEXT,starts_at_utc TEXT,observed_at_utc TEXT,valid_until_utc TEXT);
      CREATE TABLE partner_alert_offer_channels(community_id TEXT,offer_id TEXT,offer_version INTEGER,mapping_id TEXT);
      INSERT INTO platform_users VALUES('owner'),('other'),('buyer'),('reviewer'),('survivor');
      CREATE TABLE platform_erasure_module_operations(operation_ref TEXT PRIMARY KEY,workspace_id TEXT,
        lifecycle_ref TEXT,phase TEXT,profile_ref TEXT,profile_generation INTEGER,quiescence_ref TEXT,valid_until_utc TEXT);
      CREATE TABLE platform_erasure_lifecycles(lifecycle_ref TEXT PRIMARY KEY,operation_ref TEXT,generation INTEGER,
        user_id TEXT,erasure_generation INTEGER,phase TEXT,profile_ref TEXT,profile_generation INTEGER,valid_until_utc TEXT);
      CREATE TABLE platform_erasure_operation_claims(operation_ref TEXT,participant TEXT,claim_ref TEXT,original_json TEXT,
        original_sha256 TEXT,state TEXT,outcome_ref TEXT,PRIMARY KEY(operation_ref,participant,claim_ref));
      CREATE TABLE partner_alert_role_jobs(community_id TEXT,user_id TEXT,mapping_id TEXT,discord_user_id TEXT,
        lease_token TEXT,status TEXT,in_flight_intent_json TEXT);
      CREATE TABLE partner_alert_whop_fixture(user_id TEXT PRIMARY KEY, evidence TEXT NOT NULL);
      INSERT INTO partner_alert_whop_fixture VALUES('survivor','verified');
      INSERT INTO traderlink_communities VALUES('first','owner','active'),('second','other','active');
      INSERT INTO partner_alert_partners VALUES('first','owner','active'),('second','other','active');
      INSERT INTO partner_alert_offers(community_id,offer_id,version,review_state,offer_json) VALUES
        ('first','offer',1,'approved','{"amountMinor":2500,"currency":{"code":"USD"}}'),
        ('second','offer2',1,'approved','{"amountMinor":2500,"currency":{"code":"USD"}}');
      INSERT INTO partner_alert_mappings VALUES
        ('first','included','110','120','130',1,1,'approved','ready'),
        ('first','unrelated','110','121','131',1,1,'approved','ready');
      INSERT INTO partner_alert_offer_channels VALUES('first','offer',1,'included');
    `);
    db.transaction(() => migration.statements.forEach(statement => db.exec(statement)))();
    const write = (sql: string, ...args: unknown[]) => db.prepare(sql).run(...args);
    const seller = "INSERT INTO partner_alert_stripe_sellers VALUES(?,?,?,'sandbox',?,'ready',1,1,NULL)";
    expect(() => write(seller, "bad", "first", "other", "acct_bad")).toThrow("partner_stripe_owner_mismatch");
    write(seller, "first_seller", "first", "owner", "acct_first");
    write(seller, "second_seller", "second", "other", "acct_second");
    write("INSERT INTO traderlink_communities VALUES('fresh','owner','active')");
    const verifySeller = (state: "onboarding" | "ready", atMs: number, accountId = "acct_fresh", ownerUserId = "owner") =>
      db.transaction(() => recordPartnerAlertStripeSeller(db, { communityId: "fresh", ownerUserId,
        environment: "sandbox", state, accountId, atMs })).immediate();
    const sellerId = verifySeller("onboarding", 1);
    expect(verifySeller("ready", 2)).toBe(sellerId);
    expect(() => verifySeller("onboarding", 1)).toThrow("observation is stale");
    expect(() => verifySeller("ready", 3, "acct_different")).toThrow("ownership changed");
    expect(() => verifySeller("ready", 3, "acct_fresh", "other")).toThrow("ownership changed");
    expect(db.prepare("SELECT state,stripe_account_id FROM partner_alert_stripe_sellers WHERE seller_id=?").get(sellerId))
      .toEqual({ state: "ready", stripe_account_id: "acct_fresh" });

    const price = "INSERT INTO partner_alert_stripe_prices VALUES(?,?,'sandbox',?,?,1,?,'usd',?,1,NULL)";
    expect(() => write(price, "first_seller", "second", "acct_first", "offer2", "price_foreign", 2500)).toThrow("FOREIGN KEY");
    expect(() => write(price, "first_seller", "first", "acct_first", "offer", "price_wrong", 500)).toThrow("partner_stripe_offer_unapproved");
    write(price, "first_seller", "first", "acct_first", "offer", "price_exact", 2500);
    const claim = `INSERT INTO partner_alert_stripe_checkout_claims
      (claim_id,buyer_user_id,seller_id,community_id,environment,stripe_account_id,offer_id,offer_version,stripe_price_id,
        stripe_session_id,stripe_customer_id,stripe_subscription_id,created_at_ms)
      VALUES(?, 'buyer','first_seller','first','sandbox',?,'offer',1,'price_exact','cs_test_exact','cus_exact','sub_exact',1)`;
    expect(() => write(claim, "foreign_claim", "acct_second")).toThrow("FOREIGN KEY");
    write(claim, "exact", "acct_first");
    const event = "INSERT INTO partner_alert_stripe_events VALUES('sandbox',?,? ,? ,? ,? ,? ,? ,?,1,'applied')";
    const digest = "a".repeat(64);
    expect(() => write(event, "acct_second", "evt_foreign", "second_seller", "second", "exact", "invoice.paid", "in_foreign", digest)).toThrow("FOREIGN KEY");
    write(event, "acct_first", "evt_paid", "first_seller", "first", "exact", "invoice.paid", "in_paid", digest);
    expect(() => write(event, "acct_first", "evt_paid", "first_seller", "first", "exact", "invoice.paid", "in_paid", digest)).toThrow("UNIQUE");
    const term = "INSERT INTO partner_alert_stripe_paid_terms VALUES('sandbox','acct_first','exact',?,'inpay_paid','pi_paid','evt_paid',1,20,2500,'usd')";
    expect(() => write(term, "in_wrong")).toThrow("partner_stripe_term_evidence_mismatch");
    write(term, "in_paid");
    write(event, "acct_first", "evt_refund", "first_seller", "first", "exact", "charge.refunded", "ch_paid", digest);
    const role = "INSERT INTO partner_alert_stripe_role_reconciliations VALUES('role_op','sandbox','acct_first','evt_refund','exact','first','buyer',?,0,'pending',4)";
    expect(() => write(role, "included")).toThrow("partner_stripe_role_review_or_mapping_required");
    write("INSERT INTO partner_alert_stripe_review_decisions VALUES('sandbox','acct_first','evt_refund','exact','in_paid','remove_candidate','remove','reviewer',3,NULL)");
    expect(() => write(role, "unrelated")).toThrow("partner_stripe_role_review_or_mapping_required");
    write(role, "included");
    expect(() => write("UPDATE partner_alert_stripe_role_reconciliations SET mapping_id='unrelated'"))
      .toThrow("partner_stripe_role_scope_immutable");
    expect(() => write("UPDATE partner_alert_stripe_review_decisions SET decision='keep'"))
      .toThrow("partner_stripe_review_scope_immutable");
    expect(db.pragma("foreign_key_check")).toEqual([]);

    const offer = qualifiedPaidInput().offers[0]!.offer;
    write("INSERT INTO traderlink_communities VALUES(?,'owner','active')", offer.communityId);
    write("INSERT INTO partner_alert_partners VALUES(?,'owner','active')", offer.communityId);
    write(`INSERT INTO partner_alert_offers(community_id,offer_id,version,review_state,offer_json,
      whop_environment,whop_account_id,whop_product_id,whop_plan_id) VALUES(?,?,1,'approved',?,?,?,?,?)`,
    offer.communityId, offer.offerId, JSON.stringify(offer), offer.whop.environment,
    offer.whop.accountId, offer.whop.productId, offer.whop.planId);
    write(seller, "native", offer.communityId, "owner", "acct_native");
    write(price, "native", offer.communityId, "acct_native", offer.offerId, "price_native", offer.amountMinor);
    let authorized = true;
    let revokeWhileReading = false;
    let wrongPrice = true;
    const binding: Parameters<typeof createPartnerAlertNativeStripePriceBinding>[0] = {
      database: db, nowMs: () => 10,
      runInWriter: (_scope, operation) => db.transaction(operation).immediate(),
      assertBuyer: scope => {
        expect(db.inTransaction).toBe(true);
        if (scope.userId !== "buyer" || !authorized) throw new Error("Buyer authorization required.");
      },
      async verifySeller(account) {
        expect(db.inTransaction).toBe(false);
        expect(account).toBe("acct_native");
        return { id: account, livemode: false, dashboard: "full",
          defaults: { responsibilities: { fees_collector: "stripe", losses_collector: "stripe", requirements_collector: "stripe" } },
          configuration: { merchant: { capabilities: { card_payments: { status: "active" },
            stripe_balance: { payouts: { status: "active" } } } } } };
      },
      async verifyPrice(account, id) {
        expect(account).toBe("acct_native");
        if (revokeWhileReading) authorized = false;
        return { id, livemode: false, active: true, currency: "usd", unit_amount: wrongPrice ? 1 : offer.amountMinor,
          recurring: { interval: "day", interval_count: offer.cadence.count } };
      },
    };
    const { reserve: bind } = createPartnerAlertNativeStripePriceBinding(binding);
    const scope = { userId: "buyer", communityId: offer.communityId, offerId: offer.offerId, version: 1 };
    await expect(bind(scope)).rejects.toThrow("Stripe price verification failed.");
    wrongPrice = false;
    revokeWhileReading = true;
    await expect(bind(scope)).rejects.toThrow("Buyer authorization required.");
    expect(db.prepare("SELECT count(*) FROM partner_alert_stripe_checkout_claims WHERE seller_id='native'").pluck().get()).toBe(0);
    revokeWhileReading = false;
    authorized = true;
    const bound = await bind(scope);
    expect(bound).toMatchObject({ sellerAccount: "acct_native", priceId: "price_native" });
    expect((await bind(scope)).claimId).toBe(bound.claimId);
    const stripeCalls: string[] = [];
    const nativeCheckout = createPartnerAlertNativeStripeCheckout({
      ...binding, origin: "http://127.0.0.1:3039", authorizeCheckout: async () => scope,
      stripeForAccount: accountId => async (path, fields, idempotencyKey) => {
        expect(db.inTransaction).toBe(false);
        expect(accountId).toBe("acct_native");
        stripeCalls.push(path);
        if (fields) {
          expect(idempotencyKey).toBe(`partner-checkout-${bound.claimId}`);
          expect(fields).toEqual({
            mode: "subscription", "line_items[0][price]": "price_native", "line_items[0][quantity]": "1",
            client_reference_id: bound.claimId, "metadata[partner_checkout_claim]": bound.claimId,
            "subscription_data[metadata][partner_checkout_claim]": bound.claimId,
            success_url: "http://127.0.0.1:3039/partner-channels", cancel_url: "http://127.0.0.1:3039/partner-channels",
          });
        }
        return { id: "cs_test_native", url: "https://checkout.stripe.com/c/pay/cs_test_native", livemode: false,
          client_reference_id: bound.claimId, mode: "subscription", status: "open" };
      },
    });
    const nativeRequest = (site: string) => new Request("http://127.0.0.1:3039/checkout", { method: "POST",
      headers: { "sec-fetch-site": site, "x-traderlink-platform-mutation": "1",
        origin: "http://127.0.0.1:3039", host: "127.0.0.1:3039" } });
    const checkoutKey = `${offer.offerId}:1`;
    expect((await nativeCheckout(nativeRequest("cross-site"), offer.communityId, checkoutKey)).status).toBe(403);
    expect(stripeCalls).toEqual([]);
    const firstCheckout = await nativeCheckout(nativeRequest("same-origin"), offer.communityId, checkoutKey);
    expect(await firstCheckout.json()).toEqual({ url: "https://checkout.stripe.com/c/pay/cs_test_native" });
    expect(db.prepare("SELECT stripe_session_id FROM partner_alert_stripe_checkout_claims WHERE claim_id=?")
      .pluck().get(bound.claimId)).toBe("cs_test_native");
    const secondCheckout = await nativeCheckout(nativeRequest("same-origin"), offer.communityId, checkoutKey);
    expect(secondCheckout.status).toBe(200);
    expect(stripeCalls).toEqual(["checkout/sessions", "checkout/sessions/cs_test_native"]);
    const { whop, ...details } = offer;
    expect(whop).toBeDefined();
    const additionalMappingId = "55555555-5555-4555-8555-555555555552";
    const freshOffer = { ...details, offerId: "55555555-5555-4555-8555-555555555551", billingProvider: "stripe",
      kind: "package", mappingIds: [...details.mappingIds, additionalMappingId].sort() };
    for (const mappingId of freshOffer.mappingIds) {
      write("INSERT INTO partner_alert_mappings VALUES(?,?,'118','128','138',1,1,'approved','ready')", freshOffer.communityId, mappingId);
      for (const version of [1,2]) {
        write("INSERT INTO partner_alert_offer_channels VALUES(?,?,?,?)", freshOffer.communityId, freshOffer.offerId, version, mappingId);
      }
    }
    write(`INSERT INTO partner_alert_offers(community_id,offer_id,version,review_state,offer_json,
      whop_environment,whop_account_id,whop_product_id,whop_plan_id) VALUES(?,?,1,'approved',?,NULL,NULL,NULL,NULL)`,
    freshOffer.communityId, freshOffer.offerId, JSON.stringify(freshOffer));
    write(`INSERT INTO partner_alert_offers(community_id,offer_id,version,review_state,offer_json,
      whop_environment,whop_account_id,whop_product_id,whop_plan_id) VALUES(?,?,2,'draft',?,NULL,NULL,NULL,NULL)`,
    freshOffer.communityId, freshOffer.offerId, JSON.stringify({ ...freshOffer, version: 2, amountMinor: freshOffer.amountMinor + 100 }));
    const setAdditionalChannelDelivery = (state: "paused" | "ready") =>
      write("UPDATE partner_alert_mappings SET delivery_state=? WHERE community_id=? AND mapping_id=?",
        state, freshOffer.communityId, additionalMappingId);
    let pauseDuringStripePriceCreation = false;
    const createPrice = vi.fn(async (account, fields, idem) => {
      expect(db.inTransaction).toBe(false);
      expect(account).toBe("acct_native");
      expect(fields).toEqual({ currency: "usd", unit_amount: String(offer.amountMinor), "recurring[interval]": "day",
        "recurring[interval_count]": String(offer.cadence.count), "product_data[name]": offer.title });
      expect(idem).toMatch(/^partner-price-[a-f0-9]{64}$/u);
      if (pauseDuringStripePriceCreation) setAdditionalChannelDelivery("paused");
      return { id: "price_fresh", active: true, livemode: false, currency: "usd", unit_amount: offer.amountMinor,
        recurring: { interval: "day", interval_count: offer.cadence.count } };
    });
    const newPrice = createPartnerAlertNativeStripePriceBinding({ ...binding, createPrice });
    const freshScope = { ...scope, offerId: freshOffer.offerId };
    await expect(newPrice.reserve(freshScope)).rejects.toThrow("partner_stripe_checkout_unavailable");
    expect(db.prepare("SELECT count(*) FROM partner_alert_stripe_prices WHERE offer_id=?").pluck().get(freshOffer.offerId)).toBe(0);
    db.transaction(() => platformPaidStripeCheckoutReviewedVersionMigration.statements.forEach(sql => db.exec(sql))).immediate();
    createPrice.mockClear();
    setAdditionalChannelDelivery("paused");
    await expect(newPrice.reserve(freshScope)).rejects.toThrow("Approved Stripe offer unavailable.");
    expect(createPrice).not.toHaveBeenCalled();
    setAdditionalChannelDelivery("ready");
    pauseDuringStripePriceCreation = true;
    await expect(newPrice.reserve(freshScope)).rejects.toThrow("Approved Stripe offer unavailable.");
    expect(db.prepare("SELECT count(*) FROM partner_alert_stripe_prices WHERE offer_id=?").pluck().get(freshOffer.offerId)).toBe(0);
    expect(db.prepare("SELECT count(*) FROM partner_alert_stripe_checkout_claims WHERE offer_id=?").pluck().get(freshOffer.offerId)).toBe(0);
    pauseDuringStripePriceCreation = false;
    setAdditionalChannelDelivery("ready");
    createPrice.mockClear();
    expect((await newPrice.reserve(freshScope)).priceId).toBe("price_fresh");
    expect((await newPrice.reserve(freshScope)).priceId).toBe("price_fresh");
    expect(createPrice).toHaveBeenCalledTimes(1);
    expect(db.prepare("SELECT stripe_price_id FROM partner_alert_stripe_prices WHERE offer_id=?").pluck().get(freshOffer.offerId))
      .toBe("price_fresh");
    await expect(newPrice.reserve({ ...freshScope, version: 2 })).rejects.toThrow("Approved Stripe offer unavailable.");
    write("UPDATE partner_alert_offers SET review_state='awaiting_approval' WHERE offer_id=? AND version=2", freshOffer.offerId);
    expect((await newPrice.reserve(freshScope)).priceId).toBe("price_fresh");
    write("UPDATE partner_alert_offers SET review_state='approved' WHERE offer_id=? AND version=2", freshOffer.offerId);
    await expect(newPrice.reserve(freshScope)).rejects.toThrow("Approved Stripe offer unavailable.");

    write("UPDATE traderlink_communities SET owner_user_id='other' WHERE community_id=?", offer.communityId);
    await expect(bind(scope)).rejects.toThrow("Approved Stripe offer unavailable.");
    write(`INSERT INTO partner_alert_stripe_checkout_claims
      (claim_id,buyer_user_id,seller_id,community_id,environment,stripe_account_id,offer_id,offer_version,stripe_price_id,
        stripe_session_id,stripe_customer_id,stripe_subscription_id,created_at_ms) VALUES(
      'survivor_claim','survivor','first_seller','first','sandbox','acct_first','offer',1,'price_exact',
      'cs_test_other','cus_other','sub_other',1)`);
    write(event,"acct_first","evt_survivor","first_seller","first","survivor_claim","invoice.paid","in_other",digest);
    write(`INSERT INTO partner_alert_stripe_paid_terms VALUES(
      'sandbox','acct_first','survivor_claim','in_other','inpay_other','pi_other','evt_survivor',2,20,2500,'usd')`);
    write("UPDATE partner_alert_stripe_sellers SET state='disconnected',updated_at_ms=5 WHERE seller_id='first_seller'");
    expect(() => write(claim, "after_disconnect", "acct_first")).toThrow("partner_stripe_checkout_unavailable");
    write(`INSERT INTO partner_alert_stripe_events VALUES(
      'sandbox','acct_first','evt_unmatched','first_seller','first',NULL,'charge.refunded','ch_unknown',?,1,'pending')`,digest);
    for (const status of ["review","applied","ignored"]) {
      write(`INSERT INTO partner_alert_stripe_events VALUES(
        'sandbox','acct_first',?,'first_seller','first',NULL,'charge.refunded','ch_unknown',?,1,?)`,
      `evt_unmatched_${status}`,digest,status);
    }
    write(`INSERT INTO partner_alert_stripe_events VALUES(
      'sandbox','acct_first','evt_recent','first_seller','first',NULL,'charge.refunded','ch_recent',?,3,'pending')`,digest);
    write(`INSERT INTO partner_alert_stripe_events VALUES(
      'sandbox','acct_first','evt_account_disconnect','first_seller','first',NULL,'account.disconnected','acct_first',?,1,'applied')`,digest);
    expect(() => erasePartnerAlertStripeUser(db,"reviewer",6)).toThrow("admitted writer");
    db.transaction(() => erasePartnerAlertStripeUser(db,"reviewer",6)).immediate();
    expect(db.prepare("SELECT decision,reviewer_user_id,reviewer_erased_at_ms FROM partner_alert_stripe_review_decisions").get())
      .toEqual({ decision:"remove",reviewer_user_id:null,reviewer_erased_at_ms:6 });
    write("DELETE FROM platform_users WHERE user_id='reviewer'");
    const buyerRoleClosure = (scope: { community_id: string; buyer_user_id: string; mapping_id: string }) =>
      scope.community_id === "first" && scope.buyer_user_id === "buyer" && scope.mapping_id === "included";
    expect(() => db.transaction(() => erasePartnerAlertStripeUser(db,"buyer",7)).immediate())
      .toThrow("Discord role disposition is unverified.");
    expect(db.prepare("SELECT count(*) FROM partner_alert_stripe_role_reconciliations").pluck().get()).toBe(1);
    // A historical reconciliation can remain even if the offer mapping has
    // since been removed. Its exact mapping still needs a closure receipt.
    write("DELETE FROM partner_alert_offer_channels WHERE community_id='first' AND offer_id='offer'");
    expect(() => db.transaction(() => erasePartnerAlertStripeUser(db,"buyer",7,() => false)).immediate())
      .toThrow("Discord role disposition is unverified.");
    expect(db.prepare("SELECT count(*) FROM partner_alert_stripe_role_reconciliations").pluck().get()).toBe(1);
    write("INSERT INTO partner_alert_offer_channels VALUES('first','offer',1,'included')");
    const { privateKey: roleSigner, publicKey: roleVerifier } = generateKeyPairSync("ed25519");
    const roleScope: Extract<StripeErasureRoleProofScope,{ mode:"root" }> = {
      mode:"root", operationRef:"erase-operation", userId:"buyer", workspaceId:"workspace", lifecycleRef:"lifecycle",
      erasureGeneration:1,catalogSha256:digest,schemaSha256:digest,appliedLedgerSha256:digest,
      writerFenceRef:"role-fence",writerFenceGeneration:1,
    };
    const nowUtc = "2026-11-15T12:00:05.000Z";
    let observedPresent = true;
    let authorityDeadline = "2026-11-15T12:00:13.000Z";
    let transportDigest = digest;
    const producer = {
      database:db,scope:roleScope,keyId:"paid-stripe-qa",privateKey:roleSigner,nowUtc:() => nowUtc,maximumLifetimeMs:10_000,
      inRootWriter:<T>(operation:()=>T) => db.transaction(operation).immediate(),
      readFence:() => ({ref:"role-fence",generation:1}),
      readSettledTransport(row: ReturnType<typeof readPartnerAlertStripeErasureRoleFacts>["entries"][number], discordUserId: string) {
        expect(db.inTransaction).toBe(true);
        return {guildId:row.guildId,roleId:row.roleId,discordUserId,settledAtUtc:"2026-11-15T12:00:00.000Z",
          settledTransportSha256:transportDigest,validUntilUtc:"2026-11-15T12:00:14.000Z"};
      },
      async resolveAuthority(facts: ReturnType<typeof readPartnerAlertStripeErasureRoleFacts>["entries"][number]) {
        expect(db.inTransaction).toBe(false);
        return { ...facts, discordUserId:"141",stripe:"absent" as const,whop:"absent" as const,validUntilUtc:authorityDeadline };
      },
      async observeDiscord(target: {guildId:string;discordUserId:string;roleId:string}) {
        expect(db.inTransaction).toBe(false);
        return { ...target,present:observedPresent,observedAtUtc:"2026-11-15T12:00:04.000Z" };
      },
    };
    await expect(issuePartnerAlertStripeErasureRoleProof({...producer,inRootWriter:operation=>operation()}))
      .rejects.toThrow("proof writer is unavailable");
    await expect(issuePartnerAlertStripeErasureRoleProof(producer)).rejects.toThrow("observation did not confirm");
    observedPresent = false;
    authorityDeadline = nowUtc;
    await expect(issuePartnerAlertStripeErasureRoleProof(producer)).rejects.toThrow("authority has expired");
    authorityDeadline = "2026-11-15T12:00:13.000Z";
    await expect(issuePartnerAlertStripeErasureRoleProof({ ...producer, async observeDiscord(target) {
      transportDigest = "f".repeat(64);
      return producer.observeDiscord(target);
    } })).rejects.toThrow("role evidence changed");
    transportDigest = digest;
    const proof = await issuePartnerAlertStripeErasureRoleProof(producer);
    expect(proof.proof.entries).toHaveLength(1);
    expect(proof.proof.entries[0]).toMatchObject({guildId:"110",discordUserId:"141",roleId:"120",desiredPresent:false,observedPresent:false});
    expect(proof.proof.expiresAtUtc).toBe("2026-11-15T12:00:13.000Z");
    const verified = (value: typeof proof.proof) => verify(null,encodePartnerAlertStripeErasureRoleProof(value),
      roleVerifier,Buffer.from(proof.signature,"base64url"));
    expect(verified(proof.proof)).toBe(true);
    expect(verified({...proof.proof,scope:{...roleScope,operationRef:"wrong-operation"}})).toBe(false);
    const facts = db.transaction(() => readPartnerAlertStripeErasureRoleFacts(db,"buyer")).immediate();
    expect(facts.affectedSourceSha256).toBe(proof.proof.affectedSourceSha256);
    expect(facts.entries[0]?.stripeAuthoritySha256).toBe(proof.proof.entries[0]?.stripeAuthoritySha256);
    write("UPDATE partner_alert_stripe_events SET status='review' WHERE event_id='evt_refund'");
    const changed = db.transaction(() => readPartnerAlertStripeErasureRoleFacts(db,"buyer")).immediate();
    expect(changed.entries[0]?.stripeAuthoritySha256).not.toBe(facts.entries[0]?.stripeAuthoritySha256);
    write("UPDATE partner_alert_stripe_events SET status='applied' WHERE event_id='evt_refund'");
    write("INSERT INTO partner_alert_whop_connections VALUES('first','live','biz_test','verified',?,?)",nowUtc,authorityDeadline);
    const whopChanged = db.transaction(() => readPartnerAlertStripeErasureRoleFacts(db,"buyer")).immediate();
    expect(whopChanged.entries[0]?.whopAuthoritySha256).not.toBe(facts.entries[0]?.whopAuthoritySha256);
    write("DELETE FROM partner_alert_whop_connections WHERE community_id='first'");
    const discordToken = process.env.PARTNER_STRIPE_DISCORD_BOT_TOKEN;
    if (process.env.PARTNER_STRIPE_QA_REAL_PROOF_DISCORD === "1" && discordToken) {
      const fixture = await createPartnerAlertStripeDiscordTestGuild({
        guildId:process.env.PARTNER_STRIPE_DISCORD_GUILD_ID!,memberId:process.env.PARTNER_STRIPE_DISCORD_MEMBER_ID!,
        botToken:discordToken,unrelatedMemberId:process.env.PARTNER_STRIPE_DISCORD_UNRELATED_TEST_MEMBER_ID,
      });
      try {
        write(`UPDATE partner_alert_mappings SET destination_guild_id=?,destination_role_id=?,destination_channel_id=?
          WHERE community_id='first' AND mapping_id='included'`,fixture.guildId,fixture.roleId,fixture.channelId);
        const clock = () => new Date().toISOString();
        const settledAtUtc = clock();
        const liveObserve = createPartnerAlertStripeErasureDiscordObserver({ botUserId:fixture.botId,botToken:fixture.token,
          maximumDurationMs:5000,transport:fetch },clock);
        let preserve = false;
        const liveProducer = { ...producer,nowUtc:clock,
          readSettledTransport(row: typeof facts.entries[number], discordUserId: string) {
            return { ...producer.readSettledTransport(row,discordUserId),settledAtUtc,validUntilUtc:new Date(Date.parse(settledAtUtc)+20_000).toISOString() };
          },
          async resolveAuthority(row: typeof facts.entries[number]) {
            expect(db.inTransaction).toBe(false);
            return { ...row,discordUserId:fixture.memberId,stripe:preserve ? "qualified" as const : "absent" as const,
              whop:"absent" as const,validUntilUtc:new Date(Date.now()+20_000).toISOString() };
          },
          observeDiscord:liveObserve,
        };
        const absent = await issuePartnerAlertStripeErasureRoleProof(liveProducer);
        expect(verify(null,encodePartnerAlertStripeErasureRoleProof(absent.proof),
          roleVerifier,Buffer.from(absent.signature,"base64url"))).toBe(true);
        expect(absent.proof.entries[0]).toMatchObject({roleId:fixture.roleId,desiredPresent:false,observedPresent:false});
        await fixture.prepare();
        await expect(issuePartnerAlertStripeErasureRoleProof(liveProducer)).rejects.toThrow("observation did not confirm");
        preserve = true;
        const retained = await issuePartnerAlertStripeErasureRoleProof(liveProducer);
        expect(retained.proof.entries[0]).toMatchObject({roleId:fixture.roleId,desiredPresent:true,observedPresent:true});
        await fixture.verify(true);
        const transportFacts = db.transaction(() => readPartnerAlertStripeErasureRoleFacts(db,"buyer")).immediate().entries[0]!;
        const roleTransport = createPartnerAlertManagedRoleTransport({ botUserId:fixture.botId,
          forbiddenRoleIds:[fixture.sentinelRoleId], readBinding: mappingId => mappingId === transportFacts.scope.mapping_id
            ? {mappingId,guildId:fixture.guildId,roleId:fixture.roleId,channelId:fixture.channelId,guildPermissions:"0",allowGrant:false} : null,
          createRest: target => createPartnerAlertDiscordRoleRest({ botToken:fixture.token,botUserId:fixture.botId,
            maximumDurationMs:5000,transport:fetch },target),
        });
        write("UPDATE partner_alert_stripe_role_reconciliations SET status='applied'");
        const transportScope = { ...roleScope,operationRef:"discord-transport-test" };
        const transportInput = {
          scope:transportScope,facts:transportFacts,nowUtc:clock,
          inRootWriter:<T>(operation:()=>T) => db.transaction(operation).immediate(),
          readIntent: (scope: typeof transportScope, facts: typeof transportFacts, atUtc: string) => ({
            query:{scope,facts,atUtc,discordUserId:fixture.memberId},desiredPresent:preserve,validUntilUtc:new Date(Date.now()+20_000).toISOString(),
            stripe:preserve ? "qualified" as const : "absent" as const,whop:"absent" as const,
          }),
          transport:roleTransport, observeDiscord:liveObserve,
        };
        expect(await settlePartnerAlertStripeErasureTransport(db,transportInput)).toBe(true);
        await fixture.verify(true);
        expect(await settlePartnerAlertStripeErasureTransport(db,transportInput)).toBe(true);
        preserve = false;
        expect(await settlePartnerAlertStripeErasureTransport(db,transportInput)).toBe(false);
        const removalScope={...transportScope,operationRef:"discord-removal-test"};
        expect(await settlePartnerAlertStripeErasureTransport(db,{...transportInput,scope:removalScope})).toBe(true);
        await fixture.verify(false);
        const closure = db.transaction(() => readPartnerAlertStripeErasureTransport(db,
          {scope:removalScope,facts:transportFacts,atUtc:clock(),discordUserId:fixture.memberId},false)).immediate();
        expect(closure).toMatchObject({guildId:fixture.guildId,roleId:fixture.roleId,discordUserId:fixture.memberId});
        const otherFence={...removalScope,writerFenceRef:"changed"};
        expect(db.transaction(() => readPartnerAlertStripeErasureTransport(db,
          {scope:otherFence,facts:transportFacts,atUtc:clock(),discordUserId:fixture.memberId},false)).immediate()).toBeNull();
        console.log("App Discord transport preserved qualified access, then removed only the exact test role and recorded the settled receipt under fixture authority.");
      } finally {
        await fixture.cleanup();
        write("DELETE FROM platform_erasure_operation_claims WHERE participant='stripe_role_transport'");
        write("UPDATE partner_alert_stripe_role_reconciliations SET status='pending'");
        write(`UPDATE partner_alert_mappings SET destination_guild_id='110',destination_role_id='120',destination_channel_id='130'
          WHERE community_id='first' AND mapping_id='included'`);
      }
    }
    const buildSettlements = (attested: typeof proof) => attested.proof.entries.map(entry => ({
      facts: entry, discordUserId: entry.discordUserId, settledTransportSha256: entry.settledTransportSha256,
      settledAtUtc: "2026-11-15T12:00:00.000Z", desiredPresent: entry.desiredPresent, observedPresent: entry.observedPresent,
      observedAtUtc: entry.observedAtUtc, validUntilUtc: attested.proof.expiresAtUtc,
    }));
    let settlementProof = proof;
    let durable = buildSettlements(settlementProof);
    let surviving = false;
    const independentAuthority = () => ({ discordUserId:"141",settledTransportSha256:digest,
      settledAtUtc:"2026-11-15T12:00:00.000Z",desiredPresent:surviving });
    write("INSERT INTO platform_erasure_module_operations VALUES('erase-operation','workspace','lifecycle','ready','profile',1,'role-fence',?)",
      "2026-11-15T12:00:22.000Z");
    write("INSERT INTO platform_erasure_lifecycles VALUES('lifecycle','erase-operation',1,'buyer',1,'settling','profile',1,?)",
      "2026-11-15T12:00:22.000Z");
    const coverageReader = createPartnerAlertErasedBuyerCoverage(db);
    write("INSERT INTO platform_auth_identities VALUES('buyer','discord','141','active')");
    const erasedBuyer = {scope:roleScope,facts:facts.entries[0]!,atUtc:nowUtc,discordUserId:"141"};
    const readBuyerCoverage = db.transaction((query: typeof erasedBuyer) => [
      coverageReader.readStripeSurvivor(db,query),coverageReader.readWhopSurvivor(db,query),
    ]);
    expect(readBuyerCoverage.immediate(erasedBuyer)).toEqual([
      expect.objectContaining({kind:"absent",authoritySha256:erasedBuyer.facts.stripeAuthoritySha256}),
      expect.objectContaining({kind:"absent",authoritySha256:erasedBuyer.facts.whopAuthoritySha256}),
    ]);
    expect(readBuyerCoverage.immediate({...erasedBuyer,scope:{...roleScope,userId:"owner"}})).toEqual([null,null]);
    expect(readBuyerCoverage.immediate({...erasedBuyer,discordUserId:"142"})).toEqual([null,null]);
    const record = db.transaction(() => recordPartnerAlertStripeErasureSettlements(db,{
      scope:roleScope,nowUtc,rows:durable,assertCurrentWriter:() => expect(db.inTransaction).toBe(true),
      readIndependentAuthority:independentAuthority,proof:settlementProof.proof,signature:settlementProof.signature,proofPublicKey:roleVerifier,keyId:"paid-stripe-qa",
    }));
    expect(() => record.immediate()).toThrow("settlement evidence is unverified");
    write("UPDATE partner_alert_stripe_role_reconciliations SET status='applied'");
    expect(() => record.immediate()).toThrow("settlement signature is unverified");
    settlementProof = await issuePartnerAlertStripeErasureRoleProof(producer);
    durable = buildSettlements(settlementProof);
    expect(() => record.immediate()).not.toThrow();
    expect(() => record.immediate()).not.toThrow();
    const readSettlement = db.transaction((at: string) => readSettledPartnerAlertStripeErasureRole(db,{
      scope:roleScope,facts:facts.entries[0]!,nowUtc:at,readIndependentAuthority:independentAuthority,
    }));
    expect(readSettlement.immediate(nowUtc)).toEqual(independentAuthority());
    const coverage = db.transaction(() => readSettledPartnerAlertStripeErasureRoleCoverage(db,{
      scope:roleScope,facts:facts.entries[0]!,nowUtc,readIndependentAuthority:independentAuthority,
    })).immediate();
    expect(coverage).toMatchObject({ settlement:independentAuthority(),claimRef:expect.stringMatching(/^[0-9a-f]{64}$/u),
      originalSha256:expect.stringMatching(/^[0-9a-f]{64}$/u) });
    expect(coverage).not.toHaveProperty("originalJson");
    expect(readSettlement.immediate(proof.proof.expiresAtUtc)).toBeNull();
    surviving = true;
    expect(readSettlement.immediate(nowUtc)).toBeNull();
    surviving = false;
    write("INSERT INTO partner_alert_role_jobs VALUES('first','buyer','included','141','lease','applying','{}')");
    expect(readSettlement.immediate(nowUtc)).toBeNull();
    write("DELETE FROM partner_alert_role_jobs");
    write("INSERT INTO partner_alert_role_jobs VALUES('first','buyer','included','142',NULL,'applied',NULL)");
    expect(readSettlement.immediate(nowUtc)).toBeNull();
    write("DELETE FROM partner_alert_role_jobs");
    write("UPDATE platform_erasure_module_operations SET quiescence_ref='other-fence'");
    expect(readSettlement.immediate(nowUtc)).toBeNull();
    write("UPDATE platform_erasure_module_operations SET quiescence_ref='role-fence'");
    const restoreScope: StripeErasureRoleProofScope = {
      mode:"restore",operationRef:roleScope.operationRef,userId:roleScope.userId,workspaceId:roleScope.workspaceId,
      lifecycleRef:roleScope.lifecycleRef,erasureGeneration:roleScope.erasureGeneration,catalogSha256:roleScope.catalogSha256,
      schemaSha256:roleScope.schemaSha256,appliedLedgerSha256:roleScope.appliedLedgerSha256,
      snapshotSha256:digest,tombstoneRef:"fixture-committed-tombstone",tombstoneLedgerGeneration:1,
      tombstoneLedgerSha256:digest,restoreKeyringSha256:digest,
    };
    // Detached fixture only. The archive authority owns restore issuance.
    const restoreProof = { ...settlementProof.proof,scope:restoreScope };
    const restorePayload = encodePartnerAlertStripeErasureRoleProof(restoreProof);
    const restoreSignature = sign(null,restorePayload,roleSigner).toString("base64url");
    expect(verify(null,restorePayload,roleVerifier,Buffer.from(restoreSignature,"base64url"))).toBe(true);
    expect(verified(restoreProof)).toBe(false);
    const { privateKey: archiveSigner, publicKey: archiveVerifier } = generateKeyPairSync("ed25519");
    const archiveFence = {writerFenceRef:roleScope.writerFenceRef,writerFenceGeneration:roleScope.writerFenceGeneration};
    const archive = sign(null,encodePartnerAlertStripeErasureSettlementArchive(restoreProof,durable,archiveFence),archiveSigner).toString("base64url");
    const checkArchive = db.transaction((scope: typeof restoreScope, key: typeof archiveVerifier) => {
      const trusted = openPartnerAlertStripeErasureSettlementArchive(db,{
        proof:restoreProof,expectedScope:scope,rows:durable,signature:archive,archivePublicKey:key,nowUtc,originalRootFence:archiveFence,
        verifyArchivedAuthority:independentAuthority,
      });
      return trusted?.(facts.entries[0]!,nowUtc) ?? null;
    });
    expect(checkArchive.immediate(restoreScope,archiveVerifier)).toMatchObject({...independentAuthority(),
      archivedEntrySha256:expect.stringMatching(/^[0-9a-f]{64}$/u),
      rawClaim:{claimRef:coverage?.claimRef,originalSha256:coverage?.originalSha256} });
    const archivedRaw = db.prepare("SELECT original_json,original_sha256 FROM platform_erasure_operation_claims").get() as
      { original_json: string; original_sha256: string };
    const changedBytes = archivedRaw.original_json.replace("role-fence","different-fence");
    write("UPDATE platform_erasure_operation_claims SET original_json=?,original_sha256=?",changedBytes,
      createHash("sha256").update(changedBytes).digest("hex"));
    expect(checkArchive.immediate(restoreScope,archiveVerifier)).toBeNull();
    write("UPDATE platform_erasure_operation_claims SET original_json=?,original_sha256=?",archivedRaw.original_json,archivedRaw.original_sha256);
    write("DELETE FROM platform_erasure_operation_claims");
    expect(checkArchive.immediate(restoreScope,archiveVerifier)).toMatchObject({rawClaim:null});
    expect(db.prepare("SELECT count(*) FROM platform_erasure_operation_claims").pluck().get()).toBe(0);
    expect(checkArchive.immediate({...restoreScope,snapshotSha256:"b".repeat(64)},archiveVerifier)).toBeNull();
    expect(checkArchive.immediate(restoreScope,roleVerifier)).toBeNull();

    const liveFacts = db.transaction(() => readPartnerAlertStripeErasureRoleFacts(db,"buyer")).immediate().entries[0]!;
    const fixtureScope={...roleScope,operationRef:"transport-race-test"};
    const scopeArgs = { scope:fixtureScope,facts:liveFacts,atUtc:nowUtc,discordUserId:"141" };
    let desiredPresent = false;
    const raceInput = {
      scope:fixtureScope,facts:liveFacts,nowUtc:() => nowUtc,
      inRootWriter:<T>(operation:()=>T) => db.transaction(operation).immediate(),
      readIntent: (scope:typeof fixtureScope, facts:typeof liveFacts, atUtc:string) => ({
        query:{scope,facts,atUtc,discordUserId:"141"},desiredPresent,validUntilUtc:"2026-11-15T12:00:13.000Z",
        stripe:desiredPresent ? "qualified" as const : "absent" as const,whop:"absent" as const,
      }),
      async observeDiscord(target:{guildId:string;discordUserId:string;roleId:string}) {
        expect(db.inTransaction).toBe(false);
        return {...target,present:true,observedAtUtc:nowUtc};
      },
      transport:{
        async verifyManagedRole() { return true; },
        async setRole(input: { stillCurrent:()=>boolean }) {
          desiredPresent = true;
          expect(input.stillCurrent()).toBe(false);
          return {kind:"not_written" as const};
        },
      },
    };
    expect(await settlePartnerAlertStripeErasureTransport(db,raceInput)).toBe(false);
    expect(db.prepare("SELECT count(*) FROM platform_erasure_operation_claims WHERE participant='stripe_role_transport'").pluck().get()).toBe(0);
    desiredPresent = false;
    const uncertain = vi.fn(async (input: { stillCurrent:()=>boolean }) => {
      expect(db.inTransaction).toBe(false);
      expect(input.stillCurrent()).toBe(true);
      return {kind:"uncertain" as const};
    });
    const uncertainInput={...raceInput,transport:{...raceInput.transport,setRole:uncertain}};
    expect(await settlePartnerAlertStripeErasureTransport(db,uncertainInput)).toBe(false);
    expect(await settlePartnerAlertStripeErasureTransport(db,uncertainInput)).toBe(false);
    expect(uncertain).toHaveBeenCalledTimes(1);
    expect(db.transaction(() => readPartnerAlertStripeErasureTransport(db,scopeArgs,false)).immediate()).toBeNull();
    write("DELETE FROM platform_erasure_operation_claims WHERE participant='stripe_role_transport'");
    desiredPresent=true;
    expect(await settlePartnerAlertStripeErasureTransport(db,uncertainInput)).toBe(true);
    expect(uncertain).toHaveBeenCalledTimes(1);
    const restoredTransportScope={...restoreScope,operationRef:fixtureScope.operationRef};
    const transportRows=db.prepare(`SELECT claim_ref AS claimRef,original_json AS originalJson,original_sha256 AS originalSha256,
      outcome_ref AS outcomeRef FROM platform_erasure_operation_claims WHERE participant='stripe_role_transport'`).all() as
      {claimRef:string;originalJson:string;originalSha256:string;outcomeRef:string}[];
    const transportPayload=encodePartnerAlertStripeErasureTransportArchive("archive",restoredTransportScope,archiveFence,transportRows);
    const transportArchive = {scope:restoredTransportScope,originalFence:archiveFence,rows:transportRows,keyId:"archive",
      publicKey:archiveVerifier,signature:sign(null,transportPayload,archiveSigner).toString("base64url")};
    const readTransportArchive=openPartnerAlertStripeErasureTransportArchive(db,transportArchive)!;
    expect(openPartnerAlertStripeErasureTransportArchive(db,{...transportArchive,publicKey:roleVerifier})).toBeNull();
    expect(openPartnerAlertStripeErasureTransportArchive(db,{...transportArchive,scope:{...restoredTransportScope,snapshotSha256:"d".repeat(64)}})).toBeNull();
    const checkTransportArchive=db.transaction(() => readTransportArchive(db,{...scopeArgs,scope:restoredTransportScope},true));
    expect(checkTransportArchive.immediate()).toMatchObject({rawClaim:{claimRef:transportRows[0]!.claimRef,originalSha256:transportRows[0]!.originalSha256}});
    write(`INSERT INTO platform_erasure_operation_claims VALUES(?,'stripe_role_transport',?,?,?,'settled',?)`,
      fixtureScope.operationRef,"f".repeat(64),transportRows[0]!.originalJson,transportRows[0]!.originalSha256,transportRows[0]!.outcomeRef);
    expect(checkTransportArchive.immediate()).toBeNull();
    write("DELETE FROM platform_erasure_operation_claims WHERE claim_ref=?","f".repeat(64));
    const tamperedTransport=transportRows[0]!.originalJson+"\n";
    write("UPDATE platform_erasure_operation_claims SET original_json=?,original_sha256=? WHERE participant='stripe_role_transport'",
      tamperedTransport,createHash("sha256").update(tamperedTransport).digest("hex"));
    expect(checkTransportArchive.immediate()).toBeNull();
    write("DELETE FROM platform_erasure_operation_claims WHERE participant='stripe_role_transport'");
    expect(checkTransportArchive.immediate()).toMatchObject({rawClaim:null});

    const vector = process.env.PARTNER_STRIPE_QA_PROOF_VECTOR_PATH;
    if (vector && /^\/tmp\/traderlink-paid-qa-[A-Za-z0-9-]+\/stripe-role-proof-vectors.json$/u.test(vector)) {
      writeFileSync(vector,JSON.stringify({
        publicKeyPem:roleVerifier.export({type:"spki",format:"pem"}).toString(), facts,
        root:{...proof,payload:encodePartnerAlertStripeErasureRoleProof(proof.proof).toString("utf8")},
        restore:{proof:restoreProof,signature:restoreSignature,payload:restorePayload.toString("utf8")},
      },null,2),{flag:"wx",mode:0o600});
    }
    const quarantine = mkdtempSync("/tmp/traderlink-paid-qa-0209-restore-");
    try {
      const snapshot = join(quarantine,"snapshot.sqlite");
      await db.backup(snapshot);
      const digest = (value: Buffer | string) => createHash("sha256").update(value).digest("hex");
      const pin = { snapshotSha256:digest(readFileSync(snapshot)),ledgerSha256:digest("0209-populated-restore-test"),
        tombstoneRef:"fixture-buyer-erasure" };
      const roots = [
        { table:"partner_alert_stripe_checkout_claims",column:"buyer_user_id",value:"buyer" },
        ...["events","paid_terms","review_decisions","role_reconciliations"].map(segment =>
          ({ table:`partner_alert_stripe_${segment}`,column:"claim_id",value:"exact" })),
      ];
      const archived = db.transaction(() => captureRestoreInventoryFromOriginal(db,{...pin,roots,absentFiles:[]},quarantine)).immediate();
      const { privateKey,publicKey } = generateKeyPairSync("ed25519");
      const proof = { ...pin,inventory:archived.inventory,expectedInventorySha256:archived.inventorySha256,quarantineVault:quarantine };
      const signer = sign(null,Buffer.from(JSON.stringify(["platform-restore-absent-closure-v1",pin.snapshotSha256,
        pin.ledgerSha256,pin.tombstoneRef,archived.inventorySha256])),privateKey).toString("base64url");
      const pem = publicKey.export({ type:"spki",format:"pem" }).toString();
      const restored = new Database(snapshot,{fileMustExist:true});
      try {
        restored.pragma("foreign_keys=ON");
        const verify = () => verifyAttestedAbsentRestoreClosure(restored,proof,signer,pem);
        expect(() => restored.transaction(verify).immediate()).toThrow("platform_restore_evidence_held");
        const replay = restored.transaction(() => {
          erasePartnerAlertStripeUser(restored,"buyer",7,buyerRoleClosure);
          restored.prepare("DELETE FROM platform_users WHERE user_id='buyer'").run();
          verify();
        });
        replay.immediate();
        replay.immediate();
        expect(restored.prepare("SELECT invoice_id FROM partner_alert_stripe_paid_terms").pluck().all()).toEqual(["in_other"]);
        expect(restored.prepare("SELECT evidence FROM partner_alert_whop_fixture WHERE user_id='survivor'").pluck().get()).toBe("verified");
        expect(restored.pragma("foreign_key_check")).toEqual([]);
      } finally { restored.close(); }
    } finally { rmSync(quarantine,{recursive:true,force:true}); }
    db.transaction(() => erasePartnerAlertStripeUser(db,"buyer",7,buyerRoleClosure)).immediate();
    write("DELETE FROM platform_users WHERE user_id='buyer'");
    expect(db.prepare("SELECT invoice_id FROM partner_alert_stripe_paid_terms").pluck().all()).toEqual(["in_other"]);
    expect(db.prepare("SELECT evidence FROM partner_alert_whop_fixture WHERE user_id='survivor'").pluck().get()).toBe("verified");
    const sweep = db.transaction((atMs: number) => expirePartnerAlertStripeUnboundEvents(db,atMs));
    expect(sweep.immediate(7 * 86_400_000)).toBe(0);
    expect(sweep.immediate(7 * 86_400_000 + 1)).toBe(4);
    expect(db.prepare("SELECT event_id FROM partner_alert_stripe_events ORDER BY event_id").pluck().all()).toEqual(["evt_account_disconnect","evt_recent","evt_survivor"]);
    for (let i=0;i<251;i++) write(`INSERT INTO partner_alert_stripe_events VALUES(
      'sandbox','acct_first',?,'first_seller','first',NULL,'charge.refunded','ch_batch',?,1,'pending')`,`evt_batch_${i}`,digest);
    expect(sweep.immediate(7 * 86_400_000 + 1)).toBe(250);
    expect(sweep.immediate(7 * 86_400_000 + 1)).toBe(1);
    expect(sweep.immediate(7 * 86_400_000 + 1)).toBe(0);
    expect(() => db.transaction(() => erasePartnerAlertStripeUser(db,"owner",8,buyerRoleClosure)).immediate())
      .toThrow("Discord role disposition is unverified.");
    db.transaction(() => erasePartnerAlertStripeUser(db,"owner",8,scope =>
      scope.community_id === "first" && scope.buyer_user_id === "survivor" && scope.mapping_id === "included")).immediate();
    expect(db.prepare("SELECT state,owner_user_id,owner_erased_at_ms FROM partner_alert_stripe_sellers WHERE seller_id='first_seller'").get())
      .toEqual({ state:"disconnected",owner_user_id:null,owner_erased_at_ms:8 });
    expect(db.prepare("SELECT invoice_id FROM partner_alert_stripe_paid_terms").pluck().all()).toEqual(["in_other"]);
    expect(db.pragma("foreign_key_check")).toEqual([]);
  } finally { db.close(); }
}, process.env.PARTNER_STRIPE_QA_REAL_PROOF_DISCORD === "1" ? 60_000 : 5_000);
