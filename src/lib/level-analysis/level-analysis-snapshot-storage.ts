import type {
  LevelAnalysisAdapterLimitation,
  LevelAnalysisAdapterValidationError,
  LevelAnalysisConnectorView,
  LevelAnalysisProducer,
  LevelAnalysisSnapshotSchemaVersion,
  LevelAnalysisSnapshotV1,
} from "./level-analysis-snapshot-contract";
import type {
  LevelAnalysisSnapshotAttachment,
  LevelAnalysisSnapshotAttachmentDiagnostics,
  LevelAnalysisSnapshotAttachmentSourceType,
  LevelAnalysisSnapshotOwnerReference,
  QuarantinedLevelAnalysisSnapshotAttachment,
} from "./level-analysis-snapshot-attachment";

export type LevelAnalysisSnapshotStorageStatus = "accepted" | "quarantined";

export type LevelAnalysisSnapshotStorageKey = string;

export type LevelAnalysisSnapshotStorageAuditEvent =
  | "created"
  | "stored"
  | "retrieved"
  | "quarantined"
  | "audit_appended";

export interface LevelAnalysisSnapshotStorageAuditEntry {
  event: LevelAnalysisSnapshotStorageAuditEvent;
  at: number;
  message: string;
  metadata?: Record<string, unknown>;
}

interface LevelAnalysisSnapshotStorageRecordBase {
  storageKey: LevelAnalysisSnapshotStorageKey;
  owner: LevelAnalysisSnapshotOwnerReference;
  ownerId?: string;
  ownerType?: string;
  symbol: string;
  asOfTimestamp: number;
  schemaVersion?: LevelAnalysisSnapshotSchemaVersion | string;
  producer?: LevelAnalysisProducer | string;
  sourceType: LevelAnalysisSnapshotAttachmentSourceType;
  validationStatus: LevelAnalysisSnapshotStorageStatus;
  diagnostics: LevelAnalysisSnapshotAttachmentDiagnostics;
  limitations: LevelAnalysisAdapterLimitation[];
  createdAt: number;
  updatedAt: number;
  version: number;
  auditTrail: LevelAnalysisSnapshotStorageAuditEntry[];
}

export interface LevelAnalysisSnapshotStorageRecord
  extends LevelAnalysisSnapshotStorageRecordBase {
  validationStatus: "accepted";
  schemaVersion: LevelAnalysisSnapshotSchemaVersion;
  producer: LevelAnalysisProducer;
  rawSnapshot: LevelAnalysisSnapshotV1;
  factualConnectorView: LevelAnalysisConnectorView;
  attachment: LevelAnalysisSnapshotAttachment;
}

export interface LevelAnalysisSnapshotStorageQuarantineRecord
  extends LevelAnalysisSnapshotStorageRecordBase {
  validationStatus: "quarantined";
  rawPayload?: unknown;
  attachment: QuarantinedLevelAnalysisSnapshotAttachment;
  quarantineReasons: LevelAnalysisAdapterValidationError[];
}

export type LevelAnalysisSnapshotStoredRecord =
  | LevelAnalysisSnapshotStorageRecord
  | LevelAnalysisSnapshotStorageQuarantineRecord;

export type LevelAnalysisSnapshotStorageIndex = LevelAnalysisSnapshotStoredRecord[];

export interface LevelAnalysisSnapshotRetrievalQuery {
  ownerId?: string;
  symbol?: string;
  asOfTimestamp?: number;
  status?: LevelAnalysisSnapshotStorageStatus;
  allowFuture?: boolean;
}

export type LevelAnalysisSnapshotRetrievalResult =
  | {
      status: "found";
      record: LevelAnalysisSnapshotStoredRecord;
    }
  | {
      status: "not_found";
      reason: string;
      query?: LevelAnalysisSnapshotRetrievalQuery;
    };

export interface CreateLevelAnalysisSnapshotStorageRecordInput {
  attachment: LevelAnalysisSnapshotAttachment;
  createdAt: number;
  updatedAt?: number;
  version?: number;
}

export interface CreateQuarantinedLevelAnalysisSnapshotStorageRecordInput {
  attachment: QuarantinedLevelAnalysisSnapshotAttachment;
  createdAt: number;
  updatedAt?: number;
  version?: number;
}

export interface DeriveLevelAnalysisSnapshotStorageKeyInput {
  ownerId?: string;
  symbol?: string;
  asOfTimestamp?: number;
  validationStatus?: LevelAnalysisSnapshotStorageStatus;
  sourceType?: LevelAnalysisSnapshotAttachmentSourceType;
}

function normalizeSymbol(symbol?: string): string {
  return symbol?.trim().toUpperCase() || "UNKNOWN";
}

