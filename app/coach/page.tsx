import Link from "next/link";
import type { Metadata } from "next";
import {
  AdvancedDisclosure,
  MetricCard,
  PrimaryActionPanel,
  plainStateLabel,
} from "../app-ui";
import { SavedReviewQueueSummary } from "../saved-review-queue-summary";
import { SavedImportSourceCaution } from "../saved-import-source-caution";
import { buildSavedReviewQueueReadModel } from "../../src/lib/trader-analytics/server/saved-review-queue";
import { buildLatestSavedImportSourceCautionReadModel } from "../../src/lib/trader-analytics/server/saved-import-source-caution";
import { buildSavedOrSampleTraderAnalyticsViewModel } from "../../src/lib/trader-analytics/server/saved-trader-analytics-data";

export const metadata: Metadata = {
  title: "Coach | Trader Intelligence",
};

export const dynamic = "force-dynamic";

function signed(value: number | null): string {
  if (value === null) {
    return "n/a";
  }

  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}`;
}

function compactCoachAction(value: string, fallback: string): string {
  const normalized = value.toLowerCase();

  if (!value) {
    return fallback;
  }

  if (normalized.includes("recurring execution risk")) {
    return "Replay the repeated risk";
  }

  if (normalized.includes("single entry") && normalized.includes("full exit")) {
    return "Preserve clean entry and exit";
  }

  if (value.length <= 54) {
    return value;
  }

  return fallback;
}

const panelClass = "border border-zinc-800 bg-zinc-950 p-4 shadow-sm shadow-black/20";

export default function CoachPage() {
  const analyticsData = buildSavedOrSampleTraderAnalyticsViewModel();
  const analytics = analyticsData.viewModel;
  const savedReviewQueue =
    analyticsData.mode === "saved"
      ? buildSavedReviewQueueReadModel({
          repository: analyticsData.repository,
          userId: analyticsData.userId,
        })
      : null;
  const importSourceCaution =
    analyticsData.mode === "saved"
      ? buildLatestSavedImportSourceCautionReadModel({
          repository: analyticsData.repository,
        })
      : null;
  const coach = analytics.coachActionLoop;
  const polish = analytics.productPolish;
  const habit = analytics.reviewHabitLoop;
  const home = coach.coachHome;
  const prep = coach.sessionPrepCard;
  const archetype = coach.archetypeProfile.primary;
  const primaryReviewItem =
    savedReviewQueue?.items[0] ?? savedReviewQueue?.allItems[0] ?? null;
  const dataLabel =
    analyticsData.mode === "saved"
      ? plainStateLabel("saved_sqlite")
      : "Sample data until you save an import";

  return (
    <main className="min-h-screen bg-zinc-950 px-5 py-8 text-zinc-100 sm:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="border-b border-zinc-800 pb-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <Link className="text-sm text-sky-300 hover:text-sky-200" href="/workspace">
                Back to workspace
              </Link>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-emerald-400">
                Coach
              </p>
              <h1 className="mt-2 max-w-4xl text-3xl font-semibold text-zinc-50">
                {home.headline}
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
                {home.subhead}
              </p>
            </div>
            <Link
              className="border border-sky-800 bg-sky-950/40 px-4 py-3 text-sm font-medium text-sky-100 transition hover:border-sky-400"
              href={home.primaryAction.href}
            >
              {home.primaryAction.label}
            </Link>
          </div>
          <div className="mt-5 flex flex-wrap gap-2 text-xs uppercase tracking-wide">
            <span className="border border-zinc-800 bg-zinc-950 px-2 py-1 text-zinc-400">
              {dataLabel}
            </span>
            <span className="border border-emerald-900 bg-emerald-950/20 px-2 py-1 text-emerald-300">
              market claims gated
            </span>
            <span className="border border-zinc-800 bg-zinc-950 px-2 py-1 text-zinc-400">
              evidence-backed review
            </span>
          </div>
        </header>

        <SavedReviewQueueSummary queue={savedReviewQueue} surface="coach" />
        <SavedImportSourceCaution
          caution={importSourceCaution}
          surface="coach"
        />

        <PrimaryActionPanel
          actionHref={primaryReviewItem?.href ?? "/import-dry-run"}
          actionLabel={primaryReviewItem ? "Open Trade Review" : "Import trades"}
          body={
            primaryReviewItem
              ? `${primaryReviewItem.stateDetail} Evidence comes from saved trade review, execution replay, and the saved review queue.`
              : "Save one broker CSV to unlock coaching from your own trades."
          }
          eyebrow="Do This Next"
          testId="coach-primary-action"
          title={
            primaryReviewItem
              ? `Review ${primaryReviewItem.symbol} next`
              : "Save one broker CSV to unlock coaching from your own trades"
          }
          tone={primaryReviewItem ? "info" : "warning"}
        />

        <section
          className="grid gap-4 md:grid-cols-3"
          data-testid="coach-session-plan"
        >
          <MetricCard
            label="Avoid This Next Session"
            value={compactCoachAction(prep.avoidBehavior, "Review the biggest risk")}
            detail={prep.avoidBehavior}
            tone="warning"
          />
          <MetricCard
            label="Repeat This"
            value={compactCoachAction(prep.repeatBehavior, "Repeat the strongest behavior")}
            detail={prep.repeatBehavior}
            tone="success"
          />
          <MetricCard
            label="Review This Trade"
            value={primaryReviewItem?.symbol ?? "Save an import"}
            detail={
              primaryReviewItem
                ? "Open it and write one lesson."
                : "Import one broker CSV first."
            }
            tone="info"
          />
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <MetricCard
            label="Review Progress"
            value={`${coach.reviewCompletionLoop.completionPct}%`}
            detail="Saved review loop completion."
            tone="info"
          />
          <MetricCard
            label="Current Pattern"
            value={archetype?.label ?? "Collecting"}
            detail="See the pattern section below."
          />
          <MetricCard
            label="Most Expensive Habit"
            value={coach.mistakeSeverityLadder.topSeverity?.label ?? "None"}
            detail="Frequency + gross P/L evidence."
            tone="warning"
          />
          <MetricCard
            label="Data Source"
            value={dataLabel}
            detail="Coaching stays evidence-backed and conservative."
            tone={analyticsData.mode === "saved" ? "success" : "warning"}
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-3">
          <div className={panelClass}>
            <h2 className="text-sm font-semibold text-zinc-100">
              Rule To Create
            </h2>
            <div className="mt-3 text-2xl font-semibold text-sky-300">
              {habit.mistakeRuleConversion.totalDrafts}
            </div>
            <div className="mt-2 text-xs text-zinc-500">
              {habit.mistakeRuleConversion.nextAction}
            </div>
          </div>
          <Link
            className={`${panelClass} block transition hover:border-sky-400`}
            href="/compare-trades"
          >
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Compare
            </div>
            <div className="mt-3 text-lg font-semibold text-zinc-100">
              {habit.tradeComparison?.title ?? "More trades needed"}
            </div>
            <div className="mt-2 text-xs text-zinc-500">
              {habit.tradeComparison?.reviewPrompt ?? "Save more trades first."}
            </div>
          </Link>
          <Link
            className={`${panelClass} block transition hover:border-emerald-400`}
            href="/onboarding"
          >
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Onboarding
            </div>
            <div className="mt-3 text-lg font-semibold text-emerald-300">
              {habit.onboardingPath.completionPct}%
            </div>
            <div className="mt-2 text-xs text-zinc-500">
              {habit.onboardingPath.currentStep?.nextAction ?? "Onboarding complete."}
            </div>
          </Link>
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.45fr)]">
          <div className={panelClass}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-sm font-semibold text-zinc-100">
                  Coach Review Queue
                </h2>
                <div className="mt-1 text-sm text-zinc-500">
                  {polish.coachReviewQueue.primaryItem?.nextAction ??
                    "No review queue item yet."}
                </div>
              </div>
              <Link
                className="text-sm text-sky-300 hover:text-sky-200"
                href="/session-recap"
              >
                Session recap
              </Link>
            </div>
            <div className="mt-4 grid gap-3">
              {polish.coachReviewQueue.items.slice(0, 6).map((item) => (
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

          <div className={panelClass}>
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
        </section>

        <section className={panelClass}>
          <h2 className="text-sm font-semibold text-zinc-100">
            Session Timing
          </h2>
          <div className="mt-2 text-sm text-zinc-400">
            {prep.sessionTimeInsight}
          </div>
          <div className="mt-3 text-xs text-zinc-500">
            Execution-only, Eastern Time, and sample-size gated.
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.45fr)]">
          <div className={panelClass}>
            <h2 className="text-sm font-semibold text-zinc-100">
              Session Prep
            </h2>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <div className="border-t border-zinc-900 py-3">
                <div className="text-xs uppercase tracking-wide text-zinc-500">
                  Rule
                </div>
                <div className="mt-2 text-sm text-sky-200">{prep.ruleFocus}</div>
              </div>
              <div className="border-t border-zinc-900 py-3">
                <div className="text-xs uppercase tracking-wide text-zinc-500">
                  Avoid
                </div>
                <div className="mt-2 text-sm text-amber-200">
                  {prep.avoidBehavior}
                </div>
              </div>
              <div className="border-t border-zinc-900 py-3">
                <div className="text-xs uppercase tracking-wide text-zinc-500">
                  Repeat
                </div>
                <div className="mt-2 text-sm text-emerald-200">
                  {prep.repeatBehavior}
                </div>
              </div>
            </div>
            <div className="mt-4 grid gap-2">
              {prep.checklist.map((item) => (
                <div key={item} className="border-t border-zinc-900 py-2 text-sm text-zinc-400">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className={panelClass}>
            <h2 className="text-sm font-semibold text-zinc-100">
              Do This Now
            </h2>
            <Link
              className="mt-4 block border border-sky-800 bg-sky-950/40 p-4 text-sky-100 transition hover:border-sky-400"
              href={home.primaryAction.href}
            >
              <div className="font-medium">{home.primaryAction.label}</div>
              <div className="mt-2 text-sm text-sky-200/80">
                {home.primaryAction.detail}
              </div>
            </Link>
            <div className="mt-4 grid gap-2">
              {home.actions.slice(1).map((action) => (
                <Link
                  key={action.id}
                  className="border-t border-zinc-900 py-3 text-sm text-zinc-300 hover:text-sky-200"
                  href={action.href}
                >
                  {action.label}
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <div className={panelClass}>
            <h2 className="text-sm font-semibold text-zinc-100">
              Advanced Rule Details
            </h2>
            <div className="mt-4 grid gap-3">
              {polish.ruleCandidateLab.items.slice(0, 5).map((item) => (
                <div key={item.id} className="border-t border-zinc-900 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-zinc-300">
                      {item.suggestedRuleTitle}
                    </span>
                    <span className="text-xs uppercase tracking-wide text-zinc-500">
                      {item.readiness}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-zinc-500">
                    {item.reason}
                  </div>
                  <div className="mt-2 text-xs text-sky-300">
                    {item.limitation}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={panelClass}>
            <h2 className="text-sm font-semibold text-zinc-100">
              Personal Pattern Memory
            </h2>
            <div className="mt-4 grid gap-3">
              {polish.personalPatternMemory.items.slice(0, 6).map((item) => (
                <div key={item.id} className="border-t border-zinc-900 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-zinc-300">{item.label}</span>
                    <span className="text-xs uppercase tracking-wide text-zinc-500">
                      {item.kind}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-zinc-500">
                    {item.summary}
                  </div>
                  <div className="mt-2 text-xs text-emerald-300">
                    {item.nextAction}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <div className={panelClass}>
            <h2 className="text-sm font-semibold text-zinc-100">
              Most Expensive Habit
            </h2>
            <div className="mt-4 grid gap-3">
              {coach.mistakeSeverityLadder.items.slice(0, 6).map((item) => (
                <div key={item.id} className="border-t border-zinc-900 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-zinc-300">{item.label}</span>
                    <span className="font-mono text-xs text-amber-300">
                      {item.severityScore}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-zinc-500">
                    {item.frequency}x / cost {signed(item.estimatedGrossCost)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={panelClass}>
            <h2 className="text-sm font-semibold text-zinc-100">
              Advanced Rule Tests
            </h2>
            <div className="mt-4 grid gap-3">
              {coach.ruleSimulations.slice(0, 6).map((simulation) => (
                <div key={simulation.id} className="border-t border-zinc-900 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-zinc-300">
                      {simulation.suggestedRuleTitle}
                    </span>
                    <span className="font-mono text-xs text-sky-300">
                      {simulation.flaggedTradeCount}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-zinc-500">
                    {simulation.limitation}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <div className={panelClass}>
            <h2 className="text-sm font-semibold text-zinc-100">
              Current Pattern
            </h2>
            <div className="mt-2 text-sm text-zinc-500">
              {coach.archetypeProfile.summary}
            </div>
            <div className="mt-4 grid gap-3">
              {coach.archetypeProfile.signals.map((signal) => (
                <div key={signal.id} className="border-t border-zinc-900 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-zinc-300">{signal.label}</span>
                    <span className="font-mono text-xs text-zinc-500">
                      {signal.score}/100
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 bg-zinc-900">
                    <div
                      className="h-1.5 bg-emerald-400"
                      style={{ width: `${signal.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={panelClass}>
            <h2 className="text-sm font-semibold text-zinc-100">
              Review Completion
            </h2>
            <div className="mt-4 grid gap-3">
              {coach.reviewCompletionLoop.steps.map((step) => (
                <div key={step.id} className="border-t border-zinc-900 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-zinc-300">{step.label}</span>
                    <span className="text-xs uppercase tracking-wide text-zinc-500">
                      {step.status}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-zinc-500">{step.detail}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <AdvancedDisclosure summary="Advanced coach details">
          <h2 className="text-sm font-semibold text-zinc-100">
            Evidence Confidence Wording
          </h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {coach.confidenceLanguage.items.slice(0, 6).map((item) => (
              <div key={item.sourceId} className="border-t border-zinc-900 py-3">
                <div className="text-xs uppercase tracking-wide text-zinc-500">
                  {item.evidenceLevel}
                </div>
                <div className="mt-2 text-sm text-zinc-300">{item.copy}</div>
              </div>
            ))}
          </div>
        </AdvancedDisclosure>
      </div>
    </main>
  );
}
