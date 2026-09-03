import { createHash, randomUUID } from "node:crypto";

import {
  TRADE_EXPLORER_SAVED_VIEW_VERSION,
  type TradeExplorerSavedViewPayload,
  type TradeExplorerSavedViewRecord,
} from "@/src/modules/journal-analytics/contracts/trade-explorer-saved-view";
import type { AccountScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import {
  createCanonicalUtcTimestamp,
  platformFailure,
} from "@/src/modules/platform/server/database/platform-migration-contract";

import { TradeExplorerSavedViewRepository } from "./trade-explorer-saved-view-repository";

const ACTIVE_SAVED_VIEW_LIMIT = 100;

function normalizedName(value: unknown): string {
  if (typeof value !== "string") {
    platformFailure("TRADERLINK_TRADE_EXPLORER_SAVED_VIEW_INVALID", { field: "name" });
  }
  const name = value.trim().replace(/\s+/gu, " ");
  if (name.length < 1 || name.length > 80 || /[\u0000-\u001f\u007f]/u.test(name)) {
    platformFailure("TRADERLINK_TRADE_EXPLORER_SAVED_VIEW_INVALID", { field: "name" });
  }
  return name;
}

function validatedPayload(
  payload: TradeExplorerSavedViewPayload,
): TradeExplorerSavedViewPayload {
  if (payload.viewVersion !== TRADE_EXPLORER_SAVED_VIEW_VERSION ||
      payload.normalizedViewJson.length < 2 ||
      payload.normalizedViewJson.length > 65_536) {
    platformFailure("TRADERLINK_TRADE_EXPLORER_SAVED_VIEW_INVALID", { field: "view" });
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(payload.normalizedViewJson);
  } catch {
    platformFailure("TRADERLINK_TRADE_EXPLORER_SAVED_VIEW_INVALID", { field: "view" });
  }
  if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") {
    platformFailure("TRADERLINK_TRADE_EXPLORER_SAVED_VIEW_INVALID", { field: "view" });
  }
  const digest = createHash("sha256")
    .update(payload.normalizedViewJson, "utf8")
    .digest("hex");
  if (digest !== payload.viewSha256) {
    platformFailure("TRADERLINK_TRADE_EXPLORER_SAVED_VIEW_INVALID", { field: "viewDigest" });
  }
  return Object.freeze({ ...payload });
}

export class TradeExplorerSavedViewService {
  constructor(
    private readonly repository: TradeExplorerSavedViewRepository,
    private readonly dependencies: Readonly<{
      createId: () => string;
      now: () => Date;
    }> = Object.freeze({ createId: randomUUID, now: () => new Date() }),
  ) {}

  list(scope: AccountScope): readonly TradeExplorerSavedViewRecord[] {
    return Object.freeze(this.repository.listActive(scope).map((record) => {
      validatedPayload(record);
      return record;
    }));
  }

  create(scope: AccountScope, input: Readonly<{
    name: unknown;
    payload: TradeExplorerSavedViewPayload;
  }>): TradeExplorerSavedViewRecord {
    const name = normalizedName(input.name);
    const payload = validatedPayload(input.payload);
    return this.repository.immediate(() => {
      if (this.repository.countActive(scope) >= ACTIVE_SAVED_VIEW_LIMIT) {
        platformFailure("TRADERLINK_TRADE_EXPLORER_SAVED_VIEW_CONFLICT", {
          reason: "active_view_limit",
        });
      }
      const savedViewId = this.dependencies.createId();
      const timestamp = createCanonicalUtcTimestamp(this.dependencies.now());
      this.repository.insert({
        scope,
        savedViewId,
        versionId: this.dependencies.createId(),
        name,
        normalizedViewJson: payload.normalizedViewJson,
        viewSha256: payload.viewSha256,
        timestamp,
      });
      const created = this.repository.find(scope, savedViewId);
      if (!created) platformFailure("TRADERLINK_TRADE_EXPLORER_SAVED_VIEW_CONFLICT");
      return created;
    });
  }
}
