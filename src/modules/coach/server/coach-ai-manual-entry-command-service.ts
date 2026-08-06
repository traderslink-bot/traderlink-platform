import { createHash } from "node:crypto";

import type Database from "better-sqlite3";

import {
  areCoachAiManualExecutionDraftRowsReady,
  type CoachAiManualEntryDraft,
  type CoachAiManualExecutionExtractionRow,
} from "../contracts/ai-manual-entry-draft-contracts";
import type {
  JournalManualTrackerKind,
  JournalManualTradeCommitRequest,
  JournalManualTradeEntry,
  JournalManualTradeGroupConfirmation,
  JournalManualTradePreview,
} from "@/src/modules/journal/contracts/journal-manual-trade-capture-contracts";
import type { JournalManualTradeCommitResult } from "@/src/modules/journal/server/manual-trades/journal-manual-trade-command-service";
import type { JournalIntegrityRuntime } from "@/src/modules/journal/server/journal-integrity-runtime";
import { currentJournalAccountSelectionRef } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";

import { CoachAiManualEntryDraftRepository } from "./coach-ai-manual-entry-draft-repository";

export type CoachAiManualEntryPreviewResult = Readonly<{
  draft: CoachAiManualEntryDraft;
  preview: JournalManualTradePreview;
}>;

export type CoachAiManualEntryCommitResult = Readonly<{
  draft: CoachAiManualEntryDraft;
  result: JournalManualTradeCommitResult | null;
}>;

function requireConversation(
  draft: CoachAiManualEntryDraft,
  conversationId: string,
): void {
  if (draft.conversationId !== conversationId) {
    platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
  }
}

function requireUnexpired(draft: CoachAiManualEntryDraft, now: Date): void {
  if (draft.expiresAtUtc !== null && draft.expiresAtUtc <= now.toISOString()) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
      field: "manualEntryDraftExpired",
    });
  }
}

function journalEntries(draft: CoachAiManualEntryDraft): readonly JournalManualTradeEntry[] {
  if (!areCoachAiManualExecutionDraftRowsReady(draft.rows)) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
      field: "manualEntryDraftRows",
    });
  }
  return Object.freeze(draft.rows.map((row) => Object.freeze({
    clientRowRef: row.clientRowRef,
    localDate: row.localDate,
    localTime: row.localTime,
    sourceTimezone: row.sourceTimezone,
    normalizedSymbol: row.normalizedSymbol,
    tradeCurrency: row.tradeCurrency,
    side: row.side,
    quantityDecimal: row.quantityDecimal,
    priceDecimal: row.priceDecimal,
    feesDecimal: row.feesDecimal,
  })));
}

function commitIdempotencyKey(draftId: string, clientRequestId: string): string {
  return createHash("sha256")
    .update("traderlink-coach-manual-entry-commit-v1\0", "utf8")
    .update(draftId, "utf8")
    .update("\0", "utf8")
    .update(clientRequestId, "utf8")
    .digest("hex");
}

export class CoachAiManualEntryCommandService {
  private readonly drafts: CoachAiManualEntryDraftRepository;

  constructor(
    database: Database.Database,
    private readonly journal: JournalIntegrityRuntime,
  ) {
    this.drafts = new CoachAiManualEntryDraftRepository(database);
  }

  preview(
    scope: WorkspaceAccessScope,
    input: Readonly<{
      conversationId: string;
      draftId: string;
      tracker: JournalManualTrackerKind;
      rows: readonly CoachAiManualExecutionExtractionRow[];
    }>,
    now = new Date(),
  ): CoachAiManualEntryPreviewResult {
    let draft = this.drafts.readDraft(scope, input.draftId);
    requireConversation(draft, input.conversationId);
    requireUnexpired(draft, now);
    draft = this.drafts.replaceDraftRows(scope, input.draftId, input.rows, now);
    if (draft.state === "draft") {
      draft = this.drafts.transitionDraft(scope, input.draftId, {
        state: "ready_for_confirmation",
      }, now);
    }
    if (draft.state !== "ready_for_confirmation") {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
        field: "manualEntryDraftState",
      });
    }
    const preview = this.journal.manualTradePreviews.preview(scope, {
      accountSelectionRef: currentJournalAccountSelectionRef(scope),
      tracker: input.tracker,
      entries: journalEntries(draft),
    });
    return Object.freeze({ draft, preview });
  }

  commit(
    scope: WorkspaceAccessScope,
    input: Readonly<{
      conversationId: string;
      draftId: string;
      tracker: JournalManualTrackerKind;
      previewRef: string;
      clientRequestId: string;
      confirmations: readonly JournalManualTradeGroupConfirmation[];
    }>,
    now = new Date(),
  ): CoachAiManualEntryCommitResult {
    return this.drafts.runAtomically(() => {
      let draft = this.drafts.readDraft(scope, input.draftId);
      requireConversation(draft, input.conversationId);
      if (draft.state === "committed") {
        return Object.freeze({ draft, result: null });
      }
      requireUnexpired(draft, now);
      if (draft.state !== "ready_for_confirmation") {
        platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
          field: "manualEntryDraftState",
        });
      }
      const request: JournalManualTradeCommitRequest & Readonly<{
        preparedBy: "ai_chat";
      }> = Object.freeze({
        tracker: input.tracker,
        entries: journalEntries(draft),
        previewRef: input.previewRef,
        expectedAccountSelectionRef: currentJournalAccountSelectionRef(scope),
        idempotencyKey: commitIdempotencyKey(input.draftId, input.clientRequestId),
        confirmations: input.confirmations,
        preparedBy: "ai_chat",
      });
      draft = this.drafts.transitionDraft(scope, input.draftId, {
        state: "confirmed_by_trader",
      }, now);
      draft = this.drafts.transitionDraft(scope, input.draftId, {
        state: "commit_pending",
      }, now);
      const result = this.journal.manualTrades.commit(
        scope,
        request.expectedAccountSelectionRef,
        request,
        now,
      );
      draft = this.drafts.transitionDraft(scope, input.draftId, {
        state: "committed",
        canonicalJournalReference: result.importBatchId,
      }, now);
      return Object.freeze({ draft, result });
    });
  }
}
