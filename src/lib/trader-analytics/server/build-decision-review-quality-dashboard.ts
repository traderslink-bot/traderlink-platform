import type { DecisionReviewCsvScenario } from "../__fixtures__/decision-review-csv-scenarios";
import type { CsvDryRunPrototypeDecisionReviewInput } from "../product/functional-readiness";
import { buildCsvDryRunDecisionReviewBridge } from "./build-csv-dry-run-decision-review-bridge";

export type DecisionReviewQualityScenarioStatus = "pass" | "review" | "fail";

export interface DecisionReviewQualityScenarioResult {
  id: string;
  label: string;
  status: DecisionReviewQualityScenarioStatus;
  expectedImportStatus: DecisionReviewCsvScenario["expectedImportStatus"];
  actualImportStatus: string;
  expectedCompletedReviewCount: number;
  actualCompletedReviewCount: number;
  expectedInsightIds: string[];
  actualInsightIds: string[];
  missingInsightIds: string[];
  expectedMarketContextSource: DecisionReviewCsvScenario["expectedMarketContextSource"];
  actualMarketContextSource: string | null;
  missingExpectedDiagnosticCodes: string[];
  missingRequiredHeadlineFragments: string[];
  missingRequiredTitleFragments: string[];
  missingRequiredEvidenceFragments: string[];
  forbiddenTextFragmentsFound: string[];
  contradictoryInsightPairsFound: string[];
  genericHeadlineFragmentsFound: string[];
  staleHeadlineFragmentsFound: string[];
  coachingHeadline: string | null;
  diagnostics: string[];
}

export interface DecisionReviewQualityDashboard {
  contractVersion: "decision_review_quality_dashboard_v1";
  generatedAt: string;
  realCsvCalibrationStatus: "waiting_for_anonymized_real_csvs";
  scenarioCount: number;
  passCount: number;
  reviewCount: number;
  failCount: number;
  status: DecisionReviewQualityScenarioStatus;
  scenarios: DecisionReviewQualityScenarioResult[];
  recommendedNextAction: string;
}

const DEFAULT_FORBIDDEN_TEXT_FRAGMENTS = ["vwap", "ema"];
const GENERIC_HEADLINE_FRAGMENTS = [
  "did not produce a strong enough destructive behavior signal",
];
const CONTEXT_SENSITIVE_HEADLINE_RULES = [
  {
    fragment: "adds were aligned with strength rather than weakness",
    requiredInsightId: "adds_aligned_with_strength",
  },
  {
    fragment: "exited winner potential too early",
    requiredInsightId: "exit_left_continuation",
  },
] as const;
const CONTRADICTORY_INSIGHT_PAIRS: Array<readonly [string, string]> = [
  ["entry_near_daily_4h_support", "entry_far_from_daily_4h_support"],
];

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function reviewText(review: CsvDryRunPrototypeDecisionReviewInput | null): string {
  if (review === null) {
    return "";
  }

  return [
    review.coachingHeadline,
    review.fixFirstBehaviorId,
    review.marketContextSource,
    ...review.insights.flatMap((insight) => [
      insight.id,
      insight.category,
      insight.tone,
      insight.title,
      insight.summary,
      ...(insight.evidence ?? []),
    ]),
  ]
    .filter((value): value is string => typeof value === "string")
    .join("\n");
}

function containsForbiddenText(text: string, fragment: string): boolean {
  const pattern = new RegExp(`\\b${escapeRegExp(fragment)}\\b`, "i");

  return pattern.test(text);
}

function includesFragment(text: string, fragment: string): boolean {
  return text.toLowerCase().includes(fragment.toLowerCase());
}

function scenarioStatus(args: {
  importStatusMatches: boolean;
  completedReviewCountMatches: boolean;
  missingInsightIds: string[];
  marketContextMatches: boolean;
  missingExpectedDiagnosticCodes: string[];
  missingRequiredHeadlineFragments: string[];
  missingRequiredTitleFragments: string[];
  missingRequiredEvidenceFragments: string[];
  forbiddenTextFragmentsFound: string[];
  contradictoryInsightPairsFound: string[];
  genericHeadlineFragmentsFound: string[];
  staleHeadlineFragmentsFound: string[];
  hasReview: boolean;
}): DecisionReviewQualityScenarioStatus {
  if (
    !args.importStatusMatches ||
    !args.completedReviewCountMatches ||
    (!args.hasReview && args.missingInsightIds.length > 0) ||
    args.missingInsightIds.length > 0 ||
    !args.marketContextMatches ||
    args.missingExpectedDiagnosticCodes.length > 0 ||
    args.missingRequiredHeadlineFragments.length > 0 ||
    args.missingRequiredTitleFragments.length > 0 ||
    args.missingRequiredEvidenceFragments.length > 0 ||
    args.forbiddenTextFragmentsFound.length > 0 ||
    args.contradictoryInsightPairsFound.length > 0 ||
    args.genericHeadlineFragmentsFound.length > 0 ||
    args.staleHeadlineFragmentsFound.length > 0
  ) {
    return "fail";
  }

  return "pass";
}

