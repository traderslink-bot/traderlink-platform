import type { Metadata } from "next";

import { JournalProductReadService } from "@/src/modules/journal/server/product/journal-product-read-service";
import {
  currentJournalAccountSelectionRef,
  requireTraderLinkPlatformPageScope,
} from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";

import { JournalDataDecisionsClient } from "./journal-data-decisions-client";

export const metadata: Metadata = {
  title: "Data Decisions | TraderLink Platform",
};

export const dynamic = "force-dynamic";

function importBatchFilter(value: string | string[] | undefined): string | null {
  const candidate = Array.isArray(value) ? value[0] : value;
  return candidate && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u.test(candidate)
    ? candidate
    : null;
}

export default async function DataDecisionsPage({
  searchParams,
}: {
  searchParams: Promise<{ importBatchId?: string | string[] }>;
}) {
  const scope = await requireTraderLinkPlatformPageScope();
  const selectedImportBatchId = importBatchFilter((await searchParams).importBatchId);
  const accountId = scope.activeAccountId;
  if (!accountId) throw new Error("TRADERLINK_ACCOUNT_ACCESS_DENIED");
  const initial = withReadonlyPlatformDatabase({}, (database) =>
    new JournalProductReadService(database).listDataDecisions({
      userId: scope.userId,
      workspaceId: scope.workspaceId,
      workspaceRole: scope.workspaceRole,
      accountId,
    }));
  return (
    <JournalDataDecisionsClient
      expectedAccountSelectionRef={currentJournalAccountSelectionRef(scope)}
      initial={initial}
      selectedImportBatchId={selectedImportBatchId}
    />
  );
}
