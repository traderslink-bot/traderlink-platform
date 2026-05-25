import Link from "next/link";
import type { Metadata } from "next";
import { buildProductWorkflowShellViewModel } from "../../src/lib/trader-analytics";

export const metadata: Metadata = {
  title: "Account | Trader Intelligence",
};

export default function AccountPage() {
  const shell = buildProductWorkflowShellViewModel();
  const plan = shell.accountPlan;
  const storage = shell.storageBoundary;

  return (
    <main className="min-h-screen bg-zinc-950 px-5 py-8 text-zinc-100 sm:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="border-b border-zinc-800 pb-6">
          <Link className="text-sm text-sky-300 hover:text-sky-200" href="/intelligence">
            Back to Intelligence
          </Link>
          <h1 className="mt-3 text-3xl font-semibold text-zinc-50">
            Account And Plan
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-zinc-500">
            Product limits, storage boundary, and persistence readiness for the
            end-user app.
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-4">
          <div className="border border-zinc-800 bg-zinc-950 p-4">
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Current Plan
            </div>
            <div className="mt-3 text-2xl font-semibold text-sky-300">
              {plan.currentPlanId}
            </div>
          </div>
          <div className="border border-zinc-800 bg-zinc-950 p-4">
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Imports Used
            </div>
            <div className="mt-3 text-2xl font-semibold text-zinc-100">
              {plan.currentUsage.importsThisMonth}
            </div>
          </div>
          <div className="border border-zinc-800 bg-zinc-950 p-4">
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Saved Trades
            </div>
            <div className="mt-3 text-2xl font-semibold text-zinc-100">
              {plan.currentUsage.savedTradeCount}
            </div>
          </div>
          <div className="border border-zinc-800 bg-zinc-950 p-4">
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Storage Mode
            </div>
            <div className="mt-3 text-lg font-semibold text-amber-300">
              {storage.mode}
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-3">
          {plan.plans.map((item) => (
            <div key={item.id} className="border border-zinc-800 bg-zinc-950 p-4">
              <h2 className="text-sm font-semibold text-zinc-100">
                {item.label}
              </h2>
              <div className="mt-4 grid gap-2 text-xs text-zinc-500">
                <div>{item.importsPerMonth} imports per month</div>
                <div>{item.savedTradeHistoryMonths} months history</div>
                <div>{item.activeRuleLimit} active rules</div>
                <div>market context: {item.marketContextAvailability}</div>
                <div>broker support: {item.brokerSupportLevel}</div>
              </div>
            </div>
          ))}
        </section>

        <section className="border border-zinc-800 bg-zinc-950 p-4">
          <h2 className="text-sm font-semibold text-zinc-100">
            Storage Implementation Boundary
          </h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {storage.entityGroups.map((group) => (
              <div key={group.id} className="border-t border-zinc-900 py-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-zinc-300">{group.label}</span>
                  <span className="text-xs uppercase tracking-wide text-zinc-500">
                    {group.status}
                  </span>
                </div>
                <div className="mt-1 text-xs text-zinc-500">{group.notes}</div>
              </div>
            ))}
          </div>
          <div className="mt-6 grid gap-2">
            {storage.blockers.map((blocker) => (
              <div key={blocker} className="border-t border-zinc-900 py-2 text-xs text-amber-300">
                {blocker}
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
