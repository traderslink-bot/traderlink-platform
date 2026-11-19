import { createHash, randomUUID } from "node:crypto";
import type Database from "better-sqlite3";
import { membershipStripeAmount } from "../../platform/server/membership/membership-stripe-http";
import { parsePartnerAlertCheckoutOffer, partnerAlertRecord } from "../contracts/partner-alert-validation";
import type { PartnerAlertEnvironment } from "../contracts/partner-alert-contracts";
import { partnerStripeSellerStatus } from "./partner-alert-stripe-onboarding";
import { partnerStripeId } from "./partner-alert-stripe-paid-invoice";
import { closePartnerAlertStripeCheckoutAttempt, hasPartnerAlertStripeCheckoutClosure } from "./database/partner-alert-stripe-checkout-attempt";
import { hasPartnerStripeAuthorizations } from "./database/partner-alert-stripe-seller-writer";
import { partnerAlertOfferSaleStateSql } from "./partner-alert-catalog-read";

export type StripeBindingScope = Readonly<{ userId: string; communityId: string; offerId: string; version: number }>;
type BindingRow = Readonly<{ seller_id: string; stripe_account_id: string; stripe_price_id: string | null;
  owner_user_id: string; amount_minor: number | null; currency: string | null; offer_json: string; authorization_generation: number }>;
type CheckoutClaim = Readonly<{ claim_id: string; stripe_account_id: string; stripe_price_id: string;
  stripe_session_id: string | null; stripe_subscription_id: string | null; authorization_generation: number }>;

