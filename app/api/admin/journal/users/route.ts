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
    if (status !== null && status !== "active" && status !== "disabled") {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "status" });
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
          },
        }),
      }));
  } catch (error) {
    return journalAdminUnavailable(error);
  }
}
