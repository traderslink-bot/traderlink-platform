import type Database from "better-sqlite3";
import {
  PARTNER_ALERT_ORDINARY_DELIVERY_RECEIPT_HAS_TEXT_SQL,
  redactPartnerAlertOrdinaryDeliveryReceipts,
} from "../../../partner-alerts/server/partner-alert-delivery-receipt-retention";
import { PARTNER_ALERT_REMOVED_CREDENTIAL_JSON } from "../../../partner-alerts/server/partner-alert-retention-policy";
import { purgePartnerAlertWhopEvidence } from "../../../partner-alerts/server/partner-alert-whop-evidence-retention";
import { sweepPlatformErasureTextPage } from "./platform-erasure-text-sweep";

/** Internal restore sanitation step. Only call on a private candidate already
 * checked against trusted restore pins. Does not authorize rooted deletion
 * or issue a receipt. Caller owns rollback and must keep traffic disabled. */
export function sanitizePlatformRestorePage(
  database: Database.Database, atUtc: string, key: Parameters<typeof sweepPlatformErasureTextPage>[1],
  cursor: Parameters<typeof sweepPlatformErasureTextPage>[3] = null,
) {
  if (!database.inTransaction || !Number.isFinite(Date.parse(atUtc)) || new Date(atUtc).toISOString() !== atUtc) {
    throw new Error("platform_restore_quarantine_required");
  }
  const cutoff = new Date(Date.parse(atUtc) - 7 * 86_400_000).toISOString();
  database.prepare(`UPDATE platform_auth_sessions SET revoked_at_utc=max(created_at_utc,?)
    WHERE revoked_at_utc IS NULL`).run(atUtc);
  database.prepare(`UPDATE partner_alert_whop_connections
    SET status='disconnected',encrypted_authorisation_json=?
    WHERE status!='disconnected' OR encrypted_authorisation_json!=?`)
    .run(PARTNER_ALERT_REMOVED_CREDENTIAL_JSON,PARTNER_ALERT_REMOVED_CREDENTIAL_JSON);
  purgePartnerAlertWhopEvidence(database, { kind: "restore" });
  const claims = sweepPlatformErasureTextPage(database,key,atUtc,cursor);
  if (database.prepare(`SELECT 1 FROM partner_alert_source_messages AS s WHERE NOT EXISTS(
    SELECT 1 FROM partner_alert_source_revisions AS r WHERE r.community_id=s.community_id
    AND r.source_channel_id=s.source_channel_id AND r.message_id=s.message_id)`).get()) {
    throw new Error("platform_restore_first_receipt_missing");
  }
  const sources = database.prepare(`SELECT s.community_id,s.source_channel_id,s.message_id,
      min(r.observed_at_utc) AS first
    FROM partner_alert_source_messages s JOIN partner_alert_source_revisions r
      USING(community_id,source_channel_id,message_id)
    GROUP BY s.community_id,s.source_channel_id,s.message_id
    HAVING first<=? AND (s.text_content IS NOT NULL OR s.state NOT IN ('expired','deleted')
      OR EXISTS(SELECT 1 FROM partner_alert_source_revisions x WHERE x.community_id=s.community_id
        AND x.source_channel_id=s.source_channel_id AND x.message_id=s.message_id AND x.text_content IS NOT NULL)
      OR EXISTS(SELECT 1 FROM partner_alert_deliveries d WHERE d.community_id=s.community_id
        AND d.source_channel_id=s.source_channel_id AND d.message_id=s.message_id
        AND (d.text_content IS NOT NULL OR (${PARTNER_ALERT_ORDINARY_DELIVERY_RECEIPT_HAS_TEXT_SQL}))))
    ORDER BY s.community_id,s.source_channel_id,s.message_id LIMIT 101`).all(cutoff) as
    {community_id:string;source_channel_id:string;message_id:string;first:string}[];
  for (const source of sources.slice(0,100)) {
    if (!Number.isFinite(Date.parse(source.first)) || new Date(source.first).toISOString() !== source.first) {
      throw new Error("platform_restore_first_receipt_invalid");
    }
    const ids = [source.community_id,source.source_channel_id,source.message_id];
    const where = "community_id=? AND source_channel_id=? AND message_id=?";
    database.prepare(`UPDATE partner_alert_deliveries SET text_content=NULL,
      status=CASE WHEN action!='delete' AND status IN ('pending','failed') THEN 'cancelled' ELSE status END,
      last_error_code=CASE WHEN action!='delete' AND status IN ('pending','failed') THEN 'retention_expired' ELSE last_error_code END
      WHERE ${where}`).run(...ids);
    redactPartnerAlertOrdinaryDeliveryReceipts(database, {
      communityId: source.community_id, sourceChannelId: source.source_channel_id, messageId: source.message_id,
    });
    database.prepare(`UPDATE partner_alert_source_revisions SET text_content=NULL WHERE ${where}`).run(...ids);
    database.prepare(`UPDATE partner_alert_source_messages SET text_content=NULL,hold_issues_json='[]',
      state=CASE WHEN state='deleted' THEN 'deleted' ELSE 'expired' END,
      retain_until_utc=min(retain_until_utc,?) WHERE ${where}`)
      .run(new Date(Date.parse(source.first)+7*86_400_000).toISOString(),...ids);
  }
  return Object.freeze({claimPage:claims,sourcePagesRemain:sources.length>100,redactedSources:Math.min(sources.length,100)});
}
