export const PARTNER_ALERT_STRIPE_ONBOARDING_ATTEMPT_STATEMENTS = Object.freeze([
  `CREATE TABLE partner_alert_stripe_onboarding_attempts (
    seller_id TEXT PRIMARY KEY REFERENCES partner_alert_stripe_sellers(seller_id) ON DELETE CASCADE,
    method TEXT NOT NULL CHECK(method IN ('hosted','oauth')),
    country TEXT,
    oauth_state_sha256 TEXT UNIQUE,
    created_at_ms INTEGER NOT NULL CHECK(created_at_ms>0),
    expires_at_ms INTEGER,
    consumed_at_ms INTEGER,
    CHECK((method='hosted' AND country IS NOT NULL AND country GLOB '[A-Z][A-Z]'
      AND oauth_state_sha256 IS NULL AND expires_at_ms IS NULL AND consumed_at_ms IS NULL)
      OR (method='oauth' AND country IS NULL AND oauth_state_sha256 IS NOT NULL
      AND length(oauth_state_sha256)=64 AND oauth_state_sha256 NOT GLOB '*[^0-9a-f]*'
      AND expires_at_ms IS NOT NULL AND expires_at_ms>created_at_ms
      AND (consumed_at_ms IS NULL OR consumed_at_ms BETWEEN created_at_ms AND expires_at_ms-1)))
  ) STRICT`,
  `CREATE TRIGGER partner_alert_stripe_onboarding_pending_seller
    BEFORE INSERT ON partner_alert_stripe_onboarding_attempts
    WHEN NOT EXISTS (SELECT 1 FROM partner_alert_stripe_sellers s WHERE s.seller_id=NEW.seller_id
      AND s.state='creating' AND s.stripe_account_id IS NULL AND s.owner_user_id IS NOT NULL)
    BEGIN SELECT RAISE(ABORT,'partner_stripe_onboarding_seller_unavailable'); END`,
  `CREATE TRIGGER partner_alert_stripe_onboarding_attempt_binding
    BEFORE UPDATE ON partner_alert_stripe_onboarding_attempts
    WHEN NEW.seller_id IS NOT OLD.seller_id OR NEW.method IS NOT OLD.method
    BEGIN SELECT RAISE(ABORT,'partner_stripe_onboarding_attempt_binding'); END`,
  `CREATE TRIGGER partner_alert_stripe_onboarding_clear_completed
    AFTER UPDATE OF state ON partner_alert_stripe_sellers
    WHEN NEW.state!='creating'
    BEGIN DELETE FROM partner_alert_stripe_onboarding_attempts WHERE seller_id=NEW.seller_id; END`,
]);
