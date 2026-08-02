"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import {
  ExecutionEntryCard,
  type ExecutionDraft,
  type ExecutionSaveResult,
} from "./execution-entry-card";

type ManualCommitResponse = Readonly<{
  status?: string;
  code?: string;
  result?: Readonly<{
    acceptedExecutionCount?: number;
    pendingDecisionCount?: number;
  }>;
}>;

export function ManualExecutionEntry({
  accountCurrency,
  accountTimezone,
  defaultSessionDate,
  expectedAccountSelectionRef,
}: {
  accountCurrency: string;
  accountTimezone: string;
  defaultSessionDate: string;
  expectedAccountSelectionRef: string;
}) {
  const router = useRouter();
  const idempotencyKey = useRef<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [submittedCount, setSubmittedCount] = useState<number | null>(null);
  const [submittedExecutions, setSubmittedExecutions] = useState<ExecutionDraft[]>([]);

  async function save(
    sessionDate: string,
    executions: readonly ExecutionDraft[],
  ): Promise<ExecutionSaveResult> {
    const currentIdempotencyKey = idempotencyKey.current ?? crypto.randomUUID();
    idempotencyKey.current = currentIdempotencyKey;
    const response = await fetch("/api/platform/journal/manual-executions", {
      body: JSON.stringify({
        entries: executions.map((execution) => ({
          currency: accountCurrency,
          date: sessionDate,
          fees: execution.fees,
          price: execution.price,
          quantity: execution.quantity,
          side: execution.side.toLowerCase(),
          sourceTimezone: accountTimezone,
          symbol: execution.symbol,
          time: execution.time,
          tradeIntent: execution.tradeIntent,
        })),
        idempotencyKey: currentIdempotencyKey,
        expectedAccountSelectionRef,
      }),
      headers: { "content-type": "application/json" },
      method: "POST",
    });
    const body = await response.json() as ManualCommitResponse;
    if (!response.ok || body.status !== "ready" || !body.result) {
      throw new Error(
        body.code === "TRADERLINK_JOURNAL_IMPORT_CONFLICT"
          ? "These executions changed after a save attempt. Review them and submit again."
          : "The executions could not be saved. Your entries are still in the form.",
      );
    }
    idempotencyKey.current = null;
    router.refresh();
    return Object.freeze({
      acceptedExecutionCount: body.result.acceptedExecutionCount ?? executions.length,
      pendingDecisionCount: body.result.pendingDecisionCount ?? 0,
    });
  }

  return (
    <ExecutionEntryCard
      collapsed={collapsed}
      dateEditable
      initialExecutions={submittedExecutions}
      onCollapsedChange={setCollapsed}
      onSave={save}
      onSubmitted={(count, executions) => {
        setSubmittedCount(count);
        setSubmittedExecutions(executions);
      }}
      sessionDate={defaultSessionDate}
      submittedCount={submittedCount}
    />
  );
}
