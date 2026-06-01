import {
  assertExecutionLevelContextObservationReadModelIsFactualOnly,
  type ExecutionLevelContextObservationReadModel,
  type ExecutionLevelContextObservationReadModelStatus,
} from "./execution-level-context-observation-read-model";

export const EXECUTION_LEVEL_CONTEXT_READ_MODEL_SOURCE_TYPE =
  "execution-level-context-observation-read-model/v1" as const;

export type ExecutionLevelContextReadModelStorageKey = string;

export type ExecutionLevelContextReadModelStorageStatus =
  | "accepted"
  | "limited"
  | "unavailable"
  | "not_replay_safe"
  | "quarantined";

export type ExecutionLevelContextReadModelAuditEvent =
  | "created"
  | "stored"
  | "retrieved"
  | "quarantined"
  | "audit_appended";

export interface ExecutionLevelContextReadModelOwnerReference {
  ownerId?: string;
  ownerType?: string;
}

export interface ExecutionLevelContextReadModelStorageAuditEntry {
  event: ExecutionLevelContextReadModelAuditEvent;
  at: number;
  message: string;
  metadata?: Record<string, unknown>;
}

export interface ExecutionLevelContextReadModelQuarantineReason {
  code:
    | "invalid_payload"
    | "missing_required_field"
    | "unsupported_contract"
    | "not_factual_only";
  field?: string;
  message: string;
}

interface ExecutionLevelContextReadModelStorageRecordBase {
  storageKey: ExecutionLevelContextReadModelStorageKey;
  owner: ExecutionLevelContextReadModelOwnerReference;
  ownerId?: string;
  ownerType?: string;
  sourceSnapshotAttachmentKey?: string;
  sourceSnapshotStorageKey?: string;
  symbol: string;
  asOfTimestamp: number;
  schemaVersion?: string;
  producer?: string;
  sourceType: typeof EXECUTION_LEVEL_CONTEXT_READ_MODEL_SOURCE_TYPE;
  storageStatus: ExecutionLevelContextReadModelStorageStatus;
  sourceContextIdentity: {
    attachmentKey?: string;
    storageKey?: string;
    schemaVersion?: string;
    producer?: string;
  };
  diagnostics: ExecutionLevelContextObservationReadModel["diagnostics"] | null;
  limitations: ExecutionLevelContextObservationReadModel["limitations"] | null;
  safetySummary: ExecutionLevelContextObservationReadModel["safety"] | null;
  createdAt: number;
  updatedAt: number;
  version: number;
  auditTrail: ExecutionLevelContextReadModelStorageAuditEntry[];
}

export interface ExecutionLevelContextReadModelStorageRecord
  extends ExecutionLevelContextReadModelStorageRecordBase {
  storageStatus: Exclude<ExecutionLevelContextReadModelStorageStatus, "quarantined">;
  readModel: ExecutionLevelContextObservationReadModel;
}

export interface ExecutionLevelContextReadModelQuarantineRecord
  extends ExecutionLevelContextReadModelStorageRecordBase {
  storageStatus: "quarantined";
  rawPayload: unknown;
  quarantineReasons: ExecutionLevelContextReadModelQuarantineReason[];
}

export type ExecutionLevelContextReadModelStoredRecord =
  | ExecutionLevelContextReadModelStorageRecord
  | ExecutionLevelContextReadModelQuarantineRecord;

export type ExecutionLevelContextReadModelStorageIndex =
  ExecutionLevelContextReadModelStoredRecord[];

export interface ExecutionLevelContextReadModelRetrievalQuery {
  ownerId?: string;
  symbol?: string;
  asOfTimestamp?: number;
  status?: ExecutionLevelContextReadModelStorageStatus;
  allowFuture?: boolean;
}

export type ExecutionLevelContextReadModelRetrievalResult =
  | {
      status: "found";
      record: ExecutionLevelContextReadModelStoredRecord;
    }
  | {
      status: "not_found";
      reason: string;
      query?: ExecutionLevelContextReadModelRetrievalQuery;
    };

