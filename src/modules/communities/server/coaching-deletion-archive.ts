import type Database from "better-sqlite3";
import { createCanonicalUuidV4, assertCanonicalUtcTimestamp, assertCanonicalUuidV4 } from "../../platform/server/database/platform-migration-contract";

const PREFIX = "traderlink_community_coaching_";
const DAY = 86_400_000;
type Row = Record<string, string | number | null | Buffer>;

/** Explicit evidence inventory. Never traverse Journal tables or active grants. */
const SOURCES = [
  ["agreements", "relationship_id"], ["tasks", "relationship_id"],
  ["records", "relationship_id"], ["messages", "relationship_id"],
  ["trade_reviews", "relationship_id"], ["sessions", "relationship_id"],
  ["review_actions", "relationship_id"], ["review_events", "relationship_id"],
  ["review_trades", "review_id"], ["review_replies", "review_id"],
  ["occurrences", "agreement_id"], ["teaching_students", "relationship_id"],
] as const;

function exists(db: Database.Database, table: string): boolean {
  return Boolean(db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?").get(table));
}

/** Called inside the erasure transaction, before any parent row is removed. */
export function captureCoachingDeletionEvidence(db: Database.Database, subject: string, atUtc: string): number {
  assertCanonicalUuidV4(subject, "deletedSubject");
  assertCanonicalUtcTimestamp(atUtc, "deletedAtUtc");
  if (!db.inTransaction) throw new Error("Coaching evidence capture requires the account-deletion transaction.");
  if (!exists(db, `${PREFIX}relationships`)) return 0;
  // Fail closed if code and migration are mismatched; never erase evidence silently.
  if (!exists(db, "community_deletion_archives")) throw new Error("Coaching account-deletion storage is unavailable.");
  const relationships = db.prepare(`SELECT r.* FROM ${PREFIX}relationships r
    WHERE r.coach_user_id=? OR r.student_user_id=?`).all(subject, subject) as Row[];
  const insertRecord = db.prepare(`INSERT INTO community_deletion_archive_records
    (record_id,archive_id,record_kind,payload_json) VALUES(?,?,?,?)`);
  let captured = 0;
  for (const relationship of relationships) {
    const relationshipId = String(relationship.relationship_id);
    // A later participant deletion must not renew the first retention deadline.
    if (db.prepare("SELECT 1 FROM community_deletion_archives WHERE source_relationship_id=?").get(relationshipId)) continue;
    const archiveId = createCanonicalUuidV4();
    const community = db.prepare("SELECT display_name,slug FROM traderlink_communities WHERE community_id=?").get(relationship.community_id) as Row;
    const names = db.prepare("SELECT user_id,display_name FROM platform_users WHERE user_id IN (?,?)").all(relationship.coach_user_id, relationship.student_user_id);
    db.prepare(`INSERT INTO community_deletion_archives
      (archive_id,source_relationship_id,deleted_subject_id,community_name,created_at_utc,expires_at_utc)
      VALUES(?,?,?,?,?,?)`).run(archiveId, relationshipId, subject, community.display_name, atUtc,
      new Date(Date.parse(atUtc) + 60 * DAY).toISOString());
    const save = (kind: string, rows: unknown[]) => {
      for (const row of rows) insertRecord.run(createCanonicalUuidV4(), archiveId, kind, JSON.stringify(row));
    };
    save("relationship", [relationship]); save("participants", names); save("community", [community]);
    save("plan", db.prepare(`SELECT * FROM ${PREFIX}plans WHERE plan_id=?`).all(relationship.plan_id));
    for (const [suffix, key] of SOURCES) {
      const table = PREFIX + suffix;
      if (!exists(db, table)) continue;
      const predicate = key === "review_id"
        ? `review_id IN (SELECT review_id FROM ${PREFIX}trade_reviews WHERE relationship_id=?)`
        : key === "agreement_id"
          ? `agreement_id IN (SELECT agreement_id FROM ${PREFIX}agreements WHERE relationship_id=?)`
          : "relationship_id=?";
      save(suffix, db.prepare(`SELECT * FROM ${table} WHERE ${predicate}`).all(relationshipId));
    }
    save("teaching_items", db.prepare(`SELECT t.* FROM ${PREFIX}teaching_items t
      JOIN ${PREFIX}teaching_students s ON s.teaching_id=t.teaching_id WHERE s.relationship_id=?`).all(relationshipId));
    // Store bytes separately: no base64 expansion or all-attachments memory buffer.
    db.prepare(`INSERT INTO community_deletion_archive_files
      (archive_id,attachment_id,filename,media_type,sha256,content,target_type,target_id)
      SELECT ?,attachment_id,filename,media_type,sha256,content,target_type,target_id
      FROM ${PREFIX}attachments WHERE relationship_id=?`).run(archiveId, relationshipId);
    save("review_attachment_links", db.prepare(`SELECT l.* FROM ${PREFIX}review_attachment_links l
      JOIN ${PREFIX}attachments a ON a.attachment_id=l.attachment_id WHERE a.relationship_id=?`).all(relationshipId));
    captured++;
  }
  return captured;
}

/** Expiry is also enforced on reads, independent of worker availability. */
export function purgeExpiredCoachingDeletionArchives(db: Database.Database, atUtc: string, limit = 10): number {
  assertCanonicalUtcTimestamp(atUtc, "atUtc");
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw new Error("Invalid archive cleanup batch.");
  if (!exists(db, "community_deletion_archives")) return 0;
  return db.prepare(`DELETE FROM community_deletion_archives WHERE archive_id IN
    (SELECT archive_id FROM community_deletion_archives WHERE expires_at_utc<=? ORDER BY expires_at_utc LIMIT ?)`)
    .run(atUtc, limit).changes;
}

/** Internal repository read; expose only inside withJournalAdminDatabase. */
export function readCoachingDeletionArchive(db: Database.Database, archiveId: string, atUtc: string, page=0) {
  assertCanonicalUuidV4(archiveId, "archiveId");
  assertCanonicalUtcTimestamp(atUtc, "atUtc");
  if(!Number.isSafeInteger(page)||page<0||page>1000000)throw new Error('Invalid archive page.');
  const archive = db.prepare(`SELECT archive_id,community_name,created_at_utc,expires_at_utc
    FROM community_deletion_archives WHERE archive_id=? AND expires_at_utc>?`).get(archiveId, atUtc);
  if (!archive) return null;
  const records=db.prepare(`SELECT record_id,record_kind,payload_json FROM community_deletion_archive_records
      WHERE archive_id=? ORDER BY record_kind,record_id LIMIT 51 OFFSET ?`).all(archiveId,page*50) as {record_id:string;record_kind:string;payload_json:string}[];
  return {
    archive,
    page,hasMore:records.length>50,records:records.slice(0,50),
    files: db.prepare(`SELECT attachment_id,filename,media_type,target_type,target_id
      FROM community_deletion_archive_files WHERE archive_id=? ORDER BY attachment_id`).all(archiveId) as {attachment_id:string;filename:string;media_type:string;target_type:string;target_id:string}[],
  };
}
