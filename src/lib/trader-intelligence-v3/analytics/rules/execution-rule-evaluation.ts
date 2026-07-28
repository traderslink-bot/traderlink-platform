import { compareUnicodeCodePoints } from "../../domain/canonical";
import type { ExactResult } from "../../domain/exact";
import { compareCanonicalTimestamps } from "../../domain/foundation";
import type { CanonicalContentDigest } from "../../domain/identity";
import {
  contractFailure,
  finalizeContentAddressedAuthority,
  validateCanonicalCount,
  validateClaimedDigest,
  validateContractKey,
  validateContractRecord,
  validateReasonCodes,
  validateTimestampValue,
  type AnalyticalContractFailure,
} from "../contracts";
import type { AnalyticalPartitionReceipt } from "../dataset";
import {
  type TradeQueryAuthority,
  type TradeQueryResult,
  type VerifiedTradeQueryDatasetSource,
} from "../query";
import {
  executeCounterfactualSimulation,
  type CounterfactualSimulationResult,
  type SimulationTradeOutcome,
} from "../simulation";
import { compileExecutionRuleTemplateAnalysis } from "./compile-execution-rule-template";
import { getExecutionRuleTemplate } from "./execution-rule-template-catalog";
import {
  verifyExecutionRuleInstance,
  verifyExecutionRuleLifecycleEvent,
  verifyExecutionRuleOwnerScope,
  verifyExecutionRuleVersion,
  type ExecutionRuleInstance,
  type ExecutionRuleLifecycleEvent,
  type ExecutionRuleOwnerScope,
  type ExecutionRuleVersion,
} from "./execution-rule-records";

export const EXECUTION_RULE_EVALUATION_VERSION =
  "ti_v3_execution_rule_evaluation_v1" as const;

export type ExecutionRuleEvaluationStatus =
  | "followed"
  | "broken"
  | "not_triggered"
  | "not_applicable"
  | "insufficient_data"
  | "unavailable";

export interface ExecutionRuleEvaluationSourceAuthority {
  readonly snapshotDigest: CanonicalContentDigest;
  readonly datasetReceiptDigest: CanonicalContentDigest;
  readonly datasetDerivationDigest: CanonicalContentDigest;
  readonly partitionDigest: CanonicalContentDigest;
  readonly queryPlanDigest: CanonicalContentDigest;
  readonly sourceQueryResultDigest: CanonicalContentDigest;
  readonly simulationPlanDigest: CanonicalContentDigest;
  readonly simulationResultDigest: CanonicalContentDigest;
  readonly ownerScope: readonly string[];
  readonly accountScope: readonly string[];
  readonly currency: string;
}

export interface ExecutionRuleEvaluation {
  readonly schemaVersion: typeof EXECUTION_RULE_EVALUATION_VERSION;
  readonly evaluationId: string;
  readonly evaluationScope: "historical_query_population";
  readonly historicalBasis: "historical_in_sample_classification_v1";
  readonly owner: ExecutionRuleOwnerScope;
  readonly ruleInstanceId: string;
  readonly ruleVersionId: string;
  readonly ruleVersionDigest: CanonicalContentDigest;
  readonly templateId: ExecutionRuleVersion["templateId"];
  readonly status: ExecutionRuleEvaluationStatus;
  readonly candidateTradeCount: string;
  readonly includedTradeCount: string;
  readonly triggeredTradeCount: string;
  readonly brokenTradeCount: string;
  readonly insufficientDataTradeCount: string;
  readonly triggeredTradeKeys: readonly string[];
  readonly brokenTradeKeys: readonly string[];
  readonly insufficientDataTradeKeys: readonly string[];
  readonly supportingExecutionDigests: readonly CanonicalContentDigest[];
  readonly supportingOccurrenceKeys: readonly string[];
  readonly reasonCodes: readonly string[];
  readonly limitationCodes: readonly string[];
  readonly sourceAuthority: ExecutionRuleEvaluationSourceAuthority;
  readonly evaluatedAt: string;
  readonly evaluationDigest: CanonicalContentDigest;
}

