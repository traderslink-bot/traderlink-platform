import type { ExactResult } from "../exact";

export const CANONICAL_SERIALIZATION_VERSION = "ti_v3_canonical_json_v1" as const;

export type CanonicalValue =
  | null
  | boolean
  | string
  | readonly CanonicalValue[]
  | { readonly [key: string]: CanonicalValue };

export type CanonicalSerializationFailureCode =
  | "ti_v3_canonical_undefined_forbidden"
  | "ti_v3_canonical_number_forbidden"
  | "ti_v3_canonical_bigint_forbidden"
  | "ti_v3_canonical_value_type_invalid"
  | "ti_v3_canonical_object_type_invalid"
  | "ti_v3_canonical_key_collision"
  | "ti_v3_canonical_unicode_invalid"
  | "ti_v3_canonical_raw_json_invalid"
  | "ti_v3_canonical_duplicate_json_key"
  | "ti_v3_canonical_trailing_json_content";

export interface CanonicalSerializationFailure {
  code: CanonicalSerializationFailureCode;
  path: string;
}

export interface CanonicalSerialization {
  readonly value: CanonicalValue;
  readonly json: string;
  readonly utf8: Uint8Array;
}

export function normalizeCanonicalString(value: string): string {
  return value.replace(/\r\n?/g, "\n").normalize("NFC");
}

function hasUnpairedSurrogate(value: string): boolean {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code >= 0xd800 && code <= 0xdbff) {
      const next = value.charCodeAt(index + 1);
      if (!(next >= 0xdc00 && next <= 0xdfff)) {
        return true;
      }
      index += 1;
    } else if (code >= 0xdc00 && code <= 0xdfff) {
      return true;
    }
  }
  return false;
}

export function compareUnicodeCodePoints(left: string, right: string): number {
  const leftPoints = Array.from(left);
  const rightPoints = Array.from(right);
  const length = leftPoints.length < rightPoints.length ? leftPoints.length : rightPoints.length;
  for (let index = 0; index < length; index += 1) {
    const leftPoint = leftPoints[index].codePointAt(0) ?? 0;
    const rightPoint = rightPoints[index].codePointAt(0) ?? 0;
    if (leftPoint !== rightPoint) {
      return leftPoint - rightPoint;
    }
  }
  return leftPoints.length - rightPoints.length;
}

function failure(
  code: CanonicalSerializationFailureCode,
  path: string,
): ExactResult<never, CanonicalSerializationFailure> {
  return { ok: false, error: { code, path } };
}

function normalizeCanonicalValue(
  input: unknown,
  path: string,
): ExactResult<CanonicalValue, CanonicalSerializationFailure> {
  if (input === null || typeof input === "boolean") {
    return { ok: true, value: input };
  }
  if (typeof input === "string") {
    if (hasUnpairedSurrogate(input)) {
      return failure("ti_v3_canonical_unicode_invalid", path);
    }
    return { ok: true, value: normalizeCanonicalString(input) };
  }
  if (typeof input === "undefined") {
    return failure("ti_v3_canonical_undefined_forbidden", path);
  }
  if (typeof input === "number") {
    return failure("ti_v3_canonical_number_forbidden", path);
  }
  if (typeof input === "bigint") {
    return failure("ti_v3_canonical_bigint_forbidden", path);
  }
  if (typeof input !== "object") {
    return failure("ti_v3_canonical_value_type_invalid", path);
  }
  if (Array.isArray(input)) {
    const values: CanonicalValue[] = [];
    for (let index = 0; index < input.length; index += 1) {
      const normalized = normalizeCanonicalValue(input[index], `${path}[${index}]`);
      if (!normalized.ok) {
        return normalized;
      }
      values.push(normalized.value);
    }
    return { ok: true, value: Object.freeze(values) };
  }
  const prototype = Object.getPrototypeOf(input);
  if (prototype !== Object.prototype && prototype !== null) {
    return failure("ti_v3_canonical_object_type_invalid", path);
  }
  const normalizedEntries = new Map<string, CanonicalValue>();
  for (const [key, value] of Object.entries(input)) {
    if (hasUnpairedSurrogate(key)) {
      return failure("ti_v3_canonical_unicode_invalid", path);
    }
    const normalizedKey = normalizeCanonicalString(key);
    if (normalizedEntries.has(normalizedKey)) {
      return failure("ti_v3_canonical_key_collision", path);
    }
    const normalizedValue = normalizeCanonicalValue(value, `${path}.${normalizedKey}`);
    if (!normalizedValue.ok) {
      return normalizedValue;
    }
    normalizedEntries.set(normalizedKey, normalizedValue.value);
  }
  const result = Object.create(null) as Record<string, CanonicalValue>;
  for (const key of [...normalizedEntries.keys()].sort(compareUnicodeCodePoints)) {
    Object.defineProperty(result, key, {
      configurable: false,
      enumerable: true,
      value: normalizedEntries.get(key) as CanonicalValue,
      writable: false,
    });
  }
  return { ok: true, value: Object.freeze(result) };
}

