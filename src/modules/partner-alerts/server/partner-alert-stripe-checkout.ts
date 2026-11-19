import { createHash, randomUUID } from "node:crypto";
import type Database from "better-sqlite3";
import { membershipStripeAmount } from "../../platform/server/membership/membership-stripe-http";
import { verifyMembershipStripeEvent } from "../../platform/server/membership/platform-membership-stripe";
import type { PartnerAlertOffer } from "../contracts/partner-alert-contracts";
import { partnerAlertRecord } from "../contracts/partner-alert-validation";
import { createPartnerAlertStripeAccountClient, partnerStripeSellerStatus, requirePartnerAlertStripeKey } from "./partner-alert-stripe-onboarding";
import type { PartnerAlertEnvironment } from "../contracts/partner-alert-contracts";
import { partnerStripeId as id, partnerStripeInvoiceSubscription, verifyPartnerAlertStripePaidInvoice,
  type PartnerAlertStripeRequest as StripeRead } from "./partner-alert-stripe-paid-invoice";

type Buyer = Readonly<{ userId: string; paidPremium: boolean; hasExistingWhopPurchase: boolean }>;
type CheckoutTarget = Readonly<{ offer: PartnerAlertOffer; priceId: string; sellerAccount?: string }>;
const billingAdjustments = new Set(["charge.refunded", "charge.dispute.created", "charge.dispute.closed", "invoice.payment_failed"]);
const apiVersion = "2026-10-28.endive";

export function createPartnerAlertStripeSandboxClient(key: string, transport: typeof fetch = fetch, account?: string): StripeRead {
  return createPartnerAlertStripeClient(key, "sandbox", transport, account);
}

export function createPartnerAlertStripeClient(key: string, environment: PartnerAlertEnvironment,
  transport: typeof fetch = fetch, account?: string): StripeRead {
  requirePartnerAlertStripeKey(key, environment);
  const livemode = environment === "live";
  if (account !== undefined) id(account, "acct_");
  return async (path, fields, idempotencyKey) => {
    const url = new URL(`https://api.stripe.com/v1/${path}`);
    if (url.origin !== "https://api.stripe.com" || !url.pathname.startsWith("/v1/")) throw new Error("Invalid Stripe endpoint.");
    const response = await transport(url, { method: fields ? "POST" : "GET", redirect: "error", cache: "no-store",
      signal: AbortSignal.timeout(15_000),
      headers: { Authorization: `Bearer ${key}`, "Stripe-Version": apiVersion,
        ...(account ? { "Stripe-Account": account } : {}),
        ...(fields ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
        ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}) },
      body: fields ? new URLSearchParams(fields) : undefined });
    if (!response.ok) throw new Error("Stripe request failed.");
    const value = partnerAlertRecord(await response.json(), "stripeResponse");
    if (value.livemode !== undefined && value.livemode !== livemode) throw new Error("Stripe response mode changed.");
    return value;
  };
}

type Claim = Readonly<{ claim_id: string; user_id: string; community_id: string; offer_id: string; offer_version: number;
  price_id: string; mappings: string; session_id: string | null; checkout_url: string | null;
  subscription_id: string | null; customer_id: string | null }>;

export function createPartnerAlertStripeSandboxConnect(key: string, transport: typeof fetch = fetch) {
  return createPartnerAlertStripeConnect(key, "sandbox", transport);
}

export function createPartnerAlertStripeConnect(key: string, environment: PartnerAlertEnvironment, transport: typeof fetch = fetch) {
  const readAccount = createPartnerAlertStripeAccountClient(key, transport, environment);
  return {
    readSeller: (account: string) => readAccount(`accounts/${id(account, "acct_")}`),
    stripeForAccount: (account: string) => createPartnerAlertStripeClient(key, environment, transport, account),
  };
}

