import "server-only";
import { createHash } from "node:crypto";
import type Database from "better-sqlite3";
import { requestWatchlistRuntimeRaw } from "../runtime/watchlist-runtime-admin-client";
import { PlatformOperatorRepository } from "@/src/modules/platform/server/administration/platform-operator-repository";
import { PlatformNotificationRepository } from "@/src/modules/platform/server/notifications/platform-notification-repository";
import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";

export type AutomaticAnalysisEvent = {
  kind: "review" | "publication"; symbol: string; cycleId: string; at: number;
  draftRevision: number; generationId?: string; expectedHead?: number; actor?: string; review?: unknown;
};
type Controls = { ownerReviewNotificationsEnabled?: boolean; ownerReviewDiscordEnabled?: boolean };
type OwnerDelivery = { event_key: string; ticker: string; owner_user_id: string; created_at_utc: string;
  inbox_state: string; discord_state: string; discord_attempts: number; next_attempt_at_utc: string };
const MAX_AGE = 60 * 60 * 1000;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

export function parseAutomaticAnalysisEvents(value: unknown, now: number): { settings: Controls; events: AutomaticAnalysisEvent[] } {
  if (!value || typeof value !== "object") return { settings: {}, events: [] };
  const data = value as { settings?: Controls; events?: AutomaticAnalysisEvent[] };
  return { settings: data.settings ?? {}, events: (Array.isArray(data.events) ? data.events : []).filter(e =>
    e && ["review", "publication"].includes(e.kind) && /^[A-Z][A-Z0-9.-]{0,15}$/.test(e.symbol) &&
    uuid.test(e.cycleId) && Number.isSafeInteger(e.draftRevision) && e.draftRevision > 0 &&
    Number.isFinite(e.at) && e.at <= now + 60_000 && now - e.at < MAX_AGE &&
    (e.kind === "review" ? typeof e.generationId === "string" && e.generationId.length <= 200 :
      e.actor === "runtime:automatic-boundary" && Number.isSafeInteger(e.expectedHead) && e.expectedHead! >= 1)) };
}

export async function readAutomaticAnalysisEvents() {
  const response = await requestWatchlistRuntimeRaw({ method: "GET", timeoutMs: 8_000,
    path: "/api/watchlist/automatic-analysis-events" });
  if (!response.ok) return null;
  try { return parseAutomaticAnalysisEvents(JSON.parse(response.body), Date.now()); } catch { return null; }
}

export function ownerReviewEventKey(event: AutomaticAnalysisEvent, ownerId: string): string {
  return `watchlist_review_${createHash("sha256").update(`${ownerId}:${event.cycleId}:${event.generationId}`).digest("hex")}`;
}

function ownerScope(db: Database.Database): WorkspaceAccessScope | null {
  const grant = new PlatformOperatorRepository(db).findActive();
  if (!grant) return null;
  const membership = db.prepare<[string], { workspace_id: string }>(`SELECT m.workspace_id
    FROM platform_workspace_memberships m JOIN platform_users u ON u.user_id=m.user_id
    JOIN platform_workspaces w ON w.workspace_id=m.workspace_id
    WHERE m.user_id=? AND m.status='active' AND u.status='active' AND w.status='active'
    ORDER BY m.workspace_id LIMIT 1`).get(grant.userId);
  return membership ? { userId: grant.userId, workspaceId: membership.workspace_id,
    workspaceRole: "owner", activeAccountId: null, allowedAccountIds: [] } : null;
}

export function ownerReviewCopy(ticker: string) {
  return { title: `${ticker} analysis ready for review`,
    summary: "A refreshed analysis is ready. Review, edit and approve it in Watchlist Admin.",
    destinationPath: "/admin/watchlist" };
}

function webhookUrl(): URL | null {
  try {
    const url = new URL(process.env.WATCHLIST_OWNER_REVIEW_DISCORD_WEBHOOK_URL ?? "");
    if (url.protocol !== "https:" || url.hostname !== "discord.com" || url.port || url.username || url.password ||
      !/^\/api\/webhooks\/\d+\/[A-Za-z0-9_-]+$/.test(url.pathname)) return null;
    url.search = ""; url.hash = ""; return url;
  } catch { return null; }
}

