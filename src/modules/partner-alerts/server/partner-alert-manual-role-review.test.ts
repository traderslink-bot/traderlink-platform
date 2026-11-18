// @vitest-environment node
import { randomUUID } from "node:crypto";
import Database from "better-sqlite3";
import { expect, it, vi } from "vitest";
import { qualifiedPaidInput } from "../contracts/partner-alert-access-policy.test-fixture";
import { parsePartnerAlertRoleReview, removeReviewedPartnerAlertRole } from "./partner-alert-manual-role-review";
import { createPartnerAlertManagedRoleTransport } from "./partner-alert-managed-role-transport";
import { PartnerAlertRepository } from "./partner-alert-repository";
import type { PartnerAlertAuthority } from "./partner-alert-authority";

vi.mock("../../platform/server/privacy/platform-erasure-admission", () => ({
  requirePlatformErasureWriter: () => ({ assertLivePrincipal: () => undefined }),
}));
vi.mock("./partner-alert-admission", () => ({
  requirePartnerAlertAdmission: () => ({ assertCommunity: () => undefined }),
}));

it.each(["remove", "alternate purchase", "changed assignment", "retain"] as const)(
  "reviews an exact managed assignment with %s", async scenario => {
    const db = new Database(":memory:");
    const { ticket, offers, communityId, mappingId, userId, nowUtc } = qualifiedPaidInput();
    const { guildId, roleId, linkedDiscordUserId: memberId } = ticket.context;
    const channelId = "810000000000000006";
    const botId = "810000000000000004";
    const botRoleId = "810000000000000005";
    const otherRoleId = "810000000000000007";
    const offer = offers[0]!.offer;
    const roles = new Set([roleId, otherRoleId]);
    try {
      db.exec(`CREATE TABLE partner_alert_whop_inbox(community_id,event_id,status,environment,whop_account_id,resource_kind,resource_id,payload_sha256);
        CREATE TABLE partner_alert_memberships(community_id,user_id,offer_id,offer_version,environment,whop_account_id,membership_id,state);
        CREATE TABLE partner_alert_whop_paid_intervals(community_id,user_id,offer_id,offer_version,environment,whop_account_id,membership_id,ends_at_utc);
        CREATE TABLE partner_alert_offers(community_id,offer_id,version,offer_json);
        CREATE TABLE partner_alert_offer_channels(community_id,offer_id,offer_version,mapping_id);
        CREATE TABLE partner_alert_mappings(community_id,mapping_id,source_guild_id,source_channel_id,destination_guild_id,destination_channel_id,destination_role_id,ever_approved);
        CREATE TABLE partner_alert_role_jobs(community_id,mapping_id,user_id,discord_user_id,managed_assignment_ref,decision_revision,desired_ticket_json,
          applied_present,lease_token,desired_present,refresh_required,status,last_error_code);
        CREATE TABLE platform_premium_role_jobs(guild_id,role_id);
        CREATE TABLE partner_alert_audit_events(audit_event_id,community_id,actor_user_id,action,resource_id,detail_json,created_at_utc);`);
      db.prepare("INSERT INTO partner_alert_whop_inbox VALUES (?,'evt_review','failed','live',?,'membership','mem_primary',?)")
        .run(communityId, offer.whop.accountId, "a".repeat(64));
      const membership = db.prepare("INSERT INTO partner_alert_memberships VALUES (?,?,?,1,'live',?,?,?)");
      membership.run(communityId, userId, offer.offerId, offer.whop.accountId, "mem_primary", "inactive");
      if (scenario === "alternate purchase") membership.run(communityId, userId, offer.offerId, offer.whop.accountId, "mem_package", "active");
      db.prepare("INSERT INTO partner_alert_offers VALUES (?,?,1,?)").run(communityId, offer.offerId, JSON.stringify(offer));
      db.prepare("INSERT INTO partner_alert_offer_channels VALUES (?,?,1,?)").run(communityId, offer.offerId, mappingId);
      db.prepare("INSERT INTO partner_alert_mappings VALUES (?,?,?,?,?,?,?,1)")
        .run(communityId, mappingId, guildId, channelId, guildId, channelId, roleId);
      db.prepare("INSERT INTO partner_alert_role_jobs VALUES (?,?,?,?,?,1,?,1,NULL,1,0,'applied',NULL)")
        .run(communityId, mappingId, userId, memberId, randomUUID(), JSON.stringify(ticket));
      const actor = { kind: "operator", authority: "platform_owner", userId,
        observedAtUtc: ticket.context.observedAtUtc, validUntilUtc: ticket.context.validUntilUtc };
      const repo = new PartnerAlertRepository(db, { requireOperator: () => actor } as PartnerAlertAuthority,
        { destinationGuildId: guildId, nowUtc: () => nowUtc, createId: randomUUID });
      const operationId = randomUUID();
      const review = parsePartnerAlertRoleReview({ communityId, mappingId, eventId: "evt_review", membershipId: "mem_primary",
        decision: scenario === "retain" ? "retain" : "remove", evidenceNote: "Verified the scoped Whop evidence" });
      if (scenario === "alternate purchase") {
        expect(() => repo.readRoleReviewAssignment(review)).toThrow();
        expect([...roles]).toEqual([roleId, otherRoleId]);
        return;
      }
      const assignment = repo.readRoleReviewAssignment(review);
      db.transaction(() => repo.recordRoleReview(review, assignment, operationId, "decision"))();
      if (scenario === "retain") {
        expect(db.prepare("SELECT action FROM partner_alert_audit_events").pluck().all()).toEqual(["role_review.decision"]);
        expect([...roles]).toEqual([roleId, otherRoleId]);
        return;
      }
      const remove = vi.fn(() => roles.delete(roleId));
      const transport = createPartnerAlertManagedRoleTransport({ botUserId: botId, forbiddenRoleIds: [otherRoleId],
        readBinding: () => ({ mappingId, guildId, roleId, channelId, guildPermissions: "0", allowGrant: false }),
        createRest: () => ({ async request({ method, path }) {
          if (path === "/users/@me") return { status: 200, body: { id: botId, bot: true } };
          if (path === `/guilds/${guildId}/roles`) return { status: 200, body: [
            { id: guildId, managed: false, permissions: "0", position: 0 },
            { id: roleId, managed: false, permissions: "0", position: 1 },
            { id: botRoleId, managed: false, permissions: String(1 << 28), position: 2 },
          ] };
          if (path === `/guilds/${guildId}/members/${botId}`) return { status: 200, body: { user: { id: botId }, roles: [botRoleId] } };
          if (path === `/guilds/${guildId}/channels`) {
            if (scenario === "changed assignment") db.exec("UPDATE partner_alert_role_jobs SET decision_revision=2");
            return { status: 200, body: [{ id: channelId, guild_id: guildId, permission_overwrites: [] }] };
          }
          expect(method).toBe("DELETE");
          expect(path).toBe(`/guilds/${guildId}/members/${memberId}/roles/${roleId}`);
          remove();
          return { status: 204, body: null };
        } }),
      });
      const removed = await removeReviewedPartnerAlertRole({ assignment, operationId, transport,
        stillCurrent: () => JSON.stringify(repo.readRoleReviewAssignment(review)) === JSON.stringify(assignment) });
      if (scenario === "changed assignment") {
        expect(removed).toBe(false);
        expect(remove).not.toHaveBeenCalled();
        expect([...roles]).toEqual([roleId, otherRoleId]);
        return;
      }
      expect(removed).toBe(true);
      expect(remove).toHaveBeenCalledTimes(1);
      expect([...roles]).toEqual([otherRoleId]);
      db.transaction(() => repo.recordRoleReview(review, assignment, operationId, "removed"))();
      expect(db.prepare("SELECT applied_present FROM partner_alert_role_jobs").pluck().get()).toBe(0);
      expect(db.prepare("SELECT action FROM partner_alert_audit_events ORDER BY rowid").pluck().all())
        .toEqual(["role_review.decision", "role_review.removed"]);
      expect(() => repo.readRoleReviewAssignment(review)).toThrow();
    } finally { db.close(); }
  },
);
