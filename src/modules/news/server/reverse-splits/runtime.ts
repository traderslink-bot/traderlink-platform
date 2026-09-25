import "server-only";
import type Database from "better-sqlite3";
import { openPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { CoachUsEquitiesCalendarRepository } from "@/src/modules/coach/server/market-calendar/coach-us-equities-calendar-repository";
import { record } from "./contracts";
import { reverseSplitConfiguration, reverseSplitPrivatePreviewEnabled } from "./configuration";
import { ReverseSplitRepository } from "./repository";
import { ReverseSplitCollectionService } from "./collection";
import { ReverseSplitDiscordOutbox } from "./discord-outbox";
import { ReverseSplitDiscordDelivery } from "./discord-delivery";
import { ReverseSplitDigestPlanner } from "./digest";
import { ReverseSplitNotificationStore } from "./notification-store";
import { runReverseSplitNotifications } from "./notification-delivery";

let running = false;
export async function runReverseSplitWorkerOnce(): Promise<readonly string[]> {
  if (!reverseSplitPrivatePreviewEnabled() || running) return [];
  running = true;
  let database: Database.Database | undefined;
  try {
    const configuration = reverseSplitConfiguration();
    if (!configuration) return [];
    database = openPlatformDatabase({ mode: "runtime" });
    const schema = database.prepare<[], { count: number }>(`SELECT COUNT(*) AS count FROM sqlite_master WHERE type = 'table'
      AND name IN ('news_reverse_split_sources', 'news_reverse_split_events', 'news_reverse_split_discord_deliveries', 'news_reverse_split_runtime',
        'news_reverse_split_digests', 'news_reverse_split_notification_preferences', 'news_reverse_split_notification_deliveries')`).get();
    if (schema?.count !== 7) return ["reverse_split_migration_required"];
    const calendar = new CoachUsEquitiesCalendarRepository(database).calendar();
    const repository = new ReverseSplitRepository(database);
    const collection = await new ReverseSplitCollectionService(repository, configuration, calendar).runOnce();
    const failures = [...collection.failures];
    const store = new ReverseSplitNotificationStore(database);
    {
      const now = new Date();
      const planning = repository.claimRuntime("discord_plan_turn", now.toISOString());
      if (planning) {
        const state = record(planning.state);
        if (typeof state?.nextAt !== "string" || state.nextAt <= now.toISOString()) {
          try {
            const result = new ReverseSplitDigestPlanner(repository, store, calendar,
              "https://app.traderslink.pro/reverse-splits").plan(now);
            repository.completeRuntime(planning, { ...result, nextAt: new Date(now.getTime() + 60_000).toISOString() }, new Date().toISOString());
            if (!["before_schedule", "queued", "unchanged", "delivery_pending"].includes(result.reason)) failures.push(result.reason);
          } catch {
            repository.completeRuntime(planning, { nextAt: new Date(now.getTime() + 5 * 60_000).toISOString(), failure: "digest_planning_failed" }, new Date().toISOString());
            failures.push("digest_planning_failed");
          }
        } else repository.completeRuntime(planning, planning.state, now.toISOString());
      }
    }
    if (configuration.discord) {
      const outbox = new ReverseSplitDiscordOutbox(database);
      const now = new Date().toISOString();
      const digest = store.pendingDiscord(configuration.discord.channelId, now);
      if (digest) outbox.enqueue({ channelId: configuration.discord.channelId, digestId: digest.id, date: digest.date,
        revision: digest.revision, signature: digest.signature, parts: digest.parts, now, expiresAt: digest.expiresAt });
      const delivery = await new ReverseSplitDiscordDelivery(outbox, configuration.discord).runOne();
      if (delivery.code) failures.push(delivery.code);
    }
    failures.push(...await runReverseSplitNotifications(store));
    const finishedAt = new Date().toISOString();
    const health = repository.claimRuntime("worker_health", finishedAt);
    if (health) repository.completeRuntime(health, { lastPass: finishedAt, unit: collection.processed, failures }, finishedAt);
    return failures;
  } catch {
    return ["reverse_split_worker_unavailable"];
  } finally {
    try { database?.close(); } finally { running = false; }
  }
}
