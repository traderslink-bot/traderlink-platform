import type { ExactResult } from "../exact";
import { parseStrictCanonicalJson } from "../canonical";
import { createCanonicalContentIdentity, type CanonicalContentDigest } from "../identity";
import { validateCanonicalDigest, validateExactRecord, type FoundationValidationFailure } from "./runtime-validation";

export const PAYLOAD_ENVELOPE_VERSION = "ti_v3_payload_envelope_v1" as const;

export interface ValidatedPayloadEnvelope {
  readonly schemaVersion: typeof PAYLOAD_ENVELOPE_VERSION;
  readonly payloadKind: "persisted_json" | "adapter_request" | "adapter_response" | "tool_request" | "tool_response";
  readonly payloadVersion: `v${number}`;
  readonly payload: Readonly<Record<string, unknown>>;
  readonly payloadDigest: CanonicalContentDigest;
  readonly envelopeDigest: CanonicalContentDigest;
}

export type PayloadEnvelopeFailure = FoundationValidationFailure | {
  readonly code: "ti_v3_payload_json_invalid" | "ti_v3_payload_version_unsupported" | "ti_v3_payload_digest_mismatch";
  readonly path: string;
};

const KINDS = new Set<ValidatedPayloadEnvelope["payloadKind"]>(["persisted_json", "adapter_request", "adapter_response", "tool_request", "tool_response"]);

function failure(code: PayloadEnvelopeFailure["code"], path: string): ExactResult<never, PayloadEnvelopeFailure> {
  return { ok: false, error: { code, path } };
}

export function buildValidatedPayloadEnvelope(input: unknown): ExactResult<ValidatedPayloadEnvelope, PayloadEnvelopeFailure> {
  const record = validateExactRecord(input, ["payloadKind", "payloadVersion", "payload"], []);
  if (!record.ok) return record;
  if (typeof record.value.payloadKind !== "string" || !KINDS.has(record.value.payloadKind as ValidatedPayloadEnvelope["payloadKind"])) return failure("ti_v3_validation_enum_invalid", "$.payloadKind");
  if (typeof record.value.payloadVersion !== "string" || !/^v[1-9][0-9]*$/.test(record.value.payloadVersion) || record.value.payloadVersion !== "v1") return failure("ti_v3_payload_version_unsupported", "$.payloadVersion");
  const payload = validateExactRecord(record.value.payload, [], Object.keys((record.value.payload ?? {}) as object), "$.payload");
  if (!payload.ok) return failure("ti_v3_payload_json_invalid", "$.payload");
  let serialized: string;
  try { serialized = JSON.stringify(payload.value); } catch { return failure("ti_v3_payload_json_invalid", "$.payload"); }
  if (serialized.length > 1_000_000) return failure("ti_v3_validation_payload_oversized", "$.payload");
  const payloadIdentity = createCanonicalContentIdentity("canonical_content", "v1", payload.value);
  if (!payloadIdentity.ok) return failure(payloadIdentity.error.code, payloadIdentity.error.path);
  const content = { schemaVersion: PAYLOAD_ENVELOPE_VERSION, payloadKind: record.value.payloadKind as ValidatedPayloadEnvelope["payloadKind"], payloadVersion: record.value.payloadVersion as "v1", payload: payloadIdentity.value.canonicalValue as Readonly<Record<string, unknown>>, payloadDigest: payloadIdentity.value.identifier };
  const identity = createCanonicalContentIdentity("payload_envelope", "v1", content);
  if (!identity.ok) return failure(identity.error.code, identity.error.path);
  return { ok: true, value: Object.freeze({ ...content, envelopeDigest: identity.value.identifier }) };
}

export function verifyValidatedPayloadEnvelope(input: unknown): ExactResult<ValidatedPayloadEnvelope, PayloadEnvelopeFailure> {
  const record = validateExactRecord(input, ["schemaVersion", "payloadKind", "payloadVersion", "payload", "payloadDigest", "envelopeDigest"], []);
  if (!record.ok || record.value.schemaVersion !== PAYLOAD_ENVELOPE_VERSION) return failure("ti_v3_payload_version_unsupported", "$.schemaVersion");
  const claimedPayload = validateCanonicalDigest(record.value.payloadDigest, "$.payloadDigest", "canonical_content");
  if (!claimedPayload.ok) return claimedPayload;
  const claimedEnvelope = validateCanonicalDigest(record.value.envelopeDigest, "$.envelopeDigest", "payload_envelope");
  if (!claimedEnvelope.ok) return claimedEnvelope;
  const rebuilt = buildValidatedPayloadEnvelope({ payloadKind: record.value.payloadKind, payloadVersion: record.value.payloadVersion, payload: record.value.payload });
  if (!rebuilt.ok || rebuilt.value.payloadDigest !== claimedPayload.value || rebuilt.value.envelopeDigest !== claimedEnvelope.value) return failure("ti_v3_payload_digest_mismatch", "$");
  return rebuilt;
}

export function parsePersistedJson(text: string): ExactResult<ValidatedPayloadEnvelope, PayloadEnvelopeFailure> {
  if (typeof text !== "string" || text.length > 1_000_000) return failure("ti_v3_validation_payload_oversized", "$");
  const parsed = parseStrictCanonicalJson(text);
  if (!parsed.ok) return { ok: false, error: parsed.error };
  return verifyValidatedPayloadEnvelope(parsed.value);
}
