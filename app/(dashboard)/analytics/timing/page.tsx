import type { Metadata } from "next";

import { AnalyticsPageFoundation } from "../../../dashboard-route-foundations";

export const metadata: Metadata = {
  title: "Timing | Trader Intelligence",
};

export default function TimingPage() {
  return (
    <AnalyticsPageFoundation
      chartTitle="Time-of-day performance"
      supportingTitle="Session breakdown"
    />
  );
}
