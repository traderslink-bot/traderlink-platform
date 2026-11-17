import type { PlatformMigration } from "../platform-migration-contract";

export const platformPaidStripeReauthorizationMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "platform",
  migrationId: "0211_platform_paid_stripe_reauthorization",
  executionOrder: 288,
  statements: Object.freeze([
    `CREATE TABLE partner_alert_stripe_authorizations (
      seller_id TEXT NOT NULL REFERENCES partner_alert_stripe_sellers(seller_id) ON DELETE RESTRICT,
      generation INTEGER NOT NULL CHECK(generation>0),
      authorized_at_ms INTEGER NOT NULL CHECK(authorized_at_ms>0),
      disconnected_at_ms INTEGER CHECK(disconnected_at_ms>=authorized_at_ms),
      PRIMARY KEY(seller_id,generation)
    ) STRICT`,
    `INSERT INTO partner_alert_stripe_authorizations
      SELECT seller_id,1,created_at_ms,CASE WHEN state='disconnected' THEN updated_at_ms END
      FROM partner_alert_stripe_sellers WHERE stripe_account_id IS NOT NULL`,
    `CREATE UNIQUE INDEX partner_alert_stripe_open_authorization ON partner_alert_stripe_authorizations(seller_id)
      WHERE disconnected_at_ms IS NULL`,
    `CREATE TRIGGER partner_alert_stripe_seller_initial_authorization AFTER INSERT ON partner_alert_stripe_sellers
      WHEN NEW.stripe_account_id IS NOT NULL
      BEGIN INSERT INTO partner_alert_stripe_authorizations VALUES(NEW.seller_id,1,NEW.created_at_ms,
        CASE WHEN NEW.state='disconnected' THEN NEW.updated_at_ms END); END`,
    `CREATE TRIGGER partner_alert_stripe_seller_bound_authorization AFTER UPDATE OF stripe_account_id ON partner_alert_stripe_sellers
      WHEN OLD.stripe_account_id IS NULL AND NEW.stripe_account_id IS NOT NULL
      BEGIN INSERT INTO partner_alert_stripe_authorizations VALUES(NEW.seller_id,1,NEW.updated_at_ms,NULL); END`,
    `CREATE TRIGGER partner_alert_stripe_seller_close_authorization AFTER UPDATE OF state ON partner_alert_stripe_sellers
      WHEN NEW.state='disconnected' AND OLD.state!='disconnected'
      BEGIN UPDATE partner_alert_stripe_authorizations SET disconnected_at_ms=max(NEW.updated_at_ms,authorized_at_ms)
        WHERE seller_id=NEW.seller_id AND disconnected_at_ms IS NULL; END`,
    `CREATE TRIGGER partner_alert_stripe_authorization_sequence BEFORE INSERT ON partner_alert_stripe_authorizations
      WHEN NEW.generation>1 AND NOT EXISTS (
        SELECT 1 FROM partner_alert_stripe_sellers s
        JOIN traderlink_communities c ON c.community_id=s.community_id AND c.owner_user_id=s.owner_user_id
        JOIN partner_alert_stripe_authorizations a ON a.seller_id=s.seller_id
        WHERE s.seller_id=NEW.seller_id AND s.state='disconnected' AND s.stripe_account_id IS NOT NULL
          AND c.status!='removed' AND NEW.disconnected_at_ms IS NULL AND NEW.authorized_at_ms>s.updated_at_ms
          AND a.generation=NEW.generation-1 AND a.disconnected_at_ms<NEW.authorized_at_ms
          AND NOT EXISTS (SELECT 1 FROM partner_alert_stripe_authorizations later
            WHERE later.seller_id=a.seller_id AND later.generation>a.generation)
      ) BEGIN SELECT RAISE(ABORT,'partner_stripe_reauthorization_scope'); END`,
    `CREATE TRIGGER partner_alert_stripe_authorization_immutable BEFORE UPDATE ON partner_alert_stripe_authorizations
      WHEN NEW.seller_id IS NOT OLD.seller_id OR NEW.generation IS NOT OLD.generation
        OR NEW.authorized_at_ms IS NOT OLD.authorized_at_ms OR OLD.disconnected_at_ms IS NOT NULL
        OR NEW.disconnected_at_ms IS NULL OR NOT EXISTS (SELECT 1 FROM partner_alert_stripe_sellers s
          WHERE s.seller_id=OLD.seller_id AND s.state='disconnected')
      BEGIN SELECT RAISE(ABORT,'partner_stripe_authorization_immutable'); END`,
    "DROP TRIGGER partner_alert_stripe_seller_scope_immutable",
    `CREATE TRIGGER partner_alert_stripe_seller_scope_immutable BEFORE UPDATE ON partner_alert_stripe_sellers
      WHEN NEW.seller_id IS NOT OLD.seller_id OR NEW.community_id IS NOT OLD.community_id
        OR (NEW.owner_user_id IS NOT OLD.owner_user_id AND NOT (
          OLD.owner_user_id IS NOT NULL AND NEW.owner_user_id IS NULL
          AND NEW.owner_erased_at_ms IS NOT NULL AND NEW.state='disconnected'))
        OR (OLD.owner_erased_at_ms IS NOT NULL AND NEW.owner_erased_at_ms IS NOT OLD.owner_erased_at_ms)
        OR NEW.environment IS NOT OLD.environment
        OR (OLD.stripe_account_id IS NOT NULL AND NEW.stripe_account_id IS NOT OLD.stripe_account_id)
        OR (OLD.state='disconnected' AND NEW.state!='disconnected' AND NOT EXISTS (
          SELECT 1 FROM partner_alert_stripe_authorizations a
          WHERE a.seller_id=OLD.seller_id AND a.generation>1 AND a.disconnected_at_ms IS NULL
            AND a.authorized_at_ms=NEW.updated_at_ms AND a.authorized_at_ms>OLD.updated_at_ms))
      BEGIN SELECT RAISE(ABORT,'partner_stripe_seller_scope_immutable'); END`,
    `ALTER TABLE partner_alert_stripe_checkout_claims ADD COLUMN authorization_generation INTEGER NOT NULL DEFAULT 1
      CHECK(authorization_generation>0)`,
    "DROP INDEX partner_alert_stripe_current_checkout",
    `CREATE UNIQUE INDEX partner_alert_stripe_current_checkout ON partner_alert_stripe_checkout_claims
      (buyer_user_id,seller_id,offer_id,offer_version,authorization_generation) WHERE checkout_closed_at_ms IS NULL`,
    `CREATE TRIGGER partner_alert_stripe_checkout_authorization BEFORE INSERT ON partner_alert_stripe_checkout_claims
      WHEN NOT EXISTS (SELECT 1 FROM partner_alert_stripe_authorizations a
        WHERE a.seller_id=NEW.seller_id AND a.generation=NEW.authorization_generation AND a.disconnected_at_ms IS NULL)
      BEGIN SELECT RAISE(ABORT,'partner_stripe_checkout_authorization'); END`,
    `CREATE TRIGGER partner_alert_stripe_checkout_generation_immutable BEFORE UPDATE OF authorization_generation
      ON partner_alert_stripe_checkout_claims WHEN NEW.authorization_generation IS NOT OLD.authorization_generation
      BEGIN SELECT RAISE(ABORT,'partner_stripe_checkout_generation_immutable'); END`,
    `CREATE TRIGGER partner_alert_stripe_paid_term_authorization BEFORE INSERT ON partner_alert_stripe_paid_terms
      WHEN NOT EXISTS (SELECT 1 FROM partner_alert_stripe_checkout_claims c
        JOIN partner_alert_stripe_authorizations a ON a.seller_id=c.seller_id AND a.generation=c.authorization_generation
        JOIN partner_alert_stripe_sellers s ON s.seller_id=c.seller_id
        WHERE c.claim_id=NEW.claim_id AND a.disconnected_at_ms IS NULL AND s.state!='disconnected')
      BEGIN SELECT RAISE(ABORT,'partner_stripe_paid_term_authorization'); END`,
  ]),
});
