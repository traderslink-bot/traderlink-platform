import { createHash } from "node:crypto";

import Decimal from "decimal.js";

import type {
  CoachAiReviewCalculationSource,
  CoachAiReviewInsightCandidate,
  CoachAiReviewInsightLane,
  CoachAiReviewLaneScore,
  CoachAiReviewMeasurement,
  CoachAiReviewScoreDimensionName,
} from "@/src/modules/coach/contracts/coach-ai-review-insight-contracts";
import {
  COACH_AI_REVIEW_PLAN_CATALOG_VERSION,
  COACH_AI_REVIEW_RENDERER_VERSION,
  type CoachAiReviewClaimKind,
  type CoachAiReviewCompletePlan,
  type CoachAiReviewNotAvailableReason,
  type CoachAiReviewRenderedClaim,
  type CoachAiReviewRenderedFocusQuestion,
  type CoachAiReviewRenderedOutput,
  type CoachAiReviewRenderedPlanCatalog,
  type CoachAiReviewRenderedSectionPlan,
  type CoachAiReviewSectionKey,
  type CoachAiReviewSectionPurpose,
  type CoachAiReviewSectionSelectionMode,
} from "@/src/modules/coach/contracts/coach-ai-review-rendered-plan-contracts";
import { assertCoachAiReviewOutputSafe } from "../coach-ai-review-output-safety";
import {
  CoachAiReviewInsightInvariantError,
  compareCoachAiReviewText,
  freezeSortedUniqueRefs,
} from "./coach-ai-review-insight-normalizer";
import type {
  CoachAiReviewBalancedShortlist,
  CoachAiReviewShortlistEntry,
} from "./coach-ai-review-insight-shortlist";

const ExactDecimal = Decimal.clone({ precision: 160, rounding: Decimal.ROUND_HALF_UP });

const NARRATIVE_LIMITS = Object.freeze({
  weekly: Object.freeze({ opening: 1800, section: 1500, focus: 280, incomplete: 1000 }),
  two_week: Object.freeze({ opening: 1800, section: 1500, focus: 280, incomplete: 1000 }),
  monthly: Object.freeze({ opening: 2400, section: 1800, focus: 280, incomplete: 1200 }),
});

function invariant(condition: boolean, code: string): asserts condition {
  if (!condition) throw new CoachAiReviewInsightInvariantError(code);
}

function digestRef(prefix: string, parts: readonly unknown[]): string {
  return `${prefix}_${createHash("sha256").update(JSON.stringify(parts)).digest("hex").slice(0, 24)}`;
}

function dimensionValue(
  score: CoachAiReviewLaneScore,
  name: CoachAiReviewScoreDimensionName,
): number | null {
  return score.dimensions.find((dimension) => dimension.name === name)?.value ?? null;
}

function measurement(
  candidate: CoachAiReviewInsightCandidate,
  metricName: string,
): CoachAiReviewMeasurement | null {
  return candidate.measurements.find((item) => item.metricName === metricName) ?? null;
}

function availableMeasurement(
  candidate: CoachAiReviewInsightCandidate,
  metricName: string,
): CoachAiReviewMeasurement | null {
  const value = measurement(candidate, metricName);
  return value !== null && value.exactValue !== null &&
      (value.availability === "available" || value.availability === "partial_display_only")
    ? value
    : null;
}

function displayDecimal(value: string): string {
  const decimal = new ExactDecimal(value);
  invariant(decimal.isFinite(), "TRADERLINK_AI_REVIEW_RENDER_DECIMAL_INVALID");
  const rounded = decimal.toDecimalPlaces(2);
  return rounded.isZero() ? "0" : rounded.toFixed();
}

function displayPercent(value: string): string {
  return `${displayDecimal(new ExactDecimal(value).times(100).toFixed())}%`;
}

function displayMoneyAmount(value: string, currency: string): string {
  return `${currency} ${displayDecimal(new ExactDecimal(value).abs().toFixed())}`;
}

function sentence(value: string): string {
  const normalized = value.replace(/[\u0000-\u001f\u007f]+/gu, " ").replace(/\s+/gu, " ").trim();
  invariant(normalized.length > 0, "TRADERLINK_AI_REVIEW_RENDER_EMPTY_SENTENCE");
  return /[.!?]$/u.test(normalized) ? normalized : `${normalized}.`;
}

function lowerFirst(value: string): string {
  return value.length === 0 ? value : `${value[0]!.toLocaleLowerCase()}${value.slice(1)}`;
}

function withoutSentenceEnd(value: string): string {
  return value.replace(/[.!?]+$/u, "");
}

function normalizedLabel(value: string): string {
  const normalized = value.replace(/[\u0000-\u001f\u007f]+/gu, " ").replace(/\s+/gu, " ").trim();
  invariant(normalized.length > 0, "TRADERLINK_AI_REVIEW_RENDER_LABEL_EMPTY");
  const segments = [...new Intl.Segmenter("en", { granularity: "grapheme" }).segment(normalized)]
    .map((item) => item.segment);
  if (segments.length <= 80) return normalized;
  return `${segments.slice(0, 72).join("")}...`;
}

function candidateSubject(candidate: CoachAiReviewInsightCandidate): string {
  if (candidate.subjectLabel) return candidate.family === "fixed_cohort" ||
      candidate.family === "concentration_outlier"
    ? normalizedLabel(candidate.subjectLabel)
    : `"${normalizedLabel(candidate.subjectLabel)}"`;
  switch (candidate.family) {
    case "favorable_move_outcome": return "profit protection after favorable movement";
    case "entry_evidence": return "entry execution";
    case "add_sequence": return "add timing";
    case "exit_sequence": return "exit execution";
    case "risk_stop_sizing": return "risk, stop, and sizing execution";
    case "reentry_day_sequence": return "re-entry execution";
    case "concentration_outlier": return "result concentration";
    case "fixed_cohort": return "this fixed trade cohort";
    case "positive_process": return "the measured strength";
    case "result_process_contrast": return "the result-and-process contrast";
    case "focus_follow_through": return "the earlier focus";
    case "named_rule_association":
    case "rule_trend": return "the reviewed rule";
    case "period_outcome": return "the period result";
  }
}

