import "server-only";

import { createHash } from "node:crypto";

import type { NormalizedMarketCandle } from "@/src/modules/level-analysis/contracts/candle-review-contracts";
import { newYorkExtendedSession } from "@/src/modules/level-analysis/server/daily-trade-analyzer-session";
import { MoomooDailyTradeKlineMarketDataProvider } from "@/src/modules/level-analysis/server/providers/moomoo-daily-trade-kline-market-data-provider";
import { deriveAuthenticatedUserJournalScope } from "@/src/modules/platform/server/authentication/authenticated-user-journal-scope";
import type { TraderLinkPlatformRequestIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { MoomooConnectionAccessService } from "@/src/modules/platform/server/broker-connections/moomoo-connection-access-service";
import { MoomooConnectionRepository } from "@/src/modules/platform/server/broker-connections/moomoo-connection-repository";
import { openReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { PlatformUserRepository } from "@/src/modules/platform/server/identity/platform-user-repository";
import { TRADERLINK_WATCHLIST_DASHBOARD_NAV_DISCORD_SUBJECT_ENV } from "@/src/modules/watchlist/server/access/watchlist-dashboard-navigation-access";

const MAX_PAGES = 3;
const MIN_TOKEN_LIFETIME_MILLISECONDS = 15 * 60 * 1000;
const SESSION_POLICY = "america_new_york_extended_0400_2000_v1";
const DISCORD_SNOWFLAKE_PATTERN = /^[0-9]{1,32}$/u;

const ALLOWED_SESSIONS = Object.freeze(new Map<string, ReadonlySet<string>>([
  ["2026-08-25", new Set(["ANF", "BHVN", "BZ", "SEDG", "SMTC", "SMMT"])],
  ["2026-08-26", new Set(["YYGH", "CRE", "SOAR", "XPON", "WSHP"])],
]));

type SanitizedRawPage = Readonly<{
  httpStatus: number;
  page: number;
  response: Readonly<Record<string, unknown>>;
  sanitizedResponseSha256: string;
}>;

export type DailyTrackerMarketDataExport = Readonly<{
  checksums: Readonly<{
    algorithm: "sha256";
    normalizedBarsSha256: string;
    rawPagesSha256: string;
  }>;
  contract: "traderlink_temporary_owner_daily_tracker_market_export_v1";
  request: Readonly<{
    date: string;
    endTimeUtcSeconds: number;
    interval: "1m";
    sessionPolicy: string;
    startTimeUtcSeconds: number;
    symbol: string;
  }>;
  session: Readonly<{
    bars: readonly NormalizedMarketCandle[];
    corporateActionReview: "required_for_final_pack_acceptance";
    priceContinuityGuard: "unadjusted_price_ratio_0.25_to_4_exclusive_v1";
    exchangeTimezone: string;
    normalizedCandleSha256: string;
    pageCount: number;
    provider: "moomoo_history_kline";
    providerAdapterVersion: "moomoo_history_kline_v1";
    providerUtcOffsetSeconds: number;
    rawPages: readonly SanitizedRawPage[];
  }>;
  temporaryExport: true;
}>;

export type DailyTrackerMarketDataExportUnavailableCategory =
  | "candle_availability_unavailable"
  | "provider_http_unavailable"
  | "provider_or_candle_unavailable"
  | "provider_payload_unavailable"
  | "provider_semantic_unavailable"
  | "provider_transport_unavailable"
  | "requester_connection_cardinality_invalid"
  | "requester_connection_unavailable"
  | "requester_token_expired_or_under_15_minutes"
  | "session_coverage_unavailable"
  | "session_continuity_unavailable"
  | "session_exchange_timezone_invalid"
  | "session_minute_interval_unavailable"
  | "session_provider_offset_absent_or_invalid"
  | "session_provider_offset_mismatched"
  | "session_timezone_unavailable"
  | "token_access_unavailable";

export class DailyTrackerMarketDataExportDenied extends Error {}
export class DailyTrackerMarketDataExportInvalid extends Error {}
export class DailyTrackerMarketDataExportUnavailable extends Error {
  constructor(readonly category: DailyTrackerMarketDataExportUnavailableCategory) {
    super(category);
  }
}

function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function canonicalJson(value: unknown): string {
  const normalize = (candidate: unknown): unknown => {
    if (Array.isArray(candidate)) return candidate.map(normalize);
    if (candidate && typeof candidate === "object") {
      return Object.fromEntries(Object.entries(candidate as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, child]) => [key, normalize(child)]));
    }
    return candidate;
  };
  return `${JSON.stringify(normalize(value))}\n`;
}

