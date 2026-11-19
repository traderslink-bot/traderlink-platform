import { createHash } from "node:crypto";
import type Database from "better-sqlite3";
import { verifyMembershipStripeEvent } from "../../platform/server/membership/platform-membership-stripe";
import { partnerAlertRecord } from "../contracts/partner-alert-validation";
import { isPartnerStripeClaimAuthorized, readPartnerAlertStripeClaim, recordPartnerAlertStripePaidInvoice,
  type PartnerAlertStripeClaim } from "./database/partner-alert-stripe-invoice-writer";
import { readPartnerAlertStripeAdjustmentRevision, readPendingPartnerAlertStripeAdjustments, recordPartnerAlertStripeAdjustment,
  recordPendingPartnerAlertStripeAdjustment, type PartnerStripeAdjustment, type PartnerStripeAdjustmentKind }
  from "./database/partner-alert-stripe-adjustment-writer";
import { partnerStripeAdjustmentKind, partnerStripeAdjustmentResource,
  readPartnerAlertStripeAdjustment } from "./partner-alert-stripe-adjustment";
import { readPartnerAlertRequestText } from "./partner-alert-request-boundary";
import { partnerStripeSellerStatus } from "./partner-alert-stripe-onboarding";
import { readPartnerStripeOpenAuthorization, recordPartnerAlertStripeSeller, recordPartnerAlertStripeSellerDisconnect }
  from "./database/partner-alert-stripe-seller-writer";
import { partnerStripeCheckoutClaimMetadata, partnerStripeId, partnerStripeInvoiceSubscription, partnerStripeSubscriptionIsEnded,
  verifyPartnerAlertStripePaidInvoice,
  type PartnerAlertStripeRequest } from "./partner-alert-stripe-paid-invoice";

