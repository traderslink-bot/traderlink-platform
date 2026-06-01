import type {
  ExecutionAnalysisLevelContextFactPresence,
  ExecutionAnalysisLevelContextUnavailableReason,
} from "./execution-level-context-input";
import type {
  ExecutionLevelContextNearestLevelReadModel,
  ExecutionLevelContextObservationReadModel,
} from "./execution-level-context-observation-read-model";
import type {
  ExecutionLevelContextReadModelStorageRecord,
  ExecutionLevelContextReadModelStoredRecord,
} from "./execution-level-context-read-model-storage";

export type ExecutionLevelContextUiStatus =
  | "available"
  | "limited"
  | "unavailable"
  | "not_replay_safe";

export type ExecutionLevelContextUiSectionId =
  | "overview"
  | "nearestLevels"
  | "extensions"
  | "syntheticContinuationMap"
  | "quality"
  | "diagnostics"
  | "limitations"
  | "safety"
  | "dataCompleteness"
  | "source";

export type ExecutionLevelContextUiTone =
  | "neutral"
  | "info"
  | "notice"
  | "coverage"
  | "safety"
  | "muted";

export interface ExecutionLevelContextUiValue {
  kind: "text" | "number" | "boolean" | "timestamp" | "list" | "empty";
  value: string | number | boolean | string[] | null;
  unit?: string;
}

export interface ExecutionLevelContextUiBadge {
  id: string;
  label: string;
  tone: ExecutionLevelContextUiTone;
}

export interface ExecutionLevelContextUiRow {
  id: string;
  label: string;
  value: ExecutionLevelContextUiValue;
  detail?: string;
  tone: ExecutionLevelContextUiTone;
}

export interface ExecutionLevelContextUiSection {
  id: ExecutionLevelContextUiSectionId;
  title: string;
  detail: string;
  status: ExecutionLevelContextUiStatus;
  rows: ExecutionLevelContextUiRow[];
  badges: ExecutionLevelContextUiBadge[];
}

export interface ExecutionLevelContextUiContract {
  contractVersion: "execution_level_context_ui_contract_v1";
  factualOnly: true;
  status: ExecutionLevelContextUiStatus;
  statusReason: ExecutionAnalysisLevelContextUnavailableReason | "missing_context" | null;
  source: {
    attachmentKey?: string;
    snapshotStorageKey?: string;
    readModelStorageKey?: string;
    ownerId?: string;
    ownerType?: string;
    schemaVersion?: string;
    producer?: string;
  };
  identity: {
    symbol: string | null;
    asOfTimestamp: number | null;
    referencePrice: number | null;
  };
  sections: ExecutionLevelContextUiSection[];
  summary: {
    status: ExecutionLevelContextUiStatus;
    sectionCount: number;
    diagnosticCount: number;
    limitationCount: number;
    qualityNoteCount: number;
    syntheticContinuationMapCount: number;
    replaySafe: boolean;
  };
}

export type BuildExecutionLevelContextUiContractResult = {
  status: "built";
  contract: ExecutionLevelContextUiContract;
};

export interface ExecutionLevelContextUiContractSummary {
  status: ExecutionLevelContextUiStatus;
  symbol: string | null;
  asOfTimestamp: number | null;
  sectionIds: ExecutionLevelContextUiSectionId[];
  diagnosticCount: number;
  limitationCount: number;
  qualityNoteCount: number;
  syntheticContinuationMapCount: number;
  replaySafe: boolean;
}

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
  "mistake",
  "discipline",
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
  /\bmistake\b/i,
  /\bdiscipline\b/i,
  /\bgood trade\b|\bbad trade\b/i,
  /\bshould have\b/i,
];

function textValue(value: string | null): ExecutionLevelContextUiValue {
  return {
    kind: value === null ? "empty" : "text",
    value,
  };
}

function numberValue(value: number | null, unit?: string): ExecutionLevelContextUiValue {
  return {
    kind: value === null ? "empty" : "number",
    value,
    unit,
  };
}

