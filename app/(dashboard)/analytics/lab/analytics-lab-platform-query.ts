import { createHash } from "node:crypto";

import type { JournalAnalyticsGrouping } from "@/src/modules/journal-analytics/contracts/analytics-query";
import {
  ANALYTICS_LAB_SAVED_VIEW_QUERY_VERSION,
  type JournalAnalyticsSavedViewPayload,
} from "@/src/modules/journal-analytics/contracts/analytics-lab-saved-view";
import { journalAnalyticsMetricRegistry } from "@/src/modules/journal-analytics/server/analytics-metric-registry";
import { platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";

import type {
  AnalyticsLabPlatformQuery,
  AnalyticsLabSavedViewQuery,
} from "./analytics-lab-platform-types";

export const analyticsLabPlatformGroupingOptions = Object.freeze([
  ["total", "All matching trades"],
  ["closing_day", "Closing day"],
  ["closing_iso_week", "Closing week"],
  ["closing_month", "Closing month"],
  ["closing_year", "Closing year"],
  ["entry_weekday", "Entry weekday"],
  ["entry_time_bucket", "Entry time"],
  ["instrument", "Ticker"],
  ["direction", "Direction"],
  ["provenance", "Execution source"],
  ["holding_duration_bucket", "Holding time"],
  ["entered_quantity_bucket", "Entered quantity"],
  ["maximum_position_bucket", "Maximum position"],
  ["entry_notional_bucket", "Entry notional"],
  ["realized_outcome", "Result"],
] as const satisfies readonly (readonly [JournalAnalyticsGrouping, string])[]);

const queryKeys = Object.freeze([
  "currency", "direction", "endDate", "entryTimeBucket",
  "entryTimeBucketMinutes", "entryWeekday", "evidenceRows",
  "expectedAccountSelectionRef", "grouping", "maximumEnteredQuantity",
  "maximumEntryNotional", "maximumHoldingSeconds", "maximumPositionQuantity",
  "metricId", "minimumEnteredQuantity", "minimumEntryNotional",
  "minimumHoldingSeconds", "minimumPositionQuantity", "moneyBasis", "outcome",
  "provenance", "startDate", "symbol",
] as const);

function record(value: unknown): Record<string, unknown> {
  if (!value || Array.isArray(value) || typeof value !== "object") {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
      field: "analyticsLabQuery",
    });
  }
  return value as Record<string, unknown>;
}

function exactKeys(value: Record<string, unknown>): void {
  const actual = Object.keys(value).sort();
  const expected = [...queryKeys].sort();
  if (actual.length !== expected.length ||
      actual.some((key, index) => key !== expected[index])) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
      field: "analyticsLabQueryFields",
    });
  }
}

function text(value: unknown, field: string, maximum = 128): string {
  if (typeof value !== "string" || value.length < 1 || value.length > maximum ||
      /[\u0000-\u001f\u007f]/u.test(value)) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field });
  }
  return value;
}

function nullableEnum<const T extends readonly string[]>(
  value: unknown,
  allowed: T,
  field: string,
): T[number] | null {
  if (value === null) return null;
  if (typeof value !== "string" || !allowed.includes(value)) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field });
  }
  return value as T[number];
}

function date(value: unknown, field: string): string {
  const result = text(value, field, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(result) ||
      new Date(`${result}T00:00:00.000Z`).toISOString().slice(0, 10) !== result) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field });
  }
  return result;
}

function decimal(value: unknown, field: string): string | null {
  if (value === null) return null;
  const result = text(value, field, 128);
  if (!/^(?:0|[1-9]\d*)(?:\.\d*[1-9])?$/u.test(result)) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field });
  }
  return result;
}

function range(
  minimum: string | null,
  maximum: string | null,
  field: string,
): void {
  if (minimum === null || maximum === null) return;
  const [leftWhole, leftFraction = ""] = minimum.split(".");
  const [rightWhole, rightFraction = ""] = maximum.split(".");
  const scale = Math.max(leftFraction.length, rightFraction.length);
  const left = BigInt(`${leftWhole}${leftFraction.padEnd(scale, "0")}`);
  const right = BigInt(`${rightWhole}${rightFraction.padEnd(scale, "0")}`);
  if (left > right) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field });
  }
}

