import type Database from "better-sqlite3";
import { createHash } from "node:crypto";

export type SharedAlertPartRow = Readonly<{
  delivery_id: string; content_revision: number; part_number: number; total_parts: number;
  content: string; nonce: string; status: "pending"|"sending"|"delivered"|"failed"|"cancelled"|"uncertain";
  attempt_count: number; retry_at_utc: string|null; last_error: string|null; discord_message_id: string|null;
}>;

export function readSharedAlertParts(database: Database.Database, deliveryId: string, revision: number): readonly SharedAlertPartRow[] {
  return database.prepare("SELECT * FROM community_shared_alert_delivery_parts WHERE delivery_id=? AND content_revision=? ORDER BY part_number").all(deliveryId, revision) as SharedAlertPartRow[];
}

/** Called only inside the parent claim transaction; never regenerate sent text. */
export function ensureSharedAlertParts(database: Database.Database, deliveryId: string, revision: number, content: readonly string[], atUtc: string): readonly SharedAlertPartRow[] {
  const existing = readSharedAlertParts(database, deliveryId, revision);
  if (existing.length) return existing;
  if (!content.length || content.length > 32 || content.some(part => !part || part.length > 2000)) throw new Error("Invalid alert message parts.");
  const insert = database.prepare(`INSERT INTO community_shared_alert_delivery_parts(delivery_id,content_revision,part_number,total_parts,content,nonce,status,created_at_utc,updated_at_utc) VALUES(?,?,?,?,?,?,'pending',?,?)`);
  content.forEach((part,index)=>insert.run(deliveryId,revision,index+1,content.length,part,createHash("sha256").update(`${deliveryId}:${revision}:${index+1}`).digest("hex").slice(0,24),atUtc,atUtc));
  return readSharedAlertParts(database, deliveryId, revision);
}

export function cancelStoppedSharedAlertParts(database: Database.Database, atUtc: string, deliveryIds?: readonly string[]): void {
  const selected=deliveryIds?` AND community_shared_alert_delivery_parts.delivery_id IN (${deliveryIds.map(()=>"?").join(",")||"NULL"})`:"";
  database.prepare(`UPDATE community_shared_alert_delivery_parts SET status='cancelled',retry_at_utc=NULL,last_error='Remaining parts stopped or superseded.',updated_at_utc=?
    WHERE status IN ('pending','failed') AND EXISTS(SELECT 1 FROM community_shared_alert_deliveries d WHERE d.delivery_id=community_shared_alert_delivery_parts.delivery_id
      AND (d.status IN ('cancelled','rejected') OR d.content_revision<>community_shared_alert_delivery_parts.content_revision))${selected}`).run(atUtc,...(deliveryIds??[]));
}

export function hasConfirmedSharedAlertOriginal(database: Database.Database, deliveryId: string): boolean {
  return Boolean(database.prepare(`SELECT 1 FROM community_shared_alert_deliveries d WHERE d.delivery_id=? AND d.discord_message_id IS NOT NULL
    AND (d.status='delivered' OR EXISTS(SELECT 1 FROM community_shared_alert_delivery_parts p WHERE p.delivery_id=d.delivery_id AND p.part_number=1 AND p.status='delivered' AND p.discord_message_id=d.discord_message_id))`).get(deliveryId));
}
