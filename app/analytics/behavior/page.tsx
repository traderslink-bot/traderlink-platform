import type { Metadata } from "next";
import AnalyticsPage from "../page";

export const metadata: Metadata = {
  title: "Analytics Behavior | Trader Intelligence",
};

export const dynamic = "force-dynamic";

export default async function AnalyticsBehaviorPage({
  searchParams,
}: {
  searchParams: Promise<{ demo?: string | string[] | undefined }>;
}) {
  const query = await searchParams;

  return AnalyticsPage({
    searchParams: Promise.resolve({
      ...query,
      view: "behavior",
    }),
  });
}
