import type { Metadata } from "next";

import { ManualEntryFoundation } from "../../dashboard-action-foundations";

export const metadata: Metadata = {
  title: "Manual Entry | Trader Intelligence",
};

export const dynamic = "force-dynamic";

export default function ManualEntryPage() {
  return <ManualEntryFoundation />;
}
