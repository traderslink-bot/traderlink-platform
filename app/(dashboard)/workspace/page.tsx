import type { Metadata } from "next";

import { WorkspaceDashboard } from "./workspace-dashboard";

export const metadata: Metadata = {
  title: "Workspace | Trader Intelligence",
  description: "Trader Intelligence performance, manual entry, and day sessions.",
};

export const dynamic = "force-dynamic";

export default function WorkspacePage() {
  return <WorkspaceDashboard />;
}