function affectedFindingPhrase(candidate: CoachAiReviewInsightCandidate): string {
  if (candidate.family === "named_rule_association" || candidate.family === "rule_trend") {
    return candidateSubject(candidate);
  }
  if (candidate.subjectRef.startsWith("contrast:profitable_broken") && candidate.subjectLabel) {
    return `${candidateSubject(candidate)} breaks on profitable trades`;
  }
  if (candidate.subjectRef.startsWith("contrast:losing_followed") && candidate.subjectLabel) {
    return `${candidateSubject(candidate)} followed on losing trades`;
  }
  if (candidate.relatedRuleRefs.length > 0 && candidate.subjectLabel) {
    return `${candidateSubject(candidate)} violations`;
  }
  if (candidate.subjectRef.startsWith("favorable_move:green_to_red_ended_red")) {
    return "Trades that moved green, crossed red, and still closed red";
  }
  if (candidate.subjectRef.startsWith("favorable_move:green_to_red_recovered")) {
    return "Trades that moved green, crossed red, and recovered above breakeven";
  }
  if (candidate.subjectRef.startsWith("favorable_move:gave_back_at_least_half_peak")) {
    return "Profitable trades that gave back at least half of their measured peak";
  }
  if (candidate.subjectRef.startsWith("exit_sequence:retained_at_least_70pct_peak")) {
    return "Profitable trades that retained at least 70% of their measured peak";
  }
  if (candidate.subjectRef.startsWith("add_sequence:add_after_measured_peak")) {
    return "Analyzed add trades with an add after the measured P/L peak";
  }
  if (candidate.subjectRef.startsWith("exit_sequence:partial_before_red_then_recovered")) {
    return "Green-to-red trades that took a partial before red and recovered";
  }
  if (candidate.subjectRef.startsWith("entry_example:")) {
    return "Profitable entries with at least twice as much favorable movement as adverse movement";
  }
  if (candidate.family === "fixed_cohort" && candidate.subjectLabel) {
    return `The ${candidateSubject(candidate)} cohort`;
  }
  if (candidate.family === "concentration_outlier" && candidate.subjectLabel) {
    return candidateSubject(candidate);
  }
  switch (candidate.family) {
    case "favorable_move_outcome": return "Trades with the same measured favorable-move outcome";
    case "entry_evidence": return "Trades with the same measured entry evidence";
    case "add_sequence": return "Trades with the same measured add sequence";
    case "exit_sequence": return "Trades with the same measured exit sequence";
    case "risk_stop_sizing": return "Trades with the same measured risk, stop, or sizing break";
    case "reentry_day_sequence": return "Trades with the same measured re-entry sequence";
    case "concentration_outlier": return "The selected result concentration";
    case "fixed_cohort": return "The selected fixed trade cohort";
    case "positive_process": return "Trades with the same measured strength";
    case "result_process_contrast": return "Trades with the same result-and-process contrast";
    case "focus_follow_through": return "Later evidence tied to the earlier focus";
    case "period_outcome":
      throw new CoachAiReviewInsightInvariantError(
        "TRADERLINK_AI_REVIEW_PERIOD_CANDIDATE_USED_AS_BEHAVIOR",
      );
  }
}

function rateSentence(candidate: CoachAiReviewInsightCandidate): Readonly<{
  value: string;
  measurements: readonly CoachAiReviewMeasurement[];
}> | null {
  if (candidate.classification === "trend") {
    const early = availableMeasurement(candidate, "early_affected_rate");
    const later = availableMeasurement(candidate, "later_affected_rate");
    if (!early?.displayLiteral || !later?.displayLiteral) return null;
    const verb = candidate.polarity === "positive" ? "improved" : "worsened";
    return Object.freeze({
      value: sentence(`${candidate.family === "rule_trend"
        ? candidateSubject(candidate)
        : affectedFindingPhrase(candidate)} ${verb} from ${early.displayLiteral} early to ${later.displayLiteral} later`),
      measurements: Object.freeze([early, later]),
    });
  }
  const rate = availableMeasurement(candidate, "affected_rate") ??
    availableMeasurement(candidate, candidate.polarity === "positive"
      ? "rule_followed_count"
      : "rule_affected_count");
  if (!rate?.displayLiteral) return null;
  if (candidate.family === "named_rule_association") {
    return Object.freeze({
      value: sentence(`${candidateSubject(candidate)} was ${candidate.polarity === "positive"
        ? "followed"
        : "broken"} in ${rate.displayLiteral} reviewed opportunities`),
      measurements: Object.freeze([rate]),
    });
  }
  const cohort = affectedFindingPhrase(candidate);
  return Object.freeze({
    value: sentence(`${cohort}; that was ${rate.displayLiteral}`),
    measurements: Object.freeze([rate]),
  });
}

function financialImpactSentence(candidate: CoachAiReviewInsightCandidate): Readonly<{
  value: string;
  measurements: readonly CoachAiReviewMeasurement[];
}> | null {
  const net = availableMeasurement(candidate, "affected_cohort_net_pnl");
  const lossShare = availableMeasurement(candidate, "loss_share");
  const profitShare = availableMeasurement(candidate, "profit_share");
  if (net?.currency && net.exactValue !== null) {
    const amount = new ExactDecimal(net.exactValue);
    const share = amount.lt(0) ? lossShare : amount.gt(0) ? profitShare : null;
    const outcome = amount.lt(0)
      ? `lost ${displayMoneyAmount(net.exactValue, net.currency)} net`
      : amount.gt(0)
        ? `made ${displayMoneyAmount(net.exactValue, net.currency)} net`
        : "finished flat net";
    const sharePhrase = share?.exactValue === null || share === null
      ? ""
      : amount.lt(0)
        ? ` and accounted for ${displayPercent(share.exactValue)} of all losing-trade P/L`
        : ` and accounted for ${displayPercent(share.exactValue)} of all winning-trade P/L`;
    const subject = net.availability === "partial_display_only" &&
        net.moneyEligibleCount !== null && net.expectedCount !== null
      ? `Among the ${net.moneyEligibleCount} of ${net.expectedCount} affected trades with complete P/L, those trades`
      : "Together, those trades";
    return Object.freeze({
      value: sentence(`${subject} ${outcome}${sharePhrase}`),
      measurements: Object.freeze([net, ...(share ? [share] : [])]),
    });
  }
  const analyzer = candidate.measurements.find((item) =>
    item.attributionKind === "analyzer_path" && item.unit === "money" &&
    item.exactValue !== null && item.currency !== null &&
    (item.availability === "available" || item.availability === "partial_display_only"));
  if (!analyzer?.currency || analyzer.exactValue === null) return null;
  const coverage = analyzer.availability === "partial_display_only" &&
      analyzer.moneyEligibleCount !== null && analyzer.expectedCount !== null
    ? ` across ${analyzer.moneyEligibleCount} of ${analyzer.expectedCount} affected trades with complete path values`
    : "";
  return Object.freeze({
    value: sentence(`The measured Analyzer path total${coverage} was ${analyzer.currency} ${displayDecimal(analyzer.exactValue)}`),
    measurements: Object.freeze([analyzer]),
  });
}

