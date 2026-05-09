import { describe, expect, it } from "vitest";
import {
  buildSyntheticMarketStructureCalibrationScenario,
  evaluateSyntheticMarketStructureCalibrationScenarios,
} from "../synthetic-market-structure-calibration-scenarios";

describe("synthetic market-structure calibration scenarios", () => {
  it("evaluates deterministic PASS / REVIEW / BLOCKER scenarios", () => {
    const evaluated = evaluateSyntheticMarketStructureCalibrationScenarios();
    const byId = Object.fromEntries(
      evaluated.map((scenario) => [scenario.id, scenario]),
    );

    expect(byId.clean_pass.evaluation.overallStatus).toBe("PASS");
    expect(byId.low_confidence_review.evaluation.overallStatus).toBe("REVIEW");
    expect(byId.provider_warning_review.evaluation.overallStatus).toBe(
      "REVIEW",
    );
    expect(byId.missing_structure_blocker.evaluation.overallStatus).toBe(
      "BLOCKER",
    );
    expect(byId.pattern_input_leak_blocker.evaluation.overallStatus).toBe(
      "BLOCKER",
    );
    expect(byId.failed_analysis_blocker.evaluation.overallStatus).toBe(
      "BLOCKER",
    );
  });

  it("keeps the harness explicit about synthetic data", () => {
    const scenario =
      buildSyntheticMarketStructureCalibrationScenario("clean_pass");

    expect(scenario.description).toContain("Clean shared-engine output");
    expect(scenario.audit.generatedAt).toBe("2026-05-02T00:00:00.000Z");
    expect(scenario.audit.records[0].symbol).toBe("ABCD");
  });
});
