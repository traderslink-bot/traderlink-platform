/** Additive migration payload. Registration is reserved by the Coordinator. */
export const platformDiscordReleaseSchemaStatements = Object.freeze([
  `CREATE TABLE platform_discord_released_origins (
    user_id TEXT NOT NULL REFERENCES platform_users(user_id) ON DELETE RESTRICT,
    auth_subject TEXT PRIMARY KEY CHECK(length(auth_subject) BETWEEN 1 AND 255),
    released_at_utc TEXT NOT NULL
  ) STRICT`,
  `CREATE TRIGGER platform_discord_released_origin_no_update
    BEFORE UPDATE ON platform_discord_released_origins
    BEGIN SELECT RAISE(ABORT,'platform_discord_released_origin_immutable'); END`,
  `CREATE TRIGGER platform_discord_released_origin_no_delete
    BEFORE DELETE ON platform_discord_released_origins
    BEGIN SELECT RAISE(ABORT,'platform_discord_released_origin_immutable'); END`,
  `CREATE TABLE platform_discord_identity_releases (
    release_id TEXT PRIMARY KEY CHECK(length(release_id)=36),
    user_id TEXT NOT NULL REFERENCES platform_users(user_id) ON DELETE RESTRICT,
    auth_subject TEXT NOT NULL CHECK(length(auth_subject) BETWEEN 1 AND 255),
    released_at_utc TEXT NOT NULL,
    prior_linked_by_user_id TEXT NOT NULL,
    prior_created_at_utc TEXT NOT NULL,
    prior_last_authenticated_at_utc TEXT,
    claimed_by_user_id TEXT REFERENCES platform_users(user_id) ON DELETE RESTRICT,
    claimed_at_utc TEXT,
    CHECK((claimed_by_user_id IS NULL AND claimed_at_utc IS NULL)
      OR (claimed_by_user_id IS NOT NULL AND claimed_at_utc>=released_at_utc))
  ) STRICT`,
  `CREATE UNIQUE INDEX platform_discord_release_pending
    ON platform_discord_identity_releases(auth_subject) WHERE claimed_at_utc IS NULL`,
  `CREATE INDEX platform_discord_release_owner
    ON platform_discord_identity_releases(user_id,auth_subject)`,
  `CREATE TRIGGER platform_discord_release_no_delete
    BEFORE DELETE ON platform_discord_identity_releases
    BEGIN SELECT RAISE(ABORT,'platform_discord_release_immutable'); END`,
  `CREATE TRIGGER platform_discord_release_valid_update
    BEFORE UPDATE ON platform_discord_identity_releases
    WHEN NEW.release_id IS NOT OLD.release_id OR NEW.user_id IS NOT OLD.user_id
      OR NEW.auth_subject IS NOT OLD.auth_subject OR NEW.released_at_utc IS NOT OLD.released_at_utc
      OR NEW.prior_linked_by_user_id IS NOT OLD.prior_linked_by_user_id
      OR NEW.prior_created_at_utc IS NOT OLD.prior_created_at_utc
      OR NEW.prior_last_authenticated_at_utc IS NOT OLD.prior_last_authenticated_at_utc
      OR OLD.claimed_at_utc IS NOT NULL OR NEW.claimed_at_utc IS NULL
      OR NEW.claimed_by_user_id IS NULL
    BEGIN SELECT RAISE(ABORT,'platform_discord_release_invalid_update'); END`,
  // Existing disconnected methods become available without reactivating a login.
  // Give each historical release its own UUID; future releases use the same shape.
  `INSERT INTO platform_discord_identity_releases
    (release_id,user_id,auth_subject,released_at_utc,prior_linked_by_user_id,
     prior_created_at_utc,prior_last_authenticated_at_utc)
    SELECT lower(hex(randomblob(4)))||'-'||lower(hex(randomblob(2)))||'-4'||
      substr(lower(hex(randomblob(2))),2)||'-a'||substr(lower(hex(randomblob(2))),2)||'-'||lower(hex(randomblob(6))),
      i.user_id,i.auth_subject,i.updated_at_utc,i.linked_by_user_id,
      i.created_at_utc,i.last_authenticated_at_utc
    FROM platform_auth_identities i JOIN platform_users u ON u.user_id=i.user_id
    WHERE i.auth_provider='discord' AND i.status='revoked' AND u.status='active'
      AND EXISTS(SELECT 1 FROM platform_auth_identities a WHERE a.user_id=i.user_id
        AND a.status='active' AND a.auth_provider<>'discord'
        AND (a.auth_provider<>'email' OR EXISTS(SELECT 1 FROM platform_login_credentials c
          WHERE c.user_id=i.user_id AND c.verified_at_utc IS NOT NULL)))
      AND NOT EXISTS(SELECT 1 FROM platform_auth_sessions s WHERE s.auth_provider='discord'
        AND s.auth_subject=i.auth_subject AND s.revoked_at_utc IS NULL)`,
  `INSERT INTO platform_discord_released_origins(user_id,auth_subject,released_at_utc)
    SELECT r.user_id,r.auth_subject,r.released_at_utc FROM platform_discord_identity_releases r
    JOIN platform_users u ON u.user_id=r.user_id
      AND u.auth_provider='discord' AND u.auth_subject=r.auth_subject`,
  `DROP TRIGGER platform_auth_identities_valid_update`,
  `CREATE TRIGGER platform_auth_identities_valid_update BEFORE UPDATE ON platform_auth_identities
    WHEN NEW.auth_provider IS NOT OLD.auth_provider OR NEW.auth_subject IS NOT OLD.auth_subject
      OR NEW.created_at_utc IS NOT OLD.created_at_utc OR NEW.updated_at_utc<OLD.updated_at_utc
      OR ((NEW.user_id IS NOT OLD.user_id OR NEW.linked_by_user_id IS NOT OLD.linked_by_user_id)
        AND NOT (OLD.auth_provider='discord' AND OLD.status='revoked' AND NEW.status='active'
          AND NEW.linked_by_user_id=NEW.user_id
          AND EXISTS(SELECT 1 FROM platform_discord_identity_releases r
            WHERE r.auth_subject=OLD.auth_subject AND r.user_id=OLD.user_id
              AND r.released_at_utc=OLD.updated_at_utc
              AND r.claimed_by_user_id=NEW.user_id AND r.claimed_at_utc=NEW.updated_at_utc)
          AND NOT EXISTS(SELECT 1 FROM platform_auth_sessions s
            WHERE s.auth_provider='discord' AND s.auth_subject=OLD.auth_subject
              AND s.revoked_at_utc IS NULL)))
    BEGIN SELECT RAISE(ABORT,'platform_auth_identity_invalid_update'); END`,
]);
