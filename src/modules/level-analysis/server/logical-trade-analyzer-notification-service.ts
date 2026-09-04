import "server-only";

import type Database from "better-sqlite3";

import type { AccountScope, WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { createCanonicalUtcTimestamp } from "@/src/modules/platform/server/database/platform-migration-contract";
import { notifyJournalOwnerOfDailyTradeAnalyzerFailure } from "@/src/modules/platform/server/notifications/platform-journal-owner-alert-service";
import { PlatformNotificationRepository } from "@/src/modules/platform/server/notifications/platform-notification-repository";
import type { LogicalTradeAnalyzerTarget } from "./logical-trade-analyzer-repository";

function workspaceScope(scope: AccountScope): WorkspaceAccessScope {
  return Object.freeze({ activeAccountId: scope.accountId,
    allowedAccountIds: Object.freeze([scope.accountId]), userId: scope.userId,
    workspaceId: scope.workspaceId, workspaceRole: scope.workspaceRole });
}

export class LogicalTradeAnalyzerNotificationService {
  constructor(private readonly database: Database.Database) {}

  private create(input: Readonly<{ occurredAt: Date; scope: AccountScope;
    target: LogicalTradeAnalyzerTarget; kind: "ready" | "correction" | "failure" }>): void {
    const content = input.kind === "ready"
      ? { summary: "Your Trade Analyzer update is ready to review.", title: "Trade Analyzer is ready" }
      : input.kind === "correction"
        ? { summary: "Check the highlighted execution time and price, then edit and resubmit the trade.", title: "Trade Analyzer needs a correction" }
        : { summary: "Market data was unavailable for this trade. Review the execution details, then try the analysis again.", title: "Trade Analyzer needs review" };
    new PlatformNotificationRepository(this.database).create({
      category: "chart_update",
      destinationPath: `/trade-tracker/${input.target.tradingDateNewYork}?trade=${input.target.representativeRoundTripId}`,
      journalAccountId: input.scope.accountId,
      kind: "chart_update_ready",
      occurredAtUtc: createCanonicalUtcTimestamp(input.occurredAt),
      scope: workspaceScope(input.scope),
      sourceEventKey: `logical_trade_analysis_${input.kind}_${input.target.logicalTradeVersionId}`,
      summary: content.summary,
      title: content.title,
    });
    if (input.kind === "failure") {
      notifyJournalOwnerOfDailyTradeAnalyzerFailure({
        database: this.database,
        occurredAt: input.occurredAt,
        sourceEventKey: `logical_trade_analysis_failed_${input.target.logicalTradeVersionId}`,
      });
    }
  }

  notifyReady(input: Readonly<{ occurredAt: Date; scope: AccountScope; target: LogicalTradeAnalyzerTarget }>): void {
    this.create({ ...input, kind: "ready" });
  }

  notifyNeedsCorrection(input: Readonly<{ occurredAt: Date; scope: AccountScope; target: LogicalTradeAnalyzerTarget }>): void {
    this.create({ ...input, kind: "correction" });
  }

  notifyFailure(input: Readonly<{ occurredAt: Date; scope: AccountScope; target: LogicalTradeAnalyzerTarget }>): void {
    this.create({ ...input, kind: "failure" });
  }
}
