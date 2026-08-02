import {
  applyCorrectionSet,
  buildAnalysisSnapshot,
  buildCanonicalExecution,
  buildCanonicalQueryFilter,
  buildDatasetManifest,
  buildExecutionOccurrenceEvidenceInventory,
  buildRetrospectiveAnalysisPolicy,
  buildRoundTripEvidenceInventory,
  buildStartingInventoryForExecution,
  calculateManifestEligibility,
  createCanonicalContentIdentity,
  createEmptyEnrichmentSet,
  executionLedgerGroupKey,
  reconstructAnalyticalPnl,
  resolveExecutionRelationships,
  resolveRelativeDateRange,
  startingInventoryManifestLedgerKey,
  verifyStartingInventoryContract,
  type CanonicalContentDigest,
  type CanonicalExecutionEnvelope,
  type CanonicalUtcTimestamp,
  type CorrectionRecord,
  type CoverageState,
  type DateResolutionRequest,
  type ExactResult,
  type ManifestCoverageGap,
  type ManifestCoverageOverlap,
  type ManifestSourceDocument,
  type ManifestTimeRange,
  type RelativeDateResolver,
  type StartingInventoryContract,
} from "../domain";
import {
  GA0_B1_DERIVATION_POLICY,
  type ReadOnlySnapshotAuthoritySource,
  type SnapshotReadModelAuthority,
} from "../analytics";
import {
  verifyPersistedRawBrokerCsvImport,
  type PersistedRawBrokerCsvImport,
} from "./persisted-raw-broker-csv-import";

export const PERSISTED_EXECUTION_ANALYTICS_AUTHORITY_VERSION =
  "ti_v3_persisted_execution_analytics_authority_v1" as const;

export interface PersistedExecutionDateAuthority {
  readonly request: DateResolutionRequest;
  readonly startAt: CanonicalUtcTimestamp;
  readonly endAt: CanonicalUtcTimestamp;
  readonly calendarPolicyKey: string;
  readonly calendarPolicyVersion: string;
}

/** Server-held authority. It is deliberately separate from raw CSV input. */
export interface PersistedExecutionAnalyticsAuthorityAttachment {
  readonly analysisCutoffAt: CanonicalUtcTimestamp;
  readonly correctionCutoffAt: CanonicalUtcTimestamp;
  readonly dateAuthority: PersistedExecutionDateAuthority;
  readonly sourceDocuments: readonly ManifestSourceDocument[];
  readonly statementPeriods: readonly ManifestTimeRange[];
  readonly knownGaps: readonly ManifestCoverageGap[];
  readonly overlappingPeriods: readonly ManifestCoverageOverlap[];
  readonly coverageStates: readonly CoverageState[];
  readonly corrections: readonly CorrectionRecord[];
  readonly startingInventories: readonly StartingInventoryContract[];
}

export type PersistedExecutionAnalyticsAuthorityFailure = Readonly<{
  code: "ti_v3_persisted_analytics_authority_invalid_source" | "ti_v3_persisted_analytics_authority_scope_mismatch" | "ti_v3_persisted_analytics_authority_attachment_incomplete" | "ti_v3_persisted_analytics_authority_dataset_blocked";
  path: string;
}>;

/**
 * Builds analytics authority for the executions actually present in imported
 * statements. Open ending exposure remains visible but does not suppress
 * completed round-trip analytics.
 */
export function buildObservedPeriodAnalyticsAuthorityAttachment(
  records: readonly PersistedRawBrokerCsvImport[],
): ExactResult<
  PersistedExecutionAnalyticsAuthorityAttachment,
  PersistedExecutionAnalyticsAuthorityFailure
