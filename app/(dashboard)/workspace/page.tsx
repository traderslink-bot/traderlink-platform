import type { Metadata } from "next";

import { WorkspaceDashboard } from "./workspace-dashboard";
import { requireTraderIntelligenceOwnerPageAccess } from "@/src/lib/trader-intelligence-v3/auth";

export const metadata: Metadata = {
  title: "Workspace | Trader Intelligence",
  description: "Trader Intelligence performance, manual entry, and day sessions.",
};

export const dynamic = "force-dynamic";

export default async function WorkspacePage() {
  await requireTraderIntelligenceOwnerPageAccess();
  return <WorkspaceDashboard />;
}
