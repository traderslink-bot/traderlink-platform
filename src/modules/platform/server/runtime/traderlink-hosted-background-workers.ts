import { runNotesNotifications } from "@/src/modules/watchlist/server/notifications/watchlist-notes-notifications";
import { startMoomooConnectionMonitor } from "../broker-connections/moomoo-connection-monitor-runtime";
import { startPlatformLoginMailWorker } from "../authentication/platform-login-mail-queue";
import { runCategoryMoveNotifications } from "@/src/modules/watchlist/server/notifications/watchlist-category-move-notifications";
import { runDailyTradeAnalyzerOnce } from "@/src/modules/level-analysis/server/daily-trade-analyzer-runtime";

import { openPlatformDatabase } from "../database/open-platform-database";
import { PlatformRemoteNotificationDeliveryRepository } from "../notifications/platform-remote-notification-delivery-repository";
import { PlatformRemoteNotificationDeliveryService } from "../notifications/platform-remote-notification-delivery-service";
import { reconcileWatchlistNotificationApprovals } from "@/src/modules/watchlist/server/notifications/watchlist-notification-runtime";
import { runWatchlistNotificationDelivery } from "@/src/modules/watchlist/server/notifications/watchlist-notification-delivery";
import { startWatchlistSetupSharedFeed } from "@/src/modules/watchlist/server/setups/setup-shared-feed-runtime";
import { startConfiguredLiveScannerRuntime } from "@/src/modules/scanner/live/server/runtime";

import { resolvePlatformBackgroundWorkerMode } from "@/src/modules/platform/server/runtime/platform-background-worker-mode";

let workersStarted = false;

/**
 * Starts bounded background work only in the approved one-process hosted
 * runtime. Atomic job claims keep each unit of SQLite work single-writer safe.
 */
export function startTraderLinkHostedBackgroundWorkers(): void {
  if (resolvePlatformBackgroundWorkerMode() !== "enabled") return;
  if (workersStarted) return;
  workersStarted = true;
  startMoomooConnectionMonitor();
  startWatchlistSetupSharedFeed();
  startConfiguredLiveScannerRuntime();
  startPlatformLoginMailWorker();
  if(process.env.NODE_ENV==="production"&&process.env.TRADERLINK_COMMUNITY_STATS_ENABLED==="1"){
    void import("@/src/modules/communities/server/stats/community-stats-runtime")
      .then(({startHostedCommunityStats})=>startHostedCommunityStats())
      .catch(()=>console.error("TraderLink Community Stats could not start."));
  }

  // Off until a separately authorized release enables Community delivery.
  if (process.env.NODE_ENV === "production"
    && process.env.TRADERLINK_COMMUNITY_DISCORD_DELIVERY_ENABLED === "true") {
    void import("@/src/modules/communities/server/community-discord-delivery-runtime")
      .then(({ startHostedCommunityDiscordDelivery }) => startHostedCommunityDiscordDelivery())
      .catch(() => console.error("TraderLink community delivery could not start."));
  }

  let analyzerRunning = false;
  const runAnalyzer = async (): Promise<void> => {
    if (analyzerRunning) return;
    analyzerRunning = true;
    try {
      const processed = await runDailyTradeAnalyzerOnce();
      if (processed) setTimeout(() => void runAnalyzer(), 2_000);
    } catch (error) {
      console.error("TraderLink hosted Trade Analyzer worker failed.", {
        errorName: error instanceof Error ? error.name : "UnknownError",
      });
    } finally {
      analyzerRunning = false;
    }
  };

  let notificationDeliveryRunning = false;
  const deliverNotifications = async (): Promise<void> => {
    if (notificationDeliveryRunning) return;
    notificationDeliveryRunning = true;
    const database = openPlatformDatabase({ mode: "runtime" });
    try {
      await new PlatformRemoteNotificationDeliveryService(
        new PlatformRemoteNotificationDeliveryRepository(database),
      ).runAvailable(20);
    } catch (error) {
      console.error("TraderLink hosted notification delivery worker failed.", {
        errorName: error instanceof Error ? error.name : "UnknownError",
      });
    } finally {
      database.close();
      notificationDeliveryRunning = false;
    }
  };

  void runAnalyzer();
  const runWatchlistApprovals = () => void reconcileWatchlistNotificationApprovals().catch(() => console.error("Watchlist notification approval check failed."));
  const runWatchlistDelivery = () => { void runNotesNotifications().catch(() => console.error("Watchlist notes notifications failed.")); void runCategoryMoveNotifications().catch(() => console.error("Watchlist move notifications failed.")); return void runWatchlistNotificationDelivery().catch(() => console.error("Watchlist notification delivery check failed.")); };
  runWatchlistApprovals();
  runWatchlistDelivery();
  setInterval(runWatchlistApprovals, 15_000);
  setInterval(runWatchlistDelivery, 15_000);
  void deliverNotifications();
  setInterval(() => void runAnalyzer(), 30_000);
  setInterval(() => void deliverNotifications(), 15_000);
  if (process.env.REVERSE_SPLIT_ENABLED === "true" && process.env.REVERSE_SPLIT_PRIVATE_PREVIEW_ENABLED === "true") {
    let reverseSplitRunning = false;
    let lastFailure = "";
    let lastFailureAt = 0;
    const runReverseSplits = async (): Promise<void> => {
      if (reverseSplitRunning) return;
      reverseSplitRunning = true;
      try {
        const { runReverseSplitWorkerOnce } = await import("@/src/modules/news/server/reverse-splits/runtime");
        const failures = await runReverseSplitWorkerOnce();
        const signature = [...failures].sort().join(",");
        if (signature && (signature !== lastFailure || Date.now() - lastFailureAt >= 15 * 60_000)) {
          console.error("TraderLink reverse-split worker needs attention.", { codes: failures });
          lastFailure = signature;
          lastFailureAt = Date.now();
        }
      } catch {
        if (lastFailure !== "worker_load_failed") console.error("TraderLink reverse-split worker could not start.");
        lastFailure = "worker_load_failed";
      } finally {
        reverseSplitRunning = false;
      }
    };
    void runReverseSplits();
    setInterval(() => void runReverseSplits(), 10_000);
  }
}
