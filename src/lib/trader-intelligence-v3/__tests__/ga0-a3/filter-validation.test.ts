import { describe, expect, it } from "vitest";

import { buildCanonicalQueryFilter, buildValidatedPayloadEnvelope, parsePersistedJson, resolveRelativeDateRange, verifyValidatedPayloadEnvelope, type RelativeDateResolver } from "../../domain";
import type { CanonicalUtcTimestamp } from "../../domain/canonical";

describe("GA0-A3 canonical query filters", () => {
  it("resolves relative dates against an injected clock and retains DST, holiday, and early-close boundaries", () => {
    const resolver: RelativeDateResolver = {
      resolve(request) {
        expect(request.timezone).toBe("America/New_York");
        return { ok: true, value: { requestedStartDate: "2026-07-02", requestedEndDate: "2026-07-03", startAt: "2026-07-02T13:30:00.000000000Z" as CanonicalUtcTimestamp, endAt: "2026-07-03T17:00:00.000000000Z" as CanonicalUtcTimestamp, calendarPolicyKey: "ti_v3_nyse_calendar", calendarPolicyVersion: "v1", sessionEvidence: [{ sessionDate: "2026-07-03", state: "early_close", openAt: "2026-07-03T13:30:00.000000000Z" as CanonicalUtcTimestamp, closeAt: "2026-07-03T17:00:00.000000000Z" as CanonicalUtcTimestamp }] } };
      },
    };
    const result = resolveRelativeDateRange({ request: { relativeRange: "last_5_trading_sessions", requestedStartDate: null, requestedEndDate: null, dateBasis: "execution_date", timeBasis: "exchange_local", startBoundary: "inclusive", endBoundary: "inclusive", timezone: "America/New_York", calendarBasis: "trading_session" }, now: "2026-07-03T20:00:00.000000000Z" as CanonicalUtcTimestamp, resolver });
    expect(result.ok && result.value.relativeDateAnchorAt).toBe("2026-07-03T20:00:00.000000000Z");
    expect(result.ok && result.value.resolvedAbsoluteRange.endAt).toBe("2026-07-03T17:00:00.000000000Z");
  });

  it("normalizes duplicate order and fails closed on contradictory timezone or range", () => {
    const resolver: RelativeDateResolver = { resolve: () => ({ ok: true, value: { requestedStartDate: "2026-07-01", requestedEndDate: "2026-07-02", startAt: "2026-07-01T00:00:00.000000000Z" as CanonicalUtcTimestamp, endAt: "2026-07-02T00:00:00.000000000Z" as CanonicalUtcTimestamp, calendarPolicyKey: "ti_v3_utc_calendar", calendarPolicyVersion: "v1", sessionEvidence: [] } }) };
    const receipt = resolveRelativeDateRange({ request: { relativeRange: null, requestedStartDate: "2026-07-01", requestedEndDate: "2026-07-02", dateBasis: "execution_date", timeBasis: "utc", startBoundary: "inclusive", endBoundary: "exclusive", timezone: "UTC", calendarBasis: "calendar_day" }, now: "2026-07-03T00:00:00.000000000Z" as CanonicalUtcTimestamp, resolver });
    expect(receipt.ok).toBe(true); if (!receipt.ok) return;
    const base = { dateResolutionReceipt: receipt.value, accountFilters: ["account_b", "account_a", "account_a"], instrumentFilters: ["TSLA", "AAPL"], directionFilters: ["long"], sessionFilters: ["regular"], lifecycleFilters: ["position_closed"], setupFilter: null, outcomeFilters: ["gain"], currencyFilters: ["USD"], evidenceCapabilityFilters: ["export"], openPositionPolicy: "exclude_from_closed_trade_analytics", correctionCutoffAt: "2026-07-03T00:00:00.000000000Z", analysisCutoffAt: "2026-07-03T00:00:00.000000000Z", boundSnapshotDigest: null };
    const left = buildCanonicalQueryFilter(base);
    const right = buildCanonicalQueryFilter({ ...base, accountFilters: ["account_a", "account_b"], instrumentFilters: ["AAPL", "TSLA"] });
    expect(left.ok && right.ok && left.value.filterDigest).toBe(right.ok && right.value.filterDigest);
    expect(buildCanonicalQueryFilter({ ...base, dateResolutionReceipt: { ...receipt.value, requestedStartDate: "2026-06-30" } })).toMatchObject({ ok: false, error: { code: "ti_v3_filter_unverified" } });
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

  it("rejects raw, nested, and Unicode-normalized duplicate JSON keys before envelope validation", () => {
    const prefix = '{"schemaVersion":"ti_v3_payload_envelope_v1","payloadKind":"persisted_json","payloadVersion":"v1","payload":';
    const suffix = ',"payloadDigest":"ti_v3:canonical_content:v1:sha256:' + "0".repeat(64) + '","envelopeDigest":"ti_v3:payload_envelope:v1:sha256:' + "0".repeat(64) + '"}';
    for (const payload of ['{"same":"a","same":"b"}', '{"nested":{"same":"a","same":"b"}}', '{"e\\u0301":"a","é":"b"}']) {
      expect(parsePersistedJson(prefix + payload + suffix)).toMatchObject({ ok: false, error: { code: "ti_v3_canonical_duplicate_json_key" } });
    }
    expect(parsePersistedJson("x".repeat(1_000_001))).toMatchObject({ ok: false, error: { code: "ti_v3_validation_payload_oversized" } });
  });

  it("does not invoke accessors and converts hostile reflection failures into stable errors", () => {
    let getterCalls = 0;
    const accessorPayload = Object.create(null) as Record<string, unknown>;
    Object.defineProperty(accessorPayload, "secret", { enumerable: true, get() { getterCalls += 1; return "not-read"; } });
    expect(buildValidatedPayloadEnvelope({ payloadKind: "persisted_json", payloadVersion: "v1", payload: accessorPayload })).toMatchObject({ ok: false, error: { code: "ti_v3_validation_input_invalid" } });
    expect(getterCalls).toBe(0);

    const { proxy, revoke } = Proxy.revocable({ safe: "synthetic" }, {});
    revoke();
    expect(buildValidatedPayloadEnvelope({ payloadKind: "persisted_json", payloadVersion: "v1", payload: proxy })).toMatchObject({ ok: false });

    const symbolPayload = { safe: "synthetic", [Symbol("unsafe")]: "hidden" };
    expect(buildValidatedPayloadEnvelope({ payloadKind: "persisted_json", payloadVersion: "v1", payload: symbolPayload })).toMatchObject({ ok: false });
    const hiddenPayload = { safe: "synthetic" };
    Object.defineProperty(hiddenPayload, "hidden", { value: "synthetic", enumerable: false });
    expect(buildValidatedPayloadEnvelope({ payloadKind: "persisted_json", payloadVersion: "v1", payload: hiddenPayload })).toMatchObject({ ok: false });
  });
});