function representativeSentence(
  candidate: CoachAiReviewInsightCandidate,
  source: CoachAiReviewCalculationSource,
): Readonly<{ value: string; evidenceRefs: readonly string[] }> | null {
  const preferredRoles = [
    "typical_affected",
    "typical_later",
    "most_recent_independent",
    "highest_material_contribution",
    "typical_comparison",
    "typical_early",
  ] as const;
  const index = preferredRoles.map((role) => candidate.representativeEvidenceRoles.indexOf(role))
    .find((value) => value >= 0) ?? -1;
  if (index < 0) return null;
  const evidenceRef = candidate.representativeEvidenceRefs[index]!;
  const trade = source.trades.find((item) => item.tradeRef === evidenceRef);
  if (trade) {
    const result = trade.netPnlDecimal === null || trade.currency === null
      ? ""
      : new ExactDecimal(trade.netPnlDecimal).lt(0)
        ? ` and lost ${displayMoneyAmount(trade.netPnlDecimal, trade.currency)} net`
        : new ExactDecimal(trade.netPnlDecimal).gt(0)
          ? ` and made ${displayMoneyAmount(trade.netPnlDecimal, trade.currency)} net`
          : " and finished flat";
    return Object.freeze({
      value: sentence(`A representative example was ${normalizedLabel(trade.ticker)} on ${trade.marketDate}${result}`),
      evidenceRefs: Object.freeze([evidenceRef]),
    });
  }
  const day = source.days.find((item) => item.dayRef === evidenceRef);
  if (!day) return null;
  return Object.freeze({
    value: sentence(`A representative day was ${day.marketDate}, with ${day.tradeRefs.length} closed ${day.tradeRefs.length === 1 ? "trade" : "trades"}`),
    evidenceRefs: Object.freeze([evidenceRef]),
  });
}

function periodOutcomeSentence(candidate: CoachAiReviewInsightCandidate): readonly string[] {
  const trades = measurement(candidate, "closed_trade_count");
  const days = measurement(candidate, "trading_day_count");
  const netCandidate = measurement(candidate, "closed_trade_net_pnl");
  const net = netCandidate?.availability === "available" && netCandidate.exactValue !== null
    ? netCandidate
    : null;
  const wins = measurement(candidate, "win_rate");
  const losses = measurement(candidate, "loss_rate");
  const flats = measurement(candidate, "flat_count");
  invariant(trades !== null && trades.exactValue !== null &&
    days !== null && days.exactValue !== null,
    "TRADERLINK_AI_REVIEW_PERIOD_COUNT_MISSING");
  const first = net !== null && net.exactValue !== null && net.currency !== null
    ? new ExactDecimal(net.exactValue).lt(0)
      ? `You closed ${trades.exactValue} trades across ${days.exactValue} trading days and lost ${displayMoneyAmount(net.exactValue, net.currency)} net.`
      : new ExactDecimal(net.exactValue).gt(0)
        ? `You closed ${trades.exactValue} trades across ${days.exactValue} trading days and made ${displayMoneyAmount(net.exactValue, net.currency)} net.`
        : `You closed ${trades.exactValue} trades across ${days.exactValue} trading days and finished flat net.`
    : `You closed ${trades.exactValue} trades across ${days.exactValue} trading days; complete net P/L was unavailable.`;
  const second = wins?.displayLiteral && losses?.displayLiteral &&
      flats !== null && flats.exactValue !== null
    ? sentence(`${wins.affectedCount} were winners, ${losses.affectedCount} were losers, and ${flats.exactValue} were flat; the win rate was ${wins.displayLiteral}`)
    : null;
  return Object.freeze([second === null
    ? sentence(first)
    : sentence(`${withoutSentenceEnd(first)}; ${lowerFirst(withoutSentenceEnd(second))}`)]);
}

type ClaimRegistry = Readonly<{
  values: Map<string, CoachAiReviewRenderedClaim>;
  add: (input: Readonly<{
    findingRef: string | null;
    family: CoachAiReviewInsightCandidate["family"] | null;
    kind: CoachAiReviewClaimKind;
    factualJobParts: readonly unknown[];
    measurements?: readonly CoachAiReviewMeasurement[];
    evidenceRefs?: readonly string[];
    renderedSentence: string;
  }>) => CoachAiReviewRenderedClaim;
}>;

function claimRegistry(): ClaimRegistry {
  const values = new Map<string, CoachAiReviewRenderedClaim>();
  return Object.freeze({
    values,
    add: (input) => {
      const measurementRefs = freezeSortedUniqueRefs(
        (input.measurements ?? []).map((item) => item.measurementRef),
        "RENDER_CLAIM_MEASUREMENT_REF",
      );
      const evidenceRefs = freezeSortedUniqueRefs(input.evidenceRefs ?? [],
        "RENDER_CLAIM_EVIDENCE_REF");
      const factualJobKey = digestRef("job", input.factualJobParts);
      const renderedSentence = sentence(input.renderedSentence);
      const claimRef = digestRef("claim", [
        input.findingRef,
        input.kind,
        factualJobKey,
        measurementRefs,
        evidenceRefs,
        renderedSentence,
      ]);
      const claim = Object.freeze({
        claimRef,
        findingRef: input.findingRef,
        family: input.family,
        kind: input.kind,
        factualJobKey,
        measurementRefs,
        evidenceRefs,
        renderedSentence,
      });
      const existing = values.get(claimRef);
      invariant(existing === undefined || JSON.stringify(existing) === JSON.stringify(claim),
        "TRADERLINK_AI_REVIEW_RENDER_CLAIM_COLLISION");
      values.set(claimRef, claim);
      return claim;
    },
  });
}

function sectionRef(input: Omit<CoachAiReviewRenderedSectionPlan, "sectionPlanRef">): string {
  return digestRef("section", [
    COACH_AI_REVIEW_RENDERER_VERSION,
    input.sectionKey,
    input.sectionPurpose,
    input.selectionMode,
    input.findingRef,
    input.claimRefs,
    input.bridgeRef,
    input.renderedText,
  ]);
}

