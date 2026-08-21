import "server-only";

import type Database from "better-sqlite3";

import {
  pressReleaseChannelDefinition,
  type PressReleasePushChannel,
} from "../contracts/press-release-dashboard-contracts";
import { hasPressReleaseDashboardDiscordAccess } from "./press-release-dashboard-access";
import { resolveTraderLinkDiscordGuildId } from "../../platform/server/authentication/platform-discord-configuration";
import {
  assertCanonicalUtcTimestamp,
  createCanonicalUuidV4,
} from "../../platform/server/database/platform-migration-contract";
import type { PlatformWebPushEncryptionConfiguration } from "../../platform/server/notifications/platform-web-push-configuration";
import type { PlatformWebPushClaimedDelivery } from "../../platform/server/notifications/platform-web-push-repository";
import { decryptPlatformWebPushSubscription } from "../../platform/server/notifications/platform-web-push-subscription-crypto";

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
  destination_path: string;
  notification_body: string;
  notification_title: string;
}>;

type MembershipRow = Readonly<{
  guild_owner: number;
  role_ids_json: string;
}>;

type PublishedPressRelease = Readonly<{
  headline: string;
  id: string;
  publishedAt: string;
  routeTag: string | null;
  ticker: string;
}>;

function deliveryChannel(routeTag: string | null): PressReleasePushChannel | null {
  if (routeTag === "default" || routeTag === "spike") return "news_filtered";
  if (routeTag === "market_cap_under_30m") return routeTag;
  if (routeTag === "market_cap_30m_to_50m") return routeTag;
  if (routeTag === "market_cap_50m_to_100m") return routeTag;
  return null;
}

function parsedRoleIds(value: string): readonly string[] {
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed)
      ? Object.freeze(parsed.filter((item): item is string => typeof item === "string"))
      : Object.freeze([]);
  } catch {
    return Object.freeze([]);
  }
}

function compact(value: string, maximum: number): string {
  return value.replace(/\s+/gu, " ").trim().slice(0, maximum);
}

export class PressReleaseWebPushRepository {
  constructor(
    private readonly database: Database.Database,
    private readonly configuration: PlatformWebPushEncryptionConfiguration,
    private readonly environment: NodeJS.ProcessEnv = process.env,
  ) {}

  enqueueArticle(article: PublishedPressRelease): number {
    const channel = deliveryChannel(article.routeTag);
    if (!channel) return 0;
    const enabledUsers = this.database.prepare<[string], { user_id: string }>(`SELECT user_id
FROM news_press_release_push_preferences
WHERE channel = ? AND enabled = 1`).all(channel);
    const eligibleUserIds = enabledUsers.map((row) => row.user_id).filter((userId) => {
      if (this.environment.NODE_ENV !== "production") return true;
      const membership = this.database.prepare<[string, string], MembershipRow>(`SELECT guild_owner, role_ids_json
FROM platform_discord_memberships
WHERE user_id = ? AND guild_id = ?`).get(
        userId,
        resolveTraderLinkDiscordGuildId(this.environment),
      );
      return membership ? hasPressReleaseDashboardDiscordAccess({
        guildOwner: membership.guild_owner === 1,
        roleIds: parsedRoleIds(membership.role_ids_json),
      }, this.environment) : false;
    });
    const articlePath = `${pressReleaseChannelDefinition(channel).href}?article=${encodeURIComponent(article.id)}`;
    const destinationPath = this.environment.NODE_ENV === "production"
      ? `/api/auth/discord/login?returnTo=${encodeURIComponent(articlePath)}`
      : articlePath;
    const title = compact(`${article.ticker} press release`, 80);
    const body = compact(article.headline, 240);
    let enqueued = 0;
    this.database.transaction(() => {
      for (const userId of eligibleUserIds) {
        const subscriptions = this.database.prepare<[string], { subscription_id: string }>(`SELECT subscription_id
FROM platform_web_push_subscriptions
WHERE user_id = ? AND state = 'active'`).all(userId);
        for (const subscription of subscriptions) {
          const result = this.database.prepare(`INSERT OR IGNORE INTO news_press_release_push_deliveries (
  delivery_id, article_id, subscription_id, channel, destination_path,
  notification_title, notification_body, state, attempt_count,
  available_at_utc, last_attempt_at_utc, delivered_at_utc, failure_code,
  created_at_utc, updated_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', 0, ?, NULL, NULL, NULL, ?, ?)`).run(
            createCanonicalUuidV4(),
            article.id,
            subscription.subscription_id,
            channel,
            destinationPath,
            title,
            body,
            article.publishedAt,
            article.publishedAt,
            article.publishedAt,
          );
          enqueued += result.changes;
        }
      }
    }).immediate();
    return enqueued;
  }

  claimNext(nowUtc: string): PlatformWebPushClaimedDelivery | null {
    assertCanonicalUtcTimestamp(nowUtc, "newsWebPushClaimedAt");
    const staleBefore = new Date(Date.parse(nowUtc) - 5 * 60_000).toISOString();
    return this.database.transaction(() => {
      this.database.prepare(`UPDATE news_press_release_push_deliveries
SET state = 'failed', failure_code = 'delivery_failed', updated_at_utc = ?
WHERE state = 'sending' AND last_attempt_at_utc <= ? AND attempt_count >= 5`).run(nowUtc, staleBefore);
      this.database.prepare(`UPDATE news_press_release_push_deliveries
SET state = 'pending', available_at_utc = ?, updated_at_utc = ?
WHERE state = 'sending' AND last_attempt_at_utc <= ? AND attempt_count < 5`).run(nowUtc, nowUtc, staleBefore);
      const row = this.database.prepare<[string], ClaimedDeliveryRow>(`SELECT
  delivery.delivery_id, delivery.attempt_count, delivery.destination_path,
  delivery.notification_title, delivery.notification_body,
  subscription.subscription_id, subscription.user_id, subscription.device_ref,
  subscription.endpoint_hash, subscription.key_version,
  subscription.initialization_vector, subscription.ciphertext,
  subscription.authentication_tag
FROM news_press_release_push_deliveries delivery
JOIN platform_web_push_subscriptions subscription
  ON subscription.subscription_id = delivery.subscription_id
WHERE delivery.state = 'pending' AND delivery.available_at_utc <= ?
  AND subscription.state = 'active'
ORDER BY delivery.available_at_utc, delivery.created_at_utc
LIMIT 1`).get(nowUtc);
      if (!row) return null;
      const claimed = this.database.prepare(`UPDATE news_press_release_push_deliveries
SET state = 'sending', attempt_count = attempt_count + 1,
    last_attempt_at_utc = ?, updated_at_utc = ?
WHERE delivery_id = ? AND state = 'pending'`).run(nowUtc, nowUtc, row.delivery_id);
      if (claimed.changes !== 1) return null;
      return Object.freeze({
        attemptCount: row.attempt_count + 1,
        deliveryRef: row.delivery_id,
        destinationPath: row.destination_path,
        notificationBody: row.notification_body,
        notificationTag: `press-release:${row.delivery_id}`,
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
      this.database.prepare(`UPDATE news_press_release_push_deliveries
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
      this.database.prepare(`UPDATE news_press_release_push_deliveries SET
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
        this.database.prepare(`UPDATE news_press_release_push_deliveries SET
  state = 'expired', failure_code = 'subscription_expired', updated_at_utc = ?
WHERE subscription_id = ? AND state IN ('pending', 'sending')`).run(
          input.timestamp,
          input.subscriptionRef,
        );
      }
    }).immediate();
  }
}