export function createPartnerAlertNativeStripePriceBinding(input: Readonly<{
  database: Database.Database;
  environment?: PartnerAlertEnvironment;
  runInWriter: <T>(scope: StripeBindingScope, operation: () => T) => T;
  /** Rechecked on the caller's admitted writer connection. */
  assertBuyer: (scope: StripeBindingScope) => void;
  verifySeller: (account: string) => Promise<Record<string, unknown>>;
  verifyPrice: (account: string, price: string) => Promise<Record<string, unknown>>;
  createPrice?: (account: string, fields: Record<string, string>, idempotencyKey: string) => Promise<Record<string, unknown>>;
  nowMs: () => number;
}>) {
  const db = input.database;
  const environment = input.environment ?? "sandbox";
  const supportsClosure = hasPartnerAlertStripeCheckoutClosure(db);
  const supportsAuthorizations = hasPartnerStripeAuthorizations(db);
  const openAttempt = supportsClosure ? " AND checkout_closed_at_ms IS NULL" : "";
  const generationField = supportsAuthorizations ? "authorization_generation" : "1 AS authorization_generation";
  const generation = supportsAuthorizations ? `(SELECT a.generation FROM partner_alert_stripe_authorizations a
    WHERE a.seller_id=s.seller_id AND a.disconnected_at_ms IS NULL)` : "1";
  const select = db.prepare(`SELECT s.seller_id,s.stripe_account_id,s.owner_user_id,price.stripe_price_id,
        price.amount_minor,price.currency,o.offer_json,${generation} AS authorization_generation
    FROM traderlink_communities c
    JOIN partner_alert_stripe_sellers s ON s.community_id=c.community_id AND s.owner_user_id=c.owner_user_id
    JOIN partner_alert_partners p ON p.community_id=c.community_id AND p.owner_user_id=s.owner_user_id
    JOIN partner_alert_offers o ON o.community_id=c.community_id
    LEFT JOIN partner_alert_stripe_prices price ON price.seller_id=s.seller_id AND price.community_id=s.community_id
      AND price.environment=s.environment AND price.stripe_account_id=s.stripe_account_id
      AND price.offer_id=o.offer_id AND price.offer_version=o.version
    WHERE c.community_id=? AND o.offer_id=? AND o.version=? AND s.environment=?
      AND s.state='ready' AND c.status!='removed' AND price.withdrawn_at_ms IS NULL
      AND (${partnerAlertOfferSaleStateSql})='open'`);
  function current(scope: StripeBindingScope) {
    if (!db.inTransaction) throw new Error("Stripe checkout writer required.");
    input.assertBuyer(scope);
    const result = select.get(scope.communityId, scope.offerId, scope.version, environment) as BindingRow | undefined;
    if (!result || !Number.isSafeInteger(result.authorization_generation) || result.authorization_generation < 1) {
      throw new Error("Approved Stripe offer unavailable.");
    }
    return result;
  }
  async function reserve(scope: StripeBindingScope) {
    const original = input.runInWriter(scope, () => current(scope));
    const offer = parsePartnerAlertCheckoutOffer(JSON.parse(original.offer_json));
    const currency = offer.currency.code.toLowerCase();
    const amount = membershipStripeAmount(offer.amountMinor, offer.currency.code);
    const interval = offer.cadence.unit === "calendar_month" ? "month" : "day";
    if (offer.communityId !== scope.communityId || offer.offerId !== scope.offerId || offer.version !== scope.version
      || (original.stripe_price_id !== null && (original.amount_minor !== offer.amountMinor || original.currency !== currency))) {
      throw new Error("Stripe offer snapshot changed.");
    }
    const seller = await input.verifySeller(original.stripe_account_id);
    if (partnerStripeSellerStatus(seller, original.stripe_account_id, environment) !== "ready") throw new Error("Stripe seller is not ready.");
    const priceKey = createHash("sha256").update(JSON.stringify([original.seller_id, scope.offerId, scope.version])).digest("hex");
    const price = original.stripe_price_id
      ? await input.verifyPrice(original.stripe_account_id, original.stripe_price_id)
      : await input.createPrice?.(original.stripe_account_id, { currency, unit_amount: amount,
        "recurring[interval]": interval, "recurring[interval_count]": String(offer.cadence.count),
        "product_data[name]": offer.title }, `partner-price-${priceKey}`);
    if (!price) throw new Error("Stripe price is unavailable.");
    const priceId = partnerStripeId(price.id, "price_");
    const cadence = partnerAlertRecord(price.recurring, "stripePriceCadence");
    if (original.stripe_price_id && priceId !== original.stripe_price_id || price.livemode !== (environment === "live") || price.active !== true
      || price.currency !== currency || String(price.unit_amount) !== amount
      || cadence.interval_count !== offer.cadence.count || cadence.interval !== interval) {
      throw new Error("Stripe price verification failed.");
    }

    return input.runInWriter(scope, () => {
      const latest = current(scope);
      if (latest.seller_id !== original.seller_id || latest.stripe_account_id !== original.stripe_account_id
        || latest.authorization_generation !== original.authorization_generation
        || latest.owner_user_id !== original.owner_user_id || latest.offer_json !== original.offer_json
        || (latest.stripe_price_id !== null && (latest.stripe_price_id !== priceId
          || latest.amount_minor !== offer.amountMinor || latest.currency !== currency))) {
        throw new Error("Stripe offer authorization changed.");
      }
      if (!latest.stripe_price_id) {
        db.prepare(`INSERT INTO partner_alert_stripe_prices
          (seller_id,community_id,environment,stripe_account_id,offer_id,offer_version,stripe_price_id,currency,amount_minor,reviewed_at_ms)
          VALUES(?,?,?,?,?,?,?,?,?,?)`).run(original.seller_id, scope.communityId, environment, original.stripe_account_id,
          scope.offerId, scope.version, priceId, currency, offer.amountMinor, input.nowMs());
      }
      const keys = [scope.userId, original.seller_id, scope.communityId, environment, scope.offerId, scope.version] as const;
      const claimScope = `SELECT claim_id,stripe_account_id,stripe_price_id,stripe_session_id,stripe_subscription_id,${generationField}
        FROM partner_alert_stripe_checkout_claims WHERE buyer_user_id=? AND seller_id=? AND community_id=? AND environment=?
        AND offer_id=? AND offer_version=?${openAttempt}`;
      const generationBinding = supportsAuthorizations ? [latest.authorization_generation] : [];
      const prior = supportsAuthorizations ? db.prepare(`${claimScope} AND authorization_generation<?
        AND stripe_session_id IS NOT NULL ORDER BY authorization_generation DESC LIMIT 2`)
        .all(...keys, ...generationBinding) as CheckoutClaim[] : [];
      if (prior.length > 1) throw new Error("Stripe checkout history is unresolved.");
      let claim: CheckoutClaim | undefined = prior[0];
      if (!claim) {
        const generationColumn = supportsAuthorizations ? ",authorization_generation" : "";
        const generationValue = supportsAuthorizations ? ",?" : "";
        db.prepare(`INSERT INTO partner_alert_stripe_checkout_claims
          (claim_id,buyer_user_id,seller_id,community_id,environment,stripe_account_id,offer_id,offer_version,stripe_price_id,created_at_ms${generationColumn})
          VALUES(?,?,?,?,?,?,?,?,?,?${generationValue})
          ON CONFLICT(buyer_user_id,seller_id,offer_id,offer_version${generationColumn})
          ${supportsClosure ? "WHERE checkout_closed_at_ms IS NULL" : ""} DO NOTHING`)
          .run(randomUUID(), scope.userId, original.seller_id, scope.communityId, environment, original.stripe_account_id,
            scope.offerId, scope.version, priceId, input.nowMs(), ...generationBinding);
        claim = db.prepare(`${claimScope}${supportsAuthorizations ? " AND authorization_generation=?" : ""}`)
          .get(...keys, ...generationBinding) as CheckoutClaim | undefined;
      }
      if (!claim || claim.stripe_account_id !== original.stripe_account_id || claim.stripe_price_id !== priceId) {
        throw new Error("Stripe claim binding changed.");
      }
      return Object.freeze({ claimId: claim.claim_id, sellerAccount: claim.stripe_account_id, priceId: claim.stripe_price_id,
        sessionId: claim.stripe_session_id, subscriptionId: claim.stripe_subscription_id, offer,
        authorizationGeneration: latest.authorization_generation, historical: claim.authorization_generation !== latest.authorization_generation });
    });
  }

  function bindSession(scope: StripeBindingScope, claim: Awaited<ReturnType<typeof reserve>>, sessionId: string) {
    return input.runInWriter(scope, () => {
      const seller = current(scope);
      if (claim.historical || seller.stripe_account_id !== claim.sellerAccount || seller.stripe_price_id !== claim.priceId
        || seller.authorization_generation !== claim.authorizationGeneration) {
        throw new Error("Stripe checkout authorization changed.");
      }
      const changed = db.prepare(`UPDATE partner_alert_stripe_checkout_claims SET stripe_session_id=?
        WHERE claim_id=? AND buyer_user_id=? AND community_id=? AND seller_id=? AND offer_id=? AND offer_version=?
        AND stripe_subscription_id IS NULL AND (stripe_session_id IS NULL OR stripe_session_id=?)${openAttempt}`).run(
        sessionId, claim.claimId, scope.userId, scope.communityId, seller.seller_id, scope.offerId, scope.version, sessionId,
      );
      if (changed.changes !== 1) throw new Error("Stripe checkout identity changed.");
    });
  }

  function closeExpiredSession(scope: StripeBindingScope, claim: Awaited<ReturnType<typeof reserve>>) {
    if (!supportsClosure || !claim.sessionId || claim.subscriptionId) return false;
    const expiredSessionId = claim.sessionId;
    return input.runInWriter(scope, () => {
      const seller = current(scope);
      if (seller.stripe_account_id !== claim.sellerAccount || seller.stripe_price_id !== claim.priceId
        || seller.authorization_generation !== claim.authorizationGeneration) {
        throw new Error("Stripe checkout authorization changed.");
      }
      return closePartnerAlertStripeCheckoutAttempt(db, {
        claimId: claim.claimId, sessionId: expiredSessionId, reason: "checkout_expired", atMs: input.nowMs(),
      });
    });
  }

  return { reserve, bindSession, closeExpiredSession };
}
