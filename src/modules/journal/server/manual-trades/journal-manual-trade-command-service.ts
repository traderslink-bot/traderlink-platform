import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { narrowWorkspaceAccessToAccount } from "@/src/modules/platform/contracts/workspace-access-scope";
import { DailyTradeYahooAnalyzerService } from "@/src/modules/level-analysis/server/daily-trade-yahoo-analyzer-service";
import {
  createCanonicalUtcTimestamp,
  platformFailure,
} from "@/src/modules/platform/server/database/platform-migration-contract";
import type {
  JournalManualTradeCommitRequest,
  JournalManualTradeGroupConfirmation,
  JournalManualTradePreviewGroup,
} from "../../contracts/journal-manual-trade-capture-contracts";
import type { JournalDataDecisionRecord } from "../../contracts/journal-decision-contracts";
import type { JournalChainRebuildResult } from "../../contracts/journal-round-trip-contracts";
import type { JournalImportCommitResult } from "../imports/journal-import-service";
import { JournalImportService } from "../imports/journal-import-service";
import { JournalDataDecisionService } from "../decisions/journal-data-decision-service";
import { JournalRoundTripService } from "../round-trips/journal-round-trip-service";
import {
  canonicalJournalManualTradePreviewPayload,
  digestJournalManualTradePreviewPayload,
} from "./journal-manual-trade-preview-authority";
import {
  type JournalManualAllocationTarget,
  JournalManualTradeCommandRepository,
} from "./journal-manual-trade-command-repository";
import {
  assertJournalManualTrackerEntryDates,
  toManualExecutionInput,
} from "./journal-manual-trade-input";
import { JournalManualTradePreviewService } from "./journal-manual-trade-preview-service";

export type JournalManualTradeCommitResult = JournalImportCommitResult & Readonly<{
  affectedDates: readonly string[];
  affectedPositionRefs: readonly string[];
  relatedDecisionIds: readonly string[];
  rebuilds: readonly JournalChainRebuildResult[];
  styledTradeCount: number;
}>;

function validateConfirmation(
  group: JournalManualTradePreviewGroup,
  confirmation: JournalManualTradeGroupConfirmation,
): void {
  if (
    confirmation.groupRef !== group.groupRef ||
    confirmation.relationship === "not_finished" ||
    !group.allowedRelationships.includes(confirmation.relationship) ||
    !group.allowedStyles.includes(confirmation.style) ||
    !confirmation.completeExecutionSetConfirmed ||
    confirmation.existingPositionRef !== (group.existingPosition?.positionRef ?? null)
  ) {
    platformFailure("TRADERLINK_MANUAL_TRADE_RELATIONSHIP_CONFLICT", {
      reason: "confirmation_changed",
    });
  }
}

export class JournalManualTradeCommandService {
  constructor(
    private readonly repository: JournalManualTradeCommandRepository,
    private readonly imports: JournalImportService,
    private readonly decisions: JournalDataDecisionService,
    private readonly roundTrips: JournalRoundTripService,
    private readonly previews: JournalManualTradePreviewService,
    private readonly dailyTradeAnalyzer?: DailyTradeYahooAnalyzerService,
  ) {}

