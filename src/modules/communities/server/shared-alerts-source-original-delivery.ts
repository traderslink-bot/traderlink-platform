import {sharedOwnedDeliverySql,sharedCooldownSql} from "./shared-alerts-storage-readiness";
import { isCommunityReviewDiscordGuild } from "./community-review-discord-guild";
import type Database from "better-sqlite3";
import { createHash } from "node:crypto";
import { partitionDiscordAlertText } from "../contracts/discord-alert-message-parts";
import { appendCommunityAlertAttribution, communityAlertDiscordAuthor } from "./community-alert-discord-content";
import { recordCommunityDeliveryAttempt } from "./community-delivery-history";
import { verifyCommunityRequestMember } from "./community-request-verification";
import { SharedAlertsDiscord } from "./shared-alerts-discord";
import { SharedAlertError } from "./shared-alerts-errors";
import { SharedAlertRateLimits } from "./shared-alerts-rate-limits";
import { SharedAlertsRepository } from "./shared-alerts-repository";
import { verifySharedAlertOwner } from "./shared-alerts-verification";
import type { SharedSourceDispatchBindings, SharedSourceDispatchContext } from "./shared-alerts-source-dispatch";
import {assertCommunityStagingQaSharedTarget} from "./community-staging-qa-capability";

export type SourceOriginalRow = Readonly<{
  delivery_id: string; community_id: string; object_id: string; destination_id: string; publisher_user_id: string;
  discord_channel_id: string; discord_guild_id: string; slug: string; author_user_id: string;
  revision_id: string; content_json: string; content_hash: string;
}>;
export type SourceOriginalPlan = Readonly<{
  kind: "shared-source-original-v1"; revisionId: string; channelId: string;
  parts: readonly Readonly<{ content: string; nonce: string }>[];
}>;
type Content = Readonly<{ title: string; symbol?: string | null; body: string; publishingMode: "tracked_page" | "discord_post" }>;

export function sourceAlertNonce(key: string): string { return createHash("sha256").update(key).digest("hex").slice(0, 24); }

/** Source renderer only. Partner delivery never receives the tracked-page URL. */
export function sourceAlertParts(database: Database.Database, alertId: string, content: Content, trackedUrl: string, withdrawn = false): readonly string[] {
  if (!content.title || content.title.length > 140 || typeof content.body !== "string" || content.body.length > 8000 || !["tracked_page", "discord_post"].includes(content.publishingMode)) throw new SharedAlertError("invalid");
  const author = communityAlertDiscordAuthor(database, alertId);
  if (author === "Discord author unavailable") throw new SharedAlertError("unavailable");
  const community = database.prepare(`SELECT c.display_name FROM traderlink_community_alerts a
    JOIN traderlink_communities c ON c.community_id=a.community_id WHERE a.alert_id=?`)
    .get(alertId) as { display_name: string } | undefined;
  if (!community?.display_name?.trim()) throw new SharedAlertError("unavailable");
  const footer = appendCommunityAlertAttribution(database, { alertId, communityName: community.display_name, showCommunityName: true }, "");
  if (!withdrawn && content.publishingMode === "tracked_page") {
    const text = `${author} published an alert.\nOpen alert: ${trackedUrl}${footer}`;
    if (text.length > 2000) throw new SharedAlertError("invalid");
    return [text];
  }
  const lead = `${withdrawn ? "**WITHDRAWN**\n" : ""}**${content.symbol ? content.symbol + " — " : ""}${content.title}**`;
  const body = withdrawn ? "This alert has been withdrawn. Do not rely on the original alert." : content.body;
  return partitionDiscordAlertText({ single: `${lead}\n${body}${footer}`, body, header: (part, total) => `${lead}\nPart ${part} of ${total}\n`, footer });
}

/** Namespaced publication receipt holds the complete immutable part plan without new schema.
 * Browser mutation UUIDs cannot address this internal key. Never update a stored plan.
 */
