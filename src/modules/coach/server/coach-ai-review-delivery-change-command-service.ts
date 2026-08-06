import type Database from "better-sqlite3";

import type {
  CoachAiReviewDeliveryChangeDraft,
  CoachAiReviewDeliveryChangeExtraction,
} from "../contracts/ai-review-delivery-change-contracts";
import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";

import { CoachAiReviewDeliveryChangeRepository } from "./coach-ai-review-delivery-change-repository";
import { CoachReviewDeliveryScheduleRepository } from "./coach-weekly-review-schedule-repository";

export class CoachAiReviewDeliveryChangeCommandService {
  private readonly drafts: CoachAiReviewDeliveryChangeRepository;
  private readonly schedules: CoachReviewDeliveryScheduleRepository;

  constructor(database: Database.Database) {
    this.drafts = new CoachAiReviewDeliveryChangeRepository(database);
    this.schedules = new CoachReviewDeliveryScheduleRepository(database);
  }

  confirm(
    scope: WorkspaceAccessScope,
    input: Readonly<{
      conversationId: string;
      draftId: string;
      editedProposal: CoachAiReviewDeliveryChangeExtraction;
    }>,
    now = new Date(),
  ): CoachAiReviewDeliveryChangeDraft {
    return this.drafts.runAtomically(() => {
      let draft = this.drafts.read(scope, input.draftId);
      if (draft.conversationId !== input.conversationId) {
        platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
      }
      if (draft.disposition === "confirmed" && draft.settingsWriteState === "committed") {
        return draft;
      }
      if (draft.disposition === "expired" || now.toISOString() >= draft.expiresAtUtc) {
        return this.drafts.expire(scope, input.draftId, now);
      }
      draft = this.drafts.beginConfirm(scope, input.draftId, now);
      const saved = this.schedules.save(scope, {
        weeklyDeliveryDay: input.editedProposal.weeklyDeliveryDay,
        deliveryTimeEastern: input.editedProposal.deliveryTimeEastern,
        expectedUpdatedAtUtc: draft.current.updatedAtUtc,
        ...(draft.current.updatedAtUtc ? {
          expectedWeeklyDeliveryDay: draft.current.weeklyDeliveryDay,
          expectedDeliveryTimeEastern: draft.current.deliveryTimeEastern,
        } : {}),
      }, now);
      return this.drafts.markCommitted(
        scope,
        input.draftId,
        `review_delivery:${saved.updatedAtUtc}`,
      );
    });
  }

  reject(
    scope: WorkspaceAccessScope,
    input: Readonly<{ conversationId: string; draftId: string }>,
    now = new Date(),
  ): CoachAiReviewDeliveryChangeDraft {
    return this.drafts.runAtomically(() => {
      const draft = this.drafts.read(scope, input.draftId);
      if (draft.conversationId !== input.conversationId) {
        platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
      }
      return this.drafts.reject(scope, input.draftId, now);
    });
  }
}
