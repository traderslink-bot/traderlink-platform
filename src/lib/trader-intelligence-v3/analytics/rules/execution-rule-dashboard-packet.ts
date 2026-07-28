import { compareUnicodeCodePoints } from "../../domain/canonical";
import type { ExactResult } from "../../domain/exact";
import { compareCanonicalTimestamps } from "../../domain/foundation";
import type { CanonicalContentDigest } from "../../domain/identity";
import {
  contractFailure,
  finalizeContentAddressedAuthority,
  validateTimestampValue,
  type AnalyticalContractFailure,
} from "../contracts";
import {
  verifyExecutionRuleEvaluation,
  verifyExecutionRuleLifecycleHistory,
  type ExecutionRuleEvaluation,
} from "./execution-rule-evaluation";
import {
  verifyExecutionRuleVersion,
  type ExecutionRuleInstance,
  type ExecutionRuleLifecycleEvent,
  type ExecutionRuleVersion,
} from "./execution-rule-records";
import { getExecutionRuleTemplate } from "./execution-rule-template-catalog";

export const EXECUTION_RULE_DASHBOARD_PACKET_VERSION =
  "ti_v3_execution_rule_dashboard_packet_v1" as const;

export interface ExecutionRuleDashboardEvaluationSummary {
  readonly status: ExecutionRuleEvaluation["status"];
  readonly evaluatedAt: string;
  readonly candidateTradeCount: string;
  readonly includedTradeCount: string;
  readonly triggeredTradeCount: string;
  readonly brokenTradeCount: string;
  readonly insufficientDataTradeCount: string;
  readonly currency: string;
  readonly reasonCodes: readonly string[];
  readonly limitationCodes: readonly string[];
}

export interface ExecutionRuleDashboardCard {
  readonly ruleInstanceId: string;
  readonly status: ExecutionRuleInstance["status"];
  readonly accountScope: Readonly<{
    readonly kind: "workspace" | "trading_account";
    readonly tradingAccountLabel: string | null;
  }>;
  readonly template: Readonly<{
    readonly templateId: ExecutionRuleVersion["templateId"];
    readonly templateVersion: "v1";
    readonly label: string;
    readonly description: string;
    readonly category: string;
    readonly scope: string;
    readonly limitationSummary: string;
  }>;
  readonly currentVersion: Readonly<{
    readonly versionOrdinal: string;
    readonly configuration: Readonly<Record<string, string>>;
    readonly effectiveFrom: string;
  }>;
  readonly lifecycle: readonly Readonly<{
    readonly eventType: ExecutionRuleLifecycleEvent["eventType"];
    readonly effectiveAt: string;
  }>[];
  readonly latestEvaluation: ExecutionRuleDashboardEvaluationSummary | null;
}

export interface ExecutionRuleDashboardPacket {
  readonly schemaVersion: typeof EXECUTION_RULE_DASHBOARD_PACKET_VERSION;
  readonly kind: "trading_rules";
  readonly generatedAt: string;
  readonly rules: readonly ExecutionRuleDashboardCard[];
  readonly packetDigest: CanonicalContentDigest;
}

export interface ExecutionRuleDashboardPacketItemInput {
  readonly ruleInstance: unknown;
  readonly ruleVersion: unknown;
  readonly lifecycleEvents: readonly unknown[];
  readonly latestEvaluation: unknown | null;
  readonly tradingAccountLabel: unknown;
}

function validateAccountLabel(
  input: unknown,
  hasTradingAccount: boolean,
): ExactResult<string | null, AnalyticalContractFailure> {
  if (!hasTradingAccount) {
    return input === null
      ? { ok: true, value: null }
      : contractFailure(
          "ti_v3_analytics_contract_invalid",
          "$.tradingAccountLabel",
        );
  }
  if (
    typeof input !== "string" ||
    input.length < 1 ||
    input.length > 80 ||
    input.trim() !== input ||
    /[\u0000-\u001f\u007f]/.test(input)
  ) {
    return contractFailure(
      "ti_v3_analytics_contract_invalid",
      "$.tradingAccountLabel",
    );
  }
  return { ok: true, value: input };
}

function sameEvaluationOwner(
  evaluation: ExecutionRuleEvaluation,
  instance: ExecutionRuleInstance,
): boolean {
  return (
    evaluation.owner.userId === instance.owner.userId &&
    evaluation.owner.workspaceId === instance.owner.workspaceId &&
    evaluation.owner.tradingAccountId === instance.owner.tradingAccountId
  );
}

