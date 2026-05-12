import type { UserTradeAnalysisRequest } from "../../trade-analysis/request/trade-analysis-request-contract";
import type { ProviderExecution } from "../../execution-sources/types/provider-execution";
import type {
  BrokerCsvImportProductDiagnostics,
  BrokerCsvMappingLearningSignal,
  BrokerImportFingerprintLibrary,
  ProductTraderAnalyticsViewModel,
  SavedExecutionTrade,
  SavedTradeReviewViewModel,
  SavedTraderAnalyticsReport,
  TraderAnalyticsMetricDelta,
  TraderProductIntelligenceViewModel,
  TraderRuleEvaluation,
  TraderRuleInstance,
  TraderRuleTemplate,
} from "./types";
import { previewBrokerExecutionCsvImport } from "./import-preview";
import { buildSavedTradeReviewViewModel } from "./selectors";
import {
  buildBrokerImportFingerprintLibrary,
} from "./product-intelligence";
import { buildProductTraderAnalyticsViewModel } from "./view-model";
import {
  TRADER_RULE_TEMPLATES,
  buildDefaultTraderRuleInstances,
  evaluateTraderRules,
} from "./rule-tracker";
import { buildSampleSavedTraderAnalyticsData } from "./sample-data";

const WORKFLOW_GENERATED_AT = "2026-05-03T14:00:00.000Z";

const SAMPLE_IMPORT_CSV = [
  "Date,Time,Symbol,Side,Quantity,Price,Commission,Fees,Amount,Currency",
  "2026-05-01,09:30:00,ABCD,Buy,100,10.00,1.25,0.08,-1001.33,USD",
  "2026-05-01,09:45:00,ABCD,Buy,50,9.80,0.75,0.05,-490.80,USD",
  "2026-05-01,10:10:00,ABCD,Sell,150,10.40,1.50,0.10,1558.40,USD",
].join("\n");

export interface ImportReviewWorkflowViewModel {
  generatedAt: string;
  title: string;
  preview: ReturnType<typeof previewBrokerExecutionCsvImport>;
  diagnostics: BrokerCsvImportProductDiagnostics;
  columnMappingRows: Array<{
    field: string;
    header: string | null;
    status: "mapped" | "missing";
  }>;
  commitDisabledReason: string | null;
}

export type ExecutionReplayRole =
  | "initial_entry"
  | "add"
  | "trim"
  | "full_exit"
  | "readd"
  | "open_leftover";

export type ExecutionReplayRiskDirection =
  | "increased"
  | "reduced"
  | "closed"
  | "unchanged";

export interface ExecutionReplayStep {
  index: number;
  timestamp: string;
  side: string;
  shares: number;
  price: number;
  role: ExecutionReplayRole;
  riskDirection: ExecutionReplayRiskDirection;
  positionBeforeExecution: number;
  positionAfterExecution: number;
  positionPctOfMax: number;
  averageOpenPrice: number | null;
  cashFlowProgress: number;
  realizedPnlProgress: number | null;
  grossPnlProgress: number | null;
  marker: string;
  linkedRiskLabels: string[];
  linkedStrengthLabels: string[];
  warnings: string[];
}

export interface ExecutionReplayVisual {
  tradeId: string;
  symbol: string;
  tradeDirection: string;
  maxPosition: number;
  finalGrossPnl: number | null;
  steps: ExecutionReplayStep[];
}

export interface GuidedReviewSessionStep {
  id: string;
  label: string;
  detail: string;
  relatedTradeIds: string[];
  action: string;
}

export interface InAppLesson {
  id: string;
  title: string;
  body: string;
  sourceTradeIds: string[];
  linkedRuleRecommendationId: string | null;
  status: "draft" | "captured";
  createdAt: string;
}

export interface GuidedReviewSessionViewModel {
  generatedAt: string;
  title: string;
  summary: string;
  primaryTradeIds: string[];
  steps: GuidedReviewSessionStep[];
  suggestedLesson: InAppLesson;
}

export interface RuleEffectivenessItem {
  ruleId: string;
  templateId: string;
  label: string;
  violationsBefore: number | null;
  violationsAfter: number;
  delta: number | null;
  direction: "improving" | "worsening" | "flat" | "insufficient_data";
  currentViolationTradeIds: string[];
  sampleSizeWarning: boolean;
}

