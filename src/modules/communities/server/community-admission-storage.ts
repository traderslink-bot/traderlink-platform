/** Unregistered additive schema draft; never executed by imports or normal requests. */
export const COMMUNITY_ADMISSION_STORAGE_DRAFT = `
CREATE TABLE traderlink_community_admission_invitations (
  discord_guild_id TEXT PRIMARY KEY CHECK(length(discord_guild_id) BETWEEN 1 AND 32 AND discord_guild_id NOT GLOB '*[^0-9]*'),
  display_name TEXT NOT NULL CHECK(length(trim(display_name)) BETWEEN 1 AND 120),
  actor_user_id TEXT NOT NULL REFERENCES platform_users(user_id) ON DELETE RESTRICT,
  reason TEXT NOT NULL CHECK(length(trim(reason)) BETWEEN 1 AND 2000),
  created_at_utc TEXT NOT NULL
) STRICT;
CREATE TABLE traderlink_community_admission_policy_versions (
  revision INTEGER PRIMARY KEY CHECK(revision > 0),
  mode TEXT NOT NULL CHECK(mode IN ('manual','automatic')),
  requirements_json TEXT NOT NULL CHECK(json_valid(requirements_json)),
  actor_user_id TEXT NOT NULL REFERENCES platform_users(user_id) ON DELETE RESTRICT,
  reason TEXT NOT NULL CHECK(length(trim(reason)) BETWEEN 1 AND 2000),
  created_at_utc TEXT NOT NULL
) STRICT;
CREATE TABLE traderlink_community_admission_member_counts (
  receipt_id TEXT PRIMARY KEY,
  discord_guild_id TEXT NOT NULL REFERENCES traderlink_community_admission_invitations(discord_guild_id) ON DELETE RESTRICT,
  revision INTEGER NOT NULL CHECK(revision > 0),
  source TEXT NOT NULL CHECK(source='discord_bot_guild_with_counts'),
  approximate_total_members INTEGER NOT NULL CHECK(approximate_total_members >= 0 AND approximate_total_members <= 9007199254740991),
  observed_at_utc TEXT NOT NULL,
  UNIQUE(discord_guild_id,revision)
) STRICT;
CREATE TABLE traderlink_community_admission_decisions (
  decision_id TEXT PRIMARY KEY,
  discord_guild_id TEXT NOT NULL REFERENCES traderlink_community_admission_invitations(discord_guild_id) ON DELETE RESTRICT,
  revision INTEGER NOT NULL CHECK(revision > 0),
  kind TEXT NOT NULL CHECK(kind IN ('admission','coaching_exemption')),
  status TEXT NOT NULL CHECK(status IN ('pending','approved','declined')),
  actor_user_id TEXT NOT NULL REFERENCES platform_users(user_id) ON DELETE RESTRICT,
  reason TEXT NOT NULL CHECK(length(trim(reason)) BETWEEN 1 AND 2000),
  created_at_utc TEXT NOT NULL,
  admission_revision INTEGER CHECK(admission_revision > 0),
  source TEXT NOT NULL CHECK(source IN ('owner','automatic')),
  policy_revision INTEGER REFERENCES traderlink_community_admission_policy_versions(revision) ON DELETE RESTRICT,
  evidence_receipt_id TEXT REFERENCES traderlink_community_admission_member_counts(receipt_id) ON DELETE RESTRICT,
  CHECK(source != 'automatic' OR (kind='admission' AND status='approved' AND policy_revision IS NOT NULL AND evidence_receipt_id IS NOT NULL)),
  CHECK(kind != 'coaching_exemption' OR source='owner'),
  CHECK(kind != 'coaching_exemption' OR status != 'approved' OR admission_revision IS NOT NULL),
  UNIQUE(discord_guild_id,kind,revision)
) STRICT;
CREATE TABLE traderlink_community_admission_commands (
  actor_user_id TEXT NOT NULL REFERENCES platform_users(user_id) ON DELETE RESTRICT,
  request_key TEXT NOT NULL,
  command_sha256 TEXT NOT NULL CHECK(length(command_sha256)=64),
  receipt_json TEXT NOT NULL CHECK(json_valid(receipt_json)),
  created_at_utc TEXT NOT NULL,
  PRIMARY KEY(actor_user_id,request_key)
) STRICT;
${['invitations', 'policy_versions', 'decisions', 'commands', 'member_counts'].flatMap(name => ['UPDATE', 'DELETE'].map(operation => `
CREATE TRIGGER traderlink_community_admission_${name}_no_${operation.toLowerCase()} BEFORE ${operation} ON traderlink_community_admission_${name}
BEGIN SELECT RAISE(ABORT,'Admission history is immutable'); END;`)).join('\n')}
`;
