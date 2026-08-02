import type { PlatformMigration } from "@/src/modules/platform/server/database/platform-migration-contract";

function uuidCheck(column: string): string {
  return `CHECK (
    length(${column}) = 36 AND ${column} = lower(${column})
    AND length(replace(${column}, '-', '')) = 32
    AND replace(${column}, '-', '') NOT GLOB '*[^0-9a-f]*'
    AND substr(${column}, 9, 1) = '-' AND substr(${column}, 14, 1) = '-'
    AND substr(${column}, 19, 1) = '-' AND substr(${column}, 24, 1) = '-'
    AND substr(${column}, 15, 1) = '4' AND substr(${column}, 20, 1) GLOB '[89ab]'
  )`;
}

function utcCheck(column: string): string {
  return `CHECK (
    length(${column}) = 24
    AND ${column} GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9].[0-9][0-9][0-9]Z'
  )`;
}

function optionalUtcCheck(column: string): string {
  return `CHECK (${column} IS NULL OR (
    length(${column}) = 24
    AND ${column} GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9].[0-9][0-9][0-9]Z'
  ))`;
}

const sql = `CREATE TABLE affiliate_invites (
  invite_code TEXT PRIMARY KEY CHECK (
    length(invite_code) BETWEEN 1 AND 96
    AND instr(invite_code, char(0)) = 0
  ),
  affiliate_code TEXT NOT NULL CHECK (
    length(affiliate_code) BETWEEN 1 AND 80
    AND instr(affiliate_code, char(0)) = 0
  ),
  affiliate_name TEXT CHECK (
    affiliate_name IS NULL OR length(affiliate_name) BETWEEN 1 AND 120
  ),
  active INTEGER NOT NULL CHECK (active IN (0, 1)),
  created_at_utc TEXT NOT NULL ${utcCheck("created_at_utc")},
  updated_at_utc TEXT NOT NULL ${utcCheck("updated_at_utc")},
  metadata_json TEXT NOT NULL CHECK (json_valid(metadata_json)),
  CHECK (updated_at_utc >= created_at_utc)
) STRICT;

CREATE INDEX affiliate_invites_affiliate_code_idx
  ON affiliate_invites(affiliate_code, active, invite_code);

CREATE TABLE affiliate_attributions (
  user_id TEXT PRIMARY KEY ${uuidCheck("user_id")},
  affiliate_code TEXT NOT NULL CHECK (
    length(affiliate_code) BETWEEN 1 AND 80
    AND instr(affiliate_code, char(0)) = 0
  ),
  invite_code TEXT,
  joined_at_utc TEXT ${optionalUtcCheck("joined_at_utc")},
  first_seen_at_utc TEXT NOT NULL ${utcCheck("first_seen_at_utc")},
  last_seen_at_utc TEXT NOT NULL ${utcCheck("last_seen_at_utc")},
  source TEXT NOT NULL CHECK (
    length(source) BETWEEN 1 AND 64
    AND source = lower(source)
    AND source NOT GLOB '*[^a-z0-9_-]*'
  ),
  created_at_utc TEXT NOT NULL ${utcCheck("created_at_utc")},
  metadata_json TEXT NOT NULL CHECK (json_valid(metadata_json)),
  CHECK (last_seen_at_utc >= first_seen_at_utc),
  CHECK (created_at_utc = first_seen_at_utc),
  FOREIGN KEY (user_id) REFERENCES platform_users(user_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (invite_code) REFERENCES affiliate_invites(invite_code)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE INDEX affiliate_attributions_code_first_seen_idx
  ON affiliate_attributions(affiliate_code, first_seen_at_utc, user_id);

CREATE TRIGGER affiliate_attributions_first_touch_immutable
BEFORE UPDATE ON affiliate_attributions
WHEN NEW.user_id IS NOT OLD.user_id
  OR NEW.affiliate_code IS NOT OLD.affiliate_code
  OR NEW.invite_code IS NOT OLD.invite_code
  OR NEW.first_seen_at_utc IS NOT OLD.first_seen_at_utc
  OR NEW.source IS NOT OLD.source
  OR NEW.created_at_utc IS NOT OLD.created_at_utc
  OR NEW.last_seen_at_utc < OLD.last_seen_at_utc
  OR (OLD.joined_at_utc IS NOT NULL AND NEW.joined_at_utc IS NOT OLD.joined_at_utc)
BEGIN
  SELECT RAISE(ABORT, 'affiliate_attribution_first_touch_immutable');
END`;

export const affiliateAttributionMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "affiliate",
  migrationId: "0016_affiliate_attribution",
  executionOrder: 16,
  statements: Object.freeze([sql]),
});
