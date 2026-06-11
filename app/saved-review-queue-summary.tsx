"use client";

import Link from "next/link";
import type {
  SavedReviewQueueFilter,
  SavedReviewQueueReadModel,
} from "../src/lib/trader-analytics/server/saved-review-queue";

function tabCount(
  queue: SavedReviewQueueReadModel,
  id: SavedReviewQueueFilter,
): number {
  return queue.tabs.find((tab) => tab.id === id)?.count ?? 0;
}

function laneLabel(value: string): string {
  switch (value) {
    case "completed":
      return "Reviewed with chart data";
    case "market_context_unavailable":
      return "Chart data still missing";
    case "blocked_open_trade":
      return "Swing trade";
    case "analysis_failed":
      return "Chart data needs review";
    case "candle_basis_warning":
      return "Candle basis check";
    case "highest_priority":
      return "Highest priority";
    case "unresolved":
      return "Needs review";
    case "queued":
      return "Chart data waiting";
    case "skipped_limit":
      return "Review skipped";
    default:
      return value
        .split(/[_-]/)
        .filter(Boolean)
        .map((part) => part[0]?.toUpperCase() + part.slice(1))
        .join(" ");
  }
}

export function SavedReviewQueueSummary({
  chartTierEnabled = false,
  compact = false,
  queue,
  surface,
}: {
  chartTierEnabled?: boolean;
  compact?: boolean;
  queue: SavedReviewQueueReadModel | null | undefined;
  surface: "analytics" | "coach";
}) {
  if (!queue) {
    return (
      <section
        className="ti-panel p-4"
        data-testid="saved-review-summary-strip"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Saved Review Work
            </p>
            <h2 className="mt-2 text-lg font-semibold text-zinc-100">
              Save one broker CSV to build the review queue
            </h2>
            <p className="mt-1 max-w-3xl text-sm text-zinc-400">
              This page is showing sample data. A saved import unlocks
              saved trades, the highest-priority queue, analytics, and coach from
              the same execution records.
            </p>
          </div>
          <Link
            className="border border-sky-800 bg-sky-950/40 px-4 py-3 text-sm font-medium text-sky-100 transition hover:border-sky-400"
            href="/intelligence/upload-csv"
          >
            Upload CSV
          </Link>
        </div>
      </section>
    );
  }

  const unresolvedCount = tabCount(queue, "unresolved");
  const marketGapCount = tabCount(queue, "market_context_unavailable");
  const chartDataNeedsReviewCount = tabCount(queue, "analysis_failed");
  const queuedChartDataCount = tabCount(queue, "queued");
  const candleBasisWarningCount = tabCount(queue, "candle_basis_warning");
  const openBlockCount = tabCount(queue, "blocked_open_trade");
  const highestPriorityCount = tabCount(queue, "highest_priority");
  const completedReviewCount = tabCount(queue, "completed");
  const baselineItemCount = queue.allItems.length;
  const chartDataCard =
    queuedChartDataCount > 0
      ? {
          label: "Chart Data Waiting",
          count: queuedChartDataCount,
          href: "/intelligence/review?queue=queued",
          toneClass: "text-violet-300",
        }
      : chartDataNeedsReviewCount > 0
        ? {
            label: "Chart Data Needs Review",
            count: chartDataNeedsReviewCount,
            href: "/intelligence/review?queue=analysis_failed",
            toneClass: "text-amber-300",
          }
      : {
          label: "Chart Data Still Missing",
          count: marketGapCount,
          href: "/intelligence/review?queue=market_context_unavailable",
          toneClass: "text-violet-300",
        };
  const previewItems = (queue.items.length > 0 ? queue.items : queue.allItems).slice(
    0,
    3,
  );
  const visiblePreviewItems = chartTierEnabled
    ? previewItems
    : previewItems.filter((item) => item.lane === "blocked_open_trade");
  const primaryHref =
    chartTierEnabled && highestPriorityCount > 0
      ? "/intelligence/review?queue=highest_priority"
      : openBlockCount > 0
        ? "/intelligence/review?queue=blocked_open_trade"
        : "/intelligence/trades";
  const title =
    chartTierEnabled
      ? surface === "coach"
        ? "Highest-priority saved review work"
        : "Saved review queue is ready"
      : "Historical trading baseline is ready";

  if (compact) {
    if (!chartTierEnabled) {
      return (
        <section
          className="ti-panel p-3"
          data-testid="saved-review-summary-strip"
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-400">
                Saved Trading Baseline
              </p>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-400">
                <span>
                  <span className="font-semibold text-sky-300">
                    {baselineItemCount}
                  </span>{" "}
                  saved trade stories
                </span>
                <span>
                  <span className="font-semibold text-amber-300">
                    {openBlockCount}
                  </span>{" "}
                  open or carried
                </span>
                <span>
                  <span className="font-semibold text-zinc-100">
                    {completedReviewCount}
                  </span>{" "}
                  optional notes
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                className="rounded-md border border-sky-800 bg-sky-950/40 px-3 py-2 text-sm font-medium text-sky-100 transition hover:border-sky-400"
                href="/intelligence/analytics/results"
              >
                Open analytics
              </Link>
              <Link
                className="rounded-md border border-zinc-800 px-3 py-2 text-sm font-medium text-zinc-200 transition hover:border-zinc-500"
                href="/intelligence/trades"
              >
                Trade history
              </Link>
            </div>
          </div>
        </section>
      );
    }

    return (
      <section
        className="ti-panel p-3"
        data-testid="saved-review-summary-strip"
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-400">
              Saved Review Work
            </p>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-400">
              <span>
                <span className="font-semibold text-amber-300">
                  {highestPriorityCount}
                </span>{" "}
                highest priority
              </span>
              <span>
                <span className="font-semibold text-sky-300">
                  {unresolvedCount}
                </span>{" "}
                need review
              </span>
              <span>
                <span className={`font-semibold ${chartDataCard.toneClass}`}>
                  {chartDataCard.count}
                </span>{" "}
                {chartDataCard.label.toLowerCase()}
              </span>
              {candleBasisWarningCount > 0 ? (
                <span>
                  <span className="font-semibold text-amber-300">
                    {candleBasisWarningCount}
                  </span>{" "}
                  candle basis checks
                </span>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              className="rounded-md border border-sky-800 bg-sky-950/40 px-3 py-2 text-sm font-medium text-sky-100 transition hover:border-sky-400"
              href={primaryHref}
            >
              Open queue
            </Link>
            <Link
              className="rounded-md border border-zinc-800 px-3 py-2 text-sm font-medium text-zinc-200 transition hover:border-zinc-500"
              href="/intelligence/trades/review-needed"
            >
              Review trades
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className="ti-panel p-4"
      data-testid="saved-review-summary-strip"
    >
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-400">
            {chartTierEnabled ? "Saved Review Work" : "Saved Trading Baseline"}
          </p>
          <h2 className="mt-2 text-lg font-semibold text-zinc-100">{title}</h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-zinc-400">
            {chartTierEnabled
              ? `Jump from ${surface} into trades that still need your review, chart-data processing, or swing-trade handling.`
              : "Your historical CSV already powers analytics and coaching. Written reviews are optional study notes; only open or carried positions need follow-up."}
          </p>
          <div
            className={`mt-4 grid gap-2 sm:grid-cols-2 ${
              chartTierEnabled && candleBasisWarningCount > 0
                ? "lg:grid-cols-5"
                : chartTierEnabled
                  ? "lg:grid-cols-4"
                  : "lg:grid-cols-3"
            }`}
          >
            {chartTierEnabled ? (
              <>
                <div className="ti-panel-soft px-3 py-2">
                  <div className="text-xs uppercase tracking-wide text-zinc-500">
                    Highest Priority
                  </div>
                  <div className="mt-1 text-xl font-semibold text-amber-300">
                    {highestPriorityCount}
                  </div>
                </div>
                <div className="ti-panel-soft px-3 py-2">
                  <div className="text-xs uppercase tracking-wide text-zinc-500">
                    Needs Your Review
                  </div>
                  <div className="mt-1 text-xl font-semibold text-sky-300">
                    {unresolvedCount}
                  </div>
                </div>
                <Link className="ti-panel-soft px-3 py-2 hover:border-sky-500" href={chartDataCard.href}>
                  <div className="text-xs uppercase tracking-wide text-zinc-500">
                    {chartDataCard.label}
                  </div>
                  <div className={`mt-1 text-xl font-semibold ${chartDataCard.toneClass}`}>
                    {chartDataCard.count}
                  </div>
                </Link>
              </>
            ) : (
              <>
                <div className="ti-panel-soft px-3 py-2">
                  <div className="text-xs uppercase tracking-wide text-zinc-500">
                    Baseline Stories
                  </div>
                  <div className="mt-1 text-xl font-semibold text-sky-300">
                    {baselineItemCount}
                  </div>
                </div>
                <div className="ti-panel-soft px-3 py-2">
                  <div className="text-xs uppercase tracking-wide text-zinc-500">
                    Optional Notes
                  </div>
                  <div className="mt-1 text-xl font-semibold text-zinc-100">
                    {completedReviewCount}
                  </div>
                </div>
              </>
            )}
            {chartTierEnabled && candleBasisWarningCount > 0 ? (
              <Link
                className="ti-panel-soft px-3 py-2 hover:border-amber-500"
                href="/intelligence/review?queue=candle_basis_warning"
              >
                <div className="text-xs uppercase tracking-wide text-zinc-500">
                  Candle Basis Check
                </div>
                <div className="mt-1 text-xl font-semibold text-amber-300">
                  {candleBasisWarningCount}
                </div>
              </Link>
            ) : null}
            <div className="ti-panel-soft px-3 py-2">
              <div className="text-xs uppercase tracking-wide text-zinc-500">
                {chartTierEnabled ? "Swing Trades" : "Open Or Carried"}
              </div>
              <div className="mt-1 text-xl font-semibold text-rose-300">
                {openBlockCount}
              </div>
            </div>
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-3 xl:w-[28rem]">
          <div className="flex flex-wrap gap-2">
            <Link
              className="border border-sky-800 bg-sky-950/40 px-4 py-2 text-sm font-medium text-sky-100 transition hover:border-sky-400"
              href={primaryHref}
            >
              {chartTierEnabled
                ? "Open highest-priority queue"
                : openBlockCount > 0
                  ? "Open open positions"
                  : "Open trade history"}
            </Link>
            <Link
              className="border border-zinc-800 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:border-zinc-500"
              href={
                chartTierEnabled
                  ? "/intelligence/trades?reviewLane=highest_priority"
                  : "/intelligence/analytics/results"
              }
            >
              {chartTierEnabled ? "Filter trades" : "Open analytics"}
            </Link>
          </div>

          {visiblePreviewItems.length > 0 ? (
            <div className="grid gap-2">
              {visiblePreviewItems.map((item) => (
                <Link
                  className="ti-panel-soft block px-3 py-2 transition hover:border-sky-500"
                  href={item.href}
                  key={item.id}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="truncate text-sm font-semibold text-zinc-100">
                      {item.symbol}
                    </span>
                    <span className="shrink-0 text-xs uppercase tracking-wide text-amber-300">
                      {item.priorityLabel}
                    </span>
                  </div>
                  <div className="mt-1 line-clamp-2 text-xs leading-5 text-zinc-400">
                    {laneLabel(item.lane)}: {item.detail}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="ti-panel-soft px-3 py-2 text-sm text-zinc-400">
              {chartTierEnabled
                ? queue.emptyState.body
                : "No required review backlog. Browse analytics first, then study individual trades only when a pattern deserves a closer look."}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
