import { randomUUID } from "node:crypto";
import type Database from "better-sqlite3";
import {
  parseWatchlistPublicationNotificationEvent,
  watchlistNotificationExpired,
  WATCHLIST_NOTIFICATION_MAX_AGE_MS,
  type WatchlistNotificationChannel,
  type WatchlistPublicationNotificationEvent,
} from "./watchlist-publication-notification-contract";

type Recipient = Readonly<{ userId: string; channel: WatchlistNotificationChannel; targetRef: string }>;
type Preferences = Readonly<{ webPushEnabled: boolean; emailEnabled: boolean }>;
const userIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;

/** No provider calls here. The authenticated service supplies eligible recipients.
 * Event acceptance and the complete recipient snapshot commit in one transaction.
 */
export class WatchlistPublicationNotificationStore {
  constructor(private readonly database: Database.Database) {}

  readPreferences(userId: string): Preferences {
    if (!userIdPattern.test(userId)) throw new Error("Invalid notification user.");
    const row = this.database.prepare<[string], { web_push_enabled: number; email_enabled: number }>(
      `SELECT web_push_enabled,email_enabled FROM platform_watchlist_notification_preferences WHERE user_id=?`,
    ).get(userId);
    return Object.freeze({ webPushEnabled: row?.web_push_enabled === 1, emailEnabled: row?.email_enabled === 1 });
  }

  savePreference(userId: string, channel: WatchlistNotificationChannel, enabled: boolean, now: Date): void {
    if (!userIdPattern.test(userId) || typeof enabled !== "boolean" ||
      !["web_push", "email"].includes(channel)) throw new Error("Invalid notification preference.");
    const column = channel === "web_push" ? "web_push_enabled" : "email_enabled";
    this.database.prepare(`INSERT INTO platform_watchlist_notification_preferences(user_id,${column},updated_at_utc)
      VALUES(?,?,?) ON CONFLICT(user_id) DO UPDATE SET ${column}=excluded.${column},updated_at_utc=excluded.updated_at_utc`)
      .run(userId, enabled ? 1 : 0, now.toISOString());
  }

  accept(input: Readonly<{
    event: unknown;
    now: Date;
    recipients: (event: WatchlistPublicationNotificationEvent) => readonly Recipient[];
  }>): Readonly<{ duplicate: boolean; enqueued: number }> {
    const event = parseWatchlistPublicationNotificationEvent(input.event, input.now.getTime());
    if (!event) throw new Error("Invalid Watchlist publication event.");
    const kind = event.notificationKind ?? "listing";
    const eventId = kind === "listing" ? event.cycleId : `${event.cycleId}:analysis:${event.approvalRevision}`;
    return this.database.transaction(() => {
      const previous = this.database.prepare<[string], { ticker: string; approved_at_utc: string; published_at_utc: string; notify_users: number }>(
        `SELECT ticker,approved_at_utc,published_at_utc,notify_users FROM platform_watchlist_notification_events WHERE event_id=?`,
      ).get(eventId);
      if (previous) {
        if (previous.ticker !== event.ticker || previous.approved_at_utc !== event.approvedAtUtc ||
          previous.published_at_utc !== event.publishedAtUtc || previous.notify_users !== (event.notifyUsers === false ? 0 : 1)) throw new Error("Watchlist publication identity conflict.");
        return Object.freeze({ duplicate: true, enqueued: 0 });
      }
      const timestamp = input.now.toISOString();
      this.database.prepare(`INSERT INTO platform_watchlist_notification_events
        (event_id,cycle_id,notification_kind,approval_revision,notify_users,ticker,approved_at_utc,published_at_utc,accepted_at_utc,expires_at_utc) VALUES(?,?,?,?,?,?,?,?,?,?)`)
        .run(eventId,event.cycleId,kind,event.approvalRevision ?? 0,event.notifyUsers === false ? 0 : 1,event.ticker, event.approvedAtUtc, event.publishedAtUtc, timestamp,
          new Date(Date.parse(event.publishedAtUtc) + WATCHLIST_NOTIFICATION_MAX_AGE_MS).toISOString());
      let enqueued = 0;
      // A delayed historical event is acknowledged without enrolling anyone.
      if (event.notifyUsers !== false && !watchlistNotificationExpired(event, input.now.getTime())) {
        for (const recipient of input.recipients(event)) {
          if (!userIdPattern.test(recipient.userId) || !userIdPattern.test(recipient.targetRef) ||
            !["web_push", "email"].includes(recipient.channel)) throw new Error("Invalid notification recipient.");
          const consent = this.readPreferences(recipient.userId);
          if (!(recipient.channel === "web_push" ? consent.webPushEnabled : consent.emailEnabled)) continue;
          enqueued += this.database.prepare(`INSERT OR IGNORE INTO platform_watchlist_notification_deliveries
            (delivery_id,event_id,user_id,channel,target_ref,state,attempt_count,available_at_utc)
            VALUES(?,?,?,?,?,'pending',0,?)`).run(randomUUID(), eventId, recipient.userId,
              recipient.channel, recipient.targetRef, timestamp).changes;
        }
      }
      return Object.freeze({ duplicate: false, enqueued });
    }).immediate();
  }
}
