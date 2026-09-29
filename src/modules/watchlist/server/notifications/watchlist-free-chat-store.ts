import "server-only";
import type Database from "better-sqlite3";
import type { FreeChatDeliveryResult } from "./watchlist-free-chat-delivery";

export function setFreeChatAutomatic(database: Database.Database, input: { cycleId: string; ticker: string; ownerUserId: string; enabled: boolean }, now = Date.now()) {
  database.transaction(() => {
    database.prepare(`INSERT INTO platform_watchlist_free_chat_preferences
      (cycle_id,ticker,owner_user_id,automatic_enabled,enabled_at_ms,updated_at_ms) VALUES(?,?,?,?,?,?)
      ON CONFLICT(cycle_id) DO UPDATE SET automatic_enabled=excluded.automatic_enabled,
      enabled_at_ms=CASE WHEN automatic_enabled=0 AND excluded.automatic_enabled=1 THEN excluded.enabled_at_ms ELSE enabled_at_ms END,
      updated_at_ms=excluded.updated_at_ms`).run(input.cycleId,input.ticker,input.ownerUserId,Number(input.enabled),now,now);
    if (!input.enabled) database.prepare(`UPDATE platform_watchlist_free_chat_posts SET state='cancelled',updated_at_ms=?
      WHERE cycle_id=? AND origin='automatic' AND state IN ('pending','retry')`).run(now,input.cycleId);
  }).immediate();
}

export function queueFreeChatPublication(database: Database.Database, input: {
  cycleId: string; ticker: string; ownerUserId: string; approvalRevision: number;
  origin: "approval" | "manual" | "automatic"; publishedAt: number;
}, now = Date.now()) {
  if (!Number.isSafeInteger(input.approvalRevision) || input.approvalRevision < 1) throw Error("Invalid approval revision.");
  if (input.origin === "automatic") {
    const preference = database.prepare<[string], { automatic_enabled: number; enabled_at_ms: number }>(
      "SELECT automatic_enabled,enabled_at_ms FROM platform_watchlist_free_chat_preferences WHERE cycle_id=?").get(input.cycleId);
    if (!preference?.automatic_enabled || input.publishedAt < preference.enabled_at_ms) return false;
  }
  return database.prepare(`INSERT OR IGNORE INTO platform_watchlist_free_chat_posts
    (post_key,cycle_id,ticker,owner_user_id,approval_revision,origin,state,requested_at_ms,updated_at_ms)
    VALUES(?,?,?,?,?,?,'pending',?,?)`).run(`${input.cycleId}:approval:${input.approvalRevision}`,
    input.cycleId,input.ticker,input.ownerUserId,input.approvalRevision,input.origin,now,now).changes === 1;
}

export function claimFreeChatPost(database: Database.Database, postKey: string, now = Date.now()) {
  // A process interruption after POST cannot prove whether Discord accepted it.
  // Such receipts are never automatically replayed.
  database.prepare(`UPDATE platform_watchlist_free_chat_posts SET state='uncertain',status_message='Delivery interrupted. Check Free Chat before sending again.',updated_at_ms=?
    WHERE state='sending' AND updated_at_ms<?`).run(now,now-120000);
  return database.prepare(`UPDATE platform_watchlist_free_chat_posts SET state='sending',attempts=attempts+1,updated_at_ms=?
    WHERE post_key=? AND state IN ('pending','retry') AND next_attempt_at_ms<=?
    AND (origin!='automatic' OR EXISTS(SELECT 1 FROM platform_watchlist_free_chat_preferences p
      WHERE p.cycle_id=platform_watchlist_free_chat_posts.cycle_id AND p.automatic_enabled=1))`).run(now,postKey,now).changes === 1;
}

export function finishFreeChatPost(database: Database.Database, postKey: string, result: FreeChatDeliveryResult, now = Date.now()) {
  database.prepare(`UPDATE platform_watchlist_free_chat_posts SET state=?,status_message=?,next_attempt_at_ms=?,
    discord_message_id=?,sent_at_ms=?,updated_at_ms=? WHERE post_key=? AND state='sending'`)
    .run(result.state,result.message,result.retryAt ?? 0,result.messageId ?? null,result.state === "sent" ? now : null,now,postKey);
}
