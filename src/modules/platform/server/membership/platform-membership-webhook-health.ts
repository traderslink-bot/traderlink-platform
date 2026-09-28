import { createHash } from "node:crypto";
import type Database from "better-sqlite3";
import { createCanonicalUuidV4 } from "../database/platform-migration-contract";

/** Call only after raw-body signature verification. Never store the body or provider error text. */
export function recordMembershipWebhookFailure(database: Database.Database, provider: "stripe" | "whop", eventId: string, raw: string, at = new Date().toISOString()): void {
  const eventHash = createHash("sha256").update(eventId).digest("hex");
  const payloadHash = createHash("sha256").update(raw).digest("hex");
  let eventType = "unknown";
  try {
    const event: unknown = JSON.parse(raw);
    if (event && typeof event === "object" && "type" in event && typeof event.type === "string" && /^[a-z_]+(?:\.[a-z_]+){1,5}$/.test(event.type)) eventType = event.type;
  } catch { /* Signed malformed input is still a processing failure, not a receipt. */ }
  database.prepare(`INSERT INTO platform_membership_audit_events
    (audit_event_id,action,target_type,target_id,safe_details_json,occurred_at_utc)
    VALUES (?,'webhook.processing_failed','provider_event',?,?,?)`).run(createCanonicalUuidV4(), `${provider}:${eventHash}`,
      JSON.stringify({ provider, eventHash, payloadHash, eventType }), at);
}

export function readMembershipWebhookFailures(database: Database.Database): readonly { provider: string; event_type: string; processed_at_utc: string; attempts: number }[] {
  return database.prepare(`SELECT json_extract(a.safe_details_json,'$.provider') provider,
    json_extract(a.safe_details_json,'$.eventType') event_type,MAX(a.occurred_at_utc) processed_at_utc,COUNT(*) attempts
    FROM platform_membership_audit_events a
    WHERE a.action='webhook.processing_failed' AND NOT EXISTS (
      SELECT 1 FROM platform_membership_provider_event_receipts r
      WHERE r.provider=json_extract(a.safe_details_json,'$.provider')
        AND r.external_event_ref_hash=json_extract(a.safe_details_json,'$.eventHash')
        AND r.payload_sha256=json_extract(a.safe_details_json,'$.payloadHash')
        AND r.processing_result IN ('applied','duplicate','stale','ignored'))
    GROUP BY a.target_id,json_extract(a.safe_details_json,'$.payloadHash')
    ORDER BY processed_at_utc DESC LIMIT 50`).all() as { provider: string; event_type: string; processed_at_utc: string; attempts: number }[];
}
