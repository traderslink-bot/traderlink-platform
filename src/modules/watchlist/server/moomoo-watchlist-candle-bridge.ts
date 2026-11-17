import "server-only";
import { sharedMoomooFetch, TRADERLINK_MOOMOO_SHARED_BUDGET_ENV } from "@/src/modules/platform/server/broker-connections/moomoo-shared-transport";
import { marketDataEnvironment } from "@/src/modules/market-data/server/provider-settings";
import { alpacaMarketDataEnabled } from "@/src/modules/scanner/alpaca/client";
import { fetchAlpacaWatchlistCandles } from "@/src/modules/scanner/alpaca/watchlist-adapter";
import { createHash } from "node:crypto";

import type { MarketDataProviderResult, MarketDataRequest } from "@/src/modules/level-analysis/contracts/candle-review-contracts";
import { MoomooDailyTradeKlineMarketDataProvider } from "@/src/modules/level-analysis/server/providers/moomoo-daily-trade-kline-market-data-provider";
import { deriveAuthenticatedUserJournalScope } from "@/src/modules/platform/server/authentication/authenticated-user-journal-scope";
import { openPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";
import { PlatformUserRepository } from "@/src/modules/platform/server/identity/platform-user-repository";
import { MoomooConnectionAccessService } from "@/src/modules/platform/server/broker-connections/moomoo-connection-access-service";
import { MoomooConnectionRepository } from "@/src/modules/platform/server/broker-connections/moomoo-connection-repository";
import { TRADERLINK_WATCHLIST_DASHBOARD_NAV_DISCORD_SUBJECT_ENV } from "./access/watchlist-dashboard-navigation-access";

const DISCORD_SNOWFLAKE_PATTERN = /^[0-9]{1,32}$/u;

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

/** One server-side shared connection, selected in configured owner order. */
function sharedMoomooConnection(database: ReturnType<typeof openPlatformDatabase>, environment: NodeJS.ProcessEnv) {
  const users = new PlatformUserRepository(database, { allowedAuthProviders: ["discord"] });
  const connections = new MoomooConnectionRepository(database);
  for (const subject of configuredWatchlistOwnerSubjects(environment)) {
    const user = users.findActiveByAuthIdentity("discord", subject);
    if (!user) continue;
    const scope = deriveAuthenticatedUserJournalScope(database, user.userId);
    const connection = connections.find(scope);
    if (connection?.state === "active" && connection.authorizedScopes.includes("quote:read")) {
      return { connections, scope, connectionId: connection.connectionId };
    }
  }
  return null;
}

/** Reads local authorization only: no token refresh or provider request. */
export function readSharedMoomooConnectionStatus(environment: NodeJS.ProcessEnv = process.env): Readonly<{ ready: boolean }> {
  const database = openPlatformDatabase({ mode: "runtime", environment });
  try { return { ready: sharedMoomooConnection(database, environment) !== null }; }
  finally { database.close(); }
}

/** Credentials remain inside this authorized server callback. */
export async function withSharedMoomooMarketDataAccess<T>(
  consume: (access: Readonly<{ token: string; requestScope: string }>) => Promise<T>,
  environment: NodeJS.ProcessEnv = process.env,
): Promise<T> {
  const database = openPlatformDatabase({ mode: "runtime", environment });
  try {
    const selected = sharedMoomooConnection(database, environment);
    if (!selected) platformFailure("TRADERLINK_BROKER_CONNECTION_ACCESS_DENIED", { stage: "shared_quote_connection" });
    const token = await new MoomooConnectionAccessService(selected.connections).accessToken(selected.scope);
    const refreshed = selected.connections.find(selected.scope);
    if (refreshed?.state !== "active" || !refreshed.authorizedScopes.includes("quote:read") || refreshed.connectionId !== selected.connectionId) {
      platformFailure("TRADERLINK_BROKER_CONNECTION_ACCESS_DENIED", { stage: "shared_quote_scope_after_refresh" });
    }
    // Keep the existing admission scope so all consumers share the same budget.
    const requestScope = createHash("sha256").update(`watchlist-indicators:${selected.connectionId}`).digest("hex");
    return await consume({ token, requestScope });
  } finally { database.close(); }
}

/** Compatibility entry point; the signature and shared admission scope are unchanged. */
export const withWatchlistIndicatorMoomooAccess = withSharedMoomooMarketDataAccess;

/**
 * Fetches same-day candles for the local official Watchlist runtime. The runtime
 * is authenticated with its existing publisher credential; the selected user's
 * Moomoo OAuth credential remains encrypted and server-only inside Platform.
 */
export async function fetchWatchlistMoomooCandles(
  request: MarketDataRequest,
  environment: NodeJS.ProcessEnv = process.env,
): Promise<MarketDataProviderResult> {
  const effectiveEnvironment = marketDataEnvironment("watchlist", environment);
  if (alpacaMarketDataEnabled(effectiveEnvironment)) return fetchAlpacaWatchlistCandles(request, effectiveEnvironment);
  return withSharedMoomooMarketDataAccess(async access => {
    return new MoomooDailyTradeKlineMarketDataProvider(
      async () => access.token,
      (url, init) => sharedMoomooFetch(url, init, { priority: "watchlist", requireEnabled: true,
        environment: { ...effectiveEnvironment, [TRADERLINK_MOOMOO_SHARED_BUDGET_ENV]: "true" } }),
      { completeHistory: true },
    ).fetch(request);
  }, environment);
}
