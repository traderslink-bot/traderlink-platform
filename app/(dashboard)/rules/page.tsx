import type { Metadata } from "next";

import { withReadonlyJournalAnnotations } from "@/src/modules/journal/server/annotations/journal-annotation-runtime";
import { readJournalTradingRulesDashboard } from "@/src/modules/journal/server/annotations/journal-trading-rules-dashboard";
import {
  currentJournalAccountSelectionRef,
  requireTraderLinkPlatformPageScope,
} from "@/src/modules/platform/server/authentication/require-platform-request-scope";

import { RulesClient } from "./rules-client";

export const metadata: Metadata = {
  title: "Trading Rules | Trader Intelligence",
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
  return <RulesClient initialView={initialView} />;
}
