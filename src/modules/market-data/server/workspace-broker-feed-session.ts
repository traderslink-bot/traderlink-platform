import "server-only";

import { easternClock, activeSession } from "@/src/modules/scanner/live/sessions";
import { marketDay } from "@/src/modules/scanner/live/server/runtime";
import { readWorkspaceMoomooAccess } from "./workspace-moomoo-access";
import { readWorkspaceMarketSettings } from "./workspace-market-settings-store";
import { subscribeWorkspaceMoomooCards } from "./workspace-moomoo-card-feed";
import type { WorkspaceQuoteSession } from "../workspace-moomoo-quotes";
import type { BrokerReadings } from "../workspace-broker-rows";

type Access = NonNullable<ReturnType<typeof readWorkspaceMoomooAccess>>;

export function openWorkspaceBrokerFeed(request: Request, access: Access, notify: () => void) {
  const scope = access.identity.scope;
  const connection = access.connection;
  const key = JSON.stringify([scope.userId, scope.workspaceId, connection?.generation]);
  const feed = connection && subscribeWorkspaceMoomooCards(key, connection, notify);
  let lastChecked = 0;
  let allowed = true;
  const current = () => {
    if (connection) return connection.current();
    const now = Date.now();
    if (now - lastChecked < 1000) return allowed;
    lastChecked = now;
    const latest = readWorkspaceMoomooAccess(request);
    allowed = latest?.identity.scope.userId === scope.userId && latest?.identity.scope.workspaceId === scope.workspaceId && !latest.connection;
    return allowed;
  };
  return {
    current,
    update(symbols: readonly string[], snapshotDate?: string) {
      const now = Date.now();
      const { date } = easternClock(now);
      const day = marketDay(date);
      const session = activeSession(day, now);
      const context: WorkspaceQuoteSession | null = session && (!snapshotDate || snapshotDate === date)
        ? { date, session, regularCloseMinute: day.regularCloseEastern === "13:00" ? 780 : 960 } : null;
      if (feed && current()) feed.update(symbols, context, readWorkspaceMarketSettings());
      return context?.session ?? null;
    },
    read(symbol: string): BrokerReadings {
      if (!feed) return {};
      const currentQuote = feed.quote(symbol);
      return currentQuote ? { ...currentQuote, activity: feed.activity(symbol), relativeVolume: feed.relativeVolume(symbol) } : {};
    },
    status: () => feed?.status() ?? "connection_required" as const,
    close: () => feed?.close(),
  };
}
