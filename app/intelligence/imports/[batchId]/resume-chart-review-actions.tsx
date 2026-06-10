"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

const BACKGROUND_BATCH_SIZE = 5;
const POLL_INTERVAL_MS = 4000;
const MAX_POLLS_PER_BATCH = 90;

type HydrationStatus = {
  contractVersion: "persisted_decision_review_status_v1";
  importBatchId: string;
  totalJobCount: number;
  savedTradeCount: number;
  queuedCount: number;
  completedCount: number;
  blockedOpenTradeCount: number;
  marketContextUnavailableCount: number;
  analysisFailedCount: number;
  skippedLimitCount: number;
  retryableCount: number;
  pendingWorkCount: number;
  processedCount: number;
  snapshotCount: number;
  diagnosticCount: number;
  canResume: boolean;
  nextAction: string;
};

type ResumeResponse = {
  selectedJobCount?: number;
  message?: string;
};

function countLabel(count: number, singular: string): string {
  return `${count} ${singular}${count === 1 ? "" : "s"}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export function ResumeChartReviewActions({
  batchId,
  totalCount,
  queuedCount,
  completedCount,
  analysisFailedCount,
  marketContextUnavailableCount,
  skippedLimitCount,
}: {
  batchId: string;
  totalCount: number;
  queuedCount: number;
  completedCount: number;
  analysisFailedCount: number;
  marketContextUnavailableCount: number;
  skippedLimitCount: number;
}) {
  const router = useRouter();
  const stopRequestedRef = useRef(false);
  const [isHydrating, setIsHydrating] = useState(false);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<HydrationStatus>({
    contractVersion: "persisted_decision_review_status_v1",
    importBatchId: batchId,
    totalJobCount: totalCount,
    savedTradeCount: totalCount,
    queuedCount,
    completedCount,
    blockedOpenTradeCount: 0,
    marketContextUnavailableCount,
    analysisFailedCount,
    skippedLimitCount,
    retryableCount: marketContextUnavailableCount + analysisFailedCount,
    pendingWorkCount:
      queuedCount + marketContextUnavailableCount + analysisFailedCount,
    processedCount:
      completedCount +
      marketContextUnavailableCount +
      analysisFailedCount +
      skippedLimitCount,
    snapshotCount: completedCount,
    diagnosticCount: marketContextUnavailableCount + analysisFailedCount,
    canResume:
      queuedCount + marketContextUnavailableCount + analysisFailedCount > 0,
    nextAction:
      queuedCount > 0
        ? "Continue chart data review for queued saved trades."
        : "Retry chart data review after market data is connected.",
  });

  const readyCount = Math.max(0, status.totalJobCount - status.pendingWorkCount);
  const progressPct =
    status.totalJobCount > 0
      ? Math.round((readyCount / status.totalJobCount) * 100)
      : 0;

  async function fetchStatus(): Promise<HydrationStatus> {
    const response = await fetch(
      `/api/import-batches/${encodeURIComponent(batchId)}/decision-review/status`,
      { cache: "no-store" },
    );

    if (!response.ok) {
      throw new Error("Chart data status could not be refreshed.");
    }

    const nextStatus = (await response.json()) as HydrationStatus;
    setStatus(nextStatus);
    return nextStatus;
  }

  async function startBackgroundBatch(): Promise<ResumeResponse> {
    const response = await fetch(
      `/api/import-batches/${encodeURIComponent(batchId)}/decision-review/resume`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          maxTrades: BACKGROUND_BATCH_SIZE,
          runInBackground: true,
        }),
      },
    );
    const body = (await response.json().catch(() => null)) as
      | ResumeResponse
      | null;

    if (!response.ok && response.status !== 202) {
      throw new Error(
        body?.message ?? "Chart data review could not be started.",
      );
    }

    return body ?? {};
  }

  async function waitForBatchProgress(args: {
    processedBaseline: number;
    pendingBaseline: number;
    selectedJobCount: number;
  }): Promise<HydrationStatus> {
    let latest = status;
    const targetProcessedCount =
      args.processedBaseline + args.selectedJobCount;
    const targetPendingCount = Math.max(
      0,
      args.pendingBaseline - args.selectedJobCount,
    );

    for (let pollIndex = 0; pollIndex < MAX_POLLS_PER_BATCH; pollIndex += 1) {
      if (stopRequestedRef.current) {
        return latest;
      }

      await sleep(POLL_INTERVAL_MS);
      latest = await fetchStatus();

      if (
        latest.processedCount >= targetProcessedCount ||
        latest.pendingWorkCount <= targetPendingCount ||
        latest.pendingWorkCount === 0
      ) {
        router.refresh();
        return latest;
      }
    }

    throw new Error(
      "Chart data is still running, but no progress has appeared yet. Refresh status before starting another batch.",
    );
  }

  async function runHydrationLoop() {
    stopRequestedRef.current = false;
    setIsHydrating(true);
    setMessage("Checking chart data status...");

    try {
      let latest = await fetchStatus();

      while (latest.pendingWorkCount > 0 && !stopRequestedRef.current) {
        const processedBaseline = latest.processedCount;
        const pendingBaseline = latest.pendingWorkCount;
        const started = await startBackgroundBatch();
        const selectedJobCount = started.selectedJobCount ?? 0;

        if (selectedJobCount <= 0) {
          setMessage(started.message ?? "No chart data work is waiting.");
          break;
        }

        setMessage(
          `Hydrating ${countLabel(
            selectedJobCount,
            "trade",
          )} in the background. Progress updates automatically.`,
        );
        latest = await waitForBatchProgress({
          processedBaseline,
          pendingBaseline,
          selectedJobCount,
        });
      }

      if (stopRequestedRef.current) {
        setMessage(
          "Stopped after the current progress check. Completed chart evidence stays saved.",
        );
      } else if (latest.pendingWorkCount === 0) {
        setMessage("Chart data hydration is caught up for this import.");
      }

      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setIsHydrating(false);
    }
  }

  async function refreshProgress() {
    try {
      await fetchStatus();
      setMessage("Chart data progress refreshed.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    }
  }

  function stopHydrationLoop() {
    stopRequestedRef.current = true;
    setMessage("Stopping after the current progress check...");
  }

  return (
    <div
      className="mt-4 border border-sky-900 bg-sky-950/20 p-3"
      data-testid="resume-chart-review-actions"
    >
      <div className="text-sm font-semibold text-sky-100">
        Chart data hydration
      </div>
      <p className="mt-1 text-xs leading-5 text-sky-100/80">
        {countLabel(status.completedCount, "trade")} complete,{" "}
        {countLabel(status.queuedCount, "trade")} waiting
        {status.retryableCount > 0
          ? `, and ${countLabel(status.retryableCount, "trade")} needing retry`
          : ""}
        . You can keep reviewing executions while chart evidence fills in.
      </p>
      <div className="mt-3" aria-label="Chart data hydration progress">
        <div className="h-2 overflow-hidden rounded-sm bg-zinc-950">
          <div
            className="h-full bg-sky-400 transition-all"
            style={{ width: `${Math.max(0, Math.min(100, progressPct))}%` }}
          />
        </div>
        <div className="mt-1 flex flex-wrap justify-between gap-2 text-xs text-sky-100/70">
          <span>{progressPct}% ready</span>
          <span>
            {readyCount}/{status.totalJobCount} chart-review jobs ready
          </span>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          className="inline-flex min-h-10 items-center justify-center border border-sky-800 bg-sky-950/40 px-3 py-2 text-sm font-medium text-sky-100 transition hover:border-sky-400 disabled:opacity-50"
          disabled={isHydrating || !status.canResume}
          onClick={runHydrationLoop}
          type="button"
        >
          {isHydrating ? "Hydrating..." : "Start background hydration"}
        </button>
        {isHydrating ? (
          <button
            className="inline-flex min-h-10 items-center justify-center border border-zinc-700 px-3 py-2 text-sm font-medium text-zinc-200 transition hover:border-zinc-400"
            onClick={stopHydrationLoop}
            type="button"
          >
            Stop after current batch
          </button>
        ) : (
          <button
            className="inline-flex min-h-10 items-center justify-center border border-zinc-800 px-3 py-2 text-sm font-medium text-zinc-300 transition hover:border-zinc-500"
            onClick={refreshProgress}
            type="button"
          >
            Refresh progress
          </button>
        )}
      </div>
      <div
        className="mt-2 min-h-5 text-xs text-sky-100/70"
        data-testid="resume-chart-review-message"
      >
        {message || status.nextAction}
      </div>
    </div>
  );
}
