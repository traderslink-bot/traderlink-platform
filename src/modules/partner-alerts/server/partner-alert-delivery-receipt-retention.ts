import type Database from "better-sqlite3";

// Paired erasure claims are transformed with their signed historical bindings
// by Core. The ordinary delivery outcome can be scrubbed without changing them.
export const PARTNER_ALERT_ORDINARY_DELIVERY_RECEIPT_HAS_TEXT_SQL = `(json_type(d.outcome_json,'$.job.text_content')='text'
  OR json_type(d.outcome_json,'$.job.outcome_json')='text')
  AND NOT EXISTS(SELECT 1 FROM platform_erasure_operation_claims c
    WHERE c.participant='partner_delivery_outcome' AND c.original_json=d.outcome_json)`;

export function redactPartnerAlertOrdinaryDeliveryReceipts(db: Database.Database, ids: Readonly<{
  communityId: string; sourceChannelId: string; messageId: string;
}>): void {
  if (!db.inTransaction) throw new Error("Partner alert receipt redaction needs the current transaction.");
  db.prepare(`UPDATE partner_alert_deliveries AS d SET outcome_json=json_remove(outcome_json,'$.job.text_content','$.job.outcome_json')
    WHERE community_id=? AND source_channel_id=? AND message_id=? AND ${PARTNER_ALERT_ORDINARY_DELIVERY_RECEIPT_HAS_TEXT_SQL}`)
    .run(ids.communityId, ids.sourceChannelId, ids.messageId);
}
