import {
  journalLevelAnalysisTradeLinkContainsRawPayload,
  type JournalLevelAnalysisTradeLinkLimitation,
} from "./level-analysis-journal-delivery-trade-link-contract";
import {
  TRADE_DETAIL_LEVEL_FACTS_READ_MODEL_CONTRACT_VERSION,
  validateTradeDetailLevelFactsReadModel,
  type TradeDetailAttachedLevelFacts,
  type TradeDetailLevelFact,
  type TradeDetailLevelFactsReadModel,
} from "./level-analysis-trade-detail-level-facts-contract";

export const TRADE_DETAIL_LEVEL_FACTS_UI_CONTRACT_VERSION =
  "trade_detail_level_facts_ui_contract_v1" as const;

export type TradeDetailLevelFactsUiStatus =
  | "attached"
  | "not_checked"
  | "feature_disabled"
  | "blocked_by_as_of_policy"
  | "unavailable_for_symbol_provider"
  | "quarantined_or_unsafe";

export type TradeDetailLevelFactsUiTone =
  | "neutral"
  | "info"
  | "success"
  | "notice"
  | "warning"
  | "safety"
  | "muted";

export type TradeDetailLevelFactsUiSectionId =
  | "header"
  | "nearest_levels"
  | "context_summaries"
  | "coverage_and_diagnostics"
  | "source_integrity"
  | "limitations";

export interface TradeDetailLevelFactsUiValue {
  kind: "text" | "number" | "boolean" | "list" | "empty";
  value: string | number | boolean | string[] | null;
  unit?: string;
}

export interface TradeDetailLevelFactsUiRow {
  id: string;
  label: string;
  value: TradeDetailLevelFactsUiValue;
  detail?: string;
  tone: TradeDetailLevelFactsUiTone;
}

export interface TradeDetailLevelFactsUiBadge {
  id: string;
  label: string;
  tone: TradeDetailLevelFactsUiTone;
}

export interface TradeDetailLevelFactsUiSection {
  id: TradeDetailLevelFactsUiSectionId;
  title: string;
  detail: string;
  rows: TradeDetailLevelFactsUiRow[];
  badges: TradeDetailLevelFactsUiBadge[];
}

export interface TradeDetailLevelFactsAvailabilityLine {
  targetTestId: "trade-feedback-scope";
  position: "below_scope_detail_before_next_action";
  shouldRender: boolean;
  label: string;
  detail: string;
  tone: TradeDetailLevelFactsUiTone;
}

export interface TradeDetailLevelFactsPanelContract {
  targetTestId: "trade-supporting-details";
  position: "supporting_evidence_before_product_evidence_cards";
  shouldRender: boolean;
  title: "Level Facts";
  sections: TradeDetailLevelFactsUiSection[];
}

export interface TradeDetailLevelFactsUiContract {
  contractVersion: typeof TRADE_DETAIL_LEVEL_FACTS_UI_CONTRACT_VERSION;
  sourceReadModelContractVersion: typeof TRADE_DETAIL_LEVEL_FACTS_READ_MODEL_CONTRACT_VERSION;
  factualOnly: true;
  savedTradeId: string;
  featureEnabled: boolean;
  status: TradeDetailLevelFactsUiStatus;
  placement: {
    availabilityTargetTestId: "trade-feedback-scope";
    factsTargetTestId: "trade-supporting-details";
    availabilityPosition: "below_scope_detail_before_next_action";
    factsPosition: "supporting_evidence_before_product_evidence_cards";
  };
  availabilityLine: TradeDetailLevelFactsAvailabilityLine;
  factsPanel: TradeDetailLevelFactsPanelContract;
  summary: {
    shouldShowFactsPanel: boolean;
    sectionCount: number;
    limitationCount: number;
    missingFactCount: number;
    diagnosticCount: number;
    sourceFileCount: number;
    contextOnly15m: boolean;
  };
  limitations: JournalLevelAnalysisTradeLinkLimitation[];
}

