import Link from "next/link";
import type { Metadata } from "next";
import {
  buildProductTraderAnalyticsViewModel,
  buildSampleSavedTraderAnalyticsData,
} from "@/src/lib/trader-analytics";

export const metadata: Metadata = {
  title: "Session Recap | Trader Intelligence",
};

function signed(value: number | null): string {
  if (value === null) {
    return "n/a";
  }

  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}`;
}

export default function SessionRecapPage() {
  const sample = buildSampleSavedTraderAnalyticsData();
  const analytics = buildProductTraderAnalyticsViewModel({
    repository: sample.repository,
    userId: sample.userId,
    importRequests: sample.importRequests,
  });
  const polish = analytics.productPolish;
  const recap = polish.sessionRecap;

  return (
    <main className="min-h-screen bg-zinc-950 px-5 py-8 text-zinc-100 sm:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="border-b border-zinc-800 pb-6">
          <Link className="text-sm text-sky-300 hover:text-sky-200" href="/intelligence">
            Back to workspace
          </Link>
          <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-emerald-400">
            Session Recap
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-zinc-50">
            {recap.headline}
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-zinc-500">
            {recap.sessionDate} / {recap.tradeCount} trade
            {recap.tradeCount === 1 ? "" : "s"} / execution-only recap
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-4">
          <div className="border border-zinc-800 bg-zinc-950 p-4">
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Best Trade
            </div>
            <div className="mt-3 text-lg font-semibold text-emerald-300">
              {recap.bestTrade?.symbol ?? "n/a"}
            </div>
            <div className="mt-1 font-mono text-xs text-zinc-500">
              {signed(recap.bestTrade?.grossRealizedPnl ?? null)}
            </div>
          </div>
          <div className="border border-zinc-800 bg-zinc-950 p-4">
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Worst Trade
            </div>
            <div className="mt-3 text-lg font-semibold text-rose-300">
              {recap.worstTrade?.symbol ?? "n/a"}
            </div>
            <div className="mt-1 font-mono text-xs text-zinc-500">
              {signed(recap.worstTrade?.grossRealizedPnl ?? null)}
            </div>
          </div>
          <div className="border border-zinc-800 bg-zinc-950 p-4">
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Biggest Leak
            </div>
            <div className="mt-3 text-sm font-semibold text-amber-300">
              {recap.biggestLeak ?? "Collecting"}
            </div>
          </div>
          <div className="border border-zinc-800 bg-zinc-950 p-4">
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Rule Focus
            </div>
            <div className="mt-3 text-sm font-semibold text-sky-300">
              {recap.ruleFocus ?? "No rule focus yet"}
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.45fr)]">
          <div className="border border-zinc-800 bg-zinc-950 p-4">
            <h2 className="text-sm font-semibold text-zinc-100">
              Next Session Focus
            </h2>
            <div className="mt-4 border-t border-zinc-900 py-4 text-sm text-amber-200">
              {recap.nextAction}
            </div>
            <div className="border-t border-zinc-900 py-4 text-sm text-emerald-200">
              {recap.repeatableBehavior ?? "Capture the best repeatable behavior after review."}
            </div>
          </div>

          <div className="border border-zinc-800 bg-zinc-950 p-4">
            <h2 className="text-sm font-semibold text-zinc-100">
              Review Trades
            </h2>
            <div className="mt-4 grid gap-2">
              {recap.reviewTradeIds.slice(0, 8).map((tradeId) => (
                <Link
                  key={tradeId}
                  className="border-t border-zinc-900 py-3 text-sm text-sky-300 hover:text-sky-200"
                  href={`/intelligence/trades/${tradeId}`}
                >
                  {tradeId}
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <div className="border border-zinc-800 bg-zinc-950 p-4">
            <h2 className="text-sm font-semibold text-zinc-100">
              Evidence To Review
            </h2>
            <div className="mt-4 grid gap-3">
              {polish.evidenceCards.slice(0, 6).map((card) => (
                <Link
                  key={card.id}
                  className="block border-t border-zinc-900 py-3 hover:text-sky-200"
                  href={card.primaryRoute}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-zinc-300">{card.title}</span>
                    <span className="text-xs uppercase tracking-wide text-zinc-500">
                      {card.confidence}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-zinc-500">
                    {card.reviewAction}
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="border border-zinc-800 bg-zinc-950 p-4">
            <h2 className="text-sm font-semibold text-zinc-100">
              Coach Queue
            </h2>
            <div className="mt-4 grid gap-3">
              {polish.coachReviewQueue.items.slice(0, 6).map((item) => (
                <Link
                  key={item.id}
                  className="block border-t border-zinc-900 py-3 hover:text-sky-200"
                  href={item.href}
                >
                  <div className="text-sm text-zinc-300">{item.title}</div>
                  <div className="mt-1 text-xs text-zinc-500">
                    {item.nextAction}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
