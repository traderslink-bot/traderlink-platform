// @vitest-environment node
import Database from "better-sqlite3";
import { expect, it } from "vitest";
import { PlatformDiscordSignInService } from "../../../platform/server/authentication/platform-discord-sign-in-service";
import { platformMigrationManifest } from "../../../platform/server/database/platform-migration-manifest";
import { calculatePlatformMigrationChecksum } from "../../../platform/server/database/platform-migration-contract";
import { readAppliedPlatformMigrations } from "../../../platform/server/database/platform-migration-registry";
import { runPlatformMigrations, verifyCompletedPlatformDatabase } from "../../../platform/server/database/run-platform-migrations";

it("appends the reviewed Paid sequence to the current populated prefix without changing existing Community data", () => {
  const database = new Database(":memory:");
  const now = () => new Date("2026-11-16T05:00:00.000Z");
  try {
    database.pragma("foreign_keys = ON");
    const reviewedIds = ["0190_platform_paid_core_partner_prerequisites",
      "0196_platform_paid_partner_retained_evidence", "0197_platform_paid_partner_retention_successors",
      "0198_platform_paid_partner_identifying_source_delete_guard", "0204_platform_erasure_text_successors",
      "0205_platform_paid_partner_retained_principal_seed", "0206_platform_paid_partner_consent_inspection",
      "0208_platform_paid_whop_coverage_evidence", "0209_platform_paid_stripe_connect_billing",
      "0210_platform_paid_partner_gateway_session", "0211_platform_paid_stripe_reauthorization",
      "0212_platform_paid_stripe_checkout_reviewed_version"];
    const start = platformMigrationManifest.findIndex(migration => migration.migrationId === reviewedIds[0]);
    expect(start).toBeGreaterThan(0);
    const prefix = platformMigrationManifest.slice(0, start);
    const end = platformMigrationManifest.findIndex(migration => migration.migrationId === reviewedIds.at(-1));
    expect(end).toBeGreaterThan(start);
    const paid = platformMigrationManifest.slice(start, end + 1);
    expect(paid.map(migration => migration.migrationId)).toEqual(reviewedIds);
    expect(paid.every((migration, index) => migration.executionOrder
      > (index === 0 ? prefix.at(-1)!.executionOrder : paid[index - 1]!.executionOrder))).toBe(true);
    runPlatformMigrations(database, { manifest: prefix, now });
    const previous = readAppliedPlatformMigrations(database);
    const community = "10000000-0000-4000-8000-000000000001";
    const guildId = "810000000000000301";
    const { userId } = new PlatformDiscordSignInService(database, { now }).signIn({
      authSubject: "810000000000000302", username: "migration-owner", globalDisplayName: null,
      avatarHash: null, guildId, roleIds: [], guildOwner: true, joinedAtUtc: null,
    }, { deferDemoActivation: true });
    const stamp = now().toISOString();
    database.prepare(`INSERT INTO traderlink_communities
      (community_id,discord_guild_id,slug,display_name,status,owner_user_id,created_at_utc,updated_at_utc)
      VALUES(?,?,'migration-community','Migration community','active',?,?,?)`).run(community, guildId, userId, stamp, stamp);
    database.prepare(`INSERT INTO traderlink_community_lifecycle (community_id,bot_state,bot_checked_at_utc)
      VALUES(?,'connected',?)`).run(community, stamp);
    const storedCommunity = () => database.prepare(`SELECT c.*,l.bot_state,l.bot_checked_at_utc
      FROM traderlink_communities c JOIN traderlink_community_lifecycle l USING(community_id)
      WHERE c.community_id=?`).get(community);
    const before = storedCommunity();
    expect(before).toMatchObject({ bot_state: "connected", owner_user_id: userId });
    const manifest = platformMigrationManifest.slice(0, end + 1);
    const failure = () => { throw new Error("Restore the Paid suffix"); };
    expect(() => runPlatformMigrations(database, { manifest, now, atomicSuffix: true, verifyAtomicSuffix: failure }))
      .toThrow("Restore the Paid suffix");
    expect(readAppliedPlatformMigrations(database)).toEqual(previous);
    expect(storedCommunity()).toEqual(before);
    expect(runPlatformMigrations(database, { manifest, now, atomicSuffix: true }).appliedMigrationIds)
      .toEqual(paid.map(migration => migration.migrationId));
    expect(readAppliedPlatformMigrations(database).slice(0, previous.length)).toEqual(previous);
    expect(readAppliedPlatformMigrations(database).slice(previous.length).map(row => ({
      id: row.migration_id, namespace: row.module_namespace, order: row.execution_order, checksum: row.checksum_sha256,
    }))).toEqual(paid.map(migration => ({ id: migration.migrationId, namespace: migration.moduleNamespace,
      order: migration.executionOrder, checksum: calculatePlatformMigrationChecksum(migration) })));
    expect(storedCommunity()).toEqual(before);
    expect(runPlatformMigrations(database, { manifest, now, atomicSuffix: true }).appliedMigrationIds).toEqual([]);
    verifyCompletedPlatformDatabase(database, manifest);
    expect(database.pragma("foreign_key_check")).toEqual([]);
  } finally { database.close(); }
}, 20_000);
