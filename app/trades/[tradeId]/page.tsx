import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  buildExecutionReplayVisual,
  buildProductTraderAnalyticsViewModel,
  buildTradeExecutionAutopsy,
  buildSavedTradeReviewViewModel,
  getLatestSavedTraderAnalyticsReport,
} from "../../../src/lib/trader-analytics";
import { buildSavedOrSampleTraderAnalyticsViewModel } from "../../../src/lib/trader-analytics/server/saved-trader-analytics-data";
import { buildTradeImportSourceCautionReadModel } from "../../../src/lib/trader-analytics/server/saved-import-source-caution";
import type { TradeReviewChecklist } from "../../../src/lib/trader-analytics/product/types";
import {
  AdvancedDisclosure,
  MetricCard,
  PlainStateBadge,
  PrimaryActionPanel,
} from "../../app-ui";
import { SavedImportSourceCaution } from "../../saved-import-source-caution";
import { TradeReviewActions } from "./trade-review-actions";

export const metadata: Metadata = {
  title: "Trade Review | Trader Intelligence",
};

export const dynamic = "force-dynamic";

function formatSigned(value: number | null): string {
  if (typeof value !== "number") {
    return "n/a";
  }

  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}`;
}

function heldSessionLabel(row: {
  heldSessionBuckets?: Array<string | unknown>;
} | null): string {
  const buckets = (row?.heldSessionBuckets ?? []).map(String);

  return buckets.length > 1 ? buckets.join(" -> ") : buckets[0] ?? "single session";
}

function applyPersistedChecklistState(
  checklist: TradeReviewChecklist | null,
  states: Array<{ itemId: string; status: string }>,
): TradeReviewChecklist | null {
  if (!checklist || states.length === 0) {
    return checklist;
  }

  const stateByItemId = new Map(states.map((state) => [state.itemId, state.status]));
  const items = checklist.items.map((item) => ({
    ...item,
    status: stateByItemId.get(item.id) === undefined
      ? item.status
      : (stateByItemId.get(item.id) as TradeReviewChecklist["items"][number]["status"]),
  }));
  const completeCount = items.filter((item) => item.status === "complete").length;
  const needsAttentionCount = items.filter(
    (item) => item.status === "attention",
  ).length;

  return {
    ...checklist,
    items,
    completionPct: Math.round((completeCount / items.length) * 100),
    needsAttentionCount,
    nextAction:
      items.find((item) => item.status === "attention")?.nextAction ??
      items.find((item) => item.status === "todo")?.nextAction ??
      "Review complete for this pass.",
  };
}

function decisionReviewStatusCopy(args: {
  hasSnapshot: boolean;
  diagnosticStatus?: string;
  diagnosticCode?: string;
}): {
  label: string;
  detail: string;
  scope: string;
  nextAction: string;
  tone: string;
} {
  if (args.hasSnapshot) {
    return {
      label: "Chart context review ready",
      detail:
        "Chart-context review completed. Use it alongside the execution replay and checklist.",
      scope: "Chart-context review",
      nextAction: "Work the saved checklist and record the final trade lesson.",
      tone: "text-emerald-300",
    };
  }

  if (args.diagnosticStatus === "blocked_open_trade") {
    return {
      label: "Open trade",
      detail:
        "The import ended with shares still open, so completed-trade review waits until the position is flat.",
      scope: "Open trade, execution-only",
      nextAction: "Wait until the position is flat before completed-trade coaching.",
      tone: "text-sky-300",
    };
  }

  if (
    args.diagnosticStatus === "market_context_unavailable" ||
    args.diagnosticCode === "market_context_unavailable"
  ) {
    return {
      label: "Market context waiting",
      detail:
        "Execution review is available now, but levels or candle context were not available. Do not treat market-context conclusions as available until context is backfilled.",
      scope: "Execution-only fallback",
      nextAction:
        "Review entries, adds, reductions, exits, timing, and P/L evidence now; backfill market context later.",
      tone: "text-amber-300",
    };
  }

  if (args.diagnosticStatus === "analysis_failed" || args.diagnosticCode) {
    return {
      label: "Chart review needs technical follow-up",
      detail:
        "Execution review is available now, but decision-review analysis needs a manual follow-up. Keep coaching conservative and do not treat market-context conclusions as available.",
      scope: "Execution-only fallback",
      nextAction: "Use the execution replay now and keep chart-context conclusions unavailable until the follow-up is resolved.",
      tone: "text-amber-300",
    };
  }

  return {
    label: "Execution-only review",
    detail:
      "No saved decision-review snapshot is attached yet, so this page is limited to execution evidence.",
    scope: "Execution-only",
    nextAction: "Review entries, adds, reductions, exits, timing, and P/L evidence.",
    tone: "text-zinc-300",
  };
}

function executionSideLabel(side: string): string {
  const normalized = side.toLowerCase();

  if (normalized.includes("buy") || normalized.includes("bot")) {
    return "Buy / Add";
  }

  if (normalized.includes("sell") || normalized.includes("sld")) {
    return "Sell / Reduce";
  }

  return side;
}

export default async function TradeReviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ tradeId: string }>;
  searchParams?: Promise<{ from?: string; queue?: string }>;
}) {
  const routeParams = await params;
  const query = await searchParams;
  const tradeId = decodeURIComponent(routeParams.tradeId);
  const data = buildSavedOrSampleTraderAnalyticsViewModel();
  const trade = data.repository.getTrade(data.userId, tradeId);
  const reports = data.repository.listReports(data.userId);
  const containingReport =
    reports.find((report) => report.sourceTradeIds.includes(tradeId)) ??
    getLatestSavedTraderAnalyticsReport(reports);

  if (!trade) {
    notFound();
  }

  const view = buildSavedTradeReviewViewModel({
    trade,
    report: containingReport,
  });
  const importSourceCaution =
    data.mode === "saved"
      ? buildTradeImportSourceCautionReadModel({
          repository: data.repository,
          trade,
        })
      : null;
  const replay = buildExecutionReplayVisual(view);
  const analytics = buildProductTraderAnalyticsViewModel({
    repository: data.repository,
    userId: data.userId,
    importRequests: data.importRequests,
    storageMode: data.mode === "saved" ? "local_sqlite_single_user" : "sample_in_memory",
  });
  const mistakeTimeline = analytics.coachActionLoop.mistakeTimeline.items.filter(
    (item) => item.tradeId === trade.id,
  );
  const similarTrades =
    analytics.coachActionLoop.tradeSimilarity.groups.find(
      (group) => group.anchorTradeId === trade.id,
    )?.similarTrades ?? [];
  const gradeExplanation =
    analytics.productPolish.gradeExplainability.find(
      (grade) => grade.tradeId === trade.id,
    ) ?? null;
  const evidenceCards = analytics.productPolish.evidenceCards.filter((card) =>
    card.relatedTradeIds.includes(trade.id),
  );
  const generatedChecklist =
    analytics.reviewHabitLoop.tradeReviewChecklists.find(
      (item) => item.tradeId === trade.id,
    ) ?? null;
  const persistedChecklistStates =
    data.mode === "saved"
      ? data.repository.listTradeReviewItemStates(trade.id)
      : [];
  const decisionReviewSnapshot =
    data.mode === "saved"
      ? data.repository.getDecisionReviewSnapshotForTrade(trade.id)
      : null;
  const decisionReviewDiagnostics =
    data.mode === "saved"
      ? data.repository.listDecisionReviewDiagnosticsForTrade(trade.id)
      : [];
  const decisionReviewStatus = decisionReviewStatusCopy({
    hasSnapshot: Boolean(decisionReviewSnapshot),
    diagnosticStatus: decisionReviewDiagnostics[0]?.status,
    diagnosticCode: decisionReviewDiagnostics[0]?.code,
  });
  const checklist = applyPersistedChecklistState(
    generatedChecklist,
    persistedChecklistStates,
  );
  const checklistProgress = checklist
    ? `${checklist.completionPct}% complete`
    : "Checklist waiting";
  const autopsy = containingReport
    ? buildTradeExecutionAutopsy({ trade, report: containingReport })
    : null;
  const quality = autopsy?.quality ?? null;
  const backHref =
    query?.from === "review-queue"
      ? `/review?queue=${encodeURIComponent(query.queue ?? "highest_priority")}`
      : "/analytics";
  const backLabel =
    query?.from === "review-queue"
      ? "Back to review queue"
      : "Back to analytics";

  return (
    <main
      className="min-h-screen bg-zinc-950 px-5 py-8 text-zinc-100 sm:px-8"
      data-testid="trade-review-page"
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="border-b border-zinc-800 pb-6">
          <Link className="text-sm text-sky-300 hover:text-sky-200" href={backHref}>
            {backLabel}
          </Link>
          <h1 className="mt-3 text-3xl font-semibold text-zinc-50">
            {trade.symbol} Trade Review
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            Execution-only review for {trade.tradeDirection} /{" "}
            {trade.sessionDate} / {trade.sessionBucket}
          </p>
        </header>

        <SavedImportSourceCaution
          caution={importSourceCaution}
          surface="trade"
        />

        <PrimaryActionPanel
          actionHref={checklist ? "#trade-review-checklist" : "#trade-execution-replay"}
          actionLabel={checklist ? "Continue checklist" : "Review execution replay"}
          body={`${trade.symbol} ${trade.tradeDirection} trade from ${trade.sessionDate}. Gross P/L is ${formatSigned(
            view.reportRow?.grossRealizedPnl ?? null,
          )}; lifecycle is ${view.reportRow?.isOpenPosition ? "open" : "flat"}.`}
          eyebrow="Trade review workspace"
          testId="trade-review-workspace"
          title="What happened, what to review, and what to write down"
          tone="info"
        />

        <section
          className="grid gap-4 md:grid-cols-4"
          data-testid="trade-review-workspace-summary"
        >
          <MetricCard
            label="What Happened"
            value={formatSigned(view.reportRow?.grossRealizedPnl ?? null)}
            detail={`${trade.symbol} / ${trade.sessionBucket}`}
            tone={(view.reportRow?.grossRealizedPnl ?? 0) >= 0 ? "success" : "danger"}
          />
          <MetricCard
            label="What To Review"
            value={decisionReviewSnapshot ? "Chart context ready" : "Execution review"}
            detail={decisionReviewStatus.label}
            tone={decisionReviewStatus.tone.includes("emerald") ? "success" : decisionReviewStatus.tone.includes("amber") ? "warning" : "info"}
          />
          <MetricCard
            label="What To Write Down"
            value={checklistProgress}
            detail={checklist ? "Use the checklist's next item." : "Start with the execution replay."}
            tone="info"
          />
          <MetricCard
            label="What Is Unavailable"
            value={decisionReviewSnapshot ? "Nothing major" : "Chart context"}
            detail={decisionReviewSnapshot ? "Context is attached." : "Use execution evidence now."}
            tone={decisionReviewSnapshot ? "success" : "warning"}
          />
        </section>

        <section
          className="border border-zinc-800 bg-zinc-950 p-4"
          data-testid="trade-feedback-scope"
        >
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                What This Review Can Use
              </div>
              <h2 className={`mt-2 text-lg font-semibold ${decisionReviewStatus.tone}`}>
                {decisionReviewStatus.label}
              </h2>
              <div className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
                {decisionReviewStatus.detail}
              </div>
              <div className="mt-2 text-sm text-sky-300">
                Next: {decisionReviewStatus.nextAction}
              </div>
            </div>
            <div className="border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs uppercase tracking-wide text-zinc-400">
              {decisionReviewStatus.scope}
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <div className="border border-zinc-800 bg-zinc-950 p-4">
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Gross P/L
            </div>
            <div
              className={`mt-3 text-2xl font-semibold ${
                (view.reportRow?.grossRealizedPnl ?? 0) >= 0
                  ? "text-emerald-300"
                  : "text-rose-300"
              }`}
            >
              {formatSigned(view.reportRow?.grossRealizedPnl ?? null)}
            </div>
          </div>
          <div className="border border-zinc-800 bg-zinc-950 p-4">
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Executions
            </div>
            <div className="mt-3 text-2xl font-semibold text-zinc-100">
              {view.executionTimeline.length}
            </div>
          </div>
          <div className="border border-zinc-800 bg-zinc-950 p-4">
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Max Position
            </div>
            <div className="mt-3 text-2xl font-semibold text-zinc-100">
              {view.reportRow?.maxPositionSize ?? "n/a"}
            </div>
          </div>
          <div className="border border-zinc-800 bg-zinc-950 p-4">
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Lifecycle
            </div>
            <div className="mt-3 text-2xl font-semibold text-zinc-100">
              {view.reportRow?.isOpenPosition ? "Open" : "Flat"}
            </div>
          </div>
        </section>

        <section
          className="border border-zinc-800 bg-zinc-950 p-4"
          data-testid="trade-session-time"
        >
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-zinc-100">
                Session Time
              </h2>
              <div className="mt-1 text-sm text-zinc-500">
                Market session and entry-hour analytics are classified in Eastern Time.
              </div>
            </div>
            <div className="font-mono text-xs text-sky-300">
              {view.reportRow?.entryHourLabelEt ?? "hour n/a"}
            </div>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="border-t border-zinc-900 py-3">
              <div className="text-xs uppercase tracking-wide text-zinc-500">
                Entry Session
              </div>
              <div className="mt-2 text-sm text-zinc-300">
                {String(view.reportRow?.entrySessionBucket ?? trade.sessionBucket)}
              </div>
            </div>
            <div className="border-t border-zinc-900 py-3">
              <div className="text-xs uppercase tracking-wide text-zinc-500">
                Entry Hour
              </div>
              <div className="mt-2 text-sm text-zinc-300">
                {view.reportRow?.entryHourLabelEt ?? "n/a"}
              </div>
            </div>
            <div className="border-t border-zinc-900 py-3">
              <div className="text-xs uppercase tracking-wide text-zinc-500">
                Held Through
              </div>
              <div className="mt-2 text-sm text-zinc-300">
                {heldSessionLabel(view.reportRow)}
              </div>
            </div>
            <div className="border-t border-zinc-900 py-3">
              <div className="text-xs uppercase tracking-wide text-zinc-500">
                Exposure Segments
              </div>
              <div className="mt-2 text-sm text-zinc-300">
                {(view.reportRow?.sessionExposure ?? []).length}
              </div>
            </div>
          </div>
          {(view.reportRow?.sessionExposure ?? []).length > 0 ? (
            <div className="mt-4 grid gap-2">
              {(view.reportRow?.sessionExposure ?? []).slice(0, 6).map((segment) => (
                <div
                  key={`${segment.startTimestamp}:${segment.endTimestamp}`}
                  className="grid gap-2 border-t border-zinc-900 py-2 text-xs md:grid-cols-[140px_140px_1fr_90px]"
                >
                  <span className="font-mono text-zinc-500">
                    {segment.hourLabelEt}
                  </span>
                  <span className="text-zinc-300">{segment.sessionBucket}</span>
                  <span className="font-mono text-zinc-500">
                    {segment.startTimestamp} to {segment.endTimestamp}
                  </span>
                  <span className="text-zinc-400">
                    {segment.durationMinutes.toFixed(1)}m
                  </span>
                </div>
              ))}
            </div>
          ) : null}
        </section>

        {checklist ? (
          <section
            className="border border-zinc-800 bg-zinc-950 p-4"
            data-testid="trade-review-checklist"
          >
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h2 className="text-sm font-semibold text-zinc-100">
                  Trade Review Checklist
                </h2>
                <div className="mt-1 text-sm text-zinc-500">
                  {checklist.nextAction}
                </div>
              </div>
              <div className="font-mono text-xl text-sky-300">
                {checklist.completionPct}%
              </div>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {checklist.items.map((item) => (
                <div key={item.id} className="border-t border-zinc-900 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-zinc-300">{item.label}</span>
                    <span className="text-xs uppercase tracking-wide text-zinc-500">
                      {item.status}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-zinc-500">
                    {item.evidence}
                  </div>
                  <div className="mt-2 text-xs text-sky-300">
                    {item.nextAction}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {decisionReviewSnapshot || decisionReviewDiagnostics.length > 0 ? (
          <section
            className="border border-zinc-800 bg-zinc-950 p-4"
            data-testid="trade-decision-review-snapshot"
          >
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h2 className="text-sm font-semibold text-zinc-100">
                  Chart Context Review
                </h2>
                <div className="mt-1 text-sm text-zinc-500">
                  {decisionReviewSnapshot?.review.coachingHeadline ??
                    decisionReviewDiagnostics[0]?.message ??
                    "Chart context review has not completed for this trade yet."}
                </div>
              </div>
              <div className="font-mono text-xs text-sky-300">
                  {decisionReviewSnapshot?.review.marketContextSource ??
                  decisionReviewDiagnostics[0]?.status ??
                  "queued"}
              </div>
            </div>
            {decisionReviewSnapshot ? (
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {decisionReviewSnapshot.review.insights.slice(0, 6).map((insight) => (
                  <div key={insight.id} className="border-t border-zinc-900 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm text-zinc-300">
                        {insight.title}
                      </span>
                      <span className="text-xs uppercase tracking-wide text-zinc-500">
                        {insight.tone}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-zinc-500">
                      {insight.summary}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <AdvancedDisclosure summary="Technical review limits">
                <div className="mt-3 grid gap-2">
                  {decisionReviewDiagnostics.map((diagnostic) => (
                    <div key={diagnostic.id} className="border-t border-zinc-900 py-3">
                      <PlainStateBadge state={diagnostic.code} tone="warning" />
                      <div className="mt-1 text-xs text-zinc-500">
                        {diagnostic.message}
                      </div>
                    </div>
                  ))}
                </div>
              </AdvancedDisclosure>
            )}
            <div className="mt-4 flex flex-wrap gap-3 border-t border-zinc-900 pt-3">
              <Link
                className="text-sm text-sky-300 hover:text-sky-200"
                href="/review?queue=highest_priority"
              >
                Open saved review queue
              </Link>
              <Link
                className="text-sm text-sky-300 hover:text-sky-200"
                href="/trades"
              >
                Open saved trades
              </Link>
            </div>
          </section>
        ) : null}

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.45fr)]">
          <div
            className="border border-zinc-800 bg-zinc-950 p-4"
            data-testid="trade-execution-replay"
          >
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h2 className="text-sm font-semibold text-zinc-100">
                  Execution Replay
                </h2>
                <div className="mt-1 text-sm text-zinc-500">
                  {autopsy?.summary ?? "Execution-only replay."}
                </div>
              </div>
              <div className="font-mono text-xl text-sky-300">
                {quality ? `${quality.overallScore}/100` : "n/a"}
              </div>
            </div>
            <div className="mt-4 grid gap-3">
              {replay.steps.map((point) => (
                <div
                  key={point.index}
                  className="grid gap-2 md:grid-cols-[160px_90px_110px_1fr_90px_90px] md:items-center"
                  data-testid={`trade-replay-step-${point.index}`}
                >
                  <div className="font-mono text-xs text-zinc-500">
                    {point.timestamp}
                  </div>
                  <div className="text-sm uppercase text-zinc-300">
                  {executionSideLabel(point.side)}
                  </div>
                  <div
                    className={`text-xs ${
                      point.riskDirection === "increased"
                        ? "text-amber-300"
                        : point.riskDirection === "closed"
                          ? "text-emerald-300"
                          : "text-zinc-400"
                    }`}
                  >
                    {point.marker}
                  </div>
                  <div className="h-2 bg-zinc-900">
                    <div
                      className="h-2 bg-sky-400"
                      style={{
                        width: `${Math.max(point.positionPctOfMax * 100, 2)}%`,
                      }}
                    />
                  </div>
                  <div className="font-mono text-xs text-zinc-400">
                    {point.positionBeforeExecution} to {point.positionAfterExecution}
                  </div>
                  <div className="font-mono text-xs text-zinc-500">
                    {point.realizedPnlProgress === null
                      ? point.marker
                      : formatSigned(point.realizedPnlProgress)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div
            className="border border-zinc-800 bg-zinc-950 p-4"
            data-testid="trade-review-points"
          >
            <h2 className="text-sm font-semibold text-zinc-100">
              Risks And Strengths
            </h2>
            <div className="mt-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-amber-300">
                Risks
              </div>
              <div className="mt-2 grid gap-2">
                {view.risks.length === 0 ? (
                  <div className="text-sm text-zinc-500">None</div>
                ) : (
                  view.risks.map((risk) => (
                    <div key={risk.id} className="border-t border-zinc-900 py-2">
                      <div className="text-sm text-zinc-100">{risk.label}</div>
                      <div className="mt-1 text-xs text-zinc-500">
                        {risk.summary}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="mt-6">
              <div className="text-xs font-semibold uppercase tracking-wide text-emerald-300">
                Strengths
              </div>
              <div className="mt-2 grid gap-2">
                {view.strengths.length === 0 ? (
                  <div className="text-sm text-zinc-500">None</div>
                ) : (
                  view.strengths.map((strength) => (
                    <div
                      key={strength.id}
                      className="border-t border-zinc-900 py-2"
                    >
                      <div className="text-sm text-zinc-100">
                        {strength.label}
                      </div>
                      <div className="mt-1 text-xs text-zinc-500">
                        {strength.summary}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>

        {autopsy ? (
          <section className="grid gap-6 xl:grid-cols-[minmax(0,0.55fr)_minmax(320px,0.45fr)]">
            <div
              className="border border-zinc-800 bg-zinc-950 p-4"
              data-testid="trade-quality"
            >
              <h2 className="text-sm font-semibold text-zinc-100">
                Trade Quality
              </h2>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {autopsy.quality.dimensions.map((dimension) => (
                  <div key={dimension.id} className="border-t border-zinc-900 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm text-zinc-300">
                        {dimension.label}
                      </span>
                      <span className="font-mono text-xs text-sky-300">
                        {dimension.score}/100
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 bg-zinc-900">
                      <div
                        className="h-1.5 bg-sky-400"
                        style={{ width: `${dimension.score}%` }}
                      />
                    </div>
                    <div className="mt-2 text-xs text-zinc-500">
                      {dimension.detail}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div
              className="border border-zinc-800 bg-zinc-950 p-4"
              data-testid="trade-decision-autopsy"
            >
              <h2 className="text-sm font-semibold text-zinc-100">
                Decision Autopsy
              </h2>
              <div className="mt-4 grid gap-3">
                {autopsy.decisions.map((decision) => (
                  <div key={decision.id} className="border-t border-zinc-900 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm text-zinc-300">
                        {decision.label}
                      </span>
                      <span className="text-xs uppercase tracking-wide text-zinc-500">
                        {decision.role}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-zinc-500">
                      {decision.detail}
                    </div>
                    {decision.relatedPointLabels.length > 0 ? (
                      <div className="mt-2 text-xs text-amber-300">
                        {decision.relatedPointLabels.join(" / ")}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        <section className="grid gap-6 xl:grid-cols-[minmax(0,0.55fr)_minmax(320px,0.45fr)]">
          <div className="border border-zinc-800 bg-zinc-950 p-4">
            <h2 className="text-sm font-semibold text-zinc-100">
              Grade Explainability
            </h2>
            {gradeExplanation ? (
              <div className="mt-4">
                <div className="flex items-center justify-between gap-3 border-t border-zinc-900 py-3">
                  <span className="text-sm text-zinc-300">
                    {gradeExplanation.summary}
                  </span>
                  <span className="font-mono text-xs text-sky-300">
                    {gradeExplanation.overallScore}/100
                  </span>
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {[
                    ...gradeExplanation.negativeDrivers,
                    ...gradeExplanation.positiveDrivers,
                    ...gradeExplanation.neutralDrivers,
                  ].map((driver) => (
                    <div key={driver.id} className="border-t border-zinc-900 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm text-zinc-300">
                          {driver.label}
                        </span>
                        <span className="font-mono text-xs text-zinc-500">
                          {driver.score}/100
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-zinc-500">
                        {driver.explanation}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 text-xs text-sky-300">
                  {gradeExplanation.nextReviewAction}
                </div>
              </div>
            ) : (
              <div className="mt-4 text-sm text-zinc-500">
                No grade explanation is available for this trade.
              </div>
            )}
          </div>

          <div className="border border-zinc-800 bg-zinc-950 p-4">
            <h2 className="text-sm font-semibold text-zinc-100">
              Evidence Cards
            </h2>
            <div className="mt-4 grid gap-3">
              {evidenceCards.length === 0 ? (
                <div className="text-sm text-zinc-500">
                  No product evidence cards are linked to this trade yet.
                </div>
              ) : (
                evidenceCards.slice(0, 5).map((card) => (
                  <div key={card.id} className="border-t border-zinc-900 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm text-zinc-300">{card.title}</span>
                      <span className="text-xs uppercase tracking-wide text-zinc-500">
                        {card.source}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-zinc-500">
                      {card.whatHappened}
                    </div>
                    <div className="mt-2 text-xs text-sky-300">
                      {card.reviewAction}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <div className="border border-zinc-800 bg-zinc-950 p-4">
            <h2 className="text-sm font-semibold text-zinc-100">
              Mistake Timeline
            </h2>
            <div className="mt-4 grid gap-3">
              {mistakeTimeline.length === 0 ? (
                <div className="text-sm text-zinc-500">
                  No mapped mistake timeline items for this trade.
                </div>
              ) : (
                mistakeTimeline.slice(0, 6).map((item) => (
                  <div key={item.id} className="border-t border-zinc-900 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm text-zinc-300">{item.label}</span>
                      <span className="font-mono text-xs text-amber-300">
                        #{item.executionIndex + 1}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-zinc-500">
                      {item.detail}
                    </div>
                    <div className="mt-2 text-xs text-zinc-500">
                      {item.confidence} confidence / {item.role}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="border border-zinc-800 bg-zinc-950 p-4">
            <h2 className="text-sm font-semibold text-zinc-100">
              Similar Trades
            </h2>
            <div className="mt-4 grid gap-3">
              {similarTrades.length === 0 ? (
                <div className="text-sm text-zinc-500">
                  No similar execution patterns in this sample.
                </div>
              ) : (
                similarTrades.map((similar) => (
                  <Link
                    key={similar.tradeId}
                    className="block border-t border-zinc-900 py-3 hover:text-sky-200"
                    href={`/trades/${similar.tradeId}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm text-zinc-300">
                        {similar.symbol}
                      </span>
                      <span className="font-mono text-xs text-zinc-500">
                        {similar.similarityScore} match
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-zinc-500">
                      {similar.sharedReasons.join(" / ")}
                    </div>
                    <div className="mt-2 font-mono text-xs text-zinc-500">
                      P/L {formatSigned(similar.grossRealizedPnl)} / quality{" "}
                      {similar.qualityScore ?? "n/a"}
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </section>

        <TradeReviewActions
          checklist={checklist}
          notes={trade.notes}
          tradeId={trade.id}
        />

        <section className="grid gap-6 xl:grid-cols-2">
          <div className="border border-zinc-800 bg-zinc-950 p-4">
            <h2 className="text-sm font-semibold text-zinc-100">
              Journal Prompts
            </h2>
            <div className="mt-4 grid gap-3">
              {view.journalPrompts.map((prompt) => (
                <div key={prompt.id} className="border-t border-zinc-900 py-3">
                  <div className="text-xs uppercase tracking-wide text-zinc-500">
                    {prompt.label}
                  </div>
                  <div className="mt-2 text-sm text-zinc-300">
                    {prompt.prompt}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
