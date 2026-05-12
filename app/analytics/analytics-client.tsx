"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import {
  AdvancedDisclosure,
  EquityCurveChart,
  MetricCard,
  MixBar,
  OutcomeDonut,
  PnlCalendarGrid,
  SimpleBarChart,
  TradeOutcomeTape,
  WorkflowHandoffPanel,
  withPageAnchor,
} from "../app-ui";
import { BehaviorReportPanel } from "../behavior-report-panel";
import { SavedImportSourceCaution } from "../saved-import-source-caution";
import { SavedReviewQueueSummary } from "../saved-review-queue-summary";
import type { SavedImportSourceCautionReadModel } from "../../src/lib/trader-analytics/server/saved-import-source-caution";
import type { AnalyticsBehaviorReport } from "../../src/lib/trader-analytics/server/analytics-behavior-report";
import type { SavedReviewQueueReadModel } from "../../src/lib/trader-analytics/server/saved-review-queue";
import type {
  ProductTraderAnalyticsTradeRow,
  ProductTraderAnalyticsViewModel,
  SavedReportSnapshotCard,
  SavedTradeImportInbox,
  TraderAnalyticsDrillDown,
  TraderAnalyticsFilter,
  TraderAnalyticsMetricDelta,
  TraderAnalyticsProductizationViewModel,
  TraderAnalyticsStorageReadiness,
  TraderBehaviorStreak,
  TraderImprovementIntelligence,
  TraderImprovementVisual,
  TraderJournalPrompt,
  TraderMarketContextAddOnStatus,
  TraderProductIntelligenceViewModel,
  TraderProductPolishViewModel,
  TraderImportTrialExperienceViewModel,
  TraderReviewHabitLoopViewModel,
  TraderRuleComplianceSummary,
  TraderWeeklyReviewDashboard,
} from "../../src/lib/trader-analytics";

interface AnalyticsTickerStorySummary {
  addQualityFindingCount: number;
  addQualityRiskCount: number;
  addQualityReviewPromptCount: number;
  addQualityStrengthCount: number;
  exitLevelFindingCount: number;
  exitLevelRiskCount: number;
  exitLevelReviewPromptCount: number;
  exitLevelStrengthCount: number;
  givebackThreadCount: number;
  marketContextFindingCount: number;
  marketContextRiskCount: number;
  marketContextReviewPromptCount: number;
  marketContextStrengthCount: number;
  multiRoundTripThreadCount: number;
  openReentryThreadCount: number;
  postExitFindingCount: number;
  postExitFindingThreadCount: number;
  postExitRiskCount: number;
  postExitRiskThreadCount: number;
  postExitReviewPromptCount: number;
  postExitStrengthCount: number;
  postExitStrengthThreadCount: number;
  protectedProfitBeforeFadeFindingCount: number;
  protectedProfitBeforeFadeThreadCount: number;
  priority: {
    href: string;
    label: string;
    pnl: number;
    question: string;
  } | null;
  repeatedLossThreadCount: number;
  swingThreadCount: number;
  levelFindingCount: number;
  threadWithAddQualityFindingCount: number;
  threadWithExitLevelFindingCount: number;
  threadWithExitLevelRiskCount: number;
  threadWithExitLevelStrengthCount: number;
  threadWithLevelFindingCount: number;
  threadWithVolumeFindingCount: number;
  threadWithVolumeRiskCount: number;
  threadWithVolumeStrengthCount: number;
  volumeFindingCount: number;
  volumeRiskCount: number;
  volumeReviewPromptCount: number;
  volumeStrengthCount: number;
}

interface AnalyticsSessionStorySummary {
  greenToRedSessionCount: number;
  highTradeCountSessionCount: number;
  sameSymbolManyAttemptsSessionCount: number;
  sessionStoryCount: number;
  priority: {
    date: string;
    href: string;
    label: string;
    pnl: number;
    prompt: string;
    tradeCount: number;
  } | null;
}

function formatNumber(value: number | null, digits = 2): string {
  return typeof value === "number" ? value.toFixed(digits) : "n/a";
}

function formatSigned(value: number | null): string {
  if (typeof value !== "number") {
    return "n/a";
  }

  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}`;
}

function formatPercent(value: number | null): string {
  return typeof value === "number" ? `${(value * 100).toFixed(1)}%` : "n/a";
}

function toneForPnl(value: number): string {
  return value >= 0 ? "text-emerald-300" : "text-rose-300";
}

function visualRows(
  rows: Array<
    Pick<
      ProductTraderAnalyticsTradeRow,
      "grossRealizedPnl" | "sessionDate" | "symbol" | "tradeIndex"
    > & { tradeId?: string }
  >,
) {
  return rows.map((row) => ({
    id: row.tradeId ?? `${row.symbol}-${row.tradeIndex}`,
    label: `${row.symbol} #${row.tradeIndex}`,
    pnl: row.grossRealizedPnl,
    sessionDate: row.sessionDate,
    symbol: row.symbol,
  }));
}

function outcome(
  row: ProductTraderAnalyticsTradeRow,
): "winner" | "loser" | "flat" {
  return row.grossRealizedPnl > 0
    ? "winner"
    : row.grossRealizedPnl < 0
      ? "loser"
      : "flat";
}

function filteredRows(
  rows: ProductTraderAnalyticsTradeRow[],
  filters: TraderAnalyticsFilter,
): ProductTraderAnalyticsTradeRow[] {
  return rows.filter((row) => {
    if (filters.symbol && row.symbol !== filters.symbol) {
      return false;
    }

    if (
      filters.tradeDirection &&
      row.tradeDirection !== filters.tradeDirection
    ) {
      return false;
    }

    if (filters.sessionBucket && row.sessionBucket !== filters.sessionBucket) {
      return false;
    }

    if (
      filters.entryHourEt !== undefined &&
      (typeof row.entryHourEt === "number" ? row.entryHourEt : null) !==
        filters.entryHourEt
    ) {
      return false;
    }

    if (filters.outcome && outcome(row) !== filters.outcome) {
      return false;
    }

    if (
      filters.lifecycle &&
      (row.isOpenPosition ? "open" : "closed") !== filters.lifecycle
    ) {
      return false;
    }

    return true;
  });
}

