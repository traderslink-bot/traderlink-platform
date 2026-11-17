// @vitest-environment node
import Database from "better-sqlite3";
import { expect, it, vi } from "vitest";
import { qualifiedPaidInput } from "../contracts/partner-alert-access-policy.test-fixture";
import { PartnerAlertCurrentCommunityAccessReader } from "./partner-alert-community-access-reader";

const { current } = vi.hoisted(() => ({ current: vi.fn(() => true) }));
vi.mock("./partner-alert-current-context", () => ({
  PartnerAlertCurrentContext: class {
    capture() { return qualifiedPaidInput().ticket; }
    isCurrent() { return current(); }
  },
}));

it("projects the exact stored offer and refuses missing, stale or foreign buyer evidence", () => {
  const db = new Database(":memory:");
  try {
    const base = qualifiedPaidInput();
    const offer = base.offers[0]!.offer;
    const mapping = base.mappings[0]!;
    db.exec(`CREATE TABLE partner_alert_partners(community_id,status);
      CREATE TABLE partner_alert_mappings(community_id,mapping_id,destination_guild_id,destination_role_id,review_state);
      CREATE TABLE partner_alert_offers(community_id,offer_id,version,offer_json,review_state,whop_environment);
      CREATE TABLE partner_alert_whop_connections(community_id,environment,whop_account_id,status,valid_until_utc);
      CREATE TABLE partner_alert_whop_identities(user_id,environment,whop_user_ref,status);`);
    db.prepare("INSERT INTO partner_alert_partners VALUES (?,'active')").run(base.communityId);
    db.prepare("INSERT INTO partner_alert_mappings VALUES (?,?,?,?,'approved')").run(
      base.communityId, mapping.mappingId, mapping.destinationGuildId, mapping.destinationRoleId);
    db.prepare("INSERT INTO partner_alert_offers VALUES (?,?,?,?,'approved',?)").run(
      base.communityId, offer.offerId, offer.version, JSON.stringify(offer), offer.whop.environment);
    db.prepare("INSERT INTO partner_alert_whop_connections VALUES (?,'live',?,'verified',?)").run(
      base.communityId, offer.whop.accountId, base.ticket.context.validUntilUtc);
    db.prepare("INSERT INTO partner_alert_whop_identities VALUES (?,'live',?,'verified')").run(base.userId, base.whopUserRef);
    const facts = { ...base, whopUserRef: base.whopUserRef!, previousDiscordUserIds: [] };
    const proof = vi.fn((): typeof facts | null => facts);
    const reader = new PartnerAlertCurrentCommunityAccessReader(db, {
      policy: base.policy, nowUtc: () => base.nowUtc, readQualifiedEvidence: proof,
    });
    const target = { userId: base.userId, communityId: base.communityId, mappingId: base.mappingId };
    expect(reader.capture(target, base.ticket.premium)).toMatchObject({
      kind: "snapshot", input: { offers: [{ offer, accessState: "approved" }], memberships: base.memberships },
    });
    proof.mockReturnValueOnce(null);
    expect(reader.capture(target, base.ticket.premium)).toEqual({ kind: "unbound" });
    proof.mockReturnValueOnce({ ...facts, whopUserRef: "f".repeat(64) });
    expect(reader.capture(target, base.ticket.premium)).toEqual({ kind: "unbound" });
    current.mockReturnValueOnce(false);
    expect(reader.isCurrent(base.ticket)).toBe(false);
  } finally { db.close(); }
});
