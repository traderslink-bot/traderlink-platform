import { describe, expect, it } from "vitest";

import {
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
