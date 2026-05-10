import { previewBrokerExecutionCsvImport } from "./import-preview";
import { buildProductSafetyCopyAudit } from "./review-habit-loop";
import type {
  BrokerFixtureCoverage,
  BrokerFixtureLibraryItem,
  BrokerFixtureLibrarySummary,
  CalibrationDashboard,
  CalibrationDashboardMetric,
  GuidedDataRepairSeverity,
  GuidedDataRepairStep,
  GuidedDataRepairWizard,
  ImportTrialHarness,
  ImportTrialResult,
  ImportTrialResultStatus,
  MobileProductQaPass,
  ProductCopyQualityIssue,
  ProductCopyQualitySystem,
  ProductTraderAnalyticsViewModel,
  ReviewSessionCockpit,
  ReviewSessionCockpitAction,
  RuleLifecycleSimulation,
  RuleLifecycleSimulationItem,
  SyntheticBrokerImportFixture,
  TradeReplayVisualUpgradeContract,
  TraderImportTrialExperienceViewModel,
  WhyAmISeeingThisLayer,
  WhyLayerExplanation,
} from "./types";
import type { BrokerExecutionCsvFormat } from "../../execution-sources/csv";

const IMPORT_TRIAL_GENERATED_AT = "2026-05-03T18:00:00.000Z";

type ImportTrialAnalyticsContext = Omit<
  ProductTraderAnalyticsViewModel,
  "importTrialExperience"
>;

type FixtureWithCsv = SyntheticBrokerImportFixture & {
  csvText: string;
  existingFileFingerprints?: string[];
};

