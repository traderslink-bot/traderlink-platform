import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import Database from "better-sqlite3";
import { emptyMembershipPlan, duplicateMembershipPlan, membershipPlanEditorSchema, membershipPlanReadiness,
  newMembershipPlanPrice } from "../modules/platform/contracts/membership-plan-editor";
import { platformIdentityMigration } from "../modules/platform/server/database/migrations/0001_platform_identity";
import { platformMembershipPlatformMigration } from "../modules/platform/server/database/migrations/0148_platform_membership_platform";
import { platformMembershipUnifiedEditorMigration } from "../modules/platform/server/database/migrations/0165_platform_membership_unified_editor";
import { MembershipPlanEditorDrafts } from "../modules/platform/server/membership/membership-plan-editor-drafts";
import { platformMembershipGenerationAllowancesMigration } from "../modules/platform/server/database/migrations/0150_platform_membership_generation_allowances";
import { platformMembershipFeatureCopyMigration } from "../modules/platform/server/database/migrations/0157_platform_membership_feature_copy";
import { platformMemberPrivateWatchlistsMigration } from "../modules/platform/server/database/migrations/0158_platform_member_private_watchlists";
import { writeMembershipPlanEditor } from "../modules/platform/server/membership/membership-plan-editor-write";
import { readMembershipPlanEditor } from "../modules/platform/server/membership/membership-plan-editor-read";
import { notificationPreferenceEnabled } from "../modules/platform/server/notifications/platform-notification-defaults";
import { PlatformMembershipCatalogRepository } from "../modules/platform/server/membership/platform-membership-catalog-repository";
import { membershipFeaturePeriod, membershipUsageStart } from "../modules/platform/server/membership/membership-plan-usage";
import { PlatformNotificationRepository } from "../modules/platform/server/notifications/platform-notification-repository";
import { PLATFORM_NOTIFICATION_CATEGORIES } from "../modules/platform/contracts/platform-notification-contracts";
import { platformDiscordMembershipsMigration } from "../modules/platform/server/database/migrations/0017_platform_discord_memberships";
import { platformAuthenticationIdentitiesMigration } from "../modules/platform/server/database/migrations/0012_platform_authentication_identities";
import { readDiscordMembershipGrants } from "../modules/platform/server/membership/platform-membership-discord";
import { PlatformMembershipClaims } from "../modules/platform/server/membership/platform-membership-claims";
import { archiveMembershipPlan } from "../modules/platform/server/membership/membership-plan-editor-archive";
import { readGenerationAllowance } from "../modules/platform/server/membership/platform-membership-generation-allowance";
import { PlatformRemoteNotificationDeliveryRepository } from "../modules/platform/server/notifications/platform-remote-notification-delivery-repository";
import { PlatformRemoteNotificationDeliveryService } from "../modules/platform/server/notifications/platform-remote-notification-delivery-service";
import { privateWatchlistRemaining } from "../modules/watchlist/server/private/private-watchlist-allowance";
import { WatchlistPublicationNotificationStore } from "../modules/watchlist/server/notifications/watchlist-publication-notification-store";
import { readWatchlistNotificationCandidates } from "../modules/watchlist/server/notifications/watchlist-notification-candidates";

let networkCalls = 0;
globalThis.fetch = async () => { networkCalls++; throw new Error("Network forbidden in editor QA"); };
const plan = emptyMembershipPlan();
plan.name = "Premium";
plan.features = [{ key: "levels.generations", limit: 12, resetDays: 30, period: null, brief: "My description", details: "More detail" }];
const price = newMembershipPlanPrice(randomUUID());
price.name = "Standard"; plan.prices.push(price);
price.trials.push({ id: randomUUID(), name: "Trial", enabled: true, durationDays: 3, price: "0", paymentMethodRequired: false,
  eligibility: "once_per_campaign", capacity: 50, startsAt: "", endsAt: "", checkoutUrl: "", endBehavior: "end_access" });
price.discord.push({ id: randomUUID(), guildId: "12345", guildName: "Test server", roleIds: ["98765"], roleNames: ["Premium"],
  enabled: true, access: "automatic_grant", funding: "sponsored", verificationSeconds: 300, startsAt: "", endsAt: "" });
