import type { Metadata } from "next";

import { requireTraderLinkPlatformPageScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";

import TradeExplorerClient from "./trade-explorer-client";
import { readTradeExplorerPageModel } from "./trade-explorer-service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Trade Explorer | TraderLink Platform",
  description: "Compare your confirmed Journal trade results.",
};

export default async function TradeExplorerPage() {
  const scope = await requireTraderLinkPlatformPageScope();
  return <TradeExplorerClient model={readTradeExplorerPageModel(scope)} />;
}
