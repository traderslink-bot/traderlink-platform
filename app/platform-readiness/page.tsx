import { readFileSync } from "node:fs";
import { join } from "node:path";
import Link from "next/link";
import type { Metadata } from "next";
import {
  buildTraderFunctionalProductReadinessViewModel,
  buildTraderIntelligenceModuleReadinessViewModel,
  getBrokerCsvRegressionFixtureExpectations,
} from "../../src/lib/trader-analytics";

export const metadata: Metadata = {
  title: "Platform Readiness | Trader Intelligence",
};

function fixtureContentsByFile(): Record<string, string> {
  return Object.fromEntries(
    getBrokerCsvRegressionFixtureExpectations().map((expectation) => [
      expectation.fixtureFile,
      readFileSync(
        join(
          process.cwd(),
          "src/docs/trade-execution-import-fixtures",
          expectation.fixtureFile,
        ),
        "utf8",
      ),
    ]),
  );
}

function statusTone(status: string): string {
  return status === "complete" ||
    status === "available" ||
    status === "passed" ||
    status === "product_ready_prototype" ||
    status === "prototype_saved" ||
    status === "ready_for_analysis"
    ? "text-emerald-300"
    : status === "blocked" ||
        status === "locked" ||
        status === "blocked_for_live" ||
        status === "rejected"
      ? "text-rose-300"
      : "text-amber-300";
}

