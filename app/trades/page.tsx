import Link from "next/link";
import type { Metadata } from "next";
import {
  DashboardSideNav,
  MetricCard,
  PlainStateBadge,
  PrimaryActionPanel,
  userFacingTradeDirection,
} from "../app-ui";
import { buildSavedOrSampleTraderAnalyticsViewModel } from "../../src/lib/trader-analytics/server/saved-trader-analytics-data";
import {
  buildSavedReviewQueueReadModel,
  type SavedReviewQueueItem,
  type SavedReviewQueueFilter,
} from "../../src/lib/trader-analytics/server/saved-review-queue";
import { buildSavedTradeThreadReadModel } from "../../src/lib/trader-analytics/server/saved-trade-threads";
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

function timeLabelEt(value: string | null): string {
  if (!value) {
    return "time n/a";
  }

  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    return "time n/a";
  }

  return new Date(parsed).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
  });
}

function lifecycleToneClass(classification: string): string {
  if (classification === "day_trade_turned_swing") {
    return "border-amber-500/40 bg-amber-500/10 text-amber-200";
  }

  if (classification === "open_intraday_reentry") {
    return "border-sky-500/40 bg-sky-500/10 text-sky-200";
  }

  if (classification === "closed_day_trade_reentry") {
    return "border-emerald-500/40 bg-emerald-500/10 text-emerald-200";
  }

  return "border-zinc-700 bg-zinc-900/40 text-zinc-300";
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

type TradeStoryFilter =
  | "all"
  | "giveback"
  | "losses"
  | "swing"
  | "open"
  | "added"
  | "chart_findings"
  | "add_quality"
  | "post_exit"
  | "protected_profit"
  | "exit_levels"
  | "levels"
  | "volume"
  | "needs_context";

type TradeBrowseMode =
  | "round_trips"
  | "ticker_stories"
  | "session_stories"
  | "open_swing"
  | "needs_review";

function normalizeBrowseMode(value: string | undefined): TradeBrowseMode {
  const allowed = new Set([
    "round_trips",
    "ticker_stories",
    "session_stories",
    "open_swing",
    "needs_review",
  ]);

  return value && allowed.has(value) ? (value as TradeBrowseMode) : "round_trips";
}

function normalizeStoryFilter(value: string | undefined): TradeStoryFilter {
  const allowed = new Set([
    "all",
    "giveback",
    "losses",
    "swing",
    "open",
    "added",
    "chart_findings",
    "add_quality",
    "post_exit",
    "protected_profit",
    "exit_levels",
    "levels",
    "volume",
    "needs_context",
  ]);

  return value && allowed.has(value) ? (value as TradeStoryFilter) : "all";
}

function storyMatchesFilter(
  thread: ReturnType<typeof buildSavedTradeThreadReadModel>["threads"][number],
  filter: TradeStoryFilter,
): boolean {
  if (filter === "all") {
    return thread.roundTripCount > 1;
  }

  if (filter === "giveback") {
    return thread.storyKind === "profit_giveback";
  }

  if (filter === "losses") {
    return thread.storyKind === "repeated_losing_attempts";
  }

  if (filter === "swing") {
    return thread.storyKind === "swing_transition";
  }

  if (filter === "open") {
    return thread.storyKind === "open_reentry";
  }

  if (filter === "added") {
    return thread.storyKind === "reentry_added_profit";
  }

  if (filter === "chart_findings") {
    return thread.marketContextFindingCount > 0;
  }

  if (filter === "add_quality") {
    return thread.addQualityFindingCount > 0;
  }

  if (filter === "post_exit") {
    return thread.postExitFindingCount > 0;
  }

  if (filter === "protected_profit") {
    return thread.protectedProfitBeforeFadeFindingCount > 0;
  }

  if (filter === "exit_levels") {
    return thread.exitLevelFindingCount > 0;
  }

  if (filter === "levels") {
    return thread.levelFindingCount > 0;
  }

  if (filter === "volume") {
    return thread.volumeFindingCount > 0;
  }

  return thread.roundTrips.some(
    (roundTrip) => roundTrip.chartContextStatus === "waiting",
  );
}

function rowLooksOpenOrSwing(
  row: ReturnType<typeof buildSavedOrSampleTraderAnalyticsViewModel>["viewModel"]["latestReport"]["report"]["trades"][number] | undefined,
): boolean {
  if (!row) {
    return false;
  }

  return Boolean(
    row.isOpenPosition ||
      row.heldOvernight ||
      row.heldPostmarketIntoOvernight ||
      row.heldSessionBuckets?.some((bucket) =>
        String(bucket).toLowerCase().includes("overnight"),
      ),
  );
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
  searchParams?: Promise<{
    reviewLane?: string;
    storyFilter?: string;
    thread?: string;
    view?: string;
  }>;
}) {
  const query = await searchParams;
  const activeReviewLane = normalizeReviewLane(query?.reviewLane);
  const activeStoryFilter = normalizeStoryFilter(query?.storyFilter);
  const activeBrowseMode = normalizeBrowseMode(query?.view);
  const data = buildSavedOrSampleTraderAnalyticsViewModel();
  const allTrades = data.repository.listTrades(data.userId);
  const latestReport = data.viewModel.latestReport;
  const reportRowsByTradeId = new Map(
    latestReport.sourceTradeIds
      .map((tradeId, index) => {
        const row =
          latestReport.report.trades.find(
            (candidate) => candidate.tradeIndex === index + 1,
          ) ?? null;

        return row ? ([tradeId, row] as const) : null;
      })
      .filter((entry): entry is readonly [
        string,
        typeof latestReport.report.trades[number],
      ] => Boolean(entry)),
  );
  const decisionReviewSnapshots =
    data.mode === "saved"
      ? [
          ...new Set(
            allTrades
              .map((trade) => trade.importBatchId)
              .filter((batchId): batchId is string => Boolean(batchId)),
          ),
        ].flatMap((batchId) =>
          data.repository.listDecisionReviewSnapshotsForBatch(batchId),
        )
      : [];
  const tradeThreadModel = buildSavedTradeThreadReadModel({
    decisionReviewSnapshots,
    report: latestReport,
    source: data.mode === "saved" ? "saved_sqlite" : "sample",
    trades: allTrades,
  });
  const activeThread =
    query?.thread
      ? tradeThreadModel.threads.find((thread) => thread.id === query.thread)
      : null;
  const storyFilters: Array<{
    id: TradeStoryFilter;
    label: string;
    count: number;
  }> = [
    {
      id: "all",
      label: "All ticker stories",
      count: tradeThreadModel.threads.filter((thread) => thread.roundTripCount > 1).length,
    },
    {
      id: "giveback",
      label: "Gave back profit",
      count: tradeThreadModel.threads.filter((thread) => storyMatchesFilter(thread, "giveback")).length,
    },
    {
      id: "losses",
      label: "Repeated losses",
      count: tradeThreadModel.threads.filter((thread) => storyMatchesFilter(thread, "losses")).length,
    },
    {
      id: "swing",
      label: "Turned swing",
      count: tradeThreadModel.threads.filter((thread) => storyMatchesFilter(thread, "swing")).length,
    },
    {
      id: "open",
      label: "Open re-entry",
      count: tradeThreadModel.threads.filter((thread) => storyMatchesFilter(thread, "open")).length,
    },
    {
      id: "added",
      label: "Added profit",
      count: tradeThreadModel.threads.filter((thread) => storyMatchesFilter(thread, "added")).length,
    },
    {
      id: "chart_findings",
      label: "Chart findings",
      count: tradeThreadModel.threads.filter((thread) => storyMatchesFilter(thread, "chart_findings")).length,
    },
    {
      id: "add_quality",
      label: "Add quality",
      count: tradeThreadModel.threads.filter((thread) => storyMatchesFilter(thread, "add_quality")).length,
    },
    {
      id: "post_exit",
      label: "Post-exit",
      count: tradeThreadModel.threads.filter((thread) => storyMatchesFilter(thread, "post_exit")).length,
    },
    {
      id: "protected_profit",
      label: "Protected before fade",
      count: tradeThreadModel.threads.filter((thread) => storyMatchesFilter(thread, "protected_profit")).length,
    },
    {
      id: "exit_levels",
      label: "Support/resistance exits",
      count: tradeThreadModel.threads.filter((thread) => storyMatchesFilter(thread, "exit_levels")).length,
    },
    {
      id: "levels",
      label: "Levels",
      count: tradeThreadModel.threads.filter((thread) => storyMatchesFilter(thread, "levels")).length,
    },
    {
      id: "volume",
      label: "Volume",
      count: tradeThreadModel.threads.filter((thread) => storyMatchesFilter(thread, "volume")).length,
    },
    {
      id: "needs_context",
      label: "Needs chart context",
      count: tradeThreadModel.threads.filter((thread) => storyMatchesFilter(thread, "needs_context")).length,
    },
  ];
  const highlightedThreads = [
    ...(activeThread ? [activeThread] : []),
    ...tradeThreadModel.threads.filter(
      (thread) =>
        storyMatchesFilter(thread, activeStoryFilter) &&
        thread.id !== activeThread?.id,
    ),
  ].slice(0, 6);
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
  const multiRoundTripTradeIds = new Set(
    tradeThreadModel.threads
      .filter((thread) => thread.roundTripCount > 1)
      .flatMap((thread) => thread.roundTrips.map((roundTrip) => roundTrip.tradeId)),
  );
  const sessionStoryTradeIds = new Set(
    tradeThreadModel.sessionStories.flatMap((story) =>
      tradeThreadModel.threads
        .filter((thread) => thread.sessionDate === story.sessionDate)
        .flatMap((thread) =>
          thread.roundTrips.map((roundTrip) => roundTrip.tradeId),
        ),
    ),
  );
  const openOrSwingTradeIds = new Set(
    allTrades
      .filter((trade) => rowLooksOpenOrSwing(reportRowsByTradeId.get(trade.id)))
      .map((trade) => trade.id),
  );
  const needsReviewTradeIds = new Set(
    (savedReviewQueue?.allItems ?? [])
      .filter(
        (item) =>
          item.reviewStatus !== "resolved" &&
          item.reviewStatus !== "ignored" &&
          item.reviewStatus !== "reviewed",
      )
      .map((item) => item.savedTradeId),
  );
  const browseModes: Array<{
    body: string;
    count: number;
    href: string;
    id: TradeBrowseMode;
    label: string;
  }> = [
    {
      body: "Each card is one flat-to-flat trade.",
      count: allTrades.length,
      href: "/trades",
      id: "round_trips",
      label: "Round Trips",
    },
    {
      body: "Group repeated same-ticker attempts.",
      count: multiRoundTripTradeIds.size,
      href: "/trades?view=ticker_stories#ticker-stories",
      id: "ticker_stories",
      label: "Ticker Stories",
    },
    {
      body: "Review the whole trading day.",
      count: tradeThreadModel.sessionStoryCount,
      href: "/trades?view=session_stories#session-stories",
      id: "session_stories",
      label: "Session Stories",
    },
    {
      body: "Trades that stayed open or carried overnight.",
      count: openOrSwingTradeIds.size,
      href: "/trades?view=open_swing#trade-list",
      id: "open_swing",
      label: "Open/Swing",
    },
    {
      body: "Saved trades still waiting for review work.",
      count: needsReviewTradeIds.size,
      href: "/trades?view=needs_review#trade-list",
      id: "needs_review",
      label: "Needs Review",
    },
  ];
  const visibleTradeIds =
    savedReviewQueue && activeReviewLane !== "none"
      ? new Set(savedReviewQueue.items.map((item) => item.savedTradeId))
      : null;
  const laneFilteredTrades = visibleTradeIds
    ? allTrades.filter((trade) => visibleTradeIds.has(trade.id))
    : allTrades;
  const trades = laneFilteredTrades.filter((trade) => {
    if (activeBrowseMode === "ticker_stories") {
      return multiRoundTripTradeIds.has(trade.id);
    }

    if (activeBrowseMode === "session_stories") {
      return sessionStoryTradeIds.has(trade.id);
    }

    if (activeBrowseMode === "open_swing") {
      return openOrSwingTradeIds.has(trade.id);
    }

    if (activeBrowseMode === "needs_review") {
      return needsReviewTradeIds.has(trade.id);
    }

    return true;
  });
  const triageItem = primaryTriageItem(savedReviewQueue);
  const highestPriorityCount =
    savedReviewQueue?.tabs.find((tab) => tab.id === "highest_priority")?.count ?? 0;
  const marketGapCount =
    savedReviewQueue?.tabs.find((tab) => tab.id === "market_context_unavailable")?.count ?? 0;
  const openBlockCount =
    savedReviewQueue?.tabs.find((tab) => tab.id === "blocked_open_trade")?.count ?? 0;

  return (
    <main className="ti-dashboard-bg min-h-screen px-5 py-8 text-zinc-100 sm:px-8">
      <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-8">
        <header className="ti-panel p-6">
          <Link className="text-sm text-sky-300 hover:text-sky-200" href="/workspace">
            Back to workspace
          </Link>
          <h1 className="mt-3 text-3xl font-semibold text-zinc-50">
            Saved Trades
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-zinc-500">
            {data.mode === "saved"
              ? "Saved imports are powering this list. Each card is one flat-to-flat round trip. If you re-enter the same ticker later, it appears as another round trip so the app can show whether the re-entry protected or gave back earlier profit."
              : "Sample trades are shown until a broker CSV import is saved."}
          </p>
        </header>

        <ImportWorkflowStrip
          currentStep="review"
          summary={
            data.mode === "saved"
              ? "The import has reached the end-user review loop. Work from saved trades into the highest-priority queue, analytics, and coach without returning to import review panels unless something looks wrong."
              : "Saved trades will switch from sample data to imported data after one clean broker CSV is saved."
          }
        />

        <section className="grid min-w-0 gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          <DashboardSideNav
            eyebrow="Trades Menu"
            items={[
              {
                href: "#priority",
                label: "Priority",
                summary: "The next trade to open.",
              },
              {
                href: "#filters",
                label: "Browse Modes",
                summary: "Round trips, ticker stories, open/swing, and needs review.",
              },
              {
                href: "#ticker-stories",
                label: "Ticker Stories",
                summary: "Same-ticker re-entry stories.",
              },
              {
                href: "#session-stories",
                label: "Session Stories",
                summary: "Full-day trading behavior stories.",
              },
              {
                href: "#trade-list",
                label: "Trade List",
                summary: "All saved trades as review cards.",
              },
            ]}
            summary="Move from priority work into the full saved-trade list."
          />
          <div className="grid min-w-0 gap-6">
            <div id="priority">
        <PrimaryActionPanel
          actionHref={triageItem?.href ?? "/import-dry-run"}
          actionLabel={triageItem ? "Open Trade Review" : "Import trades"}
          body={
            triageItem
              ? triageItem.stateDetail
              : data.mode === "saved"
                ? "Open a saved trade or use the review queue once more chart work is available."
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
            </div>

        <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
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
          <MetricCard
            label="Chart Findings"
            value={tradeThreadModel.marketContextFindingCount}
            detail="Certified chart findings and safe review prompts"
            tone={tradeThreadModel.marketContextFindingCount > 0 ? "info" : "default"}
          />
          <MetricCard
            label="Add Quality"
            value={tradeThreadModel.addQualityFindingCount}
            detail={`${tradeThreadModel.addQualityRiskCount} risk, ${tradeThreadModel.addQualityStrengthCount} strength, ${tradeThreadModel.addQualityReviewPromptCount} prompt`}
            tone={
              tradeThreadModel.addQualityRiskCount > 0
                ? "warning"
                : tradeThreadModel.addQualityStrengthCount > 0
                  ? "success"
                  : tradeThreadModel.addQualityFindingCount > 0
                    ? "info"
                    : "default"
            }
          />
        </section>

        <section
          id="filters"
          className="ti-panel p-4"
          data-testid="saved-trade-browse-modes"
        >
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-zinc-100">
                Browse Saved Trades
              </h2>
              <p className="mt-1 max-w-3xl text-sm text-zinc-500">
                Use round trips for accounting. Use ticker stories when the same symbol appears more than once on the same day and you want to review whether the later attempt helped or hurt the first idea.
              </p>
            </div>
            <div className="text-sm text-zinc-500">
              Showing {trades.length} of {allTrades.length} saved trade
              {allTrades.length === 1 ? "" : "s"}
            </div>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {browseModes.map((mode) => (
              <Link
                key={mode.id}
                className={`ti-panel-soft p-4 transition hover:border-sky-500 ${
                  activeBrowseMode === mode.id ? "border-sky-500" : ""
                }`}
                href={mode.href}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="text-sm font-semibold text-zinc-100">
                    {mode.label}
                  </div>
                  <div className="font-mono text-sm text-sky-300">
                    {mode.count}
                  </div>
                </div>
                <div className="mt-2 text-xs leading-5 text-zinc-500">
                  {mode.body}
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-4 border-t border-zinc-900 pt-4 text-sm leading-6 text-zinc-400">
            Round trips show each flat-to-flat trade. Ticker stories group same-symbol re-entries so you can review whether later attempts protected profit, gave back profit, stayed open, turned into swing exposure, or have certified chart findings attached.
          </div>
        </section>

        <section
          id="ticker-stories"
          className="ti-panel p-4"
          data-testid="saved-trade-thread-stories"
        >
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-zinc-100">
                Ticker Stories
              </h2>
              <p className="mt-1 max-w-3xl text-sm text-zinc-500">
                A round trip still ends when the position returns to flat. This section groups same-symbol, same-day round trips into one trading story so re-entries are easier to review.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-right text-xs text-zinc-500 lg:grid-cols-4 xl:grid-cols-9">
              <div className="ti-panel-soft px-3 py-2">
                <div className="text-lg font-semibold text-zinc-100">
                  {tradeThreadModel.threadCount}
                </div>
                <div>Ticker stories</div>
              </div>
              <div className="ti-panel-soft px-3 py-2">
                <div className="text-lg font-semibold text-zinc-100">
                  {tradeThreadModel.multiRoundTripThreadCount}
                </div>
                <div>Re-entry stories</div>
              </div>
              <div className="ti-panel-soft px-3 py-2">
                <div className="text-lg font-semibold text-sky-300">
                  {tradeThreadModel.marketContextFindingCount}
                </div>
                <div>Chart findings</div>
              </div>
              <div className="ti-panel-soft px-3 py-2">
                <div className="text-lg font-semibold text-emerald-300">
                  {tradeThreadModel.marketContextStrengthCount}
                </div>
                <div>Chart strengths</div>
              </div>
              <div className="ti-panel-soft px-3 py-2">
                <div
                  className={`text-lg font-semibold ${
                    tradeThreadModel.addQualityRiskCount > 0
                      ? "text-amber-300"
                      : tradeThreadModel.addQualityStrengthCount > 0
                        ? "text-emerald-300"
                        : "text-zinc-100"
                  }`}
                >
                  {tradeThreadModel.addQualityFindingCount}
                </div>
                <div>Add quality</div>
              </div>
              <div className="ti-panel-soft px-3 py-2">
                <div
                  className={`text-lg font-semibold ${
                    tradeThreadModel.postExitRiskCount > 0
                      ? "text-amber-300"
                      : tradeThreadModel.postExitStrengthCount > 0
                        ? "text-emerald-300"
                        : "text-sky-300"
                  }`}
                >
                  {tradeThreadModel.postExitFindingCount}
                </div>
                <div>Post-exit</div>
              </div>
              <div className="ti-panel-soft px-3 py-2">
                <div
                  className={`text-lg font-semibold ${
                    tradeThreadModel.protectedProfitBeforeFadeFindingCount > 0
                      ? "text-emerald-300"
                      : "text-zinc-100"
                  }`}
                >
                  {tradeThreadModel.protectedProfitBeforeFadeFindingCount}
                </div>
                <div>Protected before fade</div>
              </div>
              <div className="ti-panel-soft px-3 py-2">
                <div
                  className={`text-lg font-semibold ${
                    tradeThreadModel.exitLevelRiskCount > 0
                      ? "text-amber-300"
                      : tradeThreadModel.exitLevelStrengthCount > 0
                        ? "text-emerald-300"
                        : "text-sky-300"
                  }`}
                >
                  {tradeThreadModel.exitLevelFindingCount}
                </div>
                <div>Support/resistance exits</div>
              </div>
              <div className="ti-panel-soft px-3 py-2">
                <div
                  className={`text-lg font-semibold ${
                    tradeThreadModel.volumeRiskCount > 0
                      ? "text-amber-300"
                      : tradeThreadModel.volumeStrengthCount > 0
                        ? "text-emerald-300"
                        : "text-sky-300"
                  }`}
                >
                  {tradeThreadModel.volumeFindingCount}
                </div>
                <div>Volume evidence</div>
              </div>
            </div>
          </div>

          {highlightedThreads.length === 0 ? (
            <div className="mt-4 border-t border-zinc-900 pt-4 text-sm text-zinc-500">
              No same-day re-entry stories yet. When a ticker has more than one flat-to-flat round trip on the same date, it will appear here.
            </div>
          ) : (
            <>
            <div className="mt-4 flex flex-wrap gap-2">
              {storyFilters.map((filter) => (
                <Link
                  key={filter.id}
                  className={`border px-3 py-2 text-xs uppercase tracking-wide ${
                    activeStoryFilter === filter.id
                      ? "border-sky-400 text-sky-200"
                      : "border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
                  }`}
                  href={filter.id === "all" ? "/trades#ticker-stories" : `/trades?storyFilter=${filter.id}#ticker-stories`}
                >
                  {filter.label} {filter.count}
                </Link>
              ))}
            </div>
            <div className="mt-4 grid gap-3 xl:grid-cols-2">
              {highlightedThreads.map((thread) => (
                <article
                  key={thread.id}
                  className="ti-panel-soft p-4"
                  data-testid={`trade-thread-${thread.symbol}-${thread.sessionDate}`}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="text-xs uppercase tracking-wide text-zinc-500">
                        {thread.sessionDate}
                      </div>
                      <h3 className="mt-1 text-lg font-semibold text-zinc-50">
                        {thread.symbol} story
                      </h3>
                    </div>
                    <div
                      className={`text-lg font-semibold ${
                        thread.totalGrossRealizedPnl >= 0
                          ? "text-emerald-300"
                          : "text-rose-300"
                      }`}
                    >
                      {signed(thread.totalGrossRealizedPnl)}
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <div className="inline-flex border border-sky-500/40 bg-sky-500/10 px-3 py-1 text-xs font-medium uppercase tracking-wide text-sky-200">
                      {thread.storyLabel}
                    </div>
                    <div
                      className={`inline-flex border px-3 py-1 text-xs font-medium uppercase tracking-wide ${lifecycleToneClass(
                        thread.lifecycleClassification,
                      )}`}
                    >
                      {thread.lifecycleLabel}
                    </div>
                    {thread.marketContextFindingCount > 0 ? (
                      <div className="inline-flex border border-sky-500/40 bg-sky-500/10 px-3 py-1 text-xs font-medium uppercase tracking-wide text-sky-200">
                        {thread.marketContextFindingCount} chart finding
                        {thread.marketContextFindingCount === 1 ? "" : "s"}
                      </div>
                    ) : null}
                    {thread.addQualityFindingCount > 0 ? (
                      <div
                        className={`inline-flex border px-3 py-1 text-xs font-medium uppercase tracking-wide ${
                          thread.addQualityRiskCount > 0
                            ? "border-amber-500/40 bg-amber-500/10 text-amber-200"
                            : thread.addQualityStrengthCount > 0
                              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
                              : "border-sky-500/40 bg-sky-500/10 text-sky-200"
                        }`}
                      >
                        {thread.addQualityFindingCount} add-quality review
                        {thread.addQualityFindingCount === 1 ? "" : "s"}
                      </div>
                    ) : null}
                    {thread.postExitFindingCount > 0 ? (
                      <div
                        className={`inline-flex border px-3 py-1 text-xs font-medium uppercase tracking-wide ${
                          thread.postExitRiskCount > 0
                            ? "border-amber-500/40 bg-amber-500/10 text-amber-200"
                            : thread.postExitStrengthCount > 0
                              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
                              : "border-sky-500/40 bg-sky-500/10 text-sky-200"
                        }`}
                      >
                        {thread.postExitFindingCount} after-exit review
                        {thread.postExitFindingCount === 1 ? "" : "s"}
                      </div>
                    ) : null}
                    {thread.protectedProfitBeforeFadeFindingCount > 0 ? (
                      <div className="inline-flex border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-medium uppercase tracking-wide text-emerald-200">
                        {thread.protectedProfitBeforeFadeFindingCount} protected before fade
                      </div>
                    ) : null}
                    {thread.exitLevelFindingCount > 0 ? (
                      <div
                        className={`inline-flex border px-3 py-1 text-xs font-medium uppercase tracking-wide ${
                          thread.exitLevelRiskCount > 0
                            ? "border-amber-500/40 bg-amber-500/10 text-amber-200"
                            : thread.exitLevelStrengthCount > 0
                              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
                              : "border-sky-500/40 bg-sky-500/10 text-sky-200"
                        }`}
                      >
                        {thread.exitLevelFindingCount} support/resistance exit review
                        {thread.exitLevelFindingCount === 1 ? "" : "s"}
                      </div>
                    ) : null}
                    {thread.volumeFindingCount > 0 ? (
                      <div
                        className={`inline-flex border px-3 py-1 text-xs font-medium uppercase tracking-wide ${
                          thread.volumeRiskCount > 0
                            ? "border-amber-500/40 bg-amber-500/10 text-amber-200"
                            : thread.volumeStrengthCount > 0
                              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
                              : "border-zinc-700 bg-zinc-900/40 text-zinc-300"
                        }`}
                      >
                        {thread.volumeFindingCount} volume review
                        {thread.volumeFindingCount === 1 ? "" : "s"}
                      </div>
                    ) : null}
                  </div>
                  <p className="mt-3 text-sm text-zinc-300">
                    {thread.storyDetail}
                  </p>
                  <p className="mt-2 text-sm text-zinc-500">
                    {thread.lifecycleDetail}
                  </p>
                  <p className="mt-2 text-sm text-zinc-500">
                    {thread.reviewPrompt}
                  </p>
                  <div className="mt-4 border-t border-zinc-900 pt-3">
                    <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                      Review Question
                    </div>
                    <div className="mt-1 text-sm text-zinc-200">
                      {thread.primaryReviewQuestion}
                    </div>
                    <div className="mt-2 text-sm text-sky-300">
                      Fix first: {thread.fixFirstAction}
                    </div>
                  </div>
                  <div className="mt-4 grid gap-2 md:grid-cols-2">
                    {thread.reviewEvidence.slice(0, 4).map((item) => (
                      <div
                        key={item.id}
                        className={`border px-3 py-2 ${
                          item.tone === "danger"
                            ? "border-rose-500/30 bg-rose-500/10"
                            : item.tone === "warning"
                              ? "border-amber-500/30 bg-amber-500/10"
                              : item.tone === "success"
                                ? "border-emerald-500/30 bg-emerald-500/10"
                                : "border-zinc-800 bg-zinc-950/30"
                        }`}
                      >
                        <div className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                          {item.title}
                        </div>
                        <div className="mt-1 text-xs text-zinc-500">
                          {item.detail}
                        </div>
                        <div className="mt-2 text-[11px] uppercase tracking-wide text-zinc-600">
                          {item.evidenceSource}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 grid gap-2">
                    {thread.roundTrips.map((roundTrip) => (
                      <Link
                        key={roundTrip.id}
                        className="grid gap-2 border border-zinc-900 px-3 py-2 text-sm transition hover:border-sky-500 hover:text-sky-200 sm:grid-cols-[92px_minmax(0,1fr)_90px]"
                        href={roundTrip.href}
                      >
                        <span className="text-zinc-500">
                          {roundTrip.roleLabel}
                        </span>
                        <span className="text-zinc-300">
                          {roundTrip.entryHourLabelEt} / {roundTrip.executionCount} execution
                          {roundTrip.executionCount === 1 ? "" : "s"} / {timeLabelEt(roundTrip.entryTime)} ET
                          {roundTrip.heldOvernight || roundTrip.crossedSessionDate
                            ? " / overnight exposure"
                            : ""}
                        </span>
                        <span className="text-xs text-zinc-500 sm:col-span-2">
                          {roundTrip.chartContextSummary}
                        </span>
                        <span
                          className={`font-medium sm:text-right ${
                            (roundTrip.grossRealizedPnl ?? 0) >= 0
                              ? "text-emerald-300"
                              : "text-rose-300"
                          }`}
                        >
                          {signed(roundTrip.grossRealizedPnl)}
                        </span>
                      </Link>
                    ))}
                  </div>
                </article>
              ))}
            </div>
            </>
          )}
        </section>

        <section
          id="session-stories"
          className="ti-panel p-4"
          data-testid="saved-trade-session-stories"
        >
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-zinc-100">
                Session Stories
              </h2>
              <p className="mt-1 max-w-3xl text-sm text-zinc-500">
                Session stories group all saved trades from one trading day so
                you can review the full day: green-to-red, many attempts on one
                ticker, high trade count, open or overnight exposure, and
                evidence-backed strengths worth repeating.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-right text-xs text-zinc-500 lg:grid-cols-3">
              <div className="ti-panel-soft px-3 py-2">
                <div className="text-lg font-semibold text-zinc-100">
                  {tradeThreadModel.sessionStoryCount}
                </div>
                <div>Sessions</div>
              </div>
              <div className="ti-panel-soft px-3 py-2">
                <div className="text-lg font-semibold text-zinc-100">
                  {tradeThreadModel.greenToRedSessionCount}
                </div>
                <div>Green to red</div>
              </div>
              <div className="ti-panel-soft px-3 py-2">
                <div className="text-lg font-semibold text-emerald-300">
                  {tradeThreadModel.strengthsToRepeatSessionCount}
                </div>
                <div>Strength sessions</div>
              </div>
            </div>
          </div>

          {tradeThreadModel.sessionStories.length === 0 ? (
            <div className="mt-4 border-t border-zinc-900 pt-4 text-sm text-zinc-500">
              No session stories yet. Save an import to group trades by trading day.
            </div>
          ) : (
            <div className="mt-4 grid gap-3 xl:grid-cols-2">
              {tradeThreadModel.sessionStories.slice(0, 4).map((story) => (
                <article className="ti-panel-soft p-4" key={story.id}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="text-xs uppercase tracking-wide text-zinc-500">
                        {story.sessionDate}
                      </div>
                      <h3 className="mt-1 text-lg font-semibold text-zinc-50">
                        {story.storyLabel}
                      </h3>
                    </div>
                    <div
                      className={`text-lg font-semibold ${
                        story.totalGrossRealizedPnl >= 0
                          ? "text-emerald-300"
                          : "text-rose-300"
                      }`}
                    >
                      {signed(story.totalGrossRealizedPnl)}
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-zinc-300">
                    {story.storyDetail}
                  </p>
                  <div className="mt-3 grid gap-2 md:grid-cols-4">
                    <div className="border border-zinc-900 bg-zinc-950/40 px-3 py-2">
                      <div className="text-xs uppercase tracking-wide text-zinc-500">
                        Round trips
                      </div>
                      <div className="mt-1 text-sm font-semibold text-zinc-100">
                        {story.tradeCount}
                      </div>
                    </div>
                    <div className="border border-zinc-900 bg-zinc-950/40 px-3 py-2">
                      <div className="text-xs uppercase tracking-wide text-zinc-500">
                        Symbols
                      </div>
                      <div className="mt-1 text-sm font-semibold text-zinc-100">
                        {story.symbolCount}
                      </div>
                    </div>
                    <div className="border border-zinc-900 bg-zinc-950/40 px-3 py-2">
                      <div className="text-xs uppercase tracking-wide text-zinc-500">
                        Peak to finish
                      </div>
                      <div className="mt-1 text-sm font-semibold text-zinc-100">
                        {signed(story.peakCumulativePnl)} to{" "}
                        {signed(story.totalGrossRealizedPnl)}
                      </div>
                    </div>
                    <div className="border border-zinc-900 bg-zinc-950/40 px-3 py-2">
                      <div className="text-xs uppercase tracking-wide text-zinc-500">
                        Strengths
                      </div>
                      <div className="mt-1 text-sm font-semibold text-emerald-300">
                        {story.marketContextStrengthCount}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 border-t border-zinc-900 pt-3">
                    <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                      Review prompt
                    </div>
                    <div className="mt-1 text-sm leading-6 text-zinc-200">
                      {story.reviewPrompt}
                    </div>
                    <div className="mt-2 text-sm text-sky-300">
                      Fix first: {story.fixFirstAction}
                    </div>
                  </div>
                  <div className="mt-4 grid gap-2 md:grid-cols-2">
                    {story.reviewEvidence.slice(0, 2).map((item) => (
                      <div
                        key={item.id}
                        className="border border-zinc-900 bg-zinc-950/40 px-3 py-2"
                      >
                        <div className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                          {item.title}
                        </div>
                        <div className="mt-1 text-xs leading-5 text-zinc-500">
                          {item.detail}
                        </div>
                      </div>
                    ))}
                  </div>
                  <Link
                    className="mt-4 inline-flex text-sm text-sky-300 hover:text-sky-200"
                    href={story.href}
                  >
                    Open main ticker story
                  </Link>
                </article>
              ))}
            </div>
          )}
        </section>

        {savedReviewQueue ? (
          <section
            id="review-lanes"
            className="ti-panel p-4"
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

        <section id="trade-list" className="ti-panel p-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {trades.length === 0 ? (
              <div className="border-t border-zinc-900 py-4 text-sm text-zinc-500 md:col-span-2 xl:col-span-3">
                No saved trades match this review lane.
              </div>
            ) : trades.map((trade) => {
              const reportTradeIndex = latestReport.sourceTradeIds.indexOf(trade.id) + 1;
              const reportRow =
                reportRowsByTradeId.get(trade.id) ??
                latestReport.report.trades.find(
                  (row) =>
                    row.symbol === trade.symbol &&
                    row.sessionDate === trade.sessionDate &&
                    row.entryTimeEt === trade.request.sessionContext?.entryTimeEt,
                );
              const directionLabel = userFacingTradeDirection(trade.tradeDirection);
              const executionCount = trade.request.executions.length;
              const firstExecution = trade.request.executions[0] ?? null;
              const lastExecution =
                trade.request.executions[trade.request.executions.length - 1] ?? null;

              return (
                <Link
                  key={trade.id}
                  className="ti-panel-soft block p-4 transition hover:border-sky-500 hover:text-sky-200"
                  data-testid={`saved-trade-link-${trade.id}`}
                  href={`/trades/${encodeURIComponent(trade.id)}#execution`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium text-zinc-100">
                        {trade.symbol} / {directionLabel}
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
                  <div className="mt-3 grid gap-1 border-t border-zinc-900 pt-3 text-xs text-zinc-500">
                    <div>
                      Round trip {reportTradeIndex > 0 ? reportTradeIndex : "open"}: {executionCount} execution
                      {executionCount === 1 ? "" : "s"} from{" "}
                      {firstExecution
                        ? new Date(String(firstExecution.timestamp)).toLocaleTimeString("en-US", {
                            hour: "numeric",
                            minute: "2-digit",
                            timeZone: "America/New_York",
                          })
                        : "time n/a"}{" "}
                      ET
                      {lastExecution && reportRow?.closedToFlat
                        ? ` to ${new Date(String(lastExecution.timestamp)).toLocaleTimeString("en-US", {
                            hour: "numeric",
                            minute: "2-digit",
                            timeZone: "America/New_York",
                          })} ET`
                        : " and still open"}
                    </div>
                    {trade.tradeDirection === "short" ? (
                      <div className="text-amber-300">
                        Starts with a sell in the CSV. Treat as position-history review, not a supported direction-specific coaching surface.
                      </div>
                    ) : null}
                    <div className="text-sky-300">Open trade replay</div>
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
        </section>
      </div>
    </main>
  );
}
