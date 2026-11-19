import {sharedCooldownSql} from "./shared-alerts-storage-readiness";
import { isCommunityReviewDiscordGuild } from "./community-review-discord-guild";
import {assertCommunityStagingQaSharedTarget} from "./community-staging-qa-capability";
import { createHash } from "node:crypto";
import { createCanonicalUuidV4 } from "../../platform/server/database/platform-migration-contract";
import { SharedAlertError } from "./shared-alerts-errors";
import { SharedAlertRateLimits } from "./shared-alerts-rate-limits";
import { assertSourceWriteCurrent, confirmedSourceParts, readSourceOriginalPlan, sourceAlertNonce, sourceAlertParts, verifySourceWrite, type SourceOriginalRow } from "./shared-alerts-source-original-delivery";
import { SharedAlertsSourcePublication } from "./shared-alerts-source-publication";
import type { SharedSourceDispatchBindings, SharedSourceDispatchContext } from "./shared-alerts-source-dispatch";

type EditPart = { operation: "PATCH" | "POST" | "DELETE"; content: string; messageId: string | null; status: "pending" | "uncertain" | "confirmed"; attempts: number; nonce: string };
type EditPlan = { kind: "shared-source-edit-v1"; deliveryId: string; channelId: string; sourceStatus: "published" | "archived"; originalPublisherId: string; parts: EditPart[] };
type RevisionRow = SourceOriginalRow & { actor_user_id: string; source_status: "published" | "archived"; original_message_id: string; original_status: string; delivery_outcome: string };
type ActionRow = RevisionRow & { action_id: string; payload_json: string; attempt_count: number; initiating_publisher_user_id: string; target_message_id: string };

function record(context: SharedSourceDispatchContext, row: ActionRow, outcome: "sending" | "pending" | "confirmed" | "rejected" | "uncertain", messageId: string | null = null, error: string | null = null): void {
  context.database.prepare(`INSERT INTO traderlink_community_publication_action_attempts(attempt_id,action_id,attempt_number,outcome,discord_message_id,error_message,occurred_at_utc) VALUES(?,?,?,?,?,?,?)`)
    .run(createCanonicalUuidV4(), row.action_id, row.attempt_count + 1, outcome, messageId, error, context.now());
}