export function ownerReviewDeliveryStatus(db: Database.Database): string {
  const scope = ownerScope(db);
  if (!scope) return "Owner review notifications: owner account unavailable.";
  if (!db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='platform_watchlist_owner_review_deliveries'").get())
    return "Owner review notifications: setup pending.";
  const row = db.prepare<[string], OwnerDelivery & { last_status: string | null }>(
    "SELECT * FROM platform_watchlist_owner_review_deliveries WHERE owner_user_id=? ORDER BY created_at_utc DESC LIMIT 1").get(scope.userId);
  const pushEnabled = db.prepare<[string], { enabled: number }>(
    "SELECT web_push_enabled enabled FROM platform_notification_delivery_preferences WHERE user_id=? AND category='ai_review'").get(scope.userId)?.enabled === 1;
  const device = db.prepare<[string], { count: number }>(
    "SELECT count(*) count FROM platform_web_push_subscriptions WHERE user_id=? AND state='active'").get(scope.userId)?.count;
  return `Owner push: ${pushEnabled && device ? "ready" : "enable AI review push notifications on your account and subscribe this device"}. ` +
    `Private Discord: ${webhookUrl() ? "configured" : "not configured"}. ` +
    (row ? `Latest review alert (${row.ticker}): inbox ${row.inbox_state}; Discord ${row.discord_state}${row.last_status ? ` — ${row.last_status}` : ""}.` : "No automatic review alerts yet.");
}

/** Called only from the existing single-writer worker. A fresh projection is
 * required before any send so removed/cancelled/approved drafts are not notified. */
export async function reconcileOwnerReviewNotifications(db: Database.Database,
  input: { settings: Controls; events: AutomaticAnalysisEvent[] }): Promise<void> {
  const scope = ownerScope(db);
  if (!scope) return;
  const available = db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='platform_watchlist_owner_review_deliveries'").get();
  if (!available) return; // additive migration may be awaiting coordinated release
  const now = new Date();
  let webhookAttempts = 0;
  db.prepare("UPDATE platform_watchlist_owner_review_deliveries SET discord_state='uncertain',last_status='Delivery interrupted; check private channel before retrying.' WHERE discord_state='sending'").run();
  for (const event of input.events.filter(e => e.kind === "review")) {
    const key = ownerReviewEventKey(event, scope.userId);
    db.prepare(`INSERT OR IGNORE INTO platform_watchlist_owner_review_deliveries
      (event_key,cycle_id,generation_id,ticker,owner_user_id,created_at_utc,next_attempt_at_utc,inbox_state,discord_state)
      VALUES(?,?,?,?,?,?,?,?,?)`).run(key,event.cycleId,event.generationId!,event.symbol,scope.userId,
        new Date(event.at).toISOString(),now.toISOString(),input.settings.ownerReviewNotificationsEnabled === false ? "disabled" : "pending",
        input.settings.ownerReviewDiscordEnabled === false ? "disabled" : "pending");
    const row = db.prepare<[string], OwnerDelivery>("SELECT * FROM platform_watchlist_owner_review_deliveries WHERE event_key=?").get(key)!;
    const copy = ownerReviewCopy(event.symbol);
    if (row.inbox_state === "pending" && input.settings.ownerReviewNotificationsEnabled !== false) {
      db.transaction(() => {
        new PlatformNotificationRepository(db).create({ category: "ai_review", kind: "ai_review_ready",
          journalAccountId: null, scope, sourceEventKey: key, occurredAtUtc: row.created_at_utc, ...copy });
        db.prepare("UPDATE platform_watchlist_owner_review_deliveries SET inbox_state='sent' WHERE event_key=?").run(key);
      }).immediate();
    }
    if (row.discord_state !== "pending" || row.next_attempt_at_utc > now.toISOString() ||
        input.settings.ownerReviewDiscordEnabled === false || row.discord_attempts >= 5 || webhookAttempts >= 3) continue;
    const url = webhookUrl();
    if (!url) {
      db.prepare("UPDATE platform_watchlist_owner_review_deliveries SET last_status='Private Discord webhook is not configured.',next_attempt_at_utc=? WHERE event_key=?")
        .run(new Date(Date.now()+60_000).toISOString(),key);
      continue;
    }
    // Check channel identity before the first send; never include the URL in errors.
    webhookAttempts += 1;
    try {
      const metadata = await fetch(url, { signal: AbortSignal.timeout(8_000), redirect: "error" });
      const channel = metadata.ok ? await metadata.json() as { channel_id?: string } : null;
      if (channel?.channel_id !== (process.env.WATCHLIST_OWNER_REVIEW_DISCORD_CHANNEL_ID ?? "1553830122019225801")) {
        db.prepare("UPDATE platform_watchlist_owner_review_deliveries SET last_status='Private Discord channel could not be verified.',next_attempt_at_utc=? WHERE event_key=?")
          .run(new Date(Date.now()+60_000).toISOString(),key);
        continue;
      }
    } catch { continue; }
    db.prepare("UPDATE platform_watchlist_owner_review_deliveries SET discord_state='sending',discord_attempts=discord_attempts+1 WHERE event_key=? AND discord_state='pending'").run(key);
    try {
      url.searchParams.set("wait", "true");
      const response = await fetch(url, { method: "POST", redirect: "error", signal: AbortSignal.timeout(10_000),
        headers: { "content-type": "application/json" }, body: JSON.stringify({
          content: `**${copy.title}**\n${copy.summary}\nhttps://app.traderslink.pro${copy.destinationPath}`,
          allowed_mentions: { parse: [] },
        }) });
      if (response.ok) {
        db.prepare("UPDATE platform_watchlist_owner_review_deliveries SET discord_state='sent',last_status='Sent' WHERE event_key=?").run(key);
      } else if (response.status === 429) {
        const body = await response.json().catch(() => ({})) as { retry_after?: number };
        const delay = Math.max(30_000, Math.min(3_600_000, Number(body.retry_after || 60)*1000));
        db.prepare("UPDATE platform_watchlist_owner_review_deliveries SET discord_state=?,next_attempt_at_utc=?,last_status='Discord cooldown' WHERE event_key=?")
          .run(row.discord_attempts+1 >= 5 ? "failed" : "pending",new Date(Date.now()+delay).toISOString(),key);
      } else {
        db.prepare("UPDATE platform_watchlist_owner_review_deliveries SET discord_state=?,last_status=? WHERE event_key=?")
          .run(response.status >= 500 ? "uncertain" : "failed", `Discord HTTP ${response.status}`,key);
      }
    } catch {
      db.prepare("UPDATE platform_watchlist_owner_review_deliveries SET discord_state='uncertain',last_status='Delivery unconfirmed; check private channel.' WHERE event_key=?").run(key);
    }
  }
  db.prepare("UPDATE platform_watchlist_owner_review_deliveries SET discord_state='expired' WHERE discord_state='pending' AND created_at_utc<?")
    .run(new Date(now.getTime()-MAX_AGE).toISOString());
}
