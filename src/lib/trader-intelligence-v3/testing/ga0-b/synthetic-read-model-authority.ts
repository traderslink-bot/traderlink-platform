import {
  applyCorrectionSet,
  buildAnalysisSnapshot,
  buildCanonicalQueryFilter,
  buildDatasetManifest,
  buildExecutionOccurrenceEvidenceInventory,
  buildRetrospectiveAnalysisPolicy,
  buildRoundTripEvidenceInventory,
  calculateManifestEligibility,
  createCanonicalContentIdentity,
  createEmptyEnrichmentSet,
  reconstructAnalyticalPnl,
  resolveRelativeDateRange,
  type CanonicalExecutionEnvelope,
  type CanonicalContentDigest,
  type CanonicalUtcTimestamp,
  type ManifestOpenPosition,
  type RelativeDateResolver,
  type RetrospectivePolicyState,
} from "../../domain";
import {
  GA0_B1_DERIVATION_POLICY,
  type SnapshotReadModelAuthority,
} from "../../analytics";
import { buildSyntheticAnalyticalPnlInput } from "../synthetic-accounting-input";
import { buildSyntheticCanonicalExecution } from "../synthetic-execution-builder";

export const GA0_B1_SYNTHETIC_ANALYSIS_CUTOFF =
  "2026-07-20T23:59:59.999999999Z" as CanonicalUtcTimestamp;

export function buildSyntheticGa0B1ClosedExecutions(): readonly CanonicalExecutionEnvelope[] {
  return Object.freeze([
    buildSyntheticCanonicalExecution({
      executionId: "B1-BUY-1",
      orderId: "B1-ORDER-1",
      brokerExecutionIndex: "1",
      brokerFillSequence: "1",
      executedAt: "2026-07-18T13:45:12.000000000Z",
      timestampPrecision: "second",
      side: "buy",
      quantity: "10",
      price: "1.25",
      charges: [{ kind: "commission", amount: "0.25", currency: "USD" }],
    }),
    buildSyntheticCanonicalExecution({
      executionId: "B1-SELL-1",
      orderId: "B1-ORDER-2",
      brokerExecutionIndex: "2",
      brokerFillSequence: "2",
      originalSourceRowLocator: { kind: "row_number", value: "2", rowOrderPreserved: true },
      executedAt: "2026-07-18T14:45:12.000000000Z",
      timestampPrecision: "second",
      side: "sell",
      quantity: "10",
      price: "1.75",
      charges: [{ kind: "commission", amount: "0.25", currency: "USD" }],
    }),
  ]);
}

export interface SyntheticGa0B1AuthorityOptions {
  readonly openPositions?: readonly ManifestOpenPosition[];
  readonly includeOccurrenceInventory?: boolean;
  readonly includeRoundTripInventory?: boolean;
  readonly policyState?: RetrospectivePolicyState;
  readonly manifestExclusions?: readonly Readonly<{ readonly evidenceDigest: CanonicalContentDigest; readonly reasonCode: string }>[];
  readonly filterOverrides?: Readonly<{
    accountFilters?: readonly string[];
    instrumentFilters?: readonly string[];
    directionFilters?: readonly ("long" | "short")[];
    sessionFilters?: readonly ("premarket" | "regular" | "after_hours" | "overnight")[];
    lifecycleFilters?: readonly string[];
    outcomeFilters?: readonly ("gain" | "loss" | "flat" | "unknown")[];
    currencyFilters?: readonly string[];
    evidenceCapabilityFilters?: readonly string[];
  }>;
}

function required<T>(result: { readonly ok: boolean; readonly value?: T; readonly error?: { readonly code: string; readonly path?: string } }): T {
  if (!result.ok || result.value === undefined) throw new Error(`${result.error?.code ?? "ti_v3_synthetic_b1_fixture_failed"}:${result.error?.path ?? "$"}`);
  return result.value;
}

