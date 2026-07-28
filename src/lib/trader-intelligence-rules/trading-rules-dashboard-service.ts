import { randomUUID } from "node:crypto";

import {
  buildExecutionRuleDashboardPacket,
  EXECUTION_RULE_TEMPLATE_CATALOG,
  getExecutionRuleTemplate,
  type ExecutionRuleDashboardPacket,
  type ExecutionRuleLifecycleStatus,
  type ExecutionRuleOwnerScope,
  type ExecutionRuleParameterDefinition,
  type ExecutionRuleTemplateCategory,
  type ExecutionRuleTemplateId,
  type ExecutionRuleTemplateScope,
} from "@/src/lib/trader-intelligence-v3/analytics/rules";
import type { TraderIntelligenceOwnerContext } from "@/src/lib/trader-intelligence-v3/domain";

import { SqliteExecutionRuleRepository } from "./sqlite-execution-rule-repository";
import {
  SqliteManualCustomRuleRepository,
  type ManualCustomRuleCategory,
  type ManualCustomRuleRecord,
  type ManualCustomRuleReviewScope,
  type ManualCustomRuleStatus,
} from "./manual-custom-rule-repository";

export interface TradingRulesTemplateView {
  readonly templateId: ExecutionRuleTemplateId;
  readonly label: string;
  readonly description: string;
  readonly category: ExecutionRuleTemplateCategory;
  readonly scope: ExecutionRuleTemplateScope;
  readonly parameters: readonly ExecutionRuleParameterDefinition[];
  readonly exampleConfiguration: Readonly<Record<string, string>>;
  readonly limitationSummary: string;
}

export interface TradingRulesDashboardView {
  readonly packet: ExecutionRuleDashboardPacket;
  readonly templates: readonly TradingRulesTemplateView[];
  readonly manualRules: readonly ManualCustomRuleRecord[];
}

export type TradingRulesMutation =
  | Readonly<{
      action: "create";
      templateId: string;
      configuration: unknown;
    }>
  | Readonly<{
      action: "revise";
      ruleInstanceId: string;
      configuration: unknown;
    }>
  | Readonly<{
      action: "transition";
      ruleInstanceId: string;
      expectedCurrentStatus: ExecutionRuleLifecycleStatus;
      newStatus: ExecutionRuleLifecycleStatus;
    }>
  | Readonly<{
      action: "create_manual";
      title: string;
      statement: string;
      category: ManualCustomRuleCategory;
      reviewScope: ManualCustomRuleReviewScope;
      isFocus: boolean;
    }>
  | Readonly<{
      action: "revise_manual";
      ruleId: string;
      expectedVersionOrdinal: string;
      title: string;
      statement: string;
      category: ManualCustomRuleCategory;
      reviewScope: ManualCustomRuleReviewScope;
      isFocus: boolean;
    }>
  | Readonly<{
      action: "transition_manual";
      ruleId: string;
      expectedCurrentStatus: ManualCustomRuleStatus;
      newStatus: ManualCustomRuleStatus;
    }>;

function ownerScope(
  owner: TraderIntelligenceOwnerContext,
): ExecutionRuleOwnerScope {
  return Object.freeze({
    userId: owner.identity.ownerId,
    workspaceId: "primary-workspace",
    tradingAccountId: null,
  });
}

function nextTimestamp(after?: string): string {
  const now = Date.now();
  const boundary = after ? Date.parse(after) + 1 : now;
  return new Date(Math.max(now, boundary))
    .toISOString()
    .replace(/Z$/, "000000Z");
}

function safeTemplates(): readonly TradingRulesTemplateView[] {
  return Object.freeze(
    EXECUTION_RULE_TEMPLATE_CATALOG.templates.map((template) =>
      Object.freeze({
        templateId: template.templateId,
        label: template.label,
        description: template.description,
        category: template.category,
        scope: template.scope,
        parameters: Object.freeze(
          template.parameters.map((parameter) =>
            Object.freeze({
              key: parameter.key,
              label: parameter.label,
              kind: parameter.kind,
              unit: parameter.unit,
              maximum: parameter.maximum,
              options: Object.freeze([...parameter.options]),
            }),
          ),
        ),
        exampleConfiguration: Object.freeze({
          ...template.exampleConfiguration,
        }),
        limitationSummary: template.limitationSummary,
      }),
    ),
  );
}

function openRepository(): SqliteExecutionRuleRepository {
  return new SqliteExecutionRuleRepository();
}

