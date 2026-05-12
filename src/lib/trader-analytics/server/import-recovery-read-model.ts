import type {
  ImportCommitBatchRecord,
  ImportCommitPlanResult,
  ImportCommitRepairItemRecord,
  ImportCommitSavedTradeRecord,
} from "../product/import-commit/import-commit-planner";
import type { SqliteImportCommitRepository } from "../product/import-commit/sqlite-import-commit-repository";

export type ImportRecoveryStatus =
  | "committed"
  | "ready_to_save"
  | "blocked_by_repairs"
  | "duplicate_review"
  | "needs_acknowledgement"
  | "discarded"
  | "blocked";

export interface ImportRecoveryAction {
  id: string;
  label: string;
  detail: string;
  kind: "link" | "save_import" | "discard_preview" | "section_anchor";
  href: string | null;
  tone: "primary" | "success" | "warning" | "danger" | "muted";
}

export interface ImportRecoveryDuplicateTrade {
  id: string;
  symbol: string;
  lifecycleStatus: ImportCommitSavedTradeRecord["lifecycleStatus"];
  openedAt: string;
  href: string;
}

export interface ImportRecoveryReadModel {
  contractVersion: "import_recovery_read_model_v1";
  batchId: string;
  status: ImportRecoveryStatus;
  title: string;
  detail: string;
  canSaveStoredPlan: boolean;
  canDiscard: boolean;
  counts: {
    openRepairs: number;
    fixRequiredRepairs: number;
    reviewDecisions: number;
    blockers: number;
    duplicateTrades: number;
    savedTrades: number;
  };
  duplicate: {
    duplicateFile: boolean;
    originalBatchId: string | null;
    originalBatchHref: string | null;
    duplicateTrades: ImportRecoveryDuplicateTrade[];
  };
  primaryAction: ImportRecoveryAction;
  secondaryActions: ImportRecoveryAction[];
}

function repairIsOpen(item: ImportCommitRepairItemRecord): boolean {
  return item.status === "open";
}

function makeAction(action: ImportRecoveryAction): ImportRecoveryAction {
  return action;
}

function uniqueActions(
  actions: ImportRecoveryAction[],
): ImportRecoveryAction[] {
  const seen = new Set<string>();
  return actions.filter((action) => {
    if (seen.has(action.id)) {
      return false;
    }
    seen.add(action.id);
    return true;
  });
}

