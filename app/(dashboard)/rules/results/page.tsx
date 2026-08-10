import type { Metadata } from "next";

import { requireTraderLinkPlatformPageScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";

import { RuleResultsClient } from "./rule-results-client";
import { readRuleResults } from "./rule-results-data";

export const metadata: Metadata = {
  title: "Rule Results | Trader Intelligence",
  description: "Factual preset and manual trading-rule results.",
};
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

export default async function RuleResultsPage() {
  const scope = await requireTraderLinkPlatformPageScope();
  return <RuleResultsClient initialView={readRuleResults(scope)} />;
}
