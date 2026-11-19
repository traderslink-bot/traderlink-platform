import type Database from "better-sqlite3";

import type { PartnerAlertEnvironment, PartnerAlertOffer, PartnerAlertOfferDetails, PartnerAlertStripeOffer } from "../contracts/partner-alert-contracts";
import { PARTNER_ALERT_MAX_SELECTION, parsePartnerAlertOffer, parsePartnerAlertCheckoutOffer, partnerAlertId, partnerAlertText } from "../contracts/partner-alert-validation";
import { parsePartnerAlertWhopCheckoutHref,
  type PartnerAlertWhopCheckoutProof } from "./partner-alert-whop-normalization";

import { verifyPartnerAlertSubscriberOffer, type PartnerAlertSubscriberRoleObserver, type PartnerAlertSubscriberOffer } from "./partner-alert-subscriber-access";
import type { PartnerAlertRoleAuthority } from "./partner-alert-role-worker";

export type PartnerAlertCatalogSaleState = "paused" | "previous" | "closed";

export type PartnerAlertCatalogItem = Readonly<{
  communityId: string;
  offerKey: string;
  communityName: string;
  channels: readonly string[];
  price: string;
  cadence: string;
  access: "available" | "attention" | "subscribed";
  saleState?: PartnerAlertCatalogSaleState;
  billingProvider?: "stripe" | "whop";
  checkoutHref: string | null;
}>;

export type PartnerAlertCatalogRead = Readonly<{
  kind: "available";
  items: readonly PartnerAlertCatalogItem[];
}> | Readonly<{ kind: "unavailable" }>;

type CatalogRow = Readonly<{
  community_id: string;
  display_name: string;
  offer_json: string;
  has_purchase: number;
  has_stripe_purchase: number;
  sale_state: "open" | PartnerAlertCatalogSaleState;
}>;

// Drafts and submissions are amendments. An explicit withdrawal still closes sales.
export const partnerAlertSaleVersionSql = `(SELECT max(v.version) FROM partner_alert_offers v
  WHERE v.community_id=o.community_id AND v.offer_id=o.offer_id AND v.review_state IN ('approved','withdrawn'))`;

// Both the catalog and checkout request use the same offer and mapping states.
export const partnerAlertOfferSaleStateSql = `CASE
  WHEN p.status NOT IN ('active','publishing_paused') OR o.review_state!='approved' OR EXISTS (
    SELECT 1 FROM partner_alert_offer_channels oc
    JOIN partner_alert_mappings m ON m.community_id=oc.community_id AND m.mapping_id=oc.mapping_id
    WHERE oc.community_id=o.community_id AND oc.offer_id=o.offer_id AND oc.offer_version=o.version
      AND (m.review_state!='approved' OR m.approved_revision IS NOT m.revision)
  ) THEN 'closed'
  WHEN p.status='publishing_paused' OR EXISTS (
    SELECT 1 FROM partner_alert_offer_channels oc
    JOIN partner_alert_mappings m ON m.community_id=oc.community_id AND m.mapping_id=oc.mapping_id
    WHERE oc.community_id=o.community_id AND oc.offer_id=o.offer_id AND oc.offer_version=o.version
      AND m.delivery_state IS NOT 'ready'
  ) THEN 'paused'
  WHEN o.version!=${partnerAlertSaleVersionSql} THEN 'previous'
  ELSE 'open' END`;

export const partnerAlertWhopPurchaseSql = `EXISTS (SELECT 1 FROM partner_alert_memberships membership
  WHERE membership.user_id=@buyerUserId AND membership.community_id=o.community_id AND membership.offer_id=o.offer_id
    AND membership.offer_version=o.version AND membership.environment=o.whop_environment
    AND membership.whop_account_id=o.whop_account_id)`;

export const partnerAlertStripePurchaseSql = `EXISTS (SELECT 1 FROM partner_alert_stripe_checkout_claims claim
  WHERE claim.buyer_user_id=@buyerUserId AND claim.community_id=o.community_id AND claim.offer_id=o.offer_id
    AND claim.offer_version=o.version AND claim.environment=@environment AND claim.stripe_subscription_id IS NOT NULL)`;