export function createPartnerAlertStripeSandboxCheckout(input: Readonly<{
  db: Database.Database;
  stripe: StripeRead;
  connect?: Readonly<{
    stripeForAccount: (account: string) => StripeRead;
    readSeller: (account: string) => Promise<Record<string, unknown>>;
  }>;
  signingSecret: string;
  returnOrigin: string;
  nowMs: () => number;
  readWhopAccess?: (userId: string, communityId: string, mappingId: string) => "active" | "absent" | "unknown";
  reconcileAccess?: (userId: string, communityId: string, scope: Readonly<{
    ended: boolean; eventId: string; readOccupiedMappings: () => readonly string[];
    mayRemoveMapping: (mappingId: string) => boolean;
  }>) => Promise<void>;
  /** Bound by the isolated app to current signed-in Premium and reviewed offer authority. */
  authorizeCheckout: (request: Request, communityId: string, offerKey: string) => { buyer: Buyer; target: CheckoutTarget };
}>) {
  const { db } = input;
  const origin = new URL(input.returnOrigin);
  if (!["localhost", "127.0.0.1"].includes(origin.hostname) || origin.origin !== input.returnOrigin
    || !input.signingSecret.startsWith("whsec_")) throw new Error("Isolated Stripe checkout required.");
  db.exec(`CREATE TABLE IF NOT EXISTS qa_partner_stripe_claims (
    claim_id TEXT PRIMARY KEY,user_id TEXT NOT NULL,community_id TEXT NOT NULL,offer_id TEXT NOT NULL,offer_version INTEGER NOT NULL,
    price_id TEXT NOT NULL,mappings TEXT NOT NULL,session_id TEXT UNIQUE,checkout_url TEXT,subscription_id TEXT UNIQUE,customer_id TEXT,
    UNIQUE(user_id,community_id,offer_id,offer_version)
  ) STRICT;
  CREATE TABLE IF NOT EXISTS qa_partner_stripe_events (
    event_id TEXT PRIMARY KEY,digest TEXT NOT NULL
  ) STRICT;
  CREATE TABLE IF NOT EXISTS qa_partner_stripe_terms (
    invoice_id TEXT PRIMARY KEY, claim_id TEXT NOT NULL REFERENCES qa_partner_stripe_claims(claim_id),
    invoice_payment_id TEXT NOT NULL UNIQUE, payment_intent_id TEXT NOT NULL UNIQUE,starts INTEGER NOT NULL,ends INTEGER NOT NULL
  ) STRICT;
  CREATE TABLE IF NOT EXISTS qa_partner_stripe_settlements (
    invoice_id TEXT PRIMARY KEY REFERENCES qa_partner_stripe_terms(invoice_id),
    currency TEXT NOT NULL CHECK(length(currency)=3), amount_paid INTEGER NOT NULL CHECK(amount_paid>0),
    event_id TEXT NOT NULL REFERENCES qa_partner_stripe_events(event_id)
  ) STRICT;
  CREATE TABLE IF NOT EXISTS qa_partner_stripe_ends (
    claim_id TEXT PRIMARY KEY REFERENCES qa_partner_stripe_claims(claim_id), ended_at INTEGER NOT NULL
  ) STRICT;
  CREATE TABLE IF NOT EXISTS qa_partner_stripe_adjustments (
    event_id TEXT PRIMARY KEY REFERENCES qa_partner_stripe_events(event_id),
    claim_id TEXT NOT NULL REFERENCES qa_partner_stripe_claims(claim_id),
    invoice_id TEXT NOT NULL, kind TEXT NOT NULL,
    disposition TEXT NOT NULL CHECK(disposition IN ('retain','review','remove_candidate'))
  ) STRICT;
  CREATE TABLE IF NOT EXISTS qa_partner_stripe_pending_adjustments (
    event_id TEXT PRIMARY KEY, digest TEXT NOT NULL, seller_scope TEXT NOT NULL,
    payment_intent_id TEXT NOT NULL, kind TEXT NOT NULL, resource_id TEXT NOT NULL, received_at INTEGER NOT NULL
  ) STRICT;
  CREATE INDEX IF NOT EXISTS qa_partner_stripe_pending_payment_idx
    ON qa_partner_stripe_pending_adjustments(seller_scope,payment_intent_id);
  CREATE TABLE IF NOT EXISTS qa_partner_stripe_revoked_terms (
    invoice_id TEXT PRIMARY KEY REFERENCES qa_partner_stripe_terms(invoice_id),
    event_id TEXT NOT NULL REFERENCES qa_partner_stripe_adjustments(event_id)
  ) STRICT;
  CREATE TABLE IF NOT EXISTS qa_partner_stripe_claim_sellers (
    claim_id TEXT PRIMARY KEY REFERENCES qa_partner_stripe_claims(claim_id),
    account_id TEXT NOT NULL
  ) STRICT;`);
  const sellerForClaim = db.prepare("SELECT account_id FROM qa_partner_stripe_claim_sellers WHERE claim_id=?").pluck();
  const find = db.prepare("SELECT * FROM qa_partner_stripe_claims WHERE claim_id=?");

  const readOccupiedMappings = (userId: string, communityId: string): readonly string[] => {
    const now = Math.floor(input.nowMs() / 1000);
    const active = db.prepare(`SELECT DISTINCT c.mappings FROM qa_partner_stripe_claims c
      JOIN qa_partner_stripe_terms t ON c.claim_id=t.claim_id
      LEFT JOIN qa_partner_stripe_ends e ON c.claim_id=e.claim_id
      LEFT JOIN qa_partner_stripe_revoked_terms r ON t.invoice_id=r.invoice_id
      WHERE r.invoice_id IS NULL AND c.user_id=? AND c.community_id=? AND t.starts<=? AND t.ends>? AND (e.ended_at IS NULL OR e.ended_at>?)`)
      .pluck().all(userId, communityId, now, now, now) as string[];
    return [...new Set(active.flatMap(value => JSON.parse(value) as string[]))].sort();
  };
  async function reconcile(claim: Claim, ended: boolean, eventId: string) {
    const readMappings = () => readOccupiedMappings(claim.user_id, claim.community_id);
    const claimMappings = JSON.parse(claim.mappings) as string[];
    await input.reconcileAccess?.(claim.user_id, claim.community_id, {
      ended, eventId, readOccupiedMappings: readMappings,
      mayRemoveMapping(mappingId) {
        return ended && claimMappings.includes(mappingId) && !readMappings().includes(mappingId)
          && input.readWhopAccess?.(claim.user_id, claim.community_id, mappingId) === "absent";
      },
    });
  }
  type VerifiedAdjustment = { claim: Claim; invoiceId: string; disposition: "retain" | "review" | "remove_candidate" };
  async function resolveAdjustment(stripe: StripeRead, kind: string, data: Record<string, unknown>, account?: string):
    Promise<VerifiedAdjustment | { paymentIntent: string } | null> {
    if (kind === "invoice.payment_failed") {
      const invoiceId = id(data.id, "in_");
      const invoice = await stripe(`invoices/${invoiceId}`);
      const parent = partnerAlertRecord(invoice.parent, "parent");
      const subscriptionId = id(partnerAlertRecord(parent.subscription_details, "subscriptionDetails").subscription, "sub_");
      const claim = db.prepare("SELECT * FROM qa_partner_stripe_claims WHERE subscription_id=?").get(subscriptionId) as Claim | undefined;
      if (!claim || sellerForClaim.get(claim.claim_id) !== account) return null;
      if (invoice.id !== invoiceId || invoice.livemode !== false || invoice.customer !== claim.customer_id
        || invoice.billing_reason !== "subscription_cycle") return null;
      // A failed attempt never creates a term or revokes already-paid coverage.
      return { claim, invoiceId, disposition: invoice.status === "paid" ? "retain" : "review" } as const;
    }

    let chargeId: string;
    let disputeStatus: unknown;
    if (kind === "charge.refunded") {
      chargeId = id(data.id, "ch_");
    } else {
      const disputeId = id(data.id, typeof data.id === "string" && data.id.startsWith("du_") ? "du_" : "dp_");
      const dispute = await stripe(`disputes/${disputeId}`);
      if (dispute.id !== disputeId || dispute.livemode !== false) throw new Error("Unverified Stripe dispute.");
      chargeId = id(dispute.charge, "ch_");
      disputeStatus = dispute.status;
    }
    const charge = await stripe(`charges/${chargeId}`);
    if (charge.id !== chargeId || charge.livemode !== false || charge.paid !== true) throw new Error("Unverified Stripe charge.");
    const paymentIntent = id(charge.payment_intent, "pi_");
    const term = db.prepare(`SELECT t.invoice_id,t.claim_id,s.amount_paid,s.currency FROM qa_partner_stripe_terms t
      JOIN qa_partner_stripe_settlements s ON s.invoice_id=t.invoice_id WHERE t.payment_intent_id=?`).get(paymentIntent) as { invoice_id: string; claim_id: string; amount_paid: number; currency: string } | undefined;
    const claim = term && find.get(term.claim_id) as Claim | undefined;
    if (!term) return { paymentIntent } as const;
    if (!claim || sellerForClaim.get(claim.claim_id) !== account) return null;
    if (charge.customer !== claim.customer_id || charge.currency !== term.currency || charge.amount !== term.amount_paid
      || charge.amount_captured !== term.amount_paid) throw new Error("Stripe adjustment settlement mismatch.");
    const fullRefund = kind === "charge.refunded" && charge.refunded === true && charge.amount_refunded === term.amount_paid;
    const lostDispute = kind === "charge.dispute.closed" && disputeStatus === "lost";
    const disposition = fullRefund || lostDispute ? "remove_candidate" : disputeStatus === "won" ? "retain" : "review";
    return { claim, invoiceId: term.invoice_id, disposition } as const;
  }

  async function applyAdjustment(eventId: string, digest: string, kind: string, adjustment: VerifiedAdjustment) {
    const { claim, invoiceId, disposition } = adjustment;
    const applied = db.transaction(() => {
      const inserted = db.prepare("INSERT INTO qa_partner_stripe_events VALUES(?,?) ON CONFLICT(event_id) DO NOTHING").run(eventId, digest);
      if (!inserted.changes) {
        if (db.prepare("SELECT digest FROM qa_partner_stripe_events WHERE event_id=?").pluck().get(eventId) !== digest) throw new Error("Event changed.");
        return false;
      }
      db.prepare("INSERT INTO qa_partner_stripe_adjustments VALUES(?,?,?,?,?)").run(eventId, claim.claim_id, invoiceId, kind, disposition);
      if (disposition === "remove_candidate") db.prepare(`INSERT INTO qa_partner_stripe_revoked_terms VALUES(?,?)
        ON CONFLICT(invoice_id) DO NOTHING`).run(invoiceId, eventId);
      db.prepare("DELETE FROM qa_partner_stripe_pending_adjustments WHERE event_id=?").run(eventId);
      return true;
    }).immediate();
    const recorded = db.prepare("SELECT disposition FROM qa_partner_stripe_adjustments WHERE event_id=?").pluck().get(eventId);
    await reconcile(claim, recorded === "remove_candidate", eventId);
    return { applied, disposition: recorded };
  }

  function expirePendingAdjustments() {
    db.prepare("DELETE FROM qa_partner_stripe_pending_adjustments WHERE received_at<?").run(input.nowMs() - 7 * 86_400_000);
  }
  return {
    readOccupiedMappings,
    async checkout(request: Request, communityId: string, offerKey: string): Promise<Response> {
      if (request.method !== "POST" || request.headers.get("origin") !== origin.origin) return new Response(null, { status: 403 });
      try {
        const { buyer, target } = input.authorizeCheckout(request, communityId, offerKey);
        const { offer, priceId, sellerAccount } = target;
        if (!buyer.paidPremium || buyer.hasExistingWhopPurchase || offer.communityId !== communityId
          || offerKey !== `${offer.offerId}:${offer.version}` || !offer.mappingIds.length) return new Response(null, { status: 403 });
        const account = input.connect ? id(sellerAccount, "acct_") : undefined;
        if (!input.connect && sellerAccount !== undefined) return new Response(null, { status: 503 });
        if (account && input.connect && partnerStripeSellerStatus(await input.connect.readSeller(account), account) !== "ready") {
          return new Response(null, { status: 503 });
        }
        const stripe = account && input.connect ? input.connect.stripeForAccount(account) : input.stripe;
        const price = await stripe(`prices/${id(priceId, "price_")}`);
        const cadence = partnerAlertRecord(price.recurring, "recurring");
        if (price.id !== priceId || price.livemode !== false || price.active !== true
          || price.currency !== offer.currency.code.toLowerCase() || String(price.unit_amount) !== membershipStripeAmount(offer.amountMinor, offer.currency.code)
          || cadence.interval_count !== offer.cadence.count || cadence.interval !== (offer.cadence.unit === "calendar_month" ? "month" : "day")) {
          throw new Error("Stripe price does not match the approved offer.");
        }
        const current = input.authorizeCheckout(request, communityId, offerKey);
        if (JSON.stringify(current) !== JSON.stringify({ buyer, target })) return new Response(null, { status: 409 });
        const claim = db.transaction(() => {
          const claimId = randomUUID();
          const inserted = db.prepare(`INSERT INTO qa_partner_stripe_claims(claim_id,user_id,community_id,offer_id,offer_version,price_id,mappings)
            VALUES(?,?,?,?,?,?,?) ON CONFLICT(user_id,community_id,offer_id,offer_version) DO NOTHING`)
            .run(claimId, buyer.userId, communityId, offer.offerId, offer.version, priceId, JSON.stringify(offer.mappingIds));
          if (inserted.changes && account) db.prepare("INSERT INTO qa_partner_stripe_claim_sellers VALUES(?,?)").run(claimId, account);
          return db.prepare(`SELECT * FROM qa_partner_stripe_claims WHERE user_id=? AND community_id=? AND offer_id=? AND offer_version=?`)
            .get(buyer.userId, communityId, offer.offerId, offer.version) as Claim;
        }).immediate();
        if (sellerForClaim.get(claim.claim_id) !== account) return new Response(null, { status: 409 });
        if (claim.price_id !== priceId || claim.mappings !== JSON.stringify(offer.mappingIds) || claim.subscription_id) {
          return new Response(null, { status: 409 });
        }
        if (claim.checkout_url) return Response.json({ url: claim.checkout_url });
        const session = await stripe("checkout/sessions", {
          mode: "subscription", "line_items[0][price]": priceId, "line_items[0][quantity]": "1",
          client_reference_id: claim.claim_id, "metadata[partner_sandbox_claim]": claim.claim_id,
          "subscription_data[metadata][partner_sandbox_claim]": claim.claim_id,
          success_url: `${origin.origin}/partner-channels`, cancel_url: `${origin.origin}/partner-channels`,
        }, `partner-sandbox-${claim.claim_id}`);
        const sessionId = id(session.id, "cs_test_");
        const url = new URL(String(session.url));
        if (session.livemode !== false || session.client_reference_id !== claim.claim_id
          || url.origin !== "https://checkout.stripe.com" || url.username || url.password) throw new Error("Invalid Stripe checkout.");
        db.prepare("UPDATE qa_partner_stripe_claims SET session_id=?,checkout_url=? WHERE claim_id=? AND session_id IS NULL")
          .run(sessionId, url.href, claim.claim_id);
        return Response.json({ url: url.href });
      } catch { return new Response(null, { status: 503 }); }
    },

    async invoiceWebhook(request: Request): Promise<Response> {
      if (request.method !== "POST") return new Response(null, { status: 405 });
      let event: Record<string, unknown>, raw: string;
      try {
        raw = await request.text();
        if (Buffer.byteLength(raw) > 1_000_000) return new Response(null, { status: 413 });
        event = verifyMembershipStripeEvent(raw, request.headers.get("stripe-signature") ?? "", input.signingSecret, input.nowMs());
        if (event.object !== "event" || event.livemode !== false) throw new Error("Stripe sandbox event required.");
        id(event.id, "evt_");
      } catch { return new Response(null, { status: 400 }); }
      if (typeof event.type !== "string" || (event.type !== "invoice.paid" && event.type !== "customer.subscription.deleted" && !billingAdjustments.has(event.type))) return new Response(null, { status: 204 });
      let account: string | undefined;
      try {
        if (input.connect) account = id(event.account, "acct_");
        else if (event.account !== undefined) return new Response(null, { status: 400 });
      } catch { return new Response(null, { status: 400 }); }
      if (account && !db.prepare("SELECT 1 FROM qa_partner_stripe_claim_sellers WHERE account_id=? LIMIT 1").get(account)) {
        return new Response(null, { status: 204 });
      }
      const stripe = account && input.connect ? input.connect.stripeForAccount(account) : input.stripe;
      const digest = createHash("sha256").update(raw).digest("hex");
      const prior = db.prepare("SELECT digest FROM qa_partner_stripe_events WHERE event_id=?").pluck().get(event.id)
        ?? db.prepare("SELECT digest FROM qa_partner_stripe_pending_adjustments WHERE event_id=?").pluck().get(event.id);
      if (prior !== undefined && prior !== digest) return new Response(null, { status: 409 });
      try {
        const data = partnerAlertRecord(partnerAlertRecord(event.data, "eventData").object, "resource");
        const eventId = id(event.id, "evt_");
        if (billingAdjustments.has(event.type)) {
          const kind = event.type;
          const adjustment = await resolveAdjustment(stripe, kind, data, account);
          if (!adjustment) return new Response(null, { status: 204 });
          if ("paymentIntent" in adjustment) {
            const resourceId = id(data.id, kind === "charge.refunded" ? "ch_" : String(data.id).startsWith("du_") ? "du_" : "dp_");
            const queued = db.transaction(() => {
              if (db.prepare("SELECT 1 FROM qa_partner_stripe_terms WHERE payment_intent_id=?").get(adjustment.paymentIntent)) return false;
              expirePendingAdjustments();
              db.prepare(`INSERT INTO qa_partner_stripe_pending_adjustments VALUES(?,?,?,?,?,?,?)
                ON CONFLICT(event_id) DO NOTHING`).run(eventId, digest, account ?? "", adjustment.paymentIntent, kind, resourceId, input.nowMs());
              if (db.prepare("SELECT digest FROM qa_partner_stripe_pending_adjustments WHERE event_id=?").pluck().get(eventId) !== digest) {
                throw new Error("Event changed.");
              }
              return true;
            }).immediate();
            if (queued) return new Response(null, { status: 202 });
            const verified = await resolveAdjustment(stripe, kind, data, account);
            return verified && "claim" in verified
              ? Response.json(await applyAdjustment(eventId, digest, kind, verified))
              : new Response(null, { status: 204 });
          }
          return Response.json(await applyAdjustment(eventId, digest, kind, adjustment));
        }
        if (event.type === "customer.subscription.deleted") {
          const subscriptionId = id(data.id, "sub_");
          const claim = db.prepare("SELECT * FROM qa_partner_stripe_claims WHERE subscription_id=?").get(subscriptionId) as Claim | undefined;
          if (!claim || sellerForClaim.get(claim.claim_id) !== account) return new Response(null, { status: 204 });
          const subscription = await stripe(`subscriptions/${subscriptionId}`);
          const now = Math.floor(input.nowMs() / 1000);
          if (subscription.id !== subscriptionId || subscription.livemode !== false || subscription.status !== "canceled"
            || subscription.customer !== claim.customer_id || !Number.isSafeInteger(subscription.ended_at)
            || Number(subscription.ended_at) > now || subscription.ended_at !== data.ended_at) throw new Error("Unverified Stripe subscription ending.");
          const metadata = partnerAlertRecord(subscription.metadata, "metadata");
          if (metadata.partner_sandbox_claim !== claim.claim_id) throw new Error("Stripe cancellation claim mismatch.");
          const applied = db.transaction(() => {
            const inserted = db.prepare("INSERT INTO qa_partner_stripe_events VALUES(?,?) ON CONFLICT(event_id) DO NOTHING").run(eventId, digest);
            if (!inserted.changes) {
              if (db.prepare("SELECT digest FROM qa_partner_stripe_events WHERE event_id=?").pluck().get(eventId) !== digest) throw new Error("Event changed.");
              return false;
            }
            db.prepare("INSERT INTO qa_partner_stripe_ends VALUES(?,?) ON CONFLICT(claim_id) DO NOTHING").run(claim.claim_id, subscription.ended_at);
            return true;
          }).immediate();
          await reconcile(claim, true, eventId);
          return Response.json({ applied });
        }
        const invoiceId = id(data.id, "in_");
        const invoice = await stripe(`invoices/${invoiceId}`);
        const subscriptionId = partnerStripeInvoiceSubscription(invoice);
        const subscription = await stripe(`subscriptions/${subscriptionId}`);
        const meta = partnerAlertRecord(subscription.metadata, "metadata");
        const claim = find.get(meta.partner_sandbox_claim ?? null) as Claim | undefined;
        if (!claim || sellerForClaim.get(claim.claim_id) !== account) return new Response(null, { status: 204 });
        const paid = await verifyPartnerAlertStripePaidInvoice({
          stripe, invoiceId, invoice, subscription, claimId: claim.claim_id,
          sessionId: claim.session_id, priceId: claim.price_id, livemode: false,
        });
        const applied = db.transaction(() => {
          const current = find.get(claim.claim_id) as Claim;
          if ((current.subscription_id && current.subscription_id !== subscriptionId) || (current.customer_id && current.customer_id !== paid.customerId)) {
            throw new Error("Stripe buyer changed.");
          }
          const inserted = db.prepare("INSERT INTO qa_partner_stripe_events VALUES(?,?) ON CONFLICT(event_id) DO NOTHING")
            .run(event.id, digest);
          if (!inserted.changes) {
            if (db.prepare("SELECT digest FROM qa_partner_stripe_events WHERE event_id=?").pluck().get(event.id) !== digest) throw new Error("Event changed.");
            return false;
          }
          db.prepare("UPDATE qa_partner_stripe_claims SET subscription_id=?,customer_id=? WHERE claim_id=?")
            .run(subscriptionId, paid.customerId, claim.claim_id);
          db.prepare("INSERT INTO qa_partner_stripe_terms VALUES (?,?,?,?,?,?) ON CONFLICT(invoice_id) DO NOTHING")
            .run(invoiceId, claim.claim_id, paid.invoicePaymentId, paid.paymentIntentId, paid.startsAtMs / 1000, paid.endsAtMs / 1000);
          db.prepare("INSERT INTO qa_partner_stripe_settlements VALUES(?,?,?,?) ON CONFLICT(invoice_id) DO NOTHING")
            .run(invoiceId, paid.currency, paid.stripeAmountMinor, eventId);
          return true;
        }).immediate();
        expirePendingAdjustments();
        const pending = db.prepare(`SELECT event_id,digest,kind,resource_id FROM qa_partner_stripe_pending_adjustments
          WHERE seller_scope=? AND payment_intent_id=? ORDER BY received_at,event_id`)
          .all(account ?? "", paid.paymentIntentId) as { event_id: string; digest: string; kind: string; resource_id: string }[];
        for (const adjustment of pending) {
          const verified = await resolveAdjustment(stripe, adjustment.kind, { id: adjustment.resource_id }, account);
          if (verified && "claim" in verified) await applyAdjustment(adjustment.event_id, adjustment.digest, adjustment.kind, verified);
        }
        await reconcile(claim, false, eventId);
        return Response.json({ applied });
      } catch { return new Response(null, { status: 503 }); }
    },
  };
}