function booleanValue(value: boolean): ExecutionLevelContextUiValue {
  return {
    kind: "boolean",
    value,
  };
}

function timestampValue(value: number | null): ExecutionLevelContextUiValue {
  return {
    kind: value === null ? "empty" : "timestamp",
    value,
  };
}

function listValue(value: string[]): ExecutionLevelContextUiValue {
  return {
    kind: "list",
    value: [...value],
  };
}

function row(args: {
  id: string;
  label: string;
  value: ExecutionLevelContextUiValue;
  detail?: string;
  tone?: ExecutionLevelContextUiTone;
}): ExecutionLevelContextUiRow {
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
  tone: ExecutionLevelContextUiTone,
): ExecutionLevelContextUiBadge {
  return { id, label, tone };
}

function section(args: {
  id: ExecutionLevelContextUiSectionId;
  title: string;
  detail: string;
  status: ExecutionLevelContextUiStatus;
  rows: ExecutionLevelContextUiRow[];
  badges?: ExecutionLevelContextUiBadge[];
}): ExecutionLevelContextUiSection {
  return {
    id: args.id,
    title: args.title,
    detail: args.detail,
    status: args.status,
    rows: args.rows,
    badges: args.badges ?? [],
  };
}

function collectObjectKeys(value: unknown, out: string[] = []): string[] {
  if (Array.isArray(value)) {
    for (const item of value) {
      collectObjectKeys(item, out);
    }
    return out;
  }

  if (typeof value === "object" && value !== null) {
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

  if (typeof value === "object" && value !== null) {
    for (const item of Object.values(value)) {
      collectStringValues(item, out);
    }
  }

  return out;
}

function statusFromReadModel(
  readModel: ExecutionLevelContextObservationReadModel,
): ExecutionLevelContextUiStatus {
  if (readModel.status === "not_replay_safe") {
    return "not_replay_safe";
  }

  return readModel.status;
}

function sourceFromReadModel(
  readModel: ExecutionLevelContextObservationReadModel,
): ExecutionLevelContextUiContract["source"] {
  return {
    attachmentKey: readModel.source.attachmentKey,
    snapshotStorageKey: readModel.source.storageKey,
    schemaVersion: readModel.source.schemaVersion,
    producer: readModel.source.producer,
  };
}

function sourceFromStorageRecord(
  record: ExecutionLevelContextReadModelStorageRecord,
): ExecutionLevelContextUiContract["source"] {
  return {
    ...sourceFromReadModel(record.readModel),
    readModelStorageKey: record.storageKey,
    ownerId: record.ownerId,
    ownerType: record.ownerType,
  };
}

function nearestRows(
  prefix: "support" | "resistance",
  level: ExecutionLevelContextNearestLevelReadModel,
): ExecutionLevelContextUiRow[] {
  return [
    row({
      id: `${prefix}.present`,
      label: `${prefix === "support" ? "Support" : "Resistance"} present`,
      value: booleanValue(level.present),
      tone: level.present ? "info" : "notice",
    }),
    row({
      id: `${prefix}.representativePrice`,
      label: `${prefix === "support" ? "Support" : "Resistance"} price`,
      value: numberValue(level.representativePrice),
      tone: level.present ? "info" : "muted",
    }),
    row({
      id: `${prefix}.distanceFromReferencePct`,
      label: `${prefix === "support" ? "Support" : "Resistance"} distance`,
      value: numberValue(level.distanceFromReferencePct, "pct"),
      detail: "Distance from snapshot reference price.",
      tone: level.present ? "info" : "muted",
    }),
    row({
      id: `${prefix}.bucket`,
      label: `${prefix === "support" ? "Support" : "Resistance"} bucket`,
      value: textValue(level.bucket),
      tone: level.present ? "info" : "muted",
    }),
  ];
}

function dataCompletenessRows(
  factPresence: ExecutionAnalysisLevelContextFactPresence | null,
): ExecutionLevelContextUiRow[] {
  if (!factPresence) {
    return [
      row({
        id: "factPresence.available",
        label: "Fact presence summary",
        value: booleanValue(false),
        detail: "Fact presence data is not available in this read model.",
        tone: "notice",
      }),
    ];
  }

  return [
    row({
      id: "sessionFacts",
      label: "Session facts",
      value: booleanValue(factPresence.hasSessionFacts),
      tone: factPresence.hasSessionFacts ? "info" : "coverage",
    }),
    row({
      id: "volumeFacts",
      label: "Volume facts",
      value: booleanValue(factPresence.hasVolumeFacts),
      tone: factPresence.hasVolumeFacts ? "info" : "coverage",
    }),
    row({
      id: "volumeShelves",
      label: "Volume shelf count",
      value: numberValue(factPresence.volumeShelfCount),
      tone: factPresence.volumeShelfCount > 0 ? "info" : "coverage",
    }),
    row({
      id: "marketContext",
      label: "Market context",
      value: booleanValue(factPresence.hasMarketContext),
      tone: factPresence.hasMarketContext ? "info" : "coverage",
    }),
    row({
      id: "factsBundle",
      label: "Facts bundle",
      value: booleanValue(factPresence.hasFactsBundle),
      tone: factPresence.hasFactsBundle ? "info" : "coverage",
    }),
  ];
}

function sectionsFromReadModel(args: {
  readModel: ExecutionLevelContextObservationReadModel;
  status: ExecutionLevelContextUiStatus;
  source: ExecutionLevelContextUiContract["source"];
}): ExecutionLevelContextUiSection[] {
  const { readModel, status, source } = args;

  return [
    section({
      id: "overview",
      title: "Level context overview",
      detail: "Factual snapshot identity and availability.",
      status,
      badges: [
        badge("status", status, status === "available" ? "info" : "notice"),
        badge("factualOnly", "factual only", "neutral"),
      ],
      rows: [
        row({
          id: "symbol",
          label: "Symbol",
          value: textValue(readModel.identity.symbol),
          tone: "info",
        }),
        row({
          id: "asOfTimestamp",
          label: "As-of timestamp",
          value: timestampValue(readModel.identity.asOfTimestamp),
          tone: "info",
        }),
        row({
          id: "referencePrice",
          label: "Reference price",
          value: numberValue(readModel.identity.referencePrice),
          tone: "info",
        }),
        row({
          id: "readModelStatus",
          label: "Read model status",
          value: textValue(readModel.status),
          tone: status === "available" ? "info" : "notice",
        }),
      ],
    }),
    section({
      id: "nearestLevels",
      title: "Nearest levels",
      detail: "Nearest factual support and resistance context.",
      status,
      rows: [
        ...nearestRows("support", readModel.nearestLevels.support),
        ...nearestRows("resistance", readModel.nearestLevels.resistance),
      ],
    }),
    section({
      id: "extensions",
      title: "Extension coverage",
      detail: "Counts for extension levels in the factual level map.",
      status,
      rows: [
        row({
          id: "supportExtensions",
          label: "Support extensions",
          value: numberValue(readModel.levelMap.extensionCounts?.support ?? null),
          tone: "info",
        }),
        row({
          id: "resistanceExtensions",
          label: "Resistance extensions",
          value: numberValue(readModel.levelMap.extensionCounts?.resistance ?? null),
          tone: "info",
        }),
        row({
          id: "totalExtensions",
          label: "Total extensions",
          value: numberValue(readModel.levelMap.extensionCounts?.total ?? null),
          tone: "info",
        }),
      ],
    }),
    section({
      id: "syntheticContinuationMap",
      title: "Synthetic continuation-map",
      detail: "Synthetic forward-planning context only.",
      status,
      badges: [
        badge("contextType", readModel.synthetic.contextType, "notice"),
        badge("historicalEvidence", "not historical evidence", "coverage"),
      ],
      rows: [
        row({
          id: "synthetic.count",
          label: "Synthetic count",
          value: numberValue(readModel.synthetic.count),
          tone: readModel.synthetic.count > 0 ? "notice" : "muted",
        }),
        row({
          id: "synthetic.supportCount",
          label: "Synthetic support count",
          value: numberValue(readModel.synthetic.supportCount),
          tone: "notice",
        }),
        row({
          id: "synthetic.resistanceCount",
          label: "Synthetic resistance count",
          value: numberValue(readModel.synthetic.resistanceCount),
          tone: "notice",
        }),
        row({
          id: "synthetic.marked",
          label: "Synthetic rows marked",
          value: booleanValue(readModel.synthetic.marked),
          tone: readModel.synthetic.marked ? "info" : "safety",
        }),
        row({
          id: "synthetic.historicalEvidence",
          label: "Historical evidence",
          value: booleanValue(readModel.synthetic.historicalEvidence),
          detail: "Synthetic continuation-map rows are not historical level evidence.",
          tone: "coverage",
        }),
        row({
          id: "synthetic.limitations",
          label: "Synthetic limitations",
          value: listValue(readModel.synthetic.limitations),
          tone: readModel.synthetic.limitations.length > 0 ? "coverage" : "muted",
        }),
      ],
    }),
    section({
      id: "quality",
      title: "Quality context",
      detail: "LevelQualityAudit context for coverage review.",
      status,
      rows: [
        row({
          id: "quality.warningCount",
          label: "Quality note count",
          value: numberValue(readModel.quality.warningCount),
          tone: readModel.quality.warningCount > 0 ? "coverage" : "muted",
        }),
        row({
          id: "quality.warnings",
          label: "Quality notes",
          value: listValue(readModel.quality.warnings),
          tone: readModel.quality.warningCount > 0 ? "coverage" : "muted",
        }),
        row({
          id: "quality.hasLevelQualityAudit",
          label: "LevelQualityAudit present",
          value: booleanValue(readModel.quality.hasLevelQualityAudit),
          tone: readModel.quality.hasLevelQualityAudit ? "info" : "coverage",
        }),
      ],
    }),
    section({
      id: "diagnostics",
      title: "Diagnostics",
      detail: "Snapshot and quality diagnostics.",
      status,
      rows: [
        row({
          id: "diagnostics.count",
          label: "Diagnostic count",
          value: numberValue(readModel.diagnostics.count),
          tone: readModel.diagnostics.count > 0 ? "notice" : "muted",
        }),
        row({
          id: "diagnostics.snapshot",
          label: "Snapshot diagnostics",
          value: listValue(readModel.diagnostics.snapshotDiagnostics),
          tone: readModel.diagnostics.snapshotDiagnostics.length > 0 ? "notice" : "muted",
        }),
        row({
          id: "diagnostics.quality",
          label: "Quality diagnostics",
          value: listValue(readModel.diagnostics.qualityDiagnostics),
          tone: readModel.diagnostics.qualityDiagnostics.length > 0 ? "notice" : "muted",
        }),
      ],
    }),
    section({
      id: "limitations",
      title: "Limitations",
      detail: "Known factual context limitations.",
      status: readModel.limitations.count > 0 ? "limited" : status,
      rows: [
        row({
          id: "limitations.count",
          label: "Limitation count",
          value: numberValue(readModel.limitations.count),
          tone: readModel.limitations.count > 0 ? "notice" : "muted",
        }),
        row({
          id: "limitations.messages",
          label: "Limitation notes",
          value: listValue(readModel.limitations.messages),
          tone: readModel.limitations.count > 0 ? "notice" : "muted",
        }),
      ],
    }),
    section({
      id: "safety",
      title: "Safety",
      detail: "Replay and factual-context safety flags.",
      status: readModel.safety.noLookaheadApplied ? status : "not_replay_safe",
      rows: [
        row({
          id: "safety.noLookaheadApplied",
          label: "No-lookahead applied",
          value: booleanValue(readModel.safety.noLookaheadApplied),
          tone: readModel.safety.noLookaheadApplied ? "info" : "safety",
        }),
        row({
          id: "safety.syntheticExtensionsClearlyMarked",
          label: "Synthetic rows clearly marked",
          value: booleanValue(readModel.safety.syntheticExtensionsClearlyMarked),
          tone: readModel.safety.syntheticExtensionsClearlyMarked ? "info" : "safety",
        }),
        row({
          id: "safety.factualContextOnly",
          label: "Factual context only",
          value: booleanValue(readModel.safety.factualContextOnly),
          tone: readModel.safety.factualContextOnly ? "info" : "safety",
        }),
      ],
    }),
    section({
      id: "dataCompleteness",
      title: "Data completeness",
      detail: "Presence of supporting factual sections.",
      status,
      rows: dataCompletenessRows(readModel.factPresence),
    }),
    section({
      id: "source",
      title: "Source",
      detail: "Source identifiers for audit and traceability.",
      status,
      rows: [
        row({
          id: "source.attachmentKey",
          label: "Snapshot attachment key",
          value: textValue(source.attachmentKey ?? null),
          tone: source.attachmentKey ? "info" : "muted",
        }),
        row({
          id: "source.snapshotStorageKey",
          label: "Snapshot storage key",
          value: textValue(source.snapshotStorageKey ?? null),
          tone: source.snapshotStorageKey ? "info" : "muted",
        }),
        row({
          id: "source.readModelStorageKey",
          label: "Read model storage key",
          value: textValue(source.readModelStorageKey ?? null),
          tone: source.readModelStorageKey ? "info" : "muted",
        }),
        row({
          id: "source.schemaVersion",
          label: "Schema version",
          value: textValue(source.schemaVersion ?? null),
          tone: "info",
        }),
        row({
          id: "source.producer",
          label: "Producer",
          value: textValue(source.producer ?? null),
          tone: "info",
        }),
      ],
    }),
  ];
}

function makeContract(args: {
  readModel: ExecutionLevelContextObservationReadModel;
  source?: ExecutionLevelContextUiContract["source"];
}): ExecutionLevelContextUiContract {
  const status = statusFromReadModel(args.readModel);
  const source = args.source ?? sourceFromReadModel(args.readModel);
  const sections = sectionsFromReadModel({
    readModel: args.readModel,
    status,
    source,
  });
  const contract: ExecutionLevelContextUiContract = {
    contractVersion: "execution_level_context_ui_contract_v1",
    factualOnly: true,
    status,
    statusReason: status === "unavailable" ? args.readModel.statusReason : null,
    source,
    identity: {
      symbol: args.readModel.identity.symbol,
      asOfTimestamp: args.readModel.identity.asOfTimestamp,
      referencePrice: args.readModel.identity.referencePrice,
    },
    sections,
    summary: {
      status,
      sectionCount: sections.length,
      diagnosticCount: args.readModel.diagnostics.count,
      limitationCount: args.readModel.limitations.count,
      qualityNoteCount: args.readModel.quality.warningCount,
      syntheticContinuationMapCount: args.readModel.synthetic.count,
      replaySafe: args.readModel.safety.noLookaheadApplied,
    },
  };

  assertExecutionLevelContextUiContractIsFactualOnly(contract);
  return contract;
}

export function buildExecutionLevelContextUiContract(
  readModel: ExecutionLevelContextObservationReadModel,
): BuildExecutionLevelContextUiContractResult {
  return {
    status: "built",
    contract: makeContract({ readModel }),
  };
}

export function buildExecutionLevelContextUiContractFromStorageRecord(
  record: ExecutionLevelContextReadModelStoredRecord,
): BuildExecutionLevelContextUiContractResult {
  if (record.storageStatus === "quarantined") {
    return buildUnavailableExecutionLevelContextUiContract("quarantined_storage_record");
  }

  return {
    status: "built",
    contract: makeContract({
      readModel: record.readModel,
      source: sourceFromStorageRecord(record),
    }),
  };
}

export function buildUnavailableExecutionLevelContextUiContract(
  reason: ExecutionAnalysisLevelContextUnavailableReason | "missing_context" | "quarantined_storage_record",
): BuildExecutionLevelContextUiContractResult {
  const source: ExecutionLevelContextUiContract["source"] = {};
  const sections = [
    section({
      id: "overview",
      title: "Level context overview",
      detail: "Factual level context is unavailable.",
      status: "unavailable",
      badges: [
        badge("status", "unavailable", "notice"),
        badge("factualOnly", "factual only", "neutral"),
      ],
      rows: [
        row({
          id: "reason",
          label: "Unavailable reason",
          value: textValue(reason),
          tone: "notice",
        }),
      ],
    }),
    section({
      id: "safety",
      title: "Safety",
      detail: "Safety state for unavailable context.",
      status: "unavailable",
      rows: [
        row({
          id: "safety.noLookaheadApplied",
          label: "No-lookahead applied",
          value: booleanValue(false),
          tone: "safety",
        }),
      ],
    }),
    section({
      id: "source",
      title: "Source",
      detail: "Source identifiers are not available.",
      status: "unavailable",
      rows: [
        row({
          id: "source.available",
          label: "Source available",
          value: booleanValue(false),
          tone: "muted",
        }),
      ],
    }),
  ];
  const contract: ExecutionLevelContextUiContract = {
    contractVersion: "execution_level_context_ui_contract_v1",
    factualOnly: true,
    status: "unavailable",
    statusReason: reason === "quarantined_storage_record" ? null : reason,
    source,
    identity: {
      symbol: null,
      asOfTimestamp: null,
      referencePrice: null,
    },
    sections,
    summary: {
      status: "unavailable",
      sectionCount: sections.length,
      diagnosticCount: 0,
      limitationCount: 0,
      qualityNoteCount: 0,
      syntheticContinuationMapCount: 0,
      replaySafe: false,
    },
  };

  assertExecutionLevelContextUiContractIsFactualOnly(contract);
  return { status: "built", contract };
}

export function summarizeExecutionLevelContextUiContract(
  contract: ExecutionLevelContextUiContract,
): ExecutionLevelContextUiContractSummary {
  return {
    status: contract.status,
    symbol: contract.identity.symbol,
    asOfTimestamp: contract.identity.asOfTimestamp,
    sectionIds: contract.sections.map((sectionItem) => sectionItem.id),
    diagnosticCount: contract.summary.diagnosticCount,
    limitationCount: contract.summary.limitationCount,
    qualityNoteCount: contract.summary.qualityNoteCount,
    syntheticContinuationMapCount: contract.summary.syntheticContinuationMapCount,
    replaySafe: contract.summary.replaySafe,
  };
}

export function assertExecutionLevelContextUiContractIsFactualOnly(
  contract: unknown,
): void {
  if (typeof contract === "object" && contract !== null && "sections" in contract) {
    const sections = (contract as { sections?: unknown }).sections;
    if (Array.isArray(sections)) {
      const prohibitedSections = sections
        .map((sectionItem) =>
          typeof sectionItem === "object" && sectionItem !== null && "id" in sectionItem
            ? String((sectionItem as { id?: unknown }).id)
            : "",
        )
        .filter((id) => PROHIBITED_SECTION_IDS.has(id));

      if (prohibitedSections.length > 0) {
        throw new Error(
          `Execution level context UI contract contains prohibited sections: ${prohibitedSections.join(", ")}.`,
        );
      }
    }
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
      `Execution level context UI contract must remain factual-only. Prohibited key count: ${prohibitedKeys.length}. Prohibited text count: ${prohibitedLanguageCount}.`,
    );
  }
}
