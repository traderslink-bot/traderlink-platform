// @vitest-environment node
import { randomUUID } from "node:crypto";
import type Database from "better-sqlite3";
import { afterEach, describe, expect, it, vi } from "vitest";
import { openPristinePlatformTestDatabase } from "@/src/test/pristine-platform-test-database";
import { SharedAlertsRepository } from "./shared-alerts-repository";
import { SharedAlertsSourcePolicy } from "./shared-alerts-source-policy";
import { readSharedAlertsSourceOwner } from "./shared-alerts-source-read";
import { SharedAlertsDiscord } from "./shared-alerts-discord";
import { handleSharedAlertsSourceHttp } from "./shared-alerts-source-http";
import { loadSharedAlertsSourceOwnerPage } from "./shared-alerts-source-page-access";
import { GET as readSourceRoute, POST as mutateSourceRoute } from "@/app/api/communities/[communitySlug]/shared-alerts/source/route";
import { PLATFORM_MUTATION_REQUEST_HEADER } from "@/src/modules/platform/contracts/platform-request-security";

// Only infrastructure/request adapters are controlled. All owner/publisher/CAS SQL uses the migrated schema and real policies.
const boundary = vi.hoisted(() => ({ db: undefined as Database.Database | undefined, userId: "", revoked: false, afterAccess: undefined as (() => void) | undefined }));
vi.mock("@/src/modules/platform/server/database/open-platform-database", () => ({ openPlatformDatabase: () => boundary.db!, withPlatformDatabase: (_options: unknown, operation: (db: Database.Database) => unknown) => operation(boundary.db!) }));
vi.mock("@/src/modules/platform/server/database/open-readonly-platform-database", () => ({ withReadonlyPlatformDatabase: (_options: unknown, operation: (db: Database.Database) => unknown) => operation(boundary.db!) }));
vi.mock("@/src/modules/platform/server/authentication/require-platform-request-scope", () => {
  const identity = () => { if (boundary.revoked) throw new Error("Original session revoked"); return { mode: "platform_session", sessionId: "local-original-session", scope: { userId: boundary.userId, workspaceId: "local-test-workspace", activeAccountId: undefined } }; };
  return { requireTraderLinkPlatformRequestIdentity: identity, requireTraderLinkPlatformServerComponentPageIdentity: async () => identity() };
});
vi.mock("@/src/modules/communities/server/community-owner-review-request-identity", () => ({ requireCommunityOwnerReviewIdentity: (identity: unknown) => identity }));
vi.mock("@/src/modules/communities/server/community-request-access", () => ({ requireCommunityRequestAccess: async () => { boundary.afterAccess?.(); } }));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const at = "2026-11-19T17:00:00.000Z", guild = "1433570740430573642", channelId = "1546033958448529508";
const databases: Database.Database[] = [];
afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers(); vi.unstubAllEnvs(); for (const db of databases.splice(0)) db.close(); boundary.db = undefined; boundary.revoked = false; boundary.afterAccess = undefined; });
function fixture() {
  const db = openPristinePlatformTestDatabase(); databases.push(db);
  const ownerId = randomUUID(), publisherId = randomUUID(), communityId = randomUUID(), destinationId = randomUUID();
  const insert = (table: string, values: Record<string, string | number>) => {
    const keys = Object.keys(values); db.prepare(`INSERT INTO ${table}(${keys.join(",")}) VALUES(${keys.map(() => "?").join(",")})`).run(...Object.values(values));
  };
  for (const [userId, discordId, owner, username] of [[ownerId, "100000000000000001", 1, "owner"], [publisherId, "100000000000000002", 0, "publisher"]] as const) {
    insert("platform_users", { user_id: userId, auth_provider: "discord", auth_subject: discordId, display_name: "Same name", status: "active", created_at_utc: at, updated_at_utc: at });
    insert("platform_auth_identities", { user_id: userId, auth_provider: "discord", auth_subject: discordId, status: "active", linked_by_user_id: userId, created_at_utc: at, updated_at_utc: at });
    insert("platform_discord_memberships", { user_id: userId, guild_id: guild, username, global_display_name: "Same name", role_ids_json: "[]", guild_owner: owner, first_verified_at_utc: at, last_verified_at_utc: at });
  }
  insert("traderlink_communities", { community_id: communityId, discord_guild_id: guild, slug: "local-assignment", display_name: "Local assignment", status: "active", owner_user_id: ownerId, created_at_utc: at, updated_at_utc: at });
  for (const userId of [ownerId, publisherId]) insert("traderlink_community_memberships", { community_id: communityId, user_id: userId, status: "active", discord_verified_at_utc: at, first_verified_at_utc: at, updated_at_utc: at });
  const repository = new SharedAlertsRepository(db, () => at); repository.recordOwnerCheck(repository.ownerContext(communityId), "verified");
  for (const userId of [ownerId, publisherId]) repository.setPublisher({ communityId, userId: ownerId }, userId, true);
  insert("traderlink_community_discord_destinations", { destination_id: destinationId, community_id: communityId, name: "Configured source", discord_channel_id: channelId, content_type: "alerts", status: "active", updated_by_user_id: ownerId, created_at_utc: at, updated_at_utc: at });
  const policy = new SharedAlertsSourcePolicy(db), input = { communityId, ownerUserId: ownerId, destinationId, atUtc: at };
  const state = () => policy.assignmentState(input);
  const proof = { guildId: guild, channelId, name: "Source", verifiedAtUtc: at };
  const save = (userIds: readonly string[], expectedAssignmentState = state().assignmentStateToken, channel = proof) => policy.assignPublishers({ ...input, userIds, expectedAssignmentState, channel });
  return { db, ownerId, publisherId, communityId, destinationId, repository, policy, input, insert, state, proof, save };
}
function rows(db: Database.Database) {
  return JSON.stringify({ assignments: db.prepare("SELECT * FROM traderlink_community_destination_publishers ORDER BY destination_id,subject_kind,subject_id").all(), audit: db.prepare("SELECT * FROM traderlink_community_destination_audit ORDER BY audit_id").all() });
}
function ownerBoundary(f: ReturnType<typeof fixture>) {
  boundary.db = f.db; boundary.userId = f.ownerId;
  vi.spyOn(f.db, "close").mockImplementation(() => f.db);
  vi.useFakeTimers(); vi.setSystemTime(new Date(at)); vi.stubEnv("TRADERLINK_SHARED_ALERTS_OWNER_REVIEW_ENABLED", "1");
  return vi.spyOn(SharedAlertsDiscord.prototype, "channels").mockRejectedValue(new Error("Unrelated inventory unavailable"));
}
function assignmentRequest(f: ReturnType<typeof fixture>, publisherIds: readonly string[]) {
  const body = new URLSearchParams({ command: "assign_publishers", communitySlug: "local-assignment", destinationId: f.destinationId, expectedAssignmentState: f.state().assignmentStateToken });
  for (const id of publisherIds) body.append("publisherId", id);
  return new Request("https://app.traderslink.pro/api/communities/local-assignment/shared-alerts/source", { method: "POST", body,
    headers: { host: "app.traderslink.pro", origin: "https://app.traderslink.pro", "sec-fetch-site": "same-origin", [PLATFORM_MUTATION_REQUEST_HEADER]: "1" } });
}
describe("Source assignment policy on migrated SQLite", () => {
  it("requires exact added-user channel proof and preserves existing role rows", () => {
    const f = fixture(), before = rows(f.db);
    expect(() => f.policy.assignPublishers({ ...f.input, userIds: [f.publisherId], expectedAssignmentState: f.state().assignmentStateToken })).toThrow();
    expect(rows(f.db)).toBe(before);
    f.insert("traderlink_community_destination_publishers", { community_id: f.communityId, destination_id: f.destinationId, subject_kind: "role", subject_id: "100000000000000099", updated_by_user_id: f.ownerId, updated_at_utc: at });
    const next = f.save([f.publisherId]);
    expect(next.publisherIds).toEqual([f.publisherId]); expect(next.hasLegacyAssignments).toBe(true);
    expect(f.db.prepare("SELECT subject_id FROM traderlink_community_destination_publishers WHERE subject_kind='role'").get()).toEqual({ subject_id: "100000000000000099" });
  });
  it("allows genuine removal without selected-channel proof even when channel inventory is unavailable", () => {
    const f = fixture(); f.save([f.publisherId]);
    const state = f.state();
    const result = f.policy.assignPublishers({ ...f.input, userIds: [], expectedAssignmentState: state.assignmentStateToken });
    expect(result.publisherIds).toEqual([]); expect(result.assignmentStateToken).not.toBe(state.assignmentStateToken);
  });
  it("rejects a stale second snapshot before assignments or audit change", () => {
    const f = fixture(), first = f.state(); f.save([f.publisherId]); const before = rows(f.db);
    expect(() => f.save([f.ownerId], first.assignmentStateToken)).toThrow(expect.objectContaining({ code: "changed" }));
    expect(rows(f.db)).toBe(before);
  });
  it("binds channel proof and the snapshot across a target change", () => {
    const f = fixture(), first = f.state();
    f.db.prepare("UPDATE traderlink_community_discord_destinations SET discord_channel_id=? WHERE destination_id=?").run("1546033958448529599", f.destinationId);
    const before = rows(f.db);
    expect(() => f.save([f.publisherId], first.assignmentStateToken)).toThrow(expect.objectContaining({ code: "changed" }));
    expect(() => f.save([f.publisherId])).toThrow(expect.objectContaining({ code: "changed" })); expect(rows(f.db)).toBe(before);
  });
  it("rechecks a revoked publisher without resetting assignments and keeps unavailable selections readable", () => {
    const f = fixture(); f.save([f.publisherId]);
    f.repository.setPublisher({ communityId: f.communityId, userId: f.ownerId }, f.publisherId, false);
    const before = rows(f.db);
    expect(() => f.save([f.publisherId])).toThrow(); expect(rows(f.db)).toBe(before);
    const read = readSharedAlertsSourceOwner(f.db, { communitySlug: "local-assignment", userId: f.ownerId, atUtc: at });
    expect(read.destinations[0].publisherIds).toEqual([f.publisherId]);
    expect(read.publishers.find(person => person.id === f.publisherId)).toMatchObject({ available: false });
    expect(new Set(read.publishers.map(person => person.name)).size).toBe(read.publishers.length);
    expect(f.policy.assignPublishers({ ...f.input, userIds: [], expectedAssignmentState: f.state().assignmentStateToken }).publisherIds).toEqual([]);
  });
  it("denies nonowners, foreign destinations, other content types and duplicate users without writes", () => {
    const f = fixture(), before = rows(f.db);
    for (const details of [{ ownerUserId: f.publisherId }, { destinationId: randomUUID() }]) expect(() => f.policy.assignPublishers({ ...f.input, userIds: [], expectedAssignmentState: f.state().assignmentStateToken, ...details })).toThrow();
    expect(() => f.save([f.publisherId, f.publisherId])).toThrow();
    f.db.prepare("UPDATE traderlink_community_discord_destinations SET content_type='watchlists' WHERE destination_id=?").run(f.destinationId);
    expect(() => f.policy.assignmentState(f.input)).toThrow(); expect(rows(f.db)).toBe(before);
  });
});
describe("Assignment-only normal owner reader boundaries", () => {
  it("page entry and actual HTTP owner reload skip unrelated inventory while preserving general owner behavior", async () => {
    const f = fixture(), inventory = ownerBoundary(f), before = rows(f.db);
    const page = await loadSharedAlertsSourceOwnerPage("local-assignment", { mode: "assignments" });
    expect(page?.destinations[0].id).toBe(f.destinationId); expect(page?.channels).toBeUndefined();
    const request = new Request("http://localhost/api/communities/local-assignment/shared-alerts/source?communitySlug=local-assignment&view=owner_assignments");
    const response = await readSourceRoute(request, { params: Promise.resolve({ communitySlug: "local-assignment" }) });
    expect(response.status).toBe(200); expect((await response.json()).destinations[0].id).toBe(f.destinationId);
    expect(inventory).not.toHaveBeenCalled(); expect(rows(f.db)).toBe(before);
    await expect(loadSharedAlertsSourceOwnerPage("local-assignment")).rejects.toThrow("Unrelated inventory unavailable");
    expect(inventory).toHaveBeenCalledOnce();
  });
  it("does not disclose owner assignment data to a normal publisher", async () => {
    const f = fixture(); ownerBoundary(f); boundary.userId = f.publisherId;
    const response = await handleSharedAlertsSourceHttp(new Request("http://localhost/?communitySlug=local-assignment&view=owner_assignments"), vi.fn());
    expect(response.status).toBe(403); expect(await response.json()).not.toHaveProperty("publishers");
  });
  it("rechecks the original session after asynchronous request access before owner data", async () => {
    const f = fixture(), inventory = ownerBoundary(f); boundary.afterAccess = () => { boundary.revoked = true; };
    const response = await handleSharedAlertsSourceHttp(new Request("http://localhost/?communitySlug=local-assignment&view=owner_assignments"), vi.fn());
    expect(response.status).toBe(403); expect(await response.json()).not.toHaveProperty("destinations"); expect(inventory).not.toHaveBeenCalled();
  });
  it("normal original-Request POST binds the added publisher to trusted channel proof", async () => {
    const f = fixture(), inventory = ownerBoundary(f), proof = vi.spyOn(SharedAlertsDiscord.prototype, "verifyChannel").mockResolvedValue(f.proof);
    const response = await mutateSourceRoute(assignmentRequest(f, [f.publisherId]), { params: Promise.resolve({ communitySlug: "local-assignment" }) });
    expect(response.status).toBe(200); expect(await response.json()).toMatchObject({ status: "success", assignment: { destinationId: f.destinationId, publisherIds: [f.publisherId] } });
    expect(proof).toHaveBeenCalledWith(guild, channelId); expect(inventory).not.toHaveBeenCalled();
  });
  it("normal POST refuses original-session revocation during channel verification without assignment/audit writes", async () => {
    const f = fixture(); ownerBoundary(f); const before = rows(f.db);
    vi.spyOn(SharedAlertsDiscord.prototype, "verifyChannel").mockImplementation(async () => { boundary.revoked = true; return f.proof; });
    const response = await mutateSourceRoute(assignmentRequest(f, [f.publisherId]), { params: Promise.resolve({ communitySlug: "local-assignment" }) });
    expect(response.status).toBe(400); expect(await response.json()).toMatchObject({ status: "error" }); expect(rows(f.db)).toBe(before);
  });
});
