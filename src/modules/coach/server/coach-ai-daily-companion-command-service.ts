import type Database from "better-sqlite3";

import type {
  CoachAiDailyCompanionDraft,
  CoachAiDailyCompanionDraftProposal,
  CoachAiDailyNoteDraftField,
} from "../contracts/ai-daily-companion-contracts";
import { narrowWorkspaceAccessToAccount } from "@/src/modules/platform/contracts/workspace-access-scope";
import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";
import { JournalAnnotationRepository } from "@/src/modules/journal/server/annotations/journal-annotation-repository";
import { JournalAnnotationService } from "@/src/modules/journal/server/annotations/journal-annotation-service";
import { JournalRuleRepository } from "@/src/modules/journal/server/annotations/journal-rule-repository";

import { CoachAiDailyCompanionRepository } from "./coach-ai-daily-companion-repository";

export type CoachAiDailyCompanionConfirmResult = Readonly<{
  draft: CoachAiDailyCompanionDraft;
}>;

function editableText(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0 ||
      value.length > 10_000 || value.includes("\u0000")) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field });
  }
  return value.replace(/\r\n?/gu, "\n");
}

function requireConversation(draft: CoachAiDailyCompanionDraft, conversationId: string): void {
  if (draft.conversationId !== conversationId) {
    platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
  }
}

function requireSameProposalShape(
  original: CoachAiDailyCompanionDraftProposal,
  edited: CoachAiDailyCompanionDraftProposal,
): CoachAiDailyCompanionDraftProposal {
  if (original.kind !== edited.kind) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
      field: "dailyCompanionDraftKind",
    });
  }
  if (original.kind === "daily_note_draft" && edited.kind === "daily_note_draft") {
    const originalFields = original.updates.map((update) => update.field).sort();
    const editedFields = edited.updates.map((update) => update.field).sort();
    if (originalFields.length !== editedFields.length ||
        originalFields.some((field, index) => field !== editedFields[index])) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
        field: "dailyCompanionDraftFields",
      });
    }
    return Object.freeze({
      kind: edited.kind,
      updates: Object.freeze(edited.updates.map((update) => Object.freeze({
        field: update.field,
        content: editableText(update.content, update.field),
      }))),
    });
  }
  if (original.kind === "trade_note_draft" && edited.kind === "trade_note_draft") {
    if (original.tradeNumber !== edited.tradeNumber || original.ticker !== edited.ticker ||
        original.direction !== edited.direction) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
        field: "dailyCompanionTradeTarget",
      });
    }
    return Object.freeze({ ...original, content: editableText(edited.content, "tradeNote") });
  }
  if (original.kind === "current_focus_draft" && edited.kind === "current_focus_draft") {
    return Object.freeze({
      kind: edited.kind,
      currentFocuses: editableText(edited.currentFocuses, "currentFocuses"),
    });
  }
  platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
    field: "dailyCompanionDraft",
  });
}

function noteRevision(note: Readonly<{ revision: number }> | null): number | null {
  return note?.revision ?? null;
}

export class CoachAiDailyCompanionCommandService {
  private readonly drafts: CoachAiDailyCompanionRepository;
  private readonly annotations: JournalAnnotationService;

  constructor(database: Database.Database) {
    this.drafts = new CoachAiDailyCompanionRepository(database);
    this.annotations = new JournalAnnotationService(
      new JournalAnnotationRepository(database),
      new JournalRuleRepository(database),
    );
  }

  confirm(
    scope: WorkspaceAccessScope,
    input: Readonly<{
      conversationId: string;
      interactionId: string;
      editedProposal: CoachAiDailyCompanionDraftProposal;
    }>,
    now = new Date(),
  ): CoachAiDailyCompanionConfirmResult {
    return this.drafts.runAtomically(() => {
      let stored = this.drafts.readStoredDraft(scope, input.interactionId);
      requireConversation(stored.draft, input.conversationId);
      if (stored.draft.journalWriteState === "committed") {
        return Object.freeze({ draft: stored.draft });
      }
      if (stored.draft.disposition !== "proposed" ||
          stored.draft.journalWriteState !== "not_written") {
        platformFailure("TRADERLINK_JOURNAL_ANNOTATION_CONFLICT");
      }
      const edited = requireSameProposalShape(stored.draft.proposal, input.editedProposal);
      if (!scope.activeAccountId) platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
      const account = narrowWorkspaceAccessToAccount(scope, scope.activeAccountId);

      stored = this.drafts.accept(scope, input.interactionId, now);
      stored = this.drafts.markCommitPending(scope, input.interactionId);
      let reference: string;

      if (stored.storedContent.kind === "trade_note_draft" &&
          edited.kind === "trade_note_draft") {
        const current = this.annotations.readRoundTripNotes(
          account,
          [stored.storedContent.roundTripId],
        )[stored.storedContent.roundTripId] ?? null;
        if (noteRevision(current) !== stored.storedContent.expectedRevision) {
          platformFailure("TRADERLINK_JOURNAL_ANNOTATION_CONFLICT");
        }
        const saved = this.annotations.saveRoundTripNote(account, {
          roundTripId: stored.storedContent.roundTripId,
          expectedRevision: stored.storedContent.expectedRevision,
          technicalNote: current?.technicalNote ?? "",
          tradeNote: edited.content,
          now,
        });
        reference = `round_trip_note:${saved.roundTripNoteId}:${saved.revision}`;
      } else if ((stored.storedContent.kind === "daily_note_draft" ||
          stored.storedContent.kind === "current_focus_draft") &&
          (edited.kind === "daily_note_draft" || edited.kind === "current_focus_draft")) {
        const current = this.annotations.readDailyNote(account, stored.draft.tradingDate);
        if (noteRevision(current) !== stored.storedContent.expectedRevision) {
          platformFailure("TRADERLINK_JOURNAL_ANNOTATION_CONFLICT");
        }
        const values: Record<CoachAiDailyNoteDraftField, string> = {
          whatWorked: current?.whatWorked ?? "",
          whatNeedsWork: current?.whatNeedsWork ?? "",
          technicalRecap: current?.technicalRecap ?? "",
          anythingElse: current?.anythingElse ?? "",
        };
        let currentFocuses = current?.tomorrowsFocus ??
          this.annotations.readCurrentFocus(account, stored.draft.tradingDate);
        if (edited.kind === "daily_note_draft") {
          for (const update of edited.updates) values[update.field] = update.content;
        } else {
          currentFocuses = edited.currentFocuses;
        }
        const saved = this.annotations.saveDailyNote(account, {
          tradingDate: stored.draft.tradingDate,
          expectedRevision: stored.storedContent.expectedRevision,
          whatWorked: values.whatWorked,
          whatNeedsWork: values.whatNeedsWork,
          technicalRecap: values.technicalRecap,
          tomorrowsFocus: currentFocuses,
          anythingElse: values.anythingElse,
          now,
        });
        reference = `daily_note:${saved.dailyNoteId}:${saved.revision}`;
      } else {
        platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", {
          component: "dailyCompanionDraft",
        });
      }

      stored = this.drafts.markCommitted(scope, input.interactionId, reference);
      return Object.freeze({ draft: stored.draft });
    });
  }

  reject(
    scope: WorkspaceAccessScope,
    input: Readonly<{ conversationId: string; interactionId: string }>,
    now = new Date(),
  ): CoachAiDailyCompanionDraft {
    return this.drafts.runAtomically(() => {
      const stored = this.drafts.readStoredDraft(scope, input.interactionId);
      requireConversation(stored.draft, input.conversationId);
      return this.drafts.reject(scope, input.interactionId, now);
    });
  }
}
