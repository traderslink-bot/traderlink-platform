import type { LevelAnalysisJournalSourceKind } from "./level-analysis-journal-delivery-adapter";
import {
  journalLevelAnalysisTradeLinkContainsRawPayload,
  type JournalLevelAnalysisLinkedSymbolSummary,
  type JournalLevelAnalysisTradeLinkLimitation,
  type JournalLevelAnalysisTradeLinkRecord,
} from "./level-analysis-journal-delivery-trade-link-contract";
import {
  createFeatureDisabledReviewQueueLevelFactsState,
  deriveSavedReviewQueueLevelFactsStateFromTradeLink,
  validateSavedReviewQueueLevelFactsState,
  type SavedReviewQueueLevelFactsState,
} from "./level-analysis-review-queue-linking-contract";

export const TRADE_DETAIL_LEVEL_FACTS_READ_MODEL_CONTRACT_VERSION =
  "trade_detail_level_facts_read_model_v1" as const;

export interface TradeDetailLevelFact {
  levelId?: string;
  kind?: string;
  bucket?: string;
  price?: number;
  representativePrice?: number;
  zoneLow?: number;
  zoneHigh?: number;
  strengthScore?: number;
  strengthLabel?: string;
  distancePct?: number;
  distanceFromReferencePct?: number;
  isExtension?: boolean;
}

export interface TradeDetailAttachedLevelFacts {
  linkId: string;
  deliveryId: string;
  rawPayloadHash: string;
  sourceKind: LevelAnalysisJournalSourceKind;
  provider: string;
  symbol: string;
  asOfIso?: string;
  asOfTimestamp: number | null;
  referencePrice: number;
  previousClose?: number;
  nearestSupport?: TradeDetailLevelFact;
  nearestResistance?: TradeDetailLevelFact;
  bucketCounts?: Record<string, number>;
  extensionCounts?: Record<string, number>;
  extensionCoverage?: unknown;
  syntheticContinuationMapSummary?: unknown;
  diagnostics: string[];
  diagnosticSemantics?: unknown;
  densityMetricSummary?: unknown;
  candidateInventoryGapSummary?: unknown;
  volumeSessionContextSummary?: unknown;
  sourceFiles?: Record<string, string>;
  cacheFingerprintSourceIntegrity?: unknown;
  fifteenMinuteContextOnlyStatus: string;
  missingFacts: string[];
  limitations: JournalLevelAnalysisTradeLinkLimitation[];
  safetyFlags: unknown;
}

export interface TradeDetailBlockedLevelFacts {
  linkId?: string;
  deliveryId?: string;
  rawPayloadHash?: string;
  sourceKind?: LevelAnalysisJournalSourceKind;
  provider?: string;
  symbol?: string;
  asOfIso?: string;
  asOfTimestamp?: number | null;
  matchReason: string;
  checkedAt?: string;
}

export interface TradeDetailLevelFactsReadModel {
  contractVersion: typeof TRADE_DETAIL_LEVEL_FACTS_READ_MODEL_CONTRACT_VERSION;
  savedTradeId: string;
  featureEnabled: boolean;
  availability: SavedReviewQueueLevelFactsState;
  display: {
    shouldShowFactsPanel: boolean;
    sectionLabel: "level facts";
    evidenceBoundaryLabel: string;
  };
  attachedFacts?: TradeDetailAttachedLevelFacts;
  blockedFacts?: TradeDetailBlockedLevelFacts;
  limitations: JournalLevelAnalysisTradeLinkLimitation[];
}

export interface TradeDetailLevelFactsContractIssue {
  code: string;
  field: string;
  message: string;
}

export type TradeDetailLevelFactsValidationResult =
  | {
      status: "valid";
      readModel: TradeDetailLevelFactsReadModel;
      issues: [];
    }
  | {
      status: "invalid";
      issues: TradeDetailLevelFactsContractIssue[];
    };

type JsonRecord = Record<string, unknown>;

