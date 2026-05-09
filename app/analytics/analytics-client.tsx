"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  AdvancedDisclosure,
  MetricCard,
  MixBar,
  SimpleBarChart,
} from "../app-ui";
import { SavedImportSourceCaution } from "../saved-import-source-caution";
import { SavedReviewQueueSummary } from "../saved-review-queue-summary";
import type { SavedImportSourceCautionReadModel } from "../../src/lib/trader-analytics/server/saved-import-source-caution";
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

function outcome(row: ProductTraderAnalyticsTradeRow): "winner" | "loser" | "flat" {
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

    if (filters.tradeDirection && row.tradeDirection !== filters.tradeDirection) {
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
      (left, right) =>
        right.grossTotalRealizedPnl - left.grossTotalRealizedPnl,
    )[0] ?? null;
  const bestHour =
    [...report.timeOfDay.entryHoursEt].sort(
      (left, right) =>
        right.grossTotalRealizedPnl - left.grossTotalRealizedPnl,
    )[0] ?? null;
  const cross = report.timeOfDay.crossSessionHolds;

  return (
    <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.45fr)]">
      <div className="border border-zinc-800 bg-zinc-950 p-4">
        <h2 className="text-sm font-semibold text-zinc-100">
          Time Of Day
        </h2>
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
              <div className={`mt-2 font-mono text-lg ${toneForPnl(bucket.grossTotalRealizedPnl)}`}>
                {formatSigned(bucket.grossTotalRealizedPnl)}
              </div>
              <div className="mt-1 text-xs text-zinc-500">
                {bucket.tradeCount} trades / {formatPercent(bucket.grossWinRate)}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border border-zinc-800 bg-zinc-950 p-4">
        <h2 className="text-sm font-semibold text-zinc-100">
          Hour And Holds
        </h2>
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

