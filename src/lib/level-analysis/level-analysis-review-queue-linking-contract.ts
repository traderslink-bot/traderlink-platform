import type { LevelAnalysisJournalSourceKind } from "./level-analysis-journal-delivery-adapter";
import type { JournalLevelAnalysisTradeLinkLimitation } from "./level-analysis-journal-delivery-trade-link-contract";
import {
  journalLevelAnalysisTradeLinkContainsRawPayload,
  type JournalLevelAnalysisTradeLinkRecord,
} from "./level-analysis-journal-delivery-trade-link-contract";

export const JOURNAL_LEVEL_ANALYSIS_REVIEW_QUEUE_LINKING_CONTRACT_VERSION =
  "journal_level_analysis_review_queue_linking_v1" as const;

export type ReviewQueueLevelFactsAvailability =
  | "attached"
  | "available_to_attach"
  | "blocked_by_as_of_policy"
  | "unavailable_for_symbol_provider"
  | "quarantined_or_unsafe"
  | "not_checked"
  | "feature_disabled";

export interface SavedReviewQueueLevelFactsState {
  contractVersion: typeof JOURNAL_LEVEL_ANALYSIS_REVIEW_QUEUE_LINKING_CONTRACT_VERSION;
  availability: ReviewQueueLevelFactsAvailability;
  label: string;
  detail: string;
  scopeLabel: string;
  nextAction: string;
  linkId?: string;
  deliveryId?: string;
  rawPayloadHash?: string;
  sourceKind?: LevelAnalysisJournalSourceKind;
  provider?: string;
  symbol?: string;
  asOfIso?: string;
  asOfTimestamp?: number | null;
  fifteenMinuteContextOnlyStatus?: string;
  limitationCount: number;
  limitations: JournalLevelAnalysisTradeLinkLimitation[];
}

export interface SavedReviewQueueLevelFactsReadModel {
  contractVersion: typeof JOURNAL_LEVEL_ANALYSIS_REVIEW_QUEUE_LINKING_CONTRACT_VERSION;
  source: "level_analysis_trade_links";
  featureEnabled: boolean;
  statesByTradeId: Record<string, SavedReviewQueueLevelFactsState>;
  counts: Record<ReviewQueueLevelFactsAvailability, number>;
}

export interface SavedReviewQueueLevelFactsContractIssue {
  code: string;
  field: string;
  message: string;
}

export type SavedReviewQueueLevelFactsValidationResult =
  | {
      status: "valid";
      state: SavedReviewQueueLevelFactsState;
      issues: [];
    }
  | {
      status: "invalid";
      issues: SavedReviewQueueLevelFactsContractIssue[];
    };

type JsonRecord = Record<string, unknown>;

const AVAILABILITY_LABELS: Record<
  ReviewQueueLevelFactsAvailability,
  {
    label: string;
    scopeLabel: string;
    nextAction: string;
  }
> = {
  attached: {
    label: "Level facts attached",
    scopeLabel: "level facts",
    nextAction: "Open the trade detail to inspect factual level context.",
  },
  available_to_attach: {
    label: "Level facts available",
    scopeLabel: "level facts available",
    nextAction: "Attach accepted level facts from an explicit review action.",
  },
  blocked_by_as_of_policy: {
    label: "Level facts blocked by as-of policy",
    scopeLabel: "level facts blocked",
    nextAction: "Keep the existing review queue state unless an explicit policy is selected.",
  },
  unavailable_for_symbol_provider: {
    label: "Level facts unavailable",
    scopeLabel: "level facts unavailable",
    nextAction: "Use the existing review evidence.",
  },
  quarantined_or_unsafe: {
    label: "Level facts quarantined",
    scopeLabel: "level facts unavailable",
    nextAction: "Do not attach level facts from this delivery.",
  },
  not_checked: {
    label: "Level facts not checked",
    scopeLabel: "level facts not checked",
    nextAction: "Use the existing review queue.",
  },
  feature_disabled: {
    label: "Level facts not shown",
    scopeLabel: "execution and chart review only",
    nextAction: "Use the existing review queue.",
  },
};

const prohibitedQueueKeys = new Set([
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
  "priorityScore",
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

function isLimitationArray(
  value: unknown,
): value is JournalLevelAnalysisTradeLinkLimitation[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        isRecord(item) &&
        isNonEmptyString(item.code) &&
        isNonEmptyString(item.message) &&
        (item.field === undefined || typeof item.field === "string"),
    )
  );
}

