import { createHash } from "node:crypto";

import type { AccountScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import {
  assertCanonicalUuidV4,
  createCanonicalUtcTimestamp,
  createCanonicalUuidV4,
  platformFailure,
  TraderLinkPlatformError,
} from "@/src/modules/platform/server/database/platform-migration-contract";
import type {
  JournalDataDecisionRecord,
  JournalDecisionAction,
  JournalDecisionTarget,
} from "../../contracts/journal-decision-contracts";
import type { JournalAssetClass } from "../../contracts/journal-import-contracts";
import type { JournalExecutionFacts } from "../../contracts/journal-execution-contracts";
import type { JournalChainRebuildResult } from "../../contracts/journal-round-trip-contracts";
import {
  assertCanonicalJournalDecimal,
  assertJournalCurrency,
  assertJournalSha256,
  assertJournalTradingDate,
  assertJournalTimezone,
  assertJournalToken,
  assertJournalUtcTimestamp,
} from "../../contracts/journal-storage-values";
import { JournalExecutionRepository } from "../executions/journal-execution-repository";
import { JournalExecutionService } from "../executions/journal-execution-service";
import {
  type ManualExecutionInput,
  JournalImportService,
} from "../imports/journal-import-service";
import { JournalImportRepository } from "../imports/journal-import-repository";
import {
  assertUtcMatchesJournalLocalTime,
  normalizeIbkrExecutionTime,
} from "../imports/journal-value-normalization";
import { JournalRoundTripService } from "../round-trips/journal-round-trip-service";
import {
  JournalDataDecisionRepository,
  type SourceIssueResolutionContext,
} from "./journal-data-decision-repository";

function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function effectForIssue(issueCode: string): string {
  if (issueCode.includes("price")) return "price_metrics_unavailable";
  if (issueCode.includes("fee")) return "net_metrics_unavailable";
  if (/overlap|order|quantity|time|position|execution|inventory|coverage|round_trip/u.test(issueCode)) {
    return "position_chain_unavailable";
  }
  return "source_review_required";
}

type CommonResolution = Readonly<{
  decisionId: string;
  expectedRevision: number;
  reasonCode: string;
  reasonText?: string | null;
  now?: Date;
}>;

export type JournalDecisionResolution = CommonResolution & (
  | Readonly<{
      action: "correct_execution_fact";
      executionId: string;
      expectedCurrentVersionId: string;
      facts: JournalExecutionFacts;
      idempotencyKey: string;
      sourceDisplayLabel: string;
    }>
  | Readonly<{
      action: "set_execution_order";
      executionId: string;
      expectedCurrentVersionId: string;
      sameTimestampSequence: number;
      idempotencyKey: string;
      sourceDisplayLabel: string;
    }>
  | Readonly<{
      action: "exclude_execution" | "restore_execution" | "keep_distinct";
      executionId: string;
      expectedCurrentVersionId: string;
    }>
  | Readonly<{
      action: "merge_supported_duplicate";
      duplicateExecutionId: string;
      retainedExecutionId: string;
      expectedDuplicateVersionId: string;
    }>
  | Readonly<{
      action: "add_missing_execution";
      idempotencyKey: string;
      sourceDisplayLabel: string;
      execution: ManualExecutionInput;
    }>
  | Readonly<{
      action: "supply_opening_inventory";
      instrumentId: string;
      currency: string;
      effectiveLocalDate: string;
      sourceTimezone: string;
      quantityDecimal: string;
      idempotencyKey: string;
      sourceDisplayLabel: string;
    }>
  | Readonly<{
      action: "supply_position_fact";
      instrumentId: string;
      currency: string;
      factKind: "opening_balance" | "closing_balance" | "open_position" | "current_position";
      effectiveLocalDate: string;
      timePrecision: "date" | "day_start" | "day_end" | "exact";
      sourceTimeText?: string | null;
      sourceTimezone: string;
      effectiveAtUtc?: string | null;
      quantityDecimal: string;
      idempotencyKey: string;
      sourceDisplayLabel: string;
    }>
  | Readonly<{
      action: "supply_coverage_fact";
      assetClass: JournalAssetClass;
      coverageKind: "complete" | "partial";
      localStartDate: string;
      localEndDate: string;
      sourceTimezone: string;
      idempotencyKey: string;
      sourceDisplayLabel: string;
    }>
  | Readonly<{
      action: "correct_position_fact";
      priorPositionFactId: string;
      quantityDecimal: string;
      idempotencyKey: string;
      sourceDisplayLabel: string;
    }>
  | Readonly<{
      action: "confirm_legitimate_open_position";
      positionFactId: string;
      idempotencyKey: string;
      sourceDisplayLabel: string;
    }>
  | Readonly<{
      action: "accept_source_limitation";
    }>
);

export type JournalDecisionResolutionResult = Readonly<{
  decision: JournalDataDecisionRecord;
  decisionEventId: string;
  rebuildCount: number;
  openedFollowupDecisionIds: readonly string[];
}>;

function sameExecutionIdentityFacts(
  left: JournalExecutionFacts,
  right: JournalExecutionFacts,
): boolean {
  const identity = (value: JournalExecutionFacts) => Object.freeze([
    value.instrumentId,
    value.tradeCurrency,
    value.executedAtUtc,
    value.side,
    value.quantityDecimal,
    value.priceDecimal,
  ]);
  return JSON.stringify(identity(left)) === JSON.stringify(identity(right));
}

function assertSafeSourceDisplayLabel(value: string): void {
  if (
    value.trim() !== value ||
    value.length < 1 ||
    value.length > 120 ||
    /[\u0000-\u001f\u007f]/u.test(value)
  ) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
      field: "sourceDisplayLabel",
    });
  }
}

function manualCoverageDate(
  sourceIssue: SourceIssueResolutionContext,
): Readonly<{ localDate: string; sourceTimezone: string }> | null {
  if (!sourceIssue.sourceRowRawFieldsJson) return null;
  let fields: unknown;
  try {
    fields = JSON.parse(sourceIssue.sourceRowRawFieldsJson);
  } catch {
    return null;
  }
  if (
    !Array.isArray(fields) ||
    fields[0] !== "manual_execution_v1" ||
    typeof fields[5] !== "string" ||
    typeof fields[6] !== "string"
  ) return null;
  return /^\d{4}-\d{2}-\d{2}$/u.test(fields[5])
    ? Object.freeze({ localDate: fields[5], sourceTimezone: fields[6] })
    : null;
}

type CorrectablePositionFactKind =
  | "opening_balance"
  | "closing_balance"
  | "open_position"
  | "current_position";

function positionFactKindForIssueCode(
  issueCode: string,
): CorrectablePositionFactKind | null {
  const match = issueCode.match(
    /^position_fact_(opening_balance|closing_balance|open_position|current_position)_/u,
  );
  return match ? match[1] as CorrectablePositionFactKind : null;
}

function sourceIssueAllowsAction(
  sourceIssue: SourceIssueResolutionContext,
  action: JournalDecisionAction,
): boolean {
  if (action === "accept_source_limitation") return true;
  if (sourceIssue.issueCode.startsWith("position_fact_")) {
    return action === "supply_position_fact";
  }
  if ([
    "statement_period_missing",
    "statement_period_conflict",
    "source_timezone_differs_from_account",
    "manual_trading_day_coverage_unconfirmed",
  ].includes(sourceIssue.issueCode)) {
    return action === "supply_coverage_fact";
  }
  if ([
    "execution_required_fact_missing",
    "execution_zero_quantity",
    "execution_time_ambiguous",
    "execution_fact_invalid",
  ].includes(sourceIssue.issueCode)) {
    return action === "add_missing_execution";
  }
  if (sourceIssue.issueCode === "execution_price_missing") {
    return action === "correct_execution_fact" || action === "exclude_execution";
  }
  if (sourceIssue.issueCode === "provider_execution_identity_invalid") {
    return action === "exclude_execution";
  }
  if (["overlap_fact_conflict", "overlap_count_ambiguous"].includes(
    sourceIssue.issueCode,
  )) {
    return [
      "correct_execution_fact",
      "exclude_execution",
      "merge_supported_duplicate",
      "keep_distinct",
    ].includes(action);
  }
  return false;
}

