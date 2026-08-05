import type {
  JournalRuleLifecycleState,
  JournalRuleRecord,
} from "@/src/modules/journal/contracts/journal-annotation-contracts";
import Decimal from "decimal.js";
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
  category: "trade" | "trade_day" | "day";
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
      templateId: "exclude_entry_price_range",
      label: "Avoid an entry-price range",
      description: "Checks whether a trade's weighted-average entry price falls inside the selected range.",
      category: "trade",
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
      category: "trade_day",
      scope: "ticker_day",
      parameters: [parameter("maximumAttempts", "Maximum flat-to-flat attempts", "positive_integer", "attempts", "1000")],
      exampleConfiguration: { maximumAttempts: "2" },
      limitationSummary: "An attempt is one factual flat-to-flat round trip for a stable instrument.",
    },
    {
      templateId: "maximum_trades_per_day",
      label: "Maximum completed trades per day",
      description: "Review completed trades after the selected daily trade limit.",
      category: "day",
      scope: "day_session",
      parameters: [parameter("maximumTrades", "Maximum completed trades", "positive_integer", "trades", "1000")],
      exampleConfiguration: { maximumTrades: "3" },
      limitationSummary: "Uses factual completed-trade order inside the Journal account timezone.",
    },
    {
      templateId: "no_new_trades_after_time",
      label: "No new trades after a selected time",
      description: "Review trades whose factual entry begins at or after the selected cutoff.",
      category: "trade",
      scope: "trade",
      parameters: [parameter("cutoffTime", "Latest allowed entry time", "wall_clock_time", "HH:mm:ss")],
      exampleConfiguration: { cutoffTime: "15:30:00" },
      limitationSummary: "Requires an accepted account timezone and exact entry timestamp.",
    },
    {
      templateId: "stop_after_consecutive_losses",
      label: "Stop after consecutive losses",
      description: "Review trades entered after the selected completed-loss streak.",
      category: "day",
      scope: "day_session",
      parameters: [parameter("consecutiveLossThreshold", "Consecutive loss limit", "positive_integer", "completed losses", "16")],
      exampleConfiguration: { consecutiveLossThreshold: "2" },
      limitationSummary: "Ambiguous simultaneous outcomes remain unavailable rather than creating a streak.",
    },
    {
      templateId: "stop_after_daily_realized_loss",
      label: "Stop after a daily realized loss limit",
      description: "Review trades entered after realized daily net P/L reaches the selected loss limit.",
      category: "day",
      scope: "day_session",
      parameters: [parameter("maximumDailyDrawdown", "Daily realized loss limit", "positive_decimal", "$")],
      exampleConfiguration: { maximumDailyDrawdown: "500" },
      limitationSummary: "Uses realized P/L only and does not estimate unrealized loss.",
    },
    {
      templateId: "stop_after_losing_ticker_attempts",
      label: "Stop a ticker after losing attempts",
      description: "Review later ticker attempts after the selected number of completed losing attempts.",
      category: "trade_day",
      scope: "ticker_day",
      parameters: [parameter("losingAttemptThreshold", "Losing ticker-attempt limit", "positive_integer", "completed losing attempts", "16")],
      exampleConfiguration: { losingAttemptThreshold: "2" },
      limitationSummary: "Uses stable instrument identity and factual completed outcomes.",
    },
    {
      templateId: "stop_after_profit_giveback",
      label: "Stop after a realized profit giveback",
      description: "Review trades entered after the selected giveback from realized daily peak P/L.",
      category: "day",
      scope: "day_session",
      parameters: [parameter("maximumProfitGiveback", "Maximum realized profit giveback", "positive_decimal", "$")],
      exampleConfiguration: { maximumProfitGiveback: "250" },
      limitationSummary: "Uses realized daily peak P/L only and never estimates unrealized giveback.",
    },
    {
      templateId: "stop_after_daily_realized_gain_limit",
      label: "Stop after a daily realized gain limit",
      description: "Review trades entered after realized daily P/L reaches the selected gain limit.",
      category: "day",
      scope: "day_session",
      parameters: [parameter("dailyRealizedGainLimit", "Daily realized gain limit", "positive_decimal", "$")],
      exampleConfiguration: { dailyRealizedGainLimit: "500" },
      limitationSummary: "Uses realized P/L only and does not estimate unrealized gain.",
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

function knownTemplate(templateId: string): TradingRulesTemplateView | null {
  return JOURNAL_RULE_TEMPLATE_CATALOG.find((item) => item.templateId === templateId) ?? null;
}

function template(templateId: string): TradingRulesTemplateView {
  const found = knownTemplate(templateId);
  if (!found) platformFailure("TRADERLINK_JOURNAL_ANNOTATION_INVALID");
  return found;
}

function invalidConfiguration(field: string, reason: string): never {
  return platformFailure("TRADERLINK_JOURNAL_ANNOTATION_INVALID", {
    field,
    reason,
  });
}

function validatedTemplateConfiguration(
  selected: TradingRulesTemplateView,
  value: unknown,
): Readonly<Record<string, string>> {
  if (!value || Array.isArray(value) || typeof value !== "object") {
    invalidConfiguration("configuration", "required");
  }
  const supplied = value as Record<string, unknown>;
  const expectedKeys = new Set(selected.parameters.map((parameter) => parameter.key));
  const suppliedKeys = Object.keys(supplied);
  if (
    suppliedKeys.length !== expectedKeys.size ||
    suppliedKeys.some((key) => !expectedKeys.has(key))
  ) {
    invalidConfiguration("configuration", "unexpected_fields");
  }
  const result: Record<string, string> = {};
  for (const parameter of selected.parameters) {
    const raw = supplied[parameter.key];
    if (typeof raw !== "string" || raw.trim().length === 0) {
      invalidConfiguration(parameter.key, "required");
    }
    const normalized = raw.trim();
    if (parameter.kind === "enum") {
      if (!parameter.options.includes(normalized)) {
        invalidConfiguration(parameter.key, "choose_option");
      }
      result[parameter.key] = normalized;
      continue;
    }
    if (parameter.kind === "wall_clock_time") {
      if (!/^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/u.test(normalized)) {
        invalidConfiguration(parameter.key, "time");
      }
      result[parameter.key] = normalized.length === 5
        ? `${normalized}:00`
        : normalized;
      continue;
    }
    if (parameter.kind === "positive_integer") {
      if (!/^[1-9]\d*$/u.test(normalized)) {
        invalidConfiguration(parameter.key, "positive_integer");
      }
      const numeric = new Decimal(normalized);
      if (
        !numeric.isInteger() ||
        numeric.lte(0) ||
        (parameter.maximum !== null && numeric.gt(parameter.maximum))
      ) {
        invalidConfiguration(parameter.key, "positive_integer");
      }
      result[parameter.key] = numeric.toFixed(0);
      continue;
    }
    if (!/^(?:\d+(?:\.\d*)?|\.\d+)$/u.test(normalized)) {
      invalidConfiguration(parameter.key, "positive_decimal");
    }
    const numeric = new Decimal(normalized);
    if (!numeric.isFinite() || numeric.lte(0)) {
      invalidConfiguration(parameter.key, "positive_decimal");
    }
    result[parameter.key] = numeric.toFixed();
  }
  if (
    selected.templateId === "exclude_entry_price_range" &&
    new Decimal(result.lowerEntryPrice!).gt(result.upperEntryPrice!)
  ) {
    invalidConfiguration("upperEntryPrice", "range_order");
  }
  return Object.freeze(result);
}

export function journalTradingRuleValidationMessage(field: unknown): string {
  if (typeof field !== "string") {
    return "Check the rule settings and try again.";
  }
  const label = JOURNAL_RULE_TEMPLATE_CATALOG
    .flatMap((item) => item.parameters)
    .find((parameter) => parameter.key === field)?.label;
  return label
    ? `Check “${label}” and try again.`
    : "Check the rule settings and try again.";
}

function templateReviewScope(
  scope: TradingRulesTemplateView["scope"],
): "day" | "trade" | "both" {
  if (scope === "day_session") return "day";
  if (scope === "ticker_day") return "both";
  return "trade";
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
        .flatMap((rule) => {
          const selected = knownTemplate(rule.templateKey!);
          if (!selected) return [];
          return [Object.freeze({
            ruleInstanceId: rule.ruleId,
            revision: rule.revision,
            status: rule.lifecycleState,
            template: selected,
            currentVersion: Object.freeze({
              ruleVersionId: rule.versionId,
              versionOrdinal: String(rule.versionNumber),
              configuration: rule.configuration,
              effectiveFrom: rule.effectiveFromUtc,
            }),
            latestEvaluation: null,
          })];
        })),
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
    const configuration = validatedTemplateConfiguration(
      selected,
      mutation.configuration,
    );
    service.createRule(scope, {
      sourceKind: "template",
      templateKey: selected.templateId,
      title: selected.label,
      statement: selected.description,
      category: selected.category,
      reviewScope: templateReviewScope(selected.scope),
      isFocus: false,
      configuration,
    });
    return;
  }
  if (mutation.action === "revise") {
    const ruleId = string(mutation, "ruleInstanceId");
    const current = service.listRules(scope).find((rule) => rule.ruleId === ruleId);
    if (!current || current.sourceKind !== "template") {
      platformFailure("TRADERLINK_JOURNAL_ANNOTATION_CONFLICT");
    }
    const selected = knownTemplate(current.templateKey!);
    if (!selected) {
      platformFailure("TRADERLINK_JOURNAL_ANNOTATION_CONFLICT");
    }
    const configuration = validatedTemplateConfiguration(
      selected,
      mutation.configuration,
    );
    service.reviseRule(scope, {
      ruleId,
      expectedRevision: integer(mutation, "expectedRevision"),
      title: current.title,
      statement: current.statement,
      category: current.category,
      reviewScope: current.reviewScope,
      isFocus: current.isFocus,
      configuration,
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
