/** Exact existing retained-evidence DDL split from the full unregistered
 * retention proposal. Named constants prevent index drift and let the narrow
 * and full descriptors share one SQL definition without duplicate execution. */

export const PARTNER_ALERT_RETAINED_OPERATION_TABLE_SQL = `CREATE TABLE partner_alert_retained_operation_evidence (
    evidence_ref TEXT PRIMARY KEY,
    lifecycle_ref TEXT NOT NULL,
    record_kind TEXT NOT NULL CHECK(record_kind IN ('audit','idempotency')),
    community_binding_hmac_sha256 TEXT NOT NULL CHECK(length(community_binding_hmac_sha256)=64),
    source_record_hmac_sha256 TEXT NOT NULL CHECK(length(source_record_hmac_sha256)=64),
    binding_key_ref TEXT NOT NULL CHECK(length(binding_key_ref) BETWEEN 1 AND 120),
    action_code TEXT NOT NULL CHECK(length(action_code) BETWEEN 1 AND 100),
    resource_binding_hmac_sha256 TEXT NOT NULL CHECK(length(resource_binding_hmac_sha256)=64),
    partner_revision INTEGER CHECK(partner_revision IS NULL OR partner_revision>=1),
    resource_version INTEGER CHECK(resource_version IS NULL OR resource_version>=1),
    state_code TEXT CHECK(state_code IS NULL OR length(state_code) BETWEEN 1 AND 40),
    fingerprint_hmac_sha256 TEXT CHECK(fingerprint_hmac_sha256 IS NULL OR length(fingerprint_hmac_sha256)=64),
    result_hmac_sha256 TEXT CHECK(result_hmac_sha256 IS NULL OR length(result_hmac_sha256)=64),
    source_created_at_utc TEXT NOT NULL,
    archived_at_utc TEXT NOT NULL,
    retain_until_utc TEXT NOT NULL,
    CHECK(retain_until_utc>source_created_at_utc),
    CHECK((record_kind='audit' AND fingerprint_hmac_sha256 IS NULL AND result_hmac_sha256 IS NULL)
      OR (record_kind='idempotency' AND fingerprint_hmac_sha256 IS NOT NULL AND result_hmac_sha256 IS NOT NULL)),
    UNIQUE(lifecycle_ref,record_kind,source_record_hmac_sha256),
    FOREIGN KEY(lifecycle_ref) REFERENCES platform_erasure_lifecycles(lifecycle_ref) ON DELETE RESTRICT
  ) STRICT, WITHOUT ROWID`;

export const PARTNER_ALERT_RETAINED_OPERATION_EXPIRY_INDEX_SQL = `CREATE INDEX partner_alert_retained_operation_expiry
    ON partner_alert_retained_operation_evidence(retain_until_utc,evidence_ref)`;