export interface TradeDetailLevelFactsUiContractSummary {
  status: TradeDetailLevelFactsUiStatus;
  savedTradeId: string;
  shouldShowFactsPanel: boolean;
  sectionIds: TradeDetailLevelFactsUiSectionId[];
  limitationCount: number;
  missingFactCount: number;
  diagnosticCount: number;
  contextOnly15m: boolean;
}

export type BuildTradeDetailLevelFactsUiContractResult = {
  status: "built";
  contract: TradeDetailLevelFactsUiContract;
};

const PROHIBITED_SECTION_IDS = new Set([
  "grade",
  "coaching",
  "recommendation",
  "tradeAdvice",
  "pnl",
  "giveback",
  "behaviorScore",
  "entryDecision",
  "exitDecision",
]);

const PROHIBITED_FIELD_NAMES = new Set([
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
  "rawPayload",
]);

const PROHIBITED_LANGUAGE_PATTERNS: RegExp[] = [
  /\bgrade\b|\bgrading\b/i,
  /\bcoaching\b|\bcoach\b/i,
  /\bp\/l\b|\bpnl\b/i,
  /\bgiveback\b/i,
  /\bbehavior score\b|\bbehavior scoring\b/i,
  /\brecommendation\b/i,
  /\bbuy\b|\bsell\b|\bhold\b/i,
  /\bentry decision\b/i,
  /\bexit decision\b/i,
  /\btrade advice\b/i,
  /\bshould have\b/i,
  /\bshould enter\b/i,
  /\bshould exit\b/i,
];

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function textValue(value: string | null | undefined): TradeDetailLevelFactsUiValue {
  return {
    kind: value ? "text" : "empty",
    value: value ?? null,
  };
}

function numberValue(
  value: number | null | undefined,
  unit?: string,
): TradeDetailLevelFactsUiValue {
  return {
    kind: typeof value === "number" ? "number" : "empty",
    value: typeof value === "number" ? value : null,
    unit,
  };
}

function booleanValue(value: boolean | null | undefined): TradeDetailLevelFactsUiValue {
  return {
    kind: typeof value === "boolean" ? "boolean" : "empty",
    value: typeof value === "boolean" ? value : null,
  };
}

function listValue(value: string[]): TradeDetailLevelFactsUiValue {
  return {
    kind: value.length > 0 ? "list" : "empty",
    value: value.length > 0 ? [...value] : null,
  };
}

function row(args: {
  id: string;
  label: string;
  value: TradeDetailLevelFactsUiValue;
  detail?: string;
  tone?: TradeDetailLevelFactsUiTone;
}): TradeDetailLevelFactsUiRow {
  return {
    id: args.id,
    label: args.label,
    value: args.value,
    detail: args.detail,
    tone: args.tone ?? "neutral",
  };
}

function badge(
  id: string,
  label: string,
  tone: TradeDetailLevelFactsUiTone,
): TradeDetailLevelFactsUiBadge {
  return { id, label, tone };
}

function section(args: {
  id: TradeDetailLevelFactsUiSectionId;
  title: string;
  detail: string;
  rows: TradeDetailLevelFactsUiRow[];
  badges?: TradeDetailLevelFactsUiBadge[];
}): TradeDetailLevelFactsUiSection {
  return {
    id: args.id,
    title: args.title,
    detail: args.detail,
    rows: args.rows,
    badges: args.badges ?? [],
  };
}

function statusFromReadModel(
  readModel: TradeDetailLevelFactsReadModel,
): TradeDetailLevelFactsUiStatus {
  return readModel.availability.availability as TradeDetailLevelFactsUiStatus;
}

function toneFromStatus(
  status: TradeDetailLevelFactsUiStatus,
): TradeDetailLevelFactsUiTone {
  switch (status) {
    case "attached":
      return "success";
    case "blocked_by_as_of_policy":
    case "quarantined_or_unsafe":
      return "warning";
    case "unavailable_for_symbol_provider":
      return "notice";
    case "feature_disabled":
    case "not_checked":
      return "muted";
    default:
      return "neutral";
  }
}