const REPRESENTATIVE_FIXTURES: FixtureWithCsv[] = [
  {
    id: "fixture:ibkr:activity-statement",
    label: "IBKR activity statement sample",
    broker: "ibkr_activity_statement",
    fixtureKind: "broker_representative",
    fixtureFileName: "ibkr-activity-statement-sample.csv",
    synthetic: true,
    headerConfidence: "official",
    expectedBehavior: "Closed long stock trade with signed IBKR quantities.",
    scenarios: ["closed_stock_trade"],
    includesFeesOrCommissions: false,
    includesOptionsRows: false,
    includesOpenPosition: false,
    notes: [
      "Representative parser fixture only.",
      "IBKR remains a candle-data provider in the other app; this fixture is for execution imports.",
    ],
    csvText: [
      "Symbol,Date/Time,Quantity,T. Price,Trade ID",
      'AAPL,"2026-05-01, 09:35:00",100,182.10,IB-1',
      'AAPL,"2026-05-01, 10:05:00",-100,184.25,IB-2',
    ].join("\n"),
  },
  {
    id: "fixture:moomoo:trade-history",
    label: "Moomoo trade history sample",
    broker: "moomoo_trade_history",
    fixtureKind: "broker_representative",
    fixtureFileName: "moomoo-trade-history-sample.csv",
    synthetic: true,
    headerConfidence: "observed",
    expectedBehavior: "Closed long stock trade with regional-style instrument headers.",
    scenarios: ["closed_stock_trade"],
    includesFeesOrCommissions: false,
    includesOptionsRows: false,
    includesOpenPosition: false,
    notes: [
      "Moomoo export headers vary by region; this sample covers common observed names.",
    ],
    csvText: [
      "Date of Trade,Instrument Code,Transaction Type,Filled Quantity,Average Price",
      "2026/05/01,META,Buy,8,312.40",
      "2026/05/01,META,Sell,8,318.75",
    ].join("\n"),
  },
  {
    id: "fixture:webull:order-history",
    label: "Webull order history sample",
    broker: "webull_order_history",
    fixtureKind: "broker_representative",
    fixtureFileName: "webull-order-history-sample.csv",
    synthetic: true,
    headerConfidence: "official",
    expectedBehavior: "Closed stock trade while skipping a cancelled order.",
    scenarios: ["closed_stock_trade", "cancelled_or_non_trade_skip"],
    includesFeesOrCommissions: false,
    includesOptionsRows: false,
    includesOpenPosition: false,
    notes: ["Non-filled orders should be skipped, not saved as executions."],
    csvText: [
      "Symbol,Side,Filled Qty,Avg Price,Filled Time,Status,Order ID",
      "TSLA,Buy,10,175.25,2026-05-01 09:45:00,Filled,WB-1",
      "TSLA,Sell,10,176.50,2026-05-01 10:15:00,Filled,WB-2",
      "TSLA,Buy,5,177.00,2026-05-01 10:30:00,Cancelled,WB-3",
    ].join("\n"),
  },
  {
    id: "fixture:robinhood:transaction-history",
    label: "Robinhood transaction history sample",
    broker: "robinhood_transaction_history",
    fixtureKind: "broker_representative",
    fixtureFileName: "robinhood-transaction-history-sample.csv",
    synthetic: true,
    headerConfidence: "official",
    expectedBehavior: "Closed stock trade using transaction type labels.",
    scenarios: ["closed_stock_trade"],
    includesFeesOrCommissions: false,
    includesOptionsRows: false,
    includesOpenPosition: false,
    notes: ["Dates without explicit times are accepted as broker-local session rows."],
    csvText: [
      "Activity Date,Instrument,Transaction Type,Quantity,Average Price",
      "05/01/2026,NVDA,Market Buy,25,875.50",
      "05/01/2026,NVDA,Market Sell,25,889.10",
    ].join("\n"),
  },
  {
    id: "fixture:schwab:transactions",
    label: "Schwab transactions sample",
    broker: "schwab_transactions",
    fixtureKind: "broker_representative",
    fixtureFileName: "schwab-transactions-sample.csv",
    synthetic: true,
    headerConfidence: "official",
    expectedBehavior: "Closed stock trade while skipping non-trade account activity.",
    scenarios: [
      "closed_stock_trade",
      "fees_or_commissions",
      "cancelled_or_non_trade_skip",
    ],
    includesFeesOrCommissions: true,
    includesOptionsRows: false,
    includesOpenPosition: false,
    notes: ["Dividend/account activity rows should not become executions."],
    csvText: [
      "Date,Action,Symbol,Description,Quantity,Price,Fees & Comm,Amount",
      "05/01/2026,Buy,AMD,ADVANCED MICRO DEVICES INC,50,95.00,0,-4750.00",
      "05/01/2026,Sell,AMD,ADVANCED MICRO DEVICES INC,50,97.50,0,4875.00",
      "05/01/2026,Dividend,AMD,QUALIFIED DIVIDEND,0,0,0,12.00",
    ].join("\n"),
  },
  {
    id: "fixture:generic:short-trade",
    label: "Generic short trade sample",
    broker: "generic_execution_csv",
    fixtureKind: "generic_compatibility",
    fixtureFileName: "generic-execution-sample.csv",
    synthetic: true,
    headerConfidence: "best_effort",
    expectedBehavior: "Closed short stock trade from a plain execution ledger.",
    scenarios: ["closed_stock_trade", "short_trade"],
    includesFeesOrCommissions: false,
    includesOptionsRows: false,
    includesOpenPosition: false,
    notes: ["Generic mapping is the fallback for CSVs with normal execution columns."],
    csvText: [
      "Date,Time,Ticker,Action,Shares,Price",
      "2026-05-01,09:30:00,SPY,Sell,100,510.00",
      "2026-05-01,10:00:00,SPY,Buy,100,508.25",
    ].join("\n"),
  },
  {
    id: "fixture:generic:fees-net-pnl",
    label: "Generic fees and net P/L sample",
    broker: "generic_execution_csv",
    fixtureKind: "generic_compatibility",
    fixtureFileName: null,
    synthetic: true,
    headerConfidence: "best_effort",
    expectedBehavior: "Closed stock trade with commissions, fees, net amount, and currency.",
    scenarios: ["closed_stock_trade", "fees_or_commissions"],
    includesFeesOrCommissions: true,
    includesOptionsRows: false,
    includesOpenPosition: false,
    notes: ["Used to validate net P/L preview and fee visibility."],
    csvText: [
      "Date,Time,Symbol,Side,Quantity,Price,Commission,Fees,Amount,Currency",
      "2026-05-01,09:30:00,ABCD,Buy,100,10.00,1.25,0.08,-1001.33,USD",
      "2026-05-01,10:00:00,ABCD,Sell,100,10.50,1.25,0.10,1048.65,USD",
    ].join("\n"),
  },
  {
    id: "fixture:edge:row-repair",
    label: "Row repair sample",
    broker: "generic_execution_csv",
    fixtureKind: "edge_case",
    fixtureFileName: null,
    synthetic: true,
    headerConfidence: "best_effort",
    expectedBehavior: "One row is rejected because the symbol is missing.",
    scenarios: ["row_repair"],
    includesFeesOrCommissions: false,
    includesOptionsRows: false,
    includesOpenPosition: false,
    notes: ["For testing the user repair wizard blocker path."],
    csvText: [
      "Date,Time,Symbol,Side,Quantity,Price",
      "2026-05-01,09:30:00,,Buy,100,10.00",
      "2026-05-01,09:35:00,ABCD,Sell,100,11.00",
    ].join("\n"),
  },
  {
    id: "fixture:edge:open-position",
    label: "Open position sample",
    broker: "generic_execution_csv",
    fixtureKind: "edge_case",
    fixtureFileName: null,
    synthetic: true,
    headerConfidence: "best_effort",
    expectedBehavior: "Import leaves an open position that requires review before final analysis.",
    scenarios: ["open_trade"],
    includesFeesOrCommissions: false,
    includesOptionsRows: false,
    includesOpenPosition: true,
    notes: ["Used to test open-leftover repair and review copy."],
    csvText: [
      "Date,Time,Symbol,Side,Quantity,Price",
      "2026-05-01,09:30:00,QQQ,Buy,100,420.00",
      "2026-05-01,10:00:00,QQQ,Sell,25,421.00",
    ].join("\n"),
  },
  {
    id: "fixture:edge:pnl-mismatch",
    label: "P/L reconciliation mismatch sample",
    broker: "generic_execution_csv",
    fixtureKind: "edge_case",
    fixtureFileName: null,
    synthetic: true,
    headerConfidence: "best_effort",
    expectedBehavior: "Broker net amount disagrees with app-calculated gross-minus-costs.",
    scenarios: ["pnl_mismatch", "fees_or_commissions"],
    includesFeesOrCommissions: true,
    includesOptionsRows: false,
    includesOpenPosition: false,
    notes: ["Used to prove the app asks for review before saving mismatched P/L."],
    csvText: [
      "Date,Time,Symbol,Side,Quantity,Price,Commission,Fees,Amount,Currency",
      "2026-05-01,09:30:00,ABCD,Buy,100,10.00,0.00,0.00,-1000.00,USD",
      "2026-05-01,10:00:00,ABCD,Sell,100,10.50,0.00,0.00,1040.00,USD",
    ].join("\n"),
  },
  {
    id: "fixture:edge:options-quarantine",
    label: "Options quarantine sample",
    broker: "generic_execution_csv",
    fixtureKind: "edge_case",
    fixtureFileName: null,
    synthetic: true,
    headerConfidence: "best_effort",
    expectedBehavior: "Options rows are quarantined by default so stock analytics stay clean.",
    scenarios: ["options_quarantine"],
    includesFeesOrCommissions: false,
    includesOptionsRows: true,
    includesOpenPosition: false,
    notes: ["Options support is a future workflow; this app should not misread contracts as stock shares."],
    csvText: [
      "Date,Time,Symbol,Side,Quantity,Price,Asset Type,Description",
      "2026-05-01,09:30:00,AAPL240621C00185000,Buy,1,2.50,Option,AAPL Jun Call",
    ].join("\n"),
  },
  {
    id: "fixture:edge:duplicate-file",
    label: "Duplicate file sample",
    broker: "generic_execution_csv",
    fixtureKind: "edge_case",
    fixtureFileName: null,
    synthetic: true,
    headerConfidence: "best_effort",
    expectedBehavior: "Previously imported file fingerprint blocks duplicate commit.",
    scenarios: ["duplicate_file"],
    includesFeesOrCommissions: false,
    includesOptionsRows: false,
    includesOpenPosition: false,
    notes: ["Used to test duplicate-file repair copy."],
    csvText: [
      "Date,Time,Symbol,Side,Quantity,Price",
      "2026-05-01,09:30:00,MSFT,Buy,10,400.00",
      "2026-05-01,09:40:00,MSFT,Sell,10,402.00",
    ].join("\n"),
  },
];

