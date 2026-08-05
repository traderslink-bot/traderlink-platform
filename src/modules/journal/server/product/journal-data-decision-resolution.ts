import { createHash } from "node:crypto";

import type { JournalDataDecisionItem } from "../../contracts/journal-product-read-models";
import type { JournalExecutionVersionRecord } from "../../contracts/journal-execution-contracts";
import type { JournalDecisionResolution } from "../decisions/journal-data-decision-service";
import { normalizeIbkrExecutionTime } from "../imports/journal-value-normalization";
import { platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";

export type JournalDecisionProductRequest = Record<string, unknown>;
export type JournalDecisionExecutionLoader = (
  executionId: string,
) => JournalExecutionVersionRecord | null;

function requiredString(
  record: JournalDecisionProductRequest,
  field: string,
): string {
  const value = record[field];
  if (typeof value !== "string" || value.length === 0) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field });
  }
  return value;
}

function nullableString(
  record: JournalDecisionProductRequest,
  field: string,
): string | null {
  const value = record[field];
  if (value === null) return null;
  return requiredString(record, field);
}

function requiredInteger(
  record: JournalDecisionProductRequest,
  field: string,
): number {
  const value = record[field];
  if (!Number.isSafeInteger(value)) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field });
  }
  return Number(value);
}

function oneOf<T extends string>(
  value: string,
  allowed: readonly T[],
  field: string,
): T {
  if (!allowed.includes(value as T)) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field });
  }
  return value as T;
}

function idempotencyKey(
  item: JournalDataDecisionItem,
  body: JournalDecisionProductRequest,
): string {
  return createHash("sha256").update(JSON.stringify([
    "journal-data-decision-product-v2",
    item.decisionId,
    item.revision,
    body,
  ]), "utf8").digest("hex");
}

function decisionReasonCode(
  action: string,
  body: JournalDecisionProductRequest,
): string {
  if (action !== "exclude_execution") return "trader_data_decision";
  return oneOf(
    requiredString(body, "exclusionReason"),
    [
      "not_a_trade_execution",
      "duplicate_execution",
      "broker_correction_or_reversal",
      "corporate_action",
    ] as const,
    "exclusionReason",
  );
}

function executionEvidence(
  item: JournalDataDecisionItem,
  body: JournalDecisionProductRequest,
  field = "executionId",
) {
  const executionId = requiredString(body, field);
  const evidence = item.executions.find((candidate) =>
    candidate.executionId === executionId);
  if (!evidence) platformFailure("TRADERLINK_DATA_DECISION_INVALID_ACTION");
  return evidence;
}

function currentExecution(
  item: JournalDataDecisionItem,
  body: JournalDecisionProductRequest,
  loadExecution: JournalDecisionExecutionLoader,
): JournalExecutionVersionRecord {
  const evidence = executionEvidence(item, body);
  const current = loadExecution(evidence.executionId);
  if (!current || current.executionVersionId !== evidence.currentVersionId) {
    platformFailure("TRADERLINK_JOURNAL_EXECUTION_CONFLICT");
  }
  return current;
}