function hasStripeCatalogPurchases(database: Database.Database): boolean {
  return Boolean(database.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='partner_alert_stripe_checkout_claims'").get());
}

export type PartnerAlertCatalogCandidate<Offer extends PartnerAlertOfferDetails = PartnerAlertOffer> = Readonly<{
  offer: Offer;
  item: Omit<PartnerAlertCatalogItem, "access" | "checkoutHref"> & Readonly<{ access: "available" | "attention" }>;
}>;
export type PartnerAlertCatalogCandidateRead = Readonly<{ kind: "available";
  candidates: readonly PartnerAlertCatalogCandidate[] }> | Readonly<{ kind: "unavailable" }>;
export type PartnerAlertCatalogCheckoutQualifier = (candidate: PartnerAlertCatalogCandidate,
  signal: AbortSignal) => Promise<PartnerAlertWhopCheckoutProof>;

function formatPrice(offer: PartnerAlertOfferDetails): string {
  const amount = offer.amountMinor / (10 ** offer.currency.minorUnitDigits);
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: offer.currency.code,
      minimumFractionDigits: offer.currency.minorUnitDigits,
      maximumFractionDigits: offer.currency.minorUnitDigits,
    }).format(amount);
  } catch {
    return `${offer.currency.code} ${amount.toFixed(offer.currency.minorUnitDigits)}`;
  }
}

function formatCadence(offer: PartnerAlertOfferDetails): string {
  if (offer.cadence.unit === "calendar_month") {
    return offer.cadence.count === 1 ? "month" : `${offer.cadence.count} months`;
  }
  return offer.cadence.count === 1 ? "day" : `${offer.cadence.count} days`;
}

function requiredTablesExist(database: Database.Database): boolean {
  const required = [
    "partner_alert_partners",
    "partner_alert_mappings",
    "partner_alert_offers",
    "partner_alert_offer_channels",
    "partner_alert_memberships",
  ];
  const rows = database.prepare<[], { name: string }>(`SELECT name FROM sqlite_master
WHERE type='table' AND name LIKE 'partner_alert_%'`).all();
  const names = new Set(rows.map((row) => row.name));
  return required.every((name) => names.has(name));
}

/**
 * Subscriber-safe catalog projection. The caller must authenticate the user
 * before opening the supplied read-only database. It exposes no source Discord
 * identifiers, provider bindings, account IDs, private publishing terms, actor
 * IDs, payment evidence or checkout target. A stored membership alone is not
 * qualified paid coverage, so it can only produce an attention state here.
 */
export function readPartnerAlertCatalog(
  database: Database.Database,
  userId: string,
  currentOffer: ((communityId: string, offer: PartnerAlertOffer) => boolean) | null = null,
): PartnerAlertCatalogRead {
  const read = readPartnerAlertCatalogCandidates(database, userId);
  if (read.kind === "unavailable" || typeof currentOffer !== "function") return Object.freeze({ kind: "unavailable" });
  try {
    return Object.freeze({ kind: "available", items: Object.freeze(read.candidates.map(({ offer, item }) => {
      if (currentOffer(offer.communityId, offer) !== true) throw new Error("Invalid Partner Channel offer qualification.");
      return Object.freeze({ ...item, checkoutHref: null });
    })) });
  } catch { return Object.freeze({ kind: "unavailable" }); }
}

export function readPartnerAlertCatalogCandidates(
  database: Database.Database,
  userId: string,
  stripeEnvironment?: PartnerAlertEnvironment,
  whopEnvironment: PartnerAlertEnvironment = "live",
): PartnerAlertCatalogCandidateRead {
  partnerAlertId(userId, "userId");
  if (!database.readonly || !requiredTablesExist(database)) {
    return Object.freeze({ kind: "unavailable" });
  }
  const stripePurchase = stripeEnvironment && hasStripeCatalogPurchases(database) ? partnerAlertStripePurchaseSql : "0";
  const rows = readCatalogRows(database, "o.whop_environment=@whopEnvironment", partnerAlertWhopPurchaseSql, stripePurchase,
    stripeEnvironment ? { buyerUserId: userId, environment: stripeEnvironment, whopEnvironment } : { buyerUserId: userId, whopEnvironment });
  if (!rows) return Object.freeze({ kind: "unavailable" });
  const candidates = rows.map(row => {
    const offer = parsePartnerAlertOffer(JSON.parse(row.offer_json));
    if (offer.whop.environment !== whopEnvironment) throw new Error("Invalid Partner Channel catalog projection.");
    return projectCatalogCandidate(database, row, offer);
  });
  return Object.freeze({ kind: "available", candidates: Object.freeze(candidates) });
}

