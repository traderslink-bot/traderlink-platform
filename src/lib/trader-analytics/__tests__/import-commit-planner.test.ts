import { describe, expect, it } from "vitest";
import {
  buildCsvDryRunImportExperience,
  buildImportCommitPlan,
  InMemoryImportCommitRepository,
} from "../index";

const ids = {
  accountId: "account-commit-test",
  userId: "user-commit-test",
  workspaceId: "workspace-commit-test",
};

function experience(csvText: string) {
  return buildCsvDryRunImportExperience({
    broker: "generic_execution_csv",
    csvText,
  });
}

function planFor(csvText: string, overrides = {}) {
  return buildImportCommitPlan({
    ...ids,
    experience: experience(csvText),
    generatedAt: "2026-05-07T18:00:00.000Z",
    ...overrides,
  });
}

describe("import commit planner", () => {
  it("review-gates generic CSV imports until the mapping is acknowledged", () => {
    const csv = [
      "Date,Time,Symbol,Side,Quantity,Price",
      "2026-05-01,09:30:00,MAP,Buy,100,10.00",
      "2026-05-01,10:00:00,MAP,Sell,100,10.50",
    ].join("\n");
    const plan = planFor(csv);

    expect(plan.status).toBe("needs_user_review");
    expect(plan.canCommitNow).toBe(false);
    expect(plan.requiredDecisions.map((item) => item.kind)).toContain(
      "review_mapping",
    );
  });

  it("plans and commits a ready long import into the in-memory repository", () => {
    const csv = [
      "Date,Time,Symbol,Side,Quantity,Price",
      "2026-05-01,09:30:00,LONG,Buy,100,10.00",
      "2026-05-01,10:00:00,LONG,Sell,100,10.50",
    ].join("\n");
    const plan = planFor(csv, {
      acknowledgements: {
        mappingReview: true,
        pnlReview: true,
      },
    });
    const repository = new InMemoryImportCommitRepository();
    const result = repository.commitImportPlan(plan);

    expect(plan.status).toBe("ready_to_commit");
    expect(plan.canCommitNow).toBe(true);
    expect(plan.rows).toHaveLength(2);
    expect(plan.executions).toHaveLength(2);
    expect(plan.savedTrades).toHaveLength(1);
    expect(plan.executionFeedbackSummaries).toHaveLength(1);
    expect(plan.decisionReviewJobs).toMatchObject([
      { status: "queued", symbol: "LONG" },
    ]);
    expect(result.status).toBe("committed");
    expect(repository.listSavedTrades(ids.accountId)).toHaveLength(1);
    expect(repository.getLatestCommittedBatch(ids.accountId)?.status).toBe(
      "committed",
    );
  });

  it("blocks rejected rows before commit", () => {
    const csv = [
      "Date,Time,Symbol,Side,Quantity,Price",
      "2026-05-01,09:30:00,,Buy,100,10.00",
      "2026-05-01,10:00:00,REJ,Sell,100,10.50",
    ].join("\n");
    const plan = planFor(csv);
    const repository = new InMemoryImportCommitRepository();
    const result = repository.commitImportPlan(plan);

    expect(plan.status).toBe("blocked");
    expect(plan.canCommitNow).toBe(false);
    expect(plan.requiredDecisions.map((item) => item.kind)).toContain(
      "resolve_rejected_rows",
    );
    expect(result.status).toBe("rejected");
    expect(repository.listSavedTrades(ids.accountId)).toEqual([]);
  });

  it("keeps open positions review-gated and stores blocked decision-review jobs after acknowledgement", () => {
    const csv = [
      "Date,Time,Symbol,Side,Quantity,Price",
      "2026-05-01,09:30:00,OPEN,Buy,100,10.00",
      "2026-05-01,10:00:00,OPEN,Sell,25,10.50",
    ].join("\n");
    const needsReview = planFor(csv);
    const acknowledged = planFor(csv, {
      acknowledgements: {
        anomalyTypes: ["open_leftover"],
        groupingReview: true,
        mappingReview: true,
        openPositions: true,
        pnlReview: true,
      },
    });
    const repository = new InMemoryImportCommitRepository();

    expect(needsReview.status).toBe("needs_user_review");
    expect(needsReview.requiredDecisions.map((item) => item.kind)).toContain(
      "acknowledge_open_position",
    );
    expect(acknowledged.status).toBe("ready_to_commit");

    repository.commitImportPlan(acknowledged);
    expect(repository.listDecisionReviewJobs(acknowledged.batch.id)).toMatchObject([
      { status: "blocked_open_trade", symbol: "OPEN" },
    ]);
  });

  it("requires duplicate file and duplicate trade decisions before commit", () => {
    const csv = [
      "Date,Time,Symbol,Side,Quantity,Price",
      "2026-05-01,09:30:00,DUP,Buy,100,10.00",
      "2026-05-01,10:00:00,DUP,Sell,100,10.50",
    ].join("\n");
    const first = planFor(csv);
    const fingerprint = first.savedTrades[0]?.tradeFingerprint;

    expect(fingerprint).toBeTruthy();

    const duplicate = planFor(csv, {
      existingFileFingerprints: [first.batch.fileFingerprint],
      existingTradeFingerprints: [fingerprint],
    });
    const acknowledged = planFor(csv, {
      existingFileFingerprints: [first.batch.fileFingerprint],
      existingTradeFingerprints: [fingerprint],
      acknowledgements: {
        duplicateFile: true,
        duplicateTradeFingerprints: [fingerprint],
        mappingReview: true,
        pnlReview: true,
      },
    });

    expect(duplicate.status).toBe("needs_user_review");
    expect(duplicate.requiredDecisions.map((item) => item.kind)).toEqual(
      expect.arrayContaining(["resolve_duplicate_file", "resolve_duplicate_trade"]),
    );
    expect(acknowledged.status).toBe("ready_to_commit");
    expect(acknowledged.duplicateTradeFingerprints).toEqual([fingerprint]);
  });

  it("blocks sell-starting uploads instead of saving unsupported short-side trades", () => {
    const csv = [
      "Date,Time,Symbol,Side,Quantity,Price,Commission,Fees,Amount,Currency",
      "2026-05-01,09:30:00,SHRT,Sell,100,10.00,1.00,0.10,998.90,USD",
      "2026-05-01,10:00:00,SHRT,Buy,100,9.50,1.00,0.10,-951.10,USD",
    ].join("\n");
    const plan = planFor(csv, {
      acknowledgements: {
        mappingReview: true,
      },
    });

    expect(plan.status).toBe("blocked");
    expect(plan.savedTrades).toEqual([]);
    expect(plan.blockingReasons.map((item) => item.id)).toContain(
      "blocked:no-reconstructed-trades",
    );
  });

  it("review-gates over-reduction splits and execution anomalies until acknowledged", () => {
    const csv = [
      "Date,Time,Symbol,Side,Quantity,Price",
      "2026-05-01,09:30:00,OVER,Buy,100,10.00",
      "2026-05-01,10:00:00,OVER,Sell,150,10.50",
      "2026-05-01,10:15:00,OVER,Buy,50,10.25",
    ].join("\n");
    const needsReview = planFor(csv);
    const acknowledged = planFor(csv, {
      acknowledgements: {
        anomalyTypes: ["over_reduction_or_reversal"],
        groupingReview: true,
        mappingReview: true,
        pnlReview: true,
      },
    });

    expect(needsReview.status).toBe("needs_user_review");
    expect(needsReview.requiredDecisions.map((item) => item.kind)).toContain(
      "review_grouping",
    );
    expect(needsReview.requiredDecisions.map((item) => item.kind)).toContain(
      "acknowledge_execution_anomaly",
    );
    expect(acknowledged.status).toBe("ready_to_commit");
    expect(acknowledged.savedTrades).toHaveLength(1);
    expect(acknowledged.savedTrades[0]).toMatchObject({
      symbol: "OVER",
      tradeDirection: "long",
    });
  });

  it("keeps share-size jump notes from blocking an otherwise clean save", () => {
    const csv = [
      "Date,Time,Symbol,Side,Quantity,Price",
      "2026-05-01,09:30:00,JUMP,Buy,25,10.00",
      "2026-05-01,09:45:00,JUMP,Buy,100,9.90",
      "2026-05-01,10:00:00,JUMP,Sell,125,10.10",
    ].join("\n");
    const plan = planFor(csv, {
      acknowledgements: {
        mappingReview: true,
        pnlReview: true,
      },
    });

    expect(
      plan.reviewReasons.map((item) => item.message.toLowerCase()),
    ).not.toContainEqual(expect.stringContaining("size jump"));
    expect(plan.status).toBe("ready_to_commit");
    expect(plan.canCommitNow).toBe(true);
  });
});
