import type { LevelAnalysisJournalSourceKind } from "./level-analysis-journal-delivery-adapter";
import type {
  AcceptedJournalLevelAnalysisDeliveryRecord,
  JournalLevelAnalysisDeliveryRecord,
  JournalLevelAnalysisDeliverySymbolSummary,
} from "./level-analysis-journal-delivery-persistence-contract";
import { validateJournalLevelAnalysisDeliverySymbolSummary } from "./level-analysis-journal-delivery-persistence-contract";

export const JOURNAL_LEVEL_ANALYSIS_TRADE_LINK_CONTRACT_VERSION =
  "journal_level_analysis_trade_link_v1" as const;

export const JOURNAL_LEVEL_ANALYSIS_TRADE_LINK_MATCH_POLICY_VERSION =
  "journal_level_analysis_trade_link_match_policy_v1" as const;

export const JOURNAL_LEVEL_ANALYSIS_TRADE_LINK_RESOLUTION_API_CONTRACT_VERSION =
  "journal_level_analysis_trade_link_resolution_api_v1" as const;

export const JOURNAL_LEVEL_ANALYSIS_TRADE_LINK_API_CONTRACT_VERSION =
  "journal_level_analysis_trade_link_api_v1" as const;

export const JOURNAL_TRADE_LEVEL_ANALYSIS_API_CONTRACT_VERSION =
  "journal_trade_level_analysis_api_v1" as const;

export type JournalLevelAnalysisTradeLinkStatus =
  | "linked"
  | "unlinked"
  | "blocked";

export type JournalLevelAnalysisTradeLinkSource =
  | "manual_review"
  | "import_batch_hint"
  | "resolver";

export type JournalLevelAnalysisTradeLinkProviderMatch =
  | "account_allowed_provider"
  | "explicit_provider";

export type JournalLevelAnalysisTradeLinkAsOfPolicy =
  | "latest_before_or_equal_trade_end"
  | "latest_before_or_equal_review_time"
  | "manual_delivery_selection";

export type JournalLevelAnalysisTradeLinkMatchStatus =
  | "matched"
  | "blocked"
  | "not_found";

export type JournalLevelAnalysisTradeLinkMatchReason =
  | "symbol_provider_asof_match"
  | "no_accepted_symbol_summary"
  | "as_of_after_allowed_boundary"
  | "provider_not_allowed"
  | "trade_timestamp_missing"
  | "delivery_quarantined"
  | "fifteen_minute_not_context_only";

export interface JournalLevelAnalysisTradeLinkMatchPolicy {
  policyVersion: typeof JOURNAL_LEVEL_ANALYSIS_TRADE_LINK_MATCH_POLICY_VERSION;
  symbolMatch: "exact_uppercase";
  providerMatch: JournalLevelAnalysisTradeLinkProviderMatch;
  asOfPolicy: JournalLevelAnalysisTradeLinkAsOfPolicy;
  allowSameDayAfterTradeEnd: boolean;
  allowFutureAsOfForHistoricalTrade: false;
  requireAcceptedDelivery: true;
  requireContextOnly15m: true;
}

export interface JournalLevelAnalysisTradeLinkMatchResult {
  status: JournalLevelAnalysisTradeLinkMatchStatus;
  reason: JournalLevelAnalysisTradeLinkMatchReason;
  candidateDeliveryId?: string;
  candidateSummaryAsOfTimestamp?: number;
  checkedAt: string;
}

export type JournalLevelAnalysisLinkedSymbolSummary =
  JournalLevelAnalysisDeliverySymbolSummary;

export interface JournalLevelAnalysisTradeLinkLimitation {
  code: string;
  field?: string;
  message: string;
}

export interface JournalLevelAnalysisTradeLinkAuditEntry {
  event: "created" | "blocked" | "relinked" | "validated";
  at: string;
  message: string;
  metadata?: Record<string, unknown>;
}