price.trials.push({ ...price.trials[0], id: randomUUID(), name: "Future trial", enabled: false });
price.discord.push({ ...price.discord[0], id: randomUUID(), enabled: false });
const features = [{ key: "levels.generations", label: "Levels", kind: "limit" as const, module: "levels", enforcement: "enforced", brief: "", details: "" }];
assert.deepEqual(membershipPlanEditorSchema.parse(plan), plan);
assert.equal(membershipPlanReadiness(plan, [], features).filter(i => i.blocking).length, 0);
const copied = duplicateMembershipPlan(plan, randomUUID);
assert.deepEqual(copied.features, plan.features);
assert.notEqual(copied.prices[0].id, price.id);
assert.notEqual(copied.prices[0].trials[0].id, price.trials[0].id);
assert.deepEqual(copied.prices[0].discord[0].roleIds, price.discord[0].roleIds);
copied.features[0].limit = 99;
assert.equal(plan.features[0].limit, 12);
const unfinished = structuredClone(plan);
unfinished.prices[0].billing = "recurring";
assert.doesNotThrow(() => membershipPlanEditorSchema.parse(unfinished));
assert.ok(membershipPlanReadiness(unfinished, [], features).some(i => i.blocking));
unfinished.prices[0].checkoutUrl = "https://user:secret@example.com";
assert.ok(membershipPlanReadiness(unfinished, [], features).some(i => i.message.includes("credentials")));

