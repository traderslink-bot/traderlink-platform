import "server-only";

import { createHash } from "node:crypto";
import type Database from "better-sqlite3";

import type { WorkspaceAccessScope } from "../../contracts/workspace-access-scope";
import type { PlatformNotificationCategory } from "../../contracts/platform-notification-contracts";
import {
  assertCanonicalUtcTimestamp,
  createCanonicalUuidV4,
  platformFailure,
} from "../database/platform-migration-contract";
import type { PlatformWebPushEncryptionConfiguration } from "./platform-web-push-configuration";
import {
  decryptPlatformWebPushSubscription,
  encryptPlatformWebPushSubscription,
  normalizePlatformWebPushEndpoint,
  normalizePlatformWebPushSubscription,
  type PlatformWebPushSubscriptionInput,
} from "./platform-web-push-subscription-crypto";

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
  destination_path: string | null;
}>;

export type PlatformWebPushClaimedDelivery = Readonly<{
  attemptCount: number;
  deliveryRef: string;
  destinationPath: string;
  muteHaltTicker?: string;
  notificationActions?: readonly Readonly<{ action: string; title: string }>[];
  notificationBody?: string;
  notificationTag?: string;
  notificationTitle?: string;
  subscription: PlatformWebPushSubscriptionInput;
  subscriptionRef: string;
}>;

function digest(domain: string, value: string): string {
  return createHash("sha256").update(`${domain}\n${value}`, "utf8").digest("hex");
}

function endpointHash(endpoint: string): string {
  return digest("traderlink:web-push-endpoint:v1", endpoint);
}

function deviceRef(endpoint: string): string {
  return digest("traderlink:web-push-device:v1", endpoint);
}

function destinationPath(value: string | null): string {
  if (
    !value || value.length > 512 || !value.startsWith("/") ||
    value.startsWith("//") || value.includes("\\") || value.includes("://")
  ) {
    return "/notifications";
  }
  return value;
}

export class PlatformWebPushRepository {
  constructor(
    private readonly database: Database.Database,
    private readonly configuration: PlatformWebPushEncryptionConfiguration,
  ) {}

  private assertActiveScope(scope: WorkspaceAccessScope): void {
    const row = this.database.prepare<[string, string], { found: number }>(`SELECT 1 AS found
FROM platform_workspace_memberships membership
JOIN platform_users user ON user.user_id = membership.user_id
JOIN platform_workspaces workspace ON workspace.workspace_id = membership.workspace_id
WHERE membership.user_id = ? AND membership.workspace_id = ?
  AND membership.status = 'active' AND user.status = 'active'
  AND workspace.status = 'active'`).get(scope.userId, scope.workspaceId);
    if (!row) platformFailure("TRADERLINK_WORKSPACE_ACCESS_DENIED");
  }

