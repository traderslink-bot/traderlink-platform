import "server-only";

import type Database from "better-sqlite3";

import type { AccountScope, WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { createCanonicalUtcTimestamp } from "@/src/modules/platform/server/database/platform-migration-contract";
import {
  notifyJournalOwnerOfDailyTradeAnalyzerFailure,
} from "@/src/modules/platform/server/notifications/platform-journal-owner-alert-service";
import { PlatformNotificationRepository } from "@/src/modules/platform/server/notifications/platform-notification-repository";

import type { DailyTradeAnalyzerTarget } from "./daily-trade-analyzer-repository";

function workspaceScope(scope: AccountScope): WorkspaceAccessScope {
  return Object.freeze({
    activeAccountId: scope.accountId,
    allowedAccountIds: Object.freeze([scope.accountId]),
    userId: scope.userId,
    workspaceId: scope.workspaceId,
    workspaceRole: scope.workspaceRole,
  });
}

/** Writes idempotent, account-scoped Trade Analyzer outcomes to Platform Notifications. */
export class DailyTradeAnalyzerNotificationService {
  constructor(private readonly database: Database.Database) {}

  notifyReady(input: Readonly<{
    occurredAt: Date;
    scope: AccountScope;
    target: DailyTradeAnalyzerTarget;
  }>): void {
    new PlatformNotificationRepository(this.database).create({
      category: "chart_update",
      destinationPath: `/trade-tracker/${input.target.tradingDateNewYork}?trade=${input.target.roundTripId}`,
      journalAccountId: input.scope.accountId,
      kind: "chart_update_ready",
      occurredAtUtc: createCanonicalUtcTimestamp(input.occurredAt),
      scope: workspaceScope(input.scope),
      sourceEventKey: `daily_trade_analysis_ready_${input.target.roundTripVersionId}`,
      summary: "Your Trade Analyzer update is ready to review.",
      title: "Trade Analyzer is ready",
    });
  }

  notifyNeedsCorrection(input: Readonly<{
    occurredAt: Date;
    scope: AccountScope;
    target: DailyTradeAnalyzerTarget;
  }>): void {
    new PlatformNotificationRepository(this.database).create({
      category: "chart_update",
      destinationPath: `/trade-tracker/${input.target.tradingDateNewYork}?trade=${input.target.roundTripId}`,
      journalAccountId: input.scope.accountId,
      kind: "chart_update_ready",
      occurredAtUtc: createCanonicalUtcTimestamp(input.occurredAt),
      scope: workspaceScope(input.scope),
      sourceEventKey: `daily_trade_analysis_needs_correction_${input.target.roundTripVersionId}`,
      summary: "Check the highlighted execution time and price, then edit and resubmit the trade.",
      title: "Trade Analyzer needs a correction",
    });
  }

  notifyFailure(input: Readonly<{
    occurredAt: Date;
    scope: AccountScope;
    target: DailyTradeAnalyzerTarget;
  }>): void {
    new PlatformNotificationRepository(this.database).create({
      category: "chart_update",
      destinationPath: `/trade-tracker/${input.target.tradingDateNewYork}?trade=${input.target.roundTripId}`,
      journalAccountId: input.scope.accountId,
      kind: "chart_update_ready",
      occurredAtUtc: createCanonicalUtcTimestamp(input.occurredAt),
      scope: workspaceScope(input.scope),
      sourceEventKey: `daily_trade_analysis_unavailable_${input.target.roundTripVersionId}`,
      summary: "Market data was unavailable for this trade. Review the execution details, then try the analysis again.",
      title: "Trade Analyzer needs review",
    });
    notifyJournalOwnerOfDailyTradeAnalyzerFailure({
      database: this.database,
      occurredAt: input.occurredAt,
      sourceEventKey: `daily_trade_analysis_failed_${input.target.roundTripVersionId}`,
    });
  }
}