export function normalizeAnalyticsLabPlatformQuery(
  input: unknown,
): AnalyticsLabPlatformQuery {
  const value = record(input);
  exactKeys(value);
  const metricId = text(value.metricId, "metricId");
  if (!journalAnalyticsMetricRegistry.definitions.some((item) =>
    item.metricId === metricId)) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
      field: "metricId",
    });
  }
  const grouping = text(value.grouping, "grouping") as JournalAnalyticsGrouping;
  if (!analyticsLabPlatformGroupingOptions.some(([candidate]) =>
    candidate === grouping)) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
      field: "grouping",
    });
  }
  const moneyBasis = text(value.moneyBasis, "moneyBasis");
  if (moneyBasis !== "gross" && moneyBasis !== "net") {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
      field: "moneyBasis",
    });
  }
  const currency = value.currency === null
    ? null
    : text(value.currency, "currency", 3).toUpperCase();
  if (currency !== null && !/^[A-Z]{3}$/u.test(currency)) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
      field: "currency",
    });
  }
  const symbol = value.symbol === null
    ? null
    : text(value.symbol, "symbol", 64).toUpperCase();
  const startDate = date(value.startDate, "startDate");
  const endDate = date(value.endDate, "endDate");
  if (startDate > endDate) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
      field: "closingDateRange",
    });
  }
  const entryTimeBucketMinutes = value.entryTimeBucketMinutes;
  if (![5, 15, 30, 60].includes(entryTimeBucketMinutes as number)) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
      field: "entryTimeBucketMinutes",
    });
  }
  const entryTimeBucket = value.entryTimeBucket === null
    ? null
    : text(value.entryTimeBucket, "entryTimeBucket", 5);
  if (entryTimeBucket !== null) {
    const match = /^(\d{2}):(\d{2})$/u.exec(entryTimeBucket);
    const hour = Number(match?.[1]);
    const minute = Number(match?.[2]);
    if (!match || hour > 23 || minute > 59 ||
        minute % (entryTimeBucketMinutes as number) !== 0) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
        field: "entryTimeBucket",
      });
    }
  }
  const evidenceRows = value.evidenceRows;
  if (![12, 24, 50, 100].includes(evidenceRows as number)) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
      field: "evidenceRows",
    });
  }
  const minimumHoldingSeconds = decimal(value.minimumHoldingSeconds, "minimumHoldingSeconds");
  const maximumHoldingSeconds = decimal(value.maximumHoldingSeconds, "maximumHoldingSeconds");
  const minimumEnteredQuantity = decimal(value.minimumEnteredQuantity, "minimumEnteredQuantity");
  const maximumEnteredQuantity = decimal(value.maximumEnteredQuantity, "maximumEnteredQuantity");
  const minimumPositionQuantity = decimal(value.minimumPositionQuantity, "minimumPositionQuantity");
  const maximumPositionQuantity = decimal(value.maximumPositionQuantity, "maximumPositionQuantity");
  const minimumEntryNotional = decimal(value.minimumEntryNotional, "minimumEntryNotional");
  const maximumEntryNotional = decimal(value.maximumEntryNotional, "maximumEntryNotional");
  range(minimumHoldingSeconds, maximumHoldingSeconds, "holdingDurationRange");
  range(minimumEnteredQuantity, maximumEnteredQuantity, "enteredQuantityRange");
  range(minimumPositionQuantity, maximumPositionQuantity, "maximumPositionRange");
  range(minimumEntryNotional, maximumEntryNotional, "entryNotionalRange");
  const milliseconds = (seconds: string | null, field: string): void => {
    if (seconds === null) return;
    const result = Number(seconds) * 1_000;
    if (!Number.isSafeInteger(result) || result < 0) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field });
    }
  };
  milliseconds(minimumHoldingSeconds, "minimumHoldingSeconds");
  milliseconds(maximumHoldingSeconds, "maximumHoldingSeconds");
  return Object.freeze({
    expectedAccountSelectionRef: text(value.expectedAccountSelectionRef, "expectedAccountSelectionRef", 256),
    metricId,
    grouping,
    moneyBasis,
    currency,
    symbol,
    direction: nullableEnum(value.direction, ["long", "short"] as const, "direction"),
    provenance: nullableEnum(value.provenance, ["broker_only", "manual_only", "correction_only", "mixed", "unknown"] as const, "provenance"),
    outcome: nullableEnum(value.outcome, ["win", "loss", "flat"] as const, "outcome"),
    entryWeekday: nullableEnum(value.entryWeekday, ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const, "entryWeekday"),
    entryTimeBucketMinutes: entryTimeBucketMinutes as 5 | 15 | 30 | 60,
    entryTimeBucket,
    startDate,
    endDate,
    minimumHoldingSeconds,
    maximumHoldingSeconds,
    minimumEnteredQuantity,
    maximumEnteredQuantity,
    minimumPositionQuantity,
    maximumPositionQuantity,
    minimumEntryNotional,
    maximumEntryNotional,
    evidenceRows: evidenceRows as 12 | 24 | 50 | 100,
  });
}

