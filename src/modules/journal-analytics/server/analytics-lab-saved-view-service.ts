import { createHash, randomUUID } from "node:crypto";

import {
  ANALYTICS_LAB_SAVED_VIEW_QUERY_VERSION,
  type JournalAnalyticsSavedViewPayload,
  type JournalAnalyticsSavedViewRecord,
} from "@/src/modules/journal-analytics/contracts/analytics-lab-saved-view";
import type { AccountScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import {
  createCanonicalUtcTimestamp,
  platformFailure,
} from "@/src/modules/platform/server/database/platform-migration-contract";

import { JournalAnalyticsSavedViewRepository } from "./analytics-lab-saved-view-repository";

const SAVED_VIEW_LIMIT = 100;

function normalizedName(value: unknown): string {
  if (typeof value !== "string") {
    platformFailure("TRADERLINK_ANALYTICS_SAVED_VIEW_INVALID", { field: "name" });
  }
  const name = value.trim();
  if (name.length < 1 || name.length > 80 || /[\u0000-\u001f\u007f]/u.test(name)) {
    platformFailure("TRADERLINK_ANALYTICS_SAVED_VIEW_INVALID", { field: "name" });
  }
  return name;
}

function positiveRevision(value: unknown): number {
  if (!Number.isSafeInteger(value) || (value as number) < 1) {
    platformFailure("TRADERLINK_ANALYTICS_SAVED_VIEW_INVALID", { field: "expectedRevision" });
  }
  return value as number;
}

function validatedPayload(
  payload: JournalAnalyticsSavedViewPayload,
): JournalAnalyticsSavedViewPayload {
  if (payload.queryVersion !== ANALYTICS_LAB_SAVED_VIEW_QUERY_VERSION ||
      payload.normalizedQueryJson.length < 2 ||
      payload.normalizedQueryJson.length > 65_536) {
    platformFailure("TRADERLINK_ANALYTICS_SAVED_VIEW_INVALID", { field: "query" });
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(payload.normalizedQueryJson);
  } catch {
    platformFailure("TRADERLINK_ANALYTICS_SAVED_VIEW_INVALID", { field: "query" });
  }
  if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") {
    platformFailure("TRADERLINK_ANALYTICS_SAVED_VIEW_INVALID", { field: "query" });
  }
  const digest = createHash("sha256")
    .update(payload.normalizedQueryJson, "utf8")
    .digest("hex");
  if (digest !== payload.querySha256) {
    platformFailure("TRADERLINK_ANALYTICS_SAVED_VIEW_INVALID", { field: "queryDigest" });
  }
  return Object.freeze({ ...payload });
}

function uuid(value: unknown, field: string): string {
  if (typeof value !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u.test(value)) {
    platformFailure("TRADERLINK_ANALYTICS_SAVED_VIEW_INVALID", { field });
  }
  return value;
}

export class JournalAnalyticsSavedViewService {
  constructor(
    private readonly repository: JournalAnalyticsSavedViewRepository,
    private readonly dependencies: Readonly<{
      createId: () => string;
      now: () => Date;
    }> = Object.freeze({ createId: randomUUID, now: () => new Date() }),
  ) {}

  list(scope: AccountScope): readonly JournalAnalyticsSavedViewRecord[] {
    return Object.freeze(this.repository.listActive(scope).map((record) => {
      validatedPayload(record);
      return record;
    }));
  }

  create(scope: AccountScope, input: Readonly<{
    name: unknown;
    payload: JournalAnalyticsSavedViewPayload;
  }>): JournalAnalyticsSavedViewRecord {
    const name = normalizedName(input.name);
    const payload = validatedPayload(input.payload);
    return this.repository.immediate(() => {
      if (this.repository.countActive(scope) >= SAVED_VIEW_LIMIT) {
        platformFailure("TRADERLINK_ANALYTICS_SAVED_VIEW_CONFLICT", {
          reason: "active_view_limit",
        });
      }
      const savedViewId = this.dependencies.createId();
      const versionId = this.dependencies.createId();
      const timestamp = createCanonicalUtcTimestamp(this.dependencies.now());
      this.repository.insert({
        scope,
        savedViewId,
        versionId,
        name,
        queryVersion: payload.queryVersion,
        normalizedQueryJson: payload.normalizedQueryJson,
        querySha256: payload.querySha256,
        timestamp,
      });
      const created = this.repository.find(scope, savedViewId);
      if (!created) platformFailure("TRADERLINK_ANALYTICS_SAVED_VIEW_CONFLICT");
      return created;
    });
  }

  update(scope: AccountScope, input: Readonly<{
    savedViewId: unknown;
    expectedRevision: unknown;
    name: unknown;
    payload: JournalAnalyticsSavedViewPayload;
  }>): JournalAnalyticsSavedViewRecord {
    const savedViewId = uuid(input.savedViewId, "savedViewId");
    const expectedRevision = positiveRevision(input.expectedRevision);
    const name = normalizedName(input.name);
    const payload = validatedPayload(input.payload);
    return this.repository.immediate(() => {
      const current = this.repository.find(scope, savedViewId);
      if (!current || current.lifecycleState !== "active" ||
          current.revision !== expectedRevision) {
        platformFailure("TRADERLINK_ANALYTICS_SAVED_VIEW_CONFLICT");
      }
      const changed = this.repository.append({
        scope,
        savedViewId,
        expectedRevision,
        versionId: this.dependencies.createId(),
        eventKind: "updated",
        name,
        queryVersion: payload.queryVersion,
        normalizedQueryJson: payload.normalizedQueryJson,
        querySha256: payload.querySha256,
        lifecycleState: "active",
        timestamp: createCanonicalUtcTimestamp(this.dependencies.now()),
      });
      if (!changed) platformFailure("TRADERLINK_ANALYTICS_SAVED_VIEW_CONFLICT");
      const updated = this.repository.find(scope, savedViewId);
      if (!updated) platformFailure("TRADERLINK_ANALYTICS_SAVED_VIEW_CONFLICT");
      return updated;
    });
  }

  retire(scope: AccountScope, input: Readonly<{
    savedViewId: unknown;
    expectedRevision: unknown;
  }>): void {
    const savedViewId = uuid(input.savedViewId, "savedViewId");
    const expectedRevision = positiveRevision(input.expectedRevision);
    this.repository.immediate(() => {
      const current = this.repository.find(scope, savedViewId);
      if (!current || current.lifecycleState !== "active" ||
          current.revision !== expectedRevision) {
        platformFailure("TRADERLINK_ANALYTICS_SAVED_VIEW_CONFLICT");
      }
      const changed = this.repository.append({
        scope,
        savedViewId,
        expectedRevision,
        versionId: this.dependencies.createId(),
        eventKind: "retired",
        name: current.name,
        queryVersion: current.queryVersion,
        normalizedQueryJson: current.normalizedQueryJson,
        querySha256: current.querySha256,
        lifecycleState: "retired",
        timestamp: createCanonicalUtcTimestamp(this.dependencies.now()),
      });
      if (!changed) platformFailure("TRADERLINK_ANALYTICS_SAVED_VIEW_CONFLICT");
    });
  }
}
