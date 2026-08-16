import "server-only";

import type Database from "better-sqlite3";

import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import {
  createCanonicalUtcTimestamp,
  createCanonicalUuidV4,
  platformFailure,
} from "@/src/modules/platform/server/database/platform-migration-contract";
import { JournalAccountRepository } from "../accounts/journal-account-repository";
import {
  MoomooExecutionImportAccountService,
  type MoomooLinkedAccountOption,
} from "./moomoo-execution-import-account-service";
import {
  planMoomooExecutionImport,
  planMoomooIncrementalExecutionImport,
} from "./moomoo-execution-import-planning";
import {
  MoomooExecutionImportRepository,
  type MoomooBrokerImportJobSummary,
} from "./moomoo-execution-import-repository";

export type SafeMoomooImportJob = Readonly<{
  state: MoomooBrokerImportJobSummary["state"];
  requestedStartDate: string;
  cutoffAtUtc: string;
  completedWorkUnits: number;
  totalWorkUnits: number;
  receivedFillCount: number;
  acceptedExecutionCount: number;
  existingExecutionCount: number;
  decisionRequiredCount: number;
  nextAttemptAtUtc: string | null;
  reportedToAdmin: boolean;
}>;

export type SafeMoomooLinkedImportAccount = MoomooLinkedAccountOption & Readonly<{
  latestImport: SafeMoomooImportJob | null;
}>;

function safeJob(job: MoomooBrokerImportJobSummary): SafeMoomooImportJob {
  return Object.freeze({
    state: job.state,
    requestedStartDate: job.requestedStartDate,
    cutoffAtUtc: job.cutoffAtUtc,
    completedWorkUnits: job.completedWorkUnits,
    totalWorkUnits: job.totalWorkUnits,
    receivedFillCount: job.receivedFillCount,
    acceptedExecutionCount: job.acceptedExecutionCount,
    existingExecutionCount: job.existingExecutionCount,
    decisionRequiredCount: job.decisionRequiredCount,
    nextAttemptAtUtc: job.nextAttemptAtUtc,
    reportedToAdmin: job.safeErrorCode === "moomoo_import_failed_reported",
  });
}

