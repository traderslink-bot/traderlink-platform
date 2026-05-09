import Link from "next/link";
import type { Metadata } from "next";
import {
  buildProductTraderAnalyticsViewModel,
  buildSampleSavedTraderAnalyticsData,
} from "../../src/lib/trader-analytics";

export const metadata: Metadata = {
  title: "Onboarding | Trader Intelligence",
};

export default function OnboardingPage() {
  const sample = buildSampleSavedTraderAnalyticsData();
  const analytics = buildProductTraderAnalyticsViewModel({
    repository: sample.repository,
    userId: sample.userId,
    importRequests: sample.importRequests,
  });
  const onboarding = analytics.reviewHabitLoop.onboardingPath;
  const dataQuality = analytics.reviewHabitLoop.dataQualityScore;

  return (
    <main className="min-h-screen bg-zinc-950 px-5 py-8 text-zinc-100 sm:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="border-b border-zinc-800 pb-6">
          <Link className="text-sm text-sky-300 hover:text-sky-200" href="/workspace">
            Back to workspace
          </Link>
          <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-emerald-400">
            Onboarding
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-zinc-50">
            {onboarding.headline}
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-zinc-500">
            Follow the in-app path from execution import to first review habit.
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="border border-zinc-800 bg-zinc-950 p-4">
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Completion
            </div>
            <div className="mt-3 text-2xl font-semibold text-sky-300">
              {onboarding.completionPct}%
            </div>
          </div>
          <div className="border border-zinc-800 bg-zinc-950 p-4">
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Data Quality
            </div>
            <div className="mt-3 text-2xl font-semibold text-emerald-300">
              {dataQuality.score}/100
            </div>
          </div>
          <div className="border border-zinc-800 bg-zinc-950 p-4">
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Current Step
            </div>
            <div className="mt-3 text-lg font-semibold text-zinc-100">
              {onboarding.currentStep?.label ?? "Complete"}
            </div>
          </div>
        </section>

        <section className="border border-zinc-800 bg-zinc-950 p-4">
          <h2 className="text-sm font-semibold text-zinc-100">
            Product Path
          </h2>
          <div className="mt-4 grid gap-3">
            {onboarding.steps.map((step, index) => (
              <Link
                key={step.id}
                className="grid gap-3 border-t border-zinc-900 py-4 transition hover:text-sky-200 md:grid-cols-[48px_180px_120px_1fr]"
                href={step.href}
              >
                <div className="flex h-8 w-8 items-center justify-center border border-zinc-800 font-mono text-xs text-sky-300">
                  {index + 1}
                </div>
                <div className="text-sm font-medium text-zinc-100">
                  {step.label}
                </div>
                <div className="text-xs uppercase tracking-wide text-zinc-500">
                  {step.status}
                </div>
                <div>
                  <div className="text-sm text-zinc-400">{step.detail}</div>
                  <div className="mt-1 text-xs text-sky-300">
                    {step.nextAction}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="border border-zinc-800 bg-zinc-950 p-4">
          <h2 className="text-sm font-semibold text-zinc-100">
            Data Trust Checks
          </h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {dataQuality.checks.map((check) => (
              <div key={check.id} className="border-t border-zinc-900 py-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-zinc-300">{check.label}</span>
                  <span
                    className={`text-xs uppercase tracking-wide ${
                      check.passed ? "text-emerald-300" : "text-amber-300"
                    }`}
                  >
                    {check.passed ? "pass" : check.severity}
                  </span>
                </div>
                <div className="mt-1 text-xs text-zinc-500">{check.detail}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