/** Build edit plans only from confirmed source receipts of this adapter, never inferred legacy messages. */
export function queueSharedSourceRevisions(context:Pick<SharedSourceDispatchContext,"database"|"now"|"limit"|"notBeforeUtc"|"trackedPageUrl">,alertId?:string):void {
  const db = context.database;
  const rows = db.prepare(`SELECT d.delivery_id,d.community_id,d.object_id,d.destination_id,d.publisher_user_id,x.discord_channel_id,c.discord_guild_id,c.slug,a.author_user_id,a.status source_status,
    d.discord_message_id original_message_id,d.status original_status,d.delivery_outcome,r.revision_id,r.content_json,r.content_hash,CASE WHEN a.status='archived' THEN coalesce((SELECT intent.user_id FROM traderlink_community_publication_receipts intent WHERE intent.community_id=d.community_id AND intent.request_id='shared-source-capture:'||d.object_id||':'||r.revision_id||':withdrawal' LIMIT 1),r.actor_user_id) ELSE r.actor_user_id END actor_user_id
    FROM traderlink_community_content_deliveries d JOIN traderlink_community_discord_destinations x ON x.destination_id=d.destination_id AND x.community_id=d.community_id AND x.content_type='alerts' AND x.status='active'
    JOIN traderlink_communities c ON c.community_id=d.community_id AND c.status='active'
    JOIN traderlink_community_alerts a ON a.alert_id=d.object_id AND a.community_id=d.community_id AND a.status IN ('published','archived')
    JOIN traderlink_community_publication_receipts frozen ON frozen.community_id=d.community_id AND frozen.user_id=d.publisher_user_id AND frozen.request_id=('shared-source-original:'||d.delivery_id) AND json_extract(frozen.result_json,'$.kind')='shared-source-original-v1'
    JOIN traderlink_community_publication_revisions r ON r.revision_id=(SELECT latest.revision_id FROM traderlink_community_publication_revisions latest WHERE latest.community_id=d.community_id AND latest.object_type='alert' AND latest.object_id=d.object_id ORDER BY latest.rowid DESC LIMIT 1)
    WHERE (? IS NULL OR d.object_id=?) AND (a.status='archived' OR json_extract(r.content_json,'$.status')='published' OR EXISTS(SELECT 1 FROM traderlink_community_publication_receipts intent WHERE intent.community_id=d.community_id AND intent.request_id='shared-source-capture:'||d.object_id||':'||r.revision_id||':correction' AND json_extract(intent.result_json,'$.outboundAction')='edit') OR EXISTS(SELECT 1 FROM traderlink_community_publication_actions req WHERE req.community_id=d.community_id AND req.object_type='alert' AND req.object_id=d.object_id AND req.destination_id=d.destination_id AND req.revision_id=r.revision_id AND req.action_kind='edit' AND req.status='pending' AND json_extract(req.payload_json,'$.kind') IS NOT 'shared-source-edit-v1')) AND d.object_type='alert' AND d.publisher_user_id IS NOT NULL AND r.actor_user_id IS NOT NULL AND d.discord_message_id IS NOT NULL
    AND ((a.status='published' AND d.status='delivered' AND d.delivery_outcome='confirmed' AND (r.revision_id<>json_extract(frozen.result_json,'$.revisionId') OR EXISTS(SELECT 1 FROM traderlink_community_publication_actions req WHERE req.community_id=d.community_id AND req.object_type='alert' AND req.object_id=d.object_id AND req.destination_id=d.destination_id AND req.revision_id=r.revision_id AND req.action_kind='edit' AND req.status='pending' AND json_extract(req.payload_json,'$.kind') IS NOT 'shared-source-edit-v1'))) OR (a.status='archived' AND d.delivery_outcome<>'uncertain'))
    AND NOT EXISTS(SELECT 1 FROM traderlink_community_publication_actions existing WHERE existing.community_id=d.community_id AND existing.object_type='alert' AND existing.object_id=d.object_id AND existing.destination_id=d.destination_id
      AND json_extract(existing.payload_json,'$.kind')='shared-source-edit-v1' AND (existing.status IN ('pending','sending','uncertain') OR (existing.revision_id=r.revision_id AND json_extract(existing.payload_json,'$.sourceStatus')=a.status)))
    AND (? IS NULL OR d.requested_at_utc>=?) ORDER BY a.updated_at_utc,d.delivery_id LIMIT ?`)
    .all(alertId??null,alertId??null,context.notBeforeUtc ?? null, context.notBeforeUtc ?? null, context.limit) as RevisionRow[];
  for (const row of rows) {
    const original = readSourceOriginalPlan(db, row);
    if (!original || original.channelId !== row.discord_channel_id) continue;
    const confirmed = confirmedSourceParts(db, row.delivery_id);
    if (!confirmed.length || confirmed[0].messageId !== row.original_message_id) continue;
    if (row.source_status === "published" && (row.original_status !== "delivered" || row.delivery_outcome !== "confirmed" || confirmed.length !== original.parts.length)) continue;
    if (row.delivery_outcome === "uncertain" || db.prepare(`SELECT 1 FROM traderlink_community_delivery_attempt_history h WHERE h.delivery_id=? AND h.attempt_key LIKE ? AND h.outcome='uncertain'
      AND h.rowid=(SELECT max(last.rowid) FROM traderlink_community_delivery_attempt_history last WHERE last.delivery_id=h.delivery_id AND last.attempt_key=h.attempt_key) LIMIT 1`).get(row.delivery_id, `source-alert:${row.delivery_id}:part:%`)) continue;
    if (db.prepare(`SELECT 1 FROM traderlink_community_publication_actions WHERE community_id=? AND object_type='alert' AND object_id=? AND destination_id=? AND json_extract(payload_json,'$.kind')='shared-source-edit-v1'
      AND (status IN ('pending','sending','uncertain') OR (revision_id=? AND json_extract(payload_json,'$.sourceStatus')=?)) LIMIT 1`)
      .get(row.community_id, row.object_id, row.destination_id, row.revision_id, row.source_status)) continue;
    if (createHash("sha256").update(row.content_json).digest("hex") !== row.content_hash) throw new SharedAlertError("changed");
    const latest = db.prepare(`SELECT payload_json FROM traderlink_community_publication_actions WHERE community_id=? AND object_type='alert' AND object_id=? AND destination_id=? AND status='confirmed' AND json_extract(payload_json,'$.kind')='shared-source-edit-v1' ORDER BY rowid DESC LIMIT 1`)
      .get(row.community_id, row.object_id, row.destination_id) as { payload_json: string } | undefined;
    const previous = latest ? JSON.parse(latest.payload_json) as EditPlan : undefined;
    if (previous && previous.channelId !== original.channelId) continue;
    const messageIds = previous ? previous.parts.filter(part => part.operation !== "DELETE" && part.status === "confirmed").map(part => part.messageId) : confirmed.map(part => part.messageId);
    if (!messageIds.length || messageIds.some(id => !id || !/^\d{1,32}$/u.test(id))) continue;
    const content = JSON.parse(row.content_json) as { title: string; symbol?: string | null; body: string; publishingMode: "tracked_page" | "discord_post" };
    const parts = sourceAlertParts(db, row.object_id, content, content.publishingMode === "tracked_page" ? context.trackedPageUrl(row.slug, row.object_id) : "", row.source_status === "archived");
    const generic=db.prepare("SELECT action_id,status,attempt_count,revision_id,publisher_user_id,initiating_publisher_user_id,target_message_id FROM traderlink_community_publication_actions WHERE community_id=? AND object_type='alert' AND object_id=? AND destination_id=? AND action_kind='edit' AND status IN('pending','sending','uncertain') AND json_extract(payload_json,'$.kind') IS NOT 'shared-source-edit-v1'").all(row.community_id,row.object_id,row.destination_id) as {action_id:string;status:string;attempt_count:number;revision_id:string;publisher_user_id:string;initiating_publisher_user_id:string;target_message_id:string}[];
    const handoff=generic[0];
    if(generic.length&&(generic.length!==1||handoff.status!=="pending"||handoff.attempt_count!==0||handoff.revision_id!==row.revision_id||handoff.publisher_user_id!==row.actor_user_id||handoff.initiating_publisher_user_id!==row.publisher_user_id||handoff.target_message_id!==messageIds[0]||db.prepare("SELECT 1 FROM traderlink_community_publication_action_attempts WHERE action_id=? LIMIT 1").get(handoff.action_id)))continue;
    const actionId=handoff?.action_id??createCanonicalUuidV4();
    const plan: EditPlan = { kind: "shared-source-edit-v1", deliveryId: row.delivery_id, channelId: original.channelId, originalPublisherId: row.publisher_user_id, sourceStatus: row.source_status,
      parts: Array.from({ length: Math.max(parts.length, messageIds.length) }, (_, index) => ({ operation: index >= parts.length ? "DELETE" : index >= messageIds.length ? "POST" : "PATCH", content: parts[index] ?? "", messageId: messageIds[index] ?? null, status: "pending", attempts: 0, nonce: sourceAlertNonce(`source-edit:${actionId}:${index + 1}`) })) };
    if(handoff){
      db.prepare("UPDATE traderlink_community_publication_actions SET payload_json=?,updated_at_utc=? WHERE action_id=? AND status='pending' AND attempt_count=0 AND NOT EXISTS(SELECT 1 FROM traderlink_community_publication_action_attempts h WHERE h.action_id=traderlink_community_publication_actions.action_id)").run(JSON.stringify(plan),context.now(),actionId);
      continue;
    }
    db.prepare(`INSERT INTO traderlink_community_publication_actions(action_id,community_id,revision_id,object_type,object_id,destination_id,publisher_user_id,initiating_publisher_user_id,action_kind,target_message_id,payload_json,requested_at_utc,updated_at_utc)
      VALUES(?,?,?,'alert',?,?,?,?,'edit',?,?,?,?)`).run(actionId, row.community_id, row.revision_id, row.object_id, row.destination_id, row.actor_user_id, row.publisher_user_id, messageIds[0], JSON.stringify(plan), context.now(), context.now());
  }
}