const EXTRA_GENERIC_FIXTURE_LABELS = [
  "Fidelity account history",
  "E*TRADE transactions",
  "tastytrade transactions",
  "TradeStation trade history",
  "thinkorswim account statement",
] as const;

function publicFixture(fixture: FixtureWithCsv): SyntheticBrokerImportFixture {
  return {
    id: fixture.id,
    label: fixture.label,
    broker: fixture.broker,
    fixtureKind: fixture.fixtureKind,
    fixtureFileName: fixture.fixtureFileName,
    synthetic: fixture.synthetic,
    headerConfidence: fixture.headerConfidence,
    expectedBehavior: fixture.expectedBehavior,
    scenarios: fixture.scenarios,
    includesFeesOrCommissions: fixture.includesFeesOrCommissions,
    includesOptionsRows: fixture.includesOptionsRows,
    includesOpenPosition: fixture.includesOpenPosition,
    notes: fixture.notes,
  };
}

function resultStatus(args: {
  qualityStatus: ImportTrialResult["qualityStatus"];
  fileAlreadyImported: boolean;
}): ImportTrialResultStatus {
  if (args.qualityStatus === "blocked" || args.fileAlreadyImported) {
    return "blocked";
  }

  if (args.qualityStatus === "needs_review") {
    return "needs_repair";
  }

  return "pass";
}

function buildTrialResults(fixtures: FixtureWithCsv[]): ImportTrialResult[] {
  return fixtures.map((fixture) => {
    const firstPreview = previewBrokerExecutionCsvImport({
      broker: fixture.broker,
      accountTimezone: "America/New_York",
      csvText: fixture.csvText,
      optionsHandling: "reject",
      tradeGroupingRules: {
        maxGapMinutes: 240,
        splitAtSessionBoundary: true,
      },
    });
    const preview = fixture.id === "fixture:edge:duplicate-file"
      ? previewBrokerExecutionCsvImport({
          broker: fixture.broker,
          accountTimezone: "America/New_York",
          csvText: fixture.csvText,
          existingFileFingerprints: [firstPreview.fileFingerprint],
        })
      : firstPreview;
    const diagnostics = preview.productDiagnostics;
    const status = resultStatus({
      qualityStatus: diagnostics.qualityScore.status,
      fileAlreadyImported: preview.fileAlreadyImported,
    });
    const repairIssueCodes = diagnostics.repairWorkflow.items.map(
      (item) => item.issueCode,
    );
    const issueCodes = Array.from(
      new Set([
        ...preview.importResult.issues.map((issue) => issue.code),
        ...repairIssueCodes,
        ...(preview.fileAlreadyImported
          ? (["duplicate_trade_in_import"] as const)
          : []),
      ]),
    );
    const evidence = [
      `${preview.importResult.acceptedExecutionCount} accepted execution(s)`,
      `${preview.importResult.requestCount} grouped trade(s)`,
      `${diagnostics.qualityScore.score}/100 import quality score`,
      `${preview.importResult.mappingConfidence.level} mapping confidence`,
    ];

    return {
      fixtureId: fixture.id,
      label: fixture.label,
      broker: fixture.broker,
      status,
      acceptedExecutionCount: preview.importResult.acceptedExecutionCount,
      groupedTradeCount: preview.importResult.requestCount,
      rejectedRowCount: preview.importResult.rejectedRowCount,
      skippedRowCount: preview.importResult.skippedRowCount,
      issueCount: preview.importResult.issues.length + repairIssueCodes.length,
      warningCount: diagnostics.qualityScore.warningCount,
      blockerCount:
        diagnostics.qualityScore.blockerCount +
        (preview.fileAlreadyImported ? 1 : 0),
      mappingConfidence: preview.importResult.mappingConfidence.level,
      qualityScore: diagnostics.qualityScore.score,
      qualityStatus: diagnostics.qualityScore.status,
      issueCodes,
      evidence,
      nextAction: preview.fileAlreadyImported
        ? "Review duplicate file warning before saving anything."
        : diagnostics.qualityScore.nextAction,
    };
  });
}

