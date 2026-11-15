import type { PlatformMigration } from "../platform-migration-contract";

// Additive candidate: coordinator must reconcile the migration reservation before release.
export const platformCoachingDeletionArchivesMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "community", migrationId: "0164_platform_coaching_deletion_archives", executionOrder: 177,
  statements: Object.freeze([
    `CREATE TABLE community_deletion_archives (
      archive_id TEXT PRIMARY KEY NOT NULL,
      source_relationship_id TEXT NOT NULL UNIQUE,
      deleted_subject_id TEXT NOT NULL,
      community_name TEXT NOT NULL,
      created_at_utc TEXT NOT NULL,
      expires_at_utc TEXT NOT NULL CHECK(expires_at_utc>created_at_utc)
    ) STRICT;`,
    `CREATE INDEX community_deletion_archives_expiry ON community_deletion_archives(expires_at_utc);`,
    `CREATE TABLE community_deletion_archive_records (
      record_id TEXT PRIMARY KEY NOT NULL,
      archive_id TEXT NOT NULL REFERENCES community_deletion_archives(archive_id) ON DELETE CASCADE,
      record_kind TEXT NOT NULL,
      payload_json TEXT NOT NULL CHECK(json_valid(payload_json))
    ) STRICT;`,
    `CREATE INDEX community_deletion_archive_records_parent ON community_deletion_archive_records(archive_id);`,
    `CREATE TABLE community_deletion_archive_files (
      archive_id TEXT NOT NULL REFERENCES community_deletion_archives(archive_id) ON DELETE CASCADE,
      attachment_id TEXT NOT NULL,
      filename TEXT NOT NULL,
      media_type TEXT NOT NULL CHECK(media_type IN ('image/png','image/jpeg','image/webp')),
      sha256 TEXT NOT NULL,
      content BLOB NOT NULL,
      target_type TEXT NOT NULL,
      target_id TEXT NOT NULL,
      PRIMARY KEY(archive_id,attachment_id)
    ) STRICT;`,
  ]),
});
