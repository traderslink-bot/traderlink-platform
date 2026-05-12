import Link from "next/link";
import type { Metadata } from "next";
import {
  AdvancedDisclosure,
  DashboardSideNav,
  MetricCard,
  plainStateLabel,
  WorkflowHandoffPanel,
  withPageAnchor,
} from "../app-ui";
import { BehaviorReportPanel } from "../behavior-report-panel";
import { CoachBehaviorSequence } from "./coach-behavior-sequence";
import { SavedReviewQueueSummary } from "../saved-review-queue-summary";
import { SavedImportSourceCaution } from "../saved-import-source-caution";
import { buildAnalyticsBehaviorReport } from "../../src/lib/trader-analytics/server/analytics-behavior-report";
import { buildSavedReviewQueueReadModel } from "../../src/lib/trader-analytics/server/saved-review-queue";
import type { SavedReviewQueueItem } from "../../src/lib/trader-analytics/server/saved-review-queue";
import { buildLatestSavedImportSourceCautionReadModel } from "../../src/lib/trader-analytics/server/saved-import-source-caution";
import { buildSavedTradeThreadReadModel } from "../../src/lib/trader-analytics/server/saved-trade-threads";
import { buildSavedOrSampleTraderAnalyticsViewModel } from "../../src/lib/trader-analytics/server/saved-trader-analytics-data";
import {
  buildCoachOverallFocusSummary,
  buildCoachProgressFollowThroughSummary,
  chooseCoachEvidenceQueueItem,
  chooseCoachOverallFocusBehavior,
  type CoachOverallFocusBehavior,
  type CoachProgressFollowThroughSummary,
  type CoachProgressFollowThroughTone,
} from "../../src/lib/trader-analytics/product/coach-overall-focus";
import { userFacingTradeSymbol } from "../../src/lib/trader-analytics/product/trade-display-copy";

type SavedTradeThread = ReturnType<typeof buildSavedTradeThreadReadModel>["threads"][number];
type SavedTradeSessionStory = ReturnType<
  typeof buildSavedTradeThreadReadModel
>["sessionStories"][number];

export const metadata: Metadata = {
  title: "Coach | Trader Intelligence",
};

export const dynamic = "force-dynamic";

