import { JournalAdminDecisionService } from "@/src/modules/journal/server/administration/journal-admin-decision-service";
import {
  journalAdminJson,
  journalAdminUnavailable,
  optionalBoolean,
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
        dataDecisions: new JournalAdminDecisionService({ database, scope }).read({
          issueCode: url.searchParams.get("issueCode") ?? undefined,
          targetKind: url.searchParams.get("targetKind") ?? undefined,
          brokerLabel: url.searchParams.get("brokerLabel") ?? undefined,
          unresolvedOnly: optionalBoolean(
            url.searchParams.get("unresolvedOnly"),
            "unresolvedOnly",
          ),
        }),
      }));
  } catch (error) {
    return journalAdminUnavailable(error);
  }
}
