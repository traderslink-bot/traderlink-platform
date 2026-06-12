import Link from "next/link";
import type {
  AnalyticsBehaviorReport,
  AnalyticsBehaviorReportGroup,
  AnalyticsBehaviorReportTone,
} from "../src/lib/trader-analytics/server/analytics-behavior-report";

type BehaviorReportPanelMode = "analytics" | "coach";

function formatSigned(value: number | null): string {
  if (typeof value !== "number") {
    return "n/a";
  }

  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}`;
}

function toneForPnl(value: number): string {
  return value >= 0 ? "text-emerald-300" : "text-rose-300";
}

function behaviorReportToneClasses(tone: AnalyticsBehaviorReportTone): string {
  switch (tone) {
    case "danger":
      return "border-rose-900/70 bg-rose-950/20 text-rose-100";
    case "success":
      return "border-emerald-900/70 bg-emerald-950/20 text-emerald-100";
    case "warning":
      return "border-amber-900/70 bg-amber-950/20 text-amber-100";
    default:
      return "border-sky-900/70 bg-sky-950/20 text-sky-100";
  }
}

function behaviorReportBadgeClasses(tone: string): string {
  switch (tone) {
    case "danger":
      return "border-rose-800/70 bg-rose-950/40 text-rose-200";
    case "success":
      return "border-emerald-800/70 bg-emerald-950/40 text-emerald-200";
    case "warning":
      return "border-amber-800/70 bg-amber-950/40 text-amber-200";
    default:
      return "border-zinc-700 bg-zinc-900/60 text-zinc-300";
  }
}

function firstGroupWith(
  groups: AnalyticsBehaviorReportGroup[],
  metric: "reviewPromptCount" | "riskCount" | "strengthCount",
): AnalyticsBehaviorReportGroup | null {
  return groups.find((group) => group[metric] > 0) ?? null;
}

function coachGroupAction(group: AnalyticsBehaviorReportGroup): string {
  if (group.riskCount > 0) {
    return "Reduce first";
  }

  if (group.strengthCount > 0) {
    return "Repeat first";
  }

  if (group.reviewPromptCount > 0) {
    return "Review before deciding";
  }

  return "Collect more examples";
}

function CoachBehaviorSummary({
  chartTierEnabled = true,
  report,
}: {
  chartTierEnabled?: boolean;
  report: AnalyticsBehaviorReport;
}) {
  const riskGroup = firstGroupWith(report.groups, "riskCount");
  const strengthGroup = firstGroupWith(report.groups, "strengthCount");
  const reviewGroup = firstGroupWith(report.groups, "reviewPromptCount");

  return (
    <div className="mt-5 grid gap-3 lg:grid-cols-3">
      <div className="ti-coach-brief-cell">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Reduce first
        </div>
        <div className="mt-2 text-sm font-semibold leading-6 text-rose-700">
          {riskGroup?.title ??
            (chartTierEnabled
              ? "No chart-confirmed risk yet"
              : "No execution-confirmed risk yet")}
        </div>
        <div className="mt-2 text-xs leading-5 text-slate-500">
          {riskGroup?.description ??
            (chartTierEnabled
              ? "Keep collecting saved trades and chart data before the coach turns this into a risk rule."
              : "Keep saving and reviewing executions before the coach turns this into a risk rule.")}
        </div>
      </div>
      <div className="ti-coach-brief-cell">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Repeat first
        </div>
        <div className="mt-2 text-sm font-semibold leading-6 text-emerald-700">
          {strengthGroup?.title ??
            (chartTierEnabled
              ? "No chart-confirmed strength yet"
              : "No execution-confirmed strength yet")}
        </div>
        <div className="mt-2 text-xs leading-5 text-slate-500">
          {strengthGroup?.description ??
            "The coach will only praise entries, exits, adds, or profit protection when saved evidence supports it."}
        </div>
      </div>
      <div className="ti-coach-brief-cell">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Needs review
        </div>
        <div className="mt-2 text-sm font-semibold leading-6 text-amber-700">
          {reviewGroup?.title ??
            (chartTierEnabled
              ? "No open chart prompt yet"
              : "No open execution prompt yet")}
        </div>
        <div className="mt-2 text-xs leading-5 text-slate-500">
          {reviewGroup?.description ??
            "Uncertain behavior stays as a review prompt instead of being treated as a coaching conclusion."}
        </div>
      </div>
    </div>
  );
}

export function BehaviorReportPanel({
  chartTierEnabled = true,
  mode = "analytics",
  report,
}: {
  chartTierEnabled?: boolean;
  mode?: BehaviorReportPanelMode;
  report: AnalyticsBehaviorReport;
}) {
  const isCoach = mode === "coach";
  const testId = isCoach
    ? "coach-behavior-report"
    : "analytics-behavior-report";
  const sectionClass = isCoach ? "ti-coach-brief p-5 sm:p-6" : "ti-panel p-5";
  const eyebrow = isCoach ? "Behavior Coaching Map" : "Behavior Report";
  const title = isCoach
    ? chartTierEnabled
      ? "Use chart-supported behavior groups to choose what to reduce or repeat."
      : "Use execution-supported behavior groups to choose what to reduce or repeat."
    : "What should the trader study from the saved evidence?";
  const body = isCoach
    ? chartTierEnabled
      ? "This uses saved trades and chart checks to set a coaching order: reduce the clearest risk, repeat the strongest behavior, and keep uncertain chart behavior as a review prompt."
      : "This uses saved executions and written reviews to set a coaching order: reduce the clearest risk, repeat the strongest behavior, and keep uncertain behavior as a review prompt."
    : chartTierEnabled
      ? "These groups translate saved executions and any attached chart-context evidence into review questions. Green means repeatable strength, red means risk to inspect, and amber means the evidence is a prompt rather than a conclusion."
      : "These groups translate saved executions and written reviews into behavior questions. Green means repeatable strength, red means risk to inspect, and amber means the evidence is a prompt rather than a conclusion.";

  return (
    <section className={sectionClass} data-testid={testId}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p
            className={`text-xs font-semibold uppercase tracking-wide ${
              isCoach ? "text-slate-500" : "text-emerald-300"
            }`}
          >
            {eyebrow}
          </p>
          <h2
            className={`mt-2 text-2xl font-semibold ${
              isCoach ? "text-slate-950" : "text-zinc-50"
            }`}
          >
            {title}
          </h2>
          <p
            className={`mt-2 max-w-3xl text-sm leading-6 ${
              isCoach ? "text-slate-600" : "text-zinc-400"
            }`}
          >
            {body}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div
            className={`rounded-md border border-rose-900/60 bg-rose-950/20 px-3 py-2 ${
              isCoach ? "text-rose-700" : "text-rose-200"
            }`}
          >
            <div className="font-mono text-lg">{report.riskCount}</div>
            <div>risk</div>
          </div>
          <div
            className={`rounded-md border border-emerald-900/60 bg-emerald-950/20 px-3 py-2 ${
              isCoach ? "text-emerald-700" : "text-emerald-200"
            }`}
          >
            <div className="font-mono text-lg">{report.strengthCount}</div>
            <div>strength</div>
          </div>
          <div
            className={`rounded-md border border-amber-900/60 bg-amber-950/20 px-3 py-2 ${
              isCoach ? "text-amber-700" : "text-amber-200"
            }`}
          >
            <div className="font-mono text-lg">
              {report.reviewPromptCount}
            </div>
            <div>review</div>
          </div>
        </div>
      </div>

      {isCoach ? (
        <CoachBehaviorSummary
          chartTierEnabled={chartTierEnabled}
          report={report}
        />
      ) : null}

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        {report.groups.map((group) => (
          <article
            className={`rounded-md border p-4 ${behaviorReportToneClasses(group.tone)}`}
            data-testid={`${testId}-${group.id}`}
            key={group.id}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-base font-semibold text-zinc-50">
                  {group.title}
                </h3>
                <p className="mt-1 text-sm leading-6 text-zinc-300">
                  {group.question}
                </p>
              </div>
              <div className="grid grid-cols-3 gap-1 text-center text-[11px]">
                <div className="rounded border border-rose-900/50 bg-rose-950/20 px-2 py-1 text-rose-200">
                  {group.riskCount} red
                </div>
                <div className="rounded border border-emerald-900/50 bg-emerald-950/20 px-2 py-1 text-emerald-200">
                  {group.strengthCount} green
                </div>
                <div className="rounded border border-amber-900/50 bg-amber-950/20 px-2 py-1 text-amber-200">
                  {group.reviewPromptCount} review
                </div>
              </div>
            </div>
            <p className="mt-3 text-sm leading-6 text-zinc-300">
              {group.description}
            </p>
            {isCoach ? (
              <div className="mt-3 w-fit rounded-md border border-white/20 bg-white/10 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-zinc-100">
                {coachGroupAction(group)}
              </div>
            ) : null}

            {group.evidence.length > 0 ? (
              <div className="mt-4 grid gap-3">
                {group.evidence.map((item) => {
                  const pnlClass =
                    typeof item.pnl === "number"
                      ? toneForPnl(item.pnl)
                      : "text-zinc-400";

                  return (
                    <Link
                      className="block rounded-md border border-zinc-700/70 bg-white/[0.03] p-3 transition hover:border-sky-500"
                      href={item.href}
                      key={`${group.id}-${item.tradeId}-${item.findingLabel}`}
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="text-sm font-semibold text-zinc-50">
                            {item.symbol}{" "}
                            <span className={pnlClass}>
                              {formatSigned(item.pnl)}
                            </span>
                          </div>
                          <div className="mt-1 text-xs text-zinc-400">
                            {item.findingLabel}
                          </div>
                        </div>
                        <span
                          className={`w-fit rounded border px-2 py-1 text-[11px] font-semibold uppercase tracking-wide ${behaviorReportBadgeClasses(item.tone)}`}
                        >
                          {item.opportunityType === "risk_to_reduce"
                            ? "Risk"
                            : item.opportunityType === "strength_to_repeat"
                              ? "Strength"
                              : "Review"}
                        </span>
                      </div>
                      <p className="mt-2 text-xs leading-5 text-zinc-300">
                        {item.detail}
                      </p>
                      <p className="mt-2 text-xs leading-5 text-sky-200">
                        {item.reviewAction}
                      </p>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="mt-4 rounded-md border border-zinc-700/60 bg-zinc-900/40 p-3 text-sm leading-6 text-zinc-400">
                {group.emptyState}
              </div>
            )}

            <Link
              className="mt-4 inline-flex text-sm font-medium text-sky-300 hover:text-sky-200"
              href={
                group.evidence[0]?.href ??
                (group.id === "volume-reentry"
                  ? "/intelligence/trades?storyFilter=volume#ticker-stories"
                  : "/intelligence/trades?storyFilter=levels#ticker-stories")
              }
            >
              {isCoach ? "Open saved example" : group.actionLabel}
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