export interface JournalLevelAnalysisTradeLinkRecordBase {
  contractVersion: typeof JOURNAL_LEVEL_ANALYSIS_TRADE_LINK_CONTRACT_VERSION;
  id: string;
  createdAt: string;
  updatedAt: string;
  workspaceId: string;
  accountId: string;
  userId: string;
  savedTradeId: string;
  importBatchId?: string;
  symbol: string;
  provider: string;
  linkStatus: JournalLevelAnalysisTradeLinkStatus;
  linkSource: JournalLevelAnalysisTradeLinkSource;
  deliveryId: string;
  rawPayloadHash: string;
  sourceKind: LevelAnalysisJournalSourceKind;
  deliveryGeneratedAt?: string;
  symbolSummaryAsOfTimestamp: number | null;
  symbolSummaryAsOfIso?: string;
  matchPolicy: JournalLevelAnalysisTradeLinkMatchPolicy;
  matchResult: JournalLevelAnalysisTradeLinkMatchResult;
  linkedSymbolSummary: JournalLevelAnalysisLinkedSymbolSummary | null;
  limitations: JournalLevelAnalysisTradeLinkLimitation[];
  safetyFlags: unknown;
  auditTrail: JournalLevelAnalysisTradeLinkAuditEntry[];
}

export interface LinkedJournalLevelAnalysisTradeLinkRecord
  extends JournalLevelAnalysisTradeLinkRecordBase {
  linkStatus: "linked";
  matchResult: JournalLevelAnalysisTradeLinkMatchResult & {
    status: "matched";
    reason: "symbol_provider_asof_match";
  };
  linkedSymbolSummary: JournalLevelAnalysisLinkedSymbolSummary;
  symbolSummaryAsOfTimestamp: number;
}

export interface BlockedJournalLevelAnalysisTradeLinkRecord
  extends JournalLevelAnalysisTradeLinkRecordBase {
  linkStatus: "blocked" | "unlinked";
  matchResult: JournalLevelAnalysisTradeLinkMatchResult & {
    status: "blocked" | "not_found";
  };
  linkedSymbolSummary: null;
}

export type JournalLevelAnalysisTradeLinkRecord =
  | LinkedJournalLevelAnalysisTradeLinkRecord
  | BlockedJournalLevelAnalysisTradeLinkRecord;

export interface JournalLevelAnalysisTradeLinkResolution {
  contractVersion: typeof JOURNAL_LEVEL_ANALYSIS_TRADE_LINK_RESOLUTION_API_CONTRACT_VERSION;
  status: JournalLevelAnalysisTradeLinkMatchStatus;
  savedTradeId: string;
  symbol: string;
  provider: string;
  matchPolicy: JournalLevelAnalysisTradeLinkMatchPolicy;
  matchResult: JournalLevelAnalysisTradeLinkMatchResult;
  candidate?: {
    deliveryId: string;
    rawPayloadHash: string;
    sourceKind: LevelAnalysisJournalSourceKind;
    asOfTimestamp: number;
    asOfIso?: string;
    fifteenMinuteContextOnlyStatus: string;
  };
  limitations: JournalLevelAnalysisTradeLinkLimitation[];
}

export interface JournalLevelAnalysisTradeLinkApiResponse {
  contractVersion: typeof JOURNAL_LEVEL_ANALYSIS_TRADE_LINK_API_CONTRACT_VERSION;
  status: JournalLevelAnalysisTradeLinkStatus;
  linkId?: string;
  savedTradeId: string;
  deliveryId?: string;
  symbol: string;
  provider: string;
  matchResult: JournalLevelAnalysisTradeLinkMatchResult;
}

export interface JournalTradeLevelAnalysisApiResponse {
  contractVersion: typeof JOURNAL_TRADE_LEVEL_ANALYSIS_API_CONTRACT_VERSION;
  status: "found" | "not_found";
  savedTradeId: string;
  link?: JournalLevelAnalysisTradeLinkRecord;
}

export interface JournalLevelAnalysisTradeLinkContractIssue {
  code: string;
  field: string;
  message: string;
}

export type JournalLevelAnalysisTradeLinkValidationResult =
  | {
      status: "valid";
      record: JournalLevelAnalysisTradeLinkRecord;
      issues: [];
    }
  | {
      status: "invalid";
      issues: JournalLevelAnalysisTradeLinkContractIssue[];
    };