export function readPartnerAlertStripeCatalogCandidates(database: Database.Database,
  buyer?: Readonly<{ userId: string; environment: "sandbox" | "live" }>):
  readonly PartnerAlertCatalogCandidate<PartnerAlertStripeOffer>[] {
  if (!database.readonly || !requiredTablesExist(database)) return [];
  const stripePurchase = buyer && hasStripeCatalogPurchases(database) ? partnerAlertStripePurchaseSql : "0";
  const rows = readCatalogRows(database, "o.whop_environment IS NULL", "0", stripePurchase,
    buyer ? { buyerUserId: partnerAlertId(buyer.userId, "userId"), environment: buyer.environment } : {});
  if (!rows) return [];
  return rows.map(row => {
    const offer = parsePartnerAlertCheckoutOffer(JSON.parse(row.offer_json));
    if (!("billingProvider" in offer)) throw new Error("Invalid Stripe catalog offer.");
    return projectCatalogCandidate(database, row, offer);
  });
}

function readCatalogRows(database: Database.Database, providerPredicate: string, whopPurchase: string, stripePurchase: string,
  binding: Readonly<Record<string, string>>): readonly CatalogRow[] | null {
  const rows = database.prepare<[Readonly<Record<string, string>>], CatalogRow>(`WITH offers AS (
    SELECT p.community_id,p.display_name,o.offer_json,o.offer_id,o.version,
      ${partnerAlertOfferSaleStateSql} AS sale_state, ${whopPurchase} AS has_whop_purchase, ${stripePurchase} AS has_stripe_purchase
    FROM partner_alert_partners p JOIN partner_alert_offers o ON o.community_id=p.community_id
    WHERE ${providerPredicate} AND o.review_state IN ('approved','withdrawn')
  ), ranked AS (
    SELECT offers.*, (has_whop_purchase OR has_stripe_purchase) AS has_purchase,
      row_number() OVER (PARTITION BY sale_state='open' ORDER BY display_name,offer_id,version DESC) AS row_number
    FROM offers WHERE sale_state='open' OR has_whop_purchase=1 OR has_stripe_purchase=1
  ) SELECT community_id,display_name,offer_json,sale_state,has_purchase,has_stripe_purchase FROM ranked
    WHERE row_number<=CASE WHEN sale_state='open' THEN 101 ELSE 100 END
    ORDER BY display_name,offer_id,version DESC`).all(binding);
  return rows.filter(row => row.sale_state === "open").length > 100 ? null : rows;
}

function projectCatalogCandidate<Offer extends PartnerAlertOfferDetails>(database: Database.Database,
  row: CatalogRow, offer: Offer): PartnerAlertCatalogCandidate<Offer> {
  const communityId = partnerAlertId(row.community_id, "communityId");
  if (offer.communityId !== communityId || offer.mappingIds.length > PARTNER_ALERT_MAX_SELECTION) {
    throw new Error("Invalid Partner Channel catalog projection.");
  }
  const names = database.prepare<[string, ...string[]], { mapping_id: string; display_name: string }>(`SELECT mapping_id,display_name
    FROM partner_alert_mappings WHERE community_id=? AND mapping_id IN (${offer.mappingIds.map(() => "?").join(",")})
    AND (review_state='approved' AND approved_revision=revision OR ${row.sale_state === "closed" ? "ever_approved=1" : "0"})
    ORDER BY mapping_id`).all(communityId, ...offer.mappingIds);
  if (names.length !== offer.mappingIds.length) throw new Error("Invalid Partner Channel mapping projection.");
  const byId = new Map(names.map(mapping => [mapping.mapping_id, partnerAlertText(mapping.display_name, "displayName")]));
  const channels = offer.mappingIds.map(mappingId => {
    const name = byId.get(mappingId);
    if (!name) throw new Error("Invalid Partner Channel mapping projection.");
    return name;
  });
  return Object.freeze({ offer, item: Object.freeze({ communityId,
    offerKey: `${offer.offerId}:${offer.version}`,
    communityName: partnerAlertText(row.display_name, "displayName"), channels: Object.freeze(channels),
    price: formatPrice(offer), cadence: formatCadence(offer),
    access: row.has_purchase || row.sale_state !== "open" ? "attention" : "available",
    ...(row.sale_state === "open" ? {} : { saleState: row.sale_state,
      billingProvider: row.has_stripe_purchase || "billingProvider" in offer ? "stripe" as const : "whop" as const }) }) });
}

