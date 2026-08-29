import { runDailyTradeAnalyzerOnce } from "@/src/modules/level-analysis/server/daily-trade-analyzer-runtime";

import { openPlatformDatabase } from "../database/open-platform-database";
import { PlatformRemoteNotificationDeliveryRepository } from "../notifications/platform-remote-notification-delivery-repository";
import { PlatformRemoteNotificationDeliveryService } from "../notifications/platform-remote-notification-delivery-service";

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
      await runDailyTradeAnalyzerOnce();
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
  void deliverNotifications();
  setInterval(() => void runAnalyzer(), 30_000);
  setInterval(() => void deliverNotifications(), 15_000);
}
