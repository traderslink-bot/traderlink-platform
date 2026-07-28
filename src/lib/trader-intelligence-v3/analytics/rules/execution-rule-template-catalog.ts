import { compareUnicodeCodePoints } from "../../domain/canonical";
import type { ExactResult } from "../../domain/exact";
import type { CanonicalContentDigest } from "../../domain/identity";
import {
  contractFailure,
  finalizeContentAddressedAuthority,
  type AnalyticalContractFailure,
} from "../contracts";
import {
  getExecutionAnalyticsCapability,
  type ExecutionAnalyticsCapabilityState,
} from "../query";
import type { RepresentativeSimulationPresetKey } from "../simulation";

export const EXECUTION_RULE_TEMPLATE_CATALOG_VERSION =
  "ti_v3_execution_rule_template_catalog_v1" as const;

export const EXECUTION_RULE_TEMPLATE_IDS = Object.freeze([
  "maximum_trades_per_day",
  "maximum_attempts_per_ticker",
  "stop_after_consecutive_losses",
  "wait_after_loss",
  "stop_after_daily_realized_loss",
  "stop_after_profit_giveback",
  "stop_after_losing_ticker_attempts",
  "no_new_trades_after_time",
  "allowed_direction_only",
  "exclude_entry_price_range",
  "skip_next_trade_after_outcome",
  "reduce_next_trade_size_after_loss",
] as const);

export type ExecutionRuleTemplateId =
  (typeof EXECUTION_RULE_TEMPLATE_IDS)[number];

export type ExecutionRuleTemplateCategory =
  | "frequency"
  | "timing"
  | "risk"
  | "size"
  | "scope";

export type ExecutionRuleTemplateScope =
  | "trade"
  | "ticker_day"
  | "day_session"
  | "trade_sequence";

export type ExecutionRuleEvaluatorFamily =
  | "count_limit"
  | "cooldown"
  | "outcome_gate"
  | "consecutive_outcome_limit"
  | "time_window"
  | "allowlist"
  | "price_range"
  | "size_adjustment";

export type ExecutionRuleParameterKind =
  | "positive_integer"
  | "positive_decimal"
  | "wall_clock_time"
  | "enum";

export interface ExecutionRuleParameterDefinition {
  readonly key: string;
  readonly label: string;
  readonly kind: ExecutionRuleParameterKind;
  readonly unit: string;
  readonly maximum: string | null;
  readonly options: readonly string[];
}

export interface ExecutionRuleTemplate {
  readonly templateId: ExecutionRuleTemplateId;
  readonly templateVersion: "v1";
  readonly label: string;
  readonly description: string;
  readonly category: ExecutionRuleTemplateCategory;
  readonly scope: ExecutionRuleTemplateScope;
  readonly evaluatorFamily: ExecutionRuleEvaluatorFamily;
  readonly simulationPresetKey: RepresentativeSimulationPresetKey;
  readonly parameters: readonly ExecutionRuleParameterDefinition[];
  readonly exampleConfiguration: Readonly<Record<string, string>>;
  readonly requiredCapabilityKeys: readonly string[];
  readonly comparisonUnit:
    | "trade"
    | "affected_trade"
    | "ticker_day"
    | "day_session";
  readonly supportState: "ready_existing_governed_v3_preset";
  readonly limitationSummary: string;
}

export interface ExecutionRuleTemplateCatalog {
  readonly schemaVersion: typeof EXECUTION_RULE_TEMPLATE_CATALOG_VERSION;
  readonly catalogKey: "ti_v3_execution_rule_templates";
  readonly catalogVersion: "v1";
  readonly templates: readonly ExecutionRuleTemplate[];
  readonly catalogDigest: CanonicalContentDigest;
}

function parameter(
  key: string,
  label: string,
  kind: ExecutionRuleParameterKind,
  unit: string,
  maximum: string | null = null,
  options: readonly string[] = [],
): ExecutionRuleParameterDefinition {
  return Object.freeze({
    key,
    label,
    kind,
    unit,
    maximum,
    options: Object.freeze([...options]),
  });
}

function template(
  input: Omit<
    ExecutionRuleTemplate,
    "templateVersion" | "supportState"
  >,
): ExecutionRuleTemplate {
  return Object.freeze({
    ...input,
    templateVersion: "v1" as const,
    supportState: "ready_existing_governed_v3_preset" as const,
    parameters: Object.freeze([...input.parameters]),
    exampleConfiguration: Object.freeze({ ...input.exampleConfiguration }),
    requiredCapabilityKeys: Object.freeze(
      [...input.requiredCapabilityKeys].sort(compareUnicodeCodePoints),
    ),
  });
}

