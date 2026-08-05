import type { JournalDataDecisionItem } from "../../contracts/journal-product-read-models";
import type { JournalExecutionVersionRecord } from "../../contracts/journal-execution-contracts";
import { createJournalDataDecisionResolution } from "./journal-data-decision-resolution";

const DECISION_ID = "11111111-1111-4111-8111-111111111111";
const EXECUTION_A = "22222222-2222-4222-8222-222222222222";
const EXECUTION_B = "33333333-3333-4333-8333-333333333333";
const VERSION_A = "44444444-4444-4444-8444-444444444444";
const VERSION_B = "55555555-5555-4555-8555-555555555555";
const INSTRUMENT_ID = "66666666-6666-4666-8666-666666666666";
const POSITION_ID = "77777777-7777-4777-8777-777777777777";

const currentExecution: JournalExecutionVersionRecord = Object.freeze({
  executionVersionId: VERSION_A,
  executionId: EXECUTION_A,
  workspaceId: "88888888-8888-4888-8888-888888888888",
  accountId: "99999999-9999-4999-8999-999999999999",
  versionNumber: 1,
  actorKind: "system",
  actorUserId: null,
  changeReasonCode: "imported",
  createdAtUtc: "2026-08-02T14:00:00.000Z",
  instrumentId: INSTRUMENT_ID,
  tradeCurrency: "USD",
  sourceTimestampText: "2026-08-02, 10:00:00",
  sourceTimezone: "America/New_York",
  timeParserVersion: "test_v1",
  executedAtUtc: "2026-08-02T14:00:00.000Z",
  sourceOrderKey: "2026-08-02T14:00:00.000Z|source|1",
  side: "buy",
  quantityDecimal: "10",
  priceDecimal: "2.5",
  feesDecimal: "-0.1",
  feeCurrency: "USD",
  feeSignConvention: "broker_reported_signed",
  factCompleteness: "complete",
});

function item(
  allowedActions: JournalDataDecisionItem["allowedActions"],
): JournalDataDecisionItem {
  return Object.freeze({
    decisionId: DECISION_ID,
    importBatchIds: Object.freeze([]),
    revision: 1,
    state: "pending",
    issueCode: "test_issue",
    effectCode: "position_chain_unavailable",
    question: "What does your broker statement show?",
    impactSummary: "This ticker stays out of confirmed round trips until you decide.",
    targetKind: "chain",
    instrumentRef: INSTRUMENT_ID,
    symbol: "TEST",
    currency: "USD",
    sourceRowNumber: 3,
    sourceSection: "Trades",
    effectiveAtUtc: "2026-08-02T14:00:00.000Z",
    updatedAtUtc: "2026-08-02T15:00:00.000Z",
    allowedActions,
    executions: Object.freeze([
      Object.freeze({
        executionId: EXECUTION_A,
        currentVersionId: VERSION_A,
        sourceTimestampText: "2026-08-02, 10:00:00",
        executedAtUtc: "2026-08-02T14:00:00.000Z",
        sourceTimezone: "America/New_York",
        symbol: "TEST",
        currency: "USD",
        side: "buy",
        quantityDecimal: "10",
        priceDecimal: "2.5",
        feesDecimal: "-0.1",
        feeCurrency: "USD",
        feeSignConvention: "broker_reported_signed",
        currentState: "needs_decision",
        sourceLabel: null,
      }),
      Object.freeze({
        executionId: EXECUTION_B,
        currentVersionId: VERSION_B,
        sourceTimestampText: "2026-08-02, 10:00:00",
        executedAtUtc: "2026-08-02T14:00:00.000Z",
        sourceTimezone: "America/New_York",
        symbol: "TEST",
        currency: "USD",
        side: "buy",
        quantityDecimal: "10",
        priceDecimal: "2.5",
        feesDecimal: "-0.1",
        feeCurrency: "USD",
        feeSignConvention: "broker_reported_signed",
        currentState: "needs_decision",
        sourceLabel: null,
      }),
    ]),
    positionFacts: Object.freeze([Object.freeze({
      positionFactId: POSITION_ID,
      symbol: "TEST",
      currency: "USD",
      factKind: "closing_balance",
      effectiveLocalDate: "2026-08-02",
      sourceTimezone: "America/New_York",
      quantityDecimal: "0",
      source: "Broker statement",
    })]),
    suggestedCoverage: Object.freeze({
      assetClass: "stock",
      localStartDate: "2026-08-02",
      localEndDate: "2026-08-02",
      sourceTimezone: "America/New_York",
    }),
  });
}

const loadExecution = (executionId: string) =>
  executionId === EXECUTION_A ? currentExecution : null;