export interface CreateExecutionLevelContextReadModelStorageRecordInput {
  readModel: ExecutionLevelContextObservationReadModel;
  owner?: ExecutionLevelContextReadModelOwnerReference;
  createdAt: number;
  updatedAt?: number;
  version?: number;
}

export interface CreateQuarantinedExecutionLevelContextReadModelStorageRecordInput {
  rawPayload: unknown;
  quarantineReasons: ExecutionLevelContextReadModelQuarantineReason[];
  owner?: ExecutionLevelContextReadModelOwnerReference;
  symbol?: string | null;
  asOfTimestamp?: number | null;
  schemaVersion?: string;
  producer?: string;
  createdAt: number;
  updatedAt?: number;
  version?: number;
}

export interface DeriveExecutionLevelContextReadModelStorageKeyInput {
  ownerId?: string;
  symbol?: string | null;
  asOfTimestamp?: number | null;
  storageStatus?: ExecutionLevelContextReadModelStorageStatus;
  sourceType?: typeof EXECUTION_LEVEL_CONTEXT_READ_MODEL_SOURCE_TYPE;
}

function normalizeOwner(ownerId?: string): string {
  return ownerId?.trim() || "unowned";
}

function normalizeSymbol(symbol?: string | null): string {
  return symbol?.trim().toUpperCase() || "UNKNOWN";
}

