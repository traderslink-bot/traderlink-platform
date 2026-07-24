import { describe, expect, it } from "vitest";

import {
  ANALYTICAL_PARTITION_VERSION,
  LOCAL_CURRENT_DATA_EXACT_AUTHORITY_UNAVAILABLE,
  buildAnalyticalPartitionReceipt,
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
import {
  createCanonicalContentIdentity,
  resolveRelativeDateRange,
  verifyStartingInventoryContract,
  type CanonicalUtcTimestamp,
  type RelativeDateResolver,
  type TradingSessionEvidence,
} from "../../domain";

function identityForGlobalExclusion() {
  const identity = createCanonicalContentIdentity(
    "canonical_content",
    "v1",
    { exclusion: "global_unassigned" },
  );
  if (!identity.ok) throw new Error(identity.error.code);
  return identity.value.identifier;
}

function newYorkReceipt(sessionEvidence: readonly TradingSessionEvidence[]) {
  const startDate = sessionEvidence[0].sessionDate;
  const endDate = sessionEvidence[sessionEvidence.length - 1].sessionDate;
  const resolver: RelativeDateResolver = { resolve: () => ({
    ok: true,
    value: {
      requestedStartDate: startDate, requestedEndDate: endDate,
      startAt: `${startDate}T00:00:00.000000000Z` as CanonicalUtcTimestamp,
      endAt: `${endDate}T23:59:59.999999999Z` as CanonicalUtcTimestamp,
      calendarPolicyKey: "ti_v3_nyse_calendar", calendarPolicyVersion: "v1", sessionEvidence,
    },
  }) };
  const result = resolveRelativeDateRange({
    request: { relativeRange: null, requestedStartDate: startDate, requestedEndDate: endDate, dateBasis: "trade_close_date", timeBasis: "exchange_local", startBoundary: "inclusive", endBoundary: "inclusive", timezone: "America/New_York", calendarBasis: "trading_session" },
    now: "2027-01-01T00:00:00.000000000Z" as CanonicalUtcTimestamp,
    resolver,
  });
  if (!result.ok) throw new Error(result.error.code);
  return result.value;
}

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
        session: "not_applicable",
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
      snapshot: {
        ...(authority.snapshot as Record<string, unknown>),
        analysisCutoffAt: "2026-07-19T00:00:00.000000000Z",
      },
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
      globalExclusionPolicyKey: _globalExclusionPolicyKey,
      globalExclusionPolicyVersion: _globalExclusionPolicyVersion,
      globalExcludedCandidateKeys: _globalExcludedCandidateKeys,
      currencyPartitions: _currencyPartitions,
      candidateCount: _candidateCount,
      includedCount: _includedCount,
      excludedCount: _excludedCount,
      exclusionCountsByReason: _reasonCounts,
      ...buildInput
    } = dataset.value;
    void _receiptDigest; void _currencyPartitions; void _candidateCount;
    void _includedCount; void _excludedCount; void _reasonCounts;
    void _globalExclusionPolicyKey; void _globalExclusionPolicyVersion;
    void _globalExcludedCandidateKeys;
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
    expect(readAnalyticalDataset(createSyntheticInMemoryReadOnlySource({
      ...authority,
      startingInventories: [{
        ...authority.startingInventories[0],
        asOf: "2026-07-17T00:00:00.000000000Z" as CanonicalUtcTimestamp,
      }],
    }))).toMatchObject({ ok: false, error: { code: "ti_v3_analytics_authority_unverified", path: "$.startingInventories[0]" } });
    expect(readAnalyticalDataset(createSyntheticInMemoryReadOnlySource({
      ...authority,
      dateResolutionReceipt: { ...authority.dateResolutionReceipt, calendarPolicyVersion: "v2" },
    }))).toMatchObject({ ok: false, error: { code: "ti_v3_analytics_authority_mismatch", path: "$.dateResolutionReceipt" } });
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
    if (result.ok) {
      expect(result.value.rows.map((row) => row.currency)).toEqual(["CAD", "USD"]);
      const cadPartition = buildAnalyticalPartitionReceipt({
        schemaVersion: ANALYTICAL_PARTITION_VERSION,
        datasetReceipt: result.value,
        currency: "CAD",
      });
      const usdPartition = buildAnalyticalPartitionReceipt({
        schemaVersion: ANALYTICAL_PARTITION_VERSION,
        datasetReceipt: result.value,
        currency: "USD",
      });
      expect(cadPartition).toMatchObject({
        ok: true,
        value: { currency: "CAD", includedCount: "1", excludedCount: "0" },
      });
      expect(usdPartition).toMatchObject({
        ok: true,
        value: { currency: "USD", includedCount: "1", excludedCount: "0" },
      });
      expect(cadPartition.ok && usdPartition.ok &&
        cadPartition.value.partitionDigest).not.toBe(
          usdPartition.ok ? usdPartition.value.partitionDigest : "",
        );
    }
  });

  it("retains excluded-only ledger scope and blocks global exclusions explicitly", () => {
    const excludedOnly = readAnalyticalDataset(
      createSyntheticInMemoryReadOnlySource(
        buildSyntheticGa0B1Authority(undefined, {
          filterOverrides: { outcomeFilters: ["loss"] },
        }),
      ),
    );
    expect(excludedOnly).toMatchObject({
      ok: true,
      value: {
        currencyPartitions: ["USD"],
        globalExcludedCandidateKeys: [],
        includedCount: "0",
        excludedCount: "1",
        excludedCandidates: [{
          scopeState: "ledger_scoped",
          canonicalOwnerKey: "owner_synthetic_primary",
          canonicalAccountKey: "account_synthetic_primary",
          stableInstrumentKey: "instrument_synthetic_equity",
          currency: "USD",
        }],
      },
    });
    if (!excludedOnly.ok) return;
    const excludedPartition = buildAnalyticalPartitionReceipt({
      schemaVersion: ANALYTICAL_PARTITION_VERSION,
      datasetReceipt: excludedOnly.value,
      currency: "USD",
    });
    expect(excludedPartition).toMatchObject({
      ok: true,
      value: {
        ownerScope: ["owner_synthetic_primary"],
        accountScope: ["account_synthetic_primary"],
        instrumentScope: ["instrument_synthetic_equity"],
        includedCount: "0",
        excludedCount: "1",
        candidateCount: "1",
      },
    });

    const executions = buildSyntheticGa0B1ClosedExecutions();
    const globalExclusion = readAnalyticalDataset(
      createSyntheticInMemoryReadOnlySource(
        buildSyntheticGa0B1Authority(executions, {
          manifestExclusions: [{
            evidenceDigest: identityForGlobalExclusion(),
            reasonCode: "ti_v3_global_source_excluded",
          }],
        }),
      ),
    );
    expect(globalExclusion).toMatchObject({
      ok: true,
      value: {
        candidateCount: "2",
        includedCount: "1",
        excludedCount: "1",
        globalExclusionPolicyKey:
          "ti_v3_global_exclusion_blocks_currency_partition",
        globalExcludedCandidateKeys: [expect.stringContaining("manifest:")],
        excludedCandidates: [{
          scopeState: "global_unassigned",
          canonicalOwnerKey: null,
          canonicalAccountKey: null,
          stableInstrumentKey: null,
          currency: null,
        }],
      },
    });
    if (!globalExclusion.ok) return;
    expect(buildAnalyticalPartitionReceipt({
      schemaVersion: ANALYTICAL_PARTITION_VERSION,
      datasetReceipt: globalExclusion.value,
      currency: "USD",
    })).toMatchObject({
      ok: false,
      error: {
        code: "ti_v3_analytics_contract_reference_mismatch",
        path: "$.datasetReceipt.globalExcludedCandidateKeys",
      },
    });
  });

  it("keeps an excluded-only CAD account visible in a separate exact partition", () => {
    const cad = [
      buildSyntheticCanonicalExecution({
        stableInstrumentKey: "instrument_synthetic_cad_equity",
        rawBrokerSymbol: "CADX",
        currency: "CAD",
        charges: [{ kind: "commission", amount: "0.1", currency: "CAD" }],
        executionId: "CAD-ONLY-BUY",
        orderId: "CAD-ONLY-ORDER-1",
        brokerExecutionIndex: "1",
        brokerFillSequence: "1",
        executedAt: "2026-07-18T15:00:00.000000000Z",
        side: "buy",
        quantity: "4",
        price: "2",
      }),
      buildSyntheticCanonicalExecution({
        stableInstrumentKey: "instrument_synthetic_cad_equity",
        rawBrokerSymbol: "CADX",
        currency: "CAD",
        charges: [{ kind: "commission", amount: "0.1", currency: "CAD" }],
        executionId: "CAD-ONLY-SELL",
        orderId: "CAD-ONLY-ORDER-2",
        brokerExecutionIndex: "2",
        brokerFillSequence: "2",
        originalSourceRowLocator: {
          kind: "row_number",
          value: "2",
          rowOrderPreserved: true,
        },
        executedAt: "2026-07-18T16:00:00.000000000Z",
        side: "sell",
        quantity: "4",
        price: "3",
      }),
    ];
    const result = readAnalyticalDataset(
      createSyntheticInMemoryReadOnlySource(
        buildSyntheticGa0B1Authority(cad, {
          filterOverrides: { outcomeFilters: ["loss"] },
        }),
      ),
    );
    expect(result).toMatchObject({
      ok: true,
      value: {
        currencyPartitions: ["CAD"],
        includedCount: "0",
        excludedCount: "1",
        excludedCandidates: [{
          scopeState: "ledger_scoped",
          canonicalAccountKey: "account_synthetic_primary",
          stableInstrumentKey: "instrument_synthetic_cad_equity",
          currency: "CAD",
        }],
      },
    });
    if (!result.ok) return;
    expect(buildAnalyticalPartitionReceipt({
      schemaVersion: ANALYTICAL_PARTITION_VERSION,
      datasetReceipt: result.value,
      currency: "CAD",
    })).toMatchObject({
      ok: true,
      value: {
        accountScope: ["account_synthetic_primary"],
        instrumentScope: ["instrument_synthetic_cad_equity"],
        includedCount: "0",
        excludedCount: "1",
        candidateCount: "1",
      },
    });
    expect(buildAnalyticalPartitionReceipt({
      schemaVersion: ANALYTICAL_PARTITION_VERSION,
      datasetReceipt: result.value,
      currency: "USD",
    })).toMatchObject({
      ok: false,
      error: {
        code: "ti_v3_analytics_contract_reference_mismatch",
        path: "$.currency",
      },
    });
  });

  it("reconciles exact open overlap and rejects partial overlap", () => {
    const executions = buildSyntheticGa0B1ClosedExecutions();
    const ledgerKey =
      "account_synthetic_primary:instrument_synthetic_equity:usd";
    const exact = readAnalyticalDataset(createSyntheticInMemoryReadOnlySource(
      buildSyntheticGa0B1Authority(executions, {
        openPositions: [{
          ledgerKey,
          executionDigests: executions.map(
            (execution) => execution.canonicalContentDigest,
          ),
        }],
      }),
    ));
    expect(exact).toMatchObject({
      ok: true,
      value: {
        candidateCount: "1",
        includedCount: "0",
        excludedCount: "1",
        excludedCandidates: [{
          semanticRoundTripKey: expect.any(String),
          reasonCode: "ti_v3_analytics_open_or_incomplete_lifecycle",
          scopeState: "ledger_scoped",
          relatedExecutionDigests: expect.arrayContaining(
            executions.map((execution) => execution.canonicalContentDigest),
          ),
        }],
      },
    });
    const permuted = readAnalyticalDataset(createSyntheticInMemoryReadOnlySource(
      buildSyntheticGa0B1Authority(executions, {
        openPositions: [{
          ledgerKey,
          executionDigests: executions
            .map((execution) => execution.canonicalContentDigest)
            .reverse(),
        }],
      }),
    ));
    expect(exact.ok && permuted.ok && permuted.value.receiptDigest).toBe(
      exact.ok ? exact.value.receiptDigest : "failed",
    );
    const partial = readAnalyticalDataset(createSyntheticInMemoryReadOnlySource(
      buildSyntheticGa0B1Authority(executions, {
        openPositions: [{
          ledgerKey,
          executionDigests: [executions[0].canonicalContentDigest],
        }],
      }),
    ));
    expect(partial).toMatchObject({
      ok: false,
      error: {
        code: "ti_v3_analytics_authority_mismatch",
        path: "$.candidateAccounting.partialOverlap",
      },
    });
  });

  it("maps manifest reasons truthfully and counts an overlapping semantic candidate once", () => {
    const executions = buildSyntheticGa0B1ClosedExecutions();
    const result = readAnalyticalDataset(createSyntheticInMemoryReadOnlySource(buildSyntheticGa0B1Authority(executions, {
      manifestExclusions: [{ evidenceDigest: executions[0].canonicalContentDigest, reasonCode: "ti_v3_coverage_source_excluded" }],
    })));
    expect(result).toMatchObject({ ok: true, value: {
      candidateCount: "1", includedCount: "0", excludedCount: "1",
      excludedCandidates: [{
        reasonCode: "ti_v3_analytics_reconstruction_blocked",
        sourceReasonCode: "ti_v3_coverage_source_excluded",
        reasonMappingPolicyKey: "ti_v3_manifest_exclusion_reason_mapping",
        reasonMappingPolicyVersion: "v1",
      }],
    } });
  });

  it("retains filter and manifest provenance under deterministic reason precedence", () => {
    const executions = buildSyntheticGa0B1ClosedExecutions();
    const result = readAnalyticalDataset(createSyntheticInMemoryReadOnlySource(
      buildSyntheticGa0B1Authority(executions, {
        filterOverrides: { outcomeFilters: ["loss"] },
        manifestExclusions: [{
          evidenceDigest: executions[0].canonicalContentDigest,
          reasonCode: "ti_v3_coverage_source_excluded",
        }],
      }),
    ));
    expect(result).toMatchObject({
      ok: true,
      value: {
        includedCount: "0",
        excludedCount: "1",
        excludedCandidates: [{
          reasonCode: "ti_v3_analytics_reconstruction_blocked",
          secondaryReasonCodes: ["ti_v3_analytics_canonical_filter_excluded"],
          sourceReasonCodes: ["ti_v3_coverage_source_excluded"],
          reasonLedgerPolicyKey: "ti_v3_analytical_exclusion_reason_ledger",
          reasonLedgerPolicyVersion: "v1",
        }],
      },
    });
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

  it("separates UTC civil dates from filter-bound New York exchange sessions", () => {
    expect(resolveSessionFacts("2026-07-18T14:00:00.000000000Z", "UTC")).toMatchObject({ ok: true, value: { sessionDate: "2026-07-18", session: "not_applicable", weekday: "saturday" } });
    const standard = newYorkReceipt([{ sessionDate: "2026-03-06", state: "regular", openAt: "2026-03-06T14:30:00.000000000Z" as CanonicalUtcTimestamp, closeAt: "2026-03-06T21:00:00.000000000Z" as CanonicalUtcTimestamp, closureReasonCode: null }]);
    const daylight = newYorkReceipt([{ sessionDate: "2026-03-09", state: "regular", openAt: "2026-03-09T13:30:00.000000000Z" as CanonicalUtcTimestamp, closeAt: "2026-03-09T20:00:00.000000000Z" as CanonicalUtcTimestamp, closureReasonCode: null }]);
    expect(resolveSessionFacts("2026-03-06T15:00:00.000000000Z", "America/New_York", standard)).toMatchObject({ ok: true, value: { session: "regular", sessionDate: "2026-03-06" } });
    expect(resolveSessionFacts("2026-03-09T14:00:00.000000000Z", "America/New_York", daylight)).toMatchObject({ ok: true, value: { session: "regular", sessionDate: "2026-03-09" } });
    const earlyClose = newYorkReceipt([{ sessionDate: "2026-11-27", state: "early_close", openAt: "2026-11-27T14:30:00.000000000Z" as CanonicalUtcTimestamp, closeAt: "2026-11-27T18:00:00.000000000Z" as CanonicalUtcTimestamp, closureReasonCode: "ti_v3_nyse_early_close" }]);
    expect(resolveSessionFacts("2026-11-27T18:30:00.000000000Z", "America/New_York", earlyClose)).toMatchObject({ ok: true, value: { session: "after_hours" } });
    const holiday = newYorkReceipt([{ sessionDate: "2026-12-25", state: "holiday", openAt: null, closeAt: null, closureReasonCode: "ti_v3_nyse_holiday" }]);
    expect(resolveSessionFacts("2026-12-25T15:00:00.000000000Z", "America/New_York", holiday)).toMatchObject({ ok: false });
    expect(resolveSessionFacts("2026-07-18T15:00:00.000000000Z", "America/New_York", daylight)).toMatchObject({ ok: false });
    expect(resolveSessionFacts("2006-07-18T15:00:00.000000000Z", "America/New_York", daylight)).toMatchObject({ ok: false, error: { path: "$.timestamp.pre_2007_new_york_unsupported" } });
    const earliestSupported = newYorkReceipt([{ sessionDate: "2007-03-12", state: "regular", openAt: "2007-03-12T13:30:00.000000000Z" as CanonicalUtcTimestamp, closeAt: "2007-03-12T20:00:00.000000000Z" as CanonicalUtcTimestamp, closureReasonCode: null }]);
    expect(resolveSessionFacts("2007-03-12T14:00:00.000000000Z", "America/New_York", earliestSupported)).toMatchObject({ ok: true, value: { session: "regular", sessionDate: "2007-03-12" } });
  });

  it("rejects weekend New York exchange-session evidence", () => {
    expect(() => newYorkReceipt([{
      sessionDate: "2026-07-18",
      state: "regular",
      openAt: "2026-07-18T13:30:00.000000000Z" as CanonicalUtcTimestamp,
      closeAt: "2026-07-18T20:00:00.000000000Z" as CanonicalUtcTimestamp,
      closureReasonCode: null,
    }])).toThrow();
    expect(() => newYorkReceipt([{
      sessionDate: "2026-07-19",
      state: "early_close",
      openAt: "2026-07-19T13:30:00.000000000Z" as CanonicalUtcTimestamp,
      closeAt: "2026-07-19T17:00:00.000000000Z" as CanonicalUtcTimestamp,
      closureReasonCode: "ti_v3_synthetic_early_close",
    }])).toThrow();
  });

  it("strictly rejects hostile or extended starting-inventory re-entry", () => {
    const authority = buildSyntheticGa0B1Authority();
    const inventory = authority.startingInventories[0];
    expect(verifyStartingInventoryContract({
      ...inventory,
      unexpected: "synthetic",
    })).toMatchObject({ ok: false });
    expect(verifyStartingInventoryContract({
      ...inventory,
      ledgerIdentity: {
        ...inventory.ledgerIdentity,
        unexpected: "synthetic",
      },
    })).toMatchObject({ ok: false });
    let calls = 0;
    const accessor = Object.create(null) as Record<string, unknown>;
    Object.defineProperty(accessor, "policyVersion", {
      enumerable: true,
      get() {
        calls += 1;
        throw new Error("must not run");
      },
    });
    expect(verifyStartingInventoryContract(accessor)).toMatchObject({ ok: false });
    expect(calls).toBe(0);
    const proxied = new Proxy(inventory, {});
    expect(verifyStartingInventoryContract(proxied)).toMatchObject({ ok: false });
    expect(readAnalyticalDataset(createSyntheticInMemoryReadOnlySource({
      ...authority,
      startingInventories: [proxied],
    }))).toMatchObject({
      ok: false,
      error: { code: "ti_v3_analytics_authority_unverified" },
    });
    const persisted = JSON.parse(JSON.stringify(inventory)) as unknown;
    expect(verifyStartingInventoryContract(persisted)).toMatchObject({
      ok: true,
      value: { contractDigest: inventory.contractDigest },
    });
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
