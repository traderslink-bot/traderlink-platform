import type {
  JournalRuleLifecycleState,
  JournalRuleRecord,
} from "@/src/modules/journal/contracts/journal-annotation-contracts";
import type { AccountScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import type { JournalAccountSelectionRef } from "@/src/modules/platform/contracts/journal-account-selection";
import { platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";

import { JournalAnnotationService } from "./journal-annotation-service";

export type TradingRulesParameterView = Readonly<{
  key: string;
  label: string;
  kind: "positive_integer" | "positive_decimal" | "wall_clock_time" | "enum";
  unit: string;
  maximum: string | null;
  options: readonly string[];
}>;

export type TradingRulesTemplateView = Readonly<{
  templateId: string;
  label: string;
  description: string;
  category: "frequency" | "timing" | "risk" | "size" | "scope";
  scope: "trade" | "ticker_day" | "day_session" | "trade_sequence";
  parameters: readonly TradingRulesParameterView[];
  exampleConfiguration: Readonly<Record<string, string>>;
  limitationSummary: string;
}>;

export type ExecutionRuleLifecycleStatus = JournalRuleLifecycleState;

export type ExecutionRuleDashboardCard = Readonly<{
  ruleInstanceId: string;
  revision: number;
  status: ExecutionRuleLifecycleStatus;
  template: TradingRulesTemplateView;
  currentVersion: Readonly<{
    ruleVersionId: string;
    versionOrdinal: string;
    configuration: Readonly<Record<string, string>>;
    effectiveFrom: string;
  }>;
  latestEvaluation: null;
}>;

export type ManualCustomRuleStatus = JournalRuleLifecycleState;
export type ManualCustomRuleRecord = Readonly<{
  ruleId: string;
  revision: number;
  title: string;
  statement: string;
  category: "process" | "setup" | "mindset" | "review";
  reviewScope: "day_session" | "trade" | "both";
  isFocus: boolean;
  status: ManualCustomRuleStatus;
  versionOrdinal: string;
  ruleVersionId: string;
  effectiveFrom: string;
  createdAt: string;
  updatedAt: string;
}>;

export type TradingRulesDashboardView = Readonly<{
  expectedAccountSelectionRef: JournalAccountSelectionRef;
  packet: Readonly<{ rules: readonly ExecutionRuleDashboardCard[] }>;
  templates: readonly TradingRulesTemplateView[];
  manualRules: readonly ManualCustomRuleRecord[];
}>;

function parameter(
  key: string,
  label: string,
  kind: TradingRulesParameterView["kind"],
  unit: string,
  maximum: string | null = null,
  options: readonly string[] = [],
): TradingRulesParameterView {
  return Object.freeze({ key, label, kind, unit, maximum, options: Object.freeze([...options]) });
}

function templateConfiguration(value: object): Readonly<Record<string, string>> {
  return Object.freeze(Object.fromEntries(Object.entries(value).map(([key, item]) => [
    key,
    String(item),
  ])));
}

const JOURNAL_RULE_TEMPLATE_DEFINITIONS = [
    {
      templateId: "allowed_direction_only",
      label: "Trade only the selected direction",
      description: "Review trades whose verified direction differs from the selected direction.",
      category: "scope",
      scope: "trade",
      parameters: [parameter("allowedDirection", "Allowed direction", "enum", "direction", null, ["long", "short"])],
      exampleConfiguration: { allowedDirection: "long" },
      limitationSummary: "Requires complete direction facts; missing facts remain unavailable.",
    },
    {
      templateId: "exclude_entry_price_range",
      label: "Avoid an entry-price range",
      description: "Review trades whose verified entry price falls inside the selected inclusive range.",
      category: "scope",
      scope: "trade",
      parameters: [
        parameter("lowerEntryPrice", "Lower entry price", "positive_decimal", "$ per share"),
        parameter("upperEntryPrice", "Upper entry price", "positive_decimal", "$ per share"),
      ],
      exampleConfiguration: { lowerEntryPrice: "1", upperEntryPrice: "5" },
      limitationSummary: "Requires complete entry-price and currency facts.",
    },
    {
      templateId: "maximum_attempts_per_ticker",
      label: "Maximum ticker attempts per day",
      description: "Review flat-to-flat attempts after the selected per-ticker limit.",
      category: "frequency",
      scope: "ticker_day",
      parameters: [parameter("maximumAttempts", "Maximum flat-to-flat attempts", "positive_integer", "attempts", "1000")],
      exampleConfiguration: { maximumAttempts: "2" },
      limitationSummary: "An attempt is one factual flat-to-flat round trip for a stable instrument.",
    },
    {
      templateId: "maximum_trades_per_day",
      label: "Maximum completed trades per day",
      description: "Review completed trades after the selected daily trade limit.",
      category: "frequency",
      scope: "day_session",
      parameters: [parameter("maximumTrades", "Maximum completed trades", "positive_integer", "trades", "1000")],
      exampleConfiguration: { maximumTrades: "3" },
      limitationSummary: "Uses factual completed-trade order inside the Journal account timezone.",
    },
    {
      templateId: "no_new_trades_after_time",
      label: "No new trades after a selected time",
      description: "Review trades whose factual entry begins at or after the selected cutoff.",
      category: "timing",
      scope: "trade",
      parameters: [parameter("cutoffTime", "Latest allowed entry time", "wall_clock_time", "HH:mm:ss")],
      exampleConfiguration: { cutoffTime: "15:30:00" },
      limitationSummary: "Requires an accepted account timezone and exact entry timestamp.",
    },
    {
      templateId: "reduce_next_trade_size_after_loss",
      label: "Reduce the next trade to half size after a loss",
      description: "After a losing trade, plan for the next trade to use half the usual size.",
      category: "size",
      scope: "trade_sequence",
      parameters: [],
      exampleConfiguration: {},
      limitationSummary: "Automatic evaluation remains unavailable without complete size and outcome facts.",
    },
    {
      templateId: "skip_next_trade_after_outcome",
      label: "Skip the next trade after an outcome",
      description: "Review one next eligible trade after the selected completed outcome.",
      category: "risk",
      scope: "trade_sequence",
      parameters: [parameter("triggerOutcome", "Outcome that triggers the skipped trade", "enum", "outcome", null, ["loss", "gain", "flat"])],
      exampleConfiguration: { triggerOutcome: "loss" },
      limitationSummary: "Requires unambiguous completed outcomes and sequence.",
    },
    {
      templateId: "stop_after_consecutive_losses",
      label: "Stop after consecutive losses",
      description: "Review trades entered after the selected completed-loss streak.",
      category: "risk",
      scope: "day_session",
      parameters: [parameter("consecutiveLossThreshold", "Consecutive loss limit", "positive_integer", "completed losses", "16")],
      exampleConfiguration: { consecutiveLossThreshold: "2" },
      limitationSummary: "Ambiguous simultaneous outcomes remain unavailable rather than creating a streak.",
    },
    {
      templateId: "stop_after_daily_realized_loss",
      label: "Stop after a daily realized loss limit",
      description: "Review trades entered after realized daily net P/L reaches the selected loss limit.",
      category: "risk",
      scope: "day_session",
      parameters: [parameter("maximumDailyDrawdown", "Daily realized loss limit", "positive_decimal", "$")],
      exampleConfiguration: { maximumDailyDrawdown: "500" },
      limitationSummary: "Uses realized P/L only and does not estimate unrealized loss.",
    },
    {
      templateId: "stop_after_losing_ticker_attempts",
      label: "Stop a ticker after losing attempts",
      description: "Review later ticker attempts after the selected number of completed losing attempts.",
      category: "risk",
      scope: "ticker_day",
      parameters: [parameter("losingAttemptThreshold", "Losing ticker-attempt limit", "positive_integer", "completed losing attempts", "16")],
      exampleConfiguration: { losingAttemptThreshold: "2" },
      limitationSummary: "Uses stable instrument identity and factual completed outcomes.",
    },
    {
      templateId: "stop_after_profit_giveback",
      label: "Stop after a realized profit giveback",
      description: "Review trades entered after the selected giveback from realized daily peak P/L.",
      category: "risk",
      scope: "day_session",
      parameters: [parameter("maximumProfitGiveback", "Maximum realized profit giveback", "positive_decimal", "$")],
      exampleConfiguration: { maximumProfitGiveback: "250" },
      limitationSummary: "Uses realized daily peak P/L only and never estimates unrealized giveback.",
    },
    {
      templateId: "wait_after_loss",
      label: "Wait after a losing trade",
      description: "Review the next eligible trade when it begins before the selected cooldown expires.",
      category: "timing",
      scope: "trade_sequence",
      parameters: [parameter("cooldownSeconds", "Cooldown after a completed loss", "positive_integer", "seconds", "86400")],
      exampleConfiguration: { cooldownSeconds: "300" },
      limitationSummary: "Requires an exact prior completion timestamp and unambiguous realized loss.",
    },
  ] satisfies readonly TradingRulesTemplateView[];

export const JOURNAL_RULE_TEMPLATE_CATALOG: readonly TradingRulesTemplateView[] =
  Object.freeze(JOURNAL_RULE_TEMPLATE_DEFINITIONS.map(
    (item): TradingRulesTemplateView => Object.freeze({
      templateId: item.templateId,
      label: item.label,
      description: item.description,
      category: item.category,
      scope: item.scope,
      parameters: Object.freeze([...item.parameters]),
      exampleConfiguration: templateConfiguration(item.exampleConfiguration),
      limitationSummary: item.limitationSummary,
    })));

function template(templateId: string): TradingRulesTemplateView {
  const found = JOURNAL_RULE_TEMPLATE_CATALOG.find((item) => item.templateId === templateId);
  if (!found) platformFailure("TRADERLINK_JOURNAL_ANNOTATION_INVALID");
  return found;
}

function templateReviewScope(
  scope: TradingRulesTemplateView["scope"],
): "day" | "trade" | "both" {
  return scope === "day_session" ? "day" : "trade";
}

function manualCategory(value: string): ManualCustomRuleRecord["category"] {
  if (value === "process" || value === "setup" || value === "mindset" || value === "review") {
    return value;
  }
  return "process";
}

function manualReviewScope(value: JournalRuleRecord["reviewScope"]): ManualCustomRuleRecord["reviewScope"] {
  return value === "day" ? "day_session" : value;
}

export function readJournalTradingRulesDashboard(
  service: JournalAnnotationService,
  scope: AccountScope,
  expectedAccountSelectionRef: JournalAccountSelectionRef,
): TradingRulesDashboardView {
  const rules = service.listRules(scope);
  return Object.freeze({
    expectedAccountSelectionRef,
    packet: Object.freeze({
      rules: Object.freeze(rules
        .filter((rule) => rule.sourceKind === "template" && rule.templateKey)
        .map((rule) => Object.freeze({
          ruleInstanceId: rule.ruleId,
          revision: rule.revision,
          status: rule.lifecycleState,
          template: template(rule.templateKey!),
          currentVersion: Object.freeze({
            ruleVersionId: rule.versionId,
            versionOrdinal: String(rule.versionNumber),
            configuration: rule.configuration,
            effectiveFrom: rule.effectiveFromUtc,
          }),
          latestEvaluation: null,
        }))),
    }),
    templates: JOURNAL_RULE_TEMPLATE_CATALOG,
    manualRules: Object.freeze(rules
      .filter((rule) => rule.sourceKind === "custom")
      .map((rule) => Object.freeze({
        ruleId: rule.ruleId,
        revision: rule.revision,
        title: rule.title,
        statement: rule.statement,
        category: manualCategory(rule.category),
        reviewScope: manualReviewScope(rule.reviewScope),
        isFocus: rule.isFocus,
        status: rule.lifecycleState,
        versionOrdinal: String(rule.versionNumber),
        ruleVersionId: rule.versionId,
        effectiveFrom: rule.effectiveFromUtc,
        createdAt: rule.createdAtUtc,
        updatedAt: rule.updatedAtUtc,
      }))),
  });
}

type Mutation = Readonly<Record<string, unknown> & { action: unknown }>;

function string(record: Mutation, field: string): string {
  const value = record[field];
  if (typeof value !== "string") {
    platformFailure("TRADERLINK_JOURNAL_ANNOTATION_INVALID", { field });
  }
  return value;
}

function integer(record: Mutation, field: string): number {
  const value = record[field];
  if (!Number.isSafeInteger(value) || Number(value) <= 0) {
    platformFailure("TRADERLINK_JOURNAL_ANNOTATION_CONFLICT");
  }
  return Number(value);
}

export function mutateJournalTradingRules(
  service: JournalAnnotationService,
  scope: AccountScope,
  mutation: Mutation,
): void {
  if (mutation.action === "create") {
    const selected = template(string(mutation, "templateId"));
    service.createRule(scope, {
      sourceKind: "template",
      templateKey: selected.templateId,
      title: selected.label,
      statement: selected.description,
      category: selected.category,
      reviewScope: templateReviewScope(selected.scope),
      isFocus: false,
      configuration: mutation.configuration,
    });
    return;
  }
  if (mutation.action === "revise") {
    const ruleId = string(mutation, "ruleInstanceId");
    const current = service.listRules(scope).find((rule) => rule.ruleId === ruleId);
    if (!current || current.sourceKind !== "template") {
      platformFailure("TRADERLINK_JOURNAL_ANNOTATION_CONFLICT");
    }
    service.reviseRule(scope, {
      ruleId,
      expectedRevision: integer(mutation, "expectedRevision"),
      title: current.title,
      statement: current.statement,
      category: current.category,
      reviewScope: current.reviewScope,
      isFocus: current.isFocus,
      configuration: mutation.configuration,
    });
    return;
  }
  if (mutation.action === "transition") {
    service.transitionRule(scope, {
      ruleId: string(mutation, "ruleInstanceId"),
      expectedRevision: integer(mutation, "expectedRevision"),
      expectedState: mutation.expectedCurrentStatus,
      newState: mutation.newStatus,
    });
    return;
  }
  if (mutation.action === "create_manual") {
    service.createRule(scope, {
      sourceKind: "custom",
      title: mutation.title,
      statement: mutation.statement,
      category: mutation.category,
      reviewScope: mutation.reviewScope === "day_session" ? "day" : mutation.reviewScope,
      isFocus: mutation.isFocus,
      configuration: {},
    });
    return;
  }
  if (mutation.action === "revise_manual") {
    service.reviseRule(scope, {
      ruleId: string(mutation, "ruleId"),
      expectedRevision: integer(mutation, "expectedRevision"),
      title: mutation.title,
      statement: mutation.statement,
      category: mutation.category,
      reviewScope: mutation.reviewScope === "day_session" ? "day" : mutation.reviewScope,
      isFocus: mutation.isFocus,
      configuration: {},
    });
    return;
  }
  if (mutation.action === "transition_manual") {
    service.transitionRule(scope, {
      ruleId: string(mutation, "ruleId"),
      expectedRevision: integer(mutation, "expectedRevision"),
      expectedState: mutation.expectedCurrentStatus,
      newState: mutation.newStatus,
    });
    return;
  }
  platformFailure("TRADERLINK_JOURNAL_ANNOTATION_INVALID", { field: "action" });
}
