import Link from "next/link";
import type { Metadata } from "next";
import { buildBrokerMappingAdminConsoleViewModel } from "../../../src/lib/trader-analytics";

export const metadata: Metadata = {
  title: "Broker Mapping Admin | Trader Intelligence",
};

export default function BrokerMappingsAdminPage() {
  const admin = buildBrokerMappingAdminConsoleViewModel();

  return (
    <main className="min-h-screen bg-zinc-950 px-5 py-8 text-zinc-100 sm:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="border-b border-zinc-800 pb-6">
          <Link className="text-sm text-sky-300 hover:text-sky-200" href="/workspace">
            Back to workspace
          </Link>
          <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-amber-300">
            Admin Surface
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-zinc-50">
            Broker Mapping Console
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-zinc-500">
            {admin.nextAction}
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="border border-zinc-800 bg-zinc-950 p-4">
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Fingerprints
            </div>
            <div className="mt-3 text-2xl font-semibold text-zinc-100">
              {admin.library.totalCount}
            </div>
          </div>
          <div className="border border-zinc-800 bg-zinc-950 p-4">
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Promoted
            </div>
            <div className="mt-3 text-2xl font-semibold text-emerald-300">
              {admin.library.promotedCount}
            </div>
          </div>
          <div className="border border-zinc-800 bg-zinc-950 p-4">
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Needs Review
            </div>
            <div className="mt-3 text-2xl font-semibold text-amber-300">
              {admin.library.needsReviewCount}
            </div>
          </div>
        </section>

        <section className="border border-zinc-800 bg-zinc-950 p-4">
          <h2 className="text-sm font-semibold text-zinc-100">
            Mapping Fingerprints
          </h2>
          <div className="mt-4 grid gap-4">
            {admin.library.entries.map((entry) => (
              <div key={entry.headerFingerprint} className="border-t border-zinc-900 py-4">
                <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="font-mono text-xs text-zinc-500">
                      {entry.headerFingerprint}
                    </div>
                    <div className="mt-2 text-sm text-zinc-300">
                      {entry.broker} / {entry.confidenceLevel} /{" "}
                      {entry.promotedStatus}
                    </div>
                  </div>
                  <div className="text-xs text-zinc-500">
                    samples {entry.sampleCount}
                  </div>
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <div className="text-xs text-zinc-500">
                    Detected: {entry.detectedFields.join(", ") || "none"}
                  </div>
                  <div className="text-xs text-zinc-500">
                    Missing: {entry.missingRequiredFields.join(", ") || "none"}
                  </div>
                </div>
                <div className="mt-3 text-sm text-zinc-400">
                  {entry.recommendedAction}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
