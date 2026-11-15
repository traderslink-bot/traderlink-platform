import type {PlatformMigration} from '@/src/modules/platform/server/database/platform-migration-contract';

/** Coordinator allocation 0193/community/231. Additive source only; registry and execution are separately controlled. */
export const coachingProfilePhotoStatements=Object.freeze([
 `CREATE TABLE traderlink_coaching_profile_photos (
  context_id TEXT PRIMARY KEY REFERENCES traderlink_coaching_contexts(context_id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK(media_type IN ('image/png','image/jpeg','image/webp')),
  byte_length INTEGER NOT NULL CHECK(byte_length > 0 AND byte_length <= 8388608),
  sha256 TEXT NOT NULL CHECK(length(sha256)=64),
  content BLOB NOT NULL,
  created_at_utc TEXT NOT NULL,
  updated_at_utc TEXT NOT NULL
 ) STRICT;`,
]);

export const traderLinkCoachingProfilePhotosMigration:PlatformMigration=Object.freeze({moduleNamespace:'community',migrationId:'0193_traderlink_coaching_profile_photos',executionOrder:231,statements:coachingProfilePhotoStatements});
