import type { Metadata } from "next";
import { Stack, Typography } from "@mui/material";

import { DashboardPage, DashboardPanel, DashboardSecondaryAction } from "@/app/dashboard-template";
import { requireTraderLinkPlatformPageIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { currentJournalAccountSelectionRef } from "@/src/modules/platform/server/authentication/journal-account-selection-authorization";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { JournalAccountRepository } from "@/src/modules/journal/server/accounts/journal-account-repository";
import { JournalDemoAccountRepository } from "@/src/modules/journal/server/demo/journal-demo-account-repository";
import { journalScopeCurrentDate } from "@/src/modules/journal/server/demo/journal-demo-scope-clock";
import { evaluateMembershipFeature } from "@/src/modules/platform/server/membership/platform-membership-access";
import { SharedAnalyzerAllowanceRepository } from "@/src/modules/level-analysis/server/shared-analyzer-allowance-repository";
import { withSavedPatternRuntime } from "@/src/modules/level-analysis/server/trend-momentum-pattern-runtime";
import { pageSavedAnalyzedTrades } from "@/src/modules/level-analysis/server/trend-momentum-analyzed-trades";
import { ClearDemoDataAction } from "../demo-data-callout";
import { readWorkspaceTradeLibrary } from "../workspace/workspace-trade-library";
import { readAnalyzerTrade, toAnalyzerTrade } from "./analyzer-trade-data";
import { ANALYZED_TRADES_HREF, type AnalyzerTrade } from "./analyzer-trade";
import { TradeAnalyzerHome } from "./trade-analyzer-home";

export const metadata: Metadata = { title: "Trade Analyzer | TraderLink Platform" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;

export default async function TradeAnalyzerPage({ searchParams }: {
  searchParams: Promise<{ basis?: string; cursor?: string; event?: string; interval?: string; trade?: string; view?: string }>;
}) {
  const [identity, query] = await Promise.all([requireTraderLinkPlatformPageIdentity(), searchParams]);
  const scope = identity.scope;
  const tradeId = typeof query.trade === "string" && UUID.test(query.trade) ? query.trade : null;
  const cursor = typeof query.cursor === "string" && /^[A-Za-z0-9_-]{1,4096}$/u.test(query.cursor)
    ? query.cursor : null;
  const model = withReadonlyPlatformDatabase({}, (database) => {
    const allows = (feature: string) => identity.mode === "local_development" ||
      evaluateMembershipFeature(database, scope.userId, feature).allowed;
    if (!allows("journal.access") && !allows("analytics.access")) return { status: "plan_required" } as const;
    const account = scope.activeAccountId
      ? new JournalAccountRepository(database).findActiveAccount(scope.workspaceId, scope.activeAccountId)
      : null;
    if (!account) return { status: "account_required" } as const;
    const demo = new JournalDemoAccountRepository(database).findActiveAccount(scope) !== null;
    const detail = tradeId ? readAnalyzerTrade(database, scope, tradeId) : null;
    const pendingQuery = {
      afterCursor: query.view === "to-analyze" ? cursor : null, awaitingAnalysis: true, endDate: null,
      filter: "closed", followDashboardPeriod: false, group: "none",
      searchTicker: "", sort: "newest", startDate: null,
    } as const;
    const readPending = () => {
      try {
        return readWorkspaceTradeLibrary(database, scope, pendingQuery);
      } catch (error) {
        if (!pendingQuery.afterCursor || !(error instanceof Error) ||
            error.message !== "TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED") throw error;
        return readWorkspaceTradeLibrary(database, scope, { ...pendingQuery, afterCursor: null });
      }
    };
    const pending = !demo && query.view === "to-analyze" ? readPending() : null;
    return {
      status: "ready" as const, demo, account, detail,
      canEnter: !demo && allows("journal.manual_entry"),
      availability: demo ? null : new SharedAnalyzerAllowanceRepository(database).availability(scope.userId),
      pending: pending?.rows.map(toAnalyzerTrade) ?? [],
      pendingCursor: pending?.continuationCursor ?? null,
      pendingAvailable: pending?.projectionState !== "unavailable",
      firstPendingPage: pending?.query.afterCursor == null,
    };
  });

  if (model.status !== "ready") {
    const planRequired = model.status === "plan_required";
    return (
      <DashboardPage>
        <Typography component="h1" variant="h1">Trade Analyzer</Typography>
        <DashboardPanel title={planRequired ? "Trade Analyzer access" : "Set up a trading account"}>
          <Stack spacing={1.5} sx={{ alignItems: "flex-start" }}>
            <Typography color="text.secondary" variant="body2">
              {planRequired
                ? "Explore plans that include access to your saved trades."
                : "Open your Trading Journal to set up an account for the trades you want to analyze."}
            </Typography>
            <DashboardSecondaryAction href={planRequired ? "/plans" : "/workspace"}>
              {planRequired ? "See plans" : "Open Trading Journal"}
            </DashboardSecondaryAction>
          </Stack>
        </DashboardPanel>
      </DashboardPage>
    );
  }

  const expectedAccountSelectionRef = currentJournalAccountSelectionRef(scope);
  const demoPage = model.demo
    ? await withSavedPatternRuntime(scope, { basis: "gross", startDate: null, endDate: null, includePatterns: false }, ({ trades, timezone, runtime }) => {
        const input = {
          query: new URLSearchParams(), timezone,
          scopeIdentity: `${scope.workspaceId}:${scope.activeAccountId}:${runtime.reportingCurrency}`,
          pageSize: 25, cursor, ticker: "",
        };
        return pageSavedAnalyzedTrades(trades, input) ??
          pageSavedAnalyzedTrades(trades, { ...input, cursor: null });
      })
    : null;
  const demoTrades: AnalyzerTrade[] = demoPage?.rows.map((trade) => ({
    id: trade.roundTripId,
    symbol: trade.symbol,
    direction: trade.direction,
    currency: model.account.baseCurrency,
    entryDate: trade.trackerDate,
    entryTime: new Intl.DateTimeFormat("en-CA", {
      hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
      timeZone: model.account.tradingTimezone,
    }).format(new Date(trade.openedAtUtc)),
    closed: true,
    swing: false,
    executions: [],
  })) ?? [];
  const detail = model.detail ?? demoTrades.find((trade) => trade.id === tradeId) ?? null;

  return (
    <DashboardPage>
      {model.demo ? (
        <Stack sx={{ maxWidth: 640 }}>
          <DashboardPanel title="Explore Trade Analyzer with demo data">
            <Typography color="text.secondary" variant="body2">
              Your account comes with sample trades from August for demonstration. Choose an analyzed trade to see its chart, entry and exit markers, and Trade Analysis card. Clear the demo data when you’re ready to enter and analyze your own trades.
            </Typography>
            <Stack sx={{ alignItems: "flex-start", mt: 1.5 }}>
              <ClearDemoDataAction expectedAccountSelectionRef={expectedAccountSelectionRef} />
            </Stack>
          </DashboardPanel>
        </Stack>
      ) : null}
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ alignItems: { sm: "center" }, justifyContent: "space-between", pr: model.demo ? 0 : { sm: 6 } }}>
        <Typography component="h1" variant="h1">Trade Analyzer</Typography>
        <DashboardSecondaryAction href={ANALYZED_TRADES_HREF} sx={{ alignSelf: { xs: "flex-start", sm: "auto" } }}>
          Your analyzed trades
        </DashboardSecondaryAction>
      </Stack>
      <TradeAnalyzerHome
        key={expectedAccountSelectionRef}
        accountCurrency={model.account.baseCurrency}
        availability={model.availability}
        accountTimezone={model.account.tradingTimezone}
        canEnter={model.canEnter}
        defaultDate={journalScopeCurrentDate(null, model.account.tradingTimezone)}
        demo={model.demo}
        expectedAccountSelectionRef={expectedAccountSelectionRef}
        list={model.demo ? demoTrades : model.pending}
        listAvailable={model.pendingAvailable}
        continuationCursor={model.demo ? demoPage?.continuationCursor ?? null : model.pendingCursor}
        firstPage={model.demo ? cursor === null : model.firstPendingPage}
        initialView={model.demo || query.view === "to-analyze" ? "list" : "entry"}
        initialTrade={detail}
        missingRequestedTrade={typeof query.trade === "string" && !detail}
        initialBasis={query.basis === "gross" || query.basis === "net" ? query.basis : undefined}
        initialInterval={query.interval === "5m" ? "5m" : "1m"}
        selectedEventId={typeof query.event === "string" && query.event.length <= 128 ? query.event : null}
      />
    </DashboardPage>
  );
}
