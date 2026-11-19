// @vitest-environment node
import { randomUUID } from "node:crypto";
import type Database from "better-sqlite3";
import { afterEach, describe, expect, it, vi } from "vitest";
import { openPristinePlatformTestDatabase } from "@/src/test/pristine-platform-test-database";
import { captureSharedAlertPublication } from "./shared-alerts-read";
import { captureSharedAlertChange } from "./shared-alerts-publication-changes";
import { SharedAlertsRepository } from "./shared-alerts-repository";
import { SharedAlertError } from "./shared-alerts-errors";
import { ensureSharedAlertParts, readSharedAlertParts } from "./shared-alerts-parts";

// Real migrated disposable SQLite, real repository/access checks. These seeded
// principals are local fixtures, not evidence of hosted Discord ownership.
const at = "2026-11-19T02:00:00.000Z";
const databases: Database.Database[] = [];
afterEach(() => {
  vi.unstubAllEnvs();
  for (const database of databases.splice(0)) database.close();
});

function insert(database: Database.Database, table: string, row: Record<string, string | number | null>): void {
  const columns = Object.keys(row);
  database.prepare(`INSERT INTO ${table} (${columns.join(",")}) VALUES (${columns.map(() => "?").join(",")})`).run(...Object.values(row));
}

type NativeTestTarget = Readonly<{ guildId: string; channelId: string }>;
function fixture(targets: Readonly<{ source: NativeTestTarget; receiver: NativeTestTarget }> = {
  source: { guildId: "100000000000000011", channelId: "100000000000000021" },
  receiver: { guildId: "100000000000000012", channelId: "100000000000000022" },
}) {
  const database = openPristinePlatformTestDatabase();
  databases.push(database);
  const repository = new SharedAlertsRepository(database, () => at);
  const sourceId = randomUUID(), receiverId = randomUUID();
  function user(discordId: string) {
    const userId = randomUUID();
    insert(database, "platform_users", { user_id: userId, auth_provider: "discord", auth_subject: discordId, display_name: "Local test", status: "active", created_at_utc: at, updated_at_utc: at });
    insert(database, "platform_auth_identities", { user_id: userId, auth_provider: "discord", auth_subject: discordId, status: "active", linked_by_user_id: userId, created_at_utc: at, updated_at_utc: at });
    return userId;
  }
  const sourceOwner = user("100000000000000001"), receiverOwner = user("100000000000000002");
  const publisher = user("100000000000000003"), secondPublisher = user("100000000000000004");
  function discordMembership(userId: string, guildId: string, owner: boolean) {
    insert(database, "platform_discord_memberships", { user_id: userId, guild_id: guildId, username: "local-test", global_display_name: "Local test", role_ids_json: "[]", guild_owner: owner ? 1 : 0, first_verified_at_utc: at, last_verified_at_utc: at });
  }
  function community(communityId: string, ownerId: string, guildId: string, slug: string) {
    discordMembership(ownerId, guildId, true);
    insert(database, "traderlink_communities", { community_id: communityId, discord_guild_id: guildId, slug, display_name: slug, status: "active", owner_user_id: ownerId, created_at_utc: at, updated_at_utc: at });
    insert(database, "traderlink_community_memberships", { community_id: communityId, user_id: ownerId, status: "active", discord_verified_at_utc: at, first_verified_at_utc: at, updated_at_utc: at });
    repository.recordOwnerCheck(repository.ownerContext(communityId), "verified");
  }
  community(sourceId, sourceOwner, targets.source.guildId, "local-source");
  community(receiverId, receiverOwner, targets.receiver.guildId, "local-receiver");
  const source = { communityId: sourceId, userId: sourceOwner };
  const receiver = { communityId: receiverId, userId: receiverOwner };
  for (const userId of [publisher, secondPublisher]) {
    discordMembership(userId, targets.source.guildId, false);
    insert(database, "traderlink_community_memberships", { community_id: sourceId, user_id: userId, status: "active", discord_verified_at_utc: at, first_verified_at_utc: at, updated_at_utc: at });
    repository.setPublisher(source, userId, true);
  }
  const requestId = repository.createRequest({ actor: source, otherCommunityId: receiverId, direction: "send", showSourceCommunityName: true, message: "Local native acceptance request", agreed: true, publisherIds: [publisher] });
  const channel = { guildId: targets.receiver.guildId, channelId: targets.receiver.channelId, name: "local-test", verifiedAtUtc: at };
  function acceptance(version: number, requireApproval = true) {
    return { actor: receiver, requestId, version, showSourceCommunityName: true, publisherIds: [publisher], routes: [{ userId: publisher, channel, requireApproval }], agreed: true };
  }
  function activate(requireApproval = true) {
    repository.agree(acceptance(repository.requestForActor(receiver, requestId).terms_version, requireApproval));
    expect(repository.requestForActor(receiver, requestId).status).toBe("active");
  }
  function alert(distribution: "website" | "discord" = "discord") {
    const alertId = randomUUID(), audienceId = randomUUID();
    insert(database, "traderlink_community_audiences", { audience_id: audienceId, community_id: sourceId, name: `Local ${audienceId}`, mode: "everyone", status: "active", created_by_user_id: sourceOwner, created_at_utc: at, updated_at_utc: at });
    insert(database, "traderlink_community_alerts", { alert_id: alertId, community_id: sourceId, slug: `local-${alertId}`, author_user_id: publisher, title: "Local alert", symbol: "TEST", body: "Original local body", status: "published", audience_id: audienceId, published_at_utc: at, created_at_utc: at, updated_at_utc: at, publishing_mode: "discord_post" });
    insert(database, "traderlink_community_publication_distribution", { community_id: sourceId, object_type: "alert", object_id: alertId, publisher_user_id: publisher, distribution, destination_ids_json: "[]", updated_at_utc: at });
    captureSharedAlertPublication(repository, alertId, at);
    return alertId;
  }
  function delivery(alertId: string) {
    const row = database.prepare("SELECT delivery_id,content_revision,status FROM community_shared_alert_deliveries WHERE alert_id=? AND kind='publication'").get(alertId) as { delivery_id: string; content_revision: number; status: string } | undefined;
    expect(row).toBeDefined();
    return row!;
  }
  function facts() {
    return ["community_shared_alert_requests", "community_shared_alert_routes", "community_shared_alert_deliveries", "community_shared_alert_delivery_parts", "community_shared_alert_events", "community_shared_alert_messages", "community_shared_alert_read_positions", "community_alert_publisher_permissions", "community_shared_alert_owner_checks"].map(table => database.prepare(`SELECT * FROM ${table} ORDER BY 1,2`).all());
  }
  return { database, repository, source, receiver, publisher, secondPublisher, requestId, acceptance, activate, alert, delivery, facts };
}

