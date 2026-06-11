"use client";

import { useState, type FormEvent } from "react";

type UploadStatus = "idle" | "uploading" | "saving" | "error";

interface UploadResult {
  tone: "success" | "attention";
  title: string;
  message: string;
  href: string;
  actionLabel: string;
}

interface ImportPreviewPlanResponse {
  plan?: {
    canCommitNow: boolean;
    batch: {
      id: string;
    };
    readModel?: {
      duplicateFile?: boolean;
      duplicateTradeCount?: number;
      nextAction?: string;
    };
    requiredDecisions?: Array<{
      kind?: string;
      message: string;
    }>;
  };
  error?: {
    message?: string;
  };
}

interface ImportCommitResponse {
  result?: {
    message?: string;
  };
  error?: {
    message?: string;
  };
}

interface ChartReviewResumeResponse {
  selectedJobCount?: number;
  message?: string;
}

interface UploadCsvClientProps {
  chartTierEnabled: boolean;
}

function friendlyError(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return "We could not upload this CSV. Try the file again.";
}

async function readApiJson<T>(
  response: Response,
  fallbackMessage: string,
): Promise<T> {
  const contentType = response.headers.get("content-type") ?? "";
  const responseText = await response.text();

  if (!contentType.toLowerCase().includes("application/json")) {
    throw new Error(
      response.status === 404
        ? "The upload service was not ready. Refresh the page and try again."
        : fallbackMessage,
    );
  }

  try {
    return JSON.parse(responseText) as T;
  } catch {
    throw new Error(fallbackMessage);
  }
}

function uploadReviewResult(plan: NonNullable<ImportPreviewPlanResponse["plan"]>): UploadResult {
  const batchId = plan.batch.id;
  const looksDuplicate =
    Boolean(plan.readModel?.duplicateFile) ||
    (plan.readModel?.duplicateTradeCount ?? 0) > 0 ||
    Boolean(
      plan.requiredDecisions?.some(
        (decision) =>
          decision.kind === "resolve_duplicate_file" ||
          decision.kind === "resolve_duplicate_trade",
      ),
    );

  if (looksDuplicate) {
    return {
      tone: "attention",
      title: "This CSV may already be saved",
      message:
        "The app found a possible duplicate. Open the import details to confirm what was detected before saving anything again.",
      href: `/intelligence/imports/${encodeURIComponent(batchId)}`,
      actionLabel: "Review duplicate",
    };
  }

  return {
    tone: "attention",
    title: "CSV uploaded. A quick review is needed",
    message:
      plan.readModel?.nextAction ??
      "The app checked the file and found something it wants you to confirm before saving the trades.",
    href: `/intelligence/imports/${encodeURIComponent(batchId)}`,
    actionLabel: "Review and continue",
  };
}