const templates = Object.freeze([
  template({
    templateId: "maximum_trades_per_day",
    label: "Maximum completed trades per day",
    description:
      "Classifies completed trades after the configured daily trade limit.",
    category: "frequency",
    scope: "day_session",
    evaluatorFamily: "count_limit",
    simulationPresetKey: "simulate_maximum_trades_per_day",
    parameters: [
      parameter(
        "maximumTrades",
        "Maximum completed trades",
        "positive_integer",
        "trades",
        "1000",
      ),
    ],
    exampleConfiguration: { maximumTrades: "3" },
    requiredCapabilityKeys: [
      "daily_and_period_performance",
      "sequencing_and_behavior",
    ],
    comparisonUnit: "affected_trade",
    limitationSummary:
      "Uses canonical completed-trade order inside a verified session date.",
  }),
  template({
    templateId: "maximum_attempts_per_ticker",
    label: "Maximum ticker attempts per day",
    description:
      "Classifies flat-to-flat attempts after the configured per-ticker limit.",
    category: "frequency",
    scope: "ticker_day",
    evaluatorFamily: "count_limit",
    simulationPresetKey: "simulate_maximum_attempts_per_ticker",
    parameters: [
      parameter(
        "maximumAttempts",
        "Maximum flat-to-flat attempts",
        "positive_integer",
        "attempts",
        "1000",
      ),
    ],
    exampleConfiguration: { maximumAttempts: "2" },
    requiredCapabilityKeys: ["sequencing_and_behavior"],
    comparisonUnit: "affected_trade",
    limitationSummary:
      "An attempt means a canonical flat-to-flat round trip for one stable instrument.",
  }),
  template({
    templateId: "stop_after_consecutive_losses",
    label: "Stop after consecutive losses",
    description:
      "Classifies trades entered after the configured completed-loss streak.",
    category: "risk",
    scope: "day_session",
    evaluatorFamily: "consecutive_outcome_limit",
    simulationPresetKey: "simulate_stop_after_consecutive_losses",
    parameters: [
      parameter(
        "consecutiveLossThreshold",
        "Consecutive loss limit",
        "positive_integer",
        "completed losses",
        "16",
      ),
    ],
    exampleConfiguration: { consecutiveLossThreshold: "2" },
    requiredCapabilityKeys: ["sequencing_and_behavior"],
    comparisonUnit: "affected_trade",
    limitationSummary:
      "Ambiguous simultaneous completed outcomes fail closed instead of creating a streak.",
  }),
  template({
    templateId: "wait_after_loss",
    label: "Wait after a losing trade",
    description:
      "Classifies the next eligible trade when it begins before the configured cooldown expires.",
    category: "timing",
    scope: "trade_sequence",
    evaluatorFamily: "cooldown",
    simulationPresetKey: "simulate_wait_after_loss",
    parameters: [
      parameter(
        "cooldownSeconds",
        "Cooldown after a completed loss",
        "positive_integer",
        "seconds",
        "86400",
      ),
    ],
    exampleConfiguration: { cooldownSeconds: "300" },
    requiredCapabilityKeys: ["sequencing_and_behavior"],
    comparisonUnit: "affected_trade",
    limitationSummary:
      "Requires an exact prior completion timestamp and an unambiguous realized loss.",
  }),
  template({
    templateId: "stop_after_daily_realized_loss",
    label: "Stop after a daily realized loss limit",
    description:
      "Classifies trades entered after realized daily net P/L reaches the configured negative threshold.",
    category: "risk",
    scope: "day_session",
    evaluatorFamily: "outcome_gate",
    simulationPresetKey: "simulate_stop_after_daily_dollar_drawdown",
    parameters: [
      parameter(
        "maximumDailyDrawdown",
        "Daily realized loss limit",
        "positive_decimal",
        "$",
      ),
    ],
    exampleConfiguration: { maximumDailyDrawdown: "500" },
    requiredCapabilityKeys: [
      "core_performance",
      "daily_and_period_performance",
      "pre_entry_daily_state",
    ],
    comparisonUnit: "affected_trade",
    limitationSummary:
      "Uses ordered realized net P/L in one currency; it does not estimate unrealized loss.",
  }),
  template({
    templateId: "stop_after_profit_giveback",
    label: "Stop after a realized profit giveback",
    description:
      "Classifies trades entered after the configured giveback from positive realized daily peak P/L.",
    category: "risk",
    scope: "day_session",
    evaluatorFamily: "outcome_gate",
    simulationPresetKey: "simulate_stop_after_profit_giveback",
    parameters: [
      parameter(
        "maximumProfitGiveback",
        "Maximum realized profit giveback",
        "positive_decimal",
        "$",
      ),
    ],
    exampleConfiguration: { maximumProfitGiveback: "250" },
    requiredCapabilityKeys: ["giveback_and_drawdown"],
    comparisonUnit: "affected_trade",
    limitationSummary:
      "Uses realized daily peak P/L only and never estimates unrealized giveback.",
  }),
  template({
    templateId: "stop_after_losing_ticker_attempts",
    label: "Stop a ticker after losing attempts",
    description:
      "Classifies later ticker attempts after the configured number of completed losing attempts.",
    category: "risk",
    scope: "ticker_day",
    evaluatorFamily: "consecutive_outcome_limit",
    simulationPresetKey: "simulate_stop_after_losing_ticker_attempts",
    parameters: [
      parameter(
        "losingAttemptThreshold",
        "Losing ticker-attempt limit",
        "positive_integer",
        "completed losing attempts",
        "16",
      ),
    ],
    exampleConfiguration: { losingAttemptThreshold: "2" },
    requiredCapabilityKeys: ["sequencing_and_behavior"],
    comparisonUnit: "affected_trade",
    limitationSummary:
      "Uses stable instrument identity and completed outcomes; gains and flats do not reset the v1 count.",
  }),
  template({
    templateId: "no_new_trades_after_time",
    label: "No new trades after a selected time",
    description:
      "Classifies trades whose canonical entry begins at or after the configured cutoff.",
    category: "timing",
    scope: "trade",
    evaluatorFamily: "time_window",
    simulationPresetKey: "simulate_no_new_trades_after_time",
    parameters: [
      parameter(
        "cutoffTime",
        "Latest allowed entry time",
        "wall_clock_time",
        "HH:mm:ss",
      ),
    ],
    exampleConfiguration: { cutoffTime: "15:30:00" },
    requiredCapabilityKeys: ["time_and_session_performance"],
    comparisonUnit: "trade",
    limitationSummary:
      "Requires an accepted IANA timezone; unsupported overnight-session interpretation fails closed.",
  }),
  template({
    templateId: "allowed_direction_only",
    label: "Trade only the selected direction",
    description:
      "Classifies trades whose verified direction differs from the configured allowed direction.",
    category: "scope",
    scope: "trade",
    evaluatorFamily: "allowlist",
    simulationPresetKey: "simulate_direction_only",
    parameters: [
      parameter(
        "allowedDirection",
        "Allowed direction",
        "enum",
        "direction",
        null,
        ["long", "short"],
      ),
    ],
    exampleConfiguration: { allowedDirection: "long" },
    requiredCapabilityKeys: ["ticker_price_size_hold_direction"],
    comparisonUnit: "trade",
    limitationSummary:
      "Requires complete direction authority for every included round trip.",
  }),
  template({
    templateId: "exclude_entry_price_range",
    label: "Avoid an entry-price range",
    description:
      "Classifies trades whose verified entry price falls inside the configured inclusive range.",
    category: "scope",
    scope: "trade",
    evaluatorFamily: "price_range",
    simulationPresetKey: "simulate_exclude_price_range",
    parameters: [
      parameter(
        "lowerEntryPrice",
        "Lower entry price",
        "positive_decimal",
        "$ per share",
      ),
      parameter(
        "upperEntryPrice",
        "Upper entry price",
        "positive_decimal",
        "$ per share",
      ),
    ],
    exampleConfiguration: {
      lowerEntryPrice: "1",
      upperEntryPrice: "5",
    },
    requiredCapabilityKeys: ["ticker_price_size_hold_direction"],
    comparisonUnit: "trade",
    limitationSummary:
      "Requires complete entry-price authority and isolated currency scope.",
  }),
  template({
    templateId: "skip_next_trade_after_outcome",
    label: "Skip the next trade after an outcome",
    description:
      "Classifies one next eligible trade after the configured completed outcome.",
    category: "risk",
    scope: "trade_sequence",
    evaluatorFamily: "outcome_gate",
    simulationPresetKey: "simulate_after_outcome_exclusion",
    parameters: [
      parameter(
        "triggerOutcome",
        "Outcome that triggers the skipped trade",
        "enum",
        "outcome",
        null,
        ["loss", "gain", "flat"],
      ),
    ],
    exampleConfiguration: { triggerOutcome: "loss" },
    requiredCapabilityKeys: ["sequencing_and_behavior"],
    comparisonUnit: "affected_trade",
    limitationSummary:
      "The pending exclusion remains until one next rule-eligible trade consumes it.",
  }),
  template({
    templateId: "reduce_next_trade_size_after_loss",
    label: "Reduce the next trade to half size after a loss",
    description:
      "After a losing trade, make your next trade half your usual size.",
    category: "size",
    scope: "trade_sequence",
    evaluatorFamily: "size_adjustment",
    simulationPresetKey: "simulate_reduce_size_after_loss",
    parameters: [],
    exampleConfiguration: {},
    requiredCapabilityKeys: [
      "sequencing_and_behavior",
      "ticker_price_size_hold_direction",
    ],
    comparisonUnit: "affected_trade",
    limitationSummary:
      "Uses a fixed half-size rule. The app needs complete size and fee data before it can evaluate it.",
  }),
].sort((left, right) =>
  compareUnicodeCodePoints(left.templateId, right.templateId)
));