> {
  const executions = records.flatMap((record) => record.acceptedExecutions);
  if (records.length === 0 || executions.length === 0) {
    return failure("ti_v3_persisted_analytics_authority_invalid_source", "$.records");
  }
  const ordered = [...executions].sort((left, right) =>
    left.content.executedAt.localeCompare(right.content.executedAt));
  const startDate = ordered[0].content.executedAt.slice(0, 10);
  const endDate = ordered[ordered.length - 1].content.executedAt.slice(0, 10);
  const startAt = `${startDate}T00:00:00.000000000Z` as CanonicalUtcTimestamp;
  const endAt = `${endDate}T23:59:59.999999999Z` as CanonicalUtcTimestamp;
  const inventoryByLedger = new Map<string, StartingInventoryContract>();
  for (const persisted of executions) {
    const rebuilt = buildCanonicalExecution({
      ...persisted.content,
      validation: persisted.validation,
    });
    if (!rebuilt.ok || rebuilt.value.content.stableInstrumentKey === null) {
      continue;
    }
    const ledgerKey = executionLedgerGroupKey(rebuilt.value);
    if (inventoryByLedger.has(ledgerKey)) continue;
    const inventory = buildStartingInventoryForExecution(
      rebuilt.value,
      "proven_flat",
    );
    if (inventory.ok) inventoryByLedger.set(ledgerKey, inventory.value);
  }
  const statementPeriod = Object.freeze({
    startAt,
    endAt,
    startInclusive: true,
    endInclusive: true,
  });
  return {
    ok: true,
    value: Object.freeze({
      analysisCutoffAt: endAt,
      correctionCutoffAt: endAt,
      dateAuthority: Object.freeze({
        request: Object.freeze({
          relativeRange: null,
          requestedStartDate: startDate,
          requestedEndDate: endDate,
          dateBasis: "trade_close_date",
          timeBasis: "utc",
          startBoundary: "inclusive",
          endBoundary: "inclusive",
          timezone: "UTC",
          calendarBasis: "calendar_day",
        }),
        startAt,
        endAt,
        calendarPolicyKey: "ti_v3_observed_import_calendar",
        calendarPolicyVersion: "v1",
      }),
      sourceDocuments: Object.freeze(
        records.map((record) =>
          Object.freeze({
            sourceDocumentDigest: record.sourceDocumentDigest,
            sourceKind: "broker_csv" as const,
            statementPeriods: Object.freeze([statementPeriod]),
            deletionState: "present" as const,
          })),
      ),
      statementPeriods: Object.freeze([statementPeriod]),
      knownGaps: Object.freeze([]),
      overlappingPeriods: Object.freeze([]),
      coverageStates: Object.freeze(["complete_account_period" as const]),
      corrections: Object.freeze([]),
      startingInventories: Object.freeze([...inventoryByLedger.values()]),
    }),
  };
}

function failure(
  code: PersistedExecutionAnalyticsAuthorityFailure["code"],
  path: string,
): ExactResult<never, PersistedExecutionAnalyticsAuthorityFailure> {
  return { ok: false, error: { code, path } };
}

function required<T>(
  value: { readonly ok: boolean; readonly value?: T },
  path: string,
): ExactResult<T, PersistedExecutionAnalyticsAuthorityFailure> {
  return value.ok && value.value !== undefined
    ? { ok: true, value: value.value }
    : failure("ti_v3_persisted_analytics_authority_attachment_incomplete", path);
}

function fixedDateResolver(authority: PersistedExecutionDateAuthority): RelativeDateResolver {
  return {
    resolve: () => ({
      ok: true,
      value: {
        requestedStartDate: authority.request.requestedStartDate as string,
        requestedEndDate: authority.request.requestedEndDate as string,
        startAt: authority.startAt,
        endAt: authority.endAt,
        calendarPolicyKey: authority.calendarPolicyKey,
        calendarPolicyVersion: authority.calendarPolicyVersion,
        sessionEvidence: [],
      },
    }),
  };
}

/**
 * Produces the existing immutable GA0-B1 authority only after the raw receipts
 * are bound to explicit statement, correction, and opening-inventory evidence.
 * It never treats a CSV as proof that prior inventory was flat or corrections
 * were absent.
 */
