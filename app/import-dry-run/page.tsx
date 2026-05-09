import Link from "next/link";
import type { Metadata } from "next";
import {
  buildProductWorkflowShellViewModel,
  getCsvDryRunSamplePresets,
} from "../../src/lib/trader-analytics";
import { ImportWorkflowStrip } from "../import-workflow-strip";
import { ImportDryRunClient } from "./import-dry-run-client";

export const metadata: Metadata = {
  title: "Import Trades | Trader Intelligence",
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
    <main className="min-h-screen bg-zinc-950 px-5 py-8 text-zinc-100 sm:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="border-b border-zinc-800 pb-6">
          <Link className="text-sm text-sky-300 hover:text-sky-200" href="/workspace">
            Back to workspace
          </Link>
          <h1 className="mt-3 text-3xl font-semibold text-zinc-50">
            Import Trades
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-zinc-500">
            Preview broker executions, map columns, inspect grouped trades, and
            see whether the import would be ready before anything is saved.
          </p>
        </header>

        <ImportWorkflowStrip
          currentStep="upload"
          summary="Start with one clean broker CSV, confirm the parsed executions, then save the import so the end-user app can power saved trades, review queues, analytics, and coach from real data."
        />

        <ImportDryRunClient
          presets={getCsvDryRunSamplePresets()}
          sampleMistakes={sampleMistakes}
        />
      </div>
    </main>
  );
}