export interface RuleEffectivenessTracker {
  totalRules: number;
  improvingCount: number;
  worseningCount: number;
  flatCount: number;
  items: RuleEffectivenessItem[];
}

export interface TraderProgressViewModel {
  generatedAt: string;
  analytics: ProductTraderAnalyticsViewModel;
  intelligence: TraderProductIntelligenceViewModel;
  scoreDeltas: TraderAnalyticsMetricDelta[];
  ruleEffectiveness: RuleEffectivenessTracker;
  activeFocusLabel: string;
  progressSummary: string;
}

export interface ImportHealthCenterViewModel {
  generatedAt: string;
  importReview: ImportReviewWorkflowViewModel;
  fingerprintLibrary: BrokerImportFingerprintLibrary;
  supportedBrokers: Array<{
    id: string;
    label: string;
    status: "supported" | "generic_supported" | "admin_review";
  }>;
  healthSummary: string;
}

export interface BrokerMappingAdminConsoleViewModel {
  generatedAt: string;
  library: BrokerImportFingerprintLibrary;
  adminOnly: true;
  nextAction: string;
}

export interface ProductPlanDefinition {
  id: "starter" | "pro" | "market_context";
  label: string;
  importsPerMonth: number;
  savedTradeHistoryMonths: number;
  activeRuleLimit: number;
  marketContextAvailability: "none" | "observational" | "calibrated_add_on";
  brokerSupportLevel: "generic" | "priority" | "admin_assisted";
}

export interface AccountPlanFoundationViewModel {
  generatedAt: string;
  currentPlanId: ProductPlanDefinition["id"];
  plans: ProductPlanDefinition[];
  currentUsage: {
    importsThisMonth: number;
    savedTradeCount: number;
    activeRuleCount: number;
    marketContextEnabled: boolean;
  };
  upgradeReasons: string[];
}

export interface StorageImplementationEntityGroup {
  id: string;
  label: string;
  status: "fixture_backed" | "contract_ready" | "needs_real_adapter";
  recordCount: number;
  notes: string;
}

export interface StorageImplementationBoundaryViewModel {
  generatedAt: string;
  mode: "fixture_in_memory";
  readyForRealPersistence: false;
  entityGroups: StorageImplementationEntityGroup[];
  transactionBoundaries: string[];
  deletionBehavior: string[];
  blockers: string[];
}

