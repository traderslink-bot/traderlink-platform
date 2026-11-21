import "server-only";

import type Database from "better-sqlite3";
import { assertCanonicalUtcTimestamp, createCanonicalUuidV4 } from "../../platform/server/database/platform-migration-contract";

const DELIVERY_TTL_MS = 120_000;
const CLAIM_LEASE_MS = 30_000;

export type ClaimedHaltDiscordDelivery = Readonly<{
  delivery_id: string;
  channel_id: string;
  notification_title: string;
  notification_body: string;
  attempt_count: number;
  expires_at_utc: string;
  last_attempt_at_utc: string;
}>;

export type HaltDiscordDeliveryResult = Readonly<{
  code: "sent" | "rate_limited" | "provider_unavailable" | "provider_rejected" | "invalid_destination";
  messageId?: string;
  retryAfterMs?: number;
}>;

export class MarketHaltDiscordRepository {
  constructor(private readonly database: Database.Database) {}

  enqueue(input: Readonly<{
    channelId: string;
    haltId: string;
    stage: "initial" | "quote_time" | "trade_time";
    revision: number;
    title: string;
    body: string;
    occurredAtUtc: string;
  }>): void {
    assertCanonicalUtcTimestamp(input.occurredAtUtc, "haltDiscordOccurredAt");
    this.database.prepare(`INSERT OR IGNORE INTO news_market_halt_discord_deliveries (
  delivery_id, halt_id, channel_id, notification_stage, notification_revision,
  notification_title, notification_body, state, available_at_utc, expires_at_utc,
  created_at_utc, updated_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?)`).run(
      createCanonicalUuidV4(), input.haltId, input.channelId, input.stage, input.revision,
      input.title, input.body, input.occurredAtUtc,
      new Date(Date.parse(input.occurredAtUtc) + DELIVERY_TTL_MS).toISOString(),
      input.occurredAtUtc, input.occurredAtUtc,
    );
  }

  claimNext(channelId: string, nowUtc: string): ClaimedHaltDiscordDelivery | null {
    assertCanonicalUtcTimestamp(nowUtc, "haltDiscordClaimedAt");
    const staleLease = new Date(Date.parse(nowUtc) - CLAIM_LEASE_MS).toISOString();
    return this.database.transaction(() => {
      this.database.prepare(`UPDATE news_market_halt_discord_deliveries
SET state = 'expired', failure_code = 'delivery_stale', updated_at_utc = ?
WHERE state IN ('pending', 'sending') AND expires_at_utc <= ?`).run(nowUtc, nowUtc);
      this.database.prepare(`UPDATE news_market_halt_discord_deliveries
SET state = CASE WHEN attempt_count < 5 THEN 'pending' ELSE 'failed' END,
  failure_code = 'lease_expired', updated_at_utc = ?
WHERE state = 'sending' AND last_attempt_at_utc <= ?`).run(nowUtc, staleLease);
      // Retain provider cooldowns even when the alert itself has expired.
      const blocked = this.database.prepare<[string, string], { found: number }>(`SELECT 1 AS found
FROM news_market_halt_discord_deliveries WHERE channel_id = ? AND blocked_until_utc > ? LIMIT 1`).get(channelId, nowUtc);
      if (blocked) return null;
      const row = this.database.prepare<[string], ClaimedHaltDiscordDelivery & {
        state: string; available_at_utc: string;
      }>(`SELECT delivery_id, channel_id, notification_title, notification_body,
  attempt_count, expires_at_utc, last_attempt_at_utc, state, available_at_utc
FROM news_market_halt_discord_deliveries
WHERE channel_id = ? AND state IN ('pending', 'sending')
ORDER BY created_at_utc, CASE notification_stage WHEN 'initial' THEN 0 ELSE 1 END,
  notification_revision, delivery_id LIMIT 1`).get(channelId);
      // A waiting or in-flight predecessor holds the channel to preserve order.
      if (!row || row.state !== "pending" || row.available_at_utc > nowUtc) return null;
      const changed = this.database.prepare(`UPDATE news_market_halt_discord_deliveries
SET state = 'sending', attempt_count = attempt_count + 1, last_attempt_at_utc = ?, updated_at_utc = ?
WHERE delivery_id = ? AND state = 'pending' AND attempt_count < 5`).run(nowUtc, nowUtc, row.delivery_id);
      return changed.changes === 1
        ? Object.freeze({ ...row, attempt_count: row.attempt_count + 1, last_attempt_at_utc: nowUtc })
        : null;
    }).immediate();
  }

  complete(delivery: ClaimedHaltDiscordDelivery, result: HaltDiscordDeliveryResult, nowUtc: string): void {
    assertCanonicalUtcTimestamp(nowUtc, "haltDiscordCompletedAt");
    const retryable = result.code === "provider_unavailable" || result.code === "rate_limited";
    const retryDelay = result.retryAfterMs ?? Math.min(15_000 * delivery.attempt_count, 60_000);
    const retryAt = new Date(Date.parse(nowUtc) + retryDelay).toISOString();
    const canRetry = retryable && delivery.attempt_count < 5 && retryAt < delivery.expires_at_utc;
    const state = result.code === "sent" ? "delivered" : canRetry ? "pending"
      : retryable && retryAt >= delivery.expires_at_utc ? "expired" : "failed";
    this.database.prepare(`UPDATE news_market_halt_discord_deliveries SET
  state = ?, available_at_utc = ?, blocked_until_utc = ?, discord_message_id = ?,
  delivered_at_utc = ?, failure_code = ?, updated_at_utc = ?
WHERE delivery_id = ? AND state = 'sending' AND attempt_count = ? AND last_attempt_at_utc = ?`).run(
      state, canRetry ? retryAt : nowUtc,
      result.retryAfterMs !== undefined ? retryAt : null,
      result.messageId ?? null, result.code === "sent" ? nowUtc : null,
      result.code === "sent" ? null : result.code, nowUtc,
      delivery.delivery_id, delivery.attempt_count, delivery.last_attempt_at_utc,
    );
  }
}
