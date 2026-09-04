import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { narrowWorkspaceAccessToAccount } from "@/src/modules/platform/contracts/workspace-access-scope";
import type { DailyTradeAnalyzerQueueOutcome } from "@/src/modules/level-analysis/contracts/daily-trade-analyzer-contracts";
import type { SharedAnalyzerSelectionOutcome } from "@/src/modules/level-analysis/contracts/shared-analyzer-beta-contracts";
import type { LogicalTradeAnalyzerSelectionService } from "@/src/modules/level-analysis/server/logical-trade-analyzer-selection-service";
import type { JournalLogicalTradeService } from "../logical-trades/journal-logical-trade-service";
import {
  createCanonicalUtcTimestamp,
  platformFailure,
} from "@/src/modules/platform/server/database/platform-migration-contract";
import { PlatformNotificationRepository } from "@/src/modules/platform/server/notifications/platform-notification-repository";
import type {
  JournalManualTradeCommitRequest,
  JournalManualTradeCommitStatus,
  JournalManualTradeCommitStatusRequest,
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
  journalManualTradeFactKey,
  toManualExecutionInput,
} from "./journal-manual-trade-input";
import { JournalManualTradePreviewService } from "./journal-manual-trade-preview-service";

export type JournalManualTradeCommitResult = JournalImportCommitResult & Readonly<{
  affectedDates: readonly string[];
  affectedPositionRefs: readonly string[];
  affectedTradeTargets: readonly Readonly<{
    roundTripId: string;
    roundTripVersionId: string;
  }>[];
  analyzerQueueOutcome: DailyTradeAnalyzerQueueOutcome | null;
  analyzerSelectionOutcomes: readonly Readonly<{
    groupRef: string;
    outcome: SharedAnalyzerSelectionOutcome;
  }>[];
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
    private readonly logicalTradeAnalyzer?: LogicalTradeAnalyzerSelectionService,
    private readonly notifications?: PlatformNotificationRepository,
    private readonly logicalTrades?: JournalLogicalTradeService,
  ) {}

  committedStatus(
    scope: WorkspaceAccessScope,
    accountSelectionRef: string,
    request: JournalManualTradeCommitStatusRequest,
  ): JournalManualTradeCommitStatus {
    const accountId = scope.activeAccountId;
    if (!accountId) platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
    assertJournalManualTrackerEntryDates(request.tracker, request.entries);
    const payloadSha256 = digestJournalManualTradePreviewPayload(
      canonicalJournalManualTradePreviewPayload({
        scope,
        accountSelectionRef,
        tracker: request.tracker,
        workspaceStyle: request.workspaceStyle,
        entries: request.entries,
      }),
    );
    const committed = this.repository.findCommittedSubmission({
      scope: narrowWorkspaceAccessToAccount(scope, accountId),
      userId: scope.userId,
      idempotencyKey: request.idempotencyKey,
      payloadSha256,
    });
    return Object.freeze({
      committed: committed !== null,
      acceptedExecutionCount: committed?.acceptedExecutionCount ?? 0,
      affectedDates: Object.freeze([
        ...new Set(request.entries.map((entry) => entry.localDate)),
      ].sort()),
      pendingDecisionCount: committed?.pendingDecisionCount ?? 0,
    });
  }

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
      workspaceStyle: request.workspaceStyle,
      entries: request.entries,
      previewRef: request.previewRef,
    })) {
      platformFailure("TRADERLINK_MANUAL_TRADE_PREVIEW_INVALID");
    }

    return this.repository.immediate(() => {
      const exactOfflineDuplicate = request.offlineSync
        ? this.repository.hasExactManualBatchWithDifferentIdempotency({
            scope: accountScope,
            userId: scope.userId,
            idempotencyKey: request.idempotencyKey,
            factKeys: request.entries.map(journalManualTradeFactKey),
          })
        : false;
      if (
        exactOfflineDuplicate &&
        request.offlineSync?.duplicateResolution === "review_required"
      ) {
        platformFailure("TRADERLINK_MANUAL_TRADE_OFFLINE_DUPLICATE_CONFLICT");
      }
      if (
        !exactOfflineDuplicate &&
        request.offlineSync?.duplicateResolution === "save_separately"
      ) {
        platformFailure("TRADERLINK_MANUAL_TRADE_OFFLINE_DUPLICATE_CONFLICT", {
          reason: "duplicate_candidate_changed",
        });
      }
      const preview = this.previews.preview(scope, {
        accountSelectionRef,
        tracker: request.tracker,
        workspaceStyle: request.workspaceStyle,
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
        sourceDisplayLabel: request.preparedBy === "ai_chat"
          ? "AI Chat manual executions"
          : request.tracker === "workspace"
          ? "Workspace manual executions"
          : request.tracker === "swing"
          ? "Swing Trade Tracker manual executions"
          : request.tracker === "quick"
            ? "Quick Trade Entry manual executions"
            : "Daily Trade Tracker manual executions",
        entries: request.entries.map(toManualExecutionInput),
        confirmedTraderBoundaries: true,
        contentResolution: exactOfflineDuplicate &&
          request.offlineSync?.duplicateResolution === "save_separately"
          ? "trader_confirmed_separate"
          : "automatic",
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
      const resolveAffectedTradeTargets = () => {
        const targets = new Map<string, Readonly<{
          roundTripId: string;
          roundTripVersionId: string;
        }>>();
        for (const group of preview.groups) {
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
          targets.set(`${target.roundTripId}\u001f${target.roundTripVersionId}`, Object.freeze(target));
        }
        return Object.freeze([...targets.values()].sort((left, right) =>
          left.roundTripId.localeCompare(right.roundTripId) ||
          left.roundTripVersionId.localeCompare(right.roundTripVersionId)));
      };
      if (committed.status === "already_imported") {
        const affectedTradeTargets = resolveAffectedTradeTargets();
        const affectedPositionRefs = Object.freeze(affectedTradeTargets.map((target) =>
          this.previews.positionRefForTarget(scope, target)).sort());
        return Object.freeze({
          ...committed,
          affectedDates,
          affectedPositionRefs,
          affectedTradeTargets,
          relatedDecisionIds: Object.freeze([]),
          rebuilds: Object.freeze([]),
          styledTradeCount: preview.groups.length,
          analyzerQueueOutcome: null,
          analyzerSelectionOutcomes: Object.freeze([]),
        });
      }

      const timestamp = createCanonicalUtcTimestamp(now);
      const sourceUi = (request.tracker === "workspace"
        ? request.workspaceStyle === "swing"
        : request.tracker === "swing")
        ? "swing_trade_tracker" as const
        : "day_trade_tracker" as const;
      const payloadSha256 = digestJournalManualTradePreviewPayload(
        canonicalJournalManualTradePreviewPayload({
          scope,
          accountSelectionRef,
          tracker: request.tracker,
          workspaceStyle: request.workspaceStyle,
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
      const rebuilds = this.roundTrips.rebuildAffectedExecutionChains(
        accountScope,
        committed.executionIds,
        {
          kind: "import_event",
          triggerId: committed.importEventId,
          now,
        },
      );
      const chainDecisions = this.decisions.openRoundTripDecisionFindings(
        accountScope,
        rebuilds,
        now,
        new Set(rebuilds.map((rebuild) => rebuild.chainKeySha256)),
      );
      const openedDecisionCount = new Set([
        ...sourceDecisions,
        ...chainDecisions,
      ].map((decision: JournalDataDecisionRecord) => decision.decisionId)).size;
      if (openedDecisionCount > 0) {
        this.notifications?.create({
          category: "data_decision",
          destinationPath: "/data-decisions",
          journalAccountId: accountId,
          kind: "data_decision_needs_review",
          occurredAtUtc: timestamp,
          scope,
          sourceEventKey: `data_decision_manual_${committed.importBatchId}`,
          summary: "Some trade details need your confirmation before every affected result can be complete.",
          title: "Data Decisions need your review",
        });
      }
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
      const affectedTradeTargets = resolveAffectedTradeTargets();
      if (this.logicalTradeAnalyzer) {
        for (const target of affectedTradeTargets) {
          this.logicalTradeAnalyzer.materialize(accountScope, target.roundTripId, now);
        }
      }
      const affectedPositionRefs = Object.freeze(affectedTradeTargets.map((target) =>
        this.previews.positionRefForTarget(scope, target)).sort());
      const targetByGroupRef = new Map(preview.groups.map((group) => {
        const allocations: JournalManualAllocationTarget[] = group.allocations.map((allocation) => Object.freeze({
          executionId: executionIdByClientRow.get(allocation.clientRowRef)!,
          role: allocation.role,
          quantityDecimal: allocation.quantityDecimal,
        }));
        return [group.groupRef, this.repository.resolveRoundTripForAllocations(accountScope, allocations)] as const;
      }));
      const mergedRefs = new Set<string>();
      for (const merge of request.logicalTradeMerges ?? []) {
        if (merge.groupRefs.length < 2 || merge.groupRefs.some((ref) =>
          mergedRefs.has(ref) || !confirmations.has(ref) || !targetByGroupRef.has(ref))) {
          platformFailure("TRADERLINK_MANUAL_TRADE_RELATIONSHIP_CONFLICT", { reason: "merge_selection_changed" });
        }
        merge.groupRefs.forEach((ref) => mergedRefs.add(ref));
        if (!this.logicalTrades) {
          platformFailure("TRADERLINK_MANUAL_TRADE_RELATIONSHIP_CONFLICT", { reason: "merge_unavailable" });
        }
        const targets = merge.groupRefs.map((ref) => targetByGroupRef.get(ref)!);
        const current = this.logicalTrades.ensureMaterialized(accountScope, targets[0]!.roundTripId, now);
        const others = targets.slice(1).map((target) =>
          this.logicalTrades!.ensureMaterialized(accountScope, target.roundTripId, now));
        this.logicalTrades.merge(accountScope, targets[0]!.roundTripId, {
          expectedCurrentRevision: current.revision,
          fallbackRoundTripIds: Object.freeze([]),
          logicalTradeIds: Object.freeze(others.map((trade) => trade.logicalTradeId!)),
          tradeStyle: merge.tradeStyle,
        }, now);
      }
      const selectedGroups = new Set(request.analyzerGroupRefs ?? []);
      if ([...selectedGroups].some((groupRef) => !confirmations.has(groupRef))) {
        platformFailure("TRADERLINK_MANUAL_TRADE_RELATIONSHIP_CONFLICT", {
          reason: "analyzer_selection_changed",
        });
      }
      const analyzerSelectionOutcomes = this.logicalTradeAnalyzer
        ? Object.freeze(preview.groups.filter((group) => selectedGroups.has(group.groupRef)).map((group) => {
            const target = targetByGroupRef.get(group.groupRef)!;
            return Object.freeze({
              groupRef: group.groupRef,
              outcome: this.logicalTradeAnalyzer!.select(accountScope, target.roundTripId, now),
            });
          }))
        : Object.freeze([]);
      const analyzerQueueOutcome: DailyTradeAnalyzerQueueOutcome | null =
        analyzerSelectionOutcomes.some((selection) => selection.outcome === "queued")
          ? "queued"
          : analyzerSelectionOutcomes.length > 0 ? "not_eligible" : null;
      return Object.freeze({
        ...committed,
        affectedDates,
        affectedPositionRefs,
        affectedTradeTargets,
        relatedDecisionIds: Object.freeze([
          ...new Set([...sourceDecisions, ...chainDecisions]
            .map((decision: JournalDataDecisionRecord) => decision.decisionId)),
        ]),
        rebuilds,
        styledTradeCount: preview.groups.length,
        analyzerQueueOutcome,
        analyzerSelectionOutcomes,
      });
    });
  }
}
