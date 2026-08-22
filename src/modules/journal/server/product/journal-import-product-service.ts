import { createHash } from "node:crypto";

import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { deriveJournalAccountSelectionRef } from "@/src/modules/platform/contracts/journal-account-selection";
import { resolvePlatformDatabaseConfig } from "@/src/modules/platform/server/database/platform-database-config";
import { PlatformNotificationRepository } from "@/src/modules/platform/server/notifications/platform-notification-repository";
import {
  createCanonicalUtcTimestamp,
  platformFailure,
} from "@/src/modules/platform/server/database/platform-migration-contract";
import type { JournalScopedImportPreview } from "../../contracts/journal-import-contracts";
import {
  type JournalGenericStatementMappingContract,
  parseJournalGenericStatementMappingContract,
} from "../imports/journal-generic-mapped-statement-adapter";
import {
  resolveJournalEvidenceVaultBoundary,
  promoteJournalEvidenceObject,
} from "../imports/journal-evidence-vault";
import { loadJournalPrivacyHmacConfiguration } from "../imports/journal-import-service";
import { JournalImportAttemptRepository } from "../administration/journal-import-attempt-repository";
import { withStagedJournalUpload } from "../imports/journal-upload-staging";
import {
  withWritableJournalIntegrityRuntime,
  type JournalIntegrityRuntime,
} from "../journal-integrity-runtime";
import {
  canonicalJournalImportPreviewPayload,
  createJournalImportPreviewAuthority,
} from "./journal-import-preview-authority";

export type JournalImportMappingPreview = Readonly<{
  adapter: string;
  commitKind: "ibkr" | "mapped_csv";
  mappingOrigin: "verified_adapter" | "saved_exact_template" | "manual_mapping";
  mappingContract: JournalGenericStatementMappingContract | null;
  mappingVersion: string;
  parserVersion: string;
  accountLabel: string;
  accountSelectionRef: string;
  sourceIdentityConfirmationRequired: boolean;
  previewRef: string;
  previewExpiresAtUtc: string;
  sourceTimezone: string;
  statementPeriodStartDate: string | null;
  statementPeriodEndDate: string | null;
  canCommit: boolean;
  exactReimport: boolean;
  preservedRowCount: number;
  mappedExecutionCount: number;
  mappedPositionFactCount: number;
  unsupportedRowCount: number;
  rowsByClassification: JournalScopedImportPreview["rowsByClassification"];
  plannedNewExecutionCount: number;
  plannedMatchedExecutionCount: number;
  plannedAmbiguousExecutionCount: number;
  expectedPendingDecisionCount: number;
  issues: JournalScopedImportPreview["issues"];
  coverageIntervals: JournalScopedImportPreview["coverageIntervals"];
  mappedFields: readonly Readonly<{
    source: string;
    destination: string;
  }>[];
}>;

type JournalImportPrivateMappingPreview = Omit<
  JournalImportMappingPreview,
  "previewRef" | "previewExpiresAtUtc"
> & Readonly<{
  accountRef: string;
  sourceFileSha256: string;
  sourceFileSizeBytes: number;
}>;

const IBKR_MAPPED_FIELDS = Object.freeze([
  Object.freeze({ source: "Account Information · Account", destination: "Journal trading account" }),
  Object.freeze({ source: "Statement · Period", destination: "Statement coverage period" }),
  Object.freeze({ source: "Trades · Symbol", destination: "Symbol" }),
  Object.freeze({ source: "Trades · Currency", destination: "Trade currency" }),
  Object.freeze({ source: "Trades · Date/Time", destination: "Execution date and time" }),
  Object.freeze({ source: "Trades · Quantity sign", destination: "Buy or sell" }),
  Object.freeze({ source: "Trades · Quantity", destination: "Quantity" }),
  Object.freeze({ source: "Trades · T. Price", destination: "Execution price" }),
  Object.freeze({ source: "Trades · Comm/Fee", destination: "Fees" }),
  Object.freeze({ source: "Trades · TradeID", destination: "Broker execution identity" }),
  Object.freeze({ source: "Open Positions / Mark-to-Market", destination: "Position evidence" }),
] as const);

