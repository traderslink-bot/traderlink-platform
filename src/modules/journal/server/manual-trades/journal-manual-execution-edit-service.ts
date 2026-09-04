import type { AccountScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import type { LogicalTradeAnalyzerSelectionService } from "@/src/modules/level-analysis/server/logical-trade-analyzer-selection-service";
import {
  createCanonicalUtcTimestamp,
  createCanonicalUuidV4,
  platformFailure,
} from "@/src/modules/platform/server/database/platform-migration-contract";
import type { JournalExecutionFacts } from "../../contracts/journal-execution-contracts";
import { JournalDataDecisionService } from "../decisions/journal-data-decision-service";
import { JournalImportRepository } from "../imports/journal-import-repository";
import {
  normalizeBrokerDecimal,
  normalizeJournalCurrency,
  normalizeJournalExecutionLocalTime,
  normalizeJournalStockSymbol,
} from "../imports/journal-value-normalization";
import { JournalExecutionReconciliationRepository } from "../reconciliation/journal-execution-reconciliation-repository";
import type { JournalManualTradePreviewAuthority } from "./journal-manual-trade-preview-authority";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/u;
const TIME_PATTERN = /^\d{2}:\d{2}(?::\d{2})?$/u;

function normalizeLeadingDecimal(value: string): string {
  const trimmed = value.trim();
  return /^\.(\d+)$/u.test(trimmed) ? `0${trimmed}` : value;
}

export type JournalEditableManualExecution = Readonly<{
  deleteRef: string | null;
  editRef: string;
  executionId: string;
  currentVersionId: string;
  localDate: string;
  localTime: string;
  sourceTimezone: string;
  normalizedSymbol: string;
  tradeCurrency: string;
  side: "buy" | "sell";
  quantityDecimal: string;
  priceDecimal: string | null;
  feesDecimal: string | null;
  manualFeeInputState: "not_entered" | "entered" | null;
}>;

type JournalTradeDeletionCandidate = Readonly<{
  deleteRef: string;
  executions: readonly Readonly<{
    currentVersionId: string;
    executionId: string;
  }>[];
}>;

function localParts(sourceTimestampText: string): Readonly<{
  date: string;
  time: string;
}> {
  const match = sourceTimestampText.match(
    /(\d{4}-\d{2}-\d{2})[^\d]+(\d{2}:\d{2}(?::\d{2})?)/u,
  );
  return Object.freeze({
    date: match?.[1] ?? "",
    time: match?.[2] ?? "",
  });
}

export class JournalManualExecutionEditService {
  constructor(
    private readonly reconciliations: JournalExecutionReconciliationRepository,
    private readonly imports: JournalImportRepository,
    private readonly decisions: JournalDataDecisionService,
    private readonly authority: JournalManualTradePreviewAuthority,
    private readonly logicalTradeAnalyzer?: Pick<
      LogicalTradeAnalyzerSelectionService,
      "afterJournalRebuild"
    >,
  ) {}

  private editRef(
    scope: AccountScope,
    executionId: string,
    currentVersionId: string,
  ): string {
    return this.authority.opaqueRef("execution", JSON.stringify([
      scope.workspaceId,
      scope.accountId,
      executionId,
      currentVersionId,
    ]));
  }

  private tradeDeletionCandidate(
    scope: AccountScope,
    roundTripId: string,
  ): JournalTradeDeletionCandidate | null {
    const executions = this.reconciliations.listCurrentRoundTripExecutions(
      scope.workspaceId,
      scope.accountId,
      roundTripId,
    );
    if (
      executions.length === 0 ||
      executions.some((execution) => !this.reconciliations
        .isSafelyDeletableManualExecution(
          scope.workspaceId,
          scope.accountId,
          execution.executionId,
          execution.currentVersionId,
        ))
    ) {
      return null;
    }
    return Object.freeze({
      deleteRef: this.authority.opaqueRef("group", JSON.stringify([
        "workspace-trade-delete-v1",
        scope.workspaceId,
        scope.accountId,
        roundTripId,
        executions.map((execution) => [
          execution.executionId,
          execution.currentVersionId,
        ]),
      ])),
      executions,
    });
  }

  listTradeDeleteRefs(
    scope: AccountScope,
    roundTripIds: readonly string[],
  ): ReadonlyMap<string, string> {
    const refs = new Map<string, string>();
    for (const roundTripId of [...new Set(roundTripIds)]) {
      const candidate = this.tradeDeletionCandidate(scope, roundTripId);
      if (candidate) refs.set(roundTripId, candidate.deleteRef);
    }
    return refs;
  }

  listEditable(
    scope: AccountScope,
    executionIds?: readonly string[],
  ): readonly JournalEditableManualExecution[] {
    return Object.freeze(this.reconciliations.listEligibleManualExecutions(
      scope.workspaceId,
      scope.accountId,
      executionIds,
    ).map((candidate) => {
      const local = localParts(candidate.sourceTimestampText);
      const editRef = this.editRef(
        scope,
        candidate.executionId,
        candidate.currentVersionId,
      );
      return Object.freeze({
        deleteRef: this.reconciliations.isSafelyDeletableManualExecution(
          scope.workspaceId,
          scope.accountId,
          candidate.executionId,
          candidate.currentVersionId,
        ) ? editRef : null,
        editRef,
        executionId: candidate.executionId,
        currentVersionId: candidate.currentVersionId,
        localDate: local.date,
        localTime: local.time,
        sourceTimezone: candidate.sourceTimezone,
        normalizedSymbol: candidate.normalizedSymbol,
        tradeCurrency: candidate.tradeCurrency,
        side: candidate.side,
        quantityDecimal: candidate.quantityDecimal,
        priceDecimal: candidate.priceDecimal,
        feesDecimal: candidate.feesDecimal,
        manualFeeInputState: candidate.manualFeeInputState,
      });
    }));
  }

  correct(
    scope: AccountScope,
    executionRef: string,
    input: Readonly<{
      idempotencyKey: string;
      localDate: string;
      localTime: string;
      sourceTimezone: string;
      normalizedSymbol: string;
      tradeCurrency: string;
      side: "buy" | "sell";
      quantityDecimal: string;
      priceDecimal: string;
      feesDecimal: string | null;
      refreshAnalyzer?: boolean;
      now?: Date;
    }>,
  ) {
    if (!/^[0-9a-f]{64}$/u.test(executionRef)) {
      platformFailure("TRADERLINK_MANUAL_EXECUTION_EDIT_INVALID");
    }
    const candidate = this.listEditable(scope).find((item) =>
      item.editRef === executionRef);
    if (!candidate) {
      platformFailure("TRADERLINK_MANUAL_EXECUTION_EDIT_REQUIRES_DECISION");
    }
    if (
      input.idempotencyKey.length < 16 ||
      input.idempotencyKey.length > 128 ||
      !DATE_PATTERN.test(input.localDate) ||
      !TIME_PATTERN.test(input.localTime) ||
      !["buy", "sell"].includes(input.side)
    ) {
      platformFailure("TRADERLINK_MANUAL_EXECUTION_EDIT_INVALID");
    }
    const sourceTime = input.localTime.length === 5
      ? `${input.localTime}:00`
      : input.localTime;
    const sourceTimestampText = `${input.localDate}, ${sourceTime}`;
    const tradeCurrency = normalizeJournalCurrency(input.tradeCurrency);
    const normalizedSymbol = normalizeJournalStockSymbol(input.normalizedSymbol);
    const feesDecimal = input.feesDecimal === null ||
        input.feesDecimal.trim().length === 0
      ? "0"
      : normalizeBrokerDecimal(
          normalizeLeadingDecimal(input.feesDecimal),
          "feesDecimal",
        );
    const manualFeeInputState = input.feesDecimal === null ||
        input.feesDecimal.trim().length === 0
      ? "not_entered" as const
      : "entered" as const;
    const correction = this.imports.immediate(() => {
      const timestamp = createCanonicalUtcTimestamp(input.now);
      const instrumentId = this.imports.findOrCreateInstrument({
        instrumentId: createCanonicalUuidV4(),
        workspaceId: scope.workspaceId,
        assetClass: "stock",
        normalizedSymbol,
        quoteCurrency: tradeCurrency,
        timestamp,
      });
      const facts: JournalExecutionFacts = Object.freeze({
        instrumentId,
        tradeCurrency,
        sourceTimestampText,
        sourceTimezone: input.sourceTimezone,
        timeParserVersion: "manual_execution_correction_v1",
        executedAtUtc: normalizeJournalExecutionLocalTime(
          sourceTimestampText,
          input.sourceTimezone,
        ),
        sourceOrderKey: "pending_manual_correction",
        side: input.side,
        quantityDecimal: normalizeBrokerDecimal(
          input.quantityDecimal,
          "quantityDecimal",
          { positive: true },
        ),
        priceDecimal: normalizeBrokerDecimal(
          normalizeLeadingDecimal(input.priceDecimal),
          "priceDecimal",
          { positive: true },
        ),
        feesDecimal,
        feeCurrency: tradeCurrency,
        feeSignConvention: "broker_reported_signed",
        manualFeeInputState,
        factCompleteness: "complete",
      });
      return this.decisions.correctManualExecution(scope, {
        executionId: candidate.executionId,
        expectedCurrentVersionId: candidate.currentVersionId,
        facts,
        idempotencyKey: input.idempotencyKey,
        now: input.now,
      });
    });
    const affectedRoundTripIds = Object.freeze([
      ...new Set(
        correction.rebuilds
          .filter((rebuild) => rebuild.status === "rebuilt")
          .flatMap((rebuild) => rebuild.roundTripIds),
      ),
    ]);
    let queuedRoundTripIds: readonly string[] = Object.freeze([]);
    if (input.refreshAnalyzer !== false) {
      try {
        queuedRoundTripIds = this.logicalTradeAnalyzer?.afterJournalRebuild(
          scope,
          affectedRoundTripIds,
        ) ?? Object.freeze([]);
      } catch {
        // The Journal correction is already committed. Analyzer availability
        // cannot turn that successful fact correction into a reported failure.
      }
    }
    return Object.freeze({
      executionVersionId: correction.executionVersionId,
      openedFollowupDecisionIds: correction.openedFollowupDecisionIds,
      rebuildCount: correction.rebuildCount,
      analysisRefresh: Object.freeze({
        affectedTradeCount: affectedRoundTripIds.length,
        queuedTradeCount: queuedRoundTripIds.length,
      }),
    });
  }

  refreshLogicalTradesAfterRebuild(
    scope: AccountScope,
    affectedRoundTripIds: readonly string[],
    now: Date,
  ): readonly string[] {
    return this.logicalTradeAnalyzer?.afterJournalRebuild(scope, affectedRoundTripIds, now) ?? Object.freeze([]);
  }

  remove(
    scope: AccountScope,
    executionRef: string,
    input: Readonly<{
      idempotencyKey: string;
      now?: Date;
    }>,
  ) {
    if (
      !/^[0-9a-f]{64}$/u.test(executionRef) ||
      input.idempotencyKey.length < 16 ||
      input.idempotencyKey.length > 128
    ) {
      platformFailure("TRADERLINK_MANUAL_EXECUTION_EDIT_INVALID");
    }
    const candidate = this.listEditable(scope).find((item) =>
      item.editRef === executionRef && item.deleteRef === executionRef);
    if (!candidate) {
      platformFailure("TRADERLINK_MANUAL_EXECUTION_EDIT_REQUIRES_DECISION");
    }
    const exclusion = this.imports.immediate(() =>
      this.decisions.excludeManualExecution(scope, {
        executionId: candidate.executionId,
        expectedCurrentVersionId: candidate.currentVersionId,
        idempotencyKey: input.idempotencyKey,
        now: input.now,
      }));
    const affectedRoundTripIds = Object.freeze([
      ...new Set(
        exclusion.rebuilds
          .filter((rebuild) => rebuild.status === "rebuilt")
          .flatMap((rebuild) => rebuild.roundTripIds),
      ),
    ]);
    let queuedRoundTripIds: readonly string[] = Object.freeze([]);
    try {
      queuedRoundTripIds = this.logicalTradeAnalyzer?.afterJournalRebuild(
        scope,
        affectedRoundTripIds,
      ) ?? Object.freeze([]);
    } catch {
      // Journal exclusion is already committed; Analyzer availability cannot
      // turn a successful fact correction into a reported failure.
    }
    return Object.freeze({
      executionVersionId: exclusion.executionVersionId,
      openedFollowupDecisionIds: exclusion.openedFollowupDecisionIds,
      rebuildCount: exclusion.rebuildCount,
      analysisRefresh: Object.freeze({
        affectedTradeCount: affectedRoundTripIds.length,
        queuedTradeCount: queuedRoundTripIds.length,
      }),
    });
  }

  removeTrade(
    scope: AccountScope,
    roundTripId: string,
    tradeDeleteRef: string,
    input: Readonly<{
      idempotencyKey: string;
      now?: Date;
    }>,
  ) {
    if (
      !/^[0-9a-f]{64}$/u.test(tradeDeleteRef) ||
      input.idempotencyKey.length < 16 ||
      input.idempotencyKey.length > 128
    ) {
      platformFailure("TRADERLINK_MANUAL_EXECUTION_EDIT_INVALID");
    }
    const candidate = this.tradeDeletionCandidate(scope, roundTripId);
    if (!candidate || candidate.deleteRef !== tradeDeleteRef) {
      platformFailure("TRADERLINK_MANUAL_EXECUTION_EDIT_REQUIRES_DECISION");
    }
    const exclusion = this.decisions.excludeManualExecutions(scope, {
      executions: candidate.executions.map((execution) => Object.freeze({
        executionId: execution.executionId,
        expectedCurrentVersionId: execution.currentVersionId,
      })),
      idempotencyKey: input.idempotencyKey,
      now: input.now,
    });
    const affectedRoundTripIds = Object.freeze([
      ...new Set(
        exclusion.rebuilds
          .filter((rebuild) => rebuild.status === "rebuilt")
          .flatMap((rebuild) => rebuild.roundTripIds),
      ),
    ]);
    let queuedRoundTripIds: readonly string[] = Object.freeze([]);
    try {
      queuedRoundTripIds = this.logicalTradeAnalyzer?.afterJournalRebuild(
        scope,
        affectedRoundTripIds,
      ) ?? Object.freeze([]);
    } catch {
      // Journal exclusion is already committed; Analyzer availability cannot
      // turn that successful fact correction into a reported failure.
    }
    return Object.freeze({
      deletedExecutionCount: exclusion.removedExecutionCount,
      openedFollowupDecisionIds: exclusion.openedFollowupDecisionIds,
      rebuildCount: exclusion.rebuildCount,
      analysisRefresh: Object.freeze({
        affectedTradeCount: affectedRoundTripIds.length,
        queuedTradeCount: queuedRoundTripIds.length,
      }),
    });
  }
}
