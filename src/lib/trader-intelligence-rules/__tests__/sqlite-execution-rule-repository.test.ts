import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import type { ExecutionRuleOwnerScope } from "@/src/lib/trader-intelligence-v3/analytics/rules";

import { SqliteExecutionRuleRepository } from "../sqlite-execution-rule-repository";

const temporaryDirectories: string[] = [];
const owner: ExecutionRuleOwnerScope = Object.freeze({
  userId: "local-owner",
  workspaceId: "primary-workspace",
  tradingAccountId: null,
});

function temporaryDatabasePath(): string {
  const directory = mkdtempSync(join(tmpdir(), "ti-v3-rules-"));
  temporaryDirectories.push(directory);
  return join(directory, "rules.sqlite");
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { force: true, recursive: true });
  }
});

describe("SqliteExecutionRuleRepository", () => {
  it("replays durable create, revise, pause, and resume commands after restart", () => {
    const databasePath = temporaryDatabasePath();
    const first = new SqliteExecutionRuleRepository(databasePath);
    first.create({
      ruleInstanceId: "rule-one",
      ruleVersionId: "rule-version-one",
      owner,
      templateId: "maximum_trades_per_day",
      configuration: { maximumTrades: "3" },
      effectiveFrom: "2026-07-28T14:00:00.000000000Z",
    });
    first.revise({
      ruleInstanceId: "rule-one",
      ruleVersionId: "rule-version-two",
      owner,
      expectedCurrentRuleVersionId: "rule-version-one",
      configuration: { maximumTrades: "2" },
      effectiveFrom: "2026-07-28T14:01:00.000000000Z",
    });
    first.transitionLifecycle({
      lifecycleEventId: "rule-lifecycle-pause",
      ruleInstanceId: "rule-one",
      owner,
      expectedCurrentStatus: "active",
      newStatus: "paused",
      effectiveAt: "2026-07-28T14:02:00.000000000Z",
    });
    first.transitionLifecycle({
      lifecycleEventId: "rule-lifecycle-resume",
      ruleInstanceId: "rule-one",
      owner,
      expectedCurrentStatus: "paused",
      newStatus: "active",
      effectiveAt: "2026-07-28T14:03:00.000000000Z",
    });
    first.close();

    const restarted = new SqliteExecutionRuleRepository(databasePath);
    const [snapshot] = restarted.list(owner);
    expect(snapshot).toMatchObject({
      instance: {
        ruleInstanceId: "rule-one",
        status: "active",
        currentRuleVersionId: "rule-version-two",
        currentLifecycleEventId: "rule-lifecycle-resume",
      },
      currentVersion: {
        ruleVersionId: "rule-version-two",
        versionOrdinal: "2",
        configuration: { maximumTrades: "2" },
      },
    });
    expect(
      restarted
        .listLifecycleEvents(owner, "rule-one")
        .map((event) => event.eventType),
    ).toEqual(["activated", "paused", "resumed"]);
    restarted.close();
  });

  it("keeps owner scopes isolated inside the same database", () => {
    const databasePath = temporaryDatabasePath();
    const repository = new SqliteExecutionRuleRepository(databasePath);
    repository.create({
      ruleInstanceId: "rule-owner-one",
      ruleVersionId: "rule-version-owner-one",
      owner,
      templateId: "maximum_trades_per_day",
      configuration: { maximumTrades: "4" },
      effectiveFrom: "2026-07-28T15:00:00.000000000Z",
    });
    expect(
      repository.list({ ...owner, userId: "different-owner" }),
    ).toEqual([]);
    repository.close();
  });
});