function selectedSection(input: Readonly<{
  sectionKey: CoachAiReviewSectionKey;
  purpose: CoachAiReviewSectionPurpose;
  mode: CoachAiReviewSectionSelectionMode;
  entry: CoachAiReviewShortlistEntry;
  claims: readonly CoachAiReviewRenderedClaim[];
  rankState: CoachAiReviewRenderedSectionPlan["rankStability"];
}>): CoachAiReviewRenderedSectionPlan {
  const score = input.entry.effectiveScore;
  const base = Object.freeze({
    sectionKey: input.sectionKey,
    sectionPurpose: input.purpose,
    selectionMode: input.mode,
    selectionState: "selected" as const,
    notAvailableReason: null,
    lane: input.entry.lane,
    findingRef: input.entry.candidate.findingRef,
    claimRefs: Object.freeze(input.claims.map((claim) => claim.claimRef)),
    bridgeRef: null,
    renderedText: input.claims.map((claim) => claim.renderedSentence).join(" "),
    rankStability: input.rankState,
    laneScore: score.postPenaltyScore,
    confidence: input.entry.confidence,
    specificity: dimensionValue(score, "specificity"),
    focusConnection: dimensionValue(score, "focus_relevance"),
    primaryEvidenceRefs: input.entry.candidate.affectedMemberRefs,
    actionTargetKey: input.entry.actionTargetKey,
  });
  return Object.freeze({ sectionPlanRef: sectionRef(base), ...base });
}

function unavailableSection(input: Readonly<{
  sectionKey: CoachAiReviewSectionKey;
  purpose: CoachAiReviewSectionPurpose;
  reason: CoachAiReviewNotAvailableReason;
  text: string;
  registry: ClaimRegistry;
}>): CoachAiReviewRenderedSectionPlan {
  const claim = input.registry.add({
    findingRef: null,
    family: null,
    kind: "unavailable_boundary",
    factualJobParts: [input.sectionKey, input.reason],
    renderedSentence: input.text,
  });
  const base = Object.freeze({
    sectionKey: input.sectionKey,
    sectionPurpose: input.purpose,
    selectionMode: "not_available" as const,
    selectionState: "not_available" as const,
    notAvailableReason: input.reason,
    lane: null,
    findingRef: null,
    claimRefs: Object.freeze([claim.claimRef]),
    bridgeRef: null,
    renderedText: claim.renderedSentence,
    rankStability: null,
    laneScore: null,
    confidence: null,
    specificity: null,
    focusConnection: null,
    primaryEvidenceRefs: Object.freeze([]),
    actionTargetKey: null,
  });
  return Object.freeze({ sectionPlanRef: sectionRef(base), ...base });
}

function laneEntries(
  shortlist: CoachAiReviewBalancedShortlist,
  lane: CoachAiReviewInsightLane,
): readonly CoachAiReviewShortlistEntry[] {
  return Object.freeze(shortlist.entries.filter((entry) => entry.lane === lane)
    .sort((left, right) => {
      const tier = { default: 0, alternative: 1, supporting: 2 } as const;
      return tier[left.requiredConsideration] - tier[right.requiredConsideration] ||
        right.effectiveScore.postPenaltyScore - left.effectiveScore.postPenaltyScore ||
        compareCoachAiReviewText(left.rankTieKey, right.rankTieKey);
    }));
}

function candidateClaims(
  entry: CoachAiReviewShortlistEntry,
  source: CoachAiReviewCalculationSource,
  registry: ClaimRegistry,
  maximumClaims: number,
): readonly CoachAiReviewRenderedClaim[] {
  const candidate = entry.candidate;
  if (candidate.focusAssessment !== null) {
    const assessment = candidate.focusAssessment;
    const baseline = availableMeasurement(candidate, "focus_baseline_rate");
    const later = availableMeasurement(candidate, "focus_later_rate");
    invariant(baseline !== null && later !== null,
      "TRADERLINK_AI_REVIEW_FOCUS_MEASUREMENT_MISSING");
    const dates = candidate.opportunityMemberRefs.flatMap((memberRef) => {
      const trade = source.trades.find((item) => item.tradeRef === memberRef);
      if (trade) return [trade.marketDate];
      const day = source.days.find((item) => item.dayRef === memberRef);
      return day ? [day.marketDate] : [];
    }).sort(compareCoachAiReviewText);
    const span = dates.length === 0
      ? `${assessment.laterEvidenceStartUtc.slice(0, 10)} to ${assessment.laterEvidenceEndUtc.slice(0, 10)}`
      : `${dates[0]!} to ${dates.at(-1)!}`;
    const conclusion = Object.freeze({
      improved: "That is a clear improvement.",
      improved_but_still_inconsistent:
        "That is an improvement, but the issue was still present often enough to remain inconsistent.",
      sustained_strength: "That strength held up.",
      unchanged: "That was essentially unchanged.",
      no_clear_change: "That moved, but not enough to establish a clear change.",
      worsened: "That is a clear setback.",
      mixed: "The later weeks moved in both directions, so the result was mixed.",
      measured_without_directional_target:
        "That records what happened without assuming that a higher or lower rate was better.",
      not_measurable_from_later_evidence:
        "The later evidence could not measure the original question.",
    })[assessment.verdict];
    const baselineRate = `${displayDecimal(new ExactDecimal(
      assessment.baselineRateDecimal,
    ).times(100).toFixed())}%`;
    const laterRate = `${displayDecimal(new ExactDecimal(
      assessment.laterRateDecimal,
    ).times(100).toFixed())}%`;
    const claim = registry.add({
      findingRef: candidate.findingRef,
      family: candidate.family,
      kind: "focus_assessment",
      factualJobParts: [assessment.focusTargetRef, assessment.verdict,
        assessment.baselineRateDecimal, assessment.laterRateDecimal,
        assessment.cumulativeLaterMemberRefs],
      measurements: Object.freeze([baseline, later]),
      evidenceRefs: assessment.cumulativeLaterMemberRefs,
      renderedSentence: sentence(`Your earlier review asked: ${assessment.renderedQuestion} From ${span}, it appeared in ${later.affectedCount} of ${later.denominatorMemberRefs.length} later opportunities (${laterRate}), compared with ${baselineRate} in the original review. ${conclusion}`),
    });
    const representative = representativeSentence(candidate, source);
    return Object.freeze([
      claim,
      ...(representative && maximumClaims > 1 ? [registry.add({
        findingRef: candidate.findingRef,
        family: candidate.family,
        kind: "representative_example",
        factualJobParts: [candidate.family, candidate.subjectRef,
          candidate.representativeMetricName,
          candidate.representativeEvidenceRoles],
        evidenceRefs: representative.evidenceRefs,
        renderedSentence: representative.value,
      })] : []),
    ]);
  }
  const values: CoachAiReviewRenderedClaim[] = [];
  const rate = rateSentence(candidate);
  const financial = financialImpactSentence(candidate);
  if (rate && financial) values.push(registry.add({
    findingRef: candidate.findingRef,
    family: candidate.family,
    kind: financial.measurements.some((item) => item.attributionKind === "analyzer_path")
      ? "analyzer_path_impact"
      : "financial_impact",
    factualJobParts: [candidate.family, candidate.subjectLabel,
      [...rate.measurements, ...financial.measurements].map((item) => item.metricName),
      candidate.populationDefinition, candidate.comparisonDefinition,
      candidate.consequenceVerdict],
    measurements: Object.freeze([...rate.measurements, ...financial.measurements]),
    renderedSentence: sentence(`${withoutSentenceEnd(rate.value)}; ${lowerFirst(
      withoutSentenceEnd(financial.value),
    )}`),
  }));
  else if (rate) values.push(registry.add({
    findingRef: candidate.findingRef,
    family: candidate.family,
    kind: candidate.classification === "trend" ? "trend_change" : "affected_rate",
    factualJobParts: [candidate.family, candidate.subjectLabel, rate.measurements.map((item) =>
      item.metricName), candidate.populationDefinition, candidate.comparisonDefinition],
    measurements: rate.measurements,
    renderedSentence: rate.value,
  }));
  else if (financial) values.push(registry.add({
    findingRef: candidate.findingRef,
    family: candidate.family,
    kind: financial.measurements.some((item) => item.attributionKind === "analyzer_path")
      ? "analyzer_path_impact"
      : "financial_impact",
    factualJobParts: [candidate.family, candidate.subjectLabel,
      financial.measurements.map((item) => item.metricName), candidate.consequenceVerdict],
    measurements: financial.measurements,
    renderedSentence: financial.value,
  }));
  const representative = representativeSentence(candidate, source);
  if (representative && values.length < maximumClaims) values.push(registry.add({
    findingRef: candidate.findingRef,
    family: candidate.family,
    kind: "representative_example",
    factualJobParts: [candidate.family, candidate.subjectRef,
      candidate.representativeMetricName,
      candidate.representativeEvidenceRoles],
    evidenceRefs: representative.evidenceRefs,
    renderedSentence: representative.value,
  }));
  invariant(values.length > 0, "TRADERLINK_AI_REVIEW_RENDERER_TEMPLATE_MISSING");
  return Object.freeze(values);
}