export interface CreateJournalLevelAnalysisTradeLinkRecordInput {
  id: string;
  createdAt: string;
  updatedAt?: string;
  workspaceId: string;
  accountId: string;
  userId: string;
  savedTradeId: string;
  importBatchId?: string;
  linkSource?: JournalLevelAnalysisTradeLinkSource;
  deliveryRecord: JournalLevelAnalysisDeliveryRecord;
  symbolSummary: JournalLevelAnalysisDeliverySymbolSummary;
  matchPolicy?: Partial<JournalLevelAnalysisTradeLinkMatchPolicy>;
  matchResult?: LinkedJournalLevelAnalysisTradeLinkRecord["matchResult"];
  limitations?: JournalLevelAnalysisTradeLinkLimitation[];
  auditTrail?: JournalLevelAnalysisTradeLinkAuditEntry[];
}

type JsonRecord = Record<string, unknown>;

const prohibitedTradeLinkKeys = new Set([
  "grade",
  "tradeGrade",
  "coaching",
  "coach",
  "pnl",
  "pAndL",
  "giveback",
  "behaviorScore",
  "behaviorScoring",
  "recommendation",
  "entryDecision",
  "exitDecision",
  "tradeAdvice",
]);

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function cloneJson<T>(value: T): T {
  if (value === null || value === undefined) {
    return value;
  }

  return JSON.parse(JSON.stringify(value)) as T;
}

function contractIssue(
  code: string,
  field: string,
  message: string,
): JournalLevelAnalysisTradeLinkContractIssue {
  return { code, field, message };
}

function collectObjectKeys(value: unknown, out: string[] = []): string[] {
  if (Array.isArray(value)) {
    for (const item of value) {
      collectObjectKeys(item, out);
    }
    return out;
  }

  if (isRecord(value)) {
    for (const [key, item] of Object.entries(value)) {
      out.push(key);
      collectObjectKeys(item, out);
    }
  }

  return out;
}

function readSymbolSummaryProvider(
  summary: JournalLevelAnalysisDeliverySymbolSummary,
): string | undefined {
  return summary.provider;
}

function isAllowedFifteenMinuteStatusForSourceKind(
  sourceKind: LevelAnalysisJournalSourceKind,
  status: JournalLevelAnalysisDeliverySymbolSummary["fifteenMinuteContextOnlyStatus"],
): boolean {
  if (sourceKind === "packaged_review_delivery") {
    return status === "context_only";
  }

  return status === "not_supplied" || status === "not_declared_by_single_snapshot_v1";
}

function assertAcceptedDeliveryRecord(
  record: JournalLevelAnalysisDeliveryRecord,
): asserts record is AcceptedJournalLevelAnalysisDeliveryRecord {
  if (record.validationStatus !== "accepted") {
    throw new Error("Trade links require an accepted level analysis delivery record.");
  }
}

function normalizeSymbol(symbol: string): string {
  return symbol.trim().toUpperCase();
}

export function createDefaultJournalLevelAnalysisTradeLinkMatchPolicy(
  overrides: Partial<JournalLevelAnalysisTradeLinkMatchPolicy> = {},
): JournalLevelAnalysisTradeLinkMatchPolicy {
  return {
    ...overrides,
    policyVersion: JOURNAL_LEVEL_ANALYSIS_TRADE_LINK_MATCH_POLICY_VERSION,
    symbolMatch: "exact_uppercase",
    providerMatch: overrides.providerMatch ?? "account_allowed_provider",
    asOfPolicy: overrides.asOfPolicy ?? "latest_before_or_equal_trade_end",
    allowSameDayAfterTradeEnd: overrides.allowSameDayAfterTradeEnd ?? false,
    allowFutureAsOfForHistoricalTrade: false,
    requireAcceptedDelivery: true,
    requireContextOnly15m: true,
  };
}

export function deriveJournalLevelAnalysisLinkedSymbolSummary(
  summary: JournalLevelAnalysisDeliverySymbolSummary,
): JournalLevelAnalysisLinkedSymbolSummary {
  return cloneJson(summary);
}

