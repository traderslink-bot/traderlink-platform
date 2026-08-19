import "server-only";

import { createHmac } from "node:crypto";

import type Database from "better-sqlite3";
import Decimal from "decimal.js";

import type {
  CoachAiReviewCadence,
  CoachAiReviewCalculationSource,
  CoachAiReviewCalculationSourceSnapshot,
  CoachAiReviewIssuedFocusTarget,
  CoachAiReviewIssuedNarrativeContext,
  CoachAiReviewSourceNote,
  CoachAiReviewSourcePresetEvidenceEvent,
  CoachAiReviewSourceRule,
  CoachAiReviewSourceTrade,
} from "../contracts/coach-ai-review-insight-contracts";
import {
  COACH_AI_REVIEW_CALCULATION_SOURCE_VERSION,
  COACH_AI_REVIEW_INSIGHT_ENGINE_VERSION,
  COACH_AI_REVIEW_PROMPT_SAFE_REFERENCE_VERSION,
} from "../contracts/coach-ai-review-insight-contracts";
import type { WorkspaceAccessScope } from
  "@/src/modules/platform/contracts/workspace-access-scope";
import { narrowWorkspaceAccessToAccount } from
  "@/src/modules/platform/contracts/workspace-access-scope";
import { JournalAnalyticsFactSetRepository } from
  "@/src/modules/journal/server/analytics/journal-analytics-fact-set-repository";
import { JournalRuleRepository } from
  "@/src/modules/journal/server/annotations/journal-rule-repository";
import {
  evaluateJournalPresetRules,
  type JournalPresetRuleEvidenceEvent,
} from "@/src/modules/journal/server/annotations/journal-preset-rule-evaluator";
import { JournalSwingNoteRepository } from
  "@/src/modules/journal/server/swing-notes/journal-swing-note-repository";
import { JournalTradeStyleRepository } from
  "@/src/modules/journal/server/trade-style/journal-trade-style-repository";
import {
  journalAnalyticsLocalTimeFact,
  normalizeJournalAnalyticsFacts,
} from "@/src/modules/journal-analytics/server/normalize-journal-analytics-facts";
import { JournalDashboardReadModelService } from
  "@/src/modules/journal-analytics/server/journal-dashboard-read-model-service";
import type { JournalAnalyticsRoundTripFact } from
  "@/src/modules/journal/contracts/journal-analytics-fact-set";
import type { JournalRuleRecord } from
  "@/src/modules/journal/contracts/journal-annotation-contracts";
import { CoachUsEquitiesReviewCalendarService } from
  "./market-calendar/coach-us-equities-review-calendar-service";
import {
  CoachAiReviewSupplementalEvidenceRepository,
  type CoachAiReviewTradeAnalysisLineage,
} from "./coach-ai-review-supplemental-evidence-repository";
import {
  CoachAiReviewGenerationCompatibilityRepository,
  type CoachAiIssuedReviewRecord,
} from "./coach-ai-review-generation-compatibility";
import {
  deepFreezeCoachAiReviewInsight,
  digestCanonicalCoachAiReviewInsight,
} from "./ai-review-insights/coach-ai-review-insight-canonical";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/u;
const REFERENCE_KIND_PATTERN = /^[a-z][a-z0-9_]{0,47}$/u;
const KEY_VERSION_PATTERN = /^[a-z][a-z0-9_-]{0,47}$/u;
const READ_BATCH_SIZE = 400;
const ExactDecimal = Decimal.clone({
  precision: 160,
  rounding: Decimal.ROUND_HALF_UP,
  toExpNeg: -1000,
  toExpPos: 1000,
});

export type CoachAiReviewPromptSafeReferenceAuthority = Readonly<{
  derivationVersion: typeof COACH_AI_REVIEW_PROMPT_SAFE_REFERENCE_VERSION;
  keyVersion: string;
  reference(input: Readonly<{
    kind: string;
    workspaceId: string;
    accountId: string;
    cadence: CoachAiReviewCadence;
    periodStartDate: string;
    periodEndDate: string;
    privateIdentityParts: readonly (string | number)[];
  }>): string;
}>;

export function createCoachAiReviewPromptSafeReferenceAuthority(input: Readonly<{
  keyVersion: string;
  keyBase64: string;
}>): CoachAiReviewPromptSafeReferenceAuthority {
  if (!KEY_VERSION_PATTERN.test(input.keyVersion)) {
    throw new Error("TRADERLINK_COACH_INSIGHT_REFERENCE_CONFIGURATION_INVALID");
  }
  const key = Buffer.from(input.keyBase64, "base64");
  if (key.length < 32 || key.toString("base64") !== input.keyBase64) {
    throw new Error("TRADERLINK_COACH_INSIGHT_REFERENCE_CONFIGURATION_INVALID");
  }
  return Object.freeze({
    derivationVersion: COACH_AI_REVIEW_PROMPT_SAFE_REFERENCE_VERSION,
    keyVersion: input.keyVersion,
    reference(referenceInput) {
      if (!REFERENCE_KIND_PATTERN.test(referenceInput.kind)) {
        throw new Error("TRADERLINK_COACH_INSIGHT_REFERENCE_KIND_INVALID");
      }
      const digest = createHmac("sha256", key).update(JSON.stringify([
        COACH_AI_REVIEW_PROMPT_SAFE_REFERENCE_VERSION,
        input.keyVersion,
        referenceInput.kind,
        referenceInput.workspaceId,
        referenceInput.accountId,
        referenceInput.cadence,
        referenceInput.periodStartDate,
        referenceInput.periodEndDate,
        referenceInput.privateIdentityParts,
      ]), "utf8").digest("base64url");
      return `${referenceInput.kind}_${input.keyVersion}:${digest}`;
    },
  });
}