export function buildImportTrialHarness(): ImportTrialHarness {
  const results = buildTrialResults(REPRESENTATIVE_FIXTURES);

  return {
    generatedAt: IMPORT_TRIAL_GENERATED_AT,
    fixtureStrategy:
      "Synthetic representative CSVs are used to exercise broker parsing, repair, and review flows without requiring real customer files.",
    totalCount: results.length,
    passCount: results.filter((result) => result.status === "pass").length,
    needsRepairCount: results.filter((result) => result.status === "needs_repair").length,
    blockedCount: results.filter((result) => result.status === "blocked").length,
    fixtures: REPRESENTATIVE_FIXTURES.map(publicFixture),
    results,
  };
}

function severityFromQuality(status: ImportTrialResultStatus): GuidedDataRepairSeverity {
  if (status === "blocked") {
    return "blocker";
  }

  if (status === "needs_repair") {
    return "review";
  }

  return "info";
}

function repairCopyForCode(code: GuidedDataRepairStep["issueCode"]): {
  label: string;
  explanation: string;
  action: string;
  canProceedAfterReview: boolean;
} {
  switch (code) {
    case "row_missing_symbol":
      return {
        label: "Fix missing ticker symbol",
        explanation: "At least one execution row is missing the stock symbol.",
        action: "Ask the user to edit or remove the affected execution row before saving.",
        canProceedAfterReview: false,
      };
    case "row_missing_timestamp":
    case "row_invalid_timestamp":
    case "invalid_timestamp_timezone":
      return {
        label: "Fix execution time",
        explanation: "The app needs valid execution timestamps to order the trade replay.",
        action: "Ask the user to choose the account timezone or correct the timestamp column.",
        canProceedAfterReview: false,
      };
    case "non_filled_order_skipped":
    case "non_trade_row_skipped":
      return {
        label: "Confirm skipped non-trade rows",
        explanation: "The import skipped rows that should not become trade executions.",
        action: "Show the skipped-row count and let the user continue after review.",
        canProceedAfterReview: true,
      };
    case "options_row_rejected":
    case "options_row_skipped":
      return {
        label: "Review options rows",
        explanation: "Options rows are quarantined so stock-share analytics do not misread contracts.",
        action: "Keep options out of stock analytics until the options workflow exists.",
        canProceedAfterReview: false,
      };
    case "pnl_reconciliation_mismatch":
      return {
        label: "Review P/L mismatch",
        explanation: "Broker net amount and app-calculated gross-minus-costs do not match.",
        action: "Ask the user to inspect fees, commissions, and amount columns before saving.",
        canProceedAfterReview: true,
      };
    case "trade_grouping_session_boundary_split":
    case "trade_grouping_time_gap_split":
    case "over_reducing_execution_split":
      return {
        label: "Review grouped trades",
        explanation: "The app split executions into separate trades based on grouping rules.",
        action: "Show the grouped trades before analysis jobs are queued.",
        canProceedAfterReview: true,
      };
    case "duplicate_trade_in_import":
      return {
        label: "Resolve duplicate file",
        explanation: "The same file fingerprint was already seen.",
        action: "Block saving the duplicate import and return the user to prior results.",
        canProceedAfterReview: false,
      };
    case "low_mapping_confidence":
      return {
        label: "Review column mapping",
        explanation: "The app is not fully confident about the broker column mapping.",
        action: "Ask the user to confirm the symbol, side, quantity, price, and timestamp columns.",
        canProceedAfterReview: true,
      };
    default:
      return {
        label: "Review import issue",
        explanation: "The parser found an issue that should be reviewed before saving.",
        action: "Show the affected rows and ask the user to confirm the import result.",
        canProceedAfterReview: true,
      };
  }
}

export function buildGuidedDataRepairWizard(
  harness = buildImportTrialHarness(),
): GuidedDataRepairWizard {
  const stepsByCode = new Map<GuidedDataRepairStep["issueCode"], GuidedDataRepairStep>();

  for (const result of harness.results.filter((item) => item.status !== "pass")) {
    for (const issueCode of result.issueCodes.length > 0
      ? result.issueCodes
      : (["low_mapping_confidence"] as const)) {
      const copy = repairCopyForCode(issueCode);
      const existing = stepsByCode.get(issueCode);
      const severity = severityFromQuality(result.status);

      if (existing) {
        existing.affectedFixtureIds.push(result.fixtureId);
        existing.priority = Math.min(existing.priority, severity === "blocker" ? 10 : 50);
        existing.severity =
          existing.severity === "blocker" || severity === "blocker"
            ? "blocker"
            : existing.severity === "review" || severity === "review"
              ? "review"
              : "info";
        continue;
      }

      stepsByCode.set(issueCode, {
        id: `repair:${issueCode}`,
        priority: severity === "blocker" ? 10 : severity === "review" ? 50 : 90,
        label: copy.label,
        severity,
        issueCode,
        affectedFixtureIds: [result.fixtureId],
        affectedRows: [],
        affectedTradeIds: [],
        explanation: copy.explanation,
        repairAction: copy.action,
        canProceedAfterReview: copy.canProceedAfterReview,
      });
    }
  }

  const openPositionResults = harness.results.filter((result) =>
    result.fixtureId.includes("open-position"),
  );
  if (openPositionResults.length > 0) {
    stepsByCode.set("trade_grouping_session_boundary_split", {
      id: "repair:open-position-leftover",
      priority: 45,
      label: "Review open position leftover",
      severity: "review",
      issueCode: "trade_grouping_session_boundary_split",
      affectedFixtureIds: openPositionResults.map((result) => result.fixtureId),
      affectedRows: [],
      affectedTradeIds: [],
      explanation:
        "An import can end with shares still open; final trade feedback should be marked as incomplete until the position closes.",
      repairAction: "Show the open-position badge and keep the trade out of final closed-trade conclusions.",
      canProceedAfterReview: true,
    });
  }

  const steps = Array.from(stepsByCode.values()).sort(
    (left, right) => left.priority - right.priority || left.label.localeCompare(right.label),
  );
  const blockerCount = steps.filter((step) => step.severity === "blocker").length;
  const reviewCount = steps.filter((step) => step.severity === "review").length;

  return {
    status: blockerCount > 0 ? "blocked" : reviewCount > 0 ? "needs_repair" : "ready",
    syntheticFixtureMode: true,
    totalStepCount: steps.length,
    blockerCount,
    reviewCount,
    nextAction:
      blockerCount > 0
        ? "Fix the blocking import issues before saving trades."
        : reviewCount > 0
          ? "Review the import warnings, then continue inside the app."
          : "No import repairs are needed for the current fixture trial.",
    steps,
  };
}

