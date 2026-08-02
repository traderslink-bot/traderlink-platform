import {
  previewJournalGenericMappedUpload,
  previewJournalIbkrUpload,
  previewJournalSavedGenericMappingUpload,
} from "@/src/modules/journal/server/product/journal-import-product-service";
import { createJournalMappingSupportPackage } from "@/src/modules/journal/server/product/journal-mapping-support-package";
import { requireTraderLinkPlatformRequestScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { isTraderLinkPlatformError } from "@/src/modules/platform/server/database/platform-migration-contract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function unavailable(error: unknown): Response {
  const code = isTraderLinkPlatformError(error)
    ? error.code
    : "TRADERLINK_JOURNAL_IMPORT_PREVIEW_FAILED";
  const status = code === "TRADERLINK_WORKSPACE_ACCESS_DENIED" ? 401 : 400;
  return Response.json({ status: "unavailable", code }, { status });
}

export async function POST(request: Request): Promise<Response> {
  try {
    const scope = requireTraderLinkPlatformRequestScope(request.headers);
    const data = await request.formData();
    const file = data.get("statement");
    const sourceTimezone = data.get("sourceTimezone");
    const brokerName = data.get("brokerName");
    const mappingContractJson = data.get("mappingContract");
    if (!(file instanceof File) || typeof sourceTimezone !== "string") {
      return Response.json(
        { status: "unavailable", code: "TRADERLINK_JOURNAL_IMPORT_REQUEST_INVALID" },
        { status: 400 },
      );
    }
    const sourceBytes = new Uint8Array(await file.arrayBuffer());
    if (sourceBytes.byteLength < 1 || sourceBytes.byteLength > 25 * 1024 * 1024) {
      return Response.json(
        { status: "unavailable", code: "TRADERLINK_JOURNAL_IMPORT_REQUEST_INVALID" },
        { status: 413 },
      );
    }
    if (typeof mappingContractJson === "string" && mappingContractJson.length > 0) {
      let mappingContract: unknown;
      try {
        mappingContract = JSON.parse(mappingContractJson) as unknown;
      } catch {
        return Response.json(
          { status: "unavailable", code: "TRADERLINK_JOURNAL_IMPORT_REQUEST_INVALID" },
          { status: 400 },
        );
      }
      const mappingSupport = createJournalMappingSupportPackage({
        sourceBytes,
        brokerName: typeof brokerName === "string" ? brokerName : "",
        failureCode: "none",
      });
      return Response.json({
        status: "ready",
        preview: previewJournalGenericMappedUpload(scope, {
          sourceBytes,
          mapping: mappingContract,
          mappingOrigin: "manual_mapping",
        }),
        mappingSupport,
      });
    }
    try {
      const mappingSupport = createJournalMappingSupportPackage({
        sourceBytes,
        brokerName: typeof brokerName === "string" ? brokerName : "",
        failureCode: "none",
      });
      return Response.json({
        status: "ready",
        preview: previewJournalIbkrUpload(scope, { sourceBytes, sourceTimezone }),
        mappingSupport,
      });
    } catch (error) {
      if (
        !isTraderLinkPlatformError(error) ||
        !["TRADERLINK_JOURNAL_IMPORT_PARSE_FAILED", "TRADERLINK_JOURNAL_IMPORT_MAPPING_FAILED"]
          .includes(error.code)
      ) throw error;
      const mappingSupport = createJournalMappingSupportPackage({
        sourceBytes,
        brokerName: typeof brokerName === "string" ? brokerName : "",
        failureCode: error.code,
      });
      let savedPreview = null;
      try {
        savedPreview = previewJournalSavedGenericMappingUpload(scope, {
          sourceBytes,
          structuralSignatures: mappingSupport.tables.map(
            (table) => table.structuralSignatureSha256,
          ),
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
        return Response.json({
          status: "ready",
          preview: savedPreview,
          mappingSupport,
        });
      }
      return Response.json({
        status: "mapping_required",
        mappingSupport,
      }, { status: 422 });
    }
  } catch (error) {
    return unavailable(error);
  }
}
