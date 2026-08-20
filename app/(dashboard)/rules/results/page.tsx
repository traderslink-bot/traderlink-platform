import type { Metadata } from "next";

import { OfflineSavedViewCapture } from "@/app/pwa/offline-saved-view-capture";
import {
  JOURNAL_OFFLINE_ROUTE_VIEW_KEYS,
  JOURNAL_OFFLINE_ROUTE_VIEW_VERSION,
  journalOfflineRouteCoverage,
  type JournalRuleResultsOfflineViewModel,
} from "@/src/modules/journal/contracts/journal-offline-route-view-contracts";
import { requireTraderLinkPlatformPageScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";

import { RuleResultsClient } from "./rule-results-client";
import { readRuleResults } from "./rule-results-data";

export const metadata: Metadata = {
  title: "Rule Results | Trade Tracker",
  description: "Factual preset and manual trading-rule results.",
};
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

export default async function RuleResultsPage() {
  const scope = await requireTraderLinkPlatformPageScope();
  const initialView = await readRuleResults(scope);
  const model: JournalRuleResultsOfflineViewModel = Object.freeze({
    initialView,
    kind: "rule-results",
    version: 1,
  });
  return (
    <>
      <OfflineSavedViewCapture
        accountTimezone={null}
        calculationVersion="journal-rule-results-v1"
        coverage={journalOfflineRouteCoverage("rule-results")}
        generatedAtUtc={new Date().toISOString()}
        model={model}
        pathname="/rules/results"
        queryIdentity="current"
        reportingCurrency={initialView.currency}
        routeViewVersion={JOURNAL_OFFLINE_ROUTE_VIEW_VERSION}
        viewKey={JOURNAL_OFFLINE_ROUTE_VIEW_KEYS["rule-results"]}
      />
      <RuleResultsClient initialView={initialView} />
    </>
  );
}