function stringifyCanonicalValue(value: CanonicalValue): string {
  if (value === null) {
    return "null";
  }
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }
  if (typeof value === "string") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(stringifyCanonicalValue).join(",")}]`;
  }
  return `{${Object.entries(value)
    .map(([key, child]) => `${JSON.stringify(key)}:${stringifyCanonicalValue(child)}`)
    .join(",")}}`;
}

export function serializeCanonicalValue(
  input: unknown,
): ExactResult<CanonicalSerialization, CanonicalSerializationFailure> {
  const normalized = normalizeCanonicalValue(input, "$");
  if (!normalized.ok) {
    return normalized;
  }
  const json = stringifyCanonicalValue(normalized.value);
  const authoritativeBytes = new TextEncoder().encode(json);
  const serialization: CanonicalSerialization = Object.freeze({
    value: normalized.value,
    json,
    get utf8(): Uint8Array {
      return authoritativeBytes.slice();
    },
  });
  return {
    ok: true,
    value: serialization,
  };
}

class StrictJsonParser {
  private index = 0;

  constructor(private readonly source: string) {}

  parse(): ExactResult<CanonicalValue, CanonicalSerializationFailure> {
    const value = this.parseValue("$");
    if (!value.ok) {
      return value;
    }
    this.skipWhitespace();
    if (this.index !== this.source.length) {
      return failure("ti_v3_canonical_trailing_json_content", "$");
    }
    return value;
  }

  private skipWhitespace(): void {
    while (/[\t\n\r ]/.test(this.source[this.index] ?? "")) {
      this.index += 1;
    }
  }

  private parseValue(path: string): ExactResult<CanonicalValue, CanonicalSerializationFailure> {
    this.skipWhitespace();
    const token = this.source[this.index];
    if (token === '"') {
      return this.parseString(path);
    }
    if (token === "{") {
      return this.parseObject(path);
    }
    if (token === "[") {
      return this.parseArray(path);
    }
    if (this.source.startsWith("true", this.index)) {
      this.index += 4;
      return { ok: true, value: true };
    }
    if (this.source.startsWith("false", this.index)) {
      this.index += 5;
      return { ok: true, value: false };
    }
    if (this.source.startsWith("null", this.index)) {
      this.index += 4;
      return { ok: true, value: null };
    }
    if (token === "-" || /[0-9]/.test(token ?? "")) {
      return failure("ti_v3_canonical_number_forbidden", path);
    }
    return failure("ti_v3_canonical_raw_json_invalid", path);
  }

  private parseString(path: string): ExactResult<string, CanonicalSerializationFailure> {
    const start = this.index;
    this.index += 1;
    let escaped = false;
    while (this.index < this.source.length) {
      const token = this.source[this.index];
      if (!escaped && token === '"') {
        this.index += 1;
        try {
          const value = JSON.parse(this.source.slice(start, this.index)) as string;
          if (hasUnpairedSurrogate(value)) {
            return failure("ti_v3_canonical_unicode_invalid", path);
          }
          return { ok: true, value };
        } catch {
          return failure("ti_v3_canonical_raw_json_invalid", path);
        }
      }
      if (!escaped && token === "\\") {
        escaped = true;
      } else {
        if (!escaped && token !== undefined && token.charCodeAt(0) < 0x20) {
          return failure("ti_v3_canonical_raw_json_invalid", path);
        }
        escaped = false;
      }
      this.index += 1;
    }
    return failure("ti_v3_canonical_raw_json_invalid", path);
  }

  private parseArray(path: string): ExactResult<CanonicalValue, CanonicalSerializationFailure> {
    this.index += 1;
    const values: CanonicalValue[] = [];
    this.skipWhitespace();
    if (this.source[this.index] === "]") {
      this.index += 1;
      return { ok: true, value: values };
    }
    while (this.index < this.source.length) {
      const value = this.parseValue(`${path}[${values.length}]`);
      if (!value.ok) {
        return value;
      }
      values.push(value.value);
      this.skipWhitespace();
      const token = this.source[this.index];
      if (token === "]") {
        this.index += 1;
        return { ok: true, value: values };
      }
      if (token !== ",") {
        return failure("ti_v3_canonical_raw_json_invalid", path);
      }
      this.index += 1;
    }
    return failure("ti_v3_canonical_raw_json_invalid", path);
  }

  private parseObject(path: string): ExactResult<CanonicalValue, CanonicalSerializationFailure> {
    this.index += 1;
    const value = Object.create(null) as Record<string, CanonicalValue>;
    const keys = new Set<string>();
    this.skipWhitespace();
    if (this.source[this.index] === "}") {
      this.index += 1;
      return { ok: true, value };
    }
    while (this.index < this.source.length) {
      this.skipWhitespace();
      if (this.source[this.index] !== '"') {
        return failure("ti_v3_canonical_raw_json_invalid", path);
      }
      const parsedKey = this.parseString(path);
      if (!parsedKey.ok) {
        return parsedKey;
      }
      const normalizedKey = normalizeCanonicalString(parsedKey.value);
      if (keys.has(normalizedKey)) {
        return failure("ti_v3_canonical_duplicate_json_key", path);
      }
      keys.add(normalizedKey);
      this.skipWhitespace();
      if (this.source[this.index] !== ":") {
        return failure("ti_v3_canonical_raw_json_invalid", path);
      }
      this.index += 1;
      const child = this.parseValue(`${path}.${normalizedKey}`);
      if (!child.ok) {
        return child;
      }
      Object.defineProperty(value, normalizedKey, {
        configurable: true,
        enumerable: true,
        value: child.value,
        writable: true,
      });
      this.skipWhitespace();
      const token = this.source[this.index];
      if (token === "}") {
        this.index += 1;
        return { ok: true, value };
      }
      if (token !== ",") {
        return failure("ti_v3_canonical_raw_json_invalid", path);
      }
      this.index += 1;
    }
    return failure("ti_v3_canonical_raw_json_invalid", path);
  }
}

export function parseStrictCanonicalJson(
  source: unknown,
): ExactResult<CanonicalValue, CanonicalSerializationFailure> {
  if (typeof source !== "string") {
    return failure("ti_v3_canonical_raw_json_invalid", "$");
  }
  const parsed = new StrictJsonParser(source).parse();
  if (!parsed.ok) {
    return parsed;
  }
  const normalized = normalizeCanonicalValue(parsed.value, "$");
  return normalized;
}
