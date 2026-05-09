import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin And QA Tools | Trader Intelligence",
};

const adminRouteGroups = [
  {
    title: "Import QA",
    detail:
      "Representative broker fixtures, repair diagnostics, import health, and cockpit-style review tools.",
    routes: [
      ["/import-trials", "Import Trials"],
      ["/import-health", "Import Health"],
      ["/repair-wizard", "Repair Wizard"],
      ["/review-cockpit", "Review Cockpit"],
    ],
  },
  {
    title: "Calibration And Readiness",
    detail:
      "Operator-facing checks for market context boundaries, platform readiness, and calibration state.",
    routes: [
      ["/calibration", "Calibration"],
      ["/platform-readiness", "Platform Readiness"],
      ["/account", "Account And Plan"],
      ["/admin/broker-mappings", "Broker Mapping Admin"],
    ],
  },
  {
    title: "Debug Consoles",
    detail:
      "Developer-only request builders and raw diagnostic tools. Keep these out of the trader workflow.",
    routes: [
      ["/debug/trade-analysis", "Trade Analysis Debug"],
      ["/debug/execution-feedback", "Execution Feedback Debug"],
      ["/debug/trader-analytics", "Trader Analytics Debug"],
    ],
  },
] as const;

export default function WorkspaceAdminPage() {
  return (
    <main className="min-h-screen bg-zinc-950 px-5 py-8 text-zinc-100 sm:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="border-b border-zinc-800 pb-6">
          <Link className="text-sm text-sky-300 hover:text-sky-200" href="/workspace">
            Back to workspace
          </Link>
          <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-amber-300">
            Internal Tools
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-zinc-50">
            Admin And QA Tools
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-500">
            Backend, webmaster, calibration, and QA surfaces live here so the
            trader-facing workspace can stay focused on import, review, coaching,
            and progress.
          </p>
        </header>

        <section className="grid gap-5 lg:grid-cols-3">
          {adminRouteGroups.map((group) => (
            <div
              className="border border-zinc-800 bg-zinc-950 p-5"
              key={group.title}
            >
              <h2 className="text-sm font-semibold text-zinc-100">
                {group.title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-zinc-500">
                {group.detail}
              </p>
              <div className="mt-5 grid gap-3">
                {group.routes.map(([href, label]) => (
                  <Link
                    className="border-t border-zinc-900 py-3 text-sm text-sky-300 hover:text-sky-200"
                    href={href}
                    key={href}
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </section>

        <section className="border border-amber-900/70 bg-amber-950/10 p-4">
          <h2 className="text-sm font-semibold text-amber-200">
            Product Boundary
          </h2>
          <p className="mt-2 text-sm leading-6 text-zinc-400">
            These pages can remain available during local development and QA, but
            they should not be the default closed-beta user experience. The
            end-user app should earn trust through the workspace, import flow,
            saved trades, coach, review, analytics, and progress pages.
          </p>
        </section>
      </div>
    </main>
  );
}
