import { JournalStatementFormatService } from "@/src/modules/journal/server/administration/journal-statement-format-service";
import {
  journalAdminJson,
  journalAdminUnavailable,
  withJournalAdminRequest,
} from "../../admin-route-runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(
  request: Request,
  context: { params: Promise<{ formatRef: string }> },
): Promise<Response> {
  return context.params.then(({ formatRef }) => {
    try {
      return withJournalAdminRequest(request, (database, scope) => {
        const detail = new JournalStatementFormatService({ database, scope }).detail(formatRef);
        return detail
          ? journalAdminJson({ status: "ready", statementFormat: detail })
          : journalAdminJson({ status: "not_found" }, 404);
      });
    } catch (error) {
      return journalAdminUnavailable(error);
    }
  });
}
