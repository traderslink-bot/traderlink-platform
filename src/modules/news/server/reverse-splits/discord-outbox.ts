import "server-only";
import { createHash, randomUUID } from "node:crypto";
import type Database from "better-sqlite3";
import { assertCanonicalUtcTimestamp } from "@/src/modules/platform/server/database/platform-migration-contract";
import { isoDate } from "./contracts";

export type SplitDeliveryClaim = Readonly<{
  id: string; token: string; content: string; firstAttemptAt: string | null;
  reconcileOnly: boolean; attempt: number;
}>;
type QueueRow = {
  delivery_id: string; content: string; first_attempt_at_utc: string | null;
  state: string; attempt_count: number;
};
export type SplitDeliveryResult = Readonly<{
  state: "delivered" | "pending" | "uncertain" | "failed";
  messageId?: string; code?: string; retryAfterMs?: number;
}>;

export class ReverseSplitDiscordOutbox {
  constructor(private readonly database: Database.Database) {}

  enqueue(input: Readonly<{
    channelId: string; digestId: string; date: string; revision: number; signature: string; parts: readonly string[];
    now: string; expiresAt: string;
  }>): boolean {
    assertCanonicalUtcTimestamp(input.now, "reverseSplitDeliveryCreatedAt");
    assertCanonicalUtcTimestamp(input.expiresAt, "reverseSplitDeliveryExpiresAt");
    if (!/^\d{1,32}$/u.test(input.channelId) || !isoDate(input.date) || !/^[a-f0-9]{64}$/u.test(input.signature) ||
      !/^[a-f0-9]{64}$/u.test(input.digestId) || !Number.isSafeInteger(input.revision) || input.revision < 0 ||
      input.parts.length < 1 || input.parts.length > 100 || input.parts.some((part) => part.length < 1 || part.length > 1900) ||
      input.expiresAt <= input.now) throw new Error("reverse_split_delivery_invalid");
    return this.database.transaction(() => {
      if (this.database.prepare("SELECT 1 FROM news_reverse_split_discord_deliveries WHERE channel_id = ? AND digest_id = ? LIMIT 1")
        .get(input.channelId, input.digestId)) return false;
      const insert = this.database.prepare(`INSERT INTO news_reverse_split_discord_deliveries
        (delivery_id, digest_id, channel_id, digest_date, revision, part_index, event_signature, content, state,
         available_at_utc, expires_at_utc, created_at_utc, updated_at_utc)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?)`);
      for (const [part, content] of input.parts.entries()) {
        const id = createHash("sha256").update(`${input.channelId}:${input.digestId}:${part}`).digest("hex");
        const marked = `${content}\n\nRef: RS-${id.slice(0, 24)}`;
        insert.run(id, input.digestId, input.channelId, input.date, input.revision, part, input.signature, marked, input.now, input.expiresAt, input.now, input.now);
      }
      return true;
    }).immediate();
  }

  claim(channelId: string, now: string): SplitDeliveryClaim | null {
    assertCanonicalUtcTimestamp(now, "reverseSplitDeliveryClaimedAt");
    return this.database.transaction(() => {
      this.database.prepare(`UPDATE news_reverse_split_discord_deliveries SET state = 'expired', updated_at_utc = ?
        WHERE channel_id = ? AND state = 'pending' AND first_attempt_at_utc IS NULL AND expires_at_utc <= ?
        AND (lease_until_utc IS NULL OR lease_until_utc <= ?)`).run(now, channelId, now, now);
      const row = this.database.prepare<[string, string, string], QueueRow>(`SELECT delivery_id, content, first_attempt_at_utc, state, attempt_count
        FROM news_reverse_split_discord_deliveries d WHERE channel_id = ? AND state IN ('pending', 'sending', 'uncertain')
        AND available_at_utc <= ? AND (lease_until_utc IS NULL OR lease_until_utc <= ?)
        AND NOT EXISTS (SELECT 1 FROM news_reverse_split_discord_deliveries earlier
          WHERE earlier.channel_id = d.channel_id AND earlier.digest_date = d.digest_date
          AND (earlier.revision < d.revision OR (earlier.revision = d.revision AND earlier.part_index < d.part_index))
          AND earlier.state <> 'delivered')
        ORDER BY available_at_utc, digest_date, revision, part_index LIMIT 1`).get(channelId, now, now);
      if (!row) return null;
      const token = randomUUID();
      this.database.prepare(`UPDATE news_reverse_split_discord_deliveries SET lease_token = ?, lease_until_utc = ?,
        attempt_count = attempt_count + 1, updated_at_utc = ? WHERE delivery_id = ?`)
        .run(token, new Date(Date.parse(now) + 60_000).toISOString(), now, row.delivery_id);
      return { id: row.delivery_id, token, content: row.content, firstAttemptAt: row.first_attempt_at_utc,
        reconcileOnly: row.first_attempt_at_utc !== null || row.state === 'uncertain' || row.state === 'sending', attempt: row.attempt_count + 1 };
    }).immediate();
  }

  beginAttempt(claim: SplitDeliveryClaim, now: string): boolean {
    assertCanonicalUtcTimestamp(now, "reverseSplitDeliveryAttemptedAt");
    return this.database.prepare(`UPDATE news_reverse_split_discord_deliveries SET state = 'sending',
      first_attempt_at_utc = COALESCE(first_attempt_at_utc, ?), updated_at_utc = ?
      WHERE delivery_id = ? AND lease_token = ? AND lease_until_utc > ? AND expires_at_utc > ?
      AND first_attempt_at_utc IS NULL`).run(now, now, claim.id, claim.token, now, now).changes === 1;
  }

  complete(claim: SplitDeliveryClaim, result: SplitDeliveryResult, now: string): boolean {
    assertCanonicalUtcTimestamp(now, "reverseSplitDeliveryCompletedAt");
    if (result.state === "delivered" && !/^\d{1,32}$/u.test(result.messageId ?? "")) throw new Error("reverse_split_discord_receipt_invalid");
    const retry = Math.min(24 * 60 * 60_000, Math.max(15_000, result.retryAfterMs ?? 5 * 60_000));
    return this.database.prepare(`UPDATE news_reverse_split_discord_deliveries SET state = ?, discord_message_id = ?,
      failure_code = ?, available_at_utc = ?, lease_token = NULL, lease_until_utc = NULL, updated_at_utc = ?,
      first_attempt_at_utc = CASE WHEN ? = 'pending' THEN NULL ELSE first_attempt_at_utc END
      WHERE delivery_id = ? AND lease_token = ? AND lease_until_utc > ?`).run(result.state, result.messageId ?? null,
      result.code ?? null, new Date(Date.parse(now) + retry).toISOString(), now, result.state, claim.id, claim.token, now).changes === 1;
  }
}