function availabilityLineFromReadModel(
  readModel: TradeDetailLevelFactsReadModel,
  status: TradeDetailLevelFactsUiStatus,
): TradeDetailLevelFactsAvailabilityLine {
  const shouldRender = status !== "feature_disabled";

  return {
    targetTestId: "trade-feedback-scope",
    position: "below_scope_detail_before_next_action",
    shouldRender,
    label: shouldRender ? readModel.availability.label : "Level facts disabled",
    detail: shouldRender ? readModel.availability.detail : "Level facts are hidden.",
    tone: toneFromStatus(status),
  };
}

function sourceKindLabel(value: string): string {
  return value === "packaged_review_delivery"
    ? "packaged review delivery"
    : "single snapshot v1";
}

function levelRows(
  prefix: "support" | "resistance",
  level: TradeDetailLevelFact | undefined,
): TradeDetailLevelFactsUiRow[] {
  if (!level) {
    return [
      row({
        id: `nearest_levels.${prefix}.available`,
        label: `Nearest ${prefix}`,
        value: textValue(null),
        tone: "muted",
      }),
    ];
  }

  return [
    row({
      id: `nearest_levels.${prefix}.price`,
      label: `Nearest ${prefix}`,
      value: numberValue(level.price ?? level.representativePrice),
      detail: level.bucket,
      tone: "info",
    }),
    row({
      id: `nearest_levels.${prefix}.distance`,
      label: `${prefix} distance`,
      value: numberValue(level.distancePct ?? level.distanceFromReferencePct, "pct"),
      tone: "neutral",
    }),
    row({
      id: `nearest_levels.${prefix}.extension`,
      label: `${prefix} extension marker`,
      value: booleanValue(level.isExtension),
      tone: level.isExtension ? "notice" : "muted",
    }),
  ];
}

function recordNumberRows(args: {
  prefix: string;
  labelPrefix: string;
  values: Record<string, number> | undefined;
}): TradeDetailLevelFactsUiRow[] {
  return Object.entries(args.values ?? {}).map(([key, value]) =>
    row({
      id: `${args.prefix}.${key}`,
      label: `${args.labelPrefix} ${key}`,
      value: numberValue(value),
      tone: "neutral",
    }),
  );
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}

function readNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function readBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function readStringList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function zeroSafeCountTone(value: number | undefined): TradeDetailLevelFactsUiTone {
  if (value === undefined) {
    return "muted";
  }

  return value === 0 ? "safety" : "warning";
}

function sectionRowsFromSummary(args: {
  prefix: string;
  summary: unknown;
  allowedFields: string[];
}): TradeDetailLevelFactsUiRow[] {
  if (!isRecord(args.summary)) {
    return [
      row({
        id: `${args.prefix}.present`,
        label: `${args.prefix} present`,
        value: booleanValue(false),
        tone: "muted",
      }),
    ];
  }

  const rows: TradeDetailLevelFactsUiRow[] = [];
  for (const field of args.allowedFields) {
    const value = args.summary[field];
    const id = `${args.prefix}.${field}`;
    if (typeof value === "string") {
      rows.push(row({ id, label: field, value: textValue(value), tone: "info" }));
    } else if (typeof value === "number") {
      rows.push(row({ id, label: field, value: numberValue(value), tone: "info" }));
    } else if (typeof value === "boolean") {
      rows.push(row({ id, label: field, value: booleanValue(value), tone: "info" }));
    }
  }

  return rows.length > 0
    ? rows
    : [
        row({
          id: `${args.prefix}.present`,
          label: `${args.prefix} present`,
          value: booleanValue(true),
          tone: "info",
        }),
      ];
}

