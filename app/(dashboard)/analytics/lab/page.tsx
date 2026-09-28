import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { requireMembershipPageScope } from "@/src/modules/platform/server/membership/platform-membership-page-access";

import AnalyticsLabPlatformClient from "./analytics-lab-platform-client";
import { readAnalyticsLabPlatformPageModel } from "./analytics-lab-platform-service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Analytics Lab | TraderLink Platform",
  description: "Build custom analytics views from Trade Tracker facts.",
};

export default async function AnalyticsLabPage() {
  redirect("/analytics");
  const scope = await requireMembershipPageScope("analytics.access");
  return <AnalyticsLabPlatformClient model={await readAnalyticsLabPlatformPageModel(scope)} />;
}
