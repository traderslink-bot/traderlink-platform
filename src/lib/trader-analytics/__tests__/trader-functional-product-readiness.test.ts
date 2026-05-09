import { describe, expect, it } from "vitest";
import {
  auditFunctionalTruthSources,
  buildCsvDryRunImportExperience,
  buildCsvDryRunPrototypeAnalysisPanel,
  buildFunctionalFeatureReadinessDashboard,
  buildImportConfidenceState,
  buildSavedAnalysisPrototypeFromDryRun,
  buildTraderFunctionalProductReadinessViewModel,
  evaluateSyntheticTraderPersonas,
  getCsvDryRunSamplePresets,
  runDeterministicExecutionMathFuzzScenarios,
  runRealDataCalibrationHarness,
  type TruthSourceClaim,
} from "../index";

function preset(id: string) {
  const found = getCsvDryRunSamplePresets().find(
    (candidate) => candidate.id === id,
  );

  if (!found) {
    throw new Error(`Missing preset ${id}`);
  }

  return found;
}

describe("Trader functional product readiness", () => {
  it("formalizes import confidence states from dry-run output", () => {
    const readyPreset = preset("preset:ibkr");
    const readyExperience = buildCsvDryRunImportExperience({
      csvText: readyPreset.csvText,
      broker: readyPreset.broker,
    });
    const blockedPreset = preset("preset:unknown-mapping");
    const blockedExperience = buildCsvDryRunImportExperience({
      csvText: blockedPreset.csvText,
      broker: blockedPreset.broker,
    });
    const reviewPreset = preset("preset:open-position");
    const reviewExperience = buildCsvDryRunImportExperience({
      csvText: reviewPreset.csvText,
      broker: reviewPreset.broker,
    });

    expect(buildImportConfidenceState(null)).toMatchObject({
      state: "empty",
      marketContextUsed: false,
    });
    expect(buildImportConfidenceState(readyExperience)).toMatchObject({
      state: "ready_for_analysis",
      severity: "ready",
      blockers: [],
      marketContextUsed: false,
    });
    expect(buildImportConfidenceState(blockedExperience)).toMatchObject({
      state: "blocked",
      severity: "blocked",
    });
    expect(buildImportConfidenceState(reviewExperience)).toMatchObject({
      state: "needs_review",
      severity: "review",
    });
    expect(
      buildImportConfidenceState(readyExperience, { afterPrototypeSave: true }),
    ).toMatchObject({
      state: "prototype_saved",
    });
  });

  it("builds a saved-analysis prototype from a ready import without production writes or exports", () => {
    const readyPreset = preset("preset:generic-short");
    const experience = buildCsvDryRunImportExperience({
      csvText: readyPreset.csvText,
      broker: readyPreset.broker,
    });
    const prototype = buildSavedAnalysisPrototypeFromDryRun({
      experience,
      generatedAt: "2026-05-03T18:00:00.000Z",
    });

    expect(prototype).toMatchObject({
      contractVersion: "saved_analysis_prototype_v1",
      analyticsReportStatus: "created",
      isPrototypeOnly: true,
      writesProductionDatabase: false,
      marketContextUsed: false,
      exportAvailable: false,
    });
    expect(prototype.generatedTradeIds).toHaveLength(1);
    expect(prototype.feedbackSummaryIds).toHaveLength(1);
    expect(prototype.analyticsReport?.sampleSize.completedTradeCount).toBe(1);
    expect(prototype.state.state).toBe("prototype_saved");
  });

  it("builds a dry-run prototype analysis panel without production writes", () => {
    const experience = buildCsvDryRunImportExperience({
      broker: "generic_execution_csv",
      csvText: [
        "Date,Time,Symbol,Side,Quantity,Price",
        "2026-05-01,09:30:00,ABCD,Buy,100,10.00",
        "2026-05-01,09:32:00,ABCD,Buy,100,9.50",
        "2026-05-01,09:34:00,ABCD,Buy,100,9.00",
        "2026-05-01,10:05:00,ABCD,Sell,300,8.75",
      ].join("\n"),
    });
    const panel = buildCsvDryRunPrototypeAnalysisPanel({
      experience,
      generatedAt: "2026-05-03T18:00:00.000Z",
    });

    expect(panel).toMatchObject({
      contractVersion: "csv_dry_run_prototype_analysis_panel_v1",
      state: "prototype_generated",
      canGeneratePrototype: true,
      prototypeGenerated: true,
      writesProductionDatabase: false,
      marketContextUsed: false,
      marketContextSource: "none",
      exportAvailable: false,
    });
    expect(panel.generatedTradeCount).toBe(1);
    expect(panel.feedbackSummaryCount).toBe(1);
    expect(panel.topAutopsyFindings.length).toBeGreaterThan(0);
    expect(panel.limitations.join(" ")).toContain("server-side trade-analysis");
  });

  it("keeps prototype analysis blocked when import rows are not repair-ready", () => {
    const blockedPreset = preset("preset:row-repair");
    const experience = buildCsvDryRunImportExperience({
      csvText: blockedPreset.csvText,
      broker: blockedPreset.broker,
    });
    const panel = buildCsvDryRunPrototypeAnalysisPanel({ experience });

    expect(panel.state).toBe("blocked");
    expect(panel.canGeneratePrototype).toBe(false);
    expect(panel.prototypeGenerated).toBe(false);
    expect(panel.generatedTradeCount).toBe(0);
    expect(panel.topImportBlockers.length).toBeGreaterThan(0);
    expect(panel.writesProductionDatabase).toBe(false);
  });

  it("surfaces precomputed daily/4h decision review facts when supplied", () => {
    const readyPreset = preset("preset:generic-short");
    const experience = buildCsvDryRunImportExperience({
      csvText: readyPreset.csvText,
      broker: readyPreset.broker,
    });
    const panel = buildCsvDryRunPrototypeAnalysisPanel({
      experience,
      decisionReviews: [
        {
          tradeId: "trade-1",
          coachingHeadline:
            "The trade was defined more by chasing than by entry discipline.",
          fixFirstBehaviorId: "chasing",
          marketContextSource: "levels_system_daily_4h",
          insights: [
            {
              id: "entry_near_daily_4h_resistance",
              tone: "risk",
              category: "market_context",
              title: "Entry was close to daily/4h resistance",
              summary:
                "The first entry started near a higher-timeframe resistance area.",
              evidence: ["distanceToResistance=1.2%"],
            },
          ],
        },
      ],
    });

    expect(panel.marketContextUsed).toBe(true);
    expect(panel.marketContextSource).toBe("levels_system_daily_4h");
    expect(panel.coachingHeadline).toContain("chasing");
    expect(panel.fixFirstBehaviorId).toBe("chasing");
    expect(panel.topDecisionReviewInsights[0]).toMatchObject({
      category: "market_context",
      title: "Entry was close to daily/4h resistance",
    });
    expect(panel.limitations.join(" ")).toContain("VWAP/EMA feedback remains disabled");
  });

  it("does not create analysis from blocked imports", () => {
    const blockedPreset = preset("preset:row-repair");
    const experience = buildCsvDryRunImportExperience({
      csvText: blockedPreset.csvText,
      broker: blockedPreset.broker,
    });
    const prototype = buildSavedAnalysisPrototypeFromDryRun({ experience });

    expect(prototype.preSaveState.state).toBe("blocked");
    expect(prototype.analyticsReportStatus).toBe("not_created");
    expect(prototype.generatedTradeIds).toEqual([]);
    expect(prototype.writesProductionDatabase).toBe(false);
  });

  it("adds execution-only autopsy evidence for a scale-in problem trade", () => {
    const experience = buildCsvDryRunImportExperience({
      broker: "generic_execution_csv",
      csvText: [
        "Date,Time,Symbol,Side,Quantity,Price",
        "2026-05-01,09:30:00,ABCD,Buy,100,10.00",
        "2026-05-01,09:32:00,ABCD,Buy,100,9.50",
        "2026-05-01,09:34:00,ABCD,Buy,100,9.00",
        "2026-05-01,09:36:00,ABCD,Buy,100,8.50",
        "2026-05-01,10:05:00,ABCD,Sell,400,8.25",
      ].join("\n"),
    });
    const prototype = buildSavedAnalysisPrototypeFromDryRun({ experience });
    const autopsy = prototype.autopsies[0];

    expect(autopsy.marketContextUsed).toBe(false);
    expect(autopsy.worstAdd).toMatchObject({
      tone: "risk",
      label: "Worst add",
    });
    expect(autopsy.positionSizeEscalationWarning).toMatchObject({
      tone: "risk",
    });
    expect(autopsy.problemAfterExecutionNumber).not.toBeNull();
    expect(
      autopsy.observations.every((observation) => observation.evidence.length > 0),
    ).toBe(true);
  });

  it("keeps synthetic trader personas deterministic and behavior-oriented", () => {
    const evaluations = evaluateSyntheticTraderPersonas();

    expect(evaluations).toHaveLength(6);
    expect(evaluations.every((evaluation) => evaluation.marketContextUsed === false)).toBe(
      true,
    );
    expect(evaluations.map((evaluation) => evaluation.personaId)).toEqual(
      expect.arrayContaining([
        "overtrader",
        "clean_scalper",
        "revenge_like_reentry_trader",
        "poor_exit_trader",
        "strong_risk_manager",
        "inconsistent_sizer",
      ]),
    );
    expect(evaluations.every((evaluation) => evaluation.matched)).toBe(true);
  });

  it("runs deterministic execution math fuzz scenarios", () => {
    const result = runDeterministicExecutionMathFuzzScenarios();

    expect(result.contractVersion).toBe("execution_math_deterministic_fuzz_v1");
    expect(result.allPassed).toBe(true);
    expect(result.failedCount).toBe(0);
    expect(result.scenarios.map((scenario) => scenario.id)).toEqual(
      expect.arrayContaining([
        "long_winner",
        "short_loser",
        "open_leftover",
        "invalid_exit_before_entry",
        "csv_rejected_rows_do_not_become_facts",
      ]),
    );
    expect(
      result.scenarios.find(
        (scenario) => scenario.id === "invalid_exit_before_entry",
      )?.status,
    ).toBe("validation_failed_as_expected");
  });

  it("audits truth-source evidence and blocks market-context overclaims", () => {
    const goodClaim: TruthSourceClaim = {
      id: "good",
      label: "Evidence-backed claim",
      strength: "strong",
      evidence: [
        {
          kind: "metric",
          id: "metric:test",
          label: "Metric evidence.",
          confidence: "high",
        },
      ],
      marketContextUsed: false,
    };
    const badClaims: TruthSourceClaim[] = [
      {
        id: "missing_evidence",
        label: "No evidence claim",
        strength: "strong",
        evidence: [],
        marketContextUsed: false,
      },
      {
        id: "market_context_claim",
        label: "Market context claim",
        strength: "strong",
        evidence: [goodClaim.evidence[0]],
        marketContextUsed: true,
      },
    ];

    expect(auditFunctionalTruthSources([goodClaim])).toMatchObject({
      passed: true,
      issueCount: 0,
    });
    expect(auditFunctionalTruthSources(badClaims)).toMatchObject({
      passed: false,
      issueCount: 2,
    });
  });

  it("builds a feature readiness dashboard that does not overclaim live readiness", () => {
    const dashboard = buildFunctionalFeatureReadinessDashboard();

    expect(dashboard.liveReadiness).toBe("not_live_ready");
    expect(dashboard.noExportPolicyMaintained).toBe(true);
    expect(dashboard.marketContextUsedForConclusions).toBe(false);
    expect(dashboard.items.map((item) => item.id)).toEqual(
      expect.arrayContaining([
        "csv_dry_run",
        "saved_analysis_prototype",
        "market_context_add_on",
        "auth_billing_persistence",
      ]),
    );
    expect(
      dashboard.items.find((item) => item.id === "auth_billing_persistence")
        ?.status,
    ).toBe("blocked_for_live");
  });

  it("runs the real-data calibration harness without live broker or candle calls", () => {
    const harness = runRealDataCalibrationHarness();

    expect(harness.contractVersion).toBe("real_data_calibration_harness_v1");
    expect(harness.source).toBe("synthetic_fixture");
    expect(harness.parseSucceeded).toBe(true);
    expect(harness.acceptedExecutionCount).toBeGreaterThan(0);
    expect(harness.savedAnalysisPrototypeReady).toBe(true);
    expect(harness.marketContextUsed).toBe(false);
    expect(harness.privacySafetyNotes.join(" ")).toContain("does not connect");
  });

  it("builds the full functional product readiness view model", () => {
    const viewModel = buildTraderFunctionalProductReadinessViewModel();

    expect(viewModel.contractVersion).toBe(
      "trader_functional_product_readiness_v1",
    );
    expect(viewModel.planFile).toBe(
      "src/docs/trader-functional-product-readiness-plan.md",
    );
    expect(viewModel.savedAnalysisPrototype.analyticsReportStatus).toBe(
      "created",
    );
    expect(viewModel.fuzzResult.allPassed).toBe(true);
    expect(viewModel.truthSourceAudit.passed).toBe(true);
    expect(viewModel.marketContextUsedForConclusions).toBe(false);
  });
});
