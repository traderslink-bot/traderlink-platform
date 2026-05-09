import type { UserTradeAnalysisRequest } from "../../trade-analysis/request/trade-analysis-request-contract";
import { buildTradeAnalysisRequestFingerprint } from "../../execution-sources/import-fingerprints";
import type {
  ImportReconciliationBatch,
  ImportReconciliationItem,
  AnalysisConfidenceBadge,
  MarketContextCalibrationQueue,
  ProductDataRetentionPolicy,
  ProductPermissionSummary,
  ProductRouteAccessPolicy,
  ProductVisualQaCheck,
  ProductVisualQaPlan,
  SavedExecutionTrade,
  SavedTradeImportPreview,
  SavedTraderAnalyticsReport,
  TradeSetupTag,
  TradeTaggingSummary,
  TraderActionPlan,
  TraderAnalysisJob,
  TraderAnalysisJobQueue,
  TraderAnalyticsProductizationViewModel,
  TraderAnalyticsStorageMode,
  TraderFocusQueueItem,
  TraderReviewWorkflow,
  TraderReviewWorkflowItem,
  TraderRuleComplianceSummary,
  TraderWorkspace,
  TraderWorkspaceAccount,
  TraderWorkspaceSummary,
  TraderProductUser,
} from "./types";

function reportRowsWithTradeIds(report: SavedTraderAnalyticsReport) {
  return report.report.trades.map((row) => ({
    ...row,
    tradeId:
      report.sourceSummaries.find(
        (summaryRef) => summaryRef.requestIndex === row.requestIndex,
      )?.tradeId ??
      report.sourceTradeIds[row.tradeIndex - 1] ??
      `trade-${row.tradeIndex}`,
  }));
}

export function buildSampleWorkspaceContext(args: {
  userId: string;
  accountId: string;
  storageMode?: TraderAnalyticsStorageMode;
}): {
  user: TraderProductUser;
  workspace: TraderWorkspace;
  account: TraderWorkspaceAccount;
  summary: TraderWorkspaceSummary;
} {
  const workspace: TraderWorkspace = {
    id: "workspace-sample",
    name: "Sample Trading Workspace",
    ownerUserId: args.userId,
    accountIds: [args.accountId],
    sampleData: true,
  };
  const account: TraderWorkspaceAccount = {
    id: args.accountId,
    workspaceId: workspace.id,
    label: "Sample Account",
    brokerLabel: "Sample import",
    timezone: "America/New_York",
    baseCurrency: "USD",
    defaultBroker: "generic_execution_csv",
    supportedAssetClasses: ["stocks"],
    importDefaults: {
      timestampTimezone: "America/New_York",
      optionsHandling: "reject",
      maxTradeGroupingGapMinutes: 240,
      splitTradesAtSessionBoundary: true,
    },
    commissionHandling: "prefer_broker_net_amount",
    sampleData: true,
  };
  const user: TraderProductUser = {
    id: args.userId,
    displayName: "Sample Trader",
    role: "owner",
    sampleData: true,
  };
  const persistenceMode = args.storageMode ?? "sample_in_memory";
  const workspaceNextAction =
    persistenceMode === "authenticated_persistent"
      ? "Review connected accounts and saved reports."
      : persistenceMode === "local_sqlite_single_user"
        ? "Use this workspace for controlled single-user beta testing only; add auth before multi-user production."
        : "Choose auth and persistent storage before this workspace can hold real user data.";

  return {
    user,
    workspace,
    account,
    summary: {
      workspaceId: workspace.id,
      workspaceName: workspace.name,
      userId: user.id,
      userRole: user.role,
      activeAccountId: account.id,
      activeAccountLabel: account.label,
      brokerLabel: account.brokerLabel,
      accountTimezone: account.timezone,
      accountBaseCurrency: account.baseCurrency,
      accountCount: workspace.accountIds.length,
      sampleData: true,
      persistenceMode,
      nextAction: workspaceNextAction,
    },
  };
}

