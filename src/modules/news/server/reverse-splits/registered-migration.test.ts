import Database from "better-sqlite3";
import { expect, it } from "vitest";
import { platformMigrationManifest } from "@/src/modules/platform/server/database/platform-migration-manifest";
import { calculatePlatformMigrationChecksum } from "@/src/modules/platform/server/database/platform-migration-contract";
import { runPlatformMigrations, verifyCompletedPlatformDatabase } from "@/src/modules/platform/server/database/run-platform-migrations";
import { PlatformErasureService } from "@/src/modules/platform/server/privacy/platform-erasure-service";
import { ReverseSplitNotificationStore } from "./notification-store";
import { ReverseSplitRepository } from "./repository";
import { ReverseSplitDiscordOutbox } from "./discord-outbox";
import type { SplitSource } from "./contracts";

it("registers only 0142 after the real predecessor and erases only one synthetic user's private split rows", () => {
  const database = new Database(":memory:");
  database.pragma("foreign_keys = ON");
  const at = "2026-09-25T23:00:00.000Z";
  try {
    const predecessor = platformMigrationManifest.slice(0, -1);
    expect(predecessor.at(-1)?.migrationId).toBe("0140_news_market_halt_discord_deliveries");
    expect(platformMigrationManifest.some(migration => migration.executionOrder === 141)).toBe(false);
    expect(calculatePlatformMigrationChecksum(platformMigrationManifest.at(-1)!)).toBe("4d88aa953849d78e82b1d8d26c700da0b128f80678f3721b1e942dbd221f3f7d");
    runPlatformMigrations(database, { manifest: predecessor, now: () => new Date(at) });
    const originalRegistry = database.prepare("SELECT * FROM platform_schema_migrations ORDER BY execution_order").all();
    const result = runPlatformMigrations(database, { now: () => new Date(at) });
    expect(result.appliedMigrationIds).toEqual(["0142_news_reverse_split_alerts"]);
    expect(database.prepare("SELECT * FROM platform_schema_migrations WHERE execution_order < 142 ORDER BY execution_order").all()).toEqual(originalRegistry);
    expect(verifyCompletedPlatformDatabase(database).finalSchemaSha256).toBe(result.finalSchemaSha256);
    expect(runPlatformMigrations(database).appliedMigrationIds).toEqual([]);

    const users = ["11111111-1111-4111-8111-111111111111", "22222222-2222-4222-8222-222222222222"];
    const workspaces = ["33333333-3333-4333-8333-333333333333", "44444444-4444-4444-8444-444444444444"];
    for (const [index, userId] of users.entries()) {
      database.prepare(`INSERT INTO platform_users(user_id, auth_provider, auth_subject, display_name, status, created_at_utc, updated_at_utc)
        VALUES (?, 'synthetic', ?, 'Synthetic user', 'active', ?, ?)`).run(userId, `fixture-${index}`, at, at);
      database.prepare(`INSERT INTO platform_workspaces(workspace_id, display_name, default_trading_timezone, status, created_at_utc, updated_at_utc)
        VALUES (?, 'Synthetic workspace', 'America/New_York', 'active', ?, ?)`).run(workspaces[index], at, at);
      database.prepare(`INSERT INTO platform_workspace_memberships(workspace_id, user_id, role, status, created_by_user_id, created_at_utc, updated_at_utc)
        VALUES (?, ?, 'owner', 'active', ?, ?, ?)`).run(workspaces[index], userId, userId, at, at);
      database.prepare("INSERT INTO news_reverse_split_notification_preferences VALUES (?, 1, 1, ?)").run(userId, at);
    }
    const source: SplitSource = { url: "https://www.nasdaqtrader.com/TraderNews.aspx?id=ECA2026-1", kind: "nasdaq", title: "Synthetic reverse split", publishedDate: "2026-09-25", ticker: "TEST", company: "Synthetic" };
    const repository = new ReverseSplitRepository(database);
    repository.discover([source], at);
    const claim = repository.claimSource(at)!;
    const event = { ticker: "TEST", company: "Synthetic", status: "confirmed" as const, ratio: 10, effectiveDate: "2026-09-28", approvalDate: null, authorizedRatio: null, source, evidence: "Synthetic" };
    expect(repository.completeSource(claim, "Synthetic source body", { outcome: "parsed", reason: "confirmed", event }, at)).toBe(true);
    const store = new ReverseSplitNotificationStore(database, { NODE_ENV: "test" });
    store.publish({ date: "2026-09-25", signature: "a".repeat(64), parts: ["Synthetic digest"], events: [event], title: "Reverse Splits",
      summary: "Synthetic", createdAt: at, expiresAt: "2026-09-26T04:00:00.000Z" });
    const digest = store.latest("2026-09-25")!;
    new ReverseSplitDiscordOutbox(database).enqueue({ channelId: "123", digestId: digest.id, date: digest.date, revision: digest.revision,
      signature: digest.signature, parts: digest.parts, now: at, expiresAt: digest.expiresAt });
    for (const [index, userId] of users.entries()) for (const [channelIndex, channel] of ["web_push", "email"].entries()) {
      database.prepare(`INSERT INTO news_reverse_split_notification_deliveries(delivery_id, digest_id, user_id, channel, target_ref, state, available_at_utc, created_at_utc, updated_at_utc)
        VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, ?)`).run(String(index * 2 + channelIndex + 1).repeat(64), digest.id, userId, channel, `synthetic-target-${index}-${channel}`, at, at, at);
    }
    const sharedTables = ["news_reverse_split_sources", "news_reverse_split_events", "news_reverse_split_runtime", "news_reverse_split_digests", "news_reverse_split_discord_deliveries"];
    const sharedBefore = sharedTables.map(table => database.prepare(`SELECT * FROM ${table}`).all());
    const otherBefore = database.prepare("SELECT * FROM news_reverse_split_notification_deliveries WHERE user_id = ? ORDER BY channel").all(users[1]);
    const erased = new PlatformErasureService(database).eraseTraderLinkAccount({ userId: users[0], workspaceId: workspaces[0], workspaceRole: "owner", allowedAccountIds: [], activeAccountId: null });
    expect(erased).toEqual({ erasedAccountIds: [], privateArtifactsPurged: [] });
    for (const table of ["platform_users", "news_reverse_split_notification_preferences", "news_reverse_split_notification_deliveries"]) {
      expect(database.prepare(`SELECT count(*) n FROM ${table} WHERE user_id = ?`).get(users[0])).toEqual({ n: 0 });
    }
    expect(database.prepare("SELECT user_id FROM platform_users").all()).toEqual([{ user_id: users[1] }]);
    expect(database.prepare("SELECT user_id FROM news_reverse_split_notification_preferences").all()).toEqual([{ user_id: users[1] }]);
    expect(database.prepare("SELECT * FROM news_reverse_split_notification_deliveries WHERE user_id = ? ORDER BY channel").all(users[1])).toEqual(otherBefore);
    expect(sharedTables.map(table => database.prepare(`SELECT * FROM ${table}`).all())).toEqual(sharedBefore);
    expect(database.pragma("foreign_key_check")).toEqual([]);
    expect(verifyCompletedPlatformDatabase(database).finalSchemaSha256).toBe(result.finalSchemaSha256);
    console.info(JSON.stringify({ syntheticOnly: true, migrations: platformMigrationManifest.length, schemaSha256: result.finalSchemaSha256, preservedOtherUserDeliveries: otherBefore.length, foreignKeyViolations: 0 }));
  } finally { database.close(); }
}, 30_000);
