import Link from "next/link";
import type {
  AnalyticsBehaviorReport,
  AnalyticsBehaviorReportEvidenceItem,
  AnalyticsBehaviorReportGroup,
} from "@/src/lib/trader-analytics/server/analytics-behavior-report";
import { withPageAnchor } from "@/app/app-ui";

type CoachSequenceTone = "danger" | "info" | "success" | "warning";

interface CoachBehaviorSequenceSelection {
  focusGroup: AnalyticsBehaviorReportGroup | null;
  focusKind: "risk" | "strength" | "review" | "empty";
  reviewGroup: AnalyticsBehaviorReportGroup | null;
  riskGroup: AnalyticsBehaviorReportGroup | null;
  strengthGroup: AnalyticsBehaviorReportGroup | null;
}

function formatSigned(value: number | null): string {
  if (typeof value !== "number") {
    return "n/a";
  }

  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}`;
}

function evidenceHref(href: string): string {
  return href.startsWith("/intelligence/trades/")
    ? withPageAnchor(href, "writing-flow")
    : href;
}

function itemToneClass(tone: string): string {
  switch (tone) {
    case "danger":
      return "border-rose-200 bg-rose-50 text-rose-800";
    case "success":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    case "warning":
      return "border-amber-200 bg-amber-50 text-amber-800";
    default:
      return "border-sky-200 bg-sky-50 text-sky-800";
  }
}

function focusTone(focusKind: CoachBehaviorSequenceSelection["focusKind"]): CoachSequenceTone {
  if (focusKind === "risk") {
    return "danger";
  }

  if (focusKind === "strength") {
    return "success";
  }

  if (focusKind === "review") {
    return "warning";
  }

  return "info";
}

function focusLabel(focusKind: CoachBehaviorSequenceSelection["focusKind"]): string {
  if (focusKind === "risk") {
    return "Reduce first";
  }

  if (focusKind === "strength") {
    return "Repeat first";
  }

  if (focusKind === "review") {
    return "Review before deciding";
  }

  return "Collect examples";
}

function focusAction(
  focusKind: CoachBehaviorSequenceSelection["focusKind"],
  group: AnalyticsBehaviorReportGroup | null,
): string {
  if (!group) {
    return "Save more trades and finish reviews so the coach can choose one behavior path.";
  }

  if (focusKind === "risk") {
    return "Open the evidence trades and write the rule that would have changed the first decision.";
  }

  if (focusKind === "strength") {
    return "Open the evidence trades and write the cue that made this behavior worth repeating.";
  }

  if (focusKind === "review") {
    return "Open the evidence trades and decide whether this should become a rule, a strength, or just a note.";
  }

  return group.actionLabel;
}

function focusWhy(
  focusKind: CoachBehaviorSequenceSelection["focusKind"],
  group: AnalyticsBehaviorReportGroup | null,
  chartTierEnabled: boolean,
): string {
  if (!group) {
    return chartTierEnabled
      ? "The coach will only pick a confident path when saved trade and chart evidence is strong enough. Until then, keep reviewing the next trade and collecting examples."
      : "The coach will only pick a confident path when saved execution evidence is strong enough. Until then, keep reviewing the next trade and collecting examples.";
  }

  if (focusKind === "risk") {
    return chartTierEnabled
      ? "This is the clearest chart-supported risk in the saved evidence. The goal is not to read every report card first; it is to prove this behavior, write one rule, and review the next trade."
      : "This is the clearest execution-supported risk in the saved evidence. The goal is not to read every report card first; it is to prove this behavior, write one rule, and review the next trade.";
  }

  if (focusKind === "strength") {
    return "This is the strongest repeatable behavior in the saved evidence. Preserve the cue that helped the trade instead of forcing every coaching session into problem language.";
  }

  if (focusKind === "review") {
    return chartTierEnabled
      ? "The evidence is useful, but it is not strong enough for a conclusion yet. Treat it as a review task until the replay, chart evidence, or written review proves what happened."
      : "The evidence is useful, but it is not strong enough for a conclusion yet. Treat it as a review task until the replay or written review proves what happened.";
  }

  return group.description;
}

function groupWith(
  groups: AnalyticsBehaviorReportGroup[],
  metric: "reviewPromptCount" | "riskCount" | "strengthCount",
): AnalyticsBehaviorReportGroup | null {
  return (
    [...groups]
      .filter((group) => group[metric] > 0)
      .sort((left, right) => {
        const metricDelta = right[metric] - left[metric];
        if (metricDelta !== 0) {
          return metricDelta;
        }

        return right.count - left.count;
      })[0] ?? null
  );
}

export function selectCoachBehaviorSequence(
  report: AnalyticsBehaviorReport,
): CoachBehaviorSequenceSelection {
  const riskGroup = groupWith(report.groups, "riskCount");
  const strengthGroup = groupWith(report.groups, "strengthCount");
  const reviewGroup = groupWith(report.groups, "reviewPromptCount");

  if (riskGroup) {
    return {
      focusGroup: riskGroup,
      focusKind: "risk",
      reviewGroup,
      riskGroup,
      strengthGroup,
    };
  }

  if (strengthGroup) {
    return {
      focusGroup: strengthGroup,
      focusKind: "strength",
      reviewGroup,
      riskGroup,
      strengthGroup,
    };
  }

  if (reviewGroup) {
    return {
      focusGroup: reviewGroup,
      focusKind: "review",
      reviewGroup,
      riskGroup,
      strengthGroup,
    };
  }

  return {
    focusGroup: null,
    focusKind: "empty",
    reviewGroup,
    riskGroup,
    strengthGroup,
  };
}

function uniqueEvidence(
  selection: CoachBehaviorSequenceSelection,
): AnalyticsBehaviorReportEvidenceItem[] {
  const seen = new Set<string>();
  const items = [
    ...(selection.focusGroup?.evidence ?? []),
    ...(selection.strengthGroup?.evidence ?? []),
    ...(selection.reviewGroup?.evidence ?? []),
  ];

  return items
    .filter((item) => {
      const key = `${item.tradeId}-${item.findingLabel}`;
      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    })
    .slice(0, 5);
}

function MiniGroup({
  group,
  label,
  tone,
}: {
  group: AnalyticsBehaviorReportGroup | null;
  label: string;
  tone: CoachSequenceTone;
}) {
  return (
    <div className={`rounded-md border p-3 ${itemToneClass(tone)}`}>
      <div className="text-xs font-semibold uppercase tracking-wide">
        {label}
      </div>
      <div className="mt-2 text-sm font-semibold leading-6">
        {group?.title ?? "Waiting for enough evidence"}
      </div>
      <div className="mt-1 text-xs leading-5 opacity-80">
        {group
          ? `${group.riskCount} risk, ${group.strengthCount} strength, ${group.reviewPromptCount} review`
          : "Keep reviewing saved trades before turning this into a rule."}
      </div>
    </div>
  );
}

export function CoachBehaviorSequence({
  chartTierEnabled = true,
  report,
}: {
  chartTierEnabled?: boolean;
  report: AnalyticsBehaviorReport;
}) {
  const selection = selectCoachBehaviorSequence(report);
  const evidenceItems = uniqueEvidence(selection);
  const tone = focusTone(selection.focusKind);
  const label = focusLabel(selection.focusKind);
  const title = selection.focusGroup?.title ?? "Collect more behavior evidence";

  return (
    <section
      className="ti-coach-brief p-5 sm:p-6"
      data-testid="coach-behavior-sequence"
    >
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(300px,0.35fr)]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Behavior Coaching Sequence
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">
            Choose one behavior path before reading the whole report.
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Analytics can show every behavior group. Coach starts smaller:
            pick the clearest risk, strength, or review prompt, then prove it
            with a few trades and write the next rule.
          </p>
        </div>
        <div className={`rounded-md border p-4 ${itemToneClass(tone)}`}>
          <div className="text-xs font-semibold uppercase tracking-wide">
            {label}
          </div>
          <div className="mt-2 text-xl font-semibold leading-7">{title}</div>
          <div className="mt-2 text-xs leading-5 opacity-80">
            {selection.focusGroup?.question ??
              "The coach is still waiting for enough saved evidence to choose a behavior path."}
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(320px,0.45fr)]">
        <div className="ti-coach-brief-cell">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Why this matters
          </div>
          <div className="mt-2 text-sm leading-6 text-slate-700">
            {focusWhy(
              selection.focusKind,
              selection.focusGroup,
              chartTierEnabled,
            )}
          </div>
          <div className="mt-4 border-t border-slate-200 pt-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              What to do next
            </div>
            <div className="mt-2 text-sm font-semibold leading-6 text-slate-950">
              {focusAction(selection.focusKind, selection.focusGroup)}
            </div>
          </div>
        </div>

        <div className="grid gap-3">
          <MiniGroup group={selection.riskGroup} label="Top risk to reduce" tone="danger" />
          <MiniGroup
            group={selection.strengthGroup}
            label="Top strength to repeat"
            tone="success"
          />
          <MiniGroup
            group={selection.reviewGroup}
            label="Top review prompt"
            tone="warning"
          />
        </div>
      </div>

      <div className="mt-5 ti-coach-brief-cell">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Trades that prove it
            </div>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Open the replay, write one lesson, then return to the queue or
              progress view.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              className="rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-semibold text-sky-800 transition hover:border-sky-400"
              href="/intelligence/review?queue=highest_priority"
            >
              Open review queue
            </Link>
            <Link
              className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400"
              href="/intelligence/progress#progress-follow-through"
            >
              Check progress
            </Link>
          </div>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {evidenceItems.length === 0 ? (
            <div className="rounded-md border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-600">
              Save and review more trades to build a coaching evidence queue.
            </div>
          ) : (
            evidenceItems.map((item) => (
              <Link
                className="rounded-md border border-slate-200 bg-white p-4 transition hover:border-sky-400"
                href={evidenceHref(item.href)}
                key={`${item.tradeId}-${item.findingLabel}`}
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="text-sm font-semibold text-slate-950">
                      {item.symbol}{" "}
                      <span
                        className={
                          typeof item.pnl === "number" && item.pnl < 0
                            ? "text-rose-700"
                            : "text-emerald-700"
                        }
                      >
                        {formatSigned(item.pnl)}
                      </span>
                    </div>
                    <div className="mt-1 text-xs leading-5 text-slate-500">
                      {item.findingLabel}
                    </div>
                  </div>
                  <span
                    className={`w-fit rounded-md border px-2 py-1 text-[11px] font-semibold uppercase tracking-wide ${itemToneClass(item.tone)}`}
                  >
                    {item.opportunityType === "risk_to_reduce"
                      ? "Risk"
                      : item.opportunityType === "strength_to_repeat"
                        ? "Strength"
                        : "Review"}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-700">
                  {item.detail}
                </p>
                <p className="mt-2 text-sm font-semibold leading-6 text-sky-700">
                  {item.reviewAction}
                </p>
              </Link>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
