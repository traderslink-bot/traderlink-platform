import { describe, expect, it } from "vitest";
import {
  applyCsvDryRunCellEdit,
  buildCsvDryRunImportExperience,
  getCsvDryRunSamplePresets,
} from "../index";

function sample(id: string) {
  const preset = getCsvDryRunSamplePresets().find(
    (candidate) => candidate.id === id,
  );

  expect(preset).toBeTruthy();

  return preset!;
}

describe("trader import intelligence workflow expansion", () => {
  it("tracks before and after repair impact from a row edit baseline", () => {
    const preset = sample("preset:row-repair");
    const before = buildCsvDryRunImportExperience({
      csvText: preset.csvText,
      broker: preset.broker,
    });
    const repairedCsv = applyCsvDryRunCellEdit({
      csvText: preset.csvText,
      rowNumber: 2,
      header: "Symbol",
      value: "ABCD",
    });
    const after = buildCsvDryRunImportExperience({
      csvText: repairedCsv,
      broker: preset.broker,
      repairImpactBaseline: before.repairImpactDiff.currentSnapshot,
    });

    expect(after.repairImpactDiff.hasBaseline).toBe(true);
    expect(after.repairImpactDiff.delta.acceptedExecutions).toBe(1);
    expect(after.repairImpactDiff.delta.rejectedRows).toBe(1);
    expect(after.repairImpactDiff.currentSnapshot.rejectedRowCount).toBe(0);
  });

  it("splits import readiness into deterministic dimensions", () => {
    const preset = sample("preset:open-position");
    const experience = buildCsvDryRunImportExperience({
      csvText: preset.csvText,
      broker: preset.broker,
    });

    expect(experience.readinessScoreBreakdown.overallScore).toBeGreaterThanOrEqual(0);
    expect(experience.readinessScoreBreakdown.overallScore).toBeLessThanOrEqual(100);
    expect(experience.readinessScoreBreakdown.status).toBe("needs_review");
    expect(experience.readinessScoreBreakdown.dimensions.map((item) => item.id)).toEqual([
      "column_mapping",
      "row_validity",
      "grouping_confidence",
      "pnl_confidence",
      "duplicate_risk",
      "broker_support",
    ]);
  });

  it("builds a product P/L reconciliation assistant from broker net diagnostics", () => {
    const preset = sample("preset:schwab");
    const experience = buildCsvDryRunImportExperience({
      csvText: preset.csvText,
      broker: preset.broker,
    });

    expect(experience.pnlReconciliationAssistant.status).toBe("ready");
    expect(experience.pnlReconciliationAssistant.items[0]).toMatchObject({
      symbol: "AMD",
      status: "matched",
    });
    expect(experience.pnlReconciliationAssistant.items[0].explanation).toContain(
      "Broker net",
    );
  });

  it("previews post-import review queue items from repairs, grouping, feedback, and anomalies", () => {
    const preset = sample("preset:open-position");
    const experience = buildCsvDryRunImportExperience({
      csvText: preset.csvText,
      broker: preset.broker,
    });

    expect(experience.postImportReviewQueuePreview.totalCount).toBeGreaterThan(0);
    expect(experience.postImportReviewQueuePreview.items.map((item) => item.lane)).toEqual(
      expect.arrayContaining(["grouping", "anomaly", "feedback"]),
    );
    expect(experience.postImportReviewQueuePreview.items[0].priority).toBeGreaterThanOrEqual(
      experience.postImportReviewQueuePreview.items.at(-1)!.priority,
    );
  });

  it("summarizes feedback preview comparisons without market context", () => {
    const preset = sample("preset:ibkr");
    const experience = buildCsvDryRunImportExperience({
      csvText: preset.csvText,
      broker: preset.broker,
    });

    expect(experience.feedbackComparison.marketContextUsed).toBe(false);
    expect(experience.feedbackComparison.bestPreviewTrade?.tradeLabel).toContain("AAPL");
    expect(experience.feedbackComparison.worstPreviewTrade?.tradeLabel).toContain("AAPL");
    expect(experience.feedbackComparison.limitation).toContain("execution-only");
  });

  it("flags unknown header shapes in the broker mapping learning console", () => {
    const preset = sample("preset:unknown-mapping");
    const experience = buildCsvDryRunImportExperience({
      csvText: preset.csvText,
      broker: preset.broker,
    });

    expect(experience.brokerMappingLearningConsole.learningUrgency).toBe("high");
    expect(experience.brokerMappingLearningConsole.missingRequiredFields).toEqual(
      expect.arrayContaining(["symbol"]),
    );
    expect(experience.brokerMappingLearningConsole.persistenceStatus).toBe("not_saved");
  });

  it("detects execution/import anomalies using execution-only evidence", () => {
    const preset = sample("preset:open-position");
    const experience = buildCsvDryRunImportExperience({
      csvText: preset.csvText,
      broker: preset.broker,
    });

    expect(experience.executionAnomalyDetector.marketContextUsed).toBe(false);
    expect(experience.executionAnomalyDetector.items.map((item) => item.type)).toEqual(
      expect.arrayContaining(["open_leftover"]),
    );
  });

  it("captures setup tags as client-state-only user labels", () => {
    const preset = sample("preset:ibkr");
    const experience = buildCsvDryRunImportExperience({
      csvText: preset.csvText,
      broker: preset.broker,
      setupTagSelections: {
        0: "momentum",
      },
    });

    expect(experience.setupTagging.marketValidated).toBe(false);
    expect(experience.setupTagging.items[0]).toMatchObject({
      selectedTag: "momentum",
      persistenceStatus: "client_state_only",
    });
    expect(experience.decisionCapture.items.map((item) => item.type)).toEqual(
      expect.arrayContaining(["selected_setup_tag"]),
    );
  });

  it("builds a finished import session summary for ready dry runs", () => {
    const preset = sample("preset:ibkr");
    const experience = buildCsvDryRunImportExperience({
      csvText: preset.csvText,
      broker: preset.broker,
    });

    expect(experience.importSessionSummary.status).toBe("ready");
    expect(experience.importSessionSummary.feedbackPreviewCount).toBe(1);
    expect(experience.importSessionSummary.summary).toContain("ready");
  });
});
