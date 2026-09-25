import "server-only";
import { createHash, randomUUID } from "node:crypto";
import type Database from "better-sqlite3";
import { assertCanonicalUtcTimestamp, assertCanonicalUuidV4 } from "@/src/modules/platform/server/database/platform-migration-contract";
import { TRADERLINK_WATCHLIST_DASHBOARD_NAV_DISCORD_SUBJECT_ENV } from "@/src/modules/watchlist/server/access/watchlist-dashboard-navigation-access";
import { isoDate, type ReverseSplitEvent } from "./contracts";
import { reverseSplitPrivatePreviewEnabled } from "./configuration";

export type SplitDigest = Readonly<{
  id: string; date: string; revision: number; signature: string; events: readonly ReverseSplitEvent[];
  parts: readonly string[]; title: string; summary: string; expiresAt: string; createdAt: string;
}>;
type DigestRow = {
  digest_id: string; digest_date: string; revision: number; event_signature: string; events_json: string;
  parts_json: string; notification_title: string; notification_summary: string; expires_at_utc: string; created_at_utc: string;
};
export type SplitNotificationClaim = Readonly<{
  id: string; digestId: string; userId: string; channel: "web_push" | "email"; targetRef: string;
  token: string; attempt: number; title: string; summary: string; expiresAt: string;
}>;
type ClaimRow = { delivery_id: string; digest_id: string; user_id: string; target_ref: string; attempt_count: number;
  notification_title: string; notification_summary: string; expires_at_utc: string };
export type SplitPreferences = Readonly<{ webPushEnabled: boolean; emailEnabled: boolean }>;

export function reverseSplitOwnerSubjects(env: NodeJS.ProcessEnv = process.env): readonly string[] {
  const subjects = env[TRADERLINK_WATCHLIST_DASHBOARD_NAV_DISCORD_SUBJECT_ENV]?.split(",").map((value) => value.trim()) ?? [];
  return subjects.length === 2 && new Set(subjects).size === 2 && subjects.every((value) => /^\d{1,32}$/u.test(value)) ? subjects : [];
}

export function reverseSplitOwnerUser(database: Database.Database, userId: string, env: NodeJS.ProcessEnv = process.env): boolean {
  const subjects = reverseSplitOwnerSubjects(env);
  if (subjects.length !== 2) return false;
  return Boolean(database.prepare<[string, string, string], { n: number }>(`SELECT COUNT(*) AS n FROM platform_users u
    JOIN platform_auth_identities i ON i.user_id = u.user_id AND i.auth_provider = 'discord' AND i.status = 'active'
    WHERE u.user_id = ? AND u.status = 'active' AND i.auth_subject IN (?, ?)`).get(userId, subjects[0], subjects[1])?.n);
}

function digest(row: DigestRow): SplitDigest {
  return { id: row.digest_id, date: row.digest_date, revision: row.revision, signature: row.event_signature,
    events: JSON.parse(row.events_json), parts: JSON.parse(row.parts_json), title: row.notification_title,
    summary: row.notification_summary, expiresAt: row.expires_at_utc, createdAt: row.created_at_utc };
}

export class ReverseSplitNotificationStore {
  constructor(readonly database: Database.Database, private readonly env: NodeJS.ProcessEnv = process.env) {}

  preferences(userId: string): SplitPreferences {
    const row = this.database.prepare<[string], { web_push_enabled: number; email_enabled: number }>(
      "SELECT web_push_enabled, email_enabled FROM news_reverse_split_notification_preferences WHERE user_id = ?").get(userId);
    return { webPushEnabled: row?.web_push_enabled === 1, emailEnabled: row?.email_enabled === 1 };
  }

  savePreferences(userId: string, value: SplitPreferences, now: string): void {
    assertCanonicalUuidV4(userId, "reverseSplitPreferenceUser");
    assertCanonicalUtcTimestamp(now, "reverseSplitPreferenceUpdatedAt");
    if (typeof value.webPushEnabled !== "boolean" || typeof value.emailEnabled !== "boolean" || !reverseSplitOwnerUser(this.database, userId, this.env)) throw new Error("reverse_split_preference_access_denied");
    this.database.prepare(`INSERT INTO news_reverse_split_notification_preferences(user_id, web_push_enabled, email_enabled, updated_at_utc)
      VALUES (?, ?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET web_push_enabled = excluded.web_push_enabled,
      email_enabled = excluded.email_enabled, updated_at_utc = excluded.updated_at_utc`).run(userId, Number(value.webPushEnabled), Number(value.emailEnabled), now);
  }

