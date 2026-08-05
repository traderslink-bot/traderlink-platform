import { JournalAdminOverviewService } from "@/src/modules/journal/server/administration/journal-admin-overview-service";
import {
  journalAdminJson,
  journalAdminUnavailable,
  withJournalAdminRequest,
} from "../admin-route-runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request: Request): Response {
  try {
    return withJournalAdminRequest(request, (database, scope) =>
      journalAdminJson({
        status: "ready",
        overview: new JournalAdminOverviewService({ database, scope }).read(),
      }));
  } catch (error) {
    return journalAdminUnavailable(error);
  }
}
