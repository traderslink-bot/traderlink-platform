import type { Metadata } from "next";

import { AnalyticsServerPage } from "../../../analytics-server-page";

export const metadata: Metadata = {
  title: "Timing | Trader Intelligence",
};

export default function TimingPage() {
  return <AnalyticsServerPage page="timing" />;
}
