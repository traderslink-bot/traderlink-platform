import { createJournalAdminReadContext } from "@/src/modules/journal/server/administration/journal-admin-read-helpers";
import { PlatformAdminAuditService } from "@/src/modules/platform/server/administration/platform-admin-audit-service";
import {
  journalAdminJson,
  journalAdminPageSizeFromUrl,
  journalAdminUnavailable,
  withJournalAdminRequest,
} from "../admin-route-runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request: Request): Response {
  try {
    const url = new URL(request.url);
    return withJournalAdminRequest(request, (database, scope) => {
      const context = createJournalAdminReadContext({ database, scope });
      return journalAdminJson({
        status: "ready",
        audit: new PlatformAdminAuditService(context).list({
          cursor: url.searchParams.get("cursor"),
          pageSize: journalAdminPageSizeFromUrl(url),
          action: url.searchParams.get("action") ?? undefined,
          outcome: url.searchParams.get("outcome") ?? undefined,
          targetKind: url.searchParams.get("targetKind") ?? undefined,
        }),
      });
    });
  } catch (error) {
    return journalAdminUnavailable(error);
  }
}