const built = finalizeContentAddressedAuthority(
  "execution_rule_template_catalog",
  {
    schemaVersion: EXECUTION_RULE_TEMPLATE_CATALOG_VERSION,
    catalogKey: "ti_v3_execution_rule_templates" as const,
    catalogVersion: "v1" as const,
    templates,
  },
  "catalogDigest",
);

if (!built.ok) {
  throw new Error(
    `${(built.error as AnalyticalContractFailure).code}:${built.error.path}`,
  );
}

export const EXECUTION_RULE_TEMPLATE_CATALOG =
  built.value as ExecutionRuleTemplateCatalog;

export function getExecutionRuleTemplate(
  templateId: string,
): ExecutionRuleTemplate | null {
  return EXECUTION_RULE_TEMPLATE_CATALOG.templates.find(
    (candidate) => candidate.templateId === templateId,
  ) ?? null;
}

export interface ExecutionRuleTemplateCatalogVerification {
  readonly complete: boolean;
  readonly duplicateTemplateIds: readonly string[];
  readonly missingCapabilityKeys: readonly string[];
  readonly nonAvailableCapabilityBindings: readonly Readonly<{
    readonly templateId: ExecutionRuleTemplateId;
    readonly capabilityKey: string;
    readonly state: ExecutionAnalyticsCapabilityState;
  }>[];
}