const prohibitedTradeDetailLevelFactsKeys = new Set([
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
): TradeDetailLevelFactsContractIssue {
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

function readLevelPrice(summary: unknown): number | undefined {
  if (!isRecord(summary)) {
    return undefined;
  }

  if (isFiniteNumber(summary.price)) {
    return summary.price;
  }

  if (isFiniteNumber(summary.representativePrice)) {
    return summary.representativePrice;
  }

  return undefined;
}

function compactLevelFact(value: unknown): TradeDetailLevelFact | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const fact: TradeDetailLevelFact = {};
  for (const field of [
    "levelId",
    "kind",
    "bucket",
    "strengthLabel",
  ] as const) {
    if (isNonEmptyString(value[field])) {
      fact[field] = value[field];
    }
  }

  for (const field of [
    "price",
    "representativePrice",
    "zoneLow",
    "zoneHigh",
    "strengthScore",
    "distancePct",
    "distanceFromReferencePct",
  ] as const) {
    if (isFiniteNumber(value[field])) {
      fact[field] = value[field];
    }
  }

  if (typeof value.isExtension === "boolean") {
    fact.isExtension = value.isExtension;
  }

  if (fact.price === undefined) {
    fact.price = readLevelPrice(value);
  }

  return Object.keys(fact).length > 0 ? fact : undefined;
}

function recordObject(value: unknown): Record<string, number> | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const out: Record<string, number> = {};
  for (const [key, item] of Object.entries(value)) {
    if (isFiniteNumber(item)) {
      out[key] = item;
    }
  }

  return Object.keys(out).length > 0 ? out : undefined;
}

function stringRecord(value: unknown): Record<string, string> | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const out: Record<string, string> = {};
  for (const [key, item] of Object.entries(value)) {
    if (isNonEmptyString(item)) {
      out[key] = item;
    }
  }

  return Object.keys(out).length > 0 ? out : undefined;
}

function attachedFactsFromLink(
  link: JournalLevelAnalysisTradeLinkRecord | null | undefined,
): TradeDetailAttachedLevelFacts | undefined {
  if (!link || link.linkStatus !== "linked") {
    return undefined;
  }

  const summary: JournalLevelAnalysisLinkedSymbolSummary = link.linkedSymbolSummary;

  return {
    linkId: link.id,
    deliveryId: link.deliveryId,
    rawPayloadHash: link.rawPayloadHash,
    sourceKind: link.sourceKind,
    provider: link.provider,
    symbol: link.symbol,
    asOfIso: summary.asOfIso,
    asOfTimestamp: summary.asOfTimestamp,
    referencePrice: summary.referencePrice,
    previousClose: summary.previousClose,
    nearestSupport: compactLevelFact(summary.nearestSupport),
    nearestResistance: compactLevelFact(summary.nearestResistance),
    bucketCounts: recordObject(summary.bucketCounts),
    extensionCounts: recordObject(summary.extensionCounts),
    extensionCoverage: cloneJson(summary.extensionCoverage),
    syntheticContinuationMapSummary: cloneJson(
      summary.syntheticContinuationMapSummary,
    ),
    diagnostics: cloneJson(summary.diagnostics),
    diagnosticSemantics: cloneJson(summary.diagnosticSemantics),
    densityMetricSummary: cloneJson(summary.densityMetricSummary),
    candidateInventoryGapSummary: cloneJson(summary.candidateInventoryGapSummary),
    volumeSessionContextSummary: cloneJson(summary.volumeSessionContextSummary),
    sourceFiles: stringRecord(summary.sourceFiles),
    cacheFingerprintSourceIntegrity: cloneJson(
      summary.cacheFingerprintSourceIntegrity,
    ),
    fifteenMinuteContextOnlyStatus: summary.fifteenMinuteContextOnlyStatus,
    missingFacts: cloneJson(summary.missingFacts),
    limitations: cloneJson(summary.limitations),
    safetyFlags: cloneJson(summary.safetyFlags),
  };
}

function blockedFactsFromLink(
  link: JournalLevelAnalysisTradeLinkRecord | null | undefined,
): TradeDetailBlockedLevelFacts | undefined {
  if (!link || link.linkStatus === "linked") {
    return undefined;
  }

  return {
    linkId: link.id,
    deliveryId: link.deliveryId,
    rawPayloadHash: link.rawPayloadHash,
    sourceKind: link.sourceKind,
    provider: link.provider,
    symbol: link.symbol,
    asOfIso: link.symbolSummaryAsOfIso,
    asOfTimestamp: link.symbolSummaryAsOfTimestamp,
    matchReason: link.matchResult.reason,
    checkedAt: link.matchResult.checkedAt,
  };
}