describe("Journal Data Decisions product resolution", () => {
  it("maps every exposed typed correction without trusting unlisted targets", () => {
    const cases = [
      createJournalDataDecisionResolution(item(["correct_execution_fact"]), {
        action: "correct_execution_fact",
        executionId: EXECUTION_A,
        sourceTimestampText: "2026-08-02, 10:01:00",
        sourceTimezone: "America/New_York",
        side: "sell",
        quantityDecimal: "9.5",
        priceDecimal: "2.75",
        feesDecimal: null,
        feeCurrency: null,
        feeSignConvention: "broker_reported_signed",
      }, loadExecution),
      createJournalDataDecisionResolution(item(["set_execution_order"]), {
        action: "set_execution_order",
        executionId: EXECUTION_A,
        sameTimestampSequence: 2,
      }, loadExecution),
      createJournalDataDecisionResolution(item(["exclude_execution"]), {
        action: "exclude_execution",
        exclusionReason: "not_a_trade_execution",
        executionId: EXECUTION_A,
      }, loadExecution),
      createJournalDataDecisionResolution(item(["restore_execution"]), {
        action: "restore_execution",
        executionId: EXECUTION_A,
      }, loadExecution),
      createJournalDataDecisionResolution(item(["keep_distinct"]), {
        action: "keep_distinct",
        executionId: EXECUTION_A,
      }, loadExecution),
      createJournalDataDecisionResolution(item(["merge_supported_duplicate"]), {
        action: "merge_supported_duplicate",
        duplicateExecutionId: EXECUTION_A,
        retainedExecutionId: EXECUTION_B,
      }, loadExecution),
      createJournalDataDecisionResolution(item(["correct_position_fact"]), {
        action: "correct_position_fact",
        positionFactId: POSITION_ID,
        quantityDecimal: "4.25",
      }, loadExecution),
      createJournalDataDecisionResolution(item(["confirm_legitimate_open_position"]), {
        action: "confirm_legitimate_open_position",
        positionFactId: POSITION_ID,
      }, loadExecution),
      createJournalDataDecisionResolution(item(["supply_opening_inventory"]), {
        action: "supply_opening_inventory",
        effectiveLocalDate: "2026-08-02",
        sourceTimezone: "America/New_York",
        quantityDecimal: "5",
      }, loadExecution),
      createJournalDataDecisionResolution(item(["supply_position_fact"]), {
        action: "supply_position_fact",
        factKind: "closing_balance",
        effectiveLocalDate: "2026-08-02",
        timePrecision: "exact",
        sourceTimeText: "16:00:00",
        sourceTimezone: "America/New_York",
        quantityDecimal: "0",
      }, loadExecution),
      createJournalDataDecisionResolution(item(["add_missing_execution"]), {
        action: "add_missing_execution",
        execution: {
          sourceTimestampText: "2026-08-02, 11:00:00",
          sourceTimezone: "America/New_York",
          normalizedSymbol: "TEST",
          tradeCurrency: "USD",
          side: "buy",
          quantityDecimal: "1",
          priceDecimal: "3",
          feesDecimal: null,
          feeCurrency: null,
        },
      }, loadExecution),
      createJournalDataDecisionResolution(item(["supply_coverage_fact"]), {
        action: "supply_coverage_fact",
        coverageKind: "partial",
      }, loadExecution),
      createJournalDataDecisionResolution(item(["accept_source_limitation"]), {
        action: "accept_source_limitation",
      }, loadExecution),
    ];
    expect(cases.map((resolution) => resolution.action)).toEqual([
      "correct_execution_fact",
      "set_execution_order",
      "exclude_execution",
      "restore_execution",
      "keep_distinct",
      "merge_supported_duplicate",
      "correct_position_fact",
      "confirm_legitimate_open_position",
      "supply_opening_inventory",
      "supply_position_fact",
      "add_missing_execution",
      "supply_coverage_fact",
      "accept_source_limitation",
    ]);
    expect(cases[0]).toMatchObject({
      expectedCurrentVersionId: VERSION_A,
      facts: {
        executedAtUtc: "2026-08-02T14:01:00.000Z",
        quantityDecimal: "9.5",
        feesDecimal: null,
        feeCurrency: null,
      },
    });
  });

  it("rejects actions and execution targets not offered by the current decision", () => {
    expect(() => createJournalDataDecisionResolution(
      item(["accept_source_limitation"]),
      { action: "exclude_execution", executionId: EXECUTION_A },
      loadExecution,
    )).toThrowError("TRADERLINK_DATA_DECISION_INVALID_ACTION");
    expect(() => createJournalDataDecisionResolution(
      item(["exclude_execution"]),
      {
        action: "exclude_execution",
        executionId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      },
      loadExecution,
    )).toThrowError("TRADERLINK_DATA_DECISION_INVALID_ACTION");
  });
});
