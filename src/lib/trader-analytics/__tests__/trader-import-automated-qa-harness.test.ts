import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildCsvDryRunAutomatedQaHarness,
  buildCsvDryRunRouteSmokeContract,
  buildCsvDryRunVisualRegressionContract,
  buildProductCopyQualitySystem,
  runCsvDryRunBrokerRegressionMatrix,
  runCsvDryRunEndToEndWorkflowSimulation,
  runCsvDryRunMutationQaMatrix,
  runCsvDryRunRepairImpactSimulation,
} from "../index";

const routeSourcePath = join(
  process.cwd(),
  "app/intelligence/import-dry-run/import-dry-run-client.tsx",
);

describe("CSV dry-run automated QA harness", () => {
  it("passes deterministic CSV mutation cases", () => {
    const results = runCsvDryRunMutationQaMatrix();

    expect(results).toHaveLength(9);
    expect(results.map((result) => result.mutationKind)).toEqual(
      expect.arrayContaining([
        "missing_symbol",
        "missing_price",
        "renamed_headers",
        "blank_rows",
        "account_activity_row",
        "cancelled_order",
        "duplicated_fill",
        "open_position",
        "weird_timestamp",
      ]),
    );
    expect(results.every((result) => result.status === "pass")).toBe(true);
  });

  it("passes broker format regression matrix coverage", () => {
    const results = runCsvDryRunBrokerRegressionMatrix();

    expect(results).toHaveLength(6);
    expect(results.map((result) => result.broker)).toEqual(
      expect.arrayContaining([
        "ibkr_activity_statement",
        "webull_order_history",
        "robinhood_transaction_history",
        "moomoo_trade_history",
        "schwab_transactions",
        "generic_execution_csv",
      ]),
    );
    expect(results.every((result) => result.status === "pass")).toBe(true);
  });

  it("simulates row repair impact without a browser", () => {
    const simulation = runCsvDryRunRepairImpactSimulation();

    expect(simulation.status).toBe("pass");
    expect(simulation.acceptedExecutionDelta).toBeGreaterThan(0);
    expect(simulation.rejectedRowDelta).toBeGreaterThan(0);
    expect(simulation.confidenceScoreDelta).toBeGreaterThanOrEqual(0);
    expect(simulation.after.reviewQueueLanes).toEqual(
      expect.arrayContaining(["ready"]),
    );
  });

  it("simulates the rough end-to-end dry-run workflow", () => {
    const simulation = runCsvDryRunEndToEndWorkflowSimulation();

    expect(simulation.status).toBe("pass");
    expect(simulation.steps.every((step) => step.passed)).toBe(true);
    expect(
      simulation.finalExperience.decisionCapture.items.map((item) => item.type),
    ).toEqual(expect.arrayContaining(["selected_setup_tag"]));
    expect(simulation.finalExperience.importSessionSummary.status).toBe("ready");
  });

  it("keeps automated import QA independent from market context", () => {
    const harness = buildCsvDryRunAutomatedQaHarness();

    expect(harness.marketContextUsed).toBe(false);
    expect(harness.endToEndSimulation.finalExperience.marketContextUsedForConclusions).toBe(
      false,
    );
    expect(
      harness.endToEndSimulation.finalExperience.executionFeedbackPreview
        .marketContextUsed,
    ).toBe(false);
    expect(
      harness.endToEndSimulation.finalExperience.executionAnomalyDetector
        .marketContextUsed,
    ).toBe(false);
    expect(
      harness.endToEndSimulation.finalExperience.setupTagging.marketValidated,
    ).toBe(false);
  });

  it("protects route smoke contract panels and banned surface copy", () => {
    const contract = buildCsvDryRunRouteSmokeContract();
    const source = readFileSync(routeSourcePath, "utf8");

    expect(contract.routePath).toBe("/intelligence/import-dry-run");
    expect(contract.requiredPanelLabels.length).toBeGreaterThanOrEqual(12);
    for (const label of contract.requiredPanelLabels) {
      expect(source, `Missing route panel: ${label}`).toContain(label);
    }
    for (const phrase of contract.bannedSurfacePhrases) {
      expect(source, `Banned route phrase found: ${phrase}`).not.toContain(phrase);
    }
  });

  it("expands copy safety auditing for unsafe import product claims", () => {
    const audit = buildProductCopyQualitySystem({
      texts: [
        {
          sourceId: "unsafe-guarantee",
          text: "Guaranteed certified broker support with raw JSON export and final market-structure setup scoring.",
        },
      ],
    });

    expect(audit.passed).toBe(false);
    expect(audit.issues.map((issue) => issue.phrase)).toEqual(
      expect.arrayContaining([
        "guaranteed",
        "certified broker support",
        "raw json",
        "export",
      ]),
    );
  });

  it("builds a screenshot-ready visual regression contract", () => {
    const routeContract = buildCsvDryRunRouteSmokeContract();
    const visual = buildCsvDryRunVisualRegressionContract();
    const source = readFileSync(routeSourcePath, "utf8");

    expect(visual.screenshotDependency).toBe("playwright_chromium");
    expect(visual.targets.map((target) => target.viewport)).toEqual([
      "desktop",
      "tablet",
      "mobile",
    ]);
    for (const target of visual.targets) {
      expect(target.routePath).toBe("/intelligence/import-dry-run");
      expect(target.requiredPanelLabels).toEqual(routeContract.requiredPanelLabels);
      expect(target.width).toBeGreaterThan(0);
      expect(target.height).toBeGreaterThan(0);
    }
    for (const label of routeContract.requiredPanelLabels) {
      expect(source).toContain(label);
    }
  });
});
