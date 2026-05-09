import type {
  ProductTraderAnalyticsViewModel,
  SavedExecutionTradeId,
} from "./types";

export type CoachingLanguageReadinessStatus = "pass" | "warn" | "fail";

export type CoachingLanguageTextSource =
  | "daily_coach_report"
  | "coach_home"
  | "session_prep"
  | "confidence_language"
  | "mistake_severity"
  | "coach_review_queue"
  | "session_recap";

export interface CoachingLanguageTextSample {
  id: string;
  source: CoachingLanguageTextSource;
  field: string;
  text: string;
  relatedTradeIds: SavedExecutionTradeId[];
}

export type CoachingLanguageViolationKind =
  | "empty_text"
  | "unsupported_market_context_claim"
  | "generic_fallback"
  | "duplicate_text";

export interface CoachingLanguageViolation {
  id: string;
  kind: CoachingLanguageViolationKind;
  severity: CoachingLanguageReadinessStatus;
  sourceId: string;
  source: CoachingLanguageTextSource;
  text: string;
  detail: string;
}

export interface CoachingLanguageReadinessReport {
  generatedAt: string;
  status: CoachingLanguageReadinessStatus;
  checkedTextCount: number;
  failureCount: number;
  warningCount: number;
  marketContextUsedForCoachConclusions: boolean;
  sampleData: boolean;
  unsupportedMarketContextTerms: string[];
  genericFallbackPhrases: string[];
  textSamples: CoachingLanguageTextSample[];
  violations: CoachingLanguageViolation[];
  nextAction: string;
}

const UNSUPPORTED_EXECUTION_ONLY_TERMS = [
  "vwap",
  "ema",
  "daily/4h",
  "support/resistance",
  "candle-confirmed",
  "market structure",
] as const;

const GENERIC_FALLBACK_PHRASES = [
  "avoid the top recurring risk",
  "repeat the clearest strength",
  "review the lowest-quality trade",
  "identify one repeatable behavior",
] as const;

function compactText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function sample(args: {
  id: string;
  source: CoachingLanguageTextSource;
  field: string;
  text: string | null | undefined;
  relatedTradeIds?: SavedExecutionTradeId[];
}): CoachingLanguageTextSample {
  return {
    id: args.id,
    source: args.source,
    field: args.field,
    text: compactText(args.text ?? ""),
    relatedTradeIds: args.relatedTradeIds ?? [],
  };
}

function collectCoachingLanguageText(
  analytics: ProductTraderAnalyticsViewModel,
): CoachingLanguageTextSample[] {
  const coach = analytics.coachActionLoop;
  const improvement = analytics.improvementIntelligence;
  const polish = analytics.productPolish;
  const texts: CoachingLanguageTextSample[] = [];

  texts.push(
    sample({
      id: "daily:fix_next_session",
      source: "daily_coach_report",
      field: "fixNextSession",
      text: improvement.dailyCoachReport.fixNextSession,
      relatedTradeIds: improvement.dailyCoachReport.relatedTradeIds,
    }),
    sample({
      id: "daily:preserve_next_session",
      source: "daily_coach_report",
      field: "preserveNextSession",
      text: improvement.dailyCoachReport.preserveNextSession,
      relatedTradeIds: improvement.dailyCoachReport.relatedTradeIds,
    }),
    sample({
      id: "daily:session_time_insight",
      source: "daily_coach_report",
      field: "sessionTimeInsight",
      text: improvement.dailyCoachReport.sessionTimeInsight,
      relatedTradeIds: improvement.dailyCoachReport.relatedTradeIds,
    }),
    sample({
      id: "coach_home:headline",
      source: "coach_home",
      field: "headline",
      text: coach.coachHome.headline,
      relatedTradeIds: coach.coachHome.primaryAction.relatedTradeIds,
    }),
    sample({
      id: "coach_home:subhead",
      source: "coach_home",
      field: "subhead",
      text: coach.coachHome.subhead,
      relatedTradeIds: coach.coachHome.primaryAction.relatedTradeIds,
    }),
    sample({
      id: "session_prep:rule_focus",
      source: "session_prep",
      field: "ruleFocus",
      text: coach.sessionPrepCard.ruleFocus,
      relatedTradeIds: coach.sessionPrepCard.reviewTradeIds,
    }),
    sample({
      id: "session_prep:avoid_behavior",
      source: "session_prep",
      field: "avoidBehavior",
      text: coach.sessionPrepCard.avoidBehavior,
      relatedTradeIds: coach.sessionPrepCard.reviewTradeIds,
    }),
    sample({
      id: "session_prep:repeat_behavior",
      source: "session_prep",
      field: "repeatBehavior",
      text: coach.sessionPrepCard.repeatBehavior,
      relatedTradeIds: coach.sessionPrepCard.reviewTradeIds,
    }),
    sample({
      id: "session_prep:session_time_insight",
      source: "session_prep",
      field: "sessionTimeInsight",
      text: coach.sessionPrepCard.sessionTimeInsight,
      relatedTradeIds: coach.sessionPrepCard.reviewTradeIds,
    }),
    sample({
      id: "session_recap:headline",
      source: "session_recap",
      field: "headline",
      text: polish.sessionRecap.headline,
      relatedTradeIds: polish.sessionRecap.reviewTradeIds,
    }),
    sample({
      id: "session_recap:next_action",
      source: "session_recap",
      field: "nextAction",
      text: polish.sessionRecap.nextAction,
      relatedTradeIds: polish.sessionRecap.reviewTradeIds,
    }),
  );

  for (const [index, action] of coach.coachHome.actions.entries()) {
    texts.push(
      sample({
        id: `coach_home:action:${index}:label`,
        source: "coach_home",
        field: "action.label",
        text: action.label,
        relatedTradeIds: action.relatedTradeIds,
      }),
      sample({
        id: `coach_home:action:${index}:detail`,
        source: "coach_home",
        field: "action.detail",
        text: action.detail,
        relatedTradeIds: action.relatedTradeIds,
      }),
    );
  }

  for (const [index, item] of coach.confidenceLanguage.items.entries()) {
    texts.push(
      sample({
        id: `confidence:${index}`,
        source: "confidence_language",
        field: "copy",
        text: item.copy,
      }),
    );
  }

  for (const [index, item] of coach.mistakeSeverityLadder.items.entries()) {
    texts.push(
      sample({
        id: `severity:${index}:next_action`,
        source: "mistake_severity",
        field: "nextAction",
        text: item.nextAction,
        relatedTradeIds: item.relatedTradeIds,
      }),
    );
  }

  for (const [index, item] of polish.coachReviewQueue.items.entries()) {
    texts.push(
      sample({
        id: `review_queue:${index}:title`,
        source: "coach_review_queue",
        field: "title",
        text: item.title,
        relatedTradeIds: item.relatedTradeIds,
      }),
      sample({
        id: `review_queue:${index}:reason`,
        source: "coach_review_queue",
        field: "reason",
        text: item.reason,
        relatedTradeIds: item.relatedTradeIds,
      }),
      sample({
        id: `review_queue:${index}:next_action`,
        source: "coach_review_queue",
        field: "nextAction",
        text: item.nextAction,
        relatedTradeIds: item.relatedTradeIds,
      }),
    );
  }

  return texts;
}

