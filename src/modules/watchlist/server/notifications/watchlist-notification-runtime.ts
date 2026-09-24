import "server-only";
import type Database from "better-sqlite3";
import { withPlatformDatabase, openPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { PlatformDiscordMembershipRepository } from "@/src/modules/platform/server/authentication/platform-discord-membership-repository";
import { resolveTraderLinkDiscordGuildId } from "@/src/modules/platform/server/authentication/platform-discord-configuration";
import { requestWatchlistRuntimeRaw } from "../runtime/watchlist-runtime-admin-client";
import { publicationFromReview, type WatchlistApprovalIntent } from "./watchlist-publication-notification-contract";
import { WatchlistPublicationNotificationStore } from "./watchlist-publication-notification-store";

type Recipient = { userId: string; channel: "web_push" | "email"; targetRef: string };
type IntentRow = { intent_id: string; cycle_id: string; ticker: string; expected_head: number; draft_revision: number;
  actor: string; recipients_json: string; requested_at_utc: string };

export function watchlistNotificationAccess(database: Database.Database, userId: string): boolean {
  const visibility = database.prepare<[], { member_visible: number }>(
    "SELECT member_visible FROM platform_watchlist_visibility WHERE settings_key='member_visibility'",
  ).get();
  if (visibility?.member_visible !== 1) return false;
  const active = database.prepare<[string], { n: number }>(`SELECT count(*) n FROM platform_users u
    WHERE u.user_id=? AND u.status='active' AND EXISTS(SELECT 1 FROM platform_auth_identities a
    WHERE a.user_id=u.user_id AND a.status='active' AND a.auth_provider='discord')`).get(userId);
  return Boolean(active?.n && new PlatformDiscordMembershipRepository(database)
    .findCurrent(userId, resolveTraderLinkDiscordGuildId(process.env)));
}

/** Called only after existing owner authorization, before forwarding approval.
 * Captures opt-ins now; later polling cannot add newly opted-in recipients. */
export function recordWatchlistApprovalNotificationIntent(body: string, actor: string, listingOnly = false): void {
  const request = JSON.parse(body);
  const draftRevision = listingOnly ? 0 : request.draftRevision;
  const ticker = typeof request.symbol === "string" ? request.symbol.trim().toUpperCase() : "";
  if (!/^[A-Z][A-Z0-9]{0,9}(?:[.-][A-Z0-9]{1,2})?$/.test(ticker) ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(request.cycleId) ||
    !Number.isSafeInteger(request.expectedHead) || request.expectedHead < 1 ||
    !Number.isSafeInteger(draftRevision) || draftRevision < (listingOnly ? 0 : 1) ||
    (request.notifyUsers !== undefined && typeof request.notifyUsers !== "boolean")) return;
  const intentId = `${request.cycleId}:draft:${draftRevision}`;
  withPlatformDatabase({ mode: "runtime" }, database => database.transaction(() => {
    const existing = database.prepare<[string], { state: string; expected_head: number }>(
      "SELECT state,expected_head FROM platform_watchlist_notification_intents WHERE intent_id=?",
    ).get(intentId);
    if (existing) return;
    const recipients: Recipient[] = [];
    const users = database.prepare<[], { user_id: string; web_push_enabled: number; email_enabled: number }>(
      "SELECT user_id,web_push_enabled,email_enabled FROM platform_watchlist_notification_preferences WHERE web_push_enabled=1 OR email_enabled=1",
    ).all();
    for (const user of users) {
      if (!watchlistNotificationAccess(database, user.user_id)) continue;
      if (user.web_push_enabled) for (const target of database.prepare<[string], { id: string }>(
        "SELECT subscription_id id FROM platform_web_push_subscriptions WHERE user_id=? AND state='active'",
      ).all(user.user_id)) recipients.push({ userId: user.user_id, channel: "web_push", targetRef: target.id });
      if (user.email_enabled) {
        const target = database.prepare<[string], { id: string }>(
          "SELECT email_address_id id FROM platform_notification_email_addresses WHERE user_id=? AND state='confirmed' ORDER BY updated_at_utc DESC LIMIT 1",
        ).get(user.user_id);
        if (target) recipients.push({ userId: user.user_id, channel: "email", targetRef: target.id });
      }
    }
    const now = new Date().toISOString();
    database.prepare(`INSERT INTO platform_watchlist_notification_intents
      (intent_id,cycle_id,ticker,expected_head,draft_revision,notify_users,actor,recipients_json,requested_at_utc,next_check_at_utc,state)
      VALUES(?,?,?,?,?,?,?,?,?,?,'pending')`).run(
      intentId,request.cycleId,ticker,request.expectedHead,draftRevision,(listingOnly ? request.notifyUsers !== false : request.notifyUsers === true) ? 1 : 0,actor,JSON.stringify(recipients),now,now);
  }).immediate());
}

let running = false;
export async function reconcileWatchlistNotificationApprovals(): Promise<void> {
  if (running) return;
  running = true;
  let database: Database.Database | undefined;
  try {
    database = openPlatformDatabase({ mode: "runtime" });
    const now = new Date();
    database.prepare(`UPDATE platform_watchlist_notification_intents SET state='expired'
      WHERE state='pending' AND requested_at_utc<=?`).run(new Date(now.getTime()-3_600_000).toISOString());
    const intents = database.prepare<[string], IntentRow>(`SELECT * FROM platform_watchlist_notification_intents
      WHERE state='pending' AND next_check_at_utc<=? ORDER BY requested_at_utc LIMIT 3`).all(now.toISOString());
    for (const row of intents) {
      database.prepare("UPDATE platform_watchlist_notification_intents SET next_check_at_utc=? WHERE intent_id=?")
        .run(new Date(Date.now()+30_000).toISOString(),row.intent_id);
      const response = await requestWatchlistRuntimeRaw({ method: "GET", reviewActor: row.actor, timeoutMs: 8_000,
        path: `/api/watchlist/analysis-review?symbol=${encodeURIComponent(row.ticker)}` });
      if (!response.ok) continue;
      const intent: WatchlistApprovalIntent = { cycleId: row.cycle_id, ticker: row.ticker,
        expectedHead: row.expected_head, draftRevision: row.draft_revision, actor: row.actor };
      const event = publicationFromReview(intent, JSON.parse(response.body).review, Date.now());
      if (!event) continue;
      database.transaction(() => {
        new WatchlistPublicationNotificationStore(database!).accept({ event, now: new Date(),
          recipients: () => (JSON.parse(row.recipients_json) as Recipient[]).filter(recipient => watchlistNotificationAccess(database!, recipient.userId)) });
        database!.prepare("UPDATE platform_watchlist_notification_intents SET state='accepted' WHERE intent_id=?").run(row.intent_id);
      }).immediate();
    }
  } finally { database?.close(); running = false; }
}
