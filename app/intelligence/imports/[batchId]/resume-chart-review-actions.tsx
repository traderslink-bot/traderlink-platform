"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ResumeChartReviewActions({
  batchId,
  queuedCount,
}: {
  batchId: string;
  queuedCount: number;
}) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState("");

  async function resumeChartReview() {
    setIsPending(true);
    setMessage("Starting background chart data review...");

    try {
      const response = await fetch(
        `/api/import-batches/${encodeURIComponent(batchId)}/decision-review/resume`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ maxTrades: 1, runInBackground: true }),
        },
      );
      const body = await response.json().catch(() => null);

      if (!response.ok && response.status !== 202) {
        setMessage(
          body && typeof body.message === "string"
            ? body.message
            : "Chart data review could not be resumed.",
        );
        return;
      }

      setMessage(
        body && typeof body.message === "string"
          ? body.message
          : body && typeof body.selectedJobCount === "number"
          ? `Chart data review resumed for ${body.selectedJobCount} trade${body.selectedJobCount === 1 ? "" : "s"}.`
          : "Chart data review resumed.",
      );
      router.refresh();
      window.setTimeout(() => router.refresh(), 2500);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div
      className="mt-4 border border-sky-900 bg-sky-950/20 p-3"
      data-testid="resume-chart-review-actions"
    >
      <div className="text-sm font-semibold text-sky-100">
        Chart data can keep loading
      </div>
      <p className="mt-1 text-xs leading-5 text-sky-100/80">
        {queuedCount} saved trade{queuedCount === 1 ? "" : "s"} still need chart
        evidence. Resume the next chart-data review without blocking normal
        trade review.
      </p>
      <button
        className="mt-3 inline-flex min-h-10 items-center justify-center border border-sky-800 bg-sky-950/40 px-3 py-2 text-sm font-medium text-sky-100 transition hover:border-sky-400 disabled:opacity-50"
        disabled={isPending || queuedCount === 0}
        onClick={resumeChartReview}
        type="button"
      >
        {isPending ? "Starting..." : "Start background chart data review"}
      </button>
      <div
        className="mt-2 min-h-5 text-xs text-sky-100/70"
        data-testid="resume-chart-review-message"
      >
        {message}
      </div>
    </div>
  );
}
