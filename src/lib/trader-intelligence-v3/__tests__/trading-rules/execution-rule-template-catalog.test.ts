import { describe, expect, it } from "vitest";

import {
  buildSyntheticQueryFixture,
  compileExecutionRuleTemplateAnalysis,
  EXECUTION_RULE_TEMPLATE_CATALOG,
  EXECUTION_RULE_TEMPLATE_IDS,
  executeTradeQuery,
  getExecutionRuleTemplate,
  verifyExecutionRuleTemplateCatalog,
} from "../../analytics";

function verifiedSource() {
  const fixture = buildSyntheticQueryFixture(30);
  const sourceQueryPlan = fixture.plan({
    grouping: { kind: "aggregate" },
    metrics: [
      "candidate_count",
      "included_count",
      "excluded_count",
      "win_count",
      "loss_count",
      "flat_count",
      "net_pnl",
    ],
  });
  const result = executeTradeQuery({
    source: fixture.source,
    partitionReceipt: fixture.partition,
    queryPlan: sourceQueryPlan,
  });
  if (!result.ok) {
    throw new Error(`${result.error.code}:${result.error.path}`);
  }
  return { fixture, sourceQueryPlan };
}

describe("execution rule template catalog", () => {
  it("binds every phase-one rule to an available governed v3 capability", () => {
    expect(verifyExecutionRuleTemplateCatalog()).toEqual({
      complete: true,
      duplicateTemplateIds: [],
      missingCapabilityKeys: [],
      nonAvailableCapabilityBindings: [],
    });
    expect(EXECUTION_RULE_TEMPLATE_CATALOG.templates).toHaveLength(
      EXECUTION_RULE_TEMPLATE_IDS.length,
    );
    expect(EXECUTION_RULE_TEMPLATE_CATALOG.catalogDigest).toMatch(
      /^ti_v3:execution_rule_template_catalog:v1:sha256:[0-9a-f]{64}$/,
    );
  });

  it("keeps attempt and loss-limit semantics explicit", () => {
    expect(getExecutionRuleTemplate("maximum_attempts_per_ticker"))
      .toMatchObject({
        scope: "ticker_day",
        simulationPresetKey: "simulate_maximum_attempts_per_ticker",
        exampleConfiguration: { maximumAttempts: "2" },
      });
    expect(getExecutionRuleTemplate("stop_after_daily_realized_loss"))
      .toMatchObject({
        scope: "day_session",
        simulationPresetKey: "simulate_stop_after_daily_dollar_drawdown",
        comparisonUnit: "affected_trade",
      });
  });

  it("compiles every phase-one template through its governed v3 preset", () => {
    const source = verifiedSource();

    for (const template of EXECUTION_RULE_TEMPLATE_CATALOG.templates) {
      const compiled = compileExecutionRuleTemplateAnalysis({
        templateId: template.templateId,
        sourceQueryPlan: source.sourceQueryPlan,
        authority: source.fixture.authority,
        configuration: template.exampleConfiguration,
      });

      expect(
        compiled,
        `${template.templateId}: ${JSON.stringify(compiled)}`,
      ).toMatchObject({ ok: true });
      if (!compiled.ok) continue;
      expect(compiled.value.template.templateId).toBe(template.templateId);
      expect(compiled.value.compiledPreset.preset.presetKey).toBe(
        template.simulationPresetKey,
      );
      expect(compiled.value.compiledPreset.preset.compiledPlanDigest).toBe(
        compiled.value.compiledPreset.plan.planDigest,
      );
    }
  });

  it("fails closed for unknown templates and invalid configuration", () => {
    const source = verifiedSource();

    expect(
      compileExecutionRuleTemplateAnalysis({
        templateId: "not_registered",
        sourceQueryPlan: source.sourceQueryPlan,
        authority: source.fixture.authority,
        configuration: {},
      }),
    ).toMatchObject({
      ok: false,
      error: {
        code: "ti_v3_analytics_contract_invalid",
        path: "$.templateId",
      },
    });

    expect(
      compileExecutionRuleTemplateAnalysis({
        templateId: "maximum_trades_per_day",
        sourceQueryPlan: source.sourceQueryPlan,
        authority: source.fixture.authority,
        configuration: { maximumTrades: "0" },
      }),
    ).toMatchObject({
      ok: false,
      error: {
        code: "ti_v3_analytics_contract_oversized",
        path: "$.maximumTrades",
      },
    });
  });
});