function rowsFromAttachedFacts(
  facts: TradeDetailAttachedLevelFacts,
): TradeDetailLevelFactsUiSection[] {
  const extensionCoverage = isRecord(facts.extensionCoverage)
    ? facts.extensionCoverage
    : {};
  const syntheticSummary = isRecord(facts.syntheticContinuationMapSummary)
    ? facts.syntheticContinuationMapSummary
    : {};
  const sourceIntegrity = isRecord(facts.cacheFingerprintSourceIntegrity)
    ? facts.cacheFingerprintSourceIntegrity
    : {};
  const sourceFiles = facts.sourceFiles ?? {};
  const sourceFileRows = Object.entries(sourceFiles).map(([timeframe, path]) =>
    row({
      id: `source_integrity.sourceFile.${timeframe}`,
      label: `${timeframe} source path`,
      value: textValue(path),
      tone: timeframe === "15m" ? "safety" : "muted",
    }),
  );

  return [
    section({
      id: "header",
      title: "Level facts",
      detail: "Source and as-of metadata for attached level facts.",
      badges: [
        badge("sourceKind", sourceKindLabel(facts.sourceKind), "info"),
        badge("contextOnly15m", facts.fifteenMinuteContextOnlyStatus, "safety"),
      ],
      rows: [
        row({
          id: "header.symbol",
          label: "Symbol",
          value: textValue(facts.symbol),
          tone: "info",
        }),
        row({
          id: "header.provider",
          label: "Provider",
          value: textValue(facts.provider),
          tone: "info",
        }),
        row({
          id: "header.asOfIso",
          label: "As of",
          value: textValue(facts.asOfIso),
          tone: "info",
        }),
        row({
          id: "header.referencePrice",
          label: "Reference price",
          value: numberValue(facts.referencePrice),
          tone: "neutral",
        }),
        row({
          id: "header.previousClose",
          label: "Previous close",
          value: numberValue(facts.previousClose),
          tone: facts.previousClose === undefined ? "muted" : "neutral",
        }),
      ],
    }),
    section({
      id: "nearest_levels",
      title: "Nearest levels",
      detail: "Closest support and resistance facts in the attached summary.",
      rows: [
        ...levelRows("support", facts.nearestSupport),
        ...levelRows("resistance", facts.nearestResistance),
      ],
    }),
    section({
      id: "context_summaries",
      title: "Context summaries",
      detail: "Density, inventory, and volume/session summaries when supplied.",
      rows: [
        ...sectionRowsFromSummary({
          prefix: "density",
          summary: facts.densityMetricSummary,
          allowedFields: ["present", "classification", "sideBias", "auditWindowPct"],
        }),
        ...sectionRowsFromSummary({
          prefix: "candidateInventory",
          summary: facts.candidateInventoryGapSummary,
          allowedFields: ["overall", "support", "resistance"],
        }),
        ...sectionRowsFromSummary({
          prefix: "volumeSession",
          summary: facts.volumeSessionContextSummary,
          allowedFields: [
            "outcome",
            "support",
            "resistance",
            "contextCount",
            "hasSessionFacts",
            "hasVolumeFacts",
            "volumeShelfCount",
          ],
        }),
      ],
    }),
    section({
      id: "coverage_and_diagnostics",
      title: "Coverage and diagnostics",
      detail: "Bucket counts, extension coverage, synthetic markers, and diagnostics.",
      rows: [
        ...recordNumberRows({
          prefix: "bucketCounts",
          labelPrefix: "Bucket",
          values: facts.bucketCounts,
        }),
        ...recordNumberRows({
          prefix: "extensionCounts",
          labelPrefix: "Extension",
          values: facts.extensionCounts,
        }),
        row({
          id: "extensionCoverage.warnings",
          label: "Extension coverage warnings",
          value: listValue(readStringList(extensionCoverage.warnings)),
          tone: readStringList(extensionCoverage.warnings).length > 0
            ? "notice"
            : "muted",
        }),
        row({
          id: "syntheticContinuationMap.count",
          label: "Synthetic continuation markers",
          value: numberValue(readNumber(syntheticSummary.count)),
          tone: "neutral",
        }),
        row({
          id: "diagnostics",
          label: "Diagnostics",
          value: listValue(facts.diagnostics),
          tone: facts.diagnostics.length > 0 ? "notice" : "muted",
        }),
      ],
    }),
    section({
      id: "source_integrity",
      title: "Source integrity",
      detail: "Cache and source metadata surfaced without raw payload access.",
      rows: [
        row({
          id: "sourceIntegrity.mismatchCount",
          label: "Cache mismatch count",
          value: numberValue(readNumber(sourceIntegrity.mismatchCount)),
          tone: zeroSafeCountTone(readNumber(sourceIntegrity.mismatchCount)),
        }),
        row({
          id: "sourceIntegrity.prohibitedLanguageHitCount",
          label: "Prohibited language hit count",
          value: numberValue(readNumber(sourceIntegrity.prohibitedLanguageHitCount)),
          tone: zeroSafeCountTone(
            readNumber(sourceIntegrity.prohibitedLanguageHitCount),
          ),
        }),
        row({
          id: "sourceIntegrity.fifteenMinuteContextOnly",
          label: "15m context-only",
          value: booleanValue(
            readBoolean(sourceIntegrity.fifteenMinuteCacheFingerprintsContextOnly) ??
              facts.fifteenMinuteContextOnlyStatus === "context_only",
          ),
          tone: "safety",
        }),
        ...sourceFileRows,
      ],
    }),
    section({
      id: "limitations",
      title: "Limitations",
      detail: "Missing facts, limitations, and safety flags for this attachment.",
      rows: [
        row({
          id: "missingFacts",
          label: "Missing facts",
          value: listValue(facts.missingFacts),
          tone: facts.missingFacts.length > 0 ? "notice" : "muted",
        }),
        row({
          id: "limitations",
          label: "Limitations",
          value: listValue(facts.limitations.map((item) => item.message)),
          tone: facts.limitations.length > 0 ? "notice" : "muted",
        }),
        row({
          id: "safety.noLookaheadApplied",
          label: "No-lookahead applied",
          value: booleanValue(
            isRecord(facts.safetyFlags)
              ? readBoolean(facts.safetyFlags.noLookaheadApplied)
              : undefined,
          ),
          tone: "safety",
        }),
        row({
          id: "safety.levelOutputUnchanged",
          label: "Level output unchanged",
          value: booleanValue(
            isRecord(facts.safetyFlags)
              ? readBoolean(facts.safetyFlags.levelOutputUnchanged)
              : undefined,
          ),
          tone: "safety",
        }),
      ],
    }),
  ];
}

