import "server-only";
import type Database from "better-sqlite3";
import { openPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { CoachUsEquitiesCalendarRepository } from "@/src/modules/coach/server/market-calendar/coach-us-equities-calendar-repository";
import { record } from "./contracts";
import { reverseSplitConfiguration, reverseSplitPrivatePreviewEnabled } from "./configuration";
import { ReverseSplitRepository } from "./repository";
import { ReverseSplitCollectionService } from "./collection";
import type { ReverseSplitCollectionPhase } from "./sources";
import { ReverseSplitDiscordOutbox } from "./discord-outbox";
import { ReverseSplitDiscordDelivery } from "./discord-delivery";
import { ReverseSplitDigestPlanner } from "./digest";
import { ReverseSplitNotificationStore } from "./notification-store";
import { runReverseSplitNotifications } from "./notification-delivery";

let running = false;
const phaseLogStateKey = "__traderlinkReverseSplitPhaseLog" as const;
type PhaseLogProcessState = typeof globalThis & {
  [phaseLogStateKey]?: { windowStart: number; count: number };
};
type CollectionSubphase = Readonly<{
  phase: ReverseSplitCollectionPhase;
  start_epoch_ms: number;
  duration_ms: number;
}>;

function logReverseSplitPhases(phases: Readonly<{
  start_epoch_ms: number;
  end_epoch_ms: number;
  total_ms: number;
  wall_clock_drift_ms: number;
  db_open_ms: number | null;
  setup_ms: number | null;
  collection_ms: number | null;
  collection_subphases: readonly CollectionSubphase[];
  collection_subphases_dropped: number;
  digest_ms: number | null;
  discord_ms: number | null;
  notifications_ms: number | null;
  health_ms: number | null;
  db_close_ms: number;
}>): void {
  try {
    const longestPhase = Math.max(
      phases.db_open_ms ?? 0, phases.setup_ms ?? 0, phases.collection_ms ?? 0,
      phases.digest_ms ?? 0, phases.discord_ms ?? 0, phases.notifications_ms ?? 0,
      phases.health_ms ?? 0, phases.db_close_ms,
    );
    if (phases.total_ms < 1_000 && longestPhase < 250) return;
    const processState = globalThis as PhaseLogProcessState;
    const budget = (processState[phaseLogStateKey] ??= { windowStart: 0, count: 0 });
    if (phases.end_epoch_ms - budget.windowStart >= 60_000) {
      budget.windowStart = phases.end_epoch_ms;
      budget.count = 0;
    }
    if (budget.count >= 8) return;
    budget.count++;
    console.info(`reverse_split_worker_phase_timing ${JSON.stringify(phases)}`);
  } catch { /* A timing log cannot affect worker work. */ }
}

export async function runReverseSplitWorkerOnce(): Promise<readonly string[]> {
  if (!reverseSplitPrivatePreviewEnabled() || running) return [];
  running = true;
  const startEpochMs = Date.now();
  const started = performance.now();
  let dbOpenMs: number | null = null;
  let setupMs: number | null = null;
  let collectionMs: number | null = null;
  const collectionSubphases: CollectionSubphase[] = [];
  let collectionSubphasesDropped = 0;
  const onCollectionTiming = (phase: ReverseSplitCollectionPhase, startEpochMs: number, durationMs: number): void => {
    try {
      if (!Number.isSafeInteger(startEpochMs) || !Number.isFinite(durationMs) || durationMs < 0) return;
      if (collectionSubphases.length >= 24) { collectionSubphasesDropped++; return; }
      collectionSubphases.push({ phase, start_epoch_ms: startEpochMs, duration_ms: Number(durationMs.toFixed(1)) });
    } catch { /* Diagnostics cannot change collection work. */ }
  };
  let digestMs: number | null = null;
  let discordMs: number | null = null;
  let notificationsMs: number | null = null;
  let healthMs: number | null = null;
  let database: Database.Database | undefined;
  try {
    const configuration = reverseSplitConfiguration();
    if (!configuration) return [];
    const openStarted = performance.now();
    try { database = openPlatformDatabase({ mode: "runtime" }); }
    finally { dbOpenMs = performance.now() - openStarted; }
    const schema = database.prepare<[], { count: number }>(`SELECT COUNT(*) AS count FROM sqlite_master WHERE type = 'table'
      AND name IN ('news_reverse_split_sources', 'news_reverse_split_events', 'news_reverse_split_discord_deliveries', 'news_reverse_split_runtime',
        'news_reverse_split_digests', 'news_reverse_split_notification_preferences', 'news_reverse_split_notification_deliveries')`).get();
    if (schema?.count !== 7) return ["reverse_split_migration_required"];
    const calendar = new CoachUsEquitiesCalendarRepository(database).calendar();
    const repository = new ReverseSplitRepository(database);
    setupMs = performance.now() - started - (dbOpenMs ?? 0);
    const collectionStarted = performance.now();
    const collection = await new ReverseSplitCollectionService(repository, configuration, calendar,
      fetch, () => new Date(), onCollectionTiming)
      .runOnce().finally(() => { collectionMs = performance.now() - collectionStarted; });
    const failures = [...collection.failures];
    const store = new ReverseSplitNotificationStore(database);
    const digestStarted = performance.now();
    try {
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
    } finally { digestMs = performance.now() - digestStarted; }
    if (configuration.discord) {
      const discordStarted = performance.now();
      try {
        const outbox = new ReverseSplitDiscordOutbox(database);
        const now = new Date().toISOString();
        const digest = store.pendingDiscord(configuration.discord.channelId, now);
        if (digest) outbox.enqueue({ channelId: configuration.discord.channelId, digestId: digest.id, date: digest.date,
          revision: digest.revision, signature: digest.signature, parts: digest.parts, now, expiresAt: digest.expiresAt });
        const delivery = await new ReverseSplitDiscordDelivery(outbox, configuration.discord).runOne();
        if (delivery.code) failures.push(delivery.code);
      } finally { discordMs = performance.now() - discordStarted; }
    }
    const notificationsStarted = performance.now();
    try { failures.push(...await runReverseSplitNotifications(store)); }
    finally { notificationsMs = performance.now() - notificationsStarted; }
    const healthStarted = performance.now();
    try {
      const finishedAt = new Date().toISOString();
      const health = repository.claimRuntime("worker_health", finishedAt);
      if (health) repository.completeRuntime(health, { lastPass: finishedAt, unit: collection.processed, failures }, finishedAt);
    } finally { healthMs = performance.now() - healthStarted; }
    return failures;
  } catch {
    return ["reverse_split_worker_unavailable"];
  } finally {
    const closeStarted = performance.now();
    try { database?.close(); } finally {
      const dbCloseMs = performance.now() - closeStarted;
      running = false;
      try {
        const endEpochMs = Date.now();
        const totalMs = performance.now() - started;
        const rounded = (value: number | null): number | null => value === null ? null : Number(value.toFixed(1));
        logReverseSplitPhases({
          start_epoch_ms: startEpochMs,
          end_epoch_ms: endEpochMs,
          total_ms: Number(totalMs.toFixed(1)),
          wall_clock_drift_ms: Number((endEpochMs - startEpochMs - totalMs).toFixed(1)),
          db_open_ms: rounded(dbOpenMs),
          setup_ms: rounded(setupMs),
          collection_ms: rounded(collectionMs),
          collection_subphases: collectionSubphases,
          collection_subphases_dropped: collectionSubphasesDropped,
          digest_ms: rounded(digestMs),
          discord_ms: rounded(discordMs),
          notifications_ms: rounded(notificationsMs),
          health_ms: rounded(healthMs),
          db_close_ms: Number(dbCloseMs.toFixed(1)),
        });
      } catch { /* A timing log cannot affect worker work. */ }
    }
  }
}