export function createJournalDataDecisionResolution(
  item: JournalDataDecisionItem,
  body: JournalDecisionProductRequest,
  loadExecution: JournalDecisionExecutionLoader,
): JournalDecisionResolution {
  const action = requiredString(body, "action");
  if (!item.allowedActions.includes(action as JournalDecisionResolution["action"])) {
    platformFailure("TRADERLINK_DATA_DECISION_INVALID_ACTION");
  }
  const common = {
    decisionId: item.decisionId,
    expectedRevision: item.revision,
    reasonCode: "trader_data_decision",
    reasonText: typeof body.reasonText === "string" ? body.reasonText : null,
  } as const;
  const repeatKey = () => idempotencyKey(item, body);

  if (action === "correct_execution_fact") {
    const current = currentExecution(item, body, loadExecution);
    const sourceTimestampText = requiredString(body, "sourceTimestampText");
    const sourceTimezone = requiredString(body, "sourceTimezone");
    const priceDecimal = nullableString(body, "priceDecimal");
    const feesDecimal = nullableString(body, "feesDecimal");
    return Object.freeze({
      ...common,
      action,
      executionId: current.executionId,
      expectedCurrentVersionId: current.executionVersionId,
      idempotencyKey: repeatKey(),
      sourceDisplayLabel: "Execution fact correction",
      facts: Object.freeze({
        instrumentId: current.instrumentId,
        tradeCurrency: current.tradeCurrency,
        sourceTimestampText,
        sourceTimezone,
        timeParserVersion: current.timeParserVersion,
        executedAtUtc: normalizeIbkrExecutionTime(
          sourceTimestampText,
          sourceTimezone,
        ),
        sourceOrderKey: current.sourceOrderKey,
        side: oneOf(requiredString(body, "side"), ["buy", "sell"] as const, "side"),
        quantityDecimal: requiredString(body, "quantityDecimal"),
        priceDecimal,
        feesDecimal,
        feeCurrency: feesDecimal === null
          ? null
          : requiredString(body, "feeCurrency"),
        feeSignConvention: feesDecimal === null
          ? "not_reported" as const
          : oneOf(
              requiredString(body, "feeSignConvention"),
              ["broker_reported_signed", "cash_effect"] as const,
              "feeSignConvention",
            ),
        factCompleteness: priceDecimal === null
          ? "price_missing" as const
          : "complete" as const,
      }),
    });
  }
  if (action === "set_execution_order") {
    const evidence = executionEvidence(item, body);
    return Object.freeze({
      ...common,
      action,
      executionId: evidence.executionId,
      expectedCurrentVersionId: evidence.currentVersionId,
      sameTimestampSequence: requiredInteger(body, "sameTimestampSequence"),
      idempotencyKey: repeatKey(),
      sourceDisplayLabel: "Same-time execution order",
    });
  }
  if (["exclude_execution", "restore_execution", "keep_distinct"].includes(action)) {
    const evidence = executionEvidence(item, body);
    return Object.freeze({
      ...common,
      action: action as "exclude_execution" | "restore_execution" | "keep_distinct",
      executionId: evidence.executionId,
      expectedCurrentVersionId: evidence.currentVersionId,
      ...(action === "exclude_execution"
        ? { reasonCode: decisionReasonCode(action, body) }
        : {}),
    });
  }
  if (action === "merge_supported_duplicate") {
    const duplicate = executionEvidence(item, body, "duplicateExecutionId");
    const retained = executionEvidence(item, body, "retainedExecutionId");
    if (duplicate.executionId === retained.executionId) {
      platformFailure("TRADERLINK_DATA_DECISION_INVALID_ACTION");
    }
    return Object.freeze({
      ...common,
      action,
      duplicateExecutionId: duplicate.executionId,
      retainedExecutionId: retained.executionId,
      expectedDuplicateVersionId: duplicate.currentVersionId,
    });
  }
  if (action === "reconcile_grouped_fills") {
    return Object.freeze({
      ...common,
      action,
    });
  }
  if (action === "correct_position_fact") {
    return Object.freeze({
      ...common,
      action,
      priorPositionFactId: requiredString(body, "positionFactId"),
      quantityDecimal: requiredString(body, "quantityDecimal"),
      idempotencyKey: repeatKey(),
      sourceDisplayLabel: "Position fact correction",
    });
  }
  if (action === "confirm_legitimate_open_position") {
    return Object.freeze({
      ...common,
      action,
      positionFactId: requiredString(body, "positionFactId"),
      idempotencyKey: repeatKey(),
      sourceDisplayLabel: "Confirmed open position",
    });
  }
  if (action === "supply_opening_inventory") {
    if (!item.instrumentRef || !item.currency) {
      platformFailure("TRADERLINK_DATA_DECISION_INVALID_ACTION");
    }
    return Object.freeze({
      ...common,
      action,
      instrumentId: item.instrumentRef,
      currency: item.currency,
      effectiveLocalDate: requiredString(body, "effectiveLocalDate"),
      sourceTimezone: requiredString(body, "sourceTimezone"),
      quantityDecimal: requiredString(body, "quantityDecimal"),
      idempotencyKey: repeatKey(),
      sourceDisplayLabel: "Opening inventory correction",
    });
  }
  if (action === "supply_position_fact") {
    if (!item.instrumentRef || !item.currency) {
      platformFailure("TRADERLINK_DATA_DECISION_INVALID_ACTION");
    }
    const factKind = oneOf(
      requiredString(body, "factKind"),
      ["opening_balance", "closing_balance", "open_position", "current_position"] as const,
      "factKind",
    );
    const timePrecision = oneOf(
      requiredString(body, "timePrecision"),
      ["date", "day_start", "day_end", "exact"] as const,
      "timePrecision",
    );
    const effectiveLocalDate = requiredString(body, "effectiveLocalDate");
    const sourceTimezone = requiredString(body, "sourceTimezone");
    const sourceTimeText = timePrecision === "exact"
      ? requiredString(body, "sourceTimeText")
      : null;
    return Object.freeze({
      ...common,
      action,
      instrumentId: item.instrumentRef,
      currency: item.currency,
      factKind,
      effectiveLocalDate,
      timePrecision,
      sourceTimeText,
      sourceTimezone,
      effectiveAtUtc: sourceTimeText
        ? normalizeIbkrExecutionTime(
            `${effectiveLocalDate}, ${sourceTimeText}`,
            sourceTimezone,
          )
        : null,
      quantityDecimal: requiredString(body, "quantityDecimal"),
      idempotencyKey: repeatKey(),
      sourceDisplayLabel: "Position fact supplied by trader",
    });
  }
  if (action === "add_missing_execution") {
    const execution = body.execution;
    if (!execution || typeof execution !== "object" || Array.isArray(execution)) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
        field: "execution",
      });
    }
    const record = execution as JournalDecisionProductRequest;
    const feesDecimal = nullableString(record, "feesDecimal");
    return Object.freeze({
      ...common,
      action,
      idempotencyKey: repeatKey(),
      sourceDisplayLabel: "Missing execution correction",
      execution: Object.freeze({
        sourceTimestampText: requiredString(record, "sourceTimestampText"),
        sourceTimezone: requiredString(record, "sourceTimezone"),
        normalizedSymbol: requiredString(record, "normalizedSymbol"),
        tradeCurrency: requiredString(record, "tradeCurrency"),
        side: oneOf(requiredString(record, "side"), ["buy", "sell"] as const, "side"),
        quantityDecimal: requiredString(record, "quantityDecimal"),
        priceDecimal: nullableString(record, "priceDecimal"),
        feesDecimal,
        feeCurrency: feesDecimal === null
          ? null
          : requiredString(record, "feeCurrency"),
        feeSignConvention: feesDecimal === null
          ? "not_reported" as const
          : "broker_reported_signed" as const,
      }),
    });
  }
  if (action === "supply_coverage_fact") {
    const coverage = item.suggestedCoverage;
    if (!coverage) platformFailure("TRADERLINK_DATA_DECISION_INVALID_ACTION");
    return Object.freeze({
      ...common,
      action,
      ...coverage,
      coverageKind: oneOf(
        requiredString(body, "coverageKind"),
        ["complete", "partial"] as const,
        "coverageKind",
      ),
      idempotencyKey: repeatKey(),
      sourceDisplayLabel: "Trading coverage supplied by trader",
    });
  }
  if (action === "accept_source_limitation") {
    return Object.freeze({ ...common, action });
  }
  platformFailure("TRADERLINK_DATA_DECISION_INVALID_ACTION");
}
