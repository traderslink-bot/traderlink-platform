import { createHash } from "node:crypto";

import Decimal from "decimal.js";

import type {
  CoachAiReviewNamedRuleOutcomeV2,
  CoachAiReviewTradeAnalysisV2,
  CoachPeriodicAiReviewInputV2,
} from "../contracts/weekly-ai-review-input-contracts";
import {
  COACH_WEEKLY_AI_REVIEW_EVIDENCE_PACKET_VERSION,
  type CoachWeeklyAiReviewAnalyzerEvidenceRow,
  type CoachWeeklyAiReviewCalculatedObservation,
  type CoachWeeklyAiReviewEvidenceMetric,
  type CoachWeeklyAiReviewEvidencePacket,
  type CoachWeeklyAiReviewEvidenceRuleResult,
  type CoachWeeklyAiReviewEvidenceTrade,
} from "../contracts/coach-weekly-ai-review-evidence-authoring-contracts";

const ExactDecimal = Decimal.clone({
  precision: 80,
  toExpNeg: -1000,
  toExpPos: 1000,
});

type NormalizedTrade = Readonly<{
  core: CoachWeeklyAiReviewEvidenceTrade;
  analyzer: CoachWeeklyAiReviewAnalyzerEvidenceRow | null;
  ruleOutcomes: readonly CoachAiReviewNamedRuleOutcomeV2[];
}>;

type Cohort = Readonly<{
  evidenceRef: string;
  label: string;
  description: string;
  populationDefinition: string;
  trades: readonly NormalizedTrade[];
}>;

function decimal(value: string | null): Decimal | null {
  if (value === null || !/^-?\d+(?:\.\d+)?$/u.test(value)) return null;
  return new ExactDecimal(value);
}

function sum(values: readonly (string | null)[]): string | null {
  if (values.some((value) => decimal(value) === null)) return null;
  return values.reduce((total, value) => total.plus(decimal(value)!), new ExactDecimal(0))
    .toFixed(2);
}

function metric(name: string, exactValue: string, displayValue: string): CoachWeeklyAiReviewEvidenceMetric {
  return Object.freeze({ name, exactValue, displayValue });
}

function percentage(numerator: number, denominator: number): string | null {
  if (denominator === 0) return null;
  return new ExactDecimal(numerator).div(denominator).times(100)
    .toDecimalPlaces(2, ExactDecimal.ROUND_HALF_UP).toFixed(2);
}

function easternTime(value: string): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) throw new Error("TRADERLINK_COACH_REVIEW_TIME_INVALID");
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const hour = parts.find((part) => part.type === "hour")?.value;
  const minute = parts.find((part) => part.type === "minute")?.value;
  if (!hour || !minute) throw new Error("TRADERLINK_COACH_REVIEW_TIME_INVALID");
  return `${hour}:${minute}`;
}

function holdingMinutes(value: number | null): number | null {
  if (value === null) return null;
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error("TRADERLINK_COACH_REVIEW_DURATION_INVALID");
  }
  return Math.round(value / 60_000);
}

function ruleRef(outcome: CoachAiReviewNamedRuleOutcomeV2): string {
  const digest = createHash("sha256").update(JSON.stringify({
    category: outcome.category,
    title: outcome.title,
    statement: outcome.statement,
  }), "utf8").digest("hex");
  return `rule_${digest.slice(0, 20)}`;
}

function cohortRef(prefix: string, value: string): string {
  return `${prefix}_${createHash("sha256").update(value, "utf8").digest("hex").slice(0, 20)}`;
}

function noteForReflection(input: Readonly<{
  dailyNotes: Readonly<{
    whatWorked: string;
    whatNeedsWork: string;
    technicalRecap: string;
    anythingElse: string;
  }> | null;
}>): Readonly<{
  whatWorked: string;
  whatNeedsWork: string;
  technicalRecap: string;
  nextSessionFocus: string;
}> {
  return Object.freeze({
    whatWorked: input.dailyNotes?.whatWorked ?? "",
    whatNeedsWork: input.dailyNotes?.whatNeedsWork ?? "",
    technicalRecap: input.dailyNotes?.technicalRecap ?? "",
    nextSessionFocus: input.dailyNotes?.anythingElse ?? "",
  });
}

