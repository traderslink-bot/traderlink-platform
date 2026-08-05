import { createJournalAdminReadContext } from "@/src/modules/journal/server/administration/journal-admin-read-helpers";
import { PlatformAdminSystemService } from "@/src/modules/platform/server/administration/platform-admin-system-service";
import {
  journalAdminJson,
  journalAdminUnavailable,
  withJournalAdminRequest,
} from "../admin-route-runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request: Request): Response {
  try {
    return withJournalAdminRequest(request, (database, scope) => {
      const context = createJournalAdminReadContext({ database, scope });
      return journalAdminJson({
        status: "ready",
        system: new PlatformAdminSystemService(context).read(),
      });
    });
  } catch (error) {
    return journalAdminUnavailable(error);
  }
}
