import type { Metadata } from "next";

import { OfflineSavedViewCapture } from "@/app/pwa/offline-saved-view-capture";
import {
  createJournalTradingRulesOfflineViewModel,
  JOURNAL_OFFLINE_ROUTE_VIEW_KEYS,
  JOURNAL_OFFLINE_ROUTE_VIEW_VERSION,
  journalOfflineRouteCoverage,
} from "@/src/modules/journal/contracts/journal-offline-route-view-contracts";
import {
  requireTraderLinkPlatformPageScope,
} from "@/src/modules/platform/server/authentication/require-platform-request-scope";

import { RulesClient } from "./rules-client";
import { readTradingRulesPageModel } from "./rules-page-data";

export const metadata: Metadata = {
  title: "Trading Rules | Trade Tracker",
  description: "Create and manage deterministic, versioned trading rules.",
};

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

export default async function TradingRulesPage() {
  const scope = await requireTraderLinkPlatformPageScope();
  const model = await readTradingRulesPageModel(scope);
  return (
    <>
    <OfflineSavedViewCapture
      accountTimezone={model.account?.tradingTimezone ?? null}
      calculationVersion="journal-trading-rules-v1"
      coverage={journalOfflineRouteCoverage("trading-rules")}
      generatedAtUtc={new Date().toISOString()}
      model={createJournalTradingRulesOfflineViewModel({
        initialRuleIdeas: model.initialRuleIdeas,
        initialView: model.initialView,
        monetaryMultiplier: model.monetaryMultiplier,
        reportingCurrency: model.reportingCurrency,
        sourceCurrency: model.sourceCurrency,
      })}
      pathname="/rules"
      queryIdentity="current"
      reportingCurrency={model.reportingCurrency}
      routeViewVersion={JOURNAL_OFFLINE_ROUTE_VIEW_VERSION}
      viewKey={JOURNAL_OFFLINE_ROUTE_VIEW_KEYS["trading-rules"]}
    />
    <RulesClient
      initialView={model.initialView}
      initialRuleIdeas={model.initialRuleIdeas}
      monetaryMultiplier={model.monetaryMultiplier}
      reportingCurrency={model.reportingCurrency}
      sourceCurrency={model.sourceCurrency}
    />
    </>
  );
}