export function buildSyntheticGa0B1Authority(
  executions: readonly CanonicalExecutionEnvelope[] = buildSyntheticGa0B1ClosedExecutions(),
  options: SyntheticGa0B1AuthorityOptions = {},
): SnapshotReadModelAuthority {
  const correctionResult = required(applyCorrectionSet({
    baseActiveExecutionDigests: executions.map((execution) => execution.canonicalContentDigest),
    availableExecutionCatalog: executions,
    corrections: [],
    correctionCutoffAt: GA0_B1_SYNTHETIC_ANALYSIS_CUTOFF,
  }));
  const retrospectivePolicy = required(buildRetrospectiveAnalysisPolicy({
    state: options.policyState ?? "closed_historical_trade",
    analysisCutoffAt: GA0_B1_SYNTHETIC_ANALYSIS_CUTOFF,
    correctionCutoffAt: GA0_B1_SYNTHETIC_ANALYSIS_CUTOFF,
    openPositionPolicy: "exclude_from_closed_trade_analytics",
    includedLifecycleStates: ["execution_accepted", "position_closed"],
    excludedLifecycleStates: [],
  }));
  const fifoPolicy = required(createCanonicalContentIdentity("canonical_content", "v1", {
    policyKey: "ti_v3_fifo_analytical_pnl",
    policyVersion: "v1",
  }));
  const sourceDocumentMap = new Map<string, object>();
  for (const execution of executions) {
    if (execution.content.sourceDocumentDigest === null) continue;
    sourceDocumentMap.set(execution.content.sourceDocumentDigest, {
      sourceDocumentDigest: execution.content.sourceDocumentDigest,
      sourceKind: execution.content.sourceKind,
      statementPeriods: [{
        startAt: "2026-07-01T00:00:00.000000000Z",
        endAt: "2026-07-21T00:00:00.000000000Z",
        startInclusive: true,
        endInclusive: false,
      }],
      deletionState: "present" as const,
    });
  }
  const sourceDocuments = [...sourceDocumentMap.values()];
  const accountKeys = [...new Set(executions.map((execution) => execution.content.canonicalAccountKey))];
  const currencies = [...new Set(executions.map((execution) => execution.content.currency))];
  const accountingInput = buildSyntheticAnalyticalPnlInput(executions);
  const priorInventoryMap = new Map<string, object>();
  for (const inventory of accountingInput.startingInventories) {
    const ledgerKey = [
      inventory.ledgerIdentity.canonicalOwnerKey,
      inventory.ledgerIdentity.canonicalAccountKey,
      inventory.ledgerIdentity.stableInstrumentKey,
      inventory.ledgerIdentity.currency.toLowerCase(),
    ].join(":");
    priorInventoryMap.set(ledgerKey, {
      ledgerKey,
      state: inventory.state,
      contractDigest: inventory.contractDigest,
    });
  }
  const priorInventory = [...priorInventoryMap.values()];
  const manifestResult = buildDatasetManifest({
    canonicalOwnerKey: executions[0]?.content.canonicalOwnerKey ?? "owner_synthetic_primary",
    canonicalAccountKeys: accountKeys.length === 0 ? ["account_synthetic_primary"] : accountKeys,
    sourceDocuments,
    acceptedExecutionDigests: executions.map((execution) => execution.canonicalContentDigest),
    correctionResult,
    policies: [
      { policyKey: "ti_v3_fifo_policy", policyVersion: "v1", policyDigest: fifoPolicy.identifier },
      { policyKey: "ti_v3_retrospective_policy", policyVersion: "v1", policyDigest: retrospectivePolicy.policyDigest },
    ],
    statementPeriods: [{
      startAt: "2026-07-01T00:00:00.000000000Z",
      endAt: "2026-07-21T00:00:00.000000000Z",
      startInclusive: true,
      endInclusive: false,
    }],
    knownGaps: [],
    overlappingPeriods: [],
    exclusions: options.manifestExclusions ?? [],
    priorInventory,
    openPositions: options.openPositions ?? [],
    currencies,
    coverageStates: ["complete_account_period"],
    reconstructionStatus: "exact",
    reconstructionReasonCodes: [],
  });
  if (!manifestResult.ok) throw new Error(`ti_v3_synthetic_manifest_failed:${JSON.stringify(manifestResult.error)}`);
  const manifest = manifestResult.value;
  const eligibilitySet = required(calculateManifestEligibility({
    manifest,
    retrospectivePolicy,
    correctionResult,
    analysisCutoffAt: GA0_B1_SYNTHETIC_ANALYSIS_CUTOFF,
    requiredEvidenceReferences: [],
  }));
  const resolver: RelativeDateResolver = {
    resolve: () => ({
      ok: true,
      value: {
        requestedStartDate: "2026-07-01",
        requestedEndDate: "2026-07-20",
        startAt: "2026-07-01T00:00:00.000000000Z" as CanonicalUtcTimestamp,
        endAt: GA0_B1_SYNTHETIC_ANALYSIS_CUTOFF,
        calendarPolicyKey: "ti_v3_utc_calendar",
        calendarPolicyVersion: "v1",
        sessionEvidence: [],
      },
    }),
  };
  const dateReceipt = required(resolveRelativeDateRange({
    request: {
      relativeRange: null,
      requestedStartDate: "2026-07-01",
      requestedEndDate: "2026-07-20",
      dateBasis: "trade_close_date",
      timeBasis: "utc",
      startBoundary: "inclusive",
      endBoundary: "inclusive",
      timezone: "UTC",
      calendarBasis: "calendar_day",
    },
    now: GA0_B1_SYNTHETIC_ANALYSIS_CUTOFF,
    resolver,
  }));
  const overrides = options.filterOverrides ?? {};
  const filter = required(buildCanonicalQueryFilter({
    dateResolutionReceipt: dateReceipt,
    accountFilters: overrides.accountFilters ?? [],
    instrumentFilters: overrides.instrumentFilters ?? [],
    directionFilters: overrides.directionFilters ?? [],
    sessionFilters: overrides.sessionFilters ?? [],
    lifecycleFilters: overrides.lifecycleFilters ?? ["position_closed"],
    setupFilter: null,
    outcomeFilters: overrides.outcomeFilters ?? [],
    currencyFilters: overrides.currencyFilters ?? [],
    evidenceCapabilityFilters: overrides.evidenceCapabilityFilters ?? ["closed_trade_analytics"],
    openPositionPolicy: "exclude_from_closed_trade_analytics",
    correctionCutoffAt: GA0_B1_SYNTHETIC_ANALYSIS_CUTOFF,
    analysisCutoffAt: GA0_B1_SYNTHETIC_ANALYSIS_CUTOFF,
    boundSnapshotDigest: null,
  }));
  const reconstruction = reconstructAnalyticalPnl(accountingInput);
  const occurrenceInventory = required(buildExecutionOccurrenceEvidenceInventory(accountingInput.relationshipResolution));
  const roundTripInventory = required(buildRoundTripEvidenceInventory(reconstruction));
  const enrichmentSet = required(createEmptyEnrichmentSet(manifest, GA0_B1_SYNTHETIC_ANALYSIS_CUTOFF));
  const snapshotDependencies = Object.freeze({
    manifest,
    eligibilitySet,
    filter,
    enrichmentSet,
    occurrenceInventory: options.includeOccurrenceInventory === false ? null : occurrenceInventory,
    roundTripInventory: options.includeRoundTripInventory === false ? null : roundTripInventory,
  });
  const snapshot = required(buildAnalysisSnapshot({
    manifest,
    eligibilitySet,
    enrichmentSet,
    intentRuleCutoffAt: GA0_B1_SYNTHETIC_ANALYSIS_CUTOFF,
    analysisCutoffAt: GA0_B1_SYNTHETIC_ANALYSIS_CUTOFF,
    filter,
    evidenceNamespace: "evidence:owner_synthetic_primary",
    occurrenceInventory: snapshotDependencies.occurrenceInventory,
    roundTripInventory: snapshotDependencies.roundTripInventory,
  }));
  return Object.freeze({
    snapshot,
    snapshotDependencies,
    dateResolutionReceipt: dateReceipt,
    correctionAuthority: Object.freeze({
      result: correctionResult,
      baseActiveExecutionDigests: Object.freeze(executions.map((execution) => execution.canonicalContentDigest)),
      availableExecutionCatalog: Object.freeze([...executions]),
      corrections: Object.freeze([]),
    }),
    acceptedExecutionCatalog: Object.freeze([...executions]),
    relationshipResolution: accountingInput.relationshipResolution,
    startingInventories: Object.freeze([...accountingInput.startingInventories]),
    reconstruction,
    derivationPolicy: GA0_B1_DERIVATION_POLICY,
  });
}
