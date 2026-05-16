import type {
  SavedExecutionTrade,
  SavedTraderAnalyticsReport,
} from "../product/types";
import {
  mapDecisionReviewInsightForUser,
} from "../../user-facing-behavior";
import { userFacingTradeSymbol } from "../product/trade-display-copy";
import type {
  UserFacingBehaviorEvidenceChannel,
  UserFacingBehaviorOpportunityType,
  UserFacingBehaviorState,
} from "../../user-facing-behavior";

export interface SavedTradeThreadRoundTrip {
  id: string;
  tradeId: string;
  symbol: string;
  sequence: number;
  roleLabel: string;
  entryTime: string | null;
  exitTime: string | null;
  entrySessionDate: string;
  exitSessionDate: string | null;
  entryHourLabelEt: string;
  grossRealizedPnl: number | null;
  pnlDeltaFromPrevious: number | null;
  chartContextStatus: "available" | "waiting";
  chartContextSummary: string;
  decisionReviewInsightCount: number;
  executionCount: number;
  lifecycleStatus: "closed" | "open";
  heldOvernight: boolean;
  crossedSessionDate: boolean;
  minutesSincePreviousExit: number | null;
  href: string;
}

export type SavedTradeThreadLifecycleClassification =
  | "single_round_trip"
  | "closed_day_trade_reentry"
  | "open_intraday_reentry"
  | "extended_same_day_hold"
  | "day_trade_turned_swing"
  | "multi_day_ticker_thread";

export type SavedTradeThreadStoryKind =
  | "single_round_trip"
  | "extended_same_day_hold"
  | "swing_transition"
  | "open_reentry"
  | "profit_giveback"
  | "reentry_added_profit"
  | "repeated_losing_attempts"
  | "multiple_round_trips";

export type SavedTradeSessionStoryKind =
  | "green_to_red_session"
  | "same_symbol_many_attempts"
  | "session_high_trade_count"
  | "open_or_swing_review"
  | "strengths_to_repeat_session"
  | "positive_controlled_session"
  | "mixed_session_review";

export type SavedTradeThreadEvidenceTone =
  | "danger"
  | "info"
  | "success"
  | "warning";

export interface SavedTradeThreadDecisionReviewSnapshot {
  savedTradeId: string;
  review: {
    candleQualityNotes?: string[];
    insights: Array<{
      category: string;
      evidence?: string[];
      id: string;
      summary: string;
      title: string;
      tone: string;
    }>;
    marketContextSource?: string | null;
    tradeWindowEvidenceSource?: string | null;
  };
}

export interface SavedTradeThreadEvidenceItem {
  id: string;
  title: string;
  detail: string;
  reviewAction: string;
  evidenceSource: string;
  tone: SavedTradeThreadEvidenceTone;
}

export interface SavedTradeThreadMarketContextFinding {
  id: string;
  tradeId: string;
  category: string;
  sourceInsightId: string;
  label: string;
  detail: string;
  reviewAction: string;
  evidence: string[];
  evidenceSource: string;
  evidenceChannel: UserFacingBehaviorEvidenceChannel;
  opportunityType: UserFacingBehaviorOpportunityType;
  state: UserFacingBehaviorState;
  canDrivePrimaryConclusion: boolean;
  tone: SavedTradeThreadEvidenceTone;
}

export interface SavedTradeThread {
  id: string;
  symbol: string;
  sessionDate: string;
  roundTripCount: number;
  closedRoundTripCount: number;
  openRoundTripCount: number;
  totalGrossRealizedPnl: number;
  firstEntryTime: string | null;
  lastExitTime: string | null;
  bestRoundTrip: SavedTradeThreadRoundTrip | null;
  worstRoundTrip: SavedTradeThreadRoundTrip | null;
  roundTrips: SavedTradeThreadRoundTrip[];
  laterRoundTripPnl: number;
  peakCumulativePnl: number;
  givebackFromPeak: number;
  lifecycleClassification: SavedTradeThreadLifecycleClassification;
  lifecycleLabel: string;
  lifecycleDetail: string;
  fixFirstAction: string;
  primaryReviewQuestion: string;
  reviewEvidence: SavedTradeThreadEvidenceItem[];
  marketContextFindings: SavedTradeThreadMarketContextFinding[];
  priorityMarketContextFindings: SavedTradeThreadMarketContextFinding[];
  marketContextFindingCount: number;
  marketContextRiskCount: number;
  marketContextStrengthCount: number;
  marketContextReviewPromptCount: number;
  addQualityFindingCount: number;
  addQualityRiskCount: number;
  addQualityStrengthCount: number;
  addQualityReviewPromptCount: number;
  postExitFindingCount: number;
  postExitRiskCount: number;
  postExitStrengthCount: number;
  postExitReviewPromptCount: number;
  protectedProfitBeforeFadeFindingCount: number;
  exitLevelFindingCount: number;
  exitLevelRiskCount: number;
  exitLevelStrengthCount: number;
  exitLevelReviewPromptCount: number;
  levelFindingCount: number;
  volumeFindingCount: number;
  volumeRiskCount: number;
  volumeStrengthCount: number;
  volumeReviewPromptCount: number;
  storyKind: SavedTradeThreadStoryKind;
  storyLabel: string;
  storyDetail: string;
  reviewPrompt: string;
  href: string;
}

export interface SavedTradeSessionTickerSummary {
  id: string;
  symbol: string;
  sessionDate: string;
  storyLabel: string;
  lifecycleClassification: SavedTradeThreadLifecycleClassification;
  lifecycleLabel: string;
  roundTripCount: number;
  closedRoundTripCount: number;
  openRoundTripCount: number;
  totalGrossRealizedPnl: number;
  firstEntryTime: string | null;
  lastExitTime: string | null;
  reviewPriorityLabel: string;
  reviewPriorityAction: string;
  href: string;
}

export interface SavedTradeSessionStory {
  id: string;
  sessionDate: string;
  storyKind: SavedTradeSessionStoryKind;
  storyLabel: string;
  storyDetail: string;
  reviewPrompt: string;
  fixFirstAction: string;
  tradeCount: number;
  symbolCount: number;
  multiRoundTripThreadCount: number;
  repeatedLossThreadCount: number;
  profitGivebackThreadCount: number;
  openOrSwingThreadCount: number;
  marketContextStrengthCount: number;
  protectedProfitBeforeFadeFindingCount: number;
  exitLevelStrengthCount: number;
  volumeStrengthCount: number;
  addQualityStrengthCount: number;
  totalGrossRealizedPnl: number;
  peakCumulativePnl: number;
  givebackFromPeak: number;
  bestThread: SavedTradeThread | null;
  worstThread: SavedTradeThread | null;
  priorityThread: SavedTradeThread | null;
  tickerSummaries: SavedTradeSessionTickerSummary[];
  reviewEvidence: SavedTradeThreadEvidenceItem[];
  daySessionHref: string;
  href: string;
}

export interface SavedTradeThreadReadModel {
  contractVersion: "saved_trade_thread_read_model_v1";
  source: "saved_sqlite" | "sample";
  threadCount: number;
  multiRoundTripThreadCount: number;
  sessionStoryCount: number;
  strengthsToRepeatSessionCount: number;
  greenToRedSessionCount: number;
  sameSymbolManyAttemptsSessionCount: number;
  highTradeCountSessionCount: number;
  marketContextFindingCount: number;
  marketContextRiskCount: number;
  marketContextStrengthCount: number;
  marketContextReviewPromptCount: number;
  addQualityFindingCount: number;
  addQualityRiskCount: number;
  addQualityStrengthCount: number;
  addQualityReviewPromptCount: number;
  postExitFindingCount: number;
  postExitRiskCount: number;
  postExitStrengthCount: number;
  postExitReviewPromptCount: number;
  protectedProfitBeforeFadeFindingCount: number;
  exitLevelFindingCount: number;
  exitLevelRiskCount: number;
  exitLevelStrengthCount: number;
  exitLevelReviewPromptCount: number;
  levelFindingCount: number;
  volumeFindingCount: number;
  volumeRiskCount: number;
  volumeStrengthCount: number;
  volumeReviewPromptCount: number;
  threadWithAddQualityFindingCount: number;
  threadWithMarketContextFindingCount: number;
  threadWithPostExitFindingCount: number;
  threadWithPostExitRiskCount: number;
  threadWithPostExitStrengthCount: number;
  threadWithProtectedProfitBeforeFadeFindingCount: number;
  threadWithExitLevelFindingCount: number;
  threadWithExitLevelRiskCount: number;
  threadWithExitLevelStrengthCount: number;
  threadWithLevelFindingCount: number;
  threadWithVolumeFindingCount: number;
  threadWithVolumeRiskCount: number;
  threadWithVolumeStrengthCount: number;
  threads: SavedTradeThread[];
  sessionStories: SavedTradeSessionStory[];
}

function timeOfFirstExecution(trade: SavedExecutionTrade): string | null {
  const execution = trade.request.executions[0];
  return execution ? String(execution.timestamp) : trade.entryTimeEt ?? null;
}

function timeOfLastExecution(trade: SavedExecutionTrade): string | null {
  const execution = trade.request.executions[trade.request.executions.length - 1];
  return execution ? String(execution.timestamp) : null;
}

function minutesBetween(left: string | null, right: string | null): number | null {
  if (!left || !right) {
    return null;
  }

  const leftTime = Date.parse(left);
  const rightTime = Date.parse(right);

  if (Number.isNaN(leftTime) || Number.isNaN(rightTime)) {
    return null;
  }

  return roundMetric((rightTime - leftTime) / 60000);
}

