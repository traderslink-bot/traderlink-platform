import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { buildImportRecoveryReadModel } from "../../../src/lib/trader-analytics/server/import-recovery-read-model";
import { SqliteImportCommitRepository } from "../../../src/lib/trader-analytics/product/import-commit/sqlite-import-commit-repository";
import { ImportWorkflowStrip } from "../../import-workflow-strip";
import { ImportRepairActions } from "./import-repair-actions";
import { ImportRecoveryActions } from "./import-recovery-actions";

export const metadata: Metadata = {
  title: "Import Batch | Trader Intelligence",
};

export const dynamic = "force-dynamic";

function toneClass(status: string): string {
  return status === "committed" ||
    status === "ready_to_commit" ||
    status === "ready_to_save"
    ? "text-emerald-300"
    : status === "needs_repair" ||
        status === "blocked" ||
        status === "blocked_by_repairs"
      ? "text-rose-300"
      : "text-amber-300";
}

function decisionReviewToneClass(status: string): string {
  return status === "completed"
    ? "text-emerald-300"
    : status === "blocked_open_trade"
      ? "text-sky-300"
      : status === "market_context_unavailable" || status === "analysis_failed"
        ? "text-amber-300"
        : "text-zinc-300";
}

function countBy(values: string[]): Record<string, number> {
  return values.reduce<Record<string, number>>((counts, value) => {
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
}

function readableStatus(value: string): string {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function readableDecisionReviewStatus(value: string): string {
  if (value === "completed") {
    return "Reviewed With Chart Context";
  }

  if (value === "queued") {
    return "Waiting For Decision Review";
  }

  if (value === "blocked_open_trade" || value === "trade_open") {
    return "Open Trade";
  }

  if (value === "market_context_unavailable") {
    return "Chart Context Waiting";
  }

  if (value === "analysis_failed") {
    return "Needs Technical Follow-Up";
  }

  if (value === "skipped_limit" || value === "limit_reached") {
    return "Review Limit Reached";
  }

  return "Technical Follow-Up";
}

function batchStateLabel(status: string): string {
  return status === "committed"
    ? "Saved import"
    : status === "discarded"
      ? "Discarded preview"
      : readableStatus(status);
}

function batchStateDetail(status: string): string {
  if (status === "committed") {
    return "Saved trades are ready for review, analytics, and coaching.";
  }

  if (status === "ready_to_commit" || status === "ready_to_save") {
    return "Import rows are ready to save after final review.";
  }

  if (status === "needs_repair" || status === "blocked_by_repairs") {
    return "Repair the highlighted rows before saving this import.";
  }

  if (status === "discarded") {
    return "This preview was discarded and should not drive coaching.";
  }

  return "Use the action panel to continue this import.";
}

function diagnosticGuidance(status: string): string {
  if (status === "analysis_failed") {
    return "Decision-review analysis failed, so this trade stays in the manual review queue with conservative execution-only coaching.";
  }

  if (status === "market_context_unavailable") {
    return "Market context was unavailable, so coaching should not make support, resistance, candle, or setup claims.";
  }

  if (status === "blocked_open_trade") {
    return "The trade was saved while still open, so completed-trade coaching waits until the position is flat.";
  }

  if (status === "skipped_limit") {
    return "This job was skipped by the review run limit and can be resumed in a later review pass.";
  }

  return "Decision review status is tracked so the user can see which coaching outputs are ready and which need follow-up.";
}

function diagnosticUserMessage(status: string, code: string): string {
  if (status === "market_context_unavailable" || code === "market_context_unavailable") {
    return "Chart context was not available for this trade. Use execution review now and backfill chart context later.";
  }

  if (status === "blocked_open_trade" || code === "trade_open") {
    return "This trade was still open, so completed-trade coaching waits until the position is flat.";
  }

  if (status === "skipped_limit" || code === "limit_reached") {
    return "The review pass reached its limit before this trade could receive chart review.";
  }

  return "Chart analysis needs technical follow-up before it can support coaching.";
}

export default async function ImportBatchPage({
  params,
}: {
  params: Promise<{ batchId: string }>;
}) {
  const routeParams = await params;
  const batchId = decodeURIComponent(routeParams.batchId);
  const repository = new SqliteImportCommitRepository();
  const plan = repository.getPreviewPlan(batchId);
  const batch = repository.getImportBatch(batchId);
  const decisionReviewJobs = repository.listDecisionReviewJobs(batchId);
  const decisionReviewSnapshots =
    repository.listDecisionReviewSnapshotsForBatch(batchId);
  const decisionReviewDiagnostics =
    repository.listDecisionReviewDiagnosticsForBatch(batchId);
  const decisionReviewStatusCounts = countBy(
    decisionReviewJobs.map((job) => job.status),
  );
  const decisionReviewDiagnosticCodeCounts = countBy(
    decisionReviewDiagnostics.map((diagnostic) => diagnostic.code),
  );
  const decisionReviewStatusOrder = [
    "completed",
    "queued",
    "blocked_open_trade",
    "market_context_unavailable",
    "analysis_failed",
    "skipped_limit",
  ];

  if (!plan || !batch) {
    notFound();
  }

  const recovery = buildImportRecoveryReadModel({ repository, plan, batch });
  const workflowCurrentStep = batch.status === "committed" ? "review" : "recover";
  const workflowSummary =
    batch.status === "committed"
      ? "This import is saved. Continue into saved trades, the review queue, analytics, or coach from the saved-output links below."
      : "This import is still in the save-or-repair step. Resolve the visible blocker, duplicate, or acknowledgement before moving into saved trade review.";
  const firstSavedTrade = plan.savedTrades[0] ?? null;
  const savedPrimaryLink =
    batch.status === "committed"
      ? firstSavedTrade
        ? {
            label: "Review first saved trade",
            href: `/trades/${encodeURIComponent(firstSavedTrade.id)}?from=review-queue&queue=highest_priority`,
            detail:
              "Open the first saved trade with execution replay, checklist, and review scope.",
          }
        : {
            label: "Open highest-priority queue",
            href: "/review?queue=highest_priority",
            detail:
              "Open the saved review queue and start with the highest-priority item.",
          }
      : null;
  const savedOutputLinks =
    batch.status === "committed"
      ? [
          ["Saved trades", "/trades"],
          ["Review queue", "/review?queue=highest_priority"],
          ["Analytics", "/analytics"],
          ["Coach", "/coach"],
        ]
      : [];

  return (
    <main className="min-h-screen bg-zinc-950 px-5 py-8 text-zinc-100 sm:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="border-b border-zinc-800 pb-6">
          <Link className="text-sm text-sky-300 hover:text-sky-200" href="/imports">
            Back to imports
          </Link>
          <h1 className="mt-3 text-3xl font-semibold text-zinc-50">
            Import Batch
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-zinc-500">
            {batch.brokerLabel} / {batch.id}
          </p>
        </header>

        <ImportWorkflowStrip
          currentStep={workflowCurrentStep}
          summary={workflowSummary}
        />

        <section
          className="border border-zinc-800 bg-zinc-950 p-4"
          data-testid="import-batch-action-summary"
        >
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Import State
              </p>
              <h2 className={`mt-2 text-xl font-semibold ${toneClass(recovery.status)}`}>
                {recovery.title}
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
                {recovery.detail}
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs uppercase tracking-wide">
                <span className="border border-zinc-800 bg-zinc-950 px-2 py-1 text-zinc-400">
                  {batchStateLabel(batch.status)}
                </span>
                <span className="border border-zinc-800 bg-zinc-950 px-2 py-1 text-zinc-400">
                  {batch.acceptedExecutionCount} accepted executions
                </span>
                <span className="border border-zinc-800 bg-zinc-950 px-2 py-1 text-zinc-400">
                  {plan.savedTrades.length} saved trade records
                </span>
                {recovery.duplicate.duplicateFile ? (
                  <span className="border border-amber-900 bg-amber-950/20 px-2 py-1 text-amber-300">
                    duplicate file fingerprint
                  </span>
                ) : null}
              </div>
            </div>
            <div className="border border-zinc-900 bg-zinc-950 p-3">
              <div className="text-xs uppercase tracking-wide text-zinc-500">
                Next Action
              </div>
              <div className={`mt-2 text-sm font-semibold ${toneClass(recovery.status)}`}>
                {recovery.primaryAction.label}
              </div>
              <div className="mt-1 text-xs leading-5 text-zinc-500">
                {recovery.primaryAction.detail}
              </div>
              {savedPrimaryLink ? (
                <Link
                  className="mt-4 block border border-sky-800 bg-sky-950/40 px-3 py-3 text-sm font-medium text-sky-100 transition hover:border-sky-400"
                  data-testid="import-batch-primary-review-action"
                  href={savedPrimaryLink.href}
                >
                  {savedPrimaryLink.label}
                  <span className="mt-1 block text-xs font-normal leading-5 text-sky-200/80">
                    {savedPrimaryLink.detail}
                  </span>
                </Link>
              ) : null}
              {savedOutputLinks.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {savedOutputLinks.map(([label, href]) => (
                    <Link
                      className="border border-sky-900 bg-sky-950/30 px-2 py-1 text-xs text-sky-200 hover:border-sky-400"
                      href={href}
                      key={href}
                    >
                      {label}
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <div className="border border-zinc-800 bg-zinc-950 p-4">
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Batch Status
            </div>
            <div className={`mt-3 text-xl font-semibold ${toneClass(batch.status)}`}>
              {batchStateLabel(batch.status)}
            </div>
            <div className="mt-1 text-xs text-zinc-500">
              {batchStateDetail(batch.status)}
            </div>
          </div>
          <div className="border border-zinc-800 bg-zinc-950 p-4">
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Executions
            </div>
            <div className="mt-3 text-2xl font-semibold text-zinc-100">
              {batch.acceptedExecutionCount}
            </div>
          </div>
          <div className="border border-zinc-800 bg-zinc-950 p-4">
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Trades
            </div>
            <div className="mt-3 text-2xl font-semibold text-sky-300">
              {batch.requestCount}
            </div>
          </div>
          <div className="border border-zinc-800 bg-zinc-950 p-4">
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Review Snapshots
            </div>
            <div className="mt-3 text-2xl font-semibold text-emerald-300">
              {decisionReviewSnapshots.length}
            </div>
            <div className="mt-1 text-xs text-zinc-500">
              {decisionReviewJobs.length} review job(s), {decisionReviewDiagnostics.length} technical note(s)
            </div>
          </div>
        </section>

        <ImportRecoveryActions batchId={batch.id} recovery={recovery} />

        <ImportRepairActions
          batchId={batch.id}
          repairItems={plan.repairItems}
        />

        <section className="grid gap-6 xl:grid-cols-2">
          <div
            className="border border-zinc-800 bg-zinc-950 p-4"
            data-testid="decision-review-diagnostics"
            id="commit-decisions"
          >
            <h2 className="text-sm font-semibold text-zinc-100">
              Chart Context Review Status
            </h2>
            <p className="mt-1 text-xs leading-5 text-zinc-500">
              These statuses explain whether saved trades received completed
              chart review snapshots or stayed in conservative follow-up
              lanes. These are evidence limits, not instructions.
            </p>
            <div className="mt-4 grid gap-2">
              {decisionReviewJobs.length === 0 ? (
                <div className="text-sm text-zinc-500">
                  No decision-review jobs were created for this import.
                </div>
              ) : (
                decisionReviewStatusOrder
                  .filter((status) => decisionReviewStatusCounts[status] > 0)
                  .map((status) => (
                  <div key={status} className="border-t border-zinc-900 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className={`text-sm ${decisionReviewToneClass(status)}`}>
                        {readableStatus(status)}
                      </span>
                      <span className="font-mono text-xs text-sky-300">
                        {decisionReviewStatusCounts[status]}
                      </span>
                    </div>
                    <div className="mt-1 text-xs leading-5 text-zinc-500">
                      {diagnosticGuidance(status)}
                    </div>
                  </div>
                ))
              )}
            </div>
            {decisionReviewDiagnostics.length > 0 ? (
              <div className="mt-5 grid gap-2">
                <div className="text-xs uppercase tracking-wide text-zinc-500">
                  Technical Review Buckets
                </div>
                {Object.entries(decisionReviewDiagnosticCodeCounts).map(
                  ([code, count]) => (
                    <div key={code} className="border-t border-zinc-900 py-2">
                      <div className="flex items-center justify-between gap-3">
                        <span className={decisionReviewToneClass(code)}>
                          {readableDecisionReviewStatus(code)}
                        </span>
                        <span className="font-mono text-xs text-zinc-300">
                          {count}
                        </span>
                      </div>
                    </div>
                  ),
                )}
                <div className="mt-4 text-xs uppercase tracking-wide text-zinc-500">
                  Latest Technical Notes
                </div>
                {decisionReviewDiagnostics.slice(0, 5).map((diagnostic) => (
                  <div key={diagnostic.id} className="border-t border-zinc-900 py-3">
                    <div className={decisionReviewToneClass(diagnostic.status)}>
                      {diagnostic.symbol ?? "Import"} / {readableDecisionReviewStatus(diagnostic.code)}
                    </div>
                    <div className="mt-1 text-xs text-zinc-500">
                      {diagnosticUserMessage(diagnostic.status, diagnostic.code)}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div
            className="border border-zinc-800 bg-zinc-950 p-4"
            data-testid="import-batch-saved-trades"
          >
            <h2 className="text-sm font-semibold text-zinc-100">
              Saved Trades
            </h2>
            <p className="mt-1 text-xs leading-5 text-zinc-500">
              Open a saved trade to review executions, notes, checklist state,
              session timing, and any chart review notes.
            </p>
            <div className="mt-4 grid gap-2">
              {plan.savedTrades.length === 0 ? (
                <div className="text-sm text-zinc-500">
                  No saved trade records are available for this import yet.
                </div>
              ) : (
                plan.savedTrades.map((trade) => (
                  <Link
                    key={trade.id}
                    className="border-t border-zinc-900 py-3 text-sm hover:text-sky-200"
                    href={`/trades/${encodeURIComponent(trade.id)}`}
                  >
                    <div className="font-medium text-zinc-100">
                      {trade.symbol} / {trade.tradeDirection}
                    </div>
                    <div className="mt-1 text-xs text-zinc-500">
                      {readableStatus(trade.lifecycleStatus)} /{" "}
                      {trade.entryHourLabelEt}
                    </div>
                    <div className="mt-2 text-xs text-sky-300">
                      Open trade review
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          <div className="border border-zinc-800 bg-zinc-950 p-4">
            <h2 className="text-sm font-semibold text-zinc-100">
              Import Decisions
            </h2>
            <p className="mt-1 text-xs leading-5 text-zinc-500">
              Blocking decisions prevent save. Review decisions require an
              explicit acknowledgement before this import should be trusted.
            </p>
            <div className="mt-4 grid gap-2">
              {plan.requiredDecisions.length === 0 ? (
                <div className="text-sm text-emerald-300">
                  No unresolved commit decisions.
                </div>
              ) : (
                plan.requiredDecisions.map((decision) => (
                  <div key={decision.id} className="border-t border-zinc-900 py-3">
                    <div className={toneClass(decision.severity)}>
                      {readableStatus(decision.kind)}
                    </div>
                    <div className="mt-1 text-xs text-zinc-500">
                      {decision.message}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