function safePreview(
  runtime: JournalIntegrityRuntime,
  scope: WorkspaceAccessScope,
  preview: JournalScopedImportPreview,
): JournalImportPrivateMappingPreview {
  if (!scope.activeAccountId || preview.accountId !== scope.activeAccountId) {
    platformFailure("TRADERLINK_JOURNAL_IMPORT_CONFLICT", {
      reason: "selected_account_mismatch",
    });
  }
  const account = runtime.accounts.requireAccountRecord(scope, preview.accountId);
  const accountRef = createHash("sha256").update([
    "journal-import-account-confirmation-v1",
    preview.sourceFileSha256,
    account.accountId,
  ].join("\u001f"), "utf8").digest("hex");
  return Object.freeze({
    adapter: "Interactive Brokers activity statement" as const,
    commitKind: "ibkr" as const,
    mappingOrigin: "verified_adapter" as const,
    mappingContract: null,
    mappingVersion: preview.mappingVersion,
    parserVersion: preview.parserVersion,
    accountLabel: account.displayName,
    accountRef,
    accountSelectionRef: deriveJournalAccountSelectionRef(
      scope.workspaceId,
      preview.accountId,
    ),
    sourceIdentityConfirmationRequired:
      preview.sourceIdentityConfirmationRequired,
    sourceFileSha256: preview.sourceFileSha256,
    sourceFileSizeBytes: preview.sourceFileSizeBytes,
    sourceTimezone: preview.sourceTimezone,
    statementPeriodStartDate: preview.statementPeriodStartDate,
    statementPeriodEndDate: preview.statementPeriodEndDate,
    canCommit: preview.canCommit,
    exactReimport: preview.exactReimport,
    preservedRowCount: preview.preservedRowCount,
    mappedExecutionCount: preview.mappedExecutionCount,
    mappedPositionFactCount: preview.mappedPositionFactCount,
    unsupportedRowCount: preview.unsupportedRowCount,
    rowsByClassification: preview.rowsByClassification,
    plannedNewExecutionCount: preview.plannedNewExecutionCount,
    plannedMatchedExecutionCount: preview.plannedMatchedExecutionCount,
    plannedAmbiguousExecutionCount: preview.plannedAmbiguousExecutionCount,
    expectedPendingDecisionCount: preview.expectedPendingSourceDecisionCount,
    issues: preview.issues,
    coverageIntervals: preview.coverageIntervals,
    mappedFields: IBKR_MAPPED_FIELDS,
  });
}