export function buildTradeDetailLevelFactsReadModel(args: {
  savedTradeId: string;
  featureEnabled: boolean;
  link?: JournalLevelAnalysisTradeLinkRecord | null;
}): TradeDetailLevelFactsReadModel {
  const availability = args.featureEnabled
    ? deriveSavedReviewQueueLevelFactsStateFromTradeLink(args.link)
    : createFeatureDisabledReviewQueueLevelFactsState();
  const attachedFacts = args.featureEnabled
    ? attachedFactsFromLink(args.link ?? null)
    : undefined;
  const blockedFacts = args.featureEnabled
    ? blockedFactsFromLink(args.link ?? null)
    : undefined;
  const limitations = cloneJson(
    attachedFacts?.limitations ?? availability.limitations ?? [],
  );

  return {
    contractVersion: TRADE_DETAIL_LEVEL_FACTS_READ_MODEL_CONTRACT_VERSION,
    savedTradeId: args.savedTradeId,
    featureEnabled: args.featureEnabled,
    availability,
    display: {
      shouldShowFactsPanel:
        args.featureEnabled && availability.availability === "attached",
      sectionLabel: "level facts",
      evidenceBoundaryLabel:
        availability.availability === "attached"
          ? "Level facts are available as supporting evidence."
          : "Level facts are not attached to this trade detail.",
    },
    attachedFacts,
    blockedFacts,
    limitations,
  };
}

