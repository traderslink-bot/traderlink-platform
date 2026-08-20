import type { Metadata } from "next";

import { OfflineSavedViewCapture } from "@/app/pwa/offline-saved-view-capture";
import {
  createJournalTradingRulesOfflineViewModel,
  JOURNAL_OFFLINE_ROUTE_VIEW_KEYS,
  JOURNAL_OFFLINE_ROUTE_VIEW_VERSION,
  journalOfflineRouteCoverage,
} from "@/src/modules/journal/contracts/journal-offline-route-view-contracts";
import { withReadonlyJournalAnnotations } from "@/src/modules/journal/server/annotations/journal-annotation-runtime";
import { readJournalTradingRulesDashboard } from "@/src/modules/journal/server/annotations/journal-trading-rules-dashboard";
import {
  currentJournalAccountSelectionRef,
  requireTraderLinkPlatformPageScope,
} from "@/src/modules/platform/server/authentication/require-platform-request-scope";

import { RulesClient } from "./rules-client";
import { getReplacementTradeTrackerAccount } from "../trade-tracker/trade-tracker-platform-data";
import { withJournalAnalyticsReportingDashboardRuntime } from
  "@/src/modules/journal-analytics/server/journal-analytics-dashboard-runtime";
import { journalReportingCurrencyMultiplier } from
  "@/src/modules/journal-analytics/server/journal-reporting-currency-fact-set";
import { listJournalRuleIdeas } from
  "@/src/modules/journal/server/rule-ideas/journal-rule-idea-runtime";

export const metadata: Metadata = {
  title: "Trading Rules | Trade Tracker",
  description: "Create and manage deterministic, versioned trading rules.",
};

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

export default async function TradingRulesPage() {
  const scope = await requireTraderLinkPlatformPageScope();
  const initialView = withReadonlyJournalAnnotations(
    scope,
    (service, account) => readJournalTradingRulesDashboard(
      service,
      account,
      currentJournalAccountSelectionRef(scope),
    ),
  );
  const account = getReplacementTradeTrackerAccount(scope);
  const initialRuleIdeas = listJournalRuleIdeas(scope);
  const reporting = await withJournalAnalyticsReportingDashboardRuntime(
    scope,
    ({ reportingContext, reportingCurrency }) => {
      const sourceCurrency = account?.baseCurrency ?? reportingCurrency;
      const sourceDate = reportingContext.requestedAtUtc.slice(0, 10);
      return Object.freeze({
        monetaryMultiplier: journalReportingCurrencyMultiplier(
          sourceCurrency,
          sourceDate,
          reportingContext,
        ),
        reportingCurrency,
        sourceCurrency,
      });
    },
  );
  return (
    <>
    <OfflineSavedViewCapture
      accountTimezone={account?.tradingTimezone ?? null}
      calculationVersion="journal-trading-rules-v1"
      coverage={journalOfflineRouteCoverage("trading-rules")}
      generatedAtUtc={new Date().toISOString()}
      model={createJournalTradingRulesOfflineViewModel({
        initialRuleIdeas,
        initialView,
        monetaryMultiplier: reporting.monetaryMultiplier,
        reportingCurrency: reporting.reportingCurrency,
        sourceCurrency: reporting.sourceCurrency,
      })}
      pathname="/rules"
      queryIdentity="current"
      reportingCurrency={reporting.reportingCurrency}
      routeViewVersion={JOURNAL_OFFLINE_ROUTE_VIEW_VERSION}
      viewKey={JOURNAL_OFFLINE_ROUTE_VIEW_KEYS["trading-rules"]}
    />
    <RulesClient
      initialView={initialView}
      initialRuleIdeas={initialRuleIdeas}
      monetaryMultiplier={reporting.monetaryMultiplier}
      reportingCurrency={reporting.reportingCurrency}
      sourceCurrency={reporting.sourceCurrency}
    />
    </>
  );
}