function violation(args: {
  kind: CoachingLanguageViolationKind;
  severity: CoachingLanguageReadinessStatus;
  sample: CoachingLanguageTextSample;
  detail: string;
}): CoachingLanguageViolation {
  return {
    id: `${args.kind}:${args.sample.id}`,
    kind: args.kind,
    severity: args.severity,
    sourceId: args.sample.id,
    source: args.sample.source,
    text: args.sample.text,
    detail: args.detail,
  };
}

export function buildCoachingLanguageReadinessReport(args: {
  analytics: ProductTraderAnalyticsViewModel;
  generatedAt?: string;
}): CoachingLanguageReadinessReport {
  const textSamples = collectCoachingLanguageText(args.analytics);
  const violations: CoachingLanguageViolation[] = [];
  const textCounts = new Map<string, CoachingLanguageTextSample[]>();

  for (const textSample of textSamples) {
    const lower = textSample.text.toLowerCase();

    textCounts.set(lower, [...(textCounts.get(lower) ?? []), textSample]);

    if (textSample.text.length === 0) {
      violations.push(
        violation({
          kind: "empty_text",
          severity: "fail",
          sample: textSample,
          detail: "Coach-facing copy should not render as an empty string.",
        }),
      );
    }

    if (!args.analytics.coachActionLoop.marketContextUsedForConclusions) {
      const matched = UNSUPPORTED_EXECUTION_ONLY_TERMS.find((term) =>
        lower.includes(term),
      );

      if (matched) {
        violations.push(
          violation({
            kind: "unsupported_market_context_claim",
            severity: "fail",
            sample: textSample,
            detail: `Execution-only coaching text referenced "${matched}".`,
          }),
        );
      }
    }

    const genericPhrase = GENERIC_FALLBACK_PHRASES.find((phrase) =>
      lower.includes(phrase),
    );

    if (genericPhrase && textSample.relatedTradeIds.length > 0) {
      violations.push(
        violation({
          kind: "generic_fallback",
          severity: "warn",
          sample: textSample,
          detail: `A related-trade coaching item still uses fallback wording: "${genericPhrase}".`,
        }),
      );
    }
  }

  for (const [text, samples] of textCounts.entries()) {
    if (text.length === 0 || samples.length < 2) {
      continue;
    }

    for (const textSample of samples.slice(1)) {
      violations.push(
        violation({
          kind: "duplicate_text",
          severity: "warn",
          sample: textSample,
          detail: `This exact coach-facing text appears ${samples.length} times in the readiness sample.`,
        }),
      );
    }
  }

  const failureCount = violations.filter(
    (item) => item.severity === "fail",
  ).length;
  const warningCount = violations.filter(
    (item) => item.severity === "warn",
  ).length;
  const status: CoachingLanguageReadinessStatus =
    failureCount > 0 ? "fail" : warningCount > 0 ? "warn" : "pass";

  return {
    generatedAt: args.generatedAt ?? new Date().toISOString(),
    status,
    checkedTextCount: textSamples.length,
    failureCount,
    warningCount,
    marketContextUsedForCoachConclusions:
      args.analytics.coachActionLoop.marketContextUsedForConclusions,
    sampleData: args.analytics.latestReport.sampleData,
    unsupportedMarketContextTerms: [...UNSUPPORTED_EXECUTION_ONLY_TERMS],
    genericFallbackPhrases: [...GENERIC_FALLBACK_PHRASES],
    textSamples,
    violations,
    nextAction:
      status === "fail"
        ? "Fix unsupported or empty coach language before launch verification."
        : status === "warn"
          ? "Review warning items and replace fallback or repeated copy where it weakens the coaching."
          : "Use fixture-specific coaching cases to continue language calibration.",
  };
}
