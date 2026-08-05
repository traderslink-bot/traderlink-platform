import {
  resolveJournalOpaqueReference,
} from "@/src/modules/journal/server/administration/journal-opaque-reference-authority";
import { JournalSupportConsentRepository } from "@/src/modules/journal/server/administration/journal-support-consent-repository";
import {
  grantJournalAttemptSupportConsent,
  grantJournalCommittedImportSupportConsent,
  revokeJournalSupportConsent,
  type JournalSupportConsentSummary,
} from "@/src/modules/journal/server/administration/journal-support-consent-service";
import { loadJournalPrivacyHmacConfiguration } from "@/src/modules/journal/server/imports/journal-import-service";
import { requireJournalMutationRequest } from "@/src/modules/platform/server/authentication/journal-mutation-request-security";
import {
  requireExpectedJournalAccountSelection,
  requireTraderLinkPlatformRequestScope,
} from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import {
  isTraderLinkPlatformError,
  platformFailure,
} from "@/src/modules/platform/server/database/platform-migration-contract";
import { withPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeSummary(value: JournalSupportConsentSummary) {
  return Object.freeze({
    state: value.state,
    revision: value.revision,
    expiresAtUtc: value.expiresAtUtc,
    purgeState: value.purgeState,
  });
}

function resolveImportReference(
  scope: ReturnType<typeof requireTraderLinkPlatformRequestScope>,
  reference: string,
): Readonly<{ kind: "import_attempt" | "import_batch"; internalId: string }> {
  const configuration = loadJournalPrivacyHmacConfiguration();
  for (const kind of ["import_attempt", "import_batch"] as const) {
    try {
      return Object.freeze({
        kind,
        internalId: resolveJournalOpaqueReference({
          configuration,
          scope,
          kind,
          reference,
        }),
      });
    } catch (error) {
      if (!isTraderLinkPlatformError(error)) throw error;
    }
  }
  platformFailure("TRADERLINK_JOURNAL_IMPORT_CONFLICT", {
    reason: "import_reference_invalid",
  });
}

function unavailable(error: unknown): Response {
  const code = isTraderLinkPlatformError(error)
    ? error.code
    : "TRADERLINK_JOURNAL_IMPORT_CONFLICT";
  return Response.json(
    { status: "unavailable", code },
    { status: code === "TRADERLINK_WORKSPACE_ACCESS_DENIED" ? 401 : 409 },
  );
}

export async function POST(
  request: Request,
  context: { params: Promise<{ importRef: string }> },
): Promise<Response> {
  try {
    requireJournalMutationRequest(request);
    const scope = requireTraderLinkPlatformRequestScope(request.headers);
    const { importRef } = await context.params;
    const resolved = resolveImportReference(scope, importRef);
    const data = await request.formData();
    requireExpectedJournalAccountSelection(
      scope,
      data.get("expectedAccountSelectionRef"),
    );
    let consent: JournalSupportConsentSummary;
    if (resolved.kind === "import_batch") {
      consent = grantJournalCommittedImportSupportConsent(scope, {
        importBatchId: resolved.internalId,
      });
    } else {
      const file = data.get("statement");
      if (!(file instanceof File) ||
        !["", "text/csv", "text/plain", "application/csv"]
          .includes(file.type.toLowerCase()) ||
        !/\.(?:csv|tsv|txt)$/iu.test(file.name)) {
        platformFailure("TRADERLINK_JOURNAL_IMPORT_CONFLICT", {
          reason: "support_source_invalid",
        });
      }
      const sourceBytes = new Uint8Array(await file.arrayBuffer());
      if (sourceBytes.byteLength < 1 || sourceBytes.byteLength > 25 * 1024 * 1024 ||
        sourceBytes.includes(0)) {
        platformFailure("TRADERLINK_JOURNAL_IMPORT_CONFLICT", {
          reason: "support_source_invalid",
        });
      }
      consent = grantJournalAttemptSupportConsent(scope, {
        importAttemptId: resolved.internalId,
        sourceBytes,
        sourceMimeType: file.type || "text/plain",
      });
    }
    return Response.json({ status: "ready", supportConsent: safeSummary(consent) });
  } catch (error) {
    return unavailable(error);
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ importRef: string }> },
): Promise<Response> {
  try {
    requireJournalMutationRequest(request);
    const scope = requireTraderLinkPlatformRequestScope(request.headers);
    const { importRef } = await context.params;
    const resolved = resolveImportReference(scope, importRef);
    const body: unknown = await request.json();
    if (!body || Array.isArray(body) || typeof body !== "object") {
      platformFailure("TRADERLINK_JOURNAL_IMPORT_CONFLICT", {
        reason: "support_consent_request",
      });
    }
    const record = body as Record<string, unknown>;
    requireExpectedJournalAccountSelection(
      scope,
      record.expectedAccountSelectionRef,
    );
    if (!Number.isSafeInteger(record.expectedRevision) ||
      Number(record.expectedRevision) < 1) {
      platformFailure("TRADERLINK_JOURNAL_IMPORT_CONFLICT", {
        reason: "support_consent_revision",
      });
    }
    const current = withPlatformDatabase({ mode: "runtime" }, (database) => {
      const repository = new JournalSupportConsentRepository(database);
      return resolved.kind === "import_attempt"
        ? repository.findActiveForAttempt(scope, resolved.internalId)
        : repository.findActiveForImportBatch(scope, resolved.internalId);
    });
    if (!current || current.revision !== Number(record.expectedRevision)) {
      platformFailure("TRADERLINK_JOURNAL_IMPORT_CONFLICT", {
        reason: "support_consent_revision",
      });
    }
    const consent = revokeJournalSupportConsent(scope, {
      supportConsentId: current.supportConsentId,
      expectedRevision: current.revision,
    });
    return Response.json({ status: "ready", supportConsent: safeSummary(consent) });
  } catch (error) {
    return unavailable(error);
  }
}
