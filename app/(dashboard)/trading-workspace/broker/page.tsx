import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DashboardPage } from "@/app/dashboard-template";
import { requireTraderLinkPlatformPageIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { workspaceMoomooAccessForIdentity } from "@/src/modules/market-data/server/workspace-moomoo-access";
import { WorkspaceBrokerChartProvider } from "../../charts/workspace-broker-chart-context";
import { LiveScreenersClient } from "../../screeners/workspace/live-screeners-client";

export const metadata: Metadata = { title: "Connected Workspace | TraderLink Platform" };
export const dynamic = "force-dynamic";

export default async function ConnectedWorkspacePage() {
  const identity = await requireTraderLinkPlatformPageIdentity();
  const access = workspaceMoomooAccessForIdentity(identity);
  if (!access) notFound();

  return <DashboardPage>
    <WorkspaceBrokerChartProvider>
      <LiveScreenersClient broker brokerConnected={Boolean(access.connection)} />
    </WorkspaceBrokerChartProvider>
  </DashboardPage>;
}
