import type { Metadata } from "next";

import { DataDecisionsRepairPreview } from "./data-decisions-repair-preview";

export const metadata: Metadata = {
  title: "Data Decisions | Trader Intelligence",
};

export const dynamic = "force-dynamic";

export default function DataDecisionsPage() {
  return <DataDecisionsRepairPreview />;
}
