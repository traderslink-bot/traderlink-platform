import Link from "next/link";
import type { Metadata } from "next";
import { buildProductWorkflowShellViewModel } from "@/src/lib/trader-analytics";

export const metadata: Metadata = {
  title: "Repair Wizard | Trader Intelligence",
};

function severityClass(severity: string): string {
  return severity === "blocker"
    ? "text-rose-300"
    : severity === "review"
      ? "text-amber-300"
      : "text-sky-300";
}

export default function RepairWizardPage() {
  const shell = buildProductWorkflowShellViewModel();
  const wizard = shell.analytics.importTrialExperience.repairWizard;

  return (
    <main className="min-h-screen bg-zinc-950 px-5 py-8 text-zinc-100 sm:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="border-b border-zinc-800 pb-6">
          <Link className="text-sm text-sky-300 hover:text-sky-200" href="/intelligence">
            Back to Intelligence
          </Link>
          <h1 className="mt-3 text-3xl font-semibold text-zinc-50">
            Repair Wizard
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-zinc-500">
            {wizard.nextAction}
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-4">
          <div className="border border-zinc-800 bg-zinc-950 p-4">
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Status
            </div>
            <div className="mt-3 text-xl font-semibold text-zinc-100">
              {wizard.status}
            </div>
          </div>
          <div className="border border-zinc-800 bg-zinc-950 p-4">
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Steps
            </div>
            <div className="mt-3 text-2xl font-semibold text-sky-300">
              {wizard.totalStepCount}
            </div>
          </div>
          <div className="border border-zinc-800 bg-zinc-950 p-4">
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Blockers
            </div>
            <div className="mt-3 text-2xl font-semibold text-rose-300">
              {wizard.blockerCount}
            </div>
          </div>
          <div className="border border-zinc-800 bg-zinc-950 p-4">
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Reviews
            </div>
            <div className="mt-3 text-2xl font-semibold text-amber-300">
              {wizard.reviewCount}
            </div>
          </div>
        </section>

        <section
          className="grid gap-4 border border-zinc-800 bg-zinc-950 p-4 md:grid-cols-3"
          data-testid="repair-wizard-safety-policy"
        >
          <div>
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Write Safety
            </div>
            <div className="mt-2 text-sm font-medium text-emerald-300">
              repair guidance only
            </div>
            <div className="mt-1 text-xs text-zinc-500">
              The wizard does not save broker rows or alter uploaded files.
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
              Fees and broker net amounts remain reconciliation context.
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Broker Scope
            </div>
            <div className="mt-2 text-sm font-medium text-zinc-300">
              synthetic fixture coverage
            </div>
            <div className="mt-1 text-xs text-zinc-500">
              Repair priorities come from representative fixtures, not a live
              broker guarantee.
            </div>
          </div>
        </section>

        <section className="border border-zinc-800 bg-zinc-950 p-4">
          <h2 className="text-sm font-semibold text-zinc-100">
            Guided Steps
          </h2>
          <div className="mt-4 grid gap-4">
            {wizard.steps.map((step, index) => (
              <div key={step.id} className="border-t border-zinc-900 py-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="flex gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-zinc-800 font-mono text-xs text-sky-300">
                      {index + 1}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-zinc-100">
                        {step.label}
                      </div>
                      <div className="mt-1 text-sm text-zinc-500">
                        {step.explanation}
                      </div>
                    </div>
                  </div>
                  <div className={`text-xs uppercase tracking-wide ${severityClass(step.severity)}`}>
                    {step.severity}
                  </div>
                </div>
                <div className="mt-3 text-xs text-sky-300">
                  {step.repairAction}
                </div>
                <div className="mt-2 text-xs text-zinc-500">
                  Fixture count: {step.affectedFixtureIds.length} / proceed after
                  review: {step.canProceedAfterReview ? "yes" : "no"}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
