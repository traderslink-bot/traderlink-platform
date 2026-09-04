"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography } from "@mui/material";

import type {
  JournalManualTradeEntry,
  JournalManualTrackerKind,
} from "@/src/modules/journal/contracts/journal-manual-trade-capture-contracts";
import {
  ExecutionEntryCard,
  type ExecutionDraft,
  type ExecutionSaveResult,
} from "./execution-entry-card";
import { useTradeTrackerUnsavedChanges } from "./trade-tracker-unsaved-changes";
import { TradeOutboxStatus } from "@/app/pwa/trade-outbox-status";
import {
  ManualTradeNeedsReviewError,
  ManualTradeNetworkError,
  queueManualTradeSubmission,
  commitManualTradeOnline,
  previewManualTradeOnline,
  type ManualTradeSubmission,
  type ManualTradeSubmitResult,
} from "@/src/modules/platform/client/pwa/manual-trade-outbox";
import { ManualTradePostEntryReview, type PreviewLogicalTradeMerge } from "./manual-trade-post-entry-review";

function friendlyFailure(
  code: string | undefined,
  tracker: JournalManualTrackerKind,
): string {
  if (code === "TRADERLINK_MANUAL_TRADE_SINGLE_DAY_REQUIRED") {
    return "Enter executions for one trading day at a time.";
  }
  if (code === "TRADERLINK_MANUAL_TRADE_RECENT_ENTRY_REQUIRED") {
    if (tracker === "day") {
      return "You can only enter trades or executions that occurred on the same day. You cannot enter future times or dates.";
    }
    if (tracker === "swing") {
      return "Check the execution dates and times. New swing entries must be current or recently closed, and future executions cannot be saved. Use Imports for older completed trades.";
    }
    return "Check the execution date and time. Future executions cannot be saved.";
  }
  if (
    code === "TRADERLINK_ACCOUNT_SELECTION_CONFLICT" ||
    code === "TRADERLINK_MANUAL_TRADE_RELATIONSHIP_CONFLICT"
  ) {
    return "The selected account or an open trade changed. Review the executions again.";
  }
  return "The trades could not be saved. Your executions are still in the form.";
}

function tradeEntry(
  execution: ExecutionDraft,
  accountCurrency: string,
  accountTimezone: string,
): JournalManualTradeEntry {
  return Object.freeze({
    clientRowRef: `row-${execution.id}`,
    localDate: execution.date,
    localTime: execution.time.length === 5 ? `${execution.time}:00` : execution.time,
    sourceTimezone: accountTimezone,
    normalizedSymbol: execution.symbol,
    tradeCurrency: accountCurrency,
    side: execution.side.toLowerCase() as "buy" | "sell",
    quantityDecimal: execution.quantity,
    priceDecimal: execution.price,
    feesDecimal: execution.fees || null,
  });
}

