import "server-only";

import { createHash } from "node:crypto";

import type { NormalizedMarketCandle } from "@/src/modules/level-analysis/contracts/candle-review-contracts";
import { newYorkExtendedSession } from "@/src/modules/level-analysis/server/daily-trade-analyzer-session";
import { MoomooDailyTradeKlineMarketDataProvider } from "@/src/modules/level-analysis/server/providers/moomoo-daily-trade-kline-market-data-provider";
import type { TraderLinkPlatformRequestIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { deriveAuthenticatedUserJournalScope } from "@/src/modules/platform/server/authentication/authenticated-user-journal-scope";
import { readProtectedInitialOwnerDiscordSubject } from "@/src/modules/platform/server/authentication/platform-discord-configuration";
import { MoomooConnectionAccessService } from "@/src/modules/platform/server/broker-connections/moomoo-connection-access-service";
import { MoomooConnectionRepository } from "@/src/modules/platform/server/broker-connections/moomoo-connection-repository";
import { PlatformOperatorRepository } from "@/src/modules/platform/server/administration/platform-operator-repository";
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
  | "configured_owners_unresolved"
  | "eligible_connection_cardinality_invalid"
  | "provider_or_candle_unavailable"
  | "selected_token_expired_or_under_15_minutes";

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
    throw new DailyTrackerMarketDataExportUnavailable("provider_or_candle_unavailable");
  }
  const expectedCount = (session.endTime - session.startTime) / 60;
  if (input.candles.length !== expectedCount) throw new DailyTrackerMarketDataExportUnavailable("provider_or_candle_unavailable");
  let prior: NormalizedMarketCandle | null = null;
  for (const [index, candle] of input.candles.entries()) {
    if (candle.time !== session.startTime + index * 60) {
      throw new DailyTrackerMarketDataExportUnavailable("provider_or_candle_unavailable");
    }
    if (prior) {
      const ratio = Number(candle.openDecimal) / Number(prior.closeDecimal);
      if (!Number.isFinite(ratio) || ratio <= 0 || ratio >= 4 || ratio <= 0.25) {
        throw new DailyTrackerMarketDataExportUnavailable("provider_or_candle_unavailable");
      }
    }
    prior = candle;
  }
}

export type AuthorizedDailyTrackerMarketDataExport = Readonly<{
  accessToken: () => Promise<string>;
  close: () => void;
}>;

function configuredOwnerMatches(
  database: ReturnType<typeof openReadonlyPlatformDatabase>,
  userId: string,
): boolean {
  const ownerSubject = readProtectedInitialOwnerDiscordSubject();
  if (!ownerSubject) return false;
  return database.prepare<[string, string], Readonly<{ matches: 0 | 1 }>>(`SELECT EXISTS(
SELECT 1
FROM platform_auth_identities
WHERE user_id = ?
  AND auth_provider = 'discord'
  AND auth_subject = ?
  AND status = 'active'
) AS matches`).get(userId, ownerSubject)?.matches === 1;
}

function configuredSharedMoomooOwnerSubjects(
  environment: NodeJS.ProcessEnv = process.env,
): readonly string[] {
  const subjects = environment[TRADERLINK_WATCHLIST_DASHBOARD_NAV_DISCORD_SUBJECT_ENV]
    ?.split(",")
    .map((subject) => subject.trim()) ?? [];
  if (
    subjects.length !== 2 ||
    new Set(subjects).size !== 2 ||
    subjects.some((subject) => !DISCORD_SNOWFLAKE_PATTERN.test(subject))
  ) {
    throw new DailyTrackerMarketDataExportUnavailable("configured_owners_unresolved");
  }
  return Object.freeze(subjects);
}

export function authorizeOwnerDailyTrackerMarketDataExport(
  identity: TraderLinkPlatformRequestIdentity,
): AuthorizedDailyTrackerMarketDataExport {
  const database = openReadonlyPlatformDatabase();
  try {
    const activeGrant = new PlatformOperatorRepository(database).findActive();
    if (
      identity.scope.workspaceRole !== "owner" ||
      !configuredOwnerMatches(database, identity.scope.userId) ||
      !activeGrant || activeGrant.userId !== identity.scope.userId
    ) {
      throw new DailyTrackerMarketDataExportDenied();
    }
    const users = new PlatformUserRepository(database, { allowedAuthProviders: ["discord"] });
    const connections = new MoomooConnectionRepository(database);
    const ownerSubjects = configuredSharedMoomooOwnerSubjects();
    const resolvedOwners = ownerSubjects.flatMap((subject) => {
      const user = users.findActiveByAuthIdentity("discord", subject);
      return user ? [user] : [];
    });
    if (resolvedOwners.length !== ownerSubjects.length) {
      throw new DailyTrackerMarketDataExportUnavailable("configured_owners_unresolved");
    }
    const eligibleScopes = resolvedOwners.flatMap((user) => {
      const scope = deriveAuthenticatedUserJournalScope(database, user.userId);
      const connection = connections.find(scope);
      return connection?.state === "active" && connection.authorizedScopes.includes("quote:read")
        ? [scope]
        : [];
    });
    const designatedConnectionScope = eligibleScopes[0];
    if (eligibleScopes.length !== 1 || !designatedConnectionScope) {
      throw new DailyTrackerMarketDataExportUnavailable("eligible_connection_cardinality_invalid");
    }
    const connection = connections.find(designatedConnectionScope);
    const expiresAt = Date.parse(connection?.accessTokenExpiresAtUtc ?? "");
    if (
      !connection || connection.state !== "active" ||
      !connection.authorizedScopes.includes("quote:read") ||
      !Number.isFinite(expiresAt) || expiresAt - Date.now() <= MIN_TOKEN_LIFETIME_MILLISECONDS
    ) {
      throw new DailyTrackerMarketDataExportUnavailable("selected_token_expired_or_under_15_minutes");
    }
    const access = new MoomooConnectionAccessService(connections);
    return Object.freeze({
      accessToken: () => access.accessToken(designatedConnectionScope),
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
  const provider = new MoomooDailyTradeKlineMarketDataProvider(input.authorized.accessToken, async (request, init) => {
  if (rawPages.length >= MAX_PAGES) throw new DailyTrackerMarketDataExportUnavailable("provider_or_candle_unavailable");
    const response = await fetch(request, init);
    const responseBody = await response.clone().text();
    let parsed: unknown;
    try {
      parsed = JSON.parse(responseBody);
    } catch {
      throw new DailyTrackerMarketDataExportUnavailable("provider_or_candle_unavailable");
    }
    const sanitizedResponse = sanitizeRawPayload(parsed);
    recordRawCandleTimes(sanitizedResponse, rawCandleTimes);
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