  subscribe(input: Readonly<{
    scope: WorkspaceAccessScope;
    subscription: unknown;
    updatedAtUtc: string;
  }>): Readonly<{ deviceRef: string }> {
    this.assertActiveScope(input.scope);
    assertCanonicalUtcTimestamp(input.updatedAtUtc, "webPushSubscriptionUpdatedAt");
    const subscription = normalizePlatformWebPushSubscription(input.subscription);
    const currentEndpointHash = endpointHash(subscription.endpoint);
    const currentDeviceRef = deviceRef(subscription.endpoint);
    const encrypted = encryptPlatformWebPushSubscription({
      configuration: this.configuration,
      deviceRef: currentDeviceRef,
      endpointHash: currentEndpointHash,
      subscription,
      userId: input.scope.userId,
    });
    this.database.transaction(() => {
      this.database.prepare(`UPDATE platform_web_push_subscriptions
SET state = 'revoked', updated_at_utc = ?
WHERE endpoint_hash = ? AND user_id <> ? AND state = 'active'`).run(
        input.updatedAtUtc,
        currentEndpointHash,
        input.scope.userId,
      );
      this.database.prepare(`UPDATE platform_web_push_deliveries SET
  state = 'expired', failure_code = 'subscription_expired', updated_at_utc = ?
WHERE state IN ('pending', 'sending') AND subscription_id IN (
  SELECT subscription_id FROM platform_web_push_subscriptions
  WHERE endpoint_hash = ? AND user_id <> ? AND state = 'revoked'
)`).run(input.updatedAtUtc, currentEndpointHash, input.scope.userId);
      const existing = this.database.prepare<[string, string], { subscription_id: string }>(`SELECT subscription_id
FROM platform_web_push_subscriptions WHERE user_id = ? AND device_ref = ?`).get(
        input.scope.userId,
        currentDeviceRef,
      );
      if (existing) {
        this.database.prepare(`UPDATE platform_web_push_subscriptions SET
  endpoint_hash = ?, key_version = ?, initialization_vector = ?, ciphertext = ?,
  authentication_tag = ?, state = 'active', updated_at_utc = ?
WHERE subscription_id = ? AND user_id = ?`).run(
          currentEndpointHash,
          encrypted.keyVersion,
          encrypted.initializationVector,
          encrypted.ciphertext,
          encrypted.authenticationTag,
          input.updatedAtUtc,
          existing.subscription_id,
          input.scope.userId,
        );
        return;
      }
      this.database.prepare(`INSERT INTO platform_web_push_subscriptions (
  subscription_id, user_id, device_ref, endpoint_hash, key_version,
  initialization_vector, ciphertext, authentication_tag, state,
  failure_count, last_success_at_utc, last_failure_at_utc,
  created_at_utc, updated_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', 0, NULL, NULL, ?, ?)`).run(
        createCanonicalUuidV4(),
        input.scope.userId,
        currentDeviceRef,
        currentEndpointHash,
        encrypted.keyVersion,
        encrypted.initializationVector,
        encrypted.ciphertext,
        encrypted.authenticationTag,
        input.updatedAtUtc,
        input.updatedAtUtc,
      );
    }).immediate();
    return Object.freeze({ deviceRef: currentDeviceRef });
  }

  status(input: Readonly<{
    endpoint: unknown;
    scope: WorkspaceAccessScope;
  }>): "active" | "inactive" {
    this.assertActiveScope(input.scope);
    const endpoint = normalizePlatformWebPushEndpoint(input.endpoint);
    const row = this.database.prepare<[string, string], { state: string }>(`SELECT state
FROM platform_web_push_subscriptions
WHERE user_id = ? AND endpoint_hash = ?`).get(
      input.scope.userId,
      endpointHash(endpoint),
    );
    return row?.state === "active" ? "active" : "inactive";
  }

  revoke(input: Readonly<{
    endpoint: unknown;
    scope: WorkspaceAccessScope;
    updatedAtUtc: string;
  }>): void {
    this.assertActiveScope(input.scope);
    assertCanonicalUtcTimestamp(input.updatedAtUtc, "webPushSubscriptionUpdatedAt");
    const endpoint = normalizePlatformWebPushEndpoint(input.endpoint);
    const currentEndpointHash = endpointHash(endpoint);
    this.database.transaction(() => {
      this.database.prepare(`UPDATE platform_web_push_subscriptions
SET state = 'revoked', updated_at_utc = ?
WHERE user_id = ? AND endpoint_hash = ? AND state = 'active'`).run(
        input.updatedAtUtc,
        input.scope.userId,
        currentEndpointHash,
      );
      this.database.prepare(`UPDATE platform_web_push_deliveries SET
  state = 'expired', failure_code = 'subscription_expired', updated_at_utc = ?
WHERE state IN ('pending', 'sending') AND subscription_id IN (
  SELECT subscription_id FROM platform_web_push_subscriptions
  WHERE user_id = ? AND endpoint_hash = ? AND state = 'revoked'
)`).run(input.updatedAtUtc, input.scope.userId, currentEndpointHash);
    }).immediate();
  }

