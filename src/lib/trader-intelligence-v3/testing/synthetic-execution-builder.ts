import {
  buildCanonicalExecution,
  createCanonicalSourceDocumentDigest,
  type CanonicalExecutionDraft,
  type CanonicalExecutionEnvelope,
} from "../domain";

export function syntheticSourceDocumentDigest(label: string): string {
  return createCanonicalSourceDocumentDigest(
    new TextEncoder().encode(`ti-v3-synthetic-document:${label}\n`),
  );
}

export function buildSyntheticCanonicalExecution(
  overrides: Partial<CanonicalExecutionDraft> = {},
): CanonicalExecutionEnvelope {
  const draft: CanonicalExecutionDraft = {
    canonicalOwnerKey: "owner_synthetic_primary",
    canonicalAccountKey: "account_synthetic_primary",
    sourceIdentity: "source_synthetic_broker_csv",
    sourceKind: "broker_csv",
    evidenceClass: "broker_confirmed",
    sourceSystem: "synthetic_broker_adapter",
    brokerCode: "synthetic_broker",
    sourceDocumentDigest: syntheticSourceDocumentDigest("primary"),
    originalSourceRowLocator: {
      kind: "row_number",
      value: "1",
      rowOrderPreserved: true,
    },
    sourceAggregationState: "individual_fill",
    instrumentResolutionState: "resolved",
    rawBrokerSymbol: "SYNTH",
    stableInstrumentKey: "instrument_synthetic_equity",
    securityType: "common_stock",
    basisContinuityState: "resolved",
    executedAt: "2026-07-18T13:45:12.123000000Z",
    sourceTimezoneEvidence: "UTC+00:00",
    timestampPrecision: "millisecond",
    side: "buy",
    brokerPositionEffectEvidence: "unknown",
    shortSaleIndicator: "unknown",
    quantity: "10",
    price: "1.25",
    currency: "USD",
    charges: [{ kind: "commission", amount: "0.25", currency: "USD" }],
    chargeCoverageState: "complete",
    brokerReportedNetCashAmount: null,
    orderId: "SYNTH-ORDER-0001",
    executionId: "SYNTH-EXEC-0001",
    brokerExecutionIndex: "1",
    brokerExecutionIndexOrderingScope: "source_document",
    brokerFillSequence: "1",
    executionIdOrderingSemantics: "not_declared",
    executionIdOrderingNamespace: null,
    executionIdOrderingScope: "not_declared",
    correctionState: "none",
    correctionReference: null,
    validation: { state: "accepted", reasonCodes: [] },
    ...overrides,
  };
  if (
    overrides.brokerExecutionIndex === null &&
    overrides.brokerExecutionIndexOrderingScope === undefined
  ) {
    draft.brokerExecutionIndexOrderingScope = "not_declared";
  }
  if (
    overrides.executionIdOrderingSemantics === "declared" &&
    overrides.executionIdOrderingNamespace === undefined
  ) {
    draft.executionIdOrderingNamespace = "ordering_synthetic_lexical";
    draft.executionIdOrderingScope = "source_document";
  }
  const result = buildCanonicalExecution(draft);
  if (!result.ok) {
    throw new Error(`ti_v3_synthetic_execution_invalid:${result.error.reasonCodes.join(",")}`);
  }
  return result.value;
}
