import {
  buildDurableImportCommitPlan,
  importCommitErrorResponse,
  parseImportCommitRequestInput,
  readJsonRequest,
} from "../../../../../src/lib/trader-analytics/server/import-commit-service";
import { readLevelsSystemRuntimeConfigFromEnv } from "../../../../../src/lib/support-resistance/levels-system-runtime-options";
import { runPersistedDecisionReviewJobs } from "../../../../../src/lib/trader-analytics/server/saved-decision-review-service";
import { SqliteImportCommitRepository } from "../../../../../src/lib/trader-analytics/product/import-commit/sqlite-import-commit-repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ batchId: string }> },
): Promise<Response> {
  const routeParams = await context.params;
  const batchId = decodeURIComponent(routeParams.batchId);
  const repository = new SqliteImportCommitRepository();
  let plan = repository.getPreviewPlan(batchId);

  if (!plan) {
    return importCommitErrorResponse(
      404,
      "not_found",
      `Import batch ${batchId} was not found.`,
    );
  }

  let document: unknown = {};
  try {
    document = await readJsonRequest(request);
  } catch {
    document = {};
  }

  if (
    typeof document === "object" &&
    document !== null &&
    !Array.isArray(document) &&
    "csvText" in document
  ) {
    try {
      const input = parseImportCommitRequestInput(document);
      plan = buildDurableImportCommitPlan({
        input,
        repository,
        batchId,
        generatedAt: plan.generatedAt,
      });
    } catch (error) {
      return importCommitErrorResponse(
        400,
        "invalid_request",
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  if (plan.batch.id !== batchId) {
    return importCommitErrorResponse(
      400,
      "invalid_request",
      "Commit payload did not rebuild the same import batch.",
    );
  }

  const result = repository.commitImportPlan(plan);

  if (result.status === "rejected") {
    return importCommitErrorResponse(409, "commit_rejected", result.message);
  }

  let decisionReviewRun = null;

  try {
    decisionReviewRun = await runPersistedDecisionReviewJobs({
      repository,
      importBatchId: batchId,
      levelsSystem: readLevelsSystemRuntimeConfigFromEnv(),
      generatedAt: plan.generatedAt,
    });
  } catch (error) {
    decisionReviewRun = {
      contractVersion: "persisted_decision_review_run_error_v1",
      importBatchId: batchId,
      error: error instanceof Error ? error.message : String(error),
    };
  }

  return Response.json({
    contractVersion: "import_commit_api_commit_result_v1",
    result,
    decisionReviewRun,
  });
}
