import type { Metadata } from "next";
import AnalyticsPage from "../page";

export const metadata: Metadata = {
  title: "Analytics Ticker Stories | Trader Intelligence",
};

export const dynamic = "force-dynamic";

export default async function AnalyticsTickerStoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ demo?: string | string[] | undefined }>;
}) {
  const query = await searchParams;

  return AnalyticsPage({
    searchParams: Promise.resolve({
      ...query,
      view: "ticker_stories",
    }),
  });
}
