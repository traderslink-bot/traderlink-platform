export type JournalAssetClass =
  | "stock"
  | "option"
  | "forex"
  | "future"
  | "crypto"
  | "other";

export type JournalSourceRowClassification =
  | "mapped_execution"
  | "mapped_position_fact"
  | "mapped_coverage_fact"
  | "automatic_non_execution"
  | "unsupported"
  | "needs_correction";

export type JournalCoverageKind =
  | "complete"
  | "partial"
  | "point_only"
  | "unknown";

export type JournalImportIssue = Readonly<{
  recordOrdinal: number | null;
  issueScope: "import" | "row" | "position_fact" | "execution" | "chain";
  issueCode: string;
  severity: "info" | "warning" | "error";
  isBlocking: boolean;
  chainHint?: Readonly<{
    normalizedSymbol: string;
    assetClass: JournalAssetClass;
    tradeCurrency: string;
    effectiveAtUtc: string | null;
  }>;
}>;

export type PreservedCsvRecord = Readonly<{
  recordOrdinal: number;
  fields: readonly string[];
  rawRecord: string;
  rawRecordSha256: string;
  rawFieldsJson: string;
  contentFingerprintSha256: string;
  occurrenceOrdinal: number;
}>;

export type JournalAdapterExecution = Readonly<{
  recordOrdinal: number;
  normalizedSymbol: string;
  assetClass: JournalAssetClass;
  tradeCurrency: string;
  sourceTimestampText: string;
  sourceTimezone: string;
  timeParserVersion: string;
  executedAtUtc: string;
  sourceOrderKey: string;
  side: "buy" | "sell";
  quantityDecimal: string;
  priceDecimal: string | null;
  feesDecimal: string | null;
  feeCurrency: string | null;
  feeSignConvention:
    | "not_reported"
    | "broker_reported_signed"
    | "cash_effect";
  factCompleteness: "complete" | "price_missing" | "order_ambiguous";
  providerExecutionIdentity: string | null;
  normalizedContentIdentity: string;
  contentOccurrenceOrdinal: number;
}>;

export type JournalAdapterPositionFact = Readonly<{
  recordOrdinal: number;
  normalizedSymbol: string;
  assetClass: JournalAssetClass;
  currency: string;
  factKind: "opening_balance" | "closing_balance" | "open_position";
  effectiveLocalDate: string;
  timePrecision: "day_start" | "day_end";
  quantityDecimal: string;
}>;

export type JournalAdapterSourceRow = PreservedCsvRecord &
  Readonly<{
    sectionName: string | null;
    recordType: string | null;
    assetCategory: string | null;
    classification: JournalSourceRowClassification;
  }>;

export type JournalCoverageInterval = Readonly<{
  assetClass: JournalAssetClass;
  coverageKind: JournalCoverageKind;
  localStartDate: string;
  localEndDate: string;
  sourceTimezone: string;
}>;

export type JournalImportPreviewIssueSummary = Readonly<{
  issueCode: string;
  severity: JournalImportIssue["severity"];
  isBlocking: boolean;
  count: number;
}>;

export type JournalImportPreview = Readonly<{
  adapterId: "ibkr_activity_statement";
  adapterVersion: "ibkr_activity_statement_v1";
  parserVersion: "record_preserving_csv_v1";
  mappingVersion: "ibkr_activity_statement_mapping_v1";
  sourceFileSha256: string;
  sourceFileSizeBytes: number;
  statementPeriodStartDate: string | null;
  statementPeriodEndDate: string | null;
  sourceTimezone: string;
  hasSourceAccountIdentity: boolean;
  canCommit: boolean;
  preservedRowCount: number;
  mappedExecutionCount: number;
  mappedPositionFactCount: number;
  unsupportedRowCount: number;
  rowsByClassification: Readonly<Record<JournalSourceRowClassification, number>>;
  issues: readonly JournalImportPreviewIssueSummary[];
  coverageIntervals: readonly JournalCoverageInterval[];
}>;

export type JournalScopedImportPreview = JournalImportPreview & Readonly<{
  accountId: string;
  exactReimport: boolean;
  existingImportBatchId: string | null;
  plannedNewExecutionCount: number;
  plannedMatchedExecutionCount: number;
  plannedAmbiguousExecutionCount: number;
  expectedPendingSourceDecisionCount: number;
}>;

export type IbkrActivityStatementPreview = Readonly<{
  adapterId: "ibkr_activity_statement";
  adapterVersion: "ibkr_activity_statement_v1";
  parserVersion: "record_preserving_csv_v1";
  mappingVersion: "ibkr_activity_statement_mapping_v1";
  mappingContract: Readonly<Record<string, unknown>>;
  sourceFileSha256: string;
  sourceFileSizeBytes: number;
  rawSourceAccountId: string | null;
  statementPeriodStartDate: string | null;
  statementPeriodEndDate: string | null;
  sourceTimezone: string;
  rows: readonly JournalAdapterSourceRow[];
  issues: readonly JournalImportIssue[];
  coverageIntervals: readonly JournalCoverageInterval[];
  executions: readonly JournalAdapterExecution[];
  positionFacts: readonly JournalAdapterPositionFact[];
}>;
