export const PLATFORM_ERASURE_TEXT_SUCCESSOR_STATEMENTS = Object.freeze([
  `CREATE TABLE platform_erasure_text_successors (
    operation_ref TEXT NOT NULL REFERENCES platform_erasure_module_operations(operation_ref) ON DELETE RESTRICT,
    participant TEXT NOT NULL CHECK(participant IN ('partner_delivery','partner_delivery_outcome')),
    claim_ref TEXT NOT NULL,
    original_sha256 TEXT NOT NULL CHECK(length(original_sha256)=64),
    original_binding_hmac_sha256 TEXT NOT NULL CHECK(length(original_binding_hmac_sha256)=64),
    claim_binding_hmac_sha256 TEXT NOT NULL CHECK(length(claim_binding_hmac_sha256)=64),
    binding_key_ref TEXT NOT NULL,
    metadata_sha256 TEXT NOT NULL CHECK(length(metadata_sha256)=64),
    first_received_at_utc TEXT NOT NULL,
    redacted_at_utc TEXT NOT NULL,
    proof_hmac_sha256 TEXT NOT NULL CHECK(length(proof_hmac_sha256)=64),
    PRIMARY KEY(operation_ref,participant,claim_ref)
  ) STRICT, WITHOUT ROWID`,
  `CREATE TRIGGER platform_erasure_text_successor_immutable
    BEFORE UPDATE ON platform_erasure_text_successors
    BEGIN SELECT RAISE(ABORT,'erasure_text_successor_immutable'); END`,
] as const);
