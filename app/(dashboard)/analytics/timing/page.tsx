import type { Metadata } from "next";

import { TimingAnalyticsPage } from "./timing-analytics-page";

export const metadata: Metadata = {
  title: "Timing | TraderLink",
};

export default async function TimingPage({
  searchParams,
}: {
  searchParams: Promise<{ basis?: string | string[] | undefined }>;
}) {
  return <TimingAnalyticsPage searchParams={searchParams} />;
}
