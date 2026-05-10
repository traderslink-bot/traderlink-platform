import Link from "next/link";
import type { Metadata } from "next";
import { MetricCard, PrimaryActionPanel, plainStateLabel } from "../app-ui";
import { buildSavedReviewQueueReadModel } from "../../src/lib/trader-analytics/server/saved-review-queue";
import { buildSavedOrSampleTraderAnalyticsViewModel } from "../../src/lib/trader-analytics/server/saved-trader-analytics-data";
import {
  DEMO_ACCOUNT_ID,
  SqliteImportCommitRepository,
} from "../../src/lib/trader-analytics/product/import-commit/sqlite-import-commit-repository";

export const metadata: Metadata = {
  title: "Trader Workspace | Trader Intelligence",
};

export const dynamic = "force-dynamic";

const primaryActions = [
  {
    href: "/import-dry-run",
    label: "Import trades",
    eyebrow: "Start here",
    detail:
      "Upload or paste broker executions, fix missing rows, review grouping, and save a clean import.",
    meta: ["upload", "repair", "save"],
  },
  {
    href: "/trades",
    label: "Review next trade",
    eyebrow: "Work queue",
    detail:
      "Open saved executions, replay entries/adds/reductions/exits, and work each trade review.",
    meta: ["replay", "checklist", "queue"],
  },
  {
    href: "/analytics",
    label: "Check analytics",
    eyebrow: "Report",
    detail:
      "See gross P/L, session timing, repeated execution habits, and trades behind each number.",
    meta: ["charts", "filters", "habits"],
  },
  {
    href: "/coach",
    label: "Open coach",
    eyebrow: "Next action",
    detail:
      "Turn saved trade evidence into a plain review plan for the next session.",
    meta: ["avoid", "repeat", "review"],
  },
] as const;

const endUserRoutes = [
  {
    href: "/analytics",
    label: "Analytics report",
    detail: "Saved execution analytics, behavior trends, charts, filters, and trade links.",
  },
  {
    href: "/review",
    label: "Review queue",
    detail: "Highest-priority trades, chart context waiting items, lesson drafts, and review flow.",
  },
  {
    href: "/progress",
    label: "Progress",
    detail: "Quality trend, rule effectiveness, behavior change, and report history.",
  },
  {
    href: "/session-recap",
    label: "Session Recap",
    detail: "Best trade, biggest leak, repeatable behavior, and next-session focus.",
  },
  {
    href: "/compare-trades",
    label: "Compare Trades",
    detail: "Best/worst trade comparison and lesson extraction once enough trades exist.",
  },
  {
    href: "/onboarding",
    label: "Onboarding",
    detail: "User setup path across import, review, rule creation, and coaching habits.",
  },
] as const;

const supportRoutes = [
  {
    href: "/first-run",
    label: "First run setup",
    detail: "Honest empty-state path for a user with no saved imports yet.",
  },
  {
    href: "/imports",
    label: "Import history",
    detail: "Committed imports, recovery work, duplicate review, and saved output links.",
  },
] as const;

function RouteLink({
  detail,
  href,
  label,
}: {
  detail: string;
  href: string;
  label: string;
}) {
  return (
    <Link
      className="block border border-zinc-800 bg-zinc-950 p-4 transition hover:border-sky-400"
      href={href}
    >
      <div className="text-sm font-semibold text-zinc-50">{label}</div>
      <div className="mt-2 text-sm leading-6 text-zinc-500">{detail}</div>
    </Link>
  );
}