function analyzerRow(
  evidenceRef: string,
  analysis: CoachAiReviewTradeAnalysisV2 | undefined,
): CoachWeeklyAiReviewAnalyzerEvidenceRow | null {
  if (!analysis || analysis.availability !== "ready") return null;
  const entry = analysis.events.find((event) => event.kind === "entry") ?? analysis.events[0];
  const greenToRed = analysis.greenToRed;
  const afterExit = analysis.finalExitPaths.find((path) => path.minutesAfterExit === 15);
  return Object.freeze({
    tradeEvidenceRef: evidenceRef,
    favorableMoveDecimal: entry?.oneMinute.favorableMoveUntilFlatDecimal ?? null,
    adverseMoveDecimal: entry?.oneMinute.adverseMoveUntilFlatDecimal ?? null,
    greenToRedStatus: greenToRed?.status === "unavailable" || !greenToRed
      ? "never_green"
      : greenToRed.status,
    measuredPeakPnlDecimal: greenToRed?.peakPnlDecimal ?? null,
    peakToFinalReversalDecimal: greenToRed?.peakToFinalReversalDecimal ?? null,
    addedAfterPeakCount: greenToRed?.addedAfterPeakCount ?? 0,
    partialExitBeforeRedCount: greenToRed?.partialExitBeforeRedCount ?? 0,
    favorableMoveAfter15MinutesDecimal: afterExit?.favorableMoveDecimal ?? null,
  });
}

function observation(input: Cohort): CoachWeeklyAiReviewCalculatedObservation {
  const known = input.trades.filter((trade) => decimal(trade.core.netPnlDecimal) !== null);
  const winners = known.filter((trade) => decimal(trade.core.netPnlDecimal)!.gt(0));
  const values: CoachWeeklyAiReviewEvidenceMetric[] = [
    metric("trade_count", String(input.trades.length), `${input.trades.length} trades`),
  ];
  const pnl = sum(input.trades.map((trade) => trade.core.netPnlDecimal));
  if (pnl !== null) values.push(metric("net_pnl", pnl, `USD ${pnl}`));
  const winRate = percentage(winners.length, known.length);
  if (winRate !== null) values.push(metric("win_rate_percent", winRate, `${winRate}%`));
  return Object.freeze({
    evidenceRef: input.evidenceRef,
    label: input.label,
    description: input.description,
    populationDefinition: input.populationDefinition,
    affectedTradeCount: input.trades.length,
    representativeTradeRefs: Object.freeze(input.trades.slice(0, 8)
      .map((trade) => trade.core.evidenceRef)),
    measurements: Object.freeze(values),
  });
}

function snapshotMetrics(trades: readonly NormalizedTrade[], days: readonly Readonly<{
  netPnlDecimal: string | null;
}>[]): readonly CoachWeeklyAiReviewEvidenceMetric[] {
  const known = trades.filter((trade) => decimal(trade.core.netPnlDecimal) !== null);
  const winners = known.filter((trade) => decimal(trade.core.netPnlDecimal)!.gt(0));
  const losses = known.filter((trade) => decimal(trade.core.netPnlDecimal)!.lt(0));
  const metrics: CoachWeeklyAiReviewEvidenceMetric[] = [
    metric("closed_trade_count", String(trades.length), `${trades.length} trades`),
    metric("winner_count", String(winners.length), `${winners.length} winners`),
    metric("loser_count", String(losses.length), `${losses.length} losers`),
  ];
  const pnl = sum(trades.map((trade) => trade.core.netPnlDecimal));
  if (pnl !== null) metrics.push(metric("net_pnl", pnl, `USD ${pnl}`));
  const winRate = percentage(winners.length, known.length);
  if (winRate !== null) metrics.push(metric("win_rate_percent", winRate, `${winRate}%`));
  if (pnl !== null) {
    const grossProfit = winners.reduce((total, trade) =>
      total.plus(decimal(trade.core.netPnlDecimal)!), new ExactDecimal(0));
    const grossLoss = losses.reduce((total, trade) =>
      total.plus(decimal(trade.core.netPnlDecimal)!.abs()), new ExactDecimal(0));
    if (grossLoss.gt(0)) {
      const factor = grossProfit.div(grossLoss).toDecimalPlaces(2, ExactDecimal.ROUND_HALF_UP).toFixed(2);
      metrics.push(metric("profit_factor", factor, factor));
    }
  }
  const greenDays = days.filter((day) => decimal(day.netPnlDecimal)?.gt(0)).length;
  metrics.push(metric("green_day_count", String(greenDays), `${greenDays} green days`));
  return Object.freeze(metrics);
}

