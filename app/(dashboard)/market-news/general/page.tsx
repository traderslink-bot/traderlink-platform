import type { Metadata } from "next";
import { DashboardPage, DashboardPanel, DashboardUnavailableState } from "@/app/dashboard-template";
import { requireTraderLinkPlatformServerComponentPageIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { hasGeneralMarketNewsAccess } from "@/src/modules/news/server/general-market-news-access";
import { GeneralMarketNewsFeed } from "./general-market-news-feed";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const metadata: Metadata = { title: "General Market News | TraderLink Platform", robots: { index: false, follow: false } };
export default async function GeneralMarketNewsPage() {
  const identity = await requireTraderLinkPlatformServerComponentPageIdentity();
  if (!hasGeneralMarketNewsAccess(identity)) return <DashboardPage><DashboardPanel title="General Market News">
    <DashboardUnavailableState title="Personal test access required" description="This news feed is available to the two selected test accounts." actionHref="/workspace" actionLabel="Open workspace" />
  </DashboardPanel></DashboardPage>;
  // No article text in RSC/HTML; authenticated no-store APIs supply list and selected body.
  return <GeneralMarketNewsFeed />;
}
