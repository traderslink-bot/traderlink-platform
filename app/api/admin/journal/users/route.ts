import { JournalAdminUserService } from "@/src/modules/journal/server/administration/journal-admin-user-service";
import { platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";
import { requireJournalAdminMutationRequest, requireJournalAdminPermission } from "@/src/modules/platform/server/administration/platform-admin-request-security";
import { parseJournalAdminSensitiveAccessReason, recordJournalAdminSensitiveAccess } from "@/src/modules/platform/server/administration/platform-admin-sensitive-access";
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
    if (filter !== null && !["academy_progress", "source_not_recorded", "never_signed_in", "online_now", "journal_started", "journal_not_started", "successful_import", "failed_import", "pending_import", "pending_decision", "manual_entries", "manual_entry_issues", "broker_connected", "broker_statement_source", "no_broker_evidence"].includes(filter)) {
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
              : filter as "academy_progress" | "source_not_recorded" | "never_signed_in" | "online_now" | "journal_started" | "journal_not_started" | "successful_import" | "failed_import" | "pending_import" | "pending_decision" | "manual_entries" | "manual_entry_issues" | "broker_connected" | "broker_statement_source" | "no_broker_evidence",
          },
        }),
      }));
  } catch (error) {
    return journalAdminUnavailable(error);
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    requireJournalAdminMutationRequest(request);
    const body: unknown = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body) ||
      !("action" in body) || body.action !== "deletion_history") {
      platformFailure("TRADERLINK_JOURNAL_ADMIN_MUTATION_INVALID");
    }
    const input = body as { reasonCode?: unknown; cursor?: unknown };
    const reasonCode = parseJournalAdminSensitiveAccessReason(input.reasonCode);
    if (input.cursor !== undefined && input.cursor !== null &&
      (typeof input.cursor !== "string" || input.cursor.length > 2_000 || input.cursor.length === 0)) {
      platformFailure("TRADERLINK_JOURNAL_ADMIN_MUTATION_INVALID");
    }
    const cursor = typeof input.cursor === "string" ? input.cursor : null;
    return withJournalAdminRequest(request, (database, scope) => {
      requireJournalAdminPermission(scope, "read_user_details");
      const now = new Date();
      const service = new JournalAdminUserService({ database, scope, now });
      const audit = (outcome: "success" | "failed") => recordJournalAdminSensitiveAccess({
        database, scope, headers: request.headers, action: "user_detail_accessed",
        targetKind: "authority", internalId: "account_erasure_history", view: "erasure_history",
        reasonCode, outcome, nowUtc: now.toISOString(),
      });
      let history: ReturnType<JournalAdminUserService["erasureHistory"]>;
      try {
        history = service.erasureHistory(cursor);
      } catch (error) {
        audit("failed");
        throw error;
      }
      // Fail closed if the required sensitive-access audit cannot be persisted.
      audit(history.status === "ready" ? "success" : "failed");
      return journalAdminJson({ status: "ready", history });
    });
  } catch (error) {
    return journalAdminUnavailable(error);
  }
}
