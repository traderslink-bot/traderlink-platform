import type { Metadata } from "next";

import { requireTraderLinkPlatformPageIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { StockLevelsClient } from "./stock-levels-client";

export const metadata: Metadata = { title: "Support and Resistance Generator | TraderLink Platform" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function StockLevelsPage() {
  await requireTraderLinkPlatformPageIdentity();
  return <StockLevelsClient />;
}
