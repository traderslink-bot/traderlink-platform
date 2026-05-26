import {
  validateTradeAnalysisRequest,
  type UserTradeAnalysisRequest,
} from "../../trade-analysis/request/trade-analysis-request-contract";
import { buildTradeAnalysisRequestFingerprint } from "../../execution-sources/import-fingerprints";
import {
  parseBrokerExecutionCsv,
  type BrokerExecutionCsvImportArgs,
  type BrokerExecutionCsvImportResult,
} from "../../execution-sources/csv";
import { buildBrokerCsvImportProductDiagnostics } from "./import-diagnostics";
import type {
  BrokerCsvImportProductDiagnostics,
  SavedTradeImportPreview,
  SavedTradeImportPreviewItem,
} from "./types";

export interface BrokerExecutionCsvSavedTradeImportPreview {
  importResult: BrokerExecutionCsvImportResult;
  savedTradePreview: SavedTradeImportPreview;
  fileFingerprint: string;
  fileAlreadyImported: boolean;
  productDiagnostics: BrokerCsvImportProductDiagnostics;
}

export interface PreviewBrokerExecutionCsvImportArgs
  extends BrokerExecutionCsvImportArgs {
  existingFileFingerprints?: string[];
  accountTimezone?: string;
}

function requestSymbol(request: unknown): string | null {
  if (
    typeof request === "object" &&
    request !== null &&
    "symbol" in request &&
    typeof request.symbol === "string"
  ) {
    return request.symbol.trim().toUpperCase() || null;
  }

  return null;
}

export function previewSavedTradeImport(
  requests: UserTradeAnalysisRequest[],
): SavedTradeImportPreview {
  const items: SavedTradeImportPreviewItem[] = requests.map((request, index) => {
    const validation = validateTradeAnalysisRequest(request);
    const errorCount = validation.issues.filter(
      (issue) => issue.severity === "error",
    ).length;
    const warningCount = validation.issues.filter(
      (issue) => issue.severity === "warning",
    ).length;

    return {
      requestIndex: index,
      symbol: validation.request?.symbol ?? requestSymbol(request),
      fingerprint: validation.valid
        ? buildTradeAnalysisRequestFingerprint(request)
        : null,
      accepted: validation.valid,
      issueCount: validation.issues.length,
      errorCount,
      warningCount,
      messages: validation.issues.map(
        (issue) => `${issue.path}: ${issue.message}`,
      ),
    };
  });

  return {
    totalCount: items.length,
    acceptedCount: items.filter((item) => item.accepted).length,
    rejectedCount: items.filter((item) => !item.accepted).length,
    warningCount: items.reduce((total, item) => total + item.warningCount, 0),
    items,
  };
}

export function previewBrokerExecutionCsvImport(
  args: PreviewBrokerExecutionCsvImportArgs,
): BrokerExecutionCsvSavedTradeImportPreview {
  const importResult = parseBrokerExecutionCsv({
    ...args,
    timestampTimezone: args.timestampTimezone ?? args.accountTimezone,
  });
  const savedTradePreview = previewSavedTradeImport(importResult.requests);
  const fileAlreadyImported =
    args.existingFileFingerprints?.includes(importResult.fileFingerprint) ??
    false;

  return {
    importResult,
    savedTradePreview,
    fileFingerprint: importResult.fileFingerprint,
    fileAlreadyImported,
    productDiagnostics: buildBrokerCsvImportProductDiagnostics({
      importResult,
      savedTradePreview,
      fileAlreadyImported,
    }),
  };
}
