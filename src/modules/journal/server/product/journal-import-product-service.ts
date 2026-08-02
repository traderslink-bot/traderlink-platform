import { createHash } from "node:crypto";

import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { deriveJournalAccountSelectionRef } from "@/src/modules/platform/contracts/journal-account-selection";
import { resolvePlatformDatabaseConfig } from "@/src/modules/platform/server/database/platform-database-config";
import { platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";
import type { JournalScopedImportPreview } from "../../contracts/journal-import-contracts";
import {
  type JournalGenericStatementMappingContract,
  parseJournalGenericStatementMappingContract,
} from "../imports/journal-generic-mapped-statement-adapter";
import {
  resolveJournalEvidenceVaultBoundary,
  promoteJournalEvidenceObject,
} from "../imports/journal-evidence-vault";
import { withStagedJournalUpload } from "../imports/journal-upload-staging";
import {
  withWritableJournalIntegrityRuntime,
  type JournalIntegrityRuntime,
} from "../journal-integrity-runtime";

export type JournalImportMappingPreview = Readonly<{
  adapter: string;
  commitKind: "ibkr" | "mapped_csv";
  mappingOrigin: "verified_adapter" | "saved_exact_template" | "manual_mapping";
  mappingContract: JournalGenericStatementMappingContract | null;
  mappingVersion: string;
  parserVersion: string;
  accountLabel: string;
  accountRef: string;
  accountSelectionRef: string;
  sourceIdentityConfirmationRequired: boolean;
  sourceFileSha256: string;
  sourceFileSizeBytes: number;
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
): JournalImportMappingPreview {
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
): JournalImportMappingPreview {
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

export function previewJournalIbkrUpload(
  scope: WorkspaceAccessScope,
  input: Readonly<{ sourceBytes: Uint8Array; sourceTimezone: string }>,
): JournalImportMappingPreview {
  return withWritableJournalIntegrityRuntime(scope, (runtime) => safePreview(
    runtime,
    scope,
    runtime.imports.previewIbkrForWorkspace(scope, {
      ...input,
      allowSelectedAccountIdentityConfirmation: true,
    }),
  ));
}

export function previewJournalGenericMappedUpload(
  scope: WorkspaceAccessScope,
  input: Readonly<{
    sourceBytes: Uint8Array;
    mapping: JournalGenericStatementMappingContract | unknown;
    mappingOrigin?: "saved_exact_template" | "manual_mapping";
  }>,
): JournalImportMappingPreview {
  const mapping = parseJournalGenericStatementMappingContract(input.mapping);
  const accountId = scope.activeAccountId;
  if (!accountId) platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
  return withWritableJournalIntegrityRuntime(scope, (runtime) => safeGenericPreview(
    runtime,
    scope,
    runtime.imports.previewGenericMappedForWorkspace(scope, {
      sourceBytes: input.sourceBytes,
      accountId,
      mapping,
    }),
    mapping,
    input.mappingOrigin ?? "manual_mapping",
  ));
}

export function previewJournalSavedGenericMappingUpload(
  scope: WorkspaceAccessScope,
  input: Readonly<{
    sourceBytes: Uint8Array;
    structuralSignatures: readonly string[];
  }>,
): JournalImportMappingPreview | null {
  const accountId = scope.activeAccountId;
  if (!accountId) platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
  return withWritableJournalIntegrityRuntime(scope, (runtime) => {
    for (const structuralSignatureSha256 of input.structuralSignatures) {
      const mapping = runtime.imports.findSavedGenericMappingForWorkspace(scope, {
        accountId,
        structuralSignatureSha256,
      });
      if (!mapping) continue;
      return safeGenericPreview(
        runtime,
        scope,
        runtime.imports.previewGenericMappedForWorkspace(scope, {
          sourceBytes: input.sourceBytes,
          accountId,
          mapping,
        }),
        mapping,
        "saved_exact_template",
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
    confirmedSourceFileSha256: string;
    confirmedAccountRef: string;
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
  const digest = createHash("sha256").update(input.sourceBytes).digest("hex");
  if (digest !== input.confirmedSourceFileSha256) {
    platformFailure("TRADERLINK_JOURNAL_IMPORT_SOURCE_EVIDENCE_MISMATCH", {
      check: "confirmed_browser_preview",
    });
  }
  const databasePath = resolvePlatformDatabaseConfig({}).databasePath;
  return withStagedJournalUpload(input.sourceBytes, (sourcePath) => {
    const vault = resolveJournalEvidenceVaultBoundary({
      sourcePath,
      databasePath,
    });
    let promoted = false;
    try {
      return withWritableJournalIntegrityRuntime(scope, (runtime) => {
        const preview = runtime.imports.previewIbkrForWorkspace(scope, {
          sourceBytes: input.sourceBytes,
          sourceTimezone: input.sourceTimezone,
          allowSelectedAccountIdentityConfirmation: true,
        });
        const safe = safePreview(runtime, scope, preview);
        if (
          preview.sourceFileSha256 !== input.confirmedSourceFileSha256 ||
          safe.accountRef !== input.confirmedAccountRef ||
          safe.sourceIdentityConfirmationRequired !==
            input.confirmSourceIdentityLink ||
          !preview.canCommit
        ) {
          platformFailure("TRADERLINK_JOURNAL_IMPORT_SOURCE_EVIDENCE_MISMATCH", {
            check: "confirmed_mapping_preview",
          });
        }
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
        return Object.freeze({
          status: committed.status,
          preservedRowCount: committed.preservedRowCount,
          createdExecutionCount: committed.createdExecutionCount,
          matchedExecutionCount: committed.matchedExecutionCount,
          pendingDecisionCount: committed.relatedDecisionIds.length,
          rebuildCount: committed.rebuilds.length,
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
    confirmedSourceFileSha256: string;
    confirmedAccountRef: string;
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
  const digest = createHash("sha256").update(input.sourceBytes).digest("hex");
  if (digest !== input.confirmedSourceFileSha256) {
    platformFailure("TRADERLINK_JOURNAL_IMPORT_SOURCE_EVIDENCE_MISMATCH", {
      check: "confirmed_browser_preview",
    });
  }
  const databasePath = resolvePlatformDatabaseConfig({}).databasePath;
  return withStagedJournalUpload(input.sourceBytes, (sourcePath) => {
    const vault = resolveJournalEvidenceVaultBoundary({ sourcePath, databasePath });
    let promoted = false;
    try {
      return withWritableJournalIntegrityRuntime(scope, (runtime) => {
        const accountId = scope.activeAccountId;
        if (!accountId) platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
        const preview = runtime.imports.previewGenericMappedForWorkspace(scope, {
          sourceBytes: input.sourceBytes,
          accountId,
          mapping,
        });
        const safe = safeGenericPreview(runtime, scope, preview, mapping, "manual_mapping");
        if (
          preview.sourceFileSha256 !== input.confirmedSourceFileSha256 ||
          safe.accountRef !== input.confirmedAccountRef ||
          !preview.canCommit
        ) {
          platformFailure("TRADERLINK_JOURNAL_IMPORT_SOURCE_EVIDENCE_MISMATCH", {
            check: "confirmed_mapping_preview",
          });
        }
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
        return Object.freeze({
          status: committed.status,
          preservedRowCount: committed.preservedRowCount,
          createdExecutionCount: committed.createdExecutionCount,
          matchedExecutionCount: committed.matchedExecutionCount,
          pendingDecisionCount: committed.relatedDecisionIds.length,
          rebuildCount: committed.rebuilds.length,
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