export default function PlatformReadinessPage() {
  const readiness = buildTraderIntelligenceModuleReadinessViewModel({
    fixtureContentsByFile: fixtureContentsByFile(),
  });
  const functional = buildTraderFunctionalProductReadinessViewModel();

  return (
    <main className="min-h-screen bg-zinc-950 px-5 py-8 text-zinc-100 sm:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="border-b border-zinc-800 pb-6">
          <Link className="text-sm text-sky-300 hover:text-sky-200" href="/intelligence">
            Back to Intelligence
          </Link>
          <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-emerald-400">
            Platform-Ready Feature Module
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-zinc-50">
            Trader Intelligence Readiness
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-zinc-500">
            {readiness.summary}
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-4">
          <div className="border border-zinc-800 bg-zinc-950 p-4">
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Context
            </div>
            <div className="mt-3 text-lg font-semibold text-sky-300">
              {readiness.context.environment}
            </div>
            <div className="mt-2 text-xs text-zinc-500">
              {readiness.context.moduleMountPath}
            </div>
          </div>
          <div className="border border-zinc-800 bg-zinc-950 p-4">
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Plan Tier
            </div>
            <div className="mt-3 text-2xl font-semibold text-zinc-100">
              {readiness.context.planTier}
            </div>
          </div>
          <div className="border border-zinc-800 bg-zinc-950 p-4">
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              No Export Audit
            </div>
            <div
              className={`mt-3 text-2xl font-semibold ${
                readiness.noExportAudit.passed
                  ? "text-emerald-300"
                  : "text-rose-300"
              }`}
            >
              {readiness.noExportAudit.passed ? "pass" : "review"}
            </div>
          </div>
          <div className="border border-zinc-800 bg-zinc-950 p-4">
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              CSV Fixtures
            </div>
            <div className="mt-3 text-2xl font-semibold text-emerald-300">
              {readiness.brokerFixtureHarness.passedCount}/
              {readiness.brokerFixtureHarness.totalCount}
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <div className="border border-zinc-800 bg-zinc-950 p-4">
            <h2 className="text-sm font-semibold text-zinc-100">
              Route Registry
            </h2>
            <div className="mt-4 grid gap-3">
              {readiness.routes
                .filter((item) => item.route.audience !== "debug")
                .map((item) => (
                  <div key={item.route.routeId} className="border-t border-zinc-900 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm text-zinc-300">
                        {item.route.label}
                      </span>
                      <span className={`text-xs ${statusTone(item.gate.state)}`}>
                        {item.gate.state}
                      </span>
                    </div>
                    <div className="mt-1 font-mono text-xs text-zinc-500">
                      {item.route.standalonePath} {"->"} {item.route.platformPath}
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div className="border border-zinc-800 bg-zinc-950 p-4">
            <h2 className="text-sm font-semibold text-zinc-100">
              Feature Readiness
            </h2>
            <div className="mt-4 grid gap-3">
              {readiness.readinessChecklist.map((item) => (
                <div key={item.id} className="border-t border-zinc-900 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-zinc-300">{item.label}</span>
                    <span className={`text-xs ${statusTone(item.status)}`}>
                      {item.status}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-zinc-500">
                    {item.detail}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-3">
          <div className="border border-zinc-800 bg-zinc-950 p-4">
            <h2 className="text-sm font-semibold text-zinc-100">
              Functional Loop
            </h2>
            <div className="mt-4 grid gap-3">
              <div className="border-t border-zinc-900 py-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-zinc-300">Import state</span>
                  <span className={`text-xs ${statusTone(functional.importState.state)}`}>
                    {functional.importState.state}
                  </span>
                </div>
                <div className="mt-1 text-xs text-zinc-500">
                  {functional.importState.primaryNextAction}
                </div>
              </div>
              <div className="border-t border-zinc-900 py-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-zinc-300">Prototype report</span>
                  <span
                    className={`text-xs ${statusTone(
                      functional.savedAnalysisPrototype.state.state,
                    )}`}
                  >
                    {functional.savedAnalysisPrototype.analyticsReportStatus}
                  </span>
                </div>
                <div className="mt-1 text-xs text-zinc-500">
                  {functional.savedAnalysisPrototype.generatedTradeIds.length} trade
                  preview(s), {functional.savedAnalysisPrototype.feedbackSummaryIds.length} feedback
                  summary item(s)
                </div>
              </div>
              <div className="border-t border-zinc-900 py-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-zinc-300">Truth-source audit</span>
                  <span
                    className={`text-xs ${
                      functional.truthSourceAudit.passed
                        ? "text-emerald-300"
                        : "text-rose-300"
                    }`}
                  >
                    {functional.truthSourceAudit.passed ? "pass" : "review"}
                  </span>
                </div>
                <div className="mt-1 text-xs text-zinc-500">
                  {functional.truthSourceAudit.checkedClaimCount} claim(s) checked
                </div>
              </div>
            </div>
          </div>

          <div className="border border-zinc-800 bg-zinc-950 p-4">
            <h2 className="text-sm font-semibold text-zinc-100">
              Behavior Test Harness
            </h2>
            <div className="mt-4 grid gap-3">
              <div className="border-t border-zinc-900 py-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-zinc-300">Synthetic personas</span>
                  <span className="text-xs text-emerald-300">
                    {
                      functional.personaEvaluations.filter(
                        (evaluation) => evaluation.matched,
                      ).length
                    }
                    /{functional.personaEvaluations.length}
                  </span>
                </div>
                <div className="mt-1 text-xs text-zinc-500">
                  Execution-only behavior profiles, no market context scoring.
                </div>
              </div>
              <div className="border-t border-zinc-900 py-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-zinc-300">Deterministic fuzz</span>
                  <span
                    className={`text-xs ${
                      functional.fuzzResult.allPassed
                        ? "text-emerald-300"
                        : "text-rose-300"
                    }`}
                  >
                    {functional.fuzzResult.passedCount}/
                    {functional.fuzzResult.scenarioCount}
                  </span>
                </div>
                <div className="mt-1 text-xs text-zinc-500">
                  Long, short, partial, open, invalid, and CSV rejection scenarios.
                </div>
              </div>
              <div className="border-t border-zinc-900 py-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-zinc-300">Calibration harness</span>
                  <span
                    className={`text-xs ${
                      functional.calibrationHarness.parseSucceeded
                        ? "text-emerald-300"
                        : "text-rose-300"
                    }`}
                  >
                    {functional.calibrationHarness.parseSucceeded
                      ? "parsed"
                      : "blocked"}
                  </span>
                </div>
                <div className="mt-1 text-xs text-zinc-500">
                  {functional.calibrationHarness.acceptedExecutionCount} execution(s),{" "}
                  {functional.calibrationHarness.groupedTradeCount} grouped trade(s)
                </div>
              </div>
            </div>
          </div>

          <div className="border border-zinc-800 bg-zinc-950 p-4">
            <h2 className="text-sm font-semibold text-zinc-100">
              Live Readiness
            </h2>
            <div className="mt-4 grid gap-3">
              <div className="border-t border-zinc-900 py-3">
                <div className="text-sm text-zinc-300">
                  {functional.readinessDashboard.summary}
                </div>
                <div className="mt-2 text-xs text-rose-300">
                  {functional.readinessDashboard.liveReadiness}
                </div>
              </div>
              {functional.readinessDashboard.topGoLiveBlockers
                .slice(0, 4)
                .map((blocker) => (
                  <div key={blocker} className="border-t border-zinc-900 py-2 text-xs text-zinc-500">
                    {blocker}
                  </div>
                ))}
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <div className="border border-zinc-800 bg-zinc-950 p-4">
            <h2 className="text-sm font-semibold text-zinc-100">
              Visual QA Targets
            </h2>
            <div className="mt-4 grid gap-2">
              {readiness.visualQaChecklist.slice(0, 12).map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 border-t border-zinc-900 py-2">
                  <span className="text-xs text-zinc-400">
                    {item.route} / {item.viewport}
                  </span>
                  <span className={`text-xs ${statusTone(item.status)}`}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="border border-zinc-800 bg-zinc-950 p-4">
            <h2 className="text-sm font-semibold text-zinc-100">
              Broker Fixture Harness
            </h2>
            <div className="mt-4 grid gap-2">
              {readiness.brokerFixtureHarness.results.map((item) => (
                <div key={item.fixtureFile} className="border-t border-zinc-900 py-2">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-zinc-400">
                      {item.fixtureFile}
                    </span>
                    <span
                      className={`text-xs ${
                        item.passed ? "text-emerald-300" : "text-rose-300"
                      }`}
                    >
                      {item.passed ? "pass" : "fail"}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-zinc-500">
                    {item.parsedAcceptedExecutions} executions /{" "}
                    {item.parsedGroupedTrades} trades
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
