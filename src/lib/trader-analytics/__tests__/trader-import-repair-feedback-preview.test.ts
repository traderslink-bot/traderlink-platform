import { describe, expect, it } from "vitest";
import {
  applyCsvDryRunCellEdit,
  buildCsvDryRunImportExperience,
  getCsvDryRunSamplePresets,
} from "../index";

function preset(id: string) {
  const match = getCsvDryRunSamplePresets().find(
    (candidate) => candidate.id === id,
  );

  expect(match).toBeTruthy();

  return match!;
}

describe("import repair and feedback preview workflow", () => {
  it("edits rejected CSV row cells and re-runs the dry-run parser", () => {
    const sample = preset("preset:row-repair");
    const blocked = buildCsvDryRunImportExperience({
      csvText: sample.csvText,
      broker: sample.broker,
    });

    expect(blocked.confidenceGate.status).toBe("blocked");
    expect(blocked.rowRepairTable.rejectedRowCount).toBe(1);
    expect(blocked.rowRepairTable.editableRows[0]).toMatchObject({
      rowNumber: 2,
      status: "rejected",
    });

    const repairedCsv = applyCsvDryRunCellEdit({
      csvText: sample.csvText,
      rowNumber: 2,
      header: "Symbol",
      value: "ABCD",
    });
    const repaired = buildCsvDryRunImportExperience({
      csvText: repairedCsv,
      broker: sample.broker,
    });

    expect(repaired.preview.importResult.acceptedExecutionCount).toBe(2);
    expect(repaired.rowRepairTable.rejectedRowCount).toBe(0);
    expect(repaired.confidenceGate.status).toBe("ready");
  });

  it("keeps execution feedback preview execution-only and market-context gated", () => {
    const sample = preset("preset:ibkr");
    const experience = buildCsvDryRunImportExperience({
      csvText: sample.csvText,
      broker: sample.broker,
    });

    expect(experience.executionFeedbackPreview.source).toBe("executions_only");
    expect(experience.executionFeedbackPreview.marketContextUsed).toBe(false);
    expect(experience.marketContextUsedForConclusions).toBe(false);
    expect(experience.executionFeedbackPreview.completedCount).toBe(1);
    expect(experience.executionFeedbackPreview.items[0]).toMatchObject({
      status: "completed",
      symbol: "AAPL",
    });
    expect(
      experience.evidenceDrillIn.records.some(
        (record) => record.source === "feedback_preview",
      ),
    ).toBe(true);
  });

  it("creates grouping decisions for open-position imports", () => {
    const sample = preset("preset:open-position");
    const experience = buildCsvDryRunImportExperience({
      csvText: sample.csvText,
      broker: sample.broker,
    });
    const decision = experience.groupingDecisionReview.items[0];

    expect(experience.tradeGroupingReview.items[0].lifecycleStatus).toBe("open");
    expect(decision.currentRecommendation).toBe("review_open_position");
    expect(decision.persistenceStatus).toBe("client_state_only");
    expect(decision.options.map((option) => option.kind)).toEqual(
      expect.arrayContaining([
        "confirm_grouping",
        "split_later",
        "merge_later",
        "review_open_position",
      ]),
    );
  });

  it("builds a dry-run replay preview with role and risk-direction labels", () => {
    const sample = preset("preset:generic-short");
    const experience = buildCsvDryRunImportExperience({
      csvText: sample.csvText,
      broker: sample.broker,
    });

    expect(experience.replayPreview.tradeLabel).toContain("SPY");
    expect(experience.replayPreview.lifecycleStatus).toBe("closed");
    expect(experience.replayPreview.steps).toEqual([
      expect.objectContaining({
        roleLabel: "Initial entry",
        riskDirection: "increased",
      }),
      expect.objectContaining({
        roleLabel: "Full exit",
        riskDirection: "closed",
      }),
    ]);
  });

  it("surfaces broker help, matched error library entries, and privacy copy", () => {
    const sample = preset("preset:open-position");
    const experience = buildCsvDryRunImportExperience({
      csvText: sample.csvText,
      broker: sample.broker,
    });

    expect(experience.brokerHelp.requiredFields.length).toBeGreaterThan(0);
    expect(experience.errorLibrary.entries.map((entry) => entry.issueCode)).toEqual(
      expect.arrayContaining(["open_position"]),
    );
    expect(experience.privacyNotice.savedInThisFlow).toBe(false);
    expect(experience.copyAudit.passed).toBe(true);
  });

  it("describes decision capture and mobile QA as future-save client state", () => {
    const sample = preset("preset:row-repair");
    const experience = buildCsvDryRunImportExperience({
      csvText: sample.csvText,
      broker: sample.broker,
    });

    expect(experience.mobileQaPanel.items.length).toBeGreaterThanOrEqual(5);
    expect(
      experience.mobileQaPanel.items.some((item) =>
        item.id.includes("row_repair_table"),
      ),
    ).toBe(true);
    expect(experience.decisionCapture.items.map((item) => item.type)).toEqual(
      expect.arrayContaining(["edited_row", "deferred_import"]),
    );
    expect(
      experience.decisionCapture.items.every(
        (item) => item.persistenceStatus === "client_state_only",
      ),
    ).toBe(true);
  });
});
