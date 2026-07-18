import type {
  CanonicalExecutionDraft,
  CanonicalExecutionEnvelope,
  ExecutionRelationshipClassification,
} from "../../domain";
import {
  buildSyntheticCanonicalExecution,
  syntheticSourceDocumentDigest,
} from "../synthetic-execution-builder";
import {
  GA0_A2_SYNTHETIC_FIXTURE_EXPECTATIONS,
  type Ga0A2SyntheticFixtureExpectation,
} from "./ga0-a2-synthetic-fixtures";

export type Ga0A2ExecutableFixtureMode =
  | "reconstruction"
  | "classification"
  | "invalid_decimal"
  | "identity";

export interface Ga0A2ExecutableFixture {
  expectation: Ga0A2SyntheticFixtureExpectation;
  mode: Ga0A2ExecutableFixtureMode;
  executions: readonly CanonicalExecutionEnvelope[];
  relationshipPair: readonly [number, number] | null;
  relationships?: readonly ExecutionRelationshipClassification[];
  invalidDecimalInput?: string;
  invalidDraft?: unknown;
  collisionTestHash?: (bytes: Uint8Array) => string;
}

function expectation(id: string): Ga0A2SyntheticFixtureExpectation {
  const result = GA0_A2_SYNTHETIC_FIXTURE_EXPECTATIONS.find(
    (item) => item.id === id,
  );
  if (result === undefined) throw new Error(`ti_v3_fixture_expectation_missing:${id}`);
  return result;
}

function execution(
  sequence: number,
  overrides: Partial<CanonicalExecutionDraft>,
): CanonicalExecutionEnvelope {
  const sequenceText = String(sequence);
  return buildSyntheticCanonicalExecution({
    executedAt: `2026-07-18T16:00:${sequenceText.padStart(2, "0")}.000000000Z`,
    timestampPrecision: "second",
    executionId: null,
    brokerExecutionIndex: null,
    brokerFillSequence: null,
    orderId: null,
    originalSourceRowLocator: {
      kind: "row_number",
      value: sequenceText,
      rowOrderPreserved: true,
    },
    charges: [],
    ...overrides,
  });
}

function reconstruction(
  id: string,
  executions: readonly CanonicalExecutionEnvelope[],
  relationshipPair: readonly [number, number] | null =
    executions.length > 1 ? [0, 1] : null,
): Ga0A2ExecutableFixture {
  return {
    expectation: expectation(id),
    mode: "reconstruction",
    executions,
    relationshipPair,
  };
}

function classification(
  id: string,
  executions: readonly [CanonicalExecutionEnvelope, CanonicalExecutionEnvelope],
  collisionTestHash?: (bytes: Uint8Array) => string,
): Ga0A2ExecutableFixture {
  return {
    expectation: expectation(id),
    mode: "classification",
    executions,
    relationshipPair: [0, 1],
    collisionTestHash,
  };
}

