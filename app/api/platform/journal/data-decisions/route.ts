import {
  narrowWorkspaceAccessToAccount,
  type WorkspaceAccessScope,
} from "@/src/modules/platform/contracts/workspace-access-scope";
import type { JournalDataDecisionItem } from "@/src/modules/journal/contracts/journal-product-read-models";
import { JournalExecutionRepository } from "@/src/modules/journal/server/executions/journal-execution-repository";
import { withWritableJournalIntegrityRuntime } from "@/src/modules/journal/server/journal-integrity-runtime";
import { createJournalDataDecisionResolution } from "@/src/modules/journal/server/product/journal-data-decision-resolution";
import { JournalProductReadService } from "@/src/modules/journal/server/product/journal-product-read-service";
import {
  requireTraderLinkPlatformRequestScope,
  requireExpectedJournalAccountSelection,
} from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { isTraderLinkPlatformError, platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requiredString(record: JsonRecord, field: string): string {
  const value = record[field];
  if (typeof value !== "string" || value.length === 0) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field });
  }
  return value;
}

function currentDecision(
  scope: WorkspaceAccessScope,
  decisionId: string,
  revision: number,
): JournalDataDecisionItem {
  const accountId = scope.activeAccountId;
  if (!accountId) platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
  const model = withReadonlyPlatformDatabase({}, (database) =>
    new JournalProductReadService(database).listDataDecisions({
      userId: scope.userId,
      workspaceId: scope.workspaceId,
      workspaceRole: scope.workspaceRole,
      accountId,
    }));
  const item = model.pending.find((candidate) =>
    candidate.decisionId === decisionId && candidate.revision === revision);
  if (!item) platformFailure("TRADERLINK_DATA_DECISION_CONFLICT");
  return item;
}

export function GET(request: Request): Response {
  try {
    const scope = requireTraderLinkPlatformRequestScope(request.headers);
    const accountId = scope.activeAccountId;
    if (!accountId) platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
    const decisions = withReadonlyPlatformDatabase({}, (database) =>
      new JournalProductReadService(database).listDataDecisions({
        userId: scope.userId,
        workspaceId: scope.workspaceId,
        workspaceRole: scope.workspaceRole,
        accountId,
      }));
    return Response.json({ status: "ready", decisions });
  } catch {
    return Response.json({ status: "unavailable" }, { status: 503 });
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const scope = requireTraderLinkPlatformRequestScope(request.headers);
    const body: unknown = await request.json();
    if (!isRecord(body) || !Number.isSafeInteger(body.expectedRevision)) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
        field: "decisionRequest",
      });
    }
    requireExpectedJournalAccountSelection(
      scope,
      body.expectedAccountSelectionRef,
    );
    const decisionId = requiredString(body, "decisionId");
    const revision = Number(body.expectedRevision);
    const item = currentDecision(scope, decisionId, revision);
    const accountId = scope.activeAccountId;
    if (!accountId) platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
    const resolution = createJournalDataDecisionResolution(
      item,
      body,
      (executionId) => withReadonlyPlatformDatabase({}, (database) =>
        new JournalExecutionRepository(database).currentVersion(
          executionId,
          scope.workspaceId,
          accountId,
        )),
    );
    const result = withWritableJournalIntegrityRuntime(scope, (runtime) => {
      const resolved = runtime.decisions.resolve(
        narrowWorkspaceAccessToAccount(scope, accountId),
        resolution,
      );
      return Object.freeze({
        state: resolved.decision.state,
        rebuildCount: resolved.rebuildCount,
        followupDecisionCount: resolved.openedFollowupDecisionIds.length,
      });
    });
    return Response.json({ status: "ready", result });
  } catch (error) {
    const code = isTraderLinkPlatformError(error)
      ? error.code
      : "TRADERLINK_DATA_DECISION_RESOLUTION_FAILED";
    const status = code === "TRADERLINK_WORKSPACE_ACCESS_DENIED"
      ? 401
      : code === "TRADERLINK_DATA_DECISION_CONFLICT" ||
          code === "TRADERLINK_ACCOUNT_SELECTION_CONFLICT"
        ? 409
        : 400;
    return Response.json({ status: "unavailable", code }, { status });
  }
}