function signed(value: number | null): string {
  if (value === null) {
    return "n/a";
  }

  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}`;
}

function compactCoachAction(value: string, fallback: string): string {
  const normalized = value.toLowerCase();

  if (!value) {
    return fallback;
  }

  if (normalized.includes("recurring execution risk")) {
    return "Replay the repeated risk";
  }

  if (normalized.includes("single entry") && normalized.includes("full exit")) {
    return "Preserve clean entry and exit";
  }

  if (value.length <= 54) {
    return value;
  }

  return fallback;
}

const panelClass = "ti-panel p-4";

function coachLaneLabel(lane: string): string {
  if (lane === "highest_priority") {
    return "Review first";
  }

  if (lane === "market_context_unavailable") {
    return "Chart data still missing";
  }

  if (lane === "blocked_open_trade") {
    return "Open trade";
  }

  if (lane === "analysis_failed") {
    return "Needs technical follow-up";
  }

  if (lane === "completed") {
    return "Reviewed";
  }

  return lane
    .split(/[_-]/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

function coachTradePath(
  item: SavedReviewQueueItem,
  focusLabel?: string | null,
): string {
  const [path] = item.href.split("?");
  const params = new URLSearchParams({
    from: "coach",
    queue: item.lane,
  });
  if (focusLabel) {
    params.set("focus", focusLabel);
  }

  return `${path}?${params.toString()}`;
}

function tradeReviewHref(
  item: SavedReviewQueueItem,
  focusLabel?: string | null,
): string {
  return withPageAnchor(coachTradePath(item, focusLabel), "writing-flow");
}

function coachEvidenceCardHref(
  href: string,
  focusLabel?: string | null,
): string {
  if (!href.startsWith("/trades/")) {
    return href;
  }

  const [path] = href.split("?");
  const params = new URLSearchParams({ from: "coach" });
  if (focusLabel) {
    params.set("focus", focusLabel);
  }

  return withPageAnchor(`${path}?${params.toString()}`, "evidence");
}

function chooseReviewPreviewItems(args: {
  behavior: CoachOverallFocusBehavior | null;
  primary: SavedReviewQueueItem | null;
  queue: SavedReviewQueueItem[];
}): SavedReviewQueueItem[] {
  const relatedIds = new Set(args.behavior?.relatedTradeIds ?? []);
  const items: SavedReviewQueueItem[] = [];
  const seen = new Set<string>();

  for (const item of args.queue) {
    const isPrimary = args.primary?.id === item.id;
    const isRelated =
      relatedIds.size === 0 || relatedIds.has(item.savedTradeId) || isPrimary;

    if (!isRelated || seen.has(item.id)) {
      continue;
    }

    seen.add(item.id);
    items.push(item);

    if (items.length >= 5) {
      return items;
    }
  }

  for (const item of args.queue) {
    if (seen.has(item.id)) {
      continue;
    }

    seen.add(item.id);
    items.push(item);

    if (items.length >= 5) {
      break;
    }
  }

  return items;
}

function choosePriorityTickerStory(threads: SavedTradeThread[]): SavedTradeThread | null {
  const multiRoundTripStories = threads.filter((thread) => thread.roundTripCount > 1);

  return (
    multiRoundTripStories.find((thread) => thread.storyKind === "profit_giveback") ??
    multiRoundTripStories.find((thread) => thread.storyKind === "swing_transition") ??
    multiRoundTripStories.find((thread) => thread.storyKind === "open_reentry") ??
    multiRoundTripStories.find(
      (thread) => thread.storyKind === "repeated_losing_attempts",
    ) ??
    multiRoundTripStories[0] ??
    null
  );
}

function choosePrioritySessionStory(
  stories: SavedTradeSessionStory[],
): SavedTradeSessionStory | null {
  return (
    stories.find((story) => story.storyKind === "green_to_red_session") ??
    stories.find((story) => story.storyKind === "same_symbol_many_attempts") ??
    stories.find((story) => story.storyKind === "session_high_trade_count") ??
    stories.find((story) => story.storyKind === "open_or_swing_review") ??
    stories.find((story) => story.storyKind === "strengths_to_repeat_session") ??
    stories[0] ??
    null
  );
}

function tickerStoryToneClass(thread: SavedTradeThread | null): string {
  if (!thread) {
    return "border-zinc-800 bg-zinc-950 text-zinc-400";
  }

  if (thread.storyKind === "profit_giveback") {
    return "border-amber-700 bg-amber-950/20 text-amber-200";
  }

  if (thread.storyKind === "swing_transition") {
    return "border-sky-700 bg-sky-950/20 text-sky-200";
  }

  if (thread.storyKind === "reentry_added_profit") {
    return "border-emerald-700 bg-emerald-950/20 text-emerald-200";
  }

  if (thread.storyKind === "repeated_losing_attempts") {
    return "border-rose-700 bg-rose-950/20 text-rose-200";
  }

  return "border-zinc-800 bg-zinc-950 text-zinc-300";
}

function sessionStoryToneClass(story: SavedTradeSessionStory | null): string {
  if (!story) {
    return "border-zinc-800 bg-zinc-950 text-zinc-400";
  }

  if (story.storyKind === "green_to_red_session") {
    return "border-rose-700 bg-rose-950/20 text-rose-200";
  }

  if (
    story.storyKind === "same_symbol_many_attempts" ||
    story.storyKind === "session_high_trade_count"
  ) {
    return "border-amber-700 bg-amber-950/20 text-amber-200";
  }

  if (story.storyKind === "open_or_swing_review") {
    return "border-sky-700 bg-sky-950/20 text-sky-200";
  }

  if (
    story.storyKind === "strengths_to_repeat_session" ||
    story.storyKind === "positive_controlled_session"
  ) {
    return "border-emerald-700 bg-emerald-950/20 text-emerald-200";
  }

  return "border-zinc-800 bg-zinc-950 text-zinc-300";
}

function CoachSectionHeader({
  eyebrow,
  title,
  body,
}: {
  body: string;
  eyebrow: string;
  title: string;
}) {
  return (
    <div className="ti-panel-soft p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-sky-300">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-xl font-semibold text-zinc-50">{title}</h2>
      <p className="mt-2 max-w-4xl text-sm leading-6 text-zinc-400">{body}</p>
    </div>
  );
}

function TickerStoryCoachPanel({
  thread,
  threadCount,
}: {
  thread: SavedTradeThread | null;
  threadCount: number;
}) {
  const storyHref =
    thread?.href ??
    (threadCount > 0
      ? "/trades?view=ticker_stories#ticker-stories"
      : "/trades#ticker-stories");

  return (
    <section className="ti-panel p-5" data-testid="coach-ticker-story-panel">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-sky-300">
            Ticker Story Coach
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-zinc-50">
            Check whether re-entries helped or hurt the first idea.
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
            Round trips stay separate for accounting. This coaching view groups
            same-symbol re-entries so the review can catch profit giveback,
            open re-entries, and day trades that turned into swing exposure.
          </p>
        </div>
        <Link
          className="border border-sky-800 bg-sky-950/40 px-4 py-3 text-sm font-medium text-sky-100 transition hover:border-sky-400"
          href={storyHref}
        >
          Open ticker stories
        </Link>
      </div>

      {thread ? (
        <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,0.46fr)_minmax(0,1fr)]">
          <div className={`border p-4 ${tickerStoryToneClass(thread)}`}>
            <div className="text-xs font-semibold uppercase tracking-wide opacity-80">
              Story to review
            </div>
            <div className="mt-2 text-2xl font-semibold">
              {userFacingTradeSymbol(thread.symbol)}
            </div>
            <div className="mt-1 text-sm opacity-90">
              {thread.roundTripCount} round trips /{" "}
              {signed(thread.totalGrossRealizedPnl)}
            </div>
            <div className="mt-4 text-lg font-semibold">
              {thread.storyLabel}
            </div>
            <p className="mt-2 text-sm leading-6 opacity-90">
              {thread.storyDetail}
            </p>
          </div>
          <div className="grid gap-3">
            <div className="border border-zinc-900 bg-zinc-950/70 p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Coach question
              </div>
              <div className="mt-2 text-sm leading-6 text-zinc-200">
                {thread.primaryReviewQuestion}
              </div>
            </div>
            <div className="border border-zinc-900 bg-zinc-950/70 p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Fix first
              </div>
              <div className="mt-2 text-sm leading-6 text-sky-200">
                {thread.fixFirstAction}
              </div>
            </div>
            <div className="grid gap-2 md:grid-cols-3 xl:grid-cols-8">
              <MetricCard
                label="Chart Findings"
                value={thread.marketContextFindingCount}
                detail="Certified chart prompts and level checks"
                tone={thread.marketContextFindingCount > 0 ? "info" : "default"}
              />
              <MetricCard
                label="Add Quality"
                value={thread.addQualityFindingCount}
                detail={`${thread.addQualityRiskCount} risk, ${thread.addQualityStrengthCount} strength`}
                tone={
                  thread.addQualityRiskCount > 0
                    ? "warning"
                    : thread.addQualityStrengthCount > 0
                      ? "success"
                      : thread.addQualityFindingCount > 0
                        ? "info"
                        : "default"
                }
              />
              <MetricCard
                label="Chart Risks"
                value={thread.marketContextRiskCount}
                detail="Level, add, exit, or profit-protection risk"
                tone={thread.marketContextRiskCount > 0 ? "warning" : "default"}
              />
              <MetricCard
                label="Chart Strengths"
                value={thread.marketContextStrengthCount}
                detail="Chart evidence strengths worth repeating"
                tone={thread.marketContextStrengthCount > 0 ? "success" : "default"}
              />
              <MetricCard
                label="After Exit"
                value={thread.postExitFindingCount}
                detail={`${thread.postExitRiskCount} risk, ${thread.postExitStrengthCount} strength`}
                tone={
                  thread.postExitRiskCount > 0
                    ? "warning"
                    : thread.postExitStrengthCount > 0
                      ? "success"
                      : thread.postExitFindingCount > 0
                        ? "info"
                        : "default"
                }
              />
              <MetricCard
                label="Protected Profit"
                value={thread.protectedProfitBeforeFadeFindingCount}
                detail="Exit strength before a later fade"
                tone={
                  thread.protectedProfitBeforeFadeFindingCount > 0
                    ? "success"
                    : "default"
                }
              />
              <MetricCard
                label="Support/Resistance Exits"
                value={thread.exitLevelFindingCount}
                detail={`${thread.exitLevelRiskCount} risk, ${thread.exitLevelStrengthCount} strength`}
                tone={
                  thread.exitLevelRiskCount > 0
                    ? "warning"
                    : thread.exitLevelStrengthCount > 0
                      ? "success"
                      : thread.exitLevelFindingCount > 0
                        ? "info"
                        : "default"
                }
              />
              <MetricCard
                label="Volume Evidence"
                value={thread.volumeFindingCount}
                detail={`${thread.volumeRiskCount} risk, ${thread.volumeStrengthCount} strength`}
                tone={
                  thread.volumeRiskCount > 0
                    ? "warning"
                    : thread.volumeStrengthCount > 0
                      ? "success"
                      : thread.volumeFindingCount > 0
                        ? "info"
                        : "default"
                }
              />
            </div>
            <div className="grid gap-2 md:grid-cols-3">
              {thread.reviewEvidence.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  className="border border-zinc-900 bg-zinc-950/70 p-3"
                >
                  <div className="text-sm font-medium text-zinc-200">
                    {item.title}
                  </div>
                  <div className="mt-1 text-xs leading-5 text-zinc-500">
                    {item.detail}
                  </div>
                  <div className="mt-2 text-xs leading-5 text-sky-300">
                    {item.reviewAction}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-5 border border-zinc-900 bg-zinc-950/70 p-4 text-sm leading-6 text-zinc-400">
          No same-symbol re-entry stories yet. When a saved import has more than
          one flat-to-flat trade in the same ticker on the same date, this coach
          section will show whether the later attempt added profit, gave back
          profit, stayed open, or changed into swing exposure.
        </div>
      )}
    </section>
  );
}

function SessionStoryCoachPanel({
  story,
  storyCount,
}: {
  story: SavedTradeSessionStory | null;
  storyCount: number;
}) {
  return (
    <section className="ti-panel p-5" data-testid="coach-session-story-panel">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-300">
            Session Story Coach
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-zinc-50">
            Review the full trading day, not only one trade.
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
            The coach now checks saved executions across each session for
            green-to-red days, many attempts on one ticker, high trade-count
            sessions, open or overnight exposure, and evidence-backed strengths
            worth repeating. Execution-only facts stay separate from chart
            findings.
          </p>
        </div>
        <Link
          className="border border-sky-800 bg-sky-950/40 px-4 py-3 text-sm font-medium text-sky-100 transition hover:border-sky-400"
          href={story?.href ?? "/analytics"}
        >
          {story ? "Open session evidence" : "Open analytics"}
        </Link>
      </div>

      {story ? (
        <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,0.42fr)_minmax(0,1fr)]">
          <div className={`border p-4 ${sessionStoryToneClass(story)}`}>
            <div className="text-xs font-semibold uppercase tracking-wide opacity-80">
              Session to review
            </div>
            <div className="mt-2 text-2xl font-semibold">
              {story.sessionDate}
            </div>
            <div className="mt-1 text-sm opacity-90">
              {story.tradeCount} round trips / {story.symbolCount} symbols /{" "}
              {signed(story.totalGrossRealizedPnl)}
            </div>
            <div className="mt-4 text-lg font-semibold">
              {story.storyLabel}
            </div>
            <p className="mt-2 text-sm leading-6 opacity-90">
              {story.storyDetail}
            </p>
          </div>
          <div className="grid gap-3">
            <div className="grid gap-3 md:grid-cols-4">
              <MetricCard
                label="Peak Then Finish"
                value={`${signed(story.peakCumulativePnl)} -> ${signed(
                  story.totalGrossRealizedPnl,
                )}`}
                detail="Shows whether the session gave back earlier profit."
                tone={
                  story.storyKind === "green_to_red_session"
                    ? "danger"
                    : "info"
                }
              />
              <MetricCard
                label="Ticker Attempts"
                value={String(story.multiRoundTripThreadCount)}
                detail="Same-symbol stories with more than one round trip."
                tone={
                  story.multiRoundTripThreadCount > 0 ? "warning" : "default"
                }
              />
              <MetricCard
                label="Open Or Swing"
                value={String(story.openOrSwingThreadCount)}
                detail="Needs hold-plan review when present."
                tone={story.openOrSwingThreadCount > 0 ? "info" : "default"}
              />
              <MetricCard
                label="Strengths To Repeat"
                value={String(story.marketContextStrengthCount)}
                detail={`${story.protectedProfitBeforeFadeFindingCount} profit-protection strength${story.protectedProfitBeforeFadeFindingCount === 1 ? "" : "s"}`}
                tone={
                  story.marketContextStrengthCount > 0 ? "success" : "default"
                }
              />
            </div>
            <div className="border border-zinc-900 bg-zinc-950/70 p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Coach question
              </div>
              <div className="mt-2 text-sm leading-6 text-zinc-200">
                {story.reviewPrompt}
              </div>
            </div>
            <div className="border border-zinc-900 bg-zinc-950/70 p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Fix first
              </div>
              <div className="mt-2 text-sm leading-6 text-sky-200">
                {story.fixFirstAction}
              </div>
            </div>
            <div className="grid gap-2 md:grid-cols-3">
              {story.reviewEvidence.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  className="border border-zinc-900 bg-zinc-950/70 p-3"
                >
                  <div className="text-sm font-medium text-zinc-200">
                    {item.title}
                  </div>
                  <div className="mt-1 text-xs leading-5 text-zinc-500">
                    {item.detail}
                  </div>
                  <div className="mt-2 text-xs leading-5 text-sky-300">
                    {item.reviewAction}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-5 border border-zinc-900 bg-zinc-950/70 p-4 text-sm leading-6 text-zinc-400">
          No session stories yet. Save one broker CSV so the coach can compare
          all trades from the same trading day.
        </div>
      )}
      <div className="mt-4 border-t border-zinc-900 pt-3 text-xs uppercase tracking-wide text-zinc-500">
        {storyCount} session stor{storyCount === 1 ? "y" : "ies"} available
      </div>
    </section>
  );
}

function CoachSessionBriefPanel({
  actionHref,
  actionLabel,
  behaviorLabel,
  dataLabel,
  evidenceHref,
  evidenceLabel,
  evidenceSummary,
  fixFirst,
  focusActionDetail,
  focusActionLabel,
  focusActionTone,
  hasSavedTrade,
  repeatCheck,
  reviewHref,
  sampleWarning,
  title,
  whyItMatters,
}: {
  actionHref: string;
  actionLabel: string;
  behaviorLabel: string;
  dataLabel: string;
  evidenceHref: string;
  evidenceLabel: string;
  evidenceSummary: string;
  fixFirst: string;
  focusActionDetail: string;
  focusActionLabel: string;
  focusActionTone: "risk" | "review";
  hasSavedTrade: boolean;
  repeatCheck: string;
  reviewHref: string;
  sampleWarning: string;
  title: string;
  whyItMatters: string;
}) {
  return (
    <section
      className="ti-coach-brief p-5 sm:p-6"
      data-testid="coach-primary-action"
    >
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-start">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Current Coaching Focus
          </p>
          <h2 className="mt-2 max-w-4xl text-2xl font-semibold text-slate-950">
            {title}
          </h2>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
            {whyItMatters}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 xl:justify-end">
          <Link
            className="inline-flex items-center justify-center rounded-md border border-slate-950 bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            href={actionHref}
          >
            {actionLabel}
          </Link>
          <Link
            className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white/70 px-4 py-3 text-sm font-semibold text-slate-800 transition hover:border-slate-500"
            href={evidenceHref}
          >
            {hasSavedTrade ? "Replay trade" : "Import trades"}
          </Link>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-4">
        {[
          {
            label: "Pattern Across Trades",
            value: behaviorLabel,
            detail: `${dataLabel}. ${sampleWarning}`,
            tone: "text-amber-700",
          },
          {
            label: "Evidence Trades",
            value: evidenceSummary,
            detail: evidenceLabel,
            tone: "text-sky-700",
          },
          {
            label: focusActionLabel,
            value: fixFirst,
            detail: focusActionDetail,
            tone:
              focusActionTone === "risk" ? "text-rose-700" : "text-amber-700",
          },
          {
            label: "Progress Follow-Through",
            value: repeatCheck,
            detail: "Use progress after the review is written.",
            tone: "text-emerald-700",
          },
        ].map((item) => (
          <div className="ti-coach-brief-cell" key={item.label}>
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {item.label}
            </div>
            <div className={`mt-2 text-sm font-semibold leading-6 ${item.tone}`}>
              {item.value}
            </div>
            <div className="mt-2 text-xs leading-5 text-slate-500">
              {item.detail}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap gap-2 text-xs">
        <Link className="text-slate-700 underline-offset-4 hover:underline" href={reviewHref}>
          Open review queue
        </Link>
        <span className="text-slate-400">/</span>
        <Link className="text-slate-700 underline-offset-4 hover:underline" href="/progress#progress-follow-through">
          Track progress after review
        </Link>
      </div>
    </section>
  );
}

function TradesToReviewNextPanel({
  focusLabel,
  items,
}: {
  focusLabel?: string | null;
  items: SavedReviewQueueItem[];
}) {
  return (
    <section className="ti-panel p-5" data-testid="coach-review-backlog-preview">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-sky-300">
            Trades To Review Next
          </p>
          <h2 className="mt-2 text-xl font-semibold text-zinc-50">
            Work the evidence queue after the focus is clear.
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
            These trades are not separate coaching topics. They are the proof
            set for the current focus, so each one should answer what happened,
            why it mattered, and what to write down.
          </p>
        </div>
        <Link
          className="inline-flex items-center justify-center border border-sky-800 bg-sky-950/40 px-4 py-3 text-sm font-medium text-sky-100 transition hover:border-sky-400"
          href="/review?queue=highest_priority"
        >
          Open full review queue
        </Link>
      </div>

      <div className="mt-5 grid gap-3">
        {items.length === 0 ? (
          <div className="ti-panel-soft p-4 text-sm leading-6 text-zinc-400">
            Save one broker CSV to unlock coaching from your own trades.
          </div>
        ) : (
          items.map((item) => (
            <Link
              className="ti-panel-soft block p-4 transition hover:border-sky-500"
              href={tradeReviewHref(item, focusLabel)}
              key={item.id}
            >
              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-base font-semibold text-zinc-50">
                      {userFacingTradeSymbol(item.symbol)}
                    </span>
                    <span
                      className={`font-mono text-sm ${
                        (item.grossRealizedPnl ?? 0) < 0
                          ? "text-rose-300"
                          : (item.grossRealizedPnl ?? 0) > 0
                            ? "text-emerald-300"
                            : "text-zinc-400"
                      }`}
                    >
                      {signed(item.grossRealizedPnl)}
                    </span>
                    <span className="rounded-md border border-zinc-800 px-2 py-1 text-xs uppercase tracking-wide text-zinc-400">
                      {coachLaneLabel(item.lane)}
                    </span>
                  </div>
                  <div className="mt-2 text-sm leading-6 text-zinc-400">
                    <span className="font-medium text-zinc-200">Why it is here:</span>{" "}
                    {item.priorityReason}
                  </div>
                  <div className="mt-1 text-sm leading-6 text-zinc-400">
                    <span className="font-medium text-zinc-200">Review:</span>{" "}
                    {item.nextAction}
                  </div>
                </div>
                <span className="shrink-0 text-sm font-medium text-sky-300">
                  Open Trade Review
                </span>
              </div>
            </Link>
          ))
        )}
      </div>
    </section>
  );
}

function CoachStepCard({
  actionHref,
  actionLabel,
  body,
  label,
  step,
  title,
  tone = "info",
}: {
  actionHref: string;
  actionLabel: string;
  body: string;
  label: string;
  step: number;
  title: string;
  tone?: "info" | "success" | "warning";
}) {
  const toneClass =
    tone === "success"
      ? "border-emerald-900/70 bg-emerald-950/20 text-emerald-300"
      : tone === "warning"
        ? "border-amber-900/70 bg-amber-950/20 text-amber-300"
        : "border-sky-900/70 bg-sky-950/25 text-sky-300";

  return (
    <div className={`min-w-0 border p-4 ${toneClass}`}>
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-current font-mono text-sm">
          {step}
        </div>
        <div className="min-w-0">
          <div className="text-xs font-semibold uppercase tracking-wide opacity-80">
            {label}
          </div>
          <h3 className="mt-1 text-base font-semibold text-zinc-50">{title}</h3>
        </div>
      </div>
      <p className="mt-3 text-sm leading-6 text-zinc-400">{body}</p>
      <Link
        className="mt-4 inline-flex border border-current px-3 py-2 text-sm font-medium transition hover:border-zinc-100 hover:text-zinc-100"
        href={actionHref}
      >
        {actionLabel}
      </Link>
    </div>
  );
}

function BehaviorCostChart({
  items,
}: {
  items: Array<{
    estimatedGrossCost: number | null;
    frequency: number;
    id: string;
    label: string;
    severityScore: number;
  }>;
}) {
  const visibleItems = items.slice(0, 5);
  const maxScore = Math.max(
    1,
    ...visibleItems.map((item) => item.severityScore),
  );

  return (
    <div className={panelClass} data-testid="coach-behavior-cost-chart">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-zinc-100">
            Behavior Impact
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Start with the repeated behavior that has the clearest outcome impact and enough evidence to review.
          </p>
        </div>
        <Link className="text-sm text-sky-300 hover:text-sky-200" href="/review">
          Open review queue
        </Link>
      </div>
      <div className="mt-5 grid gap-3">
        {visibleItems.length === 0 ? (
          <div className="border-t border-zinc-900 py-3 text-sm text-zinc-500">
            Save more trades to build behavior-cost evidence.
          </div>
        ) : (
          visibleItems.map((item, index) => {
            const width = Math.max(6, (item.severityScore / maxScore) * 100);
            const isTop = index === 0;

            return (
              <div
                key={item.id}
                className="grid gap-2 border-t border-zinc-900 py-3 md:grid-cols-[minmax(0,220px)_minmax(0,1fr)_100px]"
              >
                <div>
                  <div className="text-sm font-medium text-zinc-200">
                    {item.label}
                  </div>
                  <div className="mt-1 text-xs text-zinc-500">
                    {item.frequency} trade{item.frequency === 1 ? "" : "s"} matched
                  </div>
                </div>
                <div className="flex min-w-0 items-center gap-3">
                  <div className="h-3 w-full bg-zinc-900">
                    <div
                      className={`h-3 ${
                        isTop ? "bg-rose-400" : "bg-amber-400"
                      }`}
                      style={{ width: `${width}%` }}
                    />
                  </div>
                  <span className="font-mono text-xs text-zinc-500">
                    {item.severityScore}
                  </span>
                </div>
                <div
                  className={`font-mono text-sm md:text-right ${
                    (item.estimatedGrossCost ?? 0) < 0
                      ? "text-rose-300"
                      : "text-zinc-400"
                  }`}
                >
                  {signed(item.estimatedGrossCost)}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function BehaviorCountChart({
  items,
}: {
  items: Array<{
    frequency: number;
    id: string;
    label: string;
  }>;
}) {
  const visibleItems = items.slice(0, 5);
  const max = Math.max(1, ...visibleItems.map((item) => item.frequency));

  return (
    <div className={panelClass} data-testid="coach-behavior-count-chart">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-zinc-100">
            Repeat Pattern
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            This shows whether the same behavior is appearing across multiple saved trades.
          </p>
        </div>
        <Link className="text-sm text-sky-300 hover:text-sky-200" href="/progress#progress-follow-through">
          Track progress
        </Link>
      </div>
      <div className="mt-5 grid gap-3">
        {visibleItems.length === 0 ? (
          <div className="border-t border-zinc-900 py-3 text-sm text-zinc-500">
            Save more trades to see repeated behavior counts.
          </div>
        ) : (
          visibleItems.map((item, index) => (
            <div
              className="grid gap-2 border-t border-zinc-900 py-3 md:grid-cols-[minmax(0,220px)_minmax(0,1fr)_72px]"
              key={item.id}
            >
              <div className="text-sm font-medium text-zinc-200">
                {item.label}
              </div>
              <div className="flex min-w-0 items-center">
                <div className="h-3 w-full bg-zinc-900">
                  <div
                    className={index === 0 ? "h-3 bg-rose-400" : "h-3 bg-sky-400"}
                    style={{ width: `${Math.max(8, (item.frequency / max) * 100)}%` }}
                  />
                </div>
              </div>
              <div className="font-mono text-sm text-zinc-400 md:text-right">
                {item.frequency}x
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function coachProgressToneClass(tone: CoachProgressFollowThroughTone): string {
  if (tone === "success") {
    return "text-emerald-700";
  }

  if (tone === "danger") {
    return "text-rose-700";
  }

  if (tone === "warning") {
    return "text-amber-700";
  }

  return "text-sky-700";
}

function coachProgressBarClass(tone: CoachProgressFollowThroughTone): string {
  if (tone === "success") {
    return "bg-emerald-500";
  }

  if (tone === "danger") {
    return "bg-rose-500";
  }

  if (tone === "warning") {
    return "bg-amber-500";
  }

  return "bg-sky-500";
}

function CoachProgressFollowThroughPanel({
  summary,
}: {
  summary: CoachProgressFollowThroughSummary;
}) {
  return (
    <section
      id="progress-follow-through"
      className="ti-coach-brief p-5 sm:p-6"
      data-testid="coach-progress-follow-through"
    >
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Progress Follow-Through
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">
            {summary.trendLabel}
          </h2>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
            {summary.trendDetail}
          </p>
        </div>
        <Link
          className="inline-flex items-center justify-center rounded-md border border-slate-950 bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          href={summary.nextActionHref}
        >
          {summary.nextActionLabel}
        </Link>
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <span>Finished Reviews</span>
          <span>{summary.completionPct}%</span>
        </div>
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-200">
          <div
            className={`h-3 ${coachProgressBarClass(summary.trendTone)}`}
            style={{ width: `${Math.max(4, summary.completionPct)}%` }}
          />
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-4">
        {summary.cards.map((card) => (
          <div className="ti-coach-brief-cell" key={card.label}>
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {card.label}
            </div>
            <div
              className={`mt-2 text-xl font-semibold ${coachProgressToneClass(
                card.tone,
              )}`}
            >
              {card.value}
            </div>
            <div className="mt-2 text-xs leading-5 text-slate-500">
              {card.detail}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function CoachNextSessionPlanPanel({
  avoidBehavior,
  checklist,
  primaryActionDetail,
  primaryActionHref,
  primaryActionLabel,
  repeatBehavior,
  ruleFocus,
  sessionTimeInsight,
}: {
  avoidBehavior: string;
  checklist: string[];
  primaryActionDetail: string;
  primaryActionHref: string;
  primaryActionLabel: string;
  repeatBehavior: string;
  ruleFocus: string;
  sessionTimeInsight: string;
}) {
  const visibleChecklist = checklist.slice(0, 4);

  return (
    <section
      id="next-session-plan"
      className="ti-coach-brief p-5 sm:p-6"
      data-testid="coach-next-session-plan"
    >
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Before Next Session
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">
            Use the coaching focus before the next session.
          </h2>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
            Keep the plan small: one rule to follow, one behavior to reduce, and
            one strength to repeat. The detailed charts stay below as supporting
            evidence.
          </p>
        </div>
        <Link
          className="inline-flex items-center justify-center rounded-md border border-slate-950 bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          href={primaryActionHref}
        >
          {primaryActionLabel}
        </Link>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-4">
        <div className="ti-coach-brief-cell">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Rule To Use
          </div>
          <div className="mt-2 text-sm font-semibold leading-6 text-sky-700">
            {ruleFocus}
          </div>
        </div>
        <div className="ti-coach-brief-cell">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Reduce
          </div>
          <div className="mt-2 text-sm font-semibold leading-6 text-rose-700">
            {avoidBehavior}
          </div>
        </div>
        <div className="ti-coach-brief-cell">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Repeat
          </div>
          <div className="mt-2 text-sm font-semibold leading-6 text-emerald-700">
            {repeatBehavior}
          </div>
        </div>
        <div className="ti-coach-brief-cell">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Timing Check
          </div>
          <div className="mt-2 text-sm font-semibold leading-6 text-amber-700">
            {sessionTimeInsight}
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.35fr)]">
        <div className="ti-coach-brief-cell">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Quick Checklist
          </div>
          <div className="mt-3 grid gap-2">
            {visibleChecklist.length === 0 ? (
              <div className="text-sm leading-6 text-slate-500">
                Save more reviewed trades to build a personal checklist.
              </div>
            ) : (
              visibleChecklist.map((item) => (
                <div
                  className="border-t border-slate-200 pt-2 text-sm leading-6 text-slate-700"
                  key={item}
                >
                  {item}
                </div>
              ))
            )}
          </div>
        </div>
        <div className="ti-coach-brief-cell">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Next Action
          </div>
          <div className="mt-2 text-sm font-semibold leading-6 text-slate-900">
            {primaryActionLabel}
          </div>
          <div className="mt-2 text-xs leading-5 text-slate-500">
            {primaryActionDetail}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function CoachPage() {
  const analyticsData = buildSavedOrSampleTraderAnalyticsViewModel();
  const analytics = analyticsData.viewModel;
  const savedTradesForProgress = analyticsData.repository.listTrades(
    analyticsData.userId,
  );
  const savedReviewQueue =
    analyticsData.mode === "saved"
      ? buildSavedReviewQueueReadModel({
          repository: analyticsData.repository,
          userId: analyticsData.userId,
        })
      : null;
  const decisionReviewSnapshots =
    analyticsData.mode === "saved"
      ? [
          ...new Set(
            savedTradesForProgress
              .map((trade) => trade.importBatchId)
              .filter((batchId): batchId is string => Boolean(batchId)),
          ),
        ].flatMap((batchId) =>
          analyticsData.repository.listDecisionReviewSnapshotsForBatch(batchId),
        )
      : [];
  const tradeThreadModel = buildSavedTradeThreadReadModel({
    decisionReviewSnapshots,
    report: analytics.latestReport,
    source: analyticsData.mode === "saved" ? "saved_sqlite" : "sample",
    trades: savedTradesForProgress,
  });
  const behaviorReport = buildAnalyticsBehaviorReport(tradeThreadModel);
  const priorityTickerStory = choosePriorityTickerStory(tradeThreadModel.threads);
  const prioritySessionStory = choosePrioritySessionStory(
    tradeThreadModel.sessionStories,
  );
  const importSourceCaution =
    analyticsData.mode === "saved"
      ? buildLatestSavedImportSourceCautionReadModel({
          repository: analyticsData.repository,
        })
      : null;
  const coach = analytics.coachActionLoop;
  const polish = analytics.productPolish;
  const habit = analytics.reviewHabitLoop;
  const home = coach.coachHome;
  const prep = coach.sessionPrepCard;
  const archetype = coach.archetypeProfile.primary;
  const primaryReviewItem =
    savedReviewQueue?.items[0] ?? savedReviewQueue?.allItems[0] ?? null;
  const dataLabel =
    analyticsData.mode === "saved"
      ? plainStateLabel("saved_sqlite")
      : "Sample data until you save an import";
  const mostExpensiveHabit =
    coach.mistakeSeverityLadder.topSeverity?.label ?? "the biggest repeated risk";
  const sessionBehavior = chooseCoachOverallFocusBehavior({
    items: coach.mistakeSeverityLadder.items,
    top: coach.mistakeSeverityLadder.topSeverity,
    tradeId: null,
  });
  const primaryEvidenceItem = chooseCoachEvidenceQueueItem({
    behavior: sessionBehavior,
    fallback: primaryReviewItem,
    queue: savedReviewQueue?.allItems ?? [],
  });
  const reviewTradeBaseHref = primaryEvidenceItem
    ? coachTradePath(primaryEvidenceItem, sessionBehavior?.label)
    : "/import-dry-run";
  const reviewReplayHref = primaryEvidenceItem
    ? withPageAnchor(reviewTradeBaseHref, "execution")
    : reviewTradeBaseHref;
  const reviewWritingHref = primaryEvidenceItem
    ? withPageAnchor(reviewTradeBaseHref, "writing-flow")
    : reviewTradeBaseHref;
  const focusedEvidenceCards = primaryEvidenceItem
    ? polish.evidenceCards.filter((card) =>
        card.relatedTradeIds.includes(primaryEvidenceItem.savedTradeId),
      )
    : [];
  const sessionEvidenceCards =
    focusedEvidenceCards.length > 0
      ? focusedEvidenceCards.slice(0, 3)
      : polish.evidenceCards.slice(0, 3);
  const reviewPreviewItems = chooseReviewPreviewItems({
    behavior: sessionBehavior,
    primary: primaryEvidenceItem,
    queue: savedReviewQueue?.allItems ?? [],
  });
  const overallFocus = buildCoachOverallFocusSummary({
    behavior: sessionBehavior,
    fallbackAction:
      "Save one broker CSV, then review the first execution replay and write one lesson.",
    primarySymbol: primaryEvidenceItem?.symbol ?? null,
  });
  const coachProgress = buildCoachProgressFollowThroughSummary({
    activeFocusLabel: overallFocus.label,
    hasSavedData: analyticsData.mode === "saved",
    reviewQueueItems: savedReviewQueue?.allItems ?? [],
    trades: savedTradesForProgress,
  });
  const sessionBehaviorLabel = overallFocus.label;
  const sessionBehaviorDetail = overallFocus.nextAction;
  const sessionBehaviorExplanation = overallFocus.plainExplanation;
  const sessionWhyItMatters = overallFocus.whyItMatters;
  const evidenceSummary = overallFocus.evidenceCountLabel;
  const sampleWarning = overallFocus.sampleWarning;
  const primaryEvidenceDisplayName =
    userFacingTradeSymbol(primaryEvidenceItem?.symbol);
  const sessionTradeTitle = primaryEvidenceItem
    ? `${primaryEvidenceDisplayName} evidence trade`
    : "Import a broker CSV to start coaching";
  const sessionTradeDetail = primaryEvidenceItem
    ? `Use this trade to prove or reject the current focus. ${primaryEvidenceItem.stateDetail}`
    : "The coach needs one saved broker CSV before it can use your own trades.";
  const coachPageTitle = "Your Trading Coach";
  const repeatCheck = coachProgress.trendLabel;
  const evidenceLabel = primaryEvidenceItem
    ? `${primaryEvidenceDisplayName} / ${signed(primaryEvidenceItem.grossRealizedPnl)}`
    : "No saved trade yet";

  return (
    <main className="ti-dashboard-bg min-h-screen px-5 py-8 text-zinc-100 sm:px-8">
      <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-8">
        <header className="ti-panel p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <Link className="text-sm text-sky-300 hover:text-sky-200" href="/workspace">
                Back to workspace
              </Link>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-emerald-400">
                Coach
              </p>
              <h1 className="mt-2 max-w-4xl text-3xl font-semibold text-zinc-50">
                {coachPageTitle}
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
                Start with the main behavior across saved trades. Then open the
                evidence trades, write the review, and track whether the focus
                changes after completed reviews.
              </p>
            </div>
            <Link
              className="border border-sky-800 bg-sky-950/40 px-4 py-3 text-sm font-medium text-sky-100 transition hover:border-sky-400"
              href={reviewWritingHref}
            >
              {primaryEvidenceItem ? "Open evidence trade" : "Import trades"}
            </Link>
          </div>
          <div className="mt-5 flex flex-wrap gap-2 text-xs uppercase tracking-wide">
            <span className="rounded-md border border-zinc-800 bg-zinc-950 px-2 py-1 text-zinc-400">
              {dataLabel}
            </span>
            <span className="rounded-md border border-emerald-900 bg-emerald-950/20 px-2 py-1 text-emerald-300">
              chart claims gated
            </span>
            <span className="rounded-md border border-zinc-800 bg-zinc-950 px-2 py-1 text-zinc-400">
              evidence-backed review
            </span>
          </div>
        </header>

        <section className="grid min-w-0 gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          <DashboardSideNav
            eyebrow="Coach Menu"
            items={[
              {
                href: "#next-action",
                label: "Overall Focus",
                summary: "The behavior or strength to review across saved trades.",
              },
              {
                href: "#coaching-session",
                label: "Review Session",
                summary: "Understand why it mattered, then review the evidence trade.",
              },
              {
                href: "#behavior-map",
                label: "Behavior Sequence",
                summary: "One chart-backed path for what to fix, repeat, or review.",
              },
              {
                href: "#review-backlog",
                label: "Review Backlog",
                summary: "Trades that prove or challenge the coaching focus.",
              },
              {
                href: "#ticker-story-coach",
                label: "Ticker Stories",
                summary: "Same-symbol re-entries, giveback, and swing transitions.",
              },
              {
                href: "#session-story-coach",
                label: "Session Stories",
                summary: "Full-day review for green-to-red, high activity, and hold exposure.",
              },
              {
                href: "#next-session-plan",
                label: "Next Session",
                summary: "One rule, one behavior to reduce, and one strength to repeat.",
              },
              {
                href: "#progress-follow-through",
                label: "Progress",
                summary: "What must be reviewed before progress means anything.",
              },
              {
                href: "#advanced",
                label: "More Details",
                summary: "Supporting charts, queue totals, and rule checks.",
              },
            ]}
            summary="Use this as a coaching workspace instead of scrolling every panel."
          />
          <div className="grid min-w-0 gap-6">
            <div id="next-action">
              <CoachSessionBriefPanel
                actionHref={reviewWritingHref}
                actionLabel={primaryEvidenceItem ? "Open evidence trade" : "Import trades"}
                behaviorLabel={sessionBehaviorLabel}
                dataLabel={dataLabel}
                evidenceHref={reviewReplayHref}
                evidenceLabel={evidenceLabel}
                evidenceSummary={evidenceSummary}
                fixFirst={prep.ruleFocus}
                focusActionDetail={overallFocus.focusActionDetail}
                focusActionLabel={overallFocus.focusActionLabel}
                focusActionTone={overallFocus.focusActionTone}
                hasSavedTrade={Boolean(primaryEvidenceItem)}
                repeatCheck={repeatCheck}
                reviewHref="/review?queue=highest_priority"
                sampleWarning={sampleWarning}
                title={
                  sessionBehavior
                    ? sessionBehaviorLabel
                    : "Save one broker CSV to unlock coaching"
                }
                whyItMatters={sessionWhyItMatters}
              />
            </div>

            <WorkflowHandoffPanel
              body="The coach starts with the overall pattern, then uses trades as evidence. Work through this path when you want the page to feel like a coaching session instead of a dashboard."
              eyebrow="Coaching Flow"
              items={[
                {
                  action: "Read focus",
                  body: "Start with the behavior or strength showing across saved trades.",
                  href: "#next-action",
                  label: "1. Overall",
                  title: "Understand the focus",
                  tone: "info",
                },
                {
                  action: primaryEvidenceItem ? "Open trade" : "Import trades",
                  body: primaryEvidenceItem
                    ? "Replay the evidence trade and write what actually happened."
                    : "Save one broker CSV before the coach can use your own trades.",
                  href: reviewWritingHref,
                  label: "2. Evidence",
                  title: primaryEvidenceItem
                    ? primaryEvidenceDisplayName
                    : "Saved import needed",
                  tone: "warning",
                },
                {
                  action: "Open queue",
                  body: "Use the backlog to prove whether the focus repeats.",
                  href: "/review?queue=highest_priority",
                  label: "3. Review",
                  title: "Work the next trades",
                  tone: "success",
                },
                {
                  action: "Check progress",
                  body: "Measure follow-through after reviews are written.",
                  href: "/progress#progress-follow-through",
                  label: "4. Track",
                  title: "Confirm what changed",
                  tone: "info",
                },
              ]}
              testId="coach-workflow-handoff"
              title="Overall coaching workflow"
            />

        <section
          id="coaching-session"
          className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(340px,0.42fr)]"
          data-testid="coach-guided-session"
        >
          <div className="ti-panel p-5" data-testid="coach-session-workflow">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-sky-300">
                  Review Session
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-zinc-50">
                  Work the focus, then prove it with trades.
                </h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
                  This page starts with the coaching focus. Use the supporting
                  charts and evidence after you know which behavior you are
                  testing across saved trades.
                </p>
              </div>
              <Link
                className="border border-sky-800 bg-sky-950/40 px-4 py-3 text-sm font-medium text-sky-100 transition hover:border-sky-400"
                href={reviewReplayHref}
              >
                {primaryEvidenceItem ? "Replay selected trade" : "Import trades"}
              </Link>
            </div>
            <div className="mt-5 grid gap-3">
              <CoachStepCard
                actionHref={reviewReplayHref}
                actionLabel={primaryEvidenceItem ? "Replay trade" : "Import trades"}
                body={
                  primaryEvidenceItem
                    ? `Use ${primaryEvidenceDisplayName} as evidence. Watch the executions first so the coaching starts from what actually happened.`
                    : "Save one broker CSV before the coach can use your own trades."
                }
                label="Start here"
                step={1}
                title="Open the evidence trade"
              />
              <CoachStepCard
                actionHref="#main-behavior"
                actionLabel="Name behavior"
                body={`Name the focus before reading every panel. Current coaching focus: ${sessionBehaviorLabel}.`}
                label="Identify"
                step={2}
                title="Name the behavior across trades"
                tone="warning"
              />
              <CoachStepCard
                actionHref="#fix-first"
                actionLabel={
                  overallFocus.focusActionLabel === "Fix first"
                    ? "Create rule"
                    : "Test rule"
                }
                body={
                  overallFocus.focusActionLabel === "Fix first"
                    ? prep.avoidBehavior
                    : overallFocus.focusActionDetail
                }
                label={overallFocus.focusActionLabel}
                step={3}
                title={
                  overallFocus.focusActionLabel === "Fix first"
                    ? "Choose one rule for next session"
                    : "Check the evidence before changing rules"
                }
                tone="warning"
              />
              <CoachStepCard
                actionHref="/progress#progress-follow-through"
                actionLabel="Check progress"
                body="After reviews are saved, check whether the focus is improving, staying the same, or needs more review."
                label="Follow through"
                step={4}
                title="Track the behavior"
                tone="success"
              />
            </div>
          </div>

          <aside
            className="ti-panel p-5"
            data-testid="coach-featured-trade-session"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-300">
              Featured Evidence Trade
            </p>
            <h2 className="mt-2 text-xl font-semibold text-zinc-50">
              {sessionTradeTitle}
            </h2>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              {sessionTradeDetail}
            </p>
            <div id="main-behavior" className="mt-5 border-t border-zinc-900 pt-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Main behavior
              </div>
              <div className="mt-2 text-lg font-semibold text-amber-200">
                {sessionBehaviorLabel}
              </div>
              <div className="mt-2 text-sm leading-6 text-zinc-500">
                {sessionBehaviorDetail}
              </div>
            </div>
            <div className="mt-5 border-t border-zinc-900 pt-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                What this means
              </div>
              <div className="mt-2 text-sm leading-6 text-zinc-300">
                {sessionBehaviorExplanation}
              </div>
            </div>
            <div className="mt-5 border-t border-zinc-900 pt-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Why this matters
              </div>
              <div className="mt-2 text-sm leading-6 text-zinc-300">
                {sessionWhyItMatters}
              </div>
            </div>
            <div id="fix-first" className="mt-5 border-t border-zinc-900 pt-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Fix first
              </div>
              <div className="mt-2 text-sm leading-6 text-sky-200">
                {prep.ruleFocus}
              </div>
            </div>
            <div className="mt-5 border-t border-zinc-900 pt-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Evidence to check
              </div>
              <div className="mt-3 grid gap-3">
                {sessionEvidenceCards.length === 0 ? (
                  <div className="text-sm text-zinc-500">
                    Save one broker CSV to build evidence cards from your own trades.
                  </div>
                ) : (
                  sessionEvidenceCards.map((card) => (
                    <Link
                      className="block border-t border-zinc-900 py-3 hover:text-sky-200"
                      href={
                        card.primaryRoute.startsWith("/trades/")
                          ? withPageAnchor(card.primaryRoute, "evidence")
                          : card.primaryRoute
                      }
                      key={card.id}
                    >
                      <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                        What happened
                      </div>
                      <div className="mt-1 text-sm font-medium text-zinc-200">
                        {card.whatHappened}
                      </div>
                      <div className="mt-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                        Why it mattered
                      </div>
                      <div className="mt-1 text-xs leading-5 text-zinc-500">
                        {card.whyItMatters}
                      </div>
                      <div className="mt-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                        What to do next
                      </div>
                      <div className="mt-1 text-xs leading-5 text-sky-300">
                        {card.reviewAction}
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </aside>
        </section>

        <div id="behavior-map">
          <CoachBehaviorSequence report={behaviorReport} />
        </div>

        <div id="review-backlog">
            <TradesToReviewNextPanel
              focusLabel={sessionBehavior?.label}
              items={reviewPreviewItems}
            />
        </div>

        <div id="ticker-story-coach">
          <TickerStoryCoachPanel
            thread={priorityTickerStory}
            threadCount={tradeThreadModel.multiRoundTripThreadCount}
          />
        </div>

        <div id="session-story-coach">
          <SessionStoryCoachPanel
            story={prioritySessionStory}
            storyCount={tradeThreadModel.sessionStoryCount}
          />
        </div>

        <div id="progress-follow-through">
          <CoachProgressFollowThroughPanel summary={coachProgress} />
        </div>

        <CoachNextSessionPlanPanel
          avoidBehavior={compactCoachAction(
            prep.avoidBehavior,
            "Review the biggest risk",
          )}
          checklist={prep.checklist}
          primaryActionDetail={home.primaryAction.detail}
          primaryActionHref={home.primaryAction.href}
          primaryActionLabel={home.primaryAction.label}
          repeatBehavior={compactCoachAction(
            prep.repeatBehavior,
            "Repeat the strongest behavior",
          )}
          ruleFocus={prep.ruleFocus}
          sessionTimeInsight={prep.sessionTimeInsight}
        />

        <SavedImportSourceCaution
          caution={importSourceCaution}
          surface="coach"
        />

        <div id="advanced">
        <AdvancedDisclosure
          summary="More coach evidence, queue totals, and rule checks"
          testId="coach-supporting-details"
        >
        <BehaviorReportPanel mode="coach" report={behaviorReport} />

        <SavedReviewQueueSummary queue={savedReviewQueue} surface="coach" />

        <CoachSectionHeader
          eyebrow="Coach Checks"
          title="Use these as supporting checks, not the starting point."
          body="The session brief above chooses the overall focus and fix-first action. These cards explain whether the same behavior is repeated, expensive, or improving."
        />

        <section className="grid gap-4 md:grid-cols-4">
          <MetricCard
            label="Review Progress"
            value={`${coach.reviewCompletionLoop.completionPct}%`}
            detail="Saved review loop completion."
            tone="info"
          />
          <MetricCard
            label="Current Pattern"
            value={archetype?.label ?? "Collecting"}
            detail="See the pattern section below."
          />
          <MetricCard
            label="Highest Impact Habit"
            value={coach.mistakeSeverityLadder.topSeverity?.label ?? "None"}
            detail="Frequency + outcome evidence."
            tone="warning"
          />
          <MetricCard
            label="Data Source"
            value={dataLabel}
            detail="Coaching stays evidence-backed and conservative."
            tone={analyticsData.mode === "saved" ? "success" : "warning"}
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <BehaviorCostChart items={coach.mistakeSeverityLadder.items} />
          <BehaviorCountChart items={coach.mistakeSeverityLadder.items} />
        </section>

        <CoachSectionHeader
          eyebrow="Proof"
          title="Open the evidence after you know the coaching focus."
          body="This keeps coaching from becoming a dashboard dump. First review the trade, then use these links to prove whether the behavior repeats across saved trades."
        />

        <section id="evidence" className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.45fr)]">
          <div className={panelClass}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-sm font-semibold text-zinc-100">
                  Proof Queue
                </h2>
                <div className="mt-1 text-sm text-zinc-500">
                  {primaryEvidenceItem?.nextAction ??
                    "No review queue item yet."}
                </div>
              </div>
              <Link
                className="text-sm text-sky-300 hover:text-sky-200"
                href="/session-recap"
              >
                Session recap
              </Link>
            </div>
            <div className="mt-4 grid gap-3">
              {reviewPreviewItems.length === 0 ? (
                <div className="border-t border-zinc-900 py-3 text-sm text-zinc-500">
                  Save one broker CSV to build an evidence queue.
                </div>
              ) : (
                reviewPreviewItems.slice(0, 6).map((item) => (
                  <Link
                    key={item.id}
                    className="block border-t border-zinc-900 py-3 hover:text-sky-200"
                    href={tradeReviewHref(item, sessionBehavior?.label)}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm text-zinc-300">
                        {userFacingTradeSymbol(item.symbol)} / {signed(item.grossRealizedPnl)}
                      </span>
                      <span className="text-xs uppercase tracking-wide text-zinc-500">
                        {coachLaneLabel(item.lane)}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-zinc-500">
                      {item.priorityReason}
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          <div className={panelClass}>
            <h2 className="text-sm font-semibold text-zinc-100">
              Evidence Cards To Open
            </h2>
            <div className="mt-4 grid gap-3">
              {sessionEvidenceCards.length === 0 ? (
                <div className="border-t border-zinc-900 py-3 text-sm text-zinc-500">
                  Save more reviewed trades to build evidence cards.
                </div>
              ) : (
                sessionEvidenceCards.map((card) => (
                  <Link
                    key={card.id}
                    className="block border-t border-zinc-900 py-3 hover:text-sky-200"
                    href={coachEvidenceCardHref(
                      card.primaryRoute,
                      sessionBehavior?.label,
                    )}
                  >
                    <div className="text-sm text-zinc-300">{card.title}</div>
                    <div className="mt-1 text-xs text-zinc-500">
                      {card.confidenceCopy}
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-3">
          <div className={panelClass}>
            <h2 className="text-sm font-semibold text-zinc-100">
              Rule To Create
            </h2>
            <div className="mt-3 text-2xl font-semibold text-sky-300">
              {habit.mistakeRuleConversion.totalDrafts}
            </div>
            <div className="mt-2 text-xs text-zinc-500">
              {habit.mistakeRuleConversion.nextAction}
            </div>
          </div>
          <Link
            className={`${panelClass} block transition hover:border-sky-400`}
            href="/compare-trades"
          >
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Compare
            </div>
            <div className="mt-3 text-lg font-semibold text-zinc-100">
              {habit.tradeComparison?.title ?? "More trades needed"}
            </div>
            <div className="mt-2 text-xs text-zinc-500">
              {habit.tradeComparison?.reviewPrompt ?? "Save more trades first."}
            </div>
          </Link>
          <Link
            className={`${panelClass} block transition hover:border-emerald-400`}
            href="/onboarding"
          >
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Onboarding
            </div>
            <div className="mt-3 text-lg font-semibold text-emerald-300">
              {habit.onboardingPath.completionPct}%
            </div>
            <div className="mt-2 text-xs text-zinc-500">
              {habit.onboardingPath.currentStep?.nextAction ?? "Onboarding complete."}
            </div>
          </Link>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <div className={panelClass}>
            <h2 className="text-sm font-semibold text-zinc-100">
              Rule Ideas To Consider
            </h2>
            <div className="mt-4 grid gap-3">
              {polish.ruleCandidateLab.items.slice(0, 5).map((item) => (
                <div key={item.id} className="border-t border-zinc-900 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-zinc-300">
                      {item.suggestedRuleTitle}
                    </span>
                    <span className="text-xs uppercase tracking-wide text-zinc-500">
                      {item.readiness}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-zinc-500">
                    {item.reason}
                  </div>
                  <div className="mt-2 text-xs text-sky-300">
                    {item.limitation}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={panelClass}>
            <h2 className="text-sm font-semibold text-zinc-100">
              Personal Pattern Memory
            </h2>
            <div className="mt-4 grid gap-3">
              {polish.personalPatternMemory.items.slice(0, 6).map((item) => (
                <div key={item.id} className="border-t border-zinc-900 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-zinc-300">{item.label}</span>
                    <span className="text-xs uppercase tracking-wide text-zinc-500">
                      {item.kind}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-zinc-500">
                    {item.summary}
                  </div>
                  <div className="mt-2 text-xs text-emerald-300">
                    {item.nextAction}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <div className={panelClass}>
            <h2 className="text-sm font-semibold text-zinc-100">
              Highest Impact Habit
            </h2>
            <div className="mt-4 grid gap-3">
              {coach.mistakeSeverityLadder.items.slice(0, 6).map((item) => (
                <div key={item.id} className="border-t border-zinc-900 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-zinc-300">{item.label}</span>
                    <span className="font-mono text-xs text-amber-300">
                      {item.severityScore}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-zinc-500">
                    {item.frequency}x / cost {signed(item.estimatedGrossCost)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={panelClass}>
            <h2 className="text-sm font-semibold text-zinc-100">
              Rule Evidence Check
            </h2>
            <div className="mt-4 grid gap-3">
              {coach.ruleSimulations.slice(0, 6).map((simulation) => (
                <div key={simulation.id} className="border-t border-zinc-900 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-zinc-300">
                      {simulation.suggestedRuleTitle}
                    </span>
                    <span className="font-mono text-xs text-sky-300">
                      {simulation.flaggedTradeCount}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-zinc-500">
                    {simulation.limitation}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <div className={panelClass}>
            <h2 className="text-sm font-semibold text-zinc-100">
              Current Pattern
            </h2>
            <div className="mt-2 text-sm text-zinc-500">
              {coach.archetypeProfile.summary}
            </div>
            <div className="mt-4 grid gap-3">
              {coach.archetypeProfile.signals.map((signal) => (
                <div key={signal.id} className="border-t border-zinc-900 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-zinc-300">{signal.label}</span>
                    <span className="font-mono text-xs text-zinc-500">
                      {signal.score}/100
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 bg-zinc-900">
                    <div
                      className="h-1.5 bg-emerald-400"
                      style={{ width: `${signal.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={panelClass}>
            <h2 className="text-sm font-semibold text-zinc-100">
              Review Completion
            </h2>
            <div className="mt-4 grid gap-3">
              {coach.reviewCompletionLoop.steps.map((step) => (
                <div key={step.id} className="border-t border-zinc-900 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-zinc-300">{step.label}</span>
                    <span className="text-xs uppercase tracking-wide text-zinc-500">
                      {step.status}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-zinc-500">{step.detail}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className={panelClass}>
          <h2 className="text-sm font-semibold text-zinc-100">
            Evidence Confidence Wording
          </h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {coach.confidenceLanguage.items.slice(0, 6).map((item) => (
              <div key={item.sourceId} className="border-t border-zinc-900 py-3">
                <div className="text-xs uppercase tracking-wide text-zinc-500">
                  {item.evidenceLevel}
                </div>
                <div className="mt-2 text-sm text-zinc-300">{item.copy}</div>
              </div>
            ))}
          </div>
        </section>
        </AdvancedDisclosure>
        </div>
          </div>
        </section>
      </div>
    </main>
  );
}
