// @vitest-environment node
import { createHash, randomUUID } from "node:crypto";
import { chmodSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type Database from "better-sqlite3";
import { afterEach, describe, expect, it, vi } from "vitest";
import { openPristinePlatformTestDatabase } from "@/src/test/pristine-platform-test-database";
import { communityCoachingPlanDeliveryContent } from "./community-coaching-plan-delivery-content";
import { readSelectedCommunityPlanDelivery } from "./community-selected-plan-delivery";
import { readSelectedCommunityDeliveryCase, runSelectedCommunityDeliveryCommand, type SelectedCommunityDeliveryCase } from "./community-selected-delivery-command";
import { assertSelectedCommunityInitialDelivery, readSelectedCommunityDeliveryDomain } from "./community-selected-delivery-domain";
import { SharedAlertsRepository } from "./shared-alerts-repository";
import { SharedAlertsSourcePublication } from "./shared-alerts-source-publication";
import { COMMUNITY_ADMISSION_STORAGE_DRAFT } from "./community-admission-storage";

const databases: Database.Database[] = [], directories: string[] = [];
afterEach(() => { vi.unstubAllEnvs(); for (const db of databases.splice(0)) db.close(); for (const dir of directories.splice(0)) rmSync(dir, { recursive: true, force: true }); });
const digest = (text: string) => createHash("sha256").update(text).digest("hex");
function planFixture(freeAdmission = true) {
  const db = openPristinePlatformTestDatabase(); databases.push(db);
  const userId = randomUUID(), communityId = randomUUID(), audienceId = randomUUID(), coachId = randomUUID(), planId = randomUUID(), destinationId = randomUUID(), deliveryId = randomUUID();
  const at = "2026-11-19T18:00:00.000Z", guild = "1559172784813514803", channel = "1559172786176401410";
  const insert = (table: string, row: Record<string, string | number>) => db.prepare(`INSERT INTO ${table}(${Object.keys(row).join(",")}) VALUES(${Object.keys(row).map(() => "?").join(",")})`).run(...Object.values(row));
  insert("platform_users", { user_id: userId, auth_provider: "discord", auth_subject: "100000000000000001", display_name: "Local coach", status: "active", created_at_utc: at, updated_at_utc: at });
  insert("platform_auth_identities", { user_id: userId, auth_provider: "discord", auth_subject: "100000000000000001", status: "active", linked_by_user_id: userId, created_at_utc: at, updated_at_utc: at });
  insert("platform_discord_memberships", { user_id: userId, guild_id: guild, username: "local-coach", role_ids_json: "[]", guild_owner: 1, first_verified_at_utc: at, last_verified_at_utc: at });
  insert("traderlink_communities", { community_id: communityId, discord_guild_id: guild, slug: "local-tests", display_name: "Local Tests", status: "active", owner_user_id: userId, created_at_utc: at, updated_at_utc: at });
  // Disposable source-policy fixture only: this checkout's old migration
  // prefix omits later admission storage. Install the exact existing schema
  // for real policy reads; no migration ledger/Core qualification is invented.
  if (freeAdmission) {
    if (!db.prepare("SELECT 1 FROM sqlite_schema WHERE type='table' AND name='traderlink_community_admission_invitations'").get()) db.exec(COMMUNITY_ADMISSION_STORAGE_DRAFT);
    insert("traderlink_community_admission_invitations", { discord_guild_id: guild, display_name: "Local Tests", actor_user_id: userId, reason: "Local source fixture", created_at_utc: at });
    insert("traderlink_community_admission_decisions", { decision_id: randomUUID(), discord_guild_id: guild, revision: 1, kind: "admission", status: "approved", actor_user_id: userId, reason: "Local source fixture", created_at_utc: at, source: "owner" });
    insert("traderlink_community_admission_decisions", { decision_id: randomUUID(), discord_guild_id: guild, revision: 1, kind: "coaching_exemption", status: "approved", actor_user_id: userId, reason: "Local source fixture", created_at_utc: at, admission_revision: 1, source: "owner" });
  }
  insert("traderlink_community_memberships", { community_id: communityId, user_id: userId, status: "active", discord_verified_at_utc: at, first_verified_at_utc: at, updated_at_utc: at });
  insert("traderlink_community_audiences", { audience_id: audienceId, community_id: communityId, name: "Everyone", mode: "everyone", status: "active", created_by_user_id: userId, created_at_utc: at, updated_at_utc: at });
  insert("traderlink_community_coach_profiles", { coach_profile_id: coachId, community_id: communityId, user_id: userId, coach_slug: "local-coach", display_name: "Local Coach", status: "active", created_at_utc: at, updated_at_utc: at });
  insert("traderlink_community_coaching_plans", { plan_id: planId, coach_profile_id: coachId, community_id: communityId, name: "Local Plan", description: "Local plan description", cadence: "weekly", price_label: "$20 per week", payment_instructions: "Contact the server", audience_id: audienceId, status: "active", created_at_utc: at, updated_at_utc: at });
  const addDestinationAndJob = () => {
    insert("traderlink_community_discord_destinations", { destination_id: destinationId, community_id: communityId, name: "General", discord_channel_id: channel, content_type: "coaching", status: "active", updated_by_user_id: userId, created_at_utc: at, updated_at_utc: at });
    insert("traderlink_community_content_deliveries", { delivery_id: deliveryId, community_id: communityId, object_type: "plan", object_id: planId, destination_id: destinationId, status: "pending", attempt_count: 0, requested_at_utc: at, updated_at_utc: at });
  };
  return { db, userId, communityId, audienceId, planId, coachId, deliveryId, destinationId, at, addDestinationAndJob };
}

describe("Selected delivery command source boundaries (not current native/provider qualification)", () => {
  it("does not fabricate a missing normal Coaching destination or job", () => {
    const f = planFixture();
    expect(() => readSelectedCommunityPlanDelivery(f.db, f.deliveryId)).toThrow();
    expect(f.db.prepare("SELECT count(*) n FROM traderlink_community_content_deliveries").get()).toEqual({ n: 0 });
    expect(f.db.prepare("SELECT count(*) n FROM traderlink_community_discord_destinations").get()).toEqual({ n: 0 });
  });
  it("pins real plan facts and rejects an ordinary Main target", () => {
    const f = planFixture(); f.addDestinationAndJob();
    const first = readSelectedCommunityPlanDelivery(f.db, f.deliveryId);
    expect(first).toMatchObject({ planId: f.planId, principalUserIds: [f.userId], requestedAtUtc: f.at });
    f.db.prepare("UPDATE traderlink_community_coaching_plans SET description='Changed' WHERE plan_id=?").run(f.planId);
    expect(readSelectedCommunityPlanDelivery(f.db, f.deliveryId).bindingSha256).not.toBe(first.bindingSha256);
    f.db.prepare("INSERT INTO platform_discord_memberships(user_id,guild_id,username,role_ids_json,guild_owner,first_verified_at_utc,last_verified_at_utc) VALUES(?,'1433570740430573642','local-coach','[]',1,?,?)").run(f.userId, f.at, f.at);
    f.db.prepare("UPDATE traderlink_communities SET discord_guild_id='1433570740430573642' WHERE community_id=?").run(f.communityId);
    expect(() => readSelectedCommunityPlanDelivery(f.db, f.deliveryId)).toThrow();
  });
  it("preserves the normal plan announcement text and active-plan boundary", () => {
    const f = planFixture(), input = { communityId: f.communityId, planId: f.planId, communitySlug: "local-tests", communityName: "Local Tests", publicOrigin: "https://app.example.test" };
    expect(communityCoachingPlanDeliveryContent(f.db, input)).toEqual({ content: "**Local Plan with Local Coach**\n$20 per week\nLocal plan description\n\nPayment and access are handled by Local Tests in Discord.\nOpen coaching details: https://app.example.test/communities/local-tests/coaches/local-coach", allowed_mentions: { parse: [] } });
    f.db.prepare("UPDATE traderlink_community_coaching_plans SET status='paused' WHERE plan_id=?").run(f.planId);
    expect(communityCoachingPlanDeliveryContent(f.db, input)).toBeNull();
  });
  it("establishes normal plan authority for an existing untouched job and retains the original evidence expiry", () => {
    const f = planFixture(); f.addDestinationAndJob();
    const before = f.db.prepare("SELECT * FROM traderlink_community_content_deliveries WHERE delivery_id=?").get(f.deliveryId);
    expect(() => assertSelectedCommunityInitialDelivery(f.db, f.deliveryId)).not.toThrow();
    const input = { kind: "coaching_plan" as const, deliveryId: f.deliveryId, communityId: f.communityId, guildId: "1559172784813514803", ownerUserId: f.userId, principalUserIds: [f.userId], atUtc: "2026-11-19T18:02:00.000Z" };
    const witness = readSelectedCommunityDeliveryDomain(f.db, input);
    expect(witness.validUntilUtc).toBe("2026-11-19T18:05:00.000Z");
    expect(witness.sha256).toMatch(/^[a-f0-9]{64}$/u);
    expect(f.db.prepare("SELECT * FROM traderlink_community_content_deliveries WHERE delivery_id=?").get(f.deliveryId)).toEqual(before);
    // Native observation refresh can retain equal role/owner facts, but the
    // command retains the original witness's expiry rather than replacing it.
    f.db.prepare("UPDATE platform_discord_memberships SET last_verified_at_utc='2026-11-19T18:02:00.000Z' WHERE user_id=?").run(f.userId);
    const refreshed = readSelectedCommunityDeliveryDomain(f.db, input);
    expect(refreshed.sha256).toBe(witness.sha256);
    expect(witness.validUntilUtc).toBe("2026-11-19T18:05:00.000Z");
    expect(refreshed.validUntilUtc).toBe("2026-11-19T18:07:00.000Z");
  });
  it("rejects current plan authority after real native owner permission is revoked", () => {
    const f = planFixture(); f.addDestinationAndJob();
    const input = { kind: "coaching_plan" as const, deliveryId: f.deliveryId, communityId: f.communityId, guildId: "1559172784813514803", ownerUserId: f.userId, principalUserIds: [f.userId], atUtc: "2026-11-19T18:02:00.000Z" };
    expect(readSelectedCommunityDeliveryDomain(f.db, input).sha256).toMatch(/^[a-f0-9]{64}$/u);
    f.db.prepare("UPDATE platform_discord_memberships SET guild_owner=0 WHERE user_id=?").run(f.userId);
    expect(() => readSelectedCommunityDeliveryDomain(f.db, input)).toThrow();
    expect(f.db.prepare("SELECT status,attempt_count FROM traderlink_community_content_deliveries WHERE delivery_id=?").get(f.deliveryId)).toEqual({ status: "pending", attempt_count: 0 });
  });
  it("rejects stale native role evidence instead of extending the original claim window", () => {
    const f = planFixture(); f.addDestinationAndJob();
    expect(() => readSelectedCommunityDeliveryDomain(f.db, { kind: "coaching_plan", deliveryId: f.deliveryId, communityId: f.communityId, guildId: "1559172784813514803", ownerUserId: f.userId, principalUserIds: [f.userId], atUtc: "2026-11-19T18:06:00.000Z" })).toThrow();
  });
  it("keeps the normal required Coaching setup gate when no free admission exists", () => {
    const f = planFixture(false); f.addDestinationAndJob();
    expect(() => readSelectedCommunityDeliveryDomain(f.db, { kind: "coaching_plan", deliveryId: f.deliveryId, communityId: f.communityId, guildId: "1559172784813514803", ownerUserId: f.userId, principalUserIds: [f.userId], atUtc: "2026-11-19T18:02:00.000Z" })).toThrow("Complete the required coach signup");
    expect(f.db.prepare("SELECT status,attempt_count FROM traderlink_community_content_deliveries WHERE delivery_id=?").get(f.deliveryId)).toEqual({ status: "pending", attempt_count: 0 });
  });
  it.each([
    { status: "pending", attemptCount: 1, outcome: "pending", messageId: null },
    { status: "failed", attemptCount: 0, outcome: "pending", messageId: null },
    { status: "sending", attemptCount: 1, outcome: "uncertain", messageId: null },
    { status: "pending", attemptCount: 0, outcome: "uncertain", messageId: null },
    { status: "delivered", attemptCount: 1, outcome: "confirmed", messageId: "1559172786176401999" },
  ])("rejects previous effect state $status/$attemptCount/$outcome without resetting it", state => {
    const f = planFixture(); f.addDestinationAndJob();
    f.db.prepare("UPDATE traderlink_community_content_deliveries SET status=?,attempt_count=?,delivery_outcome=?,discord_message_id=? WHERE delivery_id=?").run(state.status, state.attemptCount, state.outcome, state.messageId, f.deliveryId);
    const before = f.db.prepare("SELECT * FROM traderlink_community_content_deliveries WHERE delivery_id=?").get(f.deliveryId);
    expect(() => assertSelectedCommunityInitialDelivery(f.db, f.deliveryId)).toThrow();
    expect(f.db.prepare("SELECT * FROM traderlink_community_content_deliveries WHERE delivery_id=?").get(f.deliveryId)).toEqual(before);
  });
  it("rejects previous effect history even when a row superficially looks pending and unattempted", () => {
    const f = planFixture(); f.addDestinationAndJob();
    f.db.prepare("INSERT INTO traderlink_community_delivery_attempt_history(event_id,attempt_key,delivery_id,community_id,outcome,occurred_at_utc) VALUES(?,?,?,?,'uncertain',?)").run(randomUUID(), f.deliveryId, f.deliveryId, f.communityId, f.at);
    const before = f.db.prepare("SELECT * FROM traderlink_community_content_deliveries WHERE delivery_id=?").get(f.deliveryId);
    expect(() => assertSelectedCommunityInitialDelivery(f.db, f.deliveryId)).toThrow();
    expect(f.db.prepare("SELECT * FROM traderlink_community_content_deliveries WHERE delivery_id=?").get(f.deliveryId)).toEqual(before);
  });
  it("captures actual source intent and detects revoke/regrant even when publishing becomes enabled again", () => {
    const f = planFixture(), actor = { communityId: f.communityId, userId: f.userId };
    const repository = new SharedAlertsRepository(f.db, () => f.at);
    repository.recordOwnerCheck(repository.ownerContext(f.communityId), "verified");
    repository.setPublisher(actor, f.userId, true);
    f.db.prepare("INSERT INTO traderlink_community_discord_destinations(destination_id,community_id,name,discord_channel_id,content_type,status,updated_by_user_id,created_at_utc,updated_at_utc) VALUES(?,?,'General','1559172786176401410','alerts','active',?,?,?)").run(f.destinationId, f.communityId, f.userId, f.at, f.at);
    const alert = new SharedAlertsSourcePublication(f.db).save({ communityId: f.communityId, actorUserId: f.userId, audienceId: f.audienceId, title: "Local initial source", body: "Local source body", status: "published", publishingMode: "discord_post", selection: { distribution: "discord", destinationIds: [f.destinationId] }, atUtc: f.at });
    const job = f.db.prepare("SELECT delivery_id FROM traderlink_community_content_deliveries WHERE object_id=?").get(alert.alertId) as { delivery_id: string };
    const input = { kind: "source_alert" as const, deliveryId: job.delivery_id, communityId: f.communityId, guildId: "1559172784813514803", ownerUserId: f.userId, principalUserIds: [f.userId], atUtc: "2026-11-19T18:02:00.000Z" };
    const original = readSelectedCommunityDeliveryDomain(f.db, input);
    const later = new SharedAlertsRepository(f.db, () => "2026-11-19T18:01:00.000Z");
    later.setPublisher(actor, f.userId, false);
    expect(() => readSelectedCommunityDeliveryDomain(f.db, input)).toThrow();
    later.setPublisher(actor, f.userId, true);
    expect(readSelectedCommunityDeliveryDomain(f.db, input).sha256).not.toBe(original.sha256);
    expect(f.db.prepare("SELECT status,attempt_count FROM traderlink_community_content_deliveries WHERE delivery_id=?").get(job.delivery_id)).toEqual({ status: "pending", attempt_count: 0 });
  });
  it("requires the operator-pinned case bytes and rejects symlink/oversize/writable inputs", () => {
    const dir = mkdtempSync(join(tmpdir(), "selected-case-test-")); directories.push(dir);
    const path = join(dir, "case.json"), text = '{"version":"community_selected_initial_delivery_v1"}';
    writeFileSync(path, text, { mode: 0o600 });
    expect(readSelectedCommunityDeliveryCase(path, digest(text))).toEqual(JSON.parse(text));
    expect(() => readSelectedCommunityDeliveryCase(path, "0".repeat(64))).toThrow();
    const alias = join(dir, "alias.json"); symlinkSync(path, alias);
    expect(() => readSelectedCommunityDeliveryCase(alias, digest(text))).toThrow();
    chmodSync(path, 0o622); expect(() => readSelectedCommunityDeliveryCase(path, digest(text))).toThrow();
    chmodSync(path, 0o600); writeFileSync(path, " ".repeat(65537));
    expect(() => readSelectedCommunityDeliveryCase(path, digest(" ".repeat(65537)))).toThrow();
  });
  it("rejects an unmatched hosted runtime before any database/provider operation", async () => {
    vi.stubEnv("NODE_ENV", "test");
    const request = vi.fn(() => { throw new Error("Provider must not be reached"); });
    await expect(runSelectedCommunityDeliveryCommand({ version: "community_selected_initial_delivery_v1", kind: "coaching_plan", issuedAtUtc: "2026-11-19T18:00:00.000Z", expiresAtUtc: "2026-11-19T18:01:00.000Z" } as SelectedCommunityDeliveryCase, request as typeof fetch)).rejects.toThrow();
    expect(request).not.toHaveBeenCalled();
  });
});