export function buildExecutionRuleDashboardPacket(input: Readonly<{
  readonly generatedAt: string;
  readonly items: readonly ExecutionRuleDashboardPacketItemInput[];
}>): ExactResult<ExecutionRuleDashboardPacket, AnalyticalContractFailure> {
  const generatedAt = validateTimestampValue(input.generatedAt, "$.generatedAt");
  if (!generatedAt.ok) return generatedAt;
  if (!Array.isArray(input.items) || input.items.length > 100) {
    return contractFailure(
      "ti_v3_analytics_contract_oversized",
      "$.items",
    );
  }
  const cards: ExecutionRuleDashboardCard[] = [];
  const identities = new Set<string>();

  for (let index = 0; index < input.items.length; index += 1) {
    const item = input.items[index];
    const version = verifyExecutionRuleVersion(item.ruleVersion);
    if (!version.ok) return version;
    const lifecycle = verifyExecutionRuleLifecycleHistory({
      ruleInstance: item.ruleInstance,
      ruleVersion: version.value,
      lifecycleEvents: item.lifecycleEvents,
      evaluatedAt: generatedAt.value,
    });
    if (!lifecycle.ok) return lifecycle;
    if (identities.has(lifecycle.value.instance.ruleInstanceId)) {
      return contractFailure(
        "ti_v3_analytics_contract_duplicate_identity",
        "$.items",
      );
    }
    identities.add(lifecycle.value.instance.ruleInstanceId);
    const template = getExecutionRuleTemplate(version.value.templateId);
    if (template === null) {
      return contractFailure(
        "ti_v3_analytics_contract_invalid",
        `$.items[${index}].templateId`,
      );
    }
    const accountLabel = validateAccountLabel(
      item.tradingAccountLabel,
      lifecycle.value.instance.owner.tradingAccountId !== null,
    );
    if (!accountLabel.ok) return accountLabel;
    const evaluation =
      item.latestEvaluation === null
        ? { ok: true as const, value: null }
        : verifyExecutionRuleEvaluation(item.latestEvaluation);
    if (!evaluation.ok) return evaluation;
    const evaluationAt =
      evaluation.value === null
        ? { ok: true as const, value: null }
        : validateTimestampValue(
            evaluation.value.evaluatedAt,
            `$.items[${index}].latestEvaluation.evaluatedAt`,
          );
    if (!evaluationAt.ok) return evaluationAt;
    if (
      evaluation.value !== null &&
      (evaluation.value.ruleInstanceId !==
        lifecycle.value.instance.ruleInstanceId ||
        evaluation.value.ruleVersionId !== version.value.ruleVersionId ||
        evaluation.value.ruleVersionDigest !== version.value.versionDigest ||
        !sameEvaluationOwner(
          evaluation.value,
          lifecycle.value.instance,
        ) ||
        compareCanonicalTimestamps(
          evaluationAt.value!,
          generatedAt.value,
        ) > 0)
    ) {
      return contractFailure(
        "ti_v3_analytics_contract_reference_mismatch",
        `$.items[${index}].latestEvaluation`,
      );
    }
    cards.push(
      Object.freeze({
        ruleInstanceId: lifecycle.value.instance.ruleInstanceId,
        status: lifecycle.value.instance.status,
        accountScope: Object.freeze({
          kind:
            lifecycle.value.instance.owner.tradingAccountId === null
              ? "workspace" as const
              : "trading_account" as const,
          tradingAccountLabel: accountLabel.value,
        }),
        template: Object.freeze({
          templateId: template.templateId,
          templateVersion: template.templateVersion,
          label: template.label,
          description: template.description,
          category: template.category,
          scope: template.scope,
          limitationSummary: template.limitationSummary,
        }),
        currentVersion: Object.freeze({
          versionOrdinal: version.value.versionOrdinal,
          configuration: version.value.configuration,
          effectiveFrom: version.value.effectiveFrom,
        }),
        lifecycle: Object.freeze(
          lifecycle.value.events.map((event) =>
            Object.freeze({
              eventType: event.eventType,
              effectiveAt: event.effectiveAt,
            }),
          ),
        ),
        latestEvaluation:
          evaluation.value === null
            ? null
            : Object.freeze({
                status: evaluation.value.status,
                evaluatedAt: evaluation.value.evaluatedAt,
                candidateTradeCount:
                  evaluation.value.candidateTradeCount,
                includedTradeCount:
                  evaluation.value.includedTradeCount,
                triggeredTradeCount:
                  evaluation.value.triggeredTradeCount,
                brokenTradeCount: evaluation.value.brokenTradeCount,
                insufficientDataTradeCount:
                  evaluation.value.insufficientDataTradeCount,
                currency: evaluation.value.sourceAuthority.currency,
                reasonCodes: evaluation.value.reasonCodes,
                limitationCodes: evaluation.value.limitationCodes,
              }),
      }),
    );
  }

  const addressed = finalizeContentAddressedAuthority(
    "execution_rule_dashboard_packet",
    {
      schemaVersion: EXECUTION_RULE_DASHBOARD_PACKET_VERSION,
      kind: "trading_rules" as const,
      generatedAt: generatedAt.value,
      rules: Object.freeze(
        cards.sort((left, right) =>
          compareUnicodeCodePoints(
            left.ruleInstanceId,
            right.ruleInstanceId,
          ),
        ),
      ),
    },
    "packetDigest",
  );
  return addressed.ok
    ? {
        ok: true,
        value: addressed.value as ExecutionRuleDashboardPacket,
      }
    : addressed;
}