export interface BuildExecutionRuleEvaluationInput {
  readonly evaluationId: string;
  readonly ruleInstance: unknown;
  readonly ruleVersion: unknown;
  readonly lifecycleEvents: readonly unknown[];
  readonly source: VerifiedTradeQueryDatasetSource;
  readonly authority: TradeQueryAuthority;
  readonly sourceQueryResult: TradeQueryResult;
  readonly evaluatedAt: string;
}

const BROKEN_CLASSIFICATIONS = new Set([
  "skipped_by_rule",
  "skipped_session_stopped",
  "skipped_ticker_stopped",
  "skipped_during_cooldown",
]);

function canonicalUnique(values: readonly string[]): readonly string[] {
  return Object.freeze([...new Set(values)].sort(compareUnicodeCodePoints));
}

function outcomeSupportsRule(
  outcome: SimulationTradeOutcome,
  ruleId: string,
): boolean {
  return (
    outcome.responsibleRuleId === ruleId ||
    outcome.triggeredRuleIds.includes(ruleId)
  );
}

function validateOwnerAgainstPartition(
  owner: ExecutionRuleOwnerScope,
  partition: AnalyticalPartitionReceipt,
): ExactResult<true, AnalyticalContractFailure> {
  if (!partition.ownerScope.includes(owner.userId)) {
    return contractFailure(
      "ti_v3_analytics_contract_reference_mismatch",
      "$.owner.userId",
    );
  }
  if (
    owner.tradingAccountId !== null &&
    (partition.accountScope.length !== 1 ||
      partition.accountScope[0] !== owner.tradingAccountId)
  ) {
    return contractFailure(
      "ti_v3_analytics_contract_reference_mismatch",
      "$.owner.tradingAccountId",
    );
  }
  return { ok: true, value: true };
}

function sameOwner(
  left: ExecutionRuleOwnerScope,
  right: ExecutionRuleOwnerScope,
): boolean {
  return (
    left.userId === right.userId &&
    left.workspaceId === right.workspaceId &&
    left.tradingAccountId === right.tradingAccountId
  );
}

export function verifyExecutionRuleLifecycleHistory(input: Readonly<{
  readonly ruleInstance: unknown;
  readonly ruleVersion: ExecutionRuleVersion;
  readonly lifecycleEvents: readonly unknown[];
  readonly evaluatedAt: ExecutionRuleLifecycleEvent["effectiveAt"];
}>): ExactResult<
  Readonly<{
    readonly instance: ExecutionRuleInstance;
    readonly events: readonly ExecutionRuleLifecycleEvent[];
  }>,
  AnalyticalContractFailure
> {
  const instance = verifyExecutionRuleInstance(input.ruleInstance);
  if (!instance.ok) return instance;
  if (
    instance.value.ruleInstanceId !== input.ruleVersion.ruleInstanceId ||
    instance.value.currentRuleVersionId !== input.ruleVersion.ruleVersionId ||
    !sameOwner(instance.value.owner, input.ruleVersion.owner)
  ) {
    return contractFailure(
      "ti_v3_analytics_contract_reference_mismatch",
      "$.ruleInstance",
    );
  }
  if (
    !Array.isArray(input.lifecycleEvents) ||
    input.lifecycleEvents.length < 1 ||
    input.lifecycleEvents.length > 1000
  ) {
    return contractFailure(
      "ti_v3_analytics_contract_invalid",
      "$.lifecycleEvents",
    );
  }
  const events: ExecutionRuleLifecycleEvent[] = [];
  for (let index = 0; index < input.lifecycleEvents.length; index += 1) {
    const event = verifyExecutionRuleLifecycleEvent(
      input.lifecycleEvents[index],
    );
    if (!event.ok) return event;
    const previous = events.at(-1);
    if (
      event.value.ruleInstanceId !== instance.value.ruleInstanceId ||
      !sameOwner(event.value.owner, instance.value.owner) ||
      event.value.sequenceOrdinal !== String(index + 1) ||
      (previous === undefined
        ? event.value.previousLifecycleEventId !== null
        : event.value.previousLifecycleEventId !==
            previous.lifecycleEventId ||
          event.value.previousStatus !== previous.newStatus ||
          compareCanonicalTimestamps(
            event.value.effectiveAt,
            previous.effectiveAt,
          ) <= 0)
    ) {
      return contractFailure(
        "ti_v3_analytics_contract_reference_mismatch",
        `$.lifecycleEvents[${index}]`,
      );
    }
    events.push(event.value);
  }
  const lastEvent = events.at(-1)!;
  if (
    lastEvent.lifecycleEventId !==
      instance.value.currentLifecycleEventId ||
    lastEvent.newStatus !== instance.value.status ||
    compareCanonicalTimestamps(
      instance.value.updatedAt,
      input.evaluatedAt,
    ) > 0 ||
    compareCanonicalTimestamps(
      lastEvent.effectiveAt,
      input.evaluatedAt,
    ) > 0
  ) {
    return contractFailure(
      "ti_v3_analytics_contract_reference_mismatch",
      "$.lifecycleEvents",
    );
  }
  return {
    ok: true,
    value: Object.freeze({
      instance: instance.value,
      events: Object.freeze(events),
    }),
  };
}