export function readSourceOriginalPlan(database: Database.Database, row: Pick<SourceOriginalRow, "community_id" | "publisher_user_id" | "delivery_id">): SourceOriginalPlan | null {
  const record = database.prepare("SELECT payload_hash,result_json FROM traderlink_community_publication_receipts WHERE community_id=? AND user_id=? AND request_id=?")
    .get(row.community_id, row.publisher_user_id, `shared-source-original:${row.delivery_id}`) as { payload_hash: string; result_json: string } | undefined;
  if (!record) return null;
  if (createHash("sha256").update(record.result_json).digest("hex") !== record.payload_hash) throw new SharedAlertError("changed");
  const plan = JSON.parse(record.result_json) as SourceOriginalPlan;
  if (plan.kind !== "shared-source-original-v1" || !/^\d{1,32}$/u.test(plan.channelId) || !Array.isArray(plan.parts) || !plan.parts.length || plan.parts.length > 32 || plan.parts.some(part => typeof part.content !== "string" || !part.content || part.content.length > 2000 || !/^[a-f0-9]{24}$/u.test(part.nonce))) throw new SharedAlertError("changed");
  return plan;
}

export function confirmedSourceParts(database: Database.Database, deliveryId: string): readonly { number: number; messageId: string }[] {
  const result: { number: number; messageId: string }[] = [];
  for (let number = 1; number <= 32; number++) {
    const row = database.prepare(`SELECT discord_message_id FROM traderlink_community_delivery_attempt_history WHERE delivery_id=? AND attempt_key=? AND outcome='confirmed' AND discord_message_id IS NOT NULL ORDER BY occurred_at_utc,rowid LIMIT 1`)
      .get(deliveryId, `source-alert:${deliveryId}:part:${number}`) as { discord_message_id: string } | undefined;
    if (!row) break;
    result.push({ number, messageId: row.discord_message_id });
  }
  return result;
}

export function assertSourceWriteCurrent(context: SharedSourceDispatchContext, row: Pick<SourceOriginalRow, "community_id" | "author_user_id" | "publisher_user_id" | "destination_id" | "discord_channel_id" | "discord_guild_id">): void {
  try{if(context.exactSelection)assertCommunityStagingQaSharedTarget(context.exactSelection.capability,context.database,row.discord_guild_id,row.discord_channel_id);else if(!isCommunityReviewDiscordGuild(row.discord_guild_id))throw new Error();}catch{throw new SharedAlertError("changed");}
  const repository = new SharedAlertsRepository(context.database, context.now), owner = repository.ownerContext(row.community_id);
  if (owner.guildId !== row.discord_guild_id || !repository.ownerIsFresh(owner)) throw new SharedAlertError("changed");
  if (!context.database.prepare("SELECT 1 FROM traderlink_community_discord_destinations WHERE community_id=? AND destination_id=? AND content_type='alerts' AND status='active' AND discord_channel_id=?").get(row.community_id, row.destination_id, row.discord_channel_id)) throw new SharedAlertError("changed");
  for (const userId of new Set([row.author_user_id, row.publisher_user_id])) context.policy.assertDelivery(row.community_id, userId, row.destination_id, "alerts", context.now());
}

/** Revalidate source author, actual publisher, current owner and destination before every write. */
export async function verifySourceWrite(context: SharedSourceDispatchContext, row: Pick<SourceOriginalRow, "community_id" | "slug" | "author_user_id" | "publisher_user_id" | "destination_id" | "discord_channel_id" | "discord_guild_id">): Promise<void> {
  const repository = new SharedAlertsRepository(context.database, context.now), owner = repository.ownerContext(row.community_id);
  if (owner.guildId !== row.discord_guild_id) throw new SharedAlertError("changed");
  const discord = new SharedAlertsDiscord(context.botToken, context.request, context.now,context.exactSelection?{database:context.database,capability:context.exactSelection.capability}:undefined);
  await verifySharedAlertOwner(repository, discord, owner);
  for (const userId of new Set([row.author_user_id, row.publisher_user_id])) {
    if (!userId || !await verifyCommunityRequestMember(context.database, { slug: row.slug, userId, botToken: context.botToken, atUtc: context.now(),stagingQaGuildId:context.exactSelection?.guildId }, context.request)) throw new SharedAlertError("discord_unavailable");
    context.policy.assertDelivery(row.community_id, userId, row.destination_id, "alerts", context.now());
  }
  await discord.verifyChannel(row.discord_guild_id, row.discord_channel_id);
  assertSourceWriteCurrent(context, row);
}

