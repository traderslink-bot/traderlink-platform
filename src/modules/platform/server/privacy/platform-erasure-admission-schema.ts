/** Registration is a separate reviewed migration. These strings never execute
 * at import, construction or admission. No migration ID/order is allocated. */
export const platformErasureAdmissionSchemaStatements: readonly string[] = Object.freeze([
  `CREATE TABLE platform_erasure_profiles (
    profile_ref TEXT PRIMARY KEY, generation INTEGER NOT NULL CHECK(generation>0),
    schema_sha256 TEXT NOT NULL, retention_policy_ref TEXT NOT NULL, backup_policy_ref TEXT NOT NULL,
    reference_policy TEXT NOT NULL CHECK(reference_policy='hold_signer_and_shared_owner'),
    valid_until_utc TEXT NOT NULL
  ) STRICT`,
  `CREATE TABLE platform_erasure_lifecycles (
    lifecycle_ref TEXT PRIMARY KEY, user_id TEXT UNIQUE REFERENCES platform_users(user_id) ON DELETE NO ACTION,
    generation INTEGER NOT NULL CHECK(generation>0), admission_ref TEXT NOT NULL UNIQUE,
    erasure_generation INTEGER NOT NULL CHECK(erasure_generation>0),
    phase TEXT NOT NULL CHECK(phase IN ('live','preparing','settling','logical_deleted','complete')),
    profile_ref TEXT NOT NULL REFERENCES platform_erasure_profiles(profile_ref) ON DELETE RESTRICT,
    profile_generation INTEGER NOT NULL CHECK(profile_generation>0), valid_until_utc TEXT NOT NULL,
    operation_ref TEXT UNIQUE, CHECK((phase IN ('live','preparing','settling') AND user_id IS NOT NULL)
      OR (phase IN ('logical_deleted','complete') AND user_id IS NULL))
  ) STRICT`,
  `CREATE TABLE platform_erasure_lifecycle_events (
    event_ref TEXT PRIMARY KEY, lifecycle_ref TEXT NOT NULL REFERENCES platform_erasure_lifecycles(lifecycle_ref) ON DELETE RESTRICT,
    generation INTEGER NOT NULL, kind TEXT NOT NULL CHECK(kind IN ('onboarded','readmitted','prepared','settling','logical_deleted','complete')),
    operation_ref TEXT, at_utc TEXT NOT NULL, UNIQUE(lifecycle_ref,generation)
  ) STRICT`,
  `CREATE TABLE platform_erasure_module_operations (
    operation_ref TEXT PRIMARY KEY, lifecycle_ref TEXT NOT NULL UNIQUE REFERENCES platform_erasure_lifecycles(lifecycle_ref) ON DELETE RESTRICT,
    workspace_id TEXT, phase TEXT NOT NULL CHECK(phase IN ('prepared','settling','ready','logical_deleted','complete')),
    profile_ref TEXT NOT NULL, profile_generation INTEGER NOT NULL,
    original_admission_ref TEXT NOT NULL, original_generation INTEGER NOT NULL,
    prepared_at_utc TEXT NOT NULL, valid_until_utc TEXT NOT NULL,
    quiescence_ref TEXT, hold_code TEXT, logical_deleted_at_utc TEXT, completed_at_utc TEXT
  ) STRICT`,
  `CREATE TABLE platform_erasure_operation_claims (
    operation_ref TEXT NOT NULL REFERENCES platform_erasure_module_operations(operation_ref) ON DELETE RESTRICT,
    participant TEXT NOT NULL, claim_ref TEXT NOT NULL, original_json TEXT NOT NULL CHECK(json_valid(original_json)),
    original_sha256 TEXT NOT NULL, state TEXT NOT NULL CHECK(state IN ('captured','in_flight','settled','purged')),
    outcome_ref TEXT, PRIMARY KEY(operation_ref,participant,claim_ref)
  ) STRICT, WITHOUT ROWID`,
  `CREATE TABLE platform_erasure_gift_authorizations (
    authorization_ref TEXT PRIMARY KEY, authority_key TEXT NOT NULL, entitlement_id TEXT NOT NULL,
    original_terms_json TEXT NOT NULL CHECK(json_valid(original_terms_json)),
    profile_ref TEXT NOT NULL, profile_generation INTEGER NOT NULL, issued_at_utc TEXT NOT NULL
  ) STRICT`,
  `CREATE TRIGGER platform_erasure_lifecycle_transition BEFORE UPDATE ON platform_erasure_lifecycles
   WHEN NEW.lifecycle_ref IS NOT OLD.lifecycle_ref OR NEW.generation != OLD.generation+1
     OR NOT ((OLD.phase='live' AND NEW.phase IN ('live','preparing'))
       OR (OLD.phase IN ('preparing','settling') AND NEW.phase IN ('settling','logical_deleted'))
       OR (OLD.phase='logical_deleted' AND NEW.phase='complete'))
   BEGIN SELECT RAISE(ABORT,'erasure_lifecycle_transition'); END`,
  `CREATE TRIGGER platform_erasure_event_immutable BEFORE UPDATE ON platform_erasure_lifecycle_events
   BEGIN SELECT RAISE(ABORT,'erasure_event_immutable'); END`,
]);
export const platformErasureAdmissionSchemaDescriptor = Object.freeze({
  canRegister: false as const, migrationId: null, executionOrder: null,
  statements: platformErasureAdmissionSchemaStatements,
});