function safeGenericPreview(
  runtime: JournalIntegrityRuntime,
  scope: WorkspaceAccessScope,
  preview: JournalScopedImportPreview,
  mapping: JournalGenericStatementMappingContract,
  mappingOrigin: "saved_exact_template" | "manual_mapping",
): JournalImportPrivateMappingPreview {
  if (!scope.activeAccountId || preview.accountId !== scope.activeAccountId) {
    platformFailure("TRADERLINK_JOURNAL_IMPORT_CONFLICT", {
      reason: "selected_account_mismatch",
    });
  }
  const account = runtime.accounts.requireAccountRecord(scope, preview.accountId);
  const accountRef = createHash("sha256").update([
    "journal-import-account-confirmation-v1",
    preview.sourceFileSha256,
    account.accountId,
    mapping.structuralSignatureSha256,
  ].join("\u001f"), "utf8").digest("hex");
  return Object.freeze({
    adapter: `${mapping.brokerName} user-confirmed statement mapping`,
    commitKind: "mapped_csv" as const,
    mappingOrigin,
    mappingContract: mapping,
    mappingVersion: preview.mappingVersion,
    parserVersion: preview.parserVersion,
    accountLabel: account.displayName,
    accountRef,
    accountSelectionRef: deriveJournalAccountSelectionRef(
      scope.workspaceId,
      preview.accountId,
    ),
    sourceIdentityConfirmationRequired: false,
    sourceFileSha256: preview.sourceFileSha256,
    sourceFileSizeBytes: preview.sourceFileSizeBytes,
    sourceTimezone: preview.sourceTimezone,
    statementPeriodStartDate: preview.statementPeriodStartDate,
    statementPeriodEndDate: preview.statementPeriodEndDate,
    canCommit: preview.canCommit,
    exactReimport: preview.exactReimport,
    preservedRowCount: preview.preservedRowCount,
    mappedExecutionCount: preview.mappedExecutionCount,
    mappedPositionFactCount: preview.mappedPositionFactCount,
    unsupportedRowCount: preview.unsupportedRowCount,
    rowsByClassification: preview.rowsByClassification,
    plannedNewExecutionCount: preview.plannedNewExecutionCount,
    plannedMatchedExecutionCount: preview.plannedMatchedExecutionCount,
    plannedAmbiguousExecutionCount: preview.plannedAmbiguousExecutionCount,
    expectedPendingDecisionCount: preview.expectedPendingSourceDecisionCount,
    issues: preview.issues,
    coverageIntervals: preview.coverageIntervals,
    mappedFields: Object.freeze(Object.entries(mapping.columns)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([destination, source]) => Object.freeze({
        source,
        destination: destination.replace(/([A-Z])/gu, " $1").toLowerCase(),
      }))),
  });
}

function browserPreview(
  scope: WorkspaceAccessScope,
  preview: JournalImportPrivateMappingPreview,
  attemptBindingSha256: string,
): JournalImportMappingPreview {
  const mappingContractSha256 = preview.mappingContract
    ? createHash("sha256")
      .update(`${JSON.stringify(preview.mappingContract)}\n`, "utf8")
      .digest("hex")
    : null;
  const authority = createJournalImportPreviewAuthority(
    loadJournalPrivacyHmacConfiguration(),
  );
  const confirmation = authority.issue(canonicalJournalImportPreviewPayload({
    scope,
    sourceFileSha256: preview.sourceFileSha256,
    sourceFileSizeBytes: preview.sourceFileSizeBytes,
    accountRef: preview.accountRef,
    accountSelectionRef: preview.accountSelectionRef,
    commitKind: preview.commitKind,
    mappingVersion: preview.mappingVersion,
    parserVersion: preview.parserVersion,
    mappingContractSha256,
    sourceTimezone: preview.sourceTimezone,
    sourceIdentityConfirmationRequired: preview.sourceIdentityConfirmationRequired,
    attemptBindingSha256,
  }));
  const {
    accountRef: _accountRef,
    sourceFileSha256: _sourceFileSha256,
    sourceFileSizeBytes: _sourceFileSizeBytes,
    ...safe
  } = preview;
  void _accountRef;
  void _sourceFileSha256;
  void _sourceFileSizeBytes;
  return Object.freeze({ ...safe, ...confirmation });
}

function verifyPreviewRef(
  scope: WorkspaceAccessScope,
  preview: JournalImportPrivateMappingPreview,
  previewRef: string,
  attemptBindingSha256: string,
): void {
  const mappingContractSha256 = preview.mappingContract
    ? createHash("sha256")
      .update(`${JSON.stringify(preview.mappingContract)}\n`, "utf8")
      .digest("hex")
    : null;
  const verified = createJournalImportPreviewAuthority(
    loadJournalPrivacyHmacConfiguration(),
  ).verify(previewRef, canonicalJournalImportPreviewPayload({
    scope,
    sourceFileSha256: preview.sourceFileSha256,
    sourceFileSizeBytes: preview.sourceFileSizeBytes,
    accountRef: preview.accountRef,
    accountSelectionRef: preview.accountSelectionRef,
    commitKind: preview.commitKind,
    mappingVersion: preview.mappingVersion,
    parserVersion: preview.parserVersion,
    mappingContractSha256,
    sourceTimezone: preview.sourceTimezone,
    sourceIdentityConfirmationRequired: preview.sourceIdentityConfirmationRequired,
    attemptBindingSha256,
  }));
  if (!verified) {
    platformFailure("TRADERLINK_JOURNAL_IMPORT_SOURCE_EVIDENCE_MISMATCH", {
      check: "opaque_preview_confirmation",
    });
  }
}