export function buildPersistedExecutionAnalyticsAuthority(args: {
  readonly records: readonly PersistedRawBrokerCsvImport[];
  readonly attachment: PersistedExecutionAnalyticsAuthorityAttachment;
}): ExactResult<SnapshotReadModelAuthority, PersistedExecutionAnalyticsAuthorityFailure> {
  if (args.records.length === 0) return failure("ti_v3_persisted_analytics_authority_invalid_source", "$.records");
  const records: PersistedRawBrokerCsvImport[] = [];
  const catalog: CanonicalExecutionEnvelope[] = [];
  let owner: string | null = null;
  let account: string | null = null;
  for (let index = 0; index < args.records.length; index += 1) {
    const verified = verifyPersistedRawBrokerCsvImport(args.records[index]);
    if (!verified.ok) return failure("ti_v3_persisted_analytics_authority_invalid_source", `$.records[${index}]`);
    if ((owner !== null && owner !== verified.value.canonicalOwnerKey) || (account !== null && account !== verified.value.canonicalAccountKey)) {
      return failure("ti_v3_persisted_analytics_authority_scope_mismatch", `$.records[${index}]`);
    }
    owner ??= verified.value.canonicalOwnerKey;
    account ??= verified.value.canonicalAccountKey;
    records.push(verified.value);
    for (const item of verified.value.acceptedExecutions) {
      const rebuilt = buildCanonicalExecution({ ...item.content, validation: item.validation });
      if (!rebuilt.ok || rebuilt.value.canonicalContentDigest !== item.canonicalContentDigest) {
        return failure("ti_v3_persisted_analytics_authority_invalid_source", `$.records[${index}].acceptedExecutions`);
      }
      catalog.push(rebuilt.value);
    }
  }
  const sourceDigests = new Set(records.map((record) => record.sourceDocumentDigest));
  if (
    owner === null || account === null ||
    args.attachment.sourceDocuments.length !== sourceDigests.size ||
    args.attachment.sourceDocuments.some((source) => source.sourceKind !== "broker_csv" || source.deletionState !== "present" || !sourceDigests.has(source.sourceDocumentDigest))
  ) return failure("ti_v3_persisted_analytics_authority_attachment_incomplete", "$.attachment.sourceDocuments");
  if (
    args.attachment.coverageStates.length !== 1 ||
    args.attachment.coverageStates[0] !== "complete_account_period" ||
    args.attachment.knownGaps.length !== 0 ||
    args.attachment.overlappingPeriods.length !== 0
  ) {
    return failure("ti_v3_persisted_analytics_authority_attachment_incomplete", "$.attachment.coverageStates");
  }
  const correction = required(applyCorrectionSet({
    baseActiveExecutionDigests: catalog.map((execution) => execution.canonicalContentDigest),
    availableExecutionCatalog: catalog,
    corrections: args.attachment.corrections,
    correctionCutoffAt: args.attachment.correctionCutoffAt,
  }), "$.attachment.corrections");
  if (!correction.ok) return correction;
  const active = catalog.filter((execution) => correction.value.activeExecutionDigests.includes(execution.canonicalContentDigest));
  const relationships = resolveExecutionRelationships(active);
  const inventories = args.attachment.startingInventories;
  if (inventories.length === 0 || inventories.some((inventory) => !verifyStartingInventoryContract(inventory).ok || inventory.ledgerIdentity.canonicalOwnerKey !== owner || inventory.ledgerIdentity.canonicalAccountKey !== account || inventory.state === "unknown")) {
    return failure("ti_v3_persisted_analytics_authority_attachment_incomplete", "$.attachment.startingInventories");
  }
  const reconstruction = reconstructAnalyticalPnl({ relationshipResolution: relationships, startingInventories: inventories });
  if (reconstruction.status !== "completed" && reconstruction.ledgers.length === 0) {
    return failure("ti_v3_persisted_analytics_authority_dataset_blocked", "$.reconstruction");
  }
  const policyIdentity = required(createCanonicalContentIdentity("canonical_content", "v1", {
    policyKey: "ti_v3_fifo_analytical_pnl", policyVersion: "v1",
  }), "$.fifoPolicy");
  if (!policyIdentity.ok) return policyIdentity;
  const retrospective = required(buildRetrospectiveAnalysisPolicy({
    state: "closed_historical_trade",
    analysisCutoffAt: args.attachment.analysisCutoffAt,
    correctionCutoffAt: args.attachment.correctionCutoffAt,
    openPositionPolicy: "exclude_from_closed_trade_analytics",
    includedLifecycleStates: ["execution_accepted", "position_closed"],
    excludedLifecycleStates: [],
  }), "$.retrospectivePolicy");
  if (!retrospective.ok) return retrospective;
  const openPositions = reconstruction.ledgers
    .filter((ledger) => ledger.endingQuantity !== "0")
    .map((ledger) => ({
      ledgerKey: `${ledger.canonicalAccountKey}:${ledger.stableInstrumentKey}:${ledger.currency.toLowerCase()}`,
      executionDigests: [
        ...new Set(
          ledger.openLots.map((lot) => lot.sourceExecutionDigest),
        ),
      ],
    }));
  const manifest = required(buildDatasetManifest({
    canonicalOwnerKey: owner,
    canonicalAccountKeys: [account],
    sourceDocuments: args.attachment.sourceDocuments,
    acceptedExecutionDigests: active.map((execution) => execution.canonicalContentDigest),
    correctionResult: correction.value,
    policies: [
      { policyKey: "ti_v3_fifo_policy", policyVersion: "v1", policyDigest: policyIdentity.value.identifier as CanonicalContentDigest },
      { policyKey: "ti_v3_retrospective_policy", policyVersion: "v1", policyDigest: retrospective.value.policyDigest },
    ],
    statementPeriods: args.attachment.statementPeriods,
    knownGaps: args.attachment.knownGaps,
    overlappingPeriods: args.attachment.overlappingPeriods,
    exclusions: [],
    priorInventory: inventories.map((inventory) => ({ ledgerKey: startingInventoryManifestLedgerKey(inventory.ledgerIdentity), state: inventory.state, contractDigest: inventory.contractDigest })),
    openPositions,
    currencies: [...new Set(active.map((execution) => execution.content.currency))],
    coverageStates: args.attachment.coverageStates,
    reconstructionStatus: reconstruction.status === "completed" ? "exact" : "limited",
    reconstructionReasonCodes: reconstruction.limitations,
  }), "$.manifest");
  if (!manifest.ok) return manifest;
  const eligibility = required(calculateManifestEligibility({ manifest: manifest.value, retrospectivePolicy: retrospective.value, correctionResult: correction.value, analysisCutoffAt: args.attachment.analysisCutoffAt, requiredEvidenceReferences: [] }), "$.eligibility");
  if (!eligibility.ok) return eligibility;
  const dateReceipt = required(resolveRelativeDateRange({ request: args.attachment.dateAuthority.request, now: args.attachment.analysisCutoffAt, resolver: fixedDateResolver(args.attachment.dateAuthority) }), "$.dateAuthority");
  if (!dateReceipt.ok) return dateReceipt;
  const filter = required(buildCanonicalQueryFilter({
    dateResolutionReceipt: dateReceipt.value, accountFilters: [account], instrumentFilters: [], directionFilters: [], sessionFilters: [], lifecycleFilters: ["position_closed"], setupFilter: null, outcomeFilters: [], currencyFilters: [], evidenceCapabilityFilters: ["closed_trade_analytics"], openPositionPolicy: "exclude_from_closed_trade_analytics", correctionCutoffAt: args.attachment.correctionCutoffAt, analysisCutoffAt: args.attachment.analysisCutoffAt, boundSnapshotDigest: null,
  }), "$.filter");
  if (!filter.ok) return filter;
  const occurrence = required(buildExecutionOccurrenceEvidenceInventory(relationships), "$.occurrenceInventory");
  if (!occurrence.ok) return occurrence;
  const roundTrips = required(buildRoundTripEvidenceInventory(reconstruction), "$.roundTripInventory");
  if (!roundTrips.ok) return roundTrips;
  const enrichment = required(createEmptyEnrichmentSet(manifest.value, args.attachment.analysisCutoffAt), "$.enrichment");
  if (!enrichment.ok) return enrichment;
  const dependencies = Object.freeze({ manifest: manifest.value, eligibilitySet: eligibility.value, filter: filter.value, enrichmentSet: enrichment.value, occurrenceInventory: occurrence.value, roundTripInventory: roundTrips.value });
  const snapshot = required(buildAnalysisSnapshot({ manifest: manifest.value, eligibilitySet: eligibility.value, enrichmentSet: enrichment.value, intentRuleCutoffAt: args.attachment.analysisCutoffAt, analysisCutoffAt: args.attachment.analysisCutoffAt, filter: filter.value, evidenceNamespace: `evidence:${owner}`, occurrenceInventory: occurrence.value, roundTripInventory: roundTrips.value }), "$.snapshot");
  if (!snapshot.ok) return snapshot;
  return { ok: true, value: Object.freeze({ snapshot: snapshot.value, snapshotDependencies: dependencies, dateResolutionReceipt: dateReceipt.value, correctionAuthority: Object.freeze({ result: correction.value, baseActiveExecutionDigests: Object.freeze(catalog.map((execution) => execution.canonicalContentDigest)), availableExecutionCatalog: Object.freeze(catalog), corrections: Object.freeze([...args.attachment.corrections]) }), acceptedExecutionCatalog: Object.freeze(active), relationshipResolution: relationships, startingInventories: Object.freeze([...inventories]), reconstruction, derivationPolicy: GA0_B1_DERIVATION_POLICY }) };
}

