// @vitest-environment node
import { randomUUID } from "node:crypto";
import type Database from "better-sqlite3";
import { afterEach, describe, expect, it, vi } from "vitest";
import { openPristinePlatformTestDatabase } from "@/src/test/pristine-platform-test-database";
import { SharedAlertsRepository } from "./shared-alerts-repository";
import { captureSharedAlertPublication } from "./shared-alerts-read";

// Local topology matches the discovered one-owner/two-guild shape. No hosted
// identity is copied, no provider request is made, and no ownership is inferred.
const at = "2026-11-19T03:00:00.000Z";
const targets = [
  { guildId: "1559172784813514803", channelId: "1559172786176401410" },
  { guildId: "1433570740430573642", channelId: "1546033958448529508" },
] as const;
const databases: Database.Database[] = [];
afterEach(() => {
  vi.unstubAllEnvs();
  for (const database of databases.splice(0)) database.close();
});

function fixture() {
  const database = openPristinePlatformTestDatabase(); databases.push(database);
  const repository = new SharedAlertsRepository(database, () => at);
  function insert(table: string, values: Record<string, string | number>) {
    const keys = Object.keys(values);
    database.prepare(`INSERT INTO ${table} (${keys.join(",")}) VALUES (${keys.map(() => "?").join(",")})`).run(...Object.values(values));
  }
  function user(subject: string) {
    const userId = randomUUID();
    insert("platform_users", { user_id: userId, auth_provider: "discord", auth_subject: subject, display_name: "Local cohort", status: "active", created_at_utc: at, updated_at_utc: at });
    insert("platform_auth_identities", { user_id: userId, auth_provider: "discord", auth_subject: subject, status: "active", linked_by_user_id: userId, created_at_utc: at, updated_at_utc: at });
    return userId;
  }
  const owner = user("100000000000000001"), publisher = user("100000000000000002");
  const communities = targets.map((target, index) => {
    const communityId = randomUUID();
    for (const userId of [owner, publisher]) insert("platform_discord_memberships", { user_id: userId, guild_id: target.guildId, username: "local-cohort", role_ids_json: "[]", guild_owner: userId === owner ? 1 : 0, first_verified_at_utc: at, last_verified_at_utc: at });
    insert("traderlink_communities", { community_id: communityId, discord_guild_id: target.guildId, slug: `cohort-${index}`, display_name: `Local cohort ${index}`, status: "active", owner_user_id: owner, created_at_utc: at, updated_at_utc: at });
    for (const userId of [owner, publisher]) insert("traderlink_community_memberships", { community_id: communityId, user_id: userId, status: "active", discord_verified_at_utc: at, first_verified_at_utc: at, updated_at_utc: at });
    const actor = { communityId, userId: owner };
    repository.recordOwnerCheck(repository.ownerContext(communityId), "verified");
    for (const userId of [owner, publisher]) repository.setPublisher(actor, userId, true);
    const audienceId = randomUUID();
    insert("traderlink_community_audiences", { audience_id: audienceId, community_id: communityId, name: "Local cohort", mode: "everyone", status: "active", created_by_user_id: owner, created_at_utc: at, updated_at_utc: at });
    return { actor, target, audienceId };
  });
  function request(sourceIndex: number) {
    const source = communities[sourceIndex], receiver = communities[1 - sourceIndex];
    const requestId = repository.createRequest({ actor: source.actor, otherCommunityId: receiver.actor.communityId, direction: "send", showSourceCommunityName: true, message: "Local same-owner request", agreed: true, publisherIds: [owner, publisher] });
    return { source, receiver, requestId };
  }
  function accept(r: ReturnType<typeof request>) {
    repository.agree({ actor: r.receiver.actor, requestId: r.requestId, version: repository.requestForActor(r.receiver.actor, r.requestId).terms_version, showSourceCommunityName: true, agreed: true, publisherIds: [owner, publisher], routes: [owner, publisher].map(userId => ({ userId, requireApproval: true, channel: { guildId: r.receiver.target.guildId, channelId: r.receiver.target.channelId, name: "local-cohort", verifiedAtUtc: at } })) });
  }
  function alert(r: ReturnType<typeof request>, author: string) {
    const alertId = randomUUID();
    insert("traderlink_community_alerts", { alert_id: alertId, community_id: r.source.actor.communityId, slug: `local-${alertId}`, author_user_id: author, title: "Local cohort alert", body: "Local same-owner approval check", status: "published", audience_id: r.source.audienceId, published_at_utc: at, publishing_mode: "discord_post", created_at_utc: at, updated_at_utc: at });
    insert("traderlink_community_publication_distribution", { community_id: r.source.actor.communityId, object_type: "alert", object_id: alertId, publisher_user_id: author, distribution: "discord", destination_ids_json: "[]", updated_at_utc: at });
    captureSharedAlertPublication(repository, alertId, at);
    return database.prepare("SELECT delivery_id,content_revision FROM community_shared_alert_deliveries WHERE alert_id=? AND request_id=?").get(alertId, r.requestId) as { delivery_id: string; content_revision: number };
  }
  function state() {
    return ["community_shared_alert_requests", "community_shared_alert_routes", "community_shared_alert_deliveries", "community_shared_alert_events"].map(table => database.prepare(`SELECT * FROM ${table} ORDER BY 1,2`).all());
  }
  return { database, repository, communities, owner, publisher, request, accept, alert, state };
}

