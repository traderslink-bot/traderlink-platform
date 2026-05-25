import Link from "next/link";
import type { Metadata } from "next";
import {
  buildProductTraderAnalyticsViewModel,
  buildSampleSavedTraderAnalyticsData,
} from "@/src/lib/trader-analytics";

export const metadata: Metadata = {
  title: "Compare Trades | Trader Intelligence",
};

function signed(value: number | null): string {
  if (value === null) {
    return "n/a";
  }

  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}`;
}

export default function CompareTradesPage() {
  const sample = buildSampleSavedTraderAnalyticsData();
  const analytics = buildProductTraderAnalyticsViewModel({
    repository: sample.repository,
    userId: sample.userId,
    importRequests: sample.importRequests,
  });
  const comparison = analytics.reviewHabitLoop.tradeComparison;

  return (
    <main className="min-h-screen bg-zinc-950 px-5 py-8 text-zinc-100 sm:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="border-b border-zinc-800 pb-6">
          <Link className="text-sm text-sky-300 hover:text-sky-200" href="/intelligence">
            Back to workspace
          </Link>
          <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-sky-300">
            Trade Comparison
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-zinc-50">
            {comparison?.title ?? "More trades needed"}
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-zinc-500">
            Side-by-side execution comparison. Market context is not used for
            this comparison.
          </p>
        </header>

        {comparison ? (
          <>
            <section className="grid gap-6 xl:grid-cols-2">
              {[comparison.left, comparison.right].map((side) => (
                <Link
                  key={side.tradeId}
                  className="block border border-zinc-800 bg-zinc-950 p-4 transition hover:border-sky-400"
                  href={`/intelligence/trades/${side.tradeId}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-lg font-semibold text-zinc-100">
                        {side.symbol}
                      </div>
                      <div className="mt-1 font-mono text-xs text-zinc-500">
                        {side.tradeId}
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`font-mono text-xl ${
                          side.grossRealizedPnl >= 0
                            ? "text-emerald-300"
                            : "text-rose-300"
                        }`}
                      >
                        {signed(side.grossRealizedPnl)}
                      </div>
                      <div className="mt-1 text-xs text-zinc-500">
                        quality {side.qualityScore ?? "n/a"}
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 grid gap-3 md:grid-cols-3">
                    <div className="border-t border-zinc-900 py-3">
                      <div className="text-xs uppercase tracking-wide text-zinc-500">
                        Executions
                      </div>
                      <div className="mt-2 text-sm text-zinc-300">
                        {side.executionCount}
                      </div>
                    </div>
                    <div className="border-t border-zinc-900 py-3">
                      <div className="text-xs uppercase tracking-wide text-zinc-500">
                        Top Risk
                      </div>
                      <div className="mt-2 text-sm text-amber-300">
                        {side.topRiskLabel ?? "None"}
                      </div>
                    </div>
                    <div className="border-t border-zinc-900 py-3">
                      <div className="text-xs uppercase tracking-wide text-zinc-500">
                        Top Strength
                      </div>
                      <div className="mt-2 text-sm text-emerald-300">
                        {side.topStrengthLabel ?? "None"}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </section>

            <section className="grid gap-6 xl:grid-cols-3">
              <div className="border border-zinc-800 bg-zinc-950 p-4">
                <div className="text-xs uppercase tracking-wide text-zinc-500">
                  P/L Delta
                </div>
                <div className="mt-3 text-2xl font-semibold text-sky-300">
                  {signed(comparison.pnlDelta)}
                </div>
              </div>
              <div className="border border-zinc-800 bg-zinc-950 p-4">
                <div className="text-xs uppercase tracking-wide text-zinc-500">
                  Quality Delta
                </div>
                <div className="mt-3 text-2xl font-semibold text-sky-300">
                  {comparison.qualityDelta ?? "n/a"}
                </div>
              </div>
              <div className="border border-zinc-800 bg-zinc-950 p-4">
                <div className="text-xs uppercase tracking-wide text-zinc-500">
                  Shared Context
                </div>
                <div className="mt-3 text-sm text-zinc-300">
                  {comparison.sharedBehavior}
                </div>
              </div>
            </section>

            <section className="border border-zinc-800 bg-zinc-950 p-4">
              <h2 className="text-sm font-semibold text-zinc-100">
                Review Prompt
              </h2>
              <div className="mt-4 border-t border-zinc-900 py-4 text-sm text-zinc-300">
                {comparison.keyDifference}
              </div>
              <div className="border-t border-zinc-900 py-4 text-sm text-sky-300">
                {comparison.reviewPrompt}
              </div>
            </section>
          </>
        ) : (
          <section className="border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-500">
            Save at least two trades before comparing them.
          </section>
        )}
      </div>
    </main>
  );
}
