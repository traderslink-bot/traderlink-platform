import { describe, expect, it } from "vitest";

import {
  parseCanonicalUtcTimestamp,
  timestampPrecisionIntervalNanoseconds,
} from "../domain";

describe("Trader Intelligence v3 canonical UTC timestamp", () => {
  it("accepts only fixed nine-digit UTC form", () => {
    expect(
      parseCanonicalUtcTimestamp("2026-07-18T13:45:12.123000000Z", "millisecond"),
    ).toEqual({ ok: true, value: "2026-07-18T13:45:12.123000000Z" });
    expect(parseCanonicalUtcTimestamp("2026-07-18T13:45:12.123Z", "millisecond")).toEqual({
      ok: false,
      error: { code: "ti_v3_timestamp_format_invalid" },
    });
    expect(parseCanonicalUtcTimestamp("2026-07-18T13:45:12.123000000+00:00", "millisecond")).toEqual({
      ok: false,
      error: { code: "ti_v3_timestamp_format_invalid" },
    });
  });

  it("validates Gregorian components and source precision", () => {
    expect(parseCanonicalUtcTimestamp("2024-02-29T00:00:00.000000000Z", "date").ok).toBe(true);
    expect(parseCanonicalUtcTimestamp("2025-02-29T00:00:00.000000000Z", "date")).toEqual({
      ok: false,
      error: { code: "ti_v3_timestamp_component_invalid" },
    });
    expect(parseCanonicalUtcTimestamp("2026-07-18T13:45:01.000000000Z", "minute")).toEqual({
      ok: false,
      error: { code: "ti_v3_timestamp_precision_evidence_conflict" },
    });
  });

  it("keeps lexical order chronological and exposes precision intervals", () => {
    const earlier = parseCanonicalUtcTimestamp("2026-07-18T13:45:12.000000000Z", "second");
    const later = parseCanonicalUtcTimestamp("2026-07-18T13:46:00.000000000Z", "minute");
    expect(earlier.ok && later.ok).toBe(true);
    if (!earlier.ok || !later.ok) return;
    expect(earlier.value < later.value).toBe(true);
    const interval = timestampPrecisionIntervalNanoseconds(earlier.value, "second");
    expect(interval.endExclusive === null ? null : interval.endExclusive - interval.start).toBe(
      BigInt(1_000_000_000),
    );
  });
});
