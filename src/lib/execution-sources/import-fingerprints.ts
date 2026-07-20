import type { UserTradeAnalysisRequest } from "../trade-analysis/request/trade-analysis-request-contract";

export type LegacyNonAuthoritativeFingerprint = string;

function stableHash(value: string): string {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(16).padStart(8, "0");
}

function normalizeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeNumber(value: unknown): string {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed.toFixed(8).replace(/\.?0+$/, "") : "";
}

function normalizeTimestamp(value: unknown): string {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? "" : value.toISOString();
  }

  if (typeof value === "number") {
    const date = new Date(value);

    return Number.isNaN(date.getTime()) ? "" : date.toISOString();
  }

  if (typeof value !== "string") {
    return "";
  }

  const parsed = Date.parse(value);

  return Number.isNaN(parsed) ? value.trim() : new Date(parsed).toISOString();
}

export function buildBrokerExecutionCsvFileFingerprint(
  csvText: string,
): LegacyNonAuthoritativeFingerprint {
  const normalized = csvText
    .replace(/^\uFEFF/, "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .trim();

  return `broker_csv_file_v1:${stableHash(normalized)}`;
}

export function buildTradeAnalysisRequestFingerprint(
  request: UserTradeAnalysisRequest,
): LegacyNonAuthoritativeFingerprint {
  const executionKey = [...request.executions]
    .sort((left, right) => {
      const timeDelta =
        Date.parse(String(left.timestamp)) - Date.parse(String(right.timestamp));

      if (timeDelta !== 0) {
        return timeDelta;
      }

      return Number(left.executionIndex ?? 0) - Number(right.executionIndex ?? 0);
    })
    .map((execution) =>
      [
        normalizeTimestamp(execution.timestamp),
        normalizeString(execution.symbol).toUpperCase(),
        normalizeString(execution.side).toLowerCase(),
        normalizeNumber(execution.shares),
        normalizeNumber(execution.price),
        normalizeString(execution.orderId),
        normalizeString(execution.brokerExecutionId),
      ].join(":"),
    )
    .join("|");

  const signature = [
    normalizeString(request.symbol).toUpperCase(),
    normalizeString(request.tradeDirection).toLowerCase(),
    normalizeString(request.sessionContext?.sessionDate),
    normalizeString(request.sessionContext?.sessionBucket).toLowerCase(),
    executionKey,
  ].join("::");

  return `trade_request_v1:${stableHash(signature)}`;
}
