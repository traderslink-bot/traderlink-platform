import "server-only";

import type Database from "better-sqlite3";

import type { PlatformNotificationCategory } from "../../contracts/platform-notification-contracts";
import {
  assertCanonicalUtcTimestamp,
  assertCanonicalUuidV4,
  createCanonicalUuidV4,
} from "../database/platform-migration-contract";
import type { PlatformNotificationDeliveryResultCode } from "./platform-remote-notification-delivery-contracts";

type DeliveryRow = Readonly<{
  attempt_count: number;
  category: PlatformNotificationCategory;
  channel: "discord_dm" | "email";
  delivery_id: string;
  destination_path: string | null;
  recipient_user_id: string;
  summary: string;
  target_ref: string;
  title: string;
}>;

export type PlatformClaimedRemoteNotificationDelivery = Readonly<{
  attemptCount: number;
  category: PlatformNotificationCategory;
  channel: "discord_dm" | "email";
  deliveryRef: string;
  destinationPath: string | null;
  recipientUserId: string;
  summary: string;
  targetRef: string;
  title: string;
}>;

function retryAt(nowUtc: string, attemptCount: number): string {
  const delayMs = Math.min(30 * 60_000, 30_000 * (2 ** Math.max(0, attemptCount - 1)));
  return new Date(Date.parse(nowUtc) + delayMs).toISOString();
}

/**
 * Stores durable selected-channel deliveries. Destination identity is resolved
 * only after claim so no email address or Discord subject is copied into the
 * queue payload.
 */
export class PlatformRemoteNotificationDeliveryRepository {
  constructor(readonly database: Database.Database) {}

  enqueueNotification(input: Readonly<{
    category: PlatformNotificationCategory;
    notificationRef: string;
    occurredAtUtc: string;
    userId: string;
  }>): void {
    assertCanonicalUuidV4(input.notificationRef, "remoteNotificationRef");
    assertCanonicalUuidV4(input.userId, "remoteNotificationUserId");
    assertCanonicalUtcTimestamp(input.occurredAtUtc, "remoteNotificationOccurredAt");
    const preference = this.database.prepare<[string, PlatformNotificationCategory], Readonly<{
      discord_dm_enabled: number;
      email_enabled: number;
    }>>(`SELECT discord_dm_enabled, email_enabled
FROM platform_notification_delivery_preferences
WHERE user_id = ? AND category = ?`).get(input.userId, input.category);
    if (!preference) return;
    const insert = this.database.prepare(`INSERT OR IGNORE INTO platform_notification_remote_deliveries (
  delivery_id, notification_id, recipient_user_id, channel, target_ref, state,
  attempt_count, available_at_utc, last_attempt_at_utc, delivered_at_utc,
  provider_message_id, failure_code, created_at_utc, updated_at_utc
) VALUES (?, ?, ?, ?, ?, 'pending', 0, ?, NULL, NULL, NULL, NULL, ?, ?)`);
    if (preference.discord_dm_enabled === 1) {
      const identity = this.database.prepare<[string], { found: number }>(`SELECT 1 AS found
FROM platform_auth_identities
WHERE user_id = ? AND auth_provider = 'discord' AND status = 'active'`).get(input.userId);
      if (identity) {
        insert.run(
          createCanonicalUuidV4(), input.notificationRef, input.userId, "discord_dm", input.userId,
          input.occurredAtUtc, input.occurredAtUtc, input.occurredAtUtc,
        );
      }
    }
    if (preference.email_enabled === 1) {
      const email = this.database.prepare<[string], { email_address_id: string }>(`SELECT email_address_id
FROM platform_notification_email_addresses
WHERE user_id = ? AND state = 'confirmed'
ORDER BY confirmed_at_utc DESC, email_address_id DESC
LIMIT 1`).get(input.userId);
      if (email) {
        insert.run(
          createCanonicalUuidV4(), input.notificationRef, input.userId, "email", email.email_address_id,
          input.occurredAtUtc, input.occurredAtUtc, input.occurredAtUtc,
        );
      }
    }
  }

