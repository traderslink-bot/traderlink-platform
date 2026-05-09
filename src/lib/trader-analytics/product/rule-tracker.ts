import type {
  ProductTraderAnalyticsTradeRow,
  SavedTraderAnalyticsReport,
  TraderRuleEvaluation,
  TraderRuleInstance,
  TraderRuleTemplate,
} from "./types";
import { buildFilteredTraderAnalyticsView } from "./selectors";

export const TRADER_RULE_TEMPLATES: TraderRuleTemplate[] = [
  {
    id: "no_adverse_price_adds",
    label: "No Adverse-Price Adds",
    description:
      "Flags trades where size was increased after price moved against the entry side.",
    evaluationKey: "no_adverse_price_adds",
    supportedParameters: [],
  },
  {
    id: "limit_rapid_fire_gaps",
    label: "Limit Rapid-Fire Executions",
    description:
      "Flags trades with more rapid-fire execution gaps than the configured threshold.",
    evaluationKey: "limit_rapid_fire_gaps",
    supportedParameters: [
      {
        id: "maxRapidFireGaps",
        label: "Maximum rapid-fire gaps",
        type: "number",
        defaultValue: 0,
      },
    ],
  },
  {
    id: "reduce_before_third_add",
    label: "Reduce Before Third Add",
    description:
      "Flags trades where three or more adds happened before the first reduction.",
    evaluationKey: "reduce_before_third_add",
    supportedParameters: [],
  },
  {
    id: "close_to_flat",
    label: "Close To Flat",
    description: "Flags trades that were left with an open position.",
    evaluationKey: "close_to_flat",
    supportedParameters: [],
  },
  {
    id: "consistent_share_sizing",
    label: "Keep Share Sizes Consistent",
    description: "Flags trades with large swings in increase-side share sizes.",
    evaluationKey: "consistent_share_sizing",
    supportedParameters: [],
  },
];

export function buildDefaultTraderRuleInstances(
  userId: string,
): TraderRuleInstance[] {
  return TRADER_RULE_TEMPLATES.map((template) => ({
    id: `rule:${template.id}`,
    userId,
    templateId: template.id,
    enabled: true,
    parameters: Object.fromEntries(
      template.supportedParameters.map((parameter) => [
        parameter.id,
        parameter.defaultValue,
      ]),
    ),
  }));
}

function violatesRule(args: {
  report: SavedTraderAnalyticsReport;
  row: ProductTraderAnalyticsTradeRow;
  template: TraderRuleTemplate;
  instance: TraderRuleInstance;
}): boolean {
  const summaryRef = args.report.sourceSummaries.find(
    (candidate) => candidate.requestIndex === args.row.requestIndex,
  );
  const summary = summaryRef?.summary;

  if (!summary) {
    return false;
  }

  switch (args.template.evaluationKey) {
    case "no_adverse_price_adds":
      return summary.riskFacts.adversePriceAddCount > 0;
    case "limit_rapid_fire_gaps": {
      const maxRapidFireGaps = Number(
        args.instance.parameters.maxRapidFireGaps ?? 0,
      );

      return summary.sequencing.rapidFireGapCount > maxRapidFireGaps;
    }
    case "reduce_before_third_add":
      return summary.sequencing.addsBeforeFirstReductionCount >= 3;
    case "close_to_flat":
      return summary.lifecycle.isOpenPosition;
    case "consistent_share_sizing":
      return summary.points.risks.some(
        (risk) => risk.id === "inconsistent_share_sizing",
      );
  }
}

export function evaluateTraderRules(args: {
  report: SavedTraderAnalyticsReport;
  instances: TraderRuleInstance[];
  templates?: TraderRuleTemplate[];
}): TraderRuleEvaluation[] {
  const templates = args.templates ?? TRADER_RULE_TEMPLATES;
  const rows = buildFilteredTraderAnalyticsView({ report: args.report }).rows;

  return args.instances
    .filter((instance) => instance.enabled)
    .map((instance) => {
      const template = templates.find(
        (candidate) => candidate.id === instance.templateId,
      );

      if (!template) {
        return null;
      }

      const violationRows = rows.filter((row) =>
        violatesRule({
          report: args.report,
          row,
          template,
          instance,
        }),
      );

      return {
        ruleId: instance.id,
        templateId: template.id,
        label: template.label,
        reportId: args.report.id,
        passedTradeCount: rows.length - violationRows.length,
        violatedTradeCount: violationRows.length,
        violationTradeIds: violationRows.map((row) => row.tradeId),
        violationRows,
      } satisfies TraderRuleEvaluation;
    })
    .filter(
      (evaluation): evaluation is TraderRuleEvaluation => evaluation !== null,
    );
}