function buildReviewSessionCockpit(args: {
  analytics: ImportTrialAnalyticsContext;
  harness: ImportTrialHarness;
  repairWizard: GuidedDataRepairWizard;
}): ReviewSessionCockpit {
  const reviewHabit = args.analytics.reviewHabitLoop;
  const polish = args.analytics.productPolish;
  const coach = args.analytics.coachActionLoop;
  const importReadiness = Math.round((args.harness.passCount / args.harness.totalCount) * 100);
  const repairPenalty = args.repairWizard.blockerCount * 8 + args.repairWizard.reviewCount * 3;
  const readinessScore = Math.max(0, Math.min(100, importReadiness - repairPenalty));
  const topRule = reviewHabit.mistakeRuleConversion.drafts[0] ?? null;
  const topQueue = polish.coachReviewQueue.primaryItem ?? polish.coachReviewQueue.items[0] ?? null;
  const unsortedActions: ReviewSessionCockpitAction[] = [
    {
      id: "cockpit:repair-imports",
      rank: args.repairWizard.blockerCount > 0 ? 1 : 4,
      lane: "repair",
      title:
        args.repairWizard.blockerCount > 0
          ? "Fix blocking import issues"
          : "Review import warnings",
      reason: args.repairWizard.nextAction,
      href: "/repair-wizard",
      relatedTradeIds: [],
      sourceIds: args.repairWizard.steps.slice(0, 3).map((step) => step.id),
      nextAction: "Open the repair wizard.",
    },
    {
      id: "cockpit:trial-results",
      rank: 2,
      lane: "import",
      title: "Check broker fixture trial",
      reason: `${args.harness.passCount} of ${args.harness.totalCount} synthetic fixture trials pass without repair.`,
      href: "/import-trials",
      relatedTradeIds: [],
      sourceIds: args.harness.results.map((result) => result.fixtureId).slice(0, 4),
      nextAction: "Open import trial results.",
    },
    {
      id: "cockpit:daily-review",
      rank: 3,
      lane: "review",
      title: "Run the guided review",
      reason: args.analytics.improvementIntelligence.dailyCoachReport.fixNextSession,
      href: "/review",
      relatedTradeIds:
        args.analytics.improvementIntelligence.dailyCoachReport.relatedTradeIds,
      sourceIds: ["daily-coach-report"],
      nextAction: "Review the highest-priority behavior cluster.",
    },
    {
      id: "cockpit:rule-lifecycle",
      rank: 5,
      lane: "rule",
      title: topRule?.suggestedRuleTitle ?? "Review draft rule",
      reason:
        topRule?.reason ??
        "The app needs more reviewed trades before a rule is ready.",
      href: "/review-cockpit",
      relatedTradeIds: topRule?.affectedTradeIds ?? [],
      sourceIds: topRule ? [topRule.id] : [],
      nextAction: "Inspect rule lifecycle simulation.",
    },
    {
      id: "cockpit:trade-replay",
      rank: 6,
      lane: "replay",
      title: "Open trade replay",
      reason:
        topQueue?.reason ??
        coach.mistakeTimeline.items[0]?.detail ??
        "Use the replay to inspect execution sequence.",
      href: topQueue?.href ?? "/trades/trade-rapid-fire",
      relatedTradeIds: topQueue?.relatedTradeIds ?? [],
      sourceIds: topQueue ? [topQueue.id] : ["mistake-timeline"],
      nextAction: "Open the trade and inspect entry, adds, reductions, and exit.",
    },
    {
      id: "cockpit:progress",
      rank: 7,
      lane: "progress",
      title: "Check progress trend",
      reason: args.analytics.productPolish.executionQualityTrendline.reportTrendSummary,
      href: "/progress",
      relatedTradeIds: [],
      sourceIds: ["execution-quality-trendline"],
      nextAction: "Review quality and rule effectiveness trends.",
    },
  ];
  const actions = unsortedActions.sort((left, right) => left.rank - right.rank);

  return {
    readinessScore,
    title: "Review Session Cockpit",
    summary:
      readinessScore >= 70
        ? "Imports and review workflow are ready enough for a guided product trial."
        : "Import repair should be reviewed before trusting the full coaching flow.",
    primaryAction: actions[0] ?? null,
    actions,
    marketContextUsedForPriority: false,
  };
}