export function buildAnalysisConfidenceBadges(args?: {
  hasLevelsContext?: boolean;
  hasExperimentalMarketStructure?: boolean;
  marketStructureCalibrated?: boolean;
}): AnalysisConfidenceBadge[] {
  const hasLevelsContext = args?.hasLevelsContext ?? false;
  const hasExperimentalMarketStructure =
    args?.hasExperimentalMarketStructure ?? false;
  const marketStructureCalibrated = args?.marketStructureCalibrated ?? false;
  const badges: AnalysisConfidenceBadge[] = [
    {
      source: "execution_only",
      label: "Execution Only",
      confidence: "high",
      userVisible: true,
      marketStructureUsedForScoring: false,
      detail:
        "Feedback is based on timestamp, side, shares, price, position lifecycle, and P/L behavior.",
    },
  ];

  if (hasLevelsContext) {
    badges.push({
      source: "execution_plus_levels",
      label: "Execution + Levels",
      confidence: "medium",
      userVisible: true,
      marketStructureUsedForScoring: false,
      detail:
        "Support/resistance and dynamic levels are attached from levels-system.",
    });
  }

  if (hasExperimentalMarketStructure) {
    badges.push({
      source: "market_structure_observational",
      label: "Market Structure Observed",
      confidence: marketStructureCalibrated ? "medium" : "low",
      userVisible: false,
      marketStructureUsedForScoring: false,
      detail:
        "Market structure is visible for validation but does not affect scoring or final conclusions yet.",
    });
  }

  if (marketStructureCalibrated) {
    badges.push({
      source: "fully_calibrated_market_context",
      label: "Calibrated Market Context",
      confidence: "high",
      userVisible: true,
      marketStructureUsedForScoring: true,
      detail:
        "Market context has passed calibration gates and can be promoted intentionally.",
    });
  }

  return badges;
}

export function buildDefaultProductDataRetentionPolicy(): ProductDataRetentionPolicy {
  return {
    rawCsvRetentionDays: 0,
    rawRowRetentionDays: 30,
    normalizedExecutionRetention: "until_user_deletes_account",
    reportRetention: "until_user_deletes_account",
    userExportAllowed: false,
    deletionActions: [
      {
        id: "delete_import_batch",
        label: "Delete an import batch",
        deletesRawData: true,
        deletesNormalizedData: false,
        deletesReports: false,
      },
      {
        id: "delete_saved_trade",
        label: "Delete a saved trade",
        deletesRawData: false,
        deletesNormalizedData: true,
        deletesReports: false,
      },
      {
        id: "delete_trading_account",
        label: "Delete a trading account",
        deletesRawData: true,
        deletesNormalizedData: true,
        deletesReports: true,
      },
    ],
    summary:
      "Keep user analytics inside the app, avoid raw-file retention by default, and support in-app deletion without adding user-facing export controls.",
  };
}

