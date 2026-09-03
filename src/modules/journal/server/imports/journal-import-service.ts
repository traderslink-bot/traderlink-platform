import { createHash, createHmac } from "node:crypto";
import Decimal from "decimal.js";

import type {
  IbkrActivityStatementPreview,
  JournalImportPreview,
  JournalScopedImportPreview,
  JournalAdapterExecution,
  JournalAdapterSourceRow,
  JournalImportIssue,
} from "../../contracts/journal-import-contracts";
import type { JournalExecutionFacts } from "../../contracts/journal-execution-contracts";
import type { JournalManualExecutionCandidate } from "../../contracts/journal-execution-reconciliation-contracts";
import {
  assertCanonicalJournalDecimal,
  assertJournalCurrency,
  assertJournalTimezone,
} from "../../contracts/journal-storage-values";
import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import {
  createCanonicalUtcTimestamp,
  createCanonicalUuidV4,
  platformFailure,
  TraderLinkPlatformError,
} from "@/src/modules/platform/server/database/platform-migration-contract";
import type { JournalAccountService } from "../accounts/journal-account-service";
import { JournalExecutionRepository } from "../executions/journal-execution-repository";
import { previewIbkrActivityStatement } from "./ibkr-activity-statement-adapter";
import {
  type JournalGenericMappedStatementPreview,
  type JournalGenericStatementMappingContract,
  normalizeJournalConfirmedBrokerName,
  parseJournalGenericStatementMappingContract,
  previewGenericMappedStatement,
} from "./journal-generic-mapped-statement-adapter";
import { MAPPED_STATEMENT_SOURCE_ACCOUNT_CANONICALIZATION_VERSION } from "../accounts/mapped-statement-source-account-canonicalizer";
import {
  type ExistingImportBatch,
  JournalImportRepository,
} from "./journal-import-repository";
import {
  assertUtcMatchesJournalLocalTime,
  normalizeIbkrExecutionTime,
  normalizeJournalStockSymbol,
} from "./journal-value-normalization";
import { calculateSourceFileEvidence } from "./record-preserving-csv";
import { JournalExecutionReconciliationRepository } from "../reconciliation/journal-execution-reconciliation-repository";

type JournalPrivacyPurpose = "broker_execution" | "execution_content";

export type JournalPrivacyHmacConfiguration = Readonly<{
  activeKeyVersion: string;
  keysBase64: Readonly<Record<string, string>>;
}>;

export const TRADERLINK_PLATFORM_JOURNAL_HMAC_ACTIVE_KEY_VERSION_ENV =
  "TRADERLINK_PLATFORM_JOURNAL_HMAC_ACTIVE_KEY_VERSION" as const;
export const TRADERLINK_PLATFORM_JOURNAL_HMAC_KEYS_JSON_ENV =
  "TRADERLINK_PLATFORM_JOURNAL_HMAC_KEYS_JSON" as const;

export type JournalPrivacyDigest = Readonly<{
  schemeVersion: string;
  digestSha256: string;
}>;

export type JournalPrivacyDigester = Readonly<{
  activeSchemeVersion: string;
  schemeVersions: readonly string[];
  activeDigest(purpose: JournalPrivacyPurpose, value: string): JournalPrivacyDigest;
  candidateDigests(purpose: JournalPrivacyPurpose, value: string): readonly JournalPrivacyDigest[];
}>;

export function loadJournalPrivacyHmacConfiguration(
  environment: NodeJS.ProcessEnv = process.env,
): JournalPrivacyHmacConfiguration {
  const activeKeyVersion = environment[
    TRADERLINK_PLATFORM_JOURNAL_HMAC_ACTIVE_KEY_VERSION_ENV
  ];
  const encodedMap = environment[TRADERLINK_PLATFORM_JOURNAL_HMAC_KEYS_JSON_ENV];
  if (!activeKeyVersion || !encodedMap) {
    platformFailure("TRADERLINK_JOURNAL_PRIVACY_CONFIGURATION_INVALID");
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(encodedMap);
  } catch (error) {
    platformFailure("TRADERLINK_JOURNAL_PRIVACY_CONFIGURATION_INVALID", {}, error);
  }
  if (
    !parsed ||
    typeof parsed !== "object" ||
    Array.isArray(parsed) ||
    Object.values(parsed).some((value) => typeof value !== "string")
  ) {
    platformFailure("TRADERLINK_JOURNAL_PRIVACY_CONFIGURATION_INVALID");
  }
  const configuration = Object.freeze({
    activeKeyVersion,
    keysBase64: Object.freeze({ ...(parsed as Record<string, string>) }),
  });
  createJournalPrivacyDigester(configuration);
  return configuration;
}

function privacyDigest(
  key: Buffer,
  schemeVersion: string,
  purpose: JournalPrivacyPurpose,
  value: string,
): JournalPrivacyDigest {
  return Object.freeze({
    schemeVersion,
    digestSha256: createHmac("sha256", key)
      .update(["traderlink-journal-identity-v1", purpose, value].join("\u001f"), "utf8")
      .digest("hex"),
  });
}

export function createJournalPrivacyDigester(
  input: JournalPrivacyHmacConfiguration,
): JournalPrivacyDigester {
  const tokenPattern = /^[a-z][a-z0-9_-]*$/u;
  const requireConfigurationToken = (
    value: unknown,
    maximumLength: number,
  ): string => {
    if (
      typeof value !== "string" ||
      value.length > maximumLength ||
      !tokenPattern.test(value)
    ) {
      platformFailure("TRADERLINK_JOURNAL_PRIVACY_CONFIGURATION_INVALID");
    }
    return value;
  };
  if (
    !input ||
    typeof input !== "object" ||
    !input.keysBase64 ||
    typeof input.keysBase64 !== "object" ||
    Array.isArray(input.keysBase64)
  ) {
    platformFailure("TRADERLINK_JOURNAL_PRIVACY_CONFIGURATION_INVALID");
  }
  const activeKeyVersion = requireConfigurationToken(
    input.activeKeyVersion,
    48,
  );
  const keys = Object.entries(input.keysBase64)
    .sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0)
    .map(([keyVersion, encoded]) => {
      requireConfigurationToken(keyVersion, 48);
      if (typeof encoded !== "string") {
        platformFailure("TRADERLINK_JOURNAL_PRIVACY_CONFIGURATION_INVALID");
      }
      const key = Buffer.from(encoded, "base64");
      if (key.length < 32 || key.toString("base64") !== encoded) {
        platformFailure("TRADERLINK_JOURNAL_PRIVACY_CONFIGURATION_INVALID");
      }
      const schemeVersion = `journal_hmac_v1_${keyVersion}`;
      requireConfigurationToken(schemeVersion, 64);
      return Object.freeze({
        keyVersion,
        schemeVersion,
        key,
      });
    });
  const active = keys.find((candidate) => candidate.keyVersion === activeKeyVersion);
  if (!active) {
    platformFailure("TRADERLINK_JOURNAL_PRIVACY_CONFIGURATION_INVALID");
  }
  return Object.freeze({
    activeSchemeVersion: active.schemeVersion,
    schemeVersions: Object.freeze(keys.map((candidate) => candidate.schemeVersion)),
    activeDigest(purpose, value) {
      return privacyDigest(active.key, active.schemeVersion, purpose, value);
    },
    candidateDigests(purpose, value) {
      return Object.freeze(keys.map((candidate) =>
        privacyDigest(candidate.key, candidate.schemeVersion, purpose, value)));
    },
  });
}

export type JournalImportCommitResult = Readonly<{
  status: "committed" | "already_imported";
  importBatchId: string;
  importEventId: string;
  accountId: string;
  preservedRowCount: number;
  createdExecutionCount: number;
  matchedExecutionCount: number;
  pendingSourceDecisionCount: number;
  executionIds: readonly string[];
}>;

export type ManualExecutionInput = Readonly<{
  sourceTimestampText: string;
  sourceTimezone: string;
  executedAtUtc?: string;
  normalizedSymbol: string;
  tradeCurrency: string;
  side: "buy" | "sell";
  quantityDecimal: string;
  priceDecimal: string | null;
  feesDecimal: string | null;
  feeCurrency: string | null;
  feeSignConvention: "not_reported" | "broker_reported_signed" | "cash_effect";
  tradeIntent?: "not_set" | "day_trade" | "swing";
}>;

export type IbkrStatementCommitInput = Readonly<{
  sourceBytes: Uint8Array;
  sourceTimezone: string;
  privacySafeAccountDisplay: string;
  sourceDisplayLabel: string;
  evidenceObjectKey: string;
  confirmedSourceIdentityAccountId?: string;
  now?: Date;
}>;

export type GenericMappedStatementCommitInput = Readonly<{
  sourceBytes: Uint8Array;
  accountId: string;
  mapping: JournalGenericStatementMappingContract;
  sourceDisplayLabel: string;
  evidenceObjectKey: string;
  now?: Date;
}>;

export type ManualExecutionBatchInput = Readonly<{
  accountId: string;
  idempotencyKey: string;
  sourceDisplayLabel: string;
  entries: readonly ManualExecutionInput[];
  confirmedTraderBoundaries?: boolean;
  contentResolution?: "automatic" | "trader_confirmed_separate";
  now?: Date;
}>;

export type MoomooApiFillInput = Readonly<{
  providerExecutionIdentity: string;
  normalizedSymbol: string;
  tradeCurrency: string;
  side: "buy" | "sell";
  quantityDecimal: string;
  priceDecimal: string;
  createdMicroseconds: number;
  updatedMicroseconds: number;
}>;

export type MoomooApiFillBatchInput = Readonly<{
  accountId: string;
  sourceIdentityId: string;
  pageIdentitySha256: string;
  evidenceObjectKey: string;
  sourceDisplayLabel: string;
  fills: readonly MoomooApiFillInput[];
  now?: Date;
}>;