function contractIssue(
  code: string,
  field: string,
  message: string,
): SavedReviewQueueLevelFactsContractIssue {
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

function cloneJson<T>(value: T): T {
  if (value === null || value === undefined) {
    return value;
  }

  return JSON.parse(JSON.stringify(value)) as T;
}

function stateDetail(args: {
  availability: ReviewQueueLevelFactsAvailability;
  link?: JournalLevelAnalysisTradeLinkRecord | null;
}): string {
  const { availability, link } = args;

  if (availability === "feature_disabled") {
    return "Level facts are available only when the journal level-analysis queue feature is enabled.";
  }

  if (availability === "not_checked") {
    return "No level-facts link has been checked for this saved trade.";
  }

  if (availability === "unavailable_for_symbol_provider") {
    return "No accepted level-facts link is available for this symbol and provider.";
  }

  if (!link) {
    return "Level-facts state is unavailable.";
  }

  if (availability === "attached") {
    return `${link.symbol} level facts from ${link.provider} are attached at ${link.symbolSummaryAsOfIso ?? "as-of time unavailable"}.`;
  }

  if (availability === "blocked_by_as_of_policy") {
    return `${link.symbol} level facts were not attached because the selected as-of policy blocked the candidate.`;
  }

  if (availability === "quarantined_or_unsafe") {
    return `${link.symbol} level facts are unavailable because the candidate was quarantined or unsafe.`;
  }

  return `${link.symbol} level facts are available from ${link.provider}.`;
}

function availabilityFromLink(
  link: JournalLevelAnalysisTradeLinkRecord | null | undefined,
): ReviewQueueLevelFactsAvailability {
  if (!link) {
    return "not_checked";
  }

  if (link.linkStatus === "linked") {
    return "attached";
  }

  if (link.matchResult.reason === "as_of_after_allowed_boundary") {
    return "blocked_by_as_of_policy";
  }

  if (
    link.matchResult.reason === "delivery_quarantined" ||
    link.matchResult.reason === "fifteen_minute_not_context_only"
  ) {
    return "quarantined_or_unsafe";
  }

  if (link.matchResult.reason === "no_accepted_symbol_summary") {
    return "unavailable_for_symbol_provider";
  }

  return "not_checked";
}

export function createSavedReviewQueueLevelFactsState(args: {
  availability: ReviewQueueLevelFactsAvailability;
  link?: JournalLevelAnalysisTradeLinkRecord | null;
  limitations?: JournalLevelAnalysisTradeLinkLimitation[];
}): SavedReviewQueueLevelFactsState {
  const copy = AVAILABILITY_LABELS[args.availability];
  const link = args.link ?? null;
  const limitations = cloneJson(args.limitations ?? link?.limitations ?? []);

  return {
    contractVersion: JOURNAL_LEVEL_ANALYSIS_REVIEW_QUEUE_LINKING_CONTRACT_VERSION,
    availability: args.availability,
    label: copy.label,
    detail: stateDetail({ availability: args.availability, link }),
    scopeLabel: copy.scopeLabel,
    nextAction: copy.nextAction,
    linkId: link?.id,
    deliveryId: link?.deliveryId,
    rawPayloadHash: link?.rawPayloadHash,
    sourceKind: link?.sourceKind,
    provider: link?.provider,
    symbol: link?.symbol,
    asOfIso: link?.symbolSummaryAsOfIso,
    asOfTimestamp: link?.symbolSummaryAsOfTimestamp,
    fifteenMinuteContextOnlyStatus:
      link?.linkedSymbolSummary?.fifteenMinuteContextOnlyStatus ??
      undefined,
    limitationCount: limitations.length,
    limitations,
  };
}

export function createFeatureDisabledReviewQueueLevelFactsState(): SavedReviewQueueLevelFactsState {
  return createSavedReviewQueueLevelFactsState({
    availability: "feature_disabled",
  });
}

export function deriveSavedReviewQueueLevelFactsStateFromTradeLink(
  link: JournalLevelAnalysisTradeLinkRecord | null | undefined,
): SavedReviewQueueLevelFactsState {
  return createSavedReviewQueueLevelFactsState({
    availability: availabilityFromLink(link),
    link,
  });
}

export function buildSavedReviewQueueLevelFactsReadModel(args: {
  tradeIds: string[];
  linksByTradeId?: Record<string, JournalLevelAnalysisTradeLinkRecord | null | undefined>;
  featureEnabled: boolean;
}): SavedReviewQueueLevelFactsReadModel {
  const statesByTradeId: Record<string, SavedReviewQueueLevelFactsState> = {};
  const counts = {
    attached: 0,
    available_to_attach: 0,
    blocked_by_as_of_policy: 0,
    unavailable_for_symbol_provider: 0,
    quarantined_or_unsafe: 0,
    not_checked: 0,
    feature_disabled: 0,
  } satisfies Record<ReviewQueueLevelFactsAvailability, number>;

  for (const tradeId of args.tradeIds) {
    const state = args.featureEnabled
      ? deriveSavedReviewQueueLevelFactsStateFromTradeLink(
          args.linksByTradeId?.[tradeId],
        )
      : createFeatureDisabledReviewQueueLevelFactsState();
    statesByTradeId[tradeId] = state;
    counts[state.availability] += 1;
  }

  return {
    contractVersion: JOURNAL_LEVEL_ANALYSIS_REVIEW_QUEUE_LINKING_CONTRACT_VERSION,
    source: "level_analysis_trade_links",
    featureEnabled: args.featureEnabled,
    statesByTradeId,
    counts,
  };
}

export function validateSavedReviewQueueLevelFactsState(
  payload: unknown,
): SavedReviewQueueLevelFactsValidationResult {
  const issues: SavedReviewQueueLevelFactsContractIssue[] = [];

  if (!isRecord(payload)) {
    return {
      status: "invalid",
      issues: [
        contractIssue(
          "payload_not_object",
          "$",
          "Saved review queue level-facts state must be an object.",
        ),
      ],
    };
  }

  for (const key of collectObjectKeys(payload)) {
    if (prohibitedQueueKeys.has(key)) {
      issues.push(
        contractIssue(
          "prohibited_journal_owned_field",
          key,
          "Queue level-facts state cannot include journal-owned evaluation fields.",
        ),
      );
    }
  }

  if (journalLevelAnalysisTradeLinkContainsRawPayload(payload)) {
    issues.push(
      contractIssue(
        "raw_payload_not_allowed",
        "rawPayload",
        "Queue level-facts state must not copy raw source payloads.",
      ),
    );
  }

  for (const field of [
    "contractVersion",
    "availability",
    "label",
    "detail",
    "scopeLabel",
    "nextAction",
  ]) {
    if (!isNonEmptyString(payload[field])) {
      issues.push(contractIssue("missing_required_field", field, `${field} is required.`));
    }
  }

  if (
    payload.contractVersion !==
    JOURNAL_LEVEL_ANALYSIS_REVIEW_QUEUE_LINKING_CONTRACT_VERSION
  ) {
    issues.push(
      contractIssue(
        "unsupported_contract",
        "contractVersion",
        "Unexpected review queue level-facts contract version.",
      ),
    );
  }

  if (
    payload.availability !== "attached" &&
    payload.availability !== "available_to_attach" &&
    payload.availability !== "blocked_by_as_of_policy" &&
    payload.availability !== "unavailable_for_symbol_provider" &&
    payload.availability !== "quarantined_or_unsafe" &&
    payload.availability !== "not_checked" &&
    payload.availability !== "feature_disabled"
  ) {
    issues.push(
      contractIssue(
        "invalid_availability",
        "availability",
        "Queue level-facts availability is invalid.",
      ),
    );
  }

  if (
    payload.rawPayloadHash !== undefined &&
    !/^sha256:[a-f0-9]{64}$/.test(String(payload.rawPayloadHash))
  ) {
    issues.push(
      contractIssue(
        "invalid_field_shape",
        "rawPayloadHash",
        "rawPayloadHash must be a sha256-prefixed hex digest when present.",
      ),
    );
  }

  if (
    payload.sourceKind !== undefined &&
    payload.sourceKind !== "single_snapshot_v1" &&
    payload.sourceKind !== "packaged_review_delivery"
  ) {
    issues.push(
      contractIssue(
        "invalid_field_shape",
        "sourceKind",
        "sourceKind must be a supported level-analysis source kind when present.",
      ),
    );
  }

  if (
    payload.asOfTimestamp !== undefined &&
    payload.asOfTimestamp !== null &&
    !isFiniteNumber(payload.asOfTimestamp)
  ) {
    issues.push(
      contractIssue(
        "invalid_field_shape",
        "asOfTimestamp",
        "asOfTimestamp must be a finite number or null when present.",
      ),
    );
  }

  if (!isFiniteNumber(payload.limitationCount)) {
    issues.push(
      contractIssue(
        "invalid_field_shape",
        "limitationCount",
        "limitationCount must be numeric.",
      ),
    );
  }

  if (!isLimitationArray(payload.limitations)) {
    issues.push(
      contractIssue(
        "invalid_field_shape",
        "limitations",
        "limitations must be compact limitation objects.",
      ),
    );
  }

  if (
    Array.isArray(payload.limitations) &&
    isFiniteNumber(payload.limitationCount) &&
    payload.limitations.length !== payload.limitationCount
  ) {
    issues.push(
      contractIssue(
        "inconsistent_limitation_count",
        "limitationCount",
        "limitationCount must match limitations length.",
      ),
    );
  }

  if (payload.availability === "attached") {
    for (const field of [
      "linkId",
      "deliveryId",
      "rawPayloadHash",
      "sourceKind",
      "provider",
      "symbol",
    ]) {
      if (!isNonEmptyString(payload[field])) {
        issues.push(
          contractIssue("missing_required_field", field, `${field} is required for attached facts.`),
        );
      }
    }

    if (
      payload.sourceKind === "packaged_review_delivery" &&
      payload.fifteenMinuteContextOnlyStatus !== "context_only"
    ) {
      issues.push(
        contractIssue(
          "fifteen_minute_not_context_only",
          "fifteenMinuteContextOnlyStatus",
          "Attached packaged level facts require context-only 15m status.",
        ),
      );
    }
  }

  if (issues.length > 0) {
    return { status: "invalid", issues };
  }

  return {
    status: "valid",
    state: payload as unknown as SavedReviewQueueLevelFactsState,
    issues: [],
  };
}
