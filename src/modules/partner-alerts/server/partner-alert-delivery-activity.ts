import type Database from "better-sqlite3";
import { PARTNER_ALERT_CONTENT_MESSAGES } from "../contracts/partner-alert-content-policy";
import { partnerAlertSnowflake, partnerAlertText, partnerAlertUtc } from "../contracts/partner-alert-validation";
import { partnerAlertInitialMessageTextRetainUntil } from "./partner-alert-retention-policy";

type DeliveryStatus = "held" | "pending" | "uncertain" | "failed" | "published" | "removed" | "expired_unsent" | "not_published";
export type PartnerAlertDeliveryActivity = Readonly<{
  messageId: string;
  channelName: string;
  receivedAtUtc: string;
  delivery: DeliveryStatus;
  textState: "available" | "expired" | "unavailable";
  holdReasons: readonly string[];
}>;
export type PartnerAlertDeliveryActivityView = Readonly<{
  alerts: readonly PartnerAlertDeliveryActivity[];
  openedText: Readonly<{ body: string; remainingMs: number }> | null;
}>;

type DeliveryRow = {
  message_id: string; display_name: string; first_received_at: string; retain_until_utc: string;
  state: string; revision_state: string; hold_issues_json: string; has_text: number; opened_body: string | null;
  delivery: Exclude<DeliveryStatus, "held">;
};

/** Called after the existing private request writer authorizes this publisher. */
export function readPartnerAlertDeliveryActivity(db: Database.Database, communityId: string, messageId: string | null,
  nowUtc: string): PartnerAlertDeliveryActivityView {
  const rows = db.prepare(`WITH recent AS (
    SELECT s.community_id,s.source_channel_id,s.message_id,s.revision,s.state,s.retain_until_utc,
      current.state revision_state,current.hold_issues_json,m.mapping_id,m.display_name,s.text_content IS NOT NULL has_text,
      (SELECT min(r.observed_at_utc) FROM partner_alert_source_revisions r WHERE
        (r.community_id,r.source_channel_id,r.message_id)=(s.community_id,s.source_channel_id,s.message_id)) first_received_at,
      CASE WHEN @messageId IS NOT NULL THEN s.text_content END opened_body
    FROM partner_alert_source_messages s JOIN partner_alert_mappings m
      ON (m.community_id,m.source_guild_id,m.source_channel_id)=(s.community_id,s.source_guild_id,s.source_channel_id)
    JOIN partner_alert_source_revisions current
      ON (current.community_id,current.source_channel_id,current.message_id,current.revision)=(s.community_id,s.source_channel_id,s.message_id,s.revision)
    WHERE s.community_id=@communityId AND m.ever_approved=1 AND m.activated_at_utc IS NOT NULL
      AND (@messageId IS NULL OR s.message_id=@messageId)
    ORDER BY length(s.message_id) DESC,s.message_id DESC LIMIT 12
  ) SELECT recent.*,
    coalesce((SELECT CASE
      WHEN max(d.status='uncertain') OR max(d.status='sending') THEN 'uncertain'
      WHEN max(d.status='failed') THEN 'failed'
      WHEN max(d.status='pending') THEN 'pending'
      WHEN max(d.last_error_code='retention_expired') THEN 'expired_unsent'
      WHEN min(d.status='delivered' AND d.action='delete') THEN 'removed'
      WHEN min(d.status='delivered') THEN 'published'
      ELSE 'not_published' END
      FROM partner_alert_deliveries d WHERE (d.community_id,d.mapping_id,d.source_channel_id,d.message_id,d.source_revision)
        =(recent.community_id,recent.mapping_id,recent.source_channel_id,recent.message_id,recent.revision)), 'not_published') delivery
    FROM recent ORDER BY length(message_id) DESC,message_id DESC`).all({ communityId, messageId }) as DeliveryRow[];

  let openedText: PartnerAlertDeliveryActivityView["openedText"] = null;
  const alerts = rows.map(row => {
    const first = partnerAlertUtc(row.first_received_at, "firstReceivedAt");
    const deadline = [partnerAlertUtc(row.retain_until_utc, "retainUntil"),
      partnerAlertInitialMessageTextRetainUntil("allowed", first)].sort()[0]!;
    const expired = row.state === "expired" || deadline <= nowUtc;
    const textState = expired ? "expired" : row.has_text && row.state !== "deleted" ? "available" : "unavailable";
    if (textState === "available" && row.opened_body !== null) {
      openedText = { body: row.opened_body, remainingMs: Date.parse(deadline) - Date.parse(nowUtc) };
    }
    const held = row.revision_state === "held";
    const issues: unknown = held ? JSON.parse(row.hold_issues_json) : null;
    const holdReasons = Array.isArray(issues) ? issues.flatMap(issue =>
      typeof issue === "string" && Object.hasOwn(PARTNER_ALERT_CONTENT_MESSAGES, issue)
        ? [PARTNER_ALERT_CONTENT_MESSAGES[issue as keyof typeof PARTNER_ALERT_CONTENT_MESSAGES]] : []) : [];
    return { messageId: partnerAlertSnowflake(row.message_id, "messageId"), channelName: partnerAlertText(row.display_name, "channelName"),
      receivedAtUtc: first, delivery: held ? "held" as const : row.delivery, textState, holdReasons } as const;
  });
  return { alerts, openedText };
}