function openManualRepository(): SqliteManualCustomRuleRepository {
  return new SqliteManualCustomRuleRepository();
}

function clientSafeDashboardView(
  view: TradingRulesDashboardView,
): TradingRulesDashboardView {
  return JSON.parse(JSON.stringify(view)) as TradingRulesDashboardView;
}

export function readTradingRulesDashboard(
  owner: TraderIntelligenceOwnerContext,
): TradingRulesDashboardView {
  const repository = openRepository();
  const manualRepository = openManualRepository();
  try {
    const scope = ownerScope(owner);
    const snapshots = repository.list(scope);
    const packet = buildExecutionRuleDashboardPacket({
      generatedAt: nextTimestamp(),
      items: snapshots.map((snapshot) => ({
        ruleInstance: snapshot.instance,
        ruleVersion: snapshot.currentVersion,
        lifecycleEvents: repository.listLifecycleEvents(
          scope,
          snapshot.instance.ruleInstanceId,
        ),
        latestEvaluation: null,
        tradingAccountLabel: null,
      })),
    });
    if (!packet.ok) {
      throw new Error(`${packet.error.code}:${packet.error.path}`);
    }
    return clientSafeDashboardView(Object.freeze({
      packet: packet.value,
      templates: safeTemplates(),
      manualRules: manualRepository.list(scope),
    }));
  } finally {
    repository.close();
    manualRepository.close();
  }
}

export function mutateTradingRulesDashboard(
  owner: TraderIntelligenceOwnerContext,
  mutation: TradingRulesMutation,
): TradingRulesDashboardView {
  const scope = ownerScope(owner);
  if (
    mutation.action === "create_manual" ||
    mutation.action === "revise_manual" ||
    mutation.action === "transition_manual"
  ) {
    const manualRepository = openManualRepository();
    try {
      if (mutation.action === "create_manual") {
        manualRepository.create({
          ...mutation,
          ruleId: `manual-rule-${randomUUID()}`,
          owner: scope,
          effectiveFrom: nextTimestamp(),
        });
      } else if (mutation.action === "revise_manual") {
        const current = manualRepository.list(scope).find(
          (rule) => rule.ruleId === mutation.ruleId,
        );
        manualRepository.revise({
          ...mutation,
          owner: scope,
          effectiveFrom: nextTimestamp(current?.updatedAt),
        });
      } else {
        const current = manualRepository.list(scope).find(
          (rule) => rule.ruleId === mutation.ruleId,
        );
        manualRepository.transition({
          ...mutation,
          owner: scope,
          effectiveAt: nextTimestamp(current?.updatedAt),
        });
      }
    } finally {
      manualRepository.close();
    }
    return readTradingRulesDashboard(owner);
  }
  const repository = openRepository();
  try {
    if (mutation.action === "create") {
      const template = getExecutionRuleTemplate(mutation.templateId);
      if (template === null) {
        throw new Error("ti_v3_rules_template_unknown");
      }
      const suffix = randomUUID();
      repository.create({
        ruleInstanceId: `rule-${suffix}`,
        ruleVersionId: `rule-version-${suffix}`,
        owner: scope,
        templateId: template.templateId,
        configuration: mutation.configuration,
        effectiveFrom: nextTimestamp(),
      });
    } else {
      const snapshot = repository.get(scope, mutation.ruleInstanceId);
      if (snapshot === null) {
        throw new Error("ti_v3_rules_instance_unknown");
      }
      if (mutation.action === "revise") {
        repository.revise({
          ruleInstanceId: snapshot.instance.ruleInstanceId,
          ruleVersionId: `rule-version-${randomUUID()}`,
          owner: scope,
          expectedCurrentRuleVersionId:
            snapshot.instance.currentRuleVersionId,
          configuration: mutation.configuration,
          effectiveFrom: nextTimestamp(snapshot.instance.updatedAt),
        });
      } else {
        repository.transitionLifecycle({
          lifecycleEventId: `rule-lifecycle-${randomUUID()}`,
          ruleInstanceId: snapshot.instance.ruleInstanceId,
          owner: scope,
          expectedCurrentStatus: mutation.expectedCurrentStatus,
          newStatus: mutation.newStatus,
          effectiveAt: nextTimestamp(snapshot.instance.updatedAt),
        });
      }
    }
  } finally {
    repository.close();
  }
  return readTradingRulesDashboard(owner);
}