function buildRuleLifecycleSimulation(
  analytics: ImportTrialAnalyticsContext,
): RuleLifecycleSimulation {
  const items: RuleLifecycleSimulationItem[] =
    analytics.reviewHabitLoop.mistakeRuleConversion.drafts.map((draft) => {
      const currentStage: RuleLifecycleSimulationItem["currentStage"] =
        draft.readiness === "ready_to_review" ? "review" : "draft";

      return {
        id: `rule-lifecycle:${draft.id}`,
        ruleTitle: draft.suggestedRuleTitle,
        currentStage,
        stages: [
          "draft",
          "review",
          "simulated_active",
          "measured",
          "promoted_later",
        ],
        evidenceCount: draft.affectedTradeIds.length,
        relatedTradeIds: draft.affectedTradeIds,
        expectedSuccessMetric: draft.measurementMetric,
        limitation:
          "This is a view-model simulation only; it does not save a rule or estimate alternate P/L.",
        nextAction:
          currentStage === "review"
            ? "Review affected trades before deciding whether to save this rule later."
            : "Collect more reviewed trades before moving this draft forward.",
      };
    });

  return {
    totalCount: items.length,
    readyCount: items.filter((item) => item.currentStage === "review").length,
    nextAction:
      items.length > 0
        ? "Review the top rule lifecycle item inside the app."
        : "Review more trades before simulating personal rules.",
    items,
  };
}

function buildTradeReplayVisualUpgradeContract(): TradeReplayVisualUpgradeContract {
  return {
    route: "/trades/[tradeId]",
    markers: [
      {
        role: "initial_entry",
        tone: "entry",
        label: "Entry",
        copy: "First execution that opened the trade.",
      },
      {
        role: "add",
        tone: "risk_increase",
        label: "Add",
        copy: "Execution that increased open risk before a reduction.",
      },
      {
        role: "trim",
        tone: "risk_reduction",
        label: "Trim",
        copy: "Partial reduction of open risk.",
      },
      {
        role: "full_exit",
        tone: "exit",
        label: "Exit",
        copy: "Execution that closed the trade to flat.",
      },
      {
        role: "readd",
        tone: "risk_increase",
        label: "Re-add",
        copy: "Risk increased again after a prior reduction.",
      },
      {
        role: "open_leftover",
        tone: "warning",
        label: "Shares left open",
        copy: "Shares remained open at the end of the imported sequence.",
      },
    ],
    lanes: [
      {
        id: "position_size",
        label: "Position size",
        meaning: "Shows position before and after each execution.",
        canRenderWithCss: true,
      },
      {
        id: "realized_pnl",
        label: "Realized P/L",
        meaning: "Shows realized progress only when size is reduced or closed.",
        canRenderWithCss: true,
      },
      {
        id: "risk_direction",
        label: "Risk direction",
        meaning: "Separates risk increases from reductions and flat exits.",
        canRenderWithCss: true,
      },
      {
        id: "warnings",
        label: "Warnings",
        meaning:
          "Highlights shares left open, adds after price moved against the position, or import repair context.",
        canRenderWithCss: true,
      },
    ],
    routeCopy:
      "Replay the execution sequence and focus on when risk increased, reduced, or closed.",
    marketContextRequired: false,
  };
}

export function buildProductCopyQualitySystem(args: {
  texts: Array<{ sourceId: string; text: string }>;
}): ProductCopyQualitySystem {
  const safety = buildProductSafetyCopyAudit({ texts: args.texts });
  const forbiddenPhrases = [
    ...safety.forbiddenPhrases,
    "download",
    "export",
    "raw json",
    "debug",
    "certified broker support",
    "market structure proves",
  ];
  const lowerForbidden = forbiddenPhrases.map((phrase) => phrase.toLowerCase());
  const issues: ProductCopyQualityIssue[] = [];

  for (const item of args.texts) {
    const lower = item.text.toLowerCase();
    lowerForbidden.forEach((phrase, index) => {
      if (lower.includes(phrase)) {
        issues.push({
          id: `copy:${item.sourceId}:${index}`,
          sourceId: item.sourceId,
          phrase,
          text: item.text,
          severity: "blocker",
          reason: "End-user product copy cannot include overclaiming, export, raw debug, or uncertified broker-support language.",
        });
      }
    });
  }

  return {
    passed: issues.length === 0,
    checkedTextCount: args.texts.length,
    forbiddenPhrases,
    issues,
    guidelines: [
      {
        id: "fixture_honesty",
        label: "Fixture honesty",
        guidance: "Call broker samples representative fixtures, not official certification.",
      },
      {
        id: "execution_only_claims",
        label: "Execution-only claims",
        guidance: "Explain import, replay, and review conclusions without saying market structure decided them.",
      },
      {
        id: "keep_users_in_app",
        label: "Keep users in app",
        guidance: "Do not add export or download language to end-user flows.",
      },
    ],
  };
}

function emptyCoverage(): BrokerFixtureCoverage {
  return {
    closedStockTrade: false,
    shortTrade: false,
    feesOrCommissions: false,
    cancelledOrNonTradeSkip: false,
    openTrade: false,
    rowRepair: false,
    pnlMismatch: false,
  };
}

function applyScenarioCoverage(
  coverage: BrokerFixtureCoverage,
  scenarios: string[],
): BrokerFixtureCoverage {
  return {
    ...coverage,
    closedStockTrade:
      coverage.closedStockTrade || scenarios.includes("closed_stock_trade"),
    shortTrade: coverage.shortTrade || scenarios.includes("short_trade"),
    feesOrCommissions:
      coverage.feesOrCommissions || scenarios.includes("fees_or_commissions"),
    cancelledOrNonTradeSkip:
      coverage.cancelledOrNonTradeSkip ||
      scenarios.includes("cancelled_or_non_trade_skip"),
    openTrade: coverage.openTrade || scenarios.includes("open_trade"),
    rowRepair: coverage.rowRepair || scenarios.includes("row_repair"),
    pnlMismatch: coverage.pnlMismatch || scenarios.includes("pnl_mismatch"),
  };
}

function brokerLabel(broker: BrokerExecutionCsvFormat): string {
  switch (broker) {
    case "ibkr_activity_statement":
      return "IBKR";
    case "moomoo_trade_history":
      return "Moomoo";
    case "webull_order_history":
      return "Webull";
    case "robinhood_transaction_history":
      return "Robinhood";
    case "schwab_transactions":
      return "Schwab";
    case "generic_execution_csv":
      return "Generic CSV";
    case "auto":
      return "Auto Detect";
  }
}

