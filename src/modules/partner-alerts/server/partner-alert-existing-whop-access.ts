import type { PartnerAlertAccessTicket, PartnerAlertEnvironment } from "../contracts/partner-alert-contracts";
import type { PartnerAlertExistingWhopAccess } from "../contracts/partner-alert-access-policy";
import { parsePartnerAlertOffer, partnerAlertRecord } from "../contracts/partner-alert-validation";
import type { PartnerAlertRoleTarget } from "./partner-alert-role-worker";
import { resolvePartnerAlertWhopVerificationContext,
  type PartnerAlertWhopVerificationRuntimeInput } from "./partner-alert-catalog-checkout";

// A past-due membership can have access while Whop retries the payment.
// Confirm its loss only through the current access check for every mapped product.
const statusesCompatibleWithAccessLoss = new Set(["canceled", "expired", "past_due"]);

/** Only previously bound buyers are candidates. Whop product access can veto
 * removal, including during grace, but cannot establish a new paid grant. */
export function readPartnerAlertExistingWhopTarget(
  db: PartnerAlertWhopVerificationRuntimeInput["database"], ticket: PartnerAlertAccessTicket,
  environment: PartnerAlertEnvironment = "live",
) {
  if (!db.inTransaction) return null;
  const { communityId, mappingId, userId, guildId } = ticket.context;
  const buyer = db.prepare(`SELECT b.whop_user_id,i.whop_user_ref
    FROM platform_premium_native_bindings b
    JOIN platform_premium_authorities a USING(authority_key)
    JOIN platform_premium_authority_policies p USING(policy_ref)
    JOIN platform_whop_user_links l ON l.user_id=a.user_id AND l.link_id=b.link_id
      AND l.whop_user_ref_hmac=b.whop_user_ref_hmac AND l.link_state='active'
    JOIN partner_alert_whop_identities i ON i.user_id=a.user_id AND i.environment=? AND i.status='verified'
    WHERE a.authority_key=? AND a.user_id=? AND a.phase='live' AND p.guild_id=? AND p.state='active'`)
    .get(environment, ticket.premium.scope.authorityKey, userId, guildId) as { whop_user_id: string; whop_user_ref: string } | undefined;
  if (!buyer) return null;
  const scope = [communityId, mappingId] as const;
  const offerRows = db.prepare(`SELECT o.offer_json FROM partner_alert_offer_channels c
    JOIN partner_alert_offers o ON (o.community_id,o.offer_id,o.version)=(c.community_id,c.offer_id,c.offer_version)
    WHERE c.community_id=? AND c.mapping_id=? AND o.whop_environment=? AND o.review_state IN ('approved','withdrawn')
    ORDER BY c.offer_id,c.offer_version LIMIT 21`).pluck().all(...scope, environment);
  if (!offerRows.length || offerRows.length > 20) return null;
  const offers = offerRows.map(json => parsePartnerAlertOffer(JSON.parse(String(json))));
  if (offers.some(offer => offer.communityId !== communityId || offer.whop.environment !== environment
    || !offer.mappingIds.includes(mappingId))) return null;
  const memberships = db.prepare(`SELECT m.membership_id,m.whop_account_id,m.offer_id,m.offer_version,m.basis
    FROM partner_alert_memberships m JOIN partner_alert_offer_channels c
    ON (c.community_id,c.offer_id,c.offer_version)=(m.community_id,m.offer_id,m.offer_version)
    WHERE c.community_id=? AND c.mapping_id=? AND m.user_id=? AND m.environment=? AND m.whop_user_ref=?
    ORDER BY m.membership_id LIMIT 251`).all(...scope, userId, environment, buyer.whop_user_ref) as
    { membership_id: string; whop_account_id: string; offer_id: string; offer_version: number; basis: string }[];
  if (memberships.length > 250 || !memberships.some(row => row.basis === "paid")) return null;
  const assigned = Boolean(db.prepare(`SELECT 1 FROM partner_alert_role_jobs
    WHERE community_id=? AND mapping_id=? AND user_id=? AND discord_user_id=? AND applied_present=1 AND managed_assignment_ref IS NOT NULL
      AND json_extract(desired_ticket_json,'$.context.guildId')=? AND json_extract(desired_ticket_json,'$.context.roleId')=?`)
    .get(...scope, userId, ticket.context.linkedDiscordUserId, guildId, ticket.context.roleId));
  return { whopUserId: buyer.whop_user_id, offers, memberships, assigned };
}