export function previewJournalIbkrUpload(
  scope: WorkspaceAccessScope,
  input: Readonly<{
    sourceBytes: Uint8Array;
    sourceTimezone: string;
    attemptBindingSha256: string;
  }>,
): JournalImportMappingPreview {
  return withWritableJournalIntegrityRuntime(scope, (runtime) => browserPreview(
    scope,
    safePreview(
      runtime,
      scope,
      runtime.imports.previewIbkrForWorkspace(scope, {
        sourceBytes: input.sourceBytes,
        sourceTimezone: input.sourceTimezone,
        allowSelectedAccountIdentityConfirmation: true,
      }),
    ),
    input.attemptBindingSha256,
  ));
}

export function previewJournalGenericMappedUpload(
  scope: WorkspaceAccessScope,
  input: Readonly<{
    sourceBytes: Uint8Array;
    mapping: JournalGenericStatementMappingContract | unknown;
    mappingOrigin?: "saved_exact_template" | "manual_mapping";
    attemptBindingSha256: string;
  }>,
): JournalImportMappingPreview {
  const mapping = parseJournalGenericStatementMappingContract(input.mapping);
  const accountId = scope.activeAccountId;
  if (!accountId) platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
  return withWritableJournalIntegrityRuntime(scope, (runtime) => browserPreview(
    scope,
    safeGenericPreview(
      runtime,
      scope,
      runtime.imports.previewGenericMappedForWorkspace(scope, {
        sourceBytes: input.sourceBytes,
        accountId,
        mapping,
      }),
      mapping,
      input.mappingOrigin ?? "manual_mapping",
    ),
    input.attemptBindingSha256,
  ));
}

export function previewJournalSavedGenericMappingUpload(
  scope: WorkspaceAccessScope,
  input: Readonly<{
    sourceBytes: Uint8Array;
    structuralSignatures: readonly string[];
    brokerName: string;
    attemptBindingSha256: string;
  }>,
): JournalImportMappingPreview | null {
  const accountId = scope.activeAccountId;
  if (!accountId) platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
  return withWritableJournalIntegrityRuntime(scope, (runtime) => {
    for (const structuralSignatureSha256 of input.structuralSignatures) {
      const mapping = runtime.imports.findSavedGenericMappingForWorkspace(scope, {
        accountId,
        structuralSignatureSha256,
        brokerName: input.brokerName,
      });
      if (!mapping) continue;
      return browserPreview(
        scope,
        safeGenericPreview(
          runtime,
          scope,
          runtime.imports.previewGenericMappedForWorkspace(scope, {
            sourceBytes: input.sourceBytes,
            accountId,
            mapping,
          }),
          mapping,
          "saved_exact_template",
        ),
        input.attemptBindingSha256,
      );
    }
    return null;
  });
}