  claimNext(nowUtc: string): PlatformClaimedRemoteNotificationDelivery | null {
    assertCanonicalUtcTimestamp(nowUtc, "remoteNotificationClaimedAt");
    const staleBefore = new Date(Date.parse(nowUtc) - 5 * 60_000).toISOString();
    return this.database.transaction(() => {
      this.database.prepare(`UPDATE platform_notification_remote_deliveries
SET state = 'failed', failure_code = 'provider_unavailable', updated_at_utc = ?
WHERE state = 'sending' AND last_attempt_at_utc <= ? AND attempt_count >= 5`).run(nowUtc, staleBefore);
      this.database.prepare(`UPDATE platform_notification_remote_deliveries
SET state = 'pending', available_at_utc = ?, updated_at_utc = ?
WHERE state = 'sending' AND last_attempt_at_utc <= ? AND attempt_count < 5`).run(nowUtc, nowUtc, staleBefore);
      const row = this.database.prepare<[string], DeliveryRow>(`SELECT
  delivery.delivery_id, delivery.channel, delivery.target_ref, delivery.recipient_user_id,
  delivery.attempt_count, notification.category, notification.title, notification.summary,
  notification.destination_path
FROM platform_notification_remote_deliveries delivery
JOIN platform_notifications notification ON notification.notification_id = delivery.notification_id
WHERE delivery.state = 'pending' AND delivery.available_at_utc <= ?
ORDER BY delivery.available_at_utc, delivery.created_at_utc
LIMIT 1`).get(nowUtc);
      if (!row) return null;
      const claimed = this.database.prepare(`UPDATE platform_notification_remote_deliveries
SET state = 'sending', attempt_count = attempt_count + 1,
  last_attempt_at_utc = ?, updated_at_utc = ?
WHERE delivery_id = ? AND state = 'pending'`).run(nowUtc, nowUtc, row.delivery_id);
      if (claimed.changes !== 1) return null;
      return Object.freeze({
        attemptCount: row.attempt_count + 1,
        category: row.category,
        channel: row.channel,
        deliveryRef: row.delivery_id,
        destinationPath: row.destination_path,
        recipientUserId: row.recipient_user_id,
        summary: row.summary,
        targetRef: row.target_ref,
        title: row.title,
      });
    }).immediate();
  }

  complete(input: Readonly<{
    deliveryRef: string;
    resultCode: PlatformNotificationDeliveryResultCode;
    timestamp: string;
  }>): void {
    assertCanonicalUuidV4(input.deliveryRef, "remoteNotificationDeliveryRef");
    assertCanonicalUtcTimestamp(input.timestamp, "remoteNotificationDeliveryCompletedAt");
    const retryable = input.resultCode === "provider_unavailable";
    const row = this.database.prepare<[string], { attempt_count: number }>(`SELECT attempt_count
FROM platform_notification_remote_deliveries
WHERE delivery_id = ? AND state = 'sending'`).get(input.deliveryRef);
    if (!row) return;
    const willRetry = retryable && row.attempt_count < 5;
    this.database.prepare(`UPDATE platform_notification_remote_deliveries SET
  state = ?, available_at_utc = COALESCE(?, available_at_utc),
  delivered_at_utc = CASE WHEN ? = 'sent' THEN ? ELSE delivered_at_utc END,
  failure_code = CASE WHEN ? = 'sent' THEN NULL ELSE ? END,
  updated_at_utc = ?
WHERE delivery_id = ? AND state = 'sending'`).run(
      input.resultCode === "sent" ? "delivered" : willRetry ? "pending" : "failed",
      willRetry ? retryAt(input.timestamp, row.attempt_count) : null,
      input.resultCode,
      input.timestamp,
      input.resultCode,
      input.resultCode,
      input.timestamp,
      input.deliveryRef,
    );
  }
}
