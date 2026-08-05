import { JournalDeveloperPackageService } from "@/src/modules/journal/server/administration/journal-developer-package-service";
import { createJournalAdminReadContext, resolveJournalAdminInternalId } from "@/src/modules/journal/server/administration/journal-admin-read-helpers";
import {
  consumeJournalAdminRateLimit,
  journalAdminMutationCorrelation,
  journalAdminPrivateHeaders,
  requireJournalAdminMutationRequest,
  requireJournalAdminPermission,
} from "@/src/modules/platform/server/administration/platform-admin-request-security";
import { createCanonicalUtcTimestamp, platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";
import {
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
    if (!isRecord(body) || !Number.isSafeInteger(body.expectedRevision)) {
      platformFailure("TRADERLINK_JOURNAL_ADMIN_MUTATION_INVALID");
    }
    return withJournalAdminRequest(request, (database, scope) => {
      requireJournalAdminPermission(scope, "export_developer_packages");
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
      const result = new JournalDeveloperPackageService({ database, scope }).create({
        candidateId: internalId,
        candidateRef: formatRef,
        expectedRevision: Number(body.expectedRevision),
        correlationRefSha256: journalAdminMutationCorrelation({
          requestHeaders: request.headers,
          scope,
          action: "developer_package_created",
          targetKind: "statement_format",
          internalTargetId: internalId,
        }),
        timestamp: createCanonicalUtcTimestamp(),
      });
      return new Response(Buffer.from(result.bytes), {
        status: 200,
        headers: journalAdminPrivateHeaders({
          "content-disposition": `attachment; filename="${result.filename}"`,
          "content-length": String(result.bytes.byteLength),
          "content-security-policy": "default-src 'none'; frame-ancestors 'none'",
          "content-type": result.contentType,
        }),
      });
    });
  } catch (error) {
    return journalAdminUnavailable(error);
  }
}