export function journalLevelAnalysisTradeLinkContainsRawPayload(
  value: unknown,
): boolean {
  if (Array.isArray(value)) {
    return value.some((item) => journalLevelAnalysisTradeLinkContainsRawPayload(item));
  }

  if (!isRecord(value)) {
    return false;
  }

  return Object.entries(value).some(
    ([key, item]) =>
      key === "rawPayload" || journalLevelAnalysisTradeLinkContainsRawPayload(item),
  );
}

export function isJournalLevelAnalysisTradeLinkDuplicate(args: {
  existing: Pick<
    JournalLevelAnalysisTradeLinkRecord,
    "savedTradeId" | "deliveryId" | "symbol" | "provider"
  >;
  incoming: Pick<
    JournalLevelAnalysisTradeLinkRecord,
    "savedTradeId" | "deliveryId" | "symbol" | "provider"
  >;
}): boolean {
  return (
    args.existing.savedTradeId === args.incoming.savedTradeId &&
    args.existing.deliveryId === args.incoming.deliveryId &&
    normalizeSymbol(args.existing.symbol) === normalizeSymbol(args.incoming.symbol) &&
    args.existing.provider === args.incoming.provider
  );
}

export function createJournalLevelAnalysisTradeLinkRecord(
  input: CreateJournalLevelAnalysisTradeLinkRecordInput,
): LinkedJournalLevelAnalysisTradeLinkRecord {
  assertAcceptedDeliveryRecord(input.deliveryRecord);

  const provider = readSymbolSummaryProvider(input.symbolSummary) ?? input.deliveryRecord.provider;
  const symbol = normalizeSymbol(input.symbolSummary.symbol);
  const summaryInDelivery = input.deliveryRecord.perSymbolSummary.some(
    (summary) =>
      normalizeSymbol(summary.symbol) === symbol &&
      summary.deliveryId === input.deliveryRecord.id,
  );

  if (!summaryInDelivery) {
    throw new Error("Trade link symbol summary must belong to the accepted delivery record.");
  }

  if (!isNonEmptyString(provider)) {
    throw new Error("Trade link symbol summary requires a provider.");
  }

  if (
    input.symbolSummary.deliveryId !== input.deliveryRecord.id ||
    input.symbolSummary.provider !== provider
  ) {
    throw new Error("Trade link symbol summary delivery/provider metadata is inconsistent.");
  }

  if (
    !isAllowedFifteenMinuteStatusForSourceKind(
      input.deliveryRecord.sourceKind,
      input.symbolSummary.fifteenMinuteContextOnlyStatus,
    )
  ) {
    throw new Error("Trade link requires 15m context-only facts for packaged deliveries.");
  }

  const checkedAt = input.matchResult?.checkedAt ?? input.createdAt;
  const record: LinkedJournalLevelAnalysisTradeLinkRecord = {
    contractVersion: JOURNAL_LEVEL_ANALYSIS_TRADE_LINK_CONTRACT_VERSION,
    id: input.id,
    createdAt: input.createdAt,
    updatedAt: input.updatedAt ?? input.createdAt,
    workspaceId: input.workspaceId,
    accountId: input.accountId,
    userId: input.userId,
    savedTradeId: input.savedTradeId,
    importBatchId: input.importBatchId,
    symbol,
    provider,
    linkStatus: "linked",
    linkSource: input.linkSource ?? "resolver",
    deliveryId: input.deliveryRecord.id,
    rawPayloadHash: input.deliveryRecord.rawPayloadHash,
    sourceKind: input.deliveryRecord.sourceKind,
    deliveryGeneratedAt: input.deliveryRecord.generatedAt,
    symbolSummaryAsOfTimestamp: input.symbolSummary.asOfTimestamp,
    symbolSummaryAsOfIso: input.symbolSummary.asOfIso,
    matchPolicy: createDefaultJournalLevelAnalysisTradeLinkMatchPolicy(
      input.matchPolicy,
    ),
    matchResult: input.matchResult ?? {
      status: "matched",
      reason: "symbol_provider_asof_match",
      candidateDeliveryId: input.deliveryRecord.id,
      candidateSummaryAsOfTimestamp: input.symbolSummary.asOfTimestamp,
      checkedAt,
    },
    linkedSymbolSummary: deriveJournalLevelAnalysisLinkedSymbolSummary(
      input.symbolSummary,
    ),
    limitations: cloneJson(input.limitations ?? input.symbolSummary.limitations),
    safetyFlags: cloneJson(input.symbolSummary.safetyFlags),
    auditTrail:
      input.auditTrail ?? [
        {
          event: "created",
          at: input.createdAt,
          message: "Level analysis facts linked to saved trade.",
        },
      ],
  };

  const validation = validateJournalLevelAnalysisTradeLinkRecord(record);
  if (validation.status === "invalid") {
    throw new Error(
      `Invalid level analysis trade link record: ${validation.issues
        .map((issue) => issue.code)
        .join(", ")}`,
    );
  }

  return record;
}