  enqueueNotification(input: Readonly<{
    category: PlatformNotificationCategory;
    notificationRef: string;
    occurredAtUtc: string;
    userId: string;
  }>): void {
    const enabled = this.database.prepare<[string, string], { enabled: number }>(`SELECT web_push_enabled AS enabled
FROM platform_notification_delivery_preferences
WHERE user_id = ? AND category = ?`).get(input.userId, input.category)?.enabled === 1;
    if (!enabled) return;
    const subscriptions = this.database.prepare<[string], { subscription_id: string }>(`SELECT subscription_id
FROM platform_web_push_subscriptions WHERE user_id = ? AND state = 'active'`).all(input.userId);
    for (const subscription of subscriptions) {
      this.database.prepare(`INSERT OR IGNORE INTO platform_web_push_deliveries (
  delivery_id, notification_id, subscription_id, state, attempt_count,
  available_at_utc, last_attempt_at_utc, delivered_at_utc, failure_code,
  created_at_utc, updated_at_utc
) VALUES (?, ?, ?, 'pending', 0, ?, NULL, NULL, NULL, ?, ?)`).run(
        createCanonicalUuidV4(),
        input.notificationRef,
        subscription.subscription_id,
        input.occurredAtUtc,
        input.occurredAtUtc,
        input.occurredAtUtc,
      );
    }
  }

  claimNext(nowUtc: string): PlatformWebPushClaimedDelivery | null {
    assertCanonicalUtcTimestamp(nowUtc, "webPushClaimedAt");
    const staleBefore = new Date(Date.parse(nowUtc) - 5 * 60_000).toISOString();
    return this.database.transaction(() => {
      this.database.prepare(`UPDATE platform_web_push_deliveries
SET state = 'failed', failure_code = 'delivery_failed', updated_at_utc = ?
WHERE state = 'sending' AND last_attempt_at_utc <= ? AND attempt_count >= 5`).run(
        nowUtc,
        staleBefore,
      );
      this.database.prepare(`UPDATE platform_web_push_deliveries
SET state = 'pending', available_at_utc = ?, updated_at_utc = ?
WHERE state = 'sending' AND last_attempt_at_utc <= ? AND attempt_count < 5`).run(
        nowUtc,
        nowUtc,
        staleBefore,
      );
      const row = this.database.prepare<[string], ClaimedDeliveryRow>(`SELECT
  delivery.delivery_id, delivery.attempt_count, notification.destination_path,
  subscription.subscription_id, subscription.user_id, subscription.device_ref,
  subscription.endpoint_hash, subscription.key_version,
  subscription.initialization_vector, subscription.ciphertext,
  subscription.authentication_tag
FROM platform_web_push_deliveries delivery
JOIN platform_notifications notification ON notification.notification_id = delivery.notification_id
JOIN platform_web_push_subscriptions subscription ON subscription.subscription_id = delivery.subscription_id
WHERE delivery.state = 'pending' AND delivery.available_at_utc <= ?
  AND subscription.state = 'active'
ORDER BY delivery.available_at_utc, delivery.created_at_utc
LIMIT 1`).get(nowUtc);
      if (!row) return null;
      const claimed = this.database.prepare(`UPDATE platform_web_push_deliveries
SET state = 'sending', attempt_count = attempt_count + 1,
    last_attempt_at_utc = ?, updated_at_utc = ?
WHERE delivery_id = ? AND state = 'pending'`).run(nowUtc, nowUtc, row.delivery_id);
      if (claimed.changes !== 1) return null;
      const subscription = decryptPlatformWebPushSubscription({
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
      });
      return Object.freeze({
        attemptCount: row.attempt_count + 1,
        deliveryRef: row.delivery_id,
        destinationPath: destinationPath(row.destination_path),
        subscription,
        subscriptionRef: row.subscription_id,
      });
    }).immediate();
  }

  delivered(input: Readonly<{ deliveryRef: string; subscriptionRef: string; timestamp: string }>): void {
    this.database.transaction(() => {
      this.database.prepare(`UPDATE platform_web_push_deliveries
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
      this.database.prepare(`UPDATE platform_web_push_deliveries SET
  state = ?, available_at_utc = COALESCE(?, available_at_utc),
  failure_code = ?, updated_at_utc = ?
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
        this.database.prepare(`UPDATE platform_web_push_deliveries SET
  state = 'expired', failure_code = 'subscription_expired', updated_at_utc = ?
WHERE subscription_id = ? AND state IN ('pending', 'sending')`).run(
          input.timestamp,
          input.subscriptionRef,
        );
      }
    }).immediate();
  }
}
