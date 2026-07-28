import { describe, expect, it } from "vitest";

import {
  buildCanonicalExecution,
  buildStartingInventoryForExecution,
  type CanonicalUtcTimestamp,
} from "../domain";
import {
  createPersistedExecutionAnalyticsAuthoritySource,
  ingestAndBuildPersistedRawBrokerCsvImport,
  type PersistedExecutionAnalyticsAuthorityAttachment,
} from "../ingestion";
import { createSnapshotTradeQueryDatasetSource } from "../analytics/query/gateway/read-only-query-gateway";
import { readAnalyticalDatasetWithDerivation } from "../analytics/adapters";

const mapping = { symbol: "Symbol", executedAt: "ExecutedAt", side: "Side", quantity: "Quantity", price: "Price", currency: "Currency" } as const;
const utc = (value: string): CanonicalUtcTimestamp => value as CanonicalUtcTimestamp;

describe("persisted execution analytics authority", () => {
  it("requires explicit statement, correction, and starting-inventory authority before reading v3 data", () => {
    const persisted = ingestAndBuildPersistedRawBrokerCsvImport({
      csvUtf8: new TextEncoder().encode([
        "Symbol,ExecutedAt,Side,Quantity,Price,Currency",
        "TEST,2026-07-18T13:45:00.000000000Z,buy,2,1.25,USD",
        "TEST,2026-07-18T14:45:00.000000000Z,sell,2,1.75,USD",
      ].join("\n")),
      canonicalOwnerKey: "owner_primary",
      canonicalAccountKey: "account_primary",
      sourceIdentity: "source_statement_primary",
      sourceSystem: "ibkr_csv",
      brokerCode: "ibkr",
      columnMapping: mapping,
      timestampPrecision: "nanosecond",
      sourceTimezoneEvidence: "broker_csv_explicit_utc",
      chargeCoverageState: "complete",
      resolveInstrument: () => ({ state: "resolved", stableInstrumentKey: "instrument_nasdaq_test", securityType: "common_stock", basisContinuityState: "resolved" }),
    });
    expect(persisted.ok).toBe(true);
    if (!persisted.ok) return;
    const execution = buildCanonicalExecution({ ...persisted.value.acceptedExecutions[0]!.content, validation: persisted.value.acceptedExecutions[0]!.validation });
    expect(execution.ok).toBe(true);
    if (!execution.ok) return;
    const inventory = buildStartingInventoryForExecution(execution.value, "proven_flat");
    expect(inventory.ok).toBe(true);
    if (!inventory.ok) return;
    const attachment: PersistedExecutionAnalyticsAuthorityAttachment = {
      analysisCutoffAt: utc("2026-07-20T23:59:59.999999999Z"),
      correctionCutoffAt: utc("2026-07-20T23:59:59.999999999Z"),
      dateAuthority: { request: { relativeRange: null, requestedStartDate: "2026-07-01", requestedEndDate: "2026-07-20", dateBasis: "trade_close_date", timeBasis: "utc", timezone: "UTC", startBoundary: "inclusive", endBoundary: "inclusive", calendarBasis: "calendar_day" } as const, startAt: utc("2026-07-01T00:00:00.000000000Z"), endAt: utc("2026-07-20T23:59:59.999999999Z"), calendarPolicyKey: "ti_v3_utc_calendar", calendarPolicyVersion: "v1" },
      sourceDocuments: [{ sourceDocumentDigest: persisted.value.sourceDocumentDigest, sourceKind: "broker_csv" as const, statementPeriods: [{ startAt: utc("2026-07-01T00:00:00.000000000Z"), endAt: utc("2026-07-21T00:00:00.000000000Z"), startInclusive: true, endInclusive: false }], deletionState: "present" as const }],
      statementPeriods: [{ startAt: utc("2026-07-01T00:00:00.000000000Z"), endAt: utc("2026-07-21T00:00:00.000000000Z"), startInclusive: true, endInclusive: false }],
      knownGaps: [], overlappingPeriods: [], coverageStates: ["complete_account_period" as const], corrections: [], startingInventories: [inventory.value],
    };
    const source = createPersistedExecutionAnalyticsAuthoritySource({ records: [persisted.value], attachment });
    const dataset = readAnalyticalDatasetWithDerivation(source);
    expect(dataset.ok).toBe(true);
    if (!dataset.ok) return;
    expect(dataset.value.datasetReceipt.rows).toHaveLength(1);
    expect(createSnapshotTradeQueryDatasetSource(source).readVerifiedDataset()).toMatchObject({ ok: true });
    const missingInventory = createPersistedExecutionAnalyticsAuthoritySource({ records: [persisted.value], attachment: { ...attachment, startingInventories: [] } });
    expect(missingInventory.readExactAuthority()).toMatchObject({ state: "unavailable" });
    const partialCoverage = createPersistedExecutionAnalyticsAuthoritySource({ records: [persisted.value], attachment: { ...attachment, coverageStates: ["partial_account_period"] } });
    expect(partialCoverage.readExactAuthority()).toMatchObject({ state: "unavailable" });
  });
});
