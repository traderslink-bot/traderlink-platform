import { describe, expect, it } from "vitest";

import {
  LOCAL_CURRENT_DATA_EXACT_AUTHORITY_UNAVAILABLE,
  buildAnalyticalDatasetReceipt,
  createLocalCurrentDataReadOnlyBridge,
  createSyntheticInMemoryReadOnlySource,
  readAnalyticalDataset,
  resolveSessionFacts,
  verifyAnalyticalDatasetReceipt,
} from "../../analytics";
import {
  buildSyntheticCanonicalExecution,
  buildSyntheticGa0B1Authority,
  buildSyntheticGa0B1ClosedExecutions,
} from "../../testing";

describe("GA0-B1 snapshot-bound analytical dataset", () => {
  it("copies exact reconstruction truth into one verified, immutable closed-round-trip row", () => {
    const authority = buildSyntheticGa0B1Authority();
    const result = readAnalyticalDataset(createSyntheticInMemoryReadOnlySource(authority));
    expect(result).toMatchObject({ ok: true });
    if (!result.ok) return;
    expect(result.value).toMatchObject({
      candidateCount: "1",
      includedCount: "1",
      excludedCount: "0",
      currencyPartitions: ["USD"],
      rows: [{
        direction: "long",
        currency: "USD",
        firstEntryAt: "2026-07-18T13:45:12.000000000Z",
        finalExitAt: "2026-07-18T14:45:12.000000000Z",
        sessionDate: "2026-07-18",
        weekday: "saturday",
        session: "regular",
        sequenceInPartition: "1",
        grossPnl: "5",
        signedCharges: "0.5",
        netPnl: "4.5",
        entryNotional: { state: "available", amount: "12.5", currency: "USD" },
        shareQuantity: { state: "available", quantity: "10" },
      }],
    });
    expect(result.value.rows[0].grossPnl).toBe(authority.reconstruction.ledgers[0].flatToFlatRoundTrips[0].grossRealizedPnl);
    expect(result.value.rows[0].rowDigest).not.toBe(result.value.receiptDigest);
    expect(verifyAnalyticalDatasetReceipt(result.value)).toMatchObject({ ok: true });
    expect(Object.isFrozen(result.value)).toBe(true);
    expect(Object.isFrozen(result.value.rows[0].entryNotional)).toBe(true);
    expect(() => (result.value.rows as unknown[]).push({})).toThrow();
  });

  it("is invariant to source labels and catalog order but rejects supplied identity tampering", () => {
    const authority = buildSyntheticGa0B1Authority();
    const reversed = {
      ...authority,
      acceptedExecutionCatalog: [...authority.acceptedExecutionCatalog].reverse(),
      correctionAuthority: {
        ...authority.correctionAuthority,
        availableExecutionCatalog: [...authority.correctionAuthority.availableExecutionCatalog].reverse(),
      },
    };
    const left = readAnalyticalDataset(createSyntheticInMemoryReadOnlySource(authority));
    const right = readAnalyticalDataset({
      ...createSyntheticInMemoryReadOnlySource(reversed),
      sourceKey: "persistence_row_999",
    });
    expect(left.ok && right.ok && right.value.receiptDigest).toBe(left.ok ? left.value.receiptDigest : "failed");
    if (!left.ok) return;
    expect(verifyAnalyticalDatasetReceipt({
      ...left.value,
      rows: [{ ...left.value.rows[0], netPnl: "999" }],
    })).toMatchObject({ ok: false, error: { code: "ti_v3_analytics_contract_digest_mismatch" } });
    const tamperedAuthority = {
      ...authority,
      snapshot: { ...authority.snapshot, analysisCutoffAt: "2026-07-19T00:00:00.000000000Z" },
    };
    expect(readAnalyticalDataset(createSyntheticInMemoryReadOnlySource(tamperedAuthority))).toMatchObject({
      ok: false,
      error: { code: "ti_v3_analytics_authority_unverified", path: "$.snapshot" },
    });
  });

  it("rejects duplicate candidate identities, mixed row currency facts, and oversized row input", () => {
    const dataset = readAnalyticalDataset(createSyntheticInMemoryReadOnlySource(buildSyntheticGa0B1Authority()));
    expect(dataset.ok).toBe(true);
    if (!dataset.ok) return;
    const {
      receiptDigest: _receiptDigest,
      currencyPartitions: _currencyPartitions,
      candidateCount: _candidateCount,
      includedCount: _includedCount,
      excludedCount: _excludedCount,
      exclusionCountsByReason: _reasonCounts,
      ...buildInput
    } = dataset.value;
    void _receiptDigest; void _currencyPartitions; void _candidateCount;
    void _includedCount; void _excludedCount; void _reasonCounts;
    expect(buildAnalyticalDatasetReceipt({
      ...buildInput,
      rows: [dataset.value.rows[0], dataset.value.rows[0]],
    })).toMatchObject({ ok: false, error: { code: "ti_v3_analytics_contract_duplicate_identity" } });
    expect(buildAnalyticalDatasetReceipt({
      ...buildInput,
      rows: Array.from({ length: 65 }, () => dataset.value.rows[0]),
    })).toMatchObject({ ok: false, error: { code: "ti_v3_analytics_contract_oversized" } });
    expect(verifyAnalyticalDatasetReceipt({
      ...dataset.value,
      rows: [{
        ...dataset.value.rows[0],
        entryNotional: { state: "available", amount: "12.5", currency: "CAD" },
      }],
    })).toMatchObject({ ok: false });
  });

  it("fails closed on mixed dependencies and exact reconstruction authority", () => {
    const authority = buildSyntheticGa0B1Authority();
    const filtered = buildSyntheticGa0B1Authority(undefined, {
      filterOverrides: { outcomeFilters: ["loss"] },
    });
    expect(readAnalyticalDataset(createSyntheticInMemoryReadOnlySource({
      ...authority,
      snapshotDependencies: {
        ...authority.snapshotDependencies,
        filter: filtered.snapshotDependencies.filter,
      },
    }))).toMatchObject({ ok: false, error: { code: "ti_v3_analytics_authority_unverified" } });
    expect(readAnalyticalDataset(createSyntheticInMemoryReadOnlySource({
      ...authority,
      reconstruction: filtered.reconstruction,
    }))).toMatchObject({ ok: true });
    const foreignExecutions = buildSyntheticGa0B1ClosedExecutions().map((execution, index) =>
      index === 0 ? buildSyntheticCanonicalExecution({ executionId: "FOREIGN", brokerExecutionIndex: "9" }) : execution,
    );
    const foreign = buildSyntheticGa0B1Authority(foreignExecutions);
    expect(readAnalyticalDataset(createSyntheticInMemoryReadOnlySource({
      ...authority,
      correctionAuthority: {
        ...authority.correctionAuthority,
        result: foreign.correctionAuthority.result,
      },
    }))).toMatchObject({ ok: false, error: { code: "ti_v3_analytics_authority_mismatch", path: "$.correctionAuthority.result" } });
    expect(readAnalyticalDataset(createSyntheticInMemoryReadOnlySource({
      ...authority,
      reconstruction: foreign.reconstruction,
    }))).toMatchObject({ ok: false, error: { code: "ti_v3_analytics_authority_mismatch", path: "$.reconstruction" } });
  });

  it("accounts visibly for canonical-filter, missing-inventory, and open-position exclusions", () => {
    const filtered = readAnalyticalDataset(createSyntheticInMemoryReadOnlySource(
      buildSyntheticGa0B1Authority(undefined, { filterOverrides: { outcomeFilters: ["loss"] } }),
    ));
    expect(filtered).toMatchObject({ ok: true, value: {
      candidateCount: "1", includedCount: "0", excludedCount: "1",
      exclusionCountsByReason: [{ reasonCode: "ti_v3_analytics_canonical_filter_excluded", count: "1" }],
    } });
    const missingRoundTrip = readAnalyticalDataset(createSyntheticInMemoryReadOnlySource(
      buildSyntheticGa0B1Authority(undefined, { includeRoundTripInventory: false }),
    ));
    expect(missingRoundTrip).toMatchObject({ ok: true, value: {
      includedCount: "0", excludedCount: "1",
      excludedCandidates: [{ reasonCode: "ti_v3_analytics_round_trip_inventory_missing" }],
    } });
    const missingOccurrence = readAnalyticalDataset(createSyntheticInMemoryReadOnlySource(
      buildSyntheticGa0B1Authority(undefined, { includeOccurrenceInventory: false }),
    ));
    expect(missingOccurrence).toMatchObject({ ok: true, value: {
      includedCount: "0", excludedCount: "1",
      excludedCandidates: [{ reasonCode: "ti_v3_analytics_occurrence_evidence_missing_or_foreign" }],
    } });
    const ineligible = readAnalyticalDataset(createSyntheticInMemoryReadOnlySource(
      buildSyntheticGa0B1Authority(undefined, { policyState: "pending_correction" }),
    ));
    expect(ineligible).toMatchObject({ ok: true, value: {
      includedCount: "0", excludedCount: "1",
      excludedCandidates: [{ reasonCode: "ti_v3_analytics_eligibility_blocked" }],
    } });
    const executions = [...buildSyntheticGa0B1ClosedExecutions(), buildSyntheticCanonicalExecution({
      executionId: "OPEN-BUY", orderId: "OPEN-ORDER", brokerExecutionIndex: "3",
      brokerFillSequence: "3", originalSourceRowLocator: { kind: "row_number", value: "3", rowOrderPreserved: true },
      executedAt: "2026-07-18T15:45:12.000000000Z", side: "buy", quantity: "2", price: "2",
    })];
    const openAuthority = buildSyntheticGa0B1Authority(executions, {
      openPositions: [{
        ledgerKey: "account_synthetic_primary:instrument_synthetic_equity:usd",
        executionDigests: [executions[2].canonicalContentDigest],
      }],
    });
    const open = readAnalyticalDataset(createSyntheticInMemoryReadOnlySource(openAuthority));
    expect(open).toMatchObject({ ok: true, value: {
      candidateCount: "2", includedCount: "1", excludedCount: "1",
      excludedCandidates: [{ reasonCode: "ti_v3_analytics_open_or_incomplete_lifecycle" }],
    } });
  });

  it("partitions currencies and never aggregates their exact values", () => {
    const base = buildSyntheticGa0B1ClosedExecutions();
    const cad = [
      buildSyntheticCanonicalExecution({
        stableInstrumentKey: "instrument_synthetic_cad_equity", rawBrokerSymbol: "CADX",
        currency: "CAD", charges: [{ kind: "commission", amount: "0.1", currency: "CAD" }],
        executionId: "CAD-BUY", orderId: "CAD-ORDER-1", brokerExecutionIndex: "3", brokerFillSequence: "3",
        originalSourceRowLocator: { kind: "row_number", value: "3", rowOrderPreserved: true },
        executedAt: "2026-07-18T15:00:00.000000000Z", side: "buy", quantity: "4", price: "2",
      }),
      buildSyntheticCanonicalExecution({
        stableInstrumentKey: "instrument_synthetic_cad_equity", rawBrokerSymbol: "CADX",
        currency: "CAD", charges: [{ kind: "commission", amount: "0.1", currency: "CAD" }],
        executionId: "CAD-SELL", orderId: "CAD-ORDER-2", brokerExecutionIndex: "4", brokerFillSequence: "4",
        originalSourceRowLocator: { kind: "row_number", value: "4", rowOrderPreserved: true },
        executedAt: "2026-07-18T16:00:00.000000000Z", side: "sell", quantity: "4", price: "3",
      }),
    ];
    const result = readAnalyticalDataset(createSyntheticInMemoryReadOnlySource(
      buildSyntheticGa0B1Authority([...base, ...cad]),
    ));
    expect(result).toMatchObject({ ok: true, value: {
      currencyPartitions: ["CAD", "USD"], includedCount: "2",
    } });
    if (result.ok) expect(result.value.rows.map((row) => row.currency)).toEqual(["CAD", "USD"]);
  });

  it("assigns sequence from meaningful entry order and excludes a whole partition when that order is ambiguous", () => {
    const base = buildSyntheticGa0B1ClosedExecutions();
    const secondTrade = [
      buildSyntheticCanonicalExecution({
        stableInstrumentKey: "instrument_synthetic_second_equity", rawBrokerSymbol: "SYNB",
        executionId: "SECOND-BUY", orderId: "SECOND-ORDER-1", brokerExecutionIndex: "3", brokerFillSequence: "3",
        originalSourceRowLocator: { kind: "row_number", value: "3", rowOrderPreserved: true },
        executedAt: "2026-07-18T15:00:00.000000000Z", side: "buy", quantity: "2", price: "2",
      }),
      buildSyntheticCanonicalExecution({
        stableInstrumentKey: "instrument_synthetic_second_equity", rawBrokerSymbol: "SYNB",
        executionId: "SECOND-SELL", orderId: "SECOND-ORDER-2", brokerExecutionIndex: "4", brokerFillSequence: "4",
        originalSourceRowLocator: { kind: "row_number", value: "4", rowOrderPreserved: true },
        executedAt: "2026-07-18T16:00:00.000000000Z", side: "sell", quantity: "2", price: "3",
      }),
    ];
    const ordered = readAnalyticalDataset(createSyntheticInMemoryReadOnlySource(
      buildSyntheticGa0B1Authority([...base, ...secondTrade]),
    ));
    expect(ordered).toMatchObject({ ok: true, value: {
      includedCount: "2",
      rows: [{ sequenceInPartition: "1" }, { sequenceInPartition: "2" }],
    } });

    const ambiguous = [
      buildSyntheticCanonicalExecution({
        stableInstrumentKey: "instrument_ambiguous_a", rawBrokerSymbol: "AMBA",
        executionId: "AMB-A-BUY", orderId: "AMB-A-1", brokerExecutionIndex: null,
        brokerFillSequence: null, originalSourceRowLocator: { kind: "row_number", value: "11", rowOrderPreserved: false },
        executedAt: "2026-07-18T13:00:00.000000000Z", timestampPrecision: "second",
        side: "buy", quantity: "1", price: "1",
      }),
      buildSyntheticCanonicalExecution({
        stableInstrumentKey: "instrument_ambiguous_a", rawBrokerSymbol: "AMBA",
        executionId: "AMB-A-SELL", orderId: "AMB-A-2", brokerExecutionIndex: null,
        brokerFillSequence: null, originalSourceRowLocator: { kind: "row_number", value: "12", rowOrderPreserved: false },
        executedAt: "2026-07-18T14:00:00.000000000Z", timestampPrecision: "second",
        side: "sell", quantity: "1", price: "2",
      }),
      buildSyntheticCanonicalExecution({
        stableInstrumentKey: "instrument_ambiguous_b", rawBrokerSymbol: "AMBB",
        executionId: "AMB-B-BUY", orderId: "AMB-B-1", brokerExecutionIndex: null,
        brokerFillSequence: null, originalSourceRowLocator: { kind: "row_number", value: "21", rowOrderPreserved: false },
        executedAt: "2026-07-18T13:00:00.000000000Z", timestampPrecision: "second",
        side: "buy", quantity: "1", price: "3",
      }),
      buildSyntheticCanonicalExecution({
        stableInstrumentKey: "instrument_ambiguous_b", rawBrokerSymbol: "AMBB",
        executionId: "AMB-B-SELL", orderId: "AMB-B-2", brokerExecutionIndex: null,
        brokerFillSequence: null, originalSourceRowLocator: { kind: "row_number", value: "22", rowOrderPreserved: false },
        executedAt: "2026-07-18T15:00:00.000000000Z", timestampPrecision: "second",
        side: "sell", quantity: "1", price: "4",
      }),
    ];
    const blocked = readAnalyticalDataset(createSyntheticInMemoryReadOnlySource(
      buildSyntheticGa0B1Authority(ambiguous),
    ));
    expect(blocked).toMatchObject({ ok: true, value: {
      candidateCount: "2", includedCount: "0", excludedCount: "2",
      exclusionCountsByReason: [{ reasonCode: "ti_v3_analytics_economic_order_unprovable", count: "2" }],
    } });
  });

  it("resolves UTC/New York overnight and DST edges without locale APIs", () => {
    expect(resolveSessionFacts("2026-03-08T06:59:59.000000000Z", "America/New_York")).toMatchObject({ ok: true, value: { sessionDate: "2026-03-08", session: "overnight", weekday: "sunday" } });
    expect(resolveSessionFacts("2026-03-08T07:00:00.000000000Z", "America/New_York")).toMatchObject({ ok: true, value: { sessionDate: "2026-03-08", session: "overnight" } });
    expect(resolveSessionFacts("2026-11-01T05:30:00.000000000Z", "America/New_York")).toMatchObject({ ok: true, value: { sessionDate: "2026-11-01", session: "overnight" } });
    expect(resolveSessionFacts("2026-11-01T06:30:00.000000000Z", "America/New_York")).toMatchObject({ ok: true, value: { sessionDate: "2026-11-01", session: "overnight" } });
    expect(resolveSessionFacts("2026-07-18T02:00:00.000000000Z", "America/New_York")).toMatchObject({ ok: true, value: { sessionDate: "2026-07-17", weekday: "friday", session: "overnight" } });
  });

  it("keeps the production-shaped bridge read-only and truthfully unavailable without exact v3 authority", () => {
    const bridge = createLocalCurrentDataReadOnlyBridge();
    expect(Object.keys(bridge)).toEqual(["sourceKey", "sourceVersion", "readExactAuthority"]);
    expect(readAnalyticalDataset(bridge)).toMatchObject({
      ok: false,
      error: {
        code: "ti_v3_analytics_source_unavailable",
        reasonCode: LOCAL_CURRENT_DATA_EXACT_AUTHORITY_UNAVAILABLE,
      },
    });
  });
});