type PlannedExecution = Readonly<{
  execution: JournalAdapterExecution;
  activeStrongAliasSha256: string | null;
  activeContentAliasSha256: string;
  matchedExecutionId: string | null;
  ambiguous: boolean;
  factConflict: boolean;
  enrichFromIncoming: boolean;
  attachContentAlias: boolean;
  reconciliation: Readonly<{
    kind: "one_to_one" | "grouped_fills";
    overlapKeySha256: string;
    evidenceSha256: string;
    manualExecutionIds: readonly string[];
  }> | null;
}>;

type PlannedReconciliation = NonNullable<PlannedExecution["reconciliation"]>;

const ReconciliationDecimal = Decimal.clone({
  precision: 160,
  rounding: Decimal.ROUND_HALF_UP,
  toExpNeg: -1000,
  toExpPos: 1000,
});

function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function sourceRecordIdentity(sourceIdentity: string, recordOrdinal: number): string {
  return sha256(["journal-source-record-v1", sourceIdentity, String(recordOrdinal)].join("\u001f"));
}

function safeLabel(value: string): void {
  if (
    value.trim() !== value ||
    value.length < 1 ||
    value.length > 120 ||
    /[\u0000-\u001f\u007f]/u.test(value)
  ) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "sourceDisplayLabel" });
  }
}

function executionFacts(execution: JournalAdapterExecution, instrumentId: string): JournalExecutionFacts {
  return Object.freeze({
    instrumentId,
    tradeCurrency: execution.tradeCurrency,
    sourceTimestampText: execution.sourceTimestampText,
    sourceTimezone: execution.sourceTimezone,
    timeParserVersion: execution.timeParserVersion,
    executedAtUtc: execution.executedAtUtc,
    sourceOrderKey: execution.sourceOrderKey,
    side: execution.side,
    quantityDecimal: execution.quantityDecimal,
    priceDecimal: execution.priceDecimal,
    feesDecimal: execution.feesDecimal,
    feeCurrency: execution.feeCurrency,
    feeSignConvention: execution.feeSignConvention,
    factCompleteness: execution.factCompleteness,
  });
}