function savedQuery(
  query: AnalyticsLabPlatformQuery,
): AnalyticsLabSavedViewQuery {
  return Object.freeze({
    metricId: query.metricId,
    grouping: query.grouping,
    moneyBasis: query.moneyBasis,
    currency: query.currency,
    symbol: query.symbol,
    direction: query.direction,
    provenance: query.provenance,
    outcome: query.outcome,
    entryWeekday: query.entryWeekday,
    entryTimeBucketMinutes: query.entryTimeBucketMinutes,
    entryTimeBucket: query.entryTimeBucket,
    startDate: query.startDate,
    endDate: query.endDate,
    minimumHoldingSeconds: query.minimumHoldingSeconds,
    maximumHoldingSeconds: query.maximumHoldingSeconds,
    minimumEnteredQuantity: query.minimumEnteredQuantity,
    maximumEnteredQuantity: query.maximumEnteredQuantity,
    minimumPositionQuantity: query.minimumPositionQuantity,
    maximumPositionQuantity: query.maximumPositionQuantity,
    minimumEntryNotional: query.minimumEntryNotional,
    maximumEntryNotional: query.maximumEntryNotional,
    evidenceRows: query.evidenceRows,
  });
}

export function prepareAnalyticsLabSavedViewPayload(
  input: unknown,
): Readonly<{
  query: AnalyticsLabPlatformQuery;
  savedQuery: AnalyticsLabSavedViewQuery;
  payload: JournalAnalyticsSavedViewPayload;
}> {
  const query = normalizeAnalyticsLabPlatformQuery(input);
  const normalizedSavedQuery = savedQuery(query);
  const normalizedQueryJson = JSON.stringify(normalizedSavedQuery);
  return Object.freeze({
    query,
    savedQuery: normalizedSavedQuery,
    payload: Object.freeze({
      queryVersion: ANALYTICS_LAB_SAVED_VIEW_QUERY_VERSION,
      normalizedQueryJson,
      querySha256: createHash("sha256")
        .update(normalizedQueryJson, "utf8")
        .digest("hex"),
    }),
  });
}

export function restoreAnalyticsLabSavedViewQuery(
  payload: JournalAnalyticsSavedViewPayload,
  expectedAccountSelectionRef: string,
): AnalyticsLabPlatformQuery {
  let saved: unknown;
  try {
    saved = JSON.parse(payload.normalizedQueryJson);
  } catch {
    platformFailure("TRADERLINK_ANALYTICS_SAVED_VIEW_INVALID", { field: "query" });
  }
  if (!saved || Array.isArray(saved) || typeof saved !== "object") {
    platformFailure("TRADERLINK_ANALYTICS_SAVED_VIEW_INVALID", { field: "query" });
  }
  const prepared = prepareAnalyticsLabSavedViewPayload({
    ...(saved as Record<string, unknown>),
    expectedAccountSelectionRef,
  });
  if (prepared.payload.queryVersion !== payload.queryVersion ||
      prepared.payload.normalizedQueryJson !== payload.normalizedQueryJson ||
      prepared.payload.querySha256 !== payload.querySha256) {
    platformFailure("TRADERLINK_ANALYTICS_SAVED_VIEW_INVALID", {
      field: "queryCanonicalization",
    });
  }
  return prepared.query;
}
