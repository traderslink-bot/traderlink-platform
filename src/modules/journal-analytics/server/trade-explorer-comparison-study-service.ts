import { createHash, randomUUID } from "node:crypto";

import {
  TRADE_EXPLORER_COMPARISON_STUDY_VERSION,
  type TradeExplorerComparisonStudyPayload,
  type TradeExplorerComparisonStudyRecord,
} from "@/src/modules/journal-analytics/contracts/trade-explorer-comparison-study";
import type { AccountScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import {
  createCanonicalUtcTimestamp,
  platformFailure,
} from "@/src/modules/platform/server/database/platform-migration-contract";

import { TradeExplorerComparisonStudyRepository } from "./trade-explorer-comparison-study-repository";

const ACTIVE_STUDY_LIMIT = 50;

function normalizedName(value: unknown): string {
  if (typeof value !== "string") {
    platformFailure("TRADERLINK_TRADE_EXPLORER_STUDY_INVALID", { field: "name" });
  }
  const name = value.trim().replace(/\s+/gu, " ");
  if (name.length < 1 || name.length > 80 || /[\u0000-\u001f\u007f]/u.test(name)) {
    platformFailure("TRADERLINK_TRADE_EXPLORER_STUDY_INVALID", { field: "name" });
  }
  return name;
}

function positiveRevision(value: unknown): number {
  if (!Number.isSafeInteger(value) || (value as number) < 1) {
    platformFailure("TRADERLINK_TRADE_EXPLORER_STUDY_INVALID", {
      field: "expectedRevision",
    });
  }
  return value as number;
}

function uuid(value: unknown, field: string): string {
  if (typeof value !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u.test(value)) {
    platformFailure("TRADERLINK_TRADE_EXPLORER_STUDY_INVALID", { field });
  }
  return value;
}

function validatedPayload(
  payload: TradeExplorerComparisonStudyPayload,
): TradeExplorerComparisonStudyPayload {
  if (payload.studyVersion !== TRADE_EXPLORER_COMPARISON_STUDY_VERSION ||
      payload.normalizedStudyJson.length < 2 ||
      payload.normalizedStudyJson.length > 131_072) {
    platformFailure("TRADERLINK_TRADE_EXPLORER_STUDY_INVALID", { field: "study" });
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(payload.normalizedStudyJson);
  } catch {
    platformFailure("TRADERLINK_TRADE_EXPLORER_STUDY_INVALID", { field: "study" });
  }
  if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") {
    platformFailure("TRADERLINK_TRADE_EXPLORER_STUDY_INVALID", { field: "study" });
  }
  const digest = createHash("sha256")
    .update(payload.normalizedStudyJson, "utf8")
    .digest("hex");
  if (digest !== payload.studySha256) {
    platformFailure("TRADERLINK_TRADE_EXPLORER_STUDY_INVALID", {
      field: "studyDigest",
    });
  }
  return Object.freeze({ ...payload });
}

export class TradeExplorerComparisonStudyService {
  constructor(
    private readonly repository: TradeExplorerComparisonStudyRepository,
    private readonly dependencies: Readonly<{
      createId: () => string;
      now: () => Date;
    }> = Object.freeze({ createId: randomUUID, now: () => new Date() }),
  ) {}

  list(scope: AccountScope): readonly TradeExplorerComparisonStudyRecord[] {
    return Object.freeze(this.repository.listActive(scope).map((record) => {
      validatedPayload(record);
      return record;
    }));
  }

  create(scope: AccountScope, input: Readonly<{
    name: unknown;
    payload: TradeExplorerComparisonStudyPayload;
  }>): TradeExplorerComparisonStudyRecord {
    const name = normalizedName(input.name);
    const payload = validatedPayload(input.payload);
    return this.repository.immediate(() => {
      if (this.repository.countActive(scope) >= ACTIVE_STUDY_LIMIT) {
        platformFailure("TRADERLINK_TRADE_EXPLORER_STUDY_CONFLICT", {
          reason: "active_study_limit",
        });
      }
      const studyId = this.dependencies.createId();
      const timestamp = createCanonicalUtcTimestamp(this.dependencies.now());
      this.repository.insert({
        scope,
        studyId,
        versionId: this.dependencies.createId(),
        name,
        normalizedStudyJson: payload.normalizedStudyJson,
        studySha256: payload.studySha256,
        timestamp,
      });
      const created = this.repository.find(scope, studyId);
      if (!created) platformFailure("TRADERLINK_TRADE_EXPLORER_STUDY_CONFLICT");
      return created;
    });
  }

  update(scope: AccountScope, input: Readonly<{
    studyId: unknown;
    expectedRevision: unknown;
    name: unknown;
    payload: TradeExplorerComparisonStudyPayload;
  }>): TradeExplorerComparisonStudyRecord {
    const studyId = uuid(input.studyId, "studyId");
    const expectedRevision = positiveRevision(input.expectedRevision);
    const name = normalizedName(input.name);
    const payload = validatedPayload(input.payload);
    return this.repository.immediate(() => {
      const current = this.repository.find(scope, studyId);
      if (!current || current.lifecycleState !== "active" ||
          current.revision !== expectedRevision) {
        platformFailure("TRADERLINK_TRADE_EXPLORER_STUDY_CONFLICT");
      }
      const changed = this.repository.append({
        scope,
        studyId,
        expectedRevision,
        versionId: this.dependencies.createId(),
        eventKind: "updated",
        name,
        normalizedStudyJson: payload.normalizedStudyJson,
        studySha256: payload.studySha256,
        lifecycleState: "active",
        timestamp: createCanonicalUtcTimestamp(this.dependencies.now()),
      });
      if (!changed) platformFailure("TRADERLINK_TRADE_EXPLORER_STUDY_CONFLICT");
      const updated = this.repository.find(scope, studyId);
      if (!updated) platformFailure("TRADERLINK_TRADE_EXPLORER_STUDY_CONFLICT");
      return updated;
    });
  }

  retire(scope: AccountScope, input: Readonly<{
    studyId: unknown;
    expectedRevision: unknown;
  }>): void {
    const studyId = uuid(input.studyId, "studyId");
    const expectedRevision = positiveRevision(input.expectedRevision);
    this.repository.immediate(() => {
      const current = this.repository.find(scope, studyId);
      if (!current || current.lifecycleState !== "active" ||
          current.revision !== expectedRevision) {
        platformFailure("TRADERLINK_TRADE_EXPLORER_STUDY_CONFLICT");
      }
      const changed = this.repository.append({
        scope,
        studyId,
        expectedRevision,
        versionId: this.dependencies.createId(),
        eventKind: "retired",
        name: current.name,
        normalizedStudyJson: current.normalizedStudyJson,
        studySha256: current.studySha256,
        lifecycleState: "retired",
        timestamp: createCanonicalUtcTimestamp(this.dependencies.now()),
      });
      if (!changed) platformFailure("TRADERLINK_TRADE_EXPLORER_STUDY_CONFLICT");
    });
  }
}
