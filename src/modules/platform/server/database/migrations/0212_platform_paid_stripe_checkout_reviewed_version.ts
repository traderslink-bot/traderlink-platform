import type { PlatformMigration } from "../platform-migration-contract";

export const platformPaidStripeCheckoutReviewedVersionMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "platform",
  migrationId: "0212_platform_paid_stripe_checkout_reviewed_version",
  executionOrder: 289,
  statements: Object.freeze([
    "DROP TRIGGER partner_alert_stripe_checkout_ready",
    `CREATE TRIGGER partner_alert_stripe_checkout_ready BEFORE INSERT ON partner_alert_stripe_checkout_claims
      WHEN NOT EXISTS (SELECT 1 FROM partner_alert_stripe_sellers s JOIN traderlink_communities c ON c.community_id=s.community_id
        JOIN partner_alert_stripe_prices p ON p.seller_id=s.seller_id AND p.offer_id=NEW.offer_id AND p.offer_version=NEW.offer_version
        JOIN partner_alert_offers o ON o.community_id=p.community_id AND o.offer_id=p.offer_id AND o.version=p.offer_version
        JOIN partner_alert_partners partner ON partner.community_id=o.community_id
        WHERE s.seller_id=NEW.seller_id AND s.state='ready' AND s.owner_user_id=c.owner_user_id
          AND c.status!='removed' AND p.withdrawn_at_ms IS NULL AND partner.status='active' AND o.review_state='approved'
          AND o.version=(SELECT max(v.version) FROM partner_alert_offers v WHERE v.community_id=o.community_id AND v.offer_id=o.offer_id
            AND v.review_state IN ('approved','withdrawn')))
      BEGIN SELECT RAISE(ABORT,'partner_stripe_checkout_unavailable'); END`,
  ]),
});
