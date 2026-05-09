import { describe, expect, it } from "vitest";
import {
  auditTraderIntelligenceNoExportPolicy,
  buildImportFacingRouteContract,
  buildGuidedDataRepairWizard,
  buildImportTrialHarness,
  buildProductCopyQualitySystem,
  buildProductTraderAnalyticsViewModel,
  buildSampleSavedTraderAnalyticsData,
  buildTraderImportTrialExperienceViewModel,
  buildTraderIntelligenceRouteRegistry,
} from "../index";

function buildAnalytics() {
  const sample = buildSampleSavedTraderAnalyticsData();

  return buildProductTraderAnalyticsViewModel({
    repository: sample.repository,
    userId: sample.userId,
    importRequests: sample.importRequests,
  });
}

describe("trader import trial and repair experience", () => {
  it("builds a synthetic broker fixture harness for required brokers", () => {
    const harness = buildImportTrialHarness();
    const brokers = harness.fixtures.map((fixture) => fixture.broker);

    expect(harness.fixtureStrategy).toContain("Synthetic");
    expect(brokers).toEqual(
      expect.arrayContaining([
        "ibkr_activity_statement",
        "moomoo_trade_history",
        "webull_order_history",
        "robinhood_transaction_history",
        "schwab_transactions",
        "generic_execution_csv",
      ]),
    );
    expect(harness.totalCount).toBeGreaterThanOrEqual(10);
    expect(harness.passCount).toBeGreaterThan(0);
    expect(harness.blockedCount).toBeGreaterThan(0);
    expect(
      harness.results.every(
        (result) =>
          result.acceptedExecutionCount >= 0 &&
          result.qualityScore >= 0 &&
          result.qualityScore <= 100 &&
          result.evidence.length > 0,
      ),
    ).toBe(true);
  });

  it("prioritizes guided repair blockers before review-only items", () => {
    const wizard = buildGuidedDataRepairWizard(buildImportTrialHarness());

    expect(wizard.syntheticFixtureMode).toBe(true);
    expect(wizard.status).toBe("blocked");
    expect(wizard.blockerCount).toBeGreaterThan(0);
    expect(wizard.steps[0]?.severity).toBe("blocker");
    expect(wizard.steps.map((step) => step.issueCode)).toEqual(
      expect.arrayContaining([
        "row_missing_symbol",
        "options_row_rejected",
        "pnl_reconciliation_mismatch",
      ]),
    );
    expect(
      wizard.steps.every((step) => !step.repairAction.toLowerCase().includes("download")),
    ).toBe(true);
  });

  it("adds the import trial experience to the product analytics view model", () => {
    const analytics = buildAnalytics();
    const experience = analytics.importTrialExperience;

    expect(experience.source).toBe("synthetic_fixture_trial");
    expect(experience.marketContextUsedForConclusions).toBe(false);
    expect(experience.reviewCockpit.marketContextUsedForPriority).toBe(false);
    expect(experience.reviewCockpit.primaryAction?.href.startsWith("/")).toBe(true);
    expect(
      experience.reviewCockpit.actions.every(
        (action) => action.href.startsWith("/") && !action.href.startsWith("//"),
      ),
    ).toBe(true);
  });

  it("simulates rule lifecycle without persistence or alternate P/L claims", () => {
    const experience = buildAnalytics().importTrialExperience;

    expect(experience.ruleLifecycleSimulation.totalCount).toBeGreaterThan(0);
    expect(
      experience.ruleLifecycleSimulation.items.every(
        (item) =>
          item.stages.includes("draft") &&
          item.stages.includes("measured") &&
          item.limitation.includes("does not save") &&
          item.limitation.includes("alternate P/L"),
      ),
    ).toBe(true);
  });

  it("defines replay visual markers and lanes that do not require market context", () => {
    const replay = buildAnalytics().importTrialExperience.replayVisualUpgrade;

    expect(replay.marketContextRequired).toBe(false);
    expect(replay.markers.map((marker) => marker.role)).toEqual(
      expect.arrayContaining([
        "initial_entry",
        "add",
        "trim",
        "full_exit",
        "readd",
        "open_leftover",
      ]),
    );
    expect(replay.lanes.every((lane) => lane.canRenderWithCss)).toBe(true);
  });

  it("audits product copy for unsafe product claims and no-export policy", () => {
    const experience = buildAnalytics().importTrialExperience;

    expect(experience.copyQuality.passed).toBe(true);

    const unsafe = buildProductCopyQualitySystem({
      texts: [
        {
          sourceId: "unsafe",
          text: "Download the raw JSON export because this guaranteed broker support.",
        },
      ],
    });

    expect(unsafe.passed).toBe(false);
    expect(unsafe.issues.map((issue) => issue.phrase)).toEqual(
      expect.arrayContaining(["download", "raw json", "export", "guaranteed"]),
    );
  });

  it("summarizes fixture coverage honestly", () => {
    const library = buildAnalytics().importTrialExperience.fixtureLibrary;

    expect(library.totalBrokers).toBeGreaterThanOrEqual(10);
    expect(library.unsupportedBrokerCopy).toContain("generic execution CSV");
    expect(
      library.brokers.some(
        (broker) =>
          broker.broker === "generic_execution_csv" &&
          broker.coverage.shortTrade,
      ),
    ).toBe(true);
    expect(
      library.brokers.every((broker) =>
        broker.limitation.toLowerCase().includes("synthetic") ||
        broker.limitation.toLowerCase().includes("generic"),
      ),
    ).toBe(true);
  });

  it("creates mobile QA, why explanations, and waiting calibration state", () => {
    const experience = buildAnalytics().importTrialExperience;

    expect(experience.mobileQa.items.map((item) => item.route)).toEqual(
      expect.arrayContaining([
        "/import-trials",
        "/repair-wizard",
        "/review-cockpit",
        "/calibration",
      ]),
    );
    expect(experience.mobileQa.noExportRouteCount).toBe(
      experience.mobileQa.totalRoutes,
    );
    expect(experience.whyLayer.totalCount).toBeGreaterThanOrEqual(5);
    expect(
      experience.whyLayer.explanations.every((item) => item.limitation.length > 0),
    ).toBe(true);
    expect(experience.calibrationDashboard.status).toBe(
      "waiting_for_real_imports",
    );
    expect(experience.calibrationDashboard.marketContextUsedForCalibration).toBe(
      false,
    );
    expect(experience.calibrationDashboard.realImportCount).toBe(0);
  });

  it("keeps new routes registered under the no-export route policy", () => {
    const routes = buildTraderIntelligenceRouteRegistry();
    const audit = auditTraderIntelligenceNoExportPolicy({ routes });

    expect(routes.map((route) => route.standalonePath)).toEqual(
      expect.arrayContaining([
        "/import-trials",
        "/repair-wizard",
        "/review-cockpit",
        "/calibration",
      ]),
    );
    expect(audit.passed).toBe(true);
    expect(
      routes
        .filter((route) => route.audience === "end_user")
        .every((route) => !route.allowsRawJson && !route.allowsExport),
    ).toBe(true);
  });

  it("defines a shared import-facing route safety contract", () => {
    const contract = buildImportFacingRouteContract();
    const routes = buildTraderIntelligenceRouteRegistry();

    expect(contract.contractVersion).toBe("import_facing_route_contract_v1");
    expect(contract.routes.map((route) => route.path)).toEqual(
      expect.arrayContaining([
        "/import-dry-run",
        "/imports",
        "/import-health",
        "/import-trials",
        "/repair-wizard",
        "/review-cockpit",
        "/calibration",
      ]),
    );
    expect(
      contract.routes.every((route) => {
        const registered = routes.find(
          (candidate) => candidate.routeId === route.routeId,
        );

        return (
          registered?.standalonePath === route.path &&
          registered.audience === "end_user" &&
          !registered.allowsRawJson &&
          !registered.allowsExport &&
          route.requiredCapabilities.includes("write_safety") &&
          route.requiredCapabilities.includes("gross_only_cost_policy") &&
          route.requiredCapabilities.includes("no_export_boundary") &&
          route.requiredText.length >= 2
        );
      }),
    ).toBe(true);
    expect(contract.bannedSurfacePhrases).toEqual(
      expect.arrayContaining(["Raw JSON", "Export CSV", "Guaranteed broker support"]),
    );
  });

  it("exposes the pure experience builder for route-level use", () => {
    const analytics = buildAnalytics();
    const rebuilt = buildTraderImportTrialExperienceViewModel({
      analytics,
    });

    expect(rebuilt.harness.totalCount).toBe(
      analytics.importTrialExperience.harness.totalCount,
    );
    expect(rebuilt.reviewCockpit.actions.length).toBeGreaterThan(0);
  });
});