function activeAt(
  events: readonly ExecutionRuleLifecycleEvent[],
  timestamp: ExecutionRuleLifecycleEvent["effectiveAt"],
): boolean {
  let status: ExecutionRuleLifecycleEvent["newStatus"] | null = null;
  for (const event of events) {
    if (compareCanonicalTimestamps(event.effectiveAt, timestamp) > 0) break;
    status = event.newStatus;
  }
  return status === "active";
}

function classifyEvaluation(
  ruleVersion: ExecutionRuleVersion,
  simulation: CounterfactualSimulationResult,
): Readonly<{
  status: ExecutionRuleEvaluationStatus;
  triggerOutcomes: readonly SimulationTradeOutcome[];
  brokenOutcomes: readonly SimulationTradeOutcome[];
  insufficientOutcomes: readonly SimulationTradeOutcome[];
  reasonCodes: readonly string[];
  limitationCodes: readonly string[];
}> {
  const ruleId = simulation.plan.rules[0]?.ruleId ?? "";
  const triggerOutcomes = simulation.tradeOutcomes.filter((outcome) =>
    outcome.triggeredRuleIds.includes(ruleId),
  );
  const brokenOutcomes = simulation.tradeOutcomes.filter(
    (outcome) =>
      outcome.responsibleRuleId === ruleId &&
      BROKEN_CLASSIFICATIONS.has(outcome.classification),
  );
  const insufficientOutcomes = simulation.tradeOutcomes.filter(
    (outcome) =>
      outcome.responsibleRuleId === ruleId &&
      (outcome.classification === "unavailable_required_authority" ||
        outcome.classification === "resize_unavailable_quantity" ||
        outcome.classification === "executed_resized_net_incomplete" ||
        outcome.classification === "executed_resized_net_unavailable" ||
        outcome.classification === "executed_resized_net_estimated"),
  );
  const resizeAdherenceUnsupported =
    ruleVersion.templateId === "reduce_next_trade_size_after_loss";
  const status: ExecutionRuleEvaluationStatus = resizeAdherenceUnsupported
    ? "unavailable"
    : brokenOutcomes.length > 0
      ? "broken"
      : insufficientOutcomes.length > 0
        ? "insufficient_data"
        : triggerOutcomes.length > 0
          ? "followed"
          : BigInt(simulation.includedCount) === BigInt(0)
            ? "not_applicable"
            : "not_triggered";
  const relevant = simulation.tradeOutcomes.filter((outcome) =>
    outcomeSupportsRule(outcome, ruleId),
  );
  const reasonCodes = canonicalUnique([
    ...relevant.map((outcome) => outcome.reasonCode),
    ...(resizeAdherenceUnsupported
      ? ["ti_v3_rule_adherence_resize_baseline_unsupported"]
      : []),
    ...(status === "not_triggered"
      ? ["ti_v3_rule_evaluation_no_trigger_not_counted_followed"]
      : []),
  ]);
  const limitationCodes = canonicalUnique([
    ...simulation.limitationCodes,
    ...relevant.flatMap((outcome) => outcome.limitationCodes),
    ...(resizeAdherenceUnsupported
      ? ["ti_v3_rule_adherence_requires_declared_size_baseline"]
      : []),
  ]);
  return Object.freeze({
    status,
    triggerOutcomes: Object.freeze(triggerOutcomes),
    brokenOutcomes: Object.freeze(brokenOutcomes),
    insufficientOutcomes: Object.freeze(insufficientOutcomes),
    reasonCodes,
    limitationCodes,
  });
}

