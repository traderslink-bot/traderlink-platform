import "server-only";

import { withJournalAnalyticsReportingDashboardRuntime } from "@/src/modules/journal-analytics/server/journal-analytics-dashboard-runtime";
import { withReadonlyJournalAnnotations } from "@/src/modules/journal/server/annotations/journal-annotation-runtime";
import { readJournalTradingRulesDashboard } from "@/src/modules/journal/server/annotations/journal-trading-rules-dashboard";
import { journalReportingCurrencyMultiplier } from "@/src/modules/journal-analytics/server/journal-reporting-currency-fact-set";
import { listJournalRuleIdeas } from "@/src/modules/journal/server/rule-ideas/journal-rule-idea-runtime";
import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { currentJournalAccountSelectionRef } from "@/src/modules/platform/server/authentication/require-platform-request-scope";

import { getReplacementTradeTrackerAccount } from "../trade-tracker/trade-tracker-platform-data";

export async function readTradingRulesPageModel(scope: WorkspaceAccessScope) {
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
  return Object.freeze({ account, initialRuleIdeas, initialView, ...reporting });
}
