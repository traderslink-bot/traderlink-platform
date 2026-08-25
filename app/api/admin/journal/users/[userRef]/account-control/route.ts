import { JournalAdminUserControlService, type JournalAdminUserControlAction } from "@/src/modules/journal/server/administration/journal-admin-user-control-service";
import { requireJournalAdminMutationRequest, requireJournalAdminPermission, journalAdminMutationCorrelation } from "@/src/modules/platform/server/administration/platform-admin-request-security";
import { platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";
import { journalAdminJson, journalAdminUnavailable, withJournalAdminRequest } from "../../../admin-route-runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function record(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }

export async function POST(request: Request, context: { params: Promise<{ userRef: string }> }): Promise<Response> {
  try {
    requireJournalAdminMutationRequest(request);
    const [body, { userRef }] = await Promise.all([request.json(), context.params]);
    if (!record(body) || !["disable", "enable", "sign_out_all"].includes(String(body.action)) || typeof body.confirmation !== "string" || typeof body.reasonCode !== "string") platformFailure("TRADERLINK_JOURNAL_ADMIN_MUTATION_INVALID");
    return withJournalAdminRequest(request, (database, scope) => {
      requireJournalAdminPermission(scope, "manage_users");
      const action = body.action as JournalAdminUserControlAction;
      const result = new JournalAdminUserControlService({ database, scope }).execute({
        userRef, action, confirmation: body.confirmation as string, reasonCode: body.reasonCode as string,
        correlationRefSha256: journalAdminMutationCorrelation({ requestHeaders: request.headers, scope, action, targetKind: "user", internalTargetId: userRef }),
      });
      return journalAdminJson({ status: "ready", result });
    });
  } catch (error) { return journalAdminUnavailable(error); }
}
