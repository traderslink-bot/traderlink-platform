import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "First Run | Trader Intelligence",
};

const readinessItems = [
  {
    label: "Saved trades",
    status: "not_started",
    detail: "No execution imports have been saved in this workspace.",
  },
  {
    label: "Analytics report",
    status: "waiting_for_import",
    detail: "Reports start after executions are imported and reviewed.",
  },
  {
    label: "Review history",
    status: "empty",
    detail: "Coach review items appear after at least one trade exists.",
  },
  {
    label: "Broker connection",
    status: "not_connected",
    detail: "Use CSV dry run now; live broker sync belongs to a later platform step.",
  },
  {
    label: "Market context",
    status: "observational_later",
    detail: "Candles, levels, and market structure stay in levels-system and do not score this flow.",
  },
];

const nextActions = [
  {
    title: "Try a CSV dry run",
    detail: "Paste or upload executions, map columns, repair rows, and preview execution-only feedback.",
    href: "/import-dry-run",
    cta: "Open CSV dry run",
  },
  {
    title: "Review import format expectations",
    detail: "Check the current broker import review surfaces before saving real data exists.",
    href: "/imports",
    cta: "Open import review",
  },
  {
    title: "See sample analytics",
    detail: "Use sample data to understand the product loop while your own trade history is still empty.",
    href: "/analytics",
    cta: "Open sample analytics",
  },
];

function toTestIdSegment(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function FirstRunPage() {
  return (
    <main className="min-h-screen bg-zinc-950 px-5 py-8 text-zinc-100 sm:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="border-b border-zinc-800 pb-6">
          <Link className="text-sm text-sky-300 hover:text-sky-200" href="/workspace">
            Back to workspace
          </Link>
          <p className="mt-6 text-xs font-semibold uppercase tracking-wide text-emerald-300">
            First User State
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-zinc-50">
            First Run Setup
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-zinc-500">
            Start here when there are no saved trades yet. This state is honest
            about what exists now and points the user toward execution import,
            repair, and feedback preview.
          </p>
        </header>

        <section className="border border-emerald-900/70 bg-emerald-950/10 p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-zinc-100">
                Start With One Clean Import
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
                A single closed-trade CSV is enough to unlock saved trades,
                execution replay, coach review, and progress tracking. Market
                context can be backfilled later when candle data is available.
              </p>
            </div>
            <Link
              className="border border-emerald-700 bg-emerald-950/40 px-4 py-3 text-sm font-medium text-emerald-100 transition hover:border-emerald-300"
              data-testid="first-run-action-primary-import"
              href="/import-dry-run"
            >
              Open CSV dry run
            </Link>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-5" data-testid="first-run-status-grid">
          {readinessItems.map((item) => (
            <div key={item.label} className="border border-zinc-800 bg-zinc-950 p-4">
              <div className="text-xs uppercase tracking-wide text-zinc-500">
                {item.label}
              </div>
              <div className="mt-3 font-mono text-sm text-amber-300">
                {item.status}
              </div>
              <div className="mt-2 text-xs text-zinc-500">{item.detail}</div>
            </div>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,0.55fr)_minmax(320px,0.45fr)]">
          <div className="border border-zinc-800 bg-zinc-950 p-5">
            <h2 className="text-sm font-semibold text-zinc-100">
              What Works Before Saved Trades
            </h2>
            <div className="mt-4 grid gap-3">
              {[
                "CSV parsing, broker selection, and local file upload.",
                "Column mapping and rejected-row repair in a dry run.",
                "Execution-only feedback preview from the imported rows.",
                "Sample analytics for learning the review loop while trade history is empty.",
              ].map((item) => (
                <div key={item} className="border-t border-zinc-900 py-3 text-sm text-zinc-400">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="border border-zinc-800 bg-zinc-950 p-5">
            <h2 className="text-sm font-semibold text-zinc-100">
              What Is Not Live Yet
            </h2>
            <div className="mt-4 grid gap-3">
              {[
                "No multi-user account isolation is enabled in this local beta workspace.",
                "No broker account is connected from this app.",
                "No billing or plan enforcement is active here.",
                "No export or download workflow is offered to end users.",
                "No market-structure scoring is used in execution feedback.",
              ].map((item) => (
                <div key={item} className="border-t border-zinc-900 py-3 text-sm text-zinc-400">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-zinc-100">
            Recommended First Actions
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {nextActions.map((action) => (
              <Link
                key={action.title}
                className="block border border-zinc-800 bg-zinc-950 p-5 transition hover:border-sky-400"
                data-testid={`first-run-action-${toTestIdSegment(action.href)}`}
                href={action.href}
              >
                <div className="text-sm font-semibold text-zinc-50">
                  {action.title}
                </div>
                <div className="mt-2 text-sm text-zinc-500">{action.detail}</div>
                <div className="mt-4 text-sm text-sky-300">{action.cta}</div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
