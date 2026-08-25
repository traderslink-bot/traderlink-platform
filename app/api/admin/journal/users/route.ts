import { JournalAdminUserService } from "@/src/modules/journal/server/administration/journal-admin-user-service";
import { platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";
import {
  journalAdminJson,
  journalAdminPageSizeFromUrl,
  journalAdminUnavailable,
  optionalBoolean,
  withJournalAdminRequest,
} from "../admin-route-runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request: Request): Response {
  try {
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const view = url.searchParams.get("view");
    const filter = url.searchParams.get("filter");
    if (status !== null && status !== "active" && status !== "disabled") {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "status" });
    }
    if (view !== null && !["new_academy_members", "getting_started", "needs_attention"].includes(view)) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "view" });
    }
    if (filter !== null && !["academy_progress", "source_not_recorded", "never_signed_in", "online_now", "journal_started", "journal_not_started", "successful_import", "failed_import", "pending_import", "manual_entries", "broker_connected", "broker_statement_source", "no_broker_evidence"].includes(filter)) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "filter" });
    }
    return withJournalAdminRequest(request, (database, scope) =>
      journalAdminJson({
        status: "ready",
        users: new JournalAdminUserService({ database, scope }).list({
          cursor: url.searchParams.get("cursor"),
          pageSize: journalAdminPageSizeFromUrl(url),
          filters: {
            status: status ?? undefined,
            provider: url.searchParams.get("provider") ?? undefined,
            productionRegistered: optionalBoolean(
              url.searchParams.get("productionRegistered"),
              "productionRegistered",
            ),
            activated: optionalBoolean(url.searchParams.get("activated"), "activated"),
            hasSuccessfulImport: optionalBoolean(
              url.searchParams.get("hasSuccessfulImport"),
              "hasSuccessfulImport",
            ),
            hasUnresolvedDecisions: optionalBoolean(
              url.searchParams.get("hasUnresolvedDecisions"),
              "hasUnresolvedDecisions",
            ),
            multipleAccounts: optionalBoolean(
              url.searchParams.get("multipleAccounts"),
              "multipleAccounts",
            ),
            signedInSinceUtc: url.searchParams.get("signedInSinceUtc") ?? undefined,
            view: view === null
              ? undefined
              : view as "new_academy_members" | "getting_started" | "needs_attention",
            filter: filter === null
              ? undefined
              : filter as "academy_progress" | "source_not_recorded" | "never_signed_in" | "online_now" | "journal_started" | "journal_not_started" | "successful_import" | "failed_import" | "pending_import" | "manual_entries" | "broker_connected" | "broker_statement_source" | "no_broker_evidence",
          },
        }),
      }));
  } catch (error) {
    return journalAdminUnavailable(error);
  }
}
