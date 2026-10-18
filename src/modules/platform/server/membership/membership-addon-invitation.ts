import { createHash } from "node:crypto";
import type Database from "better-sqlite3";

/** Called within the amendment's immediate transaction. One amendment consumes
 * one invitation claim, regardless of how many selected add-ons it contains. */
export function reserveAddonInvitation(db: Database.Database, secret: string, addonIds: readonly string[], amendmentId: string, userId: string, targetOfferId: string, at: string, expires: string) {
  const link = db.prepare(`SELECT share_link_id FROM platform_membership_share_links l
    WHERE secret_sha256=? AND status='active' AND (expires_at_utc IS NULL OR expires_at_utc>?)
    AND (maximum_claims IS NULL OR claim_count+(SELECT COUNT(*) FROM platform_membership_claims c
      WHERE c.share_link_id=l.share_link_id AND c.state='reserved' AND (c.expires_at_utc>? OR EXISTS
        (SELECT 1 FROM platform_membership_addon_amendments a WHERE a.amendment_id=c.claim_id
          AND a.state IN ('confirming','pending_payment','reconciliation_required'))))<maximum_claims)`)
    .get(createHash("sha256").update(secret).digest("hex"), at, at) as {share_link_id:string}|undefined;
  if (!link || !addonIds.every(id => db.prepare("SELECT 1 FROM platform_membership_share_link_offers WHERE share_link_id=? AND offer_id=?").get(link.share_link_id,id))) {
    throw new Error("This private offer is expired, revoked or fully claimed. Reopen your invitation.");
  }
  db.prepare(`INSERT INTO platform_membership_claims
    (claim_id,user_id,offer_id,share_link_id,state,created_at_utc,expires_at_utc)
    VALUES (?,?,?,?,'reserved',?,?)`).run(amendmentId,userId,targetOfferId,link.share_link_id,at,expires);
}

/** Recheck immediately before payment confirmation; the raw secret is never stored. */
export function assertAddonInvitation(db: Database.Database, amendmentId: string, at: string) {
  const claim = db.prepare("SELECT state,share_link_id FROM platform_membership_claims WHERE claim_id=?").get(amendmentId) as {state:string;share_link_id:string|null}|undefined;
  if (!claim) return; // Existing public amendments do not carry an invitation.
  if (claim.state !== "reserved" || !db.prepare(`SELECT 1 FROM platform_membership_share_links
    WHERE share_link_id=? AND status='active' AND (expires_at_utc IS NULL OR expires_at_utc>?)
    AND (maximum_claims IS NULL OR claim_count<maximum_claims)`).get(claim.share_link_id,at)) {
    throw new Error("This private offer is no longer available. Reopen your invitation.");
  }
}