function allowedSession(input: Readonly<{ date: string; symbol: string }>): boolean {
  return /^2026-08-(?:25|26)$/u.test(input.date) &&
    /^[A-Z][A-Z0-9.-]{0,15}$/u.test(input.symbol) &&
    ALLOWED_SESSIONS.get(input.date)?.has(input.symbol) === true;
}

function sanitizedScalar(value: unknown): string | number | boolean | null {
  return typeof value === "string" || typeof value === "number" ||
      typeof value === "boolean" || value === null
    ? value
    : null;
}

function sanitizeRawPayload(value: unknown): Readonly<Record<string, unknown>> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new DailyTrackerMarketDataExportUnavailable("provider_or_candle_unavailable");
  }
  const payload = value as Record<string, unknown>;
  const data = payload.data;
  const dataRecord = data && typeof data === "object" && !Array.isArray(data)
    ? data as Record<string, unknown>
    : null;
  const klineList = dataRecord?.kline_list;
  if (!dataRecord || !Array.isArray(klineList)) {
    throw new DailyTrackerMarketDataExportUnavailable("provider_or_candle_unavailable");
  }
  const allowedKlineFields = [
    "close", "close_price", "high", "high_price", "low", "low_price",
    "open", "open_price", "time_key", "time_zone", "turnover", "volume",
  ];
  const safeKlines = klineList.map((entry) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      throw new DailyTrackerMarketDataExportUnavailable("provider_or_candle_unavailable");
    }
    const record = entry as Record<string, unknown>;
    return Object.freeze(Object.fromEntries(allowedKlineFields
      .filter((field) => field in record)
      .map((field) => [field, sanitizedScalar(record[field])])));
  });
  const pagination = payload.pagination;
  const paginationRecord = pagination && typeof pagination === "object" && !Array.isArray(pagination)
    ? pagination as Record<string, unknown>
    : null;
  return Object.freeze({
    data: Object.freeze({
      kline_list: Object.freeze(safeKlines),
      next_time: sanitizedScalar(dataRecord.next_time),
    }),
    pagination: Object.freeze({ has_more: sanitizedScalar(paginationRecord?.has_more) }),
    ret_code: sanitizedScalar(payload.ret_code),
  });
}

function recordRawCandleTimes(
  page: Readonly<Record<string, unknown>>,
  times: Set<number>,
): void {
  const data = page.data as Readonly<Record<string, unknown>>;
  const klineList = data.kline_list;
  if (!Array.isArray(klineList)) throw new DailyTrackerMarketDataExportUnavailable("provider_or_candle_unavailable");
  for (const entry of klineList) {
    const milliseconds = Number((entry as Readonly<Record<string, unknown>>).time_key);
    if (!Number.isSafeInteger(milliseconds) || milliseconds <= 0 || milliseconds % 1000 !== 0) {
      throw new DailyTrackerMarketDataExportUnavailable("provider_or_candle_unavailable");
    }
    const seconds = milliseconds / 1000;
    if (times.has(seconds)) throw new DailyTrackerMarketDataExportUnavailable("provider_or_candle_unavailable");
    times.add(seconds);
  }
}

type KlineProviderDiagnosticStage = Exclude<
  DailyTrackerMarketDataExportUnavailableCategory,
  | "provider_or_candle_unavailable"
  | "requester_connection_cardinality_invalid"
  | "requester_connection_unavailable"
  | "requester_token_expired_or_under_15_minutes"
  | "session_coverage_unavailable"
  | "session_continuity_unavailable"
  | "session_minute_interval_unavailable"
  | "session_timezone_unavailable"
>;

function isSuccessfulKlineResponse(value: unknown): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const payload = value as Record<string, unknown>;
  const data = payload.data;
  return payload.ret_code === 0 && !!data && typeof data === "object" && !Array.isArray(data) &&
    Array.isArray((data as Record<string, unknown>).kline_list);
}

function providerFailureCategory(
  failureReasonCode: string,
  observedStage: KlineProviderDiagnosticStage | null,
): DailyTrackerMarketDataExportUnavailableCategory {
  if (observedStage) return observedStage;
  switch (failureReasonCode) {
    case "moomoo_connection_unavailable":
      return "token_access_unavailable";
    case "moomoo_request_failed":
      return "provider_transport_unavailable";
    case "moomoo_http_unavailable":
      return "provider_http_unavailable";
    case "moomoo_reported_no_coverage":
      return "provider_semantic_unavailable";
    case "moomoo_json_invalid":
    case "moomoo_candle_invalid":
    case "moomoo_duplicate_candle_conflict":
      return "provider_payload_unavailable";
    case "moomoo_returned_no_candles":
      return "candle_availability_unavailable";
    default:
      return "provider_or_candle_unavailable";
  }
}

