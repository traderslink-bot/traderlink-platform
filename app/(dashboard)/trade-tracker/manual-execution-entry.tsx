"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import type {
  JournalManualTradeEntry,
  JournalManualTradePreview,
  JournalManualTrackerKind,
} from "@/src/modules/journal/contracts/journal-manual-trade-capture-contracts";
import { JOURNAL_MUTATION_REQUEST_HEADER } from "@/src/modules/platform/contracts/journal-request-security";
import {
  ExecutionEntryCard,
  type ExecutionDraft,
  type ExecutionSaveResult,
} from "./execution-entry-card";

type PreviewResponse = Readonly<{
  status?: string;
  code?: string;
  preview?: JournalManualTradePreview;
}>;

type CommitResponse = Readonly<{
  status?: string;
  code?: string;
  result?: Readonly<{
    acceptedExecutionCount?: number;
    affectedDates?: readonly string[];
    affectedPositionRefs?: readonly string[];
    pendingDecisionCount?: number;
  }>;
}>;

function friendlyFailure(code?: string): string {
  if (code === "TRADERLINK_MANUAL_TRADE_SINGLE_DAY_REQUIRED") {
    return "Enter executions for one trading day at a time.";
  }
  if (code === "TRADERLINK_MANUAL_TRADE_RECENT_ENTRY_REQUIRED") {
    return "These dates are outside the recent-entry window for this tracker.";
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
  tracker = "day",
}: {
  accountCurrency: string;
  accountTimezone: string;
  defaultSessionDate: string;
  expectedAccountSelectionRef: string;
  initialAction?: "add" | "reduce" | "close" | "record" | null;
  initialDirection?: "long" | "short";
  initialSymbol?: string;
  tracker?: JournalManualTrackerKind;
}) {
  const router = useRouter();
  const idempotencyKey = useRef<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);
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

  async function save(
    executions: readonly ExecutionDraft[],
  ): Promise<ExecutionSaveResult> {
    const currentIdempotencyKey = idempotencyKey.current ?? crypto.randomUUID();
    idempotencyKey.current = currentIdempotencyKey;
    const entryTimezone = tracker === "day" ? "America/New_York" : accountTimezone;
    const entries = executions.map((execution) =>
      tradeEntry(execution, accountCurrency, entryTimezone));
    const previewResponse = await fetch("/api/platform/journal/manual-trades/preview", {
      body: JSON.stringify({
        entries,
        expectedAccountSelectionRef,
        tracker,
      }),
      headers: {
        "content-type": "application/json",
        [JOURNAL_MUTATION_REQUEST_HEADER]: "1",
      },
      method: "POST",
    });
    const previewBody = await previewResponse.json() as PreviewResponse;
    if (
      !previewResponse.ok ||
      previewBody.status !== "ready" ||
      !previewBody.preview
    ) {
      throw new Error(friendlyFailure(previewBody.code));
    }

    const confirmations = previewBody.preview.groups.map((group) => Object.freeze({
      groupRef: group.groupRef,
      relationship: group.allowedRelationships.find((value) => value !== "not_finished") ??
        "not_finished",
      style: tracker === "swing" ? "swing" as const : "day_trade" as const,
      existingPositionRef: group.existingPosition?.positionRef ?? null,
      completeExecutionSetConfirmed: true,
    }));
    if (confirmations.some((confirmation) => confirmation.relationship === "not_finished")) {
      throw new Error("One trade needs more information before it can be saved.");
    }

    const commitResponse = await fetch("/api/platform/journal/manual-trades/commit", {
      body: JSON.stringify({
        confirmations,
        entries,
        expectedAccountSelectionRef,
        idempotencyKey: currentIdempotencyKey,
        previewRef: previewBody.preview.previewRef,
        tracker,
      }),
      headers: {
        "content-type": "application/json",
        [JOURNAL_MUTATION_REQUEST_HEADER]: "1",
      },
      method: "POST",
    });
    const commitBody = await commitResponse.json() as CommitResponse;
    if (!commitResponse.ok || commitBody.status !== "ready" || !commitBody.result) {
      throw new Error(friendlyFailure(commitBody.code));
    }

    idempotencyKey.current = null;
    router.refresh();
    return Object.freeze({
      status: "saved" as const,
      acceptedExecutionCount:
        commitBody.result.acceptedExecutionCount ?? entries.length,
      pendingDecisionCount: commitBody.result.pendingDecisionCount ?? 0,
    });
  }

  return (
    <ExecutionEntryCard
      collapsed={collapsed}
      allowMultipleTradingDates={tracker === "swing"}
      initialExecutions={submittedExecutions}
      onCollapsedChange={setCollapsed}
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
  );
}