export const PARTNER_ALERT_RETAINED_COMMERCIAL_TABLE_SQL = `CREATE TABLE partner_alert_retained_commercial_evidence (
    evidence_ref TEXT PRIMARY KEY,
    lifecycle_ref TEXT NOT NULL,
    record_kind TEXT NOT NULL CHECK(record_kind IN ('agreement','payment','refund','dispute')),
    community_binding_hmac_sha256 TEXT NOT NULL CHECK(length(community_binding_hmac_sha256)=64),
    source_record_hmac_sha256 TEXT NOT NULL CHECK(length(source_record_hmac_sha256)=64),
    binding_key_ref TEXT NOT NULL CHECK(length(binding_key_ref) BETWEEN 1 AND 120),
    successor_ref TEXT NOT NULL CHECK(length(successor_ref) BETWEEN 1 AND 160),
    agreement_version INTEGER CHECK(agreement_version IS NULL OR agreement_version>=1),
    terms_version INTEGER CHECK(terms_version IS NULL OR terms_version>=1),
    acceptance_rules_version INTEGER CHECK(acceptance_rules_version IS NULL OR acceptance_rules_version>=1),
    accepted_at_utc TEXT,
    proposer_binding_hmac_sha256 TEXT CHECK(proposer_binding_hmac_sha256 IS NULL OR length(proposer_binding_hmac_sha256)=64),
    acceptor_binding_hmac_sha256 TEXT CHECK(acceptor_binding_hmac_sha256 IS NULL OR length(acceptor_binding_hmac_sha256)=64),
    previous_agreement_binding_hmac_sha256 TEXT CHECK(previous_agreement_binding_hmac_sha256 IS NULL OR length(previous_agreement_binding_hmac_sha256)=64),
    acceptance_evidence_hmac_sha256 TEXT CHECK(acceptance_evidence_hmac_sha256 IS NULL OR length(acceptance_evidence_hmac_sha256)=64),
    pricing_source TEXT CHECK(pricing_source IS NULL OR pricing_source IN ('standard','private')),
    first_channel_amount_minor INTEGER,
    additional_channel_amount_minor INTEGER,
    included_channels INTEGER,
    cadence_unit TEXT CHECK(cadence_unit IS NULL OR cadence_unit IN ('day','calendar_month')),
    cadence_count INTEGER CHECK(cadence_count IS NULL OR cadence_count>=1),
    contracted_channels INTEGER,
    total_amount_minor INTEGER,
    provider_record_hmac_sha256 TEXT CHECK(provider_record_hmac_sha256 IS NULL OR length(provider_record_hmac_sha256)=64),
    provider_account_binding_hmac_sha256 TEXT CHECK(provider_account_binding_hmac_sha256 IS NULL OR length(provider_account_binding_hmac_sha256)=64),
    membership_binding_hmac_sha256 TEXT CHECK(membership_binding_hmac_sha256 IS NULL OR length(membership_binding_hmac_sha256)=64),
    payer_binding_hmac_sha256 TEXT CHECK(payer_binding_hmac_sha256 IS NULL OR length(payer_binding_hmac_sha256)=64),
    provider_state_code TEXT CHECK(provider_state_code IS NULL OR provider_state_code IN ('paid','not_paid','uncertain')),
    refund_state_code TEXT CHECK(refund_state_code IS NULL OR refund_state_code IN ('none','partial','full','unknown')),
    dispute_state_code TEXT CHECK(dispute_state_code IS NULL OR dispute_state_code IN ('clear','observed','unverified')),
    amount_minor INTEGER,
    currency_code TEXT CHECK(currency_code IS NULL OR (length(currency_code)=3 AND currency_code=upper(currency_code))),
    paid_at_utc TEXT,
    provider_observed_at_utc TEXT,
    evidence_hmac_sha256 TEXT NOT NULL CHECK(length(evidence_hmac_sha256)=64),
    source_created_at_utc TEXT NOT NULL,
    archived_at_utc TEXT NOT NULL,
    retain_until_utc TEXT NOT NULL,
    CHECK(retain_until_utc>source_created_at_utc),
    CHECK((record_kind='agreement' AND agreement_version IS NOT NULL AND terms_version IS NOT NULL
      AND agreement_version=terms_version AND acceptance_rules_version IS NOT NULL AND accepted_at_utc IS NOT NULL
      AND proposer_binding_hmac_sha256 IS NOT NULL AND acceptor_binding_hmac_sha256 IS NOT NULL
      AND acceptance_evidence_hmac_sha256 IS NOT NULL AND pricing_source IS NOT NULL
      AND first_channel_amount_minor IS NOT NULL AND additional_channel_amount_minor IS NOT NULL
      AND included_channels IS NOT NULL AND cadence_unit IS NOT NULL AND cadence_count IS NOT NULL
      AND contracted_channels IS NOT NULL AND total_amount_minor IS NOT NULL AND currency_code IS NOT NULL
      AND provider_record_hmac_sha256 IS NULL AND provider_account_binding_hmac_sha256 IS NULL
      AND membership_binding_hmac_sha256 IS NULL AND payer_binding_hmac_sha256 IS NULL
      AND provider_state_code IS NULL AND refund_state_code IS NULL AND dispute_state_code IS NULL
      AND amount_minor IS NULL AND paid_at_utc IS NULL AND provider_observed_at_utc IS NULL)
      OR (record_kind IN ('payment','refund','dispute') AND agreement_version IS NULL AND terms_version IS NULL
        AND acceptance_rules_version IS NULL AND accepted_at_utc IS NULL
        AND proposer_binding_hmac_sha256 IS NULL AND acceptor_binding_hmac_sha256 IS NULL
        AND previous_agreement_binding_hmac_sha256 IS NULL AND acceptance_evidence_hmac_sha256 IS NULL
        AND pricing_source IS NULL
        AND first_channel_amount_minor IS NULL AND additional_channel_amount_minor IS NULL
        AND included_channels IS NULL AND cadence_unit IS NULL AND cadence_count IS NULL
        AND contracted_channels IS NULL AND total_amount_minor IS NULL
        AND provider_record_hmac_sha256 IS NOT NULL AND provider_account_binding_hmac_sha256 IS NOT NULL
        AND membership_binding_hmac_sha256 IS NOT NULL AND payer_binding_hmac_sha256 IS NOT NULL
        AND provider_state_code IS NOT NULL AND refund_state_code IS NOT NULL AND dispute_state_code IS NOT NULL
        AND amount_minor IS NOT NULL AND currency_code IS NOT NULL AND provider_observed_at_utc IS NOT NULL
        AND (record_kind!='payment' OR (provider_state_code='paid' AND paid_at_utc IS NOT NULL))
        AND (record_kind!='refund' OR refund_state_code IN ('partial','full'))
        AND (record_kind!='dispute' OR dispute_state_code='observed'))),
    UNIQUE(lifecycle_ref,record_kind,source_record_hmac_sha256),
    FOREIGN KEY(lifecycle_ref) REFERENCES platform_erasure_lifecycles(lifecycle_ref) ON DELETE RESTRICT
  ) STRICT, WITHOUT ROWID`;

