import Link from "next/link";
import type { Metadata } from "next";
import {
  MetricCard,
  PlainStateBadge,
  PrimaryActionPanel,
  plainStateLabel,
} from "../app-ui";
import { SavedImportSourceCaution } from "../saved-import-source-caution";
import { buildGuidedReviewSession } from "../../src/lib/trader-analytics";
import { buildSavedOrSampleTraderAnalyticsViewModel } from "../../src/lib/trader-analytics/server/saved-trader-analytics-data";
import { buildSavedDecisionReviewReadModel } from "../../src/lib/trader-analytics/server/saved-decision-review-service";
import { buildSavedReviewQueueReadModel } from "../../src/lib/trader-analytics/server/saved-review-queue";
import { buildLatestSavedImportSourceCautionReadModel } from "../../src/lib/trader-analytics/server/saved-import-source-caution";
import { SavedReviewQueueActions } from "./saved-review-queue-actions";

export const metadata: Metadata = {
  title: "Guided Review | Trader Intelligence",
};

export const dynamic = "force-dynamic";

function savedReviewToneClass(status: string): string {
  return status === "completed"
    ? "text-emerald-300"
    : status === "market_context_unavailable" || status === "analysis_failed"
      ? "text-amber-300"
      : status === "blocked_open_trade"
        ? "text-sky-300"
        : "text-zinc-300";
}

function savedReviewStateTone(lane: string): string {
  return lane === "completed"
    ? "text-emerald-300"
    : lane === "blocked_open_trade"
      ? "text-sky-300"
      : lane === "market_context_unavailable" || lane === "analysis_failed"
        ? "text-amber-300"
        : "text-zinc-300";
}

