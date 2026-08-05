import {
  previewJournalGenericMappedUpload,
  previewJournalIbkrUpload,
  previewJournalSavedGenericMappingUpload,
  type JournalImportMappingPreview,
} from "@/src/modules/journal/server/product/journal-import-product-service";
import {
  createJournalMappingSupportPackage,
  createJournalMappingSupportPackageV2,
  restoreJournalInternalMappingContractFromV2,
  sanitizeJournalInternalMappingContractForV2,
  type JournalMappingSupportPackage,
  type JournalMappingSupportPackageV2,
} from "@/src/modules/journal/server/product/journal-mapping-support-package";
import {
  beginJournalImportAttempt,
  failJournalImportAttempt,
  finishJournalImportPreview,
  type JournalImportAttemptContext,
} from "@/src/modules/journal/server/administration/journal-import-attempt-service";
import { grantJournalAttemptSupportConsent } from "@/src/modules/journal/server/administration/journal-support-consent-service";
import { issueJournalOpaqueReference } from "@/src/modules/journal/server/administration/journal-opaque-reference-authority";
import { loadJournalPrivacyHmacConfiguration } from "@/src/modules/journal/server/imports/journal-import-service";
import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { requireJournalMutationRequest } from "@/src/modules/platform/server/authentication/journal-mutation-request-security";
import { requireTraderLinkPlatformRequestScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { isTraderLinkPlatformError } from "@/src/modules/platform/server/database/platform-migration-contract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function importReference(
  scope: WorkspaceAccessScope,
  context: JournalImportAttemptContext,
): string {
  return issueJournalOpaqueReference({
    configuration: loadJournalPrivacyHmacConfiguration(),
    scope,
    kind: "import_attempt",
    internalId: context.attempt.importAttemptId,
  });
}

function optionalSupportConsent(input: Readonly<{
  requested: boolean;
  scope: WorkspaceAccessScope;
  context: JournalImportAttemptContext;
  sourceBytes: Uint8Array;
  sourceMimeType: string;
}>): Readonly<{
  status: "active" | "unavailable";
  state?: "active";
  revision?: number;
  expiresAtUtc?: string;
  purgeState?: "active";
}> | null {
  if (!input.requested) return null;
  try {
    const consent = grantJournalAttemptSupportConsent(input.scope, {
      importAttemptId: input.context.attempt.importAttemptId,
      sourceBytes: input.sourceBytes,
      sourceMimeType: input.sourceMimeType || "text/plain",
    });
    return Object.freeze({
      status: "active" as const,
      state: "active" as const,
      revision: consent.revision,
      expiresAtUtc: consent.expiresAtUtc,
      purgeState: "active" as const,
    });
  } catch {
    return Object.freeze({ status: "unavailable" as const });
  }
}

function unavailable(error: unknown): Response {
  const code = isTraderLinkPlatformError(error)
    ? error.code
    : "TRADERLINK_JOURNAL_IMPORT_PREVIEW_FAILED";
  const status = code === "TRADERLINK_WORKSPACE_ACCESS_DENIED" ? 401 : 400;
  return Response.json({ status: "unavailable", code }, { status });
}

function sanitizedMappedPreview(
  preview: JournalImportMappingPreview,
  inspection: JournalMappingSupportPackage,
  mappingSupport: JournalMappingSupportPackageV2,
): JournalImportMappingPreview {
  if (!preview.mappingContract) return preview;
  const mappingContract = sanitizeJournalInternalMappingContractForV2(
    preview.mappingContract,
    inspection,
    mappingSupport,
  ) as JournalImportMappingPreview["mappingContract"];
  if (!mappingContract) return preview;
  return Object.freeze({
    ...preview,
    mappingContract,
    mappedFields: Object.freeze(Object.entries(mappingContract.columns)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([destination, source]) => Object.freeze({
        source,
        destination: destination.replace(/([A-Z])/gu, " $1").toLowerCase(),
      }))),
  });
}

