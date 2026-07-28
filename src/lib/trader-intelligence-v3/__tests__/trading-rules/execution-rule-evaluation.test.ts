import { describe, expect, it } from "vitest";

import {
  buildGovernedExecutionRuleEvaluation,
  buildSyntheticQueryFixture,
  executeTradeQuery,
  InMemoryExecutionRuleRepository,
  type ExecutionRuleOwnerScope,
  type SyntheticQueryFixtureAvailabilityOptions,
} from "../../analytics";

function prepared(
  count: number,
  availability: SyntheticQueryFixtureAvailabilityOptions = {},
) {
  const fixture = buildSyntheticQueryFixture(count, false, availability);
  const queryPlan = fixture.plan({
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
    queryPlan,
  });
  if (!result.ok) throw new Error(`${result.error.code}:${result.error.path}`);
  const owner = Object.freeze({
    userId: fixture.partition.ownerScope[0],
    workspaceId: "workspace:rules",
    tradingAccountId: fixture.partition.accountScope[0],
  }) satisfies ExecutionRuleOwnerScope;
  return { fixture, queryResult: result.value, owner };
}

function ruleRecord(
  owner: ExecutionRuleOwnerScope,
  templateId: string,
  configuration: unknown,
  suffix: string,
  effectiveFrom = "2026-07-01T00:00:00.000000000Z",
) {
  const repository = new InMemoryExecutionRuleRepository();
  const created = repository.create({
    ruleInstanceId: `rule:${suffix}`,
    ruleVersionId: `rule-version:${suffix}:1`,
    owner,
    templateId,
    configuration,
    effectiveFrom,
  });
  if (!created.ok) {
    throw new Error(`${created.error.code}:${created.error.path}`);
  }
  return {
    instance: created.value.instance,
    version: created.value.currentVersion,
    lifecycleEvents: repository.listLifecycleEvents(
      owner,
      created.value.instance.ruleInstanceId,
    ),
  };
}

function evaluate(
  source: ReturnType<typeof prepared>,
  rule: ReturnType<typeof ruleRecord>,
  suffix: string,
) {
  return buildGovernedExecutionRuleEvaluation({
    evaluationId: `rule-evaluation:${suffix}`,
    ruleInstance: rule.instance,
    ruleVersion: rule.version,
    lifecycleEvents: rule.lifecycleEvents,
    source: source.fixture.source,
    authority: source.fixture.authority,
    sourceQueryResult: source.queryResult,
    evaluatedAt: "2026-07-28T12:00:00.000000000Z",
  });
}