describe("Shared Alerts actual-cohort same-owner contract", () => {
  it.each([0, 1])("keeps source and receiver approval contexts separate in direction %s", sourceIndex => {
    vi.stubEnv("TRADERLINK_SHARED_ALERTS_DELIVERY_ENABLED", "1");
    const f = fixture(), r = f.request(sourceIndex);
    const initial = f.repository.requestForActor(r.source.actor, r.requestId);
    expect(initial.source_owner_user_id).toBe(initial.receiver_owner_user_id);
    expect(initial.source_community_id).not.toBe(initial.receiver_community_id);
    expect(initial.status).toBe("pending");
    expect(initial.source_approved_version).toBe(1);
    expect(initial.receiver_approved_version).toBeNull();
    f.accept(r);
    expect(f.repository.requestForActor(r.receiver.actor, r.requestId).status).toBe("active");
    // A separate publisher and the common owner as author both use the same
    // receiver-community rule. The contract has no author != reviewer rule.
    for (const author of [f.publisher, f.owner]) {
      const d = f.alert(r, author), before = f.state();
      expect(d).toBeDefined();
      expect(() => f.repository.reviewDelivery(r.source.actor, r.requestId, d.delivery_id, d.content_revision, true)).toThrow(expect.objectContaining({ code: "not_owner" }));
      expect(() => f.repository.reviewDelivery({ communityId: r.receiver.actor.communityId, userId: f.publisher }, r.requestId, d.delivery_id, d.content_revision, true)).toThrow(expect.objectContaining({ code: "not_owner" }));
      expect(f.state()).toEqual(before);
      f.repository.reviewDelivery(r.receiver.actor, r.requestId, d.delivery_id, d.content_revision, true);
      expect(f.database.prepare("SELECT author_user_id,approved_by_user_id,channel_id,status FROM community_shared_alert_deliveries WHERE delivery_id=?").get(d.delivery_id)).toEqual({ author_user_id: author, approved_by_user_id: f.owner, channel_id: r.receiver.target.channelId, status: "pending" });
    }
  });

  it("requires an independent receiver acceptance for each direction despite one common owner", () => {
    const f = fixture(), first = f.request(0), reverse = f.request(1);
    f.accept(first);
    expect(f.repository.requestForActor(first.receiver.actor, first.requestId).status).toBe("active");
    expect(f.repository.requestForActor(reverse.receiver.actor, reverse.requestId)).toMatchObject({ status: "pending", receiver_approved_version: null });
    f.accept(reverse);
    expect(f.repository.requestForActor(reverse.receiver.actor, reverse.requestId).status).toBe("active");
  });

  it("does not borrow one guild's native owner evidence for the other guild or permit same-community sharing", () => {
    const f = fixture();
    expect(() => f.repository.createRequest({ actor: f.communities[0].actor, otherCommunityId: f.communities[0].actor.communityId, direction: "send", showSourceCommunityName: true, message: "Same community", agreed: true, publisherIds: [f.publisher] })).toThrow(expect.objectContaining({ code: "invalid" }));
    f.database.prepare("UPDATE platform_discord_memberships SET guild_owner=0 WHERE user_id=? AND guild_id=?").run(f.owner, targets[1].guildId);
    expect(f.repository.requireOwner(f.communities[0].actor).guildId).toBe(targets[0].guildId);
    expect(() => f.repository.requireOwner(f.communities[1].actor)).toThrow(expect.objectContaining({ code: "not_owner" }));
  });
});
