import {
  commitJournalGenericMappedUpload,
  commitJournalIbkrUpload,
} from "@/src/modules/journal/server/product/journal-import-product-service";
import {
  requireTraderLinkPlatformRequestScope,
  requireExpectedJournalAccountSelection,
} from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { isTraderLinkPlatformError } from "@/src/modules/platform/server/database/platform-migration-contract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  try {
    const scope = requireTraderLinkPlatformRequestScope(request.headers);
    const data = await request.formData();
    const file = data.get("statement");
    const sourceTimezone = data.get("sourceTimezone");
    const confirmedSourceFileSha256 = data.get("confirmedSourceFileSha256");
    const confirmedAccountRef = data.get("confirmedAccountRef");
    const confirmationAction = data.get("confirmationAction");
    const commitKind = data.get("commitKind");
    const mappingContractJson = data.get("mappingContract");
    const expectedAccountSelectionRef = data.get("expectedAccountSelectionRef");
    const confirmSourceIdentityLink = data.get("confirmSourceIdentityLink");
    if (
      !(file instanceof File) ||
      typeof sourceTimezone !== "string" ||
      typeof confirmedSourceFileSha256 !== "string" ||
      typeof confirmedAccountRef !== "string" ||
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
    requireExpectedJournalAccountSelection(scope, expectedAccountSelectionRef);
    const sourceBytes = new Uint8Array(await file.arrayBuffer());
    if (sourceBytes.byteLength < 1 || sourceBytes.byteLength > 25 * 1024 * 1024) {
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
      result = commitJournalGenericMappedUpload(scope, {
        sourceBytes,
        mapping: mappingContract,
        confirmedSourceFileSha256,
        confirmedAccountRef,
      });
    } else {
      result = commitJournalIbkrUpload(scope, {
        sourceBytes,
        sourceTimezone,
        confirmedSourceFileSha256,
        confirmedAccountRef,
        confirmSourceIdentityLink: confirmSourceIdentityLink === "yes",
      });
    }
    return Response.json({ status: "ready", result });
  } catch (error) {
    const code = isTraderLinkPlatformError(error)
      ? error.code
      : "TRADERLINK_JOURNAL_IMPORT_COMMIT_FAILED";
    const status = code === "TRADERLINK_WORKSPACE_ACCESS_DENIED" ? 401 : 409;
    return Response.json({ status: "unavailable", code }, { status });
  }
}
