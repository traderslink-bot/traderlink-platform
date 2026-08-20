import type { Metadata } from "next";

import { requireTraderLinkPlatformPageScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";

import { readTradeExplorerPageModel } from "../trade-explorer-service";
import { listTradeExplorerComparisonStudies } from "../trade-explorer-comparison-study-runtime";
import TradeExplorerComparisonClient from "./trade-explorer-comparison-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Compare trades | TraderLink Platform",
  description: "Compare two to four factual groups of your completed trades.",
};

export default async function TradeExplorerComparisonPage() {
  const scope = await requireTraderLinkPlatformPageScope();
  const [model, studies] = await Promise.all([
    readTradeExplorerPageModel(scope),
    Promise.resolve(listTradeExplorerComparisonStudies(scope)),
  ]);
  return <TradeExplorerComparisonClient initialStudies={studies} model={model} />;
}