export function verifyExecutionRuleTemplateCatalog():
  ExecutionRuleTemplateCatalogVerification {
  const ids = EXECUTION_RULE_TEMPLATE_CATALOG.templates.map(
    (candidate) => candidate.templateId,
  );
  const duplicateTemplateIds = ids.filter(
    (id, index) => ids.indexOf(id) !== index,
  );
  const missingCapabilityKeys = new Set<string>();
  const nonAvailableCapabilityBindings: Array<{
    templateId: ExecutionRuleTemplateId;
    capabilityKey: string;
    state: ExecutionAnalyticsCapabilityState;
  }> = [];

  for (const candidate of EXECUTION_RULE_TEMPLATE_CATALOG.templates) {
    for (const capabilityKey of candidate.requiredCapabilityKeys) {
      const capability = getExecutionAnalyticsCapability(capabilityKey);
      if (capability === null) {
        missingCapabilityKeys.add(capabilityKey);
        continue;
      }
      if (
        capability.state !== "available_with_exact_execution_authority" &&
        capability.state !==
          "available_when_optional_execution_facts_are_complete"
      ) {
        nonAvailableCapabilityBindings.push({
          templateId: candidate.templateId,
          capabilityKey,
          state: capability.state,
        });
      }
    }
  }

  const duplicateIds = Object.freeze(
    [...new Set(duplicateTemplateIds)].sort(compareUnicodeCodePoints),
  );
  const missingKeys = Object.freeze(
    [...missingCapabilityKeys].sort(compareUnicodeCodePoints),
  );
  const unavailableBindings = Object.freeze(
    [...nonAvailableCapabilityBindings].sort((left, right) =>
      compareUnicodeCodePoints(
        `${left.templateId}:${left.capabilityKey}`,
        `${right.templateId}:${right.capabilityKey}`,
      )
    ),
  );

  return Object.freeze({
    complete:
      ids.length === EXECUTION_RULE_TEMPLATE_IDS.length &&
      duplicateIds.length === 0 &&
      missingKeys.length === 0 &&
      unavailableBindings.length === 0,
    duplicateTemplateIds: duplicateIds,
    missingCapabilityKeys: missingKeys,
    nonAvailableCapabilityBindings: unavailableBindings,
  });
}

export function unknownExecutionRuleTemplateFailure(
  path = "$.templateId",
): ExactResult<never, AnalyticalContractFailure> {
  return contractFailure("ti_v3_analytics_contract_invalid", path);
}