function assertSourceIssueChainMatches(
  sourceIssue: SourceIssueResolutionContext,
  candidate: Readonly<{
    instrumentId: string;
    tradeCurrency: string;
    effectiveAtUtc: string | null;
  }>,
): void {
  if (
    (sourceIssue.instrumentId && sourceIssue.instrumentId !== candidate.instrumentId) ||
    (sourceIssue.tradeCurrency && sourceIssue.tradeCurrency !== candidate.tradeCurrency) ||
    (sourceIssue.effectiveAtUtc && sourceIssue.effectiveAtUtc !== candidate.effectiveAtUtc)
  ) {
    platformFailure("TRADERLINK_DATA_DECISION_INVALID_ACTION", {
      reason: "source_issue_chain_scope_mismatch",
    });
  }
}

function positionResolutionEffectiveAtUtc(input: Extract<
  JournalDecisionResolution,
  { action: "supply_position_fact" }
>): string | null {
  if (input.timePrecision === "exact") return input.effectiveAtUtc ?? null;
  const clock = input.timePrecision === "day_start" || input.factKind === "opening_balance"
    ? "00:00:00"
    : "23:59:59";
  return normalizeIbkrExecutionTime(
    `${input.effectiveLocalDate}, ${clock}`,
    input.sourceTimezone,
  );
}

