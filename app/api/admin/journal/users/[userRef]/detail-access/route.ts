import { JournalAdminUserService } from "@/src/modules/journal/server/administration/journal-admin-user-service";
import { createJournalAdminReadContext, resolveJournalAdminInternalId } from "@/src/modules/journal/server/administration/journal-admin-read-helpers";
import { requireJournalAdminPermission, requireJournalAdminMutationRequest } from "@/src/modules/platform/server/administration/platform-admin-request-security";
import { parseJournalAdminSensitiveAccessReason, recordJournalAdminSensitiveAccess } from "@/src/modules/platform/server/administration/platform-admin-sensitive-access";
import { platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";
import {
  journalAdminJson,
  journalAdminUnavailable,
  withJournalAdminRequest,
} from "../../../admin-route-runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function POST(
  request: Request,
  context: { params: Promise<{ userRef: string }> },
): Promise<Response> {
  try {
    requireJournalAdminMutationRequest(request);
    const [body, { userRef }] = await Promise.all([request.json(), context.params]);
    if (!isRecord(body)) platformFailure("TRADERLINK_JOURNAL_ADMIN_MUTATION_INVALID");
    const reasonCode = parseJournalAdminSensitiveAccessReason(body.reasonCode);
    return withJournalAdminRequest(request, (database, scope) => {
      requireJournalAdminPermission(scope, "read_user_details");
      const now = new Date();
      const readContext = createJournalAdminReadContext({ database, scope, now });
      const resolved = resolveJournalAdminInternalId(readContext, userRef, ["user"]);
      const detail = new JournalAdminUserService({
        database,
        scope,
        configuration: readContext.configuration,
        now,
      }).detail(userRef);
      recordJournalAdminSensitiveAccess({
        database,
        scope,
        headers: request.headers,
        action: "user_detail_accessed",
        targetKind: "user",
        internalId: resolved.internalId,
        reasonCode,
        outcome: detail ? "success" : "failed",
        nowUtc: readContext.nowUtc,
      });
      if (!detail) platformFailure("TRADERLINK_JOURNAL_ADMIN_ACCESS_DENIED");
      return journalAdminJson({ status: "ready", user: detail });
    });
  } catch (error) {
    return journalAdminUnavailable(error);
  }
}