/** Provider reads happen only after the caller authenticated the user and closed
 * the read-only database snapshot. Private provider IDs remain server-only. */
export async function qualifyPartnerAlertCatalogCheckout(
  read: PartnerAlertCatalogCandidateRead,
  qualifier: PartnerAlertCatalogCheckoutQualifier | null,
  signal: AbortSignal,
  nowUtc: string,
  subscriber?: Readonly<{
    userId: string;
    authority: PartnerAlertRoleAuthority;
    observeRoles: PartnerAlertSubscriberRoleObserver;
    nowUtc: () => string;
  }> | Readonly<{ userId: string; verify: (target: PartnerAlertSubscriberOffer, signal: AbortSignal) =>
    ReturnType<typeof verifyPartnerAlertSubscriberOffer> }>,
): Promise<PartnerAlertCatalogRead> {
  if (read.kind === "available" && read.candidates.length === 0) {
    return Object.freeze({ kind: "available", items: Object.freeze([]) });
  }
  if (read.kind === "unavailable" || signal.aborted) {
    return Object.freeze({ kind: "unavailable" });
  }
  try {
    const items: PartnerAlertCatalogItem[] = [];
    // Bound paid-role work independently from the public offer qualifier.
    // Cards outside this budget remain in their safe baseline state.
    let roleChecks = 0;
    for (const candidate of read.candidates) {
      if (signal.aborted) throw new Error("Catalog verification cancelled.");
      const { offer, item } = candidate;
      let checkoutHref: string | null = null;
      if (!item.saleState) {
        if (!qualifier) throw new Error("Catalog verification unavailable.");
        const proof = await qualifier(candidate, signal);
        const receipt = proof.receipt;
        if (signal.aborted || receipt.communityId !== offer.communityId
          || JSON.stringify(receipt.offer) !== JSON.stringify(offer)
          || receipt.binding.environment !== offer.whop.environment
          || receipt.binding.accountId !== offer.whop.accountId
          || receipt.binding.productId !== offer.whop.productId
          || receipt.binding.planId !== offer.whop.planId
          || receipt.membershipVerificationAuthorised !== true
          || receipt.observedAtUtc > nowUtc || receipt.validUntilUtc <= nowUtc) throw new Error("Catalog verification unavailable.");
        checkoutHref = parsePartnerAlertWhopCheckoutHref(proof.checkoutHref, offer.whop.planId);
      }
      let access: PartnerAlertCatalogItem["access"] = candidate.item.access;
      if (subscriber && item.saleState !== "closed" && access === "attention" && roleChecks < 5) {
        roleChecks++;
        const target = {
          userId: subscriber.userId, communityId: offer.communityId, offerId: offer.offerId,
          offerVersion: offer.version, mappingIds: offer.mappingIds,
        };
        const result = await ("verify" in subscriber ? subscriber.verify(target, signal)
          : verifyPartnerAlertSubscriberOffer(target, subscriber.authority, subscriber.nowUtc, subscriber.observeRoles, signal));
        if (result === "subscribed") access = "subscribed";
      }
      if (signal.aborted) return Object.freeze({ kind: "unavailable" });
      items.push(Object.freeze({ ...candidate.item, access, checkoutHref }));
    }
    return Object.freeze({ kind: "available", items: Object.freeze(items) });
  } catch { return Object.freeze({ kind: "unavailable" }); }
}
