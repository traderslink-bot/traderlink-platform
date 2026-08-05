import { JournalStatementFormatCommandService, type JournalStatementFormatCandidateState } from "@/src/modules/journal/server/administration/journal-statement-format-command-service";
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

const STATES = new Set<JournalStatementFormatCandidateState>([
  "mapping_available",
  "ready_for_development",
  "in_development",
  "validating",
  "supported",
  "rejected",
]);

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
    if (!isRecord(body) || !Number.isSafeInteger(body.expectedRevision) ||
      typeof body.newState !== "string" ||
      !STATES.has(body.newState as JournalStatementFormatCandidateState) ||
      (body.rejectionReasonCode !== undefined &&
        typeof body.rejectionReasonCode !== "string")) {
      platformFailure("TRADERLINK_JOURNAL_ADMIN_MUTATION_INVALID");
    }
    return withJournalAdminRequest(request, (database, scope) => {
      requireJournalAdminPermission(scope, "manage_statement_formats");
      consumeJournalAdminRateLimit({
        category: "sensitive",
        headers: request.headers,
        userId: scope.userId,
      });
      const readContext = createJournalAdminReadContext({ database, scope });
      const { internalId } = resolveJournalAdminInternalId(
        readContext,
        formatRef,
        ["statement_format"],
      );
      const result = new JournalStatementFormatCommandService({ database, scope })
        .transition({
          candidateId: internalId,
          expectedRevision: Number(body.expectedRevision),
          newState: body.newState as JournalStatementFormatCandidateState,
          rejectionReasonCode: body.rejectionReasonCode as string | undefined,
          correlationRefSha256: journalAdminMutationCorrelation({
            requestHeaders: request.headers,
            scope,
            action: "statement_format_transitioned",
            targetKind: "statement_format",
            internalTargetId: internalId,
          }),
          timestamp: createCanonicalUtcTimestamp(),
        });
      return journalAdminJson({ status: "ready", transition: result });
    });
  } catch (error) {
    return journalAdminUnavailable(error);
  }
}