function dashboardStatus(
  results: DecisionReviewQualityScenarioResult[],
): DecisionReviewQualityScenarioStatus {
  if (results.some((scenario) => scenario.status === "fail")) {
    return "fail";
  }

  if (results.some((scenario) => scenario.status === "review")) {
    return "review";
  }

  return "pass";
}

function recommendedNextAction(
  status: DecisionReviewQualityScenarioStatus,
): string {
  if (status === "fail") {
    return "Fix failing deterministic review scenarios before calibrating with real CSVs.";
  }

  if (status === "review") {
    return "Inspect review scenarios marked for review, then add anonymized real CSV examples.";
  }

  return "Synthetic decision-review scenarios pass; next collect anonymized real CSV examples before promoting this beyond dry-run.";
}

async function evaluateScenario(
  scenario: DecisionReviewCsvScenario,
  generatedAt: string,
): Promise<DecisionReviewQualityScenarioResult> {
  const bridge = await buildCsvDryRunDecisionReviewBridge({
    csvText: scenario.csvText,
    broker: scenario.broker,
    levelsSystem: scenario.levelsSystem,
    generatedAt,
  });
  const review = bridge.decisionReviews[0] ?? null;
  const expectedCompletedReviewCount = scenario.expectedCompletedReviewCount ?? 1;
  const text = reviewText(review);
  const evidenceText = review?.insights
    .flatMap((insight) => insight.evidence ?? [])
    .join("\n") ?? "";
  const titleText = review?.insights
    .map((insight) => insight.title)
    .join("\n") ?? "";
  const actualInsightIds = review?.insights.map((insight) => insight.id) ?? [];
  const contradictoryInsightPairsFound = CONTRADICTORY_INSIGHT_PAIRS
    .filter(([left, right]) =>
      actualInsightIds.includes(left) && actualInsightIds.includes(right),
    )
    .map(([left, right]) => `${left}+${right}`);
  const headline = review?.coachingHeadline ?? null;
  const genericHeadlineFragmentsFound = headline
    ? GENERIC_HEADLINE_FRAGMENTS.filter((fragment) =>
        includesFragment(headline, fragment),
      )
    : [];
  const staleHeadlineFragmentsFound = headline
    ? CONTEXT_SENSITIVE_HEADLINE_RULES.filter(
        (rule) =>
          includesFragment(headline, rule.fragment) &&
          !actualInsightIds.includes(rule.requiredInsightId),
      ).map((rule) => rule.fragment)
    : [];
  const missingInsightIds = scenario.expectedInsightIds.filter(
    (expectedId) => !actualInsightIds.includes(expectedId),
  );
  const actualDiagnosticCodes: string[] = bridge.diagnostics.map(
    (diagnostic) => diagnostic.code,
  );
  const missingExpectedDiagnosticCodes =
    scenario.expectedDiagnosticCodes?.filter(
      (expectedCode) => !actualDiagnosticCodes.includes(expectedCode),
    ) ?? [];
  const forbiddenFragments = [
    ...DEFAULT_FORBIDDEN_TEXT_FRAGMENTS,
    ...(scenario.forbiddenTextFragments ?? []),
  ];
  const forbiddenTextFragmentsFound = unique(
    forbiddenFragments.filter((fragment) => containsForbiddenText(text, fragment)),
  );
  const missingRequiredHeadlineFragments =
    scenario.requiredHeadlineFragments?.filter(
      (fragment) => !includesFragment(headline ?? "", fragment),
    ) ?? [];
  const missingRequiredTitleFragments =
    scenario.requiredTitleFragments?.filter(
      (fragment) => !includesFragment(titleText, fragment),
    ) ?? [];
  const missingRequiredEvidenceFragments =
    scenario.requiredEvidenceFragments?.filter(
      (fragment) => !includesFragment(evidenceText, fragment),
    ) ?? [];
  const expectedImportStatus = scenario.expectedImportStatus ?? "ready";
  const importStatusMatches = bridge.importStatus === expectedImportStatus;
  const completedReviewCountMatches =
    bridge.completedReviewCount === expectedCompletedReviewCount;
  const marketContextMatches =
    (review?.marketContextSource ?? null) === scenario.expectedMarketContextSource;
  const status = scenarioStatus({
    importStatusMatches,
    completedReviewCountMatches,
    missingInsightIds,
    marketContextMatches,
    missingExpectedDiagnosticCodes,
    missingRequiredHeadlineFragments,
    missingRequiredTitleFragments,
    missingRequiredEvidenceFragments,
    forbiddenTextFragmentsFound,
    contradictoryInsightPairsFound,
    genericHeadlineFragmentsFound,
    staleHeadlineFragmentsFound,
    hasReview: review !== null,
  });

  return {
    id: scenario.id,
    label: scenario.label,
    status,
    expectedImportStatus: scenario.expectedImportStatus,
    actualImportStatus: bridge.importStatus,
    expectedCompletedReviewCount,
    actualCompletedReviewCount: bridge.completedReviewCount,
    expectedInsightIds: scenario.expectedInsightIds,
    actualInsightIds,
    missingInsightIds,
    expectedMarketContextSource: scenario.expectedMarketContextSource,
    actualMarketContextSource: review?.marketContextSource ?? null,
    missingExpectedDiagnosticCodes,
    missingRequiredHeadlineFragments,
    missingRequiredTitleFragments,
    missingRequiredEvidenceFragments,
    forbiddenTextFragmentsFound,
    contradictoryInsightPairsFound,
    genericHeadlineFragmentsFound,
    staleHeadlineFragmentsFound,
    coachingHeadline: headline,
    diagnostics: bridge.diagnostics.map((diagnostic) => diagnostic.message),
  };
}