function expectedNewYorkUtcOffsetSeconds(date: string, sessionStartTime: number): number {
  const [yearText = "", monthText = "", dayText = ""] = date.split("-");
  if (!/^\d{4}$/u.test(yearText) || !/^\d{2}$/u.test(monthText) || !/^\d{2}$/u.test(dayText)) {
    throw new DailyTrackerMarketDataExportInvalid();
  }
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  return Date.UTC(year, month - 1, day, 4, 0, 0) / 1000 - sessionStartTime;
}

function validateSessionCoverageAndContinuity(input: Readonly<{
  candles: readonly NormalizedMarketCandle[];
  date: string;
  exchangeTimezone: string;
  providerUtcOffsetSeconds: number;
}>): void {
  const session = newYorkExtendedSession(input.date);
  if (!session) throw new DailyTrackerMarketDataExportInvalid();
  if (
    input.exchangeTimezone !== "America/New_York" ||
    input.providerUtcOffsetSeconds !== expectedNewYorkUtcOffsetSeconds(input.date, session.startTime)
  ) {
    throw new DailyTrackerMarketDataExportUnavailable("session_timezone_unavailable");
  }
  const expectedCount = (session.endTime - session.startTime) / 60;
  if (input.candles.length !== expectedCount) throw new DailyTrackerMarketDataExportUnavailable("session_minute_interval_unavailable");
  let prior: NormalizedMarketCandle | null = null;
  for (const [index, candle] of input.candles.entries()) {
    if (candle.time !== session.startTime + index * 60) {
      throw new DailyTrackerMarketDataExportUnavailable("session_minute_interval_unavailable");
    }
    if (prior) {
      const ratio = Number(candle.openDecimal) / Number(prior.closeDecimal);
      if (!Number.isFinite(ratio) || ratio <= 0 || ratio >= 4 || ratio <= 0.25) {
        throw new DailyTrackerMarketDataExportUnavailable("session_continuity_unavailable");
      }
    }
    prior = candle;
  }
}

export type AuthorizedDailyTrackerMarketDataExport = Readonly<{
  accessToken: () => Promise<string>;
  close: () => void;
}>;

function configuredOwnerSubjects(environment: NodeJS.ProcessEnv): readonly string[] {
  const subjects = environment[TRADERLINK_WATCHLIST_DASHBOARD_NAV_DISCORD_SUBJECT_ENV]
    ?.split(",")
    .map((subject) => subject.trim()) ?? [];
  if (
    subjects.length !== 2 ||
    new Set(subjects).size !== 2 ||
    subjects.some((subject) => !DISCORD_SNOWFLAKE_PATTERN.test(subject))
  ) {
    throw new DailyTrackerMarketDataExportUnavailable("requester_connection_cardinality_invalid");
  }
  return Object.freeze(subjects);
}

export function authorizeOwnerDailyTrackerMarketDataExport(
  identity: TraderLinkPlatformRequestIdentity,
): AuthorizedDailyTrackerMarketDataExport {
  const database = openReadonlyPlatformDatabase();
  try {
    if (identity.scope.workspaceRole !== "owner") {
      throw new DailyTrackerMarketDataExportDenied();
    }
    const connections = new MoomooConnectionRepository(database);
    const users = new PlatformUserRepository(database, {
      allowedAuthProviders: ["discord"],
    });
    const candidates = configuredOwnerSubjects(process.env).flatMap((subject) => {
      const user = users.findActiveByAuthIdentity("discord", subject);
      if (!user) return [];
      const scope = deriveAuthenticatedUserJournalScope(database, user.userId);
      const connection = connections.find(scope);
      return connection?.state === "active" && connection.authorizedScopes.includes("quote:read")
        ? [{ connection, scope }]
        : [];
    });
    const selected = candidates[0];
    if (candidates.length !== 1 || !selected) {
      throw new DailyTrackerMarketDataExportUnavailable("requester_connection_cardinality_invalid");
    }
    const expiresAt = Date.parse(selected.connection.accessTokenExpiresAtUtc ?? "");
    if (
      !Number.isFinite(expiresAt) || expiresAt - Date.now() <= MIN_TOKEN_LIFETIME_MILLISECONDS
    ) {
      throw new DailyTrackerMarketDataExportUnavailable("requester_token_expired_or_under_15_minutes");
    }
    const access = new MoomooConnectionAccessService(connections);
    return Object.freeze({
      accessToken: () => access.accessToken(selected.scope),
      close: () => database.close(),
    });
  } catch (error) {
    database.close();
    throw error;
  }
}