export type CoachAiReviewCalculationSourceRequest = Readonly<{
  cadence: CoachAiReviewCadence;
  startDate: string;
  endDate: string;
}>;

type TradingDayNoteRow = Readonly<{
  anything_else: string | null;
  current_revision_id: string | null;
  daily_note_id: string | null;
  revision: number | null;
  technical_recap: string | null;
  tomorrows_focus: string | null;
  trading_date: string;
  trading_day_id: string;
  updated_at_utc: string | null;
  what_needs_work: string | null;
  what_worked: string | null;
}>;

type RoundTripNoteRow = Readonly<{
  current_revision_id: string;
  revision: number;
  round_trip_id: string;
  round_trip_note_id: string;
  technical_note: string;
  trade_note: string;
  updated_at_utc: string;
}>;

type TagRow = Readonly<{
  current_name: string;
  round_trip_id: string;
  tag_id: string;
}>;

type FocusRevisionRow = Readonly<{
  revisionId: string;
  tradingDate: string;
  revisionNumber: number;
  currentFocuses: string;
  createdAtUtc: string;
}>;

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function assertDate(value: string, field: string): void {
  if (!DATE_PATTERN.test(value) || new Date(`${value}T12:00:00.000Z`)
    .toISOString().slice(0, 10) !== value) {
    throw new Error(`TRADERLINK_COACH_INSIGHT_INVALID_${field.toUpperCase()}`);
  }
}

