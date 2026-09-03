import type { AccountScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import {
  assertCanonicalUuidV4,
  createCanonicalUtcTimestamp,
  createCanonicalUuidV4,
  platformFailure,
} from "@/src/modules/platform/server/database/platform-migration-contract";
import type { JournalExecutionFacts, JournalExecutionState, JournalExecutionVersionRecord } from "../../contracts/journal-execution-contracts";
import {
  assertCanonicalJournalDecimal,
  assertJournalCurrency,
  assertJournalTimezone,
  assertJournalUtcTimestamp,
  assertJournalToken,
} from "../../contracts/journal-storage-values";
import { assertUtcMatchesJournalLocalTime } from "../imports/journal-value-normalization";
import { JournalExecutionRepository } from "./journal-execution-repository";

function validateFacts(facts: JournalExecutionFacts): void {
  assertCanonicalUuidV4(facts.instrumentId, "instrumentId");
  assertJournalCurrency(facts.tradeCurrency, "tradeCurrency");
  assertJournalTimezone(facts.sourceTimezone, "sourceTimezone");
  assertJournalToken(facts.timeParserVersion, "timeParserVersion");
  assertJournalUtcTimestamp(facts.executedAtUtc, "executedAtUtc");
  assertUtcMatchesJournalLocalTime(
    facts.sourceTimestampText,
    facts.sourceTimezone,
    facts.executedAtUtc,
  );
  assertCanonicalJournalDecimal(facts.quantityDecimal, "quantityDecimal", { positive: true });
  if (facts.priceDecimal !== null) assertCanonicalJournalDecimal(facts.priceDecimal, "priceDecimal", { positive: true });
  if (facts.feesDecimal !== null) assertCanonicalJournalDecimal(facts.feesDecimal, "feesDecimal");
  if (facts.feeCurrency !== null) assertJournalCurrency(facts.feeCurrency, "feeCurrency");
  if (
    (facts.priceDecimal === null) !== (facts.factCompleteness === "price_missing") ||
    (facts.feesDecimal === null) !== (facts.feeCurrency === null) ||
    (facts.feesDecimal === null) !== (facts.feeSignConvention === "not_reported")
  ) platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "executionFacts" });
}

export class JournalExecutionService {
  constructor(private readonly repository: JournalExecutionRepository) {}

  appendCorrection(
    scope: AccountScope,
    input: Readonly<{
      executionId: string;
      expectedCurrentVersionId: string;
      state: Extract<JournalExecutionState, "accepted" | "needs_decision" | "excluded_by_trader">;
      facts: JournalExecutionFacts;
      changeReasonCode: string;
      importBatchId: string;
      sourceRowId: string;
      now?: Date;
    }>,
  ): JournalExecutionVersionRecord {
    assertCanonicalUuidV4(input.executionId, "executionId");
    assertCanonicalUuidV4(input.expectedCurrentVersionId, "expectedCurrentVersionId");
    assertCanonicalUuidV4(input.importBatchId, "importBatchId");
    assertCanonicalUuidV4(input.sourceRowId, "sourceRowId");
    assertJournalToken(input.changeReasonCode, "changeReasonCode");
    validateFacts(input.facts);
    const current = this.repository.current(input.executionId, scope.workspaceId, scope.accountId);
    if (
      !current ||
      current.currentVersionId !== input.expectedCurrentVersionId ||
      current.currentState === "superseded" ||
      (current.currentState === "excluded_by_trader" && input.state !== "excluded_by_trader")
    ) {
      platformFailure("TRADERLINK_JOURNAL_EXECUTION_CONFLICT");
    }
    const timestamp = createCanonicalUtcTimestamp(input.now);
    return this.repository.immediate(() => {
      const version = this.repository.appendVersion({
        executionId: input.executionId,
        executionVersionId: createCanonicalUuidV4(),
        workspaceId: scope.workspaceId,
        accountId: scope.accountId,
        expectedCurrentVersionId: input.expectedCurrentVersionId,
        versionNumber: current.versionNumber + 1,
        state: input.state,
        facts: input.facts,
        actorKind: "user",
        actorUserId: scope.userId,
        changeReasonCode: input.changeReasonCode,
        timestamp,
      });
      this.repository.insertProvenance({
        executionProvenanceId: createCanonicalUuidV4(),
        workspaceId: scope.workspaceId,
        accountId: scope.accountId,
        executionId: input.executionId,
        executionVersionId: version.executionVersionId,
        importBatchId: input.importBatchId,
        sourceRowId: input.sourceRowId,
        provenanceKind: "correction",
        providerIdentitySchemeVersion: null,
        providerIdentitySha256: null,
        timestamp,
      });
      return version;
    });
  }
}
