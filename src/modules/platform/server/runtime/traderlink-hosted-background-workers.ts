import { runDailyTradeAnalyzerOnce } from "@/src/modules/level-analysis/server/daily-trade-analyzer-runtime";

import { openPlatformDatabase } from "../database/open-platform-database";
import { PlatformRemoteNotificationDeliveryRepository } from "../notifications/platform-remote-notification-delivery-repository";
import { PlatformRemoteNotificationDeliveryService } from "../notifications/platform-remote-notification-delivery-service";
import { reconcileWatchlistNotificationApprovals } from "@/src/modules/watchlist/server/notifications/watchlist-notification-runtime";
import { runWatchlistNotificationDelivery } from "@/src/modules/watchlist/server/notifications/watchlist-notification-delivery";

let workersStarted = false;

/**
 * Starts bounded background work only in the approved one-process hosted
 * runtime. Atomic job claims keep each unit of SQLite work single-writer safe.
 */
export function startTraderLinkHostedBackgroundWorkers(): void {
  if (workersStarted) return;
  workersStarted = true;

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
  const runWatchlistDelivery = () => void runWatchlistNotificationDelivery().catch(() => console.error("Watchlist notification delivery check failed."));
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