export interface ProductWorkflowShellViewModel {
  analytics: ProductTraderAnalyticsViewModel;
  importReview: ImportReviewWorkflowViewModel;
  guidedReview: GuidedReviewSessionViewModel;
  progress: TraderProgressViewModel;
  importHealth: ImportHealthCenterViewModel;
  brokerMappingAdmin: BrokerMappingAdminConsoleViewModel;
  accountPlan: AccountPlanFoundationViewModel;
  storageBoundary: StorageImplementationBoundaryViewModel;
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function executionCashFlow(execution: ProviderExecution): number {
  const shares = Number(execution.shares);
  const price = Number(execution.price);

  if (!Number.isFinite(shares) || !Number.isFinite(price)) {
    return 0;
  }

  return String(execution.side).toLowerCase() === "sell"
    ? shares * price
    : -shares * price;
}

export function buildSampleImportReviewWorkflow(): ImportReviewWorkflowViewModel {
  const preview = previewBrokerExecutionCsvImport({
    broker: "generic_execution_csv",
    accountTimezone: "America/New_York",
    csvText: SAMPLE_IMPORT_CSV,
    tradeGroupingRules: {
      maxGapMinutes: 240,
      splitAtSessionBoundary: true,
    },
  });

  return {
    generatedAt: WORKFLOW_GENERATED_AT,
    title: "CSV Import Review",
    preview,
    diagnostics: preview.productDiagnostics,
    columnMappingRows: [
      ...preview.importResult.diagnostics.detectedColumns.map((column) => ({
        field: column.field,
        header: column.header,
        status: "mapped" as const,
      })),
      ...preview.importResult.diagnostics.missingRequiredFields.map((field) => ({
        field,
        header: null,
        status: "missing" as const,
      })),
    ],
    commitDisabledReason: preview.productDiagnostics.commitPlan.canCommitNow
      ? null
      : preview.productDiagnostics.commitPlan.blockedReasons[0] ??
        preview.productDiagnostics.commitPlan.reviewReasons[0] ??
        "Review import warnings before saving.",
  };
}

export function buildExecutionReplayVisual(
  view: SavedTradeReviewViewModel,
): ExecutionReplayVisual {
  const tradeDirection = String(view.trade.tradeDirection).toLowerCase();
  const directionMultiplier =
    tradeDirection === "short" ? -1 : 1;
  let signedPosition = 0;
  let openCostBasis = 0;
  let cashFlowProgress = 0;
  let realizedPnlProgress = 0;
  let sawReduction = false;
  const riskLabels = view.risks.map((risk) => risk.label);
  const strengthLabels = view.strengths.map((strength) => strength.label);
  const rawSteps = view.trade.request.executions.map(
    (execution, index) => {
      const side = String(execution.side).toLowerCase();
      const shares = Number(execution.shares);
      const price = Number(execution.price);
      const signedShares = (side === "buy" ? shares : -shares) * directionMultiplier;
      const positionBeforeExecution = signedPosition;
      const previousAbsPosition = Math.abs(signedPosition);
      const nextSignedPosition = signedPosition + signedShares;
      const nextAbsPosition = Math.abs(nextSignedPosition);
      const isIncreasing = nextAbsPosition > previousAbsPosition;
      const isClosing = previousAbsPosition > 0 && nextAbsPosition === 0;
      const isReducing = previousAbsPosition > 0 && nextAbsPosition < previousAbsPosition;
      const averageOpenPriceBefore =
        previousAbsPosition > 0 ? openCostBasis / previousAbsPosition : null;

      if (isIncreasing) {
        openCostBasis += Math.abs(signedShares) * price;
      } else if (previousAbsPosition > 0) {
        const reductionRatio = Math.min(
          Math.abs(signedShares) / previousAbsPosition,
          1,
        );
        if (averageOpenPriceBefore !== null) {
          const realizedDelta =
            tradeDirection === "short"
              ? Math.abs(signedShares) * (averageOpenPriceBefore - price)
              : Math.abs(signedShares) * (price - averageOpenPriceBefore);
          realizedPnlProgress += realizedDelta;
        }
        openCostBasis *= 1 - reductionRatio;
        sawReduction = true;
      }

      signedPosition = nextSignedPosition;
      cashFlowProgress += executionCashFlow(execution);

      const isLastExecution = index === view.trade.request.executions.length - 1;
      const role: ExecutionReplayRole =
        index === 0
          ? "initial_entry"
          : isLastExecution && nextAbsPosition > 0
            ? "open_leftover"
            : isClosing
              ? "full_exit"
              : isReducing
                ? "trim"
                : isIncreasing && sawReduction
                  ? "readd"
                  : isIncreasing
                    ? "add"
                    : "trim";
      const riskDirection: ExecutionReplayRiskDirection =
        isClosing
          ? "closed"
          : isIncreasing
            ? "increased"
            : isReducing
              ? "reduced"
              : "unchanged";
      const marker =
        role === "initial_entry"
          ? "Initial entry"
          : role === "open_leftover"
            ? "Shares left open"
            : role === "readd"
              ? "Re-added size"
              : role === "add"
                ? "Added size"
                : role === "full_exit"
                  ? "Closed to flat"
                  : "Reduced risk";

      return {
        index,
        timestamp: String(execution.timestamp),
        side,
        shares,
        price,
        role,
        riskDirection,
        positionBeforeExecution,
        positionAfterExecution: signedPosition,
        positionPctOfMax: 0,
        averageOpenPrice:
          nextAbsPosition > 0 ? roundMoney(openCostBasis / nextAbsPosition) : null,
        cashFlowProgress: roundMoney(cashFlowProgress),
        realizedPnlProgress:
          isReducing || isClosing ? roundMoney(realizedPnlProgress) : null,
        grossPnlProgress:
          isReducing || isClosing ? roundMoney(realizedPnlProgress) : null,
        marker,
        linkedRiskLabels:
          riskDirection === "increased" || role === "open_leftover"
            ? riskLabels.slice(0, 3)
            : [],
        linkedStrengthLabels:
          riskDirection === "reduced" || riskDirection === "closed"
            ? strengthLabels.slice(0, 3)
            : [],
        warnings: role === "open_leftover" ? view.summary?.warnings ?? [] : [],
      };
    },
  );
  const maxPosition = Math.max(
    ...rawSteps.map((step) => Math.abs(step.positionAfterExecution)),
    1,
  );
  const steps: ExecutionReplayStep[] = rawSteps.map((step) => ({
    ...step,
    positionPctOfMax: roundMoney(Math.abs(step.positionAfterExecution) / maxPosition),
  }));

  return {
    tradeId: view.trade.id,
    symbol: view.trade.symbol,
    tradeDirection: view.trade.tradeDirection,
    maxPosition,
    finalGrossPnl: view.reportRow?.grossRealizedPnl ?? null,
    steps,
  };
}

export function buildGuidedReviewSession(args: {
  analytics: ProductTraderAnalyticsViewModel;
}): GuidedReviewSessionViewModel {
  const intelligence = args.analytics.productIntelligence;
  const coach = args.analytics.improvementIntelligence.dailyCoachReport;
  const topCost = intelligence.mistakeCostEstimates.topCostDriver;
  const topFocus = args.analytics.focusQueue[0];
  const topAlert = intelligence.recurrenceAlerts[0];
  const rule = intelligence.ruleBuilderRecommendations[0];
  const primaryTradeIds =
    (coach.relatedTradeIds.length > 0 ? coach.relatedTradeIds : null) ??
    topCost?.relatedTradeIds ??
    topFocus?.relatedTradeIds ??
    topAlert?.relatedTradeIds ??
    [];
  const steps: GuidedReviewSessionStep[] = [
    {
      id: "review_daily_coach_report",
      label: "Review coach report",
      detail: `${coach.sessionDate}: ${coach.fixNextSession}`,
      relatedTradeIds: coach.relatedTradeIds,
      action: "Start with the daily coach report before opening individual trades.",
    },
    {
      id: "review_cost_driver",
      label: "Review biggest cost driver",
      detail: topCost
        ? `${topCost.label} has an estimated gross cost of $${topCost.estimatedGrossCost.toFixed(2)}.`
        : "No repeated cost driver is visible yet.",
      relatedTradeIds: topCost?.relatedTradeIds ?? [],
      action: "Open the related trades and inspect the execution replay.",
    },
    {
      id: "compare_related_trades",
      label: "Compare related trades",
      detail: topFocus?.summary ?? "More trades are needed before a focus cluster appears.",
      relatedTradeIds: topFocus?.relatedTradeIds ?? [],
      action: "Look for the moment where behavior changed.",
    },
    {
      id: "capture_lesson",
      label: "Capture lesson",
      detail: topAlert?.detail ?? "Write a short lesson after reviewing the trade.",
      relatedTradeIds: topAlert?.relatedTradeIds ?? primaryTradeIds,
      action: "Save the lesson inside the app.",
    },
    {
      id: "create_rule",
      label: "Create one rule",
      detail: rule?.reason ?? "A rule recommendation needs more reviewed trades.",
      relatedTradeIds: rule?.relatedTradeIds ?? primaryTradeIds,
      action: rule
        ? `Use recommendation: ${rule.label}.`
        : "Wait for more evidence before creating a rule.",
    },
  ];

  return {
    generatedAt: WORKFLOW_GENERATED_AT,
    title: "Guided Review Session",
    summary:
      coach.biggestMistake?.label ??
      topCost?.label ??
      topFocus?.title ??
      "Review the highest-priority execution behavior.",
    primaryTradeIds,
    steps,
    suggestedLesson: {
      id: "lesson:suggested:guided-review",
      title: topCost ? `Lesson from ${topCost.label}` : "Lesson from review",
      body:
        "Describe the execution moment to repeat or avoid, then connect it to one rule.",
      sourceTradeIds: primaryTradeIds,
      linkedRuleRecommendationId: rule?.id ?? null,
      status: "draft",
      createdAt: WORKFLOW_GENERATED_AT,
    },
  };
}

function directionForDelta(delta: number | null): RuleEffectivenessItem["direction"] {
  if (delta === null) {
    return "insufficient_data";
  }

  if (delta < 0) {
    return "improving";
  }

  if (delta > 0) {
    return "worsening";
  }

  return "flat";
}

export function buildRuleEffectivenessTracker(args: {
  currentEvaluations: TraderRuleEvaluation[];
  previousEvaluations?: TraderRuleEvaluation[];
  currentCompletedTradeCount: number;
  previousCompletedTradeCount?: number;
}): RuleEffectivenessTracker {
  const items = args.currentEvaluations.map((current) => {
    const previous =
      args.previousEvaluations?.find(
        (candidate) => candidate.templateId === current.templateId,
      ) ?? null;
    const violationsBefore = previous?.violatedTradeCount ?? null;
    const delta =
      violationsBefore === null
        ? null
        : current.violatedTradeCount - violationsBefore;

    return {
      ruleId: current.ruleId,
      templateId: current.templateId,
      label: current.label,
      violationsBefore,
      violationsAfter: current.violatedTradeCount,
      delta,
      direction: directionForDelta(delta),
      currentViolationTradeIds: current.violationTradeIds,
      sampleSizeWarning:
        args.currentCompletedTradeCount < 5 ||
        (args.previousCompletedTradeCount ?? 0) < 5,
    };
  });

  return {
    totalRules: items.length,
    improvingCount: items.filter((item) => item.direction === "improving").length,
    worseningCount: items.filter((item) => item.direction === "worsening").length,
    flatCount: items.filter((item) => item.direction === "flat").length,
    items,
  };
}

function evaluateRulesForReport(args: {
  report: SavedTraderAnalyticsReport | null;
  userId: string;
  instances: TraderRuleInstance[];
  templates: TraderRuleTemplate[];
}): TraderRuleEvaluation[] {
  if (!args.report) {
    return [];
  }

  return evaluateTraderRules({
    report: args.report,
    instances: args.instances,
    templates: args.templates,
  });
}

export function buildTraderProgressViewModel(args: {
  analytics: ProductTraderAnalyticsViewModel;
  previousReport?: SavedTraderAnalyticsReport | null;
}): TraderProgressViewModel {
  const instances = buildDefaultTraderRuleInstances(args.analytics.userId);
  const previousEvaluations = evaluateRulesForReport({
    report: args.previousReport ?? null,
    userId: args.analytics.userId,
    instances,
    templates: TRADER_RULE_TEMPLATES,
  });
  const ruleEffectiveness = buildRuleEffectivenessTracker({
    currentEvaluations: args.analytics.ruleEvaluations,
    previousEvaluations,
    currentCompletedTradeCount:
      args.analytics.latestReport.report.sampleSize.completedTradeCount,
    previousCompletedTradeCount:
      args.previousReport?.report.sampleSize.completedTradeCount,
  });
  const activeFocusLabel =
    args.analytics.focusQueue[0]?.title ??
    args.analytics.productIntelligence.unifiedReviewQueue.items[0]?.title ??
    "Review more trades";

  return {
    generatedAt: WORKFLOW_GENERATED_AT,
    analytics: args.analytics,
    intelligence: args.analytics.productIntelligence,
    scoreDeltas: args.analytics.comparison?.metricDeltas ?? [],
    ruleEffectiveness,
    activeFocusLabel,
    progressSummary: `${activeFocusLabel} is the current product focus.`,
  };
}

function learningSignalsForImport(
  importReview: ImportReviewWorkflowViewModel,
): BrokerCsvMappingLearningSignal[] {
  return [
    importReview.diagnostics.mappingLearningSignal,
    {
      ...importReview.diagnostics.mappingLearningSignal,
      shouldCapture: true,
      reason: "Synthetic unknown broker sample for admin review.",
      broker: "generic_execution_csv",
      confidenceLevel: "low",
      confidenceScore: 45,
      headerFingerprint: "broker_csv_headers_v1:unknown-actions|unknown-price|unknown-time",
      headers: ["Unknown Actions", "Unknown Price", "Unknown Time"],
      detectedFields: ["symbol", "price"],
      missingRequiredFields: ["timestamp"],
      issueCodes: ["missing_required_column"],
    },
  ];
}

export function buildImportHealthCenterViewModel(
  importReview = buildSampleImportReviewWorkflow(),
): ImportHealthCenterViewModel {
  const fingerprintLibrary = buildBrokerImportFingerprintLibrary({
    signals: learningSignalsForImport(importReview),
    seenAt: WORKFLOW_GENERATED_AT,
  });

  return {
    generatedAt: WORKFLOW_GENERATED_AT,
    importReview,
    fingerprintLibrary,
    supportedBrokers: [
      { id: "ibkr_activity_statement", label: "IBKR", status: "supported" },
      { id: "moomoo_trade_history", label: "Moomoo", status: "supported" },
      { id: "webull_order_history", label: "Webull", status: "supported" },
      {
        id: "robinhood_transaction_history",
        label: "Robinhood",
        status: "supported",
      },
      { id: "schwab_transactions", label: "Schwab", status: "supported" },
      {
        id: "generic_execution_csv",
        label: "Generic CSV",
        status: "generic_supported",
      },
    ],
    healthSummary:
      importReview.diagnostics.qualityScore.status === "high_confidence"
        ? "Latest sample import is healthy."
        : "Latest sample import needs review before commit.",
  };
}

export function buildBrokerMappingAdminConsoleViewModel(
  importHealth = buildImportHealthCenterViewModel(),
): BrokerMappingAdminConsoleViewModel {
  return {
    generatedAt: WORKFLOW_GENERATED_AT,
    library: importHealth.fingerprintLibrary,
    adminOnly: true,
    nextAction:
      importHealth.fingerprintLibrary.needsReviewCount > 0
        ? "Review low-confidence fingerprints and add broker-specific aliases."
        : "No broker mappings need admin review.",
  };
}

export function buildAccountPlanFoundationViewModel(
  analytics: ProductTraderAnalyticsViewModel,
): AccountPlanFoundationViewModel {
  const currentUsage = {
    importsThisMonth: 1,
    savedTradeCount: analytics.latestReport.sourceTradeIds.length,
    activeRuleCount: analytics.ruleEvaluations.length,
    marketContextEnabled:
      analytics.productIntelligence.marketContextReadiness.levelsAttachedCount > 0,
  };

  return {
    generatedAt: WORKFLOW_GENERATED_AT,
    currentPlanId: "pro",
    plans: [
      {
        id: "starter",
        label: "Starter",
        importsPerMonth: 5,
        savedTradeHistoryMonths: 3,
        activeRuleLimit: 3,
        marketContextAvailability: "none",
        brokerSupportLevel: "generic",
      },
      {
        id: "pro",
        label: "Pro",
        importsPerMonth: 50,
        savedTradeHistoryMonths: 24,
        activeRuleLimit: 20,
        marketContextAvailability: "observational",
        brokerSupportLevel: "priority",
      },
      {
        id: "market_context",
        label: "Chart Evidence",
        importsPerMonth: 100,
        savedTradeHistoryMonths: 60,
        activeRuleLimit: 50,
        marketContextAvailability: "calibrated_add_on",
        brokerSupportLevel: "admin_assisted",
      },
    ],
    currentUsage,
    upgradeReasons: [
      ...(currentUsage.importsThisMonth >= 50
        ? ["Monthly import limit reached."]
        : []),
      ...(!analytics.productIntelligence.marketContextReadiness.calibratedCount
        ? ["Calibrated market context requires the later add-on."]
        : []),
    ],
  };
}

export function buildStorageImplementationBoundaryViewModel(args: {
  analytics: ProductTraderAnalyticsViewModel;
  importReview: ImportReviewWorkflowViewModel;
}): StorageImplementationBoundaryViewModel {
  return {
    generatedAt: WORKFLOW_GENERATED_AT,
    mode: "fixture_in_memory",
    readyForRealPersistence: false,
    entityGroups: [
      {
        id: "users_accounts_workspaces",
        label: "Users, Accounts, Workspaces",
        status: "contract_ready",
        recordCount: 3,
        notes: "Workspace/account contracts exist; auth provider is still deferred.",
      },
      {
        id: "import_batches",
        label: "Saved Imports",
        status: "contract_ready",
        recordCount: args.importReview.preview.importResult.rowCount,
        notes: "Import diagnostics, repair state, quality score, and commit plan are ready.",
      },
      {
        id: "normalized_executions",
        label: "Normalized Executions",
        status: "contract_ready",
        recordCount: args.importReview.preview.importResult.acceptedExecutionCount,
        notes: "Provider executions can be stored without raw CSV export.",
      },
      {
        id: "saved_trades_reports",
        label: "Saved Trades And Reports",
        status: "fixture_backed",
        recordCount: args.analytics.latestReport.sourceTradeIds.length,
        notes: "Fixture repository proves the read model; database adapter remains future work.",
      },
      {
        id: "notes_rules_review_queue",
        label: "Notes, Rules, Review Queue",
        status: "contract_ready",
        recordCount:
          args.analytics.ruleEvaluations.length +
          args.analytics.productIntelligence.unifiedReviewQueue.totalCount,
        notes: "Product workflow data is deterministic and ready for persistence.",
      },
    ],
    transactionBoundaries: [
      "Save import metadata, row outcomes, repair state, and normalized executions together.",
      "Save grouped trades before queueing execution analysis jobs.",
      "Save notes, lessons, and rule updates as independent user actions.",
      "Attach chart-evidence outputs only after saved trades exist.",
    ],
    deletionBehavior: [
      "Deleting a saved import removes raw row data and repair state.",
      "Deleting a saved trade removes normalized executions from user analytics.",
      "Deleting an account removes saved trades, reports, notes, rules, and review queue items.",
    ],
    blockers: [
      "Choose auth provider.",
      "Choose production database.",
      "Add server-side authorization checks for every account-scoped query.",
      "Add migration and backup strategy.",
    ],
  };
}

export function buildProductWorkflowShellViewModel(): ProductWorkflowShellViewModel {
  const sample = buildSampleSavedTraderAnalyticsData();
  const analytics = buildProductTraderAnalyticsViewModel({
    repository: sample.repository,
    userId: sample.userId,
    importRequests: sample.importRequests,
  });
  const previousReport =
    sample.repository.getReport(sample.userId, "report-prior-sample") ?? null;
  const importReview = buildSampleImportReviewWorkflow();
  const progress = buildTraderProgressViewModel({
    analytics,
    previousReport,
  });
  const importHealth = buildImportHealthCenterViewModel(importReview);

  return {
    analytics,
    importReview,
    guidedReview: buildGuidedReviewSession({ analytics }),
    progress,
    importHealth,
    brokerMappingAdmin: buildBrokerMappingAdminConsoleViewModel(importHealth),
    accountPlan: buildAccountPlanFoundationViewModel(analytics),
    storageBoundary: buildStorageImplementationBoundaryViewModel({
      analytics,
      importReview,
    }),
  };
}

export function buildSampleTradeReplay(tradeId: string): {
  trade: SavedExecutionTrade;
  review: SavedTradeReviewViewModel;
  replay: ExecutionReplayVisual;
} | null {
  const sample = buildSampleSavedTraderAnalyticsData();
  const trade = sample.repository.getTrade(sample.userId, tradeId);

  if (!trade) {
    return null;
  }

  const report =
    sample.reports.find((candidate) => candidate.sourceTradeIds.includes(tradeId)) ??
    sample.reports[0] ??
    null;
  const review = buildSavedTradeReviewViewModel({ trade, report });

  return {
    trade,
    review,
    replay: buildExecutionReplayVisual(review),
  };
}

export function buildWorkflowFromRequests(
  requests: UserTradeAnalysisRequest[],
): ProductTraderAnalyticsViewModel {
  const sample = buildSampleSavedTraderAnalyticsData();

  return buildProductTraderAnalyticsViewModel({
    repository: sample.repository,
    userId: sample.userId,
    importRequests: requests,
  });
}
