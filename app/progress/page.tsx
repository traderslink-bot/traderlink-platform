import Link from "next/link";
import type { Metadata } from "next";
import { buildProductWorkflowShellViewModel } from "../../src/lib/trader-analytics";

export const metadata: Metadata = {
  title: "Progress | Trader Intelligence",
};

function signed(value: number | null): string {
  if (value === null) {
    return "n/a";
  }

  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}`;
}

export default function ProgressPage() {
  const shell = buildProductWorkflowShellViewModel();
  const progress = shell.progress;
  const scorecard = progress.intelligence.scorecard;
  const overall = scorecard.dimensions.find((dimension) => dimension.id === "overall");
  const improvement = progress.analytics.improvementIntelligence;
  const polish = progress.analytics.productPolish;
  const habit = progress.analytics.reviewHabitLoop;

  return (
    <main className="min-h-screen bg-zinc-950 px-5 py-8 text-zinc-100 sm:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="border-b border-zinc-800 pb-6">
          <Link className="text-sm text-sky-300 hover:text-sky-200" href="/workspace">
            Back to workspace
          </Link>
          <h1 className="mt-3 text-3xl font-semibold text-zinc-50">
            Trader Progress
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-zinc-500">
            {progress.progressSummary}
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-4">
          <div className="border border-zinc-800 bg-zinc-950 p-4">
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Overall Score
            </div>
            <div className="mt-3 text-2xl font-semibold text-sky-300">
              {overall?.score ?? 0}/100
            </div>
          </div>
          <div className="border border-zinc-800 bg-zinc-950 p-4">
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Active Focus
            </div>
            <div className="mt-3 text-lg font-semibold text-zinc-100">
              {progress.activeFocusLabel}
            </div>
          </div>
          <div className="border border-zinc-800 bg-zinc-950 p-4">
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Rule Improvement
            </div>
            <div className="mt-3 text-2xl font-semibold text-emerald-300">
              {progress.ruleEffectiveness.improvingCount}
            </div>
          </div>
          <div className="border border-zinc-800 bg-zinc-950 p-4">
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Est. Mistake Cost
            </div>
            <div className="mt-3 text-2xl font-semibold text-rose-300">
              ${progress.intelligence.mistakeCostEstimates.totalEstimatedGrossCost.toFixed(2)}
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <div className="border border-zinc-800 bg-zinc-950 p-4">
            <h2 className="text-sm font-semibold text-zinc-100">
              Score Dimensions
            </h2>
            <div className="mt-4 grid gap-3">
              {scorecard.dimensions.map((dimension) => (
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
              Rule Effectiveness
            </h2>
            <div className="mt-4 grid gap-3">
              {progress.ruleEffectiveness.items.map((item) => (
                <div key={item.ruleId} className="border-t border-zinc-900 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-zinc-300">{item.label}</span>
                    <span className="text-xs uppercase tracking-wide text-zinc-500">
                      {item.direction}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-zinc-500">
                    before {item.violationsBefore ?? "n/a"} / after{" "}
                    {item.violationsAfter} / delta {item.delta ?? "n/a"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-3">
          <div className="border border-zinc-800 bg-zinc-950 p-4">
            <h2 className="text-sm font-semibold text-zinc-100">
              Quality By Trade
            </h2>
            <div className="mt-4 grid gap-3">
              {improvement.visuals.qualityByTrade.items.slice(0, 6).map((item) => (
                <div key={item.id} className="border-t border-zinc-900 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-zinc-300">{item.label}</span>
                    <span className="font-mono text-xs text-sky-300">
                      {item.value.toFixed(0)}/100
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 bg-zinc-900">
                    <div
                      className="h-1.5 bg-sky-400"
                      style={{ width: `${item.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border border-zinc-800 bg-zinc-950 p-4">
            <h2 className="text-sm font-semibold text-zinc-100">
              Mistake Reduction Targets
            </h2>
            <div className="mt-4 grid gap-3">
              {improvement.visuals.mistakeFrequency.items.slice(0, 6).map((item) => (
                <div key={item.id} className="border-t border-zinc-900 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-zinc-300">{item.label}</span>
                    <span className="font-mono text-xs text-amber-300">
                      {item.value}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border border-zinc-800 bg-zinc-950 p-4">
            <h2 className="text-sm font-semibold text-zinc-100">
              Coach Focus
            </h2>
            <div className="mt-4 border-t border-zinc-900 py-3 text-sm text-amber-200">
              {improvement.dailyCoachReport.fixNextSession}
            </div>
            <div className="border-t border-zinc-900 py-3 text-sm text-emerald-200">
              {improvement.dailyCoachReport.preserveNextSession}
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.45fr)]">
          <div className="border border-zinc-800 bg-zinc-950 p-4">
            <h2 className="text-sm font-semibold text-zinc-100">
              Behavior Change Tracker
            </h2>
            <div className="mt-1 text-sm text-zinc-500">
              {habit.behaviorChangeTracker.summary}
            </div>
            <div className="mt-4 grid gap-3">
              {habit.behaviorChangeTracker.items.map((item) => (
                <div key={item.id} className="border-t border-zinc-900 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-zinc-300">{item.label}</span>
                    <span className="text-xs uppercase tracking-wide text-zinc-500">
                      {item.direction}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-zinc-500">
                    current {item.currentValue ?? "n/a"} / prior{" "}
                    {item.previousValue ?? "n/a"} / delta {item.delta ?? "n/a"}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border border-zinc-800 bg-zinc-950 p-4">
            <h2 className="text-sm font-semibold text-zinc-100">
              Review Habits
            </h2>
            <div className="mt-3 text-2xl font-semibold text-sky-300">
              {habit.reviewHabitTracker.completionPct}%
            </div>
            <div className="mt-2 text-sm text-zinc-500">
              {habit.reviewHabitTracker.nextHabitAction}
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.45fr)]">
          <div className="border border-zinc-800 bg-zinc-950 p-4">
            <h2 className="text-sm font-semibold text-zinc-100">
              Execution Quality Trendline
            </h2>
            <div className="mt-1 text-sm text-zinc-500">
              {polish.executionQualityTrendline.reportTrendSummary}
            </div>
            <div className="mt-4 grid gap-3">
              {polish.executionQualityTrendline.points.map((point) => (
                <Link
                  key={point.tradeId}
                  className="block border-t border-zinc-900 py-3 hover:text-sky-200"
                  data-testid={`progress-quality-link-${point.tradeId}`}
                  href={`/trades/${point.tradeId}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-zinc-300">{point.label}</span>
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
                  <div className="mt-1 text-xs text-zinc-500">
                    {point.direction} / {point.gradeBand}
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="border border-zinc-800 bg-zinc-950 p-4">
            <h2 className="text-sm font-semibold text-zinc-100">
              Pattern Memory
            </h2>
            <div className="mt-4 grid gap-3">
              {polish.personalPatternMemory.items.slice(0, 6).map((item) => (
                <div key={item.id} className="border-t border-zinc-900 py-3">
                  <div className="text-sm text-zinc-300">{item.label}</div>
                  <div className="mt-1 text-xs text-zinc-500">
                    {item.occurrenceCount} occurrence(s), {item.confidence} confidence
                  </div>
                  <div className="mt-2 text-xs text-zinc-500">
                    {item.nextAction}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border border-zinc-800 bg-zinc-950 p-4">
          <h2 className="text-sm font-semibold text-zinc-100">
            Report History
          </h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {progress.analytics.reportSnapshots.map((snapshot) => (
              <div key={snapshot.id} className="border-t border-zinc-900 py-3">
                <div className="text-sm font-medium text-zinc-100">
                  {snapshot.label}
                </div>
                <div className="mt-1 text-xs text-zinc-500">
                  {snapshot.completedTradeCount} trades / P/L{" "}
                  {signed(snapshot.grossTotalRealizedPnl)}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
