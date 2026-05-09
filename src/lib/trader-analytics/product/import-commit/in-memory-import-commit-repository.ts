import type {
  ImportCommitBatchRecord,
  ImportCommitDecisionReviewJobRecord,
  ImportCommitExecutionFeedbackSummaryRecord,
  ImportCommitExecutionRecord,
  ImportCommitIssueRecord,
  ImportCommitPlanResult,
  ImportCommitRepairItemRecord,
  ImportCommitRowRecord,
  ImportCommitSavedTradeExecutionLinkRecord,
  ImportCommitSavedTradeRecord,
  ImportCommitTradeGroupingDiagnosticRecord,
} from "./import-commit-planner";

export interface CommitImportBatchResult {
  status: "committed" | "rejected";
  batch: ImportCommitBatchRecord;
  savedTradeCount: number;
  executionCount: number;
  decisionReviewJobCount: number;
  message: string;
}

export interface ImportCommitRepository {
  savePreviewPlan(plan: ImportCommitPlanResult): void;
  getImportBatch(batchId: string): ImportCommitBatchRecord | null;
  commitImportPlan(plan: ImportCommitPlanResult): CommitImportBatchResult;
  discardImportBatch(batchId: string): void;
  listSavedTrades(accountId: string): ImportCommitSavedTradeRecord[];
  getSavedTrade(tradeId: string): ImportCommitSavedTradeRecord | null;
  listDecisionReviewJobs(batchId: string): ImportCommitDecisionReviewJobRecord[];
  getLatestCommittedBatch(accountId: string): ImportCommitBatchRecord | null;
}

export class InMemoryImportCommitRepository implements ImportCommitRepository {
  private readonly batches = new Map<string, ImportCommitBatchRecord>();
  private readonly rows = new Map<string, ImportCommitRowRecord>();
  private readonly issues = new Map<string, ImportCommitIssueRecord>();
  private readonly repairItems = new Map<string, ImportCommitRepairItemRecord>();
  private readonly executions = new Map<string, ImportCommitExecutionRecord>();
  private readonly savedTrades = new Map<string, ImportCommitSavedTradeRecord>();
  private readonly links = new Map<string, ImportCommitSavedTradeExecutionLinkRecord>();
  private readonly groupingDiagnostics = new Map<
    string,
    ImportCommitTradeGroupingDiagnosticRecord
  >();
  private readonly feedbackSummaries = new Map<
    string,
    ImportCommitExecutionFeedbackSummaryRecord
  >();
  private readonly decisionReviewJobs = new Map<
    string,
    ImportCommitDecisionReviewJobRecord
  >();

  savePreviewPlan(plan: ImportCommitPlanResult): void {
    this.batches.set(plan.batch.id, plan.batch);
    for (const row of plan.rows) {
      this.rows.set(row.id, row);
    }
    for (const issue of plan.issues) {
      this.issues.set(issue.id, issue);
    }
    for (const repairItem of plan.repairItems) {
      this.repairItems.set(repairItem.id, repairItem);
    }
  }

  getImportBatch(batchId: string): ImportCommitBatchRecord | null {
    return this.batches.get(batchId) ?? null;
  }

  commitImportPlan(plan: ImportCommitPlanResult): CommitImportBatchResult {
    this.savePreviewPlan(plan);

    if (!plan.canCommitNow) {
      const rejectedBatch: ImportCommitBatchRecord = {
        ...plan.batch,
        status: plan.status === "blocked" ? "needs_repair" : "previewed",
      };
      this.batches.set(rejectedBatch.id, rejectedBatch);

      return {
        status: "rejected",
        batch: rejectedBatch,
        savedTradeCount: 0,
        executionCount: 0,
        decisionReviewJobCount: 0,
        message: plan.readModel.nextAction,
      };
    }

    const committedBatch: ImportCommitBatchRecord = {
      ...plan.batch,
      status: "committed",
      updatedAt: plan.generatedAt,
    };
    this.batches.set(committedBatch.id, committedBatch);

    for (const execution of plan.executions) {
      this.executions.set(execution.id, execution);
    }
    for (const trade of plan.savedTrades) {
      this.savedTrades.set(trade.id, trade);
    }
    for (const link of plan.savedTradeExecutionLinks) {
      this.links.set(link.id, link);
    }
    for (const diagnostic of plan.groupingDiagnostics) {
      this.groupingDiagnostics.set(diagnostic.id, diagnostic);
    }
    for (const summary of plan.executionFeedbackSummaries) {
      this.feedbackSummaries.set(summary.id, summary);
    }
    for (const job of plan.decisionReviewJobs) {
      this.decisionReviewJobs.set(job.id, job);
    }

    return {
      status: "committed",
      batch: committedBatch,
      savedTradeCount: plan.savedTrades.length,
      executionCount: plan.executions.length,
      decisionReviewJobCount: plan.decisionReviewJobs.length,
      message: "Import committed to the in-memory repository.",
    };
  }

  discardImportBatch(batchId: string): void {
    const batch = this.batches.get(batchId);

    if (!batch) {
      return;
    }

    this.batches.set(batchId, {
      ...batch,
      status: "discarded",
      updatedAt: new Date().toISOString(),
    });
  }

  listSavedTrades(accountId: string): ImportCommitSavedTradeRecord[] {
    return [...this.savedTrades.values()]
      .filter((trade) => trade.accountId === accountId)
      .sort((left, right) => left.openedAt.localeCompare(right.openedAt));
  }

  getSavedTrade(tradeId: string): ImportCommitSavedTradeRecord | null {
    return this.savedTrades.get(tradeId) ?? null;
  }

  listDecisionReviewJobs(batchId: string): ImportCommitDecisionReviewJobRecord[] {
    return [...this.decisionReviewJobs.values()].filter(
      (job) => job.importBatchId === batchId,
    );
  }

  getLatestCommittedBatch(accountId: string): ImportCommitBatchRecord | null {
    return (
      [...this.batches.values()]
        .filter(
          (batch) =>
            batch.accountId === accountId && batch.status === "committed",
        )
        .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))[0] ??
      null
    );
  }
}