export async function POST(request: Request): Promise<Response> {
  let scope: WorkspaceAccessScope | null = null;
  let attemptContext: JournalImportAttemptContext | null = null;
  try {
    requireJournalMutationRequest(request);
    scope = requireTraderLinkPlatformRequestScope(request.headers);
    const data = await request.formData();
    const file = data.get("statement");
    const sourceTimezone = data.get("sourceTimezone");
    const brokerName = data.get("brokerName");
    const attemptIdempotencyRef = data.get("attemptIdempotencyRef");
    const supportConsentRequest = data.get("supportConsent");
    const mappingContractJson = data.get("mappingContract");
    if (
      !(file instanceof File) ||
      typeof sourceTimezone !== "string" ||
      typeof attemptIdempotencyRef !== "string" ||
      (supportConsentRequest !== "yes" && supportConsentRequest !== "no")
    ) {
      return Response.json(
        { status: "unavailable", code: "TRADERLINK_JOURNAL_IMPORT_REQUEST_INVALID" },
        { status: 400 },
      );
    }
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
    let mappingContract: unknown = null;
    if (typeof mappingContractJson === "string" && mappingContractJson.length > 0) {
      try {
        mappingContract = JSON.parse(mappingContractJson) as unknown;
      } catch {
        return Response.json(
          { status: "unavailable", code: "TRADERLINK_JOURNAL_IMPORT_REQUEST_INVALID" },
          { status: 400 },
        );
      }
    }
    attemptContext = beginJournalImportAttempt(scope, {
      sourceBytes,
      browserIdempotencyRef: attemptIdempotencyRef,
    });
    if (mappingContract !== null) {
      const inspection = createJournalMappingSupportPackage({
        sourceBytes,
        brokerName: typeof brokerName === "string" ? brokerName : "",
        failureCode: "none",
      });
      const mappingSupport = createJournalMappingSupportPackageV2(inspection);
      const preview = sanitizedMappedPreview(previewJournalGenericMappedUpload(scope, {
        sourceBytes,
        mapping: restoreJournalInternalMappingContractFromV2(
          mappingContract,
          inspection,
          mappingSupport,
        ),
        mappingOrigin: "manual_mapping",
        attemptBindingSha256: attemptContext.attemptBindingSha256,
      }), inspection, mappingSupport);
      finishJournalImportPreview(scope, {
        context: attemptContext,
        package: mappingSupport,
        preview,
        safeMappingContract: preview.mappingContract,
      });
      const supportConsent = optionalSupportConsent({
        requested: supportConsentRequest === "yes",
        scope,
        context: attemptContext,
        sourceBytes,
        sourceMimeType: file.type,
      });
      return Response.json({
        status: "ready",
        importRef: importReference(scope, attemptContext),
        preview,
        mappingSupport,
        supportConsent,
      });
    }
    try {
      const mappingSupport = createJournalMappingSupportPackageV2(
        createJournalMappingSupportPackage({
          sourceBytes,
          brokerName: typeof brokerName === "string" ? brokerName : "",
          failureCode: "none",
        }),
      );
      const preview = previewJournalIbkrUpload(scope, {
        sourceBytes,
        sourceTimezone,
        attemptBindingSha256: attemptContext.attemptBindingSha256,
      });
      finishJournalImportPreview(scope, {
        context: attemptContext,
        package: mappingSupport,
        preview,
        safeMappingContract: null,
      });
      const supportConsent = optionalSupportConsent({
        requested: supportConsentRequest === "yes",
        scope,
        context: attemptContext,
        sourceBytes,
        sourceMimeType: file.type,
      });
      return Response.json({
        status: "ready",
        importRef: importReference(scope, attemptContext),
        preview,
        mappingSupport,
        supportConsent,
      });
    } catch (error) {
      if (
        !isTraderLinkPlatformError(error) ||
        !["TRADERLINK_JOURNAL_IMPORT_PARSE_FAILED", "TRADERLINK_JOURNAL_IMPORT_MAPPING_FAILED"]
          .includes(error.code)
      ) throw error;
      const inspection = createJournalMappingSupportPackage({
        sourceBytes,
        brokerName: typeof brokerName === "string" ? brokerName : "",
        failureCode: error.code,
      });
      const mappingSupport = createJournalMappingSupportPackageV2(inspection);
      let savedPreview = null;
      try {
        savedPreview = previewJournalSavedGenericMappingUpload(scope, {
          sourceBytes,
          structuralSignatures: inspection.tables.map(
            (table) => table.structuralSignatureSha256,
          ),
          attemptBindingSha256: attemptContext.attemptBindingSha256,
        });
      } catch (savedMappingError) {
        if (
          !isTraderLinkPlatformError(savedMappingError) ||
          ![
            "TRADERLINK_JOURNAL_IMPORT_PARSE_FAILED",
            "TRADERLINK_JOURNAL_IMPORT_MAPPING_FAILED",
          ].includes(savedMappingError.code)
        ) throw savedMappingError;
      }
      if (savedPreview) {
        const browserPreview = sanitizedMappedPreview(
          savedPreview,
          inspection,
          mappingSupport,
        );
        finishJournalImportPreview(scope, {
          context: attemptContext,
          package: mappingSupport,
          preview: browserPreview,
          safeMappingContract: browserPreview.mappingContract,
        });
        const supportConsent = optionalSupportConsent({
          requested: supportConsentRequest === "yes",
          scope,
          context: attemptContext,
          sourceBytes,
          sourceMimeType: file.type,
        });
        return Response.json({
          status: "ready",
          importRef: importReference(scope, attemptContext),
          preview: browserPreview,
          mappingSupport,
          supportConsent,
        });
      }
      finishJournalImportPreview(scope, {
        context: attemptContext,
        package: mappingSupport,
        preview: null,
        safeMappingContract: null,
      });
      const supportConsent = optionalSupportConsent({
        requested: supportConsentRequest === "yes",
        scope,
        context: attemptContext,
        sourceBytes,
        sourceMimeType: file.type,
      });
      return Response.json({
        status: "mapping_required",
        importRef: importReference(scope, attemptContext),
        mappingSupport,
        supportConsent,
      }, { status: 422 });
    }
  } catch (error) {
    if (scope && attemptContext) {
      try {
        failJournalImportAttempt(scope, attemptContext, "system_failure");
      } catch {
        // Preserve the original request failure; recovery handles a stale attempt.
      }
    }
    return unavailable(error);
  }
}