function localDateAtUtc(executedAtUtc: string, tradingTimezone: string): string {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-CA", {
    timeZone: tradingTimezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(executedAtUtc)).filter((part) => part.type !== "literal")
    .map((part) => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function createPrivacySafeIbkrPreview(
  preview: IbkrActivityStatementPreview,
): JournalImportPreview {
  return createPrivacySafeAdapterPreview(preview, preview.rawSourceAccountId !== null);
}

function createPrivacySafeAdapterPreview(
  preview: IbkrActivityStatementPreview | JournalGenericMappedStatementPreview,
  hasSourceAccountIdentity: boolean,
): JournalImportPreview {
  const rowsByClassification: JournalImportPreview["rowsByClassification"] = Object.freeze({
    mapped_execution: preview.rows.filter((row) => row.classification === "mapped_execution").length,
    mapped_position_fact: preview.rows.filter((row) => row.classification === "mapped_position_fact").length,
    mapped_coverage_fact: preview.rows.filter((row) => row.classification === "mapped_coverage_fact").length,
    automatic_non_execution: preview.rows.filter((row) => row.classification === "automatic_non_execution").length,
    unsupported: preview.rows.filter((row) => row.classification === "unsupported").length,
    needs_correction: preview.rows.filter((row) => row.classification === "needs_correction").length,
  });
  const issueGroups = new Map<string, JournalImportPreview["issues"][number]>();
  for (const issue of preview.issues) {
    const key = `${issue.issueCode}\u001f${issue.severity}\u001f${issue.isBlocking ? "1" : "0"}`;
    const prior = issueGroups.get(key);
    issueGroups.set(key, Object.freeze({
      issueCode: issue.issueCode,
      severity: issue.severity,
      isBlocking: issue.isBlocking,
      count: (prior?.count ?? 0) + 1,
    }));
  }
  return Object.freeze({
    adapterId: preview.adapterId,
    adapterVersion: preview.adapterVersion,
    parserVersion: preview.parserVersion,
    mappingVersion: preview.mappingVersion,
    sourceFileSha256: preview.sourceFileSha256,
    sourceFileSizeBytes: preview.sourceFileSizeBytes,
    statementPeriodStartDate: preview.statementPeriodStartDate,
    statementPeriodEndDate: preview.statementPeriodEndDate,
    sourceTimezone: preview.sourceTimezone,
    hasSourceAccountIdentity,
    canCommit: hasSourceAccountIdentity &&
      !preview.issues.some((issue) => issue.isBlocking),
    preservedRowCount: preview.rows.length,
    mappedExecutionCount: preview.executions.length,
    mappedPositionFactCount: preview.positionFacts.length,
    unsupportedRowCount: rowsByClassification.unsupported,
    rowsByClassification,
    issues: Object.freeze([...issueGroups.values()].sort((left, right) =>
      left.issueCode.localeCompare(right.issueCode) ||
      left.severity.localeCompare(right.severity)).map((issue) => Object.freeze({
        issueCode: issue.issueCode,
        severity: issue.severity,
        isBlocking: issue.isBlocking,
        count: issue.count,
      }))),
    coverageIntervals: Object.freeze(preview.coverageIntervals.map((interval) =>
      Object.freeze({
        assetClass: interval.assetClass,
        coverageKind: interval.coverageKind,
        localStartDate: interval.localStartDate,
        localEndDate: interval.localEndDate,
        sourceTimezone: interval.sourceTimezone,
      }))),
  });
}

export class JournalImportService {
  constructor(
    private readonly imports: JournalImportRepository,
    private readonly executions: JournalExecutionRepository,
    private readonly accounts: JournalAccountService,
    private readonly digester: JournalPrivacyDigester,
    private readonly reconciliations: JournalExecutionReconciliationRepository,
  ) {}

  private plannedDecisionCount(plans: readonly PlannedExecution[]): number {
    const reconciliationKeys = new Set<string>();
    let legacyAmbiguityCount = 0;
    for (const plan of plans) {
      if (plan.reconciliation) {
        reconciliationKeys.add(plan.reconciliation.overlapKeySha256);
      } else if (plan.ambiguous) {
        legacyAmbiguityCount += 1;
      }
    }
    return reconciliationKeys.size + legacyAmbiguityCount;
  }

  private overlapIssues(plans: readonly PlannedExecution[]): readonly JournalImportIssue[] {
    const issues: JournalImportIssue[] = [];
    const seenReconciliations = new Set<string>();
    for (const plan of plans) {
      if (!plan.ambiguous) continue;
      if (plan.reconciliation) {
        if (seenReconciliations.has(plan.reconciliation.overlapKeySha256)) continue;
        seenReconciliations.add(plan.reconciliation.overlapKeySha256);
      }
      issues.push(Object.freeze({
        recordOrdinal: plan.execution.recordOrdinal,
        issueScope: "execution" as const,
        issueCode: plan.reconciliation
          ? plan.reconciliation.kind === "grouped_fills"
            ? "manual_broker_grouped_fill_candidate"
            : "manual_broker_possible_duplicate"
          : plan.factConflict
            ? "overlap_fact_conflict"
            : "overlap_count_ambiguous",
        severity: "warning" as const,
        isBlocking: false,
        chainHint: Object.freeze({
          normalizedSymbol: plan.execution.normalizedSymbol,
          assetClass: plan.execution.assetClass,
          tradeCurrency: plan.execution.tradeCurrency,
          effectiveAtUtc: plan.execution.executedAtUtc,
        }),
      }));
    }
    return Object.freeze(issues);
  }

  private alreadyImportedResult(
    scope: WorkspaceAccessScope,
    prior: ExistingImportBatch,
  ): JournalImportCommitResult {
    this.accounts.requireAccountScope(scope, prior.accountId);
    return Object.freeze({
      status: "already_imported",
      importBatchId: prior.importBatchId,
      importEventId: prior.currentEventId,
      accountId: prior.accountId,
      preservedRowCount: prior.preservedRowCount,
      createdExecutionCount: 0,
      matchedExecutionCount: 0,
      pendingSourceDecisionCount: prior.pendingDecisionCount,
      executionIds: this.imports.listExecutionIdsForBatch(
        scope.workspaceId,
        prior.accountId,
        prior.importBatchId,
      ),
    });
  }

  private requireMatchingManualPayload(
    scope: WorkspaceAccessScope,
    prior: ExistingImportBatch,
    rows: readonly JournalAdapterSourceRow[],
  ): void {
    const priorFields = this.imports.listSourceRowFieldsByBatch(
      scope.workspaceId,
      prior.accountId,
      prior.importBatchId,
    );
    if (
      priorFields.length !== rows.length ||
      priorFields.some((value, index) => value !== rows[index]?.rawFieldsJson)
    ) {
      platformFailure("TRADERLINK_JOURNAL_IMPORT_CONFLICT", {
        reason: "manual_idempotency_payload_mismatch",
      });
    }
  }

  findSavedGenericMappingForWorkspace(
    scope: WorkspaceAccessScope,
    input: Readonly<{
      accountId: string;
      structuralSignatureSha256: string;
      brokerName: string;
    }>,
  ): JournalGenericStatementMappingContract | null {
    this.accounts.requireAccountRecord(scope, input.accountId);
    if (!/^[0-9a-f]{64}$/u.test(input.structuralSignatureSha256)) {
      platformFailure("TRADERLINK_JOURNAL_IMPORT_MAPPING_FAILED", {
        reason: "structural_signature_invalid",
      });
    }
    const encoded = this.imports.findLatestMappedStatementContract(
      scope.workspaceId,
      input.accountId,
      input.structuralSignatureSha256,
      normalizeJournalConfirmedBrokerName(input.brokerName),
    );
    if (!encoded) return null;
    try {
      return parseJournalGenericStatementMappingContract(JSON.parse(encoded));
    } catch (error) {
      if (error instanceof TraderLinkPlatformError) throw error;
      platformFailure("TRADERLINK_JOURNAL_IMPORT_MAPPING_FAILED", {
        reason: "saved_mapping_contract_invalid",
      }, error);
    }
  }

  previewIbkr(sourceBytes: Uint8Array, sourceTimezone: string): JournalImportPreview {
    const preview = previewIbkrActivityStatement({ sourceBytes, sourceTimezone });
    return createPrivacySafeIbkrPreview(preview);
  }

  previewIbkrForWorkspace(
    scope: WorkspaceAccessScope,
    input: Readonly<{
      sourceBytes: Uint8Array;
      sourceTimezone: string;
      allowSelectedAccountIdentityConfirmation?: boolean;
    }>,
  ): JournalScopedImportPreview {
    const preview = previewIbkrActivityStatement(input);
    const safePreview = createPrivacySafeIbkrPreview(preview);
    const prior = this.imports.findByFileDigest(
      scope.workspaceId,
      "ibkr",
      preview.sourceFileSha256,
    );
    if (prior) {
      this.accounts.requireAccountScope(scope, prior.accountId);
      return Object.freeze({
        ...safePreview,
        canCommit: true,
        accountId: prior.accountId,
        sourceIdentityConfirmationRequired: false,
        exactReimport: true,
        existingImportBatchId: prior.importBatchId,
        plannedNewExecutionCount: 0,
        plannedMatchedExecutionCount: this.imports.listExecutionIdsForBatch(
          scope.workspaceId,
          prior.accountId,
          prior.importBatchId,
        ).length,
        plannedAmbiguousExecutionCount: 0,
        expectedPendingSourceDecisionCount: prior.pendingDecisionCount,
      });
    }
    if (!preview.rawSourceAccountId || !safePreview.canCommit) {
      platformFailure("TRADERLINK_JOURNAL_IMPORT_MAPPING_FAILED", {
        reason: "blocking_preview_issue",
      });
    }
    let sourceIdentityConfirmationRequired = false;
    let account;
    try {
      account = this.accounts.inspectSourceAccountIdentity(scope, {
        sourceSystem: "ibkr",
        rawSourceAccountId: preview.rawSourceAccountId,
      });
    } catch (error) {
      if (
        !(error instanceof TraderLinkPlatformError) ||
        error.code !== "TRADERLINK_ACCOUNT_IDENTITY_CONFIRMATION_REQUIRED" ||
        input.allowSelectedAccountIdentityConfirmation !== true ||
        !scope.activeAccountId
      ) throw error;
      const selected = this.accounts.requireAccountRecord(
        scope,
        scope.activeAccountId,
      );
      account = Object.freeze({
        accountId: selected.accountId,
        tradingTimezone: selected.tradingTimezone,
      });
      sourceIdentityConfirmationRequired = true;
    }
    const planned = this.planExecutions(
      scope.workspaceId,
      account.accountId,
      preview.executions,
      "broker_statement",
    );
    const timezoneMismatch = account.tradingTimezone !== preview.sourceTimezone;
    const expectedPendingSourceDecisionCount = preview.issues.filter((issue) =>
      !issue.isBlocking && issue.severity !== "info").length +
      this.plannedDecisionCount(planned) +
      (timezoneMismatch ? 1 : 0);
    const scopedIssues = timezoneMismatch
      ? Object.freeze([...safePreview.issues, Object.freeze({
          issueCode: "source_timezone_differs_from_account",
          severity: "warning" as const,
          isBlocking: false,
          count: 1,
        })].sort((left, right) => left.issueCode.localeCompare(right.issueCode)))
      : safePreview.issues;
    return Object.freeze({
      ...safePreview,
      issues: scopedIssues,
      accountId: account.accountId,
      sourceIdentityConfirmationRequired,
      exactReimport: false,
      existingImportBatchId: null,
      plannedNewExecutionCount: planned.filter((candidate) =>
        candidate.matchedExecutionId === null).length,
      plannedMatchedExecutionCount: planned.filter((candidate) =>
        candidate.matchedExecutionId !== null).length,
      plannedAmbiguousExecutionCount: planned.filter((candidate) =>
        candidate.ambiguous).length,
      expectedPendingSourceDecisionCount,
    });
  }

  commitIbkrStatement(
    scope: WorkspaceAccessScope,
    input: IbkrStatementCommitInput,
  ): JournalImportCommitResult {
    safeLabel(input.sourceDisplayLabel);
    const sourceEvidence = calculateSourceFileEvidence(input.sourceBytes);
    const expectedEvidenceObjectKey = `ibkr/${sourceEvidence.sha256}.csv`;
    if (
      input.evidenceObjectKey !== expectedEvidenceObjectKey ||
      input.evidenceObjectKey.length > 255
    ) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
        field: "evidenceObjectKey",
      });
    }
    const prior = this.imports.findByFileDigest(scope.workspaceId, "ibkr", sourceEvidence.sha256);
    if (prior) {
      return this.alreadyImportedResult(scope, prior);
    }
    const preview: IbkrActivityStatementPreview = previewIbkrActivityStatement({
      sourceBytes: input.sourceBytes,
      sourceTimezone: input.sourceTimezone,
    });
    if (
      preview.sourceFileSha256 !== sourceEvidence.sha256 ||
      preview.sourceFileSizeBytes !== sourceEvidence.sizeBytes
    ) {
      platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", {
        check: "source_file_evidence",
      });
    }
    if (preview.issues.some((candidate) => candidate.isBlocking) || !preview.rawSourceAccountId) {
      platformFailure("TRADERLINK_JOURNAL_IMPORT_MAPPING_FAILED", { reason: "blocking_preview_issue" });
    }
    this.accounts.assertPrivacySafeSourceMetadata({
      rawSourceAccountId: preview.rawSourceAccountId,
      candidateValues: [
        input.sourceDisplayLabel,
        input.privacySafeAccountDisplay,
        input.evidenceObjectKey,
      ],
    });
    if (
      input.confirmedSourceIdentityAccountId !== undefined &&
      input.confirmedSourceIdentityAccountId !== scope.activeAccountId
    ) {
      platformFailure("TRADERLINK_JOURNAL_IMPORT_CONFLICT", {
        reason: "selected_account_mismatch",
      });
    }
    const identity = input.confirmedSourceIdentityAccountId
      ? this.accounts.confirmSourceIdentityLinkRecord(scope, {
          accountId: input.confirmedSourceIdentityAccountId,
          sourceSystem: "ibkr",
          rawSourceAccountId: preview.rawSourceAccountId,
          privacySafeDisplay: input.privacySafeAccountDisplay,
          now: input.now,
        })
      : this.accounts.resolveSourceAccountIdentityRecord(scope, {
          sourceSystem: "ibkr",
          rawSourceAccountId: preview.rawSourceAccountId,
          privacySafeDisplay: input.privacySafeAccountDisplay,
          now: input.now,
        });
    const accountId = identity.accountId;
    const accountContextIssues: JournalImportIssue[] =
      identity.tradingTimezone === preview.sourceTimezone
        ? []
        : [Object.freeze({
            recordOrdinal: null,
            issueScope: "import" as const,
            issueCode: "source_timezone_differs_from_account",
            severity: "warning" as const,
            isBlocking: false,
          })];
    const planned = this.planExecutions(
      scope.workspaceId,
      accountId,
      preview.executions,
      "broker_statement",
    );
    const overlapIssues = this.overlapIssues(planned);
    return this.commitPreparedImport(scope, {
      accountId, sourceIdentityId: identity.sourceIdentityId,
      sourceKind: "broker_statement", sourceSystem: "ibkr",
      sourceFileSha256: preview.sourceFileSha256,
      sourceFileSizeBytes: preview.sourceFileSizeBytes,
      sourceMimeType: "text/csv", sourceEncoding: "utf-8",
      sourceDisplayLabel: input.sourceDisplayLabel, evidenceObjectKey: input.evidenceObjectKey,
      manualIdempotencyKey: null, adapterId: preview.adapterId,
      adapterVersion: preview.adapterVersion, parserVersion: preview.parserVersion,
      mappingVersion: preview.mappingVersion,
      mappingContractJson: JSON.stringify(preview.mappingContract),
      statementPeriodStartDate: preview.statementPeriodStartDate,
      statementPeriodEndDate: preview.statementPeriodEndDate,
      sourceTimezone: preview.sourceTimezone, rows: preview.rows,
      issues: Object.freeze([
        ...preview.issues,
        ...accountContextIssues,
        ...overlapIssues,
      ]),
      coverageIntervals: preview.coverageIntervals, positionFacts: preview.positionFacts,
      plannedExecutions: planned, sourceIdentityForRows: preview.sourceFileSha256,
      now: input.now,
    });
  }

  previewGenericMappedForWorkspace(
    scope: WorkspaceAccessScope,
    input: Readonly<{
      sourceBytes: Uint8Array;
      accountId: string;
      mapping: JournalGenericStatementMappingContract;
    }>,
  ): JournalScopedImportPreview {
    this.accounts.requireAccountRecord(scope, input.accountId);
    const preview = previewGenericMappedStatement({
      sourceBytes: input.sourceBytes,
      mapping: input.mapping,
    });
    const safePreview = createPrivacySafeAdapterPreview(preview, true);
    const prior = this.imports.findByFileDigest(
      scope.workspaceId,
      "mapped_csv",
      preview.sourceFileSha256,
    );
    if (prior) {
      this.accounts.requireAccountScope(scope, prior.accountId);
      if (prior.accountId !== input.accountId) {
        platformFailure("TRADERLINK_JOURNAL_IMPORT_CONFLICT", {
          reason: "mapped_statement_account_mismatch",
        });
      }
      return Object.freeze({
        ...safePreview,
        canCommit: true,
        accountId: prior.accountId,
        sourceIdentityConfirmationRequired: false,
        exactReimport: true,
        existingImportBatchId: prior.importBatchId,
        plannedNewExecutionCount: 0,
        plannedMatchedExecutionCount: this.imports.listExecutionIdsForBatch(
          scope.workspaceId,
          prior.accountId,
          prior.importBatchId,
        ).length,
        plannedAmbiguousExecutionCount: 0,
        expectedPendingSourceDecisionCount: prior.pendingDecisionCount,
      });
    }
    if (!safePreview.canCommit) {
      platformFailure("TRADERLINK_JOURNAL_IMPORT_MAPPING_FAILED", {
        reason: "blocking_preview_issue",
      });
    }
    const planned = this.planExecutions(
      scope.workspaceId,
      input.accountId,
      preview.executions,
      "broker_statement",
    );
    return Object.freeze({
      ...safePreview,
      accountId: input.accountId,
      sourceIdentityConfirmationRequired: false,
      exactReimport: false,
      existingImportBatchId: null,
      plannedNewExecutionCount: planned.filter((candidate) =>
        candidate.matchedExecutionId === null).length,
      plannedMatchedExecutionCount: planned.filter((candidate) =>
        candidate.matchedExecutionId !== null).length,
      plannedAmbiguousExecutionCount: planned.filter((candidate) =>
        candidate.ambiguous).length,
      expectedPendingSourceDecisionCount: preview.issues.filter((candidate) =>
        !candidate.isBlocking && candidate.severity !== "info").length +
        this.plannedDecisionCount(planned),
    });
  }

  commitGenericMappedStatement(
    scope: WorkspaceAccessScope,
    input: GenericMappedStatementCommitInput,
  ): JournalImportCommitResult {
    safeLabel(input.sourceDisplayLabel);
    const sourceEvidence = calculateSourceFileEvidence(input.sourceBytes);
    const expectedEvidenceObjectKey = `mapped_csv/${sourceEvidence.sha256}.csv`;
    if (
      input.evidenceObjectKey !== expectedEvidenceObjectKey ||
      input.evidenceObjectKey.length > 255
    ) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
        field: "evidenceObjectKey",
      });
    }
    const prior = this.imports.findByFileDigest(
      scope.workspaceId,
      "mapped_csv",
      sourceEvidence.sha256,
    );
    if (prior) {
      if (prior.accountId !== input.accountId) {
        platformFailure("TRADERLINK_JOURNAL_IMPORT_CONFLICT", {
          reason: "mapped_statement_account_mismatch",
        });
      }
      return this.alreadyImportedResult(scope, prior);
    }
    const account = this.accounts.requireAccountRecord(scope, input.accountId);
    const preview = previewGenericMappedStatement({
      sourceBytes: input.sourceBytes,
      mapping: input.mapping,
    });
    if (
      preview.sourceFileSha256 !== sourceEvidence.sha256 ||
      preview.sourceFileSizeBytes !== sourceEvidence.sizeBytes ||
      preview.issues.some((candidate) => candidate.isBlocking)
    ) {
      platformFailure("TRADERLINK_JOURNAL_IMPORT_MAPPING_FAILED", {
        reason: "blocking_preview_issue",
      });
    }
    const sourceAccountReference = [
      "mapped-statement-account-v1",
      scope.workspaceId,
      input.accountId,
      input.mapping.brokerName.trim().normalize("NFKC").toLowerCase(),
    ].join(":");
    const identity = this.accounts.confirmSourceIdentityLinkRecord(scope, {
      accountId: input.accountId,
      sourceSystem: "mapped_csv",
      rawSourceAccountId: sourceAccountReference,
      privacySafeDisplay: account.displayName,
      sourceAccountCanonicalizationVersion:
        MAPPED_STATEMENT_SOURCE_ACCOUNT_CANONICALIZATION_VERSION,
      now: input.now,
    });
    const planned = this.planExecutions(
      scope.workspaceId,
      input.accountId,
      preview.executions,
      "broker_statement",
    );
    const overlapIssues = this.overlapIssues(planned);
    return this.commitPreparedImport(scope, {
      accountId: input.accountId,
      sourceIdentityId: identity.sourceIdentityId,
      sourceKind: "broker_statement",
      sourceSystem: "mapped_csv",
      sourceFileSha256: preview.sourceFileSha256,
      sourceFileSizeBytes: preview.sourceFileSizeBytes,
      sourceMimeType: "text/csv",
      sourceEncoding: "utf-8",
      sourceDisplayLabel: input.sourceDisplayLabel,
      evidenceObjectKey: input.evidenceObjectKey,
      manualIdempotencyKey: null,
      adapterId: preview.adapterId,
      adapterVersion: preview.adapterVersion,
      parserVersion: preview.parserVersion,
      mappingVersion: preview.mappingVersion,
      mappingContractJson: JSON.stringify(preview.mappingContract),
      statementPeriodStartDate: null,
      statementPeriodEndDate: null,
      sourceTimezone: preview.sourceTimezone,
      rows: preview.rows,
      issues: Object.freeze([...preview.issues, ...overlapIssues]),
      coverageIntervals: preview.coverageIntervals,
      positionFacts: preview.positionFacts,
      plannedExecutions: planned,
      sourceIdentityForRows: preview.sourceFileSha256,
      now: input.now,
    });
  }

  commitManualExecutions(
    scope: WorkspaceAccessScope,
    input: ManualExecutionBatchInput,
  ): JournalImportCommitResult {
    safeLabel(input.sourceDisplayLabel);
    if (input.idempotencyKey.length < 16 || input.idempotencyKey.length > 128 || input.entries.length === 0) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "manualBatch" });
    }
    const account = this.accounts.requireAccountRecord(scope, input.accountId);
    const contentCounts = new Map<string, number>();
    const adapterExecutions = input.entries.map((entry, index) => {
      assertJournalTimezone(entry.sourceTimezone, "sourceTimezone");
      assertJournalCurrency(entry.tradeCurrency, "tradeCurrency");
      assertCanonicalJournalDecimal(entry.quantityDecimal, "quantityDecimal", { positive: true });
      if (entry.priceDecimal !== null) assertCanonicalJournalDecimal(entry.priceDecimal, "priceDecimal", { positive: true });
      if (entry.feesDecimal !== null) assertCanonicalJournalDecimal(entry.feesDecimal, "feesDecimal");
      if (entry.feeCurrency !== null) assertJournalCurrency(entry.feeCurrency, "feeCurrency");
      if (
        (entry.feesDecimal === null) !== (entry.feeCurrency === null) ||
        (entry.feesDecimal === null) !== (entry.feeSignConvention === "not_reported")
      ) {
        platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
          field: "manualFeeFacts",
        });
      }
      if (
        entry.tradeIntent !== undefined &&
        !["not_set", "day_trade", "swing"].includes(entry.tradeIntent)
      ) {
        platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
          field: "tradeIntent",
        });
      }
      const executedAtUtc = entry.executedAtUtc ??
        normalizeIbkrExecutionTime(entry.sourceTimestampText, entry.sourceTimezone);
      if (entry.executedAtUtc) {
        assertUtcMatchesJournalLocalTime(
          entry.sourceTimestampText,
          entry.sourceTimezone,
          entry.executedAtUtc,
        );
      }
      const normalizedSymbol = normalizeJournalStockSymbol(entry.normalizedSymbol);
      const normalizedContentIdentity = sha256(JSON.stringify([
        "execution-content-v1", "stock", normalizedSymbol, entry.tradeCurrency,
        executedAtUtc, entry.side, entry.quantityDecimal, entry.priceDecimal,
      ]));
      const occurrence = (contentCounts.get(normalizedContentIdentity) ?? 0) + 1;
      contentCounts.set(normalizedContentIdentity, occurrence);
      return Object.freeze({
        recordOrdinal: index + 1, normalizedSymbol, assetClass: "stock" as const,
        tradeCurrency: entry.tradeCurrency, sourceTimestampText: entry.sourceTimestampText,
        sourceTimezone: entry.sourceTimezone,
        timeParserVersion: entry.executedAtUtc
          ? "manual_explicit_utc_v1"
          : "manual_local_datetime_v1",
        executedAtUtc,
        sourceOrderKey: `${executedAtUtc}|unverified|${normalizedContentIdentity}|${String(occurrence).padStart(8, "0")}`,
        side: entry.side, quantityDecimal: entry.quantityDecimal,
        priceDecimal: entry.priceDecimal, feesDecimal: entry.feesDecimal,
        feeCurrency: entry.feeCurrency, feeSignConvention: entry.feeSignConvention,
        factCompleteness: entry.priceDecimal === null ? "price_missing" as const : "complete" as const,
        providerExecutionIdentity: null, normalizedContentIdentity,
        contentOccurrenceOrdinal: occurrence,
      });
    });
    const rawOccurrences = new Map<string, number>();
    const rows: JournalAdapterSourceRow[] = adapterExecutions.map((execution) => {
      const fields = Object.freeze([
        "manual_execution_v1", execution.sourceTimestampText, execution.sourceTimezone,
        execution.executedAtUtc, execution.timeParserVersion,
        localDateAtUtc(execution.executedAtUtc, account.tradingTimezone),
        account.tradingTimezone,
        execution.normalizedSymbol, execution.side, execution.quantityDecimal,
        execution.priceDecimal ?? "", execution.feesDecimal ?? "",
        execution.feeCurrency ?? "", execution.feeSignConvention,
        execution.tradeCurrency, input.entries[execution.recordOrdinal - 1]?.tradeIntent ?? "not_set",
      ]);
      const rawFieldsJson = JSON.stringify(fields);
      const fingerprint = sha256(rawFieldsJson);
      const occurrenceOrdinal = (rawOccurrences.get(fingerprint) ?? 0) + 1;
      rawOccurrences.set(fingerprint, occurrenceOrdinal);
      return Object.freeze({
        recordOrdinal: execution.recordOrdinal, fields, rawRecord: rawFieldsJson,
        rawRecordSha256: fingerprint, rawFieldsJson,
        contentFingerprintSha256: fingerprint, occurrenceOrdinal,
        sectionName: "Manual Executions", recordType: "Data", assetCategory: "Stocks",
        classification: "mapped_execution" as const,
      });
    });
    const prior = this.imports.findByManualIdempotency(
      scope.workspaceId,
      input.accountId,
      input.idempotencyKey,
    );
    if (prior) {
      this.requireMatchingManualPayload(scope, prior, rows);
      return this.alreadyImportedResult(scope, prior);
    }
    const pointCoverage = new Map<string, Readonly<{
      localDate: string;
      sourceTimezone: string;
      recordOrdinal: number;
    }>>();
    for (const entry of adapterExecutions) {
      const executionLocalDate = localDateAtUtc(
        entry.executedAtUtc,
        account.tradingTimezone,
      );
      const coverageKey = `${executionLocalDate}\u001f${account.tradingTimezone}`;
      if (!pointCoverage.has(coverageKey)) {
        pointCoverage.set(
          coverageKey,
          Object.freeze({
            localDate: executionLocalDate,
            sourceTimezone: account.tradingTimezone,
            recordOrdinal: entry.recordOrdinal,
          }),
        );
      }
    }
    const coverageIntervals = [...pointCoverage.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([, coverage]) =>
      Object.freeze({
        assetClass: "stock" as const,
        coverageKind: "point_only" as const,
        localStartDate: coverage.localDate,
        localEndDate: coverage.localDate,
        sourceTimezone: coverage.sourceTimezone,
      }));
    const automaticallyPlanned = this.planExecutions(
      scope.workspaceId,
      input.accountId,
      adapterExecutions,
      "manual_batch",
    );
    const planned = input.contentResolution === "trader_confirmed_separate"
      ? Object.freeze(automaticallyPlanned.map((plan) => Object.freeze({
          ...plan,
          matchedExecutionId: null,
          ambiguous: false,
          factConflict: false,
          enrichFromIncoming: false,
          attachContentAlias: false,
          reconciliation: null,
        })))
      : automaticallyPlanned;
    const issues: JournalImportIssue[] = adapterExecutions.filter((entry) => entry.priceDecimal === null)
      .map((entry) => Object.freeze({ recordOrdinal: entry.recordOrdinal, issueScope: "execution" as const,
        issueCode: "execution_price_missing", severity: "warning" as const, isBlocking: false,
        chainHint: Object.freeze({ normalizedSymbol: entry.normalizedSymbol,
          assetClass: entry.assetClass, tradeCurrency: entry.tradeCurrency,
          effectiveAtUtc: entry.executedAtUtc }) }));
    if (!input.confirmedTraderBoundaries) {
      issues.push(...[...pointCoverage.values()].map((coverage) => Object.freeze({
        recordOrdinal: coverage.recordOrdinal,
        issueScope: "row" as const,
        issueCode: "manual_trading_day_coverage_unconfirmed",
        severity: "warning" as const,
        isBlocking: false,
      })));
    }
    issues.push(...this.overlapIssues(planned));
    return this.commitPreparedImport(scope, {
      accountId: input.accountId, sourceIdentityId: null, sourceKind: "manual_batch",
      sourceSystem: "manual", sourceFileSha256: null, sourceFileSizeBytes: null,
      sourceMimeType: null, sourceEncoding: null, sourceDisplayLabel: input.sourceDisplayLabel,
      evidenceObjectKey: null, manualIdempotencyKey: input.idempotencyKey,
      adapterId: "manual_execution", adapterVersion: "manual_execution_v1",
      parserVersion: "manual_record_v1", mappingVersion: "manual_execution_mapping_v1",
      mappingContractJson: JSON.stringify({
        contractVersion: "manual_execution_mapping_v1",
        coverage: "point_only",
        contentResolution: input.contentResolution === "trader_confirmed_separate"
          ? "trader_confirmed_separate"
          : "automatic",
      }),
      statementPeriodStartDate: null, statementPeriodEndDate: null, sourceTimezone: null,
      rows, issues, coverageIntervals, positionFacts: [], plannedExecutions: planned,
      sourceIdentityForRows: `${scope.workspaceId}\u001f${input.accountId}\u001f${input.idempotencyKey}`,
      now: input.now,
    });
  }

  commitMoomooApiFills(
    scope: WorkspaceAccessScope,
    input: MoomooApiFillBatchInput,
  ): JournalImportCommitResult {
    safeLabel(input.sourceDisplayLabel);
    if (
      !/^[0-9a-f]{64}$/u.test(input.pageIdentitySha256) ||
      !/^[A-Za-z0-9_-]{1,255}$/u.test(input.evidenceObjectKey) ||
      input.fills.length < 1 ||
      input.fills.length > 50
    ) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
        field: "moomooFillBatch",
      });
    }
    const account = this.accounts.requireAccountRecord(scope, input.accountId);
    this.imports.requireSourceIdentity(
      scope.workspaceId,
      input.accountId,
      input.sourceIdentityId,
    );
    const prior = this.imports.findByFileDigest(
      scope.workspaceId,
      "moomoo",
      input.pageIdentitySha256,
    );
    if (prior) return this.alreadyImportedResult(scope, prior);

    const contentCounts = new Map<string, number>();
    const adapterExecutions: JournalAdapterExecution[] = input.fills.map((fill, index) => {
      assertJournalCurrency(fill.tradeCurrency, "tradeCurrency");
      assertCanonicalJournalDecimal(fill.quantityDecimal, "quantityDecimal", { positive: true });
      assertCanonicalJournalDecimal(fill.priceDecimal, "priceDecimal", { positive: true });
      if (
        fill.providerExecutionIdentity.length < 1 ||
        fill.providerExecutionIdentity.length > 512 ||
        !Number.isSafeInteger(fill.createdMicroseconds) ||
        !Number.isSafeInteger(fill.updatedMicroseconds) ||
        fill.createdMicroseconds <= 0 ||
        fill.updatedMicroseconds < fill.createdMicroseconds
      ) {
        platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
          field: "moomooFill",
        });
      }
      const normalizedSymbol = normalizeJournalStockSymbol(fill.normalizedSymbol);
      const executedAtUtc = new Date(
        Math.floor(fill.createdMicroseconds / 1_000),
      ).toISOString();
      const sourceTimestampText = executedAtUtc.slice(0, 19).replace("T", " ");
      const normalizedContentIdentity = sha256(JSON.stringify([
        "execution-content-v1", "stock", normalizedSymbol, fill.tradeCurrency,
        executedAtUtc, fill.side, fill.quantityDecimal, fill.priceDecimal,
      ]));
      const occurrence = (contentCounts.get(normalizedContentIdentity) ?? 0) + 1;
      contentCounts.set(normalizedContentIdentity, occurrence);
      return Object.freeze({
        recordOrdinal: index + 1,
        normalizedSymbol,
        assetClass: "stock" as const,
        tradeCurrency: fill.tradeCurrency,
        sourceTimestampText,
        sourceTimezone: "UTC",
        timeParserVersion: "moomoo_microseconds_v1",
        executedAtUtc,
        sourceOrderKey: `${executedAtUtc}|${String(fill.createdMicroseconds).padStart(16, "0")}|${sha256(fill.providerExecutionIdentity)}`,
        side: fill.side,
        quantityDecimal: fill.quantityDecimal,
        priceDecimal: fill.priceDecimal,
        feesDecimal: null,
        feeCurrency: null,
        feeSignConvention: "not_reported" as const,
        factCompleteness: "complete" as const,
        providerExecutionIdentity: fill.providerExecutionIdentity,
        normalizedContentIdentity,
        contentOccurrenceOrdinal: occurrence,
      });
    });
    const rows: JournalAdapterSourceRow[] = adapterExecutions.map((execution) => {
      const fill = input.fills[execution.recordOrdinal - 1]!;
      const fields = Object.freeze([
        "moomoo_fill_v1",
        sha256(fill.providerExecutionIdentity),
        normalizeJournalStockSymbol(fill.normalizedSymbol),
        fill.side,
        fill.quantityDecimal,
        fill.priceDecimal,
        String(fill.createdMicroseconds),
        String(fill.updatedMicroseconds),
      ]);
      const rawFieldsJson = JSON.stringify(fields);
      const fingerprint = sha256(rawFieldsJson);
      return Object.freeze({
        recordOrdinal: execution.recordOrdinal,
        fields,
        rawRecord: rawFieldsJson,
        rawRecordSha256: fingerprint,
        rawFieldsJson,
        contentFingerprintSha256: fingerprint,
        occurrenceOrdinal: 1,
        sectionName: "Moomoo execution fills",
        recordType: "Data",
        assetCategory: "Stocks",
        classification: "mapped_execution" as const,
      });
    });
    const coverage = new Map<string, Readonly<{
      localDate: string;
      sourceTimezone: string;
    }>>();
    for (const execution of adapterExecutions) {
      const localDate = localDateAtUtc(execution.executedAtUtc, account.tradingTimezone);
      coverage.set(`${localDate}\u001f${account.tradingTimezone}`, Object.freeze({
        localDate,
        sourceTimezone: account.tradingTimezone,
      }));
    }
    const planned = this.planExecutions(
      scope.workspaceId,
      input.accountId,
      adapterExecutions,
      "broker_statement",
    );
    return this.commitPreparedImport(scope, {
      accountId: input.accountId,
      sourceIdentityId: input.sourceIdentityId,
      sourceKind: "broker_statement",
      sourceSystem: "moomoo",
      sourceFileSha256: input.pageIdentitySha256,
      sourceFileSizeBytes: Buffer.byteLength(JSON.stringify(rows), "utf8"),
      sourceMimeType: "application/json",
      sourceEncoding: "utf-8",
      sourceDisplayLabel: input.sourceDisplayLabel,
      evidenceObjectKey: input.evidenceObjectKey,
      manualIdempotencyKey: null,
      adapterId: "moomoo_api_fill",
      adapterVersion: "moomoo_api_fill_v1",
      parserVersion: "moomoo_microseconds_v1",
      mappingVersion: "moomoo_api_fill_mapping_v1",
      mappingContractJson: JSON.stringify({
        contractVersion: "moomoo_api_fill_mapping_v1",
        evidence: "encrypted_provider_fill_receipt",
      }),
      statementPeriodStartDate: null,
      statementPeriodEndDate: null,
      sourceTimezone: "UTC",
      rows,
      issues: this.overlapIssues(planned),
      coverageIntervals: [...coverage.values()].sort((left, right) =>
        left.localDate.localeCompare(right.localDate)).map((item) => Object.freeze({
          assetClass: "stock" as const,
          coverageKind: "point_only" as const,
          localStartDate: item.localDate,
          localEndDate: item.localDate,
          sourceTimezone: item.sourceTimezone,
        })),
      positionFacts: [],
      plannedExecutions: planned,
      sourceIdentityForRows: `${input.sourceIdentityId}\u001f${input.pageIdentitySha256}`,
      now: input.now,
    });
  }

  private addManualReconciliationCandidates(
    workspaceId: string,
    accountId: string,
    plans: readonly PlannedExecution[],
  ): readonly PlannedExecution[] {
    const manualExecutions = this.reconciliations.listEligibleManualExecutions(
      workspaceId,
      accountId,
    );
    if (manualExecutions.length === 0) return plans;

    const manualById = new Map(manualExecutions.map((manual) => [manual.executionId, manual]));
    const groupKey = (input: Readonly<{
      assetClass: string;
      normalizedSymbol: string;
      tradeCurrency: string;
      executedAtUtc: string;
      side: "buy" | "sell";
      accountTimezone: string;
    }>): string => [
      localDateAtUtc(input.executedAtUtc, input.accountTimezone),
      input.assetClass,
      input.normalizedSymbol,
      input.tradeCurrency,
      input.side,
    ].join("\u001f");
    const manualsByGroup = new Map<string, JournalManualExecutionCandidate[]>();
    for (const manual of manualExecutions) {
      const key = groupKey(manual);
      const grouped = manualsByGroup.get(key) ?? [];
      grouped.push(manual);
      manualsByGroup.set(key, grouped);
    }
    const plansByGroup = new Map<string, number[]>();
    for (const [index, plan] of plans.entries()) {
      if (
        plan.reconciliation !== null ||
        (plan.matchedExecutionId !== null && !manualById.has(plan.matchedExecutionId))
      ) continue;
      const accountTimezone = manualExecutions[0]!.accountTimezone;
      const key = groupKey({ ...plan.execution, accountTimezone });
      if (!manualsByGroup.has(key)) continue;
      const grouped = plansByGroup.get(key) ?? [];
      grouped.push(index);
      plansByGroup.set(key, grouped);
    }

    const reconciliationsByPlan = new Map<number, PlannedReconciliation>();
    const assignCandidate = (
      kind: PlannedReconciliation["kind"],
      manuals: readonly JournalManualExecutionCandidate[],
      planIndexes: readonly number[],
    ): void => {
      const manualEvidence = manuals
        .map((manual) => `${manual.executionId}:${manual.currentVersionId}`)
        .sort();
      const brokerEvidence = planIndexes
        .map((index) => {
          const plan = plans[index]!;
          return [
            plan.activeStrongAliasSha256 ?? "no_provider_identity",
            plan.activeContentAliasSha256,
            String(plan.execution.contentOccurrenceOrdinal),
          ].join(":");
        })
        .sort();
      const overlapKeySha256 = sha256(JSON.stringify([
        "manual-broker-reconciliation-v1",
        kind,
        manualEvidence,
        brokerEvidence,
      ]));
      const reconciliation = Object.freeze({
        kind,
        overlapKeySha256,
        evidenceSha256: sha256(JSON.stringify([
          "manual-broker-reconciliation-evidence-v1",
          overlapKeySha256,
          manualEvidence,
          brokerEvidence,
        ])),
        manualExecutionIds: Object.freeze(manuals.map((manual) => manual.executionId).sort()),
      });
      for (const index of planIndexes) reconciliationsByPlan.set(index, reconciliation);
    };

    for (const [key, planIndexes] of plansByGroup) {
      const manuals = manualsByGroup.get(key)!;
      const manualTotal = manuals.reduce(
        (sum, manual) => sum.plus(manual.quantityDecimal),
        new ReconciliationDecimal(0),
      );
      const brokerTotal = planIndexes.reduce(
        (sum, index) => sum.plus(plans[index]!.execution.quantityDecimal),
        new ReconciliationDecimal(0),
      );
      if (manualTotal.eq(brokerTotal)) {
        assignCandidate(
          manuals.length === 1 && planIndexes.length === 1 ? "one_to_one" : "grouped_fills",
          manuals,
          planIndexes,
        );
        continue;
      }

      const manualsByQuantity = new Map<string, JournalManualExecutionCandidate[]>();
      for (const manual of manuals) {
        const quantity = new ReconciliationDecimal(manual.quantityDecimal).toString();
        const matches = manualsByQuantity.get(quantity) ?? [];
        matches.push(manual);
        manualsByQuantity.set(quantity, matches);
      }
      const plansByQuantity = new Map<string, number[]>();
      for (const index of planIndexes) {
        const quantity = new ReconciliationDecimal(
          plans[index]!.execution.quantityDecimal,
        ).toString();
        const matches = plansByQuantity.get(quantity) ?? [];
        matches.push(index);
        plansByQuantity.set(quantity, matches);
      }
      for (const [quantity, quantityManuals] of manualsByQuantity) {
        const quantityPlans = plansByQuantity.get(quantity) ?? [];
        if (quantityManuals.length === 1 && quantityPlans.length === 1) {
          assignCandidate("one_to_one", quantityManuals, quantityPlans);
        }
      }
    }

    if (reconciliationsByPlan.size === 0) return plans;
    return Object.freeze(plans.map((plan, index) => {
      const reconciliation = reconciliationsByPlan.get(index);
      if (!reconciliation) return plan;
      const matchedManual = plan.matchedExecutionId !== null &&
        manualById.has(plan.matchedExecutionId);
      return Object.freeze({
        ...plan,
        matchedExecutionId: null,
        ambiguous: true,
        enrichFromIncoming: false,
        attachContentAlias: matchedManual ? false : plan.attachContentAlias,
        reconciliation,
      });
    }));
  }

  private planExecutions(
    workspaceId: string,
    accountId: string,
    executions: readonly JournalAdapterExecution[],
    sourceKind: "broker_statement" | "manual_batch",
  ): readonly PlannedExecution[] {
    const availableSchemeVersions = new Set(this.digester.schemeVersions);
    if (this.executions.listReferencedPrivacySchemeVersions(workspaceId, accountId)
      .some((schemeVersion) => !availableSchemeVersions.has(schemeVersion))) {
      platformFailure("TRADERLINK_ACCOUNT_IDENTITY_RECOVERY_REQUIRED", {
        reason: "journal_execution_hmac_scheme_unavailable",
      });
    }
    const incomingCounts = new Map<string, number>();
    for (const execution of executions) incomingCounts.set(execution.normalizedContentIdentity,
      (incomingCounts.get(execution.normalizedContentIdentity) ?? 0) + 1);
    const planned = Object.freeze(executions.map((execution) => {
      const activeContentDigest = this.digester.activeDigest(
        "execution_content",
        execution.normalizedContentIdentity,
      );
      const contentByOrdinal = new Map<number, Readonly<{
        executionAliasId: string;
        executionId: string;
        occurrenceOrdinal: number;
      }>>();
      for (const candidateDigest of this.digester.candidateDigests(
        "execution_content",
        execution.normalizedContentIdentity,
      )) {
        for (const alias of this.executions.listActiveContentAliases(
          workspaceId,
          accountId,
          candidateDigest.schemeVersion,
          candidateDigest.digestSha256,
        )) {
          const existingAtOrdinal = contentByOrdinal.get(alias.occurrenceOrdinal);
          if (existingAtOrdinal && existingAtOrdinal.executionId !== alias.executionId) {
            platformFailure("TRADERLINK_JOURNAL_EXECUTION_CONFLICT", {
              reason: "privacy_candidate_alias_conflict",
            });
          }
          if (!existingAtOrdinal) contentByOrdinal.set(alias.occurrenceOrdinal, alias);
        }
      }
      const contentAliases = [...contentByOrdinal.values()].sort((left, right) =>
        left.occurrenceOrdinal - right.occurrenceOrdinal ||
        (left.executionId < right.executionId ? -1 : left.executionId > right.executionId ? 1 : 0));
      const activeStrongDigest = execution.providerExecutionIdentity
        ? this.digester.activeDigest("broker_execution", execution.providerExecutionIdentity)
        : null;
      const strongMatches = execution.providerExecutionIdentity
        ? this.digester.candidateDigests("broker_execution", execution.providerExecutionIdentity)
            .map((candidateDigest) => this.executions.findActiveAlias({
              workspaceId,
              accountId,
              aliasType: "broker_fill",
              aliasSchemeVersion: candidateDigest.schemeVersion,
              aliasSha256: candidateDigest.digestSha256,
              occurrenceOrdinal: null,
            }))
            .filter((candidate): candidate is NonNullable<typeof candidate> => candidate !== null)
        : [];
      const strongExecutionIds = [...new Set(strongMatches.map((candidate) => candidate.executionId))]
        .sort();
      if (strongExecutionIds.length > 1) {
        platformFailure("TRADERLINK_JOURNAL_EXECUTION_CONFLICT", {
          reason: "privacy_candidate_alias_conflict",
        });
      }
      const strong = strongExecutionIds.length === 1
        ? strongMatches.find((candidate) => candidate.executionId === strongExecutionIds[0]) ?? null
        : null;
      const content = contentAliases.find((candidate) => candidate.occurrenceOrdinal === execution.contentOccurrenceOrdinal) ?? null;
      const contentResolutionIds = new Set<string>();
      if (content) contentResolutionIds.add(content.executionId);
      if (!activeStrongDigest) {
        for (const executionId of this.executions.listCurrentExecutionIdsByContentFacts({
          workspaceId,
          accountId,
          assetClass: execution.assetClass,
          normalizedSymbol: execution.normalizedSymbol,
          tradeCurrency: execution.tradeCurrency,
          executedAtUtc: execution.executedAtUtc,
          side: execution.side,
          quantityDecimal: execution.quantityDecimal,
          priceDecimal: execution.priceDecimal,
        })) contentResolutionIds.add(executionId);
      }
      const contentResolutionExecutionIds = [...contentResolutionIds].sort();
      const contentCandidateAmbiguous = !activeStrongDigest &&
        contentResolutionExecutionIds.length > 1;
      const contentExecutionId = contentResolutionExecutionIds.length === 1
        ? contentResolutionExecutionIds[0]!
        : null;
      const strongMaterial = strong
        ? this.executions.currentContentIdentityMaterial(
            strong.executionId,
            workspaceId,
            accountId,
          )
        : null;
      if (strong && !strongMaterial) {
        platformFailure("TRADERLINK_JOURNAL_EXECUTION_CONFLICT");
      }
      const strongContentIdentity = strongMaterial
        ? sha256(JSON.stringify([
            "execution-content-v1",
            strongMaterial.assetClass,
            strongMaterial.normalizedSymbol,
            strongMaterial.tradeCurrency,
            strongMaterial.executedAtUtc,
            strongMaterial.side,
            strongMaterial.quantityDecimal,
            strongMaterial.priceDecimal,
          ]))
        : null;
      const strongFactConflict = Boolean(
        strong && strongContentIdentity !== execution.normalizedContentIdentity,
      );
      const contentHasBrokerIdentity = Boolean(
        !strong &&
        activeStrongDigest &&
        content &&
        this.executions.listActiveAliasesForExecution(
          workspaceId,
          accountId,
          content.executionId,
        ).some((alias) => alias.aliasType === "broker_fill"),
      );
      const providerDistinct = contentHasBrokerIdentity;
      const contentOwnedByDifferentStrongExecution = Boolean(
        strong && content && content.executionId !== strong.executionId,
      );
      const countMismatch = !strong && !providerDistinct && contentAliases.length > 0 &&
        contentAliases.length !== incomingCounts.get(execution.normalizedContentIdentity);
      const matchedExecutionId = strong?.executionId ?? (
        countMismatch || providerDistinct || contentCandidateAmbiguous
          ? null
          : contentExecutionId
      );
      const currentVersion = matchedExecutionId
        ? this.executions.currentVersion(matchedExecutionId, workspaceId, accountId)
        : null;
      if (matchedExecutionId && !currentVersion) {
        platformFailure("TRADERLINK_JOURNAL_EXECUTION_CONFLICT");
      }
      const feeFactsDiffer = Boolean(currentVersion && (
        currentVersion.feesDecimal !== execution.feesDecimal ||
        currentVersion.feeCurrency !== execution.feeCurrency ||
        currentVersion.feeSignConvention !== execution.feeSignConvention
      ));
      const enrichFromIncoming = Boolean(
        sourceKind === "broker_statement" &&
        !strongFactConflict &&
        currentVersion?.feesDecimal === null &&
        execution.feesDecimal !== null,
      );
      const factConflict = strongFactConflict || (feeFactsDiffer && !enrichFromIncoming);
      return Object.freeze({
        execution,
        activeStrongAliasSha256: activeStrongDigest?.digestSha256 ?? null,
        activeContentAliasSha256: activeContentDigest.digestSha256,
        matchedExecutionId,
        ambiguous: countMismatch || contentCandidateAmbiguous || factConflict,
        factConflict,
        enrichFromIncoming,
        attachContentAlias: !providerDistinct && !contentOwnedByDifferentStrongExecution,
        reconciliation: null,
      });
    }));
    return sourceKind === "broker_statement"
      ? this.addManualReconciliationCandidates(workspaceId, accountId, planned)
      : planned;
  }

  private touchOrInsertActiveAlias(input: Readonly<{
    workspaceId: string;
    accountId: string;
    executionId: string;
    aliasType: "broker_fill" | "content_occurrence";
    aliasSha256: string;
    occurrenceOrdinal: number | null;
    timestamp: string;
  }>): void {
    const existing = this.executions.findActiveAlias({
      workspaceId: input.workspaceId,
      accountId: input.accountId,
      aliasType: input.aliasType,
      aliasSchemeVersion: this.digester.activeSchemeVersion,
      aliasSha256: input.aliasSha256,
      occurrenceOrdinal: input.occurrenceOrdinal,
    });
    if (existing) {
      if (existing.executionId !== input.executionId) {
        platformFailure("TRADERLINK_JOURNAL_EXECUTION_CONFLICT", {
          reason: "active_alias_owned_by_another_execution",
        });
      }
      this.executions.touchAlias({
        workspaceId: input.workspaceId,
        accountId: input.accountId,
        executionAliasId: existing.executionAliasId,
        timestamp: input.timestamp,
      });
      return;
    }
    this.executions.insertAlias({
      executionAliasId: createCanonicalUuidV4(),
      workspaceId: input.workspaceId,
      accountId: input.accountId,
      executionId: input.executionId,
      aliasType: input.aliasType,
      aliasSchemeVersion: this.digester.activeSchemeVersion,
      aliasSha256: input.aliasSha256,
      occurrenceOrdinal: input.occurrenceOrdinal,
      timestamp: input.timestamp,
    });
  }

  private commitPreparedImport(
    scope: WorkspaceAccessScope,
    input: Readonly<{
      accountId: string; sourceIdentityId: string | null;
      sourceKind: "broker_statement" | "manual_batch"; sourceSystem: string;
      sourceFileSha256: string | null; sourceFileSizeBytes: number | null;
      sourceMimeType: string | null; sourceEncoding: string | null;
      sourceDisplayLabel: string; evidenceObjectKey: string | null;
      manualIdempotencyKey: string | null; adapterId: string; adapterVersion: string;
      parserVersion: string; mappingVersion: string; mappingContractJson: string;
      statementPeriodStartDate: string | null; statementPeriodEndDate: string | null;
      sourceTimezone: string | null; rows: readonly JournalAdapterSourceRow[];
      issues: readonly JournalImportIssue[]; coverageIntervals: readonly {
        assetClass: string; coverageKind: string; localStartDate: string;
        localEndDate: string; sourceTimezone: string;
      }[]; positionFacts: readonly {
        recordOrdinal: number; normalizedSymbol: string; assetClass: string;
        currency: string; factKind: string; effectiveLocalDate: string;
        timePrecision: string; quantityDecimal: string;
      }[]; plannedExecutions: readonly PlannedExecution[];
      sourceIdentityForRows: string; now?: Date;
    }>,
  ): JournalImportCommitResult {
    const accountScope = this.accounts.requireAccountScope(scope, input.accountId);
    if (input.sourceIdentityId) this.imports.requireSourceIdentity(scope.workspaceId, input.accountId, input.sourceIdentityId);
    const timestamp = createCanonicalUtcTimestamp(input.now);
    const importBatchId = createCanonicalUuidV4();
    const importEventId = createCanonicalUuidV4();
    const pendingDecisionCount = input.issues.filter((entry) =>
      !entry.isBlocking && entry.severity !== "info").length;
    const currentState = pendingDecisionCount > 0 ? "accepted_with_decisions" as const : "accepted" as const;
    let createdExecutionCount = 0;
    let matchedExecutionCount = 0;
    const executionIds: string[] = [];

    const concurrentPrior = this.imports.immediate((): JournalImportCommitResult | null => {
      let prior: ExistingImportBatch | null;
      if (input.sourceKind === "broker_statement") {
        if (input.sourceFileSha256 === null) {
          platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", {
            check: "broker_import_digest_contract",
          });
        }
        prior = this.imports.findByFileDigest(
          scope.workspaceId,
          input.sourceSystem,
          input.sourceFileSha256,
        );
        if (prior && prior.accountId !== input.accountId) {
          platformFailure("TRADERLINK_JOURNAL_IMPORT_CONFLICT", {
            reason: "broker_file_digest_account_mismatch",
          });
        }
      } else {
        if (input.manualIdempotencyKey === null) {
          platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", {
            check: "manual_import_idempotency_contract",
          });
        }
        prior = this.imports.findByManualIdempotency(
          scope.workspaceId,
          input.accountId,
          input.manualIdempotencyKey,
        );
        if (prior) this.requireMatchingManualPayload(scope, prior, input.rows);
      }
      if (prior) return this.alreadyImportedResult(scope, prior);

      this.imports.insertImportBatch({
        importBatchId, workspaceId: scope.workspaceId, accountId: input.accountId,
        sourceIdentityId: input.sourceIdentityId, sourceKind: input.sourceKind,
        sourceSystem: input.sourceSystem, sourceFileSha256: input.sourceFileSha256,
        sourceFileSizeBytes: input.sourceFileSizeBytes, sourceMimeType: input.sourceMimeType,
        sourceEncoding: input.sourceEncoding, sourceDisplayLabel: input.sourceDisplayLabel,
        evidenceObjectKey: input.evidenceObjectKey, manualIdempotencyKey: input.manualIdempotencyKey,
        adapterId: input.adapterId, adapterVersion: input.adapterVersion,
        parserVersion: input.parserVersion, mappingVersion: input.mappingVersion,
        mappingContractJson: input.mappingContractJson,
        statementPeriodStartDate: input.statementPeriodStartDate,
        statementPeriodEndDate: input.statementPeriodEndDate, sourceTimezone: input.sourceTimezone,
        currentState, currentEventId: importEventId, preservedRowCount: input.rows.length,
        mappedExecutionCount: input.plannedExecutions.length,
        unsupportedRowCount: input.rows.filter((row) => row.classification === "unsupported").length,
        issueCount: input.issues.length, pendingDecisionCount,
        createdByUserId: scope.userId, timestamp,
      });
      this.imports.insertAcceptedEvent({ importEventId, workspaceId: scope.workspaceId,
        accountId: input.accountId, importBatchId, eventType: currentState,
        actorUserId: scope.userId, timestamp });
      const rowIds = new Map<number, string>();
      for (const row of input.rows) {
        const sourceRowId = createCanonicalUuidV4();
        rowIds.set(row.recordOrdinal, sourceRowId);
        this.imports.insertSourceRow({
          sourceRowId, workspaceId: scope.workspaceId, accountId: input.accountId,
          importBatchId, recordOrdinal: row.recordOrdinal,
          sourceRecordIdentitySha256: sourceRecordIdentity(input.sourceIdentityForRows, row.recordOrdinal),
          rawRecordSha256: row.rawRecordSha256, rawFieldsJson: row.rawFieldsJson,
          sectionName: row.sectionName, recordType: row.recordType,
          assetCategory: row.assetCategory, contentFingerprintSha256: row.contentFingerprintSha256,
          occurrenceOrdinal: row.occurrenceOrdinal,
          initialClassification: row.classification, mappingVersion: input.mappingVersion, timestamp,
        });
      }
      const instrumentIds = new Map<string, string>();
      const findOrCreateInstrument = (
        assetClass: string,
        normalizedSymbol: string,
        tradeCurrency: string,
      ): string => {
        const key = `${assetClass}\u001f${normalizedSymbol}\u001f${tradeCurrency}`;
        const cached = instrumentIds.get(key);
        if (cached) return cached;
        const instrumentId = this.imports.findOrCreateInstrument({
          instrumentId: createCanonicalUuidV4(),
          workspaceId: scope.workspaceId,
          assetClass,
          normalizedSymbol,
          quoteCurrency: tradeCurrency,
          timestamp,
        });
        instrumentIds.set(key, instrumentId);
        return instrumentId;
      };
      for (const finding of input.issues) this.imports.insertIssue({
        sourceIssueId: createCanonicalUuidV4(), workspaceId: scope.workspaceId,
        accountId: input.accountId, importBatchId,
        sourceRowId: finding.recordOrdinal === null ? null : (rowIds.get(finding.recordOrdinal) ?? null),
        instrumentId: finding.chainHint
          ? findOrCreateInstrument(
              finding.chainHint.assetClass,
              finding.chainHint.normalizedSymbol,
              finding.chainHint.tradeCurrency,
            )
          : null,
        tradeCurrency: finding.chainHint?.tradeCurrency ?? null,
        effectiveAtUtc: finding.chainHint?.effectiveAtUtc ?? null,
        issueScope: finding.issueScope, issueCode: finding.issueCode,
        severity: finding.severity, isBlocking: finding.isBlocking, timestamp,
      });
      for (const coverage of input.coverageIntervals) this.imports.insertCoverage({
        coverageIntervalId: createCanonicalUuidV4(), workspaceId: scope.workspaceId,
        accountId: input.accountId, importBatchId, ...coverage, timestamp,
      });
      for (const fact of input.positionFacts) {
        const sourceRowId = rowIds.get(fact.recordOrdinal);
        if (!sourceRowId) platformFailure("TRADERLINK_JOURNAL_IMPORT_CONFLICT", { reason: "position_source_missing" });
        const instrumentId = findOrCreateInstrument(
          fact.assetClass,
          fact.normalizedSymbol,
          fact.currency,
        );
        this.imports.insertPositionFact({
          positionFactId: createCanonicalUuidV4(), workspaceId: scope.workspaceId,
          accountId: input.accountId, importBatchId, sourceRowId, instrumentId,
          currency: fact.currency, factKind: fact.factKind,
          effectiveLocalDate: fact.effectiveLocalDate, timePrecision: fact.timePrecision,
          sourceTimezone: input.sourceTimezone ?? input.coverageIntervals[0]?.sourceTimezone ?? "UTC",
          quantityDecimal: fact.quantityDecimal, timestamp,
        });
      }
      const reconciliationCandidates = new Map<string, {
        reconciliation: PlannedReconciliation;
        provisionalExecutions: Array<{
          executionId: string;
          sourceRowId: string;
          evidenceSha256: string;
        }>;
      }>();
      for (const plan of input.plannedExecutions) {
        const sourceRowId = rowIds.get(plan.execution.recordOrdinal);
        if (!sourceRowId) platformFailure("TRADERLINK_JOURNAL_IMPORT_CONFLICT", { reason: "execution_source_missing" });
        const instrumentId = findOrCreateInstrument(
          plan.execution.assetClass,
          plan.execution.normalizedSymbol,
          plan.execution.tradeCurrency,
        );
        let executionId = plan.matchedExecutionId;
        let executionVersionId: string;
        let provenanceKind: "broker" | "manual" | "overlap_match";
        if (executionId) {
          const current = this.executions.current(executionId, scope.workspaceId, input.accountId);
          if (!current) platformFailure("TRADERLINK_JOURNAL_EXECUTION_CONFLICT");
          if (current.currentState === "superseded") {
            platformFailure("TRADERLINK_JOURNAL_EXECUTION_CONFLICT");
          }
          if (plan.enrichFromIncoming) {
            const enriched = this.executions.appendVersion({
              executionId,
              executionVersionId: createCanonicalUuidV4(),
              workspaceId: scope.workspaceId,
              accountId: input.accountId,
              expectedCurrentVersionId: current.currentVersionId,
              versionNumber: current.versionNumber + 1,
              state: current.currentState === "excluded_by_trader"
                ? "excluded_by_trader"
                : current.currentState === "needs_decision"
                  ? "needs_decision"
                  : plan.execution.factCompleteness === "complete"
                    ? "accepted"
                    : "needs_decision",
              facts: executionFacts(plan.execution, instrumentId),
              actorKind: "system",
              actorUserId: null,
              changeReasonCode: "broker_overlap_enrichment",
              timestamp,
            });
            executionVersionId = enriched.executionVersionId;
          } else {
            executionVersionId = current.currentVersionId;
            if (plan.factConflict && current.currentState !== "excluded_by_trader") {
              this.executions.updateState({
                executionId,
                workspaceId: scope.workspaceId,
                accountId: input.accountId,
                expectedCurrentVersionId: current.currentVersionId,
                state: "needs_decision",
                timestamp,
              });
            }
          }
          provenanceKind = "overlap_match";
          matchedExecutionCount += 1;
        } else {
          executionId = createCanonicalUuidV4();
          executionVersionId = createCanonicalUuidV4();
          this.executions.createExecution({
            executionId, executionVersionId, workspaceId: scope.workspaceId,
            accountId: input.accountId,
            state: plan.ambiguous || plan.execution.factCompleteness !== "complete" ? "needs_decision" : "accepted",
            facts: executionFacts(plan.execution, instrumentId), actorKind: "system",
            actorUserId: null, changeReasonCode: input.sourceKind === "manual_batch" ? "manual_import" : "broker_import",
            timestamp,
          });
          provenanceKind = input.sourceKind === "manual_batch" ? "manual" : "broker";
          createdExecutionCount += 1;
          if (input.sourceKind === "manual_batch") this.executions.insertAlias({
            executionAliasId: createCanonicalUuidV4(), workspaceId: scope.workspaceId,
            accountId: input.accountId, executionId, aliasType: "manual_entry",
            aliasSchemeVersion: "manual_idempotency_v1",
            aliasSha256: sha256(`${input.manualIdempotencyKey}\u001f${plan.execution.recordOrdinal}`),
            occurrenceOrdinal: null, timestamp,
          });
        }
        if ((!plan.ambiguous || plan.reconciliation !== null) && plan.attachContentAlias) {
          this.touchOrInsertActiveAlias({
            workspaceId: scope.workspaceId,
            accountId: input.accountId,
            executionId,
            aliasType: "content_occurrence",
            aliasSha256: plan.activeContentAliasSha256,
            occurrenceOrdinal: plan.execution.contentOccurrenceOrdinal,
            timestamp,
          });
        }
        if (plan.activeStrongAliasSha256 && (!plan.ambiguous || plan.reconciliation !== null)) {
          this.touchOrInsertActiveAlias({
            workspaceId: scope.workspaceId,
            accountId: input.accountId,
            executionId,
            aliasType: "broker_fill",
            aliasSha256: plan.activeStrongAliasSha256,
            occurrenceOrdinal: null,
            timestamp,
          });
        }
        this.executions.insertProvenance({
          executionProvenanceId: createCanonicalUuidV4(), workspaceId: scope.workspaceId,
          accountId: input.accountId, executionId, executionVersionId,
          importBatchId, sourceRowId, provenanceKind,
          providerIdentitySchemeVersion: plan.activeStrongAliasSha256
            ? this.digester.activeSchemeVersion
            : null,
          providerIdentitySha256: plan.activeStrongAliasSha256, timestamp,
        });
        if (plan.reconciliation) {
          const candidate = reconciliationCandidates.get(
            plan.reconciliation.overlapKeySha256,
          ) ?? {
            reconciliation: plan.reconciliation,
            provisionalExecutions: [],
          };
          candidate.provisionalExecutions.push(Object.freeze({
            executionId,
            sourceRowId,
            evidenceSha256: sha256(JSON.stringify([
              "provisional-broker-execution-v1",
              plan.activeStrongAliasSha256 ?? "no_provider_identity",
              plan.activeContentAliasSha256,
              plan.execution.contentOccurrenceOrdinal,
            ])),
          }));
          reconciliationCandidates.set(
            plan.reconciliation.overlapKeySha256,
            candidate,
          );
        }
        executionIds.push(executionId);
      }
      for (const candidate of reconciliationCandidates.values()) {
        this.reconciliations.createCandidate({
          scope: accountScope,
          overlapKeySha256: candidate.reconciliation.overlapKeySha256,
          manualExecutionIds: candidate.reconciliation.manualExecutionIds,
          provisionalExecutions: candidate.provisionalExecutions,
          evidenceSha256: candidate.reconciliation.evidenceSha256,
          timestamp,
        });
      }
      return null;
    });
    if (concurrentPrior) return concurrentPrior;
    return Object.freeze({
      status: "committed", importBatchId, importEventId,
      accountId: input.accountId, preservedRowCount: input.rows.length,
      createdExecutionCount, matchedExecutionCount,
      pendingSourceDecisionCount: pendingDecisionCount,
      executionIds: Object.freeze([...new Set(executionIds)]),
    });
  }
}