export function buildGovernedExecutionRuleEvaluation(
  input: BuildExecutionRuleEvaluationInput,
): ExactResult<ExecutionRuleEvaluation, AnalyticalContractFailure> {
  const evaluationId = validateContractKey(
    input.evaluationId,
    "$.evaluationId",
  );
  if (!evaluationId.ok) return evaluationId;
  const evaluatedAt = validateTimestampValue(
    input.evaluatedAt,
    "$.evaluatedAt",
  );
  if (!evaluatedAt.ok) return evaluatedAt;
  const ruleVersion = verifyExecutionRuleVersion(input.ruleVersion);
  if (!ruleVersion.ok) return ruleVersion;
  const lifecycle = verifyExecutionRuleLifecycleHistory({
    ruleInstance: input.ruleInstance,
    ruleVersion: ruleVersion.value,
    lifecycleEvents: input.lifecycleEvents,
    evaluatedAt: evaluatedAt.value,
  });
  if (!lifecycle.ok) return lifecycle;
  const ownerBinding = validateOwnerAgainstPartition(
    ruleVersion.value.owner,
    input.authority.partitionReceipt,
  );
  if (!ownerBinding.ok) return ownerBinding;
  const {
    queryPlanDigest: _verifiedQueryPlanDigest,
    ...sourceQueryPlanBody
  } = input.sourceQueryResult.normalizedQueryPlan;
  void _verifiedQueryPlanDigest;
  const compiled = compileExecutionRuleTemplateAnalysis({
    templateId: ruleVersion.value.templateId,
    sourceQueryPlan: sourceQueryPlanBody,
    authority: input.authority,
    configuration: ruleVersion.value.configuration,
  });
  if (!compiled.ok) return compiled;
  const simulation = executeCounterfactualSimulation({
    source: input.source,
    partitionReceipt: input.authority.partitionReceipt,
    sourceQueryResult: input.sourceQueryResult,
    simulationPlan: compiled.value.compiledPreset.plan,
  });
  if (!simulation.ok) return simulation;
  if (
    simulation.value.plan.rules.length !== 1 ||
    simulation.value.plan.planDigest !==
      compiled.value.compiledPreset.plan.planDigest
  ) {
    return contractFailure(
      "ti_v3_analytics_contract_reference_mismatch",
      "$.simulation.plan",
    );
  }
  if (
    compareCanonicalTimestamps(
      evaluatedAt.value,
      ruleVersion.value.effectiveFrom,
    ) < 0
  ) {
    return contractFailure(
      "ti_v3_analytics_contract_invalid",
      "$.evaluatedAt",
    );
  }
  const dataset = input.source.readVerifiedDataset();
  if (!dataset.ok) {
    return contractFailure(
      "ti_v3_analytics_contract_reference_mismatch",
      "$.source",
    );
  }
  const rowsByKey = new Map(
    dataset.value.datasetReceipt.rows.map((row) => [
      row.semanticRoundTripKey,
      row,
    ]),
  );
  for (const tradeKey of simulation.value.actualTradeKeys) {
    const row = rowsByKey.get(tradeKey);
    if (row === undefined) {
      return contractFailure(
        "ti_v3_analytics_contract_reference_mismatch",
        "$.sourceQueryResult.actualTradeKeys",
      );
    }
    const firstEntryAt = validateTimestampValue(
      row.firstEntryAt,
      "$.sourceQueryResult.firstEntryAt",
    );
    if (!firstEntryAt.ok) return firstEntryAt;
    if (
      compareCanonicalTimestamps(
        firstEntryAt.value,
        ruleVersion.value.effectiveFrom,
      ) < 0
    ) {
      return contractFailure(
        "ti_v3_analytics_contract_reference_mismatch",
        "$.sourceQueryResult.ruleEffectiveWindow",
      );
    }
    if (!activeAt(lifecycle.value.events, firstEntryAt.value)) {
      return contractFailure(
        "ti_v3_analytics_contract_reference_mismatch",
        "$.sourceQueryResult.lifecycleActiveWindow",
      );
    }
  }
  const classified = classifyEvaluation(ruleVersion.value, simulation.value);
  const ruleId = simulation.value.plan.rules[0].ruleId;
  const relevantOutcomes = simulation.value.tradeOutcomes.filter((outcome) =>
    outcomeSupportsRule(outcome, ruleId),
  );
  const body = {
    schemaVersion: EXECUTION_RULE_EVALUATION_VERSION,
    evaluationId: evaluationId.value,
    evaluationScope: "historical_query_population" as const,
    historicalBasis: "historical_in_sample_classification_v1" as const,
    owner: ruleVersion.value.owner,
    ruleInstanceId: ruleVersion.value.ruleInstanceId,
    ruleVersionId: ruleVersion.value.ruleVersionId,
    ruleVersionDigest: ruleVersion.value.versionDigest,
    templateId: ruleVersion.value.templateId,
    status: classified.status,
    candidateTradeCount: simulation.value.candidateCount,
    includedTradeCount: simulation.value.includedCount,
    triggeredTradeCount: String(classified.triggerOutcomes.length),
    brokenTradeCount: String(classified.brokenOutcomes.length),
    insufficientDataTradeCount: String(classified.insufficientOutcomes.length),
    triggeredTradeKeys: canonicalUnique(
      classified.triggerOutcomes.map((outcome) => outcome.sourceTradeKey),
    ),
    brokenTradeKeys: canonicalUnique(
      classified.brokenOutcomes.map((outcome) => outcome.sourceTradeKey),
    ),
    insufficientDataTradeKeys: canonicalUnique(
      classified.insufficientOutcomes.map(
        (outcome) => outcome.sourceTradeKey,
      ),
    ),
    supportingExecutionDigests: canonicalUnique(
      relevantOutcomes.flatMap(
        (outcome) => outcome.supportingExecutionDigests,
      ),
    ) as readonly CanonicalContentDigest[],
    supportingOccurrenceKeys: canonicalUnique(
      relevantOutcomes.flatMap(
        (outcome) => outcome.supportingOccurrenceKeys,
      ),
    ),
    reasonCodes: classified.reasonCodes,
    limitationCodes: classified.limitationCodes,
    sourceAuthority: Object.freeze({
      snapshotDigest:
        simulation.value.plan.sourceQueryPlan.authority.snapshotDigest,
      datasetReceiptDigest:
        simulation.value.plan.sourceQueryPlan.authority.datasetReceiptDigest,
      datasetDerivationDigest:
        simulation.value.plan.sourceQueryPlan.authority
          .datasetDerivationDigest,
      partitionDigest:
        simulation.value.plan.sourceQueryPlan.authority.partitionDigest,
      queryPlanDigest:
        simulation.value.plan.sourceQueryPlan.queryPlanDigest,
      sourceQueryResultDigest: simulation.value.sourceQueryResultDigest,
      simulationPlanDigest: simulation.value.plan.planDigest,
      simulationResultDigest: simulation.value.resultDigest,
      ownerScope:
        simulation.value.plan.sourceQueryPlan.authority.ownerScope,
      accountScope:
        simulation.value.plan.sourceQueryPlan.authority.accountScope,
      currency: simulation.value.plan.sourceQueryPlan.authority.currency,
    }),
    evaluatedAt: evaluatedAt.value,
  };
  const addressed = finalizeContentAddressedAuthority(
    "execution_rule_evaluation",
    body,
    "evaluationDigest",
  );
  return addressed.ok
    ? {
        ok: true,
        value: addressed.value as ExecutionRuleEvaluation,
      }
    : addressed;
}