export function validateTradeDetailLevelFactsReadModel(
  payload: unknown,
): TradeDetailLevelFactsValidationResult {
  const issues: TradeDetailLevelFactsContractIssue[] = [];

  if (!isRecord(payload)) {
    return {
      status: "invalid",
      issues: [
        contractIssue(
          "payload_not_object",
          "$",
          "Trade detail level-facts read model must be an object.",
        ),
      ],
    };
  }

  for (const key of collectObjectKeys(payload)) {
    if (prohibitedTradeDetailLevelFactsKeys.has(key)) {
      issues.push(
        contractIssue(
          "prohibited_journal_owned_field",
          key,
          "Trade-detail level facts cannot include journal-owned evaluation fields.",
        ),
      );
    }
  }

  if (journalLevelAnalysisTradeLinkContainsRawPayload(payload)) {
    issues.push(
      contractIssue(
        "raw_payload_not_allowed",
        "rawPayload",
        "Trade-detail level facts must not copy raw source payloads.",
      ),
    );
  }

  if (
    payload.contractVersion !==
    TRADE_DETAIL_LEVEL_FACTS_READ_MODEL_CONTRACT_VERSION
  ) {
    issues.push(
      contractIssue(
        "unsupported_contract",
        "contractVersion",
        "Unexpected trade detail level-facts read-model contract version.",
      ),
    );
  }

  if (!isNonEmptyString(payload.savedTradeId)) {
    issues.push(
      contractIssue(
        "missing_required_field",
        "savedTradeId",
        "savedTradeId is required.",
      ),
    );
  }

  if (typeof payload.featureEnabled !== "boolean") {
    issues.push(
      contractIssue(
        "invalid_field_shape",
        "featureEnabled",
        "featureEnabled must be boolean.",
      ),
    );
  }

  if (!isRecord(payload.availability)) {
    issues.push(
      contractIssue(
        "invalid_field_shape",
        "availability",
        "availability is required.",
      ),
    );
  } else {
    const availabilityValidation =
      validateSavedReviewQueueLevelFactsState(payload.availability);
    if (availabilityValidation.status === "invalid") {
      for (const issue of availabilityValidation.issues) {
        issues.push({
          code: issue.code,
          field: `availability.${issue.field}`,
          message: issue.message,
        });
      }
    }
  }

  if (!isRecord(payload.display)) {
    issues.push(
      contractIssue("invalid_field_shape", "display", "display is required."),
    );
  } else {
    if (typeof payload.display.shouldShowFactsPanel !== "boolean") {
      issues.push(
        contractIssue(
          "invalid_field_shape",
          "display.shouldShowFactsPanel",
          "shouldShowFactsPanel must be boolean.",
        ),
      );
    }

    if (payload.display.sectionLabel !== "level facts") {
      issues.push(
        contractIssue(
          "invalid_field_shape",
          "display.sectionLabel",
          "sectionLabel must be level facts.",
        ),
      );
    }

    if (!isNonEmptyString(payload.display.evidenceBoundaryLabel)) {
      issues.push(
        contractIssue(
          "missing_required_field",
          "display.evidenceBoundaryLabel",
          "evidenceBoundaryLabel is required.",
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

  const availability = isRecord(payload.availability)
    ? payload.availability.availability
    : undefined;

  if (availability === "attached") {
    if (!isRecord(payload.attachedFacts)) {
      issues.push(
        contractIssue(
          "missing_required_field",
          "attachedFacts",
          "Attached availability requires attachedFacts.",
        ),
      );
    } else {
      for (const field of [
        "linkId",
        "deliveryId",
        "rawPayloadHash",
        "sourceKind",
        "provider",
        "symbol",
        "fifteenMinuteContextOnlyStatus",
      ]) {
        if (!isNonEmptyString(payload.attachedFacts[field])) {
          issues.push(
            contractIssue(
              "missing_required_field",
              `attachedFacts.${field}`,
              `${field} is required for attached facts.`,
            ),
          );
        }
      }

      if (!isFiniteNumber(payload.attachedFacts.referencePrice)) {
        issues.push(
          contractIssue(
            "invalid_field_shape",
            "attachedFacts.referencePrice",
            "referencePrice is required for attached facts.",
          ),
        );
      }

      if (
        payload.attachedFacts.rawPayloadHash !== undefined &&
        !/^sha256:[a-f0-9]{64}$/.test(String(payload.attachedFacts.rawPayloadHash))
      ) {
        issues.push(
          contractIssue(
            "invalid_field_shape",
            "attachedFacts.rawPayloadHash",
            "rawPayloadHash must be a sha256-prefixed hex digest.",
          ),
        );
      }

      if (
        payload.attachedFacts.sourceKind === "packaged_review_delivery" &&
        payload.attachedFacts.fifteenMinuteContextOnlyStatus !== "context_only"
      ) {
        issues.push(
          contractIssue(
            "fifteen_minute_not_context_only",
            "attachedFacts.fifteenMinuteContextOnlyStatus",
            "Attached packaged delivery facts require context-only 15m status.",
          ),
        );
      }

      if (!Array.isArray(payload.attachedFacts.diagnostics)) {
        issues.push(
          contractIssue(
            "invalid_field_shape",
            "attachedFacts.diagnostics",
            "diagnostics must be an array.",
          ),
        );
      }

      if (!Array.isArray(payload.attachedFacts.missingFacts)) {
        issues.push(
          contractIssue(
            "invalid_field_shape",
            "attachedFacts.missingFacts",
            "missingFacts must be an array.",
          ),
        );
      }

      if (!Array.isArray(payload.attachedFacts.limitations)) {
        issues.push(
          contractIssue(
            "invalid_field_shape",
            "attachedFacts.limitations",
            "attachedFacts.limitations must be an array.",
          ),
        );
      }
    }

    if (payload.blockedFacts !== undefined) {
      issues.push(
        contractIssue(
          "blocked_facts_not_allowed",
          "blockedFacts",
          "Attached availability cannot include blockedFacts.",
        ),
      );
    }
  }

  if (
    availability !== "attached" &&
    isRecord(payload.attachedFacts)
  ) {
    issues.push(
      contractIssue(
        "attached_facts_not_allowed",
        "attachedFacts",
        "Unattached availability cannot include attachedFacts.",
      ),
    );
  }

  if (
    (availability === "blocked_by_as_of_policy" ||
      availability === "unavailable_for_symbol_provider" ||
      availability === "quarantined_or_unsafe") &&
    !isRecord(payload.blockedFacts)
  ) {
    issues.push(
      contractIssue(
        "missing_required_field",
        "blockedFacts",
        "Blocked or unavailable availability requires blockedFacts.",
      ),
    );
  }

  if (isRecord(payload.blockedFacts)) {
    if (!isNonEmptyString(payload.blockedFacts.matchReason)) {
      issues.push(
        contractIssue(
          "missing_required_field",
          "blockedFacts.matchReason",
          "blockedFacts.matchReason is required.",
        ),
      );
    }

    if (
      payload.blockedFacts.rawPayloadHash !== undefined &&
      !/^sha256:[a-f0-9]{64}$/.test(String(payload.blockedFacts.rawPayloadHash))
    ) {
      issues.push(
        contractIssue(
          "invalid_field_shape",
          "blockedFacts.rawPayloadHash",
          "rawPayloadHash must be a sha256-prefixed hex digest.",
        ),
      );
    }
  }

  if (payload.featureEnabled === false) {
    if (isRecord(payload.attachedFacts) || isRecord(payload.blockedFacts)) {
      issues.push(
        contractIssue(
          "facts_not_allowed_when_disabled",
          "featureEnabled",
          "Feature-disabled read models cannot include attached or blocked facts.",
        ),
      );
    }

    if (availability !== "feature_disabled") {
      issues.push(
        contractIssue(
          "invalid_disabled_state",
          "availability.availability",
          "Feature-disabled read models require feature_disabled availability.",
        ),
      );
    }
  }

  if (issues.length > 0) {
    return { status: "invalid", issues };
  }

  return {
    status: "valid",
    readModel: payload as unknown as TradeDetailLevelFactsReadModel,
    issues: [],
  };
}