export function buildImportReconciliationBatch(args: {
  batchId: string;
  preview: SavedTradeImportPreview;
  requests: UserTradeAnalysisRequest[];
  existingTrades: SavedExecutionTrade[];
}): ImportReconciliationBatch {
  const existingByFingerprint = new Map(
    args.existingTrades.map((trade) => [
      buildTradeAnalysisRequestFingerprint(trade.request),
      trade.id,
    ]),
  );
  const firstRequestIndexByFingerprint = new Map<string, number>();

  const items: ImportReconciliationItem[] = args.preview.items.map((item) => {
    const request = args.requests[item.requestIndex];
    const fingerprint =
      item.fingerprint ??
      (item.accepted && request
        ? buildTradeAnalysisRequestFingerprint(request)
        : null);
    const duplicateTradeId =
      item.accepted && fingerprint
        ? existingByFingerprint.get(fingerprint) ?? null
        : null;
    const duplicateOfRequestIndex =
      item.accepted && fingerprint && !duplicateTradeId
        ? firstRequestIndexByFingerprint.get(fingerprint) ?? null
        : null;
    const duplicateKind = duplicateTradeId
      ? "existing_saved_trade"
      : duplicateOfRequestIndex !== null
        ? "within_import_batch"
        : null;
    const status =
      item.errorCount > 0
        ? "rejected"
        : duplicateKind
          ? "duplicate"
          : item.warningCount > 0
            ? "needs_review"
            : "ready";

    if (
      item.accepted &&
      fingerprint &&
      duplicateTradeId === null &&
      duplicateOfRequestIndex === null
    ) {
      firstRequestIndexByFingerprint.set(fingerprint, item.requestIndex);
    }

    return {
      id: `${args.batchId}:${item.requestIndex}`,
      batchId: args.batchId,
      requestIndex: item.requestIndex,
      symbol: item.symbol,
      fingerprint,
      status,
      duplicateTradeId,
      duplicateOfRequestIndex,
      duplicateKind,
      issueCount: item.issueCount,
      warningCount: item.warningCount,
      errorCount: item.errorCount,
      recommendedAction:
        status === "ready"
          ? "Accept into saved analytics"
          : status === "needs_review"
            ? "Review warning before saving"
            : status === "duplicate"
              ? "Skip duplicate saved trade"
              : "Fix rejected import data",
      messages:
        item.messages.length > 0
          ? item.messages
          : duplicateTradeId
            ? [`Duplicate of saved trade ${duplicateTradeId}.`]
            : duplicateOfRequestIndex !== null
              ? [`Duplicate of request ${duplicateOfRequestIndex}.`]
            : ["Ready for saved analytics."],
    };
  });
  const duplicateItems = items.filter((item) => item.status === "duplicate");

  return {
    batchId: args.batchId,
    totalCount: items.length,
    readyCount: items.filter((item) => item.status === "ready").length,
    needsReviewCount: items.filter((item) => item.status === "needs_review")
      .length,
    duplicateCount: duplicateItems.length,
    existingDuplicateCount: duplicateItems.filter(
      (item) => item.duplicateKind === "existing_saved_trade",
    ).length,
    withinBatchDuplicateCount: duplicateItems.filter(
      (item) => item.duplicateKind === "within_import_batch",
    ).length,
    rejectedCount: items.filter((item) => item.status === "rejected").length,
    items,
  };
}

export function buildTraderReviewWorkflow(args: {
  report: SavedTraderAnalyticsReport;
  focusQueue: TraderFocusQueueItem[];
  ruleCompliance: TraderRuleComplianceSummary;
}): TraderReviewWorkflow {
  const items: TraderReviewWorkflowItem[] = [];

  for (const focus of args.focusQueue.slice(0, 3)) {
    items.push({
      id: `workflow:${focus.id}`,
      status: "needs_review",
      title: focus.title,
      summary: focus.summary,
      relatedTradeIds: focus.relatedTradeIds,
      priority: focus.rank,
    });
  }

  for (const note of args.report.notes) {
    items.push({
      id: `workflow:note:${note.id}`,
      status: "lesson_captured",
      title: "Lesson captured",
      summary: note.body,
      relatedTradeIds: args.report.sourceTradeIds,
      priority: 50,
    });
  }

  if (args.ruleCompliance.worstViolation) {
    items.push({
      id: `workflow:rule:${args.ruleCompliance.worstViolation.ruleId}`,
      status: "rule_created",
      title: `Rule focus: ${args.ruleCompliance.worstViolation.label}`,
      summary: `${args.ruleCompliance.worstViolation.violationCount} trades violated this rule.`,
      relatedTradeIds: args.ruleCompliance.worstViolation.tradeIds,
      priority: 10,
    });
  }

  const sorted = items.sort((left, right) => left.priority - right.priority);

  return {
    totalCount: sorted.length,
    needsReviewCount: sorted.filter((item) => item.status === "needs_review")
      .length,
    reviewedCount: sorted.filter((item) => item.status === "reviewed").length,
    lessonCapturedCount: sorted.filter(
      (item) => item.status === "lesson_captured",
    ).length,
    ruleCreatedCount: sorted.filter((item) => item.status === "rule_created")
      .length,
    resolvedCount: sorted.filter((item) => item.status === "resolved").length,
    items: sorted,
  };
}

