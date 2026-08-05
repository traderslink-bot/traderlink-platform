import { JournalStatementFormatService } from "@/src/modules/journal/server/administration/journal-statement-format-service";
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
    return withJournalAdminRequest(request, (database, scope) =>
      journalAdminJson({
        status: "ready",
        statementFormats: new JournalStatementFormatService({ database, scope }).list({
          cursor: url.searchParams.get("cursor"),
          pageSize: journalAdminPageSizeFromUrl(url),
          state: url.searchParams.get("state") ?? undefined,
          brokerLabel: url.searchParams.get("brokerLabel") ?? undefined,
        }),
      }));
  } catch (error) {
    return journalAdminUnavailable(error);
  }
}
