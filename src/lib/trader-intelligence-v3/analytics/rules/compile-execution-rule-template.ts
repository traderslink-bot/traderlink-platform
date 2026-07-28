import type { ExactResult } from "../../domain/exact";
import type { AnalyticalContractFailure } from "../contracts";
import type { TradeQueryAuthority } from "../query";
import {
  compileAfterOutcomeExclusionPreset,
  compileDirectionOnlyPreset,
  compileExcludePriceRangePreset,
  compileMaximumAttemptsPerTickerPreset,
  compileMaximumTradesPerDayPreset,
  compileNoNewTradesAfterTimePreset,
  compileReduceSizeAfterLossPreset,
  compileStopAfterConsecutiveLossesPreset,
  compileStopAfterDailyDollarDrawdownPreset,
  compileStopAfterLosingTickerAttemptsPreset,
  compileStopAfterProfitGivebackPreset,
  compileWaitAfterLossPreset,
  type CompiledRepresentativeSimulationPreset,
} from "../simulation";
import {
  getExecutionRuleTemplate,
  unknownExecutionRuleTemplateFailure,
  type ExecutionRuleTemplate,
} from "./execution-rule-template-catalog";

export interface CompiledExecutionRuleTemplateAnalysis {
  readonly template: ExecutionRuleTemplate;
  readonly compiledPreset: CompiledRepresentativeSimulationPreset;
}

export function compileExecutionRuleTemplateAnalysis(input: Readonly<{
  readonly templateId: string;
  readonly sourceQueryPlan: unknown;
  readonly authority: TradeQueryAuthority;
  readonly configuration: unknown;
}>): ExactResult<
  CompiledExecutionRuleTemplateAnalysis,
  AnalyticalContractFailure
> {
  const template = getExecutionRuleTemplate(input.templateId);
  if (template === null) {
    return unknownExecutionRuleTemplateFailure();
  }

  const compiled = (() => {
    switch (template.simulationPresetKey) {
      case "simulate_maximum_trades_per_day":
        return compileMaximumTradesPerDayPreset(
          input.sourceQueryPlan,
          input.authority,
          input.configuration,
        );
      case "simulate_maximum_attempts_per_ticker":
        return compileMaximumAttemptsPerTickerPreset(
          input.sourceQueryPlan,
          input.authority,
          input.configuration,
        );
      case "simulate_stop_after_consecutive_losses":
        return compileStopAfterConsecutiveLossesPreset(
          input.sourceQueryPlan,
          input.authority,
          input.configuration,
        );
      case "simulate_wait_after_loss":
        return compileWaitAfterLossPreset(
          input.sourceQueryPlan,
          input.authority,
          input.configuration,
        );
      case "simulate_stop_after_daily_dollar_drawdown":
        return compileStopAfterDailyDollarDrawdownPreset(
          input.sourceQueryPlan,
          input.authority,
          input.configuration,
        );
      case "simulate_stop_after_profit_giveback":
        return compileStopAfterProfitGivebackPreset(
          input.sourceQueryPlan,
          input.authority,
          input.configuration,
        );
      case "simulate_stop_after_losing_ticker_attempts":
        return compileStopAfterLosingTickerAttemptsPreset(
          input.sourceQueryPlan,
          input.authority,
          input.configuration,
        );
      case "simulate_no_new_trades_after_time":
        return compileNoNewTradesAfterTimePreset(
          input.sourceQueryPlan,
          input.authority,
          input.configuration,
        );
      case "simulate_direction_only":
        return compileDirectionOnlyPreset(
          input.sourceQueryPlan,
          input.authority,
          input.configuration,
        );
      case "simulate_exclude_price_range":
        return compileExcludePriceRangePreset(
          input.sourceQueryPlan,
          input.authority,
          input.configuration,
        );
      case "simulate_after_outcome_exclusion":
        return compileAfterOutcomeExclusionPreset(
          input.sourceQueryPlan,
          input.authority,
          input.configuration,
        );
      case "simulate_reduce_size_after_loss":
        return compileReduceSizeAfterLossPreset(
          input.sourceQueryPlan,
          input.authority,
          input.configuration,
        );
      case "simulate_skip_fourth_and_later_trades":
      case "simulate_skip_repeat_attempts":
        return unknownExecutionRuleTemplateFailure(
          "$.template.simulationPresetKey",
        );
    }
  })();

  if (!compiled.ok) {
    return compiled;
  }

  return {
    ok: true,
    value: Object.freeze({
      template,
      compiledPreset: compiled.value,
    }),
  };
}