export function createPartnerAlertStripeInvoiceWebhook(input: Readonly<{
  database: Database.Database;
  environment: PartnerAlertStripeClaim["environment"];
  signingSecret: string;
  nowMs: () => number;
  stripeForAccount: (accountId: string) => PartnerAlertStripeRequest;
  runInWriter: <T>(claim: PartnerAlertStripeClaim, operation: () => T) => T;
  connectClientId?: string;
  readSeller?: (accountId: string) => Promise<Record<string, unknown>>;
  runSellerInWriter?: <T>(ownerUserId: string, operation: () => T) => T;
}>) {
  if (!input.signingSecret.startsWith("whsec_")) throw new Error("Stripe connected-account signing secret required.");
  const { database, environment } = input;
  const livemode = environment === "live";

  return async function receiveInvoice(request: Request): Promise<Response> {
    if (request.method !== "POST") return new Response(null, { status: 405 });
    const atMs = input.nowMs();
    let eventId: string;
    let accountId: string;
    let kind: "invoice.paid" | "account.disconnected" | "account.updated" | PartnerStripeAdjustmentKind;
    let resourceId: string;
    let digest: string;
    let occurredAtMs: number | undefined;
    let terminalDisputeOnly = false;
    try {
      const raw = await readPartnerAlertRequestText(request, 1_000_000);
      const event = verifyMembershipStripeEvent(raw, request.headers.get("stripe-signature") ?? "", input.signingSecret, atMs);
      if (event.object !== "event" || event.livemode !== livemode) throw new Error("Stripe event mode mismatch.");
      const eventType = event.type;
      const normalized = eventType === "account.application.deauthorized" ? "account.disconnected"
        : eventType === "invoice.paid" || eventType === "account.updated" ? eventType : partnerStripeAdjustmentKind(eventType);
      if (!normalized) return new Response(null, { status: 204 });
      kind = normalized;
      terminalDisputeOnly = kind === "charge.dispute.closed" && eventType !== kind;
      eventId = partnerStripeId(event.id, "evt_");
      accountId = partnerStripeId(event.account, "acct_");
      const data = partnerAlertRecord(event.data, "stripeEventData");
      const object = partnerAlertRecord(data.object, "stripeEventResource");
      if (kind === "account.disconnected") {
        if (!input.connectClientId || object.object !== "application" || object.id !== input.connectClientId) {
          return new Response(null, { status: 204 });
        }
        resourceId = accountId;
        if (typeof event.created === "number" && Number.isSafeInteger(event.created * 1_000) && event.created > 0) {
          occurredAtMs = event.created * 1_000;
        }
      } else if (kind === "account.updated") {
        if (object.id !== accountId || object.object !== "account") throw new Error("Stripe seller identity mismatch.");
        resourceId = accountId;
      } else if (kind === "charge.refunded" && eventType !== kind) {
        if (object.object !== "refund") throw new Error("Stripe refund identity mismatch.");
        if (object.charge === null) return new Response(null, { status: 204 });
        resourceId = partnerStripeId(object.charge, "ch_");
      } else {
        resourceId = kind === "invoice.paid" ? partnerStripeId(object.id, "in_") : partnerStripeAdjustmentResource(kind, object);
      }
      digest = createHash("sha256").update(raw).digest("hex");
    } catch { return new Response(null, { status: 400 }); }

    try {
      const previous = database.prepare(`SELECT body_sha256,kind,resource_id,status FROM partner_alert_stripe_events
        WHERE environment=? AND stripe_account_id=? AND event_id=?`).get(environment, accountId, eventId) as
        { body_sha256: string; kind: string; resource_id: string; status: string } | undefined;
      if (previous && (previous.body_sha256 !== digest || previous.kind !== kind || previous.resource_id !== resourceId)) {
        return new Response(null, { status: 409 });
      }
      if (previous && previous.status !== "pending") return Response.json({ applied: false });
      const sellerState = database.prepare(`SELECT state FROM partner_alert_stripe_sellers
        WHERE environment=? AND stripe_account_id=?`).pluck().get(environment, accountId);
      if (!sellerState || (kind === "invoice.paid" && sellerState === "disconnected")) {
        return new Response(null, { status: 204 });
      }
      if (kind === "account.disconnected") {
        const owner = database.prepare(`SELECT owner_user_id FROM partner_alert_stripe_sellers
          WHERE environment=? AND stripe_account_id=?`).pluck().get(environment, accountId);
        if (typeof owner !== "string") return new Response(null, { status: 204 });
        if (!input.runSellerInWriter) return new Response(null, { status: 503 });
        const applied = input.runSellerInWriter(owner, () => recordPartnerAlertStripeSellerDisconnect(database, {
          environment, accountId, ownerUserId: owner, eventId, digest, atMs, occurredAtMs,
        }));
        return Response.json({ applied });
      }
      if (kind === "account.updated") {
        const seller = database.prepare(`SELECT seller_id,community_id,owner_user_id FROM partner_alert_stripe_sellers
          WHERE environment=? AND stripe_account_id=? AND owner_user_id IS NOT NULL AND state!='disconnected'`)
          .get(environment, accountId) as { seller_id: string; community_id: string; owner_user_id: string } | undefined;
        if (!seller) return new Response(null, { status: 204 });
        const authorization = readPartnerStripeOpenAuthorization(database, seller.seller_id);
        if (!authorization) return new Response(null, { status: 204 });
        if (!input.runSellerInWriter || !input.readSeller) return new Response(null, { status: 503 });
        const status = partnerStripeSellerStatus(await input.readSeller(accountId), accountId, environment);
        if (status === "unavailable" || status === "unconnected") return new Response(null, { status: 503 });
        const applied = input.runSellerInWriter(seller.owner_user_id, () => {
          if (readPartnerStripeOpenAuthorization(database, seller.seller_id)?.generation !== authorization.generation) return false;
          recordPartnerAlertStripeSeller(database, {
            communityId: seller.community_id, ownerUserId: seller.owner_user_id, environment, accountId, atMs,
            state: status === "setup_required" ? "onboarding" : status,
          });
          return true;
        });
        return Response.json({ applied });
      }
      const stripe = input.stripeForAccount(accountId);
      if (kind !== "invoice.paid") {
        const revision = kind === "charge.refunded" || kind === "charge.dispute.created" || kind === "charge.dispute.closed"
          ? readPartnerAlertStripeAdjustmentRevision(database, environment, accountId, resourceId) : null;
        const adjustment = await readPartnerAlertStripeAdjustment({ database, stripe, environment, accountId,
          kind, resourceId, nowMs: atMs, terminalDisputeOnly });
        if (!adjustment) return new Response(null, { status: 204 });
        if (adjustment === "unsettled") return new Response(null, { status: 503 });
        if ("pendingInvoice" in adjustment) {
          input.runInWriter(adjustment.claim, () => recordPendingPartnerAlertStripeAdjustment(database, adjustment, { id: eventId, digest, atMs, kind }));
          return new Response(null, { status: 503 });
        }
        const applied = input.runInWriter(adjustment.claim, () => {
          if (revision !== null && revision !== readPartnerAlertStripeAdjustmentRevision(database, environment, accountId, resourceId)) {
            throw new Error("Stripe payment adjustment changed during verification.");
          }
          return recordPartnerAlertStripeAdjustment(database, adjustment, { id: eventId, digest, atMs, kind });
        });
        return Response.json({ applied });
      }

      const invoiceId = resourceId;
      const invoice = await stripe(`invoices/${invoiceId}`);
      if (invoice.id !== invoiceId || invoice.livemode !== livemode) throw new Error("Stripe invoice identity mismatch.");
      if (!["subscription_create", "subscription_cycle"].includes(String(invoice.billing_reason))) {
        return new Response(null, { status: 204 });
      }
      const subscription = await stripe(`subscriptions/${partnerStripeInvoiceSubscription(invoice)}`);
      const metadata = partnerAlertRecord(subscription.metadata, "stripeSubscriptionMetadata");
      const claimId = metadata[partnerStripeCheckoutClaimMetadata];
      if (typeof claimId !== "string" || !/^[0-9a-f-]{36}$/ui.test(claimId)) return new Response(null, { status: 204 });
      const claim = readPartnerAlertStripeClaim(database, environment, accountId, claimId);
      if (!claim || !isPartnerStripeClaimAuthorized(database, claim)) return new Response(null, { status: 204 });

      const paid = await verifyPartnerAlertStripePaidInvoice({ stripe, invoiceId, invoice, subscription, claimId,
        sessionId: claim.stripe_session_id, priceId: claim.stripe_price_id, livemode });
      const subscriptionEnded = partnerStripeSubscriptionIsEnded(subscription, atMs);
      const pending = readPendingPartnerAlertStripeAdjustments(database, claim);
      const reconciled: { event: (typeof pending)[number]; adjustment: PartnerStripeAdjustment }[] = [];
      const adjustmentSnapshots = new Map<string, Awaited<ReturnType<typeof readPartnerAlertStripeAdjustment>>>();
      for (const event of pending) {
        let adjustment = adjustmentSnapshots.get(event.resourceId);
        if (adjustment === undefined) {
          adjustment = await readPartnerAlertStripeAdjustment({ database, stripe, environment, accountId,
            kind: event.kind, resourceId: event.resourceId, nowMs: atMs, settlingInvoice: { claim, paid } });
          adjustmentSnapshots.set(event.resourceId, adjustment);
        }
        if (adjustment === "unsettled") continue;
        if (!adjustment || "pendingInvoice" in adjustment || adjustment.claim.claim_id !== claimId) {
          throw new Error("Pending Stripe adjustment could not be verified.");
        }
        if (adjustment.affectedInvoiceId === invoiceId) reconciled.push({ event, adjustment });
      }
      const applied = input.runInWriter(claim, () => {
        // Another adjustment may have arrived while Stripe was being read.
        // Retry the whole operation before any paid coverage becomes visible.
        if (JSON.stringify(readPendingPartnerAlertStripeAdjustments(database, claim)) !== JSON.stringify(pending)) {
          throw new Error("Pending Stripe adjustments changed.");
        }
        const recorded = recordPartnerAlertStripePaidInvoice(database, claim, paid, {
          id: eventId, digest, atMs, subscriptionEnded,
          lossUnderReview: reconciled.some(item => item.adjustment.disposition === "remove_candidate"),
        });
        if (reconciled.length && database.prepare(`SELECT 1 FROM partner_alert_stripe_paid_terms WHERE environment=?
          AND stripe_account_id=? AND claim_id=? AND invoice_id=? AND payment_intent_id=?`)
          .get(environment, accountId, claimId, invoiceId, paid.paymentIntentId)) {
          // The invoice writer has now bound the customer and subscription.
          const settled = readPartnerAlertStripeClaim(database, environment, accountId, claimId);
          if (!settled) throw new Error("Stripe checkout binding is unavailable.");
          for (const { event, adjustment } of reconciled) {
            recordPartnerAlertStripeAdjustment(database, { ...adjustment, claim: settled }, event);
          }
        }
        return recorded;
      });
      return Response.json({ applied });
    } catch { return new Response(null, { status: 503 }); }
  };
}