export function verifyExecutionRuleEvaluation(
  input: unknown,
): ExactResult<ExecutionRuleEvaluation, AnalyticalContractFailure> {
  const record = validateContractRecord(input, [
    "schemaVersion",
    "evaluationId",
    "evaluationScope",
    "historicalBasis",
    "owner",
    "ruleInstanceId",
    "ruleVersionId",
    "ruleVersionDigest",
    "templateId",
    "status",
    "candidateTradeCount",
    "includedTradeCount",
    "triggeredTradeCount",
    "brokenTradeCount",
    "insufficientDataTradeCount",
    "triggeredTradeKeys",
    "brokenTradeKeys",
    "insufficientDataTradeKeys",
    "supportingExecutionDigests",
    "supportingOccurrenceKeys",
    "reasonCodes",
    "limitationCodes",
    "sourceAuthority",
    "evaluatedAt",
    "evaluationDigest",
  ]);
  if (!record.ok) return record;
  if (
    record.value.schemaVersion !== EXECUTION_RULE_EVALUATION_VERSION ||
    record.value.evaluationScope !== "historical_query_population" ||
    record.value.historicalBasis !==
      "historical_in_sample_classification_v1"
  ) {
    return contractFailure(
      "ti_v3_analytics_contract_invalid",
      "$.schemaVersion",
    );
  }
  const statuses = new Set<ExecutionRuleEvaluationStatus>([
    "followed",
    "broken",
    "not_triggered",
    "not_applicable",
    "insufficient_data",
    "unavailable",
  ]);
  if (
    typeof record.value.status !== "string" ||
    !statuses.has(record.value.status as ExecutionRuleEvaluationStatus)
  ) {
    return contractFailure("ti_v3_analytics_contract_invalid", "$.status");
  }
  const evaluationId = validateContractKey(
    record.value.evaluationId,
    "$.evaluationId",
  );
  if (!evaluationId.ok) return evaluationId;
  const ruleInstanceId = validateContractKey(
    record.value.ruleInstanceId,
    "$.ruleInstanceId",
  );
  if (!ruleInstanceId.ok) return ruleInstanceId;
  const ruleVersionId = validateContractKey(
    record.value.ruleVersionId,
    "$.ruleVersionId",
  );
  if (!ruleVersionId.ok) return ruleVersionId;
  const owner = verifyExecutionRuleOwnerScope(record.value.owner);
  if (!owner.ok) return owner;
  const ruleVersionDigest = validateClaimedDigest(
    record.value.ruleVersionDigest,
    "$.ruleVersionDigest",
    "execution_rule_version",
  );
  if (!ruleVersionDigest.ok) return ruleVersionDigest;
  if (
    typeof record.value.templateId !== "string" ||
    getExecutionRuleTemplate(record.value.templateId) === null
  ) {
    return contractFailure(
      "ti_v3_analytics_contract_invalid",
      "$.templateId",
    );
  }
  for (const key of [
    "candidateTradeCount",
    "includedTradeCount",
    "triggeredTradeCount",
    "brokenTradeCount",
    "insufficientDataTradeCount",
  ] as const) {
    const count = validateCanonicalCount(record.value[key], `$.${key}`);
    if (!count.ok) return count;
  }
  const reasonCodes = validateReasonCodes(record.value.reasonCodes, "$.reasonCodes");
  if (!reasonCodes.ok) return reasonCodes;
  const limitationCodes = validateReasonCodes(
    record.value.limitationCodes,
    "$.limitationCodes",
  );
  if (!limitationCodes.ok) return limitationCodes;
  const evaluatedAt = validateTimestampValue(
    record.value.evaluatedAt,
    "$.evaluatedAt",
  );
  if (!evaluatedAt.ok) return evaluatedAt;
  const claimedDigest = validateClaimedDigest(
    record.value.evaluationDigest,
    "$.evaluationDigest",
    "execution_rule_evaluation",
  );
  if (!claimedDigest.ok) return claimedDigest;
  const {
    evaluationDigest: _evaluationDigest,
    ...body
  } = record.value;
  void _evaluationDigest;
  const rebuilt = finalizeContentAddressedAuthority(
    "execution_rule_evaluation",
    body,
    "evaluationDigest",
  );
  if (!rebuilt.ok) return rebuilt;
  if (rebuilt.value.evaluationDigest !== claimedDigest.value) {
    return contractFailure(
      "ti_v3_analytics_contract_digest_mismatch",
      "$.evaluationDigest",
    );
  }
  return {
    ok: true,
    value: rebuilt.value as unknown as ExecutionRuleEvaluation,
  };
}
