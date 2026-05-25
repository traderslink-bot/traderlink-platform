import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  auditTraderIntelligenceNoExportPolicy,
  buildBrokerCsvRegressionFixtureHarness,
  buildDemoTraderIntelligencePlatformContext,
  buildTraderIntelligenceFeatureReadinessChecklist,
  buildTraderIntelligenceModuleReadinessViewModel,
  buildTraderIntelligenceRouteAccess,
  buildTraderIntelligenceRouteRegistry,
  buildTraderIntelligenceVisualQaChecklist,
  evaluateTraderIntelligenceFeatureGate,
  getBrokerCsvRegressionFixtureExpectations,
} from "../index";

function fixtureContentsByFile(): Record<string, string> {
  return Object.fromEntries(
    getBrokerCsvRegressionFixtureExpectations().map((expectation) => [
      expectation.fixtureFile,
      readFileSync(
        join(
          process.cwd(),
          "src/docs/trade-execution-import-fixtures",
          expectation.fixtureFile,
        ),
        "utf8",
      ),
    ]),
  );
}

describe("platform-ready Trader Intelligence module", () => {
  it("builds a demo platform context without real auth or billing", () => {
    const context = buildDemoTraderIntelligencePlatformContext({
      moduleMountPath: "/intelligence",
    });

    expect(context).toMatchObject({
      contractVersion: "trader_intelligence_platform_context_v1",
      platformUserId: "demo-platform-user",
      workspaceId: "demo-workspace",
      accountId: "demo-trading-account",
      environment: "standalone_demo",
      demoMode: true,
    });
    expect(context.entitlements.canImportCsv).toBe(true);
    expect(context.moduleMountPath).toBe("/intelligence");
  });

  it("evaluates feature gates for plan limits and admin-only surfaces", () => {
    const starter = buildDemoTraderIntelligencePlatformContext({
      planTier: "starter",
      role: "owner",
    });
    const admin = buildDemoTraderIntelligencePlatformContext({
      planTier: "internal",
      role: "admin",
    });

    expect(
      evaluateTraderIntelligenceFeatureGate({
        context: starter,
        featureKey: "import_health",
      }),
    ).toMatchObject({
      allowed: false,
      state: "locked",
    });
    expect(
      evaluateTraderIntelligenceFeatureGate({
        context: starter,
        featureKey: "csv_imports",
        usage: { csv_imports: starter.entitlements.monthlyImportLimit },
      }),
    ).toMatchObject({
      allowed: false,
      state: "usage_limited",
    });
    expect(
      evaluateTraderIntelligenceFeatureGate({
        context: starter,
        featureKey: "broker_mapping_admin",
      }),
    ).toMatchObject({
      allowed: false,
      state: "admin_only",
    });
    expect(
      evaluateTraderIntelligenceFeatureGate({
        context: admin,
        featureKey: "broker_mapping_admin",
      }),
    ).toMatchObject({
      allowed: true,
      state: "available",
    });
  });

  it("builds a platform-aware route registry and no-export audit", () => {
    const context = buildDemoTraderIntelligencePlatformContext({
      moduleMountPath: "/intelligence",
    });
    const routes = buildTraderIntelligenceRouteRegistry(context);
    const audit = auditTraderIntelligenceNoExportPolicy({ routes });
    const analytics = routes.find((route) => route.routeId === "analytics");
    const imports = routes.find((route) => route.routeId === "imports");
    const admin = routes.find(
      (route) => route.routeId === "broker_mapping_admin",
    );

    expect(analytics?.platformPath).toBe("/intelligence/analytics");
    expect(imports?.platformPath).toBe("/intelligence/imports");
    expect(admin).toMatchObject({
      requiresAdmin: true,
      audience: "admin",
      allowsExport: false,
    });
    expect(routes.every((route) => route.allowsExport === false)).toBe(true);
    expect(audit).toMatchObject({
      passed: true,
      endUserExportViolations: [],
      endUserRawJsonViolations: [],
      missingImplementedRoutePolicies: [],
    });
  });

  it("builds route access visibility from context and entitlements", () => {
    const userContext = buildDemoTraderIntelligencePlatformContext({
      planTier: "pro",
      role: "owner",
    });
    const adminContext = buildDemoTraderIntelligencePlatformContext({
      planTier: "internal",
      role: "admin",
    });
    const userAccess = buildTraderIntelligenceRouteAccess({
      context: userContext,
    });
    const adminAccess = buildTraderIntelligenceRouteAccess({
      context: adminContext,
    });

    expect(
      userAccess.find((item) => item.route.routeId === "broker_mapping_admin")
        ?.visibleInNavigation,
    ).toBe(false);
    expect(
      adminAccess.find((item) => item.route.routeId === "broker_mapping_admin")
        ?.visibleInNavigation,
    ).toBe(true);
    expect(
      userAccess.find((item) => item.route.routeId === "analytics")?.gate.allowed,
    ).toBe(true);
  });

  it("builds feature and visual QA readiness checklists", () => {
    const readiness = buildTraderIntelligenceFeatureReadinessChecklist();
    const visualQa = buildTraderIntelligenceVisualQaChecklist();

    expect(readiness.map((item) => item.id)).toEqual(
      expect.arrayContaining([
        "platform_context",
        "entitlements",
        "imports",
        "analytics_dashboard",
        "no_export",
      ]),
    );
    expect(
      readiness.some(
        (item) => item.id === "storage" && item.status === "partial",
      ),
    ).toBe(true);
    expect(visualQa.length).toBeGreaterThan(0);
    expect(visualQa.every((item) => item.status === "pending")).toBe(true);
  });

  it("runs the broker CSV regression fixture harness", () => {
    const harness = buildBrokerCsvRegressionFixtureHarness({
      fixtureContentsByFile: fixtureContentsByFile(),
    });

    expect(harness.totalCount).toBeGreaterThan(0);
    expect(harness.failedCount).toBe(0);
    expect(harness.passedCount).toBe(harness.totalCount);
    expect(
      harness.results.every(
        (result) =>
          result.parsedAcceptedExecutions === result.expectedAcceptedExecutions &&
          result.parsedGroupedTrades === result.expectedGroupedTrades,
      ),
    ).toBe(true);
  });

  it("builds the full module readiness view model", () => {
    const readiness = buildTraderIntelligenceModuleReadinessViewModel({
      fixtureContentsByFile: fixtureContentsByFile(),
    });

    expect(readiness.summary).toContain("platform-ready");
    expect(readiness.noExportAudit.passed).toBe(true);
    expect(readiness.brokerFixtureHarness.failedCount).toBe(0);
    expect(readiness.routeSmokeTargets).toEqual(
      expect.arrayContaining([
        "/platform-readiness",
        "/intelligence/analytics",
        "/intelligence/imports",
        "/intelligence/trades/trade-rapid-fire",
      ]),
    );
    expect(readiness.workflow.analytics.latestReport.sampleData).toBe(true);
  });
});