export function ManualExecutionEntry({
  accountCurrency,
  accountTimezone,
  defaultSessionDate,
  expectedAccountSelectionRef,
  initialAction = null,
  initialDirection = "long",
  initialSymbol = "",
  onboarding = false,
  offlineScopeRef,
  tracker = "day",
}: {
  accountCurrency: string;
  accountTimezone: string;
  defaultSessionDate: string;
  expectedAccountSelectionRef: string;
  initialAction?: "add" | "reduce" | "close" | "record" | null;
  initialDirection?: "long" | "short";
  initialSymbol?: string;
  onboarding?: boolean;
  offlineScopeRef: string;
  tracker?: Exclude<JournalManualTrackerKind, "workspace">;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const idempotencyKey = useRef<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [draftDirty, setDraftDirty] = useState(false);
  const [submittedCount, setSubmittedCount] = useState<number | null>(null);
  const [submittedExecutions, setSubmittedExecutions] = useState<ExecutionDraft[]>(() =>
    initialSymbol
      ? initialAction && initialAction !== "record"
        ? [{
            date: defaultSessionDate,
            fees: "",
            id: 1,
            price: "",
            quantity: "",
            side: (initialAction === "add") === (initialDirection === "long")
              ? "BUY"
              : "SELL",
            symbol: initialSymbol.toUpperCase(),
            time: "",
          }]
        : [
          {
            date: defaultSessionDate,
            fees: "",
            id: 1,
            price: "",
            quantity: "",
            side: "BUY",
            symbol: initialSymbol.toUpperCase(),
            time: "",
          },
          ]
      : [],
  );
  const [analyzerUses, setAnalyzerUses] = useState<Readonly<{
    enabled: boolean; dailyAvailable: number; periodAvailable: number; selectableAvailable: number; daysUntilReset: number;
  }> | null>(null);
  const [analyzerGroupRefs, setAnalyzerGroupRefs] = useState<readonly string[]>([]);
  const [logicalTradeMerges, setLogicalTradeMerges] = useState<readonly PreviewLogicalTradeMerge[]>([]);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [pendingReview, setPendingReview] = useState<Readonly<{
    submission: ManualTradeSubmission;
    preview: Awaited<ReturnType<typeof previewManualTradeOnline>>;
    resolve: (result: ExecutionSaveResult) => void;
    reject: (error: Error) => void;
  }> | null>(null);
  const loadAnalyzerUses = async () => {
    try {
      const response = await fetch("/api/platform/daily-trade-analyzer/allowance", { cache: "no-store" });
      const result = await response.json() as { availability?: typeof analyzerUses };
      if (response.ok) setAnalyzerUses(result.availability ?? null);
    } catch { /* Entry remains available when the allowance display is unavailable. */ }
  };
  useEffect(() => { void loadAnalyzerUses(); }, []);
  useTradeTrackerUnsavedChanges(
    `daily-trade-tracker:manual-execution:${tracker}`,
    draftDirty,
  );

  async function save(
    executions: readonly ExecutionDraft[],
  ): Promise<ExecutionSaveResult> {
    const currentIdempotencyKey = idempotencyKey.current ?? crypto.randomUUID();
    idempotencyKey.current = currentIdempotencyKey;
    const entryTimezone = tracker === "swing" ? accountTimezone : "America/New_York";
    const entries = executions.map((execution) =>
      tradeEntry(execution, accountCurrency, entryTimezone));
    const submission = Object.freeze({
      entries,
      expectedAccountSelectionRef,
      idempotencyKey: currentIdempotencyKey,
      tracker,
    });
    if (!navigator.onLine) {
      await queueManualTradeSubmission({ offlineScopeRef, submission });
      idempotencyKey.current = null;
      return Object.freeze({
        status: "queued" as const,
        acceptedExecutionCount: entries.length,
        pendingDecisionCount: 0,
      });
    }
    try {
      const preview = await previewManualTradeOnline(submission);
      const result = await new Promise<ExecutionSaveResult>((resolve, reject) => {
        setAnalyzerGroupRefs([]);
        setLogicalTradeMerges([]);
        setReviewError(null);
        setPendingReview({ submission, preview, resolve, reject });
      });
      return result;
    } catch (error) {
      if (error instanceof ManualTradeNetworkError) {
        await queueManualTradeSubmission({
          offlineScopeRef,
          submission,
          commitAttempted: error.stage === "commit",
        });
        idempotencyKey.current = null;
        return Object.freeze({
          status: "queued" as const,
          acceptedExecutionCount: entries.length,
          pendingDecisionCount: 0,
        });
      }
      if (error instanceof ManualTradeNeedsReviewError) {
        throw new Error(friendlyFailure(error.code, tracker));
      }
      throw error;
    }
  }

  function finishSavedResult(result: ManualTradeSubmitResult): ExecutionSaveResult {
      idempotencyKey.current = null;
      const submittedTradingDate = tracker === "day" ? result.affectedDates[0] : null;
      if (submittedTradingDate) {
        const submittedDayPath = `/trade-tracker/${encodeURIComponent(submittedTradingDate)}`;
        if (pathname === submittedDayPath) router.refresh();
        else router.replace(submittedDayPath);
      } else if (onboarding) {
        router.replace("/trade-tracker");
      } else {
        router.refresh();
      }
      return Object.freeze({ status: "saved" as const, ...result });
  }

  async function confirmReview() {
    if (!pendingReview) return;
    const pending = pendingReview;
    try {
      const result = await commitManualTradeOnline(pending.submission, pending.preview, { analyzerGroupRefs, logicalTradeMerges });
      pending.resolve(finishSavedResult(result));
      void loadAnalyzerUses();
    } catch (error) {
      pending.reject(error instanceof Error ? error : new Error("The trades could not be saved."));
    } finally {
      setPendingReview(null);
    }
  }

  return (
    <>
      <TradeOutboxStatus
        accountSelectionRef={expectedAccountSelectionRef}
        offlineScopeRef={offlineScopeRef}
      />
      <ExecutionEntryCard
      collapsed={collapsed}
      allowMultipleTradingDates={tracker !== "day"}
      entryMode={tracker}
      initialExecutions={submittedExecutions}
      onCollapsedChange={setCollapsed}
      onDirtyChange={setDraftDirty}
      onSave={save}
      onStartAnother={() => {
        idempotencyKey.current = null;
        setSubmittedCount(null);
        setSubmittedExecutions([]);
      }}
      onSubmitted={(count, executions) => {
        setSubmittedCount(count);
        setSubmittedExecutions(executions);
      }}
      sessionDate={defaultSessionDate}
      submittedCount={submittedCount}
      />
      <Dialog fullWidth maxWidth="sm" open={pendingReview !== null} onClose={() => {
        pendingReview?.reject(new Error("Review the trades before saving."));
        setPendingReview(null);
      }}>
        <DialogTitle>Review trades found</DialogTitle>
        <DialogContent><Stack spacing={1.5}>
          {pendingReview ? <ManualTradePostEntryReview analyzerGroupRefs={analyzerGroupRefs} analyzerUses={analyzerUses} groups={pendingReview.preview.groups} merges={logicalTradeMerges} onAnalyzerGroupRefsChange={setAnalyzerGroupRefs} onError={setReviewError} onMergesChange={setLogicalTradeMerges} /> : null}
          {reviewError ? <Typography color="error.main" variant="body2">{reviewError}</Typography> : null}
        </Stack></DialogContent>
        <DialogActions><Button onClick={() => {
          pendingReview?.reject(new Error("Review the trades before saving."));
          setPendingReview(null);
        }}>Cancel</Button><Button onClick={() => void confirmReview()} variant="contained">Save trades</Button></DialogActions>
      </Dialog>
    </>
  );
}
