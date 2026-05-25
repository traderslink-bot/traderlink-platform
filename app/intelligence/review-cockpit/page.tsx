import Link from "next/link";
import type { Metadata } from "next";
import { buildProductWorkflowShellViewModel } from "@/src/lib/trader-analytics";

export const metadata: Metadata = {
  title: "Review Cockpit | Trader Intelligence",
};

export default function ReviewCockpitPage() {
  const shell = buildProductWorkflowShellViewModel();
  const experience = shell.analytics.importTrialExperience;
  const cockpit = experience.reviewCockpit;

  return (
    <main className="min-h-screen bg-zinc-950 px-5 py-8 text-zinc-100 sm:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="border-b border-zinc-800 pb-6">
          <Link className="text-sm text-sky-300 hover:text-sky-200" href="/intelligence">
            Back to workspace
          </Link>
          <h1 className="mt-3 text-3xl font-semibold text-zinc-50">
            {cockpit.title}
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-zinc-500">
            {cockpit.summary}
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="border border-zinc-800 bg-zinc-950 p-4">
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Readiness
            </div>
            <div className="mt-3 text-2xl font-semibold text-sky-300">
              {cockpit.readinessScore}/100
            </div>
          </div>
          <div className="border border-zinc-800 bg-zinc-950 p-4">
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Actions
            </div>
            <div className="mt-3 text-2xl font-semibold text-zinc-100">
              {cockpit.actions.length}
            </div>
          </div>
          <div className="border border-zinc-800 bg-zinc-950 p-4">
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Market Context
            </div>
            <div className="mt-3 text-lg font-semibold text-emerald-300">
              Observational only
            </div>
          </div>
        </section>

        <section
          className="grid gap-4 border border-zinc-800 bg-zinc-950 p-4 md:grid-cols-3"
          data-testid="review-cockpit-safety-policy"
        >
          <div>
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Write Safety
            </div>
            <div className="mt-2 text-sm font-medium text-emerald-300">
              action planning only
            </div>
            <div className="mt-1 text-xs text-zinc-500">
              Cockpit actions route users to review surfaces without production
              broker-row writes.
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Cost Policy
            </div>
            <div className="mt-2 text-sm font-medium text-sky-300">
              gross-only feedback
            </div>
            <div className="mt-1 text-xs text-zinc-500">
              P/L priorities stay execution-only unless a later calibrated path
              says otherwise.
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Market Context
            </div>
            <div className="mt-2 text-sm font-medium text-zinc-300">
              observational only
            </div>
            <div className="mt-1 text-xs text-zinc-500">
              Market context can explain review priority, not final execution
              scoring.
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,0.58fr)_minmax(320px,0.42fr)]">
          <div className="border border-zinc-800 bg-zinc-950 p-4">
            <h2 className="text-sm font-semibold text-zinc-100">
              Next Best Actions
            </h2>
            <div className="mt-4 grid gap-4">
              {cockpit.actions.map((action) => (
                <Link
                  key={action.id}
                  className="block border-t border-zinc-900 py-4 hover:text-sky-200"
                  href={action.href}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium text-zinc-100">
                        {action.title}
                      </div>
                      <div className="mt-1 text-sm text-zinc-500">
                        {action.reason}
                      </div>
                    </div>
                    <div className="text-xs uppercase tracking-wide text-zinc-500">
                      {action.lane}
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-sky-300">
                    {action.nextAction}
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="grid gap-6">
            <div className="border border-zinc-800 bg-zinc-950 p-4">
              <h2 className="text-sm font-semibold text-zinc-100">
                Rule Lifecycle
              </h2>
              <div className="mt-2 text-sm text-zinc-500">
                {experience.ruleLifecycleSimulation.nextAction}
              </div>
              <div className="mt-4 grid gap-3">
                {experience.ruleLifecycleSimulation.items.slice(0, 4).map((item) => (
                  <div key={item.id} className="border-t border-zinc-900 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm text-zinc-300">{item.ruleTitle}</span>
                      <span className="text-xs uppercase tracking-wide text-zinc-500">
                        {item.currentStage}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-zinc-500">
                      {item.expectedSuccessMetric}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border border-zinc-800 bg-zinc-950 p-4">
              <h2 className="text-sm font-semibold text-zinc-100">
                Why These Items
              </h2>
              <div className="mt-4 grid gap-3">
                {experience.whyLayer.explanations.slice(0, 4).map((item) => (
                  <div key={item.id} className="border-t border-zinc-900 py-3">
                    <div className="text-sm text-zinc-300">{item.title}</div>
                    <div className="mt-1 text-xs text-zinc-500">{item.reason}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