export function buildGa0A2ExecutableFixtures(): readonly Ga0A2ExecutableFixture[] {
  const exactDuplicate = execution(1, { side: "buy", quantity: "10", price: "1" });
  const reexportOriginal = execution(1, {
    executionId: "SYNTH-REEXPORT-1",
    side: "buy",
    quantity: "10",
    price: "1",
  });
  const reexportCopy = buildSyntheticCanonicalExecution({
    ...reexportOriginal.content,
    sourceDocumentDigest: syntheticSourceDocumentDigest("fixture-reexport"),
    originalSourceRowLocator: {
      kind: "row_number",
      value: "9",
      rowOrderPreserved: true,
    },
    validation: reexportOriginal.validation,
  });
  const correctionOriginal = execution(1, {
    executionId: "SYNTH-CORRECTION-1",
    price: "1",
  });
  const correctionChanged = buildSyntheticCanonicalExecution({
    ...correctionOriginal.content,
    price: "1.1",
    validation: correctionOriginal.validation,
  });
  const bust = execution(2, {
    executionId: "SYNTH-BUST-1",
    correctionState: "bust",
    correctionReference: "SYNTH-CORRECTION-1",
  });
  const collisionHash = () => "0".repeat(64);
  const collisionLeft = execution(1, {
    executionId: "SYNTH-COLLISION-A",
    price: "1",
  });
  const collisionRight = execution(2, {
    executionId: "SYNTH-COLLISION-B",
    price: "2",
  });
  const identityBase = buildSyntheticCanonicalExecution();
  const identitySourceChanged = buildSyntheticCanonicalExecution({
    sourceDocumentDigest: syntheticSourceDocumentDigest("changed"),
  });
  const identityEconomicChanged = buildSyntheticCanonicalExecution({ price: "1.2501" });
  const invalidBase = buildSyntheticCanonicalExecution();

  return [
    reconstruction("simple_long_round_trip", [
      execution(1, { side: "buy", quantity: "10", price: "1" }),
      execution(2, { side: "sell", quantity: "10", price: "1.5" }),
    ]),
    reconstruction("multiple_long_entries_one_exit", [
      execution(1, { side: "buy", quantity: "10", price: "1" }),
      execution(2, { side: "buy", quantity: "10", price: "1.5" }),
      execution(3, { side: "sell", quantity: "20", price: "2.5" }),
    ]),
    reconstruction("one_entry_multiple_exits", [
      execution(1, { side: "buy", quantity: "10", price: "1" }),
      execution(2, { side: "sell", quantity: "4", price: "2" }),
      execution(3, { side: "sell", quantity: "6", price: "1.5" }),
    ]),
    reconstruction("multiple_entries_and_exits", [
      execution(1, { side: "buy", quantity: "10", price: "1" }),
      execution(2, { side: "buy", quantity: "5", price: "2" }),
      execution(3, { side: "sell", quantity: "8", price: "3" }),
      execution(4, { side: "sell", quantity: "7", price: "2.5" }),
    ]),
    reconstruction("simple_short_round_trip", [
      execution(1, { side: "sell", quantity: "10", price: "2" }),
      execution(2, { side: "buy", quantity: "10", price: "1.5" }),
    ]),
    reconstruction("multiple_short_entries_and_covers", [
      execution(1, { side: "sell", quantity: "12", price: "2" }),
      execution(2, { side: "buy", quantity: "5", price: "1.5" }),
      execution(3, { side: "buy", quantity: "7", price: "1" }),
    ]),
    reconstruction("long_to_short_reversal", [
      execution(1, { side: "buy", quantity: "10", price: "1" }),
      execution(2, { side: "sell", quantity: "15", price: "2" }),
      execution(3, { side: "buy", quantity: "5", price: "1.5" }),
    ]),
    reconstruction("short_to_long_reversal", [
      execution(1, { side: "sell", quantity: "8", price: "2" }),
      execution(2, { side: "buy", quantity: "11", price: "1" }),
      execution(3, { side: "sell", quantity: "3", price: "1.5" }),
    ]),
    reconstruction("positive_commissions", [
      execution(1, {
        side: "buy",
        quantity: "10",
        price: "1",
        charges: [{ kind: "commission", amount: "0.1", currency: "USD" }],
      }),
      execution(2, {
        side: "sell",
        quantity: "10",
        price: "1.5",
        charges: [{ kind: "commission", amount: "0.1", currency: "USD" }],
      }),
    ]),
    reconstruction("zero_commission", [
      execution(1, { side: "buy", quantity: "10", price: "1" }),
      execution(2, { side: "sell", quantity: "10", price: "1.5" }),
    ]),
    reconstruction("negative_fee_rebate", [
      execution(1, { side: "buy", quantity: "10", price: "1" }),
      execution(2, {
        side: "sell",
        quantity: "10",
        price: "1.5",
        charges: [{ kind: "rebate", amount: "-0.025", currency: "USD" }],
      }),
    ]),
    reconstruction("open_long_inventory", [
      execution(1, { side: "buy", quantity: "10", price: "1" }),
    ]),
    reconstruction("open_short_inventory", [
      execution(1, { side: "sell", quantity: "10", price: "1" }),
    ]),
    reconstruction("prior_long_inventory_missing", [
      execution(1, {
        side: "sell",
        quantity: "10",
        price: "1",
        brokerPositionEffectEvidence: "close",
      }),
    ]),
    reconstruction("prior_short_inventory_missing", [
      execution(1, {
        side: "buy",
        quantity: "10",
        price: "1",
        brokerPositionEffectEvidence: "close",
      }),
    ]),
    reconstruction("legitimate_repeated_fills", [
      buildSyntheticCanonicalExecution({
        executionId: "SYNTH-REPEAT-A",
        brokerExecutionIndex: null,
        brokerFillSequence: null,
        orderId: null,
        charges: [],
        originalSourceRowLocator: {
          kind: "record_key",
          value: "repeat-a",
          rowOrderPreserved: false,
        },
      }),
      buildSyntheticCanonicalExecution({
        executionId: "SYNTH-REPEAT-B",
        brokerExecutionIndex: null,
        brokerFillSequence: null,
        orderId: null,
        charges: [],
        originalSourceRowLocator: {
          kind: "record_key",
          value: "repeat-b",
          rowOrderPreserved: false,
        },
      }),
    ]),
    classification("exact_duplicate_same_source", [exactDuplicate, exactDuplicate]),
    classification("reexported_execution", [reexportOriginal, reexportCopy]),
    classification("broker_correction", [correctionOriginal, correctionChanged]),
    classification("broker_bust", [correctionOriginal, bust]),
    reconstruction("same_timestamp_valid_sequence", [
      buildSyntheticCanonicalExecution({
        executedAt: "2026-07-18T16:01:00.000000000Z",
        timestampPrecision: "second",
        side: "buy",
        quantity: "10",
        price: "1",
        executionId: null,
        brokerExecutionIndex: null,
        brokerFillSequence: "1",
        orderId: "SYNTH-ORDER-SEQUENCE",
        charges: [],
        originalSourceRowLocator: {
          kind: "record_key",
          value: "sequence-a",
          rowOrderPreserved: false,
        },
      }),
      buildSyntheticCanonicalExecution({
        executedAt: "2026-07-18T16:01:00.000000000Z",
        timestampPrecision: "second",
        side: "sell",
        quantity: "10",
        price: "1.5",
        executionId: null,
        brokerExecutionIndex: null,
        brokerFillSequence: "2",
        orderId: "SYNTH-ORDER-SEQUENCE",
        charges: [],
        originalSourceRowLocator: {
          kind: "record_key",
          value: "sequence-b",
          rowOrderPreserved: false,
        },
      }),
    ]),
    reconstruction("same_timestamp_ambiguous_order", [
      buildSyntheticCanonicalExecution({
        side: "buy",
        executionId: null,
        brokerExecutionIndex: null,
        brokerFillSequence: null,
        orderId: null,
        charges: [],
        originalSourceRowLocator: {
          kind: "record_key",
          value: "ambiguous-a",
          rowOrderPreserved: false,
        },
      }),
      buildSyntheticCanonicalExecution({
        side: "sell",
        executionId: null,
        brokerExecutionIndex: null,
        brokerFillSequence: null,
        orderId: null,
        charges: [],
        originalSourceRowLocator: {
          kind: "record_key",
          value: "ambiguous-b",
          rowOrderPreserved: false,
        },
      }),
    ]),
    reconstruction("sub_dollar_price_precision", [
      execution(1, { side: "buy", quantity: "10", price: "0.123456789012" }),
      execution(2, { side: "sell", quantity: "10", price: "0.123456889012" }),
    ]),
    reconstruction("fractional_quantity", [
      execution(1, { side: "buy", quantity: "2.5", price: "1" }),
      execution(2, { side: "sell", quantity: "2.5", price: "1.5" }),
    ]),
    reconstruction("large_valid_notional", [
      execution(1, {
        side: "buy",
        quantity: "999999999999",
        price: "999999999999.999999999999",
      }),
    ]),
    {
      expectation: expectation("precision_overflow_rejection"),
      mode: "invalid_decimal",
      executions: [],
      relationshipPair: null,
      invalidDecimalInput: "9".repeat(49),
      invalidDraft: {
        ...invalidBase.content,
        quantity: "9".repeat(49),
        validation: invalidBase.validation,
      },
    },
    {
      expectation: expectation("scale_overflow_rejection"),
      mode: "invalid_decimal",
      executions: [],
      relationshipPair: null,
      invalidDecimalInput: "0.0000000000001",
      invalidDraft: {
        ...invalidBase.content,
        quantity: "0.0000000000001",
        validation: invalidBase.validation,
      },
    },
    reconstruction("usd_cad_separate", [
      execution(1, { side: "buy", quantity: "10", price: "1" }),
      execution(2, { side: "sell", quantity: "10", price: "1.5" }),
      execution(3, {
        side: "buy",
        quantity: "10",
        price: "2",
        currency: "CAD",
        rawBrokerSymbol: "SYNTHCAD",
        stableInstrumentKey: "instrument_synthetic_equity_cad",
      }),
      execution(4, {
        side: "sell",
        quantity: "10",
        price: "2.5",
        currency: "CAD",
        rawBrokerSymbol: "SYNTHCAD",
        stableInstrumentKey: "instrument_synthetic_equity_cad",
      }),
    ]),
    reconstruction("broker_average_fill", [
      execution(1, {
        sourceAggregationState: "broker_average_fill",
        side: "buy",
        quantity: "125.5",
        price: "0.412345678901",
      }),
    ]),
    reconstruction("unresolved_instrument", [
      execution(1, {
        instrumentResolutionState: "unresolved",
        stableInstrumentKey: null,
      }),
    ]),
    reconstruction("corporate_action_basis_blocked", [
      execution(1, { basisContinuityState: "corporate_action_unresolved" }),
    ]),
    reconstruction("symbol_change_continuity_blocked", [
      execution(1, { basisContinuityState: "symbol_change_unresolved" }),
    ]),
    classification(
      "digest_collision_simulation",
      [collisionLeft, collisionRight],
      collisionHash,
    ),
    {
      expectation: expectation("database_id_identity_independence"),
      mode: "identity",
      executions: [identityBase, identityBase],
      relationshipPair: [0, 1],
    },
    {
      expectation: expectation("source_economic_identity_change"),
      mode: "identity",
      executions: [identityBase, identitySourceChanged, identityEconomicChanged],
      relationshipPair: null,
    },
  ];
}