async function main() {
const db = new Database(":memory:");
try {
  db.pragma("foreign_keys=ON");
  for (const migration of [platformIdentityMigration, platformAuthenticationIdentitiesMigration, platformDiscordMembershipsMigration, platformMembershipPlatformMigration,
    platformMembershipGenerationAllowancesMigration, platformMembershipFeatureCopyMigration, platformMemberPrivateWatchlistsMigration]) {
    for (const sql of migration.statements) db.exec(sql);
  }
  assert.equal(notificationPreferenceEnabled(db, undefined), false);
  assert.equal(platformMembershipUnifiedEditorMigration.executionOrder, 178);
  for (const sql of platformMembershipUnifiedEditorMigration.statements) db.exec(sql);
  assert.equal(notificationPreferenceEnabled(db, undefined), true);
  assert.equal(notificationPreferenceEnabled(db, 0), false);
  assert.equal(notificationPreferenceEnabled(db, 1), true);
  const actor = randomUUID(); const at = "2026-10-10T23:00:00.000Z";
  db.prepare("INSERT INTO platform_users VALUES (?,'test','owner','Owner','active',?,?)").run(actor, at, at);
  const service = new MembershipPlanEditorDrafts(db);
  const request = randomUUID();
  const saved = service.save(actor, request, unfinished, null, null, at);
  assert.deepEqual(service.read(saved.draftId).document, unfinished);
  assert.deepEqual(service.save(actor, request, unfinished, null, null, at), saved);
  assert.equal((db.prepare("SELECT COUNT(*) count FROM platform_membership_editor_drafts").get() as { count: number }).count, 1);
  assert.throws(() => service.save(actor, request, plan, null, null, at), /request has changed/);
  const edited = structuredClone(unfinished); edited.name = "Edited";
  const next = service.save(actor, randomUUID(), edited, saved.draftId, 1, at);
  assert.equal(next.revision, 2);
  assert.throws(() => service.save(actor, randomUUID(), unfinished, saved.draftId, 1, at), /Another save/);
  assert.equal(service.read(saved.draftId).document.name, "Edited");
  assert.throws(() => service.discard(actor, saved.draftId, 1, at), /has changed/);
  service.discard(actor, saved.draftId, 2, at);
  service.discard(actor, saved.draftId, 2, at);
  assert.throws(() => service.read(saved.draftId), /no longer available/);
  const duplicateRequest = randomUUID();
  const duplicate = service.duplicate(actor, plan, duplicateRequest, at);
  assert.deepEqual(service.duplicate(actor, plan, duplicateRequest, at), duplicate);
  assert.deepEqual(duplicate.document.features, plan.features);
  assert.equal((db.prepare("SELECT COUNT(*) count FROM platform_membership_entitlements").get() as { count: number }).count, 0);
  assert.equal((db.prepare("SELECT COUNT(*) count FROM platform_membership_offers").get() as { count: number }).count, 0);
  plan.features.push({ key: "private_watchlist.generations", limit: 10, resetDays: null, period: { kind: "days", days: 30 }, brief: null, details: null });
  const publish = { requestId: randomUUID(), draftId: null, revision: null, document: plan, intent: "publish" as const, applyToMembers: false };
  const result = writeMembershipPlanEditor(db, actor, publish, at);
  assert.ok(result.message?.includes("published"));
  assert.deepEqual(writeMembershipPlanEditor(db, actor, publish, at), result);
  assert.equal((db.prepare("SELECT COUNT(*) count FROM platform_membership_plan_versions").get() as { count: number }).count, 1);
  const row = db.prepare("SELECT plan_id,plan_version_id FROM platform_membership_plan_versions").get() as { plan_id: string; plan_version_id: string };
  const reopened = readMembershipPlanEditor(db, row.plan_id);
  assert.deepEqual(reopened.features, plan.features);
  assert.equal(reopened.prices[0].trials[0].durationDays, 3);
  assert.deepEqual(reopened.prices[0].discord[0].roleIds, price.discord[0].roleIds);
  assert.equal(reopened.prices[0].trials.filter(t => !t.enabled).length, 1);
  assert.equal(reopened.prices[0].discord.filter(r => !r.enabled).length, 1);
  assert.equal(new PlatformMembershipCatalogRepository(db).readPublicPlans().length, 0, "Private plans never leak to public catalog");
  const member = randomUUID(); const grant = randomUUID(); const expired = randomUUID();
  db.prepare("INSERT INTO platform_users VALUES (?,'test','member','Member','active',?,?)").run(member, at, at);
  const expiry = "2026-11-10T23:00:00.000Z";
  db.prepare("INSERT INTO platform_auth_identities VALUES (?,'discord','123456','active',?,?,?,NULL)").run(member, actor, at, at);
  db.prepare(`INSERT INTO platform_discord_memberships
    (user_id,guild_id,username,role_ids_json,guild_owner,first_verified_at_utc,last_verified_at_utc)
    VALUES (?,'12345','Member','["98765"]',0,?,?)`).run(member, at, at);
  db.prepare(`INSERT INTO platform_membership_entitlements
    (entitlement_id,user_id,plan_version_id,source_type,source_ref,status,starts_at_utc,ends_at_utc,granted_by_user_id,reason,created_at_utc,updated_at_utc)
    VALUES (?,?,?,'owner_grant',?,'active',?,?,?,'QA',?,?)`).run(grant, member, row.plan_version_id, grant, at, expiry, actor, at, at);
  db.prepare(`INSERT INTO platform_membership_entitlements
    (entitlement_id,user_id,plan_version_id,source_type,source_ref,status,starts_at_utc,ends_at_utc,granted_by_user_id,reason,created_at_utc,updated_at_utc)
    VALUES (?,?,?,'owner_grant',?,'expired',?,?,?,'QA',?,?)`).run(expired, member, row.plan_version_id, expired, "2026-09-01T00:00:00.000Z", "2026-10-01T00:00:00.000Z", actor, at, at);
  const noApply = { ...publish, requestId: randomUUID(), document: { ...reopened, name: "Renamed", visibility: "public" as const } };
  writeMembershipPlanEditor(db, actor, noApply, at);
  assert.equal(readDiscordMembershipGrants(db, member, at)[0].planVersionId, row.plan_version_id, "Unchecked bulk update retains old Discord version");
  assert.equal((db.prepare("SELECT plan_version_id FROM platform_membership_entitlements WHERE entitlement_id=?").get(grant) as { plan_version_id: string }).plan_version_id, row.plan_version_id);
  assert.equal(new PlatformMembershipCatalogRepository(db).readPublicPlans()[0].name, "Renamed");
  const current = readMembershipPlanEditor(db, row.plan_id);
  const claims = new PlatformMembershipClaims(db);
  const claim = claims.reserve({ userId: member, offerId: current.prices[0].id, trialCampaignId: current.prices[0].trials[0].id, atUtc: at });
  assert.equal(claim.trialEndBehavior, "end_access");
  claims.fulfillFree(claim.claimId, member, at);
  const editedPlan = readMembershipPlanEditor(db, row.plan_id); editedPlan.features[0].limit = 25; editedPlan.features[0].resetDays = 7;
  editedPlan.features.find(feature => feature.key === "private_watchlist.generations")!.period = { kind: "days", days: 7 };
  const editRequest = { ...publish, requestId: randomUUID(), document: editedPlan, applyToMembers: true };
  db.prepare("UPDATE platform_discord_memberships SET last_verified_at_utc=? WHERE user_id=?").run("2026-10-20T23:00:00.000Z", member);
  const applied = writeMembershipPlanEditor(db, actor, editRequest, "2026-10-20T23:00:00.000Z");
  assert.ok(applied.message?.includes("1 existing members"));
  const after = db.prepare("SELECT * FROM platform_membership_entitlements WHERE entitlement_id=?").get(grant) as { plan_version_id: string; ends_at_utc: string; source_ref: string };
  assert.notEqual(after.plan_version_id, row.plan_version_id);
  assert.equal(readDiscordMembershipGrants(db, member, "2026-10-20T23:00:00.000Z")[0].planVersionId, after.plan_version_id);
  db.prepare("UPDATE platform_discord_memberships SET role_ids_json='[]' WHERE user_id=?").run(member);
  assert.equal(readDiscordMembershipGrants(db, member, "2026-10-20T23:00:00.000Z").length, 0, "Retained access never bypasses role requirements");
  assert.equal(after.ends_at_utc, expiry);
  assert.equal(after.source_ref, grant);
  assert.equal((db.prepare("SELECT plan_version_id FROM platform_membership_entitlements WHERE entitlement_id=?").get(expired) as { plan_version_id: string }).plan_version_id, row.plan_version_id);
  const period = membershipFeaturePeriod(db, after.plan_version_id, "levels.generations", "2026-10-20T23:00:00.000Z")!;
  assert.equal(membershipUsageStart(db, member, after.plan_version_id, "levels.generations", period.start, "2026-10-20T23:00:00.000Z"), at, "Changing interval retains used quota until next reset");
  db.exec("CREATE TABLE platform_stock_levels_usage(user_id TEXT NOT NULL,requested_at_ms INTEGER NOT NULL) STRICT");
  db.prepare("INSERT INTO platform_stock_levels_usage VALUES (?,?)").run(member, Date.parse("2026-10-15T23:00:00.000Z"));
  db.prepare("INSERT INTO platform_membership_feature_policies VALUES ('levels.generations','enforced',?,?)").run(actor, at);
  assert.equal(readGenerationAllowance(db, member, "levels.generations", new Date("2026-10-20T23:00:00.000Z"))?.remaining, 24);
  assert.equal(readGenerationAllowance(db, member, "levels.generations", new Date("2026-10-25T23:00:00.000Z"))?.remaining, 25, "Carryover expires at the next reset, not forever");
  db.prepare("INSERT INTO platform_membership_feature_policies VALUES ('private_watchlist.generations','enforced',?,?)").run(actor, at);
  db.prepare("INSERT INTO platform_private_watchlist_entries VALUES (?,'QA','active',?,?)").run(member, at, at);
  db.prepare(`INSERT INTO platform_private_watchlist_operations
    (user_id,request_id,symbol,operation,state,request_hash,maximum_cost_microusd,actual_cost_microusd,created_at_utc,updated_at_utc)
    VALUES (?,?,'QA','generation','completed','synthetic',0,0,?,?)`).run(member, randomUUID(), "2026-10-15T23:00:00.000Z", "2026-10-15T23:00:00.000Z");
  assert.equal(privateWatchlistRemaining(db, member, "generations", "2026-10-20T23:00:00.000Z"), 9);
  assert.equal(privateWatchlistRemaining(db, member, "generations", "2026-10-25T23:00:00.000Z"), 10);
  assert.equal(readMembershipPlanEditor(db, row.plan_id).features[0].limit, 25);
  assert.throws(() => writeMembershipPlanEditor(db, actor, { ...publish, requestId: randomUUID(), document: reopened }, at), /changed/);
  assert.equal((db.prepare("SELECT COUNT(*) count FROM platform_membership_offers WHERE status='active'").get() as { count: number }).count, 1);
  assert.equal((db.prepare("SELECT COUNT(DISTINCT family_id) count FROM platform_membership_trial_lineage").get() as { count: number }).count, 1);
  const revised = readMembershipPlanEditor(db, row.plan_id);
  assert.throws(() => claims.reserve({ userId: member, offerId: revised.prices[0].id,
    trialCampaignId: revised.prices[0].trials[0].id, atUtc: "2026-10-20T23:00:00.000Z" }), /already enrolled/);
  const catalog = new PlatformMembershipCatalogRepository(db);
  const privatePage = catalog.createShareLink({ actorUserId: actor, name: "Private QA", offerIds: [],
    expiresAtUtc: null, maximumClaims: null, atUtc: at });
  const display = duplicateMembershipPlan(revised, randomUUID);
  display.name = "Coaching preview"; display.displayOnly = true; display.visibility = "private";
  display.internalNote = "Never public"; display.privatePageIds = [privatePage.shareLinkId];
  writeMembershipPlanEditor(db, actor, { ...publish, requestId: randomUUID(), document: display }, at);
  const shared = catalog.readSharedPlans(privatePage.secret, at)!;
  assert.equal(shared.length, 1); assert.equal(shared[0].displayOnly, true); assert.deepEqual(shared[0].offers, []);
  assert.equal(JSON.stringify(shared).includes("Never public"), false);
  assert.equal(catalog.readSharedPlans("incorrect-secret", at), null);
  assert.equal(catalog.readPublicPlans().some(p => p.name === display.name), false);
  db.prepare("UPDATE platform_discord_memberships SET role_ids_json='[\"98765\"]' WHERE user_id=?").run(member);
  archiveMembershipPlan(db, actor, row.plan_id, "2026-10-20T23:00:00.000Z");
  assert.equal(catalog.readPublicPlans().some(p => p.planId === row.plan_id), false);
  assert.equal(readDiscordMembershipGrants(db, member, "2026-10-20T23:00:00.000Z")[0].planVersionId, after.plan_version_id);
  assert.equal((db.prepare("SELECT status FROM platform_membership_entitlements WHERE entitlement_id=?").get(grant) as { status: string }).status, "active");
  const countBefore = (db.prepare("SELECT COUNT(*) count FROM platform_membership_plan_versions").get() as { count: number }).count;
  db.exec("CREATE TRIGGER qa_reject_offer BEFORE INSERT ON platform_membership_offers BEGIN SELECT RAISE(ABORT,'qa rollback'); END");
  assert.throws(() => writeMembershipPlanEditor(db, actor, { ...publish, requestId: randomUUID(),
    document: duplicateMembershipPlan(revised, randomUUID) }, at), /qa rollback/);
  db.exec("DROP TRIGGER qa_reject_offer");
  assert.equal((db.prepare("SELECT COUNT(*) count FROM platform_membership_plan_versions").get() as { count: number }).count, countBefore, "Failed publication rolls back every version and commercial change");
  db.prepare(`INSERT INTO platform_membership_provider_definitions
    (provider_key,label,integration_mode,configuration_state,created_by_user_id,created_at_utc,updated_at_utc)
    VALUES ('qa_external','QA external','external_checkout','ready',?,?,?)`).run(actor, at, at);
  const paidTrial = duplicateMembershipPlan(revised, randomUUID);
  paidTrial.name = "Free with optional paid trial"; paidTrial.prices[0].provider = "qa_external";
  paidTrial.prices[0].trials[0].price = "2.50"; paidTrial.prices[0].trials[0].checkoutUrl = "https://example.com/qa";
  writeMembershipPlanEditor(db, actor, { ...publish, requestId: randomUUID(), document: paidTrial }, at);
  const paidOffer = db.prepare(`SELECT t.entry_amount_minor,o.currency,o.billing_kind FROM platform_membership_trial_campaigns t
    JOIN platform_membership_offers o USING(offer_id) WHERE o.provider='qa_external'`).get() as { entry_amount_minor: number; currency: string; billing_kind: string };
  assert.deepEqual(paidOffer, { entry_amount_minor: 250, currency: "USD", billing_kind: "free" });
  // Minimal inert preference fixture: no event, transport, worker or delivery rows.
  db.exec(`CREATE TABLE platform_notification_delivery_preferences (
    user_id TEXT NOT NULL REFERENCES platform_users(user_id), category TEXT NOT NULL,
    discord_dm_enabled INTEGER NOT NULL DEFAULT 0, email_enabled INTEGER NOT NULL DEFAULT 0,
    web_push_enabled INTEGER NOT NULL DEFAULT 0, updated_at_utc TEXT NOT NULL, PRIMARY KEY(user_id,category)) STRICT`);
  const workspace = randomUUID();
  db.prepare("INSERT INTO platform_workspaces VALUES (?,'QA','UTC','active',?,?)").run(workspace, at, at);
  db.prepare("INSERT INTO platform_workspace_memberships VALUES (?,?,'owner','active',?,?,?)").run(workspace, member, actor, at, at);
  const scope = { userId: member, workspaceId: workspace, workspaceRole: "owner" as const, allowedAccountIds: [], activeAccountId: null };
  const preferences = new PlatformNotificationRepository(db);
  assert.deepEqual(preferences.readPreferences(scope).webPushCategories, PLATFORM_NOTIFICATION_CATEGORIES);
  preferences.replaceDiscordDmCategories({ scope, categories: [], updatedAtUtc: at });
  const optedOut = preferences.readPreferences(scope);
  assert.deepEqual(optedOut.discordDmCategories, []);
  assert.deepEqual(optedOut.webPushCategories, PLATFORM_NOTIFICATION_CATEGORIES, "Saving one channel cannot turn untouched channels off");
  assert.deepEqual(optedOut.emailCategories, PLATFORM_NOTIFICATION_CATEGORIES);
  preferences.replaceWebPushCategories({ scope, categories: ["ai_review"], updatedAtUtc: at });
  assert.deepEqual(preferences.readPreferences(scope).discordDmCategories, [], "Explicit off survives other edits");
  assert.deepEqual(preferences.readPreferences(scope).webPushCategories, ["ai_review"]);
  db.exec(`CREATE TABLE platform_notifications (
    notification_id TEXT PRIMARY KEY,category TEXT,title TEXT,summary TEXT,destination_path TEXT);
    CREATE TABLE platform_notification_email_addresses(email_address_id TEXT,user_id TEXT,state TEXT,confirmed_at_utc TEXT);
    CREATE TABLE platform_notification_remote_deliveries (
      delivery_id TEXT PRIMARY KEY,notification_id TEXT,recipient_user_id TEXT,channel TEXT,target_ref TEXT,state TEXT,
      attempt_count INTEGER,available_at_utc TEXT,last_attempt_at_utc TEXT,delivered_at_utc TEXT,
      provider_message_id TEXT,failure_code TEXT,created_at_utc TEXT,updated_at_utc TEXT,
      UNIQUE(notification_id,channel,target_ref));`);
  const notification = randomUUID();
  db.prepare("INSERT INTO platform_notifications VALUES (?,'chart_update','QA','QA',NULL)").run(notification);
  preferences.replaceDiscordDmCategories({ scope, categories: ["chart_update"], updatedAtUtc: at });
  const deliveries = new PlatformRemoteNotificationDeliveryRepository(db);
  deliveries.enqueueNotification({ userId: member, category: "chart_update", notificationRef: notification, occurredAtUtc: "2020-01-01T00:00:00.000Z" });
  assert.equal((db.prepare("SELECT COUNT(*) count FROM platform_notification_remote_deliveries").get() as { count: number }).count, 1);
  preferences.replaceDiscordDmCategories({ scope, categories: [], updatedAtUtc: at });
  await new PlatformRemoteNotificationDeliveryService(deliveries).runOne();
  assert.equal((db.prepare("SELECT failure_code FROM platform_notification_remote_deliveries").get() as { failure_code: string }).failure_code,
    "preference_disabled", "A queued message cannot bypass a later explicit opt-out");
  db.exec(`CREATE TABLE platform_watchlist_notification_preferences (
    user_id TEXT PRIMARY KEY,web_push_enabled INTEGER NOT NULL DEFAULT 0,email_enabled INTEGER NOT NULL DEFAULT 0,updated_at_utc TEXT);
    CREATE TABLE platform_web_push_subscriptions(subscription_id TEXT,user_id TEXT,state TEXT)`);
  db.prepare("INSERT INTO platform_web_push_subscriptions VALUES (?,?,'active')").run(randomUUID(), member);
  const watchlistPreferences = new WatchlistPublicationNotificationStore(db);
  assert.deepEqual(watchlistPreferences.readPreferences(member), { webPushEnabled: true, emailEnabled: true });
  assert.ok(readWatchlistNotificationCandidates(db).some(user => user.user_id === member && user.web_push_enabled === 1));
  watchlistPreferences.savePreference(member, "web_push", false, new Date(at));
  assert.deepEqual(watchlistPreferences.readPreferences(member), { webPushEnabled: false, emailEnabled: true },
    "Watchlist opt-out must preserve the untouched channel default");
  watchlistPreferences.savePreference(member, "email", false, new Date(at));
  assert.equal(readWatchlistNotificationCandidates(db).some(user => user.user_id === member), false);
  assert.deepEqual(db.pragma("foreign_key_check"), []);
  assert.equal(networkCalls, 0);
  console.log(JSON.stringify({ ok: true, boundary: "offline SQLite integration; full remote build and browser acceptance pending", roundTrip: true,
    completeDuplicate: true, incompleteDraft: true, safeRetry: true, staleSaveRejected: true, discardPreservesHistory: true,
    atomicPublication: true, bulkPreservesExpiryAndUsage: true, discordRetainedAndRoleChecked: true, trialLineage: true,
    privateDisplayOnly: true, defaultOnAndOptOut: true, networkCalls }));
} finally { db.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