  latest(date: string): SplitDigest | null {
    const row = this.database.prepare<[string], DigestRow>("SELECT * FROM news_reverse_split_digests WHERE digest_date = ? ORDER BY revision DESC LIMIT 1").get(date);
    return row ? digest(row) : null;
  }

  publish(input: Omit<SplitDigest, "id" | "revision">): boolean {
    assertCanonicalUtcTimestamp(input.createdAt, "reverseSplitDigestCreatedAt");
    assertCanonicalUtcTimestamp(input.expiresAt, "reverseSplitDigestExpiresAt");
    if (!isoDate(input.date) || !/^[a-f0-9]{64}$/u.test(input.signature) || input.expiresAt <= input.createdAt ||
      input.events.length > 100 || JSON.stringify(input.events).length > 100_000 ||
      input.parts.length < 1 || input.parts.length > 100 || input.parts.some((part) => !part.length || part.length > 1900) ||
      !input.title.length || input.title.length > 160 || !input.summary.length || input.summary.length > 500 || /[\r\n]/u.test(input.title + input.summary)) throw new Error("reverse_split_digest_invalid");
    return this.database.transaction(() => {
      const latest = this.latest(input.date);
      if (latest?.signature === input.signature) return false;
      const revision = latest ? latest.revision + 1 : 0;
      const id = createHash("sha256").update(`${input.date}:${revision}:${input.signature}`).digest("hex");
      this.database.prepare(`INSERT INTO news_reverse_split_digests(digest_id, digest_date, revision, event_signature,
        events_json, parts_json, notification_title, notification_summary, expires_at_utc, created_at_utc)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(id, input.date, revision, input.signature, JSON.stringify(input.events),
        JSON.stringify(input.parts), input.title, input.summary, input.expiresAt, input.createdAt);
      if (input.events.length && reverseSplitPrivatePreviewEnabled(this.env) && this.env.REVERSE_SPLIT_NOTIFICATIONS_ENABLED === "true") this.captureRecipients(id, input.createdAt);
      return true;
    }).immediate();
  }

  private captureRecipients(digestId: string, now: string): void {
    const subjects = reverseSplitOwnerSubjects(this.env);
    if (subjects.length !== 2) return;
    const users = this.database.prepare<[string, string], { user_id: string; web_push_enabled: number; email_enabled: number }>(`SELECT p.*
      FROM news_reverse_split_notification_preferences p JOIN platform_users u ON u.user_id = p.user_id AND u.status = 'active'
      WHERE (p.web_push_enabled = 1 OR p.email_enabled = 1) AND EXISTS(SELECT 1 FROM platform_auth_identities i
        WHERE i.user_id = p.user_id AND i.auth_provider = 'discord' AND i.status = 'active' AND i.auth_subject IN (?, ?))`).all(subjects[0], subjects[1]);
    const insert = this.database.prepare(`INSERT OR IGNORE INTO news_reverse_split_notification_deliveries
      (delivery_id, digest_id, user_id, channel, target_ref, state, available_at_utc, created_at_utc, updated_at_utc)
      VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, ?)`);
    for (const user of users) for (const channel of ["web_push", "email"] as const) {
      if (!(channel === "web_push" ? user.web_push_enabled : user.email_enabled)) continue;
      const targets = channel === "web_push"
        ? this.database.prepare<[string], { id: string }>("SELECT subscription_id AS id FROM platform_web_push_subscriptions WHERE user_id = ? AND state = 'active'").all(user.user_id)
        : this.database.prepare<[string], { id: string }>("SELECT email_address_id AS id FROM platform_notification_email_addresses WHERE user_id = ? AND state = 'confirmed' ORDER BY confirmed_at_utc DESC, email_address_id DESC LIMIT 1").all(user.user_id);
      for (const target of targets) {
        const id = createHash("sha256").update(`${digestId}:${user.user_id}:${channel}:${target.id}`).digest("hex");
        insert.run(id, digestId, user.user_id, channel, target.id, now, now, now);
      }
    }
  }

  pendingDiscord(channelId: string, now: string): SplitDigest | null {
    const row = this.database.prepare<[string, string], DigestRow>(`SELECT d.* FROM news_reverse_split_digests d
      WHERE d.expires_at_utc > ? AND NOT EXISTS(SELECT 1 FROM news_reverse_split_discord_deliveries sent
        WHERE sent.digest_id = d.digest_id AND sent.channel_id = ?) ORDER BY d.digest_date, d.revision LIMIT 1`).get(now, channelId);
    return row ? digest(row) : null;
  }

  claim(channel: "web_push" | "email", now: string): SplitNotificationClaim | null {
    assertCanonicalUtcTimestamp(now, "reverseSplitNotificationClaimedAt");
    if (!reverseSplitPrivatePreviewEnabled(this.env) || this.env.REVERSE_SPLIT_NOTIFICATIONS_ENABLED !== "true") return null;
    return this.database.transaction(() => {
      this.database.prepare(`UPDATE news_reverse_split_notification_deliveries SET state = 'expired', updated_at_utc = ?
        WHERE state IN ('pending', 'sending') AND digest_id IN (SELECT digest_id FROM news_reverse_split_digests WHERE expires_at_utc <= ?)
        AND (lease_until_utc IS NULL OR lease_until_utc <= ?)`).run(now, now, now);
      for (let index = 0; index < 10; index++) {
        const row = this.database.prepare<[string, string, string], ClaimRow>(`SELECT n.*, d.notification_title, d.notification_summary, d.expires_at_utc
          FROM news_reverse_split_notification_deliveries n JOIN news_reverse_split_digests d ON d.digest_id = n.digest_id
          WHERE n.channel = ? AND n.state IN ('pending', 'sending') AND n.available_at_utc <= ?
          AND (n.lease_until_utc IS NULL OR n.lease_until_utc <= ?)
          AND NOT EXISTS (SELECT 1 FROM news_reverse_split_notification_deliveries prior
            JOIN news_reverse_split_digests pd ON pd.digest_id = prior.digest_id
            WHERE prior.user_id = n.user_id AND prior.channel = n.channel AND prior.target_ref = n.target_ref
            AND prior.state IN ('pending', 'sending') AND pd.digest_date = d.digest_date AND pd.revision < d.revision)
          ORDER BY n.created_at_utc, n.delivery_id LIMIT 1`).get(channel, now, now);
        if (!row) return null;
        const preferences = this.preferences(row.user_id);
        const allowed = channel === "web_push" ? preferences.webPushEnabled : preferences.emailEnabled;
        const failure = !allowed ? "opted_out" : !reverseSplitOwnerUser(this.database, row.user_id, this.env) ? "inaccessible" : row.attempt_count >= 5 ? "failed" : null;
        if (failure) {
          this.database.prepare("UPDATE news_reverse_split_notification_deliveries SET state = ?, updated_at_utc = ? WHERE delivery_id = ?").run(failure, now, row.delivery_id);
          continue;
        }
        const token = randomUUID();
        this.database.prepare(`UPDATE news_reverse_split_notification_deliveries SET state = 'sending', attempt_count = attempt_count + 1,
          lease_token = ?, lease_until_utc = ?, updated_at_utc = ? WHERE delivery_id = ?`).run(token, new Date(Date.parse(now) + 60_000).toISOString(), now, row.delivery_id);
        return { id: row.delivery_id, digestId: row.digest_id, userId: row.user_id, channel, targetRef: row.target_ref, token,
          attempt: row.attempt_count + 1, title: row.notification_title, summary: row.notification_summary, expiresAt: row.expires_at_utc };
      }
      return null;
    }).immediate();
  }

  complete(claim: SplitNotificationClaim, input: Readonly<{ sent: boolean; code: string; retryAt: string | null }>, now: string): boolean {
    assertCanonicalUtcTimestamp(now, "reverseSplitNotificationCompletedAt");
    const retry = !input.sent && input.retryAt !== null && claim.attempt < 5 && input.retryAt < claim.expiresAt;
    return this.database.prepare(`UPDATE news_reverse_split_notification_deliveries SET state = ?, failure_code = ?, delivered_at_utc = ?,
      available_at_utc = ?, lease_token = NULL, lease_until_utc = NULL, updated_at_utc = ?
      WHERE delivery_id = ? AND lease_token = ? AND lease_until_utc > ?`).run(input.sent ? "delivered" : retry ? "pending" : "failed",
      input.sent ? null : input.code, input.sent ? now : null, retry ? input.retryAt : now, now, claim.id, claim.token, now).changes === 1;
  }
}
