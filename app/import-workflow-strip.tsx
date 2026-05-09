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
    label: "Upload executions",
    href: "/import-dry-run",
    detail: "Paste or upload a broker CSV and check the grouped trades.",
  },
  {
    id: "recover",
    label: "Save or repair",
    href: "/imports",
    detail: "Resolve repairs, duplicate checks, and save readiness.",
  },
  {
    id: "review",
    label: "Review trades",
    href: "/trades",
    detail: "Open saved trades, review queues, analytics, and coach.",
  },
];

function stepClass(active: boolean): string {
  return active
    ? "border-sky-700 bg-sky-950/30 text-sky-100"
    : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200";
}

export function ImportWorkflowStrip({
  currentStep,
  summary,
}: ImportWorkflowStripProps) {
  return (
    <section
      className="border border-zinc-800 bg-zinc-950 p-4"
      data-testid="import-workflow-strip"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="text-xs uppercase tracking-wide text-zinc-500">
            Import Workflow
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
            {summary}
          </p>
        </div>
        <Link
          className="text-sm text-sky-300 hover:text-sky-200"
          href={currentStep === "review" ? "/review?queue=highest_priority" : "/imports"}
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
