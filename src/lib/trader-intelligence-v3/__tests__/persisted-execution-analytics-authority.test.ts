import { describe, expect, it } from "vitest";

import {
  buildCanonicalExecution,
  buildStartingInventoryForExecution,
  type CanonicalUtcTimestamp,
  type StartingInventoryContract,
} from "../domain";
import {
  createPersistedExecutionAnalyticsAuthoritySource,
  ingestAndBuildPersistedRawBrokerCsvImport,
  type PersistedExecutionAnalyticsAuthorityAttachment,
  type PersistedRawBrokerCsvImport,
} from "../ingestion";
import { createSnapshotTradeQueryDatasetSource } from "../analytics/query/gateway/read-only-query-gateway";
import { readAnalyticalDatasetWithDerivation } from "../analytics/adapters";

const mapping = { symbol: "Symbol", executedAt: "ExecutedAt", side: "Side", quantity: "Quantity", price: "Price", currency: "Currency" } as const;
const utc = (value: string): CanonicalUtcTimestamp => value as CanonicalUtcTimestamp;

function buildValidPersistedImportFixture(args: {
  readonly owner?: string;
  readonly account?: string;
  readonly sourceIdentity?: string;
  readonly salePrice?: string;
} = {}): PersistedRawBrokerCsvImport {
  const persisted = ingestAndBuildPersistedRawBrokerCsvImport({
    csvUtf8: new TextEncoder().encode([
      "Symbol,ExecutedAt,Side,Quantity,Price,Currency",
      "TEST,2026-07-18T13:45:00.000000000Z,buy,2,1.25,USD",
      `TEST,2026-07-18T14:45:00.000000000Z,sell,2,${args.salePrice ?? "1.75"},USD`,
    ].join("\n")),
    canonicalOwnerKey: args.owner ?? "owner_primary",
    canonicalAccountKey: args.account ?? "account_primary",
    sourceIdentity: args.sourceIdentity ?? "source_statement_primary",
    sourceSystem: "ibkr_csv",
    brokerCode: "ibkr",
    columnMapping: mapping,
    timestampPrecision: "nanosecond",
    sourceTimezoneEvidence: "broker_csv_explicit_utc",
    chargeCoverageState: "complete",
    resolveInstrument: () => ({ state: "resolved", stableInstrumentKey: "instrument_nasdaq_test", securityType: "common_stock", basisContinuityState: "resolved" }),
  });
  if (!persisted.ok) throw new Error(persisted.error.code);
  return persisted.value;
}

function buildStartingInventoryFixture(persisted: PersistedRawBrokerCsvImport, state: "proven_flat" | "unknown" = "proven_flat"): StartingInventoryContract {
  const execution = buildCanonicalExecution({ ...persisted.acceptedExecutions[0]!.content, validation: persisted.acceptedExecutions[0]!.validation });
  if (!execution.ok) throw new Error(execution.error.code);
  const inventory = buildStartingInventoryForExecution(execution.value, state);
  if (!inventory.ok) throw new Error(inventory.error.code);
  return inventory.value;
}

function buildValidAuthorityAttachmentFixture(persisted: PersistedRawBrokerCsvImport): PersistedExecutionAnalyticsAuthorityAttachment {
  const period = { startAt: utc("2026-07-01T00:00:00.000000000Z"), endAt: utc("2026-07-21T00:00:00.000000000Z"), startInclusive: true, endInclusive: false } as const;
  return {
    analysisCutoffAt: utc("2026-07-20T23:59:59.999999999Z"),
    correctionCutoffAt: utc("2026-07-20T23:59:59.999999999Z"),
    dateAuthority: { request: { relativeRange: null, requestedStartDate: "2026-07-01", requestedEndDate: "2026-07-20", dateBasis: "trade_close_date", timeBasis: "utc", timezone: "UTC", startBoundary: "inclusive", endBoundary: "inclusive", calendarBasis: "calendar_day" } as const, startAt: utc("2026-07-01T00:00:00.000000000Z"), endAt: utc("2026-07-20T23:59:59.999999999Z"), calendarPolicyKey: "ti_v3_utc_calendar", calendarPolicyVersion: "v1" },
    sourceDocuments: [{ sourceDocumentDigest: persisted.sourceDocumentDigest, sourceKind: "broker_csv", statementPeriods: [period], deletionState: "present" }],
    statementPeriods: [period],
    knownGaps: [],
    overlappingPeriods: [],
    coverageStates: ["complete_account_period"],
    corrections: [],
    startingInventories: [buildStartingInventoryFixture(persisted)],
  };
}

function readAuthorityState(
  records: readonly PersistedRawBrokerCsvImport[],
  attachment: PersistedExecutionAnalyticsAuthorityAttachment,
) {
  return createPersistedExecutionAnalyticsAuthoritySource({ records, attachment }).readExactAuthority();
}

