import "server-only";

import type Database from "better-sqlite3";

import { recordMoomooOperationFailure } from "@/src/modules/platform/server/broker-connections/moomoo-operation-observability";
import {
  createCanonicalUtcTimestamp,
  createCanonicalUuidV4,
} from "@/src/modules/platform/server/database/platform-migration-contract";
import { planMoomooIncrementalExecutionImport } from "./moomoo-execution-import-planning";
import { MoomooExecutionImportRepository } from "./moomoo-execution-import-repository";

const DEFAULT_INCREMENTAL_INTERVAL_MINUTES = 15;

function incrementalIntervalMinutes(environment: NodeJS.ProcessEnv): number {
  const value = environment.TRADERLINK_MOOMOO_INCREMENTAL_SYNC_MINUTES?.trim();
  if (!value) return DEFAULT_INCREMENTAL_INTERVAL_MINUTES;
  if (!/^\d{1,4}$/u.test(value)) return DEFAULT_INCREMENTAL_INTERVAL_MINUTES;
  const parsed = Number(value);
  return parsed >= 1 && parsed <= 1_440
    ? parsed
    : DEFAULT_INCREMENTAL_INTERVAL_MINUTES;
}
export class MoomooExecutionImportScheduler {
  private readonly repository: MoomooExecutionImportRepository;

  constructor(
    private readonly database: Database.Database,
    private readonly now: () => Date = () => new Date(),
    private readonly environment: NodeJS.ProcessEnv = process.env,
  ) {
    this.repository = new MoomooExecutionImportRepository(database);
  }

  scheduleDue(): number {
    const cutoff = this.now();
    const intervalMinutes = incrementalIntervalMinutes(this.environment);
    const dueBefore = new Date(cutoff.getTime() - intervalMinutes * 60_000);
    const candidates = this.repository.listIncrementalCandidates(
      createCanonicalUtcTimestamp(dueBefore),
    );
    let scheduled = 0;
    for (const candidate of candidates) {
      try {
        const created = this.repository.immediate(() => {
          const currentLink = this.repository.findLinkById(
            candidate.link.workspaceId,
            candidate.link.accountId,
            candidate.link.brokerAccountLinkId,
          );
          const latest = this.repository.latestJobForLink(
            candidate.link.workspaceId,
            candidate.link.accountId,
            candidate.link.brokerAccountLinkId,
          );
          if (
            !currentLink || currentLink.state !== "active" ||
            !latest || latest.state !== "completed" ||
            latest.cutoffAtUtc !== candidate.latestCompletedCutoffAtUtc ||
            this.repository.activeJobForLink(
              candidate.link.workspaceId,
              candidate.link.accountId,
              candidate.link.brokerAccountLinkId,
            )
          ) return false;
          const plan = planMoomooIncrementalExecutionImport({
            earliestExecutionDate: candidate.requestedStartDate,
            enabledMarketCodes: currentLink.enabledMarketCodes,
            latestCompletedCutoffAtUtc: latest.cutoffAtUtc,
            cutoff,
          });
          const timestamp = createCanonicalUtcTimestamp(cutoff);
          this.repository.createJob({
            brokerImportJobId: createCanonicalUuidV4(),
            workspaceId: currentLink.workspaceId,
            accountId: currentLink.accountId,
            brokerAccountLinkId: currentLink.brokerAccountLinkId,
            importKind: "incremental_sync",
            requestedStartDate: candidate.requestedStartDate,
            cutoffAtUtc: timestamp,
            exactStartMicroseconds: plan.exactStartMicroseconds,
            exactEndMicroseconds: plan.exactEndMicroseconds,
            ranges: plan.ranges,
            timestamp,
          });
          return true;
        });
        if (created) scheduled += 1;
      } catch (error) {
        recordMoomooOperationFailure({
          database: this.database,
          error,
          stage: "incremental_schedule",
          now: cutoff,
        });
      }
    }
    return scheduled;
  }
}
