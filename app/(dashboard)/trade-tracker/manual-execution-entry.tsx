"use client";

import { usePathname, useRouter } from "next/navigation";
import { useRef, useState } from "react";

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
  submitManualTradeOnline,
} from "@/src/modules/platform/client/pwa/manual-trade-outbox";

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
  initialRowCount = 2,
  initialSymbol = "",
  onboarding = false,
  offlineScopeRef,
  onSaved,
  tracker = "day",
}: {
  accountCurrency: string;
  accountTimezone: string;
  defaultSessionDate: string;
  expectedAccountSelectionRef: string;
  initialAction?: "add" | "reduce" | "close" | "record" | null;
  initialDirection?: "long" | "short";
  initialRowCount?: 1 | 2;
  initialSymbol?: string;
  onboarding?: boolean;
  offlineScopeRef: string;
  onSaved?: () => void;
  tracker?: JournalManualTrackerKind;
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
      : initialRowCount === 1
        ? [{
            date: defaultSessionDate,
            fees: "",
            id: 1,
            price: "",
            quantity: "",
            side: "BUY",
            symbol: "",
            time: "",
          }]
        : [],
  );
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
      const result = await submitManualTradeOnline(submission);
      idempotencyKey.current = null;
      if (onSaved) {
        onSaved();
        return Object.freeze({ status: "saved" as const, ...result });
      }
      const submittedTradingDate = tracker === "day" ? result.affectedDates[0] : null;
      if (submittedTradingDate) {
        const submittedDayPath = `/trade-tracker/${encodeURIComponent(submittedTradingDate)}`;
        const postSaveOutcome = result.analyzerQueueOutcome === "connection_required" ||
          result.analyzerQueueOutcome === "not_eligible"
          ? `?analyzer=${result.analyzerQueueOutcome}`
          : "";
        if (pathname === submittedDayPath && postSaveOutcome.length === 0) router.refresh();
        else router.replace(`${submittedDayPath}${postSaveOutcome}`);
      } else if (onboarding) {
        router.replace("/trade-tracker");
      } else {
        router.refresh();
      }
      return Object.freeze({ status: "saved" as const, ...result });
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

  return (
    <>
      <TradeOutboxStatus
        accountSelectionRef={expectedAccountSelectionRef}
        offlineScopeRef={offlineScopeRef}
      />
      <ExecutionEntryCard
      collapsed={collapsed}
      allowMultipleTradingDates={tracker !== "day"}
      entryMode={tracker === "workspace" ? "day" : tracker}
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
    </>
  );
}
