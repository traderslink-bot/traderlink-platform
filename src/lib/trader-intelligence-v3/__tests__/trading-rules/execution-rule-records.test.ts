import { describe, expect, it } from "vitest";

import {
  InMemoryExecutionRuleRepository,
  type ExecutionRuleOwnerScope,
} from "../../analytics";

const owner = Object.freeze({
  userId: "user:alpha",
  workspaceId: "workspace:alpha",
  tradingAccountId: "account:primary",
}) satisfies ExecutionRuleOwnerScope;

function createMaximumTradesRule(repository: InMemoryExecutionRuleRepository) {
  return repository.create({
    ruleInstanceId: "rule:max-trades",
    ruleVersionId: "rule-version:max-trades:1",
    owner,
    templateId: "maximum_trades_per_day",
    configuration: { maximumTrades: "3" },
    effectiveFrom: "2026-07-28T12:00:00.000000000Z",
  });
}

describe("execution rule records", () => {
  it("creates a user/workspace/account-owned immutable first version", () => {
    const repository = new InMemoryExecutionRuleRepository();
    const created = createMaximumTradesRule(repository);

    expect(created).toMatchObject({
      ok: true,
      value: {
        instance: {
          owner,
          status: "active",
          currentRuleVersionId: "rule-version:max-trades:1",
        },
        currentVersion: {
          versionOrdinal: "1",
          templateId: "maximum_trades_per_day",
          configuration: { maximumTrades: "3" },
          supersedesRuleVersionId: null,
        },
      },
    });
    if (!created.ok) return;
    expect(created.value.currentVersion.versionDigest).toMatch(
      /^ti_v3:execution_rule_version:v1:sha256:[0-9a-f]{64}$/,
    );
    expect(Object.isFrozen(created.value.currentVersion)).toBe(true);
  });

  it("revises prospectively while preserving the original version", () => {
    const repository = new InMemoryExecutionRuleRepository();
    const created = createMaximumTradesRule(repository);
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const revised = repository.revise({
      ruleInstanceId: created.value.instance.ruleInstanceId,
      ruleVersionId: "rule-version:max-trades:2",
      owner,
      expectedCurrentRuleVersionId:
        created.value.instance.currentRuleVersionId,
      configuration: { maximumTrades: "2" },
      effectiveFrom: "2026-07-29T12:00:00.000000000Z",
    });

    expect(revised).toMatchObject({
      ok: true,
      value: {
        instance: {
          currentRuleVersionId: "rule-version:max-trades:2",
        },
        currentVersion: {
          versionOrdinal: "2",
          configuration: { maximumTrades: "2" },
          supersedesRuleVersionId: "rule-version:max-trades:1",
        },
      },
    });
    expect(repository.listVersions(owner, "rule:max-trades")).toMatchObject([
      {
        ruleVersionId: "rule-version:max-trades:1",
        configuration: { maximumTrades: "3" },
      },
      {
        ruleVersionId: "rule-version:max-trades:2",
        configuration: { maximumTrades: "2" },
      },
    ]);
  });

  it("fails closed for cross-user access and stale revisions", () => {
    const repository = new InMemoryExecutionRuleRepository();
    const created = createMaximumTradesRule(repository);
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    const otherOwner = {
      ...owner,
      userId: "user:other",
    };

    expect(repository.get(otherOwner, "rule:max-trades")).toBeNull();
    expect(repository.list(otherOwner)).toEqual([]);
    expect(
      repository.revise({
        ruleInstanceId: "rule:max-trades",
        ruleVersionId: "rule-version:max-trades:other",
        owner: otherOwner,
        expectedCurrentRuleVersionId: "rule-version:max-trades:1",
        configuration: { maximumTrades: "2" },
        effectiveFrom: "2026-07-29T12:00:00.000000000Z",
      }),
    ).toMatchObject({
      ok: false,
      error: {
        code: "ti_v3_analytics_contract_invalid",
        path: "$.ruleInstanceId",
      },
    });
    expect(
      repository.revise({
        ruleInstanceId: "rule:max-trades",
        ruleVersionId: "rule-version:max-trades:stale",
        owner,
        expectedCurrentRuleVersionId: "rule-version:wrong",
        configuration: { maximumTrades: "2" },
        effectiveFrom: "2026-07-29T12:00:00.000000000Z",
      }),
    ).toMatchObject({
      ok: false,
      error: {
        code: "ti_v3_analytics_contract_reference_mismatch",
        path: "$.expectedCurrentRuleVersionId",
      },
    });
  });

  it("rejects invalid, non-canonical, and retroactive configurations", () => {
    const repository = new InMemoryExecutionRuleRepository();
    expect(
      repository.create({
        ruleInstanceId: "rule:invalid",
        ruleVersionId: "rule-version:invalid:1",
        owner,
        templateId: "maximum_trades_per_day",
        configuration: { maximumTrades: "03" },
        effectiveFrom: "2026-07-28T12:00:00.000000000Z",
      }),
    ).toMatchObject({ ok: false });
    expect(
      repository.create({
        ruleInstanceId: "rule:extra",
        ruleVersionId: "rule-version:extra:1",
        owner,
        templateId: "maximum_trades_per_day",
        configuration: { maximumTrades: "3", ignored: "yes" },
        effectiveFrom: "2026-07-28T12:00:00.000000000Z",
      }),
    ).toMatchObject({ ok: false });

    const created = createMaximumTradesRule(repository);
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    expect(
      repository.revise({
        ruleInstanceId: "rule:max-trades",
        ruleVersionId: "rule-version:max-trades:retroactive",
        owner,
        expectedCurrentRuleVersionId: "rule-version:max-trades:1",
        configuration: { maximumTrades: "2" },
        effectiveFrom: "2026-07-27T12:00:00.000000000Z",
      }),
    ).toMatchObject({
      ok: false,
      error: {
        code: "ti_v3_analytics_contract_invalid",
        path: "$.effectiveFrom",
      },
    });
  });

  it("keeps account-wide and one-account rule scopes separate", () => {
    const repository = new InMemoryExecutionRuleRepository();
    expect(createMaximumTradesRule(repository).ok).toBe(true);
    const accountWideOwner = { ...owner, tradingAccountId: null };
    expect(
      repository.create({
        ruleInstanceId: "rule:direction",
        ruleVersionId: "rule-version:direction:1",
        owner: accountWideOwner,
        templateId: "allowed_direction_only",
        configuration: { allowedDirection: "long" },
        effectiveFrom: "2026-07-28T12:00:00.000000000Z",
      }).ok,
    ).toBe(true);

    expect(repository.list(owner)).toHaveLength(1);
    expect(repository.list(accountWideOwner)).toHaveLength(1);
  });
});
