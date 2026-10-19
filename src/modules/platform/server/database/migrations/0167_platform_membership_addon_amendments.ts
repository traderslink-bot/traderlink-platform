import type { PlatformMigration } from "../platform-migration-contract";

/** Candidate only: exact predecessor0166/order179; no hosted application. */
export const platformMembershipAddonAmendmentsMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "platform", migrationId: "0167_platform_membership_addon_amendments", executionOrder: 180,
  statements: Object.freeze([`CREATE TABLE platform_membership_addon_amendments (
    amendment_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES platform_users(user_id),
    request_id TEXT NOT NULL,
    request_sha256 TEXT NOT NULL,
    provider_subscription_id TEXT NOT NULL REFERENCES platform_membership_provider_subscriptions(provider_subscription_id),
    external_subscription_ref TEXT NOT NULL,
    external_customer_ref TEXT NOT NULL,
    entitlement_id TEXT NOT NULL REFERENCES platform_membership_entitlements(entitlement_id),
    original_offer_id TEXT NOT NULL REFERENCES platform_membership_offers(offer_id),
    original_plan_version_id TEXT NOT NULL REFERENCES platform_membership_plan_versions(plan_version_id),
    target_offer_id TEXT NOT NULL REFERENCES platform_membership_offers(offer_id),
    target_plan_version_id TEXT NOT NULL REFERENCES platform_membership_plan_versions(plan_version_id),
    addon_offer_ids_json TEXT NOT NULL CHECK(json_valid(addon_offer_ids_json) AND json_type(addon_offer_ids_json)='array'),
    addon_names_json TEXT NOT NULL CHECK(json_valid(addon_names_json) AND json_type(addon_names_json)='array'),
    currency TEXT NOT NULL,
    original_monthly_minor INTEGER NOT NULL CHECK(original_monthly_minor>=0),
    target_monthly_minor INTEGER NOT NULL CHECK(target_monthly_minor>=original_monthly_minor),
    proration_at_utc TEXT NOT NULL,
    period_end_utc TEXT NOT NULL,
    expires_at_utc TEXT NOT NULL,
    external_item_ref TEXT,
    original_price_ref TEXT,
    target_price_ref TEXT,
    charge_minor INTEGER CHECK(charge_minor IS NULL OR charge_minor>=0),
    external_invoice_ref TEXT UNIQUE,
    hosted_invoice_url TEXT,
    state TEXT NOT NULL CHECK(state IN ('preparing','quoted','confirming','pending_payment','applied','expired','failed','reconciliation_required')),
    failure_code TEXT,
    created_at_utc TEXT NOT NULL,
    updated_at_utc TEXT NOT NULL,
    UNIQUE(user_id,request_id),
    CHECK(expires_at_utc>proration_at_utc AND period_end_utc>proration_at_utc),
    CHECK(state NOT IN ('quoted','confirming','pending_payment','applied') OR
      (external_item_ref IS NOT NULL AND original_price_ref IS NOT NULL AND target_price_ref IS NOT NULL AND charge_minor IS NOT NULL))
  ) STRICT;
  CREATE UNIQUE INDEX platform_membership_one_open_addon_amendment
    ON platform_membership_addon_amendments(provider_subscription_id)
    WHERE state IN ('preparing','quoted','confirming','pending_payment','reconciliation_required');
  CREATE INDEX platform_membership_addon_amendment_invoice_match
    ON platform_membership_addon_amendments(external_subscription_ref,target_price_ref);
  CREATE TRIGGER platform_membership_addon_amendment_identity BEFORE UPDATE ON platform_membership_addon_amendments
    WHEN NEW.amendment_id IS NOT OLD.amendment_id OR NEW.user_id IS NOT OLD.user_id
      OR NEW.request_id IS NOT OLD.request_id OR NEW.request_sha256 IS NOT OLD.request_sha256
      OR NEW.provider_subscription_id IS NOT OLD.provider_subscription_id
      OR NEW.external_subscription_ref IS NOT OLD.external_subscription_ref OR NEW.external_customer_ref IS NOT OLD.external_customer_ref
      OR NEW.entitlement_id IS NOT OLD.entitlement_id OR NEW.original_offer_id IS NOT OLD.original_offer_id
      OR NEW.original_plan_version_id IS NOT OLD.original_plan_version_id OR NEW.target_offer_id IS NOT OLD.target_offer_id
      OR NEW.target_plan_version_id IS NOT OLD.target_plan_version_id OR NEW.addon_offer_ids_json IS NOT OLD.addon_offer_ids_json
      OR NEW.addon_names_json IS NOT OLD.addon_names_json OR NEW.currency IS NOT OLD.currency OR NEW.original_monthly_minor IS NOT OLD.original_monthly_minor
      OR NEW.target_monthly_minor IS NOT OLD.target_monthly_minor OR NEW.proration_at_utc IS NOT OLD.proration_at_utc
      OR NEW.period_end_utc IS NOT OLD.period_end_utc OR NEW.expires_at_utc IS NOT OLD.expires_at_utc
      OR NEW.created_at_utc IS NOT OLD.created_at_utc OR NEW.updated_at_utc<OLD.updated_at_utc
      OR (OLD.external_item_ref IS NOT NULL AND NEW.external_item_ref IS NOT OLD.external_item_ref)
      OR (OLD.original_price_ref IS NOT NULL AND NEW.original_price_ref IS NOT OLD.original_price_ref)
      OR (OLD.target_price_ref IS NOT NULL AND NEW.target_price_ref IS NOT OLD.target_price_ref)
      OR (OLD.charge_minor IS NOT NULL AND NEW.charge_minor IS NOT OLD.charge_minor)
      OR (OLD.external_invoice_ref IS NOT NULL AND NEW.external_invoice_ref IS NOT OLD.external_invoice_ref)
      OR (OLD.state IN ('applied','expired','failed') AND NEW.state IS NOT OLD.state)
    BEGIN SELECT RAISE(ABORT,'membership_addon_amendment_identity'); END;
  CREATE TRIGGER platform_membership_addon_amendment_no_delete BEFORE DELETE ON platform_membership_addon_amendments
    BEGIN SELECT RAISE(ABORT,'membership_addon_amendment_history_required'); END;`]),
});
