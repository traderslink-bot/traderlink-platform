import type { Metadata } from "next";

import { DaySessionsFoundation } from "../../../dashboard-route-foundations";

export const metadata: Metadata = {
  title: "Day Sessions | Trader Intelligence",
};

export default function DaySessionsPage() {
  return <DaySessionsFoundation />;
}