export const sharedAlertsSourceOriginalDelivery: SharedSourceDispatchBindings["originals"] = {
  kind: "alert-original-multipart",
  async run(context) {
    const db = context.database, at = context.now(), owned=sharedOwnedDeliverySql(context.database,"traderlink_community_content_deliveries"),stale = new Date(Date.parse(at) - 300_000).toISOString();
    const selected=context.exactSelection?.deliveryIds,selectedSql=selected?` AND delivery_id IN (${selected.map(()=>"?").join(",")||"NULL"})`:"";
    // A crashed provider write is never permission to resend a message.
    db.prepare(`UPDATE traderlink_community_content_deliveries SET status=CASE WHEN delivery_outcome='pending' THEN 'pending' ELSE 'failed' END,
      last_error=CASE WHEN delivery_outcome='pending' THEN 'Resuming confirmed source progress.' ELSE 'Source alert send was interrupted; inspect Discord.' END,
      delivery_outcome=CASE WHEN delivery_outcome='pending' THEN 'pending' ELSE 'uncertain' END,updated_at_utc=?
      WHERE object_type='alert' AND ${owned} AND status='sending' AND updated_at_utc<?${selectedSql}`).run(at, stale,...(selected??[]));
    const rows = db.prepare(`SELECT d.delivery_id,d.community_id,d.object_id,d.destination_id,d.publisher_user_id,x.discord_channel_id,c.discord_guild_id,c.slug,a.author_user_id,r.revision_id,r.content_json,r.content_hash
      FROM traderlink_community_content_deliveries d JOIN traderlink_community_discord_destinations x ON x.destination_id=d.destination_id AND x.community_id=d.community_id AND x.content_type='alerts' AND x.status='active'
      JOIN traderlink_communities c ON c.community_id=d.community_id AND c.status='active'
      JOIN traderlink_community_alerts a ON a.alert_id=d.object_id AND a.community_id=d.community_id AND a.status='published'
      JOIN traderlink_community_publication_revisions r ON r.revision_id=(SELECT first.revision_id FROM traderlink_community_publication_revisions first WHERE first.community_id=d.community_id AND first.object_type='alert' AND first.object_id=d.object_id AND first.evidence_kind='original' ORDER BY first.rowid LIMIT 1)
      WHERE ${sharedOwnedDeliverySql(db)} AND ${sharedCooldownSql(db,'x.discord_channel_id',at)} ${selected?`AND d.delivery_id IN (${selected.map(()=>"?").join(",")||"NULL"})`:""} AND d.object_type='alert' AND d.publisher_user_id IS NOT NULL AND d.status IN ('pending','failed') AND d.delivery_outcome='pending' AND d.attempt_count<5
      AND (d.next_attempt_at_utc IS NULL OR d.next_attempt_at_utc<=?) AND (? IS NULL OR d.requested_at_utc>=?) ORDER BY d.requested_at_utc,d.delivery_id LIMIT ?`)
      .all(...(selected??[]),at, context.notBeforeUtc ?? null, context.notBeforeUtc ?? null, context.limit) as SourceOriginalRow[];
    let delivered = 0, failed = 0, writes = 0;
    for (const row of rows) {
      if (writes >= context.limit) break;
      try{if(context.exactSelection)assertCommunityStagingQaSharedTarget(context.exactSelection.capability,context.database,row.discord_guild_id,row.discord_channel_id);else if(!isCommunityReviewDiscordGuild(row.discord_guild_id))continue;}catch{continue;}
      if (new SharedAlertRateLimits(db, context.now).current(row.discord_channel_id)) continue;
      if (!db.prepare("UPDATE traderlink_community_content_deliveries SET status='sending',attempt_count=attempt_count+1,updated_at_utc=? WHERE delivery_id=? AND status IN ('pending','failed') AND delivery_outcome='pending'").run(context.now(), row.delivery_id).changes) continue;
      let uncertain = false;
      const stop = (outcome: "pending" | "rejected" | "uncertain", message: string, retryAt: string | null = null) => db.prepare(`UPDATE traderlink_community_content_deliveries SET status='failed',delivery_outcome=?,last_error=?,next_attempt_at_utc=?,updated_at_utc=? WHERE delivery_id=? AND status='sending'`).run(outcome, message, retryAt, context.now(), row.delivery_id);
      const intended = () => {
        const intent = context.policy.intent(row.community_id, "alert", row.object_id);
        return intent?.distribution === "discord" && intent.destinationIds.includes(row.destination_id);
      };
      try {
        await verifySourceWrite(context, row);
        if (!intended()) { stop("rejected", "Source Discord intent changed."); failed++; continue; }
        let plan = readSourceOriginalPlan(db, row);
        if (!plan) {
          if (db.prepare("SELECT 1 FROM traderlink_community_delivery_attempt_history WHERE delivery_id=? AND attempt_key LIKE ? LIMIT 1").get(row.delivery_id, `source-alert:${row.delivery_id}:part:%`)) throw new SharedAlertError("changed");
          if (createHash("sha256").update(row.content_json).digest("hex") !== row.content_hash) throw new SharedAlertError("changed");
          const content = JSON.parse(row.content_json) as Content;
          const parts = sourceAlertParts(db, row.object_id, content, content.publishingMode === "tracked_page" ? context.trackedPageUrl(row.slug, row.object_id) : "");
          plan = { kind: "shared-source-original-v1", revisionId: row.revision_id, channelId: row.discord_channel_id, parts: parts.map((text, index) => ({ content: text, nonce: sourceAlertNonce(`source-alert:${row.delivery_id}:${index + 1}`) })) };
          const encoded = JSON.stringify(plan);
          db.prepare(`INSERT INTO traderlink_community_publication_receipts(community_id,user_id,request_id,payload_hash,result_json,created_at_utc) VALUES(?,?,?,?,?,?)`)
            .run(row.community_id, row.publisher_user_id, `shared-source-original:${row.delivery_id}`, createHash("sha256").update(encoded).digest("hex"), encoded, context.now());
        }
        if (plan.channelId !== row.discord_channel_id || plan.revisionId !== row.revision_id) throw new SharedAlertError("changed");
        for (const [index, part] of plan.parts.entries()) {
          const number = index + 1, key = `source-alert:${row.delivery_id}:part:${number}`;
          const history = db.prepare("SELECT outcome,discord_message_id FROM traderlink_community_delivery_attempt_history WHERE delivery_id=? AND attempt_key=? ORDER BY rowid DESC LIMIT 1").get(row.delivery_id, key) as { outcome: string; discord_message_id: string | null } | undefined;
          if (history?.outcome === "confirmed") continue;
          if (history?.outcome === "uncertain") { stop("uncertain", "A source message part needs confirmation."); break; }
          if (writes >= context.limit) break;
          if (new SharedAlertRateLimits(db, context.now).current(row.discord_channel_id)) break;
          await verifySourceWrite(context, row);
          if (!db.prepare(`SELECT 1 FROM traderlink_community_content_deliveries d JOIN traderlink_community_alerts a ON a.alert_id=d.object_id AND a.community_id=d.community_id
            JOIN traderlink_community_discord_destinations x ON x.destination_id=d.destination_id AND x.community_id=d.community_id WHERE d.delivery_id=? AND d.status='sending' AND a.status='published' AND x.status='active' AND x.discord_channel_id=?`).get(row.delivery_id, row.discord_channel_id)) break;
          if (!intended()) { stop("rejected", "Source Discord intent changed."); break; }
          const attempts = (db.prepare("SELECT count(*) total FROM traderlink_community_delivery_attempt_history WHERE delivery_id=? AND attempt_key=? AND outcome='uncertain'").get(row.delivery_id, key) as { total: number }).total;
          if (attempts >= 5) { stop("rejected", "Source message-part retries exhausted."); break; }
          const first = confirmedSourceParts(db, row.delivery_id)[0]?.messageId;
          if (index && !first) { stop("uncertain", "Original source message is not confirmed."); break; }
          db.transaction(() => {
            recordCommunityDeliveryAttempt(db, { deliveryId: row.delivery_id, communityId: row.community_id, attemptKey: key, outcome: "uncertain", error: "Source part send started; awaiting provider confirmation.", atUtc: context.now() });
            db.prepare("UPDATE traderlink_community_content_deliveries SET delivery_outcome='uncertain',updated_at_utc=? WHERE delivery_id=? AND status='sending'").run(context.now(), row.delivery_id);
          }).immediate();
          uncertain = true; writes++;
          const response = await context.request(`https://discord.com/api/v10/channels/${plan.channelId}/messages`, {
            method: "POST", headers: { Authorization: `Bot ${context.botToken}`, "Content-Type": "application/json" }, signal: AbortSignal.timeout(10_000),
            body: JSON.stringify({ content: part.content, nonce: part.nonce, enforce_nonce: true, allowed_mentions: { parse: [], replied_user: false }, ...(first && index ? { message_reference: { message_id: first, channel_id: plan.channelId, guild_id: row.discord_guild_id, fail_if_not_exists: true } } : {}) }),
          });
          if (response.ok) {
            const receipt = await response.json() as { id?: string; channel_id?: string };
            if (!receipt.id || !/^\d{1,32}$/u.test(receipt.id) || receipt.channel_id !== plan.channelId) throw new SharedAlertError("changed");
            db.transaction(() => {
              recordCommunityDeliveryAttempt(db, { deliveryId: row.delivery_id, communityId: row.community_id, attemptKey: key, outcome: "confirmed", messageId: receipt.id, atUtc: context.now() });
              db.prepare(`UPDATE traderlink_community_content_deliveries SET attempt_count=0,discord_message_id=CASE WHEN ?=1 THEN coalesce(discord_message_id,?) ELSE discord_message_id END,
                delivery_outcome=CASE WHEN delivery_outcome='confirmed' THEN 'confirmed' ELSE 'pending' END,updated_at_utc=? WHERE delivery_id=?`).run(number, receipt.id, context.now(), row.delivery_id);
            }).immediate(); uncertain = false;
          } else if (response.status === 429) {
            recordCommunityDeliveryAttempt(db, { deliveryId: row.delivery_id, communityId: row.community_id, attemptKey: key, outcome: "pending", error: "Discord rate limit; retry after stored cooldown.", atUtc: context.now() });
            stop("pending", "Discord rate limit; retry scheduled.", new Date(Date.parse(context.now()) + 60_000).toISOString()); uncertain = false; break;
          } else if (response.status >= 500) { stop("uncertain", "Source message result needs confirmation."); failed++; break; }
          else {
            recordCommunityDeliveryAttempt(db, { deliveryId: row.delivery_id, communityId: row.community_id, attemptKey: key, outcome: "rejected", error: `Discord rejected source part (${response.status}).`, atUtc: context.now() });
            stop("rejected", "Discord rejected the source alert."); uncertain = false; failed++; break;
          }
        }
        const complete = confirmedSourceParts(db, row.delivery_id).length === plan.parts.length;
        if (complete) delivered += db.prepare("UPDATE traderlink_community_content_deliveries SET status='delivered',delivery_outcome='confirmed',delivered_at_utc=?,updated_at_utc=?,last_error=NULL,next_attempt_at_utc=NULL WHERE delivery_id=? AND status='sending'").run(context.now(), context.now(), row.delivery_id).changes;
        else db.prepare("UPDATE traderlink_community_content_deliveries SET status='pending',updated_at_utc=? WHERE delivery_id=? AND status='sending' AND delivery_outcome='pending'").run(context.now(), row.delivery_id);
      } catch {
        stop(uncertain ? "uncertain" : "pending", uncertain ? "Source result needs confirmation; no automatic resend." : "Source verification unavailable; retry scheduled.", uncertain ? null : new Date(Date.parse(context.now()) + 60_000).toISOString()); failed++;
      }
    }
    return { delivered, failed };
  },
};
