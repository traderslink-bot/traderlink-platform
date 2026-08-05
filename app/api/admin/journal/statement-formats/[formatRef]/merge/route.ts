import { JournalStatementFormatCommandService } from "@/src/modules/journal/server/administration/journal-statement-format-command-service";
import { createJournalAdminReadContext, resolveJournalAdminInternalId } from "@/src/modules/journal/server/administration/journal-admin-read-helpers";
import {
  consumeJournalAdminRateLimit,
  journalAdminMutationCorrelation,
  requireJournalAdminMutationRequest,
  requireJournalAdminPermission,
} from "@/src/modules/platform/server/administration/platform-admin-request-security";
import { createCanonicalUtcTimestamp, platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";
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
  context: { params: Promise<{ formatRef: string }> },
): Promise<Response> {
  try {
    requireJournalAdminMutationRequest(request);
    const [body, { formatRef }] = await Promise.all([request.json(), context.params]);
    if (!isRecord(body) || typeof body.retainedFormatRef !== "string" ||
      !Number.isSafeInteger(body.expectedDuplicateRevision) ||
      !Number.isSafeInteger(body.expectedRetainedRevision)) {
      platformFailure("TRADERLINK_JOURNAL_ADMIN_MUTATION_INVALID");
    }
    const retainedFormatRef = body.retainedFormatRef;
    return withJournalAdminRequest(request, (database, scope) => {
      requireJournalAdminPermission(scope, "manage_statement_formats");
      consumeJournalAdminRateLimit({
        category: "sensitive",
        headers: request.headers,
        userId: scope.userId,
      });
      const readContext = createJournalAdminReadContext({ database, scope });
      const duplicate = resolveJournalAdminInternalId(
        readContext,
        formatRef,
        ["statement_format"],
      );
      const retained = resolveJournalAdminInternalId(
        readContext,
        retainedFormatRef,
        ["statement_format"],
      );
      const result = new JournalStatementFormatCommandService({ database, scope }).merge({
        duplicateCandidateId: duplicate.internalId,
        retainedCandidateId: retained.internalId,
        expectedDuplicateRevision: Number(body.expectedDuplicateRevision),
        expectedRetainedRevision: Number(body.expectedRetainedRevision),
        correlationRefSha256: journalAdminMutationCorrelation({
          requestHeaders: request.headers,
          scope,
          action: "statement_format_merged",
          targetKind: "statement_format",
          internalTargetId: duplicate.internalId,
        }),
        timestamp: createCanonicalUtcTimestamp(),
      });
      return journalAdminJson({ status: "ready", merge: result });
    });
  } catch (error) {
    return journalAdminUnavailable(error);
  }
}
