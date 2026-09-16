import "server-only";
import type Database from "better-sqlite3";
import * as webPush from "web-push";
import { openPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { loadPlatformWebPushConfiguration } from "@/src/modules/platform/server/notifications/platform-web-push-configuration";
import { decryptPlatformWebPushSubscription } from "@/src/modules/platform/server/notifications/platform-web-push-subscription-crypto";
import { PlatformNotificationEmailAddressRepository } from "@/src/modules/platform/server/notifications/platform-notification-email-address-repository";
import { loadPlatformNotificationEmailEncryptionConfiguration } from "@/src/modules/platform/server/notifications/platform-notification-email-configuration";
import { deliverPlatformNotificationEmail } from "@/src/modules/platform/server/notifications/platform-resend-notification-email";
import { watchlistPublicationNotificationCopy } from "./watchlist-publication-notification-contract";
import { watchlistNotificationAccess } from "./watchlist-notification-runtime";
import { WatchlistPublicationNotificationStore } from "./watchlist-publication-notification-store";

type Delivery = { delivery_id: string; user_id: string; channel: "web_push" | "email"; target_ref: string;
  attempt_count: number; ticker: string; event_id: string; notification_kind: "listing" | "analysis"; expires_at_utc: string };
type Subscription = { authentication_tag: string; ciphertext: string; device_ref: string; endpoint_hash: string;
  initialization_vector: string; key_version: string };
type SendResult = { sent: boolean; retry: boolean; code: string; delayMs?: number };

async function send(database: Database.Database, row: Delivery): Promise<SendResult> {
  const copy = watchlistPublicationNotificationCopy(row.ticker,row.notification_kind);
  if (row.channel === "email") {
    const email = new PlatformNotificationEmailAddressRepository(database, loadPlatformNotificationEmailEncryptionConfiguration())
      .resolveConfirmedAddress(row.user_id);
    if (!email || email.emailAddressRef !== row.target_ref) return { sent: false, retry: false, code: "address_changed" };
    const result = await deliverPlatformNotificationEmail({ emailAddress: email.emailAddress, timeoutMs: 10_000,
      idempotencyKey: `watchlist:${row.delivery_id}`, actionLabel: copy.emailTickerLabel,
      content: { title: copy.emailTitle, summary: copy.emailBody, destinationPath: copy.destinationPath },
      additionalLinks: [{ label: copy.emailWatchlistLabel, path: copy.emailWatchlistPath },
        { label: "Manage notifications", path: "/account/preferences" }] });
    return { sent: result.ok, retry: result.code === "provider_unavailable" || result.code === "not_configured", code: result.code };
  }
  const subscription = database.prepare<[string,string], Subscription>(`SELECT authentication_tag,ciphertext,device_ref,
    endpoint_hash,initialization_vector,key_version FROM platform_web_push_subscriptions
    WHERE subscription_id=? AND user_id=? AND state='active'`).get(row.target_ref,row.user_id);
  if (!subscription) return { sent: false, retry: false, code: "device_unavailable" };
  const configuration = loadPlatformWebPushConfiguration();
  const target = decryptPlatformWebPushSubscription({ configuration: configuration.encryption,
    deviceRef: subscription.device_ref, endpointHash: subscription.endpoint_hash, userId: row.user_id,
    encrypted: { authenticationTag: subscription.authentication_tag, ciphertext: subscription.ciphertext,
      initializationVector: subscription.initialization_vector, keyVersion: subscription.key_version } });
  if (target.expirationTime !== null && target.expirationTime <= Date.now()) return { sent: false, retry: false, code: "device_expired" };
  try {
    await webPush.sendNotification(target, JSON.stringify({ version: 3, destinationPath: copy.destinationPath,
      notificationTitle: copy.pushTitle, notificationBody: copy.pushBody, notificationTag: `watchlist:${row.event_id}` }), {
      TTL: Math.max(0, Math.floor((Date.parse(row.expires_at_utc)-Date.now())/1000)), urgency: "normal", timeout: 10_000,
      vapidDetails: configuration.vapid,
    });
    return { sent: true, retry: false, code: "sent" };
  } catch (error) {
    const failure = error as { statusCode?: number; headers?: Record<string,string> };
    const status = failure.statusCode;
    const hint = failure.headers?.["retry-after"];
    const delayMs = hint ? (/^\d+$/.test(hint) ? Number(hint)*1000 : Math.max(0,Date.parse(hint)-Date.now())) : undefined;
    return { sent: false, retry: status === undefined || status === 408 || status === 429 || status >= 500,
      code: status === 404 || status === 410 ? "device_expired" : "provider_unavailable", delayMs };
  }
}

export async function deliverWatchlistNotifications(database: Database.Database, maximum = 10,
  sender: (database: Database.Database, row: Delivery) => Promise<SendResult> = send,
  access: (database: Database.Database, userId: string) => boolean = watchlistNotificationAccess,
): Promise<number> {
  let processed = 0;
  for (let index=0; index<Math.min(Math.max(maximum,0),20); index++) {
    const now = new Date().toISOString();
    const row = database.transaction(() => {
      database.prepare(`UPDATE platform_watchlist_notification_deliveries SET state='expired',failure_code='expired'
        WHERE state IN ('pending','sending') AND event_id IN (SELECT event_id FROM platform_watchlist_notification_events WHERE expires_at_utc<=?)`).run(now);
      database.prepare(`UPDATE platform_watchlist_notification_deliveries SET state=CASE WHEN attempt_count>=5 THEN 'failed' ELSE 'pending' END
        WHERE state='sending' AND last_attempt_at_utc<=?`).run(new Date(Date.now()-60_000).toISOString());
      const candidate = database.prepare<[string],Delivery>(`SELECT d.*,e.ticker,e.notification_kind,e.expires_at_utc FROM platform_watchlist_notification_deliveries d
        JOIN platform_watchlist_notification_events e ON e.event_id=d.event_id
        WHERE d.state='pending' AND d.available_at_utc<=? AND d.attempt_count<5 ORDER BY d.available_at_utc,d.delivery_id LIMIT 1`).get(now);
      if (!candidate) return null;
      const preference = new WatchlistPublicationNotificationStore(database).readPreferences(candidate.user_id);
      const allowed = candidate.channel === "email" ? preference.emailEnabled : preference.webPushEnabled;
      const visible = database.prepare<[string], { n: number }>("SELECT count(*) n FROM live_watchlist_symbols WHERE symbol=? AND status<>'deactivated'").get(candidate.ticker)?.n;
      const state = !allowed ? "opted_out" : !visible || !access(database,candidate.user_id) ? "inaccessible" : "sending";
      database.prepare(`UPDATE platform_watchlist_notification_deliveries SET state=?,last_attempt_at_utc=?,
        attempt_count=attempt_count+? WHERE delivery_id=?`).run(state,now,state === "sending" ? 1 : 0,candidate.delivery_id);
      return state === "sending" ? { ...candidate,attempt_count:candidate.attempt_count+1 } : false;
    }).immediate();
    if (row === null) break;
    processed++;
    if (!row) continue;
    let result: SendResult;
    try { result = await sender(database,row); }
    catch { result = { sent:false,retry:true,code:"provider_unavailable" }; }
    const delay = Number.isFinite(result.delayMs) ? Math.max(30_000,result.delayMs!) : Math.min(900_000,30_000*2**(row.attempt_count-1));
    const retryAt = new Date(Math.min(Date.now()+delay,Date.parse(row.expires_at_utc))).toISOString();
    const state = result.sent ? "delivered" : result.retry && row.attempt_count<5 ? "pending" : "failed";
    database.prepare(`UPDATE platform_watchlist_notification_deliveries SET state=?,available_at_utc=?,failure_code=?,delivered_at_utc=?
      WHERE delivery_id=? AND state='sending' AND attempt_count=?`).run(state,retryAt,result.sent ? null : result.code,
        result.sent ? new Date().toISOString() : null,row.delivery_id,row.attempt_count);
  }
  return processed;
}

let running = false;
export async function runWatchlistNotificationDelivery(): Promise<void> {
  if (running) return;
  running=true;
  let database: Database.Database | undefined;
  try { database=openPlatformDatabase({ mode:"runtime" }); await deliverWatchlistNotifications(database); }
  finally { database?.close(); running=false; }
}
