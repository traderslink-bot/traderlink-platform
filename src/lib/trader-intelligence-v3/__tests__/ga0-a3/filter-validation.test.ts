import { describe, expect, it } from "vitest";

import { buildCanonicalQueryFilter, buildValidatedPayloadEnvelope, resolveRelativeDateRange, verifyValidatedPayloadEnvelope, type RelativeDateResolver } from "../../domain";
import type { CanonicalUtcTimestamp } from "../../domain/canonical";

describe("GA0-A3 canonical query filters", () => {
  it("resolves relative dates against an injected clock and retains DST, holiday, and early-close boundaries", () => {
    const resolver: RelativeDateResolver = {
      resolve(request) {
        expect(request.timezone).toBe("America/New_York");
        return { ok: true, value: { requestedStartDate: "2026-07-02", requestedEndDate: "2026-07-03", startAt: "2026-07-02T13:30:00.000000000Z" as CanonicalUtcTimestamp, endAt: "2026-07-03T17:00:00.000000000Z" as CanonicalUtcTimestamp } };
      },
    };
    const result = resolveRelativeDateRange({ request: { relativeRange: "last_5_trading_sessions", timezone: "America/New_York", calendarBasis: "trading_session" }, now: "2026-07-03T20:00:00.000000000Z" as CanonicalUtcTimestamp, resolver });
    expect(result.ok && result.value.relativeDateAnchorAt).toBe("2026-07-03T20:00:00.000000000Z");
    expect(result.ok && result.value.resolvedAbsoluteRange.endAt).toBe("2026-07-03T17:00:00.000000000Z");
  });

  it("normalizes duplicate order and fails closed on contradictory timezone or range", () => {
    const base = { dateBasis: "execution_date", timeBasis: "utc", timezone: "UTC", requestedStartDate: "2026-07-01", requestedEndDate: "2026-07-02", startBoundary: "inclusive", endBoundary: "exclusive", calendarBasis: "calendar_day", relativeDateAnchorAt: null, resolvedAbsoluteRange: { startAt: "2026-07-01T00:00:00.000000000Z", endAt: "2026-07-02T00:00:00.000000000Z" }, accountFilters: ["account_b", "account_a", "account_a"], instrumentFilters: ["TSLA", "AAPL"], directionFilters: ["long"], sessionFilters: ["regular"], lifecycleFilters: ["position_closed"], setupFilter: null, outcomeFilters: ["gain"], currencyFilters: ["USD"], evidenceCapabilityFilters: ["export"], openPositionPolicy: "exclude_from_closed_trade_analytics", correctionCutoffAt: "2026-07-03T00:00:00.000000000Z", analysisCutoffAt: "2026-07-03T00:00:00.000000000Z", boundSnapshotDigest: null };
    const left = buildCanonicalQueryFilter(base);
    const right = buildCanonicalQueryFilter({ ...base, accountFilters: ["account_a", "account_b"], instrumentFilters: ["AAPL", "TSLA"] });
    expect(left.ok && right.ok && left.value.filterDigest).toBe(right.ok && right.value.filterDigest);
    expect(buildCanonicalQueryFilter({ ...base, timezone: "America/New_York" })).toMatchObject({ ok: false, error: { code: "ti_v3_filter_contradictory" } });
  });
});

describe("GA0-A3 persisted and adapter payload validation", () => {
  it("rejects extra fields, unsupported versions, and inconsistent digests", () => {
    expect(buildValidatedPayloadEnvelope({ payloadKind: "tool_request", payloadVersion: "v2", payload: {} })).toMatchObject({ ok: false, error: { code: "ti_v3_payload_version_unsupported" } });
    const envelope = buildValidatedPayloadEnvelope({ payloadKind: "persisted_json", payloadVersion: "v1", payload: { safe: "synthetic" } });
    expect(envelope.ok).toBe(true);
    if (!envelope.ok) return;
    expect(verifyValidatedPayloadEnvelope({ ...envelope.value, payloadDigest: envelope.value.envelopeDigest })).toMatchObject({ ok: false, error: { code: "ti_v3_validation_digest_invalid" } });
    expect(verifyValidatedPayloadEnvelope({ ...envelope.value, unsafe: true })).toMatchObject({ ok: false });
  });
});