export function buildImportRecoveryReadModel(args: {
  repository: SqliteImportCommitRepository;
  plan: ImportCommitPlanResult;
  batch: ImportCommitBatchRecord;
}): ImportRecoveryReadModel {
  const openRepairs = args.plan.repairItems.filter(repairIsOpen);
  const fixRequiredRepairs = openRepairs.filter(
    (repair) => repair.severity === "fix_required",
  );
  const blockers = args.plan.requiredDecisions.filter(
    (decision) => decision.severity === "blocked",
  );
  const reviewDecisions = args.plan.requiredDecisions.filter(
    (decision) => decision.severity === "review",
  );
  const originalBatch = args.plan.readModel.duplicateFile
    ? args.repository.getCommittedBatchByFileFingerprint({
        accountId: args.batch.accountId,
        fileFingerprint: args.batch.fileFingerprint,
        excludeBatchId: args.batch.id,
      })
    : null;
  const duplicateTrades = args.repository
    .listSavedTradesByFingerprints({
      accountId: args.batch.accountId,
      tradeFingerprints: args.plan.duplicateTradeFingerprints,
    })
    .map((trade) => ({
      id: trade.id,
      symbol: trade.symbol,
      lifecycleStatus: trade.lifecycleStatus,
      openedAt: trade.openedAt,
      href: `/trades/${encodeURIComponent(trade.id)}`,
    }));
  const canDiscard =
    args.batch.status !== "committed" && args.batch.status !== "discarded";
  const canSaveStoredPlan =
    args.plan.canCommitNow &&
    args.batch.status !== "committed" &&
    args.batch.status !== "discarded";
  const secondaryActions: ImportRecoveryAction[] = [];

  if (canDiscard) {
    secondaryActions.push(
      makeAction({
        id: "discard_preview",
        label: "Discard preview",
        detail: "Hide this import attempt from the active recovery queue.",
        kind: "discard_preview",
        href: null,
        tone: "muted",
      }),
    );
  }

  secondaryActions.push(
    makeAction({
      id: "new_import",
      label: "Open CSV dry run",
      detail: "Upload the corrected broker file or paste a fresh export.",
      kind: "link",
      href: "/import-dry-run",
      tone: "primary",
    }),
  );

  if (args.batch.status === "committed") {
    return {
      contractVersion: "import_recovery_read_model_v1",
      batchId: args.batch.id,
      status: "committed",
      title: "Import is saved",
      detail:
        "Saved trades, analytics, coach outputs, and review work are available from this import.",
      canSaveStoredPlan: false,
      canDiscard: false,
      counts: {
        openRepairs: openRepairs.length,
        fixRequiredRepairs: fixRequiredRepairs.length,
        reviewDecisions: reviewDecisions.length,
        blockers: blockers.length,
        duplicateTrades: duplicateTrades.length,
        savedTrades: args.plan.savedTrades.length,
      },
      duplicate: {
        duplicateFile: args.plan.readModel.duplicateFile,
        originalBatchId: originalBatch?.id ?? null,
        originalBatchHref: originalBatch
          ? `/imports/${encodeURIComponent(originalBatch.id)}`
          : null,
        duplicateTrades,
      },
      primaryAction: makeAction({
        id: "review_trades",
        label: "Review saved trades",
        detail: "Open the saved trades created by this import.",
        kind: "link",
        href: "/trades",
        tone: "success",
      }),
      secondaryActions: uniqueActions([
        makeAction({
          id: "open_analytics",
          label: "Open analytics",
          detail: "Review performance updates from saved trades.",
          kind: "link",
          href: "/analytics",
          tone: "primary",
        }),
      ]),
    };
  }

  if (args.batch.status === "discarded") {
    return {
      contractVersion: "import_recovery_read_model_v1",
      batchId: args.batch.id,
      status: "discarded",
      title: "Import preview was discarded",
      detail:
        "This attempt is kept in history for audit context, but it is no longer active recovery work.",
      canSaveStoredPlan: false,
      canDiscard: false,
      counts: {
        openRepairs: openRepairs.length,
        fixRequiredRepairs: fixRequiredRepairs.length,
        reviewDecisions: reviewDecisions.length,
        blockers: blockers.length,
        duplicateTrades: duplicateTrades.length,
        savedTrades: args.plan.savedTrades.length,
      },
      duplicate: {
        duplicateFile: args.plan.readModel.duplicateFile,
        originalBatchId: originalBatch?.id ?? null,
        originalBatchHref: originalBatch
          ? `/imports/${encodeURIComponent(originalBatch.id)}`
          : null,
        duplicateTrades,
      },
      primaryAction: makeAction({
        id: "new_import",
        label: "Open CSV dry run",
        detail: "Start a clean import attempt with a new or corrected file.",
        kind: "link",
        href: "/import-dry-run",
        tone: "primary",
      }),
      secondaryActions: [],
    };
  }

  if (fixRequiredRepairs.length > 0 || blockers.length > 0) {
    return {
      contractVersion: "import_recovery_read_model_v1",
      batchId: args.batch.id,
      status: "blocked_by_repairs",
      title: "Import is blocked by repair work",
      detail:
        "Fix required rows or blocking decisions before this data should be saved or trusted for coaching.",
      canSaveStoredPlan,
      canDiscard,
      counts: {
        openRepairs: openRepairs.length,
        fixRequiredRepairs: fixRequiredRepairs.length,
        reviewDecisions: reviewDecisions.length,
        blockers: blockers.length,
        duplicateTrades: duplicateTrades.length,
        savedTrades: args.plan.savedTrades.length,
      },
      duplicate: {
        duplicateFile: args.plan.readModel.duplicateFile,
        originalBatchId: originalBatch?.id ?? null,
        originalBatchHref: originalBatch
          ? `/imports/${encodeURIComponent(originalBatch.id)}`
          : null,
        duplicateTrades,
      },
      primaryAction: makeAction({
        id: "review_repairs",
        label: "Review repair items",
        detail: "Jump to the repair actions for this import.",
        kind: "section_anchor",
        href: "#repair-actions",
        tone: "warning",
      }),
      secondaryActions: uniqueActions(secondaryActions),
    };
  }

  if (
    args.plan.readModel.duplicateFile ||
    args.plan.readModel.duplicateTradeCount > 0
  ) {
    const duplicateActions = [
      originalBatch
        ? makeAction({
            id: "open_original_import",
            label: "Open original import",
            detail: "Review the saved import that already used this file.",
            kind: "link",
            href: `/imports/${encodeURIComponent(originalBatch.id)}`,
            tone: "primary",
          })
        : null,
      duplicateTrades[0]
        ? makeAction({
            id: "open_duplicate_trade",
            label: "Open duplicated trade",
            detail: "Inspect the saved trade that already matches this import.",
            kind: "link",
            href: duplicateTrades[0].href,
            tone: "primary",
          })
        : null,
    ].filter((action): action is ImportRecoveryAction => Boolean(action));

    return {
      contractVersion: "import_recovery_read_model_v1",
      batchId: args.batch.id,
      status: "duplicate_review",
      title: "Import looks like a duplicate",
      detail:
        "This file or one or more grouped trades already exist. Review the saved copy before deciding whether to discard or intentionally re-import.",
      canSaveStoredPlan,
      canDiscard,
      counts: {
        openRepairs: openRepairs.length,
        fixRequiredRepairs: fixRequiredRepairs.length,
        reviewDecisions: reviewDecisions.length,
        blockers: blockers.length,
        duplicateTrades: duplicateTrades.length,
        savedTrades: args.plan.savedTrades.length,
      },
      duplicate: {
        duplicateFile: args.plan.readModel.duplicateFile,
        originalBatchId: originalBatch?.id ?? null,
        originalBatchHref: originalBatch
          ? `/imports/${encodeURIComponent(originalBatch.id)}`
          : null,
        duplicateTrades,
      },
      primaryAction:
        duplicateActions[0] ??
        makeAction({
          id: "review_duplicate",
          label: "Review duplicate details",
          detail: "Inspect duplicate file and trade counts before continuing.",
          kind: "section_anchor",
          href: "#duplicate-details",
          tone: "warning",
        }),
      secondaryActions: uniqueActions([
        ...duplicateActions.slice(1),
        ...secondaryActions,
      ]),
    };
  }

  if (reviewDecisions.length > 0 || openRepairs.length > 0) {
    return {
      contractVersion: "import_recovery_read_model_v1",
      batchId: args.batch.id,
      status: "needs_acknowledgement",
      title: "Import needs review acknowledgements",
      detail:
        "The rows are usable, but mapping, P/L, grouping, anomaly, or open-position review still needs a deliberate confirmation.",
      canSaveStoredPlan,
      canDiscard,
      counts: {
        openRepairs: openRepairs.length,
        fixRequiredRepairs: fixRequiredRepairs.length,
        reviewDecisions: reviewDecisions.length,
        blockers: blockers.length,
        duplicateTrades: duplicateTrades.length,
        savedTrades: args.plan.savedTrades.length,
      },
      duplicate: {
        duplicateFile: args.plan.readModel.duplicateFile,
        originalBatchId: originalBatch?.id ?? null,
        originalBatchHref: originalBatch
          ? `/imports/${encodeURIComponent(originalBatch.id)}`
          : null,
        duplicateTrades,
      },
      primaryAction: makeAction({
        id: "review_decisions",
        label: "Review decisions",
        detail: "Inspect the required decisions before saving this import.",
        kind: "section_anchor",
        href: "#import-decisions",
        tone: "warning",
      }),
      secondaryActions: uniqueActions(secondaryActions),
    };
  }

  if (canSaveStoredPlan) {
    return {
      contractVersion: "import_recovery_read_model_v1",
      batchId: args.batch.id,
      status: "ready_to_save",
      title: "Import is ready to save",
      detail:
        "The preview can be saved now. Saving will create saved executions, trades, reports, and review work.",
      canSaveStoredPlan,
      canDiscard,
      counts: {
        openRepairs: openRepairs.length,
        fixRequiredRepairs: fixRequiredRepairs.length,
        reviewDecisions: reviewDecisions.length,
        blockers: blockers.length,
        duplicateTrades: duplicateTrades.length,
        savedTrades: args.plan.savedTrades.length,
      },
      duplicate: {
        duplicateFile: args.plan.readModel.duplicateFile,
        originalBatchId: originalBatch?.id ?? null,
        originalBatchHref: originalBatch
          ? `/imports/${encodeURIComponent(originalBatch.id)}`
          : null,
        duplicateTrades,
      },
      primaryAction: makeAction({
        id: "save_import",
        label: "Save import",
        detail: "Save this preview to saved import data.",
        kind: "save_import",
        href: null,
        tone: "success",
      }),
      secondaryActions: uniqueActions(secondaryActions),
    };
  }

  return {
    contractVersion: "import_recovery_read_model_v1",
    batchId: args.batch.id,
    status: "blocked",
    title: "Import is not ready",
    detail: args.plan.readModel.nextAction,
    canSaveStoredPlan,
    canDiscard,
    counts: {
      openRepairs: openRepairs.length,
      fixRequiredRepairs: fixRequiredRepairs.length,
      reviewDecisions: reviewDecisions.length,
      blockers: blockers.length,
      duplicateTrades: duplicateTrades.length,
      savedTrades: args.plan.savedTrades.length,
    },
    duplicate: {
      duplicateFile: args.plan.readModel.duplicateFile,
      originalBatchId: originalBatch?.id ?? null,
      originalBatchHref: originalBatch
        ? `/imports/${encodeURIComponent(originalBatch.id)}`
        : null,
      duplicateTrades,
    },
    primaryAction: makeAction({
      id: "new_import",
      label: "Open CSV dry run",
      detail: "Try again with a corrected broker export.",
      kind: "link",
      href: "/import-dry-run",
      tone: "primary",
    }),
    secondaryActions: uniqueActions(secondaryActions),
  };
}