function rejectedWithoutChanges(f: ReturnType<typeof fixture>, action: () => void, code: SharedAlertError["code"]) {
  const before = f.facts();
  expect(action).toThrow(expect.objectContaining({ code }));
  expect(f.facts()).toEqual(before);
}

describe("Shared Alerts native acceptance prerequisites", () => {
  const testsTarget = { guildId: "1559172784813514803", channelId: "1559172786176401410" };
  const mainTestTarget = { guildId: "1433570740430573642", channelId: "1546033958448529508" };
  const directions = [
    ["Tests to main designated alerts", testsTarget, mainTestTarget],
    ["Main designated alerts to Tests", mainTestTarget, testsTarget],
  ] as const;

  it.each(directions)("preserves separate native source owner and receiver route: %s", (_name, source, receiver) => {
    vi.stubEnv("TRADERLINK_SHARED_ALERTS_DELIVERY_ENABLED", "1");
    const f = fixture({ source, receiver });
    const sourceOwner = f.repository.requireOwner(f.source), receiverOwner = f.repository.requireOwner(f.receiver);
    expect(sourceOwner.guildId).toBe(source.guildId);
    expect(receiverOwner.guildId).toBe(receiver.guildId);
    expect(sourceOwner.guildId).not.toBe(receiverOwner.guildId);
    expect(sourceOwner.ownerUserId).not.toBe(receiverOwner.ownerUserId);
    f.activate();
    const d = f.delivery(f.alert());
    const admitted = f.database.prepare(`SELECT r.source_community_id,r.receiver_community_id,
      r.source_owner_user_id,r.source_owner_discord_id,r.receiver_owner_user_id,r.receiver_owner_discord_id,
      source.discord_guild_id source_guild,receiver.discord_guild_id receiver_guild,
      r.terms_version,r.source_approved_version,r.receiver_approved_version,
      route.author_user_id,route.channel_id route_channel,d.channel_id delivery_channel,
      route.revision route_revision,d.channel_revision,d.content_revision
      FROM community_shared_alert_deliveries d JOIN community_shared_alert_requests r ON r.request_id=d.request_id
      JOIN traderlink_communities source ON source.community_id=r.source_community_id
      JOIN traderlink_communities receiver ON receiver.community_id=r.receiver_community_id
      JOIN community_shared_alert_routes route ON route.request_id=d.request_id AND route.author_user_id=d.author_user_id
      WHERE d.delivery_id=?`).get(d.delivery_id) as Record<string, string | number>;
    expect(admitted).toMatchObject({
      source_community_id: sourceOwner.communityId, receiver_community_id: receiverOwner.communityId,
      source_owner_user_id: sourceOwner.ownerUserId, source_owner_discord_id: sourceOwner.discordUserId,
      receiver_owner_user_id: receiverOwner.ownerUserId, receiver_owner_discord_id: receiverOwner.discordUserId,
      source_guild: source.guildId, receiver_guild: receiver.guildId,
      author_user_id: f.publisher, route_channel: receiver.channelId, delivery_channel: receiver.channelId,
      channel_revision: admitted.route_revision,
      source_approved_version: admitted.terms_version, receiver_approved_version: admitted.terms_version,
    });
    rejectedWithoutChanges(f, () => f.repository.reviewDelivery(f.source, f.requestId, d.delivery_id, d.content_revision, true), "not_owner");
    f.repository.reviewDelivery(f.receiver, f.requestId, d.delivery_id, d.content_revision, true);
    expect(f.database.prepare("SELECT approved_by_user_id,status FROM community_shared_alert_deliveries WHERE delivery_id=?").get(d.delivery_id)).toEqual({ approved_by_user_id: receiverOwner.ownerUserId, status: "pending" });
    rejectedWithoutChanges(f, () => f.repository.configureRoute(f.source, f.requestId, f.publisher, Number(admitted.route_revision), { command: "save", requireApproval: false }), "not_owner");
  });

  it.each(directions)("rejects a source-guild destination and changed owner bindings: %s", (_name, source, receiver) => {
    const f = fixture({ source, receiver });
    const input = f.acceptance(1);
    const badTarget = { ...input, routes: [{ ...input.routes[0], channel: { ...input.routes[0].channel, guildId: source.guildId, channelId: source.channelId } }] };
    rejectedWithoutChanges(f, () => f.repository.agree(badTarget), "channel_unavailable");
    for (const side of ["source", "receiver"] as const) {
      const field = `${side}_owner_discord_id`;
      const original = (f.database.prepare(`SELECT ${field} subject FROM community_shared_alert_requests WHERE request_id=?`).get(f.requestId) as { subject: string }).subject;
      f.database.prepare(`UPDATE community_shared_alert_requests SET ${field}='100000000000000099' WHERE request_id=?`).run(f.requestId);
      rejectedWithoutChanges(f, () => f.repository.agree(input), "changed");
      f.database.prepare(`UPDATE community_shared_alert_requests SET ${field}=? WHERE request_id=?`).run(original, f.requestId);
    }
    f.repository.agree(input);
    const version = f.repository.requestForActor(f.receiver, f.requestId).terms_version;
    expect(f.repository.requestForActor(f.receiver, f.requestId).status).toBe("active");
    const route = f.database.prepare("SELECT revision FROM community_shared_alert_routes WHERE request_id=? AND author_user_id=?").get(f.requestId, f.publisher) as { revision: number };
    rejectedWithoutChanges(f, () => f.repository.configureRoute(f.receiver, f.requestId, f.publisher, route.revision, { command: "save", channel: badTarget.routes[0].channel }), "channel_unavailable");
    expect(f.repository.requestForActor(f.receiver, f.requestId).terms_version).toBe(version);
  });

  it("rejects the original receiver acceptance after another tab accepts and the source revises analysts", () => {
    const f = fixture();
    const original = f.acceptance(1);
    f.repository.agree(original); // A second genuine tab can submit this normal action.
    const active = f.repository.requestForActor(f.source, f.requestId);
    expect(active.status).toBe("active");
    f.repository.reopenAgreement(f.source, f.requestId, active.terms_version);
    const opened = f.repository.requestForActor(f.source, f.requestId);
    f.repository.agree({ actor: f.source, requestId: f.requestId, version: opened.terms_version, showSourceCommunityName: true, publisherIds: [f.secondPublisher], routes: [], agreed: true });
    const current = f.repository.requestForActor(f.source, f.requestId);
    expect(current.status).toBe("pending");
    expect(current.terms_version).toBeGreaterThan(original.version);
    rejectedWithoutChanges(f, () => f.repository.agree(original), "changed");
  });

  it("does not create a send request without an analyst", () => {
    const f = fixture();
    f.repository.lifecycle(f.source, f.requestId, 1, "withdraw");
    const before = f.facts();
    expect(() => f.repository.createRequest({ actor: f.source, otherCommunityId: f.receiver.communityId, direction: "send", showSourceCommunityName: true, message: "Missing analyst", agreed: true, publisherIds: [] })).toThrow(expect.objectContaining({ code: "publishers_required" }));
    expect(f.facts()).toEqual(before);
  });

  it("rejects stale content approval and accepts only the revised body", () => {
    vi.stubEnv("TRADERLINK_SHARED_ALERTS_DELIVERY_ENABLED", "1");
    const f = fixture(); f.activate();
    const alertId = f.alert(), original = f.delivery(alertId);
    f.database.prepare("UPDATE traderlink_community_alerts SET body='Revised local body' WHERE alert_id=?").run(alertId);
    captureSharedAlertChange(f.repository, { alertId, kind: "correction", actorUserId: f.publisher, atUtc: at });
    const revised = f.delivery(alertId);
    expect(revised.content_revision).toBe(original.content_revision + 1);
    rejectedWithoutChanges(f, () => f.repository.reviewDelivery(f.receiver, f.requestId, original.delivery_id, original.content_revision, true), "changed");
    f.repository.reviewDelivery(f.receiver, f.requestId, revised.delivery_id, revised.content_revision, true);
    expect(f.database.prepare("SELECT body,status,approved_content_revision FROM community_shared_alert_deliveries WHERE delivery_id=?").get(revised.delivery_id)).toEqual({ body: "Revised local body", status: "pending", approved_content_revision: revised.content_revision });
  });

  it("rejects source self-approval and receiver approval after native owner evidence is revoked", () => {
    vi.stubEnv("TRADERLINK_SHARED_ALERTS_DELIVERY_ENABLED", "1");
    const f = fixture(); f.activate(); const d = f.delivery(f.alert());
    rejectedWithoutChanges(f, () => f.repository.reviewDelivery(f.source, f.requestId, d.delivery_id, d.content_revision, true), "not_owner");
    f.database.prepare("UPDATE platform_discord_memberships SET guild_owner=0 WHERE user_id=?").run(f.receiver.userId);
    rejectedWithoutChanges(f, () => f.repository.reviewDelivery(f.receiver, f.requestId, d.delivery_id, d.content_revision, true), "not_owner");
  });

  it("revokes queued approval and does not restore a selected route on publisher regrant", () => {
    vi.stubEnv("TRADERLINK_SHARED_ALERTS_DELIVERY_ENABLED", "1");
    const f = fixture(); f.activate(); const d = f.delivery(f.alert());
    f.repository.setPublisher(f.source, f.publisher, false);
    expect(f.database.prepare("SELECT status FROM community_shared_alert_deliveries WHERE delivery_id=?").get(d.delivery_id)).toEqual({ status: "cancelled" });
    rejectedWithoutChanges(f, () => f.repository.reviewDelivery(f.receiver, f.requestId, d.delivery_id, d.content_revision, true), "changed");
    f.repository.setPublisher(f.source, f.publisher, true);
    expect(f.database.prepare("SELECT receiver_selected FROM community_shared_alert_routes WHERE request_id=? AND author_user_id=?").get(f.requestId, f.publisher)).toEqual({ receiver_selected: 0 });
    expect(f.database.prepare("SELECT status FROM community_shared_alert_deliveries WHERE delivery_id=?").get(d.delivery_id)).toEqual({ status: "cancelled" });
  });

  it("captures only enabled Discord intent and preserves canonical 32hex identity on repeated capture", () => {
    vi.stubEnv("TRADERLINK_SHARED_ALERTS_DELIVERY_ENABLED", "1");
    const f = fixture(); f.activate();
    const website = f.alert("website");
    expect(f.database.prepare("SELECT count(*) n FROM community_shared_alert_deliveries WHERE alert_id=?").get(website)).toEqual({ n: 0 });
    vi.stubEnv("TRADERLINK_SHARED_ALERTS_DELIVERY_ENABLED", "0");
    const disabled = f.alert();
    expect(f.database.prepare("SELECT count(*) n FROM community_shared_alert_deliveries WHERE alert_id=?").get(disabled)).toEqual({ n: 0 });
    vi.stubEnv("TRADERLINK_SHARED_ALERTS_DELIVERY_ENABLED", "1");
    const eligible = f.alert(), d = f.delivery(eligible);
    expect(d.delivery_id).toMatch(/^[0-9a-f]{32}$/u);
    captureSharedAlertPublication(f.repository, eligible, at);
    expect(f.database.prepare("SELECT delivery_id FROM community_shared_alert_deliveries WHERE alert_id=?").all(eligible)).toEqual([{ delivery_id: d.delivery_id }]);
  });

  it("does not mark a later unseen peer reply read, or move a read marker backwards", () => {
    const f = fixture();
    const first = (f.database.prepare("SELECT max(sequence) sequence FROM community_shared_alert_messages WHERE request_id=?").get(f.requestId) as { sequence: number }).sequence;
    f.repository.reply(f.source, f.requestId, "Later unseen reply");
    const latest = (f.database.prepare("SELECT max(sequence) sequence FROM community_shared_alert_messages WHERE request_id=?").get(f.requestId) as { sequence: number }).sequence;
    f.repository.markRead(f.receiver, f.requestId, first, 0);
    expect(f.database.prepare("SELECT count(*) n FROM community_shared_alert_messages WHERE request_id=? AND author_community_id<>? AND sequence>(SELECT last_read_sequence FROM community_shared_alert_read_positions WHERE request_id=? AND community_id=?)").get(f.requestId, f.receiver.communityId, f.requestId, f.receiver.communityId)).toEqual({ n: 1 });
    f.repository.markRead(f.receiver, f.requestId, latest, 0);
    f.repository.markRead(f.receiver, f.requestId, first, 0);
    expect(f.database.prepare("SELECT last_read_sequence FROM community_shared_alert_read_positions WHERE request_id=? AND community_id=?").get(f.requestId, f.receiver.communityId)).toEqual({ last_read_sequence: latest });
  });

  it("keeps already delivered multipart text and receipt immutable across a repeated claim", () => {
    vi.stubEnv("TRADERLINK_SHARED_ALERTS_DELIVERY_ENABLED", "1");
    const f = fixture(); f.activate(false); const d = f.delivery(f.alert());
    f.database.transaction(() => ensureSharedAlertParts(f.database, d.delivery_id, d.content_revision, ["First frozen body", "Second frozen body"], at)).immediate();
    f.database.prepare("UPDATE community_shared_alert_delivery_parts SET status='delivered',discord_message_id='100000000000000099',attempt_count=1 WHERE delivery_id=? AND part_number=1").run(d.delivery_id);
    const frozen = readSharedAlertParts(f.database, d.delivery_id, d.content_revision);
    f.database.transaction(() => ensureSharedAlertParts(f.database, d.delivery_id, d.content_revision, ["Replacement text"], at)).immediate();
    expect(readSharedAlertParts(f.database, d.delivery_id, d.content_revision)).toEqual(frozen);
    expect(() => f.database.prepare("UPDATE community_shared_alert_delivery_parts SET content='Mutated' WHERE delivery_id=? AND part_number=1").run(d.delivery_id)).toThrow("immutable");
  });
});