export function createPersistedExecutionAnalyticsAuthoritySource(args: {
  readonly records: readonly PersistedRawBrokerCsvImport[];
  readonly attachment: PersistedExecutionAnalyticsAuthorityAttachment;
}): ReadOnlySnapshotAuthoritySource {
  let built: ReturnType<typeof buildPersistedExecutionAnalyticsAuthority> | null = null;
  const activity: CanonicalExecutionEnvelope[] = [];
  let activityValid = true;
  for (const record of args.records) {
    const verified = verifyPersistedRawBrokerCsvImport(record);
    if (!verified.ok) {
      activityValid = false;
      break;
    }
    for (const item of verified.value.acceptedExecutions) {
      const rebuilt = buildCanonicalExecution({
        ...item.content,
        validation: item.validation,
      });
      if (
        !rebuilt.ok ||
        rebuilt.value.canonicalContentDigest !== item.canonicalContentDigest
      ) {
        activityValid = false;
        break;
      }
      activity.push(rebuilt.value);
    }
    if (!activityValid) break;
  }
  const acceptedExecutionActivity = Object.freeze(
    activityValid ? activity : [],
  );
  return Object.freeze({
    sourceKey: PERSISTED_EXECUTION_ANALYTICS_AUTHORITY_VERSION,
    sourceVersion: "v1",
    readAcceptedExecutionActivity: () => acceptedExecutionActivity,
    readExactAuthority: () => {
      built ??= buildPersistedExecutionAnalyticsAuthority(args);
      return built.ok
      ? Object.freeze({ state: "available" as const, authority: built.value })
      : Object.freeze({ state: "unavailable" as const, reasonCode: built.error.code });
    },
  });
}