export async function exportOwnerDailyTrackerMarketData(input: Readonly<{
  authorized: AuthorizedDailyTrackerMarketDataExport;
  date: string;
  symbol: string;
}>): Promise<DailyTrackerMarketDataExport> {
  if (!allowedSession(input)) throw new DailyTrackerMarketDataExportInvalid();
  const session = newYorkExtendedSession(input.date);
  if (!session) throw new DailyTrackerMarketDataExportInvalid();
  const rawPages: SanitizedRawPage[] = [];
  const rawCandleTimes = new Set<number>();
  let observedStage: KlineProviderDiagnosticStage | null = null;
  const provider = new MoomooDailyTradeKlineMarketDataProvider(input.authorized.accessToken, async (request, init) => {
    if (rawPages.length >= MAX_PAGES) {
      observedStage = "candle_availability_unavailable";
      throw new Error("daily_tracker_market_data_page_cap");
    }
    let response: Response;
    try {
      response = await fetch(request, init);
    } catch {
      observedStage = "provider_transport_unavailable";
      throw new Error("daily_tracker_market_data_transport");
    }
    if (!response.ok) {
      observedStage = "provider_http_unavailable";
      return response;
    }
    let responseBody: string;
    try {
      responseBody = await response.clone().text();
    } catch {
      observedStage = "provider_payload_unavailable";
      return response;
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(responseBody);
    } catch {
      observedStage = "provider_payload_unavailable";
      return response;
    }
    if (!isSuccessfulKlineResponse(parsed)) {
      observedStage = "provider_semantic_unavailable";
      return response;
    }
    let sanitizedResponse: Readonly<Record<string, unknown>>;
    try {
      sanitizedResponse = sanitizeRawPayload(parsed);
      recordRawCandleTimes(sanitizedResponse, rawCandleTimes);
    } catch {
      observedStage = "provider_payload_unavailable";
      return response;
    }
    rawPages.push(Object.freeze({
      httpStatus: response.status,
      page: rawPages.length + 1,
      response: sanitizedResponse,
      sanitizedResponseSha256: sha256(canonicalJson(sanitizedResponse)),
    }));
    return response;
  });
  const result = await provider.fetch({
    endTime: session.endTime,
    includeExtendedHours: true,
    interval: "1m",
    startTime: session.startTime,
    symbol: input.symbol,
  });
  if (!result.ok) {
    throw new DailyTrackerMarketDataExportUnavailable(providerFailureCategory(result.failureReasonCode, observedStage));
  }
  if (observedStage) {
    throw new DailyTrackerMarketDataExportUnavailable(observedStage);
  }
  if (!result.exchangeTimezone || result.exchangeTimezone !== "America/New_York") {
    throw new DailyTrackerMarketDataExportUnavailable("session_exchange_timezone_invalid");
  }
  if (result.utcOffsetSeconds === null) {
    throw new DailyTrackerMarketDataExportUnavailable("session_provider_offset_absent_or_invalid");
  }
  if (result.utcOffsetSeconds !== expectedNewYorkUtcOffsetSeconds(input.date, session.startTime)) {
    throw new DailyTrackerMarketDataExportUnavailable("session_provider_offset_mismatched");
  }
  if (rawPages.length === 0) {
    throw new DailyTrackerMarketDataExportUnavailable("provider_or_candle_unavailable");
  }
  validateSessionCoverageAndContinuity({
    candles: result.candles,
    date: input.date,
    exchangeTimezone: result.exchangeTimezone,
    providerUtcOffsetSeconds: result.utcOffsetSeconds,
  });
  const rawPagesSha256 = sha256(canonicalJson(rawPages));
  return Object.freeze({
    checksums: Object.freeze({
      algorithm: "sha256" as const,
      normalizedBarsSha256: result.normalizedCandleSha256,
      rawPagesSha256,
    }),
    contract: "traderlink_temporary_owner_daily_tracker_market_export_v1",
    request: Object.freeze({
      date: input.date,
      endTimeUtcSeconds: session.endTime,
      interval: "1m" as const,
      sessionPolicy: SESSION_POLICY,
      startTimeUtcSeconds: session.startTime,
      symbol: input.symbol,
    }),
    session: Object.freeze({
      bars: result.candles,
      corporateActionReview: "required_for_final_pack_acceptance" as const,
      exchangeTimezone: result.exchangeTimezone,
      normalizedCandleSha256: result.normalizedCandleSha256,
      pageCount: rawPages.length,
      priceContinuityGuard: "unadjusted_price_ratio_0.25_to_4_exclusive_v1" as const,
      provider: "moomoo_history_kline" as const,
      providerAdapterVersion: "moomoo_history_kline_v1",
      providerUtcOffsetSeconds: result.utcOffsetSeconds,
      rawPages: Object.freeze(rawPages),
    }),
    temporaryExport: true as const,
  });
}

export function serializeDailyTrackerMarketDataExport(value: DailyTrackerMarketDataExport): string {
  return canonicalJson(value);
}
