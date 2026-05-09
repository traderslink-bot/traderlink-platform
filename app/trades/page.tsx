import Link from "next/link";
import type { Metadata } from "next";
import { MetricCard, PlainStateBadge, PrimaryActionPanel } from "../app-ui";
import { buildSavedOrSampleTraderAnalyticsViewModel } from "../../src/lib/trader-analytics/server/saved-trader-analytics-data";
import {
  buildSavedReviewQueueReadModel,
  type SavedReviewQueueItem,
  type SavedReviewQueueFilter,
} from "../../src/lib/trader-analytics/server/saved-review-queue";
import { ImportWorkflowStrip } from "../import-workflow-strip";

export const metadata: Metadata = {
  title: "Saved Trades | Trader Intelligence",
};

export const dynamic = "force-dynamic";

function signed(value: number | null | undefined): string {
  if (typeof value !== "number") {
    return "n/a";
  }
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}`;
}

function normalizeReviewLane(value: string | undefined): SavedReviewQueueFilter | "none" {
  const allowed = new Set([
    "all",
    "completed",
    "market_context_unavailable",
    "blocked_open_trade",
    "analysis_failed",
    "highest_priority",
    "unresolved",
  ]);

  return value && allowed.has(value)
    ? (value as SavedReviewQueueFilter)
    : "none";
}

function laneToneClass(lane: string): string {
  return lane === "completed"
    ? "text-emerald-300"
    : lane === "blocked_open_trade"
      ? "text-sky-300"
      : lane === "market_context_unavailable" || lane === "analysis_failed"
        ? "text-amber-300"
        : "text-zinc-300";
}

function primaryTriageItem(
  queue: ReturnType<typeof buildSavedReviewQueueReadModel> | null,
): SavedReviewQueueItem | null {
  if (!queue) {
    return null;
  }

  return queue.items[0] ?? queue.allItems[0] ?? null;
}

export default async function TradesPage({
  searchParams,
}: {
  searchParams?: Promise<{ reviewLane?: string }>;
}) {
  const query = await searchParams;
  const activeReviewLane = normalizeReviewLane(query?.reviewLane);
  const data = buildSavedOrSampleTraderAnalyticsViewModel();
  const allTrades = data.repository.listTrades(data.userId);
  const latestReport = data.viewModel.latestReport;
  const savedReviewQueue =
    data.mode === "saved"
      ? buildSavedReviewQueueReadModel({
          repository: data.repository,
          activeFilter:
            activeReviewLane === "none" ? "all" : activeReviewLane,
        })
      : null;
  const queueByTradeId = new Map(
    (savedReviewQueue?.allItems ?? []).map((item) => [item.savedTradeId, item]),
  );
  const visibleTradeIds =
    savedReviewQueue && activeReviewLane !== "none"
      ? new Set(savedReviewQueue.items.map((item) => item.savedTradeId))
      : null;
  const trades = visibleTradeIds
    ? allTrades.filter((trade) => visibleTradeIds.has(trade.id))
    : allTrades;
  const triageItem = primaryTriageItem(savedReviewQueue);
  const highestPriorityCount =
    savedReviewQueue?.tabs.find((tab) => tab.id === "highest_priority")?.count ?? 0;
  const marketGapCount =
    savedReviewQueue?.tabs.find((tab) => tab.id === "market_context_unavailable")?.count ?? 0;
  const openBlockCount =
    savedReviewQueue?.tabs.find((tab) => tab.id === "blocked_open_trade")?.count ?? 0;

  return (
    <main className="min-h-screen bg-zinc-950 px-5 py-8 text-zinc-100 sm:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="border-b border-zinc-800 pb-6">
          <Link className="text-sm text-sky-300 hover:text-sky-200" href="/workspace">
            Back to workspace
          </Link>
          <h1 className="mt-3 text-3xl font-semibold text-zinc-50">
            Saved Trades
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-zinc-500">
            {data.mode === "saved"
              ? "Saved imports are powering this list. Review status links into the saved review queue."
              : "Sample trades are shown until a broker CSV import is saved."}
          </p>
        </header>

        <ImportWorkflowStrip
          currentStep="review"
          summary={
            data.mode === "saved"
              ? "The import has reached the end-user review loop. Work from saved trades into the highest-priority queue, analytics, and coach without returning to the raw import panels unless something looks wrong."
              : "Saved trades will switch from sample data to imported data after one clean broker CSV is saved."
          }
        />

        <PrimaryActionPanel
          actionHref={triageItem?.href ?? "/import-dry-run"}
          actionLabel={triageItem ? "Open Trade Review" : "Import trades"}
          body={
            triageItem
              ? triageItem.stateDetail
              : data.mode === "saved"
                ? "Open a saved trade or use the review queue once more chart-context work is available."
                : "Upload a broker CSV, save the import, then this page will show the highest-priority trade instead of the sample list."
          }
          eyebrow="Review priority trade"
          secondary={
            <div className="flex flex-wrap gap-2">
              <Link
                className="border border-zinc-800 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:border-zinc-500"
                href="/review?queue=highest_priority"
              >
                Open review queue
              </Link>
              {triageItem ? (
                <span className="text-sm text-sky-300">
                  Next: {triageItem.nextAction}
                </span>
              ) : null}
            </div>
          }
          testId="saved-trades-triage-panel"
          title={
            triageItem
              ? `${triageItem.symbol} is the next saved trade to review`
              : data.mode === "saved"
                ? "Saved trades are ready for normal review"
                : "Save one import to unlock your review queue"
          }
          tone="info"
        />

        <section className="grid gap-4 md:grid-cols-4">
          <MetricCard
            label="All Saved Trades"
            value={allTrades.length}
            detail={data.mode === "saved" ? "Saved import data" : "Sample data until you save an import"}
            tone="default"
          />
          <MetricCard
            label="Review Priority Trade"
            value={highestPriorityCount}
            detail="Trades the queue recommends checking first."
            tone="warning"
          />
          <MetricCard
            label="Needs Chart Context"
            value={marketGapCount}
            detail="Execution review is available while chart context waits."
            tone="warning"
          />
          <MetricCard
            label="Open Trades"
            value={openBlockCount}
            detail="Trades waiting until the position is flat."
            tone="info"
          />
        </section>

        {savedReviewQueue ? (
          <section
            className="border border-zinc-800 bg-zinc-950 p-4"
            data-testid="trades-review-lane-filters"
          >
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h2 className="text-sm font-semibold text-zinc-100">
                  Find Saved Trades
                </h2>
                <div className="mt-1 text-sm text-zinc-500">
                  Use these filters when you want all saved trades, trades waiting on chart context, or open trades.
                </div>
              </div>
              <Link
                className="text-sm text-sky-300 hover:text-sky-200"
                href="/review?queue=highest_priority"
              >
                Open review queue
              </Link>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                className={`border px-3 py-2 text-xs uppercase tracking-wide ${
                  activeReviewLane === "none"
                    ? "border-sky-400 text-sky-200"
                    : "border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
                }`}
                href="/trades"
              >
                All saved trades {allTrades.length}
              </Link>
              {savedReviewQueue.tabs.map((tab) => (
                <Link
                  key={tab.id}
                  className={`border px-3 py-2 text-xs uppercase tracking-wide ${
                    activeReviewLane === tab.id
                      ? "border-sky-400 text-sky-200"
                      : "border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
                  }`}
                  data-testid={`trades-review-lane-${tab.id}`}
                  href={`/trades?reviewLane=${tab.id}`}
                >
                  {tab.label} {tab.count}
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <section className="border border-zinc-800 bg-zinc-950 p-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {trades.length === 0 ? (
              <div className="border-t border-zinc-900 py-4 text-sm text-zinc-500 md:col-span-2 xl:col-span-3">
                No saved trades match this review lane.
              </div>
            ) : trades.map((trade) => {
              const reportRow = latestReport.report.trades.find(
                (row) =>
                  row.symbol === trade.symbol &&
                  row.sessionDate === trade.sessionDate &&
                  row.tradeDirection === trade.tradeDirection,
              );

              return (
                <Link
                  key={trade.id}
                  className="block border border-zinc-800 bg-black/20 p-4 transition hover:border-sky-500 hover:text-sky-200"
                  data-testid={`saved-trade-link-${trade.id}`}
                  href={`/trades/${encodeURIComponent(trade.id)}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium text-zinc-100">
                        {trade.symbol} / {trade.tradeDirection}
                      </div>
                      <div className="mt-1 text-xs text-zinc-500">
                        {trade.sessionDate} / {trade.entryHourLabelEt ?? trade.sessionBucket}
                      </div>
                    </div>
                    <div
                      className={`text-sm font-medium ${
                        (reportRow?.grossRealizedPnl ?? 0) >= 0
                          ? "text-emerald-300"
                          : "text-rose-300"
                      }`}
                    >
                      {signed(reportRow?.grossRealizedPnl)}
                    </div>
                  </div>
                  <div className="mt-4 text-sm text-zinc-300">
                    {queueByTradeId.get(trade.id)?.stateLabel ?? "Execution review is available"}
                    {queueByTradeId.get(trade.id) ? (
                      <div className="mt-1 text-xs text-amber-300">
                        {queueByTradeId.get(trade.id)?.priorityLabel}
                      </div>
                    ) : null}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs uppercase tracking-wide">
                    <PlainStateBadge
                      state={trade.sampleData ? "sample_fallback" : "saved_sqlite"}
                      tone={trade.sampleData ? "warning" : "success"}
                    />
                    {queueByTradeId.get(trade.id) ? (
                      <span
                        className={`border border-zinc-800 px-2 py-1 ${laneToneClass(
                          queueByTradeId.get(trade.id)?.lane ?? "",
                        )}`}
                      >
                        {queueByTradeId.get(trade.id)?.reviewScopeLabel}
                      </span>
                    ) : null}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