function panelFromReadModel(
  readModel: TradeDetailLevelFactsReadModel,
): TradeDetailLevelFactsPanelContract {
  const shouldRender =
    readModel.featureEnabled &&
    readModel.display.shouldShowFactsPanel &&
    readModel.availability.availability === "attached" &&
    readModel.attachedFacts !== undefined;

  return {
    targetTestId: "trade-supporting-details",
    position: "supporting_evidence_before_product_evidence_cards",
    shouldRender,
    title: "Level Facts",
    sections: shouldRender && readModel.attachedFacts
      ? rowsFromAttachedFacts(readModel.attachedFacts)
      : [],
  };
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

function collectStringValues(value: unknown, out: string[] = []): string[] {
  if (typeof value === "string") {
    out.push(value);
    return out;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      collectStringValues(item, out);
    }
    return out;
  }

  if (isRecord(value)) {
    for (const item of Object.values(value)) {
      collectStringValues(item, out);
    }
  }

  return out;
}

export function buildTradeDetailLevelFactsUiContract(
  readModel: TradeDetailLevelFactsReadModel,
): BuildTradeDetailLevelFactsUiContractResult {
  const validation = validateTradeDetailLevelFactsReadModel(readModel);
  if (validation.status === "invalid") {
    throw new Error(
      `Invalid trade detail level-facts read model: ${validation.issues
        .map((issue) => `${issue.field}:${issue.code}`)
        .join(", ")}`,
    );
  }

  const status = statusFromReadModel(readModel);
  const factsPanel = panelFromReadModel(readModel);
  const contract: TradeDetailLevelFactsUiContract = {
    contractVersion: TRADE_DETAIL_LEVEL_FACTS_UI_CONTRACT_VERSION,
    sourceReadModelContractVersion:
      TRADE_DETAIL_LEVEL_FACTS_READ_MODEL_CONTRACT_VERSION,
    factualOnly: true,
    savedTradeId: readModel.savedTradeId,
    featureEnabled: readModel.featureEnabled,
    status,
    placement: {
      availabilityTargetTestId: "trade-feedback-scope",
      factsTargetTestId: "trade-supporting-details",
      availabilityPosition: "below_scope_detail_before_next_action",
      factsPosition: "supporting_evidence_before_product_evidence_cards",
    },
    availabilityLine: availabilityLineFromReadModel(readModel, status),
    factsPanel,
    summary: {
      shouldShowFactsPanel: factsPanel.shouldRender,
      sectionCount: factsPanel.sections.length,
      limitationCount: readModel.limitations.length,
      missingFactCount: readModel.attachedFacts?.missingFacts.length ?? 0,
      diagnosticCount: readModel.attachedFacts?.diagnostics.length ?? 0,
      sourceFileCount: Object.keys(readModel.attachedFacts?.sourceFiles ?? {})
        .length,
      contextOnly15m:
        readModel.attachedFacts?.fifteenMinuteContextOnlyStatus === "context_only",
    },
    limitations: readModel.limitations.map((limitation) => ({ ...limitation })),
  };

  assertTradeDetailLevelFactsUiContractIsFactualOnly(contract);
  return { status: "built", contract };
}

