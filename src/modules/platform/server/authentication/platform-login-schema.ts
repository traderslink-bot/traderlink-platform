/** Additive auth storage; applied only through a registered Platform migration. */
export const platformLoginSchemaStatements = Object.freeze([
  `CREATE TABLE platform_login_credentials (
    credential_id TEXT PRIMARY KEY,
    user_id TEXT UNIQUE REFERENCES platform_users(user_id) ON DELETE RESTRICT,
    email_normalized TEXT NOT NULL UNIQUE CHECK(length(email_normalized) BETWEEN 3 AND 254),
    password_hash TEXT NOT NULL CHECK(length(password_hash) BETWEEN 20 AND 1024),
    display_name TEXT NOT NULL CHECK(length(display_name) BETWEEN 1 AND 120),
    verified_at_utc TEXT,
    created_at_utc TEXT NOT NULL,
    updated_at_utc TEXT NOT NULL,
    CHECK(verified_at_utc IS NULL OR user_id IS NOT NULL)
  ) STRICT`,
  `CREATE TABLE platform_login_tokens (
    token_sha256 TEXT PRIMARY KEY CHECK(length(token_sha256)=64),
    purpose TEXT NOT NULL CHECK(purpose IN ('verify_email','reset_password','link_provider','change_email')),
    credential_id TEXT REFERENCES platform_login_credentials(credential_id) ON DELETE RESTRICT,
    user_id TEXT REFERENCES platform_users(user_id) ON DELETE RESTRICT,
    session_id TEXT REFERENCES platform_auth_sessions(session_id) ON DELETE RESTRICT,
    provider TEXT CHECK(provider IN ('google','discord','email')),
    pending_email TEXT,
    created_at_utc TEXT NOT NULL,
    expires_at_utc TEXT NOT NULL CHECK(expires_at_utc>created_at_utc),
    consumed_at_utc TEXT,
    CHECK(consumed_at_utc IS NULL OR consumed_at_utc>=created_at_utc)
  ) STRICT`,
  `CREATE TABLE platform_login_verified_emails (
    email_normalized TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES platform_users(user_id) ON DELETE RESTRICT,
    verified_at_utc TEXT NOT NULL
  ) STRICT`,
  `CREATE TABLE platform_login_identity_events (
    event_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES platform_users(user_id) ON DELETE RESTRICT,
    provider TEXT NOT NULL CHECK(provider IN ('google','discord','email')),
    action TEXT NOT NULL CHECK(action IN ('link','unlink','reconnect','reset','change_email')),
    created_at_utc TEXT NOT NULL
  ) STRICT`,
  // Allow reconnect only to the same immutable owner/subject; audit in the service.
  `DROP TRIGGER platform_auth_identities_valid_update`,
  `CREATE TRIGGER platform_auth_identities_valid_update BEFORE UPDATE ON platform_auth_identities
   WHEN NEW.user_id IS NOT OLD.user_id OR NEW.auth_provider IS NOT OLD.auth_provider
   OR NEW.auth_subject IS NOT OLD.auth_subject OR NEW.linked_by_user_id IS NOT OLD.linked_by_user_id
   OR NEW.created_at_utc IS NOT OLD.created_at_utc OR NEW.updated_at_utc < OLD.updated_at_utc
   BEGIN SELECT RAISE(ABORT, 'platform_auth_identity_invalid_update'); END`,
  `CREATE INDEX platform_login_tokens_expiry ON platform_login_tokens(expires_at_utc)`,
  `CREATE TABLE platform_login_mail_outbox (
    delivery_id TEXT PRIMARY KEY,
    payload_ciphertext TEXT,
    nonce TEXT NOT NULL,
    authentication_tag TEXT NOT NULL,
    state TEXT NOT NULL CHECK(state IN ('pending','sent','expired','failed')),
    attempts INTEGER NOT NULL DEFAULT 0 CHECK(attempts BETWEEN 0 AND 5),
    next_attempt_at_utc TEXT NOT NULL,
    expires_at_utc TEXT NOT NULL,
    created_at_utc TEXT NOT NULL
  ) STRICT`,
  `CREATE INDEX platform_login_mail_due ON platform_login_mail_outbox(state,next_attempt_at_utc,created_at_utc)`,
  `CREATE TABLE platform_login_throttles (
    bucket_sha256 TEXT PRIMARY KEY CHECK(length(bucket_sha256)=64),
    window_start_utc TEXT NOT NULL,
    attempts INTEGER NOT NULL CHECK(attempts>=0)
  ) STRICT`,
]);
