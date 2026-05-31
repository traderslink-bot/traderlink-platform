import {
  loadLevelAnalysisSnapshotForJournal,
  validateLevelAnalysisSnapshotV1,
} from "./level-analysis-snapshot-adapter";
import type {
  LevelAnalysisAdapterLimitation,
  LevelAnalysisAdapterResult,
  LevelAnalysisAdapterValidationError,
  LevelAnalysisConnectorView,
  LevelAnalysisProducer,
  LevelAnalysisSnapshotSchemaVersion,
  LevelAnalysisSnapshotV1,
} from "./level-analysis-snapshot-contract";

export type LevelAnalysisSnapshotAttachmentSourceType =
  "level-analysis-snapshot-v1";

export type LevelAnalysisSnapshotAttachmentValidationStatus =
  | "accepted"
  | "quarantined";

export interface LevelAnalysisSnapshotOwnerReference {
  ownerId?: string;
  ownerType?: "trade" | "session" | string;
}

export interface LevelAnalysisSnapshotAttachmentDiagnostics {
  snapshotDiagnosticsCount: number;
  qualityDiagnosticsCount: number;
  validationErrors: LevelAnalysisAdapterValidationError[];
}

export interface LevelAnalysisSnapshotAttachment {
  attachmentKey: string;
  owner: LevelAnalysisSnapshotOwnerReference;
  symbol: string;
  asOfTimestamp: number;
  sourceType: LevelAnalysisSnapshotAttachmentSourceType;
  validationStatus: "accepted";
  rawSnapshot: LevelAnalysisSnapshotV1;
  connectorView: LevelAnalysisConnectorView;
  limitations: LevelAnalysisAdapterLimitation[];
  diagnostics: LevelAnalysisSnapshotAttachmentDiagnostics;
  attachedAt: number;
  schemaVersion: LevelAnalysisSnapshotSchemaVersion;
  producer: LevelAnalysisProducer;
}

export interface QuarantinedLevelAnalysisSnapshotAttachment {
  attachmentKey: string;
  owner: LevelAnalysisSnapshotOwnerReference;
  sourceType: LevelAnalysisSnapshotAttachmentSourceType;
  validationStatus: "quarantined";
  rawPayload?: unknown;
  limitations: LevelAnalysisAdapterLimitation[];
  diagnostics: LevelAnalysisSnapshotAttachmentDiagnostics;
  attachedAt: number;
  schemaVersion?: string;
  producer?: string;
  symbol?: string;
  asOfTimestamp?: number;
}

export type CreateLevelAnalysisSnapshotAttachmentResult =
  | {
      status: "attached";
      attachment: LevelAnalysisSnapshotAttachment;
      adapterResult: Extract<LevelAnalysisAdapterResult, { status: "accepted" }>;
    }
  | {
      status: "quarantined";
      attachment: QuarantinedLevelAnalysisSnapshotAttachment;
      adapterResult: Extract<LevelAnalysisAdapterResult, { status: "quarantined" }>;
    };

export interface CreateLevelAnalysisSnapshotAttachmentInput {
  owner?: LevelAnalysisSnapshotOwnerReference;
  rawJson?: string;
  adapterResult?: LevelAnalysisAdapterResult;
  requireReplaySafe?: boolean;
  attachedAt: number;
}

export type LevelAnalysisSnapshotAttachableContext = Record<string, unknown> & {
  levelAnalysisSnapshots?: LevelAnalysisSnapshotAttachment[];
};

export function deriveLevelAnalysisSnapshotAttachmentKey(
  symbol: string,
  asOfTimestamp: number,
  ownerId?: string,
): string {
  const normalizedSymbol = symbol.trim().toUpperCase() || "UNKNOWN";
  const normalizedOwner = ownerId?.trim() || "unowned";

  return [
    "level-analysis-snapshot-v1",
    normalizedOwner,
    normalizedSymbol,
    String(asOfTimestamp),
  ].join(":");
}

function deriveQuarantineAttachmentKey(
  owner: LevelAnalysisSnapshotOwnerReference,
  payload: unknown,
): string {
  const record = typeof payload === "object" && payload !== null
    ? payload as Record<string, unknown>
    : {};
  const symbol = typeof record.symbol === "string" ? record.symbol : "UNKNOWN";
  const asOfTimestamp = typeof record.asOfTimestamp === "number"
    ? record.asOfTimestamp
    : 0;

  return deriveLevelAnalysisSnapshotAttachmentKey(
    symbol,
    asOfTimestamp,
    owner.ownerId,
  );
}

function getQualityDiagnosticsCount(snapshot: LevelAnalysisSnapshotV1): number {
  const diagnostics = snapshot.levelQualityAudit.diagnostics;

  return Array.isArray(diagnostics) ? diagnostics.length : 0;
}

function buildAcceptedAttachment(args: {
  owner: LevelAnalysisSnapshotOwnerReference;
  attachedAt: number;
  adapterResult: Extract<LevelAnalysisAdapterResult, { status: "accepted" }>;
}): LevelAnalysisSnapshotAttachment {
  const snapshot = args.adapterResult.snapshot;

  return {
    attachmentKey: deriveLevelAnalysisSnapshotAttachmentKey(
      snapshot.symbol,
      snapshot.asOfTimestamp,
      args.owner.ownerId,
    ),
    owner: args.owner,
    symbol: snapshot.symbol,
    asOfTimestamp: snapshot.asOfTimestamp,
    sourceType: "level-analysis-snapshot-v1",
    validationStatus: "accepted",
    rawSnapshot: snapshot,
    connectorView: args.adapterResult.view,
    limitations: args.adapterResult.limitations,
    diagnostics: {
      snapshotDiagnosticsCount: snapshot.diagnostics.length,
      qualityDiagnosticsCount: getQualityDiagnosticsCount(snapshot),
      validationErrors: [],
    },
    attachedAt: args.attachedAt,
    schemaVersion: snapshot.schemaVersion,
    producer: snapshot.producer,
  };
}

