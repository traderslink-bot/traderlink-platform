import "server-only";

import type { WorkspaceAccessScope } from "../../contracts/workspace-access-scope";
import { openPlatformDatabase } from "../database/open-platform-database";
import { createCanonicalUtcTimestamp, createCanonicalUuidV4 } from "../database/platform-migration-contract";
import { PlatformNotificationRepository } from "./platform-notification-repository";
import { loadPlatformWebPushConfiguration } from "./platform-web-push-configuration";
import { PlatformWebPushDeliveryService } from "./platform-web-push-delivery-service";
import { PlatformWebPushRepository } from "./platform-web-push-repository";

export async function runPlatformWebPushDeviceTest(scope: WorkspaceAccessScope, endpoint: unknown) {
  const configuration = loadPlatformWebPushConfiguration();
  const database = openPlatformDatabase({ mode: "runtime" });
  try {
    const repository = new PlatformWebPushRepository(database, configuration.encryption);
    const deliveryRef = database.transaction(() => {
      const nowUtc = createCanonicalUtcTimestamp();
      const previous = database.prepare<[string, string], { found: number }>(`SELECT 1 AS found
FROM platform_notifications WHERE recipient_user_id = ?
  AND source_event_key GLOB 'push_test_*' AND occurred_at_utc >= ? LIMIT 1`).get(
        scope.userId, new Date(Date.parse(nowUtc) - 60_000).toISOString(),
      );
      if (previous) throw new Error("push_test_rate_limited");
      const notification = new PlatformNotificationRepository(database).create({
        scope, category: "chart_update", kind: "chart_update_ready", journalAccountId: null,
        occurredAtUtc: nowUtc, sourceEventKey: `push_test_${createCanonicalUuidV4()}`,
        title: "Push notification test", summary: "A test requested for one of your devices.",
        destinationPath: "/account/preferences#push-notifications",
        webPushDelivery: false, remoteDelivery: false,
      });
      return repository.enqueueDeviceTest({ scope, endpoint, notificationRef: notification.notificationRef, nowUtc });
    }).immediate();
    // Only this requested delivery may be sent by this request; no other devices/channels.
    await new PlatformWebPushDeliveryService({
      claimNext: (nowUtc) => {
        const delivery = repository.claimNext(nowUtc, deliveryRef);
        return delivery ? { ...delivery, notificationTitle: "TradersLink push test",
          notificationBody: "Your test reached this device. Tap to open notification settings.",
          urgency: "high", timeToLiveSeconds: 60 } : null;
      },
      delivered: (input) => repository.delivered(input),
      unavailable: (input) => repository.unavailable(input),
    }, configuration).runOne();
    const test = database.prepare<[string], { state: string }>(
      "SELECT state FROM platform_web_push_deliveries WHERE delivery_id = ?",
    ).get(deliveryRef);
    return { status: repository.status({ scope, endpoint }),
      testState: test?.state === "delivered" ? "provider_accepted" : test?.state ?? "unknown" };
  } finally {
    database.close();
  }
}