export function commitJournalIbkrUpload(
  scope: WorkspaceAccessScope,
  input: Readonly<{
    sourceBytes: Uint8Array;
    sourceTimezone: string;
    previewRef: string;
    attemptBindingSha256: string;
    attemptCorrelationSha256: string;
    confirmSourceIdentityLink: boolean;
  }>,
): Readonly<{
  status: "committed" | "already_imported";
  preservedRowCount: number;
  createdExecutionCount: number;
  matchedExecutionCount: number;
  pendingDecisionCount: number;
  rebuildCount: number;
}> {
  const databasePath = resolvePlatformDatabaseConfig({}).databasePath;
  return withStagedJournalUpload(input.sourceBytes, (sourcePath) => {
    const vault = resolveJournalEvidenceVaultBoundary({
      sourcePath,
      databasePath,
    });
    let promoted = false;
    try {
      return withWritableJournalIntegrityRuntime(scope, (runtime, database) => {
        const preview = runtime.imports.previewIbkrForWorkspace(scope, {
          sourceBytes: input.sourceBytes,
          sourceTimezone: input.sourceTimezone,
          allowSelectedAccountIdentityConfirmation: true,
        });
        const safe = safePreview(runtime, scope, preview);
        verifyPreviewRef(
          scope,
          safe,
          input.previewRef,
          input.attemptBindingSha256,
        );
        if (
          safe.sourceIdentityConfirmationRequired !== input.confirmSourceIdentityLink ||
          !preview.canCommit
        ) {
          platformFailure("TRADERLINK_JOURNAL_IMPORT_SOURCE_EVIDENCE_MISMATCH", {
            check: "confirmed_mapping_preview",
          });
        }
        const attempts = new JournalImportAttemptRepository(database);
        return attempts.immediate(() => {
          const current = attempts.findByIdempotency(
            scope,
            input.attemptBindingSha256,
          );
          if (!current) platformFailure("TRADERLINK_JOURNAL_IMPORT_CONFLICT", {
            reason: "attempt_missing_at_commit",
          });
          if (["committed", "committed_with_decisions", "duplicate"].includes(
            current.currentState,
          )) {
            return Object.freeze({
              status: "already_imported" as const,
              preservedRowCount: current.preservedRowCount,
              createdExecutionCount: 0,
              matchedExecutionCount: current.mappedExecutionCount,
              pendingDecisionCount: current.pendingDecisionCount,
              rebuildCount: 0,
            });
          }
          if (current.currentState !== "preview_ready") {
            platformFailure("TRADERLINK_JOURNAL_IMPORT_CONFLICT", {
              reason: "attempt_not_preview_ready",
            });
          }
          const timestamp = createCanonicalUtcTimestamp(new Date());
          const committing = attempts.transition({
            scope,
            importAttemptId: current.importAttemptId,
            expectedRevision: current.revision,
            nextState: "committing",
            reasonCode: "commit_started",
            correlationRefSha256: input.attemptCorrelationSha256,
            timestamp,
          });
          const account = runtime.accounts.requireAccountRecord(scope, preview.accountId);
          const promotion = promoteJournalEvidenceObject(vault, {
            sourceBytes: input.sourceBytes,
            sourceFileSha256: preview.sourceFileSha256,
            sourceFileSizeBytes: preview.sourceFileSizeBytes,
          });
          promoted = true;
          const period = preview.statementPeriodStartDate && preview.statementPeriodEndDate
            ? `${preview.statementPeriodStartDate} to ${preview.statementPeriodEndDate}`
            : "period pending review";
          const committed = runtime.command.commitIbkrStatement(scope, {
            sourceBytes: input.sourceBytes,
            sourceTimezone: input.sourceTimezone,
            privacySafeAccountDisplay: account.displayName,
            sourceDisplayLabel: `IBKR statement ${period}`,
            evidenceObjectKey: promotion.evidenceObjectKey,
            confirmedSourceIdentityAccountId:
              safe.sourceIdentityConfirmationRequired
                ? preview.accountId
                : undefined,
          });
          const terminalState = committed.status === "already_imported"
            ? "duplicate" as const
            : committed.relatedDecisionIds.length > 0
              ? "committed_with_decisions" as const
              : "committed" as const;
          attempts.transition({
            scope,
            importAttemptId: committing.importAttemptId,
            expectedRevision: committing.revision,
            nextState: terminalState,
            reasonCode: terminalState === "duplicate"
              ? "exact_duplicate"
              : "import_committed",
            correlationRefSha256: input.attemptCorrelationSha256,
            timestamp,
            committedImportBatchId: terminalState === "duplicate"
              ? null
              : committed.importBatchId,
            failureCode: terminalState === "duplicate" ? "exact_duplicate" : null,
            counts: {
              preserved_rows: committed.preservedRowCount,
              mapped_executions: preview.mappedExecutionCount,
              unsupported_rows: preview.unsupportedRowCount,
              issues: preview.issues.length,
              pending_decisions: committed.relatedDecisionIds.length,
            },
          });
          if (terminalState !== "duplicate") {
            new PlatformNotificationRepository(database).create({
              category: "statement_import",
              destinationPath: terminalState === "committed_with_decisions"
                ? "/data-decisions"
                : "/imports",
              journalAccountId: preview.accountId,
              kind: terminalState === "committed_with_decisions"
                ? "statement_import_needs_action"
                : "statement_import_completed",
              occurredAtUtc: timestamp,
              scope,
              sourceEventKey: `statement_import_${current.importAttemptId}`,
              summary: terminalState === "committed_with_decisions"
                ? "Your statement was imported, and a few items need your review."
                : "Your statement is now available in your journal.",
              title: terminalState === "committed_with_decisions"
                ? "Statement import needs attention"
                : "Statement import complete",
            });
          }
          return Object.freeze({
            status: committed.status,
            preservedRowCount: committed.preservedRowCount,
            createdExecutionCount: committed.createdExecutionCount,
            matchedExecutionCount: committed.matchedExecutionCount,
            pendingDecisionCount: committed.relatedDecisionIds.length,
            rebuildCount: committed.rebuilds.length,
          });
        });
      });
    } catch (error) {
      if (promoted) {
        platformFailure("TRADERLINK_JOURNAL_SOURCE_IMPORT_ORPHANED_EVIDENCE", {
          orphanState: "vault_object_reference_unverified",
        }, error);
      }
      throw error;
    }
  });
}

