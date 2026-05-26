import Link from "next/link";

type ImportWorkflowStepId = "upload" | "recover" | "review";

interface ImportWorkflowStripProps {
  currentStep: ImportWorkflowStepId;
  summary: string;
}

const IMPORT_WORKFLOW_STEPS: Array<{
  id: ImportWorkflowStepId;
  label: string;
  href: string;
  detail: string;
}> = [
  {
    id: "upload",
    label: "Upload CSV",
    href: "/intelligence/upload-csv",
    detail: "Choose a broker CSV and let the app check and save it.",
  },
  {
    id: "recover",
    label: "Save or repair import",
    href: "/intelligence/imports",
    detail: "Save clean files or fix only the rows that need attention.",
  },
  {
    id: "review",
    label: "Review saved trades",
    href: "/intelligence/trades",
    detail: "Open trades, review queues, analytics, and the coach.",
  },
];

function stepClass(active: boolean): string {
  return active
    ? "border-sky-500 bg-sky-500/15 text-sky-100"
    : "border-slate-500/35 bg-slate-900/25 text-slate-300 hover:border-sky-500 hover:text-sky-100";
}

export function ImportWorkflowStrip({
  currentStep,
  summary,
}: ImportWorkflowStripProps) {
  return (
    <section
      className="ti-panel p-4"
      data-testid="import-workflow-strip"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="text-xs uppercase tracking-wide text-zinc-500">
            Import workflow
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
            {summary}
          </p>
        </div>
        <Link
          className="text-sm text-sky-300 hover:text-sky-200"
          href={currentStep === "review" ? "/intelligence/review?queue=highest_priority" : "/intelligence/imports"}
        >
          {currentStep === "review" ? "Open review queue" : "Open import history"}
        </Link>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {IMPORT_WORKFLOW_STEPS.map((step, index) => {
          const active = step.id === currentStep;

          return (
            <Link
              className={`block border p-3 ${stepClass(active)}`}
              data-testid={`import-workflow-step-${step.id}`}
              href={step.href}
              key={step.id}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs uppercase tracking-wide text-zinc-500">
                  Step {index + 1}
                </span>
                {active ? (
                  <span className="text-xs uppercase tracking-wide text-sky-300">
                    Current
                  </span>
                ) : null}
              </div>
              <div className="mt-2 text-sm font-semibold">{step.label}</div>
              <div className="mt-1 text-xs leading-5 text-zinc-500">
                {step.detail}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
