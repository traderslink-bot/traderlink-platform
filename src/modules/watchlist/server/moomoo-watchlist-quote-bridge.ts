import "server-only";

import { deriveAuthenticatedUserJournalScope } from "@/src/modules/platform/server/authentication/authenticated-user-journal-scope";
import { MoomooConnectionAccessService } from "@/src/modules/platform/server/broker-connections/moomoo-connection-access-service";
import { MoomooConnectionRepository } from "@/src/modules/platform/server/broker-connections/moomoo-connection-repository";
import { openPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";
import { PlatformUserRepository } from "@/src/modules/platform/server/identity/platform-user-repository";
import { TRADERLINK_WATCHLIST_DASHBOARD_NAV_DISCORD_SUBJECT_ENV } from "./access/watchlist-dashboard-navigation-access";

const MOOMOO_API_ORIGIN = "https://webapi.moomoo.com";
const DISCORD_SNOWFLAKE_PATTERN = /^[0-9]{1,32}$/u;
const US_SYMBOL_PATTERN = /^[A-Z][A-Z0-9.-]{0,15}$/u;

/** Bounds publisher work without constraining the normal small Watchlist. */
export const MAX_WATCHLIST_MOOMOO_QUOTE_SYMBOLS = 100;

type MoomooStockQuotePayload = Readonly<{
  ret_code?: unknown;
  data?: Readonly<{ quote_list?: unknown }>;
}>;

type MoomooStockQuote = Readonly<Record<string, unknown>>;

type WatchlistMoomooQuoteFailure =
  | "connection_unavailable"
  | "provider_unavailable"
  | "invalid_response"
  | "request_invalid";

export type WatchlistMoomooQuote = Readonly<{
  symbol: string;
  exchangeTimeMs: number | null;
  lastPrice: number | null;
  preMarketPrice: number | null;
  afterMarketPrice: number | null;
  overnightPrice: number | null;
}>;

export type WatchlistMoomooQuoteResult =
  | Readonly<{ ok: true; quotes: readonly WatchlistMoomooQuote[] }>
  | Readonly<{ ok: false; code: WatchlistMoomooQuoteFailure }>;

function unavailable(code: WatchlistMoomooQuoteFailure): WatchlistMoomooQuoteResult {
  return Object.freeze({ ok: false, code });
}

function configuredWatchlistOwnerSubjects(environment: NodeJS.ProcessEnv): readonly string[] {
  const raw = environment[TRADERLINK_WATCHLIST_DASHBOARD_NAV_DISCORD_SUBJECT_ENV];
  const subjects = raw?.split(",").map((subject) => subject.trim()) ?? [];
  if (subjects.length === 0 || subjects.some((subject) => !DISCORD_SNOWFLAKE_PATTERN.test(subject))) {
    platformFailure("TRADERLINK_BROKER_CONNECTION_ACCESS_DENIED", {
      stage: "watchlist_moomoo_owner_configuration",
    });
  }
  return Object.freeze(subjects);
}

function normalizedSymbols(symbols: readonly string[]): readonly string[] | null {
  if (symbols.length === 0 || symbols.length > MAX_WATCHLIST_MOOMOO_QUOTE_SYMBOLS) return null;
  const normalized = [...new Set(symbols.map((symbol) => symbol.trim().toUpperCase()))];
  if (normalized.length === 0 || normalized.some((symbol) => !US_SYMBOL_PATTERN.test(symbol))) return null;
  return Object.freeze(normalized);
}

function positiveNumberOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null;
}

function safeTimestampOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0 ? value : null;
}

function sessionPrice(quote: MoomooStockQuote, key: "pre_market" | "after_market" | "overnight"): number | null {
  const session = quote[key];
  return session && typeof session === "object" && !Array.isArray(session)
    ? positiveNumberOrNull((session as Record<string, unknown>).price)
    : null;
}

function normalizeQuote(symbol: string, quote: MoomooStockQuote): WatchlistMoomooQuote {
  return Object.freeze({
    symbol,
    exchangeTimeMs: safeTimestampOrNull(quote.data_time),
    lastPrice: positiveNumberOrNull(quote.last_price),
    preMarketPrice: sessionPrice(quote, "pre_market"),
    afterMarketPrice: sessionPrice(quote, "after_market"),
    overnightPrice: sessionPrice(quote, "overnight"),
  });
}

/**
 * Reads only the configured Watchlist owner's encrypted Moomoo OAuth connection.
 * It returns normalized quote facts and never exposes OAuth credentials.
 */
export async function fetchWatchlistMoomooQuotes(
  input: Readonly<{ symbols: readonly string[] }>,
  environment: NodeJS.ProcessEnv = process.env,
  request: typeof fetch = fetch,
): Promise<WatchlistMoomooQuoteResult> {
  const symbols = normalizedSymbols(input.symbols);
  if (!symbols) return unavailable("request_invalid");

  const database = openPlatformDatabase({ mode: "runtime", environment });
  try {
    const users = new PlatformUserRepository(database, {
      allowedAuthProviders: ["discord"],
    });
    const connections = new MoomooConnectionRepository(database);
    const eligibleScopes = configuredWatchlistOwnerSubjects(environment).flatMap((subject) => {
      const user = users.findActiveByAuthIdentity("discord", subject);
      if (!user) return [];
      const scope = deriveAuthenticatedUserJournalScope(database, user.userId);
      const connection = connections.find(scope);
      return connection?.state === "active" && connection.authorizedScopes.includes("quote:read")
        ? [scope]
        : [];
    });
    const scope = eligibleScopes[0];
    if (eligibleScopes.length !== 1 || !scope) {
      platformFailure("TRADERLINK_BROKER_CONNECTION_ACCESS_DENIED", {
        stage: "watchlist_moomoo_connection_cardinality",
      });
    }

    let accessToken: string;
    try {
      accessToken = await new MoomooConnectionAccessService(connections).accessToken(scope);
    } catch {
      return unavailable("connection_unavailable");
    }

    let response: Response;
    try {
      response = await request(`${MOOMOO_API_ORIGIN}/api/v1.0/quote/stock-quote`, {
        method: "POST",
        cache: "no-store",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ code_list: symbols.map((symbol) => `US.${symbol}`) }),
      });
    } catch {
      return unavailable("provider_unavailable");
    }

    let payload: MoomooStockQuotePayload;
    try {
      payload = await response.json() as MoomooStockQuotePayload;
    } catch {
      return unavailable("invalid_response");
    }
    if (!response.ok || payload.ret_code !== 0 || !Array.isArray(payload.data?.quote_list)) {
      return unavailable("provider_unavailable");
    }

    const requestedCodes = new Set(symbols.map((symbol) => `US.${symbol}`));
    const quotesBySymbol = new Map<string, WatchlistMoomooQuote>();
    for (const candidate of payload.data.quote_list) {
      if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) continue;
      const quote = candidate as MoomooStockQuote;
      const code = typeof quote.code === "string" ? quote.code.toUpperCase() : "";
      if (!requestedCodes.has(code)) continue;
      const symbol = code.slice("US.".length);
      quotesBySymbol.set(symbol, normalizeQuote(symbol, quote));
    }
    return Object.freeze({
      ok: true,
      quotes: Object.freeze(symbols.flatMap((symbol) => {
        const quote = quotesBySymbol.get(symbol);
        return quote ? [quote] : [];
      })),
    });
  } finally {
    database.close();
  }
}