export function summarizeTradeDetailLevelFactsUiContract(
  contract: TradeDetailLevelFactsUiContract,
): TradeDetailLevelFactsUiContractSummary {
  return {
    status: contract.status,
    savedTradeId: contract.savedTradeId,
    shouldShowFactsPanel: contract.summary.shouldShowFactsPanel,
    sectionIds: contract.factsPanel.sections.map((sectionItem) => sectionItem.id),
    limitationCount: contract.summary.limitationCount,
    missingFactCount: contract.summary.missingFactCount,
    diagnosticCount: contract.summary.diagnosticCount,
    contextOnly15m: contract.summary.contextOnly15m,
  };
}

export function assertTradeDetailLevelFactsUiContractIsFactualOnly(
  contract: unknown,
): void {
  const factsPanel = isRecord(contract) && isRecord(contract.factsPanel)
    ? contract.factsPanel
    : null;
  const sections = factsPanel && Array.isArray(factsPanel.sections)
    ? factsPanel.sections
    : [];

  if (sections.length > 0) {
    const prohibitedSections = sections
      .map((sectionItem) =>
        isRecord(sectionItem) ? readString(sectionItem.id) ?? "" : "",
      )
      .filter((id) => PROHIBITED_SECTION_IDS.has(id));

    if (prohibitedSections.length > 0) {
      throw new Error(
        `Trade detail level-facts UI contract contains prohibited sections: ${prohibitedSections.join(", ")}.`,
      );
    }
  }

  if (journalLevelAnalysisTradeLinkContainsRawPayload(contract)) {
    throw new Error("Trade detail level-facts UI contract cannot expose raw payloads.");
  }

  const prohibitedKeys = collectObjectKeys(contract).filter((key) =>
    PROHIBITED_FIELD_NAMES.has(key),
  );
  const text = collectStringValues(contract).join("\n");
  const prohibitedLanguageCount = PROHIBITED_LANGUAGE_PATTERNS.filter((pattern) =>
    pattern.test(text),
  ).length;

  if (prohibitedKeys.length > 0 || prohibitedLanguageCount > 0) {
    throw new Error(
      `Trade detail level-facts UI contract must remain factual-only. Prohibited key count: ${prohibitedKeys.length}. Prohibited text count: ${prohibitedLanguageCount}.`,
    );
  }
}