function finiteTimestamp(value: number | null | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function normalizeTimestamp(asOfTimestamp?: number | null): string {
  const timestamp = finiteTimestamp(asOfTimestamp);
  return timestamp === null ? "0" : String(timestamp);
}

function storageStatusFromReadModel(
  status: ExecutionLevelContextObservationReadModelStatus,
): Exclude<ExecutionLevelContextReadModelStorageStatus, "quarantined"> {
  if (status === "available") {
    return "accepted";
  }

  return status;
}

function creationAuditEntry(args: {
  at: number;
  status: ExecutionLevelContextReadModelStorageStatus;
}): ExecutionLevelContextReadModelStorageAuditEntry {
  return {
    event: args.status === "quarantined" ? "quarantined" : "created",
    at: args.at,
    message:
      args.status === "quarantined"
        ? "Execution level context read model storage record quarantined."
        : "Execution level context read model storage record created.",
  };
}

function readStringPath(value: unknown, path: string[]): string | undefined {
  let cursor = value;

  for (const segment of path) {
    if (typeof cursor !== "object" || cursor === null || !(segment in cursor)) {
      return undefined;
    }

    cursor = (cursor as Record<string, unknown>)[segment];
  }

  return typeof cursor === "string" ? cursor : undefined;
}

function readNumberPath(value: unknown, path: string[]): number | undefined {
  let cursor = value;

  for (const segment of path) {
    if (typeof cursor !== "object" || cursor === null || !(segment in cursor)) {
      return undefined;
    }

    cursor = (cursor as Record<string, unknown>)[segment];
  }

  return typeof cursor === "number" && Number.isFinite(cursor) ? cursor : undefined;
}

function sourceContextIdentity(readModel: ExecutionLevelContextObservationReadModel): {
  attachmentKey?: string;
  storageKey?: string;
  schemaVersion?: string;
  producer?: string;
} {
  return {
    attachmentKey: readModel.source.attachmentKey,
    storageKey: readModel.source.storageKey,
    schemaVersion: readModel.source.schemaVersion,
    producer: readModel.source.producer,
  };
}

function matchesOwner(
  record: ExecutionLevelContextReadModelStoredRecord,
  ownerId?: string,
): boolean {
  return ownerId === undefined || record.ownerId === ownerId;
}

function matchesSymbol(
  record: ExecutionLevelContextReadModelStoredRecord,
  symbol?: string,
): boolean {
  return symbol === undefined || record.symbol.toUpperCase() === symbol.trim().toUpperCase();
}

function matchesStatus(
  record: ExecutionLevelContextReadModelStoredRecord,
  status?: ExecutionLevelContextReadModelStorageStatus,
): boolean {
  return status === undefined || record.storageStatus === status;
}

function acceptedRecords(
  collection: ExecutionLevelContextReadModelStorageIndex,
): ExecutionLevelContextReadModelStorageRecord[] {
  return collection.filter(
    (record): record is ExecutionLevelContextReadModelStorageRecord =>
      record.storageStatus === "accepted",
  );
}

export function deriveExecutionLevelContextReadModelStorageKey(
  input: DeriveExecutionLevelContextReadModelStorageKeyInput,
): ExecutionLevelContextReadModelStorageKey {
  const sourceType = input.sourceType ?? EXECUTION_LEVEL_CONTEXT_READ_MODEL_SOURCE_TYPE;
  const status = input.storageStatus ?? "accepted";

  return [
    sourceType,
    status,
    normalizeOwner(input.ownerId),
    normalizeSymbol(input.symbol),
    normalizeTimestamp(input.asOfTimestamp),
  ].join(":");
}

export function createExecutionLevelContextReadModelStorageRecord(
  input: CreateExecutionLevelContextReadModelStorageRecordInput,
): ExecutionLevelContextReadModelStorageRecord {
  const { readModel } = input;
  assertExecutionLevelContextObservationReadModelIsFactualOnly(readModel);

  const storageStatus = storageStatusFromReadModel(readModel.status);
  const owner = input.owner ?? {};
  const updatedAt = input.updatedAt ?? input.createdAt;
  const source = sourceContextIdentity(readModel);
  const symbol = normalizeSymbol(readModel.identity.symbol);
  const asOfTimestamp = finiteTimestamp(readModel.identity.asOfTimestamp) ?? 0;

  return {
    storageKey: deriveExecutionLevelContextReadModelStorageKey({
      ownerId: owner.ownerId,
      symbol,
      asOfTimestamp,
      storageStatus,
    }),
    owner,
    ownerId: owner.ownerId,
    ownerType: owner.ownerType,
    sourceSnapshotAttachmentKey: source.attachmentKey,
    sourceSnapshotStorageKey: source.storageKey,
    symbol,
    asOfTimestamp,
    schemaVersion: source.schemaVersion,
    producer: source.producer,
    sourceType: EXECUTION_LEVEL_CONTEXT_READ_MODEL_SOURCE_TYPE,
    storageStatus,
    sourceContextIdentity: source,
    readModel,
    diagnostics: readModel.diagnostics,
    limitations: readModel.limitations,
    safetySummary: readModel.safety,
    createdAt: input.createdAt,
    updatedAt,
    version: input.version ?? 1,
    auditTrail: [creationAuditEntry({ at: input.createdAt, status: storageStatus })],
  };
}

export function createQuarantinedExecutionLevelContextReadModelStorageRecord(
  input: CreateQuarantinedExecutionLevelContextReadModelStorageRecordInput,
): ExecutionLevelContextReadModelQuarantineRecord {
  const owner = input.owner ?? {};
  const updatedAt = input.updatedAt ?? input.createdAt;
  const symbol =
    input.symbol ??
    readStringPath(input.rawPayload, ["identity", "symbol"]) ??
    readStringPath(input.rawPayload, ["symbol"]);
  const asOfTimestamp =
    input.asOfTimestamp ??
    readNumberPath(input.rawPayload, ["identity", "asOfTimestamp"]) ??
    readNumberPath(input.rawPayload, ["asOfTimestamp"]);
  const schemaVersion =
    input.schemaVersion ?? readStringPath(input.rawPayload, ["source", "schemaVersion"]);
  const producer =
    input.producer ?? readStringPath(input.rawPayload, ["source", "producer"]);

  return {
    storageKey: deriveExecutionLevelContextReadModelStorageKey({
      ownerId: owner.ownerId,
      symbol,
      asOfTimestamp,
      storageStatus: "quarantined",
    }),
    owner,
    ownerId: owner.ownerId,
    ownerType: owner.ownerType,
    symbol: normalizeSymbol(symbol),
    asOfTimestamp: finiteTimestamp(asOfTimestamp) ?? 0,
    schemaVersion,
    producer,
    sourceType: EXECUTION_LEVEL_CONTEXT_READ_MODEL_SOURCE_TYPE,
    storageStatus: "quarantined",
    sourceContextIdentity: {
      schemaVersion,
      producer,
    },
    diagnostics: null,
    limitations: null,
    safetySummary: null,
    rawPayload: input.rawPayload,
    quarantineReasons: input.quarantineReasons,
    createdAt: input.createdAt,
    updatedAt,
    version: input.version ?? 1,
    auditTrail: [creationAuditEntry({ at: input.createdAt, status: "quarantined" })],
  };
}

export function storeExecutionLevelContextReadModelRecord(
  collection: ExecutionLevelContextReadModelStorageIndex,
  record: ExecutionLevelContextReadModelStoredRecord,
): ExecutionLevelContextReadModelStorageIndex {
  const duplicateIndex = collection.findIndex(
    (item) => item.storageKey === record.storageKey,
  );

  if (duplicateIndex === -1) {
    return [...collection, record];
  }

  return collection.map((item, index) => (index === duplicateIndex ? record : item));
}

export function retrieveExecutionLevelContextReadModelByKey(
  collection: ExecutionLevelContextReadModelStorageIndex,
  key: ExecutionLevelContextReadModelStorageKey,
): ExecutionLevelContextReadModelRetrievalResult {
  const record = collection.find((item) => item.storageKey === key);

  if (!record) {
    return {
      status: "not_found",
      reason:
        "No execution level context read model storage record exists for the provided key.",
    };
  }

  return { status: "found", record };
}

export function retrieveExecutionLevelContextReadModelsForOwner(
  collection: ExecutionLevelContextReadModelStorageIndex,
  ownerId: string,
): ExecutionLevelContextReadModelStoredRecord[] {
  return collection.filter((record) => record.ownerId === ownerId);
}

export function retrieveExecutionLevelContextReadModelsForSymbol(
  collection: ExecutionLevelContextReadModelStorageIndex,
  symbol: string,
): ExecutionLevelContextReadModelStoredRecord[] {
  return collection.filter((record) => matchesSymbol(record, symbol));
}

export function retrieveLatestExecutionLevelContextReadModelForOwnerSymbol(
  collection: ExecutionLevelContextReadModelStorageIndex,
  ownerId: string,
  symbol: string,
): ExecutionLevelContextReadModelRetrievalResult {
  const candidates = acceptedRecords(collection)
    .filter((record) => matchesOwner(record, ownerId) && matchesSymbol(record, symbol))
    .sort((left, right) => right.asOfTimestamp - left.asOfTimestamp);

  const record = candidates[0];
  if (!record) {
    return {
      status: "not_found",
      reason:
        "No accepted execution level context read model storage record exists for owner and symbol.",
      query: { ownerId, symbol, status: "accepted" },
    };
  }

  return { status: "found", record };
}

export function retrieveNearestAsOfExecutionLevelContextReadModel(
  collection: ExecutionLevelContextReadModelStorageIndex,
  query: ExecutionLevelContextReadModelRetrievalQuery,
): ExecutionLevelContextReadModelRetrievalResult {
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
      reason:
        "No execution level context read model storage record matches the as-of query.",
      query: { ...query, status },
    };
  }

  return { status: "found", record };
}

export function listQuarantinedExecutionLevelContextReadModels(
  collection: ExecutionLevelContextReadModelStorageIndex,
): ExecutionLevelContextReadModelQuarantineRecord[] {
  return collection.filter(
    (record): record is ExecutionLevelContextReadModelQuarantineRecord =>
      record.storageStatus === "quarantined",
  );
}

export function appendExecutionLevelContextReadModelAuditEntry<
  TRecord extends ExecutionLevelContextReadModelStoredRecord,
>(
  record: TRecord,
  entry: ExecutionLevelContextReadModelStorageAuditEntry,
): TRecord {
  return {
    ...record,
    updatedAt: entry.at,
    auditTrail: [...record.auditTrail, entry],
  };
}
