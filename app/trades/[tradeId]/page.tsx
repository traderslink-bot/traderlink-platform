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
import { buildSavedTradeThreadReadModel } from "../../../src/lib/trader-analytics/server/saved-trade-threads";
import type { TradeReviewChecklist } from "../../../src/lib/trader-analytics/product/types";
import { mapDecisionReviewInsightForUser } from "../../../src/lib/user-facing-behavior";
import {
  AdvancedDisclosure,
  DashboardSideNav,
  MetricCard,
  PlainStateBadge,
  PrimaryActionPanel,
  userFacingTradeDirection,
  withPageAnchor,
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

function sessionStoryToneClass(storyKind: string): string {
  if (storyKind === "green_to_red_session") {
    return "border-rose-500/30 bg-rose-500/10";
  }

  if (storyKind === "same_symbol_many_attempts" || storyKind === "session_high_trade_count") {
    return "border-amber-500/30 bg-amber-500/10";
  }

  if (storyKind === "strengths_to_repeat_session" || storyKind === "positive_controlled_session") {
    return "border-emerald-500/30 bg-emerald-500/10";
  }

  return "border-sky-500/30 bg-sky-500/10";
}

function heldSessionLabel(row: {
  heldSessionBuckets?: Array<string | unknown>;
} | null): string {
  const buckets = (row?.heldSessionBuckets ?? []).map(String);

  return buckets.length > 1 ? buckets.join(" -> ") : buckets[0] ?? "single session";
}

function plainEvidenceSourceLabel(value: string | null | undefined): string {
  if (!value) {
    return "Saved review evidence";
  }

  const normalized = value.toLowerCase();

  if (
    normalized.includes("levels_system") ||
    normalized.includes("daily_4h") ||
    normalized.includes("market_context")
  ) {
    return "Chart context evidence";
  }

  if (normalized.includes("execution")) {
    return "Execution replay";
  }

  if (normalized.includes("saved") || normalized.includes("sqlite")) {
    return "Saved import data";
  }

  if (normalized.includes("diagnostic") || normalized.includes("analysis_failed")) {
    return "Technical follow-up";
  }

  return "Saved review evidence";
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
        "Chart review completed. Use it alongside the execution replay and checklist.",
      scope: "Chart review",
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
      label: "Chart context waiting",
      detail:
        "Execution review is available now, but levels or candle context were not available. Do not treat chart conclusions as available until context is backfilled.",
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
        "Execution review is available now, but chart review analysis needs a manual follow-up. Keep coaching conservative and do not treat chart conclusions as available.",
      scope: "Execution-only fallback",
      nextAction: "Use the execution replay now and keep chart conclusions unavailable until the follow-up is resolved.",
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

function decisionReviewDiagnosticBadgeState(diagnostic: {
  code?: string | null;
  status?: string | null;
}): string {
  const value = `${diagnostic.status ?? ""} ${diagnostic.code ?? ""}`.toLowerCase();

  if (value.includes("market_context_unavailable")) {
    return "market_context_unavailable";
  }

  if (value.includes("blocked_open_trade") || value.includes("open_trade")) {
    return "blocked_open_trade";
  }

  if (value.includes("queued")) {
    return "queued";
  }

  return "analysis_failed";
}

function decisionReviewDiagnosticUserMessage(diagnostic: {
  code?: string | null;
  status?: string | null;
}): string {
  const state = decisionReviewDiagnosticBadgeState(diagnostic);

  if (state === "market_context_unavailable") {
    return "Chart context was not available for this trade yet. Use execution replay now and backfill chart context later.";
  }

  if (state === "blocked_open_trade") {
    return "The import ended with shares still open, so completed-trade coaching waits until the position is flat.";
  }

  if (state === "queued") {
    return "This trade is waiting for a saved chart review run.";
  }

  return "Chart analysis needs technical follow-up. Keep the review execution-only until that follow-up is resolved.";
}

function decisionReviewFindingToneClass(tone: string): string {
  if (tone === "danger") {
    return "text-rose-300";
  }

  if (tone === "success") {
    return "text-emerald-300";
  }

  if (tone === "warning") {
    return "text-amber-300";
  }

  return "text-sky-300";
}

function decisionReviewFindingBadgeLabel(opportunityType: string): string {
  if (opportunityType === "risk_to_reduce") {
    return "Risk to reduce";
  }

  if (opportunityType === "strength_to_repeat") {
    return "Strength to repeat";
  }

  if (opportunityType === "review_prompt") {
    return "Review prompt";
  }

  return "Advanced note";
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

type ExecutionReplayStep = ReturnType<typeof buildExecutionReplayVisual>["steps"][number];

function executionActionLabel(
  point: ExecutionReplayStep,
  tradeDirection: string,
): string {
  if (tradeDirection === "short") {
    return point.side.toLowerCase().includes("sell")
      ? "Position opened from sell-side history"
      : "Position reduced from buy-side history";
  }

  switch (point.role) {
    case "initial_entry":
      return "Entry";
    case "add":
      return "Add";
    case "trim":
      return "Reduce";
    case "full_exit":
      return "Exit to flat";
    default:
      if (point.positionBeforeExecution === 0 && point.positionAfterExecution > 0) {
        return "Entry";
      }

      if (point.positionAfterExecution === 0 && point.positionBeforeExecution > 0) {
        return "Exit to flat";
      }

      return executionSideLabel(point.side);
  }
}

function executionActionTone(point: ExecutionReplayStep): string {
  if (point.riskDirection === "closed") {
    return "border-emerald-500/40 bg-emerald-500/10 text-emerald-300";
  }

  if (point.riskDirection === "increased") {
    return "border-amber-500/40 bg-amber-500/10 text-amber-300";
  }

  return "border-sky-500/40 bg-sky-500/10 text-sky-300";
}

function executionBarClass(point: ExecutionReplayStep): string {
  if (point.riskDirection === "closed") {
    return "bg-emerald-400";
  }

  if (point.riskDirection === "increased") {
    return "bg-amber-400";
  }

  return "bg-sky-400";
}

function replayPnlLabel(point: ExecutionReplayStep): string {
  if (typeof point.realizedPnlProgress === "number") {
    return formatSigned(point.realizedPnlProgress);
  }

  if (point.positionAfterExecution !== 0) {
    return "P/L not realized yet";
  }

  return "P/L n/a";
}

function replayPnlTone(point: ExecutionReplayStep): string {
  if (typeof point.realizedPnlProgress !== "number") {
    return "text-zinc-500";
  }

  return point.realizedPnlProgress >= 0 ? "text-emerald-300" : "text-rose-300";
}

function formatExecutionPrice(value: number): string {
  return `$${value.toFixed(value >= 10 ? 2 : 4)}`;
}

export default async function TradeReviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ tradeId: string }>;
  searchParams?: Promise<{ focus?: string; from?: string; queue?: string }>;
}) {
  const routeParams = await params;
  const query = await searchParams;
  const tradeId = decodeURIComponent(routeParams.tradeId);
  const data = buildSavedOrSampleTraderAnalyticsViewModel();
  const trade = data.repository.getTrade(data.userId, tradeId);
  const allTrades = data.repository.listTrades(data.userId);
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
  const decisionReviewSnapshots =
    data.mode === "saved"
      ? [
          ...new Set(
            allTrades
              .map((savedTrade) => savedTrade.importBatchId)
              .filter((batchId): batchId is string => Boolean(batchId)),
          ),
        ].flatMap((batchId) =>
          data.repository.listDecisionReviewSnapshotsForBatch(batchId),
        )
      : [];
  const tradeThreadModel = buildSavedTradeThreadReadModel({
    decisionReviewSnapshots,
    report: containingReport,
    source: data.mode === "saved" ? "saved_sqlite" : "sample",
    trades: allTrades,
  });
  const activeThread =
    tradeThreadModel.threads.find((thread) =>
      thread.roundTrips.some((roundTrip) => roundTrip.tradeId === trade.id),
    ) ?? null;
  const activeSessionStory =
    tradeThreadModel.sessionStories.find(
      (story) => story.sessionDate === (activeThread?.sessionDate ?? trade.sessionDate),
    ) ?? null;
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
  const decisionReviewInsightCards = decisionReviewSnapshot
    ? decisionReviewSnapshot.review.insights
        .map((insight) =>
          mapDecisionReviewInsightForUser(insight, "/trades/[tradeId]"),
        )
        .filter((insight) => insight.canShowPrimary)
        .slice(0, 6)
    : [];
  const hiddenDecisionReviewInsightCount = decisionReviewSnapshot
    ? decisionReviewSnapshot.review.insights.length -
      decisionReviewInsightCards.length
    : 0;
  const primaryDecisionReviewInsight =
    decisionReviewInsightCards.find(
      (insight) => insight.opportunityType === "risk_to_reduce",
    ) ??
    decisionReviewInsightCards.find(
      (insight) => insight.opportunityType === "strength_to_repeat",
    ) ??
    decisionReviewInsightCards[0] ??
    null;
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
  const directionLabel = userFacingTradeDirection(trade.tradeDirection);
  const cameFromCoach = query?.from === "coach";
  const cameFromReviewQueue = query?.from === "review-queue";
  const coachFocusLabel = query?.focus ?? null;
  const backHref =
    cameFromCoach
      ? "/coach#next-action"
      : cameFromReviewQueue
      ? `/review?queue=${encodeURIComponent(query.queue ?? "highest_priority")}`
      : "/analytics";
  const backLabel =
    cameFromCoach
      ? "Back to coach"
      : cameFromReviewQueue
      ? "Back to review queue"
      : "Back to analytics";
  const grossRealizedPnl = view.reportRow?.grossRealizedPnl ?? null;
  const mainBehaviorLabel =
    grossRealizedPnl !== null && grossRealizedPnl >= 0
      ? (gradeExplanation?.topStrengthLabel ??
        quality?.topStrengthLabel ??
        activeThread?.primaryReviewQuestion ??
        "Look for the strongest execution choice")
      : (gradeExplanation?.topRiskLabel ??
        quality?.topRiskLabel ??
        activeThread?.primaryReviewQuestion ??
        "Review the execution behavior");
  const fixFirstAction =
    activeThread?.fixFirstAction ?? checklist?.nextAction ?? decisionReviewStatus.nextAction;
  const evidenceSummary =
    evidenceCards[0]?.whyItMatters ??
    activeThread?.reviewEvidence[0]?.detail ??
    decisionReviewStatus.detail;
  const currentThreadRoundTrip =
    activeThread?.roundTrips.find((roundTrip) => roundTrip.tradeId === trade.id) ?? null;
  const primaryReviewAnchor = checklist ? "#writing-flow" : "#execution";
  const realizedReplaySteps = replay.steps.filter(
    (step) => typeof step.realizedPnlProgress === "number",
  );
  const finalReplayPnl =
    [...realizedReplaySteps].reverse()[0]?.realizedPnlProgress ?? grossRealizedPnl;
  const replaySummary =
    realizedReplaySteps.length > 0
      ? `Execution-derived realized P/L is visible after reductions or exits. Final visible P/L is ${formatSigned(
          finalReplayPnl,
        )}.`
      : "This replay shows position movement now. Exact realized P/L progression is waiting until a reduction or closing execution is available.";

  return (
    <main
      className="ti-dashboard-bg min-h-screen px-5 py-8 text-zinc-100 sm:px-8"
      data-testid="trade-review-page"
    >
      <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-8">
        <header className="ti-panel p-6">
          <Link className="text-sm text-sky-300 hover:text-sky-200" href={backHref}>
            {backLabel}
          </Link>
          <h1 className="mt-3 text-3xl font-semibold text-zinc-50">
            {trade.symbol} Trade Review
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            {decisionReviewStatus.scope} for {directionLabel} /{" "}
            {trade.sessionDate} / {trade.sessionBucket}
          </p>
          {trade.tradeDirection === "short" ? (
            <p className="mt-2 max-w-3xl text-sm text-amber-300">
              This saved item starts with a sell in the imported CSV. The current end-user app treats that as position-history review, not a supported direction-specific coaching surface.
            </p>
          ) : null}
        </header>

        <SavedImportSourceCaution
          caution={importSourceCaution}
          surface="trade"
        />

        <section className="grid min-w-0 gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          <DashboardSideNav
            eyebrow="Trade Menu"
            items={[
              {
                href: "#summary",
                label: "Summary",
                summary: "What happened and what is available.",
              },
              {
                href: "#execution",
                label: "Execution",
                summary: "Replay, P/L path, and position changes.",
              },
              {
                href: "#session-story",
                label: "Session Story",
                summary: "Full-day context around this trade.",
              },
              {
                href: "#ticker-story",
                label: "Ticker Story",
                summary: "Same-day re-entry context.",
              },
              {
                href: "#writing-flow",
                label: "Write Review",
                summary: "Name the behavior and save the lesson.",
              },
              {
                href: "#review-notes",
                label: "Notes",
                summary: "Save notes and checklist progress.",
              },
              {
                href: "#evidence",
                label: "Evidence",
                summary: "Risks, strengths, and similar trades.",
              },
            ]}
            summary="Use the trade page as a review workspace."
          />
          <div className="grid min-w-0 gap-6">
            <div id="summary">
              <PrimaryActionPanel
                actionHref={primaryReviewAnchor}
                actionLabel={checklist ? "Write review note" : "Review execution replay"}
                body={`${trade.symbol} ${directionLabel} trade from ${
                  trade.sessionDate
                }. Gross P/L is ${formatSigned(
                  view.reportRow?.grossRealizedPnl ?? null,
                )}; lifecycle is ${
                  view.reportRow?.isOpenPosition ? "open" : "flat"
                }. ${
                  currentThreadRoundTrip
                    ? `This is ${currentThreadRoundTrip.roleLabel.toLowerCase()} inside the ${activeThread?.storyLabel.toLowerCase()} story.`
                    : "Use the replay to understand the sequence before writing the lesson."
                }`}
                eyebrow={
                  cameFromCoach ? "Coach evidence trade" : "Trade review workspace"
                }
                testId="trade-review-workspace"
                title={
                  cameFromCoach
                    ? "Prove or reject the coaching focus with this trade"
                    : "What happened, what to review, and what to write down"
                }
                tone={cameFromCoach ? "warning" : "info"}
              />
            </div>

            {cameFromCoach ? (
              <section
                className="ti-coach-brief p-5"
                data-testid="trade-coach-handoff"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Coach Handoff
                    </p>
                    <h2 className="mt-2 text-xl font-semibold text-slate-950">
                      Use this trade as evidence, not as a random detail page.
                    </h2>
                    <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
                      Replay the executions, name the behavior in plain language,
                      write one lesson, then mark the checklist progress so the
                      coach and progress pages can treat this as reviewed work.
                    </p>
                  </div>
                  <Link
                    className="inline-flex items-center justify-center rounded-md border border-slate-950 bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                    href="#execution"
                  >
                    Start replay
                  </Link>
                </div>
                <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  {[
                    {
                      label: "Current coaching focus",
                      value: coachFocusLabel ?? mainBehaviorLabel,
                      detail: "This is the overall pattern the coach asked you to prove.",
                    },
                    {
                      label: "This trade may show",
                      value: mainBehaviorLabel,
                      detail: "Name what actually appears in this trade before writing a rule.",
                    },
                    {
                      label: "What to prove",
                      value: evidenceSummary,
                      detail:
                        "Use saved execution and chart status only when available.",
                    },
                    {
                      label: "Finish the loop",
                      value: "Save the note and checklist",
                      detail: "Then return to coach or progress for the next item.",
                    },
                  ].map((item) => (
                    <div className="ti-coach-brief-cell" key={item.label}>
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {item.label}
                      </div>
                      <div className="mt-2 text-sm font-semibold leading-6 text-slate-900">
                        {item.value}
                      </div>
                      <div className="mt-2 text-xs leading-5 text-slate-500">
                        {item.detail}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-5 flex flex-wrap gap-2 text-xs">
                  <Link
                    className="text-slate-700 underline-offset-4 hover:underline"
                    href="#writing-flow"
                  >
                    Write the review
                  </Link>
                  <span className="text-slate-400">/</span>
                  <Link
                    className="text-slate-700 underline-offset-4 hover:underline"
                    href="/coach#progress-follow-through"
                  >
                    Back to coach progress
                  </Link>
                  <span className="text-slate-400">/</span>
                  <Link
                    className="text-slate-700 underline-offset-4 hover:underline"
                    href="/progress#progress-follow-through"
                  >
                    Check progress
                  </Link>
                </div>
              </section>
            ) : null}

            {activeSessionStory ? (
              <section
                id="session-story"
                className="ti-panel p-4"
                data-testid="trade-session-story-handoff"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                      Session Story
                    </div>
                    <h2 className="mt-2 text-lg font-semibold text-zinc-50">
                      {activeSessionStory.sessionDate} / {activeSessionStory.storyLabel}
                    </h2>
                    <p className="mt-2 max-w-4xl text-sm leading-6 text-zinc-400">
                      {activeSessionStory.storyDetail}
                    </p>
                    <p className="mt-2 max-w-4xl text-sm leading-6 text-sky-300">
                      {activeSessionStory.reviewPrompt}
                    </p>
                  </div>
                  <Link
                    className="border border-sky-800 bg-sky-950/30 px-4 py-3 text-sm font-medium text-sky-100 transition hover:border-sky-400"
                    href="/trades?view=session_stories#session-stories"
                  >
                    Open session stories
                  </Link>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                  <MetricCard
                    label="Session P/L"
                    value={formatSigned(activeSessionStory.totalGrossRealizedPnl)}
                    detail={`${activeSessionStory.tradeCount} round trip${activeSessionStory.tradeCount === 1 ? "" : "s"}`}
                    tone={
                      activeSessionStory.totalGrossRealizedPnl >= 0
                        ? "success"
                        : "danger"
                    }
                  />
                  <MetricCard
                    label="Symbols Traded"
                    value={activeSessionStory.symbolCount}
                    detail="Different tickers in this session"
                    tone="info"
                  />
                  <MetricCard
                    label="Strengths To Repeat"
                    value={activeSessionStory.marketContextStrengthCount}
                    detail={`${activeSessionStory.protectedProfitBeforeFadeFindingCount} profit-protection strength${activeSessionStory.protectedProfitBeforeFadeFindingCount === 1 ? "" : "s"}`}
                    tone={
                      activeSessionStory.marketContextStrengthCount > 0
                        ? "success"
                        : "default"
                    }
                  />
                  <MetricCard
                    label="Repeated Ticker Stories"
                    value={activeSessionStory.multiRoundTripThreadCount}
                    detail="Same-symbol stories to check"
                    tone={
                      activeSessionStory.multiRoundTripThreadCount > 0
                        ? "warning"
                        : "default"
                    }
                  />
                  <MetricCard
                    label="Open Or Swing Reviews"
                    value={activeSessionStory.openOrSwingThreadCount}
                    detail="Trades needing hold-plan review"
                    tone={
                      activeSessionStory.openOrSwingThreadCount > 0
                        ? "info"
                        : "default"
                    }
                  />
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {activeSessionStory.reviewEvidence.slice(0, 4).map((item) => (
                    <div
                      className={`border p-4 ${sessionStoryToneClass(
                        activeSessionStory.storyKind,
                      )}`}
                      key={item.id}
                    >
                      <div className="text-sm font-semibold text-zinc-100">
                        {item.title}
                      </div>
                      <div className="mt-2 text-xs leading-5 text-zinc-400">
                        {item.detail}
                      </div>
                      <div className="mt-2 text-xs leading-5 text-sky-300">
                        {item.reviewAction}
                      </div>
                      <div className="mt-2 text-[11px] uppercase tracking-wide text-zinc-600">
                        {plainEvidenceSourceLabel(item.evidenceSource)}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

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
            value={
              primaryDecisionReviewInsight
                ? primaryDecisionReviewInsight.label
                : decisionReviewSnapshot
                  ? "Chart context ready"
                  : "Execution review"
            }
            detail={
              primaryDecisionReviewInsight?.detail ?? decisionReviewStatus.label
            }
            tone={
              primaryDecisionReviewInsight?.tone === "danger"
                ? "danger"
                : primaryDecisionReviewInsight?.tone === "success"
                  ? "success"
                  : primaryDecisionReviewInsight?.tone === "warning" ||
                      decisionReviewStatus.tone.includes("amber")
                    ? "warning"
                    : decisionReviewStatus.tone.includes("emerald")
                      ? "success"
                      : "info"
            }
          />
          <MetricCard
            label="What To Write Down"
            value={checklistProgress}
            detail={checklist ? "Use the checklist's next item." : "Start with the execution replay."}
            tone="info"
          />
          <MetricCard
            label="What Is Unavailable"
            value={
              decisionReviewSnapshot
                ? hiddenDecisionReviewInsightCount > 0
                  ? "Some advanced notes"
                  : "Nothing major"
                : "Chart context"
            }
            detail={
              decisionReviewSnapshot
                ? hiddenDecisionReviewInsightCount > 0
                  ? `${hiddenDecisionReviewInsightCount} chart context note${
                      hiddenDecisionReviewInsightCount === 1 ? "" : "s"
                    } stayed in advanced details because normal coaching needs a certified contract.`
                  : "Context is attached."
                : "Use execution evidence now."
            }
            tone={
              decisionReviewSnapshot && hiddenDecisionReviewInsightCount === 0
                ? "success"
                : "warning"
            }
          />
        </section>

        <section
          id="writing-flow"
          className="grid gap-4 md:grid-cols-4"
          data-testid="trade-review-writing-flow"
        >
          {[
            {
              label: "What happened",
              value: `${formatSigned(grossRealizedPnl)} / ${
                view.executionTimeline.length
              } execution${view.executionTimeline.length === 1 ? "" : "s"}`,
              detail: "Start with the execution replay before writing the lesson.",
              tone: (view.reportRow?.grossRealizedPnl ?? 0) >= 0 ? "success" : "danger",
            },
            {
              label: "Behavior to name",
              value: mainBehaviorLabel,
              detail: "Name the main risk or question in plain trader language.",
              tone: "warning",
            },
            {
              label: "Fix first",
              value: fixFirstAction,
              detail: "Write one next-session rule before reviewing every support panel.",
              tone: "info",
            },
            {
              label: "Evidence",
              value: evidenceSummary,
              detail: "Use saved execution, chart status, and ticker-story evidence only when available.",
              tone: "default",
            },
          ].map((item) => (
            <div className="ti-panel-soft p-4" key={item.label}>
              <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                {item.label}
              </div>
              <div
                className={`mt-2 text-sm font-semibold leading-6 ${
                  item.tone === "success"
                    ? "text-emerald-300"
                    : item.tone === "danger"
                      ? "text-rose-300"
                      : item.tone === "warning"
                        ? "text-amber-300"
                        : item.tone === "info"
                          ? "text-sky-300"
                          : "text-zinc-100"
                }`}
              >
                {item.value}
              </div>
              <div className="mt-2 text-xs leading-5 text-zinc-500">
                {item.detail}
              </div>
            </div>
          ))}
        </section>

        <TradeReviewActions
          checklist={checklist}
          notes={trade.notes}
          tradeId={trade.id}
        />

        {activeThread &&
        activeThread.roundTripCount <= 1 &&
        activeThread.priorityMarketContextFindings.length > 0 ? (
          <section
            id="chart-handoff"
            className="ti-panel p-4"
            data-testid="trade-chart-volume-handoff"
          >
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Chart And Volume Handoff
              </div>
              <h2 className="mt-2 text-lg font-semibold text-zinc-50">
                Use the certified chart finding while writing the trade lesson.
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-500">
                These findings come from saved market context and should be
                checked against the execution replay before you write the final
                review note.
              </p>
            </div>
            <div className="mt-4 grid gap-3 lg:grid-cols-3">
              {activeThread.priorityMarketContextFindings.map((finding) => (
                <div
                  className={`border p-4 ${
                    finding.tone === "danger"
                      ? "border-rose-500/30 bg-rose-500/10"
                      : finding.tone === "warning"
                        ? "border-amber-500/30 bg-amber-500/10"
                        : finding.tone === "success"
                          ? "border-emerald-500/30 bg-emerald-500/10"
                          : "border-sky-500/30 bg-sky-500/10"
                  }`}
                  key={finding.id}
                >
                  <div className="text-sm font-semibold text-zinc-100">
                    {finding.label}
                  </div>
                  <div className="mt-2 text-xs leading-5 text-zinc-500">
                    {finding.detail}
                  </div>
                  <div className="mt-2 text-xs leading-5 text-sky-300">
                    {finding.reviewAction}
                  </div>
                  <div className="mt-2 text-[11px] uppercase tracking-wide text-zinc-600">
                    {plainEvidenceSourceLabel(finding.evidenceSource)}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {activeThread && activeThread.roundTripCount > 1 ? (
          <section
            id="ticker-story"
            className="ti-panel p-4"
            data-testid="trade-thread-context"
          >
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Ticker Story
                </div>
                <h2 className="mt-2 text-lg font-semibold text-zinc-50">
                  {activeThread.symbol} had {activeThread.roundTripCount} round trips on {activeThread.sessionDate}
                </h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
                  {activeThread.storyDetail}
                </p>
                <div
                  className={`mt-3 inline-flex border px-3 py-1 text-xs font-medium uppercase tracking-wide ${lifecycleToneClass(
                    activeThread.lifecycleClassification,
                  )}`}
                >
                  {activeThread.lifecycleLabel}
                </div>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-500">
                  {activeThread.lifecycleDetail}
                </p>
                <p className="mt-2 text-sm text-sky-300">
                  {activeThread.reviewPrompt}
                </p>
                <div className="mt-4 border-t border-zinc-900 pt-3">
                  <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    Review Question
                  </div>
                  <div className="mt-1 text-sm text-zinc-200">
                    {activeThread.primaryReviewQuestion}
                  </div>
                  <div className="mt-2 text-sm text-sky-300">
                    Fix first: {activeThread.fixFirstAction}
                  </div>
                </div>
              </div>
              <div
                className={`ti-panel-soft px-4 py-3 text-right text-lg font-semibold ${
                  activeThread.totalGrossRealizedPnl >= 0
                    ? "text-emerald-300"
                    : "text-rose-300"
                }`}
              >
                {formatSigned(activeThread.totalGrossRealizedPnl)}
                <div className="mt-1 text-xs font-normal uppercase tracking-wide text-zinc-500">
                  Story P/L
                </div>
              </div>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {activeThread.reviewEvidence.map((item) => (
                <div
                  key={item.id}
                  className={`border px-3 py-3 ${
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
                  <div className="mt-2 text-sm text-zinc-300">
                    {item.detail}
                  </div>
                  <div className="mt-2 text-xs text-sky-300">
                    {item.reviewAction}
                  </div>
                  <div className="mt-2 text-[11px] uppercase tracking-wide text-zinc-600">
                    {plainEvidenceSourceLabel(item.evidenceSource)}
                  </div>
                </div>
              ))}
            </div>
            {activeThread.priorityMarketContextFindings.length > 0 ? (
              <div
                id="chart-handoff"
                className="mt-4 grid gap-3 lg:grid-cols-3"
                data-testid="trade-chart-volume-handoff"
              >
                {activeThread.priorityMarketContextFindings.map((finding) => (
                  <div
                    className={`border p-4 ${
                      finding.tone === "danger"
                        ? "border-rose-500/30 bg-rose-500/10"
                        : finding.tone === "warning"
                          ? "border-amber-500/30 bg-amber-500/10"
                          : finding.tone === "success"
                            ? "border-emerald-500/30 bg-emerald-500/10"
                            : "border-sky-500/30 bg-sky-500/10"
                    }`}
                    key={finding.id}
                  >
                    <div className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                      Chart and volume handoff
                    </div>
                    <div className="mt-2 text-sm font-semibold text-zinc-100">
                      {finding.label}
                    </div>
                    <div className="mt-2 text-xs leading-5 text-zinc-500">
                      {finding.detail}
                    </div>
                    <div className="mt-2 text-xs leading-5 text-sky-300">
                      {finding.reviewAction}
                    </div>
                    <div className="mt-2 text-[11px] uppercase tracking-wide text-zinc-600">
                      {plainEvidenceSourceLabel(finding.evidenceSource)}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
            <div className="mt-4 grid gap-3 md:grid-cols-4 xl:grid-cols-9">
              <MetricCard
                label="Round Trips"
                value={activeThread.roundTripCount}
                detail={`${activeThread.closedRoundTripCount} flat / ${activeThread.openRoundTripCount} open`}
                tone="info"
              />
              <MetricCard
                label="Best Push"
                value={formatSigned(activeThread.bestRoundTrip?.grossRealizedPnl ?? null)}
                detail={
                  activeThread.bestRoundTrip
                    ? `Trade ${activeThread.bestRoundTrip.sequence}`
                    : "No closed round trip"
                }
                tone="success"
              />
              <MetricCard
                label="Weakest Push"
                value={formatSigned(activeThread.worstRoundTrip?.grossRealizedPnl ?? null)}
                detail={
                  activeThread.worstRoundTrip
                    ? `Trade ${activeThread.worstRoundTrip.sequence}`
                    : "No closed round trip"
                }
                tone="danger"
              />
              <MetricCard
                label="Giveback"
                value={formatSigned(-activeThread.givebackFromPeak)}
                detail="Profit reduced after the best cumulative point."
                tone={activeThread.givebackFromPeak > 0 ? "warning" : "success"}
              />
              <MetricCard
                label="Add Quality"
                value={activeThread.addQualityFindingCount}
                detail={`${activeThread.addQualityRiskCount} risk, ${activeThread.addQualityStrengthCount} strength, ${activeThread.addQualityReviewPromptCount} prompt`}
                tone={
                  activeThread.addQualityRiskCount > 0
                    ? "warning"
                    : activeThread.addQualityStrengthCount > 0
                      ? "success"
                      : activeThread.addQualityFindingCount > 0
                        ? "info"
                        : "default"
                }
              />
              <MetricCard
                label="After Exit"
                value={activeThread.postExitFindingCount}
                detail={`${activeThread.postExitRiskCount} risk to review, ${activeThread.postExitStrengthCount} strength to repeat, ${activeThread.postExitReviewPromptCount} prompt`}
                tone={
                  activeThread.postExitRiskCount > 0
                    ? "warning"
                    : activeThread.postExitStrengthCount > 0
                      ? "success"
                      : activeThread.postExitFindingCount > 0
                        ? "info"
                        : "default"
                }
              />
              <MetricCard
                label="Protected Profit"
                value={activeThread.protectedProfitBeforeFadeFindingCount}
                detail="Repeatable exit strength from capture plus after-exit fade"
                tone={
                  activeThread.protectedProfitBeforeFadeFindingCount > 0
                    ? "success"
                    : "default"
                }
              />
              <MetricCard
                label="Support/Resistance Exits"
                value={activeThread.exitLevelFindingCount}
                detail={`${activeThread.exitLevelRiskCount} risk, ${activeThread.exitLevelStrengthCount} strength, ${activeThread.exitLevelReviewPromptCount} prompt`}
                tone={
                  activeThread.exitLevelRiskCount > 0
                    ? "warning"
                    : activeThread.exitLevelStrengthCount > 0
                      ? "success"
                      : activeThread.exitLevelFindingCount > 0
                        ? "info"
                        : "default"
                }
              />
              <MetricCard
                label="Volume Evidence"
                value={activeThread.volumeFindingCount}
                detail={`${activeThread.volumeRiskCount} risk to review, ${activeThread.volumeStrengthCount} strength to repeat`}
                tone={
                  activeThread.volumeRiskCount > 0
                    ? "warning"
                    : activeThread.volumeStrengthCount > 0
                      ? "success"
                      : activeThread.volumeFindingCount > 0
                        ? "info"
                        : "default"
                }
              />
            </div>
            <div className="mt-4 grid gap-2">
              {activeThread.roundTrips.map((roundTrip) => {
                const isCurrentTrade = roundTrip.tradeId === trade.id;

                return (
                  <Link
                    key={roundTrip.id}
                    className={`grid gap-2 border px-3 py-2 text-sm transition hover:border-sky-500 hover:text-sky-200 md:grid-cols-[90px_minmax(0,1fr)_100px] ${
                      isCurrentTrade
                        ? "border-sky-500 bg-sky-500/10"
                        : "border-zinc-900"
                    }`}
                    href={roundTrip.href}
                  >
                    <span className="text-zinc-500">
                      {isCurrentTrade ? "Current" : roundTrip.roleLabel}
                    </span>
                    <span className="text-zinc-300">
                      {roundTrip.entryHourLabelEt} / {roundTrip.executionCount} execution
                      {roundTrip.executionCount === 1 ? "" : "s"} / {timeLabelEt(roundTrip.entryTime)} ET
                      {roundTrip.heldOvernight || roundTrip.crossedSessionDate
                        ? " / overnight exposure"
                        : ""}
                    </span>
                    <span className="text-xs text-zinc-500 md:col-span-2">
                      {roundTrip.chartContextSummary}
                    </span>
                    <span
                      className={`font-medium md:text-right ${
                        (roundTrip.grossRealizedPnl ?? 0) >= 0
                          ? "text-emerald-300"
                          : "text-rose-300"
                      }`}
                    >
                      {formatSigned(roundTrip.grossRealizedPnl)}
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        ) : null}

        <section
          className="ti-panel p-4"
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
            <div className="ti-panel-soft px-3 py-2 text-xs uppercase tracking-wide text-zinc-400">
              {decisionReviewStatus.scope}
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <div className="ti-panel p-4">
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
          <div className="ti-panel p-4">
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Executions
            </div>
            <div className="mt-3 text-2xl font-semibold text-zinc-100">
              {view.executionTimeline.length}
            </div>
          </div>
          <div className="ti-panel p-4">
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Max Position
            </div>
            <div className="mt-3 text-2xl font-semibold text-zinc-100">
              {view.reportRow?.maxPositionSize ?? "n/a"}
            </div>
          </div>
          <div className="ti-panel p-4">
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Lifecycle
            </div>
            <div className="mt-3 text-2xl font-semibold text-zinc-100">
              {view.reportRow?.isOpenPosition ? "Open" : "Flat"}
            </div>
          </div>
        </section>

        <section
          className="ti-panel p-4"
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
            id="checklist"
            className="ti-panel p-4"
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
            className="ti-panel p-4"
            data-testid="trade-decision-review-snapshot"
          >
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h2 className="text-sm font-semibold text-zinc-100">
                  Chart Context Review
                </h2>
                <div className="mt-1 text-sm text-zinc-500">
                  {decisionReviewSnapshot?.review.coachingHeadline ??
                    (decisionReviewDiagnostics[0]
                      ? decisionReviewDiagnosticUserMessage(decisionReviewDiagnostics[0])
                      : null) ??
                    "Chart context review has not completed for this trade yet."}
                </div>
              </div>
              <div className="font-mono text-xs text-sky-300">
                {plainEvidenceSourceLabel(
                  decisionReviewSnapshot?.review.marketContextSource ??
                    decisionReviewDiagnostics[0]?.status ??
                    "queued",
                )}
              </div>
            </div>
            {decisionReviewSnapshot ? (
              <>
                {decisionReviewInsightCards.length > 0 ? (
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {decisionReviewInsightCards.map((insight) => (
                      <div
                        key={insight.sourceInsightId}
                        className="border-t border-zinc-900 py-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm font-medium text-zinc-200">
                            {insight.label}
                          </span>
                          <span
                            className={`text-xs uppercase tracking-wide ${decisionReviewFindingToneClass(
                              insight.tone,
                            )}`}
                          >
                            {decisionReviewFindingBadgeLabel(
                              insight.opportunityType,
                            )}
                          </span>
                        </div>
                        <div className="mt-1 text-xs leading-5 text-zinc-500">
                          {insight.detail}
                        </div>
                        <div className="mt-2 text-xs leading-5 text-sky-300">
                          {insight.reviewAction}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-4 border-t border-zinc-900 pt-3 text-sm text-zinc-500">
                    Chart context was saved, but no certified normal coaching
                    finding is ready for this trade yet. Use the execution
                    replay and checklist first.
                  </div>
                )}
                {hiddenDecisionReviewInsightCount > 0 ? (
                  <AdvancedDisclosure summary="Technical chart notes">
                    <div className="mt-3 text-xs leading-5 text-zinc-500">
                      {hiddenDecisionReviewInsightCount} saved chart context note
                      {hiddenDecisionReviewInsightCount === 1 ? "" : "s"} stayed
                      out of normal coaching because they do not have a
                      user-facing contract for this route yet.
                    </div>
                  </AdvancedDisclosure>
                ) : null}
              </>
            ) : (
              <AdvancedDisclosure summary="Technical review limits">
                <div className="mt-3 grid gap-2">
                  {decisionReviewDiagnostics.map((diagnostic) => (
                    <div key={diagnostic.id} className="border-t border-zinc-900 py-3">
                      <PlainStateBadge
                        state={decisionReviewDiagnosticBadgeState(diagnostic)}
                        tone="warning"
                      />
                      <div className="mt-1 text-xs text-zinc-500">
                        {decisionReviewDiagnosticUserMessage(diagnostic)}
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

        <section id="execution" className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.45fr)]">
          <div
            className="ti-panel p-4"
            data-testid="trade-execution-replay"
          >
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h2 className="text-sm font-semibold text-zinc-100">
                  Trade Replay
                </h2>
                <div className="mt-1 text-sm text-zinc-500">
                  Follow the execution sequence before writing the review. {autopsy?.summary ?? "Execution-only replay."}
                </div>
              </div>
              <div className="grid gap-1 text-right">
                <div className="font-mono text-xl text-sky-300">
                  {quality ? `${quality.overallScore}/100` : "n/a"}
                </div>
                <div className="text-xs uppercase tracking-wide text-zinc-500">
                  execution quality
                </div>
              </div>
            </div>
            <div
              className="mt-4 grid gap-3 md:grid-cols-3"
              data-testid="trade-position-progression"
            >
              <div className="border border-zinc-900 bg-zinc-950/40 p-3">
                <div className="text-xs uppercase tracking-wide text-zinc-500">
                  Max position
                </div>
                <div className="mt-2 font-mono text-xl text-zinc-100">
                  {view.reportRow?.maxPositionSize ?? "n/a"}
                </div>
                <div className="mt-1 text-xs text-zinc-500">
                  Biggest share exposure in this round trip.
                </div>
              </div>
              <div className="border border-zinc-900 bg-zinc-950/40 p-3">
                <div className="text-xs uppercase tracking-wide text-zinc-500">
                  Final position
                </div>
                <div className={`mt-2 font-mono text-xl ${
                  view.reportRow?.isOpenPosition ? "text-amber-300" : "text-emerald-300"
                }`}>
                  {view.reportRow?.finalPositionSize ?? "n/a"}
                </div>
                <div className="mt-1 text-xs text-zinc-500">
                  {view.reportRow?.isOpenPosition
                    ? "This review stays execution-only until the trade is flat."
                    : "This round trip closed back to flat."}
                </div>
              </div>
              <div className="border border-zinc-900 bg-zinc-950/40 p-3">
                <div className="text-xs uppercase tracking-wide text-zinc-500">
                  Realized P/L path
                </div>
                <div className={`mt-2 font-mono text-xl ${
                  (finalReplayPnl ?? 0) >= 0 ? "text-emerald-300" : "text-rose-300"
                }`}>
                  {formatSigned(finalReplayPnl)}
                </div>
                <div className="mt-1 text-xs text-zinc-500">
                  {replaySummary}
                </div>
              </div>
            </div>
            <div className="mt-5 grid gap-3" data-testid="trade-visual-replay">
              {replay.steps.map((point) => (
                <div
                  key={point.index}
                  className="border border-zinc-900 bg-zinc-950/35 p-3"
                  data-testid={`trade-replay-step-${point.index}`}
                >
                  <div className="grid gap-3 lg:grid-cols-[minmax(0,220px)_minmax(0,1fr)_150px] lg:items-center">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex border px-2 py-1 text-xs font-semibold uppercase tracking-wide ${executionActionTone(
                            point,
                          )}`}
                        >
                          {point.index + 1}. {executionActionLabel(point, trade.tradeDirection)}
                        </span>
                        <span className="font-mono text-xs text-zinc-500">
                          {timeLabelEt(point.timestamp)} ET
                        </span>
                      </div>
                      <div className="mt-2 text-sm text-zinc-300">
                        {point.shares} shares at {formatExecutionPrice(point.price)}
                      </div>
                      <div className="mt-1 text-xs text-zinc-500">
                        {point.marker}
                      </div>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center justify-between gap-3 text-xs">
                        <span className="text-zinc-500">Position after execution</span>
                        <span className="font-mono text-zinc-300">
                          {point.positionBeforeExecution}{" -> "}{point.positionAfterExecution}
                        </span>
                      </div>
                      <div className="mt-2 h-3 bg-zinc-900">
                        <div
                          className={`h-3 ${executionBarClass(point)}`}
                          style={{
                            width: `${
                              point.positionAfterExecution === 0
                                ? 0
                                : Math.max(point.positionPctOfMax * 100, 4)
                            }%`,
                          }}
                        />
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2 text-[11px] uppercase tracking-wide">
                        {point.linkedRiskLabels.slice(0, 2).map((label) => (
                          <span className="text-amber-300" key={`risk-${point.index}-${label}`}>
                            {label}
                          </span>
                        ))}
                        {point.linkedStrengthLabels.slice(0, 2).map((label) => (
                          <span className="text-emerald-300" key={`strength-${point.index}-${label}`}>
                            {label}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="border-t border-zinc-900 pt-3 lg:border-l lg:border-t-0 lg:pl-4 lg:pt-0">
                      <div className="text-xs uppercase tracking-wide text-zinc-500">
                        Execution-derived P/L
                      </div>
                      <div className={`mt-2 font-mono text-lg ${replayPnlTone(point)}`}>
                        {replayPnlLabel(point)}
                      </div>
                      <div className="mt-1 text-xs text-zinc-500">
                        {typeof point.realizedPnlProgress === "number"
                          ? "Realized after this execution."
                          : "No reduction or exit has realized P/L here."}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div
            className="ti-panel p-4"
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
              className="ti-panel p-4"
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
              className="ti-panel p-4"
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

        <section id="evidence" className="grid gap-6 xl:grid-cols-[minmax(0,0.55fr)_minmax(320px,0.45fr)]">
          <div className="ti-panel p-4">
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

          <div className="ti-panel p-4">
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
                        {plainEvidenceSourceLabel(card.source)}
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
          <div className="ti-panel p-4">
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

          <div className="ti-panel p-4">
            <h2 className="text-sm font-semibold text-zinc-100">
              Similar Trades
            </h2>
            <div className="mt-1 text-sm text-zinc-500">
              Use these as comparison examples after this trade has one clear lesson.
            </div>
            <div className="mt-4 grid gap-3">
              {similarTrades.length === 0 ? (
                <div className="text-sm text-zinc-500">
                  No similar saved-trade examples are linked yet.
                </div>
              ) : (
                similarTrades.map((similar) => (
                  <Link
                    key={similar.tradeId}
                    className="block border-t border-zinc-900 py-3 transition hover:text-sky-200"
                    href={withPageAnchor(
                      `/trades/${encodeURIComponent(similar.tradeId)}`,
                      "writing-flow",
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm text-zinc-300">
                        {similar.symbol}
                      </span>
                      <span className={`font-mono text-xs ${
                        (similar.grossRealizedPnl ?? 0) >= 0
                          ? "text-emerald-300"
                          : "text-rose-300"
                      }`}>
                        {formatSigned(similar.grossRealizedPnl)}
                      </span>
                    </div>
                    <div className="mt-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                      Why similar
                    </div>
                    <div className="mt-1 text-xs leading-5 text-zinc-400">
                      {similar.sharedReasons.join(" / ")}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                      <span>{similar.similarityScore} match</span>
                      <span>quality {similar.qualityScore ?? "n/a"}</span>
                      <span className="text-sky-300">Open review workspace</span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <div className="ti-panel p-4">
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
        </section>
      </div>
    </main>
  );
}