export const PARTNER_ALERT_RETAINED_COMMERCIAL_EXPIRY_INDEX_SQL = `CREATE INDEX partner_alert_retained_commercial_expiry
    ON partner_alert_retained_commercial_evidence(retain_until_utc,evidence_ref)`;

export const PARTNER_ALERT_RETAINED_OPERATION_IMMUTABLE_TRIGGER_SQL = `CREATE TRIGGER partner_alert_retained_operation_immutable BEFORE UPDATE ON partner_alert_retained_operation_evidence
    BEGIN SELECT RAISE(ABORT,'partner_alert_retained_operation_immutable'); END`;

export const PARTNER_ALERT_RETAINED_COMMERCIAL_IMMUTABLE_TRIGGER_SQL = `CREATE TRIGGER partner_alert_retained_commercial_immutable BEFORE UPDATE ON partner_alert_retained_commercial_evidence
    BEGIN SELECT RAISE(ABORT,'partner_alert_retained_commercial_immutable'); END`;

export const PARTNER_ALERT_RETAINED_EVIDENCE_SCHEMA_STATEMENTS: readonly string[] = Object.freeze([

  PARTNER_ALERT_RETAINED_OPERATION_TABLE_SQL,

  PARTNER_ALERT_RETAINED_OPERATION_EXPIRY_INDEX_SQL,

  PARTNER_ALERT_RETAINED_COMMERCIAL_TABLE_SQL,

  PARTNER_ALERT_RETAINED_COMMERCIAL_EXPIRY_INDEX_SQL,

  PARTNER_ALERT_RETAINED_OPERATION_IMMUTABLE_TRIGGER_SQL,

  PARTNER_ALERT_RETAINED_COMMERCIAL_IMMUTABLE_TRIGGER_SQL,

]);

export const PARTNER_ALERT_RETAINED_EVIDENCE_SCHEMA_DESCRIPTOR = Object.freeze({ canRegister:false as const, migrationId:null, executionOrder:null, containsPrincipalInsert:false as const, enablesAccountErasure:false as const });