function limitationText(trades: readonly NormalizedTrade[]): string | null {
  return trades.some((trade) => trade.core.netPnlDecimal === null)
    ? "Net P/L was unavailable for one or more closed trades in this period."
    : null;
}

/**
 * Converts the existing exact Journal periodic snapshot into the new compact
 * weekly authoring packet. It keeps every closed trade and treats calculated
 * cohorts as model aids, not a conclusion allowlist.
 */
export function buildCoachWeeklyAiReviewEvidencePacketFromPeriodicInputV2(
  input: CoachPeriodicAiReviewInputV2,
): CoachWeeklyAiReviewEvidencePacket {
  if (input.period.cadence !== "weekly") {
    throw new Error("TRADERLINK_COACH_WEEKLY_AUTHORING_PERIOD_MISMATCH");
  }
  const rules = new Map<string, Readonly<{ title: string; ruleText: string }>>();
  const normalized: NormalizedTrade[] = [];
  const allRuleOutcomes: CoachAiReviewNamedRuleOutcomeV2[] = [];
  const days = [...input.reviewPeriodMarketFacts.days]
    .sort((left, right) => left.reviewMarketDate.localeCompare(right.reviewMarketDate));
  for (const day of days) {
    for (const outcome of day.ruleOutcomes ?? []) {
      rules.set(ruleRef(outcome), Object.freeze({ title: outcome.title, ruleText: outcome.statement }));
      allRuleOutcomes.push(outcome);
    }
    const tickerAttempts = new Map<string, number>();
    const priorPnls: (string | null)[] = [];
    const ordered = [...day.trades].sort((left, right) =>
      left.openedAtUtc.localeCompare(right.openedAtUtc) ||
      left.closedAtUtc.localeCompare(right.closedAtUtc) || left.ticker.localeCompare(right.ticker));
    for (const [index, trade] of ordered.entries()) {
      const consecutiveKnownLosses = priorPnls.length >= 2 && priorPnls.slice(-2)
        .every((pnl) => decimal(pnl)?.lt(0) === true);
      const enoughPriorOutcomes = priorPnls.length >= 2 && priorPnls.slice(-2)
        .every((pnl) => decimal(pnl) !== null);
      const attempt = (tickerAttempts.get(trade.ticker) ?? 0) + 1;
      tickerAttempts.set(trade.ticker, attempt);
      const outcomes = Object.freeze([...(trade.ruleOutcomes ?? [])]);
      const results: CoachWeeklyAiReviewEvidenceRuleResult[] = [];
      for (const outcome of outcomes) {
        const ref = ruleRef(outcome);
        rules.set(ref, Object.freeze({ title: outcome.title, ruleText: outcome.statement }));
        results.push(Object.freeze({ ruleRef: ref, status: outcome.status }));
        allRuleOutcomes.push(outcome);
      }
      const evidenceRef = `trade_${String(normalized.length + 1).padStart(4, "0")}`;
      const core = Object.freeze({
        evidenceRef,
        marketDate: day.reviewMarketDate,
        daySequence: index + 1,
        entryTimeEastern: easternTime(trade.openedAtUtc),
        exitTimeEastern: easternTime(trade.closedAtUtc),
        ticker: trade.ticker,
        direction: trade.direction,
        netPnlDecimal: trade.netPnlDecimal,
        holdingMinutes: holdingMinutes(trade.holdingDurationMilliseconds),
        tickerAttemptNumber: attempt,
        afterTwoConsecutiveLosses: enoughPriorOutcomes ? consecutiveKnownLosses : null,
        tags: Object.freeze([...trade.tags]),
        ruleDeviationRefs: Object.freeze(results.filter((result) =>
          result.status === "broken" || result.status === "not_reviewed").map((result) => result.ruleRef)),
        note: null,
      } satisfies CoachWeeklyAiReviewEvidenceTrade);
      normalized.push(Object.freeze({
        core,
        analyzer: analyzerRow(evidenceRef, trade.analysis),
        ruleOutcomes: outcomes,
      }));
      priorPnls.push(trade.netPnlDecimal);
    }
  }
  const ruleCounts = new Map<string, { followed: number; broken: number; notReviewed: number }>();
  for (const outcome of allRuleOutcomes) {
    const ref = ruleRef(outcome);
    const counts = ruleCounts.get(ref) ?? { followed: 0, broken: 0, notReviewed: 0 };
    if (outcome.status === "followed") counts.followed += 1;
    if (outcome.status === "broken") counts.broken += 1;
    if (outcome.status === "not_reviewed") counts.notReviewed += 1;
    ruleCounts.set(ref, counts);
  }
  const cohorts: Cohort[] = [
    Object.freeze({ evidenceRef: "observation_green_to_red", label: "Green-to-red trades that ended red", description: "Trades that moved green, then red, and ended red.", populationDefinition: "analyzer greenToRedStatus = green_to_red_ended_red", trades: Object.freeze(normalized.filter((trade) => trade.analyzer?.greenToRedStatus === "green_to_red_ended_red")) }),
    Object.freeze({ evidenceRef: "observation_after_two_losses", label: "Trades after two consecutive losses", description: "Trades entered after two consecutive completed losses on the same trading day.", populationDefinition: "afterTwoConsecutiveLosses = true", trades: Object.freeze(normalized.filter((trade) => trade.core.afterTwoConsecutiveLosses === true)) }),
    Object.freeze({ evidenceRef: "observation_later_attempts", label: "Third-and-later ticker attempts", description: "Completed attempts numbered three or higher on the same ticker and trading day.", populationDefinition: "tickerAttemptNumber >= 3", trades: Object.freeze(normalized.filter((trade) => trade.core.tickerAttemptNumber >= 3)) }),
    Object.freeze({ evidenceRef: "observation_opening_window", label: "Opening-window trades", description: "Trades entered before 10:30 Eastern.", populationDefinition: "entryTimeEastern < 10:30", trades: Object.freeze(normalized.filter((trade) => trade.core.entryTimeEastern < "10:30")) }),
  ].filter((cohort) => cohort.trades.length > 0);
  const tagGroups = new Map<string, NormalizedTrade[]>();
  const deviationGroups = new Map<string, NormalizedTrade[]>();
  for (const trade of normalized) {
    for (const tag of trade.core.tags) {
      tagGroups.set(tag, [...(tagGroups.get(tag) ?? []), trade]);
    }
    for (const ref of trade.core.ruleDeviationRefs) {
      deviationGroups.set(ref, [...(deviationGroups.get(ref) ?? []), trade]);
    }
  }
  for (const [tag, trades] of [...tagGroups.entries()].sort(([left], [right]) => left.localeCompare(right))) {
    if (trades.length < 3) continue;
    cohorts.push(Object.freeze({
      evidenceRef: cohortRef("observation_tag", tag),
      label: `${tag} tagged trades`,
      description: `Completed trades carrying the ${tag} tag.`,
      populationDefinition: `tags includes ${JSON.stringify(tag)}`,
      trades: Object.freeze(trades),
    }));
  }
  for (const [ref, trades] of [...deviationGroups.entries()].sort(([left], [right]) => left.localeCompare(right))) {
    const title = rules.get(ref)?.title ?? "Saved rule";
    cohorts.push(Object.freeze({
      evidenceRef: `observation_${ref}`,
      label: `Recorded breaks of \"${title}\"`,
      description: `Completed trades where the saved rule \"${title}\" was marked broken or not reviewed.`,
      populationDefinition: `ruleDeviationRefs includes ${JSON.stringify(ref)}`,
      trades: Object.freeze(trades),
    }));
  }
  for (const [label, definition, matches] of [
    ["Long trades", "direction = long", normalized.filter((trade) => trade.core.direction === "long")],
    ["Short trades", "direction = short", normalized.filter((trade) => trade.core.direction === "short")],
    ["Mid-session trades", "10:30 <= entryTimeEastern < 11:30", normalized.filter((trade) => trade.core.entryTimeEastern >= "10:30" && trade.core.entryTimeEastern < "11:30")],
    ["Late-session trades", "entryTimeEastern >= 11:30", normalized.filter((trade) => trade.core.entryTimeEastern >= "11:30")],
  ] as const) {
    if (matches.length < 3) continue;
    cohorts.push(Object.freeze({
      evidenceRef: cohortRef("observation_fixed", label),
      label,
      description: `Completed ${label.toLocaleLowerCase()}.`,
      populationDefinition: definition,
      trades: Object.freeze(matches),
    }));
  }
  const members = new Map(cohorts.map((cohort) => [cohort.evidenceRef, new Set(cohort.trades.map((trade) => trade.core.evidenceRef))]));
  const overlaps = cohorts.flatMap((left, leftIndex) => cohorts.slice(leftIndex + 1).flatMap((right) => {
    const sharedTradeCount = [...members.get(left.evidenceRef)!].filter((ref) => members.get(right.evidenceRef)!.has(ref)).length;
    return sharedTradeCount > 0 ? [Object.freeze({ firstObservationRef: left.evidenceRef, secondObservationRef: right.evidenceRef, sharedTradeCount })] : [];
  }));
  const reflections = [...input.completedDailyReflections, ...(input.savedDailyReflections ?? [])]
    .filter((reflection) => reflection.reviewMarketDate >= input.period.startDate && reflection.reviewMarketDate <= input.period.endDate)
    .sort((left, right) => left.reviewMarketDate.localeCompare(right.reviewMarketDate))
    .map((reflection) => Object.freeze({
      evidenceRef: reflection.evidenceRef,
      marketDate: reflection.reviewMarketDate,
      state: reflection.reflectionState === "incomplete" ? "saved_incomplete" as const : "completed" as const,
      ...noteForReflection(reflection),
      tradeNotes: Object.freeze(reflection.tradeNotes.map((note) => Object.freeze({ ticker: note.ticker, note: note.note }))),
    }));
  const coverage = Object.freeze({
    evidenceRef: "coverage" as const,
    completeTradeCount: normalized.length,
    analyzerReadyTradeCount: normalized.filter((trade) => trade.analyzer !== null).length,
    tradeNoteCount: reflections.reduce((count, reflection) => count + reflection.tradeNotes.length, 0),
    completedReflectionCount: reflections.filter((reflection) => reflection.state === "completed").length,
    limitationText: limitationText(normalized),
  });
  return Object.freeze({
    packetVersion: COACH_WEEKLY_AI_REVIEW_EVIDENCE_PACKET_VERSION,
    period: Object.freeze({ startDate: input.period.startDate, endDate: input.period.endDate, timezone: "America/New_York", currency: input.period.currency ?? "USD" }),
    weekSnapshot: Object.freeze({ evidenceRef: "week_snapshot", metrics: snapshotMetrics(normalized, days) }),
    previousWeekSnapshot: null,
    ruleDefinitions: Object.freeze([...rules.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([ruleRef, definition]) => Object.freeze({ ruleRef, ...definition }))),
    ruleSummaries: Object.freeze([...ruleCounts.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([ruleRef, counts]) => Object.freeze({ evidenceRef: `rule_summary_${ruleRef}`, ruleRef, followedCount: counts.followed, brokenCount: counts.broken, notReviewedCount: counts.notReviewed, notApplicableCount: 0 }))),
    days: Object.freeze(days.map((day) => {
      const dayTrades = normalized.filter((trade) => trade.core.marketDate === day.reviewMarketDate);
      const known = dayTrades.filter((trade) => decimal(trade.core.netPnlDecimal) !== null);
      return Object.freeze({ evidenceRef: `day_${day.reviewMarketDate}`, marketDate: day.reviewMarketDate, tradeCount: dayTrades.length, winnerCount: known.filter((trade) => decimal(trade.core.netPnlDecimal)!.gt(0)).length, loserCount: known.filter((trade) => decimal(trade.core.netPnlDecimal)!.lt(0)).length, flatCount: known.filter((trade) => decimal(trade.core.netPnlDecimal)!.eq(0)).length, netPnlDecimal: day.netPnlDecimal });
    })),
    trades: Object.freeze(normalized.map((trade) => trade.core)),
    analyzerRows: Object.freeze(normalized.flatMap((trade) => trade.analyzer ? [trade.analyzer] : [])),
    calculatedObservations: Object.freeze(cohorts.map(observation)),
    observationOverlaps: Object.freeze(overlaps),
    dailyReflections: Object.freeze(reflections),
    currentFocuses: Object.freeze(input.currentFocuses.map((focus, index) => Object.freeze({ evidenceRef: `focus_${String(index + 1).padStart(3, "0")}`, effectiveFromDate: focus.effectiveFromDate, text: focus.text }))),
    priorIssuedReview: input.priorIssuedReview ? Object.freeze({
      evidenceRef: input.priorIssuedReview.reviewRef,
      periodStartDate: input.priorIssuedReview.periodStartDate,
      periodEndDate: input.priorIssuedReview.periodEndDate,
      reviewText: [
        input.priorIssuedReview.reviewSummary,
        input.priorIssuedReview.whatImproved,
        input.priorIssuedReview.whatHeldYouBack,
        input.priorIssuedReview.focusFollowThrough,
        ...input.priorIssuedReview.nextPeriodFocuses,
      ].join("\n"),
    }) : null,
    coverage,
  });
}
