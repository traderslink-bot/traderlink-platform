import type { Metadata } from "next";

import { DashboardPage } from "../../dashboard-template";

import { JournalImportClient } from "./journal-import-client";

export const metadata: Metadata = {
  title: "Import Trades | TraderLink Platform",
};

export const dynamic = "force-dynamic";

export default function ImportsPage() {
  return (
    <DashboardPage>
      <JournalImportClient />
    </DashboardPage>
  );
}
