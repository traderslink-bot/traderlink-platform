import "server-only";

import type Database from "better-sqlite3";

import type { PlatformWebPushEncryptionConfiguration } from "../../platform/server/notifications/platform-web-push-configuration";
import type { PlatformWebPushClaimedDelivery } from "../../platform/server/notifications/platform-web-push-repository";
import { decryptPlatformWebPushSubscription } from "../../platform/server/notifications/platform-web-push-subscription-crypto";
import { assertCanonicalUtcTimestamp } from "../../platform/server/database/platform-migration-contract";

type SubscriptionRow = Readonly<{
  authentication_tag: string;
  ciphertext: string;
  device_ref: string;
  endpoint_hash: string;
  initialization_vector: string;
  key_version: string;
  subscription_id: string;
  user_id: string;
}>;

type ClaimedDeliveryRow = SubscriptionRow & Readonly<{
  attempt_count: number;
  delivery_id: string;
  notification_body: string;
  notification_title: string;
}>;

export class MarketHaltWebPushRepository {
  constructor(
    private readonly database: Database.Database,
    private readonly configuration: PlatformWebPushEncryptionConfiguration,
  ) {}

  claimNext(nowUtc: string): PlatformWebPushClaimedDelivery | null {
    assertCanonicalUtcTimestamp(nowUtc, "marketHaltWebPushClaimedAt");
    const staleBefore = new Date(Date.parse(nowUtc) - 5 * 60_000).toISOString();
    return this.database.transaction(() => {
      this.database.prepare(`UPDATE news_market_halt_push_deliveries
SET state = 'failed', failure_code = 'delivery_failed', updated_at_utc = ?
WHERE state = 'sending' AND last_attempt_at_utc <= ? AND attempt_count >= 5`).run(nowUtc, staleBefore);
      this.database.prepare(`UPDATE news_market_halt_push_deliveries
SET state = 'pending', available_at_utc = ?, updated_at_utc = ?
WHERE state = 'sending' AND last_attempt_at_utc <= ? AND attempt_count < 5`).run(nowUtc, nowUtc, staleBefore);
      this.database.prepare(`UPDATE news_market_halt_push_deliveries
SET state = 'expired', failure_code = 'alerts_disabled', updated_at_utc = ?
WHERE state = 'pending' AND (
  NOT EXISTS (SELECT 1 FROM news_market_halt_preferences preference
    JOIN platform_web_push_subscriptions subscription ON subscription.user_id = preference.user_id
    WHERE subscription.subscription_id = news_market_halt_push_deliveries.subscription_id
      AND preference.enabled = 1)
  OR EXISTS (SELECT 1 FROM news_market_halt_muted_tickers muted
    JOIN platform_web_push_subscriptions subscription ON subscription.user_id = muted.user_id
    JOIN news_market_halt_events halt ON halt.halt_id = news_market_halt_push_deliveries.halt_id
    WHERE subscription.subscription_id = news_market_halt_push_deliveries.subscription_id
      AND muted.ticker = halt.ticker)
)`).run(nowUtc);
      const row = this.database.prepare<[string], ClaimedDeliveryRow>(`SELECT
  delivery.delivery_id, delivery.attempt_count, delivery.notification_title, delivery.notification_body,
  subscription.subscription_id, subscription.user_id, subscription.device_ref,
  subscription.endpoint_hash, subscription.key_version, subscription.initialization_vector,
  subscription.ciphertext, subscription.authentication_tag
FROM news_market_halt_push_deliveries delivery
JOIN platform_web_push_subscriptions subscription ON subscription.subscription_id = delivery.subscription_id
WHERE delivery.state = 'pending' AND delivery.available_at_utc <= ?
  AND subscription.state = 'active'
ORDER BY delivery.available_at_utc, delivery.created_at_utc
LIMIT 1`).get(nowUtc);
      if (!row) return null;
      const claimed = this.database.prepare(`UPDATE news_market_halt_push_deliveries
SET state = 'sending', attempt_count = attempt_count + 1, last_attempt_at_utc = ?, updated_at_utc = ?
WHERE delivery_id = ? AND state = 'pending'`).run(nowUtc, nowUtc, row.delivery_id);
      if (claimed.changes !== 1) return null;
      return Object.freeze({
        attemptCount: row.attempt_count + 1,
        deliveryRef: row.delivery_id,
        destinationPath: "/account/preferences#push-notifications",
        notificationBody: row.notification_body,
        notificationTag: `market-halt:${row.delivery_id}`,
        notificationTitle: row.notification_title,
        subscription: decryptPlatformWebPushSubscription({
          configuration: this.configuration,
          deviceRef: row.device_ref,
          encrypted: {
            authenticationTag: row.authentication_tag,
            ciphertext: row.ciphertext,
            initializationVector: row.initialization_vector,
            keyVersion: row.key_version,
          },
          endpointHash: row.endpoint_hash,
          userId: row.user_id,
        }),
        subscriptionRef: row.subscription_id,
      });
    }).immediate();
  }

  delivered(input: Readonly<{ deliveryRef: string; subscriptionRef: string; timestamp: string }>): void {
    this.database.transaction(() => {
      this.database.prepare(`UPDATE news_market_halt_push_deliveries
SET state = 'delivered', delivered_at_utc = ?, failure_code = NULL, updated_at_utc = ?
WHERE delivery_id = ? AND state = 'sending'`).run(input.timestamp, input.timestamp, input.deliveryRef);
      this.database.prepare(`UPDATE platform_web_push_subscriptions
SET last_success_at_utc = ?, updated_at_utc = ? WHERE subscription_id = ?`).run(
        input.timestamp,
        input.timestamp,
        input.subscriptionRef,
      );
    }).immediate();
  }

  unavailable(input: Readonly<{
    deliveryRef: string;
    expired: boolean;
    retryAtUtc: string | null;
    subscriptionRef: string;
    timestamp: string;
  }>): void {
    this.database.transaction(() => {
      const state = input.expired ? "expired" : input.retryAtUtc ? "pending" : "failed";
      this.database.prepare(`UPDATE news_market_halt_push_deliveries SET
  state = ?, available_at_utc = COALESCE(?, available_at_utc), failure_code = ?, updated_at_utc = ?
WHERE delivery_id = ? AND state = 'sending'`).run(
        state,
        input.retryAtUtc,
        input.expired ? "subscription_expired" : input.retryAtUtc ? "delivery_retry" : "delivery_failed",
        input.timestamp,
        input.deliveryRef,
      );
      this.database.prepare(`UPDATE platform_web_push_subscriptions SET
  state = CASE WHEN ? = 1 THEN 'expired' ELSE state END,
  failure_count = failure_count + 1, last_failure_at_utc = ?, updated_at_utc = ?
WHERE subscription_id = ?`).run(
        input.expired ? 1 : 0,
        input.timestamp,
        input.timestamp,
        input.subscriptionRef,
      );
      if (input.expired) {
        this.database.prepare(`UPDATE news_market_halt_push_deliveries SET
  state = 'expired', failure_code = 'subscription_expired', updated_at_utc = ?
WHERE subscription_id = ? AND state IN ('pending', 'sending')`).run(input.timestamp, input.subscriptionRef);
      }
    }).immediate();
  }
}
