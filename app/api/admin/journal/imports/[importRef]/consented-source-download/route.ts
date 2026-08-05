import { JournalConsentedSourceDownloadService } from "@/src/modules/journal/server/administration/journal-consented-source-download-service";
import { createJournalAdminReadContext, resolveJournalAdminInternalId } from "@/src/modules/journal/server/administration/journal-admin-read-helpers";
import {
  consumeJournalAdminRateLimit,
  journalAdminMutationCorrelation,
  journalAdminPrivateHeaders,
  requireJournalAdminMutationRequest,
  requireJournalAdminPermission,
} from "@/src/modules/platform/server/administration/platform-admin-request-security";
import { parseJournalAdminSensitiveAccessReason } from "@/src/modules/platform/server/administration/platform-admin-sensitive-access";
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
  context: { params: Promise<{ importRef: string }> },
): Promise<Response> {
  try {
    requireJournalAdminMutationRequest(request);
    const [body, { importRef }] = await Promise.all([request.json(), context.params]);
    if (!isRecord(body)) platformFailure("TRADERLINK_JOURNAL_ADMIN_MUTATION_INVALID");
    const reasonCode = parseJournalAdminSensitiveAccessReason(body.reasonCode);
    return withJournalAdminRequest(request, (database, scope) => {
      requireJournalAdminPermission(scope, "download_consented_sources");
      consumeJournalAdminRateLimit({
        category: "sensitive",
        headers: request.headers,
        userId: scope.userId,
      });
      const readContext = createJournalAdminReadContext({ database, scope });
      const resolved = resolveJournalAdminInternalId(
        readContext,
        importRef,
        ["import_attempt", "import_batch"],
      );
      if (resolved.kind !== "import_attempt" && resolved.kind !== "import_batch") {
        platformFailure("TRADERLINK_JOURNAL_ADMIN_ACCESS_DENIED");
      }
      const result = new JournalConsentedSourceDownloadService({ database, scope }).download({
        kind: resolved.kind,
        internalId: resolved.internalId,
        importRef,
        reasonCode,
        correlationRefSha256: journalAdminMutationCorrelation({
          requestHeaders: request.headers,
          scope,
          action: "consented_source_downloaded",
          targetKind: resolved.kind,
          internalTargetId: resolved.internalId,
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
