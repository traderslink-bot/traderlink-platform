import type { Metadata } from "next";

import { AnalyticsLabFoundation } from "../../../dashboard-route-foundations";

export const metadata: Metadata = {
  title: "Analytics Lab | Trader Intelligence",
};

export default function AnalyticsLabPage() {
  return <AnalyticsLabFoundation />;
}