export async function verifyPartnerAlertExistingWhopAccess(input: PartnerAlertWhopVerificationRuntimeInput,
  target: NonNullable<ReturnType<typeof readPartnerAlertExistingWhopTarget>>): Promise<PartnerAlertExistingWhopAccess> {
  if (input.database.inTransaction) throw new Error("Whop access requires external verification outside the writer.");
  const signal = AbortSignal.timeout(8_000);
  const observedAtUtc = input.nowUtc();
  let validUntilUtc = new Date(Date.parse(observedAtUtc) + Math.min(30_000, input.maximumEvidenceAgeMs)).toISOString();
  const unknown = (): PartnerAlertExistingWhopAccess => ({ observedAtUtc, validUntilUtc, kind: "unknown", retainedOffers: [] });
  const retainedOffers: PartnerAlertExistingWhopAccess["retainedOffers"][number][] = [];
  let canConfirmLoss = true;
  try {
    for (const accountId of new Set(target.offers.map(offer => offer.whop.accountId))) {
      const offers = target.offers.filter(offer => offer.whop.accountId === accountId);
      const products = [...new Set(offers.map(offer => offer.whop.productId))];
      const { client, accountProof } = await resolvePartnerAlertWhopVerificationContext(input, offers[0]!, signal);
      if (accountProof.validUntilUtc < validUntilUtc) validUntilUtc = accountProof.validUntilUtc;
      const members = []; const ids = new Set<string>(); const cursors = new Set<string>();
      let after: string | undefined;
      for (let pageNumber = 0; pageNumber < 3; pageNumber++) {
        const page = await client.listMemberships({ whopUserId: target.whopUserId, productIds: products, after }, signal);
        for (const row of page.items) {
          if (ids.has(row.membershipId)) return unknown();
          ids.add(row.membershipId);
          members.push(row);
        }
        if (!page.hasNextPage) { after = undefined; break; }
        if (!page.endCursor || cursors.has(page.endCursor)) return unknown();
        after = page.endCursor;
        cursors.add(after);
      }
      if (after !== undefined) return unknown();
      if (members.some(row => !statusesCompatibleWithAccessLoss.has(row.status))) canConfirmLoss = false;
      const stillPaid = new Set<string>();
      for (const row of target.memberships.filter(member => member.whop_account_id === accountId)) {
        const offer = offers.find(item => item.offerId === row.offer_id && item.version === row.offer_version);
        if (!offer) return unknown();
        const member = members.find(member => member.membershipId === row.membership_id);
        let status: string;
        if (member) {
          if (member.productId !== offer.whop.productId || member.planId !== offer.whop.planId) return unknown();
          status = member.status;
        } else {
          // The discovery list can omit a known membership. Only a scoped
          // direct read can establish that membership's state in this case.
          const native = await client.retrieveMembership(row.membership_id, signal);
          if (native.user_id !== target.whopUserId || native.product_id !== offer.whop.productId
            || native.variant_id !== offer.whop.planId || typeof native.status !== "string") return unknown();
          status = native.status;
          if (!statusesCompatibleWithAccessLoss.has(status)) canConfirmLoss = false;
        }
        if (row.basis === "paid" && (status === "past_due" || status === "active")) {
          stillPaid.add(`${offer.offerId}:${offer.version}`);
        }
      }
      // Check the reviewed plan/product relationship before relying on a
      // product-level access response. Merchant IDs are checked by the client.
      for (const planId of new Set(offers.map(offer => offer.whop.planId))) {
        const native = await client.retrieveVariant(planId, signal);
        const product = partnerAlertRecord(native.product, "product").id;
        if (offers.some(offer => offer.whop.planId === planId && offer.whop.productId !== product)) return unknown();
      }
      for (const product of products) {
        const access = await client.checkProductAccess(target.whopUserId, product, signal);
        if (access !== "absent") canConfirmLoss = false;
        if (access === "customer" && target.assigned) {
          for (const offer of offers) {
            if (offer.whop.productId === product && stillPaid.has(`${offer.offerId}:${offer.version}`)) {
              retainedOffers.push({ offerId: offer.offerId, offerVersion: offer.version });
            }
          }
        }
      }
    }
    if (target.memberships.some(row => !target.offers.some(offer => offer.whop.accountId === row.whop_account_id))) return unknown();
    if (signal.aborted || observedAtUtc > input.nowUtc() || validUntilUtc <= input.nowUtc()) return unknown();
    return { observedAtUtc, validUntilUtc, kind: canConfirmLoss ? "absent" : retainedOffers.length ? "retained" : "unknown", retainedOffers };
  } catch { return unknown(); }
}

/** Bounded scan of assigned roles. Stripe and Whop evidence are rechecked by
 * the shared role worker before any Discord mutation. */
export function readPartnerAlertExistingWhopRolePage(db: PartnerAlertWhopVerificationRuntimeInput["database"],
  cursor: Pick<PartnerAlertRoleTarget, "mappingId" | "userId"> | null, nowUtc: string,
  environment: PartnerAlertEnvironment = "live") {
  const rows = db.prepare(`SELECT j.community_id,j.mapping_id,j.user_id,o.offer_id,o.version
    FROM partner_alert_role_jobs j JOIN partner_alert_memberships m
      ON m.community_id=j.community_id AND m.user_id=j.user_id AND m.environment=? AND m.basis='paid'
    JOIN partner_alert_offer_channels c ON (c.community_id,c.offer_id,c.offer_version,c.mapping_id)=
      (m.community_id,m.offer_id,m.offer_version,j.mapping_id)
    JOIN partner_alert_offers o ON (o.community_id,o.offer_id,o.version)=(m.community_id,m.offer_id,m.offer_version)
    WHERE j.applied_present=1 AND j.managed_assignment_ref IS NOT NULL
      AND (j.mapping_id,j.user_id) > (?,?) AND j.next_attempt_at_utc<=?
      AND o.review_state IN ('approved','withdrawn')
    GROUP BY j.mapping_id,j.user_id ORDER BY j.mapping_id,j.user_id LIMIT 10`)
    .all(environment, cursor?.mappingId ?? "", cursor?.userId ?? "", nowUtc) as
    { community_id: string; mapping_id: string; user_id: string; offer_id: string; version: number }[];
  return rows.map(row => ({ scope: { communityId: row.community_id, mappingId: row.mapping_id, userId: row.user_id },
    offerId: row.offer_id, offerVersion: row.version }));
}
