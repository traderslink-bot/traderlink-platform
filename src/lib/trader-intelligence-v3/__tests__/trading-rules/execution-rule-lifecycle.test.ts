import { describe, expect, it } from "vitest";

import {
  InMemoryExecutionRuleRepository,
  verifyExecutionRuleLifecycleEvent,
  type ExecutionRuleOwnerScope,
} from "../../analytics";

const owner = Object.freeze({
  userId: "user:lifecycle",
  workspaceId: "workspace:lifecycle",
  tradingAccountId: "account:lifecycle",
}) satisfies ExecutionRuleOwnerScope;

function repositoryWithRule() {
  const repository = new InMemoryExecutionRuleRepository();
  const created = repository.create({
    ruleInstanceId: "rule:lifecycle",
    ruleVersionId: "rule-version:lifecycle:1",
    owner,
    templateId: "maximum_trades_per_day",
    configuration: { maximumTrades: "3" },
    effectiveFrom: "2026-07-28T12:00:00.000000000Z",
  });
  if (!created.ok) {
    throw new Error(`${created.error.code}:${created.error.path}`);
  }
  return { repository, created: created.value };
}

describe("execution rule lifecycle history", () => {
  it("creates an immutable activation event with the rule", () => {
    const { repository } = repositoryWithRule();
    const history = repository.listLifecycleEvents(owner, "rule:lifecycle");

    expect(history).toMatchObject([
      {
        sequenceOrdinal: "1",
        eventType: "activated",
        previousStatus: null,
        newStatus: "active",
        previousLifecycleEventId: null,
      },
    ]);
    expect(history[0].lifecycleEventDigest).toMatch(
      /^ti_v3:execution_rule_lifecycle_event:v1:sha256:[0-9a-f]{64}$/,
    );
    expect(verifyExecutionRuleLifecycleEvent(history[0])).toMatchObject({
      ok: true,
    });
    expect(Object.isFrozen(history[0])).toBe(true);
  });

  it("records a chained pause and resume without rewriting prior events", () => {
    const { repository } = repositoryWithRule();
    const paused = repository.transitionLifecycle({
      lifecycleEventId: "rule-lifecycle:lifecycle:2",
      ruleInstanceId: "rule:lifecycle",
      owner,
      expectedCurrentStatus: "active",
      newStatus: "paused",
      effectiveAt: "2026-07-28T13:00:00.000000000Z",
    });
    expect(paused).toMatchObject({
      ok: true,
      value: { instance: { status: "paused" } },
    });
    const resumed = repository.transitionLifecycle({
      lifecycleEventId: "rule-lifecycle:lifecycle:3",
      ruleInstanceId: "rule:lifecycle",
      owner,
      expectedCurrentStatus: "paused",
      newStatus: "active",
      effectiveAt: "2026-07-28T14:00:00.000000000Z",
    });
    expect(resumed).toMatchObject({
      ok: true,
      value: { instance: { status: "active" } },
    });

    expect(repository.listLifecycleEvents(owner, "rule:lifecycle"))
      .toMatchObject([
        { sequenceOrdinal: "1", eventType: "activated" },
        {
          sequenceOrdinal: "2",
          eventType: "paused",
          previousLifecycleEventId: "rule-lifecycle:rule:lifecycle:1",
        },
        {
          sequenceOrdinal: "3",
          eventType: "resumed",
          previousLifecycleEventId: "rule-lifecycle:lifecycle:2",
        },
      ]);
  });

  it("makes retirement terminal", () => {
    const { repository } = repositoryWithRule();
    const retired = repository.transitionLifecycle({
      lifecycleEventId: "rule-lifecycle:lifecycle:retired",
      ruleInstanceId: "rule:lifecycle",
      owner,
      expectedCurrentStatus: "active",
      newStatus: "retired",
      effectiveAt: "2026-07-28T13:00:00.000000000Z",
    });
    expect(retired).toMatchObject({
      ok: true,
      value: { instance: { status: "retired" } },
    });
    expect(
      repository.transitionLifecycle({
        lifecycleEventId: "rule-lifecycle:lifecycle:illegal-resume",
        ruleInstanceId: "rule:lifecycle",
        owner,
        expectedCurrentStatus: "retired",
        newStatus: "active",
        effectiveAt: "2026-07-28T14:00:00.000000000Z",
      }),
    ).toMatchObject({
      ok: false,
      error: {
        code: "ti_v3_analytics_contract_invalid",
        path: "$.newStatus",
      },
    });
  });

  it("fails closed for stale status and cross-user transitions", () => {
    const { repository } = repositoryWithRule();
    expect(
      repository.transitionLifecycle({
        lifecycleEventId: "rule-lifecycle:lifecycle:stale",
        ruleInstanceId: "rule:lifecycle",
        owner,
        expectedCurrentStatus: "paused",
        newStatus: "active",
        effectiveAt: "2026-07-28T13:00:00.000000000Z",
      }),
    ).toMatchObject({
      ok: false,
      error: {
        code: "ti_v3_analytics_contract_reference_mismatch",
        path: "$.expectedCurrentStatus",
      },
    });
    expect(
      repository.transitionLifecycle({
        lifecycleEventId: "rule-lifecycle:lifecycle:other-user",
        ruleInstanceId: "rule:lifecycle",
        owner: { ...owner, userId: "user:other" },
        expectedCurrentStatus: "active",
        newStatus: "paused",
        effectiveAt: "2026-07-28T13:00:00.000000000Z",
      }),
    ).toMatchObject({
      ok: false,
      error: {
        code: "ti_v3_analytics_contract_invalid",
        path: "$.ruleInstanceId",
      },
    });
  });

  it("prevents retroactive lifecycle events and revisions", () => {
    const { repository } = repositoryWithRule();
    expect(
      repository.transitionLifecycle({
        lifecycleEventId: "rule-lifecycle:lifecycle:retroactive",
        ruleInstanceId: "rule:lifecycle",
        owner,
        expectedCurrentStatus: "active",
        newStatus: "paused",
        effectiveAt: "2026-07-28T11:00:00.000000000Z",
      }),
    ).toMatchObject({
      ok: false,
      error: {
        code: "ti_v3_analytics_contract_invalid",
        path: "$.effectiveAt",
      },
    });

    expect(
      repository.transitionLifecycle({
        lifecycleEventId: "rule-lifecycle:lifecycle:pause",
        ruleInstanceId: "rule:lifecycle",
        owner,
        expectedCurrentStatus: "active",
        newStatus: "paused",
        effectiveAt: "2026-07-28T13:00:00.000000000Z",
      }).ok,
    ).toBe(true);
    expect(
      repository.transitionLifecycle({
        lifecycleEventId: "rule-lifecycle:lifecycle:resume",
        ruleInstanceId: "rule:lifecycle",
        owner,
        expectedCurrentStatus: "paused",
        newStatus: "active",
        effectiveAt: "2026-07-28T14:00:00.000000000Z",
      }).ok,
    ).toBe(true);
    expect(
      repository.revise({
        ruleInstanceId: "rule:lifecycle",
        ruleVersionId: "rule-version:lifecycle:2",
        owner,
        expectedCurrentRuleVersionId: "rule-version:lifecycle:1",
        configuration: { maximumTrades: "2" },
        effectiveFrom: "2026-07-28T13:30:00.000000000Z",
      }),
    ).toMatchObject({
      ok: false,
      error: {
        code: "ti_v3_analytics_contract_invalid",
        path: "$.effectiveFrom",
      },
    });
  });
});