export function UploadCsvClient({ chartTierEnabled }: UploadCsvClientProps) {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [chartReviewMessage, setChartReviewMessage] = useState<string | null>(
    null,
  );

  async function startChartDataReview(batchId: string) {
    setChartReviewMessage("Starting chart data for the first saved trade...");

    try {
      const response = await fetch(
        `/api/import-batches/${encodeURIComponent(batchId)}/decision-review/resume`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ maxTrades: 1 }),
        },
      );
      const body = await readApiJson<ChartReviewResumeResponse>(
        response,
        "Chart data review could not start automatically.",
      );

      if (!response.ok) {
        throw new Error(
          body.message ?? "Chart data review could not start automatically.",
        );
      }

      setChartReviewMessage(
        (body.selectedJobCount ?? 0) > 0
          ? "Chart data started for one saved trade. Open the saved import to continue the rest while you review."
          : "No chart data work is waiting for this import.",
      );
    } catch {
      setChartReviewMessage(
        "Trades are saved. Chart data can be resumed from the saved import details.",
      );
    }
  }

  async function submitUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!file) {
      setStatus("error");
      setMessage("Choose a CSV file first.");
      return;
    }

    setStatus("uploading");
    setMessage(null);
    setResult(null);
    setChartReviewMessage(null);

    try {
      const csvText = await file.text();
      const payload = {
        acknowledgements: {
          groupingReview: true,
          mappingReview: true,
          openPositions: true,
          pnlReview: true,
        },
        broker: "auto",
        csvText,
        repairSource: "original_csv",
      };

      const previewResponse = await fetch("/api/import-batches/preview", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const previewBody = await readApiJson<ImportPreviewPlanResponse>(
        previewResponse,
        "The CSV could not be checked.",
      );

      if (!previewResponse.ok || !previewBody.plan) {
        throw new Error(
          previewBody.error?.message ?? "The CSV could not be checked.",
        );
      }

      const batchId = previewBody.plan.batch.id;

      if (!previewBody.plan.canCommitNow) {
        setStatus("idle");
        setResult(uploadReviewResult(previewBody.plan));
        return;
      }

      setStatus("saving");
      const commitResponse = await fetch(
        `/api/import-batches/${encodeURIComponent(batchId)}/commit`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const commitBody = await readApiJson<ImportCommitResponse>(
        commitResponse,
        "The CSV could not be saved.",
      );

      if (!commitResponse.ok || !commitBody.result) {
        throw new Error(commitBody.error?.message ?? "The CSV could not be saved.");
      }

      setStatus("idle");
      setResult({
        tone: "success",
        title: "CSV uploaded and saved",
        message: chartTierEnabled
          ? "Your trades are saved. The app is starting chart data for the first saved trade, then the saved import can continue the rest."
          : "Your trades are saved. Open the saved import or review queue to start execution-only review.",
        href: `/intelligence/imports/${encodeURIComponent(batchId)}`,
        actionLabel: "Open saved import",
      });
      if (chartTierEnabled) {
        void startChartDataReview(batchId);
      }
    } catch (error) {
      setStatus("error");
      setMessage(friendlyError(error));
    }
  }

  const isBusy = status === "uploading" || status === "saving";

  return (
    <section
      className="ti-panel w-full p-5 shadow-2xl shadow-black/20 sm:p-6"
      data-testid="upload-csv-card"
    >
      <h2 className="text-xl font-semibold text-zinc-50">
        Select your CSV file
      </h2>
      <p className="mt-2 text-sm leading-6 text-zinc-400">
        Choose the file and the app will handle the import check.
      </p>
      <form className="mt-5 grid gap-4" onSubmit={(event) => void submitUpload(event)}>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            CSV file
          </span>
          <input
            aria-label="CSV file"
            className="mt-2 w-full text-sm text-zinc-400 file:mr-3 file:rounded-md file:border file:border-zinc-800 file:bg-zinc-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-zinc-100 hover:file:border-sky-500"
            data-testid="upload-csv-input"
            type="file"
            accept=".csv,text/csv,text/plain"
            onChange={(event) => {
              setFile(event.target.files?.[0] ?? null);
              setStatus("idle");
              setMessage(null);
              setResult(null);
              setChartReviewMessage(null);
            }}
          />
        </label>

        <button
          className="rounded-md border border-emerald-700 bg-emerald-950/40 px-4 py-3 text-sm font-semibold text-emerald-100 transition hover:border-emerald-300 disabled:cursor-not-allowed disabled:border-zinc-800 disabled:text-zinc-500"
          data-testid="upload-csv-submit"
          disabled={isBusy}
          type="submit"
        >
          {status === "uploading"
            ? "Checking CSV..."
            : status === "saving"
              ? "Saving..."
              : "Upload and save trades"}
        </button>

        {message ? (
          <p className="text-sm text-rose-300" data-testid="upload-csv-message">
            {message}
          </p>
        ) : null}

        {result ? (
          <div
            className={`rounded-md border p-4 ${
              result.tone === "success"
                ? "border-emerald-800 bg-emerald-950/30"
                : "border-amber-800 bg-amber-950/30"
            }`}
            data-testid="upload-csv-result"
            role="status"
          >
            <h2 className="text-sm font-semibold text-zinc-50">
              {result.title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-zinc-300">
              {result.message}
            </p>
            {chartReviewMessage ? (
              <p
                className="mt-2 text-xs leading-5 text-zinc-400"
                data-testid="upload-csv-chart-review-message"
              >
                {chartReviewMessage}
              </p>
            ) : null}
            <a
              className="mt-4 inline-flex rounded-md border border-sky-800 bg-sky-950/40 px-4 py-2 text-sm font-semibold text-sky-100 transition hover:border-sky-400"
              data-testid="upload-csv-result-link"
              href={result.href}
            >
              {result.actionLabel}
            </a>
          </div>
        ) : null}
      </form>
    </section>
  );
}
