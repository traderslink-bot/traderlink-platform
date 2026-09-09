import "server-only";

import { createHash } from "node:crypto";

import type { NormalizedMarketCandle } from "@/src/modules/level-analysis/contracts/candle-review-contracts";
import { hasStrictlyIncreasingCandleTimes } from "@/src/modules/level-analysis/server/daily-trade-analyzer-candle-coverage";
import { newYorkExtendedSession } from "@/src/modules/level-analysis/server/daily-trade-analyzer-session";
import { MoomooDailyTradeKlineMarketDataProvider } from "@/src/modules/level-analysis/server/providers/moomoo-daily-trade-kline-market-data-provider";
import type { TraderLinkPlatformRequestIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { SharedAnalyzerAllowanceRepository } from "@/src/modules/level-analysis/server/shared-analyzer-allowance-repository";
import { MoomooConnectionAccessService } from "@/src/modules/platform/server/broker-connections/moomoo-connection-access-service";
import { MoomooConnectionRepository } from "@/src/modules/platform/server/broker-connections/moomoo-connection-repository";
import { openReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";

const MIN_TOKEN_LIFETIME_MILLISECONDS = 60_000;
const SESSION_POLICY = "america_new_york_extended_0400_2000_v1";

const ALLOWED_SESSIONS = Object.freeze(new Map<string, ReadonlySet<string>>([
  ["2026-08-03", new Set(["RITR", "HYFM", "DFNS", "UPC"])],
  ["2026-08-04", new Set(["AMIX", "QNME", "LSH"])],
  ["2026-08-05", new Set(["YXT", "INLF"])],
  ["2026-08-06", new Set(["THH", "GLMD", "MBAI", "PFSA"])],
  ["2026-08-07", new Set(["VSTD", "YJ", "MB", "MNST"])],
  ["2026-08-10", new Set(["NXTT", "SXTC", "ONFO", "TNON"])],
  ["2026-08-11", new Set(["GLMD", "PFSA", "WXM"])],
  ["2026-08-12", new Set(["BOXL", "RMCF", "OFAL", "ADTX"])],
  ["2026-08-13", new Set(["XHG", "FGI"])],
  ["2026-08-14", new Set(["WETO", "MDXH", "CAPR", "BANL"])],
  ["2026-08-25", new Set(["ANF", "BHVN", "BZ", "SEDG", "SMTC", "SMMT"])],
  ["2026-08-26", new Set(["YYGH", "CRE", "SOAR", "XPON", "WSHP"])],
  ["2026-08-28", new Set(["FTFT", "FNGR", "PSQL", "CHAI"])],
  ["2026-08-31", new Set(["AEHL", "NCRA", "GPRO"])],
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
  | "provider_or_candle_unavailable"
  | "requester_connection_unavailable"
  | "session_candles_unavailable"
  | "session_metadata_unavailable";

export class DailyTrackerMarketDataExportDenied extends Error {}
export class DailyTrackerMarketDataExportInvalid extends Error {}
export class DailyTrackerMarketDataExportUnavailable extends Error {
  constructor(readonly category: DailyTrackerMarketDataExportUnavailableCategory = "provider_or_candle_unavailable") {
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
  return /^\d{4}-\d{2}-\d{2}$/u.test(input.date) &&
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
    throw new DailyTrackerMarketDataExportUnavailable();
  }
  const payload = value as Record<string, unknown>;
  const data = payload.data;
  const dataRecord = data && typeof data === "object" && !Array.isArray(data)
    ? data as Record<string, unknown>
    : null;
  const klineList = dataRecord?.kline_list;
  if (!dataRecord || !Array.isArray(klineList)) {
    throw new DailyTrackerMarketDataExportUnavailable();
  }
  const allowedKlineFields = [
    "close", "close_price", "high", "high_price", "low", "low_price",
    "open", "open_price", "time_key", "time_zone", "turnover", "volume",
  ];
  const safeKlines = klineList.map((entry) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      throw new DailyTrackerMarketDataExportUnavailable();
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
    throw new DailyTrackerMarketDataExportUnavailable("session_metadata_unavailable");
  }
  if (input.candles.length === 0 || !hasStrictlyIncreasingCandleTimes(input.candles)) {
    throw new DailyTrackerMarketDataExportUnavailable("session_candles_unavailable");
  }
  let prior: NormalizedMarketCandle | null = null;
  for (const candle of input.candles) {
    if (candle.time < session.startTime || candle.time > session.endTime) {
      throw new DailyTrackerMarketDataExportUnavailable("session_candles_unavailable");
    }
    if (prior) {
      const ratio = Number(candle.openDecimal) / Number(prior.closeDecimal);
      if (!Number.isFinite(ratio) || ratio <= 0 || ratio >= 4 || ratio <= 0.25) {
        throw new DailyTrackerMarketDataExportUnavailable("session_candles_unavailable");
      }
    }
    prior = candle;
  }
}

export type AuthorizedDailyTrackerMarketDataExport = Readonly<{
  accessToken: () => Promise<string>;
  close: () => void;
}>;

function isDesignatedSharedAnalyzerRequester(
  identity: TraderLinkPlatformRequestIdentity,
  designated: NonNullable<ReturnType<SharedAnalyzerAllowanceRepository["designatedScope"]>>,
): boolean {
  return identity.scope.userId === designated.userId &&
    identity.scope.workspaceId === designated.workspaceId;
}

export function authorizeOwnerDailyTrackerMarketDataExport(
  identity: TraderLinkPlatformRequestIdentity,
): AuthorizedDailyTrackerMarketDataExport {
  const database = openReadonlyPlatformDatabase();
  try {
    // This temporary export may use only the same designated server-side Moomoo
    // scope that the ordinary shared Trade Analyzer uses. It never authorizes
    // another account's connection or makes the credential visible to the caller.
    const designated = new SharedAnalyzerAllowanceRepository(database).designatedScope();
    if (!designated || !isDesignatedSharedAnalyzerRequester(identity, designated)) {
      throw new DailyTrackerMarketDataExportDenied();
    }
    const designatedScope = Object.freeze({
      ...designated,
      activeAccountId: designated.accountId,
      allowedAccountIds: Object.freeze([designated.accountId]),
    });
    const connections = new MoomooConnectionRepository(database);
    const connection = connections.find(designatedScope);
    const expiresAt = Date.parse(connection?.accessTokenExpiresAtUtc ?? "");
    if (
      !connection || connection.state !== "active" ||
      !connection.authorizedScopes.includes("quote:read") ||
      !Number.isFinite(expiresAt) || expiresAt - Date.now() <= MIN_TOKEN_LIFETIME_MILLISECONDS
    ) {
      throw new DailyTrackerMarketDataExportUnavailable("requester_connection_unavailable");
    }
    const access = new MoomooConnectionAccessService(connections);
    return Object.freeze({
      accessToken: () => access.accessToken(designatedScope),
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
  const provider = new MoomooDailyTradeKlineMarketDataProvider(input.authorized.accessToken, async (request, init) => {
    const response = await fetch(request, init);
    const responseBody = await response.clone().text();
    let parsed: unknown;
    try {
      parsed = JSON.parse(responseBody);
    } catch {
      throw new DailyTrackerMarketDataExportUnavailable();
    }
    const sanitizedResponse = sanitizeRawPayload(parsed);
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
  if (!result.ok || !result.exchangeTimezone || result.utcOffsetSeconds === null || rawPages.length === 0) {
    throw new DailyTrackerMarketDataExportUnavailable();
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
