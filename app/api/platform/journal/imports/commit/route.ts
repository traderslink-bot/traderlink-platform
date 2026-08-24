import {
  commitJournalGenericMappedUpload,
  commitJournalIbkrUpload,
} from "@/src/modules/journal/server/product/journal-import-product-service";
import {
  requireTraderLinkPlatformRequestScope,
  requireExpectedJournalAccountSelection,
} from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { requireJournalMutationRequest } from "@/src/modules/platform/server/authentication/journal-mutation-request-security";
import { resolveJournalImportAttemptDigests } from "@/src/modules/journal/server/administration/journal-import-attempt-service";
import { failJournalImportCommitAttempt } from "@/src/modules/journal/server/administration/journal-import-attempt-service";
import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import {
  createJournalMappingSupportPackage,
  createJournalMappingSupportPackageV2,
  restoreJournalInternalMappingContractFromV2,
} from "@/src/modules/journal/server/product/journal-mapping-support-package";
import { isTraderLinkPlatformError } from "@/src/modules/platform/server/database/platform-migration-contract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  let scope: WorkspaceAccessScope | null = null;
  let attemptIdempotencyRef: string | null = null;
  try {
    requireJournalMutationRequest(request);
    scope = requireTraderLinkPlatformRequestScope(request.headers);
    const data = await request.formData();
    const file = data.get("statement");
    const sourceTimezone = data.get("sourceTimezone");
    const previewRef = data.get("previewRef");
    const rawAttemptIdempotencyRef = data.get("attemptIdempotencyRef");
    const confirmationAction = data.get("confirmationAction");
    const commitKind = data.get("commitKind");
    const mappingContractJson = data.get("mappingContract");
    const expectedAccountSelectionRef = data.get("expectedAccountSelectionRef");
    const confirmSourceIdentityLink = data.get("confirmSourceIdentityLink");
    if (
      !(file instanceof File) ||
      typeof sourceTimezone !== "string" ||
      typeof previewRef !== "string" ||
      typeof rawAttemptIdempotencyRef !== "string" ||
      typeof expectedAccountSelectionRef !== "string" ||
      (confirmSourceIdentityLink !== "yes" && confirmSourceIdentityLink !== "no") ||
      (commitKind !== "ibkr" && commitKind !== "mapped_csv") ||
      confirmationAction !== "commit_statement"
    ) {
      return Response.json(
        { status: "unavailable", code: "TRADERLINK_JOURNAL_IMPORT_REQUEST_INVALID" },
        { status: 400 },
      );
    }
    attemptIdempotencyRef = rawAttemptIdempotencyRef;
    const allowedMimeTypes = new Set([
      "",
      "text/csv",
      "text/plain",
      "application/csv",
      "text/tab-separated-values",
    ]);
    if (
      !allowedMimeTypes.has(file.type.toLowerCase()) ||
      !/\.(?:csv|tsv|txt)$/iu.test(file.name)
    ) {
      return Response.json(
        { status: "unavailable", code: "TRADERLINK_JOURNAL_IMPORT_REQUEST_INVALID" },
        { status: 415 },
      );
    }
    requireExpectedJournalAccountSelection(scope, expectedAccountSelectionRef);
    const attemptDigests = resolveJournalImportAttemptDigests(
      scope,
      attemptIdempotencyRef,
    );
    const sourceBytes = new Uint8Array(await file.arrayBuffer());
    if (
      sourceBytes.byteLength < 1 ||
      sourceBytes.byteLength > 25 * 1024 * 1024 ||
      sourceBytes.includes(0)
    ) {
      return Response.json(
        { status: "unavailable", code: "TRADERLINK_JOURNAL_IMPORT_REQUEST_INVALID" },
        { status: 413 },
      );
    }
    let result;
    if (commitKind === "mapped_csv") {
      if (typeof mappingContractJson !== "string" || mappingContractJson.length < 1) {
        return Response.json(
          { status: "unavailable", code: "TRADERLINK_JOURNAL_IMPORT_REQUEST_INVALID" },
          { status: 400 },
        );
      }
      let mappingContract: unknown;
      try {
        mappingContract = JSON.parse(mappingContractJson) as unknown;
      } catch {
        return Response.json(
          { status: "unavailable", code: "TRADERLINK_JOURNAL_IMPORT_REQUEST_INVALID" },
          { status: 400 },
        );
      }
      const mappingRecord = mappingContract && typeof mappingContract === "object" &&
        !Array.isArray(mappingContract)
        ? mappingContract as Record<string, unknown>
        : {};
      const inspection = createJournalMappingSupportPackage({
        sourceBytes,
        brokerName: typeof mappingRecord.brokerName === "string"
          ? mappingRecord.brokerName
          : "",
        failureCode: "none",
      });
      const mappingSupport = createJournalMappingSupportPackageV2(inspection);
      result = commitJournalGenericMappedUpload(scope, {
        sourceBytes,
        mapping: restoreJournalInternalMappingContractFromV2(
          mappingContract,
          inspection,
          mappingSupport,
        ),
        previewRef,
        attemptBindingSha256: attemptDigests.requestIdempotencySha256,
        attemptCorrelationSha256: attemptDigests.correlationRefSha256,
      });
    } else {
      result = commitJournalIbkrUpload(scope, {
        sourceBytes,
        sourceTimezone,
        previewRef,
        attemptBindingSha256: attemptDigests.requestIdempotencySha256,
        attemptCorrelationSha256: attemptDigests.correlationRefSha256,
        confirmSourceIdentityLink: confirmSourceIdentityLink === "yes",
      });
    }
    return Response.json({ status: "ready", result });
  } catch (error) {
    if (scope && attemptIdempotencyRef) {
      try {
        failJournalImportCommitAttempt(scope, attemptIdempotencyRef, "commit_failure");
      } catch {
        // Preserve the original import response if terminal-failure recording is unavailable.
      }
    }
    const code = isTraderLinkPlatformError(error)
      ? error.code
      : "TRADERLINK_JOURNAL_IMPORT_COMMIT_FAILED";
    const status = code === "TRADERLINK_WORKSPACE_ACCESS_DENIED" ? 401 : 409;
    return Response.json({ status: "unavailable", code }, { status });
  }
}
