import "server-only";
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

/**
 * Indicator transport access. The callback stays on the server; it must never
 * return credentials in a response, cache, event or audit snapshot. The existing
 * AI candle route below intentionally keeps its current provider behavior.
 */
export async function withWatchlistIndicatorMoomooAccess<T>(
  consume: (access: Readonly<{ token: string; requestScope: string }>) => Promise<T>,
  environment: NodeJS.ProcessEnv = process.env,
): Promise<T> {
  const database = openPlatformDatabase({ mode: "runtime", environment });
  try {
    const users = new PlatformUserRepository(database, { allowedAuthProviders: ["discord"] });
    const connections = new MoomooConnectionRepository(database);
    const eligible = configuredWatchlistOwnerSubjects(environment).flatMap(subject => {
      const user = users.findActiveByAuthIdentity("discord", subject);
      if (!user) return [];
      const scope = deriveAuthenticatedUserJournalScope(database, user.userId);
      const connection = connections.find(scope);
      return connection?.state === "active" && connection.authorizedScopes.includes("quote:read")
        ? [{ scope, connectionId: connection.connectionId }] : [];
    });
    if (eligible.length !== 1) platformFailure("TRADERLINK_BROKER_CONNECTION_ACCESS_DENIED", { stage: "indicator_connection_cardinality" });
    const selected = eligible[0]!;
    const token = await new MoomooConnectionAccessService(connections).accessToken(selected.scope);
    const refreshed = connections.find(selected.scope);
    if (refreshed?.state !== "active" || !refreshed.authorizedScopes.includes("quote:read") || refreshed.connectionId !== selected.connectionId) {
      platformFailure("TRADERLINK_BROKER_CONNECTION_ACCESS_DENIED", { stage: "indicator_quote_scope_after_refresh" });
    }
    // An opaque internal admission scope, not an exported account identifier.
    const requestScope = createHash("sha256").update(`watchlist-indicators:${selected.connectionId}`).digest("hex");
    return await consume({ token, requestScope });
  } finally { database.close(); }
}

/**
 * Fetches same-day candles for the local official Watchlist runtime. The runtime
 * is authenticated with its existing publisher credential; the selected user's
 * Moomoo OAuth credential remains encrypted and server-only inside Platform.
 */
export async function fetchWatchlistMoomooCandles(
  request: MarketDataRequest,
  environment: NodeJS.ProcessEnv = process.env,
): Promise<MarketDataProviderResult> {
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
    const access = new MoomooConnectionAccessService(connections);
    return await new MoomooDailyTradeKlineMarketDataProvider(
      () => access.accessToken(scope),
    ).fetch(request);
  } finally {
    database.close();
  }
}