function shiftDate(value: string, days: number): string {
  const date = new Date(`${value}T12:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function dateRange(startDate: string, endDate: string): readonly string[] {
  const values: string[] = [];
  for (let value = startDate; value <= endDate; value = shiftDate(value, 1)) {
    values.push(value);
  }
  return Object.freeze(values);
}

function outputContext(
  review: CoachAiIssuedReviewRecord,
  reviewRef: string,
  contextKind: CoachAiReviewIssuedNarrativeContext["contextKind"],
): CoachAiReviewIssuedNarrativeContext {
  return Object.freeze({
    reviewRef,
    contextKind,
    reviewKind: review.reviewKind,
    periodStartDate: review.periodStartDate,
    periodEndDate: review.periodEndDate,
    issuedAtUtc: review.issuedAtUtc,
    statisticalUse: "prohibited",
    focusTrackingAvailability: review.trackedFocusAvailability,
    reviewSummary: review.output.reviewSummary,
    whatImproved: review.output.whatImproved,
    whatHeldYouBack: review.output.whatHeldYouBack,
    focusFollowThrough: review.output.focusFollowThrough,
    nextPeriodFocuses: Object.freeze([...review.output.nextPeriodFocuses]),
    incompleteRecord: review.output.incompleteRecord,
  });
}

function outputFocusTargets(
  review: CoachAiIssuedReviewRecord,
  reviewRef: string,
): readonly CoachAiReviewIssuedFocusTarget[] {
  if (review.trackedFocusAvailability === "legacy_unavailable") {
    return Object.freeze([]);
  }
  return Object.freeze(review.trackedFocuses.map((focus) => Object.freeze({
    focusTargetRef: focus.focusTargetRef,
    sourceReviewRef: reviewRef,
    focusOrdinal: focus.ordinal,
    focusQuestionRef: focus.focusQuestionRef,
    renderedQuestion: focus.renderedQuestion,
    actionTargetKey: focus.actionTargetKey,
    trackingIntent: focus.trackingIntent,
    originatingFindingRef: focus.findingRef,
    originatingFamily: focus.baselineCandidate.family,
    originatingSubjectRef: focus.baselineCandidate.subjectRef,
    sourceEngineVersion: focus.baselineCandidate.engineVersion,
    sourceDigestSha256: focus.sourceDigestSha256,
    sourcePeriodEndDate: review.periodEndDate,
    sourcePeriodFinalMarketSealUtc: focus.sourcePeriodFinalMarketSealUtc,
    sourceIssuedAtUtc: review.issuedAtUtc,
    eligibleLaterEvidenceAtUtc: focus.eligibleLaterEvidenceAtUtc,
    baselineMeasurements: Object.freeze([...focus.baselineCandidate.measurements]),
    baselinePopulationMemberRefs: Object.freeze([
      ...focus.baselineCandidate.populationMemberRefs,
    ]),
    baselineOpportunityMemberRefs: Object.freeze([
      ...focus.baselineCandidate.opportunityMemberRefs,
    ]),
    baselineAffectedMemberRefs: Object.freeze([
      ...focus.baselineCandidate.affectedMemberRefs,
    ]),
    baselineSourceVersionRefs: Object.freeze([...focus.baselineSourceVersionRefs]),
  })));
}

function positionAtBoundary(
  roundTrip: JournalAnalyticsRoundTripFact,
  timezone: string,
  boundaryDate: string,
): Decimal | null {
  let position = new ExactDecimal(0);
  for (const allocation of roundTrip.allocations) {
    if (journalAnalyticsLocalTimeFact(allocation.executedAtUtc, timezone).localDate >
        boundaryDate) continue;
    if (allocation.executionState !== "accepted") return null;
    const quantity = new ExactDecimal(allocation.allocatedQuantityDecimal);
    position = allocation.side === "buy"
      ? position.plus(quantity)
      : position.minus(quantity);
  }
  return position;
}

function ruleIntersectsDay(
  rule: JournalRuleRecord,
  dayStartUtc: string,
  dayEndUtc: string,
): boolean {
  return rule.effectiveFromUtc < dayEndUtc &&
    (!rule.effectiveUntilUtc || rule.effectiveUntilUtc > dayStartUtc) &&
    (rule.activeIntervals ?? []).some((interval) =>
      interval.fromUtc < dayEndUtc && (!interval.untilUtc || interval.untilUtc > dayStartUtc));
}

export class CoachAiReviewInsightRepository {
  constructor(
    private readonly database: Database.Database,
    private readonly references: CoachAiReviewPromptSafeReferenceAuthority,
    private readonly now: () => Date = () => new Date(),
    private readonly calendar = new CoachUsEquitiesReviewCalendarService(),
  ) {}

  readCalculationSourceSnapshot(
    scope: WorkspaceAccessScope,
    request: CoachAiReviewCalculationSourceRequest,
  ): CoachAiReviewCalculationSourceSnapshot {
    assertDate(request.startDate, "start_date");
    assertDate(request.endDate, "end_date");
    if (request.endDate < request.startDate) {
      throw new Error("TRADERLINK_COACH_INSIGHT_INVALID_PERIOD");
    }
    const operation = () => this.buildCalculationSourceSnapshot(scope, request);
    return this.database.inTransaction
      ? operation()
      : this.database.transaction(operation).deferred();
  }

  private buildCalculationSourceSnapshot(
    scope: WorkspaceAccessScope,
    request: CoachAiReviewCalculationSourceRequest,
  ): CoachAiReviewCalculationSourceSnapshot {
    const accountId = scope.activeAccountId;
    if (!accountId || !scope.allowedAccountIds.includes(accountId)) {
      throw new Error("TRADERLINK_ACCOUNT_ACCESS_DENIED");
    }
    const accountScope = narrowWorkspaceAccessToAccount(scope, accountId);
    const frozenAtUtc = this.now().toISOString();
    const ref = (kind: string, ...privateIdentityParts: readonly (string | number)[]) =>
      this.references.reference({
        kind,
        workspaceId: scope.workspaceId,
        accountId,
        cadence: request.cadence,
        periodStartDate: request.startDate,
        periodEndDate: request.endDate,
        privateIdentityParts,
      });

    const factSet = new JournalAnalyticsFactSetRepository(
      this.database,
      () => new Date(frozenAtUtc),
    ).read(scope, {
      accountIds: Object.freeze([accountId]),
      closingDateRange: Object.freeze({ kind: "all_available" }),
      currencySelection: Object.freeze({ kind: "all_partitions" }),
    });
    const normalized = normalizeJournalAnalyticsFacts(factSet);
    const account = factSet.accounts[0];
    if (!account || account.accountId !== accountId ||
        account.tradingTimezone !== "America/New_York") {
      throw new Error("TRADERLINK_COACH_INSIGHT_ACCOUNT_SCOPE_MISMATCH");
    }
    const closedRows = normalized.realizedRows.filter((row) =>
      row.closeLocal.localDate >= request.startDate &&
      row.closeLocal.localDate <= request.endDate)
      .sort((left, right) => compareText(
        left.closeLocal.localDate,
        right.closeLocal.localDate,
      ) || compareText(left.closedAtUtc, right.closedAtUtc) ||
        compareText(left.roundTripId, right.roundTripId));
    const roundTripById = new Map(factSet.roundTrips.map((roundTrip) =>
      [roundTrip.roundTripId, roundTrip] as const));
    const tradeRefByRoundTrip = new Map(closedRows.map((row) => [
      row.roundTripId,
      ref("trade", row.roundTripId, row.roundTripVersionId),
    ] as const));
    const roundTripIds = closedRows.map((row) => row.roundTripId);

    const styleRepository = new JournalTradeStyleRepository(this.database);
    const stylesByRoundTrip = new Map(styleRepository.listPlans(accountScope, roundTripIds)
      .map((style) => [style.roundTripId, style] as const));
    const swingNotesByRoundTrip = new Map<string, ReturnType<
      JournalSwingNoteRepository["listForRoundTrips"]>[number][]>();
    for (const note of new JournalSwingNoteRepository(this.database).listForRoundTrips(
      accountScope,
      roundTripIds,
      { fromReviewDate: request.startDate, throughReviewDate: request.endDate },
    )) {
      swingNotesByRoundTrip.set(note.roundTripId, [
        ...(swingNotesByRoundTrip.get(note.roundTripId) ?? []),
        note,
      ]);
    }
    const supplemental = new CoachAiReviewSupplementalEvidenceRepository(this.database);
    const analyses = supplemental.readTradeAnalyses(accountScope, roundTripIds);
    const analysisLineage = supplemental.readTradeAnalysisLineage(accountScope, roundTripIds);
    const roundTripNotes = this.readRoundTripNotes(accountScope, roundTripIds);
    const tags = this.readTags(accountScope, roundTripIds);

    const trades: CoachAiReviewSourceTrade[] = closedRows.map((row) => {
      const roundTrip = roundTripById.get(row.roundTripId);
      const tradeRef = tradeRefByRoundTrip.get(row.roundTripId);
      if (!roundTrip || !tradeRef) {
        throw new Error("TRADERLINK_COACH_INSIGHT_TRADE_LINEAGE_MISMATCH");
      }
      const style = stylesByRoundTrip.get(row.roundTripId) ?? null;
      const tradeNote = roundTripNotes.get(row.roundTripId) ?? null;
      const lineage: CoachAiReviewTradeAnalysisLineage | undefined =
        analysisLineage[row.roundTripId];
      const analysisRef = lineage?.analysisVersionId
        ? ref("analysis", row.roundTripId, lineage.analysisVersionId,
            lineage.analyzedRoundTripVersionId ?? "missing")
        : null;
      const sourceSwingNotes: CoachAiReviewSourceNote[] = (
        swingNotesByRoundTrip.get(row.roundTripId) ?? []
      ).map((note) => Object.freeze({
        noteRef: ref("swing_note", note.swingDailyNoteId, note.revision,
          note.roundTripId, note.reviewDate),
        revision: note.revision,
        noteKind: "swing" as const,
        reviewDate: note.reviewDate,
        text: note.note,
        technicalText: null,
        nextSessionPlan: note.nextSessionPlan,
        updatedAtUtc: note.updatedAtUtc,
      }));
      return Object.freeze({
        tradeRef,
        instrumentRef: ref("instrument", roundTrip.instrumentId),
        marketDate: row.closeLocal.localDate,
        entryMarketDate: row.entryLocal.localDate,
        ticker: row.displayedSymbol,
        currency: row.tradeCurrency,
        direction: row.direction,
        openedAtUtc: row.openedAtUtc,
        closedAtUtc: row.closedAtUtc,
        holdingDurationMilliseconds: row.holdingDurationMilliseconds,
        objectiveTiming: row.entryLocal.localDate === row.closeLocal.localDate
          ? "same_market_date" as const
          : "multi_market_date" as const,
        grossPnlDecimal: row.grossPnlDecimal,
        netPnlDecimal: row.netPnlDecimal,
        executionEvents: Object.freeze(roundTrip.allocations.map((allocation) =>
          Object.freeze({
            eventRef: ref("execution_event", row.roundTripId,
              row.roundTripVersionId, allocation.executionVersionId,
              allocation.allocationId, allocation.allocationSequence),
            sequence: allocation.allocationSequence,
            role: allocation.allocationRole,
            executedAtUtc: allocation.executedAtUtc,
            side: allocation.side,
            priceDecimal: allocation.priceDecimal,
          }))),
        tradeStyle: style ? Object.freeze({
          styleRef: ref("trade_style", style.stylePlanId, style.revision,
            style.roundTripId, style.roundTripVersionId),
          revision: style.revision,
          tradeStyle: style.tradeStyle,
          openStatus: style.openStatus,
          plannedFromEntry: style.plannedFromEntry,
          claimedEffectiveAtUtc: style.claimedEffectiveAtUtc,
          declaredAtUtc: style.declaredAtUtc,
          lifecycleState: style.lifecycleState,
          linkedRoundTripVersionCurrent:
            style.roundTripVersionId === row.roundTripVersionId,
        }) : null,
        tags: Object.freeze((tags.get(row.roundTripId) ?? [])
          .map((tag) => tag.current_name).sort()),
        tradeNote: tradeNote ? Object.freeze({
          noteRef: ref("trade_note", tradeNote.round_trip_note_id,
            tradeNote.current_revision_id, tradeNote.revision, row.roundTripId),
          revision: tradeNote.revision,
          noteKind: "trade" as const,
          reviewDate: null,
          text: tradeNote.trade_note,
          technicalText: tradeNote.technical_note,
          nextSessionPlan: null,
          updatedAtUtc: tradeNote.updated_at_utc,
        }) : null,
        swingNotes: Object.freeze(sourceSwingNotes),
        analyzer: Object.freeze({
          analysisRef,
          linkedRoundTripVersionCurrent:
            lineage?.linkedRoundTripVersionCurrent ?? false,
          analysis: analyses[row.roundTripId] ?? Object.freeze({
            availability: "unavailable" as const,
            unavailableReason: "missing" as const,
            analyzerContractVersion: null,
            events: Object.freeze([]),
            greenToRed: null,
            finalExitPaths: Object.freeze([]),
          }),
        }),
      });
    });

    const dayRows = this.readTradingDayNotes(accountScope, request);
    const dayRowByDate = new Map(dayRows.map((row) => [row.trading_date, row] as const));
    const openDates = dateRange(request.startDate, request.endDate).filter((date) =>
      this.calendar.session(date).state === "open");
    const dayRefByDate = new Map(openDates.map((marketDate) => {
      const row = dayRowByDate.get(marketDate);
      return [marketDate, ref("trading_day", row?.trading_day_id ?? "not_created", marketDate)] as const;
    }));
    const days = openDates.map((marketDate) => {
      const session = this.calendar.session(marketDate);
      const row = dayRowByDate.get(marketDate) ?? null;
      const tradeRefs = trades.filter((trade) => trade.marketDate === marketDate)
        .map((trade) => trade.tradeRef);
      return Object.freeze({
        dayRef: dayRefByDate.get(marketDate)!,
        marketDate,
        dayStartUtc: this.calendar.easternWallClockAtUtc(marketDate, "00:00"),
        dayEndUtc: this.calendar.easternWallClockAtUtc(shiftDate(marketDate, 1), "00:00"),
        marketSessionKind: session.sessionKind as "normal" | "scheduled_early_close",
        tradeRefs: Object.freeze(tradeRefs),
        dailyNote: row?.daily_note_id && row.current_revision_id && row.revision !== null
          ? Object.freeze({
              noteRef: ref("daily_note", row.daily_note_id,
                row.current_revision_id, row.revision, row.trading_day_id),
              revision: row.revision,
              whatWorked: row.what_worked ?? "",
              whatNeedsWork: row.what_needs_work ?? "",
              technicalRecap: row.technical_recap ?? "",
              tomorrowsFocus: row.tomorrows_focus ?? "",
              anythingElse: row.anything_else ?? "",
              updatedAtUtc: row.updated_at_utc!,
            })
          : null,
      });
    });

    const periodStartUtc = this.calendar.easternWallClockAtUtc(request.startDate, "00:00");
    const periodEndUtc = this.calendar.easternWallClockAtUtc(
      shiftDate(request.endDate, 1),
      "00:00",
    );
    const ruleRepository = new JournalRuleRepository(this.database);
    const earliestRelevantRuleUtc = closedRows.reduce((earliest, row) =>
      row.openedAtUtc < earliest ? row.openedAtUtc : earliest, periodStartUtc);
    const ruleVersions = ruleRepository.listForEvaluation(
      accountScope,
      earliestRelevantRuleUtc,
      periodEndUtc,
    );
    const currentRuleById = new Map(ruleRepository.list(accountScope).map((rule) =>
      [rule.ruleId, rule] as const));
    const ruleRefById = new Map(ruleVersions.map((rule) =>
      [rule.ruleId, ref("rule", rule.ruleId)] as const));
    const ruleVersionRefById = new Map(ruleVersions.map((rule) =>
      [rule.versionId, ref("rule_version", rule.ruleId, rule.versionId,
        rule.versionNumber)] as const));
    const rules: CoachAiReviewSourceRule[] = ruleVersions.map((rule) => {
      const current = currentRuleById.get(rule.ruleId);
      if (!current) throw new Error("TRADERLINK_COACH_INSIGHT_RULE_LINEAGE_MISMATCH");
      return Object.freeze({
        ruleRef: ruleRefById.get(rule.ruleId)!,
        ruleVersionRef: ruleVersionRefById.get(rule.versionId)!,
        sourceKind: rule.sourceKind,
        templateKey: rule.templateKey,
        title: rule.title,
        statement: rule.statement,
        category: rule.category,
        reviewScope: rule.reviewScope,
        isFocus: rule.isFocus,
        configuration: Object.freeze(Object.fromEntries(
          Object.entries(rule.configuration).sort(([left], [right]) =>
            left < right ? -1 : left > right ? 1 : 0),
        )),
        versionNumber: rule.versionNumber,
        effectiveFromUtc: rule.effectiveFromUtc,
        effectiveUntilUtc: rule.effectiveUntilUtc ?? null,
        activeIntervals: Object.freeze((rule.activeIntervals ?? []).map((interval) =>
          Object.freeze({ ...interval }))),
        lifecycleStateAtSnapshot: current.lifecycleState,
        currentVersionAtSnapshot: current.versionId === rule.versionId,
      });
    });

    const tradingDayIdToRef = new Map(dayRows.map((row) =>
      [row.trading_day_id, dayRefByDate.get(row.trading_date)!] as const));
    const ruleReviewRecords = ruleRepository.listReviewsForTargets({
      scope: accountScope,
      tradingDayIds: dayRows.map((row) => row.trading_day_id),
      roundTripIds,
    });
    const savedRuleReviews = ruleReviewRecords.map((review) => {
      const targetRef = review.targetKind === "trading_day"
        ? tradingDayIdToRef.get(review.tradingDayId ?? "")
        : tradeRefByRoundTrip.get(review.roundTripId ?? "");
      const ruleRef = ruleRefById.get(review.ruleId);
      const ruleVersionRef = ruleVersionRefById.get(review.ruleVersionId);
      if (!targetRef || !ruleRef || !ruleVersionRef) {
        throw new Error("TRADERLINK_COACH_INSIGHT_RULE_REVIEW_LINEAGE_MISMATCH");
      }
      return Object.freeze({
        ruleReviewRef: ref("rule_review", review.ruleReviewId, review.revision,
          review.ruleVersionId, review.targetKind,
          review.tradingDayId ?? review.roundTripId ?? "missing"),
        ruleRef,
        ruleVersionRef,
        targetRef,
        targetKind: review.targetKind,
        status: review.status,
        noteRef: review.note.trim().length > 0
          ? ref("rule_note", review.ruleReviewId, review.revision)
          : null,
        note: review.note,
        revision: review.revision,
        updatedAtUtc: review.updatedAtUtc,
      });
    });

    const dashboard = new JournalDashboardReadModelService({
      getJournalAnalyticsFactSet: () => factSet,
    });
    const swingRoundTripIds = new Set([...stylesByRoundTrip.values()]
      .filter((style) => style.tradeStyle === "swing")
      .map((style) => style.roundTripId));
    const presetEvaluations = openDates.flatMap((marketDate) => {
      const dayStartUtc = this.calendar.easternWallClockAtUtc(marketDate, "00:00");
      const dayEndUtc = this.calendar.easternWallClockAtUtc(shiftDate(marketDate, 1), "00:00");
      const applicableRules = ruleVersions.filter((rule) =>
        rule.sourceKind === "template" && ruleIntersectsDay(rule, dayStartUtc, dayEndUtc));
      if (applicableRules.length === 0) return [];
      const model = dashboard.getTradingDay(scope, {
        requestedDate: marketDate,
        currency: account.baseCurrency,
        asOfUtc: frozenAtUtc,
      });
      return evaluateJournalPresetRules(applicableRules, model, swingRoundTripIds)
        .map((evaluation) => {
          const targetRef = evaluation.targetKind === "trading_day"
            ? dayRefByDate.get(marketDate)
            : tradeRefByRoundTrip.get(evaluation.targetRoundTripId ?? "");
          const ruleRef = ruleRefById.get(evaluation.ruleId);
          const ruleVersionRef = ruleVersionRefById.get(evaluation.ruleVersionId);
          if (!targetRef || !ruleRef || !ruleVersionRef) {
            throw new Error("TRADERLINK_COACH_INSIGHT_PRESET_LINEAGE_MISMATCH");
          }
          const mapEvent = (
            event: JournalPresetRuleEvidenceEvent,
            index: number,
          ): CoachAiReviewSourcePresetEvidenceEvent => {
            const tradeRef = tradeRefByRoundTrip.get(event.roundTripId);
            if (!tradeRef) {
              throw new Error("TRADERLINK_COACH_INSIGHT_PRESET_EVENT_LINEAGE_MISMATCH");
            }
            return Object.freeze({
              evidenceEventRef: ref("preset_event", evaluation.ruleId,
                evaluation.ruleVersionId, targetRef, event.kind, index,
                event.occurredAtUtc, event.roundTripId,
                event.valueBefore ?? "null", event.valueAfter ?? "null"),
              kind: event.kind,
              occurredAtUtc: event.occurredAtUtc,
              tradeRef,
              netPnlDecimal: event.netPnlDecimal,
              valueBefore: event.valueBefore,
              valueAfter: event.valueAfter,
            });
          };
          return Object.freeze({
            evaluationRef: ref("preset_evaluation", evaluation.ruleId,
              evaluation.ruleVersionId, targetRef, evaluation.status),
            ruleRef,
            ruleVersionRef,
            targetRef,
            targetKind: evaluation.targetKind,
            status: evaluation.status,
            availabilityReason: evaluation.evidence.availabilityReason,
            feeCoverage: evaluation.evidence.feeCoverage,
            trigger: evaluation.evidence.trigger
              ? mapEvent(evaluation.evidence.trigger, -1)
              : null,
            violations: Object.freeze(evaluation.evidence.violations.map(mapEvent)),
          });
        });
    });

    const allFocusRevisions = this.readFocusRevisions(accountScope, request.endDate);
    const startingFocus = allFocusRevisions.filter((focus) =>
      focus.tradingDate < request.startDate).at(-1) ?? null;
    const focuses = [
      ...(startingFocus ? [startingFocus] : []),
      ...allFocusRevisions.filter((focus) => focus.tradingDate >= request.startDate),
    ].map((focus) => Object.freeze({
      focusRef: ref("focus", focus.revisionId, focus.tradingDate,
        focus.revisionNumber, focus.createdAtUtc),
      effectiveFromDate: focus.tradingDate < request.startDate
        ? request.startDate
        : focus.tradingDate,
      revision: focus.revisionNumber,
      text: focus.currentFocuses,
    }));

    const confirmedOpen = factSet.roundTrips.flatMap((roundTrip) => {
      if (roundTrip.projectionState === "needs_decision") return [];
      const position = positionAtBoundary(roundTrip, account.tradingTimezone, request.endDate);
      if (position === null || position.isZero()) return [];
      const hasReduction = roundTrip.allocations.some((allocation) => {
        const date = journalAnalyticsLocalTimeFact(
          allocation.executedAtUtc,
          account.tradingTimezone,
        ).localDate;
        return date >= request.startDate && date <= request.endDate &&
          ["reducing", "closing", "flip_closing"].includes(allocation.allocationRole);
      });
      return [Object.freeze({
        positionRef: ref("open_position", roundTrip.roundTripId,
          roundTrip.roundTripVersionId, roundTrip.versionNumber),
        hasInPeriodReduction: hasReduction,
      })];
    }).sort((left, right) => compareText(left.positionRef, right.positionRef));

    const reviews = new CoachAiReviewGenerationCompatibilityRepository(this.database);
    const currentPeriodIssued = request.cadence === "monthly"
      ? this.readIssuedReviews(scope, reviews, {
            atOrAfterPeriodEndDate: request.startDate,
            beforePeriodEndDate: shiftDate(request.endDate, 1),
            reviewKinds: ["weekly", "two_week"],
          })
      : [];
    const priorComparable = request.cadence === "monthly"
      ? this.readIssuedReviews(scope, reviews, {
            beforePeriodEndDate: request.startDate,
            reviewKinds: ["monthly"],
            limit: 1,
          })
      : this.readIssuedReviews(scope, reviews, {
          beforePeriodEndDate: request.startDate,
          reviewKinds: ["weekly", "two_week"],
          limit: 1,
        });
    const issued = [...currentPeriodIssued, ...priorComparable];
    const issuedNarrativeContext = [
      ...currentPeriodIssued.map((review) => outputContext(review,
        ref("issued_review", review.issuedReviewId, review.requestId,
          review.periodStartDate, review.periodEndDate), "current_period")),
      ...priorComparable.map((review) => outputContext(review,
        ref("issued_review", review.issuedReviewId, review.requestId,
          review.periodStartDate, review.periodEndDate), "prior_comparable")),
    ].sort((left, right) => compareText(left.periodEndDate, right.periodEndDate) ||
      compareText(left.issuedAtUtc, right.issuedAtUtc));
    const reviewRefById = new Map(issued.map((review) => [
      review.issuedReviewId,
      ref("issued_review", review.issuedReviewId, review.requestId,
        review.periodStartDate, review.periodEndDate),
    ] as const));
    const issuedFocusTargets = issued.flatMap((review) => {
      const reviewRef = reviewRefById.get(review.issuedReviewId);
      if (!reviewRef) throw new Error("TRADERLINK_COACH_INSIGHT_REVIEW_REF_MISSING");
      return outputFocusTargets(review, reviewRef);
    }).sort((left, right) => compareText(left.sourcePeriodEndDate, right.sourcePeriodEndDate) ||
      compareText(left.sourceIssuedAtUtc, right.sourceIssuedAtUtc) ||
      left.focusOrdinal - right.focusOrdinal);

    const source: CoachAiReviewCalculationSource = {
      contractVersion: COACH_AI_REVIEW_CALCULATION_SOURCE_VERSION,
      engineVersion: COACH_AI_REVIEW_INSIGHT_ENGINE_VERSION,
      referenceDerivationVersion: COACH_AI_REVIEW_PROMPT_SAFE_REFERENCE_VERSION,
      frozenAtUtc,
      period: Object.freeze({
        cadence: request.cadence,
        startDate: request.startDate,
        endDate: request.endDate,
        timezone: "America/New_York",
        currency: account.baseCurrency,
      }),
      coverage: Object.freeze({
        readyClosedTradeCount: trades.length,
        moneyCompleteTradeCount: trades.filter((trade) => trade.netPnlDecimal !== null).length,
        needsDecisionRoundTripCount: normalized.needsDecisionRoundTrips.length,
        periodEndConfirmedOpenPositionCount: confirmedOpen.length,
        periodEndOpenWithInPeriodReductionCount: confirmedOpen.filter((position) =>
          position.hasInPeriodReduction).length,
        unrealizedPnlAvailability: "unavailable",
      }),
      days: Object.freeze(days),
      trades: Object.freeze(trades),
      rules: Object.freeze(rules),
      ruleReviews: Object.freeze(savedRuleReviews),
      presetEvaluations: Object.freeze(presetEvaluations),
      focuses: Object.freeze(focuses),
      periodEndOpenPositionRefs: Object.freeze(confirmedOpen.map((position) =>
        position.positionRef)),
      periodEndOpenWithInPeriodReductionRefs: Object.freeze(confirmedOpen
        .filter((position) => position.hasInPeriodReduction)
        .map((position) => position.positionRef)),
      issuedNarrativeContext: Object.freeze(issuedNarrativeContext),
      issuedFocusTargets: Object.freeze(issuedFocusTargets),
    };
    this.assertPromptSafeSource(source, scope, factSet, {
      dayRows,
      ruleVersions,
      ruleReviewRecords,
      styles: [...stylesByRoundTrip.values()],
      swingNotes: [...swingNotesByRoundTrip.values()].flat(),
      analysisLineage: Object.values(analysisLineage),
      issued,
      focusRevisions: allFocusRevisions,
      roundTripNotes: [...roundTripNotes.values()],
      tags: [...tags.values()].flat(),
    });
    const frozenSource = deepFreezeCoachAiReviewInsight(source) as CoachAiReviewCalculationSource;
    const digest = digestCanonicalCoachAiReviewInsight(frozenSource);
    return Object.freeze({
      source: frozenSource,
      canonicalSourceByteLength: digest.byteLength,
      sourceDigestSha256: digest.digestSha256,
    });
  }

  private readTradingDayNotes(
    scope: ReturnType<typeof narrowWorkspaceAccessToAccount>,
    request: CoachAiReviewCalculationSourceRequest,
  ): readonly TradingDayNoteRow[] {
    return Object.freeze(this.database.prepare(`SELECT day.trading_day_id,
  day.trading_date, note.daily_note_id, note.current_revision_id,
  note.revision, revision.what_worked, revision.what_needs_work,
  revision.technical_recap, revision.tomorrows_focus,
  revision.anything_else, note.updated_at_utc
FROM journal_trading_days day
LEFT JOIN journal_daily_notes note
  ON note.workspace_id = day.workspace_id AND note.account_id = day.account_id
 AND note.trading_day_id = day.trading_day_id
LEFT JOIN journal_daily_note_revisions revision
  ON revision.workspace_id = note.workspace_id
 AND revision.account_id = note.account_id
 AND revision.daily_note_id = note.daily_note_id
 AND revision.daily_note_revision_id = note.current_revision_id
WHERE day.workspace_id = ? AND day.account_id = ?
  AND day.trading_date >= ? AND day.trading_date <= ?
  AND day.trading_timezone = 'America/New_York' AND day.status = 'active'
ORDER BY day.trading_date, day.trading_day_id`).all(
      scope.workspaceId,
      scope.accountId,
      request.startDate,
      request.endDate,
    ) as TradingDayNoteRow[]);
  }

  private readRoundTripNotes(
    scope: ReturnType<typeof narrowWorkspaceAccessToAccount>,
    roundTripIds: readonly string[],
  ): ReadonlyMap<string, RoundTripNoteRow> {
    const rows: RoundTripNoteRow[] = [];
    for (let offset = 0; offset < roundTripIds.length; offset += READ_BATCH_SIZE) {
      const batch = roundTripIds.slice(offset, offset + READ_BATCH_SIZE);
      if (batch.length === 0) continue;
      rows.push(...this.database.prepare(`SELECT note.round_trip_note_id,
  note.round_trip_id, note.current_revision_id, note.revision,
  revision.technical_note, revision.trade_note, note.updated_at_utc
FROM journal_round_trip_notes note
JOIN journal_round_trip_note_revisions revision
  ON revision.workspace_id = note.workspace_id
 AND revision.account_id = note.account_id
 AND revision.round_trip_note_id = note.round_trip_note_id
 AND revision.round_trip_note_revision_id = note.current_revision_id
WHERE note.workspace_id = ? AND note.account_id = ?
  AND note.round_trip_id IN (${batch.map(() => "?").join(", ")})
ORDER BY note.round_trip_id`).all(
        scope.workspaceId,
        scope.accountId,
        ...batch,
      ) as RoundTripNoteRow[]);
    }
    return new Map(rows.map((row) => [row.round_trip_id, row] as const));
  }

  private readTags(
    scope: ReturnType<typeof narrowWorkspaceAccessToAccount>,
    roundTripIds: readonly string[],
  ): ReadonlyMap<string, readonly TagRow[]> {
    const rows: TagRow[] = [];
    for (let offset = 0; offset < roundTripIds.length; offset += READ_BATCH_SIZE) {
      const batch = roundTripIds.slice(offset, offset + READ_BATCH_SIZE);
      if (batch.length === 0) continue;
      rows.push(...this.database.prepare(`SELECT assignment.round_trip_id,
  tag.tag_id, tag.current_name
FROM journal_round_trip_tag_assignments assignment
JOIN journal_tags tag
  ON tag.workspace_id = assignment.workspace_id
 AND tag.account_id = assignment.account_id
 AND tag.tag_id = assignment.tag_id
WHERE assignment.workspace_id = ? AND assignment.account_id = ?
  AND assignment.assignment_state = 'assigned'
  AND tag.lifecycle_state = 'active'
  AND assignment.round_trip_id IN (${batch.map(() => "?").join(", ")})
ORDER BY assignment.round_trip_id, tag.normalized_name COLLATE BINARY,
  tag.tag_id`).all(
        scope.workspaceId,
        scope.accountId,
        ...batch,
      ) as TagRow[]);
    }
    const result = new Map<string, TagRow[]>();
    for (const row of rows) {
      result.set(row.round_trip_id, [...(result.get(row.round_trip_id) ?? []), row]);
    }
    return result;
  }

  private readFocusRevisions(
    scope: ReturnType<typeof narrowWorkspaceAccessToAccount>,
    endDate: string,
  ): readonly FocusRevisionRow[] {
    return Object.freeze(this.database.prepare(`SELECT
  revision.daily_note_revision_id, day.trading_date,
  revision.revision_number, revision.tomorrows_focus,
  revision.created_at_utc
FROM journal_daily_note_revisions revision
JOIN journal_daily_notes note
  ON note.workspace_id = revision.workspace_id
 AND note.account_id = revision.account_id
 AND note.daily_note_id = revision.daily_note_id
JOIN journal_trading_days day
  ON day.workspace_id = note.workspace_id AND day.account_id = note.account_id
 AND day.trading_day_id = note.trading_day_id
WHERE revision.workspace_id = ? AND revision.account_id = ?
  AND day.trading_date <= ? AND trim(revision.tomorrows_focus) <> ''
ORDER BY day.trading_date, revision.revision_number,
  revision.created_at_utc`).all(
      scope.workspaceId,
      scope.accountId,
      endDate,
    ).map((row) => row as Readonly<{
      daily_note_revision_id: string;
      trading_date: string;
      revision_number: number;
      tomorrows_focus: string;
      created_at_utc: string;
    }>).map((row) => Object.freeze({
      revisionId: row.daily_note_revision_id,
      tradingDate: row.trading_date,
      revisionNumber: row.revision_number,
      currentFocuses: row.tomorrows_focus,
      createdAtUtc: row.created_at_utc,
    })));
  }

  private readIssuedReviews(
    scope: WorkspaceAccessScope,
    reviews: CoachAiReviewGenerationCompatibilityRepository,
    input: Readonly<{
      atOrAfterPeriodEndDate?: string;
      beforePeriodEndDate: string;
      reviewKinds: readonly CoachAiIssuedReviewRecord["reviewKind"][];
      limit?: number;
    }>,
  ): readonly CoachAiIssuedReviewRecord[] {
    return reviews.listIssuedReviews(scope, input);
  }

  private assertPromptSafeSource(
    source: CoachAiReviewCalculationSource,
    scope: WorkspaceAccessScope,
    factSet: ReturnType<JournalAnalyticsFactSetRepository["read"]>,
    privateManifest: Readonly<{
      dayRows: readonly TradingDayNoteRow[];
      ruleVersions: readonly JournalRuleRecord[];
      ruleReviewRecords: readonly Readonly<{ ruleReviewId: string }>[];
      styles: readonly Readonly<{ stylePlanId: string; roundTripVersionId: string }>[];
      swingNotes: readonly Readonly<{ swingDailyNoteId: string; roundTripId: string }>[];
      analysisLineage: readonly CoachAiReviewTradeAnalysisLineage[];
      issued: readonly Readonly<{ issuedReviewId: string; requestId: string }>[];
      focusRevisions: readonly FocusRevisionRow[];
      roundTripNotes: readonly RoundTripNoteRow[];
      tags: readonly TagRow[];
    }>,
  ): void {
    const privateIdentifiers = new Set<string>([
      scope.userId,
      scope.workspaceId,
      ...(scope.activeAccountId ? [scope.activeAccountId] : []),
      ...factSet.roundTrips.flatMap((roundTrip) => [
        roundTrip.roundTripId,
        roundTrip.roundTripVersionId,
        roundTrip.instrumentId,
        roundTrip.rebuild.rebuildId,
        ...roundTrip.allocations.flatMap((allocation) => [
          allocation.allocationId,
          allocation.executionId,
          allocation.executionVersionId,
        ]),
      ]),
      ...privateManifest.dayRows.flatMap((row) => [
        row.trading_day_id,
        ...(row.daily_note_id ? [row.daily_note_id] : []),
        ...(row.current_revision_id ? [row.current_revision_id] : []),
      ]),
      ...privateManifest.ruleVersions.flatMap((rule) => [rule.ruleId, rule.versionId]),
      ...privateManifest.ruleReviewRecords.map((review) => review.ruleReviewId),
      ...privateManifest.styles.flatMap((style) => [
        style.stylePlanId,
        style.roundTripVersionId,
      ]),
      ...privateManifest.swingNotes.flatMap((note) => [
        note.swingDailyNoteId,
        note.roundTripId,
      ]),
      ...privateManifest.analysisLineage.flatMap((lineage) => [
        lineage.roundTripId,
        lineage.currentRoundTripVersionId,
        ...(lineage.analysisVersionId ? [lineage.analysisVersionId] : []),
        ...(lineage.analyzedRoundTripVersionId
          ? [lineage.analyzedRoundTripVersionId]
          : []),
      ]),
      ...privateManifest.issued.flatMap((review) => [
        review.issuedReviewId,
        review.requestId,
      ]),
      ...privateManifest.focusRevisions.map((focus) => focus.revisionId),
      ...privateManifest.roundTripNotes.flatMap((note) => [
        note.round_trip_id,
        note.round_trip_note_id,
        note.current_revision_id,
      ]),
      ...privateManifest.tags.map((tag) => tag.tag_id),
      ...factSet.pendingDecisions.map((decision) => decision.decisionId),
    ].filter((value) => value.length > 0));
    const serialized = JSON.stringify(source);
    for (const privateIdentifier of privateIdentifiers) {
      if (serialized.includes(privateIdentifier)) {
        throw new Error("TRADERLINK_COACH_INSIGHT_PRIVATE_IDENTIFIER_LEAK");
      }
    }
  }
}