function openingSection(
  period: CoachAiReviewInsightCandidate,
  emphasis: CoachAiReviewShortlistEntry | null,
  source: CoachAiReviewCalculationSource,
  registry: ClaimRegistry,
  rankState: CoachAiReviewRenderedSectionPlan["rankStability"],
): CoachAiReviewRenderedSectionPlan {
  const outcomeClaims = periodOutcomeSentence(period).map((value, index) => registry.add({
    findingRef: period.findingRef,
    family: period.family,
    kind: "period_outcome",
    factualJobParts: ["period_outcome", index, period.populationDefinition],
    measurements: [measurement(period, "closed_trade_count"),
      measurement(period, "trading_day_count"), measurement(period, "closed_trade_net_pnl"),
      measurement(period, "win_rate"), measurement(period, "loss_rate"),
      measurement(period, "flat_count")].filter(
      (item): item is CoachAiReviewMeasurement => item !== null),
    renderedSentence: value,
  }));
  const emphasisClaims = emphasis === null ? [] : candidateClaims(emphasis, source, registry, 1);
  const claims = Object.freeze([...outcomeClaims.slice(0, emphasis ? 2 : 3), ...emphasisClaims]
    .slice(0, 3));
  const base = Object.freeze({
    sectionKey: "opening" as const,
    sectionPurpose: emphasis?.lane === "contrast"
      ? "result_process_contrast" as const
      : "period_outcome" as const,
    selectionMode: "primary" as const,
    selectionState: "selected" as const,
    notAvailableReason: null,
    lane: emphasis?.lane ?? null,
    findingRef: emphasis?.candidate.findingRef ?? period.findingRef,
    claimRefs: Object.freeze(claims.map((claim) => claim.claimRef)),
    bridgeRef: null,
    renderedText: claims.map((claim) => claim.renderedSentence).join(" "),
    rankStability: rankState,
    laneScore: emphasis?.effectiveScore.postPenaltyScore ?? null,
    confidence: emphasis?.confidence ?? null,
    specificity: emphasis ? dimensionValue(emphasis.effectiveScore, "specificity") : null,
    focusConnection: emphasis ? dimensionValue(emphasis.effectiveScore, "focus_relevance") : null,
    primaryEvidenceRefs: emphasis?.candidate.affectedMemberRefs ?? period.affectedMemberRefs,
    actionTargetKey: emphasis?.actionTargetKey ?? null,
  });
  return Object.freeze({ sectionPlanRef: sectionRef(base), ...base });
}

function focusQuestion(entry: CoachAiReviewShortlistEntry): CoachAiReviewRenderedFocusQuestion | null {
  if (entry.candidate.futureTrackability !== "trackable" ||
      entry.candidate.classification === "material_outlier") return null;
  const subject = candidateSubject(entry.candidate);
  let renderedQuestion: string;
  switch (entry.candidate.family) {
    case "named_rule_association":
    case "rule_trend":
      renderedQuestion = `Across the next review period, how often was ${subject} followed in eligible reviews, and what was the net result when it was broken?`;
      break;
    case "favorable_move_outcome":
      renderedQuestion = "Of trades that moved green, how many later crossed red and ended red, and what net P/L did those reversals account for?";
      break;
    case "add_sequence":
      renderedQuestion = "How many analyzed add trades added after the measured P/L peak, and what was their net result?";
      break;
    case "exit_sequence":
      renderedQuestion = "How often did analyzed exits retain the measured favorable move, and what was the final net result of the trades that gave it back?";
      break;
    case "entry_evidence":
      renderedQuestion = "How often did the initial entry produce at least twice as much favorable movement as adverse movement, and what was the trade result?";
      break;
    case "risk_stop_sizing":
      renderedQuestion = "Across eligible trades, how often were the saved risk, stop, and size boundaries followed, and what was the result of the breaks?";
      break;
    case "reentry_day_sequence":
      renderedQuestion = "Across eligible re-entry opportunities, how often was the saved re-entry rule followed, and what was the result of the breaks?";
      break;
    case "fixed_cohort":
      return null;
    case "positive_process":
      renderedQuestion = `How often did ${subject} repeat in eligible trades, and did its result remain positive?`;
      break;
    case "result_process_contrast":
      renderedQuestion = `How often did ${subject} appear again, and did the same result-and-process split remain?`;
      break;
    case "focus_follow_through":
      renderedQuestion = `What changed in the new evidence for ${subject} after this review?`;
      break;
    case "concentration_outlier":
    case "period_outcome":
      return null;
  }
  renderedQuestion = sentence(renderedQuestion);
  const trackingIntent = entry.lane === "friction"
    ? "reduction" as const
    : entry.lane === "improvement"
      ? "consistency" as const
      : entry.lane === "strength"
        ? "strength_repetition" as const
        : "examination" as const;
  const focusTargetRef = digestRef("focus_target", [
    COACH_AI_REVIEW_RENDERER_VERSION,
    entry.candidate.findingRef,
    entry.actionTargetKey,
    trackingIntent,
    entry.candidate.trackingMetricDirection,
  ]);
  return Object.freeze({
    focusTargetRef,
    focusQuestionRef: digestRef("focus_question", [
      COACH_AI_REVIEW_RENDERER_VERSION,
      focusTargetRef,
      renderedQuestion,
    ]),
    findingRef: entry.candidate.findingRef,
    actionTargetKey: entry.actionTargetKey,
    trackingIntent,
    trackingMetricDirection: entry.candidate.trackingMetricDirection,
    renderedQuestion,
  });
}

