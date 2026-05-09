import Link from "next/link";
import type { Metadata } from "next";
import {
  AdvancedDisclosure,
  MetricCard,
  PrimaryActionPanel,
} from "../app-ui";
import {
  getMockTradeReviewCase,
  mockTradeReviewCases,
} from "./mock-trade-review-data";

export const metadata: Metadata = {
  title: "Trader Intelligence Trade Review | TradersLink",
  description:
    "Preview the Trader Intelligence single-trade review experience: main behavior, what happened, why it mattered, one fix-first action, evidence, and advanced details.",
};

function toneForOutcome(outcome: string): "success" | "warning" | "danger" | "info" {
  if (outcome === "Strong") {
    return "success";
  }

  if (outcome === "Weak") {
    return "danger";
  }

  if (outcome === "Inconclusive") {
    return "warning";
  }

  return "info";
}

export default async function TraderIntelligencePage({
  searchParams,
}: {
  searchParams?: Promise<{ case?: string }>;
}) {
  const query = await searchParams;
  const activeCase = getMockTradeReviewCase(query?.case);
  const review = activeCase.summary;
  const outcomeTone = toneForOutcome(review.outcomeLabel);

  return (
    <main className="min-h-screen bg-[#020817] px-5 py-8 text-slate-100 sm:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="border-b border-slate-800 pb-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <Link className="text-sm text-cyan-300 hover:text-cyan-200" href="/">
                Back to TradersLink
              </Link>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-emerald-300">
                Trader Intelligence Preview
              </p>
              <h1 className="mt-2 max-w-4xl text-3xl font-semibold text-white sm:text-4xl">
                Trader Intelligence Trade Review
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
                A single-trade review should explain the main behavior, why it
                mattered, and the one action to fix or repeat first.
              </p>
            </div>
            <Link
              className="border border-cyan-400/40 bg-cyan-400/10 px-4 py-3 text-sm font-medium text-cyan-100 transition hover:border-cyan-300"
              href="/workspace"
            >
              Open app workspace
            </Link>
          </div>
        </header>

        <section className="border border-slate-800 bg-slate-950/70 p-4">
          <h2 className="text-sm font-semibold text-slate-100">
            Mock review cases
          </h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {mockTradeReviewCases.map((reviewCase) => (
              <Link
                className={`border px-3 py-2 text-xs uppercase tracking-wide transition ${
                  reviewCase.id === activeCase.id
                    ? "border-cyan-300 bg-cyan-300/10 text-cyan-100"
                    : "border-slate-800 text-slate-400 hover:border-slate-500 hover:text-slate-200"
                }`}
                href={`/trader-intelligence?case=${reviewCase.id}`}
                key={reviewCase.id}
              >
                {reviewCase.label}
              </Link>
            ))}
          </div>
        </section>

        <PrimaryActionPanel
          actionHref="#fix-first"
          actionLabel={
            review.primaryInsight.type === "strength"
              ? "Reinforce this"
              : "Read fix first"
          }
          body={review.primaryInsight.plainEnglishSummary}
          eyebrow="Main Review Takeaway"
          testId="trader-intelligence-primary-review"
          title={review.primaryInsight.title}
          tone={outcomeTone}
        />

        <section
          className="grid gap-4 md:grid-cols-4"
          data-testid="trader-intelligence-review-metrics"
        >
          <MetricCard
            detail={`${review.symbol} / ${review.sessionLabel}`}
            label="Trade"
            tone="info"
            value={review.grossPnlLabel}
          />
          <MetricCard
            detail="Plain review grade for this mock case."
            label="Review"
            tone={outcomeTone}
            value={review.outcomeLabel}
          />
          <MetricCard
            detail={review.primaryInsight.confidenceExplanation}
            label="Confidence"
            tone={review.primaryInsight.confidenceLabel === "High" ? "success" : "warning"}
            value={review.primaryInsight.confidenceLabel}
          />
          <MetricCard
            detail="One primary behavior is shown first."
            label="Focus"
            tone="default"
            value={review.gradeLabel}
          />
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <article className="border border-slate-800 bg-slate-950 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              What Happened
            </p>
            <h2 className="mt-3 text-lg font-semibold text-white">
              The trade story
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              {review.primaryInsight.plainEnglishSummary}
            </p>
          </article>

          <article className="border border-slate-800 bg-slate-950 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Why It Mattered
            </p>
            <h2 className="mt-3 text-lg font-semibold text-white">
              The review reason
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              {review.primaryInsight.whyItMatters}
            </p>
          </article>

          <article
            className="border border-cyan-400/30 bg-cyan-950/20 p-5"
            id="fix-first"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-cyan-300">
              {review.primaryInsight.type === "strength"
                ? "Reinforce First"
                : "Fix First"}
            </p>
            <h2 className="mt-3 text-lg font-semibold text-white">
              One next action
            </h2>
            <p className="mt-3 text-sm leading-6 text-cyan-50/80">
              {review.primaryInsight.fixFirst}
            </p>
          </article>
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.36fr)]">
          <div className="border border-slate-800 bg-slate-950 p-5">
            <h2 className="text-sm font-semibold text-white">Evidence</h2>
            <div className="mt-4 grid gap-3">
              {review.timelineEvidence.map((item) => (
                <div
                  className="border-t border-slate-900 py-3"
                  key={`${item.label}-${item.explanation}`}
                >
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-sm font-medium text-slate-200">
                      {item.label}
                    </div>
                    {item.timestamp || item.price ? (
                      <div className="text-xs text-slate-500">
                        {[item.timestamp, item.price ? `$${item.price}` : null]
                          .filter(Boolean)
                          .join(" / ")}
                      </div>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    {item.explanation}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <aside className="border border-slate-800 bg-slate-950 p-5">
            <h2 className="text-sm font-semibold text-white">
              Quick explanations
            </h2>
            <div className="mt-4 grid gap-3">
              {review.educationLinks.length === 0 ? (
                <p className="text-sm leading-6 text-slate-500">
                  No education card is attached until the app has enough data
                  for a reliable takeaway.
                </p>
              ) : (
                review.educationLinks.map((item) => (
                  <div className="border-t border-slate-900 py-3" key={item.anchorId}>
                    <div className="text-sm font-medium text-slate-200">
                      {item.term}
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      {item.shortDefinition}
                    </p>
                  </div>
                ))
              )}
            </div>
          </aside>
        </section>

        {review.secondaryInsights.length > 0 ? (
          <section className="border border-slate-800 bg-slate-950 p-5">
            <h2 className="text-sm font-semibold text-white">
              Supporting notes
            </h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {review.secondaryInsights.map((item) => (
                <article className="border border-slate-900 p-4" key={item.title}>
                  <div className="text-sm font-medium text-slate-200">
                    {item.title}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {item.summary}
                  </p>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <AdvancedDisclosure summary="Advanced analysis details">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="border border-slate-900 p-4">
              <div className="text-xs uppercase tracking-wide text-slate-500">
                Internal traceability
              </div>
              <div className="mt-3 text-sm leading-6 text-slate-400">
                Pattern IDs:{" "}
                {review.advancedDetails.patternIds.length === 0
                  ? "none"
                  : review.advancedDetails.patternIds.join(", ")}
              </div>
              <div className="mt-2 text-sm leading-6 text-slate-400">
                Suppressed behavior IDs:{" "}
                {review.advancedDetails.suppressedBehaviorIds.length === 0
                  ? "none"
                  : review.advancedDetails.suppressedBehaviorIds.join(", ")}
              </div>
            </div>
            <div className="border border-slate-900 p-4">
              <div className="text-xs uppercase tracking-wide text-slate-500">
                Scoring context
              </div>
              <div className="mt-3 text-sm leading-6 text-slate-400">
                Dominant family: {review.advancedDetails.dominantFamily ?? "none"}
              </div>
              <div className="mt-2 text-sm leading-6 text-slate-400">
                Score band: {review.advancedDetails.scoreBand ?? "none"}
              </div>
              <div className="mt-2 text-sm leading-6 text-slate-400">
                Raw confidence: {review.advancedDetails.rawConfidence}
              </div>
            </div>
          </div>
        </AdvancedDisclosure>
      </div>
    </main>
  );
}
