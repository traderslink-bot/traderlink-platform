import type { Metadata } from "next";

import {
  currentJournalAccountSelectionRef,
  requireTraderLinkPlatformPageScope,
} from "@/src/modules/platform/server/authentication/require-platform-request-scope";

import { DashboardPage } from "../../dashboard-template";

import { JournalImportClient } from "./journal-import-client";

export const metadata: Metadata = {
  title: "Import Trades | TraderLink Platform",
};

export const dynamic = "force-dynamic";

export default async function ImportsPage() {
  const scope = await requireTraderLinkPlatformPageScope();
  return (
    <DashboardPage>
      <JournalImportClient
        expectedAccountSelectionRef={currentJournalAccountSelectionRef(scope)}
      />
    </DashboardPage>
  );
}