export function validateJournalLevelAnalysisTradeLinkRecord(
  payload: unknown,
): JournalLevelAnalysisTradeLinkValidationResult {
  const issues: JournalLevelAnalysisTradeLinkContractIssue[] = [];

  if (!isRecord(payload)) {
    return {
      status: "invalid",
      issues: [
        contractIssue(
          "payload_not_object",
          "$",
          "Journal level analysis trade link record must be an object.",
        ),
      ],
    };
  }

  for (const key of collectObjectKeys(payload)) {
    if (prohibitedTradeLinkKeys.has(key)) {
      issues.push(
        contractIssue(
          "prohibited_journal_owned_field",
          key,
          "Trade link contract cannot include journal-owned evaluation fields.",
        ),
      );
    }
  }

  if (journalLevelAnalysisTradeLinkContainsRawPayload(payload)) {
    issues.push(
      contractIssue(
        "raw_payload_not_allowed",
        "rawPayload",
        "Trade links must not copy raw source payloads.",
      ),
    );
  }

  for (const field of [
    "contractVersion",
    "id",
    "createdAt",
    "updatedAt",
    "workspaceId",
    "accountId",
    "userId",
    "savedTradeId",
    "symbol",
    "provider",
    "linkStatus",
    "linkSource",
    "deliveryId",
    "rawPayloadHash",
    "sourceKind",
  ]) {
    if (!isNonEmptyString(payload[field])) {
      issues.push(contractIssue("missing_required_field", field, `${field} is required.`));
    }
  }

  if (payload.contractVersion !== JOURNAL_LEVEL_ANALYSIS_TRADE_LINK_CONTRACT_VERSION) {
    issues.push(
      contractIssue(
        "unsupported_contract",
        "contractVersion",
        "Unexpected journal level analysis trade link contract version.",
      ),
    );
  }

  if (!/^sha256:[a-f0-9]{64}$/.test(String(payload.rawPayloadHash))) {
    issues.push(
      contractIssue(
        "invalid_field_shape",
        "rawPayloadHash",
        "rawPayloadHash must be a sha256-prefixed hex digest.",
      ),
    );
  }

  if (
    payload.sourceKind !== "single_snapshot_v1" &&
    payload.sourceKind !== "packaged_review_delivery"
  ) {
    issues.push(
      contractIssue(
        "invalid_field_shape",
        "sourceKind",
        "sourceKind must be single_snapshot_v1 or packaged_review_delivery.",
      ),
    );
  }

  if (
    payload.linkStatus !== "linked" &&
    payload.linkStatus !== "unlinked" &&
    payload.linkStatus !== "blocked"
  ) {
    issues.push(
      contractIssue(
        "invalid_field_shape",
        "linkStatus",
        "linkStatus must be linked, unlinked, or blocked.",
      ),
    );
  }

  if (
    payload.linkSource !== "manual_review" &&
    payload.linkSource !== "import_batch_hint" &&
    payload.linkSource !== "resolver"
  ) {
    issues.push(
      contractIssue(
        "invalid_field_shape",
        "linkSource",
        "linkSource is invalid.",
      ),
    );
  }

  if (
    payload.symbolSummaryAsOfTimestamp !== null &&
    !isFiniteNumber(payload.symbolSummaryAsOfTimestamp)
  ) {
    issues.push(
      contractIssue(
        "invalid_field_shape",
        "symbolSummaryAsOfTimestamp",
        "symbolSummaryAsOfTimestamp must be a finite number or null.",
      ),
    );
  }

  if (!isRecord(payload.matchPolicy)) {
    issues.push(
      contractIssue(
        "invalid_field_shape",
        "matchPolicy",
        "matchPolicy is required.",
      ),
    );
  } else {
    if (
      payload.matchPolicy.policyVersion !==
      JOURNAL_LEVEL_ANALYSIS_TRADE_LINK_MATCH_POLICY_VERSION
    ) {
      issues.push(
        contractIssue(
          "unsupported_contract",
          "matchPolicy.policyVersion",
          "Unexpected trade link match policy version.",
        ),
      );
    }

    if (payload.matchPolicy.symbolMatch !== "exact_uppercase") {
      issues.push(
        contractIssue(
          "invalid_field_shape",
          "matchPolicy.symbolMatch",
          "symbolMatch must be exact_uppercase.",
        ),
      );
    }

    if (
      payload.matchPolicy.providerMatch !== "account_allowed_provider" &&
      payload.matchPolicy.providerMatch !== "explicit_provider"
    ) {
      issues.push(
        contractIssue(
          "invalid_field_shape",
          "matchPolicy.providerMatch",
          "providerMatch is invalid.",
        ),
      );
    }

    if (
      payload.matchPolicy.asOfPolicy !== "latest_before_or_equal_trade_end" &&
      payload.matchPolicy.asOfPolicy !== "latest_before_or_equal_review_time" &&
      payload.matchPolicy.asOfPolicy !== "manual_delivery_selection"
    ) {
      issues.push(
        contractIssue(
          "invalid_field_shape",
          "matchPolicy.asOfPolicy",
          "asOfPolicy is invalid.",
        ),
      );
    }

    if (payload.matchPolicy.allowFutureAsOfForHistoricalTrade !== false) {
      issues.push(
        contractIssue(
          "unsafe_match_policy",
          "matchPolicy.allowFutureAsOfForHistoricalTrade",
          "Future as-of facts cannot be silently attached to historical trades.",
        ),
      );
    }

    if (payload.matchPolicy.requireAcceptedDelivery !== true) {
      issues.push(
        contractIssue(
          "unsafe_match_policy",
          "matchPolicy.requireAcceptedDelivery",
          "Trade links require accepted delivery records.",
        ),
      );
    }

    if (payload.matchPolicy.requireContextOnly15m !== true) {
      issues.push(
        contractIssue(
          "unsafe_match_policy",
          "matchPolicy.requireContextOnly15m",
          "Trade links require context-only 15m facts.",
        ),
      );
    }
  }

  if (!isRecord(payload.matchResult)) {
    issues.push(
      contractIssue(
        "invalid_field_shape",
        "matchResult",
        "matchResult is required.",
      ),
    );
  } else {
    if (
      payload.matchResult.status !== "matched" &&
      payload.matchResult.status !== "blocked" &&
      payload.matchResult.status !== "not_found"
    ) {
      issues.push(
        contractIssue(
          "invalid_field_shape",
          "matchResult.status",
          "matchResult status is invalid.",
        ),
      );
    }

    if (
      payload.matchResult.reason !== "symbol_provider_asof_match" &&
      payload.matchResult.reason !== "no_accepted_symbol_summary" &&
      payload.matchResult.reason !== "as_of_after_allowed_boundary" &&
      payload.matchResult.reason !== "provider_not_allowed" &&
      payload.matchResult.reason !== "trade_timestamp_missing" &&
      payload.matchResult.reason !== "delivery_quarantined" &&
      payload.matchResult.reason !== "fifteen_minute_not_context_only"
    ) {
      issues.push(
        contractIssue(
          "invalid_field_shape",
          "matchResult.reason",
          "matchResult reason is invalid.",
        ),
      );
    }

    if (!isNonEmptyString(payload.matchResult.checkedAt)) {
      issues.push(
        contractIssue(
          "missing_required_field",
          "matchResult.checkedAt",
          "matchResult.checkedAt is required.",
        ),
      );
    }
  }

  if (!Array.isArray(payload.limitations)) {
    issues.push(
      contractIssue(
        "invalid_field_shape",
        "limitations",
        "limitations must be an array.",
      ),
    );
  }

  if (!Array.isArray(payload.auditTrail)) {
    issues.push(
      contractIssue(
        "invalid_field_shape",
        "auditTrail",
        "auditTrail must be an array.",
      ),
    );
  }

  if (payload.linkStatus === "linked") {
    if (!isRecord(payload.matchResult) || payload.matchResult.status !== "matched") {
      issues.push(
        contractIssue(
          "invalid_match_state",
          "matchResult.status",
          "Linked records require a matched result.",
        ),
      );
    }

    if (!isRecord(payload.linkedSymbolSummary)) {
      issues.push(
        contractIssue(
          "invalid_field_shape",
          "linkedSymbolSummary",
          "Linked records require a linked symbol summary.",
        ),
      );
    } else {
      const summaryValidation =
        validateJournalLevelAnalysisDeliverySymbolSummary(payload.linkedSymbolSummary);
      if (summaryValidation.status === "invalid") {
        for (const issue of summaryValidation.issues) {
          issues.push({
            ...issue,
            field: `linkedSymbolSummary.${issue.field}`,
          });
        }
      }

      if (payload.linkedSymbolSummary.deliveryId !== payload.deliveryId) {
        issues.push(
          contractIssue(
            "inconsistent_delivery_reference",
            "linkedSymbolSummary.deliveryId",
            "Linked symbol summary deliveryId must match the link deliveryId.",
          ),
        );
      }

      if (
        isNonEmptyString(payload.symbol) &&
        isNonEmptyString(payload.linkedSymbolSummary.symbol) &&
        normalizeSymbol(payload.linkedSymbolSummary.symbol) !== normalizeSymbol(payload.symbol)
      ) {
        issues.push(
          contractIssue(
            "inconsistent_symbol_reference",
            "linkedSymbolSummary.symbol",
            "Linked symbol summary symbol must match the link symbol.",
          ),
        );
      }

      if (
        isNonEmptyString(payload.provider) &&
        payload.linkedSymbolSummary.provider !== payload.provider
      ) {
        issues.push(
          contractIssue(
            "inconsistent_provider_reference",
            "linkedSymbolSummary.provider",
            "Linked symbol summary provider must match the link provider.",
          ),
        );
      }

      if (
        payload.sourceKind === "packaged_review_delivery" &&
        payload.linkedSymbolSummary.fifteenMinuteContextOnlyStatus !== "context_only"
      ) {
        issues.push(
          contractIssue(
            "fifteen_minute_not_context_only",
            "linkedSymbolSummary.fifteenMinuteContextOnlyStatus",
            "Packaged review delivery trade links require context-only 15m facts.",
          ),
        );
      }
    }
  }

  if (payload.linkStatus === "blocked" || payload.linkStatus === "unlinked") {
    if (
      !isRecord(payload.matchResult) ||
      (payload.matchResult.status !== "blocked" &&
        payload.matchResult.status !== "not_found")
    ) {
      issues.push(
        contractIssue(
          "invalid_match_state",
          "matchResult.status",
          "Blocked or unlinked records require blocked or not_found match results.",
        ),
      );
    }

    if (payload.linkedSymbolSummary !== null) {
      issues.push(
        contractIssue(
          "trusted_summary_not_allowed",
          "linkedSymbolSummary",
          "Blocked or unlinked records cannot include trusted linked facts.",
        ),
      );
    }
  }

  if (issues.length > 0) {
    return { status: "invalid", issues };
  }

  return {
    status: "valid",
    record: payload as unknown as JournalLevelAnalysisTradeLinkRecord,
    issues: [],
  };
}
