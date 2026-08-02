import {
  narrowWorkspaceAccessToAccount,
  type WorkspaceAccessScope,
} from "@/src/modules/platform/contracts/workspace-access-scope";
import type { JournalDataDecisionRecord } from "../contracts/journal-decision-contracts";
import type { JournalChainRebuildResult } from "../contracts/journal-round-trip-contracts";
import { JournalDataDecisionService } from "./decisions/journal-data-decision-service";
import {
  type IbkrStatementCommitInput,
  type JournalImportCommitResult,
  type ManualExecutionBatchInput,
  JournalImportService,
} from "./imports/journal-import-service";
import { JournalImportRepository } from "./imports/journal-import-repository";
import { JournalRoundTripService } from "./round-trips/journal-round-trip-service";

export type JournalIntegrityCommitResult = JournalImportCommitResult & Readonly<{
  relatedDecisionIds: readonly string[];
  rebuilds: readonly JournalChainRebuildResult[];
}>;

export class JournalIntegrityCommandService {
  constructor(
    private readonly imports: JournalImportRepository,
    private readonly importService: JournalImportService,
    private readonly decisions: JournalDataDecisionService,
    private readonly roundTrips: JournalRoundTripService,
  ) {}

  commitIbkrStatement(
    scope: WorkspaceAccessScope,
    input: IbkrStatementCommitInput,
  ): JournalIntegrityCommitResult {
    return this.commit(scope, input.now, () =>
      this.importService.commitIbkrStatement(scope, input));
  }

  commitManualExecutions(
    scope: WorkspaceAccessScope,
    input: ManualExecutionBatchInput,
  ): JournalIntegrityCommitResult {
    return this.commit(scope, input.now, () =>
      this.importService.commitManualExecutions(scope, input));
  }

  private commit(
    workspaceScope: WorkspaceAccessScope,
    now: Date | undefined,
    operation: () => JournalImportCommitResult,
  ): JournalIntegrityCommitResult {
    return this.imports.immediate(() => {
      const committed = operation();
      const accountScope = narrowWorkspaceAccessToAccount(
        workspaceScope,
        committed.accountId,
      );
      if (committed.status === "already_imported") {
        const currentSourceDecisions = this.decisions.openImportIssueDecisions(
          accountScope,
          committed.importBatchId,
          now,
        ).filter((decision) => decision.state === "pending");
        return Object.freeze({
          ...committed,
          relatedDecisionIds: Object.freeze(
            currentSourceDecisions.map((decision) => decision.decisionId),
          ),
          rebuilds: Object.freeze([]),
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
      return Object.freeze({
        ...committed,
        relatedDecisionIds: Object.freeze([
          ...new Set([...sourceDecisions, ...chainDecisions]
            .map((decision: JournalDataDecisionRecord) => decision.decisionId)),
        ]),
        rebuilds,
      });
    });
  }
}