function containment(left: readonly string[], right: readonly string[]): number {
  if (left.length === 0 || right.length === 0) return 0;
  const rightSet = new Set(right);
  return left.filter((value) => rightSet.has(value)).length / Math.min(left.length, right.length);
}

function overlapBurden(sections: readonly CoachAiReviewRenderedSectionPlan[]): number {
  let value = 0;
  for (let left = 0; left < sections.length; left += 1) {
    for (let right = left + 1; right < sections.length; right += 1) {
      value += containment(sections[left]!.primaryEvidenceRefs, sections[right]!.primaryEvidenceRefs);
    }
  }
  return value;
}

function incompleteRecord(source: CoachAiReviewCalculationSource): string | null {
  const clauses: string[] = [];
  if (source.period.coverageStartDate > source.period.startDate) {
    const displayDate = (marketDate: string) => new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    }).format(new Date(`${marketDate}T12:00:00.000Z`));
    clauses.push(`this monthly review covers ${displayDate(source.period.coverageStartDate)} through ${displayDate(source.period.coverageEndDate)} rather than the full calendar month`);
  }
  const missingMoney = source.coverage.readyClosedTradeCount - source.coverage.moneyCompleteTradeCount;
  if (missingMoney > 0) clauses.push(`${missingMoney} closed ${missingMoney === 1 ? "trade was" : "trades were"} excluded from combined net P/L because complete money facts were unavailable`);
  if (source.coverage.needsDecisionRoundTripCount > 0) clauses.push(`${source.coverage.needsDecisionRoundTripCount} ${source.coverage.needsDecisionRoundTripCount === 1 ? "record still needs" : "records still need"} your decision and was not used in closed-trade findings`);
  if (source.coverage.periodEndConfirmedOpenPositionCount > 0) clauses.push(`realized results exclude unrealized P/L on ${source.coverage.periodEndConfirmedOpenPositionCount} confirmed open ${source.coverage.periodEndConfirmedOpenPositionCount === 1 ? "position" : "positions"} at period end`);
  return clauses.length === 0 ? null : sentence(clauses.join("; "));
}

function assertOutputBounds(
  output: CoachAiReviewRenderedOutput,
  cadence: CoachAiReviewCalculationSource["period"]["cadence"],
): void {
  const limits = NARRATIVE_LIMITS[cadence];
  invariant(output.reviewSummary.length <= limits.opening,
    "TRADERLINK_AI_REVIEW_RENDER_OPENING_TOO_LONG");
  for (const value of [output.whatImproved, output.whatHeldYouBack, output.focusFollowThrough]) {
    invariant(value.length <= limits.section, "TRADERLINK_AI_REVIEW_RENDER_SECTION_TOO_LONG");
  }
  invariant(output.nextPeriodFocuses.length >= 1 && output.nextPeriodFocuses.length <= 3 &&
    output.nextPeriodFocuses.every((focus) => focus.length <= limits.focus),
  "TRADERLINK_AI_REVIEW_RENDER_FOCUS_TOO_LONG");
  invariant((output.incompleteRecord?.length ?? 0) <= limits.incomplete,
    "TRADERLINK_AI_REVIEW_RENDER_INCOMPLETE_TOO_LONG");
  assertCoachAiReviewOutputSafe({
    textFields: [output.reviewSummary, output.whatImproved, output.whatHeldYouBack,
      output.focusFollowThrough, output.incompleteRecord ?? ""],
    nextFocuses: output.nextPeriodFocuses,
  });
}