export function commitJournalGenericMappedUpload(
  scope: WorkspaceAccessScope,
  input: Readonly<{
    sourceBytes: Uint8Array;
    mapping: JournalGenericStatementMappingContract | unknown;
    previewRef: string;
    attemptBindingSha256: string;
    attemptCorrelationSha256: string;
  }>,
): Readonly<{
  status: "committed" | "already_imported";
  preservedRowCount: number;
  createdExecutionCount: number;
  matchedExecutionCount: number;
  pendingDecisionCount: number;
  rebuildCount: number;
}> {
  const mapping = parseJournalGenericStatementMappingContract(input.mapping);
  const databasePath = resolvePlatformDatabaseConfig({}).databasePath;
  return withStagedJournalUpload(input.sourceBytes, (sourcePath) => {
    const vault = resolveJournalEvidenceVaultBoundary({ sourcePath, databasePath });
    let promoted = false;
    try {
      return withWritableJournalIntegrityRuntime(scope, (runtime, database) => {
        const accountId = scope.activeAccountId;
        if (!accountId) platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
        const preview = runtime.imports.previewGenericMappedForWorkspace(scope, {
          sourceBytes: input.sourceBytes,
          accountId,
          mapping,
        });
        const safe = safeGenericPreview(runtime, scope, preview, mapping, "manual_mapping");
        verifyPreviewRef(
          scope,
          safe,
          input.previewRef,
          input.attemptBindingSha256,
        );
        if (!preview.canCommit) {
          platformFailure("TRADERLINK_JOURNAL_IMPORT_SOURCE_EVIDENCE_MISMATCH", {
            check: "confirmed_mapping_preview",
          });
        }
        const attempts = new JournalImportAttemptRepository(database);
        return attempts.immediate(() => {
          const current = attempts.findByIdempotency(
            scope,
            input.attemptBindingSha256,
          );
          if (!current) platformFailure("TRADERLINK_JOURNAL_IMPORT_CONFLICT", {
            reason: "attempt_missing_at_commit",
          });
          if (["committed", "committed_with_decisions", "duplicate"].includes(
            current.currentState,
          )) {
            return Object.freeze({
              status: "already_imported" as const,
              preservedRowCount: current.preservedRowCount,
              createdExecutionCount: 0,
              matchedExecutionCount: current.mappedExecutionCount,
              pendingDecisionCount: current.pendingDecisionCount,
              rebuildCount: 0,
            });
          }
          if (current.currentState !== "preview_ready") {
            platformFailure("TRADERLINK_JOURNAL_IMPORT_CONFLICT", {
              reason: "attempt_not_preview_ready",
            });
          }
          const timestamp = createCanonicalUtcTimestamp(new Date());
          const committing = attempts.transition({
            scope,
            importAttemptId: current.importAttemptId,
            expectedRevision: current.revision,
            nextState: "committing",
            reasonCode: "commit_started",
            correlationRefSha256: input.attemptCorrelationSha256,
            timestamp,
          });
          const promotion = promoteJournalEvidenceObject(vault, {
            sourceBytes: input.sourceBytes,
            sourceFileSha256: preview.sourceFileSha256,
            sourceFileSizeBytes: preview.sourceFileSizeBytes,
            evidenceNamespace: "mapped_csv",
          });
          promoted = true;
          const committed = runtime.command.commitGenericMappedStatement(scope, {
            sourceBytes: input.sourceBytes,
            accountId,
            mapping,
            sourceDisplayLabel: `${mapping.brokerName} mapped statement`,
            evidenceObjectKey: promotion.evidenceObjectKey,
          });
          const terminalState = committed.status === "already_imported"
            ? "duplicate" as const
            : committed.relatedDecisionIds.length > 0
              ? "committed_with_decisions" as const
              : "committed" as const;
          attempts.transition({
            scope,
            importAttemptId: committing.importAttemptId,
            expectedRevision: committing.revision,
            nextState: terminalState,
            reasonCode: terminalState === "duplicate"
              ? "exact_duplicate"
              : "import_committed",
            correlationRefSha256: input.attemptCorrelationSha256,
            timestamp,
            committedImportBatchId: terminalState === "duplicate"
              ? null
              : committed.importBatchId,
            failureCode: terminalState === "duplicate" ? "exact_duplicate" : null,
            counts: {
              preserved_rows: committed.preservedRowCount,
              mapped_executions: preview.mappedExecutionCount,
              unsupported_rows: preview.unsupportedRowCount,
              issues: preview.issues.length,
              pending_decisions: committed.relatedDecisionIds.length,
            },
          });
          if (terminalState !== "duplicate") {
            new PlatformNotificationRepository(database).create({
              category: "statement_import",
              destinationPath: terminalState === "committed_with_decisions"
                ? "/data-decisions"
                : "/imports",
              journalAccountId: preview.accountId,
              kind: terminalState === "committed_with_decisions"
                ? "statement_import_needs_action"
                : "statement_import_completed",
              occurredAtUtc: timestamp,
              scope,
              sourceEventKey: `statement_import_${current.importAttemptId}`,
              summary: terminalState === "committed_with_decisions"
                ? "Your statement was imported, and a few items need your review."
                : "Your statement is now available in your journal.",
              title: terminalState === "committed_with_decisions"
                ? "Statement import needs attention"
                : "Statement import complete",
            });
          }
          return Object.freeze({
            status: committed.status,
            preservedRowCount: committed.preservedRowCount,
            createdExecutionCount: committed.createdExecutionCount,
            matchedExecutionCount: committed.matchedExecutionCount,
            pendingDecisionCount: committed.relatedDecisionIds.length,
            rebuildCount: committed.rebuilds.length,
          });
        });
      });
    } catch (error) {
      if (promoted) {
        platformFailure("TRADERLINK_JOURNAL_SOURCE_IMPORT_ORPHANED_EVIDENCE", {
          orphanState: "vault_object_reference_unverified",
        }, error);
      }
      throw error;
    }
  });
}
