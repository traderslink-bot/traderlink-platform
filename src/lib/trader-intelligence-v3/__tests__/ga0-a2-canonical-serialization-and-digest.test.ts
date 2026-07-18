import { describe, expect, it } from "vitest";

import {
  CANONICAL_SERIALIZATION_LIMITS,
  createCanonicalContentIdentity,
  createCanonicalSourceDocumentDigest,
  parseStrictCanonicalJson,
  serializeCanonicalValue,
} from "../domain";

describe("Trader Intelligence v3 canonical serialization and digest", () => {
  it("normalizes Unicode, line endings, and property order", () => {
    const first = serializeCanonicalValue({
      decimals: { zero: "0", price: "0.125" },
      b: "line\r\nend",
      a: "e\u0301",
    });
    const second = serializeCanonicalValue({
      a: "é",
      b: "line\nend",
      decimals: { price: "0.125", zero: "0" },
    });
    expect(first).toEqual(second);
    expect(first.ok && first.value.json).toBe(
      '{"a":"é","b":"line\\nend","decimals":{"price":"0.125","zero":"0"}}',
    );
  });

  it("preserves semantic array order", () => {
    expect(serializeCanonicalValue({ values: ["a", "b"] })).not.toEqual(
      serializeCanonicalValue({ values: ["b", "a"] }),
    );
  });

  it.each([
    [{ value: undefined }, "ti_v3_canonical_undefined_forbidden"],
    [{ value: 1 }, "ti_v3_canonical_number_forbidden"],
    [{ value: BigInt(1) }, "ti_v3_canonical_bigint_forbidden"],
    [{ value: Number.NaN }, "ti_v3_canonical_number_forbidden"],
    [{ value: Number.POSITIVE_INFINITY }, "ti_v3_canonical_number_forbidden"],
  ])("rejects unsupported canonical values", (value, code) => {
    const result = serializeCanonicalValue(value);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe(code);
  });

  it("rejects duplicate raw JSON keys before loss", () => {
    expect(parseStrictCanonicalJson('{"a":"first","a":"second"}')).toEqual({
      ok: false,
      error: { code: "ti_v3_canonical_duplicate_json_key", path: "$" },
    });
    expect(parseStrictCanonicalJson('{"é":"first","e\\u0301":"second"}')).toEqual({
      ok: false,
      error: { code: "ti_v3_canonical_duplicate_json_key", path: "$" },
    });
  });

  it.each([
    ["primitive", '"safe"', '"safe"'],
    ["object", '{"safe":"value"}', '{"safe":"value"}'],
    ["null", "null", "null"],
    ["nested", '{"child":{"safe":"value"}}', '{"child":{"safe":"value"}}'],
  ])("preserves a __proto__ %s value without prototype mutation", (_case, raw, expected) => {
    const parsed = parseStrictCanonicalJson(`{"__proto__":${raw}}`);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok || typeof parsed.value !== "object" || parsed.value === null) return;
    expect(Object.getPrototypeOf(parsed.value)).toBeNull();
    expect(Object.prototype.hasOwnProperty.call(parsed.value, "__proto__")).toBe(true);
    expect(serializeCanonicalValue(parsed.value)).toMatchObject({
      ok: true,
      value: { json: `{"__proto__":${expected}}` },
    });
  });

  it.each(["__proto__", "constructor", "prototype"])(
    "preserves the direct own key %s without mutating prototypes",
    (key) => {
      const input = Object.create(null) as Record<string, unknown>;
      Object.defineProperty(input, key, {
        enumerable: true,
        value: { marker: "synthetic" },
      });
      const result = serializeCanonicalValue(input);
      expect(result.ok).toBe(true);
      if (!result.ok || typeof result.value.value !== "object" || result.value.value === null) {
        return;
      }
      expect(Object.getPrototypeOf(result.value.value)).toBeNull();
      expect(Object.prototype.hasOwnProperty.call(result.value.value, key)).toBe(true);
      expect(result.value.json).toContain(`"${key}":{"marker":"synthetic"}`);
    },
  );

  it("rejects accessors without invoking them or leaking their exceptions", () => {
    let invocationCount = 0;
    const throwing = Object.create(null) as Record<string, unknown>;
    Object.defineProperty(throwing, "value", {
      enumerable: true,
      get() {
        invocationCount += 1;
        throw new Error("synthetic private source value");
      },
    });
    expect(serializeCanonicalValue(throwing)).toEqual({
      ok: false,
      error: { code: "ti_v3_canonical_accessor_forbidden", path: "$.value" },
    });
    expect(invocationCount).toBe(0);

    const stateful = Object.create(null) as Record<string, unknown>;
    Object.defineProperty(stateful, "value", {
      enumerable: true,
      get() {
        invocationCount += 1;
        return invocationCount % 2 === 0 ? "a" : "b";
      },
    });
    expect(serializeCanonicalValue(stateful)).toMatchObject({
      ok: false,
      error: { code: "ti_v3_canonical_accessor_forbidden" },
    });
    expect(invocationCount).toBe(0);

    const setterOnly = Object.create(null) as Record<string, unknown>;
    Object.defineProperty(setterOnly, "value", {
      enumerable: true,
      set() {},
    });
    expect(serializeCanonicalValue(setterOnly)).toMatchObject({
      ok: false,
      error: { code: "ti_v3_canonical_accessor_forbidden" },
    });
  });

  it("rejects self and mutual cycles with stable failures", () => {
    const self = Object.create(null) as Record<string, unknown>;
    self.self = self;
    expect(serializeCanonicalValue(self)).toEqual({
      ok: false,
      error: { code: "ti_v3_canonical_cycle_forbidden", path: "$.self" },
    });

    const left = Object.create(null) as Record<string, unknown>;
    const right = Object.create(null) as Record<string, unknown>;
    left.right = right;
    right.left = left;
    expect(serializeCanonicalValue(left)).toEqual({
      ok: false,
      error: { code: "ti_v3_canonical_cycle_forbidden", path: "$.right.left" },
    });
  });

  it("enforces deterministic depth boundaries for direct and strict JSON input", () => {
    let passing: unknown = "leaf";
    for (let index = 0; index < CANONICAL_SERIALIZATION_LIMITS.maxDepth; index += 1) {
      passing = [passing];
    }
    expect(serializeCanonicalValue(passing).ok).toBe(true);

    const failing = [passing];
    expect(serializeCanonicalValue(failing)).toMatchObject({
      ok: false,
      error: { code: "ti_v3_canonical_depth_exceeded" },
    });

    const rawPassing = `${"[".repeat(CANONICAL_SERIALIZATION_LIMITS.maxDepth)}"leaf"${"]".repeat(CANONICAL_SERIALIZATION_LIMITS.maxDepth)}`;
    const rawFailing = `[${rawPassing}]`;
    expect(parseStrictCanonicalJson(rawPassing).ok).toBe(true);
    expect(parseStrictCanonicalJson(rawFailing)).toMatchObject({
      ok: false,
      error: { code: "ti_v3_canonical_depth_exceeded" },
    });
  });

  it("enforces deterministic node and key count boundaries", () => {
    expect(
      serializeCanonicalValue(
        Array.from({ length: CANONICAL_SERIALIZATION_LIMITS.maxNodeCount - 1 }, () => null),
      ).ok,
    ).toBe(true);
    expect(
      serializeCanonicalValue(
        Array.from({ length: CANONICAL_SERIALIZATION_LIMITS.maxNodeCount }, () => null),
      ),
    ).toMatchObject({
      ok: false,
      error: { code: "ti_v3_canonical_node_count_exceeded" },
    });

    const atKeyLimit = Object.create(null) as Record<string, string>;
    for (let index = 0; index < CANONICAL_SERIALIZATION_LIMITS.maxKeyCount; index += 1) {
      atKeyLimit[`k${index}`] = "v";
    }
    expect(serializeCanonicalValue(atKeyLimit).ok).toBe(true);
    atKeyLimit.extra = "v";
    expect(serializeCanonicalValue(atKeyLimit)).toMatchObject({
      ok: false,
      error: { code: "ti_v3_canonical_key_count_exceeded" },
    });
  });

  it("enforces individual and aggregate string size boundaries", () => {
    expect(
      serializeCanonicalValue("x".repeat(CANONICAL_SERIALIZATION_LIMITS.maxStringCodeUnits)).ok,
    ).toBe(true);
    expect(
      serializeCanonicalValue("x".repeat(CANONICAL_SERIALIZATION_LIMITS.maxStringCodeUnits + 1)),
    ).toMatchObject({
      ok: false,
      error: { code: "ti_v3_canonical_string_size_exceeded" },
    });

    const nearAggregateLimit = Array.from({ length: 4 }, () =>
      "x".repeat(CANONICAL_SERIALIZATION_LIMITS.maxStringCodeUnits - 4),
    );
    expect(serializeCanonicalValue(nearAggregateLimit).ok).toBe(true);
    const overAggregateLimit = Array.from({ length: 4 }, () =>
      "x".repeat(CANONICAL_SERIALIZATION_LIMITS.maxStringCodeUnits),
    );
    expect(serializeCanonicalValue(overAggregateLimit)).toMatchObject({
      ok: false,
      error: { code: "ti_v3_canonical_aggregate_size_exceeded" },
    });
  });

  it("rejects symbol and nonenumerable own properties explicitly", () => {
    const symbolKeyed = { safe: "value" } as Record<string | symbol, unknown>;
    symbolKeyed[Symbol("synthetic")] = "hidden";
    expect(serializeCanonicalValue(symbolKeyed)).toMatchObject({
      ok: false,
      error: { code: "ti_v3_canonical_symbol_key_forbidden" },
    });

    const nonenumerable = { safe: "value" };
    Object.defineProperty(nonenumerable, "hidden", { enumerable: false, value: "synthetic" });
    expect(serializeCanonicalValue(nonenumerable)).toMatchObject({
      ok: false,
      error: { code: "ti_v3_canonical_nonenumerable_property_forbidden" },
    });
  });

  it("matches the canonical SHA-256 golden vector", () => {
    const identity = createCanonicalContentIdentity("canonical_content", "v1", {
      decimals: { zero: "0", price: "0.125" },
      b: "line\r\nend",
      a: "e\u0301",
    });
    expect(identity.ok).toBe(true);
    if (!identity.ok) return;
    expect(identity.value.digestHex).toBe(
      "cd057af3d1acc94fd1ba34ae5ee610495f8747aa0594fbf673a45116013684e7",
    );
    expect(identity.value.identifier).toBe(
      "ti_v3:canonical_content:v1:sha256:cd057af3d1acc94fd1ba34ae5ee610495f8747aa0594fbf673a45116013684e7",
    );
  });

  it("creates validated domain-separated source-document identity", () => {
    expect(createCanonicalSourceDocumentDigest(new TextEncoder().encode("synthetic\n"))).toMatch(
      /^ti_v3:canonical_source_document:v1:sha256:[0-9a-f]{64}$/,
    );
  });
});