export default function WorkspacePage() {
  const data = buildSavedOrSampleTraderAnalyticsViewModel();
  const savedReviewQueue =
    data.mode === "saved"
      ? buildSavedReviewQueueReadModel({
          repository: data.repository,
          userId: data.userId,
        })
      : null;
  const importHistory =
    data.mode === "saved"
      ? new SqliteImportCommitRepository().listImportBatchHistory(DEMO_ACCOUNT_ID)
      : [];
  const latestImport = importHistory[0] ?? null;
  const latestReport = data.viewModel.latestReport;
  const savedTrades = data.repository.listTrades(data.userId);
  const marketGapCount =
    savedReviewQueue?.tabs.find((tab) => tab.id === "market_context_unavailable")
      ?.count ?? 0;
  const openBlockCount =
    savedReviewQueue?.tabs.find((tab) => tab.id === "blocked_open_trade")
      ?.count ?? 0;
  const nextReviewHref =
    (savedReviewQueue?.items[0]?.href ?? null) || "/review?queue=highest_priority";

  return (
    <main className="min-h-screen bg-zinc-950 px-5 py-8 text-zinc-100 sm:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="border-b border-zinc-800 pb-6">
          <Link className="text-sm text-sky-300 hover:text-sky-200" href="/">
            Back to homepage
          </Link>
          <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-emerald-400">
            Trader Intelligence
          </p>
          <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-zinc-50">
                Trader Workspace
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-500">
                Start here, then move in order: import trades, review the next
                saved trade, check analytics, and open the coach.
              </p>
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-4">
          <MetricCard
            label="Data Source"
            value={plainStateLabel(data.mode === "saved" ? "saved_sqlite" : "sample_fallback")}
            detail={
              data.mode === "saved"
                ? "Saved imports are powering the app."
                : "Save an import to replace sample state."
            }
            tone={data.mode === "saved" ? "success" : "warning"}
          />
          <Link
            className="block border border-zinc-800 bg-zinc-950 p-4 transition hover:border-sky-400"
            href="/trades"
          >
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Saved Trades
            </div>
            <div className="mt-3 text-2xl font-semibold text-zinc-100">
              {savedTrades.length}
            </div>
            <div className="mt-1 text-xs text-zinc-500">
              {latestReport.reportPeriod.label}
            </div>
          </Link>
          <Link
            className="block border border-zinc-800 bg-zinc-950 p-4 transition hover:border-sky-400"
            href={nextReviewHref}
          >
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Review Queue
            </div>
            <div className="mt-3 text-2xl font-semibold text-sky-300">
              {savedReviewQueue?.allItems.length ?? 0}
            </div>
            <div className="mt-1 text-xs text-zinc-500">
              {savedReviewQueue?.items[0]?.stateLabel ?? "No saved review queue yet."}
            </div>
          </Link>
          <Link
            className="block border border-zinc-800 bg-zinc-950 p-4 transition hover:border-amber-400"
            href="/review?queue=market_context_unavailable"
          >
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Needs Chart Context
            </div>
            <div className="mt-3 text-2xl font-semibold text-amber-300">
              {marketGapCount}
            </div>
            <div className="mt-1 text-xs text-zinc-500">
              {openBlockCount} open trade item(s)
            </div>
          </Link>
        </section>

        <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <PrimaryActionPanel
            actionHref={data.mode === "saved" ? nextReviewHref : "/import-dry-run"}
            actionLabel={data.mode === "saved" ? "Open Trade Review" : "Import trades"}
            body={
              savedReviewQueue?.items[0]?.nextAction ??
              "Import a broker CSV, save the preview, then review the first saved trade."
            }
            eyebrow="Next step"
            title={data.mode === "saved" ? "Review this trade next" : "Import trades first"}
            tone="info"
          />

          <div className="border border-zinc-800 bg-zinc-950 p-4">
            <h2 className="text-sm font-semibold text-zinc-100">
              Latest Import
            </h2>
            <div className="mt-3 text-sm text-zinc-300">
              {latestImport?.batch.brokerLabel ?? "No saved import yet"}
            </div>
            <div className="mt-1 text-xs text-zinc-500">
              {latestImport
                ? `${latestImport.savedTradeCount} trade(s), ${latestImport.summaryStatus}`
                : "Import a broker CSV to start the saved workflow."}
            </div>
            <Link
              className="mt-4 inline-block text-sm text-sky-300 hover:text-sky-200"
              href={
                latestImport
                  ? `/imports/${encodeURIComponent(latestImport.batch.id)}`
                  : "/import-dry-run"
              }
            >
              {latestImport ? "Open import" : "Import trades"}
            </Link>
          </div>
        </section>

        <section
          className="grid gap-5 lg:grid-cols-4"
          data-testid="workspace-primary-actions"
        >
          {primaryActions.map((action) => (
            <Link
              className="block border border-emerald-900/70 bg-emerald-950/10 p-5 transition hover:border-emerald-400"
              href={action.href}
              key={action.href}
            >
              <div className="text-xs font-semibold uppercase tracking-wide text-emerald-300">
                {action.eyebrow}
              </div>
              <div className="mt-3 text-lg font-semibold text-zinc-50">
                {action.label}
              </div>
              <div className="mt-2 text-sm leading-6 text-zinc-400">
                {action.detail}
              </div>
              <div className="mt-5 grid grid-cols-3 gap-2 text-xs uppercase tracking-wide text-zinc-500">
                {action.meta.map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
            </Link>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div>
            <h2 className="text-sm font-semibold text-zinc-100">
              App Areas
            </h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {endUserRoutes.map((route) => (
                <RouteLink key={route.href} {...route} />
              ))}
            </div>
          </div>

          <aside>
            <h2 className="text-sm font-semibold text-zinc-100">
              Setup
            </h2>
            <div className="mt-4 grid gap-4">
              {supportRoutes.map((route) => (
                <RouteLink key={route.href} {...route} />
              ))}
            </div>
          </aside>
        </section>

        <section className="border border-zinc-800 bg-zinc-950 p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-zinc-100">
                Current Beta Boundary
              </h2>
              <p className="mt-1 text-sm leading-6 text-zinc-500">
                Local SQLite is useful for controlled single-user or trusted
                closed-beta review. Multi-user launch still needs auth, account
                isolation, authorization, backups, migrations, and deletion
                controls.
              </p>
            </div>
            <Link
              className="text-sm text-zinc-500 hover:text-amber-200"
              href="/workspace/admin"
            >
              Internal tools
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