function TimeOfDayPanel({
  report,
}: {
  report: ProductTraderAnalyticsViewModel["latestReport"]["report"];
}) {
  const bestSession =
    [...report.timeOfDay.entrySessionBuckets].sort(
      (left, right) => right.grossTotalRealizedPnl - left.grossTotalRealizedPnl,
    )[0] ?? null;
  const bestHour =
    [...report.timeOfDay.entryHoursEt].sort(
      (left, right) => right.grossTotalRealizedPnl - left.grossTotalRealizedPnl,
    )[0] ?? null;
  const cross = report.timeOfDay.crossSessionHolds;

  return (
    <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.45fr)]">
      <div className="border border-zinc-800 bg-zinc-950 p-4">
        <h2 className="text-sm font-semibold text-zinc-100">Time Of Day</h2>
        <div className="mt-1 text-sm text-zinc-500">Eastern Time</div>
        <div className="mt-3 grid gap-2 text-sm text-zinc-400">
          <div>{report.timeOfDay.entryInsight}</div>
          <div>{report.timeOfDay.holdInsight}</div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {report.timeOfDay.entrySessionBuckets.slice(0, 5).map((bucket) => (
            <div key={bucket.id} className="border-t border-zinc-900 py-3">
              <div className="text-xs uppercase tracking-wide text-zinc-500">
                {bucket.label}
              </div>
              <div
                className={`mt-2 font-mono text-lg ${toneForPnl(bucket.grossTotalRealizedPnl)}`}
              >
                {formatSigned(bucket.grossTotalRealizedPnl)}
              </div>
              <div className="mt-1 text-xs text-zinc-500">
                {bucket.tradeCount} trades /{" "}
                {formatPercent(bucket.grossWinRate)}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border border-zinc-800 bg-zinc-950 p-4">
        <h2 className="text-sm font-semibold text-zinc-100">Hour And Holds</h2>
        <div className="mt-4 grid gap-3">
          <div className="border-t border-zinc-900 py-3">
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Best Session
            </div>
            <div className="mt-1 text-sm text-zinc-300">
              {bestSession
                ? `${bestSession.label} / ${formatSigned(bestSession.grossTotalRealizedPnl)}`
                : "n/a"}
            </div>
          </div>
          <div className="border-t border-zinc-900 py-3">
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Best Hour
            </div>
            <div className="mt-1 text-sm text-zinc-300">
              {bestHour
                ? `${bestHour.label} / ${formatSigned(bestHour.grossTotalRealizedPnl)}`
                : "n/a"}
            </div>
          </div>
          <div className="border-t border-zinc-900 py-3 text-xs text-zinc-500">
            {cross.heldPremarketIntoOpenCount} pre-market to open /{" "}
            {cross.heldOpenIntoMiddayCount} open to midday /{" "}
            {cross.heldOvernightCount} overnight.
          </div>
          {report.timeOfDay.sampleSizeWarning ? (
            <div className="border-t border-zinc-900 py-3 text-xs text-amber-300">
              Small sample: use these as review prompts, not proof.
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function TickerStoryAnalyticsPanel({
  summary,
}: {
  summary: AnalyticsTickerStorySummary;
}) {
  const handoffs = [
    {
      count: summary.exitLevelFindingCount,
      detail: `${summary.exitLevelRiskCount} risk, ${summary.exitLevelStrengthCount} strength, ${summary.exitLevelReviewPromptCount} prompt`,
      href: "/trades?storyFilter=levels#ticker-stories",
      label: "Open support/resistance exit reviews",
      tone:
        summary.exitLevelRiskCount > 0
          ? "border-amber-500/30 bg-amber-500/10 text-amber-100"
          : summary.exitLevelStrengthCount > 0
            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
            : "border-sky-500/30 bg-sky-500/10 text-sky-100",
    },
    {
      count: summary.volumeFindingCount,
      detail: `${summary.volumeRiskCount} risk, ${summary.volumeStrengthCount} strength, ${summary.volumeReviewPromptCount} prompt`,
      href: "/trades?storyFilter=volume#ticker-stories",
      label: "Open volume comparison stories",
      tone:
        summary.volumeRiskCount > 0
          ? "border-amber-500/30 bg-amber-500/10 text-amber-100"
          : summary.volumeStrengthCount > 0
            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
            : "border-sky-500/30 bg-sky-500/10 text-sky-100",
    },
    {
      count: summary.protectedProfitBeforeFadeFindingCount,
      detail: `${summary.protectedProfitBeforeFadeThreadCount} ticker stor${summary.protectedProfitBeforeFadeThreadCount === 1 ? "y" : "ies"}`,
      href: "/trades?storyFilter=protected_profit#ticker-stories",
      label: "Open protected-profit stories",
      tone: "border-emerald-500/30 bg-emerald-500/10 text-emerald-100",
    },
    {
      count: summary.postExitFindingCount,
      detail: `${summary.postExitRiskCount} risk, ${summary.postExitStrengthCount} strength, ${summary.postExitReviewPromptCount} prompt`,
      href: "/trades?storyFilter=post_exit#ticker-stories",
      label: "Open after-exit review stories",
      tone:
        summary.postExitRiskCount > 0
          ? "border-amber-500/30 bg-amber-500/10 text-amber-100"
          : summary.postExitStrengthCount > 0
            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
            : "border-sky-500/30 bg-sky-500/10 text-sky-100",
    },
  ].filter((handoff) => handoff.count > 0);
  const certifiedRiskCount = summary.marketContextRiskCount;
  const certifiedStrengthCount = summary.marketContextStrengthCount;
  const reviewPromptCount = summary.marketContextReviewPromptCount;

  return (
    <section
      className="ti-panel p-5"
      data-testid="analytics-ticker-story-panel"
      id="analytics-ticker-stories"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-zinc-100">
            Ticker Story Analytics
          </h2>
          <div className="mt-1 max-w-3xl text-sm leading-6 text-zinc-500">
            Same-symbol re-entries are tracked separately from flat-to-flat P/L
            so you can see whether later attempts added profit, gave back
            profit, stayed open, or turned into swing exposure.
          </div>
        </div>
        <Link
          className="border border-sky-800 bg-sky-950/40 px-4 py-3 text-sm font-medium text-sky-100 transition hover:border-sky-400"
          href="/trades?view=ticker_stories#ticker-stories"
        >
          Open ticker stories
        </Link>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3 xl:grid-cols-5">
        <MetricCard
          label="Ticker Stories"
          value={String(summary.multiRoundTripThreadCount)}
          detail="Same-symbol same-day re-entry groups"
          tone="info"
        />
        <MetricCard
          label="Gave Back Profit"
          value={String(summary.givebackThreadCount)}
          detail="Later attempts reduced earlier gains"
          tone={summary.givebackThreadCount > 0 ? "warning" : "default"}
        />
        <MetricCard
          label="Repeated Losses"
          value={String(summary.repeatedLossThreadCount)}
          detail="Later same-symbol attempts stayed red"
          tone={summary.repeatedLossThreadCount > 0 ? "danger" : "default"}
        />
        <MetricCard
          label="Open Re-entries"
          value={String(summary.openReentryThreadCount)}
          detail="Need closing executions before full review"
          tone={summary.openReentryThreadCount > 0 ? "warning" : "default"}
        />
        <MetricCard
          label="Turned Swing"
          value={String(summary.swingThreadCount)}
          detail="Day-trade ideas held overnight"
          tone={summary.swingThreadCount > 0 ? "info" : "default"}
        />
      </div>
      <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="rounded-md border border-sky-900/60 bg-sky-950/20 p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-sky-300">
            How to read these stories
          </div>
          <div className="mt-2 text-sm leading-6 text-zinc-400">
            These are not extra trades. They group same-symbol re-entries so a
            trader can ask whether a later attempt protected profit, gave back
            profit, stayed open, or needs chart context before the lesson is
            written.
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <MetricCard
            label="Chart Risks"
            value={String(certifiedRiskCount)}
            detail="Certified risks to inspect before writing a rule"
            tone={certifiedRiskCount > 0 ? "warning" : "default"}
          />
          <MetricCard
            label="Chart Strengths"
            value={String(certifiedStrengthCount)}
            detail="Certified strengths worth repeating"
            tone={certifiedStrengthCount > 0 ? "success" : "default"}
          />
          <MetricCard
            label="Needs Review"
            value={String(reviewPromptCount)}
            detail="Chart prompts waiting for enough context"
            tone={reviewPromptCount > 0 ? "info" : "default"}
          />
        </div>
      </div>
      <div className="mt-3" id="analytics-chart-evidence">
        <AdvancedDisclosure
          summary="Show chart evidence counts"
          testId="analytics-ticker-story-evidence-counts"
        >
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <MetricCard
              label="Chart Findings"
              value={String(summary.marketContextFindingCount)}
              detail={`${summary.marketContextReviewPromptCount} prompt${summary.marketContextReviewPromptCount === 1 ? "" : "s"}, ${summary.levelFindingCount} level check${summary.levelFindingCount === 1 ? "" : "s"}`}
              tone={summary.marketContextFindingCount > 0 ? "info" : "default"}
            />
            <MetricCard
              label="Add Quality"
              value={String(summary.addQualityFindingCount)}
              detail={`${summary.addQualityRiskCount} risk, ${summary.addQualityStrengthCount} strength, ${summary.addQualityReviewPromptCount} prompt`}
              tone={
                summary.addQualityRiskCount > 0
                  ? "warning"
                  : summary.addQualityStrengthCount > 0
                    ? "success"
                    : summary.addQualityFindingCount > 0
                      ? "info"
                      : "default"
              }
            />
            <MetricCard
              label="Chart Risks"
              value={String(summary.marketContextRiskCount)}
              detail="Level, add, exit, or profit-protection risks"
              tone={summary.marketContextRiskCount > 0 ? "warning" : "default"}
            />
            <MetricCard
              label="Chart Strengths"
              value={String(summary.marketContextStrengthCount)}
              detail="Chart context strengths worth repeating"
              tone={
                summary.marketContextStrengthCount > 0 ? "success" : "default"
              }
            />
            <MetricCard
              label="After-Exit Review"
              value={String(summary.postExitFindingCount)}
              detail={`${summary.postExitRiskCount} risk, ${summary.postExitStrengthCount} strength, ${summary.postExitReviewPromptCount} prompt`}
              tone={
                summary.postExitRiskCount > 0
                  ? "warning"
                  : summary.postExitStrengthCount > 0
                    ? "success"
                    : summary.postExitFindingThreadCount > 0
                      ? "info"
                      : "default"
              }
            />
            <MetricCard
              label="Protected Profit"
              value={String(summary.protectedProfitBeforeFadeFindingCount)}
              detail={`${summary.protectedProfitBeforeFadeThreadCount} ticker stor${summary.protectedProfitBeforeFadeThreadCount === 1 ? "y" : "ies"}`}
              tone={
                summary.protectedProfitBeforeFadeFindingCount > 0
                  ? "success"
                  : "default"
              }
            />
            <MetricCard
              label="Support/Resistance Exits"
              value={String(summary.exitLevelFindingCount)}
              detail={`${summary.exitLevelRiskCount} risk, ${summary.exitLevelStrengthCount} strength, ${summary.exitLevelReviewPromptCount} prompt`}
              tone={
                summary.exitLevelRiskCount > 0
                  ? "warning"
                  : summary.exitLevelStrengthCount > 0
                    ? "success"
                    : summary.exitLevelFindingCount > 0
                      ? "info"
                      : "default"
              }
            />
            <MetricCard
              label="Volume Evidence"
              value={String(summary.volumeFindingCount)}
              detail={`${summary.volumeRiskCount} risk, ${summary.volumeStrengthCount} strength, ${summary.volumeReviewPromptCount} prompt`}
              tone={
                summary.volumeRiskCount > 0
                  ? "warning"
                  : summary.volumeStrengthCount > 0
                    ? "success"
                    : summary.volumeFindingCount > 0
                      ? "info"
                      : "default"
              }
            />
          </div>
        </AdvancedDisclosure>
      </div>
      {handoffs.length > 0 ? (
        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          {handoffs.map((handoff) => (
            <Link
              className={`border p-4 transition hover:border-sky-400 ${handoff.tone}`}
              href={handoff.href}
              key={handoff.label}
            >
              <div className="text-xs font-semibold uppercase tracking-wide opacity-80">
                What to open next
              </div>
              <div className="mt-2 text-sm font-semibold">{handoff.label}</div>
              <div className="mt-2 text-xs leading-5 opacity-80">
                {handoff.detail}
              </div>
            </Link>
          ))}
        </div>
      ) : null}
      {summary.priority ? (
        <div className="mt-4 border-t border-zinc-900 pt-4">
          <div className="text-xs uppercase tracking-wide text-zinc-500">
            Story to inspect next
          </div>
          <div className="mt-2 text-sm font-semibold text-zinc-100">
            {summary.priority.label} / {formatSigned(summary.priority.pnl)}
          </div>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-zinc-500">
            {summary.priority.question}
          </p>
          <Link
            className="mt-3 inline-flex text-sm text-sky-300 hover:text-sky-200"
            href={summary.priority.href}
          >
            Open this ticker story
          </Link>
        </div>
      ) : (
        <div className="mt-4 border-t border-zinc-900 pt-4 text-sm text-zinc-500">
          No same-symbol re-entry stories yet.
        </div>
      )}
    </section>
  );
}

function SessionStoryAnalyticsPanel({
  summary,
}: {
  summary: AnalyticsSessionStorySummary;
}) {
  return (
    <section
      className="ti-panel p-5"
      data-testid="analytics-session-story-panel"
      id="analytics-session-stories"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-zinc-100">
            Session Story Analytics
          </h2>
          <div className="mt-1 max-w-3xl text-sm leading-6 text-zinc-500">
            Session stories look across all saved trades from one trading day.
            They catch green-to-red days, many attempts on one ticker, high
            trade-count sessions, and open or overnight exposure.
          </div>
        </div>
        <Link
          className="border border-sky-800 bg-sky-950/40 px-4 py-3 text-sm font-medium text-sky-100 transition hover:border-sky-400"
          href="/coach#session-story-coach"
        >
          Open session coach
        </Link>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <MetricCard
          label="Sessions Reviewed"
          value={String(summary.sessionStoryCount)}
          detail="Trading days with saved execution data"
          tone="info"
        />
        <MetricCard
          label="Green To Red"
          value={String(summary.greenToRedSessionCount)}
          detail="Session was positive before finishing red"
          tone={summary.greenToRedSessionCount > 0 ? "danger" : "default"}
        />
        <MetricCard
          label="Many Ticker Attempts"
          value={String(summary.sameSymbolManyAttemptsSessionCount)}
          detail="One ticker was traded repeatedly"
          tone={
            summary.sameSymbolManyAttemptsSessionCount > 0
              ? "warning"
              : "default"
          }
        />
        <MetricCard
          label="High Trade Count"
          value={String(summary.highTradeCountSessionCount)}
          detail="Many round trips or symbols in one session"
          tone={summary.highTradeCountSessionCount > 0 ? "warning" : "default"}
        />
      </div>
      {summary.priority ? (
        <div className="mt-4 border-t border-zinc-900 pt-4">
          <div className="text-xs uppercase tracking-wide text-zinc-500">
            Session to inspect next
          </div>
          <div className="mt-2 text-sm font-semibold text-zinc-100">
            {summary.priority.date} / {summary.priority.label} /{" "}
            {formatSigned(summary.priority.pnl)}
          </div>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-zinc-500">
            {summary.priority.prompt}
          </p>
          <Link
            className="mt-3 inline-flex text-sm text-sky-300 hover:text-sky-200"
            href={summary.priority.href}
          >
            Open the main ticker story from this session
          </Link>
        </div>
      ) : (
        <div className="mt-4 border-t border-zinc-900 pt-4 text-sm text-zinc-500">
          Save a broker CSV to build session stories from your own trades.
        </div>
      )}
    </section>
  );
}

function AnalyticsStoryPanel({
  showSecondaryCharts = true,
  viewModel,
  savedReviewQueue,
}: {
  showSecondaryCharts?: boolean;
  viewModel: ProductTraderAnalyticsViewModel;
  savedReviewQueue?: SavedReviewQueueReadModel | null;
}) {
  const report = viewModel.latestReport.report;
  const charts = report.charts;
  const bestTrade =
    [...report.trades].sort(
      (left, right) => right.grossRealizedPnl - left.grossRealizedPnl,
    )[0] ?? null;
  const worstTrade =
    [...report.trades].sort(
      (left, right) => left.grossRealizedPnl - right.grossRealizedPnl,
    )[0] ?? null;
  const nextReview =
    savedReviewQueue?.items[0] ?? savedReviewQueue?.allItems[0] ?? null;
  const topRisk = report.topRisks[0] ?? null;
  const topStrength = report.topStrengths[0] ?? null;
  const tradeVisualRows = visualRows(report.trades);

  return (
    <section
      className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.65fr)]"
      data-testid="analytics-story-panel"
      id="analytics-results"
    >
      <div className="ti-panel p-5">
        <p className="text-xs font-semibold uppercase text-emerald-400">
          Analytics Overview
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-zinc-50">
          What happened in this trade set?
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
          Read the account like a trading screen: green is progress, red is
          cost, and the next review should explain the biggest behavior behind
          the move.
        </p>
        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_260px]">
          <EquityCurveChart
            formatter={formatSigned}
            rows={tradeVisualRows}
            subtitle={`${report.sampleSize.completedTradeCount} completed trades, gross execution P/L`}
            title="Gross P/L Curve"
          />
          <OutcomeDonut
            flat={report.pnl.grossFlatCount}
            losses={report.pnl.grossLoserCount}
            wins={report.pnl.grossWinnerCount}
          />
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="ti-panel-soft p-4">
            <div className="text-xs uppercase text-zinc-500">Gross Result</div>
            <div
              className={`mt-2 font-mono text-2xl font-semibold ${toneForPnl(report.pnl.grossTotalRealizedPnl)}`}
            >
              {formatSigned(report.pnl.grossTotalRealizedPnl)}
            </div>
            <div className="mt-1 text-xs text-zinc-500">
              {report.sampleSize.completedTradeCount} completed trades
            </div>
          </div>
          <div className="ti-panel-soft p-4">
            <div className="text-xs uppercase text-zinc-500">Best Trade</div>
            <div className="mt-2 text-sm font-semibold text-emerald-300">
              {bestTrade
                ? `${bestTrade.symbol} ${formatSigned(bestTrade.grossRealizedPnl)}`
                : "No winner yet"}
            </div>
            <div className="mt-1 text-xs text-zinc-500">
              strongest green result
            </div>
          </div>
          <div className="ti-panel-soft p-4">
            <div className="text-xs uppercase text-zinc-500">Worst Trade</div>
            <div className="mt-2 text-sm font-semibold text-rose-300">
              {worstTrade
                ? `${worstTrade.symbol} ${formatSigned(worstTrade.grossRealizedPnl)}`
                : "No loser yet"}
            </div>
            <div className="mt-1 text-xs text-zinc-500">biggest red cost</div>
          </div>
          <div className="ti-panel-soft p-4">
            <div className="text-xs uppercase text-zinc-500">Review First</div>
            <div className="mt-2 text-sm font-semibold text-zinc-100">
              {nextReview ? nextReview.title : "Save an import"}
            </div>
            <div className="mt-1 text-xs leading-5 text-zinc-500">
              {nextReview
                ? nextReview.nextAction
                : "Import one broker CSV to replace the sample analytics."}
            </div>
            <Link
              className="mt-3 inline-block text-sm text-sky-300 hover:text-sky-200"
              href={nextReview?.href ?? "/import-dry-run"}
            >
              {nextReview ? "Open Trade Review" : "Import trades"}
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        <TradeOutcomeTape
          formatter={formatSigned}
          rows={tradeVisualRows}
          title="Latest Trade Results"
        />
        <SimpleBarChart
          chart={charts.entrySessionPerformance}
          formatter={formatSigned}
          maxItems={5}
          title="P/L by Session"
        />
      </div>

      {showSecondaryCharts ? (
        <>
          <div className="grid gap-4 xl:col-span-2 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
            <PnlCalendarGrid
              formatter={formatSigned}
              rows={tradeVisualRows}
              title="Daily P/L Calendar"
            />
            <SimpleBarChart
              chart={charts.grossPnlByTrade}
              formatter={formatSigned}
              maxItems={8}
              title="P/L by Trade"
            />
          </div>
          <div className="grid gap-4 xl:col-span-2 xl:grid-cols-3">
            <MixBar chart={charts.winLossDonut} title="Outcome Mix" />
            <SimpleBarChart
              chart={charts.entryHourPerformance}
              formatter={formatSigned}
              maxItems={8}
              title="P/L by Entry Hour"
            />
            <SimpleBarChart
              chart={charts.behaviorRiskRates}
              formatter={(value) => String(value)}
              maxItems={5}
              title="Execution Habits To Review"
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:col-span-2">
            <div className="ti-panel p-5">
              <div className="text-xs uppercase text-zinc-500">
                Biggest Risk
              </div>
              <div className="mt-2 text-lg font-semibold text-rose-300">
                {topRisk?.label ?? "No repeated risk yet"}
              </div>
              <div className="mt-2 text-sm text-zinc-400">
                {topRisk
                  ? `${topRisk.count} occurrence(s). Review the red cost before adding new rules.`
                  : "Save more closed trades to see repeated behavior cost."}
              </div>
            </div>
            <div className="ti-panel p-5">
              <div className="text-xs uppercase text-zinc-500">
                Best Strength
              </div>
              <div className="mt-2 text-lg font-semibold text-emerald-300">
                {topStrength?.label ?? "No repeated strength yet"}
              </div>
              <div className="mt-2 text-sm text-zinc-400">
                {topStrength
                  ? `${topStrength.count} occurrence(s). This is the green behavior to repeat.`
                  : "Save more closed trades to see repeated strengths."}
              </div>
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
}

function ChartLegendStrip() {
  return (
    <div className="grid gap-3 text-sm md:grid-cols-3">
      {[
        {
          label: "Green",
          body: "Profit, strength, or a behavior worth repeating.",
          className: "border-emerald-900/70 bg-emerald-950/30 text-emerald-200",
        },
        {
          label: "Red",
          body: "Loss, risk, giveback, or a behavior to review first.",
          className: "border-rose-900/70 bg-rose-950/30 text-rose-200",
        },
        {
          label: "Amber",
          body: "Caution, incomplete context, or a review prompt.",
          className: "border-amber-900/70 bg-amber-950/30 text-amber-200",
        },
      ].map((item) => (
        <div
          className={`rounded-md border p-3 ${item.className}`}
          key={item.label}
        >
          <div className="text-xs font-semibold uppercase tracking-wide">
            {item.label}
          </div>
          <div className="mt-1 text-xs leading-5 text-zinc-300">
            {item.body}
          </div>
        </div>
      ))}
    </div>
  );
}

function ChartSectionFrame({
  actionLabel,
  body,
  children,
  eyebrow,
  onAction,
  title,
}: {
  actionLabel?: string;
  body: ReactNode;
  children: ReactNode;
  eyebrow: string;
  onAction?: () => void;
  title: string;
}) {
  return (
    <section className="ti-panel p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-sky-300">
            {eyebrow}
          </p>
          <h2 className="mt-2 text-xl font-semibold text-zinc-50">{title}</h2>
          <div className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
            {body}
          </div>
        </div>
        {actionLabel && onAction ? (
          <button
            className="inline-flex items-center justify-center rounded-md border border-sky-800 bg-sky-950/40 px-4 py-3 text-sm font-medium text-sky-100 transition hover:border-sky-400"
            onClick={onAction}
            type="button"
          >
            {actionLabel}
          </button>
        ) : null}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function AnalyticsChartGalleryPanel({
  onOpenTrades,
  viewModel,
}: {
  onOpenTrades: () => void;
  viewModel: ProductTraderAnalyticsViewModel;
}) {
  const report = viewModel.latestReport.report;
  const charts = report.charts;
  const tradeVisualRows = visualRows(report.trades);
  const topRisk = report.topRisks[0] ?? null;
  const topStrength = report.topStrengths[0] ?? null;

  return (
    <div className="grid gap-6">
      <section className="ti-panel p-5" id="chart-workbench">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-sky-300">
              Chart Workbench
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-zinc-50">
              Stats and graphs, grouped by question
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
              Start with outcome, then timing, then behavior. If a number needs
              investigation, open the trade explorer or the review queue instead
              of treating the chart as the final answer.
            </p>
          </div>
          <div className="rounded-md border border-zinc-700 bg-slate-900/70 px-3 py-2 font-mono text-sm text-zinc-300">
            {report.sampleSize.completedTradeCount} trades
          </div>
        </div>
        <div className="mt-5">
          <ChartLegendStrip />
        </div>
      </section>

      <WorkflowHandoffPanel
        body="Use this flow when a chart catches your eye: inspect the chart, open the trades behind it, write the review, then check whether the coach focus changes."
        eyebrow="Chart Workflow"
        items={[
          {
            action: "Stay in charts",
            body: "Find the trades behind the chart bar, session, hour, or behavior.",
            href: "#chart-workbench",
            label: "1. Inspect",
            title: "Find trades behind a number",
          },
          {
            action: "Open review",
            body: "Turn the chart into a written trade review instead of just a statistic.",
            href: "/review?queue=highest_priority",
            label: "2. Review",
            title: "Open the review queue",
            tone: "warning",
          },
          {
            action: "Open coach",
            body: "See whether the same behavior becomes the current coaching focus.",
            href: "/coach#next-action",
            label: "3. Coach",
            title: "Compare against the focus",
            tone: "success",
          },
          {
            action: "Check progress",
            body: "Use progress only after reviews are written and tracked.",
            href: "/progress#progress-follow-through",
            label: "4. Track",
            title: "Measure follow-through",
          },
        ]}
        testId="analytics-chart-workflow"
        title="Charts should lead to a review, not stop at a number."
      />

      <ChartSectionFrame
        actionLabel="Open trade explorer"
        body="These charts answer whether the saved trade set made or lost money and which individual trades moved the result the most."
        eyebrow="Outcome"
        onAction={onOpenTrades}
        title="Where did the P/L come from?"
      >
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
          <PnlCalendarGrid
            formatter={formatSigned}
            rows={tradeVisualRows}
            title="Daily P/L Calendar"
          />
          <SimpleBarChart
            chart={charts.grossPnlByTrade}
            formatter={formatSigned}
            maxItems={12}
            title="P/L by Trade"
          />
        </div>
        <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <MixBar chart={charts.winLossDonut} title="Outcome Mix" />
          <div className="grid gap-4 md:grid-cols-2">
            <div className="ti-panel-soft p-5">
              <div className="text-xs uppercase text-zinc-500">
                Biggest Risk
              </div>
              <div className="mt-2 text-lg font-semibold text-rose-300">
                {topRisk?.label ?? "No repeated risk yet"}
              </div>
              <div className="mt-2 text-sm leading-6 text-zinc-400">
                {topRisk
                  ? `${topRisk.count} occurrence(s). Open the related trades before writing a new rule.`
                  : "No repeated red behavior is showing in this report."}
              </div>
            </div>
            <div className="ti-panel-soft p-5">
              <div className="text-xs uppercase text-zinc-500">
                Best Strength
              </div>
              <div className="mt-2 text-lg font-semibold text-emerald-300">
                {topStrength?.label ?? "No repeated strength yet"}
              </div>
              <div className="mt-2 text-sm leading-6 text-zinc-400">
                {topStrength
                  ? `${topStrength.count} occurrence(s). This is the green behavior to preserve.`
                  : "No repeated green behavior is showing in this report."}
              </div>
            </div>
          </div>
        </div>
      </ChartSectionFrame>

      <ChartSectionFrame
        actionLabel="Open trade explorer"
        body="Timing charts show whether the same results cluster around premarket, the open, midday, late day, or specific entry hours."
        eyebrow="Timing"
        onAction={onOpenTrades}
        title="When did the results happen?"
      >
        <div className="grid gap-4 xl:grid-cols-2">
          <SimpleBarChart
            chart={charts.entrySessionPerformance}
            formatter={formatSigned}
            maxItems={8}
            title="P/L by Session"
          />
          <SimpleBarChart
            chart={charts.entryHourPerformance}
            formatter={formatSigned}
            maxItems={10}
            title="P/L by Entry Hour"
          />
        </div>
        <div className="mt-4">
          <TimeOfDayPanel report={report} />
        </div>
      </ChartSectionFrame>

      <ChartSectionFrame
        actionLabel="Find trades behind this"
        body="Behavior charts are review prompts. A red bar should send you to the evidence trades; a green pattern should be checked before you try to preserve it."
        eyebrow="Behavior"
        onAction={onOpenTrades}
        title="Which execution habits need review?"
      >
        <div className="grid gap-4 xl:grid-cols-[minmax(320px,0.8fr)_minmax(0,1.2fr)]">
          <SimpleBarChart
            chart={charts.behaviorRiskRates}
            formatter={(value) => String(value)}
            maxItems={8}
            title="Execution Habits To Review"
          />
          <div className="ti-panel-soft p-5">
            <h3 className="text-sm font-semibold text-zinc-100">
              How to use this section
            </h3>
            <div className="mt-3 grid gap-3 text-sm leading-6 text-zinc-400">
              <p>
                Red behavior means the app found repeated execution evidence
                worth reviewing. It does not tell you what to trade next.
              </p>
              <p>
                If chart context is needed, open the review item and check
                whether support, resistance, volume, and after-exit movement are
                actually available.
              </p>
              <button
                className="mt-1 w-fit rounded-md border border-sky-800 bg-sky-950/40 px-4 py-2 text-sm font-medium text-sky-100 transition hover:border-sky-400"
                onClick={onOpenTrades}
                type="button"
              >
                Find trades behind this
              </button>
            </div>
          </div>
        </div>
      </ChartSectionFrame>
    </div>
  );
}

function StorageReadinessPanel({
  readiness,
}: {
  readiness: TraderAnalyticsStorageReadiness;
}) {
  return (
    <section className="border border-zinc-800 bg-zinc-950 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-zinc-100">
            Storage Status
          </h2>
          <div className="mt-1 text-sm text-zinc-500">{readiness.label}</div>
        </div>
        <div
          className={`font-mono text-xs ${
            readiness.readyForProductionPersistence
              ? "text-emerald-300"
              : "text-amber-300"
          }`}
        >
          {readiness.blockerCount} blockers
        </div>
      </div>
      <div className="mt-4 grid gap-2">
        {readiness.checks.map((check) => (
          <div
            key={check.id}
            className="flex items-center justify-between gap-3 border-t border-zinc-900 py-2"
          >
            <span className="text-xs text-zinc-400">{check.label}</span>
            <span
              className={`font-mono text-xs ${
                check.passed ? "text-emerald-300" : "text-amber-300"
              }`}
            >
              {check.passed ? "pass" : "needed"}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-3 text-xs text-zinc-500">{readiness.nextAction}</div>
    </section>
  );
}

function WeeklyReviewPanel({
  weeklyReview,
}: {
  weeklyReview: TraderWeeklyReviewDashboard;
}) {
  return (
    <section className="border border-zinc-800 bg-zinc-950 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-zinc-100">Weekly Review</h2>
          <div className="mt-1 text-sm text-zinc-500">{weeklyReview.label}</div>
        </div>
        <div
          className={`font-mono text-xl ${toneForPnl(weeklyReview.grossTotalRealizedPnl)}`}
        >
          {formatSigned(weeklyReview.grossTotalRealizedPnl)}
        </div>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <div className="border-t border-zinc-900 py-3">
          <div className="text-xs uppercase tracking-wide text-zinc-500">
            Trades
          </div>
          <div className="mt-2 text-xl font-semibold text-zinc-100">
            {weeklyReview.completedTradeCount}
          </div>
        </div>
        <div className="border-t border-zinc-900 py-3">
          <div className="text-xs uppercase tracking-wide text-zinc-500">
            Top Risk
          </div>
          <div className="mt-2 text-sm text-amber-300">
            {weeklyReview.topRiskLabel ?? "None"}
          </div>
        </div>
        <div className="border-t border-zinc-900 py-3">
          <div className="text-xs uppercase tracking-wide text-zinc-500">
            Top Strength
          </div>
          <div className="mt-2 text-sm text-emerald-300">
            {weeklyReview.topStrengthLabel ?? "None"}
          </div>
        </div>
        <div className="border-t border-zinc-900 py-3">
          <div className="text-xs uppercase tracking-wide text-zinc-500">
            Rule Violations
          </div>
          <div className="mt-2 text-xl font-semibold text-zinc-100">
            {weeklyReview.ruleViolationCount}
          </div>
        </div>
      </div>
      <div className="mt-3 border-t border-zinc-900 pt-3 text-sm text-zinc-400">
        {weeklyReview.primaryFocusTitle ?? "No primary focus yet."}
      </div>
    </section>
  );
}

function ImportInboxPanel({ inbox }: { inbox: SavedTradeImportInbox }) {
  return (
    <section className="border border-zinc-800 bg-zinc-950 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-zinc-100">
            Import Review Inbox
          </h2>
          <div className="mt-1 text-sm text-zinc-500">{inbox.batchId}</div>
        </div>
        <div className="grid grid-cols-3 gap-3 text-right font-mono text-xs">
          <span className="text-emerald-300">{inbox.readyCount} ready</span>
          <span className="text-amber-300">
            {inbox.needsReviewCount} review
          </span>
          <span className="text-rose-300">{inbox.rejectedCount} reject</span>
        </div>
      </div>
      <div className="mt-4 grid gap-2">
        {inbox.items.slice(0, 5).map((item) => (
          <div
            key={item.id}
            className="grid gap-2 border-t border-zinc-900 py-2 md:grid-cols-[80px_120px_1fr_140px]"
          >
            <div className="font-mono text-xs text-zinc-500">
              #{item.requestIndex + 1}
            </div>
            <div className="text-sm text-zinc-200">
              {item.symbol ?? "Unknown"}
            </div>
            <div className="text-xs text-zinc-500">
              {item.messages[0] ?? "Ready for saved analytics."}
            </div>
            <div
              className={`text-xs ${
                item.status === "ready_to_save"
                  ? "text-emerald-300"
                  : item.status === "needs_review"
                    ? "text-amber-300"
                    : "text-rose-300"
              }`}
            >
              {item.primaryAction}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function SnapshotPanel({
  snapshots,
}: {
  snapshots: SavedReportSnapshotCard[];
}) {
  return (
    <section className="border border-zinc-800 bg-zinc-950 p-4">
      <h2 className="text-sm font-semibold text-zinc-100">Saved Snapshots</h2>
      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        {snapshots.slice(0, 6).map((snapshot) => (
          <div key={snapshot.id} className="border-t border-zinc-900 py-3">
            <div className="flex items-center justify-between gap-3">
              <span className="font-medium text-zinc-100">
                {snapshot.label}
              </span>
              <span
                className={`font-mono text-xs ${toneForPnl(snapshot.grossTotalRealizedPnl)}`}
              >
                {formatSigned(snapshot.grossTotalRealizedPnl)}
              </span>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-zinc-500">
              <span>{snapshot.completedTradeCount} trades</span>
              <span>{formatPercent(snapshot.grossWinRate)}</span>
              <span>{snapshot.noteCount} notes</span>
            </div>
            <div className="mt-2 text-xs text-zinc-500">
              {snapshot.generatedAt}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function BehaviorStreaksPanel({
  streaks,
}: {
  streaks: TraderBehaviorStreak[];
}) {
  const max = Math.max(...streaks.map((streak) => streak.currentCount), 1);

  return (
    <section className="border border-zinc-800 bg-zinc-950 p-4">
      <h2 className="text-sm font-semibold text-zinc-100">Behavior Streaks</h2>
      <div className="mt-4 grid gap-3">
        {streaks.map((streak) => (
          <div key={streak.id} className="border-t border-zinc-900 py-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-zinc-300">{streak.label}</span>
              <span className="font-mono text-sm text-zinc-100">
                {streak.currentCount}
              </span>
            </div>
            <div className="mt-2 h-2 bg-zinc-900">
              <div
                className={`h-2 ${
                  streak.status === "active" ? "bg-emerald-400" : "bg-zinc-700"
                }`}
                style={{
                  width: `${Math.max((streak.currentCount / max) * 100, 4)}%`,
                }}
              />
            </div>
            <div className="mt-2 text-xs text-zinc-500">{streak.summary}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function JournalPromptsPanel({ prompts }: { prompts: TraderJournalPrompt[] }) {
  return (
    <section className="border border-zinc-800 bg-zinc-950 p-4">
      <h2 className="text-sm font-semibold text-zinc-100">Journal Prompts</h2>
      <div className="mt-4 grid gap-3">
        {prompts.map((prompt) => (
          <div key={prompt.id} className="border-t border-zinc-900 py-3">
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              {prompt.label}
            </div>
            <div className="mt-2 text-sm text-zinc-300">{prompt.prompt}</div>
            <div className="mt-2 font-mono text-xs text-zinc-500">
              {prompt.relatedTradeIds.length} linked trades
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function RuleCompliancePanel({
  summary,
}: {
  summary: TraderRuleComplianceSummary;
}) {
  return (
    <div className="border-t border-zinc-900 py-3">
      <div className="grid gap-3 md:grid-cols-4">
        <div>
          <div className="text-xs uppercase tracking-wide text-zinc-500">
            Passing Rules
          </div>
          <div className="mt-2 text-xl font-semibold text-emerald-300">
            {summary.passingRules}
          </div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide text-zinc-500">
            Violated Rules
          </div>
          <div className="mt-2 text-xl font-semibold text-amber-300">
            {summary.violatedRules}
          </div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide text-zinc-500">
            Violations
          </div>
          <div className="mt-2 text-xl font-semibold text-zinc-100">
            {summary.totalViolations}
          </div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide text-zinc-500">
            Worst Rule
          </div>
          <div className="mt-2 text-sm text-zinc-300">
            {summary.worstViolation?.label ?? "None"}
          </div>
        </div>
      </div>
      <div className="mt-3 text-sm text-zinc-500">{summary.summary}</div>
    </div>
  );
}

function MarketContextPanel({
  status,
}: {
  status: TraderMarketContextAddOnStatus;
}) {
  return (
    <section className="border border-zinc-800 bg-zinc-950 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-zinc-100">
            Chart Data Status
          </h2>
          <div className="mt-1 text-sm text-zinc-500">
            {status.calibrationStatus}
          </div>
        </div>
        <div className="font-mono text-xs text-sky-300">
          {status.usedForExecutionAnalytics ? "active" : "separate"}
        </div>
      </div>
      <div className="mt-4 text-sm text-zinc-400">{status.summary}</div>
      <div className="mt-4 grid gap-2 md:grid-cols-3">
        {status.sources.map((source) => (
          <div
            key={source}
            className="border-t border-zinc-900 py-2 text-xs text-zinc-500"
          >
            {source}
          </div>
        ))}
      </div>
      <div className="mt-3 text-xs text-zinc-500">{status.nextAction}</div>
    </section>
  );
}

function ProductizationPanel({
  productization,
}: {
  productization: TraderAnalyticsProductizationViewModel;
}) {
  const workspace = productization.workspace;
  const permissions = productization.permissionSummary;

  return (
    <section className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
      <div className="border border-zinc-800 bg-zinc-950 p-4">
        <h2 className="text-sm font-semibold text-zinc-100">Workspace Scope</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="border-t border-zinc-900 py-3">
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Workspace
            </div>
            <div className="mt-2 text-sm text-zinc-200">
              {workspace.workspaceName}
            </div>
          </div>
          <div className="border-t border-zinc-900 py-3">
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Account
            </div>
            <div className="mt-2 text-sm text-zinc-200">
              {workspace.activeAccountLabel}
            </div>
          </div>
          <div className="border-t border-zinc-900 py-3">
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Role
            </div>
            <div className="mt-2 text-sm text-zinc-200">
              {workspace.userRole}
            </div>
          </div>
          <div className="border-t border-zinc-900 py-3">
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Mode
            </div>
            <div className="mt-2 text-sm text-amber-300">
              {workspace.persistenceMode}
            </div>
          </div>
        </div>
        <div className="mt-3 text-xs text-zinc-500">{workspace.nextAction}</div>
      </div>

      <div className="border border-zinc-800 bg-zinc-950 p-4">
        <h2 className="text-sm font-semibold text-zinc-100">
          Permission Split
        </h2>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <div className="border-t border-zinc-900 py-3">
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Product
            </div>
            <div className="mt-2 text-xl font-semibold text-zinc-100">
              {permissions.productionRouteCount}
            </div>
          </div>
          <div className="border-t border-zinc-900 py-3">
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Admin
            </div>
            <div className="mt-2 text-xl font-semibold text-zinc-100">
              {permissions.adminDebugRouteCount}
            </div>
          </div>
          <div className="border-t border-zinc-900 py-3">
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Export
            </div>
            <div className="mt-2 text-sm text-emerald-300">
              {permissions.endUserExportAllowed ? "allowed" : "blocked"}
            </div>
          </div>
          <div className="border-t border-zinc-900 py-3">
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Raw JSON
            </div>
            <div className="mt-2 text-sm text-emerald-300">
              {permissions.rawJsonRestrictedToAdmin ? "admin only" : "review"}
            </div>
          </div>
        </div>
        <div className="mt-3 text-xs text-zinc-500">
          {permissions.issues.length === 0
            ? "No production route permission issues detected."
            : permissions.issues[0]}
        </div>
      </div>
    </section>
  );
}

function IntelligencePanel({
  intelligence,
}: {
  intelligence: TraderProductIntelligenceViewModel;
}) {
  const topCost = intelligence.mistakeCostEstimates.topCostDriver;
  const overall = intelligence.scorecard.dimensions.find(
    (dimension) => dimension.id === "overall",
  );

  return (
    <section className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
      <div className="border border-zinc-800 bg-zinc-950 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-zinc-100">
              Execution Score Trend
            </h2>
            <div className="mt-1 text-sm text-zinc-500">
              {intelligence.scorecard.summary}
            </div>
          </div>
          <div className="font-mono text-2xl text-sky-300">
            {overall?.score ?? 0}/100
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {intelligence.scorecard.dimensions
            .filter((dimension) => dimension.id !== "overall")
            .map((dimension) => (
              <div key={dimension.id} className="border-t border-zinc-900 py-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-zinc-300">
                    {dimension.label}
                  </span>
                  <span className="font-mono text-xs text-zinc-500">
                    {dimension.score}/100
                  </span>
                </div>
                <div className="mt-2 h-1.5 bg-zinc-900">
                  <div
                    className="h-1.5 bg-sky-400"
                    style={{ width: `${dimension.score}%` }}
                  />
                </div>
              </div>
            ))}
        </div>
      </div>

      <div className="border border-zinc-800 bg-zinc-950 p-4">
        <h2 className="text-sm font-semibold text-zinc-100">
          Mistake Cost Estimate
        </h2>
        <div className="mt-4 font-mono text-2xl text-rose-300">
          $
          {intelligence.mistakeCostEstimates.totalEstimatedGrossCost.toFixed(2)}
        </div>
        <div className="mt-2 text-sm text-zinc-500">
          {topCost
            ? `${topCost.label}: $${topCost.estimatedGrossCost.toFixed(2)} across ${topCost.affectedTradeCount} trades.`
            : "No repeated gross-loss cost driver is visible yet."}
        </div>
        <div className="mt-4 grid gap-2">
          {intelligence.mistakeCostEstimates.items.slice(0, 3).map((item) => (
            <div
              key={item.taxonomyId}
              className="flex items-center justify-between gap-3 border-t border-zinc-900 py-2"
            >
              <span className="text-xs text-zinc-400">{item.label}</span>
              <span className="font-mono text-xs text-zinc-500">
                ${item.estimatedGrossCost.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="border border-zinc-800 bg-zinc-950 p-4 xl:col-span-2">
        <div className="grid gap-6 xl:grid-cols-3">
          <div>
            <h2 className="text-sm font-semibold text-zinc-100">
              Recurrence Alerts
            </h2>
            <div className="mt-4 grid gap-3">
              {intelligence.recurrenceAlerts.slice(0, 4).map((alert) => (
                <div key={alert.id} className="border-t border-zinc-900 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-zinc-300">{alert.title}</span>
                    <span className="font-mono text-xs text-zinc-500">
                      {alert.occurrenceCount}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-zinc-500">
                    {alert.detail}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-zinc-100">
              Rule Builder
            </h2>
            <div className="mt-4 grid gap-3">
              {intelligence.ruleBuilderRecommendations
                .slice(0, 4)
                .map((item) => (
                  <div key={item.id} className="border-t border-zinc-900 py-3">
                    <div className="text-sm text-zinc-300">{item.label}</div>
                    <div className="mt-1 text-xs text-zinc-500">
                      {item.reason}
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-zinc-100">
              Unified Review Queue
            </h2>
            <div className="mt-4 grid gap-3">
              {intelligence.unifiedReviewQueue.items.slice(0, 5).map((item) => (
                <div key={item.id} className="border-t border-zinc-900 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-zinc-300">{item.title}</span>
                    <span className="text-xs uppercase tracking-wide text-zinc-500">
                      {item.lane}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-zinc-500">
                    {item.nextAction}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function visualToneClass(tone: string): string {
  switch (tone) {
    case "positive":
      return "bg-emerald-400 text-emerald-300";
    case "negative":
      return "bg-rose-400 text-rose-300";
    case "warning":
      return "bg-amber-400 text-amber-300";
    case "info":
      return "bg-sky-400 text-sky-300";
    default:
      return "bg-zinc-500 text-zinc-300";
  }
}

function MiniVisual({
  visual,
  maxItems = 5,
}: {
  visual: TraderImprovementVisual;
  maxItems?: number;
}) {
  const max = Math.max(...visual.items.map((item) => item.value), 1);

  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
        {visual.title}
      </h3>
      <div className="mt-3 grid gap-2">
        {visual.items.slice(0, maxItems).map((item) => {
          const tone = visualToneClass(item.tone);

          return (
            <div key={item.id} className="border-t border-zinc-900 py-2">
              <div className="flex items-center justify-between gap-3">
                <span className="truncate text-xs text-zinc-300">
                  {item.label}
                </span>
                <span className={`font-mono text-xs ${tone.split(" ")[1]}`}>
                  {item.value.toFixed(item.value % 1 === 0 ? 0 : 1)}
                </span>
              </div>
              <div className="mt-2 h-1.5 bg-zinc-900">
                <div
                  className={`h-1.5 ${tone.split(" ")[0]}`}
                  style={{
                    width: `${Math.max((item.value / max) * 100, 4)}%`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ImprovementIntelligencePanel({
  improvement,
}: {
  improvement: TraderImprovementIntelligence;
}) {
  const coach = improvement.dailyCoachReport;
  const patterns = improvement.bestWorstPatterns;

  return (
    <section className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.9fr)]">
      <div className="border border-zinc-800 bg-zinc-950 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-zinc-100">
              Daily Coach Report
            </h2>
            <div className="mt-1 text-sm text-zinc-500">
              {coach.sessionDate} / execution-only conclusions
            </div>
          </div>
          <div className="font-mono text-sm text-sky-300">
            {coach.tradeCount} trades
          </div>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="border-t border-zinc-900 py-3">
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Fix Next Session
            </div>
            <div className="mt-2 text-sm text-amber-200">
              {coach.fixNextSession}
            </div>
          </div>
          <div className="border-t border-zinc-900 py-3">
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Preserve
            </div>
            <div className="mt-2 text-sm text-emerald-200">
              {coach.preserveNextSession}
            </div>
          </div>
          <div className="border-t border-zinc-900 py-3 md:col-span-2">
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Session Timing
            </div>
            <div className="mt-2 text-sm text-sky-200">
              {coach.sessionTimeInsight}
            </div>
          </div>
          <div className="border-t border-zinc-900 py-3">
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Best Trade
            </div>
            <div className="mt-2 text-sm text-zinc-300">
              {coach.bestTrade ? (
                <Link
                  className="text-sky-300 hover:text-sky-200"
                  href={withPageAnchor(
                    `/trades/${encodeURIComponent(coach.bestTrade.tradeId)}`,
                    "summary",
                  )}
                >
                  {coach.bestTrade.symbol} /{" "}
                  {formatSigned(coach.bestTrade.grossRealizedPnl)}
                </Link>
              ) : (
                "n/a"
              )}
            </div>
          </div>
          <div className="border-t border-zinc-900 py-3">
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Worst Trade
            </div>
            <div className="mt-2 text-sm text-zinc-300">
              {coach.worstTrade ? (
                <Link
                  className="text-sky-300 hover:text-sky-200"
                  href={withPageAnchor(
                    `/trades/${encodeURIComponent(coach.worstTrade.tradeId)}`,
                    "summary",
                  )}
                >
                  {coach.worstTrade.symbol} /{" "}
                  {formatSigned(coach.worstTrade.grossRealizedPnl)}
                </Link>
              ) : (
                "n/a"
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="border border-zinc-800 bg-zinc-950 p-4">
        <h2 className="text-sm font-semibold text-zinc-100">
          Best / Worst Finder
        </h2>
        <div className="mt-4 grid gap-3">
          {[
            patterns.bestPerformingCluster,
            patterns.worstPerformingCluster,
            patterns.highestCostMistake,
            patterns.mostRepeatedMistake,
            patterns.mostPromisingStrength,
          ]
            .filter((item) => item !== null)
            .map((item) => (
              <div key={item.id} className="border-t border-zinc-900 py-3">
                <div className="text-sm text-zinc-300">{item.label}</div>
                <div className="mt-1 text-xs text-zinc-500">{item.detail}</div>
              </div>
            ))}
        </div>
      </div>

      <div className="border border-zinc-800 bg-zinc-950 p-4 xl:col-span-2">
        <div className="grid gap-6 lg:grid-cols-3">
          <MiniVisual visual={improvement.visuals.qualityByTrade} />
          <MiniVisual visual={improvement.visuals.mistakeFrequency} />
          <MiniVisual visual={improvement.visuals.executionCountBuckets} />
        </div>
      </div>

      <div className="border border-zinc-800 bg-zinc-950 p-4 xl:col-span-2">
        <h2 className="text-sm font-semibold text-zinc-100">
          Playbook Readiness
        </h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {improvement.playbookBuckets.map((bucket) => (
            <div key={bucket.id} className="border-t border-zinc-900 py-3">
              <div className="text-sm text-zinc-300">{bucket.label}</div>
              <div className="mt-2 font-mono text-xs text-zinc-500">
                {bucket.tradeCount} trades / quality{" "}
                {bucket.averageQualityScore?.toFixed(1) ?? "n/a"}
              </div>
              <div
                className={`mt-1 font-mono text-xs ${toneForPnl(bucket.grossTotalRealizedPnl)}`}
              >
                {formatSigned(bucket.grossTotalRealizedPnl)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProductPolishPanel({
  polish,
}: {
  polish: TraderProductPolishViewModel;
}) {
  const queue = polish.coachReviewQueue;
  const importExperience = polish.firstImportExperience;
  const trend = polish.executionQualityTrendline;

  return (
    <section className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.9fr)]">
      <div className="border border-zinc-800 bg-zinc-950 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-zinc-100">
              Coach Review Queue
            </h2>
            <div className="mt-1 text-sm text-zinc-500">
              {queue.primaryItem?.nextAction ?? "No coach queue item yet."}
            </div>
          </div>
          <Link
            className="text-sm text-sky-300 hover:text-sky-200"
            href="/coach"
          >
            Open coach
          </Link>
        </div>
        <div className="mt-4 grid gap-3">
          {queue.items.slice(0, 5).map((item) => (
            <Link
              key={item.id}
              className="block border-t border-zinc-900 py-3 hover:text-sky-200"
              href={item.href}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-zinc-300">{item.title}</span>
                <span className="text-xs uppercase tracking-wide text-zinc-500">
                  {item.lane}
                </span>
              </div>
              <div className="mt-1 text-xs text-zinc-500">{item.reason}</div>
            </Link>
          ))}
        </div>
      </div>

      <div className="border border-zinc-800 bg-zinc-950 p-4">
        <h2 className="text-sm font-semibold text-zinc-100">
          First Import Experience
        </h2>
        <div className="mt-2 text-sm text-zinc-500">
          {importExperience.headline}
        </div>
        <div className="mt-4 grid gap-2">
          {importExperience.steps.slice(0, 6).map((step) => (
            <div key={step.id} className="border-t border-zinc-900 py-2">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-zinc-300">{step.label}</span>
                <span className="text-xs uppercase tracking-wide text-zinc-500">
                  {step.status}
                </span>
              </div>
              <div className="mt-1 text-xs text-zinc-500">
                {step.nextAction}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border border-zinc-800 bg-zinc-950 p-4 xl:col-span-2">
        <div className="grid gap-6 lg:grid-cols-3">
          <div>
            <h2 className="text-sm font-semibold text-zinc-100">
              Evidence Cards
            </h2>
            <div className="mt-4 grid gap-3">
              {polish.evidenceCards.slice(0, 5).map((card) => (
                <Link
                  key={card.id}
                  className="block border-t border-zinc-900 py-3 hover:text-sky-200"
                  href={
                    card.primaryRoute.startsWith("/trades/")
                      ? withPageAnchor(card.primaryRoute, "evidence")
                      : card.primaryRoute
                  }
                >
                  <div className="text-sm text-zinc-300">{card.title}</div>
                  <div className="mt-1 text-xs text-zinc-500">
                    {card.confidenceCopy}
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-zinc-100">
              Pattern Memory
            </h2>
            <div className="mt-4 grid gap-3">
              {polish.personalPatternMemory.items.slice(0, 5).map((item) => (
                <div key={item.id} className="border-t border-zinc-900 py-3">
                  <div className="text-sm text-zinc-300">{item.label}</div>
                  <div className="mt-1 text-xs text-zinc-500">
                    {item.kind} / {item.confidence}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-zinc-100">
              Quality Trendline
            </h2>
            <div className="mt-1 text-xs text-zinc-500">
              {trend.reportTrendSummary}
            </div>
            <div className="mt-4 grid gap-2">
              {trend.points.slice(0, 7).map((point) => (
                <Link
                  key={point.tradeId}
                  className="block border-t border-zinc-900 py-2"
                  href={withPageAnchor(
                    `/trades/${encodeURIComponent(point.tradeId)}`,
                    "writing-flow",
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-zinc-300">{point.label}</span>
                    <span className="font-mono text-xs text-sky-300">
                      {point.score}/100
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 bg-zinc-900">
                    <div
                      className="h-1.5 bg-sky-400"
                      style={{ width: `${point.score}%` }}
                    />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ReviewHabitLoopPanel({
  habit,
}: {
  habit: TraderReviewHabitLoopViewModel;
}) {
  return (
    <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.45fr)]">
      <div className="border border-zinc-800 bg-zinc-950 p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-zinc-100">
              Review Habit Loop
            </h2>
            <div className="mt-1 text-sm text-zinc-500">
              {habit.reviewHabitTracker.nextHabitAction}
            </div>
          </div>
          <div className="font-mono text-xl text-sky-300">
            {habit.reviewHabitTracker.completionPct}%
          </div>
        </div>
        <div className="mt-4 grid gap-3">
          {habit.reviewHabitTracker.metrics.map((metric) => (
            <div key={metric.id} className="border-t border-zinc-900 py-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-zinc-300">{metric.label}</span>
                <span className="font-mono text-xs text-zinc-500">
                  {metric.value}/{metric.target}
                </span>
              </div>
              <div className="mt-1 text-xs text-zinc-500">{metric.detail}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="border border-zinc-800 bg-zinc-950 p-4">
        <h2 className="text-sm font-semibold text-zinc-100">Rule To Create</h2>
        <div className="mt-1 text-sm text-zinc-500">
          {habit.mistakeRuleConversion.nextAction}
        </div>
        <div className="mt-4 grid gap-3">
          {habit.mistakeRuleConversion.drafts.slice(0, 4).map((draft) => (
            <Link
              key={draft.id}
              className="block border-t border-zinc-900 py-3 hover:text-sky-200"
              href={
                draft.affectedTradeIds[0]
                  ? withPageAnchor(
                      `/trades/${encodeURIComponent(draft.affectedTradeIds[0])}`,
                      "writing-flow",
                    )
                  : "/coach"
              }
            >
              <div className="text-sm text-zinc-300">
                {draft.suggestedRuleTitle}
              </div>
              <div className="mt-1 text-xs text-zinc-500">
                {draft.readiness} / {draft.affectedTradeIds.length} trades
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function ReconciliationJobsPanel({
  productization,
}: {
  productization: TraderAnalyticsProductizationViewModel;
}) {
  const reconciliation = productization.reconciliation;
  const jobs = productization.jobQueue;

  return (
    <section className="grid gap-6 xl:grid-cols-2">
      <div className="border border-zinc-800 bg-zinc-950 p-4">
        <h2 className="text-sm font-semibold text-zinc-100">
          Import Reconciliation
        </h2>
        <div className="mt-4 grid grid-cols-4 gap-3 text-xs">
          <span className="font-mono text-emerald-300">
            {reconciliation.readyCount} ready
          </span>
          <span className="font-mono text-amber-300">
            {reconciliation.needsReviewCount} review
          </span>
          <span className="font-mono text-sky-300">
            {reconciliation.duplicateCount} duplicate
          </span>
          <span className="font-mono text-rose-300">
            {reconciliation.rejectedCount} rejected
          </span>
        </div>
        <div className="mt-4 grid gap-2">
          {reconciliation.items.slice(0, 4).map((item) => (
            <div
              key={item.id}
              className="grid gap-2 border-t border-zinc-900 py-2 md:grid-cols-[70px_100px_1fr]"
            >
              <div className="font-mono text-xs text-zinc-500">
                #{item.requestIndex + 1}
              </div>
              <div className="text-xs text-zinc-300">{item.status}</div>
              <div className="text-xs text-zinc-500">
                {item.recommendedAction}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border border-zinc-800 bg-zinc-950 p-4">
        <h2 className="text-sm font-semibold text-zinc-100">Analysis Jobs</h2>
        <div className="mt-4 grid grid-cols-4 gap-3 text-xs">
          <span className="font-mono text-sky-300">
            {jobs.queuedCount} queued
          </span>
          <span className="font-mono text-zinc-300">
            {jobs.completedCount} done
          </span>
          <span className="font-mono text-amber-300">
            {jobs.needsUserFixCount} fix
          </span>
          <span className="font-mono text-rose-300">
            {jobs.failedCount} failed
          </span>
        </div>
        <div className="mt-4 grid gap-2">
          {jobs.jobs.slice(0, 4).map((job) => (
            <div key={job.id} className="border-t border-zinc-900 py-2">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-zinc-300">
                  {job.symbol ?? "Unknown"}
                </span>
                <span className="font-mono text-xs text-zinc-500">
                  {job.status}
                </span>
              </div>
              <div className="mt-1 text-xs text-zinc-500">{job.nextAction}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function WorkflowActionPlanPanel({
  productization,
}: {
  productization: TraderAnalyticsProductizationViewModel;
}) {
  const workflow = productization.reviewWorkflow;
  const actionPlan = productization.actionPlan;

  return (
    <section className="grid gap-6 xl:grid-cols-2">
      <div className="border border-zinc-800 bg-zinc-950 p-4">
        <h2 className="text-sm font-semibold text-zinc-100">Review Workflow</h2>
        <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
          <span className="font-mono text-amber-300">
            {workflow.needsReviewCount} review
          </span>
          <span className="font-mono text-emerald-300">
            {workflow.lessonCapturedCount} lessons
          </span>
          <span className="font-mono text-sky-300">
            {workflow.ruleCreatedCount} rules
          </span>
        </div>
        <div className="mt-4 grid gap-2">
          {workflow.items.slice(0, 4).map((item) => (
            <div key={item.id} className="border-t border-zinc-900 py-2">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-zinc-300">{item.title}</span>
                <span className="font-mono text-xs text-zinc-500">
                  {item.status}
                </span>
              </div>
              <div className="mt-1 text-xs text-zinc-500">{item.summary}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="border border-zinc-800 bg-zinc-950 p-4">
        <h2 className="text-sm font-semibold text-zinc-100">Action Plan</h2>
        <div className="mt-4 grid gap-2">
          {actionPlan.items.map((item) => (
            <div key={item.id} className="border-t border-zinc-900 py-2">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-zinc-300">{item.title}</span>
                <span className="font-mono text-xs text-zinc-500">
                  {item.status}
                </span>
              </div>
              <div className="mt-1 text-xs text-zinc-500">
                {item.measurementWindow} / {item.successMetric}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 text-xs text-zinc-500">
          {actionPlan.nextAction}
        </div>
      </div>
    </section>
  );
}

function TagsCalibrationPanel({
  productization,
}: {
  productization: TraderAnalyticsProductizationViewModel;
}) {
  const tagging = productization.tagging;
  const calibration = productization.marketContextCalibrationQueue;
  const visualQa = productization.visualQa;

  return (
    <section className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
      <div className="border border-zinc-800 bg-zinc-950 p-4">
        <h2 className="text-sm font-semibold text-zinc-100">Setup Tags</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {tagging.segments.slice(0, 6).map((segment) => (
            <div key={segment.tagId} className="border-t border-zinc-900 py-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-zinc-300">{segment.label}</span>
                <span
                  className={`font-mono text-xs ${toneForPnl(segment.grossTotalRealizedPnl)}`}
                >
                  {formatSigned(segment.grossTotalRealizedPnl)}
                </span>
              </div>
              <div className="mt-2 text-xs text-zinc-500">
                {segment.tradeCount} trades /{" "}
                {segment.topRiskLabel ?? "no top risk"}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6">
        <div className="border border-zinc-800 bg-zinc-950 p-4">
          <h2 className="text-sm font-semibold text-zinc-100">
            Calibration Queue
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
            <span className="font-mono text-sky-300">
              {calibration.readyCount} ready
            </span>
            <span className="font-mono text-amber-300">
              {calibration.sampleOnlyCount} sample only
            </span>
          </div>
          <div className="mt-3 text-xs text-zinc-500">
            {calibration.nextAction}
          </div>
        </div>

        <div className="border border-zinc-800 bg-zinc-950 p-4">
          <h2 className="text-sm font-semibold text-zinc-100">Visual QA</h2>
          <div className="mt-4 grid gap-2">
            {visualQa.checks.map((check) => (
              <div
                key={check.id}
                className="flex items-center justify-between gap-3 border-t border-zinc-900 py-2"
              >
                <span className="text-xs text-zinc-400">{check.label}</span>
                <span className="font-mono text-xs text-zinc-500">
                  {check.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function MetricDelta({ delta }: { delta: TraderAnalyticsMetricDelta }) {
  const tone =
    delta.direction === "flat" || delta.direction === "insufficient_data"
      ? "text-zinc-300"
      : delta.favorableDirection === "neutral"
        ? "text-sky-300"
        : delta.direction === delta.favorableDirection
          ? "text-emerald-300"
          : "text-amber-300";

  return (
    <div className="border-t border-zinc-900 py-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-zinc-300">{delta.label}</span>
        <span className={`font-mono text-sm ${tone}`}>
          {formatSigned(delta.delta)}
        </span>
      </div>
      <div className="mt-1 text-xs text-zinc-500">
        {formatNumber(delta.previousValue)} to{" "}
        {formatNumber(delta.currentValue)}
      </div>
    </div>
  );
}

function DrillDownList({
  drillDowns,
  selectedId,
  onSelect,
}: {
  drillDowns: TraderAnalyticsDrillDown[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div
      className="border border-zinc-800 bg-zinc-950 p-4"
      data-testid="analytics-drilldown-list"
    >
      <h2 className="text-sm font-semibold text-zinc-100">
        Find Trades Behind A Number
      </h2>
      <div className="mt-4 grid gap-2">
        {drillDowns.slice(0, 10).map((drillDown) => (
          <button
            key={drillDown.id}
            className={`border px-3 py-2 text-left text-sm transition ${
              selectedId === drillDown.id
                ? "border-sky-400 bg-sky-950/30 text-sky-100"
                : "border-zinc-800 text-zinc-300 hover:border-zinc-600"
            }`}
            data-testid={`analytics-drilldown-${drillDown.id}`}
            type="button"
            onClick={() => onSelect(drillDown.id)}
          >
            <div className="flex items-center justify-between gap-3">
              <span>{drillDown.label}</span>
              <span className="font-mono text-xs text-zinc-500">
                {drillDown.rows.length}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function TradeRows({
  rows,
  testIdPrefix,
}: {
  rows: ProductTraderAnalyticsTradeRow[];
  testIdPrefix: string;
}) {
  return (
    <div className="w-full max-w-full overflow-x-auto">
      <table className="w-full min-w-[980px] text-left text-xs">
        <thead className="border-b border-zinc-800 text-zinc-500">
          <tr>
            <th className="py-3 pr-4 font-medium">Trade</th>
            <th className="py-3 pr-4 font-medium">Direction</th>
            <th className="py-3 pr-4 font-medium">Session</th>
            <th className="py-3 pr-4 font-medium">Hour</th>
            <th className="py-3 pr-4 font-medium">Gross P/L</th>
            <th className="py-3 pr-4 font-medium">Primary</th>
            <th className="py-3 pr-4 font-medium">Top Risk</th>
            <th className="py-3 pr-4 font-medium">Review</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-900">
          {rows.map((row) => (
            <tr
              key={row.tradeId}
              data-testid={`${testIdPrefix}-row-${row.tradeId}`}
            >
              <td className="py-3 pr-4">
                <div className="font-semibold text-zinc-100">
                  #{row.tradeIndex} {row.symbol}
                </div>
                <div className="font-mono text-zinc-500">{row.tradeId}</div>
              </td>
              <td className="py-3 pr-4 text-zinc-300">{row.tradeDirection}</td>
              <td className="py-3 pr-4 text-zinc-400">
                <div>{row.sessionDate}</div>
                <div className="font-mono text-zinc-500">
                  {row.sessionBucket}
                </div>
              </td>
              <td className="py-3 pr-4 text-zinc-400">
                <div>{row.entryHourLabelEt ?? "n/a"}</div>
                <div className="font-mono text-zinc-500">
                  {(row.heldSessionBuckets ?? []).length > 1
                    ? (row.heldSessionBuckets ?? []).join(" -> ")
                    : "single session"}
                </div>
              </td>
              <td
                className={`py-3 pr-4 font-mono ${
                  row.grossRealizedPnl >= 0
                    ? "text-emerald-300"
                    : "text-rose-300"
                }`}
              >
                {formatSigned(row.grossRealizedPnl)}
              </td>
              <td className="max-w-[190px] py-3 pr-4 text-zinc-300">
                {row.primaryFocus?.label ?? "None"}
              </td>
              <td className="max-w-[190px] py-3 pr-4 text-amber-300">
                {row.topRisk?.label ?? "None"}
              </td>
              <td className="py-3 pr-4">
                <Link
                  className="text-sky-300 hover:text-sky-200"
                  data-testid={`${testIdPrefix}-open-${row.tradeId}`}
                  href={withPageAnchor(
                    `/trades/${encodeURIComponent(row.tradeId)}`,
                    "summary",
                  )}
                >
                  Open
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ImportTrialExperiencePanel({
  experience,
}: {
  experience: TraderImportTrialExperienceViewModel;
}) {
  return (
    <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.42fr)]">
      <div className="border border-zinc-800 bg-zinc-950 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-zinc-100">
              Import Trial Readiness
            </h2>
            <div className="mt-1 text-sm text-zinc-500">
              {experience.harness.fixtureStrategy}
            </div>
          </div>
          <Link
            className="text-sm text-sky-300 hover:text-sky-200"
            href="/import-trials"
          >
            Open trials
          </Link>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <div className="border-t border-zinc-900 py-3">
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Fixtures
            </div>
            <div className="mt-2 text-xl font-semibold text-zinc-100">
              {experience.harness.totalCount}
            </div>
          </div>
          <div className="border-t border-zinc-900 py-3">
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Pass
            </div>
            <div className="mt-2 text-xl font-semibold text-emerald-300">
              {experience.harness.passCount}
            </div>
          </div>
          <div className="border-t border-zinc-900 py-3">
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Review
            </div>
            <div className="mt-2 text-xl font-semibold text-amber-300">
              {experience.harness.needsRepairCount}
            </div>
          </div>
          <div className="border-t border-zinc-900 py-3">
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Blocked
            </div>
            <div className="mt-2 text-xl font-semibold text-rose-300">
              {experience.harness.blockedCount}
            </div>
          </div>
        </div>
      </div>

      <div className="border border-zinc-800 bg-zinc-950 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-zinc-100">
              Review Cockpit
            </h2>
            <div className="mt-1 text-sm text-zinc-500">
              {experience.reviewCockpit.summary}
            </div>
          </div>
          <div className="font-mono text-lg text-sky-300">
            {experience.reviewCockpit.readinessScore}/100
          </div>
        </div>
        <div className="mt-4 grid gap-3">
          {experience.reviewCockpit.actions.slice(0, 3).map((action) => (
            <Link
              key={action.id}
              className="block border-t border-zinc-900 py-3 hover:text-sky-200"
              href={action.href}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-zinc-300">{action.title}</span>
                <span className="text-xs uppercase tracking-wide text-zinc-500">
                  {action.lane}
                </span>
              </div>
              <div className="mt-1 text-xs text-zinc-500">
                {action.nextAction}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

type AnalyticsDashboardSection =
  | "overview"
  | "charts"
  | "review"
  | "trades"
  | "advanced";

const ANALYTICS_DASHBOARD_SECTIONS: Array<{
  id: AnalyticsDashboardSection;
  label: string;
  summary: string;
}> = [
  {
    id: "overview",
    label: "Results",
    summary: "P/L curve, win/loss mix, and the trade tape.",
  },
  {
    id: "charts",
    label: "Timing And Charts",
    summary: "Time, sessions, behavior, and report charts.",
  },
  {
    id: "review",
    label: "Behavior Review Plan",
    summary: "What to review next and what behavior to watch.",
  },
  {
    id: "trades",
    label: "Trade Stories",
    summary: "Saved trades, ticker stories, and sessions behind each number.",
  },
  {
    id: "advanced",
    label: "Chart Evidence And Advanced",
    summary: "Quality checks, chart evidence, import setup, and rule detail.",
  },
];

const ANALYTICS_CATEGORY_ACCESS: Array<{
  anchor?: string;
  label: string;
  section: AnalyticsDashboardSection;
  summary: string;
}> = [
  {
    anchor: "analytics-results",
    label: "Results",
    section: "overview",
    summary: "P/L, win rate, and the trades that moved the account.",
  },
  {
    anchor: "chart-workbench",
    label: "Timing",
    section: "charts",
    summary: "Session, entry-hour, and hold-time charts.",
  },
  {
    anchor: "analytics-behavior",
    label: "Behavior",
    section: "overview",
    summary: "Risk, strength, and uncertain behavior groups.",
  },
  {
    anchor: "analytics-ticker-stories",
    label: "Ticker Stories",
    section: "overview",
    summary: "Same-symbol re-entry and giveback stories.",
  },
  {
    anchor: "analytics-session-stories",
    label: "Session Stories",
    section: "overview",
    summary: "Full-day stories like green-to-red or high trade count.",
  },
  {
    anchor: "analytics-chart-evidence",
    label: "Chart Evidence",
    section: "overview",
    summary: "Support, resistance, volume, and after-exit counts.",
  },
];

function AnalyticsCategoryAccessPanel({
  onOpen,
}: {
  onOpen: (section: AnalyticsDashboardSection, anchor?: string) => void;
}) {
  return (
    <section className="ti-panel p-5" data-testid="analytics-category-access">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-sky-300">
          Report Categories
        </p>
        <h2 className="text-xl font-semibold text-zinc-50">
          Open the part of the report you need.
        </h2>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {ANALYTICS_CATEGORY_ACCESS.map((item) => (
          <button
            className="rounded-md border border-zinc-800/60 bg-slate-950/30 px-4 py-3 text-left transition hover:border-sky-600 hover:bg-sky-950/20"
            key={item.label}
            onClick={() => onOpen(item.section, item.anchor)}
            type="button"
          >
            <span className="block text-sm font-semibold text-zinc-100">
              {item.label}
            </span>
            <span className="mt-1 block text-xs leading-5 text-zinc-500">
              {item.summary}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

function AnalyticsDashboardNav({
  activeSection,
  onChange,
}: {
  activeSection: AnalyticsDashboardSection;
  onChange: (section: AnalyticsDashboardSection) => void;
}) {
  return (
    <aside className="ti-panel h-fit p-3 lg:sticky lg:top-6">
      <div className="px-2 py-2">
        <div className="text-xs font-semibold uppercase text-sky-300">
          Analytics Menu
        </div>
        <div className="mt-1 text-xs leading-5 text-zinc-500">
          Choose the view you want instead of scrolling through every report.
        </div>
      </div>
      <div className="mt-2 grid gap-2">
        {ANALYTICS_DASHBOARD_SECTIONS.map((section) => {
          const active = section.id === activeSection;

          return (
            <button
              className={`rounded-md border px-3 py-3 text-left transition focus:outline-none ${
                active
                  ? "border-sky-500 bg-sky-950/60 text-zinc-50 shadow-[inset_3px_0_0_#38bdf8]"
                  : "border-zinc-800/40 bg-transparent text-zinc-400 hover:border-zinc-700 hover:bg-slate-800/40 hover:text-zinc-100"
              }`}
              key={section.id}
              onClick={() => onChange(section.id)}
              type="button"
            >
              <span className="block text-sm font-semibold">
                {section.label}
              </span>
              <span className="mt-1 block text-xs leading-5 text-zinc-500">
                {section.summary}
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}

export function AnalyticsClient({
  initialViewModel,
  savedReviewQueue,
  importSourceCaution,
  isSamplePreview = false,
  behaviorReport,
  tickerStorySummary,
  sessionStorySummary,
}: {
  initialViewModel: ProductTraderAnalyticsViewModel;
  savedReviewQueue?: SavedReviewQueueReadModel | null;
  importSourceCaution?: SavedImportSourceCautionReadModel | null;
  isSamplePreview?: boolean;
  behaviorReport: AnalyticsBehaviorReport;
  tickerStorySummary: AnalyticsTickerStorySummary;
  sessionStorySummary: AnalyticsSessionStorySummary;
}) {
  const [activeSection, setActiveSection] =
    useState<AnalyticsDashboardSection>("overview");
  const [filters, setFilters] = useState<TraderAnalyticsFilter>({});
  const [selectedDrillDownId, setSelectedDrillDownId] = useState(
    initialViewModel.drillDowns[0]?.id ?? "",
  );
  const latest = initialViewModel.latestReport;
  const report = latest.report;
  const selectedDrillDown = initialViewModel.drillDowns.find(
    (drillDown) => drillDown.id === selectedDrillDownId,
  );
  const visibleRows = useMemo(
    () => filteredRows(initialViewModel.filteredView.rows, filters),
    [filters, initialViewModel.filteredView.rows],
  );

  function updateFilter<K extends keyof TraderAnalyticsFilter>(
    key: K,
    value: TraderAnalyticsFilter[K] | "",
  ) {
    setFilters((current) => ({
      ...current,
      [key]: value || undefined,
    }));
  }

  function openAnalyticsCategory(
    section: AnalyticsDashboardSection,
    anchor?: string,
  ) {
    setActiveSection(section);

    if (anchor) {
      window.setTimeout(() => {
        document.getElementById(anchor)?.scrollIntoView({
          block: "start",
          behavior: "smooth",
        });
      }, 0);
    }
  }

  return (
    <main className="ti-dashboard-bg min-h-screen px-5 py-8 text-zinc-100 sm:px-8">
      <div className="mx-auto flex w-full min-w-0 max-w-[1480px] flex-col gap-8">
        <header className="ti-panel p-6">
          <Link
            className="text-sm text-sky-300 hover:text-sky-200"
            href="/workspace"
          >
            Back to workspace
          </Link>
          <p className="mt-4 text-xs font-semibold uppercase text-sky-300">
            Trader Intelligence
          </p>
          <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-zinc-50 sm:text-4xl">
                Trading Performance Dashboard
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
                A trader-facing report view for results, red/green behavior
                cost, and the next trade to review. This is analysis of saved
                executions, not trading advice.
              </p>
            </div>
            <div className="grid gap-2 text-sm">
              <div className="rounded-md border border-sky-900 bg-sky-950/30 px-4 py-3 text-sky-100">
                {isSamplePreview
                  ? "Previewing fuller demo data"
                  : initialViewModel.onboarding.title}
              </div>
              {!isSamplePreview && report.sampleSize.completedTradeCount < 6 ? (
                <Link
                  className="rounded-md border border-emerald-900 bg-emerald-950/20 px-4 py-3 text-center text-emerald-200 hover:border-emerald-500"
                  href="/analytics?demo=sample"
                >
                  Preview fuller dashboard
                </Link>
              ) : null}
            </div>
          </div>
        </header>

        <SavedReviewQueueSummary queue={savedReviewQueue} surface="analytics" />
        <SavedImportSourceCaution
          caution={importSourceCaution}
          surface="analytics"
        />

        <AnalyticsCategoryAccessPanel onOpen={openAnalyticsCategory} />

        <section className="grid min-w-0 gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          <AnalyticsDashboardNav
            activeSection={activeSection}
            onChange={setActiveSection}
          />
          <div className="min-w-0">
            {activeSection === "overview" ? (
              <div className="grid gap-6">
                <AnalyticsStoryPanel
                  showSecondaryCharts={false}
                  viewModel={initialViewModel}
                  savedReviewQueue={savedReviewQueue}
                />

                <div id="analytics-behavior">
                  <BehaviorReportPanel report={behaviorReport} />
                </div>
                <TickerStoryAnalyticsPanel summary={tickerStorySummary} />
                <SessionStoryAnalyticsPanel summary={sessionStorySummary} />

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                  <MetricCard
                    label="Completed Trades"
                    value={String(report.sampleSize.completedTradeCount)}
                    detail={latest.reportPeriod.label}
                  />
                  <MetricCard
                    label="Total Gross P/L"
                    value={formatSigned(report.pnl.grossTotalRealizedPnl)}
                    detail="fees excluded"
                    tone={
                      report.pnl.grossTotalRealizedPnl >= 0
                        ? "success"
                        : "danger"
                    }
                  />
                  <MetricCard
                    label="Win Rate"
                    value={formatPercent(report.pnl.grossWinRate)}
                    detail={`${report.pnl.grossWinnerCount} gross winners`}
                    tone="info"
                  />
                  <MetricCard
                    label="Adds Needing Review"
                    value={formatPercent(
                      report.executionBehavior.adversePriceAddRate,
                    )}
                    detail={`${report.executionBehavior.adversePriceAddTradeCount} trades where chart context decides whether the add repaired or added exposure`}
                    tone="warning"
                  />
                  <MetricCard
                    label="Open Position Rate"
                    value={formatPercent(report.lifecycle.openPositionRate)}
                    detail={`${report.lifecycle.openPositionTradeCount} trades left open`}
                    tone="info"
                  />
                </section>
              </div>
            ) : null}

            {activeSection === "charts" ? (
              <AnalyticsChartGalleryPanel
                onOpenTrades={() => setActiveSection("trades")}
                viewModel={initialViewModel}
              />
            ) : null}

            {activeSection === "review" ? (
              <div className="grid gap-6">
                <section className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(340px,0.75fr)]">
                  <WeeklyReviewPanel
                    weeklyReview={initialViewModel.weeklyReview}
                  />
                  <MarketContextPanel
                    status={initialViewModel.marketContextAddOn}
                  />
                </section>

                <ImprovementIntelligencePanel
                  improvement={initialViewModel.improvementIntelligence}
                />

                <IntelligencePanel
                  intelligence={initialViewModel.productIntelligence}
                />

                <ReviewHabitLoopPanel
                  habit={initialViewModel.reviewHabitLoop}
                />

                <ProductPolishPanel polish={initialViewModel.productPolish} />

                <section className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.5fr)]">
                  <div className="border border-zinc-800 bg-zinc-950 p-4">
                    <h2 className="text-sm font-semibold text-zinc-100">
                      Focus Queue
                    </h2>
                    <div className="mt-4 grid gap-3">
                      {initialViewModel.focusQueue.map((item) => (
                        <div
                          key={item.id}
                          className="border-t border-zinc-900 py-3"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="font-medium text-zinc-100">
                              {item.rank}. {item.title}
                            </div>
                            <div className="text-xs uppercase tracking-wide text-zinc-500">
                              {item.kind}
                            </div>
                          </div>
                          <div className="mt-1 text-sm text-zinc-400">
                            {item.summary}
                          </div>
                          <div className="mt-2 text-xs text-zinc-500">
                            {item.suggestedReviewAction}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border border-zinc-800 bg-zinc-950 p-4">
                    <h2 className="text-sm font-semibold text-zinc-100">
                      Report History
                    </h2>
                    <div className="mt-4 grid gap-3">
                      {initialViewModel.reportHistory.map(
                        (savedReport, index) => (
                          <div
                            key={savedReport.id}
                            className="border-t border-zinc-900 py-3"
                          >
                            <div className="font-medium text-zinc-100">
                              Saved report {index + 1}
                            </div>
                            <div className="mt-1 text-xs text-zinc-500">
                              {
                                savedReport.report.sampleSize
                                  .completedTradeCount
                              }{" "}
                              trades / generated {savedReport.generatedAt}
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                </section>

                <section className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
                  <SnapshotPanel snapshots={initialViewModel.reportSnapshots} />
                  <BehaviorStreaksPanel
                    streaks={initialViewModel.behaviorStreaks}
                  />
                </section>

                <JournalPromptsPanel
                  prompts={initialViewModel.journalPrompts}
                />

                <section className="grid gap-6 xl:grid-cols-2">
                  <div className="border border-zinc-800 bg-zinc-950 p-4">
                    <h2 className="text-sm font-semibold text-zinc-100">
                      Behavior Trends
                    </h2>
                    <div className="mt-4 grid gap-3">
                      {initialViewModel.behaviorTrends.map((trend) => (
                        <div
                          key={trend.behaviorId}
                          className="border-t border-zinc-900 py-3"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-sm text-zinc-300">
                              {trend.label}
                            </span>
                            <span className="font-mono text-xs text-zinc-500">
                              {formatPercent(trend.previousRate)} to{" "}
                              {formatPercent(trend.currentRate)}
                            </span>
                          </div>
                          <div className="mt-1 text-sm text-zinc-500">
                            {trend.copy}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border border-zinc-800 bg-zinc-950 p-4">
                    <h2 className="text-sm font-semibold text-zinc-100">
                      Latest Comparison
                    </h2>
                    {initialViewModel.comparison ? (
                      <div className="mt-4">
                        <div className="mb-3 text-sm text-zinc-500">
                          {initialViewModel.comparison.label}
                        </div>
                        {initialViewModel.comparison.metricDeltas.map(
                          (delta) => (
                            <MetricDelta key={delta.id} delta={delta} />
                          ),
                        )}
                      </div>
                    ) : (
                      <div className="mt-4 text-sm text-zinc-500">
                        More saved reports are needed for comparison.
                      </div>
                    )}
                  </div>
                </section>
              </div>
            ) : null}

            {activeSection === "advanced" ? (
              <div className="grid gap-6">
                <AdvancedDisclosure
                  summary="Advanced setup details"
                  testId="analytics-advanced-details"
                >
                  <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(340px,0.75fr)]">
                    <StorageReadinessPanel
                      readiness={initialViewModel.storageReadiness}
                    />
                    <ImportInboxPanel inbox={initialViewModel.importInbox} />
                  </section>
                  <ProductizationPanel
                    productization={initialViewModel.productization}
                  />
                  <ImportTrialExperiencePanel
                    experience={initialViewModel.importTrialExperience}
                  />
                  <ReconciliationJobsPanel
                    productization={initialViewModel.productization}
                  />
                  <WorkflowActionPlanPanel
                    productization={initialViewModel.productization}
                  />
                  <TagsCalibrationPanel
                    productization={initialViewModel.productization}
                  />
                </AdvancedDisclosure>
              </div>
            ) : null}

            {activeSection === "trades" ? (
              <div className="grid gap-6">
                <section
                  className="border border-zinc-800 bg-zinc-950 p-4"
                  id="trades-behind-number"
                >
                  <h2 className="text-sm font-semibold text-zinc-100">
                    Filters
                  </h2>
                  <div className="mt-4 grid gap-3 md:grid-cols-6">
                    <select
                      aria-label="Filter by symbol"
                      className="h-10 border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-100"
                      data-testid="analytics-filter-symbol"
                      value={filters.symbol ?? ""}
                      onChange={(event) =>
                        updateFilter("symbol", event.target.value)
                      }
                    >
                      <option value="">All symbols</option>
                      {initialViewModel.filterOptions.symbols.map((symbol) => (
                        <option key={symbol} value={symbol}>
                          {symbol}
                        </option>
                      ))}
                    </select>
                    <select
                      aria-label="Filter by entry hour"
                      className="h-10 border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-100"
                      data-testid="analytics-filter-entry-hour"
                      value={
                        filters.entryHourEt === undefined
                          ? ""
                          : String(filters.entryHourEt)
                      }
                      onChange={(event) =>
                        updateFilter(
                          "entryHourEt",
                          event.target.value === ""
                            ? ""
                            : Number(event.target.value),
                        )
                      }
                    >
                      <option value="">All hours</option>
                      {initialViewModel.filterOptions.entryHoursEt.map(
                        (hour) => (
                          <option key={hour.value} value={hour.value}>
                            {hour.label}
                          </option>
                        ),
                      )}
                    </select>
                    <select
                      aria-label="Filter by trade direction"
                      className="h-10 border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-100"
                      data-testid="analytics-filter-direction"
                      value={filters.tradeDirection ?? ""}
                      onChange={(event) =>
                        updateFilter("tradeDirection", event.target.value)
                      }
                    >
                      <option value="">All directions</option>
                      {initialViewModel.filterOptions.tradeDirections.map(
                        (direction) => (
                          <option key={direction} value={direction}>
                            {direction}
                          </option>
                        ),
                      )}
                    </select>
                    <select
                      aria-label="Filter by session"
                      className="h-10 border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-100"
                      data-testid="analytics-filter-session"
                      value={filters.sessionBucket ?? ""}
                      onChange={(event) =>
                        updateFilter("sessionBucket", event.target.value)
                      }
                    >
                      <option value="">All sessions</option>
                      {initialViewModel.filterOptions.sessionBuckets.map(
                        (session) => (
                          <option key={session} value={session}>
                            {session}
                          </option>
                        ),
                      )}
                    </select>
                    <select
                      aria-label="Filter by outcome"
                      className="h-10 border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-100"
                      data-testid="analytics-filter-outcome"
                      value={filters.outcome ?? ""}
                      onChange={(event) =>
                        updateFilter(
                          "outcome",
                          event.target.value as
                            | TraderAnalyticsFilter["outcome"]
                            | "",
                        )
                      }
                    >
                      <option value="">All outcomes</option>
                      {initialViewModel.filterOptions.outcomes.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                    <select
                      aria-label="Filter by lifecycle"
                      className="h-10 border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-100"
                      data-testid="analytics-filter-lifecycle"
                      value={filters.lifecycle ?? ""}
                      onChange={(event) =>
                        updateFilter(
                          "lifecycle",
                          event.target.value as
                            | TraderAnalyticsFilter["lifecycle"]
                            | "",
                        )
                      }
                    >
                      <option value="">All lifecycle</option>
                      {initialViewModel.filterOptions.lifecycles.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mt-3 text-xs text-zinc-500">
                    Showing {visibleRows.length} of{" "}
                    {initialViewModel.filteredView.totalTradeCount} trades.
                    Sample size remains visible when filtering.
                  </div>
                </section>

                <section className="grid min-w-0 gap-6 xl:grid-cols-[minmax(300px,0.4fr)_minmax(0,0.6fr)]">
                  <DrillDownList
                    drillDowns={initialViewModel.drillDowns}
                    selectedId={selectedDrillDownId}
                    onSelect={setSelectedDrillDownId}
                  />
                  <div className="min-w-0 border border-zinc-800 bg-zinc-950 p-4">
                    <h2
                      className="text-sm font-semibold text-zinc-100"
                      data-testid="analytics-selected-drilldown-title"
                    >
                      {selectedDrillDown?.label ?? "Drill-Down"}
                    </h2>
                    <div className="mt-2 text-sm text-zinc-500">
                      {selectedDrillDown?.summary ?? "Select a metric."}
                    </div>
                    <div className="mt-4 min-w-0">
                      <TradeRows
                        rows={selectedDrillDown?.rows ?? []}
                        testIdPrefix="analytics-drilldown"
                      />
                    </div>
                  </div>
                </section>

                <section
                  className="min-w-0 border border-zinc-800 bg-zinc-950 p-4"
                  data-testid="analytics-filtered-trade-review"
                >
                  <h2 className="text-sm font-semibold text-zinc-100">
                    Trades Matching Filters
                  </h2>
                  <div className="mt-4 min-w-0">
                    <TradeRows
                      rows={visibleRows}
                      testIdPrefix="analytics-filtered"
                    />
                  </div>
                </section>
              </div>
            ) : null}

            {activeSection === "advanced" ? (
              <section className="border border-zinc-800 bg-zinc-950 p-4">
                <h2 className="text-sm font-semibold text-zinc-100">
                  Rule Tracker
                </h2>
                <RuleCompliancePanel
                  summary={initialViewModel.ruleComplianceSummary}
                />
                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {initialViewModel.ruleEvaluations.map((evaluation) => (
                    <div
                      key={evaluation.ruleId}
                      className="border-t border-zinc-900 py-3"
                    >
                      <div className="font-medium text-zinc-100">
                        {evaluation.label}
                      </div>
                      <div className="mt-1 text-sm text-zinc-500">
                        {evaluation.violatedTradeCount} violations /{" "}
                        {evaluation.passedTradeCount} passes
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