function localDateAt(instant: Date, timezone: string): string {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: timezone,
    year: "numeric",
  }).formatToParts(instant)
    .filter((part) => part.type !== "literal")
    .map((part) => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export class MoomooExecutionImportCommandService {
  private readonly repository: MoomooExecutionImportRepository;
  private readonly accounts: MoomooExecutionImportAccountService;

  constructor(
    private readonly database: Database.Database,
    private readonly now: () => Date = () => new Date(),
  ) {
    this.repository = new MoomooExecutionImportRepository(database);
    this.accounts = new MoomooExecutionImportAccountService(database, undefined, now);
  }

  list(
    scope: WorkspaceAccessScope,
    journalAccountId: string,
  ): readonly SafeMoomooLinkedImportAccount[] {
    const links = this.repository.listLinks(scope.workspaceId, journalAccountId);
    const publicLinks = this.accounts.listLinkedAccounts(scope, journalAccountId);
    return Object.freeze(publicLinks.map((publicLink) => {
      const link = links.find((candidate) =>
        candidate.privacySafeLabel === publicLink.label &&
        candidate.accountType === publicLink.accountType);
      if (!link) {
        platformFailure("TRADERLINK_BROKER_CONNECTION_STORAGE_INVALID", {
          stage: "linked_account_projection",
        });
      }
      const latest = this.repository.latestJobForLink(
        scope.workspaceId,
        journalAccountId,
        link.brokerAccountLinkId,
      );
      return Object.freeze({
        ...publicLink,
        latestImport: latest ? safeJob(latest) : null,
      });
    }));
  }

  start(input: Readonly<{
    scope: WorkspaceAccessScope;
    journalAccountId: string;
    linkRef: string;
    earliestExecutionDate: string;
  }>): SafeMoomooImportJob {
    const link = this.accounts.resolveLinkedAccount(input);
    const cutoff = this.now();
    const plan = planMoomooExecutionImport({
      cutoff,
      earliestExecutionDate: input.earliestExecutionDate,
      enabledMarketCodes: link.enabledMarketCodes,
      completedCoverage: this.repository.listCoverage(
        input.scope.workspaceId,
        input.journalAccountId,
        link.brokerAccountLinkId,
      ),
    });
    const account = new JournalAccountRepository(this.database).findActiveAccount(
      input.scope.workspaceId,
      input.journalAccountId,
    );
    if (!account) platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
    const timestamp = createCanonicalUtcTimestamp(cutoff);

    return this.repository.immediate(() => {
      const active = this.repository.activeJobForLink(
        input.scope.workspaceId,
        input.journalAccountId,
        link.brokerAccountLinkId,
      );
      if (active) return safeJob(active);

      const latest = this.repository.latestJobForLink(
        input.scope.workspaceId,
        input.journalAccountId,
        link.brokerAccountLinkId,
      );
      if (plan.ranges.length === 0) {
        if (!latest) {
          platformFailure("TRADERLINK_BROKER_CONNECTION_STORAGE_INVALID", {
            stage: "empty_initial_import_plan",
          });
        }
        return safeJob(latest);
      }
      if (!this.repository.readTrackerSettings(
        input.scope.workspaceId,
        input.journalAccountId,
      )) {
        this.repository.upsertTrackerSettings({
          workspaceId: input.scope.workspaceId,
          accountId: input.journalAccountId,
          settings: Object.freeze({
            trackerStartDate: localDateAt(cutoff, account.tradingTimezone),
            analyzerEligibilityPolicy: "active_paid_trading_dates",
          }),
          timestamp,
        });
      }
      const importKind = latest === null
        ? "initial_history" as const
        : input.earliestExecutionDate < latest.requestedStartDate
          ? "older_history" as const
          : "incremental_sync" as const;
      const brokerImportJobId = createCanonicalUuidV4();
      this.repository.createJob({
        brokerImportJobId,
        workspaceId: input.scope.workspaceId,
        accountId: input.journalAccountId,
        brokerAccountLinkId: link.brokerAccountLinkId,
        importKind,
        requestedStartDate: input.earliestExecutionDate,
        cutoffAtUtc: timestamp,
        exactStartMicroseconds: plan.exactStartMicroseconds,
        exactEndMicroseconds: plan.exactEndMicroseconds,
        ranges: plan.ranges,
        timestamp,
      });
      const created = this.repository.latestJobForLink(
        input.scope.workspaceId,
        input.journalAccountId,
        link.brokerAccountLinkId,
      );
      if (!created || created.brokerImportJobId !== brokerImportJobId) {
        platformFailure("TRADERLINK_BROKER_CONNECTION_STORAGE_INVALID", {
          stage: "import_job_creation",
        });
      }
      return safeJob(created);
    });
  }

  startLatest(input: Readonly<{
    scope: WorkspaceAccessScope;
    journalAccountId: string;
    linkRef: string;
  }>): SafeMoomooImportJob {
    const link = this.accounts.resolveLinkedAccount(input);
    const cutoff = this.now();
    return this.repository.immediate(() => {
      const active = this.repository.activeJobForLink(
        input.scope.workspaceId,
        input.journalAccountId,
        link.brokerAccountLinkId,
      );
      if (active) return safeJob(active);

      const latest = this.repository.latestJobForLink(
        input.scope.workspaceId,
        input.journalAccountId,
        link.brokerAccountLinkId,
      );
      if (!latest || latest.state !== "completed") {
        platformFailure("TRADERLINK_BROKER_CONNECTION_STORAGE_INVALID", {
          stage: "latest_import_requires_completed_history",
        });
      }
      const plan = planMoomooIncrementalExecutionImport({
        earliestExecutionDate: latest.requestedStartDate,
        enabledMarketCodes: link.enabledMarketCodes,
        latestCompletedCutoffAtUtc: latest.cutoffAtUtc,
        cutoff,
      });
      const timestamp = createCanonicalUtcTimestamp(cutoff);
      const brokerImportJobId = createCanonicalUuidV4();
      this.repository.createJob({
        brokerImportJobId,
        workspaceId: link.workspaceId,
        accountId: link.accountId,
        brokerAccountLinkId: link.brokerAccountLinkId,
        importKind: "incremental_sync",
        requestedStartDate: latest.requestedStartDate,
        cutoffAtUtc: timestamp,
        exactStartMicroseconds: plan.exactStartMicroseconds,
        exactEndMicroseconds: plan.exactEndMicroseconds,
        ranges: plan.ranges,
        timestamp,
      });
      const created = this.repository.latestJobForLink(
        input.scope.workspaceId,
        input.journalAccountId,
        link.brokerAccountLinkId,
      );
      if (!created || created.brokerImportJobId !== brokerImportJobId) {
        platformFailure("TRADERLINK_BROKER_CONNECTION_STORAGE_INVALID", {
          stage: "latest_import_job_creation",
        });
      }
      return safeJob(created);
    });
  }
}
