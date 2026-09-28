import type { PlatformMigration } from "../platform-migration-contract";

const sql = `CREATE TABLE platform_membership_feature_definitions (
  feature_key TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  module_key TEXT NOT NULL,
  feature_kind TEXT NOT NULL CHECK(feature_kind IN ('boolean','limit')),
  enforcement_state TEXT NOT NULL CHECK(enforcement_state IN ('planned','ready','paused')),
  owner_selectable INTEGER NOT NULL CHECK(owner_selectable IN (0,1)),
  created_by_user_id TEXT REFERENCES platform_users(user_id),
  created_at_utc TEXT NOT NULL,
  updated_at_utc TEXT NOT NULL
) STRICT;

CREATE TABLE platform_membership_plans (
  plan_id TEXT PRIMARY KEY,
  plan_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  internal_note TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL CHECK(status IN ('draft','active','retired')),
  visibility TEXT NOT NULL CHECK(visibility IN ('public','private','unlisted')),
  display_order INTEGER NOT NULL DEFAULT 0,
  created_by_user_id TEXT NOT NULL REFERENCES platform_users(user_id),
  created_at_utc TEXT NOT NULL,
  updated_at_utc TEXT NOT NULL
) STRICT;

CREATE TABLE platform_membership_provider_definitions (
  provider_key TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  integration_mode TEXT NOT NULL CHECK(integration_mode IN ('native','external_checkout','manual','free')),
  configuration_state TEXT NOT NULL CHECK(configuration_state IN ('unconfigured','test','ready','paused')),
  created_by_user_id TEXT REFERENCES platform_users(user_id),
  created_at_utc TEXT NOT NULL,
  updated_at_utc TEXT NOT NULL
) STRICT;

CREATE TABLE platform_membership_plan_versions (
  plan_version_id TEXT PRIMARY KEY,
  plan_id TEXT NOT NULL REFERENCES platform_membership_plans(plan_id),
  version_number INTEGER NOT NULL CHECK(version_number > 0),
  public_description TEXT NOT NULL DEFAULT '',
  lifecycle_state TEXT NOT NULL CHECK(lifecycle_state IN ('draft','published','retired')),
  published_at_utc TEXT,
  retired_at_utc TEXT,
  created_by_user_id TEXT NOT NULL REFERENCES platform_users(user_id),
  created_at_utc TEXT NOT NULL,
  UNIQUE(plan_id, version_number),
  CHECK((lifecycle_state='draft' AND published_at_utc IS NULL) OR
        (lifecycle_state<>'draft' AND published_at_utc IS NOT NULL))
) STRICT;

CREATE TABLE platform_membership_plan_features (
  plan_version_id TEXT NOT NULL REFERENCES platform_membership_plan_versions(plan_version_id),
  feature_key TEXT NOT NULL REFERENCES platform_membership_feature_definitions(feature_key),
  feature_kind TEXT NOT NULL CHECK(feature_kind IN ('boolean','limit')),
  limit_value INTEGER CHECK(limit_value IS NULL OR limit_value >= 0),
  PRIMARY KEY(plan_version_id, feature_key),
  CHECK(feature_kind='limit' OR limit_value IS NULL)
) STRICT;

CREATE TABLE platform_membership_offers (
  offer_id TEXT PRIMARY KEY,
  plan_version_id TEXT NOT NULL REFERENCES platform_membership_plan_versions(plan_version_id),
  name TEXT NOT NULL,
  provider TEXT NOT NULL REFERENCES platform_membership_provider_definitions(provider_key),
  channel TEXT NOT NULL CHECK(channel IN ('website','discord','both','private')),
  billing_kind TEXT NOT NULL CHECK(billing_kind IN ('free','one_time','recurring','lifetime')),
  currency TEXT,
  initial_amount_minor INTEGER,
  renewal_amount_minor INTEGER,
  billing_period_days INTEGER,
  external_product_ref TEXT,
  external_price_ref TEXT,
  external_checkout_url TEXT,
  status TEXT NOT NULL CHECK(status IN ('draft','active','paused','retired')),
  created_at_utc TEXT NOT NULL,
  updated_at_utc TEXT NOT NULL,
  billing_interval TEXT CHECK(billing_interval IN ('day','week','month','year')),
  billing_interval_count INTEGER CHECK(billing_interval_count > 0),
  access_duration_days INTEGER CHECK(access_duration_days > 0),
  CHECK((provider='free' AND currency IS NULL AND initial_amount_minor IS NULL AND renewal_amount_minor IS NULL) OR provider<>'free'),
  CHECK(currency IS NULL OR (length(currency)=3 AND currency=upper(currency))),
  CHECK(initial_amount_minor IS NULL OR initial_amount_minor >= 0),
  CHECK(renewal_amount_minor IS NULL OR renewal_amount_minor >= 0),
  CHECK(billing_period_days IS NULL OR billing_period_days > 0)
) STRICT;

CREATE TABLE platform_membership_trial_campaigns (
  trial_campaign_id TEXT PRIMARY KEY,
  offer_id TEXT NOT NULL REFERENCES platform_membership_offers(offer_id),
  name TEXT NOT NULL,
  duration_days INTEGER NOT NULL CHECK(duration_days > 0),
  entry_amount_minor INTEGER CHECK(entry_amount_minor IS NULL OR entry_amount_minor >= 0),
  payment_method_required INTEGER NOT NULL CHECK(payment_method_required IN (0,1)),
  eligibility_mode TEXT NOT NULL CHECK(eligibility_mode IN ('once_per_campaign','once_ever','unlimited','owner_only')),
  enrollment_starts_at_utc TEXT,
  enrollment_ends_at_utc TEXT,
  capacity INTEGER CHECK(capacity IS NULL OR capacity > 0),
  status TEXT NOT NULL CHECK(status IN ('draft','active','paused','retired')),
  created_at_utc TEXT NOT NULL,
  updated_at_utc TEXT NOT NULL
) STRICT;

CREATE TABLE platform_membership_provider_subscriptions (
  provider_subscription_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES platform_users(user_id),
  offer_id TEXT NOT NULL REFERENCES platform_membership_offers(offer_id),
  provider TEXT NOT NULL REFERENCES platform_membership_provider_definitions(provider_key),
  external_customer_ref TEXT,
  external_subscription_ref TEXT NOT NULL,
  lifecycle_state TEXT NOT NULL CHECK(lifecycle_state IN ('pending','trialing','active','past_due','cancel_at_period_end','inactive','refunded','disputed','conflict')),
  current_period_start_utc TEXT,
  current_period_end_utc TEXT,
  cancel_at_period_end INTEGER NOT NULL CHECK(cancel_at_period_end IN (0,1)),
  last_provider_event_at_utc TEXT,
  created_at_utc TEXT NOT NULL,
  updated_at_utc TEXT NOT NULL,
  UNIQUE(provider, external_subscription_ref)
) STRICT;

CREATE TABLE platform_membership_entitlements (
  entitlement_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES platform_users(user_id),
  plan_version_id TEXT NOT NULL REFERENCES platform_membership_plan_versions(plan_version_id),
  source_type TEXT NOT NULL CHECK(source_type IN ('subscription','free_plan','trial','discord','owner_grant','lifetime_purchase','migration')),
  source_ref TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('pending','active','scheduled','expired','revoked','conflict')),
  starts_at_utc TEXT NOT NULL,
  ends_at_utc TEXT,
  granted_by_user_id TEXT REFERENCES platform_users(user_id),
  reason TEXT NOT NULL DEFAULT '',
  created_at_utc TEXT NOT NULL,
  updated_at_utc TEXT NOT NULL,
  UNIQUE(user_id, source_type, source_ref),
  CHECK(ends_at_utc IS NULL OR ends_at_utc > starts_at_utc)
) STRICT;

CREATE INDEX platform_membership_entitlements_effective
ON platform_membership_entitlements(user_id,status,starts_at_utc,ends_at_utc);

CREATE TABLE platform_membership_discord_offer_rules (
  discord_offer_rule_id TEXT PRIMARY KEY,
  offer_id TEXT NOT NULL REFERENCES platform_membership_offers(offer_id),
  discord_guild_id TEXT NOT NULL,
  discord_role_ids_json TEXT NOT NULL DEFAULT '[]' CHECK(json_valid(discord_role_ids_json)),
  access_mode TEXT NOT NULL CHECK(access_mode IN ('automatic_grant','eligible_to_purchase')),
  funding_mode TEXT NOT NULL CHECK(funding_mode IN ('sponsored','server_license','member_paid')),
  seat_limit INTEGER CHECK(seat_limit IS NULL OR seat_limit > 0),
  membership_max_age_seconds INTEGER NOT NULL CHECK(membership_max_age_seconds > 0),
  starts_at_utc TEXT,
  ends_at_utc TEXT,
  status TEXT NOT NULL CHECK(status IN ('draft','active','paused','retired')),
  created_at_utc TEXT NOT NULL,
  updated_at_utc TEXT NOT NULL
) STRICT;

CREATE TABLE platform_membership_provider_event_receipts (
  provider TEXT NOT NULL,
  external_event_ref_hash TEXT NOT NULL,
  payload_sha256 TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_at_utc TEXT NOT NULL,
  processing_result TEXT NOT NULL CHECK(processing_result IN ('applied','duplicate','stale','ignored','conflict','failed')),
  processed_at_utc TEXT NOT NULL,
  PRIMARY KEY(provider, external_event_ref_hash)
) STRICT;

CREATE TABLE platform_membership_share_links (
  share_link_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  secret_sha256 TEXT NOT NULL UNIQUE,
  audience_note TEXT NOT NULL DEFAULT '',
  expires_at_utc TEXT,
  maximum_claims INTEGER CHECK(maximum_claims IS NULL OR maximum_claims > 0),
  claim_count INTEGER NOT NULL DEFAULT 0 CHECK(claim_count >= 0),
  status TEXT NOT NULL CHECK(status IN ('active','paused','revoked','expired')),
  created_by_user_id TEXT NOT NULL REFERENCES platform_users(user_id),
  created_at_utc TEXT NOT NULL,
  updated_at_utc TEXT NOT NULL,
  CHECK(maximum_claims IS NULL OR claim_count <= maximum_claims)
) STRICT;

CREATE TABLE platform_membership_share_link_offers (
  share_link_id TEXT NOT NULL REFERENCES platform_membership_share_links(share_link_id),
  offer_id TEXT NOT NULL REFERENCES platform_membership_offers(offer_id),
  display_order INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY(share_link_id, offer_id)
) STRICT;

CREATE TABLE platform_membership_audit_events (
  audit_event_id TEXT PRIMARY KEY,
  actor_user_id TEXT REFERENCES platform_users(user_id),
  subject_user_id TEXT REFERENCES platform_users(user_id),
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  safe_details_json TEXT NOT NULL DEFAULT '{}' CHECK(json_valid(safe_details_json)),
  occurred_at_utc TEXT NOT NULL
) STRICT;

CREATE INDEX platform_membership_audit_target
ON platform_membership_audit_events(target_type,target_id,occurred_at_utc DESC);

CREATE TABLE platform_membership_claims (
  claim_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES platform_users(user_id),
  offer_id TEXT NOT NULL REFERENCES platform_membership_offers(offer_id),
  share_link_id TEXT REFERENCES platform_membership_share_links(share_link_id),
  trial_campaign_id TEXT REFERENCES platform_membership_trial_campaigns(trial_campaign_id),
  state TEXT NOT NULL CHECK(state IN ('reserved','fulfilled','released')),
  external_session_ref TEXT,
  created_at_utc TEXT NOT NULL,
  expires_at_utc TEXT NOT NULL,
  fulfilled_at_utc TEXT
) STRICT;

CREATE INDEX platform_membership_claims_user
ON platform_membership_claims(user_id,offer_id,state);

CREATE TABLE platform_membership_version_changes (
  entitlement_id TEXT PRIMARY KEY REFERENCES platform_membership_entitlements(entitlement_id),
  target_plan_version_id TEXT NOT NULL REFERENCES platform_membership_plan_versions(plan_version_id),
  requested_by_user_id TEXT NOT NULL REFERENCES platform_users(user_id),
  requested_at_utc TEXT NOT NULL,
  renewal_after_utc TEXT NOT NULL,
  applied_at_utc TEXT
) STRICT;

CREATE TABLE platform_membership_recurring_grants (
  entitlement_id TEXT PRIMARY KEY REFERENCES platform_membership_entitlements(entitlement_id),
  interval_unit TEXT NOT NULL CHECK(interval_unit IN ('day','week','month','year')),
  interval_count INTEGER NOT NULL CHECK(interval_count > 0)
) STRICT;

CREATE TABLE platform_membership_feature_policies (
  feature_key TEXT PRIMARY KEY REFERENCES platform_membership_feature_definitions(feature_key),
  enforcement_mode TEXT NOT NULL CHECK(enforcement_mode IN ('off','shadow','enforced')),
  updated_by_user_id TEXT NOT NULL REFERENCES platform_users(user_id),
  updated_at_utc TEXT NOT NULL
) STRICT;

CREATE TABLE platform_membership_trial_checkouts (
  trial_campaign_id TEXT PRIMARY KEY REFERENCES platform_membership_trial_campaigns(trial_campaign_id),
  external_checkout_url TEXT NOT NULL,
  updated_by_user_id TEXT NOT NULL REFERENCES platform_users(user_id),
  updated_at_utc TEXT NOT NULL
) STRICT;`;

export const platformMembershipPlatformMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "platform",
  migrationId: "0148_platform_membership_platform",
  executionOrder: 148,
  statements: Object.freeze([sql]),
});