export const sharedAlertsSourceRevisionDelivery: SharedSourceDispatchBindings["edits"] = {
  kind: "alert-revision-multipart",
  async run(context) {
    const db = context.database, now = context.now();
    const selected=context.exactSelection?.actionIds,selectedSql=selected?` AND action_id IN (${selected.map(()=>"?").join(",")||"NULL"})`:"";
    const interrupted = db.prepare(`SELECT action_id,payload_json FROM traderlink_community_publication_actions WHERE object_type='alert' AND status='sending' AND updated_at_utc<? AND json_extract(payload_json,'$.kind')='shared-source-edit-v1'${selectedSql}`)
      .all(new Date(Date.parse(now) - 300_000).toISOString(),...(selected??[])) as { action_id: string; payload_json: string }[];
    for (const row of interrupted) {
      const plan = JSON.parse(row.payload_json) as EditPlan;
      const status = plan.parts.every(part => part.status === "confirmed") ? "confirmed" : plan.parts.some(part => part.status === "uncertain") ? "uncertain" : "pending";
      db.prepare("UPDATE traderlink_community_publication_actions SET status=?,updated_at_utc=? WHERE action_id=? AND status='sending'").run(status, now, row.action_id);
    }
    if(!selected)queueSharedSourceRevisions(context);
    const rows = db.prepare(`SELECT action.action_id,action.payload_json,action.attempt_count,action.publisher_user_id,action.initiating_publisher_user_id,action.target_message_id,action.revision_id,action.community_id,action.object_id,action.destination_id,
      c.discord_guild_id,c.slug,x.discord_channel_id,a.author_user_id,a.status source_status,r.content_json,r.content_hash,r.actor_user_id
      FROM traderlink_community_publication_actions action JOIN traderlink_community_publication_revisions r ON r.revision_id=action.revision_id AND r.community_id=action.community_id
      JOIN traderlink_communities c ON c.community_id=action.community_id AND c.status='active'
      JOIN traderlink_community_discord_destinations x ON x.destination_id=action.destination_id AND x.community_id=action.community_id AND x.content_type='alerts' AND x.status='active'
      JOIN traderlink_community_alerts a ON a.alert_id=action.object_id AND a.community_id=action.community_id
      WHERE ${sharedCooldownSql(db,'x.discord_channel_id',now)} ${selected?`AND action.action_id IN (${selected.map(()=>"?").join(",")||"NULL"})`:""} AND action.object_type='alert' AND action.action_kind='edit' AND action.status='pending' AND action.attempt_count<5 AND json_extract(action.payload_json,'$.kind')='shared-source-edit-v1'
      AND action.publisher_user_id IS NOT NULL AND action.initiating_publisher_user_id IS NOT NULL
      AND (action.next_attempt_at_utc IS NULL OR action.next_attempt_at_utc<=?) ORDER BY action.requested_at_utc,action.rowid LIMIT ?`).all(...(selected??[]),now, context.limit) as ActionRow[];
    let delivered = 0, failed = 0, writes = 0;
    for (const row of rows) {
      if (writes >= context.limit) break;
      try{if(context.exactSelection)assertCommunityStagingQaSharedTarget(context.exactSelection.capability,context.database,row.discord_guild_id,row.discord_channel_id);else if(!isCommunityReviewDiscordGuild(row.discord_guild_id))continue;}catch{continue;}
      if (new SharedAlertRateLimits(db, context.now).current(row.discord_channel_id)) continue;
      if (!db.prepare("UPDATE traderlink_community_publication_actions SET status='sending',attempt_count=attempt_count+1,updated_at_utc=? WHERE action_id=? AND status='pending'").run(context.now(), row.action_id).changes) continue;
      const plan = JSON.parse(row.payload_json) as EditPlan;
      const persist = (status: "pending" | "confirmed" | "rejected" | "uncertain", message: string | null, retryAt: string | null = null) => db.prepare(`UPDATE traderlink_community_publication_actions SET status=?,payload_json=?,last_error=?,next_attempt_at_utc=?,updated_at_utc=? WHERE action_id=? AND status='sending'`).run(status, JSON.stringify(plan), message, retryAt, context.now(), row.action_id);
      const current = () => {
        const latest = db.prepare("SELECT revision_id FROM traderlink_community_publication_revisions WHERE community_id=? AND object_type='alert' AND object_id=? ORDER BY rowid DESC LIMIT 1").get(row.community_id, row.object_id) as { revision_id: string } | undefined;
        const active = db.prepare(`SELECT 1 FROM traderlink_community_publication_actions action JOIN traderlink_community_alerts a ON a.alert_id=action.object_id AND a.community_id=action.community_id
          JOIN traderlink_community_discord_destinations x ON x.destination_id=action.destination_id AND x.community_id=action.community_id
          WHERE action.action_id=? AND action.status='sending' AND a.status=? AND x.status='active' AND x.discord_channel_id=?`).get(row.action_id, plan.sourceStatus, plan.channelId);
        return Boolean(active && latest?.revision_id === row.revision_id);
      };
      try {
        if (plan.kind !== "shared-source-edit-v1" || plan.channelId !== row.discord_channel_id || plan.originalPublisherId !== row.initiating_publisher_user_id || !Array.isArray(plan.parts) || !plan.parts.length || plan.parts.length > 32 || plan.parts.some(part => !["PATCH", "POST", "DELETE"].includes(part.operation) || part.content.length > 2000 || !Number.isSafeInteger(part.attempts) || part.attempts < 0 || part.attempts > 5)) throw new SharedAlertError("changed");
        if (!current()) { persist(plan.parts.some(part => part.status !== "pending") ? "uncertain" : "rejected", "A newer source revision or channel setting replaced this edit."); continue; }
        record(context, row, "sending");
        for (const part of plan.parts) {
          if (part.status === "confirmed") continue;
          if (part.status === "uncertain") { persist("uncertain", "A source edit result needs confirmation."); break; }
          if (part.attempts >= 5) { persist("rejected", "Source edit-part retries exhausted."); break; }
          if (writes >= context.limit || new SharedAlertRateLimits(db, context.now).current(plan.channelId)) break;
          await verifySourceWrite(context, row);
          if (row.initiating_publisher_user_id !== row.publisher_user_id) await verifySourceWrite(context, { ...row, publisher_user_id: row.initiating_publisher_user_id });
          new SharedAlertsSourcePublication(db).readForPublisher(row.community_id, row.publisher_user_id, row.object_id, context.now());
          if (!current()) throw new SharedAlertError("changed");
          const headers = { Authorization: `Bot ${context.botToken}` };
          const targetId = part.operation === "POST" ? row.target_message_id : part.messageId;
          if (!targetId || !/^\d{1,32}$/u.test(targetId)) throw new SharedAlertError("changed");
          const [botResponse, messageResponse] = await Promise.all([
            context.request("https://discord.com/api/v10/users/@me", { headers, signal: AbortSignal.timeout(8000), cache: "no-store" }),
            context.request(`https://discord.com/api/v10/channels/${plan.channelId}/messages/${targetId}`, { headers, signal: AbortSignal.timeout(8000), cache: "no-store" }),
          ]);
          if (!botResponse.ok || !messageResponse.ok) throw new SharedAlertError("discord_unavailable");
          const bot = await botResponse.json() as { id?: string; bot?: boolean }, message = await messageResponse.json() as { id?: string; channel_id?: string; author?: { id?: string } };
          if (!bot.bot || !bot.id || message.id !== targetId || message.channel_id !== plan.channelId || message.author?.id !== bot.id) throw new SharedAlertError("changed");
          // Final synchronous policy/queue check after all verification awaits.
          assertSourceWriteCurrent(context, row);
          assertSourceWriteCurrent(context, { ...row, publisher_user_id: row.initiating_publisher_user_id });
          new SharedAlertsSourcePublication(db).readForPublisher(row.community_id, row.publisher_user_id, row.object_id, context.now());
          if (!current()) throw new SharedAlertError("changed");
          part.status = "uncertain"; part.attempts++;
          db.transaction(() => {
            db.prepare("UPDATE traderlink_community_publication_actions SET payload_json=?,updated_at_utc=? WHERE action_id=? AND status='sending'").run(JSON.stringify(plan), context.now(), row.action_id);
            record(context, row, "uncertain", null, "Source edit part started; awaiting confirmation.");
          }).immediate(); writes++;
          const response = await context.request(`https://discord.com/api/v10/channels/${plan.channelId}/messages${part.operation === "POST" ? "" : `/${targetId}`}`, {
            method: part.operation, headers: { ...headers, "Content-Type": "application/json" }, signal: AbortSignal.timeout(10_000),
            ...(part.operation === "DELETE" ? {} : { body: JSON.stringify({ content: part.content, allowed_mentions: { parse: [], replied_user: false }, ...(part.operation === "POST" ? { nonce: part.nonce, enforce_nonce: true, message_reference: { message_id: row.target_message_id, channel_id: plan.channelId, guild_id: row.discord_guild_id, fail_if_not_exists: true } } : {}) }) }),
          });
          if (response.status === 429) {
            part.status = "pending";
            persist("pending", "Discord rate limit; retry after stored cooldown.", new Date(Date.parse(context.now()) + 60_000).toISOString()); record(context, row, "pending", null, "Discord rate limit."); break;
          }
          if (!response.ok) {
            if (response.status < 500) part.status = "pending";
            persist(response.status >= 500 ? "uncertain" : "rejected", "Discord did not confirm this source edit."); record(context, row, response.status >= 500 ? "uncertain" : "rejected"); failed++; break;
          }
          let messageId = targetId;
          if (part.operation !== "DELETE") {
            const receipt = await response.json() as { id?: string; channel_id?: string };
            if (!receipt.id || !/^\d{1,32}$/u.test(receipt.id) || receipt.channel_id !== plan.channelId || (part.operation === "PATCH" && receipt.id !== targetId)) throw new SharedAlertError("changed");
            messageId = receipt.id;
          }
          part.status = "confirmed"; part.messageId = messageId;
          db.transaction(() => {
            // Retain a late in-flight receipt even if an owner stopped later actions.
            db.prepare("UPDATE traderlink_community_publication_actions SET payload_json=?,attempt_count=0,updated_at_utc=? WHERE action_id=?").run(JSON.stringify(plan), context.now(), row.action_id);
            record(context, row, "confirmed", messageId);
          }).immediate();
        }
        if (plan.parts.every(part => part.status === "confirmed")) {
          delivered += db.prepare("UPDATE traderlink_community_publication_actions SET status='confirmed',last_error=NULL,next_attempt_at_utc=NULL,updated_at_utc=? WHERE action_id=? AND status='sending'").run(context.now(), row.action_id).changes;
        } else db.prepare("UPDATE traderlink_community_publication_actions SET status='pending',updated_at_utc=? WHERE action_id=? AND status='sending'").run(context.now(), row.action_id);
      } catch {
        const unknown = plan.parts.some(part => part.status === "uncertain");
        persist(unknown ? "uncertain" : "pending", unknown ? "Source edit needs confirmation; no automatic replay." : "Source edit verification unavailable; retry scheduled.", unknown ? null : new Date(Date.parse(context.now()) + 60_000).toISOString()); failed++;
      }
    }
    return { delivered, failed };
  },
};
