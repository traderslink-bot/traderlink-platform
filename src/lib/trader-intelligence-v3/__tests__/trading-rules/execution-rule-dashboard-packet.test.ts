import { describe, expect, it } from "vitest";

import {
  buildExecutionRuleDashboardPacket,
  buildGovernedExecutionRuleEvaluation,
  buildSyntheticQueryFixture,
  executeTradeQuery,
  InMemoryExecutionRuleRepository,
  type ExecutionRuleOwnerScope,
} from "../../analytics";

const generatedAt = "2026-07-28T12:00:00.000000000Z";

function createRule(
  repository: InMemoryExecutionRuleRepository,
  owner: ExecutionRuleOwnerScope,
  suffix: string,
) {
  const created = repository.create({
    ruleInstanceId: `rule:${suffix}`,
    ruleVersionId: `rule-version:${suffix}:1`,
    owner,
    templateId: "maximum_trades_per_day",
    configuration: { maximumTrades: "1" },
    effectiveFrom: "2026-07-01T00:00:00.000000000Z",
  });
  if (!created.ok) throw new Error(`${created.error.code}:${created.error.path}`);
  return created.value;
}

function governedEvaluation() {
  const fixture = buildSyntheticQueryFixture(8);
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
  const queryResult = executeTradeQuery({
    source: fixture.source,
    partitionReceipt: fixture.partition,
    queryPlan,
  });
  if (!queryResult.ok) throw new Error(queryResult.error.code);
  const owner = Object.freeze({
    userId: fixture.partition.ownerScope[0],
    workspaceId: "workspace:dashboard-safe",
    tradingAccountId: fixture.partition.accountScope[0],
  }) satisfies ExecutionRuleOwnerScope;
  const repository = new InMemoryExecutionRuleRepository();
  const rule = createRule(repository, owner, "dashboard-safe");
  const lifecycleEvents = repository.listLifecycleEvents(
    owner,
    rule.instance.ruleInstanceId,
  );
  const evaluation = buildGovernedExecutionRuleEvaluation({
    evaluationId: "rule-evaluation:dashboard-safe",
    ruleInstance: rule.instance,
    ruleVersion: rule.currentVersion,
    lifecycleEvents,
    source: fixture.source,
    authority: fixture.authority,
    sourceQueryResult: queryResult.value,
    evaluatedAt: generatedAt,
  });
  if (!evaluation.ok) throw new Error(evaluation.error.code);
  return { owner, repository, rule, lifecycleEvents, evaluation: evaluation.value };
}

describe("execution rule dashboard packet", () => {
  it("projects a verified rule and evaluation without private authority evidence", () => {
    const source = governedEvaluation();
    const packet = buildExecutionRuleDashboardPacket({
      generatedAt,
      items: [
        {
          ruleInstance: source.rule.instance,
          ruleVersion: source.rule.currentVersion,
          lifecycleEvents: source.lifecycleEvents,
          latestEvaluation: source.evaluation,
          tradingAccountLabel: "Primary account",
        },
      ],
    });

    expect(packet).toMatchObject({
      ok: true,
      value: {
        kind: "trading_rules",
        rules: [
          {
            status: "active",
            accountScope: {
              kind: "trading_account",
              tradingAccountLabel: "Primary account",
            },
            template: {
              templateId: "maximum_trades_per_day",
            },
            latestEvaluation: {
              status: "broken",
              brokenTradeCount: "1",
              currency: "USD",
            },
          },
        ],
      },
    });
    if (!packet.ok) return;
    expect(packet.value.packetDigest).toMatch(
      /^ti_v3:execution_rule_dashboard_packet:v1:sha256:[0-9a-f]{64}$/,
    );
    const serialized = JSON.stringify(packet.value);
    expect(serialized).not.toContain(source.owner.userId);
    expect(serialized).not.toContain(source.owner.tradingAccountId!);
    expect(serialized).not.toContain("query_trade_");
    expect(serialized).not.toContain("supportingExecutionDigests");
    expect(serialized).not.toContain("supportingOccurrenceKeys");
    expect(serialized).not.toContain("sourceAuthority");
    expect(serialized).not.toContain("simulationResultDigest");
  });

  it("represents a workspace-wide rule without exposing an account identity", () => {
    const owner = Object.freeze({
      userId: "user:workspace-wide",
      workspaceId: "workspace:workspace-wide",
      tradingAccountId: null,
    }) satisfies ExecutionRuleOwnerScope;
    const repository = new InMemoryExecutionRuleRepository();
    const rule = createRule(repository, owner, "workspace-wide");
    const packet = buildExecutionRuleDashboardPacket({
      generatedAt,
      items: [
        {
          ruleInstance: rule.instance,
          ruleVersion: rule.currentVersion,
          lifecycleEvents: repository.listLifecycleEvents(
            owner,
            rule.instance.ruleInstanceId,
          ),
          latestEvaluation: null,
          tradingAccountLabel: null,
        },
      ],
    });

    expect(packet).toMatchObject({
      ok: true,
      value: {
        rules: [
          {
            accountScope: {
              kind: "workspace",
              tradingAccountLabel: null,
            },
            latestEvaluation: null,
          },
        ],
      },
    });
  });

  it("fails closed when the supplied lifecycle history omits the latest event", () => {
    const source = governedEvaluation();
    const paused = source.repository.transitionLifecycle({
      lifecycleEventId: "rule-lifecycle:dashboard-safe:2",
      ruleInstanceId: source.rule.instance.ruleInstanceId,
      owner: source.owner,
      expectedCurrentStatus: "active",
      newStatus: "paused",
      effectiveAt: "2026-07-28T10:00:00.000000000Z",
    });
    if (!paused.ok) throw new Error(paused.error.code);

    expect(
      buildExecutionRuleDashboardPacket({
        generatedAt,
        items: [
          {
            ruleInstance: paused.value.instance,
            ruleVersion: paused.value.currentVersion,
            lifecycleEvents: source.lifecycleEvents,
            latestEvaluation: null,
            tradingAccountLabel: "Primary account",
          },
        ],
      }),
    ).toMatchObject({
      ok: false,
      error: {
        code: "ti_v3_analytics_contract_reference_mismatch",
        path: "$.lifecycleEvents",
      },
    });
  });

  it("fails closed when an evaluation belongs to a different rule", () => {
    const source = governedEvaluation();
    const other = createRule(
      source.repository,
      source.owner,
      "dashboard-other-rule",
    );
    expect(
      buildExecutionRuleDashboardPacket({
        generatedAt,
        items: [
          {
            ruleInstance: other.instance,
            ruleVersion: other.currentVersion,
            lifecycleEvents: source.repository.listLifecycleEvents(
              source.owner,
              other.instance.ruleInstanceId,
            ),
            latestEvaluation: source.evaluation,
            tradingAccountLabel: "Primary account",
          },
        ],
      }),
    ).toMatchObject({
      ok: false,
      error: {
        code: "ti_v3_analytics_contract_reference_mismatch",
        path: "$.items[0].latestEvaluation",
      },
    });
  });
});
