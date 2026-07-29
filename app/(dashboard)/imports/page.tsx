import type { Metadata } from "next";

import { BrokerCsvImportClient } from "../../broker-csv-import-client";
import { DashboardPage } from "../../dashboard-template";

export const metadata: Metadata = {
  title: "Import Trades | Trader Intelligence",
};

export const dynamic = "force-dynamic";

export default function ImportsPage() {
  return (
    <DashboardPage>
      <BrokerCsvImportClient />
    </DashboardPage>
  );
}