export function buildCoachAiReviewRenderedPlanCatalog(input: Readonly<{
  source: CoachAiReviewCalculationSource;
  candidates: readonly CoachAiReviewInsightCandidate[];
  shortlist: CoachAiReviewBalancedShortlist;
}>): CoachAiReviewRenderedPlanCatalog {
  const period = input.candidates.find((candidate) => candidate.family === "period_outcome");
  invariant(period !== undefined, "TRADERLINK_AI_REVIEW_PERIOD_CANDIDATE_MISSING");
  const registry = claimRegistry();
  const strength = laneEntries(input.shortlist, "strength");
  const improvement = laneEntries(input.shortlist, "improvement");
  const friction = laneEntries(input.shortlist, "friction");
  const contrast = laneEntries(input.shortlist, "contrast");
  const followThrough = laneEntries(input.shortlist, "focus_follow_through");
  const rankState = (lane: CoachAiReviewInsightLane) =>
    input.shortlist.laneSelections.find((selection) => selection.lane === lane)?.rankStability.state ?? null;

  const improvementDefault = improvement[0] ?? null;
  const maintainedStrength = improvementDefault === null ? strength[0] ?? null : null;
  const maintainedStrengthClaims = maintainedStrength === null ? null : Object.freeze([
    registry.add({
      findingRef: null,
      family: null,
      kind: "unavailable_boundary",
      factualJobParts: ["what_improved", "maintained_strength", "no_compatible_baseline"],
      renderedSentence: "A compatible earlier-versus-later baseline was not available, so this section shows a measured strength instead.",
    }),
    ...candidateClaims(maintainedStrength, input.source, registry, 1),
  ]);
  const improvementEntries = improvement
    .filter((entry) => entry.requiredConsideration !== "supporting")
    .slice(0, 3);
  const improvementOptions = improvementEntries.length > 0
    ? Object.freeze(improvementEntries.map((entry) => Object.freeze({
        entry,
        section: selectedSection({
          sectionKey: "what_improved",
          purpose: "directional_change",
          mode: "primary",
          entry,
          claims: candidateClaims(entry, input.source, registry, 2),
          rankState: rankState("improvement"),
        }),
      })))
    : maintainedStrength
      ? Object.freeze([Object.freeze({
          entry: maintainedStrength,
          section: selectedSection({
            sectionKey: "what_improved",
            purpose: "maintained_strength",
            mode: "maintained_strength",
            entry: maintainedStrength,
            claims: maintainedStrengthClaims!,
            rankState: rankState("strength"),
          }),
        })])
      : Object.freeze([Object.freeze({
          entry: null,
          section: unavailableSection({
            sectionKey: "what_improved",
            purpose: "no_improvement_comparison",
            reason: input.candidates.some((candidate) => candidate.classification === "trend")
              ? "no_qualifying_pattern"
              : "no_compatible_baseline",
            text: input.candidates.some((candidate) => candidate.classification === "trend")
              ? "No improvement pattern passed the minimum change, coverage, and recurrence gates for this period."
              : "A compatible earlier-versus-later baseline was not available; no improvement claim was made.",
            registry,
          }),
        })]);

  const frictionEntries = friction
    .filter((entry) => entry.requiredConsideration !== "supporting")
    .slice(0, 4);
  const heldOptions = frictionEntries.length > 0
    ? Object.freeze(frictionEntries.map((entry) => Object.freeze({
        entry,
        section: selectedSection({
          sectionKey: "what_held_you_back",
          purpose: "residual_friction",
          mode: "primary",
          entry,
          claims: candidateClaims(entry, input.source, registry, 2),
          rankState: rankState("friction"),
        }),
      })))
    : contrast[0]
      ? Object.freeze([Object.freeze({
          entry: contrast[0],
          section: selectedSection({
            sectionKey: "what_held_you_back",
            purpose: "mixed_result",
            mode: "mixed_result",
            entry: contrast[0],
            claims: candidateClaims(contrast[0], input.source, registry, 2),
            rankState: rankState("contrast"),
          }),
        })])
      : Object.freeze([Object.freeze({
          entry: null,
          section: unavailableSection({
            sectionKey: "what_held_you_back",
            purpose: "no_friction_strength",
            reason: "no_qualifying_pattern",
            text: "No recurring or financially material held-back pattern passed the evidence gates for this period.",
            registry,
          }),
        })]);

  const followSection = followThrough[0]
    ? selectedSection({
        sectionKey: "focus_follow_through",
        purpose: "focus_measurement",
        mode: "primary",
        entry: followThrough[0],
        // The follow-through section's quantitative assessment is the complete
        // cross-review job. Repeating its representative trade can duplicate a
        // factual job already selected for an improvement or friction section,
        // which made otherwise valid monthly plans impossible to assemble.
        claims: candidateClaims(followThrough[0], input.source, registry, 1),
        rankState: rankState("focus_follow_through"),
      })
    : unavailableSection({
        sectionKey: "focus_follow_through",
        purpose: "focus_measurement",
        reason: input.source.issuedFocusTargets.length === 0
          ? "no_compatible_baseline"
          : input.source.issuedFocusTargets.every((target) =>
              target.baselineLineageStatus === "superseded")
            ? "required_facts_unavailable"
            : "no_later_evidence",
        text: input.source.issuedFocusTargets.length === 0
          ? "No earlier issued focus was available for this period."
          : input.source.issuedFocusTargets.every((target) =>
              target.baselineLineageStatus === "superseded")
            ? "An earlier focus was available, but its original trade, rule, Analyzer, or trade-style version changed, so the saved baseline was not compared as though it were still current."
            : "The earlier focus did not yet have enough new, later evidence for a fresh assessment.",
        registry,
      });

  const strengthRequired = strength.length > 0;
  const openingEmphasis = maintainedStrength
    ? Object.freeze([null])
    : Object.freeze([
        ...strength.filter((entry) => entry.requiredConsideration !== "supporting").slice(0, 3),
        ...contrast.filter((entry) => entry.requiredConsideration !== "supporting").slice(0, 1),
        ...(strengthRequired ? [] : [null]),
      ].slice(0, 3));
  const openingPlans = Object.freeze(openingEmphasis.map((entry) => openingSection(
    period,
    entry,
    input.source,
    registry,
    entry ? rankState(entry.lane) : null,
  )));

  const closedTradeCount = measurement(period, "closed_trade_count");
  invariant(closedTradeCount !== null && closedTradeCount.exactValue !== null,
    "TRADERLINK_AI_REVIEW_FOCUS_PERIOD_COUNT_MISSING");
  const fallbackFocusText = closedTradeCount.exactValue === "0"
    ? "With no closed trade evidence in this period, which part of your trading process should the next review assess?"
    : "Which completed trade best represents this period, and what specific decision most changed its final result?";
  const fallbackFocusTargetRef = digestRef("focus_target", [
    COACH_AI_REVIEW_RENDERER_VERSION,
    period.findingRef,
    "period_review_question",
    "examination",
    "non_directional",
  ]);
  const fallbackFocusQuestion = Object.freeze({
    focusTargetRef: fallbackFocusTargetRef,
    focusQuestionRef: digestRef("focus_question", [
      COACH_AI_REVIEW_RENDERER_VERSION,
      fallbackFocusTargetRef,
      fallbackFocusText,
    ]),
    findingRef: period.findingRef,
    actionTargetKey: "period_review_question",
    trackingIntent: "examination" as const,
    trackingMetricDirection: "non_directional" as const,
    renderedQuestion: fallbackFocusText,
  });
  const focusQuestionRegistry = new Map<string, CoachAiReviewRenderedFocusQuestion>();
  const focusQuestionsFor = (
    selectedEntries: readonly (CoachAiReviewShortlistEntry | null)[],
  ): readonly CoachAiReviewRenderedFocusQuestion[] => {
    const questions: CoachAiReviewRenderedFocusQuestion[] = [];
    for (const entry of selectedEntries) {
      if (entry === null || questions.some((question) =>
        question.actionTargetKey === entry.actionTargetKey)) continue;
      const question = focusQuestion(entry);
      if (question) questions.push(question);
      if (questions.length >= 3) break;
    }
    if (questions.length === 0) questions.push(fallbackFocusQuestion);
    for (const question of questions) {
      focusQuestionRegistry.set(question.focusQuestionRef, question);
    }
    return Object.freeze(questions);
  };
  const limitation = incompleteRecord(input.source);
  const completePlans: CoachAiReviewCompletePlan[] = [];
  const sectionPlans: CoachAiReviewRenderedSectionPlan[] = [];
  const defaultOpeningScore = openingPlans[0]?.laneScore ?? 0;
  const defaultImprovementScore = improvementOptions[0]?.section.laneScore ?? 0;
  const defaultHeldScore = heldOptions[0]?.section.laneScore ?? 0;
  for (const opening of openingPlans) {
    for (const improvementOption of improvementOptions) {
      const improvementSection = improvementOption.section;
      for (const heldOption of heldOptions) {
        const heldSection = heldOption.section;
        const sections = [opening, improvementSection, heldSection, followSection] as const;
        if (improvementSection.findingRef !== null &&
            improvementSection.findingRef === heldSection.findingRef) continue;
        const factualJobs = sections.flatMap((section) => section.claimRefs.map((claimRef) =>
          registry.values.get(claimRef)!.factualJobKey));
        if (new Set(factualJobs).size !== factualJobs.length) continue;
        if (strengthRequired && maintainedStrength === null && opening.lane !== "strength" &&
            improvementSection.lane !== "strength") continue;
        const focusQuestions = focusQuestionsFor([
          heldOption.entry,
          improvementOption.entry,
          strength[0] ?? null,
        ]);
        const output = Object.freeze({
          reviewSummary: opening.renderedText,
          whatImproved: improvementSection.renderedText,
          whatHeldYouBack: heldSection.renderedText,
          focusFollowThrough: followSection.renderedText,
          nextPeriodFocuses: Object.freeze(focusQuestions.map((question) =>
            question.renderedQuestion)),
          incompleteRecord: limitation,
        });
        assertOutputBounds(output, input.source.period.cadence);
        const totalLaneScoreLoss =
          Math.max(0, defaultOpeningScore - (opening.laneScore ?? 0)) +
          Math.max(0, defaultImprovementScore - (improvementSection.laneScore ?? 0)) +
          Math.max(0, defaultHeldScore - (heldSection.laneScore ?? 0));
        const burden = overlapBurden(sections);
        const totalFocusConnection = sections.reduce((total, section) =>
          total + (section.focusConnection ?? 0), 0);
        const totalSpecificity = sections.reduce((total, section) =>
          total + (section.specificity ?? 0), 0);
        const structuralTieKey = JSON.stringify(sections.map((section) => [
          section.sectionKey,
          section.sectionPurpose,
          section.selectionMode,
          section.findingRef,
          section.claimRefs,
        ]));
        const reviewPlanRef = digestRef("review_plan", [
          COACH_AI_REVIEW_RENDERER_VERSION,
          sections.map((section) => section.sectionPlanRef),
          focusQuestions.map((question) => question.focusQuestionRef),
          output,
        ]);
        completePlans.push(Object.freeze({
          reviewPlanRef,
          sectionPlanRefs: Object.freeze({
            opening: opening.sectionPlanRef,
            what_improved: improvementSection.sectionPlanRef,
            what_held_you_back: heldSection.sectionPlanRef,
            focus_follow_through: followSection.sectionPlanRef,
          }),
          focusQuestionRefs: Object.freeze(focusQuestions.map((question) =>
            question.focusQuestionRef)),
          output,
          totalLaneScoreLoss,
          overlapBurden: burden,
          totalFocusConnection,
          totalSpecificity,
          structuralTieKey,
        }));
        sectionPlans.push(...sections);
      }
    }
  }
  invariant(completePlans.length > 0, "TRADERLINK_AI_REVIEW_NO_COMPLETE_RENDERED_PLAN");
  const ordered = [...completePlans].sort((left, right) =>
    left.totalLaneScoreLoss - right.totalLaneScoreLoss ||
    left.overlapBurden - right.overlapBurden ||
    right.totalFocusConnection - left.totalFocusConnection ||
    right.totalSpecificity - left.totalSpecificity ||
    compareCoachAiReviewText(left.structuralTieKey, right.structuralTieKey));
  const defaultPlan = ordered[0]!;
  const retained = Object.freeze(ordered.filter((plan, index) => {
    if (index === 0) return true;
    return plan.totalLaneScoreLoss <= defaultPlan.totalLaneScoreLoss + 12;
  }).slice(0, 6));
  const retainedSectionRefs = new Set(retained.flatMap((plan) =>
    Object.values(plan.sectionPlanRefs)));
  const uniqueSections = [...new Map(sectionPlans.filter((section) =>
    retainedSectionRefs.has(section.sectionPlanRef)).map((section) =>
    [section.sectionPlanRef, section] as const)).values()]
    .sort((left, right) => compareCoachAiReviewText(left.sectionPlanRef, right.sectionPlanRef));
  const retainedClaimRefs = new Set(uniqueSections.flatMap((section) => section.claimRefs));
  const claims = [...registry.values.values()].filter((claim) => retainedClaimRefs.has(claim.claimRef))
    .sort((left, right) => compareCoachAiReviewText(left.claimRef, right.claimRef));
  const retainedFocusRefs = new Set(retained.flatMap((plan) => plan.focusQuestionRefs));
  const retainedFocusQuestions = [...focusQuestionRegistry.values()]
    .filter((question) => retainedFocusRefs.has(question.focusQuestionRef))
    .sort((left, right) => compareCoachAiReviewText(left.focusQuestionRef, right.focusQuestionRef));
  const defaultImprovementSection = uniqueSections.find((section) =>
    section.sectionPlanRef === defaultPlan.sectionPlanRefs.what_improved);
  const defaultHeldSection = uniqueSections.find((section) =>
    section.sectionPlanRef === defaultPlan.sectionPlanRefs.what_held_you_back);
  const defaultFollowSection = uniqueSections.find((section) =>
    section.sectionPlanRef === defaultPlan.sectionPlanRefs.focus_follow_through);
  invariant(defaultImprovementSection !== undefined && defaultHeldSection !== undefined &&
    defaultFollowSection !== undefined, "TRADERLINK_AI_REVIEW_DEFAULT_SECTION_MISSING");
  return Object.freeze({
    catalogVersion: COACH_AI_REVIEW_PLAN_CATALOG_VERSION,
    rendererVersion: COACH_AI_REVIEW_RENDERER_VERSION,
    cadence: input.source.period.cadence,
    claims: Object.freeze(claims),
    sectionPlans: Object.freeze(uniqueSections),
    focusQuestions: Object.freeze(retainedFocusQuestions),
    completePlans: retained,
    decisionCriticalSpine: Object.freeze({
      periodOutcomeFindingRef: period.findingRef,
      improvementFindingRef: defaultImprovementSection.findingRef,
      improvementUnavailableReason: defaultImprovementSection.notAvailableReason,
      frictionFindingRef: defaultHeldSection.findingRef,
      frictionUnavailableReason: defaultHeldSection.notAvailableReason,
      followThroughFindingRef: defaultFollowSection.findingRef,
      followThroughUnavailableReason: defaultFollowSection.notAvailableReason,
    }),
  });
}