function sessionDateEt(timestamp: string | null, fallback: string): string {
  if (!timestamp) {
    return fallback;
  }

  const parsed = Date.parse(timestamp);
  if (Number.isNaN(parsed)) {
    return fallback;
  }

  return new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "America/New_York",
    year: "numeric",
  }).format(new Date(parsed));
}

function tradeLifecycle(trade: SavedExecutionTrade): "closed" | "open" {
  const final = trade.request.executions.reduce((position, execution) => {
    const side = execution.side.trim().toLowerCase();
    const shares = Number(execution.shares);
    const direction = trade.tradeDirection === "short" ? "short" : "long";
    const delta =
      direction === "long"
        ? side === "buy"
          ? shares
          : -shares
        : side === "sell"
          ? shares
          : -shares;

    return position + delta;
  }, 0);

  return Math.abs(final) < 0.000001 ? "closed" : "open";
}

function reportRowsByTradeId(
  report: SavedTraderAnalyticsReport | null,
): Map<string, SavedTraderAnalyticsReport["report"]["trades"][number]> {
  const rows = new Map<string, SavedTraderAnalyticsReport["report"]["trades"][number]>();

  if (!report) {
    return rows;
  }

  report.sourceTradeIds.forEach((tradeId, index) => {
    const row = report.report.trades.find((candidate) => candidate.tradeIndex === index + 1);

    if (row) {
      rows.set(tradeId, row);
    }
  });

  return rows;
}

function snapshotsByTradeId(
  snapshots: SavedTradeThreadDecisionReviewSnapshot[] | undefined,
): Map<string, SavedTradeThreadDecisionReviewSnapshot> {
  return new Map((snapshots ?? []).map((snapshot) => [snapshot.savedTradeId, snapshot]));
}

function roundMetric(value: number): number {
  return Number(value.toFixed(2));
}