  commit(
    scope: WorkspaceAccessScope,
    accountSelectionRef: string,
    request: JournalManualTradeCommitRequest,
    now: Date = new Date(),
  ): JournalManualTradeCommitResult {
    const accountId = scope.activeAccountId;
    if (!accountId) platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
    assertJournalManualTrackerEntryDates(request.tracker, request.entries);
    const accountScope = narrowWorkspaceAccessToAccount(scope, accountId);
    if (!this.previews.verify(scope, {
      accountSelectionRef,
      tracker: request.tracker,
      entries: request.entries,
      previewRef: request.previewRef,
    })) {
      platformFailure("TRADERLINK_MANUAL_TRADE_PREVIEW_INVALID");
    }

    const result = this.repository.immediate(() => {
      const preview = this.previews.preview(scope, {
        accountSelectionRef,
        tracker: request.tracker,
        entries: request.entries,
      });
      if (preview.groups.length !== request.confirmations.length) {
        platformFailure("TRADERLINK_MANUAL_TRADE_RELATIONSHIP_CONFLICT", {
          reason: "confirmation_count",
        });
      }
      const confirmations = new Map(
        request.confirmations.map((confirmation) => [confirmation.groupRef, confirmation]),
      );
      if (confirmations.size !== request.confirmations.length) {
        platformFailure("TRADERLINK_MANUAL_TRADE_RELATIONSHIP_CONFLICT", {
          reason: "confirmation_duplicate",
        });
      }
      for (const group of preview.groups) {
        const confirmation = confirmations.get(group.groupRef);
        if (!confirmation) {
          platformFailure("TRADERLINK_MANUAL_TRADE_RELATIONSHIP_CONFLICT", {
            reason: "confirmation_missing",
          });
        }
        validateConfirmation(group, confirmation);
      }

      const committed = this.imports.commitManualExecutions(scope, {
        accountId,
        idempotencyKey: request.idempotencyKey,
        sourceDisplayLabel: request.tracker === "swing"
          ? "Swing Trade Tracker manual executions"
          : "Daily Trade Tracker manual executions",
        entries: request.entries.map(toManualExecutionInput),
        confirmedTraderBoundaries: true,
        now,
      });
      if (committed.executionIds.length !== request.entries.length) {
        platformFailure("TRADERLINK_MANUAL_TRADE_COMMIT_CONFLICT", {
          reason: "execution_result_count",
        });
      }
      const affectedDates = Object.freeze(
        [...new Set(request.entries.map((entry) => entry.localDate))].sort(),
      );
      const executionIdByClientRow = new Map(
        request.entries.map((entry, index) => [
          entry.clientRowRef,
          committed.executionIds[index]!,
        ]),
      );
      const resolveAffectedPositionRefs = (): readonly string[] => Object.freeze([
        ...new Set(preview.groups.map((group) => {
          const allocations: JournalManualAllocationTarget[] = group.allocations.map(
            (allocation) => Object.freeze({
              executionId: executionIdByClientRow.get(allocation.clientRowRef)!,
              role: allocation.role,
              quantityDecimal: allocation.quantityDecimal,
            }),
          );
          const target = this.repository.resolveRoundTripForAllocations(
            accountScope,
            allocations,
          );
          return this.previews.positionRefForTarget(scope, target);
        })),
      ].sort());
      if (committed.status === "already_imported") {
        return Object.freeze({
          ...committed,
          affectedDates,
          affectedPositionRefs: resolveAffectedPositionRefs(),
          relatedDecisionIds: Object.freeze([]),
          rebuilds: Object.freeze([]),
          styledTradeCount: preview.groups.length,
        });
      }

      const timestamp = createCanonicalUtcTimestamp(now);
      const sourceUi = request.tracker === "swing"
        ? "swing_trade_tracker" as const
        : "day_trade_tracker" as const;
      const payloadSha256 = digestJournalManualTradePreviewPayload(
        canonicalJournalManualTradePreviewPayload({
          scope,
          accountSelectionRef,
          tracker: request.tracker,
          entries: request.entries,
        }),
      );
      for (const group of preview.groups) {
        const confirmation = confirmations.get(group.groupRef)!;
        const existing = group.existingPosition
          ? this.previews.resolvePositionRef(scope, group.existingPosition.positionRef)
          : null;
        this.repository.insertBoundaryAssertion({
          scope: accountScope,
          userId: scope.userId,
          importBatchId: committed.importBatchId,
          relationship: confirmation.relationship as Exclude<
            typeof confirmation.relationship,
            "not_finished"
          >,
          groupRef: group.groupRef,
          payloadSha256,
          roundTripId: existing?.roundTripId ?? null,
          roundTripVersionId: existing?.currentVersionId ?? null,
          expectedExistingVersion: existing?.version ?? null,
          sourceUi,
          idempotencyKey: request.idempotencyKey,
          timestamp,
        });
      }

      const sourceDecisions = this.decisions.openImportIssueDecisions(
        accountScope,
        committed.importBatchId,
        now,
      );
      const rebuilds = this.roundTrips.rebuildAccount(accountScope, {
        kind: "import_event",
        triggerId: committed.importEventId,
        now,
      });
      const chainDecisions = this.decisions.openRoundTripDecisionFindings(
        accountScope,
        rebuilds,
        now,
      );
      for (const group of preview.groups) {
        const confirmation = confirmations.get(group.groupRef)!;
        const allocations: JournalManualAllocationTarget[] = group.allocations.map(
          (allocation) => Object.freeze({
            executionId: executionIdByClientRow.get(allocation.clientRowRef)!,
            role: allocation.role,
            quantityDecimal: allocation.quantityDecimal,
          }),
        );
        if (allocations.some((allocation) => !allocation.executionId)) {
          platformFailure("TRADERLINK_MANUAL_TRADE_COMMIT_CONFLICT", {
            reason: "execution_result_mapping",
          });
        }
        const target = this.repository.resolveRoundTripForAllocations(
          accountScope,
          allocations,
        );
        this.repository.applyTradeStyle({
          scope: accountScope,
          userId: scope.userId,
          target,
          style: confirmation.style,
          preserveExistingStyle: group.existingPosition !== null,
          claimedEffectiveAtUtc: group.openedAtUtc,
          sourceUi,
          idempotencyKey: request.idempotencyKey,
          groupRef: group.groupRef,
          timestamp,
        });
      }
      return Object.freeze({
        ...committed,
        affectedDates,
        affectedPositionRefs: resolveAffectedPositionRefs(),
        relatedDecisionIds: Object.freeze([
          ...new Set([...sourceDecisions, ...chainDecisions]
            .map((decision: JournalDataDecisionRecord) => decision.decisionId)),
        ]),
        rebuilds,
        styledTradeCount: preview.groups.length,
      });
    });
    if (result.status !== "already_imported") {
      this.dailyTradeAnalyzer?.queueAfterJournalRebuild(
        accountScope,
        result.rebuilds.flatMap((rebuild) => rebuild.roundTripIds),
      );
    }
    return result;
  }
}