export async function buildDecisionReviewQualityDashboard(args: {
  scenarios: DecisionReviewCsvScenario[];
  generatedAt?: string;
}): Promise<DecisionReviewQualityDashboard> {
  const generatedAt = args.generatedAt ?? new Date().toISOString();
  const scenarios = await Promise.all(
    args.scenarios.map((scenario) => evaluateScenario(scenario, generatedAt)),
  );
  const status = dashboardStatus(scenarios);

  return {
    contractVersion: "decision_review_quality_dashboard_v1",
    generatedAt,
    realCsvCalibrationStatus: "waiting_for_anonymized_real_csvs",
    scenarioCount: scenarios.length,
    passCount: scenarios.filter((scenario) => scenario.status === "pass").length,
    reviewCount: scenarios.filter((scenario) => scenario.status === "review").length,
    failCount: scenarios.filter((scenario) => scenario.status === "fail").length,
    status,
    scenarios,
    recommendedNextAction: recommendedNextAction(status),
  };
}

export function formatDecisionReviewQualityDashboardMarkdown(
  dashboard: DecisionReviewQualityDashboard,
): string {
  const lines = [
    "# Decision Review Quality Dashboard",
    "",
    `Generated: ${dashboard.generatedAt}`,
    `Status: ${dashboard.status}`,
    `Real CSV calibration: ${dashboard.realCsvCalibrationStatus}`,
    `Scenarios: ${dashboard.scenarioCount} (${dashboard.passCount} pass, ${dashboard.reviewCount} review, ${dashboard.failCount} fail)`,
    "",
    `Next action: ${dashboard.recommendedNextAction}`,
    "",
    "## Scenarios",
    "",
  ];

  for (const scenario of dashboard.scenarios) {
    lines.push(
      `### ${scenario.label}`,
      "",
      `- status: ${scenario.status}`,
      `- import status: ${scenario.actualImportStatus}`,
      `- completed reviews: ${scenario.actualCompletedReviewCount}/${scenario.expectedCompletedReviewCount}`,
      `- expected insights: ${scenario.expectedInsightIds.join(", ") || "none"}`,
      `- actual insights: ${scenario.actualInsightIds.join(", ") || "none"}`,
      `- missing insights: ${scenario.missingInsightIds.join(", ") || "none"}`,
      `- market context: ${scenario.actualMarketContextSource ?? "none"}`,
      `- headline: ${scenario.coachingHeadline ?? "none"}`,
    );

    if (scenario.missingRequiredHeadlineFragments.length > 0) {
      lines.push(
        `- missing headline fragments: ${scenario.missingRequiredHeadlineFragments.join(", ")}`,
      );
    }

    if (scenario.missingExpectedDiagnosticCodes.length > 0) {
      lines.push(
        `- missing diagnostics: ${scenario.missingExpectedDiagnosticCodes.join(", ")}`,
      );
    }

    if (scenario.missingRequiredTitleFragments.length > 0) {
      lines.push(
        `- missing title fragments: ${scenario.missingRequiredTitleFragments.join(", ")}`,
      );
    }

    if (scenario.missingRequiredEvidenceFragments.length > 0) {
      lines.push(
        `- missing evidence fragments: ${scenario.missingRequiredEvidenceFragments.join(", ")}`,
      );
    }

    if (scenario.forbiddenTextFragmentsFound.length > 0) {
      lines.push(
        `- forbidden text: ${scenario.forbiddenTextFragmentsFound.join(", ")}`,
      );
    }

    if (scenario.contradictoryInsightPairsFound.length > 0) {
      lines.push(
        `- contradictory insights: ${scenario.contradictoryInsightPairsFound.join(", ")}`,
      );
    }

    if (scenario.genericHeadlineFragmentsFound.length > 0) {
      lines.push(
        `- generic headline fragments: ${scenario.genericHeadlineFragmentsFound.join(", ")}`,
      );
    }

    if (scenario.staleHeadlineFragmentsFound.length > 0) {
      lines.push(
        `- stale headline fragments: ${scenario.staleHeadlineFragmentsFound.join(", ")}`,
      );
    }

    if (scenario.diagnostics.length > 0) {
      lines.push(`- diagnostics: ${scenario.diagnostics.join(" | ")}`);
    }

    lines.push("");
  }

  return lines.join("\n").trimEnd() + "\n";
}
