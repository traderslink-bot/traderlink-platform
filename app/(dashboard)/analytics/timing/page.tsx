import type { Metadata } from "next";

import { TimingAnalyticsPage } from "./timing-analytics-page";

export const metadata: Metadata = {
  title: "Timing | TraderLink",
};

export default function TimingPage() {
  return <TimingAnalyticsPage />;
}