function expectUnavailable(
  records: readonly PersistedRawBrokerCsvImport[],
  attachment: PersistedExecutionAnalyticsAuthorityAttachment,
  reasonCode: string,
): void {
  expect(readAuthorityState(records, attachment)).toMatchObject({ state: "unavailable", reasonCode });
}

describe("persisted execution analytics authority", () => {
  it("requires explicit statement, correction, and starting-inventory authority before reading v3 data", () => {
    const persisted = buildValidPersistedImportFixture();
    const attachment = buildValidAuthorityAttachmentFixture(persisted);
    const source = createPersistedExecutionAnalyticsAuthoritySource({ records: [persisted], attachment });
    const dataset = readAnalyticalDatasetWithDerivation(source);
    expect(dataset.ok).toBe(true);
    if (!dataset.ok) return;
    expect(dataset.value.datasetReceipt.rows).toHaveLength(1);
    expect(createSnapshotTradeQueryDatasetSource(source).readVerifiedDataset()).toMatchObject({ ok: true });
    expectUnavailable([persisted], { ...attachment, startingInventories: [] }, "ti_v3_persisted_analytics_authority_attachment_incomplete");
    expectUnavailable([persisted], { ...attachment, coverageStates: ["partial_account_period"] }, "ti_v3_persisted_analytics_authority_attachment_incomplete");
  });

  it("rejects mixed owner or account records before creating authority", () => {
    const persisted = buildValidPersistedImportFixture();
    const attachment = buildValidAuthorityAttachmentFixture(persisted);
    const differentOwner = buildValidPersistedImportFixture({ owner: "owner_secondary", sourceIdentity: "source_statement_secondary" });
    const differentAccount = buildValidPersistedImportFixture({ account: "account_secondary", sourceIdentity: "source_statement_tertiary" });
    expectUnavailable([persisted, differentOwner], attachment, "ti_v3_persisted_analytics_authority_scope_mismatch");
    expectUnavailable([persisted, differentAccount], attachment, "ti_v3_persisted_analytics_authority_scope_mismatch");
  });

  it("rejects missing or unknown source document authority", () => {
    const persisted = buildValidPersistedImportFixture();
    const attachment = buildValidAuthorityAttachmentFixture(persisted);
    const unknown = buildValidPersistedImportFixture({ sourceIdentity: "source_statement_unknown", salePrice: "1.80" });
    expectUnavailable([persisted], { ...attachment, sourceDocuments: [] }, "ti_v3_persisted_analytics_authority_attachment_incomplete");
    expectUnavailable([persisted], {
      ...attachment,
      sourceDocuments: [{ ...attachment.sourceDocuments[0]!, sourceDocumentDigest: unknown.sourceDocumentDigest }],
    }, "ti_v3_persisted_analytics_authority_attachment_incomplete");
  });

  it("blocks known gaps and overlapping statement periods", () => {
    const persisted = buildValidPersistedImportFixture();
    const attachment = buildValidAuthorityAttachmentFixture(persisted);
    const range = attachment.statementPeriods[0]!;
    expectUnavailable([persisted], {
      ...attachment,
      knownGaps: [{ scopeKey: "account_primary", range, reasonCode: "ti_v3_statement_coverage_gap" }],
    }, "ti_v3_persisted_analytics_authority_attachment_incomplete");
    expectUnavailable([persisted], {
      ...attachment,
      overlappingPeriods: [{ sourceDocumentDigests: [persisted.sourceDocumentDigest, persisted.sourceDocumentDigest], range, resolutionState: "reconciled" }],
    }, "ti_v3_persisted_analytics_authority_attachment_incomplete");
  });

  it("rejects wrong-scope and unknown starting inventory contracts", () => {
    const persisted = buildValidPersistedImportFixture();
    const attachment = buildValidAuthorityAttachmentFixture(persisted);
    const wrongOwner = buildStartingInventoryFixture(buildValidPersistedImportFixture({ owner: "owner_secondary", sourceIdentity: "source_statement_secondary" }));
    const wrongAccount = buildStartingInventoryFixture(buildValidPersistedImportFixture({ account: "account_secondary", sourceIdentity: "source_statement_tertiary" }));
    const unknown = buildStartingInventoryFixture(persisted, "unknown");
    expectUnavailable([persisted], { ...attachment, startingInventories: [wrongOwner] }, "ti_v3_persisted_analytics_authority_attachment_incomplete");
    expectUnavailable([persisted], { ...attachment, startingInventories: [wrongAccount] }, "ti_v3_persisted_analytics_authority_attachment_incomplete");
    expectUnavailable([persisted], { ...attachment, startingInventories: [unknown] }, "ti_v3_persisted_analytics_authority_attachment_incomplete");
  });
});