const DEFAULT_SETUP_TAGS: TradeSetupTag[] = [
  { id: "long", label: "Long", source: "execution_only" },
  { id: "short", label: "Short", source: "execution_only" },
  { id: "scale_in", label: "Scale-In", source: "execution_only" },
  { id: "partial_exit", label: "Partial Exit", source: "execution_only" },
  { id: "open_position", label: "Open Position", source: "execution_only" },
  {
    id: "rapid_execution",
    label: "Rapid Execution",
    source: "execution_only",
  },
];

export function buildTradeTaggingSummary(
  report: SavedTraderAnalyticsReport,
): TradeTaggingSummary {
  const rows = reportRowsWithTradeIds(report);
  const rowsByTag = new Map<string, typeof rows>();

  for (const tag of DEFAULT_SETUP_TAGS) {
    rowsByTag.set(tag.id, []);
  }

  for (const row of rows) {
    const tagIds = [
      row.tradeDirection === "short" ? "short" : "long",
      row.addCountAfterInitialEntry > 0 ? "scale_in" : null,
      row.reductionCount > 1 ? "partial_exit" : null,
      row.isOpenPosition ? "open_position" : null,
      row.topRisk?.id === "rapid_fire_execution_cluster"
        ? "rapid_execution"
        : null,
    ].filter((tagId): tagId is string => tagId !== null);

    for (const tagId of tagIds) {
      rowsByTag.get(tagId)?.push(row);
    }
  }

  return {
    tags: DEFAULT_SETUP_TAGS,
    segments: DEFAULT_SETUP_TAGS.map((tag) => {
      const segmentRows = rowsByTag.get(tag.id) ?? [];
      const riskCounts = new Map<string, number>();
      const strengthCounts = new Map<string, number>();

      for (const row of segmentRows) {
        if (row.topRisk) {
          riskCounts.set(
            row.topRisk.label,
            (riskCounts.get(row.topRisk.label) ?? 0) + 1,
          );
        }

        if (row.topStrength) {
          strengthCounts.set(
            row.topStrength.label,
            (strengthCounts.get(row.topStrength.label) ?? 0) + 1,
          );
        }
      }

      const topRiskLabel =
        [...riskCounts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ??
        null;
      const topStrengthLabel =
        [...strengthCounts.entries()].sort(
          (left, right) => right[1] - left[1],
        )[0]?.[0] ?? null;

      return {
        tagId: tag.id,
        label: tag.label,
        tradeIds: segmentRows.map((row) => row.tradeId),
        tradeCount: segmentRows.length,
        grossTotalRealizedPnl: segmentRows.reduce(
          (total, row) => total + row.grossRealizedPnl,
          0,
        ),
        topRiskLabel,
        topStrengthLabel,
      };
    }).filter((segment) => segment.tradeCount > 0),
  };
}

export function buildTraderActionPlan(args: {
  report: SavedTraderAnalyticsReport;
  focusQueue: TraderFocusQueueItem[];
  ruleCompliance: TraderRuleComplianceSummary;
}): TraderActionPlan {
  const items = [];
  const primaryFocus = args.focusQueue[0];

  if (primaryFocus) {
    items.push({
      id: `action:${primaryFocus.id}`,
      title: primaryFocus.title,
      behaviorId: primaryFocus.id,
      measurementWindow: "Next 10 trades",
      successMetric: "Reduce repeated occurrence in the related focus category.",
      relatedTradeIds: primaryFocus.relatedTradeIds,
      priority: 1,
      status: "active" as const,
    });
  }

  if (args.ruleCompliance.worstViolation) {
    items.push({
      id: `action:rule:${args.ruleCompliance.worstViolation.ruleId}`,
      title: `Protect rule: ${args.ruleCompliance.worstViolation.label}`,
      behaviorId: args.ruleCompliance.worstViolation.ruleId,
      measurementWindow: "Next 10 trades",
      successMetric: "Zero violations for this rule.",
      relatedTradeIds: args.ruleCompliance.worstViolation.tradeIds,
      priority: 2,
      status: "queued" as const,
    });
  }

  const topStrength = args.report.report.topStrengths[0];
  if (topStrength) {
    items.push({
      id: `action:strength:${topStrength.id}`,
      title: `Preserve ${topStrength.label}`,
      behaviorId: topStrength.id,
      measurementWindow: "Next 5 winning or flat trades",
      successMetric: "Keep this strength visible in reviewed trades.",
      relatedTradeIds: reportRowsWithTradeIds(args.report)
        .filter((row) => row.topStrength?.id === topStrength.id)
        .map((row) => row.tradeId),
      priority: 3,
      status: "queued" as const,
    });
  }

  return {
    reportId: args.report.id,
    items,
    nextAction:
      items[0]?.title ??
      "Review more saved trades before building a behavior action plan.",
  };
}

export function buildProductPermissionSummary(): ProductPermissionSummary {
  const policies: ProductRouteAccessPolicy[] = [
    {
      route: "/analytics",
      audience: "end_user",
      requiresAuthenticatedUser: true,
      allowsRawJson: false,
      allowsExport: false,
      label: "Production analytics dashboard",
    },
    {
      route: "/trades/[tradeId]",
      audience: "end_user",
      requiresAuthenticatedUser: true,
      allowsRawJson: false,
      allowsExport: false,
      label: "Production trade review",
    },
    {
      route: "/debug/trade-analysis",
      audience: "admin_debug",
      requiresAuthenticatedUser: true,
      allowsRawJson: true,
      allowsExport: false,
      label: "Internal trade-analysis debug",
    },
    {
      route: "/debug/execution-feedback",
      audience: "admin_debug",
      requiresAuthenticatedUser: true,
      allowsRawJson: true,
      allowsExport: false,
      label: "Internal execution-feedback debug",
    },
    {
      route: "/debug/trader-analytics",
      audience: "admin_debug",
      requiresAuthenticatedUser: true,
      allowsRawJson: true,
      allowsExport: false,
      label: "Internal trader-analytics debug",
    },
  ];
  const productionPolicies = policies.filter(
    (policy) => policy.audience === "end_user",
  );
  const issues = productionPolicies.flatMap((policy) => {
    const policyIssues: string[] = [];

    if (policy.allowsRawJson) {
      policyIssues.push(`${policy.route} exposes raw JSON to end users.`);
    }

    if (policy.allowsExport) {
      policyIssues.push(`${policy.route} exposes export controls to end users.`);
    }

    return policyIssues;
  });

  return {
    productionRouteCount: productionPolicies.length,
    adminDebugRouteCount: policies.length - productionPolicies.length,
    endUserExportAllowed: productionPolicies.some((policy) => policy.allowsExport),
    rawJsonRestrictedToAdmin: policies
      .filter((policy) => policy.allowsRawJson)
      .every((policy) => policy.audience === "admin_debug"),
    policies,
    issues,
  };
}

export function buildTraderAnalysisJobQueue(
  reconciliation: ImportReconciliationBatch,
): TraderAnalysisJobQueue {
  const jobs: TraderAnalysisJob[] = reconciliation.items.map((item) => {
    const status =
      item.status === "ready"
        ? "queued"
        : item.status === "needs_review"
          ? "needs_user_fix"
          : item.status === "duplicate"
            ? "completed"
            : "failed";

    return {
      id: `job:${item.id}`,
      sourceItemId: item.id,
      symbol: item.symbol,
      status,
      summary:
        status === "queued"
          ? "Ready for execution-feedback and analytics processing."
          : status === "completed"
            ? "No analysis needed because this import matches an existing saved trade."
            : status === "needs_user_fix"
              ? "Waiting for user review before analysis."
              : "Import cannot be analyzed until rejected data is fixed.",
      nextAction:
        status === "queued"
          ? "Process when persistent storage is available."
          : item.recommendedAction,
    };
  });

  return {
    totalCount: jobs.length,
    queuedCount: jobs.filter((job) => job.status === "queued").length,
    processingCount: jobs.filter((job) => job.status === "processing").length,
    completedCount: jobs.filter((job) => job.status === "completed").length,
    failedCount: jobs.filter((job) => job.status === "failed").length,
    needsUserFixCount: jobs.filter((job) => job.status === "needs_user_fix")
      .length,
    jobs,
  };
}

export function buildProductVisualQaPlan(): ProductVisualQaPlan {
  const checks: ProductVisualQaCheck[] = [
    {
      id: "analytics-desktop",
      route: "/analytics",
      viewport: "desktop" as const,
      label: "Analytics desktop layout has no export controls or raw panels.",
      status: "pending",
    },
    {
      id: "analytics-mobile",
      route: "/analytics",
      viewport: "mobile" as const,
      label: "Analytics mobile layout preserves readable panels and controls.",
      status: "pending",
    },
    {
      id: "trade-detail-desktop",
      route: "/trades/[tradeId]",
      viewport: "desktop" as const,
      label: "Trade review desktop layout shows notes and execution timeline.",
      status: "pending",
    },
    {
      id: "trade-detail-mobile",
      route: "/trades/[tradeId]",
      viewport: "mobile" as const,
      label: "Trade review mobile layout keeps timeline text readable.",
      status: "pending",
    },
  ];

  return {
    totalCount: checks.length,
    passedCount: checks.filter((check) => check.status === "passed").length,
    needsReviewCount: checks.filter((check) => check.status !== "passed").length,
    checks,
  };
}

export function buildMarketContextCalibrationQueue(args: {
  trades: SavedExecutionTrade[];
}): MarketContextCalibrationQueue {
  const items = args.trades.map((trade) => ({
    id: `market-calibration:${trade.id}`,
    tradeId: trade.id,
    symbol: trade.symbol,
    status: trade.sampleData ? "sample_only" as const : "ready_for_calibration" as const,
    sampleData: trade.sampleData,
    reason: trade.sampleData
      ? "Sample trades are useful for UI checks but not production market-context calibration."
      : "Real saved trade can be included in market-context calibration.",
  }));

  return {
    totalCount: items.length,
    readyCount: items.filter((item) => item.status === "ready_for_calibration")
      .length,
    sampleOnlyCount: items.filter((item) => item.status === "sample_only")
      .length,
    items,
    executionAnalyticsIsolated: true,
    nextAction:
      items.some((item) => item.status === "ready_for_calibration")
        ? "Run the market-context calibration audit on real saved trades."
        : "Collect real saved trades before promoting market-context conclusions.",
  };
}

export function buildTraderAnalyticsProductizationViewModel(args: {
  userId: string;
  accountId: string;
  trades: SavedExecutionTrade[];
  report: SavedTraderAnalyticsReport;
  focusQueue: TraderFocusQueueItem[];
  ruleCompliance: TraderRuleComplianceSummary;
  importPreview: SavedTradeImportPreview;
  importRequests: UserTradeAnalysisRequest[];
  storageMode?: TraderAnalyticsStorageMode;
}): TraderAnalyticsProductizationViewModel {
  const workspace = buildSampleWorkspaceContext({
    userId: args.userId,
    accountId: args.accountId,
    storageMode: args.storageMode,
  });
  const reconciliation = buildImportReconciliationBatch({
    batchId: "sample-reconciliation",
    preview: args.importPreview,
    requests: args.importRequests,
    existingTrades: args.trades,
  });

  return {
    workspace: workspace.summary,
    reconciliation,
    reviewWorkflow: buildTraderReviewWorkflow({
      report: args.report,
      focusQueue: args.focusQueue,
      ruleCompliance: args.ruleCompliance,
    }),
    tagging: buildTradeTaggingSummary(args.report),
    actionPlan: buildTraderActionPlan({
      report: args.report,
      focusQueue: args.focusQueue,
      ruleCompliance: args.ruleCompliance,
    }),
    permissionSummary: buildProductPermissionSummary(),
    jobQueue: buildTraderAnalysisJobQueue(reconciliation),
    visualQa: buildProductVisualQaPlan(),
    marketContextCalibrationQueue: buildMarketContextCalibrationQueue({
      trades: args.trades,
    }),
    analysisConfidenceBadges: buildAnalysisConfidenceBadges({
      hasLevelsContext: true,
      hasExperimentalMarketStructure: true,
      marketStructureCalibrated: false,
    }),
    dataRetentionPolicy: buildDefaultProductDataRetentionPolicy(),
  };
}