export default async function GuidedReviewPage({
  searchParams,
}: {
  searchParams?: Promise<{ queue?: string }>;
}) {
  const query = await searchParams;
  const data = buildSavedOrSampleTraderAnalyticsViewModel();
  const analytics = data.viewModel;
  const review = buildGuidedReviewSession({ analytics });
  const coach = analytics.improvementIntelligence.dailyCoachReport;
  const polish = analytics.productPolish;
  const habit = analytics.reviewHabitLoop;
  const savedDecisionReview =
    data.mode === "saved"
      ? buildSavedDecisionReviewReadModel({ repository: data.repository })
      : null;
  const savedReviewQueue =
    data.mode === "saved"
      ? buildSavedReviewQueueReadModel({
          repository: data.repository,
          activeFilter: query?.queue,
        })
      : null;
  const importSourceCaution =
    data.mode === "saved"
      ? buildLatestSavedImportSourceCautionReadModel({
          repository: data.repository,
        })
      : null;
  const primaryReviewItem =
    savedReviewQueue?.items[0] ?? savedReviewQueue?.allItems[0] ?? null;
  const highestPriorityCount =
    savedReviewQueue?.tabs.find((tab) => tab.id === "highest_priority")?.count ?? 0;
  const marketGapCount =
    savedReviewQueue?.tabs.find((tab) => tab.id === "market_context_unavailable")?.count ?? 0;
  const openBlockCount =
    savedReviewQueue?.tabs.find((tab) => tab.id === "blocked_open_trade")?.count ?? 0;

  return (
    <main className="min-h-screen bg-zinc-950 px-5 py-8 text-zinc-100 sm:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="border-b border-zinc-800 pb-6">
          <Link className="text-sm text-sky-300 hover:text-sky-200" href="/workspace">
            Back to workspace
          </Link>
          <h1 className="mt-3 text-3xl font-semibold text-zinc-50">
            {review.title}
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-zinc-500">
            {review.summary}
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <MetricCard
            label="Primary Trades"
            value={review.primaryTradeIds.length}
            detail="Trades connected to this guided review."
          />
          <MetricCard
            label="Review Steps"
            value={review.steps.length}
            detail="The checklist path for this review session."
            tone="info"
          />
          <MetricCard
            label="Suggested Lesson"
            value={plainStateLabel(review.suggestedLesson.status)}
            detail="Draft only until you write the final lesson."
            tone="success"
          />
        </section>

        <SavedImportSourceCaution
          caution={importSourceCaution}
          surface="review"
        />

        <PrimaryActionPanel
          actionHref={primaryReviewItem?.href ?? "/import-dry-run"}
          actionLabel={primaryReviewItem ? "Open Trade Review" : "Import trades"}
          body={
            primaryReviewItem
              ? primaryReviewItem.stateDetail
              : data.mode === "saved"
                ? savedReviewQueue?.emptyState.body
                : "The review page is showing sample guidance until a broker CSV is saved."
          }
          eyebrow="Review This First"
          secondary={
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                {
                  label: "Highest Priority",
                  count: highestPriorityCount,
                  href: "/review?queue=highest_priority",
                  tone: "warning" as const,
                },
                {
                  label: "Chart Context Waiting",
                  count: marketGapCount,
                  href: "/review?queue=market_context_unavailable",
                  tone: "warning" as const,
                },
                {
                  label: "Open Trades",
                  count: openBlockCount,
                  href: "/review?queue=blocked_open_trade",
                  tone: "info" as const,
                },
              ].map((item) => (
                <Link
                  className="border border-zinc-800 bg-black/20 p-3 hover:border-sky-500"
                  href={item.href}
                  key={item.label}
                >
                  <div className="text-xs uppercase tracking-wide text-zinc-500">
                    {item.label}
                  </div>
                  <div className={`mt-2 text-2xl font-semibold ${
                    item.tone === "info" ? "text-sky-300" : "text-amber-300"
                  }`}>
                    {item.count}
                  </div>
                </Link>
              ))}
            </div>
          }
          testId="review-continuation-panel"
          title={
            primaryReviewItem
              ? `${primaryReviewItem.symbol} is first in this review lane`
              : data.mode === "saved"
                ? "No urgent saved review item in this lane"
                : "Save an import to build a saved review queue"
          }
          tone="info"
        />

        <section className="grid gap-6 xl:grid-cols-2">
          <div
            className="border border-zinc-800 bg-zinc-950 p-4"
            data-testid="saved-decision-review-status"
          >
            <h2 className="text-sm font-semibold text-zinc-100">
              Chart Context Review
            </h2>
            {savedDecisionReview ? (
              <>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <div className="border-t border-zinc-900 py-3">
                    <div className="text-xs uppercase tracking-wide text-zinc-500">
                      Completed
                    </div>
                    <div className="mt-2 text-2xl font-semibold text-emerald-300">
                      {savedDecisionReview.completedCount}
                    </div>
                  </div>
                  <div className="border-t border-zinc-900 py-3">
                    <div className="text-xs uppercase tracking-wide text-zinc-500">
                      Chart Context Waiting
                    </div>
                    <div className="mt-2 text-2xl font-semibold text-amber-300">
                      {savedDecisionReview.marketContextUnavailableCount}
                    </div>
                  </div>
                  <div className="border-t border-zinc-900 py-3">
                    <div className="text-xs uppercase tracking-wide text-zinc-500">
                      Open Trades
                    </div>
                    <div className="mt-2 text-2xl font-semibold text-sky-300">
                      {savedDecisionReview.blockedOpenTradeCount}
                    </div>
                  </div>
                </div>
                <div className="mt-4 grid gap-2 md:grid-cols-2">
                  {([
                    ["Waiting", savedDecisionReview.queuedCount],
                    ["Manual follow-up", savedDecisionReview.analysisFailedCount],
                    ["Skipped", savedDecisionReview.skippedLimitCount],
                    ["Technical review items", savedDecisionReview.diagnostics.length],
                  ] as Array<[string, number]>).map(([label, count]) => (
                    <div key={label} className="border-t border-zinc-900 py-2">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs uppercase tracking-wide text-zinc-500">
                          {label}
                        </span>
                        <span className="font-mono text-xs text-zinc-300">
                          {count}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 text-xs text-zinc-500">
                  {savedDecisionReview.nextAction}
                </div>
                {Object.keys(savedDecisionReview.diagnosticCodeCounts).length > 0 ? (
                  <details className="mt-5 border-t border-zinc-900 pt-3">
                    <summary className="cursor-pointer text-xs uppercase tracking-wide text-zinc-500">
                      Technical review limits
                    </summary>
                    <div className="mt-3 grid gap-2">
                      {Object.entries(savedDecisionReview.diagnosticCodeCounts).map(
                        ([code, count]) => (
                          <div key={code} className="border-t border-zinc-900 py-2">
                            <div className="flex items-center justify-between gap-3">
                              <span className={savedReviewToneClass(code)}>
                                {code.replaceAll("_", " ")}
                              </span>
                              <span className="font-mono text-xs text-zinc-300">
                                {count}
                              </span>
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  </details>
                ) : null}
                <div className="mt-5 grid gap-3">
                  {savedDecisionReview.snapshots.slice(0, 4).map((snapshot) => (
                    <Link
                      key={snapshot.id}
                      className="block border-t border-zinc-900 py-3 hover:text-sky-200"
                      href={`/trades/${encodeURIComponent(snapshot.savedTradeId)}?from=review-queue&queue=completed`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm text-zinc-300">
                          {snapshot.symbol}
                        </span>
                        <span className="text-xs uppercase tracking-wide text-zinc-500">
                          {snapshot.review.marketContextSource ?? "none"}
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-zinc-500">
                        {snapshot.review.coachingHeadline ??
                          "Chart context review saved."}
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            ) : (
              <div className="mt-4 text-sm text-zinc-500">
                Save an import to persist decision-review snapshots.
              </div>
            )}
          </div>

          <div className="border border-zinc-800 bg-zinc-950 p-4">
            <h2 className="text-sm font-semibold text-zinc-100">
              Playbook Drafts
            </h2>
            <div className="mt-4 grid gap-3">
              {habit.playbookDrafting.drafts.slice(0, 5).map((draft) => (
                <div key={draft.id} className="border-t border-zinc-900 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-zinc-300">{draft.title}</span>
                    <span className="text-xs uppercase tracking-wide text-zinc-500">
                      {draft.readiness}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-zinc-500">
                    {draft.nextAction}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border border-zinc-800 bg-zinc-950 p-4">
            <h2 className="text-sm font-semibold text-zinc-100">
              Advanced Coach Wording Checks
            </h2>
            <div className="mt-3 text-2xl font-semibold text-emerald-300">
              {habit.safetyCopyAudit.passed ? "Pass" : "Review"}
            </div>
            <div className="mt-2 text-xs text-zinc-500">
              {habit.safetyCopyAudit.checkedTextCount} product copy item(s)
              checked.
            </div>
            <div className="mt-4 grid gap-2">
              {habit.coachLanguageRefinement.guidelines.map((item) => (
                <div key={item.id} className="border-t border-zinc-900 py-2">
                  <div className="text-sm text-zinc-300">{item.label}</div>
                  <div className="mt-1 text-xs text-zinc-500">
                    {item.guidance}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {savedReviewQueue ? (
          <section
            className="border border-zinc-800 bg-zinc-950 p-4"
            data-testid="saved-review-queue"
          >
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h2 className="text-sm font-semibold text-zinc-100">
                  Saved Review Queue
                </h2>
                <div className="mt-1 text-sm text-zinc-500">
                  {savedReviewQueue.emptyState.body}
                </div>
              </div>
              <Link
                className="text-sm text-sky-300 hover:text-sky-200"
                href="/trades"
              >
                Open saved trades
              </Link>
            </div>
            <div className="mt-4 flex flex-wrap gap-2" data-testid="saved-review-queue-tabs">
              {savedReviewQueue.tabs.map((tab) => (
                <Link
                  key={tab.id}
                  className={`border px-3 py-2 text-xs uppercase tracking-wide ${
                    tab.id === savedReviewQueue.activeFilter
                      ? "border-sky-400 text-sky-200"
                      : "border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
                  }`}
                  data-testid={`saved-review-queue-tab-${tab.id}`}
                  href={tab.href}
                >
                  {tab.label} {tab.count}
                </Link>
              ))}
            </div>
            <div className="mt-5 grid gap-3">
              {savedReviewQueue.items.length === 0 ? (
                <div
                  className="border-t border-zinc-900 py-4 text-sm text-zinc-500"
                  data-testid="saved-review-queue-empty"
                >
                  {savedReviewQueue.emptyState.title}
                </div>
              ) : (
                savedReviewQueue.items.slice(0, 12).map((item) => (
                  <div
                    key={item.id}
                    className="grid gap-3 border-t border-zinc-900 py-3 md:grid-cols-[minmax(0,1fr)_170px_120px_220px]"
                    data-testid={`saved-review-queue-item-${item.savedTradeId}`}
                  >
                    <div>
                      <Link
                        className="flex flex-wrap items-center gap-2 hover:text-sky-200"
                        href={item.href}
                      >
                        <span className="text-sm font-medium text-zinc-100">
                          {item.title}
                        </span>
                        <span className="text-xs uppercase tracking-wide text-amber-300">
                          {item.priorityLabel}
                        </span>
                      </Link>
                      <div className="mt-1 text-xs text-zinc-500">
                        {item.detail}
                      </div>
                      <div
                        className="mt-3 border-l border-zinc-800 pl-3"
                        data-testid={`saved-review-queue-state-${item.savedTradeId}`}
                      >
                        <div className={`text-xs font-semibold ${savedReviewStateTone(item.lane)}`}>
                          {item.stateLabel}
                        </div>
                        <div className="mt-1 text-xs leading-5 text-zinc-500">
                          {item.stateDetail}
                        </div>
                        <div className="mt-2 text-xs text-zinc-300">
                          Next: {item.nextAction}
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-sky-300">
                        {item.priorityReason}
                      </div>
                      <details className="mt-2 text-xs text-zinc-600">
                        <summary className="cursor-pointer text-zinc-500">
                          Review state details
                        </summary>
                        <div className="mt-1 uppercase tracking-wide">
                          {item.reviewStatus}
                        </div>
                      </details>
                    </div>
                    <div className="text-xs uppercase tracking-wide text-zinc-500">
                      <PlainStateBadge state={item.lane} tone="muted" />
                      <div className="mt-2 normal-case leading-5 text-zinc-500">
                        {item.reviewScopeLabel}
                      </div>
                    </div>
                    <div className="font-mono text-xs text-zinc-400">
                      {item.grossRealizedPnl === null
                        ? "P/L n/a"
                        : `P/L ${item.grossRealizedPnl >= 0 ? "+" : ""}${item.grossRealizedPnl.toFixed(2)}`}
                    </div>
                    <div className="flex flex-col gap-2">
                      <Link
                        className="border border-sky-800 bg-sky-950/30 px-3 py-2 text-center text-xs font-medium text-sky-100 transition hover:border-sky-400"
                        href={item.href}
                      >
                        Open Trade Review
                      </Link>
                      <SavedReviewQueueActions
                      currentStatus={item.reviewStatus}
                      tradeId={item.savedTradeId}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        ) : (
          <section
            className="border border-zinc-800 bg-zinc-950 p-4"
            data-testid="saved-review-queue"
          >
            <h2 className="text-sm font-semibold text-zinc-100">
              Saved Review Queue
            </h2>
            <div className="mt-3 text-sm text-zinc-500">
              Save an import to replace sample review content with a saved queue.
            </div>
          </section>
        )}

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.45fr)]">
          <div className="border border-zinc-800 bg-zinc-950 p-4">
            <h2 className="text-sm font-semibold text-zinc-100">
              Coach Review Queue
            </h2>
            <div className="mt-4 grid gap-3">
              {polish.coachReviewQueue.items.slice(0, 6).map((item) => (
                <Link
                  key={item.id}
                  className="block border-t border-zinc-900 py-3 hover:text-sky-200"
                  data-testid={`review-queue-link-${item.id}`}
                  href={item.href}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-zinc-300">{item.title}</span>
                    <span className="text-xs uppercase tracking-wide text-zinc-500">
                      {item.lane}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-zinc-500">
                    {item.nextAction}
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="border border-zinc-800 bg-zinc-950 p-4">
            <h2 className="text-sm font-semibold text-zinc-100">
              Session Recap
            </h2>
            <div className="mt-4 border-t border-zinc-900 py-3 text-sm text-zinc-300">
              {polish.sessionRecap.headline}
            </div>
            <div className="text-xs text-zinc-500">
              {polish.sessionRecap.nextAction}
            </div>
            <Link
              className="mt-4 inline-block text-sm text-sky-300 hover:text-sky-200"
              href="/session-recap"
            >
              Open session recap
            </Link>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.4fr)]">
          <div className="border border-zinc-800 bg-zinc-950 p-4">
            <h2 className="text-sm font-semibold text-zinc-100">
              Session Coach Report
            </h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
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
            </div>
          </div>

          <div className="border border-zinc-800 bg-zinc-950 p-4">
            <h2 className="text-sm font-semibold text-zinc-100">
              Biggest Mistake
            </h2>
            <div className="mt-4 border-t border-zinc-900 py-3 text-sm text-zinc-300">
              {coach.biggestMistake?.label ?? "No repeated mistake yet."}
            </div>
            <div className="text-xs text-zinc-500">
              {coach.ruleFocus ?? "No repeated rule focus yet."}
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,0.65fr)_minmax(320px,0.35fr)]">
          <div className="border border-zinc-800 bg-zinc-950 p-4">
            <h2 className="text-sm font-semibold text-zinc-100">
              Review Flow
            </h2>
            <div className="mt-4 grid gap-4">
              {review.steps.map((step, index) => (
                <div key={step.id} className="border-t border-zinc-900 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center border border-zinc-800 font-mono text-xs text-sky-300">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-zinc-100">
                        {step.label}
                      </div>
                      <div className="mt-1 text-sm text-zinc-500">
                        {step.detail}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-zinc-500">{step.action}</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {step.relatedTradeIds.slice(0, 5).map((tradeId) => (
                      <Link
                        key={tradeId}
                        className="border border-zinc-800 px-2 py-1 text-xs text-sky-300 hover:border-sky-400"
                        data-testid={`review-related-trade-${tradeId}-${index}`}
                        href={`/trades/${tradeId}`}
                      >
                        {tradeId}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border border-zinc-800 bg-zinc-950 p-4">
            <h2 className="text-sm font-semibold text-zinc-100">
              Lesson Draft
            </h2>
            <div className="mt-4 border-t border-zinc-900 py-4">
              <div className="text-sm font-medium text-zinc-100">
                {review.suggestedLesson.title}
              </div>
              <div className="mt-2 text-sm text-zinc-500">
                {review.suggestedLesson.body}
              </div>
              <div className="mt-4 text-xs text-zinc-500">
                Linked rule:{" "}
                {review.suggestedLesson.linkedRuleRecommendationId ?? "none yet"}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
