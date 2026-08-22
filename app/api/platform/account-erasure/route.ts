import { NextResponse, type NextRequest } from "next/server";

import { deriveJournalAccountSelectionRef } from "@/src/modules/platform/contracts/journal-account-selection";
import {
  deletePlatformAuthCookie,
} from "@/src/modules/platform/server/authentication/platform-auth-cookies";
import { LEGACY_ACADEMY_SESSION_COOKIE } from "@/src/modules/platform/server/authentication/platform-discord-oauth-cookies";
import {
  requireExpectedJournalAccountSelection,
  requireTraderLinkPlatformRequestIdentity,
} from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import {
  TRADERLINK_JOURNAL_ACCOUNT_SELECTION_COOKIE,
  serializeJournalAccountSelectionCookie,
} from "@/src/modules/platform/server/authentication/journal-account-selection-cookie";
import { TRADERLINK_PLATFORM_SESSION_COOKIE } from "@/src/modules/platform/server/authentication/platform-session-service";
import { requireJournalMutationRequest } from "@/src/modules/platform/server/authentication/journal-mutation-request-security";
import { resolvePlatformDatabaseConfig } from "@/src/modules/platform/server/database/platform-database-config";
import {
  createCanonicalUtcTimestamp,
  isTraderLinkPlatformError,
  platformFailure,
} from "@/src/modules/platform/server/database/platform-migration-contract";
import { openPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import {
  PlatformErasureService,
  type PlatformErasureArtifact,
} from "@/src/modules/platform/server/privacy/platform-erasure-service";
import {
  purgeJournalEvidenceObject,
  resolveJournalEvidenceVaultBoundary,
  type JournalEvidenceNamespace,
} from "@/src/modules/journal/server/imports/journal-evidence-vault";
import {
  purgeJournalSupportSource,
  resolveJournalSupportSourceVault,
} from "@/src/modules/journal/server/administration/journal-support-source-vault";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DELETE_TRADE_TRACKER_ACCOUNT = "DELETE ACCOUNT";
const DELETE_TRADERLINK_ACCOUNT = "DELETE MY TRADERLINK ACCOUNT";

type ErasureAction = "trade_tracker_account" | "traderlink_account";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requiredAction(value: Record<string, unknown>): ErasureAction {
  const action = value.action;
  if (action === "trade_tracker_account" || action === "traderlink_account") return action;
  platformFailure("TRADERLINK_ACCOUNT_ERASURE_CONFIRMATION_INVALID");
}

function requireConfirmation(
  body: Record<string, unknown>,
  expected: string,
): void {
  if (body.confirmation !== expected) {
    platformFailure("TRADERLINK_ACCOUNT_ERASURE_CONFIRMATION_INVALID");
  }
}

function namespaceForEvidenceObject(key: string): JournalEvidenceNamespace {
  const match = /^(ibkr|mapped_csv)\/[0-9a-f]{64}\.csv$/u.exec(key);
  if (!match?.[1]) platformFailure("TRADERLINK_JOURNAL_EVIDENCE_VAULT_CONFLICT");
  return match[1] as JournalEvidenceNamespace;
}

function purgePrivateArtifacts(
  databasePath: string,
  artifacts: readonly PlatformErasureArtifact[],
): void {
  const primary = artifacts.filter((artifact) => artifact.kind === "primary_evidence");
  if (primary.length > 0) {
    const vault = resolveJournalEvidenceVaultBoundary({
      databasePath,
      sourcePath: databasePath,
    });
    for (const artifact of primary) {
      purgeJournalEvidenceObject(vault, {
        evidenceNamespace: namespaceForEvidenceObject(artifact.evidenceObjectKey),
        evidenceObjectKey: artifact.evidenceObjectKey,
        sourceFileSha256: artifact.sourceFileSha256,
        sourceFileSizeBytes: artifact.sourceFileSizeBytes,
      });
    }
  }
  const support = artifacts.filter((artifact) => artifact.kind === "support_source");
  if (support.length > 0) {
    const vault = resolveJournalSupportSourceVault({ databasePath });
    const purgedAtUtc = createCanonicalUtcTimestamp(new Date());
    for (const artifact of support) {
      purgeJournalSupportSource({
        vault,
        objectKey: artifact.objectKey,
        expectedSha256: artifact.sourceFileSha256,
        expectedSizeBytes: artifact.sourceFileSizeBytes,
        purgedAtUtc,
      });
    }
  }
}

function unavailableResponse(error: unknown): NextResponse {
  const code = isTraderLinkPlatformError(error)
    ? error.code
    : "TRADERLINK_ACCOUNT_ERASURE_FAILED";
  console.error("[account-erasure] request failed", {
    code,
    error: error instanceof Error
      ? { message: error.message, name: error.name, stack: error.stack }
      : { name: typeof error },
  });
  const status = code === "TRADERLINK_ACCOUNT_ERASURE_CONFIRMATION_INVALID"
    ? 400
    : code === "TRADERLINK_ACCOUNT_SELECTION_CONFLICT" || code === "TRADERLINK_ACCOUNT_NOT_FOUND"
      ? 409
      : code === "TRADERLINK_ACCOUNT_ERASURE_FAILED"
        ? 500
        : 403;
  return NextResponse.json({ status: "unavailable", code }, {
    status,
    headers: { "cache-control": "no-store" },
  });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    requireJournalMutationRequest(request);
    const identity = requireTraderLinkPlatformRequestIdentity(request.headers);
    const body: unknown = await request.json();
    if (!isRecord(body)) platformFailure("TRADERLINK_ACCOUNT_ERASURE_CONFIRMATION_INVALID");
    const action = requiredAction(body);
    const databasePath = resolvePlatformDatabaseConfig({}).databasePath;
    const database = openPlatformDatabase({ databasePath, mode: "runtime" });
    try {
      const service = new PlatformErasureService(database);
      const purge = (artifacts: readonly PlatformErasureArtifact[]) =>
        purgePrivateArtifacts(databasePath, artifacts);
      if (action === "trade_tracker_account") {
        requireConfirmation(body, DELETE_TRADE_TRACKER_ACCOUNT);
        requireExpectedJournalAccountSelection(identity.scope, body.expectedAccountSelectionRef);
        const accountId = identity.scope.activeAccountId;
        if (!accountId) platformFailure("TRADERLINK_ACCOUNT_SELECTION_CONFLICT");
        service.eraseTradeTrackerAccount({
          accountId,
          userId: identity.scope.userId,
          workspaceId: identity.scope.workspaceId,
          workspaceRole: identity.scope.workspaceRole,
        }, { purgePrivateArtifacts: purge });
        const nextAccountId = identity.scope.allowedAccountIds
          .filter((candidate) => candidate !== accountId)
          .sort((left, right) => left.localeCompare(right, "en"))[0] ?? null;
        const response = NextResponse.json({ status: "deleted", action }, {
          headers: { "cache-control": "no-store" },
        });
        if (nextAccountId) {
          response.headers.set("set-cookie", serializeJournalAccountSelectionCookie(
            deriveJournalAccountSelectionRef(identity.scope.workspaceId, nextAccountId),
          ));
        } else {
          deletePlatformAuthCookie(response, request, TRADERLINK_JOURNAL_ACCOUNT_SELECTION_COOKIE);
        }
        return response;
      }
      requireConfirmation(body, DELETE_TRADERLINK_ACCOUNT);
      service.eraseTraderLinkAccount(identity.scope, { purgePrivateArtifacts: purge });
      const response = NextResponse.json({ status: "deleted", action }, {
        headers: { "cache-control": "no-store" },
      });
      deletePlatformAuthCookie(response, request, TRADERLINK_PLATFORM_SESSION_COOKIE);
      deletePlatformAuthCookie(response, request, LEGACY_ACADEMY_SESSION_COOKIE);
      deletePlatformAuthCookie(response, request, TRADERLINK_JOURNAL_ACCOUNT_SELECTION_COOKIE);
      return response;
    } finally {
      database.close();
    }
  } catch (error) {
    return unavailableResponse(error);
  }
}