function AnalyticsStoryPanel({
  viewModel,
  savedReviewQueue,
}: {
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

  return (
    <section
      className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.9fr)]"
      data-testid="analytics-story-panel"
    >
      <div className="border border-zinc-800 bg-zinc-950 p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-400">
          Analytics Overview
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-zinc-50">
          What happened in this trade set
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
          Start with outcome, then review the biggest behavior pattern. These
          numbers are gross execution P/L only, so they are review prompts, not
          trade instructions.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Gross Result"
            value={formatSigned(report.pnl.grossTotalRealizedPnl)}
            detail={`${report.sampleSize.completedTradeCount} completed trades`}
            tone={report.pnl.grossTotalRealizedPnl >= 0 ? "success" : "danger"}
          />
          <MetricCard
            label="Win Rate"
            value={formatPercent(report.pnl.grossWinRate)}
            detail={`${report.pnl.grossWinnerCount} winners / ${report.pnl.grossLoserCount} losers`}
            tone="info"
          />
          <MetricCard
            label="Best Trade"
            value={bestTrade ? formatSigned(bestTrade.grossRealizedPnl) : "n/a"}
            detail={bestTrade ? `${bestTrade.symbol} #${bestTrade.tradeIndex}` : "No trades yet"}
            tone={bestTrade && bestTrade.grossRealizedPnl >= 0 ? "success" : "muted"}
          />
          <MetricCard
            label="Worst Trade"
            value={worstTrade ? formatSigned(worstTrade.grossRealizedPnl) : "n/a"}
            detail={worstTrade ? `${worstTrade.symbol} #${worstTrade.tradeIndex}` : "No trades yet"}
            tone={worstTrade && worstTrade.grossRealizedPnl < 0 ? "danger" : "muted"}
          />
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <div className="border border-zinc-800 bg-black/20 p-3">
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Review First
            </div>
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
          <div className="border border-zinc-800 bg-black/20 p-3">
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Biggest Risk
            </div>
            <div className="mt-2 text-sm font-semibold text-amber-300">
              {topRisk?.label ?? "No repeated risk yet"}
            </div>
            <div className="mt-1 text-xs text-zinc-500">
              {topRisk ? `${topRisk.count} occurrence(s)` : "Save more closed trades."}
            </div>
          </div>
          <div className="border border-zinc-800 bg-black/20 p-3">
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Best Strength
            </div>
            <div className="mt-2 text-sm font-semibold text-emerald-300">
              {topStrength?.label ?? "No repeated strength yet"}
            </div>
            <div className="mt-1 text-xs text-zinc-500">
              {topStrength ? `${topStrength.count} occurrence(s)` : "Save more closed trades."}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        <MixBar chart={charts.winLossDonut} title="Win/Loss Mix" />
        <SimpleBarChart
          chart={charts.entrySessionPerformance}
          formatter={formatSigned}
          maxItems={5}
          title="P/L by Session"
        />
      </div>

      <div className="xl:col-span-2 grid gap-4 xl:grid-cols-3">
        <SimpleBarChart
          chart={charts.grossPnlByTrade}
          formatter={formatSigned}
          maxItems={8}
          title="P/L by Trade"
        />
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
    </section>
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
          <h2 className="text-sm font-semibold text-zinc-100">
            Weekly Review
          </h2>
          <div className="mt-1 text-sm text-zinc-500">{weeklyReview.label}</div>
        </div>
        <div className={`font-mono text-xl ${toneForPnl(weeklyReview.grossTotalRealizedPnl)}`}>
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
          <span className="text-amber-300">{inbox.needsReviewCount} review</span>
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
            <div className="text-sm text-zinc-200">{item.symbol ?? "Unknown"}</div>
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
      <h2 className="text-sm font-semibold text-zinc-100">
        Saved Snapshots
      </h2>
      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        {snapshots.slice(0, 6).map((snapshot) => (
          <div key={snapshot.id} className="border-t border-zinc-900 py-3">
            <div className="flex items-center justify-between gap-3">
              <span className="font-medium text-zinc-100">{snapshot.label}</span>
              <span className={`font-mono text-xs ${toneForPnl(snapshot.grossTotalRealizedPnl)}`}>
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

function JournalPromptsPanel({
  prompts,
}: {
  prompts: TraderJournalPrompt[];
}) {
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
            Chart Context Status
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
          <div key={source} className="border-t border-zinc-900 py-2 text-xs text-zinc-500">
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
        <h2 className="text-sm font-semibold text-zinc-100">
          Workspace Scope
        </h2>
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
          ${intelligence.mistakeCostEstimates.totalEstimatedGrossCost.toFixed(2)}
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
                    <span className="text-sm text-zinc-300">
                      {alert.title}
                    </span>
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
              {intelligence.ruleBuilderRecommendations.slice(0, 4).map((item) => (
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
                    <span className="text-sm text-zinc-300">
                      {item.title}
                    </span>
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
                  href={`/trades/${coach.bestTrade.tradeId}`}
                >
                  {coach.bestTrade.symbol} / {formatSigned(coach.bestTrade.grossRealizedPnl)}
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
                  href={`/trades/${coach.worstTrade.tradeId}`}
                >
                  {coach.worstTrade.symbol} / {formatSigned(coach.worstTrade.grossRealizedPnl)}
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
              <div className={`mt-1 font-mono text-xs ${toneForPnl(bucket.grossTotalRealizedPnl)}`}>
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
              <div className="mt-1 text-xs text-zinc-500">{step.nextAction}</div>
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
                  href={card.primaryRoute}
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
                  href={`/trades/${point.tradeId}`}
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
            <h2 className="text-sm font-semibold text-zinc-100">
              Rule To Create
            </h2>
        <div className="mt-1 text-sm text-zinc-500">
          {habit.mistakeRuleConversion.nextAction}
        </div>
        <div className="mt-4 grid gap-3">
          {habit.mistakeRuleConversion.drafts.slice(0, 4).map((draft) => (
            <Link
              key={draft.id}
              className="block border-t border-zinc-900 py-3 hover:text-sky-200"
              href={draft.affectedTradeIds[0] ? `/trades/${draft.affectedTradeIds[0]}` : "/coach"}
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
        <h2 className="text-sm font-semibold text-zinc-100">
          Analysis Jobs
        </h2>
        <div className="mt-4 grid grid-cols-4 gap-3 text-xs">
          <span className="font-mono text-sky-300">{jobs.queuedCount} queued</span>
          <span className="font-mono text-zinc-300">
            {jobs.completedCount} done
          </span>
          <span className="font-mono text-amber-300">
            {jobs.needsUserFixCount} fix
          </span>
          <span className="font-mono text-rose-300">{jobs.failedCount} failed</span>
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
        <h2 className="text-sm font-semibold text-zinc-100">
          Review Workflow
        </h2>
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
        <div className="mt-3 text-xs text-zinc-500">{actionPlan.nextAction}</div>
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
        <h2 className="text-sm font-semibold text-zinc-100">
          Setup Tags
        </h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {tagging.segments.slice(0, 6).map((segment) => (
            <div key={segment.tagId} className="border-t border-zinc-900 py-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-zinc-300">{segment.label}</span>
                <span className={`font-mono text-xs ${toneForPnl(segment.grossTotalRealizedPnl)}`}>
                  {formatSigned(segment.grossTotalRealizedPnl)}
                </span>
              </div>
              <div className="mt-2 text-xs text-zinc-500">
                {segment.tradeCount} trades / {segment.topRiskLabel ?? "no top risk"}
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
        {formatNumber(delta.previousValue)} to {formatNumber(delta.currentValue)}
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
            <tr key={row.tradeId} data-testid={`${testIdPrefix}-row-${row.tradeId}`}>
              <td className="py-3 pr-4">
                <div className="font-semibold text-zinc-100">
                  #{row.tradeIndex} {row.symbol}
                </div>
                <div className="font-mono text-zinc-500">{row.tradeId}</div>
              </td>
              <td className="py-3 pr-4 text-zinc-300">{row.tradeDirection}</td>
              <td className="py-3 pr-4 text-zinc-400">
                <div>{row.sessionDate}</div>
                <div className="font-mono text-zinc-500">{row.sessionBucket}</div>
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
                  href={`/trades/${row.tradeId}`}
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

export function AnalyticsClient({
  initialViewModel,
  savedReviewQueue,
  importSourceCaution,
}: {
  initialViewModel: ProductTraderAnalyticsViewModel;
  savedReviewQueue?: SavedReviewQueueReadModel | null;
  importSourceCaution?: SavedImportSourceCautionReadModel | null;
}) {
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

  return (
    <main className="min-h-screen bg-zinc-950 px-5 py-8 text-zinc-100 sm:px-8">
      <div className="mx-auto flex w-full min-w-0 max-w-[1480px] flex-col gap-8">
        <header className="border-b border-zinc-800 pb-6">
          <Link className="text-sm text-sky-300 hover:text-sky-200" href="/workspace">
            Back to workspace
          </Link>
          <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-sky-300">
            Trader Intelligence
          </p>
          <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-zinc-50">
                Analytics
              </h1>
              <p className="mt-2 max-w-3xl text-sm text-zinc-500">
                Saved in-app execution analytics. Reports, comparisons, focus
                items, and trade review links stay inside the product.
              </p>
            </div>
            <div className="border border-sky-900 bg-sky-950/30 px-4 py-3 text-sm text-sky-100">
              {initialViewModel.onboarding.title}
            </div>
          </div>
        </header>

        <SavedReviewQueueSummary
          queue={savedReviewQueue}
          surface="analytics"
        />
        <SavedImportSourceCaution
          caution={importSourceCaution}
          surface="analytics"
        />

        <AnalyticsStoryPanel
          viewModel={initialViewModel}
          savedReviewQueue={savedReviewQueue}
        />

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
            label="Adverse Add Rate"
            value={formatPercent(report.executionBehavior.adversePriceAddRate)}
            detail={`${report.executionBehavior.adversePriceAddTradeCount} trades`}
            tone="warning"
          />
          <MetricCard
            label="Open Position Rate"
            value={formatPercent(report.lifecycle.openPositionRate)}
            detail={`${report.lifecycle.openPositionTradeCount} trades left open`}
            tone="info"
          />
        </section>

        <TimeOfDayPanel report={report} />

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(340px,0.75fr)]">
          <WeeklyReviewPanel weeklyReview={initialViewModel.weeklyReview} />
          <MarketContextPanel status={initialViewModel.marketContextAddOn} />
        </section>

        <ImprovementIntelligencePanel
          improvement={initialViewModel.improvementIntelligence}
        />

        <IntelligencePanel
          intelligence={initialViewModel.productIntelligence}
        />

        <ReviewHabitLoopPanel habit={initialViewModel.reviewHabitLoop} />

        <ProductPolishPanel polish={initialViewModel.productPolish} />

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.5fr)]">
          <div className="border border-zinc-800 bg-zinc-950 p-4">
            <h2 className="text-sm font-semibold text-zinc-100">
              Focus Queue
            </h2>
            <div className="mt-4 grid gap-3">
              {initialViewModel.focusQueue.map((item) => (
                <div key={item.id} className="border-t border-zinc-900 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-medium text-zinc-100">
                      {item.rank}. {item.title}
                    </div>
                    <div className="text-xs uppercase tracking-wide text-zinc-500">
                      {item.kind}
                    </div>
                  </div>
                  <div className="mt-1 text-sm text-zinc-400">{item.summary}</div>
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
              {initialViewModel.reportHistory.map((savedReport) => (
                <div key={savedReport.id} className="border-t border-zinc-900 py-3">
                  <div className="font-medium text-zinc-100">
                    {savedReport.reportPeriod.label}
                  </div>
                  <div className="mt-1 text-xs text-zinc-500">
                    {savedReport.report.sampleSize.completedTradeCount} trades /
                    generated {savedReport.generatedAt}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
          <SnapshotPanel snapshots={initialViewModel.reportSnapshots} />
          <BehaviorStreaksPanel streaks={initialViewModel.behaviorStreaks} />
        </section>

        <JournalPromptsPanel prompts={initialViewModel.journalPrompts} />

        <section className="grid gap-6 xl:grid-cols-2">
          <div className="border border-zinc-800 bg-zinc-950 p-4">
            <h2 className="text-sm font-semibold text-zinc-100">
              Behavior Trends
            </h2>
            <div className="mt-4 grid gap-3">
              {initialViewModel.behaviorTrends.map((trend) => (
                <div key={trend.behaviorId} className="border-t border-zinc-900 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-zinc-300">{trend.label}</span>
                    <span className="font-mono text-xs text-zinc-500">
                      {formatPercent(trend.previousRate)} to{" "}
                      {formatPercent(trend.currentRate)}
                    </span>
                  </div>
                  <div className="mt-1 text-sm text-zinc-500">{trend.copy}</div>
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
                {initialViewModel.comparison.metricDeltas.map((delta) => (
                  <MetricDelta key={delta.id} delta={delta} />
                ))}
              </div>
            ) : (
              <div className="mt-4 text-sm text-zinc-500">
                More saved reports are needed for comparison.
              </div>
            )}
          </div>
        </section>

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
            <ProductizationPanel productization={initialViewModel.productization} />
            <ImportTrialExperiencePanel
              experience={initialViewModel.importTrialExperience}
            />
            <ReconciliationJobsPanel
              productization={initialViewModel.productization}
            />
            <WorkflowActionPlanPanel
              productization={initialViewModel.productization}
            />
            <TagsCalibrationPanel productization={initialViewModel.productization} />
        </AdvancedDisclosure>

        <section className="border border-zinc-800 bg-zinc-950 p-4">
          <h2 className="text-sm font-semibold text-zinc-100">Filters</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-6">
            <select
              aria-label="Filter by symbol"
              className="h-10 border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-100"
              data-testid="analytics-filter-symbol"
              value={filters.symbol ?? ""}
              onChange={(event) => updateFilter("symbol", event.target.value)}
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
              {initialViewModel.filterOptions.entryHoursEt.map((hour) => (
                <option key={hour.value} value={hour.value}>
                  {hour.label}
                </option>
              ))}
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
              {initialViewModel.filterOptions.tradeDirections.map((direction) => (
                <option key={direction} value={direction}>
                  {direction}
                </option>
              ))}
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
              {initialViewModel.filterOptions.sessionBuckets.map((session) => (
                <option key={session} value={session}>
                  {session}
                </option>
              ))}
            </select>
            <select
              aria-label="Filter by outcome"
              className="h-10 border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-100"
              data-testid="analytics-filter-outcome"
              value={filters.outcome ?? ""}
              onChange={(event) =>
                updateFilter(
                  "outcome",
                  event.target.value as TraderAnalyticsFilter["outcome"] | "",
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
                  event.target.value as TraderAnalyticsFilter["lifecycle"] | "",
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
            {initialViewModel.filteredView.totalTradeCount} trades. Sample size
            remains visible when filtering.
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

        <section className="border border-zinc-800 bg-zinc-950 p-4">
          <h2 className="text-sm font-semibold text-zinc-100">Rule Tracker</h2>
          <RuleCompliancePanel
            summary={initialViewModel.ruleComplianceSummary}
          />
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {initialViewModel.ruleEvaluations.map((evaluation) => (
              <div key={evaluation.ruleId} className="border-t border-zinc-900 py-3">
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
      </div>
    </main>
  );
}
