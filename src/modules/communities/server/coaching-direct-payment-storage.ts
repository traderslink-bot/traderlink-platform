/** Pending migration integration. Never executed during ordinary application startup. */
export const coachingDirectPaymentStatements = Object.freeze([
  `CREATE TABLE traderlink_coaching_commission_entries (
    environment TEXT NOT NULL CHECK(environment IN ('sandbox','live')),platform_account_id TEXT NOT NULL,entry_id TEXT NOT NULL,
    payment_id TEXT NOT NULL,currency TEXT NOT NULL,amount_minor INTEGER NOT NULL,kind TEXT NOT NULL CHECK(kind IN ('credit','reversal')),
    observed_at_utc TEXT NOT NULL,PRIMARY KEY(environment,platform_account_id,entry_id)
  ) STRICT;`,
  `CREATE TABLE traderlink_coaching_commission_checks (
    check_id INTEGER PRIMARY KEY,purchase_id TEXT NOT NULL REFERENCES traderlink_coaching_direct_purchases(purchase_id),payment_id TEXT NOT NULL,platform_account_id TEXT NOT NULL,
    result_json TEXT NOT NULL CHECK(json_valid(result_json)),checked_at_utc TEXT NOT NULL
  ) STRICT;`,
  `CREATE INDEX traderlink_coaching_commission_payment_entries ON traderlink_coaching_commission_entries(environment,platform_account_id,payment_id);`,
  `CREATE TABLE traderlink_coaching_recurring_memberships (
    environment TEXT NOT NULL,merchant_account_id TEXT NOT NULL,membership_id TEXT NOT NULL,
    origin_purchase_id TEXT NOT NULL UNIQUE REFERENCES traderlink_coaching_direct_purchases(purchase_id),recorded_at_utc TEXT NOT NULL,
    PRIMARY KEY(environment,merchant_account_id,membership_id)
  ) STRICT;`,
  `CREATE TABLE traderlink_coaching_paid_billing_cycles (
    environment TEXT NOT NULL,merchant_account_id TEXT NOT NULL,membership_id TEXT NOT NULL,period_start_utc TEXT NOT NULL,period_end_utc TEXT NOT NULL,
    invoice_payment_id TEXT NOT NULL,purchase_id TEXT NOT NULL UNIQUE REFERENCES traderlink_coaching_direct_purchases(purchase_id),
    PRIMARY KEY(environment,merchant_account_id,membership_id,period_start_utc),UNIQUE(environment,merchant_account_id,invoice_payment_id)
  ) STRICT;`,
  `CREATE TABLE traderlink_coaching_whop_identities (
    environment TEXT NOT NULL CHECK(environment IN ('sandbox','live')),
    user_id TEXT NOT NULL REFERENCES platform_users(user_id),provider_user_ref_hmac TEXT NOT NULL,
    linked_at_utc TEXT NOT NULL,PRIMARY KEY(environment,user_id),UNIQUE(environment,provider_user_ref_hmac)
  ) STRICT;`,
  `CREATE TABLE traderlink_coaching_merchant_connections (
    environment TEXT NOT NULL CHECK(environment IN ('sandbox','live')),
    coach_user_id TEXT NOT NULL REFERENCES platform_users(user_id),platform_account_id TEXT NOT NULL,
    merchant_account_id TEXT NOT NULL,owner_ref_hmac TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('pending','verified','disconnected')),
    verified_at_utc TEXT NOT NULL,PRIMARY KEY(environment,coach_user_id),UNIQUE(environment,merchant_account_id)
  ) STRICT;`,
  `CREATE TABLE traderlink_coaching_provider_offers (
    environment TEXT NOT NULL,agreement_id TEXT NOT NULL,merchant_account_id TEXT NOT NULL,
    product_id TEXT NOT NULL,variant_id TEXT NOT NULL,billing_json TEXT NOT NULL CHECK(json_valid(billing_json)),
    created_at_utc TEXT NOT NULL,PRIMARY KEY(environment,agreement_id,merchant_account_id),UNIQUE(environment,merchant_account_id,variant_id)
  ) STRICT;`,
  `CREATE TABLE traderlink_coaching_direct_purchases (
    purchase_id TEXT PRIMARY KEY,
    environment TEXT NOT NULL CHECK(environment IN ('sandbox','live')),
    coach_user_id TEXT NOT NULL REFERENCES platform_users(user_id),
    student_user_id TEXT NOT NULL REFERENCES platform_users(user_id),
    merchant_account_id TEXT NOT NULL,
    agreement_id TEXT NOT NULL,
    agreement_revision INTEGER NOT NULL CHECK(agreement_revision>0),
    snapshot_json TEXT NOT NULL CHECK(json_valid(snapshot_json)),
    created_at_utc TEXT NOT NULL,
    UNIQUE(purchase_id,environment,merchant_account_id)
  ) STRICT;`,
  `CREATE TABLE traderlink_coaching_direct_checkouts (
    purchase_id TEXT PRIMARY KEY REFERENCES traderlink_coaching_direct_purchases(purchase_id),
    environment TEXT NOT NULL,
    merchant_account_id TEXT NOT NULL,
    checkout_id TEXT NOT NULL,
    purchase_url TEXT NOT NULL,
    recorded_at_utc TEXT NOT NULL,
    UNIQUE(environment,merchant_account_id,checkout_id),
    FOREIGN KEY(purchase_id,environment,merchant_account_id)
      REFERENCES traderlink_coaching_direct_purchases(purchase_id,environment,merchant_account_id)
  ) STRICT;`,
  `CREATE TABLE traderlink_coaching_direct_payment_receipts (
    environment TEXT NOT NULL CHECK(environment IN ('sandbox','live')),
    merchant_account_id TEXT NOT NULL,
    receipt_id TEXT NOT NULL,
    payload_sha256 TEXT NOT NULL CHECK(length(payload_sha256)=64),
    source TEXT NOT NULL CHECK(source IN ('provider_event','reconciliation')),
    observed_at_utc TEXT NOT NULL,
    PRIMARY KEY(environment,merchant_account_id,source,receipt_id)
  ) STRICT;`,
  `CREATE TABLE traderlink_coaching_direct_payment_inbox (
    environment TEXT NOT NULL CHECK(environment IN ('sandbox','live')),
    merchant_account_id TEXT NOT NULL,
    event_id TEXT NOT NULL,
    payload_sha256 TEXT NOT NULL CHECK(length(payload_sha256)=64),
    routing_json TEXT NOT NULL CHECK(json_valid(routing_json)),
    received_at_utc TEXT NOT NULL,
    available_at_utc TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('pending','processing','completed','failed')),
    attempts INTEGER NOT NULL DEFAULT 0 CHECK(attempts>=0),
    lease_token TEXT,
    lease_until_utc TEXT,
    last_error_code TEXT,
    PRIMARY KEY(environment,merchant_account_id,event_id),
    CHECK((status='processing' AND lease_token IS NOT NULL AND lease_until_utc IS NOT NULL)
      OR (status!='processing' AND lease_token IS NULL AND lease_until_utc IS NULL))
  ) STRICT;`,
  `CREATE TABLE traderlink_coaching_direct_payment_bindings (
    environment TEXT NOT NULL,
    merchant_account_id TEXT NOT NULL,
    payment_id TEXT NOT NULL,
    purchase_id TEXT NOT NULL,
    PRIMARY KEY(environment,merchant_account_id,payment_id),
    FOREIGN KEY(purchase_id,environment,merchant_account_id)
      REFERENCES traderlink_coaching_direct_purchases(purchase_id,environment,merchant_account_id)
  ) STRICT;`,
  `CREATE TABLE traderlink_coaching_direct_payment_observations (
    observation_id INTEGER PRIMARY KEY,
    environment TEXT NOT NULL,
    merchant_account_id TEXT NOT NULL,
    receipt_id TEXT NOT NULL,
    source TEXT NOT NULL CHECK(source IN ('provider_event','reconciliation')),
    payment_id TEXT NOT NULL,
    purchase_id TEXT NOT NULL,
    state TEXT NOT NULL CHECK(state IN ('unpaid','paid','partially_refunded','refunded','disputed','reversed')),
    evidence_json TEXT NOT NULL CHECK(json_valid(evidence_json)),
    observed_at_utc TEXT NOT NULL,
    UNIQUE(environment,merchant_account_id,source,receipt_id),
    FOREIGN KEY(environment,merchant_account_id,source,receipt_id)
      REFERENCES traderlink_coaching_direct_payment_receipts(environment,merchant_account_id,source,receipt_id),
    FOREIGN KEY(environment,merchant_account_id,payment_id)
      REFERENCES traderlink_coaching_direct_payment_bindings(environment,merchant_account_id,payment_id),
    FOREIGN KEY(purchase_id,environment,merchant_account_id)
      REFERENCES traderlink_coaching_direct_purchases(purchase_id,environment,merchant_account_id)
  ) STRICT;`,
  `CREATE TABLE traderlink_coaching_direct_purchase_funding (
    purchase_id TEXT PRIMARY KEY REFERENCES traderlink_coaching_direct_purchases(purchase_id),
    environment TEXT NOT NULL,
    merchant_account_id TEXT NOT NULL,
    payment_id TEXT NOT NULL,
    recorded_at_utc TEXT NOT NULL,
    UNIQUE(environment,merchant_account_id,payment_id),
    FOREIGN KEY(environment,merchant_account_id,payment_id)
      REFERENCES traderlink_coaching_direct_payment_bindings(environment,merchant_account_id,payment_id)
  ) STRICT;`,
  `CREATE TABLE traderlink_coaching_direct_service_usage (
    purchase_id TEXT NOT NULL REFERENCES traderlink_coaching_direct_purchase_funding(purchase_id),
    plan_item_id TEXT NOT NULL,
    occurrence_index INTEGER NOT NULL CHECK(occurrence_index>=0),
    work_id TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL CHECK(status IN ('reserved','completed')),
    reserved_at_utc TEXT NOT NULL,
    completed_at_utc TEXT,
    PRIMARY KEY(purchase_id,plan_item_id,occurrence_index),
    CHECK((status='reserved' AND completed_at_utc IS NULL) OR
      (status='completed' AND completed_at_utc IS NOT NULL))
  ) STRICT;`,
  `CREATE INDEX traderlink_coaching_direct_payment_observations_purchase
    ON traderlink_coaching_direct_payment_observations(purchase_id,observed_at_utc,observation_id);`,
  `CREATE TABLE traderlink_coaching_provider_resource_observations (
    environment TEXT NOT NULL CHECK(environment IN ('sandbox','live')),merchant_account_id TEXT NOT NULL,
    resource_kind TEXT NOT NULL CHECK(resource_kind IN ('membership','account')),resource_id TEXT NOT NULL,
    receipt_id TEXT NOT NULL,facts_json TEXT NOT NULL CHECK(json_valid(facts_json)),observed_at_utc TEXT NOT NULL,
    PRIMARY KEY(environment,receipt_id)
  ) STRICT;`,
  `CREATE TABLE traderlink_coaching_payment_quote_observations (
    environment TEXT NOT NULL CHECK(environment IN ('sandbox','live')),purchase_id TEXT NOT NULL REFERENCES traderlink_coaching_direct_purchases(purchase_id),
    payment_id TEXT NOT NULL,receipt_id TEXT NOT NULL,quote_json TEXT NOT NULL CHECK(json_valid(quote_json)),observed_at_utc TEXT NOT NULL,
    PRIMARY KEY(environment,receipt_id)
  ) STRICT;`,
]);
