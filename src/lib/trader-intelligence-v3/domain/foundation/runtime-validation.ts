import type { CanonicalUtcTimestamp } from "../canonical";
import { compareUnicodeCodePoints, parseCanonicalUtcTimestamp } from "../canonical";
import type { ExactResult } from "../exact";
import { parseCanonicalContentDigest, type CanonicalContentDigest } from "../identity";

export const FOUNDATION_PAYLOAD_LIMITS = Object.freeze({
  maxArrayItems: 10_000,
  maxObjectKeys: 128,
  maxStringLength: 4_096,
  maxReasonCodes: 128,
});

export type FoundationValidationFailureCode =
  | "ti_v3_validation_input_invalid"
  | "ti_v3_validation_extra_field"
  | "ti_v3_validation_required_field_missing"
  | "ti_v3_validation_string_invalid"
  | "ti_v3_validation_enum_invalid"
  | "ti_v3_validation_boolean_invalid"
  | "ti_v3_validation_array_invalid"
  | "ti_v3_validation_payload_oversized"
  | "ti_v3_validation_timestamp_invalid"
  | "ti_v3_validation_digest_invalid"
  | "ti_v3_validation_temporal_order_invalid";

export interface FoundationValidationFailure {
  readonly code: FoundationValidationFailureCode | string;
  readonly path: string;
}

export function validationFailure(
  code: FoundationValidationFailure["code"],
  path: string,
): ExactResult<never, FoundationValidationFailure> {
  return { ok: false, error: { code, path } };
}

export function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value) as object | null;
  return prototype === Object.prototype || prototype === null;
}

export function validateExactRecord(
  value: unknown,
  requiredKeys: readonly string[],
  optionalKeys: readonly string[],
  path = "$",
): ExactResult<Record<string, unknown>, FoundationValidationFailure> {
  if (!isPlainRecord(value)) {
    return validationFailure("ti_v3_validation_input_invalid", path);
  }
  const keys = Object.keys(value);
  if (keys.length > FOUNDATION_PAYLOAD_LIMITS.maxObjectKeys) {
    return validationFailure("ti_v3_validation_payload_oversized", path);
  }
  const allowed = new Set([...requiredKeys, ...optionalKeys]);
  const extra = keys.find((key) => !allowed.has(key));
  if (extra !== undefined) {
    return validationFailure("ti_v3_validation_extra_field", `${path}.${extra}`);
  }
  const missing = requiredKeys.find((key) => !Object.prototype.hasOwnProperty.call(value, key));
  if (missing !== undefined) {
    return validationFailure("ti_v3_validation_required_field_missing", `${path}.${missing}`);
  }
  return { ok: true, value };
}

export function validateBoundedString(
  value: unknown,
  path: string,
  pattern?: RegExp,
  maxLength = FOUNDATION_PAYLOAD_LIMITS.maxStringLength,
): ExactResult<string, FoundationValidationFailure> {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.length > maxLength ||
    /[\u0000-\u001f]/.test(value) ||
    (pattern !== undefined && !pattern.test(value))
  ) {
    return validationFailure("ti_v3_validation_string_invalid", path);
  }
  return { ok: true, value };
}

export function validateEnum<T extends string>(
  value: unknown,
  allowed: ReadonlySet<T>,
  path: string,
): ExactResult<T, FoundationValidationFailure> {
  if (typeof value !== "string" || !allowed.has(value as T)) {
    return validationFailure("ti_v3_validation_enum_invalid", path);
  }
  return { ok: true, value: value as T };
}

export function validateBoolean(
  value: unknown,
  path: string,
): ExactResult<boolean, FoundationValidationFailure> {
  if (typeof value !== "boolean") {
    return validationFailure("ti_v3_validation_boolean_invalid", path);
  }
  return { ok: true, value };
}

export function validateArray(
  value: unknown,
  path: string,
  maxItems: number = FOUNDATION_PAYLOAD_LIMITS.maxArrayItems,
): ExactResult<readonly unknown[], FoundationValidationFailure> {
  if (!Array.isArray(value)) {
    return validationFailure("ti_v3_validation_array_invalid", path);
  }
  if (value.length > maxItems) {
    return validationFailure("ti_v3_validation_payload_oversized", path);
  }
  return { ok: true, value };
}

export function validateCanonicalTimestamp(
  value: unknown,
  path: string,
): ExactResult<CanonicalUtcTimestamp, FoundationValidationFailure> {
  const parsed = parseCanonicalUtcTimestamp(value, "nanosecond");
  return parsed.ok
    ? parsed
    : validationFailure("ti_v3_validation_timestamp_invalid", path);
}

export function validateCanonicalDigest(
  value: unknown,
  path: string,
  expectedDomain?: string,
): ExactResult<CanonicalContentDigest, FoundationValidationFailure> {
  const parsed = parseCanonicalContentDigest(value);
  if (!parsed.ok) return validationFailure("ti_v3_validation_digest_invalid", path);
  if (expectedDomain !== undefined && !parsed.value.startsWith(`ti_v3:${expectedDomain}:`)) {
    return validationFailure("ti_v3_validation_digest_invalid", path);
  }
  return parsed;
}

export function canonicalStringSet(
  values: readonly string[],
): readonly string[] {
  return Object.freeze([...new Set(values)].sort(compareUnicodeCodePoints));
}

export function validateStringSet(
  value: unknown,
  path: string,
  options: { readonly pattern?: RegExp; readonly maxItems?: number } = {},
): ExactResult<readonly string[], FoundationValidationFailure> {
  const array = validateArray(value, path, options.maxItems);
  if (!array.ok) return array;
  const validated: string[] = [];
  for (let index = 0; index < array.value.length; index += 1) {
    const item = validateBoundedString(
      array.value[index],
      `${path}[${index}]`,
      options.pattern,
    );
    if (!item.ok) return item;
    validated.push(item.value);
  }
  return { ok: true, value: canonicalStringSet(validated) };
}

export function canonicalReasonCodes(values: readonly string[]): readonly string[] {
  return canonicalStringSet(values);
}

export function compareCanonicalTimestamps(
  left: CanonicalUtcTimestamp,
  right: CanonicalUtcTimestamp,
): number {
  return left < right ? -1 : left > right ? 1 : 0;
}