function positionLocalDateAtUtc(effectiveAtUtc: string, sourceTimezone: string): string {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-CA", {
    timeZone: sourceTimezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(effectiveAtUtc)).filter((part) => part.type !== "literal")
    .map((part) => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function assertDecisionTarget(target: JournalDecisionTarget): void {
  switch (target.kind) {
    case "source_issue":
      assertCanonicalUuidV4(target.sourceIssueId, "sourceIssueId");
      break;
    case "execution":
      assertCanonicalUuidV4(target.executionId, "executionId");
      break;
    case "position_fact":
      assertCanonicalUuidV4(target.positionFactId, "positionFactId");
      break;
    case "overlap_set":
      assertJournalSha256(target.overlapKeySha256, "overlapKeySha256");
      break;
    case "chain":
      assertJournalSha256(target.chainKeySha256, "chainKeySha256");
      break;
  }
}

function assertResolutionMatchesTarget(
  decision: JournalDataDecisionRecord,
  input: JournalDecisionResolution,
  sourceIssue: SourceIssueResolutionContext | null,
): void {
  if (decision.target.kind === "source_issue") {
    if (
      !sourceIssue ||
      sourceIssue.sourceIssueId !== decision.target.sourceIssueId ||
      sourceIssue.issueCode !== decision.issueCode
    ) {
      platformFailure("TRADERLINK_DATA_DECISION_INVALID_ACTION", {
        reason: "source_issue_target_mismatch",
      });
    }
    if (!sourceIssueAllowsAction(sourceIssue, input.action)) {
      platformFailure("TRADERLINK_DATA_DECISION_INVALID_ACTION", {
        reason: "source_issue_action_mismatch",
      });
    }
    if (input.action === "accept_source_limitation") return;
    if (input.action === "add_missing_execution") {
      if (
        !["execution", "row"].includes(sourceIssue.issueScope) ||
        sourceIssue.executionIds.length > 0
      ) {
        platformFailure("TRADERLINK_DATA_DECISION_INVALID_ACTION", {
          reason: "source_issue_execution_already_mapped",
        });
      }
      return;
    }
    if (input.action === "supply_position_fact") {
      const expectedFactKind = positionFactKindForIssueCode(sourceIssue.issueCode);
      if (
        sourceIssue.issueScope !== "position_fact" ||
        !expectedFactKind ||
        input.factKind !== expectedFactKind
      ) {
        platformFailure("TRADERLINK_DATA_DECISION_INVALID_ACTION", {
          reason: "source_issue_position_target_mismatch",
        });
      }
      return;
    }
    if (input.action === "supply_coverage_fact") {
      if (
        !["import", "row"].includes(sourceIssue.issueScope) ||
        ![
          "statement_period_missing",
          "statement_period_conflict",
          "source_timezone_differs_from_account",
          "manual_trading_day_coverage_unconfirmed",
        ].includes(sourceIssue.issueCode)
      ) {
        platformFailure("TRADERLINK_DATA_DECISION_INVALID_ACTION", {
          reason: "source_issue_coverage_target_mismatch",
        });
      }
      if (sourceIssue.issueCode === "manual_trading_day_coverage_unconfirmed") {
        const expected = manualCoverageDate(sourceIssue);
        if (
          !expected ||
          input.assetClass !== "stock" ||
          input.localStartDate !== expected.localDate ||
          input.localEndDate !== expected.localDate ||
          input.sourceTimezone !== expected.sourceTimezone
        ) {
          platformFailure("TRADERLINK_DATA_DECISION_INVALID_ACTION", {
            reason: "manual_coverage_fact_scope_mismatch",
          });
        }
      }
      return;
    }
    if (input.action === "merge_supported_duplicate") {
      if (!sourceIssue.executionIds.includes(input.duplicateExecutionId)) {
        platformFailure("TRADERLINK_DATA_DECISION_INVALID_ACTION", {
          reason: "source_issue_execution_target_mismatch",
        });
      }
      return;
    }
    if (
      ["correct_execution_fact", "set_execution_order", "exclude_execution",
        "restore_execution", "keep_distinct"].includes(input.action)
    ) {
      const executionId = "executionId" in input ? input.executionId : null;
      if (!executionId || !sourceIssue.executionIds.includes(executionId)) {
        platformFailure("TRADERLINK_DATA_DECISION_INVALID_ACTION", {
          reason: "source_issue_execution_target_mismatch",
        });
      }
      return;
    }
    if (
      input.action === "correct_position_fact" ||
      input.action === "confirm_legitimate_open_position"
    ) {
      const positionFactId = input.action === "correct_position_fact"
        ? input.priorPositionFactId
        : input.positionFactId;
      if (!sourceIssue.positionFactIds.includes(positionFactId)) {
        platformFailure("TRADERLINK_DATA_DECISION_INVALID_ACTION", {
          reason: "source_issue_position_target_mismatch",
        });
      }
      return;
    }
    platformFailure("TRADERLINK_DATA_DECISION_INVALID_ACTION", {
      reason: "source_issue_action_mismatch",
    });
  }
  if (decision.target.kind === "execution") {
    const executionIds = input.action === "merge_supported_duplicate"
      ? [input.duplicateExecutionId, input.retainedExecutionId]
      : "executionId" in input
        ? [input.executionId]
        : [];
    if (!executionIds.includes(decision.target.executionId)) {
      platformFailure("TRADERLINK_DATA_DECISION_INVALID_ACTION", {
        reason: "execution_target_mismatch",
      });
    }
  }
  if (decision.target.kind === "position_fact") {
    const positionFactId = input.action === "correct_position_fact"
      ? input.priorPositionFactId
      : input.action === "confirm_legitimate_open_position"
        ? input.positionFactId
        : null;
    if (positionFactId !== decision.target.positionFactId) {
      platformFailure("TRADERLINK_DATA_DECISION_INVALID_ACTION", {
        reason: "position_target_mismatch",
      });
    }
  }
  if (
    decision.target.kind === "overlap_set" &&
    !["merge_supported_duplicate", "keep_distinct"].includes(input.action)
  ) {
    platformFailure("TRADERLINK_DATA_DECISION_INVALID_ACTION", {
      reason: "overlap_action_mismatch",
    });
  }
  if (decision.target.kind === "chain") {
    const suppliesExpectedClosingPosition =
      decision.issueCode === "closing_position_unconfirmed" &&
      input.action === "supply_position_fact" &&
      ["closing_balance", "open_position", "current_position"].includes(
        input.factKind,
      );
    if (
      !suppliesExpectedClosingPosition &&
      [
        "accept_source_limitation",
        "supply_position_fact",
        "supply_coverage_fact",
      ].includes(input.action)
    ) {
      platformFailure("TRADERLINK_DATA_DECISION_INVALID_ACTION", {
        reason: "chain_action_mismatch",
      });
    }
  }
}

function assertChainTargetMatches(
  decision: JournalDataDecisionRecord,
  scope: AccountScope,
  instrumentId: string,
  currency: string,
): void {
  if (decision.target.kind !== "chain") return;
  const chainKeySha256 = sha256(JSON.stringify([
    "journal-chain-v1",
    scope.workspaceId,
    scope.accountId,
    instrumentId,
    currency,
  ]));
  if (chainKeySha256 !== decision.target.chainKeySha256) {
    platformFailure("TRADERLINK_DATA_DECISION_INVALID_ACTION", {
      reason: "chain_target_mismatch",
    });
  }
}

export class JournalDataDecisionService {
  constructor(
    private readonly decisions: JournalDataDecisionRepository,
    private readonly imports: JournalImportRepository,
    private readonly importService: JournalImportService,
    private readonly executionRepository: JournalExecutionRepository,
    private readonly executionService: JournalExecutionService,
    private readonly roundTrips: JournalRoundTripService,
  ) {}

  openDecision(
    scope: AccountScope,
    input: Readonly<{
      issueCode: string;
      effectCode: string;
      target: JournalDecisionTarget;
      now?: Date;
    }>,
  ): JournalDataDecisionRecord {
    assertJournalToken(input.issueCode, "issueCode");
    assertJournalToken(input.effectCode, "effectCode");
    assertDecisionTarget(input.target);
    if (input.target.kind === "source_issue") {
      const sourceIssue = this.decisions.sourceIssueResolutionContext(
        scope.workspaceId,
        scope.accountId,
        input.target.sourceIssueId,
      );
      if (!sourceIssue || sourceIssue.issueCode !== input.issueCode) {
        platformFailure("TRADERLINK_DATA_DECISION_INVALID_ACTION", {
          reason: "source_issue_target_mismatch",
        });
      }
    } else if (input.target.kind === "execution") {
      const targetExecution = this.executionRepository.current(
        input.target.executionId,
        scope.workspaceId,
        scope.accountId,
      );
      if (!targetExecution || targetExecution.currentState === "superseded") {
        platformFailure("TRADERLINK_DATA_DECISION_INVALID_ACTION", {
          reason: "execution_target_missing",
        });
      }
    } else if (input.target.kind === "position_fact") {
      if (!this.decisions.positionFact(
        scope.workspaceId,
        scope.accountId,
        input.target.positionFactId,
      )) {
        platformFailure("TRADERLINK_DATA_DECISION_INVALID_ACTION", {
          reason: "position_target_missing",
        });
      }
    } else if (input.target.kind === "overlap_set") {
      platformFailure("TRADERLINK_DATA_DECISION_INVALID_ACTION", {
        reason: "overlap_target_not_materialized",
      });
    } else if (!this.roundTrips.hasChainTarget(scope, input.target.chainKeySha256)) {
      platformFailure("TRADERLINK_DATA_DECISION_INVALID_ACTION", {
        reason: "chain_target_missing",
      });
    }
    const timestamp = createCanonicalUtcTimestamp(input.now);
    return this.decisions.immediate(() => {
      if (input.target.kind === "source_issue") {
        const priorSourceDecision = this.decisions.findForSourceIssue(
          scope.workspaceId,
          scope.accountId,
          input.target.sourceIssueId,
        );
        if (priorSourceDecision) return priorSourceDecision;
      }
      const existing = this.decisions.findPending(
        scope.workspaceId,
        scope.accountId,
        input.target,
      );
      if (existing) return existing;
      return this.decisions.open({
        decisionId: createCanonicalUuidV4(),
        decisionEventId: createCanonicalUuidV4(),
        workspaceId: scope.workspaceId,
        accountId: scope.accountId,
        issueCode: input.issueCode,
        target: input.target,
        effectCode: input.effectCode,
        timestamp,
      });
    });
  }

  openImportIssueDecisions(
    scope: AccountScope,
    importBatchId: string,
    now?: Date,
  ): readonly JournalDataDecisionRecord[] {
    return Object.freeze(this.decisions.listActionableSourceIssues(
      scope.workspaceId,
      scope.accountId,
      importBatchId,
    ).map((finding) => this.decisions.findForSourceIssue(
      scope.workspaceId,
      scope.accountId,
      finding.sourceIssueId,
    ) ?? this.openDecision(scope, {
      issueCode: finding.issueCode,
      effectCode: effectForIssue(finding.issueCode),
      target: { kind: "source_issue", sourceIssueId: finding.sourceIssueId },
      now,
    })));
  }

  openRoundTripDecisionFindings(
    scope: AccountScope,
    rebuilds: readonly JournalChainRebuildResult[],
    now?: Date,
  ): readonly JournalDataDecisionRecord[] {
    const findings = this.roundTrips.listDecisionFindings(rebuilds);
    const currentFindings = new Map(findings.map((finding) => [
      finding.chainKeySha256,
      finding.issueCode,
    ]));
    const timestamp = createCanonicalUtcTimestamp(now);
    return this.decisions.immediate(() => {
      this.decisions.supersedeStaleChainDecisions({
        workspaceId: scope.workspaceId,
        accountId: scope.accountId,
        currentFindings,
        createEventId: createCanonicalUuidV4,
        timestamp,
      });
      return Object.freeze(findings.map((finding) => this.openDecision(scope, {
        issueCode: finding.issueCode,
        effectCode: effectForIssue(finding.issueCode),
        target: { kind: "chain", chainKeySha256: finding.chainKeySha256 },
        now,
      })));
    });
  }

  resolve(
    scope: AccountScope,
    input: JournalDecisionResolution,
  ): JournalDecisionResolutionResult {
    assertJournalToken(input.reasonCode, "reasonCode");
    if (input.reasonText && (input.reasonText.length > 2000 || input.reasonText.trim().length === 0)) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "reasonText" });
    }
    const decision = this.decisions.get(scope.workspaceId, scope.accountId, input.decisionId);
    if (!decision || decision.state !== "pending" || decision.revision !== input.expectedRevision) {
      platformFailure("TRADERLINK_DATA_DECISION_CONFLICT");
    }
    const sourceIssue = decision.target.kind === "source_issue"
      ? this.decisions.sourceIssueResolutionContext(
          scope.workspaceId,
          scope.accountId,
          decision.target.sourceIssueId,
        )
      : null;
    assertResolutionMatchesTarget(decision, input, sourceIssue);
    const timestamp = createCanonicalUtcTimestamp(input.now);
    const decisionEventId = createCanonicalUuidV4();

    return this.decisions.immediate(() => {
      const lockedDecision = this.decisions.get(
        scope.workspaceId,
        scope.accountId,
        input.decisionId,
      );
      if (
        !lockedDecision ||
        lockedDecision.state !== "pending" ||
        lockedDecision.revision !== input.expectedRevision ||
        lockedDecision.currentEventId !== decision.currentEventId
      ) {
        platformFailure("TRADERLINK_DATA_DECISION_CONFLICT");
      }
      let priorExecutionVersionId: string | null = null;
      let resultingExecutionVersionId: string | null = null;
      let priorPositionFactId: string | null = null;
      let resultingPositionFactId: string | null = null;
      let resultingCoverageIntervalId: string | null = null;
      let counterpartExecutionId: string | null = null;

      switch (input.action) {
        case "correct_execution_fact": {
          const currentRecord = this.executionRepository.current(
            input.executionId,
            scope.workspaceId,
            scope.accountId,
          );
          const currentVersion = this.executionRepository.currentVersion(
            input.executionId,
            scope.workspaceId,
            scope.accountId,
          );
          if (
            !currentRecord ||
            !currentVersion ||
            currentRecord.currentVersionId !== input.expectedCurrentVersionId ||
            currentVersion.executionVersionId !== input.expectedCurrentVersionId ||
            currentRecord.currentState === "superseded"
          ) {
            platformFailure("TRADERLINK_JOURNAL_EXECUTION_CONFLICT");
          }
          const correctedFacts = Object.freeze({
            ...input.facts,
            sourceOrderKey: input.facts.executedAtUtc === currentVersion.executedAtUtc
              ? currentVersion.sourceOrderKey
              : `${input.facts.executedAtUtc}|unverified|correction|${input.executionId}`,
          });
          if (sourceIssue) {
            assertSourceIssueChainMatches(sourceIssue, {
              instrumentId: correctedFacts.instrumentId,
              tradeCurrency: correctedFacts.tradeCurrency,
              effectiveAtUtc: correctedFacts.executedAtUtc,
            });
            if (
              sourceIssue.issueCode === "execution_price_missing" &&
              (
                correctedFacts.instrumentId !== currentVersion.instrumentId ||
                correctedFacts.tradeCurrency !== currentVersion.tradeCurrency ||
                correctedFacts.sourceTimestampText !== currentVersion.sourceTimestampText ||
                correctedFacts.sourceTimezone !== currentVersion.sourceTimezone ||
                correctedFacts.timeParserVersion !== currentVersion.timeParserVersion ||
                correctedFacts.executedAtUtc !== currentVersion.executedAtUtc ||
                correctedFacts.side !== currentVersion.side ||
                correctedFacts.quantityDecimal !== currentVersion.quantityDecimal ||
                correctedFacts.feesDecimal !== currentVersion.feesDecimal ||
                correctedFacts.feeCurrency !== currentVersion.feeCurrency ||
                correctedFacts.feeSignConvention !== currentVersion.feeSignConvention ||
                correctedFacts.priceDecimal === null ||
                correctedFacts.factCompleteness !== "complete"
              )
            ) {
              platformFailure("TRADERLINK_DATA_DECISION_INVALID_ACTION", {
                reason: "source_issue_price_correction_scope_mismatch",
              });
            }
          }
          assertChainTargetMatches(
            decision,
            scope,
            correctedFacts.instrumentId,
            correctedFacts.tradeCurrency,
          );
          const correctionEvidence = this.createExecutionCorrectionEvidence(scope, {
            idempotencyKey: input.idempotencyKey,
            sourceDisplayLabel: input.sourceDisplayLabel,
            executionId: input.executionId,
            facts: correctedFacts,
            correctionKind: "execution_fact_correction",
            now: input.now,
          });
          const hasOtherPendingDecision =
            this.executionRepository.hasOtherPendingDecision({
              workspaceId: scope.workspaceId,
              accountId: scope.accountId,
              executionId: input.executionId,
              excludingDecisionId: input.decisionId,
            });
          const corrected = this.executionService.appendCorrection(scope, {
            executionId: input.executionId,
            expectedCurrentVersionId: input.expectedCurrentVersionId,
            state: currentRecord.currentState === "excluded_by_trader"
              ? "excluded_by_trader"
              : correctedFacts.factCompleteness === "complete" &&
                  !hasOtherPendingDecision
                ? "accepted"
                : "needs_decision",
            facts: correctedFacts,
            changeReasonCode: input.reasonCode,
            importBatchId: correctionEvidence.importBatchId,
            sourceRowId: correctionEvidence.sourceRowId,
            now: input.now,
          });
          priorExecutionVersionId = input.expectedCurrentVersionId;
          resultingExecutionVersionId = corrected.executionVersionId;
          break;
        }
        case "set_execution_order": {
          const currentRecord = this.executionRepository.current(
            input.executionId,
            scope.workspaceId,
            scope.accountId,
          );
          const current = this.executionRepository.currentVersion(
            input.executionId,
            scope.workspaceId,
            scope.accountId,
          );
          if (
            !currentRecord ||
            !current ||
            currentRecord.currentState === "superseded" ||
            current.executionVersionId !== input.expectedCurrentVersionId ||
            currentRecord.currentVersionId !== input.expectedCurrentVersionId
          ) {
            platformFailure("TRADERLINK_JOURNAL_EXECUTION_CONFLICT");
          }
          assertChainTargetMatches(decision, scope, current.instrumentId, current.tradeCurrency);
          if (
            !Number.isSafeInteger(input.sameTimestampSequence) ||
            input.sameTimestampSequence < 1 ||
            input.sameTimestampSequence > 99_999_999
          ) {
            platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
              field: "sameTimestampSequence",
            });
          }
          const sourceOrderKey = `${current.executedAtUtc}|trader|${String(
            input.sameTimestampSequence,
          ).padStart(8, "0")}`;
          if (this.executionRepository.currentSourceOrderKeyExists({
            workspaceId: scope.workspaceId,
            accountId: scope.accountId,
            instrumentId: current.instrumentId,
            tradeCurrency: current.tradeCurrency,
            executedAtUtc: current.executedAtUtc,
            sourceOrderKey,
            excludingExecutionId: input.executionId,
          })) {
            platformFailure("TRADERLINK_DATA_DECISION_INVALID_ACTION", {
              reason: "execution_order_collision",
            });
          }
          const correctedFacts = Object.freeze({
            instrumentId: current.instrumentId,
            tradeCurrency: current.tradeCurrency,
            sourceTimestampText: current.sourceTimestampText,
            sourceTimezone: current.sourceTimezone,
            timeParserVersion: current.timeParserVersion,
            executedAtUtc: current.executedAtUtc,
            sourceOrderKey,
            side: current.side,
            quantityDecimal: current.quantityDecimal,
            priceDecimal: current.priceDecimal,
            feesDecimal: current.feesDecimal,
            feeCurrency: current.feeCurrency,
            feeSignConvention: current.feeSignConvention,
            factCompleteness: current.factCompleteness === "order_ambiguous"
              ? "complete" as const
              : current.factCompleteness,
          });
          const correctionEvidence = this.createExecutionCorrectionEvidence(scope, {
            idempotencyKey: input.idempotencyKey,
            sourceDisplayLabel: input.sourceDisplayLabel,
            executionId: input.executionId,
            facts: correctedFacts,
            correctionKind: "execution_order_correction",
            now: input.now,
          });
          const hasOtherPendingDecision =
            this.executionRepository.hasOtherPendingDecision({
              workspaceId: scope.workspaceId,
              accountId: scope.accountId,
              executionId: input.executionId,
              excludingDecisionId: input.decisionId,
            });
          const corrected = this.executionService.appendCorrection(scope, {
            executionId: input.executionId,
            expectedCurrentVersionId: input.expectedCurrentVersionId,
            state: currentRecord.currentState === "excluded_by_trader"
              ? "excluded_by_trader"
              : correctedFacts.factCompleteness === "complete" &&
                  !hasOtherPendingDecision
                ? "accepted"
                : "needs_decision",
            facts: correctedFacts,
            changeReasonCode: input.reasonCode,
            importBatchId: correctionEvidence.importBatchId,
            sourceRowId: correctionEvidence.sourceRowId,
            now: input.now,
          });
          priorExecutionVersionId = current.executionVersionId;
          resultingExecutionVersionId = corrected.executionVersionId;
          break;
        }
        case "exclude_execution":
        case "restore_execution":
        case "keep_distinct": {
          const currentRecord = this.executionRepository.current(
            input.executionId,
            scope.workspaceId,
            scope.accountId,
          );
          const current = this.executionRepository.currentVersion(
            input.executionId,
            scope.workspaceId,
            scope.accountId,
          );
          if (
            !currentRecord || !current ||
            current.executionVersionId !== input.expectedCurrentVersionId ||
            (input.action === "exclude_execution" &&
              !["accepted", "needs_decision"].includes(currentRecord.currentState)) ||
            (input.action === "restore_execution" && currentRecord.currentState !== "excluded_by_trader") ||
            (input.action === "keep_distinct" && currentRecord.currentState !== "needs_decision")
          ) {
            platformFailure("TRADERLINK_JOURNAL_EXECUTION_CONFLICT");
          }
          assertChainTargetMatches(decision, scope, current.instrumentId, current.tradeCurrency);
          if (input.action === "keep_distinct") {
            this.activateProviderIdentityAliases(
              scope,
              input.executionId,
              input.executionId,
              timestamp,
            );
          }
          const hasOtherPendingDecision = input.action === "exclude_execution"
            ? false
            : this.executionRepository.hasOtherPendingDecision({
                workspaceId: scope.workspaceId,
                accountId: scope.accountId,
                executionId: input.executionId,
                excludingDecisionId: input.decisionId,
              });
          const state = input.action === "exclude_execution"
            ? "excluded_by_trader" as const
            : current.factCompleteness === "complete" &&
                !hasOtherPendingDecision
              ? "accepted" as const
              : "needs_decision" as const;
          this.decisions.updateExecutionState({
            workspaceId: scope.workspaceId,
            accountId: scope.accountId,
            executionId: input.executionId,
            expectedVersionId: current.executionVersionId,
            state,
            timestamp,
          });
          priorExecutionVersionId = current.executionVersionId;
          resultingExecutionVersionId = current.executionVersionId;
          break;
        }
        case "merge_supported_duplicate": {
          if (input.duplicateExecutionId === input.retainedExecutionId) {
            platformFailure("TRADERLINK_DATA_DECISION_INVALID_ACTION");
          }
          const duplicate = this.executionRepository.currentVersion(
            input.duplicateExecutionId,
            scope.workspaceId,
            scope.accountId,
          );
          const retained = this.executionRepository.currentVersion(
            input.retainedExecutionId,
            scope.workspaceId,
            scope.accountId,
          );
          const duplicateRecord = this.executionRepository.current(
            input.duplicateExecutionId,
            scope.workspaceId,
            scope.accountId,
          );
          const retainedRecord = this.executionRepository.current(
            input.retainedExecutionId,
            scope.workspaceId,
            scope.accountId,
          );
          if (
            !duplicate || !retained || !duplicateRecord || !retainedRecord ||
            duplicate.executionVersionId !== input.expectedDuplicateVersionId ||
            duplicateRecord.currentState !== "needs_decision" ||
            retainedRecord.currentState === "excluded_by_trader" ||
            retainedRecord.currentState === "superseded" ||
            !sameExecutionIdentityFacts(duplicate, retained)
          ) platformFailure("TRADERLINK_DATA_DECISION_INVALID_ACTION");
          assertChainTargetMatches(decision, scope, duplicate.instrumentId, duplicate.tradeCurrency);
          assertChainTargetMatches(decision, scope, retained.instrumentId, retained.tradeCurrency);
          this.executionRepository.reassignActiveAliases(
            scope.workspaceId,
            scope.accountId,
            input.duplicateExecutionId,
            input.retainedExecutionId,
            timestamp,
          );
          this.activateProviderIdentityAliases(
            scope,
            input.duplicateExecutionId,
            input.retainedExecutionId,
            timestamp,
          );
          this.activateProviderIdentityAliases(
            scope,
            input.retainedExecutionId,
            input.retainedExecutionId,
            timestamp,
          );
          this.decisions.updateExecutionState({
            workspaceId: scope.workspaceId,
            accountId: scope.accountId,
            executionId: input.duplicateExecutionId,
            expectedVersionId: duplicate.executionVersionId,
            state: "superseded",
            timestamp,
          });
          priorExecutionVersionId = duplicate.executionVersionId;
          resultingExecutionVersionId = retained.executionVersionId;
          counterpartExecutionId = input.retainedExecutionId;
          break;
        }
        case "add_missing_execution": {
          const committed = this.importService.commitManualExecutions({
            userId: scope.userId,
            workspaceId: scope.workspaceId,
            workspaceRole: scope.workspaceRole,
            allowedAccountIds: [scope.accountId],
            activeAccountId: scope.accountId,
          }, {
            accountId: scope.accountId,
            idempotencyKey: input.idempotencyKey,
            sourceDisplayLabel: input.sourceDisplayLabel,
            entries: [input.execution],
            now: input.now,
          });
          const executionId = committed.executionIds[0];
          const version = executionId
            ? this.executionRepository.currentVersion(executionId, scope.workspaceId, scope.accountId)
            : null;
          if (!version) platformFailure("TRADERLINK_DATA_DECISION_INVALID_ACTION");
          assertChainTargetMatches(decision, scope, version.instrumentId, version.tradeCurrency);
          if (sourceIssue) {
            assertSourceIssueChainMatches(sourceIssue, {
              instrumentId: version.instrumentId,
              tradeCurrency: version.tradeCurrency,
              effectiveAtUtc: version.executedAtUtc,
            });
          }
          if (committed.status === "committed") {
            this.openImportIssueDecisions(scope, committed.importBatchId, input.now);
          }
          resultingExecutionVersionId = version.executionVersionId;
          break;
        }
        case "supply_opening_inventory": {
          assertChainTargetMatches(decision, scope, input.instrumentId, input.currency);
          const created = this.createPositionCorrection(scope, {
            instrumentId: input.instrumentId,
            currency: input.currency,
            factKind: "opening_balance",
            effectiveLocalDate: input.effectiveLocalDate,
            timePrecision: "day_start",
            sourceTimezone: input.sourceTimezone,
            quantityDecimal: input.quantityDecimal,
            supersedesPositionFactId: null,
            idempotencyKey: input.idempotencyKey,
            sourceDisplayLabel: input.sourceDisplayLabel,
            now: input.now,
          });
          resultingPositionFactId = created;
          break;
        }
        case "supply_position_fact": {
          if (sourceIssue) {
            assertSourceIssueChainMatches(sourceIssue, {
              instrumentId: input.instrumentId,
              tradeCurrency: input.currency,
              effectiveAtUtc: positionResolutionEffectiveAtUtc(input),
            });
          }
          assertChainTargetMatches(
            decision,
            scope,
            input.instrumentId,
            input.currency,
          );
          const created = this.createPositionCorrection(scope, {
            instrumentId: input.instrumentId,
            currency: input.currency,
            factKind: input.factKind,
            effectiveLocalDate: input.effectiveLocalDate,
            timePrecision: input.timePrecision,
            sourceTimeText: input.sourceTimeText,
            sourceTimezone: input.sourceTimezone,
            effectiveAtUtc: input.effectiveAtUtc,
            quantityDecimal: input.quantityDecimal,
            supersedesPositionFactId: null,
            idempotencyKey: input.idempotencyKey,
            sourceDisplayLabel: input.sourceDisplayLabel,
            now: input.now,
          });
          resultingPositionFactId = created;
          break;
        }
        case "correct_position_fact": {
          const prior = this.decisions.positionFact(
            scope.workspaceId,
            scope.accountId,
            input.priorPositionFactId,
          );
          if (!prior) platformFailure("TRADERLINK_DATA_DECISION_INVALID_ACTION");
          assertChainTargetMatches(decision, scope, prior.instrumentId, prior.currency);
          const created = this.createPositionCorrection(scope, {
            instrumentId: prior.instrumentId,
            currency: prior.currency,
            factKind: prior.factKind,
            effectiveLocalDate: prior.effectiveLocalDate,
            timePrecision: prior.timePrecision,
            sourceTimeText: prior.sourceTimeText,
            sourceTimezone: prior.sourceTimezone,
            effectiveAtUtc: prior.effectiveAtUtc,
            quantityDecimal: input.quantityDecimal,
            supersedesPositionFactId: prior.positionFactId,
            idempotencyKey: input.idempotencyKey,
            sourceDisplayLabel: input.sourceDisplayLabel,
            now: input.now,
          });
          priorPositionFactId = prior.positionFactId;
          resultingPositionFactId = created;
          break;
        }
        case "confirm_legitimate_open_position": {
          const fact = this.decisions.positionFact(
            scope.workspaceId,
            scope.accountId,
            input.positionFactId,
          );
          if (
            !fact || fact.quantityDecimal === "0" ||
            !["open_position", "closing_balance", "current_position"].includes(fact.factKind)
          ) platformFailure("TRADERLINK_DATA_DECISION_INVALID_ACTION");
          assertChainTargetMatches(decision, scope, fact.instrumentId, fact.currency);
          const confirmed = this.createPositionCorrection(scope, {
            instrumentId: fact.instrumentId,
            currency: fact.currency,
            factKind: fact.factKind,
            effectiveLocalDate: fact.effectiveLocalDate,
            timePrecision: fact.timePrecision,
            sourceTimeText: fact.sourceTimeText,
            sourceTimezone: fact.sourceTimezone,
            effectiveAtUtc: fact.effectiveAtUtc,
            quantityDecimal: fact.quantityDecimal,
            factVersion: "trader_confirmed_open_v1",
            supersedesPositionFactId: fact.positionFactId,
            idempotencyKey: input.idempotencyKey,
            sourceDisplayLabel: input.sourceDisplayLabel,
            now: input.now,
          });
          priorPositionFactId = fact.positionFactId;
          resultingPositionFactId = confirmed;
          break;
        }
        case "supply_coverage_fact": {
          resultingCoverageIntervalId = this.createCoverageCorrection(scope, {
            assetClass: input.assetClass,
            coverageKind: input.coverageKind,
            localStartDate: input.localStartDate,
            localEndDate: input.localEndDate,
            sourceTimezone: input.sourceTimezone,
            idempotencyKey: input.idempotencyKey,
            sourceDisplayLabel: input.sourceDisplayLabel,
            now: input.now,
          });
          break;
        }
        case "accept_source_limitation":
          break;
      }

      const resolved = this.decisions.resolve({
        decisionEventId,
        workspaceId: scope.workspaceId,
        accountId: scope.accountId,
        decisionId: input.decisionId,
        expectedRevision: input.expectedRevision,
        action: input.action,
        actorUserId: scope.userId,
        reasonCode: input.reasonCode,
        reasonText: input.reasonText ?? null,
        priorExecutionVersionId,
        resultingExecutionVersionId,
        priorPositionFactId,
        resultingPositionFactId,
        resultingCoverageIntervalId,
        counterpartExecutionId,
        timestamp,
      });
      const affectedImportBatchIds = new Set<string>();
      if (sourceIssue) affectedImportBatchIds.add(sourceIssue.importBatchId);
      if (
        input.action === "supply_coverage_fact" &&
        sourceIssue?.issueCode === "manual_trading_day_coverage_unconfirmed"
      ) {
        for (const related of this.decisions.listPendingSourceIssueDecisionsByIssueCode(
          scope.workspaceId,
          scope.accountId,
          "manual_trading_day_coverage_unconfirmed",
        )) {
          if (related.target.kind !== "source_issue") continue;
          const relatedIssue = this.decisions.sourceIssueResolutionContext(
            scope.workspaceId,
            scope.accountId,
            related.target.sourceIssueId,
          );
          const relatedCoverage = relatedIssue
            ? manualCoverageDate(relatedIssue)
            : null;
          if (
            !relatedIssue ||
            !relatedCoverage ||
            relatedCoverage.localDate !== input.localStartDate ||
            input.localStartDate !== input.localEndDate ||
            relatedCoverage.sourceTimezone !== input.sourceTimezone
          ) continue;
          this.decisions.resolve({
            decisionEventId: createCanonicalUuidV4(),
            workspaceId: scope.workspaceId,
            accountId: scope.accountId,
            decisionId: related.decisionId,
            expectedRevision: related.revision,
            action: input.action,
            actorUserId: scope.userId,
            reasonCode: input.reasonCode,
            reasonText: input.reasonText ?? null,
            priorExecutionVersionId: null,
            resultingExecutionVersionId: null,
            priorPositionFactId: null,
            resultingPositionFactId: null,
            resultingCoverageIntervalId,
            counterpartExecutionId: null,
            timestamp,
          });
          affectedImportBatchIds.add(relatedIssue.importBatchId);
        }
      }
      for (const importBatchId of affectedImportBatchIds) {
        this.imports.reconcileAcceptedBatchDecisions({
          workspaceId: scope.workspaceId,
          accountId: scope.accountId,
          importBatchId,
          importEventId: createCanonicalUuidV4(),
          actorUserId: scope.userId,
          timestamp,
        });
      }
      const rebuilds = this.roundTrips.rebuildAccount(scope, {
        kind: "decision_event",
        triggerId: decisionEventId,
        now: input.now,
      });
      const followupDecisions = this.openRoundTripDecisionFindings(
        scope,
        rebuilds,
        input.now,
      );
      return Object.freeze({
        decision: resolved,
        decisionEventId,
        rebuildCount: rebuilds.length,
        openedFollowupDecisionIds: Object.freeze(
          followupDecisions.map((followup) => followup.decisionId),
        ),
      });
    });
  }

  private activateProviderIdentityAliases(
    scope: AccountScope,
    evidenceExecutionId: string,
    targetExecutionId: string,
    timestamp: string,
  ): void {
    for (const evidence of this.executionRepository.listProviderIdentityEvidence(
      scope.workspaceId,
      scope.accountId,
      evidenceExecutionId,
    )) {
      const existing = this.executionRepository.findActiveAlias({
        workspaceId: scope.workspaceId,
        accountId: scope.accountId,
        aliasType: "broker_fill",
        aliasSchemeVersion: evidence.schemeVersion,
        aliasSha256: evidence.identitySha256,
        occurrenceOrdinal: null,
      });
      if (existing && existing.executionId !== targetExecutionId) {
        platformFailure("TRADERLINK_DATA_DECISION_INVALID_ACTION", {
          reason: "provider_identity_conflict",
        });
      }
      if (existing) {
        this.executionRepository.touchAlias({
          workspaceId: scope.workspaceId,
          accountId: scope.accountId,
          executionAliasId: existing.executionAliasId,
          timestamp,
        });
      } else {
        this.executionRepository.insertAlias({
          executionAliasId: createCanonicalUuidV4(),
          workspaceId: scope.workspaceId,
          accountId: scope.accountId,
          executionId: targetExecutionId,
          aliasType: "broker_fill",
          aliasSchemeVersion: evidence.schemeVersion,
          aliasSha256: evidence.identitySha256,
          occurrenceOrdinal: null,
          timestamp,
        });
      }
    }
  }

  private createExecutionCorrectionEvidence(
    scope: AccountScope,
    input: Readonly<{
      idempotencyKey: string;
      sourceDisplayLabel: string;
      executionId: string;
      facts: JournalExecutionFacts;
      correctionKind: "execution_fact_correction" | "execution_order_correction";
      now?: Date;
    }>,
  ): Readonly<{ importBatchId: string; sourceRowId: string }> {
    assertCanonicalUuidV4(input.executionId, "executionId");
    assertSafeSourceDisplayLabel(input.sourceDisplayLabel);
    if (input.idempotencyKey.length < 16 || input.idempotencyKey.length > 128) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
        field: "idempotencyKey",
      });
    }
    const fields = Object.freeze([
      "execution_correction_v1",
      input.correctionKind,
      input.executionId,
      input.facts.instrumentId,
      input.facts.tradeCurrency,
      input.facts.sourceTimestampText,
      input.facts.sourceTimezone,
      input.facts.timeParserVersion,
      input.facts.executedAtUtc,
      input.facts.sourceOrderKey,
      input.facts.side,
      input.facts.quantityDecimal,
      input.facts.priceDecimal ?? "",
      input.facts.feesDecimal ?? "",
      input.facts.feeCurrency ?? "",
      input.facts.feeSignConvention,
      input.facts.factCompleteness,
    ]);
    const rawFieldsJson = JSON.stringify(fields);
    const priorBatch = this.imports.findByManualIdempotency(
      scope.workspaceId,
      scope.accountId,
      input.idempotencyKey,
    );
    if (priorBatch) {
      const priorRow = this.imports.findFirstSourceRowByBatch(
        scope.workspaceId,
        scope.accountId,
        priorBatch.importBatchId,
      );
      if (!priorRow || priorRow.rawFieldsJson !== rawFieldsJson) {
        platformFailure("TRADERLINK_DATA_DECISION_CONFLICT", {
          reason: "correction_idempotency",
        });
      }
      return Object.freeze({
        importBatchId: priorBatch.importBatchId,
        sourceRowId: priorRow.sourceRowId,
      });
    }
    const timestamp = createCanonicalUtcTimestamp(input.now);
    const importBatchId = createCanonicalUuidV4();
    const importEventId = createCanonicalUuidV4();
    const sourceRowId = createCanonicalUuidV4();
    const rowFingerprint = sha256(rawFieldsJson);
    this.imports.insertImportBatch({
      importBatchId,
      workspaceId: scope.workspaceId,
      accountId: scope.accountId,
      sourceIdentityId: null,
      sourceKind: "manual_batch",
      sourceSystem: "manual",
      sourceFileSha256: null,
      sourceFileSizeBytes: null,
      sourceMimeType: null,
      sourceEncoding: null,
      sourceDisplayLabel: input.sourceDisplayLabel,
      evidenceObjectKey: null,
      manualIdempotencyKey: input.idempotencyKey,
      adapterId: "data_decision",
      adapterVersion: "data_decision_v1",
      parserVersion: "manual_record_v1",
      mappingVersion: "execution_correction_mapping_v1",
      mappingContractJson: JSON.stringify({
        contractVersion: "execution_correction_mapping_v1",
      }),
      statementPeriodStartDate: null,
      statementPeriodEndDate: null,
      sourceTimezone: input.facts.sourceTimezone,
      currentState: "accepted",
      currentEventId: importEventId,
      preservedRowCount: 1,
      mappedExecutionCount: 1,
      unsupportedRowCount: 0,
      issueCount: 0,
      pendingDecisionCount: 0,
      createdByUserId: scope.userId,
      timestamp,
    });
    this.imports.insertAcceptedEvent({
      importEventId,
      workspaceId: scope.workspaceId,
      accountId: scope.accountId,
      importBatchId,
      eventType: "accepted",
      actorUserId: scope.userId,
      reasonCode: "data_decision_correction",
      timestamp,
    });
    this.imports.insertSourceRow({
      sourceRowId,
      workspaceId: scope.workspaceId,
      accountId: scope.accountId,
      importBatchId,
      recordOrdinal: 1,
      sourceRecordIdentitySha256: sha256([
        "execution-correction-v1",
        scope.workspaceId,
        scope.accountId,
        input.idempotencyKey,
      ].join("\u001f")),
      rawRecordSha256: rowFingerprint,
      rawFieldsJson,
      sectionName: "Data Decision",
      recordType: "Execution Correction",
      assetCategory: null,
      contentFingerprintSha256: rowFingerprint,
      occurrenceOrdinal: 1,
      initialClassification: "mapped_execution",
      mappingVersion: "execution_correction_mapping_v1",
      timestamp,
    });
    return Object.freeze({ importBatchId, sourceRowId });
  }

  private createCoverageCorrection(
    scope: AccountScope,
    input: Readonly<{
      assetClass: JournalAssetClass;
      coverageKind: "complete" | "partial";
      localStartDate: string;
      localEndDate: string;
      sourceTimezone: string;
      idempotencyKey: string;
      sourceDisplayLabel: string;
      now?: Date;
    }>,
  ): string {
    if (![
      "stock", "option", "forex", "future", "crypto", "other",
    ].includes(input.assetClass)) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
        field: "assetClass",
      });
    }
    assertJournalTradingDate(input.localStartDate, "localStartDate");
    assertJournalTradingDate(input.localEndDate, "localEndDate");
    assertJournalTimezone(input.sourceTimezone, "sourceTimezone");
    if (
      input.localEndDate < input.localStartDate ||
      input.sourceTimezone !== this.roundTrips.accountTradingTimezone(scope)
    ) {
      platformFailure("TRADERLINK_DATA_DECISION_INVALID_ACTION", {
        reason: "coverage_fact_scope_mismatch",
      });
    }
    assertSafeSourceDisplayLabel(input.sourceDisplayLabel);
    if (input.idempotencyKey.length < 16 || input.idempotencyKey.length > 128) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
        field: "idempotencyKey",
      });
    }
    const fields = Object.freeze([
      "coverage_fact_correction_v1",
      input.assetClass,
      input.coverageKind,
      input.localStartDate,
      input.localEndDate,
      input.sourceTimezone,
    ]);
    const rawFieldsJson = JSON.stringify(fields);
    const priorBatch = this.imports.findByManualIdempotency(
      scope.workspaceId,
      scope.accountId,
      input.idempotencyKey,
    );
    if (priorBatch) {
      const existing = this.imports.findCoverageByBatch(
        scope.workspaceId,
        scope.accountId,
        priorBatch.importBatchId,
      );
      const priorRow = this.imports.findFirstSourceRowByBatch(
        scope.workspaceId,
        scope.accountId,
        priorBatch.importBatchId,
      );
      if (!existing || !priorRow || priorRow.rawFieldsJson !== rawFieldsJson) {
        platformFailure("TRADERLINK_DATA_DECISION_CONFLICT", {
          reason: "coverage_correction_idempotency",
        });
      }
      return existing;
    }
    const timestamp = createCanonicalUtcTimestamp(input.now);
    const importBatchId = createCanonicalUuidV4();
    const importEventId = createCanonicalUuidV4();
    const sourceRowId = createCanonicalUuidV4();
    const coverageIntervalId = createCanonicalUuidV4();
    const rowFingerprint = sha256(rawFieldsJson);
    this.imports.insertImportBatch({
      importBatchId,
      workspaceId: scope.workspaceId,
      accountId: scope.accountId,
      sourceIdentityId: null,
      sourceKind: "manual_batch",
      sourceSystem: "manual",
      sourceFileSha256: null,
      sourceFileSizeBytes: null,
      sourceMimeType: null,
      sourceEncoding: null,
      sourceDisplayLabel: input.sourceDisplayLabel,
      evidenceObjectKey: null,
      manualIdempotencyKey: input.idempotencyKey,
      adapterId: "data_decision",
      adapterVersion: "data_decision_v1",
      parserVersion: "manual_record_v1",
      mappingVersion: "coverage_fact_mapping_v1",
      mappingContractJson: JSON.stringify({
        contractVersion: "coverage_fact_mapping_v1",
      }),
      statementPeriodStartDate: null,
      statementPeriodEndDate: null,
      sourceTimezone: input.sourceTimezone,
      currentState: "accepted",
      currentEventId: importEventId,
      preservedRowCount: 1,
      mappedExecutionCount: 0,
      unsupportedRowCount: 0,
      issueCount: 0,
      pendingDecisionCount: 0,
      createdByUserId: scope.userId,
      timestamp,
    });
    this.imports.insertAcceptedEvent({
      importEventId,
      workspaceId: scope.workspaceId,
      accountId: scope.accountId,
      importBatchId,
      eventType: "accepted",
      actorUserId: scope.userId,
      reasonCode: "data_decision_correction",
      timestamp,
    });
    this.imports.insertSourceRow({
      sourceRowId,
      workspaceId: scope.workspaceId,
      accountId: scope.accountId,
      importBatchId,
      recordOrdinal: 1,
      sourceRecordIdentitySha256: sha256([
        "coverage-fact-correction-v1",
        scope.workspaceId,
        scope.accountId,
        input.idempotencyKey,
      ].join("\u001f")),
      rawRecordSha256: rowFingerprint,
      rawFieldsJson,
      sectionName: "Data Decision",
      recordType: "Coverage Fact",
      assetCategory: input.assetClass,
      contentFingerprintSha256: rowFingerprint,
      occurrenceOrdinal: 1,
      initialClassification: "mapped_coverage_fact",
      mappingVersion: "coverage_fact_mapping_v1",
      timestamp,
    });
    this.imports.insertCoverage({
      coverageIntervalId,
      workspaceId: scope.workspaceId,
      accountId: scope.accountId,
      importBatchId,
      assetClass: input.assetClass,
      coverageKind: input.coverageKind,
      localStartDate: input.localStartDate,
      localEndDate: input.localEndDate,
      sourceTimezone: input.sourceTimezone,
      timestamp,
    });
    return coverageIntervalId;
  }

  private createPositionCorrection(
    scope: AccountScope,
    input: Readonly<{
      instrumentId: string;
      currency: string;
      factKind: "opening_balance" | "closing_balance" | "open_position" | "current_position";
      effectiveLocalDate: string;
      timePrecision: "date" | "day_start" | "day_end" | "exact";
      sourceTimeText?: string | null;
      sourceTimezone: string;
      effectiveAtUtc?: string | null;
      quantityDecimal: string;
      factVersion?: "trader_correction_v1" | "trader_confirmed_open_v1";
      supersedesPositionFactId: string | null;
      idempotencyKey: string;
      sourceDisplayLabel: string;
      now?: Date;
    }>,
  ): string {
    assertCanonicalUuidV4(input.instrumentId, "instrumentId");
    assertJournalCurrency(input.currency, "currency");
    assertJournalTradingDate(input.effectiveLocalDate, "effectiveLocalDate");
    assertJournalTimezone(input.sourceTimezone, "sourceTimezone");
    assertCanonicalJournalDecimal(input.quantityDecimal, "quantityDecimal");
    assertSafeSourceDisplayLabel(input.sourceDisplayLabel);
    if (
      (input.timePrecision === "exact") !== Boolean(input.effectiveAtUtc) ||
      (input.sourceTimeText !== undefined && input.sourceTimeText !== null &&
        (input.sourceTimeText.length < 1 || input.sourceTimeText.length > 120))
    ) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
        field: "positionFactTime",
      });
    }
    if (input.effectiveAtUtc) {
      assertJournalUtcTimestamp(input.effectiveAtUtc, "effectiveAtUtc");
    }
    if (input.timePrecision === "exact") {
      const effectiveAtUtc = input.effectiveAtUtc!;
      if (positionLocalDateAtUtc(effectiveAtUtc, input.sourceTimezone) !==
        input.effectiveLocalDate) {
        platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
          field: "positionFactTime",
          reason: "exact_local_date_mismatch",
        });
      }
      if (input.sourceTimeText) {
        try {
          assertUtcMatchesJournalLocalTime(
            input.sourceTimeText,
            input.sourceTimezone,
            effectiveAtUtc,
          );
        } catch (error) {
          if (!(error instanceof TraderLinkPlatformError)) throw error;
          platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
            field: "positionFactTime",
            reason: "exact_local_time_mismatch",
          }, error);
        }
      }
    }
    if (input.idempotencyKey.length < 16 || input.idempotencyKey.length > 128) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "idempotencyKey" });
    }
    return this.decisions.immediate(() => {
    const effectiveFactVersion = input.factVersion ?? "trader_correction_v1";
    const fields = Object.freeze([
      "position_fact_correction_v2", input.instrumentId, input.currency,
      input.factKind, input.effectiveLocalDate, input.timePrecision,
      input.sourceTimeText ?? "", input.sourceTimezone, input.effectiveAtUtc ?? "",
      input.quantityDecimal, effectiveFactVersion,
      input.supersedesPositionFactId ?? "",
    ]);
    const rawFieldsJson = JSON.stringify(fields);
    const priorBatch = this.imports.findByManualIdempotency(
      scope.workspaceId,
      scope.accountId,
      input.idempotencyKey,
    );
    if (priorBatch) {
      const existing = this.imports.findPositionFactByBatch(
        scope.workspaceId,
        scope.accountId,
        priorBatch.importBatchId,
      );
      const priorRow = this.imports.findFirstSourceRowByBatch(
        scope.workspaceId,
        scope.accountId,
        priorBatch.importBatchId,
      );
      if (!existing || !priorRow || priorRow.rawFieldsJson !== rawFieldsJson) {
        platformFailure("TRADERLINK_DATA_DECISION_CONFLICT", {
          reason: "position_correction_idempotency",
        });
      }
      return existing;
    }
    const timestamp = createCanonicalUtcTimestamp(input.now);
    const importBatchId = createCanonicalUuidV4();
    const importEventId = createCanonicalUuidV4();
    const sourceRowId = createCanonicalUuidV4();
    const positionFactId = createCanonicalUuidV4();
    const rowFingerprint = sha256(rawFieldsJson);
    this.imports.insertImportBatch({
      importBatchId, workspaceId: scope.workspaceId, accountId: scope.accountId,
      sourceIdentityId: null, sourceKind: "manual_batch", sourceSystem: "manual",
      sourceFileSha256: null, sourceFileSizeBytes: null, sourceMimeType: null,
      sourceEncoding: null, sourceDisplayLabel: input.sourceDisplayLabel,
      evidenceObjectKey: null, manualIdempotencyKey: input.idempotencyKey,
      adapterId: "data_decision", adapterVersion: "data_decision_v1",
      parserVersion: "manual_record_v1", mappingVersion: "position_fact_mapping_v2",
      mappingContractJson: JSON.stringify({ contractVersion: "position_fact_mapping_v2" }),
      statementPeriodStartDate: null, statementPeriodEndDate: null,
      sourceTimezone: input.sourceTimezone, currentState: "accepted",
      currentEventId: importEventId, preservedRowCount: 1, mappedExecutionCount: 0,
      unsupportedRowCount: 0, issueCount: 0, pendingDecisionCount: 0,
      createdByUserId: scope.userId, timestamp,
    });
    this.imports.insertAcceptedEvent({
      importEventId, workspaceId: scope.workspaceId, accountId: scope.accountId,
      importBatchId, eventType: "accepted", actorUserId: scope.userId, timestamp,
      reasonCode: "data_decision_correction",
    });
    this.imports.insertSourceRow({
      sourceRowId, workspaceId: scope.workspaceId, accountId: scope.accountId,
      importBatchId, recordOrdinal: 1,
      sourceRecordIdentitySha256: sha256([
        "position-fact-correction-v2", scope.workspaceId, scope.accountId,
        input.idempotencyKey, "1",
      ].join("\u001f")),
      rawRecordSha256: rowFingerprint, rawFieldsJson,
      sectionName: "Data Decision", recordType: "Position Fact",
      assetCategory: null, contentFingerprintSha256: rowFingerprint,
      occurrenceOrdinal: 1, initialClassification: "mapped_position_fact",
      mappingVersion: "position_fact_mapping_v2", timestamp,
    });
    this.imports.insertCoverage({
      coverageIntervalId: createCanonicalUuidV4(), workspaceId: scope.workspaceId,
      accountId: scope.accountId, importBatchId, assetClass: "stock",
      coverageKind: "point_only", localStartDate: input.effectiveLocalDate,
      localEndDate: input.effectiveLocalDate, sourceTimezone: input.sourceTimezone,
      timestamp,
    });
    this.imports.insertPositionFact({
      positionFactId, workspaceId: scope.workspaceId, accountId: scope.accountId,
      importBatchId, sourceRowId, instrumentId: input.instrumentId,
      currency: input.currency, factKind: input.factKind,
      effectiveLocalDate: input.effectiveLocalDate,
      timePrecision: input.timePrecision, sourceTimeText: input.sourceTimeText ?? null,
      sourceTimezone: input.sourceTimezone, effectiveAtUtc: input.effectiveAtUtc ?? null,
      quantityDecimal: input.quantityDecimal, timestamp,
      factSource: "trader_correction",
      factVersion: effectiveFactVersion,
      supersedesPositionFactId: input.supersedesPositionFactId,
      actorUserId: scope.userId,
    });
    return positionFactId;
    });
  }
}
