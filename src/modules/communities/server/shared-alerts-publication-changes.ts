import { createCanonicalUuidV4 } from "../../platform/server/database/platform-migration-contract";
import { cancelStoppedSharedAlertParts } from "./shared-alerts-parts";
import type { SharedAlertsRepository } from "./shared-alerts-repository";

/** Runs in the source edit transaction after its existing authorization. */
export function captureSharedAlertChange(repository: SharedAlertsRepository, input: { alertId: string; kind: "correction" | "withdrawal"; actorUserId: string; atUtc: string }): void {
  if (process.env.TRADERLINK_SHARED_ALERTS_DELIVERY_ENABLED !== "1") return;
  const db=repository.database;
  const alert=db.prepare("SELECT title,symbol,body FROM traderlink_community_alerts WHERE alert_id=?").get(input.alertId) as {title:string;symbol:string|null;body:string}|undefined;
  if(!alert) return;
  const untouched=`discord_message_id IS NULL AND NOT EXISTS(SELECT 1 FROM community_shared_alert_delivery_parts p WHERE p.delivery_id=community_shared_alert_deliveries.delivery_id AND p.status IN ('sending','delivered','uncertain'))`;
  // An entirely unsent original may change in place, with its approval revoked.
  // A visible/in-flight original keeps its frozen version and gets a labelled follow-up.
  if(input.kind==="correction") db.prepare(`UPDATE community_shared_alert_deliveries SET title=?,symbol=?,body=?,content_revision=content_revision+1,
    approved_content_revision=NULL,approved_by_user_id=NULL,reviewed_at_utc=NULL,status=CASE WHEN requires_approval=1 THEN 'awaiting_approval' ELSE 'pending' END,
    attempt_count=0,retry_at_utc=NULL,last_error=NULL,updated_at_utc=? WHERE alert_id=? AND kind='publication' AND status IN ('awaiting_approval','pending','failed') AND ${untouched}`)
    .run(alert.title,alert.symbol,alert.body,input.atUtc,input.alertId);
  else db.prepare(`UPDATE community_shared_alert_deliveries SET status='cancelled',last_error='Alert withdrawn before a confirmed partner delivery.',retry_at_utc=NULL,updated_at_utc=?
    WHERE alert_id=? AND kind='publication' AND status IN ('awaiting_approval','pending','failed') AND ${untouched}`).run(input.atUtc,input.alertId);
  db.prepare(`UPDATE community_shared_alert_deliveries SET status='cancelled',last_error='Remaining original parts superseded by an alert update.',retry_at_utc=NULL,updated_at_utc=?
    WHERE alert_id=? AND kind='publication' AND status IN ('pending','failed','sending') AND NOT (${untouched})`).run(input.atUtc,input.alertId);
  db.prepare(`UPDATE community_shared_alert_deliveries SET status='cancelled',last_error='Superseded by a newer alert update.',retry_at_utc=NULL,updated_at_utc=?
    WHERE alert_id=? AND kind='correction' AND status IN ('awaiting_approval','pending','failed','sending')`).run(input.atUtc,input.alertId);
  cancelStoppedSharedAlertParts(db,input.atUtc);
  db.prepare(`UPDATE community_shared_alert_delivery_parts SET status='cancelled',last_error='Superseded while a previous part remains uncertain.',updated_at_utc=?
    WHERE status IN ('pending','failed') AND delivery_id IN (SELECT delivery_id FROM community_shared_alert_deliveries WHERE alert_id=? AND status='uncertain')`).run(input.atUtc,input.alertId);
  // Each update follows only its original, still-selected author/channel route.
  db.prepare(`INSERT INTO community_shared_alert_deliveries(delivery_id,request_id,alert_id,event_key,kind,original_delivery_id,author_user_id,publisher_user_id,change_actor_user_id,source_destination_ids_json,
    terms_version,channel_revision,channel_id,title,symbol,body,publishing_mode,source_name,show_source_name,requires_approval,status,created_at_utc,updated_at_utc)
    SELECT lower(hex(randomblob(16))),d.request_id,d.alert_id,?,?,d.delivery_id,d.author_user_id,d.publisher_user_id,?,d.source_destination_ids_json,
      r.terms_version,route.revision,route.channel_id,?,?,?,d.publishing_mode,d.source_name,r.show_source_name,route.require_approval,
      CASE WHEN route.require_approval=1 THEN 'awaiting_approval' ELSE 'pending' END,?,?
    FROM community_shared_alert_deliveries d JOIN community_shared_alert_requests r ON r.request_id=d.request_id
    JOIN community_shared_alert_routes route ON route.request_id=d.request_id AND route.author_user_id=d.author_user_id
    JOIN community_alert_publisher_permissions p ON p.community_id=r.source_community_id AND p.user_id=d.author_user_id AND p.enabled=1
    JOIN traderlink_community_memberships member ON member.community_id=r.source_community_id AND member.user_id=d.author_user_id AND member.status='active'
    JOIN platform_users author ON author.user_id=d.author_user_id AND author.status='active'
    WHERE d.alert_id=? AND d.kind='publication' AND (d.discord_message_id IS NOT NULL OR EXISTS(SELECT 1 FROM community_shared_alert_delivery_parts visible WHERE visible.delivery_id=d.delivery_id AND visible.status IN ('sending','delivered','uncertain'))) AND r.status='active'
      AND r.source_approved_version=r.terms_version AND r.receiver_approved_version=r.terms_version AND r.source_paused=0 AND r.receiver_paused=0
      AND route.source_offered=1 AND route.receiver_selected=1 AND route.receiver_paused=0 AND route.channel_id=d.channel_id
    ON CONFLICT(request_id,alert_id,channel_id,event_key) DO NOTHING`)
    .run(createCanonicalUuidV4(),input.kind,input.actorUserId,alert.title,alert.symbol,alert.body,input.atUtc,input.atUtc,input.alertId);
}
