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
  return value.replaceAll("_", " ");
}

export function SavedReviewQueueSummary({
  queue,
  surface,
}: {
  queue: SavedReviewQueueReadModel | null | undefined;
  surface: "analytics" | "coach";
}) {
  if (!queue) {
    return (
      <section
        className="border border-zinc-800 bg-zinc-950 p-4 shadow-sm shadow-black/20"
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
            href="/import-dry-run"
          >
            Open CSV dry run
          </Link>
        </div>
      </section>
    );
  }

  const unresolvedCount = tabCount(queue, "unresolved");
  const marketGapCount = tabCount(queue, "market_context_unavailable");
  const openBlockCount = tabCount(queue, "blocked_open_trade");
  const highestPriorityCount = tabCount(queue, "highest_priority");
  const previewItems = (queue.items.length > 0 ? queue.items : queue.allItems).slice(
    0,
    3,
  );
  const primaryHref =
    highestPriorityCount > 0 ? "/review?queue=highest_priority" : "/review";
  const title =
    surface === "coach"
      ? "Highest-priority saved review work"
      : "Saved review queue is ready";

  return (
    <section
      className="border border-zinc-800 bg-zinc-950 p-4 shadow-sm shadow-black/20"
      data-testid="saved-review-summary-strip"
    >
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-400">
            Saved Review Work
          </p>
          <h2 className="mt-2 text-lg font-semibold text-zinc-100">{title}</h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-zinc-400">
            Jump from {surface} into the trades that most need saved review,
            market-context follow-up, or open-position handling.
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <div className="border border-zinc-800 bg-zinc-950 px-3 py-2">
              <div className="text-xs uppercase tracking-wide text-zinc-500">
                Highest Priority
              </div>
              <div className="mt-1 text-xl font-semibold text-amber-300">
                {highestPriorityCount}
              </div>
            </div>
            <div className="border border-zinc-800 bg-zinc-950 px-3 py-2">
              <div className="text-xs uppercase tracking-wide text-zinc-500">
                Unresolved
              </div>
              <div className="mt-1 text-xl font-semibold text-sky-300">
                {unresolvedCount}
              </div>
            </div>
            <div className="border border-zinc-800 bg-zinc-950 px-3 py-2">
              <div className="text-xs uppercase tracking-wide text-zinc-500">
                Chart Context Waiting
              </div>
              <div className="mt-1 text-xl font-semibold text-violet-300">
                {marketGapCount}
              </div>
            </div>
            <div className="border border-zinc-800 bg-zinc-950 px-3 py-2">
              <div className="text-xs uppercase tracking-wide text-zinc-500">
                Open Trades
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
              Open highest-priority queue
            </Link>
            <Link
              className="border border-zinc-800 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:border-zinc-500"
              href="/trades?reviewLane=highest_priority"
            >
              Filter trades
            </Link>
          </div>

          {previewItems.length > 0 ? (
            <div className="grid gap-2">
              {previewItems.map((item) => (
                <Link
                  className="block border border-zinc-800 bg-black/20 px-3 py-2 transition hover:border-sky-500"
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
            <div className="border border-zinc-800 bg-black/20 px-3 py-2 text-sm text-zinc-400">
              {queue.emptyState.body}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