function normalizeOwner(ownerId?: string): string {
  return ownerId?.trim() || "unowned";
}

function normalizeTimestamp(asOfTimestamp?: number): string {
  return Number.isFinite(asOfTimestamp) ? String(asOfTimestamp) : "0";
}

function finiteTimestamp(value: number | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function creationAuditEntry(args: {
  at: number;
  status: LevelAnalysisSnapshotStorageStatus;
}): LevelAnalysisSnapshotStorageAuditEntry {
  return {
    event: args.status === "accepted" ? "created" : "quarantined",
    at: args.at,
    message:
      args.status === "accepted"
        ? "LevelAnalysisSnapshot storage record created."
        : "LevelAnalysisSnapshot storage record quarantined.",
  };
}

function matchesOwner(record: LevelAnalysisSnapshotStoredRecord, ownerId?: string): boolean {
  return ownerId === undefined || record.ownerId === ownerId;
}

function matchesSymbol(record: LevelAnalysisSnapshotStoredRecord, symbol?: string): boolean {
  return symbol === undefined || record.symbol.toUpperCase() === symbol.trim().toUpperCase();
}

function matchesStatus(
  record: LevelAnalysisSnapshotStoredRecord,
  status?: LevelAnalysisSnapshotStorageStatus,
): boolean {
  return status === undefined || record.validationStatus === status;
}

function acceptedRecords(
  collection: LevelAnalysisSnapshotStorageIndex,
): LevelAnalysisSnapshotStorageRecord[] {
  return collection.filter(
    (record): record is LevelAnalysisSnapshotStorageRecord =>
      record.validationStatus === "accepted",
  );
}

export function deriveLevelAnalysisSnapshotStorageKey(
  input: DeriveLevelAnalysisSnapshotStorageKeyInput,
): LevelAnalysisSnapshotStorageKey {
  const sourceType = input.sourceType ?? "level-analysis-snapshot-v1";
  const status = input.validationStatus ?? "accepted";

  return [
    sourceType,
    status,
    normalizeOwner(input.ownerId),
    normalizeSymbol(input.symbol),
    normalizeTimestamp(input.asOfTimestamp),
  ].join(":");
}

export function createLevelAnalysisSnapshotStorageRecord(
  input: CreateLevelAnalysisSnapshotStorageRecordInput,
): LevelAnalysisSnapshotStorageRecord {
  const { attachment } = input;
  const updatedAt = input.updatedAt ?? input.createdAt;

  return {
    storageKey: deriveLevelAnalysisSnapshotStorageKey({
      ownerId: attachment.owner.ownerId,
      symbol: attachment.symbol,
      asOfTimestamp: attachment.asOfTimestamp,
      validationStatus: "accepted",
      sourceType: attachment.sourceType,
    }),
    owner: attachment.owner,
    ownerId: attachment.owner.ownerId,
    ownerType: attachment.owner.ownerType,
    symbol: attachment.symbol,
    asOfTimestamp: attachment.asOfTimestamp,
    schemaVersion: attachment.schemaVersion,
    producer: attachment.producer,
    sourceType: attachment.sourceType,
    validationStatus: "accepted",
    rawSnapshot: attachment.rawSnapshot,
    factualConnectorView: attachment.connectorView,
    attachment,
    diagnostics: attachment.diagnostics,
    limitations: attachment.limitations,
    createdAt: input.createdAt,
    updatedAt,
    version: input.version ?? 1,
    auditTrail: [creationAuditEntry({ at: input.createdAt, status: "accepted" })],
  };
}

export function createQuarantinedLevelAnalysisSnapshotStorageRecord(
  input: CreateQuarantinedLevelAnalysisSnapshotStorageRecordInput,
): LevelAnalysisSnapshotStorageQuarantineRecord {
  const { attachment } = input;
  const updatedAt = input.updatedAt ?? input.createdAt;

  return {
    storageKey: deriveLevelAnalysisSnapshotStorageKey({
      ownerId: attachment.owner.ownerId,
      symbol: attachment.symbol,
      asOfTimestamp: attachment.asOfTimestamp,
      validationStatus: "quarantined",
      sourceType: attachment.sourceType,
    }),
    owner: attachment.owner,
    ownerId: attachment.owner.ownerId,
    ownerType: attachment.owner.ownerType,
    symbol: normalizeSymbol(attachment.symbol),
    asOfTimestamp: finiteTimestamp(attachment.asOfTimestamp) ?? 0,
    schemaVersion: attachment.schemaVersion,
    producer: attachment.producer,
    sourceType: attachment.sourceType,
    validationStatus: "quarantined",
    rawPayload: attachment.rawPayload,
    attachment,
    quarantineReasons: attachment.diagnostics.validationErrors,
    diagnostics: attachment.diagnostics,
    limitations: attachment.limitations,
    createdAt: input.createdAt,
    updatedAt,
    version: input.version ?? 1,
    auditTrail: [creationAuditEntry({ at: input.createdAt, status: "quarantined" })],
  };
}

export function storeLevelAnalysisSnapshotRecord(
  collection: LevelAnalysisSnapshotStorageIndex,
  record: LevelAnalysisSnapshotStoredRecord,
): LevelAnalysisSnapshotStorageIndex {
  const duplicateIndex = collection.findIndex(
    (item) => item.storageKey === record.storageKey,
  );

  if (duplicateIndex === -1) {
    return [...collection, record];
  }

  return collection.map((item, index) => (index === duplicateIndex ? record : item));
}

export function retrieveLevelAnalysisSnapshotByKey(
  collection: LevelAnalysisSnapshotStorageIndex,
  key: LevelAnalysisSnapshotStorageKey,
): LevelAnalysisSnapshotRetrievalResult {
  const record = collection.find((item) => item.storageKey === key);

  if (!record) {
    return {
      status: "not_found",
      reason: "No LevelAnalysisSnapshot storage record exists for the provided key.",
    };
  }

  return { status: "found", record };
}

export function retrieveLevelAnalysisSnapshotsForOwner(
  collection: LevelAnalysisSnapshotStorageIndex,
  ownerId: string,
): LevelAnalysisSnapshotStoredRecord[] {
  return collection.filter((record) => record.ownerId === ownerId);
}

export function retrieveLevelAnalysisSnapshotsForSymbol(
  collection: LevelAnalysisSnapshotStorageIndex,
  symbol: string,
): LevelAnalysisSnapshotStoredRecord[] {
  return collection.filter((record) => matchesSymbol(record, symbol));
}

export function retrieveLatestLevelAnalysisSnapshotForOwnerSymbol(
  collection: LevelAnalysisSnapshotStorageIndex,
  ownerId: string,
  symbol: string,
): LevelAnalysisSnapshotRetrievalResult {
  const candidates = acceptedRecords(collection)
    .filter((record) => matchesOwner(record, ownerId) && matchesSymbol(record, symbol))
    .sort((left, right) => right.asOfTimestamp - left.asOfTimestamp);

  const record = candidates[0];
  if (!record) {
    return {
      status: "not_found",
      reason: "No accepted LevelAnalysisSnapshot storage record exists for owner and symbol.",
      query: { ownerId, symbol, status: "accepted" },
    };
  }

  return { status: "found", record };
}

export function retrieveNearestAsOfLevelAnalysisSnapshot(
  collection: LevelAnalysisSnapshotStorageIndex,
  query: LevelAnalysisSnapshotRetrievalQuery,
): LevelAnalysisSnapshotRetrievalResult {
  const target = finiteTimestamp(query.asOfTimestamp);

  if (target === null) {
    return {
      status: "not_found",
      reason: "A finite asOfTimestamp is required for nearest-as-of retrieval.",
      query,
    };
  }

  const status = query.status ?? "accepted";
  const candidates = collection
    .filter((record) => matchesOwner(record, query.ownerId))
    .filter((record) => matchesSymbol(record, query.symbol))
    .filter((record) => matchesStatus(record, status))
    .filter((record) => query.allowFuture === true || record.asOfTimestamp <= target);

  const sorted = [...candidates].sort((left, right) => {
    const leftDistance = Math.abs(left.asOfTimestamp - target);
    const rightDistance = Math.abs(right.asOfTimestamp - target);

    if (leftDistance !== rightDistance) {
      return leftDistance - rightDistance;
    }

    return right.asOfTimestamp - left.asOfTimestamp;
  });

  const record = sorted[0];
  if (!record) {
    return {
      status: "not_found",
      reason: "No LevelAnalysisSnapshot storage record matches the as-of query.",
      query: { ...query, status },
    };
  }

  return { status: "found", record };
}

export function listQuarantinedLevelAnalysisSnapshots(
  collection: LevelAnalysisSnapshotStorageIndex,
): LevelAnalysisSnapshotStorageQuarantineRecord[] {
  return collection.filter(
    (record): record is LevelAnalysisSnapshotStorageQuarantineRecord =>
      record.validationStatus === "quarantined",
  );
}

export function appendLevelAnalysisSnapshotStorageAuditEntry<
  TRecord extends LevelAnalysisSnapshotStoredRecord,
>(
  record: TRecord,
  entry: LevelAnalysisSnapshotStorageAuditEntry,
): TRecord {
  return {
    ...record,
    updatedAt: entry.at,
    auditTrail: [...record.auditTrail, entry],
  };
}