function buildBrokerFixtureLibrary(
  harness: ImportTrialHarness,
): BrokerFixtureLibrarySummary {
  const brokerIds = Array.from(
    new Set(harness.fixtures.map((fixture) => fixture.broker)),
  );
  const brokers: BrokerFixtureLibraryItem[] = brokerIds.map((broker) => {
    const fixtures = harness.fixtures.filter((fixture) => fixture.broker === broker);
    const coverage = fixtures.reduce(
      (current, fixture) => applyScenarioCoverage(current, fixture.scenarios),
      emptyCoverage(),
    );

    return {
      broker,
      label: brokerLabel(broker),
      fixtureCount: fixtures.length,
      headerConfidence: fixtures[0]?.headerConfidence ?? "best_effort",
      coverage,
      limitation:
        "Synthetic fixture coverage proves parser behavior for representative fields; it is not exhaustive broker certification.",
      nextAction:
        broker === "generic_execution_csv"
          ? "Use explicit column mapping for unsupported broker exports."
          : "Add anonymized real samples later to widen broker coverage.",
    };
  });

  return {
    totalBrokers: brokers.length + EXTRA_GENERIC_FIXTURE_LABELS.length,
    representativeFixtureCount: harness.fixtures.filter(
      (fixture) => fixture.fixtureKind === "broker_representative",
    ).length,
    edgeCaseFixtureCount: harness.fixtures.filter(
      (fixture) => fixture.fixtureKind === "edge_case",
    ).length,
    unsupportedBrokerCopy:
      "Unsupported brokers can still use the generic execution CSV mapper when their exports contain symbol, side, quantity, price, and timestamp fields.",
    brokers: [
      ...brokers,
      ...EXTRA_GENERIC_FIXTURE_LABELS.map((label) => ({
        broker: "generic_execution_csv" as const,
        label,
        fixtureCount: 1,
        headerConfidence: "best_effort" as const,
        coverage: {
          ...emptyCoverage(),
          closedStockTrade: true,
        },
        limitation:
          "This broker is represented through the generic mapper until broker-specific headers are promoted.",
        nextAction: "Collect anonymized real exports later before claiming broker-specific support.",
      })),
    ],
  };
}

function buildMobileProductQaPass(): MobileProductQaPass {
  const routes = [
    "/analytics",
    "/coach",
    "/imports",
    "/import-dry-run",
    "/import-trials",
    "/repair-wizard",
    "/review-cockpit",
    "/review",
    "/progress",
    "/trades/[tradeId]",
    "/compare-trades",
    "/onboarding",
    "/calibration",
  ];
  const items = routes.map((route) => ({
    id: `mobile-qa:${route}`,
    route,
    viewport: "mobile" as const,
    status: "contract_ready" as const,
    checks: [
      "No export or download controls are visible.",
      "No raw JSON or debug-only panels appear on end-user surfaces.",
      "Primary action is visible without horizontal scrolling.",
      "Cards stack cleanly in one column.",
      "Long broker, rule, and mistake labels wrap without overlap.",
    ],
  }));

  return {
    totalRoutes: items.length,
    noExportRouteCount: items.length,
    items,
  };
}

function buildWhyLayer(args: {
  harness: ImportTrialHarness;
  repairWizard: GuidedDataRepairWizard;
  cockpit: ReviewSessionCockpit;
  ruleLifecycle: RuleLifecycleSimulation;
  calibration: CalibrationDashboard;
}): WhyAmISeeingThisLayer {
  const explanations: WhyLayerExplanation[] = [
    {
      id: "why:import-trial",
      title: "Why broker fixture results appear",
      reason:
        "The app uses representative synthetic CSVs to verify parser, repair, and review behavior before real user imports exist.",
      evidenceLabels: args.harness.results
        .slice(0, 4)
        .map((result) => `${result.label}: ${result.status}`),
      relatedTradeIds: [],
      relatedFixtureIds: args.harness.results.slice(0, 4).map((result) => result.fixtureId),
      sourceModel: "ImportTrialHarness",
      limitation: "Fixture results are not a promise that every broker export variant is covered.",
    },
    {
      id: "why:repair-wizard",
      title: "Why repair steps appear",
      reason:
        "Repair steps are generated from parser diagnostics and import quality signals.",
      evidenceLabels: args.repairWizard.steps.slice(0, 4).map((step) => step.label),
      relatedTradeIds: [],
      relatedFixtureIds: args.repairWizard.steps.flatMap((step) =>
        step.affectedFixtureIds,
      ).slice(0, 6),
      sourceModel: "GuidedDataRepairWizard",
      limitation: "The wizard does not save or alter files; it describes the in-app repair path.",
    },
    {
      id: "why:cockpit",
      title: "Why cockpit priorities appear",
      reason:
        "Cockpit actions combine import readiness, repair needs, existing review queue, and rule draft readiness.",
      evidenceLabels: args.cockpit.actions.slice(0, 4).map((action) => action.title),
      relatedTradeIds: args.cockpit.actions.flatMap((action) =>
        action.relatedTradeIds,
      ).slice(0, 6),
      relatedFixtureIds: [],
      sourceModel: "ReviewSessionCockpit",
      limitation: "Market context is not used for cockpit ranking.",
    },
    {
      id: "why:rule-lifecycle",
      title: "Why rule lifecycle items appear",
      reason:
        "Rule lifecycle items are view-model simulations from repeated mistake-to-rule drafts.",
      evidenceLabels: args.ruleLifecycle.items.slice(0, 4).map((item) => item.ruleTitle),
      relatedTradeIds: args.ruleLifecycle.items.flatMap((item) =>
        item.relatedTradeIds,
      ).slice(0, 6),
      relatedFixtureIds: [],
      sourceModel: "RuleLifecycleSimulation",
      limitation: "No rule is persisted and no alternate P/L is estimated.",
    },
    {
      id: "why:calibration",
      title: "Why calibration is waiting",
      reason:
        "The app has fixture coverage but needs real imported trades before thresholds should be calibrated.",
      evidenceLabels: args.calibration.metrics.map((metric) => metric.label),
      relatedTradeIds: [],
      relatedFixtureIds: [],
      sourceModel: "CalibrationDashboard",
      limitation: "Calibration cannot be completed from synthetic fixtures alone.",
    },
  ];

  return {
    totalCount: explanations.length,
    explanations,
  };
}