function buildQuarantinedAttachment(args: {
  owner: LevelAnalysisSnapshotOwnerReference;
  attachedAt: number;
  adapterResult: Extract<LevelAnalysisAdapterResult, { status: "quarantined" }>;
}): QuarantinedLevelAnalysisSnapshotAttachment {
  const payload = args.adapterResult.sourceSnapshot;
  const record = typeof payload === "object" && payload !== null
    ? payload as Record<string, unknown>
    : {};

  return {
    attachmentKey: deriveQuarantineAttachmentKey(args.owner, payload),
    owner: args.owner,
    sourceType: "level-analysis-snapshot-v1",
    validationStatus: "quarantined",
    rawPayload: payload,
    limitations: args.adapterResult.limitations,
    diagnostics: {
      snapshotDiagnosticsCount: 0,
      qualityDiagnosticsCount: 0,
      validationErrors: args.adapterResult.errors,
    },
    attachedAt: args.attachedAt,
    schemaVersion: typeof record.schemaVersion === "string"
      ? record.schemaVersion
      : undefined,
    producer: typeof record.producer === "string" ? record.producer : undefined,
    symbol: typeof record.symbol === "string" ? record.symbol : undefined,
    asOfTimestamp: typeof record.asOfTimestamp === "number"
      ? record.asOfTimestamp
      : undefined,
  };
}

function resolveAdapterResult(
  input: CreateLevelAnalysisSnapshotAttachmentInput,
): LevelAnalysisAdapterResult {
  if (input.adapterResult) {
    return input.adapterResult;
  }

  if (input.rawJson !== undefined) {
    try {
      return input.requireReplaySafe === false
        ? validateLevelAnalysisSnapshotV1(JSON.parse(input.rawJson), {
            requireReplaySafe: false,
          })
        : loadLevelAnalysisSnapshotForJournal(input.rawJson);
    } catch (error) {
      return {
        status: "quarantined",
        errors: [
          {
            code: "invalid_json",
            field: "$",
            message: error instanceof Error
              ? error.message
              : "Invalid LevelAnalysisSnapshot JSON.",
          },
        ],
        limitations: [],
      };
    }
  }

  return {
    status: "quarantined",
    errors: [
      {
        code: "payload_not_object",
        field: "$",
        message: "A raw JSON snapshot or adapter result is required.",
      },
    ],
    limitations: [],
  };
}

export function createLevelAnalysisSnapshotAttachment(
  input: CreateLevelAnalysisSnapshotAttachmentInput,
): CreateLevelAnalysisSnapshotAttachmentResult {
  const owner = input.owner ?? {};
  const adapterResult = resolveAdapterResult(input);

  if (adapterResult.status === "accepted") {
    return {
      status: "attached",
      adapterResult,
      attachment: buildAcceptedAttachment({
        owner,
        attachedAt: input.attachedAt,
        adapterResult,
      }),
    };
  }

  return {
    status: "quarantined",
    adapterResult,
    attachment: buildQuarantinedAttachment({
      owner,
      attachedAt: input.attachedAt,
      adapterResult,
    }),
  };
}

export function validateLevelAnalysisSnapshotAttachment(
  attachment: LevelAnalysisSnapshotAttachment | QuarantinedLevelAnalysisSnapshotAttachment,
): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!attachment.attachmentKey) {
    errors.push("attachmentKey is required.");
  }
  if (attachment.sourceType !== "level-analysis-snapshot-v1") {
    errors.push("sourceType must be level-analysis-snapshot-v1.");
  }
  if (!Number.isFinite(attachment.attachedAt)) {
    errors.push("attachedAt must be a finite timestamp.");
  }

  if (attachment.validationStatus === "accepted") {
    if (attachment.schemaVersion !== attachment.rawSnapshot.schemaVersion) {
      errors.push("schemaVersion must match the raw snapshot.");
    }
    if (attachment.producer !== "levels-system") {
      errors.push("producer must be levels-system.");
    }
    if (attachment.connectorView.identity.symbol !== attachment.symbol) {
      errors.push("connector view symbol must match attachment symbol.");
    }
  } else if (attachment.validationStatus === "quarantined") {
    if (attachment.diagnostics.validationErrors.length === 0) {
      errors.push("quarantined attachments require validation errors.");
    }
  } else {
    errors.push("validationStatus must be accepted or quarantined.");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function attachLevelAnalysisSnapshotToTradeContext<
  TContext extends Record<string, unknown>,
>(input: {
  tradeContext: TContext;
  attachment: LevelAnalysisSnapshotAttachment;
}): TContext & { levelAnalysisSnapshots: LevelAnalysisSnapshotAttachment[] } {
  const existing = Array.isArray(
    (input.tradeContext as LevelAnalysisSnapshotAttachableContext).levelAnalysisSnapshots,
  )
    ? (input.tradeContext as LevelAnalysisSnapshotAttachableContext).levelAnalysisSnapshots ?? []
    : [];

  return {
    ...input.tradeContext,
    levelAnalysisSnapshots: [...existing, input.attachment],
  };
}

export function getAttachedLevelAnalysisSnapshotContext(
  tradeContext: LevelAnalysisSnapshotAttachableContext,
  attachmentKey?: string,
): LevelAnalysisSnapshotAttachment | null {
  const attachments = tradeContext.levelAnalysisSnapshots ?? [];

  if (attachmentKey) {
    return attachments.find((attachment) => attachment.attachmentKey === attachmentKey) ?? null;
  }

  return attachments[attachments.length - 1] ?? null;
}