describe("governed execution rule evaluation", () => {
  it("classifies a governed counterfactual violation as broken", () => {
    const source = prepared(8);
    const rule = ruleRecord(
      source.owner,
      "maximum_trades_per_day",
      { maximumTrades: "1" },
      "max-trades-broken",
    );
    const evaluation = evaluate(source, rule, "max-trades-broken");

    expect(evaluation).toMatchObject({
      ok: true,
      value: {
        status: "broken",
        brokenTradeCount: "1",
        insufficientDataTradeCount: "0",
        owner: source.owner,
        ruleVersionDigest: rule.version.versionDigest,
      },
    });
    if (!evaluation.ok) return;
    expect(evaluation.value.brokenTradeKeys).toHaveLength(1);
    expect(evaluation.value.evaluationDigest).toMatch(
      /^ti_v3:execution_rule_evaluation:v1:sha256:[0-9a-f]{64}$/,
    );
    expect(evaluation.value.sourceAuthority.simulationResultDigest).toMatch(
      /^ti_v3:counterfactual_simulation_result:v1:sha256:[0-9a-f]{64}$/,
    );
  });

  it("counts a triggered cooldown with no violating trade as followed", () => {
    const source = prepared(8);
    const rule = ruleRecord(
      source.owner,
      "wait_after_loss",
      { cooldownSeconds: "300" },
      "cooldown-followed",
    );
    const evaluation = evaluate(source, rule, "cooldown-followed");

    expect(evaluation).toMatchObject({
      ok: true,
      value: {
        status: "followed",
        triggeredTradeCount: "1",
        brokenTradeCount: "0",
      },
    });
  });

  it("does not count a rule with no trigger as followed", () => {
    const source = prepared(7);
    const rule = ruleRecord(
      source.owner,
      "maximum_trades_per_day",
      { maximumTrades: "1" },
      "max-trades-not-triggered",
    );
    const evaluation = evaluate(source, rule, "max-trades-not-triggered");

    expect(evaluation).toMatchObject({
      ok: true,
      value: {
        status: "not_triggered",
        triggeredTradeCount: "0",
        brokenTradeCount: "0",
        reasonCodes: [
          "ti_v3_rule_evaluation_no_trigger_not_counted_followed",
        ],
      },
    });
  });

  it("preserves missing price authority as insufficient data", () => {
    const source = prepared(1, { unavailableEntryNotionalIndices: [0] });
    const rule = ruleRecord(
      source.owner,
      "exclude_entry_price_range",
      { lowerEntryPrice: "1", upperEntryPrice: "5" },
      "price-insufficient",
    );
    const evaluation = evaluate(source, rule, "price-insufficient");

    expect(evaluation).toMatchObject({
      ok: true,
      value: {
        status: "insufficient_data",
        brokenTradeCount: "0",
        insufficientDataTradeCount: "1",
      },
    });
  });

  it("does not convert the half-size simulation into adherence", () => {
    const source = prepared(8);
    const rule = ruleRecord(
      source.owner,
      "reduce_next_trade_size_after_loss",
      {},
      "resize-unsupported",
    );
    const evaluation = evaluate(source, rule, "resize-unsupported");

    expect(evaluation).toMatchObject({
      ok: true,
      value: {
        status: "unavailable",
        reasonCodes: expect.arrayContaining([
          "ti_v3_rule_adherence_resize_baseline_unsupported",
        ]),
        limitationCodes: expect.arrayContaining([
          "ti_v3_rule_adherence_requires_declared_size_baseline",
        ]),
      },
    });
  });

  it("fails closed when rule ownership does not match source authority", () => {
    const source = prepared(8);
    const rule = ruleRecord(
      { ...source.owner, userId: "owner:not-the-source" },
      "maximum_trades_per_day",
      { maximumTrades: "1" },
      "wrong-owner",
    );
    const evaluation = evaluate(source, rule, "wrong-owner");

    expect(evaluation).toMatchObject({
      ok: false,
      error: {
        code: "ti_v3_analytics_contract_reference_mismatch",
        path: "$.owner.userId",
      },
    });
  });

  it("rejects trades from before the rule version became effective", () => {
    const source = prepared(8);
    const rule = ruleRecord(
      source.owner,
      "maximum_trades_per_day",
      { maximumTrades: "1" },
      "future-rule-version",
      "2026-07-02T00:00:00.000000000Z",
    );
    const evaluation = evaluate(source, rule, "future-rule-version");

    expect(evaluation).toMatchObject({
      ok: false,
      error: {
        code: "ti_v3_analytics_contract_reference_mismatch",
        path: "$.sourceQueryResult.ruleEffectiveWindow",
      },
    });
  });

  it("rejects evaluation populations containing trades from a paused interval", () => {
    const source = prepared(8);
    const repository = new InMemoryExecutionRuleRepository();
    const created = repository.create({
      ruleInstanceId: "rule:paused-window",
      ruleVersionId: "rule-version:paused-window:1",
      owner: source.owner,
      templateId: "maximum_trades_per_day",
      configuration: { maximumTrades: "1" },
      effectiveFrom: "2026-07-01T00:00:00.000000000Z",
    });
    if (!created.ok) throw new Error(created.error.code);
    const paused = repository.transitionLifecycle({
      lifecycleEventId: "rule-lifecycle:paused-window:2",
      ruleInstanceId: created.value.instance.ruleInstanceId,
      owner: source.owner,
      expectedCurrentStatus: "active",
      newStatus: "paused",
      effectiveAt: "2026-07-01T10:00:00.000000000Z",
    });
    if (!paused.ok) throw new Error(paused.error.code);

    const evaluation = evaluate(
      source,
      {
        instance: paused.value.instance,
        version: paused.value.currentVersion,
        lifecycleEvents: repository.listLifecycleEvents(
          source.owner,
          paused.value.instance.ruleInstanceId,
        ),
      },
      "paused-window",
    );
    expect(evaluation).toMatchObject({
      ok: false,
      error: {
        code: "ti_v3_analytics_contract_reference_mismatch",
        path: "$.sourceQueryResult.lifecycleActiveWindow",
      },
    });
  });
});
