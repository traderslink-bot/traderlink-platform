import "server-only";

import { createHash, randomBytes } from "node:crypto";
import type Database from "better-sqlite3";

import { PlatformOperationalEventRepository } from "../administration/platform-operational-event-repository";
import {
  createCanonicalUtcTimestamp,
  isTraderLinkPlatformError,
} from "../database/platform-migration-contract";

export type MoomooOperationStage =
  | "oauth_start"
  | "oauth_state"
  | "oauth_callback"
  | "disconnect"
  | "account_discovery"
  | "account_link"
  | "import_start"
  | "import_status"
  | "incremental_schedule"
  | "worker";

function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}
function safeCount(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isSafeInteger(value)) return null;
  return Math.abs(value);
}

function safeOutcomeCode(code: string, stage: MoomooOperationStage): string {
  const reason = code === "TRADERLINK_BROKER_CONNECTION_OAUTH_INVALID"
    ? "oauth_invalid"
    : code === "TRADERLINK_BROKER_CONNECTION_ACCESS_DENIED"
      ? "access_denied"
      : code === "TRADERLINK_BROKER_CONNECTION_STORAGE_INVALID"
        ? "provider_response_invalid"
        : code === "TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED"
          ? "request_invalid"
          : code === "TRADERLINK_ACCOUNT_SELECTION_CONFLICT"
            ? "account_selection_conflict"
            : "unexpected";
  return `moomoo_${stage}_${reason}`;
}

export function recordMoomooOperationFailure(input: Readonly<{
  database: Database.Database;
  error: unknown;
  stage: MoomooOperationStage;
  now?: Date;
}>): boolean {
  const eventReference = `MOO-${randomBytes(8).toString("hex").toUpperCase()}`;
  const timestamp = createCanonicalUtcTimestamp(input.now);
  const code = isTraderLinkPlatformError(input.error)
    ? input.error.code
    : "TRADERLINK_MOOMOO_UNEXPECTED_FAILURE";
  const context: Readonly<Record<string, unknown>> = isTraderLinkPlatformError(input.error)
    ? input.error.safeContext as Readonly<Record<string, unknown>>
    : Object.freeze({});
  const safeCounts: Record<string, number> = {};
  const httpStatus = safeCount(context.httpStatus);
  const providerCode = safeCount(context.providerCode);
  if (httpStatus !== null) safeCounts.http_status = httpStatus;
  if (providerCode !== null) {
    safeCounts.provider_code = providerCode;
    safeCounts.provider_code_negative = Number(context.providerCode) < 0 ? 1 : 0;
  }
  const outcomeCode = safeOutcomeCode(code, input.stage);
  const evidence = JSON.stringify({ outcomeCode, safeCounts });
  try {
    new PlatformOperationalEventRepository(input.database).append({
      operationKind: "background_job",
      operationRefSha256: sha256(eventReference),
      state: "failed",
      outcomeCode,
      applicationVersion: null,
      safeCounts,
      evidenceSha256: sha256(evidence),
      startedAtUtc: timestamp,
      completedAtUtc: timestamp,
      createdAtUtc: timestamp,
    });
    console.error("TraderLink Moomoo operation failed.", JSON.stringify({
      code,
      eventReference,
      stage: input.stage,
      ...safeCounts,
    }));
    return true;
  } catch {
    console.error("TraderLink Moomoo failure reporting failed.", JSON.stringify({
      code: "TRADERLINK_MOOMOO_FAILURE_REPORTING_FAILED",
      stage: input.stage,
    }));
    return false;
  }
}
