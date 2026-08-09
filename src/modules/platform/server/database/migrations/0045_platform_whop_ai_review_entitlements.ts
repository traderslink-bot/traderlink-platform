import type { PlatformMigration } from "../platform-migration-contract";

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

function sha256Check(column: string): string {
  return `CHECK (
    length(${column}) = 64 AND ${column} = lower(${column})
    AND ${column} NOT GLOB '*[^0-9a-f]*'
  )`;
}

function nullableSha256Check(column: string): string {
  return `CHECK (
    ${column} IS NULL OR (
      length(${column}) = 64 AND ${column} = lower(${column})
      AND ${column} NOT GLOB '*[^0-9a-f]*'
    )
  )`;
}

function utcCheck(column: string, nullable = false): string {
  const value = `length(${column}) = 24
      AND ${column} GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9].[0-9][0-9][0-9]Z'`;
  return `CHECK (${nullable ? `${column} IS NULL OR (` : "("}${value}${nullable ? ")" : ")"})`;
}

const sql = `CREATE TABLE platform_whop_user_links (
  link_id TEXT PRIMARY KEY ${uuidCheck("link_id")},
  user_id TEXT NOT NULL ${uuidCheck("user_id")},
  whop_user_ref_hmac TEXT NOT NULL ${sha256Check("whop_user_ref_hmac")},
  link_state TEXT NOT NULL CHECK (link_state IN ('active', 'revoked', 'conflict')),
  linked_at_utc TEXT NOT NULL ${utcCheck("linked_at_utc")},
  verified_at_utc TEXT NOT NULL ${utcCheck("verified_at_utc")},
  updated_at_utc TEXT NOT NULL ${utcCheck("updated_at_utc")},
  revoked_at_utc TEXT ${utcCheck("revoked_at_utc", true)},
  CHECK (verified_at_utc >= linked_at_utc),
  CHECK (updated_at_utc >= verified_at_utc),
  CHECK (
    (link_state = 'revoked' AND revoked_at_utc IS NOT NULL)
    OR (link_state <> 'revoked' AND revoked_at_utc IS NULL)
  ),
  FOREIGN KEY (user_id) REFERENCES platform_users(user_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE UNIQUE INDEX platform_whop_user_links_one_active_user
  ON platform_whop_user_links(user_id) WHERE link_state = 'active';

CREATE UNIQUE INDEX platform_whop_user_links_one_active_whop_user
  ON platform_whop_user_links(whop_user_ref_hmac) WHERE link_state = 'active';

CREATE TABLE platform_whop_membership_projections (
  membership_ref_hmac TEXT PRIMARY KEY ${sha256Check("membership_ref_hmac")},
  whop_user_ref_hmac TEXT NOT NULL ${sha256Check("whop_user_ref_hmac")},
  company_ref_hmac TEXT NOT NULL ${sha256Check("company_ref_hmac")},
  product_ref_hmac TEXT NOT NULL ${sha256Check("product_ref_hmac")},
  feature_key TEXT NOT NULL CHECK (feature_key = 'ai_reviews'),
  membership_state TEXT NOT NULL CHECK (
    membership_state IN ('active', 'deactivated', 'conflict')
  ),
  cancel_at_period_end INTEGER NOT NULL CHECK (cancel_at_period_end IN (0, 1)),
  renewal_period_start_utc TEXT ${utcCheck("renewal_period_start_utc", true)},
  renewal_period_end_utc TEXT ${utcCheck("renewal_period_end_utc", true)},
  last_event_at_utc TEXT NOT NULL ${utcCheck("last_event_at_utc")},
  last_event_payload_sha256 TEXT NOT NULL ${sha256Check("last_event_payload_sha256")},
  last_webhook_id_sha256 TEXT NOT NULL ${sha256Check("last_webhook_id_sha256")},
  created_at_utc TEXT NOT NULL ${utcCheck("created_at_utc")},
  updated_at_utc TEXT NOT NULL ${utcCheck("updated_at_utc")},
  CHECK (
    renewal_period_start_utc IS NULL OR renewal_period_end_utc IS NULL
    OR renewal_period_end_utc > renewal_period_start_utc
  ),
  CHECK (updated_at_utc >= created_at_utc)
) STRICT;

CREATE INDEX platform_whop_membership_projections_user_state
  ON platform_whop_membership_projections(
    whop_user_ref_hmac, feature_key, membership_state, renewal_period_end_utc
  );

CREATE TABLE platform_whop_webhook_receipts (
  webhook_id_sha256 TEXT PRIMARY KEY ${sha256Check("webhook_id_sha256")},
  event_type TEXT NOT NULL CHECK (event_type IN (
    'membership.activated',
    'membership.deactivated',
    'membership.cancel_at_period_end_changed',
    'payment.failed'
  )),
  event_at_utc TEXT NOT NULL ${utcCheck("event_at_utc")},
  payload_sha256 TEXT NOT NULL ${sha256Check("payload_sha256")},
  membership_ref_hmac TEXT ${nullableSha256Check("membership_ref_hmac")},
  processing_result TEXT NOT NULL CHECK (processing_result IN (
    'applied', 'duplicate', 'stale', 'conflict', 'operational_only'
  )),
  processed_at_utc TEXT NOT NULL ${utcCheck("processed_at_utc")}
) STRICT;

CREATE INDEX platform_whop_webhook_receipts_event_time
  ON platform_whop_webhook_receipts(event_type, event_at_utc DESC);

CREATE TRIGGER platform_whop_user_links_guard_update
BEFORE UPDATE ON platform_whop_user_links
WHEN NEW.link_id IS NOT OLD.link_id
  OR NEW.user_id IS NOT OLD.user_id
  OR NEW.whop_user_ref_hmac IS NOT OLD.whop_user_ref_hmac
  OR NEW.linked_at_utc IS NOT OLD.linked_at_utc
  OR NEW.verified_at_utc < OLD.verified_at_utc
  OR NEW.updated_at_utc < OLD.updated_at_utc
  OR OLD.link_state = 'revoked'
BEGIN
  SELECT RAISE(ABORT, 'platform_whop_user_link_invalid_update');
END;

CREATE TRIGGER platform_whop_user_links_no_delete
BEFORE DELETE ON platform_whop_user_links BEGIN
  SELECT RAISE(ABORT, 'platform_whop_user_link_history_required');
END;

CREATE TRIGGER platform_whop_membership_projections_guard_update
BEFORE UPDATE ON platform_whop_membership_projections
WHEN NEW.membership_ref_hmac IS NOT OLD.membership_ref_hmac
  OR NEW.whop_user_ref_hmac IS NOT OLD.whop_user_ref_hmac
  OR NEW.company_ref_hmac IS NOT OLD.company_ref_hmac
  OR NEW.product_ref_hmac IS NOT OLD.product_ref_hmac
  OR NEW.feature_key IS NOT OLD.feature_key
  OR NEW.created_at_utc IS NOT OLD.created_at_utc
  OR NEW.last_event_at_utc < OLD.last_event_at_utc
  OR NEW.updated_at_utc < OLD.updated_at_utc
  OR OLD.membership_state = 'conflict'
BEGIN
  SELECT RAISE(ABORT, 'platform_whop_membership_projection_invalid_update');
END;

CREATE TRIGGER platform_whop_membership_projections_no_delete
BEFORE DELETE ON platform_whop_membership_projections BEGIN
  SELECT RAISE(ABORT, 'platform_whop_membership_projection_history_required');
END;

CREATE TRIGGER platform_whop_webhook_receipts_no_update
BEFORE UPDATE ON platform_whop_webhook_receipts BEGIN
  SELECT RAISE(ABORT, 'platform_whop_webhook_receipt_immutable');
END;

CREATE TRIGGER platform_whop_webhook_receipts_no_delete
BEFORE DELETE ON platform_whop_webhook_receipts BEGIN
  SELECT RAISE(ABORT, 'platform_whop_webhook_receipt_immutable');
END;`;

export const platformWhopAiReviewEntitlementsMigration: PlatformMigration =
  Object.freeze({
    moduleNamespace: "platform",
    migrationId: "0045_platform_whop_ai_review_entitlements",
    executionOrder: 45,
    statements: Object.freeze([sql]),
  });
