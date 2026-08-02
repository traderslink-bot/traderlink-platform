import type { Metadata } from "next";

import { requireTraderLinkPlatformPageScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";

import AnalyticsLabPlatformClient from "./analytics-lab-platform-client";
import { readAnalyticsLabPlatformPageModel } from "./analytics-lab-platform-service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Analytics Lab | TraderLink Platform",
  description: "Build custom analytics views from replacement Journal facts.",
};

export default async function AnalyticsLabPage() {
  const scope = await requireTraderLinkPlatformPageScope();
  return <AnalyticsLabPlatformClient model={readAnalyticsLabPlatformPageModel(scope)} />;
}
