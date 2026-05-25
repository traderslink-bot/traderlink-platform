import Link from "next/link";
import type { Metadata } from "next";
import {
  buildProductWorkflowShellViewModel,
  getCsvDryRunSamplePresets,
} from "@/src/lib/trader-analytics";
import { ImportDryRunClient } from "./import-dry-run-client";

export const metadata: Metadata = {
  title: "Advanced Import Check | Trader Intelligence",
};

export default function ImportDryRunPage() {
  const shell = buildProductWorkflowShellViewModel();
  const sampleMistakes =
    shell.analytics.productIntelligence.mistakeTaxonomy.observations
      .slice(0, 3)
      .map((observation) => ({
        id: `sample-mistake:${observation.taxonomyId}`,
        title: observation.label,
        source: "sample_mistake" as const,
        evidenceLabels: [
          `${observation.occurrenceCount} occurrence(s)`,
          observation.confidence,
        ],
        sourceFacts: [observation.reason, observation.suggestedReviewAction],
        relatedTradeIds: observation.tradeIds,
        limitation:
          "Sample mistake evidence comes from existing demo trades, not the pasted CSV.",
      }));

  return (
    <main className="min-h-screen ti-dashboard-bg px-5 py-8 text-zinc-100 sm:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="ti-panel p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <Link className="text-sm text-sky-300 hover:text-sky-200" href="/intelligence">
                Back to Intelligence
              </Link>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-amber-300">
                Advanced import tools
              </p>
              <h1 className="mt-2 text-3xl font-semibold text-zinc-50">
                Advanced Import Check
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
                Use this page when you need to inspect a CSV before saving it.
                Most traders should start with the simple upload page.
              </p>
            </div>
            <Link
              className="rounded-md border border-emerald-800 bg-emerald-950/30 px-4 py-3 text-sm font-semibold text-emerald-100 transition hover:border-emerald-400"
              href="/intelligence/upload-csv"
            >
              Simple CSV upload
            </Link>
          </div>
        </header>

        <ImportDryRunClient
          presets={getCsvDryRunSamplePresets()}
          sampleMistakes={sampleMistakes}
        />
      </div>
    </main>
  );
}