function formatSigned(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}`;
}

function formatMinutes(value: number | null): string {
  if (typeof value !== "number") {
    return "time gap n/a";
  }

  if (Math.abs(value) >= 60) {
    return `${roundMetric(value / 60)} hour${Math.abs(value) === 60 ? "" : "s"}`;
  }

  return `${value.toFixed(0)} minute${Math.abs(value) === 1 ? "" : "s"}`;
}

function marketContextEvidenceSourceLabel(
  snapshot: SavedTradeThreadDecisionReviewSnapshot,
): string {
  const source =
    snapshot.review.marketContextSource ??
    snapshot.review.tradeWindowEvidenceSource ??
    null;

  if (!source) {
    return "saved chart review";
  }

  const normalized = source.toLowerCase();

  if (
    normalized.includes("levels_system") ||
    normalized.includes("daily_4h") ||
    normalized.includes("market_context")
  ) {
    return "levels and chart evidence";
  }

  if (normalized.includes("trade_window")) {
    return "during-trade candle window";
  }

  return "saved chart review";
}

function isLevelFinding(finding: SavedTradeThreadMarketContextFinding): boolean {
  const value = `${finding.sourceInsightId} ${finding.label}`.toLowerCase();

  return (
    value.includes("support") ||
    value.includes("resistance") ||
    value.includes("breakout") ||
    value.includes("level")
  );
}

function isPostExitFinding(
  finding: SavedTradeThreadMarketContextFinding,
): boolean {
  const value = `${finding.sourceInsightId} ${finding.category} ${finding.label}`.toLowerCase();

  return (
    value.includes("exit") ||
    value.includes("continuation") ||
    value.includes("profit_protection")
  );
}

function isExitLevelFinding(
  finding: SavedTradeThreadMarketContextFinding,
): boolean {
  return (
    isPostExitFinding(finding) &&
    isLevelFinding(finding) &&
    [
      "exit_into_resistance_with_reversal_after_exit",
      "exit_into_resistance_before_breakout",
      "exit_into_support_before_breakdown",
      "exit_into_support_with_relief_after_exit",
      "exit_avoided_adverse_followthrough",
    ].includes(finding.sourceInsightId)
  );
}

function isProtectedProfitBeforeFadeFinding(
  finding: SavedTradeThreadMarketContextFinding,
): boolean {
  return finding.sourceInsightId === "protected_profit_before_fade";
}

function isAddQualityFinding(
  finding: SavedTradeThreadMarketContextFinding,
): boolean {
  const value = [
    finding.sourceInsightId,
    finding.category,
    finding.label,
    finding.detail,
    finding.reviewAction,
    ...finding.evidence,
  ]
    .join(" ")
    .toLowerCase();

  return value.includes("add") || value.includes("scale");
}

function isVolumeFinding(finding: SavedTradeThreadMarketContextFinding): boolean {
  const value = [
    finding.sourceInsightId,
    finding.label,
    finding.detail,
    finding.reviewAction,
    ...finding.evidence,
  ]
    .join(" ")
    .toLowerCase();

  return value.includes("volume");
}

function riskCount(findings: SavedTradeThreadMarketContextFinding[]): number {
  return findings.filter(
    (finding) =>
      finding.canDrivePrimaryConclusion &&
      finding.opportunityType === "risk_to_reduce",
  ).length;
}

function strengthCount(findings: SavedTradeThreadMarketContextFinding[]): number {
  return findings.filter(
    (finding) =>
      finding.canDrivePrimaryConclusion &&
      finding.opportunityType === "strength_to_repeat",
  ).length;
}

function reviewPromptCount(findings: SavedTradeThreadMarketContextFinding[]): number {
  return findings.filter(
    (finding) => finding.opportunityType === "review_prompt",
  ).length;
}

function priorityMarketContextFindings(
  findings: SavedTradeThreadMarketContextFinding[],
): SavedTradeThreadMarketContextFinding[] {
  const priorityRank = (
    finding: SavedTradeThreadMarketContextFinding,
  ): number => {
    if (
      finding.canDrivePrimaryConclusion &&
      finding.opportunityType === "risk_to_reduce"
    ) {
      return 0;
    }

    if (
      finding.canDrivePrimaryConclusion &&
      finding.opportunityType === "strength_to_repeat"
    ) {
      return 1;
    }

    if (finding.opportunityType === "review_prompt") {
      return 2;
    }

    return 3;
  };

  const familyRank = (
    finding: SavedTradeThreadMarketContextFinding,
  ): number => {
    if (isExitLevelFinding(finding)) {
      return 0;
    }

    if (isVolumeFinding(finding)) {
      return 1;
    }

    if (isPostExitFinding(finding)) {
      return 2;
    }

    if (isLevelFinding(finding)) {
      return 3;
    }

    if (isAddQualityFinding(finding)) {
      return 4;
    }

    return 5;
  };

  return [...findings]
    .sort((left, right) => {
      const priorityDelta = priorityRank(left) - priorityRank(right);

      if (priorityDelta !== 0) {
        return priorityDelta;
      }

      const familyDelta = familyRank(left) - familyRank(right);

      if (familyDelta !== 0) {
        return familyDelta;
      }

      return left.label.localeCompare(right.label);
    })
    .slice(0, 3);
}

function buildMarketContextFindings(
  snapshots: SavedTradeThreadDecisionReviewSnapshot[],
): SavedTradeThreadMarketContextFinding[] {
  return snapshots.flatMap((snapshot) =>
    snapshot.review.insights
      .map((insight) => ({
        insight,
        mapped: mapDecisionReviewInsightForUser(insight, "/trades"),
      }))
      .filter(
        ({ mapped }) =>
          mapped.canShowPrimary && mapped.evidenceChannel !== "execution_only",
      )
      .map(({ insight, mapped }) => ({
        id: `${snapshot.savedTradeId}:${mapped.sourceInsightId}`,
        tradeId: snapshot.savedTradeId,
        category: mapped.category,
        sourceInsightId: mapped.sourceInsightId,
        label: mapped.label,
        detail: mapped.detail,
        reviewAction: mapped.reviewAction,
        evidence: insight.evidence ?? [],
        evidenceSource: marketContextEvidenceSourceLabel(snapshot),
        evidenceChannel: mapped.evidenceChannel,
        opportunityType: mapped.opportunityType,
        state: mapped.state,
        canDrivePrimaryConclusion: mapped.canDrivePrimaryConclusion,
        tone: mapped.tone,
      })),
  );
}

function escapedRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function numericEvidenceValue(
  evidence: readonly string[],
  keys: readonly string[],
): number | null {
  for (const item of evidence) {
    for (const key of keys) {
      const match = item.match(
        new RegExp(`${escapedRegExp(key)}\\s*=\\s*([+-]?[0-9,.]+)`, "i"),
      );

      if (!match?.[1]) {
        continue;
      }

      const value = Number(match[1].replace(/,/g, ""));

      if (Number.isFinite(value)) {
        return value;
      }
    }
  }

  return null;
}

function entryVolumeFromSnapshot(
  snapshot: SavedTradeThreadDecisionReviewSnapshot | undefined,
): number | null {
  if (!snapshot) {
    return null;
  }

  return numericEvidenceValue(
    snapshot.review.insights.flatMap((insight) => insight.evidence ?? []),
    [
      "entryVolume",
      "entryWindowVolume",
      "firstEntryVolume",
      "volumeAtEntry",
      "entryVolumeSum",
    ],
  );
}

function buildReentryVolumeComparisonFindings(args: {
  roundTrips: SavedTradeThreadRoundTrip[];
  snapshotsByTradeId: Map<string, SavedTradeThreadDecisionReviewSnapshot>;
}): SavedTradeThreadMarketContextFinding[] {
  if (args.roundTrips.length < 2) {
    return [];
  }

  const firstRoundTrip = args.roundTrips[0];
  const firstVolume = entryVolumeFromSnapshot(
    args.snapshotsByTradeId.get(firstRoundTrip.tradeId),
  );

  if (!firstVolume || firstVolume <= 0) {
    return [];
  }

  for (const laterRoundTrip of args.roundTrips.slice(1)) {
    const laterVolume = entryVolumeFromSnapshot(
      args.snapshotsByTradeId.get(laterRoundTrip.tradeId),
    );

    if (!laterVolume || laterVolume <= 0) {
      continue;
    }

    const ratio = laterVolume / firstVolume;
    const laterPnl = laterRoundTrip.grossRealizedPnl ?? null;
    const firstPnl = firstRoundTrip.grossRealizedPnl ?? null;
    const fadedWithWeakerOutcome =
      ratio <= 0.65 &&
      (laterPnl === null ||
        firstPnl === null ||
        laterPnl <= 0 ||
        laterPnl < firstPnl);
    const confirmedWithConstructiveOutcome =
      ratio >= 1.1 && (laterPnl === null || laterPnl >= 0);
    const behaviorId = fadedWithWeakerOutcome
      ? "reentry_volume_faded"
      : confirmedWithConstructiveOutcome
        ? "reentry_volume_confirmed"
        : null;

    if (!behaviorId) {
      continue;
    }

    const mapped = mapDecisionReviewInsightForUser(
      {
        category: "market_context",
        evidence: [
          `firstEntryVolume=${roundMetric(firstVolume)}`,
          `reentryVolume=${roundMetric(laterVolume)}`,
          `reentryVolumeVsFirstEntryPct=${roundMetric(ratio * 100)}`,
          `reentryGrossRealizedPnl=${
            typeof laterPnl === "number" ? roundMetric(laterPnl) : "n/a"
          }`,
        ],
        id: behaviorId,
        summary:
          behaviorId === "reentry_volume_faded"
            ? "Later re-entry volume was meaningfully lower than the first push."
            : "Later re-entry volume was comparable to or stronger than the first push.",
        title:
          behaviorId === "reentry_volume_faded"
            ? "Re-entry had lower volume"
            : "Re-entry kept strong volume",
        tone: behaviorId === "reentry_volume_faded" ? "risk" : "strength",
      },
      "/trades",
    );

    if (!mapped.canShowPrimary || mapped.evidenceChannel === "execution_only") {
      continue;
    }

    return [
      {
        id: `${laterRoundTrip.tradeId}:${behaviorId}`,
        tradeId: laterRoundTrip.tradeId,
        category: mapped.category,
        sourceInsightId: mapped.sourceInsightId,
        label: mapped.label,
        detail: mapped.detail,
        reviewAction: mapped.reviewAction,
        evidence: mapped.evidence,
        evidenceSource: "saved first-entry/re-entry volume comparison",
        evidenceChannel: mapped.evidenceChannel,
        opportunityType: mapped.opportunityType,
        state: mapped.state,
        canDrivePrimaryConclusion: mapped.canDrivePrimaryConclusion,
        tone: mapped.tone,
      },
    ];
  }

  return [];
}

function hasCrossSessionExposure(
  roundTrips: SavedTradeThreadRoundTrip[],
): boolean {
  return roundTrips.some((roundTrip) => roundTrip.crossedSessionDate);
}

function hasExtendedSameDayHold(
  roundTrips: SavedTradeThreadRoundTrip[],
): boolean {
  return roundTrips.some(
    (roundTrip) => roundTrip.heldOvernight && !roundTrip.crossedSessionDate,
  );
}

function classifyThreadLifecycle(args: {
  roundTrips: SavedTradeThreadRoundTrip[];
  sessionDateCount: number;
}): Pick<
  SavedTradeThread,
  "lifecycleClassification" | "lifecycleDetail" | "lifecycleLabel"
> {
  if (args.sessionDateCount > 1) {
    return {
      lifecycleClassification: "multi_day_ticker_thread",
      lifecycleLabel: "Multi-day ticker thread",
      lifecycleDetail:
        "This ticker story includes executions or round trips from more than one session date.",
    };
  }

  if (hasCrossSessionExposure(args.roundTrips)) {
    return {
      lifecycleClassification: "day_trade_turned_swing",
      lifecycleLabel: "Day trade turned swing",
      lifecycleDetail:
        "At least one round trip carried into another trading session, so review the hold decision separately from the intraday entry.",
    };
  }

  if (hasExtendedSameDayHold(args.roundTrips)) {
    return {
      lifecycleClassification: "extended_same_day_hold",
      lifecycleLabel: "Extended same-day hold",
      lifecycleDetail:
        "At least one round trip continued into the late or overnight-hours session on the same trading date, so review whether that hold matched the trade plan.",
    };
  }

  if (args.roundTrips.length === 1) {
    return {
      lifecycleClassification: "single_round_trip",
      lifecycleLabel: "Single round trip",
      lifecycleDetail:
        "This ticker only has one flat-to-flat trade in the selected import.",
    };
  }

  if (args.roundTrips.some((roundTrip) => roundTrip.lifecycleStatus === "open")) {
    return {
      lifecycleClassification: "open_intraday_reentry",
      lifecycleLabel: "Open intraday re-entry",
      lifecycleDetail:
        "The trader re-entered after getting flat, but the later round trip is still open in the imported executions.",
    };
  }

  return {
    lifecycleClassification: "closed_day_trade_reentry",
    lifecycleLabel: "Closed day-trade re-entry",
    lifecycleDetail:
      "The trader got flat, re-entered the same ticker later in the session, and got flat again.",
  };
}

function buildStory(thread: {
  best: SavedTradeThreadRoundTrip | null;
  givebackFromPeak: number;
  laterRoundTripPnl: number;
  lifecycleClassification: SavedTradeThreadLifecycleClassification;
  peakCumulativePnl: number;
  roundTrips: SavedTradeThreadRoundTrip[];
  totalGrossRealizedPnl: number;
}): Pick<
  SavedTradeThread,
  "reviewPrompt" | "storyDetail" | "storyKind" | "storyLabel"
> {
  if (thread.lifecycleClassification === "day_trade_turned_swing") {
    return {
      storyKind: "swing_transition",
      storyLabel: "Re-entry changed the trade type",
      storyDetail:
        "This started as an intraday ticker story, but one re-entry continued into another trading session.",
      reviewPrompt:
        "Review the decision to hold separately from the original day-trade idea: plan, invalidation, size, and whether the setup was still worth carrying.",
    };
  }

  if (thread.lifecycleClassification === "extended_same_day_hold") {
    return {
      storyKind: "extended_same_day_hold",
      storyLabel: "Extended same-day hold",
      storyDetail:
        "This stayed on the same trading date, and one re-entry continued into the late or overnight-hours session.",
      reviewPrompt:
        "Review the hold plan separately: whether the hold was intended, where invalidation was, and what would have ended the extended hold.",
    };
  }

  if (thread.lifecycleClassification === "open_intraday_reentry") {
    return {
      storyKind: "open_reentry",
      storyLabel: "Re-entry is still open",
      storyDetail:
        "The trader got flat, re-entered the ticker, and the imported executions do not show a completed exit yet.",
      reviewPrompt:
        "Review only the completed execution evidence now. Wait for the position to close before treating the full re-entry story as complete.",
    };
  }

  if (thread.roundTrips.length === 1) {
    return {
      storyKind: "single_round_trip",
      storyLabel: "Single round trip",
      storyDetail: "This ticker only has one flat-to-flat trade in the selected import.",
      reviewPrompt: "Review the execution replay for entry, add, reduction, and exit behavior.",
    };
  }

  if (
    thread.peakCumulativePnl > 0 &&
    thread.givebackFromPeak > 0 &&
    typeof thread.best?.grossRealizedPnl === "number" &&
    thread.best.grossRealizedPnl > 0
  ) {
    return {
      storyKind: "profit_giveback",
      storyLabel: "Re-entry gave back profit",
      storyDetail: `This ticker reached ${formatSigned(thread.peakCumulativePnl)} before later round trips gave back ${thread.givebackFromPeak.toFixed(2)}.`,
      reviewPrompt:
        "Compare the later re-entry against the first winning push: entry quality, volume, and whether the setup was still fresh.",
    };
  }

  if (thread.laterRoundTripPnl > 0) {
    return {
      storyKind: "reentry_added_profit",
      storyLabel: "Re-entry added profit",
      storyDetail: `Later round trips added ${formatSigned(thread.laterRoundTripPnl)} after the first completed trade.`,
      reviewPrompt:
        "Look for what stayed clean across the re-entry so the behavior can be repeated intentionally.",
    };
  }

  if (thread.totalGrossRealizedPnl < 0) {
    return {
      storyKind: "repeated_losing_attempts",
      storyLabel: "Repeated attempts lost money",
      storyDetail: `Multiple round trips finished at ${formatSigned(thread.totalGrossRealizedPnl)}.`,
      reviewPrompt:
        "Check whether the later attempts happened after momentum or volume had faded.",
    };
  }

  return {
    storyKind: "multiple_round_trips",
    storyLabel: "Multiple round trips",
    storyDetail: `This ticker had ${thread.roundTrips.length} separate flat-to-flat trades.`,
    reviewPrompt:
      "Review whether the later entries were fresh opportunities or attempts to remake the same idea.",
  };
}

function postExitEvidenceTitle(sourceInsightId: string): string {
  switch (sourceInsightId) {
    case "protected_profit_before_fade":
      return "Profit was protected before a later fade";
    case "exit_captured_trade_well":
      return "Exit capture was measured";
    case "balanced_management_with_constructive_exit":
      return "Full-trade management was constructive";
    case "add_into_strength_with_constructive_final_exit":
      return "Strength add and final exit were constructive";
    case "exit_avoided_adverse_followthrough":
      return "Exit avoided a later fade";
    case "exit_into_resistance_with_reversal_after_exit":
      return "Exit protected profit near resistance";
    case "exit_into_resistance_before_breakout":
      return "Exit before resistance break needs review";
    case "exit_into_support_before_breakdown":
      return "Exit avoided a support break";
    case "exit_into_support_with_relief_after_exit":
      return "Exit near support needs review";
    case "profit_protection_failed":
      return "Profit protection was measured";
    case "exit_needs_post_exit_context":
      return "After-exit chart check is needed";
    case "exit_large_post_exit_move_needs_review":
      return "Large after-exit move needs review";
    default:
      return "Post-exit continuation was measured";
  }
}

function buildReviewEvidence(thread: {
  best: SavedTradeThreadRoundTrip | null;
  decisionReviewSnapshots: SavedTradeThreadDecisionReviewSnapshot[];
  givebackFromPeak: number;
  laterRoundTripPnl: number;
  lifecycleClassification: SavedTradeThreadLifecycleClassification;
  marketContextFindings: SavedTradeThreadMarketContextFinding[];
  peakCumulativePnl: number;
  roundTrips: SavedTradeThreadRoundTrip[];
  totalGrossRealizedPnl: number;
  worst: SavedTradeThreadRoundTrip | null;
}): Pick<
  SavedTradeThread,
  "fixFirstAction" | "primaryReviewQuestion" | "reviewEvidence"
> {
  const evidence: SavedTradeThreadEvidenceItem[] = [];
  const firstRoundTrip = thread.roundTrips[0] ?? null;
  const reentries = thread.roundTrips.slice(1);
  const firstReentry = reentries[0] ?? null;

  if (thread.lifecycleClassification === "day_trade_turned_swing") {
    evidence.push({
      id: "swing-transition",
      title: "The re-entry changed the trade type",
      detail:
        "One later round trip carried into another trading session.",
      reviewAction:
        "Write down the hold plan, invalidation, size, and why the day-trade idea became worth carrying.",
      evidenceSource: "saved executions",
      tone: "warning",
    });
  }

  if (thread.lifecycleClassification === "extended_same_day_hold") {
    evidence.push({
      id: "extended-same-day-hold",
      title: "The re-entry became an extended same-day hold",
      detail:
        "One later round trip stayed on the same trading date but continued into the late or overnight-hours session.",
      reviewAction:
        "Write down whether the hold was planned, where invalidation was, and what would have ended the extended hold.",
      evidenceSource: "saved executions",
      tone: "warning",
    });
  }

  if (thread.lifecycleClassification === "open_intraday_reentry") {
    evidence.push({
      id: "open-reentry",
      title: "The re-entry is not complete yet",
      detail:
        "The imported executions show a later re-entry, but they do not show the position returning to flat.",
      reviewAction:
        "Review the completed trade first and wait for a closing execution before judging the full re-entry.",
      evidenceSource: "saved executions",
      tone: "info",
    });
  }

  if (
    thread.peakCumulativePnl > 0 &&
    thread.givebackFromPeak > 0 &&
    typeof thread.best?.grossRealizedPnl === "number" &&
    thread.best.grossRealizedPnl > 0
  ) {
    evidence.push({
      id: "profit-giveback",
      title: "Later trading gave back earlier profit",
      detail: `The ticker story reached ${formatSigned(thread.peakCumulativePnl)} before giving back ${thread.givebackFromPeak.toFixed(2)}.`,
      reviewAction:
        "Compare the later entry against the first winning push and check whether the setup was still fresh.",
      evidenceSource: "saved P/L by round trip",
      tone: "danger",
    });
  } else if (thread.laterRoundTripPnl > 0) {
    evidence.push({
      id: "reentry-added-profit",
      title: "Later trading added to the story",
      detail: `Re-entries added ${formatSigned(
        thread.laterRoundTripPnl,
      )} after the first completed round trip.`,
      reviewAction:
        "Look for what stayed controlled on the re-entry so the behavior can be repeated intentionally.",
      evidenceSource: "saved P/L by round trip",
      tone: "success",
    });
  }

  if (firstReentry?.minutesSincePreviousExit !== null && firstReentry) {
    evidence.push({
      id: "reentry-time-gap",
      title: "Time between exit and re-entry",
      detail: `The first re-entry came ${formatMinutes(
        firstReentry.minutesSincePreviousExit,
      )} after the prior flat exit.`,
      reviewAction:
        "Review whether the re-entry had a fresh reason or was an attempt to remake the same move.",
      evidenceSource: "saved execution timestamps",
      tone: "info",
    });
  }

  if (
    firstRoundTrip &&
    firstReentry &&
    firstReentry.executionCount > firstRoundTrip.executionCount
  ) {
    evidence.push({
      id: "reentry-more-complex",
      title: "The re-entry had more executions",
      detail: `Trade ${firstReentry.sequence} used ${firstReentry.executionCount} executions versus ${firstRoundTrip.executionCount} in the first round trip.`,
      reviewAction:
        "Check whether the added executions were planned trade management or reactive chopping.",
      evidenceSource: "saved execution count",
      tone: "warning",
    });
  }

  if (thread.worst && thread.worst.sequence > 1) {
    evidence.push({
      id: "worst-round-trip-was-reentry",
      title: "The weakest push was a re-entry",
      detail: `Trade ${thread.worst.sequence} was the weakest round trip at ${formatSigned(
        thread.worst.grossRealizedPnl ?? 0,
      )}.`,
      reviewAction:
        "Start review on that re-entry and compare its entry timing, exit plan, and size to the first push.",
      evidenceSource: "saved P/L by round trip",
      tone: "danger",
    });
  }

  const availableContextCount = thread.roundTrips.filter(
    (roundTrip) => roundTrip.chartContextStatus === "available",
  ).length;
  const insightCount = thread.decisionReviewSnapshots.reduce(
    (total, snapshot) => total + snapshot.review.insights.length,
    0,
  );
  const certifiedMarketFindings = thread.marketContextFindings.filter(
    (finding) => finding.canDrivePrimaryConclusion,
  );
  const marketReviewPrompts = thread.marketContextFindings.filter(
    (finding) => !finding.canDrivePrimaryConclusion,
  );
  const primaryMarketFinding =
    certifiedMarketFindings.find(
      (finding) => finding.opportunityType === "risk_to_reduce",
    ) ??
    certifiedMarketFindings.find(
      (finding) => finding.opportunityType === "strength_to_repeat",
    ) ??
    marketReviewPrompts[0] ??
    null;

  if (availableContextCount > 0) {
    evidence.push({
      id: "chart-context-available",
      title: "Chart evidence is attached",
      detail: `${availableContextCount} of ${thread.roundTrips.length} round trip${
        thread.roundTrips.length === 1 ? " has" : "s have"
      } saved chart review with ${insightCount} insight${
        insightCount === 1 ? "" : "s"
      }.`,
      reviewAction:
        "Use the saved chart insights alongside the execution replay, but keep volume conclusions limited to what the evidence states.",
      evidenceSource: "saved chart evidence",
      tone: "success",
    });
  }

  if (thread.marketContextFindings.length > 0) {
    evidence.push({
      id: "market-context-insights-available",
      title: certifiedMarketFindings.length > 0
        ? "Chart findings are available"
        : "Chart evidence can support review",
      detail: thread.marketContextFindings
        .slice(0, 2)
        .map((finding) => finding.label)
        .join(" / "),
      reviewAction:
        primaryMarketFinding?.reviewAction ??
        "Compare these chart notes against the first push and later re-entry before making a trade-story conclusion.",
      evidenceSource: primaryMarketFinding?.evidenceSource ?? "saved chart review",
      tone: primaryMarketFinding?.tone ?? "info",
    });
  }

  const postExitFinding = thread.marketContextFindings.find(
    (finding) =>
      finding.sourceInsightId === "exit_left_continuation" ||
      finding.sourceInsightId === "exit_needs_post_exit_context" ||
      finding.sourceInsightId === "exit_large_post_exit_move_needs_review" ||
      finding.sourceInsightId === "protected_profit_before_fade" ||
      finding.sourceInsightId === "exit_captured_trade_well" ||
      finding.sourceInsightId === "balanced_management_with_constructive_exit" ||
      finding.sourceInsightId === "add_into_strength_with_constructive_final_exit" ||
      finding.sourceInsightId === "exit_avoided_adverse_followthrough" ||
      finding.sourceInsightId ===
        "exit_into_resistance_with_reversal_after_exit" ||
      finding.sourceInsightId === "exit_into_resistance_before_breakout" ||
      finding.sourceInsightId === "exit_into_support_before_breakdown" ||
      finding.sourceInsightId === "exit_into_support_with_relief_after_exit" ||
      finding.sourceInsightId === "profit_protection_failed",
  );

  if (postExitFinding) {
    evidence.push({
      id: "post-exit-context-finding",
      title: postExitEvidenceTitle(postExitFinding.sourceInsightId),
      detail: postExitFinding.label,
      reviewAction: postExitFinding.reviewAction,
      evidenceSource: postExitFinding.evidenceSource,
      tone: postExitFinding.tone,
    });
  }

  if (thread.roundTrips.length > 1) {
    const volumeFindings = thread.marketContextFindings.filter(isVolumeFinding);
    const primaryVolumeFinding =
      volumeFindings.find(
        (finding) =>
          finding.canDrivePrimaryConclusion &&
          finding.opportunityType === "risk_to_reduce",
      ) ??
      volumeFindings.find(
        (finding) =>
          finding.canDrivePrimaryConclusion &&
          finding.opportunityType === "strength_to_repeat",
      ) ??
      volumeFindings.find(
        (finding) => finding.opportunityType === "review_prompt",
      ) ??
      null;
    const hasVolumeFinding = volumeFindings.length > 0;

    evidence.push({
      id:
        hasVolumeFinding
          ? "volume-context-reviewed"
          : availableContextCount === thread.roundTrips.length
          ? "volume-context-to-compare"
          : "chart-context-to-check",
      title:
        primaryVolumeFinding?.opportunityType === "risk_to_reduce"
          ? "Volume comparison shows risk"
          : primaryVolumeFinding?.opportunityType === "strength_to_repeat"
            ? "Volume comparison shows strength"
            : hasVolumeFinding
              ? "Volume context is attached"
          : availableContextCount === thread.roundTrips.length
            ? "Volume context still needs comparison"
            : "Chart data to check next",
      detail:
        hasVolumeFinding
          ? primaryVolumeFinding?.label ??
            "Saved chart evidence includes volume evidence. Use only the attached evidence before drawing a volume conclusion."
          : availableContextCount === thread.roundTrips.length
            ? "Saved chart evidence is attached, but this thread model does not yet have a direct first-entry vs re-entry volume comparison."
            : "This story needs chart and volume data before making a market-context conclusion.",
      reviewAction:
        primaryVolumeFinding?.reviewAction ??
        "Compare volume, level location, and price follow-through between the first push and later re-entry.",
      evidenceSource:
        hasVolumeFinding
          ? primaryVolumeFinding?.evidenceSource ?? "saved volume evidence"
          : availableContextCount === thread.roundTrips.length
            ? "saved chart evidence"
            : "chart data still missing",
      tone: primaryVolumeFinding?.tone ?? "info",
    });
  }

  const fixFirstAction =
    evidence.find((item) => item.tone === "danger")?.reviewAction ??
    evidence.find((item) => item.tone === "warning")?.reviewAction ??
    evidence[0]?.reviewAction ??
    "Review the execution replay for entry, add, reduction, and exit behavior.";
  const primaryReviewQuestion =
    thread.lifecycleClassification === "day_trade_turned_swing"
      ? "Did the re-entry become a different trade than the original day-trade idea?"
      : thread.lifecycleClassification === "extended_same_day_hold"
        ? "Was the late-session continuation planned, and did it have clear invalidation?"
      : thread.lifecycleClassification === "open_intraday_reentry"
        ? "What needs to happen before this open re-entry can be reviewed as complete?"
        : thread.peakCumulativePnl > 0 && thread.givebackFromPeak > 0
          ? "Did the later re-entry give back profit because the setup had changed?"
          : thread.roundTrips.length > 1 && thread.totalGrossRealizedPnl < 0
            ? "Did the later attempts happen after the setup or volume had faded?"
          : "Was the later re-entry a fresh opportunity or a repeat attempt at the same move?";

  return {
    fixFirstAction,
    primaryReviewQuestion,
    reviewEvidence: evidence,
  };
}

function strongestSameSymbolThread(
  threads: SavedTradeThread[],
): SavedTradeThread | null {
  return (
    [...threads]
      .filter((thread) => thread.roundTripCount > 1)
      .sort((left, right) => {
        if (right.roundTripCount !== left.roundTripCount) {
          return right.roundTripCount - left.roundTripCount;
        }

        return (
          Math.abs(right.totalGrossRealizedPnl) -
          Math.abs(left.totalGrossRealizedPnl)
        );
      })[0] ?? null
  );
}

function sessionStoryPriority(kind: SavedTradeSessionStoryKind): number {
  if (kind === "green_to_red_session") {
    return 0;
  }

  if (kind === "same_symbol_many_attempts") {
    return 1;
  }

  if (kind === "session_high_trade_count") {
    return 2;
  }

  if (kind === "open_or_swing_review") {
    return 3;
  }

  if (kind === "strengths_to_repeat_session") {
    return 4;
  }

  if (kind === "mixed_session_review") {
    return 5;
  }

  return 6;
}

function buildSessionStory(args: {
  sessionDate: string;
  threads: SavedTradeThread[];
}): SavedTradeSessionStory {
  const roundTrips = args.threads
    .flatMap((thread) =>
      thread.roundTrips.map((roundTrip) => ({
        roundTrip,
        thread,
      })),
    )
    .sort((left, right) => {
      const leftTime = Date.parse(left.roundTrip.entryTime ?? "");
      const rightTime = Date.parse(right.roundTrip.entryTime ?? "");

      return (Number.isNaN(leftTime) ? 0 : leftTime) - (Number.isNaN(rightTime) ? 0 : rightTime);
    });
  const pnlValues = roundTrips
    .map((item) => item.roundTrip.grossRealizedPnl)
    .filter((value): value is number => typeof value === "number");
  const totalGrossRealizedPnl = roundMetric(
    pnlValues.reduce((total, value) => total + value, 0),
  );
  let running = 0;
  let peakCumulativePnl = 0;

  pnlValues.forEach((value) => {
    running += value;
    peakCumulativePnl = Math.max(peakCumulativePnl, running);
  });

  const givebackFromPeak = roundMetric(
    peakCumulativePnl > 0
      ? Math.max(0, peakCumulativePnl - totalGrossRealizedPnl)
      : 0,
  );
  const tradeCount = roundTrips.length;
  const symbolCount = new Set(args.threads.map((thread) => thread.symbol)).size;
  const multiRoundTripThreads = args.threads.filter(
    (thread) => thread.roundTripCount > 1,
  );
  const repeatedLossThreadCount = args.threads.filter(
    (thread) => thread.storyKind === "repeated_losing_attempts",
  ).length;
  const profitGivebackThreadCount = args.threads.filter(
    (thread) => thread.storyKind === "profit_giveback",
  ).length;
  const openOrSwingThreadCount = args.threads.filter((thread) =>
    ["extended_same_day_hold", "open_reentry", "swing_transition"].includes(
      thread.storyKind,
    ),
  ).length;
  const marketContextStrengthCount = args.threads.reduce(
    (total, thread) => total + thread.marketContextStrengthCount,
    0,
  );
  const marketContextRiskCount = args.threads.reduce(
    (total, thread) => total + thread.marketContextRiskCount,
    0,
  );
  const protectedProfitBeforeFadeFindingCount = args.threads.reduce(
    (total, thread) => total + thread.protectedProfitBeforeFadeFindingCount,
    0,
  );
  const exitLevelStrengthCount = args.threads.reduce(
    (total, thread) => total + thread.exitLevelStrengthCount,
    0,
  );
  const volumeStrengthCount = args.threads.reduce(
    (total, thread) => total + thread.volumeStrengthCount,
    0,
  );
  const addQualityStrengthCount = args.threads.reduce(
    (total, thread) => total + thread.addQualityStrengthCount,
    0,
  );
  const bestThread =
    [...args.threads].sort(
      (left, right) => right.totalGrossRealizedPnl - left.totalGrossRealizedPnl,
    )[0] ?? null;
  const worstThread =
    [...args.threads].sort(
      (left, right) => left.totalGrossRealizedPnl - right.totalGrossRealizedPnl,
    )[0] ?? null;
  const sameSymbolThread = strongestSameSymbolThread(args.threads);
  const highTradeCount = tradeCount >= 8 || symbolCount >= 5;
  const hasManySameSymbolAttempts =
    Boolean(sameSymbolThread && sameSymbolThread.roundTripCount >= 3) ||
    repeatedLossThreadCount > 0 ||
    profitGivebackThreadCount > 0;
  const hasEvidenceBackedStrengthSession =
    totalGrossRealizedPnl > 0 &&
    marketContextStrengthCount > 0 &&
    marketContextRiskCount === 0 &&
    profitGivebackThreadCount === 0 &&
    repeatedLossThreadCount === 0 &&
    openOrSwingThreadCount === 0;
  const storyKind: SavedTradeSessionStoryKind =
    peakCumulativePnl > 0 && totalGrossRealizedPnl < 0
      ? "green_to_red_session"
      : hasManySameSymbolAttempts
        ? "same_symbol_many_attempts"
        : highTradeCount
          ? "session_high_trade_count"
          : openOrSwingThreadCount > 0
            ? "open_or_swing_review"
            : hasEvidenceBackedStrengthSession
              ? "strengths_to_repeat_session"
            : totalGrossRealizedPnl > 0
              ? "positive_controlled_session"
              : "mixed_session_review";
  const priorityThread =
    args.threads.find((thread) => thread.storyKind === "profit_giveback") ??
    args.threads.find((thread) => thread.storyKind === "repeated_losing_attempts") ??
    args.threads.find((thread) => thread.storyKind === "swing_transition") ??
    args.threads.find((thread) => thread.storyKind === "extended_same_day_hold") ??
    args.threads.find((thread) => thread.marketContextStrengthCount > 0) ??
    sameSymbolThread ??
    worstThread ??
    bestThread;
  const tickerSummaries = [...args.threads]
    .sort((left, right) => {
      if (left.id === priorityThread?.id) {
        return -1;
      }

      if (right.id === priorityThread?.id) {
        return 1;
      }

      if (right.roundTripCount !== left.roundTripCount) {
        return right.roundTripCount - left.roundTripCount;
      }

      if (Math.abs(right.totalGrossRealizedPnl) !== Math.abs(left.totalGrossRealizedPnl)) {
        return (
          Math.abs(right.totalGrossRealizedPnl) -
          Math.abs(left.totalGrossRealizedPnl)
        );
      }

      return left.symbol.localeCompare(right.symbol);
    })
    .map((thread) => ({
      id: thread.id,
      symbol: thread.symbol,
      sessionDate: thread.sessionDate,
      storyLabel: thread.storyLabel,
      lifecycleClassification: thread.lifecycleClassification,
      lifecycleLabel: thread.lifecycleLabel,
      roundTripCount: thread.roundTripCount,
      closedRoundTripCount: thread.closedRoundTripCount,
      openRoundTripCount: thread.openRoundTripCount,
      totalGrossRealizedPnl: thread.totalGrossRealizedPnl,
      firstEntryTime: thread.firstEntryTime,
      lastExitTime: thread.lastExitTime,
      reviewPriorityLabel: thread.primaryReviewQuestion,
      reviewPriorityAction: thread.fixFirstAction,
      href: thread.href,
    }));
  const evidence: SavedTradeThreadEvidenceItem[] = [];

  if (storyKind === "green_to_red_session") {
    evidence.push({
      id: "session-green-to-red",
      title: "The session went from green to red",
      detail: `The session reached ${formatSigned(peakCumulativePnl)} before finishing ${formatSigned(totalGrossRealizedPnl)}.`,
      reviewAction:
        "Find the trade or re-entry that changed the day and write what should have stopped the next attempt.",
      evidenceSource: "saved P/L by trade order",
      tone: "danger",
    });
  }

  if (sameSymbolThread) {
    evidence.push({
      id: "session-same-symbol-many-attempts",
      title: "One ticker had multiple attempts",
      detail: `${userFacingTradeSymbol(sameSymbolThread.symbol)} had ${sameSymbolThread.roundTripCount} round trips for ${formatSigned(sameSymbolThread.totalGrossRealizedPnl)}.`,
      reviewAction:
        "Separate fresh setups from attempts to remake the same move.",
      evidenceSource: "saved same-symbol round trips",
      tone:
        sameSymbolThread.totalGrossRealizedPnl < 0 ||
        sameSymbolThread.storyKind === "profit_giveback"
          ? "warning"
          : "info",
    });
  }

  if (highTradeCount) {
    evidence.push({
      id: "session-high-trade-count",
      title: "High trade count to review",
      detail: `${tradeCount} round trips across ${symbolCount} symbol${symbolCount === 1 ? "" : "s"} were saved for this session.`,
      reviewAction:
        "Check whether each trade had its own plan or whether activity increased after the first loss.",
      evidenceSource: "saved execution count",
      tone: "warning",
    });
  }

  if (openOrSwingThreadCount > 0) {
    evidence.push({
      id: "session-open-or-swing",
      title: "Open or extended-hold exposure needs separate review",
      detail: `${openOrSwingThreadCount} ticker stor${openOrSwingThreadCount === 1 ? "y" : "ies"} included an open re-entry, extended same-day hold, or next-session hold.`,
      reviewAction:
        "Review hold plan, size, and invalidation separately from the original intraday idea.",
      evidenceSource: "saved execution lifecycle",
      tone: "info",
    });
  }

  if (hasEvidenceBackedStrengthSession) {
    evidence.push({
      id: "session-strengths-to-repeat",
      title: "Strengths to repeat",
      detail: `${marketContextStrengthCount} chart-backed strength${
        marketContextStrengthCount === 1 ? "" : "s"
      } showed up in this green session.`,
      reviewAction:
        "Pick the clearest strength, save the repeatable cue, and use it as the rule for the next similar trade.",
      evidenceSource: "saved chart findings and trade outcomes",
      tone: "success",
    });
  }

  if (protectedProfitBeforeFadeFindingCount > 0) {
    evidence.push({
      id: "session-protected-before-fade",
      title: "Profit protection worked before later fade",
      detail: `${protectedProfitBeforeFadeFindingCount} trade${
        protectedProfitBeforeFadeFindingCount === 1 ? "" : "s"
      } protected profit before the after-exit chart faded.`,
      reviewAction:
        "Write down the exit cue that protected profit so it can be repeated intentionally.",
      evidenceSource: "saved after-exit chart findings",
      tone: "success",
    });
  }

  if (exitLevelStrengthCount > 0) {
    evidence.push({
      id: "session-level-strengths",
      title: "Level-aware exits helped",
      detail: `${exitLevelStrengthCount} support/resistance exit strength${
        exitLevelStrengthCount === 1 ? "" : "s"
      } were saved for this session.`,
      reviewAction:
        "Review the strongest level-aware exit and save the support or resistance cue that made it work.",
      evidenceSource: "saved support/resistance findings",
      tone: "success",
    });
  }

  if (volumeStrengthCount > 0) {
    evidence.push({
      id: "session-volume-strengths",
      title: "Volume confirmed later attempts",
      detail: `${volumeStrengthCount} same-symbol volume strength${
        volumeStrengthCount === 1 ? "" : "s"
      } were saved for this session.`,
      reviewAction:
        "Compare the later entry volume with the first push and save what made the re-entry fresh.",
      evidenceSource: "saved volume comparison findings",
      tone: "success",
    });
  }

  if (addQualityStrengthCount > 0) {
    evidence.push({
      id: "session-add-strengths",
      title: "Adds followed strength",
      detail: `${addQualityStrengthCount} add-quality strength${
        addQualityStrengthCount === 1 ? "" : "s"
      } were saved for this session.`,
      reviewAction:
        "Save the add cue that showed the trade had repaired or was still strong before size increased.",
      evidenceSource: "saved add-quality findings",
      tone: "success",
    });
  }

  if (bestThread) {
    evidence.push({
      id: "session-best-thread",
      title: "Best ticker story",
      detail: `${userFacingTradeSymbol(bestThread.symbol)} contributed ${formatSigned(bestThread.totalGrossRealizedPnl)}.`,
      reviewAction:
        "Write down what was repeatable in this ticker story before reviewing the weaker spots.",
      evidenceSource: "saved P/L by ticker story",
      tone: "success",
    });
  }

  if (worstThread && worstThread.id !== bestThread?.id) {
    evidence.push({
      id: "session-worst-thread",
      title: "Weakest ticker story",
      detail: `${userFacingTradeSymbol(worstThread.symbol)} finished ${formatSigned(worstThread.totalGrossRealizedPnl)}.`,
      reviewAction:
        "Open this ticker story and compare its entries, exits, adds, and re-entries to the session plan.",
      evidenceSource: "saved P/L by ticker story",
      tone: worstThread.totalGrossRealizedPnl < 0 ? "danger" : "info",
    });
  }

  const storyCopy: Record<
    SavedTradeSessionStoryKind,
    Pick<
      SavedTradeSessionStory,
      "reviewPrompt" | "storyDetail" | "storyLabel"
    >
  > = {
    green_to_red_session: {
      storyLabel: "Green-to-red session",
      storyDetail: `The session reached ${formatSigned(peakCumulativePnl)} before finishing ${formatSigned(totalGrossRealizedPnl)}.`,
      reviewPrompt:
        "Find the point where the day changed and decide what rule would have stopped the next weaker attempt.",
    },
    same_symbol_many_attempts: {
      storyLabel: "Many attempts on one ticker",
      storyDetail: sameSymbolThread
        ? `${userFacingTradeSymbol(sameSymbolThread.symbol)} had ${sameSymbolThread.roundTripCount} round trips, so review whether later entries were fresh setups or repeat attempts.`
        : "A same-symbol thread needs review before using the session result as the whole story.",
      reviewPrompt:
        "Compare the first entry with each later re-entry and mark which ones had a fresh reason.",
    },
    session_high_trade_count: {
      storyLabel: "High trade-count session",
      storyDetail: `${tradeCount} round trips across ${symbolCount} symbol${symbolCount === 1 ? "" : "s"} were saved for this session.`,
      reviewPrompt:
        "Check whether the number of trades helped the session or made decisions harder after the first result.",
    },
    open_or_swing_review: {
      storyLabel: "Open or swing exposure to review",
      storyDetail:
        "At least one ticker story stayed open or carried beyond the intraday session.",
      reviewPrompt:
        "Review the hold decision separately from the original entry and write the plan that justified carrying it.",
    },
    strengths_to_repeat_session: {
      storyLabel: "Strengths to repeat session",
      storyDetail: `The session finished ${formatSigned(
        totalGrossRealizedPnl,
      )} with ${marketContextStrengthCount} evidence-backed strength${
        marketContextStrengthCount === 1 ? "" : "s"
      } to preserve.`,
      reviewPrompt:
        "Choose the clearest strength from the day and turn it into a repeatable rule.",
    },
    positive_controlled_session: {
      storyLabel: "Positive session to repeat",
      storyDetail: `The session finished ${formatSigned(totalGrossRealizedPnl)} across ${tradeCount} round trip${tradeCount === 1 ? "" : "s"}.`,
      reviewPrompt:
        "Identify what was controlled enough to repeat, especially entries, reductions, and final exits.",
    },
    mixed_session_review: {
      storyLabel: "Mixed session to review",
      storyDetail: `The session finished ${formatSigned(totalGrossRealizedPnl)} across ${tradeCount} round trip${tradeCount === 1 ? "" : "s"}.`,
      reviewPrompt:
        "Review the strongest and weakest ticker stories before creating a rule from the day.",
    },
  };
  const story = storyCopy[storyKind];

  return {
    id: `${args.sessionDate}:session-story`,
    sessionDate: args.sessionDate,
    storyKind,
    storyLabel: story.storyLabel,
    storyDetail: story.storyDetail,
    reviewPrompt: story.reviewPrompt,
    fixFirstAction:
      evidence.find((item) => item.tone === "danger")?.reviewAction ??
      evidence.find((item) => item.tone === "warning")?.reviewAction ??
      evidence[0]?.reviewAction ??
      "Review the strongest and weakest ticker stories before creating a rule from the day.",
    tradeCount,
    symbolCount,
    multiRoundTripThreadCount: multiRoundTripThreads.length,
    repeatedLossThreadCount,
    profitGivebackThreadCount,
    openOrSwingThreadCount,
    marketContextStrengthCount,
    protectedProfitBeforeFadeFindingCount,
    exitLevelStrengthCount,
    volumeStrengthCount,
    addQualityStrengthCount,
    totalGrossRealizedPnl,
    peakCumulativePnl: roundMetric(peakCumulativePnl),
    givebackFromPeak,
    bestThread,
    worstThread,
    priorityThread,
    tickerSummaries,
    reviewEvidence: evidence,
    daySessionHref: `/trades/day-session/${encodeURIComponent(args.sessionDate)}`,
    href: priorityThread?.href ?? "/analytics",
  };
}

function buildSessionStories(
  threads: SavedTradeThread[],
): SavedTradeSessionStory[] {
  const groups = new Map<string, SavedTradeThread[]>();

  threads.forEach((thread) => {
    const current = groups.get(thread.sessionDate) ?? [];
    current.push(thread);
    groups.set(thread.sessionDate, current);
  });

  return [...groups.entries()]
    .map(([sessionDate, sessionThreads]) =>
      buildSessionStory({
        sessionDate,
        threads: sessionThreads,
      }),
    )
    .sort((left, right) => {
      const priorityDelta =
        sessionStoryPriority(left.storyKind) -
        sessionStoryPriority(right.storyKind);

      if (priorityDelta !== 0) {
        return priorityDelta;
      }

      if (Math.abs(right.givebackFromPeak) !== Math.abs(left.givebackFromPeak)) {
        return Math.abs(right.givebackFromPeak) - Math.abs(left.givebackFromPeak);
      }

      if (Math.abs(right.totalGrossRealizedPnl) !== Math.abs(left.totalGrossRealizedPnl)) {
        return (
          Math.abs(right.totalGrossRealizedPnl) -
          Math.abs(left.totalGrossRealizedPnl)
        );
      }

      return right.sessionDate.localeCompare(left.sessionDate);
    });
}

export function buildSavedTradeThreadReadModel(args: {
  decisionReviewSnapshots?: SavedTradeThreadDecisionReviewSnapshot[];
  report: SavedTraderAnalyticsReport | null;
  source?: "saved_sqlite" | "sample";
  trades: SavedExecutionTrade[];
}): SavedTradeThreadReadModel {
  const reportRows = reportRowsByTradeId(args.report);
  const reviewSnapshots = snapshotsByTradeId(args.decisionReviewSnapshots);
  const groups = new Map<string, SavedExecutionTrade[]>();

  args.trades.forEach((trade) => {
    const key = `${trade.symbol}:${trade.sessionDate}`;
    const current = groups.get(key) ?? [];
    current.push(trade);
    groups.set(key, current);
  });

  const threads = [...groups.entries()].map(([id, trades]) => {
    const orderedTrades = [...trades].sort((left, right) => {
      const leftTime = Date.parse(timeOfFirstExecution(left) ?? "");
      const rightTime = Date.parse(timeOfFirstExecution(right) ?? "");
      return (Number.isNaN(leftTime) ? 0 : leftTime) - (Number.isNaN(rightTime) ? 0 : rightTime);
    });
    const roundTrips = orderedTrades.map<SavedTradeThreadRoundTrip>((trade, index) => {
      const row = reportRows.get(trade.id);
      const reviewSnapshot = reviewSnapshots.get(trade.id);
      const previousTrade = index > 0 ? orderedTrades[index - 1] : null;
      const previousExitTime = previousTrade ? timeOfLastExecution(previousTrade) : null;
      const lifecycleStatus = row?.isOpenPosition ? "open" : tradeLifecycle(trade);
      const entryTime = timeOfFirstExecution(trade);
      const exitTime = lifecycleStatus === "closed" ? timeOfLastExecution(trade) : null;
      const entrySessionDate =
        row?.entrySessionDateEt ?? trade.entrySessionDateEt ?? trade.sessionDate;
      const exitSessionDate = exitTime
        ? sessionDateEt(exitTime, trade.sessionDate)
        : null;
      const heldOvernight = Boolean(
        row?.heldOvernight ||
          row?.heldPostmarketIntoOvernight ||
          row?.heldSessionBuckets?.some((bucket) =>
            String(bucket).toLowerCase().includes("overnight"),
          ),
      );
      const crossedSessionDate =
        exitSessionDate !== null && exitSessionDate !== entrySessionDate;

      return {
        id: `${trade.id}:thread-round-trip`,
        tradeId: trade.id,
        symbol: trade.symbol,
        sequence: index + 1,
        roleLabel: index === 0 ? "First push" : `Re-entry ${index}`,
        entryTime,
        exitTime,
        entrySessionDate,
        exitSessionDate,
        entryHourLabelEt: trade.entryHourLabelEt ?? "hour n/a",
        grossRealizedPnl:
          typeof row?.grossRealizedPnl === "number"
            ? row.grossRealizedPnl
            : null,
        pnlDeltaFromPrevious: null,
        chartContextStatus: reviewSnapshot ? "available" : "waiting",
        chartContextSummary: reviewSnapshot
          ? `${reviewSnapshot.review.insights.length} saved chart insight${
              reviewSnapshot.review.insights.length === 1 ? "" : "s"
            }`
          : "Chart data still missing",
        decisionReviewInsightCount: reviewSnapshot?.review.insights.length ?? 0,
        executionCount: trade.request.executions.length,
        lifecycleStatus,
        heldOvernight,
        crossedSessionDate,
        minutesSincePreviousExit: minutesBetween(previousExitTime, entryTime),
        href: `/trades/${encodeURIComponent(trade.id)}#execution`,
      };
    });
    const roundTripsWithDeltas = roundTrips.map((roundTrip, index) => {
      const previous = index > 0 ? roundTrips[index - 1] : null;
      const pnlDeltaFromPrevious =
        typeof roundTrip.grossRealizedPnl === "number" &&
        typeof previous?.grossRealizedPnl === "number"
          ? roundMetric(roundTrip.grossRealizedPnl - previous.grossRealizedPnl)
          : null;

      return {
        ...roundTrip,
        pnlDeltaFromPrevious,
      };
    });
    const closedRoundTrips = roundTrips.filter(
      (roundTrip) => roundTrip.lifecycleStatus === "closed",
    );
    const pnlValues = roundTripsWithDeltas
      .map((roundTrip) => roundTrip.grossRealizedPnl)
      .filter((value): value is number => typeof value === "number");
    const totalGrossRealizedPnl = roundMetric(
      pnlValues.reduce((total, value) => total + value, 0),
    );
    const bestRoundTrip =
      closedRoundTrips
        .filter((roundTrip) => typeof roundTrip.grossRealizedPnl === "number")
        .sort((left, right) => (right.grossRealizedPnl ?? 0) - (left.grossRealizedPnl ?? 0))[0] ??
      null;
    const worstRoundTrip =
      closedRoundTrips
        .filter((roundTrip) => typeof roundTrip.grossRealizedPnl === "number")
        .sort((left, right) => (left.grossRealizedPnl ?? 0) - (right.grossRealizedPnl ?? 0))[0] ??
      null;
    let running = 0;
    let peakCumulativePnl = 0;

    pnlValues.forEach((value) => {
      running += value;
      peakCumulativePnl = Math.max(peakCumulativePnl, running);
    });

    const laterRoundTripPnl = roundMetric(
      pnlValues.slice(1).reduce((total, value) => total + value, 0),
    );
    const givebackFromPeak = roundMetric(
      peakCumulativePnl > 0
        ? Math.max(0, peakCumulativePnl - totalGrossRealizedPnl)
        : 0,
    );
    const lifecycle = classifyThreadLifecycle({
      roundTrips,
      sessionDateCount: new Set(roundTrips.map((roundTrip) => roundTrip.entrySessionDate))
        .size,
    });
    const story = buildStory({
      best: bestRoundTrip,
      givebackFromPeak,
      laterRoundTripPnl,
      lifecycleClassification: lifecycle.lifecycleClassification,
      peakCumulativePnl,
      roundTrips: roundTripsWithDeltas,
      totalGrossRealizedPnl,
    });
    const threadDecisionReviewSnapshots = roundTripsWithDeltas
      .map((roundTrip) => reviewSnapshots.get(roundTrip.tradeId))
      .filter(
        (
          snapshot,
        ): snapshot is SavedTradeThreadDecisionReviewSnapshot =>
          Boolean(snapshot),
      );
    const marketContextFindings = [
      ...buildMarketContextFindings(threadDecisionReviewSnapshots),
      ...buildReentryVolumeComparisonFindings({
        roundTrips: roundTripsWithDeltas,
        snapshotsByTradeId: reviewSnapshots,
      }),
    ];
    const reviewEvidence = buildReviewEvidence({
      best: bestRoundTrip,
      decisionReviewSnapshots: threadDecisionReviewSnapshots,
      givebackFromPeak,
      laterRoundTripPnl,
      lifecycleClassification: lifecycle.lifecycleClassification,
      marketContextFindings,
      peakCumulativePnl: roundMetric(peakCumulativePnl),
      roundTrips: roundTripsWithDeltas,
      totalGrossRealizedPnl,
      worst: worstRoundTrip,
    });
    const certifiedMarketContextFindings = marketContextFindings.filter(
      (finding) => finding.canDrivePrimaryConclusion,
    );
    const addQualityFindings = marketContextFindings.filter(isAddQualityFinding);
    const certifiedAddQualityFindings = addQualityFindings.filter(
      (finding) => finding.canDrivePrimaryConclusion,
    );
    const postExitFindings = marketContextFindings.filter(isPostExitFinding);
    const protectedProfitBeforeFadeFindings = marketContextFindings.filter(
      isProtectedProfitBeforeFadeFinding,
    );
    const exitLevelFindings = marketContextFindings.filter(isExitLevelFinding);
    const volumeFindings = marketContextFindings.filter(isVolumeFinding);
    const priorityFindings = priorityMarketContextFindings(
      marketContextFindings,
    );

    return {
      id,
      symbol: orderedTrades[0]?.symbol ?? "Unknown",
      sessionDate: orderedTrades[0]?.sessionDate ?? "unknown",
      roundTripCount: roundTrips.length,
      closedRoundTripCount: closedRoundTrips.length,
      openRoundTripCount: roundTrips.length - closedRoundTrips.length,
      totalGrossRealizedPnl,
      firstEntryTime: roundTripsWithDeltas[0]?.entryTime ?? null,
      lastExitTime: [...roundTripsWithDeltas].reverse().find((roundTrip) => roundTrip.exitTime)?.exitTime ?? null,
      bestRoundTrip,
      worstRoundTrip,
      roundTrips: roundTripsWithDeltas,
      laterRoundTripPnl,
      peakCumulativePnl: roundMetric(peakCumulativePnl),
      givebackFromPeak,
      ...lifecycle,
      ...reviewEvidence,
      marketContextFindings,
      priorityMarketContextFindings: priorityFindings,
      marketContextFindingCount: marketContextFindings.length,
      marketContextRiskCount: certifiedMarketContextFindings.filter(
        (finding) => finding.opportunityType === "risk_to_reduce",
      ).length,
      marketContextStrengthCount: certifiedMarketContextFindings.filter(
        (finding) => finding.opportunityType === "strength_to_repeat",
      ).length,
      marketContextReviewPromptCount: marketContextFindings.filter(
        (finding) => finding.opportunityType === "review_prompt",
      ).length,
      addQualityFindingCount: addQualityFindings.length,
      addQualityRiskCount: certifiedAddQualityFindings.filter(
        (finding) => finding.opportunityType === "risk_to_reduce",
      ).length,
      addQualityStrengthCount: certifiedAddQualityFindings.filter(
        (finding) => finding.opportunityType === "strength_to_repeat",
      ).length,
      addQualityReviewPromptCount: addQualityFindings.filter(
        (finding) => finding.opportunityType === "review_prompt",
      ).length,
      postExitFindingCount: postExitFindings.length,
      postExitRiskCount: riskCount(postExitFindings),
      postExitStrengthCount: strengthCount(postExitFindings),
      postExitReviewPromptCount: reviewPromptCount(postExitFindings),
      protectedProfitBeforeFadeFindingCount:
        protectedProfitBeforeFadeFindings.length,
      exitLevelFindingCount: exitLevelFindings.length,
      exitLevelRiskCount: riskCount(exitLevelFindings),
      exitLevelStrengthCount: strengthCount(exitLevelFindings),
      exitLevelReviewPromptCount: reviewPromptCount(exitLevelFindings),
      levelFindingCount: marketContextFindings.filter(isLevelFinding).length,
      volumeFindingCount: volumeFindings.length,
      volumeRiskCount: riskCount(volumeFindings),
      volumeStrengthCount: strengthCount(volumeFindings),
      volumeReviewPromptCount: reviewPromptCount(volumeFindings),
      ...story,
      href: `/trades/ticker-story/${encodeURIComponent(id)}`,
    } satisfies SavedTradeThread;
  });

  const sortedThreads = threads.sort((left, right) => {
    if (right.roundTripCount !== left.roundTripCount) {
      return right.roundTripCount - left.roundTripCount;
    }

    if (Math.abs(right.totalGrossRealizedPnl) !== Math.abs(left.totalGrossRealizedPnl)) {
      return Math.abs(right.totalGrossRealizedPnl) - Math.abs(left.totalGrossRealizedPnl);
    }

    return left.symbol.localeCompare(right.symbol);
  });
  const sessionStories = buildSessionStories(sortedThreads);
  const allMarketContextFindings = sortedThreads.flatMap(
    (thread) => thread.marketContextFindings,
  );
  const certifiedMarketContextFindings = allMarketContextFindings.filter(
    (finding) => finding.canDrivePrimaryConclusion,
  );
  const allAddQualityFindings = allMarketContextFindings.filter(
    isAddQualityFinding,
  );
  const certifiedAddQualityFindings = allAddQualityFindings.filter(
    (finding) => finding.canDrivePrimaryConclusion,
  );
  const allPostExitFindings = allMarketContextFindings.filter(isPostExitFinding);
  const allProtectedProfitBeforeFadeFindings = allMarketContextFindings.filter(
    isProtectedProfitBeforeFadeFinding,
  );
  const allExitLevelFindings = allMarketContextFindings.filter(
    isExitLevelFinding,
  );
  const allLevelFindings = allMarketContextFindings.filter(isLevelFinding);
  const allVolumeFindings = allMarketContextFindings.filter(isVolumeFinding);

  return {
    contractVersion: "saved_trade_thread_read_model_v1",
    source: args.source ?? "saved_sqlite",
    threadCount: sortedThreads.length,
    multiRoundTripThreadCount: sortedThreads.filter(
      (thread) => thread.roundTripCount > 1,
    ).length,
    sessionStoryCount: sessionStories.length,
    strengthsToRepeatSessionCount: sessionStories.filter(
      (story) => story.storyKind === "strengths_to_repeat_session",
    ).length,
    greenToRedSessionCount: sessionStories.filter(
      (story) => story.storyKind === "green_to_red_session",
    ).length,
    sameSymbolManyAttemptsSessionCount: sessionStories.filter(
      (story) => story.storyKind === "same_symbol_many_attempts",
    ).length,
    highTradeCountSessionCount: sessionStories.filter(
      (story) => story.storyKind === "session_high_trade_count",
    ).length,
    marketContextFindingCount: allMarketContextFindings.length,
    marketContextRiskCount: certifiedMarketContextFindings.filter(
      (finding) => finding.opportunityType === "risk_to_reduce",
    ).length,
    marketContextStrengthCount: certifiedMarketContextFindings.filter(
      (finding) => finding.opportunityType === "strength_to_repeat",
    ).length,
    marketContextReviewPromptCount: allMarketContextFindings.filter(
      (finding) => finding.opportunityType === "review_prompt",
    ).length,
    addQualityFindingCount: allAddQualityFindings.length,
    addQualityRiskCount: certifiedAddQualityFindings.filter(
      (finding) => finding.opportunityType === "risk_to_reduce",
    ).length,
    addQualityStrengthCount: certifiedAddQualityFindings.filter(
      (finding) => finding.opportunityType === "strength_to_repeat",
    ).length,
    addQualityReviewPromptCount: allAddQualityFindings.filter(
      (finding) => finding.opportunityType === "review_prompt",
    ).length,
    postExitFindingCount: allPostExitFindings.length,
    postExitRiskCount: riskCount(allPostExitFindings),
    postExitStrengthCount: strengthCount(allPostExitFindings),
    postExitReviewPromptCount: reviewPromptCount(allPostExitFindings),
    protectedProfitBeforeFadeFindingCount:
      allProtectedProfitBeforeFadeFindings.length,
    exitLevelFindingCount: allExitLevelFindings.length,
    exitLevelRiskCount: riskCount(allExitLevelFindings),
    exitLevelStrengthCount: strengthCount(allExitLevelFindings),
    exitLevelReviewPromptCount: reviewPromptCount(allExitLevelFindings),
    levelFindingCount: allLevelFindings.length,
    volumeFindingCount: allVolumeFindings.length,
    volumeRiskCount: riskCount(allVolumeFindings),
    volumeStrengthCount: strengthCount(allVolumeFindings),
    volumeReviewPromptCount: reviewPromptCount(allVolumeFindings),
    threadWithAddQualityFindingCount: sortedThreads.filter(
      (thread) => thread.addQualityFindingCount > 0,
    ).length,
    threadWithMarketContextFindingCount: sortedThreads.filter(
      (thread) => thread.marketContextFindingCount > 0,
    ).length,
    threadWithPostExitFindingCount: sortedThreads.filter(
      (thread) => thread.postExitFindingCount > 0,
    ).length,
    threadWithPostExitRiskCount: sortedThreads.filter(
      (thread) => thread.postExitRiskCount > 0,
    ).length,
    threadWithPostExitStrengthCount: sortedThreads.filter(
      (thread) => thread.postExitStrengthCount > 0,
    ).length,
    threadWithProtectedProfitBeforeFadeFindingCount: sortedThreads.filter(
      (thread) => thread.protectedProfitBeforeFadeFindingCount > 0,
    ).length,
    threadWithExitLevelFindingCount: sortedThreads.filter(
      (thread) => thread.exitLevelFindingCount > 0,
    ).length,
    threadWithExitLevelRiskCount: sortedThreads.filter(
      (thread) => thread.exitLevelRiskCount > 0,
    ).length,
    threadWithExitLevelStrengthCount: sortedThreads.filter(
      (thread) => thread.exitLevelStrengthCount > 0,
    ).length,
    threadWithLevelFindingCount: sortedThreads.filter(
      (thread) => thread.levelFindingCount > 0,
    ).length,
    threadWithVolumeFindingCount: sortedThreads.filter(
      (thread) => thread.volumeFindingCount > 0,
    ).length,
    threadWithVolumeRiskCount: sortedThreads.filter(
      (thread) => thread.volumeRiskCount > 0,
    ).length,
    threadWithVolumeStrengthCount: sortedThreads.filter(
      (thread) => thread.volumeStrengthCount > 0,
    ).length,
    threads: sortedThreads,
    sessionStories,
  };
}
