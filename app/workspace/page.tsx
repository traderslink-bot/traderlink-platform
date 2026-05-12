import Link from "next/link";
import type { Metadata } from "next";
import {
  AdvancedDisclosure,
  MetricCard,
  PrimaryActionPanel,
  WorkflowHandoffPanel,
  plainStateLabel,
  withPageAnchor,
} from "../app-ui";
import { buildSavedReviewQueueReadModel } from "../../src/lib/trader-analytics/server/saved-review-queue";
import { buildSavedOrSampleTraderAnalyticsViewModel } from "../../src/lib/trader-analytics/server/saved-trader-analytics-data";
import {
  DEMO_ACCOUNT_ID,
  SqliteImportCommitRepository,
} from "../../src/lib/trader-analytics/product/import-commit/sqlite-import-commit-repository";
import {
  importCountLabel,
  importStatusLabel,
} from "../../src/lib/trader-analytics/product/import-user-copy";

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
    href: "/coach#next-action",
    label: "Open coach",
    eyebrow: "Next action",
    detail:
      "Turn saved trade evidence into a plain review plan for the next session.",
    meta: ["avoid", "repeat", "review"],
  },
] as const;

const endUserRoutes = [
  {
    href: "/trades",
    label: "Saved trades",
    detail: "Browse saved executions, open review workspaces, and group ticker stories.",
  },
  {
    href: "/analytics",
    label: "Analytics report",
    detail: "Saved execution analytics, behavior trends, charts, filters, and trade links.",
  },
  {
    href: "/review",
    label: "Review queue",
    detail: "Highest-priority trades, chart data gaps, lesson drafts, and review flow.",
  },
  {
    href: "/progress",
    label: "Progress",
    detail: "Quality trend, rule effectiveness, behavior change, and report history.",
  },
  {
    href: "/coach#next-action",
    label: "Coach",
    detail: "Overall focus, evidence trades, next-session plan, and progress follow-through.",
  },
] as const;

const additionalReviewRoutes = [
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
    detail: "Saved imports, recovery work, duplicate review, and saved output links.",
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
      className="ti-panel-soft block min-h-[120px] p-4 transition hover:border-sky-500"
      href={href}
    >
      <div className="text-sm font-semibold text-zinc-50">{label}</div>
      <div className="mt-2 text-sm leading-6 text-zinc-400">{detail}</div>
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
  const rawNextReviewHref =
    (savedReviewQueue?.items[0]?.href ?? null) || "/review?queue=highest_priority";
  const nextReviewHref = rawNextReviewHref.startsWith("/trades/")
    ? withPageAnchor(rawNextReviewHref, "writing-flow")
    : rawNextReviewHref;

  return (
    <main className="ti-dashboard-bg min-h-screen px-5 py-8 text-zinc-100 sm:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="ti-panel p-6">
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
                Start here, then follow the same loop each time: import saved
                executions, review the next trade, check the report, and open
                the coach.
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
            className="ti-metric-card block min-h-[96px] min-w-0 p-4 transition hover:border-sky-500"
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
            className="ti-metric-card block min-h-[96px] min-w-0 p-4 transition hover:border-sky-500"
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
            className="ti-metric-card block min-h-[96px] min-w-0 p-4 transition hover:border-amber-500"
            href="/review?queue=market_context_unavailable"
          >
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Chart data still missing
            </div>
            <div className="mt-3 text-2xl font-semibold text-amber-300">
              {marketGapCount}
            </div>
            <div className="mt-1 text-xs text-zinc-500">
              {openBlockCount === 0
                ? "Some trades can be replayed now, while chart, level, or volume evidence may still be waiting."
                : `${openBlockCount} open trade${openBlockCount === 1 ? "" : "s"} can be replayed now but still need execution review`}
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
            eyebrow="Your next step"
            title={data.mode === "saved" ? "Review this trade next" : "Import trades first"}
            tone="info"
          />

          <div className="ti-panel p-4">
            <h2 className="text-sm font-semibold text-zinc-100">
              Latest Import
            </h2>
            <div className="mt-3 text-sm text-zinc-300">
              {latestImport?.batch.brokerLabel ?? "No saved import yet"}
            </div>
            <div className="mt-1 text-xs text-zinc-500">
              {latestImport
                ? `${importCountLabel(
                    latestImport.savedTradeCount,
                    "trade",
                  )}, ${importStatusLabel(latestImport.summaryStatus)}`
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
          data-testid="workspace-primary-actions"
        >
          <WorkflowHandoffPanel
            body="Use the workspace as the product home: save clean executions, review the next trade, then check analytics and coaching follow-through."
            eyebrow="Workspace Flow"
            items={primaryActions.map((action, index) => ({
              action:
                index === 0
                  ? "Upload CSV"
                  : index === 1
                    ? "Open review"
                    : index === 2
                      ? "Open report"
                      : "Open coach",
              body: action.detail,
              href: index === 1 ? nextReviewHref : action.href,
              label: `${index + 1}. ${action.eyebrow}`,
              title: action.label,
              tone:
                index === 0
                  ? "info"
                  : index === 1
                    ? "warning"
                    : index === 2
                      ? "success"
                      : "info",
            }))}
            title="Trade review workflow"
          />
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="ti-panel p-5">
            <h2 className="text-sm font-semibold text-zinc-100">
              App Areas
            </h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {endUserRoutes.map((route) => (
                <RouteLink key={route.href} {...route} />
              ))}
            </div>
            <div className="mt-5">
              <AdvancedDisclosure
                summary="More review tools"
                testId="workspace-additional-review-tools"
              >
                <div>
                  <p className="text-sm leading-6 text-zinc-500">
                    These pages are supporting views. Start with import, saved
                    trades, review queue, analytics, and coach first.
                  </p>
                  <div className="mt-4 grid gap-4 md:grid-cols-3">
                    {additionalReviewRoutes.map((route) => (
                      <RouteLink key={route.href} {...route} />
                    ))}
                  </div>
                </div>
              </AdvancedDisclosure>
            </div>
          </div>

          <aside className="ti-panel p-5">
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

        <AdvancedDisclosure summary="Beta storage and admin notes">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p className="max-w-4xl text-sm leading-6 text-zinc-400">
              Saved import data is currently intended for controlled beta review.
              A wider multi-user launch still needs account isolation, backups,
              migrations, and deletion controls.
            </p>
            <Link
              className="text-sm text-zinc-400 hover:text-amber-200"
              href="/workspace/admin"
            >
              Workspace admin
            </Link>
          </div>
        </AdvancedDisclosure>
      </div>
    </main>
  );
}