function buildCalibrationDashboard(args: {
  harness: ImportTrialHarness;
  analytics: ImportTrialAnalyticsContext;
}): CalibrationDashboard {
  const metrics: CalibrationDashboardMetric[] = [
    {
      id: "synthetic_trials",
      label: "Synthetic fixture trials",
      value: args.harness.totalCount,
      target: 10,
      status: args.harness.totalCount >= 10 ? "watch" : "waiting_for_real_data",
      detail: "Representative fixtures are enough for parser regression, not behavior calibration.",
    },
    {
      id: "real_imports",
      label: "Real user imports",
      value: 0,
      target: 20,
      status: "waiting_for_real_data",
      detail: "Real imports are required before tuning thresholds.",
    },
    {
      id: "broker_breadth",
      label: "Broker fixture breadth",
      value: new Set(args.harness.fixtures.map((fixture) => fixture.broker)).size,
      target: 6,
      status: "watch",
      detail: "Broker breadth is representative and should be widened with anonymized real samples later.",
    },
    {
      id: "repair_rate",
      label: "Repair-needed fixture rate",
      value: Math.round(
        ((args.harness.needsRepairCount + args.harness.blockedCount) /
          Math.max(args.harness.totalCount, 1)) *
          100,
      ),
      target: 20,
      status: "watch",
      detail: "This rate intentionally includes edge-case fixtures.",
    },
    {
      id: "review_completion",
      label: "Review habit completion",
      value: args.analytics.reviewHabitLoop.reviewHabitTracker.completionPct,
      target: 80,
      status: "waiting_for_real_data",
      detail: "Completion needs real user behavior before product tuning.",
    },
  ];

  return {
    status: "waiting_for_real_imports",
    syntheticTrialCount: args.harness.totalCount,
    realImportCount: 0,
    marketContextUsedForCalibration: false,
    metrics,
    nextDataNeeded: [
      "Anonymized real broker CSV headers and row examples.",
      "Real import repair outcomes.",
      "Real saved trade review completion events.",
      "Real rule draft save/ignore decisions.",
      "Market context observations from levels-system after saved trades exist.",
    ],
    nextAction:
      "Use fixture trials for regression now; wait for real imports before calibrating thresholds.",
  };
}

function buildCopyTexts(args: {
  harness: ImportTrialHarness;
  repairWizard: GuidedDataRepairWizard;
  cockpit: ReviewSessionCockpit;
  calibration: CalibrationDashboard;
}): Array<{ sourceId: string; text: string }> {
  return [
    { sourceId: "harness-strategy", text: args.harness.fixtureStrategy },
    { sourceId: "repair-next-action", text: args.repairWizard.nextAction },
    { sourceId: "cockpit-summary", text: args.cockpit.summary },
    { sourceId: "calibration-next-action", text: args.calibration.nextAction },
    ...args.harness.results.map((result) => ({
      sourceId: `trial:${result.fixtureId}`,
      text: `${result.label}: ${result.nextAction}`,
    })),
    ...args.repairWizard.steps.map((step) => ({
      sourceId: step.id,
      text: `${step.label}: ${step.explanation} ${step.repairAction}`,
    })),
  ];
}

export function buildTraderImportTrialExperienceViewModel(args: {
  analytics: ImportTrialAnalyticsContext;
}): TraderImportTrialExperienceViewModel {
  const harness = buildImportTrialHarness();
  const repairWizard = buildGuidedDataRepairWizard(harness);
  const reviewCockpit = buildReviewSessionCockpit({
    analytics: args.analytics,
    harness,
    repairWizard,
  });
  const ruleLifecycleSimulation = buildRuleLifecycleSimulation(args.analytics);
  const replayVisualUpgrade = buildTradeReplayVisualUpgradeContract();
  const fixtureLibrary = buildBrokerFixtureLibrary(harness);
  const mobileQa = buildMobileProductQaPass();
  const calibrationDashboard = buildCalibrationDashboard({
    harness,
    analytics: args.analytics,
  });
  const copyQuality = buildProductCopyQualitySystem({
    texts: buildCopyTexts({
      harness,
      repairWizard,
      cockpit: reviewCockpit,
      calibration: calibrationDashboard,
    }),
  });
  const whyLayer = buildWhyLayer({
    harness,
    repairWizard,
    cockpit: reviewCockpit,
    ruleLifecycle: ruleLifecycleSimulation,
    calibration: calibrationDashboard,
  });

  return {
    source: "synthetic_fixture_trial",
    marketContextUsedForConclusions: false,
    harness,
    repairWizard,
    reviewCockpit,
    ruleLifecycleSimulation,
    replayVisualUpgrade,
    copyQuality,
    fixtureLibrary,
    mobileQa,
    whyLayer,
    calibrationDashboard,
  };
}
